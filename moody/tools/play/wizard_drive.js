/* Shared helper of the Play-edition tests: fills the FIRST-LAUNCH wizard like a parent, from a config object (Moody.family.preset(name) or any family config JSON).
     const { driveWizard } = require('./wizard_drive');   await driveWizard(page, bot, cfg)   (the page must be showing the wizard welcome screen) */
const path = require('path');
const { sleep } = require(path.join(__dirname, '..', 'botlib.js'));
async function driveWizard(p, bot, cfg, opts) {
  opts = opts || {}; const click = async sel => { const ok = await bot.tapSel(sel); await sleep(300); return ok; };
  const type = async v => { const l = p.locator('input.fw-in').first(); await l.fill(''); await l.type(v, { delay: 10 }); await sleep(200); };
  const toggleOn = async () => { const b = p.locator('.fw-opt', { hasText: 'موجود في عيلتنا' }).first(); if (await b.getAttribute('aria-pressed') !== 'true') { await b.click(); await sleep(250); } };
  const shot = async n => { if (opts.shots) await p.screenshot({ path: path.join(opts.shots, (opts.prefix || 'wiz') + '_' + n + '.png') }); };
  await shot('welcome');
  await click('[data-act=start]'); await shot('kids');
  const kids = ['moody', 'aboody', 'toota', 'nemo'].filter(k => cfg[k] && cfg[k].on);
  for (const k of kids) await click('.fw-kid[data-kid=' + k + ']');
  await click('[data-act=next]');
  for (const k of kids) {                                           // one step per kid
    await type(cfg[k].name); const L = cfg[k].look || {};
    if (L.skin) { const i = (await p.evaluate(() => Moody.family.SKINS)).indexOf(L.skin); if (i >= 0) await click('.fw-sw >> nth=' + (await p.locator('.fw-sw[aria-label^="لون حجاب"]').count() + i)); }
    await shot('kid_' + k); await click('[data-act=next]');
  }
  for (const grp of [['nana', 'gf'], ['aunt1', 'aunt2', 'uncle1'], ['cz1', 'cz2', 'cz3', 'cz4', 'cz5']]) {   // grandparents / aunts+uncle / cousins
    for (const id of grp) {
      const o = cfg[id]; if (!o || !o.on) continue;
      await click('.fw-tab[data-who=' + id + ']'); await toggleOn(); await type(o.name || '');
      if ((id === 'nana' || id === 'gf') && o.title) await p.locator('.fw-opt', { hasText: new RegExp('^' + o.title + '$') }).first().click().catch(() => { });
      await sleep(200);
    }
    await shot('grp_' + grp[0]); await click('[data-act=next]');
  }
  if (cfg.dad.travels === false) { await p.locator('.fw-opt', { hasText: 'آه، مسافر' }).first().click().catch(() => { }); await sleep(250); } else if (cfg.dad.dest) await click('[data-dest=' + cfg.dad.dest + ']');
  if (cfg.school) { await p.locator('input.fw-in').first().fill(cfg.school); await sleep(200); }
  await shot('dad'); await click('[data-act=next]'); await shot('end'); await click('[data-act=next]'); await sleep(1500);
}
module.exports = { driveWizard };
