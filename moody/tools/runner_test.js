#!/usr/bin/env node
/* Runner (world 'runs') test:  node tools/runner_test.js [desk|phone] [wrong] [r1,r2,r3] [hero]
   Plays the 3 runner missions through real input (desk = keyboard events, phone = CDP touch swipes) using Moody.scene.dbg of the kit 'runner3d'
   (tools/runner_bot.js).  Env: PORT (default 8842), SHOTS (screenshot dir), SHOT_MS, HERO, ASSIST (0/1).  Also prints frame-time stats of the draw pass. */
const { launch, sleep } = require('./botlib.js');
const { runnerHandler } = require('./runner_bot.js');
const SH = process.env.SHOTS || '/tmp/claude-0/-home-user/53a3c7d8-c487-5827-a402-36d70899f068/scratchpad/shots/run/';
const fs = require('fs'); try { fs.mkdirSync(SH, { recursive: true }); } catch (e) { }
const kind = process.argv[2] || 'desk', wrong = process.argv[3] === 'wrong', only = (process.argv[4] || '').split(',').filter(Boolean), hero = process.argv[5] || process.env.HERO || 'moody';
const PORT = process.env.PORT || 8842;
(async () => {
  const env = await launch({ kind, url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1' }), p = env.p, bot = env.bot;
  await bot.startGame(); await sleep(400);
  const ms = await p.evaluate(() => Moody.getWorld('runs').missions.map(m => m.id));
  let fails = 0, cur = '', n = 0; const summary = [];
  const mkHandler = () => runnerHandler(env, { wrongFirst: wrong, hero, assist: process.env.ASSIST == null ? null : process.env.ASSIST === '1', log: console.log, debugHits: process.env.DEBUG_HITS === '1' });   // fresh per mission (wrong gate first in EVERY mission)
  const iv = setInterval(() => { n++; bot.shot(SH + kind + (wrong ? 'W' : '') + '_' + cur + '_' + String(n).padStart(3, '0') + '.png'); }, +process.env.SHOT_MS || 4000);
  for (const mid of ms) {
    if (only.length && !only.includes(mid)) continue; cur = mid;
    const wrapped = async a => { if (!wrapped.on) { wrapped.on = 1; await p.evaluate(() => { window.__ft = []; const sc = Moody.scene; if (sc && sc.draw && !sc.__w) { const od = sc.draw; sc.__w = 1; sc.draw = function (g, t) { const a = performance.now(); od.call(this, g, t); window.__ft.push(performance.now() - a); if (window.__ft.length > 6000) window.__ft.shift(); }; } }); } return wrapped.h(a); }; wrapped.h = mkHandler();
    const PM = () => bot.playMission('runs', mid, { wrongFirst: wrong, timeout: 420000, custom: { runner3d: wrapped }, onKit: sig => console.log('  kit', mid, sig) });
    let r; try { r = await PM(); } catch (e) { if (!/mcard|waitForSelector/.test(String(e))) throw e; console.log('  (map nav flake, retry)', mid); await sleep(1500); await bot.backToMap(); await sleep(1500); r = await PM(); }
    const last = await p.evaluate(() => JSON.stringify(Moody.runner.last || null)); console.log('  result', last);
    const st = await p.evaluate(m => Moody.save.data.progress['runs/' + m], mid), ok = r.ok && st && st.done; if (!ok) fails++;
    const ft = await p.evaluate(() => { const a = (window.__ft || []).slice().sort((x, y) => x - y); return a.length ? { n: a.length, med: +a[a.length >> 1].toFixed(2), p95: +a[Math.floor(a.length * .95)].toFixed(2), max: +a[a.length - 1].toFixed(2) } : null; });
    summary.push({ mid, ok, stars: st && st.stars, secs: Math.round(r.secs || 0), ft });
    console.log(kind, wrong ? 'wrong-first' : '', hero, mid, ok ? 'OK' : 'FAIL ' + JSON.stringify(r).slice(0, 300), st ? st.stars + '*' : '', Math.round(r.secs || 0) + 's', 'drawMs', JSON.stringify(ft));
    await sleep(1500); await bot.backToMap();
  }
  clearInterval(iv);
  const before = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)); await p.reload(); await sleep(1200);
  const after = await p.evaluate(() => JSON.stringify(Moody.save.data.progress));
  console.log('PERSIST', before === after ? 'OK' : 'MISMATCH', 'fails', fails); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 10)));
  await env.b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
