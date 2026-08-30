"use client";

import type { ReactNode } from "react";
import ReactECharts from "echarts-for-react";
import type { AdminMetrics } from "@/lib/dashboard/api";

const ink = "#13231c";
const forest = "#1f4d3a";
const moss = "#3d6b54";
const accent = "#c45c26";
const sand = "#e8efe9";

function ChartCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-line/80 bg-white/90 p-4 shadow-[0_1px_0_rgba(19,35,28,0.04)] md:p-5">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      <p className="mt-1 text-xs text-ink/55">{description}</p>
      <div className="mt-3 h-64 w-full">{children}</div>
    </section>
  );
}

export function AdminMetricsCharts({ metrics }: { metrics: AdminMetrics }) {
  const dates = metrics.series.submissions.map((point) => point.date);

  const throughputOption = {
    color: [forest, accent, moss],
    tooltip: { trigger: "axis" },
    legend: {
      data: ["Submissions", "Published grades", "Enrollments"],
      bottom: 0,
      textStyle: { color: ink },
    },
    grid: { left: 36, right: 16, top: 24, bottom: 48 },
    xAxis: {
      type: "category",
      data: dates,
      axisLabel: { color: ink, hideOverlap: true },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: ink },
      splitLine: { lineStyle: { color: sand } },
    },
    series: [
      {
        name: "Submissions",
        type: "line",
        smooth: true,
        data: metrics.series.submissions.map((point) => point.count),
      },
      {
        name: "Published grades",
        type: "line",
        smooth: true,
        data: metrics.series.publishedGrades.map((point) => point.count),
      },
      {
        name: "Enrollments",
        type: "bar",
        data: metrics.series.enrollments.map((point) => point.count),
      },
    ],
  };

  const pipelineOption = {
    color: [forest, accent, moss, "#7a8f84"],
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { color: ink } },
    series: [
      {
        type: "pie",
        radius: ["42%", "68%"],
        center: ["50%", "45%"],
        label: { color: ink },
        data: [
          { name: "Submitted", value: metrics.submissionPipeline.submitted },
          { name: "Late", value: metrics.submissionPipeline.late },
          { name: "Graded", value: metrics.submissionPipeline.graded },
          { name: "Returned", value: metrics.submissionPipeline.returned },
        ],
      },
    ],
  };

  const monthOption = {
    color: [forest, moss],
    tooltip: { trigger: "axis" },
    legend: {
      data: ["Published", "Draft"],
      bottom: 0,
      textStyle: { color: ink },
    },
    grid: { left: 36, right: 16, top: 24, bottom: 48 },
    xAxis: {
      type: "category",
      data: metrics.coursesByMonth.map((row) => `Month ${row.monthNumber}`),
      axisLabel: { color: ink },
    },
    yAxis: {
      type: "value",
      minInterval: 1,
      axisLabel: { color: ink },
      splitLine: { lineStyle: { color: sand } },
    },
    series: [
      {
        name: "Published",
        type: "bar",
        stack: "courses",
        data: metrics.coursesByMonth.map((row) => row.published),
      },
      {
        name: "Draft",
        type: "bar",
        stack: "courses",
        data: metrics.coursesByMonth.map((row) => row.draft),
      },
    ],
  };

  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="xl:col-span-2">
        <ChartCard
          title="Activity throughput"
          description={`Last ${metrics.windowDays} days of submissions, published grades, and enrollments.`}
        >
          <ReactECharts option={throughputOption} style={{ height: "100%", width: "100%" }} />
        </ChartCard>
      </div>
      <ChartCard
        title="Submission pipeline"
        description="Current distribution of submission statuses."
      >
        <ReactECharts option={pipelineOption} style={{ height: "100%", width: "100%" }} />
      </ChartCard>
      <ChartCard
        title="Month release status"
        description="Published vs draft courses by drip month."
      >
        <ReactECharts option={monthOption} style={{ height: "100%", width: "100%" }} />
      </ChartCard>
    </div>
  );
}
