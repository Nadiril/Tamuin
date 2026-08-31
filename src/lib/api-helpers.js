import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export function sanitize(value) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/<[^>]*>/g, "").slice(0, 500);
}

export function sanitizeCSV(value) {
  if (typeof value !== "string") return "";
  let v = value.trim();
  for (const char of ["=", "+", "-", "@"]) {
    if (v.startsWith(char)) {
      v = "'" + v;
      break;
    }
  }
  return v.replace(/<[^>]*>/g, "").slice(0, 500);
}

export function validate(field, label, maxLength = 200) {
  if (!field || typeof field !== "string" || !field.trim()) {
    return `${label} wajib diisi`;
  }
  if (field.trim().length > maxLength) {
    return `${label} maksimal ${maxLength} karakter`;
  }
  return null;
}

export function getClientIp(request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "unknown";
}

export function createRateLimiter({
  windowMs = 60000,
  max = 30,
  message = "Terlalu banyak permintaan. Coba lagi nanti.",
} = {}) {
  const hits = new Map();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [ip, entry] of hits) {
      if (now - entry.start > windowMs * 2) hits.delete(ip);
    }
  }, windowMs * 2);
  if (cleanup.unref) cleanup.unref();

  return (request) => {
    const ip = getClientIp(request);
    const now = Date.now();
    const entry = hits.get(ip);
    if (!entry || now - entry.start > windowMs) {
      hits.set(ip, { start: now, count: 1 });
      return null;
    }
    entry.count++;
    if (entry.count > max) {
      return NextResponse.json({ error: message }, { status: 429 });
    }
    return null;
  };
}

export async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { supabase, user };
}

export async function requireRole(roles = ["admin", "panitia"]) {
  const { supabase, user, response } = await requireUser();
  if (response) return { response };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (!profile || !roles.includes(profile.role)) {
    return {
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }
  return { supabase, user, profile };
}

export async function insertGuests(supabase, rows, { select = "id", single = false } = {}) {
  let query = supabase.from("guests").insert(rows).select(select);
  if (single) query = query.single();
  return query;
}

export async function findDuplicateGuest(supabase, { acara_id, no_hp = null, excludeId = null }) {
  if (!acara_id) return null;
  if (no_hp) {
    const { data } = await supabase
      .from("guests")
      .select("id, nama")
      .eq("acara_id", acara_id)
      .eq("no_hp", no_hp)
      .limit(1);
    if (data && data.length > 0 && (!excludeId || data[0].id !== excludeId)) return data[0];
  }
  return null;
}

/**
 * Builds a DB-unique slug for an event. `events.slug` has a UNIQUE
 * constraint, so when a base slug is taken it appends -2, -3, ... until a
 * free one is found. `excludeId` lets edits keep their own slug.
 */
export async function makeUniqueSlug(supabase, baseSlug, { excludeId = null } = {}) {
  const clean = (baseSlug || "").trim().replace(/(^-|-$)/g, "").slice(0, 100);
  const base = clean || `acara-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  for (;;) {
    let query = supabase.from("events").select("slug").eq("slug", candidate).limit(1);
    if (excludeId) query = query.neq("id", excludeId);
    const { data } = await query;
    if (!data || data.length === 0) return candidate;
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
}

// ---------------------------------------------------------------------
// Idempotency helpers
// ---------------------------------------------------------------------

/**
 * Extract the idempotency key from the request header.
 * Returns null if no key is present (allows non-idempotent fallback).
 */
export function getIdempotencyKey(request) {
  return request.headers.get("x-idempotency-key") || null;
}

/**
 * Common error mapping from RPC exceptions to HTTP responses.
 * Returns a NextResponse if the error is known, null otherwise.
 */
export function mapRpcError(error) {
  const msg = error?.message || "";
  if (msg.includes("REQUEST_IN_PROGRESS")) {
    return NextResponse.json(
      { error: "Request sedang diproses. Jika operasi ini penting, silakan periksa data terlebih dahulu." },
      { status: 409 },
    );
  }
  if (msg.includes("GUEST_NOT_FOUND")) {
    return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
  }
  if (msg.includes("ALREADY_NOT_PRESENT")) {
    return NextResponse.json({ error: "Tamu sudah berstatus tidak hadir" }, { status: 400 });
  }
  if (msg.includes("23505")) {
    return NextResponse.json(
      { error: "Data duplikat ditemukan" },
      { status: 409 },
    );
  }
  return null;
}
