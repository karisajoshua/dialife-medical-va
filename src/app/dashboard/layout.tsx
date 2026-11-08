import type { Metadata } from "next";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import { DashboardShell } from "./dashboard-shell";
import "./dashboard.css";
export const metadata: Metadata = {
  title: "Operations Command Center | Dialife Medical VA",
  robots: { index: false, follow: false },
};
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardShell>{children}</DashboardShell>;
}
