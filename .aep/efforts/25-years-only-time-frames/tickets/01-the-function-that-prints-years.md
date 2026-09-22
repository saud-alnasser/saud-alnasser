---
status: open
---

# feat(site): every period printed as years, from the one function

## Outcome

`formatPeriod` in `src/lib/i18n.ts` prints a period as one year, two years joined by a hyphen, or a year and the locale's word for the present, and every page and document that prints a period shows that form because each already calls it. The word "to" leaves the strings, the header comment and the languages comment describe what is now true, `src/content/README.md` says how a period prints, and each element that prints one carries `data-period` so a test can read every one on a page.

## Acceptance Criteria

- [ ] A test in `tests/` that calls the function asserts the six values criterion 1 of [[efforts/25-years-only-time-frames/spec]] lists: `2024`, `2023-2025`, and `2024-Present` in English, and `2024`, `2023-2025`, and `2024-الآن` in Arabic (criterion 1).
- [ ] On `/en/work/`, `/ar/work/`, `/en/education/`, `/ar/education/`, `/en/cv/`, `/ar/cv/`, `/en/resume/`, and `/ar/resume/`, every `[data-period]` element's trimmed text matches `^\d{4}(-(\d{4}|Present|الآن))?$`, there is at least one on each page, and `pdftotext` over `dist/cv.en.pdf` and `dist/resume.en.pdf` prints no English month abbreviation followed by a space and a year. The existing period assertions in `tests/work.spec.ts`, `tests/education.spec.ts`, and `tests/resume.spec.ts` still pass unchanged, and `pnpm check:dist` finds the CV rows it expects (criterion 2).
- [ ] The "Dates" line of `src/content/README.md` says a period is authored to whatever precision is known and printed as years alone, one or a range; the header comment of `src/lib/i18n.ts` describes the year-only form; the comment in `src/lib/languages.ts` no longer contrasts the test's year with dates printed at finer precision (criterion 5).
- [ ] `pnpm build` prints `[localized] 0 gaps`, and `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (criteria 6 and 7).

## Relevant areas

`src/lib/i18n.ts`, `formatPeriod`, `formatDate`, the `period` strings of both locales, and the header comment. `src/components/Experience.astro`, `Project.astro`, `Education.astro`, `CvDocument.astro`, and `src/pages/[locale]/education/index.astro`, one period element each. `src/content/README.md`, the "Dates" line. `src/lib/languages.ts`, the comment over `levelLine`. `tests/work.spec.ts`, `tests/education.spec.ts`, `tests/resume.spec.ts`, where the period assertions already read the function. `scripts/check-dist.mjs`, which builds the CV expectation from it.

## Constraints

- `formatDate` stays as it is: the certificate dates still print in full, which the spec puts out of scope.
- The content contract and every content file are untouched here; the university's dates are ticket 02.
- The present word stays in `strings` per locale; `to` is removed rather than left unread. The hyphen lives in the function.
- A period whose start and end share a year prints the year once, whatever months they carry.
