---
status: draft
---

# Problem

The site [[efforts/3-site-redesign/spec]] shaped is correct, complete, and plain. Every entry is a card, every control has an icon, and nothing is wrong, but nothing draws the eye either. The first screen is a name, a label, a location, a paragraph of summary, and three outlined buttons on white; the cards below it are flat grey boxes with thin borders, all the same size and weight, so a skill group, a section link, and a project read as the same kind of thing. Nothing on the page says in one look how much there is: the counts exist, but they sit in small grey text at the foot of the section cards, below the fold. Technologies are comma-separated grey text on every project and skill card, so the stack a recruiter is scanning for is the least visible thing on the card. There is no way to find the projects built with one technology short of reading all of them. The one employment entry sits alone in a two-column grid with half the row empty, and the studies timeline and the experience section live on different pages, so the path from study to work is not drawn anywhere. On a phone the header wraps the language and theme controls onto a line of their own under the navigation, behind a stray divider. Motion is one 500ms fade of the whole page on load.

Saud asked on 2026-09-24 for the site to be reworked into something better looking and easier to use, with more animation, better use of icons, and a good first impression, showing information "in a clever way, simply", with further detail reachable through interaction, and grounded in research on good portfolio design and known design principles. Asked to choose, he picked a polished minimal direction over a bold one, noticeable but restrained motion, all four of the information components offered (stat tiles, technology badges with logos, a project filter by technology, a featured project with a combined timeline), and a monogram rather than a photograph.

The cost of the current state is the first impression. The evidence behind this spec ([[efforts/31-portfolio-rework/evidence/research/portfolio-design-patterns]]) finds recruiters spend seconds, not minutes, on a first screen, and most viewing time goes above the fold. None of it is about portfolio sites specifically.

# Goal

A visitor gets the whole picture from the first screen: who Saud is, what he works in, how much there is, and where to go next. They can then reach any detail in one interaction without losing their place. The site looks deliberate in both themes and both directions, moves with purpose and never for its own sake, and still keeps everything the earlier efforts guarantee: one content source, two languages, two themes, content readable without script, no external requests, and the quality gates.

# Scope

- The chrome shared by every page: the header, its navigation on a phone and on a desktop, the two controls, and the footer.
- The home page: its first screen, its sections, and what they hold.
- The work page and the education page: how entries are presented and how their detail is disclosed.
- The shared components every page renders through (the card, the fold, the icon, the section card) and the new ones this effort needs.
- The motion of the whole site, and the palette and type tokens the new surfaces need.
- One field in the content contract to name the featured project, and the one place that maps a technology name to its logo.
- The interface strings the new components need, in both languages.
- The tests and checks that assert on layout and motion, updated to what the new layout guarantees.

# Requirements

1. **A first screen that answers the three questions.** The home page opens with a monogram mark drawn in the site's own style, the name, the label, and the location. Next come a short lead drawn from the profile summary, the contact actions, and one primary action to the CV. All of it fits in the first screen at 1440 by 900 and on a 390 by 844 phone up to the contact actions. A soft accent glow sits behind the hero in both themes, is decoration only, and carries no information.
2. **Stat tiles, counted from the content.** The first screen carries a row of stat tiles. Each tile has an icon, a number, and a label, and every number is the length of a collection the site renders, read from the content source through the same filters every output uses (`src/lib/shown.ts`), never written by hand. At least: projects shown, courses and certifications, distinct technologies across shown projects and skills, and languages spoken. The number is in the HTML as its final value. Where motion is allowed it counts up to that value once, when the tile first enters the viewport; a screen reader and a visitor with script off get the final value only.
3. **Technologies as badges with logos.** Every technology named on a project card and every keyword in a skill group renders as a badge: a small chip with the technology's logo where one is mapped and the name beside it, or the name alone in the same chip where none is. Logos are inline vectors drawn from one mapping in `src/lib/`, which is the only place a technology name meets a logo. The mapping records the source and licence of every mark it carries. A badge's text is the technology name exactly as the content source spells it, so a search of the page for a technology finds it.
4. **A featured project.** The content contract gains a way to mark one shown project as featured. The work page opens its projects with that project as a wider card that shows more than the others: its summary, its full stack as badges, and its links. The home page shows the same card beneath the stat tiles. With no project marked, both places fall back to showing no featured card, and the build does not fail. Marking a hidden or unfinished project featured is refused by the build.
5. **Projects filterable by technology.** Above the project grid sits a row of filter chips, one per technology that at least two shown projects use, plus "All". Choosing a chip narrows the grid to the projects that name that technology, and choosing "All" restores it. The chips are real buttons with a pressed state, reachable and operable by keyboard. The number of projects shown is announced to assistive technology when it changes. With script off the chips are absent or inert and every project shows. The featured card is not filtered out of its own slot.
6. **One timeline from study to work.** The home page carries one timeline that lays the education entries, the online-courses phase, and the experience entries on one axis by year, newest first. Each node shows its years, an icon for its kind (study, courses, work), the title, and the institution or organisation, and links to the section on the page that holds its detail. The timeline reads correctly with script off, and mirrors in Arabic.
7. **Essentials at a glance, detail in one interaction.** Every card shows its entry's name, its years, its one-line meta, and its summary. Anything longer (highlights, a course list, a certificate document, a project's full stack past the first few badges) is behind one clearly labelled control on the card that opens in place or in the page's dialog. No detail is more than one interaction deep, and opening one never navigates away or loses the scroll position. The existing folds and the certificate dialog are kept and animate open and closed where motion is allowed.
8. **Icons that carry meaning.** Every section heading on the home, work, and education pages, every stat tile, every section card, and every timeline node carries an icon from the site's one icon set that names what it is. The icons follow one visual style (stroke width, size, corner) and are hidden from assistive technology wherever the text beside them already says the same thing. No external request loads an icon.
9. **Depth and hierarchy in the surfaces.** Cards have a resting elevation and a hover and focus state that lifts them (shadow and a small translate) and takes the accent on the border. The featured card and the stat tiles are visibly a level above the ordinary cards, and the type scale separates page title, section heading, card title, and meta at a glance. Every text and background pair on every new surface meets WCAG AA in both palettes, and every non-text boundary a user needs to see meets 3:1.
10. **Motion that is noticeable and restrained.** The site moves in these places and no others:
    - the first screen's elements entering in a short stagger on load;
    - sections and cards revealing once as they scroll into view;
    - cards lifting on hover and focus;
    - folds and the dialog opening and closing;
    - stat tiles counting up once;
    - the page crossfading between routes where the browser supports it natively.

    Each motion runs between 100 and 400ms on the easing tokens the plan names, the current 500ms reveal included. Nothing loops and nothing moves on its own after it settles. The largest element of the first screen is never held invisible while it animates in. Under `prefers-reduced-motion: reduce` every movement is removed. At most an opacity change remains, and content is never left hidden. In a browser without support for a technique, the content simply appears.
11. **A header that works on a phone.** At 360 pixels wide the header shows the site name, a navigation that does not wrap into a second ragged row, and both controls, all within one tidy block with no stray divider. The current page is marked in a way that does not rely on colour alone. Every control and link in it has a target of at least 24 by 24 CSS pixels.
12. **Both themes, both directions.** Every new surface (the hero glow, the tiles, the badges, the chips, the featured card, the timeline, the elevated cards) has a light and a dark rendering, and mirrors correctly in Arabic. Grids and chip rows fill from the right, the timeline's axis and nodes sit on the right-hand side, directional icons flip, and logos do not.
13. **The gates still pass.** Lighthouse performance, accessibility, and best practices stay at 90 or above on the mobile profile for every page the gate already runs. No page scrolls horizontally at 360 pixels. Keyboard navigation reaches every new control. Every page renders all of its content with scripting unavailable, and a script only adds the filter, the count-up, the theme choice, and the dialog. The page loads nothing from another origin.
14. **Strings in both languages.** Every new interface string (the tile labels, the filter's labels and its announcement, the timeline's kind names, the featured card's label, the new controls' accessible names) is authored in both languages in `src/lib/i18n.ts`. The build's gap report does not grow, and the Arabic is a draft until Saud reads it on the published site.

# Acceptance Criteria

1. At 1440 by 900 and at 390 by 844, in both languages and both themes, a screenshot taken on load shows the monogram, the name, the label, the location, and the contact actions without scrolling, and at 1440 by 900 the stat tiles too. The glow element carries `aria-hidden` and no text. A test asserts the order in the DOM: mark, name, label, location, lead, actions, tiles.
2. Each tile's number equals the count computed from the collection it names, asserted by a test that reads the content and the rendered page. With JavaScript disabled, and under reduced motion, the tile shows its final number immediately. The accessible name of each tile contains the final number and the label.
3. Every technology on every project card and every skill keyword renders inside an element marked as a badge. A mapped technology's badge contains an inline `<svg>` and an unmapped one contains none, and both contain the exact content spelling. The mapping lives in one module, and each entry names the source and licence of its mark. The dist check finds no request to another origin.
4. A project marked featured in the content renders first on the work page as a card wider than the grid's column, and on the home page under the tiles. With no project marked, neither place renders a featured card and the build passes. A fixture marking a hidden project featured fails the build with a message naming the file.
5. The work page shows one chip per technology used by two or more shown projects, plus "All". Pressing a chip leaves exactly the projects naming that technology visible, and sets `aria-pressed="true"` on it. A polite live region announces the new count. Tab and Enter or Space operate the chips. With JavaScript disabled every project is visible.
6. The home page's timeline lists every education entry, the online-courses phase, and every experience entry, ordered by start year descending, each with its years, a kind icon, a title, an organisation, and a link that resolves to an element id on the page it names. In Arabic the axis sits on the right, checked by eye at 360 and 1440 pixels.
7. On every card, the name, years, meta, and summary are visible without interaction. Every longer detail is behind one control with a visible label, and opening it does not change `location.href` or the scroll position. A keyboard-only pass opens and closes a fold and the certificate dialog, with focus returned to the control that opened it.
8. Every section heading on the three pages, every tile, every section card, and every timeline node contains an icon from `src/lib/icons.ts`. An icon beside text that names the same thing has `aria-hidden="true"`, and an axe run over each page reports no violations.
9. The contrast test covers every new surface in both palettes and passes AA for text and 3:1 for the boundaries it names. On hover and on keyboard focus a card's computed `box-shadow` and `transform` differ from its resting values.
10. A test lists every animation and transition on each page, with its duration and easing, and asserts each duration is between 100 and 400ms. Under emulated `prefers-reduced-motion: reduce` it asserts no computed `transform` animation or transition remains, and every element is at full opacity once the page settles. With scroll-driven animation unsupported, content is visible without scrolling it into view. The Lighthouse LCP element is not one whose animation starts at opacity 0.
11. At 360 pixels in both languages the header's height is at most two rows of controls, no navigation item wraps under another, no divider sits alone at the start of a row, and the current page carries `aria-current="page"` plus a non-colour marker. Every header target measures at least 24 by 24 CSS pixels.
12. Every new surface renders in both themes and both directions. The layout test checks that chip rows and grids start at the right edge in Arabic and that directional icons are mirrored. The logos are unmirrored, checked by eye.
13. `pnpm lighthouse` reports at least 90 on the three categories for every page it already runs. The existing layout, theme, contrast, and reduced-motion tests pass with expectations updated to the new layout. No page scrolls horizontally at 360. With JavaScript disabled every page shows all of its content. The dist check's no-external-origin assertion passes.
14. Every string the new components show exists in both languages in `src/lib/i18n.ts`, and the build's gap report prints the same count it prints on `main` before this effort.

# Constraints

- **Everything the earlier efforts constrain still binds:** free static hosting, one content source, truthful academic status, two languages with one set of facts, no tracking, no contact detail published, stacked changes through Graphite ([[efforts/1-portfolio-site/spec]], "Constraints"; [[efforts/3-site-redesign/spec]], "Constraints").
- **No request to another origin.** Icons, logos, and fonts are inline or bundled. A logo is a small inline vector, not an image file per badge, because the site is a record that must not depend on a CDN and because the Lighthouse gate is a requirement.
- **Script is progressive.** Every page renders its content with script off. A script may add the filter, the count-up, the dialog, and the theme choice; it may not be the only way any fact reaches the page. A client-side router that replaces page navigation is not assumed; whether one earns its cost is for the plan, measured against this constraint and the gate.
- **Motion serves a purpose and yields to preference.** Every movement is feedback, a state change, a spatial cue, or a signal of what can be interacted with, which are the purposes the motion evidence names ([[efforts/31-portfolio-rework/evidence/research/design-and-motion-principles]]). All of it is removed under reduced motion, because WCAG 2.2 success criterion 2.3.3 counts a moving reveal, a hover lift, and a sliding transition as motion animation.
- **Only compositor-friendly properties animate** (transform, opacity, and the colours already transitioning), so no animation shifts layout or counts against CLS.
- **The documents are not touched.** The CV and resume pages take the new header, and nothing inside the document, its print rules, or its PDFs changes, because their one-page and parser-safe guarantees ([[efforts/13-one-page-resume-and-clean-generation/spec]]) are measured to the millimetre.
- **Logos respect their owners.** A mark is used only as the technology's name, never as an endorsement, and only where its source's licence and its owner's brand guidelines allow; a technology without a usable mark gets the text chip.

# Out of Scope

- **A photograph.** Saud chose the monogram on 2026-09-24.
- **New or reworded content.** No project, course, job, or summary is added or rewritten. The featured flag is the one content change, and it names an existing project. The first screen's lead is the profile summary as it stands, shortened only by the plan's choice of how much of it the hero shows.
- **A "years of experience" or "years coding" tile.** No fact in the content source backs one, and the site never shows a number it cannot count.
- **The CV and resume documents,** their layout, their PDFs, and the JSON Resume output.
- **New routes or a new navigation structure.** The pages stay the pages there are. The timeline and the featured card join the home page and the work page rather than getting pages of their own.
- **Heavy or decorative motion:** WebGL or 3D, parallax, a typing effect, an animated background, a custom cursor or cursor spotlight, a preloader, looping animation. The research finds these in the award-gallery genre, which a design jury scores and which no hiring outcome is involved in.
- **Filter state in the address.** The filter is a view of the page, not a link someone shares; a reload shows every project.
- **A search, a command palette, a blog, a contact form, analytics, a custom domain,** which earlier efforts already exclude or which nobody asked for.

# Assumptions

- The screenshots behind the Problem were taken on 2026-09-24 from a `dist/` older than `main`: its periods still showed months, which effort 25 removed. The layout they show matches the source read on the same day. The dates do not.
- The four stat tiles are the ones requirement 2 names. The plan may swap one for another count the content already backs, and the owner decides if it does.
- The featured project is `rentable`, the one project whose `order` is 1, until Saud names another. The flag is his to set.
- The filter offers only technologies two or more shown projects use, so a chip never narrows the grid to the one card that named it. Nineteen project files exist and fewer are shown, so a filter over one-project technologies would be a list of names rather than a tool.
- The effort 3 exclusion "Decorative motion ... nothing moves for its own sake" is an effort-level boundary that Saud's request of 2026-09-24 reconsiders for the site's pages, not a repository-level decision. The documents keep it.
- Cross-document view transitions ship in Chrome and Edge from 126 and Safari from 18.2, and not in Firefox through 156; scroll-driven animations ship in Chrome from 115 and Safari from 26 and sit behind a flag in Firefox, as of 2026-09-24 ([[efforts/31-portfolio-rework/evidence/research/design-and-motion-principles]]). A visitor on Firefox gets an instant page change and content that is simply there, which requirement 10 already allows.
- The design direction is the one the research observed on well-regarded portfolios (a text-first hero, restrained motion, whole-card hover feedback) plus the four components Saud asked for, which the research found on none of the eleven sites it read. That absence is not evidence against them. It is the reason requirement 7 keeps each one to one interaction and requirement 9 keeps the surfaces calm.

# Open Questions

None that change what is required. Which easing tokens, which technologies get logos, and how the hero shortens the summary are the plan's. The featured project and the four tiles are assumptions above, which Saud can overturn in a line.

# Risks

- **Clutter.** Four new components on one home page can undo the calm the direction asks for. It would show as a first screen that no longer fits requirement 1, and criterion 1's screenshots are what catch it.
- **The Lighthouse gate.** Logos, a glow, a heavier first screen, and a count-up script all cost bytes and paint. The Arabic pages sat near the performance floor once before (effort 13). The gate catches it, and the plan should budget the logos.
- **Reduced motion done halfway.** A reveal written as "start at opacity 0, animate in" leaves content invisible wherever the animation does not run. Criterion 10 tests the unsupported path and the reduced path for exactly this.
- **Logo licensing.** Simple Icons' set is CC0, but its own disclaimer says some icons carry their own licence and brand guidelines. A mark used against its guidelines would have to come out after launch, which is why the constraint makes the text chip the default.
- **Right-to-left.** A timeline, a chip row, and a count-up are easy to get right in English and wrong in Arabic. Criterion 12 is checked partly by eye, as earlier efforts' Arabic layouts were.
- **Tests keyed to the old layout.** The layout, home, work, and education tests assert on today's structure. They will fail on the new one and must be updated to the new guarantees, not loosened.
