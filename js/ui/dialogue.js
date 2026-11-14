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
    this.active = true; this.queues = {}; this.queueOrder = []; this.directed = false;
    this.startedAt = performance.now();
    el.box.classList.remove('hidden');
    this.goto('start');
  }

  goto(nodeId) {
    const node = this.tree.nodes[nodeId];
    if (!node) return this.close();
    // Coming back to a listen node: carry on with the next thing they have to say.
    if (this.queues[nodeId]) return this.continueListen();
    if (node.branch) {
      (node.set || []).forEach(setFlag);
      const b = node.branch.find(br => (!br.if || flag(br.if)) && (!br.ifNot || !flag(br.ifNot)));
      return this.goto(b.next);
    }
    this.nodeId = nodeId; this.node = node;
    this.seen.add(this.treeId + '.' + nodeId);
    (node.set || []).forEach(setFlag);
    if (node.note && addNote(this.game.zoneId, node.note)) this.game.toast('<b>Notebook:</b> new note added (J)');
    if (node.spend) this.game.spend(node.spend, node.spendFor);
    if (node.keep) this.game.keep(node.keep);
    if (node.photo) this.game.photo.take(node.photo);            // a picture taken as part of the scene
    if (node.remember) this.game.remember(node.remember);         // "Rivka will remember that."
    this.lineIndex = -1;
    this.choiceList = null;
    save();
    this.game.refreshObjectives();
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
      // mood: 'up' | 'down' on a line or its node swaps in the speaker's expression close-up
      const mood = (typeof ln === 'object' && ln.mood) || (who === this.tree.speaker ? this.node.mood : null) || null;
      this.show(who, text, false, mood);
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
      if (node.listen) {
        // Listen-first: the person tells you what matters, in order. No menu of questions.
        const q = [];
        for (const id of node.listen) { const c = list.find(c => c.next === id); if (c && !q.includes(c.next)) q.push(c.next); }
        this.queues[this.nodeId] = { q, ask: (node.ask || []).map(id => list.find(c => c.next === id)).filter(Boolean) };
        this.queueOrder.push(this.nodeId);
        return this.continueListen();
      }
      if (list.length) return this.showChoices(list);
    }
    if (node.next) return this.goto(node.next);
    if (this.queueOrder.length) return this.continueListen();
    this.close();
  }

  /** Play the next item of the innermost open listen list; offer any small "ask" (a purchase, a ride) at the end. */
  continueListen() {
    while (this.queueOrder.length) {
      const hub = this.queueOrder[this.queueOrder.length - 1], st = this.queues[hub];
      if (st.q.length) { const next = st.q.shift(); return this.goto(next); }
      if (st.ask.length) {
        const ask = st.ask; st.ask = [];
        this.node = this.tree.nodes[hub]; this.nodeId = hub;
        return this.showChoices([...ask, { text: '(Move on.)', next: '__close' }]);
      }
      this.queueOrder.pop();
    }
    // Listen conversations end with a direction from the speaker: where to go next.
    if (this.tree.direct && !this.directed) { this.directed = true; this.node = { lines: [this.tree.direct] }; this.nodeId = '__direct'; this.lineIndex = -1; return this.nextLine(); }
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
      b.innerHTML = `<span class="num">${i + 1}.</span>${c.key && !visited ? '<span class="keyq">&#9733;</span> ' : ''}${esc(c.text)}`;
      if (visited) b.classList.add('seen');
      b.addEventListener('click', (e) => { e.stopPropagation(); this.choose(c); });
      el.choices.appendChild(b);
    });
  }

  choose(c) {
    sfx('page');
    stopVoice();
    if (c.next === '__close') { this.queueOrder = []; return this.close(); }
    this.goto(c.next);
  }

  advance() {
    if (!this.active || this.choiceList) return;
    if (performance.now() - this.startedAt < 200) return;
    stopVoice();
    this.nextLine();
  }

  show(who, text, keep = false, mood = null) {
    this.currentWho = who; this.currentTree = this.treeId;
    const c = CHARACTERS[who] || {};
    const narr = who === 'narrator';
    el.name.innerHTML = narr ? '' : `<span class="nm">${esc(c.name || who)}</span><span class="role">${esc(c.role || '')}</span>`;
    el.box.classList.toggle('narr', narr);
    if (!keep) { el.text.innerHTML = richText(text); el.text.dataset.raw = text; }
    el.text.classList.toggle('narration', narr);
    // Portrait: the same portrait_<id> art used for the character in the world.
    if (narr) { el.portrait.style.visibility = 'hidden'; return; }
    el.portrait.style.visibility = 'visible';
    const art = this.game.portraitURL(who, mood);
    el.portrait.style.backgroundImage = art ? `url(${art.url})` : '';
    el.portrait.classList.toggle('bust', !!(art && art.bust));
    el.portrait.textContent = art ? '' : (c.name || '').split(' ').map(w => w[0]).join('').slice(0, 3);
    if (!keep) {
      // small entrance each line, a bigger one when the speaker changes
      el.text.classList.remove('line-in'); void el.text.offsetWidth; el.text.classList.add('line-in');
      if (this.lastWho !== who) { el.portrait.classList.remove('pop'); void el.portrait.offsetWidth; el.portrait.classList.add('pop'); }
      this.lastWho = who;
    }
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
