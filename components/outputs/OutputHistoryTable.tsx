"use client";

import Link from "next/link";
import type { OutputRecord } from "@/lib/types";
import { EmptyState } from "@/components/common/EmptyState";
import { formatDisplayDate } from "@/lib/utils";

function numCell(n: number): string {
  return n > 0 ? String(n) : "—";
}

function strCell(s: string): string {
  const t = s.trim();
  return t ? t : "—";
}

export function OutputHistoryTable({
  rows,
  selectedDate,
}: {
  rows: OutputRecord[];
  selectedDate: string;
}) {
  if (rows.length === 0) {
    return (
      <EmptyState
        title="No output history yet"
        description="Save a day above to build your log."
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200/80 bg-white shadow-sm">
      <table className="w-full min-w-4xl text-left text-sm">
        <thead>
          <tr className="border-b border-zinc-200 bg-zinc-50/80 text-xs font-medium uppercase tracking-wide text-zinc-500">
            <th className="whitespace-nowrap px-3 py-3">Date</th>
            <th className="whitespace-nowrap px-3 py-3">Weight</th>
            <th className="whitespace-nowrap px-3 py-3">Waist</th>
            <th className="whitespace-nowrap px-3 py-3">Chest</th>
            <th className="whitespace-nowrap px-3 py-3">Arm</th>
            <th className="whitespace-nowrap px-3 py-3">Thigh</th>
            <th className="whitespace-nowrap px-3 py-3">Energy</th>
            <th className="whitespace-nowrap px-3 py-3">Mood</th>
            <th className="whitespace-nowrap px-3 py-3">Recovery</th>
            <th className="min-w-32 px-3 py-3">Notes</th>
            <th className="whitespace-nowrap px-3 py-3">Photo</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100">
          {rows.map((r) => {
            const active = r.date === selectedDate;
            return (
              <tr
                key={r.id}
                className={
                  active
                    ? "bg-emerald-50/60 text-zinc-900"
                    : "text-zinc-800 hover:bg-zinc-50/80"
                }
              >
                <td className="whitespace-nowrap px-3 py-2.5 font-medium">
                  <Link
                    href={`/outputs?date=${encodeURIComponent(r.date)}`}
                    className="text-zinc-900 underline decoration-zinc-300 underline-offset-2 hover:decoration-zinc-600"
                  >
                    {formatDisplayDate(r.date)}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {numCell(r.bodyWeight)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {numCell(r.waist)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {numCell(r.chest)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {numCell(r.arm)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 tabular-nums">
                  {numCell(r.thigh)}
                </td>
                <td className="max-w-28 truncate px-3 py-2.5" title={r.energyLevel}>
                  {strCell(r.energyLevel)}
                </td>
                <td className="max-w-28 truncate px-3 py-2.5" title={r.mood}>
                  {strCell(r.mood)}
                </td>
                <td className="max-w-28 truncate px-3 py-2.5" title={r.recovery}>
                  {strCell(r.recovery)}
                </td>
                <td
                  className="max-w-56 truncate px-3 py-2.5 text-zinc-600"
                  title={r.notes || undefined}
                >
                  {strCell(r.notes)}
                </td>
                <td className="whitespace-nowrap px-3 py-2.5">
                  {r.progressPhotoUrl.trim() ? (
                    <a
                      href={r.progressPhotoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-emerald-800 underline decoration-emerald-300 underline-offset-2 hover:decoration-emerald-600"
                    >
                      Open
                    </a>
                  ) : (
                    "—"
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
