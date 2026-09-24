---
status: accepted
priority: high
---

# Problem

[[efforts/31-portfolio-rework/spec]] gave the site its first screen, badges, filter, timeline, and motion, and it landed on 2026-09-24. Reading the published result the same day, Saud found four things wrong with how the site is laid out and moved around, none of which that effort was asked to settle.

- **The two timelines disagree.** The home page's timeline reads newest first, so the oldest entry is at the bottom. The education page's studies timeline reads the other way: oldest first, the university under the online courses. The CV prints its education in the same oldest-first order, because all three read one rule in `src/lib/timeline.ts`. A reader moving from one to the other has to re-read the direction.
- **The monogram adds nothing.** The "SA" mark at the top of the first screen repeats the name printed directly under it, and it takes the first place on the page.
- **The navigation is uneven.** The header names Home, Work, Education, CV, and Resume. Work holds two sections (experience and projects), Education holds two or three (studies, courses, and certifications while one exists), and Skills has no page at all and sits on Home. The "On this site" grid at the foot of Home then repeats every one of those destinations as a card. So some header items are one section, some are several, and one section is not in the header at all. Saud asked for navigation "like professional portfolios": easier, and one shape throughout.
- **The Skills card does nothing.** Its link is `#skills` on the page it sits on. The skills section is second from the bottom of Home, and the page ends too soon after it to scroll the heading to the top. A reader already near the foot presses the card and the page does not move, so the link looks broken.

# Goal

The site reads as one page that holds the whole portfolio, in the order a hiring reader wants it. A header that stays on screen names every section once, jumps to it, and shows which one is being read. Every link on the page moves the reader somewhere visible. Every list laid out in time reads newest first, on the site and in both documents. The CV and the resume stay documents of their own, one press away from anywhere.

# Scope

- The home page becomes the only page of the portfolio proper. It holds About (the first screen), Experience, Projects, Education, and Skills, in that order.
- The header on every page: the sections, the two documents, the two controls, and how it collapses on a phone.
- The work and education pages, which stop being pages, and what their addresses do afterwards.
- The education timeline rule in `src/lib/timeline.ts` and every output that reads it: the site, the CV, and the resume.
- The monogram, the home page's combined timeline, and the "On this site" grid, which go.
- The interface strings, tests, checks, and documents that name any of the above.

# Requirements

1. **Newest first, everywhere.** Every list the site or a document lays out in time reads newest first: the education section's studies timeline, the CV's education section, and the resume's education section. The online-courses node keeps its place relative to the institutions under the existing position rule, read in the new direction, so on today's content the university comes first and the online courses after it. The rule stays one rule in `src/lib/timeline.ts`, read by every output and every check. The courses grid is sorted by date as well, so it reads newest first too, with the undated courses last as before.
2. **No monogram.** The first screen has no monogram mark. The name is its first element.
3. **One page for the portfolio.** The home page holds, in this order: About (the first screen with its name, label, location, summary, actions, and tiles), Experience, Projects (the featured card, the technology filter, and the grid), Education (the studies timeline, the courses, and the certifications while one exists), and Skills. Each section is a landmark with a heading whose id is its anchor: `about`, `experience`, `projects`, `education`, `skills`. The ids the pages used before that are still meaningful (each project, experience, and education entry's own id, `courses`, `certificates`) keep working on the home page. The combined timeline and the "On this site" grid are removed, because the sections and the header replace them.
4. **A header that stays and says where you are.** On every page the header stays on screen as the page scrolls. On the home page it links to each of the five sections, and the link for the section being read is marked current, in a way that does not rest on colour alone, and exposed to assistive technology. Pressing a section link brings that section's heading to the top of the viewport, just below the header, with nothing hidden under the header. Where motion is allowed the page glides there in 350ms on the site's entrance curve. Under reduced motion, or with no script, it jumps. (The glide was Saud's choice on 2026-09-24, over the browser's own smooth scroll, whose speed and curve are not the site's tokens, and over a plain jump.) On the CV and resume pages the same links lead to the sections on the home page.
5. **Every section link moves the reader.** Every section, the last included, can be scrolled so its heading sits just below the header. A link to a section on the page it is on always moves the page, from wherever the reader is.
6. **The documents stay documents.** The CV and the resume remain pages of their own at the addresses they have now. They are not merged into the home page. The header carries both, set apart from the section links as the two documents. The first screen's actions keep the CV as the one filled action and the resume beside it.
7. **A phone header.** Below the width at which the whole header fits on one row, the header shows the site name, one menu button, and the language and theme controls. The button opens a panel listing the section links and the two documents, and it closes on a link press, on Escape (returning focus to the button), and on a press outside it. With script off the button is a native disclosure that still opens and closes, and every link in it works. The current-section mark shows in the panel too.
8. **The old addresses still land.** `/en/work/`, `/ar/work/`, `/en/education/`, and `/ar/education/` still answer. Each sends the reader to the matching section of the home page in the same language, without script, and points search engines at the home page as its canonical address. The work page lands on Experience and the education page on Education, whatever anchor the old address carried. The sitemap lists only real pages. (Amended on 2026-09-24 at `/plan`. This first asked for every old anchor to land on its own heading, and a probe showed a forward without script cannot carry an anchor ([[efforts/33-one-page-portfolio/evidence/prototypes/meta-refresh-drops-the-fragment]]). Saud chose one target per address and no script, over a script on the forwarding pages. The only links that used the old anchors were the home page's grid and timeline, which this effort removes.)
9. **Nothing the earlier efforts guarantee is lost.** Two languages with the Arabic header and panel mirrored, two themes, all content readable with script off, no request to another origin, the reduced-motion rules, the filter's behaviour and announcement, the certificate dialog, the count-up, and the quality gates all hold on the one page as they did across three.
10. **Strings in both languages.** Every new interface string (the section names in the header, the menu button's accessible name, the documents' group label) exists in both languages in `src/lib/i18n.ts`, and the strings for removed surfaces go with them. The Arabic is a draft until Saud reads it on the published site.

# Acceptance Criteria

1. A test builds the expected order from the content and asserts that the education section and both documents' education sections list the institutions newest first, with the online-courses node where the position rule puts it. On today's content that is the university, then the online courses. The courses grid lists its dated courses by date descending, with the undated after them. The unit tests for `src/lib/timeline.ts` assert the rule on fixtures with two institutions.
2. No page renders a monogram element. The first element inside the first screen is the `h1`.
3. The home page, in both languages, has the five section headings in the stated order, each with its id, each inside its own landmark labelled by that heading. Every project, experience, and education entry and the courses and certifications grids render there. The journey list and the section-card grid are absent from the build output.
4. At 1440 by 900 and at 390 by 844, scrolling to the foot of the home page leaves the header in view. For each section, a test presses its header link from the top of the page and from the foot of the page and asserts two things: the heading's top sits within 24 pixels below the header's bottom edge, and that link, alone, carries `aria-current`. The same links on the CV and resume pages point at the home page's sections. With motion allowed, a test samples the scroll position during a glide, finds it between its start and its end, and finds it settled by 400ms. Under reduced motion the first frame after the press is already at the section.
5. The criterion 4 test passes for Skills, the last section, from the foot of the page. No link on the home page has an in-page target that the test's scroll leaves out of view.
6. `/en/cv/`, `/ar/cv/`, `/en/resume/`, and `/ar/resume/` build as before, and the document checks pass unchanged. The header on every page links to both. The first screen's CV action is the filled one.
7. At 360 by 740, in both languages, the header fits one row: the name, the menu button, and the two controls. The button has an accessible name and an expanded state. Opening it lists the five sections and the two documents. A link press, Escape (with focus back on the button), and an outside press each close it. With JavaScript disabled it opens and closes and its links navigate. No page scrolls horizontally at 360 pixels.
8. Each of the four old addresses, fetched from the built output, carries a meta refresh to its home-page section in the same language and a canonical link to that language's home page. It has no script. A browser test opening each old address, bare and with one of its old anchors, ends on the home page with that address's section heading in view. The sitemap has no work or education page.
9. The existing contrast, layout, motion, filter, certificate, document, and no-script suites pass against the one page, with their selectors moved rather than their assertions weakened. The dist check still finds no request to another origin. Lighthouse performance, accessibility, and best practices stay at 90 or above on the mobile profile for every page the gate runs.
10. The strings check finds every new string in both languages and none left for a removed surface. The build's gap report does not grow.

# Constraints

- **Static hosting, no server redirects.** GitHub Pages serves files only, so an old address can forward only from a page of its own. That is why criterion 8 asks for a refresh and a canonical link rather than a status code.
- **One inline script.** The site has exactly one script, in `src/layouts/Base.astro`, and every behaviour is progressive: content and navigation work without it. The section tracking and the menu's closing join that script under the same rule. It is the repository's standing constraint, not a preference.
- **The content contract does not change.** No content file is edited for this. The order, the sections, and the redirects are all derived from the content the site already has.
- **Motion stays on the tokens.** Any scrolling or menu motion this adds runs on the easing and duration tokens [[efforts/31-portfolio-rework/spec]] set, and disappears under reduced motion, where the jump is instant.

# Out of Scope

- A page of its own for any section. Saud chose one page with a header that follows the reader over one page per section on 2026-09-24.
- Merging the CV or the resume into the home page. Saud said on 2026-09-24 they stay reachable from home, not on it.
- Changing what any section shows. The cards, badges, filter, folds, dialog, tiles, and featured card are carried over as they are.
- New content, and any change to the documents beyond their education order.
- A table of contents, breadcrumbs, or a back-to-top control. The header covers all three jobs.
- Rewriting the Arabic drafts [[efforts/31-portfolio-rework/spec]] left for Saud to read.

# Assumptions

- The Skills link is broken the way the Problem says: the target exists and the page cannot scroll far enough. This was read from the page's structure, not reproduced in a browser. Criterion 5 tests the fix either way.
- The four old addresses are the only ones worth forwarding. The site is weeks old, and these are the only pages being removed.
- One page with a count of the current content (one job, one institution, 13 projects, 26 courses) stays within the Lighthouse gate. The courses are the longest part, and their cards are already short.

# Risks

- **One long page could slow the first load.** Every section's images and cards now load on one address. It would show as a Lighthouse performance drop on the home page, which criterion 9 catches.
- **Tracking the current section can flicker** when two short sections are both in view, or pick the wrong one at the foot of the page. It would show in the criterion 4 test from the foot of the page.
- **Browser tests are built around three pages.** Moving their selectors is the largest part of the work, and a suite adapted carelessly could stop asserting what it asserted. Criterion 9 says the assertions move, not weaken, and review checks it.
