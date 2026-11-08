import { json, isUuid, platformIdentity } from "@/lib/platform/auth";
export const dynamic = "force-dynamic";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isUuid(id)) return json({ error: "Invalid document identifier." }, 400);
  const { client, identity } = await platformIdentity();
  if (!client || !identity)
    return json({ error: "Sign in to access private files." }, 401);
  const { data: doc, error } = await client
    .from("documents")
    .select("object_path,original_name")
    .eq("id", id)
    .maybeSingle();
  if (error || !doc)
    return json({ error: "Document not found or access is restricted." }, 404);
  const { data, error: signError } = await client.storage
    .from("dialife-private")
    .createSignedUrl(doc.object_path, 300, { download: doc.original_name });
  if (signError || !data)
    return json({ error: "The document could not be opened." }, 503);
  return json({ url: data.signedUrl });
}
