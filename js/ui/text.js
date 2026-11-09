// Turns [[term]] / [[shown|term]] into clickable vocabulary words.
import { GLOSSARY, termKey } from '../data/glossary.js';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

export function richText(text) {
  return esc(text).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, shown, term) => {
    const key = termKey(term || shown) || termKey(shown);
    if (!key) return shown;
    return `<span class="term" data-term="${esc(key)}" tabindex="0">${shown}</span>`;
  });
}

export function plainText(text) {
  return String(text).replace(/\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g, '$1');
}

export function termsIn(text) {
  const out = [];
  String(text).replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (m, shown, term) => {
    const k = termKey(term || shown) || termKey(shown); if (k) out.push(k); return m;
  });
  return out;
}

// Glossary popup on hover/click of .term
const pop = document.getElementById('gloss-pop');
function show(el) {
  const k = el.dataset.term;
  pop.innerHTML = `<b>${esc(k)}</b><br>${esc(GLOSSARY[k] || '')}`;
  pop.classList.remove('hidden');
  const r = el.getBoundingClientRect();
  const pr = pop.getBoundingClientRect();
  let top = r.top - pr.height - 8;
  if (top < 8) top = r.bottom + 8;
  pop.style.top = top + 'px';
  pop.style.left = Math.max(8, Math.min(innerWidth - pr.width - 8, r.left)) + 'px';
}
document.addEventListener('mouseover', (e) => { const t = e.target.closest && e.target.closest('.term'); if (t) show(t); });
document.addEventListener('mouseout', (e) => { if (e.target.closest && e.target.closest('.term')) pop.classList.add('hidden'); });
document.addEventListener('focusin', (e) => { if (e.target.classList?.contains('term')) show(e.target); });
document.addEventListener('focusout', () => pop.classList.add('hidden'));
document.addEventListener('click', (e) => { const t = e.target.closest && e.target.closest('.term'); if (t) { e.stopPropagation(); show(t); } }, true);

export { esc };
