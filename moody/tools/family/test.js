#!/usr/bin/env node
/* Offline tests of the builder (no browser):  node tools/family/test.js [scratch-dir]
   unit tests (clitics, false positives, gender table, lexer round trip) + builds the sample and the two variants and checks
   that no trace of the base family is left and that every built JS file parses. */
const fs = require('fs'), path = require('path'), assert = require('assert'), vm = require('vm'), os = require('os');
const AR = require('./lib/ar'), G = require('./lib/gender'), { scan, join } = require('./lib/lexer');
const { build, ROOT } = require('./build');
const cp = require('child_process');
let pass = 0; const t = (name, fn) => { try { fn(); pass++; console.log('ok   ', name); } catch (e) { console.log('FAIL ', name, '\n     ', e.message); process.exitCode = 1; } };

t('word replacer keeps clitics and does not touch look-alikes', () => {
  const r = AR.wordReplacer([['مودي', 'ياسين'], ['ننا زوزا', 'تيتة سميرة'], ['ننا', 'تيتة'], ['عبودي', 'سلومة']]);
  assert.strictEqual(r('يا مودي، لمودي ومودي'), 'يا ياسين، لياسين وياسين');
  assert.strictEqual(r('سلّم على ننا زوزا وعلى لننا'), 'سلّم على تيتة سميرة وعلى لتيتة');
  assert.strictEqual(r('إننا ننام في بيتنا مكاننا وأسناننا ننادي مننا'), 'إننا ننام في بيتنا مكاننا وأسناننا ننادي مننا');
  assert.strictEqual(r('عبودي؟ عبودي،'), 'سلومة؟ سلومة،');            // Arabic punctuation is not a letter
});
t('ل + ال-name becomes لل', () => { assert.strictEqual(AR.wordReplacer([['أبها', 'الطائف']])('رايحين لأبها وفي أبها'), 'رايحين للطائف وفي الطائف'); });
t('longer phrase wins (school, airport)', () => {
  const r = AR.wordReplacer([['مطار القاهرة', 'مطار برج العرب'], ['القاهرة', 'الإسكندرية']]);
  assert.strictEqual(r('بمطار القاهرة وفي القاهرة'), 'بمطار برج العرب وفي الإسكندرية');
});
t('gender: adjectives, verbs, article, no اللها', () => {
  assert.strictEqual(G.agree('محتاجين {a} الصغير', 'm2f', { pronouns: true }).text, 'محتاجين {a} الصغيرة');
  assert.strictEqual(G.agree('{a} الصغير يزحف ويجيب المفتاح', 'm2f', { pronouns: true }).text, '{a} الصغيرة تزحف وتجيب المفتاح');
  assert.strictEqual(G.agree('الله! نيمو بتلاقي', 'm2f', { pronouns: true }).text, 'الله! نيمو بتلاقي');
  assert.strictEqual(G.agree('أنا شاطرة وهي بتلاقي', 'f2m', { pronouns: false, speaker: true }).text, 'أنا شاطر وهي بتلاقي');    // speaker mode: only first-person words
  assert.strictEqual(G.agree('وإنت من أهل الخير', 'm2f', { speaker: true }).text, 'وإنت من أهل الخير');    // speaker mode keeps "you"
  assert.strictEqual(G.agree('ننا عندها وردتين وجبنا لها وردة', 'f2m', { pronouns: true }).text, 'ننا عنده وردتين وجبنا له وردة');   // clitic ل must not hide له/لها
  assert.strictEqual(G.agree('الله أكبر', 'f2m', { pronouns: true }).text, 'الله أكبر');
});
t('lexer round trip on every base JS file', () => {
  let n = 0; for (const d of ['engine', 'content', 'worlds']) for (const f of fs.readdirSync(path.join(ROOT, d)).filter(f => f.endsWith('.js'))) { const s = fs.readFileSync(path.join(ROOT, d, f), 'utf8'); assert.strictEqual(join(scan(s)), s, f); n++; }
  assert(n > 30);
});
t('bad config is rejected', () => {
  const tmp = path.join(os.tmpdir(), 'fam_bad_' + process.pid + '.json'); fs.writeFileSync(tmp, JSON.stringify({ edition: { id: 'Bad Id' }, kids: [{ name: 'أ', age: 5, gender: 'm' }] }));
  const { loadConfig } = require('./build'); const c = loadConfig(tmp); assert(c._err.length >= 2, c._err.join('|')); fs.unlinkSync(tmp);
});

t('supplied avatar: refused without the cartoon confirmation, re-encoded without metadata with it', () => {
  const cp = require('child_process'), dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fam_av_')), png = path.join(dir, 'kid.png');
  cp.spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=orange:s=600x500', '-frames:v', '1', png]);
  const mk = ok => { const cfg = JSON.parse(fs.readFileSync(path.join(__dirname, 'family.example.json'), 'utf8')); cfg.edition.id = 'avatar-test'; cfg.kids[0].avatar = png; cfg.kids[0].avatarIsCartoon = ok; const f = path.join(dir, 'c.json'); fs.writeFileSync(f, JSON.stringify(cfg)); return f; };
  assert.throws(() => build(mk(false), path.join(dir, 'o1'), new Set(['force', 'quiet', 'no-icons'])), /avatarIsCartoon/);
  const r = build(mk(true), path.join(dir, 'o2'), new Set(['force', 'quiet']));
  const out = path.join(dir, 'o2', 'assets', 'avatar_moody.jpg'); assert(fs.existsSync(out), 'avatar not written');
  assert(fs.existsSync(path.join(dir, 'o2', 'icons', 'icon-512.png')), 'icon not made from the avatar');
  assert(r.avatars.some(a => a.slot === 'moody' && a.source === 'file') && r.avatars.some(a => a.slot === 'aboody' && a.source === 'generated'));
});

t('runs levels tagged @owner-family are cut (any number of levels), stickers/values stay consistent', () => {
  const { pruneRuns, Project } = require('./build');
  const mk = (tag2, tag1) => `(function () {\n  const M = {}; M.registerValue('a', { label: 'x' });\n  M.registerValue('b', { label: 'y' });\n  M.registerWorld({ id: 'runs', stickers: [\n    { id: 's_a', title: 't', art: 'x' }, { id: 's_b', title: 't', art: 'x' }, { id: 's_runs', title: 'z', art: 'w' }\n  ],\n    missions: [\n      /* ==== 1) ==== */\n      {\n        id: 'r1', ${tag1 || ''} title: 'one', values: ['a'], sticker: 's_a',\n        async run(ctx) { const s = '}{ ]'; return ctx.nav.complete(); }\n      },\n      /* ==== 2) ==== */\n      {\n        id: 'r2', ${tag2 || ''} title: 'two', values: ['b'], sticker: 's_b',\n        async run(ctx) { return 1; }\n      }\n    ]\n  });\n})();`;
  const cfg = { grandparent: { exists: true, sameBuilding: true }, dad: { status: 'abroad' } };
  let P = new Project(); P.files.set('worlds/runs.js', mk('/* @owner-family */')); pruneRuns(P, cfg);
  let out = P.get('worlds/runs.js'); new vm.Script(out);
  assert(/id: 'r1'/.test(out) && !/id: 'r2'/.test(out) && !/s_b/.test(out) && !/registerValue\('b'/.test(out) && /registerValue\('a'/.test(out) && /s_runs/.test(out), out);
  P = new Project(); P.files.set('worlds/runs.js', mk('/* @owner-family */', '/* @owner-family */'));
  P.files.set('worlds/registry.js', "M.plan([\n    { id: 'habits', order: 9 },\n    { id: 'runs', order: 11, title: 'x' }\n  ]);\n  M.load.push('content/q_runs.js', 'worlds/runs_art.js', 'worlds/runs.js');\n");
  ['worlds/runs_art.js', 'content/q_runs.js'].forEach(f => P.files.set(f, ''));
  pruneRuns(P, cfg); assert(!P.files.has('worlds/runs.js') && !/runs/.test(P.get('worlds/registry.js')), 'world must go when no level is left');
  P = new Project(); P.files.set('worlds/runs.js', mk('', '')); pruneRuns(P, cfg); assert(/id: 'r2'/.test(P.get('worlds/runs.js')), 'untagged levels stay');
});

const scratch = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'fam_test_'));
for (const [cfg, name] of [['family.example.json', 'sample'], ['examples/variant_home_dad_no_grandparent.json', 'dad-home-no-grandparent'], ['examples/variant_other_country_grandpa.json', 'oman-grandpa-4kids']]) {
  t('build ' + name + ': no old-family text, valid JS', () => {
    const out = path.join(scratch, name); const r = build(path.join(__dirname, cfg), out, new Set(['force', 'quiet', 'no-icons']));
    assert.strictEqual(r.syntax.length, 0, r.syntax.join('\n'));
    assert.strictEqual(r.leaks.length, 0, JSON.stringify(r.leaks.slice(0, 3)));
    assert(!fs.readdirSync(path.join(out, 'assets')).some(f => /cartoon/.test(f)), 'a base cartoon avatar was copied');
    assert(!fs.existsSync(path.join(out, 'tools')), 'tools/ must not ship');
    const man = JSON.parse(fs.readFileSync(path.join(out, 'assets', 'voice', 'manifest.json'), 'utf8')); assert.deepStrictEqual(man, {});
    if (name === 'sample') {   // world 11: exactly the generic levels survive; no relative-only art/themes/stickers/questions
      const rs = ['worlds/runs.js', 'worlds/runs2.js'].map(f => fs.readFileSync(path.join(out, f), 'utf8')).join('\n'), ids = [...rs.matchAll(/\{ id: '(r\d+)'|\n\s+id: '(r\d+)'/g)].map(m => m[1] || m[2]).sort((a, b) => a.slice(1) - b.slice(1));
      assert.deepStrictEqual(ids, ['r2', 'r4', 'r6', 'r7', 'r8', 'r11', 'r15'], 'runs levels: ' + ids);
      const art = fs.readFileSync(path.join(out, 'worlds', 'runs_art2.js'), 'utf8') + fs.readFileSync(path.join(out, 'worlds', 'runs_art.js'), 'utf8');
      assert(!/run_goal_(amani|kamal)|registerTheme\('(kamal|kitchen|dusk)'/.test(art), 'art of cut levels survived');
      assert(!/s_run_(med|kamal|lantern|cook|relay|air)\b/.test(rs), 'stickers of cut levels survived');
    }
    // the owner's extended family never ships
    for (const f of ['worlds/gathering.js', 'worlds/gathering_art.js', 'worlds/gathering_kits.js', 'content/q_gathering.js']) assert(!fs.existsSync(path.join(out, f)), f + ' must not ship');
    const reg = fs.readFileSync(path.join(out, 'worlds', 'registry.js'), 'utf8'); assert(!/gather/.test(reg), 'gathering still in registry');
    const sb = { M: {} }; vm.runInNewContext('M.plan = x => { PLAN = x; }; var PLAN; (function(){ var window = { Moody: { plan: M.plan, art: { registerAll() {} }, gfx: {}, load: [] } }; ' + reg.replace(/^\/\*[\s\S]*?\*\/\s*/, '') + ' })();', sb);   // the plan array must stay valid JS
    assert(Array.isArray(sb.PLAN) && sb.PLAN.length >= 7 && sb.PLAN.every(w => w && w.id), 'world plan has holes: ' + JSON.stringify(sb.PLAN && sb.PLAN.map(w => w && w.id)));
    const all = fs.readdirSync(path.join(out, 'worlds')).concat(fs.readdirSync(path.join(out, 'content'))).map(f => fs.readFileSync(path.join(out, fs.existsSync(path.join(out, 'worlds', f)) ? 'worlds' : 'content', f), 'utf8')).join('\n');
    assert(!/'(toti|amani|nada|kamal|luka|beno|medo|ofa)'/.test(all), 'an extended-family speaker id survived');
    if (fs.existsSync(path.join(out, 'worlds', 'nana.js'))) assert.strictEqual((fs.readFileSync(path.join(out, 'worlds', 'nana.js'), 'utf8').match(/id: 'm\d'/g) || []).length, 6, 'nana must have 6 missions (m7 cooking cut)');
    if (fs.existsSync(path.join(out, 'worlds', 'saudi.js'))) assert.strictEqual((fs.readFileSync(path.join(out, 'worlds', 'saudi.js'), 'utf8').match(/id: 'm\d'/g) || []).length, 7);
    assert(!/nana_cook|kitchensafety|f_amani|f_cousins|f_kamal|f_nada/.test(all + fs.readFileSync(path.join(out, 'engine', 'call.js'), 'utf8')), 'sticker/value of the relatives survived');
  });
}
console.log(pass + ' passed' + (process.exitCode ? ', SOME FAILED' : ''));
