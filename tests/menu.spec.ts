import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { strings, type Locale } from '../src/lib/i18n';
import { sections as sectionIds } from '../src/lib/sections';
import { lowContrastPairs } from './contrast';
import { at, control, locales, menu, otherLocale, pageList } from './pages';

// The header's navigations. The site's own is the same links in the same
// order on every page, in the header's row on a desktop and in the phone
// menu below `lg`; the language menu opens with a click and with Enter,
// lists both languages with the current one marked, leads to the same route
// in the other language from every page, and closes on Escape and on a click
// outside. Both menus are native <details>, so with JavaScript disabled they
// still open and close and their links still work; that context also checks
// that every page's content is there without a script.

// The languages as the menu names them, in their own script.
const names = { en: 'English', ar: 'العربية' } as const;

// What a navigation holds, on any page: the five sections of the home page by
// their anchors, then the two documents as a group of their own named for
// them, each with the file icon, the resume after the CV so a reader who
// found one document finds the other.
async function expectLinks(nav: import('@playwright/test').Locator, locale: Locale) {
  const t = strings[locale];
  const home = at(`/${locale}/`);
  const sections = nav.locator('a[data-section-link]');
  await expect(sections).toHaveText(sectionIds.map((id) => t.nav[id]));
  for (const [index, id] of sectionIds.entries()) await expect(sections.nth(index)).toHaveAttribute('href', `${home}#${id}`);
  const documents = nav.getByRole('list', { name: t.nav.documents }).locator('a');
  await expect(documents).toHaveText([t.nav.cv, t.nav.resume]);
  await expect(documents.nth(0)).toHaveAttribute('href', at(`/${locale}/cv/`));
  await expect(documents.nth(1)).toHaveAttribute('href', at(`/${locale}/resume/`));
  for (const link of await documents.all()) await expect(link.locator('svg[data-icon="file-text"]')).toHaveAttribute('aria-hidden', 'true');
}

// The document being read is the one link marked as the current page, and on
// the home page no link is: there the current section is the script's to
// mark (tests/motion.spec.ts reads it in motion).
async function expectCurrent(nav: import('@playwright/test').Locator, route: string, locale: Locale) {
  const current = nav.locator('a[aria-current="page"]');
  if (route === '/') await expect(current).toHaveCount(0);
  else await expect(current).toHaveAttribute('href', at(`/${locale}${route}`));
}

test.describe('the site navigation', () => {
  for (const { locale, route, path } of pageList) {
    test(`lists the sections, then the documents, on ${path}`, async ({ page }) => {
      await page.goto(path);
      const nav = page.locator('body > header > div > nav');
      await expect(nav).toHaveAccessibleName(strings[locale].nav.label);
      await expectLinks(nav, locale);
      await expectCurrent(nav, route, locale);
    });
  }
});

// The accessibility tree's own view of the phone menu's button, which the
// browser builds for a <summary>: its role, and whether it is expanded. Read
// from Chromium rather than from Playwright's role matching, which does not
// model a <summary>.
async function menuButton(page: Page, name: string) {
  const cdp = await page.context().newCDPSession(page);
  const { nodes } = (await cdp.send('Accessibility.getFullAXTree')) as {
    nodes: { role?: { value: string }; name?: { value: string }; properties?: { name: string; value: { value: unknown } }[] }[];
  };
  await cdp.detach();
  return nodes
    .filter((node) => node.name?.value === name && node.role?.value === 'DisclosureTriangle')
    .map((node) => ({ expanded: node.properties?.find((property) => property.name === 'expanded')?.value.value }));
}

// The header on a phone: one row of the name, the two controls, and the menu
// button, which opens a panel of the same links the desktop row holds.
test.describe('the phone menu at 360 by 740', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const locale of locales) {
    const t = strings[locale];

    test(`/${locale}/ keeps the name, the two controls, and the menu button on one row`, async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('body > header > div > nav')).toBeHidden();
      const parts = ['body > header > div > a', menu, control, '[data-site-menu] > summary'];
      const boxes = await Promise.all(parts.map(async (part) => (await page.locator(part).boundingBox())!));
      const centres = boxes.map((box) => box.y + box.height / 2);
      for (const [index, centre] of centres.entries()) expect(Math.abs(centre - centres[0]!), `${parts[index]} on the name's row`).toBeLessThanOrEqual(6);
      const header = (await page.locator('body > header').boundingBox())!;
      expect(header.height, 'one row').toBeLessThanOrEqual(58);
    });

    test(`/${locale}/ names the menu button and exposes whether it is open`, async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const details = page.locator('[data-site-menu]');
      const summary = details.locator('summary');
      await expect(summary).toHaveAccessibleName(t.nav.menu);
      await expect(summary.locator('svg[data-icon="menu"]')).toBeVisible();
      expect(await menuButton(page, t.nav.menu)).toEqual([{ expanded: false }]);
      await summary.click();
      await expect(details).toHaveAttribute('open', '');
      expect(await menuButton(page, t.nav.menu)).toEqual([{ expanded: true }]);
      await expect(summary.locator('svg[data-icon="x"]')).toBeVisible();
      await expectLinks(details.locator('nav'), locale);
      for (const link of await details.locator('nav a').all()) await expect(link).toBeVisible();
    });

    for (const route of ['/', '/cv/'] as const) {
      test(`/${locale}${route} meets the contrast criterion with the menu open`, async ({ page, colorScheme }) => {
        await page.goto(at(`/${locale}${route}`));
        await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
        await page.locator('[data-site-menu] summary').click();
        await expectCurrent(page.locator('[data-site-menu] nav'), route, locale);
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        const found = results.violations.map((violation) => `${violation.id}: ${violation.help}`);
        expect(found, `${colorScheme} palette with the menu open`).toEqual([]);
        expect(await page.evaluate(lowContrastPairs), `${colorScheme} palette with the menu open`).toEqual([]);
        // Every link in the panel is a target of at least 24 by 24.
        for (const box of await page.locator('[data-site-menu] nav a').evaluateAll((links) => links.map((link) => link.getBoundingClientRect().toJSON()))) {
          expect(box.width).toBeGreaterThanOrEqual(24);
          expect(box.height).toBeGreaterThanOrEqual(24);
        }
      });
    }
  }
});

test.describe('the phone menu with JavaScript disabled', () => {
  test.use({ viewport: { width: 360, height: 740 }, javaScriptEnabled: false });

  for (const locale of locales) {
    test(`/${locale}/ opens, closes, and leads to a section and a document`, async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const details = page.locator('[data-site-menu]');
      const summary = details.locator('summary');
      await summary.click();
      await expect(details).toHaveAttribute('open', '');
      await expect(details.locator('a[data-section-link="projects"]')).toBeVisible();
      await summary.click();
      await expect(details).not.toHaveAttribute('open');

      await summary.click();
      await details.locator('a[data-section-link="projects"]').click();
      await expect(page).toHaveURL(`${at(`/${locale}/`)}#projects`);
      await expect(page.locator('#projects')).toBeInViewport();

      await details.getByRole('link', { name: strings[locale].nav.resume }).click();
      await expect(page).toHaveURL(at(`/${locale}/resume/`));
    });
  }
});

test.describe('the language menu', () => {
  test('carries an icon and a name, and opens with a click', async ({ page }) => {
    await page.goto(at('/en/'));
    const details = page.locator(menu);
    const summary = details.locator('summary');
    await expect(details).not.toHaveAttribute('open');
    await expect(summary.locator('svg')).not.toHaveCount(0);
    await expect(summary).toHaveAccessibleName(/Language/);
    await expect(page.locator(control).locator('svg')).not.toHaveCount(0);

    await summary.click();
    await expect(details).toHaveAttribute('open', '');
    const items = details.locator('ul a');
    await expect(items).toHaveText([names.en, names.ar]);
    await expect(items.nth(0)).toHaveAttribute('aria-current', 'page');
    await expect(items.nth(1)).not.toHaveAttribute('aria-current');
    await expect(items.nth(1)).toHaveAttribute('href', at('/ar/'));
  });

  test('opens with Enter', async ({ page }) => {
    await page.goto(at('/en/'));
    const details = page.locator(menu);
    await details.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(details).toHaveAttribute('open', '');
    await expect(details.locator('ul a')).toHaveCount(2);
  });

  test('closes on Escape and returns focus to the control', async ({ page }) => {
    await page.goto(at('/en/'));
    const details = page.locator(menu);
    const summary = details.locator('summary');
    await summary.click();
    await expect(details).toHaveAttribute('open', '');
    await page.keyboard.press('Escape');
    await expect(details).not.toHaveAttribute('open');
    await expect(summary).toBeFocused();
  });

  test('closes on a click outside', async ({ page }) => {
    await page.goto(at('/en/'));
    const details = page.locator(menu);
    await details.locator('summary').click();
    await expect(details).toHaveAttribute('open', '');
    await page.locator('main h1').click();
    await expect(details).not.toHaveAttribute('open');
  });

  test('stays open on a click inside', async ({ page }) => {
    // So the dismissal does not swallow a click on the list itself.
    await page.goto(at('/en/'));
    const details = page.locator(menu);
    await details.locator('summary').click();
    await details.locator('ul').click({ position: { x: 2, y: 2 } });
    await expect(details).toHaveAttribute('open', '');
  });

  test('meets the contrast criterion open', async ({ page, colorScheme }) => {
    // The contrast tests audit every page with the menu closed; this is the
    // one surface they cannot see.
    await page.goto(at('/en/'));
    await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
    await page.locator(menu).locator('summary').click();
    const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const found = results.violations.map((violation) => `${violation.id}: ${violation.help}`);
    expect(found, `${colorScheme} palette with the menu open`).toEqual([]);
    expect(await page.evaluate(lowContrastPairs), `${colorScheme} palette with the menu open`).toEqual([]);
  });

  test('sits at the start of the header in Arabic', async ({ page }) => {
    // The header mirrors: the controls, at the end of the row, sit on the
    // left of the page in Arabic and on the right in English.
    await page.goto(at('/ar/'));
    const brand = await page.locator('body > header a').first().boundingBox();
    const menuBox = await page.locator(menu).boundingBox();
    expect(menuBox!.x, 'the menu is left of the name on the Arabic page').toBeLessThan(brand!.x);

    await page.goto(at('/en/'));
    const brandEn = await page.locator('body > header a').first().boundingBox();
    const menuEn = await page.locator(menu).boundingBox();
    expect(menuEn!.x, 'the menu is right of the name on the English page').toBeGreaterThan(brandEn!.x);
  });

  for (const { locale, route, path } of pageList) {
    const other = otherLocale(locale);
    test(`leads from ${path} to the same route in ${other}`, async ({ page }) => {
      await page.goto(path);
      const details = page.locator(menu);
      await details.locator('summary').click();
      const current = details.locator('ul a[aria-current="page"]');
      await expect(current).toHaveText(names[locale]);
      await details.locator('ul a').filter({ hasText: names[other] }).click();
      await expect(page).toHaveURL(new RegExp(`${at(`/${other}${route}`).replace(/\//g, '\\/')}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', other);
    });
  }
});

test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  for (const { locale, route, path } of pageList) {
    const other = otherLocale(locale);
    test(`${path} shows its content and reaches ${other} through the list`, async ({ page }) => {
      await page.goto(path);
      const text = (await page.locator('main').innerText()).trim();
      expect(text.length, `main text on ${path}`).toBeGreaterThan(0);

      const details = page.locator(menu);
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      await details.locator('ul a').filter({ hasText: names[other] }).click();
      await expect(page).toHaveURL(new RegExp(`${at(`/${other}${route}`).replace(/\//g, '\\/')}$`));
      await expect(page.locator('html')).toHaveAttribute('lang', other);
    });
  }
});

// With the script, the phone menu closes the way the language menu does, and
// on a link press as well: the panel would otherwise stay over the section it
// just led to.
test.describe('the phone menu closing at 360 by 740', () => {
  test.use({ viewport: { width: 360, height: 740 } });

  for (const locale of locales) {
    const t = strings[locale];
    const open = async (page: Page) => {
      await page.goto(at(`/${locale}/`));
      const details = page.locator('[data-site-menu]');
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      return details;
    };

    test(`/${locale}/ closes on a link press`, async ({ page }) => {
      const details = await open(page);
      await details.locator('a[data-section-link="education"]').click();
      await expect(details).not.toHaveAttribute('open');
      await expect(page).toHaveURL(new RegExp('#education$'));
    });

    test(`/${locale}/ closes on Escape and returns focus to the button`, async ({ page }) => {
      const details = await open(page);
      await page.keyboard.press('Escape');
      await expect(details).not.toHaveAttribute('open');
      await expect(details.locator('summary')).toBeFocused();
      await expect(details.locator('summary')).toHaveAccessibleName(t.nav.menu);
    });

    test(`/${locale}/ closes on a press outside`, async ({ page }) => {
      const details = await open(page);
      await page.mouse.click(180, 700);
      await expect(details).not.toHaveAttribute('open');
    });

    test(`/${locale}/ keeps the language menu closing the same way`, async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const language = page.locator(menu);
      await language.locator('summary').click();
      await expect(language).toHaveAttribute('open', '');
      await page.keyboard.press('Escape');
      await expect(language).not.toHaveAttribute('open');
      await expect(language.locator('summary')).toBeFocused();
      // Opening one menu closes the other.
      await language.locator('summary').click();
      await page.locator('[data-site-menu] summary').click();
      await expect(language).not.toHaveAttribute('open');
      await expect(page.locator('[data-site-menu]')).toHaveAttribute('open', '');
    });
  }
});
