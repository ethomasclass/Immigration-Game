// Out-of-order travel: soft exits and two-way trips, played with no goals finished.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1280, height: 720 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' && !/404|Failed to load/.test(m.text())) errs.push(m.text()); });
  await p.goto('http://localhost:8123/index.html?dev'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.waitForTimeout(2500);
  const W = ms => p.waitForTimeout(ms);
  const use = (re, times = 1) => p.evaluate(([re, times]) => { const g = window.game; g.setMode('play'); const it = g.zone.interactables.find(i => !i.hidden && new RegExp(re).test(i.prompt)); if (!it) return 'NO SUCH: ' + re; g.focus = it; for (let k = 0; k < times; k++) g.useFocus(); return 'used ' + it.prompt; }, [re, times]);
  const where = () => p.evaluate(async () => { const g = window.game, d = await import('./js/dev/inspect.js'); const q = d.qa(); return g.zoneId + ' @' + Math.round(g.controls.pos.x) + ',' + Math.round(g.controls.pos.z) + ' | goal: ' + document.getElementById('goal-text').textContent.slice(0, 60) + ' | problems: ' + (q.problems.filter(x => !/Jack Doyle|Money Changer|runner|changer|helper/.test(x)).join('; ') || 'none'); });
  const skipCard = async () => { await W(500); await p.evaluate(() => { const c = document.getElementById('card'); if (!c.classList.contains('hidden')) document.getElementById('card-go').click(); }); await W(3200); };
  // ---- Day 1: Castle Garden with nothing done -> gate -> street -> Hester Street -> back
  await p.evaluate(() => window.game.loadZone('castle', { skipCard: true })); await W(3000);
  console.log(await use('Go through the gate'), '->', await p.evaluate(() => window.game.zone.barrier.visible));
  console.log(await use('Go through the gate'), '-> barrier', await p.evaluate(() => window.game.zone.barrier.visible));
  console.log(await use('Walk up to Hester'), '| still', await p.evaluate(() => window.game.zoneId));
  console.log(await use('Walk up to Hester')); await skipCard(); console.log('  now', await where());
  console.log(await use('Walk back down to Castle')); await W(3200); console.log('  now', await where());
  console.log(await use('Walk up to Hester')); await W(600); console.log(await use('Walk up to Hester')); await W(3200); console.log('  now', await where(), '| card shown again:', await p.evaluate(() => !document.getElementById('card').classList.contains('hidden')));
  console.log('Day 1 finish exit is hard:', await use('finish the story', 2), '| still', await p.evaluate(() => window.game.zoneId + ' mode ' + window.game.mode));
  // ---- Day 2: Hester Street with nothing done -> Park Row -> back -> Park Row
  await p.evaluate(() => { window.game.startDay2(); }); await W(600);
  for (let i = 0; i < 3; i++) await p.evaluate(() => { const c = document.getElementById('card'); if (!c.classList.contains('hidden')) document.getElementById('card-go').click(); }).then(() => W(900));
  await W(3000); console.log('day 2', await where());
  console.log(await use('horsecar down the Bowery to Park Row', 2)); await skipCard(); console.log('  now', await where());
  console.log(await use('back up to Hester')); await W(3400); console.log('  now', await where());
  console.log(await use('horsecar down the Bowery to Park Row', 2)); await W(3400); console.log('  now', await where(), '| purse', await p.evaluate(() => import('./js/state.js').then(m => m.state.cents)));
  console.log('Editor is hard:', await use('Editor', 2), '| mode', await p.evaluate(() => window.game.mode));
  console.log('PAGE ERRORS', JSON.stringify(errs));
  await b.close();
})();
