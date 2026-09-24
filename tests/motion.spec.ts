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
  // and the last is settled within 700ms of the first. On the home page the
  // first screen is one block that stays still while its own children step
  // in, so those are what is read there.
  test('the page enters in a stagger that ends within 700ms', async ({ page }) => {
    await page.goto(at('/en/'));
    expect(await page.locator('main > [data-hero]').evaluate((node) => node.getAnimations().length), 'the block itself').toBe(0);
    const timings = await page.evaluate(() =>
      [...document.querySelectorAll('main > :not([data-hero]), [data-hero] > *')].map((child) => {
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
            if (rule.selectorText.includes('::view-transition-group(*)'))
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

    await page.goto(at('/en/'));
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
    const card = '[data-courses-node]';
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
    await page.goto(at('/en/'));
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
    await page.goto(at('/en/'));
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

// The reveal on scroll: what it hides it always shows again, and where it
// cannot run it hides nothing at all.
const revealPages = pages.filter((path) => /\/(en|ar)\/(work\/|education\/)?$/.test(path));

test.describe('the reveal on scroll', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const path of revealPages) {
    test(`${path} shows every revealed element once scrolled to its foot`, async ({ page }) => {
      await page.goto(path);
      await settled(page);
      expect(await page.evaluate(() => document.documentElement.hasAttribute('data-reveal')), 'the reveal is on').toBe(true);
      // What is on screen at load is never hidden; it belongs to the entrance.
      // The root carries the attribute too, as the switch, so the elements are
      // looked for under the body.
      const hiddenOnScreen = await page.evaluate(() =>
        [...document.querySelectorAll('body [data-reveal]')]
          .filter((node) => node.getBoundingClientRect().top < innerHeight && !node.hasAttribute('data-revealed'))
          .map((node) => node.tagName.toLowerCase()),
      );
      expect(hiddenOnScreen, `elements on screen left hidden on ${path}`).toEqual([]);
      // A step at a time, so the observer sees every element pass.
      await page.evaluate(async () => {
        for (let y = 0; y <= document.documentElement.scrollHeight; y += innerHeight / 2) {
          scrollTo(0, y);
          await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
        }
        scrollTo(0, document.documentElement.scrollHeight);
      });
      await expect
        .poll(() =>
          page.evaluate(() =>
            [...document.querySelectorAll('body [data-reveal]')].filter((node) => getComputedStyle(node).opacity !== '1').length,
          ),
        )
        .toBe(0);
    });

    test(`${path} hides nothing without an IntersectionObserver`, async ({ page }) => {
      await page.addInitScript(() => {
        delete (window as { IntersectionObserver?: unknown }).IntersectionObserver;
      });
      await page.goto(path);
      await settled(page);
      expect(await page.evaluate(() => document.documentElement.hasAttribute('data-reveal')), 'the reveal is off').toBe(false);
      const faded = await page.evaluate(() =>
        [...document.querySelectorAll('body [data-reveal]')].filter((node) => getComputedStyle(node).opacity !== '1').length,
      );
      expect(faded, `elements below opacity 1 on ${path}`).toBe(0);
    });
  }

  // Beside it, a check that the observer has something to do: on the home
  // page there are cards below the first screen, and they start hidden.
  test('hides what is below the first screen until it scrolls in', async ({ page }) => {
    await page.goto(at('/en/'));
    const waiting = await page.evaluate(() => document.querySelectorAll('body [data-reveal]:not([data-revealed])').length);
    expect(waiting).toBeGreaterThan(0);
    const opacity = await page.locator('body [data-reveal]:not([data-revealed])').last().evaluate((node) => getComputedStyle(node).opacity);
    expect(opacity).toBe('0');
  });
});

test.describe('the reveal with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'no-preference' });

  for (const path of revealPages) {
    test(`${path} shows every revealed element`, async ({ page }) => {
      await page.goto(path);
      const marked = page.locator('body [data-reveal]');
      expect(await marked.count(), `marked elements on ${path}`).toBeGreaterThan(0);
      for (const element of await marked.all()) await expect(element).toHaveCSS('opacity', '1');
    });
  }
});

// The curves: every transition and animation that runs for any time moves on
// one of the two the stylesheet names, Material 3's standard curve for a
// change of state and its emphasized deceleration for an arrival. Read from
// each element's computed style, pseudo-elements included, as the durations
// are above; one list entry per transitioned or animated property.
test.describe('the curves with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  for (const path of pages) {
    test(`every easing on ${path} is one of the two curves`, async ({ page }) => {
      await page.goto(path);
      const found = await page.evaluate(() => {
        const allowed = ['cubic-bezier(0.2, 0, 0, 1)', 'cubic-bezier(0.05, 0.7, 0.1, 1)'];
        const split = (value: string) => value.split(/,(?![^(]*\))/).map((part) => part.trim());
        const seconds = (value: string) => (value.endsWith('ms') ? Number.parseFloat(value) : Number.parseFloat(value) * 1000);
        const wrong: string[] = [];
        let read = 0;
        for (const element of document.querySelectorAll('*')) {
          const sources: [string, CSSStyleDeclaration][] = [['', getComputedStyle(element)]];
          if (element.localName === 'details') sources.push(['::details-content', getComputedStyle(element, '::details-content')]);
          if (element.localName === 'dialog') sources.push(['::backdrop', getComputedStyle(element, '::backdrop')]);
          for (const [pseudo, style] of sources) {
            const pairs: [string[], string[]][] = [[split(style.transitionDuration), split(style.transitionTimingFunction)]];
            if (style.animationName !== 'none') pairs.push([split(style.animationDuration), split(style.animationTimingFunction)]);
            for (const [durations, easings] of pairs) {
              durations.forEach((duration, index) => {
                if (seconds(duration) === 0) return;
                const easing = easings[index % easings.length]!;
                read += 1;
                if (!allowed.includes(easing)) wrong.push(`${easing} on ${element.localName}${pseudo}`);
              });
            }
          }
        }
        return { read, wrong: [...new Set(wrong)] };
      });
      expect(found.read, `something moves on ${path}`).toBeGreaterThan(0);
      expect(found.wrong, `curves on ${path}`).toEqual([]);
    });
  }
});

// The crossfade itself, read while it runs. Its pseudo-elements exist only
// during a navigation, so the sweeps above never meet them: this follows a
// link from the home page to the CV and, as the new page is revealed,
// reads every animation the transition runs, the header's group among them.
test.describe('the page crossfade with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('runs every part of the crossfade on the standard curve for 250ms', async ({ page }) => {
    await page.addInitScript(() => {
      window.addEventListener('pagereveal', (event) => {
        const transition = (event as Event & { viewTransition?: { ready: Promise<void> } }).viewTransition;
        if (!transition) return;
        transition.ready.then(() => {
          // The transition's own parts only; the new page's entrance runs
          // beside them and is held to its curves by the sweeps above.
          (window as unknown as { crossfade: string[] }).crossfade = document
            .getAnimations()
            .map((animation) => (animation.effect as KeyframeEffect).pseudoElement ?? '')
            .filter((pseudo) => pseudo.startsWith('::view-transition'))
            .map((pseudo) => {
              const style = getComputedStyle(document.documentElement, pseudo);
              return `${pseudo} ${style.animationDuration} ${style.animationTimingFunction}`;
            });
        });
      });
    });
    await page.goto(at('/en/'));
    await page.locator(`body > header nav a[href="${at('/en/cv/')}"]`).click();
    await page.waitForURL(`**${at('/en/cv/')}`);
    const crossfade = await page.waitForFunction(() => (window as unknown as { crossfade?: string[] }).crossfade);
    const parts = (await crossfade.jsonValue()) as string[];
    expect(parts.some((part) => part.includes('(site-header)')), 'the header takes part').toBe(true);
    expect(parts.some((part) => part.includes('(root)')), 'the page takes part').toBe(true);
    for (const part of parts) expect(part, 'a part of the crossfade').toMatch(/ 0\.25s cubic-bezier\(0\.2, 0, 0, 1\)$/);
  });
});
