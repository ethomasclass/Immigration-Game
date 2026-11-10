// ============================================================================
// DEVELOPER TOOLS (loaded only with ?dev in the URL). Not used by students.
//   dev.gaps()        find walkable spots with no ground under them
//   dev.topdown(px)   render an orthographic plan view of the zone (PNG data URL)
//   dev.stats()       draw calls, triangles, people, lights
// ============================================================================
import * as THREE from 'three';

const g = () => window.game;

function solidMeshes() {
  const out = [];
  g().zone.scene.traverse(o => {
    if (!o.isMesh || !o.visible) return;
    if (o.userData.keep && !o.geometry.parameters) return;
    if (o.parent && o.parent.userData && o.parent.userData.cutout) return;   // people
    if (o.material && (o.material.transparent || o.material.depthTest === false)) return;   // beacon, skyline
    out.push(o);
  });
  return out;
}

function describe(o) {
  const m = o.material, key = m && m.map && m.map.userData && m.map.userData.key;
  const p = o.geometry && o.geometry.parameters;
  return (key || (m && m.color ? '#' + m.color.getHexString() : 'mesh')) + (p && p.width ? ` ${p.width.toFixed?.(1)}x${(p.height || 0).toFixed?.(1)}` : '');
}

function blocked(cols, x, z, r = 0.3) {
  for (const c of cols) { if (c.off) continue; if (x + r > c.minX && x - r < c.maxX && z + r > c.minZ && z - r < c.maxZ) return true; }
  return false;
}

/** Grid-scan the zone. A walkable point (inside bounds, not inside a collider) must have ground within ±0.25 m of the floor height. */
export function gaps({ step = 1, region = null } = {}) {
  const z = g().zone, b = region || z.bounds, cols = z.colliders, floorY = g().controls.floorY || 0;
  const meshes = solidMeshes(), ray = new THREE.Raycaster(), down = new THREE.Vector3(0, -1, 0), o = new THREE.Vector3();
  const bad = [];
  let tested = 0;
  // Flood-fill from the player's position: only places a student can actually walk to count.
  const nx = Math.ceil((b.maxX - b.minX) / step), nz = Math.ceil((b.maxZ - b.minZ) / step);
  const idx = (i, j) => i * nz + j, seen = new Uint8Array(nx * nz), q = [];
  const pp = g().controls.pos, si = Math.floor((pp.x - b.minX) / step), sj = Math.floor((pp.z - b.minZ) / step);
  if (si >= 0 && sj >= 0 && si < nx && sj < nz) { seen[idx(si, sj)] = 1; q.push([si, sj]); }
  const reach = [];
  while (q.length) {
    const [i, j] = q.pop(); reach.push([i, j]);
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const a = i + di, c = j + dj; if (a < 0 || c < 0 || a >= nx || c >= nz || seen[idx(a, c)]) continue;
      const x0 = b.minX + (i + 0.5) * step, z0 = b.minZ + (j + 0.5) * step, x1 = b.minX + (a + 0.5) * step, z1 = b.minZ + (c + 0.5) * step;
      let ok = true;   // walk the edge in small steps so thin railings and walls are not skipped
      for (let t = 0.125; t <= 1 && ok; t += 0.125) if (blocked(cols, x0 + (x1 - x0) * t, z0 + (z1 - z0) * t, 0.15)) ok = false;
      if (ok) { seen[idx(a, c)] = 1; q.push([a, c]); }
    }
  }
  for (const [i, j] of reach) {
    const x = b.minX + (i + 0.5) * step, zz = b.minZ + (j + 0.5) * step;
    tested++;
    o.set(x, floorY + 1.0, zz); ray.set(o, down); ray.far = 60;
    const hit = ray.intersectObjects(meshes, false)[0];
    const y = hit ? hit.point.y : null;
    if (y === null || Math.abs(y - floorY) > 0.25) bad.push({ x: +x.toFixed(1), z: +zz.toFixed(1), y: y === null ? null : +y.toFixed(2), what: hit ? describe(hit.object) : 'nothing' });
  }
  // cluster bad points into rectangles for a readable report
  const clusters = [];
  for (const p of bad) {
    let c = clusters.find(c => p.x >= c.minX - step * 1.5 && p.x <= c.maxX + step * 1.5 && p.z >= c.minZ - step * 1.5 && p.z <= c.maxZ + step * 1.5 && (c.y === null) === (p.y === null));
    if (!c) clusters.push(c = { minX: p.x, maxX: p.x, minZ: p.z, maxZ: p.z, n: 0, y: p.y, what: p.what });
    c.minX = Math.min(c.minX, p.x); c.maxX = Math.max(c.maxX, p.x); c.minZ = Math.min(c.minZ, p.z); c.maxZ = Math.max(c.maxZ, p.z); c.n++;
  }
  return { tested, bad: bad.length, clusters: clusters.sort((a, b) => b.n - a.n).slice(0, 25) };
}

/** Orthographic plan view of the whole zone (or a region), lit by the zone's own lights. */
export function topdown(px = 1024, region = null) {
  const game = g(), z = game.zone, b = region || z.bounds;
  const w = b.maxX - b.minX, d = b.maxZ - b.minZ, s = Math.max(w, d) / 2;
  const cam = new THREE.OrthographicCamera(-s, s, s, -s, 0.1, 2000);
  cam.position.set((b.minX + b.maxX) / 2, 600, (b.minZ + b.maxZ) / 2); cam.up.set(0, 0, -1); cam.lookAt(cam.position.x, 0, cam.position.z);
  const r = game.renderer, oldSize = new THREE.Vector2(); r.getSize(oldSize);
  const oldPR = r.getPixelRatio(), fog = z.scene.fog; z.scene.fog = null;
  const hidden = []; z.scene.traverse(o => { if (o.userData && o.userData.cutout) { hidden.push([o, o.visible]); o.visible = false; } });
  if (game.beacon) game.beacon.visible = false;
  r.setPixelRatio(1); r.setSize(px, px, false); r.render(z.scene, cam);
  const url = r.domElement.toDataURL('image/png');
  z.scene.fog = fog; hidden.forEach(([o, v]) => { o.visible = v; });
  r.setPixelRatio(oldPR); r.setSize(oldSize.x, oldSize.y, false);
  return url;
}

export function stats() {
  const r = g().renderer; r.render(g().zone.scene, g().camera);
  let lights = 0; g().zone.scene.traverse(o => { if (o.isLight) lights++; });
  return { calls: r.info.render.calls, tris: r.info.render.triangles, npcs: g().zone.npcs.length, lights, cols: g().zone.colliders.length, textures: r.info.memory.textures, geos: r.info.memory.geometries };
}

export { THREE };
