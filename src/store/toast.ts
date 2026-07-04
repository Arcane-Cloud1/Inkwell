// Toast 通知 store
import { create } from "zustand";

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  type: ToastType;
  message: string;
};

type ToastState = {
  toasts: Toast[];
  show: (type: ToastType, message: string) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
  dismiss: (id: string) => void;
};

let counter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],
  show(type, message) {
    const id = `toast-${++counter}`;
    set({ toasts: [...get().toasts, { id, type, message }] });
    setTimeout(() => get().dismiss(id), 3200);
  },
  success(message) {
    get().show("success", message);
  },
  error(message) {
    get().show("error", message);
  },
  info(message) {
    get().show("info", message);
  },
  dismiss(id) {
    set({ toasts: get().toasts.filter((t) => t.id !== id) });
  },
}));
