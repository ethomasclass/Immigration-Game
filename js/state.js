// Game state + save/load (localStorage). Everything a student does is kept
// on their own Chromebook only; nothing is sent anywhere.
const KEY = 'other-half-save-v1';

const DEFAULTS = () => ({
  zone: null,
  flags: {},
  notes: [],        // { zone, text }
  photos: [],       // { id, subject, title, desc, zone, img, caption }
  chart: { A: {}, B: {} },     // photoId -> column key
  answers: { A: { stance: '', text: '' }, B: { stance: '', text: '' } },
  cents: 250,       // the photographer's expense money ($2.50)
  keeps: [],        // keepsake ids, in the order found
  settings: { sens: 1, quality: 0.8, vo: 1, amb: 0.5, tts: false, drag: false, touch: 'auto' },
});

export const state = DEFAULTS();

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const d = DEFAULTS();
    Object.assign(state, d, data);
    state.settings = Object.assign(d.settings, data.settings || {});
    state.chart = Object.assign(d.chart, data.chart || {});
    state.answers = Object.assign(d.answers, data.answers || {});
    if (typeof state.cents !== 'number') state.cents = 250;
    if (!Array.isArray(state.keeps)) state.keeps = [];
    return !!state.zone;
  } catch (e) { return false; }
}

export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); }
  catch (e) {
    // Storage full (too many photos): drop the oldest photo image data.
    if (state.photos.length > 1) { state.photos.shift(); save(); }
  }
}

export function resetProgress() {
  const settings = state.settings;
  Object.assign(state, DEFAULTS());
  state.settings = settings;
  save();
}

export const flag = (f) => !!state.flags[f];
export function setFlag(f) { state.flags[f] = true; }

export function addNote(zone, text) {
  if (state.notes.some(n => n.text === text)) return false;
  state.notes.push({ zone, text });
  return true;
}
