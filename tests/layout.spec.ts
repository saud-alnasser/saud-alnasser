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
  // The content fills it, centred, rather than hugging one side or shrinking,
  // and the header shares it.
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
      expect(Math.round(header!.width), `header width on ${path}`).toBe(width);
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
