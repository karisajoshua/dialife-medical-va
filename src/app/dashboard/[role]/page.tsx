import { notFound } from "next/navigation";
import { roleContent, type Role } from "../demo-data";
import { DashboardEntry } from "../dashboard-entry";
export default async function RoleDashboard({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!Object.hasOwn(roleContent, role)) notFound();
  return <DashboardEntry role={role as Role} />;
}
