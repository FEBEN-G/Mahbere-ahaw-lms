"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
    <div className="grid gap-6 lg:grid-cols-2">
      <form
        className="space-y-3 rounded-xl border border-line bg-white/80 p-5"
        onSubmit={studentForm.handleSubmit((values) =>
          studentMutation.mutate({
            ...values,
            cohortStartedAt: values.cohortStartedAt
              ? new Date(values.cohortStartedAt).toISOString()
              : undefined,
          }),
        )}
      >
        <h2 className="font-[family-name:var(--font-source-serif)] text-xl text-ink">
          Register student
        </h2>
        <p className="text-sm text-ink/60">
          Creates a student account with a one-time temporary password. Month 1
          unlocks on the cohort start date.
        </p>
        <input
          className="w-full rounded-md border border-line px-3 py-2"
          placeholder="Email"
          {...studentForm.register("email")}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-md border border-line px-3 py-2"
            placeholder="First name"
            {...studentForm.register("firstName")}
          />
          <input
            className="rounded-md border border-line px-3 py-2"
            placeholder="Last name"
            {...studentForm.register("lastName")}
          />
        </div>
        <input
          className="w-full rounded-md border border-line px-3 py-2"
          placeholder="Student code (optional)"
          {...studentForm.register("studentCode")}
        />
        <label className="block space-y-1 text-sm text-ink/70">
          <span>Cohort start date (optional — defaults to today)</span>
          <input
            type="date"
            className="w-full rounded-md border border-line px-3 py-2"
            {...studentForm.register("cohortStartedAt")}
          />
        </label>
        <button
          type="submit"
          disabled={studentMutation.isPending}
          className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
        >
          {studentMutation.isPending ? "Creating..." : "Create student"}
        </button>
      </form>

      <form
        className="space-y-3 rounded-xl border border-line bg-white/80 p-5"
        onSubmit={instructorForm.handleSubmit((values) =>
          instructorMutation.mutate(values),
        )}
      >
        <h2 className="font-[family-name:var(--font-source-serif)] text-xl text-ink">
          Register instructor
        </h2>
        <p className="text-sm text-ink/60">
          Creates an instructor account with a one-time temporary password.
        </p>
        <input
          className="w-full rounded-md border border-line px-3 py-2"
          placeholder="Email"
          {...instructorForm.register("email")}
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            className="rounded-md border border-line px-3 py-2"
            placeholder="First name"
            {...instructorForm.register("firstName")}
          />
          <input
            className="rounded-md border border-line px-3 py-2"
            placeholder="Last name"
            {...instructorForm.register("lastName")}
          />
        </div>
        <input
          className="w-full rounded-md border border-line px-3 py-2"
          placeholder="Title (optional)"
          {...instructorForm.register("title")}
        />
        <button
          type="submit"
          disabled={instructorMutation.isPending}
          className="rounded-md bg-forest px-4 py-2 text-sm font-semibold text-white hover:bg-moss disabled:opacity-60"
        >
          {instructorMutation.isPending ? "Creating..." : "Create instructor"}
        </button>
      </form>

      {errorMessage ? (
        <p className="lg:col-span-2 rounded-md border border-accent/30 bg-accent/10 px-3 py-2 text-sm">
          {errorMessage}
        </p>
      ) : null}

      {issuedPassword ? (
        <p className="lg:col-span-2 rounded-md border border-forest/30 bg-sand px-3 py-3 text-sm text-ink">
          Temporary password issued (copy now):{" "}
          <code className="font-semibold">{issuedPassword}</code>
        </p>
      ) : null}
    </div>
  );
}
