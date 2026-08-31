"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

const SLIDES = [
  {
    src: "/hero-slide-1.jpg",
    alt: "Mahbere Ahaw congregation gathered for worship and teaching",
  },
  {
    src: "/hero-slide-2.jpg",
    alt: "Mahbere Ahaw assembly listening during a ministry gathering",
  },
  {
    src: "/hero-fellowship.png",
    alt: "Congregation worshiping together with raised hands",
  },
] as const;

const AUTO_MS = 1800;

interface HeroFellowshipProps {
  className?: string;
}

export function HeroFellowship({ className = "" }: HeroFellowshipProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const goTo = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % SLIDES.length);
    }, AUTO_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  return (
    <div
      className={`relative w-full ${className}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden rounded-2xl bg-sand sm:aspect-[21/9]">
        {SLIDES.map((slide, slideIndex) => (
          <div
            key={slide.src}
            className={`absolute inset-0 transition-opacity duration-500 ease-out ${
              slideIndex === index ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden={slideIndex !== index}
          >
            <Image
              src={slide.src}
              alt={slide.alt}
              fill
              priority={slideIndex === 0}
              sizes="(min-width: 1280px) 1152px, 100vw"
              className="object-cover object-center"
            />
          </div>
        ))}
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Hero image slides"
      >
        {SLIDES.map((slide, slideIndex) => {
          const active = slideIndex === index;
          return (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={active}
              aria-label={`Show slide ${slideIndex + 1}`}
              onClick={() => goTo(slideIndex)}
              className={`h-2.5 rounded-full transition-all ${
                active
                  ? "w-7 bg-forest"
                  : "w-2.5 bg-ink/25 hover:bg-ink/40"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
