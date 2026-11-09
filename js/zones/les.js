// ZONE 3: THE LOWER EAST SIDE (about 15 minutes)
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';

const BRICK = ['wall_brick_tenement', { type: 'brick', color: '#7a3b2a' }];
const BRICK2 = ['wall_brick_dark', { type: 'brick', color: '#5d3226', mortar: '#4a3a32' }];
const COBBLE = ['street_cobble', { type: 'cobble' }];
const PLASTER = ['wall_tenement_room', { type: 'plaster', color: '#8f7f62' }];
const FLOOR = ['floor_tenement', { type: 'planks', color: '#5a412b', n: 8 }];
const DIRT = ['ground_yard', { type: 'plaster', color: '#4a3e30' }];
const WOOD = ['wood_rough', { type: 'planks', color: '#5c4630', n: 5 }];
const WIN = ['window_tenement', { type: 'window', color: '#3a3a40', frame: '#2a2018', w: 128, h: 128 }];
const WIN_LIT = ['window_tenement_lit', { type: 'window', color: '#e8b860', frame: '#2a2018', w: 128, h: 128 }];

export class LowerEastSideZone extends Zone {
  build() {
    this.setSky('#6b5866', 18, 75, '#5c4d58');
    this.lights({ ambient: 0x7a6a78, ambientI: 0.9, sky: 0xc8a890, ground: 0x302830, hemiI: 0.6, sun: { color: 0xffb880, i: 0.6, pos: [-40, 20, 10] } });
    this.bounds = { minX: -44, maxX: 44, minZ: -32, maxZ: 30 };

    // ---- ground ----
    this.floor(0, 0, 88, 10, [COBBLE[0], COBBLE[1], { repeat: [22, 3] }]);
    this.floor(-40, -18.5, 8, 27, [COBBLE[0], COBBLE[1], { repeat: [2, 7] }]);   // Mott St
    this.floor(39, 17.5, 10, 25, [COBBLE[0], COBBLE[1], { repeat: [3, 7] }]);    // Forsyth St
    for (const z of [-4.25, 4.25]) this.floor(0, z, 88, 1.5, ['sidewalk', { type: 'stone', color: '#8a8478', rows: 2 }, { repeat: [30, 1] }], 0.01);

    // ---- building blocks ----
    this.box(-18, 0, -18.5, 36, 14, 27, BRICK, { uv: [4, 4] });           // north-west block
    this.box(27, 0, -18.5, 34, 14, 27, BRICK2, { uv: [4, 4] });           // north-east block
    this.box(-5, 0, 17.5, 78, 13, 25, BRICK2, { uv: [4, 4] });            // south block
    this.box(-47, 0, -13.5, 6, 15, 47, BRICK, { uv: [4, 4] });            // far west (end of street)
    this.box(47, 0, 12.5, 6, 13, 45, BRICK, { uv: [4, 4] });              // east side of Forsyth
    this.box(39, 0, 32, 10, 13, 4, BRICK2, { uv: [4, 4] });               // end of Forsyth
    this.box(-40, 0, -34, 8, 14, 4, BRICK2, { uv: [4, 4] });              // end of Mott
    this.windows(-36, 0, -4.99, 0);   // NW block facade
    this.windows(10, 44, -4.99, 0);   // NE block facade
    this.windows(-44, 34, 4.99, Math.PI); // south block facade
    this.windowsX(-36.01, -5, -32, -Math.PI / 2); // Mott St east facade
    this.fireEscape(-20, -5.05); this.fireEscape(-8, -5.05); this.fireEscape(22, -5.05); this.fireEscape(2, 5.05, Math.PI);

    // Shop signs (ground floor)
    const signs = [[-28, -4.95, 0, 'KOSHER BUTCHER'], [-12, -4.95, 0, 'DRY GOODS'], [18, -4.95, 0, 'BAKERY · BREAD'], [36, -4.95, 0, 'SALOON'], [-30, 4.95, Math.PI, 'TAILOR · CONTRACTOR'], [-2, 4.95, Math.PI, 'STEAMSHIP TICKETS'], [8, 4.95, Math.PI, 'BANK · MONEY SENT HOME']];
    signs.forEach(([x, z, ry, t], i) => this.panel(x, 3.1, z, 4.2, 0.7, [`sign_shop_${i}`, { type: 'sign', title: t, w: 256, h: 48 }], ry));

    // ---- Moishe's tenement (x 0..10) ----
    this.tenement();

    // ---- pushcarts + people on Hester Street ----
    this.cart(-4, -2.8, 0, '#6a7a3a');
    this.person('peddler', -4, -3.9, 0, { photo: 'pushcart' });
    this.cart(12, -2.8, 0, '#8a8a8a');
    this.person('peddler2', 12, -3.9, 0, { photo: null });
    this.cart(-20, 2.8, Math.PI, '#a05a3a'); this.crowd(4, -20, 3.9, Math.PI);
    this.cart(-30, -2.8, 0, '#d0c080'); this.crowd(2, -30, -3.9, 0);
    this.cart(22, 2.8, Math.PI, '#5a3a6a'); this.crowd(7, 22, 3.9, Math.PI);
    const shoppers = [[-6, -1.2, 1], [-3, -0.8, 3], [10, -1.5, 6], [-18, 1.5, 0], [-26, -1, 5], [6, 1.8, 2], [18, 1, 4], [28, -1.5, 3], [-12, 0.5, 7], [-34, 1.5, 1], [0, 0.2, 6]];
    shoppers.forEach(([x, z, n]) => this.crowd(n, x, z, (x * 13) % 6));

    // Newsboy + stand
    this.box(-8.5, 0, 4.3, 1.4, 1.0, 0.8, WOOD);
    this.panel(-8.5, 1.02, 4.3, 1.2, 0.6, ['papers_stack', { type: 'card', title: 'Papers', lines: 'Yiddish · Italian · German · Irish', w: 160, h: 96 }]).rotation.x = -Math.PI / 2;
    this.person('newsboy', -7, 3.2, Math.PI);

    // Synagogue + landsmanshaft
    this.panel(-14, 5.5, 4.97, 8, 9, ['facade_synagogue', { type: 'card', title: 'Synagogue', lines: 'and rooms of the Kiever Society', color: '#c8b896', w: 256, h: 288 }], Math.PI);
    this.target('synagogue', -14, 5, 4.6, 22);
    this.panel(-10.6, 1.6, 4.95, 1.0, 1.3, ['board_society', { type: 'card', title: 'Kiever Society', lines: 'Dues 25¢\nSick pay\nLoans\nBurial', w: 160, h: 208 }], Math.PI);
    this.readable('society', -10.6, 1.6, 4.4, { prompt: 'Read the notice board', photo: 'society' });
    this.person('rabbi', -13, 3.7, Math.PI);

    // Catholic parish
    this.panel(16, 5.5, 4.97, 7, 9, ['facade_parish', { type: 'card', title: 'Parish Church', lines: 'Mass in English & Italian', color: '#b8b0a0', w: 256, h: 320 }], Math.PI);
    this.box(16, 13, 8, 3, 9, 3, '#8a8478', { collide: false });
    const spire = new THREE.Mesh(new THREE.ConeGeometry(2.2, 5, 4), colorMat('#5a5048')); spire.position.set(16, 24.5, 8); spire.rotation.y = Math.PI / 4; this.scene.add(spire);
    this.target('parish', 16, 5, 4.6, 24);
    this.person('priest', 15, 3.7, Math.PI);
    this.person('giuseppe', 19.5, 3.4, Math.PI, { talk: 'giuseppe2', photo: 'giuseppe2' });

    // Nativism: handbill + Mrs. Brennan
    this.panel(26.5, 1.7, -4.98, 0.9, 1.2, ['handbill_nativist', { type: 'card', title: 'Americans, Wake Up!', lines: 'America for Americans!', color: '#e8dcc0', w: 160, h: 224 }]);
    this.readable('handbill', 26.5, 1.7, -4.4, { prompt: 'Read the handbill', photo: 'handbill' });
    this.person('brennan', 24, -3.7, 0);

    // Ward boss with coal
    for (let i = 0; i < 4; i++) this.box(30.5 + i * 0.55, 0, 4.4, 0.5, 0.5 + (i % 2) * 0.1, 0.5, '#1d1b1a', { collide: true });
    this.person('boss', 32, 3.4, Math.PI);
    this.crowd(5, 30.8, 2.6, Math.PI * 0.8); this.crowd(1, 33.2, 2.4, -Math.PI * 0.8);

    // Neighborhood Guild on Forsyth Street
    this.panel(43.97, 3, 16, 6, 5, ['facade_neighborhood_guild', { type: 'card', title: 'The Neighborhood Guild', lines: 'Founded 1886\nClubs · Reading Room · Kindergarten', color: '#d8ccb0', w: 288, h: 240 }], -Math.PI / 2);
    this.readable('guildsign', 43.4, 2, 13.5, { prompt: 'Read the Guild sign' });
    this.person('guild', 42.2, 16, -Math.PI / 2);
    this.target('guild', 43.5, 3, 16, 20);
    this.crowd(5, 41, 18.5, -Math.PI / 2, { scale: 0.75 }); this.crowd(0, 41.5, 19.6, -Math.PI / 2, { scale: 0.72 });
    this.panel(34.05, 2.8, 6, 1.6, 0.4, ['sign_forsyth', { type: 'sign', title: 'FORSYTH ST', w: 160, h: 40 }], Math.PI / 2);

    // Mott Street (Chinatown), a few blocks west
    this.panel(-36.05, 2.8, -6, 1.6, 0.4, ['sign_mott', { type: 'sign', title: 'MOTT ST', w: 160, h: 40 }], -Math.PI / 2);
    this.panel(-36.03, 3.6, -18, 5, 0.9, ['sign_lee_shop', { type: 'sign', title: 'LEE FONG & CO. · TEAS · GROCERIES', color: '#6a1f1a', w: 384, h: 64 }], -Math.PI / 2);
    this.panel(-36.03, 1.5, -16.3, 2, 1.8, ['window_lee_shop', { type: 'card', title: 'Teas', lines: 'Rice · Dried fish · Medicine · Letters home', color: '#d8b070', w: 192, h: 176 }, { emissive: '#553300', emissiveIntensity: 0.5 }], -Math.PI / 2);
    this.person('lee', -37.4, -18.5, -Math.PI / 2);
    for (let i = 0; i < 3; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.25, 8, 6), colorMat('#e04a2a', { emissive: '#801a0a' })); l.position.set(-38 - i * 1.6, 4.2, -18); this.scene.add(l); }
    this.crowd(7, -41, -12, 1); this.crowd(4, -39, -24, 2.2);

    // Gas street lamps
    for (const [x, z] of [[-26, -4.6], [-2, 4.6], [20, -4.6], [38, 9], [-40, -16]]) this.lamppost(x, z);

    // Horsecar stop: exit to the wrap-up
    this.box(28, 0, 4.6, 0.1, 2.6, 0.1, '#222');
    this.panel(28, 2.7, 4.5, 1.3, 0.5, ['sign_horsecar_stop', { type: 'sign', title: 'HORSECAR · PARK ROW', w: 192, h: 72 }], Math.PI);
    const ex = this.exit(28, 3.6, 'Take the horsecar back to the Courier office (finish the story)', () => this.ready(), () => this.game.openWrapup('A'));
    ex.lockedMsg = 'Find Moishe\'s tenement and take at least 5 photographs here first.';

    this.spawn = { x: -6, z: 0.5, yaw: -Math.PI / 2 };
  }

  tenement() {
    const H = 3;
    // block west of the hall
    this.box(1.75, 0, -11.5, 3.5, 14, 13, BRICK, { uv: [4, 4] });
    // upper floors
    this.box(7.5, H, -11.5, 5, 11, 13, BRICK, { collide: false, uv: [4, 4] });
    this.box(4.25, H, -11.5, 1.5, 11, 13, BRICK, { collide: false, uv: [4, 4] });
    this.windows(3.5, 10, -4.99, 0, 1);
    // hall
    this.room(3.5, 5, -18, -5, H, PLASTER, [{ side: 's', from: 3.5, to: 5 }, { side: 'n', from: 3.5, to: 5 }, { side: 'e', from: -8.4, to: -7.0 }], 0.12);
    this.floor(4.25, -11.5, 1.5, 13, [FLOOR[0], FLOOR[1], { repeat: [1, 6] }], 0.02);
    // front room (workroom / kitchen)
    this.room(5, 10, -12, -5, H, PLASTER, [{ side: 'w', from: -8.4, to: -7.0 }, { side: 'n', from: 8, to: 9 }], 0.12);
    this.floor(7.5, -8.5, 5, 7, [FLOOR[0], FLOOR[1], { repeat: [3, 4] }], 0.02);
    // back room (bedroom, no outside window)
    this.room(5, 10, -18, -12, H, PLASTER, [{ side: 's', from: 8, to: 9 }], 0.12);
    this.floor(7.5, -15, 5, 6, [FLOOR[0], FLOOR[1], { repeat: [3, 3] }], 0.02);
    this.ceiling(6.75, -11.5, 6.5, 13, ['ceiling_tenement', { type: 'plaster', color: '#5f5444' }], H - 0.01);
    // brick face over the front room wall, outside
    this.panel(7.5, H / 2, -4.93, 5, H, [BRICK[0], BRICK[1], { repeat: [1.2, 0.8] }]);
    this.panel(6.5, 1.6, -4.9, 1.0, 1.4, WIN_LIT); this.panel(8.8, 1.6, -4.9, 1.0, 1.4, WIN_LIT);
    this.panel(6.5, 1.6, -5.14, 1.0, 1.4, WIN, Math.PI); this.panel(8.8, 1.6, -5.14, 1.0, 1.4, WIN, Math.PI);
    // door frame + stoop
    this.box(4.25, 0, -4.6, 1.8, 0.18, 0.8, '#6a645a', { collide: false });
    this.panel(4.25, 3.4, -4.95, 1.2, 0.45, ['sign_tenement_number', { type: 'sign', title: 'No. 140', w: 128, h: 48 }]);
    this.target('tenement', 5, 6, -4.6, 26);

    // workroom props
    this.box(7.3, 0, -9.8, 2.6, 0.78, 1.1, WOOD);                    // work table
    for (const x of [6.5, 8.1]) this.box(x, 0.78, -9.8, 0.45, 0.3, 0.3, '#1d1d1d', { collide: false }); // sewing machines
    this.box(9.3, 0, -11.2, 0.9, 0.5, 0.9, '#3a3438');                 // pile of coats
    this.box(9.3, 0.5, -11.2, 0.8, 0.4, 0.8, '#2c2a30', { collide: false });
    this.box(5.6, 0, -6.0, 0.8, 0.85, 0.7, '#1a1a1a');                 // stove
    this.box(5.6, 0.85, -6.0, 0.15, 2.1, 0.15, '#1a1a1a', { collide: false });
    this.person('chana', 6.6, -10.7, Math.PI * 0.9, { seated: true, photo: 'sweatshop' });
    this.person('girl', 7.9, -10.8, Math.PI, { seated: true });
    this.person('moishe', 8.6, -7.0, Math.PI * 0.75);
    this.target('sweatshop', 7.3, 1.0, -9.8, 7);
    this.lamp(7.5, 2.5, -8.8, 0xffb860, 4, 8);
    // back room: two chairs pushed together, mattress on floor
    this.box(6.5, 0, -16.5, 2.4, 0.18, 1.2, ['mattress_straw', { type: 'solid', color: '#8a7a58' }]);
    this.box(8.9, 0, -14.0, 1.2, 0.18, 2.0, ['mattress_straw', { type: 'solid', color: '#8a7a58' }]);
    this.person('boarder', 6.0, -13.6, Math.PI / 2, { seated: true });
    this.panel(9.95, 1.8, -15, 0.7, 0.9, ['window_airshaft', { type: 'window', color: '#151518', w: 64, h: 64 }], -Math.PI / 2);
    this.lamp(6.2, 0.8, -17.3, 0xff9a40, 0.8, 3); // candle

    // Rivka's family at the door
    this.person('rivka', 2.2, -3.4, Math.PI * 0.2, { talk: 'rivka_les' });
    this.person('mama', 1.2, -3.0, Math.PI * 0.1, { talk: 'mama', photo: null });
    this.person('shmuel', 2.9, -2.6, Math.PI * 0.4, { talk: 'shmuel', photo: null });

    // back yard
    this.floor(5, -24, 10, 12, [DIRT[0], DIRT[1], { repeat: [3, 3] }], 0.02);
    this.box(5, 0, -31, 10, 12, 2, BRICK2, { uv: [4, 4] });             // rear tenement
    this.windows(0, 10, -29.99, 0, 0);
    this.box(8.6, 0, -27.8, 1.3, 2.2, 1.3, WOOD);                       // privy
    this.panel(8.6, 1.1, -27.13, 0.6, 1.6, ['privy_door', { type: 'planks', color: '#4a3826', n: 3 }]);
    this.readable('privy', 8.6, 1.2, -26.4, { prompt: 'Look at the privy', photo: 'privy' });
    for (const [x, z] of [[1.2, -28.5], [1.9, -28.6], [2.6, -28.4]]) { const b = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.8, 10), colorMat('#3c3a36')); b.position.set(x, 0.4, z); this.scene.add(b); }
    // laundry lines
    for (const z of [-21, -24.5]) {
      const line = new THREE.Mesh(new THREE.BoxGeometry(10, 0.02, 0.02), colorMat('#ccc'));
      line.position.set(5, 3.6, z); this.scene.add(line);
      for (let i = 0; i < 5; i++) this.panel(1.5 + i * 1.8, 3.1, z, 0.9, 1.0, ['laundry_' + (i % 3), { type: 'solid', color: ['#d8d0c0', '#9a8a7a', '#b0a8c0'][i % 3] }], 0, true);
    }
    this.person('riis', 4, -23.6, 0);
    this.crowd(5, 2.5, -26, 1, { scale: 0.7 }); this.crowd(0, 6.5, -21, 2, { scale: 0.7 });
    // Riis's flash powder: a bright pop every few seconds
    this.flash = new THREE.PointLight(0xffffff, 0, 16, 1.2);
    this.flash.position.set(4.6, 2.4, -24.4); this.scene.add(this.flash);
    let next = 4;
    this.updaters.push((dt, t) => {
      this.flash.intensity = Math.max(0, this.flash.intensity - dt * 60);
      if (t > next) { next = t + 7 + Math.random() * 5; const p = this.game.controls.pos; if (p.z < -17 && p.x > -1 && p.x < 11) this.flash.intensity = 30; }
    });
  }

  windows(x0, x1, z, ry, startFloor = 0) {
    for (let x = x0 + 1.5; x < x1 - 0.8; x += 2.6) {
      for (let f = 1; f < 5; f++) {
        const lit = ((x * 7 + f * 3) | 0) % 4 === 0;
        this.panel(x, f * 2.8 + 1.3, z + (ry ? 0 : 0), 1.0, 1.5, lit ? WIN_LIT : WIN, ry);
      }
    }
  }
  windowsX(x, z0, z1, ry) {
    for (let z = z0 - 1.5; z > z1 + 0.8; z -= 2.6) {
      for (let f = 1; f < 5; f++) this.panel(x, f * 2.8 + 1.3, z, 1.0, 1.5, ((z * 7 + f) | 0) % 3 === 0 ? WIN_LIT : WIN, ry);
    }
  }

  fireEscape(x, z, ry = 0) {
    const dir = ry ? 1 : -1;
    for (let f = 1; f < 5; f++) {
      const y = f * 2.8 + 0.4;
      this.box(x, y, z - dir * 0.5, 2.6, 0.06, 0.9, '#151515', { collide: false });
      this.box(x, y + 0.9, z - dir * 0.94, 2.6, 0.04, 0.04, '#151515', { collide: false });
    }
  }

  cart(x, z, ry, goods) {
    const g = new THREE.Group();
    const bed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 0.9), material('wood_cart', { type: 'planks', color: '#6a4a2a', n: 4 }));
    bed.position.y = 0.85; g.add(bed);
    for (const sx of [-1, 1]) {
      const side = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 0.04), colorMat('#4a3420')); side.position.set(0, 0.98, sx * 0.44); g.add(side);
      const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 12), colorMat('#2a1e14')); wheel.rotation.x = Math.PI / 2; wheel.position.set(0.3, 0.42, sx * 0.5); g.add(wheel);
      const handle = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.05), colorMat('#4a3420')); handle.position.set(-1.25, 0.95, sx * 0.35); g.add(handle);
    }
    for (let i = 0; i < 6; i++) {
      const gd = new THREE.Mesh(new THREE.SphereGeometry(0.12 + (i % 3) * 0.03, 6, 5), colorMat(goods));
      gd.position.set(-0.6 + (i % 3) * 0.55, 1.02, i < 3 ? -0.18 : 0.18); g.add(gd);
    }
    g.position.set(x, 0, z); g.rotation.y = ry;
    this.scene.add(g);
    this.colliders.push({ minX: x - 1.0, maxX: x + 1.0, minZ: z - 0.5, maxZ: z + 0.5, see: true });
  }

  photoCount() { return state.photos.filter(p => p.zone === 'les' && p.subject).length; }
  aidCount() { return ['learned_society', 'learned_parish', 'learned_papers', 'learned_guild'].filter(flag).length; }
  ready() { return flag('met_moishe') && this.photoCount() >= 5; }

  objectives() {
    return [
      { text: 'Bring Rivka\'s family to Moishe\'s tenement', done: flag('met_moishe') },
      { text: 'Learn how families live in the tenement', done: flag('learned_tenement') },
      { text: 'Learn how families work at home', done: flag('learned_sweatshop') },
      { text: 'Visit the back yard', done: flag('met_riis') },
      { text: 'Talk to a pushcart peddler', done: flag('learned_pushcart') },
      { text: `Find how neighbors help each other (${this.aidCount()}/3)`, done: this.aidCount() >= 3 },
      { text: 'Walk west to Mott Street', done: flag('learned_lee') || flag('learned_exclusion') },
      { text: 'Hear what some neighbors think of newcomers', done: flag('learned_nativism') },
      { text: `Photograph evidence (${this.photoCount()}/8)`, done: this.photoCount() >= 8 },
      { text: 'Take the horsecar to the Courier office', done: false },
    ];
  }
}
