// ZONE 1: STEERAGE (about 5 minutes)
// Built from the US Passenger Act of 1882 and 1879-1880s steerage accounts
// (see docs/HISTORICAL_REFERENCE.md):
//  - below-deck compartment, ~7 ft headroom; thin iron columns hold up the deck beams
//  - iron-frame berths, NO MORE THAN 2 TIERS, each 6 ft x 2 ft, in long rows; straw ticks
//    in canvas or gingham covers, one wool blanket, a cork life preserver for a pillow
//  - sawdust on the plank floor; whitewashed hull ribs; dim kerosene lanterns; small portholes
//  - no dining room: trestle tables & benches, tin pans, each passenger's own tin plate & cup
//  - families / single men (forward) / single women (aft) in separate compartments
//  - a steep, almost vertical ladder up through the hatch
// 1 unit = 1 m. Bow (forward) = -z.
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';

const W = 5.2;            // half-width of the hold
const H = 2.25;           // headroom (~7.4 ft)
const AFT = 0, MID = -15, FWD = -30;   // compartment walls (z)
const BERTH_L = 1.83, BERTH_W = 0.61, TIER2 = 1.1;

const HULL = ['wall_steerage_hull', { type: 'plaster', color: '#d2cab4' }];
const PARTITION = ['wall_steerage_partition', { type: 'planks', color: '#7a6a52', n: 6 }];
const FLOOR = ['floor_steerage_sawdust', { type: 'sawdust' }];
const BEAMS = ['wood_ship_dark', { type: 'planks', color: '#3e2a1a', n: 6 }];
const TABLE = ['wood_trestle', { type: 'planks', color: '#6a5034', n: 3 }];
const IRON = '#2c2c2c';

export class ShipZone extends Zone {
  build() {
    this.setSky('#120e0b', 6, 24);
    this.lights({ ambient: 0x6a5a48, ambientI: 1.0, sky: 0x9a8a70, ground: 0x2a2018, hemiI: 0.55 });
    this.bounds = { minX: -W, maxX: W, minZ: FWD, maxZ: AFT };

    // hull, floor, ceiling
    this.floor(0, (AFT + FWD) / 2, W * 2, AFT - FWD, [FLOOR[0], FLOOR[1], { repeat: [4, 12] }]);
    this.ceiling(0, (AFT + FWD) / 2, W * 2, AFT - FWD, [BEAMS[0], BEAMS[1], { repeat: [4, 12] }], H);
    this.room(-W, W, FWD, AFT, H, HULL);
    // whitewashed iron hull ribs and deck beams
    for (let z = AFT - 0.6; z > FWD; z -= 0.9) {
      for (const sx of [-1, 1]) this.box(sx * (W - 0.12), 0, z, 0.12, H, 0.12, '#e2dccb', { collide: false });
      if (Math.round(z * 10) % 18 === 0) this.box(0, H - 0.2, z, W * 2, 0.2, 0.18, BEAMS, { collide: false });
    }
    // thin iron columns down the middle
    for (let z = -3; z > FWD + 1; z -= 4.5) this.box(0, 0, z, 0.12, H, 0.12, IRON);
    // ventilator shafts (12-inch, two per 50 passengers)
    for (const [x, z] of [[-1.6, -6], [1.6, -10], [-1.6, -20], [1.6, -25]]) {
      const v = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.7, 10), colorMat('#9a3a2a'));
      v.position.set(x, H - 0.35, z); this.scene.add(v);
    }
    // portholes (about 10 in), mostly fogged
    for (let z = -2.5; z > FWD + 1; z -= 3.6) for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CircleGeometry(0.13, 12), colorMat('#a8b4b8', { basic: true }));
      p.position.set(sx * (W - 0.02), 1.9, z); p.rotation.y = -sx * Math.PI / 2; this.scene.add(p);
      const rim = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.025, 6, 12), colorMat('#7a6a3a'));
      rim.position.copy(p.position); rim.rotation.y = p.rotation.y; this.scene.add(rim);
    }

    // ---- compartments ----
    // Families (middle, z MID..AFT), single men forward (z FWD..MID). Doorway in the partition.
    this.box(-W / 2 - 0.55, 0, MID, W - 1.1, H, 0.12, PARTITION);
    this.box(W / 2 + 0.55, 0, MID, W - 1.1, H, 0.12, PARTITION);
    this.panel(0, 2.0, MID + 0.08, 2.4, 0.32, ['sign_single_men', { type: 'sign', title: 'SINGLE MEN · LEDIGE MÄNNER', w: 320, h: 40 }], 0);
    // single women's compartment lies aft, behind a locked door
    this.panel(0, 1.05, AFT - 0.08, 0.9, 1.9, ['door_steerage', { type: 'planks', color: '#4a3826', n: 3 }], Math.PI);
    this.panel(0, 2.05, AFT - 0.08, 2.6, 0.3, ['sign_single_women', { type: 'sign', title: 'SINGLE WOMEN · LEDIGE FRAUEN', w: 320, h: 40 }], Math.PI);

    // ---- berth rows along both sides: 2 tiers, 6 x 2 ft each ----
    const rows = [[AFT - 1.2, MID + 2.6], [MID - 0.8, FWD + 1.0]];
    for (const [z0, z1] of rows) for (const sx of [-1, 1]) this.berthRow(sx * (W - BERTH_L / 2), z0, z1);
    // a short cross block in each compartment
    this.berthRow(-1.9, -8.2, -10.6, true); this.berthRow(1.9, -21, -23.4, true);

    // ---- trestle tables & benches down the middle, tin pans ----
    for (const tz of [-5.5, -11.8, -18.2, -26]) {
      this.box(0.8, 0, tz, 0.8, 0.75, 2.6, TABLE);
      this.box(1.55, 0, tz, 0.3, 0.42, 2.4, TABLE);
      this.box(0.05, 0, tz, 0.3, 0.42, 2.4, TABLE, { collide: false });
      for (const dz of [-0.8, 0.4]) { const pan = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.18, 0.1, 12), colorMat('#a8a9a4')); pan.position.set(0.8, 0.8, tz + dz); this.scene.add(pan); }
    }
    // the supper pan you can inspect
    const bucket = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.2, 0.3, 12), colorMat('#a8a9a4'));
    bucket.position.set(0.8, 0.9, -11.2); this.scene.add(bucket);
    this.readable('food', 0.8, 1.0, -11.2, { prompt: 'Look at supper', photo: 'food' });
    this.readable('bunks', -W + 2.3, 1.0, -6.6, { prompt: 'Look at the berths', photo: 'bunks' });
    this.target('bunks', W - 2.3, 1.0, -21.5, 7);
    // luggage: bundles and trunks wherever they fit
    for (const [x, z] of [[-2.8, -3.0], [2.9, -4.6], [-2.7, -13.2], [2.8, -16.8], [-2.9, -27.6]]) this.box(x, 0, z, 0.7, 0.45, 0.45, ['trunk', { type: 'planks', color: '#6a4426', n: 3 }]);
    for (const [x, z] of [[-3.0, -9.5], [3.0, -12.8], [-3.1, -24.2]]) { const b = new THREE.Mesh(new THREE.SphereGeometry(0.32, 8, 6), colorMat('#7a5a3a')); b.scale.y = 0.7; b.position.set(x, 0.22, z); this.scene.add(b); }

    // ---- kerosene lanterns ----
    this.lanterns = [this.lamp(0.8, 1.95, -4, 0xffb060, 4.5, 9), this.lamp(-0.8, 1.95, -11, 0xffb060, 4.5, 9), this.lamp(0.8, 1.95, -19, 0xffb060, 4.5, 9), this.lamp(-0.8, 1.95, -26, 0xffb060, 4, 9)];

    // ---- people ----
    // Family compartment
    this.person('steward', -1.0, -2.6, 0);
    this.person('weber', -2.3, -6.2, 0);
    this.person('fraweber', -2.9, -5.0, 0, { photo: null });
    this.person('rivka', 2.4, -11.5, 0);
    this.person('mama', 3.0, -12.5, 0, { photo: 'family' });
    this.person('shmuel', 2.1, -12.7, 0, { photo: 'family' });
    [[-2.6, -9.2, 1], [2.6, -7.0, 6], [-0.6, -13.8, 3], [-2.8, -12.0, 2]].forEach(([x, z, n]) => this.crowd(n, x, z, 0));
    // Single men, forward
    this.person('giuseppe', -2.2, -19.5, 0);
    [[2.6, -18.0, 0], [-2.7, -23.0, 4], [2.4, -26.8, 7], [-0.6, -24.6, 2], [0.9, -28.4, 0]].forEach(([x, z, n]) => this.crowd(n, x, z, 0));

    // ---- steamship agent's poster (a passenger pinned it up) ----
    this.panel(-W + 0.14, 1.55, -1.6, 0.6, 0.85, ['poster_steamship', { type: 'card', title: 'To America!', lines: 'Fast steamships\nSteerage at low fares\nWork for all!', w: 256, h: 352 }], Math.PI / 2);
    this.readable('poster', -W + 0.6, 1.5, -1.6, { prompt: 'Read the poster', photo: 'poster' });

    // ---- steep ladder up through the hatch (family compartment) ----
    const lx = 2.4, lz = -2.2;
    for (let i = 0; i < 8; i++) this.box(lx, 0.22 + i * 0.27, lz - i * 0.05, 0.75, 0.05, 0.12, BEAMS, { collide: false });
    for (const dx of [-0.38, 0.38]) { const rail = this.box(lx + dx, 0, lz - 0.2, 0.06, H + 0.4, 0.06, BEAMS, { collide: false }); rail.rotation.x = 0.18; }
    const hatch = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.2), colorMat('#d0d8dc', { basic: true }));
    hatch.rotation.x = Math.PI / 2; hatch.position.set(lx, H - 0.01, lz - 0.4); this.scene.add(hatch);
    this.hatchLight = new THREE.PointLight(0xdfe8f0, 3, 6, 1.4); this.hatchLight.position.set(lx, H - 0.3, lz - 0.4); this.scene.add(this.hatchLight);
    const ex = this.exit(lx, lz + 0.4, 'Climb the ladder to the deck', () => this.ready(), () => this.game.loadZone('castle'), 1.8);
    ex.lockedMsg = 'Before you go up, finish your interviews (see objectives).';

    this.spawn = { x: 0, z: -1.2, yaw: 0 };

    this.updaters.push((dt, t) => {
      this.game.controls.roll = Math.sin(t * 0.55) * 0.02;
      this.lanterns.forEach((l, i) => { l.intensity = 4.5 + Math.sin(t * 7 + i * 2) * 0.35; });
    });
  }

  /** A row of 2-tier iron berths. Along z (heads to the hull) unless `across`. */
  berthRow(x, z0, z1, across = false) {
    const len = Math.abs(z1 - z0), zc = (z0 + z1) / 2;
    const n = Math.max(1, Math.round(len / BERTH_W));
    const depth = BERTH_L;
    const sack = ['berth_ticks', { type: 'berths', n: 4, w: 256, h: 128 }];
    const mat = (rep) => material(sack[0], sack[1], { repeat: [rep, 1], across });
    const wx = across ? len : depth, wz = across ? depth : len;
    for (const y of [0.18, TIER2]) {
      // iron frame + straw ticks
      this.box(x, y, zc, wx, 0.05, wz, IRON, { collide: false });
      const tick = new THREE.Mesh(new THREE.BoxGeometry(wx - 0.04, 0.14, wz - 0.04), mat(n / 4));
      tick.position.set(x, y + 0.12, zc); this.scene.add(tick);
      if (!across) { tick.material.map.center.set(0.5, 0.5); tick.material.map.rotation = Math.PI / 2; }
    }
    // iron posts every 3 berths + top rail
    const step = BERTH_W * 3;
    for (let d = 0; d <= len + 0.01; d += step) for (const s of [-1, 1]) {
      const px = across ? x - len / 2 + d : x + s * depth / 2;
      const pz = across ? zc + s * depth / 2 : Math.min(z0, z1) + d;
      this.box(px, 0, pz, 0.05, TIER2 + 0.85, 0.05, IRON, { collide: false });
    }
    this.colliders.push({ minX: x - wx / 2, maxX: x + wx / 2, minZ: zc - wz / 2, maxZ: zc + wz / 2 });
    // a tin cup and plate hanging from the frame here and there
    for (let d = 0.3; d < len; d += 2.1) {
      const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.045, 0.1, 8), colorMat('#a8a9a4'));
      if (across) cup.position.set(x - len / 2 + d, TIER2 - 0.1, zc + depth / 2 + 0.05);
      else cup.position.set(x - Math.sign(x) * (depth / 2 + 0.05), TIER2 - 0.1, Math.min(z0, z1) + d);
      this.scene.add(cup);
    }
  }

  pushCount() { return ['heard_giuseppe_push', 'heard_weber_push'].filter(flag).length; }
  photoCount() { return state.photos.filter(p => p.zone === 'ship' && p.subject).length; }
  ready() { return flag('heard_rivka_push') && this.pushCount() >= 1 && flag('heard_conditions') && flag('read_letter'); }

  map() {
    return {
      bounds: { minX: -W, maxX: W, minZ: FWD, maxZ: AFT },
      streets: [{ x0: -W, x1: W, z0: MID, z1: AFT, name: 'Families' }, { x0: -W, x1: W, z0: FWD, z1: MID, name: 'Single men' }],
      pois: [{ x: 2.4, z: -2.2, label: 'Ladder to deck' }, { x: 2.4, z: -11.5, label: 'Rivka' }, { x: -2.3, z: -6.2, label: 'Webers' }, { x: -2.2, z: -19.5, label: 'Giuseppe' }, { x: -1, z: -2.6, label: 'Steward' }],
    };
  }

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
