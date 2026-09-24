---
status: resolved
blocked-by: [05]
---

# feat(site): the project grid filtered by technology, announcing how many projects remain

## Outcome

Above the project grid, a row of chips offers every technology that two or more shown projects use, plus "All". Pressing one leaves only the projects that name it, marks the chip pressed, and announces the new count in the visitor's language. With script off the row never appears and every project shows. The featured card above the grid is never filtered.

## Acceptance Criteria

- [x] The work page renders a `role="group"` with an accessible name holding one `<button aria-pressed>` per technology used by two or more shown projects, plus "All". The buttons are ordered by use, then by name, and the row ships with `hidden`. On today's content that is Rust, TypeScript, Java, Svelte, SvelteKit (requirement 5, criterion 5).
- [x] Each project card carries `data-technologies`. A function in the inline script removes the row's `hidden`, toggles `hidden` on cards whose technologies lack the chosen one, sets `aria-pressed`, and writes "Showing N projects", pluralised in both languages, into a `role="status"` element (requirement 5, criterion 5; requirement 14, criterion 14).
- [x] `tests/work.spec.ts` presses every chip by mouse and by keyboard and asserts the visible cards, `aria-pressed`, and the status text. It asserts "All" restores every card and the featured card stays. With JavaScript disabled it asserts no chip row is visible and every project is (requirement 5, criterion 5).
- [x] Chips meet AA and their pressed state meets 3:1 against rest, in both palettes. They are at least 24 by 24 and fill from the right in Arabic (requirement 9, criterion 9; requirement 12, criterion 12).
- [x] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/pages/[locale]/work/index.astro`; `src/components/Project.astro`; `src/layouts/Base.astro` (the inline script and its header comment); `src/lib/i18n.ts` and its plural helper; `tests/work.spec.ts`, `tests/contrast.spec.ts`.

## Constraints

- The filter state is not written to the address (spec, Out of Scope).
- The chip set is computed at build from the shown projects, never listed by hand.

## Notes

The count a press announces is the number of shown projects that name the chosen technology, the featured one included, and "All" announces every shown project. The featured card stays visible under every chip. It is the page's pick rather than a result of the filter, so a count of the grid alone would say 12 under "All" with 13 projects on screen.

Each chip carries its own announced line, counted and declined when the page is built. The inline script only copies it, so it carries no plural rules.

The Arabic line is a label and a number, "المشاريع المعروضة: 7", rather than the English shape. A verb and a counted noun would need the noun in the accusative, which the plural forms the site keeps are not. The home page's count lines share those forms and read correctly there, since nothing governs the noun.

`data-technologies` sits on each grid item, the `li` the card is in, as `data-reveal` does since ticket 03. That element is the one the filter hides, so the grid closes up around what is left.

## What verified each criterion, on 2026-09-24

- **The row.** "offers a chip per technology two projects share" passed on both work pages in both palettes. The group is named "Filter projects by technology" and its Arabic, and holds "All" then Rust, TypeScript, Java, Svelte, and SvelteKit, computed in the test from the content, with "All" pressed. The built HTML ships the group with `hidden`.
- **The script.** `filter()` in the inline script removes the row's `hidden`, sets `aria-pressed`, hides the grid items whose `data-technologies` lack the chosen one, and writes the chip's line into the `role="status"` paragraph. The script's header comment lists it.
- **The tests.** "narrows the grid by mouse" and "narrows the grid by keyboard" passed on both work pages in both palettes. They press every chip and then "All", the keyboard case alternating Enter and Space, and each time assert the visible grid equals the projects naming the technology, exactly one chip pressed, the announced line, and the featured card visible. "shows no chips and every project" passed with JavaScript disabled in both languages.
- **Contrast, size, and direction.** "the filter chips meet WCAG AA at rest and pressed" passed on both work pages in both palettes, with a pressed chip's fill at 3:1 or better against a chip at rest, and axe clean on the English page. Every chip measured at least 24 by 24, and the first chip sits at the row's right edge in Arabic and its left edge in English.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm test` 860 passed; `pnpm scan:history` no identifier pattern over 44 commits.
