import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/api-helpers";

export async function GET() {
  const { supabase, response } = await requireRole(["admin"]);
  if (response) return response;

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(request) {
  const { response } = await requireRole(["admin"]);
  if (response) return response;

  try {
    const body = await request.json();
    const { email, password, display_name, role } = body;

    if (!email || !password || !role) {
      return NextResponse.json(
        { error: "Email, password, dan role wajib diisi" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password minimal 8 karakter" },
        { status: 400 }
      );
    }

    if (!["admin", "panitia"].includes(role)) {
      return NextResponse.json(
        { error: "Role harus admin atau panitia" },
        { status: 400 }
      );
    }

    const serviceSupabase = await createServiceClient();

    const { data: authUser, error: authError } =
      await serviceSupabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          role,
          display_name: display_name || email.split("@")[0],
        },
      });

    if (authError) {
      return NextResponse.json({ error: "Gagal membuat pengguna" }, { status: 500 });
    }

    return NextResponse.json(
      {
        user: {
          id: authUser.user.id,
          email: authUser.user.email,
          role,
          display_name: display_name || email.split("@")[0],
        },
      },
      { status: 201 }
    );
  } catch (err) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }
}
