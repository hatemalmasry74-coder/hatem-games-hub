#!/usr/bin/env node
/* Dressing-room test of a BUILT edition (adapted from tools/dress_test.js, which assumes the owner's family):
     node tools/family/roomtest.js <url-of-index.html> [desk|phone] [--old "مودي,عبودي,..."]
   For every playable hero: the room that opens must match the hero's gender in the built DEFS (a girl in a boy slot gets the girls' room),
   hijab heroes (hair 'scarf') get the hijab tab, an item picked in every tab changes the live outfit and is saved, the saved outfit survives a reload,
   and no string of the dressing rooms (voice lines, item/set/colour names, door labels) contains an owner term. */
const path = require('path');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const args = process.argv.slice(2), url = args[0], kind = args[1] && !args[1].startsWith('--') ? args[1] : 'desk';
const OLD = ['مودي', 'عبودي', 'توتا', 'نيمو', 'تسنيم', 'ترنيم', 'زوزا', 'آل زياد', 'أبها', 'أماني', 'كمال', 'لوكا', 'توتي', 'بينو', 'ميدو', 'أوفا'].concat((args.find(a => a.startsWith('--old=')) || '').slice(6).split(',').filter(Boolean));
if (!url) { console.log('usage: node tools/family/roomtest.js <url> [desk|phone]'); process.exit(1); }
let nPass = 0, nFail = 0; const T = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  ' + x : '')); c ? nPass++ : nFail++; };
(async () => {
  const env = await launch({ kind, url: url + (url.includes('?') ? '&' : '?') + 'unlock=1' }), p = env.p, bot = env.bot;
  await bot.startGame(); await sleep(500);
  await p.evaluate(() => { Moody.save.data.coins = 500; Moody.save.commit(); });
  const heroes = await p.evaluate(() => Moody.chars.playable().map(i => ({ id: i, g: Moody.chars.defs[i].gender, scarf: Moody.chars.defs[i].hair === 'scarf', name: Moody.chars.defs[i].name })));
  console.log('heroes', JSON.stringify(heroes));
  T('every DEFS row of the edition has gender m|f', await p.evaluate(() => Object.values(Moody.chars.defs).every(d => d.gender === 'm' || d.gender === 'f')));
  /* no owner term in anything the rooms can say or show */
  const strings = await p.evaluate(() => { const D = Moody.dress, out = D.allVoice().map(x => x[0]); D.items.forEach(i => out.push(i.n)); D.sets.forEach(s => out.push(s.n)); (D.goals || []).forEach(g => out.push(g.title, g.say)); return out.filter(Boolean); });
  const leaks = strings.filter(s => OLD.some(w => s.includes(w)));
  T('room strings carry no owner name (' + strings.length + ' checked)', leaks.length === 0, leaks.slice(0, 3).join(' | '));
  /* the map tile and the door chooser */
  await p.evaluate(() => Moody.flow.toMap()); await sleep(800);
  await bot.tapText('غرفتي'); await sleep(900);
  const door = await p.evaluate(() => Array.from(document.querySelectorAll('.dr-room')).map(r => ({ room: r.dataset.room, heroes: Array.from(r.querySelectorAll('.dr-hero')).map(h => h.dataset.who) })));
  const expect = g => heroes.filter(h => h.g === g).map(h => h.id).sort().join(',');
  const boys = door.find(d => /boys|^m/.test(d.room)), girls = door.find(d => /girls|^f/.test(d.room));
  T('door: each hero stands in the room of its own gender', !!boys && !!girls && boys.heroes.slice().sort().join(',') === expect('m') && girls.heroes.slice().sort().join(',') === expect('f'), JSON.stringify(door));
  for (const h of heroes) {
    await p.evaluate(id => Moody.flow.toRoom(id), h.id);
    await p.waitForFunction(() => window.Moody.dress.room && Moody.scene && Moody.scene.heroes && !Moody.scene.tr, null, { timeout: 12000 }).catch(() => { }); await sleep(1500);
    const room = await p.evaluate(() => ({ g: Moody.dress.room.spec.gender, active: Moody.scene.active }));
    T(h.id + ' (' + h.name + ', ' + h.g + ') enters the ' + (h.g === 'f' ? 'girls' : 'boys') + ' room as the active hero', room.g === h.g && room.active === h.id, JSON.stringify(room));
    // open the wardrobe with a real tap
    const pos = await p.evaluate(() => { const o = Moody.dress.room.spec.objects.find(x => x.id === 'wardrobe'); return [o.x + o.w / 2, o.y + o.h / 2]; });
    await bot.tapLogical(pos[0], pos[1]); await sleep(1300);
    T(h.id + ': wardrobe panel opens', await p.evaluate(() => !!document.querySelector('.dr-panel')));
    const tabs = await p.evaluate(() => Array.from(document.querySelectorAll('.dr-tab')).map(t => t.dataset.tab));
    const headLab = await p.evaluate(() => { const t = document.querySelector('.dr-tab[data-tab="head"]'); return t ? t.textContent.trim() : ''; });
    T(h.id + ': ' + (h.scarf ? 'hijab styles offered (head tab = «الغطا»)' : 'hats offered (head tab = «القبعة»)'), (await p.evaluate(i => Moody.dress.isHijab(i), h.id)) === h.scarf && (h.scarf ? /الغطا/.test(headLab) : /القبعة/.test(headLab)), headLab + ' | ' + tabs.join(','));
    const before = await p.evaluate(i => JSON.stringify(Moody.dress.fitOf(i) || {}), h.id); let changed = 0, tried = 0;
    for (const t of tabs.filter(x => !['set', 'color'].includes(x))) {
      await bot.tapSel('.dr-tab[data-tab="' + t + '"]'); await sleep(700);
      const card = await p.evaluate(() => { const c = Array.from(document.querySelectorAll('.dr-list .dr-card')).find(c => !c.classList.contains('on') && !c.querySelector('.pr') && !['sig', 'none', 'noacc'].includes(c.dataset.item)); return c ? c.dataset.item : null; });
      if (!card) continue; tried++;
      await p.evaluate(id => document.querySelector('.dr-card[data-item="' + id + '"]').scrollIntoView({ inline: 'center', block: 'nearest' }), card); await sleep(200);
      await bot.tapSel('.dr-card[data-item="' + card + '"]'); await sleep(1000); changed += 1;
    }
    const after = await p.evaluate(i => JSON.stringify(Moody.dress.fitOf(i) || {}), h.id);
    T(h.id + ': free items picked in ' + tried + ' tabs change the outfit', tried >= 3 && after !== before, 'tabs ' + tabs.join('/'));
    await bot.tapSel('[data-act="ok"]'); await sleep(900);
    T(h.id + ': the outfit is saved', await p.evaluate(([i, a]) => JSON.stringify(Moody.save.data.cosm.eq[i] && Moody.save.data.cosm.eq[i].fit || {}) === a, [h.id, after]));
    h.fit = after;
  }
  await p.reload(); await sleep(1500); await bot.startGame().catch(() => { }); await sleep(500);
  for (const h of heroes) T(h.id + ': outfit survives a reload', await p.evaluate(([i, a]) => JSON.stringify(Moody.save.data.cosm.eq[i] && Moody.save.data.cosm.eq[i].fit || {}) === a, [h.id, h.fit]));
  T('no console errors', env.errs.length === 0, JSON.stringify(env.errs.slice(0, 5)));
  console.log(nPass + ' passed, ' + nFail + ' failed'); await env.b.close(); process.exit(nFail ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
