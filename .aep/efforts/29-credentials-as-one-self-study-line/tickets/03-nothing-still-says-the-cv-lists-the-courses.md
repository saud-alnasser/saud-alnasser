---
status: open
blocked-by: [02]
---

# docs(content): nothing still says the CV lists the courses and the certifications

## Outcome

Every sentence that says the CV lists the courses one by one, or holds a Certifications section whatever the content, says what is true after ticket 02: the CV's education section carries one self-study entry, its Certifications section prints only where an entry exists, and the site's section and card do the same. The content README documents the new file and names a self-study topic on the CV as a witness for a keyword. The earlier effort that decided otherwise is marked at the two lines a later reader lands on.

## Acceptance Criteria

- [ ] `grep -n -i "courses\|certification" src/components/CvDocument.astro src/lib/i18n.ts src/content/README.md` returns no line saying the CV lists the courses one by one or holds a certifications section unconditionally, checked by reading every line it returns; the comment block at the top of the component says what each variant holds now; `home.cv` and `cv.description` in both languages name the CV's contents without listing the courses or the certifications as sections it always holds (criterion 8, requirement 8).
- [ ] `src/content/README.md` has a `self-study.yaml` section describing `providers` and `topics`, the backing rule, and which outputs read it; its `certificates/` section says the CV prints the courses as one self-study entry and the certifications one per line where any exist; its `skills/` keyword rule names a self-study topic on the CV as a witness; `docs/development.md` says `pnpm test:content` adds two certificates (criterion 8, requirement 8; criterion 3, requirement 3 for the keyword rule).
- [ ] Requirement 9 of [[efforts/5-sections-and-resume/spec]] and its assumption naming the typing assessment each carry one added, dated line pointing at [[efforts/29-credentials-as-one-self-study-line/spec]], and every word already there stands (criterion 8, requirement 8).
- [ ] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm scan:history` exit 0 (criterion 10, requirement 10).

## Relevant areas

`src/components/CvDocument.astro`, the comment block over `Props`; `src/lib/i18n.ts`, `home.cv` and `cv.description` in `en` and `ar`; `src/content/README.md`, the `profile.yaml`, `certificates/`, and `skills/` sections; `docs/development.md`, the commands table; the earlier spec at the requirement and the assumption named above.

## Constraints

- The annotation of the earlier spec is additive: a date, a link to this effort, and nothing removed or reworded. It is the one write outside the claim the execution policy allows, and the claim widens to that effort on this branch as a result.
- Source comments and the docs never cite the protocol tree; the two spec annotations do, because they are inside it.
- The Arabic of the two descriptions is a draft until Saud reads it, as every new Arabic string has been.

## Notes

Ticket 02 rewrites any comment that would be wrong on landing over a line it changes. This ticket is the sweep for what is left, so a comment ticket 02 already corrected is not a finding here.
