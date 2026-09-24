---
use-when: "building a ticket in effort 35 and the approach is not obvious from the spec"
---

# Architecture

Seven requirements, and most of them change content or one component each. Three of them turn on a choice. Those choices are written here, with the alternatives that lost.

**The glyph for a name with no mark** (requirement 5). Saud chose on 2026-09-24:

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| One code glyph, Lucide's `code`, on every unmapped badge (chosen) | reads as generic at a glance, so it cannot pass for a brand; one icon body, already the family the site draws from | practices such as "Refactoring" get a code glyph too | none of note | none: a new unmapped name gets it for free |
| A letter tile, the name's first letters in a rounded square | looks more like a logo row | reads as an invented mark for a real product, which is what the licence rule exists to avoid | an owner reading it as their mark | none |

`technologyMark()` keeps returning `undefined` for an unmapped name, so the licence test and every caller keep their meaning. The glyph is drawn by the two places that draw marks, the badge and the filter chip. It lives in `src/lib/icons.ts` as `code`, under the Lucide notice already there.

**The header's name** (requirement 1) follows the reveal's pattern exactly. With no script, nothing is hidden, and the script opts the page into hiding.

- In the inline script, a new function, `name()`, runs from the `DOMContentLoaded` handler. It returns at once where the page has no `h1#about`, where `IntersectionObserver` is missing, or where reduced motion is asked for.
- Otherwise it observes `h1#about`, with the header's height as a negative top root margin, so the heading counts as gone once it is under the header. It toggles `data-name-shown` on the home link, and it sets `data-name-follows` on the root last, once the first observation has run.
- The stylesheet hides `html[data-name-follows] [data-home-name]:not([data-name-shown])` with `opacity: 0` and `visibility: hidden`. It transitions opacity on `--duration-medium` and `--ease-standard`, and visibility as a discrete step at the end of the fade out and at the start of the fade in. `visibility: hidden` is what takes the link out of the tab order and out of the accessibility tree. No `inert` and no `tabindex` juggling are needed.

Rejected: `position: sticky` tricks and scroll-driven animation. Scroll-driven animation cannot remove focusability, and support is uneven. Rejected as well: hiding on every page. The spec keeps the documents as they are.

**Where the skills' backing is recorded** (requirement 4, criterion 4).

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| A backing table in the new test file: keyword to the entry that backs it, for keywords no shown project names (chosen) | no schema change, which the spec forbids; the test is the only reader | the table and the content are two files | a keyword backed by an entry later hidden: the test catches it, since it checks the entry is shown | one line per such keyword |
| A `backedBy` field on the skill schema | the witness sits beside the claim | a schema change, which the spec's constraint rules out | none | a field every skill file carries |
| Adding every tool to some project's technologies, so no table is needed | one mechanism | puts Design patterns and C# on project cards, which is untrue of those projects | a false claim on a card | none |

The course-backed names, and the practices that no card names, are backed by a certificate or by a project's code. The table says which and why, in one line each.

# Components

- `src/content/projects/`. Five entries go to `visibility: hidden`: `course-cpu-scheduling-simulator`, `course-simple-personal-information-form`, `cs475-course-viewer`, `godot-brackeys-simple-platformer`, and `learning-rust`. `rentable` gains the tools its manifests show and its entry does not name: Drizzle ORM, tRPC, Zod, Tailwind CSS, Vite, Vitest, and SQLite. For SQLite the witness is `better-sqlite3` in the desktop app and Turso's libSQL. No other project changes, because rentable alone backs every added keyword.
- `src/content/skills/`:
  - `programming-languages`: Rust, TypeScript, JavaScript, C#, SQL. Java and GDScript leave.
  - `web-and-desktop-applications`: Svelte, SvelteKit, Tauri, Tailwind CSS, tRPC, Zod, Node.js, HTML, CSS. SolidJS leaves.
  - `databases`: PostgreSQL, SQLite, Turso, Drizzle ORM, SQL.
  - `tools-and-practices`: Git, GitHub Actions, Docker, Vite, Vitest, Unit testing, Design patterns, Refactoring, and "Data structures and algorithms".
  - `game-development`: Bevy. Godot leaves, and the group stays with one keyword, since removing a group is not in the spec.
  - `language-implementation`: unchanged.
- `tests/skills.test.mjs`, new, run by `pnpm test:content`. It reads the skill YAML files, the shown projects through the same visible-and-completed rule `src/lib/shown.ts` applies, and a backing table. It fails, naming the keyword, when a keyword is in no shown project's technologies and has no table line. It also fails when a table line points at a file that does not exist or at a project that is not shown. The table covers these keywords:
  - C#, Docker, Git, Unit testing, Design patterns, Refactoring, "Data structures and algorithms", and HTML: the Code with Mosh or Sololearn certificate that names each.
  - GitHub Actions and CSS: rentable, whose workflows run on GitHub Actions and whose repository GitHub counts as partly CSS.
  - Interpreters, Compilers, "Lexers and parsers", and "Bytecode virtual machines": monkey-lang and pl-0. monkey-lang lowers its AST to a basic-block IR and runs it on its own interpreter, which is the virtual machine the keyword names.
- `src/lib/technologies.ts`. It maps tRPC, Zod, Vite, Vitest, and SQLite to their marks. Checked on 2026-09-24 against simple-icons 16.32.0: none records guidelines, and Zod's licence is MIT. It changes no refusal. `tests/technologies.test.mjs` drops the case that asserts SvelteKit draws the name alone, since that stays true of `technologyMark` but no longer of the badge. It gains a case for each new mapping.
- `src/lib/icons.ts` gains `code`. `src/components/Badge.astro` draws the mark where one is mapped and `<Icon name="code">` otherwise. The chips in `src/pages/[locale]/index.astro` do the same. Both stay `aria-hidden`.
- `src/components/Project.astro`. The fold goes, and every technology is a badge. `t.fold.nouns.technologies` leaves `src/lib/i18n.ts`.
- `src/lib/certificates.ts`, new. It holds the PDF and preview globs that `Certificate.astro` holds today, and `certificateDocument(entry)` returns the address, the preview's src and size, and the caption, or `undefined`. `Certificate.astro` reads it, and so does the new course list, so the dialog's data attributes are written once.
- `src/components/CourseList.astro`, new. The online-courses node as a native `<details id="courses" data-courses-node>`.
  - The summary is today's card face: the period, the name, the count, and a chevron in place of the "go to" line.
  - The body is an `<ol data-course-list>`, with one `<li>` per course in the existing `byDateDescending` order. Each item is an `<a>` to the PDF, carrying the same `data-document` attributes the card carries, so the existing dialog script opens it unchanged. It holds the name, then the issuer and the date, muted. A course with no document is text, not a link.
  - `index.astro` renders it in the timeline in place of the card, and removes the courses `<section>` and its grid. The certifications section is unchanged.
- `src/layouts/Base.astro`:
  - The home link gains `data-home-name`, and the script gains `name()` as above.
  - The footer reads "© {year} {name}" from `new Date().getFullYear()` at build and the profile's name. It then lists one link per profile, each with its network's icon through `profileIcon`, and one link to the repository, followed by the credits disclosure as now.
- `astro.config.mjs` exports `repository`, the source's address, beside `site` and `base`, for the footer to read.
- `src/lib/i18n.ts` gains `footer.sourceCode` in both languages, "Source code" and "الشيفرة المصدرية", and `education.onlineCourses.open`, the summary's hidden label, if the chevron needs one. It loses `sections.courses` if nothing else reads it, and `t.fold.nouns.technologies`.
- `src/styles/global.css` gains the name's hidden state and its transition. The rule sits inside the no-preference block, like every other motion rule.

# Interfaces

- `certificateDocument(entry: CollectionEntry<'certificates'>, locale)`. It returns `{ address, preview: { src, width, height }, caption } | undefined`. Callers: `Certificate.astro` and `CourseList.astro`.
- `repository`, a string exported from `astro.config.mjs`, as `site` and `base` already are.
- The dialog script's contract does not change. It still opens any `[data-document]` element.

# Technical Approach

Five tickets, stacked in this order.

1. **Content.** It hides the five projects, adds rentable's tools, rewrites the skills, and adds `tests/skills.test.mjs`. It goes first because the marks ticket maps names this one decides, and because the resume's page length is measured once the keywords settle. `pnpm render:pdf` runs here and the millimetres go in the commit.
2. **Marks and the glyph.** It adds the five mappings, the `code` icon, and the fallback in the badge and the chip.
3. **The whole stack on every card.** It removes the fold from `Project.astro` and its string.
4. **The courses inside the timeline.** It adds `src/lib/certificates.ts`, `CourseList.astro`, the removal from `index.astro`, and the moved tests.
5. **The header's name and the footer.** It changes `Base.astro`, `global.css`, `astro.config.mjs`, and the strings.

Tickets 3 to 5 touch different files and need nothing from each other. They stack only because Graphite stacks.

# Integration

- **The resume.** It prints the key skills and rentable's technologies, and rentable gains seven. The one-page headroom `scripts/render-pdf.mjs` enforces is the check. If it fails, the lever is the resume's own rendering of a project's technologies, never type size, and that is surfaced before anything is cut.
- **`resume.json`.** It loses the five hidden projects and gains rentable's keywords. `pnpm check:dist` validates both files.
- **The stat tiles.** Both counts are derived, so they change with the content. `tests/home.spec.ts` already computes them from the content.
- **The forwards.** `tests/forwards.spec.ts` sends `#courses` on the old education address. The forward lands on the Education section whatever the anchor, which is unchanged.

# Testing Strategy

| Criterion | Check |
| --- | --- |
| 1 | new cases in `tests/navigation.spec.ts`, at 1440 by 900 and 390 by 844, in both locales: the home link is `visibility: hidden` and not reached by Tab at the top, visible after scrolling past `h1#about`, and hidden again on return. With JavaScript disabled, under reduced motion, and on `/en/cv/`, it is visible at the top |
| 2 | a footer case in `tests/home.spec.ts`: the text begins with "©", the build year, and the name, it links each profile URL and `repository`, and the credits disclosure still lists `credits()` |
| 3 | `tests/work.spec.ts`, or wherever project cards are asserted: no `details` inside `[data-entry="project"]`, and badge count equals `technologies.length` per shown project. `tests/contrast.spec.ts` drops the badge fold and keeps the logo credits |
| 4 | `tests/skills.test.mjs`, above; the existing skills case in `tests/home.spec.ts` asserts the badges against the content, unchanged |
| 5 | `tests/technologies.test.mjs`, extended; the skills and project badge cases in `tests/home.spec.ts` assert that every badge has exactly one `svg`, the mark where `technologyMark` has one and `data-icon="code"` otherwise; `pnpm check:dist`'s no-other-origin assertion |
| 6 | `tests/education.spec.ts` and `tests/certificates.spec.ts` move from `[data-grid="courses"]` to `[data-course-list]`. They check the item count and order against the content, that pressing an item opens the dialog with its caption and closes back to it, and that with JavaScript disabled the disclosure opens and each item's `href` is the PDF. `tests/home.spec.ts` drops `[data-grid="courses"]` and `h3#courses` from its section list |
| 7 | the dist check greps `dist/` for the five names; `tests/home.spec.ts`'s tile counts |
| 8 | the reviewer reads `git diff main -- src/lib/shown.ts` |
| 9 | the full gate, run once per ticket before its commit: `pnpm check`, `pnpm build`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm lighthouse` on the last ticket |
| 10 | `pnpm render:pdf` after ticket 1, and again after the last |
| 11 | the strings check in the existing suite |

# Technical Risks

- **The name's first paint.** The name renders visible, and the script hides it at `DOMContentLoaded`. On a slow first paint the name could show for a frame, then fade. The reveal has lived with the same order without complaint. If it shows, the fallback is to set `data-name-follows` from the head script on the home page's path alone.
- **`visibility` transitions.** A discrete visibility step at the wrong end would leave the name focusable while invisible, or cut the fade. The criterion 1 test checks focus at rest after both directions.
- **Moving the course tests.** `tests/certificates.spec.ts` asserts heavily on the grid. Moved carelessly, the dialog cases could stop asserting what they did. Review compares the before and after assertions one by one.
