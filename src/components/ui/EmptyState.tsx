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
    <div className={cn("rounded-xl border border-dashed border-ink-200 bg-white p-10 text-center", className)}>
      <h3 className="text-base font-semibold text-ink-800">{title}</h3>
      {description ? <p className="mt-1 text-sm text-ink-500">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
