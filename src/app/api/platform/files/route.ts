import { NextRequest } from "next/server";
import {
  checkOrigin,
  databaseError,
  json,
  platformIdentity,
} from "@/lib/platform/auth";
export const dynamic = "force-dynamic";
const allowed = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "text/plain",
  "audio/mpeg",
  "audio/wav",
  "audio/webm",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];
export async function POST(request: NextRequest) {
  const origin = checkOrigin(request);
  if (origin) return origin;
  const { client, identity } = await platformIdentity();
  if (!client || !identity)
    return json({ error: "Sign in to upload private files." }, 401);
  let body;
  try {
    const text = await request.text();
    if (text.length > 4000) throw new Error();
    body = JSON.parse(text);
  } catch {
    return json({ error: "Invalid file details." }, 400);
  }
  const { original_name, object_path, mime_type, size_bytes, category } =
    body || {};
  const categories = [
    "general",
    "application",
    "learning",
    "contract",
    "simulation",
  ];
  if (
    typeof original_name !== "string" ||
    !original_name.trim() ||
    original_name.length > 255 ||
    typeof object_path !== "string" ||
    !new RegExp(`^${identity.id}/[0-9a-f-]{36}\\.[a-z0-9]{1,8}$`, "i").test(
      object_path,
    ) ||
    !allowed.includes(mime_type) ||
    !Number.isInteger(size_bytes) ||
    size_bytes < 1 ||
    size_bytes > 10485760 ||
    !categories.includes(category)
  )
    return json(
      { error: "Check the filename, format, size and category." },
      422,
    );
  const filename = object_path.split("/")[1];
  const { data: objects, error: storageError } = await client.storage
    .from("dialife-private")
    .list(identity.id, { search: filename, limit: 10 });
  const object = objects?.find((o) => o.name === filename);
  if (
    storageError ||
    !object ||
    Number(object.metadata?.size) !== size_bytes ||
    object.metadata?.mimetype !== mime_type
  )
    return json(
      {
        error:
          "The uploaded file could not be verified. Please upload it again.",
      },
      422,
    );
  const { data, error } = await client
    .from("documents")
    .insert({
      owner_id: identity.id,
      original_name: original_name.trim(),
      object_path,
      mime_type,
      size_bytes,
      category,
    })
    .select("*")
    .single();
  if (error) return databaseError(error);
  return json({ record: data, message: "Private document saved." }, 201);
}
