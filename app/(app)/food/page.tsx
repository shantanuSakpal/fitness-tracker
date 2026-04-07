import { Loader } from "@/components/common/Loader";
import { Suspense } from "react";
import { FoodClient } from "./FoodClient";

export default function FoodPage() {
  return (
    <Suspense fallback={<Loader label="Loading…" />}>
      <FoodClient />
    </Suspense>
  );
}
