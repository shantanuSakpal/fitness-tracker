"use client";

import type { DashboardSummary } from "@/lib/types";
import { INPUT_TARGETS, formatTargetInt } from "@/lib/inputTargets";

function pct(consumed: number, target: number): number {
  if (target <= 0) return 0;
  return Math.min(100, (consumed / target) * 100);
}

/**
 * Consumed-vs-target progress bars for the selected day (dashboard).
 */
export function InputProgressBars({ summary }: { summary: DashboardSummary }) {
  const cal = summary.caloriesConsumed ?? 0;
  const pro = summary.proteinConsumed ?? 0;
  const fiber = summary.fiberConsumed ?? 0;
  const fruits = summary.fruitsConsumed ?? 0;
  const sleep = summary.sleepHours ?? 0;
  const steps = summary.stepCount ?? 0;

  const calPct = pct(cal, INPUT_TARGETS.CALORIES);
  const proPct = pct(pro, INPUT_TARGETS.PROTEIN_G);
  const fiberPct = pct(fiber, INPUT_TARGETS.FIBER_G);
  const fruitsPct = pct(fruits, INPUT_TARGETS.FRUITS_G);
  const sleepPct = pct(sleep, INPUT_TARGETS.SLEEP_HOURS);
  const stepsPct = pct(steps, INPUT_TARGETS.STEPS);

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">
        Progress vs targets
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Inputs for this day; empty values count as zero until you log them.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <BarBlock
          label="Calories"
          pct={calPct}
          barClass="bg-zinc-900"
          sub={`${cal} / ${INPUT_TARGETS.CALORIES}`}
        />
        <BarBlock
          label="Protein"
          pct={proPct}
          barClass="bg-emerald-600"
          sub={`${pro} / ${INPUT_TARGETS.PROTEIN_G} g`}
        />
        <BarBlock
          label="Fibre"
          pct={fiberPct}
          barClass="bg-amber-600"
          sub={`${fiber} / ${INPUT_TARGETS.FIBER_G} g`}
        />
        <BarBlock
          label="Fruit"
          pct={fruitsPct}
          barClass="bg-lime-600"
          sub={`${fruits} / ${INPUT_TARGETS.FRUITS_G} g`}
        />
        <BarBlock
          label="Sleep"
          pct={sleepPct}
          barClass="bg-sky-600"
          sub={`${sleep} / ${INPUT_TARGETS.SLEEP_HOURS} h`}
        />
        <BarBlock
          label="Steps"
          pct={stepsPct}
          barClass="bg-violet-600"
          sub={`${formatTargetInt(steps)} / ${formatTargetInt(INPUT_TARGETS.STEPS)}`}
        />
      </div>
    </section>
  );
}

function BarBlock({
  label,
  pct: widthPct,
  barClass,
  sub,
}: {
  label: string;
  pct: number;
  barClass: string;
  sub: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
      <p className="mt-0.5 text-xs tabular-nums text-zinc-600">{sub}</p>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className={`h-full rounded-full transition-[width] ${barClass}`}
          style={{ width: `${widthPct}%` }}
        />
      </div>
    </div>
  );
}
