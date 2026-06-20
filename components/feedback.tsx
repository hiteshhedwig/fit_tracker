"use client";

import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import type { ActionState } from "@/app/actions";

type Toast = {
  id: number;
  ok: boolean;
  message: string;
};

const ToastContext = createContext<(toast: Omit<Toast, "id">) => void>(() => {});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const pushToast = useMemo(
    () => (toast: Omit<Toast, "id">) => {
      const id = Date.now();
      setToasts((items) => [...items.slice(-2), { ...toast, id }]);
      window.setTimeout(() => {
        setToasts((items) => items.filter((item) => item.id !== id));
      }, 2800);
    },
    []
  );

  return (
    <ToastContext.Provider value={pushToast}>
      {children}
      <div className="fixed inset-x-3 top-3 z-[80] mx-auto grid max-w-md gap-2 sm:top-5">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-bold shadow-soft backdrop-blur-xl ${
              toast.ok ? "border-moss/25 bg-bone text-ink" : "border-clay/30 bg-bone text-clay"
            }`}
          >
            {toast.ok ? <CheckCircle2 className="shrink-0 text-moss" size={19} /> : <XCircle className="shrink-0 text-clay" size={19} />}
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

export function ActionToast({ state }: { state: ActionState }) {
  const pushToast = useToast();

  useEffect(() => {
    if (state.message) {
      pushToast({ ok: state.ok, message: state.message });
    }
  }, [pushToast, state]);

  return null;
}

export function SubmitButton({
  children,
  pendingLabel = "Saving...",
  className = "btn btn-primary w-full",
  name,
  value
}: {
  children: React.ReactNode;
  pendingLabel?: string;
  className?: string;
  name?: string;
  value?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button className={className} type="submit" name={name} value={value} disabled={pending}>
      {pending ? <Loader2 className="animate-spin" size={18} /> : null}
      {pending ? pendingLabel : children}
    </button>
  );
}
