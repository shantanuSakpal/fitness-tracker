"use client";

import { addDays, formatDisplayDate, todayISODate } from "@/lib/utils";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useMemo } from "react";

interface DateSelectorProps {
  /** Optional controlled value; if omitted, reads/writes ?date= in URL */
  value?: string;
  onChange?: (iso: string) => void;
  className?: string;
}

export function DateSelector({
  value: controlled,
  onChange,
  className = "",
}: DateSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const fromUrl = searchParams.get("date") || todayISODate();
  const value = controlled ?? fromUrl;

  const setDate = useCallback(
    (iso: string) => {
      if (onChange) {
        onChange(iso);
        return;
      }
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", iso);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [onChange, pathname, router, searchParams]
  );

  const label = useMemo(() => formatDisplayDate(value), [value]);
  const isToday = value === todayISODate();

  return (
    <div
      className={`flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200/80 bg-white px-3 py-2 shadow-sm ${className}`}
    >
      <button
        type="button"
        aria-label="Previous day"
        className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        onClick={() => setDate(addDays(value, -1))}
      >
        ←
      </button>
      <div className="min-w-0 flex-1 text-center sm:text-left">
        <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          {isToday ? "Today" : "Selected"}
        </div>
        <div className="truncate text-sm font-semibold text-zinc-900">
          {label}
        </div>
        <input
          type="date"
          value={value}
          onChange={(e) => setDate(e.target.value)}
          className="mt-1 w-full max-w-[11rem] rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-800"
        />
      </div>
      <button
        type="button"
        aria-label="Next day"
        className="rounded-lg px-2 py-1 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
        onClick={() => setDate(addDays(value, 1))}
      >
        →
      </button>
      {!isToday && (
        <button
          type="button"
          className="rounded-lg border border-zinc-200 px-2 py-1 text-xs font-medium text-zinc-700 hover:bg-zinc-50"
          onClick={() => setDate(todayISODate())}
        >
          Jump to today
        </button>
      )}
    </div>
  );
}

/** useSearchParams must be inside Suspense in the App Router */
export function DateSelectorBar(props: DateSelectorProps) {
  return (
    <Suspense
      fallback={<div className=" animate-pulse rounded-xl bg-zinc-100/90" />}
    >
      <DateSelector {...props} />
    </Suspense>
  );
}
