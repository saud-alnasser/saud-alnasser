// The mechanism behind "one source of content": a project added to
// src/content/projects/ appears on the work page, the CV page, the resume
// page, and resume.json in both languages, with no change to any file outside
// the content source, and disappears again when removed. A course added to
// src/content/certificates/ reaches the education page and resume.json and
// not the CV, which reads the courses as one self-study entry; a
// certification added there reaches the education page, the CV page, and
// resume.json, and brings back the certifications section on the education
// page, the card on the home page, and the section on the CV, which render
// only while one exists. A language added to src/content/languages/ reaches
// the CV page, the resume page, and resume.json, and no page of the site.
//
//   pnpm test:content
//
// The script writes a fixture project, two fixture certificates, and a
// fixture language, builds, asserts each fixture's name is in exactly its own
// outputs and nowhere else in dist/, removes the fixtures, builds again, and
// asserts the names are gone. At every step `git status` is compared with
// what it showed at the start: nothing outside src/content/ may differ during
// the run, and nothing at all may differ at the end. In CI the tree starts
// clean, so that is the literal assertion; on a developer's machine it
// tolerates their own uncommitted work while still catching a build that
// writes outside dist/.
//
// Neither fixture certificate names a document, so its card on the education
// page has nothing to open and must be neither a link nor a button. Every
// real certificate carries its document, so this is the one place that card
// is rendered and checked.
//
// The fixture project is finished and marked for the resume, so it reaches
// the resume page as well as the CV. The fixture course carries no marker and
// would reach no document with one, as no course is listed on either; the
// fixture certification carries none and reaches the CV and stops there. Each
// takes the path a real entry takes through src/lib/shown.ts.
//
// The featured mark is tried three ways after that, each on its own build. A
// hidden project marked featured must fail the build naming its file; a second
// project marked beside the real one must fail it naming both files; and the
// real one's mark taken away must build with no featured card on the work
// page or the home page. The real project's file is written back exactly as
// it was, whatever happens, and the site is built once more from it.
//
// The fixture language carries no test, so what it proves is the mechanism
// and not a score's format; the score's line is asserted by the browser tests
// and the dist check over the real entries.
//
// The fixture names start with `fixture-`, as src/content/README.md reserves for
// placeholders, and carry a suffix no real entry would. `render:pdf` is not
// run: the PDF is rendered from the CV page this script already asserts on.
// Exits non-zero with a named reason on the first failure, and removes the
// fixtures whatever happens.

import { execFile } from 'node:child_process';
import { readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { parse as parseYaml } from 'yaml';
// Node strips the types on import, as scripts/check-dist.mjs relies on.
import { isCertification } from '../src/lib/shown.ts';

const run = promisify(execFile);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const contentDir = 'src/content/';

// Each fixture: its name, the file it is written to, what is written, and
// where the name must appear. The three names share no prefix beyond
// `fixture-`, so a search for one never finds another.
const project = {
  name: 'fixture-mechanism-probe-4f9c2e',
  file: path.join(root, contentDir, 'projects', 'fixture-mechanism-probe-4f9c2e.yaml'),
  outputs: [
    'en/work/index.html',
    'ar/work/index.html',
    'en/cv/index.html',
    'ar/cv/index.html',
    'en/resume/index.html',
    'ar/resume/index.html',
    'en/resume.json',
    'ar/resume.json',
  ],
};
project.text = `# Written by scripts/test-content-mechanism.mjs and removed by it. If this
# file is in the tree, that script was interrupted; delete it.
name: "${project.name}"
period:
  start: "2026-01"
  end: "2026-02"
role:
  en: "Fixture role"
  ar: "دور تجريبي"
summary:
  en: "A fixture project that proves content flows to every output."
  ar: "مشروع تجريبي يثبت أن المحتوى يصل إلى كل المخرجات."
technologies:
  - "Fixture"
links:
  repository: https://example.invalid/${project.name}
visibility: public
status: completed
resume: true
`;

// The course reaches the education page and the JSON documents and not the
// CV: the CV names no course, and that absence is what proves the courses
// collapsed into the self-study entry rather than merely moved.
const course = {
  name: 'fixture-certificate-without-document-7b1d0a',
  kind: 'course',
  file: path.join(root, contentDir, 'certificates', 'fixture-certificate-without-document-7b1d0a.yaml'),
  outputs: ['en/education/index.html', 'ar/education/index.html', 'en/resume.json', 'ar/resume.json'],
};
course.text = `# Written by scripts/test-content-mechanism.mjs and removed by it. If this
# file is in the tree, that script was interrupted; delete it.
name:
  en: "${course.name}"
  ar: "${course.name}"
issuer: "Fixture issuer"
kind: course
`;

// The certification reaches the CV as well, and its presence is what brings
// the certifications section, card, and heading back (assertCertificationsShown).
const certification = {
  name: 'fixture-certification-without-document-3c8e1f',
  kind: 'certification',
  file: path.join(root, contentDir, 'certificates', 'fixture-certification-without-document-3c8e1f.yaml'),
  outputs: ['en/education/index.html', 'ar/education/index.html', 'en/cv/index.html', 'ar/cv/index.html', 'en/resume.json', 'ar/resume.json'],
};
certification.text = `# Written by scripts/test-content-mechanism.mjs and removed by it. If this
# file is in the tree, that script was interrupted; delete it.
name:
  en: "${certification.name}"
  ar: "${certification.name}"
issuer: "Fixture issuer"
kind: certification
`;

const language = {
  name: 'fixture-language-probe-9e3d5c',
  file: path.join(root, contentDir, 'languages', 'fixture-language-probe-9e3d5c.yaml'),
  outputs: ['en/cv/index.html', 'ar/cv/index.html', 'en/resume/index.html', 'ar/resume/index.html', 'en/resume.json', 'ar/resume.json'],
};
language.text = `# Written by scripts/test-content-mechanism.mjs and removed by it. If this
# file is in the tree, that script was interrupted; delete it.
name:
  en: "${language.name}"
  ar: "${language.name}"
level:
  en: "Fixture level"
  ar: "مستوى تجريبي"
order: 99
`;

const fixtures = [project, course, certification, language];

// The featured fixtures, which each build alone rather than with the four
// above: a project marked featured while hidden, and a second shown project
// marked featured beside the real one.
const featuredText = (name, visibility) => `# Written by scripts/test-content-mechanism.mjs and removed by it. If this
# file is in the tree, that script was interrupted; delete it.
name: "${name}"
period:
  start: "2026-01"
  end: "2026-02"
role:
  en: "Fixture role"
  ar: "دور تجريبي"
summary:
  en: "A fixture project marked featured."
  ar: "مشروع تجريبي معلّم بأنه مميز."
technologies:
  - "Fixture"
visibility: ${visibility}
status: completed
featured: true
`;
const hiddenFeatured = {
  name: 'fixture-featured-hidden-5a2d8b',
  file: path.join(root, contentDir, 'projects', 'fixture-featured-hidden-5a2d8b.yaml'),
  visibility: 'hidden',
};
const secondFeatured = {
  name: 'fixture-featured-second-8e6c1f',
  file: path.join(root, contentDir, 'projects', 'fixture-featured-second-8e6c1f.yaml'),
  visibility: 'described',
};

class Failure extends Error {
  constructor(reason, message) {
    super(message);
    this.reason = reason;
  }
}

async function gitStatus() {
  const { stdout } = await run('git', ['status', '--porcelain', '--untracked-files=all'], { cwd: root });
  return stdout.split(/\r?\n/).filter(Boolean).sort();
}

// The status lines that differ from the baseline, in either direction.
function statusDelta(baseline, current) {
  return [...current.filter((line) => !baseline.includes(line)), ...baseline.filter((line) => !current.includes(line))];
}

// A porcelain line's path: after the two status columns and a space, and
// after " -> " for a rename.
function pathOf(line) {
  const file = line.slice(3);
  return file.includes(' -> ') ? file.split(' -> ')[1] : file;
}

async function assertTreeUntouched(step, baseline, { allowContent }) {
  const delta = statusDelta(baseline, await gitStatus());
  const outside = allowContent ? delta.filter((line) => !pathOf(line).startsWith(contentDir)) : delta;
  if (outside.length > 0) {
    const where = allowContent ? `outside ${contentDir}` : 'at all';
    throw new Failure('tree-changed', `${step}: git status changed ${where}:\n${outside.map((line) => `  ${line}`).join('\n')}`);
  }
}

// `astro build`, through node and astro's own entry so no shell or package
// manager shim is needed. The entry is not in astro's exports map, so it is
// found by path.
async function build(step) {
  const astro = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
  try {
    await stat(astro);
  } catch {
    throw new Failure('astro-missing', `${path.relative(root, astro)} does not exist; run \`pnpm install\` first`);
  }
  try {
    const { stdout } = await run(process.execPath, [astro, 'build'], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
    const gaps = stdout.split(/\r?\n/).find((line) => line.includes('[localized]'));
    console.log(`${step}: built${gaps ? `, ${gaps.trim()}` : ''}`);
  } catch (error) {
    throw new Failure('build-failed', `${step}: astro build exited ${error.code ?? 'non-zero'}\n${error.stderr ?? ''}`);
  }
}

// `astro build` where it must fail: it exits non-zero, and its output names
// every file in `expected`, colour codes aside.
async function buildFails(step, expected) {
  const astro = path.join(root, 'node_modules', 'astro', 'bin', 'astro.mjs');
  try {
    await run(process.execPath, [astro, 'build'], { cwd: root, maxBuffer: 64 * 1024 * 1024 });
  } catch (error) {
    const output = `${error.stdout ?? ''}${error.stderr ?? ''}`.replace(/\x1b\[[0-9;]*m/g, '');
    for (const text of expected) {
      if (!output.includes(text)) throw new Failure('refusal-unnamed', `${step}: the build failed without naming ${text}`);
    }
    console.log(`${step}: the build refused, naming ${expected.join(' and ')}`);
    return;
  }
  throw new Failure('refusal-missing', `${step}: the build passed`);
}

// The real project the content marks featured: its file and its text as
// written, so it can be put back exactly.
async function featuredEntry() {
  const directory = path.join(root, contentDir, 'projects');
  for (const name of (await readdir(directory)).filter((file) => file.endsWith('.yaml')).sort()) {
    const file = path.join(directory, name);
    const text = await readFile(file, 'utf8');
    if (parseYaml(text)?.featured === true) return { file, text };
  }
  return null;
}

// The featured mark tried three ways: refused on a hidden project, refused on
// a second project, and absent when no project carries it.
async function assertFeatured(baseline) {
  const real = await featuredEntry();
  if (!real) throw new Failure('featured-missing', 'no project under src/content/projects/ is marked featured, and the fixtures test against one');
  const relative = (file) => path.relative(root, file).split(path.sep).join('/');

  try {
    await writeFile(hiddenFeatured.file, featuredText(hiddenFeatured.name, hiddenFeatured.visibility), 'utf8');
    await buildFails('a hidden project marked featured', [path.basename(hiddenFeatured.file)]);
  } finally {
    await rm(hiddenFeatured.file, { force: true });
  }

  try {
    await writeFile(secondFeatured.file, featuredText(secondFeatured.name, secondFeatured.visibility), 'utf8');
    await buildFails('two projects marked featured', [relative(real.file), relative(secondFeatured.file)]);
  } finally {
    await rm(secondFeatured.file, { force: true });
  }

  try {
    const unmarked = real.text.replace(/^featured: true\r?\n/m, '');
    if (unmarked === real.text) throw new Failure('featured-unwritable', `${relative(real.file)} carries its mark in a form this script cannot take away`);
    await writeFile(real.file, unmarked, 'utf8');
    await assertTreeUntouched('with no project marked featured', baseline, { allowContent: true });
    await build('with no project marked featured');
    for (const page of ['en/work/index.html', 'ar/work/index.html', 'en/index.html', 'ar/index.html']) {
      if ((await readFile(path.join(dist, page), 'utf8')).includes('data-featured-project')) {
        throw new Failure('featured-shown', `dist/${page} shows a featured card with no project marked featured`);
      }
    }
    console.log('no project marked featured: built, with no featured card on either work page or home page');
  } finally {
    await writeFile(real.file, real.text, 'utf8');
  }
}

// Every file under dist/ whose text mentions a name.
async function mentions(name) {
  const found = [];
  const walk = async (directory) => {
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      const file = path.join(directory, entry.name);
      if (entry.isDirectory()) await walk(file);
      else if (/\.(html|json|xml|txt|js|css)$/.test(entry.name) && (await readFile(file, 'utf8')).includes(name)) {
        found.push(path.relative(dist, file).split(path.sep).join('/'));
      }
    }
  };
  await walk(dist);
  return found.sort();
}

async function assertPresent(fixture) {
  const found = await mentions(fixture.name);
  for (const output of fixture.outputs) {
    if (!found.includes(output)) throw new Failure('fixture-missing', `dist/${output} does not mention "${fixture.name}" after the build`);
  }
  const elsewhere = found.filter((file) => !fixture.outputs.includes(file));
  if (elsewhere.length > 0) {
    throw new Failure('fixture-leaked', `"${fixture.name}" also appears in ${elsewhere.map((file) => `dist/${file}`).join(', ')}, outside its ${fixture.outputs.length} outputs`);
  }
  console.log(`present: "${fixture.name}" in ${fixture.outputs.map((file) => `dist/${file}`).join(', ')} and nowhere else`);
}

// The project's link reaches the JSON Resume document as its url.
async function assertProjectLinked() {
  for (const locale of ['en', 'ar']) {
    const resume = JSON.parse(await readFile(path.join(dist, locale, 'resume.json'), 'utf8'));
    const entry = (resume.projects ?? []).find((item) => item.name === project.name);
    if (!entry) throw new Failure('fixture-missing', `dist/${locale}/resume.json has no project named "${project.name}"`);
    if (entry.url !== `https://example.invalid/${project.name}`) {
      throw new Failure('fixture-wrong', `dist/${locale}/resume.json: the fixture's url is ${JSON.stringify(entry.url)}, expected the repository link`);
    }
  }
}

// A fixture certificate's card on the education page is neither a link nor a
// button and carries no document, because the entry names none. The card is
// the nearest element before the name that is marked with the entry's kind;
// its opening tag says what it is.
async function assertCardUnopenable(certificate) {
  for (const locale of ['en', 'ar']) {
    const file = `${locale}/education/index.html`;
    const html = await readFile(path.join(dist, file), 'utf8');
    const at = html.indexOf(certificate.name);
    const marker = html.lastIndexOf(`data-entry="${certificate.kind}"`, at);
    if (at === -1 || marker === -1) throw new Failure('fixture-missing', `dist/${file} has no ${certificate.kind} card named "${certificate.name}"`);
    const tag = html.slice(html.lastIndexOf('<', marker), html.indexOf('>', marker) + 1);
    const element = /^<([a-z0-9-]+)/i.exec(tag)?.[1]?.toLowerCase();
    if (element === 'a' || element === 'button' || /\s(href|data-document|data-preview)=/.test(tag)) {
      throw new Failure('card-opens-nothing', `dist/${file}: the card for "${certificate.name}", which names no document, is ${tag}; expected neither a link nor a button`);
    }
    console.log(`unopenable: dist/${file} renders "${certificate.name}" as <${element}> with no link and no document`);
  }
}

// The three surfaces that exist only while a certification does: the card on
// the home page, the heading on the education page, and the section on the
// CV, in both languages. With the fixture certification present all six are
// there; with it removed, and no real certification in the content, none is.
// Where the content does carry a real certification the second half cannot
// be told from the fixture's effect, so it is asserted present instead and
// the line says which reading applied.
async function assertCertificationsShown(withFixture) {
  // Read the way the build reads it, through the parser and the one
  // predicate every output uses, so a quoted `kind` counts as the build
  // counts it.
  const directory = path.join(root, contentDir, 'certificates');
  let real = false;
  for (const file of (await readdir(directory)).filter((name) => name.endsWith('.yaml') && !name.startsWith('fixture-'))) {
    if (isCertification(parseYaml(await readFile(path.join(directory, file), 'utf8')))) real = true;
  }
  const expected = withFixture || real;
  const surfaces = [
    ['index.html', 'data-section-card="certifications"'],
    ['education/index.html', 'id="certificates"'],
    ['cv/index.html', 'data-cv-section="certifications"'],
  ];
  for (const locale of ['en', 'ar']) {
    for (const [page, marker] of surfaces) {
      const file = `${locale}/${page}`;
      const found = (await readFile(path.join(dist, file), 'utf8')).includes(marker);
      if (found !== expected) {
        throw new Failure(
          expected ? 'certifications-hidden' : 'certifications-shown',
          `dist/${file} ${found ? 'carries' : 'lacks'} ${marker}; expected it ${expected ? 'present with' : 'absent without'} the fixture certification`,
        );
      }
    }
  }
  console.log(`certifications: the card, the heading, and the CV section are ${expected ? 'present' : 'absent'} in both languages${real ? ' (a real certification is in the content)' : ''}`);
}

async function assertAbsent(fixture) {
  const found = await mentions(fixture.name);
  if (found.length > 0) {
    throw new Failure('fixture-remains', `"${fixture.name}" is still in ${found.map((file) => `dist/${file}`).join(', ')} after its removal`);
  }
  console.log(`absent: "${fixture.name}" is in no file under dist/`);
}

try {
  for (const fixture of [...fixtures, hiddenFeatured, secondFeatured]) {
    try {
      await stat(fixture.file);
      throw new Failure('fixture-exists', `${path.relative(root, fixture.file)} already exists; a previous run was interrupted, delete it`);
    } catch (error) {
      if (error instanceof Failure) throw error;
    }
  }

  const baseline = await gitStatus();
  if (baseline.length > 0) console.log(`baseline: git status shows ${baseline.length} uncommitted path(s); the run must leave them as they are`);

  try {
    for (const fixture of fixtures) await writeFile(fixture.file, fixture.text, 'utf8');
    await assertTreeUntouched('after writing the fixtures', baseline, { allowContent: true });
    await build('with the fixtures');
    await assertTreeUntouched('after the build with the fixtures', baseline, { allowContent: true });
    for (const fixture of fixtures) await assertPresent(fixture);
    await assertProjectLinked();
    await assertCardUnopenable(course);
    await assertCardUnopenable(certification);
    await assertCertificationsShown(true);
  } finally {
    for (const fixture of fixtures) await rm(fixture.file, { force: true });
  }

  await assertTreeUntouched('after removing the fixtures', baseline, { allowContent: false });
  await build('without the fixtures');
  await assertTreeUntouched('after the build without the fixtures', baseline, { allowContent: false });
  for (const fixture of fixtures) await assertAbsent(fixture);
  await assertCertificationsShown(false);

  await assertFeatured(baseline);
  await assertTreeUntouched('after the featured fixtures', baseline, { allowContent: false });
  await build('from the content as it is');
  console.log('test-content-mechanism: passed');
} catch (error) {
  if (error instanceof Failure) {
    console.error(`test-content-mechanism: ${error.reason}: ${error.message}`);
  } else {
    console.error(`test-content-mechanism: unexpected: ${error.stack ?? error}`);
  }
  process.exit(1);
}
