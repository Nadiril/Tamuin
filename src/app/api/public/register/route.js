import { createServiceClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/api-helpers";

const registerRateLimit = createRateLimiter({
  max: 5,
  message: "Terlalu banyak percobaan pendaftaran. Coba lagi nanti.",
});

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request) {
  const rateLimitResponse = registerRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const body = await request.json();
    const name = typeof body.display_name === "string" ? body.display_name.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";

    if (!name) {
      return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ error: "Nama maksimal 100 karakter" }, { status: 400 });
    }
    if (!email || email.length > 254 || !EMAIL_PATTERN.test(email)) {
      return NextResponse.json({ error: "Format email tidak valid" }, { status: 400 });
    }
    if (!password) {
      return NextResponse.json({ error: "Password wajib diisi" }, { status: 400 });
    }
    if (password.length < 8) {
      return NextResponse.json({ error: "Password minimal 8 karakter" }, { status: 400 });
    }

    const serviceSupabase = await createServiceClient();

    // Role/status are ALWAYS forced server-side. Client-supplied
    // role/status/approval fields are ignored.
    const { error } = await serviceSupabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "panitia",
        self_registered: "true",
        display_name: name,
      },
    });

    if (error) {
      if (/already.*regist|already.*exist|duplicate/i.test(error.message || "")) {
        return NextResponse.json({ error: "Email sudah terdaftar." }, { status: 409 });
      }
      return NextResponse.json(
        { error: "Terjadi kesalahan saat mendaftar. Silakan coba lagi." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Terjadi kesalahan server. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
