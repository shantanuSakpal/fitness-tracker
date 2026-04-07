"use client";

import type { OutputRecord, SaveOutputsPayload } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

function defaultsFor(date: string): SaveOutputsPayload {
  return {
    date,
    bodyWeight: 0,
    waist: 0,
    chest: 0,
    arm: 0,
    thigh: 0,
    progressPhotoUrl: "",
    energyLevel: "",
    mood: "",
    recovery: "",
    notes: "",
  };
}

function recordToForm(r: OutputRecord): SaveOutputsPayload {
  return {
    date: r.date,
    bodyWeight: r.bodyWeight,
    waist: r.waist,
    chest: r.chest,
    arm: r.arm,
    thigh: r.thigh,
    progressPhotoUrl: r.progressPhotoUrl,
    energyLevel: r.energyLevel,
    mood: r.mood,
    recovery: r.recovery,
    notes: r.notes,
    id: r.id,
  };
}

const measures = [
  { key: "bodyWeight" as const, label: "Body weight" },
  { key: "waist" as const, label: "Waist" },
  { key: "chest" as const, label: "Chest" },
  { key: "arm" as const, label: "Arm" },
  { key: "thigh" as const, label: "Thigh" },
];

export function OutputForm({
  date,
  existing,
  onSave,
  busy,
}: {
  date: string;
  existing: OutputRecord | null;
  onSave: (p: SaveOutputsPayload) => Promise<void>;
  busy: boolean;
}) {
  const base = useMemo(
    () => (existing ? recordToForm(existing) : defaultsFor(date)),
    [existing, date]
  );
  const [form, setForm] = useState(base);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setForm(existing ? recordToForm(existing) : defaultsFor(date));
    setError(null);
  }, [existing, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const nums = measures.map((m) => Number(form[m.key]));
    if (nums.some((n) => !Number.isFinite(n) || n < 0)) {
      setError("Measurements must be non-negative numbers.");
      return;
    }
    await onSave({
      ...form,
      date,
      id: existing?.id,
      bodyWeight: Number(form.bodyWeight),
      waist: Number(form.waist),
      chest: Number(form.chest),
      arm: Number(form.arm),
      thigh: Number(form.thigh),
    });
  }

  return (
    <form
      onSubmit={submit}
      className="rounded-xl border border-zinc-200/80 bg-white p-4 shadow-sm"
    >
      <h3 className="text-sm font-semibold text-zinc-900">Body & recovery</h3>
      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {measures.map((m) => (
          <label key={m.key} className="block text-xs font-medium text-zinc-600">
            {m.label}
            <input
              type="number"
              min={0}
              step={0.1}
              className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              value={form[m.key]}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  [m.key]: Number(e.target.value),
                }))
              }
              disabled={busy}
            />
          </label>
        ))}
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2 lg:col-span-3">
          Progress photo URL
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.progressPhotoUrl}
            onChange={(e) =>
              setForm((f) => ({ ...f, progressPhotoUrl: e.target.value }))
            }
            placeholder="https://…"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Energy
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.energyLevel}
            onChange={(e) =>
              setForm((f) => ({ ...f, energyLevel: e.target.value }))
            }
            placeholder="1–10 or label"
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Mood
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.mood}
            onChange={(e) => setForm((f) => ({ ...f, mood: e.target.value }))}
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600">
          Recovery
          <input
            className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            value={form.recovery}
            onChange={(e) =>
              setForm((f) => ({ ...f, recovery: e.target.value }))
            }
            disabled={busy}
          />
        </label>
        <label className="block text-xs font-medium text-zinc-600 sm:col-span-2 lg:col-span-3">
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
      <div className="mt-6 flex justify-end">
        <button
          type="submit"
          disabled={busy}
          className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
        >
          {busy ? "Saving…" : existing ? "Update" : "Save"}
        </button>
      </div>
    </form>
  );
}
