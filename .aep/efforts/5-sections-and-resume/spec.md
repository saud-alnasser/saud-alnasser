---
status: implemented
priority: high
---

# Problem

The site built in [[efforts/1-portfolio-site/spec]] and redesigned in [[efforts/3-site-redesign/spec]] shows everything the content source holds, finished or not, and offers one document for every purpose.

- **Unfinished work sits beside finished work with nothing to tell them apart.** The projects collection has no completion status. Nova says "in draft" inside its summary, screeps is an open-ended game colony, and the profile summary, which the README repeats on Saud's GitHub profile, names the language that is in draft. A recruiter cannot tell what Saud has shipped from what he has started, and the record overstates.
- **The work page puts projects before experience, on one page.** A hiring reader looks for employment first. The two kinds of entry are one route with two headings, projects on top.
- **Every online course completion is a "certificate".** The 27 Code with Mosh, SoloLearn, and typing.com entries live in one collection and render under one heading. A course Saud completed and a credential he holds are the same card, and the education page cannot show the courses as courses with their certificates attached.
- **One CV does two jobs.** The CV page and its PDF carry every project, every course, and every skill, which is right for the record and wrong for an application: it runs past one page, and there is no short document to send with a job application. Saud asked on 2026-09-10 for a simple one-page resume beside the CV.
- **The README links three CV forms.** Its CV line offers the page, the PDF, and the JSON Resume document. Saud wants the profile page to carry the portfolio link, one link to the CV on the site, and the email.

# Goal

The site is a set of sections, each a grid of cards: experience, then projects, education, the online courses each with its certificate, the certifications, and the skills. Everything it shows is finished work. Two documents are derived from the same content: a CV that holds everything the site shows, and a short resume, one page as of 2026-09-11 and at most two pages as this effort left it, that holds the summary, the experience, the education, the key skills, and the finished projects chosen for it. The README on the GitHub profile carries the summary, the portfolio link, the link to the CV page, and the email. Every guarantee of the first two efforts still holds: one content source, two languages, two themes, parser-safe documents, and the quality gates.

# Scope

- The content contract: a completion status on a project, a marker for what the resume shows, and the split of the course completions from the certifications.
- The content itself: the status of every project, the removal of screeps from every output, the profile summary reworded to name finished work only, and the course and certification entries reclassified.
- The site's sections: experience, projects, education, courses, certifications, and skills, how each is reached, and the order they come in.
- The two documents: the CV as it is, and a new resume, each as a page, a PDF, and the section or control on the site that leads to them.
- The README's profile block and the script that writes it.
- The tests, the dist checks, and the content documentation, updated to what the new shape guarantees.

# Requirements

1. **A project carries a completion status, and only finished work is shown.** Every project entry says whether the work is finished. A project that is not finished appears in no output: not on the site, not in the CV, not in the resume, not in the JSON Resume document, and not in a section count. The status is authored in the content source and nowhere else.
2. **screeps is out.** The screeps project appears in no output. Its entry may stay in the content source hidden, as the first effort's `hidden` visibility already allows, so the fact of it is not lost.
3. **The profile summary names finished work only.** The summary on the home page, the CV, the resume, and the README describes what Saud has finished. It names nothing whose project status is unfinished.
4. **Experience first, projects separate.** Experience and projects are two sections, and experience precedes projects everywhere both appear: in the navigation, on the home page, in the CV, in the resume, and in the JSON Resume document's own order where the schema leaves that to the author. The training placement stays in experience, marked as training as it is now.
5. **Courses are a section, and each course carries its certificate.** The online course completions are a section of their own, laid out as cards. A course card shows the course, the provider, and the date where one is known, and opens the certificate document the way a certificate card does today. The education timeline's online-courses node counts and leads to this section.
6. **Certifications are a section of their own.** A credential that is not a course completion renders in a certifications section, as cards with the same behaviour. Which entries are courses and which are certifications is authored in the content source.
7. **Every section is a card grid, reachable from the navigation.** Experience, projects, education, courses, certifications, and skills each exist as a section a visitor reaches from the site's navigation, each laid out as cards in the grid the redesign defined: one column on a phone, two or more on a desktop. The home page shows one card per section with a count that matches what the section renders.
8. **Two documents, both derived.** The site offers a CV and a resume, each generated from the content source in each language, each as a page and as a PDF download, and the site has a section or a control that leads to both and says which is which. Neither is written by hand; a fact changed in the content changes in both.
9. **The CV holds everything.** The CV page and its PDF carry the summary, the experience, the education, the key skills, the certifications, the courses, and every finished project the site shows, in the template layout the redesign chose.

    **Revised on 2026-09-23 by [[efforts/29-credentials-as-one-self-study-line/spec]].** The CV no longer lists the courses one by one: it reads them as one self-study entry in its education section, and its Certifications section prints only while a certification exists.
10. **The resume is short and holds what an application needs.** The resume carries the summary, the experience, the education, the key skills, and the finished projects marked for it in the content source. It carries a certification or a course only where its entry marks it for the resume. **It runs to one page on A4 and on Letter in both languages**, revised to two on 2026-09-10 and back to one on 2026-09-11, in the same template layout as the CV. Which projects and certificates the resume shows is authored on their entries, never in a second list.

    **Revised on 2026-09-10, from one page to two.** The one-page rule was met on the machine the work was done on and not on the Linux runner that renders the published PDFs, because the two resolve the system font stack to different faces and the English resume cleared Letter by less than one line. Saud chose the two-page budget over bundling a print face to make the metrics identical and over trimming further against the runner's fonts. Two is a budget rather than a target: the document is still the short one beside a CV that runs to five, and a third page is refused.
    **Reversed on 2026-09-11 by [[efforts/13-one-page-resume-and-clean-generation/spec]], back to one page.** What the wider budget produced was a two-page short resume, which is the one thing a short resume may not be, so effort 13 cut the content instead: the resume dropped cachescribe, and three texts were shortened truthfully. The renderer problem this revision was a response to is real and did not go away; what changed is the remedy. Beside the page count there is now a floor under the free height on the last page at Letter, because a page count says "one page" for a document with a line to spare and for one with a centimetre, and only the second is still one page on a machine whose system font stack resolves elsewhere.

    **Revised on 2026-09-23 by [[efforts/29-credentials-as-one-self-study-line/spec]].** A course marked for the resume no longer prints there: no document lists a course one by one, so the marker on a course does nothing, and only a marked certification reaches the resume.
11. **Both documents stay parser-safe.** The resume meets the same layout criteria the CV meets: one column of real text in reading order, standard headings, no table carrying content, no image, no positioned header or footer, and the extraction check that runs over the CV PDF runs over the resume PDF too.
12. **The machine-readable document follows the CV.** The JSON Resume document per language contains exactly the entries the CV shows, so hiding an unfinished project removes it there as well.
13. **The README carries the portfolio, the CV page, and the email.** The profile block GitHub shows carries the summary, the portfolio link in both languages, one link to the CV page on the site, and the email. The PDF and JSON Resume links leave it. The block is still written by the script from the content, and the dist check still fails when it is behind.
14. **Both languages, both themes, and the gates.** Every new section, card, control, and string exists in English and Arabic, renders in both themes and both directions, and the Lighthouse, contrast, reduced-motion, keyboard, and no-script criteria of the redesign still pass, with the resume page added to the pages Lighthouse measures.
15. **The content format is documented.** The content documentation describes the completion status, the resume marker, and how a course completion differs from a certification, so that adding a course, a credential, or a finished project means editing content and nothing else.

# Acceptance Criteria

1. Every file under the projects collection carries the status field, and the build refuses one without it. Setting one project's status to unfinished and building removes it from the projects section, the home page count, the CV, the resume, and the JSON Resume document, with no other edit. Searching the built site for the name of an unfinished project finds nothing.
2. Searching `dist/` and both JSON Resume documents for "screeps" finds nothing.
3. The profile summary in both languages names no project whose status is unfinished; the README's profile block, the home page, the CV, and the resume all show that summary; `pnpm readme --check` passes.
4. The navigation, the home page's section cards, the CV, and the resume each list experience before projects. The two are separate sections, each with its own heading and grid. The Al Othaim Markets entry renders in experience with its training wording.
5. The courses section renders one card per course completion, in date order with undated ones last, each showing its name, its provider, and its date where known; a card whose entry names a document opens it in the overlay with the redesign's close, link, Escape, and focus behaviour. The online-courses node on the education timeline shows the count of the courses section and links to it.
6. The certifications section renders one card per entry classified as a certification, with the same card behaviour. Reclassifying an entry in the content moves its card between the two sections with no other edit.
7. Each of the six sections is reachable from every page through the navigation and the page that holds it, and from the home page's section cards, each of which links to its section's heading; every section renders its entries inside card elements; at 360 pixels every grid is one column and at 1440 two or more, with no horizontal scroll. The home page shows one card per section, and each count equals the number of entries that section renders.
8. The site has, in each language, a CV page and a resume page, a PDF for each written by the render step, and a section or control on the site that links to both and labels each. Changing a fact in the content source changes it on both pages and in both PDFs with no second edit.
9. The English and Arabic CV pages show the summary, experience, education, skills, certifications, courses, and every finished project the projects section shows, in the redesign's template layout; the redesign's criteria 8 and 9 still hold for the CV.
10. The resume page in each language shows the summary, the experience, the education, the key skills, and exactly the projects whose entries carry the resume marker, plus any certificate whose entry carries it; the rendered resume PDF has **one page** in each language at each paper, and the render step and the dist check both fail if it has more.

    **Reversed on 2026-09-11 by [[efforts/13-one-page-resume-and-clean-generation/spec]], back to one page.** It is one page, and the render step also refuses a last page at Letter with less than 10mm unused. Printed to A4 and to Letter from the browser, nothing is clipped. Removing the marker from a project removes it from the resume with no other edit.
11. The resume page has no `<table>`, no `<img>`, and no fixed or absolute positioned element carrying content. The extraction check over the English resume PDF finds the name, the email, every experience entry's organisation, position, and period, and every education entry's institution, degree, and period, in reading order, and fails on a missing line.
12. The JSON Resume document per language validates against the schema and carries exactly the projects, experience, education, certificates, and skills the CV page shows; the dist check that compares them passes.
13. The README's profile block contains the summary, the two portfolio links, one CV link whose address is the CV page on the site, and the email; it contains no link to a PDF and no link to a JSON Resume document. `pnpm readme --check` passes, and the dist check fails when the README is behind.
14. Every new string exists in both languages in `src/lib/i18n.ts` and the build's gap report does not grow; Lighthouse reports at least 90 on the three categories for the home, CV, and resume pages in both languages on the mobile profile; the layout, contrast, reduced-motion, theme, and keyboard tests pass with their expectations updated; with JavaScript disabled every section and both documents show their content.
15. `src/content/README.md` documents the status field and its values, the resume marker, and the course and certification classification, and the content mechanism test still passes.

# Constraints

- **Everything the first two efforts constrain still binds:** free static hosting, one content source, truthful academic status, two languages with one set of facts, no tracking, no external request, progressive script, stacked changes through Graphite ([[efforts/1-portfolio-site/spec]] and [[efforts/3-site-redesign/spec]], "Constraints").
- **Truthful in the other direction too.** A project marked finished is finished. The status is a claim on a hiring document, so an entry whose state is unknown is marked unfinished and left off until Saud says otherwise, because understating is recoverable and overstating is not.
- **One selection, one place.** What the resume shows is a fact on each entry, never a list kept beside the content, so the resume can never name a project the content source dropped.
- **The resume is short, and the type size is what may not bend.** Revised twice on 2026-09-10. First, after the build measured the resume at two pages in both languages and showed that cutting every multi-line paragraph still left it short, the original wording that the content bends and the layout does not was replaced by the remedy [[efforts/5-sections-and-resume/plan]] records under "Making the resume fit one page": the resume's own page box, its tighter entry spacing, a shorter project entry, and the content levers. Then, when that remedy reached one page here and two on the Linux runner, the page budget itself became two. What binds throughout is the type size: it stays at what the template reads at, never smaller, because a parser and a reader both need the text as it is.

    **Reversed on 2026-09-11 by [[efforts/13-one-page-resume-and-clean-generation/spec]], back to one page.** The budget is one page again and the type size still binds: effort 13 reached it by cutting content, and Saud declined a bundled print face a second time on 2026-09-11.
- **Both documents keep the template, and the resume may tighten it.** The resume is the CV's layout with fewer sections, so the two read as one pair, and the print and extraction rules the redesign wrote apply to both. Revised on 2026-09-10 with the constraint above: the resume may take its own page margins, its own spacing between entries, and a shorter project entry, and it does so without changing the CV. Every fact it drops that way is on the CV, which is the whole record.

# Out of Scope

- **Rewording any entry for its own sake.** Revised on 2026-09-10, with the two constraints above, and corrected the same day when a review found the first revision still too narrow: the original wording put every project summary out of scope, and the remedy Saud chose for the one-page rule names shortening the project summaries as its first content lever and the placement's bullets as its second, so the two could not both stand. What is out of scope is rewriting an entry because it reads better; what is in scope is shortening a project summary or a placement bullet, truthfully, as far as the resume's one page needs and no further, and each such edit is recorded on the ticket that made it. A shortened text is the content source's, so it is what the work page, the CV, and the JSON documents show as well.
- **New content.** No project, job, course, or credential is added. High school stays absent until its details exist.
- **A different CV template.** The white and blue layout the redesign chose stays; the resume adopts it.
- **A DOCX output, a blog, a contact form, a custom domain, live GitHub data, the King Saud University period, Qiyas results**, which the first effort already excludes.
- **A JSON Resume document for the resume.** The machine-readable output follows the CV, which is the whole record; a second document for the subset adds an address for tooling that reads the first one anyway.
- **Reviewing the Arabic.** New Arabic strings are drafts until Saud reads them on the published site, as the first effort's assumption already states.
- **Changing the certificate documents.** The files and previews the redesign added are reused as they are; a course card opens the same document its certificate card opened.

# Assumptions

- The "What I work with" block stays in the README beneath the profile lines. Saud's request named the links and the email; it did not name the skills block, and on 2026-09-10 he confirmed the block stays.
- The sections live on the routes the redesign left: the home page holds the hero, the skills, and the index of sections; the work page holds experience then projects; the education page holds the studies timeline, the courses, and the certifications; the CV and the resume are two document routes. Saud chose this over one route per section on 2026-09-10, from the two shapes [[efforts/5-sections-and-resume/plan]] weighs, so every current address stays and the header keeps five links.
- "Professional jobs" is the experience collection: the practical training placement is the one entry and stays there, marked training.
- The 19 Code with Mosh and 7 SoloLearn completions are courses; the typing.com advanced assessment is the one certification. Saud reclassifies any entry by editing it.

    **Revised on 2026-09-23 by [[efforts/29-credentials-as-one-self-study-line/spec]].** The typing.com assessment left the record, so no certification exists until Saud adds a recognised one; the site's certifications section and card, and the CV's section, render only while one does.
- The resume's first project set is rentable and cachescribe, which Saud named on 2026-09-10 as the finished, well-designed ones. **No course and no certification is marked for the resume**, which Saud decided on 2026-09-10 when the question was put to him with the fit; the CV still lists all 27 and the education page still shows them.

    **Revised on 2026-09-23 by [[efforts/29-credentials-as-one-self-study-line/spec]].** The CV lists none of the courses one by one any more; it reads them as one self-study entry, and the education page still shows every one.
- **The resume has room again, and how much depends on the renderer.** Written on 2026-09-10 when a review found that marking one more course made the render step refuse the build at two pages, and revised the same day when the budget became two pages. Marking a certificate or adding a project is once more a single field, but the room it draws on is not measurable from a developer's machine: the same document takes one page under the fonts Windows resolves and two under the runner's. The render step and the dist check are what say whether it still fits, and they run in CI on the machine that renders what ships.

    **Reversed on 2026-09-11 by [[efforts/13-one-page-resume-and-clean-generation/spec]], back to one page.** At one page the room is tighter still, and the render step now reports how much of the last page is unused on every render, so how much is left is a number in the log rather than a thing to find out by marking one more entry.
- The status of every project, proposed from the request and confirmed by Saud on 2026-09-10; the content is authored to this table, and he changes any row by editing one field:

  | Project | Proposed | Why |
  | --- | --- | --- |
  | rentable, cachescribe | finished | named by Saud as complete |
  | screeps | hidden | Saud asked for it to leave |
  | Nova | unfinished | its summary says "in draft" |
  | Mudaraj, PL/0 compiler, CPU scheduling simulator, Personal information form, CourseViewer | finished | course work that was submitted and graded |
  | advent-of-code, leetcode, learning-rust, monkey-lang, bevy-pong, godot-brackeys-simple-platformer | finished | exercises whose repositories are complete as far as they go |
  | nexuscord, ETG, discord-trengo-integration, AEP | unfinished | Saud named only two projects as complete, and each of these is a system still being built; he confirmed they stay off until he marks one finished |

- The CV page keeps its JSON Resume download link beside the PDF; only the README drops it.
- The resume PDF is rendered by the same render step as the CV PDF, at an address beside it, and the address is the plan's.

# Open Questions

None. The one this effort carried, whether any course or certification belongs on the resume, Saud answered on 2026-09-10: none, recorded in the assumptions above.

# Risks

- **The site shrinks visibly.** Marking every uncertain project unfinished could leave the projects section with fewer than half the cards it has today. That is the truthful outcome under the constraint and it is reversible per project by one field.
- **The page budget is tight, and it is not the same on every machine.** Arabic text runs longer than English, and, as the runner showed on 2026-09-10, the same document takes a different number of pages depending on which faces the rendering machine resolves the system font stack to. The page count in the render step and in the dist check is what catches both, and it runs in CI on the machine that renders what ships. The remedy remains content, per the constraint. The deeper fix, a bundled face for printing that would make the metrics identical everywhere, was put to Saud on 2026-09-10 and declined in favour of the wider budget; it is what to reach for if the budget is ever tight again.

    **Reversed on 2026-09-11 by [[efforts/13-one-page-resume-and-clean-generation/spec]], back to one page.** The budget is tight again and the face was declined again, on 2026-09-11, with the alternative stated. The 10mm floor is what stands in for it: not a fix, a margin wide enough that a difference between two machines' fonts shows up as a refused build here rather than a red deploy there.
- **Two documents drift.** A section added to the CV and forgotten on the resume, or the reverse. Both derive from the same collections and the same template, and the extraction check runs over both, so a missing line fails the build.
- **A parser may misread the resume's project dates. Accepted by Saud on 2026-09-10**, with the evidence, rather than fixed. `pdftotext -layout` over `dist/resume.en.pdf` prints the second project's period on the line beneath the first project's period, so a parser reading dates by position could give the first project two date ranges and the second none. Every date is emitted late in the text stream of both documents; the CV resolves correctly only because other lines sit between its entries, and the resume's do not since the fit remedy removed them. What is not affected: the page is correct to a reader on screen and on paper, and criterion 11's own list, the name, the email, each experience entry's position, period, and organisation, and each education entry's degree, period, and institution, all extract in reading order and are asserted on every build. The remedy considered and declined was moving a project's dates onto its role line on the resume, which would have made the resume's project entries stop matching the CV's for a defect that affects only automated parsing of two dates.
- **The README changes on the profile page the moment it merges.** It is rewritten by the script from the content, so what merges is what the check passed.
