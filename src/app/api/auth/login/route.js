import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/api-helpers";

const loginRateLimit = createRateLimiter({
  max: 10,
  message: "Terlalu banyak percobaan login. Coba lagi nanti.",
});

export async function POST(request) {
  const rateLimitResponse = loginRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  try {
    const { email, password, remember } = await request.json();

    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Email dan password wajib diisi" }, { status: 400 });
    }
    if (email.length > 254 || password.length > 128) {
      return NextResponse.json({ error: "Email atau password tidak valid" }, { status: 400 });
    }

    const rememberMe = remember !== false;

    const cookieStore = await cookies();
    cookieStore.set("tamuku_remember", rememberMe ? "1" : "0", {
      path: "/",
      sameSite: "lax",
      ...(rememberMe ? { maxAge: 30 * 24 * 60 * 60 } : {}),
    });

    const supabase = await createClient({ remember: rememberMe });
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return NextResponse.json({ error: "Email atau password salah" }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name, role, status")
      .eq("id", data.user.id)
      .single();

    if (!profile || profile.status !== "active") {
      await supabase.auth.signOut();
      const message =
        profile?.status === "pending"
          ? "Akun Anda masih menunggu persetujuan administrator."
          : "Akun Anda belum dapat digunakan.";
      return NextResponse.json({ error: message }, { status: 403 });
    }

    return NextResponse.json({
      id: data.user.id,
      email: data.user.email,
      role: profile?.role,
      display_name: profile?.display_name,
    });
  } catch (err) {
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 });
  }
}
