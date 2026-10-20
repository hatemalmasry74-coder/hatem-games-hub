#!/usr/bin/env node
/* Verifies that the NEUTRAL narration hash is identical in JS (engine/voice.js) and Python (tools/voice_hash.py).
     node tools/play/check_neutral.js [voice_strings.json] [--engine path/to/voice.js]
   1. the two NT tables are equal;  2. for every raw string (+ a built-in corpus of tricky token shapes) x every grandmother / grandfather title the JS hash equals the Python hash.  Exit 1 on any difference. */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const a = process.argv.slice(2), ei = a.indexOf('--engine'), engine = ei >= 0 ? a.splice(ei, 2)[1] : path.join(__dirname, '..', '..', 'engine', 'voice.js'), file = a[0];
global.window = { Moody: { hooks: { frame: [] }, save: { data: { settings: {} } }, audio: { on: () => true } } }; global.location = { search: '' }; global.document = { addEventListener() { } };
require(path.resolve(engine)); const V = window.Moody.voice; V.neutral = true;
const GM = ['جدتي', 'تيتة', 'ننا', 'ستو', 'ماما'], GF = ['جدو', 'سيدو', 'جدي'];
const corpus = ['برافو يا {a}! {m} ولل{t} وب{gm} و{aunt1} لـ{school}', 'يا {gm}، {k2} {me} {gmn} {gft} يا {gf}', 'ل{n} و{cz2} ولل{uncle1n} {fr} يا {cz3} مطار {dcity} في {dcountry}', '{aunt2n} {unknown} {{m}} ب{aunt1}', 'سلّم على {gmt} ولـ{gm}.', 'يا   {m}  ،  وَالـ{a}'];
let raw = corpus.slice(); if (file && fs.existsSync(file)) raw = raw.concat(JSON.parse(fs.readFileSync(file, 'utf8')).map(i => i.raw || i.text));
const jobs = []; raw.forEach(r => GM.forEach(g => GF.forEach(f => jobs.push({ raw: r, gm: g, gf: f }))));
const js = jobs.map(j => { V.vars.gm = j.gm; V.vars.gf = j.gf; return [V.normalize(j.raw), V.hash(j.raw)]; });
const py = cp.spawnSync('python3', ['-I', '-c', 'import sys,json\nsys.path.insert(0,sys.argv[1])\nfrom voice_hash import normalize,voice_hash,NT\nj=json.load(sys.stdin)\nprint(json.dumps({"nt":NT,"r":[[normalize(x["raw"],True,{"gm":x["gm"],"gf":x["gf"]}),voice_hash(x["raw"],True,{"gm":x["gm"],"gf":x["gf"]})] for x in j]}))', path.join(__dirname, '..')], { input: JSON.stringify(jobs), encoding: 'utf8', maxBuffer: 1 << 28 });
if (py.status) { console.error(py.stderr); process.exit(2); }
const P = JSON.parse(py.stdout); let bad = 0;
if (JSON.stringify(P.nt) !== JSON.stringify(V.NT)) { bad++; console.log('NT TABLES DIFFER'); }
js.forEach((x, i) => { if (x[0] !== P.r[i][0] || x[1] !== P.r[i][1]) { if (bad++ < 8) console.log('MISMATCH', jobs[i].raw, '\n  js', x, '\n  py', P.r[i]); } });
console.log('strings', raw.length, 'x titles', GM.length * GF.length, '=', jobs.length, 'hash comparisons | tables equal:', JSON.stringify(P.nt) === JSON.stringify(V.NT), '| differences:', bad);
process.exit(bad ? 1 : 0);
