import { NextResponse } from "next/server";
import { requireRole, makeUniqueSlug } from "@/lib/api-helpers";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const body = await request.json();
    const allowed = [
      "nama_acara",
      "lokasi",
      "tanggal_mulai",
      "tanggal_selesai",
      "jam_mulai",
      "jam_selesai",
      "grace_period_minutes",
      "status",
    ];
    const updates = {};
    for (const key of allowed) {
      if (body[key] !== undefined) updates[key] = body[key];
    }
    if (updates.nama_acara) {
      const baseSlug = updates.nama_acara
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      updates.slug = await makeUniqueSlug(supabase, baseSlug, { excludeId: id });
    }
    if (updates.grace_period_minutes !== undefined) {
      updates.grace_period_minutes = Number(updates.grace_period_minutes) >= 0
        ? Number(updates.grace_period_minutes)
        : 30;
    }

    const { data, error } = await supabase
      .from("events")
      .update(updates)
      .eq("id", id)
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
      return NextResponse.json({ error: "Gagal memperbarui acara" }, { status: 500 });
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

  const { error } = await supabase.from("events").delete().eq("id", id);
  if (error) return NextResponse.json({ error: "Gagal menghapus acara" }, { status: 500 });
  return NextResponse.json({ success: true });
}
