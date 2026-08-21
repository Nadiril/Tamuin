import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";

export async function DELETE(request) {
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const { searchParams } = new URL(request.url);
    const acara_id = searchParams.get("acara_id");
    const parsedAcaraId = acara_id ? Number(acara_id) : null;

    let query = supabase.from("guests").delete();
    if (parsedAcaraId && Number.isInteger(parsedAcaraId)) {
      query = query.eq("acara_id", parsedAcaraId);
    } else {
      // PostgREST rejects DELETE without a WHERE clause (error 21000),
      // so "delete all" uses a filter that matches every row.
      query = query.neq("id", -1);
    }

    const { error } = await query;
    if (error) {
      console.error("[bulk-delete] supabase error:", error);
      return NextResponse.json({ error: "Gagal menghapus data tamu" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[bulk-delete] unexpected error:", err);
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}