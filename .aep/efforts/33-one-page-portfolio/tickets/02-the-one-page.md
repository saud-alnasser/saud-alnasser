---
status: open
blocked-by: [01]
---

# feat(site): the home page holds every section of the portfolio

## Outcome

The home page carries About, Experience, Projects, Education, and Skills, in that order, each a `section` labelled by its heading, with the ids the plan's Interfaces give. Experience, Projects (the featured card, the filter, and the grid), and Education (the studies timeline, the courses, and the certifications) are moved in from the work and education pages with their markup, sorting, and behaviour unchanged. The monogram, the combined timeline, and the "On this site" grid are gone, along with the components, the `journey()` function, and the strings only they used. The work and education pages still render as they do now: ticket 03 turns them into forwards.

## Acceptance Criteria

- [ ] No page renders a monogram. The `h1` is the first element in the first screen and carries `id="about"` (requirement 2, criterion 2; requirement 3, criterion 3).
- [ ] The home page in both languages has the headings `about`, `experience`, `projects`, `education`, and `skills` in that order. Each sits in its own `section[aria-labelledby]` and carries `data-section`. `courses` and `certificates` are `h3` headings inside Education, and the certificate cards there take `h4` through the new `level` prop on `Certificate.astro` (requirement 3, criterion 3).
- [ ] Every shown project, every experience entry, every education entry, and every course and certification card renders on the home page, with the entries' own ids. The filter, the featured card, the folds, and the certificate dialog behave on the home page as the work and education suites assert today. Those assertions, run against the home page, pass (requirement 3, criterion 3; requirement 9, criterion 9).
- [ ] The built home pages hold no `[data-journey]` and no `[data-section-grid]`. `Monogram.astro`, `Journey.astro`, `SectionCard.astro`, `journey()` and its tests, and every string only they read are removed. The strings check passes and the gap report does not grow (requirement 3, criterion 3; requirement 10, criterion 10).
- [ ] The contrast, layout, motion, and no-script suites cover the home page's new sections in both languages and both palettes, and pass (requirement 9, criterion 9).
- [ ] Lighthouse over the built home pages, run locally on the mobile profile, scores 90 or more on performance, accessibility, and best practices. The scores are recorded in Notes (requirement 9, criterion 9).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/pages/[locale]/index.astro`, `work/index.astro`, `education/index.astro`; `src/components/Certificate.astro`, `Monogram.astro`, `Journey.astro`, `SectionCard.astro`; `src/lib/timeline.ts`, `src/lib/i18n.ts`; `src/styles/global.css` (the hero's stagger names the monogram); `tests/home.spec.ts`, `work.spec.ts`, `education.spec.ts`, `certificates.spec.ts`, `contrast.spec.ts`, `layout.spec.ts`, `motion.spec.ts`, `periods.spec.ts`, `tests/timeline.test.mjs`; `scripts/check-dist.mjs`; `scripts/test-content-mechanism.mjs`.

## Constraints

- Move the assertions, never weaken them. Where a suite asserted on `/work/` or `/education/`, the same assertion runs on `/`, scoped to the matching `section`. The old pages' own tests stay until ticket 03 replaces the pages.
- Only one certificate dialog on the page, outside `main`, as the layout's comment requires.
- Local Lighthouse: `pnpm lighthouse` fails here with a permission error in Chrome's temp cleanup. Use a runner with its own `userDataDir`, as effort 31 did, and record which one.
