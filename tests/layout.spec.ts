import { expect, test } from '@playwright/test';
import { at, pageList, pages } from './pages';

// The layout on a phone, on a desktop, and under reduced motion: no
// horizontal scrolling at 360 pixels on any page, the content column at the
// width its route declares at 1440, centred, and nothing animates when the
// visitor asked for reduced motion.

test.describe('at 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const page of pages) {
    test(`${page} does not scroll horizontally`, async ({ page: browser }) => {
      await browser.goto(page);
      await browser.evaluate(() => document.fonts.ready);
      const width = await browser.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `scrollWidth of ${page}`).toBeLessThanOrEqual(360);
    });
  }
});

test.describe('at 1440 pixels wide', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  // Each route declares its column in tests/pages.ts: 64rem for the pages
  // that lay cards in a grid, 48rem for the CV, which reads as a document.
  // The content fills it, centred, rather than hugging one side or shrinking.
  // The header spans the page, and its row is 64rem on every page, centred
  // the same way, since the whole row needs more than 48rem.
  for (const { path, width } of pageList) {
    test(`${path} fills a ${width} pixel column`, async ({ page: browser }) => {
      await browser.goto(path);
      const box = await browser.locator('main').boundingBox();
      expect(box, `main on ${path}`).not.toBeNull();
      expect(Math.round(box!.width), `main width on ${path}`).toBe(width);
      const left = box!.x;
      const right = 1440 - (box!.x + box!.width);
      expect(Math.abs(left - right), `main centred on ${path}`).toBeLessThanOrEqual(1);
      const header = await browser.locator('body > header').boundingBox();
      expect(Math.round(header!.width), `header width on ${path}`).toBe(1440);
      const row = await browser.locator('body > header > div').boundingBox();
      expect(Math.round(row!.width), `header row width on ${path}`).toBe(1024);
      expect(Math.abs(row!.x - (1440 - row!.x - row!.width)), `header row centred on ${path}`).toBeLessThanOrEqual(1);
    });
  }
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  // Every page, because the entrance runs on every page's main and a card
  // page carries transitions of its own.
  for (const path of pages) {
    test(`nothing animates on ${path}`, async ({ page }) => {
      await page.goto(path);
      const animations = await page.evaluate(() =>
        document.getAnimations().map((animation) => {
          const effect = animation.effect as KeyframeEffect | null;
          const target = effect?.target as Element | null;
          return `${target?.tagName.toLowerCase() ?? '?'}: ${(animation as CSSAnimation).animationName ?? animation.id}`;
        }),
      );
      expect(animations, `animations on ${path}`).toEqual([]);
    });
  }

  test('the reveal runs when motion is not reduced', async ({ browser }) => {
    // The opposite case, so the test above cannot pass because the animation
    // never existed.
    const context = await browser.newContext({ reducedMotion: 'no-preference', baseURL: test.info().project.use.baseURL });
    const page = await context.newPage();
    await page.goto(at('/en/'));
    const count = await page.evaluate(() => document.getAnimations().length);
    await context.close();
    expect(count).toBeGreaterThan(0);
  });
});

// The header: one row at every width, the sections and the documents in it
// from `lg` and behind the phone menu below. The current page is marked by a
// bar as well as by `aria-current`, and every target is at least 24 pixels
// each way.

// Every visible link, button, and summary in the header, with its box.
const headerTargets = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    [...document.querySelectorAll('body > header :is(a, button, summary)')]
      .filter((node) => (node as HTMLElement).offsetParent !== null || getComputedStyle(node).position === 'fixed')
      .filter((node) => !node.closest('details:not([open]) > :not(summary)'))
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { name: (node.textContent ?? '').trim().slice(0, 20), x: box.x, y: box.y, width: box.width, height: box.height };
      }),
  );

// The rows the targets fall into, by their vertical centres.
const rowsOf = (boxes: { y: number; height: number }[]) => {
  const centres = boxes.map((box) => box.y + box.height / 2).sort((a, b) => a - b);
  const rows: number[] = [];
  for (const centre of centres) if (!rows.some((row) => Math.abs(row - centre) <= 6)) rows.push(centre);
  return rows.length;
};

test.describe('the header at 360 pixels', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const { path } of pageList) {
    test(`${path} lays the header in one row`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const targets = await headerTargets(page);
      expect(rowsOf(targets), `the header's rows on ${path}`).toBe(1);
      for (const target of targets) {
        expect(target.width, `${target.name} width on ${path}`).toBeGreaterThanOrEqual(24);
        expect(target.height, `${target.name} height on ${path}`).toBeGreaterThanOrEqual(24);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `scrollWidth of ${path}`).toBeLessThanOrEqual(360);
    });
  }

  // The controls, the menu button last, close the row: at its right end in
  // English and its left end in Arabic, level with the name.
  for (const locale of ['en', 'ar'] as const) {
    test(`the controls end the row in ${locale}`, async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const row = (await page.locator('body > header > div').boundingBox())!;
      const name = (await page.locator('body > header > div > a').boundingBox())!;
      const controls = (await page.locator('body > header > div > ul').boundingBox())!;
      const button = (await page.locator('[data-site-menu] > summary').boundingBox())!;
      const padding = 24;
      expect(Math.abs(controls.y + controls.height / 2 - (name.y + name.height / 2)), 'level with the name').toBeLessThanOrEqual(6);
      if (locale === 'ar') {
        expect(Math.abs(controls.x - (row.x + padding)), 'at the left end').toBeLessThanOrEqual(1);
        expect(button.x, 'the menu button last').toBeLessThanOrEqual(controls.x + 1);
      } else {
        expect(Math.abs(controls.x + controls.width - (row.x + row.width - padding)), 'at the right end').toBeLessThanOrEqual(1);
        expect(button.x + button.width, 'the menu button last').toBeGreaterThanOrEqual(controls.x + controls.width - 1);
      }
    });
  }
});

test.describe('the header at 1440 pixels', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const { path } of pageList) {
    test(`${path} lays the header in one row`, async ({ page }) => {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      const targets = await headerTargets(page);
      expect(rowsOf(targets), `the header's rows on ${path}`).toBe(1);
      for (const target of targets) {
        expect(target.width, `${target.name} width on ${path}`).toBeGreaterThanOrEqual(24);
        expect(target.height, `${target.name} height on ${path}`).toBeGreaterThanOrEqual(24);
      }
    });
  }
});

// The current page's bar: a document's own link carries `aria-current`, and
// under it a bar that is a painted box rather than a text colour, in the
// accent, at 3:1 or better against the page in either palette. The home page
// has no page link of its own; its current section is the script's
// (tests/motion.spec.ts), and the same bar marks it.
for (const { path, route } of pageList.filter(({ route }) => route !== '/')) {
  test(`${path} marks its own link with aria-current and a bar`, async ({ page }) => {
    await page.goto(path);
    const current = page.locator('body > header > div > nav a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveAttribute('href', new RegExp(`${route}$`));
    const bar = await current.evaluate((link) => {
      const style = getComputedStyle(link, '::after');
      return { content: style.content, height: Number.parseFloat(style.height), width: Number.parseFloat(style.width), colour: style.backgroundColor };
    });
    expect(bar.content, 'the bar is drawn').not.toBe('none');
    expect(bar.height, 'the bar has height').toBeGreaterThanOrEqual(2);
    expect(bar.width, 'the bar spans the link').toBeGreaterThan(0);
    const ratio = await page.evaluate((colour) => {
      const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
      const luminance = (rgb: number[]) => {
        const [r, g, b] = rgb.map((v) => {
          const c = v / 255;
          return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
        });
        return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
      };
      const a = luminance(parse(colour));
      const b = luminance(parse(getComputedStyle(document.documentElement).backgroundColor));
      return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
    }, bar.colour);
    expect(ratio, `the bar against the page on ${path}`).toBeGreaterThanOrEqual(3);
  });
}
