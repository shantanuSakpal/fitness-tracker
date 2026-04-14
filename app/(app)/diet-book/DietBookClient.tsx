"use client";

import Link from "next/link";
import { Loader } from "@/components/common/Loader";
import { UniqueFoodForm } from "@/components/food/UniqueFoodForm";
import { UniqueFoodsTable } from "@/components/food/UniqueFoodsTable";
import {
  createUniqueFood,
  fetchUniqueFoods,
  GasApiError,
  removeUniqueFood,
  syncUniqueFoodsCatalog,
  updateUniqueFood,
} from "@/lib/api";
import type { UniqueFoodEntry } from "@/lib/types";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function DietBookClient() {
  const [uniqueFoods, setUniqueFoods] = useState<UniqueFoodEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncCatalogBusy, setSyncCatalogBusy] = useState(false);
  const [editingUnique, setEditingUnique] = useState<
    UniqueFoodEntry | "new" | null
  >(null);
  const [catalogFormBusy, setCatalogFormBusy] = useState(false);
  const [catalogBusyId, setCatalogBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const catalog = await fetchUniqueFoods();
      setUniqueFoods(catalog);
    } catch (e) {
      toast.error(
        e instanceof GasApiError ? e.message : "Failed to load saved foods"
      );
    } finally {
      setLoading(false);
    }
  }, []);

  async function onSyncCatalog() {
    setSyncCatalogBusy(true);
    try {
      const { upserted } = await syncUniqueFoodsCatalog();
      toast.success(
        upserted === 0
          ? "No catalog updates — logs need entries with weight > 0."
          : `Saved foods catalog updated (${upserted} item${upserted === 1 ? "" : "s"}).`
      );
      await load();
      setEditingUnique(null);
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Sync failed");
    } finally {
      setSyncCatalogBusy(false);
    }
  }

  useEffect(() => {
    load();
    setEditingUnique(null);
  }, [load]);

  async function onSubmitUniqueFood(payload: {
    foodName: string;
    isFruit: boolean;
    caloriesPer100g: number;
    proteinPer100g: number;
    fatPer100g: number;
    fiberPer100g: number;
    id?: string;
  }) {
    setCatalogFormBusy(true);
    try {
      if (payload.id) {
        await updateUniqueFood({
          id: payload.id,
          foodName: payload.foodName,
          isFruit: payload.isFruit,
          caloriesPer100g: payload.caloriesPer100g,
          proteinPer100g: payload.proteinPer100g,
          fatPer100g: payload.fatPer100g,
          fiberPer100g: payload.fiberPer100g,
        });
        toast.success("Saved food updated");
      } else {
        await createUniqueFood({
          foodName: payload.foodName,
          isFruit: payload.isFruit,
          caloriesPer100g: payload.caloriesPer100g,
          proteinPer100g: payload.proteinPer100g,
          fatPer100g: payload.fatPer100g,
          fiberPer100g: payload.fiberPer100g,
        });
        toast.success("Saved food added");
      }
      setEditingUnique(null);
      await load();
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Save failed");
    } finally {
      setCatalogFormBusy(false);
    }
  }

  async function onDeleteUniqueFood(id: string) {
    if (
      typeof window !== "undefined" &&
      !window.confirm(
        "Remove this saved food from the catalog? Dashboard quick-pick will no longer list it."
      )
    )
      return;
    setCatalogBusyId(id);
    try {
      await removeUniqueFood(id);
      toast.success("Saved food removed");
      if (editingUnique !== "new" && editingUnique?.id === id) {
        setEditingUnique(null);
      }
      await load();
    } catch (e) {
      toast.error(e instanceof GasApiError ? e.message : "Delete failed");
    } finally {
      setCatalogBusyId(null);
    }
  }

  const uniqueFormEditing =
    editingUnique === "new" ? null : editingUnique;
  const uniqueFormKey =
    editingUnique === "new"
      ? "unique-new"
      : editingUnique
        ? editingUnique.id
        : "unique-closed";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
            Your Diet Book
          </h1>
          <p className="text-sm text-zinc-600">
            Per-100 g reference foods for quick-pick on the{" "}
            <Link
              href="/dashboard"
              className="font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600"
            >
              Dashboard
            </Link>
            . Add or edit items here, or pull averages from your log with sync.
          </p>
          <p className="text-xs text-zinc-500">
            {uniqueFoods.length} saved food
            {uniqueFoods.length === 1 ? "" : "s"}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setEditingUnique("new")}
            disabled={editingUnique !== null || catalogFormBusy}
            className="rounded-lg bg-zinc-900 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-800 disabled:opacity-50"
          >
            Add saved food
          </button>
          <button
            type="button"
            onClick={() => void onSyncCatalog()}
            disabled={
              syncCatalogBusy || catalogFormBusy || editingUnique !== null
            }
            className="rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 disabled:opacity-50"
          >
            {syncCatalogBusy ? "Syncing…" : "Sync saved foods"}
          </button>
        </div>
      </header>

      {loading ? (
        <Loader />
      ) : (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">
            Saved foods (per 100 g)
          </h2>
          {editingUnique ? (
            <UniqueFoodForm
              key={uniqueFormKey}
              editing={uniqueFormEditing}
              onSubmit={onSubmitUniqueFood}
              onCancel={() => setEditingUnique(null)}
              busy={catalogFormBusy}
            />
          ) : null}
          <UniqueFoodsTable
            rows={uniqueFoods}
            onEdit={setEditingUnique}
            onDelete={onDeleteUniqueFood}
            busyId={catalogBusyId}
          />
        </section>
      )}
    </div>
  );
}
