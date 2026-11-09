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
    else if (this.tab === 'map') this.renderMap();
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

Journal.prototype.renderMap = function () {
  const zone = this.game.zone;
  const m = zone && zone.map && zone.map();
  if (!m) { content.innerHTML = '<div class="empty">No map for this place. Look around!</div>'; return; }
  content.innerHTML = '<canvas id="map-canvas" style="width:100%;height:100%;display:block"></canvas>';
  const cv = content.querySelector('canvas');
  const W = content.clientWidth || 900, H = Math.max(360, content.clientHeight || 520);
  cv.width = W; cv.height = H;
  const g = cv.getContext('2d');
  const b = m.bounds, sc = Math.min((W - 40) / (b.maxX - b.minX), (H - 40) / (b.maxZ - b.minZ));
  const ox = (W - (b.maxX - b.minX) * sc) / 2, oz = (H - (b.maxZ - b.minZ) * sc) / 2;
  const X = (x) => ox + (x - b.minX) * sc, Z = (z) => oz + (z - b.minZ) * sc;
  g.fillStyle = '#5a4434'; g.fillRect(X(b.minX), Z(b.minZ), (b.maxX - b.minX) * sc, (b.maxZ - b.minZ) * sc);
  g.fillStyle = '#e8dcbc';
  for (const st of m.streets) g.fillRect(X(Math.max(st.x0, b.minX)), Z(Math.max(st.z0, b.minZ)), (Math.min(st.x1, b.maxX) - Math.max(st.x0, b.minX)) * sc, (Math.min(st.z1, b.maxZ) - Math.max(st.z0, b.minZ)) * sc);
  if (m.parks) { g.fillStyle = '#7a9a5a'; for (const p of m.parks) g.fillRect(X(p.x0), Z(p.z0), (p.x1 - p.x0) * sc, (p.z1 - p.z0) * sc); }
  g.setLineDash([6, 4]); g.strokeStyle = '#2a2a2a'; g.lineWidth = 3;
  for (const e of m.els || []) { g.beginPath(); g.moveTo(X(e.x), Z(b.minZ)); g.lineTo(X(e.x), Z(b.maxZ)); g.stroke(); }
  g.setLineDash([]);
  g.font = 'bold 12px Georgia'; g.fillStyle = '#3a2a1e'; g.textAlign = 'center';
  for (const st of m.streets) {
    const vertical = (st.z1 - st.z0) > (st.x1 - st.x0);
    const cx = X((Math.max(st.x0, b.minX) + Math.min(st.x1, b.maxX)) / 2), cz = Z((Math.max(st.z0, b.minZ) + Math.min(st.z1, b.maxZ)) / 2);
    g.save(); g.translate(vertical ? cx : X(b.minX) + 60, vertical ? Z(b.minZ) + 50 : cz); if (vertical) g.rotate(-Math.PI / 2); g.fillText(st.name, 0, 4); g.restore();
  }
  for (const e of m.els || []) { g.fillStyle = '#2a2a2a'; g.fillText(e.name, X(e.x), Z(b.maxZ) - 6); }
  g.font = '12px Georgia';
  for (const p of m.pois) {
    g.fillStyle = '#8e2f25'; g.beginPath(); g.arc(X(p.x), Z(p.z), 5, 0, 7); g.fill();
    g.fillStyle = '#1b1a24'; g.textAlign = 'left';
    g.strokeStyle = 'rgba(239,227,198,.9)'; g.lineWidth = 3; g.strokeText(p.label, X(p.x) + 8, Z(p.z) + 4); g.fillText(p.label, X(p.x) + 8, Z(p.z) + 4);
  }
  const c = this.game.controls;
  const fx = -Math.sin(c.yaw), fz = -Math.cos(c.yaw);
  g.save(); g.translate(X(c.pos.x), Z(c.pos.z)); g.rotate(Math.atan2(fz, fx) + Math.PI / 2);
  g.fillStyle = '#1d6fa0'; g.strokeStyle = '#fff'; g.lineWidth = 2;
  g.beginPath(); g.moveTo(0, -11); g.lineTo(8, 8); g.lineTo(0, 4); g.lineTo(-8, 8); g.closePath(); g.fill(); g.stroke();
  g.restore();
  g.fillStyle = '#1b1a24'; g.font = 'bold 13px Georgia'; g.textAlign = 'right'; g.fillText('N ↑   (blue arrow = you)', W - 12, 18);
};

function noteHTML(t) {
  const m = t.match(/^([A-Z][A-Z .,'()0-9?-]+):\s*(.*)$/);
  return m ? `<b>${esc(m[1])}:</b> ${richText(m[2])}` : richText(t);
}
