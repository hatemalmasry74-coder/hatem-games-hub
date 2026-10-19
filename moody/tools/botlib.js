/* Moody & Aboody - tools/botlib.js : a scripted "kid" that plays every mission through real mouse / touch input.
   Used by collect_voice.js and by the regression tests.  Requires Playwright (node module at /opt/node-tools/node_modules/playwright).
   Kits publish their targets in Moody.scene.dbg (see DEV.md "Testing recipe"). */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const VPS = { desk: { viewport: { width: 1280, height: 720 } }, phone: { viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 }, ipad: { viewport: { width: 1180, height: 820 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 } };

async function launch(o) {
  o = o || {}; const kind = o.kind || 'desk', b = o.browser || await chromium.launch();
  const ctx = await b.newContext(Object.assign({}, VPS[kind], o.ctx || {}));
  if (o.init) await ctx.addInitScript(o.init);
  const p = await ctx.newPage(), errs = [];
  p.on('console', m => { if (['error', 'warning'].includes(m.type())) errs.push(m.type() + ': ' + m.text()); });
  p.on('pageerror', e => errs.push('PAGEERR ' + e.message + ' ' + (e.stack || '').slice(0, 300)));
  p.on('requestfailed', r => errs.push('REQFAIL ' + r.url()));
  p.on('response', r => { if (r.status() >= 400) errs.push('HTTP' + r.status() + ' ' + r.url()); });
  await p.goto(o.url); await sleep(1200);
  const bot = makeBot(p, ctx, { touch: !!VPS[kind].hasTouch, shots: o.shots });
  return { b, ctx, p, errs, bot, kind };
}

function makeBot(p, ctx, o) {
  o = o || {}; const touch = !!o.touch; let cdp = null;
  async function cdpS() { if (!cdp) cdp = await ctx.newCDPSession(p); return cdp; }
  async function toPage(x, y) { return p.evaluate(([x, y]) => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left + x * r.width / 960, r.top + y * r.height / 540]; }, [x, y]); }
  async function tapPage(px, py) { if (touch) await p.touchscreen.tap(px, py); else { await p.mouse.move(px, py); await p.mouse.down(); await p.mouse.up(); } }
  async function tapLogical(x, y) { const [px, py] = await toPage(x, y); await tapPage(px, py); }
  async function dragLogical(x0, y0, x1, y1, hold) {
    const [a, b] = await toPage(x0, y0), [c, d] = await toPage(x1, y1);
    if (touch) {
      const s = await cdpS(); const tp = (t, x, y) => s.send('Input.dispatchTouchEvent', { type: t, touchPoints: t === 'touchEnd' ? [] : [{ x, y, id: 1 }] });
      await tp('touchStart', a, b); for (let i = 1; i <= 8; i++) { await tp('touchMove', a + (c - a) * i / 8, b + (d - b) * i / 8); await sleep(25); }
      if (hold) { const t0 = Date.now(); while (Date.now() - t0 < hold) { await tp('touchMove', c + (Math.random() * 4 - 2), d + (Math.random() * 4 - 2)); await sleep(40); } }
      await tp('touchEnd', c, d);
    } else {
      await p.mouse.move(a, b); await p.mouse.down(); for (let i = 1; i <= 8; i++) { await p.mouse.move(a + (c - a) * i / 8, b + (d - b) * i / 8); await sleep(25); }
      if (hold) { const t0 = Date.now(); while (Date.now() - t0 < hold) { await p.mouse.move(c + (Math.random() * 4 - 2), d + (Math.random() * 4 - 2)); await sleep(40); } }
      await p.mouse.up();
    }
  }
  async function tapSel(sel, nth) {
    const loc = p.locator(sel).nth(nth || 0);
    try { if (touch) await loc.tap({ timeout: 2000, force: true }); else await loc.click({ timeout: 2000, force: true }); return true; } catch (e) { return false; }
  }
  async function tapText(t) { const l = p.getByText(t, { exact: true }); if (await l.count()) { try { if (touch) await l.first().tap({ timeout: 2000 }); else await l.first().click({ timeout: 2000 }); return true; } catch (e) { return false; } } return false; }
  async function state() {
    return p.evaluate(() => {
      const M = window.Moody, q = s => document.querySelector(s), qa = s => Array.from(document.querySelectorAll(s));
      const hud = document.getElementById('hud'), inMission = hud && hud.style.display !== 'none', st = M.scene && M.scene.dbg;
      return {
        inMission, dlg: !!q('#dlg'), dlgTyping: q('#dlg .nx') ? q('#dlg .nx').style.display === 'none' : false,
        qz: !!q('#qz'), qzText: q('#qz .qt') ? q('#qz .qt').textContent.slice(0, 60) : '', choice: qa('.choicecard:not(.used)').length, seq: qa('.seqcard:not(.used)').map(e => +e.dataset.i), mem: qa('.cardmem').length,
        pairs: qa('.mch').length, cnt: !!q('.pkcnt'), ritual: qa('#over .btn.big.pink:not(.pkcnt)').length, skip: !!q('#skip'), dbg: st ? JSON.parse(JSON.stringify(st)) : null, active: M.scene && M.scene.active,
        result: !inMission && /حكمة اليوم/.test(document.body.innerText), cert: !!q('#cert'), celebrate: !inMission && /مبروك!/.test(document.body.innerText),
        fade: (() => { const f = document.getElementById('fadeov'); return f && f.style.opacity === '1'; })(), prompt: q('#prompt .p') ? q('#prompt .p').textContent : ''
      };
    });
  }
  const dbgNow = () => p.evaluate(() => { const d = window.Moody.scene && window.Moody.scene.dbg; return d ? JSON.parse(JSON.stringify(d)) : null; });
  async function shot(path) { try { await p.screenshot({ path }); } catch (e) { } }
  const heroBtn = h => '#sw .h[data-hero="' + h + '"]';

  async function play(opts) {
    opts = opts || {}; const t0 = Date.now(), seen = new Set(), kitLog = []; let lastSig = '', same = 0; const cnt = {};
    const wrongFirst = opts.wrongFirst; let s = null, rbH = null;
    while (Date.now() - t0 < (opts.timeout || 300000)) {
      s = await state();
      if (s.result || s.celebrate) return { ok: true, secs: (Date.now() - t0) / 1000, kits: kitLog };
      if (s.fade) { await sleep(120); continue; }
      const sig = s.dlg ? 'dlg' : s.qz ? 'qz' : s.choice ? 'choice' : s.seq.length ? 'seq' : s.mem ? 'mem' : s.pairs ? 'pairs' : s.cnt ? 'cnt' : s.ritual ? 'ritual' : s.cert ? 'cert' : (s.dbg ? s.dbg.kit : 'idle');
      if (sig !== 'dlg' && sig !== 'idle' && !seen.has(sig + s.prompt)) { seen.add(sig + s.prompt); kitLog.push(sig); if (opts.onKit) await opts.onKit(sig, s); }
      if (s.cert) { if (await tapSel('#cert .go')) await sleep(500); continue; }
      if (s.dlg) { await tapSel('#dlg'); await sleep(s.dlgTyping ? 60 : 120); continue; }
      if (s.qz) {
        if (wrongFirst && !seen.has('w' + s.qzText)) { seen.add('w' + s.qzText); await tapSel('.opt[data-correct="0"]:not(.gone)'); await sleep(250); }
        if (opts.speakers && !seen.has('sp' + s.qzText)) { seen.add('sp' + s.qzText); await tapSel('#qz .spk'); await sleep(150); }
        await tapSel('.opt[data-correct="1"]'); await sleep(900); continue;
      }
      if (s.choice) { if (wrongFirst && !seen.has('c' + s.choice + kitLog.length)) { seen.add('c' + s.choice + kitLog.length); if (await tapSel('.choicecard[data-good="0"]:not(.used)')) { await sleep(2500); continue; } } await tapSel('.choicecard[data-good="1"]:not(.used)'); await sleep(900); continue; }
      if (s.seq.length) { await tapSel('.seqcard[data-i="' + Math.min(...s.seq) + '"]'); await sleep(250); continue; }
      if (s.mem) {
        const arts = await p.evaluate(() => Array.from(document.querySelectorAll('.cardmem')).map((e, i) => [i, e.dataset.art, e.classList.contains('match'), e.classList.contains('back')]));
        const groups = {}; arts.forEach(a => { if (!a[2]) (groups[a[1]] = groups[a[1]] || []).push(a[0]); });
        const k = Object.keys(groups)[0]; if (k && groups[k].length > 1) { await tapSel('.cardmem', groups[k][0]); await sleep(150); await tapSel('.cardmem', groups[k][1]); await sleep(1100); } else await sleep(300); continue;
      }
      if (s.pairs) {
        const info = await p.evaluate(() => Array.from(document.querySelectorAll('.mch')).map((e, i) => [i, e.dataset.k, e.dataset.side, e.classList.contains('ok')]));
        const left = info.find(a => a[2] === 'L' && !a[3]);
        if (left) { const right = info.find(a => a[2] === 'R' && a[1] === left[1]); await tapSel('.mch', left[0]); await sleep(120); await tapSel('.mch', right[0]); await sleep(500); } else await sleep(300); continue;
      }
      if (s.cnt) { await tapSel('.pkcnt'); await sleep(350); continue; }
      if (s.ritual) { await tapSel('#over .btn.big.pink:not(.pkcnt)'); await sleep(1200); continue; }
      const d = s.dbg;
      if (d && d.kit && opts.custom && opts.custom[d.kit]) { await opts.custom[d.kit]({ d, s, tapLogical, dragLogical, tapSel, sleep, p }); continue; }
      if (d && d.kit === 'runner3d') { rbH = rbH || require('./runner_bot.js').runnerHandler({ p, ctx, kind: touch ? 'phone' : 'desk' }, { wrongFirst }); await rbH({ d, s, tapLogical, dragLogical, tapSel, sleep, p }); continue; }
      const needHero = async (h, need) => { const hh = h || need; if (hh && s.active !== hh && await p.evaluate(x => !!document.querySelector(x), heroBtn(hh))) { await tapSel(heroBtn(hh)); await sleep(300); } };
      if (d && d.kit === 'dragdrop') {
        const it = d.items[0]; if (!it) { await sleep(300); continue; }
        const ak = 'dd' + it.id; cnt[ak] = (cnt[ak] || 0) + 1; if (cnt[ak] > 7) { if (s.skip) { await tapSel('#skip'); await sleep(600); continue; } if (cnt[ak] > 12) return { ok: false, stuckItem: it.id, kits: kitLog }; }
        await needHero(it.hero, it.needs);
        let tx = it.tx, ty = it.ty; if (tx == null) { const k = (cnt.any = (cnt.any || 0) + 1); tx = k % 2 ? 300 : 660; ty = 360; }
        await dragLogical(it.x, it.y, tx, ty); await sleep(900); continue;
      }
      if (d && d.kit === 'hidden') { const sp = d.spots[0]; if (!sp) { await sleep(300); continue; } await needHero(sp.hero, sp.needs); await tapLogical(sp.x, sp.y); await sleep(1800); continue; }
      if (d && d.kit === 'pkswing') { await tapLogical(480, 300); await sleep(520); continue; }
      if (d && d.kit === 'pkkick') { if (d.busy) { await sleep(250); continue; } const z = d.zones[0]; await tapLogical(z.x, z.y); await sleep(700); continue; }
      if (d && d.kit === 'pkwater') { const pt = d.pots.find(x => !x.done); if (!pt) { await sleep(300); continue; } await dragLogical(pt.x + 140, pt.y - 20, pt.x, pt.y, 1750); await sleep(300); continue; }
      if (d && d.kit === 'grow') { if (d.water < 52) await tapSel('.bar2 .btn[data-act="w"]'); else if (d.light < 52) await tapSel('.bar2 .btn[data-act="l"]'); await sleep(150); continue; }
      if (d && d.kit === 'magnet') { if (d.targets.length) { const tg = d.targets[0]; await dragLogical(d.mx, d.my, tg.x, tg.y - 10); await sleep(500); } else await sleep(200); continue; }
      if (d && d.kit === 'tiptoe') { for (let i = 0; i < 40; i++) { const dd = await dbgNow(); if (!dd || dd.kit !== 'tiptoe') break; if (Math.abs(dd.v - dd.zone) < dd.zw * .3) { await tapLogical(480, 300); await sleep(500); break; } await sleep(25); } continue; }
      if (d && d.kit === 'cheer') { if (d.ready.length) { await tapLogical(d.ready[0].x, d.ready[0].y); await sleep(250); } else await sleep(20); continue; }
      if (d && d.kit === 'crossing') { if (!d.looked.l) { await tapSel('.bar2 .btn[data-act="l"]'); await sleep(300); continue; } if (!d.looked.r) { await tapSel('.bar2 .btn[data-act="r"]'); await sleep(300); continue; } if (d.green && d.clear) { await tapSel('.bar2 .btn[data-act="go"]'); await sleep(600); } else await sleep(80); continue; }
      if (d && d.kit === 'mk_maze') { if (!d.moving) await tapLogical(d.goal.x, d.goal.y); await sleep(300); continue; }
      if (d && d.kit === 'mk_money') { const t = d.target; if (d.sum > t) { await tapSel('button[data-rm]'); await sleep(100); continue; } const rem = t - d.sum; if (rem === 0) { await tapSel('[data-act="pay"]'); await sleep(900); continue; } const ds = d.denoms.slice().sort((a, b) => b - a); for (const x of ds) { if (rem >= x) { await tapSel('button[data-d="' + x + '"]'); await sleep(120); break; } } continue; }
      if (d && d.kit === 'st_phone') { const vis = await p.evaluate(() => { const k = document.querySelector('[data-key]'); return k && k.parentElement.style.display !== 'none'; }); if (!vis) { await tapSel('[data-act="ready"]'); await sleep(400); continue; } for (const ch of String(d.digits)) { await tapSel('[data-key="' + ch + '"]'); await sleep(90); } await sleep(1500); continue; }
      if (d && d.kit === 'st_cross') {
        if (!d.want) { await tapSel('[data-act="btn"]'); await sleep(300); continue; } if (!d.hand) { await tapSel('[data-act="hand"]'); await sleep(300); continue; }
        if (d.phase === 'ped') { if (!d.looked.l) { await tapSel('[data-act="lookL"]'); await sleep(250); continue; } if (!d.looked.r) { await tapSel('[data-act="lookR"]'); await sleep(250); continue; } if (!d.late && !d.walking) { await tapSel('[data-act="walk"]'); await sleep(500); continue; } }
        await sleep(300); continue;
      }
      if (d && d.kit === 'runner') { for (let i = 0; i < 3; i++) { await tapLogical(480, 300); await sleep(520); } continue; }
      if (d && d.kit === 'lanes') { for (let i = 0; i < 3; i++) { await tapLogical(290 + i * 190, 400); await sleep(260); } continue; }
      if (d && d.kit === 'measure') { for (let i = 0; i < d.target - d.n; i++) { await tapSel('.bar2 .btn.blue'); await sleep(120); } await tapSel('.bar2 .btn.green'); await sleep(1500); continue; }
      if (d && d.kit === 'scrub') { const sp = d.spots[0]; if (sp) { await dragLogical(sp.x - 30, sp.y, sp.x + 30, sp.y + 5, 500); } else await sleep(200); continue; }
      if (s.skip && sig === lastSig) { same++; if (same > 40) { await tapSel('#skip'); same = 0; } }
      if (sig === lastSig) same++; else same = 0; lastSig = sig;
      if (same > 400) return { ok: false, stuck: sig, secs: (Date.now() - t0) / 1000, kits: kitLog };
      await sleep(150);
    }
    return { ok: false, timeout: true, kits: kitLog, last: s };
  }
  async function startGame() {
    await tapSel('.btn.big.green'); await sleep(500);
    if (await p.evaluate(() => !!document.querySelector('input.txt'))) { await tapText('يلا بينا'); await sleep(500); }
  }
  async function openMission(world, mid) {
    await p.waitForSelector('.card[data-world]', { timeout: 8000 });
    await p.evaluate(w => { const e = document.querySelector('.card[data-world="' + w + '"]'); if (e) e.scrollIntoView({ inline: 'center', block: 'nearest' }); }, world); await sleep(400);
    await tapSel('.card[data-world="' + world + '"]'); await p.waitForSelector('.mcard[data-mission="' + mid + '"]', { timeout: 5000 });
    await tapSel('.mcard[data-mission="' + mid + '"]');
  }
  async function backToMap() {
    for (let i = 0; i < 8; i++) { if (await p.evaluate(() => !!document.querySelector('.card[data-world]'))) return; if (await tapText('القائمة')) { await sleep(500); continue; } if (await tapText('خريطة المغامرات')) { await sleep(500); continue; } if (await tapText('كمّل')) { await sleep(700); continue; } await p.evaluate(() => window.Moody.flow.toMap()); await sleep(500); }
  }
  async function playMission(world, mid, opts) { await openMission(world, mid); await sleep(700); const r = await play(opts); return r; }
  return { play, state, shot, tapSel, tapText, sleep, tapLogical, dragLogical, startGame, openMission, backToMap, playMission, dbgNow };
}
module.exports = { launch, makeBot, VPS, sleep };
