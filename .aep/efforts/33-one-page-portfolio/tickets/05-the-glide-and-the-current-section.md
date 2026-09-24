---
status: resolved
blocked-by: [04]
---

# feat(site): the header glides to a section and marks the one being read

## Outcome

The inline script gains `sections()` and a widened `dismiss()`, as the plan's Components give them. On the home page, a plain press on a section link glides to its heading in 350ms on the entrance curve, or jumps under reduced motion. It then puts the anchor in the address and moves focus to the heading. The link for the section being read carries `aria-current="location"`, in the bar and the menu, and is kept current on every scroll frame. The phone menu closes on a link press, on Escape (with focus back on its button), and on a press outside it.

## Acceptance Criteria

- [x] At 1440 by 900 and 390 by 844, in both languages, pressing each section link from the top and from the foot of the home page leaves the heading's top within 24 pixels below the header's bottom edge. Exactly that link, in the bar and in the menu, carries `aria-current`. The address ends in the section's anchor, and focus is on the heading (requirement 4, criterion 4; requirement 5, criterion 5). Verified: `tests/navigation.spec.ts` passed all 80 cases "takes #id up under the header from the top" and "from the foot" and marks it, each asserting 0 to 24 pixels below the header, the page moved, the address `/{locale}/#id`, focus on the heading, the current links exactly `bar:id` and `menu:id`, and on a phone the menu closed.
- [x] Scrolling by hand to each section marks its link current, and the foot of the page marks Skills (requirement 4, criterion 4). Verified: "marks each section as it is scrolled to by hand, and Skills at the foot" passed at both sizes, in both languages and palettes, starting from `about` at load.
- [x] With motion allowed, `tests/motion.spec.ts` samples `scrollY` during a glide and finds it strictly between the start and the end, and finds it settled by 400ms. Under reduced motion the first frame after the press is at the section (requirement 4, criterion 4). Verified: "passes between its start and its end, and settles by 400ms" and "is one step under reduced motion" passed in both palettes. A sampling run read 0 at the press, 2772 at 102ms, and 3231 from 353ms on, the entrance curve's shape.
- [x] A press with a modifier key, and a press on a section link on the CV or resume, is left to the browser (requirement 4, criterion 4). Verified: "a modified press on a section link" found the click not cancelled by the script and the page unmoved; "a press on a section link on a document page" followed the link to `/en/#projects` and landed 0 to 24 pixels under the header.
- [x] At 360 by 740 the menu closes on a link press, on Escape with focus returned to the button, and on a press outside it. The language menu still closes the same way (requirement 7, criterion 7). Verified: `tests/menu.spec.ts` passed "closes on a link press", "closes on Escape and returns focus to the button", "closes on a press outside", and "keeps the language menu closing the same way" in both languages and palettes.
- [x] Keyboard: tabbing backward from the foot never leaves the focused element under the bar (requirement 9, criterion 9). Verified: "keeps every element focused by Shift+Tab from the foot clear of the header" passed, 60 presses back from the footer with each focused element's top at or below the header's bottom.
- [x] The layout's comment on the one script says what `sections()` adds and that everything it adds works without it (requirement 9, criterion 9). Verified: the comment now names the glide and the current-section mark and says a section link without the script is the anchor it already is, landing in the same place; `sections()` carries its own comment saying the same.
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9). Verified: build 0, check 0 (0 errors), check:dist 0 after `pnpm render:pdf`, and `pnpm test` passed 1022 cases on two consecutive runs; scan:history 0 on the ticket's commit. One earlier full run failed a single case, recorded in Notes.

## Relevant areas

`src/layouts/Base.astro` (the inline script: `dismiss()`, `enter()`, the new `sections()`, and the `DOMContentLoaded` wiring); `tests/navigation.spec.ts`, `menu.spec.ts`, `motion.spec.ts`.

## Constraints

- ES5-style code, as the rest of the inline script is written: `var`, `function`, no arrow functions.
- The scroll listener is passive and reads layout at most once per animation frame.
- `history.pushState` and not `location.hash`, so the glide is not undone by the browser's own jump. The document form's `#me` latch listens for `hashchange`, which this does not fire, and it needs none.

## Notes

- The current section is the last whose section has reached the scroll padding plus 8 pixels, not the header's bottom plus 8 as the plan wrote. Ticket 04 made the padding the header's height and 1rem, so a heading lands 15 pixels under the header; measured from the header's bottom, the section just landed on would not count as reached. The glide reads the same padding, so it lands where the jump does.
- One full `pnpm test` run of three failed "the certificate dialog opens and closes in place" in the dark palette: the page stood 298 pixels further down after the dialog opened than before. It passed alone five times and in the two full runs after. Nothing in `sections()` scrolls except on a section link's press, so the cause is not known. Recorded, not acted on.
