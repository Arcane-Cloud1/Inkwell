// 加载指示器
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Spinner({
  className,
  size = 18,
}: {
  className?: string;
  size?: number;
}) {
  return (
    <Loader2
      className={cn("animate-spin text-amber-300", className)}
      size={size}
      aria-hidden
    />
  );
}

export function LoadingScreen({ label = "加载中…" }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-paper-dim">
      <Spinner size={28} />
      <p className="font-mono text-xs uppercase tracking-[0.2em]">{label}</p>
    </div>
  );
}
