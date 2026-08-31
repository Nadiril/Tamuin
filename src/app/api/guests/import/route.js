import { NextResponse } from "next/server";
import { generateToken } from "@/lib/token";
import { sanitizeCSV, requireRole, insertGuests, getIdempotencyKey, mapRpcError } from "@/lib/api-helpers";

const VALID_KATEGORI = ["reguler", "vip", "vvip"];

function normalizeRow(g) {
  const kategori = String(g.kategori_tamu || "reguler").toLowerCase();
  const acaraId = Number(g.acara_id);
  const validKategori = VALID_KATEGORI.includes(kategori) ? kategori : "reguler";
  const isVip = validKategori !== "reguler";
  const no_hp = g.no_hp ? sanitizeCSV(g.no_hp).slice(0, 20) || null : null;
  return {
    nama: sanitizeCSV(g.nama) || "—",
    instansi: sanitizeCSV(g.instansi) || null,
    no_hp,
    tujuan: g.tujuan ? sanitizeCSV(g.tujuan) : null,
    nama_mahasiswa: isVip ? "-" : sanitizeCSV(g.nama_mahasiswa) || sanitizeCSV(g.nama) || "—",
    alamat: sanitizeCSV(g.alamat),
    kategori_tamu: validKategori,
    status_kehadiran: "tidak_hadir",
    acara_id: Number.isFinite(acaraId) ? acaraId : null,
    qr_token: generateToken(),
  };
}

export async function POST(request) {
  const { supabase, user, response } = await requireRole(["admin", "panitia"]);
  if (response) return response;

  const idempotencyKey = getIdempotencyKey(request);

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

    // Insert guests (CRUD part)
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

    // Activity + key completion via RPC (atomic)
    if (idempotencyKey) {
      const { error: rpcError } = await supabase.rpc("idempotent_guest_import", {
        p_key: idempotencyKey,
        p_user_id: user.id,
        p_guests: guestData,
        p_count: data.length,
        p_skipped: skipped,
      });
      if (rpcError) {
        const rpcResponse = mapRpcError(rpcError);
        if (rpcResponse) return rpcResponse;
        // Activity insert failed but CRUD succeeded — log and continue
        console.error("[import] activity insert failed:", rpcError);
      }
    } else {
      // No idempotency key — just log activity directly
      await supabase.from("activities").insert([{
        action: "import_guest",
        detail: `Mengimpor ${data.length} tamu dari CSV${skipped ? ` (${skipped} duplikat dilewati)` : ""}`,
        user_id: user.id,
      }]).then(() => {}).catch(console.error);
    }

    return NextResponse.json({ count: data.length, skipped }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
