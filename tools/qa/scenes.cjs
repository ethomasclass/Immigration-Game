// Full quality pass. For every scene: reachability, then press every person/object and report errors.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.html?dev'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2500);
  const scenes = (process.argv[2] || 'ship,castle,castle+gate,les,les2,city,park,night').split(',');
  for (const sc of scenes) {
    const [zn, opt] = sc.split('+');
    await p.evaluate(([zn]) => import('./js/state.js').then(m => {
      const g = window.game, f = m.state.flags;
      f.election_night = zn === 'night'; f.in_park = false;
      if (zn === 'les2' || zn === 'city' || zn === 'night' || zn === 'park') g.day2Defaults(zn === 'night');
      g.loadZone({ night: 'city', park: 'city' }[zn] || zn, { skipCard: true });
    }), [zn]);
    await p.waitForTimeout(3000);
    const rep = await p.evaluate(async ([zn, opt]) => {
      const g = window.game, z = g.zone, d = await import('./js/dev/inspect.js');
      g.setMode('play');
      if (opt === 'gate') z.openGate(true);
      if (zn === 'park') { z.bounds = z.boundsPark; z.where = 'park'; g.controls.setPose(4000, 62, 0); }
      const out = d.qa();
      // press everything that does not leave the scene
      const acts = [];
      for (const it of z.interactables) {
        if (it.hidden || it.used) continue;
        const src = String(it.action);
        if (/loadZone|openWrapup|goParkRow|rideDown|startRide|toNight|rideUp|startDay2/.test(src)) { acts.push('skip:' + it.prompt); continue; }
        try {
          g.setMode('play'); it.action();
          for (let k = 0; k < 400 && (g.dialogue.active || g.mode === 'doc'); k++) {
            if (g.mode === 'doc') { g.docOpenedAt = 0; g.closeDoc(); continue; }
            const dl = g.dialogue; dl.startedAt = 0;
            if (dl.choiceList) dl.choose(dl.choiceList[dl.choiceList.length - 1]); else dl.advance();
          }
          if (g.dialogue.active) { out.problems.push(`conversation never ends: "${it.prompt}"`); g.dialogue.close(); }
        } catch (e) { out.problems.push(`error using "${it.prompt}": ${e.message}`); try { g.dialogue.close(); } catch {} }
      }
      g.setMode('play');
      return { cells: out.reachCells, problems: out.problems, n: z.interactables.length, skipped: acts.filter(a => a.startsWith('skip')).map(a => a.slice(5)), people: z.npcs.length, movers: (z.movers || []).length };
    }, [zn, opt]);
    console.log(`\n=== ${sc}: ${rep.cells} walkable cells, ${rep.n} things to use, ${rep.people} people, ${rep.movers} vehicles`);
    console.log('  exits/rides (not pressed): ' + rep.skipped.join(' | '));
    for (const pr of rep.problems) console.log('  PROBLEM: ' + pr);
  }
  console.log('\nPAGE ERRORS', JSON.stringify(errs));
  await b.close();
})();
