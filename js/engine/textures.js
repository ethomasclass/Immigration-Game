// ============================================================================
// ART LOADER
// Every surface asks for a texture by key, e.g. 'wall_steerage'.
// The game first draws a quick placeholder, then tries to load
//   assets/art/<key>.png   (or .jpg)
// and swaps it in if the file exists. So: to add your artwork, just drop a
// file with the right name into assets/art/. See docs/ART_GUIDE.md.
// ============================================================================
import * as THREE from 'three';

const cache = new Map();      // key -> { tex, users: [textures], img }
export const requested = new Map(); // key -> spec (for the art guide / debug)

const PAL = { gold: '#c9a24a', gold2: '#8a6a26', parch: '#efe3c6', ink: '#1b1a24' };

function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
function hash(str) { let h = 2166136261; for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; }
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) + amt, g = ((n >> 8) & 255) + amt, b = (n & 255) + amt;
  r = Math.max(0, Math.min(255, r)); g = Math.max(0, Math.min(255, g)); b = Math.max(0, Math.min(255, b));
  return `rgb(${r},${g},${b})`;
}

function noise(ctx, w, h, r, amt = 18, count = 2500) {
  for (let i = 0; i < count; i++) {
    const v = (r() - 0.5) * amt;
    ctx.fillStyle = v > 0 ? `rgba(255,255,255,${v / 120})` : `rgba(0,0,0,${-v / 120})`;
    ctx.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 3);
  }
}

function tarotBorder(ctx, w, h, inset = 10) {
  ctx.strokeStyle = PAL.gold2; ctx.lineWidth = Math.max(4, w / 60);
  ctx.strokeRect(inset, inset, w - inset * 2, h - inset * 2);
  ctx.strokeStyle = PAL.gold; ctx.lineWidth = Math.max(2, w / 160);
  const i2 = inset + w / 30;
  ctx.strokeRect(i2, i2, w - i2 * 2, h - i2 * 2);
  ctx.fillStyle = PAL.gold;
  for (const [x, y] of [[i2, i2], [w - i2, i2], [i2, h - i2], [w - i2, h - i2]]) star(ctx, x, y, w / 40);
}
function star(ctx, x, y, r) {
  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2, rr = i % 2 ? r * 0.4 : r;
    ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
  }
  ctx.closePath(); ctx.fill();
}
function wrapText(ctx, text, x, y, maxW, lh) {
  for (const para of String(text).split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (ctx.measureText(t).width > maxW && line) { ctx.fillText(line, x, y); y += lh; line = word; }
      else line = t;
    }
    ctx.fillText(line, x, y); y += lh;
  }
  return y;
}

const DRAW = {
  solid(ctx, w, h, s) { ctx.fillStyle = s.color; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, rng(hash(s.color)), 10, 800); },
  planks(ctx, w, h, s, r) {
    const c = s.color || '#6b4a2e'; const n = s.n || 6;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = shade(c, (r() - 0.5) * 30);
      ctx.fillRect(0, (i * h) / n, w, h / n);
      ctx.fillStyle = 'rgba(0,0,0,.45)'; ctx.fillRect(0, (i * h) / n, w, 2);
      for (let k = 0; k < 6; k++) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(0, (i * h) / n + r() * (h / n), w, 1); }
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(r() * w, (i * h) / n, 2, h / n);
    }
    noise(ctx, w, h, r, 16);
  },
  brick(ctx, w, h, s, r) {
    const c = s.color || '#7a3b2a'; ctx.fillStyle = s.mortar || '#5a4b40'; ctx.fillRect(0, 0, w, h);
    const rows = 16, bw = w / 6, bh = h / rows;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 7; x++) {
      ctx.fillStyle = shade(c, (r() - 0.5) * 40);
      ctx.fillRect(x * bw + (y % 2 ? bw / 2 : 0) + 2, y * bh + 2, bw - 4, bh - 4);
    }
    noise(ctx, w, h, r, 20);
  },
  plaster(ctx, w, h, s, r) {
    ctx.fillStyle = s.color || '#a89a80'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(60,40,20,${r() * 0.08})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 10 + r() * 50, 0, 7); ctx.fill(); }
    noise(ctx, w, h, r, 14, 3000);
  },
  stone(ctx, w, h, s, r) {
    ctx.fillStyle = s.mortar || '#555'; ctx.fillRect(0, 0, w, h);
    const rows = s.rows || 4;
    for (let y = 0; y < rows; y++) {
      let x = -r() * 60;
      while (x < w) { const bw = 60 + r() * 80; ctx.fillStyle = shade(s.color || '#8d8778', (r() - 0.5) * 30); ctx.fillRect(x + 3, (y * h) / rows + 3, bw - 6, h / rows - 6); x += bw; }
    }
    noise(ctx, w, h, r, 18);
  },
  cobble(ctx, w, h, s, r) {
    ctx.fillStyle = '#3a3630'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 260; i++) { ctx.fillStyle = shade(s.color || '#6a645a', (r() - 0.5) * 40); ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 9 + r() * 7, 7 + r() * 5, r() * 3, 0, 7); ctx.fill(); }
    noise(ctx, w, h, r, 20);
  },
  grass(ctx, w, h, s, r) {
    ctx.fillStyle = s.color || '#4f6b35'; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 3000; i++) { ctx.fillStyle = shade(s.color || '#4f6b35', (r() - 0.5) * 50); ctx.fillRect(r() * w, r() * h, 1, 3 + r() * 4); }
  },
  water(ctx, w, h, s, r) {
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#2c4a5a'); g.addColorStop(1, '#1d3240');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 300; i++) { ctx.strokeStyle = `rgba(200,220,230,${r() * 0.25})`; ctx.beginPath(); const x = r() * w, y = r() * h; ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 10, y - 4, x + 22, y); ctx.stroke(); }
  },
  window(ctx, w, h, s) {
    ctx.fillStyle = s.frame || '#2a2018'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = s.color || '#e8c27a';
    ctx.fillRect(w * .12, h * .1, w * .34, h * .38); ctx.fillRect(w * .54, h * .1, w * .34, h * .38);
    ctx.fillRect(w * .12, h * .54, w * .34, h * .38); ctx.fillRect(w * .54, h * .54, w * .34, h * .38);
  },
  sign(ctx, w, h, s) {
    ctx.fillStyle = s.color || '#2a2735'; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 6; ctx.strokeRect(8, 8, w - 16, h - 16);
    ctx.fillStyle = s.ink || PAL.gold; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    let size = h * 0.42; ctx.font = `bold ${size}px Georgia`;
    while (ctx.measureText(s.title).width > w * 0.88 && size > 8) { size -= 2; ctx.font = `bold ${size}px Georgia`; }
    ctx.fillText(s.title, w / 2, h / 2);
  },
  card(ctx, w, h, s, r) {
    ctx.fillStyle = s.color || PAL.parch; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, r, 14, 2000);
    tarotBorder(ctx, w, h, 8);
    ctx.fillStyle = s.ink || '#2b2118'; ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(w / 11)}px Georgia`;
    let y = wrapText(ctx, (s.title || '').toUpperCase(), w / 2, h * 0.2, w * 0.78, w / 10);
    ctx.font = `${Math.round(w / 20)}px Georgia`;
    if (s.lines) wrapText(ctx, s.lines, w / 2, y + 10, w * 0.76, w / 15);
  },
  // Wrap texture for a character's body. u=0.5 is the front.
  figure(ctx, w, h, s, r) {
    const c = s.color || '#555';
    const g = ctx.createLinearGradient(0, 0, w, 0);
    g.addColorStop(0, shade(c, -45)); g.addColorStop(0.5, shade(c, 25)); g.addColorStop(1, shade(c, -45));
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 14; i++) { ctx.fillStyle = 'rgba(0,0,0,.12)'; ctx.fillRect(r() * w, 0, 2 + r() * 4, h); }
    ctx.fillStyle = PAL.gold; ctx.fillRect(0, 0, w, h * 0.03); ctx.fillRect(0, h * 0.95, w, h * 0.05);
    // tarot-style front panel
    ctx.strokeStyle = PAL.gold; ctx.lineWidth = 4;
    ctx.strokeRect(w * 0.4, h * 0.08, w * 0.2, h * 0.84);
    ctx.fillStyle = PAL.gold; star(ctx, w * 0.5, h * 0.2, w * 0.03);
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(w * 0.5, h * (0.32 + i * 0.1), w * 0.008, 0, 7); ctx.fill(); }
    noise(ctx, w, h, r, 12, 1200);
  },
  sky(ctx, w, h, s) {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, s.top || '#8a9aa8'); g.addColorStop(0.6, s.mid || '#cdbf9e'); g.addColorStop(1, s.bottom || '#e8d6b0');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  },
};

function makePlaceholder(key, spec) {
  const w = spec.w || 256, h = spec.h || 256;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const ctx = cv.getContext('2d');
  (DRAW[spec.type] || DRAW.solid)(ctx, w, h, spec, rng(hash(key)));
  return cv;
}

function tryLoad(key, entry) {
  const exts = ['png', 'jpg'];
  const attempt = (i) => {
    if (i >= exts.length) return;
    const img = new Image();
    img.onload = () => {
      entry.img = img;
      for (const t of entry.users) { t.image = img; t.needsUpdate = true; }
    };
    img.onerror = () => attempt(i + 1);
    img.src = `assets/art/${key}.${exts[i]}`;
  };
  attempt(0);
}

/** Get a texture for an art key. `spec` describes the placeholder. */
export function texture(key, spec = {}, repeat = null) {
  let entry = cache.get(key);
  if (!entry) {
    requested.set(key, spec);
    const base = new THREE.CanvasTexture(makePlaceholder(key, spec));
    base.colorSpace = THREE.SRGBColorSpace;
    base.wrapS = base.wrapT = THREE.RepeatWrapping;
    base.anisotropy = 2;
    entry = { tex: base, users: [base], img: null, canvas: base.image };
    cache.set(key, entry);
    tryLoad(key, entry);
  }
  if (!repeat) return entry.tex;
  const t = entry.tex.clone();
  t.repeat.set(repeat[0], repeat[1]);
  if (entry.img) t.image = entry.img;
  t.needsUpdate = true;
  entry.users.push(t);
  return t;
}

/** URL of an art image (real if loaded, else placeholder) for HTML use. */
export function artURL(key) {
  const e = cache.get(key);
  if (!e) return null;
  if (e.img) return e.img.src;
  try { return e.canvas.toDataURL(); } catch { return null; }
}
export function hasRealArt(key) { return !!cache.get(key)?.img; }

const matCache = new Map();
/** Lambert material using an art key. Options: repeat, emissive, side, transparent */
export function material(key, spec = {}, opts = {}) {
  const ck = key + JSON.stringify(opts);
  if (matCache.has(ck)) return matCache.get(ck);
  const m = new THREE.MeshLambertMaterial({
    map: texture(key, spec, opts.repeat || null),
    side: opts.side || THREE.FrontSide,
  });
  if (opts.emissive) { m.emissive = new THREE.Color(opts.emissive); m.emissiveMap = m.map; m.emissiveIntensity = opts.emissiveIntensity ?? 1; }
  if (opts.transparent) { m.transparent = true; m.alphaTest = 0.5; }
  matCache.set(ck, m);
  return m;
}

export function colorMat(color, opts = {}) {
  const ck = 'c' + color + JSON.stringify(opts);
  if (matCache.has(ck)) return matCache.get(ck);
  const m = opts.basic ? new THREE.MeshBasicMaterial({ color, fog: opts.fog ?? true }) : new THREE.MeshLambertMaterial({ color });
  if (opts.emissive) m.emissive = new THREE.Color(opts.emissive);
  matCache.set(ck, m);
  return m;
}
