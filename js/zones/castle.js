// ZONE 2: CASTLE GARDEN (about 7 minutes)
// Rebuilt from NPS / Castle Clinton records (see docs/HISTORICAL_REFERENCE.md):
//  - former fort, ~56 m (184 ft) across, 8-ft red sandstone walls, one straight landward side
//  - roof rebuilt after the 1876 fire as a low dome with a central lantern; NO gallery in 1888
//  - immigrants arrive by barge at a pier on the water side, exit landward through a fenced yard
//  - brown-painted wooden outbuildings (Labor Exchange), 12-13 ft fence, runners outside the gate
//  - Statue of Liberty 2.84 km to the SW, still COPPER BROWN in 1888, on Fort Wood's 11-point star
// 1 unit = 1 m. North = -z, east = +x. Fort center at (0, 0).
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';

const R = 28, T = 2.4, RI = R - T, H = 7.5;
const SANDSTONE = ['wall_castle_sandstone', { type: 'stone', color: '#8a5a44', mortar: '#5e3e30', rows: 7 }];
const PAVE = ['pavement_battery', { type: 'stone', color: '#7d776c', rows: 5 }];
const FLOOR = ['floor_castle', { type: 'planks', color: '#8b6a47', n: 10 }];
const DESK = ['desk_wood', { type: 'planks', color: '#5e4630', n: 4 }];
const BROWN = ['wall_depot_wood', { type: 'planks', color: '#6b4a30', n: 8 }];
const FENCE = ['fence_depot', { type: 'planks', color: '#5a4030', n: 2 }];
const WATER = ['water_harbor', { type: 'water' }];
const GRASS = ['grass_park', { type: 'grass' }];
// Straight landward wall: between these angles (0 = south/+z, toward east/+x)
const CH0 = Math.PI * 0.625, CH1 = Math.PI * 0.875;
const pt = (a, r) => [Math.sin(a) * r, Math.cos(a) * r];

export class CastleZone extends Zone {
  build() {
    this.setSky('#c4c2b4', 260, 2600, '#c9c6b8');
    this.lights({ ambient: 0x9a9080, ambientI: 1.3, sky: 0xe8e4d4, ground: 0x4a4038, hemiI: 1.0, sun: { color: 0xfff0d8, i: 1.4, pos: [-30, 50, 40] } });
    this.bounds = { minX: -80, maxX: 90, minZ: -72, maxZ: 62 };

    this.skyline('castle', { kind: 'harbor', top: '#a9b4b8', haze: '#c9c6b8', ground: '#2c4a5a' });
    this.harbor();
    this.fort();
    this.interior();
    this.yard();
    this.street();

    this.spawn = { x: 0, z: 56, yaw: 0 };
    if (flag('gate_opened')) this.openGate(true);
  }

  // ------------------------------------------------------------ harbor, pier, statue
  harbor() {
    const water = this.floor(0, 300, 3600, 3600, [WATER[0], WATER[1], { repeat: [300, 300] }], -0.4);
    this.updaters.push((dt, t) => { water.material.map.offset.set(t * 0.004, t * 0.002); });
    // Battery (landfill): land north of the shoreline z = 12
    this.floor(5, -30, 170, 84, [PAVE[0], PAVE[1], { repeat: [40, 20] }]);
    this.floor(-62, -14, 36, 52, [GRASS[0], GRASS[1], { repeat: [8, 8] }], 0.01);
    // sea wall railing (gaps where the fort sits)
    this.box(-53, 0, 12.2, 54, 1.0, 0.15, '#2a2a2a');
    this.box(58, 0, 12.2, 64, 1.0, 0.15, '#2a2a2a');
    // barge pier on the south (water) side
    this.floor(0, 44, 8, 34, [FLOOR[0], FLOOR[1], { repeat: [3, 12] }], 0.02);
    for (const x of [-4.1, 4.1]) this.box(x, -0.4, 44, 0.25, 1.4, 34, '#3a2a1a');
    this.box(0, -0.4, 61.2, 8.4, 1.4, 0.25, '#3a2a1a');
    for (let z = 28; z <= 60; z += 4) for (const x of [-4, 4]) this.box(x, -2, z, 0.35, 2.6, 0.35, '#2a2018', { collide: false });
    // the barge that brought you from the steamship
    this.box(9, -0.6, 44, 6, 1.2, 22, '#3a2c20', { collide: false });
    this.box(9, 0.6, 44, 5.4, 0.12, 21, ['barge_deck', { type: 'planks', color: '#6a5034', n: 8 }], { collide: false });
    for (let i = 0; i < 5; i++) this.crowd(i, 8 + (i % 2) * 1.5, 38 + i * 2.6, 0);
    // your steamship at anchor
    this.steamship(-120, 300);
    // Governors Island with round Castle Williams (red sandstone), to the SE
    const gi = new THREE.Mesh(new THREE.CylinderGeometry(220, 240, 2, 24), colorMat('#5d6b45')); gi.position.set(520, -0.6, 880); this.scene.add(gi);
    const cw = new THREE.Mesh(new THREE.CylinderGeometry(30, 30, 14, 20), colorMat('#8a5a44')); cw.position.set(400, 7, 720); this.scene.add(cw);
    // distant shores: New Jersey (west), Brooklyn (east)
    this.box(-1700, -0.5, 300, 300, 10, 2400, '#5a5a50', { collide: false });
    this.box(1400, -0.5, 200, 300, 14, 2400, '#5e5a52', { collide: false });

    // Statue of Liberty: bearing 236° (SW). True apparent size is tiny from the Battery,
    // so it is shown about 2.2x larger than life to be photographable.
    const dist = 900, br = 236 * Math.PI / 180;
    const sx = Math.sin(br) * dist, sz = -Math.cos(br) * dist;
    this.statue(sx, sz, 2.2 * dist / 2840);
    this.target('statue', sx, 15, sz, 1400);
    this.readable('statue', -2, 1.2, 60.4, { prompt: 'Look out at the harbor' });
  }

  steamship(x, z) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.BoxGeometry(14, 8, 130), colorMat('#1c1c1e')); hull.position.y = 2; g.add(hull);
    const band = new THREE.Mesh(new THREE.BoxGeometry(14.1, 1.2, 130.1), colorMat('#8e2f25')); band.position.y = -1.4; g.add(band);
    const house = new THREE.Mesh(new THREE.BoxGeometry(10, 3, 50), colorMat('#e8e2d2')); house.position.y = 7.5; g.add(house);
    for (const fz of [-12, 12]) { const f = new THREE.Mesh(new THREE.CylinderGeometry(2, 2.2, 11, 12), colorMat('#d8a040')); f.position.set(0, 14, fz); g.add(f); const top = new THREE.Mesh(new THREE.CylinderGeometry(2.05, 2.05, 2, 12), colorMat('#151515')); top.position.set(0, 19, fz); g.add(top); }
    for (const mz of [-45, 45]) { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.5, 34, 6), colorMat('#5a4630')); m.position.set(0, 20, mz); g.add(m); }
    g.position.set(x, 0, z); g.rotation.y = 0.5;
    this.scene.add(g); this.bake(g);
  }

  statue(x, z, k) {
    // Real dimensions in meters, then scaled by k (distance compression).
    const g = new THREE.Group();
    const granite = colorMat('#b9a79a'), fortStone = colorMat('#9a8f84');
    const copper = colorMat('#8c5a3c'), copperDark = colorMat('#6e4a32');
    const isl = new THREE.Mesh(new THREE.CylinderGeometry(260, 280, 4, 24), colorMat('#5d6b45')); isl.position.y = -1; g.add(isl);
    // Fort Wood: 11-point star wall
    const shape = new THREE.Shape();
    for (let i = 0; i < 22; i++) { const a = i / 22 * Math.PI * 2, r = i % 2 ? 62 : 90; const px = Math.cos(a) * r, py = Math.sin(a) * r; i ? shape.lineTo(px, py) : shape.moveTo(px, py); }
    const fort = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 12, bevelEnabled: false }), fortStone);
    fort.rotation.x = -Math.PI / 2; g.add(fort);
    // pedestal (Connecticut granite, pinkish grey)
    const base = new THREE.Mesh(new THREE.BoxGeometry(28, 20, 28), granite); base.position.y = 22; g.add(base);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(13, 16, 27, 4), granite); ped.position.y = 45.5; ped.rotation.y = Math.PI / 4; g.add(ped);
    // statue, 46 m, copper brown (not green until ~1900-1906)
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(5, 8, 30, 10), copper); robe.position.y = 74; g.add(robe);
    const fold = new THREE.Mesh(new THREE.CylinderGeometry(4.2, 7, 26, 7), copperDark); fold.position.set(1.2, 72, 1.5); g.add(fold);
    const head = new THREE.Mesh(new THREE.SphereGeometry(3.4, 10, 8), copper); head.position.y = 92; g.add(head);
    for (let i = 0; i < 7; i++) { const sp = new THREE.Mesh(new THREE.ConeGeometry(0.6, 3.6, 4), copper); const a = -1.2 + i * 0.4; sp.position.set(Math.sin(a) * 3, 95, Math.cos(a) * 3); sp.rotation.set(Math.cos(a) * 0.6, 0, -Math.sin(a) * 0.6); g.add(sp); }
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.7, 13, 8), copper); arm.position.set(5, 96, 0); arm.rotation.z = -0.15; g.add(arm);
    const torch = new THREE.Mesh(new THREE.ConeGeometry(1.8, 3.6, 8), copperDark); torch.position.set(6, 103.5, 0); torch.rotation.x = Math.PI; g.add(torch);
    const flame = new THREE.Mesh(new THREE.ConeGeometry(1.5, 3.4, 8), copper); flame.position.set(6, 107, 0); g.add(flame);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(4.2, 6.4, 1.2), copperDark); tab.position.set(-5.4, 80, 2.4); g.add(tab);
    g.scale.setScalar(k);
    g.position.set(x, -0.5, z);
    g.rotation.y = Math.atan2(-x, -z) + 0.6;
    this.scene.add(g); this.bake(g);
  }

  // ------------------------------------------------------------ the fort
  fort() {
    const doorS = [-0.06, 0.06];
    this.ringWall(0, 0, R, H, SANDSTONE, [doorS, [CH0, CH1]]);
    this.ringWall(0, 0, RI, H, ['wall_castle_inner', { type: 'plaster', color: '#a8957a' }], [[-0.075, 0.075], [CH0 - 0.02, CH1 + 0.02]]);
    // straight landward wall with the exit door in the middle
    const [ax, az] = pt(CH0, R * 0.995), [bx, bz] = pt(CH1, R * 0.995);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2, dx = (bx - ax), dz = (bz - az), L = Math.hypot(dx, dz);
    const ux = dx / L, uz = dz / L, door = 1.8;
    this.wallLine(ax, az, mx - ux * door, mz - uz * door, H, SANDSTONE, T);
    this.wallLine(mx + ux * door, mz + uz * door, bx, bz, H, SANDSTONE, T);
    this.wallLine(mx - ux * door, mz - uz * door, mx + ux * door, mz + uz * door, H - 3, SANDSTONE, T, 3);
    // outward normal of the straight wall (points NE, away from the center)
    let nx = -uz, nz = ux; if (nx * mx + nz * mz < 0) { nx = -nx; nz = -nz; }
    this.exitDoor = { x: mx, z: mz, nx, nz, ux, uz };
    const cap = new THREE.Mesh(new THREE.RingGeometry(RI, R, 48), colorMat('#6e4a38')); cap.rotation.x = -Math.PI / 2; cap.position.y = H; this.scene.add(cap);
    // old embrasures, now glazed windows
    for (let a = 0.25; a < Math.PI * 2; a += 0.28) {
      if (a > CH0 - 0.05 && a < CH1 + 0.05) continue;
      const [x, z] = pt(a, R + 0.03);
      this.panel(x, 3.6, z, 1.1, 1.5, ['window_castle', { type: 'window', color: '#5a6670', frame: '#3a2a20', w: 64, h: 96 }], a);
    }
    // low domed roof (post-1876) with a central lantern and flagpole
    // a shallow dome: rim radius R+0.6, rising 4.2 m
    const rim = R + 0.6, rise = 4.2, Rs = (rim * rim + rise * rise) / (2 * rise), th = Math.asin(rim / Rs);
    const roof = new THREE.Mesh(new THREE.SphereGeometry(Rs, 40, 10, 0, Math.PI * 2, 0, th), material('roof_castle', { type: 'planks', color: '#5a4a3c', n: 12 }, { side: THREE.DoubleSide }));
    roof.position.y = H + 0.2 + rise - Rs; this.scene.add(roof);
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(4.5, 4.5, 2.4, 12), colorMat('#e8e2d0')); lantern.position.y = H + 5.4; this.scene.add(lantern);
    const lroof = new THREE.Mesh(new THREE.ConeGeometry(5, 1.8, 12), colorMat('#4a3a2c')); lroof.position.y = H + 7.7; this.scene.add(lroof);
    this.box(0, H + 8.5, 0, 0.14, 10, 0.14, '#ddd', { collide: false });
    this.panel(1.25, H + 17.2, 0, 2.4, 1.3, ['flag_us_38_stars', { type: 'solid', color: '#9a3030' }], 0, true);
    this.target('castle', 0, 5, R, 60);
    this.panel(0, 5.6, R + 0.08, 9, 0.9, ['sign_castle_garden', { type: 'sign', title: 'CASTLE GARDEN · EMIGRANT LANDING DEPOT', w: 512, h: 56 }]);
  }

  interior() {
    this.floor(0, 0, RI * 2, RI * 2, [FLOOR[0], FLOOR[1], { repeat: [14, 14] }], 0.03);
    for (let a = Math.PI / 10; a < Math.PI * 2; a += Math.PI / 5) { const [x, z] = pt(a, 14); this.box(x, 0, z, 0.45, H + 2, 0.45, '#5e4630'); }
    const sky = new THREE.Mesh(new THREE.CircleGeometry(4.4, 16), colorMat('#f4efe0', { basic: true })); sky.rotation.x = Math.PI / 2; sky.position.y = H + 4.3; this.scene.add(sky);
    this.lamp(-8, 6, 8, 0xfff0d0, 9, 22); this.lamp(8, 6, -8, 0xfff0d0, 9, 22); this.lamp(0, 7.5, 0, 0xfff4e0, 8, 24);
    // benches around the wall (also used as beds)
    for (let a = 0.35; a < Math.PI * 2 - 0.2; a += 0.16) {
      if (a > CH0 - 0.3 && a < CH1 + 0.3) continue;
      const [x, z] = pt(a, RI - 0.9);
      const b = this.box(x, 0, z, 1.6, 0.45, 0.5, DESK, { collide: false });
      b.rotation.y = a + Math.PI / 2;
      this.colliders.push({ minX: x - 0.45, maxX: x + 0.45, minZ: z - 0.45, maxZ: z + 0.45, see: true });
    }
    [[0.6, 1], [0.9, 3], [1.3, 6], [3.4, 2], [3.9, 4], [4.4, 7], [5.0, 0], [5.6, 5]].forEach(([a, n]) => { const [x, z] = pt(a, RI - 1.8); this.crowd(n, x, z, 0); });

    // ---- 1. Medical check just inside the pier door ----
    this.box(-1.5, 0, 22, 0.08, 1.0, 5, '#2a2a2a');
    this.box(1.5, 0, 22, 0.08, 1.0, 5, '#2a2a2a');
    for (let i = 0; i < 3; i++) this.crowd(i + 2, (i % 2 ? 0.45 : -0.45), 22.5 - i * 1.2, 0);
    this.box(-4.2, 0, 17.6, 2.2, 0.95, 0.8, DESK);
    this.person('doctor', -4.2, 16.6, 0);
    this.sign2(-4.2, 2.5, 18.05, 'MEDICAL OFFICER · ARZT', 0);

    // ---- 2. Registration: a square of clerks' desks behind wooden railings ----
    const S = 8;
    this.box(0, 0, S, 7, 1.2, 0.9, DESK); this.box(0, 0, -S, 7, 1.2, 0.9, DESK);
    this.box(S, 0, 0, 0.9, 1.2, 7, DESK); this.box(-S, 0, 0, 0.9, 1.2, 7, DESK);
    for (const [x, z] of [[S - 1, S - 1], [-S + 1, S - 1], [S - 1, -S + 1], [-S + 1, -S + 1]]) this.box(x, 0, z, 2, 1.0, 2, '#4a3624');
    this.person('clerk', 2.4, S - 1.2, 0);
    this.crowd(4, -S + 1.3, 0, 0); this.crowd(4, S - 1.3, 1.5, 0); this.crowd(4, 0, -S + 1.3, 0);
    this.sign2(0, 3.2, S + 0.5, 'REGISTRATION · REGISTRIRUNG', 0);
    this.panel(2.4, 1.22, S, 0.7, 0.45, ['ledger', { type: 'card', title: 'Register', lines: 'Name · Nation · Trade\nDestination · Money', w: 128, h: 96 }]).rotation.x = -Math.PI / 2;
    this.target('clerk', 2.4, 1.4, S, 8);
    this.indoorFamily = [
      this.person('rivka', 1.6, S + 2, 0, { talk: 'rivka_cg' }),
      this.person('mama', 2.7, S + 2.5, 0, { talk: 'mama', photo: 'family' }),
      this.person('shmuel', 0.6, S + 2.4, 0, { talk: 'shmuel', photo: 'family' }),
    ];

    // ---- 3. Who is held: Novak on a bench, a newspaper beside him ----
    const [nx, nz] = pt(4.75, RI - 2.2);
    this.person('novak', nx, nz, 0);
    const [px, pz] = pt(4.62, RI - 0.95);
    const paper = this.panel(px, 0.47, pz, 0.45, 0.32, ['newspaper_1888', { type: 'card', title: 'Chinese Still Shut Out', lines: 'Exclusion Act of 1882...', w: 160, h: 120 }]);
    paper.rotation.x = -Math.PI / 2;
    this.readable('newspaper', px, 0.6, pz, { prompt: 'Read the newspaper on the bench', photo: 'newspaper' });

    // ---- 4. Counters near the landward exit ----
    const counter = (a, r, label, w = 3.2) => {
      const [x, z] = pt(a, r);
      const b = this.box(x, 0, z, w, 1.1, 0.9, DESK, { collide: false }); b.rotation.y = a;
      this.colliders.push({ minX: x - 1.1, maxX: x + 1.1, minZ: z - 1.1, maxZ: z + 1.1 });
      this.panel(x + Math.sin(a) * 0.6, 2.6, z + Math.cos(a) * 0.6, w, 0.5, ['sign_cg_' + label, { type: 'sign', title: label, w: 320, h: 48 }], a + Math.PI);
      return [x, z];
    };
    const ea = CH0 - 0.4, ra = CH1 + 0.4, ia = Math.PI * 0.75;
    const [ex, ez] = counter(ea, RI - 2.2, 'MONEY EXCHANGE · GELDWECHSEL');
    this.readable('exchange', ex - Math.sin(ea) * 1.5, 1.3, ez - Math.cos(ea) * 1.5, { prompt: 'Read the exchange sign' });
    counter(ra, RI - 2.2, 'RAILROAD TICKETS · EISENBAHN');
    const [ix, iz] = counter(ia + 0.35, RI - 7, 'INFORMATION · AUSKUNFT', 2.6);
    this.person('agent', ix - Math.sin(ia + 0.35) * 1.4, iz - Math.cos(ia + 0.35) * 1.4, 0);
    // barrier across the landward exit (opens after inspection)
    const d = this.exitDoor;
    const bx = d.x - d.nx * 1.4, bz = d.z - d.nz * 1.4;
    this.barrier = this.wallLine(bx - d.ux * 2, bz - d.uz * 2, bx + d.ux * 2, bz + d.uz * 2, 2.4, '#3a2a1a', 0.25);
    this.barrier.userData.keep = true;
    this.sign2(d.x - d.nx * 1.6, 3.4, d.z - d.nz * 1.6, 'TO NEW YORK · NACH NEW YORK', Math.atan2(-d.nx, -d.nz));
    this.interact({ x: d.x - d.nx * 2.6, z: d.z - d.nz * 2.6, r: 2.4, prompt: 'Go through the gate', cond: () => this.inspected(), action: () => this.openGate() }).lockedMsg = 'The gate is locked. Pass the medical check and registration first.';
  }

  sign2(x, y, z, text, ry) {
    this.panel(x, y, z, Math.max(3, text.length * 0.16), 0.5, ['sign_cg_' + text, { type: 'sign', title: text, w: 384, h: 48 }], ry, true);
  }

  // ------------------------------------------------------------ depot yard (inside the fence)
  yard() {
    this.box(-45, 0, -14, 0.3, 3.9, 52, FENCE);
    this.box(60, 0, -14, 0.3, 3.9, 52, FENCE);
    this.box(-7.5, 0, -40, 75, 3.9, 0.3, FENCE);
    this.box(52, 0, -40, 16, 3.9, 0.3, FENCE);
    // Labor Exchange (80 x 50 ft, brown wood, raised skylight)
    this.box(38, 0, -16, 24, 5, 15, BROWN);
    this.box(38, 5, -16, 8, 1.4, 14, '#cfc8b8', { collide: false });
    const lr = new THREE.Mesh(new THREE.BoxGeometry(25, 0.3, 16), colorMat('#6b4a30')); lr.position.set(38, 5.1, -16); this.scene.add(lr);
    this.panel(38, 3.8, -8.45, 9, 0.8, ['sign_labor_exchange', { type: 'sign', title: 'LABOR EXCHANGE · ARBEITS-NACHWEIS', w: 448, h: 48 }]);
    // baggage building
    this.box(-28, 0, -28, 20, 4.5, 12, BROWN);
    this.panel(-28, 3.4, -21.95, 7, 0.7, ['sign_baggage', { type: 'sign', title: 'BAGGAGE · GEPÄCK', w: 320, h: 48 }]);
    for (let i = 0; i < 6; i++) this.box(-34 + i * 2.4, 0, -19.5, 1.0, 0.6, 0.6, ['trunk', { type: 'planks', color: '#6a4426', n: 3 }]);
    for (const [x, z] of [[-55, -20], [-62, 0], [-70, -30], [-52, 4], [70, -10], [76, -28]]) this.tree(x, z, 2.2);
    this.crowd(6, 20, -24, 0); this.crowd(1, 24, -30, 0); this.crowd(3, 8, -34, 0);
  }

  // ------------------------------------------------------------ outside the gate: State Street
  street() {
    this.floor(5, -56, 170, 32, ['street_belgian_block', { type: 'stone', color: '#7c7a76', mortar: '#4e4a44', rows: 10 }, { repeat: [40, 8] }], 0.02);
    const cols = ['#8e3b2e', '#b0a090', '#7a3a2c', '#a8916e'];
    let x = -80, i = 0;
    while (x < 90) {
      const w = 12 + (i % 3) * 5;
      this.building(x, x + w, -84, -72, 17 + (i % 4) * 2.5, { s: [`facade_office_${i % 4}`, { type: 'facade', color: cols[i % 4], floors: 5, bays: 5, lit: 0.15, cornice: '#8a8270', storeFrac: 0.18, w: 256, h: 512 }] }, null, { lot: 10 });
      x += w; i++;
    }
    this.person('runner', 34, -46, 0);
    this.person('changer', 47, -46.5, 0);
    for (const [cx, cz, n] of [[28, -50, 4], [52, -51, 0], [38, -55, 2], [44, -49, 7], [20, -58, 3]]) this.crowd(n, cx, cz, 0);
    this.gateFamily = [
      this.person('rivka', 40.3, -43.6, 0, { talk: null, photo: null }),
      this.person('mama', 41.3, -43.2, 0, { talk: null, photo: null }),
      this.person('shmuel', 39.4, -43.3, 0, { talk: null, photo: null }),
    ];
    this.gateFamily.forEach(n => { n.group.visible = false; });
    this.gateTalk = this.interact({ x: 40.3, z: -43.6, y: 1.3, r: 2.4, prompt: 'Talk to Rivka: decide who to trust', action: () => this.game.talk('gate') });
    this.gateTalk.hidden = true;
    // gate in the fence (locked until inspection)
    this.gateBar = this.box(37, 0, -40, 14, 3.9, 0.3, FENCE);
    this.gateBar.userData.keep = true;
    this.gateCol = this.colliders[this.colliders.length - 1];
    const ex = this.exit(40, -66, 'Walk up to Hester Street', () => flag('gate_done'), () => this.game.loadZone('les'));
    ex.lockedMsg = 'Help Rivka\'s family decide who to trust first.';
    this.panel(40, 2.8, -71.9, 2.2, 0.4, ['sign_street_STATE ST', { type: 'sign', title: 'STATE ST', color: '#1d2a3a', ink: '#f0e8d0', w: 192, h: 40 }]);
  }

  inspected() { return flag('medical') && flag('registered'); }

  openGate(silent = false) {
    if (this.barrier.visible === false) return;
    this.barrier.visible = false;
    this.barrier.userData.cols.forEach(c => { c.off = true; });
    this.gateBar.visible = false; this.gateCol.off = true;
    this.gateFamily.forEach(n => { n.group.visible = true; });
    this.gateTalk.hidden = false;
    state.flags.gate_opened = true;
    this.indoorFamily.forEach(n => { n.group.visible = false; });
    this.interactables.forEach(it => { if (/Rivka|Mrs. Abramowitz|Shmuel/.test(it.prompt || '') && it !== this.gateTalk) it.hidden = true; });
    if (!silent) this.game.toast('The gates open. Rivka\'s family is waiting outside the depot fence.');
    this.game.refreshObjectives();
  }

  onAction(name) { if (name === 'gateDone') this.game.refreshObjectives(); }

  map() {
    return {
      bounds: { minX: -80, maxX: 90, minZ: -72, maxZ: 62 },
      streets: [{ x0: -80, x1: 90, z0: -72, z1: -40, name: 'State St' }, { x0: -45, x1: 60, z0: -40, z1: 12, name: 'Depot yard' }, { x0: -4, x1: 4, z0: 12, z1: 62, name: 'Pier' }],
      parks: [{ x0: -80, x1: -45, z0: -40, z1: 12 }],
      pois: [
        { x: 0, z: 0, label: 'Castle Garden rotunda' }, { x: -4, z: 17, label: 'Doctor' }, { x: 2, z: 8, label: 'Registration' },
        { x: 0, z: 58, label: 'Barge pier' }, { x: 38, z: -16, label: 'Labor Exchange' }, { x: 40, z: -40, label: 'Gate' },
        { x: 34, z: -46, label: 'Runners' }, { x: -60, z: 56, label: 'Statue (SW)' },
      ],
    };
  }

  photoCount() { return state.photos.filter(p => p.zone === 'castle' && p.subject).length; }

  objectives() {
    const talked = ['talked_runner', 'talked_changer', 'talked_agent'].filter(flag).length;
    const d = this.exitDoor;
    return [
      { text: 'Walk up the pier into Castle Garden and see the doctor', done: flag('medical'), at: [-4.2, 16.6] },
      { text: 'Watch Rivka register with the clerk', done: flag('registered'), at: [2.4, 8] },
      { text: 'Go through the gate marked "To New York"', done: flag('gate_opened'), at: [d.x, d.z] },
      { text: 'Outside the fence, hear what a "helper" is offering', done: flag('talked_runner') || flag('talked_changer'), at: [34, -46] },
      { text: 'Talk to Rivka: help her family decide who to trust', done: flag('gate_done'), at: [40.3, -43.6] },
      { text: 'Walk up to Hester Street', done: false, at: [40, -66] },
      { text: 'From the pier, photograph the Statue of Liberty (look southwest)', done: state.photos.some(p => p.subject === 'statue'), at: [0, 58], optional: true },
      { text: 'Find out who gets turned away (the old man on the bench)', done: flag('met_novak'), at: [Math.sin(4.75) * 23, Math.cos(4.75) * 23], optional: true },
      { text: 'Read the newspaper on the bench', done: flag('read_newspaper'), at: [Math.sin(4.62) * 24.6, Math.cos(4.62) * 24.6], optional: true },
      { text: 'Ask Miss Carver at the information desk for advice', done: flag('talked_agent'), at: [7.3, -15.6], optional: true },
      { text: `Hear all three offers of help (${talked}/3)`, done: talked >= 3, optional: true },
    ];
  }
}
