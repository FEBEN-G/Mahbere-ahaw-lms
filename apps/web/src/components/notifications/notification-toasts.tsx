"use client";

import { useEffect } from "react";
import { X } from "lucide-react";
import { useNotificationToastStore } from "@/lib/notifications/toast-store";

export function NotificationToasts() {
  const toasts = useNotificationToastStore((state) => state.toasts);
  const dismissToast = useNotificationToastStore((state) => state.dismissToast);

  useEffect(() => {
    if (toasts.length === 0) return;
    const timers = toasts.map((toast) =>
      window.setTimeout(() => dismissToast(toast.id), 8_000),
    );
    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, [toasts, dismissToast]);

  if (toasts.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto rounded-2xl border border-line bg-white p-4 shadow-[0_20px_50px_-24px_rgba(19,35,28,0.55)]"
          role="status"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">{toast.title}</p>
              <p className="mt-1 text-sm text-ink/65">{toast.body}</p>
            </div>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismissToast(toast.id)}
              className="rounded-lg p-1 text-ink/45 hover:bg-sand hover:text-ink"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
