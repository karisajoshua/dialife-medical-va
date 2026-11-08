import { NextRequest } from "next/server";
import { resources } from "@/lib/platform/resources";
import {
  checkOrigin,
  databaseError,
  isUuid,
  json,
  platformIdentity,
} from "@/lib/platform/auth";
import { validatePayload } from "@/lib/platform/validation";
export const dynamic = "force-dynamic";
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  const { resource: key } = await params,
    r = resources[key];
  if (!r) return json({ error: "Workspace not found." }, 404);
  const { client, identity } = await platformIdentity();
  if (!identity || !client)
    return json({ error: "Sign in to access live records." }, 401);
  if (!r.read.includes(identity.role))
    return json({ error: "This workspace is unavailable for your role." }, 403);
  const id = request.nextUrl.searchParams.get("id"),
    pk = r.primaryKey || "id";
  if (id) {
    if (!isUuid(id)) return json({ error: "Invalid record identifier." }, 400);
    const { data, error } = await client
      .from(r.table)
      .select("*")
      .eq(pk, id)
      .maybeSingle();
    if (error) return databaseError(error);
    return data
      ? json({ record: data })
      : json({ error: "Record not found or access is restricted." }, 404);
  }
  const page = Math.max(
      1,
      Math.min(10000, Number(request.nextUrl.searchParams.get("page")) || 1),
    ),
    limit = 25;
  let query = client
    .from(r.table)
    .select("*", { count: "exact" })
    .order(r.order || "created_at", { ascending: !r.descending })
    .range((page - 1) * limit, page * limit - 1);
  const search = (request.nextUrl.searchParams.get("q") || "").slice(0, 120);
  if (search && r.search)
    query = query.ilike(r.search, `%${search.replace(/[\\%_]/g, "\\$&")}%`);
  const status = request.nextUrl.searchParams.get("status");
  if (status && r.fields.some((f) => f.key === "status"))
    query = query.eq("status", status.slice(0, 40));
  const { data, error, count } = await query;
  if (error) return databaseError(error);
  return json({
    records: data || [],
    count: count || 0,
    page,
    pageSize: limit,
  });
}
async function save(
  request: NextRequest,
  params: Promise<{ resource: string }>,
  editing: boolean,
) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const { resource: key } = await params,
    r = resources[key];
  if (!r) return json({ error: "Workspace not found." }, 404);
  const { client, identity } = await platformIdentity();
  if (!identity || !client)
    return json({ error: "Sign in to access live records." }, 401);
  if (!(editing ? r.edit : r.create).includes(identity.role))
    return json({ error: "Your role cannot change these records." }, 403);
  if (!request.headers.get("content-type")?.includes("application/json"))
    return json({ error: "Send a JSON request." }, 415);
  let input: Record<string, unknown>;
  try {
    const body = await request.text();
    if (body.length > 120000)
      return json({ error: "The record is too large." }, 413);
    input = JSON.parse(body);
    if (!input || typeof input !== "object" || Array.isArray(input))
      throw new Error();
  } catch {
    return json({ error: "Invalid record data." }, 400);
  }
  const id = request.nextUrl.searchParams.get("id"),
    pk = r.primaryKey || "id";
  if (editing && (!id || !isUuid(id)))
    return json({ error: "A valid record identifier is required." }, 400);
  let payload: Record<string, unknown>;
  try {
    payload = validatePayload(key, r, identity.role, input, editing);
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error ? error.message : "Check the form fields.",
      },
      422,
    );
  }
  if (!editing && r.actor && (!payload[r.actor] || identity.role !== "admin"))
    payload[r.actor] = identity.id;
  if (
    editing &&
    key === "profiles" &&
    id === identity.id &&
    payload.role &&
    payload.role !== "admin" &&
    identity.role === "admin"
  )
    return json(
      { error: "Ask another administrator to change your role." },
      422,
    );
  if (!editing && key === "certificates") {
    const { data: enrollment } = await client
      .from("cohort_enrollments")
      .select("trainee_id,status")
      .eq("id", String(payload.enrollment_id))
      .single();
    if (!enrollment || enrollment.status !== "completed")
      return json(
        { error: "Select a completed enrollment to issue a certificate." },
        422,
      );
    payload.user_id = enrollment.trainee_id;
  }
  let result;
  if (editing)
    result = await client
      .from(r.table)
      .update(payload)
      .eq(pk, id!)
      .select("*")
      .maybeSingle();
  else if (key === "progress") {
    const { data: existing } = await client
      .from("lesson_progress")
      .select("id")
      .eq("lesson_id", String(payload.lesson_id))
      .eq("user_id", String(payload.user_id))
      .maybeSingle();
    result = existing
      ? await client
          .from(r.table)
          .update(payload)
          .eq("id", existing.id)
          .select("*")
          .single()
      : await client.from(r.table).insert(payload).select("*").single();
  } else
    result = await client.from(r.table).insert(payload).select("*").single();
  if (result.error) return databaseError(result.error);
  if (!result.data)
    return json(
      { error: "Record not found or your role cannot change it." },
      404,
    );
  return json(
    {
      record: result.data,
      message: `${r.singular} ${editing ? "updated" : "created"}.`,
    },
    editing ? 200 : 201,
  );
}
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  return save(request, params, false);
}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> },
) {
  return save(request, params, true);
}
