import { notFound } from "next/navigation";
import { roleContent, type Role } from "../demo-data";
import { RoleWorkspace } from "../role-workspace";
export const dynamicParams = false;
export function generateStaticParams() {
  return Object.keys(roleContent).map((role) => ({ role }));
}
export default async function RoleDashboard({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  const { role } = await params;
  if (!Object.hasOwn(roleContent, role)) notFound();
  return <RoleWorkspace role={role as Role} />;
}
