import { createPublicClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/api-helpers";

const scanRateLimit = createRateLimiter({ max: 30 });

export async function GET(request, { params }) {
  const { token } = await params;
  const rateLimitResponse = scanRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = await createPublicClient();
  const { data, error } = await supabase
    .from("guests")
    .select("id, nama, nama_mahasiswa, alamat, instansi, kategori_tamu, status_kehadiran, waktu_kedatangan, events!inner(id, nama_acara, lokasi, tanggal_mulai, jam_mulai, jam_selesai, grace_period_minutes, status)")
    .eq("qr_token", token)
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "QR Code tidak dikenali" }, { status: 404 });
  }

  return NextResponse.json({ guest: data });
}

export async function POST(request, { params }) {
  const { token } = await params;
  const rateLimitResponse = scanRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const supabase = await createPublicClient();
  const { data, error } = await supabase.rpc("public_register_guest_scan", {
    p_qr_token: token,
  });

  if (error) {
    console.error("[public-scan] RPC error:", error);
    return NextResponse.json({ error: "Gagal memproses scan" }, { status: 500 });
  }

  if (!data.success) {
    const statusMap = {
      invalid_qr: 404,
      event_not_found: 404,
      registration_not_open: 400,
      event_ended: 400,
      already_registered: 409,
    };
    return NextResponse.json(
      { error: data.message, code: data.error_code },
      { status: statusMap[data.error_code] || 400 },
    );
  }

  return NextResponse.json({
    success: true,
    status: data.status_kehadiran,
    guest: data.guest,
  });
}
