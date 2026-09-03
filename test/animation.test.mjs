import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-animation-'));

const CASES = {
  architecture: 'web-app.architecture.json',
  workflow: 'agent-tool-call.workflow.json',
  sequence: 'cache-miss-request.sequence.json',
  dataflow: 'product-analytics.dataflow.json',
  lifecycle: 'agent-run.lifecycle.json',
};

const NODE_COLLECTION = {
  architecture: 'components',
  workflow: 'nodes',
  sequence: 'participants',
  dataflow: 'nodes',
  lifecycle: 'states',
};

function render(mode, example, animation = 'trace') {
  const doc = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples', example), 'utf8'));
  if (animation) doc.meta = { ...doc.meta, animation };
  else delete doc.meta.animation;
  const suffix = animation || 'static';
  const input = path.join(tmp, `${mode}-${suffix}.json`);
  const output = path.join(tmp, `${mode}-${suffix}.html`);
  fs.writeFileSync(input, JSON.stringify(doc));
  execFileSync('node', [path.join(skillRoot, `renderers/${mode}/render-${mode}.mjs`), input, output], {
    stdio: ['ignore', 'ignore', 'pipe'],
  });
  return fs.readFileSync(output, 'utf8');
}

function svgBlock(html) {
  return html.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] || '';
}

test('static output omits animation attributes', () => {
  const svg = svgBlock(render('workflow', CASES.workflow, null));
  assert.doesNotMatch(svg, /data-animation=/);
  assert.doesNotMatch(svg, /data-animate=/);
});

test('all five renderers add one geometry-neutral semantic sigil per primary node', () => {
  for (const [mode, example] of Object.entries(CASES)) {
    const source = JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples', example), 'utf8'));
    const expected = source[NODE_COLLECTION[mode]].length;
    const staticHtml = render(mode, example, null);
    const traceHtml = render(mode, example, 'trace');
    const staticSvg = svgBlock(staticHtml);
    const traceSvg = svgBlock(traceHtml);
    const sigils = (svg) => [...svg.matchAll(/<g aria-hidden="true" data-semantic-sigil="[^"]+"[\s\S]*?<\/g>/g)].map((match) => match[0]);

    assert.equal(sigils(staticSvg).length, expected, mode);
    assert.deepEqual(sigils(traceSvg), sigils(staticSvg), `${mode} trace must not change sigil geometry`);
    assert.match(staticHtml, /svg \.semantic-sigil \{/i, mode);
    assert.match(staticHtml, /svg \.s-database\s+\{ color: var\(--database\); \}/, mode);
  }
});

for (const [mode, example] of Object.entries(CASES)) {
  test(`${mode}: trace animation annotates svg, edges, and nodes`, () => {
    const svg = svgBlock(render(mode, example));
    assert.match(svg, /<svg[^>]+data-animation="trace"/);
    assert.match(svg, /data-animate="edge" style="--step:0"/);
    assert.match(svg, /data-animate="node" style="--step:0"/);
    assert.match(svg, /aria-labelledby="dsa-diagram-title dsa-diagram-description"/);
    assert.match(svg, /<title id="dsa-diagram-title">[^<]+<\/title>/);
    assert.match(svg, /<desc id="dsa-diagram-description">[^<]+<\/desc>/);
    assert.match(svg, /id="node-[^"]+" data-node-id="[^"]+"[^>]+role="button"[^>]+aria-pressed="false"/);
    assert.match(svg, /data-edge-from="[^"]+" data-edge-to="[^"]+"/);
  });
}

test('semantic SVG identity is deterministic for unchanged input', () => {
  const first = svgBlock(render('workflow', CASES.workflow));
  const second = svgBlock(render('workflow', CASES.workflow));
  const hooks = (svg) => [...svg.matchAll(/(?:id="node-|data-edge-from=")[^>]+/g)].map((match) => match[0]);
  assert.deepEqual(hooks(first), hooks(second));
});

process.on('exit', () => fs.rmSync(tmp, { recursive: true, force: true }));
