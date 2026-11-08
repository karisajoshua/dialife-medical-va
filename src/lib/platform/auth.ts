import "server-only";
import { createServerSupabase } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import type { PlatformRole } from "./resources";
export type Identity = {
  id: string;
  email: string;
  displayName: string;
  role: PlatformRole;
};
export const privateHeaders = {
  "Cache-Control": "private, no-store",
  Vary: "Cookie",
};
export function json(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: privateHeaders });
}
export async function platformIdentity() {
  const client = await createServerSupabase();
  if (!client) return { client: null, identity: null };
  const { data, error } = await client.auth.getClaims();
  const claims = data?.claims;
  if (
    error ||
    !claims ||
    typeof claims.sub !== "string" ||
    claims.is_anonymous === true
  )
    return { client, identity: null };
  const user = {
    id: claims.sub,
    email: typeof claims.email === "string" ? claims.email : "",
  };
  // Profile RLS checks the current auth.users row and requires confirmed email.
  // Role and account removal take effect from the database, not editable claims.
  const { data: profile, error: profileError } = await client
    .from("platform_profiles")
    .select("user_id,display_name,role")
    .eq("user_id", user.id)
    .single();
  if (profileError || !profile) return { client, identity: null };
  return {
    client,
    identity: {
      id: user.id,
      email: user.email || "",
      displayName: profile.display_name || user.email || "Dialife member",
      role: profile.role as PlatformRole,
    },
  };
}
export function checkOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const parsed = new URL(origin),
        host = request.headers.get("host") || new URL(request.url).host;
      if (
        !["http:", "https:"].includes(parsed.protocol) ||
        parsed.host !== host
      )
        return json({ error: "Request origin is not permitted." }, 403);
    } catch {
      return json({ error: "Request origin is not permitted." }, 403);
    }
  }
  return null;
}
export function databaseError(error: { code?: string; message?: string }) {
  const code = error.code;
  if (code === "42501")
    return json(
      {
        error: "Your account does not have permission to perform this action.",
      },
      403,
    );
  if (code === "23505")
    return json({ error: "This record or combination already exists." }, 409);
  if (code === "23503")
    return json(
      { error: "Choose a related record that is still available." },
      422,
    );
  if (code === "P0001")
    return json(
      { error: error.message || "This action is not permitted." },
      422,
    );
  return json(
    {
      error:
        "The record could not be saved. Check required fields, dates and status values.",
    },
    422,
  );
}
export const isUuid = (s: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    s,
  );
