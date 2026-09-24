---
status: open
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

- [ ] `Monogram.astro` draws "SA" as the plan describes, `aria-hidden`. The hero's glow element is `aria-hidden` with no text. A test asserts the DOM order: mark, name, label, location, lead, actions, tiles (requirement 1, criterion 1).
- [ ] At 1440 by 900 and 390 by 844, in both languages and both themes, a test asserts the bounding boxes of the mark, name, label, location, and actions end within the viewport's height on load, and at 1440 the tiles' too (requirement 1, criterion 1).
- [ ] `StatTile.astro` renders four tiles with their icons: shown projects, every certificate entry, distinct technologies named by shown projects, and languages. The visible number is `aria-hidden` with `data-count`, beside an `sr-only` final number and label. A test computes each count from the content and compares it (requirement 2, criterion 2).
- [ ] The observer from ticket 03 starts each tile's count-up once, eased over 350ms, only under `html[data-reveal]`. With JavaScript disabled and under reduced motion the final number shows at load (requirement 2, criterion 2; requirement 10, criterion 10).
- [ ] The home page places the featured card under the tiles and the timeline, skills, and section cards after it. Every section heading on the home, work, and education pages and every section card carries its icon from `src/lib/icons.ts`, `aria-hidden` where the text names the same thing (requirement 8, criterion 8; requirement 4, criterion 4).
- [ ] The whole home page meets AA and the 3:1 boundaries in both palettes, including the glow's area. It mirrors in Arabic, `arrow-right` flips there, and all its content shows with JavaScript disabled (requirement 9, criterion 9; requirement 12, criterion 12; requirement 13, criterion 13).
- [ ] Every new string is in both languages, and the build's gap report prints the count `main` printed before this effort (requirement 14, criterion 14).
- [ ] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, `pnpm lighthouse` (every score at least 90), `pnpm readme`, and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/pages/[locale]/index.astro`; `src/components/Monogram.astro`, `StatTile.astro` (new), `SectionCard.astro`; the section headings in `src/pages/[locale]/work/index.astro` and `education/index.astro`; `src/lib/icons.ts` (file-text, map-pin, cpu, wrench, folder-code, award, arrow-right) and `src/components/Icon.astro`'s directional list; `src/layouts/Base.astro` (the observer's count-up); `src/styles/global.css` (the glow); `src/lib/i18n.ts`; `tests/home.spec.ts`, `tests/contrast.spec.ts`, `tests/layout.spec.ts`.

## Constraints

- If the phone screenshot misses the fold, the levers are the hero's spacing and type size, never the summary (plan, decision 6).
- The tiles count through `src/lib/shown.ts` and the collections, never a number written in a template.
- The home page's section-card counts stay computed as they are today.
