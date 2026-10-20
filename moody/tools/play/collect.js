#!/usr/bin/env node
/* Collect every (raw text, neutral text, speaker, hash) the BUILT Play edition can speak.  Adapted from tools/family/collect.js.
     node tools/play/collect.js <outdir> [--static] [--merge voicelog.json]  ->  <outdir>.meta/voice_strings.json
   Each entry keeps the RAW tokenised text (`raw`, e.g. "برافو يا {a}! {gm} فرحانة") because the narration is rendered NEUTRALLY (engine/voice.js neutralize()):
   `text` = neutral rendering for the default titles, `hash` = clip id of that rendering.  tools/play/voice.py expands the grandparent-title variants.
   --static skips the bot play-through (banks, calls, titles, fixed phrases, wizard phrases and a static scan of dialogue lines only).  Needs Playwright + python3. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const args = process.argv.slice(2), mi = args.indexOf('--merge'), MERGE = mi >= 0 ? args.splice(mi, 2)[1] : null, STATIC = args.includes('--static'), out = path.resolve(args.find(a => !a.startsWith('--')) || '');
if (!fs.existsSync(path.join(out, 'index.html'))) { console.error('usage: node tools/play/collect.js <built-outdir> [--static]'); process.exit(1); }
const PORT = 8790 + Math.floor(Math.random() * 90), all = new Map(); let VOICE_OF = {};
const add = (raw, speaker, emo) => { if (!raw || typeof raw !== 'string') return; const t = raw.replace(/\s+/g, ' ').trim(); if (!t) return; const sp = speaker || 'narrator', k = t + '|' + sp; if (!all.has(k)) all.set(k, { raw: t, speaker: sp, emo }); };
(async () => {
  const srv = cp.spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: out, stdio: 'ignore' }); await sleep(900);
  const url = 'http://localhost:' + PORT + '/index.html?unlock=1&collectvoice=1';
  try {
    const env = await launch({ kind: 'desk', url }), p = env.p; await sleep(500);
    await p.evaluate(() => { const F = Moody.family; F.save(F.preset('four')); }); await p.reload(); await sleep(1500);   // every world on
    VOICE_OF = await p.evaluate(() => { const o = {}; Object.keys(Moody.chars.defs).concat(['narrator', 'mama', 'baba', 'friend', 'saudi_officer']).forEach(s => { o[s] = Moody.voice.voiceFor(s); }); return o; });
    const ids = Object.keys(VOICE_OF).join('|');
    for (const f of fs.readdirSync(path.join(out, 'worlds')).filter(f => f.endsWith('.js'))) {   // (b) static scan of dialogue lines
      const src = fs.readFileSync(path.join(out, 'worlds', f), 'utf8');
      for (const m of src.matchAll(new RegExp("(?:say\\(|\\[)\\s*'(" + ids + ")'\\s*,\\s*'((?:[^'\\\\]|\\\\.)*)'", 'g'))) add(m[2].replace(/\\'/g, "'"), VOICE_OF[m[1]]);
      for (const m of src.matchAll(/(?:wisdom|intro|prompt)\s*[:(]\s*'((?:[^'\\]|\\.)*)'/g)) add(m[1].replace(/\\'/g, "'"), 'narrator');
    }
    const stat = await p.evaluate(() => {   // (a) banks, call pool, missions, fixed phrases, reactions
      const M = window.Moody, o = [], A = (t, s, e) => o.push([t, s || 'narrator', e]);
      Object.values(M.banks).forEach(q => { A(q.q); (q.choices || []).forEach(c => A(typeof c === 'string' ? c : c && c.text)); A(q.hint); A(q.explain); });
      (M.babaCalls || []).forEach(c => { A(c.intro, 'baba'); A(c.task, 'baba'); A(c.sub); A(c.btn); A(c.wisdom); if (c.q) { A(c.q.q); c.q.choices.forEach(x => A(x)); A(c.q.hint); } (c.steps || []).forEach(s => A(s.label)); });
      ['babaGreetings', 'babaHowWasDay', 'babaPraise', 'babaBye'].forEach(k => (M[k] || []).forEach(t => A(t, 'baba'))); Object.values(M.babaDayReplies || {}).forEach(a => a.forEach(t => A(t, 'baba')));
      (M._allWorlds || M.worlds).forEach(w => ((w._all || w.missions) || []).forEach((m, i) => { A('المهمة ' + M.util.ar(i + 1) + ': ' + m.title + '. ' + (m.intro || '')); A(m.wisdom); }));
      M.voice.fixedStrings.forEach(x => A(x[0], x[1]));
      if (M.reactions) M.reactions.all().forEach(e => A(e.text, e.speaker, e.emo));
      return o;
    });
    stat.forEach(x => add(x[0], x[1] === 'baba' ? 'baba' : VOICE_OF[x[1]] || x[1], x[2]));
    if (!STATIC) {
      const bot = env.bot; await bot.startGame(); await sleep(400);
      const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
      for (const [wid, ms] of worlds) for (const mid of ms) {
        const r = await bot.playMission(wid, mid, { speakers: true, wrongFirst: true });
        JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.raw || e.text, e.speaker));
        console.log(wid, mid, r.ok ? 'ok' : 'FAILED', 'strings so far:', all.size); await bot.backToMap();
      }
      if (await p.evaluate(() => !!Moody.flow.toCall)) { await p.evaluate(() => Moody.flow.toCall()); await sleep(800); const r2 = await bot.play({ timeout: 120000 }); console.log('call', r2.ok ? 'ok' : 'FAILED'); JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.raw || e.text, e.speaker)); }
    } else JSON.parse(await p.evaluate(() => Moody.voice.dump())).forEach(e => add(e.raw || e.text, e.speaker));
    if (MERGE) {   // a play-through log made with an OLDER build may contain formatted names: drop entries that contain any name of the 'four' test preset (word-bounded)
      const nm = await p.evaluate(() => { const F = Moody.family, c = F.preset('four'); return F.IDS.map(id => c[id].name).filter(n => n && n.length > 2); }), L = '\\u0621-\\u063A\\u0641-\\u064A', res = nm.map(n => new RegExp('(?<![' + L + '])[وفبكل]{0,2}' + n + '(?![' + L + '])'));
      let drop = 0; JSON.parse(fs.readFileSync(MERGE, 'utf8')).forEach(e => { const t = e.raw || e.text; if (res.some(r => r.test(t))) { drop++; return; } add(t, e.speaker); }); console.log('merged', MERGE, '(dropped', drop, 'entries with real names)');
    }   // e.g. the --voicelog of tools/play/e2e.js (a play-through already done)
    const items = [...all.values()], neu = await p.evaluate(ts => { Moody.voice.vars.gm = 'تيتة'; Moody.voice.vars.gf = 'جدو'; return ts.map(t => [Moody.voice.resolve(t), Moody.voice.hash(t)]); }, items.map(i => i.raw));   // default titles: voice.py expands the other titles
    const seenH = {}, res = []; items.forEach((i, k) => { const [text, hash] = neu[k]; if (seenH[hash]) { if (seenH[hash] !== i.speaker) console.log('WARN same neutral text, two voices (one clip id!):', text.slice(0, 50)); return; } seenH[hash] = i.speaker; const o = { text, raw: i.raw, speaker: i.speaker, hash }; if (i.emo) o.emo = i.emo; res.push(o); });
    const meta = out + '.meta'; fs.mkdirSync(meta, { recursive: true });
    fs.writeFileSync(path.join(meta, 'voice_strings.json'), JSON.stringify(res, null, 1));
    console.log('wrote', path.join(meta, 'voice_strings.json'), 'with', res.length, 'strings', STATIC ? '(static)' : ''); if (env.errs.length) console.log('console errors:', env.errs.slice(0, 5));
    await env.b.close();
  } finally { srv.kill(); }
})().catch(e => { console.error(e); process.exit(1); });
