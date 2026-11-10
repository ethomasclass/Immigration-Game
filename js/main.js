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
import { Minimap } from './ui/minimap.js';
import { TouchControls } from './ui/touch.js';
import { richText } from './ui/text.js';
import { DOCS, CARDS } from './data/dialogue.js';
import { CHARACTERS } from './data/characters.js';
import { KEEPSAKES } from './data/keepsakes.js';
import { ShipZone } from './zones/ship.js';
import { CastleZone } from './zones/castle.js';
import { LowerEastSideZone, LowerEastSideDay2 } from './zones/les.js';
import { CityZone } from './zones/city.js';

const ZONES = { ship: ShipZone, castle: CastleZone, les: LowerEastSideZone, les2: LowerEastSideDay2, city: CityZone };
const ZONE_TITLES = { ship: 'I. Steerage', castle: 'II. Castle Garden', les: 'III. The Lower East Side', les2: 'IV. One Week Later', city: 'V. Park Row' };
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
    this.minimap = new Minimap(this);
    this.touch = new TouchControls(this);
    this.currentGoal = null;
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
      else if (z === 'wrapupB') { this.day2Defaults(); this.openWrapup('B'); }
      else if (z === 'les2') this.startDay2();
      else if (z === 'city') { this.day2Defaults(); this.goParkRow(); }
      else if (z === 'night') { this.day2Defaults(true); this.toNight(); }
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
    $('set-touch').onchange = (e) => { S.touch = e.target.value; save(); this.touch.apply(); };
    $('btn-fullscreen').onclick = () => { const d = document.documentElement; try { (d.requestFullscreen || d.webkitRequestFullscreen).call(d)?.catch?.(() => {}); screen.orientation?.lock?.('landscape').catch(() => {}); } catch {} };
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
    $('set-tts').checked = S.tts; $('set-drag').checked = S.drag; $('set-touch').value = S.touch || 'auto';
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
    // Optional tarot card art / video for this title card: assets/art/card_<key>.png, assets/video/card_<key>.mp4
    const art = $('card-art'); art.innerHTML = '';
    const img = new Image(); img.onload = () => { if (!art.firstChild) art.appendChild(img); }; img.src = `assets/art/card_${key}.png`;
    const vid = document.createElement('video'); vid.muted = true; vid.loop = true; vid.playsInline = true;
    vid.oncanplay = () => { art.innerHTML = ''; art.appendChild(vid); vid.play().catch(() => {}); }; vid.src = `assets/video/card_${key}.mp4`;
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
        this.beacon = this.makeBeacon(); this.zone.scene.add(this.beacon);
        this.showPurse();
        const sp = spawn || this.zone.spawn;
        this.controls.setPose(sp.x, sp.z, sp.yaw);
        this.controls.roll = 0; this.controls.floorY = 0;
        $('zone-name').textContent = this.zone.title || ZONE_TITLES[id];
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
    // Show ONE goal at a time: the first required goal that isn't done.
    const list = this.zone.objectives();
    const req = list.filter(o => !o.optional), leads = list.filter(o => o.optional);
    const goal = req.find(o => !o.done) || req[req.length - 1];
    const n = req.indexOf(goal) + 1;
    if (!this.currentGoal || this.currentGoal.text !== goal.text) { const el = $('goal'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
    this.currentGoal = goal;
    $('goal-label').textContent = `GOAL ${n} OF ${req.length}`;
    $('goal-text').innerHTML = goal.text;
    const found = leads.filter(o => o.done).length;
    $('goal-leads').textContent = leads.length ? `Leads to follow: ${found}/${leads.length} (${this.touch?.enabled ? 'tap the book' : 'J'} to see)` : '';
  }

  // ------------------------------------------------------------------ modes
  setMode(m) {
    this.mode = m;
    const playing = m === 'play';
    this.controls.enabled = playing;
    if (!playing) { this.controls.unlock(); if (this.photo.active) this.photo.toggle(false); }
    $('prompt').classList.add('hidden');
    if (m !== 'play') $('resume').classList.add('hidden');
    if (this.touch) this.touch.sync();
  }

  showResume() {
    // Pointer lock needs a click from the student.
    if (!state.settings.drag && !this.touch.enabled && !this.controls.locked) $('resume').classList.remove('hidden');
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

  // ---------------------------------------------------------------- Day 2 flow
  /**
   * Fill in Day 1 (and, if needed, Day 2) choices for a student whose
   * computer has no save from before. Returns the list of assumptions made.
   */
  day2Defaults(throughPark = false) {
    const f = state.flags, made = [];
    if (!f.met_moishe) {
      Object.assign(f, { met_moishe: true, gate_done: true, safe: true, novak_decided: true, sarah_kept: true, lemon: true, heard_sarah_plea: true });
      made.push('Miss Carver at the information desk helped Rivka\'s family, so they kept their savings.', 'You could not pay for Mr. Novak\'s telegram.', 'You kept your promise and did not print Sarah\'s face.');
    }
    if (throughPark && !f.endorsed) {
      Object.assign(f, { rivka_decided: true, rivka_wait: true, met_moishe2: true, gius_decided: true, gius_refuse: true, saw_fall: true, saw_aftermath: true, endorsed: true, endorse_hewitt: true });
      made.push('Rivka waited to join the union.', 'Giuseppe refused to vote under a dead man\'s name.', 'The Courier endorsed Mayor Hewitt.');
    }
    save();
    return made;
  }

  startDay2() {
    unlockAudio();
    const made = this.day2Defaults();
    const go = () => this.showCard('les2', () => this.loadZone('les2', { skipCard: true }));
    if (made.length) {
      CARDS.previously = { num: 'DAY TWO', title: 'Previously…', sub: 'This computer does not have your Day 1 game saved', text: 'The story will continue as if:\n\n• ' + made.join('\n• ') + '\n\n(To keep your own choices, play both days on the same computer and browser.)' };
      this.showCard('previously', go);
    } else go();
  }

  goParkRow() {
    state.flags.election_night = false; state.flags.in_park = false; save();
    this.loadZone('city');
  }

  toNight() {
    state.flags.election_night = true; state.flags.in_park = false; save();
    this.showCard('night', () => this.loadZone('city', { skipCard: true }));
  }

  portraitURL(who) {
    if (hasRealArt('portrait_' + who)) return artURL('portrait_' + who);
    return null;
  }
  hasPortrait(who) { return hasRealArt('portrait_' + who); }

  // ------------------------------------------------------------------ purse + keepsakes
  spend(cents, what = '') {
    state.cents = Math.max(0, state.cents - cents); save();
    this.toast(`<b>Paid ${cents}¢</b>${what ? ' ' + what : ''}. <span class="muted">Purse: $${(state.cents / 100).toFixed(2)}</span>`);
    this.showPurse(true);
  }
  keep(id) {
    const k = KEEPSAKES[id];
    if (!k || state.keeps.includes(id)) return;
    state.keeps.push(id); save(); sfx('chime');
    this.toast(`<b>Keepsake:</b> ${k.name} <span class="muted">(in your journal)</span>`, 5000);
  }
  showPurse(flash) {
    const el = $('purse'); el.textContent = `Purse $${(state.cents / 100).toFixed(2)}`;
    if (flash) { el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  }

  // ------------------------------------------------------------------ goal marker in the world
  makeBeacon() {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 26, 8, 1, true), new THREE.MeshBasicMaterial({ color: 0xf2c230, transparent: true, opacity: 0.22, depthWrite: false, fog: false }));
    beam.position.y = 13;
    const gem = new THREE.Mesh(new THREE.OctahedronGeometry(0.32), new THREE.MeshBasicMaterial({ color: 0xffd84a, fog: false }));
    gem.position.y = 2.7;
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.55, 0.75, 20), new THREE.MeshBasicMaterial({ color: 0xf2c230, transparent: true, opacity: 0.7, depthWrite: false, fog: false, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = 0.06;
    g.add(beam, gem, ring); g.userData = { gem, ring, beam, keep: true };
    g.traverse(o => { o.userData.keep = true; o.renderOrder = 5; });
    return g;
  }
  updateWaypoint(t) {
    const wp = $('waypoint'), b = this.beacon, goal = this.currentGoal;
    const on = this.mode === 'play' && goal && goal.at && !goal.done && !this.photo.active;
    if (b) b.visible = !!on;
    if (!on) { wp.classList.add('hidden'); return; }
    const c = this.controls, [gx, gz] = goal.at, fy = c.floorY > 5 ? c.floorY : 0;
    b.position.set(gx, 0, gz);
    b.userData.gem.position.y = 2.7 + Math.sin(t * 2.4) * 0.18; b.userData.gem.rotation.y = t * 1.6;
    b.userData.ring.scale.setScalar(1 + Math.sin(t * 2.4) * 0.12);
    const dist = Math.hypot(gx - c.pos.x, gz - c.pos.z);
    b.userData.beam.material.opacity = Math.min(0.22, Math.max(0, (dist - 5) / 40));
    if (dist < 3.2) { wp.classList.add('hidden'); return; }
    // screen position of the marker (pinned to the edge with an arrow when it is off screen)
    const v = this._wpv || (this._wpv = new THREE.Vector3());
    v.set(gx, fy + 2.7, gz).project(this.camera);
    const behind = v.z > 1;
    let x = (v.x * 0.5 + 0.5) * innerWidth, y = (-v.y * 0.5 + 0.5) * innerHeight;
    if (behind) { x = innerWidth - x; y = innerHeight - 60; }
    const m = 56, off = behind || x < m || x > innerWidth - m || y < m + 40 || y > innerHeight - m;
    const cx = Math.max(m, Math.min(innerWidth - m, x)), cy = Math.max(m + 40, Math.min(innerHeight - m - 30, y));
    wp.style.transform = `translate(${cx}px, ${cy}px)`;
    wp.classList.toggle('off', off);
    if (off) $('wp-arrow').style.transform = `rotate(${Math.atan2((behind ? innerHeight : y) - innerHeight / 2, x - innerWidth / 2)}rad)`;
    $('wp-dist').textContent = dist < 1000 ? `${Math.round(dist)} m` : '';
    wp.classList.remove('hidden');
  }

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
      if (flat > it.r || Math.abs(it.pos.y - cam.y) > 3.5) continue;
      const d = v.length();
      const dot = v.normalize().dot(fwd);
      if (dot < 0.8 && flat > 0.9) continue;
      const score = flat * (1.6 - dot);
      if (score < bestScore) { bestScore = score; best = it; }
    }
    return best;
  }

  // ------------------------------------------------------------------ loop
  rotateHint() {
    const show = this.touch.enabled && innerHeight > innerWidth && this.mode === 'play';
    if (show !== this._rot) {
      this._rot = show; $('rotate-hint').classList.toggle('hidden', !show);
      clearTimeout(this._rotT); if (show) this._rotT = setTimeout(() => $('rotate-hint').classList.add('hidden'), 5000);
    }
  }

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
    this.minimap.update(dt);
    this.rotateHint();
    this.updateWaypoint(this.zone.time);
    const f = this.findFocus();
    this.touch.update(f);
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
