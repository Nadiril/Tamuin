import { NextResponse } from "next/server";
import { sanitize, requireRole, findDuplicateGuest } from "@/lib/api-helpers";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const body = await request.json();
    const allowed = [
      "nama",
      "instansi",
      "no_hp",
      "tujuan",
      "nama_mahasiswa",
      "alamat",
      "kategori_tamu",
      "status_kehadiran",
      "waktu_kedatangan",
      "acara_id",
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) {
        if (key === "acara_id") updates[key] = Number(body[key]);
        else updates[key] = sanitize(body[key]);
      }
    }

    if (updates.kategori_tamu && !["reguler", "vip", "vvip"].includes(updates.kategori_tamu)) {
      return NextResponse.json({ error: "Kategori tamu tidak valid" }, { status: 400 });
    }
    if (updates.kategori_tamu && updates.kategori_tamu !== "reguler") {
      updates.nama_mahasiswa = "-";
    }
    if (updates.alamat !== undefined && !updates.alamat) {
      return NextResponse.json({ error: "Alamat wajib diisi" }, { status: 400 });
    }
    if (updates.no_hp !== undefined) updates.no_hp = updates.no_hp ? updates.no_hp.slice(0, 20) : null;

    if (updates.acara_id !== undefined || updates.no_hp !== undefined) {
      const { data: current } = await supabase
        .from("guests")
        .select("acara_id, no_hp")
        .eq("id", id)
        .single();

      if (current) {
        const acara_id = updates.acara_id ?? current.acara_id;
        const no_hp = updates.no_hp !== undefined ? updates.no_hp : current.no_hp;
        const duplicate = await findDuplicateGuest(supabase, { acara_id, no_hp, excludeId: id });
        if (duplicate) {
          return NextResponse.json(
            { error: `Tamu dengan nomor HP yang sama sudah terdaftar di acara ini (${duplicate.nama})` },
            { status: 409 },
          );
        }
      }
    }

    const { data, error } = await supabase
      .from("guests")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Tamu dengan nomor HP yang sama sudah terdaftar di acara ini" },
          { status: 409 },
        );
      }
      return NextResponse.json({ error: "Gagal memperbarui data tamu" }, { status: 500 });
    }
    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  const { error } = await supabase.from("guests").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
