"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { resetPasswordRequest } from "@/lib/auth/api";

const schema = z
  .object({
    newPassword: z.string().min(12, "Password must be at least 12 characters"),
    confirmPassword: z.string().min(12, "Confirm your password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type Values = z.infer<typeof schema>;

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: Values) {
    setErrorMessage(null);
    if (!token) {
      setErrorMessage("Reset token is missing. Request a new link.");
      return;
    }
    try {
      await resetPasswordRequest(token, values.newPassword);
      router.replace("/login");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reset password",
      );
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink/80">New password</span>
        <input
          type="password"
          autoComplete="new-password"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
          {...register("newPassword")}
        />
        {errors.newPassword ? (
          <span className="text-sm text-accent">
            {errors.newPassword.message}
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2 text-sm">
        <span className="font-medium text-ink/80">Confirm password</span>
        <input
          type="password"
          autoComplete="new-password"
          className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
          {...register("confirmPassword")}
        />
        {errors.confirmPassword ? (
          <span className="text-sm text-accent">
            {errors.confirmPassword.message}
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
        disabled={isSubmitting || !token}
        className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
      >
        {isSubmitting ? "Saving..." : "Reset password"}
      </button>

      <p className="text-center text-sm text-ink/60">
        <Link href="/login" className="font-medium text-forest hover:underline">
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
