"use client";

import type { FoodEntry, UniqueFoodEntry } from "@/lib/types";
import { useCallback, useState } from "react";

function formatMacroField(n: number): string {
  const v = Number(n) || 0;
  if (!Number.isFinite(v)) return "0";
  return String(Math.round(v * 10_000) / 10_000);
}

function macroStringsFromPreset(
  u: UniqueFoodEntry,
  weightStr: string
): Pick<typeof empty, "calories" | "protein" | "fat" | "fiber"> {
  const w = Number(String(weightStr).trim());
  if (!Number.isFinite(w) || w <= 0) {
    return { calories: "", protein: "", fat: "", fiber: "" };
  }
  const r = w / 100;
  return {
    calories: String(Math.round(u.caloriesPer100g * r)),
    protein: formatMacroField(u.proteinPer100g * r),
    fat: formatMacroField(u.fatPer100g * r),
    fiber: formatMacroField(u.fiberPer100g * r),
  };
}

const empty = {
  foodName: "",
  isFruit: false,
  weightGrams: "",
  unitCount: "",
  calories: "",
  protein: "",
  fat: "",
  fiber: "",
  notes: "",
};

function formStateFromEditing(editing: FoodEntry | null): typeof empty {
  if (!editing) return empty;
  const uc = editing.unitCount || 0;
  return {
    foodName: editing.foodName,
    isFruit: Boolean(editing.isFruit),
    weightGrams: editing.weightGrams > 0 ? String(editing.weightGrams) : "",
    unitCount: uc > 0 ? String(editing.unitCount) : "",
    calories: formatMacroField(editing.calories),
    protein: formatMacroField(editing.protein),
    fat: formatMacroField(editing.fat),
    fiber: formatMacroField(editing.fiber),
    notes: editing.notes,
  };
}

export function FoodForm({
  selectedDate,
  editing,
  onSubmit,
  onCancelEdit,
  busy,
  uniqueFoods,
  onSyncCatalog,
  syncCatalogBusy = false,
  dateHint = "This log line uses the date from the selector at the top of the page.",
}: {
  selectedDate: string;
  editing: FoodEntry | null;
  onSubmit: (payload: {
    date: string;
    foodName: string;
    weightGrams: number;
    unitCount: number;
    calories: number;
    protein: number;
    fat: number;
    fiber: number;
    isFruit: boolean;
    notes: string;
    id?: string;
  }) => Promise<void>;
  onCancelEdit: () => void;
  busy: boolean;
  uniqueFoods: UniqueFoodEntry[];
  /** Rebuild per-100 g catalog from all food logs (weight > 0). */
  onSyncCatalog?: () => void | Promise<void>;
  syncCatalogBusy?: boolean;
  /** Explains where the saved calendar date comes from (e.g. Dashboard vs Diet book). */
  dateHint?: string;
}) {
  const [form, setForm] = useState(() => formStateFromEditing(editing));
  const [error, setError] = useState<string | null>(null);
  /** When set, calories and macros follow catalog × weight (unless editing). */
  const [presetNameKey, setPresetNameKey] = useState<string | null>(null);

  const clearPreset = useCallback(() => setPresetNameKey(null), []);

  function nonNegField(label: string, raw: string): number | null {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      setError(`${label} must be a non-negative number.`);
      return null;
    }
    return n;
  }

  function optionalNonNeg(raw: string, label: string): number | null {
    const s = raw.trim();
    if (s === "") return 0;
    const n = Number(s);
    if (!Number.isFinite(n) || n < 0) {
      setError(`${label} must be empty or a non-negative number.`);
      return null;
    }
    return n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const dateRaw = selectedDate.trim().slice(0, 10);
    if (!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(dateRaw)) {
      setError("Pick a valid day with the date bar above.");
      return;
    }
    const foodName = form.foodName.trim();
    if (!foodName) {
      setError("Food name is required.");
      return;
    }

    const weightGrams = optionalNonNeg(form.weightGrams, "Weight (g)");
    if (weightGrams === null) return;
    const unitCount = optionalNonNeg(form.unitCount, "Count");
    if (unitCount === null) return;

    if (form.isFruit && weightGrams <= 0) {
      setError(
        "For fruit, enter total weight in grams (e.g. 280 for two apples)."
      );
      return;
    }

    const calories = nonNegField("Calories", form.calories);
    if (calories === null) return;
    const protein = nonNegField("Protein", form.protein);
    if (protein === null) return;
    const fat = nonNegField("Fat", form.fat);
    if (fat === null) return;
    const fiber = nonNegField("Fibre", form.fiber);
    if (fiber === null) return;

    await onSubmit({
      id: editing?.id,
      date: dateRaw,
      foodName,
      weightGrams,
      unitCount,
      calories,
      protein,
      fat,
      fiber,
      isFruit: form.isFruit,
      notes: form.notes.trim(),
    });
    if (!editing) {
      setForm(empty);
      setPresetNameKey(null);
    }
  }

  const editingMode = Boolean(editing);
  const syncBusy = Boolean(syncCatalogBusy);

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          {editing ? "Edit food" : "Add food"}
        </h3>
        <div className="flex flex-wrap items-center gap-2">
          {onSyncCatalog && (
            <button
              type="button"
              onClick={() => void onSyncCatalog()}
              disabled={busy || syncBusy}
              className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
            >
              {syncBusy ? "Syncing…" : "Sync saved foods"}
            </button>
          )}
          {editing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
            >
              Cancel edit
            </button>
          )}
        </div>
      </div>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-zinc-500">{dateHint}</p>
      <p className="mt-1 text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">Quick pick</span> uses your
        per-100 g catalog (run sync to build it from past logs with weight).
        Choose a row, enter <span className="font-medium text-zinc-700">weight</span>
        , and macros scale automatically. Or type a{" "}
        <span className="font-medium text-zinc-700">new name</span> and fill
        macros by hand.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2 lg:col-span-3">
          Saved food (optional)
          <select
            className="mt-1 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm"
            value={editingMode ? "" : presetNameKey ?? ""}
            disabled={busy || editingMode || uniqueFoods.length === 0}
            onChange={(e) => {
              const v = e.target.value;
              if (!v) {
                clearPreset();
                return;
              }
              const u = uniqueFoods.find((x) => x.nameKey === v);
              if (!u) return;
              setPresetNameKey(v);
              setForm((f) => ({
                ...f,
                foodName: u.foodName,
                isFruit: u.isFruit,
                ...macroStringsFromPreset(u, f.weightGrams),
              }));
            }}
          >
            <option value="">
              {uniqueFoods.length === 0
                ? "— Sync catalog first or type a new food below —"
                : "— Type a new food or pick one —"}
            </option>
            {uniqueFoods.map((u) => (
              <option key={u.id} value={u.nameKey}>
                {u.foodName}
              </option>
            ))}
          </select>
        </label>
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="block min-w-40 flex-1 text-xs font-medium text-zinc-600">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={form.foodName}
                onChange={(e) => {
                  clearPreset();
                  setForm((f) => ({ ...f, foodName: e.target.value }));
                }}
                placeholder="e.g. Apple"
                disabled={busy}
              />
            </label>
            <label className="flex cursor-pointer items-center gap-2 pb-2 text-xs font-medium text-zinc-700">
              <input
                type="checkbox"
                checked={form.isFruit}
                onChange={(e) =>
                  setForm((f) => ({ ...f, isFruit: e.target.checked }))
                }
                className="rounded border-zinc-300"
                disabled={busy}
              />
              Fruit
            </label>
          </div>
        </div>
        <label className="block text-xs font-medium text-zinc-600">
          Weight (g)
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.weightGrams}
            onChange={(e) => {
              const w = e.target.value;
              setForm((f) => {
                if (!editingMode && presetNameKey) {
                  const u = uniqueFoods.find((x) => x.nameKey === presetNameKey);
                  if (u) {
                    return {
                      ...f,
                      weightGrams: w,
                      ...macroStringsFromPreset(u, w),
                    };
                  }
                }
                return { ...f, weightGrams: w };
              });
            }}
            placeholder="10 g"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Count
          <input
            inputMode="numeric"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.unitCount}
            onChange={(e) =>
              setForm((f) => ({ ...f, unitCount: e.target.value }))
            }
            placeholder="2"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Calories
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.calories}
            onChange={(e) => {
              clearPreset();
              setForm((f) => ({ ...f, calories: e.target.value }));
            }}
            placeholder="0"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Protein (g)
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.protein}
            onChange={(e) => {
              clearPreset();
              setForm((f) => ({ ...f, protein: e.target.value }));
            }}
            placeholder="0"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Fat (g)
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.fat}
            onChange={(e) => {
              clearPreset();
              setForm((f) => ({ ...f, fat: e.target.value }));
            }}
            placeholder="0"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Fibre (g)
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.fiber}
            onChange={(e) => {
              clearPreset();
              setForm((f) => ({ ...f, fiber: e.target.value }));
            }}
            placeholder="0"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2 lg:col-span-3">
          Notes
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            placeholder="Optional"
            disabled={busy}
          />
        </label>
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : editing ? "Update" : "Add entry"}
        </button>
      </div>
    </form>
  );
}
