import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { parse as parseYaml } from 'yaml';
import { fill, plural, strings } from '../src/lib/i18n';
import { profileIcon } from '../src/lib/networks';
import { isCertification, isCourse, isShown } from '../src/lib/shown';
import { technologyMark } from '../src/lib/technologies';
import { byStartAscending } from '../src/lib/order';
import { journey } from '../src/lib/timeline';
import { at, locales, type Locale } from './pages';

// The home page: the hero, the contact actions, the skill cards, and one card
// per section of the site. What the page says about the content is checked
// against src/content/ itself, read here the way scripts/check-dist.mjs reads
// it, so a count that drifts from the source fails rather than being believed.

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

// The certificates collection is two sections, told apart by the field the
// page reads (src/lib/shown.ts), so a card's count follows a reclassification
// in the content without this file being touched.
const certificates = visibleEntries('certificates').map(
  (file) => entryData('certificates', file) as { kind: 'course' | 'certification' },
);

// What each section card must say it holds: the number of entries that
// section renders, computed from src/content/ the way the page computes it.
const counted = {
  experience: visibleEntries('experience').length,
  projects: visibleEntries('projects').length,
  education: visibleEntries('education').length,
  courses: certificates.filter(isCourse).length,
  certifications: certificates.filter(isCertification).length,
  skills: skillEntries.length,
};

// The line a section card shows for one collection, worded as the page words
// it: the number, and the form of the noun the language gives that number.
function countLine(locale: Locale, collection: keyof typeof counted): string {
  const t = strings[locale];
  const n = counted[collection];
  return fill(t.home.counts.line, { count: String(n), noun: plural(locale, n, t.home.counts.nouns[collection]) });
}

// The sections of the site, in the order the home page indexes them, each
// with the heading it leads to on the page that holds it and the collection
// it counts. The certifications heading keeps the `certificates` id an
// inbound link may already carry. The CV is one document rather than a list
// of entries, so it counts nothing.
const sections: {
  section: string;
  href: (locale: Locale) => string;
  name: (locale: Locale) => string;
  counts?: keyof typeof counted;
}[] = [
  {
    section: 'experience',
    href: (locale) => `${at(`/${locale}/work/`)}#experience`,
    name: (locale) => strings[locale].sections.experience,
    counts: 'experience',
  },
  {
    section: 'projects',
    href: (locale) => `${at(`/${locale}/work/`)}#projects`,
    name: (locale) => strings[locale].sections.projects,
    counts: 'projects',
  },
  {
    section: 'education',
    href: (locale) => `${at(`/${locale}/education/`)}#studies`,
    name: (locale) => strings[locale].nav.education,
    counts: 'education',
  },
  {
    section: 'courses',
    href: (locale) => `${at(`/${locale}/education/`)}#courses`,
    name: (locale) => strings[locale].sections.courses,
    counts: 'courses',
  },
  // The certifications card exists only while the content has a
  // certification, as the section it leads to does; with none, the page shows
  // no card rather than one counting zero, and the case below says so.
  ...(counted.certifications > 0
    ? [
        {
          section: 'certifications',
          href: (locale: Locale) => `${at(`/${locale}/education/`)}#certificates`,
          name: (locale: Locale) => strings[locale].sections.certifications,
          counts: 'certifications' as const,
        },
      ]
    : []),
  {
    section: 'skills',
    href: (locale) => `${at(`/${locale}/`)}#skills`,
    name: (locale) => strings[locale].sections.skills,
    counts: 'skills',
  },
  {
    section: 'cv',
    href: (locale) => at(`/${locale}/cv/`),
    name: (locale) => strings[locale].nav.cv,
  },
  // The two documents are the last cards, the resume after the CV. Neither
  // is a list of entries, so neither counts anything.
  {
    section: 'resume',
    href: (locale) => at(`/${locale}/resume/`),
    name: (locale) => strings[locale].nav.resume,
  },
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

const reading = [
  'main h1',
  '[data-hero-label]',
  '[data-hero-summary]',
  '[data-contact-actions]',
  '[data-skill-grid]',
  '[data-section-grid]',
];

for (const locale of locales) {
  test.describe(`the home page in ${locale}`, () => {
    test('reads as a hero, then the contact actions, then the cards', async ({ page }) => {
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
      // GitHub is the first action as it is the first profile; every other
      // profile follows it, each with its network's mark where the icon set
      // has one (src/lib/networks.ts), the LinkedIn profile among them.
      await expect(actions.first()).toHaveAttribute('data-contact', 'github');
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
      await expect(cv.locator('svg')).toHaveAttribute('data-icon', 'file');
      await expect(cv).toHaveAccessibleName(strings[locale].nav.cv);

      const resume = page.locator('[data-contact="resume"]');
      await expect(resume).toHaveAttribute('href', at(`/${locale}/resume/`));
      await expect(resume.locator('svg')).toHaveAttribute('data-icon', 'file');
      await expect(resume).toHaveAccessibleName(strings[locale].nav.resume);
    });

    test('shows every skill group as a card with its keywords', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const cards = page.locator('[data-skill-card]');
      await expect(cards).toHaveCount(skillEntries.length);

      for (const entry of skillEntries) {
        const card = cards.filter({ has: page.getByRole('heading', { name: entry.name[locale], exact: true }) });
        await expect(card, `the card for ${entry.name.en}`).toHaveCount(1);
        // Every keyword a badge, in the content's order and spelling, with a
        // mark exactly where src/lib/technologies.ts has one, drawn in the
        // text colour and hidden from assistive technology.
        const badges = await card.locator('[data-badge]').evaluateAll((nodes) =>
          nodes.map((node) => {
            const svg = node.querySelector('svg');
            return { name: node.textContent?.trim(), mark: svg ? `${svg.getAttribute('aria-hidden')} ${svg.getAttribute('fill')}` : null };
          }),
        );
        expect(badges, `the badges on ${entry.name.en}`).toEqual(
          entry.keywords.map((name: string) => ({ name, mark: technologyMark(name) ? 'true currentColor' : null })),
        );
        if (entry.level) await expect(card).toContainText(entry.level[locale]);
      }
    });

    test('shows one card per section, in the order the site reads in', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const cards = page.locator('[data-section-card]');
      await expect(cards).toHaveCount(sections.length);

      // Experience before projects, on the home page as everywhere else
      // (requirement 4), and the order asserted from the page rather than
      // read off the template.
      const order = await cards.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('data-section-card')));
      expect(order, `the section cards on /${locale}/`).toEqual(sections.map((section) => section.section));
    });

    test('shows a certifications card only while the content has a certification', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const card = page.locator('[data-section-card="certifications"]');
      await expect(card).toHaveCount(counted.certifications > 0 ? 1 : 0);
      // Nothing on the page says "0 certifications": the count line a card
      // would carry for zero, worded the way the page words it.
      if (counted.certifications === 0) {
        const t = strings[locale];
        const zero = fill(t.home.counts.line, { count: '0', noun: plural(locale, 0, t.home.counts.nouns.certifications) });
        expect(await page.locator('body').innerText(), `the zero count on /${locale}/`).not.toContain(zero);
      }
    });

    test('leads each section card to its heading and counts what it holds', async ({ page }) => {
      await page.goto(at(`/${locale}/`));

      for (const section of sections) {
        const card = page.locator(`[data-section-card="${section.section}"]`);
        await expect(card, `the ${section.section} card on /${locale}/`).toHaveAttribute('href', section.href(locale));
        await expect(card.locator('h3')).toHaveText(section.name(locale));
        if (section.counts) {
          await expect(card.locator('[data-counts]'), `the count on the ${section.section} card`).toHaveText(
            countLine(locale, section.counts),
          );
        } else {
          await expect(card.locator('[data-counts]'), `the ${section.section} card counts nothing`).toHaveCount(0);
        }
      }
    });

    test('lands each section card on the heading it names', async ({ page }) => {
      // The anchors are addresses on other pages, so following one is what
      // proves the heading is there to land on.
      for (const section of sections) {
        const href = section.href(locale);
        const anchor = href.includes('#') ? href.slice(href.indexOf('#') + 1) : undefined;
        if (!anchor) continue;
        await page.goto(href);
        await expect(page.locator(`h2#${anchor}`), `${href} lands on a heading`).toHaveCount(1);
      }
    });

    test('offers the two documents last, the resume after the CV', async ({ page }) => {
      // The CV and the resume are documents rather than lists of entries, so
      // each says what it holds, counts nothing, and comes after the sections
      // (requirement 8, and requirement 4's order).
      await page.goto(at(`/${locale}/`));

      const order = await positions(page, ['[data-section-card="cv"]', '[data-section-card="resume"]']);
      expect(order, 'both document cards are on the page').not.toContain(-1);
      expect(order[1], 'the resume card comes after the CV card').toBeGreaterThan(order[0]!);
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

const grids = { 'the skill grid': '[data-skill-grid]', 'the section grid': '[data-section-grid]' };

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

// The timeline from study to work: the nodes in the order `journey` gives,
// read from src/content/ as the page reads it; each with its kind's icon
// hidden from assistive technology and the kind said instead; and each
// leading to an id that exists on the page it names.
const journeyOrder = (() => {
  const dir = (name: string): Record<string, any>[] =>
    readdirSync(path.join(content, name))
      .filter((file) => file.endsWith('.yaml'))
      .sort()
      .map((file) => ({ id: file.replace(/\.yaml$/, ''), ...entryData(name, file) }));
  const education = dir('education').sort(byStartAscending as (a: any, b: any) => number);
  const courses = dir('certificates').filter((entry) => isCourse(entry as { kind: 'course' | 'certification' }));
  const experience = dir('experience');
  return journey(education, experience, courses, (entry: any) => entry.period.start).map((item) =>
    item.kind === 'courses' ? { kind: 'courses', href: '/education/#courses' } : item.kind === 'experience'
      ? { kind: 'experience', href: `/work/#experience-${(item.entry as { id: string }).id}` }
      : { kind: 'education', href: `/education/#education-${(item.entry as { id: string }).id}` },
  );
})();

const journeyIcons = { experience: 'briefcase', education: 'graduation-cap', courses: 'book-open' } as const;

for (const locale of locales) {
  test.describe(`the timeline on /${locale}/`, () => {
    test('lays out every node, newest first, each with its kind', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      await expect(page.locator('h2#journey')).toContainText(strings[locale].journey.heading);
      await expect(page.locator('h2#journey svg')).toHaveAttribute('aria-hidden', 'true');
      const nodes = page.locator('[data-journey] [data-journey-node]');
      const found = await nodes.evaluateAll((items) =>
        items.map((item) => ({ kind: item.getAttribute('data-journey-node'), href: item.getAttribute('href') })),
      );
      expect(found).toEqual(journeyOrder.map((node) => ({ kind: node.kind, href: at(`/${locale}${node.href}`) })));
      for (const [index, node] of journeyOrder.entries()) {
        const item = nodes.nth(index);
        await expect(item.locator(`svg[data-icon="${journeyIcons[node.kind as keyof typeof journeyIcons]}"]`)).toHaveAttribute('aria-hidden', 'true');
        await expect(item.locator('.sr-only')).toHaveText(`${strings[locale].journey.kinds[node.kind as keyof typeof journeyIcons]}: `);
      }
      await expect(page.locator('[data-journey] > li')).toHaveCount(journeyOrder.length);
    });

    test('leads every node to an id on the page it names', async ({ page }) => {
      for (const node of journeyOrder) {
        const address = at(`/${locale}${node.href}`);
        const [target, id] = address.split('#');
        await page.goto(target!);
        await expect(page.locator(`[id="${id}"]`), `${id} on ${target}`).toHaveCount(1);
      }
    });

    test('draws the rail on the reading start, at 3:1 with its markers', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const found = await page.evaluate(() => {
        const rail = document.querySelector('[data-journey]')!;
        const style = getComputedStyle(rail);
        const parse = (value: string) => (value.match(/[\d.]+/g) ?? []).slice(0, 3).map(Number);
        const luminance = (rgb: number[]) => {
          const [r, g, b] = rgb.map((v) => {
            const c = v / 255;
            return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
          });
          return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
        };
        const page = luminance(parse(getComputedStyle(document.documentElement).backgroundColor));
        const ratio = (colour: string) => {
          const l = luminance(parse(colour));
          return (Math.max(l, page) + 0.05) / (Math.min(l, page) + 0.05);
        };
        const marker = document.querySelector('[data-journey-marker]')!;
        const box = rail.getBoundingClientRect();
        const dot = marker.getBoundingClientRect();
        return {
          left: parseFloat(style.borderLeftWidth),
          right: parseFloat(style.borderRightWidth),
          rail: ratio(document.documentElement.dir === 'rtl' ? style.borderRightColor : style.borderLeftColor),
          marker: ratio(getComputedStyle(marker).backgroundColor),
          markerNearRight: Math.abs(dot.right - box.right) < 12,
          markerNearLeft: Math.abs(dot.left - box.left) < 12,
        };
      });
      if (locale === 'ar') {
        expect(found.right, 'the rail on the right').toBeGreaterThan(0);
        expect(found.left).toBe(0);
        expect(found.markerNearRight, 'the markers on the rail').toBe(true);
      } else {
        expect(found.left, 'the rail on the left').toBeGreaterThan(0);
        expect(found.right).toBe(0);
        expect(found.markerNearLeft, 'the markers on the rail').toBe(true);
      }
      expect(found.rail, 'the rail against the page').toBeGreaterThanOrEqual(3);
      expect(found.marker, 'a marker against the page').toBeGreaterThanOrEqual(3);
    });
  });

  test.describe(`the timeline on /${locale}/ with JavaScript disabled`, () => {
    test.use({ javaScriptEnabled: false });

    test('shows every node', async ({ page }) => {
      await page.goto(at(`/${locale}/`));
      const nodes = page.locator('[data-journey] [data-journey-node]');
      await expect(nodes).toHaveCount(journeyOrder.length);
      for (const node of await nodes.all()) await expect(node).toBeVisible();
    });
  });
}
