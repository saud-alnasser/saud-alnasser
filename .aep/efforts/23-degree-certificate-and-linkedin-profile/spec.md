---
status: implemented
---

# Problem

Two things Saud asked for on 2026-09-22 are missing from the site, and one of them is missing for a reason the repository has to respect.

**The degree certificate is issued and nothing shows it.** The university entry in `src/content/education/saudi-electronic-university.yaml` says the degree is complete, dated 2023-09 to 2026-09, and the education page prints it as a card with its courses folded. Every course card beside it opens the course's certificate in the page's dialog, and the university card opens nothing: the education contract in `src/content.config.ts` has no `document` field, and `Education.astro` renders none. The certificate itself, `bachelor-degree-certification.pdf` in Saud's Drive, is one landscape page with a text layer: the degree, the field, the grade, the council date, a verification QR code, and, on a line of its own in both languages, the student number and the national ID number. `src/content/README.md` says no file in this repository carries either identifier, `scripts/identifiers.mjs` names both patterns, and the dist check and the history scan read for them, so the document cannot be added as it is.

**The LinkedIn profile is nowhere.** `profile.yaml` lists one profile, GitHub. The home page's contact actions, both documents' contact lines, both JSON Resume documents, and the README profile block all read that list, and none of them names LinkedIn. Saud's address is `https://www.linkedin.com/in/saud-alnasser-profile`, and he wants it on the site and in the README directly above the Portfolio line.

# Goal

The university card offers the degree certificate the way a course card offers its certificate, in the same dialog with the same preview and the same link to the PDF, and the PDF the site publishes carries neither identifier and does carry the QR code the university verifies it by. The LinkedIn address is authored once in the profile and reaches every output that lists profiles, with the README carrying it above the Portfolio line, written by the same command that writes the rest of the block.

# Scope

- `src/content.config.ts`: an optional `document` on the education collection, with the same shape and the same existence check as a certificate's.
- `src/content/education/`: the entry names its document, and `files/` holds the redacted PDF and its preview.
- `scripts/certificate-previews.mjs`: renders the education documents as well as the certificates'.
- `src/components/Education.astro`: the control that opens the document, on the card, under the courses fold or beside it.
- `src/content/profile.yaml`: the LinkedIn profile.
- `src/lib/icons.ts` and `src/lib/networks.ts`: the LinkedIn mark, and the row that maps the network to it.
- `scripts/readme-profile.mjs`: the profile lines the block writes, and the README it rewrites.
- `src/content/README.md` and `docs/development.md`: the field, the command, and what the redaction rule covers.
- The tests that read the content to know what to expect: `tests/education.spec.ts` and `tests/home.spec.ts`. `tests/certificates.spec.ts` counts only the two grids' cards and should not need a change; it is in scope only if it does.
- The four document pages follow the profile with no change of their own, since `CvDocument.astro` already writes every non-GitHub profile into the contact line and `src/lib/resume.ts` already maps every profile.

# Requirements

1. **An education entry may name a document.** `document` on the education collection is optional, written `files/<name>.pdf` relative to `src/content/education/`, and the build refuses an entry whose PDF or preview does not exist, naming the file, exactly as it does for a certificate.
2. **The university card opens the degree certificate.** The card carries one control, worded with the certificate strings the site already has, that opens the page's one dialog with the certificate's preview, its caption, and the link to the PDF, and closes back to the control. Without script the control is a plain link to the PDF. The card stays an article: its courses fold, a `<details>` element, keeps working, and no interactive content is nested inside a link.
3. **The published degree document carries no identifier.** The student number and the national ID number are removed from the PDF's text layer and from what it renders, on both the English and the Arabic side, and nothing else on the page changes: the name, the degree, the grade, the dates, the signature, and the verification QR code stay. Every identifier check the repository runs passes with the document in the tree.
4. **The preview command covers both collections.** `pnpm certificates:previews` renders `files/<name>.webp` beside every `files/<name>.pdf` under `src/content/certificates/` and under `src/content/education/`, and the preview is committed with the PDF.
5. **The LinkedIn profile is authored once and read everywhere profiles are read.** `profile.yaml` lists LinkedIn after GitHub, with the network, the username, and the address. The home page's contact actions show it with the LinkedIn mark; the CV and the resume write the address in the contact line, as they do for any profile that is not the QR-coded one; both JSON Resume documents carry it in `basics.profiles`. GitHub stays first, because the home page test, the QR code, and the JSON document read the first profile as GitHub.
6. **The README carries the LinkedIn line above the Portfolio line, generated.** The profile block written by `pnpm readme` gains one line per profile that is not GitHub, directly above the Portfolio line, in the same list shape, and `pnpm readme --check` fails when the README is behind.
7. **The resume stays one page.** Both languages, both papers, published and filled, with headroom at or above the floor `scripts/render-pdf.mjs` enforces, after the contact line grows by one item.
8. **Documented where the format is documented.** `src/content/README.md` describes `document` on the education table, says the redaction rule applies to it, and says the preview command covers it; `docs/development.md` names the second directory the command reads.
9. **Both languages say the same thing.** The card's control and the dialog's caption read in the page's language, and the build reports no localisation gap.
10. **Every gate passes.** `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history`.

# Acceptance Criteria

1. `src/content.config.ts` accepts `document: files/saudi-electronic-university.pdf` on the education entry, and an entry naming `files/missing.pdf` fails `pnpm build` with a message naming the file, checked by running the build once against a temporary entry and removing it.
2. On `/en/education/` and `/ar/education/`, the university card is an `<article>` holding one `[data-document]` control whose `href` is the PDF's address under `_astro/`, with `data-preview`, `data-preview-width`, `data-preview-height`, and `data-caption` set, and whose text is `strings[locale].certificate.open`. Clicking it opens `[data-certificate-dialog]` with that preview, that caption, and that PDF link; Escape closes it and focus returns to the control; the courses `<details>` still opens and lists every course; with JavaScript disabled the control is the link to the PDF. Asserted in `tests/education.spec.ts` in both languages.
3. `pdftotext` over `src/content/education/files/saudi-electronic-university.pdf` prints neither the student number nor the national ID number the source in the Drive prints, `grep -c` for both over the file's bytes prints 0, a render of page one shows the "Student No:" and "ID No:" labels with nothing after them on both sides, and the QR code decoded from that render is `https://eservice.seu.edu.sa/public/cert/a977c92e-641c-60c5-9047-0c9f1b695d71`. `pnpm check:dist` and `pnpm scan:history` pass with the file committed.
4. `pnpm certificates:previews` writes `src/content/education/files/saudi-electronic-university.webp` 1600 pixels wide beside the PDF and rewrites every certificate preview to the same bytes, leaving `git status` clean on a second run.
5. `profile.yaml` carries `{ network: LinkedIn, username: saud-alnasser-profile, url: https://www.linkedin.com/in/saud-alnasser-profile }` as its second profile. On `/en/` and `/ar/`, `[data-contact="linkedin"]` links to that address and its icon is `[data-icon="linkedin"]`; `[data-contact="github"]` is still first. On all four document pages `[data-cv-contact]` contains the LinkedIn address and not `github.com`. `dist/en/resume.json` and `dist/ar/resume.json` carry two `basics.profiles` entries, GitHub then LinkedIn, and `pnpm check:dist` reports both valid.
6. `README.md` carries `- 💼 **LinkedIn** — [saud-alnasser-profile](https://www.linkedin.com/in/saud-alnasser-profile)` as the line directly above the Portfolio line, inside the profile markers, and `pnpm readme --check` exits 0; removing the profile from `profile.yaml` makes the check exit 1.
7. `pnpm render:pdf` reports `resume.en.pdf`, `resume.ar.pdf`, and the filled copy of each at one page on A4 and one page at Letter, each with at least 10mm free at Letter. The four numbers go in the commit.
8. `src/content/README.md` has `document` in the education field table with the rule and the command, and `docs/development.md` names both directories on the preview command's line.
9. `pnpm build` prints `[localized] 0 gaps`.
10. `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` all exit 0.

# Constraints

- **Never an identifier in any file.** `src/content/README.md` states it and two scripts enforce it. The document is redacted before it is added, by removing the numbers from the content stream rather than painting over them, so the text layer and the pixels agree. The redaction is a one-off act on the file, not a build step: the committed PDF is the published PDF.
- **One dialog, one mechanism.** The certificate dialog and the click handler in `Base.astro` key on `[data-document]` and the data attributes beside it. The card's control reuses them rather than adding a second handler.
- **No interactive content inside a link.** A course card is a whole-card link because it holds nothing else interactive. The university card holds a `<details>` fold, so the control is a link inside the card, not the card.
- **The email stays unpublished.** Adding a profile changes nothing about the address the site never renders.
- **Length on the resume is paid out of headroom, never out of type size.** `scripts/render-pdf.mjs` fails with that sentence.
- **The README block is generated.** Nothing about Saud is written by hand in the README; the line is emitted by `scripts/readme-profile.mjs` from the profile so the address is authored once.

# Out of Scope

- **The degree document on the CV, the resume, or the JSON documents.** The documents print the education entry as text; a certificate is a thing the site shows, as the course certificates are.
- **A high school entry.** Saud's Drive has an empty `high school/` folder and nothing else names the school or its dates, which the first effort's inventory already recorded. It is added when the facts are supplied.
- **The Qiyas test results in the Drive.** They carry the national ID and are not certificates of study.
- **Removing the grade or the GPA from the certificate.** They are what the certificate says, and Saud asked for the certificate. Redaction covers identifiers alone.
- **Filling the LinkedIn profile itself.** That is on LinkedIn, outside this repository, and this session has no browser to do it with; the text is written separately for Saud to paste.
- **A LinkedIn icon on the documents.** The contact line writes a non-GitHub address out as text, by the decision recorded in `CvDocument.astro`; the QR code stays GitHub's.
- **Changing the custom LinkedIn address.** Which slug the account uses is Saud's, on LinkedIn. If he changes it, `profile.yaml` changes with it and everything follows.

# Assumptions

- **The address is the current custom URL.** Saud gave `https://www.linkedin.com/in/saud-alnasser-55b300439/` first and `https://www.linkedin.com/in/saud-alnasser-profile` a moment later as "the link for the account", so the second is the one the profile carries. He also asked for a better slug; if one is chosen, it is one string in one file.
- **The one-line control fits the card.** A course card carries the same line under its issuer, and the university card is taller, so nothing about the layout should move.
- **The contact line has room.** It wraps by design (`flex-wrap`), and the resume has 36.8mm and 36.3mm free at Letter after effort 21, so one more item costs at most one wrapped line.

# Risks

- **A redaction that leaves the number in a font subset or an annotation.** Checked by reading the bytes, not only the text layer: criterion 3 greps the file for both numbers.
- **The preview command's second directory breaks the first.** The command exits non-zero naming any file it cannot render, and criterion 4 asserts a second run leaves the tree clean, which is the existing property it must keep.
