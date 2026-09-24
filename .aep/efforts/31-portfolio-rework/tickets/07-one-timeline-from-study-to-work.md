---
status: open
blocked-by: [01]
---

# feat(site): one timeline on the home page from study to work, each node leading to its detail

## Outcome

`journey()` in `src/lib/timeline.ts` lays the education timeline and the experience entries on one axis, newest first, keeping `educationTimeline()`'s position rule for the undated courses. `Journey.astro` draws it as a rail with a node per item. Each node shows its kind's icon, its years, its title, and its organisation, and links to an id that exists on the page holding its detail. The rail sits at the inline start, so it moves to the right in Arabic.

## Acceptance Criteria

- [ ] `journey()` is exported from `src/lib/timeline.ts` as the plan's Interfaces give it, with no runtime import, and a Node test asserts its order on today's content and on a fixture where an experience entry starts between two education entries (requirement 6, criterion 6).
- [ ] `Experience.astro` and `Education.astro` give their cards the ids `experience-<id>` and `education-<id>`, and `#courses` stays the courses heading's id (requirement 6, criterion 6).
- [ ] `Journey.astro` renders an ordered list whose nodes carry a briefcase, graduation-cap, or book-open icon (`aria-hidden`), the years from `formatPeriod`, the title, and the organisation. The courses node's title is its count. Every node's link resolves to an existing id on the page it names, asserted by a test that follows each (requirement 6, criterion 6; requirement 8, criterion 8).
- [ ] The component is placed on the home page under a heading with its icon, in both languages. Its exact position among the home sections may move in ticket 08 (requirement 6, criterion 6; requirement 14, criterion 14).
- [ ] The rail, the markers, and the text meet the contrast criterion in both palettes, and the timeline renders fully with JavaScript disabled (requirement 9, criterion 9; requirement 13, criterion 13).
- [ ] In Arabic at 360 and 1440 the rail sits on the right and the nodes read right to left, checked by eye and recorded in Notes (requirement 12, criterion 6, criterion 12).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, and `pnpm scan:history` exit 0, and the dist check's education reading-order expectation is unchanged (requirement 13, criterion 13).

## Relevant areas

`src/lib/timeline.ts` and its header comment; `src/components/Journey.astro` (new), `Experience.astro`, `Education.astro`; `src/pages/[locale]/index.astro`; `src/lib/icons.ts` (briefcase, graduation-cap, book-open); `src/lib/i18n.ts`; `tests/home.spec.ts`; the repository context's `src/lib` row.

## Constraints

- `educationTimeline()` keeps its signature and behaviour. The CV, the education page, and the dist check read it.
