import { NextRequest } from "next/server";
import { resources } from "@/lib/platform/resources";
import { json, platformIdentity } from "@/lib/platform/auth";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const { client, identity } = await platformIdentity();
  if (!client || !identity)
    return json({ error: "Sign in to access records." }, 401);
  const key = request.nextUrl.searchParams.get("resource") || "",
    resource = resources[key];
  if (!resource || !resource.read.includes(identity.role))
    return json({ error: "Workspace unavailable." }, 403);
  const relations = [
    ...new Set(
      resource.fields
        .filter((f) => !f.roles || f.roles.includes(identity.role))
        .flatMap((f) => (f.relation ? [f.relation] : [])),
    ),
  ];
  const entries = await Promise.all(
    relations.map(async (relation) => {
      const r = resources[relation];
      if (!r || !r.read.includes(identity.role)) return [relation, []] as const;
      const pk = r.primaryKey || "id";
      const label =
        r.search ||
        r.fields.find(
          (f) =>
            f.key === "title" || f.key === "name" || f.key === "display_name",
        )?.key;
      const columns = [
        pk,
        label,
        ...r.columns.filter((c) =>
          [
            "title",
            "display_name",
            "certificate_number",
            "cohort_id",
            "trainee_id",
            "candidate_id",
            "request_id",
            "status",
            "role",
          ].includes(c),
        ),
      ].filter((c): c is string => !!c);
      const { data } = await client
        .from(r.table)
        .select([...new Set(columns)].join(","))
        .order(r.order || "created_at", { ascending: false })
        .limit(500);
      const rows = (data || []) as unknown as Record<string, unknown>[];
      return [
        relation,
        rows.map((row) => ({
          value: String(row[pk]),
          label: label
            ? String(row[label] || String(row[pk]).slice(0, 8))
            : `${r.singular} ${String(row[pk]).slice(0, 8)}${row.status ? " · " + row.status : ""}`,
          role: row.role,
          status: row.status,
        })),
      ] as const;
    }),
  );
  return json({ options: Object.fromEntries(entries) });
}
