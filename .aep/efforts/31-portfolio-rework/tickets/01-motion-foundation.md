---
status: resolved
---

# feat(site): motion and depth tokens, raised cards, a load stagger, a page crossfade, and animated folds and dialogs

## Outcome

The site has one vocabulary for motion and depth, and every surface that exists today uses it. Cards rest on a shadow and lift on hover and focus. The page's content enters in a short stagger instead of `main` fading as one block. Pages crossfade where the browser does it natively. Folds and both dialogs open and close with a transition. Under reduced motion none of it runs. The test suite reads a settled page by default, and a new motion test holds every duration to the spec's range.

## Acceptance Criteria

- [x] `src/styles/global.css` defines the easing, duration, shadow, and glow tokens that [[efforts/31-portfolio-rework/plan]] names under Components. `--animate-reveal` is replaced by `--animate-enter` at 350ms, and no rule outside `motion-safe:` or a `prefers-reduced-motion: no-preference` block animates or transitions (requirement 10, criterion 10).
- [x] `Card.astro` has a resting shadow. On hover, `:focus-visible`, and `:focus-within` it has the raised shadow, the accent border, and, under motion-safe, a 2px lift. It also takes `variant="raised"`. A test with motion allowed compares a card's computed `box-shadow` and `transform` on hover and on focus against rest (requirement 9, criterion 9).
- [x] `main` no longer animates. Each page's first-screen children enter in a stagger at 60ms steps on `--animate-enter`, ending within 700ms, and an `h1` or lead paragraph animates `transform` only (requirement 10, criterion 10).
- [x] `@view-transition { navigation: auto }` and the header's `view-transition-name` are declared only under `prefers-reduced-motion: no-preference`, with the root group at 250ms (requirement 10, criterion 10).
- [x] The native folds transition through `::details-content`, with `block-size` inside `@supports (interpolate-size: allow-keywords)`. The certificate dialog and the document form's dialog enter and leave with `@starting-style` and `allow-discrete` transitions. Opening and closing either changes neither `location.href` nor `scrollY` (requirement 7, criterion 7; requirement 10).
- [x] `playwright.config.ts` sets `reducedMotion: 'reduce'` in its shared `use`. The existing suites pass with no expectation loosened, and the layout test's "the reveal runs when motion is not reduced" case still passes against the new stagger (requirement 13, criterion 13).
- [x] `tests/motion.spec.ts` exists. With motion allowed, it asserts every running animation's and every computed transition's duration on each page is between 100 and 400ms. Under reduce, it asserts `getAnimations()` is empty and every element is at computed opacity 1. It also asserts the LCP element's animation, if any, never starts below opacity 1 (requirement 10, criterion 10).
- [x] Contrast holds on the raised card in both palettes (requirement 12, criterion 9), and `pnpm build`, `pnpm check`, `pnpm test`, `pnpm lighthouse` (at least 90 on all three categories for every page it runs), and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/styles/global.css` (the theme block and the disclosure rules); `src/components/Card.astro`; `src/layouts/Base.astro` (`main`'s class and the dialog slot comment); `src/components/Fold.astro`, `CertificateDialog.astro`, `DocumentForm.astro`; `playwright.config.ts`; `tests/layout.spec.ts`, `certificates.spec.ts`, `contrast.spec.ts`, `document-form.spec.ts`, `education.spec.ts` (their "settled" helpers and the 500ms comments).

## Constraints

- Only `transform`, `translate`, `scale`, `opacity`, and the colours already transitioning are animated, except the fold's `block-size`. That exception applies only where `interpolate-size` exists, and it never runs at page load.
- The comment in `Base.astro` that explains why dialogs sit outside `main` still holds, since the stagger is a transform on descendants. Correct it only if the reason changes.
- The document pages' print rules stay as they are. `pnpm render:pdf` reports the same free space as on `main`.

## Notes

The glow token is defined here so ticket 08 only consumes it. The reveal on scroll is ticket 03's, and this ticket adds no `data-reveal` hiding.

Three decisions taken while building, none of which moves the plan:

- **Sections rise without fading, as the heading, the lead, and a document do.** The plan named the `h1` and the lead as the elements that might be the largest paint. On the Arabic work and education pages, the largest paint is sometimes a card's text inside the first section, and which element it is moves with the fonts' timing. The motion test caught it on one run in two. Only the children that cannot hold that text fade: on today's pages, the home page's label and location lines.
- **The bundled faces are preloaded.** With the entrance moved off `main`, Lighthouse measured the Arabic pages at a layout shift of 0.337 and performance 81. The cause was the fonts arriving after first paint and laying the page out a second time. `main`'s old fade had kept that shift out of the measure; it had not removed it. `Base.astro` now preloads the Latin pair on every page and the Arabic pair on Arabic pages. The shift went to 0 and every page to 99 or 100.
- **Tailwind reads `src/` alone for class names.** The motion test's stylesheet walk found a `.transition` rule outside any motion query that `main` already shipped. Tailwind had emitted it from a word in the protocol's notes under `.aep/`, and nothing uses it. `@import "tailwindcss" source("..")` limits the scan to the markup. The same limit dropped 24 unused rules, all from prose, and a check over the built HTML found none of them in any `class`.

The `raised` variant has no consumer until ticket 05. Its contrast is covered here through the hover state, which draws the same shadow over the same surface, and ticket 05 measures the featured card itself.

## What verified each criterion, on 2026-09-24

- **Tokens and one vocabulary.** `global.css` defines `--ease-standard`, `--ease-enter`, `--duration-short`, `--duration-medium`, `--duration-long`, `--shadow-rest`, `--shadow-raised`, and `--glow`, and `--animate-enter` runs `enter` over `--duration-long`. `grep -rn "animate-reveal" src tests` prints nothing. `tests/motion.spec.ts`, "every rule that moves anything is inside a no-preference query", walks every stylesheet rule on the page and passed in both palettes.
- **The card.** "a card rises on hover and on focus" passed in both palettes: a project card's `box-shadow` changed on hover and its `translate` went from `none` to `0px -2px`, and a section card's did the same on focus.
- **The stagger.** "the page enters in a stagger that ends within 700ms" read 60ms between the first two children of `main`, with the last settled by 650ms, and `main` carries no animation class. "the largest text never enters faded" passed on all 10 pages in both palettes, three runs in a row.
- **The crossfade.** "the page crossfade is declared for no-preference only, at 250ms" found the `@view-transition` rule, the root group at `var(--duration-medium)`, and `site-header` all inside the no-preference query, with `--duration-medium` computing to 250ms.
- **Folds and dialogs.** "a fold opens and closes in place" and "the certificate dialog opens and closes in place" passed with the address and `scrollY` equal before, open, and closed. The built stylesheet carries `@supports (interpolate-size:allow-keywords)`, the dialog's `@starting-style`, and `overlay` and `display` transitioned `allow-discrete`. The document form's dialog reads the same rules, and its 250ms is in the duration sweep on both document pages.
- **A settled suite.** `playwright.config.ts` sets `reducedMotion: 'reduce'`. `pnpm test` passed 644 cases before `tests/motion.spec.ts` was added, with no expectation changed, and "the reveal runs when motion is not reduced" passed against the stagger.
- **The motion test.** `tests/motion.spec.ts` exists and passed: every duration on the 10 pages is between 100 and 400ms, and under reduce `getAnimations()` is empty and every element computes opacity 1.
- **Contrast and the gates.** "a raised card meets WCAG AA" passed on both work pages in both palettes, with axe clean on the English one. `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm render:pdf` exit 0, the resume at 54.8mm (en) and 54.3mm (ar) free at A4, byte-identical in size to a render of `main` taken the same day; `pnpm check:dist` exit 0; `pnpm test` 720 passed; `pnpm test:content` passed; `pnpm scan:history` no identifier pattern over 39 commits. `pnpm lighthouse` cannot finish on this machine, on this branch or on `main`: chrome-launcher fails with EPERM removing its own temporary profile once the audit ends. The same Lighthouse, over the same six pages with three runs each and a profile directory of its own, scored at least 99 on performance, 100 on accessibility, and 96 on best practices, lowest run counted. CI's integration gate runs `pnpm lighthouse` itself on the pushed branch.
