// ============================================================================
// THE OTHER HALF: A Photographer's Passage
// Main game controller: menus, zone loading, game loop, input routing.
// ============================================================================
import * as THREE from 'three';
import { state, load, save, resetProgress } from './state.js';
import { Controls } from './engine/controls.js';
import { startAmbience, stopAmbience, setAmbienceVolume, unlockAudio, playVoice, stopVoice, sfx } from './engine/audio.js';
import { artURL, hasRealArt, texture, requested } from './engine/textures.js';
import { Dialogue } from './ui/dialogue.js';
import { PhotoMode } from './ui/photo.js';
import { Journal } from './ui/journal.js';
import { Wrapup } from './ui/wrapup.js';
import { richText } from './ui/text.js';
import { DOCS, CARDS } from './data/dialogue.js';
import { CHARACTERS } from './data/characters.js';
import { ShipZone } from './zones/ship.js';
import { CastleZone } from './zones/castle.js';
import { LowerEastSideZone } from './zones/les.js';
import { CityZone } from './zones/city.js';

const ZONES = { ship: ShipZone, castle: CastleZone, les: LowerEastSideZone, city: CityZone };
const ZONE_TITLES = { ship: 'I. Steerage', castle: 'II. Castle Garden', les: 'III. The Lower East Side', city: 'IV. The City' };
const $ = (id) => document.getElementById(id);

class Game {
  constructor() {
    this.canvas = $('view');
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, powerPreference: 'low-power' });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.08, 2500);
    this.controls = new Controls(this.canvas, this.camera);
    this.dialogue = new Dialogue(this);
    this.photo = new PhotoMode(this);
    this.journal = new Journal(this);
    this.wrapup = new Wrapup(this);
    this.mode = 'menu';
    this.zone = null;
    this.zoneId = null;
    this.focus = null;
    this.clock = new THREE.Clock();

    this.controls.onClick = () => this.onClick();
    this.controls.onRightClick = () => { if (this.mode === 'play') this.photo.toggle(); };
    this.controls.onLockChange = (locked, failed) => this.onLockChange(locked, failed);

    addEventListener('resize', () => this.resize());
    addEventListener('keydown', (e) => this.onKey(e));
    this.setupMenus();
    this.resize();
    this.loop();
  }

  // ------------------------------------------------------------------ menus
  setupMenus() {
    const hasSave = load();
    $('btn-continue').classList.toggle('hidden', !hasSave);
    const showSub = (id) => ['menu-main', 'menu-chapters', 'menu-settings'].forEach(s => $(s).classList.toggle('hidden', s !== id));
    $('btn-new').onclick = () => {
      unlockAudio();
      if (state.zone && !confirm('Start over? Your saved photos and notes will be erased.')) return;
      resetProgress();
      this.showCard('intro', () => this.loadZone('ship'));
    };
    $('btn-continue').onclick = () => { unlockAudio(); state.zone === 'wrapupA' || state.zone === 'wrapupB' ? this.openWrapup(state.zone.slice(-1)) : this.loadZone(state.zone); };
    $('btn-chapters').onclick = () => showSub('menu-chapters');
    $('btn-settings').onclick = () => { showSub('menu-settings'); this.syncSettings(); };
    document.querySelectorAll('[data-back]').forEach(b => b.onclick = () => showSub('menu-main'));
    document.querySelectorAll('#menu-chapters [data-zone]').forEach(b => b.onclick = () => {
      unlockAudio();
      const z = b.dataset.zone;
      if (z === 'wrapup') this.openWrapup('A');
      else this.loadZone(z);
    });
    // settings
    const S = state.settings;
    $('set-sens').oninput = (e) => { S.sens = +e.target.value; save(); };
    $('set-quality').onchange = (e) => { S.quality = +e.target.value; this.resize(); save(); };
    $('set-vo').oninput = (e) => { S.vo = +e.target.value; save(); };
    $('set-amb').oninput = (e) => { S.amb = +e.target.value; setAmbienceVolume(S.amb); save(); };
    $('set-tts').onchange = (e) => { S.tts = e.target.checked; save(); };
    $('set-drag').onchange = (e) => { S.drag = e.target.checked; save(); };
    $('btn-reset').onclick = () => { if (confirm('Erase all saved photos, notes, and answers?')) { resetProgress(); $('btn-continue').classList.add('hidden'); } };
    // pause
    $('btn-resume').onclick = () => this.resume();
    $('btn-pause-journal').onclick = () => { $('pause').classList.add('hidden'); this.openJournal(); };
    $('btn-pause-menu').onclick = () => { $('pause').classList.add('hidden'); this.showMenu(); };
    $('doc-close').onclick = () => this.closeDoc();
    $('resume').addEventListener('click', () => this.resume());
    $('card-go').onclick = () => { const cb = this.cardCb; this.cardCb = null; stopVoice(); $('card').classList.add('hidden'); cb && cb(); };
    this.syncSettings();
  }

  syncSettings() {
    const S = state.settings;
    $('set-sens').value = S.sens; $('set-quality').value = String(S.quality);
    $('set-vo').value = S.vo; $('set-amb').value = S.amb;
    $('set-tts').checked = S.tts; $('set-drag').checked = S.drag;
  }

  showMenu() {
    this.setMode('menu');
    stopAmbience();
    $('hud').classList.add('hidden');
    $('btn-continue').classList.toggle('hidden', !state.zone);
    $('menu').classList.remove('hidden');
  }

  showCard(key, cb) {
    const c = CARDS[key];
    this.setMode('card');
    $('menu').classList.add('hidden');
    $('card-num').textContent = c.num;
    $('card-title').textContent = c.title;
    $('card-sub').textContent = c.sub;
    $('card-text').textContent = c.text;
    $('card').classList.remove('hidden');
    this.cardCb = cb;
    playVoice(`card.${key}`, c.text, 'narrator');
  }

  // ------------------------------------------------------------------ zones
  loadZone(id, { skipCard = false, spawn = null } = {}) {
    const go = () => {
      $('loading').classList.remove('hidden');
      setTimeout(() => {
        this.disposeZone();
        const Z = ZONES[id];
        this.zone = new Z(this);
        this.zoneId = id;
        state.zone = id; save();
        this.zone.build();
        this.zone.optimize();
        const sp = spawn || this.zone.spawn;
        this.controls.setPose(sp.x, sp.z, sp.yaw);
        this.controls.roll = 0;
        $('zone-name').textContent = ZONE_TITLES[id];
        $('loading').classList.add('hidden');
        $('menu').classList.add('hidden');
        $('card').classList.add('hidden');
        $('hud').classList.remove('hidden');
        startAmbience(id);
        this.refreshObjectives();
        this.updateFaces();
        this.setMode('play');
        this.showResume();
      }, 30);
    };
    if (skipCard || !CARDS[id]) go(); else this.showCard(id, go);
  }

  disposeZone() {
    if (!this.zone) return;
    this.zone.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    this.zone = null;
  }

  updateFaces() {}

  refreshObjectives() {
    if (!this.zone) return;
    const list = this.zone.objectives();
    $('objectives').innerHTML = list.map(o => `<li class="${o.done ? 'done' : ''}">${o.text}</li>`).join('');
  }

  // ------------------------------------------------------------------ modes
  setMode(m) {
    this.mode = m;
    const playing = m === 'play';
    this.controls.enabled = playing;
    if (!playing) { this.controls.unlock(); if (this.photo.active) this.photo.toggle(false); }
    $('prompt').classList.add('hidden');
    if (m !== 'play') $('resume').classList.add('hidden');
  }

  showResume() {
    // Pointer lock needs a click from the student.
    if (!state.settings.drag && !this.controls.locked) $('resume').classList.remove('hidden');
  }

  resume() {
    $('pause').classList.add('hidden');
    $('resume').classList.add('hidden');
    this.setMode('play');
    this.controls.lock();
  }

  onLockChange(locked, failed) {
    if (failed) { this.toast('Mouse lock unavailable: drag with the mouse to look around.'); $('resume').classList.add('hidden'); return; }
    if (locked) $('resume').classList.add('hidden');
    else if (this.mode === 'play' && !state.settings.drag) {
      // Esc pressed by the browser: show the pause menu.
      this.setMode('pause');
      $('pause').classList.remove('hidden');
    }
  }

  // ------------------------------------------------------------------ actions
  talk(treeId, onEnd) {
    this.setMode('dialogue');
    this.dialogue.start(treeId, () => {
      this.refreshObjectives();
      if (this.mode === 'dialogue') { this.setMode('play'); this.showResume(); }
      onEnd && onEnd();
    });
  }

  readDoc(key, onClose) {
    const d = DOCS[key];
    if (!d) return;
    const prev = this.mode;
    this.setMode('doc');
    this.docCb = onClose;
    this.docPrev = prev;
    this.docOpenedAt = performance.now();
    state.flags['read_' + key] = true; save();
    $('doc-title').textContent = d.title;
    $('doc-text').innerHTML = richText(d.text) + (d.source ? `<span class="source">${d.source}</span>` : '');
    const art = hasRealArt('doc_' + key) ? artURL('doc_' + key) : null;
    $('doc-art').innerHTML = art ? `<img src="${art}" alt="">` : '';
    if (!art) { texture('doc_' + key, { type: 'card', title: d.title }); setTimeout(() => { if (hasRealArt('doc_' + key) && this.mode === 'doc') $('doc-art').innerHTML = `<img src="${artURL('doc_' + key)}" alt="">`; }, 400); }
    $('document').classList.remove('hidden');
    sfx('page');
    playVoice(`doc.${key}`, d.text, 'narrator');
  }

  closeDoc() {
    stopVoice();
    $('document').classList.add('hidden');
    const cb = this.docCb; this.docCb = null;
    if (cb) { this.mode = 'dialogue'; cb(); return; }
    this.setMode('play'); this.showResume();
    this.refreshObjectives();
  }

  openJournal() { this.setMode('journal'); this.journal.open(); sfx('page'); }
  closeJournal() { this.journal.close(); this.setMode('play'); this.showResume(); }

  openWrapup(part) {
    stopAmbience();
    state.zone = 'wrapup' + part; save();
    this.setMode('wrapup');
    $('menu').classList.add('hidden');
    $('hud').classList.add('hidden');
    this.wrapup.open(part);
  }
  resumeFromWrapup() {
    const z = this.wrapup.part === 'A' ? 'les' : 'city';
    this.loadZone(z, { skipCard: true });
  }

  portraitURL(who) {
    if (hasRealArt('portrait_' + who)) return artURL('portrait_' + who);
    return null;
  }
  hasPortrait(who) { return hasRealArt('portrait_' + who); }

  toast(html, ms = 4200) {
    const t = document.createElement('div');
    t.className = 'toast'; t.innerHTML = html;
    $('toasts').appendChild(t);
    setTimeout(() => t.remove(), ms);
  }

  // ------------------------------------------------------------------ input
  onKey(e) {
    if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT') return;
    const k = e.code;
    if (this.mode === 'play') {
      if (k === 'KeyE') this.useFocus();
      else if (k === 'KeyF' || k === 'KeyC') this.photo.toggle();
      else if (k === 'KeyJ' || k === 'Tab') { e.preventDefault(); this.openJournal(); }
      else if (k === 'KeyM') { this.journal.tab = 'map'; this.openJournal(); }
      else if (k === 'Escape' && state.settings.drag) { this.setMode('pause'); $('pause').classList.remove('hidden'); }
      else if (k === 'Space' && this.photo.active) this.photo.snap();
    } else if (this.mode === 'journal') {
      if (k === 'KeyJ' || k === 'KeyM' || k === 'Escape' || k === 'Tab') { e.preventDefault(); this.closeJournal(); }
    } else if (this.mode === 'doc') {
      if ((k === 'KeyE' || k === 'Escape' || k === 'Space') && performance.now() - this.docOpenedAt > 300) { e.preventDefault(); this.closeDoc(); }
    } else if (this.mode === 'pause') {
      if (k === 'Escape') this.resume();
    }
  }

  onClick() {
    if (this.mode !== 'play') return;
    if (this.photo.active) this.photo.snap();
    else this.useFocus();
  }

  useFocus() {
    const f = this.focus;
    if (!f) return;
    if (f.cond && !f.cond()) { this.toast(f.lockedMsg || 'Not yet. Check your objectives.'); return; }
    if (f.once) f.used = true;
    f.action();
  }

  findFocus() {
    if (!this.zone || this.mode !== 'play' || this.photo.active) return null;
    const cam = this.camera.position;
    const fwd = new THREE.Vector3(); this.camera.getWorldDirection(fwd);
    let best = null, bestScore = Infinity;
    const v = new THREE.Vector3();
    for (const it of this.zone.interactables) {
      if (it.used || it.hidden) continue;
      v.copy(it.pos).sub(cam);
      const flat = Math.hypot(v.x, v.z);
      if (flat > it.r) continue;
      const d = v.length();
      const dot = v.normalize().dot(fwd);
      if (dot < 0.8 && flat > 0.9) continue;
      const score = flat * (1.6 - dot);
      if (score < bestScore) { bestScore = score; best = it; }
    }
    return best;
  }

  // ------------------------------------------------------------------ loop
  resize() {
    const q = state.settings.quality || 0.8;
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1) * q);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const dt = Math.min(0.05, this.clock.getDelta());
    if (!this.zone || this.mode === 'menu' || this.mode === 'wrapup') return;
    this.zone.update(dt);
    this.controls.update(dt, this.zone.colliders, this.zone.bounds);
    this.photo.update(dt);
    const f = this.findFocus();
    if (f !== this.focus) {
      this.focus = f;
      const p = $('prompt');
      if (f) {
        const locked = f.cond && !f.cond();
        p.innerHTML = `<b>E</b> ${f.prompt}${locked ? ' <span class="muted">(not yet)</span>' : ''}`;
        p.classList.remove('hidden');
      } else p.classList.add('hidden');
    }
    this.faceTimer = (this.faceTimer || 0) + dt;
    if (this.faceTimer > 1.5) { this.faceTimer = 0; this.updateFaces(); }
    this.renderer.render(this.zone.scene, this.camera);
  }
}

window.game = new Game();
// For the art guide: list every art key the game has asked for.
window.listArtKeys = () => [...requested.keys()].sort();
