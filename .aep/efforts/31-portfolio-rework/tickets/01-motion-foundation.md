---
status: open
---

# feat(site): motion and depth tokens, raised cards, a load stagger, a page crossfade, and animated folds and dialogs

## Outcome

The site has one vocabulary for motion and depth, and every surface that exists today uses it. Cards rest on a shadow and lift on hover and focus. The page's content enters in a short stagger instead of `main` fading as one block. Pages crossfade where the browser does it natively. Folds and both dialogs open and close with a transition. Under reduced motion none of it runs. The test suite reads a settled page by default, and a new motion test holds every duration to the spec's range.

## Acceptance Criteria

- [ ] `src/styles/global.css` defines the easing, duration, shadow, and glow tokens that [[efforts/31-portfolio-rework/plan]] names under Components. `--animate-reveal` is replaced by `--animate-enter` at 350ms, and no rule outside `motion-safe:` or a `prefers-reduced-motion: no-preference` block animates or transitions (requirement 10, criterion 10).
- [ ] `Card.astro` has a resting shadow. On hover, `:focus-visible`, and `:focus-within` it has the raised shadow, the accent border, and, under motion-safe, a 2px lift. It also takes `variant="raised"`. A test with motion allowed compares a card's computed `box-shadow` and `transform` on hover and on focus against rest (requirement 9, criterion 9).
- [ ] `main` no longer animates. Each page's first-screen children enter in a stagger at 60ms steps on `--animate-enter`, ending within 700ms, and an `h1` or lead paragraph animates `transform` only (requirement 10, criterion 10).
- [ ] `@view-transition { navigation: auto }` and the header's `view-transition-name` are declared only under `prefers-reduced-motion: no-preference`, with the root group at 250ms (requirement 10, criterion 10).
- [ ] The native folds transition through `::details-content`, with `block-size` inside `@supports (interpolate-size: allow-keywords)`. The certificate dialog and the document form's dialog enter and leave with `@starting-style` and `allow-discrete` transitions. Opening and closing either changes neither `location.href` nor `scrollY` (requirement 7, criterion 7; requirement 10).
- [ ] `playwright.config.ts` sets `reducedMotion: 'reduce'` in its shared `use`. The existing suites pass with no expectation loosened, and the layout test's "the reveal runs when motion is not reduced" case still passes against the new stagger (requirement 13, criterion 13).
- [ ] `tests/motion.spec.ts` exists. With motion allowed, it asserts every running animation's and every computed transition's duration on each page is between 100 and 400ms. Under reduce, it asserts `getAnimations()` is empty and every element is at computed opacity 1. It also asserts the LCP element's animation, if any, never starts below opacity 1 (requirement 10, criterion 10).
- [ ] Contrast holds on the raised card in both palettes (requirement 12, criterion 9), and `pnpm build`, `pnpm check`, `pnpm test`, `pnpm lighthouse` (at least 90 on all three categories for every page it runs), and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`src/styles/global.css` (the theme block and the disclosure rules); `src/components/Card.astro`; `src/layouts/Base.astro` (`main`'s class and the dialog slot comment); `src/components/Fold.astro`, `CertificateDialog.astro`, `DocumentForm.astro`; `playwright.config.ts`; `tests/layout.spec.ts`, `certificates.spec.ts`, `contrast.spec.ts`, `document-form.spec.ts`, `education.spec.ts` (their "settled" helpers and the 500ms comments).

## Constraints

- Only `transform`, `translate`, `scale`, `opacity`, and the colours already transitioning are animated, except the fold's `block-size`. That exception applies only where `interpolate-size` exists, and it never runs at page load.
- The comment in `Base.astro` that explains why dialogs sit outside `main` still holds, since the stagger is a transform on descendants. Correct it only if the reason changes.
- The document pages' print rules stay as they are. `pnpm render:pdf` reports the same free space as on `main`.

## Notes

The glow token is defined here so ticket 08 only consumes it. The reveal on scroll is ticket 03's, and this ticket adds no `data-reveal` hiding.
