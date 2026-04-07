"use client";

import type { FoodEntry } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDisplayDate } from "@/lib/utils";

export function FoodTable({
  rows,
  showDateColumn,
  onEdit,
  onDelete,
  busyId,
}: {
  rows: FoodEntry[];
  showDateColumn?: boolean;
  onEdit: (row: FoodEntry) => void;
  onDelete: (id: string) => void;
  busyId: string | null;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No foods logged"
        description="Add a meal above, or turn on “Show all dates” if entries are on another day."
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
              <th className="px-3 py-3">Food</th>
              <th className="px-3 py-3">Wt (g)</th>
              <th className="px-3 py-3">Cnt</th>
              <th className="px-3 py-3">Cal</th>
              <th className="px-3 py-3">P (g)</th>
              <th className="px-3 py-3">F (g)</th>
              <th className="px-3 py-3">Fib (g)</th>
              <th className="px-3 py-3">Fruit</th>
              <th className="px-3 py-3">Notes</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((r) => (
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
