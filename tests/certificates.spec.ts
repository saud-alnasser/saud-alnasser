import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { lowContrastPairs } from './contrast';
import { at, locales } from './pages';
import { formatDate, strings } from '../src/lib/i18n';
import { byDateDescending } from '../src/lib/order';
import { isCertification, isCourse } from '../src/lib/shown';

// The courses, listed inside the education timeline's online-courses node,
// the certifications grid, and the one dialog both open: a course or a card
// is a link to its PDF, so a visitor with no script gets the document itself,
// and the script turns the click into the dialog showing the preview with the
// PDF one click away. What the page must not do is load any of the
// previews with itself, which is what the dialog's empty <img> and the
// request count below assert.
//
// Which entries are courses and which are certifications, how many of each,
// and how many name a document is read from src/content/ the way
// tests/education.spec.ts reads it, so the numbers are the content rather
// than numbers typed twice, and reclassifying an entry moves it between the
// list and the grid here as well as on the page.

const content = fileURLToPath(new URL('../src/content/', import.meta.url));

type CertificateEntry = {
  name: Record<'en' | 'ar', string>;
  issuer: string;
  kind: 'course' | 'certification';
  date?: string;
  document?: string;
};

const certificates = readdirSync(path.join(content, 'certificates'))
  .filter((file) => file.endsWith('.yaml'))
  .sort()
  .map((file) => parseYaml(readFileSync(path.join(content, 'certificates', file), 'utf8')) as CertificateEntry);

const documented = certificates.filter((entry) => entry.document);

// One row per place a kind is shown, with the entries it holds in the order
// the site puts them in: by date newest first, the undated last. `list` is
// the element whose children are the entries, the courses node's list or the
// certifications grid, and `heading` the id an inbound link lands on. A kind
// with no entries renders no list and no anchor, so the per-kind cases below
// run over what the page renders, and one case asserts the absence of the
// rest. Only the certifications are a grid of cards: the courses are rows of
// a list inside a disclosure, which a case opens before it clicks one.
const grids = [
  {
    grid: 'courses',
    list: '[data-course-list]',
    heading: '#courses',
    entries: certificates.filter(isCourse).sort(byDateDescending),
  },
  {
    grid: 'certifications',
    list: '[data-grid="certifications"]',
    heading: '#certificates',
    entries: certificates.filter(isCertification).sort(byDateDescending),
  },
];
const rendered = grids.filter(({ entries }) => entries.length > 0);
const absent = grids.filter(({ entries }) => entries.length === 0);

// Every course and every certification card: the dialog serves them alike.
const cards = ':is([data-entry="course"], [data-entry="certification"])';
const node = '[data-courses-node]';
const dialog = '[data-certificate-dialog]';
const image = '[data-certificate-image]';
const link = '[data-certificate-link]';
const caption = '[data-certificate-caption]';
const close = '[data-certificate-close]';

// The number of tracks a grid lays its cards in, as the browser computes it.
const columnsOf = (page: Page, grid: string) =>
  page
    .locator(`[data-grid="${grid}"]`)
    .evaluate((node) => getComputedStyle(node).gridTemplateColumns.split(/\s+/).filter(Boolean).length);

// Waits out anything still moving before a click. The shared options ask for
// reduced motion, so on every test today there is nothing to wait for; this
// keeps a click steady if a test asks for motion back.
const settled = (page: Page) => page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));

// Opens the courses node, where the courses are, so a course can be clicked.
const openCourses = async (page: Page) => {
  const details = page.locator(node);
  if ((await details.getAttribute('open')) === null) await details.locator('summary').click();
  await expect(details).toHaveAttribute('open', '');
  await settled(page);
};

for (const locale of locales) {
  const url = at(`/${locale}/`);

  test.describe(url, () => {
    test('renders no grid and no heading for a kind with no entries', async ({ page }) => {
      await page.goto(url);
      for (const { grid, list, heading } of absent) {
        await expect(page.locator(list), `the ${grid} list on ${url}`).toHaveCount(0);
        await expect(page.locator(heading), `the ${grid} heading on ${url}`).toHaveCount(0);
      }
      for (const { grid, heading } of rendered) {
        await expect(page.locator(heading), `the ${grid} heading on ${url}`).toHaveCount(1);
      }
    });

    for (const { grid, list, entries } of rendered) {
      test(`shows every ${grid} entry, with its issuer and its date`, async ({ page }) => {
        await page.goto(url);
        await expect(page.locator(`${list} > li`)).toHaveCount(entries.length);

        const found = await page.locator(`${list} [data-entry]`).evaluateAll((nodes) =>
          nodes.map((node) => ({
            kind: node.getAttribute('data-entry'),
            name: node.querySelector('[data-certificate-name]')?.textContent?.trim() ?? '',
            text: node.textContent?.replace(/\s+/g, ' ').trim() ?? '',
          })),
        );

        // Every entry of this kind, and nothing of the other kind.
        expect(found.map((card) => card.name).sort(), `the ${grid} cards on ${url}`).toEqual(
          entries.map((entry) => entry.name[locale] ?? entry.name.en).sort(),
        );
        const kind = grid === 'courses' ? 'course' : 'certification';
        for (const [index, card] of found.entries()) {
          expect(card.kind, `card ${index} of the ${grid} grid on ${url}`).toBe(kind);
        }

        // Newest first, with the undated last: the dates the cards carry, in
        // the order they are laid out, are the dates the content sorts into.
        const dateOf = (name: string) => entries.find((entry) => (entry.name[locale] ?? entry.name.en) === name)?.date;
        expect(
          found.map((card) => dateOf(card.name)),
          `the ${grid} cards on ${url} newest first, the undated last`,
        ).toEqual(entries.map((entry) => entry.date));

        // What a card says: its name, its issuer, and its date where the
        // entry has one.
        for (const [index, card] of found.entries()) {
          const entry = entries.find((candidate) => (candidate.name[locale] ?? candidate.name.en) === card.name)!;
          expect(card.text, `the issuer on card ${index} of the ${grid} grid on ${url}`).toContain(entry.issuer);
          if (entry.date) {
            expect(card.text, `the date on card ${index} of the ${grid} grid on ${url}`).toContain(
              formatDate(locale, entry.date),
            );
          }
        }
      });
    }

    test('gives every card that names a document its address', async ({ page }) => {
      await page.goto(url);
      const withDocument = page.locator(`${cards}[data-document]`);
      await expect(withDocument, `certificates naming a document on ${url}`).toHaveCount(documented.length);

      // Each is the link to its own PDF, with the preview and the caption the
      // dialog will show.
      const found = await withDocument.evaluateAll((nodes) =>
        nodes.map((node) => ({
          tag: node.tagName.toLowerCase(),
          href: node.getAttribute('href'),
          document: node.getAttribute('data-document'),
          preview: node.getAttribute('data-preview'),
          width: node.getAttribute('data-preview-width'),
          height: node.getAttribute('data-preview-height'),
          caption: node.getAttribute('data-caption'),
        })),
      );
      for (const [index, card] of found.entries()) {
        expect(card.tag, `card ${index} on ${url}`).toBe('a');
        expect(card.href, `card ${index} on ${url} links to its document`).toBe(card.document);
        expect(card.document, `card ${index} on ${url}`).toMatch(/\.pdf$/);
        expect(card.preview, `preview of card ${index} on ${url}`).toMatch(/\.webp$/);
        expect(Number(card.width), `preview width of card ${index} on ${url}`).toBeGreaterThan(0);
        expect(Number(card.height), `preview height of card ${index} on ${url}`).toBeGreaterThan(0);
        expect(card.caption, `caption of card ${index} on ${url}`).toBeTruthy();
      }
    });

    test('loads no preview with the page, and none until a card is opened', async ({ page }) => {
      const previews: string[] = [];
      page.on('request', (request) => {
        if (request.url().endsWith('.webp')) previews.push(request.url());
      });
      await page.goto(url);
      await settled(page);
      await expect(page.locator(`${dialog} ${image}`)).not.toHaveAttribute('src');
      expect(previews, `previews requested by ${url}`).toEqual([]);
    });

    // The dialog is one dialog for the courses and the certifications, so it
    // is opened from each.
    for (const { grid, list, entries } of rendered) {
      if (!entries.some((entry) => entry.document)) continue;
      const documentedCards = `${list} ${cards}[data-document]`;
      const reach = (page: Page) => (grid === 'courses' ? openCourses(page) : settled(page));

      test(`opens the dialog on a click in the ${grid}, with the preview and the PDF`, async ({ page }) => {
        await page.goto(url);
        await settled(page);
        await reach(page);
        const card = page.locator(documentedCards).first();
        const expected = {
          preview: await card.getAttribute('data-preview'),
          document: await card.getAttribute('data-document'),
          caption: await card.getAttribute('data-caption'),
        };

        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        await card.click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        await expect(page.locator(`${dialog} ${image}`)).toHaveAttribute('src', expected.preview!);
        await expect(page.locator(`${dialog} ${image}`)).toHaveAttribute('alt', expected.caption!);
        // The preview is a real file that arrives, not only an address, and
        // the dialog reserved its box before it did: the image's size
        // attributes are the card's, so the dialog does not grow when the
        // file lands.
        await expect
          .poll(() => page.locator(`${dialog} ${image}`).evaluate((node) => (node as HTMLImageElement).naturalWidth), {
            message: `the preview of ${url} loads`,
          })
          .toBeGreaterThan(0);
        await expect(page.locator(`${dialog} ${image}`)).toHaveAttribute('width', (await card.getAttribute('data-preview-width'))!);
        await expect(page.locator(`${dialog} ${image}`)).toHaveAttribute('height', (await card.getAttribute('data-preview-height'))!);
        await expect(page.locator(`${dialog} ${link}`)).toHaveAttribute('href', expected.document!);
        await expect(page.locator(`${dialog} ${link}`)).toContainText(strings[locale].certificate.document);
        await expect(page.locator(`${dialog} ${caption}`)).toHaveText(expected.caption!);
        // The click opened the dialog rather than following the link.
        await expect(page).toHaveURL(new RegExp(`${url.replace(/\//g, '\\/')}$`));
      });

      test(`closes on Escape and returns focus to the ${grid} entry that opened it`, async ({ page }) => {
        await page.goto(url);
        await settled(page);
        await reach(page);
        const openable = page.locator(documentedCards);
        const card = (await openable.count()) > 1 ? openable.nth(1) : openable.first();
        await card.click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        await page.keyboard.press('Escape');
        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        await expect(card).toBeFocused();
      });

      test(`closes on the close control and returns focus to the ${grid} entry`, async ({ page }) => {
        await page.goto(url);
        await settled(page);
        await reach(page);
        const card = page.locator(documentedCards).first();
        await card.click();
        await expect(page.locator(`${dialog} ${close}`)).toHaveAccessibleName(strings[locale].certificate.close);
        await page.locator(`${dialog} ${close}`).click();
        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        await expect(card).toBeFocused();
      });
    }

    test('meets the contrast criterion with the dialog closed and open', async ({ page, colorScheme }) => {
      await page.goto(url);
      await settled(page);
      const audit = async (state: string) => {
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
        const found = results.violations.map((violation) => `${violation.id}: ${violation.help}`);
        expect(found, `${colorScheme} palette on ${url} with the dialog ${state}`).toEqual([]);
        expect(await page.evaluate(lowContrastPairs), `${colorScheme} palette on ${url} with the dialog ${state}`).toEqual(
          [],
        );
      };

      await audit('closed');
      await openCourses(page);
      await audit('closed with the courses open');
      await page.locator(`${cards}[data-document]`).first().click();
      await expect(page.locator(dialog)).toHaveAttribute('open', '');
      await audit('open');
    });
  });

  test.describe(`${url} at 360 pixels wide`, () => {
    test.use({ viewport: { width: 360, height: 780 } });

    test('lays the certifications in one column and does not scroll sideways with the courses open', async ({ page }) => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      for (const { grid } of rendered.filter(({ grid }) => grid !== 'courses')) {
        expect(await columnsOf(page, grid), `columns of the ${grid} grid on ${url}`).toBe(1);
      }
      await openCourses(page);
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `scrollWidth of ${url} with the courses open`).toBeLessThanOrEqual(360);
    });
  });

  test.describe(`${url} at 1440 pixels wide`, () => {
    test.use({ viewport: { width: 1440, height: 900 } });

    test('lays the certifications in two or more columns', async ({ page }) => {
      await page.goto(url);
      for (const { grid } of rendered.filter(({ grid }) => grid !== 'courses')) {
        expect(await columnsOf(page, grid), `columns of the ${grid} grid on ${url}`).toBeGreaterThanOrEqual(2);
      }
    });
  });

  test.describe(`${url} with JavaScript disabled`, () => {
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' });

    test('opens the courses node and leaves every course and card the link to its PDF', async ({ page }) => {
      await page.goto(url);
      await page.locator(`${node} summary`).click();
      await expect(page.locator(node)).toHaveAttribute('open', '');
      await expect(page.locator('[data-course-list] > li').first()).toBeVisible();
      const found = await page.locator(`${cards}[data-document]`).evaluateAll((nodes) =>
        nodes.map((node) => ({ tag: node.tagName.toLowerCase(), href: node.getAttribute('href') })),
      );
      expect(found.length, `cards with a document on ${url}`).toBe(documented.length);
      for (const [index, card] of found.entries()) {
        expect(card.tag, `card ${index} on ${url} without script`).toBe('a');
        expect(card.href, `card ${index} on ${url} without script`).toMatch(/\.pdf$/);
      }
    });
  });
}

test.describe('at 1440 pixels wide', () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test('an Arabic course reads from the right and an English one from the left', async ({ page }) => {
    // A course's name leads its row and its issuer and date follow, so the
    // name sits at the start of the reading direction.
    const firstRow = async (path: string) => {
      await page.goto(path);
      await openCourses(page);
      const row = page.locator(`[data-course-list] ${cards}`).first();
      return {
        name: (await row.locator('[data-certificate-name]').boundingBox())!,
        details: (await row.locator('[data-certificate-name] + span').boundingBox())!,
      };
    };

    const arabic = await firstRow(at('/ar/'));
    expect(arabic.name.x, 'the Arabic course name sits right of its details').toBeGreaterThan(arabic.details.x);

    const english = await firstRow(at('/en/'));
    expect(english.name.x, 'the English course name sits left of its details').toBeLessThan(english.details.x);
  });
});
