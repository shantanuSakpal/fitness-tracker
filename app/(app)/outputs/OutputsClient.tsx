"use client";

import { DateSelectorBar } from "@/components/common/DateSelector";
import { Loader } from "@/components/common/Loader";
import { OutputCharts } from "@/components/outputs/OutputCharts";
import { OutputForm } from "@/components/outputs/OutputForm";
import { OutputHistoryTable } from "@/components/outputs/OutputHistoryTable";
import {
  fetchAllOutputs,
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
  const [history, setHistory] = useState<OutputRecord[]>([]);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [r, t, h] = await Promise.all([
        fetchOutputsByDate(date),
        fetchTrendData(0),
        fetchAllOutputs(),
      ]);
      setRecord(r);
      setTrends(t);
      setHistory(h);
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
          <section className="space-y-3">
            <div>
              <h2 className="text-sm font-semibold text-zinc-900">
                Output history
              </h2>
              <p className="mt-0.5 text-xs text-zinc-500">
                Every saved day, newest first. Open a date to edit.
              </p>
            </div>
            <OutputHistoryTable rows={history} selectedDate={date} />
          </section>
        </>
      )}
    </div>
  );
}
