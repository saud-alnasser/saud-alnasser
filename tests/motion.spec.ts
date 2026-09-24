import { expect, test, type Page } from '@playwright/test';
import { at, pages } from './pages';

// The site's motion, held to the spec's range. Every other suite reads a
// settled page, because the shared options ask for reduced motion
// (playwright.config.ts); these ask for motion back, and then check it three
// ways: nothing that moves runs shorter than 100ms or longer than 400ms,
// nothing moves at all where it is not allowed to, and the entrance never
// holds the page's largest text back from being painted.

const settled = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));

// Every duration the page could move on: each running animation's, and each
// element's computed transition and animation durations, with the fold's
// content and the dialog's backdrop included, since those two pseudo-elements
// carry transitions of their own. Zero is left out, because it is what an
// element that moves on nothing computes. Delays are not durations and are
// not read.
function durations(): string[] {
  const found: string[] = [];
  const seconds = (value: string) =>
    value
      .split(',')
      .map((part) => part.trim())
      .map((part) => (part.endsWith('ms') ? Number.parseFloat(part) : Number.parseFloat(part) * 1000));
  const describe = (element: Element) =>
    `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.className && typeof element.className === 'string' ? `.${element.className.split(/\s+/)[0]}` : ''}`;

  for (const animation of document.getAnimations()) {
    const duration = Number(animation.effect?.getComputedTiming().duration ?? 0);
    const target = (animation.effect as KeyframeEffect | null)?.target;
    found.push(`${duration} animation on ${target ? describe(target) : '?'}`);
  }
  for (const element of document.querySelectorAll('*')) {
    const sources: [string, CSSStyleDeclaration][] = [['', getComputedStyle(element)]];
    if (element.localName === 'details') sources.push(['::details-content', getComputedStyle(element, '::details-content')]);
    if (element.localName === 'dialog') sources.push(['::backdrop', getComputedStyle(element, '::backdrop')]);
    for (const [pseudo, style] of sources) {
      for (const duration of seconds(style.transitionDuration)) found.push(`${duration} transition on ${describe(element)}${pseudo}`);
      if (style.animationName !== 'none')
        for (const duration of seconds(style.animationDuration)) found.push(`${duration} animation on ${describe(element)}${pseudo}`);
    }
  }
  return found.filter((line) => Number.parseFloat(line) !== 0);
}

const outOfRange = (lines: string[]) =>
  lines.filter((line) => {
    const duration = Number.parseFloat(line);
    return !(duration >= 100 && duration <= 400);
  });

test.describe('with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const path of pages) {
    test(`every duration on ${path} is between 100 and 400ms`, async ({ page }) => {
      await page.goto(path);
      const lines = await page.evaluate(durations);
      expect(lines.length, `something moves on ${path}`).toBeGreaterThan(0);
      expect(outOfRange(lines), `durations on ${path}`).toEqual([]);
    });

    // The largest element painted is what the first impression is scored
    // on, and an element held at low opacity is not painted as far as that
    // measure goes. So neither it nor anything around it may start its
    // entrance below full opacity.
    test(`the largest text on ${path} never enters faded`, async ({ page }) => {
      await page.goto(path);
      await settled(page);
      const faded = await page.evaluate(
        () =>
          new Promise<string[]>((resolve) => {
            new PerformanceObserver((list) => {
              const entries = list.getEntries() as (PerformanceEntry & { element: Element | null })[];
              const element = entries.at(-1)?.element ?? null;
              const found: string[] = [];
              for (let node = element; node; node = node.parentElement) {
                for (const animation of node.getAnimations()) {
                  const first = (animation.effect as KeyframeEffect).getKeyframes()[0];
                  if (first && first.opacity !== undefined && Number(first.opacity) < 1)
                    found.push(`${node.tagName.toLowerCase()} starts at opacity ${first.opacity}`);
                }
              }
              resolve(element ? found : ['no largest-contentful-paint element']);
            }).observe({ type: 'largest-contentful-paint', buffered: true });
          }),
      );
      expect(faded, `the largest-contentful-paint element on ${path} and its ancestors`).toEqual([]);
    });
  }

  // The page entrance: each child of main enters 60ms after the one before,
  // and the last is settled within 700ms of the first.
  test('the page enters in a stagger that ends within 700ms', async ({ page }) => {
    await page.goto(at('/en/'));
    const timings = await page.evaluate(() =>
      [...document.querySelectorAll('main > *')].map((child) => {
        const [animation] = child.getAnimations();
        const timing = animation?.effect?.getComputedTiming();
        return timing ? Number(timing.delay) + Number(timing.duration) : null;
      }),
    );
    expect(timings.every((end) => end !== null), 'every child of main enters').toBe(true);
    const ends = timings as number[];
    expect(ends[1]! - ends[0]!, 'one step').toBe(60);
    expect(Math.max(...ends), 'the last child settles').toBeLessThanOrEqual(700);
  });

  // The crossfade between pages, and the header held still across it, are
  // declared where only a visitor who allows motion reads them.
  test('the page crossfade is declared for no-preference only, at 250ms', async ({ page }) => {
    await page.goto(at('/en/'));
    const found = await page.evaluate(() => {
      const result = { transition: [] as string[], group: [] as string[], header: [] as string[] };
      const walk = (rules: CSSRuleList, allowed: boolean) => {
        for (const rule of rules) {
          const inside =
            allowed || (rule instanceof CSSMediaRule && /prefers-reduced-motion:\s*no-preference/.test(rule.conditionText));
          if (rule.constructor.name === 'CSSViewTransitionRule') result.transition.push(`${inside}`);
          if (rule instanceof CSSStyleRule) {
            if (rule.selectorText.includes('::view-transition-group(root)'))
              result.group.push(`${inside} ${rule.style.animationDuration}`);
            if (rule.style.viewTransitionName) result.header.push(`${inside} ${rule.style.viewTransitionName}`);
          }
          if ('cssRules' in rule) walk((rule as CSSGroupingRule).cssRules, inside);
        }
      };
      for (const sheet of document.styleSheets) walk(sheet.cssRules, false);
      return result;
    });
    expect(found).toEqual({
      transition: ['true'],
      group: ['true var(--duration-medium)'],
      header: ['true site-header'],
    });
    const medium = await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--duration-medium'));
    expect(medium.endsWith('ms') ? Number.parseFloat(medium) : Number.parseFloat(medium) * 1000, '--duration-medium').toBe(250);
  });

  // A card rises when it is pointed at or holds focus: the higher shadow and
  // a 2px lift, measured against the same card at rest.
  test('a card rises on hover and on focus', async ({ page }) => {
    const style = (selector: string) =>
      page.locator(selector).evaluate((node) => {
        const computed = getComputedStyle(node);
        return { shadow: computed.boxShadow, translate: computed.translate, transform: computed.transform };
      });

    await page.goto(at('/en/work/'));
    await settled(page);
    const project = '[data-entry="project"] >> nth=0';
    await page.locator(project).scrollIntoViewIfNeeded();
    const rest = await style(project);
    await page.locator(project).hover();
    await settled(page);
    const hovered = await style(project);
    expect(hovered.shadow, 'the shadow on hover').not.toBe(rest.shadow);
    expect(rest.translate, 'at rest').toBe('none');
    expect(hovered.translate, 'the lift on hover').toBe('0px -2px');

    await page.goto(at('/en/'));
    await settled(page);
    const card = '[data-section-card] >> nth=0';
    const before = await style(card);
    await page.locator(card).focus();
    await settled(page);
    const focused = await style(card);
    expect(focused.shadow, 'the shadow on focus').not.toBe(before.shadow);
    expect(focused.translate, 'the lift on focus').toBe('0px -2px');
  });

  // A fold and a dialog open and close in place: the address and the scroll
  // position are what they were.
  test('a fold opens and closes in place', async ({ page }) => {
    await page.goto(at('/en/work/'));
    await settled(page);
    const summary = page.locator('[data-entry="experience"] details summary').first();
    await summary.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({ href: location.href, y: scrollY }));
    await summary.click();
    await expect(page.locator('[data-entry="experience"] details').first()).toHaveAttribute('open', '');
    await settled(page);
    expect(await page.evaluate(() => ({ href: location.href, y: scrollY })), 'open').toEqual(before);
    await summary.click();
    await settled(page);
    expect(await page.evaluate(() => ({ href: location.href, y: scrollY })), 'closed').toEqual(before);
  });

  test('the certificate dialog opens and closes in place', async ({ page }) => {
    await page.goto(at('/en/education/'));
    await settled(page);
    const card = page.locator('[data-document]').first();
    await card.scrollIntoViewIfNeeded();
    const before = await page.evaluate(() => ({ href: location.href, y: scrollY }));
    await card.click();
    await expect(page.locator('[data-certificate-dialog]')).toHaveAttribute('open', '');
    await settled(page);
    expect(await page.evaluate(() => ({ href: location.href, y: scrollY })), 'open').toEqual(before);
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-certificate-dialog]')).not.toHaveAttribute('open');
    await settled(page);
    expect(await page.evaluate(() => ({ href: location.href, y: scrollY })), 'closed').toEqual(before);
  });
});

test.describe('with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  for (const path of pages) {
    test(`nothing moves on ${path} and everything is fully shown`, async ({ page }) => {
      await page.goto(path);
      expect(await page.evaluate(() => document.getAnimations().length), `animations on ${path}`).toBe(0);
      const faded = await page.evaluate(() =>
        [...document.querySelectorAll('*')]
          .filter((element) => getComputedStyle(element).opacity !== '1')
          .map((element) => element.tagName.toLowerCase()),
      );
      expect(faded, `elements below opacity 1 on ${path}`).toEqual([]);
      expect(await page.evaluate(durations), `durations on ${path}`).toEqual([]);
    });
  }

  // Every rule in the stylesheet that animates or transitions anything sits
  // inside a no-preference query, which is what motion-safe: compiles to.
  // The one kind of rule allowed outside is one that turns motion off.
  test('every rule that moves anything is inside a no-preference query', async ({ page }) => {
    await page.goto(at('/en/'));
    const outside = await page.evaluate(() => {
      const found: string[] = [];
      const moves = (style: CSSStyleDeclaration) =>
        (style.animationName && style.animationName !== 'none') ||
        (style.transitionProperty && style.transitionProperty !== 'none' && style.transitionDuration !== '0s') ||
        (style.transitionDuration && style.transitionDuration !== '0s');
      const walk = (rules: CSSRuleList, allowed: boolean, selector: string) => {
        for (const rule of rules) {
          const inside =
            allowed || (rule instanceof CSSMediaRule && /prefers-reduced-motion:\s*no-preference/.test(rule.conditionText));
          const own = rule instanceof CSSStyleRule ? rule.selectorText : selector;
          if ((rule instanceof CSSStyleRule || rule.constructor.name === 'CSSNestedDeclarations') && !inside) {
            const style = (rule as CSSStyleRule).style;
            if (moves(style)) found.push(`${own} { ${style.cssText} }`);
          }
          if (rule.constructor.name === 'CSSViewTransitionRule' && !inside) found.push('@view-transition');
          if ('cssRules' in rule && !(rule instanceof CSSKeyframesRule)) walk((rule as CSSGroupingRule).cssRules, inside, own);
        }
      };
      for (const sheet of document.styleSheets) walk(sheet.cssRules, false, '');
      return found;
    });
    expect(outside).toEqual([]);
  });
});
