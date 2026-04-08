"use client";

import Link from "next/link";
import { Loader } from "@/components/common/Loader";
import { FoodForm } from "@/components/food/FoodForm";
import { FoodTable } from "@/components/food/FoodTable";
import {
  createFood,
  fetchAllFood,
  GasApiError,
  removeFood,
  updateFood,
} from "@/lib/api";
import type { FoodEntry } from "@/lib/types";
import { todayISODate } from "@/lib/utils";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function entryFormDate(entry: FoodEntry | null): string {
  const raw = entry?.date?.slice(0, 10) ?? "";
  return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(raw) ? raw : todayISODate();
}

export function DietBookClient() {
  const [rows, setRows] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllFood();
      setRows(data);
    } catch (e) {
      toast.error(
        e instanceof GasApiError ? e.message : "Failed to load food history"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setEditing(null);
  }, [load]);

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      const da = a.date || "";
      const db = b.date || "";
      if (da !== db) return db.localeCompare(da);
      return b.id.localeCompare(a.id);
    });
  }, [rows]);

  const dateSpan = useMemo(() => {
    const dates = rows
      .map((r) => r.date)
      .filter((d): d is string => Boolean(d && /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(d)));
    if (dates.length === 0) return null;
    const sorted = [...dates].sort();
    return { min: sorted[0]!, max: sorted[sorted.length - 1]! };
  }, [rows]);

  async function onSubmit(payload: {
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
  }) {
    setBusy(true);
    try {
      if (payload.id) {
        await updateFood({
          id: payload.id,
          date: payload.date,
          foodName: payload.foodName,
          weightGrams: payload.weightGrams,
          unitCount: payload.unitCount,
          calories: payload.calories,
          protein: payload.protein,
          fat: payload.fat,
          fiber: payload.fiber,
          isFruit: payload.isFruit,
          notes: payload.notes,
        });
        toast.success("Entry updated — daily inputs synced for that date");
      } else {
        await createFood({
          date: payload.date,
          foodName: payload.foodName,
          weightGrams: payload.weightGrams,
          unitCount: payload.unitCount,
          calories: payload.calories,
          protein: payload.protein,
          fat: payload.fat,
          fiber: payload.fiber,
          isFruit: payload.isFruit,
          notes: payload.notes,
        });
        toast.success("Food logged");
      }
      setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm("Delete this food entry from your diet book?")
    )
      return;
    setBusyId(id);
    try {
      await removeFood(id);
      toast.success("Deleted — inputs recalculated for that date");
      if (editing?.id === id) setEditing(null);
      await load();
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  const formDate = entryFormDate(editing);

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Your Diet Book
        </h1>
        <p className="text-sm text-zinc-600">
          Everything you have logged, newest days first—searchable, sortable
          columns, like a personal food database. Add new meals on{" "}
          <Link
            href="/food"
            className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600"
          >
            Log food
          </Link>
          .
        </p>
        {dateSpan && (
          <p className="text-xs text-zinc-500">
            {rows.length} entr{rows.length === 1 ? "y" : "ies"} across{" "}
            {dateSpan.min === dateSpan.max
              ? dateSpan.min
              : `${dateSpan.min} → ${dateSpan.max}`}
          </p>
        )}
      </header>

      {editing ? (
        <FoodForm
          selectedDate={formDate}
          editing={editing}
          onSubmit={onSubmit}
          onCancelEdit={() => setEditing(null)}
          busy={busy}
          dateHint="This entry stays on its calendar date when you save. Use Log food to add items for a selected day."
        />
      ) : null}

      {loading ? (
        <Loader />
      ) : (
        <FoodTable
          rows={sortedRows}
          showDateColumn
          onEdit={setEditing}
          onDelete={onDelete}
          busyId={busyId}
        />
      )}
    </div>
  );
}
