"use client";

import { useQuery } from "@tanstack/react-query";
import { getAdminMetricsRequest } from "@/lib/dashboard/api";
import { getSystemSettingsRequest } from "@/lib/settings/api";

export function AdminDripOverview() {
  const metricsQuery = useQuery({
    queryKey: ["dashboard-admin-metrics", 14],
    queryFn: () => getAdminMetricsRequest(14),
  });

  const settingsQuery = useQuery({
    queryKey: ["system-settings"],
    queryFn: getSystemSettingsRequest,
  });

  const months = metricsQuery.data?.coursesByMonth ?? [];
  const cap = settingsQuery.data?.publishedCoursesPerMonth ?? 2;
  const daysBetweenMonths = settingsQuery.data?.dripDaysPerMonth ?? 30;

  return (
    <section className="rounded-2xl border border-line/80 bg-white/90 p-5 shadow-[0_1px_0_rgba(19,35,28,0.04)]">
      <h2 className="text-lg font-semibold text-ink">Monthly course release</h2>
      <p className="mt-1 text-sm text-ink/65">
        Month 1 opens when a student starts the program. Every {daysBetweenMonths}{" "}
        days the next month opens. You can publish up to {cap} courses per month
        so students receive a full set each time.
      </p>

      {metricsQuery.isLoading ? (
        <p className="mt-4 text-sm text-ink/55">Loading months…</p>
      ) : months.length === 0 ? (
        <p className="mt-4 text-sm text-ink/55">No courses created yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink/60">
                <th className="py-2 pr-3 font-medium">Month</th>
                <th className="py-2 pr-3 font-medium">Live</th>
                <th className="py-2 pr-3 font-medium">Not published</th>
                <th className="py-2 font-medium">Ready?</th>
              </tr>
            </thead>
            <tbody>
              {months
                .slice()
                .sort((a, b) => a.monthNumber - b.monthNumber)
                .map((row) => {
                  const ready = row.published >= cap;
                  return (
                    <tr key={row.monthNumber} className="border-b border-line/60">
                      <td className="py-2 pr-3">Month {row.monthNumber}</td>
                      <td className="py-2 pr-3">{row.published}</td>
                      <td className="py-2 pr-3">{row.draft}</td>
                      <td className="py-2">
                        <span
                          className={
                            ready
                              ? "font-medium text-forest"
                              : "font-medium text-accent"
                          }
                        >
                          {row.published}/{cap}
                          {ready ? " · ready" : " · needs more courses"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
