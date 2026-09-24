---
status: resolved
blocked-by: [04]
---

# feat(site): the header's name follows the reader past the first screen, and a footer that carries the copyright, the profiles, and the source

## Outcome

On the home page, the header's name is hidden while the first screen's heading is in view, and fades in once it has gone. This works the way the plan's Architecture describes, opted in by the script. The footer carries "© year name", the profile links, the source link, and the logo credits.

## Acceptance Criteria

- [x] At 1440 by 900 and 390 by 844, in both locales, the home link on `/en/` and `/ar/` is `visibility: hidden` at the top, and Tab does not reach it. It is visible after scrolling past `h1#about`, and hidden again after scrolling back (requirement 1, criterion 1). Verified: the new "the header's name at {1440 by 900, 390 by 844} with motion allowed" cases in `tests/navigation.spec.ts` poll the name's computed style on `/en/` and `/ar/`: `visibility: hidden` and opacity 0 at the top, with three Tab presses never focusing it; visible with opacity 1 once `h2#experience` is scrolled into view; hidden again after scrolling back to the top. They passed 48 of 48 with `--repeat-each=3`.
- [x] The home link is visible at the top with JavaScript disabled, under reduced motion, and on `/en/cv/` (requirement 1, criterion 1). Verified: cases under reduced motion and with JavaScript disabled find the name visible at the top of `/en/`, and the motion-allowed case finds it visible on `/en/cv/`. All passed.
- [x] The footer on every page begins with "©", the build's year, and the profile's name. It links every profile in `profile.yaml`, each with its network's icon, and the `repository` address exported from `astro.config.mjs`. The credits disclosure still lists `credits()` (requirement 2, criterion 2). Verified: a new case in `tests/home.spec.ts`, on `/`, `/cv/`, and `/resume/` in both locales, reads `[data-copyright]` as "© " plus the build's year plus the profile's name. It finds a link to each profile URL with its network's icon, a link to `repository` with the code glyph, and as many credit lines as `credits()`. It passed 12 of 12. Moved from the plan: `repository` lives in `src/lib/paths.ts` beside the base path it explains, because nothing under `src/` imports `astro.config.mjs`.
- [x] The new strings (`footer.sourceCode` and any label the links need) exist in both languages (requirement 11, criterion 11). Verified: `footer.copyright`, `footer.sourceCode`, and `footer.links` exist in both languages. `pnpm check` 0 errors under the `Strings` type.
- [x] The motion suite finds the name's transition only under no-preference, on the site's tokens (requirement 9, criterion 9). Verified: the hidden state and the fade live inside the `prefers-reduced-motion: no-preference` block in `src/styles/global.css`, on `--duration-medium` and `--ease-standard`. The motion suite passed within the full run.
- [x] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm lighthouse` (90 or above on the mobile profile) exit 0. `pnpm render:pdf` still writes one-page resumes (requirement 9, criterion 9; requirement 10, criterion 10). Verified: `pnpm check` 0 errors and 0 warnings; `pnpm build` "[localized] 0 gaps"; `pnpm exec playwright test` 1076 passed; `pnpm check:dist` 0; `pnpm test:content` 0; `pnpm render:pdf` "resume.en.pdf: 1 page at A4 with 54.8mm free, 1 page at Letter with 36.8mm free" and 36.3mm for Arabic. `pnpm lighthouse` crashed on this Windows machine after its first run, with `EPERM` while chrome-launcher removed its temporary profile, and it did the same with the temp directory moved. The same six pages, three runs each on the mobile default, through Lighthouse 12.6.1's Node API with that cleanup caught, gave medians: /en/ 0.97, 1, 1; /ar/ 0.94, 1, 1; /en/cv/ 1, 1, 1; /ar/cv/ 0.98, 1, 1; /en/resume/ 1, 1, 1; /ar/resume/ 0.99, 1, 1 (performance, accessibility, best practices). The integration gate runs `pnpm lighthouse` on Linux.

## Relevant areas

`src/layouts/Base.astro` (the header, the footer, and the inline script), `src/styles/global.css`, `astro.config.mjs`, `src/lib/networks.ts`, `src/lib/i18n.ts`, `tests/navigation.spec.ts`, `tests/home.spec.ts`, `tests/motion.spec.ts`, `tests/layout.spec.ts`, `docs/development.md` if it describes the header.

## Constraints

- One inline script. The new function joins it and is called from the existing `DOMContentLoaded` handler.
- `visibility: hidden` is what removes focus and the accessibility tree entry. Do not add `tabindex` or `aria-hidden` to the link.
- The page view transition keeps the header still. The name's fade must not fight it.

## Notes

- The plan had the name follow an IntersectionObserver whose top margin was the header's height, read at `DOMContentLoaded`. On a phone that read 261 pixels, because the stylesheet had not yet laid the header out, so the heading counted as gone and the name showed at the top. `follow()` now reads the heading's and the header's boxes in an animation frame, which waits for the stylesheet, and again on every scroll and resize frame, as the section tracker does.
- The test waits by polling the computed style, not `getAnimations()`. A reveal cancelled mid-scroll left that promise never settling within the poll.
