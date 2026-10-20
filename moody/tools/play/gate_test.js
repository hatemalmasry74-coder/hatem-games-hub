#!/usr/bin/env node
/* First-run + monetisation test of a built Play edition (build WITH --test-mock; the release build has no mock store and this test says so).
     node tools/play/gate_test.js <url-of-index.html> <config: two|four|nogm|one> [desk|phone] [shotsdir]
   1. fresh install: the family WIZARD is the first screen (no map / title before it), the wizard is filled from the config (UI only);
   2. afterwards: names saved, ?unlock=1 is ignored, only the FIRST mission of every visible world is playable, every other mission opens the parental gate (not the mission);
   3. try-all: tap every locked mission of every world -> gate shown, no mission started;
   4. test purchase through the real UI (hold 3 s, solve the sum, buy monthly with the mock store; desktop only) or ent.grant on phone, then everything is playable. */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js')); const { driveWizard } = require('./wizard_drive');
const [url, cfgName, kind, shots] = [process.argv[2], process.argv[3] || 'two', process.argv[4] || 'desk', process.argv[5]];
if (!url) { console.log('usage: node tools/play/gate_test.js <url> <config> [desk|phone] [shotsdir]'); process.exit(1); }
if (shots) fs.mkdirSync(shots, { recursive: true });
(async () => {
  const env = await launch({ kind, url }), p = env.p, bot = env.bot; let fails = 0; const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
  const shot = async n => { if (shots) await p.screenshot({ path: path.join(shots, cfgName + '_' + kind + '_' + n + '.png') }); };
  const hasMock = await p.evaluate(() => !!(Moody.billing && Moody.billing.providers && Moody.billing.providers.mock)); ok(hasMock, 'test build: mock store registered (this test needs --test-mock)');
  ok(await p.evaluate(() => Moody.config.edition === 'play'), 'edition is play');
  ok(await p.evaluate(() => !!document.querySelector('.fw') && !document.querySelector('.card[data-world]') && !document.querySelector('.ttl-play')), 'FIRST screen is the family wizard (nothing else before it)');
  const cfg = await p.evaluate(n => Moody.family.preset(n), cfgName);
  await driveWizard(p, bot, cfg, { shots, prefix: cfgName + '_' + kind + '_wiz' });
  const saved = await p.evaluate(() => { const c = Moody.family.cfg(); return { done: Moody.family.done(), k: Moody.family.KIDS.filter(k => c[k].on).map(k => c[k].name), gm: c.nana.on, dad: c.dad.travels }; });
  ok(saved.done && JSON.stringify(saved.k) === JSON.stringify(['moody', 'aboody', 'toota', 'nemo'].filter(k => cfg[k].on).map(k => cfg[k].name)) && saved.gm === cfg.nana.on && saved.dad === cfg.dad.travels, 'wizard result saved: ' + JSON.stringify(saved));
  await shot('title'); await bot.startGame(); await p.waitForSelector('.card[data-world]', { timeout: 30000 }); await sleep(500); await shot('map');
  const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
  console.log('worlds', worlds.map(w => w[0] + ':' + w[1].length).join(' '));
  const gm = cfg.nana.on, dad = cfg.dad.travels; const ids = worlds.map(w => w[0]);
  ok(ids.includes('nana') === gm && ids.includes('gathering') === gm && ids.includes('saudi') === dad, 'worlds match the config (grandmother ' + gm + ', dad travels ' + dad + ')');
  ok(await p.evaluate(() => !Moody.urlUnlock && Moody.ent.canPlay('school', 'm2') === false), '?unlock is off, school/m2 is locked');
  let locked = 0, free = 0, gates = 0;
  for (const [wid, ms] of worlds) {
    await bot.backToMap(); await bot.tapSel('.card[data-world="' + wid + '"]'); await p.waitForSelector('.mcard[data-mission]', { timeout: 8000 }); await sleep(500);
    const st = await p.evaluate(() => Array.from(document.querySelectorAll('.mcard[data-mission]')).map(e => [e.dataset.mission, e.dataset.paid === '1']));
    ok(st.length === ms.length && !st[0][1] && st.slice(1).every(x => x[1]), wid + ': first mission free, the other ' + (ms.length - 1) + ' locked'); free++; locked += st.length - 1;
    if (wid === worlds[0][0]) await shot('missions_locked');
    for (const [mid] of st.slice(1)) {   // try-all: every locked mission opens the parental gate and never the mission
      await bot.tapSel('.mcard[data-mission="' + mid + '"]'); await sleep(350);
      const r = await p.evaluate(() => ({ gate: !!document.querySelector('.pw-modal [data-gate=hold]'), hud: !!document.getElementById('hud') && document.getElementById('hud').style.display !== 'none' }));
      if (r.gate && !r.hud) gates++; else { fails++; console.log('FAIL locked mission opened wrongly', wid, mid, JSON.stringify(r)); }
      if (wid === worlds[0][0] && mid === st[1][0]) await shot('gate');
      await bot.tapSel('.pw-modal [data-gate=back]'); await sleep(250);
    }
  }
  console.log('locked missions tried', locked, '| gates shown', gates); ok(gates === locked, 'every locked mission shows the parental gate');
  /* purchase */
  const [w0, m0] = [worlds[0][0], worlds[0][1][1]];
  await bot.backToMap(); await bot.tapSel('.card[data-world="' + w0 + '"]'); await sleep(600); await bot.tapSel('.mcard[data-mission="' + m0 + '"]'); await sleep(400);
  if (kind === 'desk') {
    const hb = await p.locator('.pw-hold').boundingBox(); await p.mouse.move(hb.x + hb.width / 2, hb.y + hb.height / 2); await p.mouse.down(); await sleep(3400); await p.mouse.up();
    await p.waitForSelector('[data-gate=q]', { timeout: 5000 }); await shot('gate_sum');
    const solve = async () => { const q = await p.evaluate(() => document.querySelector('[data-gate=q]').textContent), d = s => +s.replace(/[٠-٩]/g, c => '٠١٢٣٤٥٦٧٨٩'.indexOf(c)), m = q.match(/([٠-٩]+) × ([٠-٩]+) \+ ([٠-٩]+)/); return String(d(m[1]) * d(m[2]) + d(m[3])); };
    let ans = await solve(); const wrong = String((+ans + 7) % 1000); for (const c of wrong) await bot.tapSel('[data-key="' + c + '"]'); await bot.tapSel('[data-key=ok]'); await sleep(1300); ok(await p.evaluate(() => !!document.querySelector('[data-gate=q]')), 'a wrong sum does not open the sheet');
    ans = await solve();   // a wrong answer re-draws the question
    for (const c of ans) await bot.tapSel('[data-key="' + c + '"]'); await bot.tapSel('[data-key=ok]'); await p.waitForSelector('[data-act=buy][data-plan=monthly]:not([disabled])', { timeout: 8000 }); await shot('paywall');
    await bot.tapSel('[data-act=buy][data-plan=monthly]'); await p.waitForSelector('[data-act=playnow]', { timeout: 8000 }); await shot('unlocked'); await bot.tapSel('[data-act=playnow]'); await sleep(400);
  } else { await p.evaluate(async () => { await Moody.billing.providers.mock.ctl.grant(Moody.config.productIds.monthly, 30); await Moody.ent.refresh(); }); await sleep(800); }
  ok(await p.evaluate(() => Moody.ent.isPremium()), 'premium after the (mock) purchase');
  ok(await p.evaluate(([w, m]) => Moody.ent.canPlay(w, m), [w0, m0]), 'locked mission now playable');
  await p.reload(); await sleep(1500); ok(await p.evaluate(() => Moody.ent.isPremium() && Moody.family.done() && !document.querySelector('.fw')), 'premium + family persist after reload, no wizard');
  console.log('console', JSON.stringify(env.errs.slice(0, 6))); await env.b.close(); process.exit(fails || env.errs.length ? 1 : 0);
})();
