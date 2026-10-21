#!/usr/bin/env node
/* End-to-end test of the DIRECT edition (Playwright).
     node tools/direct/direct_test.js <built-dir> <private-codes-file> [shotsdir]
   Serves <built-dir> under /family/ (symlink) on a free port and checks: PWA scope, noindex, wizard first, 1 free mission per world, locked mission -> gate -> code sheet,
   wrong code, right code, persistence, time-simulated expiry (locks, progress kept), reuse rejected, renewal adds time (also on top of remaining time). */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os'), cp = require('child_process'), net = require('net');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js')); const { driveWizard } = require('../play/wizard_drive');
const dist = path.resolve(process.argv[2] || ''), codesFile = process.argv[3], shots = process.argv[4];
if (!fs.existsSync(path.join(dist, 'index.html')) || !codesFile) { console.log('usage: node direct_test.js <built-dir> <codes-file> [shotsdir]'); process.exit(1); }
if (shots) fs.mkdirSync(shots, { recursive: true });
const codes = fs.readFileSync(codesFile, 'utf8').split('\n').filter(l => /^FM-/.test(l)).map(l => { const [c, d] = l.split('\t'); return { c, d: +d }; });
const c30 = codes.filter(x => x.d === 30), c90 = codes.filter(x => x.d === 90), c365 = codes.filter(x => x.d === 365);
const DAY = 864e5;
const freePort = () => new Promise(r => { const s = net.createServer(); s.listen(0, () => { const p = s.address().port; s.close(() => r(p)); }); });
(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'famroot-')); fs.symlinkSync(dist, path.join(root, 'family'));
  const port = await freePort(), srv = cp.spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], { cwd: root, stdio: 'ignore' }); await sleep(900);
  const url = 'http://127.0.0.1:' + port + '/family/index.html';
  let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
  const init = "(function(){var o=Date.now;Date.now=function(){var v=0;try{v=+sessionStorage.getItem('__off')||0}catch(e){}return o()+v}})();";
  const env = await launch({ kind: 'desk', url, init }), p = env.p, bot = env.bot;
  const shot = async n => { if (shots) await p.screenshot({ path: path.join(shots, 'direct_' + n + '.png') }); };
  const off = d => p.evaluate(v => { sessionStorage.setItem('__off', String(v)); }, d * DAY);
  const st = () => p.evaluate(() => { const s = Moody.ent.status(); return { prem: s.premium, state: s.state, exp: s.expiry, left: Moody.billing.providers.codes.daysLeft() }; });
  try {
    /* --- static facts --- */
    const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8');
    ok(/name="robots" content="noindex/.test(html), 'noindex meta present');
    ok(!/\.\.\//.test(html) && !/href="\/|src="\//.test(html), 'index.html has no ../ and no root-absolute paths');
    const man = JSON.parse(fs.readFileSync(path.join(dist, 'manifest.json'), 'utf8'));
    ok(man.name === 'مغامرات العيلة' && man.scope === './' && man.start_url.startsWith('./') && man.icons.every(i => !/^\//.test(i.src)), 'manifest: name «مغامرات العيلة», relative scope/start_url/icons');
    ok(['icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'].every(f => fs.existsSync(path.join(dist, 'icons', f))), 'own icons exist');
    ok(await p.evaluate(() => Moody.config.direct === true && Moody.billing.name === 'codes'), 'provider codes active');
    ok(await p.evaluate(() => !Moody.billing.providers.mock && !Moody.billing.providers.capacitor && !Moody.billing.providers.digitalgoods), 'no store providers shipped');
    /* --- wizard --- */
    ok(await p.evaluate(() => !!document.querySelector('.fw') && !document.querySelector('.card[data-world]')), 'FIRST screen is the family wizard');
    await shot('00_wizard');
    const cfg = await p.evaluate(() => Moody.family.preset('two')); await driveWizard(p, bot, cfg, { shots: null });
    await bot.startGame(); await p.waitForSelector('.card[data-world]', { timeout: 30000 }); await sleep(600); await shot('01_map');
    await sleep(1500);
    const sw = await p.evaluate(async () => { try { const r = await navigator.serviceWorker.getRegistration(); return r ? r.scope : ''; } catch (e) { return 'err'; } });
    ok(/\/family\/$/.test(sw), 'service worker scope is the sub-folder: ' + sw);
    const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
    const [w0, ms] = worlds[0], m1 = ms[0], m2 = ms[1];
    ok(await p.evaluate(([w, a, b]) => Moody.ent.canPlay(w, a) && !Moody.ent.canPlay(w, b), [w0, m1, m2]), 'free: first mission playable, second locked (' + w0 + ')');
    let allFree = true; for (const [w, mm] of worlds) { const r = await p.evaluate(([w, mm]) => mm.map(m => Moody.ent.canPlay(w, m)), [w, mm]); if (!(r[0] && r.slice(1).every(x => !x))) allFree = false; }
    ok(allFree, 'every world (' + worlds.length + '): exactly one free mission');
    /* --- first mission starts --- */
    await bot.tapSel('.card[data-world="' + w0 + '"]'); await p.waitForSelector('.mcard[data-mission]'); await sleep(500); await shot('02_missions');
    await bot.tapSel('.mcard[data-mission="' + m1 + '"]'); await sleep(2500);
    ok(await p.evaluate(() => { const h = document.getElementById('hud'); return !!h && h.style.display !== 'none'; }), 'first mission starts (free)');
    await shot('03_mission1'); await bot.backToMap(); await sleep(500);
    /* --- locked mission -> gate -> code sheet --- */
    const passGate = async () => {
      const hb = await p.locator('.pw-hold').boundingBox(); await p.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await p.mouse.down(); await sleep(3400); await p.mouse.up();
      await p.waitForSelector('[data-gate=q]', { timeout: 5000 });
      const q = await p.evaluate(() => document.querySelector('[data-gate=q]').textContent), d = s => +s.replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)), m = q.match(/([٠-٩]+) × ([٠-٩]+) \+ ([٠-٩]+)/);
      const ans = String(d(m[1]) * d(m[2]) + d(m[3])); for (const c of ans) await bot.tapSel('[data-key="' + c + '"]'); await bot.tapSel('[data-key=ok]'); await p.waitForSelector('[data-paywall=sheet]', { timeout: 8000 });
    };
    await bot.tapSel('.card[data-world="' + w0 + '"]'); await sleep(600); await bot.tapSel('.mcard[data-mission="' + m2 + '"]'); await sleep(400);
    ok(await p.evaluate(() => !!document.querySelector('.pw-modal [data-gate=hold]')) && !(await p.evaluate(() => document.getElementById('hud').style.display !== 'none' && document.getElementById('hud').style.display !== '')), 'locked mission opens the gate, not the mission');
    await passGate(); await sleep(300); await shot('04_paywall');
    const txt = await p.evaluate(() => document.querySelector('[data-paywall=sheet]').innerText);
    ok(/مجانية/.test(txt) && /كود/.test(txt) && /49 جنيه/.test(txt), 'sheet text: free first mission + enter the code + price text');
    ok(!/Google|جوجل|اشتراك مودي|متجر/.test(txt), 'sheet has no store wording');
    ok(await p.evaluate(() => !!document.querySelector('[data-act=contact]')), 'button «اطلب كودك» present');
    const hrefs = await p.evaluate(() => { let u = null; window.open = x => { u = x; return null; }; document.querySelector('[data-act=contact]').click(); return u; });
    ok(/^https:\/\/wa\.me\/201206354853\?text=/.test(hrefs || ''), 'اطلب كودك opens ' + hrefs);
    const type = async v => { const i = p.locator('input[data-code]'); await i.fill(''); await i.type(v, { delay: 5 }); };
    const msg = () => p.evaluate(() => document.querySelector('[data-msg]') ? document.querySelector('[data-msg]').textContent : '');
    /* wrong code */
    await type('FM-ZZZZ-ZZZZ-ZZZZ'); await bot.tapSel('[data-act=activate]'); await sleep(500);
    ok(/مش صحيح/.test(await msg()) && !(await st()).prem, 'wrong code rejected, still locked: ' + (await msg())); await shot('05_wrong');
    /* right code */
    await type(c30[0].c.toLowerCase().replace(/-/g, ' ')); await bot.tapSel('[data-act=activate]'); await p.waitForSelector('[data-act=playnow]', { timeout: 6000 }); await shot('06_unlocked');
    let s = await st(); ok(s.prem && s.state === 'ACTIVE' && s.left === 30, 'right code (typed lowercase with spaces) unlocks 30 days: ' + JSON.stringify(s));
    await bot.tapSel('[data-act=playnow]'); await sleep(500);
    ok(await p.evaluate(([w, m]) => Moody.ent.canPlay(w, m), [w0, m2]), 'second mission playable now');
    await bot.tapSel('.mcard[data-mission="' + m2 + '"]'); await sleep(2500); ok(await p.evaluate(() => document.getElementById('hud').style.display !== 'none'), 'second mission starts'); await shot('07_mission2'); await bot.backToMap(); await sleep(400);
    /* record some progress so we can prove it is kept */
    await p.evaluate(([w, m]) => { Moody.save.data.progress[w + '/' + m] = { done: true, stars: 3 }; Moody.save.commit(); }, [w0, m1]);
    const expA = (await st()).exp;
    /* persistence */
    await p.reload(); await sleep(1800);
    s = await st(); ok(s.prem && s.exp === expA && await p.evaluate(() => Moody.family.done() && !document.querySelector('.fw')), 'reload: still unlocked, same expiry, no wizard');
    /* reuse */
    await p.evaluate(() => { Moody.paywall.open({}); }); await sleep(300); await passGate(); await sleep(300); await shot('08_active_sheet');
    await type(c30[0].c); await bot.tapSel('[data-act=activate]'); await sleep(500);
    ok(/اتستخدم/.test(await msg()) && (await st()).exp === expA, 'same code again on the same device rejected, time unchanged: ' + (await msg())); await shot('09_reuse');
    /* renewal on top of remaining time */
    await type(c30[1].c); await bot.tapSel('[data-act=activate]'); await p.waitForSelector('[data-act=playnow]', { timeout: 6000 });
    s = await st(); ok(Math.abs(s.exp - (expA + 30 * DAY)) < 5000 && s.left === 60, 'renewal ADDS 30 days on top of the remaining time (left=' + s.left + ')'); await bot.tapSel('[data-act=playnow]'); await sleep(300);
    /* expiry by time */
    await off(61); await p.evaluate(() => Moody.ent.refresh()); await sleep(600);
    s = await st(); ok(!s.prem && s.state === 'EXPIRED', 'after +61 days: expired -> ' + JSON.stringify(s));
    await p.reload(); await sleep(1800);
    s = await st(); ok(!s.prem && s.state === 'EXPIRED', 'expired state survives reload');
    ok(await p.evaluate(([w, a, b]) => Moody.ent.canPlay(w, a) && !Moody.ent.canPlay(w, b), [w0, m1, m2]), 'expired: first mission still free, second locked again');
    ok(await p.evaluate(([w, m]) => { const q = Moody.save.prog(w, m); return !!(q && q.done && q.stars === 3) && Moody.family.done(); }, [w0, m1]), 'progress + family kept after expiry');
    await bot.startGame(); await p.waitForSelector('.card[data-world]', { timeout: 30000 }); await sleep(500); await shot('09b_map_expired');
    await bot.tapSel('.card[data-world="' + w0 + '"]'); await sleep(600); await shot('09c_missions_expired'); await bot.tapSel('.mcard[data-mission="' + m2 + '"]'); await sleep(400); await passGate(); await sleep(300); await shot('10_expired_sheet');
    ok(/خلصت/.test(await p.evaluate(() => document.querySelector('[data-paywall=sheet]').innerText)), 'expired sheet explains it (progress kept)');
    /* renewal after expiry: starts from NOW */
    await type(c90[0].c); await bot.tapSel('[data-act=activate]'); await p.waitForSelector('[data-act=playnow]', { timeout: 6000 });
    s = await st(); ok(s.prem && s.left === 90, 'new code after expiry: 90 days from now (left=' + s.left + ')'); await bot.tapSel('[data-act=playnow]'); await sleep(300);
    /* parents corner */
    await bot.backToMap(); await sleep(300);
    const par = await p.evaluate(() => { const b = Moody.ent.parentSection(); document.body.append(b); const t = b.innerText, c = !!b.querySelector('[data-act=contact]'); b.remove(); return { t, c }; });
    ok(par.c && /لحد/.test(par.t), 'parents corner section: status + contact button: ' + par.t.replace(/\n/g, ' | ').slice(0, 90));
    /* tampering */
    await p.evaluate(() => { const r = JSON.parse(localStorage.getItem('family_codes_v1')); r.exp += 1e10; localStorage.setItem('family_codes_v1', JSON.stringify(r)); }); await p.reload(); await sleep(1800);
    ok(!(await st()).prem || (await st()).left <= 90, 'hand-edited code record is not honoured');
    const miss = env.errs.filter(e => !/favicon/.test(e)); console.log('console', JSON.stringify(miss.slice(0, 6))); if (miss.length) fails++;
  } catch (e) { console.log('FAIL exception', e && e.stack || e); fails++; await shot('zz_error'); }
  await env.b.close(); srv.kill(); console.log(fails ? 'RESULT: ' + fails + ' FAILED' : 'RESULT: ALL PASSED'); process.exit(fails ? 1 : 0);
})();
