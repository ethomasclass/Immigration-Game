// ZONE 1: STEERAGE (about 5 minutes)
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat } from '../engine/textures.js';
import { state, flag } from '../state.js';

const WOOD = ['wood_ship', { type: 'planks', color: '#5c3f27', n: 8 }];
const WOOD_DARK = ['wood_ship_dark', { type: 'planks', color: '#3e2a1a', n: 6 }];
const HULL = ['wall_steerage', { type: 'planks', color: '#4d3522', n: 5 }];
const STRAW = ['mattress_straw', { type: 'solid', color: '#a08a58' }];
const TRUNK = ['trunk', { type: 'planks', color: '#6a4426', n: 3 }];

export class ShipZone extends Zone {
  build() {
    this.setSky('#140f0c', 6, 26);
    this.lights({ ambient: 0x6a5a48, ambientI: 1.1, sky: 0x9a8a70, ground: 0x2a2018, hemiI: 0.6 });

    const W = 4.2, L = 26, H = 2.6;
    this.bounds = { minX: -W, maxX: W, minZ: -L, maxZ: 0 };
    this.floor(0, -L / 2, W * 2, L, [WOOD[0], WOOD[1], { repeat: [3, 10] }]);
    this.ceiling(0, -L / 2, W * 2, L, [WOOD_DARK[0], WOOD_DARK[1], { repeat: [3, 10] }], H);
    this.room(-W, W, -L, 0, H, HULL);
    // ceiling beams
    for (let z = -1.5; z > -L; z -= 2.2) this.box(0, H - 0.18, z, W * 2, 0.18, 0.22, WOOD_DARK, { collide: false });

    // Portholes (gray daylight)
    for (let z = -3; z > -L + 2; z -= 4.4) {
      for (const sx of [-1, 1]) {
        const p = new THREE.Mesh(new THREE.CircleGeometry(0.16, 14), colorMat('#9fb0b8', { basic: true }));
        p.position.set(sx * (W - 0.11), 1.95, z); p.rotation.y = -sx * Math.PI / 2;
        this.scene.add(p);
        const rim = new THREE.Mesh(new THREE.TorusGeometry(0.17, 0.03, 6, 14), colorMat('#8a6a26'));
        rim.position.copy(p.position); rim.rotation.y = p.rotation.y; this.scene.add(rim);
      }
    }

    // Bunks along both walls
    for (let z = -3.2; z > -L + 3; z -= 2.3) {
      for (const sx of [-1, 1]) this.bunk(sx * (W - 0.75), z);
    }

    // Center tables + benches
    for (const tz of [-8.5, -15.5]) {
      this.box(0, 0, tz, 1.0, 0.75, 3.6, WOOD_DARK);
      this.box(-0.85, 0, tz, 0.35, 0.42, 3.4, WOOD, { collide: true });
      this.box(0.85, 0, tz, 0.35, 0.42, 3.4, WOOD, { collide: true });
    }

    // Luggage
    const trunks = [[-1.6, -5.2], [1.7, -11], [-1.5, -18.2], [1.6, -20.5], [-2.0, -13.6], [1.9, -4.2]];
    for (const [x, z] of trunks) this.box(x, 0, z, 0.8, 0.5, 0.5, TRUNK, { ry: (x * 7) % 1 > 0.5 ? Math.PI / 2 : 0 });
    this.box(1.4, 0, -22.8, 0.5, 0.9, 0.5, '#5a4630'); // barrel

    // Lanterns
    this.lanterns = [this.lamp(0, 2.2, -4, 0xffb060, 5, 10), this.lamp(0, 2.2, -12, 0xffb060, 5, 10), this.lamp(0, 2.2, -20, 0xffb060, 5, 10)];

    // ---- People ----
    this.person('steward', 1.4, -2.8, Math.PI * 0.85);
    this.person('weber', 1.6, -6.6, -Math.PI / 2);
    this.person('fraweber', 2.6, -7.6, -Math.PI / 2, { seated: true, photo: null });
    this.person('rivka', -1.6, -10.8, Math.PI / 2);
    this.person('mama', -2.55, -11.6, Math.PI / 2, { seated: true, photo: 'family' });
    this.person('shmuel', -1.7, -12.0, Math.PI / 2.5, { photo: 'family' });
    this.person('giuseppe', 1.7, -14.0, -Math.PI / 2);

    // Background passengers
    const extras = [[-2.6, -4.5, 1, true], [2.7, -9.8, 3, true], [-2.6, -16.4, 2, true], [2.6, -18.8, 6, true], [-1.2, -19.6, 0, false], [0.9, -17.8, 4, false], [-2.6, -21.2, 5, true], [2.6, -12.6, 7, true]];
    extras.forEach(([x, z, n, seated], i) => this.crowd(n, x, z, x < 0 ? Math.PI / 2 : -Math.PI / 2, { seated }));

    // ---- Things to read / photograph ----
    // Steamship poster on the wall near the entrance
    this.panel(-W + 0.12, 1.5, -1.6, 0.8, 1.1, ['poster_steamship', { type: 'card', title: 'To America!', lines: 'Fast steamships\nSteerage at low fares\nWork for all!', w: 256, h: 352 }], Math.PI / 2);
    this.readable('poster', -W + 0.5, 1.5, -1.6, { prompt: 'Read the poster', photo: 'poster' });
    // A bunk to inspect
    this.readable('bunks', -W + 1.6, 1.0, -7.7, { prompt: 'Look at the bunks', photo: 'bunks' });
    this.target('bunks', W - 1.6, 1.0, -21.5, 7);
    // Supper bucket
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.32, 12), colorMat('#7d7d78'));
    bucket.position.set(0, 0.91, -15.5); this.scene.add(bucket);
    const bread = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.1, 0.2), colorMat('#3b2a1a'));
    bread.position.set(0.1, 0.8, -14.7); this.scene.add(bread);
    this.readable('food', 0, 1.0, -15.5, { prompt: 'Look at supper', photo: 'food' });

    // Ladder to deck (exit)
    for (let i = 0; i < 7; i++) this.box(0, 0.25 + i * 0.36, -L + 0.35, 1.0, 0.06, 0.1, WOOD, { collide: false });
    this.box(-0.5, 0, -L + 0.35, 0.08, H, 0.08, WOOD_DARK, { collide: false });
    this.box(0.5, 0, -L + 0.35, 0.08, H, 0.08, WOOD_DARK, { collide: false });
    const hatch = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.9), colorMat('#c8d2d6', { basic: true }));
    hatch.rotation.x = Math.PI / 2; hatch.position.set(0, H - 0.01, -L + 0.5); this.scene.add(hatch);
    const ex = this.exit(0, -L + 1.0, 'Climb to the deck', () => this.ready(), () => this.game.loadZone('castle'));
    ex.lockedMsg = 'Before you go up, finish your interviews (see objectives).';

    this.spawn = { x: 0, z: -1.2, yaw: 0 };

    this.updaters.push((dt, t) => {
      this.game.controls.roll = Math.sin(t * 0.55) * 0.02;
      this.lanterns.forEach((l, i) => { l.intensity = 5 + Math.sin(t * 7 + i * 2) * 0.4; });
    });
  }

  bunk(x, z) {
    // frame
    for (const dz of [-0.95, 0.95]) this.box(x - 0.6 * Math.sign(x) * 0, 0, z + dz, 1.3, 2.0, 0.08, WOOD_DARK, { collide: false });
    this.box(x, 0.18, z, 1.3, 0.12, 2.0, WOOD_DARK, { collide: false });
    this.box(x, 0.3, z, 1.2, 0.14, 1.85, STRAW, { collide: false });
    this.box(x, 1.12, z, 1.3, 0.1, 2.0, WOOD_DARK, { collide: false });
    this.box(x, 1.22, z, 1.2, 0.14, 1.85, STRAW, { collide: false });
    this.colliders.push({ minX: x - 0.65, maxX: x + 0.65, minZ: z - 1.0, maxZ: z + 1.0 });
  }

  pushCount() { return ['heard_giuseppe_push', 'heard_weber_push'].filter(flag).length; }
  photoCount() { return state.photos.filter(p => p.zone === 'ship' && p.subject).length; }
  ready() { return flag('heard_rivka_push') && this.pushCount() >= 1 && flag('heard_conditions') && flag('read_letter'); }

  objectives() {
    return [
      { text: 'Ask Rivka why her family left', done: flag('heard_rivka_push') },
      { text: `Ask other passengers why they left (${this.pushCount()}/2)`, done: this.pushCount() >= 2 },
      { text: 'Learn about life in steerage from the steward', done: flag('heard_conditions') },
      { text: 'Read the letter Rivka carries', done: flag('read_letter') },
      { text: `Photograph evidence: F to raise camera (${this.photoCount()}/4)`, done: this.photoCount() >= 4 },
      { text: 'Climb the ladder to the deck', done: false },
    ];
  }
}
