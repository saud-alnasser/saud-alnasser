import { expect, test } from '@playwright/test';
import { at, belowHeader, forwards } from './pages';

// The addresses that were pages before the portfolio became one page: each,
// followed bare or with one of the anchors it used to carry, ends on the home
// page in its own language with its section's heading in view. A refresh
// cannot carry the anchor it was followed with, so every anchor on one
// address lands on its one section (src/lib/forwards.ts). With no script, as
// a forward holds none: the refresh alone does it.

// One anchor each address used to hold below its first section, so the case
// with it shows the old anchor is dropped rather than followed.
const oldAnchors: Record<string, string> = { experience: '#projects', education: '#courses' };

// With motion allowed, so the page's entrance could be running when the
// browser scrolls to the anchor; a page opened at an anchor skips it, and
// the heading lands below the header rather than under it.
test.describe('the old addresses with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'no-preference' });

  for (const { locale, path, section } of forwards) {
    for (const anchor of ['', oldAnchors[section]!]) {
      test(`${path}${anchor} lands on #${section} of /${locale}/`, async ({ page }) => {
        await page.goto(`${path}${anchor}`);
        await page.waitForURL(`**${at(`/${locale}/`)}#${section}`);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await expect(page.locator(`main #${section}`)).toBeInViewport();
        await page.waitForTimeout(700);
        const gap = await belowHeader(page, section);
        expect(gap, `#${section} below the header`).toBeGreaterThanOrEqual(0);
        expect(gap, `#${section} below the header`).toBeLessThanOrEqual(24);
      });
    }
  }
});
