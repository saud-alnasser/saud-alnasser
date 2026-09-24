---
status: implemented
priority: high
---

# Problem

Saud read the one-page portfolio of [[efforts/33-one-page-portfolio/spec]] on 2026-09-24 and named seven things that still read wrong.

- **The name is printed twice at the top.** The header's home link is the name, and the first screen's heading directly under it is the same name. The footer prints it a third time, alone, with nothing else a footer usually carries.
- **A card says less than it could.** A project card shows its first five technologies and folds the rest behind a control. Mudaraj names seven, so its card ends in "Show 2 technologies" while every other card has no such control. The control costs a press to reveal two short chips.
- **The skills are not all his.** The skill groups were written from the courses and the resume, not from the code. Read against the manifests in his GitHub repositories on 2026-09-24, they miss tools every shown project depends on (tRPC, Zod, Vite, Vitest, SQLite through Turso), and they carry names only a course backs (C#, and the practices Design patterns, Refactoring, Data structures, and Unit testing, from the Code with Mosh certificates).
- **Many badges have no logo.** Rust, TypeScript, and JavaScript carry their marks and Saud likes them. Other names are plain text, some because Simple Icons lacks them, some because the licence rule of [[efforts/31-portfolio-rework/spec]] refused them, and some only because nobody mapped them.
- **The courses are shown twice.** The education timeline's "Online courses" card counts the courses and links to the grid of 26 course cards directly under it. The card and the grid say the same thing one screen apart, and the grid is the longest block on the page.
- **Weak projects dilute the strong ones.** Three course assignments (the CPU scheduling simulator, the personal information form, and CourseViewer) and two tutorial follow-alongs (godot-brackeys-simple-platformer and learning-rust) sit in the grid beside rentable and Mudaraj. Saud judged on 2026-09-24 that they are simple and add no value.
- **The in-progress work stays hidden.** nexuscord, Nova, and ETG are his largest work and are marked in progress. Asked on 2026-09-24, Saud chose not to show work that might never be finished. This effort records that and changes nothing about it.

# Goal

The name appears once on screen at a time. Every card shows its whole stack. The skills name what his repositories show he has used, each backed by an entry on the page. More badges carry a mark, and none carries a mark its owner does not allow. The courses are reached from the timeline without being listed twice. The project grid holds only work worth a reader's time.

# Scope

- The header's home link and the footer, in `src/layouts/Base.astro`.
- The project card's technology row, in `src/components/Project.astro`.
- The skill groups under `src/content/skills/`, and the technologies of the shown projects under `src/content/projects/` where the repository's manifest shows a tool the entry does not name.
- The mark mapping in `src/lib/technologies.ts`, its licence test, and the badge's fallback for a name with no mark.
- The education timeline's online-courses node and the courses grid on the home page.
- Five project entries set to `hidden`.
- The strings, tests, checks, and documents that name any of the above.

# Requirements

1. **The name once.** On the home page, the header's home link shows the name only once the first screen's heading has scrolled out of view, and hides it again when the heading returns. While hidden it takes no focus and is not exposed to assistive technology. With script off, under reduced motion, and on the CV and resume pages, the name shows as it does today. Where motion is allowed it fades on the site's motion tokens. (Saud chose this on 2026-09-24 over a monogram, over keeping the name, and over the word "Portfolio".)
2. **A footer that is a footer.** The footer reads "© <year> Saud Alnasser", then links to each profile the profile lists and to the site's source repository, then the logo credits it already folds. The year is the build's year. The name comes from the profile, and the profiles from `profiles`, so nothing is written twice.
3. **The whole stack on every card.** A project card shows every technology its entry names, as badges, with no fold and no count. The featured card already does.
4. **Skills from the code.** The skill groups are rewritten from the dependencies in Saud's GitHub repositories, read on 2026-09-24. Every keyword meets the rule of [[efforts/21-languages-and-honest-skills/spec]], requirement 8: a shown entry on the page names it or plainly used it. A tool a shown project depends on and does not name is added to that project's technologies, so the rule holds by what the page itself shows. On today's evidence that adds tRPC, Zod, Vite, Vitest, and SQLite where the manifests show them, and it removes Java, GDScript, and Godot, whose only backing leaves with requirement 7. Two readings were settled by Saud on 2026-09-24:
   - **Hidden work backs no skill.** Lua, FiveM, SolidJS, Tokio, Axum, Fly.io, and WebAssembly are used only in hidden projects, so none is added, and SolidJS, listed today, leaves. The keyword rule stands as written.
   - **The course-backed names stay.** C#, Docker, Design patterns, Refactoring, Unit testing, and Data structures remain, backed by their certificates as the rule allows. Data structures becomes "Data structures and algorithms", in his words.
   - **"Bytecode virtual machines" leaves.** Saud decided at review on 2026-09-24. Its only witness among shown projects was monkey-lang, which runs an interpreter over a basic-block representation and has no bytecode.
5. **More marks, within the licence rule.** Every technology name the site shows is mapped to its Simple Icons mark where one exists and the rule of `src/lib/technologies.ts` allows it. Candidates checked on 2026-09-24 against the installed package: Astro, Vite, Vitest, tRPC, Zod, SQLite, and Markdown carry no restricting licence or guidelines, or MIT or CC0. Lua, Turborepo, and Fly.io record guidelines that must be read first. Tauri, Node.js, PostgreSQL, and npm stay refused for the reasons already recorded. Java, C#, and SvelteKit are absent from the set. A name with no allowed mark shows a neutral glyph from the site's own icon set, the same for every such name, so each row of badges reads as one kind of thing. No badge shows another product's mark.
6. **The courses inside the timeline.** The timeline's online-courses node opens in place to list every course, newest first with the undated last, each item opening its certificate in the page's dialog as a course card does today. The separate courses grid goes. The certifications grid stays, shown only while a certification exists. The `#courses` anchor still lands on the node. With script off the node still opens, because it is a native disclosure, and each course still links to its PDF. (Saud chose this on 2026-09-24 over dropping the node and over no change.)
7. **Five projects off the page.** The CPU scheduling simulator, the personal information form, CourseViewer, godot-brackeys-simple-platformer, and learning-rust are set to `visibility: hidden`. They leave every output, the CV and `resume.json` included, because `src/lib/shown.ts` decides that once. The files stay, so restoring one is a one-line change. PL/0, advent-of-code, and leetcode stay.
8. **In-progress work stays hidden.** Nothing about showing a project whose `status` is `in-progress` changes.
9. **Nothing earlier efforts guarantee is lost.** Both languages with Arabic mirrored, both themes, content readable with script off, no request to another origin, the reduced-motion rules, the filter, the certificate dialog, the count-up, the header's section tracking, and the quality gates all hold.
10. **The resume is still one page.** The key skills print on both documents, so the rewritten groups must leave the resume at one page in both languages on A4 and Letter, published and filled, with the headroom `pnpm render:pdf` enforces.
11. **Strings in both languages.** Every new interface string exists in `src/lib/i18n.ts` in both languages, strings for removed surfaces go, and the Arabic is a draft until Saud reads it.

# Acceptance Criteria

1. At 1440 by 900 and 390 by 844, in both languages, a test on the home page finds the header's name hidden, unfocusable, and absent from the accessibility tree at the top. It finds it visible after scrolling past the heading, and hidden again after scrolling back. With JavaScript disabled and on `/en/cv/` it is visible at the top.
2. The footer on every page begins "©", the build's year, and the profile's name, and links every profile in `profile.yaml` and the repository. The logo credits disclosure lists every mark the site draws whose licence asks for credit, and no mark the site does not draw. (Reworded at review on 2026-09-24. The footer stopped crediting Godot once nothing drew its mark.)
3. No project card in the build output contains a fold. Every project card's badge count equals the length of its entry's `technologies`.
4. `src/content/README.md` still states the keyword rule. A check, in the content test or the dist check, finds every skill keyword named in the technologies of a shown project or backed as the rule allows, and fails naming the keyword otherwise. None of Java, GDScript, Godot, or SolidJS appears in a skill group, and C#, Docker, Design patterns, Refactoring, Unit testing, and "Data structures and algorithms" do.
5. `tests/technologies.test.mjs` passes against the new mapping. Every name mapped to a mark with recorded guidelines has an entry in `guidelines`. Every badge in the build output contains exactly one inline `<svg>`, either the mark or the neutral glyph. The dist check still finds no request to another origin.
6. The home page has no `data-grid="courses"`. The online-courses node is a disclosure whose list holds one item per course, in the courses' existing order. Pressing an item opens the dialog with that certificate. With JavaScript disabled the disclosure opens and each item links to its PDF. A link to `#courses` opens on the node.
7. The five entries carry `visibility: hidden`. None of their names appears in `dist/`. The stat tiles' project and technology counts equal what the page renders.
8. `git diff` on `src/lib/shown.ts` is empty.
9. `pnpm check`, `pnpm build` with no growth in the gap report, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm lighthouse` at 90 or above on the mobile profile all pass. The existing suites have their selectors moved, not their assertions weakened.
10. `pnpm render:pdf` writes both resumes and their filled copies at one page on A4 and Letter, each with at least the free space the script requires, and the measured number goes in the commit.
11. The strings check finds every new string in both languages and none left for the removed courses grid or the card's technology fold.

# Constraints

- **The licence rule holds.** [[efforts/31-portfolio-rework/spec]] requires that a mark be used only where its licence and its owner's guidelines allow, and `tests/technologies.test.mjs` enforces it. Wanting more logos does not relax it, and a mark is never borrowed from another product.
- **The keyword rule holds.** A skill keyword names something a shown entry backs. It is Saud's rule of 2026-09-11, and it is why the problem of a skill no entry backs is solved by adding the backing tool to a project entry, never by listing a skill bare.
- **One inline script, progressive.** The header name's fade joins the one script in `src/layouts/Base.astro`, and every page reads whole without it.
- **The content contract does not change.** No schema field is added. The changes are content values, components, and the mapping.

# Out of Scope

- Showing in-progress projects in any form. Saud declined on 2026-09-24, because work that may never be finished should not stand beside finished work.
- A monogram or logo in the header, which Saud declined on 2026-09-24. [[efforts/33-one-page-portfolio/spec]] removed the first screen's monogram for the same repetition.
- Screenshots or images for projects, an Open Graph image, and any new section.
- Changing which projects the resume carries.
- Removing PL/0, advent-of-code, or leetcode, which Saud kept.
- Drawing a mark for a name Simple Icons lacks from any other source.

# Assumptions

- The build's year is the right year for the copyright line. The site is rebuilt on every push, so it is current whenever the content changes.
- Adding a tool to a project's technologies because the project's manifest depends on it is a faithful description of the project, not a new claim.
- The CV and `resume.json` losing the five hidden projects is wanted. Hiding them is how Saud asked to remove them, and `hidden` reaches every output by design.
- Supabase stays in Mudaraj's technologies and out of the skills, as [[efforts/21-languages-and-honest-skills/spec]] left it: Saud said then he had not used it himself.

# Risks

- **The resume's page.** More or fewer keywords change the key skills block on the one-page resume. Criterion 10 measures it.
- **A mark's guidelines read wrongly.** Lua, Turborepo, and Fly.io record guidelines. A mark mapped against them would have to come out after publishing, which is why each is read and recorded before mapping, as the existing ones were.
- **A name that fades can hide focus.** If the hidden link stayed focusable, a keyboard user would land on nothing. Criterion 1 checks it.
