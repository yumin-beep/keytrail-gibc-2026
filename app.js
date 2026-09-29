(() => {
  'use strict';
  const core = window.KeyTrailCore;
  const $ = id => document.getElementById(id);
  const make = (tag, className, value) => {
    const element = document.createElement(tag);
    if (className) element.className = className;
    if (value !== undefined) element.textContent = value;
    return element;
  };
  let graph = core.validateGraph(window.KeyTrailSample);
  let selected = graph.nodes[0].id;
  let focusId = selected;
  let trail = [selected];
  let route = null;
  let textMode = false;
  let demo = true;
  const positions = new Map();
  const nodeButtons = new Map();
  const node = id => graph.nodes.find(item => item.id === id);
  const label = id => node(id).label;
  function announce(message, error = false) {
    $('message').textContent = message;
    $('message').classList.toggle('error', error);
  }
  function selectNode(id, moveFocus = false, record = true) {
    if (!node(id)) return;
    selected = focusId = id;
    if (record && trail[trail.length - 1] !== id) trail = [...trail.slice(-19), id];
    updateNodeStates();
    renderDetails();
    $('selection-announcement').textContent = `${label(id)} selected. ${core.connections(graph, id).length} ${graph.directed ? 'outgoing ' : ''}connections.`;
    if (moveFocus) {
      if (textMode) { $('current-label').tabIndex = -1; $('current-label').focus(); }
      else nodeButtons.get(id).focus();
    }
  }
  function updateNodeStates() {
    for (const [id, button] of nodeButtons) {
      button.classList.toggle('selected', id === selected);
      button.classList.toggle('on-route', !!route?.includes(id));
      button.setAttribute('aria-pressed', String(id === selected));
      button.tabIndex = id === focusId ? 0 : -1;
    }
  }
  function makeSelectButton(id, className, value) {
    const button = make('button', className, value ?? label(id));
    button.type = 'button';
    button.addEventListener('click', () => selectNode(id, true));
    return button;
  }
  function renderDetails() {
    const current = node(selected);
    $('node-counter').textContent = `${String(graph.nodes.indexOf(current) + 1).padStart(2, '0')} / ${String(graph.nodes.length).padStart(2, '0')}`;
    $('current-label').textContent = current.label;
    $('current-description').textContent = current.description || 'No description was provided for this node.';
    $('outgoing-title').textContent = graph.directed ? 'Follow a connection' : 'Connected nodes';
    const outgoing = core.connections(graph, selected);
    $('connection-count').textContent = outgoing.length;
    $('connections').replaceChildren();
    for (const next of outgoing) {
      const button = makeSelectButton(next.id, 'connection', '');
      button.append(make('span', '', label(next.id)), make('small', '', next.label || 'Unlabeled connection'));
      const arrow = make('span', 'arrow', '→'); arrow.setAttribute('aria-hidden', 'true'); button.append(arrow);
      $('connections').append(button);
    }
    if (!outgoing.length) $('connections').append(make('p', 'empty-state', graph.directed ? 'No outgoing connections. Choose another node, or use Back to return.' : 'This node has no connections. Choose another node to continue.'));
    const incoming = graph.directed ? core.connections(graph, selected, true) : [];
    $('incoming-details').hidden = !graph.directed;
    $('incoming-count').textContent = `(${incoming.length})`;
    $('incoming').replaceChildren();
    if (!incoming.length) $('incoming').append(make('p', '', 'None.'));
    incoming.forEach(item => $('incoming').append(make('p', '', `${label(item.id)} → ${current.label}${item.label ? ` · ${item.label}` : ''}`)));
    $('trail').replaceChildren();
    trail.slice(-8).forEach((id, index, recent) => {
      const li = make('li');
      const button = makeSelectButton(id, '', label(id));
      if (index === recent.length - 1) button.setAttribute('aria-current', 'step');
      li.append(button); $('trail').append(li);
    });
    $('back').disabled = trail.length < 2;
  }
  function renderNodes() {
    positions.clear(); nodeButtons.clear(); $('nodes').replaceChildren();
    const total = graph.nodes.length;
    graph.nodes.forEach((item, index) => {
      let x, y;
      if (total === 1) { x = 450; y = 220; }
      else if (total <= 16) {
        const angle = -Math.PI / 2 + index * 2 * Math.PI / total;
        x = 450 + Math.cos(angle) * 335;
        y = 300 + Math.sin(angle) * 223;
      } else {
        const columns = Math.ceil(Math.sqrt(total * 1.5));
        const rows = Math.ceil(total / columns);
        x = 90 + (index % columns) * 720 / (columns - 1);
        y = 62 + Math.floor(index / columns) * 460 / Math.max(1, rows - 1);
      }
      positions.set(item.id, { x, y });
      const button = make('button', 'node focus-node');
      button.type = 'button'; button.dataset.node = item.id;
      button.style.left = `${x / 9}%`; button.style.top = `${y / 6.1}%`;
      if (total > 16) button.style.width = `${Math.min(12, 83 / Math.ceil(Math.sqrt(total * 1.5)))}%`;
      const number = make('span', 'node-number', String(index + 1).padStart(2, '0'));
      number.setAttribute('aria-hidden', 'true');
      button.append(number, make('span', '', item.label));
      button.setAttribute('aria-label', `${item.label}. Node ${index + 1} of ${total}`);
      button.addEventListener('click', () => selectNode(item.id));
      button.addEventListener('keydown', event => {
        const steps = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 };
        let next;
        if (Object.hasOwn(steps, event.key)) next = (index + steps[event.key] + total) % total;
        else if (event.key === 'Home') next = 0;
        else if (event.key === 'End') next = total - 1;
        else return;
        event.preventDefault(); focusId = graph.nodes[next].id; updateNodeStates(); nodeButtons.get(focusId).focus();
      });
      nodeButtons.set(item.id, button); $('nodes').append(button);
    });
    document.querySelector('.map-center').hidden = total > 16 || total < 3;
    updateNodeStates();
    requestAnimationFrame(drawEdges);
  }
  function drawEdges() {
    const stage = $('graph-stage');
    if (!stage.clientWidth || !stage.clientHeight) return;
    const ns = 'http://www.w3.org/2000/svg';
    const activePairs = core.pathEdges(route);
    $('edge-lines').replaceChildren();
    function endpoint(id, dx, dy) {
      const center = positions.get(id);
      const button = nodeButtons.get(id);
      const halfWidth = button.offsetWidth / stage.clientWidth * 450 + 7;
      const halfHeight = button.offsetHeight / stage.clientHeight * 305 + 7;
      const scale = 1 / Math.max(Math.abs(dx) / halfWidth, Math.abs(dy) / halfHeight);
      return { x: center.x + dx * scale, y: center.y + dy * scale };
    }
    for (const edge of graph.edges) {
      const a = positions.get(edge.source), b = positions.get(edge.target);
      const dx = b.x - a.x, dy = b.y - a.y;
      const start = endpoint(edge.source, dx, dy), end = endpoint(edge.target, -dx, -dy);
      const active = activePairs.some(([from, to]) => (from === edge.source && to === edge.target) || (!graph.directed && from === edge.target && to === edge.source));
      const element = document.createElementNS(ns, 'path');
      const reverse = graph.directed && graph.edges.some(item => item.source === edge.target && item.target === edge.source);
      if (reverse) {
        const length = Math.hypot(dx, dy);
        const cx = (start.x + end.x) / 2 - dy / length * 32;
        const cy = (start.y + end.y) / 2 + dx / length * 32;
        element.setAttribute('d', `M ${start.x} ${start.y} Q ${cx} ${cy} ${end.x} ${end.y}`);
      } else element.setAttribute('d', `M ${start.x} ${start.y} L ${end.x} ${end.y}`);
      element.setAttribute('class', `edge${active ? ' active' : ''}`);
      if (graph.directed) element.setAttribute('marker-end', active ? 'url(#arrow-active)' : 'url(#arrow)');
      $('edge-lines').append(element);
    }
  }
  function renderText() {
    $('text-connections').replaceChildren();
    for (const item of graph.nodes) {
      const section = make('section', 'text-node');
      section.append(makeSelectButton(item.id));
      if (item.description) section.append(make('p', '', item.description));
      const connected = core.connections(graph, item.id);
      if (!connected.length) section.append(make('p', '', graph.directed ? 'No outgoing connections.' : 'No connections.'));
      else {
        const list = make('ul');
        connected.forEach(next => list.append(make('li', '', `${item.label} ${graph.directed ? '→' : '↔'} ${label(next.id)}${next.label ? ` — ${next.label}` : ''}`)));
        section.append(list);
      }
      $('text-connections').append(section);
    }
  }
  function clearRoute() {
    route = null;
    $('route-result').classList.remove('no-route');
    $('route-result').replaceChildren(make('p', '', 'Pick two nodes to reveal a route.'));
    $('clear-route').hidden = true;
    updateNodeStates(); drawEdges();
  }
  function renderGraph() {
    $('graph-title').textContent = graph.title;
    $('graph-description').textContent = graph.description || 'Select a node to inspect its connections.';
    $('direction-badge').textContent = graph.directed ? 'DIRECTED GRAPH' : 'UNDIRECTED GRAPH';
    $('graph-count').textContent = `${graph.nodes.length} nodes · ${graph.edges.length} connections`;
    $('data-label').textContent = demo ? 'SYNTHETIC DEMO DATA' : 'YOUR LOCAL JSON';
    $('route-from').replaceChildren(); $('route-to').replaceChildren();
    for (const item of graph.nodes) {
      for (const id of ['route-from', 'route-to']) {
        const option = make('option', '', item.label); option.value = item.id; $(id).append(option);
      }
    }
    $('route-from').value = graph.nodes[0].id;
    $('route-to').value = demo ? 'archive' : graph.nodes[graph.nodes.length - 1].id;
    renderNodes(); renderDetails(); renderText(); clearRoute();
  }
  function switchView(showText) {
    textMode = showText;
    $('visual-panel').hidden = showText; $('text-panel').hidden = !showText;
    $('visual-view').setAttribute('aria-pressed', String(!showText));
    $('text-view').setAttribute('aria-pressed', String(showText));
    if (!showText) requestAnimationFrame(drawEdges);
  }
  $('visual-view').addEventListener('click', () => switchView(false));
  $('text-view').addEventListener('click', () => switchView(true));
  $('back').addEventListener('click', () => { if (trail.length > 1) { trail.pop(); selectNode(trail[trail.length - 1], true, false); } });
  $('use-start').addEventListener('click', () => {
    $('route-from').value = selected; clearRoute();
    announce(`${label(selected)} is the route start. Choose a destination, then find a route.`);
    $('route-to').focus();
  });
  $('route-from').addEventListener('change', clearRoute);
  $('route-to').addEventListener('change', clearRoute);
  $('route-form').addEventListener('submit', event => {
    event.preventDefault();
    const from = $('route-from').value, to = $('route-to').value;
    route = core.shortestPath(graph, from, to);
    const result = $('route-result'); result.replaceChildren();
    result.classList.toggle('no-route', route === null);
    if (route === null) {
      result.append(make('h3', '', 'No route found'), make('p', '', `There is no ${graph.directed ? 'directed ' : ''}path from ${label(from)} to ${label(to)}. These nodes may be disconnected, or the links may point the other way.`));
    } else {
      result.append(make('h3', '', route.length === 1 ? 'Already there · 0 connections' : `${route.length - 1} connections · one shortest route`));
      const steps = make('ol', 'route-steps');
      route.forEach(id => { const li = make('li'); li.append(makeSelectButton(id)); steps.append(li); });
      result.append(steps);
      const explanation = make('p', '', 'All links have equal cost. If several routes tie, the first in the JSON connection order is shown.');
      explanation.style.marginTop = '12px'; explanation.style.fontSize = '10px'; result.append(explanation);
    }
    $('clear-route').hidden = false; updateNodeStates(); drawEdges();
  });
  $('clear-route').addEventListener('click', () => {
    $('route-form').querySelector('button[type="submit"]').focus();
    clearRoute();
  });
  $('import').addEventListener('click', () => $('file-input').click());
  $('file-input').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > core.LIMITS.bytes) throw new Error('The file exceeds 256 KiB.');
      const candidate = core.parseGraph(await file.text());
      graph = candidate; demo = false; selected = focusId = graph.nodes[0].id; trail = [selected]; route = null;
      renderGraph();
      if (graph.nodes.length > 16) switchView(true);
      announce(`Imported ${graph.nodes.length} nodes and ${graph.edges.length} connections. ${graph.nodes.length > 16 ? 'Text view is selected for this larger graph. ' : ''}Your previous graph was replaced locally. Nothing was uploaded.`);
    } catch (error) { announce(`Import failed: ${error.message} Your current graph is unchanged.`, true); }
    finally { event.target.value = ''; }
  });
  let exportReturnFocus = null;
  let exportUrl = null;
  function releaseExportUrl() {
    if (exportUrl) { URL.revokeObjectURL(exportUrl); exportUrl = null; }
  }
  $('export').addEventListener('click', () => {
    exportReturnFocus = $('export');
    $('export-json').value = JSON.stringify(graph, null, 2) + '\n';
    $('export-summary').textContent = `${graph.nodes.length} nodes · ${graph.edges.length} connections`;
    $('export-status').textContent = '';
    $('export-dialog').showModal();
    $('export-title').focus();
  });
  $('export-close').addEventListener('click', () => $('export-dialog').close());
  $('export-dialog').addEventListener('cancel', event => {
    event.preventDefault();
    $('export-dialog').close();
  });
  $('export-dialog').addEventListener('close', () => {
    releaseExportUrl();
    const target = exportReturnFocus?.isConnected ? exportReturnFocus : $('export');
    target.focus();
  });
  $('export-select').addEventListener('click', () => {
    $('export-json').focus();
    $('export-json').select();
    $('export-json').setSelectionRange(0, $('export-json').value.length);
    $('export-status').textContent = 'JSON selected. Press Ctrl+C or Command+C to copy, then save it as keytrail-graph.json. No clipboard access is requested by this page.';
  });
  $('export-download').addEventListener('click', () => {
    releaseExportUrl();
    try {
      const blob = new Blob([$('export-json').value], { type: 'application/json' });
      exportUrl = URL.createObjectURL(blob);
      const link = make('a'); link.href = exportUrl; link.download = 'keytrail-graph.json'; link.hidden = true;
      $('export-dialog').append(link); link.click(); link.remove();
      $('export-status').textContent = 'Download requested. This page cannot confirm that a file was saved. Check your browser downloads, or use Select JSON to copy the content.';
    } catch {
      releaseExportUrl();
      $('export-status').textContent = 'The download could not be started. Use Select JSON, then copy the content and save it as keytrail-graph.json.';
    }
  });
  $('reset').addEventListener('click', () => {
    graph = core.validateGraph(window.KeyTrailSample); demo = true; selected = focusId = graph.nodes[0].id; trail = [selected]; route = null;
    switchView(false); renderGraph(); announce('The synthetic demo graph has been restored. Imported data was removed from this page.');
  });
  $('edges').setAttribute('preserveAspectRatio', 'none');
  renderGraph();
  if ('ResizeObserver' in window) new ResizeObserver(drawEdges).observe($('graph-stage'));
  else window.addEventListener('resize', drawEdges);
})();
