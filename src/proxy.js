import { NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const publicRoutes = ["/", "/event/", "/scan/", "/api/public/", "/api/auth/"];

export default async function proxy(request) {
  try {
    const { supabaseResponse, user, supabase } = await updateSession(request);

    const pathname = request.nextUrl.pathname;

    const isPublic = publicRoutes.some((r) => pathname === r || pathname.startsWith(r));
    const isStaticAsset = pathname.startsWith("/_next") || pathname.startsWith("/favicon");

    if (!user) {
      if (!isPublic && !isStaticAsset) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
      return supabaseResponse;
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profileError) {
      console.error("Supabase Profile Query Error in Proxy:", profileError);
    } else {
      console.log("Supabase Profile Query Success in Proxy:", profile);
    }

    const role = profile?.role;

    if (pathname.startsWith("/admin") && role !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = role === "panitia" ? "/panitia" : "/";
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith("/panitia") && role !== "panitia") {
      const url = request.nextUrl.clone();
      url.pathname = role === "admin" ? "/admin/dashboard" : "/";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch (error) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    const response = NextResponse.redirect(url);
    const supabaseCookies = [
      "sb-access-token",
      "sb-refresh-token",
      "supabase-auth-token",
    ];
    for (const name of request.cookies.getAll()) {
      if (name.name.startsWith("sb-") || name.name.startsWith("supabase-")) {
        response.cookies.set(name.name, "", { maxAge: 0, path: "/" });
      }
    }
    return response;
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|Logo.webp|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
