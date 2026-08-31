import { NextResponse } from "next/server";
import { requireRole, getIdempotencyKey, mapRpcError } from "@/lib/api-helpers";

export async function DELETE(request) {
  const { supabase, user, response } = await requireRole(["admin"]);
  if (response) return response;

  const idempotencyKey = getIdempotencyKey(request);

  try {
    const { searchParams } = new URL(request.url);
    const acara_id = searchParams.get("acara_id");
    const parsedAcaraId = acara_id ? Number(acara_id) : null;

    if (parsedAcaraId && !Number.isInteger(parsedAcaraId)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("idempotent_guest_bulk_delete", {
      p_key: idempotencyKey,
      p_user_id: user.id,
      p_acara_id: parsedAcaraId,
    });

    if (error) {
      const rpcResponse = mapRpcError(error);
      if (rpcResponse) return rpcResponse;
      console.error("[bulk-delete] rpc error:", error);
      return NextResponse.json({ error: "Gagal menghapus data tamu" }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error("[bulk-delete] unexpected error:", err);
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
