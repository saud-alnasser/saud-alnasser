---
status: open
blocked-by: [03]
---

# feat(site): technologies as badges with their marks where a mark's licence allows it, and a footer that credits them

## Outcome

Every technology on a project card and every keyword on a skill card is a badge. It carries the technology's mark where the licence rule in [[efforts/31-portfolio-rework/plan]] (decision 3) and the mark's own guidelines allow it, and the name alone where they do not. One module is the only place a name meets a mark. A test holds the licence rule against the package's own data. A new footer credits every mark whose licence asks for it.

## Acceptance Criteria

- [ ] `simple-icons` is a dependency. `src/lib/technologies.ts` maps each content spelling to a slug or to nothing and exports `technologyMark` and `credits`, as the plan's Interfaces say. Every mark it maps has had its recorded guidelines read, with the outcome written in this ticket's Notes (requirement 3, criterion 3).
- [ ] `Badge.astro` renders a technology as a `[data-badge]` chip holding an `aria-hidden` inline `<svg>` in `currentColor` exactly where `technologyMark` returns a mark, then the name exactly as the content spells it (requirement 3, criterion 3).
- [ ] `Project.astro` and `Skills.astro` render badges in place of the joined text line. An ordinary project card shows its first five and folds the rest behind `Fold` with a `technologies` noun in both languages (requirement 3, criterion 3; requirement 7, criterion 7).
- [ ] A Node test run by `pnpm test:content` loads `technologies.ts` and the package's `simple-icons.json`. It asserts every mapped slug has no licence or an MIT or BSD licence, or a CC BY or CC BY-SA licence that `credits()` lists, and that no NC or ND mark is mapped (requirement 3, criterion 3).
- [ ] `Base.astro` renders a footer with the site name and a native `<details>` labelled "Logo credits" in both languages, listing `credits()` one line per mark. The document pages' print rules hide it, and the PDFs' free space matches `main` (requirement 3, criterion 3; requirement 14, criterion 14).
- [ ] The work and home tests assert every technology and keyword sits in a badge with an `svg` exactly where the mapping has a mark, and the badge text matches the content. The dist check's origin rule passes (requirement 3, criterion 3).
- [ ] Badges, the badge fold, and the footer meet AA in both palettes, and badge rows fill from the right in Arabic (requirement 9, criterion 9; requirement 12, criterion 12).
- [ ] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, `pnpm lighthouse` (every score at least 90, `/ar/` included), and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`package.json` and the lockfile; `src/lib/technologies.ts` (new) beside `src/lib/icons.ts`, whose header shows how a licence is recorded in a comment; `src/components/Badge.astro` (new), `Project.astro`, `Skills.astro`, `Fold.astro`; `src/layouts/Base.astro`; `src/lib/i18n.ts`; `scripts/test-content-mechanism.mjs` or a sibling test it runs; `tests/work.spec.ts`, `tests/home.spec.ts`, `tests/contrast.spec.ts`; the repository context's `src/lib` and `src/components` rows.

## Constraints

- The GitHub and LinkedIn marks stay in `src/lib/icons.ts`, because `QrCode.astro` draws from there.
- If `/ar/` falls under 90 on performance, the plan's first lever applies: marks come off the skill cards and stay on the project cards. The choice is recorded in Notes.
- The JSON Resume output and the documents still print technologies as text. Nothing in `src/lib/resume.ts` or `CvDocument.astro` changes.

## Notes

The plan lists the marks by licence as `simple-icons` 16.32.0 recorded them on 2026-09-24. If the installed version differs, the test reads what is installed, and this list is corrected here rather than in the plan.
