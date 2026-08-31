import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";

const ALLOWED_ACTIONS = [
  "create_guest",
  "update_guest",
  "delete_guest",
  "import_guest",
  "import_guests",
  "scan_guest",
  "create_event",
  "update_event",
  "delete_event",
  "update_status",
  "export_laporan",
];

export async function GET() {
  const { supabase, response } = await requireRole(["admin", "panitia"]);
  if (response) return response;

  const { data, error } = await supabase
    .from("activities")
    .select("*")
    .order("timestamp", { ascending: false })
    .limit(100);

  if (error) return NextResponse.json({ error: "Gagal memuat aktivitas" }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { supabase, user, response } = await requireRole(["admin", "panitia"]);
  if (response) return response;

  try {
    const { action, detail } = await request.json();

    if (!action || typeof action !== "string" || !ALLOWED_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Aksi tidak diizinkan" }, { status: 400 });
    }
    if (!detail || typeof detail !== "string" || detail.length > 500) {
      return NextResponse.json({ error: "Detail tidak valid" }, { status: 400 });
    }

    // Defense-in-depth: time-based dedup for client-side logging
    // Prevents duplicate activity entries if client sends same request twice
    // within a 3-second window. This is NOT the primary idempotency mechanism —
    // the idempotency key in RPC functions handles that.
    const { data: recentDuplicate } = await supabase
      .from("activities")
      .select("id")
      .eq("action", action)
      .eq("user_id", user.id)
      .eq("detail", detail.trim())
      .gt("timestamp", new Date(Date.now() - 3000).toISOString())
      .limit(1);

    if (recentDuplicate && recentDuplicate.length > 0) {
      // Return the existing activity instead of creating a duplicate
      const { data: existing } = await supabase
        .from("activities")
        .select("*")
        .eq("id", recentDuplicate[0].id)
        .single();
      return NextResponse.json(existing, { status: 200 });
    }

    const { data, error } = await supabase
      .from("activities")
      .insert([{ action, detail: detail.trim(), user_id: user.id }])
      .select()
      .single();

    if (error) return NextResponse.json({ error: "Gagal mencatat aktivitas" }, { status: 500 });
    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}
