// The rule every skill keyword meets, held against the content on every run:
// a keyword names something a shown entry backs (src/content/README.md,
// "skills/"). Run by `pnpm test:content`, with Node's own test runner:
//
//   node --test tests/skills.test.mjs
//
// A keyword is backed in one of three ways, tried in this order:
//
// - a shown project names it among its technologies, spelled exactly as the
//   keyword is;
// - the CV's self-study entry names it as a topic, which scripts/check-dist.mjs
//   already holds to a course that taught it;
// - a line in `backing` below names the shown entries whose work plainly used
//   it, and says how. This is for what no card names and no course title
//   covers: a practice, or a technique a project is built from.
//
// The table is here rather than in the content because the content contract
// is fixed, and because this test is the only thing that reads it. A line
// that points at a hidden project, at a file that does not exist, or at a
// keyword no group lists fails too, so the table cannot outlive what it
// vouches for.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';
// Node strips the types on import, as scripts/check-dist.mjs relies on.
import { isShown } from '../src/lib/shown.ts';

const content = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'src', 'content');
const read = (...file) => parseYaml(readFileSync(path.join(content, ...file), 'utf8'));
const files = (collection) => readdirSync(path.join(content, collection)).filter((file) => file.endsWith('.yaml'));

// Each keyword no card names and no topic covers, against the entries that
// back it, each as `<collection>/<file name without .yaml>`, and how.
export const backing = {
  'GitHub Actions': { by: ['projects/rentable'], how: 'its integration, release, and cache workflows run on GitHub Actions' },
  CSS: { by: ['projects/rentable'], how: 'its interface is styled with Tailwind CSS, and GitHub counts the repository as partly CSS' },
  Interpreters: { by: ['projects/monkey-lang'], how: 'an interpreter for the Monkey language' },
  Compilers: { by: ['projects/pl-0'], how: 'a compiler for PL/0 with a P-machine code generator' },
  'Lexers and parsers': {
    by: ['projects/monkey-lang', 'projects/pl-0'],
    how: "monkey-lang's lexer and its parser, built on the chumsky combinators, and pl-0's hand-written lexer and recursive descent parser",
  },
  'Bytecode virtual machines': {
    by: ['projects/monkey-lang'],
    how: 'it lowers the syntax tree to a basic-block intermediate representation and runs it on its own interpreter',
  },
  'Data structures and algorithms': {
    by: ['projects/leetcode', 'projects/advent-of-code'],
    how: 'problem solutions in Rust, beside the self-study topic "data structures"',
  },
};

const projects = files('projects').map((file) => ({ id: file.replace(/\.yaml$/, ''), data: read('projects', file) }));
const shownProjects = projects.filter((project) => isShown(project.data));
const named = new Set(shownProjects.flatMap((project) => project.data.technologies));
const topics = read('self-study.yaml').selfStudy.topics.map((topic) => topic.en.toLowerCase());
const keywords = files('skills').flatMap((file) => read('skills', file).keywords.map((keyword) => ({ keyword, file })));

// How a keyword is backed, or undefined where nothing backs it.
function witness(keyword) {
  if (named.has(keyword)) return 'a shown project names it';
  if (topics.includes(keyword.toLowerCase())) return 'a self-study topic';
  if (backing[keyword]) return 'the backing table';
  return undefined;
}

test('every skill keyword is backed by a shown project, a self-study topic, or a line in the table', () => {
  for (const { keyword, file } of keywords) {
    assert.ok(witness(keyword), `"${keyword}" in skills/${file} is backed by no shown project, no self-study topic, and no line in tests/skills.test.mjs`);
  }
});

test('every line of the table points at shown entries that exist', () => {
  for (const [keyword, line] of Object.entries(backing)) {
    assert.ok(line.by.length > 0 && line.how, `"${keyword}": a line names at least one entry and says how it backs the keyword`);
    for (const ref of line.by) {
      const [collection, id] = ref.split('/');
      assert.ok(existsSync(path.join(content, collection, `${id}.yaml`)), `"${keyword}" is backed by ${ref}, which does not exist`);
      if (collection === 'projects') {
        assert.ok(isShown(read(collection, `${id}.yaml`)), `"${keyword}" is backed by ${ref}, which is not shown`);
      }
    }
  }
});

test('every line of the table is for a keyword a group lists, and one nothing else backs', () => {
  const listed = new Set(keywords.map(({ keyword }) => keyword));
  for (const keyword of Object.keys(backing)) {
    assert.ok(listed.has(keyword), `"${keyword}" has a line in the table and no skill group lists it`);
    assert.ok(!named.has(keyword) && !topics.includes(keyword.toLowerCase()), `"${keyword}" is already backed without its line`);
  }
});
