"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/diet-book", label: "Your Diet Book" },
  { href: "/inputs", label: "Inputs" },
  { href: "/outputs", label: "Outputs" },
];

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <div className="flex min-h-screen">
        {/* Desktop sidebar */}
        <aside className="hidden w-52 shrink-0 border-r border-zinc-200/80 bg-white md:flex md:flex-col">
          <div className="border-b border-zinc-200/80 px-4 py-5">
            <Link href="/dashboard" className="block font-semibold tracking-tight">
              Fitness OS
            </Link>
            <p className="mt-1 text-xs text-zinc-500">Daily tracking</p>
          </div>
          <nav className="flex flex-1 flex-col gap-0.5 p-3">
            {nav.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== "/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-zinc-200 font-semibold text-zinc-900"
                      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Mobile top bar */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-3 border-b border-zinc-200/80 bg-white/95 px-4 py-3 backdrop-blur md:hidden">
            <Link href="/dashboard" className="font-semibold">
              Fitness OS
            </Link>
            <button
              type="button"
              aria-expanded={open}
              aria-label="Menu"
              className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium"
              onClick={() => setOpen((o) => !o)}
            >
              Menu
            </button>
          </header>
          {open && (
            <div className="border-b border-zinc-200 bg-white px-4 py-3 md:hidden">
              <nav className="flex flex-col gap-1">
                {nav.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          )}

          <main className="flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
        </div>
      </div>
    </div>
  );
}
