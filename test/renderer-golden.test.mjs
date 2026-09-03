// Renderers are deterministic: the same spec must produce the same bytes.
// This file also carries the schema negative cases and the version sync that
// used to live in a standalone golden harness.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-golden-'));

const EXAMPLES = [
  ['workflow', 'agent-tool-call.workflow.json'],
  ['sequence', 'cache-miss-request.sequence.json'],
  ['dataflow', 'product-analytics.dataflow.json'],
  ['lifecycle', 'agent-run.lifecycle.json'],
  ['architecture', 'web-app.architecture.json'],
];

let sequence = 0;

function render(mode, inputPath) {
  const out = path.join(tmp, `render-${sequence++}.html`);
  execFileSync('node', [
    path.join(skillRoot, `renderers/${mode}/render-${mode}.mjs`), inputPath, out,
  ], { stdio: ['ignore', 'ignore', 'pipe'] });
  return fs.readFileSync(out, 'utf8');
}

for (const [mode, example] of EXAMPLES) {
  test(`${mode}: two renders of ${example} are byte-identical`, () => {
    const input = path.join(skillRoot, 'examples', example);
    assert.equal(render(mode, input), render(mode, input));
  });
}

function expectFailure(mode, mutate, expectInMessage) {
  const example = EXAMPLES.find(([m]) => m === mode)[1];
  const doc = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples', example), 'utf8'));
  mutate(doc);
  const input = path.join(tmp, `reject-${sequence++}.json`);
  fs.writeFileSync(input, JSON.stringify(doc));
  assert.throws(
    () => render(mode, input),
    (error) => String(error.stderr || error.message).includes(expectInMessage),
    `expected "${expectInMessage}"`,
  );
}

test('invalid specs fail with a path-prefixed message', () => {
  expectFailure('workflow', (d) => { d.cards[0].dot = 'pink'; }, '/cards/0/dot');
  expectFailure('workflow', (d) => { d.nodes[0].id = '1user'; }, 'pattern');
  expectFailure('workflow', (d) => { d.nodes[0].colour = 'red'; }, 'additional properties');
  expectFailure('workflow', (d) => { d.nodes[0].col = 7; }, '<= 5');
  expectFailure('sequence', (d) => { delete d.schema_version; }, 'schema_version');
  expectFailure('lifecycle', (d) => {
    const approval = d.states.find((state) => state.id === 'approval');
    const failed = d.states.find((state) => state.id === 'failed');
    delete failed.yOffset;
    failed.col = approval.col;
  }, 'less than 10px apart');
  expectFailure('architecture', (d) => { d.components[0].size = [0, 60]; }, '/components/0/size/0');
  expectFailure('architecture', (d) => { d.components[0].size = [120, 0]; }, '/components/0/size/1');
  expectFailure('architecture', (d) => { d.components[0].size = [-1, 60]; }, '/components/0/size/0');
});

test('a rendered artifact carries the template verbatim', () => {
  const template = fs.readFileSync(path.join(skillRoot, 'assets/template.html'), 'utf8');
  const html = render('architecture', path.join(skillRoot, 'examples', 'web-app.architecture.json'));
  const blocks = (source, tag) => (source.match(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'g')) || [])
    .filter((block) => !block.includes('type="application/json"'));
  for (const tag of ['style', 'script']) {
    assert.deepEqual(blocks(html, tag), blocks(template, tag), `${tag} blocks drifted`);
  }
});

test('the version is the same in package.json, the lockfile, the template and SKILL.md', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(skillRoot, 'package.json'), 'utf8'));
  const lock = JSON.parse(fs.readFileSync(path.join(skillRoot, 'package-lock.json'), 'utf8'));
  const template = fs.readFileSync(path.join(skillRoot, 'assets/template.html'), 'utf8');
  const skill = fs.readFileSync(path.join(skillRoot, 'SKILL.md'), 'utf8');

  assert.equal(lock.version, pkg.version);
  assert.equal(lock.packages?.['']?.version, pkg.version);
  assert.match(template, new RegExp(`<meta name="generator" content="dsa ${pkg.version}">`));
  assert.equal((skill.match(/^\s*version:\s*"([^"]+)"/m) || [])[1], pkg.version);
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
