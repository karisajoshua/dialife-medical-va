"use client";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useRef } from "react";
import { Icon } from "./icons";
import { roleContent, type Role } from "./demo-data";
const navigation = [
  ["Dashboard", "/dashboard", "home"],
  ["Admin (Operations)", "/dashboard/admin", "layers"],
  ["Applicants / Trainees", "/dashboard?view=applicants", "users"],
  ["Trainers", "/dashboard/trainer", "graduation"],
  ["Employers", "/dashboard/employer", "building"],
  ["Medical VAs", "/dashboard/medical-va", "stethoscope"],
  ["Programs", "/dashboard?view=programs", "book"],
  ["Cohorts", "/dashboard?view=cohorts", "users"],
  ["Assessments", "/dashboard?view=assessments", "clipboard"],
  ["Placements", "/dashboard?view=placements", "briefcase"],
  ["Reports", "/dashboard?view=reports", "chart"],
];
const viewTitles: Record<string, string> = {
  applicants: "Applicants / Trainees",
  trainees: "Active Trainees",
  employers: "Employer Partners",
  programs: "Training Programs",
  cohorts: "Cohorts",
  assessments: "Assessments",
  placements: "Placements",
  reports: "Reports",
  activity: "Platform Activity",
};
function Shell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const params = useSearchParams();
  const drawer = useRef<HTMLDialogElement>(null);
  const role = path.split("/")[2] as Role;
  const view = params.get("view") || "";
  const title =
    roleContent[role]?.title || viewTitles[view] || "Operations Command Center";
  const subtitle =
    roleContent[role]?.subtitle ||
    (view
      ? "Explore and manage the fictional Dialife demonstration workspace."
      : "Welcome to Dialife Medical VA. Oversee training, placements and operations across the program.");
  const nav = (
    <>
      <Link
        href="/dashboard"
        className="d-logo"
        aria-label="Dialife Medical VA dashboard"
        onClick={() => drawer.current?.close()}
      >
        <img
          src="/dashboard/dialife-logo.png"
          alt="Dialife Medical VA"
          width="238"
          height="70"
        />
      </Link>
      <nav aria-label="Dashboard navigation">
        {navigation.map(([label, href, icon], i) => {
          const active = href.includes("?")
            ? path === "/dashboard" && view === href.split("=")[1]
            : path === href && (!view || href !== "/dashboard");
          return (
            <Link
              key={label}
              href={href}
              className={`d-nav-link ${active ? "is-active" : ""} ${i === 6 ? "d-nav-divider" : ""}`}
              aria-current={active ? "page" : undefined}
              onClick={() => drawer.current?.close()}
            >
              <Icon name={icon} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
  return (
    <div className="d-root">
      <aside className="d-sidebar">{nav}</aside>
      <dialog
        ref={drawer}
        className="d-drawer"
        aria-label="Dashboard menu"
        onClick={(e) => {
          if (e.target === drawer.current) drawer.current.close();
        }}
      >
        <button
          className="d-drawer-close d-icon-button"
          aria-label="Close navigation"
          onClick={() => drawer.current?.close()}
        >
          <Icon name="close" />
        </button>
        {nav}
      </dialog>
      <div className="d-app">
        <header className="d-topbar">
          <button
            className="d-menu d-icon-button"
            aria-label="Open navigation"
            onClick={() => drawer.current?.showModal()}
          >
            <Icon name="menu" />
          </button>
          <div className="d-heading">
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <span
            className="d-demo-badge"
            title="All dashboard data is fictional. No private records are loaded."
          >
            <Icon name="info" />
            Demo Mode (Sample Data)
          </span>
          <details className="d-account">
            <summary aria-label="Demo administrator account">
              <span className="d-avatar">
                <Icon name="user" />
              </span>
              <span className="d-account-copy">
                <strong>Admin@dialifeva.com</strong>
                <small>Super Administrator</small>
              </span>
              <Icon name="down" />
            </summary>
            <div className="d-account-popover">
              <strong>Demo administrator</strong>
              <p>
                This identity is for the preview. It does not grant access to
                private records.
              </p>
              <span>
                <Icon name="shield" /> Fictional data only
              </span>
              <Link href="/">
                Visit Dialife website <Icon name="external" />
              </Link>
            </div>
          </details>
        </header>
        <main className="d-main" id="dashboard-content">
          {children}
        </main>
      </div>
    </div>
  );
}
export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
