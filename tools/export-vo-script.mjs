// Export every voiced line to a CSV for ElevenLabs.
//   node tools/export-vo-script.mjs
// Writes assets/audio/vo_script.csv  (columns: file, character, voice_notes, text)
// Save each ElevenLabs result as assets/audio/vo/<file>.
import { writeFileSync } from 'node:fs';
import { DIALOGUE, DOCS, CARDS } from '../js/data/dialogue.js';
import { CHARACTERS } from '../js/data/characters.js';

const plain = (t) => String(t).replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');
const q = (s) => '"' + String(s).replace(/"/g, '""') + '"';
const rows = [['file', 'character', 'voice_notes', 'text']];
const add = (id, who, text) => {
  const c = CHARACTERS[who] || {};
  rows.push([`${id}.mp3`, c.name || who, c.voice || '', plain(text)]);
};

for (const [k, c] of Object.entries(CARDS)) add(`card.${k}`, 'narrator', c.text);
for (const [treeId, tree] of Object.entries(DIALOGUE)) {
  for (const [nodeId, node] of Object.entries(tree.nodes)) {
    (node.lines || []).forEach((ln, i) => {
      const who = typeof ln === 'string' ? tree.speaker : ln.who;
      const text = typeof ln === 'string' ? ln : ln.text;
      add(`${treeId}.${nodeId}.${i + 1}`, who, text);
    });
  }
}
for (const [k, d] of Object.entries(DOCS)) add(`doc.${k}`, 'narrator', d.text);

writeFileSync(new URL('../assets/audio/vo_script.csv', import.meta.url), rows.map(r => r.map(q).join(',')).join('\n') + '\n');

// Per-character summary
const by = {};
for (const r of rows.slice(1)) by[r[1]] = (by[r[1]] || 0) + 1;
console.log(`Wrote ${rows.length - 1} lines to assets/audio/vo_script.csv`);
for (const [k, v] of Object.entries(by).sort((a, b) => b[1] - a[1])) console.log(`  ${String(v).padStart(3)}  ${k}`);
