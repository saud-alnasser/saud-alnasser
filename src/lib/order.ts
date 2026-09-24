// How the collections are ordered wherever they are listed, so the pages, the
// CV, and the resume endpoint agree.

interface Dated {
  period: { start: string };
}

interface Ordered {
  order?: number;
}

// ISO dates of the form YYYY, YYYY-MM, or YYYY-MM-DD compare correctly as
// text once completed to a full date, and a shorter one sorts as its start:
// 2023 becomes 2023-01-01, so it sorts before 2023-09 rather than after it.
// A bare year arrives as a number from a YAML parser, so it is stringified.
function key(date: string | number): string {
  const text = String(date);
  return text.length === 4 ? `${text}-01-01` : text.length === 7 ? `${text}-01` : text;
}

export function byStartAscending<T extends Dated>(a: T, b: T): number {
  return key(a.period.start).localeCompare(key(b.period.start));
}

export function byStartDescending<T extends Dated>(a: T, b: T): number {
  return byStartAscending(b, a);
}

// Entries with an `order` come first, lowest first; the rest follow by start
// date, newest first (src/content/README.md, "projects/").
export function byOrderThenStartDescending<T extends Dated & Ordered>(a: T, b: T): number {
  if (a.order !== undefined && b.order !== undefined && a.order !== b.order) return a.order - b.order;
  if (a.order !== undefined && b.order === undefined) return -1;
  if (a.order === undefined && b.order !== undefined) return 1;
  return byStartDescending(a, b);
}

export function byOrderThenName<T extends Ordered & { name: { en: string } }>(a: T, b: T): number {
  if (a.order !== undefined && b.order !== undefined && a.order !== b.order) return a.order - b.order;
  if (a.order !== undefined && b.order === undefined) return -1;
  if (a.order === undefined && b.order !== undefined) return 1;
  return a.name.en.localeCompare(b.name.en);
}

// Undated certificates sort last.
export function byDateAscending<T extends { date?: string }>(a: T, b: T): number {
  if (a.date === undefined && b.date === undefined) return 0;
  if (a.date === undefined) return 1;
  if (b.date === undefined) return -1;
  return key(a.date).localeCompare(key(b.date));
}

// The same, newest first, and the undated still last: the order the site
// lists the certificates in.
export function byDateDescending<T extends { date?: string }>(a: T, b: T): number {
  if (a.date === undefined || b.date === undefined) return byDateAscending(a, b);
  return byDateAscending(b, a);
}
