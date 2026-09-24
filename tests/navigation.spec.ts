import { expect, test, type Page } from '@playwright/test';
import { strings } from '../src/lib/i18n';
import { sections } from '../src/lib/sections';
import { at, belowHeader, locales, pages } from './pages';

// The header as the way around the one page: it stays on screen however far
// the page is scrolled, it names the home page's five sections on every page,
// and each of its section links brings that section's heading up to just
// below it, from the top of the page and from the foot, the last section
// included. At a desktop size the links are in the header's row; at a phone
// size they are in the phone menu, which is opened first.
//
// With JavaScript disabled, because everything here is the page's own: the
// sticky header, the anchors, the scroll padding that keeps a heading clear
// of the header, and the last section's height, which lets its heading come
// up at all.

const sizes = [
  { width: 1440, height: 900, phone: false },
  { width: 390, height: 844, phone: true },
] as const;

const toFoot = (page: Page) => page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));

// The link to a section where the size puts it: in the header's row, or in the
// phone menu, opened first.
async function sectionLink(page: Page, phone: boolean, id: string) {
  if (!phone) return page.locator(`body > header > div > nav a[data-section-link="${id}"]`);
  const menu = page.locator('[data-site-menu]');
  if ((await menu.getAttribute('open')) === null) await menu.locator('summary').click();
  return menu.locator(`a[data-section-link="${id}"]`);
}

for (const { width, height, phone } of sizes) {
  test.describe(`at ${width} by ${height} with JavaScript disabled`, () => {
    test.use({ viewport: { width, height }, javaScriptEnabled: false });

    for (const path of pages) {
      test(`${path} keeps the header in view at its foot`, async ({ page }) => {
        await page.goto(path);
        await toFoot(page);
        expect(await page.evaluate(() => window.scrollY), `${path} scrolls`).toBeGreaterThan(0);
        const header = (await page.locator('body > header').boundingBox())!;
        expect(header.y, `the header's top on ${path}`).toBe(0);
        await expect(page.locator('body > header')).toBeInViewport();
      });
    }

    for (const locale of locales) {
      const home = at(`/${locale}/`);

      for (const id of sections) {
        for (const from of ['top', 'foot'] as const) {
          test(`${home} brings #${id} up under the header from the ${from}`, async ({ page }) => {
            await page.goto(home);
            if (from === 'foot') await toFoot(page);
            const before = await page.evaluate(() => window.scrollY);
            await (await sectionLink(page, phone, id)).click();
            await expect(page).toHaveURL(new RegExp(`#${id}$`));
            const gap = await belowHeader(page, id);
            expect(gap, `#${id} below the header`).toBeGreaterThanOrEqual(0);
            expect(gap, `#${id} below the header`).toBeLessThanOrEqual(24);
            // A press always moves the page: no section is ever where its
            // link already leaves it, the last one included.
            expect(await page.evaluate(() => window.scrollY), `the page moved to #${id}`).not.toBe(before);
          });
        }
      }

      // The same links on the two documents lead back to the home page's
      // sections, and the document's own link is the current page.
      for (const document of ['cv', 'resume'] as const) {
        test(`/${locale}/${document}/ leads to each section of the home page`, async ({ page }) => {
          await page.goto(at(`/${locale}/${document}/`));
          for (const id of sections) {
            await expect(await sectionLink(page, phone, id)).toHaveAttribute('href', `${home}#${id}`);
          }
          await (await sectionLink(page, phone, 'skills')).click();
          await expect(page).toHaveURL(`${home}#skills`);
          const gap = await belowHeader(page, 'skills');
          expect(gap).toBeGreaterThanOrEqual(0);
          expect(gap).toBeLessThanOrEqual(24);
        });
      }
    }
  });
}

// The links name the sections in the page's language, in the order the page
// holds them.
test('names the five sections in each language, in order', async ({ page }) => {
  for (const locale of locales) {
    const t = strings[locale];
    await page.goto(at(`/${locale}/`));
    await expect(page.locator('body > header > div > nav a[data-section-link]')).toHaveText(sections.map((id) => t.nav[id]));
  }
});

// With the script: a press glides (here, under the suite's reduced motion,
// in one step) to the same place the jump lands, marks exactly that
// section's link current in the header's row and the phone menu alike, puts
// the anchor in the address, and moves focus to the heading.
const current = (page: Page) =>
  page.locator('[data-section-link][aria-current="location"]').evaluateAll((links) =>
    links.map((link) => `${link.closest('[data-site-menu]') ? 'menu' : 'bar'}:${link.getAttribute('data-section-link')}`),
  );

for (const { width, height, phone } of sizes) {
  test.describe(`at ${width} by ${height} with the script`, () => {
    test.use({ viewport: { width, height } });

    for (const locale of locales) {
      const home = at(`/${locale}/`);

      for (const id of sections) {
        for (const from of ['top', 'foot'] as const) {
          test(`${home} takes #${id} up under the header from the ${from} and marks it`, async ({ page }) => {
            await page.goto(home);
            if (from === 'foot') await toFoot(page);
            const before = await page.evaluate(() => window.scrollY);
            await (await sectionLink(page, phone, id)).click();
            await expect(page).toHaveURL(`${home}#${id}`);
            await expect(page.locator(`#${id}`)).toBeFocused();
            const gap = await belowHeader(page, id);
            expect(gap, `#${id} below the header`).toBeGreaterThanOrEqual(0);
            expect(gap, `#${id} below the header`).toBeLessThanOrEqual(24);
            expect(await page.evaluate(() => window.scrollY), `the page moved to #${id}`).not.toBe(before);
            await expect.poll(() => current(page)).toEqual([`bar:${id}`, `menu:${id}`]);
            if (phone) await expect(page.locator('[data-site-menu]')).not.toHaveAttribute('open');
          });
        }
      }

      test(`${home} marks each section as it is scrolled to by hand, and Skills at the foot`, async ({ page }) => {
        await page.goto(home);
        await expect.poll(() => current(page)).toEqual(['bar:about', 'menu:about']);
        for (const id of sections) {
          await page.evaluate((id) => {
            const padding = parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop);
            const top = document.getElementById(id)!.closest('section')!.getBoundingClientRect().top + window.scrollY;
            window.scrollTo(0, top - padding);
          }, id);
          await expect.poll(() => current(page), { message: `scrolled to #${id}` }).toEqual([`bar:${id}`, `menu:${id}`]);
        }
        await toFoot(page);
        await expect.poll(() => current(page)).toEqual(['bar:skills', 'menu:skills']);
      });
    }
  });
}

test.describe('what the script leaves to the browser', () => {
  test('a modified press on a section link', async ({ page }) => {
    await page.goto(at('/en/'));
    await page.evaluate(() => {
      document.addEventListener('click', (event) => {
        (window as unknown as { prevented: boolean }).prevented = event.defaultPrevented;
        event.preventDefault();
      });
    });
    await page.locator('body > header > div > nav a[data-section-link="skills"]').click({ modifiers: ['Shift'] });
    expect(await page.evaluate(() => (window as unknown as { prevented: boolean }).prevented)).toBe(false);
    expect(await page.evaluate(() => window.scrollY)).toBe(0);
  });

  test('a press on a section link on a document page', async ({ page }) => {
    await page.goto(at('/en/cv/'));
    await page.locator('body > header > div > nav a[data-section-link="projects"]').click();
    await expect(page).toHaveURL(`${at('/en/')}#projects`);
    const gap = await belowHeader(page, 'projects');
    expect(gap).toBeGreaterThanOrEqual(0);
    expect(gap).toBeLessThanOrEqual(24);
  });
});

// Tabbing backward from the foot of the home page: whatever takes focus is
// scrolled clear of the header, never left under it. The walk ends where
// focus leaves the page's content for the header, or for the skip link,
// which shows over the header by design; with fewer cards than presses it
// gets there before the presses run out.
test('keeps every element focused by Shift+Tab from the foot clear of the header', async ({ page }) => {
  await page.goto(at('/en/'));
  await page.locator('footer summary').focus();
  for (let press = 0; press < 60; press += 1) {
    await page.keyboard.press('Shift+Tab');
    const found = await page.evaluate(() => {
      const element = document.activeElement as HTMLElement | null;
      if (!element || element === document.body) return null;
      if (element.closest('body > header') || element.matches('a[href="#content"]')) return 'left';
      const box = element.getBoundingClientRect();
      const header = document.querySelector('body > header')!.getBoundingClientRect();
      return { name: `${element.localName} ${(element.textContent ?? '').trim().slice(0, 30)}`, top: box.top, bottom: header.bottom };
    });
    if (found === 'left') break;
    if (!found) continue;
    expect(found.top, `${found.name} below the header`).toBeGreaterThanOrEqual(found.bottom - 1);
  }
});

// A document's header links open the home page at an anchor, with the page's
// entrance and the reveal able to run. Neither may hold the section low as the
// browser scrolls to it: each heading settles below the header, as a press on
// the home page leaves it.
for (const { width, height, phone } of sizes) {
  test.describe(`at ${width} by ${height} with motion allowed`, () => {
    test.use({ viewport: { width, height }, reducedMotion: 'no-preference' });

    for (const id of sections) {
      test(`/en/cv/ opens #${id} of the home page below the header`, async ({ page }) => {
        await page.goto(at('/en/cv/'));
        await (await sectionLink(page, phone, id)).click();
        await expect(page).toHaveURL(`${at('/en/')}#${id}`);
        await page.waitForTimeout(700);
        const gap = await belowHeader(page, id);
        expect(gap, `#${id} below the header`).toBeGreaterThanOrEqual(0);
        expect(gap, `#${id} below the header`).toBeLessThanOrEqual(24);
      });
    }
  });
}

// An address whose anchor is not a valid escape, as a link cut short leaves
// it, names no section, and everything the script wires still runs.
test('a malformed anchor leaves the page working', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto(`${at('/en/')}#%`);
  await expect(page.locator('[data-filter]')).toBeVisible();
  await page.locator('[data-theme-toggle]').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', /light|dark/);
  expect(errors).toEqual([]);
});

// The header's name on the home page, which the first screen's heading
// already says: hidden while that heading is in view, shown once it has gone
// under the header, and hidden again when it comes back. Hidden means unseen,
// unreachable by Tab, and absent from the accessibility tree, which is what
// `visibility: hidden` gives. Everywhere the script does not take it over,
// with no script, under reduced motion, and on a document page, it shows.
const homeName = 'body > header [data-home-name]';

// Whether the name can be seen and reached: its computed visibility and
// opacity, read as they are; the cases poll it until a fade has settled.
async function nameState(page: Page) {
  return page.locator(homeName).evaluate((element) => {
    const style = getComputedStyle(element);
    return { visibility: style.visibility, opacity: style.opacity };
  });
}

const shown = { visibility: 'visible', opacity: '1' };
const hidden = { visibility: 'hidden', opacity: '0' };

for (const { width, height } of sizes) {
  test.describe(`the header's name at ${width} by ${height} with motion allowed`, () => {
    test.use({ viewport: { width, height }, reducedMotion: 'no-preference' });

    for (const locale of locales) {
      const home = at(`/${locale}/`);

      test(`${home} hides the name at the top, shows it past the heading, and hides it again on return`, async ({
        page,
      }) => {
        await page.goto(home);
        await expect.poll(() => nameState(page)).toEqual(hidden);

        // Nothing at the top reaches it by Tab: the first stops pass it by.
        await page.locator('body').click({ position: { x: 1, y: 1 } });
        for (let press = 0; press < 3; press += 1) {
          await page.keyboard.press('Tab');
          expect(await page.evaluate(() => document.activeElement?.hasAttribute('data-home-name')), 'Tab reaches the hidden name').toBe(
            false,
          );
        }

        await page.locator('h2#experience').evaluate((element) => element.scrollIntoView());
        await expect.poll(() => nameState(page)).toEqual(shown);

        await page.evaluate(() => window.scrollTo(0, 0));
        await expect.poll(() => nameState(page)).toEqual(hidden);
      });
    }

    test(`${at('/en/cv/')} shows the name at the top`, async ({ page }) => {
      await page.goto(at('/en/cv/'));
      await expect.poll(() => nameState(page)).toEqual(shown);
    });
  });
}

test.describe('the header name where the script does not take it over', () => {
  test.describe('under reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test(`${at('/en/')} shows the name at the top`, async ({ page }) => {
      await page.goto(at('/en/'));
      expect(await nameState(page)).toEqual(shown);
    });
  });

  test.describe('with JavaScript disabled', () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'no-preference' });
    test(`${at('/en/')} shows the name at the top`, async ({ page }) => {
      await page.goto(at('/en/'));
      const style = await page.locator(homeName).evaluate((element) => getComputedStyle(element).visibility);
      expect(style).toBe('visible');
    });
  });
});

test.describe('the header name before the page has finished loading, with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  // A slow page paints long before it has parsed, so the name is hidden
  // from the head, before the body exists, rather than when the script
  // that follows it runs.
  test(`${at('/en/')} marks the name to follow before the document is parsed`, async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          (window as unknown as { followsAtParse: boolean }).followsAtParse =
            document.documentElement.hasAttribute('data-name-follows');
        }
      });
    });
    await page.goto(at('/en/'));
    expect(await page.evaluate(() => (window as unknown as { followsAtParse: boolean }).followsAtParse)).toBe(true);
    await expect.poll(() => nameState(page)).toEqual(hidden);
  });

  test(`${at('/en/cv/')} marks nothing, since it has no first screen to follow`, async ({ page }) => {
    await page.goto(at('/en/cv/'));
    await expect(page.locator('html')).not.toHaveAttribute('data-name-follows');
  });

  // A reader who has tabbed to the name and then scrolls back to the top
  // keeps it, and keeps focus on it.
  test(`${at('/en/')} keeps the name while it holds focus`, async ({ page }) => {
    await page.goto(at('/en/'));
    await page.locator('h2#experience').evaluate((element) => element.scrollIntoView());
    await expect.poll(() => nameState(page)).toEqual(shown);
    await page.locator(homeName).focus();
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(400);
    expect(await nameState(page)).toEqual(shown);
    await expect(page.locator(homeName)).toBeFocused();
  });
});

// Opened at a section below the first screen, the page shows the name from
// the start, rather than hiding it until the script has read where the
// heading is, and still hides it once the reader goes up to the heading.
test.describe('the header name on a page opened at a section, with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  test(`${at('/en/')}#projects shows the name from the parse, and follows from there`, async ({ page }) => {
    await page.addInitScript(() => {
      document.addEventListener('readystatechange', () => {
        if (document.readyState === 'interactive') {
          (window as unknown as { followsAtParse: boolean }).followsAtParse =
            document.documentElement.hasAttribute('data-name-follows');
        }
      });
    });
    await page.goto(`${at('/en/')}#projects`);
    expect(await page.evaluate(() => (window as unknown as { followsAtParse: boolean }).followsAtParse)).toBe(false);
    await expect.poll(() => nameState(page)).toEqual(shown);
    await expect(page.locator('html')).toHaveAttribute('data-name-follows', '');
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect.poll(() => nameState(page)).toEqual(hidden);
  });
});
