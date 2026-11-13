// ============================================================================
// STREET LIFE: the small moving things that make a place feel inhabited.
//   cries   - overheard street cries that float above people as you pass
//   pigeons - a flock on the ground that scatters when you walk up
//   gulls   - birds circling overhead
//   smoke   - chimney and funnel smoke
//   drift   - leaves or paper scraps blowing past, wherever you stand
// Every effect is one draw call (instancing / points), so it is cheap on a Chromebook.
// ============================================================================
import * as THREE from 'three';
import { sfx } from './audio.js';

const criesEl = () => document.getElementById('cries');
const V = new THREE.Vector3(), M = new THREE.Matrix4(), Q = new THREE.Quaternion(), S = new THREE.Vector3(), E = new THREE.Euler();

function birdGeo() {
  // two swept wings meeting at the body
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0.12, -0.5, 0.06, 0.02, 0, 0, -0.14,
    0, 0, 0.12, 0, 0, -0.14, 0.5, 0.06, 0.02,
  ], 3));
  g.computeVertexNormals();
  return g;
}

function softDot(color) {
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 2, 32, 32, 30);
  gr.addColorStop(0, color); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export class Life {
  constructor(zone) {
    this.zone = zone; this.t = 0;
    this.cries = []; this.shown = []; this.cryCool = 2;
    this.flocks = []; this.gullSets = []; this.smokes = []; this.drifts = [];
  }

  // ---------------------------------------------------------------- street cries
  /** Lines are heard (shown floating over the spot) when the player comes within r meters. */
  cry(x, z, lines, { r = 10, y = 2.15 } = {}) { this.cries.push({ x, y, z, lines, r, i: Math.floor(Math.random() * lines.length), cool: Math.random() * 6 }); }

  stepCries(dt, pp, cam, playing) {
    const host = criesEl(); if (!host) return;
    for (const c of this.cries) c.cool -= dt;
    this.cryCool -= dt;
    if (playing && this.cryCool <= 0 && this.shown.length < 2) {
      let best = null, bd = 1e9;
      for (const c of this.cries) {
        if (c.cool > 0 || this.shown.some(s => s.src === c)) continue;
        const d = Math.hypot(c.x - pp.x, c.z - pp.z);
        if (d < c.r && d > 1.6 && d < bd) { bd = d; best = c; }
      }
      if (best) {
        const el = document.createElement('div'); el.className = 'cry'; el.textContent = best.lines[best.i++ % best.lines.length];
        host.appendChild(el);
        // hang the words over whoever is standing nearest the spot (walkers carry them along)
        let who = null, wd = 49;
        for (const n of this.zone.npcs) { if (n.far || !n.group.visible) continue; const p = n.group.position, d2 = (p.x - best.x) ** 2 + (p.z - best.z) ** 2; if (d2 < wd) { wd = d2; who = n.group; } }
        this.shown.push({ src: best, el, life: 3.6, who });
        best.cool = 14 + Math.random() * 10; this.cryCool = 2.2 + Math.random() * 2.5;
      }
    }
    for (let i = this.shown.length - 1; i >= 0; i--) {
      const s = this.shown[i]; s.life -= dt;
      if (s.who) V.set(s.who.position.x, s.who.position.y + 2.05 + (3.6 - s.life) * 0.05, s.who.position.z); else V.set(s.src.x, s.src.y + (3.6 - s.life) * 0.06, s.src.z);
      V.project(cam);
      const vis = playing && V.z < 1 && Math.abs(V.x) < 0.95 && Math.abs(V.y) < 0.9 && s.life > 0;
      if (s.life <= 0 || (!playing && s.life < 3)) { s.el.remove(); this.shown.splice(i, 1); continue; }
      s.el.style.opacity = vis ? Math.min(1, s.life * 2, (3.6 - s.life) * 4) : 0;
      s.el.style.transform = `translate(-50%, -100%) translate(${((V.x + 1) / 2 * innerWidth).toFixed(1)}px, ${((1 - V.y) / 2 * innerHeight).toFixed(1)}px)`;
    }
  }

  // ---------------------------------------------------------------- pigeons
  pigeons(x, z, n = 9, spread = 2.2) {
    const mesh = new THREE.InstancedMesh(birdGeo(), new THREE.MeshLambertMaterial({ color: 0x55585e, side: THREE.DoubleSide }), n);
    mesh.frustumCulled = false; mesh.userData.keep = true;
    const birds = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.28, r = Math.random() * spread;
      birds.push({ hx: x + Math.cos(a) * r, hz: z + Math.sin(a) * r, x: 0, y: 0, z: 0, ry: Math.random() * 6.28, ph: Math.random() * 6, vx: 0, vy: 0, vz: 0 });
    }
    for (const b of birds) { b.x = b.hx; b.z = b.hz; }
    this.zone.scene.add(mesh);
    this.flocks.push({ x, z, mesh, birds, state: 'ground', timer: 0 });
  }

  stepFlocks(dt, pp) {
    for (const f of this.flocks) {
      const d = Math.hypot(f.x - pp.x, f.z - pp.z);
      if (d > 70) { f.mesh.visible = false; continue; }
      f.mesh.visible = true;
      if (f.state === 'ground' && d < 4.2) {
        f.state = 'fly'; f.timer = 0; sfx('wings');
        for (const b of f.birds) {
          const a = Math.atan2(b.z - pp.z, b.x - pp.x) + (Math.random() - 0.5) * 1.2, sp = 4 + Math.random() * 3;
          b.vx = Math.cos(a) * sp; b.vz = Math.sin(a) * sp; b.vy = 3.5 + Math.random() * 2.5; b.ry = -a + Math.PI / 2;
        }
      } else if (f.state === 'fly') {
        f.timer += dt;
        if (f.timer > 16 && d > 14) { f.state = 'land'; f.timer = 0; }
      } else if (f.state === 'land') {
        f.timer += dt; if (f.timer > 3) { f.state = 'ground'; for (const b of f.birds) { b.x = b.hx; b.z = b.hz; b.y = 0; } }
      }
      f.birds.forEach((b, i) => {
        let flap = 0.32, y = 0.07, sc = 0.42;
        if (f.state === 'ground') { y = 0.07 + Math.max(0, Math.sin(this.t * 3 + b.ph)) * 0.03; if (Math.sin(this.t * 0.4 + b.ph) > 0.97) b.ry += dt * 3; }
        else if (f.state === 'fly') {
          b.x += b.vx * dt; b.z += b.vz * dt; b.y = Math.min(26, b.y + b.vy * dt);
          b.vx += Math.cos(this.t * 0.5 + b.ph) * dt * 0.8; b.vz += Math.sin(this.t * 0.5 + b.ph) * dt * 0.8;
          flap = 0.35 + Math.abs(Math.sin(this.t * 18 + b.ph)) * 0.75; y = b.y; sc = b.y > 24 ? 0.001 : 0.5;
        } else {
          const k = Math.min(1, f.timer / 3); b.x += (b.hx - b.x) * dt * 2.5; b.z += (b.hz - b.z) * dt * 2.5; b.y = (1 - k) * 6;
          flap = 0.35 + Math.abs(Math.sin(this.t * 18 + b.ph)) * 0.75; y = b.y + 0.07; sc = 0.5;
        }
        E.set(0, b.ry, 0); Q.setFromEuler(E); S.set(sc * flap, sc, sc); V.set(b.x, y, b.z);
        f.mesh.setMatrixAt(i, M.compose(V, Q, S));
      });
      f.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- gulls
  gulls(cx, cz, { n = 7, r = 26, y = 16, color = 0xe8e6e0 } = {}) {
    const mesh = new THREE.InstancedMesh(birdGeo(), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }), n);
    mesh.frustumCulled = false; mesh.userData.keep = true; this.zone.scene.add(mesh);
    const birds = []; for (let i = 0; i < n; i++) birds.push({ a: Math.random() * 6.28, r: r * (0.4 + Math.random() * 0.8), y: y + Math.random() * 10, sp: (0.12 + Math.random() * 0.1) * (i % 2 ? 1 : -1), ph: Math.random() * 6 });
    this.gullSets.push({ cx, cz, mesh, birds });
  }

  stepGulls(dt) {
    for (const g of this.gullSets) {
      g.birds.forEach((b, i) => {
        b.a += b.sp * dt;
        const x = g.cx + Math.cos(b.a) * b.r, z = g.cz + Math.sin(b.a) * b.r * 0.7, glide = Math.sin(this.t * 0.6 + b.ph) > 0.2;
        E.set(0, -b.a + (b.sp > 0 ? 0 : Math.PI), Math.sin(this.t * 0.7 + b.ph) * 0.25); Q.setFromEuler(E);
        S.set(1.5 * (glide ? 1 : 0.5 + Math.abs(Math.sin(this.t * 7 + b.ph)) * 0.6), 1.5, 1.5); V.set(x, b.y + Math.sin(this.t * 0.4 + b.ph) * 1.5, z);
        g.mesh.setMatrixAt(i, M.compose(V, Q, S));
      });
      g.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- smoke
  /** sources: [[x, y, z], ...]. One Points object for all of them. */
  smoke(sources, { color = 'rgba(70,66,62,0.55)', per = 7, rise = 1.3, size = 3.2, windX = 0.5, windZ = 0.15 } = {}) {
    const n = sources.length * per, pos = new Float32Array(n * 3), parts = [];
    for (let i = 0; i < n; i++) parts.push({ src: sources[i % sources.length], life: Math.random() });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: softDot(color), size, transparent: true, depthWrite: false, opacity: 0.55, sizeAttenuation: true }));
    pts.frustumCulled = false; pts.userData.keep = true; this.zone.scene.add(pts);
    this.smokes.push({ pts, parts, rise, windX, windZ, span: 5.5 });
  }

  stepSmoke(dt) {
    for (const s of this.smokes) {
      const a = s.pts.geometry.attributes.position;
      s.parts.forEach((p, i) => {
        p.life += dt / s.span; if (p.life > 1) p.life -= 1;
        const k = p.life, h = k * s.span * s.rise;
        a.setXYZ(i, p.src[0] + s.windX * h * (0.6 + k) + Math.sin(i * 1.7 + k * 5) * 0.25, p.src[1] + h, p.src[2] + s.windZ * h + Math.cos(i * 2.3 + k * 4) * 0.25);
      });
      a.needsUpdate = true;
    }
  }

  // ---------------------------------------------------------------- leaves / scraps drifting past the player
  drift({ n = 36, color = 'rgba(190,120,40,0.95)', size = 0.16, box = 26, top = 9, fall = 0.7, windX = 1.1, windZ = 0.3, where = null } = {}) {
    const pos = new Float32Array(n * 3), parts = [];
    for (let i = 0; i < n; i++) parts.push({ x: (Math.random() - 0.5) * box, y: Math.random() * top, z: (Math.random() - 0.5) * box, ph: Math.random() * 6 });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: softDot(color), size, transparent: true, depthWrite: false, alphaTest: 0.2, sizeAttenuation: true }));
    pts.frustumCulled = false; pts.userData.keep = true; this.zone.scene.add(pts);
    this.drifts.push({ pts, parts, box, top, fall, windX, windZ, where });
  }

  stepDrift(dt, pp) {
    for (const d of this.drifts) {
      d.pts.visible = !d.where || d.where(pp);
      if (!d.pts.visible) continue;
      const a = d.pts.geometry.attributes.position, h = d.box / 2;
      d.parts.forEach((p, i) => {
        p.x += (d.windX + Math.sin(this.t * 1.3 + p.ph) * 0.8) * dt; p.z += (d.windZ + Math.cos(this.t * 1.1 + p.ph) * 0.6) * dt; p.y -= d.fall * dt * (0.6 + 0.4 * Math.sin(p.ph));
        if (p.y < 0.03) { p.y = d.top; p.x = (Math.random() - 0.5) * d.box; p.z = (Math.random() - 0.5) * d.box; }
        if (p.x > h) p.x -= d.box; if (p.x < -h) p.x += d.box; if (p.z > h) p.z -= d.box; if (p.z < -h) p.z += d.box;
        a.setXYZ(i, pp.x + p.x, p.y, pp.z + p.z);
      });
      a.needsUpdate = true;
    }
  }

  update(dt, pp, cam, playing) {
    this.t += dt;
    this.stepCries(dt, pp, cam, playing);
    this.stepFlocks(dt, pp);
    this.stepGulls(dt);
    this.stepSmoke(dt);
    this.stepDrift(dt, pp);
  }

  dispose() { for (const s of this.shown) s.el.remove(); this.shown = []; }
}
