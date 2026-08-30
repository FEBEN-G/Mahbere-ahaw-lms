import { getDripDaysPerMonth } from './program-policy';

/**
 * Computes the highest unlocked month for a student based on enrollment start.
 * Month 1 unlocks immediately; later months unlock every configured drip interval.
 */
export function computeUnlockedMonth(
  cohortStartedAt: Date,
  now: Date = new Date(),
  daysPerMonth: number = getDripDaysPerMonth(),
): number {
  const millisecondsPerDay = 24 * 60 * 60 * 1000;
  const elapsedDays = Math.floor(
    (now.getTime() - cohortStartedAt.getTime()) / millisecondsPerDay,
  );

  if (elapsedDays < 0) {
    return 0;
  }

  return Math.floor(elapsedDays / daysPerMonth) + 1;
}

export function canAccessCourseMonth(
  courseMonthNumber: number,
  cohortStartedAt: Date,
  now: Date = new Date(),
): boolean {
  return courseMonthNumber <= computeUnlockedMonth(cohortStartedAt, now);
}
