"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { AuthProvider } from "@/components/auth/auth-provider";
import { NotificationSocketProvider } from "@/components/notifications/notification-socket-provider";
import { NotificationToasts } from "@/components/notifications/notification-toasts";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationSocketProvider>
          {children}
          <NotificationToasts />
        </NotificationSocketProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
