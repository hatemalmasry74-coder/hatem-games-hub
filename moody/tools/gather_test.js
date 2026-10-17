#!/usr/bin/env node
/* gathering world test: node tools/gather_test.js [desk|phone] [wrong] [m1,m2..]  (custom bot handler for gtSimon; screenshots every SHOT_MS) */
const { launch, sleep } = require('./botlib.js');
const SH = process.env.SHOTS || '/tmp/claude-0/-home-user/53a3c7d8-c487-5827-a402-36d70899f068/scratchpad/shots/gather/';
require('fs').mkdirSync(SH, { recursive: true });
const kind = process.argv[2] || 'desk', wrong = process.argv[3] === 'wrong', only = (process.argv[4] || '').split(',').filter(Boolean);
const PORT = process.env.PORT || 8804;
(async () => {
  const env = await launch({ kind, url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1&collectvoice=1' }), p = env.p, bot = env.bot;
  await bot.startGame(); await sleep(400);
  const ms = await p.evaluate(() => Moody.getWorld('gathering').missions.map(m => m.id));
  let fails = 0, cur = '', n = 0; const custom = { _w: 0 };
  custom.gtsimon = async ({ d, tapSel, sleep }) => {
    if (!d.busy && d.next >= 0) { if (wrong && !custom._w) { custom._w = 1; await tapSel('button[data-note="' + ((d.next + 1) % 4) + '"]'); await sleep(2200); return; } await tapSel('button[data-note="' + d.next + '"]'); }
    await sleep(250);
  };
  const iv = setInterval(() => { n++; bot.shot(SH + kind + (wrong ? 'W' : '') + '_' + cur + '_' + String(n).padStart(3, '0') + '.png'); }, +process.env.SHOT_MS || 3000);
  for (const mid of ms) { if (only.length && !only.includes(mid)) continue; cur = mid; custom._w = 0;
    const r = await bot.playMission('gathering', mid, { wrongFirst: wrong, timeout: 420000, custom, onKit: (sig) => console.log('  kit', mid, sig) });
    const st = await p.evaluate(m => Moody.save.data.progress['gathering/' + m], mid); const ok = r.ok && st && st.done; if (!ok) fails++;
    console.log(kind, mid, ok ? 'OK' : 'FAIL ' + JSON.stringify(r).slice(0, 300), st ? st.stars + '*' : '', Math.round(r.secs || 0) + 's'); await sleep(3200); await bot.backToMap(); }
  clearInterval(iv);
  if (process.env.VOICE_OUT) {
    const out = await p.evaluate(() => { const M = Moody, L = [], A = (t, sp) => { if (t) L.push({ text: M.voice.resolve(t), speaker: M.voice.voiceFor(sp || 'narrator') }); };
      Object.values(M.banks).filter(q => (q.tags || []).indexOf('gathering') >= 0).forEach(q => { A(q.q); q.choices.forEach(c => A(typeof c === 'string' ? c : c.text)); A(q.hint); A(q.explain); });
      const w = M.getWorld('gathering'); w.missions.forEach((m, i) => { A('المهمة ' + M.util.ar(i + 1) + ': ' + m.title + '. ' + (m.intro || '')); A(m.wisdom); });
      JSON.parse(M.voice.dump()).forEach(e => L.push({ text: e.text, speaker: e.speaker })); return L; });
    const seen = new Set(), res = []; out.forEach(e => { const k = e.text + '|' + e.speaker; if (!seen.has(k)) { seen.add(k); res.push(e); } });
    require('fs').writeFileSync(process.env.VOICE_OUT, JSON.stringify(res, null, 1)); console.log('VOICE strings', res.length);
  }
  const before = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)); await p.reload(); await sleep(1200);
  const after = await p.evaluate(() => JSON.stringify(Moody.save.data.progress));
  console.log('PERSIST', before === after ? 'OK' : 'MISMATCH', 'fails', fails); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 10)));
  await env.b.close();
})();
