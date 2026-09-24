# Content

Every fact the site or the CV shows lives under `src/content/`, and nowhere
else. Adding a project, a course, or a job means adding one YAML file to the
right folder and nothing else: the pages, the CV page, the PDF, and the JSON
Resume document are all generated from these files. The build refuses a file
that does not fit the contract below and names the file and the field.

The contract itself is `src/content.config.ts`. This file describes it for
people; where the two disagree, the code is right and this file is corrected.

## Conventions

- **Per-language text.** A field marked *per language* is a map with an `en`
  key, required, and an `ar` key, optional. A missing `ar` renders the English
  text and the build lists the gap.

  ```yaml
  summary:
    en: A short description.
    ar: وصف قصير.
  ```

- **Everything else is written once.** Dates, links, technology names, status
  values, and email addresses are the same in both languages, so they carry no
  language map.
- **Dates** are `YYYY`, `YYYY-MM`, or `YYYY-MM-DD`, quoted or not. This is
  the JSON Resume date form, so a date accepted here is accepted there. A
  `period` is `start` and an optional `end`; no `end` means ongoing. Write
  a date to whatever precision is known: the ordering and the JSON Resume
  documents read it as written, while the site and both documents print a
  `period` as years alone, `2024` for work that fell in one year and
  `2022-2026` for work that did not.
- **Links** are full URLs. To leave a link out, omit the key; an empty string
  is refused.
- **Unknown keys are refused**, so a misspelt field fails the build rather
  than silently vanishing.
- **Never** a national identifier, a student identifier, or a phone number,
  in any file.
- The name prefix `fixture-` is reserved: the content mechanism test writes a
  temporary entry with it and removes it again. A file carrying that prefix
  in the tree is a leftover to delete, never content.

## `profile.yaml`

One file, `src/content/profile.yaml`, with a single top-level key `profile:`
holding the person. The profile block of the repository's `README.md`, between
the `<!-- profile -->` markers, is written from `summary` here by `pnpm
readme`, over one line per profile other than GitHub, which the README already
is the page of, and then links to the site in both languages, which leads to
the CV and the resume, so who Saud is stays authored once; the dist check fails
when the README is behind. The record itself — the skills, the projects, the
rest — is on the site, and the README links to it rather than repeating it. The
languages Saud speaks are not here either: they are entries under `languages/`,
read by the two hiring documents and the JSON Resume document alone, the way
`nationality` below is a fact for those documents and not for the site.

**There are two summaries, because there are two documents.** Each names only
the work its own document prints as an entry, which is what one field could
not do once the CV and the resume stopped carrying the same projects. Which
document reads which is decided in one place, in
`src/components/CvDocument.astro`, and the reason they differ is recorded in
the comment above them in `profile.yaml`. Editing one does not change the
other, so check which document you mean first.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `name` | text | yes | the name as it should appear |
| `label` | text | yes | one line saying what Saud does, such as "Software engineer" |
| `summary` | text | yes | two or three sentences introducing Saud, read by the top of the site, the CV, the README profile block, and both JSON Resume documents. The resume does not read it |
| `resumeSummary` | text | yes | the same, for the short resume alone, which reads this in place of `summary`. Two or three sentences naming only what the resume itself prints. Its length is measured rather than assumed, because the resume has one page to fit: see the comment above the field |
| `email` | email address | no | Saud's address. Held here and rendered nowhere; see below |
| `nationality` | text | yes | the nationality as a hiring document states it, such as "Saudi". Required, and authored rather than read off `location`: where someone lives and what they hold are two facts |
| `location` | text | yes | city and country |
| `profiles` | list | no | public profiles; each has `network` (such as GitHub), `username`, and `url`. May be empty |

**The email is held here and published nowhere.** No page of the site and no
document it publishes renders the address. Contact details reach a document
one way only: the CV or the resume is opened at the marked address, the
document page's own with `#me` on the end, the download control there opens a
form, and the document that form produces in the browser is the only copy that
carries them. Everywhere else that control downloads the published PDF, which
carries none; `docs/development.md` says why the form is behind an address.
Nothing typed into it is stored, sent, or committed, and the published PDFs
carry no contact detail at all. The field stays because it is a fact about
Saud that another output may want; **it is not missing from the site, and
adding it back to a page, a document, or the JSON Resume output undoes a
deliberate decision.**

## `projects/`

One file per project.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `name` | text | no | the project's name, a proper noun |
| `period` | `start`, optional `end` | no | when the work happened |
| `role` | text | yes | Saud's role, such as "Sole developer" |
| `summary` | text | yes | what the project is, in a sentence or two |
| `technologies` | list of text | no | languages, frameworks, and tools used. Each shows on the site as a badge, with its logo where `src/lib/technologies.ts` maps the name exactly as written here, and with the site's generic code glyph otherwise. A new name is a badge with that glyph until it is mapped there, which is also where its licence is checked |
| `links` | `repository`, `live` | no | optional. Either key may be absent; omit `links` entirely for a project with no public link |
| `visibility` | one of `public`, `described`, `hidden` | no | `public` shows the entry with its links; `described` shows the name and summary without links, for private work; `hidden` keeps the file but shows nothing anywhere |
| `status` | one of `completed`, `in-progress` | no | whether the work is finished. Only a `completed` project is shown: an `in-progress` one stays in the file and appears in no output, not in the home page's projects, not in its count, not in the CV, the resume, or the JSON Resume document. A project whose state is not known is `in-progress` until it is |
| `resume` | `true` | no | optional. Marks the project for the short resume; absent means it stays off. The CV shows every completed project whatever this says |
| `order` | whole number | no | optional. Lower numbers sort first; entries without one sort by `period.start`, newest first |
| `featured` | `true` or absent | no | the one project the home page puts forward, as a wider card ahead of the others; it then leaves the grid below. Absent means no. The build refuses it on a project that is `hidden` or not `completed`, naming the file, and refuses two projects carrying it, naming both. It changes nothing on the CV, the resume, or `resume.json`, and it does not reorder anything: `order` still decides where a project sits everywhere else |

Whether a project appears is decided in one place, `src/lib/shown.ts`: not
`hidden`, and `completed`. Every output reads that function, so changing one
field changes every output together.

## `experience/`

One file per job or placement.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `organisation` | text | yes | the employer or host |
| `position` | text | yes | the title held |
| `location` | text | yes | city and country |
| `period` | `start`, optional `end` | no | when |
| `summary` | text | yes | what the work was |
| `highlights` | list of text | yes, each item | notable things done. May be empty |
| `kind` | one of `employment`, `training` | no | `training` marks a practical training placement rather than a job |

## `education/`

One file per institution attended. The home page's education section is one
timeline, newest first: the institutions by `period.start`, with one node for
the online-courses phase placed just after the most recent institution, so
university comes first, the online courses next, and high school last. That
node holds the courses, dated or not: it counts them, runs from the
earliest dated one to the latest, and opens in place to list every one,
newest first with the undated last, each opening its certificate in the
page's dialog. The certifications sit under their own heading below the
timeline, while any exists. The CV's education section
is the same timeline: the institutions with one self-study entry in the node's
place, which is how the CV reads the courses (see `self-study.yaml` below), and
its Certifications section prints only while a certification exists, like the
site's section.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `institution` | text | yes | the school or university |
| `area` | text | yes | the field, such as "Computer science" |
| `studyType` | text | yes | the qualification, such as "Bachelor of Science" or "High school diploma" |
| `period` | `start`, optional `end` | no | when, as precisely as is known; `end` is when the course work finished, and its presence is what says so |
| `status` | one of `completed`, `certificate-pending`, `in-progress` | no | shown only where it says something the period does not: `completed` prints nothing, because `end` has already said it. `certificate-pending` means the course work is complete and the certificate has not been issued; the site never says "graduated" or "awarded" for it |
| `courses` | list of text | yes, each item | optional. Notable courses |
| `document` | file path | no | optional. The degree certificate's PDF, relative to this folder, as `files/saudi-electronic-university.pdf`, with its preview beside it, exactly as a certificate names its own (see "The certificate documents" below). The card opens it in the same dialog. The build refuses an entry whose PDF or preview does not exist, naming the file, and the same redaction rule applies: a degree certificate carries the student number and the national ID number, and both are removed from the file before it is added |

## `certificates/`

One file per certificate, including online course completions. The `kind`
field says which of the two an entry is: a **course** is an online course
Saud completed, and its certificate is the proof of completion; a
**certification** is a credential that is not a course, such as an
assessment passed. The site lists the two kinds under their own headings,
the certifications heading only while an entry of that kind exists, and the
timeline's online-courses node counts the courses. The CV prints the
certifications one per line, under a heading that exists only while one does,
and never lists the courses one by one: it reads them as one self-study entry
in its education section, whose topics and providers are `self-study.yaml`'s
and whose count and years are read from the course entries here. The JSON
Resume documents list every entry of both kinds. Reclassifying an entry means
changing this one field.

Adding a recognised credential, a cloud or security certification for
instance, is therefore one entry of kind `certification` with its redacted
PDF and preview: the CV's Certifications section and the home page's
certifications, under Education, both return with it and no other edit.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `name` | text | yes | the certificate or course title |
| `issuer` | text | no | who issued it, such as "Code with Mosh" |
| `kind` | one of `course`, `certification` | no | a course completion, or a credential that is not one |
| `date` | date | no | optional. When it was issued |
| `url` | URL | no | optional. Where it can be verified |
| `document` | file path | no | optional. The certificate's PDF, relative to this folder, as `files/code-with-mosh-react.pdf`. The build refuses an entry whose PDF or preview does not exist, naming the file |
| `resume` | `true` | no | optional. Marks a certification for the short resume; absent means it stays off. The CV lists every certification whatever this says. On a course the marker does nothing: no document lists a course one by one, so the resume prints none whatever the entry marks |

### The certificate documents

A certificate's PDF lives in `certificates/files/`, named after its entry:
the entry `code-with-mosh-react.yaml` names `files/code-with-mosh-react.pdf`.
A degree certificate lives the same way in `education/files/`, named after
its institution's entry. Beside every PDF sits its preview,
`files/code-with-mosh-react.webp`, the first page rendered 1600 pixels wide;
the site shows the preview and links to the PDF. The previews are generated,
and committed with the PDFs:

```sh
pnpm certificates:previews   # renders files/<name>.webp for every files/<name>.pdf, in both folders
```

Run it after adding or replacing a PDF, and commit what it wrote. The build
checks that both files exist for every entry that names a `document`, so a
PDF added without its preview fails the build until the command has run. A
document is scanned for identifiers before it is published, the same way the
CV PDF is; one that carries a national or student identifier is not added
until it is redacted. Redacting means removing the numbers from the file's
content, not painting over them, so the text layer and the page agree; the
degree certificate under `education/files/` was redacted that way, and its
verification QR code was left as it is. A scanned certificate has no text
layer for that scan to read, so such a document is read by eye for
identifiers before it is added, and the dist check reports how many documents
it could read.

## `self-study.yaml`

One file, `src/content/self-study.yaml`, with a single top-level key
`selfStudy:`, holding what the CV says about the online courses. The CV
prints them as one entry in its education section, in the timeline's place
for the online-courses phase: "Self-study" with the years at the far edge,
then the count of courses at the providers, then the topics. The count and
the years are read from the course entries under `certificates/` at build
time and are not authored here; a course added or removed moves them with no
edit to this file. The home page's courses node and the JSON Resume
documents still carry every course. The resume prints no self-study entry.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `providers` | list of text | no | who taught the courses, each spelt exactly as a course entry's `issuer` |
| `topics` | list of text | yes, each item | what the courses taught, in the order the line prints them |

**A topic is a claim that a course taught it, and it is checked.** Every
topic's English must be contained, case-insensitively, in the English name
of at least one course entry, and every provider must be some course's
issuer; `pnpm check:dist` refuses the first that is not, naming it. The
topics are also what the key skills lean on where no shown project backs a
keyword (see `skills/` below), so a topic leaving this list is a keyword to
reconsider.

## `skills/`

One file per skill group.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `name` | text | yes | the group, such as "Web development" |
| `keywords` | list of text | no | the concrete items in the group. **A keyword names something a shown entry backs**: a language, framework, tool, or practice that a completed project, an experience entry, a certification on the CV, or a topic of the CV's self-study entry (`self-study.yaml`) names or plainly used. A word backed only by an entry that is `in-progress` or `hidden`, by a course whose topic the self-study entry does not name and nothing was built with since, or by a bot's configuration is not a skill, and it leaves the list rather than waiting for a screener to check it and find nothing. `pnpm test:content` holds every keyword to the rule (`tests/skills.test.mjs`): a shown project names it among its technologies, spelled the same, or it is a self-study topic, or the backing table in that test names the shown entries that plainly used it and how. The table is for what no card names and no course title covers, a practice such as "Lexers and parsers"; a keyword with none of the three fails the run by name |
| `level` | text | yes | optional. How well, such as "Working knowledge" |
| `order` | whole number | no | optional. Lower numbers sort first |

## `languages/`

One file per language Saud speaks. This is a fact for the two hiring
documents: the CV and the resume print a Languages section directly after the
key skills, one line per entry reading "name: level", and both JSON Resume
documents carry the same in their `languages` array. The home page, the
skills section, and the README do not read it, as they do not read the
nationality. Arabic and English are the two entries; the Saudi forms these
documents are written for ask for one level per language and nothing more,
so there is no split into speaking, reading, and writing.

| Field | Type | Per language | Meaning |
| --- | --- | --- | --- |
| `name` | text | yes | the language, such as "English" |
| `level` | text | yes | one short phrase, such as "Native" or "Working proficiency", authored by Saud: it is a claim on a hiring document, and no Saudi form publishes a ladder to pick from |
| `test` | `name`, `score`, `date` | no | optional. A proficiency test taken for the language, such as STEP, IELTS, or TOEFL. `score` is text, quoted in the file, so a band with a half survives and a score prints as written; `date` is the result's date. The documents print it after the level as "STEP 85 (2022)", with the year and not the full date, because a language test result is counted for a few years and a score with no date reads as current |
| `order` | whole number | no | optional. Lower numbers sort first; Arabic first, then English, is the order the Saudi template uses |

## Adding a project, step by step

1. Copy any file in `src/content/projects/` to a new name, `my-project.yaml`.
2. Fill in every field. Leave `links` out if the work is private and set
   `visibility: described`. Set `status: completed` only when the work is
   finished; until then it is `in-progress` and appears nowhere. Add
   `resume: true` if the project belongs on the short resume.
3. Run `pnpm build`. If it fails, the message names the file and the field.
4. Commit. Nothing outside `src/content/` changes.
