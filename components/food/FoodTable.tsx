"use client";

import { useMemo, useState } from "react";
import type { FoodEntry } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";
import { cn, formatDisplayDate } from "@/lib/utils";

type FoodSortKey =
  | "foodName"
  | "weightGrams"
  | "calories"
  | "protein"
  | "fat"
  | "fiber";

function compareFoodRows(a: FoodEntry, b: FoodEntry, key: FoodSortKey): number {
  if (key === "foodName") {
    const cmp = a.foodName.localeCompare(b.foodName, undefined, {
      sensitivity: "base",
    });
    if (cmp !== 0) return cmp;
  } else {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    if (va !== vb) return va < vb ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

/** Newest `createdAt` first; `id` breaks ties (ISO timestamps compare lexicographically). */
function compareByCreatedAtDesc(a: FoodEntry, b: FoodEntry): number {
  const c = b.createdAt.localeCompare(a.createdAt);
  return c !== 0 ? c : b.id.localeCompare(a.id);
}

function SortableTh({
  label,
  sortKey: columnKey,
  activeKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: FoodSortKey;
  activeKey: FoodSortKey | null;
  sortDir: "asc" | "desc";
  onSort: (k: FoodSortKey) => void;
}) {
  const active = activeKey === columnKey;
  return (
    <th
      className="px-3 py-3"
      aria-sort={
        active
          ? sortDir === "asc"
            ? "ascending"
            : "descending"
          : undefined
      }
    >
      <button
        type="button"
        onClick={() => onSort(columnKey)}
        className={cn(
          "-ml-1 inline-flex items-center gap-1 rounded px-1 py-0.5 text-left uppercase tracking-wide transition-colors hover:bg-zinc-100 hover:text-zinc-700",
          active ? "text-zinc-900" : "text-zinc-500"
        )}
        title={`Sort by ${label}`}
      >
        <span>{label}</span>
        {active ? (
          <span aria-hidden className="font-normal normal-case text-zinc-600">
            {sortDir === "asc" ? "↑" : "↓"}
          </span>
        ) : null}
      </button>
    </th>
  );
}

export function FoodTable({
  rows,
  showDateColumn,
  onEdit,
  onDelete,
  busyId,
  emptyDescription,
}: {
  rows: FoodEntry[];
  showDateColumn?: boolean;
  onEdit: (row: FoodEntry) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
  /** Override default empty copy (e.g. diet book has no inline form). */
  emptyDescription?: string;
}) {
  const [sortKey, setSortKey] = useState<FoodSortKey | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sortedRows = useMemo(() => {
    const copy = [...rows];
    if (!sortKey) {
      copy.sort(compareByCreatedAtDesc);
      return copy;
    }
    const dir = sortDir === "asc" ? 1 : -1;
    return copy.sort((a, b) => compareFoodRows(a, b, sortKey) * dir);
  }, [rows, sortKey, sortDir]);

  function handleSort(key: FoodSortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No foods logged"
        description={
          emptyDescription ??
          "Add a meal above, or turn on “Show all dates” if entries are on another day."
        }
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              {showDateColumn ? (
                <th className="px-3 py-3">Date</th>
              ) : null}
              <SortableTh
                label="Food"
                sortKey="foodName"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Wt (g)"
                sortKey="weightGrams"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="px-3 py-3">Cnt</th>
              <SortableTh
                label="Cal"
                sortKey="calories"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="P (g)"
                sortKey="protein"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="F (g)"
                sortKey="fat"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Fib (g)"
                sortKey="fiber"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="px-3 py-3">Fruit</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sortedRows.map((r) => (
              <tr key={r.id} className="text-zinc-800">
                {showDateColumn ? (
                  <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                    {r.date ? formatDisplayDate(r.date) : "—"}
                  </td>
                ) : null}
                <td className="px-3 py-3 font-medium">{r.foodName}</td>
                <td className="px-3 py-3 text-zinc-600">
                  {r.weightGrams > 0 ? r.weightGrams : "—"}
                </td>
                <td className="px-3 py-3 text-zinc-600">
                  {r.unitCount > 0 ? r.unitCount : "—"}
                </td>
                <td className="px-3 py-3">{r.calories}</td>
                <td className="px-3 py-3">{r.protein ?? 0}</td>
                <td className="px-3 py-3">{r.fat ?? 0}</td>
                <td className="px-3 py-3">{r.fiber ?? 0}</td>
                <td className="whitespace-nowrap px-3 py-3 text-zinc-600">
                  {r.isFruit && r.fruitGrams > 0
                    ? `${r.fruitGrams} g`
                    : r.isFruit
                      ? "0 g"
                      : "—"}
                </td>
                <td className="max-w-[160px] truncate px-3 py-3 text-zinc-600">
                  {r.notes || "—"}
                </td>
                <td className="px-3 py-3 text-right">
                  <button
                    type="button"
                    onClick={() => onEdit(r)}
                    disabled={busyId !== null}
                    className="mr-2 text-xs font-medium text-zinc-700 hover:text-zinc-900 disabled:opacity-50"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => onDelete(r.id)}
                    disabled={busyId === r.id}
                    className="text-xs font-medium text-red-600 hover:text-red-700 disabled:opacity-50"
                  >
                    {busyId === r.id ? "…" : "Delete"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
