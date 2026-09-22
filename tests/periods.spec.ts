import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { formatPeriod } from '../src/lib/i18n';
import { isCourse, isShown, onResume } from '../src/lib/shown';
import { at, locales } from './pages';

// A period prints as years alone, wherever one is printed: the one year the
// work fell in, two years joined by a hyphen, or a year and the word for the
// present. The content keeps its months for the ordering and the JSON Resume
// documents; nothing a reader sees carries one.
//
// Two tests, because each catches what the other cannot. The first calls the
// function on the three shapes a period can take, so a wrong join or a month
// that leaks through is named against the input that produced it. The second
// reads every element that prints a period on every page that prints one, so
// a template that stopped calling the function, or formatted a date of its
// own, fails on the page it lives on. The pattern spells the two present
// words out rather than reading them from the strings, so a change to either
// is a change to this file as well.

test('a period prints as one year, two years, or a year and the present', () => {
  expect(formatPeriod('en', { start: '2024-03', end: '2024-11' })).toBe('2024');
  expect(formatPeriod('en', { start: '2023-09', end: '2025-05' })).toBe('2023-2025');
  expect(formatPeriod('en', { start: '2024-06' })).toBe('2024-Present');
  expect(formatPeriod('ar', { start: '2024-03', end: '2024-11' })).toBe('2024');
  expect(formatPeriod('ar', { start: '2023-09', end: '2025-05' })).toBe('2023-2025');
  expect(formatPeriod('ar', { start: '2024-06' })).toBe('2024-الآن');
});

const content = fileURLToPath(new URL('../src/content/', import.meta.url));

function entries(collection: string): any[] {
  const directory = path.join(content, collection);
  return readdirSync(directory)
    .filter((file) => file.endsWith('.yaml'))
    .map((file) => parseYaml(readFileSync(path.join(directory, file), 'utf8')));
}

const experience = entries('experience').length;
const education = entries('education').length;
const projects = entries('projects').filter(isShown);
// The timeline's node stands for the courses and is dated only where one
// carries a date (src/pages/[locale]/education/index.astro).
const node = entries('certificates').some((entry) => isCourse(entry) && entry.date) ? 1 : 0;

// How many periods each route prints, read from the content so that a
// template dropping its marker fails here rather than shrinking the sweep:
// the home page prints none, and the four others print one per entry they
// list (src/components/CvDocument.astro, src/lib/shown.ts).
const printing = {
  '/work/': experience + projects.length,
  '/education/': education + node,
  '/cv/': experience + education + projects.length,
  '/resume/': experience + education + projects.filter(onResume).length,
} as const;

const form = /^\d{4}(-(\d{4}|Present|الآن))?$/;

for (const locale of locales) {
  for (const [route, count] of Object.entries(printing)) {
    const url = at(`/${locale}${route}`);
    test(`${url} prints every period as years`, async ({ page }) => {
      await page.goto(url);
      const periods = page.locator('[data-period]');
      await expect(periods, `elements printing a period on ${url}`).toHaveCount(count);
      for (const text of await periods.allTextContents()) {
        expect(text.trim(), `a period on ${url}`).toMatch(form);
      }
    });
  }
}
