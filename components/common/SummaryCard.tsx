import { cn } from "@/lib/utils";

interface SummaryCardProps {
  title: string;
  value: React.ReactNode;
  hint?: string;
  /** Highlight variant for met/unmet targets */
  variant?: "default" | "success" | "warning" | "muted";
  className?: string;
}

const ring: Record<NonNullable<SummaryCardProps["variant"]>, string> = {
  default: "border-zinc-200/80",
  success: "border-emerald-200/90 bg-emerald-50/50",
  warning: "border-amber-200/90 bg-amber-50/40",
  muted: "border-zinc-200/60 bg-zinc-50/80",
};

export function SummaryCard({
  title,
  value,
  hint,
  variant = "default",
  className,
}: SummaryCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-4 shadow-sm",
        ring[variant],
        className
      )}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {title}
      </p>
      <p className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-zinc-500">{hint}</p>}
    </div>
  );
}
