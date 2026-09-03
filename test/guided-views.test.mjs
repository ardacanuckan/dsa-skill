import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillRoot = path.resolve(__dirname, '..');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'dsa-views-'));

const CASES = {
  architecture: { example: 'web-app.architecture.json', collection: 'components' },
  workflow: { example: 'agent-tool-call.workflow.json', collection: 'nodes' },
  sequence: { example: 'cache-miss-request.sequence.json', collection: 'participants' },
  dataflow: { example: 'product-analytics.dataflow.json', collection: 'nodes' },
  lifecycle: { example: 'agent-run.lifecycle.json', collection: 'states' },
};

function run(mode, doc, suffix) {
  const input = path.join(tmp, `${mode}-${suffix}.json`);
  const output = path.join(tmp, `${mode}-${suffix}.html`);
  fs.writeFileSync(input, JSON.stringify(doc));
  const result = spawnSync(process.execPath, [
    path.join(skillRoot, `renderers/${mode}/render-${mode}.mjs`), input, output,
  ], { encoding: 'utf8' });
  return { result, html: fs.existsSync(output) ? fs.readFileSync(output, 'utf8') : '' };
}

function fixture(mode) {
  return JSON.parse(fs.readFileSync(path.join(skillRoot, 'examples', CASES[mode].example), 'utf8'));
}

function svg(html) {
  return html.match(/<svg\b[\s\S]*?<\/svg>/)?.[0] || '';
}

function viewsData(html) {
  const block = html.match(/<script id="dsa-views-data" type="application\/json">([\s\S]*?)<\/script>/);
  assert.ok(block, 'views data script missing');
  return JSON.parse(block[1]
    .replaceAll('\\u003c', '<')
    .replaceAll('\\u003e', '>')
    .replaceAll('\\u0026', '&'));
}

for (const [mode, config] of Object.entries(CASES)) {
  test(`${mode}: views ride alongside an unchanged diagram`, () => {
    const withViews = fixture(mode);
    const ids = withViews[config.collection].slice(0, 2).map((item) => item.id);
    withViews.meta.views = [{
      id: 'reader-path',
      label: 'Reader path',
      focus: ids,
      note: 'A note carrying </script><script> text.',
    }];
    const withoutViews = structuredClone(withViews);
    delete withoutViews.meta.views;

    const guided = run(mode, withViews, 'guided');
    const plain = run(mode, withoutViews, 'plain');
    assert.equal(guided.result.status, 0, guided.result.stderr);
    assert.equal(plain.result.status, 0, plain.result.stderr);

    // Views are a reader affordance, never a change to authored geometry.
    assert.equal(svg(guided.html), svg(plain.html));

    assert.deepEqual(viewsData(guided.html), withViews.meta.views);
    assert.deepEqual(viewsData(plain.html), []);

    // A note is data, so its angle brackets must not close the script element.
    const raw = guided.html.match(/<script id="dsa-views-data"[^>]*>([\s\S]*?)<\/script>/)[1];
    assert.doesNotMatch(raw, /[<>&]/);
  });
}

test('the viewer keeps a step control and hides it until views exist', () => {
  const template = fs.readFileSync(path.join(skillRoot, 'assets/template.html'), 'utf8');
  assert.match(template, /id="btn-steps"[^>]*hidden/);
  assert.match(template, /id="steps" hidden/);
  assert.match(template, /if \(views\.length\) \{/);
});
