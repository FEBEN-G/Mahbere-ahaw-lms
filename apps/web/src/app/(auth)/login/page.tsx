import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/features/auth/login-form";
import { organizationName } from "@/lib/content/organization";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen min-h-dvh overflow-x-clip">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(163,209,239,0.35),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(215,25,32,0.08),transparent_36%),linear-gradient(165deg,#f7faf8_0%,#e8efe9_100%)]" />
      <div className="relative mx-auto flex min-h-screen min-h-dvh w-full max-w-6xl items-center px-4 py-8 sm:px-6 sm:py-12">
        <section className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:gap-10">
          <div className="animate-rise order-2 lg:order-1">
            <BrandLogo href="/" size="lg" className="mb-4 sm:mb-6" />
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-moss sm:text-sm">
              Student & Staff Access
            </p>
            <h1 className="font-[family-name:var(--font-source-serif)] text-2xl tracking-tight text-ink sm:text-3xl md:text-4xl">
              {organizationName.am}
            </h1>
            <p className="mt-2 text-[11px] uppercase tracking-[0.14em] text-ink/45 sm:text-xs">
              {organizationName.en}
            </p>
            <p className="mt-4 hidden max-w-md text-base leading-relaxed text-ink/70 sm:block">
              Sign in to read monthly courses, submit assignments, or manage the
              learning program from a modern LMS workspace.
            </p>
          </div>
          <div className="animate-rise order-1 w-full rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_30px_80px_-48px_rgba(19,35,28,0.55)] backdrop-blur sm:rounded-3xl sm:p-6 md:p-8 lg:order-2">
            <h2 className="mb-1 text-xl font-semibold text-ink">Sign in</h2>
            <p className="mb-6 text-sm text-ink/55">
              Use your seminary credentials to continue.
            </p>
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
