---
status: resolved
blocked-by: [01]
---

# docs(cv): nothing still says the code is GitHub's

## Outcome

Every sentence that says the documents carry the GitHub address as their code, or that a profile which is not the code is written out, says what is true after ticket 01: the code is LinkedIn's, the contact line carries no profile, and GitHub reaches the home page, the README, and the JSON documents. The two earlier efforts that decided otherwise are marked at the line a later reader lands on.

## Acceptance Criteria

- [x] No comment in `src/components/QrCode.astro`, `src/components/CvDocument.astro`, `src/lib/icons.ts`, or `src/components/Icon.astro` says the code carries the GitHub address or draws the GitHub mark, checked by reading every line `grep -n -i github` returns over the four files (criterion 6, requirement 6).
- [x] The comment over `profiles` in `src/content/profile.yaml` says LinkedIn is the code and GitHub is first for the home page and the README; `docs/development.md` says the code is the only route to the LinkedIn address and that no profile is written out; the repository context's row for the components says the code carries the LinkedIn address (criterion 6, requirement 6).
- [x] Requirement 7 of the earlier document effort's spec and the LinkedIn exclusion of the profile effort's spec each carry one added, dated line pointing at this effort, and every word already there stands (criterion 6, requirement 6).
- [x] `pnpm build`, `pnpm check`, `pnpm test`, and `pnpm scan:history` exit 0 (criterion 9, requirement 9).

## Relevant areas

The four source files named above; `src/content/profile.yaml`, the comment over `profiles`; `docs/development.md`, the paragraph opening "On paper, the QR code in the header is the only route"; the repository context's shape table; the two earlier specs at the requirement and the exclusion the effort's spec names in its scope.

## Constraints

- The annotation of an earlier spec is additive: a date, a link to this effort, and nothing removed or reworded. That is the one write outside the claim the execution policy allows, and the claim widens to those two efforts on this branch as a result.
- Source comments and the docs never cite the protocol tree; the two spec annotations do, because they are inside it.

## Notes

Ticket 01 rewrites any comment that would be wrong on landing over a constant it changes. This ticket is the sweep for what is left, so a comment ticket 01 already corrected is not a finding here.

## What verified each criterion, on 2026-09-22

- **The four source files.** `grep -n -i github` over them returns, after the sweep: the two history lines in the QR component (which profile the code was before, and the module the GitHub address measured), the two in the document component recording when and why the code changed and GitHub left, the Simple Icons licence lines and the `github` key in the icon module, and nothing in the icon component. None says the code carries the GitHub address or draws the GitHub mark.
- **The comment, the docs, the context.** The comment over `profiles` in `profile.yaml` says GitHub is first for the home page and the README, that the code is LinkedIn's and found by its network, and that the contact line writes no profile out. The paragraph in `docs/development.md` names the LinkedIn address as the code's, no profile written out, the one function that decides it, the cost now covering GitHub, and the two checks. The context's components row names the LinkedIn address and the function.
- **The two earlier specs.** One dated paragraph added under requirement 7 of the document effort and one under the LinkedIn exclusion of the profile effort, each linking here, with every earlier word standing; `validate.mjs` resolved both links, and `scope.mjs` now reads the working set as those two efforts beside the claim, which is the visible cost the execution policy names.
- **Two lines beyond the ticket's list, corrected because they were wrong on landing.** The hazards comment in the dist check said the code carried the GitHub address; it now says a profile address, GitHub's then and LinkedIn's since. The project-row comment in the document component said the repository was one click from the portfolio link in the contact line, which had no such link even before this effort; it now points at the work page and `resume.json`.
- **The gates.** `pnpm build` `[localized] 0 gaps`; `pnpm check` 0 errors; `pnpm test` `644 passed (34.2s)`; `pnpm scan:history` no match over 25 commits.
