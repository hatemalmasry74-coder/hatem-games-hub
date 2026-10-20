#!/usr/bin/env node
/* Checks that the family's REAL names appear where children read them, and takes screenshots (LOOK at them).
     node tools/play/names_check.js <url> <config> <shotsdir> [desk|phone]
   Screens: world map cards, mission list (mission cards), mission title card, dialog name tag + text, quiz, result screen, diary, album (stickers), the daily call screen, parents' corner. */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const [url, cfg, shots, kind] = [process.argv[2], process.argv[3] || 'four', process.argv[4], process.argv[5] || 'desk'];
if (!url || !shots) { console.log('usage: node tools/play/names_check.js <url> <config> <shotsdir> [desk|phone]'); process.exit(1); }
fs.mkdirSync(shots, { recursive: true });
(async () => {
  const env = await launch({ kind, url: url + '?unlock=1&collectvoice=1' }), p = env.p, bot = env.bot; let fails = 0;
  await p.evaluate(c => { const F = Moody.family; F.save(F.preset(c)); }, cfg); await p.reload(); await sleep(1500);
  const names = await p.evaluate(() => { const F = Moody.family, c = F.cfg(); return { gm: F.fullName('nana'), aunt1: F.fullName('aunt1'), uncle1: F.fullName('uncle1'), cz1: F.nameOf('cz1'), cz2: F.nameOf('cz2'), k: F.KIDS.map(k => F.nameOf(k)), school: F.tokens().school }; });
  const body = () => p.evaluate(() => document.body.innerText);
  const expect = async (what, ...words) => { const t = await body(); const miss = words.filter(w => t.indexOf(w) < 0); if (miss.length) { fails++; console.log('MISSING on', what, JSON.stringify(miss)); } else console.log('ok  ', what, JSON.stringify(words)); };
  const shot = async n => { await sleep(500); await p.screenshot({ path: path.join(shots, cfg + '_' + kind + '_' + n + '.png') }); };
  await bot.startGame(); await sleep(600);
  await expect('world map (cards)', names.gm.replace(/^\S+ /, '') || names.gm); await shot('names_map');
  await bot.tapSel('.card[data-world="nana"]'); await sleep(900); await expect('mission list: grandmother house', names.gm); await shot('names_missionlist');
  await bot.tapSel('.mcard[data-mission="m1"]'); await sleep(1500); await expect('mission title card', names.gm); await shot('names_titlecard');
  await sleep(2600); for (let i = 0; i < 3; i++) { await bot.tapSel('#dlg'); await sleep(500); } await shot('names_dialog');
  await p.evaluate(() => Moody.flow.toMap()); await sleep(600);
  await bot.tapSel('.card[data-world="gathering"]'); await sleep(900); await bot.tapSel('.mcard[data-mission="m1"]'); await sleep(4300);
  for (let i = 0; i < 6; i++) { await bot.tapSel('#dlg'); await sleep(450); } await shot('names_gathering_dialog');
  const t = await body(); if (names.uncle1 && t.indexOf(names.uncle1.replace(/^\S+ /, '')) < 0) console.log('note: uncle name not on this exact line (dialog progress), see screenshot');
  // finish a short world mission to fill diary/result
  await p.evaluate(() => Moody.flow.toMap()); await sleep(500);
  const r = await bot.playMission('nana', 'm1', { timeout: 240000 }); console.log('nana m1', r.ok ? 'played' : 'FAILED'); await shot('names_result');
  await expect('result screen (wisdom)', 'حكمة اليوم'); await bot.backToMap();
  await p.evaluate(() => { const sd = Moody.save.data; Moody.family.IDS.length; sd.diary.push({ id: 'nc-test', pic: 'star', text: 'سلّمنا على {gm} وعلى {aunt1} ولعبنا مع {cz1}', date: 'اليوم' }); sd.stickers.f_amani = 1; sd.stickers.f_kamal = 1; sd.stickers.f_nana = 1; Moody.save.commit(); });
  await bot.tapText('يومياتي'); await sleep(700); await expect('diary', names.gm); await shot('names_diary'); await bot.backToMap();
  await bot.tapText('ألبوم الملصقات'); await sleep(700); await expect('album (stickers)', names.aunt1); await shot('names_album'); await bot.backToMap();
  if (await p.evaluate(() => Moody.family.dadTravels())) { await p.evaluate(() => Moody.flow.toCall()); await sleep(2500); await shot('names_call_ring'); await bot.tapSel('.btn.big'); await sleep(2500); for (let i = 0; i < 3; i++) { await bot.tapSel('#dlg'); await sleep(500); } await expect('call screen', names.k[0]); await shot('names_call'); await p.evaluate(() => Moody.flow.toMap()); }
  await p.evaluate(() => Moody.flow.toParent(Moody.flow.toMap)); await sleep(800); await shot('names_parents_corner');
  console.log('names', JSON.stringify(names), '| failures', fails, '| console', JSON.stringify(env.errs.slice(0, 6)));
  await env.b.close(); process.exit(fails || env.errs.length ? 1 : 0);
})();
