#!/usr/bin/env node
/* nana world test: node tools/nana_test.js [desk|phone] [wrong] [m1,m2..]   (custom bot handlers for nnLift / nnClock; screenshots every few s) */
const { launch, sleep } = require('./botlib.js');
const SH = process.env.SHOTS || '/tmp/claude-0/-home-user/53a3c7d8-c487-5827-a402-36d70899f068/scratchpad/shots/nana/';
const kind = process.argv[2] || 'desk', wrong = process.argv[3] === 'wrong', only = (process.argv[4] || '').split(',').filter(Boolean);
const PORT = process.env.PORT || 8801;
(async () => {
  const env = await launch({ kind, url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1' }), p = env.p, bot = env.bot;
  await bot.startGame(); await sleep(400);
  const ms = await p.evaluate(() => Moody.getWorld('nana').missions.map(m => m.id));
  let fails = 0, cur = '', n = 0;
  const custom = {
    nnlift: async ({ d, tapSel, sleep }) => { if (d.phase === 'pick') { if (wrong && !custom._w1) { custom._w1 = 1; await tapSel('button[data-floor="1"]'); await sleep(2800); } await tapSel('button[data-floor="' + d.target + '"]'); } await sleep(300); },
    nnclock: async ({ d, tapSel, sleep }) => {
      if (wrong && !custom._w2) { custom._w2 = 1; await tapSel('[data-act="ok"]'); await sleep(2800); }
      if (d.h !== d.th) await tapSel('[data-act="h+"]'); else if (d.m !== d.tm) await tapSel('[data-act="m"]'); else await tapSel('[data-act="ok"]'); await sleep(350);
    }
  };
  const iv = setInterval(() => { n++; bot.shot(SH + kind + (wrong ? 'W' : '') + '_' + cur + '_' + String(n).padStart(3, '0') + '.png'); }, +process.env.SHOT_MS || 3000);
  for (const mid of ms) { if (only.length && !only.includes(mid)) continue; cur = mid; custom._w1 = custom._w2 = 0;
    const r = await bot.playMission('nana', mid, { wrongFirst: wrong, timeout: 420000, custom, onKit: (sig) => console.log('  kit', mid, sig) });
    const st = await p.evaluate(m => Moody.save.data.progress['nana/' + m], mid); const ok = r.ok && st && st.done; if (!ok) fails++;
    console.log(kind, mid, ok ? 'OK' : 'FAIL ' + JSON.stringify(r).slice(0, 300), st ? st.stars + '*' : '', Math.round(r.secs || 0) + 's'); await sleep(3200); await bot.backToMap(); }
  clearInterval(iv);
  const before = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)); await p.reload(); await sleep(1200);
  const after = await p.evaluate(() => JSON.stringify(Moody.save.data.progress));
  console.log('PERSIST', before === after ? 'OK' : 'MISMATCH', 'fails', fails); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 10)));
  await env.b.close();
})();
