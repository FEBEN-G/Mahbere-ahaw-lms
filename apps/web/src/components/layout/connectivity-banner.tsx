"use client";

import { WifiOff } from "lucide-react";
import { useEffect } from "react";
import { useConnectivityStore } from "@/lib/offline/connectivity-store";

export function ConnectivityBanner() {
  const online = useConnectivityStore((state) => state.online);
  const setOnline = useConnectivityStore((state) => state.setOnline);

  useEffect(() => {
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    setOnline(navigator.onLine);
    return () => {
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, [setOnline]);

  if (online) return null;

  return (
    <div className="mb-5 flex items-start gap-3 rounded-2xl border border-accent/25 bg-accent/10 px-4 py-3 text-sm text-ink">
      <WifiOff className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
      <p>
        You are offline. You can read downloaded courses. Submitting assignments
        and downloading new content require an internet connection.
      </p>
    </div>
  );
}
