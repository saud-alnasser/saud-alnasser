import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { fill, formatPeriod, plural, strings } from '../src/lib/i18n';
import { byOrderThenStartDescending, byStartDescending } from '../src/lib/order';
import { isShown } from '../src/lib/shown';
import { technologyMark } from '../src/lib/technologies';
import { at, locales, type Locale } from './pages';

// The experience and projects sections as a pair of card grids: every
// project and every placement inside a card, one column on a phone and two
// on a desktop, the placement's highlights folded behind a control that
// opens in place and needs no script. What the cards must show is read from
// src/content/, the way scripts/check-dist.mjs reads it, so a card that
// drifts from the content source fails here rather than passing against a
// copy of itself.
//
// Both sections are on the home page.

interface Localized {
  en: string;
  ar: string;
}

interface Project {
  name: string;
  period: { start: string; end?: string };
  order?: number;
  visibility: 'public' | 'described' | 'hidden';
  status: 'completed' | 'in-progress';
  technologies: string[];
  featured?: boolean;
  links?: { repository?: string; live?: string };
}

interface Experience {
  position: Localized;
  organisation: Localized;
  location: Localized;
  period: { start: string; end?: string };
  highlights: Localized[];
}

const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');

// Every YAML file of one collection, parsed, in file-name order as the build
// loads them.
function collection<T>(name: string): T[] {
  const dir = path.join(content, name);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => parseYaml(readFileSync(path.join(dir, file), 'utf8')) as T);
}

// A hidden or unfinished project stays in the source and out of every output
// (src/lib/shown.ts), so the page shows fewer cards than the directory holds.
const projects = collection<Project>('projects').filter(isShown).sort(byOrderThenStartDescending);

// The one project the content marks featured leads the projects as a wider
// card and leaves the grid, so the grid holds the rest in the same order.
const featured = projects.find((entry) => entry.featured === true);
const gridProjects = projects.filter((entry) => entry !== featured);

const experience = collection<Experience>('experience').sort(byStartDescending);

const placement = experience[0]!;

// The number of tracks a grid lays its cards in, as the browser computes it:
// "496px 496px" is two.
const columnsOf = (page: Page, grid: string) =>
  page
    .locator(`[data-grid="${grid}"]`)
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).filter(Boolean).length);

// The label the fold's summary shows in each state, counted and declined in
// the page's own language.
const foldLabel = (locale: Locale, state: 'show' | 'hide', count: number) =>
  fill(strings[locale].fold[state], {
    count: String(count),
    noun: plural(locale, count, strings[locale].fold.nouns.highlights),
  });

const fold = (card: Locator) => card.locator('details');

test.describe('the experience and projects sections', () => {
  for (const locale of locales) {
    const url = at(`/${locale}/`);

    test(`${url} puts every entry inside a card`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('[data-grid="projects"] > li')).toHaveCount(gridProjects.length);
      await expect(page.locator('[data-grid="experience"] > li')).toHaveCount(experience.length);
      await expect(page.locator('[data-entry="project"]')).toHaveCount(gridProjects.length);
      await expect(page.locator('[data-entry="experience"]')).toHaveCount(experience.length);

      // A card is a bounded surface: its own colour, a border, and a radius.
      const background = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const surfaces = await page.locator(':is([data-grid="experience"], [data-grid="projects"]) [data-entry]').evaluateAll((nodes) =>
        nodes.map((node) => {
          const style = getComputedStyle(node);
          return {
            background: style.backgroundColor,
            border: parseFloat(style.borderTopWidth),
            radius: parseFloat(style.borderTopLeftRadius),
          };
        }),
      );
      expect(surfaces.length).toBe(gridProjects.length + experience.length);
      for (const [index, surface] of surfaces.entries()) {
        expect(surface.border, `border of card ${index} on ${url}`).toBeGreaterThan(0);
        expect(surface.radius, `radius of card ${index} on ${url}`).toBeGreaterThan(0);
        expect(surface.background, `surface of card ${index} on ${url}`).not.toBe(background);
      }
    });

    test(`${url} puts the experience grid before the projects grid`, async ({ page }) => {
      // Requirement 4: a hiring reader looks for employment first, so each
      // section is a heading with the id the home page's card links to, and
      // experience comes first. Read from the document rather than from the
      // template, so a reordering of the source shows up here.
      await page.goto(url);
      const order = await page.evaluate(() => {
        const nodes = Array.from(document.querySelectorAll('main, main *'));
        const at = (selector: string) => {
          const element = document.querySelector(selector);
          return element ? nodes.indexOf(element) : -1;
        };
        return {
          experienceHeading: at('h2#experience'),
          experienceGrid: at('[data-grid="experience"]'),
          projectsHeading: at('h2#projects'),
          projectsGrid: at('[data-grid="projects"]'),
        };
      });

      for (const [what, position] of Object.entries(order)) {
        expect(position, `${what} on ${url}`).toBeGreaterThanOrEqual(0);
      }
      expect(order.experienceHeading, `the experience heading comes before its grid on ${url}`).toBeLessThan(
        order.experienceGrid,
      );
      expect(order.experienceGrid, `the experience grid comes before the projects heading on ${url}`).toBeLessThan(
        order.projectsHeading,
      );
      expect(order.projectsHeading, `the projects heading comes before its grid on ${url}`).toBeLessThan(
        order.projectsGrid,
      );

      await expect(page.locator('h2#experience')).toHaveText(strings[locale].sections.experience);
      await expect(page.locator('h2#projects')).toHaveText(strings[locale].sections.projects);
    });

    test(`${url} shows each card's name, period, and meta line`, async ({ page }) => {
      await page.goto(url);
      const card = page.locator('[data-entry="experience"]').first();
      await expect(card.locator('h3')).toHaveText(placement.position[locale]);
      await expect(card).toContainText(formatPeriod(locale, placement.period));
      await expect(card).toContainText(placement.organisation[locale]);
      await expect(card).toContainText(placement.location[locale]);
      await expect(card).toContainText(strings[locale].experience.training);

      const entry = gridProjects[0]!;
      const project = page.locator('[data-entry="project"]').first();
      await expect(project.locator('h3')).toHaveText(entry.name);
      await expect(project).toContainText(formatPeriod(locale, entry.period));
      await expect(project.locator(`[aria-label="${strings[locale].project.technologies}"] li`)).not.toHaveCount(0);
    });

    // Every technology a badge, in the content's order and spelling, with a
    // mark exactly where src/lib/technologies.ts has one, drawn in the text
    // colour and hidden from assistive technology. The first five are in
    // view and the rest folded behind a control that counts them.
    test(`${url} shows every technology as a badge, with its mark where it has one`, async ({ page }) => {
      await page.goto(url);
      const found = await page.locator('[data-entry="project"]').evaluateAll((nodes) =>
        nodes.map((node) => ({
          badges: [...node.querySelectorAll('[data-badge]')].map((badge) => {
            const svg = badge.querySelector('svg');
            return { name: badge.textContent?.trim(), mark: svg ? `${svg.getAttribute('aria-hidden')} ${svg.getAttribute('fill')}` : null };
          }),
          inView: node.querySelectorAll('[data-badge]:not(details [data-badge])').length,
          summary: node.querySelector('details summary .fold-when-closed')?.textContent?.trim() ?? null,
        })),
      );
      const expected = gridProjects.map((entry) => ({
        badges: entry.technologies.map((name) => ({ name, mark: technologyMark(name) ? 'true currentColor' : null })),
        inView: Math.min(entry.technologies.length, 5),
        summary:
          entry.technologies.length > 5
            ? fill(strings[locale].fold.show, {
                count: String(entry.technologies.length - 5),
                noun: plural(locale, entry.technologies.length - 5, strings[locale].fold.nouns.technologies),
              })
            : null,
      }));
      expect(found).toEqual(expected);
      expect(expected.some((entry) => entry.badges.some((badge) => badge.mark)), 'some badge carries a mark').toBe(true);
      expect(expected.some((entry) => entry.badges.some((badge) => !badge.mark)), 'some badge is the name alone').toBe(true);
    });

    test(`${url} links a public project and leaves a described one unlinked`, async ({ page }) => {
      await page.goto(url);
      const found = await page.locator('[data-entry="project"]').evaluateAll((nodes) =>
        nodes.map((node) => ({
          name: node.querySelector('h3')?.textContent?.trim() ?? '',
          links: [...node.querySelectorAll('a[href]')].map((link) => link.getAttribute('href')),
        })),
      );

      // The cards in the order the collection was sorted into, each with the
      // destinations its entry allows: a described project is private work
      // and points at nothing.
      const expected = gridProjects.map((entry) => ({
        name: entry.name,
        links:
          entry.visibility === 'public'
            ? [entry.links?.repository, entry.links?.live].filter((href): href is string => Boolean(href))
            : [],
      }));
      expect(found).toEqual(expected);
      expect(expected.some((entry) => entry.links.length > 0)).toBe(true);
      expect(expected.some((entry) => entry.links.length === 0)).toBe(true);
    });

    test(`${url} folds the highlights and opens them in place`, async ({ page }) => {
      await page.goto(url);
      const card = page.locator('[data-entry="experience"]').first();
      const details = fold(card);
      const list = details.locator('ul');

      await expect(details).not.toHaveAttribute('open');
      await expect(list).toBeHidden();
      await expect(details.locator('summary .fold-when-closed')).toHaveText(
        foldLabel(locale, 'show', placement.highlights.length),
      );

      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      await expect(list).toBeVisible();
      await expect(list.locator('li')).toHaveCount(placement.highlights.length);
      await expect(list.locator('li').first()).toHaveText(placement.highlights[0]![locale]);
      await expect(details.locator('summary .fold-when-open')).toHaveText(
        foldLabel(locale, 'hide', placement.highlights.length),
      );
    });
  }
});

test.describe('at 360 pixels wide', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  for (const locale of locales) {
    const url = at(`/${locale}/`);

    test(`${url} lays one column and does not scroll sideways`, async ({ page }) => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      for (const grid of ['projects', 'experience']) {
        expect(await columnsOf(page, grid), `columns of the ${grid} grid on ${url}`).toBe(1);
      }
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `scrollWidth of ${url}`).toBeLessThanOrEqual(360);
    });
  }
});

test.describe('at 1440 pixels wide', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const locale of locales) {
    const url = at(`/${locale}/`);

    test(`${url} lays two or more columns, none wider than its track`, async ({ page }) => {
      await page.goto(url);
      for (const grid of ['projects', 'experience']) {
        expect(await columnsOf(page, grid), `columns of the ${grid} grid on ${url}`).toBeGreaterThanOrEqual(2);
      }

      const box = (await page.locator('[data-grid="projects"]').boundingBox())!;
      const cards = await page.locator('[data-entry="project"]').all();
      for (const [index, card] of cards.entries()) {
        const bounds = (await card.boundingBox())!;
        expect(bounds.x, `card ${index} starts inside the grid on ${url}`).toBeGreaterThanOrEqual(box.x - 1);
        expect(bounds.x + bounds.width, `card ${index} ends inside the grid on ${url}`).toBeLessThanOrEqual(
          box.x + box.width + 1,
        );
      }
    });
  }

  test('the Arabic grid fills from the right and the English from the left', async ({ page }) => {
    const firstTwo = async (path: string) => {
      await page.goto(path);
      const cards = page.locator('[data-entry="project"]');
      const first = (await cards.nth(0).boundingBox())!;
      const second = (await cards.nth(1).boundingBox())!;
      return { first, second };
    };

    const arabic = await firstTwo(at('/ar/'));
    expect(arabic.first.x, 'the first Arabic card sits right of the second').toBeGreaterThan(arabic.second.x);

    const english = await firstTwo(at('/en/'));
    expect(english.first.x, 'the first English card sits left of the second').toBeLessThan(english.second.x);
  });
});

// Reduced motion is asked for beside it, as the shared options already do,
// because the page's entrance moves the fold and this context cannot evaluate
// in the page, so there is no `document.getAnimations()` to await as the other
// tests do and the click would never find the summary stable. The fold behaves the same either
// way; what is under test is that it needs no script.
test.describe('with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' });

  for (const locale of locales) {
    const url = at(`/${locale}/`);

    test(`${url} still opens the fold`, async ({ page }) => {
      // The fold is a native <details>, so nothing about it waits on a
      // script; this is the assertion that would catch it being rebuilt as
      // one.
      await page.goto(url);
      const details = fold(page.locator('[data-entry="experience"]').first());
      await expect(details.locator('ul')).toBeHidden();
      await details.locator('summary').click();
      await expect(details).toHaveAttribute('open', '');
      await expect(details.locator('ul li')).toHaveCount(placement.highlights.length);
    });
  }
});

// A row of badges starts where the language reads from: the first badge at
// the list's right edge in Arabic and its left edge in English.
test('badge rows fill from the right in Arabic and the left in English', async ({ page }) => {
  const edges = async (url: string) => {
    await page.goto(url);
    const list = page.locator(`[data-entry="project"] [aria-label] >> nth=0`);
    const box = (await list.boundingBox())!;
    const first = (await list.locator('[data-badge]').first().boundingBox())!;
    return { left: first.x - box.x, right: box.x + box.width - (first.x + first.width) };
  };
  const arabic = await edges(at('/ar/'));
  expect(arabic.right, 'the first Arabic badge at the right edge').toBeLessThanOrEqual(1);
  const english = await edges(at('/en/'));
  expect(english.left, 'the first English badge at the left edge').toBeLessThanOrEqual(1);
});

// The featured project: one raised card across the column, ahead of the
// grid, under a "Featured" label with a star, carrying everything a grid card
// does with every badge in view; and its project nowhere in the grid.
test.describe('the featured project', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  for (const locale of locales) {
    const url = at(`/${locale}/`);

    test(`${url} leads the projects with the featured one, once`, async ({ page }) => {
      expect(featured, 'a project is marked featured in the content').toBeDefined();
      await page.goto(url);
      const card = page.locator('[data-featured-project]');
      await expect(card).toHaveCount(1);
      await expect(card.locator('h3')).toHaveText(featured!.name);
      await expect(card).toContainText(strings[locale].project.featured);
      await expect(card.locator('svg[data-icon="star"]')).toHaveAttribute('aria-hidden', 'true');
      await expect(card).toContainText(formatPeriod(locale, featured!.period));
      await expect(card.locator('[data-badge]')).toHaveText(featured!.technologies);
      await expect(card.locator('details')).toHaveCount(0);
      const links = await card.locator('a[href]').evaluateAll((nodes) => nodes.map((node) => node.getAttribute('href')));
      expect(links).toEqual(
        featured!.visibility === 'public' ? [featured!.links?.repository, featured!.links?.live].filter(Boolean) : [],
      );

      // Out of the grid, and ahead of it.
      const names = await page.locator('[data-grid="projects"] h3').allTextContents();
      expect(names).not.toContain(featured!.name);
      const order = await page.evaluate(() => {
        const cardNode = document.querySelector('[data-featured-project]')!;
        const grid = document.querySelector('[data-grid="projects"]')!;
        return Boolean(cardNode.compareDocumentPosition(grid) & Node.DOCUMENT_POSITION_FOLLOWING);
      });
      expect(order, 'the featured card comes before the grid').toBe(true);

      // Wider than any card in the grid, and raised above them at rest.
      const width = (await card.boundingBox())!.width;
      const gridCard = (await page.locator('[data-entry="project"]').first().boundingBox())!.width;
      expect(width, 'the featured card is wider than a grid card').toBeGreaterThan(gridCard);
      const shadows = await page.evaluate(() => ({
        featured: getComputedStyle(document.querySelector('[data-featured-project]')!).boxShadow,
        grid: getComputedStyle(document.querySelector('[data-entry="project"]')!).boxShadow,
      }));
      expect(shadows.featured, 'the featured card rests raised').not.toBe(shadows.grid);
    });
  }
});

// The filter: one chip per technology two or more shown projects name, the
// featured one among them, most used first and then by name, after "All".
// A press leaves exactly the projects naming the technology, the featured
// card in its place among them, marks the chip pressed and no other, and
// announces how many shown projects name it, which is how many are on
// screen. With no script there is no row.
const uses = new Map<string, number>();
for (const entry of projects) for (const technology of new Set(entry.technologies)) uses.set(technology, (uses.get(technology) ?? 0) + 1);
const chipNames = [...uses]
  .filter(([, count]) => count >= 2)
  .sort(([a, x], [b, y]) => y - x || a.localeCompare(b, 'en'))
  .map(([technology]) => technology);

const announced = (locale: Locale, count: number) =>
  fill(strings[locale].filter.status, { count: String(count), noun: plural(locale, count, strings[locale].home.counts.nouns.projects) });

// The grid's visible projects, as the technologies each names.
const visibleGrid = (page: Page) =>
  page.locator('[data-grid="projects"] > li').evaluateAll((items) =>
    items.filter((item) => !(item as HTMLElement).hidden && (item as HTMLElement).offsetParent !== null).map((item) => item.getAttribute('data-technologies')!.split('|')),
  );

test.describe('the project filter', () => {
  for (const locale of locales) {
    const url = at(`/${locale}/`);
    const t = strings[locale];

    test(`${url} offers a chip per technology two projects share`, async ({ page }) => {
      expect(chipNames.length, 'the content has technologies to filter by').toBeGreaterThan(0);
      await page.goto(url);
      const group = page.getByRole('group', { name: t.filter.label });
      await expect(group).toBeVisible();
      await expect(group.locator('button')).toHaveText([t.filter.all, ...chipNames]);
      await expect(group.locator('button[aria-pressed="true"]')).toHaveText([t.filter.all]);
    });

    for (const how of ['mouse', 'keyboard'] as const) {
      test(`${url} narrows the grid by ${how}`, async ({ page }) => {
        await page.goto(url);
        const group = page.getByRole('group', { name: t.filter.label });
        const status = page.locator('[data-filter-status]');
        await expect(status).toHaveAttribute('role', 'status');
        for (const [index, name] of [...chipNames, ''].entries()) {
          const chip = name === '' ? group.getByRole('button', { name: t.filter.all, exact: true }) : group.getByRole('button', { name, exact: true });
          if (how === 'mouse') await chip.click();
          else {
            await chip.focus();
            await page.keyboard.press(index % 2 === 0 ? 'Enter' : 'Space');
          }
          await expect(chip).toHaveAttribute('aria-pressed', 'true');
          await expect(group.locator('button[aria-pressed="true"]')).toHaveCount(1);
          const visible = await visibleGrid(page);
          const expected = gridProjects.filter((entry) => name === '' || entry.technologies.includes(name)).map((entry) => entry.technologies);
          expect(visible, `the grid under ${name || 'All'}`).toEqual(expected);
          await expect(status).toHaveText(announced(locale, name === '' ? projects.length : uses.get(name)!));
          if (featured) {
            const card = page.locator('[data-featured-project]');
            if (name === '' || featured.technologies.includes(name)) await expect(card).toBeVisible();
            else await expect(card).toBeHidden();
          }
          const onScreen = expected.length + (featured && (name === '' || featured.technologies.includes(name)) ? 1 : 0);
          expect(onScreen, `the projects on screen under ${name || 'All'} match the count announced`).toBe(
            name === '' ? projects.length : uses.get(name)!,
          );
        }
      });
    }

    test(`${url} keeps the chips reachable, sized, and filling from the reading start`, async ({ page }) => {
      await page.goto(url);
      const group = page.getByRole('group', { name: t.filter.label });
      const boxes = await group.locator('button').evaluateAll((nodes) => nodes.map((node) => node.getBoundingClientRect().toJSON()));
      for (const box of boxes) {
        expect(box.width).toBeGreaterThanOrEqual(24);
        expect(box.height).toBeGreaterThanOrEqual(24);
      }
      const row = (await group.boundingBox())!;
      const first = boxes[0]!;
      if (locale === 'ar') expect(row.x + row.width - (first.x + first.width), 'the first chip at the right edge').toBeLessThanOrEqual(1);
      else expect(first.x - row.x, 'the first chip at the left edge').toBeLessThanOrEqual(1);
    });
  }
});

test.describe('the project filter with JavaScript disabled', () => {
  test.use({ javaScriptEnabled: false });

  for (const locale of locales) {
    const url = at(`/${locale}/`);

    test(`${url} shows no chips and every project`, async ({ page }) => {
      await page.goto(url);
      await expect(page.locator('[data-filter]')).toBeHidden();
      const items = page.locator('[data-grid="projects"] > li');
      await expect(items).toHaveCount(gridProjects.length);
      for (const item of await items.all()) await expect(item).toBeVisible();
      if (featured) await expect(page.locator('[data-featured-project]')).toBeVisible();
    });
  }
});
