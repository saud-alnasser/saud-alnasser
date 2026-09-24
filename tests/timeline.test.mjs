// The order of the home page's timeline from study to work, as `journey` in
// src/lib/timeline.ts builds it: on today's content, and on a record shaped
// to catch the one decision it makes, an experience entry that starts between
// two institutions. Run by `pnpm test:content`, with Node's own test runner:
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
import { journey } from '../src/lib/timeline.ts';

const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const collection = (name) =>
  readdirSync(path.join(content, name))
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => ({ id: file.replace(/\.yaml$/, ''), ...parseYaml(readFileSync(path.join(content, name, file), 'utf8')) }));

const startOf = (entry) => entry.period.start;
const label = (item) => (item.kind === 'courses' ? 'courses' : `${item.kind}:${item.entry.id}`);

test("today's record reads newest first, work after the study it followed", () => {
  const education = collection('education').sort(byStartAscending);
  const courses = collection('certificates').filter(isCourse);
  const experience = collection('experience');
  const order = journey(education, experience, courses, startOf).map(label);

  // Every entry once, the courses as one node. The names are today's record,
  // so an entry added to it changes this line: the fixtures below hold the rule
  // itself, whatever the record holds.
  assert.equal(order.length, education.length + experience.length + (courses.length > 0 ? 1 : 0));
  assert.deepEqual(order, ['experience:al-othaim-markets', 'education:saudi-electronic-university', 'courses']);
});

test('an experience entry that starts between two institutions sits between them', () => {
  const education = [
    { id: 'school', period: { start: '2015', end: '2018' } },
    { id: 'university', period: { start: '2022', end: '2026' } },
  ];
  const experience = [
    { id: 'late', period: { start: '2026-02' } },
    { id: 'between', period: { start: '2019-06', end: '2021' } },
  ];
  const courses = [{ date: '2021-11-07' }, { date: '2021-12-24' }];
  assert.deepEqual(journey(education, experience, courses, startOf).map(label), [
    'experience:late',
    'education:university',
    'courses',
    'experience:between',
    'education:school',
  ]);
});

test('undated courses keep the place the position rule gives them', () => {
  const education = [
    { id: 'school', period: { start: '2015' } },
    { id: 'university', period: { start: '2022' } },
  ];
  const experience = [{ id: 'job', period: { start: '2016' } }];
  assert.deepEqual(journey(education, experience, [{}, {}], startOf).map(label), [
    'education:university',
    'courses',
    'experience:job',
    'education:school',
  ]);
});
