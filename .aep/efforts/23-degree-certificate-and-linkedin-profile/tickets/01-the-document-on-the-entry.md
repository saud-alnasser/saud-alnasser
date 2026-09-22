---
status: resolved
---

# feat(content): the education entry names its document, redacted, with its preview and the command that renders it

## Outcome

The education contract accepts an optional `document`, checked for the PDF and the preview the way a certificate's is, from one definition shared by both collections. The university entry names `files/saudi-electronic-university.pdf`, and that file is the degree certificate with its student number and national ID number removed from the content stream on both language sides, its background image re-encoded, and its verification QR code intact. `pnpm certificates:previews` renders the preview beside it and beside every certificate, and both docs say so.

## Acceptance Criteria

- [x] `src/content.config.ts` accepts `document: files/saudi-electronic-university.pdf` on the education entry, and an entry naming `files/missing.pdf` fails `pnpm build` with a message naming the file (criterion 1). Verified 2026-09-22: `pnpm build` with the entry in place printed `[localized] 0 gaps` and `10 page(s) built`; with a temporary `fixture-missing-document-tmp.yaml` naming `files/missing.pdf` it failed with `[InvalidContentEntryDataError] education → fixture-missing-document-tmp data does not match collection schema. document: files/missing.pdf does not exist under src/content/education/` and the same line for `files/missing.webp`. The temporary entry was removed and the build rerun clean.
- [x] `pdftotext` over the committed PDF prints neither the student number nor the national ID number the source in the Drive prints; `grep -c` for both over the file's bytes prints 0; a render of page one shows "Student No:" and "ID No:" with nothing after them on both sides; the QR code decoded from the render is `https://eservice.seu.edu.sa/public/cert/a977c92e-641c-60c5-9047-0c9f1b695d71`; `pnpm check:dist` and `pnpm scan:history` pass with the file committed (criterion 3). Verified 2026-09-22: `pdftotext -enc UTF-8` piped to `grep -c` printed 0; `grep -c` over the file printed 0; the page rendered at 150 dpi with PyMuPDF shows the two labels with nothing after them, in English and in Arabic, and the preview the site serves shows the same; `jsqr` over that render decoded the address above. The review found that the preview the site serves did not carry the code: the QR code is a CCITT fax image in the re-encoded PDF, pdf.js needs its WebAssembly decoders for one, and the script never passed `wasmUrl`, so it warned, drew the page without the image, and exited 0. Fixed in the review round: the script passes `wasmUrl`, treats an undecoded image as a render failure naming the file, and the re-rendered preview decodes with `jsqr` to the same address. `pnpm check:dist` printed `identifiers: no pattern matches in 19 text files and the text of 12 of 31 PDFs`, the degree among the 12 with a text layer. `pnpm scan:history` after the commit: see the commit message.
- [x] `pnpm certificates:previews` writes `src/content/education/files/saudi-electronic-university.webp` 1600 pixels wide and rewrites every certificate preview to the same bytes, so a second run leaves `git status` clean (criterion 4). Verified 2026-09-22: the command printed `src\content\education\files\saudi-electronic-university.webp: 1600 by 1131 pixels, 341298 bytes` and `28 previews written`; after a second run `git status --short` listed no certificate preview as modified and the education preview's hash was unchanged. pdf.js printed `Warning: Dependent image isn't ready yet` once while rendering the degree; I read the preview as carrying the full background and missed that the QR code was the image it could not decode. After the review round's fix the command prints `saudi-electronic-university.webp: 1600 by 1131 pixels, 346978 bytes`, the hash is the same across two runs, and with the decoder path broken on purpose the command exits 1 with `image-not-decoded` naming the file.
- [x] `src/content/README.md` has `document` in the education field table, with the redaction rule and the preview command, and `docs/development.md` names both directories on the command's line (criterion 8). Verified 2026-09-22 by reading both files after the edit.
- [x] `pnpm build` prints `[localized] 0 gaps` and `pnpm check` passes (criteria 9 and 10, for this ticket's changes). Verified 2026-09-22: `[localized] 0 gaps`; `pnpm check` printed `0 errors, 0 warnings, 44 hints`, the hints being the ones the tree had before.

## Relevant areas

`src/content.config.ts`, the certificate document refinement and the education collection. `src/content/education/`, the entry and a new `files/` directory. `scripts/certificate-previews.mjs`. The redacted PDF is prepared outside the tree with PyMuPDF, as the plan records, and only the result is committed. `src/content/README.md`, the education table and the certificate documents section. `docs/development.md`, the command list.

## Constraints

- The redaction removes the text runs; it paints nothing over and leaves the background image and the QR code as they are. The committed PDF is the published PDF.
- The document field's shape and error message are the certificate's: `files/<name>.pdf`, and a missing PDF or preview named in the build failure.
- The preview command keeps its property that a second run writes the same bytes.

## Notes

The source PDF is 6.6 MB because its background is a 5.3 MB PNG; re-encoding it as JPEG at the same pixel size gives 1.3 MB. The largest certificate in the tree is 453 KB, so the degree stays the largest document the site serves.

The refinement became `documentUnder(collection)`, a function declaration so the education collection, declared above the certificates in the file, can use it; a `const` there would have been read before its initialisation.
