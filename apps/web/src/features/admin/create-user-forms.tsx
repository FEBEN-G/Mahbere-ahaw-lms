"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Panel } from "@/components/layout/panel";
import { ErrorBanner } from "@/components/ui/feedback";
import {
  createInstructorRequest,
  createStudentRequest,
} from "@/lib/users/api";

const studentSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  studentCode: z.string().optional(),
  cohortStartedAt: z.string().optional(),
});

const instructorSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  title: z.string().optional(),
});

type StudentValues = z.infer<typeof studentSchema>;
type InstructorValues = z.infer<typeof instructorSchema>;

const fieldClass =
  "w-full rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2";

export function CreateUserForms() {
  const queryClient = useQueryClient();
  const [issuedPassword, setIssuedPassword] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const studentForm = useForm<StudentValues>({
    resolver: zodResolver(studentSchema),
  });

  const instructorForm = useForm<InstructorValues>({
    resolver: zodResolver(instructorSchema),
  });

  const studentMutation = useMutation({
    mutationFn: createStudentRequest,
    onSuccess: async (result) => {
      setIssuedPassword(result.temporaryPassword);
      setErrorMessage(null);
      studentForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  const instructorMutation = useMutation({
    mutationFn: createInstructorRequest,
    onSuccess: async (result) => {
      setIssuedPassword(result.temporaryPassword);
      setErrorMessage(null);
      instructorForm.reset();
      await queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (error: Error) => setErrorMessage(error.message),
  });

  return (
    <div className="space-y-4">
      {errorMessage ? <ErrorBanner message={errorMessage} /> : null}
      {issuedPassword ? (
        <p className="rounded-xl border border-forest/30 bg-sand px-4 py-3 text-sm text-ink">
          Temporary password issued (copy now):{" "}
          <code className="font-semibold">{issuedPassword}</code>
        </p>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel
          title="Register student"
          description="Creates a student account with a one-time temporary password. Month 1 opens on their program start date."
        >
          <form
            className="space-y-3"
            onSubmit={studentForm.handleSubmit((values) =>
              studentMutation.mutate({
                ...values,
                cohortStartedAt: values.cohortStartedAt
                  ? new Date(values.cohortStartedAt).toISOString()
                  : undefined,
              }),
            )}
          >
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-ink/70">Email</span>
              <input
                className={fieldClass}
                type="email"
                autoComplete="email"
                {...studentForm.register("email")}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink/70">First name</span>
                <input
                  className={fieldClass}
                  {...studentForm.register("firstName")}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink/70">Last name</span>
                <input
                  className={fieldClass}
                  {...studentForm.register("lastName")}
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-ink/70">
                Student code (optional)
              </span>
              <input
                className={fieldClass}
                {...studentForm.register("studentCode")}
              />
            </label>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-ink/70">
                Program start date (optional — defaults to today)
              </span>
              <input
                type="date"
                className={fieldClass}
                {...studentForm.register("cohortStartedAt")}
              />
            </label>
            <button
              type="submit"
              disabled={studentMutation.isPending}
              className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
            >
              {studentMutation.isPending ? "Creating..." : "Create student"}
            </button>
          </form>
        </Panel>

        <Panel
          title="Register instructor"
          description="Creates an instructor account with a one-time temporary password."
        >
          <form
            className="space-y-3"
            onSubmit={instructorForm.handleSubmit((values) =>
              instructorMutation.mutate(values),
            )}
          >
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-ink/70">Email</span>
              <input
                className={fieldClass}
                type="email"
                autoComplete="email"
                {...instructorForm.register("email")}
              />
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink/70">First name</span>
                <input
                  className={fieldClass}
                  {...instructorForm.register("firstName")}
                />
              </label>
              <label className="block space-y-1.5 text-sm">
                <span className="font-medium text-ink/70">Last name</span>
                <input
                  className={fieldClass}
                  {...instructorForm.register("lastName")}
                />
              </label>
            </div>
            <label className="block space-y-1.5 text-sm">
              <span className="font-medium text-ink/70">Title (optional)</span>
              <input
                className={fieldClass}
                {...instructorForm.register("title")}
              />
            </label>
            <button
              type="submit"
              disabled={instructorMutation.isPending}
              className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
            >
              {instructorMutation.isPending
                ? "Creating..."
                : "Create instructor"}
            </button>
          </form>
        </Panel>
      </div>
    </div>
  );
}
