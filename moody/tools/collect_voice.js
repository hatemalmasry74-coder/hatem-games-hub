#!/usr/bin/env node
/* Moody & Aboody - tools/collect_voice.js
   Builds tools/voice_strings.json = every (text, speaker, hash) the game can speak:
     (a) all question banks (stems, choices, hints, explain), the Baba call pool, mission titles/intros/wisdom and fixed UI phrases
     (b) a static scan of worlds/*.js for ctx.say('who','text') / ['who','text'] dialogue lines
     (c) a bot play-through of EVERY mission of EVERY world (?unlock=1&collectvoice=1) capturing runtime texts via Moody.voice.dump()
   Usage:  node tools/collect_voice.js [--static]      (--static skips the play-through)
   Needs Playwright at /opt/node-tools/node_modules/playwright and python3 (for a throw-away static server). */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { launch, sleep } = require('./botlib.js');
const ROOT = path.join(__dirname, '..'), PORT = 8777, STATIC = process.argv.includes('--static');
const all = new Map();   // key text|speaker -> entry
const VOICE = { moody: 'boy_big', aboody: 'boy_small', mama: 'mama', baba: 'baba', toota: 'girl_big', nemo: 'girl_small', nana: 'nana', narrator: 'narrator', friend: 'boy_big', ofa: 'boy_mid', toti: 'girl_tiny', luka: 'boy_tiny', amani: 'aunt_a', nada: 'aunt_n', beno: 'teen_a', medo: 'teen_b', kamal: 'uncle' };
const add = (text, speaker) => { if (!text || typeof text !== 'string') return; speaker = VOICE[speaker || 'narrator'] || speaker || 'narrator'; const t = text.replace(/\s+/g, ' ').trim(); if (!t) return; const k = t + '|' + speaker; if (!all.has(k)) all.set(k, { text: t, speaker }); };

(async () => {
  const srv = cp.spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: path.join(ROOT, '..'), stdio: 'ignore' }); await sleep(900);
  const url = 'http://localhost:' + PORT + '/moody/index.html?unlock=1&collectvoice=1';
  try {
    /* (b) static scan of dialogue lines */
    for (const f of fs.readdirSync(path.join(ROOT, 'worlds')).filter(f => f.endsWith('.js'))) {
      const src = fs.readFileSync(path.join(ROOT, 'worlds', f), 'utf8');
      for (const m of src.matchAll(/(?:say\(|\[)\s*'(moody|aboody|mama|baba|toota|nemo|nana|narrator|friend|ofa|toti|luka|amani|nada|beno|medo|kamal)'\s*,\s*'((?:[^'\\]|\\.)*)'/g)) add(m[2].replace(/\\'/g, "'"), VOICE[m[1]]);
      for (const m of src.matchAll(/(?:wisdom|intro|prompt)\s*[:(]\s*'((?:[^'\\]|\\.)*)'/g)) add(m[1].replace(/\\'/g, "'"), 'narrator');
    }
    const env = await launch({ kind: 'desk', url }); const p = env.p;
    await sleep(500);
    /* (a) banks, call pool, missions, fixed phrases */
    const stat = await p.evaluate(() => {
      const M = window.Moody, out = [], A = (t, s) => out.push([t, s || 'narrator']);
      Object.values(M.banks).forEach(q => { A(q.q); (q.choices || []).forEach(c => A(typeof c === 'string' ? c : c && c.text)); A(q.hint); A(q.explain); });
      (M.babaCalls || []).forEach(c => { A(c.intro, 'baba'); A(c.task, 'baba'); A(c.sub); A(c.btn); A(c.wisdom); if (c.q) { A(c.q.q); c.q.choices.forEach(x => A(x)); A(c.q.hint); } (c.steps || []).forEach(s => A(s.label)); });
      ['babaGreetings', 'babaHowWasDay', 'babaPraise', 'babaBye'].forEach(k => (M[k] || []).forEach(t => A(t, 'baba'))); Object.values(M.babaDayReplies || {}).forEach(a => a.forEach(t => A(t, 'baba')));
      M.worlds.forEach(w => (w.missions || []).forEach((m, i) => { A('المهمة ' + M.util.ar(i + 1) + ': ' + m.title + '. ' + (m.intro || '')); A(m.wisdom); }));
      M.voice.fixedStrings.forEach(x => A(x[0], x[1]));
      return out;
    });
    const inv = {}; Object.keys(VOICE).forEach(k => { inv[VOICE[k]] = k; });
    stat.forEach(x => { if (x[0]) add(x[0], x[1] === 'baba' ? 'baba' : x[1]); });
    if (!STATIC) {
      /* (c) play every mission of every world */
      const bot = env.bot; await bot.startGame(); await sleep(400);
      const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
      for (const [wid, ms] of worlds) for (const mid of ms) {
        const r = await bot.playMission(wid, mid, { speakers: true, wrongFirst: true });
        const dump = JSON.parse(await p.evaluate(() => Moody.voice.dump())); dump.forEach(e => add(e.text, e.speaker));
        console.log(wid, mid, r.ok ? 'ok' : 'FAILED ' + JSON.stringify(r).slice(0, 120), 'strings so far:', all.size);
        await bot.backToMap();
      }
      // the daily call
      await p.evaluate(() => Moody.flow.toCall()); await sleep(800); const r2 = await bot.play({ timeout: 120000 }); console.log('call', r2.ok ? 'ok' : 'FAILED');
      JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.text, e.speaker));
      if (env.errs.length) console.log('ERRORS during collection:', env.errs.slice(0, 5));
    }
    // hash with the engine's own function (same as tools/voice_hash.py)
    const items = [...all.values()]; const hashes = await p.evaluate(ts => ts.map(t => Moody.voice.hash(t)), items.map(i => i.text));
    const out = items.map((i, k) => ({ text: i.text, speaker: VOICE[i.speaker] || i.speaker, hash: hashes[k] }));
    fs.writeFileSync(path.join(__dirname, 'voice_strings.json'), JSON.stringify(out, null, 1));
    console.log('wrote tools/voice_strings.json with', out.length, 'strings');
    await env.b.close();
  } finally { srv.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
