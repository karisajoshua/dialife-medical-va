import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

const clean = (value: unknown, max = 3000) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";
const emailOk = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const reply = (message: string, status: number) =>
  NextResponse.json({ message }, { status });

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin) {
    try {
      if (new URL(origin).host !== host)
        return reply("Request origin not permitted.", 403);
    } catch {
      return reply("Invalid request origin.", 403);
    }
  }
  const length = Number(request.headers.get("content-length") || 0);
  if (length > 12000) return reply("Submission is too large.", 413);
  let data: Record<string, unknown>;
  try {
    data = await request.json();
  } catch {
    return reply("Invalid submission.", 400);
  }
  if (!data || typeof data !== "object" || Array.isArray(data))
    return reply("Invalid submission.", 400);
  if (clean(data.website))
    return NextResponse.json({
      message: "Thank you. Your enquiry has been received.",
    });
  const type = clean(data.type, 30);
  const email = clean(data.email, 254).toLowerCase();
  if (!emailOk(email)) return reply("Enter a valid email address.", 400);
  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!base || !key)
    return reply(
      "Applications are temporarily unavailable. Please try again later.",
      503,
    );
  let table: string;
  let payload: Record<string, string | number>;
  if (type === "candidate") {
    const full_name = clean(data.full_name, 120),
      phone = clean(data.phone, 60),
      country = clean(data.country, 100),
      medical_background = clean(data.medical_background, 500),
      experience_years = clean(data.experience_years, 40),
      motivation = clean(data.motivation);
    if (
      full_name.length < 2 ||
      !phone ||
      !country ||
      !medical_background ||
      !experience_years ||
      motivation.length < 20
    )
      return reply(
        "Please complete all fields. Your motivation should contain at least 20 characters.",
        400,
      );
    table = "candidate_applications";
    payload = {
      full_name,
      email,
      phone,
      country,
      medical_background,
      experience_years,
      motivation,
    };
  } else if (type === "employer") {
    const organization = clean(data.organization, 160),
      contact_name = clean(data.contact_name, 120),
      country = clean(data.country, 100),
      role_requirements = clean(data.role_requirements),
      expected_headcount = Number(data.expected_headcount);
    if (
      !organization ||
      !contact_name ||
      !country ||
      role_requirements.length < 20 ||
      !Number.isInteger(expected_headcount) ||
      expected_headcount < 1 ||
      expected_headcount > 1000
    )
      return reply(
        "Please complete all fields and describe your requirements in at least 20 characters.",
        400,
      );
    table = "employer_enquiries";
    payload = {
      organization,
      contact_name,
      email,
      country,
      role_requirements,
      expected_headcount,
    };
  } else return reply("Unknown enquiry type.", 400);
  try {
    const client = await createServerSupabase();
    if (!client) return reply("Applications are temporarily unavailable.", 503);
    const {
      data: { user },
    } = await client.auth.getUser();
    if (user) {
      if (
        !user.email_confirmed_at ||
        user.is_anonymous ||
        user.email?.toLowerCase() !== email
      )
        return reply(
          "Use your confirmed account email for this submission.",
          403,
        );
      if (type === "candidate") payload.user_id = user.id;
    }
    const { error } = await client.from(table).insert(payload);
    if (error)
      return reply("We couldn't save your submission. Please try again.", 502);
    return NextResponse.json(
      { message: "Thank you. Your submission has been received." },
      { status: 201, headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return reply("Service temporarily unavailable. Please try again.", 503);
  }
}
