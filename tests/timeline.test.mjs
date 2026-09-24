// The order src/lib/timeline.ts decides: the education timeline every output
// reads, newest first with the online-courses node after the most recent
// institution. On today's content, and on a record shaped to catch the one
// decision it makes, where the node falls between two institutions. Run by
// `pnpm test:content`, with Node's own test runner:
//
//   node --test tests/timeline.test.mjs

import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
// Node strips the types on import, as scripts/check-dist.mjs relies on.
import { byStartAscending } from '../src/lib/order.ts';
import { isCourse } from '../src/lib/shown.ts';
import { educationTimeline } from '../src/lib/timeline.ts';

const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const collection = (name) =>
  readdirSync(path.join(content, name))
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => ({ id: file.replace(/\.yaml$/, ''), ...parseYaml(readFileSync(path.join(content, name, file), 'utf8')) }));

const label = (item) => (item.kind === 'courses' ? 'courses' : `${item.kind}:${item.entry.id}`);

test("today's education reads newest first, the university and then the online courses", () => {
  const education = collection('education').sort(byStartAscending);
  const courses = collection('certificates').filter(isCourse);
  assert.deepEqual(educationTimeline(education, courses).map(label), [
    'education:saudi-electronic-university',
    'courses',
  ]);
});

test('the online-courses node sits between the newer institution and the older one', () => {
  const education = [
    { id: 'school', period: { start: '2015', end: '2018' } },
    { id: 'university', period: { start: '2022', end: '2026' } },
  ];
  // The node keeps its place by position, whatever the courses' dates say:
  // one dated after the university began, and one undated.
  const courses = [{ date: '2023-05' }, {}];
  const timeline = educationTimeline(education, courses);
  assert.deepEqual(timeline.map(label), ['education:university', 'courses', 'education:school']);
  assert.deepEqual(timeline[1], { kind: 'courses', count: 2, period: { start: '2023-05', end: '2023-05' } });
});

test('with no courses the timeline is the institutions alone, newest first', () => {
  const education = [
    { id: 'school', period: { start: '2015' } },
    { id: 'university', period: { start: '2022' } },
  ];
  assert.deepEqual(educationTimeline(education, []).map(label), ['education:university', 'education:school']);
});
