import { NextResponse } from "next/server";
import { generateToken } from "@/lib/token";
import { sanitizeCSV, requireRole, insertGuests } from "@/lib/api-helpers";

const VALID_KATEGORI = ["reguler", "vip", "vvip"];

function normalizeRow(g) {
  const kategori = String(g.kategori_tamu || "reguler").toLowerCase();
  const acaraId = Number(g.acara_id);
  const validKategori = VALID_KATEGORI.includes(kategori) ? kategori : "reguler";
  const isVip = validKategori !== "reguler";
  const no_hp = g.no_hp ? sanitizeCSV(g.no_hp).slice(0, 20) || null : null;
  return {
    nama: sanitizeCSV(g.nama) || "Tamu",
    instansi: sanitizeCSV(g.instansi) || null,
    no_hp,
    tujuan: g.tujuan ? sanitizeCSV(g.tujuan) : null,
    nama_mahasiswa: isVip ? "-" : sanitizeCSV(g.nama_mahasiswa) || sanitizeCSV(g.nama) || "Tamu",
    alamat: sanitizeCSV(g.alamat),
    kategori_tamu: validKategori,
    status_kehadiran: "tidak_hadir",
    acara_id: Number.isFinite(acaraId) ? acaraId : null,
    qr_token: generateToken(),
  };
}

export async function POST(request) {
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const { guests: guestData } = await request.json();

    if (!Array.isArray(guestData) || guestData.length === 0) {
      return NextResponse.json({ error: "Data tamu tidak valid" }, { status: 400 });
    }

    const guests = guestData.map(normalizeRow);

    if (guests.some((g) => !Number.isInteger(g.acara_id))) {
      return NextResponse.json({ error: "Data acara (acara_id) tidak valid" }, { status: 400 });
    }

    // Dedup: skip tamu yang no_hp-nya sudah terdaftar di acara yang sama
    // (dalam database maupun dalam file CSV itu sendiri)
    const acaraIds = [...new Set(guests.map((g) => g.acara_id))];
    const { data: existing } = await supabase
      .from("guests")
      .select("acara_id, no_hp")
      .in("acara_id", acaraIds);

    const taken = new Set();
    for (const g of existing || []) {
      if (g.no_hp) taken.add(`${g.acara_id}|hp:${g.no_hp}`);
    }

    const toInsert = [];
    let skipped = 0;
    for (const g of guests) {
      const hpKey = g.no_hp ? `${g.acara_id}|hp:${g.no_hp}` : null;
      if (hpKey && taken.has(hpKey)) {
        skipped++;
        continue;
      }
      if (hpKey) taken.add(hpKey);
      toInsert.push(g);
    }

    if (toInsert.length === 0) {
      return NextResponse.json({ count: 0, skipped }, { status: 200 });
    }

    const { data, error } = await insertGuests(supabase, toInsert);

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Terdapat nomor HP yang sudah terdaftar di acara yang sama. Data duplikat dilewati." },
          { status: 409 },
        );
      }
      return NextResponse.json(
        { error: `Gagal mengimpor tamu: ${error.message}` },
        { status: 500 },
      );
    }
    return NextResponse.json({ count: data.length, skipped }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}