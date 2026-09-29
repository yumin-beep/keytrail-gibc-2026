'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { validateGraph, parseGraph, connections, shortestPath, pathEdges, LIMITS } = require('./core.js');
const context = { window: {} };
vm.runInNewContext(fs.readFileSync(`${__dirname}/sample.js`, 'utf8'), context);
const sample = JSON.parse(JSON.stringify(context.window.KeyTrailSample));
let passed = 0;
function test(name, fn) { fn(); passed++; process.stdout.write(`PASS ${name}\n`); }
function graph(nodes, edges, directed = true) {
  return validateGraph({ version: 1, title: 'Test', directed, nodes: nodes.map(id => ({ id, label: id })), edges: edges.map(([source, target]) => ({ source, target })) });
}
test('sample: authored data is valid and has 10 nodes / 12 edges', () => {
  const g = validateGraph(sample); assert.equal(g.nodes.length, 10); assert.equal(g.edges.length, 12);
});
test('sample: BFS selects the genuinely shorter branch', () => {
  assert.deepEqual(shortestPath(validateGraph(sample), 'question', 'archive'), ['question', 'sources', 'notes', 'review', 'share', 'archive']);
});
test('directed edges cannot be traversed in reverse', () => assert.equal(shortestPath(graph(['a','b'], [['a','b']]), 'b','a'), null));
test('undirected edges work in both directions', () => assert.deepEqual(shortestPath(graph(['a','b'], [['a','b']], false), 'b','a'), ['b','a']));
test('cycles terminate and preserve the shortest route', () => assert.deepEqual(shortestPath(graph(['a','b','c','d'], [['a','b'],['b','a'],['b','c'],['a','d'],['d','c']]), 'a','c'), ['a','b','c']));
test('disconnected destination is not fabricated', () => assert.equal(shortestPath(validateGraph(sample), 'question','parking'), null));
test('same start/end requires zero connections', () => assert.deepEqual(shortestPath(validateGraph(sample), 'parking','parking'), ['parking']));
test('tie follows input connection order deterministically', () => assert.deepEqual(shortestPath(graph(['a','b','c','d'], [['a','c'],['a','b'],['b','d'],['c','d']]), 'a','d'), ['a','c','d']));
test('incoming and outgoing connections are distinct', () => {
  const g = graph(['a','b','c'], [['a','b'],['c','a']]);
  assert.deepEqual(connections(g,'a').map(v=>v.id), ['b']); assert.deepEqual(connections(g,'a',true).map(v=>v.id), ['c']);
});
test('JSON export/import preserves normalized graph', () => { const g = validateGraph(sample); assert.deepEqual(parseGraph(JSON.stringify(g)), g); });
test('UTF-8 BOM is accepted', () => assert.equal(parseGraph('\ufeff' + JSON.stringify(sample)).nodes.length, 10));
test('invalid JSON is rejected clearly', () => assert.throws(()=>parseGraph('{bad'), /valid JSON/));
test('root array is rejected', () => assert.throws(()=>validateGraph([]), /must be an object/));
test('missing / wrong version is rejected', () => assert.throws(()=>validateGraph({...sample,version:2}), /version/));
test('nonboolean direction is rejected', () => assert.throws(()=>validateGraph({...sample,directed:'false'}), /true or false/));
test('empty graph is rejected', () => assert.throws(()=>validateGraph({...sample,nodes:[]}), /1–60/));
test('duplicate ids are rejected', () => assert.throws(()=>validateGraph({...sample,nodes:[sample.nodes[0],sample.nodes[0]]}), /duplicate id/));
test('unsafe / malformed ids are rejected', () => assert.throws(()=>validateGraph({...sample,nodes:[{id:'<svg>',label:'x'}]}), /id must/));
test('dangling edges are rejected', () => assert.throws(()=>validateGraph({...sample,edges:[{source:'question',target:'missing'}]}), /existing node/));
test('duplicate undirected reverse links are rejected', () => assert.throws(()=>graph(['a','b'], [['a','b'],['b','a']],false), /duplicate connection/));
test('self-links are rejected explicitly', () => assert.throws(()=>graph(['a'],[['a','a']]), /self-connections/));
test('unrecognized schema fields are rejected', () => assert.throws(()=>validateGraph({...sample,url:'https://example.com'}), /unknown field/));
test('prototype-named unknown fields are rejected as data', () => assert.throws(()=>parseGraph(JSON.stringify(sample).replace('"version":1','"__proto__":{},"version":1')), /unknown field/));
test('nontext labels are rejected', () => assert.throws(()=>validateGraph({...sample,nodes:[{id:'a',label:44}]}), /must be text/));
test('overlong descriptions are rejected', () => assert.throws(()=>validateGraph({...sample,description:'x'.repeat(801)}), /800/));
test('too many nodes are rejected', () => assert.throws(()=>validateGraph({...sample,nodes:Array.from({length:61},(_,i)=>({id:`n${i}`,label:'n'})),edges:[]}), /1–60/));
test('UTF-8 byte size is enforced, not just JS character count', () => assert.throws(()=>parseGraph('한'.repeat(LIMITS.bytes/3+1)), /256 KiB/));
test('unknown route endpoint is rejected', () => assert.throws(()=>shortestPath(validateGraph(sample),'question','unknown'), /existing start/));
test('HTML-like labels remain literal text in the model', () => { const g=validateGraph({...sample,nodes:[{id:'a',label:'<img src=x onerror=alert(1)>'}],edges:[]}); assert.equal(g.nodes[0].label,'<img src=x onerror=alert(1)>'); });
test('validation does not mutate source data', () => { const before=JSON.stringify(sample); validateGraph(sample); assert.equal(JSON.stringify(sample),before); });
test('maximum supported graph is handled', () => {
  const ids=Array.from({length:60},(_,i)=>`n${i}`), edges=ids.slice(1).map((id,i)=>[ids[i],id]);
  const g=graph(ids,edges); assert.equal(shortestPath(g,'n0','n59').length,60);
});
test('path edge extraction handles empty and zero-hop routes', () => { assert.deepEqual(pathEdges(null),[]); assert.deepEqual(pathEdges(['a']),[]); assert.deepEqual(pathEdges(['a','b','c']),[['a','b'],['b','c']]); });
process.stdout.write(`\n${passed} checks passed. These are algorithm and input tests, not usability or screen-reader validation.\n`);
