---
name: dsa
description: Turn a small typed JSON spec into a standalone HTML architecture, workflow, sequence, data-flow, or lifecycle diagram with inline SVG, light and dark themes, pan/zoom, search, path tracing, and PNG/SVG export. Takes plain-language requirements or pasted Mermaid flowchart, sequenceDiagram, and stateDiagram input, and can read repository evidence when the diagram has to match real code. Use when the user asks to visualize system architecture, infrastructure, cloud, security or network topology, technical workflows, API call sequences, request lifecycles, data pipelines, ETL/ELT, data lineage, state machines, or to convert Mermaid.
license: MIT
metadata:
  version: "0.1.0"
  author: Ardacan Uckan
---

# Arda's DSA Skill

Write a small JSON spec, validate it, deliver it as one self-contained HTML file.

## How to author

1. Pick `architecture`, `workflow`, `sequence`, `dataflow`, or `lifecycle`.
2. Read the matching file in `schemas/`, plus `schemas/common.schema.json`, plus one
   matching example in `examples/`. Read only those. Use the example for field shape,
   not for facts: new IDs, your own wording, your own layout.
3. Write the spec before you look at any renderer source. Do not work out coordinates
   in prose. Start with one main path, short side branches, sparse labels, at most 12
   primary nodes. Set `meta.quality_profile` to `"showcase"` unless the user asks for a
   dense `standard` map. Start with automatic routes and labels; add `via`, `channelX`,
   `channelY`, or `labelAt` only when a diagnostic asks for one, one per repair.
4. Validate after every edit and again right before you hand over:

   ```bash
   node bin/dsa.mjs validate <type> <candidate.json> --quality showcase --json
   ```

   A receipt with 4 artifact checks is basic validation. Showcase acceptance is all 9
   checks, 0 composition errors, 0 warnings. If `meta.quality_profile` is missing or
   misspelled, fix that before touching geometry. For workflow v2 geometry, run
   `node bin/dsa.mjs validate workflow <candidate.json> --layout-json` and read the
   compiler receipt. Once validation passes, freeze the file.
5. Deliver once, at the end:

   ```bash
   node bin/dsa.mjs deliver <type> <candidate.json> <output.html> --quality showcase --json
   ```

   A non-zero exit is not success. A failed delivery leaves the previous output in
   place, so do not run `visual-check` on that path — it would inspect the old file.
   On failure, change only the diagnosed `subject`, check the `evidence`, pick from
   `supportedFixes`, and rerun. Keep going while the error count keeps dropping. If two
   rounds in a row do not improve it, stop and report what is still broken.

Do not read `renderers/shared/geometry.mjs`, renderer source, the validator, or the
tests before the first candidate exists. Open them only for a diagnostic the docs do
not explain, or after two focused repairs fail.

## Which type

| Type | For |
|---|---|
| `architecture` | Components, services, cloud and security boundaries, infrastructure |
| `workflow` | Processes, approval gates, tool calls, runbooks, CI/CD |
| `sequence` | API call chains, request lifecycles, async traces, returns |
| `dataflow` | Pipelines, ETL/ELT, lineage, governance, consumers |
| `lifecycle` | State transitions, retries, waiting and terminal states |

Workflow: `schema_version: 2` for anything new; keep `1` only to preserve an existing
workflow's fixed geometry. Layout, pin, and migration rules live in
[`renderers/workflow/README.md`](renderers/workflow/README.md#layout-contracts).

Lifecycle: phase columns `0..4` sit on the main rail; event column `N` in `0..2` lines
up under main column `N + 2`. A recoverable state is `type: "failure"` plus a real
transition back to the active state.

From Mermaid: read it for topology and meaning, then write fresh JSON and ignore its
styling. `flowchart`/`graph` → `workflow`, or `architecture` for a component map;
`sequenceDiagram` → `sequence`; `stateDiagram` → `lifecycle`.

## Rules that matter

- One obvious main path. Side branches leave the nearest node on it. Cut a weak edge
  before you add a routing control.
- Types are `frontend`, `backend`, `database`, `cloud`, `security`, `messagebus`,
  `external`. Variants are `default`, `emphasis`, `security`, `dashed`.
- Keep product names, code identifiers, commands, protocols, API paths, and environment
  names exactly as they are.
- Relationship labels carry meaning. When one collides: move the label, then the route,
  then the spacing, then shorten the wording. Drop a label only when both endpoints
  already imply it and it names no protocol, action, direction, sync/async behaviour, or
  boundary crossing. Deleting a label is not a geometry fix.
- Spacing means clear gap, not centre distance: a label needs more clear gap than its
  measured mask width. Never let an edge cross an unrelated opaque node, share an
  ambiguous corridor, or let a label mask another route.
- Automatic routes own their endpoint sides — first and last segment leave and enter
  perpendicular. Shared automatic endpoints spread themselves, and the renderer skips
  any relationship you routed by hand, so do not pre-empt it.
- Omit `meta.subtitle`, `meta.legend` and `meta.engineering_profile` by default. Turn on
  `deployment-ownership` only when the user asks for a production deployment topology or
  an ownership handoff and the facts are known; then repair the facts rather than
  removing the profile.
- Sequence: omit `meta.column_fit` for the `fixed` layout. Use `"spread"` when a wide
  viewBox leaves dead space or real participant names do not fit — before shortening a
  name.
- The viewer fits the diagram to the viewport, so keep the authored viewBox
  proportionate rather than sized for a screen: enough vertical rhythm that the diagram
  and its notes read as one composition, not a wide thin strip.

Open [`references/authoring-contract.md`](references/authoring-contract.md) when you
need field enums, spacing maths, geometry repair order, or repository evidence.

## Delivery

`deliver` freezes the spec bytes into a private snapshot beside the output, renders and
checks it, commits the HTML atomically, and reports SHA-256 and byte counts for both.
That is evidence about the file, not about how the page looks.

For browser evidence, `node bin/dsa.mjs visual-check <output.html> --json` measures and
screenshots the delivered file without rerendering it. Measurements are not a design
review. Three separate claims: `deliver` checks the artifact, `visual-check` checks
behaviour in a real browser, and looking at the screenshots is the only thing that
checks how it looks. Details in
[`references/delivery-contract.md`](references/delivery-contract.md).

Add `--open` for a one-off local preview, or run
`node bin/dsa.mjs preview <type> <input>.json <output>.html --quality showcase` for a
live authoring loop. Never start preview unasked. `node bin/dsa.mjs doctor` checks the
install.

The reader gets one HTML file: pan and zoom, fit, find a node, trace a path between two
nodes, step through `meta.views` if any exist, PNG and SVG export, light and dark.
`meta.animation: "trace"` is opt-in; `meta.views` holds at most five.

## Report

Give the HTML path, the diagram type, the validation summary, the spec and artifact
receipt, and — separately — whether you actually looked at the rendered page. Do not
call a non-zero command a success, and do not claim a visual check you did not do.
