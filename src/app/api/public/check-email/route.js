import { createPublicClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { createRateLimiter } from "@/lib/api-helpers";

const checkEmailRateLimit = createRateLimiter({ max: 10 });

export async function GET(request) {
  const rateLimitResponse = checkEmailRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email");

  if (!email || typeof email !== "string" || email.length > 254) {
    return NextResponse.json({ exists: false });
  }

  try {
    const supabase = await createPublicClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("id")
      .eq("username", email)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ exists: false });
    }

    return NextResponse.json({ exists: !!data });
  } catch {
    return NextResponse.json({ exists: false });
  }
}
