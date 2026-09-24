---
status: resolved
blocked-by: [02]
---

# feat(site): every project card shows its whole stack

## Outcome

A project card lists every technology as a badge, with no fold and no "Show N technologies" control. The string that fold used is gone.

## Acceptance Criteria

- [x] `src/components/Project.astro` renders every technology in one list and no `Fold` (requirement 3, criterion 3). Verified: `Project.astro` maps `data.technologies` into one list and no longer imports `Fold`.
- [x] A test finds no `details` inside any `[data-entry="project"]` on `/en/` and `/ar/`. Each card's badge count equals its entry's `technologies` length (requirement 3, criterion 3). Verified: the project badge case in `tests/work.spec.ts` now expects `folds: 0` and every technology as a badge per card, and it passed on `/en/` and `/ar/` in both palettes.
- [x] `tests/contrast.spec.ts` no longer opens a badge fold, and still audits the open logo credits in both palettes (requirement 9, criterion 9). Verified: the case is now "the logo credits on /saud-alnasser/{en,ar}/ meet WCAG AA open". It opens only the credits, and it passed in both palettes.
- [x] `t.fold.nouns.technologies` is gone from both languages in `src/lib/i18n.ts`, and the strings check passes (requirement 11, criterion 11). Verified: a search of `src/lib/i18n.ts` finds no `technologies` noun under `fold.nouns` in either language. `pnpm check` reported 0 errors, and the `Strings` type holds the Arabic table to the English one.
- [x] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0 (requirement 9, criterion 9). Verified: `pnpm check` 0 errors and 0 warnings, `pnpm build` "[localized] 0 gaps", `pnpm check:dist` 0, `pnpm exec playwright test` 1044 passed, `pnpm test:content` 0.

## Relevant areas

`src/components/Project.astro` and its header comment, `src/lib/i18n.ts`, `tests/contrast.spec.ts`, `tests/work.spec.ts` or `tests/home.spec.ts`, wherever project cards are asserted.
