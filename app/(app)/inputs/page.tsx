import { Suspense } from "react";
import { InputsClient } from "./InputsClient";
import { Loader } from "@/components/common/Loader";

export default function InputsPage() {
  return (
    <Suspense fallback={<Loader label="Loading…" />}>
      <InputsClient />
    </Suspense>
  );
}
