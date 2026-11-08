"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import { Suspense, useRef } from "react";
import { Icon } from "./icons";
import { roleContent, type Role } from "./demo-data";
import { useWorkspace } from "./workspace-context";
import { resources, roleLabels } from "@/lib/platform/resources";
import { createBrowserSupabase } from "@/lib/supabase/browser";
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
  const { identity, live, href: workspaceHref } = useWorkspace();
  const params = useSearchParams();
  const drawer = useRef<HTMLDialogElement>(null);
  const role = path.split("/")[2] as Role;
  const view = params.get("view") || "";
  const title =
    (live && resources[view]?.label) ||
    roleContent[role]?.title ||
    viewTitles[view] ||
    "Operations Command Center";
  const subtitle =
    roleContent[role]?.subtitle ||
    (view
      ? live
        ? "Your live records, learning and operations."
        : "Explore and manage the fictional Dialife demonstration workspace."
      : "Welcome to Dialife Medical VA. Oversee training, placements and operations across the program.");
  const nav = (
    <>
      <Link
        href={workspaceHref("/dashboard")}
        className="d-logo"
        aria-label="Dialife Medical VA dashboard"
        onClick={() => drawer.current?.close()}
      >
        <Image
          unoptimized
          priority
          src="/dashboard/dialife-logo.png"
          alt="Dialife Medical VA"
          width={238}
          height={70}
        />
      </Link>
      <nav aria-label="Dashboard navigation">
        {navigation
          .filter(
            ([label]) =>
              !live ||
              identity?.role === "admin" ||
              label === "Dashboard" ||
              label === "Programs" ||
              label === "Cohorts" ||
              label === "Assessments" ||
              (label === "Employers" && identity?.role === "employer") ||
              (label === "Trainers" && identity?.role === "trainer") ||
              (label === "Medical VAs" && identity?.role === "medical_va") ||
              (label === "Placements" && identity?.role === "medical_va"),
          )
          .map(([label, href, icon], i) => {
            const active = href.includes("?")
              ? path === "/dashboard" && view === href.split("=")[1]
              : path === href && (!view || href !== "/dashboard");
            return (
              <Link
                key={label}
                href={workspaceHref(href)}
                className={`d-nav-link ${active ? "is-active" : ""} ${i === 6 ? "d-nav-divider" : ""}`}
                aria-current={active ? "page" : undefined}
                onClick={() => drawer.current?.close()}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            );
          })}
        {live &&
          [
            ["Learning Progress", "progress", "chart"],
            ["Calendar", "calendar", "calendar"],
            ["Private Documents", "documents", "file"],
            ["Simulation Practice", "simulations", "stethoscope"],
            ["Support", "support", "info"],
            ["Notifications", "notifications", "zap"],
            ["User Accounts", "profiles", "user"],
          ]
            .filter(([, key]) => resources[key].read.includes(identity!.role))
            .map(([label, key, icon]) => (
              <Link
                key={key}
                href={`/dashboard?view=${key}`}
                className={`d-nav-link ${view === key ? "is-active" : ""}`}
                onClick={() => drawer.current?.close()}
              >
                <Icon name={icon} />
                <span>{label}</span>
              </Link>
            ))}
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
            title={
              live
                ? "Authenticated records available to your role."
                : "All dashboard data is fictional. No private records are loaded."
            }
          >
            <Icon name="info" />
            {live ? "Live Workspace" : "Demo Mode (Sample Data)"}
          </span>
          <details className="d-account">
            <summary aria-label="Demo administrator account">
              <span className="d-avatar">
                <Icon name="user" />
              </span>
              <span className="d-account-copy">
                <strong>
                  {live ? identity?.email : "Admin@dialifeva.com"}
                </strong>
                <small>
                  {live ? roleLabels[identity!.role] : "Super Administrator"}
                </small>
              </span>
              <Icon name="down" />
            </summary>
            <div className="d-account-popover">
              <strong>
                {live ? identity?.displayName : "Demo administrator"}
              </strong>
              <p>
                {live
                  ? "Your workspace uses authenticated access and saves authorized changes."
                  : "This identity is for the preview. It does not grant access to private records."}
              </p>
              <span>
                <Icon name="shield" />{" "}
                {live ? "Private account access" : "Fictional data only"}
              </span>
              {!live && (
                <Link href="/login">
                  Sign in to your live workspace <Icon name="arrow" />
                </Link>
              )}
              {live && (
                <>
                  <Link href="/dashboard?mode=demo">
                    View sample dashboard <Icon name="arrow" />
                  </Link>
                  <button
                    className="d-signout"
                    onClick={async () => {
                      await createBrowserSupabase().auth.signOut();
                      window.location.assign("/dashboard");
                    }}
                  >
                    Sign out
                  </button>
                </>
              )}
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
