---
status: open
---

# feat(content): skills read from the code, rentable's whole stack, and five weaker projects hidden

## Outcome

The five projects the plan's Components names are `hidden`. rentable names the tools its manifests show, and the skill groups read as the plan's Components lists them. A new test, run by `pnpm test:content`, fails naming any keyword that has neither a shown project nor a line in its backing table behind it. The resume is still one page.

## Acceptance Criteria

- [ ] `course-cpu-scheduling-simulator`, `course-simple-personal-information-form`, `cs475-course-viewer`, `godot-brackeys-simple-platformer`, and `learning-rust` carry `visibility: hidden`. After `pnpm build`, none of their names appears in `dist/`, the CV and `resume.json` included (requirement 7, criterion 7).
- [ ] `src/lib/shown.ts` is unchanged (requirement 8, criterion 8).
- [ ] rentable's technologies add Drizzle ORM, tRPC, Zod, Tailwind CSS, Vite, Vitest, and SQLite. The skill groups match the plan's Components exactly. None of Java, GDScript, Godot, or SolidJS is in a group. C#, Docker, Design patterns, Refactoring, Unit testing, and "Data structures and algorithms" are (requirement 4, criterion 4).
- [ ] `tests/skills.test.mjs` exists, is run by `pnpm test:content`, and passes. Adding a keyword with no backing makes it fail with that keyword's name. A backing line pointing at a hidden project fails it too, which a fixture or a temporary edit shows, and the edit is reverted (requirement 4, criterion 4).
- [ ] `src/content/README.md`, beside `keywords`, says where the backing of a keyword no card names is recorded (requirement 4, criterion 4).
- [ ] `pnpm render:pdf` writes both resumes and their filled copies at one page on A4 and Letter, with the free space the script requires. The measured millimetres go in the commit message (requirement 10, criterion 10).
- [ ] `pnpm check`, `pnpm build` (gap report unchanged), `pnpm check:dist`, `pnpm test`, and `pnpm test:content` exit 0. Tests that counted the hidden projects or the old keywords take their expectations from the content, not from new literals (requirement 9, criterion 9).

## Relevant areas

`src/content/projects/`, `src/content/skills/`, `tests/skills.test.mjs` (new), `package.json` (`test:content`), `src/content/README.md`, `src/lib/shown.ts` (read only), `tests/home.spec.ts` (tiles and skills), `scripts/check-dist.mjs`, `scripts/render-pdf.mjs`.

## Constraints

- The backing table lives in the test file, not in the schema (plan, Architecture).
- The test reads "shown" by the same rule as `src/lib/shown.ts`: not `hidden`, and `completed`. Import it where Node's type stripping allows, as `tests/technologies.test.mjs` imports `src/lib/technologies.ts`.
- If the resume overflows, stop and surface it. Never shrink the type.

## Notes

- Evidence for rentable's additions is the manifests read on 2026-09-24: `apps/desktop/package.json` lists `drizzle-orm`, `@trpc/server`, `zod`, `tailwindcss`, `vite`, `vitest`, and `better-sqlite3`, and the Tauri crate depends on `turso`.
