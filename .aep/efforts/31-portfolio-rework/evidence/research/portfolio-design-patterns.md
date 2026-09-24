---
use-when: "deciding the layout, disclosure and motion of the portfolio rework, and weighing how much a recruiter or hiring engineer will look at"
---

# Question

What do well-regarded developer and designer portfolio sites that are live in 2026 actually do in (a) the first screen, (b) the presentation of projects, skills, experience and education, (c) the reveal of secondary detail through interaction, and (d) the use of motion; and what evidence, with its population and date, exists on what recruiters and hiring managers look at and for how long?

All pages were read on 2026-09-24. Portfolio sites were read two ways: through a text fetch of the rendered page, and, for five of them, by downloading the raw HTML and reading its class names and inline styles. Neither way runs JavaScript or shows the page visually, so behaviour that exists only in client scripts can be missed (see Not checked).

# Sources

## Portfolio sites (primary for "what they do")

- P1. Brittany Chiang, brittanychiang.com, and its /archive page. Opened as text and as raw HTML.
- P2. Lee Robinson, leerob.com. Text and raw HTML.
- P3. Josh W. Comeau, joshwcomeau.com. Text only.
- P4. Paco Coursey, paco.me. Text and raw HTML.
- P5. Rauno Freiberg, rauno.me. Text and raw HTML.
- P6. Emil Kowalski, emilkowal.ski. Text and raw HTML.
- P7. Anthony Fu, antfu.me, and its /projects page. Text only.
- P8. Brian Lovin, brianlovin.com. Text only.
- P9. Delba de Oliveira, delba.dev. Text only.
- P10. Jhey Tompkins, jhey.dev. Text only.
- P11. Bruno Simon, bruno-simon.com (a 3D driving portfolio). Text only.
- P12. Spotlight, spotlight.tailwindui.com: the Tailwind Labs commercial portfolio template's demo, not a real person's site. Text only.
- P13. The Magic UI portfolio template by Dillion Verma, its GitHub repository page (about 1.5k stars when read). The live demo, dillionverma.com, could not be fetched (redirect loop).
- P14. cassie.codes was opened and is now a farewell page with no portfolio; it is excluded from findings.

## Curated galleries (secondary: they show what is regarded well, not what works)

- G1. Awwwards, "Portfolio" category listing, awwwards.com. Most recent entries dated September 2026.
- G2. Awwwards site pages for two September 2026 entries: Gil Huybrecht (Site of the Day, 2026-09-21) and Behfar Behzad (nominee, 2026-09-22).
- G3. Godly (godly.website): its portfolio URL now redirects to a different site (recent.design). Not read.
- G4. Minimal Gallery portfolio category: the URL tried returned 404. Not read.

## Evidence on attention and hiring

- E1. Ladders, 2018 eye-tracking study. The PDF on theladders.com and the Ladders own article both returned 403. Read instead through the Ladders press release on PR Newswire ("Ladders Updates Popular Recruiter Eye-Tracking Study...", 2018), which is the publisher's own statement but not the study report; and HR Dive, "Eye tracking study shows recruiters look at resumes for 7 seconds" (2018-11-08), a secondary write-up. Search-result snippets attribute "30 recruiters over 10 weeks" to the study; I could not open a page that states it.
- E2. Spectacle Talent Partners, "Is the 6-Second Resume Scan a Myth?". Secondary; a recruiter's critique.
- E3. Nielsen Norman Group, "Scrolling and Attention" (2018-04-15). NN/g's own eye-tracking study: primary.
- E4. NN/g, "F-Shaped Pattern of Reading on the Web: Misunderstood, But Still Relevant" (2017-11-12, reviewed 2026-08-19), reporting NN/g's 2006 eye-tracking studies. Primary for NN/g's own research.
- E5. NN/g, "How Long Do Users Stay on Web Pages?" (2011-09-11). A write-up (secondary) of a Microsoft Research study by Chao Liu and colleagues.
- E6. HackerRank, 2018 Developer Skills Report, hackerrank.com/research/developer-skills/2018. Primary survey (39,441 developers, over 7,000 hiring managers, fielded October to November 2017).
- E7. NN/g, "Progressive Disclosure" (2006-12-03). Guidance article, not a study.
- E8. NN/g, "The Role of Animation and Motion in UX" (2020-01-12). Guidance article.
- E9. W3C, Understanding WCAG 2.2, Success Criterion 2.3.3 Animation from Interactions. Primary (the specification's own explanatory document).
- Searched for, not opened: Matej Latin, "Only 30 seconds to reject your portfolio?" (uxdesign.cc, returned 403) and several Medium posts claiming 30 seconds to 3 minutes per UX portfolio. All are opinion or anecdote from designers; none found is a study.

# Findings

## (a) The first screen

- F1. observation: Every personal engineer or design-engineer site read (P1 to P10) opens with the name and a one-line role or statement, in text. Examples: P1 "Frontend Engineer" plus "I build accessible, pixel-perfect experiences for the web."; P4 "Crafting interfaces. Building polished software and web experiences."; P6 "Design Engineer" and the current employer; P7 "a fanatical open sourceror and design engineer." True of the pages as live on 2026-09-24.
- F2. observation: Photos are the exception. No photo on the first screen of P1, P4, P5, P6, P7, P8. P2 uses a painted illustration, P3 a cartoon mascot of the author, P9 a headshot lower down, P12 (template) an avatar at the top. None of the sites read uses a monogram as a logo mark; I did not look for monograms specifically beyond these pages.
- F3. observation: No site read shows stat tiles or counters (years of experience, project counts) on the first screen or anywhere. The nearest thing is P1 attaching "100k+ Installs" to one project as a badge.
- F4. observation: P1 splits the desktop layout into a sticky left column (name, role, one-liner, in-page nav to About, Experience, Projects, social icons) and a scrolling right column (raw HTML: "lg:sticky lg:top-0 ... lg:w-[48%]"). P7 and P3 use a conventional top nav bar. P4, P6 and P8 have almost no navigation: one scrolling column of short sections.
- F5. observation: Explicit calls to action on the first screen are rare. P9 has a "Let's talk" LinkedIn button and says it is looking for a role; P3 and P6 offer a newsletter; P12 (template) has "Download CV" under the work list; P1 puts "View Full Resume" at the end of the experience list.

## (b) Projects, skills, experience, education

- F6. observation: Projects are shown as short lists, not galleries, on P4, P6, P7, P8, P9: a linked name and one line of description, often three to five items, with a link to a fuller page. P7's full /projects page groups roughly fifteen categories by ecosystem, with a "sort by Stars" link, and no technology filter.
- F7. observation: P1 is the only site read with card-like entries for both experience and projects: each experience entry has a date range, title at company, a paragraph, and technology tags; projects have a thumbnail image, description and tags. Tags are text pills (raw HTML: "rounded-full bg-teal-400/10 px-3 py-1 text-xs", 37 occurrences), not logos.
- F8. observation: P1's /archive is a plain table (Year, Project, Made at, Built with, Link), about 50 rows from 2015 to 2023, newest first, technologies as text, with no filter or sort control.
- F9. observation: No site read has a filter of projects by technology. No site read shows technology logos as badges. No site read has a separate skills grid; where skills appear they are tags on experience or project entries (P1) or implicit in what was built (P7).
- F10. observation: Experience is narrative prose on P2, P6, P7 and P10 (current and previous employer named in sentences), a dated list on P1, and a logo-plus-role-plus-years list on P12 (template). Education appears on none of the personal sites read; P1 defers it to the resume PDF.
- F11. observation: "Featured" work, where it exists, is done by order and by what is left out, not by a distinct featured card: P1 shows a few projects on the home page and the rest in the archive; P4 and P6 list three or four.
- F12. interpretation: The sites read are almost all by people whose employer names (Vercel, Linear, Notion, Klaviyo, Apple, SpaceX) and open-source projects already carry weight. Their brevity is not evidence of what works for a junior candidate whose record is less known; I found no well-known junior developer site to compare.

## (c) Revealing secondary detail

- F13. observation: The dominant disclosure mechanism is a link to another page: "View Full Project Archive" and "View Full Resume" (P1), "All writing" (P4), a Projects page (P7), topic notes (P2), a "Show more" control (P3). No modal dialog or accordion was found on any personal site read, though text fetching cannot see script-driven behaviour.
- F14. observation: On P1 the whole experience or project entry is one link target, and hovering it highlights that card (raw HTML: "hover:bg-slate-800/50", "hover:drop-shadow-lg", an inset top-edge shadow) while dimming sibling entries ("group-hover/list:opacity-50", 14 occurrences). The arrow after a link nudges up and right on hover ("group-hover/link:-translate-y-1", "translate-x-1").
- F15. observation: P5 reveals a "Copied" state when the email is used (copy to clipboard).
- F16. source (E7, 2006): progressive disclosure means showing "only a few of the most important options" first and a larger set on request; NN/g warns against hiding what users often need, against unclear paths to the second level, and against more than two levels. It also notes that appearing on the initial display itself tells users something is important.

## (d) Motion

- F17. observation: P1 has a cursor-following spotlight: a fixed layer with "radial-gradient(600px circle at ..., rgba(29, 78, 216, 0.15), transparent 80%)", with a 300ms transition. Its transitions carry "motion-reduce:transition-none" (35 occurrences), so they switch off under the reduced-motion preference.
- F18. observation: P4 staggers the entrance of its text blocks on load (raw HTML: "data-animate" and a "--stagger" custom property per paragraph) and has a blur layer at the top of the page. P5's markup carries animation flags on a canvas-like root. P13 (template) lists Framer Motion and Magic UI; I did not see its live motion.
- F19. observation: Heavy motion lives in the Awwwards genre. G2: Gil Huybrecht's Site of the Day is tagged Animation, Microinteractions, Infinite Scroll, WebGL, with a two-colour palette, and scored 8.40 on Animations/Transitions; Behfar Behzad's nominee is tagged Animation, 3D, Parallax, built on GSAP and Three.js, with a preloader and a "Constellation Project Picker". P11 is a 3D world driven with the keyboard, with no text-only fallback seen.
- F20. source (E8, 2020): NN/g lists feedback, state change, spatial navigation and signifiers as the purposes of UI motion, and says motion "is most often appropriate as a form of subtle feedback for microinteractions, rather than to induce delight"; peripheral vision makes people "prone to be distracted by any type of motion".
- F21. source (E9, WCAG 2.2): SC 2.3.3 (Level AAA) requires that motion triggered by interaction can be disabled unless essential; the prefers-reduced-motion media query is named as a sufficient technique. Level AAA, so not required for AA conformance.

## Attention and hiring evidence

- F22. source (E1, 2018, via press release and HR Dive): Ladders reports recruiters spend an average of 7.4 seconds on the initial screen of a resume, up from 6 seconds in its 2012 study. Resumes did well with simple layouts, clear section headings, bold titles and bullets, an overview at the top; badly with "cluttered layouts, a lack of white space on the page, multiple columns and long sentences". True of: professional recruiters screening resumes (not websites) in the United States job market of 2018. Sample size and method details not verified from a primary page.
- F23. source (E2): a recruiter's critique notes the Ladders report does not state the recruiters' count, experience, role types or resume length, and that the figure circulates without citation. Their own counter-evidence is an informal poll they call "inconclusive".
- F24. source (E3, 2018): on desktop at 1920x1080, 120 participants, over 130,000 fixations across news, ecommerce, blog, FAQ and encyclopedic pages: about 57% of viewing time above the fold, 74% in the first two screenfuls, 81% in the first three; in 2010 the above-fold share was 80%. True of general web pages, not portfolios, and not mobile.
- F25. source (E4, 2017 article on 2006 studies): the F-shaped scan appears when text lacks headings and bolding and users are after efficiency; front-loading, bolding and headings counter it.
- F26. source (E5, 2011 write-up of a Microsoft Research study of about 205,000 pages): the first 10 seconds decide whether a visitor leaves; leaving flattens after about 30 seconds. True of general browsing traffic around 2010, not of recruiters.
- F27. source (E6, survey fielded late 2017): about 9 in 10 hiring managers name previous experience and years of experience among the top qualifications; they look for "proven skill, such as previous work, years of experience, and projects/GitHub"; degree prestige, education level and certificates rank lowest. A search snippet also reports 37% naming personal projects and 22% portfolio among their top three factors for inviting to interview; I did not see those two figures on the page I opened. True of HackerRank's respondent base (heavily United States and India), not of Saudi employers.
- F28. observation: I found no eye-tracking or time-on-page study of recruiters or engineers viewing developer portfolio websites. The time figures quoted for portfolios (30 seconds, 2 to 3 minutes, 5 seconds) all trace to designers' opinion posts.

# Conclusion

- conclusion: Among the well-known engineer and design-engineer sites read (September 2026), the common first screen is a name, a one-line role, and links, with no photo on most and no stat tiles on any. Work is a short curated list with a link to the full archive; experience is prose or a dated list; education is absent or in the resume; technologies are text tags, not logos; none filters projects by technology. Detail is reached by linking to a second page, and P1 adds hover highlight with sibling dimming. Motion on these sites is small: hover transitions, a load stagger, one cursor spotlight, switched off under reduced motion. Heavy motion, 3D and preloaders belong to the Awwwards genre, which is judged by a design jury rather than by hiring outcomes.
- conclusion: Several features in the owner's list (stat tiles, logo badges, a technology filter, a distinct featured card, a combined timeline) did not appear on any well-known personal site read. They appear in templates and elsewhere; their absence here is not evidence against them, only that these exemplars do not show them.
- conclusion: The attention evidence is about resumes and general web pages, not portfolios. It consistently says first impressions form in seconds (7.4 seconds on a resume in 2018; 10 seconds on a web page in 2010), that most viewing stays in the first one or two screens (57% and 74%, desktop, 2018), and that clear headings and uncluttered, single-column layouts are scanned better. Hiring managers surveyed in 2017 weighted demonstrated work over credentials.
- Confidence: medium on (a), (b) and (d) for the sites named, since they were read directly but without running scripts or seeing them rendered; low to medium on (c), for the same reason; medium on the attention figures as figures, low on their transfer to portfolio sites.

# Not checked

- The sites were never rendered in a browser: no screenshots, no mobile view, no script-driven motion or disclosure (for example P5's canvas, P13's live demo, P1's Tardis easter egg). A rendered pass could change (c) and (d).
- Godly and Minimal Gallery could not be read (redirect and 404). Awwwards was read only as a listing and two entries.
- The Ladders 2018 PDF and article returned 403; the recruiter count and duration are unverified. The 2012 Ladders study was not opened.
- No primary study was found of recruiters or engineers looking at portfolio websites, of how long they stay, or of whether photos, stat tiles, logos or filters change outcomes. No study found on Arabic or right-to-left portfolio scanning, or on Saudi recruiters.
- No well-known junior developer's portfolio was examined; every personal site read belongs to an established engineer or designer.
- HackerRank's later reports (2019 to 2025) were not opened for whether the hiring-manager ranking still holds.
- Other names often listed (Sarah Drasner, Kent C. Dodds, Cassie Evans's archived portfolio, Olivier Larose) were not opened.
