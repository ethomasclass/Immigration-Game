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
    const c = s.color || '#8e3f2e'; ctx.fillStyle = s.mortar || '#6b6157'; ctx.fillRect(0, 0, w, h);
    const rows = 20, bw = w / 6, bh = h / rows, tones = [-22, -8, 0, 10, 20];
    for (let y = 0; y < rows; y++) for (let x = -1; x < 7; x++) {
      ctx.fillStyle = shade(c, tones[Math.floor(r() * 5)] + (r() < 0.06 ? -40 : 0));
      ctx.fillRect(x * bw + (y % 2 ? bw / 2 : 0) + 1.2, y * bh + 1.2, bw - 2.4, bh - 2.4);
    }
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(40,24,20,.3)'); g.addColorStop(0.6, 'rgba(40,24,20,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, r, 20, 3000);
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
  // One 25-ft lot of an 1880s tenement front: ground-floor store, `floors`
  // upper floors with `bays` windows each, stone lintels/sills, iron cornice.
  facade(ctx, w, h, s, r) {
    const floors = s.floors || 5, bays = s.bays || 4;
    const brick = s.color || '#8a3e2c';
    const storeH = h * (s.storeFrac || 0.2), corH = h * 0.05;
    const flH = (h - storeH - corH) / floors;
    // brick field
    ctx.fillStyle = brick; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 6) for (let x = (y / 6) % 2 ? -8 : 0; x < w; x += 16) {
      ctx.fillStyle = shade(brick, (r() - 0.5) * 28); ctx.fillRect(x + 1, y + 1, 14, 4);
    }
    // cornice (pressed metal, painted)
    ctx.fillStyle = s.cornice || '#3b3530'; ctx.fillRect(0, 0, w, corH);
    ctx.fillStyle = shade(s.cornice || '#3b3530', 25);
    for (let x = 4; x < w; x += 12) ctx.fillRect(x, corH * 0.55, 6, corH * 0.45);
    ctx.fillRect(0, corH - 3, w, 3);
    // windows
    const bw = w / bays;
    for (let f = 0; f < floors; f++) {
      const y0 = corH + f * flH;
      for (let b = 0; b < bays; b++) {
        const x = b * bw + bw * 0.22, ww = bw * 0.56, wy = y0 + flH * 0.18, wh = flH * 0.62;
        const lit = r() < (s.lit ?? 0.25);
        ctx.fillStyle = s.stone || '#7a5e48';
        ctx.fillRect(x - 3, wy - 7, ww + 6, 7);          // lintel
        ctx.fillRect(x - 2, wy + wh, ww + 4, 4);         // sill
        ctx.fillStyle = '#1c1612'; ctx.fillRect(x, wy, ww, wh);
        ctx.fillStyle = lit ? '#d9a65a' : '#3a3c42';
        ctx.fillRect(x + 2, wy + 2, ww / 2 - 3, wh / 2 - 3); ctx.fillRect(x + ww / 2 + 1, wy + 2, ww / 2 - 3, wh / 2 - 3);
        ctx.fillRect(x + 2, wy + wh / 2 + 1, ww / 2 - 3, wh / 2 - 3); ctx.fillRect(x + ww / 2 + 1, wy + wh / 2 + 1, ww / 2 - 3, wh / 2 - 3);
        if (r() < 0.25) { ctx.fillStyle = 'rgba(230,220,200,.6)'; ctx.fillRect(x + 2, wy + 2, ww - 4, wh * 0.25); } // curtain
      }
      // fire escape balcony line
      if (s.escape) { ctx.fillStyle = '#121212'; ctx.fillRect(w * 0.12, y0 + flH * 0.86, w * 0.76, 3); for (let x = w * 0.12; x < w * 0.88; x += 5) ctx.fillRect(x, y0 + flH * 0.7, 1, flH * 0.16); }
    }
    // ground floor: civic buildings get rusticated stone and a central door instead of shops
    const sy = h - storeH;
    if (s.civic) {
      ctx.fillStyle = s.stone || '#cfcac0'; ctx.fillRect(0, sy, w, storeH);
      ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let y = sy; y < h; y += storeH / 5) ctx.fillRect(0, y, w, 2);
      for (let b = 0; b < bays; b++) { const x = b * bw + bw * 0.3; ctx.fillStyle = '#2a2a2e'; ctx.fillRect(x, sy + storeH * 0.3, bw * 0.4, storeH * 0.5); ctx.beginPath(); ctx.arc(x + bw * 0.2, sy + storeH * 0.3, bw * 0.2, Math.PI, 0); ctx.fill(); }
      noise(ctx, w, h, r, 10, 1000);
      return;
    }
    ctx.fillStyle = s.storeColor || '#3a2a1e'; ctx.fillRect(0, sy, w, storeH);
    ctx.fillStyle = s.signColor || '#2a2420'; ctx.fillRect(w * 0.04, sy + 4, w * 0.92, storeH * 0.2);
    ctx.fillStyle = '#d8c48a'; ctx.font = `bold ${Math.round(storeH * 0.13)}px Georgia`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (s.sign) ctx.fillText(s.sign, w / 2, sy + 4 + storeH * 0.1, w * 0.88);
    ctx.fillStyle = '#4a5560'; ctx.fillRect(w * 0.06, sy + storeH * 0.3, w * 0.5, storeH * 0.62);   // shop window
    ctx.fillStyle = 'rgba(255,220,150,.25)'; ctx.fillRect(w * 0.06, sy + storeH * 0.3, w * 0.5, storeH * 0.62);
    ctx.fillStyle = '#20160e'; ctx.fillRect(w * 0.64, sy + storeH * 0.3, w * 0.13, storeH * 0.7);  // shop door
    ctx.fillStyle = '#15100c'; ctx.fillRect(w * 0.82, sy + storeH * 0.26, w * 0.14, storeH * 0.74); // tenement hall door
    noise(ctx, w, h, r, 14, 1500);
  },
  // Ground-floor shopfront only (cast-iron pilasters, big glass, sign board).
  storefront(ctx, w, h, s, r) {
    ctx.fillStyle = s.color || '#3a2a1e'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = s.signColor || '#2a2420'; ctx.fillRect(0, 0, w, h * 0.22);
    ctx.fillStyle = s.ink || '#d8c48a'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `bold ${Math.round(h * 0.14)}px Georgia`;
    if (s.sign) ctx.fillText(s.sign, w / 2, h * 0.11, w * 0.92);
    ctx.fillStyle = '#20262c'; ctx.fillRect(w * 0.05, h * 0.3, w * 0.52, h * 0.62);
    ctx.fillStyle = 'rgba(255,214,150,.3)'; ctx.fillRect(w * 0.05, h * 0.3, w * 0.52, h * 0.62);
    for (let i = 0; i < 6; i++) { ctx.fillStyle = ['#8a6a3a', '#6a7a3a', '#a04a2a', '#c8b080'][i % 4]; ctx.fillRect(w * (0.08 + i * 0.08), h * 0.75, w * 0.06, h * 0.12); }
    ctx.fillStyle = '#15100c'; ctx.fillRect(w * 0.64, h * 0.3, w * 0.16, h * 0.7);
    ctx.fillStyle = '#2b2b2b'; for (const x of [0, 0.6, 0.97]) ctx.fillRect(w * x, h * 0.22, w * 0.03, h * 0.78);
    noise(ctx, w, h, r, 12, 600);
  },
  // Eldridge Street Synagogue (1887): Moorish Revival brick & terra cotta, rose window, three arched portals.
  synagogue(ctx, w, h, s, r) {
    ctx.fillStyle = '#9a5a3c'; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, r, 18, 3000);
    ctx.fillStyle = '#d9c7a0'; for (let y = h * 0.12; y < h; y += h * 0.09) ctx.fillRect(0, y, w, 3);
    ctx.fillStyle = '#7a4430'; ctx.fillRect(0, 0, w * 0.18, h); ctx.fillRect(w * 0.82, 0, w * 0.18, h);
    // towers' caps
    ctx.fillStyle = '#5a3a2a'; for (const x of [0.09, 0.91]) { ctx.beginPath(); ctx.moveTo(w * (x - 0.09), h * 0.08); ctx.lineTo(w * x, 0); ctx.lineTo(w * (x + 0.09), h * 0.08); ctx.fill(); }
    // rose window
    const cx = w / 2, cy = h * 0.32, R = w * 0.2;
    ctx.fillStyle = '#d9c7a0'; ctx.beginPath(); ctx.arc(cx, cy, R * 1.12, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a4a6a'; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 7); ctx.fill();
    ctx.strokeStyle = '#d9c7a0'; ctx.lineWidth = 4;
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.stroke(); }
    ctx.strokeStyle = '#e8c060'; ctx.lineWidth = 5;
    for (const rot of [0, Math.PI]) { ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = rot - Math.PI / 2 + i * 2 * Math.PI / 3; const px = cx + Math.cos(a) * R * 0.45, py = cy + Math.sin(a) * R * 0.45; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.closePath(); ctx.stroke(); }
    // horseshoe-arched windows
    for (const x of [0.28, 0.72]) { ctx.fillStyle = '#2a3a4a'; ctx.fillRect(w * (x - 0.05), h * 0.52, w * 0.1, h * 0.12); ctx.beginPath(); ctx.arc(w * x, h * 0.52, w * 0.05, Math.PI, 0); ctx.fill(); }
    // three portals
    for (const x of [0.3, 0.5, 0.7]) { ctx.fillStyle = '#d9c7a0'; ctx.fillRect(w * (x - 0.07), h * 0.74, w * 0.14, h * 0.26); ctx.fillStyle = '#3a2418'; ctx.fillRect(w * (x - 0.055), h * 0.8, w * 0.11, h * 0.2); ctx.beginPath(); ctx.arc(w * x, h * 0.8, w * 0.055, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#3a2418'; ctx.font = `bold ${Math.round(w * 0.045)}px Georgia`; ctx.textAlign = 'center';
    ctx.fillText('K\'HAL ADATH JESHURUN · 5647', w / 2, h * 0.7);
  },
  // Church of the Transfiguration, 25 Mott St (1801): Georgian fieldstone, arched door, small tower.
  church(ctx, w, h, s, r) {
    ctx.fillStyle = '#7a7266'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 14) for (let x = (y / 14) % 2 * -10; x < w; x += 22 + r() * 10) { ctx.fillStyle = shade('#837a6c', (r() - 0.5) * 40); ctx.fillRect(x + 2, y + 2, 20, 11); }
    ctx.fillStyle = '#e4ddcc'; ctx.beginPath(); ctx.moveTo(0, h * 0.18); ctx.lineTo(w / 2, 0); ctx.lineTo(w, h * 0.18); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#7a7266'; ctx.beginPath(); ctx.moveTo(w * 0.08, h * 0.17); ctx.lineTo(w / 2, h * 0.03); ctx.lineTo(w * 0.92, h * 0.17); ctx.closePath(); ctx.fill();
    for (const x of [0.2, 0.8]) { ctx.fillStyle = '#d9d2c0'; ctx.fillRect(w * (x - 0.07), h * 0.28, w * 0.14, h * 0.32); ctx.fillStyle = '#2e3440'; ctx.fillRect(w * (x - 0.055), h * 0.31, w * 0.11, h * 0.27); ctx.beginPath(); ctx.arc(w * x, h * 0.31, w * 0.055, Math.PI, 0); ctx.fill(); }
    ctx.fillStyle = '#d9d2c0'; ctx.fillRect(w * 0.38, h * 0.62, w * 0.24, h * 0.38);
    ctx.fillStyle = '#3a2418'; ctx.fillRect(w * 0.41, h * 0.7, w * 0.18, h * 0.3); ctx.beginPath(); ctx.arc(w * 0.5, h * 0.7, w * 0.09, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#2e3440'; ctx.beginPath(); ctx.arc(w * 0.5, h * 0.4, w * 0.07, 0, 7); ctx.fill();
    ctx.fillStyle = '#2a2420'; ctx.font = `bold ${Math.round(w * 0.05)}px Georgia`; ctx.textAlign = 'center';
    ctx.fillText('CHURCH OF THE TRANSFIGURATION', w / 2, h * 0.6);
  },
  // Straw ticks seen from above/side: canvas or blue gingham covers, grey/brown wool blankets.
  berths(ctx, w, h, s, r) {
    const n = s.n || 4, bw = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * bw;
      const gingham = r() < 0.4;
      ctx.fillStyle = gingham ? '#5a6e9a' : '#d9d2bf'; ctx.fillRect(x + 2, 0, bw - 4, h);
      if (gingham) { ctx.fillStyle = 'rgba(255,255,255,.35)'; for (let k = 0; k < bw; k += 8) ctx.fillRect(x + k, 0, 4, h); for (let k = 0; k < h; k += 8) ctx.fillRect(x, k, bw, 4); }
      ctx.fillStyle = r() < 0.5 ? '#6b6258' : '#5a4636'; ctx.fillRect(x + 4, h * (0.35 + r() * 0.1), bw - 8, h * 0.5);  // blanket
      ctx.fillStyle = '#c8a870'; ctx.fillRect(x + bw * 0.25, h * 0.04, bw * 0.5, h * 0.16);                             // cork pillow
      ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x, 0, 2, h);                                                              // iron pipe partition
    }
    noise(ctx, w, h, r, 16, 900);
  },
  sawdust(ctx, w, h, s, r) {
    DRAW.planks(ctx, w, h, { color: '#6a4a30', n: 8 }, r);
    for (let i = 0; i < 2500; i++) { ctx.fillStyle = `rgba(${200 + r() * 40},${170 + r() * 30},${110 + r() * 30},${0.25 + r() * 0.4})`; ctx.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  },
  // Wraparound skyline placeholder. The horizon sits 30% up from the bottom.
  // kind: 'rooftops' | 'harbor' | 'park'. Tiles seamlessly when mirrored.
  skyline(ctx, w, h, s, r) {
    const hz = h * 0.7;
    const g = ctx.createLinearGradient(0, 0, 0, hz);
    g.addColorStop(0, s.top || '#8fa0ae'); g.addColorStop(1, s.haze || '#d8cdb4');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hz);
    ctx.fillStyle = s.ground || s.haze || '#d8cdb4'; ctx.fillRect(0, hz, w, h - hz);
    // soft clouds / smoke
    for (let i = 0; i < 14; i++) { ctx.fillStyle = `rgba(255,255,255,${0.05 + r() * 0.08})`; ctx.beginPath(); ctx.ellipse(r() * w, hz * (0.15 + r() * 0.5), 60 + r() * 120, 10 + r() * 16, 0, 0, 7); ctx.fill(); }
    const layer = (col, minH, maxH, spires) => {
      ctx.fillStyle = col;
      let x = 0;
      while (x < w) {
        const bw = 10 + r() * 34, bh = minH + r() * (maxH - minH);
        ctx.fillRect(x, hz - bh, bw + 1, bh + 2);
        if (r() < 0.35) ctx.fillRect(x + bw * 0.3, hz - bh - 5 - r() * 6, 3, 12);                       // chimney
        if (r() < 0.12) { ctx.fillRect(x + bw * 0.5, hz - bh - 9, 9, 9); ctx.fillRect(x + bw * 0.5 + 3, hz - bh - 12, 3, 4); } // water tank
        if (spires && r() < 0.06) { ctx.beginPath(); ctx.moveTo(x + 2, hz - bh); ctx.lineTo(x + 7, hz - bh - 30 - r() * 30); ctx.lineTo(x + 12, hz - bh); ctx.fill(); } // steeple
        if (r() < 0.2) { ctx.fillStyle = 'rgba(230,225,215,.18)'; ctx.beginPath(); ctx.ellipse(x + bw * 0.3 + 8, hz - bh - 24, 14, 6, -0.4, 0, 7); ctx.fill(); ctx.fillStyle = col; } // smoke
        x += bw;
      }
    };
    if (s.kind === 'harbor') {
      ctx.fillStyle = s.ground || '#2c4a5a'; ctx.fillRect(0, hz, w, h - hz);
      ctx.fillStyle = '#7d8478'; ctx.beginPath(); ctx.moveTo(0, hz);
      for (let x = 0; x <= w; x += 20) ctx.lineTo(x, hz - 3 - Math.abs(Math.sin(x * 0.013)) * 9 - r() * 2);
      ctx.lineTo(w, hz); ctx.fill();
      for (let i = 0; i < 9; i++) {        // sailing ships and steamers far out
        const x = r() * w, k = 0.5 + r();
        ctx.fillStyle = '#3a3a3a'; ctx.fillRect(x - 12 * k, hz - 2 * k, 24 * k, 3 * k);
        ctx.fillRect(x - 6 * k, hz - 16 * k, 1.5, 15 * k); ctx.fillRect(x + 5 * k, hz - 13 * k, 1.5, 12 * k);
        if (r() < 0.5) { ctx.fillStyle = 'rgba(240,235,220,.7)'; ctx.fillRect(x - 5 * k, hz - 13 * k, 8 * k, 8 * k); }
      }
    } else if (s.kind === 'park') {
      layer('#8a8d86', 4, 14, true);
      ctx.fillStyle = '#4a5f3a';
      for (let x = 0; x < w; x += 9) { ctx.beginPath(); ctx.arc(x, hz - 4 - r() * 6, 8 + r() * 9, 0, 7); ctx.fill(); }
      ctx.fillRect(0, hz - 4, w, 6);
    } else {
      layer(s.far || '#9a978f', 8, 26, true);
      layer(s.near || '#6e665f', 5, 16, false);
    }
  },
  // What you see through an elevator's gate as the floors slide past.
  shaft(ctx, w, h, s, r) {
    DRAW.brick(ctx, w, h, { color: '#6a4a3a', mortar: '#3a2e28' }, r);
    ctx.fillStyle = '#1a1614'; ctx.fillRect(0, h * 0.9, w, h * 0.1);                       // floor slab
    ctx.fillStyle = '#c8b890'; ctx.fillRect(w * 0.2, h * 0.3, w * 0.6, h * 0.6);           // hallway beyond the landing door
    ctx.fillStyle = '#8a7a5a'; ctx.fillRect(w * 0.2, h * 0.75, w * 0.6, h * 0.15);
    ctx.fillStyle = '#3a2a1c'; ctx.fillRect(w * 0.42, h * 0.42, w * 0.16, h * 0.33);       // an office door down the hall
    ctx.strokeStyle = '#2a2018'; ctx.lineWidth = 8; ctx.strokeRect(w * 0.2, h * 0.3, w * 0.6, h * 0.6);
    ctx.fillStyle = '#e8d8a8'; ctx.font = `bold ${Math.round(h * 0.09)}px Georgia`; ctx.textAlign = 'center'; ctx.fillText('FLOOR', w / 2, h * 0.2);
  },
  // Brownstone / sandstone ashlar: regular courses of big blocks, thin pale joints, soot and salt.
  ashlar(ctx, w, h, s, r) {
    const base = s.color || '#8a5a44', rows = s.rows || 6, rh = h / rows;
    ctx.fillStyle = s.mortar || '#b9a48e'; ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < rows; y++) {
      let x = (y % 2) * -w / 6;
      while (x < w) {
        const bw = w / 3 * (0.75 + r() * 0.5);
        const g = ctx.createLinearGradient(0, y * rh, 0, (y + 1) * rh);
        const c = (r() - 0.5) * 34;
        g.addColorStop(0, shade(base, c + 10)); g.addColorStop(1, shade(base, c - 12));
        ctx.fillStyle = g; ctx.fillRect(x + 1.5, y * rh + 1.5, bw - 3, rh - 3);
        // tooling marks and chips
        for (let k = 0; k < 14; k++) { ctx.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.08})`; ctx.fillRect(x + r() * bw, y * rh + r() * rh, 2 + r() * 10, 1); }
        if (r() < 0.25) { ctx.fillStyle = 'rgba(40,24,18,.35)'; ctx.beginPath(); ctx.arc(x + r() * bw, y * rh + (r() < 0.5 ? 2 : rh - 2), 3 + r() * 5, 0, 7); ctx.fill(); }
        x += bw;
      }
    }
    // soot streaks running down, salt bleaching low
    for (let i = 0; i < 9; i++) { const x = r() * w, g = ctx.createLinearGradient(0, 0, 0, h * (0.4 + r() * 0.6)); g.addColorStop(0, 'rgba(40,26,22,.32)'); g.addColorStop(1, 'rgba(40,26,22,0)'); ctx.fillStyle = g; ctx.fillRect(x, 0, 6 + r() * 16, h); }
    noise(ctx, w, h, r, 22, 5000);
  },
  // Whitewashed iron hull: lapped plates, double rivet rows, rust weeping from the seams.
  hull(ctx, w, h, s, r) {
    ctx.fillStyle = s.color || '#d8d4c4'; ctx.fillRect(0, 0, w, h);
    const strakes = 2, sh = h / strakes;
    for (let y = 0; y < strakes; y++) {
      const g = ctx.createLinearGradient(0, y * sh, 0, (y + 1) * sh); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(0,0,0,.14)');
      ctx.fillStyle = g; ctx.fillRect(0, y * sh, w, sh);
      ctx.fillStyle = 'rgba(40,36,30,.5)'; ctx.fillRect(0, y * sh, w, 2);
      for (const dy of [7, 14]) for (let x = 4; x < w; x += 10) { ctx.fillStyle = 'rgba(90,84,74,.75)'; ctx.beginPath(); ctx.arc(x, y * sh + dy, 1.7, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,.5)'; ctx.fillRect(x - 1, y * sh + dy - 1.4, 1.2, 1.2); }
      for (let i = 0; i < 7; i++) { const x = r() * w, len = 20 + r() * (sh - 30), gg = ctx.createLinearGradient(0, y * sh + 14, 0, y * sh + 14 + len); gg.addColorStop(0, 'rgba(138,74,42,.55)'); gg.addColorStop(1, 'rgba(138,74,42,0)'); ctx.fillStyle = gg; ctx.fillRect(x, y * sh + 14, 2 + r() * 4, len); }
    }
    for (let x = 0; x < w; x += w / 2) { ctx.fillStyle = 'rgba(40,36,30,.45)'; ctx.fillRect(x, 0, 2, h); for (let y = 6; y < h; y += 10) { ctx.fillStyle = 'rgba(90,84,74,.7)'; ctx.beginPath(); ctx.arc(x + 7, y, 1.6, 0, 7); ctx.fill(); } }
    noise(ctx, w, h, r, 14, 2500);
  },
  // 1880s tenement wallpaper: small repeat on ochre, smoke-browned toward the ceiling, dark dado below.
  wallpaper(ctx, w, h, s, r) {
    const base = s.color || '#b79a5e';
    ctx.fillStyle = base; ctx.fillRect(0, 0, w, h);
    const step = w / 12;
    for (let y = 0; y < h; y += step) for (let x = (Math.round(y / step) % 2) * step / 2; x < w; x += step) {
      ctx.strokeStyle = 'rgba(110,60,40,.55)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(x, y, step * 0.16, 0, 7); ctx.stroke();
      ctx.fillStyle = 'rgba(90,100,60,.6)';
      for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.78; ctx.beginPath(); ctx.ellipse(x + Math.cos(a) * step * 0.3, y + Math.sin(a) * step * 0.3, step * 0.1, step * 0.045, a, 0, 7); ctx.fill(); }
    }
    ctx.fillStyle = 'rgba(50,34,20,.22)'; ctx.fillRect(0, 0, w, h);   // lamp smoke and age
    for (let i = 0; i < 12; i++) { ctx.fillStyle = `rgba(60,40,20,${r() * 0.12})`; ctx.beginPath(); ctx.arc(r() * w, r() * h, 10 + r() * 40, 0, 7); ctx.fill(); }
    noise(ctx, w, h, r, 14, 2500);
  },
  // Weathered vertical board fence.
  boards(ctx, w, h, s, r) {
    const base = s.color || '#7d776c', n = s.n || 8;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = shade(base, (r() - 0.5) * 30); ctx.fillRect(i * w / n, 0, w / n, h);
      ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(i * w / n, 0, 1.5, h);
      for (let k = 0; k < 9; k++) { ctx.fillStyle = 'rgba(0,0,0,.1)'; ctx.fillRect(i * w / n + r() * w / n, 0, 1, h); }
      if (r() < 0.4) { ctx.fillStyle = 'rgba(30,22,16,.55)'; ctx.beginPath(); ctx.ellipse(i * w / n + w / n / 2, r() * h, 3, 5, 0, 0, 7); ctx.fill(); }
      for (const y of [h * 0.12, h * 0.85]) { ctx.fillStyle = 'rgba(40,30,24,.8)'; ctx.fillRect(i * w / n + w / n / 2 - 1, y, 2, 2); }
    }
    const g = ctx.createLinearGradient(0, h * 0.7, 0, h); g.addColorStop(0, 'rgba(40,34,26,0)'); g.addColorStop(1, 'rgba(40,34,26,.5)'); ctx.fillStyle = g; ctx.fillRect(0, h * 0.7, w, h * 0.3);
    noise(ctx, w, h, r, 16, 2000);
  },
  // Granite Belgian block street: rectangular setts, dark joints, mud, straw and manure.
  belgian(ctx, w, h, s, r) {
    ctx.fillStyle = '#2e2b27'; ctx.fillRect(0, 0, w, h);
    const rows = 12, rh = h / rows, bw = w / 5;
    for (let y = 0; y < rows; y++) for (let x = -1; x < 6; x++) {
      const ox = (y % 2) * bw / 2 + (r() - 0.5) * 3;
      const g = ctx.createLinearGradient(0, y * rh, 0, (y + 1) * rh), c = (r() - 0.5) * 36;
      g.addColorStop(0, shade(s.color || '#6e6b66', c + 14)); g.addColorStop(1, shade(s.color || '#6e6b66', c - 10));
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x * bw + ox + 1.5, y * rh + 1.5, bw - 3, rh - 3, 3); ctx.fill();
    }
    for (let i = 0; i < 16; i++) { ctx.fillStyle = `rgba(90,74,54,${0.18 + r() * 0.3})`; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 8 + r() * 26, 4 + r() * 10, r() * 3, 0, 7); ctx.fill(); }
    for (let i = 0; i < 60; i++) { ctx.strokeStyle = `rgba(200,180,110,${0.25 + r() * 0.3})`; ctx.lineWidth = 1; const x = r() * w, y = r() * h, a = r() * 7; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * 7, y + Math.sin(a) * 7); ctx.stroke(); }
    if (s.wet) for (let i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(150,160,175,.22)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, 14 + r() * 30, 5 + r() * 9, 0, 0, 7); ctx.fill(); }
    noise(ctx, w, h, r, 20, 3000);
  },
  // A fort embrasure fitted with a multi-pane sash.
  embrasure(ctx, w, h, s) {
    ctx.fillStyle = '#3a2620'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, 0, w, 0); g.addColorStop(0, '#5a3a2e'); g.addColorStop(0.2, '#241812'); g.addColorStop(0.8, '#241812'); g.addColorStop(1, '#5a3a2e');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#4a5a62'; ctx.fillRect(w * 0.2, h * 0.14, w * 0.6, h * 0.72);
    ctx.fillStyle = 'rgba(200,215,220,.25)'; ctx.fillRect(w * 0.2, h * 0.14, w * 0.6, h * 0.3);
    ctx.strokeStyle = '#d8d0bc'; ctx.lineWidth = 3; ctx.strokeRect(w * 0.2, h * 0.14, w * 0.6, h * 0.72);
    for (let i = 1; i < 3; i++) { ctx.beginPath(); ctx.moveTo(w * (0.2 + i * 0.2), h * 0.14); ctx.lineTo(w * (0.2 + i * 0.2), h * 0.86); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(w * 0.2, h * 0.5); ctx.lineTo(w * 0.8, h * 0.5); ctx.stroke();
  },
  // A chalked blackboard (exchange rates, arriving steamers).
  blackboard(ctx, w, h, s, r) {
    ctx.fillStyle = '#5a4630'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#1c2420'; ctx.fillRect(8, 8, w - 16, h - 16);
    for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.04})`; ctx.fillRect(8 + r() * (w - 16), 8 + r() * (h - 16), 40 + r() * 80, 6 + r() * 10); }
    ctx.fillStyle = '#f0ece0'; ctx.textAlign = 'center';
    const lines = String(s.title || '').split('\n');
    lines.forEach((ln, i) => { ctx.font = `${i ? '' : 'bold '}${Math.round(h * (i ? 0.085 : 0.11))}px Georgia`; ctx.fillText(ln, w / 2, 8 + h * (0.17 + i * 0.125), w - 30); });
  },
  // Tweed Courthouse rotunda wall: tiers of round arches in red and cream brick
  // (Eidlitz's polychrome work) with cast-iron balustrades at each floor.
  arcade(ctx, w, h, s, r) {
    const tiers = s.tiers || 3, th = h / tiers, n = s.n || 2, aw = w / n;
    ctx.fillStyle = s.color || '#e8dcc4'; ctx.fillRect(0, 0, w, h);
    noise(ctx, w, h, r, 10, 1200);
    for (let t = 0; t < tiers; t++) {
      const y0 = t * th;
      for (let i = 0; i < n; i++) {
        const cx = i * aw + aw / 2, ow = aw * 0.62, top = y0 + th * 0.18, bot = y0 + th * 0.9;
        // voussoirs: alternating red and cream around the arch
        for (let k = 0; k < 13; k++) {
          const a0 = Math.PI + k * Math.PI / 13, a1 = a0 + Math.PI / 13;
          ctx.fillStyle = k % 2 ? '#a8432e' : '#efe6d2';
          ctx.beginPath(); ctx.arc(cx, top + ow / 2, ow / 2 + aw * 0.07, a0, a1); ctx.arc(cx, top + ow / 2, ow / 2, a1, a0, true); ctx.closePath(); ctx.fill();
        }
        // dark opening (the gallery corridor behind)
        const gr = ctx.createLinearGradient(0, top, 0, bot); gr.addColorStop(0, '#3a2c22'); gr.addColorStop(1, '#5a463a');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(cx, top + ow / 2, ow / 2, Math.PI, 0); ctx.lineTo(cx + ow / 2, bot); ctx.lineTo(cx - ow / 2, bot); ctx.closePath(); ctx.fill();
        // a lit office door deep in the gallery
        ctx.fillStyle = 'rgba(240,200,120,.35)'; ctx.fillRect(cx - ow * 0.12, bot - th * 0.4, ow * 0.24, th * 0.4);
        // red brick pier bands
        ctx.fillStyle = '#b5543a';
        for (let b = 0; b < 6; b++) ctx.fillRect(i * aw, top + ow / 2 + b * th * 0.09, aw * 0.12, th * 0.035), ctx.fillRect((i + 1) * aw - aw * 0.12, top + ow / 2 + b * th * 0.09, aw * 0.12, th * 0.035);
      }
      // iron balustrade along the gallery floor
      if (t < tiers - 1 || s.topRail) {
        const ry = y0 + th * 0.9;
        ctx.fillStyle = '#2a2622'; ctx.fillRect(0, ry - th * 0.2, w, th * 0.025); ctx.fillRect(0, ry - 2, w, 4);
        for (let x = 4; x < w; x += 9) ctx.fillRect(x, ry - th * 0.2, 2, th * 0.2);
      }
      ctx.fillStyle = '#cbbfa6'; ctx.fillRect(0, y0 + th * 0.9, w, th * 0.1);     // floor slab edge
      ctx.fillStyle = 'rgba(0,0,0,.18)'; ctx.fillRect(0, y0 + th * 0.985, w, th * 0.015);
    }
  },
  // An open double door seen from outside, lamplit hall beyond.
  doorway(ctx, w, h, s) {
    ctx.fillStyle = s.frame || '#5a4632'; ctx.fillRect(0, 0, w, h);
    const g = ctx.createLinearGradient(0, h, 0, 0); g.addColorStop(0, '#8a6a44'); g.addColorStop(0.5, '#c8a066'); g.addColorStop(1, '#6a5038');
    ctx.fillStyle = g; ctx.fillRect(w * 0.1, h * 0.08, w * 0.8, h * 0.92);
    ctx.fillStyle = 'rgba(255,230,170,.5)'; ctx.beginPath(); ctx.arc(w / 2, h * 0.3, w * 0.12, 0, 7); ctx.fill();
    ctx.fillStyle = '#3a2a1e'; ctx.fillRect(w * 0.1, h * 0.08, w * 0.14, h * 0.92); ctx.fillRect(w * 0.76, h * 0.08, w * 0.14, h * 0.92);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(w * 0.1, h * 0.08, w * 0.8, h * 0.04);
  },
  // Polished marble tile floor in two colors, laid on the diagonal.
  tiles(ctx, w, h, s, r) {
    const n = s.n || 8, c = w / n;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      ctx.fillStyle = (x + y) % 2 ? (s.color2 || '#7a6e62') : (s.color || '#e6e0d2');
      ctx.fillRect(x * c, y * c, c, c);
      ctx.fillStyle = `rgba(255,255,255,${r() * 0.06})`; ctx.fillRect(x * c + r() * c * 0.5, y * c, c * 0.3, c);
    }
    ctx.strokeStyle = 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
    for (let i = 0; i <= n; i++) { ctx.beginPath(); ctx.moveTo(i * c, 0); ctx.lineTo(i * c, h); ctx.moveTo(0, i * c); ctx.lineTo(w, i * c); ctx.stroke(); }
  },
  // A contractor's bill to the county, on ruled ledger paper (for the graft display).
  bill(ctx, w, h, s, r) {
    ctx.fillStyle = '#efe6cc'; ctx.fillRect(0, 0, w, h); noise(ctx, w, h, r, 16, 1600);
    ctx.strokeStyle = 'rgba(70,110,150,.35)'; ctx.lineWidth = 1;
    for (let y = h * 0.3; y < h * 0.95; y += h * 0.07) { ctx.beginPath(); ctx.moveTo(10, y); ctx.lineTo(w - 10, y); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(170,40,40,.5)'; ctx.beginPath(); ctx.moveTo(w * 0.72, h * 0.25); ctx.lineTo(w * 0.72, h * 0.95); ctx.stroke();
    ctx.fillStyle = '#2b2118'; ctx.textAlign = 'center';
    ctx.font = `bold ${Math.round(h * 0.075)}px Georgia`; ctx.fillText(s.head || 'COUNTY OF NEW YORK', w / 2, h * 0.1, w - 20);
    ctx.font = `italic ${Math.round(h * 0.055)}px Georgia`; ctx.fillText(s.sub || 'To the Board of Supervisors, Dr.', w / 2, h * 0.18, w - 20);
    ctx.textAlign = 'left'; ctx.font = `${Math.round(h * 0.06)}px Georgia`;
    (s.items || []).forEach(([what, amt], i) => {
      const y = h * (0.35 + i * 0.14);
      ctx.fillStyle = '#2b2118'; ctx.fillText(what, 16, y, w * 0.66);
      ctx.textAlign = 'right'; ctx.fillStyle = '#8a1e1a'; ctx.font = `bold ${Math.round(h * 0.065)}px Georgia`; ctx.fillText(amt, w - 14, y, w * 0.26);
      ctx.textAlign = 'left'; ctx.font = `${Math.round(h * 0.06)}px Georgia`;
    });
    if (s.stamp) { ctx.save(); ctx.translate(w * 0.7, h * 0.86); ctx.rotate(-0.2); ctx.strokeStyle = 'rgba(150,30,30,.7)'; ctx.lineWidth = 3; ctx.strokeRect(-w * 0.2, -h * 0.05, w * 0.4, h * 0.1); ctx.fillStyle = 'rgba(150,30,30,.75)'; ctx.textAlign = 'center'; ctx.font = `bold ${Math.round(h * 0.05)}px Georgia`; ctx.fillText(s.stamp, 0, h * 0.018); ctx.restore(); }
  },
  // Picket railing on a transparent background (used with alphaTest).
  picket(ctx, w, h, s) {
    ctx.clearRect(0, 0, w, h);
    const c = s.color || '#d8d0bc', n = s.n || 8, pw = w / n;
    ctx.fillStyle = c;
    for (let i = 0; i < n; i++) { const x = i * pw + pw * 0.3; ctx.fillRect(x, h * 0.12, pw * 0.4, h * 0.88); ctx.beginPath(); ctx.moveTo(x, h * 0.12); ctx.lineTo(x + pw * 0.2, 0); ctx.lineTo(x + pw * 0.4, h * 0.12); ctx.fill(); }
    ctx.fillRect(0, h * 0.25, w, h * 0.07); ctx.fillRect(0, h * 0.78, w, h * 0.07);
    ctx.fillStyle = 'rgba(0,0,0,.18)'; for (let i = 0; i < n; i++) ctx.fillRect(i * pw + pw * 0.62, h * 0.12, pw * 0.08, h * 0.88);
  },
  // A ring of tall arched windows (the clerestory of a lantern), bright from inside.
  clerestory(ctx, w, h, s) {
    ctx.fillStyle = s.color || '#d8d0bc'; ctx.fillRect(0, 0, w, h);
    const n = s.n || 6, ww = w / n;
    for (let i = 0; i < n; i++) {
      const x = i * ww + ww * 0.22, y = h * 0.22, wd = ww * 0.56, ht = h * 0.62;
      ctx.fillStyle = s.glass || '#eef0ea';
      ctx.fillRect(x, y + wd / 2, wd, ht - wd / 2); ctx.beginPath(); ctx.arc(x + wd / 2, y + wd / 2, wd / 2, Math.PI, 0); ctx.fill();
      ctx.strokeStyle = '#6a6a64'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x + wd / 2, y); ctx.lineTo(x + wd / 2, y + ht); ctx.moveTo(x, y + ht * 0.55); ctx.lineTo(x + wd, y + ht * 0.55); ctx.stroke();
    }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, 0, w, h * 0.08); ctx.fillRect(0, h * 0.92, w, h * 0.08);
  },
  awning(ctx, w, h, s) {
    const a = s.color || '#8a2e2a', b = s.color2 || '#e8dcc0';
    for (let x = 0; x < w; x += w / 8) { ctx.fillStyle = (Math.round(x / (w / 8)) % 2) ? a : b; ctx.fillRect(x, 0, w / 8 + 1, h); }
    ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fillRect(0, h * 0.86, w, h * 0.14);
  },
  // Cloth election banner hung across a street.
  banner(ctx, w, h, s, r) {
    ctx.fillStyle = s.color || '#efe6cf'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#a3312a'; ctx.fillRect(0, 0, w, h * 0.1); ctx.fillStyle = '#2f4a7a'; ctx.fillRect(0, h * 0.9, w, h * 0.1);
    ctx.fillStyle = '#1d1a16'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const lines = String(s.title || '').split('\n');
    lines.forEach((ln, i) => {
      let size = h * (i === 1 ? 0.34 : 0.17); ctx.font = `bold ${size}px Georgia`;
      while (ctx.measureText(ln).width > w * 0.9 && size > 6) { size -= 1; ctx.font = `bold ${size}px Georgia`; }
      ctx.fillText(ln, w / 2, h * (lines.length === 1 ? 0.5 : [0.24, 0.52, 0.78][i] || 0.5));
    });
    noise(ctx, w, h, r, 10, 500);
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

/**
 * Character art straight from an image generator has a flat background and lots of empty margin.
 * This clears everything connected to the image edges that matches the corner color, softens
 * the outline, removes color spill, crops to the figure, and shrinks it to a size a Chromebook
 * can hold fifty of. Art that already has a transparent background is only cropped and shrunk.
 */
export function prepCutout(img, { crop = true, maxH = 640 } = {}) {
  const k = Math.min(1, 1024 / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * k)), h = Math.max(1, Math.round(img.height * k));
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d', { willReadFrequently: true });
  g.drawImage(img, 0, 0, w, h);
  let id;
  try { id = g.getImageData(0, 0, w, h); } catch { return img; }
  const d = id.data, at = (x, y) => (y * w + x) * 4;
  const corners = [at(1, 1), at(w - 2, 1), at(1, h - 2), at(w - 2, h - 2)];
  if (corners.every(i => d[i + 3] > 250)) {
    // opaque background: sample its color from the corners
    let br = 0, bg = 0, bb = 0; for (const i of corners) { br += d[i]; bg += d[i + 1]; bb += d[i + 2]; } br /= 4; bg /= 4; bb /= 4;
    const dist = (i) => Math.abs(d[i] - br) + Math.abs(d[i + 1] - bg) + Math.abs(d[i + 2] - bb);
    const TOL = 96, seen = new Uint8Array(w * h), stack = [];
    const push = (x, y) => { const n = y * w + x; if (!seen[n] && dist(n * 4) < TOL) { seen[n] = 1; stack.push(n); } };
    for (let x = 0; x < w; x++) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y++) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const n = stack.pop(), x = n % w, y = (n / w) | 0;
      if (x > 0) push(x - 1, y); if (x < w - 1) push(x + 1, y); if (y > 0) push(x, y - 1); if (y < h - 1) push(x, y + 1);
    }
    const greenish = bg > br + 40 && bg > bb + 40;
    // A strongly colored key (green screen) is not used anywhere in the cast, so pockets of it that the
    // edge fill could not reach (the loop of an arm, a basket handle) are cleared too.
    if (Math.max(br, bg, bb) - Math.min(br, bg, bb) > 80) for (let n = 0; n < w * h; n++) if (!seen[n] && dist(n * 4) < 70) seen[n] = 1;
    for (let n = 0; n < w * h; n++) {
      const i = n * 4;
      if (seen[n]) { d[i + 3] = 0; continue; }
      const x = n % w, y = (n / w) | 0;
      const edge = (x > 0 && seen[n - 1]) || (x < w - 1 && seen[n + 1]) || (y > 0 && seen[n - w]) || (y < h - 1 && seen[n + w]);
      if (edge) d[i + 3] = Math.max(0, Math.min(255, (dist(i) - TOL * 0.5) * 2.2));     // soft outline
      if (greenish && d[i + 1] > Math.max(d[i], d[i + 2])) d[i + 1] = Math.max(d[i], d[i + 2]);   // remove green spill
    }
    g.putImageData(id, 0, 0);
  }
  // crop to the figure
  let x0 = 0, y0 = 0, x1 = w - 1, y1 = h - 1;
  if (crop) {
    x0 = w; y0 = h; x1 = 0; y1 = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (d[at(x, y) + 3] > 40) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 <= x0 || y1 <= y0) { x0 = 0; y0 = 0; x1 = w - 1; y1 = h - 1; }
    const pad = Math.round(h * 0.012); x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad);
  }
  const cw = x1 - x0 + 1, chh = y1 - y0 + 1, s = Math.min(1, maxH / chh);
  const out = document.createElement('canvas'); out.width = Math.max(1, Math.round(cw * s)); out.height = Math.max(1, Math.round(chh * s));
  out.getContext('2d').drawImage(cv, x0, y0, cw, chh, 0, 0, out.width, out.height);
  return out;
}

function tryLoad(key, entry) {
  const exts = ['webp', 'png', 'jpg', 'jpeg'];   // webp first: tools/prep-art.py writes transparent webp files
  const figure = /^portrait_/.test(key), strip = /^anim_/.test(key);
  const attempt = (i) => {
    if (i >= exts.length) return;
    const img = new Image();
    img.onload = () => {
      const use = figure ? prepCutout(img) : strip ? prepCutout(img, { crop: false, maxH: 512 }) : img;
      entry.img = use; entry.url = /\.(webp|png)$/.test(img.src) ? img.src : null;   // keyed files are shown as-is in HTML (sharper)
      // dispose first: GPU texture storage is fixed-size, so a new image of another size must get fresh storage
      for (const t of entry.users) { t.dispose(); t.image = use; t.needsUpdate = true; }
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
    base.anisotropy = 4;
    base.userData.key = key;
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
  if (e.img) return e.url || e.img.src || (e.url = e.img.toDataURL());
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
  if (opts.side) m.side = opts.side;
  matCache.set(ck, m);
  return m;
}
