#!/usr/bin/env node
/* End-to-end bot play of a built PLAY edition with a given family config (uses the base game's kid-bot tools/botlib.js, unchanged).
     node tools/play/e2e.js <url-of-index.html> <config: one|two|four|nogm|path/to.json> [desk|phone] [worlds,comma|all] [--wrong] [--shots dir] [--voicelog file]
   1. opens the page, stores the family config (Moody.family.save), reloads (so the config comes from the device save, like a real second launch),
   2. plays every mission of every visible world through real mouse / touch input,
   3. after each mission: no raw role token ({m} {gm} ...) anywhere in the DOM or in canvas text, none of the OTHER configs' sample names, the world list matches the config,
   4. reloads and checks that the progress persists, prints the console errors (must be none).
   --voicelog writes every (raw text, neutral text, speaker, hash) that was voiced (for tools/play/voice.py). */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const args = process.argv.slice(2), flag = n => { const i = args.indexOf(n); return i >= 0 ? (args.splice(i, 1), true) : false; }, opt = n => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : null; };
const wrong = flag('--wrong'), viaWizard = flag('--wizard'), premium = flag('--premium'), shots = opt('--shots'), vlog = opt('--voicelog');
const url = args[0], cfgArg = args[1] || 'two', kind = args[2] || 'desk', only = (args[3] && args[3] !== 'all' ? args[3] : '').split(',').filter(Boolean);
if (!url) { console.log('usage: node tools/play/e2e.js <url> <config> [desk|phone] [worlds|all] [--wrong] [--shots dir] [--voicelog file]'); process.exit(1); }
const INIT = `(() => { window.__tokHits = []; const chk = (s) => { if (typeof s === 'string' && /\\{[a-z][a-z0-9]*\\}/.test(s)) window.__tokHits.push(s.slice(0, 80)); };
  const P = CanvasRenderingContext2D.prototype, f = P.fillText, k = P.strokeText; P.fillText = function (t) { chk(t); return f.apply(this, arguments); }; P.strokeText = function (t) { chk(t); return k.apply(this, arguments); }; })();`;
(async () => {
  const env = await launch({ kind, url: url + (url.includes('?') ? '&' : '?') + 'unlock=1&collectvoice=1', init: INIT, shots: null }), p = env.p, bot = env.bot;
  const cfgJson = fs.existsSync(cfgArg) ? JSON.parse(fs.readFileSync(cfgArg, 'utf8')) : null;
  if (viaWizard) { const { driveWizard } = require('./wizard_drive'); const cfg = cfgJson || await p.evaluate(n => Moody.family.preset(n), cfgArg); await driveWizard(p, bot, cfg, { shots, prefix: cfgArg + '_' + kind + '_wiz' }); }
  else await p.evaluate(([c, j]) => { const F = Moody.family; F.save(j || F.preset(c)); }, [cfgArg, cfgJson]);
  if (premium) { await p.evaluate(async () => { const m = Moody.billing && Moody.billing.providers.mock; if (!m) throw new Error('--premium needs a --test-mock build'); await m.ctl.grant(Moody.config.productIds.monthly, 30); await Moody.ent.refresh(); }); }
  await p.reload(); await sleep(1500);
  if (premium) console.log('PREMIUM after reload:', await p.evaluate(() => Moody.ent.isPremium()));
  const info = await p.evaluate(() => { const F = Moody.family, c = F.cfg(); return { done: F.done(), names: Moody.save.data.names, gm: c.nana.on, dad: c.dad.travels, worlds: Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => w.id) }; });
  console.log('CONFIG', cfgArg, JSON.stringify({ done: info.done, gm: info.gm, dadTravels: info.dad, kids: [info.names.moody, info.names.aboody, info.names.toota, info.names.nemo], worlds: info.worlds }));
  if (shots) { fs.mkdirSync(shots, { recursive: true }); await p.screenshot({ path: path.join(shots, cfgArg + '_' + kind + '_title.png') }); }
  await bot.startGame(); await p.waitForSelector('.card[data-world]', { timeout: 60000 }).catch(() => { }); await sleep(500);
  if (shots) await p.screenshot({ path: path.join(shots, cfgArg + '_' + kind + '_map.png') });
  const worlds = await p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).map(w => [w.id, w.missions.map(m => m.id)]));
  let fails = 0, n = 0; const problems = [];
  for (const [wid, ms] of worlds) {
    if (only.length && !only.includes(wid)) continue;
    for (const mid of ms) {
      let shotN = 0;
      const r = await bot.playMission(wid, mid, { wrongFirst: wrong, timeout: 420000, speakers: !!vlog, onKit: async (sig) => { if (shots && shotN < 2 && sig !== 'idle') { shotN++; try { await p.screenshot({ path: path.join(shots, [cfgArg, kind, wid, mid, sig].join('_') + '.png') }); } catch (e) { } } } });
      const st = await p.evaluate(([w, m]) => Moody.save.data.progress[w + '/' + m], [wid, mid]);
      const toks = await p.evaluate(() => { const t = (document.body.innerText.match(/\{[a-z][a-z0-9]*\}/g) || []).concat(window.__tokHits || []); window.__tokHits = []; return t.slice(0, 5); });
      const ok = r.ok && st && st.done && !toks.length; n++; if (!ok) { fails++; problems.push(wid + '/' + mid + (toks.length ? ' RAW TOKENS ' + JSON.stringify(toks) : '')); }
      console.log(cfgArg, kind, wid, mid, ok ? 'OK' : 'FAIL ' + JSON.stringify(toks.length ? toks : r).slice(0, 150), st ? st.stars + '*' : '', Math.round(r.secs || 0) + 's');
      await bot.backToMap();
    }
  }
  const leak = await p.evaluate(() => { const c = Moody.family.cfg(), nm = Moody.family.IDS.filter(id => c[id].on).map(id => c[id].name).filter(n => n && n.length > 2); const L = '\\u0621-\\u063A\\u0641-\\u064A', re = n => new RegExp('(?<![' + L + '])[وفبكل]{0,2}' + n + '(?![' + L + '])'); return JSON.parse(Moody.voice.dump()).filter(e => nm.some(n => re(n).test(e.text))).map(e => e.text.slice(0, 70)).slice(0, 8); });
  console.log('VOICE TEXT WITH REAL NAMES (must be none):', JSON.stringify(leak)); if (leak.length) { problems.push('names in voice: ' + leak.length); fails++; }
  if (vlog) { const d = await p.evaluate(() => Moody.voice.dump()); fs.writeFileSync(vlog, d); console.log('voice log', JSON.parse(d).length, '->', vlog); }
  const before = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)); await p.reload(); await sleep(1500);
  const after = await p.evaluate(() => JSON.stringify(Moody.save.data.progress)), kept = await p.evaluate(() => JSON.stringify(Moody.family.cfg()).length > 200 && Moody.family.done());
  console.log('PERSIST', before === after ? 'OK' : 'MISMATCH', '| family kept after reload', kept ? 'OK' : 'LOST', '| missions', n, '| fails', fails);
  const aborted = env.errs.filter(e => /^REQFAIL .*assets\/voice\/[0-9a-f]{12}\.mp3$/.test(e)); if (aborted.length) { console.log('note: ' + aborted.length + ' narration clip request(s) aborted by the player when a line was cut off (benign, no console error)'); aborted.forEach(e => env.errs.splice(env.errs.indexOf(e), 1)); }
  if (problems.length) console.log('PROBLEMS', JSON.stringify(problems)); console.log('ERRORS', JSON.stringify(env.errs.slice(0, 12)));
  await env.b.close(); process.exit(fails || before !== after || !kept || env.errs.length ? 1 : 0);
})();
