import Image from "next/image";
import Link from "next/link";
import { organizationName } from "@/lib/content/organization";

const sizeMap = {
  sm: { img: 32, text: "text-sm" },
  md: { img: 40, text: "text-base" },
  lg: { img: 56, text: "text-lg" },
  xl: { img: 120, text: "text-2xl" },
} as const;

interface BrandLogoProps {
  size?: keyof typeof sizeMap;
  showText?: boolean;
  href?: string;
  className?: string;
  textClassName?: string;
  variant?: "light" | "dark";
}

export function BrandLogo({
  size = "md",
  showText = true,
  href,
  className = "",
  textClassName = "",
  variant = "dark",
}: BrandLogoProps) {
  const { img, text } = sizeMap[size];

  const content = (
    <>
      <Image
        src="/logo.png"
        alt={organizationName.am}
        width={img}
        height={img}
        className="shrink-0 rounded-full object-cover shadow-sm ring-2 ring-white/20"
        priority={size === "xl" || size === "lg"}
      />
      {showText ? (
        <span className={`min-w-0 ${text} ${textClassName}`}>
          <span
            className={`block truncate font-[family-name:var(--font-source-serif)] leading-tight ${
              variant === "light" ? "text-white" : "text-ink"
            }`}
          >
            Mahibere Ahaw
          </span>
          <span
            className={`block truncate text-[11px] uppercase tracking-[0.14em] ${
              variant === "light" ? "text-white/60" : "text-ink/50"
            }`}
          >
            Seminary LMS
          </span>
        </span>
      ) : null}
    </>
  );

  const wrapperClass = `flex items-center gap-3 ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        className={`${wrapperClass} rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue`}
      >
        {content}
      </Link>
    );
  }

  return <div className={wrapperClass}>{content}</div>;
}
