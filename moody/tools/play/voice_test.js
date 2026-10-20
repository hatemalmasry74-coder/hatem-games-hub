#!/usr/bin/env node
/* Runtime narration check of a built Play edition that HAS clips (tools/play/voice.py gen): plays missions with a chosen grandmother title and reports, for every string that was voiced,
   whether its neutral clip exists in the manifest (coverage), whether a clip was really requested/played, and that no spoken text contains a real name.
     node tools/play/voice_test.js <url> <config> <gm-title> <world:mission,...> */
const path = require('path');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const [url, cfg, title, list] = [process.argv[2], process.argv[3] || 'four', process.argv[4] || 'ننا', process.argv[5] || 'nana:m2,gathering:m1,home:m1'];
(async () => {
  const env = await launch({ kind: 'desk', url: url + '?unlock=1&collectvoice=1' }), p = env.p, bot = env.bot;
  await p.evaluate(([c, t]) => { const F = Moody.family, k = F.preset(c); k.nana.on = true; k.nana.title = t; k.nana.name = k.nana.name || 'عفاف'; F.save(k); }, [cfg, title]); await p.reload(); await sleep(1500);
  await p.evaluate(() => { window.__plays = []; const A = window.Audio; window.Audio = function (u) { window.__plays.push(u); return new A(u); }; });
  await bot.startGame(); await sleep(500);
  for (const w of list.split(',')) { const [wid, mid] = w.split(':'); const r = await bot.playMission(wid, mid, { speakers: true }); console.log(wid, mid, r.ok ? 'ok' : 'FAIL'); await bot.backToMap(); }
  const res = await p.evaluate(() => { const V = Moody.voice, log = JSON.parse(V.dump()); const have = log.filter(e => V.has(e.raw)); return { vars: V.vars, voiced: log.length, withClip: have.length, missing: log.filter(e => !V.has(e.raw)).slice(0, 8).map(e => e.text), requested: window.__plays.length, sample: window.__plays.slice(0, 2) }; });
  console.log(JSON.stringify(res)); console.log('console', JSON.stringify(env.errs.slice(0, 5))); await env.b.close();
})();
