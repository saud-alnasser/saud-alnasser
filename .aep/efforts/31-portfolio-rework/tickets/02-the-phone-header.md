---
status: open
blocked-by: [01]
---

# feat(site): a header that fits a phone in two tidy rows, with the current page marked beyond colour

## Outcome

Below the `sm` breakpoint the header is two rows. The first holds the site name at the start and the language and theme controls at the end. The second holds the navigation spread across the full width without wrapping. From `sm` up it is the one row it is today. The divider is gone. The current page carries an accent bar as well as `aria-current`, and every target in the header is at least 24 by 24.

## Acceptance Criteria

- [ ] At 360 pixels, in English and in Arabic, the navigation's items share one `offsetTop`, the header spans at most two rows of controls, and no element with a border on its inline start begins a row (requirement 11, criterion 11).
- [ ] Exactly one navigation link carries `aria-current="page"`, and it has a visible bar that is not a text colour, asserted by its computed box or pseudo-element on every route (requirement 11, criterion 11).
- [ ] Every link and button in the header measures at least 24 by 24 CSS pixels at 360 and at 1440 (requirement 11, criterion 11).
- [ ] At 1440 the header is one row and shares the page's column, and the existing column test passes (requirement 13, criterion 13).
- [ ] Both themes meet the contrast criterion on the bar and the links, and in Arabic the controls sit at the left end of row one (requirement 12, criterion 12).
- [ ] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm lighthouse` exit 0 with every score at least 90 (requirement 13, criterion 13).

## Relevant areas

`src/layouts/Base.astro` (the header); `src/components/LanguageMenu.astro` (its list is anchored to the header row); `tests/layout.spec.ts`, `tests/menu.spec.ts`.

## Constraints

- The language menu still opens, closes on Escape and on a click outside, and works without script. Its list stays anchored under its control in both rows.
- The header keeps the `view-transition-name` ticket 01 gave it.
