"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuthStore } from "@/lib/auth/store";
import { useNotificationToastStore } from "@/lib/notifications/toast-store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL ?? "http://localhost:4000";

interface NotificationSocketPayload {
  id?: string;
  title?: string;
  body?: string;
  eventType?: string;
}

export function NotificationSocketProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const accessToken = useAuthStore((state) => state.accessToken);
  const queryClient = useQueryClient();
  const pushToast = useNotificationToastStore((state) => state.pushToast);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!accessToken) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      return;
    }

    const socket = io(`${WS_URL}/notifications`, {
      auth: { token: accessToken },
      transports: ["websocket"],
    });
    socketRef.current = socket;

    socket.on("notification.created", (payload: NotificationSocketPayload) => {
      void queryClient.invalidateQueries({ queryKey: ["notifications"] });
      if (payload?.title) {
        pushToast({
          title: payload.title,
          body: payload.body ?? "",
        });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [accessToken, queryClient, pushToast]);

  return children;
}
