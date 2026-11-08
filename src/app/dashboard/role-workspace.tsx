"use client";
import Link from "./workspace-link";
import { useState } from "react";
import { Icon } from "./icons";
import { PanelHeading } from "./command-center";
import { roleContent, type Role } from "./demo-data";
export function RoleWorkspace({ role }: { role: Role }) {
  const data = roleContent[role];
  const [completed, setCompleted] = useState<string[]>([]);
  const [message, setMessage] = useState("");
  function toggle(task: string) {
    setCompleted((old) =>
      old.includes(task) ? old.filter((t) => t !== task) : [...old, task],
    );
  }
  return (
    <div className="d-module">
      <div className="d-role-heading">
        <Link href="/dashboard" className="d-text-link">
          <Icon name="home" />
          Command Center
        </Link>
        <p>Fictional workspace · session-only actions</p>
      </div>
      <section
        className="d-role-metrics"
        aria-label="Sample workspace statistics"
      >
        {data.metrics.map(([label, value], i) => (
          <article
            className={`d-${["blue", "green", "purple", "orange"][i]}`}
            key={label}
          >
            <strong>{value}</strong>
            <p>{label}</p>
          </article>
        ))}
      </section>
      <div className="d-role-grid">
        {data.panels.map(([title, ...items], i) => (
          <section className="d-panel" key={title}>
            <PanelHeading
              icon={i ? "clipboard" : "book"}
              title={title}
              subtitle="Select a task to mark it complete in the demo"
            />
            <ul className="d-task-list">
              {items.map((task) => (
                <li key={task}>
                  <button
                    aria-pressed={completed.includes(task)}
                    className={completed.includes(task) ? "is-done" : ""}
                    onClick={() => toggle(task)}
                  >
                    <Icon
                      name={completed.includes(task) ? "check" : "clipboard"}
                    />
                    <span>{task}</span>
                    <span className="d-sr-only">
                      {completed.includes(task) ? "Completed" : "Mark complete"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <p className="d-role-note">
              {items.filter((item) => completed.includes(item)).length} of{" "}
              {items.length} tasks complete
            </p>
          </section>
        ))}
      </div>
      <section className="d-panel d-role-bottom">
        <PanelHeading
          icon="shield"
          title="Your demo workspace"
          subtitle="All names, tasks and figures are fictional"
        />
        <p className="d-role-note">
          Explore the workflow without accessing private applicant, employer or
          training records. Task changes are kept in this page session.
        </p>
        {role === "admin" ? (
          <Link className="d-primary-button" href="/dashboard?view=applicants">
            Review Applications <Icon name="arrow" />
          </Link>
        ) : (
          <button
            className="d-primary-button"
            onClick={() =>
              setMessage(
                "Demo support request noted for this session. No message has been sent.",
              )
            }
          >
            Request Demo Support <Icon name="arrow" />
          </button>
        )}
        {message && (
          <p role="status" className="d-role-note">
            {message}
          </p>
        )}
      </section>
    </div>
  );
}
