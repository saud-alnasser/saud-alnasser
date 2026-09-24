// Writes the profile block of README.md, the page GitHub shows for the
// account, from the content source and the site config: the summary, the
// profiles other than GitHub, and the site's address in both languages. The CV
// and the resume are one press away from the site's header, so the block does
// not link them itself. Who Saud is stays authored once, in src/content/, and
// the profile page repeats it without a second hand-written copy. The skills,
// the projects, and the rest of the record are on the site; the README points
// at it rather than growing a copy. Run after editing the profile:
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
import { profileIcon } from '../src/lib/networks.ts';
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

// What the README links to on the site: the portfolio, which leads to the
// rest, the two documents included.
const links = [{ emoji: '🌐', label: 'Portfolio', path: '' }];

// The profiles the block links to, above the site: every one in the content
// except GitHub, because this README is the GitHub profile page and a link to
// itself says nothing. Which network is GitHub is decided in
// src/lib/networks.ts, the way the documents decide which address becomes
// the QR code, so the two agree on every spelling of the name. The emoji is
// one row per network, like the site links below, with a plain link for a
// network no row names.
const isGitHub = ({ network }) => profileIcon(network) === 'github';
const emojis = { linkedin: '💼' };
const emojiFor = (network) => emojis[network.trim().toLowerCase()] ?? '🔗';

// The block as the content says it should read.
export async function renderProfile() {
  const { profile } = parseYaml(await readFile(path.join(content, 'profile.yaml'), 'utf8'));

  const lines = [
    open,
    wrap(profile.summary.en),
    '',
    ...profile.profiles
      .filter((entry) => !isGitHub(entry))
      .map(({ network, username, url }) => `- ${emojiFor(network)} **${network}** — [${username}](${url})`),
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
