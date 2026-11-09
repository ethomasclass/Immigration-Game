// First-person controls: WASD + mouse (pointer lock), with a drag-to-look
// fallback for machines where the pointer won't lock.
import * as THREE from 'three';
import { state } from '../state.js';

export class Controls {
  constructor(canvas, camera) {
    this.canvas = canvas;
    this.camera = camera;
    this.keys = new Set();
    this.yaw = 0; this.pitch = 0;
    this.pos = new THREE.Vector3(0, 0, 0);
    this.vel = new THREE.Vector3();
    this.eye = 1.6;
    this.radius = 0.3;
    this.enabled = false;
    this.locked = false;
    this.dragging = false;
    this.bob = 0;
    this.roll = 0;  // ship sway, set by zone
    this.floorY = 0; // height of the floor the player stands on (roofs)
    this.shake = 0;  // 0..1, e.g. an El train overhead
    this.onClick = null;      // left click while playing
    this.onRightClick = null; // right click while playing
    this.onLockChange = null;

    addEventListener('keydown', (e) => { this.keys.add(e.code); });
    addEventListener('keyup', (e) => { this.keys.delete(e.code); });
    addEventListener('blur', () => this.keys.clear());

    document.addEventListener('pointerlockchange', () => {
      this.locked = document.pointerLockElement === canvas;
      this.onLockChange && this.onLockChange(this.locked);
    });
    document.addEventListener('pointerlockerror', () => {
      // Fall back to drag-look if the browser refuses pointer lock.
      state.settings.drag = true;
      this.onLockChange && this.onLockChange(false, true);
    });

    canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    canvas.addEventListener('mousedown', (e) => {
      if (!this.enabled) return;
      if (e.button === 2) { this.onRightClick && this.onRightClick(); return; }
      if (state.settings.drag) { this.dragging = true; this.dragMoved = 0; return; }
      if (!this.locked) { this.lock(); return; }
      this.onClick && this.onClick();
    });
    addEventListener('mouseup', (e) => {
      if (this.dragging && e.button === 0) {
        this.dragging = false;
        if (this.dragMoved < 6 && this.enabled) this.onClick && this.onClick();
      }
    });
    addEventListener('mousemove', (e) => {
      if (!this.enabled) return;
      if (this.locked) this.look(e.movementX, e.movementY);
      else if (this.dragging) { this.dragMoved += Math.abs(e.movementX) + Math.abs(e.movementY); this.look(-e.movementX * 1.5, -e.movementY * 1.5); }
    });
    // Touchscreen Chromebooks: one-finger drag looks around.
    let last = null;
    canvas.addEventListener('touchstart', (e) => { last = e.touches[0]; }, { passive: true });
    canvas.addEventListener('touchmove', (e) => {
      if (!this.enabled || !last) return;
      const t = e.touches[0];
      this.look(-(t.clientX - last.clientX) * 2, -(t.clientY - last.clientY) * 2);
      last = t;
    }, { passive: true });
  }

  lock() {
    if (state.settings.drag) return;
    try {
      const p = this.canvas.requestPointerLock();
      if (p && p.catch) p.catch(() => { state.settings.drag = true; this.onLockChange && this.onLockChange(false, true); });
    } catch { state.settings.drag = true; }
  }
  unlock() { if (document.pointerLockElement) document.exitPointerLock(); this.dragging = false; }

  look(dx, dy) {
    const s = 0.0022 * state.settings.sens;
    this.yaw -= dx * s;
    this.pitch -= dy * s;
    this.pitch = Math.max(-1.35, Math.min(1.35, this.pitch));
  }

  setPose(x, z, yaw = 0) { this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = 0; this.vel.set(0, 0, 0); }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }

  update(dt, colliders, bounds) {
    const k = this.keys;
    let fx = 0, fz = 0;
    if (this.enabled) {
      if (k.has('KeyW') || k.has('ArrowUp')) fz += 1;
      if (k.has('KeyS') || k.has('ArrowDown')) fz -= 1;
      if (k.has('KeyA')) fx -= 1;
      if (k.has('KeyD')) fx += 1;
      // Arrow keys turn (helps students with touchpads).
      if (k.has('ArrowLeft')) this.yaw += 1.8 * dt;
      if (k.has('ArrowRight')) this.yaw -= 1.8 * dt;
    }
    const run = k.has('ShiftLeft') || k.has('ShiftRight');
    const speed = run ? 5.2 : 3.0;
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    let wx = -sin * fz + cos * fx, wz = -cos * fz - sin * fx;
    const len = Math.hypot(wx, wz);
    if (len > 0) { wx /= len; wz /= len; }
    const a = Math.min(1, dt * 12);
    this.vel.x += (wx * speed - this.vel.x) * a;
    this.vel.z += (wz * speed - this.vel.z) * a;

    this.pos.x += this.vel.x * dt; this.collide(colliders, 'x');
    this.pos.z += this.vel.z * dt; this.collide(colliders, 'z');
    if (bounds) {
      this.pos.x = Math.max(bounds.minX + this.radius, Math.min(bounds.maxX - this.radius, this.pos.x));
      this.pos.z = Math.max(bounds.minZ + this.radius, Math.min(bounds.maxZ - this.radius, this.pos.z));
    }

    const moving = Math.hypot(this.vel.x, this.vel.z);
    this.bob += dt * moving * 2.4;
    const bobY = Math.sin(this.bob) * 0.03 * Math.min(1, moving / 3);

    const sh = this.shake; this.shake = Math.max(0, sh - dt * 1.5);
    const jx = sh ? (Math.random() - 0.5) * 0.035 * sh : 0, jy = sh ? (Math.random() - 0.5) * 0.035 * sh : 0;
    this.camera.position.set(this.pos.x + jx, this.floorY + this.eye + bobY + jy, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, this.roll, 'YXZ');
  }

  collide(colliders, axis) {
    const r = this.radius, p = this.pos;
    const v = axis === 'x' ? this.vel.x : this.vel.z;
    if (v === 0) return;
    for (const c of colliders) {
      if (c.off) continue;
      if (p.x + r <= c.minX || p.x - r >= c.maxX || p.z + r <= c.minZ || p.z - r >= c.maxZ) continue;
      if (axis === 'x') p.x = (this.vel.x > 0) ? c.minX - r : c.maxX + r;
      else p.z = (this.vel.z > 0) ? c.minZ - r : c.maxZ + r;
    }
  }
}
