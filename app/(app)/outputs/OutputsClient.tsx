"use client";

import { DateSelectorBar } from "@/components/common/DateSelector";
import { Loader } from "@/components/common/Loader";
import { OutputCharts } from "@/components/outputs/OutputCharts";
import { OutputForm } from "@/components/outputs/OutputForm";
import {
  fetchOutputsByDate,
  fetchTrendData,
  GasApiError,
  saveOutputs,
} from "@/lib/api";
import type { OutputRecord, SaveOutputsPayload, TrendPoint } from "@/lib/types";
import { formatDisplayDate, todayISODate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function OutputsClient() {
  const params = useSearchParams();
  const date = params.get("date") || todayISODate();

  const [record, setRecord] = useState<OutputRecord | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t] = await Promise.all([
        fetchOutputsByDate(date),
        fetchTrendData(120),
      ]);
      setRecord(r);
      setTrends(t);
    } catch (e) {
      toast.error(
        e instanceof GasApiError ? e.message : "Failed to load outputs"
      );
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  async function onSave(payload: SaveOutputsPayload) {
    setBusy(true);
    try {
      const saved = await saveOutputs(payload);
      setRecord(saved);
      toast.success("Outputs saved");
      await load();
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
            Output Tracker
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            {formatDisplayDate(date)}
          </p>
        </div>
        <DateSelectorBar className="max-w-md" />
      </header>

      {loading ? (
        <Loader />
      ) : (
        <>
          <OutputCharts trends={trends} latest={record} selectedDate={date} />
          <OutputForm
            date={date}
            existing={record}
            onSave={onSave}
            busy={busy}
          />
        </>
      )}
    </div>
  );
}
