// 空状态占位
import type { LucideIcon } from "lucide-react";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-14 text-center">
      <div className="relative">
        <div className="absolute inset-0 -z-10 rounded-full bg-amber-300/10 blur-2xl" />
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-amber-300/15 bg-ink-850/60">
          <Icon className="h-7 w-7 text-amber-300/70" />
        </div>
      </div>
      <div className="space-y-1.5">
        <h3 className="font-display text-lg text-paper">{title}</h3>
        {description && (
          <p className="mx-auto max-w-xs text-sm leading-relaxed text-paper-dim">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  );
}
