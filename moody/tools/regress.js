#!/usr/bin/env node
/* Regression: plays every mission of every world through real input.  node tools/regress.js [desk|phone|ipad] [wrong] [worlds,comma] */
const { launch, sleep } = require('./botlib.js');
const kind = process.argv[2] || 'desk', wrong = process.argv[3] === 'wrong', only = (process.argv[4] || '').split(',').filter(Boolean);
(async () => {
  const env = await launch({ kind, url: 'http://localhost:8765/moody/index.html?unlock=1' }), p = env.p, bot = env.bot;
  await bot.startGame(); await sleep(400);
  const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
  let fails = 0;
  for (const [wid, ms] of worlds) { if (only.length && !only.includes(wid)) continue;
    for (const mid of ms) {
      const r = await bot.playMission(wid, mid, { wrongFirst: wrong, timeout: 420000 });
      const st = await p.evaluate(([w, m]) => Moody.save.data.progress[w + '/' + m], [wid, mid]);
      const ok = r.ok && st && st.done; if (!ok) fails++;
      console.log(kind, wid, mid, ok ? 'OK' : 'FAIL ' + JSON.stringify(r).slice(0, 150), st ? st.stars + '*' : '', Math.round(r.secs || 0) + 's'); await bot.backToMap();
    } }
  const before = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)); await p.reload(); await sleep(1200);
  const after = await p.evaluate(() => JSON.stringify(Moody.save.data.progress));
  console.log('PERSIST', before === after ? 'OK' : 'MISMATCH', 'fails', fails); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 8)));
  await env.b.close();
})();
