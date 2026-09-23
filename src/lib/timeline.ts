// The education timeline, decided once for every output that lays the record
// out in time: the education page's studies list, the CV's education section,
// the dist check's reading-order expectation, and the browser tests all read
// this rather than each keeping a copy of the rule.
//
// The rule: the institutions in the order given, with one node for the
// online-courses phase spliced immediately before the most recent
// institution. By position rather than by date, because the Code with Mosh
// completions carry no date and a phase that spans years needs none to sit
// where it belongs; so the record reads high school, online courses,
// university whatever dates the courses carry (src/content/README.md,
// "education/"). The node counts every course and runs from the earliest
// dated one to the latest, found here whatever order the courses arrive in.
// A date is YYYY, YYYY-MM, or YYYY-MM-DD, and those compare as text: a
// shorter one is a prefix of the longer dates in its span and so sorts
// first, which is where src/lib/order.ts puts it too.
//
// Like shown.ts and order.ts, this file has no runtime import: the scripts
// and the tests load it with Node stripping the types.

export interface CoursesNode {
  kind: 'courses';
  // How many courses the node stands for, dated or not.
  count: number;
  // From the earliest dated course to the latest; absent when none is dated.
  period?: { start: string; end: string };
}

export type TimelineItem<Entry> = { kind: 'education'; entry: Entry } | CoursesNode;

export function educationTimeline<Entry, Course extends { date?: string | number }>(
  education: Entry[],
  courses: Course[],
): TimelineItem<Entry>[] {
  const items: TimelineItem<Entry>[] = education.map((entry) => ({ kind: 'education', entry }));
  if (courses.length === 0) return items;

  const dates = courses.filter((course) => course.date !== undefined).map((course) => String(course.date));
  const period =
    dates.length > 0
      ? { start: dates.reduce((a, b) => (b < a ? b : a)), end: dates.reduce((a, b) => (b > a ? b : a)) }
      : undefined;
  items.splice(Math.max(items.length - 1, 0), 0, { kind: 'courses', count: courses.length, period });
  return items;
}
