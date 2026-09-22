import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { marker } from '../scripts/form-marker.mjs';
import { fill, formatPeriod, strings } from '../src/lib/i18n';
import { icons } from '../src/lib/icons';
import { levelLine } from '../src/lib/languages';
import { codedProfile, profileIcon } from '../src/lib/networks';
import { byOrderThenName, byStartAscending } from '../src/lib/order';
import { isCertification, isCourse, isShown, onResume } from '../src/lib/shown';
import { at, locales, type Locale } from './pages';

// The two documents: the CV, which holds everything the site shows, and the
// one-page resume, which holds what an application needs. Both are one
// component (src/components/CvDocument.astro), so what is asserted here is
// the part that differs: which sections each prints, in what order, and which
// entries each carries. The expectations are read from src/content/ itself,
// the way scripts/check-dist.mjs reads it, so a document that drifts from the
// source fails rather than being believed.

const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');

// The entries of one collection, parsed. They arrive untyped, as they do in
// scripts/check-dist.mjs, and are handed to the same predicates the site
// filters through (src/lib/shown.ts).
function entries(collection: string): any[] {
  const dir = path.join(content, collection);
  return readdirSync(dir)
    .filter((file) => file.endsWith('.yaml'))
    .sort()
    .map((file) => parseYaml(readFileSync(path.join(dir, file), 'utf8')));
}

const profile = parseYaml(readFileSync(path.join(content, 'profile.yaml'), 'utf8')).profile;
// The profiles, typed once: the header case reads which of them is the code
// and refuses every one of them on the contact line.
const profiles: { network: string; url: string }[] = profile.profiles;
const projects = entries('projects').filter((data) => isShown(data));
const certificates = entries('certificates');
// In the order the documents print them (src/lib/order.ts), which is by
// `order` and not by file name.
const languages = entries('languages').sort(byOrderThenName);

// The repository link a document prints for a project, or nothing. Only a
// `public` project shows its links, exactly as src/components/CvDocument.astro
// decides it, so a `described` entry such as Mudaraj is expected to carry no
// link at all rather than a link the content never gave it.
function published(project: any): string | undefined {
  return project.visibility === 'public' ? project.links?.repository : undefined;
}

// What each document holds, counted from the content the way the site counts
// it. The CV takes every entry its kind admits; the resume takes only what an
// entry marks for it, and a marked course keeps the courses heading rather
// than being listed as a credential it is not.
const held = {
  cv: {
    projects: projects.length,
    certifications: certificates.filter((data) => isCertification(data)).length,
    courses: certificates.filter((data) => isCourse(data)).length,
  },
  resume: {
    projects: projects.filter((data) => onResume(data)).length,
    certifications: certificates.filter((data) => isCertification(data) && onResume(data)).length,
    courses: certificates.filter((data) => isCourse(data) && onResume(data)).length,
  },
};

// The order each document prints its last three sections in: the CV leads
// with the credentials it holds and ends on the projects, the resume leads
// with the projects. A section renders only where it holds something, so the
// expectation drops an empty one, which is what lets reclassifying the one
// certification as a course (criterion 6) or marking a course for the resume
// move the headings here as well as the cards.
const tailOrder = {
  cv: ['certifications', 'courses', 'projects'],
  resume: ['projects', 'certifications', 'courses'],
} as const;

// The languages sit directly after the key skills on both documents, and like
// every section print only where the collection holds something.
const sectionsExpected = (variant: 'cv' | 'resume') => [
  'summary',
  'experience',
  'education',
  'skills',
  ...(languages.length > 0 ? ['languages'] : []),
  ...tailOrder[variant].filter((id) => held[variant][id] > 0),
];

// The paragraph each document opens with, and the other place the two differ.
// The CV prints the profile's `summary`, which the home page, the README, and
// both JSON Resume documents also read; the resume prints `resumeSummary`,
// which nothing else reads. Which document gets which is decided in one place
// (src/components/CvDocument.astro), and the two fields sit a few lines apart
// in src/content/profile.yaml, so the only thing holding them the right way
// round is this.
const summaryField = { cv: 'summary', resume: 'resumeSummary' } as const;

// One document's summary in one language, with the fallback the page falls
// back by: a profile field's Arabic is optional in the contract and
// src/lib/localized.ts renders the English when it is absent, so an
// expectation read straight off the `ar` key would fail on a gap that is
// legal. Same shape as `courseNames` below.
function summaryText(variant: 'cv' | 'resume', locale: Locale): string {
  const authored = profile[summaryField[variant]];
  return authored[locale] ?? authored.en;
}

// The course list under an education entry, in one language: the block the CV
// keeps and the resume drops. Each course is authored as an { en, ar } map.
function courseNames(locale: Locale): string[] {
  return entries('education').flatMap((data) => (data.courses ?? []).map((course: any) => course[locale] ?? course.en));
}

// The sections of a document, in the order the page prints them.
function sectionsOf(page: Page): Promise<string[]> {
  return page.evaluate(() =>
    Array.from(document.querySelectorAll('article.cv [data-cv-section]')).map(
      (element) => element.getAttribute('data-cv-section') ?? '',
    ),
  );
}

for (const locale of locales) {
  for (const variant of ['cv', 'resume'] as const) {
    test.describe(`the ${variant} page in ${locale}`, () => {
      const route = at(`/${locale}/${variant}/`);

      test('prints its sections in the order the template fixes', async ({ page }) => {
        await page.goto(route);
        expect(await sectionsOf(page), `the sections of ${route}`).toEqual(sectionsExpected(variant));
      });

      // The one paragraph on the page that is authored per document rather
      // than shared. Asserted against the field src/content/profile.yaml
      // holds for this variant, so swapping the two in
      // src/components/CvDocument.astro fails here instead of shipping a
      // resume opening with the CV's paragraph.
      test('opens with the summary authored for its own document', async ({ page }) => {
        await page.goto(route);
        const section = page.locator('[data-cv-section="summary"]');
        await expect(section.locator('p'), `the summary on ${route}`).toHaveText(summaryText(variant, locale));
      });

      // Each institution's period through the function the page prints it
      // with, in the order the section lists them, so the value on the page
      // is the entry's and not any pair of years the shape check in
      // tests/periods.spec.ts would accept.
      test('dates each education entry from the content', async ({ page }) => {
        await page.goto(route);
        await expect(page.locator('[data-cv-section="education"] [data-period]')).toHaveText(
          entries('education')
            .sort(byStartAscending)
            .map((data) => formatPeriod(locale, data.period)),
        );
      });

      // One line per language, "name: level", the level followed by the test
      // score and its year where the entry carries one. The line is the
      // authored text through the same fallback as `summaryText`, and the
      // tail through the same function the page and the JSON document use,
      // so the exact wording, the score, and the year are the expectation
      // rather than a copy of them. An empty collection prints no section,
      // as `sectionsExpected` already says.
      test('lists each language with its level on one line', async ({ page }) => {
        await page.goto(route);
        const t = strings[locale];
        const section = page.locator('[data-cv-section="languages"]');
        await expect(section).toHaveCount(languages.length > 0 ? 1 : 0);
        if (languages.length === 0) return;
        await expect(section.locator('h2')).toHaveText(t.cv.languages);
        await expect(section.locator('> ul > li')).toHaveText(
          languages.map(
            (data) =>
              `${data.name[locale] ?? data.name.en}: ${levelLine(data.level[locale] ?? data.level.en, data.test, t.listSeparator)}`,
          ),
        );
      });

      test('carries exactly the entries the content marks for it', async ({ page }) => {
        await page.goto(route);
        const counts = held[variant];
        await expect(page.locator('[data-cv-section="projects"] > ol > li')).toHaveCount(counts.projects);
        await expect(page.locator('[data-cv-section="certifications"] > ul > li')).toHaveCount(counts.certifications);
        await expect(page.locator('[data-cv-section="courses"] > ul > li')).toHaveCount(counts.courses);

        // Named, not only counted: the resume carries the projects the
        // content marks and none of the others.
        for (const project of projects) {
          const shown = variant === 'cv' || onResume(project);
          const heading = page.getByRole('heading', { name: project.name, exact: true });
          await expect(heading, `${project.name} on ${route}`).toHaveCount(shown ? 1 : 0);
        }
      });

      // The row each document page opens with holds one thing: the control
      // that downloads that page's own PDF. It is a link, so a browser
      // running no script still gets the published document, its content is
      // an icon and no visible text, and its name and its tooltip are the
      // same words, which is what makes what a screen reader announces and
      // what a pointer shows one fact rather than two.
      test('opens with one control, which downloads its own PDF', async ({ page }) => {
        await page.goto(route);
        const row = page.locator('.cv-actions');
        await expect(row.locator('> *')).toHaveCount(1);

        const control = row.locator('[data-document-download]');
        const name = fill(strings[locale].cv.downloadPdf, { document: strings[locale][variant].title });
        await expect(control).toHaveCount(1);
        await expect(control).toHaveAttribute('href', at(`/${variant}.${locale}.pdf`));
        await expect(control).toHaveAttribute('download', '');
        await expect(control).toHaveAccessibleName(name);
        await expect(control).toHaveAttribute('title', name);
        await expect(control.locator('[data-icon="download"]')).toHaveCount(1);
        // No visible text: every word the control carries is inside the
        // sr-only span that names it, so nothing beside the icon reads on
        // screen. Asserted on the child nodes rather than on innerText,
        // because sr-only clips its text rather than hiding it.
        const visible = await control.evaluate((element) =>
          Array.from(element.childNodes)
            .filter((node) => !(node instanceof Element && node.classList.contains('sr-only')))
            .map((node) => node.textContent ?? '')
            .join('')
            .trim(),
        );
        expect(visible, `visible text of the control on ${route}`).toBe('');

      });

      // The LinkedIn address is the header's QR code, and the contact line
      // writes no profile out. That is the one place either document trades
      // a fact a parser can read for one a phone can: the code is the only
      // route to the address on paper, so what it decodes to is checked
      // against src/content/profile.yaml over the rendered PDF by
      // scripts/check-dist.mjs. What is left for a browser to say is the half
      // a PDF cannot show: that on screen it is the link, that it carries the
      // address as its accessible name, because the words that used to say it
      // are gone, that the mark at its centre is the network's own, and that
      // no contact item writes any profile's address out.
      //
      // Which profile is the code is read from the same function the
      // component and the dist check read it from, never from the profiles'
      // order: GitHub stays first in the content for the home page and the
      // README, and the code is found by its network.
      test('carries the LinkedIn address as one code in the header, and no profile address in the text', async ({ page }) => {
        await page.goto(route);
        const code = page.locator('article.cv [data-qr-code]');
        await expect(code).toHaveCount(1);
        // The one graphic either document is allowed. Asserted here as well
        // as over the built HTML, because a second one added through a
        // component rather than through markup would reach the page the
        // same way.
        await expect(page.locator('article.cv svg')).toHaveCount(1);

        const coded = codedProfile(profiles);
        expect(coded, 'the content lists the profile the code carries').toBeDefined();
        const address = coded!.url;
        await expect(code, 'the code names the address it carries').toHaveAccessibleName(
          new RegExp(address.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
        );
        const linked = page.locator('article.cv header a', { has: page.locator('[data-qr-code]') });
        await expect(linked, 'on screen the code is the link to that address').toHaveAttribute('href', address);

        // The mark at the centre is the network's own, drawn from the same
        // body the icon component draws it from: the LinkedIn mark, whose
        // body in src/lib/icons.ts is one path.
        const markName = profileIcon(coded!.network);
        const mark = code.locator('[data-icon]');
        await expect(mark, 'the mark is the network\'s').toHaveAttribute('data-icon', markName);
        const body = icons[markName].body.match(/ d="([^"]+)"/)?.[1];
        expect(body, 'the icon body is one path').toBeDefined();
        await expect(mark.locator('path'), 'the mark is drawn from the icon body').toHaveAttribute('d', body!);

        // The header block the code sits beside, which is what pays for it:
        // the code is drawn no taller than the name and the label, so the
        // document is the same height with it as without.
        //
        // Bounded below as well as above, and the lower bound is the one that
        // matters. An upper bound alone passes a code of any size at all down
        // to a few pixels, which decodes perfectly from a page rasterised
        // above print resolution and is unreadable by any camera; the dist
        // check measures the printed module for that reason, and this is its
        // half on the page, where the name block it is sized against lives.
        const [text, drawn] = await Promise.all([
          page.locator('article.cv > header > div').nth(1).boundingBox(),
          code.boundingBox(),
        ]);
        expect(drawn!.height, `the code on ${route} is no taller than the name block`).toBeLessThanOrEqual(
          text!.height,
        );
        // To a tenth of a pixel, as the spacer is below: a box read off the
        // page comes back through the box model in single precision, so an
        // element sitting at a fractional offset reports its height a
        // ten-thousandth of a pixel out. That is the reading, not the code.
        expect(drawn!.height, `the code on ${route} is drawn at the size it is printed at`).toBeCloseTo(80, 1);
        expect(drawn!.width, `the code on ${route} is square`).toBeCloseTo(drawn!.height, 1);

        // The spacer that balances it, measured **in print media**, which is
        // the only medium where this can be wrong. The compact root size is
        // declared inside `@media print`, so on screen a rem spacer and a
        // pixel code are both 80 and agree; in print the root is 10pt, a rem
        // spacer becomes two thirds of the code, and the name sits off the
        // paper's centre on the resume alone. A screen-media assertion here
        // passes identically on both sides of that, which is no assertion at
        // all.
        await page.emulateMedia({ media: 'print' });
        const [spacer, printed] = await Promise.all([
          page.locator('article.cv > header > div').first().boundingBox(),
          code.boundingBox(),
        ]);
        expect(spacer!.width, `the spacer on ${route} matches the code it balances, on paper`).toBeCloseTo(
          printed!.width,
          1,
        );
        await page.emulateMedia({ media: 'screen' });

        // No profile on the contact line: not the one the code carries, and
        // not any other, since 2026-09-22. The two hosts are named as well as
        // the addresses read from the content, so a profile rewritten to a
        // different path on the same host is still refused.
        const contact = await page.locator('[data-cv-contact]').innerText();
        for (const entry of profiles) {
          expect(contact, `the contact line on ${route} writes no ${entry.network} address out`).not.toContain(entry.url);
        }
        for (const host of ['github.com', 'linkedin.com']) {
          expect(contact, `the contact line on ${route} names no ${host} address`).not.toContain(host);
        }
      });

      // The keyboard path, end to end, which is what the effort's criterion 8
      // asks for: tab to the control from the top of the page, see the ring
      // the stylesheet draws on :focus-visible, and press Enter to act on it.
      // Both palettes run this, because the ring is a token and a token can be
      // missing from one of them.
      //
      // What Enter starts depends on where the page was opened, and this is
      // the half where it opens the form: the marked address
      // (scripts/form-marker.mjs), which is the address the form opens at. The
      // half where Enter downloads the published PDF instead is asserted at the
      // plain address in tests/document-form.spec.ts, in the case that drives
      // the control by pointer and by key; the same file covers the no-script
      // path, where the control is the plain link at either address.
      test('takes focus from the keyboard, shows its ring, and acts on Enter', async ({ page }) => {
        await page.goto(`${route}${marker}`);
        const control = page.locator('.cv-actions [data-document-download]');

        // The header's controls come first in the reading order; 20 is more
        // presses than that and few enough to fail rather than hang.
        let focused = false;
        for (let press = 0; press < 20 && !focused; press += 1) {
          await page.keyboard.press('Tab');
          focused = await page.evaluate(() => !!document.activeElement?.matches('[data-document-download]'));
        }
        expect(focused, `the control on ${route} is reachable by Tab`).toBe(true);

        const ring = await control.evaluate((element) => {
          const style = getComputedStyle(element);
          return {
            visible: element.matches(':focus-visible'),
            width: style.outlineWidth,
            style: style.outlineStyle,
            colour: style.outlineColor,
          };
        });
        expect(ring.visible, `the control on ${route} matches :focus-visible`).toBe(true);
        expect(ring.style, `the outline style on ${route}`).toBe('solid');
        expect(Number.parseFloat(ring.width), `the outline width on ${route}`).toBeGreaterThan(0);
        expect(ring.colour, `the outline colour on ${route}`).not.toBe('rgba(0, 0, 0, 0)');

        await page.keyboard.press('Enter');
        await expect(page.locator('[data-document-dialog]'), `what Enter opens on ${route}`).toHaveAttribute('open', '');
      });

      // What the row no longer offers. The header navigation is what carries
      // a reader between the two documents, and the JSON Resume document
      // keeps its address without a link pointing at it.
      test('links neither the JSON Resume document nor the other document', async ({ page }) => {
        await page.goto(route);
        const other = variant === 'cv' ? 'resume' : 'cv';
        await expect(page.locator(`main a[href$="resume.json"]`)).toHaveCount(0);
        await expect(page.locator(`main a[href="${at(`/${locale}/${other}/`)}"]`)).toHaveCount(0);

        // The header's first list is the site's routes; the second holds the
        // language menu, whose own links to this route in the other language
        // are not what carries a reader between the two documents.
        const nav = page.getByRole('navigation', { name: strings[locale].nav.label }).locator('ul').first();
        await expect(nav.locator(`a[href="${at(`/${locale}/cv/`)}"]`)).toHaveCount(1);
        await expect(nav.locator(`a[href="${at(`/${locale}/resume/`)}"]`)).toHaveCount(1);
      });

      test('carries a contact line with the nationality and no contact detail', async ({ page }) => {
        await page.goto(route);
        const contact = page.locator('[data-cv-contact]');
        await expect(contact).toHaveCount(1);

        // The nationality is what a Saudi employer's eligibility gate reads,
        // and it is authored on the profile rather than inferred from the
        // location.
        await expect(contact).toContainText(profile.nationality[locale] ?? profile.nationality.en);
        await expect(contact).toContainText(profile.location[locale] ?? profile.location.en);

        // Nothing published carries an address or a number. The two slots the
        // download form fills are present, empty, and hidden, which is the
        // state a published document is in and the state the page returns to
        // after one is generated.
        expect(await contact.innerText()).not.toContain(profile.email);
        await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
        for (const slot of ['email', 'phone']) {
          const item = contact.locator(`[data-contact-slot="${slot}"]`);
          await expect(item, `the ${slot} slot`).toHaveCount(1);
          await expect(item).toBeHidden();
          expect(await item.locator('span').first().textContent()).toBe('');
        }
      });

      test('carries no positioned element inside the document', async ({ page }) => {
        await page.goto(route);
        // The fourth thing the effort's criterion 7 names, beside the table,
        // the image, and the contact block's place in the flow: a resume
        // parser reads a positioned header or footer out of order, or not at
        // all. `documentHazards` in scripts/check-dist.mjs proves the other
        // three from the built HTML; this one needs layout, so it is here.
        //
        // Scoped to the document, not the page. The site's own accessible
        // names are `sr-only`, which Tailwind implements as
        // `position: absolute`, and the download form is a `<dialog>`, which
        // is positioned whenever it is open. Both sit outside `article.cv`
        // and neither prints, which is why the document is the right subject
        // and a page-wide rule would refuse the site's own markup.
        const positioned = await page.evaluate(() =>
          [...document.querySelectorAll('article.cv *')]
            .filter((element) => ['fixed', 'absolute'].includes(getComputedStyle(element).position))
            .map((element) => `${element.tagName.toLowerCase()}.${element.className}`),
        );
        expect(positioned, `positioned elements inside the document on ${route}`).toEqual([]);
      });

      test('separates the contact line with a bar after every item but the last', async ({ page }) => {
        await page.goto(route);
        // The bars are trailing, so hiding the two slots at the head of the
        // line cannot strand one. What that has to hold on paper, in both
        // directions, is no leading bar and no doubled bar: exactly one fewer
        // visible bar than there are visible items.
        const items = page.locator('[data-cv-contact] > li:not([hidden])');
        const bars = page.locator('[data-cv-contact] > li:not([hidden]) > [aria-hidden="true"]:visible');
        await expect(bars).toHaveCount((await items.count()) - 1);

        const last = page.locator('[data-cv-contact] > li:not([hidden])').last();
        await expect(last.locator('[aria-hidden="true"]')).toBeHidden();
      });
    });
  }

  test(`the CV page in ${locale} keeps its course list`, async ({ page }) => {
    await page.goto(at(`/${locale}/cv/`));
    // The course list under the education entry is what the resume drops.
    const course = courseNames(locale)[0];
    if (course) await expect(page.locator('[data-cv-section="education"]')).toContainText(course);
  });

  test(`the resume page in ${locale} is compact, drops the course list, and lists a skill group per line`, async ({
    page,
  }) => {
    await page.goto(at(`/${locale}/resume/`));
    await expect(page.locator('article.cv.cv-compact')).toHaveCount(1);

    const course = courseNames(locale)[0];
    if (course) await expect(page.locator('[data-cv-section="education"]')).not.toContainText(course);

    // One line per group rather than the CV's keyword columns, so the count
    // is the number of skill groups and each line names its group.
    const skills = entries('skills');
    const lines = page.locator('[data-cv-section="skills"] > ul > li');
    await expect(lines).toHaveCount(skills.length);
    await expect(page.locator('[data-cv-section="skills"] .cv-skills')).toHaveCount(0);
  });

  // The shorter project entry, which is a third of what buys the one page.
  // Asserted on both documents at once, because what matters is the
  // difference: the resume prints the name, the period, the role, and the
  // summary, and the CV prints those and the two lines the resume drops.
  test(`a project entry in ${locale} keeps its technologies and repository on the CV and drops them on the resume`, async ({
    page,
  }) => {
    const t = strings[locale];
    const marked = projects.filter((data) => onResume(data));

    await page.goto(at(`/${locale}/cv/`));
    for (const project of marked) {
      const entry = page.locator('[data-cv-section="projects"] > ol > li', { hasText: project.name });
      await expect(entry, `${project.name} on the CV`).toContainText(t.project.technologies);
      const repository = published(project);
      if (repository) await expect(entry.locator(`a[href="${repository}"]`)).toHaveCount(1);
      else await expect(entry.locator('a'), `${project.name} on the CV`).toHaveCount(0);
    }

    await page.goto(at(`/${locale}/resume/`));
    for (const project of marked) {
      const entry = page.locator('[data-cv-section="projects"] > ol > li', { hasText: project.name });
      // The four lines it does print, and nothing after them.
      await expect(entry.locator('h3')).toHaveText(project.name);
      await expect(entry.locator('p')).toHaveText([
        formatPeriod(locale, project.period),
        // The Arabic of a project field is optional in the contract, so the
        // page falls back to the English (src/lib/localized.ts) and the
        // expectation has to fall back with it, as `courseNames` does above.
        project.role[locale] ?? project.role.en,
        project.summary[locale] ?? project.summary.en,
      ]);
      await expect(entry, `${project.name} on the resume`).not.toContainText(t.project.technologies);
      await expect(entry.locator('a'), `${project.name} on the resume`).toHaveCount(0);
    }
  });
}

// Which profile is the code is decided once, in src/lib/networks.ts, and the
// component, the dist check, and the header case above all ask it. Asserted
// where it is decided: every spelling `profileIcon` recognises gives the same
// entry, and a list with no LinkedIn profile gives nothing rather than the
// first entry or GitHub's.
test('the coded profile is the LinkedIn one, by network and in any spelling', () => {
  const github = { network: 'GitHub', url: 'https://github.com/example' };
  for (const network of ['linkedin', 'LinkedIn', ' LINKEDIN ']) {
    const linkedin = { network, url: 'https://www.linkedin.com/in/example' };
    expect(codedProfile([github, linkedin]), `spelled ${JSON.stringify(network)}`).toBe(linkedin);
    expect(codedProfile([linkedin, github]), `spelled ${JSON.stringify(network)}, listed first`).toBe(linkedin);
  }
  expect(codedProfile([github])).toBeUndefined();
  expect(codedProfile([])).toBeUndefined();
});
