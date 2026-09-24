---
use-when: "building a ticket of the portfolio rework, or judging whether a change to motion, badges, the filter, the featured project, or the home timeline follows the approach agreed for it"
---

# Architecture

The rework stays what the site is: static Astro pages over the YAML content, one global stylesheet, and the one inline script in `src/layouts/Base.astro`. Nothing here adds a framework, an island, or a client router. Every new behaviour is either CSS or a few more functions in that one script, and each is progressive: the page is complete before the script runs and stays complete if it never does. That follows from the spec's constraints on script and on requests to another origin ([[efforts/31-portfolio-rework/spec]], "Constraints"). The approach is chosen against the evidence in [[efforts/31-portfolio-rework/evidence/research/design-and-motion-principles]].

Six decisions had more than one reasonable answer. Each is laid out below with the one recommended. The choice is Saud's.

## 1. Page transitions

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A. Native cross-document view transitions** (recommended): `@view-transition { navigation: auto }` inside `prefers-reduced-motion: no-preference`, the header named so it holds still while `main` crossfades | No script at all. Real page loads, so the inline script, the dialogs, and the tests behave as they do today | Chrome and Edge 126+, Safari 18.2+; Firefox through 156 does not ship it and simply navigates | None to content: an unsupporting browser loses only the crossfade | A few lines of CSS |
| B. Astro's `ClientRouter` | Works in every browser, with its own reduced-motion handling | About 4.6 KB gzip of router script (estimated by the research, not measured). It turns navigation client-side, so the inline script's `DOMContentLoaded` wiring, the theme's first-paint guard, and the dialogs all have to be rewritten against `astro:page-load` | A regression in the theme flash or the document form that no current test is shaped to catch | A second lifecycle to reason about for every future script |
| C. No page transition | Nothing to build | The spec lists the crossfade among the motions | None | None |

A is recommended because it is the only option that adds the motion without adding script. The browser that misses out, Firefox, loses nothing but the fade, which requirement 10 already allows.

## 2. Scroll reveal and the count-up

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A. One `IntersectionObserver` in the inline script** (recommended), revealing each marked element once and starting each tile's count-up | Runs once per element, as the spec asks. Works in every current browser. The count-up needs the observer anyway, so both motions share it | Hidden-before-reveal is a state the script creates, so content depends on the script for its opacity | Content left invisible if the hiding rule applies and the observer never fires | About 40 lines beside the existing functions |
| B. CSS scroll-driven animations (`animation-timeline: view()`) | No script for the reveal | Scrubbed to the scroll position, so a section fades back out when scrolled past upward, which is not "once". Chrome 115+ and Safari 26+ only, Firefox behind a flag. The count-up still needs a script, so B saves nothing | Reveals that replay on every scroll read as decoration | Two mechanisms for one idea |
| C. No scroll reveal; load stagger only | Least risk | Drops a motion the spec lists | None | None |

A is recommended. Its one risk is closed in the mechanism rather than left to care. Hiding applies only under `html[data-reveal]`, and the same inline script sets that attribute and wires the observer in one function. It does so only when motion is allowed and `IntersectionObserver` exists, so the hidden state and the thing that ends it cannot come apart. Everything already inside the first viewport at load is revealed by the load stagger, never by the observer.

## 3. Technology logos

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A. The `simple-icons` package as a dependency** (recommended), imported only at build time by one module, with a test that reads the package's own licence data for every mark used | The licence and guidelines metadata comes with the paths, so a test can hold the licence rule. Renovate keeps it current. It ships nothing to the browser but the inline paths of the marks in use | A large package in `node_modules` for about 15 marks | A Renovate bump that changes a mark's licence fails the test, which is the right failure | One mapping file and one test |
| B. Vendored paths in `src/lib/icons.ts`, as the GitHub and LinkedIn marks are today | Matches the existing idiom, no dependency | Licence facts copied by hand and never checked again | A mark whose licence changes upstream is never noticed | Hand edits per mark |

A is recommended. The existing idiom, "about ten icons, so they are paths here rather than a dependency" (`src/lib/icons.ts`), argues from a count, and this effort roughly triples it. The GitHub and LinkedIn marks stay where they are, because `QrCode.astro` reads them from that map.

**The rule a mark must pass**, read from `simple-icons` 16.32.0 on 2026-09-24, with each mark's outcome settled in the ticket that adds it:

- **No licence recorded, or MIT or BSD:** usable. On today's list that is TypeScript, JavaScript, Svelte, Solid (for SolidJS), Tailwind CSS, Node.js, HTML5 (for HTML), CSS, PostgreSQL, Supabase, Turso, Drizzle (for Drizzle ORM), Bevy, GitHub Actions, Docker, and npm.
- **CC BY or CC BY-SA:** usable, and credited by name, licence, and source in the footer's credits (see Components). On today's list that is Rust, Git, PHP, and Godot Engine (for Godot).
- **Any NC or ND licence:** not used; the text chip instead. On today's list that is Tauri.
- **Absent from the set:** the text chip. Java, C#, SvelteKit, GDScript, and SQL are absent today. SvelteKit does not borrow the Svelte mark, because a badge that draws another product's mark names the wrong thing.
- **Guidelines recorded:** the ticket reads the linked guidelines before the mark enters the mapping, and a mark whose guidelines forbid a single-colour rendering or reference use takes the text chip. The package flags guidelines for TypeScript, Tailwind CSS, Node.js, CSS, PostgreSQL, npm, Rust, and Godot.

Marks render in `currentColor`, never in brand colours. That keeps the calm direction, keeps every badge at AA in both themes (JavaScript's yellow is under 2:1 on white), and is how Simple Icons itself presents the set.

## 4. The featured project

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A. An optional `featured: true` on a project** (recommended), refined in the schema to a shown project, with at most one enforced by the function that finds it | Says what it means. A featured project can be moved without reordering the CV. The build names the offending file | One field, one refinement, one README entry | None | Low |
| B. Treat `order: 1` as featured | No schema change | `order` already sorts the work page, the CV, and the resume, so featuring a project would reorder three outputs | Moving the feature silently reshuffles the documents, which effort 13 measures to the millimetre | Coupled meaning |

A is recommended. The spec asks for "a way to mark" a project, and `order` is already doing a different job.

## 5. The project filter

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A. Buttons wired by the inline script** (recommended): the chip row ships with `hidden`, and the script reveals it and toggles `hidden` on cards by their `data-technologies` | A polite live region can announce the count, which requirement 5 asks for. With script off there is no row and every card shows | Script-dependent, by design | None to content | About 30 lines |
| B. Radio inputs and `:has()` rules generated at build | Works with script off | Nothing can announce the count without script, so it misses requirement 5. A generated rule per technology | Screen-reader users get no feedback | Generated CSS per chip |

A is recommended, because only it meets requirement 5 as written.

## 6. The first screen's lead

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A. The whole profile summary** (recommended), set at the body size on a phone and one step up from `sm` | No sentence is cut in two languages. Nothing new to author. The summary was written to be read whole (efforts 15 and 17) | Four sentences of text in the hero | At 390 by 844 the contact actions must still land above the fold. Criterion 1's screenshot checks it | None |
| B. The first sentence, the rest behind a fold | A shorter hero | Splitting sentences is a content rule the Arabic may not share. It adds an interaction to the first screen | A lead that reads as truncated | A split rule to keep true in two languages |

A is recommended. Should the phone screenshot fail, the lever is the hero's spacing and type size, not the summary.

# Components

**Tokens, in `src/styles/global.css`.**
- Easing: `--ease-standard` is `cubic-bezier(0.2, 0, 0, 1)` and `--ease-enter` is `cubic-bezier(0.05, 0.7, 0.1, 1)`, Material 3's standard and emphasized-decelerate as the research confirmed them.
- Durations: `--duration-short` 150ms for hover, focus, and chips; `--duration-medium` 250ms for folds, the dialog, and the page crossfade; `--duration-long` 350ms for entrances and reveals.
- The existing `--animate-reveal` becomes `--animate-enter` at 350ms on `--ease-enter`.
- `--shadow-rest` and `--shadow-raised`, one value each per theme through `light-dark()`.
- `--glow`, the hero's radial accent at low alpha per theme.
- Every motion rule sits under `motion-safe:` or `@media (prefers-reduced-motion: no-preference)`. Under reduce, nothing animates or transitions at all. That is stricter than the spec allows and is what the existing layout test already asserts.

**`Card.astro`.** Resting shadow; on hover and `:focus-visible` (and `:focus-within` for a card holding links) it raises the shadow, translates up by 2px under motion-safe, and takes the accent border. A new `variant` prop, `raised`, gives the featured card and the tiles the higher resting elevation. It also takes `data-reveal` so the observer can find it.

**The load stagger.** The hero's children carry `motion-safe:animate-enter` with `animation-delay` set from a `--i` index at 60ms steps, and the whole stagger finishes inside 700ms. The `h1` and the lead animate `transform` only, never opacity, because either may be the LCP element. `main` loses its own reveal.

**The reveal**, in the inline script (decision 2). Elements marked `data-reveal` below the first viewport are hidden under `html[data-reveal]` and get `data-revealed` once they intersect at a 10% threshold. The hidden state is `opacity: 0; translate: 0 12px`, and `data-revealed` transitions both over `--duration-long`. The observer unobserves each element once it has revealed.

**`Badge.astro`**, new: one technology as a chip with `data-badge`. It shows the mark from the technology mapping as an inline `<svg>` with `aria-hidden`, or no svg, then the name exactly as the content spells it. Used by `Project.astro` and `Skills.astro`, replacing their joined text. On an ordinary project card it shows the first five badges and folds the rest behind the existing `Fold`, with a new `technologies` noun. The featured card shows all of them.

**`src/lib/technologies.ts`**, new: the one place a technology name meets a mark. It maps the content's spelling to a `simple-icons` slug, and to nothing for a text chip. It exports `technologyMark(name)`, returning `{ path, title } | undefined`, and `credits()`, returning the attribution lines for every mark in use whose licence requires one. It carries no runtime import beyond `simple-icons`, so a Node test can load it with the types stripped, as `shown.ts` is loaded today.

**The footer**, new in `Base.astro`: the site name and a native `<details>` labelled "Logo credits", listing `credits()`, one line per mark: name, licence, source. The disclosure keeps it from becoming clutter. The document pages do not print the footer, and their print rules hide it.

**`src/lib/shown.ts`** gains `featuredProject(projects)`. It returns the one project marked `featured` among those shown, or `undefined`, and throws naming both files when two are marked.

**`FeaturedProject.astro`**, new: a `raised` card spanning the grid's full width, with a "Featured" label and a star icon. It shows the name, the years, the role, the summary, every badge, and the links. The work page renders it above the filter and the grid, and the grid then leaves that project out. The home page renders it under the tiles.

**The filter**, on the work page (decision 5). A `<div role="group">` with an accessible name, holding one `<button aria-pressed>` per technology that at least two shown projects use, plus "All", ordered by how many projects use each and then by name. On today's content that is Rust, TypeScript, Java, Svelte, and SvelteKit. Each project card carries `data-technologies` as the technologies joined by `|`. A `role="status"` element says "Showing N projects" in the visitor's language. The row ships `hidden` and the script removes the attribute.

**`StatTile.astro`**, new: icon, number, label, as a `raised` card. The number is written at its final value. The visible number carries `aria-hidden="true"` and `data-count`, and a `sr-only` span beside it carries the final number and the label, so a screen reader never meets an intermediate value. The count-up is the observer's second job: once, over `--duration-long`, eased, through `requestAnimationFrame`, only under `html[data-reveal]`.

**The four tiles.**
- Projects: shown projects.
- Courses and certifications: every certificate entry.
- Technologies: the distinct technologies named by shown projects.
- Languages: the languages collection.

The third departs from the spec's wording ("across shown projects and skills"): the skills' keywords include practices such as "Design patterns" and "Refactoring", which are not technologies, and counting them would print a number the label does not describe. On today's content it is 21 rather than 34. The spec is amended to match (see Migration).

**`Monogram.astro`**, new: "SA" in Latin letters in both languages, in a circle drawn with the accent on a `raised` surface, `aria-hidden`, because the name is beside it.

**`Journey.astro`**, new, on the home page, built from a new `journey()` in `src/lib/timeline.ts`. It takes the education timeline exactly as `educationTimeline()` builds it, including its position rule for the undated courses. It merges each experience entry in by its start year, placing it after the last item that starts no later than it, where the courses node starts at its period's start. Then it reverses the whole, newest first. Each node gets its kind's icon (briefcase, graduation cap, book) and its years from `formatPeriod`, and links to an id: `work/#experience-<id>`, `education/#education-<id>`, or `education/#courses`. `Experience.astro` and `Education.astro` gain those ids on their cards. The rail and the markers use logical properties, so the axis sits at the inline start and moves to the right in Arabic with no extra rule.

**Icons.** `src/lib/icons.ts` gains Lucide bodies, under the licence already recorded there, for:
- briefcase (experience)
- folder-code (projects)
- graduation-cap (education)
- book-open (courses)
- award (certifications)
- wrench (skills)
- cpu (technologies)
- file-text (the CV and resume)
- star (featured)
- map-pin (location)
- arrow-right (a card that leads somewhere)

`arrow-right` joins the directional list in `Icon.astro`. Every section heading on the three pages is `<h2>` with its icon before the text, `aria-hidden`.

**The header**, in `Base.astro`. From `sm` up it stays one row. Below it, row one holds the site name at the start and the two controls at the end, and row two holds the navigation as a full-width list that does not wrap, spaced evenly with `justify-between`. The border-start divider goes. The current item keeps `aria-current="page"` and gains a 2px accent bar under it, so the mark does not rest on colour alone. Links get `py-2` and `min-h-6` so every target is at least 24 by 24.

**Folds and the dialog.**
- `details::details-content` transitions `opacity` and, where `interpolate-size: allow-keywords` is supported (Chrome 129+), `block-size`. That rule is inside `@supports`. Elsewhere the fold opens instantly with a fade.
- The certificate dialog and the document form's dialog take `@starting-style` entries (opacity and a 0.98 scale) with `overlay` and `display` transitioned `allow-discrete`, over `--duration-medium`.
- The inline script is unchanged for both.

**The page crossfade** (decision 1). `@view-transition { navigation: auto; }` and `::view-transition-group(root)` at `--duration-medium` on `--ease-standard`, both inside `prefers-reduced-motion: no-preference`. The header takes `view-transition-name: site-header` so it stays still.

**Strings.** `src/lib/i18n.ts` gains, in both languages:
- the tile labels;
- the filter's group name, "All", and the status line with its plural;
- the timeline's heading and kind names;
- "Featured";
- "Logo credits";
- the `technologies` fold noun.

# Interfaces

- `src/content.config.ts`: projects gain `featured: z.boolean().optional()`, with a refinement that `featured` implies `visibility !== 'hidden'` and `status === 'completed'`, and a message naming the rule. Astro reports the entry's file with it.
- `src/lib/shown.ts`: `featuredProject<P extends { featured?: boolean; visibility; status }>(projects: { id: string; data: P }[]): { id: string; data: P } | undefined`.
- `src/lib/timeline.ts`: `journey<Education, Experience extends { start }, Course>(education, experience, courses): JourneyItem[]`, where `JourneyItem` is the existing `TimelineItem` widened with `{ kind: 'experience'; entry }`.
- `src/lib/technologies.ts`: `technologyMark(name: string)` and `credits(): { name; licence; source }[]`.
- `Card.astro` gains `variant?: 'raised'`. Callers that pass none are unchanged.
- `Project.astro` renders badges in place of the joined technology line. Tests that read the technology text by the old list's `aria-label` change to read badges.
- `package.json` gains `simple-icons` in `dependencies`, pinned by the lockfile and updated by Renovate.

# Data Model

One field: an optional `featured` on a project, documented in `src/content/README.md`. `rentable.yaml` gets `featured: true`, the spec's assumption, which Saud can move with a one-line edit. No other content file changes.

# Technical Approach

The order work lands in, each step a ticket or a stack of them. Earlier steps are what later ones stand on.

1. **Motion foundation and the header.** The tokens, the card's elevation and hover, the load stagger in place of `main`'s reveal, the crossfade, the fold and dialog transitions, and the phone header. The Playwright config's `use` takes `reducedMotion: 'reduce'` as the default, so the colour, geometry, and click tests read a settled page; the motion tests opt back in. This goes first because every later component inherits the card and the tokens, and because changing the test default in the same change as the motion keeps the suite green at every commit.
2. **The reveal observer and the external-origin check.** The observer, `data-reveal` on the grids' cards and the section headings, and the dist check refusing any `src` or `href` to another origin in the built HTML and CSS, links in content excepted. The check lands before the logos, so the logos are the first thing it guards.
3. **Technology badges.** The dependency, `technologies.ts` with the licence rule applied and each guideline read, `Badge.astro` in the project and skill cards, the footer and its credits, and the licence test.
4. **The featured project.** The field, the refinement, `featuredProject`, the README entry, `FeaturedProject.astro` on the work page, and the content-mechanism fixtures for a hidden featured project and for two featured projects.
5. **The filter.** It stands on 3 (badges and `data-technologies`) and 4 (the grid without the featured project).
6. **The home timeline.** `journey()`, the entry ids on the two pages, and `Journey.astro`.
7. **The first screen and the home page.** The monogram, the glow, the lead, the primary CV action, the tiles and their count-up, the featured card and the timeline placed, the section cards with icons, and icons on every section heading on the three pages. It goes last because it composes 3, 4, and 6, and because the first-screen screenshot criterion can only be judged on the finished page.

# Integration

- **The document pages** share `Base.astro`, so they take the new header and the footer on screen. Their print rules already hide the header, and they gain the footer. Nothing inside `CvDocument.astro` changes, and `pnpm render:pdf` and `pnpm check:dist` must report the same page budgets as on `main`.
- **`scripts/check-dist.mjs`** gains the external-origin rule. Its existing reading-order and identifier checks are untouched.
- **`scripts/test-content-mechanism.mjs`** gains the featured fixtures.
- **The README generator** reads the profile and not projects, so it is unaffected. `pnpm readme` must still report the README current.
- **The JSON Resume mapper** ignores the new field, so nothing leaks into `resume.json`.

# Migration

- **The spec's stat tile wording.** Requirement 2 said "distinct technologies across shown projects and skills". Saud agreed on 2026-09-24 that it counts the technologies named by shown projects, for the reason under Components, and the spec carries the amendment with its date. Criterion 2 needed no change: it compares each tile to the collection it names.
- **Tests keyed to the old layout** change with the ticket that changes the layout, to the new guarantees and never looser:
  - `layout.spec.ts`: header rows and targets;
  - `home.spec.ts`: order, tiles, timeline, featured card;
  - `work.spec.ts`: badges, filter, featured card;
  - `education.spec.ts`: entry ids;
  - `contrast.spec.ts`: new surfaces.
- The `settled` helpers that wait on `getAnimations()` keep working, because the default is now reduced motion and nothing is running.

# Testing Strategy

How each criterion of [[efforts/31-portfolio-rework/spec]] is checked. All Playwright tests run over the built site through `scripts/serve-dist.mjs`, as today.

1. `home.spec.ts` asserts the DOM order and `aria-hidden` on the glow. A screenshot test at 1440 by 900 and 390 by 844, in both languages and themes, asserts the bounding boxes of the mark, name, label, location, and actions (and the tiles at 1440) end above the viewport's height. It asserts boxes rather than pixel diffs, so it survives type changes.
2. A test reads the collections through the same Node-loadable helpers (`shown.ts`, the content YAML) and compares each tile's `sr-only` text. It runs with JavaScript off and under reduced motion and asserts the visible number is final at load.
3. `work.spec.ts` and `home.spec.ts` assert every technology and keyword sits in a `[data-badge]`, with an `svg` exactly where `technologyMark` returns one, and the text matches the content. A Node test (`tests/technologies.test.mjs`, run by `pnpm test:content`) loads `technologies.ts` and the package's `simple-icons.json` and asserts every mapped slug passes the licence rule and that `credits()` lists exactly the attribution-licensed ones. The dist check's external-origin rule covers the rest.
4. The content-mechanism test builds with a hidden project marked featured and expects failure naming the file, then with two marked and expects failure naming both. The Playwright tests assert the featured card's width exceeds a grid card's on the work page, its presence on home, and its absence from the grid.
5. `work.spec.ts` clicks each chip and asserts the visible cards' `data-technologies`, `aria-pressed`, and the status text. It drives the chips by keyboard. With JavaScript off it asserts no chip row and every card visible.
6. `home.spec.ts` asserts the node order against `journey()` loaded in Node, and follows every node's `href` to an existing id. The Arabic axis is checked by eye at 360 and 1440, as the spec says.
7. `work.spec.ts` and `education.spec.ts` assert name, years, meta, and summary are visible without interaction, and that opening a fold or the dialog leaves `location.href` and `scrollY` unchanged. The existing keyboard tests for the fold and the dialog cover focus return.
8. Each page's headings, tiles, section cards, and nodes contain `svg[data-icon]` from `icons.ts`, with `aria-hidden="true"` where text names the same thing. The existing axe runs cover violations.
9. `contrast.spec.ts` gains the badge, chip, tile, featured card, timeline, and footer pairs in both palettes. A new test hovers and focuses a card with motion allowed and compares computed `box-shadow` and `transform` to rest.
10. `motion.spec.ts`, new, runs with motion allowed and collects `document.getAnimations()` plus every computed `transition-duration` and `animation-duration` on the page. It asserts each is between 100 and 400ms, delays excluded. It then:
    - emulates reduce and asserts `getAnimations()` is empty with every element at computed opacity 1 after load;
    - removes `IntersectionObserver` before load with `addInitScript` and asserts every element is at opacity 1;
    - reads the LCP element with a `PerformanceObserver` and asserts its animation's first keyframe has no opacity below 1.
11. `layout.spec.ts` at 360 in both languages asserts the header's nav items share one `offsetTop`, the header is at most two rows tall, no element with a border-start begins a row, `aria-current` sits on one item with its bar present, and every link and button measures at least 24 by 24.
12. `layout.spec.ts` in Arabic asserts the first chip's and first card's right edges sit at the container's right, and `arrow-right` icons have a negative x-scale. The logos are checked by eye.
13. `pnpm lighthouse` over its six pages. The existing suites, the no-horizontal-scroll test, and a JavaScript-off pass over every page asserting each `[data-reveal]` element is at opacity 1.
14. The build's gap report line compared by eye against `main`'s, as earlier efforts did. The i18n types already refuse a key present in one language and missing in the other.

# Technical Risks

- **Lighthouse on the Arabic pages.** Badges add inline paths to every project and skill card. Budget: the marks in use total under 15 KB of path data before compression, and each appears once per card that names it. If `/ar/` drops under 90, the first lever is dropping marks from the skill cards and keeping them on the project cards.
- **`@starting-style` on elements present at first render.** The research could not confirm it from the spec. It is used here only on dialogs, which are never open at first render, so the question does not bite. The load stagger uses keyframes rather than `@starting-style` for that reason.
- **The view-transition name on the header** must be unique per page. `Base.astro` renders one header, so it is.
- **Guidelines that forbid monochrome.** A mark that fails its guidelines goes to a text chip in the ticket. The spec's constraint already makes that the default, so no requirement is at risk.
- **Tests that wait on `finished`.** Scroll reveals below the fold never start without scrolling. With reduced motion as the test default they never run, so no helper hangs. Only `motion.spec.ts` meets them, and it scrolls.
