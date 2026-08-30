"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { forgotPasswordRequest } from "@/lib/auth/api";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
});

type Values = z.infer<typeof schema>;

export function ForgotPasswordForm() {
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit(values: Values) {
    setErrorMessage(null);
    setMessage(null);
    try {
      const result = await forgotPasswordRequest(values.email);
      setMessage(result.message);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to send reset email",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink/80">Email</span>
        <input
          type="email"
          autoComplete="email"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
          {...register("email")}
        />
        {errors.email ? (
          <span className="text-sm text-accent">{errors.email.message}</span>
        ) : null}
      </label>

      {message ? (
        <p className="rounded-md border border-forest/20 bg-forest/5 px-3 py-2 text-sm text-ink">
          {message}
        </p>
      ) : null}
      {errorMessage ? (
        <p className="rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
      >
        {isSubmitting ? "Sending..." : "Send reset link"}
      </button>

      <p className="text-center text-sm text-ink/60">
        <Link href="/login" className="font-medium text-forest hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
