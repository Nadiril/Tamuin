import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";
import { createServiceClient } from "@/lib/supabase/server";

const TABLES = ["activities", "guests", "events"];

async function getCounts(supabase) {
  const counts = { guests: 0, events: 0, activities: 0 };
  for (const table of TABLES) {
    const { count, error } = await supabase
      .from(table)
      .select("id", { count: "exact", head: true });
    if (error) {
      console.error(`[reset-data] count ${table} error:`, error);
      return null;
    }
    counts[table] = count ?? 0;
  }
  return counts;
}

export async function GET() {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  const serviceSupabase = await createServiceClient();
  const counts = await getCounts(serviceSupabase);
  if (!counts) {
    return NextResponse.json({ error: "Gagal memuat jumlah data" }, { status: 500 });
  }

  return NextResponse.json({ counts });
}

export async function DELETE(request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const body = await request.json();
    if (!body || body.confirm !== true) {
      return NextResponse.json(
        { error: "Konfirmasi diperlukan untuk menghapus data" },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Konfirmasi diperlukan untuk menghapus data" },
      { status: 400 }
    );
  }

  const serviceSupabase = await createServiceClient();
  const deleted = { guests: 0, events: 0, activities: 0 };

  for (const table of TABLES) {
    // PostgREST rejects DELETE without a WHERE clause (error 21000),
    // so "delete all" uses a filter that matches every row.
    const { count, error } = await serviceSupabase
      .from(table)
      .delete()
      .neq("id", -1)
      .select("id", { count: "exact", head: true });

    if (error) {
      console.error(`[reset-data] delete ${table} error:`, error);
      return NextResponse.json(
        { error: `Gagal menghapus data ${table}` },
        { status: 500 }
      );
    }
    deleted[table] = count ?? 0;
  }

  return NextResponse.json({ success: true, deleted });
}