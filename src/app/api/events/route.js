import { NextResponse } from "next/server";
import { sanitize, requireRole } from "@/lib/api-helpers";

export const dynamic = "force-dynamic";

export async function GET() {
  const { supabase, response } = await requireRole(["admin", "panitia"]);
  if (response) return response;

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: "Gagal memuat data acara" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { supabase, user, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const body = await request.json();
    if (!body.nama_acara || !body.lokasi || !body.tanggal_mulai || !body.jam_mulai) {
      return NextResponse.json({ error: "Nama acara, lokasi, tanggal mulai, dan jam mulai wajib diisi" }, { status: 400 });
    }

    const slug = (body.nama_acara || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    // Assign event to the active period (deterministic auto-fill, max 4 per period):
    // join the latest period if it still has room, otherwise start a new period.
    const periode_id = await resolvePeriodId(supabase);

    const record = {
      nama_acara: sanitize(body.nama_acara),
      lokasi: sanitize(body.lokasi),
      tanggal_mulai: body.tanggal_mulai,
      tanggal_selesai: body.tanggal_selesai || body.tanggal_mulai,
      jam_mulai: body.jam_mulai,
      jam_selesai: body.jam_selesai || "17:00",
      grace_period_minutes: body.grace_period_minutes !== undefined ? Number(body.grace_period_minutes) : 30,
      status: body.status || "akan_datang",
      slug,
      created_by: user.id,
      periode_id,
    };

    const { data, error } = await supabase
      .from("events")
      .insert([record])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        const detail = `${error.message} ${error.details || ""}`.toLowerCase();
        if (detail.includes("single_active")) {
          return NextResponse.json(
            { error: "Hanya satu acara yang bisa berstatus registrasi_dibuka dalam satu waktu." },
            { status: 409 },
          );
        }
        return NextResponse.json(
          { error: "Nama acara sudah dipakai. Gunakan nama yang berbeda." },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "Gagal membuat acara" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}

const MAX_EVENTS_PER_PERIODE = 4;

/**
 * Determines the active period for a newly created event.
 * Joins the latest period while it has fewer than MAX_EVENTS_PER_PERIODE events;
 * otherwise (or if no period exists yet) creates and returns a new period.
 * Deterministic and free of date heuristics.
 */
async function resolvePeriodId(supabase) {
  const { data: latest, error: latestError } = await supabase
    .from("periodes")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(1);

  if (latestError) throw latestError;

  if (latest && latest.length > 0) {
    const { count, error: countError } = await supabase
      .from("events")
      .select("id", { count: "exact", head: true })
      .eq("periode_id", latest[0].id);

    if (countError) throw countError;
    if (count < MAX_EVENTS_PER_PERIODE) return latest[0].id;
  }

  const { data: created, error: createError } = await supabase
    .from("periodes")
    .insert([{}])
    .select("id")
    .single();

  if (createError) throw createError;
  return created.id;
}
