---
status: resolved
blocked-by: [01]
---

# feat(content): the university dated 2022 to 2026

## Outcome

The university entry's period is the two years Saud gave, and every place the institution is printed reads `2022-2026`. No other content file changes, and the JSON Resume documents carry the entry's years and every other entry's months as authored.

## Acceptance Criteria

- [x] `git diff main -- src/content/` names no entry file but `src/content/education/saudi-electronic-university.yaml`, and in it only the `start` and `end` lines of `period`, now `"2022"` and `"2026"`; `dist/en/resume.json` and `dist/ar/resume.json` carry `education[0].startDate` as `2022` and `endDate` as `2026`, and each project's `startDate` and `endDate` at the month precision `main` carries (criterion 3 of [[efforts/25-years-only-time-frames/spec]]). Verified 2026-09-22: `git diff --stat main -- src/content/` names the entry, 2 insertions and 2 deletions, and `README.md`, which is ticket 01's sentence; both JSON documents carry `education` as `[["2022","2026"]]` and thirteen project pairs all at `YYYY-MM`, the first `["2025-08","2026-08"]` and the last `["2023-09","2025-05"]`, as on main.
- [x] `/en/education/` and `/ar/education/` print `2022-2026` on the university card, and `/en/cv/`, `/ar/cv/`, `/en/resume/`, and `/ar/resume/` print it on the education row, asserted through the content the way the existing assertions are (criterion 4). Verified 2026-09-22: each of the six built pages carries `2022-2026` once and `2023-2026` nowhere; the education and resume tests read the entry's period through `formatPeriod` and passed.
- [x] `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0, and `pnpm render:pdf` reports both resumes, published and filled, at one page with headroom above the floor (criterion 7). Verified 2026-09-22: `[localized] 0 gaps`; `pnpm check` `0 errors, 0 warnings`; `pnpm render:pdf` reported `resume.en.pdf` 1 page at A4 with 54.8mm free and at Letter with 36.8mm, `resume.ar.pdf` 54.3mm and 36.3mm, the filled copies 49.5mm, 31.5mm, 49.0mm, and 31.0mm; `pnpm check:dist` exited 0; `pnpm test` `634 passed (37.3s)`; `pnpm test:content` `passed`; `pnpm scan:history` `47639 lines over 25 commits, no identifier pattern matches`.

## Relevant areas

`src/content/education/saudi-electronic-university.yaml`, the `period` block and the comment above it, which says when the course work finished and stays true. `tests/education.spec.ts` and `tests/resume.spec.ts`, which read the entry to know what to expect. `dist/en/resume.json` and `dist/ar/resume.json` after a build.

## Constraints

- The months are not known, so the entry carries years, not an invented month. If they are supplied later the entry can carry them and the display does not change.
- Nothing else under `src/content/` is coarsened; the ordering and the JSON documents read the months the other entries keep.
