"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { loginRequest } from "@/lib/auth/api";
import { dashboardPathForRole } from "@/lib/auth/routes";
import { useAuthStore } from "@/lib/auth/store";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setSession = useAuthStore((state) => state.setSession);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loginForm = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isHydrated && user) {
      router.replace(dashboardPathForRole(user.role));
    }
  }, [isHydrated, router, user]);

  async function onLogin(values: LoginValues) {
    setErrorMessage(null);
    try {
      const session = await loginRequest(values.email, values.password);
      setSession(session);
      router.push(dashboardPathForRole(session.user.role));
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to sign in",
      );
    }
  }

  if (isHydrated && user) {
    return (
      <p className="text-sm text-ink/60">Redirecting to your dashboard...</p>
    );
  }

  return (
    <form
      onSubmit={loginForm.handleSubmit(onLogin)}
      className="animate-rise flex w-full flex-col gap-5"
    >
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink/80">Email</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
          {...loginForm.register("email")}
        />
        {loginForm.formState.errors.email ? (
          <span className="text-sm text-accent">
            {loginForm.formState.errors.email.message}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink/80">Password</span>
        <input
          type="password"
          autoComplete="current-password"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
          {...loginForm.register("password")}
        />
        {loginForm.formState.errors.password ? (
          <span className="text-sm text-accent">
            {loginForm.formState.errors.password.message}
          </span>
        ) : null}
      </label>

      {errorMessage ? (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loginForm.formState.isSubmitting}
        className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
      >
        {loginForm.formState.isSubmitting ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}
