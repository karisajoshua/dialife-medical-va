import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code"),
    client = await createServerSupabase();
  if (code && client) {
    const { error } = await client.auth.exchangeCodeForSession(code);
    if (!error) {
      const next =
        request.nextUrl.searchParams.get("next") === "/login?recovery=1"
          ? "/login?recovery=1"
          : "/dashboard";
      return NextResponse.redirect(new URL(next, request.url), {
        headers: { "Cache-Control": "no-store" },
      });
    }
  }
  return NextResponse.redirect(
    new URL("/login?error=verification", request.url),
  );
}
