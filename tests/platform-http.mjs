import assert from "node:assert/strict";
import fs from "node:fs";
import { dirname, join, resolve } from "node:path";
import { createServerClient } from "@supabase/ssr";
const fixturePath = process.env.PLATFORM_TEST_FIXTURE;
if (!fixturePath)
  throw new Error(
    "Set PLATFORM_TEST_FIXTURE to an isolated test-identity JSON file outside the repository.",
  );
const fixture = JSON.parse(fs.readFileSync(fixturePath, "utf8"));
const outputDir =
  process.env.PLATFORM_TEST_OUTPUT_DIR || dirname(resolve(fixturePath));
const output = join(outputDir, "platform-test-records.json");
const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const records =
  process.env.PLATFORM_TEST_RESUME === "1"
    ? JSON.parse(fs.readFileSync(output, "utf8")).records
    : [];
const clients = {};
let assertions = 0;
function ok(condition, message) {
  assert.ok(condition, message);
  assertions++;
}
await Promise.all(
  Object.entries(fixture.users).map(async ([name, user]) => {
    const jar = new Map();
    const client = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      {
        cookies: {
          getAll: () => [...jar].map(([name, value]) => ({ name, value })),
          setAll: (values) => values.forEach((c) => jar.set(c.name, c.value)),
        },
      },
    );
    const { error } = await client.auth.signInWithPassword({
      email: user.email,
      password: user.password,
    });
    if (error)
      throw new Error(`Test sign-in failed for ${name}: ${error.message}`);
    clients[name] = { client, jar };
  }),
);
console.log("Authenticated seven isolated test identities.");
async function call(who, path, method = "GET", body, expected = 200) {
  const headers = {};
  if (who)
    headers.Cookie = [...clients[who].jar]
      .map(([k, v]) => `${k}=${v}`)
      .join("; ");
  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    headers.Origin = base;
  }
  const response = await fetch(base + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const result = await response.json();
  assert.equal(
    response.status,
    expected,
    `${method} ${path}: ${JSON.stringify(result)}`,
  );
  assertions++;
  if (process.env.PLATFORM_TEST_VERBOSE === "1")
    console.log(
      `${assertions}: ${method} ${path.split("?")[0]} → ${response.status}`,
    );
  return result;
}
async function create(who, key, body) {
  const existing = records.find((r) => r.key === key);
  if (existing)
    return (await call(who, `/api/platform/${key}?id=${existing.id}`)).record;
  const result = await call(who, `/api/platform/${key}`, "POST", body, 201);
  records.push({ key, id: result.record.id || result.record.user_id });
  fs.writeFileSync(output, JSON.stringify({ run: fixture.run, records }));
  return result.record;
}
const name = (title) => `QA-${fixture.run} ${title}`;
for (const key of [
  "overview",
  "applications",
  "cohorts",
  "documents",
  "simulations",
])
  await call(null, `/api/platform/${key}`, "GET", undefined, 401);
const program = await create("admin", "programs", {
  title: name("Program"),
  description: "Synthetic HTTP integration course",
  duration_weeks: 4,
  status: "published",
});
const courseModule = await create("admin", "modules", {
  program_id: program.id,
  title: name("Module"),
  description: "Synthetic module",
  position: 1,
});
const lesson = await create("admin", "lessons", {
  module_id: courseModule.id,
  title: name("Lesson"),
  content: "Synthetic administrative training content.",
  position: 1,
  duration_minutes: 30,
  status: "published",
});
const cohort = await create("admin", "cohorts", {
  title: name("Cohort"),
  program_id: program.id,
  start_date: "2026-11-09",
  end_date: "2026-12-09",
  capacity: 30,
  status: "active",
});
const enrollment = await create("admin", "enrollments", {
  cohort_id: cohort.id,
  trainee_id: fixture.users.learner.id,
  status: "active",
});
await create("admin", "trainers", {
  cohort_id: cohort.id,
  trainer_id: fixture.users.trainer.id,
});
let read = await call("learner", `/api/platform/lessons?id=${lesson.id}`);
ok(
  read.record.content.includes("Synthetic"),
  "Learner can open published lesson content",
);
await call(
  "learner",
  "/api/platform/progress",
  "POST",
  { lesson_id: lesson.id, completed: true },
  201,
);
read = await call("learner", "/api/platform/progress");
ok(
  read.records.some((r) => r.lesson_id === lesson.id && r.completed),
  "Lesson completion persisted across requests",
);
await call(
  "learner",
  "/api/platform/progress",
  "POST",
  { lesson_id: lesson.id, completed: true },
  201,
);
await call(
  "other",
  `/api/platform/enrollments?id=${enrollment.id}`,
  "GET",
  undefined,
  404,
);
await call(
  "learner",
  `/api/platform/profiles?id=${fixture.users.learner.id}`,
  "PATCH",
  { role: "admin" },
  422,
);
const session = await create("admin", "sessions", {
  cohort_id: cohort.id,
  title: name("Session"),
  starts_at: "2026-11-10T10:00:00Z",
  ends_at: "2026-11-10T11:00:00Z",
  status: "scheduled",
});
await call("trainer", `/api/platform/sessions?id=${session.id}`, "PATCH", {
  status: "completed",
});
await create("trainer", "attendance", {
  session_id: session.id,
  trainee_id: fixture.users.learner.id,
  status: "present",
  notes: "Synthetic attendance",
});
const assignment = await create("trainer", "assignments", {
  cohort_id: cohort.id,
  title: name("Assessment"),
  instructions: "Synthetic assignment instructions",
  assessment_type: "practical",
});
const submission = await create("learner", "submissions", {
  assignment_id: assignment.id,
  response: "Synthetic learner response",
});
await call(
  "learner",
  `/api/platform/submissions?id=${submission.id}`,
  "PATCH",
  { score: 100 },
  422,
);
await call(
  "trainer",
  `/api/platform/submissions?id=${submission.id}`,
  "PATCH",
  { score: 88, feedback: "Synthetic trainer feedback" },
);
read = await call("learner", `/api/platform/submissions?id=${submission.id}`);
ok(
  Number(read.record.score) === 88,
  "Trainer grading persisted and is visible to the learner",
);
await call("admin", `/api/platform/enrollments?id=${enrollment.id}`, "PATCH", {
  status: "completed",
});
const cert = await create("admin", "certificates", {
  enrollment_id: enrollment.id,
  status: "issued",
  notes: "Synthetic certificate",
});
read = await call("learner", `/api/platform/certificates?id=${cert.id}`);
ok(
  read.record.certificate_number.startsWith("DVA-"),
  "Completed learner can access own issued certificate",
);
const org = await create("admin", "organizations", {
  name: name("Employer"),
  country: "Kenya",
  time_zone: "Africa/Nairobi",
  status: "active",
});
await create("admin", "memberships", {
  organization_id: org.id,
  user_id: fixture.users.employer.id,
});
const request = await create("employer", "requests", {
  organization_id: org.id,
  title: name("Staffing Request"),
  requirements: "Synthetic administrative role",
  headcount: 1,
  time_zone: "Africa/Nairobi",
  status: "open",
});
await call(
  "other_employer",
  `/api/platform/requests?id=${request.id}`,
  "GET",
  undefined,
  404,
);
await create("learner", "candidates", {
  display_name: name("Candidate"),
  bio: "Synthetic profile",
  skills: "Scheduling",
  time_zone: "Africa/Nairobi",
  availability: "Part time",
  published: true,
});
const match = await create("admin", "matches", {
  request_id: request.id,
  candidate_id: fixture.users.learner.id,
  status: "shortlisted",
  notes: "Synthetic matching",
});
const interview = await create("employer", "interviews", {
  match_id: match.id,
  starts_at: "2026-11-11T10:00:00Z",
  duration_minutes: 30,
  status: "scheduled",
});
read = await call("learner", `/api/platform/interviews?id=${interview.id}`);
ok(read.record.match_id === match.id, "Matched candidate sees own interview");
const placement = await create("admin", "placements", {
  request_id: request.id,
  medical_va_id: fixture.users.va.id,
  title: name("Placement"),
  start_date: "2026-11-09",
  status: "active",
});
const task = await create("employer", "tasks", {
  placement_id: placement.id,
  title: name("Task"),
  description: "Synthetic task",
  status: "todo",
});
await call("va", `/api/platform/tasks?id=${task.id}`, "PATCH", {
  status: "done",
  notes: "Synthetic completion",
});
await call(
  "va",
  `/api/platform/tasks?id=${task.id}`,
  "PATCH",
  { title: "Unauthorized rewrite" },
  422,
);
await create("employer", "schedules", {
  placement_id: placement.id,
  title: name("Shift"),
  starts_at: "2026-11-12T07:00:00Z",
  ends_at: "2026-11-12T15:00:00Z",
  time_zone: "Africa/Nairobi",
});
const time = await create("va", "timesheets", {
  placement_id: placement.id,
  work_date: "2026-11-12",
  minutes_worked: 60,
  description: "Synthetic time entry",
  status: "submitted",
});
await call(
  "va",
  `/api/platform/timesheets?id=${time.id}`,
  "PATCH",
  { status: "approved" },
  422,
);
await call("employer", `/api/platform/timesheets?id=${time.id}`, "PATCH", {
  status: "approved",
});
const ticket = await create("learner", "support", {
  title: name("Support"),
  description: "Synthetic support request",
  priority: "normal",
});
await create("learner", "messages", {
  ticket_id: ticket.id,
  body: "Synthetic reply",
});
await call(
  "other",
  `/api/platform/support?id=${ticket.id}`,
  "GET",
  undefined,
  404,
);
await create("admin", "calendar", {
  title: name("Event"),
  starts_at: "2026-12-01T10:00:00Z",
  ends_at: "2026-12-01T11:00:00Z",
  audience: "cohort",
  cohort_id: cohort.id,
});
const notification = await create("admin", "notifications", {
  user_id: fixture.users.learner.id,
  title: name("Notification"),
  body: "Synthetic notification",
});
await call(
  "learner",
  `/api/platform/notifications?id=${notification.id}`,
  "PATCH",
  { read_at: new Date().toISOString() },
);
const scenario = await create("admin", "scenarios", {
  program_id: program.id,
  title: name("Scenario"),
  instructions: "Synthetic scheduling call only.",
  difficulty: "foundation",
  status: "published",
});
const simulation = await create("learner", "simulations", {
  scenario_id: scenario.id,
  cohort_id: cohort.id,
  transcript: "Synthetic practice transcript",
  status: "completed",
});
await create("trainer", "evaluations", {
  session_id: simulation.id,
  score: 90,
  feedback: "Synthetic evaluation",
});
const objectPath = `${fixture.users.learner.id}/${crypto.randomUUID()}.txt`,
  contents = new Blob(["Synthetic private test document."], {
    type: "text/plain",
  });
const { error: uploadError } = await clients.learner.client.storage
  .from("dialife-private")
  .upload(objectPath, contents, { contentType: "text/plain" });
assert.ifError(uploadError);
assertions++;
fs.writeFileSync(
  join(outputDir, "platform-test-file.json"),
  JSON.stringify({ owner: "learner", path: objectPath }),
);
const doc = await call(
  "learner",
  "/api/platform/files",
  "POST",
  {
    original_name: name("private.txt"),
    object_path: objectPath,
    mime_type: "text/plain",
    size_bytes: contents.size,
    category: "general",
  },
  201,
);
records.push({ key: "documents", id: doc.record.id });
fs.writeFileSync(output, JSON.stringify({ run: fixture.run, records }));
const download = await call("learner", `/api/platform/files/${doc.record.id}`);
ok(download.url.includes("token="), "Private file download uses a signed URL");
await call(
  "other",
  `/api/platform/files/${doc.record.id}`,
  "GET",
  undefined,
  404,
);
await call(null, `/api/platform/files/${doc.record.id}`, "GET", undefined, 401);
const report = await call("admin", "/api/platform/overview");
ok(
  report.counts.placements >= 1,
  "Live overview counts reflect saved placements",
);
const html = await fetch(base + "/dashboard", {
  headers: {
    Cookie: [...clients.learner.jar].map(([k, v]) => `${k}=${v}`).join("; "),
  },
}).then((r) => r.text());
ok(
  html.includes("Live Workspace"),
  "Server-rendered dashboard recognizes a verified session",
);
const options = await call(
  "admin",
  "/api/platform/options?resource=enrollments",
);
ok(
  options.options.profiles.some((p) => p.value === fixture.users.learner.id),
  "Form relation selectors return authorized accounts",
);
const { error: removeError } = await clients.learner.client.storage
  .from("dialife-private")
  .remove([objectPath]);
assert.ifError(removeError);
const result = {
  passed: assertions,
  createdRecords: records.length,
  authIdentities: Object.keys(clients).length,
  base,
  completedAt: new Date().toISOString(),
};
fs.writeFileSync(
  join(outputDir, "platform-http-result.json"),
  JSON.stringify(result, null, 2),
);
console.log(JSON.stringify(result));
