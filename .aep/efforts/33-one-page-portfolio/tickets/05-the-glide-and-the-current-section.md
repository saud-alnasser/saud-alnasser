---
status: open
blocked-by: [04]
---

# feat(site): the header glides to a section and marks the one being read

## Outcome

The inline script gains `sections()` and a widened `dismiss()`, as the plan's Components give them. On the home page, a plain press on a section link glides to its heading in 350ms on the entrance curve, or jumps under reduced motion. It then puts the anchor in the address and moves focus to the heading. The link for the section being read carries `aria-current="location"`, in the bar and the menu, and is kept current on every scroll frame. The phone menu closes on a link press, on Escape (with focus back on its button), and on a press outside it.

## Acceptance Criteria

- [ ] At 1440 by 900 and 390 by 844, in both languages, pressing each section link from the top and from the foot of the home page leaves the heading's top within 24 pixels below the header's bottom edge. Exactly that link, in the bar and in the menu, carries `aria-current`. The address ends in the section's anchor, and focus is on the heading (requirement 4, criterion 4; requirement 5, criterion 5).
- [ ] Scrolling by hand to each section marks its link current, and the foot of the page marks Skills (requirement 4, criterion 4).
- [ ] With motion allowed, `tests/motion.spec.ts` samples `scrollY` during a glide and finds it strictly between the start and the end, and finds it settled by 400ms. Under reduced motion the first frame after the press is at the section (requirement 4, criterion 4).
- [ ] A press with a modifier key, and a press on a section link on the CV or resume, is left to the browser (requirement 4, criterion 4).
- [ ] At 360 by 740 the menu closes on a link press, on Escape with focus returned to the button, and on a press outside it. The language menu still closes the same way (requirement 7, criterion 7).
- [ ] Keyboard: tabbing backward from the foot never leaves the focused element under the bar (requirement 9, criterion 9).
- [ ] The layout's comment on the one script says what `sections()` adds and that everything it adds works without it (requirement 9, criterion 9).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/layouts/Base.astro` (the inline script: `dismiss()`, `enter()`, the new `sections()`, and the `DOMContentLoaded` wiring); `tests/navigation.spec.ts`, `menu.spec.ts`, `motion.spec.ts`.

## Constraints

- ES5-style code, as the rest of the inline script is written: `var`, `function`, no arrow functions.
- The scroll listener is passive and reads layout at most once per animation frame.
- `history.pushState` and not `location.hash`, so the glide is not undone by the browser's own jump. The document form's `#me` latch listens for `hashchange`, which this does not fire, and it needs none.
