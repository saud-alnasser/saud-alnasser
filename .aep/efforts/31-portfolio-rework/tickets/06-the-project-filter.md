---
status: open
blocked-by: [05]
---

# feat(site): the project grid filtered by technology, announcing how many projects remain

## Outcome

Above the project grid, a row of chips offers every technology that two or more shown projects use, plus "All". Pressing one leaves only the projects that name it, marks the chip pressed, and announces the new count in the visitor's language. With script off the row never appears and every project shows. The featured card above the grid is never filtered.

## Acceptance Criteria

- [ ] The work page renders a `role="group"` with an accessible name holding one `<button aria-pressed>` per technology used by two or more shown projects, plus "All". The buttons are ordered by use, then by name, and the row ships with `hidden`. On today's content that is Rust, TypeScript, Java, Svelte, SvelteKit (requirement 5, criterion 5).
- [ ] Each project card carries `data-technologies`. A function in the inline script removes the row's `hidden`, toggles `hidden` on cards whose technologies lack the chosen one, sets `aria-pressed`, and writes "Showing N projects", pluralised in both languages, into a `role="status"` element (requirement 5, criterion 5; requirement 14, criterion 14).
- [ ] `tests/work.spec.ts` presses every chip by mouse and by keyboard and asserts the visible cards, `aria-pressed`, and the status text. It asserts "All" restores every card and the featured card stays. With JavaScript disabled it asserts no chip row is visible and every project is (requirement 5, criterion 5).
- [ ] Chips meet AA and their pressed state meets 3:1 against rest, in both palettes. They are at least 24 by 24 and fill from the right in Arabic (requirement 9, criterion 9; requirement 12, criterion 12).
- [ ] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/pages/[locale]/work/index.astro`; `src/components/Project.astro`; `src/layouts/Base.astro` (the inline script and its header comment); `src/lib/i18n.ts` and its plural helper; `tests/work.spec.ts`, `tests/contrast.spec.ts`.

## Constraints

- The filter state is not written to the address (spec, Out of Scope).
- The chip set is computed at build from the shown projects, never listed by hand.
