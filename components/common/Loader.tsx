import { cn } from "@/lib/utils";

export function Loader({
  label = "Loading…",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-12 text-zinc-500",
        className
      )}
      role="status"
      aria-live="polite"
    >
      <span className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-200 border-t-zinc-700" />
      <span className="text-sm">{label}</span>
    </div>
  );
}
