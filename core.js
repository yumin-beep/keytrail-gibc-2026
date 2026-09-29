(function (root) {
  'use strict';
  const LIMITS = Object.freeze({ nodes: 60, edges: 240, bytes: 262144 });
  const fail = message => { throw new Error(message); };
  const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value);
  function fields(object, allowed, where) {
    if (!plain(object)) fail(`${where} must be an object.`);
    const extra = Object.keys(object).filter(key => !allowed.includes(key));
    if (extra.length) fail(`${where}: unknown field "${extra[0]}".`);
  }
  function text(value, where, max, optional = false) {
    if (value === undefined && optional) return '';
    if (typeof value !== 'string') fail(`${where} must be text.`);
    const clean = value.trim();
    if ((!clean && !optional) || clean.length > max) fail(`${where} must contain ${optional ? '0' : '1'}–${max} characters.`);
    return clean;
  }
  function validateGraph(value) {
    fields(value, ['version', 'title', 'description', 'directed', 'nodes', 'edges'], 'Graph');
    if (value.version !== 1) fail('Graph version must be 1.');
    if (typeof value.directed !== 'boolean') fail('directed must be true or false.');
    if (!Array.isArray(value.nodes) || !value.nodes.length || value.nodes.length > LIMITS.nodes) fail(`Provide 1–${LIMITS.nodes} nodes.`);
    if (!Array.isArray(value.edges) || value.edges.length > LIMITS.edges) fail(`Provide 0–${LIMITS.edges} edges.`);
    const ids = new Set();
    const nodes = value.nodes.map((node, i) => {
      const at = `Node ${i + 1}`;
      fields(node, ['id', 'label', 'description'], at);
      if (typeof node.id !== 'string' || !/^[A-Za-z][A-Za-z0-9_-]{0,39}$/.test(node.id)) fail(`${at}: id must start with a letter and use up to 40 letters, digits, _ or -.`);
      if (ids.has(node.id)) fail(`${at}: duplicate id "${node.id}".`);
      ids.add(node.id);
      return { id: node.id, label: text(node.label, `${at} label`, 80), description: text(node.description, `${at} description`, 500, true) };
    });
    const pairs = new Set();
    const edges = value.edges.map((edge, i) => {
      const at = `Connection ${i + 1}`;
      fields(edge, ['source', 'target', 'label'], at);
      if (!ids.has(edge.source) || !ids.has(edge.target)) fail(`${at}: source and target must match existing node ids.`);
      if (edge.source === edge.target) fail(`${at}: self-connections are not supported.`);
      const pair = JSON.stringify(value.directed ? [edge.source, edge.target] : [edge.source, edge.target].sort());
      if (pairs.has(pair)) fail(`${at}: duplicate connection.`);
      pairs.add(pair);
      return { source: edge.source, target: edge.target, label: text(edge.label, `${at} label`, 100, true) };
    });
    return { version: 1, title: text(value.title, 'Graph title', 100), description: text(value.description, 'Graph description', 800, true), directed: value.directed, nodes, edges };
  }
  function parseGraph(source) {
    if (typeof source !== 'string') fail('Choose a JSON text file.');
    if (new TextEncoder().encode(source).length > LIMITS.bytes) fail('The file exceeds 256 KiB.');
    let value;
    try { value = JSON.parse(source.replace(/^\uFEFF/, '')); }
    catch { fail('This is not valid JSON. Check commas, quotes, and brackets.'); }
    return validateGraph(value);
  }
  function connections(graph, id, incoming = false) {
    if (!graph.nodes.some(node => node.id === id)) fail('The selected node does not exist.');
    return graph.edges.flatMap(edge => {
      if (!graph.directed) {
        if (edge.source === id) return [{ id: edge.target, label: edge.label }];
        if (edge.target === id) return [{ id: edge.source, label: edge.label }];
      } else if (incoming ? edge.target === id : edge.source === id) {
        return [{ id: incoming ? edge.source : edge.target, label: edge.label }];
      }
      return [];
    });
  }
  function shortestPath(graph, from, to) {
    const ids = new Set(graph.nodes.map(node => node.id));
    if (!ids.has(from) || !ids.has(to)) fail('Choose an existing start and destination.');
    const adjacency = new Map(graph.nodes.map(node => [node.id, []]));
    for (const edge of graph.edges) {
      adjacency.get(edge.source).push(edge.target);
      if (!graph.directed) adjacency.get(edge.target).push(edge.source);
    }
    const previous = new Map([[from, null]]);
    const queue = [from];
    for (let head = 0; head < queue.length; head++) {
      const current = queue[head];
      if (current === to) {
        const path = [];
        for (let at = to; at !== null; at = previous.get(at)) path.push(at);
        return path.reverse();
      }
      for (const next of adjacency.get(current)) {
        if (!previous.has(next)) { previous.set(next, current); queue.push(next); }
      }
    }
    return null;
  }
  function pathEdges(path) {
    return (path || []).slice(1).map((id, i) => [path[i], id]);
  }
  const api = Object.freeze({ LIMITS, validateGraph, parseGraph, connections, shortestPath, pathEdges });
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.KeyTrailCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
