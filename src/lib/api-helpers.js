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

export function normalizeEmail(value) {
  if (!value || typeof value !== "string") return null;
  const email = value.trim().toLowerCase();
  return email && email.length <= 254 && email.includes("@") ? email : null;
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

function isMissingEmailColumn(error) {
  if (!error) return false;
  if (error.code === "42703" || error.code === "PGRST204") return true;
  return /column[\s\S]*email[\s\S]*does not exist/i.test(error.message || "");
}

export async function insertGuests(supabase, rows, { select = "id", single = false } = {}) {
  const run = (payload) => {
    let query = supabase.from("guests").insert(payload).select(select);
    if (single) query = query.single();
    return query;
  };

  let result = await run(rows);
  // Kolom email belum ada di database (email_migration.sql belum dijalankan)
  if (result.error && isMissingEmailColumn(result.error)) {
    result = await run(rows.map(({ email, ...rest }) => rest));
  }
  return result;
}

export async function findDuplicateGuest(supabase, { acara_id, no_hp = null, email = null, excludeId = null }) {
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
  if (email) {
    const { data } = await supabase
      .from("guests")
      .select("id, nama")
      .eq("acara_id", acara_id)
      .eq("email", email)
      .limit(1);
    if (data && data.length > 0 && (!excludeId || data[0].id !== excludeId)) return data[0];
  }
  return null;
}
