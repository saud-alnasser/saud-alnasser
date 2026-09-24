---
status: resolved
blocked-by: [01]
---

# feat(site): one timeline on the home page from study to work, each node leading to its detail

## Outcome

`journey()` in `src/lib/timeline.ts` lays the education timeline and the experience entries on one axis, newest first, keeping `educationTimeline()`'s position rule for the undated courses. `Journey.astro` draws it as a rail with a node per item. Each node shows its kind's icon, its years, its title, and its organisation, and links to an id that exists on the page holding its detail. The rail sits at the inline start, so it moves to the right in Arabic.

## Acceptance Criteria

- [x] `journey()` is exported from `src/lib/timeline.ts` as the plan's Interfaces give it, with no runtime import, and a Node test asserts its order on today's content and on a fixture where an experience entry starts between two education entries (requirement 6, criterion 6).
- [x] `Experience.astro` and `Education.astro` give their cards the ids `experience-<id>` and `education-<id>`, and `#courses` stays the courses heading's id (requirement 6, criterion 6).
- [x] `Journey.astro` renders an ordered list whose nodes carry a briefcase, graduation-cap, or book-open icon (`aria-hidden`), the years from `formatPeriod`, the title, and the organisation. The courses node's title is its count. Every node's link resolves to an existing id on the page it names, asserted by a test that follows each (requirement 6, criterion 6; requirement 8, criterion 8).
- [x] The component is placed on the home page under a heading with its icon, in both languages. Its exact position among the home sections may move in ticket 08 (requirement 6, criterion 6; requirement 14, criterion 14).
- [x] The rail, the markers, and the text meet the contrast criterion in both palettes, and the timeline renders fully with JavaScript disabled (requirement 9, criterion 9; requirement 13, criterion 13).
- [x] In Arabic at 360 and 1440 the rail sits on the right and the nodes read right to left, checked by eye and recorded in Notes (requirement 12, criterion 6, criterion 12).
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, and `pnpm scan:history` exit 0, and the dist check's education reading-order expectation is unchanged (requirement 13, criterion 13).

## Relevant areas

`src/lib/timeline.ts` and its header comment; `src/components/Journey.astro` (new), `Experience.astro`, `Education.astro`; `src/pages/[locale]/index.astro`; `src/lib/icons.ts` (briefcase, graduation-cap, book-open); `src/lib/i18n.ts`; `tests/home.spec.ts`; the repository context's `src/lib` row.

## Constraints

- `educationTimeline()` keeps its signature and behaviour. The CV, the education page, and the dist check read it.

## Notes

`journey()` takes a fourth argument, `startOf`, which reads an entry's start. The plan's Interfaces wrote the experience type as carrying `start` itself. The page passes collection entries, whose start is under `data.period`, and the tests pass parsed files, whose start is under `period`, so one accessor lets both call the same function unchanged. With no runtime import, the Node test loads it as the scripts load the rest of `src/lib`.

An experience entry is laid in after the last item that starts no later than it. The courses node counts by its earliest dated course, and a courses node with no dated course is passed over, keeping the place the position rule gave it. The third Node case holds that.

The rail and its markers are drawn in the muted text colour and the accent, not the border colour the education page's rail uses. The border colour sits near 1.3:1 against the page, and this criterion asks 3:1 of both. The courses node's title is the education page's own count line, "26 courses" and its Arabic, so the two pages count the same thing in the same words.

The entry cards carry `scroll-mt-8`, so a node's link lands with the card clear of the viewport's top edge.

## What verified each criterion, on 2026-09-24

- **The function.** `journey` is exported from `src/lib/timeline.ts` with no runtime import, and the file's header points to it. `node --test tests/timeline.test.mjs`, run by `pnpm test:content`, passed 3 of 3. Today's record reads the placement, the university, then the courses. On a fixture, a placement starting between a school and the courses lands between them. Undated courses keep their position.
- **The ids.** `Experience.astro` and `Education.astro` render `experience-<id>` and `education-<id>` on their cards, and `#courses` is still the courses heading's id on the education page.
- **The component.** "lays out every node, newest first, each with its kind" passed in both languages and both palettes. The nodes' kinds and links equal `journey()` over the parsed content. Each carries its briefcase, graduation-cap, or book-open icon `aria-hidden`, with the kind in an `sr-only` span, and its years, title, and organisation. "leads every node to an id on the page it names" followed all three links in both languages and found each id once.
- **On the home page.** The section sits under `h2#journey`, "From study to work" and its Arabic, with an `aria-hidden` icon, after the contact actions and before the skills. Ticket 08 may move it.
- **Contrast and no script.** "draws the rail on the reading start, at 3:1 with its markers" measured the rail and a marker at 3:1 or better against the page in both palettes, and the contrast suite passed on both home pages. "shows every node" passed with JavaScript disabled in both languages.
- **Arabic by eye.** At 360 in the dark palette and at 1440 in the light, the rail runs down the right with the markers on it, and each node's icon, years, and text read from the right. The English at 1440 mirrors it on the left.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm check:dist` exit 0, its reading-order lines for the four documents as before, in a file this ticket does not touch; `pnpm test` 876 passed; `pnpm test:content` passed; `pnpm scan:history` no identifier pattern over 45 commits.
