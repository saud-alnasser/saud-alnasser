---
status: open
blocked-by: [02]
---

# feat(site): the work and education addresses forward to their sections

## Outcome

`/{locale}/work/` and `/{locale}/education/` render the new `Forward` component, as the plan's Components give it. Each is a whole document with no layout and no script, holding a meta refresh to the home page's `#experience` or `#education` in the same language, a canonical link to that language's home page, `noindex`, and one visible link. The sitemap lists none of them. The suites and checks that visited the two pages now visit the home page, and a check of their own holds the forwards.

## Acceptance Criteria

- [ ] Each of the four addresses, read from `dist`, carries `<meta http-equiv="refresh">` to `/{locale}/#experience` or `/{locale}/#education` under the base, `<link rel="canonical">` to `/{locale}/`, and `noindex`. It holds no `<script>`, and the dist check asserts all of it (requirement 8, criterion 8).
- [ ] A browser test opens each address bare and with one of its old anchors (`#projects` on work, `#courses` on education). Each ends on the home page with the address's section heading in view (requirement 8, criterion 8).
- [ ] `dist/sitemap-0.xml` and `dist/sitemap.xml` list no work or education address, asserted by the dist check (requirement 8, criterion 8).
- [ ] The dist check recognises a forwarding page by its refresh and checks it by the rule above rather than the full-page checks. Every other page check still runs on every other page (requirement 8, criterion 8; requirement 9, criterion 9).
- [ ] `tests/pages.ts` lists `/`, `/cv/`, and `/resume/` as the routes, and the forwards separately. No suite visits the old pages for their content any more. The content mechanism's fixtures and its featured check name the home page's output (requirement 9, criterion 9).
- [ ] Lighthouse in CI runs on the real pages and not the forwards (requirement 9, criterion 9).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/components/Forward.astro` (new); `src/pages/[locale]/work/index.astro`, `education/index.astro`; `astro.config.mjs` (the sitemap filter); `scripts/check-dist.mjs`; `scripts/test-content-mechanism.mjs`; `tests/pages.ts` and every suite importing its `routes` or `pages`; the Lighthouse configuration under `.github/` or `lighthouserc`.

## Constraints

- The forwarding page's strings (its title, and the link's text) are in both languages in `src/lib/i18n.ts`.
- The base path goes through `withBase` and `absolute` (`src/lib/paths.ts`), as every other address does.
