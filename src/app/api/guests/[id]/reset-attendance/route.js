import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";

//
// POST /api/guests/[id]/reset-attendance — admin only
//
// Mengembalikan tamu ke kondisi awal "belum hadir":
//   - status_kehadiran -> 'tidak_hadir'
//   - waktu_kedatangan -> null (wajib agar sesuai constraint guests_arrival_consistency)
//   - scanned_by       -> null
//
// Setelah reset, QR tamu dapat digunakan kembali untuk scan/registrasi ulang.
// Record tamu yang sama diperbarui (bukan membuat record attendance baru),
// sehingga tidak ada duplicate attendance.
//

export async function POST(request, { params }) {
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const { id } = await params;
    const guestId = Number(id);
    if (!Number.isInteger(guestId)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { data: guest, error: fetchError } = await supabase
      .from("guests")
      .select("id, nama, status_kehadiran, acara_id")
      .eq("id", guestId)
      .single();

    if (fetchError || !guest) {
      return NextResponse.json({ error: "Tamu tidak ditemukan" }, { status: 404 });
    }

    if (guest.status_kehadiran === "tidak_hadir") {
      return NextResponse.json({ error: "Tamu sudah berstatus tidak hadir" }, { status: 400 });
    }

    const { data: updated, error } = await supabase
      .from("guests")
      .update({
        status_kehadiran: "tidak_hadir",
        waktu_kedatangan: null,
        scanned_by: null,
      })
      .eq("id", guestId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: "Gagal mengoreksi status kehadiran" }, { status: 500 });
    }

    return NextResponse.json({ success: true, guest: updated }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}