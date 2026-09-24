---
status: open
blocked-by: [02]
---

# feat(site): sections revealing once as they scroll in, and a dist check that refuses any request to another origin

## Outcome

Headings and cards below the first viewport rise into place once, the first time they scroll into view. The mechanism cannot leave content hidden. The inline script sets `data-reveal` on `<html>` and wires the observer in the same function, and it does neither unless motion is allowed and `IntersectionObserver` exists. The dist check now refuses a built page or stylesheet that loads anything from another origin.

## Acceptance Criteria

- [ ] The inline script gains one function that, only under `prefers-reduced-motion: no-preference` and with `IntersectionObserver` present, sets `data-reveal` on the root and observes every `[data-reveal]` element below the first viewport. It marks each `data-revealed` at a 10% threshold and unobserves it. The stylesheet hides only `html[data-reveal] [data-reveal]:not([data-revealed])` (requirement 10, criterion 10).
- [ ] Section headings and the cards in every grid on the home, work, and education pages carry `data-reveal`. The reveal transitions `opacity` and `translate` over 350ms (requirement 10, criterion 10).
- [ ] `tests/motion.spec.ts` gains three cases. With motion allowed, scrolling to the foot of each page leaves every `[data-reveal]` element at opacity 1. With `IntersectionObserver` deleted by an init script, every element is at opacity 1 without scrolling. With JavaScript disabled, every element is at opacity 1 (requirement 10, criterion 10; requirement 13, criterion 13).
- [ ] `scripts/check-dist.mjs` fails, naming the file and the address, on any `src`, `srcset`, `href` of a `<link>` or `<script>`, CSS `url()`, or `@import` in `dist/` that points at another origin. Links a visitor follows (`<a href>`) are not requests and stay allowed. Adding such a reference to a page and building makes the check fail, and the reference is then removed (requirement 13, criterion 13; criterion 3).
- [ ] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm lighthouse`, and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/layouts/Base.astro` (the inline script and its header comment, which lists what the script does); `src/styles/global.css`; the three page templates and the components that render grid cards; `scripts/check-dist.mjs`; `docs/development.md`, where the dist check's rules are described.

## Constraints

- An element already inside the viewport at load is never hidden by this mechanism. It belongs to ticket 01's stagger.
- The inline script's header comment is updated to list the new function, as it lists the others.
