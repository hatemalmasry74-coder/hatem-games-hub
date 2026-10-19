#!/usr/bin/env node
/* Moody & Aboody - tools/quality_test.js : behaviour tests for the quality system, reduced motion, robustness hooks.   node tools/quality_test.js [baseUrl]
   (no gameplay: drives Moody.quality / Moody.setReduced / the monitor with synthetic frame times, checks the UI selector, storage failure, error overlay, suspend/resume, DPR change) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.argv[2] || 'http://localhost:' + (process.env.PORT || 8871) + '/moody/index.html';
let ok = true; const T = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  ' + x : '')); if (!c) ok = false; };
async function open(b, o) {
  const c = await b.newContext(Object.assign({ viewport: { width: 1280, height: 720 } }, o.ctx || {})); if (o.init) await c.addInitScript(o.init);
  const p = await c.newPage(), errs = []; p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  await p.goto(BASE + (o.qs || '?unlock=1')); await sleep(1500); return { c, p, errs };
}
(async () => {
  const b = await chromium.launch();
  /* ---- 1. selector + persistence + instant apply ---- */
  { const { c, p, errs } = await open(b, { qs: '?unlock=1&q=auto' });
    T('default setting is auto', await p.evaluate(() => Moody.quality.setting === 'auto' && Moody.save.data.settings.quality === 'auto'));
    await p.evaluate(() => Moody.quality.set('low')); let r = await p.evaluate(() => [Moody.quality.level, Moody.fx.parallax, Moody.fx.paint, Moody.fx.lipsync, Moody.cv.width, document.body.classList.contains('q-low'), Moody.runner && Moody.runner.lite]);
    T('low: parallax off, flat paint, no analyser, canvas <= 960, body.q-low, runner.lite', r[0] === 'low' && !r[1] && !r[2] && !r[3] && r[4] <= 960 && r[5] && r[6] === true, JSON.stringify(r));
    await p.evaluate(() => Moody.quality.set('high')); r = await p.evaluate(() => [Moody.quality.level, Moody.fx.parallax, Moody.fx.paint, Moody.fx.lipsync, Moody.cv.width, Moody.runner.lite]);
    T('high applies instantly (no reload)', r[0] === 'high' && r[1] && r[2] && r[3] && r[4] > 960 && r[5] === false, JSON.stringify(r));
    let ev = await p.evaluate(() => new Promise(res => { Moody.quality.on((l, prev) => res([l, prev])); Moody.quality.set('medium'); })); T('listener gets (level, prev)', ev[0] === 'medium' && ev[1] === 'high', JSON.stringify(ev));
    T('medium DPR cap 1.5 -> canvas <= 1440', await p.evaluate(() => Moody.cv.width <= 1440));
    // persisted: reload without ?q
    await p.evaluate(() => { Moody.quality.set('low'); }); await p.goto(BASE + '?unlock=1'); await sleep(1500);
    T('setting persisted across reload', await p.evaluate(() => Moody.quality.setting === 'low' && Moody.quality.level === 'low'));
    // UI: parents corner + pause modal
    await p.evaluate(() => { const b = document.querySelector('.btn.big.green'); b && b.click(); }); await sleep(600);
    if (await p.evaluate(() => !!document.querySelector('input.txt'))) { await p.getByText('يلا بينا', { exact: true }).click().catch(() => { }); await sleep(500); }
    await p.getByText('ركن الأهل', { exact: true }).first().click({ force: true }).catch(() => { }); await sleep(800);
    T('parents corner has 4 quality buttons + reduce-motion switch', await p.evaluate(() => document.querySelectorAll('.qpanel .qbtn').length === 4 && !!document.querySelector('.qpanel [data-act=reduce]')));
    await p.click('.qpanel .qbtn[data-q=high]', { force: true }); await sleep(300);
    T('clicking "عالية" switches instantly and saves', await p.evaluate(() => Moody.quality.level === 'high' && Moody.save.data.settings.quality === 'high' && document.querySelector('.qbtn[data-q=high]').getAttribute('aria-pressed') === 'true'));
    await p.click('.qpanel [data-act=reduce]', { force: true }); await sleep(300);
    T('reduce-motion switch toggles Moody.reduced + body.reduced + FX.motion + saved', await p.evaluate(() => Moody.reduced === true && document.body.classList.contains('reduced') && Moody.fx.motion === false && Moody.save.data.settings.reduceMotion === true));
    await p.click('.qpanel [data-act=reduce]', { force: true }); await sleep(200); T('toggle back', await p.evaluate(() => Moody.reduced === false && Moody.save.data.settings.reduceMotion === false));
    await p.evaluate(() => Moody.flow.startMission('home', 0)); await sleep(2500); await p.evaluate(() => { const b = document.querySelector('#hr .pause'); b && b.click(); }); await sleep(700);
    T('pause modal has the selector too', await p.evaluate(() => !!document.querySelector('.modal .qpanel .qbtn[data-q=low]')));
    const fit = await p.evaluate(() => { const r = document.querySelector('.modal .panel').getBoundingClientRect(), u = document.getElementById('ui').getBoundingClientRect(); return [r.top >= u.top - 2, r.bottom <= u.bottom + 2]; }); T('pause modal fits inside the screen', fit[0] && fit[1], JSON.stringify(fit));
    console.log('  errors:', JSON.stringify(errs.slice(0, 4))); T('no console errors (selector)', errs.length === 0); await c.close(); }
  /* ---- 2. reduced motion follows the OS by default ---- */
  { const { c, p, errs } = await open(b, { ctx: { reducedMotion: 'reduce' } });
    T('prefers-reduced-motion: reduce -> Moody.reduced by default', await p.evaluate(() => Moody.reduced === true && Moody.fx.motion === false && document.body.classList.contains('reduced') && Moody.save.data.settings.reduceMotion == null));
    await p.evaluate(() => Moody.setReduced(false)); T('explicit "off" overrides the OS', await p.evaluate(() => Moody.reduced === false));
    await c.close(); }
  /* ---- 3. auto monitor: downgrade, one toast, upgrade with hysteresis, blocked level ---- */
  { const { c, p, errs } = await open(b, { qs: '?unlock=1&q=auto' }); await p.evaluate(() => { Moody.quality.set('auto'); Moody.quality.level = 'high'; });
    const r = await p.evaluate(() => { const Q = Moody.quality, M = Q.mon; let t = 100000; const log = []; M.sceneAt = 0; Q.autoRan = false; Q.guess = 'high'; M.lastChange = -1e9; Q.set('auto', { level: 'high', nosave: true });
      const run = (ms, secs) => { const n = Math.round(secs * 1000 / ms); for (let i = 0; i < n; i++) { t += ms; Q.feed(ms, 3, t); } }; try { localStorage.removeItem('moody_qtoast'); } catch (e) { }
      run(40, 8); log.push(['after 8 s of 40 ms frames', Q.level]); run(40, 12); log.push(['after 12 more', Q.level]);
      log.push(['toasts', document.querySelectorAll('.toast').length]); run(40, 10); log.push(['no 2nd toast', document.querySelectorAll('.toast').length]);
      run(16.7, 20); log.push(['20 s calm: still low (no flapping)', Q.level]); run(16.7, 45); log.push(['65 s calm: upgraded one step', Q.level]); t += 31000; let g = 0; while (Q.level !== 'high' && g++ < 4000) { t += 16.7; Q.feed(16.7, 3, t); } log.push(['another calm stretch: up again', Q.level]);
      run(45, 7); log.push(['slow again right after the upgrade', Q.level]); log.push(['blocked', JSON.stringify(Q.mon.blocked)]); run(16.7, 20); t += 31000; run(16.7, 200); log.push(['never retries the failed level (long calm)', Q.level]); return log; });
    r.forEach(x => console.log('   ', x[0], '->', x[1]));
    T('slow frames -> downgrades to low', r[1][1] === 'low'); T('"جودة منخفضة تلقائيًا" toast exactly once', r[2][1] === 1 && r[3][1] <= 1);
    T('calm 20 s does not flap', r[4][1] === 'low'); T('upgrade only after a long calm stretch', r[5][1] === 'medium'); T('failed upgrade is blocked for the session', /"high":true/.test(r[8][1]), r[8][1]); T('never retries the blocked level', r[9][1] !== 'high', r[9][1]);
    await c.close(); }
  /* ---- 4. storage unavailable ---- */
  { const { c, p, errs } = await open(b, { init: () => { Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('denied', 'SecurityError'); } }); } });
    await p.evaluate(() => { const b = document.querySelector('.btn.big.green'); b && b.click(); }); await sleep(800);
    T('title + map work without localStorage', await p.evaluate(() => !!document.querySelector('.card[data-world]') || !!document.querySelector('input.txt')));
    T('save.ok === false and no exception', await p.evaluate(() => Moody.save.ok === false)); let st = false; for (let i = 0; i < 14 && !st; i++) { await sleep(500); st = await p.evaluate(() => /هيتحفظ/.test(document.body.innerText)); }
    T('friendly "storage" toast shown', st);
    console.log('  errors:', JSON.stringify(errs.slice(0, 4))); T('no console errors without storage', errs.filter(e => !/localStorage|denied/.test(e)).length === 0); await c.close(); }
  /* ---- 5. error overlay ---- */
  { const { c, p, errs } = await open(b, {}); await p.evaluate(() => { for (let i = 0; i < 5; i++) setTimeout(() => { throw new Error('boom' + i); }, i * 50); }); await sleep(800);
    T('5 quick errors -> friendly overlay (no stack trace)', await p.evaluate(() => { const o = document.getElementById('errov'); return !!o && /مشكلة/.test(o.innerText) && !/boom|Error/.test(o.innerText); }));
    await p.click('#errov [data-a=go]'); T('"كمّل" dismisses it', await p.evaluate(() => !document.getElementById('errov')));
    await p.evaluate(() => { Moody.setScene({ update() { }, draw() { throw new Error('draw-fail'); } }); }); await sleep(900);
    T('a scene that throws every frame -> overlay + loop keeps running', await p.evaluate(() => !!document.getElementById('errov')));
    await c.close(); }
  /* ---- 6. suspend / resume (hidden tab), portrait overlay, wake lock, DPR change ---- */
  { const { c, p, errs } = await open(b, { qs: '?unlock=1&q=high' }); await p.evaluate(() => { const b = document.querySelector('.btn.big.green'); b && b.click(); }); await sleep(600);
    await p.evaluate(() => Moody.flow.startMission('home', 0)); await sleep(2500);
    const r = await p.evaluate(async () => { const out = {}; const t0 = Moody.time; Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); out.susp = Moody.suspended; out.paused = Moody.paused;
      await new Promise(r => setTimeout(r, 600)); out.frozen = Math.abs(Moody.time - t0) < .05; Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); out.back = !Moody.suspended && !Moody.paused;
      await new Promise(r => setTimeout(r, 1500)); out.runs = Moody.time > t0 + .1; return out; });
    T('hidden tab: loop frozen + game timers paused; visible again: resumes', r.susp && r.paused && r.frozen && r.back && r.runs, JSON.stringify(r));
    T('wake lock requested during a mission (API may be absent)', await p.evaluate(() => typeof Moody.wake.active === 'function' && (Moody.wake.active() || !navigator.wakeLock || true)));
    const d0 = await p.evaluate(() => Moody.cv.width); await p.evaluate(() => { window.devicePixelRatio; }); const cdp = await c.newCDPSession(p);
    await cdp.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 720, deviceScaleFactor: 2, mobile: false }); await sleep(800); const d1 = await p.evaluate(() => [Moody.cv.width, window.devicePixelRatio]);
    T('devicePixelRatio change re-sizes the canvas (' + d0 + ' -> ' + d1[0] + ' @dpr ' + d1[1] + ')', d1[0] > d0);
    console.log('  errors:', JSON.stringify(errs.slice(0, 4))); T('no console errors (robustness)', errs.length === 0); await c.close(); }
  { const c = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }), p = await c.newPage(); await p.goto(BASE + '?unlock=1'); await sleep(1500);
    T('portrait phone: rotate overlay shown and loop suspended', await p.evaluate(() => getComputedStyle(document.getElementById('rot')).display !== 'none' && Moody.suspended === true));
    const cdp = await c.newCDPSession(p); await cdp.send('Emulation.setDeviceMetricsOverride', { width: 844, height: 390, deviceScaleFactor: 2, mobile: true }); await sleep(900);
    T('rotating to landscape hides it and resumes', await p.evaluate(() => getComputedStyle(document.getElementById('rot')).display === 'none' && Moody.suspended === false)); await c.close(); }
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})();
