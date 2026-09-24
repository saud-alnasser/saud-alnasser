---
status: open
blocked-by: [02]
---

# feat(site): every project card shows its whole stack

## Outcome

A project card lists every technology as a badge, with no fold and no "Show N technologies" control. The string that fold used is gone.

## Acceptance Criteria

- [ ] `src/components/Project.astro` renders every technology in one list and no `Fold` (requirement 3, criterion 3).
- [ ] A test finds no `details` inside any `[data-entry="project"]` on `/en/` and `/ar/`. Each card's badge count equals its entry's `technologies` length (requirement 3, criterion 3).
- [ ] `tests/contrast.spec.ts` no longer opens a badge fold, and still audits the open logo credits in both palettes (requirement 9, criterion 9).
- [ ] `t.fold.nouns.technologies` is gone from both languages in `src/lib/i18n.ts`, and the strings check passes (requirement 11, criterion 11).
- [ ] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/components/Project.astro` and its header comment, `src/lib/i18n.ts`, `tests/contrast.spec.ts`, `tests/work.spec.ts` or `tests/home.spec.ts`, wherever project cards are asserted.
