import { Suspense } from "react";
import { OutputsClient } from "./OutputsClient";
import { Loader } from "@/components/common/Loader";

export default function OutputsPage() {
  return (
    <Suspense fallback={<Loader label="Loading…" />}>
      <OutputsClient />
    </Suspense>
  );
}
