---
use-when: "building a ticket in this effort and the approach is not obvious from the spec"
---

# Architecture

Three choices were open, and each has an alternative that lost.

**Where the degree document lives and how the contract names it.** The document is a field on the education entry, `document: files/saudi-electronic-university.pdf`, with the PDF and its preview under `src/content/education/files/`. The refinement that checks a certificate's PDF and preview exist, `certificateDocument` in `src/content.config.ts`, becomes a function of the directory it checks under, so one definition serves both collections.

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| a `document` field on the education entry, files under `education/files/` (chosen) | the fact sits on the entry it belongs to; the existence check and the naming rule are the certificate's, reused; the card reads its own entry | a second `files/` directory for the preview command and the docs to know about | none beyond the command reading two directories | one function, two call sites |
| a `certification` entry in `certificates/` for the degree | no schema change | it renders in the certifications grid, not on the university card, which is not what was asked; the degree would be two entries describing one fact | a reader sees the degree twice with different words | two entries to keep agreeing |
| the education entry pointing at a file under `certificates/files/` | one directory | the existence check's regex and base directory are the certificate's, so the education entry would name a path in another collection's folder; a preview for a degree in the certificates folder is a file whose entry is elsewhere | a rename in one folder breaks an entry in another | confusing on the first read |

**How the card offers it.** A link inside the card, not the card. `Card` with `href` renders the whole card as an `<a>`, and the university card holds a `<details>` fold, which is interactive content and is not valid inside a link, and whose summary click would reach the dialog handler's `closest('[data-document]')`. So the card stays `<article>` and carries a link element with the same data attributes a course card puts on itself: `data-document`, `data-preview`, `data-preview-width`, `data-preview-height`, `data-caption`. The click handler in `Base.astro` already resolves `closest('[data-document]')`, so it opens the dialog from the inner link with no change, and returns focus to it on close because `opener` is whatever element matched.

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| an inner link carrying the data attributes (chosen) | valid markup; no change to the handler or the dialog; the no-script path is the link itself | the card's hover accent does not apply to the whole card | none | one component |
| the whole card as the link, the fold moved out | matches the course cards exactly | the courses would have to leave the card, and the card's reason to fold is the twenty-one courses | a design change nobody asked for | two components |
| a `<button>` that only opens the dialog | no link semantics to think about | no document without script, which the course cards guarantee and the tests assert | a card that does nothing without script | one component, one more branch in the handler |

The link is placed after the fold, at the bottom of the card, in the course card's muted style with the file icon, so the two kinds of card say the same words in the same place: a course card says it at its bottom too.

**How the README gets the line.** `scripts/readme-profile.mjs` emits, before the three site links, one line per profile whose `network` is not GitHub, in the same `- <emoji> **<label>** — [<text>](<url>)` shape, with the username as the link text and a briefcase emoji for the label. GitHub is skipped because the README is the GitHub profile page. The reason it is generated and not hand-written outside the markers: the README's rule, stated in the script's header and in `src/content/README.md`, is that who Saud is stays authored once in the content, and the dist check fails when the README is behind.

**The redaction** is a one-off act on the file with PyMuPDF, which was already on the machine: `page.add_redact_annot` over each of the four number runs (two numbers, once per language side) and `page.apply_redactions` with images and line art left alone, so only the text runs are removed from the content stream and the background image is untouched. The background image is re-encoded from a 5.3 MB PNG to JPEG at the same pixel size, which takes the file from 6.6 MB to 1.3 MB; the largest certificate today is 453 KB. The script is not committed: the redaction is done once, verified by criterion 3, and the committed PDF is what the site publishes. `pdftotext` on this machine is xpdf's, which has no `-bbox`; positions were read with pdf.js instead.

# Components

- `src/content.config.ts`: `certificateDocument` becomes `documentUnder(directory)`, returning the same schema bound to the directory given; the certificates collection uses it under `content/certificates/`, the education collection under `content/education/`.
- `src/components/Education.astro`: reads the PDF addresses and the preview metadata with the same two `import.meta.glob` calls `Certificate.astro` uses, over `../content/education/files/`, and renders the link when the entry names a document. The caption is `studyType, area · institution` in the page's language, built with `t.listSeparator` the way the course caption is.
- `src/lib/icons.ts`: a `linkedin` fill icon, the Simple Icons mark, with the licence line the GitHub mark has.
- `src/lib/networks.ts`: `linkedin: 'linkedin'` in the map and `'linkedin'` in `ProfileIcon`.
- `scripts/certificate-previews.mjs`: iterates a list of two `files` directories and reports the count per directory; the header comment names both.
- `scripts/readme-profile.mjs`: the profile lines, before `links`.
- `src/content/profile.yaml`: the second profile.
- `src/content/education/saudi-electronic-university.yaml`: `document: files/saudi-electronic-university.pdf`.

# Testing Strategy

- Criterion 1: `pnpm build` with a temporary entry naming a missing file, then without it.
- Criterion 2: new cases in `tests/education.spec.ts`, reading the entry's `document` from the content so a degree without one skips them: the control's attributes and text, the dialog opening with the card's values, Escape returning focus, the fold still opening after the control exists, and the no-script link.
- Criterion 3: `pdftotext`, `grep -c` over the bytes, a render read by eye, and the QR decode with `jsqr` over the render; then `pnpm check:dist` and `pnpm scan:history`.
- Criterion 4: run the command twice and `git status --short`.
- Criterion 5: `tests/home.spec.ts` already asserts the count and the first profile; a case for `[data-contact="linkedin"]` is added. The documents are checked by `tests/resume.spec.ts`'s existing contact-line case plus reading `[data-cv-contact]` on the four pages, and `pnpm check:dist` validates both JSON files.
- Criterion 6: `pnpm readme` then `pnpm readme --check`, and the check once with the profile removed.
- Criterion 7: `pnpm render:pdf`, numbers quoted.
- Criteria 8 to 10: reading the two docs, and the gates.

# Technical Risks

- **`import.meta.glob` over an empty pattern.** If `education/files/` held no `.webp`, the glob returns an empty object and the card renders no control, which is the right outcome; it does not throw.
- **The Arabic caption order.** `studyType` then `area` then the institution, joined by the locale's separator, reads correctly right to left because each piece is authored in Arabic; the same join serves the course caption today.
