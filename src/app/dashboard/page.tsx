import { Suspense } from "react";
import { CommandCenter } from "./command-center";
export default function DashboardPage() {
  return (
    <Suspense>
      <CommandCenter />
    </Suspense>
  );
}
