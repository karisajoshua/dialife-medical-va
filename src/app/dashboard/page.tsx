import Link from "next/link";
export const metadata = { title: "Dialife Platform Dashboards" };
const roles = [
["admin","Operations Admin","Admissions, employer enquiries, training oversight and quality controls."],
["trainee","Applicant & Trainee","Enrollment, learning plan, assessments and progress."],
["trainer","Trainer","Cohorts, exercises, marking and learner support."],
["employer","Employer","Staffing requests, candidate matching and onboarding."],
["medical-va","Medical VA","Assignments, schedules, timesheets and support."]
];
export default function DashboardIndex(){return <main className="content-page"><span className="content-kicker">PLATFORM WORKSPACE PREVIEWS</span><h1>One platform. Five dedicated workspaces.</h1><p className="lead">Explore the Dialife platform. These are demonstration dashboards with fictional examples, not live applicant or customer data.</p><div className="content-grid">{roles.map(([id,name,description])=><section className="content-card" key={id}><h2>{name}</h2><p>{description}</p><Link className="button outline" href={`/dashboard/${id}`}>Open preview →</Link></section>)}</div><p>Authentication and access to private records will be enabled before live dashboard operations.</p></main>}