---
use-when: "orienting in this repository for the first time in a session, before reaching for a narrower context"
---

# Context — this repository

Cross-cutting orientation only: vocabulary and shape every area needs. An area
that grows enough gets its own context with its own `use-when`.

## What this repository is

`saud-alnasser/saud-alnasser` is Saud Alnasser's personal portfolio website
and, because the repository carries his username, the README GitHub shows on
his profile page. It was initialised locally on 2026-09-08 as `portfolio`,
joined to AEP the same day before any source was written, and renamed
`saud-alnasser` on 2026-09-09; GitHub redirects the old name.

Decided so far:

- it is a website, hosted **for free on GitHub Pages** as a project site at
  `https://saud-alnasser.github.io/saud-alnasser/`, deployed by a GitHub
  Actions workflow on every push to `main` (`.github/workflows/deploy.yml`).
  The base path is `base` in `astro.config.mjs`, and every path the site
  publishes is joined to it (`src/lib/paths.ts`); the address was re-decided
  on 2026-09-09 in `[[efforts/1-portfolio-site/plan]]`, "The address"
- it is built with **Astro 7**, Tailwind 4, and typed YAML content
  collections, chosen in `[[efforts/1-portfolio-site/plan]]` on 2026-09-08;
  the site is static files only, in English and Arabic, with two documents
  derived from the same content, a CV that carries the whole record and a
  short resume for an application, each as a printable page and a PDF
  rendered at build time, beside a JSON Resume document that follows the CV
- work lands as **stacked changes through Graphite** (`[[rules/version-control]]`)
- what it shows is specified in `[[efforts/1-portfolio-site/spec]]`

## Shape

| Directory | Holds |
| --- | --- |
| `.aep/` | the protocol tree: policies, skills, rules, references, efforts |
| `.github/` | the forge's side of how work lands: issue and pull request templates, the label configuration, Renovate, and the workflows: a title lint, the labeler with its merge-time status job, the integration gate (AEP index, check, build, PDF render, dist checks, Playwright tests, Lighthouse, the content mechanism test, the history scan), and the Pages deploy, which ends by checking the live site |
| `src/content/` | **the content source**: one YAML file per entry under `projects/`, `experience/`, `education/`, `certificates/`, `skills/`, `languages/`, and `profile.yaml`, with the certificate documents and their previews under `certificates/files/` and the degree certificate with its preview under `education/files/`. Every fact the site or the CV shows lives here and nowhere else; `src/content/README.md` documents the format |
| `src/content.config.ts` | the content contract: the Zod schema of each collection, which the build enforces |
| `src/pages/`, `src/layouts/`, `src/components/` | the Astro templates: pages under `[locale]/` for `en` and `ar`, the `resume.json` and `robots.txt` endpoints, one base layout, one component per entry type, and the pieces they share: the inline icon, the QR code the documents carry the GitHub address as, the card, the fold, and the two header controls |
| `src/lib/` | UI strings per locale with the plural helper (`i18n.ts`), the language fallback and its gap report (`localized.ts`), the entry ordering (`order.ts`), whether an entry appears at all and which document it belongs to (`shown.ts`), the one line a language's level prints as, score and year included, on the documents and in `fluency` (`languages.ts`), the JSON Resume mapper (`resume.ts`), the base-path join every published path goes through (`paths.ts`), the icon a profile's network carries (`networks.ts`), the icon bodies themselves (`icons.ts`), which the icon component and the QR code both draw from |
| `src/styles/` | the one global stylesheet: Tailwind, the palette tokens for both themes including the card surface, the rules for the native disclosures and the CV, the print rules including the two documents' page boxes, the Arabic font faces |
| `public/` | files served as they are: the bundled Arabic font and its licence |
| `scripts/` | what runs after the build: the PDF render, the dist checks, the content mechanism test, the history scan, the Lighthouse runner, the static server the tests, the PDF render, and Lighthouse use, which serves `dist/` under the base path as Pages does, and the live check the deploy job runs last; and one that runs before a commit rather than after a build, the preview render for the certificate and degree documents, whose output is committed |
| `tests/` | the Playwright tests over the built site |
| `AGENTS.md` | the entrypoint |
| `README.md` | the profile page GitHub shows for the account, and nothing else: its facts are written from `src/content/` and the config by `pnpm readme` |
| `docs/` | how the site is built, checked, and deployed (`development.md`) |

## Vocabulary

| Term | Means |
| --- | --- |
| localized | a text field written per language as `{ en, ar }`; every other field is written once |
| described | a project rendered by name and summary without a link (`visibility: described`), the way private work appears. Visibility and completion are separate fields: a project is shown only where it is not `hidden` **and** its `status` is `completed`, which `src/lib/shown.ts` decides once for every output |
| certificate-pending | the education status for course work that is complete while the certificate has not been issued; the site never says more than that |
| gap report | the build's one-line list of every field whose Arabic was missing and rendered its English instead |
| base path | `/saud-alnasser`, the prefix GitHub Pages puts a project site under; `withBase()` in `src/lib/paths.ts` joins a site path to it |

## Where to look

| To understand | Start at |
| --- | --- |
| how work is done here | `.aep/protocol.md` |
| how work lands | `.aep/rules/version-control.md` |
| the content format | `src/content/README.md` |
| the address and the base path | `astro.config.mjs`, then `docs/development.md`, "Deployment" |
| what the site must be | `.aep/efforts/1-portfolio-site/spec.md` |
| why it is built this way | `.aep/efforts/1-portfolio-site/plan.md` |

## Areas with their own context

None yet.

| Area | Context |
| --- | --- |

---

**This file describes; it never instructs.** A requirement belongs in
`[[rules]]`; a procedure belongs in `[[references]]`. The repository is
authoritative over everything written here — where the source disagrees, the
source is right and this file gets corrected (`[[policies/authority]]`).
