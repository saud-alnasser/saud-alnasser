---
status: accepted
---

# Problem

Every time frame the site and the two documents print carries a month, and the university's carries the wrong years.

A project, an experience entry, and an institution each have a `period`, `start` and an optional `end`, written to the month in `src/content/`. One function, `formatPeriod` in `src/lib/i18n.ts`, prints it everywhere a reader sees it: the cards on the work page, the institution cards and the online-courses node on the education page, the experience, education, and project rows of the CV and the resume, and so the four PDFs rendered from those pages. It prints each end at the precision it was written, joined by the locale's word for "to", so a reader sees "Mar 2024 to Nov 2024" for work done in one year and "Sep 2023 to Sep 2026" for the degree. Saud asked on 2026-09-22 for years alone: one year when the work falls in one, a range of two when it does not, and no month or day anywhere. He also said the university's time frame is 2022 to 2026, where the entry says 2023-09 to 2026-09.

The content is right to keep the month. `src/lib/order.ts` sorts by it, and the JSON Resume documents at `/en/resume.json` and `/ar/resume.json` carry the dates as written. What a reader sees is the only thing that is wrong.

# Goal

A reader of any page or either document sees a time frame as a year, "2024", or as two years, "2022-2026", and an ongoing one as a year and the locale's word for the present. The university reads 2022-2026. The content under `src/content/` keeps its precision, the ordering does not move, and the JSON Resume documents carry what was authored.

# Scope

- `src/lib/i18n.ts`: `formatPeriod`, the `period` strings it reads, and the header comment that describes it.
- `src/content/education/saudi-electronic-university.yaml`: the period.
- `src/content/README.md`: the line that says what a `period` is, gaining what it prints as.
- `src/lib/languages.ts`: the comment that contrasts the language test's year with the other dates on the document, which stops being a contrast.
- The tests and checks that read the content to know what to expect, which already call `formatPeriod` and follow it: `tests/work.spec.ts`, `tests/education.spec.ts`, `tests/resume.spec.ts`, `scripts/check-dist.mjs`. In scope for one new assertion: that what is printed carries no month.
- The five templates that call `formatPeriod`, `Experience.astro`, `Project.astro`, `Education.astro`, `CvDocument.astro`, and the education page: the element that prints the period gains a `data-period` marker so a test can find every one, and nothing else about them changes.

# Requirements

1. **A period prints as years.** `formatPeriod` returns the start's year alone when the end falls in the same year, the two years joined by a hyphen when it does not, and the start's year joined the same way to the locale's word for the present when there is no end. No month and no day, whatever precision the content wrote.
2. **Every output follows.** The work page, the education page including the online-courses node, the CV page, the resume page, and the four PDFs print every period in that form, in both languages, because each reads the one function.
3. **The content keeps its precision.** No period in `src/content/` changes except the university's, and both JSON Resume documents carry every `startDate` and `endDate` as the content writes it.
4. **The university is 2022 to 2026.** The entry's period is `start: "2022"` and `end: "2026"`, and it prints "2022-2026" wherever the institution is printed.
5. **Documented where the format is documented.** `src/content/README.md` says a period is authored to whatever precision is known and printed as years alone, single or a range, and the header comment in `src/lib/i18n.ts` describes the function as it now behaves.
6. **Both languages say the same thing.** The Arabic pages print the same years with the Arabic word for the present, and the build reports no localisation gap.
7. **Every gate passes.** `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history`.

# Acceptance Criteria

1. Called directly, `formatPeriod('en', { start: '2024-03', end: '2024-11' })` is `2024`, `formatPeriod('en', { start: '2023-09', end: '2025-05' })` is `2023-2025`, `formatPeriod('en', { start: '2024-06' })` is `2024-Present`, and the three Arabic calls give `2024`, `2023-2025`, and `2024-الآن`. Asserted in a test that calls the function.
2. On `/en/work/`, `/ar/work/`, `/en/education/`, `/ar/education/`, and the four document pages, every `[data-period]` element matches `^\d{4}(-(\d{4}|Present|الآن))?$` after trimming, there is at least one on each page, and each entry's own period assertion in the existing tests still holds, and `pdftotext` over `cv.en.pdf` and `resume.en.pdf` prints no English month abbreviation followed by a year that is not part of a certificate's full date, which carries the day before the month. `pnpm check:dist` still finds the CV rows it expects, since it builds them from the same function.
3. `git diff main -- src/content/` names no entry file but `src/content/education/saudi-electronic-university.yaml`, and in it only the two period lines; `src/content/README.md` is the one other file under that directory it may name, for the sentence criterion 5 asks for. `dist/en/resume.json` and `dist/ar/resume.json` carry `education[0].startDate` as `2022` and `endDate` as `2026`, and every project's `startDate` and `endDate` at the month precision `main` carries.
4. `/en/education/` and `/ar/education/` print `2022-2026` on the university card, and all four document pages print it on the education row, asserted in the tests through the content the way the existing assertions are.
5. `src/content/README.md` carries the sentence on the "Dates" line, and the header comment of `src/lib/i18n.ts` describes the year-only form.
6. `pnpm build` prints `[localized] 0 gaps`.
7. `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` all exit 0.

# Constraints

- **One function prints every period.** It is what makes the change one edit and what lets the tests and the dist check read the expectation from the code rather than from a literal. No component grows a format of its own.
- **The content contract does not change.** `iso8601` still accepts a year, a month, or a day, because the month is what the ordering and the JSON Resume documents need. A content file is never coarsened to make the display coarser.
- **The resume stays one page.** `scripts/render-pdf.mjs` enforces it. A period can only get shorter here, so this is a gate to run rather than a risk to design around.
- **Strings a reader sees live in `strings`.** The word for the present stays there per locale. The hyphen is punctuation shared by both languages and lives in the function.

# Out of Scope

- **The certificate issue dates.** A certificate's `date` is one day, not a time frame, and the courses grid and the CV's certificate rows print it in full. Saud asked about time frames. If the dates should be years too, that is one call in `Certificate.astro` and one in `CvDocument.astro` and a separate ask.
- **The language test's year.** `src/lib/languages.ts` already prints the year alone.
- **The precision of any other content entry.** Every project and the training placement keep the months they were written with.

# Assumptions

- **The range mark is a hyphen, unspaced.** Saud wrote the range as "20**-20**", and the hyphen is kept rather than replaced by an en dash for two reasons that hold in this repository: a resume parser reads "2022-2026" as a range without a second thought, and a hyphen between two numbers is a number separator to the bidi algorithm, so the Arabic pages show the range in one left-to-right piece with the start on the left, the same as the English, where a dash would let the browser reorder the two years. If the en dash is wanted after all, it is one character in one function.
- **An ongoing period prints the year and the present word.** No entry is ongoing today, so nothing shows it; the contract allows it and the function has to print something.
- **The university's months are not known.** Saud gave years, so the entry carries years. If the months are supplied later the entry can carry them and the display does not change.

# Risks

- **A test that pins the old wording.** Every assertion found reads `formatPeriod`, so each follows the function. Criterion 2's month check is what catches one that does not.
- **The Arabic PDFs.** `pnpm check:dist` extracts the English PDFs only and leaves the Arabic ones to be checked by eye, so what the range looks like in Arabic is confirmed by opening `dist/cv.ar.pdf` once the render has run, and the closing report says what was seen.
