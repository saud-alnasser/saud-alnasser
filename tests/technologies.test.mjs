// The licence rule every technology mark passes, held against the licence
// data the installed `simple-icons` package ships, so a release that changes a
// mark's licence fails here rather than shipping a mark the site may not use.
// Run by `pnpm test:content`, with Node's own test runner:
//
//   node --test tests/technologies.test.mjs
//
// The rule is the one src/lib/technologies.ts states, decided in
// .aep/efforts/31-portfolio-rework/plan.md, decision 3.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
// Node strips the types on import, as scripts/check-dist.mjs relies on.
import { credits, marks, technologyMark } from '../src/lib/technologies.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
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

// A mark whose guidelines the package records is mapped only once they have
// been read, and what they said is in the effort's evidence.
test('every mapped mark with recorded guidelines has had them read', () => {
  const evidence = readFileSync(
    path.join(root, '.aep', 'efforts', '31-portfolio-rework', 'evidence', 'research', 'logo-guidelines.md'),
    'utf8',
  );
  for (const { name, recorded } of mapped) {
    if (!recorded.guidelines) continue;
    assert.ok(evidence.includes(recorded.title), `${name}'s guidelines (${recorded.guidelines}) are not in logo-guidelines.md`);
  }
});

test('a name with no mark, and a name nowhere in the mapping, both draw the name alone', () => {
  assert.equal(technologyMark('Java'), undefined);
  assert.equal(technologyMark('SvelteKit'), undefined);
  assert.equal(technologyMark('Refactoring'), undefined);
  assert.ok(technologyMark('TypeScript'));
});
