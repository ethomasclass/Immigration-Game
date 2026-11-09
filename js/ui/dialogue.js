// Dialogue box: shows lines one at a time, plays voiceover, offers choices.
import { DIALOGUE } from '../data/dialogue.js';
import { CHARACTERS } from '../data/characters.js';
import { state, flag, setFlag, addNote, save } from '../state.js';
import { playVoice, stopVoice, sfx } from '../engine/audio.js';
import { artURL } from '../engine/textures.js';
import { richText, esc } from './text.js';

const el = {
  box: document.getElementById('dialogue'),
  portrait: document.getElementById('dlg-portrait'),
  name: document.getElementById('dlg-name'),
  text: document.getElementById('dlg-text'),
  choices: document.getElementById('dlg-choices'),
  next: document.getElementById('dlg-next'),
};

export class Dialogue {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.seen = new Set(); // "tree.node" visited (to grey out asked questions)
    el.box.addEventListener('click', (e) => {
      if (e.target.closest('button') || e.target.closest('.term')) return;
      this.advance();
    });
    addEventListener('keydown', (e) => {
      if (!this.active) return;
      if (e.code === 'Space' || e.code === 'Enter' || e.code === 'KeyE') { e.preventDefault(); this.advance(); }
      const n = parseInt(e.key, 10);
      if (n >= 1 && n <= 9 && this.choiceList && performance.now() - this.startedAt > 200) { const c = this.choiceList[n - 1]; if (c) this.choose(c); }
    });
  }

  start(treeId, onEnd) {
    const tree = DIALOGUE[treeId];
    if (!tree) { console.warn('No dialogue', treeId); return; }
    this.tree = tree; this.treeId = treeId; this.onEnd = onEnd;
    this.active = true;
    this.startedAt = performance.now();
    el.box.classList.remove('hidden');
    this.goto('start');
  }

  goto(nodeId) {
    const node = this.tree.nodes[nodeId];
    if (!node) return this.close();
    if (node.branch) {
      const b = node.branch.find(br => !br.if || flag(br.if));
      return this.goto(b.next);
    }
    this.nodeId = nodeId; this.node = node;
    this.seen.add(this.treeId + '.' + nodeId);
    (node.set || []).forEach(setFlag);
    if (node.note && addNote(this.game.zoneId, node.note)) this.game.toast('<b>Notebook:</b> new note added (J)');
    this.lineIndex = -1;
    this.choiceList = null;
    save();
    this.nextLine();
  }

  nextLine() {
    const lines = this.node.lines || [];
    this.lineIndex++;
    if (this.lineIndex < lines.length) {
      const ln = lines[this.lineIndex];
      const who = typeof ln === 'string' ? this.tree.speaker : ln.who;
      const text = typeof ln === 'string' ? ln : ln.text;
      const id = `${this.treeId}.${this.nodeId}.${this.lineIndex + 1}`;
      this.show(who, text);
      playVoice(id, text, who);
      el.choices.innerHTML = '';
      el.next.classList.remove('hidden');
      return;
    }
    // Lines finished.
    if (this.node.doc && !this.docShown) {
      this.docShown = true;
      el.box.classList.add('hidden');
      this.game.readDoc(this.node.doc, () => { el.box.classList.remove('hidden'); this.finishNode(); });
      return;
    }
    this.finishNode();
  }

  finishNode() {
    this.docShown = false;
    const node = this.node;
    if (node.action) this.game.zone.onAction(node.action);
    if (node.choices) {
      const list = node.choices.filter(c => (!c.if || flag(c.if)) && (!c.ifNot || !flag(c.ifNot)));
      if (list.length) return this.showChoices(list);
    }
    if (node.next) return this.goto(node.next);
    this.close();
  }

  showChoices(list) {
    this.choiceList = list;
    el.next.classList.add('hidden');
    if (!(this.node.lines || []).length) {
      // Hub node: keep the previous line on screen, but show speaker portrait.
      this.show(this.tree.speaker, el.text.dataset.raw || '', true);
    }
    el.choices.innerHTML = '';
    list.forEach((c, i) => {
      const b = document.createElement('button');
      const visited = this.seen.has(this.treeId + '.' + c.next) && c.next !== 'bye';
      b.innerHTML = `<span class="num">${i + 1}.</span>${esc(c.text)}`;
      if (visited) b.classList.add('seen');
      b.addEventListener('click', (e) => { e.stopPropagation(); this.choose(c); });
      el.choices.appendChild(b);
    });
  }

  choose(c) {
    sfx('page');
    stopVoice();
    this.goto(c.next);
  }

  advance() {
    if (!this.active || this.choiceList) return;
    if (performance.now() - this.startedAt < 200) return;
    stopVoice();
    this.nextLine();
  }

  show(who, text, keep = false) {
    const c = CHARACTERS[who] || {};
    const narr = who === 'narrator';
    el.name.innerHTML = narr ? '' : `${esc(c.name || who)}<span class="role">${esc(c.role || '')}</span>`;
    if (!keep) { el.text.innerHTML = richText(text); el.text.dataset.raw = text; }
    el.text.classList.toggle('narration', narr);
    // Portrait: uses portrait_<id> art if present, else char_<id> wrap texture.
    if (narr) { el.portrait.style.visibility = 'hidden'; return; }
    el.portrait.style.visibility = 'visible';
    const url = this.game.portraitURL(who);
    el.portrait.style.backgroundImage = url ? `url(${url})` : '';
    el.portrait.textContent = url && this.game.hasPortrait(who) ? '' : (c.name || '').split(' ').map(w => w[0]).join('').slice(0, 3);
  }

  close() {
    stopVoice();
    this.active = false;
    this.choiceList = null;
    el.box.classList.add('hidden');
    const cb = this.onEnd; this.onEnd = null;
    cb && cb();
  }
}
