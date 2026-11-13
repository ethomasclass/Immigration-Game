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
const SANDSTONE = ['wall_castle_sandstone', { type: 'ashlar', color: '#8a5a44', rows: 6, w: 512, h: 512 }];
const PAVE = ['pavement_battery', { type: 'stone', color: '#7d776c', rows: 5 }];
const FLOOR = ['floor_castle', { type: 'planks', color: '#8c7350', n: 10, w: 512, h: 512 }];
const DESK = ['desk_wood', { type: 'planks', color: '#5e4630', n: 4 }];
const BROWN = ['wall_depot_wood', { type: 'planks', color: '#6b4a30', n: 8 }];
const FENCE = ['fence_depot', { type: 'boards', color: '#7d776c', n: 10, w: 512, h: 256 }];
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
    this.fixtures();
    this.yard();
    this.street();

    this.streetLife();
    this.spawn = { x: 0, z: 56, yaw: 0 };
    if (flag('gate_opened')) this.openGate(true);
  }

  // ------------------------------------------------------------ gulls, pigeons, voices
  streetLife() {
    const L = this.life;
    this.surface = (p) => (Math.hypot(p.x, p.z) < R || (Math.abs(p.x) < 4.5 && p.z > 20)) ? 'wood' : (p.x < -44 && p.z < 12 ? 'grass' : 'stone');
    L.gulls(4, 48, { n: 8, r: 30, y: 14 }); L.gulls(-70, 40, { n: 5, r: 36, y: 20 });
    L.pigeons(-58, -6, 10, 3); L.pigeons(30, -44, 8, 2.5);
    L.smoke([[20, 7.8, 62]], { per: 10, rise: 1.6, size: 4.5, windX: 0.9 });
    L.drift({ n: 30, where: (p) => Math.hypot(p.x, p.z) > 31 && p.z < 12 });
    L.cry(1.5, 44, ['Keep moving! Up the pier!', 'Mind the baggage!', 'Have your papers ready!']);
    L.cry(-14.4, 18.4, ['Bread! Coffee! Sausage!', 'Milk for the little ones!']);
    L.cry(0, 10.5, ['Next! Name? Where from?', 'How much money do you carry?', 'Who is meeting you?']);
    L.cry(11, -6, ['Tickets for Chicago! Milwaukee! St. Paul!', 'The emigrant train leaves at six!']);
    L.cry(-11, -9, ['Change your money here, at the posted rate!', 'Marks, rubles, lire, pounds!']);
    L.cry(26, -27, ['Cheap board! Clean beds, this way!', 'Carry your bags, mister?', 'Do not trust him. Ask at the desk.']);
  }

  // ------------------------------------------------------------ harbor, pier, statue
  harbor() {
    const water = this.floor(0, 300, 3600, 3600, [WATER[0], WATER[1], { repeat: [300, 300] }], -0.4);
    this.updaters.push((dt, t) => { water.material.map.offset.set(t * 0.004, t * 0.002); });
    // Battery (landfill): land north of the shoreline z = 12
    this.floor(5, -30, 170, 84, [PAVE[0], PAVE[1], { repeat: [40, 20] }]);
    this.floor(-62, -14, 36, 52, [GRASS[0], GRASS[1], { repeat: [8, 8] }], 0.01);
    // sea wall railing (gaps where the fort sits)
    // Granite seawall with an iron pipe railing, gas lamps, slat benches (the Battery promenade)
    for (const [cx, w] of [[-53, 54], [58, 64]]) {
      this.box(cx, -0.5, 12.5, w, 0.75, 0.9, ['seawall_granite', { type: 'ashlar', color: '#9a9892', mortar: '#6e6c68', rows: 2, w: 512, h: 128 }, { repeat: [w / 6, 1] }]);
      for (const y of [0.55, 1.0]) this.box(cx, y, 12.3, w, 0.05, 0.05, '#1e1e1e', { collide: false });
      for (let x = cx - w / 2; x <= cx + w / 2; x += 3) this.box(x, 0.25, 12.3, 0.07, 0.8, 0.07, '#1e1e1e', { collide: false });
    }
    for (const x of [-72, -60, -50, 66, 78]) this.bench(x, 9.6, 0);
    for (const x of [-66, -54, 72, 84]) { this.box(x, 0, 10.6, 0.14, 2.9, 0.14, '#23261f'); const l = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.15, 0.5, 4), colorMat('#b8a888')); l.position.set(x, 3.15, 10.6); l.rotation.y = Math.PI / 4; this.scene.add(l); }
    // barge pier on the south (water) side
    this.floor(0, 43.4, 8, 35.4, [FLOOR[0], FLOOR[1], { repeat: [3, 12] }], 0.02);
    for (const x of [-4.1, 4.1]) this.box(x, -0.4, 44, 0.25, 1.4, 34, '#3a2a1a');
    // the covered landing shed: heavy posts and beams with a plank roof (Harper's Weekly, 1880)
    for (let z = 30; z <= 56; z += 4.33) for (const x of [-3.8, 3.8]) this.box(x, 0, z, 0.32, 4.2, 0.32, '#4a3a2a', { collide: false });
    for (let z = 30; z <= 56; z += 4.33) this.box(0, 4.2, z, 8.2, 0.34, 0.3, '#4a3a2a', { collide: false });
    this.shed(-4.4, 4.4, 29, 57.5, 4.5, { open: true, rise: 1.4, roof: ['roof_landing', { type: 'planks', color: '#5a4a3a', n: 10 }] });
    for (const [x, z] of [[-2.6, 34], [-2.9, 35.2], [2.8, 41], [2.5, 47.5]]) this.hamper(x, z);
    for (const [x, z, c] of [[-2.4, 37, '#6a4a3a'], [2.7, 44, '#5a6a7a'], [-2.8, 50, '#7a6a4a']]) this.bundle(x, z, c);
    this.box(0, -0.4, 61.2, 8.4, 1.4, 0.25, '#3a2a1a');
    // timber wharf around the harbor face of the fort, on either side of the pier
    // (the hospital and customs sheds stand on it; seen from the pier, not walked on)
    const wharf = (x0, x1, zEnd) => {
      const zc = (x) => Math.sqrt(Math.max(0, (R - 0.1) ** 2 - x * x));
      const s = new THREE.Shape(), xs = [];
      const sgn = Math.sign(x1), xi = Math.min(Math.abs(x0), Math.abs(x1)), xo = Math.max(Math.abs(x0), Math.abs(x1));
      const xLand = Math.sqrt((R - 0.1) ** 2 - 144);           // where the fort meets the shoreline z = 12
      for (let i = 0; i <= 12; i++) xs.push(xi + (Math.min(xo, xLand) - xi) * i / 12);
      xs.forEach((x, i) => (i ? s.lineTo(sgn * x, -zc(x)) : s.moveTo(sgn * x, -zc(x))));
      s.lineTo(sgn * xo, -12); s.lineTo(sgn * xo, -zEnd); s.lineTo(sgn * xi, -zEnd);
      const g = new THREE.ShapeGeometry(s); g.rotateX(-Math.PI / 2);
      const uv = g.attributes.uv, pos = g.attributes.position;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getX(i) / 2.6, pos.getZ(i) / 2.6);
      const m = new THREE.Mesh(g, material('wharf_deck', { type: 'planks', color: '#6e5a40', n: 8 }, { repeat: [1, 1] }));
      m.position.y = 0.02; this.scene.add(m);
      // stringpiece along the water edge and piles below it
      const w = xo - xi, cx = sgn * (xi + w / 2);
      this.box(cx, -0.5, zEnd, w, 0.75, 0.35, '#3a2a1a', { collide: false });
      this.box(sgn * xo, -0.5, (12 + zEnd) / 2, 0.35, 0.75, zEnd - 12, '#3a2a1a', { collide: false });
      for (let x = xi + 1; x < xo; x += 2.4) this.box(sgn * x, -2.2, zEnd, 0.32, 2.2, 0.32, '#2a2018', { collide: false });
    };
    wharf(-4.2, -26, 37); wharf(4.2, 26, 30.5);
    for (let z = 28; z <= 60; z += 4) for (const x of [-4, 4]) this.box(x, -2, z, 0.35, 2.6, 0.35, '#2a2018', { collide: false });
    // the barge that brought you from the steamship
    // (black hull, flat deck, low buff deckhouse), and the tug that towed it
    this.box(9, -0.6, 44, 7, 1.2, 26, '#26221f', { collide: false });
    this.box(9, 0.6, 44, 6.4, 0.12, 25, ['barge_deck', { type: 'planks', color: '#6a5034', n: 8 }], { collide: false });
    // the barge's long curved roof
    const hg = new THREE.CylinderGeometry(3.0, 3.0, 18, 16, 1, true, -Math.PI / 2, Math.PI); hg.rotateX(-Math.PI / 2);   // half-barrel lying along z, curve up
    const hood = new THREE.Mesh(hg, material('barge_hood', { type: 'boards', color: '#c8c0aa', n: 14 }, { side: THREE.DoubleSide }));
    hood.position.set(9, 0.72, 43); hood.scale.set(1, 0.6, 1); this.scene.add(hood);
    for (const z of [34, 52]) { const e = new THREE.Mesh(new THREE.CircleGeometry(3.0, 16, 0, Math.PI), colorMat('#b8b09a', { side: THREE.DoubleSide })); e.position.set(9, 0.72, z); e.scale.set(1, 0.6, 1); this.scene.add(e); }
    this.box(20, -0.6, 62, 5, 1.6, 20, '#1e1c1a', { collide: false });
    this.box(20, 1.0, 60, 3.4, 2.2, 8, '#7a3b2a', { collide: false });
    this.box(20, 3.2, 57.6, 2.6, 1.6, 2.6, '#8a4a36', { collide: false });
    const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 4.6, 10), colorMat('#151515')); funnel.position.set(20, 5.4, 62); this.scene.add(funnel);
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
    this.ringWall(0, 0, RI, H, ['wall_castle_inner', { type: 'ashlar', color: '#a08872', mortar: '#c8b8a0', rows: 6, w: 512, h: 512 }], [[-0.075, 0.075], [CH0 - 0.02, CH1 + 0.02]]);
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
      this.panel(x, 3.6, z, 1.1, 1.5, ['window_castle', { type: 'embrasure', w: 128, h: 96 }], a);
    }
    // low domed roof (post-1876) with a central lantern and flagpole
    // a shallow dome: rim radius R+0.6, rising 4.2 m
    const rim = R + 0.6, rise = 4.2, Rs = (rim * rim + rise * rise) / (2 * rise), th = Math.asin(rim / Rs);
    // the roof is a ring around a raised lantern (drum of arched windows) carried on the column ring
    const DR = 10, th0 = Math.asin(DR / Rs);
    const roof = new THREE.Mesh(new THREE.SphereGeometry(Rs, 48, 8, 0, Math.PI * 2, th0, th - th0), material('roof_castle', { type: 'planks', color: '#6e6e6a', n: 16 }, { side: THREE.DoubleSide }));
    const roofY = H + 0.2 + rise - Rs; roof.position.y = roofY; this.scene.add(roof);
    const drumY = roofY + Math.sqrt(Rs * Rs - DR * DR), drumH = 2.8;
    this.drum = { r: DR, y: drumY };
    const drum = new THREE.Mesh(new THREE.CylinderGeometry(DR, DR, drumH, 36, 1, true), new THREE.MeshBasicMaterial({ map: (() => { const t = material('drum_clerestory', { type: 'clerestory', n: 6, w: 512, h: 128 }).map.clone(); t.repeat.set(4, 1); t.needsUpdate = true; return t; })(), side: THREE.DoubleSide }));
    drum.position.y = drumY + drumH / 2 - 0.05; this.scene.add(drum);
    const lcap = new THREE.Mesh(new THREE.ConeGeometry(DR + 0.8, 2.6, 36, 1, true), material('roof_castle', { type: 'planks', color: '#6e6e6a', n: 16 }, { side: THREE.DoubleSide }));
    lcap.position.y = drumY + drumH + 1.25; this.scene.add(lcap);
    const ceil = new THREE.Mesh(new THREE.CircleGeometry(DR, 36), colorMat('#efe9da', { basic: true })); ceil.rotation.x = Math.PI / 2; ceil.position.y = drumY + drumH - 0.02; this.scene.add(ceil);
    this.box(0, drumY + drumH + 2.4, 0, 0.14, 9, 0.14, '#ddd', { collide: false });
    this.panel(1.25, drumY + drumH + 10.6, 0, 2.4, 1.3, ['flag_us_38_stars', { type: 'solid', color: '#9a3030' }], 0, true);
    this.target('castle', 0, 5, R, 60);
    this.panel(0, 5.6, R + 0.08, 9, 0.9, ['sign_castle_garden', { type: 'sign', title: 'CASTLE GARDEN', w: 512, h: 56 }]);
  }

  interior() {
    // round plank floor that runs right through both doorways (no gaps at the thresholds)
    const fg = new THREE.CircleGeometry(R - 0.05, 48); fg.rotateX(-Math.PI / 2);
    const fuv = fg.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 14, fuv.getY(i) * 14);
    const fl = new THREE.Mesh(fg, material(FLOOR[0], FLOOR[1], { repeat: [1, 1] })); fl.position.y = 0.03; this.scene.add(fl);
    // worn stone thresholds in both doorways
    this.box(0, 0, R - 1.2, 3.8, 0.05, 2.8, '#7a6a5a', { collide: false });
    // ring of slender columns with flared ("palm") capitals and arched braces, holding up the lantern
    const DR = this.drum.r, cy = this.drum.y, colMat = colorMat('#d8d2c2'), N = 12;
    for (let i = 0; i < N; i++) {
      const a = Math.PI / 12 + i * Math.PI * 2 / N, [x, z] = pt(a, DR);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.22, cy - 1.4, 10), colMat); col.position.set(x, (cy - 1.4) / 2, z); this.scene.add(col);
      const capi = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.2, 1.4, 10, 1, true), colMat); capi.position.set(x, cy - 0.7, z); this.scene.add(capi);
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.38, 0.5, 10), colorMat('#8a8070')); base.position.set(x, 0.25, z); this.scene.add(base);
      this.colliders.push({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35, see: true });
      // arched brace to the next column
      const a2 = a + Math.PI * 2 / N, [x2, z2] = pt(a2, DR), mx = (x + x2) / 2, mz = (z + z2) / 2, span = Math.hypot(x2 - x, z2 - z);
      const arch = new THREE.Mesh(new THREE.TorusGeometry(span / 2, 0.11, 6, 16, Math.PI), colMat);
      arch.position.set(mx, cy - 1.35, mz); arch.rotation.y = -Math.atan2(z2 - z, x2 - x); arch.scale.y = 0.55; arch.rotation.z = 0;
      arch.rotateX(Math.PI); this.scene.add(arch);
    }
    const ring = new THREE.Mesh(new THREE.TorusGeometry(DR, 0.2, 6, 48), colMat); ring.rotation.x = Math.PI / 2; ring.position.y = cy - 0.05; this.scene.add(ring);
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
    for (let i = 0; i < 2; i++) this.crowd(i + 2, (i % 2 ? 0.45 : -0.45), 22.6 - i * 1.3, 0);
    this.box(-4.2, 0, 17.6, 2.2, 0.95, 0.8, DESK);
    this.person('doctor', -4.2, 16.6, 0);
    this.sign2(-4.2, 2.5, 18.05, 'MEDICAL OFFICER', 0);

    // ---- 2. Registration: a square of clerks' desks behind wooden railings ----
    const S = 8;
    this.box(0, 0, S, 7, 1.2, 0.9, DESK); this.box(0, 0, -S, 7, 1.2, 0.9, DESK);
    this.box(S, 0, 0, 0.9, 1.2, 7, DESK); this.box(-S, 0, 0, 0.9, 1.2, 7, DESK);
    // picket railings divide the floor into aisles and pens (1860s-80s engraving)
    this.picket(-3.5, S + 0.45, -6.5, S + 0.45); this.picket(3.5, S + 0.45, 6.5, S + 0.45);
    this.picket(-1.6, 26.2, -1.6, 19.0); this.picket(1.6, 26.2, 1.6, 20.6);
    this.person('clerk', 2.4, S - 1.2, 0);
    this.crowd(4, -S + 1.3, 0, 0); this.crowd(4, S - 1.3, 1.5, 0); this.crowd(4, 0, -S + 1.3, 0);
    this.sign2(0, 3.2, S + 0.5, 'REGISTRY', 0);
    this.panel(2.4, 1.22, S, 0.7, 0.45, ['ledger', { type: 'card', title: 'Register', lines: 'Name · Nation · Trade\nDestination · Money', w: 128, h: 96 }]).rotation.x = -Math.PI / 2;
    this.target('clerk', 2.4, 1.4, S, 8);
    // Rivka's family starts in the doctor's line, then WALKS to the clerk, then toward the exit.
    this.deskSpots = [[0.5, S + 1.9], [1.4, S + 2.5], [-0.4, S + 2.4]];
    this.lineSpots = [[0.5, 19.2], [-0.5, 18.2], [0.4, 17.4]];
    const at = flag('medical') ? this.deskSpots : this.lineSpots;
    this.indoorFamily = [
      this.person('rivka', at[0][0], at[0][1], 0, { talk: 'rivka_cg' }),
      this.person('mama', at[1][0], at[1][1], 0, { talk: 'mama', photo: 'family' }),
      this.person('shmuel', at[2][0], at[2][1], 0, { talk: 'shmuel', photo: 'family' }),
    ];
    this.familyAtDesk = flag('medical');
    // When the family reaches the desk and you are close, the registration begins by itself.
    this.updaters.push(() => {
      if (!this.familyAtDesk || flag('registered') || this.clerkStarted || this.game.mode !== 'play') return;
      const p = this.game.controls.pos;
      if (Math.hypot(p.x - 2.0, p.z - (S + 3)) < 5.5) { this.clerkStarted = true; this.game.talk('clerk'); }
    });

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
    const [ex, ez] = counter(ea, RI - 2.2, 'EXCHANGE OFFICE');
    this.readable('exchange', ex - Math.sin(ea) * 1.5, 1.3, ez - Math.cos(ea) * 1.5, { prompt: 'Read the exchange sign' });
    counter(ra, RI - 2.2, 'RAIL ROAD DEPARTMENT');
    const [ix, iz] = counter(ia + 0.35, RI - 7, 'INFORMATION', 2.6);
    this.person('agent', ix - Math.sin(ia + 0.35) * 1.4, iz - Math.cos(ia + 0.35) * 1.4, 0);
    // barrier across the landward exit (opens after inspection)
    const d = this.exitDoor;
    const bx = d.x - d.nx * 1.4, bz = d.z - d.nz * 1.4;
    this.barrier = this.wallLine(bx - d.ux * 2, bz - d.uz * 2, bx + d.ux * 2, bz + d.uz * 2, 2.4, '#3a2a1a', 0.25);
    this.barrier.userData.keep = true;
    this.sign2(d.x - d.nx * 1.6, 3.4, d.z - d.nz * 1.6, 'TO NEW YORK · NACH NEW YORK', Math.atan2(-d.nx, -d.nz));
    this.interact({ x: d.x - d.nx * 2.6, z: d.z - d.nz * 2.6, r: 2.4, prompt: 'Go through the gate', cond: () => this.inspected(), action: () => this.openGate() }).lockedMsg = 'Not yet. Finish your goal (top left) first.';
  }

  // ------------------------------------------------------------ documented fixtures (1871-1880 accounts)
  fixtures() {
    const wallPanel = (a, y, w, h, mat) => { const [x, z] = pt(a, RI - 0.22); const m = this.panel(x, y, z, w, h, mat, a + Math.PI); return [x, z]; };
    const desk = (a, r, w, label) => {
      const [x, z] = pt(a, r);
      const b = this.box(x, 0, z, w, 1.05, 0.8, DESK, { collide: false }); b.rotation.y = a;
      this.colliders.push({ minX: x - 1, maxX: x + 1, minZ: z - 1, maxZ: z + 1 });
      this.panel(x + Math.sin(a) * 0.5, 2.5, z + Math.cos(a) * 0.5, Math.max(2.4, label.length * 0.2), 0.5, ['sign_cg_' + label, { type: 'sign', title: label, w: 320, h: 48 }], a + Math.PI);
      return [x, z];
    };
    // the old nail-studded fort gates, still hung but left open at the water door
    for (const sx of [-1, 1]) { const g = this.box(sx * 2.3, 0, R + 1.3, 0.18, 4.2, 2.6, ['gate_fort', { type: 'boards', color: '#3a2e26', n: 5 }], { collide: false }); g.rotation.y = sx * 0.35; }
    // blackboards: the day's exchange rates (posting was required) and the steamers arriving
    wallPanel(1.16, 2.6, 3.4, 2.2, ['board_rates', { type: 'blackboard', title: 'RATES OF EXCHANGE TO-DAY\nGerman mark . . . 23 3/4 c.\nRussian ruble . . . 51 c.\nItalian lira . . . 19 c.\nEnglish pound . . $4.84', w: 384, h: 256 }]);
    wallPanel(0.52, 2.6, 3.4, 2.2, ['board_steamers', { type: 'blackboard', title: 'STEAMERS ARRIVING\nfrom Hamburg\nfrom Liverpool & Queenstown\nfrom Naples\nfrom Bremen', w: 384, h: 256 }]);
    // telegraph office and the free letter-writing desk, near where Mr. Novak waits
    desk(4.36, RI - 2.2, 2.8, 'TELEGRAPH');
    desk(3.98, RI - 2.2, 2.8, 'LETTERS WRITTEN FREE');
    const [tx, tz] = pt(4.36, RI - 3.6); this.crowd(4, tx, tz, 0);
    // bread stand in a corner: bread, milk, coffee, sausage
    const [bx, bz] = desk(5.62, RI - 2.2, 3, 'BREAD · MILK · COFFEE');
    for (let i = 0; i < 4; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 5), colorMat('#b98a4a')); l.scale.set(1.5, 0.7, 1); l.position.set(bx - 0.9 + i * 0.6, 1.14, bz); this.scene.add(l); }
    this.crowd(1, bx - Math.sin(5.62) * 1.5, bz - Math.cos(5.62) * 1.5, 0);
    // two-story office block of the Commissioners of Emigration, with its outside stair (engraving)
    const oa = 3.62, [ocx, ocz] = pt(oa, RI - 2.0), ux = Math.cos(oa), uz = -Math.sin(oa);   // u = along the block
    const ob = new THREE.Mesh(new THREE.BoxGeometry(10, 6.4, 3.2), [colorMat('#cfc6b0'), colorMat('#cfc6b0'), colorMat('#5e5e5c'), colorMat('#cfc6b0'),
      material('facade_cg_office', { type: 'facade', color: '#d6cdb6', floors: 2, bays: 5, storeFrac: 0.42, cornice: '#6a6a64', stone: '#a89c84', lit: 0.35, civic: true, w: 384, h: 256 }), colorMat('#cfc6b0')]);
    ob.position.set(ocx, 3.2, ocz); ob.rotation.y = oa + Math.PI; this.scene.add(ob);
    const fx = ocx - Math.sin(oa) * 1.62, fz = ocz - Math.cos(oa) * 1.62;
    const osign = this.panel(fx, 6.0, fz, 8.6, 0.7, ['sign_cg_commissioners', { type: 'sign', title: 'OFFICE OF COMMISSIONERS OF EMIGRATION', color: '#f0ead8', ink: '#1e1610', w: 512, h: 48 }], oa + Math.PI);
    for (let i = 0; i < 9; i++) this.box(fx + ux * (-4.6 + i * 0.36) - Math.sin(oa) * 0.6, i * 0.36, fz + uz * (-4.6 + i * 0.36) - Math.cos(oa) * 0.6, 0.4, 0.06, 1.1, '#2a2420', { collide: false });
    this.blockLine(ocx + ux * 5 - Math.sin(oa) * 2.3, ocz + uz * 5 - Math.cos(oa) * 2.3, ocx - ux * 5 - Math.sin(oa) * 2.3, ocz - uz * 5 - Math.cos(oa) * 2.3);
    // pot-belly stoves and heaps of baggage: bundles, beds, and baskets
    this.stove(-11, 5.5); this.stove(11, -5.5);
    for (const [x, z] of [[-9, 13], [-10.2, 12.2], [12, 12.5], [-12, -12], [13.4, 11.6]]) this.hamper(x, z);
    for (const [x, z, c] of [[-9.6, 14.1, '#7a5a6a'], [11.2, 13.6, '#5a6a7a'], [-13.2, -11.2, '#8a7a5a'], [-11, -13, '#6a4a3a'], [14.6, 12.6, '#7a6a4a']]) this.bundle(x, z, c);
    // outside: the hospital shed (right of the water entrance) and the customs shed with baggage scales
    this.shed(-21, -11.5, 29.5, 35, 3.4, { rise: 1.3 });
    this.panel(-11.43, 2.5, 32.25, 3.6, 0.5, ['sign_cg_HOSPITAL', { type: 'sign', title: 'HOSPITAL', w: 192, h: 40 }], Math.PI / 2);
    this.shed(-10.2, -6.2, 29, 34, 3, { rise: 1.1 });
    this.panel(-6.13, 2.3, 31.5, 3.2, 0.5, ['sign_cg_CUSTOMS', { type: 'sign', title: 'CUSTOMS', w: 192, h: 40 }], Math.PI / 2);
    this.box(-5.2, 0, 28.6, 1.1, 0.12, 1.1, '#3a3a3a'); this.box(-5.7, 0.12, 28.6, 0.08, 1.5, 0.08, '#3a3a3a', { collide: false }); this.box(-5.4, 1.5, 28.6, 0.7, 0.06, 0.06, '#b8913a', { collide: false });
    for (const [x, z] of [[-3.2, 30], [-3.4, 31.2]]) this.hamper(x, z);
    this.barrel(5.2, 27.5); this.barrel(5.9, 28.1); this.crate(5.6, 29.3, 0.8);
  }

  sign2(x, y, z, text, ry) {
    // two single-sided faces back to back, so the lettering reads correctly from both sides
    const w = Math.max(3, text.length * 0.16), mat = ['sign_cg_' + text, { type: 'sign', title: text, w: 384, h: 48 }];
    const ox = Math.sin(ry) * 0.02, oz = Math.cos(ry) * 0.02;
    this.panel(x + ox, y, z + oz, w, 0.5, mat, ry);
    this.panel(x - ox, y, z - oz, w, 0.5, mat, ry + Math.PI);
    this.box(x, y - 0.27, z, w + 0.08, 0.06, 0.06, '#2a2018', { collide: false });
  }

  // ------------------------------------------------------------ depot yard (inside the fence)
  yard() {
    this.box(-45, 0, -14, 0.3, 3.9, 52, FENCE);
    this.box(60, 0, -14, 0.3, 3.9, 52, FENCE);
    this.box(-7.5, 0, -40, 75, 3.9, 0.3, FENCE);
    this.box(52, 0, -40, 16, 3.9, 0.3, FENCE);
    // Labor Exchange (80 x 50 ft, brown wood, raised skylight)
    this.shed(26, 50, -23.5, -8.5, 5, { rise: 2.2 });
    this.box(38, 7.0, -16, 14, 1.2, 2.4, ['drum_clerestory', {}], { collide: false });   // raised skylight on the ridge
    this.shed(31, 45, -17.2, -14.8, 8.2, { open: true, rise: 0.8 });
    this.panel(38, 3.8, -8.45, 9, 0.8, ['sign_labor_exchange', { type: 'sign', title: 'LABOR EXCHANGE · ARBEITS-NACHWEIS', w: 448, h: 48 }]);
    // baggage building
    this.shed(-38, -18, -34, -22, 4.5, { rise: 2.0 });
    this.shed(-44, -36, -20, -10, 3.8, { rise: 1.5 });
    this.shed(12, 24, -37, -30, 3.6, { rise: 1.4 });
    this.panel(-28, 3.4, -21.95, 7, 0.7, ['sign_baggage', { type: 'sign', title: 'BAGGAGE · GEPÄCK', w: 320, h: 48 }]);
    for (let i = 0; i < 6; i++) this.box(-34 + i * 2.4, 0, -19.5, 1.0, 0.6, 0.6, ['trunk', { type: 'planks', color: '#6a4426', n: 3 }]);
    for (const [x, z] of [[-55, -20], [-62, 0], [-70, -30], [-52, 4], [70, -10], [76, -28], [-76, -14], [-64, -34], [-58, -8], [82, -2], [68, -32], [-74, 4], [80, 4]]) this.tree(x, z, 2.2);
    this.pavilion(-66, -16); this.pavilion(-52, -32, 2.6);
    const walk = (cx, cz, r, a0, a1) => { const g = new THREE.RingGeometry(r - 1.3, r + 1.3, 32, 1, a0, a1 - a0); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, material('path_gravel', { type: 'plaster', color: '#a8987a' })); m.position.set(cx, 0.015, cz); this.scene.add(m); };
    walk(-62, -14, 14, 0, Math.PI * 2); walk(-38, 30, 46, Math.PI * 1.02, Math.PI * 1.32);
    this.crowd(6, 20, -24, 0); this.crowd(1, 24, -30, 0); this.crowd(3, 8, -34, 0);
  }

  // ------------------------------------------------------------ outside the gate: State Street
  street() {
    this.floor(5, -56, 170, 32, ['street_belgian_block', { type: 'belgian', w: 512, h: 512 }, { repeat: [40, 8] }], 0.02);
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

  inspected() { return flag('medical') && flag('registered') && flag('novak_decided'); }

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

  onAction(name) {
    if (name === 'afterDoctor' && !this.familyAtDesk && !this.familyWalking) {
      this.familyWalking = true;
      this.indoorFamily.forEach((n, i) => this.walkTo(n, [[-1.5 + i * 0.8, 14.5], [4.6 - i * 0.4, 13.2], this.deskSpots[i]], i === 0 ? () => { this.familyAtDesk = true; this.game.refreshObjectives(); } : null, 1.5 - i * 0.12));
      this.game.toast('Rivka\'s family is walking to the registration desk. Follow them.');
    } else if (name === 'afterClerk') {
      const d = this.exitDoor;
      this.indoorFamily.forEach((n, i) => this.walkTo(n, [[5.5, 13 - i], [d.x - d.nx * (4.5 + i), d.z - d.nz * (4.5 + i) + (i - 1) * 0.9]], null, 1.3));
    }
    this.game.refreshObjectives();
  }

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
      { text: 'Follow Rivka\'s family to the registration desk and watch', done: flag('registered'), at: [2.0, 10.6] },
      { text: 'Find Mr. Novak from the ship. He is being held on a bench.', done: flag('novak_decided'), at: [Math.sin(4.75) * 23, Math.cos(4.75) * 23] },
      { text: 'Go through the gate marked "To New York"', done: flag('gate_opened'), at: [d.x, d.z] },
      { text: 'Outside the fence, hear what a "helper" is offering', done: flag('talked_runner') || flag('talked_changer'), at: [34, -46] },
      { text: 'Talk to Rivka: help her family decide who to trust', done: flag('gate_done'), at: [40.3, -43.6] },
      { text: 'Walk up to Hester Street', done: false, at: [40, -66] },
      { text: 'From the pier, photograph the Statue of Liberty (look southwest)', done: state.photos.some(p => p.subject === 'statue'), at: [0, 58], optional: true },
      { text: 'Read the newspaper on the bench', done: flag('read_newspaper'), at: [Math.sin(4.62) * 24.6, Math.cos(4.62) * 24.6], optional: true },
      { text: 'Ask Miss Carver at the information desk for advice', done: flag('talked_agent'), at: [7.3, -15.6], optional: true },
      { text: `Hear all three offers of help (${talked}/3)`, done: talked >= 3, optional: true },
    ];
  }
}
