---
status: open
blocked-by: [04]
---

# feat(site): the header's name follows the reader past the first screen, and a footer that carries the copyright, the profiles, and the source

## Outcome

On the home page, the header's name is hidden while the first screen's heading is in view, and fades in once it has gone. This works the way the plan's Architecture describes, opted in by the script. The footer carries "© year name", the profile links, the source link, and the logo credits.

## Acceptance Criteria

- [ ] At 1440 by 900 and 390 by 844, in both locales, the home link on `/en/` and `/ar/` is `visibility: hidden` at the top, and Tab does not reach it. It is visible after scrolling past `h1#about`, and hidden again after scrolling back (requirement 1, criterion 1).
- [ ] The home link is visible at the top with JavaScript disabled, under reduced motion, and on `/en/cv/` (requirement 1, criterion 1).
- [ ] The footer on every page begins with "©", the build's year, and the profile's name. It links every profile in `profile.yaml`, each with its network's icon, and the `repository` address exported from `astro.config.mjs`. The credits disclosure still lists `credits()` (requirement 2, criterion 2).
- [ ] The new strings (`footer.sourceCode` and any label the links need) exist in both languages (requirement 11, criterion 11).
- [ ] The motion suite finds the name's transition only under no-preference, on the site's tokens (requirement 9, criterion 9).
- [ ] `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm lighthouse` (90 or above on the mobile profile) exit 0. `pnpm render:pdf` still writes one-page resumes (requirement 9, criterion 9; requirement 10, criterion 10).

## Relevant areas

`src/layouts/Base.astro` (the header, the footer, and the inline script), `src/styles/global.css`, `astro.config.mjs`, `src/lib/networks.ts`, `src/lib/i18n.ts`, `tests/navigation.spec.ts`, `tests/home.spec.ts`, `tests/motion.spec.ts`, `tests/layout.spec.ts`, `docs/development.md` if it describes the header.

## Constraints

- One inline script. The new function joins it and is called from the existing `DOMContentLoaded` handler.
- `visibility: hidden` is what removes focus and the accessibility tree entry. Do not add `tabindex` or `aria-hidden` to the link.
- The page view transition keeps the header still. The name's fade must not fight it.
