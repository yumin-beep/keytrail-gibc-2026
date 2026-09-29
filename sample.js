window.KeyTrailSample = {
  version: 1,
  title: 'From a question to a story',
  description: 'A fictional learning workflow, written for this demo. Explore branches and a revision loop. The Parking lot is deliberately disconnected so you can test an unreachable destination.',
  directed: true,
  nodes: [
    { id: 'question', label: 'Ask a question', description: 'Choose one question that you want your story to answer.' },
    { id: 'sources', label: 'Find sources', description: 'Collect a few sources. This example contains no real research or private data.' },
    { id: 'read', label: 'Read closely', description: 'Follow the main argument before selecting supporting details.' },
    { id: 'notes', label: 'Make notes', description: 'Record an observation and the source it came from.' },
    { id: 'draft', label: 'Write a draft', description: 'Turn the notes into a short story with a clear beginning and ending.' },
    { id: 'review', label: 'Review together', description: 'Check whether the story answers the original question.' },
    { id: 'revise', label: 'Revise', description: 'Work on unclear parts, then return to the draft. This creates a cycle.' },
    { id: 'share', label: 'Share the story', description: 'Reach a final version. Sharing is only a label in this demo; nothing is published.' },
    { id: 'archive', label: 'Keep a copy', description: 'Finish the workflow with a reusable local copy.' },
    { id: 'parking', label: 'Parking lot', description: 'An intentionally isolated node. No route leads here from the other nodes.' }
  ],
  edges: [
    { source: 'question', target: 'sources', label: 'look for evidence' },
    { source: 'sources', target: 'read', label: 'inspect the source' },
    { source: 'read', target: 'notes', label: 'record an observation' },
    { source: 'notes', target: 'draft', label: 'build a narrative' },
    { source: 'draft', target: 'review', label: 'ask for a second view' },
    { source: 'review', target: 'revise', label: 'if changes are needed' },
    { source: 'revise', target: 'draft', label: 'try another version' },
    { source: 'review', target: 'share', label: 'when ready' },
    { source: 'share', target: 'archive', label: 'save the result' },
    { source: 'read', target: 'sources', label: 'if a source is missing' },
    { source: 'sources', target: 'notes', label: 'capture a quick observation' },
    { source: 'notes', target: 'review', label: 'check the outline early' }
  ]
};
