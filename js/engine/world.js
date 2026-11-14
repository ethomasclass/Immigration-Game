// Zone base class + building helpers. Every zone is built from simple shapes
// (cheap for Chromebooks) wearing textures from the art loader.
import * as THREE from 'three';
import { material, colorMat, texture } from './textures.js';
import { CHARACTERS } from '../data/characters.js';
import { makeCutout, animateCutout } from './cutout.js';
import { Life } from './life.js';
import { state } from '../state.js';
import { mergeGeometries } from '../../lib/BufferGeometryUtils.js';

/** A copy of vertices [start, start+count) of a non-indexed geometry (position, normal, uv). */
function slice(geo, start, count) {
  if (!count) return null;
  const out = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) {
    const a = geo.attributes[k], n = a.itemSize;
    out.setAttribute(k, new THREE.BufferAttribute(a.array.slice(start * n, Math.min(a.count, start + count) * n), n));
  }
  return out;
}

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
    // 2D cutouts face the camera and animate; the one speaking plays its talk animation.
    const cam = this.game.camera;
    const d = this.game.dialogue;
    const speaker = d && d.active ? d.currentWho : null;
    const pp = this.game.controls.pos;
    for (const m of this.movers || []) this.stepMover(m, dt, pp);
    this.stepLightPool(dt);
    for (const n of this.npcs) {
      if (!n.group.visible) continue;
      if (n.goto) this.stepGoto(n, dt);
      else if (n.path) this.stepWalker(n, dt, pp);
      // People far away (hidden by fog) are not drawn or animated: keeps the frame rate up.
      // Background crowd figures (no story role) drop out sooner than named characters.
      const lim = n.id && n.id.startsWith('crowd') ? (this.crowdCull || 60) : (this.cullDist || 95);
      const gp = n.group.position, far = (gp.x - pp.x) ** 2 + (gp.z - pp.z) ** 2 > lim * lim;
      const cut = n.group.children;
      if (far !== n.far) { n.far = far; for (const ch of cut) ch.visible = !far; }
      if (far) continue;
      const walking = n.goto ? n : (n.path && !n.paused ? n : null);
      animateCutout(n.group, this.time, cam, speaker && speaker === n.id && n.talking !== false && d.currentTree === n.talkTree, walking);
    }
    this.stepShadows();
    if (this._life) this._life.update(dt, pp, cam, this.game.mode === 'play');
  }

  /** Street life effects (cries, birds, smoke, drifting leaves). Created on first use. */
  get life() { return this._life || (this._life = new Life(this)); }

  /** Move a static group's meshes into the scene (keeping their placement) so optimize() can merge them. */
  bake(g) {
    g.updateMatrixWorld(true);
    const meshes = [];
    g.traverse(o => { if (o.isMesh) meshes.push(o); });
    for (const m of meshes) { m.updateMatrixWorld(true); const mw = m.matrixWorld.clone(); m.parent.remove(m); m.matrix.copy(mw); m.matrix.decompose(m.position, m.quaternion, m.scale); this.scene.add(m); }
    if (g.parent) g.parent.remove(g);
  }

  /**
   * Merge static meshes that share a material into one mesh per material.
   * Cuts draw calls a lot (important on Chromebooks). Meshes with
   * userData.keep (things that move or get hidden) are left alone.
   */
  optimize() {
    const groups = new Map();
    const remove = [];
    for (const o of this.scene.children) {
      if (!o.isMesh || o.isInstancedMesh || o.userData.keep) continue;
      const mats = Array.isArray(o.material) ? o.material : [o.material];
      if (mats.some(m => m.transparent && !m.userData.mergeTransparent)) continue;
      const g = o.geometry;
      if (!g.index && !g.attributes.position) continue;
      if (Array.isArray(o.material) && !g.groups.length) continue;
      o.updateMatrixWorld(true);
      const geo = (g.index ? g.toNonIndexed() : g.clone()).applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      if (!geo.attributes.uv || !geo.attributes.normal) continue;
      // Multi-material meshes (building boxes: one material per face) are split by face group,
      // so each face merges with everything else sharing its material: 1 draw call per material, not 6 per building.
      const parts = Array.isArray(o.material) ? geo.groups.map(gr => [o.material[gr.materialIndex], slice(geo, gr.start, gr.count)]) : [[o.material, geo]];
      for (const [mat, part] of parts) {
        if (!mat || !part) continue;
        const key = mat.uuid;
        if (!groups.has(key)) groups.set(key, { mat, geos: [] });
        groups.get(key).geos.push(part);
      }
      remove.push(o);
    }
    for (const o of remove) this.scene.remove(o);
    for (const { mat, geos } of groups.values()) {
      const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
      if (!merged) continue;
      this.scene.add(new THREE.Mesh(merged, mat));
    }
  }

  initLightPool(n = 5) {
    this.pool = [];
    for (let i = 0; i < n; i++) { const p = new THREE.PointLight(0xffffff, 0, 10, 1.4); p.userData.keep = true; this.scene.add(p); this.pool.push({ light: p, v: null }); }
    this.poolT = 1;
  }
  stepLightPool(dt) {
    if (!this.pool) return;
    this.poolT += dt;
    const cam = this.game.camera.position;
    if (this.poolT > 0.25 && this.vlights) {
      this.poolT = 0;
      const ranked = this.vlights.map(v => ({ v, d: v.position.distanceToSquared(cam) / (v.intensity + 0.01) })).sort((a, b) => a.d - b.d);
      this.pool.forEach((p, i) => { const r = ranked[i]; p.v = r && r.v.position.distanceTo(cam) < r.v.distance * 2.6 ? r.v : null; });
    }
    for (const p of this.pool) {
      const v = p.v, L = p.light;
      if (!v) { L.intensity = 0; continue; }
      L.position.copy(v.position); L.color.copy(v.color); L.distance = v.distance;
      L.intensity += (v.intensity - L.intensity) * Math.min(1, dt * 8);   // fade, so swaps aren't visible
    }
  }

  /** One instanced draw call for every person's soft foot shadow. */
  initShadows() {
    const n = this.npcs.length; if (!n) return;
    const m = new THREE.InstancedMesh(new THREE.CircleGeometry(0.32, 14).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false }), n);
    m.userData.keep = true; m.frustumCulled = false; m.renderOrder = 1;
    this.scene.add(m); this.shadowMesh = m; this._sm = new THREE.Matrix4(); this._sp = new THREE.Vector3(); this._ss = new THREE.Vector3(); this._sq = new THREE.Quaternion();
  }
  stepShadows() {
    const m = this.shadowMesh; if (!m) return;
    this.npcs.forEach((n, i) => {
      const g = n.group, s = g.userData.cutout ? g.userData.cutout.scale : 1, on = g.visible && !n.far;
      this._sp.set(g.position.x, g.position.y + 0.014, g.position.z);
      this._ss.set(on ? s : 0, 1, on ? s * 0.6 : 0);
      m.setMatrixAt(i, this._sm.compose(this._sp, this._sq, this._ss));
    });
    m.instanceMatrix.needsUpdate = true;
  }

  /** Dark soft strip on the ground along a wall foot (cheap ambient occlusion). */
  aoStrip(x0, z0, x1, z1, width = 1.1, y = 0.02) {
    if (!this._aoMat) {
      const cv = document.createElement('canvas'); cv.width = 4; cv.height = 64;
      const c = cv.getContext('2d'), g = c.createLinearGradient(0, 0, 0, 64); g.addColorStop(0, 'rgba(0,0,0,.55)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = g; c.fillRect(0, 0, 4, 64);
      const t = new THREE.CanvasTexture(cv);
      this._aoMat = new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false });
      this._aoMat.userData.mergeTransparent = true;
    }
    const len = Math.hypot(x1 - x0, z1 - z0); if (len < 0.1) return;
    const geo = new THREE.PlaneGeometry(len, width); geo.translate(0, -width / 2, 0);
    const m = new THREE.Mesh(geo, this._aoMat);
    m.rotation.order = 'YXZ'; m.rotation.x = -Math.PI / 2; m.rotation.y = -Math.atan2(z1 - z0, x1 - x0);
    m.position.set((x0 + x1) / 2, y, (z0 + z1) / 2);
    this.scene.add(m);
    return m;
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

  /**
   * A light source. Lamps are VIRTUAL: the zone keeps a small fixed pool of real
   * point lights and gives them to the lamps nearest the player. Every material
   * then shades with the same small number of lights, which keeps the frame rate
   * steady on Chromebooks no matter how many lamps a street has.
   * The returned object has .intensity, .color and .position like a real light.
   */
  lamp(x, y, z, color = 0xffc070, intensity = 6, dist = 12) {
    const l = { position: new THREE.Vector3(x, y, z), color: new THREE.Color(color), intensity, distance: dist, virtual: true };
    (this.vlights = this.vlights || []).push(l);
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

  /**
   * A building block from x0..x1, z0..z1, height h. `fronts` maps a side
   * ('n' = -z face, 's' = +z, 'e' = +x, 'w' = -x) to a facade material spec
   * [key, spec]; the facade repeats every `lot` meters (25-ft lots = 7.6 m).
   */
  building(x0, x1, z0, z1, h, fronts = {}, side = null, { lot = 7.6, collide = true } = {}) {
    const w = x1 - x0, d = z1 - z0;
    const sideMat = toMat(side || ['wall_brick_side', { type: 'brick', color: '#6e3426' }, { repeat: [Math.max(1, w / 6), h / 6] }]);
    const face = (k, len) => {
      if (!fronts[k]) return sideMat;
      const [key, spec] = fronts[k];
      return material(key, spec, { repeat: [Math.max(1, Math.round(len / lot)), 1] });
    };
    // BoxGeometry face order: +x, -x, +y, -y, +z, -z
    const mats = [face('e', d), face('w', d), colorMat('#2e2a26'), sideMat, face('s', w), face('n', w)];
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
    m.position.set((x0 + x1) / 2, h / 2, (z0 + z1) / 2);
    this.scene.add(m);
    if (collide) this.colliders.push({ minX: x0, maxX: x1, minZ: z0, maxZ: z1 });
    if (!this.noAO) { this.aoStrip(x1, z0, x0, z0); this.aoStrip(x0, z1, x1, z1); this.aoStrip(x0, z0, x0, z1); this.aoStrip(x1, z1, x1, z0); }
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

  /** A hidden curiosity (js/data/curiosities.js): a small brass glint you notice only when close. */
  curio(id, x, z, y = 0.8) {
    if (state.curios.includes(id)) return;
    if (!Zone.glint) {
      const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d');
      const gr = g.createRadialGradient(32, 32, 1, 32, 32, 30); gr.addColorStop(0, 'rgba(255,244,190,1)'); gr.addColorStop(0.25, 'rgba(240,200,90,.55)'); gr.addColorStop(1, 'rgba(240,200,90,0)');
      g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
      g.strokeStyle = 'rgba(255,250,220,.95)'; g.lineWidth = 2; g.beginPath(); g.moveTo(32, 3); g.lineTo(32, 61); g.moveTo(3, 32); g.lineTo(61, 32); g.stroke();
      Zone.glint = new THREE.CanvasTexture(c); Zone.glint.colorSpace = THREE.SRGBColorSpace;
    }
    const spr = new THREE.Sprite(new THREE.SpriteMaterial({ map: Zone.glint, transparent: true, depthWrite: false }));
    spr.position.set(x, y, z); this.scene.add(spr);
    const it = this.interact({ x, y, z, r: 2.0, prompt: 'Look closer', action: () => { spr.visible = false; it.hidden = true; this.game.findCurio(id); } });
    const ph = x * 1.3 + z;
    this.updaters.push((dt, t) => {
      if (it.hidden) return;
      const pp = this.game.controls.pos, d = Math.hypot(pp.x - x, pp.z - z);
      spr.visible = d < 15;
      const k = 0.26 + Math.abs(Math.sin(t * 2.2 + ph)) * 0.2 + (d < 4 ? 0.1 : 0);
      spr.scale.set(k, k, 1); spr.material.rotation = t * 0.6;
    });
  }

  /** Something the camera can photograph. */
  target(subject, x, y, z, maxDist = 10) {
    const t = { subject, pos: new THREE.Vector3(x, y, z), maxDist };
    this.targets.push(t);
    return t;
  }

  /** A person: an animated 2D cutout using assets/art/portrait_<id>.png. */
  person(id, x, z, ry = 0, { talk = id, photo = id, prompt = null, scale = 1, seated = false, y = 0 } = {}) {
    const c = CHARACTERS[id] || {};
    const g = makeCutout(id, c, scale);
    g.position.set(x, y, z);
    this.scene.add(g);
    const height = (c.height || 1.7) * scale;
    const npc = { id, group: g, height, talkTree: talk, speed: 1.25 };
    this.npcs.push(npc);
    if (seated) this.box(x - Math.sin(ry) * 0.25, y, z - Math.cos(ry) * 0.25, 0.45, 0.45, 0.45, '#4a3420', { collide: false });
    if (!y) { npc.col = { minX: x - 0.22, maxX: x + 0.22, minZ: z - 0.22, maxZ: z + 0.22 }; this.colliders.push(npc.col); }   // slim, so people never wall off a doorway or a queue
    if (talk) npc.it = this.interact({ x, y: y + height * 0.8, z, r: 2.4, prompt: prompt || `Talk to ${c.name || id}`, action: () => this.game.talk(npc.talkTree) });
    if (photo) npc.tg = this.target(photo, x, y + height * 0.7, z, 9);
    return npc;
  }

  /** Send a person walking along [x, z] points. Their talk prompt, photo target and collider travel with them. */
  walkTo(npc, pts, onDone = null, speed = null) {
    if (speed) npc.speed = speed;
    npc.goto = { pts, i: 0, cb: onDone };
  }
  /** Put a person somewhere at once (used when a scene is restored from a save). */
  place(npc, x, z) { npc.group.position.x = x; npc.group.position.z = z; npc.goto = null; this.syncNpc(npc); }
  syncNpc(n) {
    const p = n.group.position;
    if (n.it) { n.it.pos.x = p.x; n.it.pos.z = p.z; }
    if (n.tg) { n.tg.pos.x = p.x; n.tg.pos.z = p.z; }
    if (n.col) { n.col.minX = p.x - 0.22; n.col.maxX = p.x + 0.22; n.col.minZ = p.z - 0.22; n.col.maxZ = p.z + 0.22; }
  }
  stepGoto(n, dt) {
    const g = n.goto, p = n.group.position, [tx, tz] = g.pts[g.i];
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.12) {
      if (++g.i >= g.pts.length) { n.goto = null; this.syncNpc(n); g.cb && g.cb(); }
      return;
    }
    const step = Math.min(d, n.speed * dt);
    p.x += dx / d * step; p.z += dz / d * step; n.vx = dx / d; n.vz = dz / d;
    if (n.col) { n.col.minX = 1e9; n.col.maxX = 1e9; }   // no bumping into people while they walk
    if (n.it) { n.it.pos.x = p.x; n.it.pos.z = p.z; }
    if (n.tg) { n.tg.pos.x = p.x; n.tg.pos.z = p.z; }
  }

  /**
   * A person who walks back and forth along a path of [x, z] points.
   * Uses crowd art unless `id` names a character. They stop for the player.
   */
  walker(n, path, { speed = 1.1, scale = 1, id = null, loop = false } = {}) {
    const i = n % CROWD.length;
    const c = id ? (CHARACTERS[id] || CROWD[i]) : CROWD[i];
    const g = makeCutout(id || 'crowd' + i, c, scale);
    const start = Math.floor(this.rand2() * path.length) % path.length;
    g.position.set(path[start][0], 0, path[start][1]);
    this.scene.add(g);
    const npc = { id: id || 'crowd' + i, group: g, path, seg: start, dir: 1, speed: speed * (0.85 + this.rand2() * 0.3), loop, vx: 0, vz: 0 };
    this.npcs.push(npc);
    return npc;
  }
  rand2() { this._r2 = ((this._r2 || 12345) * 1103515245 + 12345) & 0x7fffffff; return this._r2 / 0x7fffffff; }

  stepWalker(n, dt, pp) {
    const p = n.group.position;
    let next = n.seg + n.dir;
    if (next < 0 || next >= n.path.length) {
      if (n.loop) next = (next + n.path.length) % n.path.length;
      else { n.dir = -n.dir; next = n.seg + n.dir; }
    }
    const [tx, tz] = n.path[next];
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.15) { n.seg = next; return; }
    // wait politely if the player is right in front
    const px = pp.x - p.x, pz = pp.z - p.z, pd = Math.hypot(px, pz);
    n.paused = pd < 1.3 && (px * dx + pz * dz) > 0;
    if (n.paused) return;
    const step = Math.min(d, n.speed * dt);
    p.x += dx / d * step; p.z += dz / d * step;
    n.vx = dx / d; n.vz = dz / d;
  }

  /** Drive a vehicle group around a closed loop of [x, z] points. It waits if the player is in the way. */
  mover(group, path, speed = 2.4) {
    (this.movers = this.movers || []).push({ group, path, seg: 0, speed, t: 0 });
    group.position.set(path[0][0], 0, path[0][1]);
    return group;
  }
  stepMover(m, dt, pp) {
    const p = m.group.position, next = (m.seg + 1) % m.path.length;
    const [tx, tz] = m.path[next];
    const dx = tx - p.x, dz = tz - p.z, d = Math.hypot(dx, dz);
    if (d < 0.2) { m.seg = next; return; }
    const ux = dx / d, uz = dz / d;
    const ax = (pp.x - p.x) * ux + (pp.z - p.z) * uz, lat = Math.abs((pp.x - p.x) * uz - (pp.z - p.z) * ux);
    m.stopped = ax > -2 && ax < 9 && lat < 1.9;
    if (m.stopped) return;
    const step = Math.min(d, m.speed * dt);
    p.x += ux * step; p.z += uz * step; m.t += dt;
    let diff = Math.atan2(-ux, -uz) - m.group.rotation.y; diff = Math.atan2(Math.sin(diff), Math.cos(diff));
    m.group.rotation.y += diff * Math.min(1, dt * 3);
    for (const leg of m.group.userData.legs || []) leg.rotation.x = Math.sin(m.t * 8 + leg.userData.ph) * 0.45;
    for (const wh of m.group.userData.wheels || []) wh.rotation.x -= step / 0.45;
  }

  /** A horse-drawn delivery wagon (front faces -z). */
  wagon(color = '#5a4630', load = '#8a7a5a') {
    const g = new THREE.Group(); const legs = [], wheels = [];
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.25, 3.4), colorMat(color)); bed.position.y = 0.95; g.add(bed);
    for (const sx of [-1, 1]) { const side = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.5, 3.4), colorMat(color)); side.position.set(sx * 0.8, 1.3, 0); g.add(side); }
    for (let i = 0; i < 3; i++) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.8, 8), colorMat(load)); b.position.set((i % 2 ? 0.35 : -0.35), 1.5, 0.3 + i * 0.75 - 0.5); g.add(b); }
    for (const wz of [-1.2, 1.2]) for (const sx of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.08, 10), colorMat('#2a1e14')); wh.rotation.z = Math.PI / 2; const h = new THREE.Group(); h.add(wh); h.position.set(sx * 0.88, 0.45, wz); g.add(h); wheels.push(h); }
    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.5, 0.5), colorMat('#3a2a1c')); seat.position.set(0, 1.45, -1.5); g.add(seat);
    const driver = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.8, 0.35), colorMat('#2e2a28')); driver.position.set(0, 2.1, -1.5); g.add(driver);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), colorMat('#d9b08c')); head.position.set(0, 2.65, -1.5); g.add(head);
    const horse = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.75, 1.8), colorMat('#4a3020')); body.position.y = 1.3; horse.add(body);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.85, 0.42), colorMat('#4a3020')); neck.position.set(0, 1.8, -1.0); neck.rotation.x = -0.5; horse.add(neck);
    const hd = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.62), colorMat('#3a2416')); hd.position.set(0, 2.1, -1.42); horse.add(hd);
    for (const lx of [-0.2, 0.2]) for (const lz of [-0.7, 0.7]) { const leg = new THREE.Group(); const l = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.95, 0.13), colorMat('#2e1c10')); l.position.y = -0.47; leg.add(l); leg.position.set(lx, 0.95, lz); leg.userData.ph = (lx > 0 ? 0 : Math.PI) + (lz > 0 ? 1.5 : 0); horse.add(leg); legs.push(leg); }
    horse.position.z = -3.6; g.add(horse);
    g.userData.legs = legs; g.userData.wheels = wheels;
    this.scene.add(g);
    return g;
  }

  /**
   * Wraparound skyline: a huge cylinder that follows the camera, wearing the
   * art `skyline_<key>` (a wide image, mirrored so it tiles seamlessly).
   */
  skyline(key, spec = {}) {
    const R = 2300, tiles = 4, tileW = 2 * Math.PI * R / tiles, H = tileW * 9 / 16;
    const tex = texture('skyline_' + key, { type: 'skyline', w: 1024, h: 576, ...spec }).clone();
    tex.wrapS = THREE.MirroredRepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.repeat.set(tiles, 1); tex.needsUpdate = true;
    const artKey = 'skyline_' + key;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, 48, 1, true), new THREE.MeshBasicMaterial({ map: tex, side: THREE.BackSide, fog: false, depthWrite: false, depthTest: false }));
    m.renderOrder = -10; m.frustumCulled = false; m.userData.keep = true;
    m.position.y = H * 0.2;         // horizon line (30% up the image) sits at eye level
    this.scene.add(m);
    this.scene.background = new THREE.Color(spec.top || '#8fa0ae');
    this.updaters.push(() => {
      const c = this.game.camera.position; m.position.set(c.x, c.y + H * 0.2, c.z);
      const real = texture(artKey).image; if (tex.image !== real) { tex.dispose(); tex.image = real; tex.needsUpdate = true; }
    });
    return m;
  }

  /** Background person (no dialogue). Art: portrait_crowd<N>.png */
  crowd(n, x, z, ry = 0, { scale = 1, y = 0, art = null } = {}) {
    const i = n % CROWD.length;
    const g = makeCutout(art || 'crowd' + i, CROWD[i], scale);
    g.position.set(x, y, z);
    this.scene.add(g);
    this.npcs.push({ id: 'crowd' + i, group: g });
    if (!y) this.colliders.push({ minX: x - 0.2, maxX: x + 0.2, minZ: z - 0.2, maxZ: z + 0.2 });
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

  /** Straight wall between two points (any angle), with block colliders along it. */
  wallLine(x1, z1, x2, z2, h, mat, t = 0.4, y = 0) {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const m = new THREE.Mesh(new THREE.BoxGeometry(len, h, t), toMat(mat));
    m.position.set((x1 + x2) / 2, y + h / 2, (z1 + z2) / 2);
    m.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    this.scene.add(m);
    const cols = [];
    if (y < 1.5) for (let d = 0; d <= len; d += 0.5) {
      const x = x1 + (x2 - x1) * d / len, z = z1 + (z2 - z1) * d / len;
      const c = { minX: x - 0.38, maxX: x + 0.38, minZ: z - 0.38, maxZ: z + 0.38 };
      this.colliders.push(c); cols.push(c);
    }
    m.userData.cols = cols;
    return m;
  }

  /** A street tree. It is late October 1888, so most leaves have turned. */
  /**
   * A long gabled wooden shed (Castle Garden's outbuildings, the landing shed, etc.).
   * Ridge runs along the longer side. wall/roof are material specs.
   */
  shed(x0, x1, z0, z1, h, { rise = 1.6, wall = ['shed_whitewash', { type: 'boards', color: '#d2cab4', n: 12, w: 512, h: 256 }], roof = '#5e5e5c', collide = true, open = false } = {}) {
    const w = x1 - x0, d = z1 - z0, alongX = w >= d, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    if (!open) this.box(cx, 0, cz, w, h, d, [wall[0], wall[1], { repeat: [Math.max(1, Math.round((alongX ? w : d) / 6)), 1] }], { collide });
    const span = alongX ? d : w, len = alongX ? w : d;
    const sh = new THREE.Shape(); sh.moveTo(-span / 2 - 0.4, 0); sh.lineTo(span / 2 + 0.4, 0); sh.lineTo(0, rise); sh.closePath();
    const g = new THREE.ExtrudeGeometry(sh, { depth: len + 0.6, bevelEnabled: false }); g.translate(0, 0, -(len + 0.6) / 2);
    const m = new THREE.Mesh(g, typeof roof === 'string' ? colorMat(roof) : material(roof[0], roof[1]));
    m.position.set(cx, h, cz); m.rotation.y = alongX ? Math.PI / 2 : 0; this.scene.add(m);
    return m;
  }

  /** Picket railing from (x0,z0) to (x1,z1). */
  picket(x0, z0, x1, z1, h = 1.05, color = '#d8d0bc', collide = true) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    const p = this.panel((x0 + x1) / 2, h / 2, (z0 + z1) / 2, L, h, ['picket_' + color.slice(1), { type: 'picket', color, n: 8, w: 256, h: 128 }, { transparent: true, repeat: [Math.max(1, Math.round(L / 1.6)), 1] }], -Math.atan2(z1 - z0, x1 - x0), true);
    if (collide) { const n = Math.max(1, Math.ceil(L / 0.5)); for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n, z = z0 + (z1 - z0) * i / n; this.colliders.push({ minX: x - 0.12, maxX: x + 0.12, minZ: z - 0.12, maxZ: z + 0.12, see: true }); } }
    return p;
  }

  /** Octagonal park pavilion (open sides, cone roof). */
  pavilion(x, z, r = 3.2, h = 2.8) {
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; this.box(x + Math.sin(a) * r, 0, z + Math.cos(a) * r, 0.16, h, 0.16, '#3a3a34'); }
    const roof = new THREE.Mesh(new THREE.ConeGeometry(r + 0.6, 1.6, 8), colorMat('#5a5048')); roof.position.set(x, h + 0.8, z); roof.rotation.y = Math.PI / 8; this.scene.add(roof);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.6, 6), colorMat('#2a2a28')); fin.position.set(x, h + 1.9, z); this.scene.add(fin);
    this.box(x, 0, z, r * 1.7, 0.08, r * 1.7, '#8a8478', { collide: false });
  }

  /** Invisible wall between two points (keeps players out of unbuilt space). */
  blockLine(x0, z0, x1, z1) {
    const L = Math.hypot(x1 - x0, z1 - z0);
    for (let d = 0; d <= L; d += 0.5) { const x = x0 + (x1 - x0) * d / L, z = z0 + (z1 - z0) * d / L; this.colliders.push({ minX: x - 0.38, maxX: x + 0.38, minZ: z - 0.38, maxZ: z + 0.38 }); }
  }

  tree(x, z, s = 1, leaf = null) {
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12 * s, 0.2 * s, 2.4 * s, 6), colorMat('#4a3828'));
    trunk.position.set(x, 1.2 * s, z); this.scene.add(trunk);
    const tones = ['#b8962e', '#c07a2a', '#8a8a34', '#a8641e', '#6f7a36'];
    const k = Math.abs(Math.round(x * 3 + z * 7)) % tones.length;
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5 * s, 1), colorMat(leaf || tones[k]));
    crown.position.set(x, 3.2 * s, z); crown.scale.set(1, 1.15, 1); crown.rotation.y = k; this.scene.add(crown);
    const low = new THREE.Mesh(new THREE.IcosahedronGeometry(1.0 * s, 0), colorMat(leaf || tones[(k + 1) % tones.length]));
    low.position.set(x + 0.7 * s, 2.6 * s, z - 0.4 * s); this.scene.add(low);
    this.colliders.push({ minX: x - 0.25, maxX: x + 0.25, minZ: z - 0.25, maxZ: z + 0.25 });
  }

  /** Small street props (all static, so they merge into a few draw calls). */
  barrel(x, z, color = '#5a4630') {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.26, 0.85, 10), colorMat(color)); b.position.set(x, 0.43, z); this.scene.add(b);
    for (const y of [0.2, 0.66]) { const h = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.04, 10), colorMat('#2a2420')); h.position.set(x, y, z); this.scene.add(h); }
    this.colliders.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, see: true });
  }
  crate(x, z, s = 0.6, color = '#7a6040') { this.box(x, 0, z, s, s * 0.8, s, ['crate_wood', { type: 'planks', color, n: 4 }]); }
  hamper(x, z) {   // lidded wicker travelling basket
    this.box(x, 0, z, 0.75, 0.45, 0.5, ['wicker', { type: 'planks', color: '#b08d57', n: 10 }]);
    this.box(x, 0.45, z, 0.8, 0.06, 0.55, '#8a6a3a', { collide: false });
  }
  bundle(x, z, color = '#7a5a6a') {   // bedding tied up in cloth
    const b = new THREE.Mesh(new THREE.SphereGeometry(0.36, 8, 6), colorMat(color)); b.scale.y = 0.7; b.position.set(x, 0.25, z); this.scene.add(b);
    const k = new THREE.Mesh(new THREE.SphereGeometry(0.09, 6, 4), colorMat(color)); k.position.set(x, 0.55, z); this.scene.add(k);
  }
  bench(x, z, ry = 0) {   // wooden slats on iron ends
    const along = Math.abs(Math.sin(ry)) > 0.7;
    this.box(x, 0.4, z, along ? 0.5 : 1.9, 0.07, along ? 1.9 : 0.5, '#5a4030', { collide: false });
    this.box(x - (along ? 0.22 * Math.sign(Math.sin(ry)) : 0), 0.47, z - (along ? 0 : 0.22 * (Math.cos(ry) > 0 ? 1 : -1)), along ? 0.06 : 1.9, 0.5, along ? 1.9 : 0.06, '#5a4030', { collide: false });
    for (const e of [-0.85, 0.85]) this.box(x + (along ? 0 : e), 0, z + (along ? e : 0), along ? 0.5 : 0.07, 0.42, along ? 0.07 : 0.5, '#1e1e1e', { collide: false });
    this.colliders.push({ minX: x - (along ? 0.3 : 1), maxX: x + (along ? 0.3 : 1), minZ: z - (along ? 1 : 0.3), maxZ: z + (along ? 1 : 0.3), see: true });
  }
  hydrant(x, z) {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, 0.62, 8), colorMat('#22302a')); b.position.set(x, 0.31, z); this.scene.add(b);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 5, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#22302a')); cap.position.set(x, 0.62, z); this.scene.add(cap);
    this.colliders.push({ minX: x - 0.15, maxX: x + 0.15, minZ: z - 0.15, maxZ: z + 0.15, see: true });
  }
  stove(x, z) {   // pot-belly stove with its pipe
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.36, 0.9, 10), colorMat('#161616')); b.position.set(x, 0.65, z); this.scene.add(b);
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.2, 10), colorMat('#101010')); base.position.set(x, 0.1, z); this.scene.add(base);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.16), colorMat('#ff8a30', { basic: true })); glow.position.set(x, 0.55, z + 0.36); this.scene.add(glow);
    this.box(x, 1.1, z, 0.14, 7, 0.14, '#161616', { collide: false });
    this.colliders.push({ minX: x - 0.42, maxX: x + 0.42, minZ: z - 0.42, maxZ: z + 0.42 });
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

// Background people (art: portrait_crowd0..7). Colors follow 1880s working dress.
const CROWD = [
  { coat: '#4a3b30', skin: '#e2bf9c', height: 1.7, hat: 'cap', anim: { idle: 'fidget' } },
  { coat: '#3b3530', skin: '#d9b08c', height: 1.6, hat: 'scarf', anim: { idle: 'breathe' } },
  { coat: '#3a3a3a', skin: '#c99a70', height: 1.72, hat: 'hat', anim: { idle: 'sway' } },
  { coat: '#4a3a2a', skin: '#ecc8ab', height: 1.58, hat: 'bonnet', anim: { idle: 'breathe', speed: 0.7 } },
  { coat: '#1e1e22', skin: '#e0bc98', height: 1.78, hat: 'bowler', anim: { idle: 'still' } },
  { coat: '#5b4a3a', skin: '#d6a982', height: 1.2, hat: 'cap', anim: { idle: 'bounce', speed: 1.3 } },
  { coat: '#45405a', skin: '#e8c4a8', height: 1.64, hat: 'none', anim: { idle: 'sway', speed: 0.8 } },
  { coat: '#4a4a46', skin: '#ddb894', height: 1.74, hat: 'cap', anim: { idle: 'rock', speed: 0.6 } },
];

// Common reusable textures
export const TEX = {
  planks: (c = '#6b4a2e') => ['planks_' + c.slice(1), { type: 'planks', color: c }],
};
export { texture };
