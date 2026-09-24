---
status: resolved
blocked-by: [02]
---

# feat(site): sections revealing once as they scroll in, and a dist check that refuses any request to another origin

## Outcome

Headings and cards below the first viewport rise into place once, the first time they scroll into view. The mechanism cannot leave content hidden. The inline script sets `data-reveal` on `<html>` and wires the observer in the same function, and it does neither unless motion is allowed and `IntersectionObserver` exists. The dist check now refuses a built page or stylesheet that loads anything from another origin.

## Acceptance Criteria

- [x] The inline script gains one function that, only under `prefers-reduced-motion: no-preference` and with `IntersectionObserver` present, sets `data-reveal` on the root and observes every `[data-reveal]` element below the first viewport. It marks each `data-revealed` at a 10% threshold and unobserves it. The stylesheet hides only `html[data-reveal] [data-reveal]:not([data-revealed])` (requirement 10, criterion 10).
- [x] Section headings and the cards in every grid on the home, work, and education pages carry `data-reveal`. The reveal transitions `opacity` and `translate` over 350ms (requirement 10, criterion 10).
- [x] `tests/motion.spec.ts` gains three cases. With motion allowed, scrolling to the foot of each page leaves every `[data-reveal]` element at opacity 1. With `IntersectionObserver` deleted by an init script, every element is at opacity 1 without scrolling. With JavaScript disabled, every element is at opacity 1 (requirement 10, criterion 10; requirement 13, criterion 13).
- [x] `scripts/check-dist.mjs` fails, naming the file and the address, on any `src`, `srcset`, `href` of a `<link>` or `<script>`, CSS `url()`, or `@import` in `dist/` that points at another origin. Links a visitor follows (`<a href>`) are not requests and stay allowed. Adding such a reference to a page and building makes the check fail, and the reference is then removed (requirement 13, criterion 13; criterion 3).
- [x] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm lighthouse`, and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/layouts/Base.astro` (the inline script and its header comment, which lists what the script does); `src/styles/global.css`; the three page templates and the components that render grid cards; `scripts/check-dist.mjs`; `docs/development.md`, where the dist check's rules are described.

## Constraints

- An element already inside the viewport at load is never hidden by this mechanism. It belongs to ticket 01's stagger.
- The inline script's header comment is updated to list the new function, as it lists the others.

## Notes

The grid's cards are revealed through their grid items, the `li` each card sits in, rather than through the card element. A card already moves on `translate` for its hover lift, at 150ms, and one element can carry only one transition list. Revealing the card itself would have slowed its lift to the reveal's 350ms, or tied the reveal's rule to the card's internals. The item is the card's box in the grid, so what the visitor sees rise is the same.

The root carries `data-reveal` as the switch, so the tests look for marked elements under `body`. The print rules show every marked element, whether or not it had scrolled into view.

## What verified each criterion, on 2026-09-24

- **One function, and the switch set last.** `reveal()` in the inline script returns unless `IntersectionObserver` exists and `prefers-reduced-motion: no-preference` matches. It marks everything already on screen `data-revealed`, hands the rest to an observer at a 0.1 threshold that marks and unobserves each, and only then sets `data-reveal` on the root. The stylesheet's one hiding rule is `html[data-reveal] [data-reveal]:not([data-revealed])`. The script's header comment lists the new function.
- **What is marked.** Every visible section heading on the three pages and every grid item on them carry `data-reveal`: the skill groups and section cards at home, both work grids, and the education timeline, courses, and certifications. The reveal transitions `opacity` and `translate` over `--duration-long`, 350ms, which the duration sweep reads on every page.
- **The three cases.** `tests/motion.spec.ts` passed 110 cases in both palettes. Scrolling each of the six pages to its foot left every marked element at opacity 1, with nothing on screen at load left hidden. With `IntersectionObserver` deleted by an init script, the root carries no `data-reveal` and every marked element is at opacity 1. With JavaScript disabled, every marked element computes opacity 1. A fourth case holds that the mechanism is live: on the work page, marked elements below the first screen start at opacity 0.
- **One origin.** `pnpm check:dist` printed `one origin: 95 addresses loaded by 12 pages and stylesheets, all from https://saud-alnasser.github.io or the page itself`. With a stylesheet link to another origin added to the layout and built, it failed naming `dist/ar/cv/index.html` and the address. With a CSS `url()` to another origin added to the stylesheet and built, it failed naming the built stylesheet and the address. Both probes were removed, and a grep for the probe host over both files prints nothing. `docs/development.md` states the rule.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm render:pdf` exit 0 with the resume's free space unchanged; `pnpm check:dist` exit 0; `pnpm test` 822 passed; `pnpm scan:history` no identifier pattern over 41 commits. `pnpm lighthouse` cannot finish on this machine, as ticket 01 records. The same Lighthouse with its own profile directory scored every page's lowest run at least 99, 100, and 96, and CI's own `pnpm lighthouse` passed on ticket 01's commit.
