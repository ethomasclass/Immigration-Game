// ============================================================================
// TOUCH CONTROLS (phones, tablets, touchscreen Chromebooks)
//  - Left side: a joystick appears where your thumb lands; push to walk.
//  - Right side: drag to look around. A quick tap = use / take the photo.
//  - Buttons: Use (shows what you'll do), Camera, Shutter, Journal, Map, Pause.
// Turned on automatically when the device has a touchscreen and no mouse;
// can be forced on/off in Settings.
// ============================================================================
import { state, save } from '../state.js';

const $ = (id) => document.getElementById(id);

export function wantsTouch() {
  const mode = state.settings.touch || 'auto';
  if (mode === 'on') return true;
  if (mode === 'off') return false;
  const coarse = window.matchMedia && matchMedia('(pointer: coarse)').matches;
  const fine = window.matchMedia && matchMedia('(any-pointer: fine)').matches;
  return ('ontouchstart' in window || navigator.maxTouchPoints > 0) && coarse && !fine;
}

export class TouchControls {
  constructor(game) {
    this.game = game;
    this.c = game.controls;
    this.layer = $('touch');
    this.stick = $('touch-stick');
    this.knob = $('touch-knob');
    this.useBtn = $('t-use');
    this.move = null;   // { id, x0, y0 }
    this.look = null;   // { id, x, y, moved, t }
    this.enabled = false;

    const L = this.layer;
    L.addEventListener('pointerdown', (e) => this.down(e));
    L.addEventListener('pointermove', (e) => this.moveEv(e));
    L.addEventListener('pointerup', (e) => this.up(e));
    L.addEventListener('pointercancel', (e) => this.up(e, true));
    L.addEventListener('contextmenu', (e) => e.preventDefault());

    const btn = (id, fn) => {
      const b = $(id);
      b.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); b.classList.add('down'); fn(); });
      for (const ev of ['pointerup', 'pointercancel', 'pointerleave']) b.addEventListener(ev, () => b.classList.remove('down'));
    };
    btn('t-use', () => game.mode === 'play' && game.useFocus());
    btn('t-cam', () => game.mode === 'play' && game.photo.toggle());
    btn('t-shutter', () => game.mode === 'play' && game.photo.active && game.photo.snap());
    btn('t-journal', () => game.mode === 'play' && game.openJournal());
    btn('t-map', () => { if (game.mode === 'play') { game.journal.tab = 'map'; game.openJournal(); } });
    btn('t-pause', () => { if (game.mode === 'play') { game.setMode('pause'); $('pause').classList.remove('hidden'); } });

    // Stop the browser from zooming/scrolling the page during play.
    document.addEventListener('gesturestart', (e) => e.preventDefault());
    this.apply();
  }

  /** Re-check whether touch mode should be on (after a setting change). */
  apply() {
    this.enabled = wantsTouch();
    document.body.classList.toggle('touch', this.enabled);
    this.c.touchMode = this.enabled;
    if (!this.enabled) this.layer.classList.add('hidden');
    this.sync();
  }

  /** Show the layer only while walking around. */
  sync() {
    const on = this.enabled && this.game.mode === 'play';
    this.layer.classList.toggle('hidden', !on);
    if (!on) this.reset();
    $('t-shutter').classList.toggle('hidden', !this.game.photo.active);
    $('t-cam').classList.toggle('active', this.game.photo.active);
    document.body.classList.toggle('photo-on', this.game.photo.active);
  }

  reset() {
    this.move = null; this.look = null;
    this.c.touchMove.x = 0; this.c.touchMove.y = 0;
    this.stick.classList.add('hidden');
  }

  down(e) {
    if (e.pointerType === 'mouse' && !this.enabled) return;
    e.preventDefault();
    try { this.layer.setPointerCapture(e.pointerId); } catch {}
    const leftSide = e.clientX < innerWidth * 0.42;
    if (leftSide && !this.move) {
      this.move = { id: e.pointerId, x0: e.clientX, y0: e.clientY };
      this.stick.style.left = e.clientX + 'px';
      this.stick.style.top = e.clientY + 'px';
      this.knob.style.transform = 'translate(-50%, -50%)';
      this.stick.classList.remove('hidden');
    } else if (!this.look) {
      this.look = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0, t: performance.now() };
    }
  }

  moveEv(e) {
    if (this.move && e.pointerId === this.move.id) {
      const R = 52;
      let dx = e.clientX - this.move.x0, dy = e.clientY - this.move.y0;
      const d = Math.hypot(dx, dy);
      if (d > R) { dx = dx / d * R; dy = dy / d * R; }
      this.knob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
      // small dead zone so a resting thumb doesn't drift
      const m = Math.min(1, d / R), k = m < 0.15 ? 0 : (m - 0.15) / 0.85;
      this.c.touchMove.x = d ? dx / Math.min(d, R) * k : 0;
      this.c.touchMove.y = d ? dy / Math.min(d, R) * k : 0;
    } else if (this.look && e.pointerId === this.look.id) {
      const dx = e.clientX - this.look.x, dy = e.clientY - this.look.y;
      this.look.x = e.clientX; this.look.y = e.clientY;
      this.look.moved += Math.abs(dx) + Math.abs(dy);
      const k = this.game.photo.active ? 1.1 : 1.9;   // finer aim through the viewfinder
      if (this.game.mode === 'play') this.c.look(-dx * k, -dy * k);
    }
  }

  up(e, cancel) {
    if (this.move && e.pointerId === this.move.id) {
      this.move = null; this.c.touchMove.x = 0; this.c.touchMove.y = 0;
      this.stick.classList.add('hidden');
    } else if (this.look && e.pointerId === this.look.id) {
      const tap = !cancel && this.look.moved < 10 && performance.now() - this.look.t < 300;
      this.look = null;
      if (tap && this.game.mode === 'play') this.game.onClick();   // tap = use, or take the photo
    }
  }

  /** Called every frame: keep the Use button labelled with what it will do. */
  update(focus) {
    if (!this.enabled) return;
    const b = this.useBtn;
    if (focus && !this.game.photo.active) {
      const locked = focus.cond && !focus.cond();
      b.querySelector('span').textContent = focus.prompt + (locked ? ' (not yet)' : '');
      b.classList.remove('hidden'); b.classList.toggle('locked', !!locked);
    } else b.classList.add('hidden');
  }
}

export function setTouchSetting(v) { state.settings.touch = v; save(); }
