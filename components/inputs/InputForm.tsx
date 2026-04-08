"use client";

import type { InputRecord, SaveInputsPayload } from "@/lib/types";
import { INPUT_TARGETS, formatTargetInt } from "@/lib/inputTargets";
import { useCallback, useEffect, useState } from "react";

type InputFormState = {
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
  };
}

function recordToSavePayload(r: InputRecord, date: string): SaveInputsPayload {
  return {
    date,
    id: r.id,
    caloriesTarget: INPUT_TARGETS.CALORIES,
    proteinTarget: INPUT_TARGETS.PROTEIN_G,
    caloriesConsumed: r.caloriesConsumed,
    proteinConsumed: r.proteinConsumed,
    trainingDone: r.trainingDone,
    trainingNotes: r.trainingNotes,
    sleepHours: r.sleepHours,
    stepCount: r.stepCount,
    walkAfterLunch: r.walkAfterLunch,
    walkAfterDinner: r.walkAfterDinner,
    zone2Done: r.zone2Done,
    waterIntake: r.waterIntake,
    notes: r.notes,
    fiberConsumed: r.fiberConsumed ?? 0,
    fruitsConsumed: r.fruitsConsumed ?? 0,
  };
}

function emptySavePayload(date: string): SaveInputsPayload {
  return {
    date,
    caloriesTarget: INPUT_TARGETS.CALORIES,
    proteinTarget: INPUT_TARGETS.PROTEIN_G,
    caloriesConsumed: 0,
    proteinConsumed: 0,
    trainingDone: false,
    trainingNotes: "",
    sleepHours: 0,
    stepCount: 0,
    walkAfterLunch: false,
    walkAfterDinner: false,
    zone2Done: false,
    waterIntake: "",
    notes: "",
    fiberConsumed: 0,
    fruitsConsumed: 0,
  };
}

function basePayload(
  existing: InputRecord | null,
  date: string
): SaveInputsPayload {
  return existing
    ? recordToSavePayload(existing, date)
    : emptySavePayload(date);
}

export function InputForm({
  date,
  existing,
  onSave,
}: {
  date: string;
  existing: InputRecord | null;
  onSave: (p: SaveInputsPayload) => Promise<void>;
}) {
  const [form, setForm] = useState<InputFormState>(() =>
    existing ? recordToForm(existing) : emptyForm()
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [rowError, setRowError] = useState<{
    key: string;
    msg: string;
  } | null>(null);

  useEffect(() => {
    setForm(existing ? recordToForm(existing) : emptyForm());
    setRowError(null);
  }, [existing, date]);

  const runSave = useCallback(
    async (key: string, payload: SaveInputsPayload) => {
      setSaving(key);
      setRowError(null);
      try {
        await onSave(payload);
      } finally {
        setSaving(null);
      }
    },
    [onSave]
  );

  const labelSave = existing ? "Update" : "Save";
  const anySaving = saving !== null;

  async function saveCalories() {
    const n = parseQty(form.caloriesConsumed);
    if (n === null) {
      setRowError({
        key: "calories",
        msg: "Enter a valid non-negative number (or leave blank for 0).",
      });
      return;
    }
    await runSave("calories", {
      ...basePayload(existing, date),
      caloriesConsumed: n,
    });
  }

  async function saveProtein() {
    const n = parseQty(form.proteinConsumed);
    if (n === null) {
      setRowError({
        key: "protein",
        msg: "Enter a valid non-negative number (or leave blank for 0).",
      });
      return;
    }
    await runSave("protein", {
      ...basePayload(existing, date),
      proteinConsumed: n,
    });
  }

  async function saveSleep() {
    const n = parseQty(form.sleepHours);
    if (n === null) {
      setRowError({
        key: "sleep",
        msg: "Enter a valid non-negative number (or leave blank for 0).",
      });
      return;
    }
    await runSave("sleep", {
      ...basePayload(existing, date),
      sleepHours: n,
    });
  }

  async function saveSteps() {
    const n = parseQty(form.stepCount);
    if (n === null) {
      setRowError({
        key: "steps",
        msg: "Enter a valid non-negative number (or leave blank for 0).",
      });
      return;
    }
    await runSave("steps", {
      ...basePayload(existing, date),
      stepCount: n,
    });
  }

  async function saveFiber() {
    const n = parseQty(form.fiberConsumed);
    if (n === null) {
      setRowError({
        key: "fiber",
        msg: "Enter a valid non-negative number (or leave blank for 0).",
      });
      return;
    }
    await runSave("fiber", {
      ...basePayload(existing, date),
      fiberConsumed: n,
    });
  }

  async function saveFruits() {
    const n = parseQty(form.fruitsConsumed);
    if (n === null) {
      setRowError({
        key: "fruits",
        msg: "Enter a valid non-negative number (or leave blank for 0).",
      });
      return;
    }
    await runSave("fruits", {
      ...basePayload(existing, date),
      fruitsConsumed: n,
    });
  }

  async function saveWater() {
    await runSave("water", {
      ...basePayload(existing, date),
      waterIntake: form.waterIntake,
    });
  }

  async function saveTrainingNotes() {
    await runSave("trainingNotes", {
      ...basePayload(existing, date),
      trainingNotes: form.trainingNotes,
    });
  }

  async function saveNotes() {
    await runSave("notes", {
      ...basePayload(existing, date),
      notes: form.notes,
    });
  }

  async function saveTrainingDone() {
    await runSave("trainingDone", {
      ...basePayload(existing, date),
      trainingDone: form.trainingDone,
    });
  }

  async function saveWalkLunch() {
    await runSave("walkLunch", {
      ...basePayload(existing, date),
      walkAfterLunch: form.walkAfterLunch,
    });
  }

  async function saveWalkDinner() {
    await runSave("walkDinner", {
      ...basePayload(existing, date),
      walkAfterDinner: form.walkAfterDinner,
    });
  }

  async function saveZone2() {
    await runSave("zone2", {
      ...basePayload(existing, date),
      zone2Done: form.zone2Done,
    });
  }

  function errFor(key: string) {
    return rowError?.key === key ? rowError.msg : null;
  }

  return (
    <div className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-zinc-900">Log actuals</h3>
      <p className="mt-1 text-xs text-zinc-500">
        Each field has its own button. Saved values sync with the rest of the
        app for this day.
      </p>

      <div className="mt-6 space-y-5">
        <FieldRow
          label="Calories consumed"
          inputMode="numeric"
          value={form.caloriesConsumed}
          onChange={(s) => setForm((f) => ({ ...f, caloriesConsumed: s }))}
          onSubmit={saveCalories}
          disabled={anySaving}
          saving={saving === "calories"}
          buttonLabel={labelSave}
          error={errFor("calories")}
        />
        <FieldRow
          label="Protein consumed (g)"
          inputMode="numeric"
          value={form.proteinConsumed}
          onChange={(s) => setForm((f) => ({ ...f, proteinConsumed: s }))}
          onSubmit={saveProtein}
          disabled={anySaving}
          saving={saving === "protein"}
          buttonLabel={labelSave}
          error={errFor("protein")}
        />
        <FieldRow
          label="Sleep hours (actual)"
          inputMode="decimal"
          value={form.sleepHours}
          onChange={(s) => setForm((f) => ({ ...f, sleepHours: s }))}
          onSubmit={saveSleep}
          disabled={anySaving}
          saving={saving === "sleep"}
          buttonLabel={labelSave}
          error={errFor("sleep")}
        />
        <FieldRow
          label={`Step count (target ${formatTargetInt(INPUT_TARGETS.STEPS)})`}
          inputMode="numeric"
          value={form.stepCount}
          onChange={(s) => setForm((f) => ({ ...f, stepCount: s }))}
          onSubmit={saveSteps}
          disabled={anySaving}
          saving={saving === "steps"}
          buttonLabel={labelSave}
          error={errFor("steps")}
        />
        <FieldRow
          label={`Fibre consumed (g, target ${INPUT_TARGETS.FIBER_G})`}
          inputMode="numeric"
          value={form.fiberConsumed}
          onChange={(s) => setForm((f) => ({ ...f, fiberConsumed: s }))}
          onSubmit={saveFiber}
          disabled={anySaving}
          saving={saving === "fiber"}
          buttonLabel={labelSave}
          error={errFor("fiber")}
        />
        <FieldRow
          label={`Fruit consumed (g, target ${INPUT_TARGETS.FRUITS_G})`}
          inputMode="numeric"
          value={form.fruitsConsumed}
          onChange={(s) => setForm((f) => ({ ...f, fruitsConsumed: s }))}
          onSubmit={saveFruits}
          disabled={anySaving}
          saving={saving === "fruits"}
          buttonLabel={labelSave}
          error={errFor("fruits")}
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <label className="block min-w-0 flex-1 text-xs font-medium text-zinc-600">
            Water intake (actual)
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={form.waterIntake}
              onChange={(e) =>
                setForm((f) => ({ ...f, waterIntake: e.target.value }))
              }
              placeholder="e.g. 3.5 L"
              disabled={anySaving}
            />
          </label>
          <button
            type="button"
            onClick={() => void saveWater()}
            disabled={anySaving}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:mb-0.5"
          >
            {saving === "water" ? "…" : labelSave}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <label className="block min-w-0 flex-1 text-xs font-medium text-zinc-600">
            Training notes
            <input
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={form.trainingNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, trainingNotes: e.target.value }))
              }
              disabled={anySaving}
            />
          </label>
          <button
            type="button"
            onClick={() => void saveTrainingNotes()}
            disabled={anySaving}
            className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:mb-0.5"
          >
            {saving === "trainingNotes" ? "…" : labelSave}
          </button>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
          <label className="block min-w-0 flex-1 text-xs font-medium text-zinc-600">
            Notes
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={form.notes}
              onChange={(e) =>
                setForm((f) => ({ ...f, notes: e.target.value }))
              }
              disabled={anySaving}
            />
          </label>
          <button
            type="button"
            onClick={() => void saveNotes()}
            disabled={anySaving}
            className="shrink-0 self-start rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:self-end sm:mb-0.5"
          >
            {saving === "notes" ? "…" : labelSave}
          </button>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Habits
          </p>
          <div className="mt-3 space-y-3">
            <ToggleRow
              label="Training done"
              checked={form.trainingDone}
              onChange={(v) => setForm((f) => ({ ...f, trainingDone: v }))}
              onSubmit={saveTrainingDone}
              disabled={anySaving}
              saving={saving === "trainingDone"}
              buttonLabel={labelSave}
            />
            <ToggleRow
              label="Walk after lunch"
              checked={form.walkAfterLunch}
              onChange={(v) => setForm((f) => ({ ...f, walkAfterLunch: v }))}
              onSubmit={saveWalkLunch}
              disabled={anySaving}
              saving={saving === "walkLunch"}
              buttonLabel={labelSave}
            />
            <ToggleRow
              label="Walk after dinner"
              checked={form.walkAfterDinner}
              onChange={(v) => setForm((f) => ({ ...f, walkAfterDinner: v }))}
              onSubmit={saveWalkDinner}
              disabled={anySaving}
              saving={saving === "walkDinner"}
              buttonLabel={labelSave}
            />
            <ToggleRow
              label="Cardio done"
              checked={form.zone2Done}
              onChange={(v) => setForm((f) => ({ ...f, zone2Done: v }))}
              onSubmit={saveZone2}
              disabled={anySaving}
              saving={saving === "zone2"}
              buttonLabel={labelSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function FieldRow({
  label,
  value,
  onChange,
  onSubmit,
  disabled,
  saving,
  buttonLabel,
  error,
  inputMode = "numeric",
}: {
  label: string;
  value: string;
  onChange: (s: string) => void;
  onSubmit: () => void | Promise<void>;
  disabled?: boolean;
  saving: boolean;
  buttonLabel: string;
  error: string | null;
  inputMode?: "numeric" | "decimal";
}) {
  return (
    <div>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:gap-3">
        <label className="block min-w-0 flex-1 text-xs font-medium text-zinc-600">
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
        <button
          type="button"
          onClick={() => void onSubmit()}
          disabled={disabled}
          className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50 sm:mb-0.5"
        >
          {saving ? "…" : buttonLabel}
        </button>
      </div>
      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  onSubmit,
  disabled,
  saving,
  buttonLabel,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  onSubmit: () => void | Promise<void>;
  disabled?: boolean;
  saving: boolean;
  buttonLabel: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
      <label className="flex min-w-0 cursor-pointer items-center gap-2 text-sm text-zinc-800">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="rounded border-zinc-300"
        />
        {label}
      </label>
      <button
        type="button"
        onClick={() => void onSubmit()}
        disabled={disabled}
        className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
      >
        {saving ? "…" : buttonLabel}
      </button>
    </div>
  );
}

function parseQty(raw: string): number | null {
  const t = raw.trim();
  if (t === "") return 0;
  const n = Number(t);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}
