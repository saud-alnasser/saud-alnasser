import { getCollection, getEntry, type CollectionEntry } from 'astro:content';
import { strings, type Locale } from './i18n';
import { levelLine } from './languages';
import { localized, type Localized } from './localized';
import {
  byDateDescending,
  byOrderThenName,
  byOrderThenStartDescending,
  byStartDescending,
} from './order';
import { absolute } from './paths';
import { isShown } from './shown';

// The mapper from the content collections to a JSON Resume document for one
// language. The pages and the document component read the same collections
// through the same fallback and the same ordering, so a value changed in one
// content file changes here without a second edit, and a missing Arabic text
// shows up in the build's gap report whichever output rendered it first.
//
// Custom keys (`type` on a work entry, `status` on an education entry,
// `language` under `meta`) live inside section entries or inside `meta`, never
// at the top level: every 1.x schema permits them there, and the v1.0.0
// document that the project's own samples still cite forbids them at the root.

// The schema this document is written against. The property set is 1.3.1's,
// published from the monorepo; the archived repository's v1.0.0 URL, which the
// package's samples cite, is a stricter, older document.
export const schemaUrl =
  'https://raw.githubusercontent.com/jsonresume/jsonresume.org/master/packages/schema/schema.json';
const schemaVersion = 'v1.3.1';

// Read once per build, so both language documents carry the same time.
const buildTime = new Date();

// A key with an undefined value is dropped by JSON.stringify, so the emitted
// document omits absent optional fields rather than carrying null or "".
function compact<T extends Record<string, unknown>>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value !== undefined)) as T;
}

type Project = CollectionEntry<'projects'>;
type Experience = CollectionEntry<'experience'>;
type Education = CollectionEntry<'education'>;
type Certificate = CollectionEntry<'certificates'>;
type Skill = CollectionEntry<'skills'>;
type Language = CollectionEntry<'languages'>;

// A project's public link: `live` first, then `repository`, and only for a
// public project. A described project carries no `url` key at all, because an
// empty string fails the schema's `format: uri`.
function projectUrl(project: Project): string | undefined {
  if (project.data.visibility !== 'public') return undefined;
  return project.data.links?.live ?? project.data.links?.repository;
}

function mapProject(project: Project, locale: Locale) {
  const { data } = project;
  const text = localized(locale, 'projects', project.id);
  return compact({
    name: data.name,
    description: text('summary', data.summary),
    roles: [text('role', data.role)],
    keywords: data.technologies,
    startDate: data.period.start,
    endDate: data.period.end,
    url: projectUrl(project),
  });
}

function mapWork(entry: Experience, locale: Locale) {
  const { data } = entry;
  const text = localized(locale, 'experience', entry.id);
  return compact({
    name: text('organisation', data.organisation),
    position: text('position', data.position),
    location: text('location', data.location),
    startDate: data.period.start,
    endDate: data.period.end,
    summary: text('summary', data.summary),
    highlights: data.highlights.map((highlight: Localized, i: number) => text(`highlights[${i}]`, highlight)),
    // Custom key: `employment` or `training`. The schema has no field for the
    // nature of a placement, so it is carried here beside `position`.
    type: data.kind,
  });
}

function mapEducation(entry: Education, locale: Locale) {
  const { data } = entry;
  const text = localized(locale, 'education', entry.id);
  return compact({
    institution: text('institution', data.institution),
    area: text('area', data.area),
    studyType: text('studyType', data.studyType),
    startDate: data.period.start,
    // The term the course work finished in; `status` below says where the
    // certificate stands.
    endDate: data.period.end,
    courses: data.courses?.length
      ? data.courses.map((course: Localized, i: number) => text(`courses[${i}]`, course))
      : undefined,
    // Custom key: the academic status as authored, never reworded.
    status: data.status,
  });
}

function mapCertificate(entry: Certificate, locale: Locale) {
  const { data } = entry;
  const text = localized(locale, 'certificates', entry.id);
  return compact({
    name: text('name', data.name),
    issuer: data.issuer,
    date: data.date,
    url: data.url,
  });
}

function mapSkill(entry: Skill, locale: Locale) {
  const { data } = entry;
  const text = localized(locale, 'skills', entry.id);
  return compact({
    name: text('name', data.name),
    level: data.level ? text('level', data.level) : undefined,
    keywords: data.keywords,
  });
}

// `fluency` is the schema's one free string for a level, so it carries what
// the document page prints after the language's name, score and year
// included, built by the same function so the two cannot drift.
function mapLanguage(entry: Language, locale: Locale) {
  const { data } = entry;
  const text = localized(locale, 'languages', entry.id);
  return {
    language: text('name', data.name),
    fluency: levelLine(text('level', data.level), data.test, strings[locale].listSeparator),
  };
}

// The document for one language. `site` is Astro.site, the origin the site is
// served from; the site's own address and the document's canonical address
// are derived from it under the base path.
export async function resumeFor(locale: Locale, site: URL) {
  const profile = await getEntry('profile', 'profile');
  if (!profile) throw new Error('resume: the profile entry is missing from src/content/profile.yaml');

  const [projects, experience, education, certificates, skills, languages] = await Promise.all([
    getCollection('projects', ({ data }) => isShown(data)),
    getCollection('experience'),
    getCollection('education'),
    getCollection('certificates'),
    getCollection('skills'),
    getCollection('languages'),
  ]);

  // The same orders the pages use (src/lib/order.ts): work, education, and
  // certificates newest first, the undated certificates last; projects,
  // skills, and languages by authored order.
  experience.sort((a, b) => byStartDescending(a.data, b.data));
  education.sort((a, b) => byStartDescending(a.data, b.data));
  certificates.sort((a, b) => byDateDescending(a.data, b.data));
  projects.sort((a, b) => byOrderThenStartDescending(a.data, b.data));
  skills.sort((a, b) => byOrderThenName(a.data, b.data));
  languages.sort((a, b) => byOrderThenName(a.data, b.data));

  const { data: person } = profile;
  const text = localized(locale, 'profile', profile.id);

  return {
    $schema: schemaUrl,
    basics: {
      name: text('name', person.name),
      label: text('label', person.label),
      // No `email`, and no phone: the site publishes no contact detail in
      // any file, this document included. No field of the schema is
      // required, so the document still validates without them.
      url: absolute('/', site),
      summary: text('summary', person.summary),
      // The content source carries one localized location text, so it goes in
      // `city` as written; there is no separate region or country code to map.
      location: { city: text('location', person.location) },
      profiles: person.profiles.map(({ network, username, url }) => ({ network, username, url })),
    },
    work: experience.map((entry) => mapWork(entry, locale)),
    education: education.map((entry) => mapEducation(entry, locale)),
    certificates: certificates.map((entry) => mapCertificate(entry, locale)),
    skills: skills.map((entry) => mapSkill(entry, locale)),
    languages: languages.map((entry) => mapLanguage(entry, locale)),
    projects: projects.map((entry) => mapProject(entry, locale)),
    meta: {
      canonical: absolute(`/${locale}/resume.json`, site),
      version: schemaVersion,
      // YYYY-MM-DDThh:mm:ss, the form the schema's description names, in UTC.
      lastModified: buildTime.toISOString().slice(0, 19),
      // Custom key: the language of every text field in this document.
      language: locale,
    },
  };
}

export type Resume = Awaited<ReturnType<typeof resumeFor>>;
