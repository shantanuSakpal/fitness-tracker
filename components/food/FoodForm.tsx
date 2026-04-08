"use client";

import type { FoodEntry } from "@/lib/types";
import { useEffect, useState } from "react";

function formatMacroField(n: number): string {
  const v = Number(n) || 0;
  if (!Number.isFinite(v)) return "0";
  return String(Math.round(v * 10_000) / 10_000);
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

export function FoodForm({
  selectedDate,
  editing,
  onSubmit,
  onCancelEdit,
  busy,
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
  /** Explains where the saved calendar date comes from (Log food vs Diet book). */
  dateHint?: string;
}) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editing) {
      const uc = editing.unitCount || 0;
      setForm({
        foodName: editing.foodName,
        isFruit: Boolean(editing.isFruit),
        weightGrams: editing.weightGrams > 0 ? String(editing.weightGrams) : "",
        unitCount: uc > 0 ? String(editing.unitCount) : "",
        calories: formatMacroField(editing.calories),
        protein: formatMacroField(editing.protein),
        fat: formatMacroField(editing.fat),
        fiber: formatMacroField(editing.fiber),
        notes: editing.notes,
      });
    } else {
      setForm(empty);
    }
  }, [editing]);

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
    if (!editing) setForm(empty);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">
          {editing ? "Edit food" : "Log food"}
        </h3>
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
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <p className="mt-2 text-xs text-zinc-500">{dateHint}</p>
      <p className="mt-1 text-xs text-zinc-500">
        <span className="font-medium text-zinc-700">Calories and macros</span>{" "}
        are saved exactly as you enter them.
        <span className="font-medium text-zinc-700"> Weight</span> is total
        grams (for fruit, that also updates the daily fruit target).{" "}
        <span className="font-medium text-zinc-700">Count</span> is optional
        for your own reference (e.g. 2 apples).
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <div className="sm:col-span-2 lg:col-span-3">
          <div className="flex flex-wrap items-end gap-4">
            <label className="block min-w-40 flex-1 text-xs font-medium text-zinc-600">
              Name
              <input
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                value={form.foodName}
                onChange={(e) =>
                  setForm((f) => ({ ...f, foodName: e.target.value }))
                }
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
            onChange={(e) =>
              setForm((f) => ({ ...f, weightGrams: e.target.value }))
            }
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
            onChange={(e) =>
              setForm((f) => ({ ...f, calories: e.target.value }))
            }
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
            onChange={(e) =>
              setForm((f) => ({ ...f, protein: e.target.value }))
            }
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
            onChange={(e) => setForm((f) => ({ ...f, fat: e.target.value }))}
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
            onChange={(e) => setForm((f) => ({ ...f, fiber: e.target.value }))}
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
