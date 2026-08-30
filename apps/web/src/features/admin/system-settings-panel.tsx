"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  getAccessLevelsRequest,
  getSystemSettingsRequest,
  updateSystemSettingsRequest,
} from "@/lib/settings/api";
import { roleLabel } from "@/lib/auth/routes";
import type { UserRole } from "@/lib/auth/types";

const settingsSchema = z.object({
  dripDaysPerMonth: z.coerce.number().int().min(1).max(90),
  publishedCoursesPerMonth: z.coerce.number().int().min(1).max(6),
  maxUploadMb: z.coerce.number().int().min(1).max(50),
});

type SettingsValues = z.infer<typeof settingsSchema>;

const ACCESS_LEVEL_COPY: Record<UserRole, string> = {
  SUPER_ADMIN:
    "Full system control: register students and instructors, set up courses, configure settings, and manage overall workflow.",
  INSTRUCTOR:
    "Review student assignments, assign grades, and provide detailed written feedback.",
  STUDENT:
    "Access monthly released courses, read modules in the platform, download assignment sheets, and upload completed work.",
};

const FALLBACK_ROLES: UserRole[] = [
  "SUPER_ADMIN",
  "INSTRUCTOR",
  "STUDENT",
];

export function SystemSettingsPanel() {
  const queryClient = useQueryClient();
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSystemSettingsRequest,
  });

  const accessQuery = useQuery({
    queryKey: ["access-levels"],
    queryFn: getAccessLevelsRequest,
  });

  const form = useForm<SettingsValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      dripDaysPerMonth: 30,
      publishedCoursesPerMonth: 2,
      maxUploadMb: 10,
    },
  });

  useEffect(() => {
    if (!settingsQuery.data) return;
    form.reset({
      dripDaysPerMonth: settingsQuery.data.dripDaysPerMonth,
      publishedCoursesPerMonth: settingsQuery.data.publishedCoursesPerMonth,
      maxUploadMb: settingsQuery.data.maxUploadMb,
    });
  }, [form, settingsQuery.data]);

  const mutation = useMutation({
    mutationFn: updateSystemSettingsRequest,
    onSuccess: async () => {
      setMessage("Settings saved. Program policy is active immediately.");
      setErrorMessage(null);
      await queryClient.invalidateQueries({ queryKey: ["system-settings"] });
    },
    onError: (error: Error) => {
      setMessage(null);
      setErrorMessage(error.message);
    },
  });

  if (settingsQuery.isLoading) {
    return <p className="text-sm text-ink/60">Loading settings...</p>;
  }

  if (settingsQuery.isError) {
    return (
      <p className="rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">
        {(settingsQuery.error as Error).message}
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-ink">Program workflow</h2>
        <p className="mt-1 text-sm text-ink/60">
          Configure drip unlock timing, monthly course capacity, and upload
          limits for the seminary LMS.
        </p>

        <form
          className="mt-5 grid gap-4 sm:grid-cols-3"
          onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
        >
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-ink/80">Drip days per month</span>
            <input
              type="number"
              min={1}
              max={90}
              className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
              {...form.register("dripDaysPerMonth")}
            />
            <span className="text-xs text-ink/50">
              Month 1 unlocks at cohort start; later months open after this
              interval.
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-ink/80">
              Published courses per month
            </span>
            <input
              type="number"
              min={1}
              max={6}
              className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
              {...form.register("publishedCoursesPerMonth")}
            />
            <span className="text-xs text-ink/50">
              Soft cap when publishing courses for a given month number.
            </span>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-ink/80">Max upload (MB)</span>
            <input
              type="number"
              min={1}
              max={50}
              className="rounded-xl border border-line bg-white px-3 py-2.5 outline-none ring-forest/30 transition focus:ring-2"
              {...form.register("maxUploadMb")}
            />
            <span className="text-xs text-ink/50">
              Applies to assignment and content file uploads.
            </span>
          </label>

          <div className="sm:col-span-3">
            {message ? (
              <p className="mb-3 rounded-xl border border-forest/20 bg-forest/5 px-3 py-2 text-sm text-forest">
                {message}
              </p>
            ) : null}
            {errorMessage ? (
              <p className="mb-3 rounded-xl border border-accent/30 bg-accent/10 px-3 py-2 text-sm text-ink">
                {errorMessage}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={mutation.isPending}
              className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
            >
              {mutation.isPending ? "Saving..." : "Save settings"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-line bg-white p-5 shadow-sm md:p-6">
        <h2 className="text-lg font-semibold text-ink">Access levels</h2>
        <p className="mt-1 text-sm text-ink/60">
          Fixed role catalogs — permissions are assigned by role, not per user.
        </p>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          {(accessQuery.data ?? FALLBACK_ROLES.map((role) => ({ role, permissions: [] as string[] }))).map(
            (entry) => {
              const role = entry.role;
              return (
                <article
                  key={role}
                  className="rounded-xl border border-line/80 bg-sand/40 p-4"
                >
                  <h3 className="font-semibold text-ink">{roleLabel(role)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-ink/70">
                    {ACCESS_LEVEL_COPY[role]}
                  </p>
                  {entry.permissions.length > 0 ? (
                    <p className="mt-3 text-xs text-ink/45">
                      {entry.permissions.length} permissions in catalog
                    </p>
                  ) : null}
                </article>
              );
            },
          )}
        </div>
      </section>
    </div>
  );
}
