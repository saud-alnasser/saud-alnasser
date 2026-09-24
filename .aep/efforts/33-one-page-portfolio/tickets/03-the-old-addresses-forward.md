---
status: resolved
blocked-by: [02]
---

# feat(site): the work and education addresses forward to their sections

## Outcome

`/{locale}/work/` and `/{locale}/education/` render the new `Forward` component, as the plan's Components give it. Each is a whole document with no layout and no script, holding a meta refresh to the home page's `#experience` or `#education` in the same language, a canonical link to that language's home page, `noindex`, and one visible link. The sitemap lists none of them. The suites and checks that visited the two pages now visit the home page, and a check of their own holds the forwards.

## Acceptance Criteria

- [x] Each of the four addresses, read from `dist`, carries `<meta http-equiv="refresh">` to `/{locale}/#experience` or `/{locale}/#education` under the base, `<link rel="canonical">` to `/{locale}/`, and `noindex`. It holds no `<script>`, and the dist check asserts all of it (requirement 8, criterion 8). Verified: `pnpm check:dist` printed, for each of the four, "forwards: dist/en/work/index.html refreshes to /saud-alnasser/en/#experience, canonical https://saud-alnasser.github.io/saud-alnasser/en/, noindex, no script" and the same for the other three; a probe adding a `<script>` to `dist/ar/work/index.html` failed it with "carries a <script>; a forward works without one".
- [x] A browser test opens each address bare and with one of its old anchors (`#projects` on work, `#courses` on education). Each ends on the home page with the address's section heading in view (requirement 8, criterion 8). Verified: `tests/forwards.spec.ts` passed all eight cases with JavaScript disabled, for example "/saud-alnasser/en/work/#projects lands on #experience of /en/" and "/saud-alnasser/ar/education/#courses lands on #education of /ar/", each asserting the final address, the language, and the heading in the viewport.
- [x] `dist/sitemap-0.xml` and `dist/sitemap.xml` list no work or education address, asserted by the dist check (requirement 8, criterion 8). Verified: `pnpm check:dist` printed "sitemap: 1 sitemap(s) listing all 6 pages, and sitemap.xml lists them all; neither lists any of the 4 forwards"; a probe adding `/en/work/` to `dist/sitemap.xml` failed it with "lists ... /en/work/, which only forwards".
- [x] The dist check recognises a forwarding page by its refresh and checks it by the rule above rather than the full-page checks. Every other page check still runs on every other page (requirement 8, criterion 8; requirement 9, criterion 9). Verified: `isForward` reads the meta refresh; the sitemap check sorts routes by it and the forwards check holds each refresh page to the forward rule and fails a refresh on any page `src/lib/forwards.ts` does not name. The metadata check already skips `noindex` pages and still printed "6 pages with a unique title"; locale twins, hrefs, base paths, one origin, and identifiers still read every file, and all passed.
- [x] `tests/pages.ts` lists `/`, `/cv/`, and `/resume/` as the routes, and the forwards separately. No suite visits the old pages for their content any more. The content mechanism's fixtures and its featured check name the home page's output (requirement 9, criterion 9). Verified: `routes` is those three and `forwards` is exported beside them; a grep of `tests/` for the old addresses finds only `tests/forwards.spec.ts`; `pnpm test:content` printed each fixture "in dist/en/index.html, dist/ar/index.html, ... and nowhere else" and "no featured card on either home page".
- [x] Lighthouse in CI runs on the real pages and not the forwards (requirement 9, criterion 9). Verified: `scripts/lighthouse.mjs`, which the integration workflow runs as `pnpm lighthouse`, audits `/en/`, `/ar/`, `/en/cv/`, `/ar/cv/`, `/en/resume/`, and `/ar/resume/`, and never listed the work or education pages, so nothing needed to change.
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9). Verified: build 0 ("[localized] 0 gaps"), check 0 (0 errors), check:dist 0 after `pnpm render:pdf`, test 0 (770 passed), test:content 0 ("test-content-mechanism: passed"), scan:history 0 on the ticket's commit.

## Relevant areas

`src/components/Forward.astro` (new); `src/pages/[locale]/work/index.astro`, `education/index.astro`; `astro.config.mjs` (the sitemap filter); `scripts/check-dist.mjs`; `scripts/test-content-mechanism.mjs`; `tests/pages.ts` and every suite importing its `routes` or `pages`; the Lighthouse configuration under `.github/` or `lighthouserc`.

## Constraints

- The forwarding page's strings (its title, and the link's text) are in both languages in `src/lib/i18n.ts`.
- The base path goes through `withBase` and `absolute` (`src/lib/paths.ts`), as every other address does.

## Notes

- The forwards are listed once, in `src/lib/forwards.ts`, which the sitemap filter, the dist check, and the tests read. The two routes name their section to `Forward` directly, and the dist check holds each to the list.
- The suites that ran on both the home page and an old page in ticket 02 now run on the home page alone, so the browser suite fell from 1068 cases to 770. No assertion was dropped; the old pages' copies went with the pages.
- The page crossfade case in `tests/motion.spec.ts` followed the header's Work link, which now reaches a forward with no layout and so no crossfade. It follows the CV link instead, until ticket 04 rewrites the header.
- The header still links to Work and Education until ticket 04. Those links now reach the forwards and land on the sections.
