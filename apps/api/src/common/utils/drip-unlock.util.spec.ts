import {
  canAccessCourseMonth,
  computeUnlockedMonth,
} from './drip-unlock.util';

describe('drip unlock', () => {
  const start = new Date('2026-01-01T00:00:00.000Z');

  it('unlocks month 1 immediately', () => {
    expect(computeUnlockedMonth(start, start)).toBe(1);
  });

  it('unlocks month 2 after 30 days', () => {
    const day30 = new Date('2026-01-31T00:00:00.000Z');
    expect(computeUnlockedMonth(start, day30)).toBe(2);
  });

  it('keeps month 1 before day 30', () => {
    const day29 = new Date('2026-01-30T00:00:00.000Z');
    expect(computeUnlockedMonth(start, day29)).toBe(1);
  });

  it('allows access only to unlocked months', () => {
    const day30 = new Date('2026-01-31T00:00:00.000Z');
    expect(canAccessCourseMonth(1, start, day30)).toBe(true);
    expect(canAccessCourseMonth(2, start, day30)).toBe(true);
    expect(canAccessCourseMonth(3, start, day30)).toBe(false);
  });
});
