import type { Metadata } from "next";
import { Suspense } from "react";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { platformIdentity } from "@/lib/platform/auth";
import { DashboardShell } from "./dashboard-shell";
import { WorkspaceProvider } from "./workspace-context";
import "./dashboard.css";
import "./live.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Operations Command Center | Dialife Medical VA",
  robots: { index: false, follow: false },
};
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { identity } = await platformIdentity();
  return (
    <Suspense>
      <WorkspaceProvider identity={identity}>
        <DashboardShell>{children}</DashboardShell>
      </WorkspaceProvider>
    </Suspense>
  );
}
