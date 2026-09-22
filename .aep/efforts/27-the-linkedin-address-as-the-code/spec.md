---
status: accepted
---

# Problem

Both documents carry the wrong profile as their one graphic, and the other one as a line of text.

The header of the CV and the resume carries a QR code, and it encodes the GitHub address with the GitHub mark knocked into its centre. That was [[efforts/13-one-page-resume-and-clean-generation/spec]] requirement 7, chosen on 2026-09-11 when GitHub was the only profile the content listed. Every other profile is written out on the contact line as its URL, which is how the LinkedIn address arrived on 2026-09-22 through [[efforts/23-degree-certificate-and-linkedin-profile/spec]] requirement 5: as text, `https://www.linkedin.com/in/saudalnasser`, beside the nationality and the location, on all four document pages and in the four PDFs. That effort's out-of-scope list says in so many words that the code stays GitHub's and no LinkedIn mark reaches the documents.

Saud asked on 2026-09-22 for the reverse. The LinkedIn link is to leave the contact line, and the code is to carry the LinkedIn address with the LinkedIn mark at its centre in place of GitHub's. Asked the same day where the GitHub address goes, with the reading that writes it out as text on the contact line put first because it loses no fact, he chose the other: it leaves both documents. On paper a reader gets one profile, the one a recruiter opens, and the rest of the record stays in the machine-readable document.

Three things hold the current arrangement in place and each has to move with it: `CvDocument.astro` decides which profile is the code by asking `profileIcon` for `github`; `qrCode` in `scripts/check-dist.mjs` looks the GitHub profile up by name and fails when the code decodes to anything else; and the browser case in `tests/resume.spec.ts` reads the first profile as the coded one and refuses `github.com` on the contact line. The prose follows the code: the component comments, `src/lib/icons.ts`, `profile.yaml`'s own comment, `docs/development.md`, and the repository context all say the code is GitHub's.

# Goal

The header of each document, in both languages, carries one QR code that decodes to the LinkedIn address in `src/content/profile.yaml`, drawn with the LinkedIn mark at its centre, and the contact line writes no LinkedIn address out. Every guarantee the code came with still holds: built from the content source at build time, the link on screen, named for assistive technology, decoded back out of the rendered PDF by the dist check, dark on a light plate in both themes, no larger than the name block it sits beside, and above the module floor a phone camera needs. The GitHub address leaves both documents, so the contact line carries no profile address at all and the code is the one profile on paper. Nothing about the JSON Resume documents, the home page, or the README changes: each still carries both profiles.

# Scope

- `src/components/CvDocument.astro`: which profile is the code and which are written out, and the comment that says why.
- `src/components/QrCode.astro`: the mark drawn at the centre, and the comments that name GitHub.
- `src/lib/icons.ts` and `src/components/Icon.astro`: the comments that say which mark the code draws.
- `src/content/profile.yaml`: the comment over `profiles`, which says the first entry is the code.
- `scripts/check-dist.mjs`: `qrCode`, the address it compares against and the messages that name GitHub, and `documentHazards` if its wording names the address.
- `tests/resume.spec.ts`: the header case, the address it expects, and the address it refuses on the contact line.
- `docs/development.md` and the repository context: the paragraphs that say the code is the only route to the GitHub address.
- The two earlier efforts' records, marked where a later reader will hit them: [[efforts/13-one-page-resume-and-clean-generation/spec]] requirement 7 and [[efforts/23-degree-certificate-and-linkedin-profile/spec]] out of scope, both of which now say the opposite of what is true.

# Requirements

1. **The LinkedIn address is the QR code in the document header.** Both documents, both languages. It carries the LinkedIn mark at its centre, it is built from the LinkedIn address in the content source rather than from a second copy of it, it is the link on screen, and it names that address for assistive technology.
2. **The LinkedIn address leaves the contact line.** No document page and no PDF writes it out as text. The code is the one route to it on paper, as the GitHub code was to GitHub's.
3. **The GitHub address leaves both documents.** Neither the contact line nor anything else on the CV or the resume writes a profile address out as text. The code is the one profile on paper; every profile still reaches both JSON Resume documents, the home page, and the README. Saud's decision on 2026-09-22, and it retires the rule the component has carried since the code arrived, that a profile which is not the code is written out so that no fact is dropped in silence: this drop is decided rather than silent, and the fact survives at `basics.profiles[].url`.
4. **Which profile is the code is decided once.** The component, the dist check, and the browser test agree on the LinkedIn profile through one decision rather than three, so a spelling of the network's name that one of them accepts and another does not cannot leave the check comparing against a profile the page did not draw.
5. **The checks follow the address.** The dist check decodes each rendered PDF's code and fails when it is not the LinkedIn address, when there is no code, or when the module is under the floor. The browser case asserts the accessible name, the link, the size bounds, the print-media spacer, and that the contact line carries no LinkedIn address. Changing the LinkedIn address in the content source changes what the code decodes to, with no other edit.
6. **Nothing still says the code is GitHub's.** Not a comment in the two components or the icon module, not the comment in `profile.yaml`, not `docs/development.md`, not the repository context, and not the two earlier specs, which are marked at the requirement and the exclusion this reverses.
7. **The resume stays one page.** Both languages, both papers, published and filled, with headroom at or above the floor `scripts/render-pdf.mjs` enforces. The code is the same box it was; the contact line trades one address for another.
8. **Everything else is untouched.** Both JSON Resume documents still carry GitHub then LinkedIn in `basics.profiles`; the home page's contact actions and the README profile block read the profiles as they did, so the GitHub-first order in `profile.yaml` stays.
9. **Every gate passes.** `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history`.

# Acceptance Criteria

1. On all four document pages, `article.cv [data-qr-code]` has a count of one, its accessible name contains the LinkedIn address from `profile.yaml`, the header link that contains it has that address as its `href`, and the mark inside the SVG is the `linkedin` body from `src/lib/icons.ts`. `pnpm check:dist` prints one `qr code:` line per PDF, each decoding to that address.
2. `[data-cv-contact]` on all four document pages contains no `linkedin.com`, and `pdftotext` over the four PDFs and the filled copies prints no `linkedin.com`. Asserted in the browser case and in the dist check's extraction over the PDFs.
3. `[data-cv-contact]` on all four document pages contains no `github.com` and no address of any profile `profile.yaml` lists, and `pdftotext` over the four PDFs and the filled copies prints none of them. Asserted from the content's profiles list rather than from a literal, so a third profile added later is refused the same way.
4. The component, `scripts/check-dist.mjs`, and `tests/resume.spec.ts` each reach the coded profile through one exported function that takes the profiles list, and a unit case in the tests calls it with a list that spells the network `linkedin`, `LinkedIn`, and ` LINKEDIN ` and gets the same entry each time, and with a list carrying no LinkedIn profile and gets nothing.
5. The dist check fails naming the file when a PDF's code decodes to anything but the LinkedIn address, when no code is found, and when the module is under the floor; the first two tried once by editing and putting back, the way the earlier effort recorded. With `profile.yaml`'s LinkedIn address changed to a sibling slug, rebuilt and re-rendered with no other edit, all four codes decode to the new address; put back.
6. No comment in `src/components/QrCode.astro`, `src/components/CvDocument.astro`, `src/lib/icons.ts`, or `src/components/Icon.astro` says the code carries the GitHub address or draws the GitHub mark, checked by reading every line `grep -n -i github` returns over the four files; the comment over `profiles` in `profile.yaml` says LinkedIn is the code and GitHub is first for the home page and the README; `docs/development.md` says the code is the only route to the LinkedIn address; the repository context's row for the components says the same; requirement 7 of the earlier document effort and the LinkedIn exclusion of the profile effort each carry one marked line pointing here.
7. `pnpm render:pdf` reports `resume.en.pdf`, `resume.ar.pdf`, and the filled copy of each at one page on A4 and on Letter, with at least 10mm free at Letter. The four numbers go in the commit.
8. `dist/en/resume.json` and `dist/ar/resume.json` carry two `basics.profiles` entries, GitHub then LinkedIn; `tests/home.spec.ts` passes unchanged; `pnpm readme --check` exits 0 with `README.md` unchanged.
9. `pnpm build` prints `[localized] 0 gaps`, and `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` all exit 0.

# Constraints

- **The code is a pure function of the content source.** No committed SVG, no external service, nothing drawn by script: both document pages work with no script, and the PDF render would otherwise race a script to draw it. The address it carries is read from `profile.yaml` at build time and nowhere else.
- **One graphic, and it is this one.** `documentHazards` refuses a `<table>`, an `<img>`, and any `<svg>` inside the document but the one marked as the code, and a second code. The LinkedIn mark goes inside the same SVG over the knockout, as the GitHub mark did, never as an element laid over it.
- **Dark on a light plate in both themes**, as before: a scanner reads an inverted code unreliably, and the plate is a shape inside the drawing rather than a CSS background.
- **The box does not grow.** The code is drawn at the height of the name block it sits beside, and the spacer that balances it matches in print media. The LinkedIn address is eight characters longer than the GitHub one, which takes the symbol from 33 to 37 modules and the printed module from about 0.52mm to about 0.47mm at the same box, measured with the encoder on 2026-09-22. That is above the 0.4mm floor the dist check enforces, and the floor stays where it is.
- **No profile is written out on either document.** The contact line carries the nationality, the location, and the two slots the form fills, and nothing else. A profile added to `profile.yaml` reaches the home page, the README, and the JSON documents, and reaches the documents only if it is the code.
- **The profiles' order in the content is not a signal about the code.** The home page test and the README script read the first profile as GitHub, so GitHub stays first, and the code is found by its network rather than by its position.
- **The type size floor is 10pt, and the resume is one page.** Neither moves; the contact line trades one item for another of similar length.
- Everything the earlier efforts constrain still binds: one content source, two languages, two themes, no contact detail in any published file, the form behind its marked address, no external request, stacked changes through Graphite.

# Out of Scope

- **Two codes, or a code for GitHub as well.** The header has room for one, which is why the other profiles are text.
- **A text line for GitHub, or for any profile, on the documents.** Put to Saud on 2026-09-22 as the reading that loses no fact, and declined: the documents carry one profile, as the code, and the rest is in the JSON documents. Restoring a written profile is one line in the component and a reversal of requirement 3.
- **The home page, the README, and the JSON Resume documents.** Each reads the profiles list as it did and shows both.
- **The LinkedIn address itself.** Which slug the account uses is Saud's, on LinkedIn; the profile holds `saudalnasser` and this effort reads whatever it holds.
- **The size of the code.** The box stays sized to the name block. Growing it is the lever if a phone will not read 0.47mm off paper, and that is a measurement Saud makes, not a change this effort makes ahead of it.
- **`docs/linkedin.md`.** It is untracked in the working tree at the time of writing, is not read by any build step, and is not part of this effort.

# Assumptions

- **A LinkedIn code is what a phone reads to a profile page.** A LinkedIn URL opens the public profile without a sign-in for a reader on a phone, as far as this repository can tell; if LinkedIn puts a wall in front of it, the code still decodes to the address the content holds, which is all this effort can promise.
- **The contact line fits.** It only gets shorter: it loses the LinkedIn item and gains nothing, and the resume had 36.8mm and 36.3mm free at Letter after the last effort, so the fit is a gate to run rather than a risk to design around.

# Risks

- **A parser reading either PDF finds no profile address at all.** The document effort accepted that cost for GitHub when the code replaced its text; with GitHub off the documents it covers both profiles. What still carries them is each language's `resume.json`, and nothing on paper.
- **The module is smaller than it was.** 0.47mm against 0.52mm, at the same box. The dist check's floor catches a code no camera reads, and it does not catch a code a camera reads badly. The earlier effort's phone scan was never recorded; this one makes the code harder to read by a tenth, so the scan matters more, and only Saud can do it.
- **Three places decide which profile is the code today, and a fourth would drift.** The component asks `profileIcon`, the dist check compares the network name, and the test reads the first profile. Requirement 4 collapses them into one so the change lands as one decision rather than three edits that happen to agree.
- **A reversal recorded in the new effort alone.** The two earlier specs say GitHub in a requirement and an exclusion, and a reader who lands there first believes them. Criterion 6 marks both at the line, as the document effort marked the effort it reversed.
