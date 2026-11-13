// Moving pieces: scripted walks, rides, walkers and vehicles, run on fast-forwarded game time.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 800, height: 450 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.html?dev'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2500);
  const load = async (zn) => { await p.evaluate(([zn]) => import('./js/state.js').then(m => { const g = window.game, f = m.state.flags; f.election_night = zn === 'night'; f.in_park = false; if (zn !== 'ship' && zn !== 'castle' && zn !== 'les') g.day2Defaults(zn === 'night'); g.loadZone(zn === 'night' ? 'city' : zn, { skipCard: true }); }), [zn]); await p.waitForTimeout(3000); };
  const HELP = `
    const g = window.game, z = g.zone; g.setMode('play');
    const big = z.colliders.filter(c => !c.off && (c.maxX - c.minX) * (c.maxZ - c.minZ) > 12);
    const inBig = (x, zz) => big.some(c => x > c.minX + 0.4 && x < c.maxX - 0.4 && zz > c.minZ + 0.4 && zz < c.maxZ - 0.4);
    const sim = (sec, each) => { for (let t = 0; t < sec; t += 0.05) { z.update(0.05); if (z.rideStep && z.ride) {} if (each) each(t); } };
    const r1 = v => Math.round(v * 10) / 10; const out = [];
  `;
  await load('castle');
  console.log('castle:', JSON.stringify(await p.evaluate(`(()=>{${HELP}
    z.onAction('afterDoctor'); let tDesk = null; sim(70, t => { if (z.familyAtDesk && tDesk === null) tDesk = r1(t); });
    out.push('family at desk after ' + tDesk + ' s'); out.push('desk spots ok: ' + z.indoorFamily.every((n, i) => Math.hypot(n.group.position.x - z.deskSpots[i][0], n.group.position.z - z.deskSpots[i][1]) < 0.3));
    z.onAction('afterClerk'); sim(60); out.push('after clerk: ' + z.indoorFamily.map(n => r1(n.group.position.x) + ',' + r1(n.group.position.z) + (n.goto ? ' STILL WALKING' : '') + (inBig(n.group.position.x, n.group.position.z) ? ' IN WALL' : '')).join(' | '));
    return out; })()`)));
  await load('les');
  console.log('les:', JSON.stringify(await p.evaluate(`(()=>{${HELP}
    z.onAction('familyEnters'); sim(70); out.push('family: ' + z.family.map(n => r1(n.group.position.x) + ',' + r1(n.group.position.z) + (n.goto ? ' STILL WALKING' : '')).join(' | '));
    z.onAction('kesslerLeaves'); sim(60); out.push('kessler gone: ' + (!z.kessler.group.visible));
    const bad = new Set(), start = z.movers.map(m => [m.group.position.x, m.group.position.z]), far = z.movers.map(() => 0);
    sim(240, t => { if (Math.round(t * 20) % 10) return; z.npcs.forEach(n => { if (n.path && inBig(n.group.position.x, n.group.position.z)) bad.add(n.id + '@' + r1(n.group.position.x) + ',' + r1(n.group.position.z)); }); z.movers.forEach((m, i) => { far[i] = Math.max(far[i], Math.hypot(m.group.position.x - start[i][0], m.group.position.z - start[i][1])); if (inBig(m.group.position.x, m.group.position.z)) bad.add('vehicle' + i); }); });
    out.push('vehicles travelled (m): ' + far.map(r1).join(', ')); out.push('in buildings: ' + ([...bad].slice(0, 8).join(' ') || 'none'));
    return out; })()`)));
  for (const zn of ['city', 'night']) {
    await load(zn);
    console.log(zn + ':', JSON.stringify(await p.evaluate(`(()=>{${HELP}
      const bad = new Set(), start = (z.movers || []).map(m => [m.group.position.x, m.group.position.z]), far = start.map(() => 0);
      sim(240, t => { if (Math.round(t * 20) % 10) return; z.npcs.forEach(n => { if (n.path && inBig(n.group.position.x, n.group.position.z)) bad.add(n.id + '@' + r1(n.group.position.x) + ',' + r1(n.group.position.z)); }); (z.movers || []).forEach((m, i) => { far[i] = Math.max(far[i], Math.hypot(m.group.position.x - start[i][0], m.group.position.z - start[i][1])); }); });
      out.push('vehicles travelled (m): ' + far.map(r1).join(', ')); out.push('in buildings: ' + ([...bad].slice(0, 8).join(' ') || 'none'));
      const ride = (kind, dest) => { z.startRide(kind, dest); let n = 0; while (z.ride && n++ < 4000) { z.rideStep(0.05); z.update(0.05); } const c = g.controls.pos; return dest + ' -> where=' + z.where + (z.ride ? ' RIDE STUCK' : '') + ' at ' + r1(c.x) + ',' + r1(c.z) + (z.colliders.some(k => !k.off && c.x + 0.3 > k.minX && c.x - 0.3 < k.maxX && c.z + 0.3 > k.minZ && c.z - 0.3 < k.maxZ) && z.where !== 'roof' ? ' INSIDE A COLLIDER' : ''); };
      out.push(ride('cab', 'roof')); out.push(ride('cab', 'street'));
      if (!z.night) { out.push(ride('car', 'park')); out.push(ride('car', 'downtown')); }
      return out; })()`)));
  }
  console.log('PAGE ERRORS', JSON.stringify(errs));
  await b.close();
})();
