#!/usr/bin/env node
/* Reactions hook test.  MOODY_URL=http://localhost:8851/moody/index.html node tools/voice2/hooks_test.js [world:mission,...] [desk|phone]
   A) every reactions context x speaker x hero is sampled 300 times in the page: every produced line must have a clip (hash in voice_strings.json + assets/voice/<hash>.mp3 + manifest)
   B) the given missions are played by the kid-bot with a wrong first answer (so wrong1/hint/correct2 fire) with ?collectvoice=1: every line the game spoke must have a clip; zero console errors. */
const fs = require('fs'), path = require('path');
const { launch, sleep } = require('../botlib.js');
const ROOT = path.join(__dirname, '..', '..'), base = process.env.MOODY_URL || 'http://localhost:8851/moody/index.html';
const ms = (process.argv[2] || '').split(',').filter(Boolean).map(x => x.split(':')), kind = process.argv[3] || 'desk';
(async () => {
  const env = await launch({ kind, url: base + '?unlock=1&collectvoice=1' }), p = env.p, bot = env.bot;
  const strings = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools', 'voice_strings.json'), 'utf8')), have = new Set(strings.map(s => s.hash));
  const clip = h => fs.existsSync(path.join(ROOT, 'assets', 'voice', h + '.mp3'));
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'voice', 'manifest.json'), 'utf8'));
  // A) static sampling
  const A = await p.evaluate(() => {
    const R = Moody.reactions, out = {}, heroes = ['moody', 'aboody', 'toota', 'nemo', undefined], sp = ['narrator', 'moody', 'aboody', 'toota', 'nemo', 'mama', 'baba', 'nana'];
    Object.keys(R.data).forEach(c => sp.forEach(s => heroes.forEach(h => { for (let i = 0; i < 60; i++) { const t = R.pick(c, { speaker: s, hero: h, helper: h === 'moody' ? 'aboody' : 'moody', tier: i % 3 ? 6 : 9, cat: ['math', 'arabic', 'science', 'logic', 'ethics'][i % 5] }); if (t) out[Moody.voice.hash(t)] = t; } })));
    for (let i = 0; i < 40; i++) { ['correct', 'correct2', 'wrong1', 'reveal'].forEach(c => { const r = R.react(c, { hero: 'aboody' }); if (r) r.seq.forEach(t => { out[Moody.voice.hash(t)] = t; }); }); }
    return { lines: out, dups: R.audit().length, n: R.all().length };
  });
  const missA = Object.entries(A.lines).filter(([h]) => !have.has(h) || !clip(h) || !manifest[h]);
  console.log('A) distinct sampled lines', Object.keys(A.lines).length, 'pool entries', A.n, 'cross-voice dups', A.dups, 'MISSING clips', missA.length, missA.slice(0, 5));
  // B) play
  let fails = 0, spoken = new Map();
  if (ms.length) { await bot.startGame(); await sleep(400); }
  for (const [w, m] of ms) {
    const r = await bot.playMission(w, m, { wrongFirst: true, timeout: 420000 }); if (!r.ok) fails++;
    JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => spoken.set(e.hash, e.text));
    console.log('B)', w, m, r.ok ? 'OK' : 'FAIL ' + JSON.stringify(r).slice(0, 100), 'spoken so far', spoken.size); await bot.backToMap();
  }
  const missB = [...spoken].filter(([h]) => !clip(h) || !manifest[h]);
  console.log('B) spoken lines', spoken.size, 'MISSING clips', missB.length, missB.slice(0, 8), 'mission fails', fails);
  const rx = await p.evaluate(() => ({ streak: Moody.reactions.streak() }));
  console.log('ERRORS', JSON.stringify(env.errs.slice(0, 8))); await env.b.close();
})();
