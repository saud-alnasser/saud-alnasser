---
status: resolved
blocked-by: [01]
---

# feat(site): a header that fits a phone in two tidy rows, with the current page marked beyond colour

## Outcome

Below the `sm` breakpoint the header is two rows. The first holds the site name at the start and the language and theme controls at the end. The second holds the navigation spread across the full width without wrapping. From `sm` up it is the one row it is today. The divider is gone. The current page carries an accent bar as well as `aria-current`, and every target in the header is at least 24 by 24.

## Acceptance Criteria

- [x] At 360 pixels, in English and in Arabic, the navigation's items share one `offsetTop`, the header spans at most two rows of controls, and no element with a border on its inline start begins a row (requirement 11, criterion 11).
- [x] Exactly one navigation link carries `aria-current="page"`, and it has a visible bar that is not a text colour, asserted by its computed box or pseudo-element on every route (requirement 11, criterion 11).
- [x] Every link and button in the header measures at least 24 by 24 CSS pixels at 360 and at 1440 (requirement 11, criterion 11).
- [x] At 1440 the header is one row and shares the page's column, and the existing column test passes (requirement 13, criterion 13).
- [x] Both themes meet the contrast criterion on the bar and the links, and in Arabic the controls sit at the left end of row one (requirement 12, criterion 12).
- [x] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm lighthouse` exit 0 with every score at least 90 (requirement 13, criterion 13).

## Relevant areas

`src/layouts/Base.astro` (the header); `src/components/LanguageMenu.astro` (its list is anchored to the header row); `tests/layout.spec.ts`, `tests/menu.spec.ts`.

## Constraints

- The language menu still opens, closes on Escape and on a click outside, and works without script. Its list stays anchored under its control in both rows.
- The header keeps the `view-transition-name` ticket 01 gave it.

## Notes

The controls left the `nav` element. On a phone they share the first row with the name while the navigation takes the second, and one flex row can place them there only as siblings. The source order is the wide layout's, name, navigation, controls, which is the order a keyboard reaches them in at every width; on a phone the navigation moves last by `order` alone.

The language list now hangs from its own control rather than from the header row. The row-wide list existed because a wrapped phone header used to put the control at the start of a row. The control now ends the first row at every width, so a list anchored at its end edge opens under it and stays inside the column. The menu's comment says so.

## What verified each criterion, on 2026-09-24

- **Two rows on a phone.** `tests/layout.spec.ts`, "lays the header in two rows with the navigation on one line", passed on all 10 pages in both palettes at 360: the five links share one `offsetTop`, the header's targets fall into two rows, no header element has a border on its inline start alone, and nothing scrolls sideways.
- **The current page.** "marks its own link with aria-current and a bar" passed on all 10 pages in both palettes. Exactly one link carries `aria-current="page"`, the right one for the route, and its `::after` is drawn at least 2px high in the accent.
- **Targets.** Every visible link, button, and summary in the header measured at least 24 by 24 at 360 and at 1440, in the same two tests and in "lays the header in one row".
- **One row wide.** "lays the header in one row" passed on all 10 pages at 1440, and the existing column test passed.
- **Contrast and direction.** The bar reached at least 3:1 against the page in both palettes on every page, and the contrast suite passed on every page in both. "the controls end the first row" found the controls level with the name, at the left end in Arabic and the right end in English, with the navigation below. The screenshots at 360 and 1440 in both languages were read by eye, the language list open among them.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm test` 784 passed; `pnpm render:pdf` and `pnpm check:dist` exit 0 with the resume's free space unchanged. `pnpm lighthouse` cannot finish on this machine, as ticket 01 records; the same Lighthouse with its own profile directory scored every page's lowest run at least 99, 100, and 96.
