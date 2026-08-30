let dripDaysPerMonth = 30;
let publishedCoursesPerMonth = 2;
let maxUploadMb = 10;

export function configureProgramPolicy(input: {
  dripDaysPerMonth: number;
  publishedCoursesPerMonth: number;
  maxUploadMb: number;
}) {
  dripDaysPerMonth = input.dripDaysPerMonth;
  publishedCoursesPerMonth = input.publishedCoursesPerMonth;
  maxUploadMb = input.maxUploadMb;
}

export function getDripDaysPerMonth() {
  return dripDaysPerMonth;
}

export function getPublishedCoursesPerMonth() {
  return publishedCoursesPerMonth;
}

export function getMaxUploadMb() {
  return maxUploadMb;
}
