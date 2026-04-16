"use client";

import { useMemo, useState } from "react";
import type { UniqueFoodEntry } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";
import { cn } from "@/lib/utils";

type SortKey =
  | "foodName"
  | "caloriesPer100g"
  | "proteinPer100g"
  | "fatPer100g"
  | "fiberPer100g";

/** Case-insensitive primary order; ties broken so lowercase sorts before uppercase. */
function compareFoodNamesAlphabetically(a: string, b: string): number {
  const primary = a.toLowerCase().localeCompare(b.toLowerCase(), undefined, {
    sensitivity: "base",
  });
  if (primary !== 0) return primary;

  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    if (a[i] === b[i]) continue;
    const al = a[i].toLowerCase();
    const bl = b[i].toLowerCase();
    if (al !== bl) {
      return al.localeCompare(bl, undefined, { sensitivity: "base" });
    }
    const aIsLower = a[i] === al;
    const bIsLower = b[i] === bl;
    if (aIsLower !== bIsLower) return aIsLower ? -1 : 1;
  }
  return a.length - b.length;
}

function compare(a: UniqueFoodEntry, b: UniqueFoodEntry, key: SortKey): number {
  if (key === "foodName") {
    const cmp = compareFoodNamesAlphabetically(a.foodName, b.foodName);
    if (cmp !== 0) return cmp;
  } else {
    const va = a[key] ?? 0;
    const vb = b[key] ?? 0;
    if (va !== vb) return va < vb ? -1 : 1;
  }
  return a.id.localeCompare(b.id);
}

function fmt(n: number, decimals: number) {
  const v = Number(n) || 0;
  if (!Number.isFinite(v)) return "0";
  const f = 10 ** decimals;
  return String(Math.round(v * f) / f);
}

function SortableTh({
  label,
  sortKey: columnKey,
  activeKey,
  sortDir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  activeKey: SortKey | null;
  sortDir: "asc" | "desc";
  onSort: (k: SortKey) => void;
}) {
  const active = activeKey === columnKey;
  return (
    <th className="px-3 py-3" aria-sort={active ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
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

export function UniqueFoodsTable({
  rows,
  onEdit,
  onDelete,
  busyId,
}: {
  rows: UniqueFoodEntry[];
  onEdit: (row: UniqueFoodEntry) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
}) {
  const [sortKey, setSortKey] = useState<SortKey | null>("foodName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...rows].sort((a, b) => compare(a, b, sortKey) * dir);
  }, [rows, sortKey, sortDir]);

  function handleSort(key: SortKey) {
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
        title="No saved foods yet"
        description='Use “Add saved food” above, or sync from logs (weight required), or log meals on the Dashboard and sync.'
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <p className="border-b border-zinc-100 bg-zinc-50/50 px-3 py-2 text-xs text-zinc-500">
        Macros are per 100 g. The first log on the Dashboard with grams adds a food here;
        logging does not remove or overwrite diet book rows—use Sync or Edit to update values.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <tr>
              <SortableTh
                label="Food"
                sortKey="foodName"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Cal /100g"
                sortKey="caloriesPer100g"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="P g/100g"
                sortKey="proteinPer100g"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="F g/100g"
                sortKey="fatPer100g"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <SortableTh
                label="Fib g/100g"
                sortKey="fiberPer100g"
                activeKey={sortKey}
                sortDir={sortDir}
                onSort={handleSort}
              />
              <th className="px-3 py-3">Fruit</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {sorted.map((r) => (
              <tr key={r.id} className="text-zinc-800">
                <td className="px-3 py-3 font-medium">{r.foodName}</td>
                <td className="px-3 py-3">{fmt(r.caloriesPer100g, 0)}</td>
                <td className="px-3 py-3">{fmt(r.proteinPer100g, 2)}</td>
                <td className="px-3 py-3">{fmt(r.fatPer100g, 2)}</td>
                <td className="px-3 py-3">{fmt(r.fiberPer100g, 2)}</td>
                <td className="px-3 py-3 text-zinc-600">{r.isFruit ? "Yes" : "—"}</td>
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
