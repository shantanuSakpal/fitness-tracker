"use client";

import { SummaryCard } from "@/components/common/SummaryCard";
import { DateSelectorBar } from "@/components/common/DateSelector";
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
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export function FoodClient() {
  const searchParams = useSearchParams();
  const selectedDate = searchParams.get("date")?.slice(0, 10) || todayISODate();

  const [rows, setRows] = useState<FoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showAllDates, setShowAllDates] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchAllFood();
      setRows(data);
    } catch (e) {
      toast.error(
        e instanceof GasApiError ? e.message : "Failed to load food list"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setEditing(null);
  }, [load]);

  const displayRows = useMemo(() => {
    if (showAllDates) return rows;
    return rows.filter((r) => r.date === selectedDate);
  }, [rows, selectedDate, showAllDates]);

  const dayCount = useMemo(
    () => rows.filter((r) => r.date === selectedDate).length,
    [rows, selectedDate]
  );

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
        toast.success("Food updated — daily inputs synced for that date");
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
        toast.success(
          "Food logged — inputs updated (calories, protein, fibre, fruit)"
        );
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
      !window.confirm("Delete this food entry?")
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

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
          Food log
        </h1>
        <p className="text-sm text-zinc-600">
          Each entry is saved for a calendar day. Totals for that day are
          written to <span className="font-medium text-zinc-800">Inputs</span>{" "}
          as calories, protein, and fibre consumed (sum of all food on that
          date).
        </p>
      </header>
      <div className="flex gap-4">
        <DateSelectorBar className="w-1/2" />

        <div className="flex flex-col gap-4 w-1/2">
          <SummaryCard
            title={showAllDates ? "Total entries" : "Entries this day"}
            value={showAllDates ? rows.length : dayCount}
            hint={
              showAllDates
                ? "Across every logged date"
                : `Date ${selectedDate} `
            }
            className="w-full"
          />
          {/* <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-zinc-700">
              <input
                type="checkbox"
                checked={showAllDates}
                onChange={(e) => setShowAllDates(e.target.checked)}
                className="rounded border-zinc-300"
              />
              Show all dates
            </label>
          </div> */}
        </div>
      </div>

      <FoodForm
        selectedDate={selectedDate}
        editing={editing}
        onSubmit={onSubmit}
        onCancelEdit={() => setEditing(null)}
        busy={busy}
      />

      {loading ? (
        <Loader />
      ) : (
        <FoodTable
          rows={displayRows}
          showDateColumn={showAllDates}
          onEdit={setEditing}
          onDelete={onDelete}
          busyId={busyId}
        />
      )}
    </div>
  );
}
