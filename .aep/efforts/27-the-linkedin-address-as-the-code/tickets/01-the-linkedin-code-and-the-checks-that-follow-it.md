---
status: resolved
---

# feat(cv): the LinkedIn address as the code, no profile on the contact line, and one function that says which profile is the code

## Outcome

The header of both documents carries the LinkedIn address as its QR code with the LinkedIn mark at its centre, the contact line writes no profile address out, and the dist check and the browser case both assert that from the content source. The three places that each decided for themselves which profile is the code now ask one function, so the component, the check, and the test cannot disagree about which entry in `profile.yaml` they are looking at.

## Acceptance Criteria

- [x] On all four document pages the one `[data-qr-code]` names the LinkedIn address from `profile.yaml` for assistive technology, the header link around it has that address as its `href`, and the mark inside it is the `linkedin` body from `src/lib/icons.ts`; `pnpm check:dist` prints one `qr code:` line per PDF, each decoding to that address (criterion 1, requirement 1).
- [x] `[data-cv-contact]` on all four document pages contains no address of any profile `profile.yaml` lists, and `pdftotext` over the four PDFs and the filled copies prints none of them; both assertions read the profiles list rather than a literal (criteria 2 and 3, requirements 2 and 3).
- [x] One exported function takes the profiles list and returns the LinkedIn entry, and the component, `scripts/check-dist.mjs`, and `tests/resume.spec.ts` each reach the coded profile through it; a unit case calls it with `linkedin`, `LinkedIn`, and ` LINKEDIN ` and gets the same entry, and with no LinkedIn profile and gets nothing (criterion 4, requirement 4).
- [x] The dist check fails naming the file when a code decodes to anything but the LinkedIn address, when no code is found, and when the module is under the floor; the first two tried once by editing and putting back. With the LinkedIn address changed to a sibling slug, rebuilt and re-rendered with no other edit, all four codes decode to the new address; put back (criterion 5, requirement 5).
- [x] `pnpm render:pdf` reports both resumes and the filled copy of each at one page on A4 and on Letter with at least 10mm free at Letter, and the four numbers go in the commit (criterion 7, requirement 7).
- [x] `dist/en/resume.json` and `dist/ar/resume.json` carry GitHub then LinkedIn in `basics.profiles`, `tests/home.spec.ts` passes unchanged, and `pnpm readme --check` exits 0 with `README.md` unchanged (criterion 8, requirement 8).
- [x] `pnpm build` prints `[localized] 0 gaps`, and `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` all exit 0 (criterion 9, requirement 9).

## Relevant areas

`src/components/CvDocument.astro`, the `coded` and `written` constants over the header and the contact list that prints `written`; `src/components/QrCode.astro`, the `<g>` that draws the mark; `src/lib/networks.ts`, where `profileIcon` already decides what a network is and where the one function belongs beside it; `scripts/check-dist.mjs`, `qrCode` and the extraction over the PDFs, noting that `scripts/readme-profile.mjs` already imports `src/lib/networks.ts` from a script; `tests/resume.spec.ts`, the header case and the `profileIcon` unit cases in `tests/home.spec.ts` as the shape for the new one.

## Constraints

- The box, the quiet zone, the error correction level, the plate, and the ink do not change. The spec's constraints say why the box stays at the name block's height and that the smaller module is still over the floor.
- The mark is a body from `src/lib/icons.ts` drawn inside the same SVG, as the GitHub mark was; no second SVG, no positioned element.
- The comments in the files this ticket edits that still name GitHub are ticket 02's, except where a line this ticket rewrites would otherwise be wrong on landing; a comment that says "the GitHub address" over a constant that now holds LinkedIn's is wrong on landing.

## Notes

The earlier document effort recorded that a profile which is not the code is written out so that no fact is dropped in silence. Requirement 3 of this effort's spec retires that rule by Saud's decision, so the contact list stops printing any profile rather than printing GitHub's.

## What verified each criterion, on 2026-09-22

The one function is `codedProfile` in `src/lib/networks.ts`, beside `profileIcon`, which it uses to recognise the network. The component passes the mark's name to the QR component, which now takes a `mark` prop and paints a body by its kind the way the icon component does, and marks the group `data-qr-mark` so the browser case can read which mark it is.

- **The code and its mark.** The header case in `tests/resume.spec.ts`, over all four routes in both palettes, asserts the accessible name, the link, the `data-qr-mark` value against `profileIcon` of the coded network, and the path's `d` against the icon body. `pnpm check:dist` printed one line per PDF, each `decodes to https://www.linkedin.com/in/saudalnasser, 37 modules at 0.47mm`.
- **No profile on the contact line or in the PDFs.** The same case reads every profile's address from the content and refuses each on the contact line, plus both hosts. `documentPdfs` in the dist check now refuses any profile address in the extracted text of the four PDFs and the filled copies, bounded so a project's repository link, which starts with the GitHub profile address, does not match; `pdftotext` over `resume.en.pdf` found no `github.com` or `linkedin.com`, and over `cv.en.pdf` only the ten project links.
- **One function, three readers.** The component, `qrCode` in the dist check, and the header case each import it. The unit case at the end of `tests/resume.spec.ts` passed with the three spellings, in either order, and with no LinkedIn profile; `pnpm test` went from 642 to 644 cases.
- **The check fails both ways, tried once each and put back.** Sibling slug, rebuilt and re-rendered with no other edit: all four codes decoded to the new address, at 41 modules and 0.43mm, and the only failing check was the README being behind the content, which is that check doing its job. PDFs rendered from the slug and the source put back: `the QR code on page 1 of cv.en.pdf decodes to "...-elsewhere", and src/content/profile.yaml says "..."`. The component suppressed: `no QR code could be read on page 1 of cv.en.pdf`. The box shrunk to 30 pixels: `has modules of 0.18mm, and the floor is 0.4mm`. A plain rebuild empties `dist/`, so the stale-PDF trial keeps the PDFs aside across the rebuild.
- **The fit.** `pnpm render:pdf`: `resume.en.pdf` 1 page at A4 with 54.8mm free, 1 page at Letter with 36.8mm free; `resume.ar.pdf` 54.3mm and 36.3mm; the filled copies the same four numbers. Unchanged from the last effort, because the header's height is the code's and the contact line only lost an item.
- **Everything else.** Both `resume.json` documents carry GitHub then LinkedIn; `tests/home.spec.ts` is untouched and passed; `pnpm readme --check` exit 0 with `README.md` unchanged.
- **The gates.** `pnpm build` `[localized] 0 gaps`; `pnpm check` 0 errors; `pnpm check:dist` exit 0; `pnpm test` `644 passed (36.2s)`; `pnpm test:content` passed; `pnpm scan:history` no match.
