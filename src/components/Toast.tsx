// Toast 通知容器
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { useToastStore } from "@/store/toast";
import { cn } from "@/lib/utils";

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed inset-x-0 top-0 z-[100] flex flex-col items-center gap-2 px-4 pt-[calc(env(safe-area-inset-top)+12px)] pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "pointer-events-auto flex w-full max-w-md items-start gap-3 rounded-xl border px-4 py-3 shadow-card backdrop-blur-xl animate-fade-up",
            t.type === "success" && "border-moss/40 bg-ink-850/90",
            t.type === "error" && "border-clay/40 bg-ink-850/90",
            t.type === "info" && "border-amber-300/30 bg-ink-850/90",
          )}
        >
          {t.type === "success" && (
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-moss" />
          )}
          {t.type === "error" && (
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-clay" />
          )}
          {t.type === "info" && (
            <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
          )}
          <p className="flex-1 text-sm leading-relaxed text-paper">{t.message}</p>
          <button
            onClick={() => dismiss(t.id)}
            className="text-paper-dim transition-colors hover:text-paper"
            aria-label="关闭"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
