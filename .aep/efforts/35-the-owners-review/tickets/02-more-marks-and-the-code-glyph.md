---
status: open
blocked-by: [01]
---

# feat(site): five more technology marks, and the code glyph on every badge without one

## Outcome

tRPC, Zod, Vite, Vitest, and SQLite draw their Simple Icons marks. Every badge and every filter chip whose name has no allowed mark draws Lucide's `code` glyph instead of nothing. `technologyMark()` keeps its meaning, so the licence test still speaks about marks alone.

## Acceptance Criteria

- [ ] `src/lib/technologies.ts` maps the five names. `tests/technologies.test.mjs` passes, including a case per new mapping. Its guidelines check still holds, since none of the five records guidelines (requirement 5, criterion 5).
- [ ] `src/lib/icons.ts` has `code`, from Lucide, under the notice already there. `Badge.astro` and the filter chips in `src/pages/[locale]/index.astro` draw it, `aria-hidden`, where `technologyMark()` returns `undefined` (requirement 5, criterion 5).
- [ ] In the built home page, every `[data-badge]` contains exactly one `svg`. It is the mark where `technologyMark` has one, and `data-icon="code"` otherwise. `tests/home.spec.ts` asserts this for the skill cards and the project cards in both locales (requirement 5, criterion 5).
- [ ] `pnpm check:dist` still finds no request to another origin, and the logo credits in the footer still equal `credits()` (requirement 5, criterion 5; requirement 9, criterion 9).
- [ ] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/lib/technologies.ts`, `src/lib/icons.ts`, `src/components/Badge.astro`, `src/components/Icon.astro`, `src/pages/[locale]/index.astro` (chips), `tests/technologies.test.mjs`, `tests/home.spec.ts`.

## Constraints

- No refusal in `marks` changes. Tauri, Node.js, PostgreSQL, and npm stay `null` with their reasons.
- The glyph is one icon for every unmapped name (plan, Architecture). No per-name glyphs.
