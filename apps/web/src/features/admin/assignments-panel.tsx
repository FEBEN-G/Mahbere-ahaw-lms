"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { createAssignmentRequest } from "@/lib/assignments/api";
import { listCoursesRequest } from "@/lib/courses/api";

export function AdminAssignmentsPanel() {
  const queryClient = useQueryClient();
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");

  const coursesQuery = useQuery({
    queryKey: ["courses"],
    queryFn: listCoursesRequest,
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("dueAt", new Date(dueAt).toISOString());
      formData.append("description", "Complete and upload your work.");
      return createAssignmentRequest(courseId, formData);
    },
    onSuccess: async () => {
      setTitle("");
      setDueAt("");
      await queryClient.invalidateQueries({ queryKey: ["assignments"] });
    },
  });

  const courses = coursesQuery.data ?? [];

  return (
    <section className="space-y-4 rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)]">
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
          value={courseId}
          onChange={(event) => setCourseId(event.target.value)}
        >
          <option value="">Select course</option>
          {courses.map((course) => (
            <option key={course.id} value={course.id}>
              Month {course.monthNumber}: {course.title}
            </option>
          ))}
        </select>
        <input
          className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
          placeholder="Assignment title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
        />
        <input
          type="datetime-local"
          className="rounded-xl border border-line px-3 py-2.5 text-sm outline-none ring-forest/20 focus:ring-2"
          value={dueAt}
          onChange={(event) => setDueAt(event.target.value)}
        />
        <button
          type="button"
          disabled={!courseId || !title || !dueAt || createMutation.isPending}
          onClick={() => createMutation.mutate()}
          className="rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss disabled:opacity-60"
        >
          Create assignment
        </button>
      </div>
    </section>
  );
}
