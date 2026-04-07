"use client";

import type { InputRecord, SaveInputsPayload } from "@/lib/types";
import { INPUT_TARGETS, formatTargetInt } from "@/lib/inputTargets";
import { useEffect, useState } from "react";

type InputFormState = {
  /** String so new days can show blank fields; empty saves as 0 */
  caloriesConsumed: string;
  proteinConsumed: string;
  sleepHours: string;
  stepCount: string;
  fiberConsumed: string;
  fruitsConsumed: string;
  waterIntake: string;
  trainingDone: boolean;
  trainingNotes: string;
  walkAfterLunch: boolean;
  walkAfterDinner: boolean;
  zone2Done: boolean;
  notes: string;
  id?: string;
};

function emptyForm(): InputFormState {
  return {
    caloriesConsumed: "",
    proteinConsumed: "",
    sleepHours: "",
    stepCount: "",
    fiberConsumed: "",
    fruitsConsumed: "",
    waterIntake: "",
    trainingDone: false,
    trainingNotes: "",
    walkAfterLunch: false,
    walkAfterDinner: false,
    zone2Done: false,
    notes: "",
  };
}

function recordToForm(r: InputRecord): InputFormState {
  return {
    caloriesConsumed: String(r.caloriesConsumed),
    proteinConsumed: String(r.proteinConsumed),
    sleepHours: String(r.sleepHours),
    stepCount: String(r.stepCount),
    fiberConsumed: String(r.fiberConsumed ?? 0),
    fruitsConsumed: String(r.fruitsConsumed ?? 0),
    waterIntake: r.waterIntake,
    trainingDone: r.trainingDone,
    trainingNotes: r.trainingNotes,
    walkAfterLunch: r.walkAfterLunch,
    walkAfterDinner: r.walkAfterDinner,
    zone2Done: r.zone2Done,
    notes: r.notes,
    id: r.id,
  };
}

export function InputForm({
  date,
  existing,
  onSave,
  busy,
}: {
  date: string;
  existing: InputRecord | null;
  onSave: (p: SaveInputsPayload) => Promise<void>;
  busy: boolean;
}) {
  const [form, setForm] = useState<InputFormState>(() =>
    existing ? recordToForm(existing) : emptyForm()
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(existing ? recordToForm(existing) : emptyForm());
    setError(null);
  }, [existing, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const caloriesConsumed = parseQty(form.caloriesConsumed);
    const proteinConsumed = parseQty(form.proteinConsumed);
    const sleepHours = parseQty(form.sleepHours);
    const stepCount = parseQty(form.stepCount);
    const fiberConsumed = parseQty(form.fiberConsumed);
    const fruitsConsumed = parseQty(form.fruitsConsumed);

    if (caloriesConsumed === null || proteinConsumed === null) {
      setError(
        "Calories and protein must be valid non-negative numbers (or leave blank for 0)."
      );
      return;
    }
    if (sleepHours === null) {
      setError(
        "Sleep hours must be a valid non-negative number (or leave blank for 0)."
      );
      return;
    }
    if (stepCount === null) {
      setError(
        "Step count must be a valid non-negative number (or leave blank for 0)."
      );
      return;
    }
    if (fiberConsumed === null || fruitsConsumed === null) {
      setError(
        "Fibre and fruit must be valid non-negative numbers (or leave blank for 0)."
      );
      return;
    }

    await onSave({
      date,
      id: existing?.id,
      caloriesTarget: INPUT_TARGETS.CALORIES,
      proteinTarget: INPUT_TARGETS.PROTEIN_G,
      caloriesConsumed,
      proteinConsumed,
      sleepHours,
      stepCount,
      fiberConsumed,
      fruitsConsumed,
      waterIntake: form.waterIntake,
      trainingDone: form.trainingDone,
      trainingNotes: form.trainingNotes,
      walkAfterLunch: form.walkAfterLunch,
      walkAfterDinner: form.walkAfterDinner,
      zone2Done: form.zone2Done,
      notes: form.notes,
    });
  }

  const calN = previewNum(form.caloriesConsumed);
  const proN = previewNum(form.proteinConsumed);
  const sleepN = previewNum(form.sleepHours);
  const stepsN = previewNum(form.stepCount);
  const fiberN = previewNum(form.fiberConsumed);
  const fruitsN = previewNum(form.fruitsConsumed);

  const calPct =
    INPUT_TARGETS.CALORIES > 0 && calN !== null
      ? Math.min(100, (calN / INPUT_TARGETS.CALORIES) * 100)
      : 0;
  const proPct =
    INPUT_TARGETS.PROTEIN_G > 0 && proN !== null
      ? Math.min(100, (proN / INPUT_TARGETS.PROTEIN_G) * 100)
      : 0;
  const sleepPct =
    INPUT_TARGETS.SLEEP_HOURS > 0 && sleepN !== null
      ? Math.min(100, (sleepN / INPUT_TARGETS.SLEEP_HOURS) * 100)
      : 0;
  const stepsPct =
    INPUT_TARGETS.STEPS > 0 && stepsN !== null
      ? Math.min(100, (stepsN / INPUT_TARGETS.STEPS) * 100)
      : 0;
  const fiberPct =
    INPUT_TARGETS.FIBER_G > 0 && fiberN !== null
      ? Math.min(100, (fiberN / INPUT_TARGETS.FIBER_G) * 100)
      : 0;
  const fruitsPct =
    INPUT_TARGETS.FRUITS_G > 0 && fruitsN !== null
      ? Math.min(100, (fruitsN / INPUT_TARGETS.FRUITS_G) * 100)
      : 0;

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-zinc-900">Log actuals</h3>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Calories progress (vs target)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-zinc-900 transition-[width]"
              style={{ width: `${calPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Protein progress (vs target)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-emerald-600 transition-[width]"
              style={{ width: `${proPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Fibre progress (vs {INPUT_TARGETS.FIBER_G} g)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-amber-600 transition-[width]"
              style={{ width: `${fiberPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Fruit progress (vs {INPUT_TARGETS.FRUITS_G} g)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-lime-600 transition-[width]"
              style={{ width: `${fruitsPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Sleep progress (vs target)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-sky-600 transition-[width]"
              style={{ width: `${sleepPct}%` }}
            />
          </div>
        </div>
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">
            Steps progress (vs {formatTargetInt(INPUT_TARGETS.STEPS)} target)
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className="h-full rounded-full bg-violet-600 transition-[width]"
              style={{ width: `${stepsPct}%` }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Field
          label="Calories consumed"
          inputMode="numeric"
          value={form.caloriesConsumed}
          onChange={(s) => setForm((f) => ({ ...f, caloriesConsumed: s }))}
          disabled={busy}
        />
        <Field
          label="Protein consumed (g)"
          inputMode="numeric"
          value={form.proteinConsumed}
          onChange={(s) => setForm((f) => ({ ...f, proteinConsumed: s }))}
          disabled={busy}
        />
        <Field
          label="Sleep hours (actual)"
          inputMode="decimal"
          value={form.sleepHours}
          onChange={(s) => setForm((f) => ({ ...f, sleepHours: s }))}
          disabled={busy}
        />
        <Field
          label={`Step count (target ${formatTargetInt(INPUT_TARGETS.STEPS)})`}
          inputMode="numeric"
          value={form.stepCount}
          onChange={(s) => setForm((f) => ({ ...f, stepCount: s }))}
          disabled={busy}
        />
        <Field
          label={`Fibre consumed (g, target ${INPUT_TARGETS.FIBER_G})`}
          inputMode="numeric"
          value={form.fiberConsumed}
          onChange={(s) => setForm((f) => ({ ...f, fiberConsumed: s }))}
          disabled={busy}
        />
        <Field
          label={`Fruit consumed (g, target ${INPUT_TARGETS.FRUITS_G})`}
          inputMode="numeric"
          value={form.fruitsConsumed}
          onChange={(s) => setForm((f) => ({ ...f, fruitsConsumed: s }))}
          disabled={busy}
        />
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2">
          Water intake (actual)
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.waterIntake}
            onChange={(e) =>
              setForm((f) => ({ ...f, waterIntake: e.target.value }))
            }
            placeholder="e.g. 3.5 L"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2">
          Training notes
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.trainingNotes}
            onChange={(e) =>
              setForm((f) => ({ ...f, trainingNotes: e.target.value }))
            }
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2">
          Notes
          <textarea
            rows={2}
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            disabled={busy}
          />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-4 border-t border-zinc-100 pt-4">
        <Toggle
          label="Training done"
          checked={form.trainingDone}
          onChange={(v) => setForm((f) => ({ ...f, trainingDone: v }))}
          disabled={busy}
        />
        <Toggle
          label="Walk after lunch"
          checked={form.walkAfterLunch}
          onChange={(v) => setForm((f) => ({ ...f, walkAfterLunch: v }))}
          disabled={busy}
        />
        <Toggle
          label="Walk after dinner"
          checked={form.walkAfterDinner}
          onChange={(v) => setForm((f) => ({ ...f, walkAfterDinner: v }))}
          disabled={busy}
        />
        <Toggle
          label="Zone 2 done"
          checked={form.zone2Done}
          onChange={(v) => setForm((f) => ({ ...f, zone2Done: v }))}
          disabled={busy}
        />
      </div>

      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : existing ? "Update day" : "Save day"}
        </button>
      </div>
    </form>
  );
}

/** Empty or whitespace → 0; invalid → null */
function parseQty(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

/** For progress bars while typing */
function previewNum(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function Field({
  label,
  value,
  onChange,
  disabled,
  inputMode = "numeric",
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  disabled?: boolean;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <label className="block text-xs font-medium text-zinc-600">
      {label}
      <input
        type="text"
        inputMode={inputMode}
        autoComplete="off"
        className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
  disabled,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-800">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="rounded border-zinc-300"
      />
      {label}
    </label>
  );
}
