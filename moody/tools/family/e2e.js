#!/usr/bin/env node
/* End-to-end check of a BUILT edition with the base game's kid-bot (tools/botlib.js is required, not copied/modified).
     node tools/family/e2e.js <url-of-index.html> [desk|phone] [worlds,comma|all] [--wrong] [--shots <dir>]
   Plays every mission of the chosen worlds through real mouse/touch input, then reloads to check that progress persists. */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const args = process.argv.slice(2), flag = n => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; };
const wrong = flag('--wrong'); const si = args.indexOf('--shots'); const shots = si >= 0 ? args.splice(si, 2)[1] : null;
const url = args[0], kind = args[1] || 'desk', only = (args[2] && args[2] !== 'all' ? args[2] : '').split(',').filter(Boolean);
if (!url) { console.log('usage: node tools/family/e2e.js <url> [desk|phone] [worlds|all] [--wrong] [--shots dir]'); process.exit(1); }
(async () => {
  const env = await launch({ kind, url: url + (url.includes('?') ? '&' : '?') + 'unlock=1' }), p = env.p, bot = env.bot;
  if (shots) { fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, kind + '_title.png') }); }
  await bot.startGame(); await sleep(500);
  if (shots) await p.screenshot({ path: path.join(shots, kind + '_map.png') });
  const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
  let fails = 0, n = 0;
  for (const [wid, ms] of worlds) {
    if (only.length && !only.includes(wid)) continue;
    for (const mid of ms) {
      const r = await bot.playMission(wid, mid, { wrongFirst: wrong, timeout: 420000, shots: null });
      const st = await p.evaluate(([w, m]) => Moody.save.data.progress[w + '/' + m], [wid, mid]);
      const ok = r.ok && st && st.done; n++; if (!ok) fails++;
      console.log(kind, wid, mid, ok ? 'OK' : 'FAIL ' + JSON.stringify(r).slice(0, 150), st ? st.stars + '*' : '', Math.round(r.secs || 0) + 's');
      await bot.backToMap();
    }
  }
  const before = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)); await p.reload(); await sleep(1200);
  const after = await p.evaluate(() => JSON.stringify(Moody.save.data.progress));
  console.log('PERSIST', before === after ? 'OK' : 'MISMATCH', '| missions', n, '| fails', fails); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 12)));
  await env.b.close(); process.exit(fails || before !== after || env.errs.length ? 1 : 0);
})();
