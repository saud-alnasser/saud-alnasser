---
status: resolved
blocked-by: [03]
---

# feat(site): the online courses open inside the education timeline, and the courses grid goes

## Outcome

The timeline's online-courses node is a native disclosure, `CourseList.astro`, as the plan's Components describes. Opened, it lists every course newest first, and each course opens its certificate in the page's dialog. The separate courses section and its grid are gone. The certificate data a card and a course item both carry comes from one module, `src/lib/certificates.ts`.

## Acceptance Criteria

- [x] The home page has no `data-grid="courses"` and no courses heading. `[data-courses-node]` is a `details` with `id="courses"`, whose `[data-course-list]` holds one item per course, in `byDateDescending` order with the undated last (requirement 6, criterion 6). Verified: `dist/en/index.html` has one `<details id="courses" data-courses-node>` holding 26 `data-entry="course"` rows and no `data-grid="courses"`. The education and certificates suites assert the list count and the `byDateDescending` order, with the undated last, and that no courses heading or grid exists.
- [x] Pressing a course item opens the dialog with that certificate's preview and caption, and closing it returns focus to the item. With JavaScript disabled, the disclosure opens and each item's `href` is its PDF (requirement 6, criterion 6). Verified: the certificates suite opens the node, clicks a course, and asserts the dialog preview, caption, size, and PDF link. Escape and the close control each return focus to that course. With JavaScript disabled, the node opens on its summary and every course and card is an `a` whose `href` ends `.pdf`. All passed in both locales and palettes.
- [x] Opening `/en/#courses` scrolls the node into view below the header (requirement 6, criterion 6). Verified: a new case in `tests/education.spec.ts` opens `/{en,ar}/#courses` and finds the node's top at or below the header's bottom and inside the viewport. It passed.
- [x] `Certificate.astro` and `CourseList.astro` both read `certificateDocument()` from `src/lib/certificates.ts`. Neither holds its own glob (requirement 6, criterion 6). Verified: `src/lib/certificates.ts` holds the only PDF and preview globs for certificates. `Certificate.astro` and `CourseList.astro` both call `documentAttributes()`.
- [x] The certifications section is unchanged and still renders only while a certification exists (requirement 6, criterion 6). Verified: the certifications markup in `index.astro` is unchanged apart from its comment. The certificates suite's absent-kind case still finds no `#certificates` anchor or grid while no certification exists, and the mechanism test's fixture certification still brings the section back.
- [x] `tests/education.spec.ts`, `tests/certificates.spec.ts`, `tests/home.spec.ts`, `tests/motion.spec.ts`, and `tests/periods.spec.ts` move from the grid to the list. The dialog, order, count, contrast-open, and no-horizontal-scroll assertions are kept, not dropped (requirement 9, criterion 9). Verified: the dialog, order, count, contrast (now audited with the courses open too), no-horizontal-scroll-with-the-courses-open, no-script, and reading-direction cases all remain, now over the list. The reading-direction case compares a row's name with its details rather than two grid cards. The five suites passed, and the full run passed 1048 of 1048.
- [x] Strings used only by the removed section are gone from both languages, and any new one exists in both (requirement 11, criterion 11). Verified: `sections.courses` and `onlineCourses.link` are gone from both languages. `onlineCourses.show` and `onlineCourses.hide` exist in both. `pnpm check` reported 0 errors under the `Strings` type.
- [x] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0 (requirement 9, criterion 9). Verified: `pnpm check` 0 errors and 0 warnings; `pnpm build` "[localized] 0 gaps"; `pnpm check:dist` 0; `pnpm exec playwright test` 1048 passed; `pnpm test:content` 0, printing "unopenable: dist/en/index.html renders \"fixture-certificate-without-document-7b1d0a\" as <div> with no link and no document".

## Relevant areas

`src/pages/[locale]/index.astro` (the timeline and the courses section), `src/components/Certificate.astro`, `src/components/CourseList.astro` (new), `src/lib/certificates.ts` (new), `src/layouts/Base.astro` (the dialog script, read only), `src/styles/global.css` (fold rules), `src/lib/i18n.ts`, the tests named above, `src/content/README.md` ("education/", which describes the grid).

## Constraints

- The dialog script is not changed. The list items carry the same `data-document` attributes the cards do.
- The stat tile's certificate count is unchanged.

## Notes

- The helper the plan named `certificateDocument(entry, locale)` landed as `documentAttributes(document, caption)`. It takes the document path and the caption rather than the entry, so the localized name is read once, by the caller that prints it, and the gap report counts it once. It returns the data attributes the dialog reads rather than an object each caller maps onto them.
- `tests/periods.spec.ts` needed no change: the node still carries `data-period`.
