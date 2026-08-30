"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  listNotificationsRequest,
  markNotificationReadRequest,
} from "@/lib/notifications/api";

export function NotificationBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const notificationsQuery = useQuery({
    queryKey: ["notifications"],
    queryFn: listNotificationsRequest,
    refetchInterval: 30_000,
  });

  const markReadMutation = useMutation({
    mutationFn: markNotificationReadRequest,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const notifications = notificationsQuery.data ?? [];
  const unreadCount = notifications.filter((item) => !item.readAt).length;

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        aria-label="Notifications"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-white text-ink transition hover:bg-sand"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-white">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {open ? (
        <div className="absolute right-0 z-40 mt-2 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-line bg-white shadow-[0_24px_60px_-28px_rgba(19,35,28,0.45)]">
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Notifications</p>
            <p className="text-xs text-ink/50">
              {unreadCount} unread · live updates enabled
            </p>
          </div>
          <ul className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-4 py-8 text-center text-sm text-ink/55">
                You are all caught up.
              </li>
            ) : (
              notifications.map((notification) => (
                <li
                  key={notification.id}
                  className={`border-b border-line/60 px-4 py-3 text-sm last:border-b-0 ${
                    notification.readAt ? "bg-white" : "bg-sand/35"
                  }`}
                >
                  <p className="font-medium text-ink">{notification.title}</p>
                  <p className="mt-0.5 text-ink/60">{notification.body}</p>
                  {!notification.readAt ? (
                    <button
                      type="button"
                      className="mt-2 text-xs font-medium text-forest transition hover:text-moss"
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      Mark as read
                    </button>
                  ) : null}
                </li>
              ))
            )}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
