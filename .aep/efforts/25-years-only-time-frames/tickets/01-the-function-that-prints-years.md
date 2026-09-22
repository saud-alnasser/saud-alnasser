---
status: resolved
---

# feat(site): every period printed as years, from the one function

## Outcome

`formatPeriod` in `src/lib/i18n.ts` prints a period as one year, two years joined by a hyphen, or a year and the locale's word for the present, and every page and document that prints a period shows that form because each already calls it. The word "to" leaves the strings, the header comment and the languages comment describe what is now true, `src/content/README.md` says how a period prints, and each element that prints one carries `data-period` so a test can read every one on a page.

## Acceptance Criteria

- [x] A test in `tests/` that calls the function asserts the six values criterion 1 of [[efforts/25-years-only-time-frames/spec]] lists: `2024`, `2023-2025`, and `2024-Present` in English, and `2024`, `2023-2025`, and `2024-الآن` in Arabic (criterion 1). Verified 2026-09-22: `tests/periods.spec.ts` carries the case `a period prints as one year, two years, or a year and the present` with those six calls; `pnpm test -- tests/periods.spec.ts` passed it in both palettes.
- [x] On `/en/work/`, `/ar/work/`, `/en/education/`, `/ar/education/`, `/en/cv/`, `/ar/cv/`, `/en/resume/`, and `/ar/resume/`, every `[data-period]` element's trimmed text matches `^\d{4}(-(\d{4}|Present|الآن))?$`, there is at least one on each page, and `pdftotext` over `dist/cv.en.pdf` and `dist/resume.en.pdf` prints no English month abbreviation followed by a space and a year outside a certificate's full date, which carries the day first. The existing period assertions in `tests/work.spec.ts`, `tests/education.spec.ts`, and `tests/resume.spec.ts` still pass unchanged, and `pnpm check:dist` finds the CV rows it expects (criterion 2). Verified 2026-09-22: the eight page cases in `tests/periods.spec.ts` read every `[data-period]` against the pattern and require at least one, and `pnpm test` printed `634 passed (38.1s)` with the three existing spec files untouched; over `dist/cv.en.pdf` a grep for a month abbreviation and a year not preceded by a day matched 0 lines, and the 8 matches with the day before them are the 8 certificate dates of 2021, over `dist/resume.en.pdf` both counts were 0; `pnpm check:dist` exited 0 with `[localized] 0 gaps`. After the review, that grep lives in `scripts/check-dist.mjs`, which fails naming the first month-and-year not preceded by a day, and the sweep in `tests/periods.spec.ts` expects the count of periods each route prints, read from the content. The built pages print, for instance, `2026`, `2025-2026`, and `2023-2026`, and a screenshot of `/ar/cv/` and `/ar/education/` shows each range in one left-to-right piece with the start first.
- [x] The "Dates" line of `src/content/README.md` says a period is authored to whatever precision is known and printed as years alone, one or a range; the header comment of `src/lib/i18n.ts` describes the year-only form; the comment in `src/lib/languages.ts` no longer contrasts the test's year with dates printed at finer precision (criterion 5). Verified 2026-09-22: the README line ends with the two forms, `2024` and `2022-2026`; the header line reads `formatPeriod(locale, p) "2024", "2022-2026", or "2024-Present": years alone`; the languages comment says the year alone "as a period prints".
- [x] `pnpm build` prints `[localized] 0 gaps`, and `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (criteria 6 and 7). Verified 2026-09-22: `[localized] 0 gaps` and `10 page(s) built`; `pnpm check` `0 errors, 0 warnings`; `pnpm render:pdf` reported `resume.en.pdf` 1 page at A4 with 54.8mm free and 1 page at Letter with 36.8mm free, `resume.ar.pdf` 54.3mm and 36.3mm, the filled copies 49.5mm, 31.5mm, 49.0mm, and 31.0mm, every one unchanged from main because the period shares its line with the title; `pnpm check:dist` exited 0; `pnpm test` `634 passed (38.1s)`; `pnpm test:content` `passed`; `pnpm scan:history` `47343 lines over 23 commits, no identifier pattern matches`.

## Relevant areas

`src/lib/i18n.ts`, `formatPeriod`, `formatDate`, the `period` strings of both locales, and the header comment. `src/components/Experience.astro`, `Project.astro`, `Education.astro`, `CvDocument.astro`, and `src/pages/[locale]/education/index.astro`, one period element each. `src/content/README.md`, the "Dates" line. `src/lib/languages.ts`, the comment over `levelLine`. `tests/work.spec.ts`, `tests/education.spec.ts`, `tests/resume.spec.ts`, where the period assertions already read the function. `scripts/check-dist.mjs`, which builds the CV expectation from it.

## Constraints

- `formatDate` stays as it is: the certificate dates still print in full, which the spec puts out of scope.
- The content contract and every content file are untouched here; the university's dates are ticket 02.
- The present word stays in `strings` per locale; `to` is removed rather than left unread. The hyphen lives in the function.
- A period whose start and end share a year prints the year once, whatever months they carry.
