// Static check of story data: links, speakers, documents, keepsakes, photo subjects, zone usage.
import fs from 'fs';
const R = process.argv[2];
const D = await import(R + '/js/data/dialogue.js'), C = (await import(R + '/js/data/characters.js')).CHARACTERS;
const K = (await import(R + '/js/data/keepsakes.js')).KEEPSAKES, E = await import(R + '/js/data/evidence.js');
const TREES = D.DIALOGUE || D.TREES || D.default || Object.values(D).find(v => v && v.rivka && v.rivka.nodes);
const SUBJ = E.SUBJECTS || E.EVIDENCE || Object.values(E).find(v => v && v.rivka && v.rivka.title);
const P = [], src = ['ship', 'castle', 'les', 'city'].map(z => fs.readFileSync(`${R}/js/zones/${z}.js`, 'utf8')).join('\n') + fs.readFileSync(R + '/js/main.js', 'utf8') + fs.readFileSync(R + '/js/engine/world.js', 'utf8');
let nodes = 0, lines = 0;
for (const [tid, t] of Object.entries(TREES)) {
  if (!C[t.speaker]) P.push(`${tid}: unknown speaker ${t.speaker}`);
  const N = t.nodes || {}; if (!N.start) P.push(`${tid}: no start node`);
  const seen = new Set(['start']), q = ['start'];
  const link = (from, to) => { if (!to || to === 'bye' && !N.bye) return; if (!N[to]) { P.push(`${tid}.${from}: goes to missing node "${to}"`); return; } if (!seen.has(to)) { seen.add(to); q.push(to); } };
  while (q.length) {
    const id = q.pop(), n = N[id]; if (!n) continue; nodes++;
    for (const ln of n.lines || []) { lines++; if (typeof ln === 'object') { if (!C[ln.who]) P.push(`${tid}.${id}: unknown speaker ${ln.who}`); if (!ln.text) P.push(`${tid}.${id}: empty line`); } else if (!ln.trim()) P.push(`${tid}.${id}: empty line`); }
    if (n.doc && !D.DOCS[n.doc]) P.push(`${tid}.${id}: missing document "${n.doc}"`);
    for (const k of [].concat(n.keep || [])) if (!K[k]) P.push(`${tid}.${id}: missing keepsake "${k}"`);
    if (n.mood && !['up', 'down'].includes(n.mood)) P.push(`${tid}.${id}: bad mood`);
    link(id, typeof n.next === 'string' ? n.next : null);
    for (const b of n.branch || []) link(id, b.next || b.to || b.goto);
    for (const c of n.choices || []) { if (!c.text) P.push(`${tid}.${id}: choice without text`); link(id, c.next); }
    if (n.action && !src.includes(`'${n.action}'`)) P.push(`${tid}.${id}: action "${n.action}" is not handled by any scene`);
    if (!(n.lines || []).length && !(n.choices || []).length && !n.next && !n.branch && id !== 'bye') P.push(`${tid}.${id}: empty dead end`);
  }
  for (const id of Object.keys(N)) if (!seen.has(id)) P.push(`${tid}.${id}: node can never be reached`);
  if (!src.includes(`'${tid}'`)) P.push(`${tid}: conversation is never started by any scene`);
}
for (const [id, s] of Object.entries(SUBJ)) if (!new RegExp(`['"\`]${id}['"\`]`).test(src) && !JSON.stringify(TREES).includes(`"photo":"${id}"`)) P.push(`photo subject "${id}" (${s.title}) cannot be photographed anywhere`);
for (const id of Object.keys(D.DOCS)) if (!src.includes(`'${id}'`) && !JSON.stringify(TREES).includes(`"doc":"${id}"`)) P.push(`document "${id}" is never shown`);
for (const id of Object.keys(K)) if (!JSON.stringify(TREES).includes(`"${id}"`) && !src.includes(`'${id}'`)) P.push(`keepsake "${id}" is never given`);
for (const m of src.matchAll(/this\.(?:person|walker)\('?(\w+)'?|id: '(\w+)'/g)) { const id = m[1] || m[2]; if (id && isNaN(id) && !C[id] && !/^(crowd|i|n)$/.test(id)) P.push(`scene uses unknown character "${id}"`); }
console.log(`${Object.keys(TREES).length} conversations, ${nodes} steps, ${lines} lines, ${Object.keys(SUBJ).length} photo subjects, ${Object.keys(D.DOCS).length} documents`);
console.log([...new Set(P)].join('\n') || 'no problems');
