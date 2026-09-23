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
// dated one to the latest, which is why the courses are taken already in the
// site's order, by date with the undated last (src/lib/order.ts): the dated
// ones are then a prefix, and the node's period is the first entry's date to
// the last dated entry's.
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

  const dated = courses.filter((course) => course.date !== undefined);
  const period =
    dated.length > 0 ? { start: String(dated[0]!.date), end: String(dated[dated.length - 1]!.date) } : undefined;
  items.splice(Math.max(items.length - 1, 0), 0, { kind: 'courses', count: courses.length, period });
  return items;
}
