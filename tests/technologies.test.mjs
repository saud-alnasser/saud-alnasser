// The licence rule every technology mark passes, held against the licence
// data the installed `simple-icons` package ships, so a release that changes a
// mark's licence fails here rather than shipping a mark the site may not use.
// Run by `pnpm test:content`, with Node's own test runner:
//
//   node --test tests/technologies.test.mjs
//
// The rule is the one src/lib/technologies.ts states.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
// Node strips the types on import, as scripts/check-dist.mjs relies on.
import { credits, guidelines, marks, technologyMark } from '../src/lib/technologies.ts';

const require = createRequire(import.meta.url);
const data = JSON.parse(readFileSync(require.resolve('simple-icons/icons.json'), 'utf8'));
const icons = Array.isArray(data) ? data : data.icons;
const bySlug = new Map(icons.map((icon) => [icon.slug ?? icon.title, icon]));

// What the package records for each mapped mark, found by its slug.
const mapped = Object.entries(marks)
  .filter(([, mark]) => mark !== null)
  .map(([name, mark]) => ({ name, mark, recorded: bySlug.get(mark.slug) }));

const attribution = /^CC-BY(-SA)?-[\d.]+$/;
const permissive = /^(MIT|BSD(-[\w.]+)?)$/;

test('every mapped mark is in the installed package', () => {
  for (const { name, mark, recorded } of mapped) {
    assert.ok(recorded, `${name} maps to ${mark.slug}, which the installed simple-icons does not list`);
    assert.equal(mark.path, recorded.path ?? mark.path, `${name}: the mark's path is the package's own`);
  }
});

test('every mapped mark has no licence, MIT or BSD, or CC BY or CC BY-SA', () => {
  for (const { name, recorded } of mapped) {
    const type = recorded.license?.type;
    if (type === undefined) continue;
    assert.ok(permissive.test(type) || attribution.test(type), `${name} carries ${type}, which the rule does not allow`);
  }
});

test('no mapped mark carries a non-commercial or no-derivatives licence', () => {
  for (const { name, recorded } of mapped) {
    const type = recorded.license?.type ?? '';
    assert.ok(!/-(NC|ND)\b/.test(type), `${name} carries ${type}`);
  }
});

test('the credits list exactly the marks whose licence asks for attribution', () => {
  const expected = [
    ...new Set(mapped.filter(({ recorded }) => attribution.test(recorded.license?.type ?? '')).map(({ recorded }) => recorded.title)),
  ].sort((a, b) => a.localeCompare(b));
  assert.deepEqual(
    credits().map((credit) => credit.name),
    expected,
  );
  for (const credit of credits()) {
    const recorded = icons.find((icon) => icon.title === credit.name);
    assert.equal(credit.source, recorded.source, `${credit.name}: the credit links the package's recorded source`);
    assert.ok(credit.licence.startsWith('CC BY'), `${credit.name}: the licence is written as a reader writes it`);
  }
  assert.ok(expected.length > 0, 'at least one mark asks for attribution today');
});

// Given the names a page shows, the footer credits only the marks those names
// draw: each mark that asks for credit, alone, credits itself and nothing
// else, and no names credit nothing.
test('given the names a site shows, the credits cover only the marks those names draw', () => {
  assert.deepEqual(credits([]), []);
  for (const credit of credits()) {
    const name = mapped.find(({ mark }) => mark.title === credit.name).name;
    assert.deepEqual(credits([name]), [credit], `${name} alone credits ${credit.name} and nothing else`);
  }
});

// A mark whose guidelines the package records is mapped only once they have
// been read, and what they allow is written beside the mapping.
test('every mapped mark with recorded guidelines has had them read', () => {
  for (const { name, recorded } of mapped) {
    if (!recorded.guidelines) continue;
    assert.ok(guidelines[recorded.slug], `${name}'s guidelines (${recorded.guidelines}) are not recorded in technologies.ts`);
  }
});

test('a name with no mark, and a name nowhere in the mapping, both have no mark', () => {
  assert.equal(technologyMark('Java'), undefined);
  assert.equal(technologyMark('SvelteKit'), undefined);
  assert.equal(technologyMark('Refactoring'), undefined);
  assert.ok(technologyMark('TypeScript'));
});

// The five mapped on 2026-09-24 for the stack read from Saud's repositories,
// each with the title its package entry gives it.
test('tRPC, Zod, Vite, Vitest, and SQLite draw their own marks', () => {
  for (const [name, title] of [
    ['tRPC', 'tRPC'],
    ['Zod', 'Zod'],
    ['Vite', 'Vite'],
    ['Vitest', 'Vitest'],
    ['SQLite', 'SQLite'],
  ]) {
    assert.equal(technologyMark(name)?.title, title, `${name} maps to the mark titled ${title}`);
  }
});
