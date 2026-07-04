// 通用底部弹出抽屉
import { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Sheet({
  open,
  onClose,
  title,
  children,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md max-h-[88dvh] flex flex-col",
          "rounded-t-3xl border-t border-amber-300/15 bg-ink-900/95 backdrop-blur-2xl shadow-glow",
          "animate-sheet-up",
        )}
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="mx-auto h-1 w-10 rounded-full bg-amber-300/25" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-5 pb-3">
            <h2 className="font-display text-lg text-paper">{title}</h2>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full text-paper-dim transition-colors hover:bg-amber-300/10 hover:text-paper"
              aria-label="关闭"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-5 pb-2">{children}</div>
        {footer && (
          <div className="border-t border-amber-300/10 px-5 py-3">{footer}</div>
        )}
      </div>
    </div>
  );
}
