import { Suspense } from "react";
import { DashboardClient } from "./DashboardClient";
import { Loader } from "@/components/common/Loader";

export default function DashboardPage() {
  return (
    <Suspense fallback={<Loader label="Loading dashboard…" />}>
      <DashboardClient />
    </Suspense>
  );
}
