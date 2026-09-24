import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { lowContrastPairs } from './contrast';
import { at, pages } from './pages';

// Every text and background pair meets WCAG AA contrast, in both palettes, on
// every page. The project decides the colour scheme, so each test runs once
// per palette.
//
// Two measurements, because one is not enough. axe runs the whole WCAG 2 A
// and AA rule set, contrast included. On the Arabic pages, though, axe's
// `color-contrast` rule matches nothing: its icon-ligature heuristic draws
// the first letter of a text alone and then the whole text, and joined
// Arabic differs from its isolated letters in both pixels and width, so
// after three samples axe treats the font as an icon font and skips every
// text node in it (axe-core 4.13, `isIconLigature`; it is not an option of
// the rule). So every pair is also measured directly, from the computed
// colours, with the WCAG formula, on every page in both palettes. The direct
// measurement is what asserts the Arabic pages; axe is what asserts the
// English ones twice over.

const audited = pages;

for (const page of audited) {
  test(`axe finds no violation on ${page}`, async ({ page: browser, colorScheme }) => {
    await browser.goto(page);
    // axe reads colours once nothing is moving. The shared options ask for
    // reduced motion, so this finds nothing running today.
    await browser.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    const results = await new AxeBuilder({ page: browser }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const found = results.violations.map((violation) => {
      const nodes = violation.nodes.map((node) => node.target.join(' ')).join(', ');
      return `${violation.id} (${violation.impact}): ${violation.help} at ${nodes}`;
    });
    expect(found, `${colorScheme} palette on ${page}`).toEqual([]);

    // The contrast rule ran, or, on an Arabic page, was skipped for the
    // reason above and nothing else. A page it skips for a new reason fails.
    const ran = results.passes.some((rule) => rule.id === 'color-contrast');
    const skipped = results.inapplicable.some((rule) => rule.id === 'color-contrast');
    const arabic = page.startsWith(at('/ar/'));
    expect(ran || (arabic && skipped), `axe's contrast rule ran on ${page}, or skipped an Arabic page`).toBe(true);
  });

  test(`every text and background pair on ${page} meets WCAG AA`, async ({ page: browser, colorScheme }) => {
    await browser.goto(page);
    await browser.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    const failures = await browser.evaluate(lowContrastPairs);
    expect(failures, `${colorScheme} palette on ${page}`).toEqual([]);
  });
}

// A card being pointed at or focused is a card raised: the higher shadow and
// the accent on its border. The shadow sits outside the surface the text is
// on, so the pairs should not move; measured in both palettes and both
// directions all the same, with the card held in the raised state.
for (const locale of ['en', 'ar'] as const) {
  const page = at(`/${locale}/work/`);

  test(`a raised card on ${page} meets WCAG AA`, async ({ page: browser, colorScheme }) => {
    await browser.goto(page);
    const card = browser.locator('[data-entry="project"]').first();
    await card.hover();
    expect(await card.evaluate((node) => getComputedStyle(node).boxShadow), 'the card is raised').toContain('24px');
    const failures = await browser.evaluate(lowContrastPairs);
    expect(failures, `${colorScheme} palette on ${page} with a card raised`).toEqual([]);
    if (locale === 'en') {
      const results = await new AxeBuilder({ page: browser }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        results.violations.map((violation) => `${violation.id}: ${violation.help}`),
        `${colorScheme} palette on ${page} with a card raised`,
      ).toEqual([]);
    }
  });
}
