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
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';
import { sfx } from '../engine/audio.js';

const COBBLE = ['street_belgian_block', { type: 'stone', color: '#7c7a76', mortar: '#4e4a44', rows: 10 }];
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
    this.setSky('#b8c4cc', 70, 1300, '#c8ccc8');
    this.lights({ ambient: 0xa09888, ambientI: 1.3, sky: 0xf0f0f0, ground: 0x504a40, hemiI: 1.0, sun: { color: 0xfff2dc, i: 1.6, pos: [40, 60, 30] } });
    this.boundsDown = { minX: BW - 24, maxX: 150, minZ: CHAMBERS - 18, maxZ: 232 };
    this.boundsPark = { minX: PX - 60, maxX: PX + 60, minZ: -80, maxZ: 70 };
    this.bounds = this.boundsDown;

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
    this.centralPark();

    this.spawn = { x: -60, z: 120, yaw: 0.25 };
    if (flag('in_park')) { this.spawn = { x: PX, z: 62, yaw: 0 }; this.bounds = this.boundsPark; }
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
    // ~79 x 45 m, long axis east-west, 4.5 stories, Corinthian portico (south), grand stair (north)
    this.building(-38, 38, -102, -58, 24, { s: ['facade_courthouse', { type: 'facade', color: '#e9e6dd', floors: 4, bays: 5, storeFrac: 0.2, cornice: '#d8d4c8', stone: '#cfcac0', lit: 0.1, civic: true, w: 256, h: 512 }], n: ['facade_courthouse', {}] }, ['wall_marble', MARBLE[1]], { lot: 12 });
    // south portico + steps
    for (let i = 0; i < 6; i++) this.box(-8 + i * 3.2, 2.5, -55.5, 1.0, 14, 1.0, '#efe9dc');
    this.box(0, 16.5, -55.5, 20, 2.2, 2, '#e2dccf', { collide: false });
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 12, 4, 3, 1), colorMat('#e2dccf')); ped.rotation.set(Math.PI / 2, 0, 0); ped.scale.set(1, 0.3, 1); ped.position.set(0, 20.6, -55.5); this.scene.add(ped);
    this.box(0, 0, -53.5, 22, 2.5, 5, '#cfc9bc');
    this.panel(0, 17.7, -54.45, 14, 0.9, ['sign_courthouse', { type: 'sign', title: 'NEW YORK COUNTY COURTHOUSE', color: '#d8d2c4', ink: '#3a3028', w: 448, h: 40 }]);
    // grand stair on the Chambers Street side (removed 1942)
    for (let i = 0; i < 10; i++) this.box(0, 0, -103 - i * 0.7, 24 - i * 0.4, 3 - i * 0.3, 0.7, '#d8d2c4', { collide: i < 3 });
    this.target('courthouse', 0, 10, -56, 60);
    this.readable('courthouse', 12, 1.3, -50.5, { prompt: 'Read about the courthouse', photo: null });
    this.box(12, 0, -50.8, 0.6, 1.0, 0.3, '#6a6458');
    // Plunkitt's bootblack-stand "office" at the courthouse
    this.box(-14, 0, -50.2, 1.6, 0.5, 1.2, '#4a3020');
    this.box(-14, 0.5, -50.6, 1.6, 0.6, 0.4, '#4a3020', { collide: false });
    this.person('plunkitt', -14, -50.3, 0);
    this.crowd(5, -12.4, -49, 0, { scale: 0.75 });
    this.crowd(4, -16.8, -48, 0); this.crowd(2, -10, -47, 0);
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
    const [mx, mz] = P(175); ramp.position.set(mx, 16, mz); ramp.rotation.set(0, rot, 0); ramp.rotateX(-0.11); this.scene.add(ramp);
    // the towers: gray granite, twin pointed arches (Manhattan tower ~ compressed distance)
    for (const d of [360, 846]) {
      const [tx, tz] = P(d);
      const tw = new THREE.Group();
      for (const dz of [-7, 7]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(10, 84, 6), granite); leg.position.set(0, 42, dz); tw.add(leg); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(10, 18, 20), granite); top.position.set(0, 75, 0); tw.add(top);
      const mid = new THREE.Mesh(new THREE.BoxGeometry(10, 14, 20), granite); mid.position.set(0, 7, 0); tw.add(mid);
      for (const dz of [-3.4, 3.4]) { const arch = new THREE.Mesh(new THREE.ConeGeometry(3.4, 8, 4), granite); arch.position.set(0, 68, dz); arch.rotation.y = Math.PI / 4; tw.add(arch); }
      tw.position.set(tx, 0, tz); tw.rotation.y = rot + Math.PI / 2; this.scene.add(tw); this.bake(tw);
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
    this.wallLine(rlx - dir[1] * 8, rlz + dir[0] * 8, rlx + dir[1] * 8, rlz - dir[0] * 8, 1.1, IRON, 0.15);
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

  // ======================================================== CENTRAL PARK (1888)
  centralPark() {
    const X = PX;
    this.floor(X, -5, 130, 160, [GRASS[0], GRASS[1], { repeat: [30, 36] }]);
    // The Mall: runs north to Bethesda Terrace; elms planted 1860s-70s (canopy not yet closed)
    this.floor(X, 15, 12, 100, [PATH[0], PATH[1], { repeat: [3, 25] }], 0.012);
    for (let z = 60; z > -32; z -= 7) for (const dx of [-8, -11, 8, 11]) this.tree(X + dx, z, 1.5);
    // Bethesda Terrace (olive-buff sandstone) and the Angel of the Waters (brown bronze, 1873)
    const sand = material('stone_bethesda', { type: 'stone', color: '#a89f7a', mortar: '#8c8466', rows: 4 });
    const terrace = new THREE.Mesh(new THREE.BoxGeometry(44, 1.2, 14), sand); terrace.position.set(X, 0.6, -42); this.scene.add(terrace);
    for (let i = 0; i < 6; i++) this.box(X, 0, -36 + i * -0.5, 14, 1.2 - i * 0.2, 0.5, ['stone_bethesda', {}], { collide: false });
    this.box(X - 22, 0, -42, 0.8, 1.6, 14, ['stone_bethesda', {}]); this.box(X + 22, 0, -42, 0.8, 1.6, 14, ['stone_bethesda', {}]);
    this.floor(X, -58, 60, 18, [PATH[0], PATH[1], { repeat: [15, 5] }], 0.012);
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(6, 6.3, 0.8, 28), sand); basin.position.set(X, 0.4, -58); this.scene.add(basin);
    const water = new THREE.Mesh(new THREE.CircleGeometry(5.7, 28), colorMat('#5a7a88')); water.rotation.x = -Math.PI / 2; water.position.set(X, 0.82, -58); this.scene.add(water);
    const bronze = colorMat('#5a4632');
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 1.2, 3, 10), sand); ped.position.set(X, 2, -58); this.scene.add(ped);
    const angel = new THREE.Mesh(new THREE.ConeGeometry(0.7, 2.6, 8), bronze); angel.position.set(X, 4.8, -58); this.scene.add(angel);
    for (const sx of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.9, 0.08), bronze); wing.position.set(X + sx * 0.8, 5.4, -58.2); wing.rotation.z = sx * 0.5; this.scene.add(wing); }
    this.colliders.push({ minX: X - 6.5, maxX: X + 6.5, minZ: -64.5, maxZ: -51.5 });
    this.colliders.push({ minX: X - 23, maxX: X - 7, minZ: -49, maxZ: -35 }, { minX: X + 7, maxX: X + 23, minZ: -49, maxZ: -35 });
    this.target('park', X, 4, -58, 50);
    // The Lake beyond
    const lake = new THREE.Mesh(new THREE.CircleGeometry(30, 32), material('water_harbor', { type: 'water' }, { repeat: [8, 8] }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(X, 0.02, -82); lake.scale.x = 2.2; this.scene.add(lake);
    this.colliders.push({ minX: X - 66, maxX: X + 66, minZ: -112, maxZ: -68, see: true });
    // Sheep Meadow to the west, with the park's flock (grazing there since 1864)
    for (let i = 0; i < 14; i++) {
      const sx = X - 30 - (i * 7.3) % 26, sz = -10 + ((i * 13.7) % 50);
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.9), colorMat('#e8e2d2')); body.position.set(sx, 0.55, sz); body.rotation.y = i; this.scene.add(body);
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
    [[-2, 40, 0], [2, 30, 3], [-1, 5, 4], [3, -10, 2], [-3, -20, 7], [-5, -50, 1], [6, -52, 6]].forEach(([dx, dz, n]) => this.crowd(n, X + dx, dz, 0));
    this.floor(X + 45, -5, 8, 140, [PATH[0], PATH[1], { repeat: [2, 35] }], 0.012);
    this.carriage = this.horsecar(X + 45, 40, 0, '#1d1d24');
    this.carriage.scale.set(0.8, 0.8, 0.55);
    this.updaters.push((dt, t) => { this.carriage.position.z = 60 - ((t * 3) % 140); });
    // back downtown / write the story
    this.interact({ x: X - 4, z: 66, r: 2.4, prompt: 'Ride the El back downtown', action: () => this.rideDown() });
    const ex = this.exit(X + 4, 67, 'Go to the Courier office and write your story', () => this.ready(), () => this.game.openWrapup('B'));
    ex.lockedMsg = 'Talk to the park keeper and learn more downtown first (see objectives).';
  }

  ridePark() {
    state.flags.in_park = true;
    this.bounds = this.boundsPark;
    this.fade(() => this.game.controls.setPose(PX, 62, 0), 'You ride the El uptown past the tenement windows, then walk west to the park and up the Mall.');
  }
  rideDown() {
    state.flags.in_park = false;
    this.bounds = this.boundsDown;
    const [x, z] = along(290, PR_W - 5);
    this.fade(() => this.game.controls.setPose(x, z + 2, Math.PI * 0.6), 'You ride the El back down to City Hall.');
  }
  fade(fn, msg) {
    const f = document.getElementById('flash');
    f.style.background = '#000'; f.classList.add('on');
    sfx('train');
    setTimeout(() => { fn(); f.classList.remove('on'); setTimeout(() => { f.style.background = ''; }, 600); this.game.toast(msg, 5000); }, 900);
  }

  onAction(name) { if (name === 'ridePark') this.ridePark(); }

  map() {
    if (flag('in_park')) {
      return {
        bounds: { minX: PX - 60, maxX: PX + 60, minZ: -80, maxZ: 70 },
        streets: [{ x0: PX - 6, x1: PX + 6, z0: -35, z1: 65, name: 'The Mall' }, { x0: PX + 41, x1: PX + 49, z0: -75, z1: 65, name: 'The Drive' }],
        parks: [{ x0: PX - 60, x1: PX - 20, z0: -30, z1: 50 }],
        pois: [{ x: PX, z: -58, label: 'Bethesda Fountain' }, { x: PX - 40, z: 10, label: 'Sheep Meadow' }, { x: PX + 2, z: 56, label: 'Park keeper' }, { x: PX + 7, z: 22, label: 'Chana & Sarah' }, { x: PX, z: 66, label: 'El / Courier' }],
      };
    }
    const prA = along(0, PR_W / 2), prB = along(340, PR_W / 2);
    return {
      bounds: { minX: BW - 30, maxX: 160, minZ: -135, maxZ: 235 },
      streets: [
        { x0: BW - 24, x1: BW, z0: -135, z1: 235, name: 'Broadway' },
        { x0: BW - 24, x1: 160, z0: CHAMBERS - 18, z1: CHAMBERS, name: 'Chambers St' },
        { x0: CENTRE, x1: CENTRE + 20, z0: CHAMBERS, z1: -40, name: 'Centre' },
      ],
      parks: [{ x0: BW, x1: 40, z0: CHAMBERS, z1: 140 }],
      pois: [
        { x: 0, z: 0, label: 'City Hall' }, { x: 0, z: -80, label: 'Tweed Courthouse' }, { x: -14, z: -50, label: 'Plunkitt' },
        { x: -70, z: 185, label: 'Post Office' }, { x: along(135, PR_W)[0], z: along(135, PR_W)[1], label: 'Tribune' },
        { x: along(106, PR_W)[0], z: along(106, PR_W)[1], label: 'New Times Bldg' }, { x: along(161, PR_W)[0], z: along(161, PR_W)[1], label: 'Courier (cartoon)' },
        { x: along(281, PR_W)[0], z: along(281, PR_W)[1], label: 'Brooklyn Bridge' }, { x: along(292, PR_W - 4)[0], z: along(292, PR_W - 4)[1], label: 'El station' },
        { x: BW - 7, z: 33, label: 'Horsecar' }, { x: (prA[0] + prB[0]) / 2 - 20, z: (prA[1] + prB[1]) / 2, label: 'PARK ROW ↗' },
      ],
    };
  }

  photoCount() { return state.photos.filter(p => p.zone === 'city' && p.subject).length; }
  ready() { return flag('learned_park') && flag('learned_machine') && this.photoCount() >= 4; }

  objectives() {
    return [
      { text: 'Ask the old reporter (at the Courier office on Park Row) about Boss Tweed', done: flag('learned_tweed') },
      { text: 'Find Plunkitt at the courthouse: how does Tammany win votes?', done: flag('learned_machine') },
      { text: 'Learn why buildings are getting taller', done: flag('learned_skyscraper') },
      { text: 'Learn how people get around the city', done: flag('learned_transit') || flag('learned_el') },
      { text: 'Photograph the Brooklyn Bridge', done: state.photos.some(p => p.subject === 'bridge') },
      { text: 'Ride the El to Central Park', done: flag('in_park') || flag('learned_park') },
      { text: 'Ask who the park is for', done: flag('learned_park') && flag('learned_park_access') },
      { text: `Photograph evidence (${this.photoCount()}/6)`, done: this.photoCount() >= 6 },
      { text: 'Go to the Courier office and write your story', done: false },
    ];
  }
}
