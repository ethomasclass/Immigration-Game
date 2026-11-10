// ZONE 3: THE LOWER EAST SIDE (about 15 minutes)
// Built on the real 1888 street grid (see docs/HISTORICAL_REFERENCE.md):
//   west -> east: Mott · Bowery (Third Ave El) · Chrystie · Forsyth · Eldridge · Allen (Second Ave El) · Orchard
//   north -> south: Grand · Hester · Canal   (+ Pell St off Mott, in Chinatown)
// Street widths are real (50 ft; Bowery 100 ft). Blocks are shortened to ~22 m.
// 1 unit = 1 meter. North = -z, east = +x.
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';
import { sfx } from '../engine/audio.js';

// ---- street grid ----
const NS = { // north-south streets: [west edge, east edge]
  Mott: [-175.5, -160.5], Bowery: [-137, -107], Chrystie: [-89.5, -74.5], Forsyth: [-52.5, -37.5],
  Eldridge: [-15.5, -0.5], Allen: [21.5, 36.5], Orchard: [58.5, 73.5],
};
const EW = { Grand: [-65.5, -50.5], Hester: [-7.5, 7.5], Canal: [47.5, 62.5] };
const BX = [[-195, -175.5], [-160.5, -137], [-107, -89.5], [-74.5, -52.5], [-37.5, -15.5], [-0.5, 21.5], [36.5, 58.5], [73.5, 95]];
const BZ = [[-112, -65.5], [-50.5, -7.5], [7.5, 47.5], [62.5, 117]];
const PELL = [88, 96]; // Pell St, from Mott east to the Bowery
const LOT = 7.6;       // 25-ft lot

// Moishe's tenement: north side of Hester between Allen and Orchard.
const MX = 44, MZ = -7.5;     // lot's street-front west corner
const BLD = 18, YARD = 6;     // building depth, yard depth

const BRICKS = ['#8e3b2e', '#a0523d', '#7a3a2c', '#94604a', '#b8a888', '#6e3a30'];
const SIGNS = {
  hester: ['BÄCKEREI · BAKERY', 'DRY GOODS', 'קאשער פלייש · KOSHER MEAT', 'GROCERY · SPEZEREI', 'SCHUHMACHER', 'MILLINERY', 'HARDWARE', 'TAILOR · שניידער', 'LAGER BIER', 'SHOES', 'TEA & COFFEE', 'APOTHEKE · DRUGS'],
  bowery: ['SALOON', 'LODGING 15¢', 'DIME MUSEUM', 'PAWNBROKER', 'CONCERT HALL', 'OYSTERS', 'BEER 5¢', 'CLOTHING'],
  mott: ['茶 TEAS', '雜貨 GROCERIES', 'WAH KEE & CO.', '中華 RESTAURANT', 'QUONG YUEN SING'],
};

const COBBLE = ['street_belgian_block', { type: 'belgian', w: 512, h: 512 }];
const WALK = ['sidewalk_bluestone', { type: 'stone', color: '#6f7680', mortar: '#4f545a', rows: 3 }];
const PLASTER = ['wall_tenement_room', { type: 'wallpaper', color: '#b79a5e', w: 512, h: 512 }];
const FLOOR = ['floor_tenement', { type: 'planks', color: '#5a412b', n: 8 }];
const DIRT = ['ground_yard', { type: 'plaster', color: '#4a3e30' }];
const WOOD = ['wood_rough', { type: 'planks', color: '#5c4630', n: 5 }];
const IRON = '#2e2d2a';

export class LowerEastSideZone extends Zone {
  build() {
    this.setSky('#6b5866', 22, 110, '#5c4d58');
    this.lights({ ambient: 0x7a6a78, ambientI: 0.95, sky: 0xc8a890, ground: 0x302830, hemiI: 0.65, sun: { color: 0xffb880, i: 0.6, pos: [-40, 20, 10] } });
    this.bounds = { minX: NS.Mott[0], maxX: NS.Orchard[1], minZ: -100, maxZ: 105 };
    this.rand = mulberry(1888);
    this.signTexN = 0;

    this.skyline('les', { kind: 'rooftops', top: '#6b5866', haze: '#5c4d58', far: '#4e4350', near: '#3a323c' });
    this.streets();
    this.blocks();
    this.tenement();
    this.elevated('Allen', [24.2, 33.8], -112, 117, [{ z: EW.Grand[0] - 2 }, { z: EW.Canal[1] + 2 }]);
    this.elevated('Bowery', [-126, -118], -112, 117, [{ z: EW.Grand[0] - 2 }]);
    this.hester();
    this.landmarks();
    this.wires();
    this.saloon();
    this.election();
    this.streetLife();

    this.spawn = { x: -8, z: 1.5, yaw: -Math.PI / 2 };
  }

  // ------------------------------------------------------------ ground
  streets() {
    const x0 = BX[0][0], x1 = BX[7][1], z0 = BZ[0][0], z1 = BZ[3][1];
    this.floor((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, [COBBLE[0], COBBLE[1], { repeat: [(x1 - x0) / 4, (z1 - z0) / 4] }]);
    // sidewalks (3 m) along every block face
    const sw = 3;
    for (const [bx0, bx1] of BX) for (const [bz0, bz1] of BZ) {
      const cx = (bx0 + bx1) / 2, cz = (bz0 + bz1) / 2, w = bx1 - bx0 + sw * 2, d = bz1 - bz0 + sw * 2;
      this.floor(cx, cz, w, d, [WALK[0], WALK[1], { repeat: [w / 3, d / 3] }], 0.015);
    }
    // Pell St is narrower: sidewalks only on its sides
    // granite curbs and dark gutters along every sidewalk edge
    const CURB = '#8e8b84', GUT = colorMat('#2a2622');
    for (const [bx0, bx1] of BX) for (const [bz0, bz1] of BZ) {
      const ex0 = bx0 - sw, ex1 = bx1 + sw, ez0 = bz0 - sw, ez1 = bz1 + sw, w = ex1 - ex0, d = ez1 - ez0;
      this.box((ex0 + ex1) / 2, 0, ez0, w, 0.06, 0.28, CURB, { collide: false }); this.box((ex0 + ex1) / 2, 0, ez1, w, 0.06, 0.28, CURB, { collide: false });
      this.box(ex0, 0, (ez0 + ez1) / 2, 0.28, 0.06, d, CURB, { collide: false }); this.box(ex1, 0, (ez0 + ez1) / 2, 0.28, 0.06, d, CURB, { collide: false });
      for (const [gx, gz, gw, gd] of [[(ex0 + ex1) / 2, ez0 - 0.45, w, 0.6], [(ex0 + ex1) / 2, ez1 + 0.45, w, 0.6], [ex0 - 0.45, (ez0 + ez1) / 2, 0.6, d], [ex1 + 0.45, (ez0 + ez1) / 2, 0.6, d]]) {
        const g = new THREE.Mesh(new THREE.PlaneGeometry(gw, gd), GUT); g.rotation.x = -Math.PI / 2; g.position.set(gx, 0.008, gz); this.scene.add(g);
      }
    }
    // what the street-cleaning department left behind: manure, straw, puddles, cabbage leaves
    const r = mulberry(77), streetPts = [];
    for (let i = 0; i < 260 && streetPts.length < 90; i++) {
      const x = BX[0][0] + r() * (BX[7][1] - BX[0][0]), z = BZ[0][0] + r() * (BZ[3][1] - BZ[0][0]);
      const onWalk = BX.some(([a, b]) => x > a - 3.6 && x < b + 3.6) && BZ.some(([a, b]) => z > a - 3.6 && z < b + 3.6);
      if (!onWalk) streetPts.push([x, z]);
    }
    const kinds = [colorMat('#3a2c1e'), colorMat('#4a3a24'), colorMat('#a8904e'), colorMat('#4c5560'), colorMat('#6a7a4a')];
    streetPts.forEach(([x, z], i) => {
      const k = i % 5, m = new THREE.Mesh(new THREE.CircleGeometry(k === 3 ? 0.9 : 0.35, 7), kinds[k]);
      m.rotation.x = -Math.PI / 2; m.rotation.z = r() * 6; m.scale.set(1 + r(), 0.6 + r() * 0.5, 1); m.position.set(x, 0.006 + k * 0.0005, z); this.scene.add(m);
    });
  }

  // ------------------------------------------------------------ blocks of tenements
  blocks() {
    const r = this.rand;
    const facade = (i, tall) => {
      const c = BRICKS[i % BRICKS.length];
      return [`facade_tenement_${i % BRICKS.length}${tall ? '' : '_low'}`, { type: 'facade', color: c, floors: tall ? 5 : 3, bays: 4, escape: i % 2 === 0, lit: 0.3, cornice: i % 3 ? '#3b3530' : '#8a8270', w: 256, h: 512 }];
    };
    for (let bi = 0; bi < BX.length; bi++) {
      for (let bj = 0; bj < BZ.length; bj++) {
        const [x0, x1] = BX[bi], [z0, z1] = BZ[bj];
        // Skip/split special blocks
        if (bi === 6 && bj === 1) { this.moisheBlock(x0, x1, z0, z1); continue; }
        const isBowery = bi === 1 || bi === 2;
        const tall = !isBowery;
        // Carve out landmarks and Pell Street, then fill the rest with tenements.
        let rects = [[x0, x1, z0, z1]];
        if (bi === 5 && bj === 3) rects = [[x0, x1, z0, 66], [x0, x1, 82, z1], [20, x1, 66, 82]];             // synagogue
        if (bi === 1 && bj === 3) rects = [[x0, x1, z0, 66], [-146, x1, 66, 84], [x0, x1, 84, PELL[0]], [x0, x1, PELL[1], 98], [-153, x1, 98, 105], [x0, x1, 105, z1]]; // church + Pell + Lee's shop
        if (bi === 5 && bj === 2) rects = [[x0, x1, 14, z1], [7, x1, z0, 14]];                                // saloon / Democratic club
        for (const [rx0, rx1, rz0, rz1] of rects) {
          // Split west->east into buildings of 2-3 lots with varied heights.
          let x = rx0;
          while (x < rx1 - 0.1) {
            const lots = 2 + Math.floor(r() * 2);
            const xe = (rx1 - (x + lots * LOT) < LOT * 0.8) ? rx1 : x + lots * LOT;
            const h = tall ? 16 + r() * 5 : 11 + r() * 4;
            const v = Math.floor(r() * 12);
            const fr = { n: facade(v, tall), s: facade(v + 1, tall) };
            if (x === rx0) fr.w = facade(v + 2, tall);
            if (xe >= rx1 - 0.1) fr.e = facade(v + 3, tall);
            this.building(x, xe, rz0, rz1, h, fr, null);
            this.dress(x, xe, rz0, rz1, h);
            x = xe;
          }
        }
      }
    }
  }

  /** Painted signboard over a shop. side: 's' faces +z, 'n' faces -z, 'e' faces +x, 'w' faces -x */
  sign(x, z, side, text, w = 5, group = 'shop') {
    // Stable art names: sign_<street>_<number>.png replaces the painted text with your own sign art.
    this.signN = this.signN || {};
    const n = this.signN[group] = (this.signN[group] || 0) + 1;
    const key = `sign_${group}_${String(n).padStart(2, '0')}`;
    const ry = { s: 0, n: Math.PI, e: Math.PI / 2, w: -Math.PI / 2 }[side];
    const off = 0.06;
    const px = side === 'e' ? x + off : side === 'w' ? x - off : x;
    const pz = side === 's' ? z + off : side === 'n' ? z - off : z;
    this.panel(px, 3.4, pz, w, 0.7, [key, { type: 'sign', title: text, color: this.rand() < 0.5 ? '#2a2420' : '#3a1f1a', w: 320, h: 48 }], ry);
  }

  // ------------------------------------------------------------ Moishe's block & tenement
  moisheBlock(x0, x1, z0, z1) {
    const fac = (i) => [`facade_tenement_${i}`, { type: 'facade', color: BRICKS[i], floors: 5, bays: 4, escape: i % 2 === 0, lit: 0.3, cornice: '#3b3530', w: 256, h: 512 }];
    const rear = z1 - BLD - YARD; // z where the rear lots begin
    // west corner building (Allen & Hester), east building (to Orchard)
    this.building(x0, MX, z1 - BLD, z1, 18.5, { s: fac(1), w: fac(2) });
    this.building(MX + LOT, x1, z1 - BLD, z1, 17.5, { s: fac(3), e: fac(4) });
    // rear buildings facing Grand St
    this.building(x0, x1, z0, rear, 18, { n: fac(0), w: fac(5), e: fac(2), s: ['facade_rear', { type: 'facade', color: '#7a3a2c', floors: 6, bays: 4, storeFrac: 0.02, escape: false, lit: 0.35, w: 256, h: 512 }] });
    // back yards of the neighbors (fenced off)
    for (const [a, b] of [[x0, MX], [MX + LOT, x1]]) this.box((a + b) / 2, 0, rear + YARD / 2, b - a, 2.2, YARD, WOOD);
  }

  tenement() {
    const H = 2.8;                         // ground-floor ceiling (~9 ft)
    const X = (lx) => MX + lx, Z = (lz) => MZ - lz;  // lot-local -> world (lz grows north)
    const hall = [3.1, 4.4];
    // Upper floors (whole lot) with facade
    const up = this.building(MX, MX + LOT, Z(BLD), Z(0), 19, {}, null, { collide: false });
    up.position.y = H + (19 - H) / 2; up.scale.y = (19 - H) / 19;
    this.panel(X(LOT / 2), H + (19 - H) / 2, Z(0) + 0.02, LOT, 19 - H, ['facade_tenement_moishe', { type: 'facade', color: '#8e3b2e', floors: 5, bays: 4, storeFrac: 0.0, escape: true, lit: 0.4, w: 256, h: 480 }]);
    this.panel(X(LOT / 2), H + (19 - H) / 2, Z(BLD) - 0.02, LOT, 19 - H, ['facade_rear', {}], Math.PI);
    // Ground floor: shop (west), shop (east), hall in the middle
    this.box(X(hall[0] / 2), 0, Z(3), hall[0], H, 6, '#2e2620');
    this.box(X((hall[1] + LOT) / 2), 0, Z(3), LOT - hall[1], H, 6, '#2e2620');
    this.panel(X(hall[0] / 2), H / 2, Z(0) + 0.02, hall[0], H, ['storefront_moishe_w', { type: 'storefront', sign: 'GROCERY', w: 256, h: 220 }]);
    this.panel(X((hall[1] + LOT) / 2), H / 2, Z(0) + 0.02, LOT - hall[1], H, ['storefront_moishe_e', { type: 'storefront', sign: 'SODA · סאדע', w: 256, h: 220 }]);
    // closed front-apartment rooms and rear-west apartment
    this.box(X(hall[0] / 2), 0, Z(12), hall[0], H, 12, '#3a3228');
    this.box(X((hall[1] + LOT) / 2), 0, Z(8), LOT - hall[1], H, 4, '#3a3228');
    // hall
    this.room(X(hall[0]), X(hall[1]), Z(BLD), Z(0), H, PLASTER,
      [{ side: 's', from: X(hall[0]), to: X(hall[1]) }, { side: 'n', from: X(hall[0]), to: X(hall[1]) }, { side: 'e', from: Z(14.2), to: Z(13.3) }], 0.1);
    this.floor(X((hall[0] + hall[1]) / 2), Z(BLD / 2), hall[1] - hall[0], BLD, [FLOOR[0], FLOOR[1], { repeat: [1, 8] }], 0.02);
    for (let i = 0; i < 8; i++) this.box(X(hall[0] + 0.35), i * 0.3, Z(7 + i * 0.3), 0.6, 0.06, 0.3, WOOD, { collide: false }); // stair going up
    this.box(X(hall[0] + 0.25), 0, Z(8.2), 0.5, 1.0, 2.4, WOOD, { collide: true });
    // Moishe's apartment (rear, east of hall): bedroom | kitchen | front room
    const ax0 = X(hall[1]), ax1 = X(LOT);
    this.room(ax0, ax1, Z(12.6), Z(10), H, PLASTER, [{ side: 'n', from: X(5.2), to: X(6.1) }], 0.1);            // bedroom (no window)
    this.room(ax0, ax1, Z(15.2), Z(12.6), H, PLASTER, [{ side: 's', from: X(5.2), to: X(6.1) }, { side: 'w', from: Z(14.2), to: Z(13.3) }, { side: 'n', from: X(5.2), to: X(6.1) }], 0.1); // kitchen
    this.room(ax0, ax1, Z(BLD), Z(15.2), H, PLASTER, [{ side: 's', from: X(5.2), to: X(6.1) }], 0.1);            // front room (yard windows)
    this.floor((ax0 + ax1) / 2, Z(14), ax1 - ax0, 8, [FLOOR[0], FLOOR[1], { repeat: [2, 5] }], 0.02);
    this.ceiling(X(LOT / 2), Z(BLD / 2), LOT, BLD, ['ceiling_tenement', { type: 'plaster', color: '#5f5444' }], H - 0.01);
    // windows: front room -> yard; bedroom -> air shaft (dark)
    for (const lx of [5.0, 6.6]) this.panel(X(lx), 1.6, Z(BLD) + 0.07, 0.8, 1.4, ['window_yard', { type: 'window', color: '#8a8a90', frame: '#2a2018', w: 64, h: 64 }], 0);
    this.panel(ax1 - 0.07, 1.7, Z(11.3), 0.6, 0.8, ['window_airshaft', { type: 'window', color: '#151518', w: 64, h: 64 }], -Math.PI / 2);
    // front room: the sweatshop
    this.box(X(5.9), 0, Z(16.6), 1.8, 0.76, 1.0, WOOD);
    for (const lx of [5.4, 6.4]) this.sewingMachine(X(lx), 0.76, Z(16.6));
    this.box(X(7.15), 0, Z(15.6), 0.6, 0.9, 0.6, '#2c2a30'); // pile of coats
    this.person('chana', X(5.2), Z(17.4), 0, { seated: true, photo: 'sweatshop' });
    if (!this.day2 || !flag('printed_sarah')) this.person('girl', X(6.6), Z(17.4), 0, { seated: true });   // Day 2, if printed: Sarah is at the Guild class
    this.person('moishe', X(4.9), Z(15.8), 0, { talk: this.day2 ? 'moishe2' : 'moishe' });
    if (!this.day2 && !flag('kessler_left')) this.kessler = this.person('kessler', X(7.0), Z(13.4), 0, { talk: 'kessler1', photo: null });
    this.target('sweatshop', X(5.9), 1.0, Z(16.6), 6);
    // kitchen: stove + washtub
    this.range(X(7.1), Z(14.4));
    const tub = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.3, 0.35, 12), colorMat('#8a8a84')); tub.position.set(X(5.0), 0.18, Z(12.9)); this.scene.add(tub);
    this.lamp(X(5.9), 2.4, Z(16.2), 0xffb860, 3.5, 7);
    // bedroom: two chairs pushed together, a straw tick on the floor
    this.box(X(5.9), 0, Z(10.6), 2.2, 0.16, 1.0, ['mattress_straw', { type: 'solid', color: '#8a7a58' }], { collide: false });
    this.person('boarder', X(6.8), Z(11.9), 0, { seated: true });
    this.target('tenement', X(LOT / 2), 6, Z(0) + 0.6, 30);
    this.apartmentDressing(X, Z);

    // Rivka's family at the hall door
    if (!this.day2) {
      // They wait at the street door, then walk in through the hall to Moishe's rooms.
      const inside = [[X(5.3), Z(13.6)], [X(6.1), Z(13.0)], [X(5.0), Z(12.9)]];
      const out = [[X(2.6), Z(0) + 2.0], [X(1.6), Z(0) + 2.4], [X(5.6), Z(0) + 2.2]];
      const at = flag('family_inside') ? inside : out;
      this.family = [
        this.person('rivka', at[0][0], at[0][1], 0, { talk: flag('family_inside') ? 'rivka_home' : 'rivka_les' }),
        this.person('mama', at[1][0], at[1][1], 0, { talk: 'mama', photo: null }),
        this.person('shmuel', at[2][0], at[2][1], 0, { talk: 'shmuel', photo: null }),
      ];
      this.familyPath = (i) => [[X(3.75), Z(0) + 1.2 + i * 0.5], [X(3.75), Z(13.75)], [X(4.9), Z(13.75)], inside[i]];
      this.kesslerPath = [[X(5.6), Z(13.75)], [X(3.75), Z(13.75)], [X(3.75), Z(0) + 1.5], [X(-6), Z(0) + 3.5]];
    } else {
      this.person('mama', X(5.4), Z(13.9), 0, { talk: 'mama2', photo: null });
      this.person('shmuel', X(6.0), Z(12.9), 0, { talk: 'shmuel2', photo: null, scale: 1 });
    }

    // ---- back yard ----
    const yz = Z(BLD), yz1 = Z(BLD + YARD);
    this.floor(X(LOT / 2), (yz + yz1) / 2, LOT, YARD, [DIRT[0], DIRT[1], { repeat: [2, 2] }], 0.02);
    this.box(X(LOT - 0.7), 0, yz1 + 0.8, 1.2, 2.2, 1.2, WOOD);   // privy
    this.panel(X(LOT - 0.7), 1.1, yz1 + 1.42, 0.6, 1.6, ['privy_door', { type: 'planks', color: '#4a3826', n: 3 }]);
    this.readable('privy', X(LOT - 0.7), 1.2, yz1 + 2.0, { prompt: 'Look at the privy', photo: 'privy' });
    this.hydrant(X(0.7), yz - 1.2);   // the building's only water: one hydrant in the yard
    for (const lx of [0.6, 1.3]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 10), colorMat('#3c3a36')); b.position.set(X(lx), 0.4, yz1 + 0.6); this.scene.add(b); }
    for (let i = 0; i < 4; i++) {           // laundry lines on pulleys, building to rear building, several stories up
      const y = 4 + i * 2.6;
      const line = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, YARD), colorMat('#bbb'));
      line.position.set(X(2 + i * 1.2), y, (yz + yz1) / 2); this.scene.add(line);
      for (let k = 0; k < 3; k++) this.panel(X(2 + i * 1.2), y - 0.45, yz - 1 - k * 1.8, 0.8, 0.9, ['laundry_' + ((i + k) % 3), { type: 'solid', color: ['#d8d0c0', '#9a8a7a', '#b0a8c0'][(i + k) % 3] }], Math.PI / 2, true);
    }
    if (!this.day2) this.person('riis', X(3.2), yz - 3.0, 0);
    this.crowd(5, X(1.2), yz - 4.6, 0, { scale: 0.72 });
    this.flash = new THREE.PointLight(0xffffff, 0, 14, 1.2);
    this.flash.position.set(X(3.8), 2.4, yz - 2.4); this.scene.add(this.flash);
    let next = 4;
    this.updaters.push((dt, t) => {
      this.flash.intensity = Math.max(0, this.flash.intensity - dt * 60);
      const p = this.game.controls.pos;
      if (t > next) { next = t + 7 + Math.random() * 5; if (p.z < yz + 2 && p.z > yz1 - 1 && p.x > MX - 1 && p.x < MX + LOT + 1) this.flash.intensity = 30; }
    });
  }

  /** Singer-style sewing machine head on a table top at height y. */
  sewingMachine(x, y, z) {
    const BLACK = '#141414', GOLD = '#a8883a';
    this.box(x, y, z, 0.42, 0.04, 0.2, '#2a2420', { collide: false });                 // bed plate
    this.box(x + 0.15, y + 0.04, z, 0.08, 0.22, 0.1, BLACK, { collide: false });        // pillar
    this.box(x - 0.01, y + 0.24, z, 0.4, 0.07, 0.09, BLACK, { collide: false });        // arm
    this.box(x - 0.18, y + 0.08, z, 0.06, 0.18, 0.08, BLACK, { collide: false });       // head with needle bar
    this.box(x + 0.02, y + 0.255, z + 0.047, 0.18, 0.03, 0.005, GOLD, { collide: false }); // gilt decal
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), colorMat('#2a2a2a')); wheel.rotation.x = Math.PI / 2; wheel.position.set(x + 0.2, y + 0.17, z - 0.07); this.scene.add(wheel);
    const spool = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.05, 6), colorMat('#d8d0c0')); spool.position.set(x + 0.05, y + 0.31, z); this.scene.add(spool);
    // iron treadle frame under the table
    for (const e of [-0.2, 0.2]) this.box(x + e, 0, z, 0.04, y - 0.02, 0.5, '#1e1e1e', { collide: false });
    this.box(x, 0.08, z + 0.05, 0.4, 0.03, 0.3, '#1e1e1e', { collide: false });
  }

  /** Cast-iron coal range with stovepipe, kettle, pot and a sad-iron warming on top. */
  range(x, z) {
    this.box(x, 0.18, z, 0.62, 0.62, 0.9, '#1a1a1a');
    for (const e of [-0.3, 0.3]) for (const f of [-0.42, 0.42]) this.box(x + e * 0.9, 0, z + f * 0.9, 0.06, 0.18, 0.06, '#1a1a1a', { collide: false });
    this.box(x - 0.315, 0.3, z + 0.12, 0.01, 0.34, 0.4, '#2a2a2a', { collide: false });     // oven door
    this.box(x - 0.32, 0.47, z + 0.12, 0.02, 0.03, 0.18, '#8a8a84', { collide: false });     // handle
    this.box(x - 0.315, 0.32, z - 0.25, 0.01, 0.12, 0.2, '#ff8a3a', { collide: false });     // firebox glow
    this.box(x, 0.8, z, 0.66, 0.04, 0.94, '#262626', { collide: false });                    // top plate
    this.box(x + 0.15, 0.84, z - 0.3, 0.12, 1.5, 0.12, '#1a1a1a', { collide: false });       // stovepipe
    this.box(x + 0.27, 2.24, z - 0.3, 0.24, 0.12, 0.12, '#1a1a1a', { collide: false });      // elbow into the chimney
    const kettle = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), colorMat('#5a5650')); kettle.scale.y = 0.8; kettle.position.set(x - 0.1, 0.92, z + 0.2); this.scene.add(kettle);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.13, 0.18, 12), colorMat('#3a3a3a')); pot.position.set(x - 0.08, 0.91, z - 0.15); this.scene.add(pot);
    this.box(x + 0.12, 0.82, z + 0.32, 0.16, 0.08, 0.08, '#2a2a2a', { collide: false });    // sad-iron for pressing seams
    const scuttle = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.18, 0.3, 10), colorMat('#2e2c28')); scuttle.position.set(x - 0.1, 0.15, z + 0.75); this.scene.add(scuttle);
    for (let i = 0; i < 5; i++) { const c = new THREE.Mesh(new THREE.DodecahedronGeometry(0.05), colorMat('#121212')); c.position.set(x - 0.1 + Math.sin(i * 2) * 0.07, 0.31, z + 0.75 + Math.cos(i * 2) * 0.07); this.scene.add(c); }
  }

  /** Everyday things in the two-room-and-bedroom flat (Riis photographs; 97 Orchard St). */
  apartmentDressing(X, Z) {
    const WOODC = '#5c4630', NAVY = '#2a2e3a', GRAY = '#4a4a4e';
    // FRONT ROOM (the sweatshop): bundles of cut coat pieces everywhere
    for (const [lx, lz, w, d, c] of [[5.75, 16.45, 0.5, 0.36, NAVY], [6.15, 16.85, 0.4, 0.3, GRAY]]) this.box(X(lx), 0.76, Z(lz), w, 0.07, d, c, { collide: false });
    for (let i = 0; i < 5; i++) this.box(X(7.2), 0.9 + i * 0.12, Z(15.6) + (i % 2) * 0.06, 0.55 - i * 0.04, 0.12, 0.5, i % 2 ? NAVY : GRAY, { collide: false });  // coats piled to finish
    for (const [lx, lz, c] of [[4.75, 17.65, NAVY], [7.25, 17.6, GRAY], [7.3, 17.1, NAVY]]) { const h = this.box(X(lx), 0, Z(lz), 0.6, 0.35, 0.5, c, { collide: false }); h.rotation.y = lx; }
    for (const lx of [5.2, 6.6]) { this.box(X(lx), 0, Z(17.75), 0.42, 0.45, 0.4, WOODC, { collide: false }); this.box(X(lx), 0.45, Z(17.93), 0.42, 0.5, 0.04, WOODC, { collide: false }); }   // chairs
    // kerosene lamp on the table
    const lb = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 0.14, 10), colorMat('#7a8a6a')); lb.position.set(X(6.55), 0.83, Z(16.3)); this.scene.add(lb);
    const ch = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.05, 0.2, 8), colorMat('#fff0c8', { basic: true })); ch.position.set(X(6.55), 1.0, Z(16.3)); this.scene.add(ch);
    // lace valances on the yard windows, a shelf of dishes, a portrait, a Yiddish calendar
    for (const lx of [5.0, 6.6]) this.box(X(lx), 2.1, Z(BLD) + 0.1, 0.95, 0.3, 0.02, '#e8e2d2', { collide: false });
    this.box(X(LOT) - 0.15, 1.75, Z(16.6), 0.22, 0.03, 1.1, WOODC, { collide: false });
    for (let i = 0; i < 4; i++) { const d = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.02, 10), colorMat(i % 2 ? '#e8e4dc' : '#7a8aa0')); d.rotation.z = Math.PI / 2; d.position.set(X(LOT) - 0.12, 1.86, Z(16.2) - i * 0.24); this.scene.add(d); }
    this.panel(X(LOT) - 0.11, 2.0, Z(17.3), 0.36, 0.46, ['picture_portrait', { type: 'card', title: 'Mama & Papa', lines: 'Kovno, 1871', color: '#c8b896', w: 96, h: 128 }], -Math.PI / 2);
    this.panel(X(4.4) + 0.11, 1.7, Z(16.9), 0.4, 0.55, ['calendar_yiddish', { type: 'card', title: 'לוח', lines: '5649\nתשרי · חשון', color: '#e8dcc0', w: 96, h: 128 }], Math.PI / 2);
    for (const lz of [15.6, 15.9]) this.box(X(4.4) + 0.08, 1.2, Z(lz), 0.05, 0.75, 0.32, lz > 15.7 ? '#3a3240' : '#5a3a2a', { collide: false });   // coats on nails
    // KITCHEN: mantel shelf with Sabbath candlesticks, washboard by the tub, a tin on a nail
    this.box(X(LOT) - 0.15, 1.55, Z(13.6), 0.22, 0.04, 0.9, WOODC, { collide: false });
    for (const dz of [-0.15, 0.15]) { const cs = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.05, 0.24, 8), colorMat('#b8913a')); cs.position.set(X(LOT) - 0.15, 1.69, Z(13.6) + dz); this.scene.add(cs); const cn = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.12, 6), colorMat('#f0ead8')); cn.position.set(X(LOT) - 0.15, 1.87, Z(13.6) + dz); this.scene.add(cn); }
    const wb = this.box(X(5.35), 0, Z(12.75), 0.38, 0.6, 0.03, '#8a7a5a', { collide: false }); wb.rotation.x = -0.2;
    this.box(X(LOT) - 0.12, 1.25, Z(12.9), 0.03, 0.3, 0.24, '#7a7a74', { collide: false });
    // BEDROOM: the steamer trunk they carried from Europe, clothes on a line
    this.box(X(4.85), 0, Z(11.9), 0.75, 0.48, 0.45, ['trunk_steamer', { type: 'planks', color: '#6a4a2a', n: 3 }], { collide: false });
    for (const dz of [-0.15, 0.15]) this.box(X(4.85), 0, Z(11.9) + dz, 0.77, 0.5, 0.03, '#2a2420', { collide: false });
    this.box(X(5.9), 2.0, Z(11.3), 2.8, 0.01, 0.01, '#bbb', { collide: false });
    for (const [lx, c] of [[5.1, '#d8d0c0'], [5.6, '#8a6a5a'], [6.4, '#c8c0b0']]) this.box(X(lx), 1.45, Z(11.3), 0.4, 0.55, 0.01, c, { collide: false });
    // HALL: one dim gas jet for four families (halls were pitch dark; the 1879 law asked for some light)
    this.lamp(X(3.75), 2.35, Z(9.5), 0xffb060, 1.6, 5);
  }

  onAction(name) {
    if (name === 'familyEnters' && this.family && !flag('family_inside')) {
      state.flags.family_inside = true;
      this.family.forEach((n, i) => this.walkTo(n, this.familyPath(i), null, 1.5 - i * 0.1));
      this.family[0].talkTree = 'rivka_home';
    } else if (name === 'kesslerLeaves' && this.kessler) {
      state.flags.kessler_left = true;
      const k = this.kessler; k.it.hidden = true;
      this.walkTo(k, this.kesslerPath, () => { k.group.visible = false; }, 1.7);
    }
    this.game.refreshObjectives();
  }

  // ------------------------------------------------------------ elevated railways
  elevated(name, [cx0, cx1], z0, z1, stations = []) {
    const deckY = 5.2;
    const mid = (cx0 + cx1) / 2;
    for (let z = z0; z < z1; z += 13.7) for (const x of [cx0, cx1]) {
      this.box(x, 0, z, 0.35, deckY, 0.35, IRON);
    }
    // lattice girders + deck
    this.box(mid, deckY, (z0 + z1) / 2, cx1 - cx0 + 1, 0.55, z1 - z0, ['el_girder', { type: 'planks', color: '#3b3a35', n: 2 }], { collide: false });
    for (const x of [cx0, cx1]) this.box(x, deckY + 0.55, (z0 + z1) / 2, 0.12, 0.9, z1 - z0, IRON, { collide: false });
    for (const dx of [-2.2, -1.0, 1.0, 2.2]) this.box(mid + dx, deckY + 0.56, (z0 + z1) / 2, 0.08, 0.1, z1 - z0, '#555', { collide: false });
    // wooden gabled stations
    for (const st of stations) {
      for (const sx of [-1, 1]) {
        const px = mid + sx * ((cx1 - cx0) / 2 + 1.6);
        this.box(px, deckY + 0.2, st.z, 3, 0.3, 16, '#4a3a2a', { collide: false });
        this.box(px, deckY + 0.5, st.z, 3, 2.6, 6, ['wall_el_station', { type: 'planks', color: '#6a5a40', n: 4 }], { collide: false });
        const roof = new THREE.Mesh(new THREE.ConeGeometry(2.6, 1.4, 4), colorMat('#3a2a22')); roof.position.set(px, deckY + 3.8, st.z); roof.rotation.y = Math.PI / 4; roof.scale.set(0.9, 1, 1.9); this.scene.add(roof);
      }
    }
    // a train
    const train = new THREE.Group();
    const eng = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.4, 5), colorMat('#151515')); eng.position.y = 1.2; train.add(eng);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.35, 1, 8), colorMat('#111')); stack.position.set(0, 2.9, -1.6); train.add(stack);
    for (let i = 1; i <= 3; i++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.6, 9.4), material('el_car', { type: 'planks', color: '#5c1f1f', n: 3 })); car.position.set(0, 1.3, i * 10); train.add(car);
      const roof = new THREE.Mesh(new THREE.BoxGeometry(2.7, 0.2, 9.6), colorMat('#2a1a14')); roof.position.set(0, 2.7, i * 10); train.add(roof);
      for (const sx of [-1, 1]) for (let w = -3.5; w <= 3.5; w += 1.4) { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.7), colorMat('#e8d090', { basic: true })); win.position.set(sx * 1.26, 1.7, i * 10 + w); win.rotation.y = sx * Math.PI / 2; train.add(win); }
    }
    train.position.set(mid + 1.6, deckY + 0.6, z0);
    this.scene.add(train);
    const speed = 13, len = z1 - z0 + 120, offset = name === 'Allen' ? 0 : 40;
    this.updaters.push((dt, t) => {
      const s = (t * speed + offset * speed) % (len * 2);
      const north = s > len;
      train.position.z = north ? z1 + 60 - (s - len) : z0 - 60 + s;
      train.position.x = mid + (north ? -1.6 : 1.6);
      train.rotation.y = north ? 0 : Math.PI;
      const p = this.game.controls.pos;
      if (Math.abs(p.x - mid) < 40 && Math.abs(train.position.z - p.z) < 18 && !train.userData.heard) { sfx('train'); train.userData.heard = true; }
      if (Math.abs(p.x - mid) < 14 && Math.abs(train.position.z - 15 * (north ? -1 : 1) - p.z) < 22) this.game.controls.shake = 1;
      if (Math.abs(train.position.z - p.z) > 40) train.userData.heard = false;
    });
    this.target('el', mid, deckY, name === 'Allen' ? 0 : 0, 30);
  }

  // ------------------------------------------------------------ Hester Street life
  hester() {
    const r = this.rand;
    // shop signs along Hester (both sides) and the Bowery and Mott
    for (const [bx0, bx1] of BX.slice(2, 7)) for (let x = bx0 + 3.8; x < bx1 - 2; x += LOT) {
      if (x > MX - 1 && x < MX + LOT + 1) continue;
      this.sign(x, EW.Hester[0], 's', SIGNS.hester[Math.floor(r() * SIGNS.hester.length)], 5.6, 'hester_north');
      this.sign(x, EW.Hester[1], 'n', SIGNS.hester[Math.floor(r() * SIGNS.hester.length)], 5.6, 'hester_south');
    }
    for (let z = -45; z < 45; z += LOT) if (Math.abs(z) > 8) {
      this.sign(NS.Bowery[0], z, 'e', SIGNS.bowery[Math.floor(r() * SIGNS.bowery.length)], 5.4, 'bowery_west');
      this.sign(NS.Bowery[1], z, 'w', SIGNS.bowery[Math.floor(r() * SIGNS.bowery.length)], 5.4, 'bowery_east');
    }
    // pushcarts along both curbs, Eldridge to Orchard
    const goods = ['#6a7a3a', '#a05a3a', '#d0c080', '#8a8a8a', '#5a3a6a', '#c86a2a', '#3a4a6a', '#9a3a2a'];
    let n = 0;
    for (let x = 2; x < 56; x += 5.2) {
      if (x > 19 && x < 39) continue; // the El corner stays clear
      for (const side of [-1, 1]) {
        if ((x * 7 + side) % 3 < 0.6) continue;
        this.cart(x, side * 3.6, side < 0 ? 0 : Math.PI, goods[n % goods.length]);
        if (!(x === 7.2 && side === -1)) this.crowd(n, x + 0.2, side * 5.2, 0);
        n++;
      }
    }
    // Mrs. Gold's cart
    this.cart(-4, -3.6, 0, '#6a7a3a');
    this.person('peddler', -4, -5.2, 0, { photo: 'pushcart' });
    // Herschel on Orchard Street (the other big pushcart street)
    this.cart(70, -24, Math.PI / 2, '#8a8a8a');
    this.person('peddler2', 71.8, -24, 0, { photo: null });
    for (let z = -40; z < 40; z += 9) if (Math.abs(z + 24) > 4) { this.cart(70.2, z, Math.PI / 2, goods[(z + 40) % 8]); this.crowd(Math.abs(z), 68, z + 1, 0); }
    // shoppers
    for (let i = 0; i < 9; i++) {
      const x = -6 + r() * 64, z = (r() - 0.5) * 6;
      if (x > MX - 1 && x < MX + LOT + 1 && z < -2) continue;
      if (Math.abs(x + 4) < 2.2 && z < 0) continue;
      this.crowd(i, x, z, 0);
    }
    for (let i = 0; i < 10; i++) this.crowd(i + 3, -125 + (r() - 0.5) * 22, (r() - 0.5) * 60, 0); // the Bowery
    for (let i = 0; i < 6; i++) this.crowd(i + 1, -45 + (r() - 0.5) * 5, -20 - r() * 70, 0);       // Forsyth

    // Newsboy at Hester & Allen
    this.box(18.6, 0, 5.8, 1.3, 0.95, 0.7, WOOD);
    this.person('newsboy', 18.8, 4.6, 0, { talk: this.day2 ? 'newsboy2' : 'newsboy' });

    // Nativism: Mrs. Brennan and a handbill, north side between Forsyth and Eldridge
    this.panel(-26, 1.7, EW.Hester[0] + 0.03, 0.8, 1.1, ['handbill_nativist', { type: 'card', title: 'Americans, Wake Up!', lines: 'America for Americans!', color: '#e8dcc0', w: 160, h: 224 }]);
    this.readable('handbill', -26, 1.7, EW.Hester[0] + 0.7, { prompt: 'Read the handbill', photo: 'handbill' });
    this.person('brennan', -28.2, -5.6, 0, { talk: this.day2 ? 'brennan2' : 'brennan' });

    // Ward boss with coal, outside a corner saloon (Hester & Eldridge, SE corner)
    this.sign(3.6, EW.Hester[1], 'n', 'SALOON · DEMOCRATIC CLUB', 6.6, 'saloon');
    for (let i = 0; i < 4; i++) this.box(5 + i * 0.55, 0, 6.5, 0.5, 0.5 + (i % 2) * 0.1, 0.5, '#1d1b1a');
    if (!this.day2) { this.person('boss', 3.2, 5.6, 0); this.crowd(5, 4.6, 4.3, 0); }
    else {
      // Election eve rally: Quinn on a coal wagon, a crowd around him
      this.box(4.2, 0, 3.0, 2.2, 0.9, 3.6, ['wood_cart', { type: 'planks', color: '#6a4a2a', n: 4 }]);
      this.person('boss', 4.2, 3.0, 0, { talk: 'boss2', y: 0.9 });
      this.interact({ x: 4.2, y: 1.6, z: 1.2, r: 2.6, prompt: 'Listen to Mr. Quinn', action: () => this.game.talk('boss2') });
      [[1.8, 0.4, 0], [6.4, 0.6, 2], [3.0, -1.2, 4], [5.6, -1.0, 7], [2.2, 2.2, 1], [7.2, 2.6, 3]].forEach(([x, z, n]) => this.crowd(n, x, z, 0));
      // Kessler's cloak shop, Rivka outside, Esther on a crate across the street
      this.sign(-20, EW.Hester[0], 's', 'KESSLER · CLOAKS & SUITS', 6.4, 'kessler');
      this.person('kessler', -21.6, -5.9, 0, { talk: 'kessler2', photo: null });
      this.person('rivka', -18.0, -5.4, 0, { talk: 'rivka2' });
      this.box(-19.5, 0, 5.6, 0.9, 0.5, 0.7, ['trunk', { type: 'planks', color: '#6a4426', n: 3 }]);
      this.person('esther', -19.5, 5.6, 0, { talk: 'esther', photo: 'esther', y: 0.5 });
      this.interact({ x: -19.5, y: 1.3, z: 4.4, r: 2.4, prompt: 'Listen to Esther Lipsky', action: () => this.game.talk('esther') });
      [[-21, 3.6, 1], [-18, 3.4, 6], [-20.2, 2.4, 3]].forEach(([x, z, n]) => this.crowd(n, x, z, 0));
      // Whitcomb handing out Hewitt leaflets; Giuseppe waiting for the horsecar
      this.person('guild', 13.5, 5.8, 0, { talk: 'guild2', photo: null });
      this.person('giuseppe', -106.5, 6.4, 0, { talk: 'giuseppe3', photo: 'giuseppe2' });
    }

    // sidewalk clutter: barrels, crates, hydrants, a horse trough, cellar doors
    for (const [x, z] of [[-9, -6.4], [10.5, 6.5], [-31, 6.4], [52, -6.4], [-58, 6.5], [39.5, -6.5]]) { this.barrel(x, z); this.barrel(x + 0.7, z + 0.1, '#4a3a2a'); }
    for (const [x, z] of [[-14, 6.6], [26, -6.6], [-45, -6.6], [47, 6.6]]) { this.crate(x, z, 0.7); this.crate(x + 0.75, z, 0.5); }
    for (const [x, z] of [[-16.5, -4.9], [20.5, -4.9], [-53.5, 4.9], [57.5, 4.9]]) this.hydrant(x, z);
    this.box(-70, 0, 4.6, 2.2, 0.55, 0.7, ['seawall_granite', { type: 'ashlar', color: '#9a9892', mortar: '#6e6c68', rows: 2, w: 512, h: 128 }]);   // horse trough
    this.box(-70, 0.5, 4.6, 1.9, 0.06, 0.5, '#4a5a62', { collide: false });
    for (const x of [-24, 8.5, 30.5, 49]) this.box(x, 0, -6.6, 1.3, 0.1, 1.5, '#2a2a2a', { collide: false });   // iron cellar doors
    // painted wall advertisements on blank side walls
    this.panel(-37.44, 9, -30, 9, 4.5, ['wallsign_0', { type: 'sign', title: 'M. STEIN · FURNITURE & BEDDING · 84 GRAND ST.', color: '#1a1e2a', ink: '#efe6cf', w: 512, h: 256 }], Math.PI / 2);
    this.panel(21.44, 10, 30, 9, 4.5, ['wallsign_1', { type: 'sign', title: 'CASTORIA · CHILDREN CRY FOR IT', color: '#141414', ink: '#efe6cf', w: 512, h: 256 }], -Math.PI / 2);

    // gas lamps (cast-iron post, ladder bar, 4-sided lantern)
    for (const [x, z, lit] of [[-12, -5.4, true], [16, 5.4, false], [40, 5.4, true], [57, -5.4, true], [-34, 5.4, false], [-60, -5.4, false], [-100, 5.4, false]]) this.gaslamp(x, z, lit);

    // Horsecar stop on the Bowery: exit to the wrap-up
    this.box(-108.6, 0, 9.5, 0.1, 2.6, 0.1, '#222');
    this.panel(-108.6, 2.7, 9.56, 1.6, 0.5, ['sign_horsecar_stop', { type: 'sign', title: 'BOWERY CARS · PARK ROW', w: 224, h: 72 }], 0);
    this.horsecarStatic(-112, 16);
    const ex = this.day2
      ? this.exit(-109.5, 9.5, 'Take the horsecar down the Bowery to Park Row', () => this.ready(), () => { this.game.spend(5, 'horsecar fare'); this.game.goParkRow(); })
      : this.exit(-109.5, 9.5, 'Take the horsecar down the Bowery to the Courier office (finish the story)', () => this.ready(), () => { this.game.spend(5, 'horsecar fare'); this.game.openWrapup('A'); });
    ex.lockedMsg = 'Not yet. Finish your goal (top left) first.';

    // street name signs at corners
    for (const [nm, x] of Object.entries(NS)) this.streetSign(nm.toUpperCase() === 'BOWERY' ? 'BOWERY' : nm.toUpperCase() + ' ST', x[1] + 1.2, -6.2);
    this.streetSign('HESTER ST', 20.3, 6.2); this.streetSign('GRAND ST', 20.3, -63.8); this.streetSign('CANAL ST', -17.3, 61); this.streetSign('PELL ST', -159.3, 86.5);
  }

  landmarks() {
    // ---- Eldridge Street Synagogue (1887), east side of Eldridge, south of Canal ----
    this.building(-0.5, 20, 66, 82, 21, { w: ['facade_eldridge_synagogue', { type: 'synagogue', w: 320, h: 448 }] }, null, { lot: 16 });
    this.target('synagogue', -0.5, 9, 74, 30);
    this.panel(-0.53, 1.6, 79.5, 0.9, 1.2, ['board_society', { type: 'card', title: 'Kiever Society', lines: 'Dues 25¢\nSick pay\nLoans\nBurial', w: 160, h: 208 }], -Math.PI / 2);
    this.readable('society', -1.2, 1.6, 79.5, { prompt: 'Read the notice board', photo: 'society' });
    this.person('rabbi', -2.6, 76.8, 0);
    this.crowd(7, -3.5, 70, 0); this.crowd(1, -4.2, 71, 0);
    this.gaslamp(-1.6, 67, true);

    // ---- Mott Street: Church of the Transfiguration and Chinatown ----
    this.building(-160.5, -146, 66, 84, 15, { w: ['facade_transfiguration', { type: 'church', w: 320, h: 384 }] }, ['wall_church_side', { type: 'stone', color: '#7a7266', rows: 8 }], { lot: 18 });
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(1.4, 1.6, 6, 8), colorMat('#d9d2c0')); tower.position.set(-155, 18, 75); this.scene.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(1.6, 3, 8), colorMat('#5a6a5a')); cap.position.set(-155, 22.5, 75); this.scene.add(cap);
    this.target('parish', -160.5, 7, 75, 30);
    this.person('priest', -162.4, 76, 0);
    if (!this.day2) this.person('giuseppe', -163.4, 71.5, 0, { talk: 'giuseppe2', photo: 'giuseppe2' });
    // Chinese shops on Mott south of Pell, and on Pell
    this.panel(-160.47, 3.4, 100, 6, 0.9, ['sign_lee_shop', { type: 'sign', title: 'LEE FONG & CO. · 茶 TEAS · GROCERIES', color: '#6a1f1a', w: 448, h: 64 }], -Math.PI / 2);
    this.panel(-160.62, 1.4, 103.5, 2.6, 2.2, ['window_lee_shop', { type: 'card', title: 'Teas', lines: 'Rice · Dried fish · Medicine · Letters home', color: '#d8b070', w: 192, h: 176 }, { emissive: '#553300', emissiveIntensity: 0.5 }], -Math.PI / 2);
    for (const [z, t] of [[106, '雜貨'], [111, '中華']]) this.panel(-160.47, 4.5, z, 0.7, 2.4, ['sign_vert_' + z, { type: 'sign', title: t, color: '#7a1a14', ink: '#e8c060', w: 64, h: 220 }], -Math.PI / 2);
    for (let x = -158; x < -140; x += 6) this.sign(x, PELL[1], 'n', SIGNS.mott[Math.floor(this.rand() * SIGNS.mott.length)], 5, 'pell');
    this.person('lee', -154.3, 101.5, 0, { talk: this.day2 ? 'lee2' : 'lee' });
    this.leeShop();
    for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), colorMat('#e04a2a', { emissive: '#801a0a' })); l.position.set(-161.2, 4.3, 98 + i * 1.6); this.scene.add(l); }
    this.crowd(7, -167, 95, 0); this.crowd(4, -150, 92, 0); this.crowd(2, -166, 60, 0); this.crowd(0, -168, 30, 0);
    this.gaslamp(-161.6, 94, true);

    // ---- The Neighborhood Guild, 146 Forsyth Street (compressed north of Grand) ----
    this.panel(-37.47, 2.8, -84, 6, 5, ['facade_neighborhood_guild', { type: 'card', title: 'The Neighborhood Guild', lines: '146 Forsyth St. · Founded 1886\nClubs · Reading Room · Kindergarten', color: '#d8ccb0', w: 288, h: 240 }], Math.PI / 2);
    this.readable('guildsign', -38.2, 2, -80.5, { prompt: 'Read the Guild sign' });
    if (!this.day2) this.person('guild', -39.6, -84, 0);
    this.target('guild', -37.5, 3, -84, 22);
    this.crowd(5, -41, -86.5, 0, { scale: 0.75 }); this.crowd(0, -42, -85, 0, { scale: 0.72 });
    this.gaslamp(-38.4, -78, true);
  }

  wires() {
    // 1888: the peak of the overhead "wire forest"
    const poles = [];
    for (let x = -100; x <= 70; x += 24) poles.push([x, 6.9]);
    for (const [x, z] of poles) {
      this.box(x, 0, z, 0.3, 13, 0.3, '#4a3a2a', { collide: true });
      for (let k = 0; k < 4; k++) this.box(x, 10 + k * 0.8, z, 0.12, 0.1, 2.6, '#4a3a2a', { collide: false });
    }
    const mat = new THREE.LineBasicMaterial({ color: 0x1a1a1a });
    for (let i = 0; i < poles.length - 1; i++) for (let k = 0; k < 4; k++) for (const dz of [-1.1, -0.4, 0.4, 1.1]) {
      const a = poles[i], b = poles[i + 1], y = 10.1 + k * 0.8;
      const pts = []; for (let t = 0; t <= 6; t++) { const u = t / 6; pts.push(new THREE.Vector3(a[0] + (b[0] - a[0]) * u, y - Math.sin(u * Math.PI) * 0.5, a[1] + dz)); }
      this.scene.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), mat));
    }
  }

  // ------------------------------------------------------------ building detail (real depth, not paint)
  dress(x0, x1, z0, z1, h) {
    const r = this.rand;
    const lots = Math.max(1, Math.round((x1 - x0) / LOT)), lw = (x1 - x0) / lots;
    for (const [z, dir] of [[z0, -1], [z1, 1]]) {
      // projecting pressed-metal cornice with brackets
      this.box((x0 + x1) / 2, h - 0.75, z + dir * 0.32, x1 - x0, 0.75, 0.64, '#3b3530', { collide: false });
      for (let x = x0 + 0.5; x < x1; x += 1.9) this.box(x, h - 1.25, z + dir * 0.22, 0.22, 0.5, 0.44, '#2e2a26', { collide: false });
      // chimney stacks on the party walls
      if (dir === 1) for (let i = 0; i <= lots; i++) if (r() < 0.7) this.box(x0 + i * lw + (i === 0 ? 0.4 : i === lots ? -0.4 : 0), h, (z0 + z1) / 2 + (r() - 0.5) * 6, 0.7, 1.1 + r() * 0.8, 1.2, ['chimney_brick', { type: 'brick', color: '#6e3426' }], { collide: false });
      const onHester = (dir === 1 && z === EW.Hester[0]) || (dir === -1 && z === EW.Hester[1]);
      if (!onHester) continue;
      for (let i = 0; i < lots; i++) {
        const u = (f) => dir === 1 ? x0 + (i + f) * lw : x1 - (i + f) * lw;   // facade texture runs right-to-left on north faces
        // stoop at the tenement hall door
        this.box(u(0.89), 0, z + dir * 0.45, 1.1, 0.22, 0.9, '#6a645a', { collide: false });
        // canvas awning over the shop window
        if (r() < 0.55) {
          const k = Math.floor(r() * 3);
          const aw = this.box(u(0.31), 2.55, z + dir * 0.85, lw * 0.5, 0.05, 1.8, ['awning_' + k, { type: 'awning', color: ['#8a2e2a', '#3a5a3a', '#7a6a4a'][k], w: 128, h: 64 }], { collide: false });
          aw.rotation.x = dir * 0.42;
          for (const e of [-1, 1]) this.box(u(0.31) + e * lw * 0.24, 0, z + dir * 1.6, 0.05, 2.25, 0.05, '#2a2a2a', { collide: false });
        }
        // iron fire escape: balconies with railings, joined by ladders
        if (r() < 0.6) {
          for (let f = 0; f < 4; f++) {
            const y = h * (0.2 + 0.1525 * f) + h * 0.035;
            this.box(u(0.5), y, z + dir * 0.5, lw * 0.56, 0.06, 0.95, '#151515', { collide: false });
            this.box(u(0.5), y + 0.85, z + dir * 0.95, lw * 0.56, 0.04, 0.04, '#151515', { collide: false });
            for (const e of [-1, 0, 1]) this.box(u(0.5) + e * lw * 0.27, y, z + dir * 0.95, 0.04, 0.85, 0.04, '#151515', { collide: false });
            if (f < 3) this.box(u(0.5) + (f % 2 ? 1 : -1) * lw * 0.18, y, z + dir * 0.6, 0.35, h * 0.1525, 0.04, '#151515', { collide: false });
            if (r() < 0.3) this.box(u(0.5) + lw * 0.1, y + 0.85, z + dir * 0.98, 1.2, 0.5, 0.05, ['laundry_' + (f % 3), { type: 'solid', color: ['#d8d0c0', '#9a8a7a', '#b0a8c0'][f % 3] }], { collide: false }); // bedding airing
          }
        }
      }
    }
  }

  /** Upper floors over a walk-in ground floor. */
  upper(x0, x1, z0, z1, y0, h, fronts) {
    const m = this.building(x0, x1, z0, z1, h - y0, fronts, null, { collide: false });
    m.position.y = y0 + (h - y0) / 2;
    this.box((x0 + x1) / 2, h - 0.75, (z0 + z1) / 2, x1 - x0 + 0.6, 0.75, z1 - z0 + 0.6, '#3b3530', { collide: false });
    return m;
  }

  // ------------------------------------------------------------ walk-in: Mr. Lee's shop on Mott Street
  leeShop() {
    const x0 = -160.5, x1 = -153, z0 = 98, z1 = 105, H = 3;
    const RED = ['wall_lee_shop', { type: 'plaster', color: '#7a3a2c' }];
    const up = ['facade_upper', { type: 'facade', color: '#7a3a2c', floors: 4, bays: 4, storeFrac: 0.02, escape: true, lit: 0.3, w: 256, h: 448 }];
    this.upper(x0, x1, z0, z1, H, 17, { w: up });
    this.room(x0, x1, z0, z1, H, RED, [{ side: 'w', from: 100.6, to: 102, lintel: true }], 0.14);
    this.floor((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, [FLOOR[0], FLOOR[1], { repeat: [3, 3] }], 0.02);
    this.ceiling((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, ['ceiling_tenement', { type: 'plaster', color: '#5f5444' }], H - 0.01);
    this.panel(x0 - 0.1, 1.4, 99.3, 2.4, 2.2, ['storefront_lee_south', { type: 'card', title: '雜貨', lines: 'Rice · Dried fish · Ginger', color: '#d8b070', w: 192, h: 176 }], -Math.PI / 2);
    // counter, shelves of tea tins, scale, abacus, hanging lanterns
    this.box(-155.6, 0, 101.5, 0.7, 1.0, 4.4, WOOD);
    this.panel(x1 - 0.12, 1.7, 101.5, 5.6, 2.2, ['shelves_lee_shop', { type: 'card', title: '茶', lines: 'Tea tins · Jars of herbs · Porcelain · Paper lanterns', color: '#6a4a2a', ink: '#e8c060', w: 320, h: 160 }], -Math.PI / 2);
    this.box(-155.6, 1.0, 100.2, 0.4, 0.3, 0.4, '#b8913a', { collide: false });
    for (const [x, z] of [[-158.6, 99], [-158.9, 104], [-157.4, 104.2]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.7, 10), colorMat('#6a5a3a')); b.position.set(x, 0.35, z); this.scene.add(b); this.colliders.push({ minX: x - 0.3, maxX: x + 0.3, minZ: z - 0.3, maxZ: z + 0.3, see: true }); }
    for (const z of [99.5, 103.5]) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), colorMat('#e04a2a', { emissive: '#801a0a' })); l.position.set(-157.5, 2.55, z); this.scene.add(l); }
    this.lamp(-157.2, 2.5, 101.5, 0xffb070, 4, 8);
  }

  // ------------------------------------------------------------ walk-in: saloon / Tammany district club
  saloon() {
    const x0 = -0.5, x1 = 7, z0 = 7.5, z1 = 14, H = 3.2;
    const PANEL = ['wall_saloon', { type: 'planks', color: '#4a3424', n: 6 }];
    const up = ['facade_upper', { type: 'facade', color: '#7a3a2c', floors: 4, bays: 4, storeFrac: 0.02, escape: true, lit: 0.3, w: 256, h: 448 }];
    this.upper(x0, x1, z0, z1, H, 18, { n: up, w: up });
    this.room(x0, x1, z0, z1, H, PANEL, [{ side: 'n', from: 0.6, to: 2.0, lintel: true }], 0.14);
    this.floor((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, ['floor_steerage_sawdust', { type: 'sawdust' }, { repeat: [3, 3] }], 0.02);
    this.ceiling((x0 + x1) / 2, (z0 + z1) / 2, x1 - x0, z1 - z0, ['ceiling_tenement', { type: 'plaster', color: '#5f5444' }], H - 0.01);
    this.panel(4.5, 1.6, z0 - 0.1, 5, 3.2, ['storefront_saloon', { type: 'storefront', sign: 'LAGER BIER · 5¢', w: 256, h: 220 }], Math.PI);
    this.panel(x0 - 0.1, 1.6, (z0 + z1) / 2, z1 - z0, 3.2, ['wall_brick_side', { type: 'brick', color: '#6e3426' }], -Math.PI / 2);
    // bar, back bar, barrels, tables
    this.box(4.6, 0, 12.3, 4.2, 1.1, 0.7, WOOD);
    this.panel(4.6, 1.9, z1 - 0.12, 4.4, 1.6, ['backbar_saloon', { type: 'card', title: 'Lager', lines: 'Bottles · Mirror · Free lunch counter', color: '#3a2a1c', ink: '#d8c48a', w: 256, h: 96 }], Math.PI);
    for (const [x, z] of [[0.3, 13.2], [1.1, 13.3]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 10), colorMat('#5a4630')); b.position.set(x, 0.45, z); this.scene.add(b); this.colliders.push({ minX: x - 0.35, maxX: x + 0.35, minZ: z - 0.35, maxZ: z + 0.35, see: true }); }
    this.box(5.4, 0, 9.4, 1.0, 0.75, 1.0, WOOD);
    // campaign posters and the club notice board
    this.panel(x1 - 0.12, 1.8, 10, 1.3, 1.8, ['poster_grant', { type: 'card', title: 'For Mayor', lines: 'HUGH J. GRANT\nTammany Hall', color: '#efe6cf', w: 160, h: 224 }], -Math.PI / 2);
    this.panel(x0 + 0.12, 1.7, 11.2, 1.3, 1.6, ['board_club', { type: 'card', title: 'District Club', lines: 'Jobs · Papers · Coal · Picnic', w: 176, h: 208 }], Math.PI / 2);
    this.readable('club', x0 + 0.7, 1.6, 11.2, { prompt: 'Read the club notice board', photo: 'club' });
    this.crowd(4, 3.6, 11.3, 0); this.crowd(2, 5.6, 11.3, 0); this.crowd(0, 4.6, 13.2, 0); this.crowd(7, 6.2, 9.0, 0);
    this.lamp(3, 2.7, 10.5, 0xffb860, 5, 9);
  }

  // ------------------------------------------------------------ the 1888 mayoral election
  election() {
    const banner = (x, z, ry, key, text, len = 13) => {
      // two faces back to back, so the lettering reads correctly from both directions
      const dx = Math.sin(ry) * 0.02, dz = Math.cos(ry) * 0.02;
      this.panel(x + dx, 7.6, z + dz, 9, 1.9, [key, { type: 'banner', title: text, w: 512, h: 112 }], ry);
      this.panel(x - dx, 7.6, z - dz, 9, 1.9, [key, { type: 'banner', title: text, w: 512, h: 112 }], ry + Math.PI);
      const rope = this.box(x, 8.5, z, ry ? 0.03 : len, 0.03, ry ? len : 0.03, '#3a3a3a', { collide: false });
      return rope;
    };
    const GRANT = 'FOR MAYOR\nHUGH J. GRANT\nREGULAR DEMOCRATIC NOMINEE · TAMMANY HALL';
    banner(11, 0, Math.PI / 2, 'banner_grant', GRANT, 15);
    banner(-64, 0, Math.PI / 2, 'banner_grant', GRANT, 15);
    banner(-122, -30, 0, 'banner_erhardt', 'FOR MAYOR\nJOEL B. ERHARDT\nREPUBLICAN TICKET', 30);
    banner(-122, 40, 0, 'banner_hewitt', 'RE-ELECT\nMAYOR HEWITT\nCITIZENS\' TICKET', 30);
    this.target('banner', 11, 7.6, 0, 26);
    this.readable('banner', 13.5, 1.6, 0, { prompt: 'Look up at the election banner', r: 2.6 });
  }

  // ------------------------------------------------------------ people and traffic in motion
  streetLife() {
    const lanes = [-6.3, 6.2, -1.3, 1.5];
    // Hester Street walkers (sidewalks and the roadway, as people really walked)
    for (let i = 0; i < 16; i++) {
      const z = lanes[i % 4], a = -100 + (i * 37) % 60, b = a + 60 + (i * 13) % 50;
      this.walker(i, [[a, z], [(a + b) / 2, z + (i % 2 ? 0.5 : -0.5)], [Math.min(b, 57), z]], { speed: 0.9 + (i % 3) * 0.2 });
    }
    // Bowery sidewalks, Mott Street, Allen Street, Eldridge down to the synagogue
    for (let i = 0; i < 6; i++) this.walker(i + 2, [[i % 2 ? -109 : -135, -60 + i * 6], [i % 2 ? -109.4 : -134.6, 80 - i * 5]], { speed: 1.1 });
    for (let i = 0; i < 4; i++) this.walker(i + 5, [[-163 - i * 2.5, 20 + i * 8], [-163 - i * 2.5, 110]], { speed: 1 });
    for (let i = 0; i < 3; i++) this.walker(i, [[23 + i * 6, -55], [23 + i * 6, 45]], { speed: 1 });
    for (let i = 0; i < 3; i++) this.walker(i + 3, [[-3 - i * 4, 10], [-3 - i * 4, 82]], { speed: 0.9 });
    // children chasing each other around the pushcarts
    const loop = [[44, 2], [50, 3], [53, 0], [49, -2.5], [43, -1.5]];
    for (let i = 0; i < 3; i++) this.walker(5, loop, { speed: 2.4, scale: 0.72, id: 'child0', loop: true });
    // the lamplighter making his evening round along Hester Street
    this.walker(0, [[-70, 5.4], [-34, 5.4], [-12, -5.2], [16, 5.2], [40, 5.2], [57, -5.2]], { speed: 0.8, id: 'lamplighter' });
    // wagons on the Bowery and Canal Street, a horsecar on the Bowery tracks
    this.mover(this.wagon('#5a4630', '#8a7a5a'), [[-131, -100], [-131, 104], [-134, 104], [-134, -100]], 2.6);
    this.mover(this.wagon('#3a4a3a', '#c8b080'), [[-90, 52], [70, 52], [70, 58], [-90, 58]], 2.3);
    this.mover(this.wagon('#6a2a20', '#5a4a3a'), [[-110, -60.5], [70, -60.5], [70, -55.5], [-110, -55.5]], 2.2);
  }

  // ------------------------------------------------------------ props
  gaslamp(x, z, lit) {
    this.box(x, 0, z, 0.14, 2.9, 0.14, '#23261f', { collide: true });
    this.box(x, 2.6, z, 0.7, 0.05, 0.05, '#23261f', { collide: false });          // ladder bar
    const lantern = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.15, 0.5, 4), colorMat(lit ? '#ffe2a0' : '#b8a888', { basic: lit }));
    lantern.position.set(x, 3.15, z); lantern.rotation.y = Math.PI / 4; this.scene.add(lantern);
    const top = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.25, 4), colorMat('#23261f')); top.position.set(x, 3.5, z); top.rotation.y = Math.PI / 4; this.scene.add(top);
    if (lit) this.lamp(x, 3.0, z, 0xffcf80, 6, 13);
  }

  streetSign(text, x, z) {
    this.box(x, 0, z, 0.08, 2.6, 0.08, '#23261f', { collide: false });
    this.panel(x, 2.8, z, 1.5, 0.32, ['sign_street_' + text, { type: 'sign', title: text, color: '#1d2a3a', ink: '#f0e8d0', w: 192, h: 40 }], 0, true);
  }

  cart(x, z, ry, goods) {
    // two big spoked wheels, flat bed, long handles, a prop leg
    const g = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.1, 0.95), material('wood_cart', { type: 'planks', color: '#6a4a2a', n: 4 }));
    bed.position.y = 0.8; g.add(bed);
    for (const sx of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.16, 0.04), colorMat('#4a3420')); side.position.set(0, 0.9, sx * 0.47); g.add(side);
      const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.035, 5, 14), colorMat('#2a1e14')); wheel.position.set(0.25, 0.44, sx * 0.55); g.add(wheel);
      const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.1, 6), colorMat('#2a1e14')); hub.rotation.x = Math.PI / 2; hub.position.set(0.25, 0.44, sx * 0.55); g.add(hub);
      for (let k = 0; k < 4; k++) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.82, 0.03), colorMat('#2a1e14')); sp.position.copy(wheel.position); sp.rotation.z = k * Math.PI / 4; g.add(sp); }
      const handle = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.05, 0.05), colorMat('#4a3420')); handle.position.set(-1.35, 0.8, sx * 0.38); g.add(handle);
    }
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.8, 0.06), colorMat('#4a3420')); leg.position.set(-0.8, 0.4, 0); g.add(leg);
    for (let i = 0; i < 8; i++) {
      const gd = new THREE.Mesh(new THREE.SphereGeometry(0.11 + (i % 3) * 0.03, 6, 5), colorMat(goods));
      gd.position.set(-0.7 + (i % 4) * 0.45, 0.95, i < 4 ? -0.2 : 0.2); g.add(gd);
    }
    g.position.set(x, 0, z); g.rotation.y = ry;
    this.scene.add(g); this.bake(g);
    const swap = Math.abs(Math.sin(ry)) > 0.7;
    this.colliders.push(swap ? { minX: x - 0.55, maxX: x + 0.55, minZ: z - 1.1, maxZ: z + 1.1, see: true } : { minX: x - 1.1, maxX: x + 1.1, minZ: z - 0.55, maxZ: z + 0.55, see: true });
  }

  horsecarStatic(x, z) {
    const g = new THREE.Group();
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 5), material('horsecar_bowery', { type: 'planks', color: '#2f5a3a', n: 3 })); car.position.y = 1.5; g.add(car);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 5.4), colorMat('#3a2a1a')); roof.position.y = 2.68; g.add(roof);
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.35), material('sign_horsecar_bowery', { type: 'sign', title: 'BOWERY · PARK ROW', w: 224, h: 40 })); sign.position.set(0, 2.4, -2.51); sign.rotation.y = Math.PI; g.add(sign);
    for (const wz of [-1.6, 1.6]) for (const sx of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12), colorMat('#2a1e14')); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 0.6, 0.38, wz); g.add(wh); }
    for (const sx of [-0.4, 0.4]) {
      const horse = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 1.7), colorMat(sx < 0 ? '#5a3a24' : '#3a2416')); horse.position.set(sx, 1.25, -4.2); g.add(horse);
      const neck = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.8, 0.4), colorMat('#4a2e1c')); neck.position.set(sx, 1.7, -5.1); neck.rotation.x = -0.5; g.add(neck);
    }
    g.position.set(x, 0, z); this.scene.add(g); this.bake(g);
    this.colliders.push({ minX: x - 1.1, maxX: x + 1.1, minZ: z - 6, maxZ: z + 2.6 });
  }

  // ------------------------------------------------------------ map
  map() {
    const streets = [];
    for (const [nm, [a, b]] of Object.entries(NS)) streets.push({ x0: a, x1: b, z0: -112, z1: 117, name: nm + ' St' });
    for (const [nm, [a, b]] of Object.entries(EW)) streets.push({ x0: -195, x1: 95, z0: a, z1: b, name: nm + ' St' });
    streets.push({ x0: NS.Mott[1], x1: NS.Bowery[0], z0: PELL[0], z1: PELL[1], name: 'Pell' });
    return {
      bounds: { minX: -180, maxX: 80, minZ: -104, maxZ: 108 },
      streets,
      pois: [
        { x: MX + 3.7, z: MZ, label: 'Moishe\'s tenement' }, { x: -4, z: -4, label: 'Pushcarts' },
        { x: -2, z: 75, label: 'Synagogue' }, { x: -163, z: 75, label: 'Transfiguration Church' },
        { x: -162, z: 100, label: 'Mott St shops' }, { x: -40, z: -84, label: 'Neighborhood Guild' },
        { x: -28, z: -5, label: 'Handbill' }, { x: 3, z: 6, label: 'Saloon' }, { x: -110, z: 10, label: 'Horsecar' },
        { x: 70, z: -24, label: 'Orchard St carts' },
      ],
      els: [{ x: 29, name: '2nd Ave El' }, { x: -122, name: '3rd Ave El' }],
    };
  }

  photoCount() { return state.photos.filter(p => p.zone === 'les' && p.subject).length; }
  aidCount() { return ['learned_society', 'learned_parish', 'learned_papers', 'learned_guild'].filter(flag).length; }
  ready() {
    if (this.day2) return flag('rivka_decided') && flag('met_moishe2') && this.votesHeard() >= 2;
    return flag('met_moishe') && (flag('photo_sweatshop') || flag('photo_girl')) && this.photoCount() >= 4;
  }
  votesHeard() { return ['heard_quinn2', 'heard_brennan2', 'heard_whitcomb2', 'heard_lee2', 'heard_moishe_vote'].filter(flag).length; }

  objectives() {
    if (this.day2) return this.objectives2();
    const n = this.photoCount();
    return [
      { text: 'Follow Hester Street east, under the El, to Moishe\'s tenement. Go in and find Moishe.', done: flag('met_moishe'), at: [MX + 3.8, MZ - 15] },
      { text: 'Photograph Chana and Sarah at their sewing', done: flag('photo_sweatshop') || flag('photo_girl'), at: [MX + 5.9, MZ - 16.6] },
      { text: `Photograph more evidence around the neighborhood (${Math.min(n, 4)}/4). Red dots on the map are good places.`, done: n >= 4 },
      { text: 'Take the Bowery horsecar to the Courier office', done: false, at: [-109.5, 9.5] },
      { text: 'Ask Moishe if you may photograph Sarah', done: flag('heard_sarah_plea'), at: [MX + 4.9, MZ - 15.8], optional: true },
      { text: 'Ask Mr. Riis, in the back yard, about photographing faces', done: flag('heard_riis_faces'), at: [MX + 3.2, MZ - 21], optional: true },
      { text: 'Watch Mr. Kessler collect the coats', done: flag('met_kessler'), at: [MX + 7, MZ - 13.4], optional: true },
      { text: 'Talk to a pushcart peddler', done: flag('learned_pushcart'), at: [-4, -5.2], optional: true },
      { text: `Find how neighbors help each other (${this.aidCount()}/4)`, done: this.aidCount() >= 3, at: [-2.6, 76.8], optional: true },
      { text: 'Walk west past the Bowery to Mott Street and visit Mr. Lee\'s shop', done: flag('learned_lee') || flag('learned_exclusion'), at: [-156, 101.5], optional: true },
      { text: 'Hear what Mrs. Brennan thinks of newcomers', done: flag('learned_nativism'), at: [-28.2, -5.6], optional: true },
      { text: 'Look inside the saloon where Mr. Quinn has his club', done: flag('read_club'), at: [1.3, 9], optional: true },
    ];
  }

  objectives2() {
    const v = this.votesHeard();
    return [
      { text: 'Find Rivka outside Kessler\'s shop on Hester Street', done: flag('rivka_decided'), at: [-18, -5.4] },
      { text: 'Go up to Moishe\'s apartment and see the family', done: flag('met_moishe2'), at: [MX + 4.9, MZ - 15.8] },
      { text: `Hear what people think of tomorrow's election (${Math.min(v, 2)}/2): Mr. Quinn, Mrs. Brennan, Mr. Whitcomb, Mr. Lee, or Moishe`, done: v >= 2, at: [4.2, 1.2] },
      { text: 'Take the Bowery horsecar to Park Row', done: false, at: [-109.5, 9.5] },
      { text: 'Listen to Esther Lipsky, the union organizer', done: flag('met_esther'), at: [-19.5, 4.4], optional: true },
      { text: 'Talk to Mr. Kessler at his shop door', done: flag('met_kessler2'), at: [-21.6, -5.9], optional: true },
      { text: 'Say hello to Shmuel', done: flag('met_shmuel2'), at: [MX + 6, MZ - 12.9], optional: true },
      { text: 'Find Giuseppe waiting for the horsecar', done: flag('met_gius3'), at: [-106.5, 6.4], optional: true },
      { text: 'Ask Mr. Lee on Mott Street about the election', done: flag('heard_lee2'), at: [-156, 101.5], optional: true },
    ];
  }
}

export class LowerEastSideDay2 extends LowerEastSideZone {
  build() { this.day2 = true; super.build(); }
}

function mulberry(a) { return () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
