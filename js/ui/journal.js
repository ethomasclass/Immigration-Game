// The photographer's journal: photographs, notebook, word bank.
import { state, save } from '../state.js';
import { GLOSSARY } from '../data/glossary.js';
import { esc, richText } from './text.js';

const ZONE_NAMES = { ship: 'I. Steerage', castle: 'II. Castle Garden', les: 'III. The Lower East Side', city: 'IV. The City' };
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX', 'XXI'];
export const roman = (n) => ROMAN[n - 1] || String(n);

const root = document.getElementById('journal');
const content = document.getElementById('journal-content');

export class Journal {
  constructor(game) {
    this.game = game;
    this.tab = 'photos';
    root.querySelectorAll('.tab[data-tab]').forEach(b => b.addEventListener('click', () => { this.tab = b.dataset.tab; this.render(); }));
    document.getElementById('journal-close').addEventListener('click', () => game.closeJournal());
  }

  open() { root.classList.remove('hidden'); this.render(); }
  close() { root.classList.add('hidden'); save(); }
  get isOpen() { return !root.classList.contains('hidden'); }

  render() {
    root.querySelectorAll('.tab[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === this.tab));
    if (this.tab === 'photos') this.renderPhotos();
    else if (this.tab === 'notes') this.renderNotes();
    else this.renderGlossary();
  }

  renderPhotos() {
    const photos = state.photos;
    if (!photos.length) {
      content.innerHTML = '<div class="empty">No photographs yet. Press <b>F</b> (or right-click) to raise your camera, aim at a person or object, and click.</div>';
      return;
    }
    content.innerHTML = `<p class="muted">Write a caption for each photograph: <i>What does this show about the immigrant experience?</i></p><div class="photo-grid"></div>`;
    const grid = content.querySelector('.photo-grid');
    photos.forEach((p, i) => {
      const d = document.createElement('div');
      d.className = 'plate';
      d.innerHTML = `
        <div class="pnum">&#10022; ${roman(i + 1)} &#10022;</div>
        <img src="${p.img}" alt="${esc(p.title)}">
        <div class="ptitle">${esc(p.title)}</div>
        <div class="pzone">${esc(ZONE_NAMES[p.zone] || '')}</div>
        <div class="pdesc">${esc(p.desc)}</div>
        <textarea placeholder="Your caption...">${esc(p.caption || '')}</textarea>`;
      const ta = d.querySelector('textarea');
      ta.addEventListener('input', () => { p.caption = ta.value; });
      ta.addEventListener('keydown', (e) => e.stopPropagation());
      grid.appendChild(d);
    });
  }

  renderNotes() {
    if (!state.notes.length) { content.innerHTML = '<div class="empty">Talk to people to fill your notebook.</div>'; return; }
    let html = '<div class="notes-list">';
    for (const z of Object.keys(ZONE_NAMES)) {
      const notes = state.notes.filter(n => n.zone === z);
      if (!notes.length) continue;
      html += `<h3>${ZONE_NAMES[z]}</h3><ul>${notes.map(n => `<li>${noteHTML(n.text)}</li>`).join('')}</ul>`;
    }
    content.innerHTML = html + '</div>';
  }

  renderGlossary() {
    const keys = Object.keys(GLOSSARY).sort((a, b) => a.localeCompare(b));
    content.innerHTML = `<dl class="gloss-list">${keys.map(k => `<dt>${esc(k)}</dt><dd>${esc(GLOSSARY[k])}</dd>`).join('')}</dl>`;
  }
}

function noteHTML(t) {
  const m = t.match(/^([A-Z][A-Z .,'()0-9?-]+):\s*(.*)$/);
  return m ? `<b>${esc(m[1])}:</b> ${richText(m[2])}` : richText(t);
}
