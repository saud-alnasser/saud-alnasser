---
use-when: "building a ticket in effort 33, the portfolio as one page, and the approach is not obvious from the spec"
---

# Architecture

The site stays static Astro with its one inline script (`src/layouts/Base.astro`). The home page, `src/pages/[locale]/index.astro`, becomes the whole portfolio. It is built from the same components the three pages use now, moved in rather than rewritten. The work and education routes stay as files, but each renders a forwarding page of its own and no longer uses the shared layout. The header becomes a sticky bar. Its links point at the home page's section anchors on every page, and one new function in the inline script handles the glide, the current-section mark, and closing the phone menu.

The requirements are [[efforts/33-one-page-portfolio/spec]]'s. This file says how.

## The decisions, and what lost

**Forwarding the old addresses** (requirement 8). Saud chose on 2026-09-24.

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **A page per old address with a meta refresh to one section, no script (chosen)** | Works with no script; keeps the one-script rule; nothing to map | An old anchor lands on the section's top, not its heading | none beyond a crawler reading the canonical | four small generated pages, gone whenever Saud decides the old links no longer matter |
| The same, plus a script mapping the old anchor | every old anchor lands exactly | a second script on the site; a map of old anchors to keep | the map drifts from the headings | the map, for as long as the pages exist |
| Astro's `redirects` config | one line per address | its static output sits under the base in ways the root redirect already needed `joinBase` for, and it offers no hook for the sitemap | a dynamic `[locale]` source with a fragment in the target is untested here | low |

The evidence behind the choice is [[efforts/33-one-page-portfolio/evidence/prototypes/meta-refresh-drops-the-fragment]].

**Moving to a section** (requirement 4). Saud chose on 2026-09-24. The script glides the page in 350ms on `--ease-enter`, over the browser's `scroll-behavior: smooth`, which picks its own speed and curve and so runs off the tokens, and over a plain jump.

**Which section is current** (requirement 4). Decided here. The choice is an internal mechanism, and one option wins outright.

| | Advantages | Disadvantages | Risks | Maintenance |
| --- | --- | --- | --- | --- |
| **Read the headings' positions on scroll, one read per animation frame (chosen)** | deterministic: the current section is a pure function of the scroll position, so a test can assert it in the same frame | runs on every scroll frame, which is five `getBoundingClientRect` calls | none measurable at five sections | one function |
| An `IntersectionObserver` with a band under the header | no work between crossings | fires asynchronously and only on crossings, so a jump across a short section can leave the wrong one marked, and the foot of the page needs a special case anyway | flicker between two short sections, the spec's named risk | a band to tune |

**Reaching the last section** (requirement 5). Decided here. The last section on the home page gets a minimum height of the viewport less the header, so its heading can always scroll to the top. The alternative, padding at the foot of `main` on every page, would add empty space to the CV and resume, which have no in-page links.

# Components

- **`src/pages/[locale]/index.astro`** holds the sections, in the spec's order.
  - **About** is the first screen as it is, less the monogram. The `h1` carries `id="about"`.
  - **Experience** and **Projects**, with the featured card, the filter, and the grid, move in from `work/index.astro` with their markup and sorting unchanged.
  - **Education**, with the studies timeline, the courses, and the certifications, moves in from `education/index.astro`. Its subsections take `h3` headings with ids `courses` and `certificates`, and the certificate cards step down to `h4`.
  - **Skills** stays where it is and becomes last.
  - The journey section and the section-card grid go.
  - Every section is a `<section aria-labelledby>` whose heading carries its anchor id and `data-section`.
- **`src/pages/[locale]/work/index.astro` and `education/index.astro`** each render the new `Forward` component with their target: `#experience` and `#education`.
- **`src/components/Forward.astro` (new)** is a complete document without the layout, containing:
  - `lang` and `dir`;
  - a title naming the section;
  - `<meta http-equiv="refresh" content="0;url=…">`;
  - `<link rel="canonical">` to that language's home page;
  - `<meta name="robots" content="noindex">`;
  - one visible link to the target for a browser that ignores the refresh.

  It has no script and no stylesheet.
- **`src/layouts/Base.astro`, the header.**
  - A sticky bar, `position: sticky; top: 0`, a fixed height from a new `--header-height` token, the page background, and a bottom border. The `site-header` view-transition name stays.
  - The row holds, in order: the name, linking to the home page's top; the five section links, as `<a data-section-link href="{home}#{id}">`; the two documents, grouped under a labelled `<ul>` with the file icon and a divider before them; and the two controls. The old per-page `nav` array goes.
  - Below `lg` the section and document links collapse into the new `SiteMenu`. That breakpoint is an estimate, not a measurement. Five links, two documents, and two controls come to about 850 pixels in English, which does not fit a row at `md`. The ticket confirms it in Arabic, and moves to `xl` if Arabic runs longer.
  - On the CV and resume, the section links point at the home page, and the current mark sits on the document's own link with `aria-current="page"`.
- **`src/components/SiteMenu.astro` (new)** is a `<details data-site-menu>` in the language menu's pattern:
  - a summary with the menu icon, an accessible name from `t.nav.menu`, and the expanded state the element exposes natively;
  - a panel under the header's full width, listing the sections, then the documents.
- **The inline script.** A new `sections()`, plus a widened `dismiss()`.
  - `sections()` runs only where `[data-section]` headings exist.
    - It computes the current section as the last heading whose top is at or above the header's bottom plus 8 pixels, falling back to the first. It writes `aria-current="location"` on the matching links, in the bar and the menu, and removes it from the others.
    - A passive scroll listener runs this once per animation frame, and it runs once at load.
    - On a plain left click on a `data-section-link` whose target is on this page, it cancels the navigation and glides `window.scrollTo` from the current position to the heading's top less `--header-height`, over 350ms through the existing `enter()` solver. Then it calls `history.pushState` with the hash and moves focus to the heading (given `tabindex="-1"`) without scrolling. Under reduced motion it scrolls in one step, then does the same. A modified click is left alone.
    - It closes an open site menu on a link press.
  - `dismiss()` closes whichever of `[data-language-menu][open]` and `[data-site-menu][open]` is open, on Escape (returning focus to its summary) or an outside press.
- **`src/styles/global.css`.**
  - `--header-height`: 3.5rem on a phone, 4rem from `lg`.
  - `html { scroll-padding-top: var(--header-height) }`, so a jump with no script also clears the bar.
  - The minimum height for `main > section:last-child` on the home page.
  - The current-link bar keyed on `[aria-current]`, both values.
- **`src/lib/timeline.ts`.** `educationTimeline` returns its items newest first: it builds exactly as now, then reverses. `journey()` and its type go with the journey.
- **`src/lib/order.ts`** gains `byDateDescending`, with the undated last. The courses grid reads it.
- **`src/components/CvDocument.astro`** sorts the resume's institutions with `byStartDescending`. The CV reads the reversed timeline unchanged.
- **Removed:** `Monogram.astro`, `Journey.astro`, `SectionCard.astro`, and the strings only they read.
- **`src/lib/i18n.ts`** adds `nav.about`, `nav.experience`, `nav.projects`, `nav.skills`, `nav.menu`, `nav.documents`, and `forward.title`, in both languages. It removes `home.sections` and the section-card descriptions, `journey`, and `pages.work` and `pages.education` once nothing reads them.
- **`astro.config.mjs`** passes `sitemap({ filter })`, dropping the four forwarding addresses.

# Interfaces

- **Addresses.** `/{locale}/` gains the anchors `about`, `experience`, `projects`, `education`, and `skills`. `courses`, `certificates`, and every entry's own id (`project-…`, `experience-…`, `education-…`) keep their names and move to this page. `/{locale}/work/` and `/{locale}/education/` become forwarding pages.
- **`educationTimeline(education, courses)`**: same signature, reversed output. Every caller is listed under Integration.
- **`Certificate.astro`** gains a `level` prop, defaulting to `3`. The home page passes `4`.

# Technical Approach

The order is chosen so that each step leaves the build and the suite green.

1. **Newest first.** `timeline.ts`, `order.ts`, the CV, the education page as it still stands, the dist check's expectation, and the unit tests. Independent of everything else.
2. **One page.** Move the sections into the home page, and remove the monogram, the journey, and the grid. Turn the two routes into `Forward`, and filter the sitemap. Move the tests and the dist check to the one page in the same step, because the old pages stop existing in it.
3. **The header.** The sticky bar, `SiteMenu`, the section links, `scroll-padding`, and the last section's height. The links work with no script at this point.
4. **The script.** `sections()` and the widened `dismiss()`, with their tests.
5. **Converge.** `docs/development.md`, `src/content/README.md`, and `.aep/contexts/repository.md` name three pages and the journey today.

Step 2 depends on step 1 only in that both touch the education markup, so they can be serialised. Step 4 needs step 3's markup.

# Integration

What reads the education timeline or the pages being removed:

- `scripts/check-dist.mjs`. It derives routes from `dist`, so it will now meet four forwarding pages. It needs a rule that recognises one by its refresh and checks it for the target, the canonical link, and no script, in place of the page checks. Its education expectations flip.
- `scripts/test-content-mechanism.mjs`. Its fixtures name `work/index.html` and `education/index.html` as the outputs they change, and its featured check reads the work page. All of them move to the home page's `index.html`.
- `tests/pages.ts`: `routes` becomes `/`, `/cv/`, and `/resume/`, with a separate list of forwards.
- Every browser suite that visits `/work/` or `/education/`: work, education, certificates, home, layout, contrast, motion, and periods. They move to `/` and scope their locators to the matching `section`.

# Migration

Nothing at rest changes. The four forwarding pages are the migration for anyone holding an old link. They go when Saud decides the old links no longer matter, which is a later effort.

# Testing Strategy

| Criterion | Checked by |
| --- | --- |
| 1 | `tests/timeline.test.mjs`, on two-institution fixtures in the new direction. The education and resume suites build the expected order from the content through `educationTimeline`. The courses grid order goes in `certificates.spec.ts`. The dist check's CV reading order. |
| 2 | `home.spec.ts`: no `[data-monogram]` element, and the `h1` is the first element in `[data-hero]`. |
| 3 | A new `tests/navigation.spec.ts` checks the five headings, their ids and order, and each heading's `section[aria-labelledby]`. The moved work and education suites assert every entry renders on `/`. The dist check asserts no journey and no section grid. |
| 4, 5 | `navigation.spec.ts`, at 1440 by 900 and 390 by 844, both languages. It presses each link from the top and from the foot. The heading must sit within 24 pixels under the header's bottom, and exactly that link must carry `aria-current`. The header stays in view at the foot. The links on the CV and resume point at `/{locale}/#{id}`. It runs under the suite's default reduced motion. `motion.spec.ts` opts in and samples `scrollY` mid-glide and at 400ms. |
| 6 | The document suites as they stand, plus a header assertion on every page. |
| 7 | `menu.spec.ts` grows: at 360 by 740 the header is one row, the button has a name and an expanded state, the panel lists seven links, and a link press, Escape, and an outside press each close it. With script off it opens and navigates. `layout.spec.ts` keeps its no-horizontal-scroll check. |
| 8 | The dist check reads each forwarding page's refresh, canonical, and absence of any script. A browser test opens each address, bare and with an old anchor, and checks the section heading is in view. The dist check also asserts the sitemap lists no forward. |
| 9 | The whole existing suite, with selectors moved and assertions kept, which review compares suite by suite. Lighthouse in CI on the pages the gate runs, the forwards excluded. |
| 10 | The existing strings check, plus a grep over `src` for the removed keys. |

# Technical Risks

- **The home page's Lighthouse score drops.** It now carries every card and the certificate dialog. It would show first in the CI Lighthouse job. Mitigation: nothing lazy is needed today, since the cards carry no images, but the step 2 ticket runs Lighthouse locally before it closes.
- **The sticky bar covers a focused element.** A keyboard user tabbing upward could land under the bar. `scroll-padding-top` covers focus scrolling in Chromium. Checked in `navigation.spec.ts` by tabbing back from the foot.
- **The reveal hides a heading the glide lands on.** A heading marked `data-reveal` and not yet revealed is translated. The glide measures the heading's layout box through its section, not the translated heading, so the landing does not depend on the reveal.
- **The view transition names.** The sticky header keeps `site-header`, and a crossfade between home and a document keeps the bar still. `motion.spec.ts` already covers this.
