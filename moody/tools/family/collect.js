#!/usr/bin/env node
/* Collect every (text, speaker, hash) the BUILT edition can speak.  Adapted from tools/collect_voice.js (the base tool is hard-wired
   to ../moody/index.html and writes into the base tools/ folder, so it cannot be used on a customer copy).
     node tools/family/collect.js <outdir> [--static]  ->  <outdir>.meta/voice_strings.json
   --static skips the bot play-through (banks, calls, titles, fixed phrases and a static scan of dialogue lines only: fast, a few
   run-time-built lines may be missed; run without --static before the final voice pass).  Needs Playwright + python3. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const args = process.argv.slice(2), STATIC = args.includes('--static'), out = path.resolve(args.find(a => !a.startsWith('--')) || '');
if (!fs.existsSync(path.join(out, 'index.html'))) { console.error('usage: node tools/family/collect.js <built-outdir> [--static]'); process.exit(1); }
const PORT = 8790 + Math.floor(Math.random() * 90);
const all = new Map();
const VOICE_OF = {};   // filled from the engine of the built copy (Moody.voice.voiceFor) so gender-changed heroes get the right voice
const add = (text, speaker, emo) => { if (!text || typeof text !== 'string') return; const t = text.replace(/\s+/g, ' ').trim(); if (!t) return; const sp = speaker || 'narrator'; const k = t + '|' + sp; if (!all.has(k)) all.set(k, { text: t, speaker: sp, emo }); };
(async () => {
  const srv = cp.spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: out, stdio: 'ignore' }); await sleep(900);
  const url = 'http://localhost:' + PORT + '/index.html?unlock=1&collectvoice=1';
  try {
    const env = await launch({ kind: 'desk', url }), p = env.p; await sleep(500);
    const voices = await p.evaluate(() => { const o = {}; ['narrator', 'moody', 'aboody', 'mama', 'baba', 'toota', 'nemo', 'nana', 'friend'].forEach(s => { o[s] = Moody.voice.voiceFor(s); }); return o; });
    Object.assign(VOICE_OF, voices);
    // (b) static scan of dialogue lines in the BUILT sources (speaker -> voice id)
    for (const f of fs.readdirSync(path.join(out, 'worlds')).filter(f => f.endsWith('.js'))) {
      const src = fs.readFileSync(path.join(out, 'worlds', f), 'utf8');
      for (const m of src.matchAll(/(?:say\(|\[)\s*'(moody|aboody|mama|baba|toota|nemo|nana|narrator|friend|ofa|toti|luka|amani|nada|beno|medo|kamal)'\s*,\s*'((?:[^'\\]|\\.)*)'/g)) add(m[2].replace(/\\'/g, "'"), VOICE_OF[m[1]]);
      for (const m of src.matchAll(/(?:wisdom|intro|prompt)\s*[:(]\s*'((?:[^'\\]|\\.)*)'/g)) add(m[1].replace(/\\'/g, "'"), 'narrator');
    }
    // (a) banks, call pool, missions, fixed phrases (read from the running engine)
    const stat = await p.evaluate(() => {
      const M = window.Moody, o = [], A = (t, s, e) => o.push([t, s || 'narrator', e]);
      Object.values(M.banks).forEach(q => { A(q.q); (q.choices || []).forEach(c => A(typeof c === 'string' ? c : c && c.text)); A(q.hint); A(q.explain); });
      (M.babaCalls || []).forEach(c => { A(c.intro, 'baba'); A(c.task, 'baba'); A(c.sub); A(c.btn); A(c.wisdom); if (c.q) { A(c.q.q); c.q.choices.forEach(x => A(x)); A(c.q.hint); } (c.steps || []).forEach(s => A(s.label)); });
      ['babaGreetings', 'babaHowWasDay', 'babaPraise', 'babaBye'].forEach(k => (M[k] || []).forEach(t => A(t, 'baba'))); Object.values(M.babaDayReplies || {}).forEach(a => a.forEach(t => A(t, 'baba')));
      M.worlds.forEach(w => (w.missions || []).forEach((m, i) => { A('المهمة ' + M.util.ar(i + 1) + ': ' + m.title + '. ' + (m.intro || '')); A(m.wisdom); }));
      M.voice.fixedStrings.forEach(x => A(x[0], x[1]));
      if (M.reactions) M.reactions.all().forEach(e => A(e.text, e.speaker, e.emo));      // content/reactions.js: every automatic reply = a voice class id + an emotion class (voice v2)
      return o;
    });
    stat.forEach(x => add(x[0], x[1] === 'baba' ? 'baba' : VOICE_OF[x[1]] || x[1], x[2]));
    if (!STATIC) {
      const bot = env.bot; await bot.startGame(); await sleep(400);
      const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
      for (const [wid, ms] of worlds) for (const mid of ms) {
        const r = await bot.playMission(wid, mid, { speakers: true, wrongFirst: true });
        JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.text, e.speaker));
        console.log(wid, mid, r.ok ? 'ok' : 'FAILED', 'strings so far:', all.size); await bot.backToMap();
      }
      if (await p.evaluate(() => !!Moody.flow.toCall)) { await p.evaluate(() => Moody.flow.toCall()); await sleep(800); const r2 = await bot.play({ timeout: 120000 }); console.log('call', r2.ok ? 'ok' : 'FAILED'); JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.text, e.speaker)); }
    } else JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.text, e.speaker));
    const items = [...all.values()], hashes = await p.evaluate(ts => ts.map(t => Moody.voice.hash(t)), items.map(i => i.text));
    const seenH = {}, res = []; items.forEach((i, k) => { if (seenH[hashes[k]]) { if (seenH[hashes[k]] !== i.speaker) console.log('WARN same text, two voices (one clip id!):', i.text.slice(0, 50)); return; } seenH[hashes[k]] = i.speaker; const o = { text: i.text, speaker: i.speaker, hash: hashes[k] }; if (i.emo) o.emo = i.emo; res.push(o); });
    const meta = out + '.meta'; fs.mkdirSync(meta, { recursive: true });
    fs.writeFileSync(path.join(meta, 'voice_strings.json'), JSON.stringify(res, null, 1));
    console.log('wrote', path.join(meta, 'voice_strings.json'), 'with', res.length, 'strings', STATIC ? '(static)' : ''); if (env.errs.length) console.log('console errors:', env.errs.slice(0, 5));
    await env.b.close();
  } finally { srv.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
