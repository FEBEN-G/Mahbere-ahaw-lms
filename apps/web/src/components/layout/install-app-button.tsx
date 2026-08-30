"use client";

import { Download, Check, Share } from "lucide-react";
import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

interface InstallAppButtonProps {
  collapsed?: boolean;
  variant?: "header" | "sidebar";
}

function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandaloneDisplay() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator &&
      Boolean((navigator as Navigator & { standalone?: boolean }).standalone))
  );
}

export function InstallAppButton({
  collapsed = false,
  variant = "header",
}: InstallAppButtonProps) {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [installed, setInstalled] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showIosHelp, setShowIosHelp] = useState(false);
  const [iosHint, setIosHint] = useState(false);

  useEffect(() => {
    if (isStandaloneDisplay()) {
      setInstalled(true);
      return;
    }

    if (isIosDevice()) {
      setIosHint(true);
    }

    function onBeforeInstall(event: BeforeInstallPromptEvent) {
      event.preventDefault();
      setDeferred(event);
      setIosHint(false);
    }

    function onInstalled() {
      setInstalled(true);
      setDeferred(null);
      setIosHint(false);
    }

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstall);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (iosHint) {
      setShowIosHelp((value) => !value);
      return;
    }
    if (!deferred || busy) return;
    setBusy(true);
    try {
      await deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") {
        setInstalled(true);
      }
      setDeferred(null);
    } finally {
      setBusy(false);
    }
  }

  if (installed) {
    if (variant === "sidebar" && !collapsed) {
      return (
        <div className="mb-2 flex items-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-xs text-white/70">
          <Check className="h-3.5 w-3.5 shrink-0" />
          <span>App installed</span>
        </div>
      );
    }
    return null;
  }

  if (!deferred && !iosHint) {
    return null;
  }

  const label = busy
    ? "Installing…"
    : iosHint
      ? "Add to Home Screen"
      : "Download app";
  const Icon = iosHint ? Share : Download;

  if (variant === "sidebar") {
    return (
      <div className="mb-2">
        <button
          type="button"
          onClick={() => void handleInstall()}
          disabled={busy}
          title="Download web app"
          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-white/75 transition hover:bg-white/10 hover:text-white disabled:opacity-60 ${
            collapsed ? "justify-center" : ""
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {!collapsed ? <span>{label}</span> : null}
        </button>
        {showIosHelp && !collapsed ? (
          <p className="mt-2 rounded-xl bg-white/10 px-3 py-2 text-[11px] leading-relaxed text-white/70">
            Tap Share, then <strong>Add to Home Screen</strong> to install this
            web app.
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => void handleInstall()}
        disabled={busy}
        title="Download web app"
        aria-label="Download web app"
        className="inline-flex h-10 items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-medium text-ink transition hover:bg-sand disabled:opacity-60"
      >
        <Icon className="h-4 w-4 text-forest" />
        <span className="hidden sm:inline">{label}</span>
      </button>
      {showIosHelp ? (
        <div className="absolute right-0 top-12 z-40 w-64 rounded-xl border border-line bg-white p-3 text-xs text-ink/75 shadow-lg">
          Tap the Share icon in Safari, then choose{" "}
          <strong>Add to Home Screen</strong>.
        </div>
      ) : null}
    </div>
  );
}
