"use client";

import Image from "next/image";
import { useCallback, useRef, useState } from "react";

export function HeroFellowship() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [spotlight, setSpotlight] = useState({ x: 50, y: 40 });
  const [hovering, setHovering] = useState(false);

  const handleMove = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    const node = frameRef.current;
    if (!node) return;

    const rect = node.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;

    setTilt({
      x: (py - 0.5) * -10,
      y: (px - 0.5) * 14,
    });
    setSpotlight({ x: px * 100, y: py * 100 });
  }, []);

  const handleLeave = useCallback(() => {
    setHovering(false);
    setTilt({ x: 0, y: 0 });
    setSpotlight({ x: 50, y: 40 });
  }, []);

  return (
    <div
      className="relative w-full max-w-[560px] motion-safe:animate-float-soft hover:[animation-play-state:paused]"
      style={{ perspective: "1200px" }}
    >
      <div className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full bg-brand-blue/50 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-10 -right-6 h-32 w-32 rounded-full bg-brand-red/20 blur-2xl" />

      <div
        ref={frameRef}
        className="group relative"
        onMouseEnter={() => setHovering(true)}
        onMouseMove={handleMove}
        onMouseLeave={handleLeave}
        style={{
          transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${hovering ? 1.02 : 1})`,
          transformStyle: "preserve-3d",
          transition: hovering
            ? "transform 80ms linear"
            : "transform 500ms cubic-bezier(0.22, 1, 0.36, 1)",
        }}
      >
        <div
          className="absolute -inset-3 rounded-[2.1rem] bg-[conic-gradient(from_140deg,#a3d1ef,#ffffff,#d71920,#a3d1ef)] opacity-70 blur-[1px]"
          style={{ transform: "translateZ(-24px)" }}
        />

        <div className="relative overflow-hidden rounded-[1.85rem] border border-white/80 bg-white shadow-[0_40px_90px_-36px_rgba(19,35,28,0.45)]">
          <div className="relative aspect-[4/3] overflow-hidden sm:aspect-[5/4]">
            <Image
              src="/hero-fellowship.png"
              alt="Congregation worshiping together with raised hands"
              fill
              priority
              sizes="(min-width: 768px) 540px, 90vw"
              className="object-cover object-[center_28%] transition duration-500 group-hover:scale-[1.06]"
            />
            <div
              className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-200"
              style={{
                opacity: hovering ? 0.7 : 0.25,
                background: `radial-gradient(420px circle at ${spotlight.x}% ${spotlight.y}%, rgba(255,255,255,0.42), transparent 55%)`,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
