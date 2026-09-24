// The one place a technology's name meets its mark. A project's
// technologies and a skill group's keywords are written in the content as
// plain names; the badge that shows one asks here whether it carries a mark,
// and draws the name alone where it does not.
//
// The marks are Simple Icons' (https://simpleicons.org), read from the
// `simple-icons` package at build time; nothing of it reaches the browser
// but the path of each mark a page draws, inline. Each is one monochrome
// path, drawn here in the text colour and never in brand colours.
//
// A name maps to a mark only where the mark passes the rule decided in
// .aep/efforts/31-portfolio-rework/plan.md, decision 3, and
// tests/technologies.test.mjs holds the rule against the package's own
// licence data on every run:
//
// - no licence recorded, or MIT or BSD: mapped;
// - CC BY or CC BY-SA: mapped, and credited by name, licence, and source in
//   the footer, which reads `credits()`;
// - any NC or ND licence: not mapped, so the name stands alone;
// - absent from the set: not mapped, and a mark is never borrowed from
//   another product, since a badge drawing it would name the wrong thing;
// - guidelines recorded: read before the mark is mapped, and a mark whose
//   guidelines forbid a one-colour reference is not mapped. What each said is
//   in .aep/efforts/31-portfolio-rework/evidence/research/logo-guidelines.md.
//
// A name not listed at all, a practice such as "Refactoring" or a technology
// only a hidden project names, is a badge with no mark.

import {
  siBevy,
  siCss,
  siDocker,
  siDrizzle,
  siGit,
  siGithubactions,
  siGodotengine,
  siHtml5,
  siJavascript,
  siPhp,
  siRust,
  siSolid,
  siSupabase,
  siSvelte,
  siTailwindcss,
  siTurso,
  siTypescript,
} from 'simple-icons';
import type { SimpleIcon } from 'simple-icons';

// Each name exactly as the content spells it, against its mark, or against
// null with the reason it has none.
export const marks: Record<string, SimpleIcon | null> = {
  Bevy: siBevy,
  CSS: siCss,
  Docker: siDocker,
  'Drizzle ORM': siDrizzle,
  Git: siGit,
  'GitHub Actions': siGithubactions,
  Godot: siGodotengine,
  HTML: siHtml5,
  JavaScript: siJavascript,
  PHP: siPhp,
  Rust: siRust,
  SolidJS: siSolid,
  Supabase: siSupabase,
  Svelte: siSvelte,
  'Tailwind CSS': siTailwindcss,
  Turso: siTurso,
  TypeScript: siTypescript,
  // CC BY-NC-ND 4.0, which a portfolio's use does not clearly fall inside.
  Tauri: null,
  // Guidelines that rule out a one-colour reference: Node.js's forbid
  // colour variations of the logo, PostgreSQL's allow the elephant only in
  // its own colour and outline forms, and npm's do not allow the logo to
  // refer to npm at all.
  'Node.js': null,
  PostgreSQL: null,
  npm: null,
  // Absent from the set.
  Java: null,
  'C#': null,
  GDScript: null,
  SQL: null,
  // Absent too; Svelte's mark would name Svelte, not the framework.
  SvelteKit: null,
};

// The mark a technology is drawn with: its path in a 24 by 24 box and the
// title Simple Icons gives it, or undefined for a badge with the name alone.
export function technologyMark(name: string): { path: string; title: string } | undefined {
  const mark = marks[name];
  return mark ? { path: mark.path, title: mark.title } : undefined;
}

// A licence Simple Icons records as an SPDX identifier, as a reader writes it:
// "CC-BY-SA-4.0" is "CC BY-SA 4.0".
const licenceName = (type: string) => type.replace(/^CC-/, 'CC ').replace(/-(\d)/, ' $1');

// The attribution every mapped mark's licence asks for, one per mark, in the
// order of the marks' titles: the mark's name, its licence, and where it is
// from. Marks with no licence recorded, or under MIT or BSD, ask for none.
export function credits(): { name: string; licence: string; source: string }[] {
  const seen = new Set<string>();
  const lines: { name: string; licence: string; source: string }[] = [];
  for (const mark of Object.values(marks)) {
    if (!mark || seen.has(mark.slug)) continue;
    seen.add(mark.slug);
    const type = mark.license?.type;
    if (type && /^CC-BY(-SA)?-[\d.]+$/.test(type)) lines.push({ name: mark.title, licence: licenceName(type), source: mark.source });
  }
  return lines.sort((a, b) => a.name.localeCompare(b.name));
}
