// ============================================================================
// 2D CHARACTER CUTOUTS
// Characters are flat illustrated figures standing in the 3D world (like a
// paper theater). Each one always turns to face the camera and has its own
// idle and talking animation.
//
// Art:      assets/art/portrait_<id>.png   (full figure, transparent background)
// Optional: assets/art/anim_<id>.png       (sprite strip: N frames side by side,
//                                            N = `frames` in characters.js, default 8)
// ============================================================================
import * as THREE from 'three';
import { texture, hasRealArt } from './textures.js';

// Animation styles. Characters pick one in characters.js: anim: { idle, talk, speed }
//   idle: breathe | sway | bounce | fidget | still | rock | shiver
//   talk: nod | gesture | bounce | lean
export const IDLE = {
  breathe: (o, t, s) => { o.sy = 1 + Math.sin(t * 1.8 * s) * 0.012; },
  sway:    (o, t, s) => { o.rz = Math.sin(t * 0.9 * s) * 0.035; o.sy = 1 + Math.sin(t * 1.8 * s) * 0.01; },
  bounce:  (o, t, s) => { o.y = Math.abs(Math.sin(t * 2.6 * s)) * 0.04; o.sy = 1 + Math.sin(t * 5.2 * s) * 0.015; },
  fidget:  (o, t, s) => { const k = Math.sin(t * 0.7 * s); o.rz = k > 0.92 ? Math.sin(t * 14) * 0.04 : 0; o.sy = 1 + Math.sin(t * 2 * s) * 0.01; o.x = Math.sin(t * 0.4 * s) * 0.03; },
  rock:    (o, t, s) => { o.rz = Math.sin(t * 1.4 * s) * 0.05; },
  shiver:  (o, t, s) => { o.x = Math.sin(t * 31) * 0.006; o.sy = 1 + Math.sin(t * 1.4 * s) * 0.008; },
  still:   (o) => {},
};
export const TALK = {
  nod:     (o, t) => { o.sy = 1 + Math.abs(Math.sin(t * 7)) * 0.025; o.rz = Math.sin(t * 3.5) * 0.015; },
  gesture: (o, t) => { o.rz = Math.sin(t * 3) * 0.05; o.sx = 1 + Math.sin(t * 6) * 0.02; o.sy = 1 + Math.abs(Math.sin(t * 6)) * 0.02; },
  bounce:  (o, t) => { o.y = Math.abs(Math.sin(t * 6)) * 0.06; o.sy = 1 + Math.sin(t * 12) * 0.02; },
  lean:    (o, t) => { o.rz = 0.06 + Math.sin(t * 4) * 0.02; o.sy = 1 + Math.abs(Math.sin(t * 7)) * 0.015; },
};

function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)},${c((n >> 8) & 255)},${c(n & 255)})`;
}

/** Placeholder art: a simple inked silhouette in the character's colors. */
function placeholder(c) {
  const w = 256, h = 512;
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const g = cv.getContext('2d');
  const coat = c.coat || '#555', skin = c.skin || '#d9b08c';
  g.lineWidth = 5; g.strokeStyle = '#1a1410'; g.lineJoin = 'round';
  // body / coat
  g.fillStyle = coat;
  g.beginPath();
  g.moveTo(w * 0.33, h * 0.25); g.lineTo(w * 0.67, h * 0.25);
  g.quadraticCurveTo(w * 0.78, h * 0.3, w * 0.8, h * 0.45);
  g.lineTo(w * 0.86, h * 0.97); g.lineTo(w * 0.14, h * 0.97); g.lineTo(w * 0.2, h * 0.45);
  g.quadraticCurveTo(w * 0.22, h * 0.3, w * 0.33, h * 0.25);
  g.closePath(); g.fill(); g.stroke();
  // fold lines + gold trim (tarot feel)
  g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 3;
  for (const x of [0.38, 0.5, 0.62]) { g.beginPath(); g.moveTo(w * x, h * 0.42); g.lineTo(w * (x + (x - 0.5) * 0.5), h * 0.95); g.stroke(); }
  g.strokeStyle = '#c9a24a'; g.lineWidth = 4;
  g.beginPath(); g.moveTo(w * 0.16, h * 0.93); g.lineTo(w * 0.84, h * 0.93); g.stroke();
  g.beginPath(); g.moveTo(w * 0.5, h * 0.26); g.lineTo(w * 0.5, h * 0.5); g.stroke();
  // arms
  g.fillStyle = shade(coat, -20); g.strokeStyle = '#1a1410'; g.lineWidth = 5;
  for (const sx of [-1, 1]) {
    g.beginPath(); g.ellipse(w * (0.5 + sx * 0.27), h * 0.48, w * 0.07, h * 0.15, sx * -0.12, 0, 7); g.fill(); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.arc(w * (0.5 + sx * 0.29), h * 0.63, w * 0.045, 0, 7); g.fill(); g.stroke(); g.fillStyle = shade(coat, -20);
  }
  // head
  g.fillStyle = skin; g.beginPath(); g.ellipse(w * 0.5, h * 0.165, w * 0.1, h * 0.065, 0, 0, 7); g.fill(); g.stroke();
  g.fillStyle = '#1a1410';
  g.beginPath(); g.arc(w * 0.46, h * 0.16, 3, 0, 7); g.arc(w * 0.54, h * 0.16, 3, 0, 7); g.fill();
  // headwear
  const hat = c.hat || 'none';
  g.fillStyle = hat === 'scarf' ? '#7a4a3a' : hat === 'bonnet' ? '#2e2a26' : '#1d1a18';
  if (hat === 'hat' || hat === 'bowler') {
    g.beginPath(); g.ellipse(w * 0.5, h * 0.11, w * 0.17, h * 0.012, 0, 0, 7); g.fill(); g.stroke();
    if (hat === 'bowler') { g.beginPath(); g.arc(w * 0.5, h * 0.105, w * 0.1, Math.PI, 0); g.fill(); g.stroke(); }
    else { g.fillRect(w * 0.41, h * 0.05, w * 0.18, h * 0.06); g.strokeRect(w * 0.41, h * 0.05, w * 0.18, h * 0.06); }
  } else if (hat === 'cap') {
    g.beginPath(); g.ellipse(w * 0.5, h * 0.115, w * 0.11, h * 0.03, 0, Math.PI, 0); g.fill(); g.stroke();
    g.fillRect(w * 0.5, h * 0.11, w * 0.13, h * 0.012);
  } else if (hat === 'scarf' || hat === 'bonnet') {
    g.beginPath(); g.ellipse(w * 0.5, h * 0.15, w * 0.125, h * 0.078, 0, Math.PI * 1.05, Math.PI * 1.95); g.lineTo(w * 0.62, h * 0.24); g.lineTo(w * 0.38, h * 0.24); g.closePath(); g.fill(); g.stroke();
    g.fillStyle = skin; g.beginPath(); g.ellipse(w * 0.5, h * 0.175, w * 0.075, h * 0.05, 0, 0, 7); g.fill();
    g.fillStyle = '#1a1410'; g.beginPath(); g.arc(w * 0.47, h * 0.17, 3, 0, 7); g.arc(w * 0.53, h * 0.17, 3, 0, 7); g.fill();
  }
  return cv;
}

const placeholderCache = new Map();

/**
 * Build a cutout. `artId` picks the art file (portrait_<artId>), `c` is the
 * character record (colors for the placeholder, height, anim settings).
 */
export function makeCutout(artId, c, scale = 1) {
  const H = (c.height || 1.7) * scale;
  const key = 'portrait_' + artId;
  if (!placeholderCache.has(artId)) placeholderCache.set(artId, placeholder(c));
  const tex = texture(key, { type: 'solid', color: '#000000', w: 4, h: 4 });
  // Replace the generic placeholder with the drawn silhouette until real art arrives.
  if (!hasRealArt(key) && tex.image !== placeholderCache.get(artId)) { tex.image = placeholderCache.get(artId); tex.needsUpdate = true; }
  tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping;

  const mat = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.45, side: THREE.DoubleSide, emissive: new THREE.Color(0x3a3530), emissiveMap: tex });
  const geo = new THREE.PlaneGeometry(1, 1);
  geo.translate(0, 0.5, 0); // pivot at the feet
  const plane = new THREE.Mesh(geo, mat);

  const group = new THREE.Group();
  group.add(plane);
  // soft shadow at the feet
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(0.32 * scale, 16), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = 0.012; shadow.scale.y = 0.6;
  group.add(shadow);

  const anim = c.anim || {};
  const state = {
    plane, mat, key, artId, H, aspect: 0, scale,
    idle: IDLE[anim.idle] || IDLE.breathe,
    talk: TALK[anim.talk] || TALK.nod,
    speed: anim.speed || 1,
    phase: Math.random() * 10,
    frames: anim.frames || 8, fps: anim.fps || 8, sheet: null,
    o: { x: 0, y: 0, sx: 1, sy: 1, rz: 0 },
  };
  group.userData.cutout = state;
  fit(state);
  return group;
}

function fit(s) {
  const img = s.mat.map.image;
  const frameW = s.sheet ? (img.width / s.frames) : img.width;
  const aspect = img && img.width ? frameW / img.height : 0.5;
  if (Math.abs(aspect - s.aspect) < 1e-3) return;
  s.aspect = aspect;
  // Real art includes some empty margin; scale so the figure is about H tall.
  const h = hasRealArt(s.key) ? s.H * 1.06 : s.H * 1.0;
  s.plane.scale.set(h * aspect, h, 1);
  s.baseW = h * aspect; s.baseH = h;
}

/** Called every frame for each cutout. */
export function animateCutout(group, t, camera, talking, walking = null) {
  const s = group.userData.cutout;
  // Upgrade to a sprite strip if anim_<id>.png exists.
  if (!s.sheet && hasRealArt('anim_' + s.artId)) {
    const sheet = texture('anim_' + s.artId).clone();
    sheet.image = texture('anim_' + s.artId).image;
    sheet.repeat.set(1 / s.frames, 1); sheet.wrapS = THREE.RepeatWrapping; sheet.needsUpdate = true;
    s.mat.map = sheet; s.mat.emissiveMap = sheet; s.mat.needsUpdate = true; s.sheet = sheet; s.aspect = 0;
  }
  if (s.sheet) s.sheet.offset.x = (Math.floor(t * s.fps * (talking ? 1.5 : 1)) % s.frames) / s.frames;
  fit(s);

  // Face the camera (turn around the vertical axis only).
  group.rotation.y = Math.atan2(camera.position.x - group.position.x, camera.position.z - group.position.z);

  const o = s.o; o.x = 0; o.y = 0; o.sx = 1; o.sy = 1; o.rz = 0;
  const tt = t + s.phase;
  if (walking) {
    // walk cycle: step bob + a little side-to-side lean; face the way they're going
    const k = tt * 7 * (walking.speed || 1);
    o.y = Math.abs(Math.sin(k)) * 0.045; o.rz = Math.sin(k) * 0.035;
    const rx = Math.cos(group.rotation.y), rz = -Math.sin(group.rotation.y);   // camera-right in world
    o.sx = (walking.vx * rx + walking.vz * rz) < -0.15 ? -1 : 1;
  } else (talking ? s.talk : s.idle)(o, tt, s.speed);
  s.plane.position.set(o.x, o.y, 0);
  s.plane.rotation.z = o.rz;
  s.plane.scale.set(s.baseW * o.sx, s.baseH * o.sy, 1);
}
