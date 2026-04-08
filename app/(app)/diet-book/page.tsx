import { Loader } from "@/components/common/Loader";
import { Suspense } from "react";
import { DietBookClient } from "./DietBookClient";

export default function DietBookPage() {
  return (
    <Suspense fallback={<Loader label="Loading…" />}>
      <DietBookClient />
    </Suspense>
  );
}
