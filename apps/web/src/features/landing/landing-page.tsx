import Link from "next/link";
import { Cross, Sparkles, Target } from "lucide-react";
import { BrandLogo } from "@/components/brand/brand-logo";
import {
  landingHero,
  mission,
  organizationName,
  values,
  vision,
} from "@/lib/content/organization";
import { HeroFellowship } from "./hero-fellowship";
import { LandingNav } from "./landing-nav";

export function LandingPage() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eef7fc_0%,#f8fbfd_28%,#f3f7f4_100%)]">
      <LandingNav />

      <main lang="am">
        <section className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(163,209,239,0.55),transparent_42%),radial-gradient(circle_at_82%_8%,rgba(215,25,32,0.08),transparent_34%)]" />
          <div className="relative mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:px-5 sm:py-16 md:grid-cols-[1.05fr_0.95fr] md:items-center md:gap-10 md:px-8 md:py-24">
            <div className="animate-rise order-2 md:order-1">
              <h1 className="font-[family-name:var(--font-source-serif)] text-2xl leading-tight text-ink sm:text-3xl md:text-5xl">
                {organizationName.am}
              </h1>
              <p className="mt-3 text-xs font-medium uppercase tracking-[0.12em] text-ink/45 sm:text-sm">
                {organizationName.en}
              </p>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-ink/75 sm:mt-6 sm:text-lg">
                {landingHero.tagline}
              </p>
              <p className="mt-3 max-w-xl text-sm text-ink/60 sm:text-base">
                {landingHero.subtitle}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row sm:flex-wrap">
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white shadow-[0_12px_32px_-12px_rgba(215,25,32,0.65)] transition hover:bg-brand-red/90"
                >
                  Enter the portal
                </Link>
                <a
                  href="#vision"
                  className="inline-flex items-center justify-center rounded-full border border-line bg-white/80 px-6 py-3 text-sm font-semibold text-ink transition hover:bg-white"
                >
                  Explore our calling
                </a>
              </div>
            </div>

            <div className="animate-rise order-1 mx-auto w-full max-w-md justify-center md:order-2 md:max-w-none md:flex">
              <HeroFellowship />
            </div>
          </div>
        </section>

        <section id="vision" className="scroll-mt-24 px-5 py-16 md:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              icon={Sparkles}
              title={vision.title}
              subtitle={vision.titleEn}
            />
            <div className="mt-8 rounded-[2rem] border border-brand-blue/25 bg-[linear-gradient(135deg,rgba(163,209,239,0.22),rgba(255,255,255,0.92))] p-8 shadow-[0_24px_60px_-36px_rgba(19,35,28,0.25)] md:p-10">
              <p className="text-lg leading-[2] text-ink/85 md:text-xl">
                {vision.body}
              </p>
            </div>
          </div>
        </section>

        <section id="mission" className="scroll-mt-24 bg-white/55 px-5 py-16 md:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              icon={Target}
              title={mission.title}
              subtitle={mission.titleEn}
            />
            <ol className="mt-8 grid gap-4 md:grid-cols-2">
              {mission.items.map((item, index) => (
                <li
                  key={item}
                  className="group flex gap-4 rounded-2xl border border-line/70 bg-white/90 p-5 transition hover:-translate-y-0.5 hover:border-brand-blue/35 hover:shadow-[0_18px_40px_-28px_rgba(19,35,28,0.35)]"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red text-sm font-bold text-white">
                    {index + 1}
                  </span>
                  <p className="pt-1.5 text-base leading-relaxed text-ink/80">
                    {item}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="values" className="scroll-mt-24 px-5 py-16 md:px-8">
          <div className="mx-auto max-w-6xl">
            <SectionHeading
              icon={Cross}
              title={values.title}
              subtitle={values.titleEn}
            />
            <div className="mt-8 grid gap-5 md:grid-cols-2">
              {values.items.map((item, index) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-line/70 bg-white/85 p-6 shadow-[0_16px_40px_-32px_rgba(19,35,28,0.3)]"
                >
                  <div className="mb-3 flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-blue/25 text-xs font-bold text-brand-red">
                      {index + 1}
                    </span>
                    <h3 className="text-base font-semibold leading-snug text-ink">
                      {item.title}
                    </h3>
                  </div>
                  <p className="text-sm leading-7 text-ink/70">{item.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-5 pb-20 pt-4 md:px-8">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-brand-red/15 bg-[linear-gradient(135deg,#1f4d3a_0%,#245743_52%,#163528_100%)] px-8 py-10 text-white md:px-12 md:py-12">
            <div className="grid gap-8 md:grid-cols-[1.2fr_auto] md:items-center">
              <div>
                <p className="text-sm uppercase tracking-[0.18em] text-white/55">
                  Seminary LMS
                </p>
                <h2 className="mt-3 font-[family-name:var(--font-source-serif)] text-3xl leading-tight md:text-4xl">
                  Begin your learning journey
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
                  Access monthly course modules, submit assignments, receive
                  grades, and grow in faithful discipleship through structured
                  distance learning.
                </p>
              </div>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-brand-red px-6 py-3 text-sm font-semibold text-white transition hover:bg-brand-red/90"
              >
                Sign in to portal
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-line/70 bg-white/70 px-5 py-8 md:px-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <BrandLogo href="/" size="sm" />
          <p className="text-sm text-ink/55">
            © {new Date().getFullYear()} {organizationName.shortEn}. All rights
            reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Sparkles;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/25 text-brand-red">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h2 className="font-[family-name:var(--font-source-serif)] text-3xl text-ink md:text-4xl">
          {title}
        </h2>
        <p className="mt-1 text-sm uppercase tracking-[0.16em] text-ink/45">
          {subtitle}
        </p>
      </div>
    </div>
  );
}
