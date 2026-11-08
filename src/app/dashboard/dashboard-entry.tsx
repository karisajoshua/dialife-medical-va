"use client";
import { useWorkspace } from "./workspace-context";
import { CommandCenter } from "./command-center";
import { RoleWorkspace } from "./role-workspace";
import { LiveWorkspace } from "./live-workspace";
import type { Role } from "./demo-data";
export function DashboardEntry({ role }: { role?: Role }) {
  const { live } = useWorkspace();
  return live ? (
    <LiveWorkspace rolePage={role} />
  ) : role ? (
    <RoleWorkspace role={role} />
  ) : (
    <CommandCenter />
  );
}
