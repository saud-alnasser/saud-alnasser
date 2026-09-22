// Checks over the built site in dist/. Run after `pnpm build`:
//
//   pnpm check:dist
//
// Each check is a function that receives the context below, returns the lines
// to print on success, and throws on failure. Adding a check means adding a
// function to `checks`; the runner prints the reason and exits non-zero on the
// first failure. The reader is a person watching CI, so failures name what was
// expected and what was found.

import { execFile } from 'node:child_process';
import { readdir, readFile, stat } from 'node:fs/promises';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { createCanvas } from '@napi-rs/canvas';
import jsQR from 'jsqr';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { parse as parseYaml } from 'yaml';
import { identifiersIn } from './identifiers.mjs';
import { placeholder } from './placeholder.mjs';
import { readmeWithProfile } from './readme-profile.mjs';
// The site's own date wording and orders, so the expectation reads exactly
// what the CV page printed. Node strips the types on import.
import { formatPeriod, localeInfo, strings } from '../src/lib/i18n.ts';
import { levelLine } from '../src/lib/languages.ts';
import { gapReport, pick } from '../src/lib/localized.ts';
import { codedProfile } from '../src/lib/networks.ts';
import { byOrderThenName, byStartAscending, byStartDescending } from '../src/lib/order.ts';
import { joinBase } from '../src/lib/paths.ts';
import { isShown } from '../src/lib/shown.ts';
import { base, site } from '../astro.config.mjs';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

// The fonts pdf.js substitutes for the fourteen standard ones a PDF may use
// without embedding, as scripts/certificate-previews.mjs finds them.
const standardFontDataUrl = `${path.dirname(require.resolve('pdfjs-dist/package.json')).split(path.sep).join('/')}/standard_fonts/`;

// The two documents the site publishes: the CV, which holds everything the
// site shows, and the short resume. Both are rendered from a page of the
// same name by scripts/render-pdf.mjs.
const documents = ['cv', 'resume'];

const context = {
  root,
  dist: path.join(root, 'dist'),
  // Where the render step writes the documents it fills through the download
  // form. Outside dist/ deliberately: dist/ is what the deploy uploads.
  artifacts: path.join(root, '.artifacts'),
  content: path.join(root, 'src', 'content'),
  locales: ['en', 'ar'],
  // The site's base path with its slash ("/saud-alnasser/", or "/" at the
  // root) and the full address of the site's root, from astro.config.mjs.
  // GitHub Pages serves this repository as a project site under the
  // repository's name, so every address the site publishes is under these.
  prefix: joinBase(base, '/'),
  siteRoot: new URL(joinBase(base, '/'), site).href,
};

class CheckFailure extends Error {
  constructor(check, message) {
    super(message);
    this.check = check;
  }
}

// The YAML files of one collection that the site shows, each parsed. Every
// collection shows every file, except projects, which the site filters
// through the one predicate every output reads (src/lib/shown.ts): a hidden
// or unfinished project stays in the source and is expected in no output.
async function visibleEntries(collection) {
  const dir = path.join(context.content, collection);
  const files = (await readdir(dir)).filter((name) => name.endsWith('.yaml')).sort();
  const entries = [];
  for (const file of files) {
    const data = parseYaml(await readFile(path.join(dir, file), 'utf8'));
    if (collection === 'projects' && !isShown(data)) continue;
    entries.push({ file, data });
  }
  return entries;
}

async function readJson(file) {
  return JSON.parse(await readFile(file, 'utf8'));
}

// `@jsonresume/schema` validates with a callback; wrapped so a check can await
// it. On failure it hands back the validator's error list.
function validateResume(resume) {
  const { validate } = require('@jsonresume/schema');
  return new Promise((resolve) => {
    validate(resume, (errors, valid) => resolve({ valid, errors: errors ?? [] }));
  });
}

// The JSON Resume document per language: present, valid against the schema,
// and carrying exactly the entries the site shows.
async function jsonResume() {
  const name = 'json resume';
  const sections = {
    work: 'experience',
    education: 'education',
    certificates: 'certificates',
    skills: 'skills',
    languages: 'languages',
    projects: 'projects',
  };
  const expected = {};
  for (const [section, collection] of Object.entries(sections)) {
    expected[section] = await visibleEntries(collection);
  }
  // The languages are compared entry by entry below, so they are put in the
  // order the documents print them (src/lib/order.ts) rather than file order.
  const languages = expected.languages.map((entry) => entry.data).sort(byOrderThenName);
  const profile = parseYaml(await readFile(path.join(context.content, 'profile.yaml'), 'utf8')).profile;
  // A project's `name:` is authored once, so it is the same in every
  // language's document.
  const described = expected.projects.filter((entry) => entry.data.visibility === 'described').map((entry) => entry.data.name);

  const lines = [];
  for (const locale of context.locales) {
    const file = path.join(context.dist, locale, 'resume.json');
    let resume;
    try {
      resume = await readJson(file);
    } catch (error) {
      throw new CheckFailure(name, `${locale}: cannot read ${path.relative(root, file)}: ${error.message}`);
    }

    const { valid, errors } = await validateResume(resume);
    if (!valid) {
      const detail = errors.map((error) => `  ${error.property}: ${error.message}`).join('\n');
      throw new CheckFailure(name, `${locale}: the document does not validate against @jsonresume/schema\n${detail}`);
    }

    const counts = [];
    for (const [section, entries] of Object.entries(expected)) {
      const found = Array.isArray(resume[section]) ? resume[section].length : 0;
      if (found !== entries.length) {
        throw new CheckFailure(
          name,
          `${locale}: ${section} has ${found} entries, expected ${entries.length} from src/content/${sections[section]}/`,
        );
      }
      counts.push(`${section} ${found}`);
    }

    for (const project of resume.projects ?? []) {
      if (described.includes(project.name) && 'url' in project) {
        throw new CheckFailure(name, `${locale}: described project "${project.name}" carries a url key`);
      }
    }

    // Each language as the document page prints it: the name in this
    // language, and `fluency` as the level with the test score and its year,
    // built by the function the page and the mapper share, so the two files
    // agree with the pages by construction. The same fallback as the summary
    // below, for the same reason.
    languages.forEach((data, index) => {
      const entry = resume.languages[index];
      const language = data.name[locale] ?? data.name.en;
      const fluency = levelLine(data.level[locale] ?? data.level.en, data.test, strings[locale].listSeparator);
      if (entry.language !== language || entry.fluency !== fluency) {
        throw new CheckFailure(
          name,
          `${locale}: languages[${index}] is ${JSON.stringify(entry)}, expected ${JSON.stringify({ language, fluency })} from src/content/languages/`,
        );
      }
    });

    // The nationality is a fact for the two documents and for nothing else,
    // so it may not appear as a field here. Asserted as the absence of a key
    // rather than of a string: the authored English value is "Saudi", which
    // occurs in this document inside "Saudi Arabia", "Saudi Electronic
    // University", and a project summary, all of them true content.
    const keys = JSON.stringify(resume).match(/"nationality"/g);
    if (keys) {
      throw new CheckFailure(name, `${locale}: the document carries a nationality field, which belongs to the two documents alone`);
    }

    if (resume.basics?.url !== context.siteRoot) {
      throw new CheckFailure(name, `${locale}: basics.url is ${JSON.stringify(resume.basics?.url)}, expected the site's root ${context.siteRoot}`);
    }
    // Falling back the way src/lib/resume.ts falls back rather than reading
    // the `ar` key: a profile field's Arabic is optional, and the document
    // carries the English where it is absent, so reading the file directly
    // would fail the Arabic document over a gap the contract allows. Written
    // out rather than through `pick`, which records into the store the `gaps`
    // check below reports from: a check that recorded a gap would put a line
    // in that report which `pnpm build` does not print.
    const summary = profile.summary[locale] ?? profile.summary.en;
    if (resume.basics?.summary !== summary) {
      throw new CheckFailure(name, `${locale}: basics.summary is ${JSON.stringify(resume.basics?.summary)}, expected src/content/profile.yaml's ${JSON.stringify(summary)}`);
    }
    const canonical = `${context.siteRoot}${locale}/resume.json`;
    if (resume.meta?.canonical !== canonical) {
      throw new CheckFailure(name, `${locale}: meta.canonical is ${JSON.stringify(resume.meta?.canonical)}, expected ${canonical}`);
    }

    lines.push(`${locale}/resume.json: valid, ${counts.join(', ')}`);
  }
  return lines;
}

// One line of text with its whitespace normalised, so a run of spaces that
// `pdftotext -layout` inserts between two columns of a line reads as one.
function squash(text) {
  return text.replace(/\s+/g, ' ').trim();
}

// The text of a PDF as `pdftotext -layout` lays it out, or null when the tool
// is not on the PATH. UTF-8 is asked for explicitly because xpdf's build
// writes Latin-1 by default and drops everything outside it.
async function extractText(file) {
  try {
    const { stdout } = await promisify(execFile)('pdftotext', ['-enc', 'UTF-8', '-layout', file, '-'], {
      maxBuffer: 16 * 1024 * 1024,
    });
    return stdout;
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

// The PDFs the render step writes: the CV and the resume in each language,
// present, small enough to attach to an application, and the English ones
// yielding the facts a resume parser needs, in reading order. Both documents
// print the same facts in the same order, because both come from one
// component (src/components/CvDocument.astro), so one expectation covers
// them. The Arabic PDFs are checked by eye, because right-to-left extraction
// is not reliable enough to assert on.
async function documentPdfs() {
  const name = 'document pdfs';
  const limit = 1_000_000;
  const lines = [];

  const sizes = {};
  for (const document of documents) {
    for (const locale of context.locales) {
      const file = path.join(context.dist, `${document}.${locale}.pdf`);
      try {
        sizes[`${document}.${locale}`] = (await stat(file)).size;
      } catch {
        throw new CheckFailure(name, `${path.relative(root, file)} does not exist; run \`pnpm render:pdf\` after the build`);
      }
      const size = sizes[`${document}.${locale}`];
      if (size >= limit) {
        throw new CheckFailure(name, `${path.relative(root, file)} is ${size} bytes, expected under ${limit}`);
      }
    }
  }

  // What an English document page prints, from the content it prints it from,
  // in the order it prints it (src/components/CvDocument.astro): the name,
  // then each experience entry's position with its period and its
  // organisation beneath, then each education entry's degree with its period
  // and its institution beneath, then each language with its level, which
  // the page prints as one line after the key skills.
  //
  // The expectation is groups rather than lines, because the template puts an
  // entry's title and its dates on one line: the items of a group may share
  // one extracted line, in order, or fall on consecutive lines, and both read
  // correctly. A group of one is one line, as before.
  const locale = 'en';
  const t = strings[locale];
  const profile = parseYaml(await readFile(path.join(context.content, 'profile.yaml'), 'utf8')).profile;
  const experience = (await visibleEntries('experience')).map((entry) => entry.data).sort(byStartDescending);
  const education = (await visibleEntries('education')).map((entry) => entry.data).sort(byStartAscending);
  const languages = (await visibleEntries('languages')).map((entry) => entry.data).sort(byOrderThenName);
  const expected = [
    // The page sets the name in capitals, so that is what comes out of the
    // PDF whatever the content file says; it is the one item compared
    // without case.
    { items: [profile.name[locale]], caseless: true },
    // The email was the second group and the document no longer prints it, so
    // the published PDFs anchor on the name alone. The contact line is checked
    // over the filled documents below, which are the only copies that have
    // one.
  ];
  for (const entry of experience) {
    expected.push({ items: [entry.position[locale], formatPeriod(locale, entry.period)] });
    expected.push({ items: [entry.organisation[locale]] });
  }
  for (const entry of education) {
    expected.push({
      items: [`${entry.studyType[locale]}${t.listSeparator}${entry.area[locale]}`, formatPeriod(locale, entry.period)],
    });
    expected.push({ items: [entry.institution[locale]] });
  }
  // The key skills print between the education and the languages and are not
  // asserted here: the CV lays them in columns, whose extraction order is not
  // the page's. A language and its level are one line, so they are one group.
  for (const entry of languages) {
    expected.push({ items: [entry.name[locale], levelLine(entry.level[locale], entry.test, t.listSeparator)] });
  }

  // Each document twice: the published file, which carries no contact line at
  // all, and the copy rendered through the download form to .artifacts/,
  // which is the only place a contact line still exists. The published file
  // lost the email as an anchor when the site stopped publishing it, so the
  // filled copy is what keeps the contact line's place in the reading order
  // checkable rather than merely intended.
  //
  // The contact line follows the name, which is where the email sat before
  // this effort and where the document's own header puts it.
  // One group, because the two are one line of the document: the group
  // mechanism above is what allows items to share an extracted line, in order,
  // and the contact line puts the email before the phone.
  const contact = [{ items: [placeholder.email, placeholder.phone] }];
  const subjects = documents.flatMap((document) => [
    { document, relative: `${document}.${locale}.pdf`, directory: context.dist, groups: expected },
    {
      document,
      relative: `${document}.${locale}.filled.pdf`,
      directory: context.artifacts,
      groups: [expected[0], ...contact, ...expected.slice(1)],
    },
  ]);

  for (const { relative, directory, groups } of subjects) {
    const file = path.join(directory, relative);
    let size;
    try {
      size = (await stat(file)).size;
    } catch {
      throw new CheckFailure(name, `${relative} does not exist; run \`pnpm render:pdf\` after the build`);
    }
    const text = await extractText(file);
    if (text === null) {
      lines.push(`${relative}: ${size} bytes; pdftotext is not on the PATH, so the text was not checked`);
      continue;
    }
    // A period prints as years alone (src/lib/i18n.ts, formatPeriod), so a
    // month abbreviation followed by a year is a period that leaked its
    // month, from whichever template printed it. A certificate date is the
    // one legitimate month on the page, and it prints day first, so a digit
    // and a space before the month is what excludes it.
    const leaked = text.match(/(?<!\d )\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec) \d{4}\b/);
    if (leaked) {
      throw new CheckFailure(name, `${relative}: "${leaked[0]}" is a period printed with its month`);
    }
    // No profile address is written out on either document: the one profile
    // on paper is the QR code, which `qrCode` below decodes, and the contact
    // line carries none since 2026-09-22. Read from the content's own list
    // rather than from a literal, so a third profile added later is refused
    // the same way. A project's repository link on the CV starts with the
    // GitHub profile address, so an address counts only where nothing that
    // could continue a URL follows it.
    for (const entry of profile.profiles ?? []) {
      const address = new RegExp(`${entry.url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?![^\\s"'<>()\\[\\]])`);
      if (address.test(text)) {
        throw new CheckFailure(name, `${relative}: the ${entry.network} address ${entry.url} is written out, and no profile is`);
      }
    }
    const found = text.split(/\r?\n/).map(squash);
    let cursor = 0;
    for (const group of groups) {
      const index = matchGroup(found, cursor, group);
      if (index === -1) {
        // Which half of the failure it is: a fact the page no longer prints,
        // or facts that are all there but no longer in the order the layout
        // is supposed to put them in.
        const absent = group.items.find((item) => findItem(found, cursor, item, group.caseless) === -1);
        const where = `after line ${cursor} of the extracted text`;
        throw new CheckFailure(
          name,
          absent
            ? `${relative}: "${absent}" is nowhere ${where}`
            : `${relative}: ${group.items.map((item) => `"${item}"`).join(' and ')} are not on one line, or on consecutive lines in that order, ${where}`,
        );
      }
      cursor = index + 1;
    }
    const items = groups.reduce((total, group) => total + group.items.length, 0);
    lines.push(`${relative}: ${size} bytes, ${items} expected facts found in ${groups.length} groups in reading order`);
  }
  for (const document of documents) {
    for (const other of context.locales.filter((l) => l !== locale)) {
      lines.push(`${document}.${other}.pdf: ${sizes[`${document}.${other}`]} bytes`);
    }
  }
  return lines;
}

// The QR code in every rendered document decodes to the address the content
// source holds. This is the check the "no image" reversal is paid for with.
//
// It reads the artifact, not the markup. The markup was never the half in
// doubt: a code can be encoded perfectly and still come out of the renderer
// too small, too soft, or with too much of it knocked out by the mark at its
// centre, and none of that is visible in an <svg> anybody can read. So the
// page is rasterised the way scripts/certificate-previews.mjs rasterises a
// certificate, and the pixels are handed to a decoder that knows nothing
// about how they were drawn.
//
// The address comes from src/content/profile.yaml, never from a literal here,
// for the same reason `noContactDetails` reads it from there: a check holding
// its own copy of the thing it verifies passes on the day the two disagree.
//
// Rendered at 4 times the PDF's own scale. At the size the code prints, a
// module is about 2 pixels at scale 1, which is under what any decoder reads;
// 4 puts it near 8 and costs a second per document.
const QR_SCALE = 4;

// How many modules a symbol of a given version is square, which is the
// standard's own formula. Read from the decoded symbol rather than written
// down, because the address is the content source's to change: a longer one
// needs a higher version and more modules in the same box, so a constant here
// would measure a module wider than the code actually has.
//
// Measured on 2026-09-11, with 33 hardcoded: an address of 66 characters
// takes a 49-module symbol, whose true printed module is 0.371mm, and the
// check reported 0.55mm and passed. That is precisely the edit criterion 7
// promises can be made "with no other edit", so a floor that only holds for
// today's address is a floor that fails on the one change it has to survive.
const modulesOf = (version) => version * 4 + 17;

// The smallest module this will let ship, in millimetres on paper.
//
// The code is drawn at 0.47mm a module for the LinkedIn address, which is
// already small, and no check can say whether a phone reads that off a home
// printer: only a phone can, and that is an acceptance criterion of its own.
// What this floor does is narrower and worth having anyway. Below about 0.4mm
// no consumer camera reads a code at arm's length whatever the printer does,
// so a code that small has lost the address outright rather than merely made
// it awkward. It is set under the drawn size rather than at it, so a
// deliberate change to the box is a decision somebody makes rather than a
// build somebody has to fight.
const QR_MODULE_MM = 0.4;
async function qrCode() {
  const name = 'qr code';
  const profile = parseYaml(await readFile(path.join(context.content, 'profile.yaml'), 'utf8')).profile;
  // Which profile the code carries is decided once, in src/lib/networks.ts,
  // and the component that draws the code asks the same function.
  const coded = codedProfile(profile.profiles ?? []);
  if (!coded?.url) {
    throw new CheckFailure(
      name,
      'src/content/profile.yaml holds no LinkedIn profile, so this check has nothing to compare against; it must fail rather than pass over a code it cannot verify',
    );
  }

  const lines = [];
  for (const document of documents) {
    for (const locale of context.locales) {
      const file = path.join(context.dist, `${document}.${locale}.pdf`);
      let data;
      try {
        data = await readFile(file);
      } catch {
        throw new CheckFailure(name, `${path.relative(root, file)} does not exist; run \`pnpm render:pdf\` after the build`);
      }
      const task = getDocument({ data: new Uint8Array(data), standardFontDataUrl });
      let decoded;
      try {
        const pdf = await task.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: QR_SCALE });
        const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
        await page.render({ canvas, viewport }).promise;
        const pixels = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height);
        decoded = jsQR(pixels.data, pixels.width, pixels.height);
      } finally {
        await task.destroy();
      }

      if (!decoded) {
        throw new CheckFailure(
          name,
          `no QR code could be read on page 1 of ${path.basename(file)}; the code is the document's only route to the LinkedIn address on paper, so a code that will not decode has lost it`,
        );
      }
      if (decoded.data !== coded.url) {
        throw new CheckFailure(
          name,
          `the QR code on page 1 of ${path.basename(file)} decodes to "${decoded.data}", and src/content/profile.yaml says "${coded.url}"`,
        );
      }

      // How big it actually is on paper, which the decode above says nothing
      // about. The page is rasterised well above print resolution, so a code
      // far too small for any camera decodes here perfectly: measured on
      // 2026-09-11, a 6.35mm box with 0.155mm modules passed the decode, the
      // hazard check, and the browser case, all three. A check that cannot
      // fail on the one risk the spec names for this feature is not checking
      // it.
      //
      // `location` bounds the symbol by its finder patterns, so it spans the
      // modules of data and not the quiet zone around them.
      const corners = decoded.location;
      const side = Math.hypot(
        corners.topRightCorner.x - corners.topLeftCorner.x,
        corners.topRightCorner.y - corners.topLeftCorner.y,
      );
      const across = modulesOf(decoded.version);
      const module = ((side / QR_SCALE / 72) * 25.4) / across;
      if (module < QR_MODULE_MM) {
        throw new CheckFailure(
          name,
          `the QR code on page 1 of ${path.basename(file)} has modules of ${module.toFixed(2)}mm, and the floor is ${QR_MODULE_MM}mm; ` +
            'it is the only route to the LinkedIn address on paper, and a code no camera can read has lost it whatever it decodes to here',
        );
      }
      lines.push(
        `qr code: ${path.basename(file)} page 1 decodes to ${decoded.data}, ${across} modules at ${module.toFixed(2)}mm`,
      );
    }
  }
  return lines;
}

// The resume is the short document, and one page is its budget. The render step counts
// both papers as it writes, and this counts the A4 file that actually
// shipped, so the rule holds over a dist/ assembled anywhere. The remedy for
// a failure is content, as the effort's spec constrains, never a smaller type
// size.
async function resumePages() {
  const name = 'resume pages';
  const lines = [];
  const files = context.locales.flatMap((locale) => [
    path.join(context.dist, `resume.${locale}.pdf`),
    // The filled copy is the document a reader actually gets, and it is a
    // contact line longer than the published one, so the budget covers it or
    // the budget is about the wrong document.
    path.join(context.artifacts, `resume.${locale}.filled.pdf`),
  ]);
  for (const file of files) {
    let data;
    try {
      data = await readFile(file);
    } catch {
      throw new CheckFailure(name, `${path.relative(root, file)} does not exist; run \`pnpm render:pdf\` after the build`);
    }
    const task = getDocument({ data: new Uint8Array(data), standardFontDataUrl });
    let pages;
    try {
      pages = (await task.promise).numPages;
    } finally {
      await task.destroy();
    }
    // One. This read two for a day, between 2026-09-10 and 2026-09-11: the
    // same document was one page under the fonts Windows resolves for the
    // system stack and two under the Linux runner's, so the budget was widened
    // to match the renderer. What that produced was a two-page short resume,
    // which is the one thing a short resume may not be, so the content was cut
    // instead and the budget came back. `scripts/render-pdf.mjs` carries the
    // other half, a floor under the free height on the last page, because a
    // page count cannot see a document that fits by a hair here and does not
    // fit on the runner.
    if (pages > 1) {
      throw new CheckFailure(
        name,
        `${path.relative(root, file)} has ${pages} pages, expected 1; shorten the content, never the type size`,
      );
    }
    lines.push(`resume pages: ${path.basename(file)} is ${pages} ${pages === 1 ? 'page' : 'pages'}`);
  }
  return lines;
}

// Where an expected item sits in one extracted line, searching from `from`,
// or -1. The comparison is exact unless the expectation says otherwise, which
// only the name does.
function indexIn(line, item, from, caseless) {
  const needle = squash(item);
  return caseless ? line.toLowerCase().indexOf(needle.toLowerCase(), from) : line.indexOf(needle, from);
}

// The first line at or after `cursor` holding an item at all, or -1.
function findItem(found, cursor, item, caseless) {
  return found.findIndex((line, i) => i >= cursor && indexIn(line, item, 0, caseless) !== -1);
}

// The line on which a group finishes, searching from `cursor`, or -1. Each
// item follows the one before it on the same line, or opens the next one;
// nothing may be skipped over, so a fact that moved out of order fails here.
function matchGroup(found, cursor, group) {
  for (let start = cursor; start < found.length; start += 1) {
    let line = start;
    let from = 0;
    let matched = true;
    for (const item of group.items) {
      let at = indexIn(found[line], item, from, group.caseless);
      if (at === -1 && line + 1 < found.length) {
        line += 1;
        from = 0;
        at = indexIn(found[line], item, 0, group.caseless);
      }
      if (at === -1) {
        matched = false;
        break;
      }
      from = at + squash(item).length;
    }
    if (matched) return line;
  }
  return -1;
}

// Every file under a directory, recursively, as paths relative to it with
// forward slashes, so a route reads the same on every platform.
async function walk(directory, prefix = '') {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch {
    return [];
  }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) files.push(...(await walk(path.join(directory, entry.name), relative)));
    else files.push(relative);
  }
  return files;
}

// The routes one language publishes, as "/", "/work/", and so on: every
// index.html under dist/<locale>/, without the locale prefix.
async function routes(locale) {
  const files = await walk(path.join(context.dist, locale));
  return files
    .filter((file) => file === 'index.html' || file.endsWith('/index.html'))
    .map((file) => `/${file.slice(0, -'index.html'.length)}`);
}

// Every HTML file of the site, as paths relative to dist/.
async function htmlFiles() {
  return (await walk(context.dist)).filter((file) => file.endsWith('.html'));
}

// The attributes of the first tag with this name, as a map. The pages are
// generated, so a regular expression over the tag is enough.
function attributesOf(html, tag) {
  const match = html.match(new RegExp(`<${tag}\\b([^>]*)>`, 'i'));
  if (!match) return null;
  const attributes = {};
  for (const [, name, , value] of match[1].matchAll(/([\w:-]+)(?:=(["'])(.*?)\2)?/g)) {
    attributes[name.toLowerCase()] = value ?? '';
  }
  return attributes;
}

// The content of the <meta> carrying this name or property, or null.
function metaContent(html, key, value) {
  for (const [, attributes] of html.matchAll(/<meta\b([^>]*)>/gi)) {
    const map = attributesOf(`<meta${attributes}>`, 'meta');
    if (map?.[key] === value) return map.content ?? '';
  }
  return null;
}

// A page that asks not to be indexed: the root redirect to /en/, which is not
// a page of the site so much as its doorway. The checks over titles and the
// sitemap leave it out, on purpose.
function isNoindex(html) {
  return metaContent(html, 'name', 'robots')?.includes('noindex') ?? false;
}

// Every route of one language exists in the other, and each page's <html>
// says which language it is and which way it reads.
async function localeTwins() {
  const name = 'locale twins';
  const [en, ar] = await Promise.all(context.locales.map(routes));
  for (const route of en) {
    if (!ar.includes(route)) throw new CheckFailure(name, `dist/en${route}index.html has no twin at dist/ar${route}index.html`);
  }
  for (const route of ar) {
    if (!en.includes(route)) throw new CheckFailure(name, `dist/ar${route}index.html has no twin at dist/en${route}index.html`);
  }
  if (en.length === 0) throw new CheckFailure(name, 'dist/en/ has no index.html under it; was the site built?');

  for (const locale of context.locales) {
    const { dir } = localeInfo(locale);
    for (const route of await routes(locale)) {
      const file = `dist/${locale}${route}index.html`;
      const html = await readFile(path.join(context.root, file), 'utf8');
      const attributes = attributesOf(html, 'html');
      if (!attributes) throw new CheckFailure(name, `${file} has no <html> tag`);
      if (attributes.lang !== locale) {
        throw new CheckFailure(name, `${file}: <html> has lang="${attributes.lang ?? ''}", expected lang="${locale}"`);
      }
      if (attributes.dir !== dir) {
        throw new CheckFailure(name, `${file}: <html> has dir="${attributes.dir ?? ''}", expected dir="${dir}"`);
      }
    }
  }
  return [`locale twins: ${en.length} routes in each language, lang and dir as expected: ${en.join(' ')}`];
}

// No link that goes nowhere: an `href=""` or an `href="undefined"` is what a
// template prints when an optional link was read without checking it.
async function hrefs() {
  const name = 'hrefs';
  const files = await htmlFiles();
  let count = 0;
  for (const file of files) {
    const html = await readFile(path.join(context.dist, file), 'utf8');
    const bad = html.match(/href=(?:""|''|"undefined"|'undefined')/);
    if (bad) throw new CheckFailure(name, `dist/${file} contains ${bad[0]}; a missing link is omitted, never printed empty`);
    count += (html.match(/\bhref=/g) ?? []).length;
  }
  return [`hrefs: ${count} links in ${files.length} pages, none empty or undefined`];
}

// Every root-relative path the site publishes is under its base path. GitHub
// Pages serves this repository as a project site under the repository's
// name, so a link, a stylesheet, a font, or a refresh target written without
// the base answers 404 there while working in a build served at the root.
// The base comes from astro.config.mjs; with `base: '/'` the check asks for
// nothing.
async function basePaths() {
  const name = 'base paths';
  const files = (await walk(context.dist)).filter((file) => ['.html', '.css'].includes(path.extname(file)));
  let count = 0;
  for (const file of files) {
    const text = await readFile(path.join(context.dist, file), 'utf8');
    const found = [
      ...[...text.matchAll(/\b(?:href|src)=["'](\/[^"']*)["']/g)].map((match) => match[1]),
      ...[...text.matchAll(/url\(\s*["']?(\/[^"')]*)["']?\s*\)/g)].map((match) => match[1]),
      ...[...text.matchAll(/content=["']\d+;url=(\/[^"']*)["']/g)].map((match) => match[1]),
    ];
    for (const value of found) {
      if (!value.startsWith(context.prefix)) {
        throw new CheckFailure(name, `dist/${file} refers to ${value}, which is outside the site's base path ${context.prefix}`);
      }
    }
    count += found.length;
  }
  return [`base paths: ${count} root-relative paths in ${files.length} files, all under ${context.prefix}`];
}

// Every page a visitor lands on carries a title, a description, and the
// Open Graph fields a social preview reads. Titles are unique across the
// site, since two pages sharing one are one page to a search result.
async function metadata() {
  const name = 'metadata';
  const required = ['og:title', 'og:description', 'og:url', 'og:locale'];
  const titles = new Map();
  let count = 0;
  for (const file of await htmlFiles()) {
    const html = await readFile(path.join(context.dist, file), 'utf8');
    if (isNoindex(html)) continue;
    count += 1;
    const title = html.match(/<title>([^<]*)<\/title>/i)?.[1].trim() ?? '';
    if (!title) throw new CheckFailure(name, `dist/${file} has no <title>, or an empty one`);
    if (titles.has(title)) {
      throw new CheckFailure(name, `dist/${file} has the title "${title}", which dist/${titles.get(title)} already carries`);
    }
    titles.set(title, file);
    const description = metaContent(html, 'name', 'description');
    if (!description) throw new CheckFailure(name, `dist/${file} has no <meta name="description">, or an empty one`);
    for (const property of required) {
      if (!metaContent(html, 'property', property)) {
        throw new CheckFailure(name, `dist/${file} has no <meta property="${property}">, or an empty one`);
      }
    }
  }
  return [`metadata: ${count} pages with a unique title, a description, and ${required.join(', ')}`];
}

// The <loc> values of a sitemap file.
function locations(xml) {
  return [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1].trim());
}

// sitemap-index.xml points at sitemaps that exist, and between them they list
// every page of both languages and nothing else. The root redirect is
// noindex and stays out.
async function sitemap() {
  const name = 'sitemap';
  const indexFile = 'sitemap-index.xml';
  let index;
  try {
    index = await readFile(path.join(context.dist, indexFile), 'utf8');
  } catch {
    throw new CheckFailure(name, `dist/${indexFile} does not exist`);
  }
  const sitemaps = locations(index);
  if (sitemaps.length === 0) throw new CheckFailure(name, `dist/${indexFile} names no sitemap`);

  const listed = new Set();
  for (const url of sitemaps) {
    if (!url.startsWith(context.siteRoot)) {
      throw new CheckFailure(name, `dist/${indexFile} points at ${url}, which is not under the site's root ${context.siteRoot}`);
    }
    const file = url.slice(context.siteRoot.length);
    let xml;
    try {
      xml = await readFile(path.join(context.dist, file), 'utf8');
    } catch {
      throw new CheckFailure(name, `dist/${indexFile} points at ${url}, but dist/${file} does not exist`);
    }
    for (const location of locations(xml)) listed.add(location);
  }

  const expected = new Set();
  for (const locale of context.locales) {
    for (const route of await routes(locale)) expected.add(`${context.siteRoot}${locale}${route}`);
  }
  for (const url of expected) {
    if (!listed.has(url)) throw new CheckFailure(name, `${url} is a page but no sitemap under dist/${indexFile} lists it`);
  }
  for (const url of listed) {
    if (!expected.has(url)) throw new CheckFailure(name, `a sitemap under dist/${indexFile} lists ${url}, which is not a page`);
  }

  // The site also publishes /sitemap.xml: it must exist and list every page
  // itself, not only point at the index.
  const aliasFile = 'sitemap.xml';
  let alias;
  try {
    alias = await readFile(path.join(context.dist, aliasFile), 'utf8');
  } catch {
    throw new CheckFailure(name, `dist/${aliasFile} does not exist`);
  }
  const aliased = new Set(locations(alias));
  for (const url of expected) {
    if (!aliased.has(url)) throw new CheckFailure(name, `${url} is a page but dist/${aliasFile} does not list it`);
  }
  for (const url of aliased) {
    if (!expected.has(url)) throw new CheckFailure(name, `dist/${aliasFile} lists ${url}, which is not a page`);
  }
  return [`sitemap: ${sitemaps.length} sitemap(s) listing all ${expected.size} pages, and ${aliasFile} lists them all`];
}

// robots.txt permits indexing: no line disallows the whole site.
async function robots() {
  const name = 'robots';
  let text;
  try {
    text = await readFile(path.join(context.dist, 'robots.txt'), 'utf8');
  } catch {
    throw new CheckFailure(name, 'dist/robots.txt does not exist');
  }
  const disallow = text.split(/\r?\n/).find((line) => /^\s*Disallow:\s*\/\s*$/i.test(line));
  if (disallow) throw new CheckFailure(name, `dist/robots.txt has the line "${disallow.trim()}", which forbids indexing the site`);
  // The sitemap line must name the sitemap where the site actually publishes
  // it, under the base path.
  const sitemapLine = `Sitemap: ${context.siteRoot}sitemap-index.xml`;
  if (!text.split(/\r?\n/).some((line) => line.trim() === sitemapLine)) {
    throw new CheckFailure(name, `dist/robots.txt has no line "${sitemapLine}"; the robots.txt endpoint must name the sitemap under the site's base path`);
  }
  return [`robots.txt: no "Disallow: /" line, and "${sitemapLine}"`];
}

// No identifier in anything the site publishes: every HTML, JSON, XML, and
// text file under dist/, and the text of each PDF where pdftotext is on the
// PATH. The patterns are scripts/identifiers.mjs.
//
// A PDF that is a scanned image has no text layer, so extraction yields
// nothing and the patterns have nothing to match; most of the course
// certificates are of that kind. The line says how many PDFs held text, so a
// green run never reads as a scan of documents it could not read. What is
// done about those documents is the content README's to say
// (src/content/README.md, "The certificate documents"); this check only
// reports that it could not read them.
async function identifiers() {
  const name = 'identifiers';
  const textual = ['.html', '.json', '.xml', '.txt'];
  const files = (await walk(context.dist)).filter((file) => textual.includes(path.extname(file)));
  for (const file of files) {
    const text = await readFile(path.join(context.dist, file), 'utf8');
    const found = identifiersIn(text);
    if (found.length > 0) throw new CheckFailure(name, `dist/${file} matches the pattern of a ${found.join(' and a ')}`);
  }
  const pdfs = (await walk(context.dist)).filter((file) => file.endsWith('.pdf'));
  let extracted = 0;
  let withText = 0;
  for (const file of pdfs) {
    const text = await extractText(path.join(context.dist, file));
    if (text === null) break;
    extracted += 1;
    if (text.trim().length > 0) withText += 1;
    const found = identifiersIn(text);
    if (found.length > 0) throw new CheckFailure(name, `the text of dist/${file} matches the pattern of a ${found.join(' and a ')}`);
  }
  let pdfNote = '';
  if (pdfs.length > 0 && extracted < pdfs.length) {
    pdfNote = ` (pdftotext is not on the PATH, so ${pdfs.length} PDFs were not read)`;
  } else if (pdfs.length > 0) {
    const imageOnly = pdfs.length - withText;
    pdfNote =
      imageOnly === 0
        ? ` and the text of ${pdfs.length} PDFs`
        : ` and the text of ${withText} of ${pdfs.length} PDFs; ${imageOnly} hold no text layer this scan can read`;
  }
  return [`identifiers: no pattern matches in ${files.length} text files${pdfNote}`];
}

// The language gap report: every per-language field whose Arabic is missing,
// in the same words the build prints. It is recomputed here from the content
// with the site's own fallback (src/lib/localized.ts), because the build's
// line went to a log this script cannot read back; the rule and the wording
// are the one function, so the two reports cannot differ.
async function gaps() {
  const walkValue = (value, collection, id, field) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => walkValue(item, collection, id, `${field}[${index}]`));
    } else if (value && typeof value === 'object') {
      if (typeof value.en === 'string') pick(value, 'ar', { collection, id, field });
      else for (const [key, item] of Object.entries(value)) walkValue(item, collection, id, field ? `${field}.${key}` : key);
    }
  };
  const profile = parseYaml(await readFile(path.join(context.content, 'profile.yaml'), 'utf8'));
  walkValue(profile.profile, 'profile', 'profile', '');
  for (const collection of ['projects', 'experience', 'education', 'certificates', 'skills', 'languages']) {
    const dir = path.join(context.content, collection);
    for (const file of (await readdir(dir)).filter((entry) => entry.endsWith('.yaml')).sort()) {
      const entry = parseYaml(await readFile(path.join(dir, file), 'utf8'));
      // A hidden or unfinished project is never rendered, so the build
      // records no gap for it.
      if (collection === 'projects' && !isShown(entry)) continue;
      walkValue(entry, collection, file.slice(0, -'.yaml'.length), '');
    }
  }
  return [gapReport()];
}

// Nothing on the site claims more than the content states about a degree. The
// site renders the status as authored and never reaches past it, so the words
// "graduated" and "awarded" appear on no page: they name a ceremony and a
// conferral, and no value in the status vocabulary claims either.
async function noOverclaim() {
  const name = 'no overclaim';
  const words = /\b(graduated|awarded)\b/i;
  const files = await htmlFiles();
  for (const file of files) {
    const html = await readFile(path.join(context.dist, file), 'utf8');
    const hit = html.match(words);
    if (hit) throw new CheckFailure(name, `dist/${file} contains "${hit[0]}", which claims more than the authored status`);
  }
  return [`no overclaim: neither "graduated" nor "awarded" in ${files.length} pages`];
}

// Neither document page carries the layout hazards resume parsers document:
// no table, no image, no graphic but the one the header is allowed, and the
// contact block in the flow of the document rather than in a positioned
// header or footer.
//
// The graphic clause is narrower than it reads and deliberately so. Four
// efforts held "no image" outright, because a parser cannot read one; the QR
// code carrying a profile address is the single exception Saud chose on
// 2026-09-11 with that cost stated, GitHub's address then and LinkedIn's
// since 2026-09-22. So this refuses every <svg> inside the
// document's article except the one marked `data-qr-code`, rather than
// refusing none of them: an inline <svg> is not an <img>, so a check that
// only looked for <img> would go on reporting "no image" while the document
// carried a second graphic nobody agreed to.
//
// The fourth hazard, an element of the document itself being positioned, is
// asserted in tests/resume.spec.ts instead. A computed `position` needs
// layout and this reads the built HTML as text, and the assertion has to be
// scoped to the document rather than the page: the site's accessible names
// are `sr-only`, which is `position: absolute`, and the download form is a
// `<dialog>`.
async function documentHazards() {
  const name = 'document hazards';
  const lines = [];
  for (const document of documents) {
    for (const locale of context.locales) {
      const route = `${locale}/${document}/index.html`;
      let html;
      try {
        html = await readFile(path.join(context.dist, locale, document, 'index.html'), 'utf8');
      } catch {
        throw new CheckFailure(name, `dist/${route} does not exist`);
      }
      for (const tag of ['table', 'img']) {
        if (new RegExp(`<${tag}[\\s>]`, 'i').test(html)) {
          throw new CheckFailure(name, `dist/${route} contains a <${tag}> element`);
        }
      }
      // The contact block used to prove itself by its `mailto:`. The document
      // publishes no address now, so the proof is the block's own marker: a
      // contact list inside <main> is in the flow, and one moved into a
      // positioned header or footer is not, which is the hazard.
      const main = html.match(/<main[\s>][\s\S]*?<\/main>/i)?.[0] ?? '';
      if (!/data-cv-contact/.test(main)) {
        throw new CheckFailure(name, `dist/${route} has no [data-cv-contact] inside <main>; the contact block must be in the flow of the document`);
      }
      // Every <svg> inside the document's article, and how many of them are
      // the code. The article rather than <main>, because the page's own
      // chrome above the document carries icons that are none of this
      // check's business.
      const article = main.match(/<article[\s>][\s\S]*?<\/article>/i)?.[0] ?? '';
      const graphics = article.match(/<svg[\s>][^>]*>/gi) ?? [];
      const codes = graphics.filter((graphic) => /\bdata-qr-code\b/.test(graphic));
      if (graphics.length > codes.length) {
        throw new CheckFailure(
          name,
          `dist/${route} carries ${graphics.length - codes.length} graphic(s) in the document besides the QR code; a resume parser reads none of them, and the code is the one exception this repository agreed to`,
        );
      }
      if (codes.length > 1) {
        throw new CheckFailure(name, `dist/${route} carries ${codes.length} QR codes; the header has room for one`);
      }
      lines.push(
        `document hazards: ${locale}/${document}/ has no table or image, one QR code and no other graphic, and its contact block is in the flow`,
      );
    }
  }
  return lines;
}

// Nothing the site publishes carries a contact detail. This is the check the
// whole effort rests on, and docs/development.md says why the site works this
// way.
//
// It reads the address from the content source rather than from a literal
// here. A check that greps for an address the content no longer holds finds
// nothing and reports success, and the failure would be invisible; reading it
// from src/content/profile.yaml is what keeps this true if the address ever
// changes, and an empty field fails loudly rather than quietly matching
// nothing. Phone shapes come from scripts/identifiers.mjs, which is where this
// repository writes them once.
async function noContactDetails() {
  const name = 'no contact details';
  const profile = parseYaml(await readFile(path.join(context.content, 'profile.yaml'), 'utf8')).profile;
  const email = typeof profile?.email === 'string' ? profile.email.trim() : '';
  if (email === '') {
    throw new CheckFailure(
      name,
      'src/content/profile.yaml holds no email, so this check has nothing to look for; it must fail rather than pass over an address it cannot see',
    );
  }

  // A published file may carry neither the address itself nor a link that
  // would reveal it, and a phone number is refused by shape because none is
  // ever authored.
  // `exact` marks the two rules that look for a literal string, which are the
  // two safe to run over bytes that are not text.
  const forbidden = [
    { what: `the email address ${email}`, exact: true, test: (text) => text.includes(email) },
    { what: 'a mailto: link', exact: true, test: (text) => text.includes('mailto:') },
    { what: 'something shaped like a phone number', test: (text) => identifiersIn(text).length > 0 },
  ];

  // Every file, because the criterion says every file: the pages, the JSON
  // documents, the sitemap, the stylesheet, the bundled fonts, the certificate
  // previews, and every PDF rather than the four documents by name.
  //
  // A font or an image is read as latin1 and asked only whether the address or
  // a mailto: is in its bytes. Those are exact strings and cannot match by
  // accident; the phone rule matches by shape, and a shape run over compressed
  // binary matches noise. Measured rather than assumed on 2026-09-10: over the
  // 29 non-text files this tree publishes, the shape rules hit once, inside
  // the bold Arabic font file, which is a font and not a student number. It
  // was NotoNaskhArabic-Bold.ttf when that was measured on 2026-09-10 and is
  // the woff2 of the same face now.
  //
  // So the shape half of this check does not reach binary files, and nothing
  // else covers them either: `identifiers` above reads the same text kinds and
  // the PDFs. That is a real gap against the criterion's words and it is left
  // open deliberately, because closing it means either a permanently failing
  // check or an exemption list, and because no phone number is authored
  // anywhere in this repository for a binary to carry.
  const textual = ['.html', '.json', '.xml', '.txt', '.css', '.js', '.svg', '.md'];
  const files = await walk(context.dist);
  let pdfs = 0;
  let read = 0;
  for (const file of files) {
    const full = path.join(context.dist, file);
    const extension = path.extname(file);
    let text;
    let rules = forbidden;
    if (extension === '.pdf') {
      pdfs += 1;
      text = await extractText(full);
      if (text === null) continue;
      read += 1;
    } else if (textual.includes(extension)) {
      text = await readFile(full, 'utf8');
    } else {
      text = await readFile(full, 'latin1');
      rules = forbidden.filter((rule) => rule.exact);
    }
    const hit = rules.find((rule) => rule.test(text));
    if (hit) {
      // Which is worth the four words: a PDF is judged on the text it
      // extracts, and every other file on the bytes it is.
      const where = extension === '.pdf' ? `the text of dist/${file}` : `dist/${file}`;
      throw new CheckFailure(name, `${where} carries ${hit.what}`);
    }
  }

  // The README is what GitHub renders on the profile page, so it is published
  // in every sense that matters even though it is not under dist/.
  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const hit = forbidden.find((rule) => rule.test(readme));
  if (hit) throw new CheckFailure(name, `README.md carries ${hit.what}`);

  const pdfNote =
    pdfs === 0
      ? ''
      : read === pdfs
        ? `, the text of ${pdfs} PDFs among them`
        : ` (pdftotext is not on the PATH, so ${pdfs} PDFs were not read)`;
  return [`no contact details: no address, no mailto:, no number in ${files.length} published files${pdfNote}, or README.md`];
}

// The nationality is a fact for the two documents and for nothing else. The
// JSON Resume documents are checked by key in `jsonResume` above; the pages
// and the README are checked here, and by element rather than by string,
// because the authored English value is "Saudi" and it occurs in "Saudi
// Arabia", in a university's name, and in a project summary, all of them true
// content. Rendered as its own item the value stands alone between its tags,
// which is what the documents do and what nothing else may do.
async function nationalityWhereItBelongs() {
  const name = 'nationality';
  const profile = parseYaml(await readFile(path.join(context.content, 'profile.yaml'), 'utf8')).profile;
  const lines = [];

  for (const locale of context.locales) {
    const value = profile.nationality?.[locale] ?? profile.nationality?.en;
    if (!value) {
      throw new CheckFailure(name, `src/content/profile.yaml holds no nationality for ${locale}`);
    }
    const alone = `>${value}<`;

    for (const document of documents) {
      const route = `${locale}/${document}/index.html`;
      const html = await readFile(path.join(context.dist, locale, document, 'index.html'), 'utf8');
      if (!html.includes(alone)) {
        throw new CheckFailure(name, `dist/${route} does not show the nationality as authored`);
      }
    }

    const home = await readFile(path.join(context.dist, locale, 'index.html'), 'utf8');
    if (home.includes(alone)) {
      throw new CheckFailure(name, `dist/${locale}/index.html shows the nationality, which belongs to the two documents alone`);
    }
    lines.push(`nationality: ${locale} shows "${value}" on both documents and not on the home page`);
  }

  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  const { current } = await readmeWithProfile();
  const block = current.slice(current.indexOf('<!-- profile -->'));
  for (const locale of context.locales) {
    const value = profile.nationality?.[locale] ?? profile.nationality?.en;
    if (new RegExp(`(^|[\\n:*\\-] *)${value}( *$|[\\n])`, 'm').test(block) || readme.includes(`Nationality`)) {
      throw new CheckFailure(name, 'README.md carries the nationality, which belongs to the two documents alone');
    }
  }
  lines.push('nationality: README.md carries none');
  return lines;
}

// A printed level can carry a score's parentheses, so it is escaped before it
// goes into the README pattern below.
function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// The languages are a fact for the two documents and the JSON Resume
// documents, and for nothing else, as the nationality is. Checked the same
// way: the level as the page prints it, score and year included, stands
// alone between its tags on both documents, and neither that nor the bare
// level does on the home page or in the README. By element rather than by
// string for the same reason as above: "Native" could one day appear inside
// a sentence somewhere true, and only the standalone item is the fact. The
// README is read whole rather than by its profile block, since a level line
// has no other home there.
async function languagesWhereTheyBelong() {
  const name = 'languages';
  const languages = (await visibleEntries('languages')).map((entry) => entry.data).sort(byOrderThenName);
  const lines = [];

  const readme = await readFile(path.join(root, 'README.md'), 'utf8');
  for (const locale of context.locales) {
    const levels = languages.map((data) => data.level?.[locale] ?? data.level?.en);
    const printed = languages.map((data, index) => levelLine(levels[index], data.test, strings[locale].listSeparator));
    if (levels.some((level) => !level)) {
      throw new CheckFailure(name, `src/content/languages/ holds an entry with no level for ${locale}`);
    }

    for (const document of documents) {
      const route = `${locale}/${document}/index.html`;
      const html = await readFile(path.join(context.dist, locale, document, 'index.html'), 'utf8');
      const missing = printed.find((line) => !html.includes(`>${line}<`));
      if (missing) {
        throw new CheckFailure(name, `dist/${route} does not show "${missing}" as authored`);
      }
    }

    const home = await readFile(path.join(context.dist, locale, 'index.html'), 'utf8');
    const leaked = [...levels, ...printed].find((line) => home.includes(`>${line}<`));
    if (leaked) {
      throw new CheckFailure(name, `dist/${locale}/index.html shows "${leaked}", which belongs to the two documents alone`);
    }
    const inReadme = [...levels, ...printed].find((line) =>
      new RegExp(`(^|[\\n:*\\-] *)${escapeRegExp(line)}( *$|[\\n])`, 'm').test(readme),
    );
    if (inReadme) {
      throw new CheckFailure(name, `README.md carries "${inReadme}", which belongs to the two documents alone`);
    }
    lines.push(`languages: ${locale} shows ${printed.map((line) => `"${line}"`).join(' and ')} on both documents and not on the home page`);
  }
  lines.push('languages: README.md carries none');
  return lines;
}

// The README's profile block is written from the content source and the
// config (scripts/readme-profile.mjs), so who Saud is stays authored once; a
// README behind them fails here rather than drifting on the profile page.
async function readmeProfile() {
  const name = 'readme profile';
  const { current, next } = await readmeWithProfile();
  if (current !== next) {
    throw new CheckFailure(name, 'README.md is behind src/content/ or astro.config.mjs; run `pnpm readme` and commit the result');
  }
  return ['readme profile: README.md carries the profile as src/content/ states it'];
}

const checks = [jsonResume, documentPdfs, qrCode, resumePages, localeTwins, hrefs, basePaths, metadata, sitemap, robots, identifiers, noContactDetails, nationalityWhereItBelongs, languagesWhereTheyBelong, gaps, noOverclaim, documentHazards, readmeProfile];

for (const check of checks) {
  try {
    const lines = await check(context);
    for (const line of lines) console.log(line);
  } catch (error) {
    if (error instanceof CheckFailure) {
      console.error(`check-dist: ${error.check}: ${error.message}`);
    } else {
      console.error(`check-dist: ${check.name}: ${error.stack ?? error}`);
    }
    process.exit(1);
  }
}
