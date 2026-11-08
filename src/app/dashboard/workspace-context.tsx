"use client";
import { createContext, useContext, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import type { Identity } from "@/lib/platform/auth";
type Workspace = {
  identity: Identity | null;
  live: boolean;
  href: (path: string) => string;
};
const Context = createContext<Workspace>({
  identity: null,
  live: false,
  href: (p) => p,
});
export function WorkspaceProvider({
  identity,
  children,
}: {
  identity: Identity | null;
  children: ReactNode;
}) {
  const params = useSearchParams(),
    demo = params.get("mode") === "demo";
  const href = (path: string) =>
    demo && path.startsWith("/dashboard")
      ? `${path}${path.includes("?") ? "&" : "?"}mode=demo`
      : path;
  return (
    <Context.Provider value={{ identity, live: !!identity && !demo, href }}>
      {children}
    </Context.Provider>
  );
}
export const useWorkspace = () => useContext(Context);
