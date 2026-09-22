import { expect, test } from '@playwright/test';
import { formatPeriod } from '../src/lib/i18n';
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

const form = /^\d{4}(-(\d{4}|Present|الآن))?$/;
// The routes that print a period: the home page prints none.
const printing = ['/work/', '/education/', '/cv/', '/resume/'] as const;

for (const locale of locales) {
  for (const route of printing) {
    const url = at(`/${locale}${route}`);
    test(`${url} prints every period as years`, async ({ page }) => {
      await page.goto(url);
      const periods = page.locator('[data-period]');
      expect(await periods.count(), `elements printing a period on ${url}`).toBeGreaterThan(0);
      for (const text of await periods.allTextContents()) {
        expect(text.trim(), `a period on ${url}`).toMatch(form);
      }
    });
  }
}
