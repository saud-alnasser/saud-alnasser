import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { lowContrastPairs } from './contrast';
import { at, locales } from './pages';
import { fill, formatPeriod, plural, strings, type Locale } from '../src/lib/i18n';
import { byDateAscending, byDateDescending, byStartAscending } from '../src/lib/order';
import { isCertification, isCourse } from '../src/lib/shown';
import { educationTimeline } from '../src/lib/timeline';

// The education section: the timeline of institutions with one node for the
// online-courses phase, then the courses and the certifications, each under
// its own heading below it, all on the home page.
//
// What the page shows is read from src/content/ here, the way
// scripts/check-dist.mjs reads it, so an expectation is the content rather
// than a number typed twice: the courses the university entry lists, how many
// online courses there are, and the dates of the first and the last.

const content = fileURLToPath(new URL('../src/content/', import.meta.url));

function entries<T>(collection: string): T[] {
  const directory = path.join(content, collection);
  return readdirSync(directory)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => parseYaml(readFileSync(path.join(directory, file), 'utf8')) as T);
}

type Text = Record<'en' | 'ar', string>;
// A status the content may carry: the ones the page has a wording for, and
// `completed`, which it deliberately has none for.
type EducationStatus = 'completed' | keyof (typeof strings)['en']['education']['status'];
type EducationEntry = {
  institution: Text;
  studyType: Text;
  area: Text;
  status: EducationStatus;
  period: { start: string; end?: string };
  courses?: Text[];
  document?: string;
};
type CertificateEntry = { name: Text; kind: 'course' | 'certification'; date?: string };

const education = entries<EducationEntry>('education').sort(byStartAscending);

// What the page says under an entry, or nothing: a completed degree is said
// by its end date, so the line under it is shown only where the wording adds
// something (src/components/Education.astro).
function statusOf(locale: Locale, entry: EducationEntry): string | null {
  return entry.status === 'completed' ? null : strings[locale].education.status[entry.status];
}
const statuses = education.filter((entry) => entry.status !== 'completed');

// The two sections the certificates collection renders as, told apart by the
// field the page reads (src/lib/shown.ts). The timeline's node stands for the
// courses, so it is the courses it counts and dates.
const certificates = entries<CertificateEntry>('certificates');
const courses = certificates.filter(isCourse);
const certifications = certificates.filter(isCertification);
const dated = courses.filter((entry) => entry.date).sort(byDateAscending);

// The one institution that lists its courses. The status is read off the
// entry rather than named here, so changing it in the content changes what
// this expects instead of failing here.
const degree = education.find((entry) => entry.courses?.length)!;

// The timeline as src/lib/timeline.ts lays it out for every output, newest
// first: an institution by its name, the online-courses node as `courses`.
const order = educationTimeline(education, courses).map((item) => (item.kind === 'courses' ? null : item.entry));

// The institutions whose entry names a document, the degree certificate: each
// card carries one link that opens it in the page's certificate dialog, the
// dialog tests/certificates.spec.ts covers from the course cards. Read from
// the content, so an institution without one is asserted to offer nothing.
const documented = education.filter((entry) => entry.document);
const control = '[data-document]';
const dialog = '[data-certificate-dialog]';

// The phase runs from the earliest dated certificate to the latest.
const period = { start: String(dated[0].date), end: String(dated[dated.length - 1].date) };

const node = '[data-courses-node]';

const timeline = 'section[aria-labelledby="education"] > ol > li';

for (const locale of locales) {
  const t = strings[locale];
  const url = at(`/${locale}/`);

  test.describe(url, () => {
    test('shows the university as a card with its courses folded', async ({ page }) => {
      await page.goto(url);
      const card = page.locator(timeline).filter({ hasText: degree.institution[locale] });
      await expect(card).toHaveCount(1);
      // The period through the function the card prints it with, so the
      // value is the entry's and not any pair of years the shape check in
      // tests/periods.spec.ts would accept.
      await expect(card.locator('[data-period]')).toHaveText(formatPeriod(locale, degree.period));
      const status = statusOf(locale, degree);
      if (status === null) await expect(card.locator('[data-status]')).toHaveCount(0);
      else await expect(card.locator('[data-status]')).toHaveText(status);

      const courses = degree.courses!;
      const fold = card.locator('details');
      const shown = { count: String(courses.length), noun: plural(locale, courses.length, t.fold.nouns.courses) };
      await expect(fold).not.toHaveAttribute('open');
      await expect(fold.locator('summary')).toContainText(fill(t.fold.show, shown));
      await expect(fold.locator('li').first()).not.toBeVisible();

      await fold.locator('summary').click();
      await expect(fold).toHaveAttribute('open', '');
      await expect(fold.locator('summary')).toContainText(fill(t.fold.hide, shown));
      await expect(fold.locator('li'), `the ${courses.length} courses of ${degree.institution.en}`).toHaveCount(
        courses.length,
      );
      await expect(fold.locator('li').first()).toBeVisible();
      // In the page's language, not the language the content was authored in.
      await expect(fold.locator('li').first()).toHaveText(courses[0][locale]);
      await expect(fold.locator('li').last()).toHaveText(courses[courses.length - 1][locale]);
    });

    test('reads newest first, with the courses node where the timeline rule puts it', async ({ page }) => {
      await page.goto(url);
      const items = page.locator(timeline);
      // The institutions and the one node, and nothing else: the certificates
      // have left the timeline.
      await expect(items).toHaveCount(education.length + 1);
      // The entries whose status the page has a wording for, which today is
      // none of them: the one degree is complete and its dates say so.
      await expect(items.locator('[data-status]')).toHaveCount(statuses.length);

      for (const [index, entry] of order.entries()) {
        if (entry === null) await expect(items.nth(index).locator(node), `the node is item ${index}`).toHaveCount(1);
        else await expect(items.nth(index)).toContainText(entry.institution[locale]);
      }
    });

    test('counts the courses on the node and dates it from the first to the last', async ({ page }) => {
      await page.goto(url);
      const online = page.locator(node);
      await expect(online).toContainText(t.education.onlineCourses.name);
      // The node counts the courses grid, worded with the courses noun, and
      // leads to it (requirement 5).
      await expect(online).toContainText(
        fill(t.education.onlineCourses.count, {
          count: String(courses.length),
          noun: plural(locale, courses.length, t.education.onlineCourses.noun),
        }),
      );
      await expect(online).toContainText(formatPeriod(locale, period));
      await expect(online).toHaveAttribute('href', '#courses');
      await expect(online).toContainText(t.education.onlineCourses.link);
    });

    test('lists the courses under the heading the node leads to, and the certifications under their own', async ({
      page,
    }) => {
      await page.goto(url);

      const coursesHeading = page.locator(':is(h2, h3)#courses');
      await expect(coursesHeading).toHaveText(t.sections.courses);
      await expect(page.locator(timeline).locator('#courses')).toHaveCount(0);

      // The certifications section exists only while the content has a
      // certification, so that the page never shows a heading over nothing.
      // Where it exists, its heading keeps the id the certificates section
      // had, so an inbound link to #certificates still lands on a credential;
      // where it does not, the anchor is absent too.
      const certificationsHeading = page.locator(':is(h2, h3)#certificates');
      await expect(certificationsHeading).toHaveCount(certifications.length > 0 ? 1 : 0);
      if (certifications.length > 0) await expect(certificationsHeading).toHaveText(t.sections.certifications);

      // Each grid holds its own kind, in the order the site orders them: by
      // date newest first, the undated last.
      for (const [grid, expected] of [
        ['courses', courses],
        ['certifications', certifications],
      ] as const) {
        // A kind with no entries renders no grid at all, not an empty one.
        if (expected.length === 0) {
          await expect(page.locator(`[data-grid="${grid}"]`), `the ${grid} grid on ${url}`).toHaveCount(0);
          continue;
        }
        const list = page.locator(`[data-grid="${grid}"] > li`);
        await expect(list, `the ${grid} grid on ${url}`).toHaveCount(expected.length);
        const ordered = [...expected].sort(byDateDescending);
        // The Arabic of a certificate's name is optional in the contract, so
        // the page falls back to the English and the expectation follows it.
        const nameOf = (entry: (typeof ordered)[number]) => entry.name[locale] ?? entry.name.en;
        await expect(list.first()).toContainText(nameOf(ordered[0]!));
        await expect(list.last()).toContainText(nameOf(ordered[ordered.length - 1]!));
      }
    });

    test('offers the degree certificate from the card whose entry names one, and from no other', async ({ page }) => {
      await page.goto(url);
      for (const entry of education) {
        const card = page.locator(timeline).filter({ hasText: entry.institution[locale] });
        await expect(card, `the card of ${entry.institution.en} is a timeline item`).toHaveJSProperty('tagName', 'LI');
        await expect(card.locator('article'), `the card of ${entry.institution.en} is an article`).toHaveCount(1);
        await expect(card.locator(control), `documents offered by ${entry.institution.en}`).toHaveCount(
          entry.document ? 1 : 0,
        );
        if (!entry.document) continue;

        const link = card.locator(control);
        const caption = [entry.studyType[locale], entry.area[locale], entry.institution[locale]].join(
          t.listSeparator,
        );
        await expect(link).toHaveJSProperty('tagName', 'A');
        await expect(link).toHaveText(t.certificate.open);
        await expect(link).toHaveAttribute('href', /\/_astro\/.+\.pdf$/);
        await expect(link).toHaveAttribute('data-document', (await link.getAttribute('href'))!);
        await expect(link).toHaveAttribute('data-preview', /\.webp$/);
        // The preview is rendered 1600 pixels wide by scripts/certificate-previews.mjs,
        // and the height follows the page, so the width is the one number that
        // is fixed and a swapped pair fails here.
        await expect(link).toHaveAttribute('data-preview-width', '1600');
        expect(Number(await link.getAttribute('data-preview-height'))).toBeGreaterThan(0);
        await expect(link).toHaveAttribute('data-caption', caption);
      }
    });

    if (documented.length > 0) {
      test('opens the degree certificate in the dialog, closes back to the link, and leaves the courses folding', async ({
        page,
      }) => {
        await page.goto(url);
        await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
        const card = page.locator(timeline).filter({ hasText: documented[0]!.institution[locale] });
        const link = card.locator(control);
        const expected = {
          preview: await link.getAttribute('data-preview'),
          document: await link.getAttribute('data-document'),
          caption: await link.getAttribute('data-caption'),
        };

        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        await link.click();
        await expect(page.locator(dialog)).toHaveAttribute('open', '');
        await expect(page.locator(`${dialog} [data-certificate-image]`)).toHaveAttribute('src', expected.preview!);
        await expect(page.locator(`${dialog} [data-certificate-image]`)).toHaveAttribute('alt', expected.caption!);
        await expect(page.locator(`${dialog} [data-certificate-caption]`)).toHaveText(expected.caption!);
        await expect(page.locator(`${dialog} [data-certificate-link]`)).toHaveAttribute('href', expected.document!);
        // The click opened the dialog rather than following the link.
        await expect(page).toHaveURL(new RegExp(`${url.replace(/\//g, '\\/')}$`));

        await page.keyboard.press('Escape');
        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        await expect(link).toBeFocused();

        // The fold beside it is untouched by the link: it still opens, and a
        // click on its summary opens no dialog.
        const fold = card.locator('details');
        await fold.locator('summary').click();
        await expect(fold).toHaveAttribute('open', '');
        await expect(page.locator(dialog)).not.toHaveAttribute('open');
        await expect(fold.locator('li')).toHaveCount(documented[0]!.courses?.length ?? 0);
      });
    }

    test('meets the contrast criterion with the courses open', async ({ page, colorScheme }) => {
      // The contrast tests audit every page with its folds closed; the open
      // course list is the surface they cannot see.
      await page.goto(url);
      await page.evaluate(() => Promise.all(document.getAnimations().map((animation) => animation.finished)));
      await page.locator(`${timeline} details summary`).click();
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
      const found = results.violations.map((violation) => `${violation.id}: ${violation.help}`);
      expect(found, `${colorScheme} palette on ${url} with the courses open`).toEqual([]);
      expect(await page.evaluate(lowContrastPairs), `${colorScheme} palette on ${url} with the courses open`).toEqual(
        [],
      );
    });
  });

  test.describe(`${url} at 360 pixels wide`, () => {
    test.use({ viewport: { width: 360, height: 780 } });

    test('does not scroll horizontally with the courses open', async ({ page }) => {
      await page.goto(url);
      await page.evaluate(() => document.fonts.ready);
      await page.locator(`${timeline} details summary`).click();
      const width = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(width, `scrollWidth of ${url} with the courses open`).toBeLessThanOrEqual(360);
    });
  });

  test.describe(`${url} with JavaScript disabled`, () => {
    // Reduced motion with it, as the shared options already ask, because the
    // page's entrance is what a click waits out and no script can be run to
    // wait for it here.
    test.use({ javaScriptEnabled: false, reducedMotion: 'reduce' });

    test('opens the courses fold', async ({ page }) => {
      await page.goto(url);
      const fold = page.locator(`${timeline} details`);
      await fold.locator('summary').click();
      await expect(fold).toHaveAttribute('open', '');
      await expect(fold.locator('li')).toHaveCount(degree.courses!.length);
      await expect(fold.locator('li').first()).toBeVisible();
    });

    test('leaves the degree certificate link the link to its PDF', async ({ page }) => {
      await page.goto(url);
      const links = page.locator(`${timeline} ${control}`);
      await expect(links).toHaveCount(documented.length);
      for (const link of await links.all()) {
        await expect(link).toHaveJSProperty('tagName', 'A');
        await expect(link).toHaveAttribute('href', /\.pdf$/);
      }
    });
  });
}
