---
status: resolved
blocked-by: [04]
---

# feat(content): one project marked featured, shown as a wider card at the head of the work page

## Outcome

A project can carry `featured: true`. The schema refuses it on a hidden or unfinished project, and `featuredProject` refuses two. `rentable` carries it. The work page opens its projects with that project as a raised, full-width card showing every badge and its links, and leaves it out of the grid below. With no project marked there is no featured card and the build passes.

## Acceptance Criteria

- [x] `src/content.config.ts` gives projects `featured: z.boolean().optional()`, refined so `featured` implies shown, with a message naming the rule. `src/lib/shown.ts` exports `featuredProject`, which throws naming both files when two are marked (requirement 4, criterion 4).
- [x] `scripts/test-content-mechanism.mjs` builds three fixtures. A hidden project marked featured fails the build naming its file. Two marked fail naming both. None marked builds with no featured card on the work page or the home page (requirement 4, criterion 4).
- [x] `src/content/projects/rentable.yaml` carries `featured: true`, and `src/content/README.md` documents the field and the two refusals (requirement 4, criterion 4).
- [x] `FeaturedProject.astro` renders a `raised` card with a "Featured" label in both languages, a star icon, the name, years, role, summary, every badge, and the links. The work page renders it above the grid, and the grid omits that project. A test asserts it is wider than a grid card at 1440 and appears once (requirement 4, criterion 4; requirement 8).
- [x] The featured card meets AA in both palettes and mirrors in Arabic (requirement 9, criterion 9; requirement 12, criterion 12).
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0, and `resume.json` in both languages is unchanged (requirement 13, criterion 13).

## Relevant areas

`src/content.config.ts`; `src/lib/shown.ts`; `src/content/projects/rentable.yaml`; `src/content/README.md`; `src/components/FeaturedProject.astro` (new); `src/pages/[locale]/work/index.astro`; `src/lib/icons.ts` (the star); `src/lib/i18n.ts`; `scripts/test-content-mechanism.mjs`; `tests/work.spec.ts`.

## Constraints

- `order` keeps its meaning. Featuring a project reorders nothing on the CV or the resume.
- The home page's placement of the card is ticket 08's. This ticket builds the component and the work page only.

## Notes

The links a project card shows moved into `ProjectLinks.astro`, which the grid card and the featured card both render, so the two cannot disagree about where a project leads.

`featuredProject` is generic over the whole entry rather than over its data, as the plan's Interfaces wrote it, so that the work page gets back the collection entry it passed in. `astro check` refused the narrower return type.

The featured card carries `data-featured-project` rather than `data-entry="project"`, so a test or the filter in ticket 06 can tell it from the grid's cards. It is not marked `data-reveal`, for the reason ticket 03 records: a card already moves on `translate` for its lift.

`resume.json` in both languages differs from the build before this ticket only in `meta.lastModified`, the build's own timestamp.

## What verified each criterion, on 2026-09-24

- **The field and the refusals.** `src/content.config.ts` gives projects `featured: z.boolean().optional()`, refined through `isShown` with the message "only a shown project can be featured: one marked featured must be completed and not hidden". `featuredProject` in `src/lib/shown.ts` throws "only one project can be featured, and 2 are:" followed by both files.
- **The fixtures.** `pnpm test:content` printed `a hidden project marked featured: the build refused, naming fixture-featured-hidden-5a2d8b.yaml`, then `two projects marked featured: the build refused, naming src/content/projects/rentable.yaml and src/content/projects/fixture-featured-second-8e6c1f.yaml`, then `no project marked featured: built, with no featured card on either work page or home page`, and passed, with `rentable.yaml` written back as it was.
- **The content.** `rentable.yaml` carries `featured: true`, and `src/content/README.md` documents the field and both refusals.
- **The card.** "leads the projects with the featured one, once" passed on both work pages in both palettes at 1440. The card appears once, before the grid, with the label, an `aria-hidden` star, the name, the years, every badge with nothing folded, and the repository link. It is wider than a grid card and rests at the raised shadow, and the grid does not name the project.
- **Contrast and direction.** The contrast suite passed on both work pages in both palettes with the card on them, and the screenshots at 1440 in Arabic dark and English light show it mirrored.
- **The gates.** `pnpm build` complete with 0 gaps; `pnpm check` 0 errors and 0 warnings; `pnpm check:dist` exit 0, with both `resume.json` documents valid at 13 projects; `pnpm test` 836 passed; `pnpm test:content` passed; `pnpm scan:history` no identifier pattern over 43 commits. `resume.json` compared with the previous build is identical in both languages apart from `meta.lastModified`.
