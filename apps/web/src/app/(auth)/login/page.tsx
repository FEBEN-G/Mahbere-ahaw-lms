import { BrandLogo } from "@/components/brand/brand-logo";
import { LoginForm } from "@/features/auth/login-form";
import { organizationName } from "@/lib/content/organization";

export default function LoginPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(163,209,239,0.35),transparent_42%),radial-gradient(circle_at_88%_12%,rgba(215,25,32,0.08),transparent_36%),linear-gradient(165deg,#f7faf8_0%,#e8efe9_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl items-center px-6 py-12">
        <section className="grid w-full gap-10 md:grid-cols-[1.1fr_0.9fr] md:items-center">
          <div className="animate-rise">
            <BrandLogo href="/" size="lg" className="mb-6" />
            <p className="mb-3 text-sm font-semibold uppercase tracking-[0.18em] text-moss">
              Student & Staff Access
            </p>
            <h1 className="font-[family-name:var(--font-source-serif)] text-3xl tracking-tight text-ink md:text-4xl">
              {organizationName.am}
            </h1>
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-ink/45">
              {organizationName.en}
            </p>
            <p className="mt-4 max-w-md text-base leading-relaxed text-ink/70">
              Sign in to read monthly courses, submit assignments, or manage the
              learning program from a modern LMS workspace.
            </p>
          </div>
          <div className="rounded-3xl border border-line/80 bg-white/90 p-6 shadow-[0_30px_80px_-48px_rgba(19,35,28,0.55)] backdrop-blur md:p-8">
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
