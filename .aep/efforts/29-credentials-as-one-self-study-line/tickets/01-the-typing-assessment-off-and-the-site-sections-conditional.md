---
status: open
---

# feat(site): the typing assessment off the record, and the certifications section and card only where one exists

## Outcome

The typing.com entry, its PDF, and its preview are gone, and nothing under `src/`, `scripts/`, `tests/`, or `docs/` names them. With no entry of kind `certification` left, the education page renders no Certifications heading and no certifications grid, the home page renders no certifications card, and the CV drops its Certifications heading as it already did. The three browser tests that read those surfaces expect presence or absence from the content's own count, so they pass in both states. The JSON Resume documents carry one entry fewer under `certificates`.

## Acceptance Criteria

- [ ] `git ls-files src/content/certificates` lists no file whose name begins `typing-com`; `grep -rn -i "typing.com\|typing-com" src scripts tests docs README.md` prints nothing; `pnpm build` passes; `dist/en/resume.json` carries 26 entries under `certificates`, which `pnpm check:dist` confirms (criterion 1, requirement 1).
- [ ] `/en/education/` and `/ar/education/` contain no `h2#certificates` and no `[data-grid="certifications"]`; `/en/` and `/ar/` contain no `[data-section-card="certifications"]` and no text matching the certifications count line for zero; `tests/education.spec.ts`, `tests/home.spec.ts`, and `tests/certificates.spec.ts` derive the expectation from the content's count of certifications rather than from a literal (criterion 4, requirement 4).
- [ ] `[data-grid="courses"] > li` on both education pages counts 26, the timeline node counts 26 and runs 2021 to 2021, the home page's courses card counts 26, and `pnpm check:dist` reports both JSON Resume documents valid with `certificates` matching the collection (criterion 6, requirement 6).
- [ ] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (criterion 10, requirement 10).

## Relevant areas

`src/content/certificates/typing-com-advanced-assessment.yaml` and the two files it names under `src/content/certificates/files/`; `src/pages/[locale]/education/index.astro`, the certifications section after the courses grid; `src/pages/[locale]/index.astro`, the `sections` array; `tests/education.spec.ts`, the grid and heading case; `tests/home.spec.ts`, the `sections` list and the card cases; `tests/certificates.spec.ts`, the per-grid case. The plan's step 1 in [[efforts/29-credentials-as-one-self-study-line/plan]], "Technical Approach".

## Constraints

- The condition is the CV's existing one, a section rendered only where it holds something; no new mechanism, no placeholder text where the section was.
- The `certificates` anchor is absent with the section, not kept as an empty target.
- The tests build their expected lists from the content, so the same file passes with a certification present and absent; a literal count or a skipped test does not satisfy criterion 4.
- `pnpm test:content` still runs with its single course fixture at this step; ticket 02 rewrites the fixtures.

## Notes

The content mechanism test's course fixture reaches the CV at this step, as it did; that changes in ticket 02 and is not a finding here.
