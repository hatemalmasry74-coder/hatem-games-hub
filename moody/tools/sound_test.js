#!/usr/bin/env node
/* Moody & Aboody - tools/sound_test.js : verifies the sound-design pass (engine/audio.js + engine/soundscape.js) in a real browser.
   Headless Chrome cannot HEAR anything, so this counts WebAudio nodes: AudioContext.createOscillator / createBufferSource are wrapped and every
   expected event must raise the counters.  Also checks: ambience per world, node-count growth over 60 s, sound / music toggles, hidden tab, voice ducking, console errors.
   usage:  node tools/sound_test.js [URL]   (default $MOODY_URL or http://localhost:8765/moody/index.html?unlock=1)      env: SOUND_IDLE=60 (seconds of the growth check) */
const { launch, sleep } = require('./botlib.js');
const URL_ = process.argv[2] || process.env.MOODY_URL || 'http://localhost:8765/moody/index.html?unlock=1';
const IDLE = +(process.env.SOUND_IDLE || 60);
const INIT = `(() => {
  const W = window.__au = { osc: 0, src: 0, act: 0, max: 0, log: [] }, C = window.AudioContext;
  const wrap = (name, key) => { const o = C.prototype[name]; C.prototype[name] = function () { W[key]++; const n = o.apply(this, arguments); W.act++; W.max = Math.max(W.max, W.act); try { n.addEventListener('ended', () => { W.act--; }); } catch (e) { } return n; }; };
  wrap('createOscillator', 'osc'); wrap('createBufferSource', 'src');
  /* log every named sound the game asks for (after Moody exists) */
  const iv = setInterval(() => { const M = window.Moody; if (!M || !M.audio || M.audio.__w) return; M.audio.__w = 1; ['sfx', 'amb'].forEach(k => { const f = M.audio[k]; M.audio[k] = function (n, a) { const e = { n, k, o0: W.osc + W.src, t: Date.now(), l: M.audio.liveNodes() }; W.log.push(e); setTimeout(() => { e.o1 = W.osc + W.src; }, 400); return f.apply(this, arguments); }; }); clearInterval(iv); }, 5);
})();`;
let fails = 0; const ok = (c, m, extra) => { console.log((c ? 'PASS ' : 'FAIL ') + m + (extra !== undefined ? '  ' + extra : '')); if (!c) fails++; };
(async () => {
  const env = await launch({ kind: 'desk', url: URL_, init: INIT }), p = env.p, bot = env.bot;
  const cnt = () => p.evaluate(() => window.__au.osc + window.__au.src);
  const ev = (f, a) => p.evaluate(f, a);
  const snd = () => ev(() => Moody.sound.state());
  /* run an action, wait, return how many audio nodes were created meanwhile */
  const delta = async (fn, wait) => { const c0 = await cnt(); await fn(); await sleep(wait || 500); return (await cnt()) - c0; };

  /* 0. before any gesture nothing may be created (no autoplay warning) */
  ok((await cnt()) === 0, 'no audio node before the first gesture');

  /* 1. UI: title button, names wizard, world card, mission card */
  let d = await delta(() => bot.tapSel('.btn.big.green'), 700); ok(d > 0, 'title "ابدأ" button makes sound', 'nodes+' + d);
  const named = await ev(() => !!document.querySelector('input.txt'));
  if (named) { d = await delta(() => bot.tapText('يلا بينا'), 600); ok(d > 0, 'names wizard button makes sound', 'nodes+' + d); }
  await sleep(500);
  let s = await snd(); ok(s.bed && s.music, 'menu has an ambience bed + music', JSON.stringify(s));
  d = await delta(async () => { await ev(() => { const e = document.querySelector('.card[data-world="home"]'); e && e.scrollIntoView({ inline: 'center' }); }); await bot.tapSel('.card[data-world="home"]'); }, 600); ok(d > 0, 'world card click makes sound', 'nodes+' + d);
  await p.waitForSelector('.mcard[data-mission="m1"]'); d = await delta(() => bot.tapSel('.mcard[data-mission="m1"]'), 1200); ok(d > 0, 'mission start makes sound', 'nodes+' + d);
  await sleep(800); s = await snd(); ok(s.world === 'home' && s.bed === 'room' && s.music === 'home', 'home mission: room bed + calm music', JSON.stringify(s));
  ok(await ev(() => window.__au.log.some(e => e.n === 'start')), "'start' jingle played");
  /* opt-out attribute */
  d = await delta(async () => { await ev(() => { const b = document.createElement('button'); b.id = 'nsb'; b.setAttribute('data-nosound', ''); b.textContent = 'x'; b.style.cssText = 'position:fixed;left:0;top:0;z-index:9999;width:60px;height:60px'; document.body.append(b); }); await bot.tapSel('#nsb'); await sleep(300); }, 300);
  const nsLog = await ev(() => window.__au.log.filter(e => Date.now() - e.t < 900 && e.n === 'tap').length); ok(nsLog === 0, 'data-nosound button stays silent', 'tap sounds ' + nsLog); await ev(() => document.getElementById('nsb').remove());
  await bot.backToMap();

  /* 2. play a whole mission with a wrong first answer: events must log + raise the counters */
  await ev(() => { window.__au.log.length = 0; });
  const r = await bot.playMission('home', 'm1', { wrongFirst: true, timeout: 300000 }); ok(r.ok, 'home m1 completed by the bot');
  await sleep(600);   // let the 400 ms probes of the last sounds finish
  const lg = await ev(() => window.__au.log.map(e => ({ n: e.n, f: e.o1 > e.o0, l: e.l })));
  const by = {}; lg.forEach(e => { (by[e.n] = by[e.n] || { n: 0, f: 0 }); by[e.n].n++; if (e.f) by[e.n].f++; });
  console.log('     sounds during the mission: ' + Object.keys(by).map(k => k + '×' + by[k].n + (by[k].f < by[k].n ? '(' + by[k].f + ' raised nodes)' : '')).join(' '));
  const zero = lg.filter(e => !e.f); if (zero.length) console.log('     sounds that raised no nodes: ' + zero.map(e => e.n + '(live ' + e.l + ')').join(' '));
  for (const k of ['good', 'wrong', 'star', 'tap', 'step']) ok(by[k] && by[k].f > 0, "'" + k + "' fired and created audio nodes", by[k] ? by[k].f + '/' + by[k].n : 'never');
  await bot.backToMap();

  /* 3. 2D runner (home m4): jump, collision, landing */
  await ev(() => { window.__au.log.length = 0; }); let rt = {};
  await bot.openMission('home', 'm4'); await sleep(700);
  await bot.play({ timeout: 300000, custom: { runner: async ({ p: pg, sleep: sl }) => {
    if (!rt.done) { rt.done = 1;
      await sl(300); let c0 = await cnt(); await pg.keyboard.press('Space'); await sl(450); rt.jump = (await cnt()) - c0;
      await sl(1100); c0 = await cnt(); const h0 = await pg.evaluate(() => Moody.scene.dbg && Moody.scene.dbg.hits); const t0 = Date.now();
      while (Date.now() - t0 < 9000) { const h = await pg.evaluate(() => Moody.scene.dbg && Moody.scene.dbg.hits); if (h > h0) break; await sl(100); }   // do nothing -> hit an obstacle
      await sl(400); rt.hit = (await cnt()) - c0;
    }
    await pg.keyboard.press('Space'); await sl(420);
  } } });
  ok(rt.jump > 0, 'runner jump makes sound', 'nodes+' + rt.jump); ok(rt.hit > 0, 'runner collision makes sound', 'nodes+' + rt.hit);
  const l4 = await ev(() => window.__au.log.map(e => e.n)); ok(l4.includes('bump'), "'bump' collision sound requested"); ok(l4.includes('boing'), "'boing' jump sound requested"); ok(l4.includes('land'), "'land' sound requested (frame hook)");
  await bot.backToMap();

  /* 4. Baba's call ringing */
  await ev(() => { window.__au.log.length = 0; });
  await ev(() => Moody.flow.toCall()); await sleep(3600);
  const rings = await ev(() => window.__au.log.filter(e => e.n === 'ring').length); ok(rings >= 2, 'phone rings repeatedly while Baba calls', rings + ' rings in 3.6 s');
  s = await snd(); ok(s.world === 'call' && !s.bed && !s.music, 'call world: no bed / music (the ringtone owns the room)', JSON.stringify(s));
  await ev(() => Moody.flow.toMap()); await sleep(500);

  /* 5. every world: ambience bed + music + events start, nodes created */
  const worlds = await ev(() => Moody.worlds.filter(w => !w.soon).map(w => w.id));
  const EXP = { home: 'room', school: 'crowd', street: 'street', market: 'crowd', park: 'wind', sea: 'waves', nana: 'room', saudi: 'wind', habits: 'room', gathering: 'room', runs: 'wind', mystery: 'night' };
  for (const w of worlds) {
    if (w === 'call') continue;
    const d0 = await delta(async () => { await ev(id => Moody.flow.startMission(id, 0), w); await sleep(300); }, 1500);
    s = await snd(); const want = EXP[w];
    ok(s.world === w && s.bed && (!want || s.bed === want) && (w === 'runs' ? true : s.music) && d0 > 0, 'world ' + w + ' ambience', 'bed=' + s.bed + ' music=' + s.music + ' ev=[' + s.events + '] nodes+' + d0);
    await ev(() => Moody.flow.toMap()); await sleep(200);
  }
  s = await snd(); ok(s.world === 'menu', 'back on the map -> menu soundscape', JSON.stringify(s));

  /* 6. node growth: idle in a mission (dialog waiting) for IDLE seconds */
  await ev(() => Moody.flow.startMission('park', 0)); await sleep(2500);
  const samples = []; const t0 = Date.now(); const c00 = await cnt();
  while (Date.now() - t0 < IDLE * 1000) { await sleep(2000); samples.push(await ev(() => window.__au.act)); }
  const mx = await ev(() => window.__au.max), c1 = await cnt(), live = await ev(() => Moody.audio.liveNodes());
  const first = samples.slice(0, 5), last = samples.slice(-5), avg = a => a.reduce((x, y) => x + y, 0) / a.length;
  ok(mx <= 70, 'peak simultaneous audio nodes bounded over the session', 'max ' + mx);
  ok(avg(last) <= avg(first) + 6, 'active nodes do not grow over ' + IDLE + ' s', 'first~' + avg(first).toFixed(1) + ' last~' + avg(last).toFixed(1) + ' (created ' + (c1 - c00) + ' nodes, ' + ((c1 - c00) / IDLE).toFixed(1) + '/s)');
  ok(live <= 90, 'one-shot live counter within cap', String(live));
  await ev(() => Moody.flow.toMap()); await sleep(300);

  /* 7. voice ducking (reads Moody.voice.busy, never touches the voice) */
  await ev(() => { Moody.voice.busy = true; }); await sleep(1500);
  const g1 = await ev(() => Moody.audio.bus().bed.gain.value); await ev(() => { Moody.voice.busy = false; }); await sleep(1800); const g2 = await ev(() => Moody.audio.bus().bed.gain.value);
  ok(g1 < .5 && g2 > .9, 'ambience + music duck under voice and recover', 'ducked ' + g1.toFixed(2) + ' -> ' + g2.toFixed(2));

  /* 8. hidden tab stops everything, visible restores */
  await ev(() => { Object.defineProperty(document, 'hidden', { get: () => true, configurable: true }); document.dispatchEvent(new Event('visibilitychange')); }); await sleep(700);
  s = await snd(); const st = await ev(() => Moody.audio.ctx().state); ok(!s.bed && !s.music && st === 'suspended', 'hidden tab: bed + music stopped and context suspended', JSON.stringify(s) + ' ' + st);
  d = await delta(async () => { }, 1500); ok(d === 0, 'hidden tab creates no nodes', 'nodes+' + d);
  await ev(() => { delete document.hidden; document.dispatchEvent(new Event('visibilitychange')); }); await sleep(1200);
  s = await snd(); ok(s.bed && s.music, 'visible again: soundscape back', JSON.stringify(s));

  /* 9. toggles: music alone, then sound (everything) */
  await ev(() => Moody.flow.toTitle()); await sleep(800);
  const hasM = await ev(() => !!document.querySelector('button[aria-label="الموسيقى"]')); ok(hasM, 'title screen has a separate music button');
  await bot.tapSel('button[aria-label="الموسيقى"]'); await sleep(900);
  s = await snd(); let mg = await ev(() => Moody.audio.bus().mus.gain.value); ok(!s.music && mg < .02 && s.bed, 'music button: music off, ambience still on', JSON.stringify(s) + ' musGain ' + mg.toFixed(3));
  await bot.tapSel('button[aria-label="الموسيقى"]'); await sleep(2200);
  s = await snd(); mg = await ev(() => Moody.audio.bus().mus.gain.value); ok(s.music && mg > .1, 'music button again: music back', JSON.stringify(s) + ' musGain ' + mg.toFixed(2));
  await bot.tapSel('button[aria-label="الصوت"]'); await sleep(900);
  s = await snd();
  ok(!s.bed && !(await ev(() => Moody.audio.on())), 'sound button: ambience stopped', JSON.stringify(s));
  const dd = await delta(async () => { }, 4000); ok(dd === 0, 'sound off: no oscillators / buffers created at all for 4 s', 'nodes+' + dd);
  await ev(() => { Moody.save.data.settings.sound = true; Moody.save.commit(); Moody.sound.sync(); }); await sleep(800);
  /* master volume setting */
  await ev(() => Moody.audio.setVol(.4)); await sleep(300); const mv = await ev(() => Moody.audio.bus().master.gain.value); ok(Math.abs(mv - .2) < .02, 'master volume setting scales the master gain', mv.toFixed(3)); await ev(() => Moody.audio.setVol(1));

  console.log('ERRORS', JSON.stringify(env.errs.slice(0, 10))); ok(env.errs.length === 0, 'no console errors / warnings / failed requests');
  console.log(fails ? 'SOUND TEST: ' + fails + ' FAIL' : 'SOUND TEST: ALL PASS'); await env.b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error('CRASH', e); process.exit(2); });
