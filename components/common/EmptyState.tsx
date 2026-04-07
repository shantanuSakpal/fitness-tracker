import { cn } from "@/lib/utils";

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center",
        className
      )}
    >
      <p className="font-medium text-zinc-800">{title}</p>
      {description && (
        <p className="mt-2 text-sm text-zinc-600">{description}</p>
      )}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  );
}
