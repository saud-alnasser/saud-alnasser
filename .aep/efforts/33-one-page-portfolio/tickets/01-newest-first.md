---
status: open
---

# feat(site): every list laid out in time reads newest first

## Outcome

`educationTimeline()` in `src/lib/timeline.ts` returns its items newest first. The courses node's place relative to the institutions is unchanged; only the direction is reversed, as the plan's Components give it. The education page's studies timeline, the CV's education section, and the resume's institutions all read newest first, and so does the courses grid, with the undated courses last. Every check that builds an expected order builds it the new way.

## Acceptance Criteria

- [ ] `educationTimeline()` keeps its signature and returns newest first. `tests/timeline.test.mjs` asserts the order on today's content (university, then the online courses) and on a fixture with two institutions, where the courses node sits between the newer institution and the older one (requirement 1, criterion 1).
- [ ] `src/lib/order.ts` exports `byDateDescending`, with the undated last. The education page's courses grid sorts by it, and `tests/certificates.spec.ts` asserts that order (requirement 1, criterion 1).
- [ ] The CV prints its education section in the timeline's new order. The resume prints its institutions by `byStartDescending`. `tests/resume.spec.ts` and `tests/education.spec.ts` build their expected order through `educationTimeline()` and pass (requirement 1, criterion 1).
- [ ] The dist check's CV and resume expectations for education follow the new order. Its `pdftotext` reading-order check passes on the rendered PDFs (requirement 1, criterion 1; requirement 9, criterion 9).
- [ ] `journey()` is untouched here. Its callers and its tests still pass: ticket 02 removes it (requirement 9, criterion 9).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9).

## Relevant areas

`src/lib/timeline.ts` and its header comment; `src/lib/order.ts`; `src/components/CvDocument.astro`; `src/pages/[locale]/education/index.astro`; `scripts/check-dist.mjs`; `tests/timeline.test.mjs`, `tests/education.spec.ts`, `tests/resume.spec.ts`, `tests/certificates.spec.ts`; `src/content/README.md`, "education/", which describes the order.

## Constraints

- `journey()` reverses `educationTimeline()`'s output today. When the latter flips, the former's input flips with it. Keep `journey()`'s own output newest first, as it is now, by adapting it to the new input, so the home page does not change in this ticket.
- The PDFs are rendered before `check:dist`, as `docs/development.md` says, since a build empties them.
