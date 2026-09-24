---
status: resolved
---

# feat(site): every list laid out in time reads newest first

## Outcome

`educationTimeline()` in `src/lib/timeline.ts` returns its items newest first. The courses node's place relative to the institutions is unchanged; only the direction is reversed, as the plan's Components give it. The education page's studies timeline, the CV's education section, and the resume's institutions all read newest first, and so does the courses grid, with the undated courses last. Every check that builds an expected order builds it the new way.

## Acceptance Criteria

- [x] `educationTimeline()` keeps its signature and returns newest first. `tests/timeline.test.mjs` asserts the order on today's content (university, then the online courses) and on a fixture with two institutions, where the courses node sits between the newer institution and the older one (requirement 1, criterion 1). Verified: `node --test tests/timeline.test.mjs` printed 6 passes, among them "today's education reads newest first, the university and then the online courses" and "the online-courses node sits between the newer institution and the older one".
- [x] `src/lib/order.ts` exports `byDateDescending`, with the undated last. The education page's courses grid sorts by it, and `tests/certificates.spec.ts` asserts that order (requirement 1, criterion 1). Verified: `pnpm test` passed the certificates case asserting the cards' dates equal the content sorted by `byDateDescending`, "newest first, the undated last", in both languages and palettes.
- [x] The CV prints its education section in the timeline's new order. The resume prints its institutions by `byStartDescending`. `tests/resume.spec.ts` and `tests/education.spec.ts` build their expected order through `educationTimeline()` and pass (requirement 1, criterion 1). Verified: `pnpm test` passed "reads newest first, with the courses node where the timeline rule puts it" on both education pages and "dates each education entry from the content" and the self-study case on all four documents; `pdftotext` of `dist/cv.en.pdf` reads the bachelor's degree, then Self-study.
- [x] The dist check's CV and resume expectations for education follow the new order. Its `pdftotext` reading-order check passes on the rendered PDFs (requirement 1, criterion 1; requirement 9, criterion 9). Verified: after `pnpm render:pdf`, `pnpm check:dist` exited 0 and printed "cv.en.pdf: 14 expected facts found in 9 groups in reading order" and the same for the resume and both filled copies.
- [x] `journey()` is untouched here. Its callers and its tests still pass: ticket 02 removes it (requirement 9, criterion 9). Verified: its one change is reversing its input back to oldest first; its three unit tests pass unchanged, and `pnpm test` passed the home page's timeline cases, which build the order through `journey`.
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9). Verified: build 0 ("[localized] 0 gaps"), check 0 (0 errors, 0 warnings), check:dist 0, test 0 (934 passed), test:content 0 ("test-content-mechanism: passed"), scan:history 0 on the ticket's commit.

## Relevant areas

`src/lib/timeline.ts` and its header comment; `src/lib/order.ts`; `src/components/CvDocument.astro`; `src/pages/[locale]/education/index.astro`; `scripts/check-dist.mjs`; `tests/timeline.test.mjs`, `tests/education.spec.ts`, `tests/resume.spec.ts`, `tests/certificates.spec.ts`; `src/content/README.md`, "education/", which describes the order.

## Constraints

- `journey()` reverses `educationTimeline()`'s output today. When the latter flips, the former's input flips with it. Keep `journey()`'s own output newest first, as it is now, by adapting it to the new input, so the home page does not change in this ticket.
- The PDFs are rendered before `check:dist`, as `docs/development.md` says, since a build empties them.

## Notes

- The certifications grid follows the courses grid, newest first. The page sorts the certificates once, so reclassifying an entry only moves its card between the grids. No certification exists today, so nothing on the page moves.
- `resume.json` lists education newest first too. Its comment says it keeps the pages' orders. The CV's and resume's certification lists keep their order, because the spec rules out any document change beyond education.
