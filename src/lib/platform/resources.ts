export type PlatformRole =
  | "admin"
  | "applicant"
  | "trainer"
  | "employer"
  | "medical_va";
export type Field = {
  key: string;
  label: string;
  type?:
    | "text"
    | "textarea"
    | "number"
    | "date"
    | "datetime-local"
    | "select"
    | "checkbox"
    | "email"
    | "url";
  required?: boolean;
  options?: string[];
  relation?: string;
  roles?: PlatformRole[];
  createOnly?: boolean;
  editOnly?: boolean;
  min?: number;
  max?: number;
  defaultValue?: string | number | boolean;
};
export type Resource = {
  table: string;
  label: string;
  singular: string;
  description: string;
  group: string;
  icon: string;
  read: PlatformRole[];
  create: PlatformRole[];
  edit: PlatformRole[];
  fields: Field[];
  columns: string[];
  primaryKey?: string;
  search?: string;
  order?: string;
  descending?: boolean;
  actor?: string;
  readOnly?: boolean;
};
const ALL: PlatformRole[] = [
  "admin",
  "applicant",
  "trainer",
  "employer",
  "medical_va",
];
const LEARN: PlatformRole[] = ["admin", "applicant", "trainer", "medical_va"];
const STAFF: PlatformRole[] = ["admin", "trainer"];
const HIRING: PlatformRole[] = ["admin", "employer", "applicant", "medical_va"];
const WORK: PlatformRole[] = ["admin", "employer", "medical_va"];
const ADMIN: PlatformRole[] = ["admin"];
const EMPLOYER: PlatformRole[] = ["admin", "employer"];
const SELF: PlatformRole[] = ["admin", "applicant", "medical_va"];
const title = (label = "Title"): Field => ({
  key: "title",
  label,
  required: true,
  max: 160,
});
const text = (key: string, label: string, required = false): Field => ({
  key,
  label,
  type: "textarea",
  required,
  max: 10000,
});
const rel = (
  key: string,
  label: string,
  relation: string,
  roles?: PlatformRole[],
  required = true,
): Field => ({
  key,
  label,
  relation,
  type: "select",
  required,
  roles,
  createOnly: true,
});
const status = (values: string[], defaultValue?: string): Field => ({
  key: "status",
  label: "Status",
  type: "select",
  options: values,
  defaultValue: defaultValue || values[0],
  required: true,
});
const dt = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "datetime-local",
  required,
});
const date = (key: string, label: string, required = true): Field => ({
  key,
  label,
  type: "date",
  required,
});
const number = (
  key: string,
  label: string,
  min: number,
  max: number,
  defaultValue?: number,
): Field => ({
  key,
  label,
  type: "number",
  required: true,
  min,
  max,
  defaultValue,
});
const resource = (
  table: string,
  label: string,
  singular: string,
  group: string,
  icon: string,
  read: PlatformRole[],
  create: PlatformRole[],
  edit: PlatformRole[],
  fields: Field[],
  columns: string[],
  extra: Partial<Resource> = {},
): Resource => ({
  table,
  label,
  singular,
  description: `Manage ${label.toLowerCase()} available to your account.`,
  group,
  icon,
  read,
  create,
  edit,
  fields,
  columns,
  search: fields.some((f) => f.key === "title") ? "title" : undefined,
  order: "created_at",
  descending: true,
  ...extra,
});
export const resources: Record<string, Resource> = {
  applications: resource(
    "candidate_applications",
    "Applications",
    "Application",
    "Admissions",
    "users",
    ["admin", "applicant"],
    [],
    ADMIN,
    [
      status([
        "new",
        "reviewing",
        "shortlisted",
        "declined",
        "admitted",
        "enrolled",
        "completed",
        "certified",
        "placed",
      ]),
      text("review_notes", "Review notes"),
    ],
    ["full_name", "country", "medical_background", "status", "created_at"],
    { search: "full_name" },
  ),
  enquiries: resource(
    "employer_enquiries",
    "Employer Enquiries",
    "Enquiry",
    "Recruitment",
    "building",
    ADMIN,
    [],
    ADMIN,
    [status(["new", "contacted", "qualified", "closed"])],
    ["organization", "contact_name", "country", "expected_headcount", "status"],
    { search: "organization" },
  ),
  profiles: resource(
    "platform_profiles",
    "User Accounts",
    "Account",
    "Administration",
    "user",
    ALL,
    [],
    ALL,
    [
      { key: "display_name", label: "Display name", required: true, max: 120 },
      { key: "avatar_url", label: "Avatar URL", type: "url" },
      {
        key: "role",
        label: "Account role",
        type: "select",
        options: ALL,
        roles: ADMIN,
      },
    ],
    ["display_name", "role", "created_at"],
    { primaryKey: "user_id", search: "display_name" },
  ),
  programs: resource(
    "training_programs",
    "Programs",
    "Program",
    "Learning",
    "book",
    LEARN,
    ADMIN,
    ADMIN,
    [
      title(),
      text("description", "Description"),
      number("duration_weeks", "Duration in weeks", 1, 104, 4),
      status(["draft", "published", "archived"]),
    ],
    ["title", "duration_weeks", "status", "created_at"],
  ),
  modules: resource(
    "program_modules",
    "Course Modules",
    "Module",
    "Learning",
    "layers",
    LEARN,
    ADMIN,
    ADMIN,
    [
      rel("program_id", "Program", "programs"),
      title(),
      text("description", "Description"),
      number("position", "Module order", 1, 100, 1),
    ],
    ["title", "program_id", "position"],
  ),
  lessons: resource(
    "training_lessons",
    "Lessons",
    "Lesson",
    "Learning",
    "book",
    LEARN,
    ADMIN,
    ADMIN,
    [
      rel("module_id", "Module", "modules"),
      title(),
      { ...text("content", "Lesson content"), max: 50000 },
      { key: "resource_url", label: "Resource URL", type: "url" },
      number("position", "Lesson order", 1, 1000, 1),
      number("duration_minutes", "Duration in minutes", 1, 600, 30),
      status(["draft", "published", "archived"]),
    ],
    ["title", "module_id", "duration_minutes", "status"],
  ),
  progress: resource(
    "lesson_progress",
    "Learning Progress",
    "Progress Record",
    "Learning",
    "chart",
    LEARN,
    SELF,
    SELF,
    [
      rel("lesson_id", "Lesson", "lessons"),
      rel("user_id", "Learner", "profiles", ADMIN),
      {
        key: "completed",
        label: "Lesson completed",
        type: "checkbox",
        defaultValue: false,
      },
    ],
    ["lesson_id", "user_id", "completed", "completed_at"],
    { actor: "user_id" },
  ),
  cohorts: resource(
    "training_cohorts",
    "Cohorts",
    "Cohort",
    "Learning",
    "users",
    LEARN,
    ADMIN,
    ADMIN,
    [
      title("Cohort name"),
      rel("program_id", "Program", "programs"),
      date("start_date", "Start date", false),
      date("end_date", "End date", false),
      number("capacity", "Trainee capacity", 1, 1000, 30),
      status(["draft", "open", "active", "completed"]),
    ],
    ["title", "program_id", "start_date", "capacity", "status"],
  ),
  enrollments: resource(
    "cohort_enrollments",
    "Enrollments",
    "Enrollment",
    "Learning",
    "users",
    LEARN,
    ADMIN,
    STAFF,
    [
      rel("cohort_id", "Cohort", "cohorts"),
      rel("trainee_id", "Learner", "profiles"),
      status(["enrolled", "active", "completed", "withdrawn"]),
    ],
    ["cohort_id", "trainee_id", "status", "created_at"],
  ),
  trainers: resource(
    "cohort_trainers",
    "Trainer Assignments",
    "Trainer Assignment",
    "Learning",
    "graduation",
    LEARN,
    ADMIN,
    [],
    [
      rel("cohort_id", "Cohort", "cohorts"),
      rel("trainer_id", "Trainer", "profiles"),
    ],
    ["cohort_id", "trainer_id", "created_at"],
  ),
  sessions: resource(
    "training_sessions",
    "Training Sessions",
    "Session",
    "Learning",
    "calendar",
    LEARN,
    STAFF,
    STAFF,
    [
      rel("cohort_id", "Cohort", "cohorts"),
      title(),
      dt("starts_at", "Starts at"),
      dt("ends_at", "Ends at"),
      { key: "meeting_url", label: "Meeting URL", type: "url" },
      status(["scheduled", "completed", "cancelled"]),
    ],
    ["title", "cohort_id", "starts_at", "ends_at", "status"],
  ),
  attendance: resource(
    "attendance_records",
    "Attendance",
    "Attendance Record",
    "Learning",
    "clipboard",
    LEARN,
    STAFF,
    STAFF,
    [
      rel("session_id", "Session", "sessions"),
      rel("trainee_id", "Learner", "profiles"),
      status(["present", "absent", "late", "excused"]),
      text("notes", "Notes"),
    ],
    ["session_id", "trainee_id", "status", "created_at"],
    { actor: "recorded_by" },
  ),
  assignments: resource(
    "training_assignments",
    "Assessments",
    "Assessment",
    "Learning",
    "clipboard",
    LEARN,
    STAFF,
    STAFF,
    [
      rel("cohort_id", "Cohort", "cohorts"),
      title(),
      text("instructions", "Instructions", true),
      dt("due_at", "Due at", false),
      {
        key: "assessment_type",
        label: "Assessment type",
        type: "select",
        options: ["assignment", "quiz", "simulation", "practical"],
        required: true,
      },
    ],
    ["title", "cohort_id", "assessment_type", "due_at"],
  ),
  submissions: resource(
    "assignment_submissions",
    "Submissions & Feedback",
    "Submission",
    "Learning",
    "file",
    LEARN,
    SELF,
    LEARN,
    [
      rel("assignment_id", "Assessment", "assignments"),
      rel("trainee_id", "Learner", "profiles", ADMIN),
      { ...text("response", "Your response", true), roles: SELF },
      {
        key: "score",
        label: "Score / 100",
        type: "number",
        min: 0,
        max: 100,
        roles: STAFF,
        editOnly: true,
      },
      { ...text("feedback", "Trainer feedback"), roles: STAFF, editOnly: true },
    ],
    ["assignment_id", "trainee_id", "score", "submitted_at"],
    { actor: "trainee_id", order: "submitted_at" },
  ),
  certificates: resource(
    "certificates",
    "Certificates",
    "Certificate",
    "Learning",
    "award",
    LEARN,
    ADMIN,
    ADMIN,
    [
      rel("enrollment_id", "Completed enrollment", "enrollments"),
      status(["issued", "revoked"]),
      text("notes", "Notes"),
    ],
    ["certificate_number", "user_id", "status", "issued_at"],
    { search: "certificate_number" },
  ),
  organizations: resource(
    "employer_organizations",
    "Employer Partners",
    "Employer Partner",
    "Recruitment",
    "building",
    WORK,
    ADMIN,
    ADMIN,
    [
      { key: "name", label: "Organization name", required: true, max: 160 },
      { key: "country", label: "Country", required: true, max: 100 },
      {
        key: "time_zone",
        label: "Time zone (IANA)",
        required: true,
        defaultValue: "UTC",
      },
      { key: "contact_email", label: "Contact email", type: "email" },
      status(["onboarding", "active", "inactive"]),
    ],
    ["name", "country", "time_zone", "status"],
    { search: "name" },
  ),
  memberships: resource(
    "organization_memberships",
    "Employer Team Access",
    "Membership",
    "Administration",
    "building",
    ["admin", "employer"],
    ADMIN,
    [],
    [
      rel("organization_id", "Organization", "organizations"),
      rel("user_id", "Employer account", "profiles"),
    ],
    ["organization_id", "user_id", "created_at"],
  ),
  candidates: resource(
    "candidate_profiles",
    "Candidate Profiles",
    "Candidate Profile",
    "Recruitment",
    "users",
    ALL,
    SELF,
    SELF,
    [
      rel("user_id", "Candidate", "profiles", ADMIN),
      { key: "display_name", label: "Profile name", required: true, max: 120 },
      text("bio", "Professional introduction"),
      { key: "skills", label: "Skills", max: 3000 },
      {
        key: "time_zone",
        label: "Time zone (IANA)",
        required: true,
        defaultValue: "Africa/Nairobi",
      },
      {
        key: "availability",
        label: "Availability",
        required: true,
        defaultValue: "Not specified",
      },
      {
        key: "published",
        label: "Available for employer matching",
        type: "checkbox",
        defaultValue: false,
      },
      {
        key: "readiness",
        label: "Readiness",
        type: "select",
        options: ["training", "ready", "placed"],
        roles: ADMIN,
      },
    ],
    ["display_name", "skills", "availability", "readiness", "published"],
    { primaryKey: "user_id", search: "display_name", actor: "user_id" },
  ),
  requests: resource(
    "staffing_requests",
    "Staffing Requests",
    "Staffing Request",
    "Recruitment",
    "briefcase",
    HIRING,
    EMPLOYER,
    EMPLOYER,
    [
      rel("organization_id", "Employer organization", "organizations"),
      title("Role title"),
      text("requirements", "Role requirements", true),
      number("headcount", "Number of positions", 1, 1000, 1),
      {
        key: "time_zone",
        label: "Time zone (IANA)",
        required: true,
        defaultValue: "UTC",
      },
      status(
        ["draft", "open", "matching", "interviewing", "filled", "closed"],
        "open",
      ),
    ],
    ["title", "organization_id", "headcount", "status", "created_at"],
  ),
  matches: resource(
    "candidate_matches",
    "Candidate Matching",
    "Candidate Match",
    "Recruitment",
    "users",
    HIRING,
    ADMIN,
    EMPLOYER,
    [
      rel("request_id", "Staffing request", "requests"),
      rel("candidate_id", "Candidate", "candidates"),
      status(["shortlisted", "interviewing", "offered", "placed", "declined"]),
      text("notes", "Matching notes"),
    ],
    ["candidate_id", "request_id", "status", "created_at"],
  ),
  interviews: resource(
    "interviews",
    "Interviews",
    "Interview",
    "Recruitment",
    "calendar",
    HIRING,
    EMPLOYER,
    EMPLOYER,
    [
      rel("match_id", "Candidate match", "matches"),
      dt("starts_at", "Starts at"),
      number("duration_minutes", "Duration in minutes", 10, 240, 30),
      { key: "meeting_url", label: "Meeting URL", type: "url" },
      status(["scheduled", "completed", "cancelled"]),
      text("feedback", "Interview feedback"),
    ],
    ["match_id", "starts_at", "duration_minutes", "status"],
  ),
  placements: resource(
    "placements",
    "Placements",
    "Placement",
    "VA Work",
    "briefcase",
    WORK,
    ADMIN,
    ADMIN,
    [
      rel("request_id", "Staffing request", "requests"),
      rel("medical_va_id", "Medical VA", "profiles"),
      title("Placement title"),
      date("start_date", "Start date"),
      date("end_date", "End date", false),
      status(["onboarding", "active", "completed", "ended"]),
    ],
    ["title", "medical_va_id", "start_date", "status"],
  ),
  tasks: resource(
    "va_tasks",
    "Work Tasks",
    "Task",
    "VA Work",
    "clipboard",
    WORK,
    EMPLOYER,
    WORK,
    [
      rel("placement_id", "Placement", "placements"),
      { ...title(), roles: EMPLOYER },
      { ...text("description", "Instructions"), roles: EMPLOYER },
      { ...dt("due_at", "Due at", false), roles: EMPLOYER },
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["low", "normal", "high"],
        defaultValue: "normal",
        roles: EMPLOYER,
      },
      status(["todo", "in_progress", "done"]),
      text("notes", "Progress notes"),
    ],
    ["title", "placement_id", "due_at", "priority", "status"],
  ),
  schedules: resource(
    "work_schedules",
    "Work Schedules",
    "Shift",
    "VA Work",
    "calendar",
    WORK,
    EMPLOYER,
    EMPLOYER,
    [
      rel("placement_id", "Placement", "placements"),
      title("Shift title"),
      dt("starts_at", "Starts at"),
      dt("ends_at", "Ends at"),
      {
        key: "time_zone",
        label: "Time zone (IANA)",
        required: true,
        defaultValue: "UTC",
      },
      text("notes", "Handover notes"),
    ],
    ["title", "placement_id", "starts_at", "ends_at", "time_zone"],
  ),
  timesheets: resource(
    "timesheets",
    "Timesheets",
    "Time Entry",
    "VA Work",
    "chart",
    WORK,
    ["admin", "medical_va"],
    WORK,
    [
      rel("placement_id", "Placement", "placements"),
      rel("user_id", "Medical VA", "profiles", ADMIN),
      { ...date("work_date", "Work date"), roles: ["admin", "medical_va"] },
      {
        ...number("minutes_worked", "Minutes worked", 1, 1440, 60),
        roles: ["admin", "medical_va"],
      },
      {
        ...text("description", "Work summary", true),
        roles: ["admin", "medical_va"],
      },
      status(["draft", "submitted", "approved", "rejected"]),
    ],
    ["work_date", "placement_id", "minutes_worked", "status"],
    { actor: "user_id" },
  ),
  support: resource(
    "support_tickets",
    "Support Tickets",
    "Support Ticket",
    "Operations",
    "info",
    ALL,
    ALL,
    ALL,
    [
      title("Subject"),
      text("description", "Describe the issue", true),
      {
        key: "priority",
        label: "Priority",
        type: "select",
        options: ["low", "normal", "high"],
        defaultValue: "normal",
      },
      rel("assigned_to", "Assigned staff", "profiles", ADMIN, false),
      {
        ...status(["open", "in_progress", "resolved", "closed"]),
        editOnly: true,
      },
    ],
    ["title", "owner_id", "priority", "status", "created_at"],
    { actor: "owner_id" },
  ),
  messages: resource(
    "ticket_messages",
    "Support Replies",
    "Reply",
    "Operations",
    "file",
    ALL,
    ALL,
    [],
    [
      rel("ticket_id", "Support ticket", "support"),
      text("body", "Reply", true),
    ],
    ["ticket_id", "author_id", "body", "created_at"],
    { actor: "author_id" },
  ),
  calendar: resource(
    "calendar_events",
    "Calendar",
    "Event",
    "Operations",
    "calendar",
    ALL,
    ADMIN,
    ADMIN,
    [
      title(),
      text("description", "Details"),
      dt("starts_at", "Starts at"),
      dt("ends_at", "Ends at"),
      {
        key: "audience",
        label: "Audience",
        type: "select",
        options: ["all", "cohort", "organization", "individual"],
        required: true,
      },
      rel(
        "cohort_id",
        "Cohort (for cohort audience)",
        "cohorts",
        undefined,
        false,
      ),
      rel(
        "organization_id",
        "Organization (for organization audience)",
        "organizations",
        undefined,
        false,
      ),
      rel(
        "user_id",
        "Account (for individual audience)",
        "profiles",
        undefined,
        false,
      ),
    ],
    ["title", "starts_at", "ends_at", "audience"],
  ),
  notifications: resource(
    "notifications",
    "Notifications",
    "Notification",
    "Operations",
    "zap",
    ALL,
    ADMIN,
    ALL,
    [
      rel("user_id", "Recipient", "profiles", ADMIN),
      { ...title(), roles: ADMIN },
      { ...text("body", "Message"), roles: ADMIN },
      {
        key: "read_at",
        label: "Read at",
        type: "datetime-local",
        editOnly: true,
      },
    ],
    ["title", "body", "read_at", "created_at"],
  ),
  activity: resource(
    "activity_events",
    "Activity Log",
    "Activity",
    "Operations",
    "activity",
    ALL,
    [],
    [],
    [],
    ["summary", "actor_id", "created_at"],
    { search: "summary", readOnly: true },
  ),
  documents: resource(
    "documents",
    "Private Documents",
    "Document",
    "Operations",
    "file",
    ALL,
    [],
    [],
    [],
    ["original_name", "category", "size_bytes", "created_at"],
    { search: "original_name", readOnly: true },
  ),
  scenarios: resource(
    "simulation_scenarios",
    "Simulation Scenarios",
    "Scenario",
    "Simulations",
    "stethoscope",
    LEARN,
    ADMIN,
    ADMIN,
    [
      rel("program_id", "Program (optional)", "programs", undefined, false),
      title(),
      text("instructions", "Synthetic scenario instructions", true),
      {
        key: "difficulty",
        label: "Difficulty",
        type: "select",
        options: ["foundation", "intermediate", "advanced"],
        required: true,
      },
      status(["draft", "published", "archived"]),
    ],
    ["title", "difficulty", "status", "program_id"],
  ),
  simulations: resource(
    "simulation_sessions",
    "Simulation Practice",
    "Practice Session",
    "Simulations",
    "stethoscope",
    LEARN,
    SELF,
    SELF,
    [
      rel("scenario_id", "Scenario", "scenarios"),
      rel("trainee_id", "Learner", "profiles", ADMIN),
      rel("cohort_id", "Cohort (optional)", "cohorts", undefined, false),
      {
        ...text("transcript", "Synthetic conversation / practice notes"),
        max: 100000,
      },
      rel(
        "audio_document_id",
        "Practice recording (optional)",
        "documents",
        undefined,
        false,
      ),
      status(["practice", "completed", "reviewed"]),
    ],
    ["scenario_id", "trainee_id", "status", "created_at"],
    { actor: "trainee_id" },
  ),
  evaluations: resource(
    "simulation_evaluations",
    "Simulation Feedback",
    "Evaluation",
    "Simulations",
    "award",
    LEARN,
    STAFF,
    STAFF,
    [
      rel("session_id", "Practice session", "simulations"),
      number("score", "Score / 100", 0, 100),
      text("feedback", "Evaluation feedback", true),
    ],
    ["session_id", "score", "reviewer_id", "created_at"],
    { actor: "reviewer_id" },
  ),
};
export function fieldsFor(
  resource: Resource,
  role: PlatformRole,
  editing = false,
) {
  return resource.fields.filter(
    (f) =>
      (!f.roles || f.roles.includes(role)) &&
      (!editing || !f.createOnly) &&
      (editing || !f.editOnly),
  );
}
export const roleLabels: Record<PlatformRole, string> = {
  admin: "Administrator",
  applicant: "Applicant / Trainee",
  trainer: "Trainer",
  employer: "Employer",
  medical_va: "Medical VA",
};
export function fieldLabel(resource: Resource, key: string) {
  return (
    resource.fields.find((f) => f.key === key)?.label ||
    (
      {
        created_at: "Created",
        submitted_at: "Submitted",
        issued_at: "Issued",
        certificate_number: "Certificate number",
        original_name: "Filename",
        size_bytes: "File size",
        user_id: "Account",
        owner_id: "Owner",
        actor_id: "By",
        reviewer_id: "Reviewer",
        read_at: "Read at",
        summary: "Activity",
        role: "Role",
      } as Record<string, string>
    )[key] ||
    key.replaceAll("_", " ")
  );
}
export function optionsFor(
  resourceKey: string,
  field: Field,
  role: PlatformRole,
) {
  if (
    resourceKey === "timesheets" &&
    field.key === "status" &&
    role !== "admin"
  )
    return role === "employer"
      ? ["approved", "rejected"]
      : ["draft", "submitted"];
  if (
    resourceKey === "simulations" &&
    field.key === "status" &&
    role !== "admin"
  )
    return ["practice", "completed"];
  return field.options;
}
