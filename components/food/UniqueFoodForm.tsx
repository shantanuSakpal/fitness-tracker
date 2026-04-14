"use client";

import type { UniqueFoodEntry } from "@/lib/types";
import { useState } from "react";

const empty = {
  foodName: "",
  isFruit: false,
  caloriesPer100g: "",
  proteinPer100g: "",
  fatPer100g: "",
  fiberPer100g: "",
};

function formFromEditing(editing: UniqueFoodEntry | null): typeof empty {
  if (!editing) return empty;
  return {
    foodName: editing.foodName,
    isFruit: Boolean(editing.isFruit),
    caloriesPer100g: String(editing.caloriesPer100g ?? 0),
    proteinPer100g: String(editing.proteinPer100g ?? 0),
    fatPer100g: String(editing.fatPer100g ?? 0),
    fiberPer100g: String(editing.fiberPer100g ?? 0),
  };
}

export function UniqueFoodForm({
  editing,
  onSubmit,
  onCancel,
  busy,
}: {
  editing: UniqueFoodEntry | null;
  onSubmit: (p: {
    foodName: string;
    isFruit: boolean;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
    id?: string;
  }) => Promise<void>;
  onCancel: () => void;
  busy: boolean;
}) {
  const [form, setForm] = useState(() => formFromEditing(editing));
  const [error, setError] = useState<string | null>(null);

  function nonNeg(label: string, raw: string): number | null {
    const n = Number(raw);
    if (!Number.isFinite(n) || n < 0) {
      setError(`${label} must be a non-negative number.`);
      return null;
    }
    return n;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const foodName = form.foodName.trim();
    if (!foodName) {
      setError("Food name is required.");
      return;
    }
    const caloriesPer100g = nonNeg("Calories per 100 g", form.caloriesPer100g);
    if (caloriesPer100g === null) return;
    const proteinPer100g = nonNeg("Protein per 100 g", form.proteinPer100g);
    if (proteinPer100g === null) return;
    const fatPer100g = nonNeg("Fat per 100 g", form.fatPer100g);
    if (fatPer100g === null) return;
    const fiberPer100g = nonNeg("Fibre per 100 g", form.fiberPer100g);
    if (fiberPer100g === null) return;

    await onSubmit({
      id: editing?.id,
      foodName,
      isFruit: form.isFruit,
      caloriesPer100g,
      proteinPer100g,
      fatPer100g,
      fiberPer100g,
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
          {editing ? "Edit saved food" : "Add saved food"}
        </h3>
        <button
          type="button"
          onClick={onCancel}
          className="text-xs font-medium text-zinc-600 hover:text-zinc-900"
        >
          Cancel
        </button>
      </div>
      <p className="mt-1 text-xs text-zinc-500">
        Values are per <span className="font-medium text-zinc-700">100 g</span>{" "}
        (same as quick-pick on the Dashboard). Names match case-insensitively.
      </p>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
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
                placeholder="e.g. Greek yogurt"
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
          Calories /100 g
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.caloriesPer100g}
            onChange={(e) =>
              setForm((f) => ({ ...f, caloriesPer100g: e.target.value }))
            }
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Protein (g) / 100 g
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.proteinPer100g}
            onChange={(e) =>
              setForm((f) => ({ ...f, proteinPer100g: e.target.value }))
            }
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Fat (g) / 100 g
          <input
            inputMode="decimal"
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.fatPer100g}
            onChange={(e) =>
              setForm((f) => ({ ...f, fatPer100g: e.target.value }))
            }
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2 lg:col-span-3">
          Fibre (g) / 100 g
          <input
            inputMode="decimal"
            className="mt-1 w-full max-w-md rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.fiberPer100g}
            onChange={(e) =>
              setForm((f) => ({ ...f, fiberPer100g: e.target.value }))
            }
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
          {busy ? "Saving…" : editing ? "Update" : "Add"}
        </button>
      </div>
    </form>
  );
}
