import type { ReactNode } from "react";

export function EmptyState({
  icon,
  title,
  subtitle,
  action,
}: {
  icon: ReactNode;
  title: string;
  subtitle: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-20 text-center">
      <div className="text-text-muted">{icon}</div>
      <h3 className="font-display text-xl text-text-primary">{title}</h3>
      <p className="max-w-sm text-sm text-text-secondary">{subtitle}</p>
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
