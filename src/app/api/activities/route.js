import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";

const ALLOWED_ACTIONS = [
  "create_guest",
  "update_guest",
  "delete_guest",
  "import_guest",
  "import_guests",
  "scan_guest",
  "send_qr_email",
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
