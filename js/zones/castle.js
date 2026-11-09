// ZONE 2: CASTLE GARDEN (about 7 minutes)
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';

const STONE = ['wall_castle', { type: 'stone', color: '#9a9080', rows: 6 }];
const PAVE = ['pavement_battery', { type: 'stone', color: '#7d776c', rows: 5 }];
const WOOD = ['floor_castle', { type: 'planks', color: '#7a5a3a', n: 8 }];
const WATER = ['water_harbor', { type: 'water' }];
const DESK = ['desk_wood', { type: 'planks', color: '#4a3020', n: 4 }];

export class CastleZone extends Zone {
  build() {
    this.setSky('#b9b3a3', 60, 330, '#c4bdac');
    this.lights({ ambient: 0x9a9080, ambientI: 1.3, sky: 0xe8e0d0, ground: 0x4a4038, hemiI: 1.0, sun: { color: 0xfff0d8, i: 1.4, pos: [-30, 50, 40] } });

    // Ground + harbor
    this.floor(0, -18, 64, 52, [PAVE[0], PAVE[1], { repeat: [14, 12] }]);
    const water = this.floor(0, 0, 900, 900, [WATER[0], WATER[1], { repeat: [80, 80] }], -0.4);
    this.updaters.push((dt, t) => { water.material.map.offset.set(t * 0.004, t * 0.002); });
    this.bounds = { minX: -30, maxX: 30, minZ: -44, maxZ: 15 };
    // Fences so the only way north is through the building
    this.box(-21.5, 0, -20, 17, 2.2, 0.2, '#2a2a2a');
    this.box(21.5, 0, -20, 17, 2.2, 0.2, '#2a2a2a');
    // Dock
    this.floor(0, 12, 14, 8, [WOOD[0], WOOD[1], { repeat: [4, 3] }], 0.01);
    for (const x of [-7, 7]) this.box(x, -0.4, 12, 0.3, 0.9, 8, '#3a2a1a');
    // Sea wall railings
    this.box(0, 0, 16.2, 14, 1.0, 0.15, '#2a2a2a');
    this.box(-18.5, 0, 8.2, 23, 1.0, 0.15, '#2a2a2a');
    this.box(18.5, 0, 8.2, 23, 1.0, 0.15, '#2a2a2a');
    // Battery Park trees
    for (const [x, z] of [[-22, -2], [-25, -12], [-21, -30], [22, -4], [25, -16], [21, -32], [-15, 3], [15, 2]]) this.tree(x, z, 1.4);
    // Steamship at anchor (the ship you came on)
    this.box(30, -0.4, 34, 50, 4, 9, '#1c1c1e', { collide: false });
    this.box(30, 3.6, 34, 30, 2, 7, '#e8e2d2', { collide: false });
    for (const x of [24, 34]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 6, 10), colorMat('#8e2f25')); f.position.set(x, 8, 34); this.scene.add(f); }

    // Statue of Liberty in the harbor (dedicated 1886)
    this.statue(-85, 120);
    this.target('statue', -85, 30, 120, 260);
    this.readable('statue', -4, 1.2, 15.4, { prompt: 'Look out at the harbor' });

    // ---- The rotunda ----
    const C = { x: 0, z: -20 }, R = 13;
    // ring wall with south (entrance) and north (exit) doors. angle 0 = +Z (south).
    this.ringWall(C.x, C.z, R, 7, STONE, [[-0.14, 0.14], [Math.PI - 0.14, Math.PI + 0.14]]);
    this.ringWallOuterDeco(C, R);
    this.floor(C.x, C.z, R * 2, R * 2, [WOOD[0], WOOD[1], { repeat: [8, 8] }], 0.02);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.4, R + 0.4, 0.4, 32), material('roof_castle', { type: 'planks', color: '#4a3a2c' }));
    roof.position.set(C.x, 7.1, C.z); this.scene.add(roof);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(5, 18, 8, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#6b6458'));
    dome.position.set(C.x, 7.3, C.z); this.scene.add(dome);
    const flagpole = this.box(C.x, 7.3, C.z, 0.1, 9, 0.1, '#ddd', { collide: false });
    this.panel(C.x + 1.0, 15.4, C.z, 1.8, 1.1, ['flag_us_1888', { type: 'solid', color: '#9a3030' }], 0, true);
    this.target('castle', C.x, 5, C.z + R, 40);
    // Sign over door
    this.panel(C.x, 5.2, C.z + R + 0.25, 5, 0.8, ['sign_castle_garden', { type: 'sign', title: 'CASTLE GARDEN · EMIGRANT LANDING DEPOT', w: 512, h: 80 }]);

    // Interior lights
    this.lamp(-4, 5.5, -14, 0xfff0d0, 9, 18);
    this.lamp(4, 5.5, -24, 0xfff0d0, 9, 18);
    this.lamp(0, 5.5, -30, 0xfff0d0, 7, 16);
    // Columns
    for (let a = Math.PI / 8; a < Math.PI * 2; a += Math.PI / 4) {
      const x = C.x + Math.sin(a) * 6.5, z = C.z + Math.cos(a) * 6.5;
      this.box(x, 0, z, 0.5, 7, 0.5, '#8a8274');
    }

    // Inspection line railings
    this.box(-1.6, 0, -10, 0.08, 1.0, 5, '#2a2a2a');
    this.box(1.6, 0, -10, 0.08, 1.0, 5, '#2a2a2a');
    for (let i = 0; i < 4; i++) this.crowd(i, (i % 2 ? 0.5 : -0.5), -8.2 - i * 1.1, Math.PI);

    // Doctor station
    this.box(-4.5, 0, -14.5, 2.2, 0.95, 0.8, DESK);
    this.person('doctor', -4.5, -15.5, 0);
    // Registration desk (tall)
    this.box(4.6, 0, -19.5, 0.8, 1.3, 3.2, DESK);
    this.person('clerk', 5.6, -19.5, -Math.PI / 2);
    this.panel(4.6, 1.31, -19.5, 0.6, 0.45, ['ledger', { type: 'card', title: 'Register', lines: 'Name · Nation · Trade\nDestination · Money', w: 128, h: 96 }], 0).rotation.x = -Math.PI / 2;
    this.target('clerk', 4.6, 1.4, -19.5, 8);
    // Rivka's family waits near the clerk
    this.person('rivka', 2.4, -17.6, -Math.PI / 2, { talk: 'rivka_cg' });
    this.person('mama', 2.6, -16.6, -Math.PI / 2, { talk: 'mama', photo: 'family' });
    this.person('shmuel', 2.2, -18.6, -Math.PI / 2, { talk: 'shmuel', photo: 'family' });

    // Benches + detained man + newspaper
    this.box(-7, 0, -24, 0.6, 0.45, 3.2, DESK);
    this.person('novak', -7, -23, Math.PI / 2, { seated: true });
    const paper = this.panel(-7, 0.47, -25.2, 0.45, 0.32, ['newspaper_1888', { type: 'card', title: 'Chinese Still Shut Out', lines: 'Exclusion Act of 1882...', w: 160, h: 120 }]);
    paper.rotation.x = -Math.PI / 2;
    this.readable('newspaper', -7, 0.6, -25.2, { prompt: 'Read the newspaper on the bench', photo: 'newspaper' });

    // Official money exchange
    this.box(7.2, 0, -27, 2.4, 1.1, 1.0, DESK);
    this.panel(7.2, 2.0, -27.55, 2.0, 0.7, ['sign_exchange', { type: 'sign', title: 'LICENSED EXCHANGE', w: 256, h: 80 }], Math.PI);
    this.panel(7.2, 2.0, -26.45, 2.0, 0.7, ['sign_exchange', { type: 'sign', title: 'LICENSED EXCHANGE', w: 256, h: 80 }], 0);
    this.readable('exchange', 7.2, 1.3, -26, { prompt: 'Read the exchange sign' });
    this.crowd(3, 7.6, -25.4, Math.PI);

    // Information desk (Miss Carver)
    this.box(-4.5, 0, -28.5, 2.2, 0.95, 0.8, DESK);
    this.person('agent', -4.5, -29.5, 0);

    // More crowd
    [[-2, -21, 2], [-1, -26, 5], [1.5, -24, 6], [-9, -18, 1], [9, -15, 7], [-10, -27, 4]].forEach(([x, z, n]) => this.crowd(n, x, z, Math.atan2(-x, -z - 20)));

    // North door barrier (opens after inspection)
    this.barrier = this.box(C.x, 0, C.z - R, 3.6, 2.4, 0.3, '#3a2a1a');
    this.barrierCol = this.colliders[this.colliders.length - 1];
    this.panel(C.x, 2.8, C.z - R + 0.3, 3.6, 0.5, ['sign_exit', { type: 'sign', title: 'TO NEW YORK', w: 256, h: 40 }], 0);
    this.interact({ x: C.x, z: C.z - R + 1.2, r: 2.0, prompt: 'Go through the gate', cond: () => this.inspected(), action: () => this.openGate() }).lockedMsg = 'The gate is locked. Pass the medical check and registration first.';

    // ---- Outside the north gate: runners ----
    this.floor(0, -38, 30, 12, ['street_cobble', { type: 'cobble' }, { repeat: [8, 4] }], 0.03);
    this.box(-9, 0, -36, 0.15, 1.6, 6, '#222'); this.box(9, 0, -36, 0.15, 1.6, 6, '#222');
    this.person('runner', -3.5, -37.5, Math.PI * 0.1);
    this.person('changer', 3.5, -37.0, -Math.PI * 0.1);
    this.gateRivka = this.person('rivka', 0.2, -35.2, Math.PI, { talk: null, photo: null });
    this.gateMama = this.person('mama', 1.0, -34.8, Math.PI, { talk: null, photo: null });
    this.gateShmuel = this.person('shmuel', -0.6, -34.9, Math.PI, { talk: null, photo: null, scale: 1 });
    [this.gateRivka, this.gateMama, this.gateShmuel].forEach(n => n.group.visible = false);
    this.gateTalk = this.interact({ x: 0.2, z: -35.2, y: 1.3, r: 2.4, prompt: 'Talk to Rivka: decide who to trust', action: () => this.game.talk('gate') });
    this.gateTalk.hidden = true;
    for (const [x, z, n] of [[-6, -40, 4], [6, -40.5, 0], [-1, -41, 2], [2.5, -39.5, 7]]) this.crowd(n, x, z, Math.PI);
    const ex = this.exit(0, -43, 'Walk to Hester Street', () => flag('gate_done'), () => this.game.loadZone('les'));
    ex.lockedMsg = 'Help Rivka\'s family decide who to trust first.';
    this.target('runner', -3.5, 1.4, -37.5, 9);

    this.spawn = { x: 0, z: 12, yaw: 0 };
    if (flag('gate_opened')) this.openGate(true);
  }

  statue(x, z) {
    const g = new THREE.Group();
    const s = 1;
    const base = new THREE.Mesh(new THREE.BoxGeometry(26, 14, 26), colorMat('#8a8070'));
    base.position.y = 7; g.add(base);
    const ped = new THREE.Mesh(new THREE.BoxGeometry(12, 22, 12), colorMat('#9a9282'));
    ped.position.y = 25; g.add(ped);
    const green = colorMat('#6f9c8a');
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 5, 24, 10), green);
    robe.position.y = 48; g.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(2.2, 10, 8), green);
    head.position.y = 62; g.add(head);
    for (let i = 0; i < 7; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.4, 2.4, 4), green); const a = -1.2 + i * 0.4; sp.position.set(Math.sin(a) * 2, 64, Math.cos(a) * 2); sp.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6); g.add(sp); }
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 14, 8), green);
    arm.position.set(3.4, 62, 0); arm.rotation.z = -0.2; g.add(arm);
    const torch = new THREE.Mesh(new THREE.ConeGeometry(1.4, 3, 8), colorMat('#ffd27a', { basic: true }));
    torch.position.set(4.8, 70.5, 0); torch.rotation.x = Math.PI; g.add(torch);
    const flame = new THREE.Mesh(new THREE.SphereGeometry(1.2, 8, 6), colorMat('#ffe9a8', { basic: true }));
    flame.position.set(4.8, 72.6, 0); g.add(flame);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(3, 4, 0.8), green);
    tab.position.set(-3.6, 52, 1.5); g.add(tab);
    g.position.set(x, -0.5, z);
    g.rotation.y = Math.atan2(-x, -z) ;
    g.scale.setScalar(0.62);
    this.scene.add(g);
    // Bedloe's Island
    const isl = new THREE.Mesh(new THREE.CylinderGeometry(30, 34, 1, 16), colorMat('#5d6b45'));
    isl.position.set(x, -0.3, z); this.scene.add(isl);
  }

  ringWallOuterDeco(C, R) {
    // A low parapet ring on top to read as an old fort
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.2, 0.35, 6, 40), colorMat('#7a7264'));
    ring.rotation.x = Math.PI / 2; ring.position.set(C.x, 7.0, C.z); this.scene.add(ring);
  }

  inspected() { return flag('medical') && flag('registered'); }

  openGate(silent = false) {
    if (this.barrier.visible === false) return;
    this.barrier.visible = false;
    this.barrierCol.off = true;
    [this.gateRivka, this.gateMama, this.gateShmuel].forEach(n => n.group.visible = true);
    this.gateTalk.hidden = false;
    state.flags.gate_opened = true;
    // Hide the indoor Rivka family so they don't appear twice
    this.npcs.filter(n => ['rivka', 'mama', 'shmuel'].includes(n.id) && ![this.gateRivka, this.gateMama, this.gateShmuel].includes(n)).forEach(n => { n.group.visible = false; });
    this.interactables.forEach(it => { if (it.prompt && /Rivka|Mrs. Abramowitz|Shmuel/.test(it.prompt) && it !== this.gateTalk && Math.abs(it.pos.z + 17.6) < 2) it.hidden = true; });
    if (!silent) this.game.toast('The gate swings open. Rivka\'s family is waiting outside.');
    this.game.refreshObjectives();
  }

  onAction(name) {
    if (name === 'gateDone') this.game.refreshObjectives();
  }

  photoCount() { return state.photos.filter(p => p.zone === 'castle' && p.subject).length; }

  objectives() {
    const talked = ['talked_runner', 'talked_changer', 'talked_agent'].filter(flag).length;
    return [
      { text: 'Photograph the Statue of Liberty in the harbor', done: state.photos.some(p => p.subject === 'statue') },
      { text: 'Pass the doctor\'s inspection', done: flag('medical') },
      { text: 'Watch Rivka register with the clerk', done: flag('registered') },
      { text: 'Find out who gets turned away', done: flag('met_novak') },
      { text: 'Read the newspaper on the bench', done: state.photos.some(p => p.subject === 'newspaper') || flag('read_newspaper') },
      { text: `Outside the gate: hear from the people offering help (${talked}/3)`, done: talked >= 3 },
      { text: 'Help Rivka\'s family decide who to trust', done: flag('gate_done') },
      { text: `Photograph evidence (${this.photoCount()}/5)`, done: this.photoCount() >= 5 },
    ];
  }
}
