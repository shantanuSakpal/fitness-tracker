"use client";

import { DateSelectorBar } from "@/components/common/DateSelector";
import { EmptyState } from "@/components/common/EmptyState";
import { Loader } from "@/components/common/Loader";
import { InputProgressBars } from "@/components/dashboard/InputProgressBars";
import { FoodAssistant } from "@/components/food/FoodAssistant";
import { FoodForm } from "@/components/food/FoodForm";
import { FoodTable } from "@/components/food/FoodTable";
import {
  createFood,
  fetchAllFood,
  fetchDashboardSummary,
  fetchUniqueFoods,
  GasApiError,
  removeFood,
  syncUniqueFoodsCatalog,
  updateFood,
} from "@/lib/api";
import type { DashboardSummary, FoodEntry, UniqueFoodEntry } from "@/lib/types";
import { formatDisplayDate, todayISODate } from "@/lib/utils";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

export function DashboardClient() {
  const params = useSearchParams();
  const date = params.get("date")?.slice(0, 10) || todayISODate();

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [rows, setRows] = useState<FoodEntry[]>([]);
  const [uniqueFoods, setUniqueFoods] = useState<UniqueFoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<FoodEntry | null>(null);
  const [busy, setBusy] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [syncCatalogBusy, setSyncCatalogBusy] = useState(false);

  const load = useCallback(
    async (options?: { preserveContent?: boolean }) => {
      const preserveContent = Boolean(options?.preserveContent);

      setError(null);

      if (preserveContent) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      try {
        const [s, data, catalog] = await Promise.all([
          fetchDashboardSummary(date),
          fetchAllFood(),
          fetchUniqueFoods(),
        ]);
        setSummary(s);
        setRows(data);
        setUniqueFoods(catalog);
      } catch (e) {
        const msg =
          e instanceof GasApiError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Failed to load dashboard";
        setError(msg);
        if (!preserveContent) {
          setSummary(null);
        }
        toast.error(msg);
      } finally {
        if (preserveContent) {
          setRefreshing(false);
        } else {
          setLoading(false);
        }
      }
    },
    [date],
  );

  useEffect(() => {
    load();
    setEditing(null);
  }, [load]);

  const displayRows = useMemo(
    () => rows.filter((r) => r.date === date),
    [rows, date],
  );

  async function onSyncCatalog() {
    setSyncCatalogBusy(true);
    try {
      const { upserted } = await syncUniqueFoodsCatalog();
      toast.success(
        upserted === 0
          ? "No new catalog rows — add foods with weight in your log, then sync again."
          : `Saved foods catalog updated (${upserted} item${upserted === 1 ? "" : "s"}).`,
      );
      await load({ preserveContent: true });
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Sync failed");
    } finally {
      setSyncCatalogBusy(false);
    }
  }

  async function onSubmitFood(payload: {
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
          "Food logged — inputs updated (calories, protein, fibre, fruit)",
        );
      }
      setEditing(null);
      await load({ preserveContent: true });
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Save failed");
    } finally {
      setBusy(false);
    }
  }

  async function onDeleteFood(id: string) {
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
      await load({ preserveContent: true });
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Overview and food log for {formatDisplayDate(date)}
          </p>
          {refreshing && !loading ? (
            <p className="mt-1 text-xs text-zinc-500">Refreshing data…</p>
          ) : null}
        </div>
        <DateSelectorBar className="max-w-md" />
      </header>

      {loading && <Loader />}
      {!loading && error && (
        <EmptyState
          title="Could not load data"
          description={error}
          action={
            <button
              type="button"
              onClick={() => load()}
              className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
            >
              Retry
            </button>
          }
        />
      )}
      {!loading && !error && summary && (
        <>
          <FoodAssistant
            key={date}
            selectedDate={date}
            onSaved={() => load({ preserveContent: true })}
          />
          <FoodForm
            key={editing?.id ?? "food-new"}
            selectedDate={date}
            editing={editing}
            onSubmit={onSubmitFood}
            onCancelEdit={() => setEditing(null)}
            busy={busy}
            uniqueFoods={uniqueFoods}
            onSyncCatalog={onSyncCatalog}
            syncCatalogBusy={syncCatalogBusy}
          />
          <FoodTable
            rows={displayRows}
            showDateColumn={false}
            onEdit={setEditing}
            onDelete={onDeleteFood}
            busyId={busyId}
          />

          <InputProgressBars summary={summary} />
        </>
      )}
    </div>
  );
}
