"use client";

import { useQuery } from "@tanstack/react-query";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { StatCard } from "@/components/layout/panel";
import { ErrorBanner, LoadingBlock } from "@/components/ui/feedback";
import {
  getAdminDashboardRequest,
  getAdminMetricsRequest,
} from "@/lib/dashboard/api";

const AdminMetricsCharts = dynamic(
  () =>
    import("./admin-metrics-charts").then((module) => module.AdminMetricsCharts),
  {
    ssr: false,
    loading: () => <LoadingBlock label="Loading metrics charts…" />,
  },
);

export function AdminStats() {
  const statsQuery = useQuery({
    queryKey: ["dashboard-admin"],
    queryFn: getAdminDashboardRequest,
  });

  const metricsQuery = useQuery({
    queryKey: ["dashboard-admin-metrics", 14],
    queryFn: () => getAdminMetricsRequest(14),
  });

  const stats = metricsQuery.data?.summary ?? statsQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Program overview"
        description="Monitor enrollment, published content, grading throughput, and pipeline health across the seminary LMS."
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard label="Students" value={stats?.students ?? "—"} />
        <StatCard label="Instructors" value={stats?.instructors ?? "—"} />
        <StatCard
          label="Published courses"
          value={stats?.publishedCourses ?? "—"}
        />
        <StatCard
          label="Pending submissions"
          value={stats?.pendingSubmissions ?? "—"}
        />
        <StatCard label="Published grades" value={stats?.gradedCount ?? "—"} />
        <StatCard
          label="Graded this week"
          value={metricsQuery.data?.summary.gradedThisWeek ?? "—"}
        />
      </div>

      {metricsQuery.isLoading ? (
        <LoadingBlock label="Loading metrics charts…" />
      ) : null}
      {metricsQuery.isError ? (
        <ErrorBanner
          message="Unable to load metrics charts."
          onRetry={() => void metricsQuery.refetch()}
        />
      ) : null}
      {metricsQuery.data ? (
        <AdminMetricsCharts metrics={metricsQuery.data} />
      ) : null}

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {[
          {
            href: "/admin/users",
            title: "Manage users",
            body: "Register students and instructors.",
          },
          {
            href: "/admin/courses",
            title: "Courses & modules",
            body: "Publish monthly content and materials.",
          },
          {
            href: "/admin/assignments",
            title: "Assignments",
            body: "Create due dates and prompts.",
          },
          {
            href: "/admin/gradebook",
            title: "Gradebook",
            body: "Review scores and export Excel.",
          },
        ].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="group rounded-2xl border border-line/80 bg-white/90 p-5 transition-all hover:-translate-y-0.5 hover:border-moss/35 hover:shadow-[0_18px_36px_-24px_rgba(31,77,58,0.45)]"
          >
            <p className="font-semibold text-ink">{item.title}</p>
            <p className="mt-1 text-sm text-ink/60">{item.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-forest">
              Open
              <ArrowRight className="h-4 w-4 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
