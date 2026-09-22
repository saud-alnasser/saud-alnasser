---
status: resolved
blocked-by: [01]
---

# feat(site): the university card opens the degree certificate in the page's dialog

## Outcome

The university card on the education page carries one link, worded with the certificate strings the site already has, that opens the page's one dialog with the degree's preview, its caption, and the link to the PDF, and closes back to it. Without script it is the link to the PDF. The card stays an article and its courses fold keeps working. The education tests assert all of it in both languages, reading the entry's `document` from the content so a degree without one skips them.

## Acceptance Criteria

- [x] On `/en/education/` and `/ar/education/`, the university card is an `<article>` holding one `[data-document]` control whose `href` is the PDF's address under `_astro/`, with `data-preview`, `data-preview-width`, `data-preview-height`, and `data-caption` set, and whose text is `strings[locale].certificate.open` (criterion 2). Verified 2026-09-22: `dist/en/education/index.html` carries `<a href="/saud-alnasser/_astro/saudi-electronic-university.DO4r8qAa.pdf" data-document="..." data-preview="/saud-alnasser/_astro/saudi-electronic-university.CqQ6bz-P.webp" data-preview-width="1600" data-preview-height="1131" data-caption="Bachelor of Science, Computer Science, Saudi Electronic University">` inside the card's `<article>`, and the new case `offers the degree certificate from the card whose entry names one, and from no other` in `tests/education.spec.ts` passed in both languages and both palettes, asserting each attribute and the text.
- [x] Clicking the control opens `[data-certificate-dialog]` with that preview, that caption, and that PDF link; Escape closes it and focus returns to the control; the courses `<details>` still opens and lists every course; with JavaScript disabled the control is the link to the PDF (criterion 2). Verified 2026-09-22: the case `opens the degree certificate in the dialog, closes back to the link, and leaves the courses folding` passed four times (two languages, two palettes), and `leaves the degree certificate link the link to its PDF` passed under the JavaScript-disabled describe. A screenshot of the open dialog shows the caption, the redacted certificate, and "Open the PDF".
- [x] The cases above are in `tests/education.spec.ts` in both languages, and `tests/certificates.spec.ts` still counts only the two grids' cards (criterion 2). Verified 2026-09-22: `pnpm test tests/education.spec.ts tests/certificates.spec.ts` printed `98 passed`; the certificate cases select `[data-entry]` cards and were unchanged.
- [x] The caption reads in the page's language, and `pnpm build` prints `[localized] 0 gaps` (criterion 9). Verified 2026-09-22: the Arabic case asserts the caption is the Arabic `studyType`, `area`, and `institution` joined by `، `, and passed; the build printed `[localized] 0 gaps`.
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, and `pnpm test` pass (criterion 10). Verified 2026-09-22: `10 page(s) built`; `pnpm check` `0 errors, 0 warnings`; `pnpm check:dist` printed every check, `identifiers: no pattern matches in 19 text files and the text of 13 of 32 PDFs` among them; `pnpm test` printed `616 passed (33.8s)`.

## Relevant areas

`src/components/Education.astro`, and beside it `Certificate.astro` for the two `import.meta.glob` reads and the data attributes the dialog reads. `src/layouts/Base.astro`, the click handler, which needed no change. `src/lib/i18n.ts`, the `certificate` strings. `tests/education.spec.ts` and `tests/certificates.spec.ts`.

## Constraints

- The card is not the link: it holds a `<details>` fold, and interactive content does not nest inside a link. The control is a link inside the card, as the plan records.
- One dialog, one handler: the control reuses the data attributes the course cards carry, and no second handler is added.
- The control sits at the bottom of the card in the course card's muted style with the file icon, so both kinds of card say the same words in the same place.
