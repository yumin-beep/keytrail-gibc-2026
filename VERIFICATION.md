# KeyTrail verification record

Date: 2026-09-29 KST.

File timestamps record the first core file at 16:24:51 KST and the initial documentation/focus fix at 16:30:23 KST (5 minutes 32 seconds between those writes). This interval is not a complete labor estimate; concept research and earlier drafting occurred before the first file write. Browser QA continues separately.

## Confirmed automated checks

`node test_core.js` completed successfully with **32 checks passed**. This result is for the authored test cases only.

The sample route from `question` to `archive` was confirmed as:

```text
question → sources → notes → review → share → archive
```

This uses five connections. The intentionally disconnected `parking` node returns no path from `question`. Direction, cycles, a tie, a zero-hop route, the 60-node limit, malformed and oversized inputs, duplicate/missing references, JSON round-trip, and nonmutation of the source were also tested. HTML-like labels were tested as literal model strings; browser rendering must be checked separately.

## Code review action

A separate Codex agent identified a possible focus loss when the active “Clear highlighted route” button becomes hidden. The handler now focuses “Find route” before hiding the control. Other callers of route reset preserve their existing focus. The parent task subsequently reported browser confirmation of this correction.

## Browser review

The parent task owns browser QA at `http://127.0.0.1:8785/`. It reported successful valid/invalid imports, keyboard navigation, Back, BFS, an unreachable route, text view, and the Clear route focus correction. These are reported observations in the tested in-app browser, not cross-browser or assistive-technology certification.

The initial Export action produced a download-request message, but the parent did not observe a download event or saved file. A Blob download must therefore not be described as confirmed.

The updated export flow opens a native modal dialog with read-only JSON, Download JSON, Select JSON, and Close. Escape also closes it; closing restores focus to Export graph. Select JSON uses text selection and the user's normal copy shortcut; it does not call a clipboard API. The download message states that saving cannot be confirmed. Export content is a graph snapshot and does not mutate the graph.

The parent task subsequently confirmed the export dialog in the in-app browser: it displayed parseable JSON with 10 nodes and 12 connections, Select JSON selected the full string, and Escape closed the dialog and returned focus to Export graph. Actual clipboard copying, file saving, and a manual copy/save/re-import round trip remain unconfirmed. A requested Blob download is not evidence of a saved file. `app.js` syntax was checked after the UI edit. `core.js` was unchanged and its 32 algorithm/input tests were not rerun solely for this interface change.

Other pending scenarios include long labels, narrow viewport, and complete file-download behavior in other browsers.

## Not yet established

- Screen-reader compatibility or evaluation by users of assistive technology.
- Conformance to an accessibility standard.
- Usefulness, learning improvement, time savings, accuracy on real datasets, or originality relative to all existing tools.
- Complete cross-browser, mobile, or hostile-input security coverage.
- Judged result, customer, partner, or measured end-user benefit.

## Source, video and contest submission

The 13 project files were published at https://github.com/yumin-beep/keytrail-gibc-2026 on 2026-09-29. The English-captioned video at https://youtu.be/bdKZ6ICIjwc was published as unlisted and has a verified duration of 150 seconds. It edits 14 actual browser-state captures and explicitly states that it is not a real-time recording.

The Devpost page at https://devpost.com/software/keytrail displayed “Project submitted!” and “SUBMITTED TO Global Innovation Build Challenge V2” on 2026-09-29. The Track 03 submission includes four gallery screenshots and discloses the full AI-assisted implementation. Submission confirmation is not a judging result or an accessibility certification. No open-source license has been added.

Implementation and verification were performed with Codex assistance. No experiment result is inferred from the presence of a feature in the code.
