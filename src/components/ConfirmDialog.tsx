// 确认对话框（用于删除等不可逆操作）
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmText = "确认",
  cancelText = "取消",
  danger = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-6">
      <div
        className="absolute inset-0 bg-black/65 backdrop-blur-sm animate-fade-in"
        onClick={onCancel}
      />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-amber-300/15 bg-ink-850/95 p-5 shadow-card backdrop-blur-2xl animate-fade-up">
        <div className="mb-3 flex items-center gap-2.5">
          <div
            className={
              danger
                ? "flex h-9 w-9 items-center justify-center rounded-full bg-clay/15 text-clay"
                : "flex h-9 w-9 items-center justify-center rounded-full bg-amber-300/15 text-amber-300"
            }
          >
            <AlertTriangle className="h-4.5 w-4.5" />
          </div>
          <h3 className="font-display text-lg text-paper">{title}</h3>
        </div>
        <p className="mb-5 text-sm leading-relaxed text-paper-muted">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-ghost flex-1">
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={
              danger
                ? "btn-primary flex-1 !bg-clay hover:!bg-clay-dim"
                : "btn-primary flex-1"
            }
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
