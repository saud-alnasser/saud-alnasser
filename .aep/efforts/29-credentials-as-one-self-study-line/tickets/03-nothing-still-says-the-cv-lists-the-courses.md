---
status: resolved
blocked-by: [02]
---

# docs(content): nothing still says the CV lists the courses and the certifications

## Outcome

Every sentence that says the CV lists the courses one by one, or holds a Certifications section whatever the content, says what is true after ticket 02: the CV's education section carries one self-study entry, its Certifications section prints only where an entry exists, and the site's section and card do the same. The content README documents the new file and names a self-study topic on the CV as a witness for a keyword. The earlier effort that decided otherwise is marked at the two lines a later reader lands on.

## Acceptance Criteria

- [x] `grep -n -i "courses\|certification" src/components/CvDocument.astro src/lib/i18n.ts src/content/README.md` returns no line saying the CV lists the courses one by one or holds a certifications section unconditionally, checked by reading every line it returns; the comment block at the top of the component says what each variant holds now; `home.cv` and `cv.description` in both languages name the CV's contents without listing the courses or the certifications as sections it always holds (criterion 8, requirement 8).
- [x] `src/content/README.md` has a `self-study.yaml` section describing `providers` and `topics`, the backing rule, and which outputs read it; its `certificates/` section says the CV prints the courses as one self-study entry and the certifications one per line where any exist; its `skills/` keyword rule names a self-study topic on the CV as a witness; `docs/development.md` says `pnpm test:content` adds two certificates (criterion 8, requirement 8; criterion 3, requirement 3 for the keyword rule).
- [x] Requirement 9 of [[efforts/5-sections-and-resume/spec]] and its assumption naming the typing assessment each carry one added, dated line pointing at [[efforts/29-credentials-as-one-self-study-line/spec]], and every word already there stands (criterion 8, requirement 8).
- [x] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm scan:history` exit 0 (criterion 10, requirement 10).

## Relevant areas

`src/components/CvDocument.astro`, the comment block over `Props`; `src/lib/i18n.ts`, `home.cv` and `cv.description` in `en` and `ar`; `src/content/README.md`, the `profile.yaml`, `certificates/`, and `skills/` sections; `docs/development.md`, the commands table; the earlier spec at the requirement and the assumption named above.

## Constraints

- The annotation of the earlier spec is additive: a date, a link to this effort, and nothing removed or reworded. It is the one write outside the claim the execution policy allows, and the claim widens to that effort on this branch as a result.
- Source comments and the docs never cite the protocol tree; the two spec annotations do, because they are inside it.
- The Arabic of the two descriptions is a draft until Saud reads it, as every new Arabic string has been.

## Notes

Ticket 02 rewrites any comment that would be wrong on landing over a line it changes. This ticket is the sweep for what is left, so a comment ticket 02 already corrected is not a finding here.

Beyond the ticket's list, the repository context's two rows for `src/content/` and `src/lib/` were corrected here, because the effort added `self-study.yaml` and `timeline.ts` and the context named neither; the execution policy has the change and the context it falsified land together.

## What verified each criterion, on 2026-09-23

- **The sweep.** The grep over the three files returned 88 lines, each read. The ones that name the courses or the certifications in relation to the CV are the component's comment block, which lays out the self-study entry and the conditional certifications section per variant; the comment over `tail`; the strings `home.cv` and `cv.description`, which now read "experience, education and self-study, skills, languages, projects, and any certification held" in English and its Arabic; and the README paragraphs rewritten below. Every other line is the education page's courses grid and node, the university's own course list, a plural form, or a section heading, none of which is about the CV listing anything.
- **The README and the docs.** `src/content/README.md` gained the `self-study.yaml` section with the two fields, the backing rule, the outputs that read it, and the pointer from the keyword rule; the `certificates/` paragraph says the CV prints the certifications one per line under a heading that exists only while one does and never lists the courses one by one, and says what adding a recognised credential takes; the `resume` row says the marker on a course does nothing; the education paragraph says the CV's education section is the timeline with the self-study entry. `docs/development.md` names the four fixtures of `pnpm test:content`.
- **The earlier spec.** One dated paragraph under requirement 9 and one under the typing-assessment assumption of the sections effort, each linking here, every earlier word standing; `node .aep/scripts/validate.mjs` resolved both links: 154 artifacts checked, no failures.
- **The gates.** `pnpm build` `[localized] 0 gaps`; `pnpm check` 0 errors; `pnpm test` 644 passed; `pnpm scan:history` no match over 28 commits.
