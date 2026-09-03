import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');
const authoringContract = fs.readFileSync(
  path.join(skillRoot, 'references', 'authoring-contract.md'),
  'utf8',
);
const schemaReadme = fs.readFileSync(path.join(skillRoot, 'schemas', 'README.md'), 'utf8');

test('semantic relationship labels are preserved and deletion is not a geometry repair', () => {
  assert.match(skill, /Relationship labels carry meaning/i);
  assert.match(skill, /move the label, then the route,\s+then the spacing, then shorten/i);
  assert.match(skill, /protocol, action, direction, sync\/async behaviour, or\s+boundary crossing/i);
  assert.match(skill, /Deleting a label is not a geometry fix/i);

  assert.match(authoringContract, /Relationship labels are semantic data/i);
  assert.match(authoringContract, /move the label[\s\S]*adjust the route or spacing[\s\S]*shorten/i);
  assert.match(authoringContract, /protocol[\s\S]*action[\s\S]*direction[\s\S]*synchronous[\s\S]*asynchronous[\s\S]*cross-boundary mechanism/i);
  assert.match(authoringContract, /Omit only wording[\s\S]*fully implied by both endpoints/i);
  assert.match(authoringContract, /Preserve every meaningful label/i);
  assert.match(authoringContract, /deleting it is not\s+a (?:geometry|spacing) repair/i);
});

test('schema policy documents the workflow v1/v2 compatibility boundary', () => {
  assert.match(schemaReadme, /Workflow[^\n]*schema versions? 1 and 2/i);
  assert.match(schemaReadme, /other four[^\n]*schema_version[^\n]*1/i);
  assert.doesNotMatch(schemaReadme, /schema_version` is `"const": 1`/);
});

test('deployment ownership stays explicit, fact-backed, and cannot be removed to pass', () => {
  assert.match(skill, /Omit `meta\.subtitle`, `meta\.legend` and `meta\.engineering_profile` by default/);
  assert.match(skill, /production deployment topology or\s+an ownership handoff/i);
  assert.match(skill, /repair the facts rather than\s+removing the profile/i);
  assert.match(authoringContract, /engineering_profile/);
});

test('visual-check stays a pending sidecar receipt instead of a polish claim', () => {
  const deliveryContract = fs.readFileSync(
    path.join(skillRoot, 'references', 'delivery-contract.md'),
    'utf8',
  );
  assert.match(skill, /visual-check <output\.html> --json/);
  assert.match(skill, /browser evidence[\s\S]*Measurements are not a design\s+review/i);
  assert.match(skill, /references\/delivery-contract\.md/);
  assert.match(skill, /without rerendering it/i);

  assert.match(deliveryContract, /visual-check <output\.html> --json/);
  assert.match(deliveryContract, /1440×900[\s\S]*1600×1000[\s\S]*1920×1080[\s\S]*2048×1320/);
  assert.match(deliveryContract, /visualReview: "pending"/);
  assert.match(deliveryContract, /never changes.*delivered|without (?:rerendering or )?modifying/i);
});
