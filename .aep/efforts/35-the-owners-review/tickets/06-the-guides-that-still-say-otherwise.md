---
status: resolved
blocked-by: [05]
---

# docs: the repository guides name the skills test, the course list, and the source link

## Outcome

`.aep/contexts/repository.md` and `docs/development.md` describe the repository as effort 35 left it. `pnpm test:content` runs three Node tests, not two, and the skills rule is among them. The components include the course list. `src/lib/` holds the certificate document lookup, and `paths.ts` holds the repository address.

## Acceptance Criteria

- [x] The `tests/` row of `.aep/contexts/repository.md` and the `pnpm test:content` line of `docs/development.md` name the skills test beside the marks' licences and the timeline's order (requirement 4, criterion 4). Verified: the `tests/` row now reads "the three Node tests `pnpm test:content` runs first: the technology marks' licences, the education timeline's order, and the skill keywords' backing", and the `pnpm test:content` line of `docs/development.md` names "every skill keyword's backing".
- [x] The components row names `CourseList.astro`, the timeline's courses node, and the `src/lib/` row names `certificates.ts` and the repository address in `paths.ts` (requirement 6, criterion 6; requirement 2, criterion 2). Verified: the components row names `CourseList.astro` as the timeline's online-courses node. The `src/lib/` row names `certificates.ts` and the repository address in `paths.ts`.
- [x] `node .aep/scripts/validate.mjs` reports no failures (requirement 9, criterion 9). Verified: `node .aep/scripts/validate.mjs` printed "183 artifacts checked, no failures" before this ticket and is rerun below.

## Relevant areas

`.aep/contexts/repository.md`, `docs/development.md`.

## Notes

- Appended at converge, round two. No criterion was unmet, but these guides were made untrue by tickets 01, 04, and 05.
