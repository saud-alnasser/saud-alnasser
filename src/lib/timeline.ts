// The education timeline, decided once for every output that lays the record
// out in time: the education page's studies list, the CV's education section,
// the dist check's reading-order expectation, and the browser tests all read
// this rather than each keeping a copy of the rule. The home page's timeline
// from study to work is built on it, by `journey` at the foot of this file.
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

// The home page's one line from study to work: the education timeline above,
// exactly as it is built for every other output, with each experience entry
// laid in by when it started, and the whole read newest first.
//
// An experience entry goes after the last item that starts no later than it
// does: an institution by its period's start, the online-courses node by the
// earliest dated course. A courses node with no dated course has no start and
// is passed over, keeping the place the position rule gave it. So the
// position rule decides where the courses sit among the institutions, and the
// dates decide only where work falls among them. Entries are read through
// `startOf`, which lets the pages pass collection entries and the scripts and
// tests pass the parsed files.
export type JourneyItem<Education, Experience> = TimelineItem<Education> | { kind: 'experience'; entry: Experience };

export function journey<Education, Experience, Course extends { date?: string | number }>(
  education: Education[],
  experience: Experience[],
  courses: Course[],
  startOf: (entry: Education | Experience) => string | number,
): JourneyItem<Education, Experience>[] {
  const items: JourneyItem<Education, Experience>[] = educationTimeline(education, courses);
  const start = (item: JourneyItem<Education, Experience>) =>
    item.kind === 'courses' ? item.period?.start : String(startOf(item.entry));

  const byStart = [...experience].sort((a, b) => {
    const [x, y] = [String(startOf(a)), String(startOf(b))];
    return x < y ? -1 : x > y ? 1 : 0;
  });
  for (const entry of byStart) {
    const begins = String(startOf(entry));
    let at = 0;
    items.forEach((item, index) => {
      const itemStart = start(item);
      if (itemStart !== undefined && itemStart <= begins) at = index + 1;
    });
    items.splice(at, 0, { kind: 'experience', entry });
  }
  return items.reverse();
}
