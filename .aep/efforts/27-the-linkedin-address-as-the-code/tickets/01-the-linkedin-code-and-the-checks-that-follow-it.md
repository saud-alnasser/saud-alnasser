---
status: open
---

# feat(cv): the LinkedIn address as the code, no profile on the contact line, and one function that says which profile is the code

## Outcome

The header of both documents carries the LinkedIn address as its QR code with the LinkedIn mark at its centre, the contact line writes no profile address out, and the dist check and the browser case both assert that from the content source. The three places that each decided for themselves which profile is the code now ask one function, so the component, the check, and the test cannot disagree about which entry in `profile.yaml` they are looking at.

## Acceptance Criteria

- [ ] On all four document pages the one `[data-qr-code]` names the LinkedIn address from `profile.yaml` for assistive technology, the header link around it has that address as its `href`, and the mark inside it is the `linkedin` body from `src/lib/icons.ts`; `pnpm check:dist` prints one `qr code:` line per PDF, each decoding to that address (criterion 1, requirement 1).
- [ ] `[data-cv-contact]` on all four document pages contains no address of any profile `profile.yaml` lists, and `pdftotext` over the four PDFs and the filled copies prints none of them; both assertions read the profiles list rather than a literal (criteria 2 and 3, requirements 2 and 3).
- [ ] One exported function takes the profiles list and returns the LinkedIn entry, and the component, `scripts/check-dist.mjs`, and `tests/resume.spec.ts` each reach the coded profile through it; a unit case calls it with `linkedin`, `LinkedIn`, and ` LINKEDIN ` and gets the same entry, and with no LinkedIn profile and gets nothing (criterion 4, requirement 4).
- [ ] The dist check fails naming the file when a code decodes to anything but the LinkedIn address, when no code is found, and when the module is under the floor; the first two tried once by editing and putting back. With the LinkedIn address changed to a sibling slug, rebuilt and re-rendered with no other edit, all four codes decode to the new address; put back (criterion 5, requirement 5).
- [ ] `pnpm render:pdf` reports both resumes and the filled copy of each at one page on A4 and on Letter with at least 10mm free at Letter, and the four numbers go in the commit (criterion 7, requirement 7).
- [ ] `dist/en/resume.json` and `dist/ar/resume.json` carry GitHub then LinkedIn in `basics.profiles`, `tests/home.spec.ts` passes unchanged, and `pnpm readme --check` exits 0 with `README.md` unchanged (criterion 8, requirement 8).
- [ ] `pnpm build` prints `[localized] 0 gaps`, and `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` all exit 0 (criterion 9, requirement 9).

## Relevant areas

`src/components/CvDocument.astro`, the `coded` and `written` constants over the header and the contact list that prints `written`; `src/components/QrCode.astro`, the `<g>` that draws the mark; `src/lib/networks.ts`, where `profileIcon` already decides what a network is and where the one function belongs beside it; `scripts/check-dist.mjs`, `qrCode` and the extraction over the PDFs, noting that `scripts/readme-profile.mjs` already imports `src/lib/networks.ts` from a script; `tests/resume.spec.ts`, the header case and the `profileIcon` unit cases in `tests/home.spec.ts` as the shape for the new one.

## Constraints

- The box, the quiet zone, the error correction level, the plate, and the ink do not change. The spec's constraints say why the box stays at the name block's height and that the smaller module is still over the floor.
- The mark is a body from `src/lib/icons.ts` drawn inside the same SVG, as the GitHub mark was; no second SVG, no positioned element.
- The comments in the files this ticket edits that still name GitHub are ticket 02's, except where a line this ticket rewrites would otherwise be wrong on landing; a comment that says "the GitHub address" over a constant that now holds LinkedIn's is wrong on landing.

## Notes

The earlier document effort recorded that a profile which is not the code is written out so that no fact is dropped in silence. Requirement 3 of this effort's spec retires that rule by Saud's decision, so the contact list stops printing any profile rather than printing GitHub's.
