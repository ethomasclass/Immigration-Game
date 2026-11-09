// Zone base class + building helpers. Every zone is built from simple shapes
// (cheap for Chromebooks) wearing textures from the art loader.
import * as THREE from 'three';
import { material, colorMat, texture } from './textures.js';
import { CHARACTERS } from '../data/characters.js';

export class Zone {
  constructor(game) {
    this.game = game;
    this.scene = new THREE.Scene();
    this.colliders = [];
    this.interactables = [];
    this.targets = [];
    this.npcs = [];
    this.updaters = [];
    this.bounds = null;
    this.spawn = { x: 0, z: 0, yaw: 0 };
    this.time = 0;
  }

  // ---- override in zones ----
  build() {}
  objectives() { return []; }
  onAction(name) {}
  update(dt) {
    this.time += dt;
    for (const u of this.updaters) u(dt, this.time);
    // NPCs turn gently toward the player when nearby.
    const p = this.game.controls.pos;
    for (const n of this.npcs) {
      if (n.noTurn) continue;
      const dx = p.x - n.group.position.x, dz = p.z - n.group.position.z;
      const d = Math.hypot(dx, dz);
      const target = d < 6 ? Math.atan2(dx, dz) : n.baseYaw;
      let diff = target - n.group.rotation.y;
      diff = Math.atan2(Math.sin(diff), Math.cos(diff));
      n.group.rotation.y += diff * Math.min(1, dt * 3);
    }
  }

  // ---- environment ----
  setSky(color, fogNear, fogFar, fogColor) {
    this.scene.background = new THREE.Color(color);
    this.scene.fog = new THREE.Fog(fogColor ?? color, fogNear, fogFar);
  }

  lights({ ambient = 0x8a7f70, ambientI = 1.2, sky = 0xd8d0c0, ground = 0x3a3028, hemiI = 0.8, sun = null } = {}) {
    this.scene.add(new THREE.AmbientLight(ambient, ambientI));
    this.scene.add(new THREE.HemisphereLight(sky, ground, hemiI));
    if (sun) {
      const d = new THREE.DirectionalLight(sun.color ?? 0xfff0d8, sun.i ?? 1.5);
      d.position.set(...(sun.pos || [20, 40, 10]));
      this.scene.add(d);
    }
  }

  lamp(x, y, z, color = 0xffc070, intensity = 6, dist = 12) {
    const l = new THREE.PointLight(color, intensity, dist, 1.4);
    l.position.set(x, y, z);
    this.scene.add(l);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), colorMat('#ffd890', { basic: true }));
    bulb.position.set(x, y, z);
    this.scene.add(bulb);
    return l;
  }

  /** Box with its BOTTOM at y. mat: Material or [key, spec, opts]. */
  box(x, y, z, w, h, d, mat, { collide = true, ry = 0, uv = null } = {}) {
    const geo = new THREE.BoxGeometry(w, h, d);
    if (uv) scaleUV(geo, w, h, d, uv);
    const m = new THREE.Mesh(geo, toMat(mat));
    m.position.set(x, y + h / 2, z);
    m.rotation.y = ry;
    this.scene.add(m);
    if (collide) {
      const swap = Math.abs(Math.sin(ry)) > 0.7;
      const hw = (swap ? d : w) / 2, hd = (swap ? w : d) / 2;
      // `see`: low objects (tables, carts) don't block the camera's view.
      this.colliders.push({ minX: x - hw, maxX: x + hw, minZ: z - hd, maxZ: z + hd, see: y + h < 1.4 });
    }
    return m;
  }

  /** Flat panel (for posters, signs, windows). Faces +Z by default; ry rotates. */
  panel(x, y, z, w, h, mat, ry = 0, double = false) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), toMat(mat, double));
    m.position.set(x, y, z); m.rotation.y = ry;
    this.scene.add(m);
    return m;
  }

  floor(x, z, w, d, mat, y = 0) {
    const geo = new THREE.PlaneGeometry(w, d);
    const m = new THREE.Mesh(geo, toMat(mat));
    m.rotation.x = -Math.PI / 2; m.position.set(x, y, z);
    this.scene.add(m);
    return m;
  }

  ceiling(x, z, w, d, mat, y) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), toMat(mat));
    m.rotation.x = Math.PI / 2; m.position.set(x, y, z);
    this.scene.add(m);
    return m;
  }

  /** Room walls (inside faces) from minX..maxX, minZ..maxZ. gaps: [{side:'n'|'s'|'e'|'w', from, to}] */
  room(minX, maxX, minZ, maxZ, h, mat, gaps = [], t = 0.2) {
    const sides = {
      n: { a: minX, b: maxX, fixed: minZ, horiz: true },
      s: { a: minX, b: maxX, fixed: maxZ, horiz: true },
      w: { a: minZ, b: maxZ, fixed: minX, horiz: false },
      e: { a: minZ, b: maxZ, fixed: maxX, horiz: false },
    };
    for (const [k, s] of Object.entries(sides)) {
      const g = gaps.filter(gp => gp.side === k).sort((p, q) => p.from - q.from);
      let cur = s.a;
      const segs = [];
      for (const gp of g) { if (gp.from > cur) segs.push([cur, gp.from]); cur = gp.to; if (gp.lintel) segs.push({ lintel: [gp.from, gp.to] }); }
      if (cur < s.b) segs.push([cur, s.b]);
      for (const seg of segs) {
        if (seg.lintel) {
          const [a, b] = seg.lintel, len = b - a, mid = (a + b) / 2;
          if (s.horiz) this.box(mid, 2.3, s.fixed, len, h - 2.3, t, mat, { collide: false, uv: [2, 2] });
          else this.box(s.fixed, 2.3, mid, t, h - 2.3, len, mat, { collide: false, uv: [2, 2] });
          continue;
        }
        const [a, b] = seg, len = b - a, mid = (a + b) / 2;
        if (len <= 0.01) continue;
        if (s.horiz) this.box(mid, 0, s.fixed, len, h, t, mat, { uv: [2, 2] });
        else this.box(s.fixed, 0, mid, t, h, len, mat, { uv: [2, 2] });
      }
    }
  }

  // ---- gameplay ----
  /** Something the player can press E on. */
  interact({ x, y = 1.2, z, r = 2.2, prompt, action, cond = null, once = false }) {
    const it = { pos: new THREE.Vector3(x, y, z), r, prompt, action, cond, once, used: false };
    this.interactables.push(it);
    return it;
  }

  /** Something the camera can photograph. */
  target(subject, x, y, z, maxDist = 10) {
    const t = { subject, pos: new THREE.Vector3(x, y, z), maxDist };
    this.targets.push(t);
    return t;
  }

  /** A person. Body = tapered cylinder wearing the character's art (char_<id>). */
  person(id, x, z, ry = 0, { talk = id, photo = id, prompt = null, noTurn = false, scale = 1, seated = false } = {}) {
    const c = CHARACTERS[id] || {};
    const g = makeFigure(id, c, scale, seated);
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    this.scene.add(g);
    const height = (c.height || 1.7) * scale * (seated ? 0.72 : 1);
    const npc = { id, group: g, baseYaw: ry, noTurn, height };
    this.npcs.push(npc);
    this.colliders.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3 });
    if (talk) this.interact({ x, y: height * 0.8, z, r: 2.4, prompt: prompt || `Talk to ${c.name || id}`, action: () => this.game.talk(talk) });
    if (photo) this.target(photo, x, height * 0.7, z, 9);
    return npc;
  }

  /** Background person (no dialogue). Uses crowd art: char_crowd<N>. */
  crowd(n, x, z, ry = 0, { seated = false, scale = 1 } = {}) {
    const preset = CROWD[n % CROWD.length];
    const g = makeFigure('crowd' + (n % CROWD.length), preset, scale, seated);
    g.position.set(x, 0, z); g.rotation.y = ry;
    this.scene.add(g);
    this.colliders.push({ minX: x - 0.28, maxX: x + 0.28, minZ: z - 0.28, maxZ: z + 0.28 });
    return g;
  }

  /** Circular wall (axis-aligned collider blocks along the arc). gaps: [[startAngle, endAngle]] radians, 0 = +Z, counter-clockwise toward +X. */
  ringWall(cx, cz, r, h, mat, gaps = []) {
    const inGap = (a) => gaps.some(([s, e]) => a >= s && a <= e);
    // visuals: draw arcs between gaps
    const sorted = [...gaps].sort((a, b) => a[0] - b[0]);
    let cur = sorted.length ? sorted[sorted.length - 1][1] - Math.PI * 2 : 0;
    const arcs = [];
    if (!sorted.length) arcs.push([0, Math.PI * 2]);
    for (const [s0, e0] of sorted) { arcs.push([cur, s0]); cur = e0; }
    for (const [a0, a1] of arcs) {
      const len = a1 - a0; if (len <= 0) continue;
      const geo = new THREE.CylinderGeometry(r, r, h, Math.max(6, Math.ceil(len * 10)), 1, true, a0, len);
      const uv = geo.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * (r * len) / 3, uv.getY(i) * h / 3);
      const m = new THREE.Mesh(geo, toMat(mat, true));
      m.position.set(cx, h / 2, cz);
      this.scene.add(m);
    }
    // colliders
    const step = 0.5 / r;
    for (let a = 0; a < Math.PI * 2; a += step) {
      if (inGap(a) || inGap(a + Math.PI * 2) || inGap(a - Math.PI * 2)) continue;
      const x = cx + Math.sin(a) * r, z = cz + Math.cos(a) * r;
      this.colliders.push({ minX: x - 0.38, maxX: x + 0.38, minZ: z - 0.38, maxZ: z + 0.38 });
    }
  }

  tree(x, z, s = 1) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 2.4 * s, 6), colorMat('#4a3828'));
    trunk.position.set(x, 1.2 * s, z); this.scene.add(trunk);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 0), colorMat('#4d6a36'));
    crown.position.set(x, 3.2 * s, z); crown.scale.y = 1.2; this.scene.add(crown);
    this.colliders.push({ minX: x - 0.25, maxX: x + 0.25, minZ: z - 0.25, maxZ: z + 0.25 });
  }

  lamppost(x, z, light = true) {
    this.box(x, 0, z, 0.12, 3.4, 0.12, '#1d1d1d', { collide: true });
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.35), colorMat('#ffdf9a', { basic: true }));
    head.position.set(x, 3.6, z); this.scene.add(head);
    if (light) this.lamp(x, 3.3, z, 0xffcf80, 7, 14);
  }

  /** Document / sign the player can read. */
  readable(docKey, x, y, z, { prompt = 'Read', photo = null, r = 2.2 } = {}) {
    this.interact({ x, y, z, r, prompt, action: () => this.game.readDoc(docKey) });
    if (photo) this.target(photo, x, y, z, 7);
  }

  /** Exit trigger. */
  exit(x, z, prompt, cond, onUse, r = 2.4) {
    return this.interact({ x, y: 1.2, z, r, prompt, cond, action: onUse });
  }
}

function toMat(mat, double = false) {
  if (mat instanceof THREE.Material) return mat;
  if (typeof mat === 'string') return colorMat(mat);
  const [key, spec, opts = {}] = mat;
  return material(key, spec, double ? { ...opts, side: THREE.DoubleSide } : opts);
}

// Scale UVs so textures tile by world size (uv = meters per repeat).
function scaleUV(geo, w, h, d, [mx, my]) {
  const uv = geo.attributes.uv;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 verts each)
  const dims = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let f = 0; f < 6; f++) for (let v = 0; v < 4; v++) {
    const i = f * 4 + v;
    uv.setXY(i, uv.getX(i) * dims[f][0] / mx, uv.getY(i) * dims[f][1] / my);
  }
  uv.needsUpdate = true;
}

const CROWD = [
  { coat: '#4a3b30', skin: '#e2bf9c', height: 1.7, hat: 'cap' },
  { coat: '#3b3f4a', skin: '#d9b08c', height: 1.62, hat: 'scarf' },
  { coat: '#5a4636', skin: '#c99a70', height: 1.75, hat: 'hat' },
  { coat: '#36402e', skin: '#ecc8ab', height: 1.58, hat: 'bonnet' },
  { coat: '#2e2a26', skin: '#e0bc98', height: 1.8, hat: 'bowler' },
  { coat: '#5b3a3a', skin: '#d6a982', height: 1.2, hat: 'cap' },
  { coat: '#45405a', skin: '#e8c4a8', height: 1.66, hat: 'scarf' },
  { coat: '#504a3a', skin: '#ddb894', height: 1.72, hat: 'none' },
];

const SKIN = new Map();
function skinMat(color) {
  if (!SKIN.has(color)) SKIN.set(color, new THREE.MeshLambertMaterial({ color }));
  return SKIN.get(color);
}

export function makeFigure(id, c, scale = 1, seated = false) {
  const H = (c.height || 1.7) * scale;
  const g = new THREE.Group();
  const bodyH = H * (seated ? 0.5 : 0.72);
  const wide = /hat|bowler/.test(c.hat || '') ? 1 : 0.95;
  // Body: open cylinder, image center (u=0.5) faces +Z.
  const bodyGeo = new THREE.CylinderGeometry(0.17 * scale * wide, 0.29 * scale, bodyH, 14, 1, false, Math.PI, Math.PI * 2);
  const body = new THREE.Mesh(bodyGeo, material(`char_${id}`, { type: 'figure', color: c.coat || '#555', w: 256, h: 256 }));
  body.position.y = (seated ? 0.45 : 0) + bodyH / 2;
  g.add(body);
  if (seated) {
    const seat = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), colorMat('#4a3420'));
    seat.position.y = 0.225; g.add(seat);
  }
  // Shoulders + arms (simple)
  const shoulder = new THREE.Mesh(new THREE.SphereGeometry(0.2 * scale, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2), colorMat(c.coat || '#555'));
  shoulder.scale.set(1.15, 0.5, 0.9);
  shoulder.position.y = body.position.y + bodyH / 2 - 0.02;
  g.add(shoulder);
  // Head
  const headR = 0.12 * scale;
  const head = new THREE.Mesh(new THREE.SphereGeometry(headR, 12, 10), skinMat(c.skin || '#d9b08c'));
  head.position.y = shoulder.position.y + headR + 0.06 * scale;
  head.scale.set(0.92, 1.08, 0.95);
  g.add(head);
  // Face card: a small plane in front of the head, using face_<id> art if provided
  const face = new THREE.Mesh(new THREE.PlaneGeometry(headR * 1.5, headR * 1.8), material(`face_${id}`, { type: 'solid', color: c.skin || '#d9b08c', w: 64, h: 64 }, { transparent: false }));
  face.position.set(0, head.position.y, headR * 0.86);
  face.visible = false; // turned on when real face art loads (see main.js)
  face.userData.faceKey = `face_${id}`;
  g.add(face);
  // Eyes (placeholder)
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.014 * scale, 6, 4), colorMat('#1a1410'));
    eye.position.set(sx * headR * 0.38, head.position.y + headR * 0.12, headR * 0.88);
    g.add(eye);
  }
  // Headwear
  const hatColor = shade(c.coat || '#444');
  const hy = head.position.y + headR * 0.6;
  if (c.hat === 'hat' || c.hat === 'bowler') {
    const brim = new THREE.Mesh(new THREE.CylinderGeometry(headR * 1.6, headR * 1.6, 0.02, 14), colorMat('#1d1a18'));
    brim.position.y = hy; g.add(brim);
    const crown = c.hat === 'bowler'
      ? new THREE.Mesh(new THREE.SphereGeometry(headR * 1.02, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#1d1a18'))
      : new THREE.Mesh(new THREE.CylinderGeometry(headR * 0.95, headR * 1.0, headR * 1.1, 14), colorMat('#1d1a18'));
    crown.position.y = hy + (c.hat === 'bowler' ? 0 : headR * 0.55); g.add(crown);
  } else if (c.hat === 'cap') {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.08, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2.2), colorMat(hatColor));
    cap.position.y = head.position.y + headR * 0.15; g.add(cap);
    const peak = new THREE.Mesh(new THREE.BoxGeometry(headR * 1.4, 0.015, headR * 0.8), colorMat(hatColor));
    peak.position.set(0, head.position.y + headR * 0.3, headR * 0.9); g.add(peak);
  } else if (c.hat === 'scarf' || c.hat === 'bonnet') {
    const sc = new THREE.Mesh(new THREE.SphereGeometry(headR * 1.12, 12, 8, Math.PI * 0.15, Math.PI * 1.7, 0, Math.PI * 0.62), colorMat(c.hat === 'scarf' ? '#7a5a4a' : '#3a3530'));
    sc.rotation.y = Math.PI; sc.position.y = head.position.y + headR * 0.05; g.add(sc);
  }
  return g;
}

function shade(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.max(0, (n >> 16) - 30), gg = Math.max(0, ((n >> 8) & 255) - 30), b = Math.max(0, (n & 255) - 30);
  return '#' + ((r << 16) | (gg << 8) | b).toString(16).padStart(6, '0');
}

// Common reusable textures
export const TEX = {
  planks: (c = '#6b4a2e') => ['planks_' + c.slice(1), { type: 'planks', color: c }],
};
export { texture };
