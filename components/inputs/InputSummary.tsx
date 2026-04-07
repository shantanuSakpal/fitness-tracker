"use client";

import type { InputRecord } from "@/lib/types";
import {
  INPUT_TARGETS,
  formatTargetInt,
  waterTargetLabel,
} from "@/lib/inputTargets";
import { SummaryCard } from "@/components/common/SummaryCard";

function met(actual: number, target: number) {
  if (target <= 0) return null;
  return actual >= target;
}

export function InputSummary({ record }: { record: InputRecord | null }) {
  if (!record) {
    return (
      <p className="text-sm text-zinc-500">
        Save inputs for this day to see summary cards.
      </p>
    );
  }

  const calOk = met(record.caloriesConsumed, INPUT_TARGETS.CALORIES);
  const proOk = met(record.proteinConsumed, INPUT_TARGETS.PROTEIN_G);
  const sleepOk = met(record.sleepHours, INPUT_TARGETS.SLEEP_HOURS);
  const stepsOk = met(record.stepCount, INPUT_TARGETS.STEPS);
  const fiberOk = met(record.fiberConsumed, INPUT_TARGETS.FIBER_G);
  const fruitsOk = met(record.fruitsConsumed, INPUT_TARGETS.FRUITS_G);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <SummaryCard
        title="Calories"
        value={`${record.caloriesConsumed} / ${INPUT_TARGETS.CALORIES}`}
        hint="Consumed vs target"
        variant={
          calOk === null ? "muted" : calOk ? "success" : "warning"
        }
      />
      <SummaryCard
        title="Protein (g)"
        value={`${record.proteinConsumed} / ${INPUT_TARGETS.PROTEIN_G}`}
        hint="Consumed vs target"
        variant={
          proOk === null ? "muted" : proOk ? "success" : "warning"
        }
      />
      <SummaryCard
        title="Sleep"
        value={`${record.sleepHours} h`}
        hint={`Target ${INPUT_TARGETS.SLEEP_HOURS} h`}
        variant={
          sleepOk === null ? "muted" : sleepOk ? "success" : "warning"
        }
      />
      <SummaryCard
        title="Water"
        value={record.waterIntake?.trim() ? record.waterIntake : "—"}
        hint={`Target ${waterTargetLabel()}`}
      />
      <SummaryCard
        title="Steps"
        value={`${formatTargetInt(record.stepCount)} / ${formatTargetInt(INPUT_TARGETS.STEPS)}`}
        hint="Actual vs target"
        variant={
          stepsOk === null ? "muted" : stepsOk ? "success" : "warning"
        }
      />
      <SummaryCard
        title="Fibre (g)"
        value={`${record.fiberConsumed} / ${INPUT_TARGETS.FIBER_G}`}
        hint="Consumed vs target"
        variant={
          fiberOk === null ? "muted" : fiberOk ? "success" : "warning"
        }
      />
      <SummaryCard
        title="Fruit (g)"
        value={`${record.fruitsConsumed} / ${INPUT_TARGETS.FRUITS_G}`}
        hint="Consumed vs target"
        variant={
          fruitsOk === null ? "muted" : fruitsOk ? "success" : "warning"
        }
      />
    </div>
  );
}
