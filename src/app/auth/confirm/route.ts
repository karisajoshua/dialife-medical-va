import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token_hash"),
    type = request.nextUrl.searchParams.get("type"),
    client = await createServerSupabase();
  if (token && client && ["signup", "email", "recovery"].includes(type || "")) {
    const { error } = await client.auth.verifyOtp({
      token_hash: token,
      type: type as "signup" | "email" | "recovery",
    });
    if (!error)
      return NextResponse.redirect(
        new URL(
          type === "recovery" ? "/login?recovery=1" : "/dashboard",
          request.url,
        ),
        { headers: { "Cache-Control": "no-store" } },
      );
  }
  return NextResponse.redirect(
    new URL("/login?error=verification", request.url),
  );
}
