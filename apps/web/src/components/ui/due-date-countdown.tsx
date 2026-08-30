"use client";

import { useEffect, useState } from "react";

interface DueDateCountdownProps {
  dueAt: string;
  className?: string;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) {
    return "Past due";
  }

  const totalMinutes = Math.floor(ms / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) {
    return `${days}d ${hours}h left`;
  }
  if (hours > 0) {
    return `${hours}h ${minutes}m left`;
  }
  return `${minutes}m left`;
}

export function DueDateCountdown({ dueAt, className = "" }: DueDateCountdownProps) {
  const dueTime = new Date(dueAt).getTime();
  const [remaining, setRemaining] = useState(() => formatRemaining(dueTime - Date.now()));

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRemaining(formatRemaining(dueTime - Date.now()));
    }, 60_000);

    setRemaining(formatRemaining(dueTime - Date.now()));
    return () => window.clearInterval(timer);
  }, [dueTime]);

  const isPastDue = dueTime <= Date.now();
  const isUrgent = !isPastDue && dueTime - Date.now() <= 48 * 60 * 60 * 1000;

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
        isPastDue
          ? "bg-accent/15 text-accent"
          : isUrgent
            ? "bg-brand-red/10 text-brand-red"
            : "bg-brand-blue/20 text-ink/70"
      } ${className}`}
    >
      {remaining}
    </span>
  );
}
