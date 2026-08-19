import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";

export async function PUT(request, { params }) {
  const { id } = await params;
  const { supabase, user, response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const body = await request.json();
    const service = await createServiceClient();

    if (body.password) {
      if (body.password.length < 8) {
        return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
      }
      const { error: pwdError } = await service.auth.admin.updateUserById(id, {
        password: body.password,
      });
      if (pwdError) {
        return NextResponse.json({ error: "Gagal mengubah password" }, { status: 500 });
      }
    }

    if (body.display_name !== undefined || body.role !== undefined || body.status !== undefined) {
      const profileUpdates = {};
      if (body.display_name !== undefined) profileUpdates.display_name = body.display_name;
      if (body.role !== undefined) {
        if (!["admin", "panitia"].includes(body.role)) {
          return NextResponse.json({ error: "Invalid role. Must be admin or panitia" }, { status: 400 });
        }
        profileUpdates.role = body.role;
      }
      if (body.status !== undefined) {
        if (!["active", "pending"].includes(body.status)) {
          return NextResponse.json({ error: "Invalid status. Must be active or pending" }, { status: 400 });
        }
        profileUpdates.status = body.status;
      }
      const { error: profileError } = await supabase
        .from("profiles")
        .update(profileUpdates)
        .eq("id", id);
      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 500 });
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Data tidak valid" }, { status: 400 });
  }
}

export async function DELETE(request, { params }) {
  const { id } = await params;
  const { user, response } = await requireRole(["admin"]);
  if (response) return response;

  if (id === user.id) {
    return NextResponse.json(
      { error: "Tidak dapat menghapus akun sendiri" },
      { status: 400 },
    );
  }

  try {
    const service = await createServiceClient();
    const { error } = await service.auth.admin.deleteUser(id);
    if (error) {
      return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 500 });
  }
}
