---
status: resolved
blocked-by: [03]
---

# feat(site): technologies as badges with their marks where a mark's licence allows it, and a footer that credits them

## Outcome

Every technology on a project card and every keyword on a skill card is a badge. It carries the technology's mark where the licence rule in [[efforts/31-portfolio-rework/plan]] (decision 3) and the mark's own guidelines allow it, and the name alone where they do not. One module is the only place a name meets a mark. A test holds the licence rule against the package's own data. A new footer credits every mark whose licence asks for it.

## Acceptance Criteria

- [x] `simple-icons` is a dependency. `src/lib/technologies.ts` maps each content spelling to a slug or to nothing and exports `technologyMark` and `credits`, as the plan's Interfaces say. Every mark it maps has had its recorded guidelines read, with the outcome written in this ticket's Notes (requirement 3, criterion 3).
- [x] `Badge.astro` renders a technology as a `[data-badge]` chip holding an `aria-hidden` inline `<svg>` in `currentColor` exactly where `technologyMark` returns a mark, then the name exactly as the content spells it (requirement 3, criterion 3).
- [x] `Project.astro` and `Skills.astro` render badges in place of the joined text line. An ordinary project card shows its first five and folds the rest behind `Fold` with a `technologies` noun in both languages (requirement 3, criterion 3; requirement 7, criterion 7).
- [x] A Node test run by `pnpm test:content` loads `technologies.ts` and the package's `simple-icons.json`. It asserts every mapped slug has no licence or an MIT or BSD licence, or a CC BY or CC BY-SA licence that `credits()` lists, and that no NC or ND mark is mapped (requirement 3, criterion 3).
- [x] `Base.astro` renders a footer with the site name and a native `<details>` labelled "Logo credits" in both languages, listing `credits()` one line per mark. The document pages' print rules hide it, and the PDFs' free space matches `main` (requirement 3, criterion 3; requirement 14, criterion 14).
- [x] The work and home tests assert every technology and keyword sits in a badge with an `svg` exactly where the mapping has a mark, and the badge text matches the content. The dist check's origin rule passes (requirement 3, criterion 3).
- [x] Badges, the badge fold, and the footer meet AA in both palettes, and badge rows fill from the right in Arabic (requirement 9, criterion 9; requirement 12, criterion 12).
- [x] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, `pnpm lighthouse` (every score at least 90, `/ar/` included), and `pnpm scan:history` exit 0 (requirement 13, criterion 13).

## Relevant areas

`package.json` and the lockfile; `src/lib/technologies.ts` (new) beside `src/lib/icons.ts`, whose header shows how a licence is recorded in a comment; `src/components/Badge.astro` (new), `Project.astro`, `Skills.astro`, `Fold.astro`; `src/layouts/Base.astro`; `src/lib/i18n.ts`; `scripts/test-content-mechanism.mjs` or a sibling test it runs; `tests/work.spec.ts`, `tests/home.spec.ts`, `tests/contrast.spec.ts`; the repository context's `src/lib` and `src/components` rows.

## Constraints

- The GitHub and LinkedIn marks stay in `src/lib/icons.ts`, because `QrCode.astro` draws from there.
- If `/ar/` falls under 90 on performance, the plan's first lever applies: marks come off the skill cards and stay on the project cards. The choice is recorded in Notes.
- The JSON Resume output and the documents still print technologies as text. Nothing in `src/lib/resume.ts` or `CvDocument.astro` changes.

## Notes

The plan lists the marks by licence as `simple-icons` 16.32.0 recorded them on 2026-09-24. If the installed version differs, the test reads what is installed, and this list is corrected here rather than in the plan.

The installed version is 16.32.0, and every licence it records matches the plan's list.

### The guidelines, read on 2026-09-24

What each owner's guidelines said is in [[efforts/31-portfolio-rework/evidence/research/logo-guidelines]], with the sentences quoted. The outcome for the eight marks that record guidelines:

| Mark | Outcome | Why |
| --- | --- | --- |
| TypeScript | mapped | an official single-colour variant exists, and the only shape rule is not to modify the shape |
| Tailwind CSS | mapped | the page bars only use that implies affiliation or endorsement, and says nothing of colour |
| CSS | mapped | the logo is CC0, and its guidelines list changing colours while keeping contrast as a do |
| Rust | mapped | the trademark policy says nothing of colour, and the official logo is itself one colour |
| Godot Engine | mapped | the press kit ships monochrome icons, and the trademark licence covers saying the software was used |
| Node.js | text chip | the OpenJS policy says a logo must not be displayed with colour variations |
| PostgreSQL | text chip | the elephant may appear only in the forms the policy shows, and not beside other logos |
| npm | text chip | the logos may not be used to refer to npm in a nominative sense |

Every mapped mark is drawn in the text colour, which changes it from its original. CC BY and CC BY-SA both ask that a change be indicated, so the credits open with a line saying each mark is drawn in the text colour rather than its own.

Recorded for Saud, not acted on, since each is a choice about the site's voice rather than a rule the plan set:

- The Godot Foundation recommends, and does not require, a line saying the user is not affiliated with or endorsed by it.
- Node.js, npm, and PostgreSQL ask for trademark notices where their logos are used. The site now shows none of those three logos, only their names as text, so no notice was added.
- The Rust logo's owner licenses it under CC BY 4.0, while Simple Icons records CC BY-SA 4.0. The credit follows the package, which the test reads, and the stricter of the two is what the footer says.

The test that holds the rule also checks that every mapped mark whose package entry records guidelines is named in that research file, so a mark added later without its guidelines being read fails `pnpm test:content`. (Changed on 2026-09-24 in the first review round: source code may not reference `.aep/`, so what each guideline allows is now a `guidelines` record in `src/lib/technologies.ts`, and the test requires an entry there for every mapped mark whose package entry links guidelines. The research file stays as the evidence behind those entries.)

A skill keyword and a project technology share one mapping. The practices among the keywords, and the technologies only a hidden project names, are not listed, and draw the name alone.

Each badge isolates its name's direction, because an Arabic page otherwise moved the `#` of "C#" to the front. The credits join with the language's own list separator for the same reason. `/ar/` stayed at 98 or better on performance with the marks on both kinds of card, so the plan's first lever was not needed.

Playwright now matches `*.spec.ts` only, since it would otherwise have taken the Node test under `tests/` for one of its own.

## What verified each criterion, on 2026-09-24

- **The dependency and the module.** `package.json` lists `simple-icons` at `^16.32.0`, and the lockfile pins 16.32.0. `src/lib/technologies.ts` exports `marks`, `technologyMark`, and `credits`, and loads under Node with its types stripped. The guidelines are above.
- **The badge.** `Badge.astro` renders `[data-badge]` with an `<svg aria-hidden="true" fill="currentColor">` only where `technologyMark` returns a mark, then the name.
- **The cards.** "shows every technology as a badge, with its mark where it has one" passed on both work pages in both palettes. Every card's badges equal its technologies in order, at most five are outside the fold, and the two cards with seven read "Show 2 technologies" in English and its Arabic form. The home test did the same for every skill group's keywords.
- **The licence test.** `node --test tests/technologies.test.mjs`, run first by `pnpm test:content`, passed 6 of 6. Every mapped slug is in the package with no licence, MIT or BSD, or CC BY or CC BY-SA. None is NC or ND. The credits list exactly Git, Godot Engine, PHP, and Rust, with the package's sources. Every mapped mark with recorded guidelines is in the research file. After the first review round, the last case reads the `guidelines` record in `technologies.ts` instead, and passes the same way.
- **The footer.** Every page ends in a footer with the site name and a `<details data-logo-credits>` in both languages. Its print rule is the header's. `pnpm render:pdf` printed the resume at 54.8mm (en) and 54.3mm (ar) free at A4, as `main` does.
- **The tests and the origin rule.** The work and home badge tests above passed, and `pnpm check:dist` printed `one origin: 95 addresses loaded by 12 pages and stylesheets`, every one the site's own. The marks are inline paths, not requests.
- **Contrast and direction.** "the badge fold and the logo credits meet WCAG AA open" passed on both work pages in both palettes, with axe clean on the English one, and the page-wide contrast suite passed on every page. "badge rows fill from the right in Arabic and the left in English" passed. The skill cards and the footer were read by eye in Arabic dark.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm render:pdf` exit 0; `pnpm check:dist` exit 0; `pnpm test` 832 passed; `pnpm test:content` passed; `pnpm scan:history` no identifier pattern over 42 commits. `pnpm lighthouse` cannot finish on this machine, as ticket 01 records. The same Lighthouse with its own profile directory scored every page's lowest run at least 98 on performance, 100 on accessibility, and 96 on best practices, `/ar/` included.
