import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ user: null, profile: null });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, role, status")
    .eq("id", user.id)
    .single();

  // Defense-in-depth: only active accounts are considered authenticated
  // application users. Pending accounts cannot access protected pages/APIs.
  if (!profile || profile.status !== "active") {
    return NextResponse.json({ user: null, profile: null });
  }

  return NextResponse.json({
    user: { id: user.id, email: user.email },
    profile: profile || null,
  });
}
