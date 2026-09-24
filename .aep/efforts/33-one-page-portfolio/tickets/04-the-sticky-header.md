---
status: open
blocked-by: [03]
---

# feat(site): a header that stays on screen and names every section once

## Outcome

The header is the sticky bar the plan's Components give it, on every page, with no script needed for any of it. The row holds the name, the five section links to the home page's anchors, the two documents set apart, and the two controls. Below the width where that row fits, the section and document links fold into `SiteMenu`, a native disclosure. `scroll-padding-top` keeps a jumped-to heading clear of the bar, and the home page's last section is tall enough that its heading can reach the top.

## Acceptance Criteria

- [ ] On every page, at 1440 by 900 and 390 by 844, the header is still in view after scrolling to the foot of the page (requirement 4, criterion 4).
- [ ] The bar and the menu link to `/{locale}/#about`, `#experience`, `#projects`, `#education`, and `#skills` under the base, on the home page and on both documents. The documents' links carry the file icon, sit in their own labelled group, and the one for the page being read carries `aria-current="page"` (requirement 4, criterion 4; requirement 6, criterion 6).
- [ ] With JavaScript disabled, following each section link from the top and from the foot of the home page puts the heading's top within 24 pixels below the header's bottom edge, at both sizes and in both languages. That includes Skills, the last section (requirement 4, criterion 4; requirement 5, criterion 5).
- [ ] At 360 by 740, in both languages, the header is one row: the name, the menu button, and the two controls. The button has an accessible name from `t.nav.menu` and exposes its expanded state. Opened, it lists the five sections and the two documents, and it opens, closes, and navigates with JavaScript disabled (requirement 7, criterion 7).
- [ ] The width at which the bar folds into the menu is measured in Arabic and in English, and the one chosen fits both with no wrap. It is recorded in Notes (requirement 7, criterion 7).
- [ ] The first screen still has the CV as its filled action and the resume beside it (requirement 6, criterion 6).
- [ ] No page scrolls horizontally at 360 pixels. Contrast holds on the bar, the menu, and the current-link mark in both palettes. The mark does not rest on colour alone, and every target is at least 24 by 24 (requirement 7, criterion 7; requirement 9, criterion 9).
- [ ] The new strings (`nav.about`, `nav.experience`, `nav.projects`, `nav.skills`, `nav.menu`, `nav.documents`) exist in both languages, and the old `nav` entries nothing reads are removed (requirement 10, criterion 10).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/layouts/Base.astro` (the header markup and its comment); `src/components/SiteMenu.astro` (new), `LanguageMenu.astro` (the pattern); `src/styles/global.css` (`--header-height`, `scroll-padding-top`, the last section's height, the current-link bar); `src/lib/icons.ts` (a menu icon, if the set has none); `src/lib/i18n.ts`; a new `tests/navigation.spec.ts`; `tests/menu.spec.ts`, `layout.spec.ts`, `contrast.spec.ts`.

## Constraints

- No script in this ticket. Ticket 05 adds the glide, the current-section mark on the home page, and the menu's closing on a link press, Escape, and an outside press. This ticket's tests run with JavaScript disabled wherever they assert navigation.
- The header keeps its `site-header` view-transition name.
