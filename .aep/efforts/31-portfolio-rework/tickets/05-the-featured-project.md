---
status: open
blocked-by: [04]
---

# feat(content): one project marked featured, shown as a wider card at the head of the work page

## Outcome

A project can carry `featured: true`. The schema refuses it on a hidden or unfinished project, and `featuredProject` refuses two. `rentable` carries it. The work page opens its projects with that project as a raised, full-width card showing every badge and its links, and leaves it out of the grid below. With no project marked there is no featured card and the build passes.

## Acceptance Criteria

- [ ] `src/content.config.ts` gives projects `featured: z.boolean().optional()`, refined so `featured` implies shown, with a message naming the rule. `src/lib/shown.ts` exports `featuredProject`, which throws naming both files when two are marked (requirement 4, criterion 4).
- [ ] `scripts/test-content-mechanism.mjs` builds three fixtures. A hidden project marked featured fails the build naming its file. Two marked fail naming both. None marked builds with no featured card on the work page or the home page (requirement 4, criterion 4).
- [ ] `src/content/projects/rentable.yaml` carries `featured: true`, and `src/content/README.md` documents the field and the two refusals (requirement 4, criterion 4).
- [ ] `FeaturedProject.astro` renders a `raised` card with a "Featured" label in both languages, a star icon, the name, years, role, summary, every badge, and the links. The work page renders it above the grid, and the grid omits that project. A test asserts it is wider than a grid card at 1440 and appears once (requirement 4, criterion 4; requirement 8).
- [ ] The featured card meets AA in both palettes and mirrors in Arabic (requirement 9, criterion 9; requirement 12, criterion 12).
- [ ] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0, and `resume.json` in both languages is unchanged (requirement 13, criterion 13).

## Relevant areas

`src/content.config.ts`; `src/lib/shown.ts`; `src/content/projects/rentable.yaml`; `src/content/README.md`; `src/components/FeaturedProject.astro` (new); `src/pages/[locale]/work/index.astro`; `src/lib/icons.ts` (the star); `src/lib/i18n.ts`; `scripts/test-content-mechanism.mjs`; `tests/work.spec.ts`.

## Constraints

- `order` keeps its meaning. Featuring a project reorders nothing on the CV or the resume.
- The home page's placement of the card is ticket 08's. This ticket builds the component and the work page only.
