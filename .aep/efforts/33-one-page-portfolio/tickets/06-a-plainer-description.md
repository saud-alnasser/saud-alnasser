---
status: resolved
---

# feat(content): a plainer description, and a README without the documents

## Outcome

The profile's label is "Software engineer", and both summaries open with it. They name rentable and no other project, and the summary says Saud is looking for a junior software engineering role. That is his own wording, from his LinkedIn profile, pared down. The README's profile block links the portfolio and the profiles, and no longer links the CV or the resume.

## Acceptance Criteria

- [x] `src/content/profile.yaml`'s `label` is "Software engineer" in English, with an Arabic draft. `summary` and `resumeSummary` each begin with it, name no project but rentable, and are shorter than or as long as today's. `summary` carries the junior-role sentence (requirement 11, criterion 11). Verified: the label reads "Software engineer" and "مهندس برمجيات"; `summary` fell from five sentences to three and `resumeSummary` stays at two, both opening on the label and naming rentable alone, and `summary` closes on the junior-role sentence.
- [x] The home page, the CV, the resume, and both `resume.json` files read the new label and summaries. The existing suites that read them from the content pass, and the no-overclaim check still passes (requirement 11, criterion 11; requirement 9, criterion 9). Verified: `dist/en/index.html`'s hero label reads "Software engineer"; both `resume.json` files carry the new label and summary; `pnpm test` passed 908 cases, the hero and document cases among them, which read the text from the content; `pnpm check:dist` printed "no overclaim: neither \"graduated\" nor \"awarded\" in 11 pages".
- [x] `scripts/readme-profile.mjs` writes no CV or resume link. `README.md` is regenerated, and `pnpm readme --check` passes. The block still links LinkedIn and the portfolio in both languages (requirement 11, criterion 11). Verified: `pnpm readme` rewrote the block, which now holds the summary, the LinkedIn line, and the portfolio line in both languages and nothing else; `pnpm check:dist` printed "readme profile: README.md carries the profile as src/content/ states it".
- [x] After `pnpm render:pdf`, the resume is one page at A4 and at Letter with the margin the render step requires (requirement 11, criterion 11). Verified: `pnpm render:pdf` printed "resume.en.pdf: 1 page at A4 with 54.8mm free, 1 page at Letter with 36.8mm free" and "resume.ar.pdf: 1 page at A4 with 54.3mm free, 1 page at Letter with 36.3mm free", and exited 0.
- [x] `pnpm build`, `pnpm check`, `pnpm check:dist`, `pnpm test`, `pnpm test:content`, and `pnpm scan:history` exit 0 (requirement 9, criterion 9). Verified: build 0 ("[localized] 0 gaps"), check 0 (0 errors), check:dist 0, test 0 (908 passed), test:content 0, scan:history 0 on the ticket's commit.

## Relevant areas

`src/content/profile.yaml` and its comment; `scripts/readme-profile.mjs`; `README.md`; `docs/development.md` and `src/content/README.md` where they name the README's links.

## Constraints

- The Arabic is a draft until Saud reads it, as requirement 10 says of every Arabic string.
- The comment on the summaries keeps its history and gains a dated line for this change.

## Notes

- cachescribe was reviewed before it was left out, as Saud asked. Every version on npm, from 1.0.0 to 2.0.2, packs no `dist/` folder, while its `main` names `./dist/index.js`, so installing it and importing it fails with "Cannot find package". The source also reads the cache map in `#load()` before the constructor has set it, so reloading an existing snapshot would throw, and the snapshot is the package's one promise. The project stays on the site and the CV as it is; whether it should is Saud's call.
- The summaries stay impersonal, as they were ("Software engineer ... working mainly in ..."), rather than taking the first person of his LinkedIn text.
- "Computer science graduate" matches the degree's recorded `status: completed` with its certificate issued. The no-overclaim check looks for "graduated" and "awarded" and still passes.
