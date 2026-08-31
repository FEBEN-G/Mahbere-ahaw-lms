"use client";

import Image from "next/image";
import { useId } from "react";
import { organizationName } from "@/lib/content/organization";

interface BrandSplashLoaderProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

function SplashArcRing({
  className = "",
  dash = "90 200",
  strokeWidth = 2.5,
}: {
  className?: string;
  dash?: string;
  strokeWidth?: number;
}) {
  const gradientId = useId();

  return (
    <div className={`absolute ${className}`} aria-hidden>
      <svg className="h-full w-full" viewBox="0 0 100 100">
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke="rgba(212, 175, 55, 0.14)"
          strokeWidth={strokeWidth - 0.5}
        />
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={dash}
          className="splash-arc-stroke"
        />
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f0d78c" />
            <stop offset="50%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#b8922a" />
          </linearGradient>
        </defs>
      </svg>
    </div>
  );
}

export function BrandSplashLoader({
  fullScreen = true,
  className = "",
}: Omit<BrandSplashLoaderProps, "label"> & { label?: string }) {
  const ariaLabel = organizationName.shortEn;
  const shellClass = fullScreen
    ? "fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center"
    : "flex min-h-[40vh] flex-col items-center justify-center py-16";

  return (
    <div
      className={`${shellClass} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={ariaLabel}
    >
      {fullScreen ? (
        <div
          className="pointer-events-none absolute inset-0 bg-[#eaf3fb]"
          aria-hidden
        />
      ) : null}

      <div className="relative flex flex-col items-center">
        <div className="relative flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
          <SplashArcRing
            className="inset-[-8%] h-[116%] w-[116%] splash-arc-rotate"
            dash="96 193"
            strokeWidth={2.75}
          />
          <SplashArcRing
            className="inset-[-16%] h-[132%] w-[132%] splash-arc-rotate-reverse"
            dash="64 225"
            strokeWidth={2}
          />

          <div className="relative z-10 flex h-[78%] w-[78%] items-center justify-center rounded-full bg-white shadow-[0_8px_28px_rgba(61,107,132,0.12)] ring-2 ring-[#d4af37]/50">
            <Image
              src="/logo.png"
              alt={organizationName.am}
              width={140}
              height={140}
              priority
              className="h-[90%] w-[90%] rounded-full object-cover"
            />
          </div>
        </div>

        <h1 className="mt-6 text-center font-[family-name:var(--font-source-serif)] text-sm font-semibold uppercase tracking-[0.28em] text-[#3d6b8f] sm:text-base sm:tracking-[0.3em]">
          {organizationName.shortEn}
        </h1>

        {fullScreen ? (
          <span
            className="mt-5 h-px w-16 bg-gradient-to-r from-transparent via-[#a3c9e8] to-transparent"
            aria-hidden
          />
        ) : null}
      </div>
    </div>
  );
}
