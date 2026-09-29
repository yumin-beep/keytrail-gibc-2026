# KeyTrail

A small, local graph explorer that connects a visual diagram with keyboard navigation, matching text, and a shortest-route explanation.

KeyTrail is a prototype submitted to Track 03 (Open) of Global Innovation Build Challenge V2 on 2026-09-29. The project has not been evaluated by end users, and no accessibility certification or measured learning benefit is claimed.

## Run

No packages, API keys, account, build step, or external service is required.

From this directory, start a local static server:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000/` in a current desktop browser. The application consists of local HTML, CSS, and JavaScript. Python serves files only; it does not process graph imports.

## What works

- Inspect a node and follow its outgoing connections; for undirected graphs, traverse either way.
- Move focus across diagram nodes with arrow keys, Home, and End. Press Enter or Space to select. Tab leaves the diagram and reaches normal page controls.
- Read the same graph in a text view, including descriptions and connection labels.
- See recent selections and return with Back. A visit history can include jumps; it is not represented as a connected path.
- Calculate one shortest path by number of connections using breadth-first search. Direction, cycles, tied routes, disconnected nodes, and zero-hop routes are handled explicitly.
- Import validated JSON and export the current graph. Invalid imports leave the graph unchanged. Larger imports automatically open the text view.
- Inspect export JSON in a read-only dialog. Download it, or use Select JSON and your normal copy command when downloads are unavailable. Close or Escape returns focus to Export graph. A download request does not prove that the browser saved a file.
- Reset to the original synthetic demo.

The sample includes a revision loop, a shorter branch, and a disconnected Parking lot. It was authored specifically for this prototype with Codex assistance. It contains no participant data, actual research findings, or measured outcomes.

## File format

```json
{
  "version": 1,
  "title": "A small example",
  "description": "An optional explanation.",
  "directed": true,
  "nodes": [
    { "id": "start", "label": "Start", "description": "Begin here." },
    { "id": "finish", "label": "Finish" }
  ],
  "edges": [
    { "source": "start", "target": "finish", "label": "continue" }
  ]
}
```

- Limits: 1–60 nodes, 0–240 connections, file size at most 256 KiB.
- IDs: 1–40 ASCII letters, digits, `_`, or `-`; start with a letter. IDs must be unique.
- Required: `version`, `title`, `directed`, `nodes`, and `edges`; each node needs `id` and `label`; each edge needs `source` and `target`.
- Optional descriptions are plain strings. Title: up to 100 characters; graph description: 800; node label: 80; node description: 500; connection label: 100. Character limits use JavaScript string length.
- Missing node references, self-connections, repeated connections, invalid types, and unrecognized fields are rejected. Undirected reverse duplicates are also rejected.
- All links have equal cost. Weighted routing and all tied routes are outside the current scope. A tie selects the first route encountered in JSON connection order.

The app uses text nodes rather than HTML to display imported labels. It does not evaluate JSON as code, fetch referenced URLs, or execute imported markup. There is no server upload, analytics, external font, or third-party script. Graph state exists in page memory; reload discards it unless it has been exported. The browser and any extensions remain outside the application's control.

## Tests

With Node.js installed:

```sh
node test_core.js
```

The initial run passed **32 algorithm and input-validation checks**. Coverage includes a known shorter branch, directed/undirected traversal, cycles, deterministic ties, disconnected nodes, identical endpoints, JSON round-tripping, UTF-8 BOM handling, malformed input, byte and field limits, source immutability, and a 60-node chain.

Those checks exercise the graph core. They do not prove browser compatibility, assistive-technology behavior, resistance to all possible attacks, usability, or improved educational outcomes. Browser review is recorded separately in `VERIFICATION.md`; untested scenarios remain unconfirmed. The initial in-app-browser review did not confirm a saved Blob download, so the export dialog provides inspectable text and manual copy without requiring clipboard permission.

## Implementation

| File | Responsibility |
|---|---|
| `core.js` | Schema validation, parsing, connection lookup, breadth-first search |
| `sample.js` | Authored synthetic graph |
| `app.js` | DOM interaction, file import/export, route and selection state |
| `style.css` | Responsive layout and visual focus states |
| `index.html` | Semantic page and controls |
| `test_core.js` | Node.js assertions; no test framework dependency |

Breadth-first search visits each reachable node once. Its routing work is O(V + E), and its queue, predecessor map, and adjacency storage are O(V + E). Rendering is a simple ring or grid, not an optimized graph-layout engine. Dense maps may overlap; text view is the supported fallback. Imported descriptions are displayed as supplied, not verified for truth.

## AI assistance disclosure

Codex was used to propose the concept, implement the initial HTML/CSS/JavaScript, draft the synthetic sample, write automated tests, inspect failures, and prepare documentation. A separate Codex agent reviewed code; that is automated review, not independent human testing. The app itself does not call an AI model.

The participant must inspect and understand the code and confirm the final disclosure before submission. No claim is made that the initial implementation or these English notes were written without AI. Human review or user research should only be recorded after it occurs.

## Scope and submission

This is a new prototype, not a reuse of the participant's other contest entries. Graph exploration and BFS are established techniques; technical novelty and usefulness remain hypotheses to evaluate. There is no claimed award, partner, customer, deployment, or measured user benefit.

KeyTrail was submitted at https://devpost.com/software/keytrail on 2026-09-29. The submission includes this public source repository, four gallery screenshots, a Built With list, and full AI assistance disclosure. The 2 minute 30 second English-captioned walkthrough is available at https://youtu.be/bdKZ6ICIjwc as an unlisted video. It is an edited walkthrough from actual browser states, not a real-time recording. The Devpost page confirmed “Project submitted!”; judging results remain pending.

Participant code review and understanding remain the participant's responsibility. This record does not assert independent human testing. Further browser and assistive-technology testing remain product-validation work. An open-source license has not yet been selected; repository visibility does not itself grant an open-source license.
