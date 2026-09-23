---
status: open
blocked-by: [01]
---

# feat(cv): the course completions as one self-study entry in the CV's education section

## Outcome

The CV's Courses section is gone. Its education section carries one self-study entry, placed before the university through the timeline helper the education page now also uses, reading the title and the year, the count of courses with the two providers, and the authored topics in that language. The topics and the providers live in `src/content/self-study.yaml`; the count and the years come from the course entries. The dist check backs every topic against a course name and every provider against an issuer, and reads the new entry in the PDF's reading order. The content mechanism test proves a course reaches the education page and the JSON documents but no longer the CV, and that a certification restores the CV's section, the education page's section, and the home page's card. The resume is untouched.

## Acceptance Criteria

- [ ] On `/en/cv/` and `/ar/cv/` there is no `[data-cv-section="courses"]` and no line carrying a single course's name with its issuer; inside `[data-cv-section="education"]` one `[data-self-study]` entry, ordered before the university's, contains the year, the count 26, both provider names, and every authored topic in that language's words; `pnpm check:dist` finds the entry's title with its period and its providers line in reading order in `cv.en.pdf`; removing one SoloLearn entry and rebuilding changes the count to 25 with no other edit, put back and recorded here (criterion 2, requirement 2).
- [ ] The `selfStudy` check in `scripts/check-dist.mjs` fails naming the first authored topic whose English is contained, case-insensitively, in no course entry's English name, and the first provider that is no course's issuer, tried once each and put back; the authored English topics include Docker, unit testing, design patterns, refactoring, and data structures (criterion 3, requirement 3).
- [ ] `pnpm test:content` writes a certification fixture beside the course fixture: the course fixture's name is in both education pages and both `resume.json` files and in neither CV page; the certification fixture's name is in both education pages, both CV pages, and both `resume.json` files; with the fixtures present, both home pages carry `data-section-card="certifications"`, both education pages `id="certificates"`, and both CV pages `data-cv-section="certifications"`, and without them none of the six does (criterion 5, requirement 5).
- [ ] `pnpm check:dist` still reports both JSON Resume documents valid with `certificates` matching the collection and `education` holding the institutions alone (criterion 6, requirement 6).
- [ ] `tests/resume.spec.ts` asserts on both resume pages that no `[data-self-study]` entry and no credential section prints, and `pnpm render:pdf` reports `resume.en.pdf`, `resume.ar.pdf`, and the filled copy of each at one page on A4 and on Letter with at least 10mm free at Letter; the four numbers go in the commit (criterion 7, requirement 7).
- [ ] `pnpm build` prints `[localized] 0 gaps` (criterion 9, requirement 9).
- [ ] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (criterion 10, requirement 10).

## Relevant areas

`src/content.config.ts`, the `profile` collection as the model for the `selfStudy` one; `src/content/self-study.yaml`, new, with the data model the plan gives; `src/lib/timeline.ts`, new, with the interface the plan gives, and `src/pages/[locale]/education/index.astro`, whose `items` splice moves into it; `src/components/CvDocument.astro`, the education section, `tail`, and the `CertificateSection` type; `src/lib/i18n.ts`, `cv.selfStudy` in both languages, `cv.courses` removed, `education.onlineCourses.noun` reused; `scripts/check-dist.mjs`, the reading-order expectation's education groups and the new `selfStudy` check beside `noOverclaim`; `scripts/test-content-mechanism.mjs`, the fixtures and `assertCardUnopenable`; `tests/resume.spec.ts`, `held`, `tailOrder`, the education periods case, and the credentials case; `tests/periods.spec.ts`, the CV's count. [[efforts/29-credentials-as-one-self-study-line/plan]], "Components", "Interfaces", "Data Model", and steps 2 and 3 of "Technical Approach".

## Constraints

- `src/lib/timeline.ts` imports nothing at runtime, as `shown.ts` and `order.ts` do not: the dist check and the tests import it with Node stripping the types.
- The education page's output does not change when it is routed through the helper; `tests/education.spec.ts` passes unchanged at that point, and it is worth building and running the tests there before the CV work starts.
- The self-study entry renders on the CV alone; the resume's education section is the institutions, as before.
- The providers are joined by `Intl.ListFormat` with the conjunction type in the page's locale, and the Arabic CV case expects the Arabic conjunction, so a missing ICU shows up in the test rather than on the published page.
- The topics line is not a reading-order group in the dist check, because it wraps on paper; the title with the period and the providers line are.
- `cv.courses` leaves `src/lib/i18n.ts` and `courses` leaves `tail`; neither stays as an unused string or an empty row.
- The comment over `topics` in the content file states the backing rule, and `src/content/README.md` gains its section in ticket 03, not here.

## Notes

The verification of each criterion, with the counts and the four headroom numbers, is recorded here on landing.
