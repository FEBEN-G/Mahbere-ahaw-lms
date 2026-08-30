import { ForgotPasswordForm } from "@/features/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(61,107,84,0.18),transparent_42%),linear-gradient(165deg,#f7faf8_0%,#e8efe9_100%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-lg items-center px-6 py-12">
        <div className="w-full rounded-3xl border border-line/80 bg-white/90 p-6 shadow-[0_30px_80px_-48px_rgba(19,35,28,0.55)] backdrop-blur md:p-8">
          <h1 className="mb-1 font-[family-name:var(--font-source-serif)] text-2xl text-ink">
            Forgot password
          </h1>
          <p className="mb-6 text-sm text-ink/55">
            Enter your email and we will send a reset link if an account exists.
          </p>
          <ForgotPasswordForm />
        </div>
      </div>
    </main>
  );
}
