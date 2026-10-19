#!/usr/bin/env node
/* Runner performance probe: node tools/runner_perf.js [desk|phone] [theme] [cpuThrottle=1]
   Plays 25 s of a market/park/abha level with the bot and prints requestAnimationFrame interval percentiles + the stage draw() cost (ms).
   CPU throttle (CDP Emulation.setCPUThrottlingRate) simulates a slower phone: 4 = "mid phone".  Headless Chromium uses a software canvas, so the absolute numbers are pessimistic. */
const { launch, sleep } = require('./botlib.js');
const { runnerHandler } = require('./runner_bot.js');
const kind = process.argv[2] || 'desk', theme = process.argv[3] || 'market', thr = +(process.argv[4] || 1), PORT = process.env.PORT || 8841;
(async () => {
  const env = await launch({ kind, url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1' }), p = env.p, bot = env.bot; await bot.startGame(); await sleep(300);
  if (thr > 1) { const c = await env.ctx.newCDPSession(p); await c.send('Emulation.setCPUThrottlingRate', { rate: thr }); }
  await p.evaluate(theme => { Moody.registerWorld({ id: 'tst', order: 50, title: 't', icon: 'home', heroes: ['moody', 'aboody'], control: ['moody', 'aboody', 'toota', 'nemo'], missions: [{ id: 'a', title: 't', intro: 'x', hideTitle: true, async run(ctx) { const r = await ctx.games.runner3d({ theme, length: 1500, seed: 3, prompt: 't', plan: [{ chunks: 3, tier: 2 }, { item: 'magnet' }, { gate: 'quiz', tag: 'runs_n' }, { chunks: 3, tier: 2 }, { item: 'rocket' }, { chunks: 3, tier: 3 }] }); window.__res = r; return ctx.nav.complete(); } }] }); Moody.flow.startMission('tst', 0); }, theme);
  const h = runnerHandler(env, { hero: 'moody' }); let started = false, t0 = 0;
  while (true) {
    const d = await p.evaluate(() => { const d = Moody.scene && Moody.scene.dbg; return d && d.kit === 'runner3d' ? d.phase : null; });
    if (!d) { await sleep(200); continue; }
    if (d === 'run' && !started) { started = true; if (process.env.LITE) await p.evaluate(() => { Moody.runner.lite = true; }); if (process.env.SKIP) await p.evaluate(k => k.split(',').forEach(x => { Moody.runner.skip[x] = 1; }), process.env.SKIP); t0 = Date.now(); await p.evaluate(() => { window.__fr = []; window.__ft = []; window.__slow = []; const t00 = performance.now(); let last = performance.now(); const tick = t => { window.__fr.push(t - last); if (t - last > 40) window.__slow.push([Math.round(t - t00), Math.round(t - last)]); last = t; requestAnimationFrame(tick); }; requestAnimationFrame(tick); const sc = Moody.scene, od = sc.draw; sc.draw = function (g, t) { const a = performance.now(); od.call(this, g, t); window.__ft.push(performance.now() - a); }; }); }
    if (started && process.env.NOBOT === '1') { await sleep(500); await p.evaluate(() => { const S = Moody.runner.cur; if (S) { S.inv = 99; S.shield = 0; } }); }   // NOBOT=1: no polling at all (the bot itself costs frames): the hero just runs straight and ignores hits
    else await h({ tapSel: bot.tapSel });
    if (started && Date.now() - t0 > 25000) break;
  }
  const r = await p.evaluate(() => { const q = (a, k) => { a = a.slice().sort((x, y) => x - y); return +a[Math.min(a.length - 1, Math.floor(a.length * k))].toFixed(2); }; const f = window.__fr.slice(5), t = window.__ft.slice(5); return { frames: f.length, fps: +(1000 / (f.reduce((x, y) => x + y, 0) / f.length)).toFixed(1), frameMs: { p50: q(f, .5), p95: q(f, .95), p99: q(f, .99), max: q(f, 1) }, drawMs: { p50: q(t, .5), p95: q(t, .95), p99: q(t, .99), max: q(t, 1) }, sprites: Moody.art.spriteCount(), heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) + 'MB' : null, canvas: Moody.cv.width + 'x' + Moody.cv.height, slow: window.__slow.slice(0, 6), lite: !!Moody.runner.lite, liteAuto: !!Moody.runner.liteAuto }; });
  console.log(kind, theme, 'cpu x' + thr, JSON.stringify(r)); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 5))); await env.b.close(); process.exit(0);
})().catch(e => { console.error(e); process.exit(2); });
