---
status: open
blocked-by: [01]
---

# docs(cv): nothing still says the code is GitHub's

## Outcome

Every sentence that says the documents carry the GitHub address as their code, or that a profile which is not the code is written out, says what is true after ticket 01: the code is LinkedIn's, the contact line carries no profile, and GitHub reaches the home page, the README, and the JSON documents. The two earlier efforts that decided otherwise are marked at the line a later reader lands on.

## Acceptance Criteria

- [ ] No comment in `src/components/QrCode.astro`, `src/components/CvDocument.astro`, `src/lib/icons.ts`, or `src/components/Icon.astro` says the code carries the GitHub address or draws the GitHub mark, checked by reading every line `grep -n -i github` returns over the four files (criterion 6, requirement 6).
- [ ] The comment over `profiles` in `src/content/profile.yaml` says LinkedIn is the code and GitHub is first for the home page and the README; `docs/development.md` says the code is the only route to the LinkedIn address and that no profile is written out; the repository context's row for the components says the code carries the LinkedIn address (criterion 6, requirement 6).
- [ ] Requirement 7 of the earlier document effort's spec and the LinkedIn exclusion of the profile effort's spec each carry one added, dated line pointing at this effort, and every word already there stands (criterion 6, requirement 6).
- [ ] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm scan:history` exit 0 (criterion 9, requirement 9).

## Relevant areas

The four source files named above; `src/content/profile.yaml`, the comment over `profiles`; `docs/development.md`, the paragraph opening "On paper, the QR code in the header is the only route"; the repository context's shape table; the two earlier specs at the requirement and the exclusion the effort's spec names in its scope.

## Constraints

- The annotation of an earlier spec is additive: a date, a link to this effort, and nothing removed or reworded. That is the one write outside the claim the execution policy allows, and the claim widens to those two efforts on this branch as a result.
- Source comments and the docs never cite the protocol tree; the two spec annotations do, because they are inside it.

## Notes

Ticket 01 rewrites any comment that would be wrong on landing over a constant it changes. This ticket is the sweep for what is left, so a comment ticket 01 already corrected is not a finding here.
