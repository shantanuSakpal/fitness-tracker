"use client";

import { DateSelectorBar } from "@/components/common/DateSelector";
import { EmptyState } from "@/components/common/EmptyState";
import { Loader } from "@/components/common/Loader";
import { SummaryCard } from "@/components/common/SummaryCard";
import { InputProgressBars } from "@/components/dashboard/InputProgressBars";
import { fetchDashboardSummary, fetchTrendData, GasApiError } from "@/lib/api";
import type { DashboardSummary, TrendPoint } from "@/lib/types";
import { INPUT_TARGETS, formatTargetInt } from "@/lib/inputTargets";
import { formatDisplayDate, todayISODate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export function DashboardClient() {
  const params = useSearchParams();
  const date = params.get("date") || todayISODate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [trends, setTrends] = useState<TrendPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([
        fetchDashboardSummary(date),
        fetchTrendData(60),
      ]);
      setSummary(s);
      setTrends(t);
    } catch (e) {
      const msg =
        e instanceof GasApiError
          ? e.message
          : e instanceof Error
          ? e.message
          : "Failed to load dashboard";
      setError(msg);
      setSummary(null);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [date]);

  useEffect(() => {
    load();
  }, [load]);

  const chartSlice = trends.filter((x) => x.date <= date).slice(-30);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Overview for {formatDisplayDate(date)}
          </p>
        </div>
        <DateSelectorBar className="max-w-md" />
      </header>

      {loading && <Loader />}
      {!loading && error && (
        <EmptyState
          title="Could not load data"
          description={error}
          action={
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          }
        />
      )}
      {!loading && !error && summary && (
        <>
          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Day at a glance
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <SummaryCard
                title="Protein (g)"
                value={
                  summary.proteinConsumed != null
                    ? `${summary.proteinConsumed} / ${INPUT_TARGETS.PROTEIN_G}`
                    : "—"
                }
                hint="Consumed vs target"
                variant={
                  summary.proteinConsumed != null &&
                  summary.proteinConsumed >= INPUT_TARGETS.PROTEIN_G
                    ? "success"
                    : summary.proteinConsumed != null
                    ? "warning"
                    : "muted"
                }
              />
              <SummaryCard
                title="Calories"
                value={
                  summary.caloriesConsumed != null
                    ? `${summary.caloriesConsumed} / ${INPUT_TARGETS.CALORIES}`
                    : "—"
                }
                hint="Consumed vs target"
                variant={
                  summary.caloriesConsumed != null &&
                  summary.caloriesConsumed >= INPUT_TARGETS.CALORIES
                    ? "success"
                    : summary.caloriesConsumed != null
                    ? "warning"
                    : "muted"
                }
              />
              <SummaryCard
                title="Training"
                value={
                  summary.trainingDone === null
                    ? "—"
                    : summary.trainingDone
                    ? "Done"
                    : "Not logged"
                }
                variant={
                  summary.trainingDone === true
                    ? "success"
                    : summary.trainingDone === false
                    ? "muted"
                    : "default"
                }
              />
              <SummaryCard
                title="Sleep"
                value={
                  summary.sleepHours != null ? `${summary.sleepHours} h` : "—"
                }
                hint={`Target ${INPUT_TARGETS.SLEEP_HOURS} h`}
                variant={
                  summary.sleepHours == null
                    ? "muted"
                    : summary.sleepHours >= INPUT_TARGETS.SLEEP_HOURS
                    ? "success"
                    : "warning"
                }
              />
              <SummaryCard
                title="Steps"
                value={
                  summary.stepCount != null
                    ? `${formatTargetInt(
                        summary.stepCount
                      )} / ${formatTargetInt(INPUT_TARGETS.STEPS)}`
                    : "—"
                }
                hint="Actual vs target"
                variant={
                  summary.stepCount == null
                    ? "muted"
                    : summary.stepCount >= INPUT_TARGETS.STEPS
                    ? "success"
                    : "warning"
                }
              />
              <SummaryCard
                title="Fibre (g)"
                value={
                  summary.fiberConsumed != null
                    ? `${summary.fiberConsumed} / ${INPUT_TARGETS.FIBER_G}`
                    : "—"
                }
                hint="Consumed vs target"
                variant={
                  summary.fiberConsumed == null
                    ? "muted"
                    : summary.fiberConsumed >= INPUT_TARGETS.FIBER_G
                    ? "success"
                    : "warning"
                }
              />
              <SummaryCard
                title="Fruit (g)"
                value={
                  summary.fruitsConsumed != null
                    ? `${summary.fruitsConsumed} / ${INPUT_TARGETS.FRUITS_G}`
                    : "—"
                }
                hint="Consumed vs target"
                variant={
                  summary.fruitsConsumed == null
                    ? "muted"
                    : summary.fruitsConsumed >= INPUT_TARGETS.FRUITS_G
                    ? "success"
                    : "warning"
                }
              />
              <SummaryCard
                title="Cardio"
                value={
                  summary.zone2Done === null
                    ? "—"
                    : summary.zone2Done
                    ? "Done"
                    : "No"
                }
              />
              <SummaryCard
                title="Latest body weight"
                value={
                  summary.latestBodyWeight != null
                    ? `${summary.latestBodyWeight}`
                    : "—"
                }
                hint={
                  summary.latestBodyWeightDate
                    ? `As of ${summary.latestBodyWeightDate}`
                    : undefined
                }
              />
            </div>
          </section>

          <InputProgressBars summary={summary} />

          {/* <section className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-zinc-900">Notes</h3>
              <p className="mt-2 text-xs font-medium uppercase text-zinc-500">
                Inputs
              </p>
              <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                {summary.inputNotes || "—"}
              </p>
              <p className="mt-4 text-xs font-medium uppercase text-zinc-500">
                Outputs
              </p>
              <p className="mt-1 text-sm text-zinc-700 whitespace-pre-wrap">
                {summary.outputNotes || "—"}
              </p>
            </div>
            <SummaryCard
              title="Consistency streak"
              value={`${summary.streakDays} days`}
              hint="Training logged yes, counting back from today"
              variant={summary.streakDays > 0 ? "success" : "muted"}
            />
          </section> */}

          <section>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Recent trends
            </h2>
            {chartSlice.length === 0 ? (
              <EmptyState
                title="No trend data yet"
                description="Log weights and inputs to see the last 30 data points."
              />
            ) : (
              <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
                <p className="text-xs text-zinc-500">
                  Body weight & calories (up to 30 points before selected day)
                </p>
                <div className="mt-3 h-56 w-full min-w-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartSlice}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="w" width={36} tick={{ fontSize: 10 }} />
                      <YAxis
                        yAxisId="c"
                        orientation="right"
                        width={36}
                        tick={{ fontSize: 10 }}
                      />
                      <Tooltip />
                      <Line
                        yAxisId="w"
                        type="monotone"
                        dataKey="bodyWeight"
                        stroke="#18181b"
                        dot={false}
                        name="Weight"
                      />
                      <Line
                        yAxisId="c"
                        type="monotone"
                        dataKey="caloriesConsumed"
                        stroke="#059669"
                        dot={false}
                        name="Calories"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
