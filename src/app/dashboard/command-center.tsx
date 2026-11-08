"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { Icon } from "./icons";
import {
  dates,
  initialActivity,
  initialApplicants,
  initialCohorts,
  initialEmployers,
  metrics,
  pipeline,
  workspaces,
  type Applicant,
} from "./demo-data";
type ModalState =
  | { type: "cohort" | "employer" }
  | { type: "applicant"; applicant: Applicant }
  | { type: "event"; index: number }
  | null;
export function PanelHeading({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="d-panel-heading">
      <span className="d-heading-icon">
        <Icon name={icon} />
      </span>
      <div>
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
    </div>
  );
}
export function MetricCards() {
  return (
    <section className="d-metrics" aria-label="Sample platform statistics">
      {metrics.map((m) => (
        <Link
          href={`/dashboard?view=${m.view}`}
          className={`d-metric d-${m.tone}`}
          key={m.label}
        >
          <span className="d-metric-icon">
            <Icon name={m.icon} />
          </span>
          <div>
            <strong>{m.value}</strong>
            <p>{m.label}</p>
            <span className="d-trend">
              <Icon name="up" />
              {m.change}
            </span>
          </div>
        </Link>
      ))}
    </section>
  );
}
export function Pipeline() {
  return (
    <section className="d-panel d-pipeline">
      <PanelHeading
        icon="chart"
        title="Training & Placement Overview"
        subtitle="Pipeline from application to placement"
      />
      <ol>
        {pipeline.map((p, i) => (
          <li
            key={p.label}
            style={{ marginLeft: `${i * 2.2}%`, marginRight: `${i * 1.5}%` }}
          >
            <div
              className={`d-pipeline-fill d-${p.tone}`}
              style={{ width: `${p.width}%` }}
            />
            <span>
              <Icon name={p.icon} />
              {p.label}
            </span>
            <strong>{p.value}</strong>
          </li>
        ))}
      </ol>
    </section>
  );
}
export function CommandCenter() {
  const params = useSearchParams();
  const view = params.get("view") || "";
  const [applicants, setApplicants] = useState(initialApplicants);
  const [cohorts, setCohorts] = useState(initialCohorts);
  const [employers, setEmployers] = useState(initialEmployers);
  const [activity, setActivity] = useState(initialActivity);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [modal, setModal] = useState<ModalState>(null);
  const [notice, setNotice] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    if (!modal && dialog.current?.open) dialog.current.close();
  }, [modal]);
  useEffect(() => {
    setSearch("");
    setFilter("All");
    setNotice("");
  }, [view]);
  function close() {
    setModal(null);
  }
  function addActivity(text: string) {
    setActivity((old) => [
      { text, time: "Just now · Demo", icon: "check", tone: "green" },
      ...old,
    ]);
  }
  function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const name = String(data.get("name") || "").trim();
    if (!name) return;
    if (modal?.type === "cohort") {
      setCohorts((old) => [
        {
          name,
          start: String(data.get("start")),
          trainees: Number(data.get("trainees")),
          status: "Upcoming",
        },
        ...old,
      ]);
      addActivity(`Demo cohort created: ${name}`);
      setNotice(`“${name}” created in this demo session.`);
    }
    if (modal?.type === "employer") {
      setEmployers((old) => [
        {
          name,
          country: String(data.get("country")).trim(),
          roles: Number(data.get("roles")),
          status: "Matching",
        },
        ...old,
      ]);
      addActivity(`Demo employer added: ${name}`);
      setNotice(`“${name}” added in this demo session.`);
    }
    close();
  }
  function admit(applicant: Applicant) {
    setApplicants((old) =>
      old.map((a) =>
        a.id === applicant.id ? { ...a, status: "Admitted" } : a,
      ),
    );
    addActivity(`Demo application admitted: ${applicant.name}`);
    setNotice(`${applicant.name} admitted in this demo session.`);
    close();
  }
  function exportReport() {
    const rows = [
      ["Stage", "Sample count"],
      ...pipeline.map((p) => [p.label, String(p.value)]),
    ];
    const blob = new Blob(
      [
        "Fictional Dialife demonstration data only\n" +
          rows.map((r) => r.join(",")).join("\n"),
      ],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dialife-demo-report.csv";
    a.click();
    URL.revokeObjectURL(url);
    setNotice("Sample report downloaded. It contains fictional totals only.");
  }
  const showApplicants = view === "applicants" || view === "trainees";
  const visibleApplicants = applicants.filter(
    (a) =>
      (view !== "trainees" ||
        ["In training", "Certified"].includes(a.status)) &&
      (filter === "All" || a.status === filter) &&
      `${a.name} ${a.country} ${a.background}`
        .toLowerCase()
        .includes(search.toLowerCase()),
  );
  const toolbar = (
    <div className="d-toolbar">
      <label className="d-search">
        <Icon name="search" />
        <input
          aria-label="Search sample records"
          placeholder="Search sample records…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </label>
      {showApplicants && (
        <select
          aria-label="Filter by status"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          {[
            "All",
            "New",
            "Under review",
            "Admitted",
            "In training",
            "Certified",
          ].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      )}
    </div>
  );
  const sampleNote = (
    <p className="d-sample-note">
      <Icon name="shield" />
      Fictional preview records. Changes last for this demo session only.
    </p>
  );
  return (
    <>
      {notice && (
        <div role="status" className="d-notice">
          <Icon name="check" />
          {notice}
          <button
            aria-label="Dismiss message"
            className="d-icon-button"
            onClick={() => setNotice("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {!view ? (
        <>
          <MetricCards />
          <div className="d-content-grid">
            <div className="d-primary">
              <section className="d-access">
                <h2>Access Dashboards</h2>
                <div className="d-workspaces">
                  {workspaces.map((w) => (
                    <Link
                      href={`/dashboard/${w.id}`}
                      className={`d-workspace d-${w.tone}`}
                      key={w.id}
                    >
                      <span className="d-workspace-icon">
                        <Icon name={w.icon} />
                      </span>
                      <h3>
                        {w.id === "trainee" ? (
                          <>
                            Applicant /<br />
                            Trainee Dashboard
                          </>
                        ) : (
                          w.title
                        )}
                      </h3>
                      <p>{w.description}</p>
                      <span className="d-card-arrow">
                        <Icon name="arrow" />
                      </span>
                    </Link>
                  ))}
                </div>
              </section>
              <div className="d-bottom-grid">
                <section className="d-panel d-activity">
                  <PanelHeading
                    icon="activity"
                    title="Recent Activity"
                    subtitle="Latest updates across the platform"
                  />
                  <ul>
                    {activity.slice(0, 5).map((a, i) => (
                      <li key={a.text + i}>
                        <span className={`d-activity-icon d-${a.tone}`}>
                          <Icon name={a.icon} />
                        </span>
                        <div>
                          <strong>{a.text}</strong>
                          <time>{a.time}</time>
                        </div>
                      </li>
                    ))}
                  </ul>
                  <Link href="/dashboard?view=activity" className="d-text-link">
                    View All Activity <Icon name="arrow" />
                  </Link>
                </section>
                <Pipeline />
              </div>
            </div>
            <aside className="d-right-rail">
              <section className="d-panel d-dates">
                <PanelHeading icon="calendar" title="Upcoming & Key Dates" />
                <ul>
                  {dates.map((d, i) => (
                    <li key={d.title}>
                      <button
                        onClick={() => setModal({ type: "event", index: i })}
                      >
                        <span className={`d-dot d-${d.tone}`} />
                        <span>
                          <strong>{d.title}</strong>
                          <time>{d.date}</time>
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
              <section className="d-panel d-quick">
                <PanelHeading icon="zap" title="Quick Actions" />
                <div>
                  <Link href="/dashboard?view=applicants">
                    <span>
                      <Icon name="file" />
                    </span>
                    Review Applications
                    <Icon name="arrow" />
                  </Link>
                  <button onClick={() => setModal({ type: "cohort" })}>
                    <span>
                      <Icon name="users" />
                    </span>
                    Create New Cohort
                    <Icon name="arrow" />
                  </button>
                  <button onClick={() => setModal({ type: "employer" })}>
                    <span>
                      <Icon name="building" />
                    </span>
                    Add Employer Partner
                    <Icon name="arrow" />
                  </button>
                  <Link href="/dashboard?view=reports">
                    <span>
                      <Icon name="chart" />
                    </span>
                    View Reports
                    <Icon name="arrow" />
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </>
      ) : (
        <div className="d-module">
          <div className="d-module-top">
            <Link href="/dashboard" className="d-text-link">
              {" "}
              <Icon name="home" /> Command Center
            </Link>
            <span className="d-muted">Sample data workspace</span>
          </div>
          {showApplicants && (
            <section className="d-panel">
              <PanelHeading
                icon="users"
                title={
                  view === "trainees"
                    ? "Active Trainees"
                    : "Review Applications"
                }
                subtitle="Review backgrounds and follow the sample admissions journey"
              />
              {toolbar}
              <div className="d-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Applicant</th>
                      <th>Country</th>
                      <th>Background</th>
                      <th>Status</th>
                      <th>Progress</th>
                      <th>
                        <span className="d-sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleApplicants.map((a) => (
                      <tr key={a.id}>
                        <td>
                          <strong>{a.name}</strong>
                          <small>{a.id}</small>
                        </td>
                        <td>{a.country}</td>
                        <td>{a.background}</td>
                        <td>
                          <span className="d-status">{a.status}</span>
                        </td>
                        <td>
                          <progress
                            value={a.progress}
                            max="100"
                            aria-label={`${a.name} training progress`}
                          />
                          <small>{a.progress}%</small>
                        </td>
                        <td>
                          <button
                            className="d-small-button"
                            onClick={() =>
                              setModal({ type: "applicant", applicant: a })
                            }
                          >
                            Review <Icon name="arrow" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {!visibleApplicants.length && (
                  <div className="d-empty">
                    <Icon name="search" />
                    <h3>No matching sample records</h3>
                    <p>Try another name or change the status filter.</p>
                    <button
                      className="d-small-button"
                      onClick={() => {
                        setSearch("");
                        setFilter("All");
                      }}
                    >
                      Clear filters
                    </button>
                  </div>
                )}
              </div>
              {sampleNote}
            </section>
          )}
          {view === "cohorts" && (
            <section className="d-panel">
              <PanelHeading
                icon="users"
                title="Training Cohorts"
                subtitle="Organize learning groups and track their progress"
              />
              <div className="d-action-bar">
                {sampleNote}
                <button
                  className="d-primary-button"
                  onClick={() => setModal({ type: "cohort" })}
                >
                  <Icon name="plus" />
                  Create New Cohort
                </button>
              </div>
              <div className="d-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Cohort</th>
                      <th>Start date</th>
                      <th>Trainees</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cohorts.map((c, i) => (
                      <tr key={c.name + i}>
                        <td>
                          <strong>{c.name}</strong>
                        </td>
                        <td>{c.start}</td>
                        <td>{c.trainees}</td>
                        <td>
                          <span className="d-status">{c.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {view === "employers" && (
            <section className="d-panel">
              <PanelHeading
                icon="building"
                title="Employer Partners"
                subtitle="Fictional organizations for the staffing demonstration"
              />
              <div className="d-action-bar">
                {sampleNote}
                <button
                  className="d-primary-button"
                  onClick={() => setModal({ type: "employer" })}
                >
                  <Icon name="plus" />
                  Add Employer Partner
                </button>
              </div>
              {toolbar}
              <div className="d-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Organization</th>
                      <th>Market</th>
                      <th>Open roles</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employers
                      .filter((e) =>
                        e.name.toLowerCase().includes(search.toLowerCase()),
                      )
                      .map((e, i) => (
                        <tr key={e.name + i}>
                          <td>
                            <strong>{e.name}</strong>
                          </td>
                          <td>{e.country}</td>
                          <td>{e.roles}</td>
                          <td>
                            <span className="d-status">{e.status}</span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {employers.filter((e) =>
                  e.name.toLowerCase().includes(search.toLowerCase()),
                ).length === 0 && (
                  <p className="d-empty">No matching sample employers.</p>
                )}
              </div>
            </section>
          )}
          {view === "reports" && (
            <>
              <div className="d-action-bar">
                <p>Training and placement performance · fictional snapshot</p>
                <button className="d-primary-button" onClick={exportReport}>
                  <Icon name="download" />
                  Export Sample Report
                </button>
              </div>
              <MetricCards />
              <div className="d-report-grid">
                <Pipeline />
                <section className="d-panel">
                  <PanelHeading
                    icon="award"
                    title="Readiness Summary"
                    subtitle="Fictional demonstration indicators"
                  />
                  {[
                    ["Application to admission", "77%"],
                    ["Training to certification", "80%"],
                    ["Certified to placement", "89%"],
                  ].map(([label, n]) => (
                    <div className="d-report-line" key={label}>
                      <span>{label}</span>
                      <strong>{n}</strong>
                    </div>
                  ))}
                  {sampleNote}
                </section>
              </div>
            </>
          )}
          {view === "programs" && (
            <section className="d-panel">
              <PanelHeading
                icon="book"
                title="Medical VA Academy"
                subtitle="Four weeks of practical healthcare administration training"
              />
              <div className="d-program-grid">
                {[
                  [
                    "Healthcare foundations",
                    "Terminology, confidentiality and remote work",
                  ],
                  [
                    "Administrative workflows",
                    "Scheduling, EHR practice, referrals and insurance basics",
                  ],
                  [
                    "Communication & simulations",
                    "Synthetic patient calls and responsible AI assistance",
                  ],
                  [
                    "Assessment & readiness",
                    "Practical assessment, feedback and professional preparation",
                  ],
                ].map(([title, description], i) => (
                  <article key={title}>
                    <span className="d-status">Week {i + 1}</span>
                    <h3>{title}</h3>
                    <p>{description}</p>
                    <Link href="/dashboard/trainee" className="d-text-link">
                      Explore learning <Icon name="arrow" />
                    </Link>
                  </article>
                ))}
              </div>
            </section>
          )}
          {view === "assessments" && (
            <section className="d-panel">
              <PanelHeading
                icon="clipboard"
                title="Simulation Assessments"
                subtitle="Practice and review with synthetic scenarios only"
              />
              <div className="d-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Assessment</th>
                      <th>Cohort</th>
                      <th>Submitted</th>
                      <th>Status</th>
                      <th>Workspace</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      "Patient scheduling call",
                      "Confidentiality and privacy quiz",
                      "Referral handover exercise",
                    ].map((s, i) => (
                      <tr key={s}>
                        <td>
                          <strong>{s}</strong>
                        </td>
                        <td>MV-2025-03</td>
                        <td>{24 - i * 3} / 28</td>
                        <td>
                          <span className="d-status">
                            {i === 0 ? "Under review" : "In progress"}
                          </span>
                        </td>
                        <td>
                          <Link
                            className="d-text-link"
                            href="/dashboard/trainer"
                          >
                            Trainer review <Icon name="arrow" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {sampleNote}
            </section>
          )}
          {view === "placements" && (
            <section className="d-panel">
              <PanelHeading
                icon="briefcase"
                title="Medical VA Placements"
                subtitle="Follow the sample hiring and onboarding pathway"
              />
              <div className="d-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Medical VA</th>
                      <th>Employer</th>
                      <th>Role</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {["Zuri Kamau", "Maya Achieng", "Ethan Bello"].map(
                      (name, i) => (
                        <tr key={name}>
                          <td>
                            <strong>{name}</strong>
                          </td>
                          <td>{initialEmployers[i].name}</td>
                          <td>Medical Administrative VA</td>
                          <td>
                            <span className="d-status">
                              {["Placed", "Interviewing", "Matching"][i]}
                            </span>
                          </td>
                        </tr>
                      ),
                    )}
                  </tbody>
                </table>
              </div>
              {sampleNote}
              <Link
                href="/dashboard/medical-va"
                className="d-text-link d-inset"
              >
                Open Medical VA Dashboard <Icon name="arrow" />
              </Link>
            </section>
          )}
          {view === "activity" && (
            <section className="d-panel d-activity d-full-activity">
              <PanelHeading
                icon="activity"
                title="All Activity"
                subtitle="Latest updates in the fictional workspace"
              />
              <ul>
                {activity.map((a, i) => (
                  <li key={a.text + i}>
                    <span className={`d-activity-icon d-${a.tone}`}>
                      <Icon name={a.icon} />
                    </span>
                    <div>
                      <strong>{a.text}</strong>
                      <time>{a.time}</time>
                    </div>
                  </li>
                ))}
              </ul>
              {sampleNote}
            </section>
          )}
          {![
            "applicants",
            "trainees",
            "cohorts",
            "employers",
            "reports",
            "programs",
            "assessments",
            "placements",
            "activity",
          ].includes(view) && (
            <section className="d-panel d-empty">
              <h2>Workspace not found</h2>
              <Link href="/dashboard" className="d-text-link">
                Return to the Command Center <Icon name="arrow" />
              </Link>
            </section>
          )}
        </div>
      )}
      <dialog
        ref={dialog}
        className="d-modal"
        aria-labelledby="demo-dialog-title"
        onCancel={close}
        onClose={close}
        onClick={(e) => {
          if (e.target === dialog.current) close();
        }}
      >
        {modal && (
          <>
            <button
              aria-label="Close dialog"
              className="d-modal-close d-icon-button"
              onClick={close}
            >
              <Icon name="close" />
            </button>
            <span className="d-status">Demo Mode · Fictional Data</span>
            {modal.type === "event" ? (
              <>
                <h2 id="demo-dialog-title">{dates[modal.index].title}</h2>
                <p className="d-event-date">
                  <Icon name="calendar" />
                  {dates[modal.index].date}
                </p>
                <p>{dates[modal.index].detail}</p>
                <p className="d-muted">
                  Dates follow the approved sample design and do not represent a
                  live schedule.
                </p>
                <button className="d-primary-button" onClick={close}>
                  Got it
                </button>
              </>
            ) : modal.type === "applicant" ? (
              <>
                <h2 id="demo-dialog-title">{modal.applicant.name}</h2>
                <dl>
                  <dt>Application</dt>
                  <dd>{modal.applicant.id}</dd>
                  <dt>Background</dt>
                  <dd>{modal.applicant.background}</dd>
                  <dt>Country</dt>
                  <dd>{modal.applicant.country}</dd>
                  <dt>Status</dt>
                  <dd>{modal.applicant.status}</dd>
                </dl>
                <p className="d-muted">
                  This is a fictional applicant. Review actions affect the
                  demonstration only.
                </p>
                <div className="d-modal-actions">
                  <button className="d-secondary-button" onClick={close}>
                    Close
                  </button>
                  {["New", "Under review"].includes(modal.applicant.status) && (
                    <button
                      className="d-primary-button"
                      onClick={() => admit(modal.applicant)}
                    >
                      Admit Demo Applicant
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <h2 id="demo-dialog-title">
                  {modal.type === "cohort"
                    ? "Create New Cohort"
                    : "Add Employer Partner"}
                </h2>
                <p className="d-muted">
                  Use fictional details. This action saves to the demo session
                  only.
                </p>
                <form onSubmit={create}>
                  <label>
                    {modal.type === "cohort"
                      ? "Cohort name"
                      : "Organization name"}
                    <input
                      name="name"
                      required
                      maxLength={100}
                      placeholder={
                        modal.type === "cohort"
                          ? "Cohort MV-DEMO-05"
                          : "Example Health Clinic"
                      }
                    />
                  </label>
                  {modal.type === "cohort" ? (
                    <>
                      <label>
                        Start date
                        <input name="start" type="date" required />
                      </label>
                      <label>
                        Trainee capacity
                        <input
                          name="trainees"
                          type="number"
                          min="1"
                          max="200"
                          defaultValue="30"
                          required
                        />
                      </label>
                    </>
                  ) : (
                    <>
                      <label>
                        Market / country
                        <input
                          name="country"
                          required
                          maxLength={80}
                          placeholder="Canada"
                        />
                      </label>
                      <label>
                        Open roles
                        <input
                          name="roles"
                          type="number"
                          min="1"
                          max="100"
                          defaultValue="1"
                          required
                        />
                      </label>
                    </>
                  )}
                  <div className="d-modal-actions">
                    <button
                      className="d-secondary-button"
                      type="button"
                      onClick={close}
                    >
                      Cancel
                    </button>
                    <button className="d-primary-button" type="submit">
                      {modal.type === "cohort"
                        ? "Create Demo Cohort"
                        : "Add Demo Employer"}
                    </button>
                  </div>
                </form>
              </>
            )}
          </>
        )}
      </dialog>
    </>
  );
}
