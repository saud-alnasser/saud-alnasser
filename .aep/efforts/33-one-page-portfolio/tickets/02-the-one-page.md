---
status: resolved
blocked-by: [01]
---

# feat(site): the home page holds every section of the portfolio

## Outcome

The home page carries About, Experience, Projects, Education, and Skills, in that order, each a `section` labelled by its heading, with the ids the plan's Interfaces give. Experience, Projects (the featured card, the filter, and the grid), and Education (the studies timeline, the courses, and the certifications) are moved in from the work and education pages with their markup, sorting, and behaviour unchanged. The monogram, the combined timeline, and the "On this site" grid are gone, along with the components, the `journey()` function, and the strings only they used. The work and education pages still render as they do now: ticket 03 turns them into forwards.

## Acceptance Criteria

- [x] No page renders a monogram. The `h1` is the first element in the first screen and carries `id="about"` (requirement 2, criterion 2; requirement 3, criterion 3). Verified: `pnpm test` passed "carries no monogram, no combined timeline, and no section grid" in both languages, which asserts no `[data-monogram]`, the hero's first element an `h1` with `id="about"`; the dist check's new "one page" check found no page carrying `data-monogram`.
- [x] The home page in both languages has the headings `about`, `experience`, `projects`, `education`, and `skills` in that order. Each sits in its own `section[aria-labelledby]` and carries `data-section`. `courses` and `certificates` are `h3` headings inside Education, and the certificate cards there take `h4` through the new `level` prop on `Certificate.astro` (requirement 3, criterion 3). Verified: `pnpm test` passed "holds the five sections in order, each labelled by its heading" in both languages (ids, `h1`/`h2`, each inside `section[aria-labelledby]` with a region of that name, `h3#courses` inside Education, the course cards' names at `h4`); `pnpm check:dist` printed "dist/en/index.html holds #about, #experience, #projects, #education, #skills in order" and the same for Arabic.
- [x] Every shown project, every experience entry, every education entry, and every course and certification card renders on the home page, with the entries' own ids. The filter, the featured card, the folds, and the certificate dialog behave on the home page as the work and education suites assert today. Those assertions, run against the home page, pass (requirement 3, criterion 3; requirement 9, criterion 9). Verified: the work, education, and certificates suites now run every case on `/` as well as on the old pages, and `pnpm test` passed them all there (for example "/saud-alnasser/en/ puts every entry inside a card", the filter by mouse and keyboard, the featured card, the folds, and the dialog from both grids); "keeps every entry id an address can name" passed for every experience and education id.
- [x] The built home pages hold no `[data-journey]` and no `[data-section-grid]`. `Monogram.astro`, `Journey.astro`, `SectionCard.astro`, `journey()` and its tests, and every string only they read are removed. The strings check passes and the gap report does not grow (requirement 3, criterion 3; requirement 10, criterion 10). Verified: the dist check's "one page" check passed, and a probe adding `data-journey` to `dist/en/index.html` failed it with "dist/en/index.html still carries data-journey"; the three components, `journey()`, its unit tests, and the `journey`, `home.sections`, section-card, and unused count strings are removed in both languages; `pnpm check` 0 errors; the build printed "[localized] 0 gaps".
- [x] The contrast, layout, motion, and no-script suites cover the home page's new sections in both languages and both palettes, and pass (requirement 9, criterion 9). Verified: `pnpm test` passed 1068 cases in both palettes. The contrast and layout suites audit `/` through `tests/pages.ts`; the raised card, badge fold, and filter chip contrast cases run on `/` as well as `/work/`; the motion suite's card, fold, dialog, and reveal cases run on `/`; the no-script cases for the fold, the filter, the certificate links, and the tiles run on `/`.
- [x] Lighthouse over the built home pages, run locally on the mobile profile, scores 90 or more on performance, accessibility, and best practices. The scores are recorded in Notes (requirement 9, criterion 9). Verified: three mobile runs of each, recorded in Notes: `/en/` 97, 100, 96 and `/ar/` 93, 100, 96.
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9). Verified: build 0 ("[localized] 0 gaps"), check 0 (0 errors), check:dist 0 after `pnpm render:pdf`, test 0 (1068 passed), test:content 0 (the fixtures present in both home pages, "test-content-mechanism: passed"), scan:history 0 on the ticket's commit.

## Relevant areas

`src/pages/[locale]/index.astro`, `work/index.astro`, `education/index.astro`; `src/components/Certificate.astro`, `Monogram.astro`, `Journey.astro`, `SectionCard.astro`; `src/lib/timeline.ts`, `src/lib/i18n.ts`; `src/styles/global.css` (the hero's stagger names the monogram); `tests/home.spec.ts`, `work.spec.ts`, `education.spec.ts`, `certificates.spec.ts`, `contrast.spec.ts`, `layout.spec.ts`, `motion.spec.ts`, `periods.spec.ts`, `tests/timeline.test.mjs`; `scripts/check-dist.mjs`; `scripts/test-content-mechanism.mjs`.

## Constraints

- Move the assertions, never weaken them. Where a suite asserted on `/work/` or `/education/`, the same assertion runs on `/`, scoped to the matching `section`. The old pages' own tests stay until ticket 03 replaces the pages.
- Only one certificate dialog on the page, outside `main`, as the layout's comment requires.
- Local Lighthouse: `pnpm lighthouse` fails here with a permission error in Chrome's temp cleanup. Use a runner with its own `userDataDir`, as effort 31 did, and record which one.

## Notes

- Lighthouse was run locally with `lighthouse` 12.6.1 and `chrome-launcher` 1.2.1 from the lockfile, through a scratch runner that gives Chrome a fresh profile directory for each run, on the mobile profile. Three runs of each page scored the same: `/en/` at 97 performance, 100 accessibility, and 96 best practices; `/ar/` at 93, 100, and 96.
- Projects carry no id of their own, on the old work page or here, so the ids that keep working are the experience and education entries', `courses`, and `certificates`.
- The work, education, and certificates suites run every case on both `/` and the old page, so ticket 03 removes the old rows rather than moving anything again. The contrast and motion cases that named `/work/` or `/education/` now name `/`, and the old pages keep the whole-page audits through `tests/pages.ts`.
- The light behind the first screen now comes after the name in the markup, so the `h1` is the block's first element, and it still enters with the first step.
- The Education heading reads `nav.education`, as the old home card did. "Studies" stays on the old education page only.
