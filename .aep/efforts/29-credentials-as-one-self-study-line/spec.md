---
status: implemented
priority: medium
---

# Problem

The CV's credentials read as "no industry certification", and the note Saud brought on 2026-09-23 from a review of his profile says so in those words.

The CV's tail opens with a Certifications section holding one line, the typing.com advanced assessment, 49 words a minute at 97% accuracy, dated 2021-11-29. A Courses section follows with 26 lines, one per Code with Mosh or SoloLearn completion, the seven SoloLearn ones dated to November and December 2021 and the nineteen Code with Mosh ones undated. That is how [[efforts/5-sections-and-resume/spec]] left it: requirement 9 says the CV holds the certifications and the courses, and the assumptions list names the typing assessment as the one certification. A recruiter who reaches that page sees a typing test where a credential should be, followed by a long list of beginner courses from one year, and reads the whole record down from there. The note's advice is in three parts: drop the typing certificate entirely, collapse the courses into one self-study line naming the topics and the providers, and earn one recognised credential, a cloud or security fundamentals certificate, which in the Saudi market lifts both salary and acceptance odds.

The resume is not the problem. No entry carries the resume marker, which Saud decided on 2026-09-10, so the resume prints neither section and the note's complaint does not reach it.

Dropping the typing entry has a consequence the checks would let through. It is the only entry of kind `certification`, and while the CV drops a heading that holds nothing, the site does not: `src/pages/[locale]/education/index.astro` renders the Certifications heading and its grid unconditionally, and the home page renders a certifications card counting whatever is there. With the entry gone, the education page carries a heading over an empty grid and the home page a card reading "0 certifications" in both languages. `tests/education.spec.ts` skips the first-and-last check on an empty grid and `tests/home.spec.ts` asserts whatever count the content gives, so both pass. That is the recruiter's reading put in numbers, on the site rather than the CV.

The topics the note names for the self-study line are abstractions over the course names: three Code with Mosh parts and one SoloLearn course become "data structures", three parts become "design patterns", four courses become "C#". Nothing in the content holds those words, so the line cannot be derived from the entries; it is authored, and each topic it names has to be backed by a course entry the same way a key skill has to be backed by an entry on the CV ([[efforts/21-languages-and-honest-skills/spec]] requirement 8). Five key skills lean on the courses alone: Docker, whose one project witness is `in-progress` and unshown, and unit testing, design patterns, refactoring, and data structures, which no shown project or experience entry names. If the line does not name those, the rule that keeps the key skills honest stops holding for them.

# Goal

The CV carries no typing assessment and no list of 26 courses. In its place, one line in each language says that Saud taught himself the named topics through online courses at Code with Mosh and SoloLearn in 2021, and every topic on it is one a course entry backs. The site's education page and home page show a certifications section and card only while a certification exists, so the record never says "0 certifications", and the day Saud adds a recognised credential as one certificate entry with its document, the CV's Certifications section, the education page's section, and the home page's card all return with no other edit. The courses grid on the education page, with each course's certificate, and the JSON Resume documents, which are the machine-readable whole record, keep every course. The resume is unchanged.

# Scope

- `src/content/certificates/typing-com-advanced-assessment.yaml` and its two files under `certificates/files/`, removed.
- `src/components/CvDocument.astro`: the Courses section leaves the CV and the self-study line arrives, and the comment block that lays out what each variant holds.
- The content that holds the self-study line's topics, in both languages, and the contract in `src/content.config.ts` where the plan puts it in a new field.
- `src/pages/[locale]/education/index.astro` and `src/pages/[locale]/index.astro`: the certifications section and card render only where an entry exists.
- `src/lib/i18n.ts`: the self-study line's wording in both languages, and the strings that describe the CV's contents to a visitor and a search engine, which name "courses" and "certifications" as its sections.
- The checks and tests that read the CV's section order and the site's sections: `scripts/check-dist.mjs`, `tests/resume.spec.ts`, `tests/education.spec.ts`, `tests/home.spec.ts`, `tests/certificates.spec.ts`, and `scripts/test-content-mechanism.mjs`, whose fixture certificate is a course and is asserted on the CV.
- `src/content/README.md`: the `certificates/` section, which says the CV lists both kinds, and the `skills/` keyword rule, which names "a certificate on the CV" as a witness.
- [[efforts/5-sections-and-resume/spec]], marked at requirement 9 and at the assumption that names the typing assessment, both of which now say the opposite of what is true.

# Requirements

1. **The typing assessment leaves the record.** Its entry, its PDF, and its preview are deleted. No page, document, JSON file, or test names it afterwards, and no content file is left that names a document which no longer exists. Saud's decision on 2026-09-23, on the note's advice: a typing test under a Certifications heading reads as the absence of a credential.
2. **The CV prints the course completions as one line.** In place of the Courses section and its 26 entries, one line per language reads, in substance, "Self-study, 2021: C#, Python, JavaScript, HTML, SQL, data structures, design patterns, refactoring, unit testing, Docker, and Git, through 26 online courses at Code with Mosh and SoloLearn." The count and the year are read from the entries, so a course added or removed changes them with no other edit; the topics and the providers are authored. The line sits in the CV's education section as one entry dated from the courses, in time order, so it comes before the university the way the site's timeline already puts the online-courses phase before it. Saud chose that on 2026-09-23 at the open over keeping the Courses heading over a single line; the CV's tail is then the certifications, where any exist, and the projects.
3. **Every topic on the line is backed by a course entry, and every course-backed key skill is on the line.** A topic names what one or more course entries teach, in words a course name plainly supports: "data structures" for the three Data Structures parts and Python Data Structures, "C#" for the four C# courses. The line names at least Docker, unit testing, design patterns, refactoring, and data structures, because those key skills have no other witness on the CV, so the keyword rule of [[efforts/21-languages-and-honest-skills/spec]] requirement 8 keeps holding with the course list gone. The rule's wording in `src/content/README.md` follows: a course completion the CV records as a self-study topic is a witness, the way a course listed by name was.
4. **The site shows a certifications section and card only while a certification exists.** The education page renders the Certifications heading and its grid, and the home page renders the certifications card, only where an entry of kind `certification` exists. With none, neither appears, the `certificates` anchor is absent, and nothing on either page says a number of certifications. The CV already prints its heading only where it holds something, and this makes the site agree with it.
5. **A recognised credential is one content change away.** Adding one certificate entry of kind `certification`, with its PDF and preview, restores the CV's Certifications section, the education page's section, and the home page's card, in both languages, with no edit outside `src/content/`. The credential itself is Saud's to earn and out of scope below; this is what makes its arrival cheap.
6. **The courses grid and the JSON Resume documents keep every course.** The education page's courses grid, its timeline node, and the count on the home page's courses card are as they were, and both JSON Resume documents carry every course entry in `certificates`, one fewer than before because the typing entry is gone. The CV page is what a person reads; the grid with its previews and the JSON file are the record.
7. **The resume is unchanged.** It prints no credential and no self-study line, as Saud decided on 2026-09-10 and as `tests/resume.spec.ts` asserts. Put to him again on 2026-09-23 at the open, with the cost of one line measured against the headroom, and he kept it: the resume leads with the experience and the projects, and the CV is where the learning story is told.
8. **Nothing still says the CV lists the courses and the certifications.** Not the comment block at the top of `CvDocument.astro`, not the visitor-facing descriptions of the CV in `src/lib/i18n.ts`, not `src/content/README.md`, and not the earlier spec, which is marked at the requirement and the assumption this reverses.
9. **Both languages say the same thing.** The self-study line and its topics are authored in English and Arabic, and the build reports no localisation gap.
10. **Every gate passes.** `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history`.

# Acceptance Criteria

1. `git ls-files src/content/certificates` lists no file whose name begins `typing-com`, `grep -rn -i "typing.com\|typing-com" src scripts tests docs README.md` prints nothing, `pnpm build` passes, and `dist/en/resume.json` carries 26 entries under `certificates`, which `pnpm check:dist` confirms against `src/content/certificates/`.
2. On `/en/cv/` and `/ar/cv/` there is no `[data-cv-section="courses"]` element and no line carrying a single course's name and its issuer, and inside `[data-cv-section="education"]` one entry marked as the self-study line, ordered before the university's, contains the year, the count 26, the two provider names, and every authored topic in that language's words. `pdftotext` over `cv.en.pdf` finds the line's items in reading order in the dist check. Removing one SoloLearn entry and rebuilding changes the count to 25 with no other edit; put back.
3. Every topic authored on the line appears, in a case-insensitive comparison, in at least one course entry's English name or in a mapping the content documents beside the topic, checked by a unit case or a content check that fails naming the topic when one has no witness; and the authored English list contains Docker, unit testing, design patterns, refactoring, and data structures. `src/content/README.md` names a self-study topic on the CV as a witness for a keyword.
4. With no `certification` entry, `/en/education/` and `/ar/education/` contain no `h2#certificates` and no `[data-grid="certifications"]`, and `/en/` and `/ar/` contain no section card for certifications and no text matching the certifications count line for zero. `tests/education.spec.ts`, `tests/home.spec.ts`, and `tests/certificates.spec.ts` assert this from the content's own count rather than from a literal, so they pass both with and without a certification.
5. Adding a fixture entry of kind `certification` naming no document, rebuilding, and rendering shows a Certifications section on both CV pages holding that entry, `h2#certificates` with one card on both education pages, and a certifications card counting one on both home pages; removing it takes all three away. Proved by `pnpm test:content` with a certification fixture beside the course fixture it already writes, or by trying it once and recording the result on the ticket.
6. `[data-grid="courses"] > li` on both education pages counts 26, the timeline node counts 26 and runs 2021 to 2021, the home page's courses card counts 26, and `pnpm check:dist` reports both JSON Resume documents valid with `certificates` matching the collection.
7. `tests/resume.spec.ts` passes unchanged in what it asserts of the resume: no credential section, no self-study line, and one page in both languages on A4 and on Letter with at least 10mm free at Letter, which `pnpm render:pdf` reports and the commit records.
8. `grep -n -i "courses\|certification" src/components/CvDocument.astro src/lib/i18n.ts src/content/README.md` returns no line saying the CV lists the courses one by one or holds a certifications section unconditionally, checked by reading every line it returns; [[efforts/5-sections-and-resume/spec]] requirement 9 and its typing-assessment assumption each carry one dated line pointing here.
9. `pnpm build` prints `[localized] 0 gaps`.
10. `pnpm build`, `pnpm check`, `pnpm render:pdf`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` all exit 0.

# Constraints

- **One content source.** The topics, the providers, and every word of the line's substance are authored under `src/content/` or read from the entries there; the fixed wording of the line lives in `src/lib/i18n.ts` with every other UI string. Nothing on the CV is typed by hand in a second place.
- **The document is a hiring document, so what it claims must be true.** A topic on the line is a claim that a course taught it, and criterion 3 is what checks the claim. A topic Saud wants that no course backs is not added; it is a key skill question for another day.
- **Parser-safe, as before.** The line is real text in one column in reading order, no table, no image, under a standard heading.
- **Nothing is deleted but the typing entry.** The 26 course entries, their PDFs, and their previews stay committed, because the education page opens them and the JSON Resume documents list them.
- **The site's sections render only where they hold something, which the CV already does.** Requirement 4 extends the CV's rule to the site rather than inventing a second one.
- Everything the earlier efforts constrain still binds: two languages with one set of facts, two themes, no contact detail in any published file, the form behind its marked address, the resume's one page, and stacked changes through Graphite.

# Out of Scope

- **Earning the credential.** AWS Cloud Practitioner, Azure Fundamentals, or whichever Saud sits is a few weeks of his time outside this repository. When it exists it is one certificate entry of kind `certification` with its redacted PDF and preview, and requirement 5 is what makes that the whole change.
- **Deleting the course entries or their documents.** The note collapses how the CV reads them, not whether they exist. The grid with its certificates is the proof behind the line.
- **The resume.** Saud kept it as it is on 2026-09-23; requirement 7 records the decision and the reason.
- **Re-judging the key skills.** Every keyword stays where effort 21 left it. This effort keeps the five course-backed ones backed; it does not add, cut, or reorder any.
- **A different treatment of the courses on the site.** The timeline node, the grid, and the certificate dialog stay as [[efforts/5-sections-and-resume/spec]] and the redesign left them.
- **The JSON Resume documents**, beyond losing the typing entry. JSON Resume has no self-study concept, `certificates` is the array that holds a course completion, and the dist check keeps comparing it to the collection.
- **The README.** It names no course and no certification and does not change.

# Assumptions

- **The topics proposed in requirement 2 are the right ones.** They are every subject the 26 course names cover except three the note left out and effort 21 cut from the key skills for having nothing built since: ASP.NET MVC, Entity Framework, and React. Naming them would be true and would lengthen the line with a stack the record has moved past. Saud edits the list by editing the content.
- **The line fits its place.** One line of the CV, which has no page budget. The resume is untouched, so its headroom, 36.8mm and 36.3mm at Letter after the last effort, is not drawn on.

# Risks

- **A parser finds no certifications at all.** The ATS research of the first effort found certifications to be vendor-specific in what parsers read, so the loss is small, and it is the note's point: a typing test found there did more harm than an empty section.
- **The course-backed key skills now rest on one authored line.** If a later edit drops a topic from the line without dropping its keyword, the CV claims a skill with no witness again. Criterion 3 does not catch that direction; the README's keyword rule and a reviewer do. A check that every keyword has a witness would catch it and is an effort of its own.
- **The site reads thinner.** The home page loses a card and the education page a section until a credential exists. That is the intended state rather than a gap, and requirement 5 is the way back.
