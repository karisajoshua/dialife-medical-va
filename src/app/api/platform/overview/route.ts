import { json, platformIdentity } from "@/lib/platform/auth";
export const dynamic = "force-dynamic";
export async function GET() {
  const { client, identity } = await platformIdentity();
  if (!client || !identity)
    return json({ error: "Sign in to access live records." }, 401);
  const counters = [
    ["applications", "candidate_applications", null, null],
    ["trainees", "cohort_enrollments", "status", ["enrolled", "active"]],
    ["employers", "employer_organizations", "status", ["active"]],
    ["placements", "placements", "status", ["onboarding", "active"]],
    [
      "admitted",
      "candidate_applications",
      "status",
      ["admitted", "enrolled", "completed", "certified", "placed"],
    ],
    ["certified", "certificates", "status", ["issued"]],
    ["unread", "notifications", "read_at", null],
    ["cohorts", "training_cohorts", null, null],
    ["sessions", "training_sessions", null, null],
    ["submissions", "assignment_submissions", "score", null],
    [
      "requests",
      "staffing_requests",
      "status",
      ["open", "matching", "interviewing"],
    ],
    ["tasks", "va_tasks", "status", ["todo", "in_progress"]],
    ["timesheets", "timesheets", null, null],
  ] as const;
  let counts;
  try {
    counts = await Promise.all(
      counters.map(async ([name, table, column, values]) => {
        let query = client
          .from(table)
          .select("*", { count: "exact", head: true });
        if (column)
          query = values
            ? query.in(column, [...values])
            : query.is(column, null);
        const { count, error } = await query;
        if (error) throw error;
        return [name, count || 0] as const;
      }),
    );
  } catch {
    return json({ error: "Your workspace totals could not be loaded." }, 503);
  }
  const [
    { data: activity, error: activityError },
    { data: events, error: eventsError },
  ] = await Promise.all([
    client
      .from("activity_events")
      .select("id,summary,created_at,entity_type")
      .order("created_at", { ascending: false })
      .limit(5),
    client
      .from("calendar_events")
      .select("id,title,starts_at,ends_at,description")
      .gte("ends_at", new Date().toISOString())
      .order("starts_at")
      .limit(4),
  ]);
  if (activityError || eventsError)
    return json({ error: "Your workspace summary could not be loaded." }, 503);
  return json({
    counts: Object.fromEntries(counts),
    activity: activity || [],
    events: events || [],
    identity,
  });
}
