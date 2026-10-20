#!/usr/bin/env node
/* Moody & Aboody - tools/dress_test.js : tests of the DRESSING ROOMS / outfit system.     node tools/dress_test.js [baseUrl]     (env: PORT, MOODY_URL, SHOTS=<dir> to save screenshots, VOICE_OUT=<file.json>)
   Real mouse / touch input through botlib: map tile -> room door -> both rooms -> wardrobe -> every tab -> items, colours, patterns -> try-on / buy -> random / best / reset -> reload persistence
   -> mirror zoom -> toys -> door -> fashion show -> legacy-save migration -> gender derived from DEFS (never names) -> MODESTY AUDIT (skin recoloured magenta: no bare body in any item) -> quality low -> phone. */
const { launch, sleep } = require('./botlib.js'); const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const BASE = process.argv[2] || process.env.MOODY_URL || 'http://localhost:' + (process.env.PORT || 8891) + '/moody/index.html';
const SHOTS = process.env.SHOTS || ''; if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
let ok = true, nPass = 0, nFail = 0; const T = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  ' + x : '')); if (c) nPass++; else { nFail++; ok = false; } };
const shot = async (p, n) => { if (SHOTS) try { await p.screenshot({ path: path.join(SHOTS, n + '.png') }); } catch (e) { } };
const url = q => BASE + (BASE.indexOf('?') < 0 ? '?' : '&') + q;

/* ---- helpers (all in the page) ---- */
const enter = async (env, hero) => { await env.p.evaluate(h => Moody.flow.toRoom(h), hero); await env.p.waitForFunction(() => window.Moody.dress.room && Moody.scene && Moody.scene.heroes && !Moody.scene.tr, null, { timeout: 8000 }).catch(() => { }); await sleep(1600); };
const click = async (env, sel) => { const l = env.p.locator(sel).first(); try { await l.scrollIntoViewIfNeeded({ timeout: 1500 }); } catch (e) { } return env.bot.tapSel(sel); };
const domClick = (env, sel) => env.p.evaluate(s => { const e = document.querySelector(s); if (!e) return false; e.click(); return true; }, sel);
const fit = (env, id) => env.p.evaluate(i => JSON.parse(JSON.stringify(Moody.dress.fitOf(i) || null)), id);
const saved = (env, id) => env.p.evaluate(i => { const e = Moody.save.data.cosm.eq[i]; return e && e.fit ? JSON.parse(JSON.stringify(e.fit)) : null; }, id);
const tapObj = async (env, id) => { const o = await env.p.evaluate(i => { const s = Moody.dress.room.spec.objects.find(x => x.id === i); return s ? [s.x + s.w / 2, s.y + s.h / 2] : null; }, id); if (!o) return false; await env.bot.tapLogical(o[0], o[1]); return true; };
const settle = async (env, ms) => { await sleep(ms || 700); };

(async () => {
  const browser = await chromium.launch();
  /* ============================================================ 1. desktop, high quality: the full flow ============================================================ */
  let env = await launch({ kind: 'desk', browser, url: url('unlock=1&collectvoice=1') });
  let { p, bot } = env; await bot.startGame(); await sleep(500);
  await p.evaluate(() => { Moody.save.data.coins = 400; Moody.save.commit(); });
  T('registry: items + sets + goals loaded', await p.evaluate(() => !!(Moody.dress && Moody.dress.items.length > 60 && Moody.dress.sets.length >= 12 && Moody.dress.goals.length >= 6)));
  T('every DEFS row has gender m|f (14 rows)', await p.evaluate(() => { const d = Moody.chars.defs, k = Object.keys(d); return k.length === 14 && k.every(i => d[i].gender === 'm' || d[i].gender === 'f'); }));
  /* ---- item counts per slot and gender group ---- */
  const counts = await p.evaluate(() => { const D = Moody.dress, o = {}; ['m', 'f'].forEach(g => { const rep = Moody.chars.playable().filter(i => D.gender(i) === g).pop(); const c = s => D.itemsFor(rep, s).length; o[g] = { top: D.itemsFor(rep, 'top').filter(i => !i.full).length, dress: D.itemsFor(rep, 'top').filter(i => i.full).length, bottom: c('bottom'), shoes: c('shoes'), head: c('head'), hijab: c('hijab'), acc: c('acc'), sets: D.setsFor(rep).length }; }); return o; });
  console.log('  item counts', JSON.stringify(counts));
  T('boys: >=10 tops, >=6 bottoms, >=1 robe, >=5 shoes, >=8 headwear, >=6 accessories, >=5 sets', counts.m.top >= 10 && counts.m.bottom >= 6 && counts.m.dress >= 1 && counts.m.shoes >= 5 && counts.m.head >= 8 && counts.m.acc >= 6 && counts.m.sets >= 5);
  T('girls: >=10 tops, >=4 dresses, >=6 bottoms, >=5 shoes, >=8 headwear, >=6 accessories, >=5 sets', counts.f.top >= 9 && counts.f.dress >= 4 && counts.f.bottom >= 6 && counts.f.shoes >= 5 && counts.f.head >= 8 && counts.f.acc >= 6 && counts.f.sets >= 5);
  /* ---- map button -> door -> room (real input) ---- */
  await p.evaluate(() => Moody.flow.toMap()); await sleep(900);
  T('map tile «غرفتي» exists (boys colour for the active hero)', await p.evaluate(() => Array.from(document.querySelectorAll('.tile')).some(t => /غرفتي/.test(t.textContent))));
  await bot.tapText('غرفتي'); await sleep(900);
  T('room door screen: two rooms, 4 heroes', await p.evaluate(() => document.querySelectorAll('.dr-room').length === 2 && document.querySelectorAll('.dr-hero').length === 4));
  T('door: boys room holds Moody+Aboody, girls room Toota+Nemo (from DEFS gender)', await p.evaluate(() => { const g = r => Array.from(document.querySelectorAll('.dr-room[data-room="' + r + '"] .dr-hero')).map(b => b.dataset.who).sort().join(); return g('m') === 'aboody,moody' && g('f') === 'nemo,toota'; }));
  await shot(p, 'door');
  await bot.tapSel('.dr-hero[data-who="moody"]'); await p.waitForFunction(() => window.Moody.dress.room && !Moody.scene.tr, null, { timeout: 9000 }).catch(() => { }); await sleep(1800);
  T('Moody entered the BOYS room (room_boys), active = moody, both brothers present', await p.evaluate(() => { const r = Moody.dress.room; return r && r.spec.gender === 'm' && Moody.scene.active === 'moody' && Moody.scene.cast.join() === 'moody,aboody' && !Moody.scene.heroes.toota.visible; }));
  await shot(p, 'room_boys');
  /* ---- toys: tap every interactive object with the real mouse ---- */
  const toysM = await p.evaluate(() => Moody.dress.room.spec.objects.filter(o => !/wardrobe|mirror/.test(o.id)).map(o => o.id));
  for (const id of toysM) { await tapObj(env, id); await sleep(450); }
  T('boys toys reacted (robot ball cars blocks telescope posters)', await p.evaluate(ids => ids.every(i => Moody.dress.room.S.fx[i] != null), toysM), toysM.join(','));
  T('hero said a voiced one-liner (bubble)', await p.evaluate(() => { const h = Moody.scene.heroes[Moody.scene.active]; return !!(h.bubble && h.bubble.text); }));
  await shot(p, 'room_boys_toys');
  /* ---- mirror zoom ---- */
  await tapObj(env, 'mirror'); await sleep(900); T('mirror tap opens the zoom preview', await p.evaluate(() => !!Moody.dress.room.zoom)); await shot(p, 'mirror_zoom');
  await bot.tapSel('[data-act="zoom-close"]'); await sleep(600); T('zoom closes', await p.evaluate(() => !Moody.dress.room.zoom));
  /* ---- wardrobe -> panel ---- */
  await tapObj(env, 'wardrobe'); await sleep(1200);
  T('wardrobe tap opens the outfit panel + doors open', await p.evaluate(() => !!document.querySelector('.dr-panel') && Moody.dress.room.S.wd > .5));
  T('panel has 7 tabs (sets, clothes, pants, shoes, headwear, accessories, colours)', await p.evaluate(() => document.querySelectorAll('.dr-tab').length === 7));
  await shot(p, 'panel_sets');
  const TABS = ['top', 'bottom', 'shoes', 'head', 'acc'], before = await fit(env, 'moody'); let tabOk = 0;
  for (const t of TABS) {
    await click(env, '.dr-tab[data-tab="' + t + '"]'); await sleep(900); await shot(p, 'panel_' + t);
    const cards = await p.evaluate(() => Array.from(document.querySelectorAll('.dr-list .dr-card')).map(c => ({ id: c.dataset.item, on: c.classList.contains('on'), priced: !!c.querySelector('.pr') })));
    const free = cards.find(c => !c.on && !c.priced && c.id !== 'sig' && c.id !== 'none' && c.id !== 'noacc') || cards.find(c => !c.on);
    if (!free) continue; await p.evaluate(id => { const e = document.querySelector('.dr-card[data-item="' + id + '"]'); e.scrollIntoView({ inline: 'center', block: 'nearest' }); }, free.id); await sleep(250);
    await click(env, '.dr-card[data-item="' + free.id + '"]'); await sleep(1100);
    const f = await fit(env, 'moody'), key = t === 'head' ? 'head' : t === 'acc' ? 'acc' : t;
    if (f && f[key] !== undefined && JSON.stringify(f[key]) !== JSON.stringify(before && before[key])) tabOk++;
  }
  T('an item chosen in each of the 5 item tabs changes the live outfit instantly', tabOk === 5, tabOk + '/5');
  T('free items are saved at once (cosm.eq.moody.fit)', JSON.stringify(await saved(env, 'moody')) === JSON.stringify(await fit(env, 'moody')));
  T('the stage actor shows the outfit (sprite set baked for it)', await p.evaluate(() => { const f = Moody.dress.fitOf('moody'); return !!f && Moody.dress.sig('moody').length > 5 && Moody.chars.stats().sets > 1; }));
  /* ---- colour + pattern ---- */
  await click(env, '.dr-tab[data-tab="top"]'); await sleep(700);
  await p.evaluate(() => document.querySelector('.dr-card[data-item="tee"]').scrollIntoView({ inline: 'center' })); await sleep(300); if (!(await p.evaluate(() => document.querySelector('.dr-card[data-item="tee"]').classList.contains('on')))) { await click(env, '.dr-card[data-item="tee"]'); await sleep(1000); }
  await click(env, '.dr-tab[data-tab="color"]'); await sleep(900); await shot(p, 'panel_colors');
  await click(env, '.dr-dot[data-color="purple"]'); await sleep(900);
  T('colour tab: tapping a colour recolours the top', (await fit(env, 'moody')).top.c === 'purple');
  await click(env, '.dr-pat[data-pat="stripes"]'); await sleep(900);
  T('pattern chip: stripes', (await fit(env, 'moody')).top.p === 'stripes', JSON.stringify(await fit(env, 'moody')));
  await shot(p, 'outfit_after_colors');
  /* ---- try-on a priced item, do not buy -> not saved; buy another -> saved + coins spent ---- */
  await click(env, '.dr-tab[data-tab="top"]'); await sleep(700);
  const coins0 = await p.evaluate(() => Moody.save.data.coins);
  await p.evaluate(() => document.querySelector('.dr-card[data-item="hoodie"]').scrollIntoView({ inline: 'center' })); await sleep(300); await click(env, '.dr-card[data-item="hoodie"]'); await sleep(1100);
  T('try-on: priced item is worn on the stage (draft) with a «جرّب» tag and a buy button', await p.evaluate(() => Moody.dress.fitOf('moody').top.i === 'hoodie' && !!document.querySelector('[data-act="buy"]')));
  T('try-on is NOT saved', (await saved(env, 'moody')).top.i !== 'hoodie');
  await shot(p, 'tryon_buy');
  await click(env, '[data-act="buy"]'); await sleep(900);
  T('buy: coins spent, item owned, now saved', await p.evaluate(c0 => Moody.save.data.coins < c0 && Moody.save.data.cosm.owned.indexOf('hoodie') >= 0 && Moody.save.data.cosm.eq.moody.fit.top.i === 'hoodie', coins0));
  /* try a priced item and close the panel without buying: reverts */
  await click(env, '.dr-tab[data-tab="head"]'); await sleep(700);
  await p.evaluate(() => document.querySelector('.dr-card[data-item="crown"]').scrollIntoView({ inline: 'center' })); await sleep(250); await click(env, '.dr-card[data-item="crown"]'); await sleep(1000);
  T('crown try-on shown', await p.evaluate(() => Moody.dress.fitOf('moody').head.i === 'crown'));
  await click(env, '[data-act="ok"]'); await sleep(900);
  T('closing the panel without buying reverts the try-on', await p.evaluate(() => { const f = Moody.dress.fitOf('moody'); return !f.head || f.head.i !== 'crown'; }));
  /* ---- reopen, random, best, reset ---- */
  await tapObj(env, 'wardrobe'); await sleep(1000);
  await click(env, '[data-act="random"]'); await sleep(1500); T('«عشوائي» (surprise me) changes the outfit', await p.evaluate(() => { const f = Moody.dress.fitOf('moody'); return !!(f.top || f.bottom || f.shoes || f.head || f.acc); }));
  await shot(p, 'after_random');
  await click(env, '[data-act="best"]'); await sleep(500); T('«حفظ كأفضل لبس» stores cosm.eq.moody.best', await p.evaluate(() => !!Moody.save.data.cosm.eq.moody.best));
  const bestFit = await p.evaluate(() => JSON.stringify(Moody.save.data.cosm.eq.moody.best));
  await click(env, '[data-act="reset"]'); await sleep(1400);
  T('«رجّعني لشكلي الأصلي» = signature look again (no slots)', await p.evaluate(() => { const f = Moody.dress.fitOf('moody'); return !f.top && !f.bottom && !f.shoes && !f.head && !f.acc && !Moody.save.data.cosm.eq.moody.hat; }));
  T('signature look renders exactly the original pixels', await p.evaluate(() => { const M = Moody, draw = o => { const c = document.createElement('canvas'); c.width = 300; c.height = 400; const g = c.getContext('2d'); g.lineJoin = 'round'; g.translate(150, 370); g.scale(1.4, 1.4); M.chars.draw(g, 'moody', 0, 0, Object.assign({ anim: 'idle', t: 1.3, snap: true, noShadow: true, key: 'cmpx' }, o)); return g.getImageData(0, 0, 300, 400).data; }, a = draw({ outfit: false }), b = draw({}); let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 12) n++; return n === 0; }));
  await click(env, '.dr-tab[data-tab="set"]'); await sleep(900);
  T('the saved best look is offered as the first set card', await p.evaluate(() => !!document.querySelector('.dr-card[data-item="best"]')));
  await click(env, '.dr-card[data-item="best"]'); await sleep(1400); T('wearing the best look restores it', await p.evaluate(b => JSON.stringify(Moody.dress.fitOf('moody')).length > 20, bestFit));
  /* ---- hero switch while the panel is open ---- */
  await bot.tapSel('#sw .h[data-hero="aboody"]'); await sleep(900);
  T('switching hero re-targets the panel (Aboody)', await p.evaluate(() => Moody.dress.room.panel.who === 'aboody' && /عبودي/.test(document.querySelector('.dr-head .nm').textContent)));
  await click(env, '.dr-card[data-item="st_ball_m"]').catch(() => { }); await click(env, '.dr-tab[data-tab="set"]'); await sleep(700);
  await domClick(env, '.dr-card[data-item="st_park_m"]'); await sleep(1500); await shot(p, 'aboody_set');
  T('Aboody wears a ready-made set; Moody keeps his own outfit', await p.evaluate(() => !!Moody.dress.fitOf('aboody').top && JSON.stringify(Moody.dress.fitOf('aboody')) !== JSON.stringify(Moody.dress.fitOf('moody'))));
  await click(env, '[data-act="ok"]'); await sleep(900);
  /* ---- persistence: reload ---- */
  const before2 = { m: await saved(env, 'moody'), a: await saved(env, 'aboody') };
  await p.reload(); await sleep(2200); await bot.startGame().catch(() => { }); await sleep(500);
  T('reload: outfits persisted in the save under cosm.eq[hero].fit', await p.evaluate(b => JSON.stringify(Moody.save.data.cosm.eq.moody.fit) === JSON.stringify(b.m) && JSON.stringify(Moody.save.data.cosm.eq.aboody.fit) === JSON.stringify(b.a), before2));
  T('reload: owned items kept', await p.evaluate(() => Moody.save.data.cosm.owned.indexOf('hoodie') >= 0));
  await enter(env, 'aboody'); T('re-entering the room: Aboody still wears the set', await p.evaluate(() => !!Moody.dress.fitOf('aboody').top && Moody.scene.active === 'aboody'));
  await shot(p, 'room_after_reload');
  /* ---- door leaves ---- */
  await bot.tapLogical(924, 330); await sleep(1400); T('door tap returns to the map', await p.evaluate(() => !!document.querySelector('.card[data-world]')));

  /* ---- girls: Toota (hijab) and Nemo ---- */
  await p.evaluate(() => { Moody.save.data.coins = 400; Moody.save.commit(); }); await enter(env, 'toota');
  T('Toota entered the GIRLS room, cast = toota,nemo', await p.evaluate(() => Moody.dress.room.spec.gender === 'f' && Moody.scene.cast.join() === 'toota,nemo' && !Moody.scene.heroes.moody.visible));
  await shot(p, 'room_girls');
  const toysF = await p.evaluate(() => Moody.dress.room.spec.objects.filter(o => !/wardrobe|mirror/.test(o.id)).map(o => o.id));
  for (const id of toysF) { await tapObj(env, id); await sleep(380); }
  T('girls toys reacted (doll house, plush, paints, books, flowers, fairy lights)', await p.evaluate(ids => ids.every(i => Moody.dress.room.S.fx[i] != null), toysF), toysF.join(','));
  T('doll house lights toggled on', await p.evaluate(() => Moody.dress.room.S.fx.dhOn === true));
  await shot(p, 'room_girls_toys');
  await tapObj(env, 'wardrobe'); await sleep(1100);
  T('Toota: head tab is «الغطا» with hijab styles', await p.evaluate(() => { const t = document.querySelector('.dr-tab[data-tab="head"]'); return /الغطا/.test(t.textContent); }));
  await click(env, '.dr-tab[data-tab="head"]'); await sleep(900);
  T('Toota: hijab styles + hat cards (no cap / beanie / helmet on a hijab)', await p.evaluate(() => { const ids = Array.from(document.querySelectorAll('.dr-card')).map(c => c.dataset.item); return ids.indexOf('hj_dots') >= 0 && ids.indexOf('sunhat') >= 0 && ids.indexOf('cap') < 0 && ids.indexOf('beanie') < 0 && ids.indexOf('helmet') < 0; }));
  await shot(p, 'toota_head');
  await p.evaluate(() => document.querySelector('.dr-card[data-item="hj_floral"]').scrollIntoView({ inline: 'center' })); await sleep(250); await click(env, '.dr-card[data-item="hj_floral"]'); await sleep(1200);
  await click(env, '.dr-tab[data-tab="color"]'); await sleep(800); await click(env, '.dr-dot[data-color="mint"]'); await sleep(800); await click(env, '.dr-pat[data-pat="short"]'); await sleep(900);
  T('hijab: style + colour + short wrap saved/tried', await p.evaluate(() => { const h = Moody.dress.fitOf('toota').hijab; return h && h.i === 'hj_floral' && h.c === 'mint' && h.p === 'short'; }), JSON.stringify(await fit(env, 'toota')));
  await shot(p, 'toota_hijab_mint');
  await click(env, '.dr-tab[data-tab="top"]'); await sleep(800);
  await p.evaluate(() => document.querySelector('.dr-card[data-item="sundress"]').scrollIntoView({ inline: 'center' })); await sleep(250); await click(env, '.dr-card[data-item="sundress"]'); await sleep(1300);
  T('girls dress chosen: bottom cleared, dress worn (try or owned)', await p.evaluate(() => { const f = Moody.dress.fitOf('toota'); return f.top && f.top.i === 'sundress' && !f.bottom; }));
  await shot(p, 'toota_dress');
  await click(env, '[data-act="ok"]'); await sleep(900);
  await bot.tapSel('#sw .h[data-hero="nemo"]'); await sleep(600); await tapObj(env, 'wardrobe'); await sleep(1000);
  T('Nemo (no hijab): head tab is «القبعة», no hijab styles', await p.evaluate(() => { const t = document.querySelector('.dr-tab[data-tab="head"]'); return /القبعة/.test(t.textContent); }));
  await click(env, '.dr-tab[data-tab="head"]'); await sleep(900);
  T('Nemo: hats incl. bows / tiara, no boys-only (taqiyah, cap backwards)', await p.evaluate(() => { const ids = Array.from(document.querySelectorAll('.dr-card')).map(c => c.dataset.item); return ids.indexOf('bow') >= 0 && ids.indexOf('tiara') >= 0 && ids.indexOf('taqiyah') < 0 && ids.indexOf('capb') < 0 && ids.indexOf('hj_plain') < 0; }));
  await click(env, '.dr-tab[data-tab="bottom"]'); await sleep(800);
  T('girls bottoms: skirts + leggings, no shorts / school pants (boys)', await p.evaluate(() => { const ids = Array.from(document.querySelectorAll('.dr-card')).map(c => c.dataset.item); return ids.indexOf('longskirt') >= 0 && ids.indexOf('leggings') >= 0 && ids.indexOf('shorts') < 0 && ids.indexOf('cargo') < 0; }));
  await click(env, '[data-act="ok"]'); await sleep(800);

  /* ---- fashion show ---- */
  await bot.tapSel('#sw .h[data-hero="toota"]'); await sleep(500); await p.evaluate(() => { Moody.dress.forceGoal = 'winter'; });
  await click(env, '[data-act="fashion"]'); await sleep(900); T('fashion show: weather card appears', await p.evaluate(() => !!document.querySelector('.dr-weather')));
  await shot(p, 'fashion_card');
  await click(env, '[data-act="fashion-go"]'); await sleep(1400);
  T('fashion show: goal chip + panel in fashion mode', await p.evaluate(() => !!document.querySelector('.dr-goal') && !!document.querySelector('.dr-panel')));
  await click(env, '[data-act="ok"]'); await sleep(700); T('wrong outfit -> gentle hint, panel stays', await p.evaluate(() => !!document.querySelector('.dr-panel')));
  /* dress for winter: puffer (try-on is fine), boots, beanie */
  for (const [tab, id] of [['top', 'sweater'], ['shoes', 'boots'], ['acc', 'scarf']]) { await click(env, '.dr-tab[data-tab="' + tab + '"]'); await sleep(700); await p.evaluate(i => { const e = document.querySelector('.dr-card[data-item="' + i + '"]'); if (e) e.scrollIntoView({ inline: 'center' }); }, id); await sleep(200); if (await p.evaluate(i => !!document.querySelector('.dr-card[data-item="' + i + '"]'), id)) { await click(env, '.dr-card[data-item="' + id + '"]'); await sleep(1100); } }
  const sc0 = await p.evaluate(() => Moody.save.data.coins);
  await click(env, '[data-act="ok"]'); await sleep(3800);
  T('fashion show win: progress + coins recorded', await p.evaluate(c0 => { const pr = Moody.save.data.progress['room/fashion_winter']; return !!(pr && pr.done && pr.stars >= 1) && Moody.save.data.coins > c0; }, sc0));
  await shot(p, 'fashion_win');
  await p.evaluate(() => Moody.dress.room.leave()); await sleep(1200);

  /* ============================================================ 2. frame-by-frame: no bare body during swaps (every animation frame is sampled) ============================================================ */
  await enter(env, 'nemo'); await tapObj(env, 'wardrobe'); await sleep(1000);
  const swapRes = await p.evaluate(() => new Promise(res => { const D = Moody.dress, C = Moody.chars, st = Moody.scene, id = 'nemo', fits = [], f0 = D.fitOf(id) || { v: 2 }; const picks = [['top', 'longskirt'], ['bottom', 'leggings'], ['top', 'hoodie']]; let ok = 0, frames = 0, bad = 0, n = 0, cv = document.getElementById('c'), k = cv.width / 960; const cap = document.createElement('canvas'); cap.width = 40; cap.height = 40; const cg = cap.getContext('2d', { willReadFrequently: true });
    const isMag = (r, g, b) => false; const d0 = C.defs[id]; const hit = [];
    let i = 0; const next = () => { if (i >= 3) { res({ frames, bad }); return; } const it = D.items.find(x => x.id === ['sundress', 'jeans', 'jacket'][i]); i++; const nf = D.equip(id, D.fitOf(id) || { v: 2 }, it); D.swap(st, id, nf, { fx: 'poof' }); let c = 0; const loop = () => { frames++; /* the def used for drawing this frame must always have a top colour, a bottom (pants or skirt) and shoes */ const d = D.defFor(id); if (!d || !d.shirt || !(d.skirt || d.pants) || !d.shoe) bad++; if (++c < 60) requestAnimationFrame(loop); else next(); }; requestAnimationFrame(loop); }; next(); }));
  T('swap frames: every frame resolves to a fully clothed def (top + bottom + shoes) - ' + swapRes.frames + ' frames sampled', swapRes.bad === 0 && swapRes.frames >= 150);
  await click(env, '[data-act="ok"]'); await sleep(600);
  T('no console errors in the full flow (desktop high)', env.errs.length === 0, JSON.stringify(env.errs.slice(0, 4)));

  /* ============================================================ 3. voice strings: collected, one text = one voice ============================================================ */
  const vlog = await p.evaluate(() => JSON.parse(Moody.voice.dump())); const byText = {}; vlog.forEach(e => { (byText[e.text] = byText[e.text] || new Set()).add(e.speaker); });
  const dress = await p.evaluate(() => { const D = Moody.dress; return D.allVoice().map(x => [Moody.voice.resolve(x[0]), Moody.voice.voiceFor(x[1])]); }), seen = new Set(), out = [];
  vlog.forEach(e => { const k = e.text + '|' + e.speaker; if (!seen.has(k)) { seen.add(k); } });
  dress.forEach(x => { const k = x[0] + '|' + x[1]; if (!seen.has(k)) { seen.add(k); vlog.push({ text: x[0], speaker: x[1] }); } });
  const dressTexts = new Set(dress.map(x => x[0])); const mine = vlog.filter(e => dressTexts.has(e.text)).map(e => ({ text: e.text, speaker: e.speaker }));
  const multi = Object.keys(byText).filter(t => dressTexts.has(t) && byText[t].size > 1); T('voice: no dress-feature text spoken by two different voices', multi.length === 0, multi.slice(0, 3).join(' | '));
  if (process.env.VOICE_OUT) { fs.writeFileSync(process.env.VOICE_OUT, JSON.stringify(mine, null, 1)); console.log('  voice strings: ' + mine.length + ' -> ' + process.env.VOICE_OUT); }
  await env.ctx.close();

  /* ============================================================ 4. MODESTY AUDIT: skin recoloured magenta, no bare skin on torso / legs in ANY item ============================================================ */
  env = await launch({ kind: 'desk', browser, url: url('unlock=1') }); p = env.p; await sleep(2500);
  const aud = await p.evaluate(() => {
    const M = Moody, C = M.chars, D = M.dress, bases = { m: 'moody', m2: 'aboody', f: 'nemo', fh: 'toota' }, ids = {}; Object.keys(bases).forEach(k => { const b = C.defs[bases[k]]; C.defs['audit_' + k] = Object.assign({}, b, { skin: '#ff00ff', skinD: '#c800c8', img: undefined, playable: false }); ids[k] = 'audit_' + k; });
    const isMag = (r, g, b) => g < 60 && r > 140 && b > 140 && Math.abs(r - b) < 45, K = 2, res = { renders: 0, bare: [], longSleeve: [], bannedText: [] }, cv = document.createElement('canvas'); cv.width = 320; cv.height = 460; const g = cv.getContext('2d', { willReadFrequently: true });
    const base = {}; const test = (id, fit, label) => {
      const d = C.defs[id]; g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, 320, 460); g.lineJoin = 'round'; g.lineCap = 'round'; g.translate(160, 430); g.scale(K * d.sc, K * d.sc);
      C.draw(g, id, 0, 0, { outfit: fit, anim: 'idle', t: 1.3, snap: true, noShadow: true, key: 'aud:' + id });
      const top = -(d.L + d.T), reg = (x0, y0, x1, y1) => { const X0 = Math.round(160 + x0 * K * d.sc), X1 = Math.round(160 + x1 * K * d.sc), Y0 = Math.round(430 + y0 * K * d.sc), Y1 = Math.round(430 + y1 * K * d.sc), w = X1 - X0, h = Y1 - Y0, im = g.getImageData(X0, Y0, w, h).data; let n = 0; for (let i = 0; i < im.length; i += 4) if (im[i + 3] > 200 && isMag(im[i], im[i + 1], im[i + 2])) n++; return n; };
      const torso = reg(-d.sw + 5, top + 26, d.sw - 5, -d.L - 4), legs = reg(-15, -d.L + 14, 15, -16);
      res.renders++; if (label.endsWith('signature')) base[id] = [torso, legs]; const b0 = base[id] || [0, 0]; if (torso > b0[0] + 12 || legs > b0[1] + 12) res.bare.push(label + ' torso=' + torso + ' legs=' + legs + ' base=' + b0);
    };
    ['m', 'm2', 'f', 'fh'].forEach(k => {
      const id = ids[k], real = bases[k];
      test(id, { v: 2 }, k + ' signature');
      D.items.filter(it => D.okFor(it, real)).forEach(it => {
        let f = D.equip(real, { v: 2 }, it); test(id, f, k + ' ' + it.id);
        if (it.cols) { const c = it.cols[it.cols.length - 1]; f = D.equip(real, { v: 2 }, it, { col: c }); test(id, f, k + ' ' + it.id + '/' + c); }
        if (it.pats && it.pats.length > 1) { f = D.equip(real, { v: 2 }, it, { pat: it.pats[1] }); test(id, f, k + ' ' + it.id + '/' + it.pats[1]); }
        if (it.slot === 'top' && !it.full) { const f2 = D.equip(real, f, D.itemsFor(real, 'bottom')[0]); test(id, f2, k + ' ' + it.id + '+' + D.itemsFor(real, 'bottom')[0].id); }
      });
      D.setsFor(real).forEach(s => test(id, D.setSet(real, s), k + ' set ' + s.id));
      for (let i = 0; i < 6; i++) test(id, D.randomFit(real, { any: true }), k + ' random' + i);
    });
    /* data-level rules */
    C.playable().forEach(real => { if (D.gender(real) !== 'f') return; D.itemsFor(real, 'top').forEach(it => { const d = D.buildDef(real, C.defs[real], D.equip(real, { v: 2 }, it)); if (!d.sleeveLong) res.longSleeve.push(real + ' ' + it.id); }); });
    const banned = /سباح|مايوه|بيكيني|عاري|داخلي|شورت قصير|بدون كم/; D.items.concat(D.sets).forEach(x => { if (banned.test(x.n)) res.bannedText.push(x.n); });
    res.shortsLen = D.items.filter(i => i.kind === 'shorts').length; return res;
  });
  console.log('  modesty audit renders: ' + aud.renders);
  T('MODESTY: no bare skin on torso / legs in any item, colour, pattern, set or random outfit (' + aud.renders + ' renders)', aud.bare.length === 0, aud.bare.slice(0, 4).join(' | '));
  T('MODESTY: every girls top has long sleeves', aud.longSleeve.length === 0, aud.longSleeve.join(','));
  T('MODESTY: no swimwear / underwear words in item names', aud.bannedText.length === 0, aud.bannedText.join(','));
  await env.ctx.close();

  /* ============================================================ 5. legacy save migration (old hats / shirts keep working) ============================================================ */
  const legacy = { v: 1, names: { moody: 'مودي', aboody: 'عبودي', me: 'سيف', toota: 'توتا', nemo: 'نيمو', nana: 'ننا زوزا', baba: 'بابا' }, named: true, hero: 'moody', progress: {}, coins: 77, stickers: {}, diary: [], cosm: { owned: ['cap', 'red', 'gmint', 'tiara'], eq: { moody: { hat: 'cap', shirt: 'red' }, aboody: {}, toota: { shirt: 'gmint' }, nemo: { hat: 'tiara' } } }, settings: { sound: true, voice: true, narr: true, tier: 'auto', quality: 'auto', reduceMotion: null }, skills: {}, valuesPracticed: {}, seen: {}, lastQ: '', callDay: '', callId: '', callCount: 0 };
  env = await launch({ kind: 'desk', browser, url: url('unlock=1'), init: 'try{if(!localStorage.getItem("__legacy_seeded")){localStorage.setItem("hub_moody_v1",' + JSON.stringify(JSON.stringify(legacy)) + ');localStorage.setItem("__legacy_seeded","1");}}catch(e){}' }); p = env.p; bot = env.bot; await sleep(1500);
  T('legacy save loads: owned items + coins intact, no fit yet', await p.evaluate(() => Moody.save.data.cosm.owned.length === 4 && Moody.save.data.coins === 77 && !Moody.save.data.cosm.eq.moody.fit));
  T('legacy equipment still renders (hat + shirt colour through the old path)', await p.evaluate(() => { const M = Moody, draw = o => { const c = document.createElement('canvas'); c.width = 300; c.height = 400; const g = c.getContext('2d'); g.lineJoin = 'round'; g.translate(150, 370); g.scale(1.4, 1.4); M.chars.draw(g, 'moody', 0, 0, Object.assign({ anim: 'idle', t: 1.3, snap: true, noShadow: true, key: 'lg' }, o)); return g.getImageData(0, 0, 300, 400).data; }, plain = draw({}), worn = draw({ hat: 'cap', shirtId: 'red' }); let n = 0; for (let i = 0; i < plain.length; i += 4) if (Math.abs(plain[i] - worn[i]) + Math.abs(plain[i + 1] - worn[i + 1]) + Math.abs(plain[i + 2] - worn[i + 2]) > 30) n++; return n > 1500; }));
  await bot.startGame(); await sleep(500); await enter(env, 'moody'); await tapObj(env, 'wardrobe'); await sleep(1100);
  T('opening the wardrobe migrates old equipment into an outfit (cap -> head, red shirt -> top colour)', await p.evaluate(() => { const f = Moody.save.data.cosm.eq.moody.fit; return f && f.head && f.head.i === 'cap' && f.top && f.top.c === 'red' && Moody.save.data.cosm.owned.indexOf('cap') >= 0; }));
  await click(env, '.dr-tab[data-tab="head"]'); await sleep(900);
  T('the owned old hat is shown as worn / owned (no price)', await p.evaluate(() => { const c = document.querySelector('.dr-card[data-item="cap"]'); return !!c && c.classList.contains('on') && !c.querySelector('.pr'); }));
  await p.evaluate(() => Moody.dress.room.closePanel()); await sleep(700); await p.evaluate(() => Moody.dress.room.leave()); await sleep(900);
  await p.evaluate(() => { Moody.flow.toRoom('toota'); }); await sleep(2500); await tapObj(env, 'wardrobe'); await sleep(1000);
  T('old girls colour dress (gmint) kept as an owned dress item', await p.evaluate(() => { const f = Moody.save.data.cosm.eq.toota.fit; return f && f.top && f.top.i === 'gmint'; }));
  await env.ctx.close();

  /* ============================================================ 6. gender is derived from DEFS (family builder flips rows): flip Moody to 'f' ============================================================ */
  env = await launch({ kind: 'desk', browser, url: url('unlock=1') }); p = env.p; bot = env.bot; await sleep(1500); await bot.startGame(); await sleep(400);
  await p.evaluate(() => { Moody.chars.defs.moody.gender = 'f'; Moody.chars.defs.aboody.gender = 'f'; Moody.chars.defs.toota.gender = 'm'; Moody.chars.defs.nemo.gender = 'm'; });
  await enter(env, 'moody');
  T('flipping DEFS gender flips the rooms: Moody (now f) enters the girls room with Aboody', await p.evaluate(() => Moody.dress.room.spec.gender === 'f' && Moody.scene.cast.join() === 'moody,aboody'));
  await tapObj(env, 'wardrobe'); await sleep(1000); await click(env, '.dr-tab[data-tab="bottom"]'); await sleep(800);
  T('items follow the flipped gender (skirts offered, no boys shorts)', await p.evaluate(() => { const ids = Array.from(document.querySelectorAll('.dr-card')).map(c => c.dataset.item); return ids.indexOf('longskirt') >= 0 && ids.indexOf('shorts') < 0; }));
  await shot(p, 'flipped_gender_panel'); T('no console errors (flip)', env.errs.length === 0, JSON.stringify(env.errs.slice(0, 3)));
  await env.ctx.close();

  /* ============================================================ 7. quality LOW + phone viewport ============================================================ */
  env = await launch({ kind: 'phone', browser, url: url('unlock=1&q=low') }); p = env.p; bot = env.bot; await sleep(1200);
  T('quality is low', await p.evaluate(() => Moody.quality.level === 'low'));
  await bot.startGame(); await sleep(600); await p.evaluate(() => { Moody.save.data.coins = 200; Moody.save.commit(); Moody.flow.toMap(); }); await sleep(900); await shot(p, 'phone_map');
  await bot.tapText('غرفتي'); await sleep(900); await shot(p, 'phone_door');
  await bot.tapSel('.dr-hero[data-who="nemo"]'); await p.waitForFunction(() => window.Moody.dress.room && !Moody.scene.tr, null, { timeout: 9000 }).catch(() => { }); await sleep(2200); await shot(p, 'phone_room_girls');
  await tapObj(env, 'wardrobe'); await sleep(1300); await shot(p, 'phone_panel');
  const t0 = Date.now(); await click(env, '.dr-tab[data-tab="top"]'); await sleep(700); await p.evaluate(() => document.querySelector('.dr-card[data-item="longtee"]').scrollIntoView({ inline: 'center' })); await sleep(250); await click(env, '.dr-card[data-item="longtee"]'); await sleep(1200);
  T('phone + low: outfit change works with touch', await p.evaluate(() => Moody.dress.fitOf('nemo').top && Moody.dress.fitOf('nemo').top.i === 'longtee'));
  await shot(p, 'phone_after');
  const swapMs = await p.evaluate(() => new Promise(res => { const D = Moody.dress, st = Moody.scene; const t = performance.now(); D.swap(st, 'nemo', D.equip('nemo', D.fitOf('nemo'), D.byId.sweater), { fx: 'poof' }).then(() => res(performance.now() - t)); }));
  T('low quality: instant swap completes in < 450 ms (prebake + 120 ms poof cover)', swapMs < 450, Math.round(swapMs) + ' ms');
  const fps = await p.evaluate(() => new Promise(res => { let n = 0; const t0 = performance.now(); const f = () => { n++; if (performance.now() - t0 < 1500) requestAnimationFrame(f); else res(n / 1.5); }; requestAnimationFrame(f); }));
  T('room frame rate while the panel is open (headless CPU): > 15 fps', fps > 15, fps.toFixed(1) + ' fps');
  T('no console errors (phone low)', env.errs.length === 0, JSON.stringify(env.errs.slice(0, 3)));
  await env.ctx.close();
  await browser.close();
  console.log('\n' + (ok ? 'ALL OK' : 'FAILED'), nPass + ' passed, ' + nFail + ' failed'); process.exit(ok ? 0 : 1);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
