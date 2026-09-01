/** Plain-language labels for values shown in the UI. */

export function courseStatusLabel(status: string): string {
  if (status === "PUBLISHED") return "Live for students";
  if (status === "DRAFT") return "Not published yet";
  return status;
}

export function gradeStatusLabel(status: string): string {
  if (status === "PUBLISHED") return "Shared with student";
  if (status === "DRAFT") return "Not shared yet";
  return status;
}

export function submissionStatusLabel(status: string): string {
  if (status === "SUBMITTED") return "Submitted on time";
  if (status === "LATE") return "Submitted late";
  if (status === "RETURNED") return "Returned for revision";
  if (status === "GRADED") return "Graded";
  return status;
}

export function instructorReviewStatusLabel(input: {
  submissionStatus: string;
  gradeStatus?: string | null;
  hasGrade?: boolean;
}): string {
  if (input.gradeStatus === "PUBLISHED") return "Shared with student";
  if (input.hasGrade) return "Not shared yet";
  if (input.submissionStatus === "LATE") return "Late · needs grading";
  return "Needs grading";
}
