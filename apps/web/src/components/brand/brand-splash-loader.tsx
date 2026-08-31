"use client";

import { BrandLogo } from "@/components/brand/brand-logo";
import { organizationName } from "@/lib/content/organization";

interface BrandSplashLoaderProps {
  label?: string;
  fullScreen?: boolean;
  className?: string;
}

export function BrandSplashLoader({
  label = "Loading",
  fullScreen = true,
  className = "",
}: BrandSplashLoaderProps) {
  const shellClass = fullScreen
    ? "fixed inset-0 z-[100] flex min-h-dvh flex-col items-center justify-center"
    : "flex min-h-[40vh] flex-col items-center justify-center py-16";

  return (
    <div
      className={`${shellClass} ${className}`}
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label={label}
    >
      {fullScreen ? (
        <>
          <div
            className="pointer-events-none absolute inset-0 bg-gradient-to-br from-mist via-[#eef3f0] to-sand"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(61,107,84,0.14),transparent_58%)]"
            aria-hidden
          />
        </>
      ) : null}

      <div className="relative flex flex-col items-center gap-8">
        <div className="relative flex h-36 w-36 items-center justify-center sm:h-40 sm:w-40">
          <span className="splash-ring" aria-hidden />
          <span className="splash-ring splash-ring-delay-1" aria-hidden />
          <span className="splash-ring splash-ring-delay-2" aria-hidden />
          <span className="splash-orbit" aria-hidden>
            <span className="splash-orbit-dot" />
          </span>
          <span className="splash-orbit splash-orbit-reverse" aria-hidden>
            <span className="splash-orbit-dot splash-orbit-dot-accent" />
          </span>

          <div className="relative z-10 animate-float-soft drop-shadow-md">
            <BrandLogo size="xl" showText={false} />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <p className="font-[family-name:var(--font-source-serif)] text-lg text-ink sm:text-xl">
            {organizationName.shortEn}
          </p>
          <p className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-ink/45">
            <span className="splash-dot" aria-hidden />
            {label}
            <span className="splash-dot splash-dot-delay" aria-hidden />
          </p>
        </div>
      </div>
    </div>
  );
}
