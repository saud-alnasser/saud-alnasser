---
use-when: "deciding how the portfolio rework's motion, disclosure, badges and page transitions are built, and what each costs in support, script and accessibility"
---

# Question

Which established, citable design and motion principles bear on a "noticeable but restrained" motion rework of this static Astro 7 portfolio (staggered load entrance, scroll reveal, card hover lift, page transitions, animated stat counters, a technology filter, technology logo badges), and what do primary platform sources say, as of September 2026, about building each with no JavaScript or minimal progressive script, specifically: (1) scanning and progressive-disclosure principles, (2) motion duration, easing and purpose, (3) WCAG 2.2 and Media Queries 5 requirements for motion and interaction, and (4) support and performance of cross-document view transitions, scroll-driven animations, @starting-style, ::details-content with interpolate-size, and the Popover API?

All sources were read on 2026-09-24. Web search was used only to locate pages. Support facts come from the webstatus.dev API (which is built on the web-features and browser-compat-data projects) and MDN's browser-compat-data repository, both read raw on that date.

Repository state read for context: `src/styles/global.css` defines one motion token, `--animate-reveal` (500ms, `cubic-bezier(0.2, 0.7, 0.2, 1)`, a translateY of 0.5rem plus opacity), used only under Tailwind's `motion-safe:` variant, and the print rules set `main { animation: none }`. `src/layouts/Base.astro` has an inline script in the head (theme and form handling) and uses `motion-safe:transition-colors` on the body and nav links. No view transition, scroll timeline, popover or details animation exists today. Installed Astro is 7.3.2.

# Sources

## Usability and visual design (NN/g, an authority's own publication)

- S1. Jakob Nielsen, "10 Usability Heuristics for User Interface Design", nngroup.com, updated 2024-01-30.
- S2. Jakob Nielsen, "Progressive Disclosure", nngroup.com, 2006-12-03.
- S3. Kara Pernice, "Text Scanning Patterns: Eyetracking Evidence", nngroup.com, 2019-08-25.
- S4. Page Laubheimer, "Executing UX Animations: Duration and Motion Characteristics", nngroup.com (animation-duration), 2020-02-09.
- S5. Page Laubheimer, "The Role of Animation and Motion in UX", nngroup.com (animation-purpose-ux), 2020-01-12.

## Motion systems

- S6. Material Design 3 motion tokens as shipped in code: `tokens/versions/v0_192/_md-sys-motion.scss` in the material-components/material-web repository on GitHub (main branch). Primary (the token source). The m3.material.io spec page itself renders client-side and returned no content to the fetcher.
- S7. Apple Human Interface Guidelines, "Motion", read through the page's own JSON data endpoint on developer.apple.com (the HTML page renders client-side). Primary.

## Accessibility

- S8. WCAG 2.2, W3C Recommendation 12 December 2024, w3.org/TR/WCAG22.
- S9. Understanding SC 2.3.3 Animation from Interactions, w3.org/WAI/WCAG22/Understanding.
- S10. Understanding SC 2.2.2 Pause, Stop, Hide, w3.org/WAI/WCAG22/Understanding.
- S11. Media Queries Level 5, W3C Working Draft dated 2026-06-29 (drafts.csswg.org/mediaqueries-5), prefers-reduced-motion.

## Platform and performance

- S12. webstatus.dev API, features: cross-document-view-transitions, view-transitions, view-transition-class, scroll-driven-animations, starting-style, details-content, interpolate-size, calc-size, popover, prefers-reduced-motion, registered-custom-properties, hidden-until-found.
- S13. MDN browser-compat-data (main branch, raw JSON): css/at-rules/view-transition, css/properties/interpolate-size, css/selectors/details-content, css/properties/animation-timeline.
- S14. MDN Firefox release notes for developers, versions 150 to 156 (mdn/content repository, raw), release dates 2026-04-21 through 2026-09-15.
- S15. Chrome for Developers, "Cross-document view transitions for multi-page applications", last updated 2024-04-14.
- S16. CSS View Transitions Module Level 2, Editor's Draft dated 2026-08-31 (drafts.csswg.org).
- S17. MDN reference pages: animation-timeline (modified 2026-09-16), ::details-content (modified 2026-04-17), @starting-style (modified 2026-04-20).
- S18. Chrome for Developers blog, "A case study on scroll-driven animations performance", 2023-07-12.
- S19. web.dev, "How to create high-performance CSS animations", updated 2020-10-06.
- S20. web.dev, "Optimize Cumulative Layout Shift", updated 2025-02-07.
- S21. web.dev, "Largest Contentful Paint (LCP)", updated 2025-09-04.
- S22. Astro docs, "View transitions" guide (docs.astro.build, and its source file in the withastro/docs repository, main branch).
- S23. Installed package `node_modules/astro` 7.3.2 in this repository: `components/ClientRouter.astro`, `components/viewtransitions.css`, `dist/transitions/router.js`.

## Logos

- S24. Simple Icons `LICENSE.md` (CC0 1.0 Universal) and `DISCLAIMER.md`, simple-icons/simple-icons repository, develop branch.

Secondary sources seen in search results and not relied on: a CSS-Tricks series on cross-document view transitions, joshwcomeau.com, several 2026 blog posts claiming cross-document view transitions are "cross-browser". The last claim is contradicted by S12 and S13 and is not used.

# Findings

## 1. Scanning and progressive disclosure

- F1. source (S3): four text-scanning patterns are named: F-pattern, spotted, layer-cake, commitment. "Aside from reading almost every word, the layer-cake pattern is by far the most effective way in which users can scan pages." Layer-cake scanning is supported by meaningful subheadings, chunked sections, bulleted lists and visually styled keywords. True of: the 2019 article, drawing on NN/g eyetracking studies.
- F2. source (S2): progressive disclosure shows "only a few of the most important options" first and "a larger set of specialized options upon request"; "the very fact that something appears on the initial display tells users that it's important"; the trigger must be obvious and clearly labelled; more than two disclosure levels "typically" hurts usability. True of: the 2006 article, written about application features rather than content pages.
- F3. source (S1): heuristic 1, Visibility of system status (feedback "within a reasonable amount of time"); heuristic 4, Consistency and standards ("follow platform and industry conventions"); heuristic 8, Aesthetic and minimalist design ("Interfaces should not contain information that is irrelevant or rarely needed").
- F4. interpretation: F1 and F2 bear on the filter and on any collapsed content. A filter by technology is a disclosure mechanism; F2's "obvious trigger, clear label" and heuristic 1 apply to its state (which filter is active, how many results). That is an inference; NN/g's filter-specific articles were not read.

## 2. Motion: duration, easing, purpose

- F5. source (S4): about 100ms for simple feedback (toggles, checkboxes); 200 to 300ms for substantial screen changes such as modals; a general range of 100 to 400ms; "At 500ms, animations start to feel like a real drag for users". Seek "the shortest time that an animation can take without being jarring". True of: the 2020 article, stated as practitioner guidance rather than a cited study.
- F6. source (S5): four purposes of UI animation: feedback, communicating state change, spatial navigation, signifying interaction. Animation should be "unobtrusive, brief, and subtle"; irrelevant motion "can substantially degrade the user experience".
- F7. source (S6): Material 3 duration tokens run short1 to short4 = 50, 100, 150, 200ms; medium1 to medium4 = 250, 300, 350, 400ms; long1 to long4 = 450 to 600ms in 50ms steps; extra-long1 to extra-long4 = 700 to 1000ms. Easing tokens: standard `cubic-bezier(0.2, 0, 0, 1)`, standard-decelerate `cubic-bezier(0, 0, 0, 1)`, standard-accelerate `cubic-bezier(0.3, 0, 1, 1)`, emphasized-decelerate `cubic-bezier(0.05, 0.7, 0.1, 1)`, emphasized-accelerate `cubic-bezier(0.3, 0, 0.8, 0.15)`, legacy `cubic-bezier(0.4, 0, 0.2, 1)`. True of: token file version v0_192 in material-web.
- F8. source (S7): Apple HIG: "Add motion purposefully, supporting the experience without overshadowing it"; gratuitous motion "may make them feel disconnected or physically uncomfortable"; "Make motion optional", and do not use motion "as the only way to communicate important information".
- F9. observation: the existing `--animate-reveal` is 500ms, which sits at S4's stated upper edge and at Material's long2. Its curve `cubic-bezier(0.2, 0.7, 0.2, 1)` is a decelerating curve close in shape to Material's emphasized-decelerate; it is not one of S6's tokens.
- F10. not found: Material's per-transition usage guidance (which token for enter versus exit, for which distance) lives on m3.material.io, which did not render. It is not reported here. Whether Material 3's newer "expressive" spring-based motion supersedes these easing tokens was not checked.

## 3. Accessibility requirements

- F11. source (S8, S9): SC 2.3.3 Animation from Interactions, Level AAA: "Motion animation triggered by interaction can be disabled, unless the animation is essential". Motion animation excludes colour, opacity and blur changes that do not change perceived size, shape or position. Parallax where decorative elements move while content scrolls is given as a failure example. Technique C39, "Using the CSS prefers-reduced-motion query to prevent motion", is listed as sufficient.
- F12. interpretation: under F11's definition, scroll reveal with translation, hover lift (translate or scale), and page transitions that slide are "motion animation triggered by interaction" (scrolling, hovering, navigating). An opacity-only fade is outside the definition. This follows from the definition text; the Understanding page does not name hover lifts specifically.
- F13. source (S10): SC 2.2.2 Pause, Stop, Hide, Level A, covers moving content that "starts automatically, lasts more than five seconds, and is presented in parallel with other content". interpretation: a load entrance or count-up that finishes well under five seconds falls outside it; a looping or long-running animation would not.
- F14. source (S8): 1.4.3 Contrast (Minimum), AA, 4.5:1 for text; 1.4.11 Non-text Contrast, AA, 3:1 for UI components and graphical objects needed to understand content; 2.4.7 Focus Visible, AA; 2.4.11 Focus Not Obscured (Minimum), AA, the focused component is "not entirely hidden due to author-created content"; 2.5.8 Target Size (Minimum), AA, at least 24 by 24 CSS pixels, with exceptions for spacing, equivalent controls, inline targets, user-agent controls and essential presentation.
- F15. interpretation: F14 bears on the rework as follows. Filter chips are targets (2.5.8) and need a visible focus state (2.4.7). A logo badge that carries meaning (identifying the technology) is a graphical object under 1.4.11 in both themes, unless the technology name is also given as text, in which case the logo is arguably decorative. A card that lifts and gains a shadow on hover still needs its focus state on keyboard focus, since hover does not fire for keyboard users. A sticky header can obscure focused elements after scroll (2.4.11).
- F16. source (S11): prefers-reduced-motion takes `no-preference` or `reduce`; `reduce` means the user "prefers to minimize the amount of motion", asking authors to limit animations and transitions. Support (S12): Baseline widely available since 2022-07-15 (Chrome 74, Firefox 63, Safari 10.1).

## 4. Platform support and behaviour (as of 2026-09-24)

### Cross-document view transitions

- F17. source (S12, S13): Chrome and Edge 126 (June 2024), Safari and Safari iOS 18.2 (2024-12-11). Firefox: not supported. Baseline status "limited". MDN BCD lists `@view-transition` Firefox as false. Firefox's stable WPT score for the feature is about 5 percent.
- F18. source (S14): Firefox release notes 150 to 156 (the last released 2026-09-15) contain no entry shipping cross-document view transitions, neither as a default nor in their experimental lists.
- F19. source (S12): same-document view transitions (Level 1) and `view-transition-class` became Baseline newly available on 2025-10-14 with Firefox 144. This is a different feature from F17; it needs `document.startViewTransition()` from script.
- F20. source (S15, S16): the opt-in is CSS only, `@view-transition { navigation: auto; }`, on both pages; it requires same origin; it fires for traverse (back and forward) and for push or replace navigations not started from browser UI (not the URL bar, bookmarks or reload); transitions longer than four seconds are aborted. No script is needed. Optional script hooks are the `pageswap` and `pagereveal` events; a `pagereveal` listener must be registered before first render. `<link rel="expect" blocking="render" href="#id">` holds rendering until an element is parsed. S16 is an Editor's Draft dated 2026-08-31.
- F21. observation (S16, S15): neither the spec nor the Chrome guide says the browser suppresses the transition under reduced motion. interpretation: honouring `prefers-reduced-motion` for a native cross-document transition is the author's CSS to write, for example by setting the view transition pseudo-elements' animation to none inside the media query. That the default is not suppressed is inferred from absence; no browser documentation stating it either way was found.
- F22. interpretation: in a browser without support, the navigation is an ordinary page load, so the page is unchanged in content. This follows from F20 being purely a CSS opt-in; not tested here.

### Astro 7 and its ClientRouter

- F23. source (S22): Astro supports native cross-document view transitions, which "don't alter the core functionality of a multi-page application, nor do they affect any existing scripts or add additional JavaScript". `<ClientRouter />` instead intercepts same-origin link clicks and form submits and turns the site into client-side routing, adding `transition:persist`, fallback animation for unsupported browsers (`animate`, `swap`, `none`), and lifecycle events such as `astro:page-load`. Bundled module scripts run once only; inline scripts may re-run. The ClientRouter "disables all view transition animations, including fallback animation" under prefers-reduced-motion (S23 confirms a reduced-motion media query in `viewtransitions.css`).
- F24. observation: bundling the installed Astro 7.3.2 `dist/transitions/router.js` with esbuild (minified, ESM, Astro virtual modules left external) gives about 12.5 KB minified, about 4.6 KB gzip. interpretation: this is an estimate of the router's weight, not a measurement of a real Astro build, which also includes the component's inline script. Astro's docs give no size figure.
- F25. interpretation: `Base.astro` carries an inline head script. Under ClientRouter, F23's lifecycle rules would apply to it and to any page script; under native cross-document transitions nothing about script execution changes.

### Scroll-driven animations (animation-timeline: view())

- F26. source (S12, S13): Chrome and Edge 115 (July 2023), Safari and Safari iOS 26 (2025-09-15). Firefox: not shipped; BCD marks it "preview". Baseline "limited". Firefox stable WPT about 10 percent, experimental about 92 percent.
- F27. source (S14): Firefox 151, 152 and 155 release notes list scroll-driven animation work under "Experimental web features", behind `layout.css.scroll-driven-animations.enabled`, "disabled by default". Firefox 156 (2026-09-15) lists no change. So as of 2026-09-24 it is off by default in Firefox release.
- F28. source (S17): `animation-timeline` is reset by the `animation` shorthand, so it must be declared after it; with a scroll timeline, duration does not govern progress. `view()` progresses from 0 percent when the element starts entering the scrollport to 100 percent when it has fully left. MDN shows `@supports (animation-timeline: ...)` as the detection pattern.
- F29. interpretation: an entrance keyframe that starts at opacity 0 and is applied without an `@supports` guard would, in a browser lacking `animation-timeline`, run as an ordinary time-based animation. Whether that leaves the content visible depends on its duration and fill mode. A guard means unsupported browsers show content statically. This is reasoning from F28 and CSS Animations behaviour; it was not tested in Firefox.
- F30. source (S18): in Chrome's case study, a CSS `animation-timeline` animation stayed smooth while the main thread was busy, where a scroll-event JavaScript version became "janky and sluggish". The example animates a transform. True of: Chrome, 2023. The article does not list which properties stay off the main thread.

### @starting-style

- F31. source (S12): Baseline newly available since 2024-08-06: Chrome 117, Safari 17.5, Firefox 129.
- F32. source (S17): it sets the values a transition starts from when an element receives its first style update, or goes from `display: none` to shown; paired with `transition-behavior: allow-discrete` for `display` and overlay; used for popover and dialog entry. It concerns transitions only; keyframe animations do not need it.
- F33. open: whether @starting-style applies to elements present in the initial HTML at first page render (useful for a CSS-only load entrance) was not confirmed from the CSS Transitions Level 2 text. MDN's wording ("first displayed on a previously loaded page") is ambiguous on this.

### details and ::details-content, interpolate-size

- F34. source (S12, S13): `::details-content` is Baseline newly available since 2025-09-16: Chrome 131, Safari 18.4, Firefox 143. MDN's example transitions opacity plus `content-visibility ... allow-discrete` on it.
- F35. source (S12, S13): `interpolate-size` and `calc-size()` (needed to animate height to or from `auto`) are Chrome and Edge 129 only; Safari and Firefox false; Baseline "limited"; BCD marks `interpolate-size` experimental. Mozilla's standards position is "positive"; WebKit's has no recorded position.
- F36. interpretation: without `interpolate-size`, a `details` element still opens and closes; only the height animation is absent (it snaps). Content inside a closed `details` is in the HTML and needs no script to reach. `hidden="until-found"` (for find-in-page on hidden content) is Chrome 102 and Firefox 148, not Safari (S12), and is a separate mechanism from `details`.

### Popover API

- F37. source (S12): Baseline newly available since 2025-01-27: Chrome 116, Firefox 125, Safari 17, Safari iOS 18.3. It is declarative (`popover` plus `popovertarget` on a button), so it opens without script, and combines with F32 for entry transitions. interpretation: content placed in a popover is hidden until the user activates it; F2's disclosure guidance applies to what goes there.

### Performance and Core Web Vitals

- F38. source (S19): "restrict animations to opacity and transform to keep animations on the compositing stage"; animating `top`, `left`, `width`, `height` or shadows triggers layout or paint; use `will-change` only for observed problems.
- F39. source (S20): "Composited animations using translate can't impact other elements, and so don't count toward CLS"; animating `top` and `left` causes layout shifts; `box-shadow` changes trigger layout, paint and composite. Shifts within 500ms of user input are excluded from CLS.
- F40. source (S21): "Elements with an opacity of 0, that are invisible to the user" are not LCP candidates. interpretation: if the page's largest element (a hero heading or image) starts an entrance animation at opacity 0, its LCP time moves to when it first paints above zero opacity, which a staggered delay pushes later. Lighthouse's mobile profile would record that. This is inferred from the definition; not measured on this site.
- F41. interpretation: a hover lift using `transform` plus a `box-shadow` change: the transform is compositor-only (F38) and does not count for CLS (F39); the shadow change repaints. Animating the opacity of a pseudo-element that carries the shadow is the commonly cited workaround; no primary source for that pattern was read.

### Animated counters

- F42. source (S12): registered custom properties (`@property`) are Baseline newly available since 2024-07-09 (Chrome 85, Safari 16.4, Firefox 128). interpretation: a CSS-only count-up can animate a registered integer property shown through `counter()` in generated content. Generated content is not reliably exposed to assistive technology or selectable, which is why such counters usually keep the real number in the HTML and animate only a visual layer, or use script that starts from the final number already in the markup. No primary source on screen-reader treatment of CSS counters in 2026 was read; this stays an open point.

## 5. Technology logos

- F43. source (S24): the Simple Icons repository licence is CC0 1.0, which states "No trademark or patent rights held by Affirmer are waived". The disclaimer adds: "Simple Icons is released under CC0 - though that doesn't mean to imply that all icons within the project are also CC0. Please see individual licenses where available." Per-icon `license` and `guidelines` fields are in the npm package's JSON data; their absence does not mean an icon has no licence or a brand has no guidelines. "Simple Icons cannot be held responsible for any legal activity raised by a brand" and users should "seek the correct permissions". Brand guidelines should be read for each logo used.
- F44. interpretation: the brief's premise, "CC0 for the set, while trademarks remain the owners'", matches the licence text but understates the disclaimer: the set's code and data are CC0, individual icons may carry other licences, and each brand's guidelines (colour, alteration, placement) apply separately. Bundling SVGs at build time adds no external request.

# Conclusion

Principles: NN/g supports layer-cake scanning (clear headings, chunked sections) and two-level progressive disclosure with obvious, labelled triggers (F1 to F3). Motion guidance converges on brief, purposeful motion: 100 to 400ms, 500ms as the upper edge, decelerating curves for entry, and motion never the only carrier of information (F5 to F8). Material 3's token values are confirmed from its code; its per-use guidance was not read (F10).

Accessibility: translation-based reveal, hover lift and sliding page transitions are "motion animation" under SC 2.3.3 (AAA), met by prefers-reduced-motion (F11, F12); short one-off animations fall outside SC 2.2.2 (F13); filter chips, badges and cards touch 1.4.11, 2.4.7, 2.4.11 and 2.5.8 (F14, F15).

Platform, as of 2026-09-24: @starting-style, ::details-content, Popover, prefers-reduced-motion and @property work in all three engines (F16, F31, F34, F37, F42). Cross-document view transitions and scroll-driven animations work in Chromium and Safari but not in Firefox release; both are CSS-only and degrade to no animation where unsupported, given a guard for scroll-driven entrances (F17 to F22, F26 to F29). interpolate-size is Chromium-only (F35). Native cross-document transitions ship no script; Astro's ClientRouter ships an estimated 4.6 KB gzip router and changes script lifecycle (F23 to F25). Compositor-only properties avoid CLS; an opacity-0 start on the LCP element delays LCP (F38 to F40). Simple Icons is CC0 as a project, with per-icon licences and brand guidelines still to check (F43, F44).

Confidence: high for support facts (two independent primary datasets agree, plus Firefox release notes), WCAG text and NN/g figures; medium for the interpretations marked as such; low for F33 and the counter accessibility point in F42.

# Not checked

- m3.material.io usage guidance (which duration and easing for enter, exit, hover), and whether Material 3 Expressive's spring motion replaces the easing tokens. The page did not render.
- Apple HIG guidance beyond the "Best practices" section; no specific duration values were found there.
- CSS Transitions Level 2 spec text on whether @starting-style applies at initial page load (F33).
- Screen-reader exposure of CSS `counter()` output in current browsers (F42).
- Whether any browser suppresses cross-document view transitions under reduced motion by default (F21); inferred from absence only.
- No behaviour was tested in a browser; F22, F29, F36 and F40 are reasoning from the sources, not observations on this site.
- Lighthouse's own treatment of view transitions and scroll-driven animations in its mobile profile was not researched.
- Firefox Nightly and Beta release dates for enabling scroll-driven animations by default; Interop 2026 focus-area listings were seen only through a search snippet and are not cited.
- Individual Simple Icons licence and guidelines entries for the specific technologies the site would show.
- NN/g articles specific to filters and faceted navigation.
