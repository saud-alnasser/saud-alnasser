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
for (const locale of ['en', 'ar'] as const) for (const route of ['/', '/work/']) {
  const page = at(`/${locale}${route}`);

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

// The two surfaces the page-wide audits see closed: a project card's folded
// badges and the footer's logo credits. Opened here, in both palettes and
// both directions.
for (const locale of ['en', 'ar'] as const) for (const route of ['/', '/work/']) {
  const page = at(`/${locale}${route}`);

  test(`the badge fold and the logo credits on ${page} meet WCAG AA open`, async ({ page: browser, colorScheme }) => {
    await browser.goto(page);
    const fold = browser.locator('[data-entry="project"] details').first();
    await fold.locator('summary').click();
    await expect(fold).toHaveAttribute('open', '');
    const credits = browser.locator('[data-logo-credits]');
    await credits.locator('summary').click();
    await expect(credits).toHaveAttribute('open', '');
    const failures = await browser.evaluate(lowContrastPairs);
    expect(failures, `${colorScheme} palette on ${page} with both open`).toEqual([]);
    if (locale === 'en') {
      const results = await new AxeBuilder({ page: browser }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(
        results.violations.map((violation) => `${violation.id}: ${violation.help}`),
        `${colorScheme} palette on ${page} with both open`,
      ).toEqual([]);
    }
  });
}

// The filter's chips, at rest and pressed: every label at AA on its own
// chip, and the pressed chip's fill at 3:1 or better against a chip at rest,
// so the pressed state does not rest on a text colour.
for (const locale of ['en', 'ar'] as const) for (const route of ['/', '/work/']) {
  const page = at(`/${locale}${route}`);

  test(`the filter chips on ${page} meet WCAG AA at rest and pressed`, async ({ page: browser, colorScheme }) => {
    await browser.goto(page);
    const chips = browser.locator('[data-filter] button');
    await chips.nth(1).click();
    await expect(chips.nth(1)).toHaveAttribute('aria-pressed', 'true');
    const failures = await browser.evaluate(lowContrastPairs);
    expect(failures, `${colorScheme} palette on ${page} with a chip pressed`).toEqual([]);
    const ratio = await browser.evaluate(() => {
      const [rest, pressed] = [
        document.querySelector('[data-filter] button[aria-pressed="false"]')!,
        document.querySelector('[data-filter] button[aria-pressed="true"]')!,
      ].map((node) => (getComputedStyle(node).backgroundColor.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number));
      const luminance = (rgb: number[]) => {
        const [r, g, b] = rgb.map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const [a, b] = [luminance(rest!), luminance(pressed!)];
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    });
    expect(ratio, `a pressed chip against one at rest on ${page}`).toBeGreaterThanOrEqual(3);
    if (locale === 'en') {
      const results = await new AxeBuilder({ page: browser }).withTags(['wcag2a', 'wcag2aa']).analyze();
      expect(results.violations.map((violation) => `${violation.id}: ${violation.help}`)).toEqual([]);
    }
  });
}

// The light behind the first screen is a gradient, which the pair measure
// above cannot see: it reads the nearest painted background colour, and the
// light is a sibling drawn behind the text. So the text colours the first
// screen uses are measured here against the page with the light at its
// strongest, its first colour stop laid over the page's background.
for (const locale of ['en', 'ar'] as const) {
  const page = at(`/${locale}/`);

  test(`the text over the first screen's light on ${page} meets WCAG AA`, async ({ page: browser, colorScheme }) => {
    await browser.goto(page);
    const found = await browser.evaluate(() => {
      const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).map(Number);
      const luminance = ([r, g, b]: number[]) => {
        const channel = (v: number) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        };
        return 0.2126 * channel(r!) + 0.7152 * channel(g!) + 0.0722 * channel(b!);
      };
      const ratio = (a: number[], b: number[]) => {
        const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
        return (light! + 0.05) / (dark! + 0.05);
      };
      const image = getComputedStyle(document.querySelector('[data-glow]')!).backgroundImage;
      const stop = image.match(/rgba?\([^)]+\)/)?.[0];
      if (!stop) return { image, pairs: [] };
      const [r, g, b, a = 1] = parse(stop);
      const page = parse(getComputedStyle(document.documentElement).backgroundColor);
      const lit = [0, 1, 2].map((index) => [r, g, b][index]! * a + page[index]! * (1 - a));
      const hero = document.querySelector('[data-hero]')!;
      const colours = new Set<string>();
      for (const node of hero.querySelectorAll('h1, p, span, a')) {
        if (node.closest('[data-stat-tile], [data-contact-actions] a')) continue;
        if ((node.textContent ?? '').trim() === '') continue;
        colours.add(getComputedStyle(node).color);
      }
      return { image, pairs: [...colours].map((colour) => ({ colour, ratio: ratio(parse(colour), lit) })) };
    });
    expect(found.pairs.length, `a colour stop read from ${found.image}`).toBeGreaterThan(0);
    for (const pair of found.pairs) {
      expect(pair.ratio, `${pair.colour} over the light, ${colorScheme} palette on ${page}`).toBeGreaterThanOrEqual(4.5);
    }
  });
}
