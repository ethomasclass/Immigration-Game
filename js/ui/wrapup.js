// Wrap-up: sort photos into the evidence chart, answer the supporting question,
// and see the story printed. Students then copy their chart to the paper handout.
import { state, save } from '../state.js';
import { WRAPUPS } from '../data/evidence.js';
import { esc } from './text.js';
import { roman } from './journal.js';
import { sfx } from '../engine/audio.js';

const root = document.getElementById('wrapup');
const box = document.getElementById('wrap-content');

export class Wrapup {
  constructor(game) { this.game = game; }

  open(part) {
    this.part = part;
    this.cfg = WRAPUPS[part];
    root.classList.remove('hidden');
    this.step = 0;
    this.render();
  }
  close() { root.classList.add('hidden'); save(); }

  photos() { return state.photos.filter(p => this.cfg.zones.includes(p.zone)); }

  render() {
    [this.intro, this.sort, this.answer, this.result][this.step].call(this);
    box.scrollTop = 0;
    box.querySelectorAll('textarea, input').forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
  }

  intro() {
    const n = this.photos().length;
    box.innerHTML = `
      <h1>Developing Your Plates</h1>
      <p style="text-align:center">In the darkroom, your photographs slowly appear. Your editor wants your answer to one question:</p>
      <div class="question">${esc(this.cfg.question)}</div>
      <p style="text-align:center">You took <b>${n}</b> photograph${n === 1 ? '' : 's'} for this part of the story.</p>
      ${n < 3 ? '<p style="text-align:center;color:#8e2f25">You have very few photographs. You can go back and take more, or continue anyway.</p>' : ''}
      <div class="row">
        ${n < 3 ? '<button class="btn" data-act="back">Go back and explore</button>' : ''}
        <button class="btn big" data-act="next">Sort my evidence &#9656;</button>
      </div>`;
    this.wire();
  }

  sort() {
    const ph = this.photos();
    const chart = state.chart[this.part];
    const cols = this.cfg.columns;
    const chips = (key) => ph.filter(p => chart[p.id] === key)
      .map(p => `<div class="chip"><img src="${p.img}" alt=""><span>${esc(p.title)}</span></div>`).join('') || '<p class="hint">(none yet)</p>';
    box.innerHTML = `
      <h2>Evidence Chart</h2>
      <div class="question" style="font-size:1.15rem">${esc(this.cfg.question)}</div>
      <div class="chart">
        ${cols.map(c => `<div class="col"><h3>${esc(c.title)}</h3><p class="hint">${esc(c.hint)}</p>${chips(c.key)}</div>`).join('')}
      </div>
      <p>Choose a column for each photograph. Which group of people does it show acting, helping, or hurting newcomers? Leave out photos you don't need.</p>
      <div class="pick-grid">
        ${ph.map((p, i) => `
          <div class="pick">
            <img src="${p.img}" alt="">
            <b>${roman(i + 1)}. ${esc(p.title)}</b><br><span class="muted">${esc(p.desc)}</span>
            ${p.caption ? `<br><i>"${esc(p.caption)}"</i>` : ''}
            <select data-photo="${p.id}">
              <option value="">(not using)</option>
              ${cols.map(c => `<option value="${c.key}" ${chart[p.id] === c.key ? 'selected' : ''}>${esc(c.title)}</option>`).join('')}
            </select>
          </div>`).join('') || '<div class="empty">No photographs from this part of the story.</div>'}
      </div>
      <div class="row">
        <button class="btn" data-act="prev">&#9666; Back</button>
        <button class="btn big" data-act="next">Write my answer &#9656;</button>
      </div>`;
    box.querySelectorAll('select[data-photo]').forEach(s => s.addEventListener('change', () => {
      if (s.value) chart[s.dataset.photo] = s.value; else delete chart[s.dataset.photo];
      save(); this.render();
    }));
    this.wire();
  }

  answer() {
    const a = state.answers[this.part];
    box.innerHTML = `
      <h2>Your Answer</h2>
      <div class="question">${esc(this.cfg.question)}</div>
      <div class="stance">
        ${this.cfg.stances.map(s => `<label><input type="radio" name="stance" value="${esc(s)}" ${a.stance === s ? 'checked' : ''}>${esc(s)}</label>`).join('')}
      </div>
      <p>Explain your answer in 2 or 3 sentences. Use at least one piece of evidence from your photographs or notebook.</p>
      <textarea id="answer-text" placeholder="I think... because... For example, I photographed...">${esc(a.text)}</textarea>
      <div class="row">
        <button class="btn" data-act="prev">&#9666; Back</button>
        <button class="btn big" data-act="next">Print my story &#9656;</button>
      </div>`;
    box.querySelectorAll('input[name=stance]').forEach(r => r.addEventListener('change', () => { a.stance = r.value; save(); }));
    const ta = box.querySelector('#answer-text');
    ta.addEventListener('input', () => { a.text = ta.value; save(); });
    this.wire();
  }

  result() {
    sfx('chime');
    const a = state.answers[this.part];
    const ph = this.photos();
    const chart = state.chart[this.part];
    const lead = ph.find(p => chart[p.id]) || ph[0];
    const headline = this.part === 'A'
      ? (a.stance === 'Yes' ? 'A Land of Opportunity' : a.stance === 'No' ? 'A Hard Welcome' : 'Opportunity, For Some')
      : (a.stance === 'Helped them' ? 'The Machine That Feeds the City' : a.stance === 'Took advantage of them' ? 'Bosses Grow Fat on the Poor' : 'The City Gives, The City Takes');
    const rows = this.cfg.columns.map(c => {
      const items = ph.filter(p => chart[p.id] === c.key);
      return `<tr><th>${esc(c.title)}</th><td>${items.map(p => `<b>${esc(p.title)}</b>: ${esc(p.caption || p.desc)}`).join('<br>') || '<i>(nothing yet)</i>'}</td></tr>`;
    }).join('');
    box.innerHTML = `
      <div class="newspaper">
        <div class="masthead">The Evening Courier</div>
        <div class="dateline"><span>NEW YORK, 1888</span><span>PRICE TWO CENTS</span></div>
        <div class="headline">${esc(headline)}</div>
        <div class="byline">Photographs and story by our own correspondent</div>
        ${lead ? `<img src="${lead.img}" alt=""><p style="text-align:center;font-style:italic;margin:4px 0 12px">${esc(lead.title)}: ${esc(lead.caption || lead.desc)}</p>` : ''}
        <div class="cols"><p><b>${esc(this.cfg.question)}</b></p><p>${esc(a.text || '(Your answer goes here.)')}</p></div>
      </div>
      <div class="handout" style="margin-top:20px">
        <h2>Copy This to Your Handout</h2>
        <p><b>Question:</b> ${esc(this.cfg.question)}<br><b>My answer:</b> ${esc(a.stance || '(not chosen)')}</p>
        <table>${rows}</table>
      </div>
      <div class="row">
        <button class="btn" data-act="prev">&#9666; Edit my answer</button>
        <button class="btn" data-act="print">Print</button>
        ${this.part === 'A' ? '<button class="btn big" data-act="city">Continue to Chapter IV: The City &#9656;</button>' : ''}
        <button class="btn" data-act="menu">Main Menu</button>
      </div>`;
    this.wire();
  }

  wire() {
    box.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'next') { this.step++; this.render(); }
      else if (act === 'prev') { this.step--; this.render(); }
      else if (act === 'print') window.print();
      else if (act === 'back') { this.close(); this.game.resumeFromWrapup(); }
      else if (act === 'city') { this.close(); this.game.loadZone('city'); }
      else if (act === 'menu') { this.close(); this.game.showMenu(); }
    }));
  }
}
