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

  function isActive(href: string): boolean {
    return (
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href))
    );
  }

  return (
    <div className="min-h-screen bg-zinc-100 text-zinc-900">
      <header className="fixed inset-x-0 top-0 z-40 border-b border-zinc-200/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-4 md:px-8">
          <Link
            href="/dashboard"
            className="shrink-0 font-semibold tracking-tight"
            onClick={() => setOpen(false)}
          >
            Fitness OS
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive(item.href)
                    ? "bg-zinc-200 font-semibold text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            aria-expanded={open}
            aria-label="Menu"
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium md:hidden"
            onClick={() => setOpen((o) => !o)}
          >
            Menu
          </button>
        </div>

        {open && (
          <div className="border-t border-zinc-200 bg-white px-4 py-3 md:hidden">
            <nav className="flex flex-col gap-1">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-zinc-200 font-semibold text-zinc-900"
                      : "text-zinc-800 hover:bg-zinc-100",
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <div className="min-h-screen pt-16 md:pt-20">
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-8 md:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
