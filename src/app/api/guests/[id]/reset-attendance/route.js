import { NextResponse } from "next/server";
import { requireRole, getIdempotencyKey, mapRpcError } from "@/lib/api-helpers";

export async function POST(request, { params }) {
  const { supabase, user, response } = await requireRole(["admin"]);
  if (response) return response;

  const idempotencyKey = getIdempotencyKey(request);

  try {
    const { id } = await params;
    const guestId = Number(id);
    if (!Number.isInteger(guestId)) {
      return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
    }

    const { data, error } = await supabase.rpc("idempotent_guest_reset", {
      p_key: idempotencyKey,
      p_user_id: user.id,
      p_guest_id: guestId,
    });

    if (error) {
      const rpcResponse = mapRpcError(error);
      if (rpcResponse) return rpcResponse;
      return NextResponse.json({ error: "Gagal mengoreksi status kehadiran" }, { status: 500 });
    }

    return NextResponse.json({ success: true, guest: data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
