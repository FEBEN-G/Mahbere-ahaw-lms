"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  EmptyState,
  ErrorBanner,
  LoadingBlock,
} from "@/components/ui/feedback";
import { listCoursesRequest, type CourseSummary } from "@/lib/courses/api";
import { listOfflineCourses } from "@/lib/offline/db";
import { useConnectivityStore } from "@/lib/offline/connectivity-store";

export function StudentCoursesList() {
  const online = useConnectivityStore((state) => state.online);

  const coursesQuery = useQuery({
    queryKey: ["courses", online],
    queryFn: async (): Promise<CourseSummary[]> => {
      if (!online) {
        const cached = await listOfflineCourses();
        return cached
          .map((course) => ({
            id: course.id,
            title: course.title,
            description: course.description,
            monthNumber: course.monthNumber,
            status: "PUBLISHED",
          }))
          .sort((a, b) => a.monthNumber - b.monthNumber);
      }
      return listCoursesRequest();
    },
  });

  if (coursesQuery.isLoading) {
    return <LoadingBlock label="Loading courses…" />;
  }

  if (coursesQuery.isError) {
    return (
      <ErrorBanner
        message={(coursesQuery.error as Error).message}
        onRetry={() => void coursesQuery.refetch()}
      />
    );
  }

  const courses = coursesQuery.data ?? [];

  if (courses.length === 0) {
    return (
      <EmptyState
        title={online ? "No unlocked courses yet" : "No offline courses saved"}
        description={
          online
            ? "Published courses for your unlocked months will appear here."
            : "Go online, open a course, and choose Download for offline."
        }
      />
    );
  }

  return (
    <div className="space-y-3">
      {!online ? (
        <p className="rounded-xl border border-line bg-sand/60 px-4 py-3 text-sm text-ink/70">
          Showing downloaded courses only. Connect to sync new modules.
        </p>
      ) : null}
      <ul className="grid gap-4 sm:grid-cols-2">
        {courses.map((course) => (
          <li key={course.id}>
            <Link
              href={`/student/courses/${course.id}`}
              className="group flex h-full flex-col rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)] transition-all hover:-translate-y-0.5 hover:border-moss/40 hover:shadow-[0_18px_36px_-22px_rgba(31,77,58,0.4)]"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-moss">
                Month {course.monthNumber}
              </p>
              <h3 className="mt-2 text-lg font-semibold text-ink">
                {course.title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-ink/65">
                {course.description ?? "Course materials available inside."}
              </p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
                Open course
                <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
