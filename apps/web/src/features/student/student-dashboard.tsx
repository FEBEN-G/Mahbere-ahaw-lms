"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight,
  BookOpen,
  ClipboardList,
  GraduationCap,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/panel";
import { ErrorBanner, LoadingBlock } from "@/components/ui/feedback";
import { useAuthStore } from "@/lib/auth/store";
import { getStudentDashboardRequest } from "@/lib/dashboard/api";
import {
  getStudentDashboardSnapshot,
  listOfflineCourses,
  saveStudentDashboardSnapshot,
} from "@/lib/offline/db";
import { useConnectivityStore } from "@/lib/offline/connectivity-store";
import { getMyEnrollmentRequest } from "@/lib/users/api";

async function loadOfflineDashboard(firstName: string) {
  const snapshot = await getStudentDashboardSnapshot();
  if (snapshot) {
    return {
      firstName: snapshot.firstName || firstName,
      unlockedMonth: snapshot.unlockedMonth,
      dashboard: snapshot,
    };
  }

  const cachedCourses = await listOfflineCourses();
  const unlockedMonth =
    cachedCourses.reduce(
      (max, course) => Math.max(max, course.monthNumber),
      1,
    ) || 1;
  const currentMonthCourses = cachedCourses
    .filter((course) => course.monthNumber === unlockedMonth)
    .slice(0, 2)
    .map((course) => {
      const payload = course.payload as {
        modules?: unknown[];
        assignments?: unknown[];
      };
      return {
        id: course.id,
        title: course.title,
        description: course.description,
        monthNumber: course.monthNumber,
        moduleCount: payload.modules?.length ?? 0,
        assignmentCount: payload.assignments?.length ?? 0,
      };
    });

  return {
    firstName,
    unlockedMonth,
    dashboard: {
      unlockedMonth,
      currentMonthCourses,
      progress: { completed: 0, total: 0, percent: 0 },
      availableCourses: cachedCourses.length,
      submissionsCount: 0,
      publishedGradesCount: 0,
      firstName,
      savedAt: new Date().toISOString(),
    },
  };
}

export function StudentDashboard() {
  const online = useConnectivityStore((state) => state.online);
  const user = useAuthStore((state) => state.user);

  const dashboardQuery = useQuery({
    queryKey: ["dashboard-student", online, user?.id],
    enabled: Boolean(user),
    queryFn: async () => {
      if (!online) {
        return loadOfflineDashboard(user?.firstName ?? "Student");
      }

      const [me, dashboard] = await Promise.all([
        getMyEnrollmentRequest(),
        getStudentDashboardRequest(),
      ]);

      await saveStudentDashboardSnapshot({
        unlockedMonth: me.enrollment.unlockedMonth,
        currentMonthCourses: dashboard.currentMonthCourses,
        progress: dashboard.progress,
        availableCourses: dashboard.availableCourses,
        submissionsCount: dashboard.submissionsCount,
        publishedGradesCount: dashboard.publishedGradesCount,
        firstName: me.user.firstName,
      });

      return {
        firstName: me.user.firstName,
        unlockedMonth: me.enrollment.unlockedMonth,
        dashboard,
      };
    },
  });

  if (dashboardQuery.isLoading) {
    return <LoadingBlock label="Loading your dashboard…" />;
  }

  if (dashboardQuery.isError) {
    return (
      <ErrorBanner
        message={(dashboardQuery.error as Error).message}
        onRetry={() => void dashboardQuery.refetch()}
      />
    );
  }

  const data = dashboardQuery.data;
  if (!data) return null;

  const { dashboard, unlockedMonth, firstName } = data;
  const currentCourses = dashboard.currentMonthCourses;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome, ${firstName}`}
        description={
          online
            ? `Month ${unlockedMonth} is active. Your two current courses and completion progress are shown below.`
            : `Offline mode · Month ${unlockedMonth}. Showing downloaded courses. Connect to sync new content or submit work.`
        }
      />

      <section className="rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)]">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-ink">
            Month {unlockedMonth} progress
          </p>
          <p className="text-xs text-ink/50">
            {dashboard.progress.completed} of {dashboard.progress.total} items
            completed
          </p>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forest to-moss transition-all duration-700"
            style={{ width: `${dashboard.progress.percent}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-ink/55">
          Progress includes reading materials opened and assignments submitted
          for this month.
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-ink">
            This month&apos;s courses
          </h2>
          <span className="text-xs uppercase tracking-[0.14em] text-ink/45">
            {currentCourses.length}/2 slots
          </span>
        </div>
        {currentCourses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line bg-white/70 px-5 py-10 text-center text-sm text-ink/60">
            {online
              ? `No published courses for Month ${unlockedMonth} yet.`
              : "No downloaded courses for this month. Go online and use Download for offline."}
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {currentCourses.map((course) => (
              <Link
                key={course.id}
                href={`/student/courses/${course.id}`}
                className="group rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)] transition hover:-translate-y-0.5 hover:border-moss/35"
              >
                <p className="text-xs uppercase tracking-wide text-moss">
                  Month {course.monthNumber}
                </p>
                <p className="mt-1 font-semibold text-ink">{course.title}</p>
                <p className="mt-2 line-clamp-2 text-sm text-ink/60">
                  {course.description ??
                    "Open modules and complete assignments."}
                </p>
                <p className="mt-3 text-xs text-ink/50">
                  {course.moduleCount} modules · {course.assignmentCount}{" "}
                  assignments
                </p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
                  Open course
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Unlocked courses" value={dashboard.availableCourses} />
        <StatCard label="Submissions" value={dashboard.submissionsCount} />
        <StatCard
          label="Published grades"
          value={dashboard.publishedGradesCount}
        />
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {[
          {
            href: "/student/courses",
            title: "All courses",
            body: "Browse every unlocked month.",
            icon: BookOpen,
          },
          {
            href: "/student/assignments",
            title: "Submit work",
            body: "Upload assignments before the due date.",
            icon: ClipboardList,
          },
          {
            href: "/student/grades",
            title: "View grades",
            body: "Check scores and instructor feedback.",
            icon: GraduationCap,
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className="group rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)] transition-all hover:-translate-y-0.5 hover:border-moss/35"
            >
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sand text-forest">
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-4 font-semibold text-ink">{item.title}</p>
              <p className="mt-1 text-sm text-ink/60">{item.body}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
