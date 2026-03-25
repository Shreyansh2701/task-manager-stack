"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (message: string, type?: Toast["type"]) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast["type"] = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2.5 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`animate-slideUp glass-card px-4 py-3.5 text-sm flex items-center gap-2.5 cursor-pointer hover:border-[var(--glass-border-hover)] transition-all duration-300 ${
              toast.type === "error"
                ? "border-red-500/20 shadow-[0_0_16px_rgba(248,113,113,0.08)]"
                : toast.type === "success"
                ? "border-emerald-500/20 shadow-[0_0_16px_rgba(52,211,153,0.08)]"
                : toast.type === "warning"
                ? "border-yellow-500/20 shadow-[0_0_16px_rgba(251,191,36,0.08)]"
                : "border-blue-500/20 shadow-[0_0_16px_rgba(96,165,250,0.08)]"
            }`}
            onClick={() => removeToast(toast.id)}
          >
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                toast.type === "error"
                  ? "bg-red-500 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
                  : toast.type === "success"
                  ? "bg-emerald-500 shadow-[0_0_6px_rgba(52,211,153,0.5)]"
                  : toast.type === "warning"
                  ? "bg-yellow-500 shadow-[0_0_6px_rgba(251,191,36,0.5)]"
                  : "bg-blue-500 shadow-[0_0_6px_rgba(96,165,250,0.5)]"
              }`}
            />
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
