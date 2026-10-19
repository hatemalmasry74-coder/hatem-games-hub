#!/usr/bin/env node
/* Moody & Aboody - tools/perf_bench.js : frame-time benchmark per quality level.
   Playwright + CDP CPU throttling (Emulation.setCPUThrottlingRate), desk + phone viewports.
   Loads heavy scenes through a throw-away "bench" world (no gameplay needed) and records requestAnimationFrame intervals.

   node tools/perf_bench.js [--base http://localhost:8871/moody/index.html] [--levels low,medium,high]  (or "orig" = do not touch Moody.quality)
                            [--throttle 4,6] [--vp desk,phone] [--scenes home,gather14,saudiroad,runner] [--secs 6] [--json out.json] [--md]
   Scenes:  empty     plain background, no actors: the measurement floor of the browser itself
            home      bedroom, Moody + Aboody
            gather14  living room with 14 characters (the worst case)
            saudiroad scrolling Saudi mountain road (baked tiles + parallax)
            runner    3-lane runner level (market theme), hero ignores obstacles, no bot polling
   Numbers come from headless Chromium with a SOFTWARE canvas: relative comparisons are meaningful, absolute fps are not a real phone. */
const { launch, sleep } = require('./botlib.js');
const { runnerHandler } = require('./runner_bot.js');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
/* CPU time (ms) used by the whole browser process tree started by this script: lets us report "CPU ms per frame", which stays comparable when the machine is busy (wall-clock fps does not) */
const fs = require('fs');
function cpuMs() { const ps = []; try { for (const d of fs.readdirSync('/proc')) { if (!/^\d+$/.test(d)) continue; try { const m = /^\d+ \(.*\) \S (\d+) /.exec(fs.readFileSync('/proc/' + d + '/stat', 'utf8')); if (m) ps.push([+d, +m[1]]); } catch (e) { } } } catch (e) { return 0; }
  const kids = pid => { const o = []; ps.forEach(([p, pp]) => { if (pp === pid) { o.push(p, ...kids(p)); } }); return o; }; let t = 0;
  for (const pid of kids(process.pid)) { try { const s = fs.readFileSync('/proc/' + pid + '/stat', 'utf8'), a = s.slice(s.lastIndexOf(')') + 2).split(' '); t += (+a[11]) + (+a[12]); } catch (e) { } } return t * 10; }
const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 && process.argv[i + 1] && !process.argv[i + 1].startsWith('--') ? process.argv[i + 1] : d; };
const BASE = arg('base', 'http://localhost:' + (process.env.PORT || 8871) + '/moody/index.html'), CASES = arg('cases', arg('levels', 'low,medium,high')).split(',').map(c => { const [l, u] = c.split('@'); return { level: l, base: u || BASE, label: l + (u && l !== 'orig' ? '@' + u : '') }; }), REPS = +arg('reps', 1), LEVELS = CASES.map(c => c.label), THR = arg('throttle', '4,6').split(',').map(Number),
  VPS = arg('vp', 'desk,phone').split(','), SCENES = arg('scenes', 'home,gather14,saudiroad,runner').split(','), SECS = +arg('secs', 6), OUT = arg('json', ''), MD = process.argv.includes('--md');

const EVERY14 = ['moody', 'aboody', 'toota', 'nemo', 'nana', 'baba', 'ofa', 'toti', 'amani', 'nada', 'beno', 'medo', 'kamal', 'luka'];

/* runs inside the page: registers the bench world */
function setupWorld(scene, EVERY) {
  const missions = {
    empty: async ctx => { await ctx.scene('plain', { instant: true, heroes: 'hidden' }); await ctx.wait(9999); },   // environment floor: nothing but a clear canvas + the HUD
    home: async ctx => { await ctx.scene('bedroom', { instant: true }); await ctx.wait(9999); },
    gather14: async ctx => {
      ctx.cast(EVERY, ['moody', 'aboody', 'toota', 'nemo']);
      const lay = {}; EVERY.forEach((id, i) => { lay[id] = { x: 70 + i * 62, y: 470 + (i % 3) * 14, dir: i % 2 ? -1 : 1 }; });
      await ctx.scene('gather_living', { instant: true, state: { hearts: true }, heroes: lay });
      // a couple of speakers / gestures like a real scene
      ctx.stage.heroes.baba.anim = 'wave'; ctx.stage.heroes.toti.anim = 'cheer';
      await ctx.wait(9999);
    },
    saudiroad: async ctx => { await ctx.scene('saudiRoad', { instant: true, state: { fog: .2, speed: 40 }, heroes: 'hidden' }); ctx.every(.016, () => { ctx.stage.state.scroll = (ctx.stage.state.scroll || 0) + .5; ctx.stage.state._t = (ctx.stage.state._t || 0) + .016; }); await ctx.wait(9999); },
    runner: async ctx => { await ctx.games.runner3d({ theme: 'market', length: 4000, seed: 3, prompt: 't', plan: [{ chunks: 40, tier: 2 }] }); return ctx.nav.complete(); }
  };
  Moody.registerWorld({ id: 'bench', order: 60, title: 'b', icon: 'home', hidden: true, heroes: ['moody', 'aboody'], control: ['moody', 'aboody'], missions: [{ id: 'a', title: 't', intro: 'x', hideTitle: true, run: missions[scene] }] });
  Moody.flow.startMission('bench', 0);
}

async function runScene(browser, vp, thr, cs, scene) {
  const level = cs.level, BASE = cs.base;
  const ctxOpts = { desk: { viewport: { width: 1280, height: 720 } }, phone: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } }[vp];
  const c = await browser.newContext(ctxOpts), p = await c.newPage(), errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  try {
    await p.goto(BASE + '?unlock=1'); await sleep(1500);
    await p.evaluate(() => { Moody.save.data.named = true; });
    const b = await p.$('.btn.big.green'); if (b) await b.click({ force: true }); await sleep(500);
    if (level !== 'orig') { const ok = await p.evaluate(l => { if (!Moody.quality) return false; Moody.quality.set(l, { fixed: true, silent: true }); return true; }, level); if (!ok) { await c.close(); return { error: 'no Moody.quality' }; } }
    await p.evaluate(`(${setupWorld.toString()})(${JSON.stringify(scene)},${JSON.stringify(EVERY14)})`);
    await sleep(1800);
    if (scene === 'runner') {   // pick hero / countdown with the bot, then let the hero run by itself
      const h = runnerHandler({ p, ctx: c, kind: vp }, { hero: 'moody' }); const t0 = Date.now();
      while (Date.now() - t0 < 25000) { const ph = await p.evaluate(() => { const d = Moody.scene && Moody.scene.dbg; return d && d.kit === 'runner3d' ? d.phase : null; }); if (ph === 'run') break; await h({ tapSel: async sel => { try { await p.locator(sel).first().click({ timeout: 1500, force: true }); } catch (e) { } } }); await sleep(120); }
      await sleep(1500);
    }
    const cdp = await c.newCDPSession(p); if (thr > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: thr });
    await sleep(800);
    const cpu0 = cpuMs(), wall0 = Date.now();
    await p.evaluate(secs => new Promise(res => {
      window.__fr = []; window.__dr = []; let last = performance.now(); const t0 = last, sc = Moody.scene, od = sc.draw; sc.draw = function (g, t) { const a = performance.now(); od.call(this, g, t); window.__dr.push(performance.now() - a); };
      const tick = t => { window.__fr.push(t - last); last = t; if (t - t0 < secs * 1000) requestAnimationFrame(tick); else { sc.draw = od; res(); } }; requestAnimationFrame(tick);
    }), SECS);
    const r = await p.evaluate(() => {
      const q = (a, k) => { a = a.slice().sort((x, y) => x - y); return a.length ? a[Math.min(a.length - 1, Math.floor(a.length * k))] : 0; }, f = window.__fr.slice(3), d = window.__dr.slice(3), avg = a => a.reduce((x, y) => x + y, 0) / (a.length || 1);
      return { frames: f.length, avgMs: avg(f), p95Ms: q(f, .95), fps: 1000 / avg(f), drawAvg: avg(d), drawP95: q(d, .95), canvas: Moody.cv.width + 'x' + Moody.cv.height, level: Moody.quality ? Moody.quality.level : 'n/a', phase: (Moody.scene.dbg && Moody.scene.dbg.phase) || '', heap: performance.memory ? Math.round(performance.memory.usedJSHeapSize / 1e6) : 0 };
    });
    r.cpuMsPerFrame = (cpuMs() - cpu0) / Math.max(1, r.frames + 3); r.wallMs = Date.now() - wall0; r.load = +require('os').loadavg()[0].toFixed(1);
    r.errors = errs.length; await c.close(); return r;
  } catch (e) { try { await c.close(); } catch (x) { } return { error: String(e).slice(0, 120) }; }
}

(async () => {
  const browser = await chromium.launch({ args: ['--enable-precise-memory-info'] }), rows = [];
  const med = a => { a = a.filter(x => x != null && isFinite(x)).sort((x, y) => x - y); return a.length ? a[Math.floor((a.length - 1) / 2)] : null; };
  for (const vp of VPS) for (const thr of THR) for (const scene of SCENES) {
    const reps = {}; CASES.forEach(c => { reps[c.label] = []; });
    for (let rep = 0; rep < REPS; rep++) for (const cs of CASES) {   // interleaved: every case is measured back to back, so machine-load drift hits all of them alike
      const r = await runScene(browser, vp, thr, cs, scene); reps[cs.label].push(r);
      console.log(vp.padEnd(5), 'x' + thr, scene.padEnd(9), cs.label.padEnd(8), 'rep' + (rep + 1), r.error ? 'ERROR ' + r.error : 'fps ' + r.fps.toFixed(1).padStart(5) + '  avg ' + r.avgMs.toFixed(1).padStart(5) + 'ms  p95 ' + r.p95Ms.toFixed(1).padStart(5) + 'ms  cpu/frame ' + r.cpuMsPerFrame.toFixed(1) + 'ms  load ' + r.load + '  js-draw ' + r.drawAvg.toFixed(1) + 'ms  ' + r.canvas + ' lvl ' + r.level + ' errs ' + r.errors + (r.phase ? ' phase=' + r.phase : ''));
    }
    CASES.forEach(cs => { const L = reps[cs.label].filter(r => !r.error), m = k => med(L.map(r => r[k])); rows.push({ vp, thr, scene, level: cs.label, n: L.length, fps: m('fps'), avgMs: m('avgMs'), p95Ms: m('p95Ms'), cpuMsPerFrame: m('cpuMsPerFrame'), drawAvg: m('drawAvg'), canvas: L[0] && L[0].canvas, errors: L.reduce((a, r) => a + r.errors, 0) }); });
  }
  if (OUT) require('fs').writeFileSync(OUT, JSON.stringify(rows, null, 1));
  if (MD) { const f = (r, k, d) => r && r[k] != null ? r[k].toFixed(d) : 'n/a'; console.log('\n| viewport | cpu | scene | ' + LEVELS.join(' | ') + ' |\n|---|---|---|' + LEVELS.map(() => '---').join('|') + '|'); for (const vp of VPS) for (const thr of THR) for (const scene of SCENES) console.log('| ' + vp + ' | x' + thr + ' | ' + scene + ' | ' + LEVELS.map(l => { const r = rows.find(x => x.vp === vp && x.thr === thr && x.scene === scene && x.level === l); return r && r.fps ? f(r, 'fps', 0) + ' fps, ' + f(r, 'avgMs', 0) + '/' + f(r, 'p95Ms', 0) + ' ms, cpu ' + f(r, 'cpuMsPerFrame', 1) : 'n/a'; }).join(' | ') + ' |'); }
  await browser.close();
})();
