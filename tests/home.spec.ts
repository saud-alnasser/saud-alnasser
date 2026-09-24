import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { fill, strings } from '../src/lib/i18n';
import { profileIcon } from '../src/lib/networks';
import { sections as sectionIds } from '../src/lib/sections';
import { isShown } from '../src/lib/shown';
import { technologyMark } from '../src/lib/technologies';
import { at, locales, type Locale } from './pages';

// The home page, which holds the whole portfolio: the first screen with the
// contact actions and the tiles, then Experience, Projects, Education, and
// Skills, each a section of its own. What the page says about the content is
// checked against src/content/ itself, read here the way
// scripts/check-dist.mjs reads it, so a count that drifts from the source
// fails rather than being believed. The cards inside each section are the
// work and education suites' to check (tests/work.spec.ts,
// tests/education.spec.ts, tests/certificates.spec.ts), which run on this
// page.

const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');

// The YAML files of one collection that the site shows: every file, except
// that projects pass through the one predicate every output reads
// (src/lib/shown.ts), as scripts/check-dist.mjs puts it.
function visibleEntries(collection: string): string[] {
  const dir = path.join(content, collection);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml'))
    .filter((file) => collection !== 'projects' || isShown(parseYaml(readFileSync(path.join(dir, file), 'utf8'))))
    .sort();
}

function entryData(...file: string[]): Record<string, any> {
  return parseYaml(readFileSync(path.join(content, ...file), 'utf8'));
}

const profile = entryData('profile.yaml').profile as {
  name: Record<Locale, string>;
  label: Record<Locale, string>;
  summary: Record<Locale, string>;
  location: Record<Locale, string>;
  email: string;
  profiles: { network: string; username: string; url: string }[];
};

const skillEntries = visibleEntries('skills').map((file) => entryData('skills', file));

// Every certificate the site shows, courses and certifications alike, which
// is what the certificates tile counts.
const certificates = visibleEntries('certificates');

// The entries whose cards carry an id of their own, which an address can
// still name on this page.
const entryIds = [
  ...visibleEntries('experience').map((file) => `experience-${file.replace(/\.yaml$/, '')}`),
  ...visibleEntries('education').map((file) => `education-${file.replace(/\.yaml$/, '')}`),
];

// Where each element sits in the document order of `main`, so reading order is
// asserted on the page rather than inferred from the template.
function positions(page: Page, selectors: string[]) {
  return page.evaluate((list) => {
    const nodes = Array.from(document.querySelectorAll('main, main *'));
    return list.map((selector) => {
      const element = document.querySelector(selector);
      return element ? nodes.indexOf(element) : -1;
    });
  }, selectors);
}

// The first screen in the order a visitor reads it, then the sections that
// follow it, each heading before what it holds.
const reading = [
  'main h1',
  '[data-hero-label]',
  '[data-hero-location]',
  '[data-hero-summary]',
  '[data-contact-actions]',
  '[data-stat-tiles]',
  'h2#experience',
  '[data-grid="experience"]',
  'h2#projects',
  '[data-featured-project]',
  '[data-grid="projects"]',
  'h2#education',
  '[data-courses-node]',
  '[data-course-list]',
  'h2#skills',
  '[data-skill-grid]',
];

for (const locale of locales) {
  test.describe(`the home page in ${locale}`, () => {
    test('reads as the first screen, then each section in turn', async ({ page }) => {
      await page.goto(at(`/${locale}/`));

      await expect(page.locator('main h1')).toHaveText(profile.name[locale]);
      await expect(page.locator('[data-hero-label]')).toHaveText(profile.label[locale]);
      await expect(page.locator('[data-hero-summary]')).toHaveText(profile.summary[locale]);

      const found = await positions(page, reading);
      expect(found, `every part of ${reading.join(', ')} is on /${locale}/`).not.toContain(-1);
      for (let index = 1; index < found.length; index += 1) {
        expect(found[index], `${reading[index]} comes after ${reading[index - 1]}`).toBeGreaterThan(found[index - 1]!);
      }
    });

    test('carries no contact detail anywhere on the page', async ({ page }) => {
      // The site publishes no address and no number, the footer included.
      // docs/development.md says why, and what a reader who wants one does
      // instead.
      await page.goto(at(`/${locale}/`));
      const text = await page.locator('body').innerText();
      expect(text, `the email address anywhere on /${locale}/`).not.toContain(profile.email);
      await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
    });

    test('offers the contact actions with icons and names', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const actions = page.locator('[data-contact-actions] a');
      await expect(actions).toHaveCount(2 + profile.profiles.length);

      for (const action of await actions.all()) {
        await expect(action.locator('svg')).toHaveCount(1);
        await expect(action).toHaveAccessibleName(/\S/);
      }

      await expect(page.locator('[data-contact="email"]')).toHaveCount(0);

      const github = page.locator('[data-contact="github"]');
      await expect(github).toHaveAttribute('href', profile.profiles[0]!.url);
      await expect(github.locator('svg')).toHaveAttribute('data-icon', 'github');
      await expect(github).toHaveAccessibleName('GitHub');
      // The CV leads, filled in the accent as the one primary action, the
      // resume beside it, then GitHub as the first profile; every other
      // profile follows it, each with its network's mark where the icon set
      // has one (src/lib/networks.ts), the LinkedIn profile among them.
      const order = await actions.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-contact')));
      expect(order.slice(0, 3)).toEqual(['cv', 'resume', 'github']);
      const fills = await actions.evaluateAll((nodes) => nodes.map((node) => getComputedStyle(node).backgroundColor));
      expect(new Set(fills.slice(1)).size, 'every other action shares one fill').toBe(1);
      expect(fills[0], 'the CV is filled differently from the rest').not.toBe(fills[1]);
      for (const entry of profile.profiles.slice(1)) {
        const action = page.locator(`[data-contact="${entry.network.toLowerCase()}"]`);
        await expect(action).toHaveAttribute('href', entry.url);
        await expect(action).toHaveAccessibleName(entry.network);
        await expect(action.locator('svg')).toHaveAttribute('data-icon', profileIcon(entry.network));
      }
      // The profile the content must list, by name: the loop above would pass
      // with LinkedIn removed, and its absence is the thing to notice.
      expect(
        profile.profiles.map((entry) => entry.network),
        'the content lists a LinkedIn profile',
      ).toContain('LinkedIn');

      const cv = page.locator('[data-contact="cv"]');
      await expect(cv).toHaveAttribute('href', at(`/${locale}/cv/`));
      await expect(cv.locator('svg')).toHaveAttribute('data-icon', 'file-text');
      await expect(cv).toHaveAccessibleName(strings[locale].nav.cv);

      const resume = page.locator('[data-contact="resume"]');
      await expect(resume).toHaveAttribute('href', at(`/${locale}/resume/`));
      await expect(resume.locator('svg')).toHaveAttribute('data-icon', 'file-text');
      await expect(resume).toHaveAccessibleName(strings[locale].nav.resume);
    });

    test('shows every skill group as a card with its keywords', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const cards = page.locator('[data-skill-card]');
      await expect(cards).toHaveCount(skillEntries.length);

      for (const entry of skillEntries) {
        const card = cards.filter({ has: page.getByRole('heading', { name: entry.name[locale], exact: true }) });
        await expect(card, `the card for ${entry.name.en}`).toHaveCount(1);
        // Every keyword a badge, in the content's order and spelling, with
        // exactly one drawing: the mark where src/lib/technologies.ts has one,
        // in the text colour, and the code glyph where it has none, both
        // hidden from assistive technology.
        const badges = await card.locator('[data-badge]').evaluateAll((nodes) =>
          nodes.map((node) => {
            const svgs = node.querySelectorAll('svg');
            const svg = svgs[0];
            return {
              name: node.textContent?.trim(),
              mark: svgs.length === 1 ? `${svg.getAttribute('aria-hidden')} ${svg.getAttribute('data-icon') ?? svg.getAttribute('fill')}` : `${svgs.length} svgs`,
            };
          }),
        );
        expect(badges, `the badges on ${entry.name.en}`).toEqual(
          entry.keywords.map((name: string) => ({ name, mark: technologyMark(name) ? 'true currentColor' : 'true code' })),
        );
        if (entry.level) await expect(card).toContainText(entry.level[locale]);
      }
    });

    // The portfolio's five sections, in order, each a landmark labelled by
    // its heading, whose id is the section's anchor and which the header
    // finds by `data-section`.
    test('holds the five sections in order, each labelled by its heading', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const found = await page.locator('main [data-section]').evaluateAll((nodes) =>
        nodes.map((node) => ({
          id: node.id,
          level: node.localName,
          landmark: node.closest('section')?.getAttribute('aria-labelledby') ?? null,
        })),
      );
      expect(found).toEqual(sectionIds.map((id) => ({ id, level: id === 'about' ? 'h1' : 'h2', landmark: id })));
      for (const id of sectionIds) {
        const name = (await page.locator(`#${id}`).innerText()).trim();
        await expect(page.getByRole('region', { name, exact: true }), `the ${id} landmark`).toHaveCount(1);
      }
      // The courses node is a timeline item of Education, a level down, and
      // the courses it lists are rows rather than headings.
      await expect(page.locator('section[aria-labelledby="education"] [data-courses-node]#courses h3')).toHaveCount(1);
      await expect(page.locator('[data-course-list] :is(h3, h4)')).toHaveCount(0);
      expect(await page.locator('[data-course-list] > li').count()).toBeGreaterThan(0);
    });

    test('keeps every entry id an address can name', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      for (const id of entryIds) await expect(page.locator(`main [id="${id}"]`), `#${id}`).toHaveCount(1);
    });

    // What the header and the sections replace: the monogram, the timeline
    // from study to work, and the grid of cards leading to each section.
    test('carries no monogram, no combined timeline, and no section grid', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      await expect(page.locator('[data-monogram], [data-journey], [data-section-grid], [data-section-card]')).toHaveCount(0);
      // The name is the first thing in the first screen.
      expect(await page.locator('[data-hero]').evaluate((hero) => hero.firstElementChild?.localName)).toBe('h1');
      await expect(page.locator('[data-hero] > h1')).toHaveAttribute('id', 'about');
    });
  });
}

test('a network with a mark takes it, and one without falls back to the link icon', () => {
  // The two networks the content lists each have a mark; the fallback is what
  // any other network would render, so it is asserted where it is decided.
  expect(profileIcon('GitHub')).toBe('github');
  expect(profileIcon('github')).toBe('github');
  expect(profileIcon('LinkedIn')).toBe('linkedin');
  expect(profileIcon('Mastodon')).toBe('external-link');
});

// How many columns a grid lays out, from the browser rather than from the
// classes on it.
async function columnsOf(page: Page, selector: string): Promise<number> {
  return page
    .locator(selector)
    .evaluate((element) => getComputedStyle(element).gridTemplateColumns.split(/\s+/).filter(Boolean).length);
}

const grids = { 'the skill grid': '[data-skill-grid]' };

test.describe('the card grids at 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const locale of locales) {
    for (const [what, selector] of Object.entries(grids)) {
      test(`${what} is one column on /${locale}/`, async ({ page }) => {
        await page.goto(at(`/${locale}/`));
        expect(await columnsOf(page, selector)).toBe(1);
      });
    }
  }
});

test.describe('the card grids at 1440 pixels wide', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const locale of locales) {
    for (const [what, selector] of Object.entries(grids)) {
      test(`${what} is two or more columns on /${locale}/`, async ({ page }) => {
        await page.goto(at(`/${locale}/`));
        expect(await columnsOf(page, selector)).toBeGreaterThanOrEqual(2);
      });
    }
  }

  test('the grids fill from the right in Arabic and from the left in English', async ({ page }) => {
    for (const [locale, direction] of [
      ['ar', 'right'],
      ['en', 'left'],
    ] as const) {
      await page.goto(at(`/${locale}/`));
      const cards = page.locator('[data-skill-card]');
      const first = await cards.first().boundingBox();
      const last = await cards.nth(1).boundingBox();
      expect(first, `the first skill card on /${locale}/`).not.toBeNull();
      if (direction === 'right') {
        expect(first!.x, `the first card starts at the right on /${locale}/`).toBeGreaterThan(last!.x);
      } else {
        expect(first!.x, `the first card starts at the left on /${locale}/`).toBeLessThan(last!.x);
      }
    }
  });
});

// The first screen. The four tiles count what the pages render, read here
// from src/content/ through the same predicates, and the number is final in
// the page as built, so a visitor with no script or with reduced motion reads
// it at once. Where motion is allowed it counts up once, from nothing.
const shownProjects = visibleEntries('projects').map((file) => entryData('projects', file) as { technologies: string[] });
const tileCounts = {
  projects: shownProjects.length,
  certificates: certificates.length,
  technologies: new Set(shownProjects.flatMap((entry) => entry.technologies)).size,
  languages: visibleEntries('languages').length,
};
const tileIcons = { projects: 'folder-code', certificates: 'award', technologies: 'cpu', languages: 'languages' };

type Watched = { changes: number; seen: Record<string, string[]> };

for (const locale of locales) {
  const t = strings[locale];

  test.describe(`the first screen of /${locale}/`, () => {
    test('lays the light behind the name, hidden from assistive technology', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const glow = page.locator('[data-glow]');
      await expect(glow).toHaveAttribute('aria-hidden', 'true');
      expect(await glow.evaluate((node) => node.textContent)).toBe('');
      await expect(page.locator('[data-hero-location] svg[data-icon="map-pin"]')).toHaveAttribute('aria-hidden', 'true');
    });

    test('counts four tiles from the content, with their icons', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      await expect(page.locator('[data-stat-tile]')).toHaveCount(4);
      for (const [tile, count] of Object.entries(tileCounts)) {
        const node = page.locator(`[data-stat-tile="${tile}"]`);
        const label = t.home.tiles[tile as keyof typeof tileCounts];
        await expect(node.locator('[data-count]')).toHaveAttribute('data-count', String(count));
        await expect(node.locator('[data-count]')).toHaveAttribute('aria-hidden', 'true');
        await expect(node.locator('.sr-only')).toHaveText(fill(t.home.tiles.spoken, { count: String(count), label }));
        await expect(node.locator(`svg[data-icon="${tileIcons[tile as keyof typeof tileIcons]}"]`)).toHaveAttribute(
          'aria-hidden',
          'true',
        );
      }
    });

    // Every section heading, the subsections of Education among them, carries
    // its icon, hidden where the text names the thing; the tiles' icons are
    // asserted above.
    test('puts an icon on every section heading', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const headings = await page.locator('main :is(h2:not(.sr-only), h3#certificates)').evaluateAll((nodes) =>
        nodes.map((node) => ({
          text: node.textContent?.trim(),
          icon: node.querySelector('svg[data-icon]')?.getAttribute('aria-hidden') ?? null,
        })),
      );
      expect(headings.length, `headings on /${locale}/`).toBeGreaterThan(0);
      for (const heading of headings) expect(heading.icon, `the icon on "${heading.text}" on /${locale}/`).toBe('true');
    });
  });

  test.describe(`the first screen of /${locale}/ with JavaScript disabled`, () => {
    test.use({ javaScriptEnabled: false });

    test('shows every number at its final figure', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      for (const [tile, count] of Object.entries(tileCounts)) {
        await expect(page.locator(`[data-stat-tile="${tile}"] [data-count]`)).toHaveText(String(count));
      }
    });
  });

  test.describe(`the first screen of /${locale}/ under reduced motion`, () => {
    test.use({ reducedMotion: 'reduce' });

    test('shows every number at its final figure at load, and never changes it', async ({ page }) => {
      await page.addInitScript(() => {
        const watched = window as unknown as Watched;
        watched.changes = 0;
        // From the end of parsing, so the parser writing the page is not
        // mistaken for a script changing it.
        document.addEventListener('DOMContentLoaded', () => {
          new MutationObserver((records) => {
            for (const record of records) {
              const target = record.target instanceof Element ? record.target : record.target.parentElement;
              if (target?.closest('[data-count]')) watched.changes += 1;
            }
          }).observe(document, { subtree: true, childList: true, characterData: true });
        });
      });
      await page.goto(at(`/${locale}/`));
      for (const [tile, count] of Object.entries(tileCounts)) {
        await expect(page.locator(`[data-stat-tile="${tile}"] [data-count]`)).toHaveText(String(count));
      }
      expect(await page.evaluate(() => (window as unknown as Watched).changes)).toBe(0);
    });
  });

  test.describe(`the first screen of /${locale}/ with motion allowed`, () => {
    test.use({ reducedMotion: 'no-preference', viewport: { width: 1440, height: 900 } });

    test('counts each number up once, from nothing to its figure', async ({ page }) => {
      await page.addInitScript(() => {
        const watched = window as unknown as Watched;
        watched.seen = {};
        new MutationObserver(() => {
          for (const node of document.querySelectorAll('[data-stat-tile]')) {
            const key = node.getAttribute('data-stat-tile')!;
            const text = node.querySelector('[data-count]')!.textContent!;
            const list = (watched.seen[key] ??= []);
            if (list.at(-1) !== text) list.push(text);
          }
        }).observe(document, { subtree: true, childList: true, characterData: true });
      });
      await page.goto(at(`/${locale}/`));
      for (const [tile, count] of Object.entries(tileCounts)) {
        await expect(page.locator(`[data-stat-tile="${tile}"] [data-count]`)).toHaveText(String(count));
      }
      await page.waitForTimeout(500);
      const seen = await page.evaluate(() => (window as unknown as Watched).seen);
      for (const [tile, count] of Object.entries(tileCounts)) {
        const values = (seen[tile] ?? []).map(Number);
        const from = values.indexOf(0);
        expect(from, `${tile} starts its count at nothing`).toBeGreaterThanOrEqual(0);
        const run = values.slice(from);
        expect(run.at(-1), `${tile} ends at its figure`).toBe(count);
        expect(run.filter((value) => value === 0).length, `${tile} counts once`).toBe(1);
        for (let index = 1; index < run.length; index += 1) expect(run[index]!).toBeGreaterThanOrEqual(run[index - 1]!);
      }
    });
  });

  // What is on the first screen at the two sizes the spec names, in both
  // palettes (the project decides the palette): at 1440 by 900 the whole
  // block, tiles included; on a 390 by 844 phone everything down to the
  // contact actions.
  const sizes = [
    { width: 1440, height: 900, parts: ['main h1', '[data-hero-label]', '[data-hero-location]', '[data-contact-actions]', '[data-stat-tiles]'] },
    { width: 390, height: 844, parts: ['main h1', '[data-hero-label]', '[data-hero-location]', '[data-contact-actions]'] },
  ];
  for (const { width, height, parts } of sizes) {
    test.describe(`the first screen of /${locale}/ at ${width} by ${height}`, () => {
      test.use({ viewport: { width, height } });

      test('holds the block above the fold', async ({ page }) => {
        await page.goto(at(`/${locale}/`));
        await page.evaluate(() => document.fonts.ready);
        for (const part of parts) {
          const box = (await page.locator(part).boundingBox())!;
          expect(box.y + box.height, `${part} ends within the first ${height} pixels`).toBeLessThanOrEqual(height);
        }
        expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      });
    });
  }
}
