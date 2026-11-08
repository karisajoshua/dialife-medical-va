// Every value in this module is fictional. Never replace these with private records.
export const metrics = [
  {
    label: "Total Applicants",
    value: "256",
    change: "+18% this month",
    tone: "blue",
    icon: "users",
    view: "applicants",
  },
  {
    label: "Active Trainees",
    value: "178",
    change: "+12% this month",
    tone: "green",
    icon: "graduation",
    view: "trainees",
  },
  {
    label: "Partner Employers",
    value: "42",
    change: "+5 new",
    tone: "purple",
    icon: "building",
    view: "employers",
  },
  {
    label: "Placed Medical VAs",
    value: "126",
    change: "+24% this quarter",
    tone: "orange",
    icon: "briefcase",
    view: "placements",
  },
] as const;
export const workspaces = [
  {
    id: "admin",
    title: "Admin Dashboard",
    description: "Admissions, cohorts, placements, partners and operations",
    tone: "admin",
    icon: "layers",
  },
  {
    id: "trainee",
    title: "Applicant / Trainee Dashboard",
    description: "Applications, enrollment, training and progress",
    tone: "blue",
    icon: "users",
  },
  {
    id: "trainer",
    title: "Trainer Dashboard",
    description: "Cohorts, attendance, assessments and feedback",
    tone: "purple",
    icon: "graduation",
  },
  {
    id: "employer",
    title: "Employer Dashboard",
    description: "Staffing requests, candidate profiles and placements",
    tone: "teal",
    icon: "building",
  },
] as const;
export const initialActivity = [
  {
    text: "12 new applications received",
    time: "Today, 10:24 AM",
    icon: "check",
    tone: "green",
  },
  {
    text: "Cohort MV-2025-03 started (28 trainees)",
    time: "Today, 9:00 AM",
    icon: "users",
    tone: "blue",
  },
  {
    text: "5 placement confirmations",
    time: "Yesterday, 4:37 PM",
    icon: "briefcase",
    tone: "orange",
  },
  {
    text: "New employer partnership: Riverside Health",
    time: "Yesterday, 2:15 PM",
    icon: "building",
    tone: "purple",
  },
  {
    text: "Assessment results posted (Cohort MV-2025-02)",
    time: "Yesterday, 11:48 AM",
    icon: "graduation",
    tone: "blue",
  },
];
export const pipeline = [
  {
    label: "Applications",
    value: 256,
    icon: "users",
    tone: "blue",
    width: 100,
  },
  { label: "Admitted", value: 198, icon: "file", tone: "cyan", width: 81 },
  {
    label: "In Training",
    value: 178,
    icon: "graduation",
    tone: "purple",
    width: 79,
  },
  { label: "Certified", value: 142, icon: "award", tone: "green", width: 75 },
  { label: "Placed", value: 126, icon: "briefcase", tone: "green", width: 71 },
];
export const dates = [
  {
    title: "Cohort MV-2025-04 Orientation",
    date: "Mar 10, 2025",
    detail:
      "Meet your trainers, review the four-week pathway and set up your learning workspace.",
    tone: "blue",
  },
  {
    title: "Simulation Assessments",
    date: "Mar 17 – Mar 21, 2025",
    detail:
      "Practice patient scheduling and administrative calls using synthetic scenarios.",
    tone: "purple",
  },
  {
    title: "Employer Matching Round",
    date: "Mar 24 – Mar 28, 2025",
    detail:
      "Review fictional candidate shortlists and practice the interview workflow.",
    tone: "purple",
  },
  {
    title: "Cohort MV-2025-03 Graduation",
    date: "Apr 4, 2025",
    detail:
      "Celebrate completion of the sample cohort and review readiness milestones.",
    tone: "purple",
  },
];
export type Applicant = {
  id: string;
  name: string;
  country: string;
  background: string;
  status: string;
  progress: number;
};
export const initialApplicants: Applicant[] = [
  {
    id: "DEMO-001",
    name: "Amara Njeri",
    country: "Kenya",
    background: "Nursing",
    status: "New",
    progress: 0,
  },
  {
    id: "DEMO-002",
    name: "Daniel Mensah",
    country: "Ghana",
    background: "Health records",
    status: "Under review",
    progress: 0,
  },
  {
    id: "DEMO-003",
    name: "Leila Okafor",
    country: "Nigeria",
    background: "Clinical administration",
    status: "Admitted",
    progress: 25,
  },
  {
    id: "DEMO-004",
    name: "Maya Achieng",
    country: "Kenya",
    background: "Nursing",
    status: "In training",
    progress: 68,
  },
  {
    id: "DEMO-005",
    name: "Ethan Bello",
    country: "Nigeria",
    background: "Medical administration",
    status: "In training",
    progress: 82,
  },
  {
    id: "DEMO-006",
    name: "Zuri Kamau",
    country: "Kenya",
    background: "Health records",
    status: "Certified",
    progress: 100,
  },
];
export const initialCohorts = [
  {
    name: "Cohort MV-2025-03",
    start: "2025-03-03",
    trainees: 28,
    status: "In progress",
  },
  {
    name: "Cohort MV-2025-04",
    start: "2025-03-10",
    trainees: 30,
    status: "Upcoming",
  },
  {
    name: "Cohort MV-2025-02",
    start: "2025-02-03",
    trainees: 26,
    status: "Completed",
  },
];
export const initialEmployers = [
  {
    name: "Riverside Health",
    country: "United States",
    roles: 3,
    status: "Matching",
  },
  {
    name: "Maple Grove Clinic",
    country: "Canada",
    roles: 2,
    status: "Interviewing",
  },
  {
    name: "Oakwell Medical",
    country: "United Kingdom",
    roles: 1,
    status: "Onboarding",
  },
];
export const roleContent = {
  admin: {
    title: "Admin Dashboard",
    subtitle: "Admissions, cohorts, placements, partners and operations.",
    metrics: [
      ["Applications to review", "24"],
      ["Active cohorts", "6"],
      ["Employer enquiries", "8"],
      ["Placements this month", "12"],
    ],
    panels: [
      [
        "Admissions pipeline",
        "Eligibility screening",
        "Application review",
        "Enrollment decisions",
      ],
      [
        "Academy operations",
        "Cohort calendar",
        "Trainer assignments",
        "Quality review",
      ],
    ],
  },
  trainee: {
    title: "Applicant / Trainee Dashboard",
    subtitle: "Your pathway from application to practical readiness.",
    metrics: [
      ["Learning progress", "35%"],
      ["Modules completed", "4 / 12"],
      ["Assignments due", "2"],
      ["Simulation score", "82%"],
    ],
    panels: [
      [
        "My learning pathway",
        "Medical terminology",
        "Patient communication",
        "Scheduling and referrals",
      ],
      [
        "My tasks",
        "Practice scheduling call",
        "Patient privacy quiz",
        "Professional reflection",
      ],
    ],
  },
  trainer: {
    title: "Trainer Dashboard",
    subtitle: "Coordinate learning, assess skills and support your trainees.",
    metrics: [
      ["My cohorts", "2"],
      ["Active learners", "32"],
      ["Submissions to review", "11"],
      ["Upcoming sessions", "4"],
    ],
    panels: [
      [
        "Cohort management",
        "Session schedule",
        "Attendance register",
        "Learner support",
      ],
      [
        "Assessments",
        "Simulation rubrics",
        "Assignment submissions",
        "Competency checks",
      ],
    ],
  },
  employer: {
    title: "Employer Dashboard",
    subtitle: "Manage staffing requests, candidate profiles and placements.",
    metrics: [
      ["Open staffing requests", "2"],
      ["Candidate matches", "5"],
      ["Interviews scheduled", "3"],
      ["Onboarding tasks", "4"],
    ],
    panels: [
      [
        "Staffing requests",
        "Medical administrative assistant",
        "Patient scheduling coordinator",
        "Insurance support assistant",
      ],
      [
        "Hiring pathway",
        "Review candidate profiles",
        "Arrange interviews",
        "Prepare onboarding",
      ],
    ],
  },
  "medical-va": {
    title: "Medical VA Dashboard",
    subtitle:
      "Your assignments, schedule, timesheets and professional development.",
    metrics: [
      ["Assigned tasks", "18"],
      ["Hours this week", "30"],
      ["Learning refreshers", "2"],
      ["Support requests", "1"],
    ],
    panels: [
      [
        "My work",
        "Appointment scheduling",
        "Referral follow-ups",
        "End-of-day handover",
      ],
      [
        "Professional development",
        "Privacy refresher",
        "Communication skills",
        "Supervisor feedback",
      ],
    ],
  },
} as const;
export type Role = keyof typeof roleContent;
