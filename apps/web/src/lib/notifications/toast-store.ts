"use client";

import { create } from "zustand";

export interface NotificationToast {
  id: string;
  title: string;
  body: string;
  createdAt: number;
}

interface NotificationToastState {
  toasts: NotificationToast[];
  pushToast: (input: { title: string; body: string }) => void;
  dismissToast: (id: string) => void;
}

export const useNotificationToastStore = create<NotificationToastState>(
  (set) => ({
    toasts: [],
    pushToast: (input) =>
      set((state) => ({
        toasts: [
          {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            title: input.title,
            body: input.body,
            createdAt: Date.now(),
          },
          ...state.toasts,
        ].slice(0, 4),
      })),
    dismissToast: (id) =>
      set((state) => ({
        toasts: state.toasts.filter((toast) => toast.id !== id),
      })),
  }),
);
