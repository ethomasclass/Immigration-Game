// The photographer's camera. F / right-click raises it; click takes a photo.
// The subject closest to the center of the frame becomes the photo's subject.
import * as THREE from 'three';
import { SUBJECTS } from '../data/evidence.js';
import { state, save } from '../state.js';
import { sfx } from '../engine/audio.js';

const vf = document.getElementById('viewfinder');
const vfLabel = document.getElementById('vf-label');
const flashEl = document.getElementById('flash');
const MAX_PHOTOS = 40;

export class PhotoMode {
  constructor(game) {
    this.game = game;
    this.active = false;
    this.v = new THREE.Vector3();
    this.cooldown = 0;
  }

  toggle(on = !this.active) {
    this.active = on;
    vf.classList.toggle('hidden', !on);
    document.getElementById('crosshair').classList.toggle('hidden', on);
    document.getElementById('hud-keys').classList.toggle('hidden', on);
    this.game.camera.fov = on ? 50 : 70;
    this.game.camera.updateProjectionMatrix();
    if (on) sfx('page');
  }

  /** Which subject is in frame right now? */
  findSubject() {
    const cam = this.game.camera;
    const zone = this.game.zone;
    let best = null, bestScore = Infinity;
    for (const t of zone.targets) {
      if (t.off) continue;
      const dist = cam.position.distanceTo(t.pos);
      if (dist > t.maxDist) continue;
      this.v.copy(t.pos).project(cam);
      if (this.v.z > 1) continue; // behind
      // Viewfinder is the middle ~56% x 64% of the screen.
      if (Math.abs(this.v.x) > 0.56 || Math.abs(this.v.y) > 0.64) continue;
      if (this.blocked(cam.position, t.pos, dist)) continue;
      const score = Math.hypot(this.v.x, this.v.y) + dist * 0.03;
      if (score < bestScore) { bestScore = score; best = t; }
    }
    return best;
  }

  blocked(from, to, dist) {
    // Cheap line-of-sight test against wall colliders (2D).
    const steps = Math.ceil(dist / 0.4);
    for (let i = 2; i < steps - 1; i++) {
      const f = i / steps;
      const x = from.x + (to.x - from.x) * f, z = from.z + (to.z - from.z) * f;
      for (const c of this.game.zone.colliders) {
        if (c.see) continue;
        if (c.maxX - c.minX < 0.7 && c.maxZ - c.minZ < 0.7) continue; // people, small props
        if (x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ) return true;
      }
    }
    return false;
  }

  update(dt) {
    this.cooldown -= dt;
    if (!this.active) return;
    const t = this.findSubject();
    const s = t && SUBJECTS[t.subject];
    const already = s && state.photos.some(p => p.subject === t.subject);
    vfLabel.textContent = s ? `${s.title}${already ? ' (already photographed)' : ''}` : '';
  }

  snap() {
    if (this.cooldown > 0) return;
    this.cooldown = 0.8;
    const t = this.findSubject();
    const subjectId = t ? t.subject : null;
    const s = subjectId ? SUBJECTS[subjectId] : null;

    // Render one clean frame and grab it.
    const g = this.game;
    vf.classList.add('hidden');
    g.renderer.render(g.zone.scene, g.camera);
    const img = capture(g.renderer.domElement);
    vf.classList.remove('hidden');

    flashEl.classList.add('on');
    requestAnimationFrame(() => requestAnimationFrame(() => flashEl.classList.remove('on')));
    sfx('flash'); sfx('shutter');

    const photo = {
      id: 'p' + Date.now().toString(36),
      subject: subjectId,
      title: s ? s.title : 'Untitled Plate',
      desc: s ? s.desc : 'A street scene. (Point the camera at a person or object to capture evidence.)',
      zone: g.zoneId,
      img,
      caption: '',
    };
    if (subjectId) {
      const i = state.photos.findIndex(p => p.subject === subjectId);
      if (i >= 0) { photo.caption = state.photos[i].caption; state.photos[i] = photo; g.toast(`Retook <b>${photo.title}</b>`); }
      else { state.photos.push(photo); g.toast(`Photograph: <b>${photo.title}</b><br><span class="muted">${photo.desc}</span>`); }
    } else {
      const untitled = state.photos.filter(p => !p.subject);
      if (untitled.length >= 6) state.photos.splice(state.photos.indexOf(untitled[0]), 1);
      state.photos.push(photo);
      g.toast('Photograph taken. <span class="muted">No subject in frame.</span>');
    }
    if (state.photos.length > MAX_PHOTOS) state.photos.shift();
    save();
    g.refreshObjectives();
  }
}

function capture(canvas) {
  const w = 320, h = Math.round(320 * canvas.height / canvas.width);
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.filter = 'sepia(0.85) contrast(1.1) brightness(1.4)';
  ctx.drawImage(canvas, 0, 0, w, h);
  ctx.filter = 'none';
  // vignette for an 1880s dry-plate look
  const grd = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, w * 0.65);
  grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(30,20,10,0.6)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, w, h);
  return c.toDataURL('image/jpeg', 0.72);
}
