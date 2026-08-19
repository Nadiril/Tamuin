import { createServiceClient } from "@/lib/supabase/server";
import { computeAttendanceStatus } from "@/lib/event-status";
import { NextResponse } from "next/server";
import { generateToken } from "@/lib/token";
import { sanitize, validate } from "@/lib/api-helpers";

export async function POST(request) {
  try {
    const body = await request.json();
    const { acara_id } = body;
    const nama = sanitize(body.nama);
    const instansi = sanitize(body.instansi);
    const tujuan = body.tujuan ? sanitize(body.tujuan) : null;
    const no_hp = body.no_hp ? sanitize(body.no_hp).slice(0, 20) : null;
    const alamat = sanitize(body.alamat);

    const err = validate(nama, "Nama") || validate(alamat, "Alamat");
    if (err) return NextResponse.json({ error: err }, { status: 400 });

    if (!acara_id || isNaN(Number(acara_id))) {
      return NextResponse.json({ error: "Acara tidak valid" }, { status: 400 });
    }

    const supabase = await createServiceClient();

    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, nama_acara, tanggal_mulai, tanggal_selesai, jam_mulai, jam_selesai, grace_period_minutes, status")
      .eq("id", Number(acara_id))
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Registrasi tidak dapat diproses" }, { status: 404 });
    }

    if (event.status !== "registrasi_dibuka") {
      return NextResponse.json({ error: "Registrasi untuk acara ini sudah ditutup" }, { status: 400 });
    }

    const now = new Date();
    const status_kehadiran = computeAttendanceStatus(event, now);
    if (!status_kehadiran) {
      return NextResponse.json({ error: "Acara sudah selesai" }, { status: 400 });
    }

    const acaraId = Number(acara_id);
    const fields = ["id", "nama", "instansi", "status_kehadiran", "waktu_kedatangan"];

    // Cegah duplikat: HP/email cocok = orang yang sama → balas data lama (idempoten)
    let existing = null;
    if (no_hp) {
      const { data: dup } = await supabase
        .from("guests")
        .select(fields.join(", "))
        .eq("acara_id", acaraId)
        .eq("no_hp", no_hp)
        .limit(1);
      existing = dup && dup.length > 0 ? dup[0] : null;
    }
    // Tanpa HP/email, gunakan nama sebagai petunjuk untuk mencegah submit ganda
    if (!existing) {
      const namePattern = nama.replace(/[\\%_]/g, (m) => "\\" + m);
      const { data: dup } = await supabase
        .from("guests")
        .select(fields.join(", "))
        .eq("acara_id", acaraId)
        .ilike("nama", namePattern)
        .limit(1);
      existing = dup && dup.length > 0 ? dup[0] : null;
    }
    if (existing) {
      return NextResponse.json({ ...existing, already_registered: true }, { status: 200 });
    }

    const guest = {
      nama,
      instansi: instansi || null,
      tujuan,
      no_hp,
      nama_mahasiswa: nama,
      alamat,
      kategori_tamu: "reguler",
      status_kehadiran,
      waktu_kedatangan: now.toISOString(),
      acara_id: acaraId,
      qr_token: generateToken(),
    };

    const { data, error } = await supabase.from("guests").insert([guest]).select(fields.join(", ")).single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "Anda sudah terdaftar di acara ini" }, { status: 409 });
      }
      return NextResponse.json({ error: "Gagal mendaftarkan tamu" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
