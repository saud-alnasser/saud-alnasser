---
status: resolved
blocked-by: [05, 07]
---

# feat(site): a first screen with a monogram, stat tiles counted from the content, and icons on every section

## Outcome

The home page opens on:

- the monogram;
- the name, label, and location;
- the whole summary as the lead;
- the contact actions, with the CV as the primary one;
- four stat tiles that count up once.

All of it sits over a soft accent glow. The featured card, the timeline, the skills, and the section cards follow. Every section heading on the three pages, every section card, and every tile carries its icon. At 1440 by 900 the whole hero, tiles included, is in the first screen. On a 390 by 844 phone everything down to the contact actions is.

## Acceptance Criteria

- [x] `Monogram.astro` draws "SA" as the plan describes, `aria-hidden`. The hero's glow element is `aria-hidden` with no text. A test asserts the DOM order: mark, name, label, location, lead, actions, tiles (requirement 1, criterion 1).
- [x] At 1440 by 900 and 390 by 844, in both languages and both themes, a test asserts the bounding boxes of the mark, name, label, location, and actions end within the viewport's height on load, and at 1440 the tiles' too (requirement 1, criterion 1).
- [x] `StatTile.astro` renders four tiles with their icons: shown projects, every certificate entry, distinct technologies named by shown projects, and languages. The visible number is `aria-hidden` with `data-count`, beside an `sr-only` final number and label. A test computes each count from the content and compares it (requirement 2, criterion 2).
- [x] The observer from ticket 03 starts each tile's count-up once, eased over 350ms, only under `html[data-reveal]`. With JavaScript disabled and under reduced motion the final number shows at load (requirement 2, criterion 2; requirement 10, criterion 10).
- [x] The home page places the featured card under the tiles and the timeline, skills, and section cards after it. Every section heading on the home, work, and education pages and every section card carries its icon from `src/lib/icons.ts`, `aria-hidden` where the text names the same thing (requirement 8, criterion 8; requirement 4, criterion 4).
- [x] The whole home page meets AA and the 3:1 boundaries in both palettes, including the glow's area. It mirrors in Arabic, `arrow-right` flips there, and all its content shows with JavaScript disabled (requirement 9, criterion 9; requirement 12, criterion 12; requirement 13, criterion 13).
- [x] Every new string is in both languages, and the build's gap report prints the count `main` printed before this effort (requirement 14, criterion 14).
- [x] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, `pnpm lighthouse` (every score at least 90), `pnpm readme`, and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/pages/[locale]/index.astro`; `src/components/Monogram.astro`, `StatTile.astro` (new), `SectionCard.astro`; the section headings in `src/pages/[locale]/work/index.astro` and `education/index.astro`; `src/lib/icons.ts` (file-text, map-pin, cpu, wrench, folder-code, award, arrow-right) and `src/components/Icon.astro`'s directional list; `src/layouts/Base.astro` (the observer's count-up); `src/styles/global.css` (the glow); `src/lib/i18n.ts`; `tests/home.spec.ts`, `tests/contrast.spec.ts`, `tests/layout.spec.ts`.

## Constraints

- If the phone screenshot misses the fold, the levers are the hero's spacing and type size, never the summary (plan, decision 6).
- The tiles count through `src/lib/shown.ts` and the collections, never a number written in a template.
- The home page's section-card counts stay computed as they are today.

## Notes

The first screen is one block, `data-hero`, so the light can sit behind it alone, in its own stacking context. The page's entrance would otherwise have faded that block as one child of `main`, and with it the lead, which is the largest paint. So the block stays still and its own children step in, 60ms apart, as the children of `main` do on every other page. The motion test reads the block's children on the home page for that reason.

The contact actions now open with the CV, filled in the accent as the one primary action, then the resume, then the profiles. The home test that pinned GitHub first now pins that order, and the documents take the `file-text` icon.

The light is an ellipse that fades to nothing at every edge of its box. A first version, brightest at its top edge, drew a visible line under the header. It is symmetric, so it needs no mirroring. The contrast suite's pair measure cannot see a gradient behind a sibling, so a separate test lays the gradient's strongest stop over the page and measures every text colour the first screen uses against it.

The tiles' visible number and label are both `aria-hidden`, and the `sr-only` line carries the pair, "13 Projects" and, in Arabic, "المشاريع: 13". Said as a label and a number, it reads correctly in Arabic at every count.

The "On this site" heading takes `arrow-right`, the icon of a card that leads somewhere, and the timeline's takes the graduation cap. The plan's icon list named neither heading.

## What verified each criterion, on 2026-09-24

- **The mark and the order.** "opens on the monogram and the light" passed in both languages and palettes: "SA", `aria-hidden`, and a light that is `aria-hidden` with no text. "reads as a hero, then the contact actions, then the cards" found the monogram, name, label, location, lead, actions, and tiles in that order, then the featured card, the timeline, the skills, and the section cards.
- **The fold.** "holds the block above the fold" passed at 1440 by 900 and 390 by 844, in both languages and both palettes. At 1440 the monogram, name, label, location, actions, and tiles end within 900 pixels. At 390 everything down to the actions ends within 844. Nothing scrolls sideways. The four screenshots were read by eye.
- **The tiles.** "counts four tiles from the content, with their icons" passed. The counts computed in the test from `src/content/` are 13 shown projects, 26 certificate entries, 21 distinct technologies, and 2 languages. Each tile's `data-count`, its `aria-hidden` number, its `sr-only` line, and its `aria-hidden` icon match.
- **The count-up.** "counts each number up once, from nothing to its figure" passed with motion allowed at 1440. Each tile's number went from 0 to its figure once, never falling. "shows every number at its final figure" passed with JavaScript disabled, and "at load, and never changes it" passed under reduced motion, with no change to any number after parsing.
- **The page and its icons.** "puts an icon on every section heading, section card, and tile" passed. Every visible `h2` on the home, work, and education pages carries an `aria-hidden` icon from `src/lib/icons.ts`, and every section card carries its section's icon and an `arrow-right`. The section cards' counts are computed as before, and their test passed unchanged.
- **Contrast, direction, and no script.** The contrast suite passed on every page in both palettes. "the text over the first screen's light meets WCAG AA" measured every hero text colour at 4.5:1 or better against the light's strongest point. `arrow-right` computes `scale: -1 1` in Arabic, and the Arabic screenshots mirror. The JavaScript-disabled cases for the reveal, the timeline, and the tiles passed.
- **Strings.** Every new string is in both languages in `src/lib/i18n.ts`, whose types refuse a key missing from either. The build printed `[localized] 0 gaps`, as `main`'s last deploy did.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm render:pdf` exit 0, the resume at 54.8mm (en) and 54.3mm (ar) free at A4 as on `main`; `pnpm check:dist` exit 0; `pnpm test` 912 passed; `pnpm test:content` passed; `pnpm readme` reported the README current; `pnpm scan:history` no identifier pattern over 46 commits. `pnpm lighthouse` cannot finish on this machine, as ticket 01 records. The same Lighthouse with its own profile directory scored the lowest of three runs at 100 on `/en/` and 97 on `/ar/` for performance, with no layout shift. Every page scored 100 on accessibility and 96 on best practices.
