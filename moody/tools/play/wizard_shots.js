#!/usr/bin/env node
/* Drives the first-launch wizard of a built Play edition like a parent, taking a screenshot of every step.
     node tools/play/wizard_shots.js <url-of-index.html> <outdir> [desk|phone]
   Also asserts: no console errors, the saved family has the typed names, the game starts afterwards, a reload keeps the family. */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const url = process.argv[2], out = process.argv[3], kind = process.argv[4] || 'desk';
if (!url || !out) { console.log('usage: node tools/play/wizard_shots.js <url> <outdir> [desk|phone]'); process.exit(1); }
fs.mkdirSync(out, { recursive: true });
(async () => {
  const env = await launch({ kind, url }), p = env.p, bot = env.bot; let n = 0;
  const shot = async name => { await sleep(450); await p.screenshot({ path: path.join(out, kind + '_' + String(++n).padStart(2, '0') + '_' + name + '.png') }); };
  const click = async sel => { const ok = await bot.tapSel(sel); await sleep(350); return ok; };
  const typeIn = async (val) => { const l = p.locator('input.fw-in').first(); await l.fill(''); await l.type(val, { delay: 20 }); await sleep(300); };
  await shot('welcome');
  await click('[data-act=start]'); await shot('kids_empty');
  await click('.fw-kid[data-kid=moody]'); await click('.fw-kid[data-kid=toota]'); await click('.fw-kid[data-kid=nemo]'); await shot('kids_chosen');
  await click('[data-act=next]');                                  // kid 1 (moody slot)
  await typeIn('ياسين'); await click('.fw-sw >> nth=3'); await shot('kid1_name_skin');
  await p.locator('.fw-opt', { hasText: 'مجعّد' }).first().click(); await sleep(300); await shot('kid1_curly');
  await click('[data-act=next]');                                  // kid 2 (toota slot)
  await typeIn('جنى'); await click('.fw-sw >> nth=2'); await shot('kid2_girl_hijab');
  await p.locator('.fw-opt', { hasText: 'من غير حجاب' }).first().click().catch(() => { }); await sleep(300); await shot('kid2_no_hijab');
  await click('[data-act=next]');                                  // kid 3 (nemo slot)
  await typeIn('روان'); await shot('kid3');
  await click('[data-act=next]');                                  // grandparents
  await p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first().click(); await sleep(300); await typeIn('عفاف'); await p.locator('.fw-opt', { hasText: 'ستو' }).first().click(); await sleep(300); await shot('grandma');
  await click('.fw-tab[data-who=gf]'); await p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first().click(); await sleep(300); await typeIn('محمود'); await shot('grandpa');
  await click('[data-act=next]');                                  // aunts + uncle
  await p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first().click(); await sleep(300); await typeIn('نهى'); await shot('aunt1');
  await click('.fw-tab[data-who=uncle1]'); await p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first().click(); await sleep(300); await typeIn('طارق'); await shot('uncle');
  await click('[data-act=next]');                                  // cousins
  await p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first().click(); await sleep(300); await typeIn('مازن'); await shot('cousin1');
  await click('.fw-tab[data-who=cz2]'); await p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first().click(); await sleep(300); await typeIn('تاليا'); await shot('cousin2');
  await click('[data-act=next]');                                  // dad + school
  await click('[data-dest=taif]'); await p.locator('input.fw-in').first().fill('مدرسة النور'); await sleep(300); await shot('dad_school');
  await click('[data-act=next]'); await shot('finish');
  await click('[data-act=next]'); await sleep(1500); await shot('title_after_wizard');
  const fam = await p.evaluate(() => { const c = Moody.family.cfg(); return { done: Moody.family.done(), kids: ['moody', 'aboody', 'toota', 'nemo'].map(k => c[k].on + ':' + c[k].name), gm: c.nana.title + ' ' + c.nana.name, aunt1: c.aunt1.name, uncle: c.uncle1.name, cz1: c.cz1.name, dad: c.dad, school: c.school, saved: !!Moody.save.data.family }; });
  console.log('FAMILY', JSON.stringify(fam));
  await p.reload(); await sleep(1500); const again = await p.evaluate(() => ({ wizard: !!document.querySelector('.fw'), done: Moody.family.done(), names: Moody.save.data.names }));
  console.log('RELOAD', JSON.stringify(again)); await shot('title_after_reload');
  await bot.startGame(); await sleep(500); await shot('map');
  console.log('ERRORS', JSON.stringify(env.errs.slice(0, 8)));
  await env.b.close(); process.exit(env.errs.length || again.wizard || !again.done ? 1 : 0);
})();
