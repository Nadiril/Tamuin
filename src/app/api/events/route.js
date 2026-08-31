import { NextResponse } from "next/server";
import { sanitize, requireRole, makeUniqueSlug, getIdempotencyKey, mapRpcError } from "@/lib/api-helpers";

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

  const idempotencyKey = getIdempotencyKey(request);

  try {
    const body = await request.json();
    if (!body.nama_acara || !body.lokasi || !body.tanggal_mulai || !body.jam_mulai) {
      return NextResponse.json({ error: "Nama acara, lokasi, tanggal mulai, dan jam mulai wajib diisi" }, { status: 400 });
    }

    const baseSlug = (body.nama_acara || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    const slug = await makeUniqueSlug(supabase, baseSlug);

    const eventData = {
      nama_acara: sanitize(body.nama_acara),
      lokasi: sanitize(body.lokasi),
      tanggal_mulai: body.tanggal_mulai,
      tanggal_selesai: body.tanggal_selesai || body.tanggal_mulai,
      jam_mulai: body.jam_mulai,
      jam_selesai: body.jam_selesai || "17:00",
      grace_period_minutes: body.grace_period_minutes !== undefined ? Number(body.grace_period_minutes) : 30,
      status: body.status || "akan_datang",
      slug,
    };

    const { data, error } = await supabase.rpc("idempotent_event", {
      p_key: idempotencyKey,
      p_user_id: user.id,
      p_operation: "create",
      p_data: eventData,
    });

    if (error) {
      const rpcResponse = mapRpcError(error);
      if (rpcResponse) return rpcResponse;
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
