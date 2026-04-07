"use client";

import { useEffect, useState } from "react";
import {
  INPUT_TARGETS,
  formatTargetInt,
  waterTargetLabel,
} from "@/lib/inputTargets";

/**
 * Targets render only after mount so SSR + hot reload cannot disagree on the
 * markup (grid / item count). Initial HTML is a static skeleton.
 */
export function InputTargetsPanel() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <section
        className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
        aria-busy="true"
        aria-label="Loading targets"
      >
        <div className="h-5 max-w-48 animate-pulse rounded bg-zinc-100" />
        <p className="mt-2 h-3 max-w-[20rem] animate-pulse rounded bg-zinc-100/80" />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-17 animate-pulse rounded-lg bg-zinc-50" />
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <h2 className="text-sm font-semibold text-zinc-900">
        Your daily targets
      </h2>
      <p className="mt-1 text-xs text-zinc-500">
        Fixed goals; log your actuals in the form below.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Calories
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {formatTargetInt(INPUT_TARGETS.CALORIES)}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Protein
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {INPUT_TARGETS.PROTEIN_G} g
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Sleep
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {INPUT_TARGETS.SLEEP_HOURS} hours
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Water
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {waterTargetLabel()}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Steps
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {formatTargetInt(INPUT_TARGETS.STEPS)}
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Fibre
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {INPUT_TARGETS.FIBER_G} g
          </dd>
        </div>
        <div className="rounded-lg border border-zinc-100 bg-zinc-50/60 px-3 py-2">
          <dt className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Fruit
          </dt>
          <dd className="mt-0.5 text-lg font-semibold tabular-nums text-zinc-900">
            {INPUT_TARGETS.FRUITS_G} g
          </dd>
        </div>
      </dl>
    </section>
  );
}
