"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { Panel, StatCard } from "@/components/layout/panel";
import { ErrorBanner, LoadingBlock } from "@/components/ui/feedback";
import { getInstructorDashboardRequest } from "@/lib/dashboard/api";
import { getInstructorMeRequest } from "@/lib/instructors/api";

export function InstructorDashboard() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-instructor"],
    queryFn: getInstructorDashboardRequest,
  });

  const meQuery = useQuery({
    queryKey: ["instructor-me"],
    queryFn: getInstructorMeRequest,
  });

  if (meQuery.isLoading) {
    return <LoadingBlock label="Loading instructor profile…" />;
  }

  if (meQuery.isError) {
    return (
      <ErrorBanner
        message={(meQuery.error as Error).message}
        onRetry={() => void meQuery.refetch()}
      />
    );
  }

  const data = meQuery.data;
  if (!data) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${data.user.firstName}`}
        description={`${data.title ?? "Instructor"} — review submissions, download student work, and publish scores with written feedback.`}
        actions={
          <Link
            href="/instructor/grading"
            className="inline-flex items-center gap-2 rounded-xl bg-forest px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-moss"
          >
            Open reviews
            <ArrowRight className="h-4 w-4" />
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Pending submissions"
          value={
            statsQuery.data?.pendingSubmissions ?? data.pendingSubmissionsCount
          }
        />
        <StatCard label="Graded this week" value={data.gradedThisWeekCount} />
        <StatCard
          label="Assigned courses"
          value={data.assignedCourses.length}
        />
      </div>

      <Panel title="Assigned courses" description="Courses linked to your instructor profile">
        {data.assignedCourses.length === 0 ? (
          <p className="text-sm text-ink/60">
            No courses assigned yet. An admin will link you when course
            management is configured.
          </p>
        ) : (
          <ul className="space-y-2">
            {data.assignedCourses.map((course) => (
              <li
                key={course.id}
                className="flex items-center justify-between rounded-xl border border-line/70 bg-mist/50 px-4 py-3 text-sm transition hover:border-moss/30 hover:bg-white"
              >
                <span className="font-medium text-ink">
                  Month {course.monthNumber}: {course.title}
                </span>
                <span className="rounded-full bg-sand px-2.5 py-0.5 text-xs font-medium text-ink/65">
                  {course.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}
