---
use-when: "building a ticket in this effort and the approach is not obvious from the spec"
---

# Architecture

Two decisions, both put to Saud on 2026-09-23 with the alternatives beside them, and both taken as recommended.

**The self-study topics are one content file, `src/content/self-study.yaml`.** It holds the providers and the topics, the topics per language, and nothing derivable: the count of courses and the years come from the course entries at build time. Loaded like `profile.yaml`, with Astro's `file()` loader and one top-level key, `selfStudy`.

Rejected: a block on `profile.yaml`, because the profile is the person and this is a phase of education, and the file would grow a section nothing else in it resembles. A `topic` field on each of the 26 course entries, because the line's order would then fall out of the date sort, undated Code with Mosh topics alphabetically after the dated SoloLearn ones, and the curated order the note asked for would be lost; 26 files to edit for one line. A content education entry for self-study, because every reader of the education collection, the timeline, the home page's institution count, the JSON Resume `education` array, and five tests would have to learn to skip it, and it would claim an institution it does not have.

**The CV places the entry through one shared timeline helper.** The education page already splices its online-courses node immediately before the most recent institution, by position rather than by date, because the Code with Mosh courses carry no date (`src/pages/[locale]/education/index.astro`, the comment over `items`). That rule moves into `src/lib/timeline.ts` as a pure function the education page, the CV component, the dist check, and the browser tests all call, so the node's place on the site and the entry's place on the CV are one decision. The helper takes plain data and imports nothing at runtime, the way `shown.ts` and `order.ts` do, because the scripts and the tests import it with Node stripping the types.

Rejected: the CV sorting a derived entry by the earliest dated course, because it is a second rule for the same fact, an undated phase would sort nowhere, and the dist check would need its own copy of the ordering.

**Everything else follows the CV's existing rule that a section prints only where it holds something.** The education page's certifications section and the home page's certifications card are wrapped in the same condition the CV's sections already carry, and the tests read the count from the content and expect presence or absence accordingly.

# Components

- `src/content/self-study.yaml`, new. One top-level key `selfStudy` with `providers`, a list of issuer names as the certificate entries spell them, and `topics`, a list of localized texts in the order the line prints them. A comment over `topics` says the rule: a topic is backed by a course whose English name contains it, case-insensitively, and the dist check refuses one that is not.
- `src/content.config.ts`: a `selfStudy` collection, `file('./src/content/self-study.yaml')`, schema `{ providers: string[] min 1, topics: localized[] min 1 }`, strict. Nothing about the courses lives here; the schema cannot see another collection, so the backing check is the dist check's.
- `src/lib/timeline.ts`, new. `educationTimeline(education, courses)` returns the institutions in start order with one `{ kind: 'courses', count, period? }` item spliced immediately before the most recent institution when there is at least one course, `period` running from the earliest dated course to the latest, exactly as the page computes it today. A second export, `selfStudyLine`, is not needed: the strings are filled in the component and the dist check from the same `t` object, the way `levelLine` was avoided where `fill` sufficed.
- `src/pages/[locale]/education/index.astro`: builds `items` through `educationTimeline` instead of its own splice, and renders the certifications section inside `certifications.length > 0 &&`. The courses grid and the node are unchanged in what they render.
- `src/pages/[locale]/index.astro`: the certifications card is added to `sections` only when `certifications.length > 0`. `SectionCard.astro` is untouched.
- `src/components/CvDocument.astro`: the education section iterates the timeline on the CV and the institutions alone on the resume. The courses item renders as one `<li class="cv-entry" data-self-study>`: the title `t.cv.selfStudy.title` with the period at the far edge in the same `row`, then the muted line `t.cv.selfStudy.through` filled with the count, the plural noun, and the providers joined by `Intl.ListFormat(locale, { type: 'conjunction' })`, then the topics joined by `t.listSeparator` under `t.cv.selfStudy.topics` in the muted style the institution's course list uses. `tail` loses its `courses` row on both variants; the `CertificateSection` type narrows to `'certifications'`. The comment block at the top says what each variant holds now.
- `src/lib/i18n.ts`: `cv.selfStudy` in both languages, `{ title, through, topics }`, with `through` a template over `{count}`, `{noun}`, and `{providers}` and the noun forms reused from `education.onlineCourses.noun`; `cv.courses` removed; `home.cv` and `cv.description` reworded so neither says the CV lists the courses or holds a certifications section unconditionally.
- `scripts/check-dist.mjs`: the reading-order expectation builds its education groups from `educationTimeline`, adding for the courses item a group of the title and the period and a group of the filled `through` line; a new check, `selfStudy`, reads `self-study.yaml` and every course entry and fails naming the first topic whose English is contained in no course's English name, and the first provider that is no course's issuer. The JSON Resume comparison is unchanged.
- `scripts/test-content-mechanism.mjs`: two certificate fixtures instead of one. The course fixture keeps its name and reaches both education pages and both `resume.json` files, and no longer the CV, which is what proves the collapse. A certification fixture reaches both education pages, both CV pages, and both `resume.json` files. `assertCardUnopenable` takes the fixture and its kind. A new `assertCertificationsShown(expected)` reads the home pages for `data-section-card="certifications"` and the education pages for `id="certificates"` and the CV pages for `data-cv-section="certifications"`, expecting all present with the fixtures and all absent without.
- The tests: `tests/resume.spec.ts` drops `courses` from `held` and `tailOrder`, expects the education periods on the CV from `educationTimeline` and on the resume from the institutions, and gains a case that the CV's `[data-self-study]` entry sits before the university's, carries the year, the count, both providers, and every topic in that language, and that the resume has none. `tests/periods.spec.ts` adds the node to the CV's count. `tests/education.spec.ts` and `tests/home.spec.ts` expect the certifications heading and card only where the content has a certification. `tests/certificates.spec.ts` asserts the grid's absence where its entries are empty.
- `src/content/certificates/typing-com-advanced-assessment.yaml`, its PDF, and its preview: deleted.
- `src/content/README.md`: a `self-study.yaml` section, the `certificates/` section reworded, the `skills/` keyword rule naming a self-study topic on the CV as a witness. `docs/development.md` line for `test:content` says two certificates.
- `[[efforts/5-sections-and-resume/spec]]`: one dated line at requirement 9 and one at the typing-assessment assumption, pointing at [[efforts/29-credentials-as-one-self-study-line/spec]].

# Interfaces

```ts
// src/lib/timeline.ts
export type TimelineItem<E> =
  | { kind: 'education'; entry: E }
  | { kind: 'courses'; count: number; period?: { start: string; end: string } };
export function educationTimeline<E extends { period: { start: string } }, C extends { date?: string }>(
  education: E[], // already sorted by start, ascending
  courses: C[],   // the course entries, any order
): TimelineItem<E>[];
```

The callers pass what they already hold: the page and the component pass collection entries, the dist check and the tests pass parsed YAML. The function sorts nothing but the dated courses it needs for the period.

```ts
// src/lib/i18n.ts, both languages
cv.selfStudy: {
  title: string;   // "Self-study" / "التعلم الذاتي"
  through: string; // "{count} {noun} at {providers}" / "{count} {noun} في {providers}"
  topics: string;  // "Topics" / "الموضوعات"
}
```

The `selfStudy` collection is read with `getEntry('selfStudy', 'selfStudy')`, as the profile is.

# Data Model

```yaml
# src/content/self-study.yaml
selfStudy:
  providers:
    - "Code with Mosh"
    - "SoloLearn"
  topics:
    - en: "C#"
      ar: "C#"
    - en: "Python"
      ar: "Python"
    - en: "JavaScript"
      ar: "JavaScript"
    - en: "HTML"
      ar: "HTML"
    - en: "SQL"
      ar: "SQL"
    - en: "data structures"
      ar: "هياكل البيانات"
    - en: "design patterns"
      ar: "أنماط التصميم"
    - en: "refactoring"
      ar: "إعادة هيكلة الشفرة"
    - en: "unit testing"
      ar: "اختبارات الوحدة"
    - en: "Docker"
      ar: "Docker"
    - en: "Git"
      ar: "Git"
```

Every English topic above is a case-insensitive substring of at least one course entry's English name today, checked by hand on 2026-09-23 against the 26 files, so no mapping field is needed. If a future topic is not, the field to add is `matches`, a string looked for instead of the topic's English, and the check reads it; it is not added ahead of a need.

# Technical Approach

1. **The typing entry off, and the site's sections conditional.** Delete the three files. Wrap the education page's certifications section and the home page's card. Update `tests/education.spec.ts`, `tests/home.spec.ts`, and `tests/certificates.spec.ts` to expect presence only where the content has a certification. Run the gates: the CV already drops its heading, `resume.json` loses one entry, and the JSON comparison follows. This lands first because it is independent of the line and leaves the tree green on its own.
2. **The timeline helper.** Write `src/lib/timeline.ts` and route the education page through it with no change in output; `tests/education.spec.ts` passes unchanged. This precedes the CV work because the CV, the dist check, and the tests all need the function.
3. **The self-study content and the CV.** The collection, the file, the strings, the CV's education section, `tail` without its courses row, and the removal of `cv.courses`. Then the dist check's reading-order groups and its `selfStudy` check, `tests/resume.spec.ts`, and `tests/periods.spec.ts`. Then the content mechanism test's two fixtures. Run every gate; record the resume's headroom from `pnpm render:pdf` in the commit even though the resume is untouched, because criterion 7 asks for the number.
4. **The words.** The content README, `docs/development.md`, the two descriptions in `i18n.ts`, the component's comment block, and the two dated lines in the earlier spec. Last, because they describe what the code now does.

Steps 1 and 2 could land in one ticket; 3 is the one that needs the plan.

# Integration

- `scripts/check-dist.mjs` imports from `src/lib/` already, so `timeline.ts` joins `shown.ts`, `order.ts`, and `i18n.ts` there; it must therefore carry no runtime import of `astro:content`.
- `Intl.ListFormat` runs at build time in Node and in the browser tests only through the built HTML. Node ships full ICU, so the Arabic conjunction is available; if a runner ever lacked it the build would print the English form for Arabic, which the Arabic CV case in `tests/resume.spec.ts` would catch by expecting the providers joined with the Arabic conjunction.
- The JSON Resume documents are untouched: `certificates` keeps every course, `education` keeps the institutions, and the self-study entry is a rendering of the courses rather than a fact of its own, so it maps to nothing there.

# Migration

Deleting the typing entry's PDF and preview is a plain deletion; the previews script renders from what is under `files/`, and the history scan reads every commit for identifiers, which a deletion cannot add. The `cv.courses` string and the `courses` row of `tail` are removed rather than left unused.

# Testing Strategy

| Criterion | Check |
| --- | --- |
| 1 | `git ls-files`, the grep the criterion names, `pnpm build`, and the JSON comparison in `pnpm check:dist` after step 1 |
| 2 | the new case in `tests/resume.spec.ts` on both CV pages; the dist check's reading-order groups over `cv.en.pdf`; the SoloLearn removal tried once and recorded on the ticket |
| 3 | the `selfStudy` check in `pnpm check:dist`, made to fail once with a topic that matches no course and put back; the README wording read |
| 4 | `tests/education.spec.ts`, `tests/home.spec.ts`, and `tests/certificates.spec.ts` after step 1, run with no certification in the content |
| 5 | `pnpm test:content` with the certification fixture, whose `assertCertificationsShown` sees all three surfaces with the fixtures and none without |
| 6 | `tests/certificates.spec.ts` and `tests/education.spec.ts` counts, `tests/home.spec.ts` count line, the JSON comparison |
| 7 | `tests/resume.spec.ts` on both resume pages, `pnpm render:pdf`'s page count and headroom |
| 8 | the grep the criterion names, every returned line read; the two dated lines in the earlier spec |
| 9 | the `[localized]` line `pnpm build` prints |
| 10 | the seven gates in the integration workflow's order |

# Technical Risks

- **The dist check's group matcher and the topics line.** The reading-order groups match items on one extracted line or consecutive lines. The topics line is long and wraps on paper, so it is not asserted as a group; the title with the period and the `through` line are, and the topics are asserted in the browser case instead.
- **`pdftotext` and the Arabic line** are not checked, as no Arabic line is, per the first effort's criterion 5.
- **The home page's card order.** Removing the certifications card shifts the skills card up; `tests/home.spec.ts` builds its expected order from a filtered list, so the assertion follows the content rather than a fixed index.
