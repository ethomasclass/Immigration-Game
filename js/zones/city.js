// ZONE 4: THE CITY. Urbanization and political machines (about 10 minutes)
// Park Row & City Hall Park in 1888, then the El uptown to Central Park.
// Layout from Robinson/Bromley-era sources (see docs/HISTORICAL_REFERENCE.md):
//  - City Hall Park is a triangle: Broadway (west), Park Row (east, diagonal), Chambers St (north)
//  - Mullett's granite Post Office (mansard roofs) fills the southern tip
//  - City Hall (white marble front; rear brownstone painted white) with its cupola & clock
//  - Tweed Courthouse just north: marble, Corinthian portico, no dome, grand stair on Chambers St
//  - "Newspaper Row" on Park Row: Potter Building (1886), Times Building UNDER CONSTRUCTION
//    (1888-89, 13 stories built around the old one), Tribune (1875, 260-ft clock tower)
//  - Third Ave El terminal at City Hall by the Brooklyn Bridge entrance; horsecars on Broadway
//  - 1888 = peak of the overhead "wire forest"; World Building not yet built
// Grid frame: Broadway runs north (-z). 1 unit = 1 m (distances to the bridge compressed).
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material, texture } from '../engine/textures.js';
import { state, flag } from '../state.js';
import { sfx } from '../engine/audio.js';

const COBBLE = ['street_belgian_block', { type: 'belgian', w: 512, h: 512 }];
const GRASS = ['grass_park', { type: 'grass' }];
const PATH = ['path_gravel', { type: 'plaster', color: '#a8987a' }];
const MARBLE = ['wall_marble', { type: 'stone', color: '#e9e6dd', mortar: '#c8c4b8', rows: 6 }];
const GRANITE = ['wall_granite_po', { type: 'stone', color: '#b4b2ac', mortar: '#8e8c86', rows: 8 }];
const IRON = '#2e2d2a';
const PX = 4000; // Central Park is built far away in the same scene (beyond fog range)

// Park Row: from the park's southern tip (on Broadway) diagonally NE
const BW = -100;                       // east edge of Broadway = west edge of the park
const TIP = [BW, 230], BEND = [80, -40], CHAMBERS = -110, CENTRE = 80;
const PR = (() => { const dx = BEND[0] - TIP[0], dz = BEND[1] - TIP[1], L = Math.hypot(dx, dz); return { L, d: [dx / L, dz / L], n: [-dz / L, dx / L] }; })(); // n points east (away from park)
const PR_W = 26;                       // Park Row width, curb to curb incl. sidewalks
const along = (s, off = 0) => [TIP[0] + PR.d[0] * s + PR.n[0] * off, TIP[1] + PR.d[1] * s + PR.n[1] * off];

export class CityZone extends Zone {
  build() {
    this.night = flag('election_night');
    this.title = this.night ? 'VI. Election Night' : 'V. Park Row';
    if (this.night) {
      this.setSky('#141826', 40, 700, '#1a1e2a');
      this.lights({ ambient: 0x7a7090, ambientI: 1.15, sky: 0x8a86a8, ground: 0x302830, hemiI: 0.6, sun: { color: 0xb0b8d8, i: 0.35, pos: [40, 60, 30] } });
    } else {
      this.setSky('#b8c4cc', 70, 1300, '#c8ccc8');
      this.lights({ ambient: 0xa09888, ambientI: 1.3, sky: 0xf0f0f0, ground: 0x504a40, hemiI: 1.0, sun: { color: 0xfff2dc, i: 1.6, pos: [40, 60, 30] } });
    }
    this.boundsDown = { minX: BW - 24, maxX: 150, minZ: CHAMBERS - 18, maxZ: 232 };
    this.boundsPark = { minX: PX - 60, maxX: PX + 60, minZ: -80, maxZ: 70 };
    this.bounds = this.boundsDown;

    this.skyCity = this.skyline('city', { kind: 'rooftops', top: '#9fb0bc', haze: '#c8ccc8', far: '#a5a29a', near: '#817a72' });
    this.skyPark = this.skyline('park', { kind: 'park', top: '#9fb0bc', haze: '#c8d0c0', ground: '#6a8050' });
    this.ground();
    this.cityHall();
    this.courthouse();
    this.postOffice();
    this.newspaperRow();
    this.westAndNorth();
    this.transit();
    this.bridge();
    this.parkLife();
    this.wires();
    if (!this.night) this.centralPark();
    this.roof();
    this.sets();
    this.election();
    this.streetLife();
    if (this.night) this.nightScene(); else this.story();
    if (this.night) { this.skyCity.material.color.set(0x2a3048); }
    this.streetCols = this.colliders;
    this.where = flag('in_park') ? 'park' : 'street';
    this.updaters.push((dt) => this.rideStep(dt));

    const [spx, spz] = along(62, PR_W - 9);
    this.spawn = { x: spx, z: spz, yaw: Math.atan2(-PR.d[0], -PR.d[1]) };
    if (flag('in_park') && !this.night) { this.spawn = { x: PX, z: 62, yaw: 0 }; this.bounds = this.boundsPark; }
    else this.where = 'street';
  }

  // ------------------------------------------------------------ ground: streets + the park triangle
  ground() {
    this.floor(20, 50, 600, 600, [COBBLE[0], COBBLE[1], { repeat: [150, 150] }]);
    const shape = new THREE.Shape();
    shape.moveTo(BW, -CHAMBERS); shape.lineTo(CENTRE, -CHAMBERS); shape.lineTo(CENTRE, -BEND[1]); shape.lineTo(BEND[0], -BEND[1]); shape.lineTo(TIP[0], -TIP[1]); shape.closePath();
    const geo = new THREE.ShapeGeometry(shape);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 4, uv.getY(i) / 4);
    const grass = new THREE.Mesh(geo, material(GRASS[0], GRASS[1]));
    grass.rotation.x = -Math.PI / 2; grass.position.y = 0.01; this.scene.add(grass);
    // gravel walks: around City Hall and diagonals
    this.floor(0, 0, 90, 46, [PATH[0], PATH[1], { repeat: [20, 10] }], 0.02);
    this.floor(-40, 70, 8, 130, [PATH[0], PATH[1], { repeat: [2, 30] }], 0.02);
    this.floor(0, -48, 120, 8, [PATH[0], PATH[1], { repeat: [30, 2] }], 0.02);
    // low iron park fence along Broadway and Park Row (with gaps for walks)
    this.box(BW + 0.5, 0, 60, 0.08, 0.9, 120, IRON); this.box(BW + 0.5, 0, -60, 0.08, 0.9, 80, IRON);
    // City Hall Park fountain (1871) south of City Hall
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.3, 0.6, 28), colorMat('#a8a090')); basin.position.set(-35, 0.3, 70); this.scene.add(basin);
    const water = new THREE.Mesh(new THREE.CircleGeometry(6.8, 28), colorMat('#5a7a88')); water.rotation.x = -Math.PI / 2; water.position.set(-35, 0.62, 70); this.scene.add(water);
    const jet = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.6, 10), colorMat('#9a9282')); jet.position.set(-35, 1.3, 70); this.scene.add(jet);
    this.colliders.push({ minX: -42.5, maxX: -27.5, minZ: 62.5, maxZ: 77.5 });
    // elms
    for (const [x, z] of [[-80, 140], [-70, 110], [-88, 80], [-60, 40], [-85, 20], [-75, -40], [-80, -90], [45, -95], [60, -70], [40, 40], [-20, 120], [-55, 170], [20, 60], [-10, 95]]) this.tree(x, z, 2.2);
    for (const [x, z] of [[-48, 64], [-22, 64], [-48, 76], [-22, 76], [-40, 30], [-40, 100]]) this.box(x, 0, z, 2, 0.45, 0.6, '#4a3424');
  }

  // ------------------------------------------------------------ City Hall (1812)
  cityHall() {
    // central block + two wings, white marble; rear (north) brownstone painted white
    this.building(-16, 16, -12, 12, 16, { s: ['facade_city_hall', { type: 'facade', color: '#e9e6dd', floors: 2, bays: 4, storeFrac: 0.38, cornice: '#d8d4c8', stone: '#cfcac0', lit: 0.1, civic: true, w: 256, h: 384 }] }, ['wall_marble', MARBLE[1]], { lot: 8 });
    this.building(-33, -16, -10, 10, 14, { s: ['facade_city_hall', {}] }, ['wall_marble', MARBLE[1]], { lot: 8 });
    this.building(16, 33, -10, 10, 14, { s: ['facade_city_hall', {}] }, ['wall_marble', MARBLE[1]], { lot: 8 });
    // portico columns + steps
    for (let i = 0; i < 6; i++) this.box(-7.5 + i * 3, 1.2, 13.4, 0.8, 9, 0.8, '#efe9dc');
    this.box(0, 10.2, 13.4, 18, 1.2, 1.4, '#e2dccf', { collide: false });
    this.box(0, 0, 14.6, 20, 1.2, 3, '#cfc9bc');
    // cupola with clock and dome
    this.box(0, 16, 0, 12, 3, 12, '#e9e6dd', { collide: false });
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(3.2, 3.6, 7, 12), colorMat('#e8e2d4')); cup.position.set(0, 22.5, 0); this.scene.add(cup);
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.4, 20), colorMat('#f4f0e2', { basic: true })); clock.position.set(0, 22.6, 3.62); this.scene.add(clock);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(3.2, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#7a8a7a')); dome.position.set(0, 26, 0); this.scene.add(dome);
    this.panel(0, 11.6, 14.15, 9, 0.8, ['sign_city_hall', { type: 'sign', title: 'CITY HALL', color: '#d8d2c4', ink: '#3a3028', w: 256, h: 40 }]);
  }

  // ------------------------------------------------------------ Tweed Courthouse
  courthouse() {
    // ~79 x 45 m, long axis east-west, 4.5 stories, Corinthian portico (south), grand stair (north).
    // The shell is one box; you can walk in through the portico to the octagonal rotunda.
    this.building(-38, 38, -102, -58, 24, { s: ['facade_courthouse', { type: 'facade', color: '#e9e6dd', floors: 4, bays: 5, storeFrac: 0.2, cornice: '#d8d4c8', stone: '#cfcac0', lit: 0.1, civic: true, w: 256, h: 512 }], n: ['facade_courthouse', {}] }, ['wall_marble', MARBLE[1]], { lot: 12, collide: false });
    // south portico on low steps (the real one sits on a raised basement)
    for (let i = 0; i < 6; i++) this.box(-8 + i * 3.2, 0.24, -55.5, 1.0, 16.26, 1.0, '#efe9dc');
    this.box(0, 16.5, -55.5, 20, 2.2, 2, '#e2dccf', { collide: false });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 12, 4, 3, 1), colorMat('#e2dccf')); ped.rotation.set(Math.PI / 2, 0, 0); ped.scale.set(1, 0.3, 1); ped.position.set(0, 20.6, -55.5); this.scene.add(ped);
    for (let i = 0; i < 3; i++) this.box(0, 0, -57.3 + i * 0.7 + 0.35 * 0, 22 + (2 - i) * 1.2, 0.08 * (3 - i), 2.6 + (2 - i) * 1.4, '#cfc9bc', { collide: false });
    this.panel(0, 17.7, -54.45, 14, 0.9, ['sign_courthouse', { type: 'sign', title: 'NEW YORK COUNTY COURTHOUSE', color: '#d8d2c4', ink: '#3a3028', w: 448, h: 40 }]);
    // open doors with lamplight inside
    this.panel(0, 2.25, -57.94, 3.6, 4.5, ['door_courthouse_open', { type: 'doorway', w: 128, h: 160 }]);
    // grand stair on the Chambers Street side (removed 1942)
    for (let i = 0; i < 10; i++) this.box(0, 0, -103 - i * 0.7, 24 - i * 0.4, 3 - i * 0.3, 0.7, '#d8d2c4', { collide: false });
    this.colliders.push({ minX: -12, maxX: 12, minZ: -110, maxZ: -102 });
    this.target('courthouse', 0, 10, -56, 60);
    this.readable('courthouse', 12, 1.3, -50.5, { prompt: 'Read about the courthouse', photo: null });
    this.box(12, 0, -50.8, 0.6, 1.0, 0.3, '#6a6458');
    this.rotunda();
  }

  /**
   * The courthouse rotunda: an octagon of stacked red-and-cream brick arcades under a skylight.
   * Plunkitt keeps his bootblack-stand "office" here. On the wall, the Ring's bills tell the story of graft.
   */
  rotunda() {
    const CX = 0, CZ = -80, R = 10.8, AP = R * Math.cos(Math.PI / 8), HT = 18, FW = 2 * R * Math.sin(Math.PI / 8), DOOR = 1.8;
    // solid parts of the building around the corridor + octagon (cheap box colliders)
    for (const c of [[-38, -11.2, -102, -58], [11.2, 38, -102, -58], [-11.2, -DOOR, -70.4, -58], [DOOR, 11.2, -70.4, -58], [-11.2, 11.2, -102, -90.6]])
      this.colliders.push({ minX: c[0], maxX: c[1], minZ: c[2], maxZ: c[3] });
    // entrance hall from the portico
    const PLASTER = ['wall_courthouse_hall', { type: 'plaster', color: '#d9cfb8' }];
    this.panel(-DOOR, 2.6, -64.2, 12.4, 5.2, PLASTER, Math.PI / 2); this.panel(DOOR, 2.6, -64.2, 12.4, 5.2, PLASTER, -Math.PI / 2);
    this.ceiling(0, -64.2, 3.6, 12.4, ['ceiling_courthouse', { type: 'plaster', color: '#e8e0cc' }], 5.2);
    this.floor(0, -64.2, 3.6, 12.4, ['floor_courthouse', { type: 'tiles', n: 8 }, { repeat: [1, 4] }], 0.03);
    // octagon walls (inside faces), with the doorway arch in the south face
    const ARC = ['wall_rotunda_arcade', { type: 'arcade', tiers: 3, n: 2, w: 512, h: 768 }];
    for (let k = 0; k < 8; k++) {
      const f = k * Math.PI / 4, fx = CX + Math.sin(f) * AP, fz = CZ + Math.cos(f) * AP;
      if (k === 0) {
        const sw = (FW - DOOR * 2) / 2;
        for (const sx of [-1, 1]) this.panel(sx * (DOOR + sw / 2), HT / 2, fz, sw, HT, ARC, Math.PI);
        this.panel(0, (HT + 5.2) / 2, fz, DOOR * 2, HT - 5.2, ['wall_rotunda_plain', { type: 'plaster', color: '#e8dcc4' }], Math.PI);
      } else this.panel(fx, HT / 2, fz, FW, HT, ARC, f + Math.PI);
      // collider points along the face (none in the doorway)
      const ux = Math.cos(f), uz = -Math.sin(f);
      for (let d = -FW / 2; d <= FW / 2; d += 0.5) {
        if (k === 0 && Math.abs(d) < DOOR) continue;
        const x = fx + ux * d, z = fz + uz * d;
        this.colliders.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4 });
      }
    }
    // gallery floor ledges and a polished marble floor
    const t0 = -3 * Math.PI / 8;
    for (const y of [6, 12]) { const g = new THREE.RingGeometry(R - 0.8, R, 8, 1, t0); g.rotateX(-Math.PI / 2); const m = new THREE.Mesh(g, colorMat('#bfb39a', { side: THREE.DoubleSide })); m.position.set(CX, y - 0.6, CZ); this.scene.add(m); }
    const fg = new THREE.CircleGeometry(R, 8, t0); fg.rotateX(-Math.PI / 2);
    const fuv = fg.attributes.uv; for (let i = 0; i < fuv.count; i++) fuv.setXY(i, fuv.getX(i) * 3, fuv.getY(i) * 3);
    const fl = new THREE.Mesh(fg, material('floor_courthouse', { type: 'tiles', n: 8 }, { repeat: [1, 1] })); fl.position.set(CX, 0.03, CZ); this.scene.add(fl);
    this.noAO = true;
    // ceiling ring and the octagonal skylight with its iron muntins
    const cg = new THREE.RingGeometry(5.6, R + 0.1, 8, 1, t0); cg.rotateX(Math.PI / 2);
    const ce = new THREE.Mesh(cg, colorMat('#e3d8c0')); ce.position.set(CX, HT, CZ); this.scene.add(ce);
    const sg = new THREE.CircleGeometry(5.7, 8, t0); sg.rotateX(Math.PI / 2);
    const sky = new THREE.Mesh(sg, colorMat('#f2f0e4', { basic: true })); sky.position.set(CX, HT + 1.2, CZ); this.scene.add(sky);
    const well = new THREE.Mesh(new THREE.CylinderGeometry(5.7, 5.6, 1.2, 8, 1, true, Math.PI / 8), colorMat('#d8ccb2', { side: THREE.DoubleSide })); well.position.set(CX, HT + 0.6, CZ); this.scene.add(well);
    for (let i = 0; i < 4; i++) this.box(CX, HT + 1.1, CZ, 11.4, 0.12, 0.12, '#2a2622', { collide: false, ry: i * Math.PI / 4 });
    // gas chandelier on a long rod from the skylight
    this.box(CX, 7.2, CZ, 0.06, HT - 7.2, 0.06, '#2a2622', { collide: false });
    const ring = new THREE.Mesh(new THREE.TorusGeometry(1.3, 0.05, 6, 24), colorMat('#8a6a2a')); ring.rotation.x = Math.PI / 2; ring.position.set(CX, 7.2, CZ); this.scene.add(ring);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; const gl = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), colorMat('#ffe8b0', { basic: true })); gl.position.set(CX + Math.sin(a) * 1.3, 7.35, CZ + Math.cos(a) * 1.3); this.scene.add(gl); }
    this.lamp(CX, 6.8, CZ, 0xffe2b0, 10, 22);
    this.lamp(0, 4.4, -63, 0xffd8a0, 5, 10);
    // office signs over the arches
    const offices = [[1, 'COUNTY CLERK'], [2, 'NATURALIZATION'], [3, 'SURROGATE'], [5, 'SUPREME COURT'], [6, 'TAX COMMISSIONERS'], [7, 'SHERIFF']];
    for (const [k, t] of offices) {
      const f = k * Math.PI / 4, x = CX + Math.sin(f) * (AP - 0.06), z = CZ + Math.cos(f) * (AP - 0.06);
      this.panel(x, 5.0, z, Math.max(3.4, t.length * 0.24), 0.55, ['sign_ch_' + t, { type: 'sign', title: t, color: '#1e1a16', ink: '#d8b860', w: 384, h: 48 }], f + Math.PI);
    }
    // naturalization desk: newcomers in line, a party man vouching for them ("Takes him to the courthouse. Then he can vote.")
    { const f = 2 * Math.PI / 4, x = CX + Math.sin(f) * (AP - 1.6), z = CZ + Math.cos(f) * (AP - 1.6);
      this.box(x, 0, z, 1.0, 1.15, 3.6, ['desk_courthouse', { type: 'planks', color: '#4e3826', n: 4 }]);
      this.box(x + 0.7, 1.15, z, 0.4, 0.04, 0.6, '#efe6cc', { collide: false });
      this.crowd(6, x + 0.4, z - 0.6, 0); for (let i = 0; i < 4; i++) this.crowd([1, 3, 5, 7][i], x - 1.5 - i * 0.9, z + 0.4 + (i % 2) * 0.5, 0); }
    // Plunkitt's bootblack stand: two raised chairs, a footrest, brushes and tins
    { const x = CX - 6.2, z = CZ + 3.2;
      this.box(x, 0, z, 2.6, 0.55, 1.1, ['bootblack_stand', { type: 'planks', color: '#4a3020', n: 4 }]);
      for (const sx of [-0.65, 0.65]) { this.box(x + sx, 0.55, z - 0.2, 0.9, 0.12, 0.7, '#6a2a22', { collide: false }); this.box(x + sx, 0.67, z - 0.5, 0.9, 0.8, 0.1, '#6a2a22', { collide: false }); this.box(x + sx, 0.25, z + 0.5, 0.3, 0.06, 0.3, '#8a6a2a', { collide: false }); }
      this.person('plunkitt', x + 1.75, z + 0.35, 0);
      this.crowd(5, x - 0.6, z + 0.9, 0, { scale: 0.72 });     // the bootblack boy
      this.crowd(4, x + 2.2, z + 1.6, 0); this.crowd(2, x - 2.2, z + 1.8, 0);
      this.plunkittPos = [x + 1.75, z + 1.6]; }
    // THE RING'S BILLS: framed copies hung where everyone waiting can read them
    { const f = 7 * Math.PI / 4 + 0.0, bx = CX + Math.sin(f) * (AP - 0.08), bz = CZ + Math.cos(f) * (AP - 0.08), ry = f + Math.PI, ux = Math.cos(f), uz = -Math.sin(f);
      this.panel(bx, 2.0, bz, 4.6, 2.9, ['board_graft', { type: 'solid', color: '#3a2a1e' }], ry);
      const bills = [
        ['bill_garvey', { head: 'COUNTY OF NEW YORK', sub: 'To A. J. Garvey, Plasterer', items: [['Plastering, Court House', ''], ['Two days’ work', '$133,187'], ['', ''], ['', '']], stamp: 'PAID' }],
        ['bill_carpenter', { head: 'COUNTY OF NEW YORK', sub: 'To a Carpenter', items: [['Carpentry, Court House', ''], ['One month', '$360,751'], ['', ''], ['', '']], stamp: 'PAID' }],
        ['bill_chairs', { head: 'COUNTY OF NEW YORK', sub: 'To a Furniture Maker', items: [['3 tables and', ''], ['40 chairs', '$179,729'], ['', ''], ['', '']], stamp: 'PAID' }],
      ];
      bills.forEach(([key, spec], i) => this.panel(bx - ux * (i - 1) * 1.45 + Math.sin(f) * -0.01, 2.0, bz - uz * (i - 1) * 1.45 + Math.cos(f) * -0.01, 1.3, 1.8, [key, { type: 'bill', w: 192, h: 256, ...spec }], ry));
      this.panel(bx - Math.sin(f) * 0.02, 3.75, bz - Math.cos(f) * 0.02, 4.4, 0.45, ['sign_ch_bills', { type: 'sign', title: 'WHAT THIS BUILDING COST', color: '#efe6cc', ink: '#3a2a1e', w: 384, h: 40 }], ry);
      this.readable('graft', bx - Math.sin(f) * 1.6, 1.5, bz - Math.cos(f) * 1.6, { prompt: 'Read the bills on the wall' });
      this.target('graft', bx, 2.0, bz, 9); this.graftPos = [bx - Math.sin(f) * 1.6, bz - Math.cos(f) * 1.6]; }
    // benches between, and spittoons
    for (const k of [3, 5]) { const f = k * Math.PI / 4, x = CX + Math.sin(f) * (AP - 1.2), z = CZ + Math.cos(f) * (AP - 1.2); this.bench(x, z, f + Math.PI); }
    for (const [x, z] of [[-3, -71.8], [3, -71.8], [-7.6, -86], [7.6, -86]]) { const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.2, 0.3, 10), colorMat('#8a6a2a')); sp.position.set(x, 0.15, z); this.scene.add(sp); }
    this.crowd(0, 4, -88, 0); this.crowd(7, -3.4, -90, 0);
    this.noAO = false;
  }

  // ------------------------------------------------------------ Mullett's Post Office at the tip
  postOffice() {
    const shape = new THREE.Shape();
    const z0 = 150; const xEdge = TIP[0] + (BEND[0] - TIP[0]) * (TIP[1] - z0) / (TIP[1] - BEND[1]) - 6;
    shape.moveTo(BW + 2, -z0); shape.lineTo(xEdge, -z0); shape.lineTo(BW + 2, -(TIP[1] - 8)); shape.closePath();
    const body = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 22, bevelEnabled: false }), material(GRANITE[0], GRANITE[1], { repeat: [0.05, 0.05] }));
    body.rotation.x = -Math.PI / 2; this.scene.add(body);
    // Second Empire mansard roof: a smaller, darker copy of the footprint on top
    const cx = (BW + 2 + xEdge + BW + 2) / 3, cz = (z0 + z0 + TIP[1] - 8) / 3;
    const mansard = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 7, bevelEnabled: false }), colorMat('#4a4a52'));
    mansard.rotation.x = -Math.PI / 2; mansard.scale.set(0.88, 0.88, 1); mansard.position.set(cx * 0.12, 22, cz * 0.12); this.scene.add(mansard);
    for (const [x, z] of [[BW + 8, z0 + 4], [xEdge - 6, z0 + 4]]) { const d = new THREE.Mesh(new THREE.SphereGeometry(4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#4a4a52')); d.position.set(x, 31, z); d.scale.y = 1.6; this.scene.add(d); }
    for (let z = z0; z < TIP[1] - 8; z += 2) {
      const xe = BW + 2 + (xEdge - BW - 2) * (1 - (z - z0) / (TIP[1] - 8 - z0));
      this.colliders.push({ minX: BW + 2, maxX: xe, minZ: z, maxZ: z + 2 });
    }
    this.panel((BW + xEdge) / 2, 6, z0 - 0.05, 18, 1.4, ['sign_post_office', { type: 'sign', title: 'POST OFFICE', color: '#3a3a40', ink: '#e8e0c8', w: 384, h: 48 }], Math.PI);
    for (let x = BW + 6; x < xEdge - 3; x += 4) this.panel(x, 10, z0 - 0.04, 2, 3.4, ['window_po', { type: 'window', color: '#4a5058', frame: '#8e8c86', w: 64, h: 96 }], Math.PI);
  }

  // ------------------------------------------------------------ Newspaper Row (east side of Park Row)
  rowBuilding(s0, s1, h, facade, depth = 26) {
    const w = s1 - s0;
    const [fx, fz] = along((s0 + s1) / 2, PR_W);
    const cx = fx + PR.n[0] * depth / 2, cz = fz + PR.n[1] * depth / 2;
    const side = material('wall_brick_side', { type: 'brick', color: '#6e3426' }, { repeat: [4, h / 6] });
    const front = facade ? material(facade[0], facade[1], { repeat: [Math.max(1, Math.round(w / (facade[2] || 8))), 1] }) : side;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, depth), [side, side, colorMat('#2e2a26'), side, side, front]);
    m.position.set(cx, h / 2, cz);
    m.rotation.y = Math.atan2(PR.d[0], PR.d[1]) - Math.PI / 2;
    this.scene.add(m);
    for (let s = s0; s <= s1; s += 0.6) { const [x, z] = along(s, PR_W + 0.3); this.colliders.push({ minX: x - 0.4, maxX: x + 0.4, minZ: z - 0.4, maxZ: z + 0.4 }); }
    return m;
  }
  rowSign(s, y, text, w = 8) {
    const [x, z] = along(s, PR_W - 0.05);
    const p = this.panel(x, y, z, w, 0.9, ['sign_pr_' + text, { type: 'sign', title: text, w: 448, h: 56 }]);
    p.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]);
    return p;
  }

  newspaperRow() {
    const office = (i, c, floors = 6) => [`facade_office_${i}`, { type: 'facade', color: c, floors, bays: 5, lit: 0.15, cornice: '#8a8270', storeFrac: 0.14, w: 256, h: 512 }, 10];
    // from the tip northward
    this.rowBuilding(-10, 30, 22, office(0, '#a8916e'));
    this.rowBuilding(30, 62, 26, office(1, '#8e3b2e'));
    // Potter Building (1886): 11 stories, red brick with orange terra cotta
    this.rowBuilding(62, 92, 45, ['facade_potter', { type: 'facade', color: '#a04a32', floors: 10, bays: 6, lit: 0.12, cornice: '#b5562e', stone: '#b5562e', storeFrac: 0.08, w: 256, h: 768 }, 14]);
    this.rowSign(77, 4.2, 'POTTER BUILDING');
    // Times Building: the old 5-story building, with the new 13-story tower rising around it
    this.rowBuilding(92, 120, 18, office(2, '#b0a090', 5));
    this.timesConstruction(92, 120);
    // Tribune Building (1875): red brick & granite, ~9 stories + clock tower to 260 ft
    const trib = this.rowBuilding(120, 150, 34, ['facade_tribune', { type: 'facade', color: '#9b3d2b', floors: 8, bays: 5, lit: 0.15, cornice: '#9a9890', stone: '#9a9890', storeFrac: 0.1, w: 256, h: 640 }, 15]);
    const [tx, tz] = along(135, PR_W + 6);
    const tower = new THREE.Mesh(new THREE.BoxGeometry(8, 34, 8), material('wall_tribune', { type: 'brick', color: '#9b3d2b' }, { repeat: [2, 6] })); tower.position.set(tx, 34 + 17, tz); tower.rotation.y = trib.rotation.y; this.scene.add(tower);
    const spire = new THREE.Mesh(new THREE.ConeGeometry(6, 12, 4), colorMat('#3a3a3e')); spire.position.set(tx, 74, tz); spire.rotation.y = trib.rotation.y + Math.PI / 4; this.scene.add(spire);
    const clockFace = new THREE.Mesh(new THREE.CircleGeometry(2.2, 20), colorMat('#efe6d0', { basic: true }));
    const [cfx, cfz] = along(135, PR_W + 1.9); clockFace.position.set(cfx, 60, cfz); clockFace.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]); this.scene.add(clockFace);
    this.rowSign(135, 4.6, 'THE TRIBUNE');
    const [ttx, ttz] = along(135, PR_W); this.target('tribune', ttx, 30, ttz, 120);
    // The Evening Courier (our paper), with the Nast cartoon in the window
    this.rowBuilding(150, 172, 24, office(3, '#7a3a2c'));
    this.rowSign(161, 4.2, 'THE EVENING COURIER', 9);
    const [nx, nz] = along(158, PR_W - 0.06);
    const nast = this.panel(nx, 1.8, nz, 1.8, 1.6, ['doc_nast', { type: 'card', title: 'Who Stole the People\'s Money?', lines: 'Thomas Nast, 1871', w: 256, h: 224 }]);
    nast.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]);
    const [rx, rz] = along(158, PR_W - 0.8);
    this.readable('nast', rx, 1.7, rz, { prompt: 'Look at the cartoon in the window', photo: 'nast' });
    const [ox, oz] = along(161.5, PR_W - 2.2);
    this.person('oldrep', ox, oz, 0);
    this.rowBuilding(172, 200, 20, office(0, '#a8916e'));
    this.rowBuilding(200, 228, 28, office(1, '#8e3b2e'));
    this.rowBuilding(228, 262, 22, office(2, '#b0a090'));
    // (gap 262-300: the Brooklyn Bridge entrance)
    this.rowBuilding(300, 340, 20, office(3, '#7a3a2c'));
    // seal the blocks behind Newspaper Row (and the sides of the bridge entrance)
    const B = (s, o) => along(s, PR_W + o);
    for (const [s0, s1] of [[-10, 262], [300, 340]]) { this.blockLine(...B(s0, 0.3), ...B(s0, 26)); this.blockLine(...B(s1, 0.3), ...B(s1, 26)); this.blockLine(...B(s0, 26), ...B(s1, 26)); }
    this.blockLine(...B(340, 0.3), ...B(340, 160)); this.blockLine(...B(-10, 0.3), ...B(-10, 160));
  }

  timesConstruction(s0, s1) {
    // scaffolding + iron frame rising to 13 stories around the old building
    const depth = 26, H = 56;
    const rot = Math.atan2(PR.d[0], PR.d[1]) - Math.PI / 2;
    const g = new THREE.Group();
    const wood = colorMat('#7a6040'), iron = colorMat('#3a3030');
    const w = s1 - s0;
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 4; j++) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(0.35, H, 0.35), (i + j) % 2 ? iron : wood);
      p.position.set(-w / 2 + i * w / 6, H / 2, -depth / 2 + j * depth / 4); g.add(p);
    }
    for (let y = 20; y <= H; y += 4) {
      for (const zz of [-depth / 2, depth / 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.3, 0.3), iron); b.position.set(0, y, zz); g.add(b); }
      for (const xx of [-w / 2, w / 2]) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, depth), iron); b.position.set(xx, y, 0); g.add(b); }
    }
    // open working deck near the top, a derrick, and a brick wall rising on the far side
    const deckTop = new THREE.Mesh(new THREE.BoxGeometry(w - 0.6, 0.2, depth - 0.6), material('floor_construction', { type: 'planks', color: '#7a6040', n: 6 }, { repeat: [6, 6] })); deckTop.position.set(0, 45.1, 0); g.add(deckTop);
    const mast = new THREE.Mesh(new THREE.BoxGeometry(0.4, 16, 0.4), wood); mast.position.set(w / 4, 52, 4); g.add(mast);
    const boom = new THREE.Mesh(new THREE.BoxGeometry(0.3, 13, 0.3), wood); boom.position.set(w / 4 - 4.5, 55, 4); boom.rotation.z = 0.85; g.add(boom);
    const rising = new THREE.Mesh(new THREE.BoxGeometry(w, 5, 0.7), material('wall_brick_side', { type: 'brick', color: '#6e3426' }, { repeat: [5, 1] })); rising.position.set(0, 47.7, depth / 2); g.add(rising);
    for (let i = 0; i < 5; i++) { const pile = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.7, 0.8), colorMat('#8e3b2e')); pile.position.set(-w / 2 + 3 + i * 4.6, 45.55, (i % 2 ? 6 : -4)); g.add(pile); }
    // new brick walls going up on the lower floors (Romanesque granite base)
    const base = new THREE.Mesh(new THREE.BoxGeometry(w + 1, 24, 1), material('wall_times_granite', { type: 'stone', color: '#a8a296', rows: 10 }, { repeat: [4, 3] })); base.position.set(0, 12, depth / 2 + 0.6); g.add(base);
    const [fx, fz] = along((s0 + s1) / 2, PR_W);
    g.position.set(fx + PR.n[0] * depth / 2, 0, fz + PR.n[1] * depth / 2);
    // the base is a facade you can see; make it face the street
    base.position.z = -depth / 2 - 0.6;
    g.rotation.y = rot;
    this.scene.add(g); this.bake(g);
    this.rowSign((s0 + s1) / 2, 3.2, 'NEW TIMES BUILDING · 13 STORIES', 9);
    const [px, pz] = along((s0 + s1) / 2 - 6, PR_W - 2.5);
    this.person('foreman', px, pz, 0);
    this.crowd(4, px + 3, pz - 1, 0); this.crowd(2, px - 2.5, pz + 1.5, 0);
    const [tx, tz] = along((s0 + s1) / 2, PR_W + 4);
    this.target('frame', tx, 30, tz, 80);
    // hoist bucket
    this.bucket = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.7, 0.9), colorMat('#6a4a2a'));
    const [bx, bz] = along((s0 + s1) / 2 + 8, PR_W - 0.8); this.bucket.position.set(bx, 3, bz); this.bucket.userData.keep = true; this.scene.add(this.bucket);
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 50, 4), colorMat('#a08a60')); rope.position.set(bx, 28, bz); this.scene.add(rope);
  }

  // ------------------------------------------------------------ west of Broadway, north of Chambers
  westAndNorth() {
    const fac = (i, c) => [`facade_office_${i}`, { type: 'facade', color: c, floors: 6, bays: 5, lit: 0.15, cornice: '#8a8270', storeFrac: 0.14, w: 256, h: 512 }];
    const cols = ['#a8916e', '#8e3b2e', '#b0a090', '#7a3a2c', '#e0dccd'];
    let z = -150, i = 0;
    while (z < 240) { const d = 18 + (i % 3) * 8; this.building(BW - 50, BW - 24, z, z + d, 18 + (i % 4) * 5, { e: fac(i % 4, cols[i % 5]) }, null, { lot: 10 }); z += d; i++; }
    let x = BW - 24; i = 0;
    while (x < 150) { const w = 16 + (i % 3) * 6; this.building(x, x + w, -170, CHAMBERS - 18, 17 + (i % 4) * 4, { s: fac((i + 1) % 4, cols[(i + 2) % 5]) }, null, { lot: 10 }); x += w; i++; }
    // Centre St / north of the bend
    this.building(CENTRE + 20, 150, CHAMBERS - 18, -60, 20, { w: fac(2, '#8e3b2e') }, null, { lot: 10 });
    this.panel(BW - 23.9, 3.2, 40, 3.2, 0.5, ['sign_street_BROADWAY', { type: 'sign', title: 'BROADWAY', color: '#1d2a3a', ink: '#f0e8d0', w: 192, h: 40 }], Math.PI / 2);
    this.panel(-60, 3.2, CHAMBERS - 17.9, 3.2, 0.5, ['sign_street_CHAMBERS ST', { type: 'sign', title: 'CHAMBERS ST', color: '#1d2a3a', ink: '#f0e8d0', w: 192, h: 40 }], 0);
  }

  // ------------------------------------------------------------ the El, horsecars
  transit() {
    // Third Ave El: comes down Park Row from Chatham Square to the City Hall terminal
    const elS0 = 300, elS1 = 420, deckY = 6;
    const [ax, az] = along(elS0, PR_W - 6), [bx, bz] = along(elS1, PR_W - 6);
    const len = Math.hypot(bx - ax, bz - az), rot = Math.atan2(bx - ax, bz - az);
    for (let s = elS0; s <= elS1; s += 13) for (const off of [PR_W - 9, PR_W - 3]) { const [x, z] = along(s, off); this.box(x, 0, z, 0.35, deckY, 0.35, IRON); }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(7, 0.6, len), material('el_girder', { type: 'planks', color: '#3b3a35', n: 2 }));
    deck.position.set((ax + bx) / 2, deckY + 0.3, (az + bz) / 2); deck.rotation.y = rot; this.scene.add(deck);
    // terminal station: wooden, gabled
    const [stx, stz] = along(305, PR_W - 6);
    const st = new THREE.Mesh(new THREE.BoxGeometry(9, 3.4, 14), material('wall_el_station', { type: 'planks', color: '#6a5a40', n: 4 })); st.position.set(stx, deckY + 2.3, stz); st.rotation.y = rot; this.scene.add(st);
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7, 2.4, 4), colorMat('#3a2a22')); roof.position.set(stx, deckY + 5.2, stz); roof.rotation.y = rot + Math.PI / 4; roof.scale.set(1, 1, 1.6); this.scene.add(roof);
    // stairs down to Park Row
    const [sx, sz] = along(296, PR_W - 6);
    for (let i = 0; i < 14; i++) { const st2 = this.box(sx, i * 0.45, sz + i * 0.42, 1.4, 0.12, 0.5, IRON, { collide: false }); }
    this.box(sx, 0, sz + 3, 1.5, 1.0, 6, IRON);
    const [gx, gz] = along(292, PR_W - 3.5);
    this.panel(gx, 2.8, gz + 0.1, 2.8, 0.5, ['sign_el_station', { type: 'sign', title: '3rd AVE EL · CITY HALL', w: 224, h: 48 }], 0, true);
    this.person('elguard', gx - 1, gz + 1.5, 0);
    const [etx, etz] = along(330, PR_W - 6); this.target('el', etx, deckY, etz, 40);
    // the train shuttles in and out of the terminal
    this.train = this.makeTrain(); this.train.rotation.y = rot;
    this.elLine = { ax, az, bx, bz, len, deckY };

    // Broadway horsecars (Broadway Surface Railroad, 1885)
    const rx = BW - 12;
    for (const dx of [-3.4, -2.2, 2.2, 3.4]) this.box(rx + dx, 0, 40, 0.08, 0.03, 380, '#666', { collide: false });
    this.stopCar = this.horsecar(rx + 2.8, 30, Math.PI, '#d8b23a'); this.bake(this.stopCar);
    this.colliders.push({ minX: rx + 1.7, maxX: rx + 3.9, minZ: 24.4, maxZ: 35.4 });
    this.person('driver', rx + 5.2, 33, 0);
    this.target('horsecar', rx + 2.8, 1.5, 30, 16);
    this.movingCar = this.horsecar(rx - 2.8, 120, 0, '#d8b23a');
    this.movingTarget = this.target('horsecar', rx - 2.8, 1.5, 120, 16);
    this.carS = 40;
    this.rx = rx;
    this.updaters.push((dt, t) => this.animate(dt, t));
  }

  makeTrain() {
    const g = new THREE.Group();
    const eng = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 5), colorMat('#151515')); eng.position.set(0, 1.2, 0); g.add(eng);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1, 8), colorMat('#111')); stack.position.set(0, 2.9, -1.6); g.add(stack);
    for (let i = 1; i <= 3; i++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 9.4), material('el_car', { type: 'planks', color: '#5c1f1f', n: 3 })); car.position.set(0, 1.3, i * 10); g.add(car);
      const trim = new THREE.Mesh(new THREE.BoxGeometry(2.65, 0.12, 9.45), colorMat('#c9a44c')); trim.position.set(0, 2.3, i * 10); g.add(trim);
      for (const sx of [-1, 1]) for (let w = -3.5; w <= 3.5; w += 1.4) { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), colorMat('#e8d090', { basic: true })); win.position.set(sx * 1.31, 1.7, i * 10 + w); win.rotation.y = sx * Math.PI / 2; g.add(win); }
    }
    this.smoke = [];
    for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5), colorMat('#d8d4cc')); p.userData.keep = true; this.scene.add(p); this.smoke.push(p); }
    this.scene.add(g);
    return g;
  }

  horsecar(x, z, ry, color = '#c8a050') {
    const g = new THREE.Group();
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 5), material('horsecar_' + color.slice(1), { type: 'planks', color, n: 3 })); car.position.y = 1.5; g.add(car);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 5.4), colorMat('#5a3a20')); roof.position.y = 2.68; g.add(roof);
    for (let w = -1.8; w <= 1.8; w += 0.9) for (const sx of [-1, 1]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), colorMat('#2a2a2a')); win.position.set(sx * 1.01, 1.9, w); win.rotation.y = sx * Math.PI / 2; g.add(win); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), material('sign_horsecar', { type: 'sign', title: 'BROADWAY', w: 192, h: 40 })); sign.position.set(0, 2.4, -2.51); sign.rotation.y = Math.PI; g.add(sign);
    for (const wz of [-1.6, 1.6]) for (const sx of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12), colorMat('#2a1e14')); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 0.6, 0.38, wz); g.add(wh); }
    const horses = [];
    for (const hx of [-0.4, 0.4]) {
      const horse = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 1.7), colorMat(hx < 0 ? '#5a3a24' : '#3a2416')); body.position.y = 1.25; horse.add(body);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.8, 0.4), colorMat('#4a2e1c')); neck.position.set(0, 1.7, -0.95); neck.rotation.x = -0.5; horse.add(neck);
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.3, 0.6), colorMat('#4a2e1c')); head.position.set(0, 2.0, -1.35); horse.add(head);
      for (const lx of [-0.18, 0.18]) for (const lz of [-0.65, 0.65]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), colorMat('#3a2416')); leg.position.set(lx, 0.45, lz); horse.add(leg); }
      horse.position.set(hx, 0, -4.2); g.add(horse); horses.push(horse);
    }
    g.userData.horses = horses;
    g.position.set(x, 0, z); g.rotation.y = ry;
    this.scene.add(g);
    return g;
  }

  // ------------------------------------------------------------ Brooklyn Bridge
  bridge() {
    // entrance gap on Park Row (s 262..300), approach heading east
    const [ex, ez] = along(281, PR_W);
    const dir = [PR.n[0], PR.n[1]]; const rot = Math.atan2(dir[0], dir[1]); // straight out from Park Row, ESE toward Brooklyn
    const P = (d, y = 0) => [ex + dir[0] * d, ez + dir[1] * d];
    const granite = material('bridge_granite', { type: 'stone', color: '#b7b2a8', rows: 10 });
    // approach: brick/stone viaduct rising from the terminal
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(16, 2, 330), granite);
    const [mx, mz] = P(195); ramp.position.set(mx, 16.2, mz); ramp.rotation.set(0, rot, 0); ramp.rotateX(-0.11); this.scene.add(ramp);
    // the towers: gray granite, twin pointed arches (Manhattan tower ~ compressed distance)
    // Each tower: one block of granite pierced by two pointed Gothic arches above the roadway.
    const sh = new THREE.Shape(); sh.moveTo(-13, 0); sh.lineTo(13, 0); sh.lineTo(13, 84); sh.lineTo(-13, 84); sh.closePath();
    for (const cx of [-5.6, 5.6]) {
      const h = new THREE.Path();
      h.moveTo(cx - 3.3, 42); h.lineTo(cx - 3.3, 58); h.quadraticCurveTo(cx - 3.3, 66, cx, 72); h.quadraticCurveTo(cx + 3.3, 66, cx + 3.3, 58); h.lineTo(cx + 3.3, 42); h.closePath();
      sh.holes.push(h);
    }
    const towerGeo = new THREE.ExtrudeGeometry(sh, { depth: 9, bevelEnabled: false, curveSegments: 6 });
    towerGeo.translate(0, 0, -4.5);
    const tuv = towerGeo.attributes.uv; for (let i = 0; i < tuv.count; i++) tuv.setXY(i, tuv.getX(i) / 14, tuv.getY(i) / 14);
    for (const d of [360, 846]) {
      const [tx, tz] = P(d);
      const tw = new THREE.Mesh(towerGeo, granite); tw.position.set(tx, 0, tz); tw.rotation.y = rot; this.scene.add(tw);
      const capTop = new THREE.Mesh(new THREE.BoxGeometry(28, 3, 10.5), granite); capTop.position.set(tx, 85.5, tz); capTop.rotation.y = rot; this.scene.add(capTop);
      const foot = new THREE.Mesh(new THREE.BoxGeometry(30, 10, 12), granite); foot.position.set(tx, 5, tz); foot.rotation.y = rot; this.scene.add(foot);
    }
    const [d0x, d0z] = P(360), [d1x, d1z] = P(846);
    const deck = new THREE.Mesh(new THREE.BoxGeometry(18, 2, 486 + 300), colorMat('#5a5248'));
    deck.position.set((d0x + d1x) / 2, 41, (d0z + d1z) / 2); deck.rotation.y = rot; this.scene.add(deck);
    // main cables, buff-colored, sagging between towers
    const cableMat = new THREE.LineBasicMaterial({ color: 0xc8b58e });
    for (const side of [-7, 7]) {
      const pts = [];
      const nrm = [-dir[1], dir[0]];
      for (let i = 0; i <= 30; i++) { const u = i / 30, d = 360 + u * 486; const [x, z] = P(d); pts.push(new THREE.Vector3(x + nrm[0] * side, 84 - Math.sin(u * Math.PI) * 40, z + nrm[1] * side)); }
      for (let i = 0; i <= 10; i++) { const u = i / 10; const [x, z] = P(360 - u * 160); pts.unshift(new THREE.Vector3(x + nrm[0] * side, 84 - u * 60, z + nrm[1] * side)); }
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), cableMat));
    }
    const river = new THREE.Mesh(new THREE.PlaneGeometry(500, 1600), material('water_harbor', { type: 'water' }, { repeat: [40, 120] }));
    const [rvx, rvz] = P(600); river.rotation.x = -Math.PI / 2; river.position.set(rvx, -0.5, rvz); this.scene.add(river);
    const [btx, btz] = P(360); this.target('bridge', btx, 40, btz, 700);
    // terminal sign and a railing at the end of the walkable approach
    const [sgx, sgz] = along(281, PR_W + 0.2);
    const sgn = this.panel(sgx, 4.6, sgz, 10, 1, ['sign_bridge_terminal', { type: 'sign', title: 'NEW YORK & BROOKLYN BRIDGE', w: 448, h: 48 }]);
    sgn.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]);
    const [rlx, rlz] = P(26);
    this.wallLine(rlx - dir[1] * 19.5, rlz + dir[0] * 19.5, rlx + dir[1] * 19.5, rlz - dir[0] * 19.5, 1.1, IRON, 0.15);
    for (const side of [-8, 8]) { const [a1, b1] = P(0); const [a2, b2] = P(26); this.wallLine(a1 - dir[1] * side, b1 + dir[0] * side, a2 - dir[1] * side, b2 + dir[0] * side, 1.1, IRON, 0.15); }
    const [rdx, rdz] = P(22); this.readable('bridge', rdx, 1.3, rdz, { prompt: 'Look at the Brooklyn Bridge' });
  }

  parkLife() {
    [[-50, 50, 1], [-30, 30, 3], [-10, 40, 6], [-60, 90, 7], [-45, 110, 2], [-20, 20, 5], [20, 30, 0], [-70, 0, 4], [30, -30, 2], [-25, -40, 6]].forEach(([x, z, n]) => this.crowd(n, x, z, 0));
    // Park Row sidewalk crowds
    for (let s = 20; s < 260; s += 18) { const [x, z] = along(s, PR_W - 3); this.crowd(Math.floor(s) % 8, x, z, 0); }
    for (const [x, z] of [[-30, 50, true], [30, 25, false], [-60, 140, false], [BW - 1.2, 0, true], [BW - 1.2, 100, false]]) this.gaslamp(x, z, false);
  }

  gaslamp(x, z) {
    this.box(x, 0, z, 0.14, 2.9, 0.14, '#23261f', { collide: true });
    this.box(x, 2.6, z, 0.7, 0.05, 0.05, '#23261f', { collide: false });
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.15, 0.5, 4), colorMat('#b8a888')); lantern.position.set(x, 3.15, z); lantern.rotation.y = Math.PI / 4; this.scene.add(lantern);
  }

  wires() {
    const mat = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
    const line = (pa, pb) => {
      for (let k = 0; k < 5; k++) for (const o of [-1.2, -0.4, 0.4, 1.2]) {
        const pts = []; for (let t = 0; t <= 6; t++) { const u = t / 6; pts.push(new THREE.Vector3(pa[0] + (pb[0] - pa[0]) * u + o * 0.3, 14 + k * 0.9 - Math.sin(u * Math.PI) * 0.6, pa[1] + (pb[1] - pa[1]) * u + o)); }
        this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
      }
    };
    const pole = ([x, z]) => { this.box(x, 0, z, 0.32, 18.5, 0.32, '#4a3a2a'); for (let k = 0; k < 5; k++) this.box(x, 14 + k * 0.9, z, 3, 0.12, 0.12, '#4a3a2a', { collide: false }); };
    // along Broadway (east curb) and along Park Row (east curb)
    let prev = null;
    for (let z = 220; z > -120; z -= 30) { const p = [BW - 1.5, z]; pole(p); if (prev) line(prev, p); prev = p; }
    prev = null;
    for (let s = 10; s < 260; s += 30) { const p = along(s, PR_W - 1.5); pole(p); if (prev) line(prev, p); prev = p; }
  }

  animate(dt, t) {
    // El train shuttles in and out of the City Hall terminal
    const L = this.elLine, period = 30, tt = (t % period) / period;
    const k = tt < 0.4 ? tt / 0.4 : tt < 0.6 ? 1 : 1 - (tt - 0.6) / 0.4;   // 0 = far, 1 = at terminal
    const f = 1 - k;
    this.train.position.set(L.ax + (L.bx - L.ax) * (0.08 + f * 0.92), L.deckY + 0.6, L.az + (L.bz - L.az) * (0.08 + f * 0.92));
    const p = this.game.controls.pos;
    if (Math.abs(tt - 0.6) < dt / period && p.x < 400) sfx('train');
    this.smoke.forEach((s, i) => { const age = (t * 0.8 + i * 0.2) % 1; s.position.set(this.train.position.x, this.train.position.y + 3 + age * 3, this.train.position.z + age * 2); s.scale.setScalar(0.5 + age * 1.5); s.visible = k > 0.05 && k < 0.95; });
    // Broadway horsecar (waits if you stand in its path)
    const span = 300, speed = 2.6, cz = this.movingCar.position.z, north = this.movingCar.rotation.y === 0;
    const ahead = (p.z - cz) * (north ? -1 : 1);
    const blocked = Math.abs(p.x - (this.rx - 2.8)) < 1.5 && ahead > -3 && ahead < 8;
    if (!blocked) this.carS += dt * speed;
    const s = this.carS % (span * 2), goingNorth = s < span;
    const pz = goingNorth ? 220 - s : 220 - (span * 2 - s);
    this.movingCar.position.z = pz; this.movingCar.rotation.y = goingNorth ? 0 : Math.PI;
    this.movingTarget.pos.z = pz;
    this.movingCar.userData.horses.forEach((h, j) => h.children.slice(3).forEach((l, i) => { l.rotation.x = blocked ? 0 : Math.sin(t * 8 + i * 1.6 + j) * 0.4; }));
    if (this.bucket) this.bucket.position.y = 3 + (Math.sin(t * 0.3) * 0.5 + 0.5) * 40;
  }

  rideStep(dt) {
    const w = this.where;
    this.skyCity.visible = w !== 'park'; this.skyPark.visible = w === 'park';
    const r = this.ride; if (!r) return;
    if (this.game.mode === 'play') r.t -= dt;   // the ride waits while you talk or read
    if (r.kind === 'cab') this.shaftTex.offset.y -= r.dir * dt * 0.42;
    else { this.carTex[0].offset.x += r.dir * dt * 0.75; this.carTex[1].offset.x -= r.dir * dt * 0.75; this.game.controls.shake = 0.35; }
    if (r.t <= 0) { this.ride = null; this.arrive(r.dest); }
  }

  // ------------------------------------------------------------ the 1888 mayoral election
  election() {
    const two = (x, y, z, w, h, ry, key, text) => {
      const dx = Math.sin(ry) * 0.03, dz = Math.cos(ry) * 0.03;
      this.panel(x + dx, y, z + dz, w, h, [key, { type: 'banner', title: text, w: 512, h: 112 }], ry);
      this.panel(x - dx, y, z - dz, w, h, [key, { type: 'banner', title: text, w: 512, h: 112 }], ry + Math.PI);
    };
    const GRANT = 'FOR MAYOR\nHUGH J. GRANT\nREGULAR DEMOCRATIC NOMINEE · TAMMANY HALL';
    // across Broadway, on poles in the park by the courthouse, and along Park Row
    two(BW - 12, 8, 70, 12, 2.4, 0, 'banner_grant', GRANT); this.box(BW - 12, 9.3, 70, 24, 0.04, 0.04, '#3a3a3a', { collide: false });
    two(BW - 12, 8, -20, 12, 2.4, 0, 'banner_hewitt', 'RE-ELECT\nMAYOR HEWITT\nCITIZENS\' TICKET'); this.box(BW - 12, 9.3, -20, 24, 0.04, 0.04, '#3a3a3a', { collide: false });
    for (const x of [-26, -16]) this.box(x, 0, -44, 0.16, 6.5, 0.16, '#4a3a2a');
    two(-21, 5.4, -44, 9.4, 1.9, 0, 'banner_grant', GRANT);
    this.target('banner2', -21, 5.4, -44, 28);
    this.readable('banner', -21, 1.6, -42.6, { prompt: 'Look at the election banner', r: 2.4 });
    const [ex, ez] = along(215, PR_W - 0.4); const e = this.panel(ex, 6.5, ez, 10, 2, ['banner_erhardt', { type: 'banner', title: 'FOR MAYOR\nJOEL B. ERHARDT\nREPUBLICAN TICKET', w: 512, h: 112 }]); e.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]);
  }

  // ------------------------------------------------------------ people and traffic in motion
  streetLife() {
    for (let i = 0; i < 6; i++) this.walker(i, [[BW - 4 - (i % 2), 200 - i * 20], [BW - 4 - (i % 2), -100 + i * 12]], { speed: 1.1 });          // Broadway sidewalk
    for (let i = 0; i < 5; i++) this.walker(i + 3, [[-43.7 + (i % 2) * 7.4, 130 - i * 8], [-43.7 + (i % 2) * 7.4, 22 + i * 4]], { speed: 0.9 });  // park walk
    for (let i = 0; i < 4; i++) this.walker(i + 1, [[-58 + i * 6, -45.3], [58 - i * 5, -45.3]], { speed: 1 });                                  // in front of the courthouse
    for (let i = 0; i < 8; i++) this.walker(i + 2, [along(15 + i * 12, PR_W - 4.6 + (i % 2)), along(250 - i * 9, PR_W - 4.6 + (i % 2))], { speed: 1.15 }); // Newspaper Row
    for (let i = 0; i < 3; i++) this.walker(5, [along(150 + i * 3, PR_W - 6), along(120 - i * 5, PR_W - 6.5)], { speed: 2.2, scale: 0.75, id: 'newsboy' }); // newsboys running papers
    this.mover(this.wagon('#5a4630', '#c8c0a8'), [along(10, 9), along(255, 9), along(255, 15), along(10, 15)], 2.6);
    this.mover(this.wagon('#2e3a4a', '#8a7a5a'), [[BW - 21, -100], [BW - 21, 215], [BW - 18.5, 215], [BW - 18.5, -100]], 2.4);
    // Central Park strollers on the Mall
    for (let i = 0; i < 7; i++) this.walker(i, [[PX - 3.5 + i, 58 - i * 3], [PX - 3.5 + i, -30 + i * 2]], { speed: 0.75 });
  }

  // ======================================================== CENTRAL PARK (1888)
  centralPark() {
    const X = PX;
    // lawns: the whole park at street level, except the sunken lower terrace and the Lake
    this.floor(X, 22, 130, 106, [GRASS[0], GRASS[1], { repeat: [30, 24] }]);
    for (const sx of [-1, 1]) this.floor(X + sx * 44, -50, 40, 38, [GRASS[0], GRASS[1], { repeat: [9, 9] }]);
    // The Mall: runs north to Bethesda Terrace; elms planted 1860s-70s (canopy not yet closed)
    this.floor(X, 17, 12, 96, [PATH[0], PATH[1], { repeat: [3, 24] }], 0.012);
    for (let z = 60; z > -26; z -= 7) for (const dx of [-8, -11, 8, 11]) this.tree(X + dx, z, 1.5);
    // Literary Walk at the south end of the Mall: Shakespeare and Scott (both 1872), brown bronze on granite
    const bronze = colorMat('#5a4632');
    for (const [dx, name] of [[-7, 'SHAKESPEARE'], [7, 'SCOTT']]) {
      this.box(X + dx, 0, 58, 1.2, 2.2, 1.2, '#9a948a');
      const body = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.45, 1.7, 8), bronze); body.position.set(X + dx, 3.05, 58); this.scene.add(body);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), bronze); hd.position.set(X + dx, 4.1, 58); this.scene.add(hd);
      this.panel(X + dx, 1.4, 58.62, 1.0, 0.24, ['sign_statue_' + name, { type: 'sign', title: name, color: '#8a847a', ink: '#2a2420', w: 192, h: 40 }]);
    }
    // the Mall bandstand (1862, painted cast iron; Sunday concerts drew huge crowds; removed 1923)
    this.pavilion(X - 18, -12, 4.2, 3.4);
    const bandRoof = new THREE.Mesh(new THREE.ConeGeometry(5.0, 2.4, 8), colorMat('#8a3a2a')); bandRoof.position.set(X - 18, 4.9, -12); this.scene.add(bandRoof);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(0.35, 8, 6), colorMat('#b8913a')); fin.position.set(X - 18, 6.3, -12); this.scene.add(fin);
    this.box(X - 18, 0, -12, 8.4, 0.5, 8.4, '#7a6a5a', { collide: false });
    this.colliders.push({ minX: X - 22.2, maxX: X - 13.8, minZ: -16.2, maxZ: -7.8 });
    for (let i = 0; i < 9; i++) this.box(X - 18 + Math.sin(i * 0.7) * 6.5, 0, -12 + Math.cos(i * 0.7) * 6.5 * 0 + (i - 4) * 1.4, 0.5, 0.45, 1.6, '#5a4030');   // folding chairs set out
    // BETHESDA TERRACE (olive-buff sandstone, 1864-73): from the top of the grand stair you look down
    // on the lower terrace, the Angel of the Waters (Emma Stebbins, 1873) and the Lake.
    const sand = material('stone_bethesda', { type: 'stone', color: '#a89f7a', mortar: '#8c8466', rows: 4 });
    const LOW = -3.5, TOP = -31, BOT = -38.5, FAR = -68;
    for (const sx of [-1, 1]) this.floor(X + sx * 15.7, -34, 16.6, 6, ['pave_bethesda_upper', { type: 'stone', color: '#b0a684', mortar: '#8c8466', rows: 3 }, { repeat: [4, 2] }], 0.013);
    this.floor(X, -30.6, 14.8, 1.2, ['pave_bethesda_upper', {}, { repeat: [4, 1] }], 0.013);
    // carved sandstone balustrade along the drop (you can lean on it, not climb over)
    const rail = (x0, z0, x1, z1) => {
      const len = Math.hypot(x1 - x0, z1 - z0), ry = -Math.atan2(z1 - z0, x1 - x0);
      this.box((x0 + x1) / 2, 0.95, (z0 + z1) / 2, len, 0.16, 0.42, sand, { collide: false, ry });
      this.box((x0 + x1) / 2, 0, (z0 + z1) / 2, len, 0.18, 0.46, sand, { collide: false, ry });
      for (let d = 0.3; d < len; d += 0.42) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.11, 0.78, 6), sand); b.position.set(x0 + (x1 - x0) * d / len, 0.57, z0 + (z1 - z0) * d / len); this.scene.add(b); }
      this.blockLine(x0, z0, x1, z1);
    };
    rail(X - 24, -37, X - 7.4, -37); rail(X + 7.4, -37, X + 24, -37); rail(X - 7.4, TOP, X + 7.4, TOP);
    rail(X - 7.4, TOP, X - 7.4, -37); rail(X + 7.4, TOP, X + 7.4, -37);
    rail(X - 24, -37, X - 24, FAR); rail(X + 24, -37, X + 24, FAR);
    // the grand stair down to the lower terrace
    for (let i = 0; i < 14; i++) this.box(X, LOW, TOP - 0.25 - i * (BOT - TOP) / -14, 14, (14 - i) * (-LOW / 14), (TOP - BOT) / 14 + 0.02, sand, { collide: false });
    for (const sx of [-1, 1]) this.box(X + sx * 7.4, LOW, (TOP + BOT) / 2, 0.8, -LOW + 0.9, TOP - BOT, sand, { collide: false });
    // retaining walls and the arcade front under the upper terrace
    for (const sx of [-1, 1]) this.box(X + sx * 24.3, LOW, (-37 + FAR) / 2, 0.6, -LOW, -37 - FAR, sand, { collide: false });
    for (const sx of [-1, 1]) this.box(X + sx * 15.7, LOW, -37.2, 16.6, -LOW, 0.6, sand, { collide: false });
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) this.panel(X + sx * (10.5 + i * 5), LOW + 1.5, -37.52, 2.2, 3, ['arch_bethesda', { type: 'doorway', frame: '#a89f7a', w: 96, h: 128 }], Math.PI);
    // lower terrace paving, the fountain and its angel
    this.floor(X, (BOT + FAR) / 2, 48, BOT - FAR, ['pave_bethesda_lower', { type: 'stone', color: '#b0a684', mortar: '#8c8466', rows: 3 }, { repeat: [12, 8] }], LOW);
    const FZ = -54;
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(7, 7.3, 0.8, 32), sand); basin.position.set(X, LOW + 0.4, FZ); this.scene.add(basin);
    const water = new THREE.Mesh(new THREE.CircleGeometry(6.7, 32), colorMat('#5a7a88')); water.rotation.x = -Math.PI / 2; water.position.set(X, LOW + 0.72, FZ); this.scene.add(water);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 0.8, 0.6, 16), sand); bowl.position.set(X, LOW + 2.6, FZ); this.scene.add(bowl);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.3, 2.4, 10), sand); ped.position.set(X, LOW + 1.4, FZ); this.scene.add(ped);
    const ped2 = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.6, 1.6, 8), sand); ped2.position.set(X, LOW + 3.6, FZ); this.scene.add(ped2);
    const robe = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.75, 2.2, 8), bronze); robe.position.set(X, LOW + 5.5, FZ); this.scene.add(robe);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.26, 8, 6), bronze); head.position.set(X, LOW + 6.85, FZ); this.scene.add(head);
    const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 1.0, 6), bronze); arm.position.set(X + 0.45, LOW + 6.6, FZ + 0.1); arm.rotation.z = -0.9; this.scene.add(arm);
    for (const sx of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 1.3, 0.07), bronze); wing.position.set(X + sx * 0.85, LOW + 6.3, FZ - 0.25); wing.rotation.set(0.2, sx * 0.35, sx * 0.55); this.scene.add(wing); }
    // four cherubs (Temperance, Purity, Health, Peace) round the pedestal
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, c = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), bronze); c.position.set(X + Math.sin(a) * 1.1, LOW + 2.1, FZ + Math.cos(a) * 1.1); this.scene.add(c); }
    this.target('park', X, LOW + 4, FZ, 50);
    // The Lake beyond, with rowboats for hire
    const lake = new THREE.Mesh(new THREE.CircleGeometry(30, 40), material('water_harbor', { type: 'water' }, { repeat: [8, 8] }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(X, LOW - 0.25, -96); lake.scale.x = 2.4; this.scene.add(lake);
    for (const sx of [-1, 1]) this.box(X + sx * 44, LOW - 0.3, FAR, 40, -LOW + 0.3, 0.6, sand, { collide: false });
    this.box(X, LOW - 0.3, FAR, 48, 0.55, 0.6, sand, { collide: false });
    for (const [dx, dz, ry] of [[-14, -80, 0.4], [10, -88, -0.7], [26, -78, 1.2]]) { const boat = this.box(X + dx, LOW - 0.35, dz, 1.2, 0.4, 3.2, '#6a4a2a', { collide: false, ry }); }
    this.colliders.push({ minX: X - 66, maxX: X + 66, minZ: -112, maxZ: FAR - 0.5, see: true });
    // Sheep Meadow to the west, with the park's flock (grazing there since 1864)
    for (let i = 0; i < 14; i++) {
      const sx = X - 30 - (i * 7.3) % 26, sz = -10 + ((i * 13.7) % 50);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.9), colorMat('#e8e2d2')); body.position.set(sx, 0.55, sz); body.rotation.y = i; this.scene.add(body); this.colliders.push({ minX: sx - 0.5, maxX: sx + 0.5, minZ: sz - 0.5, maxZ: sz + 0.5, see: true });
      const head = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.22, 0.3), colorMat('#2a2420')); head.position.set(sx + Math.sin(i) * 0.5, 0.6, sz + Math.cos(i) * 0.5); head.rotation.y = i; this.scene.add(head);
    }
    this.target('park', X - 40, 1, 10, 30);
    // wooden-slat benches on iron frames, a rustic cedar shelter, sparse gas lamps
    for (const dz of [45, 30, 15, 0, -15]) for (const sx of [-1, 1]) this.box(X + sx * 6.5, 0, dz, 0.6, 0.45, 2, '#5a4030');
    const shelter = new THREE.Mesh(new THREE.ConeGeometry(4, 2.5, 6), colorMat('#5a4630')); shelter.position.set(X + 30, 4, 20); this.scene.add(shelter);
    for (const [dx, dz] of [[-2.5, -2], [2.5, -2], [-2.5, 2], [2.5, 2]]) this.box(X + 30 + dx, 0, 20 + dz, 0.25, 3, 0.25, '#5a4630');
    for (const dz of [50, 20, -10]) this.gaslamp(X + 6.5, dz);
    // "Keep off the grass" boards
    for (const [dx, dz] of [[-14, 40], [14, 10], [-14, -20]]) { this.box(X + dx, 0, dz, 0.06, 0.6, 0.06, '#eee', { collide: false }); this.panel(X + dx, 0.75, dz, 0.6, 0.3, ['sign_keep_off', { type: 'sign', title: 'KEEP OFF THE GRASS', color: '#f0ece0', ink: '#2a2420', w: 192, h: 64 }], 0, true); }
    this.panel(X + 3, 1.6, 64.07, 1.2, 0.8, ['sign_park_rules', { type: 'card', title: 'Keep Off the Grass', lines: 'By order of the Park Commissioners', w: 192, h: 128 }], 0);
    this.box(X + 3, 0, 64, 0.12, 1.4, 0.12, '#333');
    this.readable('parkrules', X + 3, 1.5, 64.6, { prompt: 'Read the sign', photo: 'parkrules' });
    // people: the keeper, the Sunday family from Hester Street, strollers; carriages on the Drive
    this.person('keeper', X + 1.6, 56, 0);
    this.person('chana', X + 7.5, 22, 0, { talk: 'chanapark', photo: 'sunday' });
    this.person('girl', X + 5.2, 20.5, 0, { talk: 'girlpark', photo: 'sunday' });
    [[-2, 40, 0], [2, 30, 3], [-1, 5, 4], [3, -10, 2], [-3, -20, 7], [-16, -14, 5], [-20, -9, 1]].forEach(([dx, dz, n]) => this.crowd(n, X + dx, dz, 0));
    [[-5, -48, 1], [6, -50, 6], [-12, -60, 2], [9, -62, 3]].forEach(([dx, dz, n]) => this.crowd(n, X + dx, dz, 0, { y: -3.5 }));
    this.floor(X + 45, -5, 8, 140, [PATH[0], PATH[1], { repeat: [2, 35] }], 0.012);
    this.carriage = this.horsecar(X + 45, 40, 0, '#1d1d24');
    this.carriage.scale.set(0.8, 0.8, 0.55);
    this.updaters.push((dt, t) => { this.carriage.position.z = 60 - ((t * 3) % 140); });
    // back downtown / write the story
    this.interact({ x: X - 4, z: 66, r: 2.4, prompt: 'Ride the El back downtown', action: () => this.rideDown() });
  }

  // ======================================================== ELEVATOR, ROOFTOP, EL CAR
  sets() {
    // --- Otis passenger elevator cab (built far away; the "ride" is the shaft sliding past the gate) ---
    const E = { x: -6000, z: 0 };
    const PANEL = ['wall_elevator_cab', { type: 'planks', color: '#5a3a24', n: 5 }];
    this.floor(E.x, E.z, 2.5, 2.5, ['floor_elevator', { type: 'planks', color: '#6a4a2e', n: 6 }], 0.01);
    this.ceiling(E.x, E.z, 2.5, 2.5, PANEL, 2.5);
    this.box(E.x, 0, E.z - 1.3, 2.7, 2.5, 0.1, PANEL, { collide: false });
    for (const sx of [-1, 1]) this.box(E.x + sx * 1.3, 0, E.z, 0.1, 2.5, 2.7, PANEL, { collide: false });
    for (let x = -1.2; x <= 1.21; x += 0.2) this.box(E.x + x, 0, E.z + 1.25, 0.025, 2.5, 0.025, '#b8913a', { collide: false });   // brass folding gate
    for (const y of [0.9, 1.7]) this.box(E.x, y, E.z + 1.25, 2.5, 0.03, 0.03, '#b8913a', { collide: false });
    this.shaftTex = texture('elevator_shaft', { type: 'shaft', w: 256, h: 256 }, [1, 3]);
    const shaft = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 10.5), new THREE.MeshLambertMaterial({ map: this.shaftTex }));
    shaft.position.set(E.x, 1.6, E.z + 1.75); shaft.rotation.y = Math.PI; shaft.userData.keep = true; this.scene.add(shaft);
    this.person('elevator', E.x - 0.8, E.z - 0.6, 0, { photo: null });
    this.lamp(E.x, 2.25, E.z, 0xffd8a0, 3, 5);
    this.cab = { x: E.x, z: E.z, cols: [{ minX: E.x - 1.1, maxX: E.x - 0.5, minZ: E.z - 0.9, maxZ: E.z - 0.3 }], bounds: { minX: E.x - 1.15, maxX: E.x + 1.15, minZ: E.z - 1.15, maxZ: E.z + 1.1 } };

    // --- Elevated railway car (the tenement fronts slide past the windows at third-floor height) ---
    const C = { x: -6000, z: 300 };
    const CAR = ['wall_el_car_inside', { type: 'planks', color: '#6a4a30', n: 5 }];
    this.floor(C.x, C.z, 2.7, 10, ['floor_elevator', {}], 0.01);
    this.ceiling(C.x, C.z, 2.7, 10, CAR, 2.3);
    for (const sx of [-1, 1]) {
      this.box(C.x + sx * 1.33, 0, C.z, 0.08, 0.95, 10, CAR, { collide: false });
      this.box(C.x + sx * 1.33, 2.0, C.z, 0.08, 0.3, 10, CAR, { collide: false });
      this.box(C.x + sx * 1.0, 0, C.z, 0.5, 0.45, 9.4, ['seat_el_car', { type: 'solid', color: '#7a2a24' }], { collide: false });   // rattan/plush bench
      for (let z = -5; z <= 5.01; z += 1.25) this.box(C.x + sx * 1.33, 0.95, C.z + z, 0.08, 1.05, 0.1, CAR, { collide: false });
    }
    for (const ez of [-5, 5]) this.box(C.x, 0, C.z + ez, 2.7, 2.3, 0.08, CAR, { collide: false });
    const fac = { type: 'facade', color: '#8e3b2e', floors: 5, bays: 4, escape: true, lit: 0.3, cornice: '#3b3530', w: 256, h: 512 };
    this.carTex = [];
    for (const sx of [-1, 1]) {
      const t = texture('facade_tenement_0', fac, [9, 1]); this.carTex.push(t);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(68, 19), new THREE.MeshLambertMaterial({ map: t }));
      m.position.set(C.x + sx * 4.6, 2.9, C.z); m.rotation.y = -sx * Math.PI / 2; m.userData.keep = true; this.scene.add(m);
    }
    this.floor(C.x, C.z, 12, 70, '#3a3630', -6.6);
    for (const [dx, dz, n] of [[-0.95, -3, 1], [0.95, -1.5, 4], [-0.95, 1, 6], [0.95, 3.2, 3], [0.95, -3.8, 5]]) this.crowd(n, C.x + dx, C.z + dz, 0, { scale: 0.8, y: 0.2 });
    this.car = { x: C.x, z: C.z, cols: [], bounds: { minX: C.x - 0.62, maxX: C.x + 0.62, minZ: C.z - 4.6, maxZ: C.z + 4.6 } };
  }

  roof() {
    // Potter Building roof (11 stories, 45 m up) and the open top floors of the Times Building next door
    const Y = 45, S0 = 62, S1 = 92, D = 26;
    const P = (s, d) => along(s, PR_W + d);
    const BRICK = ['wall_brick_side', { type: 'brick', color: '#6e3426' }];
    const cols = [];
    const blob = (x, z) => cols.push({ minX: x - 0.38, maxX: x + 0.38, minZ: z - 0.38, maxZ: z + 0.38 });
    const edge = (a, b, hgt = 0.95) => { const [ax, az] = a, [bx, bz] = b, L = Math.hypot(bx - ax, bz - az); this.wallLine(ax, az, bx, bz, hgt, BRICK, 0.45, Y); for (let d = 0; d <= L; d += 0.5) blob(ax + (bx - ax) * d / L, az + (bz - az) * d / L); };
    edge(P(S0, 0), P(S1, 0)); edge(P(S1, 0), P(S1, D), 0.45); edge(P(S1, D), P(S0, D)); edge(P(S0, D), P(S0, 0));
    this.floorAt = (pts, mat, y) => { const sh = new THREE.Shape(); pts.forEach(([x, z], i) => i ? sh.lineTo(x, -z) : sh.moveTo(x, -z)); const m = new THREE.Mesh(new THREE.ShapeGeometry(sh), mat); m.rotation.x = -Math.PI / 2; m.position.y = y; this.scene.add(m); };
    this.floorAt([P(S0, 0), P(S1, 0), P(S1, D), P(S0, D)], colorMat('#4a4640'), Y + 0.04);
    // elevator bulkhead with the door back down
    const [b0x, b0z] = P(75.4, 21), [b1x, b1z] = P(78.6, 21);
    this.wallLine(b0x, b0z, b1x, b1z, 2.9, BRICK, 3.2, Y);
    for (let s = 75.4; s <= 78.6; s += 0.5) for (let d = 19.4; d <= 22.6; d += 0.5) blob(...P(s, d));
    const [dx, dz] = P(77, 19.34);
    const door = this.panel(dx, Y + 1.15, dz, 1.3, 2.2, ['door_elevator', { type: 'planks', color: '#3a2a1c', n: 2 }]); door.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]);
    const [ix, iz] = P(77, 18.2);
    this.interact({ x: ix, y: Y + 1.2, z: iz, r: 2.2, prompt: 'Take the elevator back down', action: () => this.startRide('cab', 'street') });
    // rooftop water tank and chimneys
    const [wx, wz] = P(67, 21); const tank = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 1.5, 3, 12), material('wood_water_tank', { type: 'planks', color: '#5a4630', n: 8 })); tank.position.set(wx, Y + 3, wz); this.scene.add(tank);
    const cone = new THREE.Mesh(new THREE.ConeGeometry(1.7, 1.1, 12), colorMat('#3a3028')); cone.position.set(wx, Y + 5.05, wz); this.scene.add(cone);
    for (const [ds, dd] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const [lx, lz] = P(67 + ds, 21 + dd); this.box(lx, Y, lz, 0.2, 1.5, 0.2, '#3a3028', { collide: false }); }
    for (let s = 65.5; s <= 68.5; s += 0.5) for (let d = 19.5; d <= 22.5; d += 0.5) blob(...P(s, d));
    for (const [cs, cd] of [[86, 22], [70, 6]]) { const [cx, cz] = P(cs, cd); this.box(cx, Y, cz, 0.9, 1.8, 0.9, BRICK, { collide: false }); blob(cx, cz); }
    // the view
    const [vx, vz] = P(64.5, 1.6);
    this.readable('rooftop', vx, Y + 1.2, vz, { prompt: 'Look out over the city' });
    const [tx, tz] = along(30, -40); this.target('rooftop', tx, 30, tz, 140);
    // men at work on the exposed upper floors of the Times Building, at eye level across the gap
    const men = [[96.5, 6, 'worker0'], [101, 13, 'worker1'], [108, 7, 'worker0'], [99, 20, 'worker1'], [113, 17, 'worker0'], [105, 22, 'worker1']];
    men.forEach(([s, d, art], i) => { const [x, z] = P(s, d); this.crowd(i, x, z, 0, { y: 45.2, art }); });
    const [hx, hz] = P(94.6, 9);
    this.deckGius = this.person('giuseppe', hx, hz, 0, { y: 45.2, talk: null, photo: 'hodcarrier' });
    this.deckTalk = this.interact({ x: hx, y: Y + 1.3, z: hz, r: 7, prompt: 'Wave and call across to Giuseppe', action: () => this.game.talk('giuseppe_roof') });
    const onDeck = !this.night && flag('gius_decided') && !flag('saw_fall');
    this.deckGius.group.visible = onDeck; this.deckTalk.hidden = !onDeck;
    const [fx, fz] = P(104, 12); this.target('frame', fx, 45.5, fz, 45);
    const [sx, sz] = P(77, 14);
    this.roofSet = { cols, bounds: { minX: -1e5, maxX: 1e5, minZ: -1e5, maxZ: 1e5 }, y: Y + 0.05, spawn: [sx, sz, Math.atan2(-PR.d[0], -PR.d[1])] };
    // street door of the Potter Building
    const [px, pz] = along(77, PR_W - 0.07);
    const sd = this.panel(px, 1.5, pz, 2.2, 3, ['door_potter', { type: 'planks', color: '#3a2a1c', n: 2 }]); sd.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]);
    const [qx, qz] = along(77, PR_W - 1.3);
    this.potterDoor = [qx, qz];
    this.interact({ x: qx, z: qz, r: 2.4, prompt: 'Ride the elevator to the roof', action: () => this.startRide('cab', 'roof') });
  }

  /** kind: 'cab' (elevator) or 'car' (El). dest: 'roof' | 'street' | 'park' | 'downtown' */
  startRide(kind, dest) {
    const c = this.game.controls, set = kind === 'cab' ? this.cab : this.car;
    this.fade(() => {
      this.where = kind; this.ride = { kind, dest, t: kind === 'cab' ? 7 : 9, dir: (dest === 'roof' || dest === 'park') ? 1 : -1 };
      this.colliders = set.cols; this.bounds = set.bounds; c.floorY = 0;
      c.setPose(set.x + 0.3, set.z + (kind === 'cab' ? 0.2 : 2), kind === 'cab' ? Math.PI : Math.PI / 2);
      if (dest === 'roof') state.flags.rode_elevator = true;
      this.game.refreshObjectives();
    }, kind === 'cab' ? (dest === 'roof' ? 'Going up! Watch the floors slide past the gate.' : 'Going down.') : 'The El rattles past third-floor windows, close enough to see into the tenements.');
  }

  arrive(dest) {
    const c = this.game.controls;
    this.fade(() => {
      this.colliders = this.streetCols; c.floorY = 0;
      if (dest === 'roof') { this.where = 'roof'; this.colliders = this.roofSet.cols; this.bounds = this.roofSet.bounds; c.floorY = this.roofSet.y; c.setPose(...this.roofSet.spawn); }
      else if (dest === 'street') { this.where = 'street'; this.bounds = this.boundsDown; c.setPose(this.potterDoor[0], this.potterDoor[1], Math.atan2(PR.n[0], PR.n[1])); }
      else if (dest === 'park') { this.where = 'park'; state.flags.in_park = true; this.bounds = this.boundsPark; c.setPose(PX, 62, 0); }
      else { this.where = 'street'; state.flags.in_park = false; this.bounds = this.boundsDown; const [x, z] = along(290, PR_W - 5); c.setPose(x, z + 2, Math.PI * 0.6); }
      this.game.refreshObjectives();
    }, { roof: 'The roof of the Potter Building, eleven stories up.', street: 'Back on Park Row.', park: '59th Street. You walk west into Central Park and up the Mall.', downtown: 'City Hall station, Park Row.' }[dest]);
  }

  ridePark() { this.game.spend(5, 'El fare'); this.startRide('car', 'park'); }
  rideDown() { this.startRide('car', 'downtown'); }

  fade(fn, msg) {
    const f = document.getElementById('flash');
    f.style.background = '#000'; f.classList.add('on');
    sfx('train');
    setTimeout(() => { fn(); f.classList.remove('on'); setTimeout(() => { f.style.background = ''; }, 600); if (msg) this.game.toast(msg, 5000); }, 900);
  }

  onAction(name) {
    if (name === 'ridePark') this.ridePark();
    else if (name === 'giuseppeClimbs') {
      this.streetGius.group.visible = false; this.streetTalk.hidden = true;
      this.deckGius.group.visible = true; this.deckTalk.hidden = false;
    } else if (name === 'fall') this.startFall();
    else if (name === 'toNight') setTimeout(() => this.game.toNight(), 50);
    else if (name === 'results') { this.drawBoards(true); this.game.controls.shake = 0.6; }
    this.game.refreshObjectives();
  }

  // ======================================================== DAY 2 STORY (Monday afternoon)
  story() {
    // Giuseppe at the foot of the Times Building
    const [gx, gz] = along(99, PR_W - 3.2);
    this.streetGius = this.person('giuseppe', gx, gz, 0, { talk: null, photo: 'giuseppe2' });
    this.streetTalk = this.interact({ x: gx, y: 1.4, z: gz, r: 2.4, prompt: 'Talk to Giuseppe', action: () => this.game.talk('giuseppe4') });
    const atStreet = !flag('gius_decided');
    this.streetGius.group.visible = atStreet; this.streetTalk.hidden = !atStreet;

    // After the fall: Giuseppe on the curb, and whoever comes to help him
    const [ax, az] = along(104, PR_W - 3.4);
    this.afterPos = [ax, az];
    const helper = flag('gius_repeat') ? 'boss' : 'societa';
    const [hx, hz] = along(106, PR_W - 3.6);
    this.afterGroup = [
      this.person('giuseppe', ax, az, 0, { talk: 'aftermath', photo: null, seated: true, prompt: 'Talk to Giuseppe' }),
      this.person(helper, hx, hz, 0, { talk: null, photo: null }),
    ];
    this.afterTalk = this.interactables.filter(it => /Talk to Giuseppe/.test(it.prompt) && Math.abs(it.pos.x - ax) < 0.1).pop();
    this.showAftermath(flag('saw_fall'));

    // The Editor, waiting at the Courier office
    const [ex, ez] = along(164.2, PR_W - 2.2);
    this.person('editor', ex, ez, 0, { talk: null, photo: null });
    const it = this.interact({ x: ex, y: 1.4, z: ez, r: 2.4, prompt: 'Talk to the Editor', cond: () => flag('saw_aftermath') && this.photoCount() >= 3, action: () => this.game.talk('editor') });
    it.lockedMsg = 'The Editor wants to see you after you\'ve visited Giuseppe, with at least 3 photographs from today.';
  }

  showAftermath(on) {
    this.afterGroup.forEach(n => { n.group.visible = on; });
    if (this.afterTalk) this.afterTalk.hidden = !on;
  }

  startFall() {
    const g = this.deckGius.group, y0 = g.position.y;
    this.deckTalk.hidden = true;
    sfx('flash');
    let t = 0;
    const fall = (dt) => {
      t += dt;
      const k = Math.min(1, t / 0.5);
      g.position.y = y0 - 4.2 * k * k;
      g.rotation.z = k * 0.9;
      if (k >= 1 && !fall.done) { fall.done = true; this.game.controls.shake = 1; sfx('shutter'); }
    };
    this.updaters.push(fall);
    setTimeout(() => this.game.talk('fall', () => {
      g.visible = false;
      this.showAftermath(true);
      this.game.refreshObjectives();
    }), 1300);
  }

  // ======================================================== ELECTION NIGHT (Tuesday, November 6)
  nightScene() {
    // torches and lamps: the square is lit by gaslight and bonfire glow
    for (const s0 of [100, 125, 150, 175]) {
      const [x, z] = along(s0, PR_W - 6);
      this.lamp(x, 3.6, z, 0xffb060, 14, 30);
    }
    for (let s0 = 95; s0 < 185; s0 += 9) {
      const [x, z] = along(s0, PR_W - 1.6);
      this.box(x, 0, z, 0.12, 2.4, 0.12, '#2a2018', { collide: false });
      const f = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 6), colorMat('#ffb040', { basic: true }));
      f.position.set(x, 2.7, z); f.userData.keep = true; this.scene.add(f);
      this.updaters.push((dt, t) => { f.scale.y = 1 + Math.sin(t * 13 + s0) * 0.2; });
    }
    // bulletin boards in front of the Tribune and the Times
    this.boards = [];
    for (const [s0, w] of [[135, 11], [106, 9]]) {
      const cv = document.createElement('canvas'); cv.width = 512; cv.height = 320;
      const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace;
      const [x, z] = along(s0, PR_W - 0.2);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(w, w * 0.625), new THREE.MeshBasicMaterial({ map: tex, fog: false }));
      m.position.set(x, 5.2, z); m.rotation.y = Math.atan2(-PR.n[0], -PR.n[1]); m.userData.keep = true; this.scene.add(m);
      this.boards.push({ cv, tex });
    }
    this.drawBoards(flag('saw_results'));
    this.updaters.push((dt, t) => { if (!flag('saw_results')) { this.boardT = (this.boardT || 0) + dt; if (this.boardT > 3) { this.boardT = 0; this.boardStep = ((this.boardStep || 0) + 1) % 4; this.drawBoards(false); } } });

    // the bulletin man with his megaphone
    const [bx, bz] = along(133, PR_W - 4.2);
    this.box(bx, 0, bz, 1.4, 0.9, 1.0, ['wood_cart', { type: 'planks', color: '#6a4a2a', n: 4 }]);
    this.person('bulletin', bx, bz, 0, { talk: null, photo: null, y: 0.9 });
    this.bulletinPos = [bx, bz];
    this.interact({ x: bx, y: 1.6, z: bz, r: 3.2, prompt: 'Push through the crowd to hear the returns', action: () => this.game.talk('returns') });

    // your friends in the crowd (who is here depends on your choices)
    const spot = (s0, off) => along(s0, PR_W - off);
    const put = (id, s0, off, talk, opts = {}) => { const [x, z] = spot(s0, off); this.person(id, x, z, 0, { talk, photo: null, ...opts }); return [x, z]; };
    this.friends = {};
    this.friends.rivka = put('rivka', 146, 8, 'rivka_night', { prompt: 'Talk to Rivka' });
    if (flag('rivka_union')) put('esther', 147.4, 9.6, null);
    this.friends.giuseppe = put('giuseppe', 124, 9, 'giuseppe_night', { prompt: 'Talk to Giuseppe' });
    put(flag('gius_repeat') ? 'crowd2' : 'societa', 125.4, 10.4, null);
    this.friends.moishe = put('moishe', 154, 12, 'moishe_night', { prompt: 'Talk to Moishe' });
    put('girl', 155.2, 12.8, null);
    if (flag('paid_telegram')) { this.friends.novak = put('novak', 128, 15, 'novak_night', { prompt: 'Talk to Mr. Novak' }); put('tomas', 129.3, 15.6, null); }
    this.friends.brennan = put('brennan', 140, 15, 'brennan_night', { prompt: 'Talk to Mrs. Brennan' });
    this.friends.whitcomb = put('guild', 162, 7, 'whitcomb_night', { prompt: 'Talk to Mr. Whitcomb' });
    const [qx, qz] = spot(116, 12);
    this.box(qx, 0, qz, 2.2, 0.9, 3.4, ['wood_cart', { type: 'planks', color: '#6a4a2a', n: 4 }]);
    this.person('boss', qx, qz, 0, { talk: 'quinn_night', photo: null, y: 0.9 });
    this.interact({ x: qx, y: 1.6, z: qz - 1.9, r: 2.6, prompt: 'Talk to Mr. Quinn', action: () => this.game.talk('quinn_night') });
    this.friends.quinn = [qx, qz];

    // the crowd
    let n = 0;
    for (let s0 = 98; s0 < 172; s0 += 3.1) for (const off of [4.5, 10.5, 16.5, 21]) {
      if ((s0 * 7 + off) % 5 < 1.6) continue;
      const [x, z] = spot(s0 + (off % 3), off);
      const near = Object.values(this.friends).some(([fx, fz]) => Math.hypot(fx - x, fz - z) < 2.4) || Math.hypot(bx - x, bz - z) < 2.6;
      if (!near) this.crowd(n++, x, z, 0);
    }

    // into the Courier office to write the story
    const [cx, cz] = along(161, PR_W - 1.3);
    const ex = this.exit(cx, cz, 'Go into the Courier office and write your story', () => flag('saw_results') && this.friendsMet() >= 3, () => this.game.openWrapup('B'));
    ex.lockedMsg = 'Not yet. Hear the returns and find at least 3 friends in the crowd.';
    this.courierDoor = [cx, cz];
  }

  friendsMet() { return ['met_rivka_night', 'met_gius_night', 'met_moishe_night', 'met_novak_night', 'met_brennan_night', 'met_whitcomb_night', 'met_quinn_night'].filter(flag).length; }

  drawBoards(final) {
    for (const { cv, tex } of this.boards || []) {
      const g = cv.getContext('2d'), W = cv.width, H = cv.height;
      g.fillStyle = '#121410'; g.fillRect(0, 0, W, H);
      g.strokeStyle = '#8a6a26'; g.lineWidth = 10; g.strokeRect(5, 5, W - 10, H - 10);
      g.fillStyle = '#f0ead8'; g.textAlign = 'center';
      g.font = 'bold 34px Georgia'; g.fillText('ELECTION RETURNS · MAYOR', W / 2, 50);
      const step = final ? 3 : (this.boardStep || 0);
      const tallies = [[0, 0, 0], [41200, 26800, 25900], [88400, 57100, 55800], [114111, 73037, 71979]][step];
      const rows = [['GRANT (Tammany)', tallies[0]], ['ERHARDT (Rep.)', tallies[1]], ['HEWITT (Citizens)', tallies[2]]];
      g.font = '30px Georgia'; g.textAlign = 'left';
      rows.forEach(([nm, v], i) => { g.fillStyle = '#f0ead8'; g.fillText(nm, 30, 110 + i * 52); g.textAlign = 'right'; g.fillText(step ? v.toLocaleString('en-US') : '...', W - 30, 110 + i * 52); g.textAlign = 'left'; });
      g.textAlign = 'center'; g.font = 'bold 32px Georgia'; g.fillStyle = final ? '#f2c230' : '#c8c0a8';
      g.fillText(final ? 'GRANT ELECTED!' : (step ? 'MORE DISTRICTS COMING IN...' : 'POLLS CLOSED · AWAITING RETURNS'), W / 2, 285);
      tex.needsUpdate = true;
    }
  }


  map() {
    if (this.where === 'cab' || this.where === 'car') return null;
    if (this.where === 'park') {
      return {
        bounds: { minX: PX - 60, maxX: PX + 60, minZ: -80, maxZ: 70 }, ground: '#6a8a4e', scale: 1.6,
        streets: [{ x0: PX - 6, x1: PX + 6, z0: -35, z1: 65, name: 'The Mall' }, { x0: PX + 41, x1: PX + 49, z0: -75, z1: 65, name: 'The Drive' }, { x0: PX - 30, x1: PX + 30, z0: -67, z1: -49, name: 'Terrace' }],
        water: [{ x0: PX - 66, x1: PX + 66, z0: -112, z1: -68 }],
        pois: [{ x: PX, z: -58, label: 'Bethesda Fountain' }, { x: PX - 40, z: 10, label: 'Sheep Meadow' }, { x: PX + 2, z: 56, label: 'Park keeper' }, { x: PX + 7, z: 22, label: 'Chana & Sarah' }, { x: PX, z: 66, label: 'El / Courier' }],
      };
    }
    const prA = along(0, PR_W / 2), prB = along(340, PR_W / 2);
    return {
      bounds: { minX: BW - 30, maxX: 160, minZ: -135, maxZ: 235 }, ground: '#6a8a4e', scale: 1.0,
      lines: [{ x0: prA[0], z0: prA[1], x1: prB[0], z1: prB[1], w: PR_W }],
      streets: [
        { x0: 60, x1: 400, z0: -140, z1: 240, name: '' },
        { x0: BW - 24, x1: BW, z0: -135, z1: 235, name: 'Broadway' },
        { x0: BW - 24, x1: 160, z0: CHAMBERS - 18, z1: CHAMBERS, name: 'Chambers St' },
        { x0: CENTRE, x1: CENTRE + 20, z0: CHAMBERS, z1: -40, name: 'Centre' },
      ],
      parks: [{ x0: BW, x1: 40, z0: CHAMBERS, z1: 140 }],
      pois: [
        { x: 0, z: 0, label: 'City Hall' }, { x: 0, z: -80, label: 'Tweed Courthouse' }, { x: -6, z: -77, label: 'Plunkitt' },
        { x: -70, z: 185, label: 'Post Office' }, { x: along(135, PR_W)[0], z: along(135, PR_W)[1], label: 'Tribune' },
        { x: along(106, PR_W)[0], z: along(106, PR_W)[1], label: 'New Times Bldg' }, { x: along(161, PR_W)[0], z: along(161, PR_W)[1], label: 'Courier (cartoon)' },
        { x: along(281, PR_W)[0], z: along(281, PR_W)[1], label: 'Brooklyn Bridge' }, { x: along(292, PR_W - 4)[0], z: along(292, PR_W - 4)[1], label: 'El station' },
        { x: BW - 7, z: 33, label: 'Horsecar' }, { x: (prA[0] + prB[0]) / 2 - 20, z: (prA[1] + prB[1]) / 2, label: 'PARK ROW ↗' },
      ],
    };
  }

  photoCount() { return state.photos.filter(p => p.zone === 'city' && p.subject).length; }
  ready() { return false; }

  objectives() {
    const n = this.photoCount();
    if (this.night) {
      const f = this.friendsMet();
      return [
        { text: 'Push through the crowd to the bulletin man and hear the returns', done: flag('saw_results'), at: this.bulletinPos },
        { text: `Find your friends in the crowd (${Math.min(f, 3)}/3)`, done: f >= 3, at: this.friends && (Object.entries(this.friends).find(([k]) => !flag({ rivka: 'met_rivka_night', giuseppe: 'met_gius_night', moishe: 'met_moishe_night', novak: 'met_novak_night', brennan: 'met_brennan_night', whitcomb: 'met_whitcomb_night', quinn: 'met_quinn_night' }[k])) || [0, this.bulletinPos])[1] },
        { text: 'Go into the Courier office and write your story', done: false, at: this.courierDoor },
      ];
    }
    const up = this.where === 'roof' || this.where === 'cab';
    const [ox, oz] = along(161.5, PR_W - 2.2), [fx, fz] = along(94, PR_W - 2.5), [bx, bz] = along(281, PR_W + 20), [ex, ez] = along(164.2, PR_W - 2.2);
    return [
      { text: 'Find Giuseppe at the foot of the new Times Building', done: flag('gius_decided'), at: along(99, PR_W - 3.2) },
      { text: 'Ride the Potter Building elevator to the roof, next door', done: flag('rode_elevator') || flag('saw_fall'), at: this.potterDoor },
      { text: 'From the roof, wave to Giuseppe on the open top floor', done: flag('saw_fall') },
      { text: up ? 'Hurry! Take the elevator down to the street' : 'Get to Giuseppe on the sidewalk', done: flag('saw_aftermath'), at: up ? this.potterDoor : this.afterPos },
      { text: `Bring the Editor at least 3 photographs from today (${Math.min(n, 3)}/3), at the Courier office`, done: flag('endorsed'), at: [ex, ez] },
      { text: 'Find Mr. Plunkitt inside the courthouse and ask how Tammany wins votes', done: flag('learned_machine'), at: this.plunkittPos || [-6, -76], optional: true },
      { text: 'Read what the courthouse cost (the bills on the rotunda wall)', done: flag('read_graft'), at: this.graftPos || [7, -87], optional: true },
      { text: 'Ask the old reporter about Boss Tweed', done: flag('learned_tweed'), at: [ox, oz], optional: true },
      { text: 'Ask the foreman why buildings are getting taller', done: flag('learned_skyscraper'), at: [fx, fz], optional: true },
      { text: 'Photograph the Brooklyn Bridge', done: flag('photo_bridge'), at: [bx, bz], optional: true },
      { text: 'Ride the El uptown to Central Park', done: flag('in_park') || flag('learned_park'), at: along(291, PR_W - 3), optional: true },
    ];
  }
}
