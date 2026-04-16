"use client";

import type { OutputRecord, TrendPoint } from "@/lib/types";
import { SummaryCard } from "@/components/common/SummaryCard";
import { EmptyState } from "@/components/common/EmptyState";
import { addDays, formatDisplayDate, todayISODate } from "@/lib/utils";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";

export function OutputCharts({
  trends,
  latest,
  selectedDate,
}: {
  trends: TrendPoint[];
  latest: OutputRecord | null;
  selectedDate: string;
}) {
  const chartData = trends.filter(
    (t) => t.bodyWeight !== null || t.caloriesConsumed !== null
  );

  const weekStart = addDays(selectedDate, -6);
  const weekPoints = trends.filter((t) => t.date >= weekStart && t.date <= selectedDate);
  const weekWeight = weekPoints
    .map((t) => t.bodyWeight)
    .filter((w): w is number => w !== null && w > 0);
  const prevWeekStart = addDays(selectedDate, -13);
  const prevWeekEnd = addDays(selectedDate, -7);
  const prevPoints = trends.filter(
    (t) => t.date >= prevWeekStart && t.date <= prevWeekEnd
  );
  const prevWeights = prevPoints
    .map((t) => t.bodyWeight)
    .filter((w): w is number => w !== null && w > 0);
  const wkAvg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
  const thisAvg = wkAvg(weekWeight);
  const lastAvg = wkAvg(prevWeights);
  const delta =
    thisAvg !== null && lastAvg !== null
      ? thisAvg - lastAvg
      : null;

  if (chartData.length === 0 && !latest) {
    return (
      <EmptyState
        title="No trend data yet"
        description="Log outputs and inputs over a few days to see charts."
      />
    );
  }

  return (
    <div className="space-y-4">
      {latest && (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            title="Latest weight (this day)"
            value={
              latest.bodyWeight > 0 ? `${latest.bodyWeight}` : "—"
            }
          />
          <SummaryCard title="Energy" value={latest.energyLevel || "—"} />
          <SummaryCard title="Mood" value={latest.mood || "—"} />
          <SummaryCard title="Recovery" value={latest.recovery || "—"} />
        </div>
      )}

      {/* {(thisAvg !== null || lastAvg !== null) && (
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-zinc-900">
            Weekly comparison
          </h4>
          <p className="mt-1 text-xs text-zinc-500">
            Window ending {formatDisplayDate(selectedDate)} vs prior week
          </p>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            <div>
              <p className="text-xs text-zinc-500">This week avg weight</p>
              <p className="text-lg font-semibold">
                {thisAvg !== null ? thisAvg.toFixed(1) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Prior week avg</p>
              <p className="text-lg font-semibold">
                {lastAvg !== null ? lastAvg.toFixed(1) : "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-zinc-500">Delta</p>
              <p
                className={`text-lg font-semibold ${
                  delta === null
                    ? ""
                    : delta <= 0
                      ? "text-emerald-700"
                      : "text-amber-700"
                }`}
              >
                {delta === null
                  ? "—"
                  : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
          <h4 className="text-sm font-semibold text-zinc-900">Trends</h4>
          <p className="mt-1 text-xs text-zinc-500">
            All logged days — body weight and calories consumed (from inputs)
          </p>
          <div className="mt-4 h-64 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ left: 4, right: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  tickFormatter={(v) => String(v).slice(5)}
                />
                <YAxis yAxisId="w" width={40} tick={{ fontSize: 10 }} />
                <YAxis
                  yAxisId="c"
                  orientation="right"
                  width={40}
                  tick={{ fontSize: 10 }}
                />
                <Tooltip
                  labelFormatter={(v) => formatDisplayDate(String(v))}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line
                  yAxisId="w"
                  type="monotone"
                  dataKey="bodyWeight"
                  name="Weight"
                  stroke="#18181b"
                  dot={false}
                  strokeWidth={2}
                />
                <Line
                  yAxisId="c"
                  type="monotone"
                  dataKey="caloriesConsumed"
                  name="Calories"
                  stroke="#059669"
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {chartData.length === 0 && latest && (
        <p className="text-sm text-zinc-500">
          Add more historical rows to see the line chart. Today:{" "}
          {todayISODate()}.
        </p>
      )} */}
    </div>
  );
}
