"use client";

import { useQuery } from "@tanstack/react-query";
import { listMyGradesRequest } from "@/lib/grading/api";
import { useConnectivityStore } from "@/lib/offline/connectivity-store";

export function StudentGradesPanel() {
  const online = useConnectivityStore((state) => state.online);

  const gradesQuery = useQuery({
    queryKey: ["grades-my"],
    queryFn: listMyGradesRequest,
    enabled: online,
  });

  if (!online) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/70 px-5 py-10 text-center text-sm text-ink/60">
        Connect to the internet to view published grades and instructor
        feedback.
      </div>
    );
  }

  if (gradesQuery.isLoading) {
    return <p className="text-sm text-ink/60">Loading grades...</p>;
  }

  if (gradesQuery.isError) {
    return (
      <p className="text-sm text-accent">
        {(gradesQuery.error as Error).message}
      </p>
    );
  }

  const grades = gradesQuery.data ?? [];

  if (grades.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-line bg-white/70 px-5 py-10 text-center text-sm text-ink/60">
        No published grades yet. Scores and instructor feedback will appear here
        after grading.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {grades.map((grade) => {
        const maxScore = grade.submission.assignment.maxScore;
        return (
          <li
            key={grade.id}
            className="rounded-2xl border border-line/80 bg-white/90 p-5 text-sm shadow-[0_1px_0_rgba(19,35,28,0.04)] transition hover:border-moss/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-semibold text-ink">
                  {grade.submission.assignment.title}
                </p>
                <p className="text-ink/55">
                  {grade.submission.assignment.course.title}
                  {grade.submission.assignment.course.monthNumber
                    ? ` · Month ${grade.submission.assignment.course.monthNumber}`
                    : ""}
                </p>
                {grade.publishedAt ? (
                  <p className="mt-1 text-xs text-ink/45">
                    Published {new Date(grade.publishedAt).toLocaleString()}
                  </p>
                ) : null}
              </div>
              <span className="rounded-full bg-sand px-3 py-1 text-sm font-semibold text-forest">
                {grade.score}
                {maxScore != null && maxScore !== ""
                  ? ` / ${maxScore}`
                  : ""}
              </span>
            </div>
            <div className="mt-3 rounded-xl bg-mist/80 px-3 py-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/45">
                Instructor feedback
              </p>
              <p className="mt-1 text-ink/75">
                {grade.feedback?.trim()
                  ? grade.feedback
                  : "No written feedback was provided with this grade."}
              </p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
