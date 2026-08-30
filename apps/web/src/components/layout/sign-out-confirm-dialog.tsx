"use client";

import { useEffect } from "react";
import { LogOut } from "lucide-react";

interface SignOutConfirmDialogProps {
  open: boolean;
  busy: boolean;
  onStay: () => void;
  onConfirm: () => void;
}

export function SignOutConfirmDialog({
  open,
  busy,
  onStay,
  onConfirm,
}: SignOutConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onStay();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [busy, onStay, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Stay signed in"
        className="absolute inset-0 bg-ink/45 backdrop-blur-[2px]"
        disabled={busy}
        onClick={onStay}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="sign-out-title"
        aria-describedby="sign-out-description"
        className="relative w-full max-w-md rounded-3xl border border-line/80 bg-white p-6 shadow-[0_30px_80px_-32px_rgba(19,35,28,0.55)]"
      >
        <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-brand-red/10 text-brand-red">
          <LogOut className="h-5 w-5" />
        </div>
        <h2 id="sign-out-title" className="text-xl font-semibold text-ink">
          Sign out?
        </h2>
        <p id="sign-out-description" className="mt-2 text-sm leading-relaxed text-ink/65">
          You will need to sign in again to access courses, assignments, and
          grades. Do you want to leave, or stay on this page?
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={busy}
            onClick={onStay}
            className="rounded-full border border-line bg-white px-5 py-2.5 text-sm font-semibold text-ink transition hover:bg-sand disabled:opacity-60"
          >
            Stay signed in
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="rounded-full bg-brand-red px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-red/90 disabled:opacity-60"
          >
            {busy ? "Signing out..." : "Yes, sign out"}
          </button>
        </div>
      </div>
    </div>
  );
}
