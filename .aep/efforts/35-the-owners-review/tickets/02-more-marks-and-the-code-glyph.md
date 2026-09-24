---
status: resolved
blocked-by: [01]
---

# feat(site): five more technology marks, and the code glyph on every badge without one

## Outcome

tRPC, Zod, Vite, Vitest, and SQLite draw their Simple Icons marks. Every badge and every filter chip whose name has no allowed mark draws Lucide's `code` glyph instead of nothing. `technologyMark()` keeps its meaning, so the licence test still speaks about marks alone.

## Acceptance Criteria

- [x] `src/lib/technologies.ts` maps the five names. `tests/technologies.test.mjs` passes, including a case per new mapping. Its guidelines check still holds, since none of the five records guidelines (requirement 5, criterion 5). Verified: `node --test tests/technologies.test.mjs` passed 7 of 7, including "tRPC, Zod, Vite, Vitest, and SQLite draw their own marks" and "every mapped mark with recorded guidelines has had them read".
- [x] `src/lib/icons.ts` has `code`, from Lucide, under the notice already there. `Badge.astro` and the filter chips in `src/pages/[locale]/index.astro` draw it, `aria-hidden`, where `technologyMark()` returns `undefined` (requirement 5, criterion 5). Verified: `code` sits in `src/lib/icons.ts` under the Lucide notice. `Badge.astro` and the chips draw `<Icon name="code">`, which renders `aria-hidden="true"`, wherever `technologyMark()` is undefined. `technologyMark("SvelteKit")` is still undefined in the licence test.
- [x] In the built home page, every `[data-badge]` contains exactly one `svg`. It is the mark where `technologyMark` has one, and `data-icon="code"` otherwise. `tests/home.spec.ts` asserts this for the skill cards and the project cards in both locales (requirement 5, criterion 5). Verified: `tests/home.spec.ts` (skill cards) and `tests/work.spec.ts` (project cards) now expect each badge to hold exactly one `svg`, "true currentColor" for a mark and "true code" for the glyph, and require both kinds to occur. The two files passed 136 of 136 in both locales and palettes.
- [x] `pnpm check:dist` still finds no request to another origin, and the logo credits in the footer still equal `credits()` (requirement 5, criterion 5; requirement 9, criterion 9). Verified: `pnpm check:dist` exit 0, printing "one origin: 63 addresses loaded by 12 pages and stylesheets, all from https://saud-alnasser.github.io or the page itself". The credits test in `tests/technologies.test.mjs` passed.
- [x] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0 (requirement 9, criterion 9). Verified: `pnpm check` 0 errors and 0 warnings; `pnpm build` "[localized] 0 gaps"; `pnpm check:dist` 0; `pnpm test:content` 0 (13 unit passes, mechanism passed). The full `pnpm exec playwright test` passed 1040 and failed 4, all the project badge case, whose "some badge is the name alone" guard no longer held. It now requires a mark and a glyph to both occur, and the case passes.

## Relevant areas

`src/lib/technologies.ts`, `src/lib/icons.ts`, `src/components/Badge.astro`, `src/components/Icon.astro`, `src/pages/[locale]/index.astro` (chips), `tests/technologies.test.mjs`, `tests/home.spec.ts`.

## Constraints

- No refusal in `marks` changes. Tauri, Node.js, PostgreSQL, and npm stay `null` with their reasons.
- The glyph is one icon for every unmapped name (plan, Architecture). No per-name glyphs.
