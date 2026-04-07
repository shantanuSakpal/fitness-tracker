"use client";

import { DateSelectorBar } from "@/components/common/DateSelector";
import { Loader } from "@/components/common/Loader";
import { InputForm } from "@/components/inputs/InputForm";
import { InputSummary } from "@/components/inputs/InputSummary";
import { InputTargetsPanel } from "@/components/inputs/InputTargetsPanel";
import { fetchInputsByDate, GasApiError, saveInputs } from "@/lib/api";
import type { InputRecord, SaveInputsPayload } from "@/lib/types";
import { formatDisplayDate, todayISODate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function InputsClient() {
  const params = useSearchParams();
  const date = params.get("date") || todayISODate();

  const [record, setRecord] = useState<InputRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetchInputsByDate(date);
      setRecord(r);
    } catch (e) {
      toast.error(
        e instanceof GasApiError ? e.message : "Failed to load inputs"
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(payload: SaveInputsPayload) {
    setBusy(true);
    try {
      const saved = await saveInputs(payload);
      setRecord(saved);
      toast.success("Inputs saved");
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Input Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {formatDisplayDate(date)}
          </p>
        </div>
        <DateSelectorBar className="max-w-md" />
      </header>

      {/* <InputTargetsPanel /> */}

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
          Summary
        </h2>
        {loading ? <Loader /> : <InputSummary record={record} />}
      </section>

      {loading ? (
        <Loader />
      ) : (
        <InputForm date={date} existing={record} onSave={onSave} busy={busy} />
      )}
    </div>
  );
}
