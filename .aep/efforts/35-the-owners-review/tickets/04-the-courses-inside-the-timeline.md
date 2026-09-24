---
status: open
blocked-by: [03]
---

# feat(site): the online courses open inside the education timeline, and the courses grid goes

## Outcome

The timeline's online-courses node is a native disclosure, `CourseList.astro`, as the plan's Components describes. Opened, it lists every course newest first, and each course opens its certificate in the page's dialog. The separate courses section and its grid are gone. The certificate data a card and a course item both carry comes from one module, `src/lib/certificates.ts`.

## Acceptance Criteria

- [ ] The home page has no `data-grid="courses"` and no courses heading. `[data-courses-node]` is a `details` with `id="courses"`, whose `[data-course-list]` holds one item per course, in `byDateDescending` order with the undated last (requirement 6, criterion 6).
- [ ] Pressing a course item opens the dialog with that certificate's preview and caption, and closing it returns focus to the item. With JavaScript disabled, the disclosure opens and each item's `href` is its PDF (requirement 6, criterion 6).
- [ ] Opening `/en/#courses` scrolls the node into view below the header (requirement 6, criterion 6).
- [ ] `Certificate.astro` and `CourseList.astro` both read `certificateDocument()` from `src/lib/certificates.ts`. Neither holds its own glob (requirement 6, criterion 6).
- [ ] The certifications section is unchanged and still renders only while a certification exists (requirement 6, criterion 6).
- [ ] `tests/education.spec.ts`, `tests/certificates.spec.ts`, `tests/home.spec.ts`, `tests/motion.spec.ts`, and `tests/periods.spec.ts` move from the grid to the list. The dialog, order, count, contrast-open, and no-horizontal-scroll assertions are kept, not dropped (requirement 9, criterion 9).
- [ ] Strings used only by the removed section are gone from both languages, and any new one exists in both (requirement 11, criterion 11).
- [ ] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/pages/[locale]/index.astro` (the timeline and the courses section), `src/components/Certificate.astro`, `src/components/CourseList.astro` (new), `src/lib/certificates.ts` (new), `src/layouts/Base.astro` (the dialog script, read only), `src/styles/global.css` (fold rules), `src/lib/i18n.ts`, the tests named above, `src/content/README.md` ("education/", which describes the grid).

## Constraints

- The dialog script is not changed. The list items carry the same `data-document` attributes the cards do.
- The stat tile's certificate count is unchanged.
