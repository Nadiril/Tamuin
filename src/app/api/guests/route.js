import { NextResponse } from "next/server";
import { generateToken } from "@/lib/token";
import { sanitize, requireRole, findDuplicateGuest, insertGuests } from "@/lib/api-helpers";

export async function GET(request) {
  const { supabase, response } = await requireRole(["admin", "panitia"]);
  if (response) return response;

  const { searchParams } = new URL(request.url);
  const acara_id = searchParams.get("acara_id");

  let query = supabase.from("guests").select("*").order("id", { ascending: false });
  if (acara_id) query = query.eq("acara_id", parseInt(acara_id));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: "Gagal memuat data tamu" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { supabase, response } = await requireRole(["admin", "panitia"]);
  if (response) return response;

  try {
    const body = await request.json();
    const nama = sanitize(body.nama) || "—";
    const instansi = sanitize(body.instansi);
    const kategori_tamu = body.kategori_tamu || "reguler";
    const no_hp = body.no_hp ? sanitize(body.no_hp).slice(0, 20) : null;
    if (!["reguler", "vip", "vvip"].includes(kategori_tamu)) {
      return NextResponse.json({ error: "Kategori tamu tidak valid" }, { status: 400 });
    }
    if (!body.acara_id || isNaN(Number(body.acara_id))) {
      return NextResponse.json({ error: "Acara tidak valid" }, { status: 400 });
    }
    const alamat = sanitize(body.alamat);
    if (!alamat) {
      return NextResponse.json({ error: "Alamat wajib diisi" }, { status: 400 });
    }

    const acara_id = Number(body.acara_id);
    const duplicate = await findDuplicateGuest(supabase, { acara_id, no_hp });
    if (duplicate) {
      return NextResponse.json(
        { error: `Tamu dengan nomor HP yang sama sudah terdaftar di acara ini (${duplicate.nama})` },
        { status: 409 },
      );
    }

    const isVip = kategori_tamu !== "reguler";
    const nama_mahasiswa = isVip
      ? "-"
      : sanitize(body.nama_mahasiswa) || nama;

    const guest = {
      nama,
      instansi: instansi || null,
      no_hp,
      tujuan: body.tujuan ? sanitize(body.tujuan) : null,
      nama_mahasiswa,
      alamat,
      kategori_tamu,
      status_kehadiran: "tidak_hadir",
      acara_id,
      qr_token: generateToken(),
    };

    const { data, error } = await insertGuests(supabase, [guest], { select: "*", single: true });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Tamu dengan nomor HP yang sama sudah terdaftar di acara ini" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "Gagal menambahkan tamu" }, { status: 500 });
    }
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
