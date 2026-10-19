#!/usr/bin/env node
/* Collects every spoken string of the 'runs' world: node tools/runner_voice.js [out.json]
   = runtime dump of a bot play-through of the all missions (?collectvoice=1, wrong gate first, answer speakers) + the kit's own list (Moody.runner.voiceStrings)
     + the runs question bank + mission titles / intros / wisdom.   Output: [{text, speaker(voice id), hash}]   (same format as tools/voice_strings.json) */
const fs = require('fs'), { launch, sleep } = require('./botlib.js'); const PORT = process.env.PORT || 8842;
const out = process.argv[2] || '/tmp/claude-0/-home-user/53a3c7d8-c487-5827-a402-36d70899f068/scratchpad/runner2_voice_strings.json';
(async () => {
  const env = await launch({ kind: 'desk', url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1&collectvoice=1' }), p = env.p, bot = env.bot; await bot.startGame(); await sleep(300);
  const all = new Map(), add = (t, sp) => { if (!t) return; t = String(t).replace(/\s+/g, ' ').trim(); if (t) all.set(t + '|' + sp, { text: t, speaker: sp }); };
  const ids = await p.evaluate(() => Moody.getWorld('runs').missions.map(m => m.id));
  for (const mid of ids) {
    await bot.playMission('runs', mid, { wrongFirst: true, speakers: true, timeout: 420000 });
    JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.text, e.speaker)); await sleep(1500); await bot.backToMap();
  }
  const stat = await p.evaluate(() => {
    const M = Moody, o = [], A = (t, s) => o.push([t, s || 'narrator']); const V = k => M.voice.voiceFor(k);
    Object.values(M.banks).filter(q => (q.tags || []).indexOf('runs') >= 0).forEach(q => { A(q.q); (q.choices || []).forEach(c => A(typeof c === 'string' ? c : c.text)); A(q.hint); A(q.explain); });
    const w = M.getWorld('runs'); w.missions.forEach((m, i) => { A('المهمة ' + M.util.ar(i + 1) + ': ' + m.title + '. ' + (m.intro || '')); A(m.wisdom); });
    M.runner.voiceStrings().forEach(x => A(x[0], V(x[1]))); return o;
  });
  stat.forEach(x => add(x[0], x[1]));
  const items = [...all.values()], hashes = await p.evaluate(ts => ts.map(t => Moody.voice.hash(t)), items.map(i => i.text));
  const res = items.map((i, k) => ({ text: i.text, speaker: i.speaker, hash: hashes[k] }));
  fs.writeFileSync(out, JSON.stringify(res, null, 1)); console.log('wrote', out, res.length, 'strings'); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 5))); await env.b.close();
})().catch(e => { console.error(e); process.exit(2); });
