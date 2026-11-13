// Wrap-up: sort photos into the evidence chart, answer the supporting question,
// and see the story printed. Students then copy their chart to the paper handout.
import { state, save, flag } from '../state.js';
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
    this.step = 0; this.rocks = 0;
    this.render();
  }
  close() { root.classList.add('hidden'); save(); }

  photos() { return state.photos.filter(p => this.cfg.zones.includes(p.zone)); }

  steps() { return this.part === 'A' ? [this.intro, this.frontPage, this.sort, this.answer, this.result] : [this.intro, this.sort, this.answer, this.result]; }

  render() {
    this.steps()[this.step].call(this);
    box.scrollTop = 0;
    box.querySelectorAll('textarea, input').forEach(i => i.addEventListener('keydown', e => e.stopPropagation()));
  }

  // ---- the darkroom: rock the tray and watch your best plate appear ----
  intro() {
    const ph = this.photos(), n = ph.length;
    const plate = (this.part === 'A' && (ph.find(p => p.subject === 'girl') || ph.find(p => p.subject === 'sweatshop'))) || ph.find(p => p.subject) || ph[0];
    this.rocks = this.rocks || 0;
    const need = 6, k = Math.min(1, this.rocks / need), done = k >= 1 || !plate;
    box.innerHTML = `
      <h1>The Darkroom</h1>
      <p style="text-align:center">Under the red lamp, you slide a glass plate into the developing tray. ${plate ? 'Rock the tray gently and watch.' : ''}</p>
      ${plate ? `<div class="tray-wrap"><div class="tray" id="tray"><img src="${plate.img}" alt="" style="opacity:${0.04 + k * 0.96};filter:contrast(${0.4 + k * 0.7}) brightness(${1.6 - k * 0.6})"><div class="tray-liquid"></div></div></div>
      <p style="text-align:center;min-height:1.6em"><i>${done ? esc(plate.title) + '. ' + esc(plate.caption || plate.desc) : ['Nothing yet...', 'A shadow.', 'Shapes.', 'A room... people.', 'Faces.', 'Almost.'][Math.min(5, this.rocks)]}</i></p>` : ''}
      ${done ? `<p style="text-align:center">You took <b>${n}</b> photograph${n === 1 ? '' : 's'} for this part of the story. Your editor wants your answer to one question:</p>
      <div class="question">${esc(this.cfg.question)}</div>
      ${n < 3 ? '<p style="text-align:center;color:#e66a4e">You have very few photographs. You can go back and take more, or continue anyway.</p>' : ''}` : ''}
      <div class="row">
        ${!done ? '<button class="btn big" data-act="rock">Rock the tray</button>' : ''}
        ${done && n < 3 ? '<button class="btn" data-act="back">Go back and explore</button>' : ''}
        ${done ? '<button class="btn big" data-act="next">Continue &#9656;</button>' : ''}
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

  // ---- Day 1's hardest choice: Sarah's face on the front page ----
  frontPage() {
    const sarah = state.photos.find(p => p.subject === 'girl') || state.photos.find(p => p.subject === 'sweatshop');
    if (!sarah || flag('printed_sarah') || flag('sarah_kept')) {
      if (!sarah && !flag('printed_sarah')) state.flags.sarah_kept = true;
      this.step++; return this.render();
    }
    box.innerHTML = `
      <h2>The Front Page</h2>
      <p style="text-align:center">Your editor holds up one plate to the light. It is the photograph of Sarah, ten years old, sewing buttons by lamplight.</p>
      <div style="max-width:340px;margin:8px auto"><img src="${sarah.img}" alt="" style="width:100%;border:2px solid #8a6a26;border-radius:4px"></div>
      <p style="text-align:center;font-size:1.15rem"><i>"This one. This is the front page. Nobody uptown will turn past this face."</i></p>
      <div class="chart" style="grid-template-columns:1fr 1fr">
        <div class="col"><h3>Moishe begged you</h3><p>"Not my Sarah's face. Mr. Kessler reads the papers. If he sees a child working in his coats, the work goes to the next family."</p></div>
        <div class="col"><h3>Jacob Riis told you</h3><p>"A child's face at a sewing machine, nobody forgets. Faces change laws. And sometimes faces cost a family its work."</p></div>
      </div>
      <p style="text-align:center"><b>What will you do?</b> You cannot take it back.</p>
      <div class="row">
        <button class="btn big" data-act="printSarah">Print Sarah's face on the front page</button>
        <button class="btn big" data-act="keepSarah">Keep your promise. Leave her out.</button>
      </div>`;
    this.wire();
  }

  /** The ending names the path the student took: the camera first, the person first, or torn between. */
  kind() {
    const f = (k) => flag(k), rows = [];
    let cam = 0, per = 0;
    const add = (side, text) => { rows.push([side, text]); if (side === 'cam') cam++; else if (side === 'per') per++; };
    if (f('photo_rivka')) add('per', 'You took the picture Rivka asked for, and brought her the print.'); else add('none', 'Rivka asked for a picture for her grandmother. You never took it.');
    if (f('paid_telegram')) add('per', 'You spent your own 25 cents on Mr. Novak\'s telegram.'); else add('none', 'You kept your 25 cents. Mr. Novak\'s son never got a telegram.');
    if (f('shot_kessler')) add('cam', 'You photographed Mr. Kessler taking Chana\'s ten cents.'); else if (f('spoke_kessler')) add('per', 'You lowered the camera and told Mr. Kessler the seam was straight.'); else add('none', 'When Mr. Kessler docked Chana\'s pay, you stayed out of it.');
    if (f('printed_sarah')) add('cam', 'You printed Sarah\'s face, after her father begged you not to.'); else add('per', 'You kept your word to Moishe and left Sarah out of the paper.');
    if (f('shot_fall')) add('cam', 'You photographed Giuseppe on the sidewalk.'); else if (f('helped_fall')) add('per', 'You put the camera down and held Giuseppe\'s hand.'); else add('none', 'You were not there when Giuseppe fell.');
    if (f('gius_expose')) add('cam', 'You took Giuseppe\'s trouble to a reporter, and the repeaters made the papers.');
    const k = cam >= 3 && cam > per ? ['The Witness', 'You believed the picture mattered most. People uptown saw things they could not unsee, and some of them acted. Some of the people in your pictures paid for it.', 'The Editor gives you a desk and a raise. "You have the eye, kid. Try to keep your friends."']
      : per >= 3 && per > cam + 1 ? ['The Neighbor', 'When it came to it, you put the camera down. The people you met will remember a friend. The city never saw some of what you saw.', 'The Editor keeps you on, grumbling. "A soft heart is expensive in this business. Bring me more plates next time."']
        : ['The Go-Between', 'Sometimes you took the picture and sometimes you put the camera down. You never found a rule for it. Neither did Jacob Riis.', 'The Editor keeps you on. "You think too much before you shoot. Good. Most of them never think at all."'];
    return `<div class="kind"><div class="kind-label">What kind of photographer were you?</div><h3>${esc(k[0])}</h3><p>${esc(k[1])}</p><ul>${rows.map(([c, t]) => `<li class="${c}">${esc(t)}</li>`).join('')}</ul><p style="margin-top:10px"><b>Your job.</b> ${esc(k[2])}</p></div>`;
  }

  epilogue() {
    const f = (k) => flag(k);
    const fates = [];
    fates.push(['Rivka Abramowitz', f('rivka_union')
      ? 'Rivka never went back to Kessler\'s shop. The strike won back most of the pay, and Esther found her work in a union shop on Grand Street. Twenty-one years later, in 1909, she marched with more than 20,000 shirtwaist workers in the "Uprising of the 20,000," the largest strike of women workers in America up to that time.'
      : 'Rivka kept her job at Kessler\'s, and kept the union card in her shoe for a long time. In 1909 she took it out, and walked out with more than 20,000 other shirtwaist workers in the "Uprising of the 20,000."']);
    fates.push(['Sarah', f('printed_sarah')
      ? 'Sarah\'s face was one of the pictures uptown readers could not forget. She stayed in the Guild\'s classes and became a teacher. New York passed a stronger child-labor law in 1903, but work done at home stayed hard to police for years.'
      : 'Sarah sewed buttons until she was fourteen. New York passed a stronger child-labor law in 1903. Her own children never sewed for a contractor.']);
    fates.push(['Giuseppe Russo', f('gius_repeat')
      ? 'Giuseppe went back to the Times Building when his arm healed, and voted as Patrick Moran again in 1890. In 1893 he sailed home to Calabria and bought a small lemon grove next to his mother\'s.'
      : f('gius_expose')
        ? 'Giuseppe never worked for Tammany again. Through the Società he found work on the Brooklyn docks. Haskins\'s story about the repeaters was read all over the city.'
        : 'Through the Società, Giuseppe found work on the Brooklyn docks. He became a citizen in 1896 and voted under his own name.']);
    fates.push(['Anton Novak', f('paid_telegram')
      ? 'Mr. Novak lived with Tomas\'s family in Chicago until 1897. He carved wooden horses for every child on Halsted Street.'
      : 'Mr. Novak was sent back to Europe and lived with his sister in Bohemia. Every Christmas he wrote to Tomas, and once, to a photographer in New York.']);
    fates.push(['The Abramowitz family', (f('swindled') || f('shortchanged'))
      ? 'They paid back the Kiever Society\'s loan, ten cents at a time, in a little over a year. Shmuel finished public school, the first in the family to do it.'
      : 'Shmuel finished public school, the first in the family to do it. Mama kept Mr. Novak\'s wooden horse on the windowsill for the rest of her life.']);
    fates.push(['New York', 'Hugh J. Grant served as mayor from 1889 to 1892. Tammany Hall stayed powerful in New York politics for decades. Women won the vote in New York in 1917. Chinese immigrants were not allowed to become citizens until 1943.']);
    return fates.map(([who, txt]) => `<p><b>${esc(who)}.</b> ${esc(txt)}</p>`).join('');
  }

  result() {
    sfx('chime');
    const a = state.answers[this.part];
    const ph = this.photos();
    const chart = state.chart[this.part];
    const sarahPhoto = state.photos.find(p => p.subject === 'girl') || state.photos.find(p => p.subject === 'sweatshop');
    const notSarah = ph.filter(p => p.subject !== 'girl' && p.subject !== 'sweatshop');
    const lead = this.part === 'A' && flag('printed_sarah') && sarahPhoto ? sarahPhoto
      : ((this.part === 'A' ? notSarah : ph).find(p => chart[p.id]) || (this.part === 'A' ? notSarah : ph)[0]);
    const headline = this.part === 'A'
      ? (a.stance === 'Yes' ? 'A Land of Opportunity' : a.stance === 'No' ? 'A Hard Welcome' : 'Opportunity, For Some')
      : (flag('endorse_grant') ? 'We Backed Grant, and Tammany Won' : flag('endorse_hewitt') ? 'We Backed the Honest Man. He Came Third.' : flag('endorse_erhardt') ? 'We Backed Erhardt. The City Backed Grant.' : 'Grant Elected Mayor');
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
      ${this.part === 'B' ? `<div class="handout" style="margin-top:20px"><h2>Your Week</h2>${this.kind()}<h2>What Became of Them</h2>${this.epilogue()}</div>` : ''}
      <div class="handout" style="margin-top:20px">
        <h2>Copy This to Your Handout</h2>
        <p><b>Question:</b> ${esc(this.cfg.question)}<br><b>My answer:</b> ${esc(a.stance || '(not chosen)')}</p>
        <table>${rows}</table>
      </div>
      <div class="row">
        <button class="btn" data-act="prev">&#9666; Edit my answer</button>
        <button class="btn" data-act="print">Print</button>
        ${this.part === 'A' ? '<button class="btn big" data-act="day2">Continue to Day 2: Election Week &#9656;</button>' : ''}
        <button class="btn" data-act="menu">Main Menu</button>
      </div>`;
    this.wire();
  }

  wire() {
    box.querySelectorAll('[data-act]').forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'next') { this.step++; this.render(); }
      else if (act === 'prev') { this.step--; this.render(); }
      else if (act === 'rock') { this.rocks++; sfx('page'); this.render(); const t = document.getElementById('tray'); if (t) { t.classList.remove('rock'); void t.offsetWidth; t.classList.add('rock'); } }
      else if (act === 'print') window.print();
      else if (act === 'back') { this.close(); this.game.resumeFromWrapup(); }
      else if (act === 'day2') { this.close(); this.game.startDay2(); }
      else if (act === 'printSarah') { state.flags.printed_sarah = true; save(); this.game.remember('Moishe will remember that.'); this.step++; this.render(); }
      else if (act === 'keepSarah') { state.flags.sarah_kept = true; save(); this.game.remember('Moishe will remember that.'); this.step++; this.render(); }
      else if (act === 'menu') { this.close(); this.game.showMenu(); }
    }));
  }
}
