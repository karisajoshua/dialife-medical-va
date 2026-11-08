"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  resources,
  fieldsFor,
  optionsFor,
  fieldLabel,
  roleLabels,
  type Field,
  type PlatformRole,
} from "@/lib/platform/resources";
import { createBrowserSupabase } from "@/lib/supabase/browser";
import { useWorkspace } from "./workspace-context";
import { Icon } from "./icons";
import { PanelHeading } from "./command-center";
import { workspaces, type Role } from "./demo-data";
type Row = Record<string, unknown>;
type Choice = { value: string; label: string; role?: string; status?: string };
type ChoiceMap = Record<string, Choice[]>;
type Modal = { key: string; record?: Row; defaults?: Row; view?: boolean };
type Overview = {
  counts: Record<string, number>;
  activity: Row[];
  events: Row[];
};
async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    cache: "no-store",
    headers: {
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });
  const result = await response.json();
  if (!response.ok)
    throw new Error(result.error || "This request could not be completed.");
  return result as T;
}
const aliases: Record<string, string> = {
  applicants: "applications",
  trainees: "enrollments",
  employers: "organizations",
  assessments: "assignments",
};
const roleDefaults: Record<Role, string> = {
  admin: "",
  trainee: "lessons",
  trainer: "sessions",
  employer: "requests",
  "medical-va": "tasks",
};
const relationLabels: Record<string, string> = {
  ...Object.fromEntries(
    Object.values(resources).flatMap((r) =>
      r.fields.filter((f) => f.relation).map((f) => [f.key, f.relation!]),
    ),
  ),
  actor_id: "profiles",
  owner_id: "profiles",
  reviewer_id: "profiles",
  recorded_by: "profiles",
  created_by: "profiles",
};
function valueText(value: unknown, key: string, choices: ChoiceMap) {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (key === "size_bytes") return `${(Number(value) / 1024).toFixed(1)} KB`;
  if (key.endsWith("_id")) {
    const choice = choices[relationLabels[key]]?.find((c) => c.value === value);
    return choice?.label || String(value).slice(0, 8);
  }
  if (key.endsWith("_at")) {
    const date = new Date(String(value));
    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString(undefined, {
          dateStyle: "medium",
          timeStyle: "short",
        });
  }
  return String(value).replaceAll("_", " ");
}
function csv(name: string, headers: string[], rows: unknown[][]) {
  const cell = (v: unknown) => {
    let text = String(v ?? "");
    if (/^[=+\-@\t\r]/.test(text)) text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  const data = [headers, ...rows]
      .map((row) => row.map(cell).join(","))
      .join("\r\n"),
    url = URL.createObjectURL(
      new Blob(["\uFEFF" + data], { type: "text/csv;charset=utf-8" }),
    );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = name;
  anchor.click();
  URL.revokeObjectURL(url);
}
export function LiveWorkspace({ rolePage }: { rolePage?: Role }) {
  const { identity } = useWorkspace();
  const params = useSearchParams();
  const raw = params.get("view") || "",
    key = aliases[raw] || raw || (rolePage ? roleDefaults[rolePage] : "");
  const [revision, setRevision] = useState(0),
    [overview, setOverview] = useState<Overview | null>(null),
    [summaryError, setSummaryError] = useState(""),
    [modal, setModal] = useState<Modal | null>(null),
    [notice, setNotice] = useState("");
  useEffect(() => {
    const controller = new AbortController();
    api<Overview>("/api/platform/overview", { signal: controller.signal })
      .then((data) => {
        setOverview(data);
        setSummaryError("");
      })
      .catch((e) => {
        if (e.name !== "AbortError") setSummaryError(e.message);
      });
    return () => controller.abort();
  }, [revision]);
  if (!identity) return null;
  const role = identity.role;
  const wrongRole =
    rolePage &&
    role !== "admin" &&
    roleDefaults[rolePage] !==
      roleDefaults[
        role === "applicant"
          ? "trainee"
          : role === "medical_va"
            ? "medical-va"
            : role
      ] &&
    !(rolePage === "trainee" && role === "medical_va");
  const open = (key: string, record?: Row, view = false, defaults?: Row) => {
    if (view && record) {
      const pk = resources[key].primaryKey || "id";
      void api<{ record: Row }>(`/api/platform/${key}?id=${record[pk]}`)
        .then((data) => setModal({ key, record: data.record, view: true }))
        .catch((e) => setNotice(e.message));
    } else setModal({ key, record, view, defaults });
  };
  async function saveAction(resource: string, id: string, body: Row) {
    try {
      await api(`/api/platform/${resource}?id=${id}`, {
        method: "PATCH",
        body: JSON.stringify(body),
      });
      setNotice("Changes saved.");
      setRevision((v) => v + 1);
      setModal(null);
    } catch (e) {
      setNotice(
        e instanceof Error ? e.message : "The action could not be completed.",
      );
    }
  }
  const counts = overview?.counts || {};
  const metricData =
    role === "admin"
      ? [
          ["Total Applicants", "applications", "users", "blue", "applications"],
          ["Active Trainees", "trainees", "graduation", "green", "enrollments"],
          [
            "Partner Employers",
            "employers",
            "building",
            "purple",
            "organizations",
          ],
          [
            "Placed Medical VAs",
            "placements",
            "briefcase",
            "orange",
            "placements",
          ],
        ]
      : role === "applicant"
        ? [
            [
              "My Applications",
              "applications",
              "users",
              "blue",
              "applications",
            ],
            [
              "My Enrollments",
              "trainees",
              "graduation",
              "green",
              "enrollments",
            ],
            ["My Certificates", "certified", "award", "purple", "certificates"],
            [
              "Unread Notifications",
              "unread",
              "zap",
              "orange",
              "notifications",
            ],
          ]
        : role === "trainer"
          ? [
              ["Assigned Cohorts", "cohorts", "users", "blue", "cohorts"],
              [
                "Training Sessions",
                "sessions",
                "calendar",
                "green",
                "sessions",
              ],
              [
                "Submissions to Review",
                "submissions",
                "clipboard",
                "purple",
                "submissions",
              ],
              [
                "Unread Notifications",
                "unread",
                "zap",
                "orange",
                "notifications",
              ],
            ]
          : role === "employer"
            ? [
                ["Open Requests", "requests", "briefcase", "blue", "requests"],
                [
                  "Active Placements",
                  "placements",
                  "users",
                  "green",
                  "placements",
                ],
                [
                  "Employer Partners",
                  "employers",
                  "building",
                  "purple",
                  "organizations",
                ],
                [
                  "Unread Notifications",
                  "unread",
                  "zap",
                  "orange",
                  "notifications",
                ],
              ]
            : [
                ["Open Tasks", "tasks", "clipboard", "blue", "tasks"],
                [
                  "My Placements",
                  "placements",
                  "briefcase",
                  "green",
                  "placements",
                ],
                ["Time Entries", "timesheets", "chart", "purple", "timesheets"],
                [
                  "Unread Notifications",
                  "unread",
                  "zap",
                  "orange",
                  "notifications",
                ],
              ];
  const metrics = (
    <section className="d-metrics" aria-label="Live workspace statistics">
      {metricData.map(([label, count, icon, tone, view]) => (
        <Link
          key={label}
          className={`d-metric d-${tone}`}
          href={`/dashboard?view=${view}`}
        >
          <span className="d-metric-icon">
            <Icon name={icon} />
          </span>
          <div>
            <strong>{overview ? (counts[count] ?? 0) : "—"}</strong>
            <p>{label}</p>
            <span className="d-trend d-live-count">Current total</span>
          </div>
        </Link>
      ))}
    </section>
  );
  const pipeline = [
    ["Applications", "applications", "users", "blue"],
    ["Admitted", "admitted", "file", "cyan"],
    ["In Training", "trainees", "graduation", "purple"],
    ["Certified", "certified", "award", "green"],
    ["Placed", "placements", "briefcase", "green"],
  ];
  const groups = [
    ...new Set(
      Object.values(resources)
        .filter((r) => r.read.includes(role))
        .map((r) => r.group),
    ),
  ];
  return (
    <>
      {notice && (
        <div role="status" className="d-notice">
          <Icon name="info" />
          {notice}
          <button
            className="d-icon-button"
            aria-label="Dismiss message"
            onClick={() => setNotice("")}
          >
            <Icon name="close" />
          </button>
        </div>
      )}
      {summaryError && (
        <div role="alert" className="d-live-error">
          {summaryError}
          <button
            className="d-small-button"
            onClick={() => setRevision((v) => v + 1)}
          >
            Retry
          </button>
        </div>
      )}
      <details className="d-workspace-directory">
        <summary>
          <Icon name="layers" /> Browse workspace modules
        </summary>
        <div>
          {groups.map((group) => (
            <section key={group}>
              <h3>{group}</h3>
              {Object.entries(resources)
                .filter(([, r]) => r.group === group && r.read.includes(role))
                .map(([id, r]) => (
                  <Link
                    key={id}
                    href={`/dashboard?view=${id}`}
                    aria-current={id === key ? "page" : undefined}
                  >
                    <Icon name={r.icon} />
                    {r.label}
                  </Link>
                ))}
            </section>
          ))}
        </div>
      </details>
      {wrongRole ? (
        <section className="d-panel d-empty">
          <h2>This workspace belongs to another role</h2>
          <p>Your signed-in account is a {roleLabels[role].toLowerCase()}.</p>
          <Link href="/dashboard" className="d-primary-button">
            Open my workspace
          </Link>
        </section>
      ) : key && key !== "reports" ? (
        resources[key] && resources[key].read.includes(role) ? (
          <Records
            key={key}
            resourceKey={key}
            revision={revision}
            open={open}
            changed={() => setRevision((v) => v + 1)}
            notify={setNotice}
          />
        ) : (
          <section className="d-panel d-empty">
            <h2>Workspace unavailable</h2>
            <p>This section is unavailable for your account.</p>
            <Link className="d-text-link" href="/dashboard">
              Return to your dashboard
            </Link>
          </section>
        )
      ) : (
        <>
          {key === "reports" && (
            <div className="d-action-bar">
              <p>Current totals for records available to your account.</p>
              <button
                className="d-primary-button"
                disabled={!overview}
                onClick={() =>
                  csv(
                    "dialife-workspace-report.csv",
                    ["Metric", "Count"],
                    Object.entries(counts),
                  )
                }
              >
                <Icon name="download" />
                Export Report
              </button>
            </div>
          )}
          {metrics}
          <div className="d-content-grid">
            <div className="d-primary">
              <section className="d-access">
                <h2>
                  {role === "admin" ? "Access Dashboards" : "Your Workspace"}
                </h2>
                <div className="d-workspaces">
                  {(role === "admin"
                    ? workspaces
                    : workspaces.filter(
                        (w) =>
                          w.id === (role === "applicant" ? "trainee" : role),
                      )
                  ).map((w) => (
                    <Link
                      key={w.id}
                      href={`/dashboard/${w.id}`}
                      className={`d-workspace d-${w.tone}`}
                    >
                      <span className="d-workspace-icon">
                        <Icon name={w.icon} />
                      </span>
                      <h3>{w.title}</h3>
                      <p>{w.description}</p>
                      <span className="d-card-arrow">
                        <Icon name="arrow" />
                      </span>
                    </Link>
                  ))}
                  {role === "medical_va" && (
                    <Link
                      href="/dashboard?view=tasks"
                      className="d-workspace d-teal"
                    >
                      <span className="d-workspace-icon">
                        <Icon name="stethoscope" />
                      </span>
                      <h3>Medical VA Dashboard</h3>
                      <p>Tasks, schedules, time entries and support.</p>
                      <span className="d-card-arrow">
                        <Icon name="arrow" />
                      </span>
                    </Link>
                  )}
                </div>
              </section>
              <div className="d-bottom-grid">
                <section className="d-panel d-activity">
                  <PanelHeading
                    icon="activity"
                    title="Recent Activity"
                    subtitle="Latest saved workspace updates"
                  />
                  {overview?.activity.length ? (
                    <ul>
                      {overview.activity.map((a) => (
                        <li key={String(a.id)}>
                          <span className="d-activity-icon d-blue">
                            <Icon name="activity" />
                          </span>
                          <div>
                            <strong>{String(a.summary)}</strong>
                            <time>
                              {new Date(
                                String(a.created_at),
                              ).toLocaleDateString()}
                            </time>
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="d-live-empty">
                      Your saved workspace updates will appear here.
                    </p>
                  )}
                  <Link href="/dashboard?view=activity" className="d-text-link">
                    View All Activity <Icon name="arrow" />
                  </Link>
                </section>
                <section className="d-panel d-pipeline">
                  <PanelHeading
                    icon="chart"
                    title="Training & Placement Overview"
                    subtitle="Current totals available to your account"
                  />
                  <ol>
                    {pipeline.map(([label, count, icon, tone], i) => (
                      <li
                        key={label}
                        style={{
                          marginLeft: `${i * 2.2}%`,
                          marginRight: `${i * 1.5}%`,
                        }}
                      >
                        <div
                          className={`d-pipeline-fill d-${tone}`}
                          style={{
                            width: counts.applications
                              ? `${Math.min(100, ((counts[count] || 0) / counts.applications) * 100)}%`
                              : "0%",
                          }}
                        />
                        <span>
                          <Icon name={icon} />
                          {label}
                        </span>
                        <strong>{overview ? counts[count] || 0 : "—"}</strong>
                      </li>
                    ))}
                  </ol>
                </section>
              </div>
            </div>
            <aside className="d-right-rail">
              <section className="d-panel d-dates">
                <PanelHeading icon="calendar" title="Upcoming & Key Dates" />
                {overview?.events.length ? (
                  <ul>
                    {overview.events.map((e) => (
                      <li key={String(e.id)}>
                        <button onClick={() => open("calendar", e, true)}>
                          <span className="d-dot d-blue" />
                          <span>
                            <strong>{String(e.title)}</strong>
                            <time>
                              {new Date(
                                String(e.starts_at),
                              ).toLocaleDateString()}
                            </time>
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="d-live-empty">
                    No upcoming events have been scheduled for your account.
                  </p>
                )}
              </section>
              <section className="d-panel d-quick">
                <PanelHeading icon="zap" title="Quick Actions" />
                <div>
                  {role === "admin" ? (
                    <>
                      <Link href="/dashboard?view=applications">
                        <span>
                          <Icon name="file" />
                        </span>
                        Review Applications
                        <Icon name="arrow" />
                      </Link>
                      <button onClick={() => open("cohorts")}>
                        <span>
                          <Icon name="users" />
                        </span>
                        Create New Cohort
                        <Icon name="arrow" />
                      </button>
                      <button onClick={() => open("organizations")}>
                        <span>
                          <Icon name="building" />
                        </span>
                        Add Employer Partner
                        <Icon name="arrow" />
                      </button>
                    </>
                  ) : (
                    <>
                      <Link href="/dashboard?view=calendar">
                        <span>
                          <Icon name="calendar" />
                        </span>
                        View My Calendar
                        <Icon name="arrow" />
                      </Link>
                      <button onClick={() => open("support")}>
                        <span>
                          <Icon name="info" />
                        </span>
                        Request Support
                        <Icon name="arrow" />
                      </button>
                      <Link href="/dashboard?view=documents">
                        <span>
                          <Icon name="file" />
                        </span>
                        My Documents
                        <Icon name="arrow" />
                      </Link>
                    </>
                  )}
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
      )}
      {modal && (
        <RecordDialog
          key={`${modal.key}-${modal.record?.[resources[modal.key].primaryKey || "id"] || "new"}-${modal.view ? "view" : "edit"}`}
          modal={modal}
          close={() => setModal(null)}
          open={open}
          action={saveAction}
          saved={(message) => {
            setNotice(message);
            setModal(null);
            setRevision((v) => v + 1);
          }}
        />
      )}
    </>
  );
}
function Records({
  resourceKey,
  revision,
  open,
  changed,
  notify,
}: {
  resourceKey: string;
  revision: number;
  open: (key: string, record?: Row, view?: boolean, defaults?: Row) => void;
  changed: () => void;
  notify: (text: string) => void;
}) {
  const { identity } = useWorkspace(),
    resource = resources[resourceKey],
    role = identity!.role;
  const [records, setRecords] = useState<Row[]>([]),
    [count, setCount] = useState(0),
    [page, setPage] = useState(1),
    [search, setSearch] = useState(""),
    [q, setQ] = useState(""),
    [filter, setFilter] = useState(""),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [choices, setChoices] = useState<ChoiceMap>({}),
    [uploading, setUploading] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const timeout = setTimeout(() => {
      setQ(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [search]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError("");
    api<{ records: Row[]; count: number }>(
      `/api/platform/${resourceKey}?page=${page}&q=${encodeURIComponent(q)}&status=${encodeURIComponent(filter)}`,
      { signal: controller.signal },
    )
      .then((data) => {
        setRecords(data.records);
        setCount(data.count);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [resourceKey, revision, page, q, filter]);
  useEffect(() => {
    const controller = new AbortController();
    api<{ options: ChoiceMap }>(
      `/api/platform/options?resource=${resourceKey}`,
      { signal: controller.signal },
    )
      .then((data) => setChoices(data.options))
      .catch(() => {});
    return () => controller.abort();
  }, [resourceKey, revision]);
  async function upload(file: File) {
    setUploading(true);
    setError("");
    const client = createBrowserSupabase(),
      extensions: Record<string, string> = {
        "application/pdf": "pdf",
        "image/jpeg": "jpg",
        "image/png": "png",
        "text/plain": "txt",
        "audio/mpeg": "mp3",
        "audio/wav": "wav",
        "audio/webm": "webm",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
          "docx",
      };
    const ext = extensions[file.type];
    let path = "";
    try {
      if (!ext || file.size > 10485760 || file.size < 1)
        throw new Error(
          "Choose a supported document, image or practice recording, up to 10 MB.",
        );
      path = `${identity!.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await client.storage
        .from("dialife-private")
        .upload(path, file, { contentType: file.type, upsert: false });
      if (error)
        throw new Error(
          "The private upload failed. Check the file format and try again.",
        );
      await api("/api/platform/files", {
        method: "POST",
        body: JSON.stringify({
          original_name: file.name,
          object_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          category: file.type.startsWith("audio/") ? "simulation" : "general",
        }),
      });
      notify("Private document saved.");
      changed();
    } catch (e) {
      if (path) await client.storage.from("dialife-private").remove([path]);
      setError(
        e instanceof Error ? e.message : "The upload could not be completed.",
      );
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }
  async function download(record: Row) {
    try {
      const { url } = await api<{ url: string }>(
        `/api/platform/files/${record.id}`,
      );
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Unable to open this document.",
      );
    }
  }
  const statusField = resource.fields.find((f) => f.key === "status");
  return (
    <div className="d-module">
      <div className="d-module-top">
        <Link href="/dashboard" className="d-text-link">
          <Icon name="home" />
          Command Center
        </Link>
        <span className="d-muted">Authenticated workspace</span>
      </div>
      <section className="d-panel">
        <PanelHeading
          icon={resource.icon}
          title={resource.label}
          subtitle={resource.description}
        />
        <div className="d-action-bar">
          <p>
            {resourceKey === "simulations" || resourceKey === "scenarios"
              ? "Use fictional patient details in all practice material."
              : resourceKey === "documents"
                ? "Private files are available only to their owner and authorized administrators."
                : `${count} ${count === 1 ? "record" : "records"} available to your account`}
          </p>
          <div className="d-live-actions">
            {resource.create.includes(role) && (
              <button
                className="d-primary-button"
                onClick={() => open(resourceKey)}
              >
                <Icon name="plus" />
                New {resource.singular}
              </button>
            )}
            {resourceKey === "documents" && (
              <>
                <input
                  ref={fileInput}
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.txt,.docx,.mp3,.wav,.webm"
                  className="d-sr-only"
                  aria-label="Choose private document"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void upload(file);
                  }}
                />
                <button
                  className="d-primary-button"
                  disabled={uploading}
                  onClick={() => fileInput.current?.click()}
                >
                  <Icon name="plus" />
                  {uploading ? "Uploading…" : "Upload Document"}
                </button>
              </>
            )}
            <button
              className="d-small-button"
              disabled={!records.length}
              onClick={() =>
                csv(
                  `dialife-${resourceKey}-page-${page}.csv`,
                  resource.columns.map((c) => fieldLabel(resource, c)),
                  records.map((row) =>
                    resource.columns.map((c) => valueText(row[c], c, choices)),
                  ),
                )
              }
            >
              <Icon name="download" />
              Export This Page
            </button>
          </div>
        </div>
        {(resource.search || statusField) && (
          <div className="d-toolbar">
            {resource.search && (
              <label className="d-search">
                <Icon name="search" />
                <input
                  aria-label={`Search ${resource.label.toLowerCase()}`}
                  placeholder={`Search ${resource.label.toLowerCase()}…`}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </label>
            )}
            {statusField && (
              <select
                aria-label="Filter by status"
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All statuses</option>
                {statusField.options?.map((option) => (
                  <option key={option} value={option}>
                    {option.replaceAll("_", " ")}
                  </option>
                ))}
              </select>
            )}
          </div>
        )}
        {error && (
          <div role="alert" className="d-live-error">
            {error}
            <button className="d-small-button" onClick={changed}>
              Retry
            </button>
          </div>
        )}
        {loading ? (
          <p className="d-live-empty" role="status">
            Loading records…
          </p>
        ) : (
          <>
            <div className="d-table-wrap">
              <table>
                <thead>
                  <tr>
                    {resource.columns.map((c) => (
                      <th key={c}>{fieldLabel(resource, c)}</th>
                    ))}
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={String(row[resource.primaryKey || "id"])}>
                      {resource.columns.map((c) => (
                        <td key={c} title={String(row[c] ?? "")}>
                          {c === "status" || c === "readiness" ? (
                            <span className="d-status">
                              {valueText(row[c], c, choices)}
                            </span>
                          ) : (
                            <span className="d-cell-value">
                              {valueText(row[c], c, choices)}
                            </span>
                          )}
                        </td>
                      ))}
                      <td>
                        <div className="d-row-actions">
                          <button
                            className="d-small-button"
                            onClick={() => open(resourceKey, row, true)}
                          >
                            View
                          </button>
                          {resource.edit.includes(role) && (
                            <button
                              className="d-small-button"
                              onClick={() => open(resourceKey, row)}
                            >
                              Edit
                            </button>
                          )}
                          {resourceKey === "documents" && (
                            <button
                              className="d-small-button"
                              onClick={() => download(row)}
                            >
                              Download
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!records.length && (
              <div className="d-empty">
                <Icon name={resource.icon} />
                <h3>
                  {q || filter ? "No matching records" : "No records yet"}
                </h3>
                <p>
                  {q || filter
                    ? "Try another search or status filter."
                    : resource.create.includes(role)
                      ? `Create your first ${resource.singular.toLowerCase()} to get started.`
                      : "Records assigned or shared with your account will appear here."}
                </p>
                {(q || filter) && (
                  <button
                    className="d-small-button"
                    onClick={() => {
                      setSearch("");
                      setFilter("");
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}
            <div className="d-pagination">
              <span>
                {count
                  ? `${(page - 1) * 25 + 1}–${Math.min(page * 25, count)} of ${count}`
                  : "0 records"}
              </span>
              <button
                className="d-small-button"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <button
                className="d-small-button"
                disabled={page * 25 >= count}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
function RecordDialog({
  modal,
  close,
  open,
  action,
  saved,
}: {
  modal: Modal;
  close: () => void;
  open: (key: string, record?: Row, view?: boolean, defaults?: Row) => void;
  action: (key: string, id: string, body: Row) => void;
  saved: (message: string) => void;
}) {
  const { identity } = useWorkspace(),
    role = identity!.role,
    r = resources[modal.key],
    editing = !!modal.record && !modal.view;
  const [choices, setChoices] = useState<ChoiceMap>({}),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const fields = fieldsFor(r, role, editing);
  useEffect(() => {
    if (!dialog.current?.open) dialog.current?.showModal();
    const controller = new AbortController();
    api<{ options: ChoiceMap }>(`/api/platform/options?resource=${modal.key}`, {
      signal: controller.signal,
    })
      .then((data) => setChoices(data.options))
      .catch((e) => {
        if (e.name !== "AbortError") setError(e.message);
      });
    return () => controller.abort();
  }, [modal.key]);
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(event.currentTarget),
      payload: Row = {};
    for (const f of fields) {
      const value = form.get(f.key);
      if (f.type === "checkbox") payload[f.key] = value === "on";
      else if (f.type === "number")
        payload[f.key] = value === "" ? null : Number(value);
      else if (f.type === "datetime-local")
        payload[f.key] = value ? new Date(String(value)).toISOString() : null;
      else payload[f.key] = value === null ? "" : String(value);
    }
    const id = modal.record?.[r.primaryKey || "id"];
    try {
      const result = await api<{ message: string }>(
        `/api/platform/${modal.key}${editing ? `?id=${id}` : ""}`,
        { method: editing ? "PATCH" : "POST", body: JSON.stringify(payload) },
      );
      saved(result.message);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "The record could not be saved.",
      );
      setBusy(false);
    }
  }
  async function completeLesson() {
    setBusy(true);
    setError("");
    try {
      await api("/api/platform/progress", {
        method: "POST",
        body: JSON.stringify({ lesson_id: modal.record!.id, completed: true }),
      });
      saved("Lesson marked complete. Your progress is saved.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to save progress.");
      setBusy(false);
    }
  }
  const rec = modal.record || {};
  return (
    <dialog
      ref={dialog}
      className="d-modal d-live-modal"
      aria-labelledby="live-dialog-title"
      onCancel={(e) => {
        if (busy) e.preventDefault();
        else close();
      }}
      onClose={close}
    >
      <button
        type="button"
        className="d-modal-close d-icon-button"
        aria-label="Close dialog"
        disabled={busy}
        onClick={close}
      >
        <Icon name="close" />
      </button>
      <span className="d-status">{roleLabels[role]} · Private Workspace</span>
      <h2 id="live-dialog-title">
        {modal.view
          ? r.singular
          : editing
            ? `Edit ${r.singular}`
            : `New ${r.singular}`}
      </h2>
      {error && (
        <div className="d-live-error" role="alert">
          {error}
        </div>
      )}
      {modal.view ? (
        <>
          <dl className="d-record-details">
            {Object.entries(rec)
              .filter(([key]) => !["id", "object_path"].includes(key))
              .map(([key, value]) => (
                <div key={key}>
                  <dt>{fieldLabel(r, key)}</dt>
                  <dd>{valueText(value, key, choices)}</dd>
                </div>
              ))}
          </dl>
          <div className="d-record-actions">
            {modal.key === "lessons" &&
              role !== "admin" &&
              resources.progress.create.includes(role) && (
                <button
                  className="d-primary-button"
                  disabled={busy}
                  onClick={completeLesson}
                >
                  Mark Lesson Complete
                </button>
              )}
            {modal.key === "assignments" &&
              resources.submissions.create.includes(role) && (
                <button
                  className="d-primary-button"
                  onClick={() =>
                    open("submissions", undefined, false, {
                      assignment_id: rec.id,
                    })
                  }
                >
                  Submit a Response
                </button>
              )}
            {modal.key === "support" && (
              <button
                className="d-primary-button"
                onClick={() =>
                  open("messages", undefined, false, { ticket_id: rec.id })
                }
              >
                Reply to Ticket
              </button>
            )}
            {modal.key === "simulations" &&
              resources.evaluations.create.includes(role) && (
                <button
                  className="d-primary-button"
                  onClick={() =>
                    open("evaluations", undefined, false, {
                      session_id: rec.id,
                    })
                  }
                >
                  Evaluate Practice
                </button>
              )}
            {modal.key === "notifications" && (
              <button
                className="d-primary-button"
                onClick={() =>
                  action("notifications", String(rec.id), {
                    read_at: new Date().toISOString(),
                  })
                }
              >
                Mark as Read
              </button>
            )}
            {role === "admin" && modal.key === "applications" && (
              <>
                <button
                  className="d-primary-button"
                  disabled={
                    !["new", "reviewing", "shortlisted"].includes(
                      String(rec.status),
                    )
                  }
                  onClick={() =>
                    action("applications", String(rec.id), {
                      status: "admitted",
                    })
                  }
                >
                  Admit Applicant
                </button>
                {!!rec.user_id && (
                  <button
                    className="d-secondary-button"
                    onClick={() =>
                      open("enrollments", undefined, false, {
                        trainee_id: rec.user_id,
                      })
                    }
                  >
                    Enroll in a Cohort
                  </button>
                )}
              </>
            )}
            {role === "admin" && modal.key === "cohorts" && (
              <>
                <button
                  className="d-primary-button"
                  onClick={() =>
                    open("enrollments", undefined, false, { cohort_id: rec.id })
                  }
                >
                  Enroll Learner
                </button>
                <button
                  className="d-secondary-button"
                  onClick={() =>
                    open("trainers", undefined, false, { cohort_id: rec.id })
                  }
                >
                  Assign Trainer
                </button>
              </>
            )}
            {role === "admin" && modal.key === "requests" && (
              <button
                className="d-primary-button"
                onClick={() =>
                  open("matches", undefined, false, { request_id: rec.id })
                }
              >
                Match a Candidate
              </button>
            )}
            {["admin", "employer"].includes(role) &&
              modal.key === "matches" && (
                <button
                  className="d-primary-button"
                  onClick={() =>
                    open("interviews", undefined, false, { match_id: rec.id })
                  }
                >
                  Schedule Interview
                </button>
              )}
            {r.edit.includes(role) && (
              <button
                className="d-secondary-button"
                onClick={() => open(modal.key, rec)}
              >
                Edit Record
              </button>
            )}
          </div>
        </>
      ) : (
        <form
          onSubmit={submit}
          key={`${modal.key}-${editing ? "edit" : "new"}`}
        >
          {fields.map((f) => (
            <FormField
              key={f.key}
              field={f}
              role={role}
              resourceKey={modal.key}
              choices={choices}
              value={
                editing
                  ? rec[f.key]
                  : (modal.defaults?.[f.key] ?? f.defaultValue)
              }
            />
          ))}
          {modal.key === "certificates" && (
            <p className="d-muted">
              Certificates can be issued only for completed enrollments.
            </p>
          )}
          {modal.key === "simulations" && (
            <p className="d-muted">
              Record a synthetic practice conversation or attach an uploaded
              recording. Live voice-agent calling is not connected.
            </p>
          )}
          <div className="d-modal-actions">
            <button
              type="button"
              className="d-secondary-button"
              disabled={busy}
              onClick={close}
            >
              Cancel
            </button>
            <button className="d-primary-button" disabled={busy} type="submit">
              {busy
                ? "Saving…"
                : editing
                  ? "Save Changes"
                  : `Create ${r.singular}`}
            </button>
          </div>
        </form>
      )}
    </dialog>
  );
}
function FormField({
  field: f,
  role,
  resourceKey,
  choices,
  value,
}: {
  field: Field;
  role: PlatformRole;
  resourceKey: string;
  choices: ChoiceMap;
  value: unknown;
}) {
  const options = optionsFor(resourceKey, f, role);
  let initial = value ?? "";
  if (f.type === "datetime-local" && initial) {
    const date = new Date(String(initial));
    initial = Number.isNaN(date.getTime())
      ? ""
      : new Date(date.getTime() - date.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16);
  }
  if (options && !options.includes(String(initial))) initial = options[0] || "";
  let list = f.relation ? choices[f.relation] || [] : [];
  if (f.key === "trainer_id") list = list.filter((c) => c.role === "trainer");
  if (
    f.key === "trainee_id" ||
    (f.key === "user_id" && ["progress", "candidates"].includes(resourceKey))
  )
    list = list.filter((c) =>
      ["applicant", "medical_va"].includes(c.role || ""),
    );
  if (
    f.key === "medical_va_id" ||
    (f.key === "user_id" && resourceKey === "timesheets")
  )
    list = list.filter((c) => c.role === "medical_va");
  if (f.key === "user_id" && resourceKey === "memberships")
    list = list.filter((c) => ["employer", "admin"].includes(c.role || ""));
  if (f.key === "enrollment_id")
    list = list.filter((c) => c.status === "completed");
  return (
    <label className={f.type === "checkbox" ? "d-checkbox-field" : ""}>
      {f.type === "checkbox" ? (
        <>
          <input type="checkbox" name={f.key} defaultChecked={!!value} />
          {f.label}
        </>
      ) : (
        <>
          {f.label}
          {f.required && <span className="d-required"> *</span>}
          {f.relation || options ? (
            <select
              name={f.key}
              required={f.required}
              defaultValue={String(initial)}
            >
              {!options && (
                <option value="">
                  {list.length ? "Choose a record" : "No available records"}
                </option>
              )}
              {options
                ? options.map((option) => (
                    <option key={option} value={option}>
                      {option.replaceAll("_", " ")}
                    </option>
                  ))
                : list.map((c) => (
                    <option key={c.value} value={c.value}>
                      {c.label}
                    </option>
                  ))}
            </select>
          ) : f.type === "textarea" ? (
            <textarea
              name={f.key}
              required={f.required}
              maxLength={f.max || 10000}
              defaultValue={String(initial)}
              rows={f.key === "content" || f.key === "transcript" ? 8 : 4}
            />
          ) : (
            <input
              name={f.key}
              type={f.type || "text"}
              required={f.required}
              min={f.min}
              max={f.type === "number" ? f.max : undefined}
              maxLength={f.type !== "number" ? f.max : undefined}
              step={f.key === "score" ? "any" : undefined}
              defaultValue={String(initial)}
            />
          )}{" "}
          {f.type === "datetime-local" && (
            <small className="d-muted">
              Your local time (
              {Intl.DateTimeFormat().resolvedOptions().timeZone})
            </small>
          )}
        </>
      )}
    </label>
  );
}
