#!/usr/bin/env node
/* Parents' corner -> «عيلتنا» editor: changes a name + a look, walks to the last step, saves, checks the game uses the new names, cancels a second edit and checks nothing changed.
     node tools/play/edit_test.js <url> [desk|phone] [shotsdir] */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const url = process.argv[2], kind = process.argv[3] || 'desk', shots = process.argv[4];
if (shots) fs.mkdirSync(shots, { recursive: true });
(async () => {
  const env = await launch({ kind, url: url + '?unlock=1' }), p = env.p, bot = env.bot; let fails = 0;
  const ok = (c, m) => { console.log(c ? 'ok  ' : 'FAIL', m); if (!c) fails++; };
  await p.evaluate(() => { const F = Moody.family; F.save(F.preset('two')); }); await p.reload(); await sleep(1500);
  await bot.startGame(); await sleep(500);
  await bot.tapSel('.btn.round.purple, [aria-label="ركن الأهل"]'); await p.evaluate(() => Moody.flow.toParent(Moody.flow.toMap)); await sleep(700);
  await bot.tapText('عيلتنا: الأسماء والشكل'); await sleep(800); ok(await p.evaluate(() => !!document.querySelector('.fw')), 'editor opens from the parents corner');
  if (shots) await p.screenshot({ path: path.join(shots, kind + '_edit_open.png') });
  await bot.tapSel('.fw-kid[data-kid=nemo]'); await sleep(300); await bot.tapSel('[data-act=next]'); await sleep(400);   // + a third child (nemo slot) -> steps: moody, aboody, nemo
  let nm = await p.evaluate(() => document.querySelector('.fw-hero, .fw-form') ? 'form' : ''); ok(nm === 'form', 'first kid step shown');
  const inp = p.locator('input.fw-in').first(); await inp.fill(''); await inp.type('زياد', { delay: 15 }); await sleep(300);
  for (let i = 0; i < 12; i++) { const last = await p.evaluate(() => !!document.querySelector('.fw-hero') && /جاهزين/.test(document.body.innerText)); if (last) break; await bot.tapSel('[data-act=next]'); await sleep(350); }
  if (shots) await p.screenshot({ path: path.join(shots, kind + '_edit_finish.png') });
  await bot.tapSel('[data-act=next]'); await sleep(900);
  const after = await p.evaluate(() => ({ n: Moody.save.data.names.moody, saved: Moody.save.data.family.moody.name, parent: /ركن الأهل/.test(document.body.innerText), nemoOn: Moody.family.on('nemo') }));
  ok(after.n === 'زياد' && after.saved === 'زياد', 'new name saved and used: ' + JSON.stringify(after)); ok(after.parent, 'returned to the parents corner'); ok(after.nemoOn, 'extra child enabled');
  await bot.tapText('عيلتنا: الأسماء والشكل'); await sleep(800); const i2 = p.locator('input.fw-in').first();
  await bot.tapSel('[data-act=next]'); await sleep(300); await p.locator('input.fw-in').first().fill('مؤقت'); await sleep(300);
  await bot.tapSel('[data-act=back]'); await sleep(300); await bot.tapSel('[data-act=cancel]'); await sleep(800);
  ok(await p.evaluate(() => Moody.save.data.names.moody === 'زياد' && Moody.family.nameOf('moody') === 'زياد'), 'cancelled edit changed nothing');
  await p.reload(); await sleep(1200); ok(await p.evaluate(() => Moody.family.nameOf('moody') === 'زياد' && !document.querySelector('.fw')), 'persisted after reload, no wizard');
  console.log('console errors', JSON.stringify(env.errs.slice(0, 5))); await env.b.close(); process.exit(fails || env.errs.length ? 1 : 0);
})();
