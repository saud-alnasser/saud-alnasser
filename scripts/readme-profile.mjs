// Writes the profile block of README.md, the page GitHub shows for the
// account, from the content source and the site config: the summary, the
// profiles other than GitHub, and the addresses of the three things a reader
// came for, the site, the CV, and the resume, each in both languages. Who
// Saud is stays authored once, in
// src/content/, and the profile page repeats it without a second hand-written
// copy. The skills, the projects, and the rest of the record are on the site;
// the README points at it rather than growing a copy. Run after editing the
// profile:
//
//   pnpm readme           # rewrites the block between the markers
//   pnpm readme --check   # exits non-zero when the README is behind
//
// The block sits between <!-- profile --> and <!-- /profile --> in README.md;
// everything outside the markers is written by hand. The dist check runs the
// check, so CI fails when the content changed and the README did not.

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
import { base, site } from '../astro.config.mjs';
import { joinBase } from '../src/lib/paths.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readmeFile = path.join(root, 'README.md');
const content = path.join(root, 'src', 'content');
const open = '<!-- profile -->';
const close = '<!-- /profile -->';

// Prose wrapped at the width the README's other paragraphs use.
function wrap(text, width = 76) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    if (line && line.length + 1 + word.length > width) {
      lines.push(line);
      line = word;
    } else {
      line = line ? `${line} ${word}` : word;
    }
  }
  if (line) lines.push(line);
  return lines.join('\n');
}

// A full address on the site, from the same `site` and `base` the build uses.
const at = (sitePath) => new URL(joinBase(base, sitePath), site).href;

// The three things the README links to, in the order a reader wants them: the
// site first, then the long document, then the short one.
const links = [
  { emoji: '🌐', label: 'Portfolio', path: '' },
  { emoji: '📄', label: 'CV', path: 'cv/' },
  { emoji: '📃', label: 'Resume', path: 'resume/' },
];

// The profiles the block links to, above the site: every one in the content
// except GitHub, because this README is the GitHub profile page and a link to
// itself says nothing. The same test src/lib/networks.ts applies, on the
// network's name, so a profile is skipped by what it is rather than by its
// position in the list.
const isGitHub = ({ network }) => network.trim().toLowerCase() === 'github';

// The block as the content says it should read.
export async function renderProfile() {
  const { profile } = parseYaml(await readFile(path.join(content, 'profile.yaml'), 'utf8'));

  const lines = [
    open,
    wrap(profile.summary.en),
    '',
    ...profile.profiles
      .filter((entry) => !isGitHub(entry))
      .map(({ network, username, url }) => `- 💼 **${network}** — [${username}](${url})`),
    ...links.map(
      ({ emoji, label, path: page }) =>
        `- ${emoji} **${label}** — [English](${at(`/en/${page}`)}) · [العربية](${at(`/ar/${page}`)})`,
    ),
    close,
  ];
  return lines.join('\n');
}

// The README as it is and as it should be with the block current.
export async function readmeWithProfile() {
  const current = await readFile(readmeFile, 'utf8');
  const start = current.indexOf(open);
  const end = current.indexOf(close);
  if (start < 0 || end < start) {
    throw new Error(`README.md: the ${open} and ${close} markers are missing or out of order`);
  }
  const next = current.slice(0, start) + (await renderProfile()) + current.slice(end + close.length);
  return { current, next };
}

const runDirectly = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (runDirectly) {
  try {
    const { current, next } = await readmeWithProfile();
    if (process.argv.includes('--check')) {
      if (current !== next) {
        console.error('readme-profile: README.md is behind src/content/ or astro.config.mjs; run `pnpm readme`');
        process.exit(1);
      }
      console.log('readme-profile: README.md carries the profile as src/content/ states it');
    } else if (current === next) {
      console.log('readme-profile: README.md already current');
    } else {
      await writeFile(readmeFile, next);
      console.log('readme-profile: README.md rewritten from src/content/ and astro.config.mjs');
    }
  } catch (error) {
    console.error(`readme-profile: ${error.message}`);
    process.exit(1);
  }
}
