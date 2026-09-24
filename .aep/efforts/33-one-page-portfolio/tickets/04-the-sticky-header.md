---
status: resolved
blocked-by: [03]
---

# feat(site): a header that stays on screen and names every section once

## Outcome

The header is the sticky bar the plan's Components give it, on every page, with no script needed for any of it. The row holds the name, the five section links to the home page's anchors, the two documents set apart, and the two controls. Below the width where that row fits, the section and document links fold into `SiteMenu`, a native disclosure. `scroll-padding-top` keeps a jumped-to heading clear of the bar, and the home page's last section is tall enough that its heading can reach the top.

## Acceptance Criteria

- [x] On every page, at 1440 by 900 and 390 by 844, the header is still in view after scrolling to the foot of the page (requirement 4, criterion 4). Verified: `tests/navigation.spec.ts` passed "keeps the header in view at its foot" for all six pages at both sizes, asserting the page scrolled, the header's top at 0, and the header in the viewport.
- [x] The bar and the menu link to `/{locale}/#about`, `#experience`, `#projects`, `#education`, and `#skills` under the base, on the home page and on both documents. The documents' links carry the file icon, sit in their own labelled group, and the one for the page being read carries `aria-current="page"` (requirement 4, criterion 4; requirement 6, criterion 6). Verified: `tests/menu.spec.ts` passed "lists the sections, then the documents" on all six pages (hrefs `/{locale}/#id` under the base, the documents list named `nav.documents`, each with the hidden file icon, and `aria-current="page"` on the document being read and on no link of the home page) and the same assertions on the open phone menu; `tests/navigation.spec.ts` passed "leads to each section of the home page" from both documents at both sizes.
- [x] With JavaScript disabled, following each section link from the top and from the foot of the home page puts the heading's top within 24 pixels below the header's bottom edge, at both sizes and in both languages. That includes Skills, the last section (requirement 4, criterion 4; requirement 5, criterion 5). Verified: `tests/navigation.spec.ts` passed all 80 cases "brings #id up under the header from the top" and "from the foot" (5 sections, 2 sizes, 2 languages, 2 palettes), each asserting 0 to 24 pixels below the header and that the page moved. A probe removing the last section's height reproduced the original fault at 1440 by 900: from the foot the page stayed at 5640 and `#skills` sat 242 pixels below the header; with it the page moved and `#skills` sat 15 pixels below.
- [x] At 360 by 740, in both languages, the header is one row: the name, the menu button, and the two controls. The button has an accessible name from `t.nav.menu` and exposes its expanded state. Opened, it lists the five sections and the two documents, and it opens, closes, and navigates with JavaScript disabled (requirement 7, criterion 7). Verified: `tests/menu.spec.ts` passed "keeps the name, the two controls, and the menu button on one row" and "names the menu button and exposes whether it is open" in both languages (accessible name `nav.menu`; Chromium's tree reports the button expanded false, then true; the panel lists the five sections and the two documents), and "opens, closes, and leads to a section and a document" with JavaScript disabled.
- [x] The width at which the bar folds into the menu is measured in Arabic and in English, and the one chosen fits both with no wrap. It is recorded in Notes (requirement 7, criterion 7). Verified: measured in both languages on the home page and the CV, recorded in Notes: the whole row needs 714 pixels in each.
- [x] The first screen still has the CV as its filled action and the resume beside it (requirement 6, criterion 6). Verified: `tests/home.spec.ts` passed "offers the contact actions with icons and names" in both languages, asserting the order cv, resume, github and the CV's fill differing from the rest.
- [x] No page scrolls horizontally at 360 pixels. Contrast holds on the bar, the menu, and the current-link mark in both palettes. The mark does not rest on colour alone, and every target is at least 24 by 24 (requirement 7, criterion 7; requirement 9, criterion 9). Verified: `tests/layout.spec.ts` passed the no-scroll case on every page and "lays the header in one row" at 360 and 1440 with every target at least 24 by 24; `tests/contrast.spec.ts` audited every page with the bar in both palettes; the menu suite audited the open panel on `/{locale}/` and `/{locale}/cv/` in both palettes with axe and the pair measure and checked its links' sizes; "marks its own link with aria-current and a bar" passed on both documents in both palettes, the bar at 3:1 or better.
- [x] The new strings (`nav.about`, `nav.experience`, `nav.projects`, `nav.skills`, `nav.menu`, `nav.documents`) exist in both languages, and the old `nav` entries nothing reads are removed (requirement 10, criterion 10). Verified: all six are in both languages in `src/lib/i18n.ts`, and `nav.home` and `nav.work` are removed; `pnpm check` found 0 errors, which the `Strings` type makes a check that the Arabic has every key; the build printed "[localized] 0 gaps".
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9). Verified: build 0, check 0 (0 errors), check:dist 0 after `pnpm render:pdf`, test 0 (908 passed), scan:history 0 on the ticket's commit.

## Relevant areas

`src/layouts/Base.astro` (the header markup and its comment); `src/components/SiteMenu.astro` (new), `LanguageMenu.astro` (the pattern); `src/styles/global.css` (`--header-height`, `scroll-padding-top`, the last section's height, the current-link bar); `src/lib/icons.ts` (a menu icon, if the set has none); `src/lib/i18n.ts`; a new `tests/navigation.spec.ts`; `tests/menu.spec.ts`, `layout.spec.ts`, `contrast.spec.ts`.

## Constraints

- No script in this ticket. Ticket 05 adds the glide, the current-section mark on the home page, and the menu's closing on a link press, Escape, and an outside press. This ticket's tests run with JavaScript disabled wherever they assert navigation.
- The header keeps its `site-header` view-transition name.

## Notes

- The fold width is `lg`, 64rem. The whole row, the name, the five sections, the documents group, and the two controls, measured 714 pixels in English and 714 in Arabic on both the home page and the CV. At `md` the row has 720 pixels, 6 to spare, which one wider face or longer draft word would break; at `lg` it has 976.
- The header's row is 64rem wide on every page, the documents included, because the row cannot fit the 48rem document column. The header's bar spans the whole viewport. `tests/layout.spec.ts` asserts both widths.
- The scroll padding is the header's height plus 1rem, so a heading lands 15 pixels under the header's border rather than touching it. Ticket 05's glide should land where the jump does, by reading the same padding.
- `tests/menu.spec.ts` reads the menu button's expanded state from Chromium's accessibility tree over CDP, because Playwright's own role matching does not model a `<summary>`.
- The phone panel marks the current link with a bar down the row's start rather than under it, from the same rule and colour as the header's bar.
