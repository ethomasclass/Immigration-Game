// ============================================================================
// THE OTHER HALF: A Photographer's Passage
// Main game controller: menus, zone loading, game loop, input routing.
// ============================================================================
import * as THREE from 'three';
import { state, load, save, resetProgress } from './state.js';
import { Controls } from './engine/controls.js';
import { startAmbience, stopAmbience, setAmbienceVolume, unlockAudio, playVoice, stopVoice, sfx, ambientTick } from './engine/audio.js';
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
import { placeholderURL } from './engine/cutout.js';
import { KEEPSAKES } from './data/keepsakes.js';
import { CURIOS, curiosIn } from './data/curiosities.js';
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
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true, powerPreference: 'default' });
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
    // Automatic quality: start a little below full resolution and adapt to the frame rate.
    this.dyn = navigator.webdriver ? 1 : 0.9; this.fpsT = 0; this.fpsN = 0;
    this.resize();
    this.loop();
    setTimeout(() => this.loadBackdrop(), 60);
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
        this.zone.initLightPool(5);
        this.zone.initShadows();
        // ask early for the expression close-ups of everyone in this chapter, so they are ready when spoken to
        for (const n of this.zone.npcs) if (CHARACTERS[n.id]) for (const m of ['up', 'down']) texture(`portrait_${n.id}_${m}`, { type: 'solid', color: '#000000', w: 4, h: 4 });
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

  /** The title screen shows the harbor: Castle Garden from the water, with the camera drifting slowly. */
  loadBackdrop() {
    if (this.zone || this.mode !== 'menu') return;
    try {
      const z = new ZONES.castle(this);
      z.build(); z.optimize(); z.initLightPool(5); z.initShadows();
      this.zone = z; this.zoneId = null; this.isBackdrop = true;
      $('menu').classList.add('live');
    } catch (e) { console.warn('backdrop failed', e); this.zone = null; }
  }

  disposeZone() {
    this.isBackdrop = false; $('menu').classList.remove('live');
    if (!this.zone) return;
    if (this.zone._life) this.zone._life.dispose();
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
    if (!this.currentGoal || this.currentGoal.text !== goal.text) {
      const el = $('goal'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
      // the goal you were on is now done: say so
      const prev = this.currentGoal && req.find(o => o.text === this.currentGoal.text);
      if (prev && prev.done && this.mode !== 'menu') { sfx('success'); this.banner('Goal complete', `Next: ${goal.text}`); }
    }
    this.currentGoal = goal;
    $('goal-label').textContent = `GOAL ${n} OF ${req.length}`;
    $('goal-text').innerHTML = goal.text;
    const found = leads.filter(o => o.done).length;
    const cur = curiosIn(this.zoneId), curGot = cur.filter(k => state.curios.includes(k)).length;
    $('goal-leads').textContent = (leads.length ? `Leads: ${found}/${leads.length} (${this.touch?.enabled ? 'tap the book' : 'J'} to see)` : '') + (cur.length ? `${leads.length ? ' · ' : ''}Curiosities: ${curGot}/${cur.length}` : '');
    // a lead was just followed
    const lk = this.zoneId + ':' + found;
    if (this._leadZone === this.zoneId && found > (this._leadN || 0)) { sfx('chime'); this.toast(`<b>Lead followed</b> <span class="muted">(${found} of ${leads.length})</span>`, 3000); }
    this._leadZone = this.zoneId; this._leadN = found;
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

  /** Art for the dialogue box. mood: 'up' | 'down' picks an expression close-up when one exists. */
  portraitURL(who, mood = null) {
    if (mood && CHARACTERS[who]) {
      const k = `portrait_${who}_${mood}`;
      texture(k, { type: 'solid', color: '#000000', w: 4, h: 4 });      // asks for the file (once)
      if (hasRealArt(k)) return { url: artURL(k), bust: true };
    }
    if (hasRealArt('portrait_' + who)) return { url: artURL('portrait_' + who), bust: false };
    const c = CHARACTERS[who];
    return c ? { url: placeholderURL(who, c), bust: false } : null;
  }
  hasPortrait(who) { return hasRealArt('portrait_' + who); }

  // ------------------------------------------------------------------ purse + keepsakes
  spend(cents, what = '') {
    state.cents = Math.max(0, state.cents - cents); save();
    this.toast(`<b>Paid ${cents}¢</b>${what ? ' ' + what : ''}. <span class="muted">Purse: $${(state.cents / 100).toFixed(2)}</span>`);
    this.showPurse(true);
  }
  /** A hidden curiosity was found: show its card and count it. */
  findCurio(id) {
    const c = CURIOS[id];
    if (!c || state.curios.includes(id)) return;
    state.curios.push(id); save(); sfx('find');
    const all = curiosIn(this.zoneId), got = all.filter(k => state.curios.includes(k)).length;
    DOCS['curio_' + id] = { title: c.name, text: c.text, source: `Curiosity ${got} of ${all.length} in this chapter. They are kept in your journal, under Keepsakes.` };
    this.readDoc('curio_' + id);
    this.refreshObjectives();
  }
  /** The photograph "develops" into a print that tucks itself away in the journal. */
  showPrint(photo, retake) {
    const el = $('print');
    el.querySelector('.print-photo').style.backgroundImage = `url(${photo.img})`;
    el.querySelector('.print-title').textContent = photo.title;
    const n = state.photos.filter(p => p.subject).length;
    el.querySelector('.print-sub').textContent = retake ? 'Retaken' : `Plate ${n} · saved to your journal`;
    el.classList.remove('hidden', 'go'); void el.offsetWidth; el.classList.add('go');
    sfx('print');
    clearTimeout(this._printT); this._printT = setTimeout(() => el.classList.add('hidden'), 3300);
  }
  banner(title, sub = '') {
    const el = $('banner');
    el.querySelector('.banner-title').textContent = title; el.querySelector('.banner-sub').innerHTML = sub;
    el.classList.remove('hidden', 'go'); void el.offsetWidth; el.classList.add('go');
    clearTimeout(this._banT); this._banT = setTimeout(() => el.classList.add('hidden'), 3200);
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
    const q = state.settings.quality || this.dyn || 0.9;      // 0 = Automatic
    this.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.25) * q);
    this.renderer.setSize(innerWidth, innerHeight, false);
    this.camera.aspect = innerWidth / innerHeight;
    this.camera.updateProjectionMatrix();
  }

  loop() {
    requestAnimationFrame(() => this.loop());
    const raw = this.clock.getDelta(), dt = Math.min(0.05, raw);
    if (this.zone && this.isBackdrop) {
      // title screen: drift along the harbor in front of Castle Garden
      const t = (this.menuT = (this.menuT || 0) + dt), c = this.camera;
      c.position.set(-6 + Math.sin(t * 0.045) * 26, 6.5 + Math.sin(t * 0.11) * 1.0, 84 + Math.cos(t * 0.045) * 8);
      c.rotation.set(0, 0, 0); c.lookAt(c.position.x * 0.5 - (innerWidth > 900 ? 26 : 0), 8, 0);
      this.controls.pos.x = c.position.x; this.controls.pos.z = c.position.z;
      this.zone.update(dt);
      this.renderer.render(this.zone.scene, c);
      return;
    }
    if (!this.zone || this.mode === 'menu' || this.mode === 'wrapup') return;
    // Automatic quality: once a second, nudge the render resolution toward a steady frame rate.
    if (this.mode === 'play' && !state.settings.quality && !navigator.webdriver) {
      this.fpsT += raw; this.fpsN++;
      if (this.fpsT >= 1) {
        const fps = this.fpsN / this.fpsT, was = this.dyn; this.fpsT = 0; this.fpsN = 0;
        if (fps < 33) this.dyn = Math.max(0.5, this.dyn - 0.1); else if (fps > 52) this.dyn = Math.min(1, this.dyn + 0.05);
        if (this.dyn !== was) this.resize();
      }
    }
    this.zone.update(dt);
    this.controls.update(dt, this.zone.colliders, this.zone.bounds);
    this.photo.update(dt);
    if (this.mode === 'play') {
      // footsteps follow the walking bob; occasional sounds of the place
      const c = this.controls, stepN = Math.floor(c.bob / Math.PI);
      if (stepN !== this.stepN && Math.hypot(c.vel.x, c.vel.z) > 1.2) sfx('step', { surface: this.zone.surface ? this.zone.surface(c.pos) : 'stone', vol: 0.5 });
      this.stepN = stepN;
      ambientTick(dt, this.zone.where === 'park' ? 'park' : this.zoneId);
    }
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
if (/[?&]dev(=|&|$)/.test(location.search)) import('./dev/inspect.js').then(m => { window.dev = m; console.log('dev tools ready: dev.gaps(), dev.topdown(), dev.stats()'); });
// For the art guide: list every art key the game has asked for.
window.listArtKeys = () => [...requested.keys()].sort();
