// ZONE 4: THE CITY. Urbanization and political machines (about 10 minutes)
// Park Row & City Hall Park, then a ride on the El to Central Park.
import * as THREE from 'three';
import { Zone } from '../engine/world.js';
import { colorMat, material } from '../engine/textures.js';
import { state, flag } from '../state.js';
import { sfx } from '../engine/audio.js';

const COBBLE = ['street_cobble', { type: 'cobble' }];
const GRASS = ['grass_park', { type: 'grass' }];
const PATH = ['path_gravel', { type: 'plaster', color: '#a8987a' }];
const MARBLE = ['wall_marble', { type: 'stone', color: '#d8d2c4', mortar: '#b8b2a4', rows: 6 }];
const BRICK = ['wall_brick_office', { type: 'brick', color: '#8a4a32' }];
const BRICK2 = ['wall_brick_dark', { type: 'brick', color: '#5d3226', mortar: '#4a3a32' }];
const STONE = ['wall_brownstone', { type: 'stone', color: '#6a5446', rows: 8 }];
const IRON = '#2a2a2e';
const WIN = ['window_office', { type: 'window', color: '#4a5058', frame: '#1e1a16', w: 128, h: 128 }];
const PX = 1000; // Central Park is built far away in the same scene

export class CityZone extends Zone {
  build() {
    this.setSky('#b8c4cc', 50, 320, '#c8ccc8');
    this.lights({ ambient: 0xa09888, ambientI: 1.3, sky: 0xf0f0f0, ground: 0x504a40, hemiI: 1.0, sun: { color: 0xfff2dc, i: 1.6, pos: [40, 60, 30] } });
    this.boundsDown = { minX: -42, maxX: 40, minZ: -50, maxZ: 30 };
    this.boundsPark = { minX: PX - 32, maxX: PX + 32, minZ: -30, maxZ: 30 };
    this.bounds = this.boundsDown;

    this.downtown();
    this.park();

    this.spawn = { x: 0, z: 26, yaw: 0 };
    if (flag('in_park')) this.spawn = { x: PX - 2, z: 24, yaw: 0 };
    if (flag('in_park')) this.bounds = this.boundsPark;
  }

  // ======================================================== PARK ROW
  downtown() {
    // ground
    this.floor(0, -10, 12, 80, [COBBLE[0], COBBLE[1], { repeat: [3, 20] }]);
    this.floor(23, -41, 34, 10, [COBBLE[0], COBBLE[1], { repeat: [9, 3] }]);
    this.floor(-24, -10, 36, 80, [GRASS[0], GRASS[1], { repeat: [9, 20] }]);
    this.floor(-7, -10, 2, 80, ['sidewalk', { type: 'stone', color: '#8a8478', rows: 2 }, { repeat: [1, 30] }], 0.01);
    this.floor(-24, -12, 3, 60, [PATH[0], PATH[1], { repeat: [1, 15] }], 0.012);
    this.floor(-15, 12, 18, 3, [PATH[0], PATH[1], { repeat: [5, 1] }], 0.012);

    // East side buildings (Newspaper Row)
    this.box(23, 0, 26, 34, 18, 8, BRICK, { uv: [4, 4] });          // z 22..30
    this.box(23, 0, -1, 34, 22, 10, STONE, { uv: [4, 4] });         // z -6..4 (Times)
    this.box(28, 0, -11, 24, 20, 10, BRICK2, { uv: [4, 4] });       // behind Tribune
    this.box(23, 0, -26, 34, 24, 20, BRICK, { uv: [4, 4] });        // z -36..-16
    this.box(23, 0, -48, 34, 16, 4, BRICK2, { uv: [4, 4] });        // z -50..-46
    this.box(41, 0, -41, 2, 1.1, 10, IRON);                          // railing at end of cross street
    this.facadeWindows(6, 22, 30, 18); this.facadeWindows(6, -6, 4, 22); this.facadeWindows(6, -36, -16, 24);
    // Tribune Building (1875): tall brick with a clock tower
    this.box(11, 0, -11, 10, 40, 10, ['wall_tribune', { type: 'brick', color: '#9a4a30' }], { uv: [4, 4] });
    this.box(11, 40, -11, 5, 22, 5, ['wall_tribune', { type: 'brick', color: '#9a4a30' }], { collide: false, uv: [4, 4] });
    const cap = new THREE.Mesh(new THREE.ConeGeometry(4, 10, 4), colorMat('#3a3a3e')); cap.position.set(11, 67, -11); cap.rotation.y = Math.PI / 4; this.scene.add(cap);
    const clock = new THREE.Mesh(new THREE.CircleGeometry(1.6, 20), colorMat('#efe6d0', { basic: true })); clock.position.set(8.48, 54, -11); clock.rotation.y = -Math.PI / 2; this.scene.add(clock);
    this.facadeWindows(6, -16, -6, 40, 2.4);
    this.panel(5.95, 4.2, -11, 6, 0.9, ['sign_tribune', { type: 'sign', title: 'THE TRIBUNE', w: 384, h: 64 }], -Math.PI / 2);
    this.target('tribune', 6.5, 25, -11, 80);

    // Construction site (z 6..20): a new tall office building
    this.construction(6, 6, 20);
    this.person('foreman', 7.5, 14, -Math.PI / 2, { photo: null });
    this.crowd(4, 9, 10, -Math.PI / 2); this.crowd(2, 9.5, 17, -Math.PI / 2);

    // Newspaper office window with the Nast cartoon
    this.panel(5.95, 1.7, -24, 1.8, 1.6, ['doc_nast', { type: 'card', title: 'Who Stole the People\'s Money?', lines: 'Thomas Nast, 1871', w: 256, h: 224 }], -Math.PI / 2);
    this.panel(5.95, 3.2, -24, 3.2, 0.5, ['sign_courier', { type: 'sign', title: 'EVENING COURIER', w: 256, h: 40 }], -Math.PI / 2);
    this.readable('nast', 5.3, 1.7, -24, { prompt: 'Look at the cartoon in the window', photo: 'nast' });
    this.person('oldrep', 4.6, -22, -Math.PI / 2);

    // ---- City Hall Park (west) ----
    // City Hall (white marble, 1812)
    this.box(-24, 0, -2, 24, 10, 10, MARBLE, { uv: [4, 4] });
    this.box(-24, 10, -2, 8, 3, 8, MARBLE, { collide: false });
    const cupola = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 2.8, 5, 12), colorMat('#e8e2d4')); cupola.position.set(-24, 15.5, -2); this.scene.add(cupola);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(2.4, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), colorMat('#7a8a7a')); dome.position.set(-24, 18, -2); this.scene.add(dome);
    for (let i = 0; i < 6; i++) this.box(-29 + i * 2, 0, 3.4, 0.5, 8, 0.5, '#efe9dc');
    this.panel(-24, 9, 3.05, 6, 0.8, ['sign_city_hall', { type: 'sign', title: 'CITY HALL', color: '#d8d2c4', ink: '#3a3028', w: 256, h: 40 }]);
    // Tweed Courthouse (behind City Hall)
    this.box(-24, 0, -34, 22, 14, 12, MARBLE, { uv: [4, 4] });
    for (let i = 0; i < 6; i++) this.box(-29 + i * 2, 1.5, -27.6, 0.7, 10, 0.7, '#efe9dc');
    this.box(-24, 11.5, -27.6, 13, 1.5, 1.2, '#e2dccf', { collide: false });
    this.box(-24, 0, -26.3, 14, 1.5, 2.4, '#cfc9bc');               // steps
    this.panel(-24, 12.2, -26.95, 8, 0.8, ['sign_courthouse', { type: 'sign', title: 'NEW YORK COUNTY COURTHOUSE', color: '#d8d2c4', ink: '#3a3028', w: 384, h: 40 }]);
    this.target('courthouse', -24, 7, -27, 45);
    this.readable('courthouse', -18.5, 1.3, -24.5, { prompt: 'Read about the courthouse', photo: null });
    this.box(-18.5, 0, -24.8, 0.6, 1.0, 0.3, '#6a6458');
    // Plunkitt's bootblack stand
    this.box(-27.5, 0, -24.2, 1.6, 0.5, 1.2, '#4a3020');
    this.box(-27.5, 0.5, -24.6, 1.6, 0.6, 0.4, '#4a3020', { collide: false });
    this.person('plunkitt', -27.5, -24.3, 0, { seated: true });
    this.crowd(5, -26, -22.6, Math.PI, { scale: 0.75 }); // bootblack boy
    this.crowd(4, -30, -22, 2.4);
    // Park trees + benches + people
    for (const [x, z] of [[-12, 22], [-20, 24], [-32, 20], [-38, 8], [-12, -14], [-36, -16], [-12, -40], [-36, -44], [-14, 6], [-34, 26]]) this.tree(x, z, 1.5);
    for (const [x, z] of [[-17, 10.2], [-31, 13.8]]) this.box(x, 0, z, 2, 0.45, 0.5, '#4a3424');
    [[-18, 16, 1], [-28, 14, 3], [-10, -4, 6], [-14, -20, 7], [-3, 10, 0], [2, -8, 2], [-2, -30, 5], [1, 4, 3]].forEach(([x, z, n]) => this.crowd(n, x, z, (x * 5) % 6));
    this.lamppost(-7.5, 18, false); this.lamppost(-7.5, -10, false); this.lamppost(-7.5, -38, false);

    // ---- The El (elevated railway) over the east sidewalk ----
    for (let z = 28; z > -50; z -= 8) this.box(4.2, 0, z, 0.3, 6, 0.3, IRON);
    this.box(4.2, 6, -10, 3.2, 0.5, 80, IRON, { collide: false });
    for (const dx of [-0.7, 0.7]) this.box(4.2 + dx, 6.5, -10, 0.1, 0.12, 80, '#555', { collide: false });
    // station + stairs
    this.box(4.2, 6.5, 20, 3.6, 2.6, 6, ['wall_el_station', { type: 'planks', color: '#4a5a4a', n: 4 }], { collide: false });
    for (let i = 0; i < 12; i++) this.box(5.3, i * 0.5, 23 - i * 0.45, 1.0, 0.12, 0.5, IRON, { collide: false });
    this.box(5.3, 0, 20.6, 1.1, 1.0, 5.4, IRON, { collide: true });
    this.box(5.3, 0, 24.3, 0.08, 2.4, 0.08, IRON);
    this.panel(5.3, 2.7, 24.3, 1.6, 0.5, ['sign_el_station', { type: 'sign', title: '3rd AVE EL · UPTOWN', w: 192, h: 48 }], 0);
    this.person('elguard', 3.4, 24.4, Math.PI * 0.75, { photo: null });
    this.target('el', 4.2, 6, 8, 34);
    this.train = this.makeTrain();
    this.trainT = 0;

    // ---- Horsecars on Broadway-style rails ----
    for (const cx of [-2, 1.6]) for (const dx of [-0.6, 0.6]) this.box(cx + dx, 0, -10, 0.08, 0.03, 80, '#666', { collide: false });
    this.stopCar = this.horsecar(-2, 2, Math.PI);
    this.colliders.push({ minX: -3.1, maxX: -0.9, minZ: -3.6, maxZ: 7.4 });
    this.person('driver', -3.6, 6.4, Math.PI / 2, { photo: null });
    this.target('horsecar', -2, 1.5, 3, 14);
    this.movingCar = this.horsecar(1.6, -20, 0);
    this.movingTarget = this.target('horsecar', 1.6, 1.5, -20, 14);
    this.carS = 30;

    // ---- Cross street to the Brooklyn Bridge ----
    this.bridge(190, -41);
    this.target('bridge', 190, 25, -41, 260);
    this.readable('bridge', 39.5, 1.3, -41, { prompt: 'Look at the Brooklyn Bridge' });
    this.box(39.5, 0, -42.5, 0.6, 1.0, 0.3, '#6a6458');

    this.updaters.push((dt, t) => this.animateDowntown(dt, t));
  }

  facadeWindows(x, z0, z1, height, spacing = 2.6) {
    const a = Math.min(z0, z1), b = Math.max(z0, z1);
    for (let z = a + 1.4; z < b - 0.8; z += spacing) for (let y = 4.4; y < height - 1; y += 2.9) this.panel(x - 0.03, y, z, 1.1, 1.6, WIN, -Math.PI / 2);
  }

  construction(x, z0, z1) {
    const mid = (z0 + z1) / 2, len = z1 - z0;
    this.box(x + 7, 0, mid, 14, 0.3, len, '#5a4a38');
    for (let fx = 0; fx <= 12; fx += 4) for (let fz = 0; fz <= len; fz += 4.6) this.box(x + 1 + fx, 0, z0 + fz, 0.3, 30, 0.3, '#3a3030', { collide: fx === 0 });
    for (let y = 4; y <= 30; y += 4.2) {
      this.box(x + 7, y, z0, 12.3, 0.3, 0.3, '#3a3030', { collide: false });
      this.box(x + 7, y, z1, 12.3, 0.3, 0.3, '#3a3030', { collide: false });
      this.box(x + 1, y, mid, 0.3, 0.3, len, '#3a3030', { collide: false });
      if (y < 16) this.box(x + 7, y - 0.15, mid, 12, 0.15, len, ['floor_construction', { type: 'planks', color: '#7a6040', n: 6 }], { collide: false });
    }
    // brick going up on the lower floors
    this.box(x + 13, 0, mid, 0.5, 9, len, BRICK, { collide: false, uv: [4, 4] });
    this.panel(x + 0.6, 2.4, mid, 5, 0.9, ['sign_construction', { type: 'sign', title: 'NEW OFFICE BUILDING · 10 STORIES', w: 384, h: 64 }], -Math.PI / 2);
    this.target('frame', x + 4, 10, mid, 45);
    // hoist rope + bucket
    const rope = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 26, 4), colorMat('#a08a60')); rope.position.set(x + 2.5, 16, mid + 2); this.scene.add(rope);
    this.bucket = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), colorMat('#6a4a2a')); this.bucket.position.set(x + 2.5, 3, mid + 2); this.scene.add(this.bucket);
  }

  makeTrain() {
    const g = new THREE.Group();
    const eng = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.4, 5), colorMat('#1d1d1d')); eng.position.set(0, 1.2, 0); g.add(eng);
    const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1, 8), colorMat('#111')); stack.position.set(0, 2.9, -1.6); g.add(stack);
    for (let i = 1; i <= 3; i++) {
      const car = new THREE.Mesh(new THREE.BoxGeometry(2.6, 2.6, 9), material('el_car', { type: 'planks', color: '#6a2a20', n: 3 })); car.position.set(0, 1.3, i * 9.8); g.add(car);
      for (let w = -3; w <= 3; w += 1.5) { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), colorMat('#e8d090', { basic: true })); win.position.set(-1.31, 1.7, i * 9.8 + w); win.rotation.y = -Math.PI / 2; g.add(win); }
    }
    this.smoke = [];
    for (let i = 0; i < 5; i++) { const p = new THREE.Mesh(new THREE.SphereGeometry(0.6, 6, 5), colorMat('#d8d4cc')); this.scene.add(p); this.smoke.push(p); }
    g.position.set(4.2, 6.6, -200);
    this.scene.add(g);
    return g;
  }

  horsecar(x, z, ry) {
    const g = new THREE.Group();
    const car = new THREE.Mesh(new THREE.BoxGeometry(2.0, 2.2, 5), material('horsecar', { type: 'planks', color: '#c8a050', n: 3 })); car.position.y = 1.5; g.add(car);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.15, 5.4), colorMat('#5a3a20')); roof.position.y = 2.68; g.add(roof);
    for (let w = -1.8; w <= 1.8; w += 0.9) for (const sx of [-1, 1]) { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), colorMat('#2a2a2a')); win.position.set(sx * 1.01, 1.9, w); win.rotation.y = sx * Math.PI / 2; g.add(win); }
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.35), material('sign_horsecar', { type: 'sign', title: 'BROADWAY', w: 192, h: 40 })); sign.position.set(0, 2.4, -2.51); sign.rotation.y = Math.PI; g.add(sign);
    for (const wz of [-1.6, 1.6]) for (const sx of [-1, 1]) { const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.08, 12), colorMat('#2a1e14')); wh.rotation.z = Math.PI / 2; wh.position.set(sx * 0.6, 0.38, wz); g.add(wh); }
    // horse
    const horse = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 1.7), colorMat('#5a3a24')); body.position.y = 1.25; horse.add(body);
    const neck = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.8, 0.4), colorMat('#5a3a24')); neck.position.set(0, 1.7, -0.95); neck.rotation.x = -0.5; horse.add(neck);
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.6), colorMat('#4a2e1c')); head.position.set(0, 2.0, -1.35); horse.add(head);
    for (const lx of [-0.2, 0.2]) for (const lz of [-0.65, 0.65]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.9, 0.12), colorMat('#3a2416')); leg.position.set(lx, 0.45, lz); horse.add(leg); }
    horse.position.set(0, 0, -4.2);
    g.add(horse);
    g.userData.horse = horse;
    g.position.set(x, 0, z); g.rotation.y = ry;
    this.scene.add(g);
    return g;
  }

  bridge(x, z) {
    const stone = material('bridge_granite', { type: 'stone', color: '#8f8676', rows: 10 });
    for (const tx of [x, x + 90]) {
      for (const dz of [-6, 6]) { const leg = new THREE.Mesh(new THREE.BoxGeometry(8, 84, 5), stone); leg.position.set(tx, 42, z + dz); this.scene.add(leg); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(8, 14, 17), stone); top.position.set(tx, 77, z); this.scene.add(top);
    }
    const deck = new THREE.Mesh(new THREE.BoxGeometry(200, 2, 16), colorMat('#4a4440')); deck.position.set(x + 55, 40, z); this.scene.add(deck);
    // approach ramp from Manhattan
    const ramp = new THREE.Mesh(new THREE.BoxGeometry(110, 2, 16), stone); ramp.position.set(x - 98, 20, z); ramp.rotation.z = 0.36; this.scene.add(ramp);
    // pointed arch openings in the towers
    for (const tx of [x, x + 90]) for (const sx of [-1, 1]) { const arch = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 26), colorMat('#2a2824')); arch.position.set(tx + sx * 4.05, 58, z); arch.rotation.y = sx * Math.PI / 2; this.scene.add(arch); }
    // main cables (sagging)
    for (const dz of [-6, 6]) {
      const pts = [];
      for (let i = 0; i <= 24; i++) { const u = i / 24, px = x + u * 90; pts.push(new THREE.Vector3(px, 82 - Math.sin(u * Math.PI) * 38, z + dz)); }
      const back = []; for (let i = 0; i <= 10; i++) { const u = i / 10; back.push(new THREE.Vector3(x - u * 50, 82 - u * 42, z + dz)); }
      for (const set of [pts, back]) {
        const geo = new THREE.BufferGeometry().setFromPoints(set);
        this.scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x2a2a2a })));
      }
      for (let i = 1; i < 24; i++) { const v = pts[i]; const geo = new THREE.BufferGeometry().setFromPoints([v, new THREE.Vector3(v.x, 41, v.z)]); this.scene.add(new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x555555 }))); }
    }
    // East River
    const river = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), material('water_harbor', { type: 'water' }, { repeat: [30, 30] }));
    river.rotation.x = -Math.PI / 2; river.position.set(x + 120, -0.5, z); this.scene.add(river);
  }

  animateDowntown(dt, t) {
    // El train: passes every ~25 seconds
    this.trainT += dt;
    const period = 25, tt = this.trainT % period;
    const z = 120 - tt * 14;
    this.train.position.z = z;
    if (tt < dt && this.game.controls.pos.x < 100) sfx('train');
    this.smoke.forEach((p, i) => {
      const age = (t * 0.8 + i * 0.2) % 1;
      p.position.set(4.2 + Math.sin(i) * 0.4, 9.8 + age * 3, z - 1.6 + age * 4);
      p.scale.setScalar(0.5 + age * 1.5);
      p.visible = z > -80 && z < 60;
    });
    // horsecar moving uptown and back
    const span = 66, speed = 2.4;
    // stop if the player is standing in the car's path
    const pp = this.game.controls.pos, cz = this.movingCar.position.z, dirZ = this.movingCar.rotation.y === 0 ? -1 : 1;
    const ahead = (pp.z - cz) * dirZ;
    const blocked = Math.abs(pp.x - 1.6) < 1.5 && ahead > -3 && ahead < 7.5;
    if (!blocked) this.carS += dt * speed;
    const s = this.carS % (span * 2);
    const goingNorth = s < span;
    const pz = goingNorth ? 28 - s : 28 - (span * 2 - s);
    this.movingCar.position.z = pz;
    this.movingCar.rotation.y = goingNorth ? 0 : Math.PI;
    this.movingTarget.pos.z = pz;
    const legs = this.movingCar.userData.horse.children;
    legs.slice(3).forEach((l, i) => { l.rotation.x = blocked ? 0 : Math.sin(t * 8 + i * 1.6) * 0.4; });
    // hoist bucket
    this.bucket.position.y = 3 + (Math.sin(t * 0.3) * 0.5 + 0.5) * 22;
  }

  // ======================================================== CENTRAL PARK
  park() {
    const X = PX;
    this.floor(X, 0, 70, 66, [GRASS[0], GRASS[1], { repeat: [16, 16] }]);
    // paths
    this.floor(X, 0, 4, 60, [PATH[0], PATH[1], { repeat: [1, 15] }], 0.012);
    this.floor(X, -12, 40, 4, [PATH[0], PATH[1], { repeat: [10, 1] }], 0.012);
    // the Mall: elm rows
    for (let z = 22; z > -8; z -= 5) { this.tree(X - 4, z, 1.6); this.tree(X + 4, z, 1.6); }
    for (const [dx, dz] of [[-18, 18], [-24, 4], [-14, -24], [20, 20], [24, 2], [16, -26], [-26, -18], [26, -16]]) this.tree(X + dx, dz, 1.8);
    // lake
    const lake = new THREE.Mesh(new THREE.CircleGeometry(14, 24), material('water_harbor', { type: 'water' }, { repeat: [6, 6] }));
    lake.rotation.x = -Math.PI / 2; lake.position.set(X, 0.02, -24); lake.scale.x = 1.8; this.scene.add(lake);
    this.colliders.push({ minX: X - 24, maxX: X + 24, minZ: -34, maxZ: -16, see: true });
    // Bethesda-style fountain
    const basin = new THREE.Mesh(new THREE.CylinderGeometry(3.4, 3.6, 0.7, 24), colorMat('#b0a890')); basin.position.set(X, 0.35, -12); this.scene.add(basin);
    const water = new THREE.Mesh(new THREE.CircleGeometry(3.1, 24), colorMat('#5a7a88')); water.rotation.x = -Math.PI / 2; water.position.set(X, 0.72, -12); this.scene.add(water);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.8, 2.2, 10), colorMat('#a8a090')); ped.position.set(X, 1.8, -12); this.scene.add(ped);
    const angel = new THREE.Mesh(new THREE.ConeGeometry(0.5, 1.8, 8), colorMat('#5a7a62')); angel.position.set(X, 3.8, -12); this.scene.add(angel);
    for (const sx of [-1, 1]) { const wing = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.06), colorMat('#5a7a62')); wing.position.set(X + sx * 0.5, 4.2, -12.2); wing.rotation.z = sx * 0.5; this.scene.add(wing); }
    this.colliders.push({ minX: X - 3.5, maxX: X + 3.5, minZ: -15.5, maxZ: -8.5 });
    this.target('park', X, 3, -12, 30);
    // benches + sign
    for (const dz of [16, 8, 0]) for (const sx of [-1, 1]) this.box(X + sx * 6, 0, dz, 0.6, 0.45, 2, '#4a3424');
    this.box(X + 3, 0, 25, 0.12, 1.4, 0.12, '#333');
    this.panel(X + 3, 1.6, 25.07, 1.2, 0.8, ['sign_park_rules', { type: 'card', title: 'Keep Off the Grass', lines: 'By order of the Park Commissioners', w: 192, h: 128 }], 0);
    this.readable('parkrules', X + 3, 1.5, 25.5, { prompt: 'Read the sign', photo: 'parkrules' });
    // people
    this.person('keeper', X + 1.6, 20, Math.PI);
    this.person('chana', X + 7, 6, -Math.PI / 2, { talk: 'chanapark', photo: 'sunday', seated: true });
    this.person('girl', X + 5.6, 4.2, -Math.PI / 3, { talk: 'girlpark', photo: 'sunday' });
    [[-2, 10, 0], [2, 2, 3], [-6.4, 14, 1], [6.4, 15, 6], [-1, -4, 4], [12, -6, 2], [-10, -4, 7]].forEach(([dx, dz, n]) => this.crowd(n, X + dx, dz, (dx * 3) % 6, { seated: Math.abs(dx) > 6 && Math.abs(dx) < 7 }));
    // a fancy carriage on the drive
    this.carriage = this.horsecar(X - 20, 8, 0);
    this.carriage.scale.set(0.8, 0.8, 0.6);
    this.updaters.push((dt, t) => { this.carriage.position.z = 20 - ((t * 2) % 44); });
    // El back / go write
    this.box(X - 3, 0, 27.5, 3, 0.2, 2, '#666', { collide: false });
    this.interact({ x: X - 3, z: 27.5, r: 2.4, prompt: 'Ride the El back downtown', action: () => this.rideDown() });
    const ex = this.exit(X + 3, 28.5, 'Go to the Courier office and write your story', () => this.ready(), () => this.game.openWrapup('B'));
    ex.lockedMsg = 'Talk to the park keeper and learn more downtown first (see objectives).';
  }

  ridePark() {
    state.flags.in_park = true;
    this.bounds = this.boundsPark;
    this.fade(() => this.game.controls.setPose(PX - 2, 24, 0), 'You ride the El uptown, past the windows of the tenements, to 59th Street.');
  }
  rideDown() {
    state.flags.in_park = false;
    this.bounds = this.boundsDown;
    this.fade(() => this.game.controls.setPose(1, 20, Math.PI * 0.2), 'You ride the El back down to Park Row.');
  }
  fade(fn, msg) {
    const f = document.getElementById('flash');
    f.style.background = '#000'; f.classList.add('on');
    sfx('train');
    setTimeout(() => { fn(); f.classList.remove('on'); setTimeout(() => { f.style.background = ''; }, 600); this.game.toast(msg, 5000); }, 900);
  }

  onAction(name) {
    if (name === 'ridePark') this.ridePark();
  }

  photoCount() { return state.photos.filter(p => p.zone === 'city' && p.subject).length; }
  ready() { return flag('learned_park') && flag('learned_machine') && this.photoCount() >= 4; }

  objectives() {
    return [
      { text: 'Ask the old reporter about Boss Tweed', done: flag('learned_tweed') },
      { text: 'Find out how Tammany wins votes', done: flag('learned_machine') },
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
