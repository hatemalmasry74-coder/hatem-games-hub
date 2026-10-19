#!/usr/bin/env node
/* Family Edition builder for «مودي وعبودي».
     node tools/family/build.js <config.json> <outdir> [--force] [--no-icons] [--quiet]
   Copies the base game to <outdir> (the base is NEVER modified) and patches the COPY:
     1. text   : every string literal / comment goes through one dictionary pass (names, relations, school, destination...),
                 preceded by a gender-agreement pass for heroes whose gender changed.  Clitics (و ل ب ف ك) are handled
                 (لمودي -> لياسين, ل+الطائف -> للطائف).  Everything is in lib/*.js and covered by tools/family/test.js.
     2. looks  : the single character table in engine/chars.js is patched row by row (names, ages, palette, hijab, glasses ...).
     3. assets : avatars (yours, re-encoded without metadata, or generated cartoon faces), PWA icons, manifest, titles, voice manifest emptied.
     4. logic  : tiers from ages, floors of the lift world, optional worlds (grandma / trip) switched off, storage key per edition.
   Anything it cannot decide ends up in <outdir>.meta/build-report.json (review list) - read it before shipping.
   Metadata lives OUTSIDE <outdir> so that <outdir> can be deployed as is. */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), vm = require('vm');
const { scan, join } = require('./lib/lexer');
const AR = require('./lib/ar');
const G = require('./lib/gender');
const CH = require('./lib/charspatch');
const LK = require('./lib/looks');
const AV = require('./lib/avatar');

const ROOT = path.resolve(__dirname, '..', '..');                 // the base game (moody/)
const SLOTS = ['moody', 'aboody', 'toota', 'nemo'];
const BASE = { moody: { gender: 'm', old: 'مودي', tok: '{m}' }, aboody: { gender: 'm', old: 'عبودي', tok: '{a}' }, toota: { gender: 'f', old: 'توتا', tok: '{t}' }, nemo: { gender: 'f', old: 'نيمو', tok: '{n}' }, nana: { gender: 'f', old: 'ننا', tok: null }, baba: { gender: 'm', old: 'بابا', tok: null } };
const DEFAULT_COUSINS = [{ name: 'ريم', age: 12, gender: 'f' }, { name: 'سلمى', age: 10, gender: 'f' }];

/* ------------------------------------------------------------------ args */
function parseArgs(argv) {
  const a = { _: [], flags: new Set() };
  argv.forEach(x => (x.startsWith('--') ? a.flags.add(x.slice(2)) : a._.push(x)));
  return a;
}
const jsq = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

/* ------------------------------------------------------------------ config */
function loadConfig(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8')), warn = [], err = [], base = path.dirname(path.resolve(file));
  const c = JSON.parse(JSON.stringify(raw));
  c._dir = base;
  const need = (cond, msg) => { if (!cond) err.push(msg); };
  c.edition = Object.assign({ id: 'family', title: null, subtitle: null, versionLabel: null }, c.edition || {});
  c.friendName = c.friendName || 'عادل';   // the neighbour/cousin friend that replaces the owner's cousin «أوفا» in the stories
  need(/^[a-z0-9][a-z0-9-]{1,40}$/.test(c.edition.id), 'edition.id must be a lowercase latin slug (a-z 0-9 -), used for the storage key');
  c.parents = Object.assign({ dad: 'بابا', mom: 'ماما' }, c.parents || {});
  c.dad = Object.assign({ status: 'abroad' }, c.dad || {});
  need(['abroad', 'home'].includes(c.dad.status), 'dad.status must be "abroad" or "home"');
  c.grandparent = Object.assign({ exists: true, sameBuilding: true, gender: 'f', title: 'ننا', name: '', homeFloor: 6, grandFloor: 3, look: {} }, c.grandparent || {});
  c.home = Object.assign({ city: 'القاهرة', country: 'مصر', airport: null }, c.home || {});
  c.home.airport = c.home.airport || 'مطار ' + c.home.city;
  c.school = Object.assign({ name: 'مدرسة آل زياد الابتدائية' }, c.school || {});
  c.destination = Object.assign({ preset: 'abha' }, c.destination || {});
  const kids = (c.kids || []).slice();
  need(kids.length >= 2 && kids.length <= 4, 'kids must have 2 to 4 children (slot 1 = older playable, slot 2 = younger playable, slots 3-4 = older siblings)');
  const extra = (c.extraChildren || []).slice();
  while (kids.length >= 2 && kids.length < 4) {
    const e = extra.shift() || DEFAULT_COUSINS[kids.length - 2];
    kids.push(Object.assign({ _filler: true }, e)); warn.push('slot ' + (kids.length) + ' (' + SLOTS[kids.length - 1] + ') is not one of your children: filled with "' + e.name + '" (extraChildren / default cousin). The stories show the older siblings with the family - review those scenes.');
  }
  if (kids.length < 2) return Object.assign(c, { _warn: warn, _err: err.concat(['(stopped: fix the kids list first)']), kids: [] });
  c.kids = kids.slice(0, 4).map((k, i) => {
    const o = Object.assign({ gender: BASE[SLOTS[i]].gender, look: {} }, k);
    need(o.name && typeof o.name === 'string', 'kids[' + i + '].name is required');
    need(['m', 'f'].includes(o.gender), 'kids[' + i + '].gender must be "m" or "f"');
    need(Number.isFinite(o.age), 'kids[' + i + '].age must be a number');
    o.nick = (o.nick || o.name).trim(); o.name = o.name.trim(); o.slot = SLOTS[i];
    if (i < 2) { o.tier = o.tier || (o.age <= 7 ? 6 : 9); need([6, 9].includes(o.tier), 'kids[' + i + '].tier must be 6 or 9'); if (o.age > 11) warn.push('kids[' + i + '] is ' + o.age + ': the hardest question tier in the game is "9 years" - the older kid may find it easy.'); if (o.age < 5) warn.push('kids[' + i + '] is ' + o.age + ': the easiest tier is "6 years" - needs an adult next to the child.'); }
    return o;
  });
  if (c.kids[0].age < c.kids[1].age) warn.push('kids[0] (' + c.kids[0].nick + ') is younger than kids[1]: slot 1 is drawn tall/strong and slot 2 small/quick (puzzles use that). Put the OLDER playable child first.');
  const names = [c.kids.map(k => k.nick), c.grandparent.title, c.parents.dad, c.parents.mom];
  if (new Set(c.kids.map(k => k.nick)).size !== 4) err.push('the four kid nicknames must be different');
  const gp = c.grandparent; if (!gp.exists && gp.title === 'ننا') { gp.title = 'جدتي'; gp.name = ''; } gp.full = gp.name ? gp.title + ' ' + gp.name : gp.title;
  need(['f', 'm'].includes(gp.gender), 'grandparent.gender must be "f" or "m"');
  if (gp.exists && gp.sameBuilding) {
    need(Number.isInteger(gp.homeFloor) && Number.isInteger(gp.grandFloor), 'grandparent.homeFloor / grandFloor must be integers');
    need(gp.homeFloor <= 8 && gp.grandFloor >= 1 && gp.homeFloor > gp.grandFloor, 'floors: the lift world supports buttons 1..8 and the family must live ABOVE the grandparent (homeFloor > grandFloor)');
  }
  if (gp.exists && !gp.sameBuilding) warn.push('grandparent.sameBuilding=false: the "grandparent house" world is built around the lift of the same building, so it is REMOVED from this edition.');
  if (gp.exists && gp.gender === 'm') warn.push('grandparent.gender="m" is EXPERIMENTAL: the grandparent is drawn/voiced/worded as a grandpa through the word table, read every line of that world.');
  if (!gp.exists) warn.push('no grandparent: the grandparent world, its sticker and the lines that mention the grandparent are removed/neutralised.');
  if (c.dad.status === 'home') warn.push('dad.status="home": the trip world and the daily "dad calls" button are removed. The dad still phones in the last mission of the grandparent world (review that line).');
  const d = c.destination; d.preset = d.preset || 'abha';
  need(['abha', 'custom'].includes(d.preset), 'destination.preset must be "abha" (keep the original) or "custom"');
  if (c.dad.status === 'abroad' && d.preset === 'custom') { need(d.city && d.country, 'destination.city and destination.country are required for a custom destination'); d.airport = d.airport || 'مطار ' + d.city; d.facts = d.facts || {}; }
  /* text that ends up inside JS string literals / HTML: no quotes, backslashes, braces or angle brackets */
  const texts = []; const walk = (v, p) => { if (typeof v === 'string') { if (!/(avatar|^_|\._)/.test(p)) texts.push([p, v]); } else if (v && typeof v === 'object') Object.keys(v).forEach(k => { if (!k.startsWith('_')) walk(v[k], p ? p + '.' + k : k); }); };
  walk({ edition: c.edition, kids: c.kids, parents: c.parents, grandparent: Object.assign({}, c.grandparent, { look: undefined }), home: c.home, school: c.school, destination: c.destination }, '');
  texts.forEach(([p, v]) => { if (/['"\\{}<>`$]/.test(v)) err.push(p + ': contains a quote, backslash, brace, < > or $ (' + v + ') - remove it'); });
  if (c.kids.some(k => k.nick === c.friendName)) err.push('friendName ("' + c.friendName + '") must differ from the kids\' nicknames: it names the generic friend of the stories');
  if (c.extendedFamily !== undefined) {
    const ef = c.extendedFamily || {};
    if (ef.enabled && !Array.isArray(ef.relatives)) err.push('extendedFamily.relatives must be a list of {role,name,gender,age}');
    (ef.relatives || []).forEach((r, i) => { if (!r || !r.role || !r.name) err.push('extendedFamily.relatives[' + i + '] needs role and name'); });
    warn.push('extendedFamily is accepted but NOT built yet: the owner\'s relatives world («تجمّع العائلة») and every relative-specific scene (aunts, uncle, cousins) are always REMOVED; the customer\'s own gathering world must be written by hand (see README).');
  }
  c.kids.forEach((k, i) => { if (k.nick && k.nick.length > 12) err.push('kids[' + i + '].nick is longer than 12 letters (the in-game name box allows 12)'); });
  c._warn = warn; c._err = err; return c;
}

/* ------------------------------------------------------------------ project files */
const COPY_DIRS = ['engine', 'content', 'worlds'];
function listFiles(dir, base) { let out = []; for (const f of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, f.name); if (f.isDirectory()) out = out.concat(listFiles(p, base)); else out.push(path.relative(base, p)); } return out; }
class Project {
  constructor() { this.files = new Map(); this.log = { patches: [], gender: [], genderMixed: [], review: [], warnings: [] }; }
  load() {
    COPY_DIRS.forEach(d => listFiles(path.join(ROOT, d), ROOT).forEach(f => this.files.set(f.replace(/\\/g, '/'), fs.readFileSync(path.join(ROOT, f), 'utf8'))));
    ['index.html', 'manifest.json', 'sw.js'].forEach(f => this.files.set(f, fs.readFileSync(path.join(ROOT, f), 'utf8')));
    this.files.set('pwa-game.js', fs.readFileSync(path.join(ROOT, '..', 'pwa-game.js'), 'utf8'));
  }
  get(f) { if (!this.files.has(f)) throw new Error('missing file ' + f); return this.files.get(f); }
  /* exact patch with drift detection (throws when the base game changed and the patch no longer applies) */
  rep(f, from, to, o) {
    o = o || {}; let s = this.get(f), n = 0;
    if (from instanceof RegExp) { const re = new RegExp(from.source, from.flags.includes('g') ? from.flags : from.flags + 'g'); n = (s.match(re) || []).length; s = s.replace(re, to); }
    else { const parts = s.split(from); n = parts.length - 1; s = parts.join(to); }
    if (!n && !o.optional) throw new Error('PATCH DRIFT in ' + f + ': pattern not found: ' + String(from).slice(0, 90));
    if (o.exact && n !== o.exact) throw new Error('PATCH DRIFT in ' + f + ': expected ' + o.exact + ' match(es), found ' + n + ': ' + String(from).slice(0, 90));
    this.files.set(f, s); this.log.patches.push({ file: f, what: o.what || String(from).slice(0, 60), n }); return n;
  }
  remove(f) { this.files.delete(f); }
}

/* ------------------------------------------------------------------ the dictionary */
function buildDictionaries(c) {
  const k = c.kids, gp = c.grandparent, pairs = [];
  SLOTS.forEach((s, i) => pairs.push([BASE[s].old, k[i].nick]));
  pairs.push(['أوفا', c.friendName]);   // the owner's cousin character becomes a generic friend
  pairs.push(['ننا زوزا', gp.full], ['ننا', gp.title], ['زوزا', gp.name || gp.title]);   // also without a grandparent: the engine still carries her default name
  if (c.parents.dad !== 'بابا') pairs.push(['بابا', c.parents.dad]);
  if (c.parents.mom !== 'ماما') pairs.push(['ماما', c.parents.mom]);
  pairs.push(['مدرسة آل زياد الابتدائية', c.school.name], ['آل زياد', c.school.name.replace(/^مدرسة\s+/, '').replace(/\s+الابتدائية$/, '')]);
  const general = AR.wordReplacer(pairs);
  /* scoped to the files that talk about the family's own city/country (NOT the general Egypt trivia of the question banks) */
  const homePairs = [['مطار القاهرة', c.home.airport], ['القاهرة', c.home.city], ['مصر', c.home.country]];
  const homeScope = AR.wordReplacer(homePairs);
  const d = c.destination, destPairs = [];
  if (c.dad.status === 'abroad' && d.preset === 'custom') {
    const regionShort = (d.region || '').replace(/^منطقة\s+/, '');
    if (d.airport) destPairs.push(['مطار أبها', d.airport]);
    if (d.region) destPairs.push(['منطقة عسير', d.region]);
    destPairs.push(['جبال عسير', 'جبال ' + d.city], ['الطراز العسيري', d.architectureStyle || 'الطراز المحلي']);
    if (d.mountain) destPairs.push(['جبال السودة', 'جبال ' + d.mountain.replace(/^جبل\s+/, '')], ['جبل السودة', 'جبل ' + d.mountain.replace(/^جبل\s+/, '')], ['السودة', d.mountain.replace(/^جبل\s+/, '')]);
    destPairs.push(['أبها', d.city], ['عسير', regionShort || d.city], ['السعودية', d.country]);
    if (d.country !== 'السعودية') destPairs.push(['المملكة', 'البلد']);
  }
  const destScope = AR.wordReplacer(destPairs);
  return { general, homeScope, destScope, pairs, destPairs };
}
const HOME_FILES = new Set(['worlds/saudi.js', 'worlds/saudi_art.js', 'content/q_saudi.js']);
const DEST_FILES = new Set(['worlds/runs.js', 'content/q_runs.js', 'worlds/saudi.js', 'worlds/saudi_art.js', 'content/q_saudi.js', 'content/baba_calls.js', 'engine/call.js', 'worlds/registry.js', 'worlds/nana.js', 'worlds/home.js']);

/* ------------------------------------------------------------------ text pass */
const LET = '\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06D3';
function textPass(P, c, dicts) {
  const gen = {};   // slot -> 'm2f' | 'f2m' for heroes whose gender differs from the base game
  SLOTS.concat(['nana']).forEach(s => { const g = s === 'nana' ? c.grandparent.gender : c.kids[SLOTS.indexOf(s)].gender; if (g !== BASE[s].gender) gen[s] = g === 'f' ? 'm2f' : 'f2m'; });
  const hasGen = Object.keys(gen).length > 0;
  const mention = {};   // slot -> regex source detecting the hero (old name with clitics, or the {token})
  Object.keys(BASE).forEach(s => { if (s === 'baba') return; mention[s] = '(?<![' + LET + '])[وفبكل]{0,2}' + AR.esc(BASE[s].old) + '(?![' + LET + '])' + (BASE[s].tok ? '|' + AR.esc(BASE[s].tok) : ''); });
  const named = pre => Object.keys(mention).map(s => '(?<' + pre + s + '>' + mention[s] + ')').join('|');
  const slotOf = m => { const k = Object.keys(m.groups).find(k => m.groups[k] !== undefined); return k && k.slice(2); };
  const reAny = () => new RegExp(named('g_'), 'gu'), reVoc = () => new RegExp('يا\\s+(?:' + named('g_') + ')', 'gu');
  const mentionChanged = new RegExp(Object.keys(gen).map(s => mention[s]).join('|') || '(?!)', 'u');
  const SECOND = new RegExp('(?<![' + LET + '])(وانت|انت|إنت|أنت)(?![' + LET + '])');
  /* split a clause into pieces owned by a hero; text before the first mention is owned by the speaker (or by the vocative) */
  function pieces(txt, lead) {
    const ms = [...txt.matchAll(reAny())].map(m => ({ i: m.index, slot: slotOf(m) }));
    if (!ms.length) return { list: [{ slot: lead, text: txt, speaker: true }], count: 0 };
    const list = [], voc = /يا\s+$/.test(txt.slice(0, ms[0].i));
    if (ms[0].i > 0) list.push({ slot: voc ? ms[0].slot : lead, text: txt.slice(0, ms[0].i), speaker: !voc });
    ms.forEach((m, k) => list.push({ slot: m.slot, text: txt.slice(m.i, k + 1 < ms.length ? ms[k + 1].i : txt.length) }));
    return { list, count: ms.length };
  }
  /* gender agreement for one string literal; returns the new literal (quotes included) or null */
  function genderString(t, speaker) {
    const parts = t.split(G.CLAUSE); let any = false, addressee = null;
    for (let i = 0; i < parts.length; i += 2) {                    // even = clause text, odd = delimiter
      const pc = pieces(parts[i], speaker);
      let out = pc.list.map(p => {
        const dir = gen[p.slot]; if (!dir) return p.text;
        const r = G.agree(p.text, dir, { pronouns: !p.speaker && pc.count <= 1, speaker: !!p.speaker });
        if (r.changed.length) { any = true; return r.text; } return p.text;
      });
      // "شكرًا يا {a}! أنت صاحب حقيقي": a clause without a name that says "you ..." belongs to the last addressee
      if (pc.count === 0 && addressee && gen[addressee] && SECOND.test(parts[i])) { const r = G.agree(parts[i], gen[addressee], { pronouns: false }); if (r.changed.length) { any = true; out = [r.text]; } }
      const vs = [...parts[i].matchAll(reVoc())]; if (vs.length) addressee = slotOf(vs[vs.length - 1]);
      parts[i] = out.join('');
    }
    return any ? parts.join('') : null;
  }
  for (const [f, src] of P.files) {
    if (!/\.(js|html|json|css)$/.test(f)) continue;
    const dest = DEST_FILES.has(f), home = HOME_FILES.has(f);
    const map = t => { let o = dicts.general(t); if (home) o = dicts.homeScope(o); if (dest) o = dicts.destScope(o); return o; };
    if (f.endsWith('.css')) { P.files.set(f, src.replace(/Moody & Aboody/g, 'Family Edition')); continue; }
    if (!f.endsWith('.js')) { P.files.set(f, map(src)); continue; }
    const segs = scan(src); let prev = '';        // last ~100 chars before the current segment (to find the speaker of a say-line)
    for (const sg of segs) {
      if (sg.type === 'code' || sg.type === 'regex') { prev = (prev + sg.text).slice(-100); continue; }
      if (sg.type === 'comment') {
        sg.text = map(sg.text.replace(/Moody & Aboody/g, 'Family Edition').replace(/Nana Zoza/g, 'the grandparent').replace(/\bAboody\b/g, 'the younger hero').replace(/(?<![.\w])Moody\b(?![.(\[\w])/g, 'the older hero').replace(/\bAbha\b/g, 'the destination city').replace(/\bAsir\b/g, 'the region').replace(/\bAl-Qatt Al-Asiri\b/g, 'regional').replace(/\bAsiri\b/g, 'regional').replace(/\bSouda\b/g, 'the mountain'));
        prev = (prev + sg.text).slice(-100); continue;
      }
      let t = sg.text;                              // string literal (quotes included)
      if (hasGen) {
        const sp = /[(\[]\s*'(moody|aboody|toota|nemo|nana|baba)'\s*,\s*$/.exec(prev), speaker = sp ? sp[1] : null;
        if ((speaker && gen[speaker]) || mentionChanged.test(t) || SECOND.test(t)) {
          const nt = genderString(t, speaker);
          if (nt) { P.log.gender.push({ file: f, before: t.slice(1, -1), after: nt.slice(1, -1) }); t = nt; }
          else if (f.startsWith('worlds/') && SECOND.test(t) && !/يا\s+(?:\{m\}|مودي)/.test(t)) P.log.genderMixed.push({ file: f, text: t.slice(1, -1), note: 'says "انت" (masculine) to somebody - check who is addressed' });
        }
      }
      sg.text = map(t); prev = (prev + sg.text).slice(-100);
    }
    P.files.set(f, join(segs));
  }
}

/* ------------------------------------------------------------------ the owner's extended family (never shipped to other families) */
const EXT_IDS = ['ofa', 'toti', 'amani', 'nada', 'beno', 'medo', 'kamal', 'luka'];
const EXT_WORDS = ['أوفا', 'توتي', 'أماني', 'عمتو ندى', 'بينو', 'ميدو', 'عمو كمال', 'لوكا'];
function stripExtendedFamily(P, c) {
  /* 1. stories: the cousin speaks as the generic 'friend' (his name is replaced by c.friendName in the text pass) */
  for (const f of [...P.files.keys()]) if (/^worlds\/[^/]+\.js$/.test(f)) P.rep(f, /'ofa'/g, "'friend'", { optional: true, what: 'cousin -> generic friend speaker' }), P.rep(f, /'face:ofa'/g, "'friend'", { optional: true, what: 'cousin portrait -> friend icon' });
  P.rep('engine/ui.js', "{ mama: 'ماما' }[who]", "{ mama: 'ماما', friend: " + jsq(c.friendName) + " }[who]", { what: 'default name of the friend NPC' });
  /* 2. character table rows + marker comment */
  P.rep('engine/chars.js', /\n[ \t]*\/\* ---- extended family[^\n]*\*\//, '', { what: 'extended-family comment' });
  P.rep('engine/chars.js', new RegExp('\\n[ \\t]*(?:' + EXT_IDS.join('|') + '): \\{[^\\n]*\\},?', 'g'), '', { what: 'extended-family character rows', exact: EXT_IDS.length });
  /* 3. speaker -> voice map */
  P.rep('engine/voice.js', /\n[ \t]*Object\.assign\(VOICES, \{[^\n]*\n/, '\n', { what: 'extended-family voices' });
  /* 4. family stickers of the relatives */
  P.rep('engine/call.js', /, \{ id: 'f_(?:amani|nada|kamal|cousins)'[^}]*\}/g, '', { what: 'relatives stickers', exact: 4 });
  P.rep('engine/call.js', ", 15: 'f_amani', 18: 'f_nada', 21: 'f_kamal', 24: 'f_cousins'", '', { what: 'relatives sticker rewards' });
}

/* ------------------------------------------------------------------ the owner's extended-family STORIES (cut out; never shipped to other families)
   Every cut is an exact patch with a match count: if the base game changes, the build FAILS instead of shipping a half-cut story. */
function stripOwnerFamilyStories(P, c) {
  /* world 10 "تجمّع العائلة": entirely about the owner's relatives -> removed completely (plan card, loader, 4 files = its questions, stickers, values, art, voice strings) */
  removeWorld(P, 'gathering', ['worlds/gathering.js', 'worlds/gathering_art.js', 'worlds/gathering_kits.js', 'content/q_gathering.js'], /\n\s*\{ id: 'gathering', order: 10[^\n]*\},?/, /\n\s*M\.load\.push\('content\/q_gathering\.js'[^\n]*/);
  /* world 7 (grandma's house): mission 7 "cooking with aunt Amani" + Nada's phone gag + Toti cameo */
  const N = 'worlds/nana.js';
  P.rep(N, /\n[ \t]*\/\* ============ 7\) [^\n]*\n[ \t]*\{\n[ \t]*id: 'm7'[\s\S]*?\n      \}\n(?=    \])/, '\n', { what: 'nana m7 (cooking with the owner\'s aunt)', exact: 1 });
  P.rep(N, /[ \t]*\{ id: 'nana_cook'[^}]*\}, /, '', { what: 'sticker of nana m7', exact: 1 });
  P.rep(N, /\n[ \t]*M\.registerValue\('kitchensafety'[^\n]*/, '', { what: 'value only used by nana m7', exact: 1 });
  P.rep(N, /ALL6 = ALL5\.concat\(\['nada'\]\);[^\n]*/, 'ALL6 = ALL5;', { what: 'no aunt on stage', exact: 1 });
  P.rep(N, /\n[ \t]*await ctx\.say\('nada',[^\n]*/g, '', { what: 'Nada phone-gag lines (m4-m6)', exact: 4 });
  P.rep(N, "\n          await ctx.say('aboody', 'إزيّك يا عمتو ندى؟ إحنا هنا!');", '', { what: 'greeting of the aunt', exact: 1 });
  P.rep(N, "\n          await ctx.say('nana', 'سيبوها يا ولاد، بتطمّن على حد من العيلة. يلا نلاقي الألبوم.');", '', { what: 'line about the aunt', exact: 1 });
  P.rep('content/q_nana.js', /\n[ \t]*Q\([69], '(?:spoons|hotpot|cup|skill)'[^\n]*/g, '', { what: 'questions of nana m7', exact: 4 });
  /* world 8 (trip): Uncle Kamal and the gift for his son Luka */
  const S = 'worlds/saudi.js';
  P.rep(S, /WITHKAMAL = WITHBABA\.concat\(\['kamal'\]\);[^\n]*/, 'WITHKAMAL = WITHBABA;', { what: 'no uncle on stage', exact: 1 });
  P.rep(S, /\n[ \t]*await ctx\.say\('kamal', 'وأنا كمان عايز أبعت هدية[^\n]*\n[ \t]*const lk = await ctx\.games\.dragdrop\(\{[\s\S]*?\n[ \t]*\}\);/, '', { what: 'gift-for-Luka drag&drop', exact: 1 });
  P.rep(S, "st.hero('kamal').visible = true; ", '', { what: 'uncle appears at arrivals', exact: 1 });
  P.rep(S, " st.play('kamal', 'wave', 2);", '', { what: 'uncle waves', exact: 1 });
  P.rep(S, "'بابا!!! ده بابا! ومعاه عمو كمال!'", "'بابا!!! ده بابا!'", { what: 'arrival line', exact: 1 });
  P.rep(S, "\n          await ctx.say('baba', 'بطّل فضايح يا كمال!');", '', { what: 'dad answering the uncle', exact: 1 });
  P.rep(S, "\n          await ctx.say('aboody', 'وسلّم لي على لوكا! قول له عبودي بيسلّم عليك.');", '', { what: 'greeting to Luka', exact: 1 });
  P.rep(S, /\n[ \t]*await ctx\.say\('kamal',[^\n]*/g, '', { what: 'Uncle Kamal lines', exact: 9 });
  P.rep(S, /, kamal: \{ x: 880, y: 490, dir: -1 \}/g, '', { what: 'uncle position in the scenes', exact: 3 });
  pruneRuns(P, c);
  /* guard: no extended-family id may survive in any story/engine file (stage.js keeps harmless slot tables) */
  for (const [f, src] of P.files) if (/@owner-family/.test(src)) throw new Error('@owner-family tag left in ' + f + ' (a level could not be cut: tag must sit on a mission object of worlds/runs.js)');
  for (const [f, src] of P.files) if (/^(worlds|content)\//.test(f)) { const m = /'(toti|amani|nada|kamal|luka|beno|medo)'|face:(toti|amani|nada|kamal|luka|beno|medo)/.exec(src); if (m) throw new Error('EXTENDED FAMILY LEFT in ' + f + ': ' + m[0]); }
}

/* ------------------------------------------------------------------ world 11 «سباق المغامرة»: levels that belong to the owner's family are cut
   A level is removed when (a) its object carries the literal comment  / * @owner-family * /  (anywhere inside the object or in the comment block right before it), or
   (b) it needs scenes of a world this edition does not have (grandma's house: nn_* rooms / 'nana' goal; trip world: saudi* rooms / theme 'abha').
   Stickers and values only the removed levels used are removed too; if no level is left the whole world goes. Works for any number of levels. */
function splitArrayObjects(src, openIdx) {
  const segs = scan(src); let pos = 0, depth = 0, started = false; const objs = []; let cur = null, close = -1;
  for (const sg of segs) {
    if (sg.type === 'code') for (let i = 0; i < sg.text.length && close < 0; i++) {
      const ch = sg.text[i], at = pos + i;
      if (!started) { if (at === openIdx) started = true; continue; }
      if (ch === '{' || ch === '[' || ch === '(') { if (depth === 0 && ch === '{') cur = { start: at }; depth++; }
      else if (ch === '}' || ch === ')' || ch === ']') { if (depth === 0 && ch === ']') { close = at; break; } depth--; if (depth === 0 && cur) { cur.end = at + 1; objs.push(cur); cur = null; } }
    }
    pos += sg.text.length;
  }
  if (close < 0) throw new Error('runs.js: missions array not closed');
  return { objs, close };
}
function pruneRuns(P, c) {
  const F = 'worlds/runs.js'; if (!P.files.has(F)) return;
  let src = P.get(F); const key = 'missions: [', k0 = src.indexOf(key); if (k0 < 0) throw new Error('PATCH DRIFT in ' + F + ': "missions: [" not found');
  const open = k0 + key.length - 1, { objs, close } = splitArrayObjects(src, open);
  const nanaGone = !(c.grandparent.exists && c.grandparent.sameBuilding), saudiGone = c.dad.status === 'home';
  const items = []; let prevEnd = open + 1;
  for (const o of objs) { items.push({ gap: src.slice(prevEnd, o.start).replace(/^\s*,/, ''), obj: src.slice(o.start, o.end) }); prevEnd = o.end; }
  const why = it => { const t = it.gap + it.obj;
    if (/@owner-family/.test(t)) return 'tagged @owner-family';
    if (nanaGone && /\bnn_[a-z]|run_goal_nana|who: 'nana'/.test(it.obj)) return 'needs the grandparent-house scenes';
    if (saudiGone && /\bsaudi[A-Z]\w*|theme: 'abha'/.test(it.obj)) return 'needs the trip-world scenes';
    return null; };
  const keep = [], dropped = [];
  items.forEach(it => { const w = why(it); if (w) dropped.push({ id: (/id: '([^']+)'/.exec(it.obj) || [])[1], title: (/title: '([^']+)'/.exec(it.obj) || [])[1], why: w, obj: it.obj }); else keep.push(it); });
  if (!dropped.length) return;
  src = src.slice(0, open + 1) + keep.map((it, i) => (i ? ',' : '') + it.gap + it.obj).join('') + src.slice(prevEnd);
  const used = (re, text) => new Set([...text.matchAll(re)].map(m => m[1]));
  const keptText = keep.map(k => k.obj).join('\n');
  dropped.forEach(d => { const st = (/sticker: '([^']+)'/.exec(d.obj) || [])[1]; if (st && !new RegExp("sticker: '" + st + "'").test(keptText)) src = src.replace(new RegExp("[ \\t]*\\{ id: '" + st + "'[^}]*\\},?[ \\t]*\\n?"), ''); });
  const stillUsed = new Set([...keptText.matchAll(/values: \[([^\]]*)\]/g)].flatMap(m => [...m[1].matchAll(/'([^']+)'/g)].map(x => x[1])));
  const outside = src.replace(/M\.registerValue\([^\n]*/g, '');
  dropped.forEach(d => { for (const m of d.obj.matchAll(/values: \[([^\]]*)\]/g)) for (const v of m[1].matchAll(/'([^']+)'/g)) if (!stillUsed.has(v[1]) && !new RegExp("'" + v[1] + "'").test(outside)) src = src.replace(new RegExp("\\n[ \\t]*M\\.registerValue\\('" + v[1] + "'[^\\n]*"), ''); });
  P.files.set(F, src); P.log.review.push('runs world: removed level(s) ' + dropped.map(d => d.id + ' «' + d.title + '» (' + d.why + ')').join(', ') + '; kept ' + keep.length);
  P.log.patches.push({ file: F, what: 'runs levels removed: ' + dropped.map(d => d.id + ':' + d.why).join(', '), n: dropped.length });
  if (saudiGone && P.files.has('content/q_runs.js')) P.rep('content/q_runs.js', /\n[ \t]*q\('b\d', \d, '[a-z_]+', \['runs_abha'\][^\n]*/g, '', { what: 'runs: questions of the removed trip level', optional: true });
  if (!keep.length) removeWorld(P, 'runs', ['worlds/runs.js', 'worlds/runs_art.js', 'content/q_runs.js'], /\n\s*\{ id: 'runs', order: 11[^\n]*\},?/, /\n\s*M\.load\.push\('content\/q_runs\.js'[^\n]*/);
}

/* ------------------------------------------------------------------ main build steps */
function genericPatches(P, c) {
  const k = c.kids, id = c.edition.id, ar = AR.arDigits;
  /* --- storage key / caches / hub coupling --- */
  P.rep('engine/core.js', "M.SAVE_KEY = 'hub_moody_v1'", "M.SAVE_KEY = 'fam_" + id + "_v1'", { what: 'save key per edition (several editions on one origin must not share progress)' });
  P.rep('engine/core.js', /\n\s*try \{ const n = localStorage\.getItem\('hubPlayerName'\);[^\n]*\n/, '\n', { what: 'drop hub player-name coupling' });
  P.rep('sw.js', "const C='moody-v1'", "const C='moody-" + id + "-v1'", { what: 'service worker cache name' });
  P.rep('index.html', '<meta charset="utf-8">', '<meta charset="utf-8">\n<meta name="robots" content="noindex,nofollow,noarchive">\n<meta name="referrer" content="no-referrer">', { what: 'private edition: not for search engines' });
  P.rep('index.html', '<script defer src="../pwa-game.js"></script>', '<script defer src="pwa-game.js"></script>', { what: 'standalone pwa helper (no ../)' });
  P.rep('engine/audio.js', 'cheer(kind) {', 'cheer(kind) { return; /* standalone edition: no cross-game clips */', { what: 'disable cross-game cheer clips' });
  P.rep('engine/audio.js', "'../sonic/assets/v/'", "'assets/v/'", { what: 'dead path of the disabled cheer clips' });
  P.rep('engine/ui.js', /const hubLink = \(\) => h\('a', \{[^\n]*\n/, 'const hubLink = () => null;\n', { what: 'no link to the games hub' });
  /* --- titles --- */
  const title = c.edition.title || (k[0].nick + ' و' + k[1].nick), sub = c.edition.subtitle || 'يوميات ومغامرات';
  P._title = title;
  P.rep('engine/ui.js', "h('div', { class: 'title' }, 'مودي وعبودي')", "h('div', { class: 'title'" + (title.length > 14 ? ", style: 'font-size:" + Math.max(40, Math.floor(1100 / title.length)) + "px;white-space:nowrap'" : '') + ' }, ' + jsq(title) + ')', { what: 'title screen' });
  P.rep('engine/ui.js', "h('div', { class: 'ttl-tag' }, 'يوميات ومغامرات')", "h('div', { class: 'ttl-tag' }, " + jsq(sub) + ')', { what: 'title screen subtitle' });
  if (c.edition.versionLabel) P.rep('engine/ui.js', "'الإصدار ١'", jsq(c.edition.versionLabel), { what: 'version label' });
  P.rep('index.html', /<title>[^<]*<\/title>/, '<title>' + title + '</title>', { what: 'html title' });
  P.rep('index.html', /apple-mobile-web-app-title" content="[^"]*"/, 'apple-mobile-web-app-title" content="' + title + '"', { what: 'ios app title' });
  const mf = JSON.parse(P.get('manifest.json')); mf.name = title; mf.short_name = title.length > 14 ? k[0].nick : title; mf.id = './?edition=' + id; P.files.set('manifest.json', JSON.stringify(mf, null, 1));
  /* --- tiers from ages --- */
  P.rep('engine/ctx.js', "return who === 'aboody' ? 6 : 9;", "return who === 'aboody' ? " + k[1].tier + " : who === 'moody' ? " + k[0].tier + ' : 9;', { what: 'tiers from ages' });
  const a1 = ar(k[0].age), a2 = ar(k[1].age);
  P.rep('engine/ui.js', "'تلقائي: عبودي (٦ سنين) بيجاوب ألغاز أسهل ومودي (٩ سنين) ألغاز أصعب.'", k[0].tier === k[1].tier ? jsq('تلقائي: كل بطل بيجاوب ألغاز على قد سنّه.') : jsq('تلقائي: عبودي (' + a2 + ' سنين) بيجاوب ألغاز ' + (k[1].tier < k[0].tier ? 'أسهل ومودي (' + a1 + ' سنين) ألغاز أصعب.' : 'أصعب ومودي (' + a1 + ' سنين) ألغاز أسهل.')), { what: 'parent panel age text' });
  /* --- voice defaults + speaker voice per gender --- */
  const vo = (s, big) => { const g = s === 'nana' ? c.grandparent.gender : c.kids[SLOTS.indexOf(s)].gender; return g === 'f' ? (big ? 'girl_big' : 'girl_small') : (big ? 'boy_big' : 'boy_small'); };
  P.rep('engine/voice.js', "moody: 'boy_big', aboody: 'boy_small', mama: 'mama', baba: 'baba', toota: 'girl_big', nemo: 'girl_small', nana: 'nana',",
    'moody: ' + jsq(vo('moody', true)) + ', aboody: ' + jsq(vo('aboody', false)) + ", mama: 'mama', baba: 'baba', toota: " + jsq(vo('toota', true)) + ', nemo: ' + jsq(vo('nemo', false)) + ', nana: ' + jsq(c.grandparent.gender === 'f' ? 'nana' : 'baba') + ',', { what: 'speaker -> voice id by gender' });
  /* --- automatic reactions (content/reactions.js): each hero speaks from the pool of its VOICE class, so a girl in a boy slot gets the girls' pool (no text rewriting) --- */
  const VK = { moody: vo('moody', true), aboody: vo('aboody', false), toota: vo('toota', true), nemo: vo('nemo', false) };
  const v2id = { boy_big: 'moody', boy_small: 'aboody', girl_big: 'toota', girl_small: 'nemo' };   // classic defaults, kept when no hero uses a class
  SLOTS.slice().reverse().forEach(s => { v2id[VK[s]] = s; });                                  // first slot (in order) wins a shared class
  P.rep('content/reactions.js', "const V2ID = { boy_big: 'moody', boy_small: 'aboody', girl_big: 'toota', girl_small: 'nemo',", 'const V2ID = { boy_big: ' + jsq(v2id.boy_big) + ', boy_small: ' + jsq(v2id.boy_small) + ', girl_big: ' + jsq(v2id.girl_big) + ', girl_small: ' + jsq(v2id.girl_small) + ',', { what: 'reactions: voice class -> hero', exact: 1 });
  P.rep('content/reactions.js', "const ID2V = { moody: 'boy_big', aboody: 'boy_small', toota: 'girl_big', nemo: 'girl_small',", 'const ID2V = { moody: ' + jsq(VK.moody) + ', aboody: ' + jsq(VK.aboody) + ', toota: ' + jsq(VK.toota) + ', nemo: ' + jsq(VK.nemo) + ',', { what: 'reactions: hero -> voice class', exact: 1 });
  P.rep('content/reactions.js', /, ofa: 'boy_big', beno: 'boy_big', medo: 'boy_big', luka: 'boy_small', toti: 'girl_small'/, '', { what: 'reactions: no relatives', exact: 1 });
  P.rep('content/reactions.js', 'const BOYS = { moody: 1, aboody: 1 };', 'const BOYS = { ' + SLOTS.filter((s, i) => k[i].gender === 'm').map(s => s + ': 1').join(', ') + ' };', { what: 'reactions: lines for boys only', exact: 1 });
  /* --- school signboard fits the name --- */
  const sn = c.school.name;
  P.rep('worlds/school_art.js', /G\.text\(g, 'مدرسة آل زياد الابتدائية', 465, 217, \{ size: 17,/, () => 'G.text(g, ' + jsq('مدرسة آل زياد الابتدائية') + ', 465, 217, { size: ' + Math.min(17, Math.floor(214 / (sn.length * .58))) + ',', { what: 'school sign (front)' });
  P.rep('worlds/school_art.js', /G\.text\(g, 'مدرسة آل زياد الابتدائية', 200, 128, \{ size: 14,/, () => 'G.text(g, ' + jsq('مدرسة آل زياد الابتدائية') + ', 200, 128, { size: ' + Math.min(14, Math.floor(330 / (sn.length * .58))) + ',', { what: 'school sign (yard)' });
}

function floorPatches(P, c) {
  const gp = c.grandparent, F = gp.homeFloor, Gf = gp.grandFloor, ar = AR.arDigits, ordF = AR.ORD[F], ordG = AR.ORD[Gf];
  const lal = o => 'لل' + o.slice(2);
  const nanaFiles = ['worlds/nana.js', 'worlds/home.js', 'worlds/nana_kits.js', 'content/q_nana.js'];
  // numeric / structural
  P.rep('worlds/nana.js', 'liftFloor: 6', 'liftFloor: ' + F, { what: 'lift start floor (hall)' });
  P.rep('worlds/nana.js', 'floor: 6, doors: 0', 'floor: ' + F + ', doors: 0', { what: 'lift start floor (cabin)' });
  P.rep('worlds/nana.js', 'target: 3, from: 6', 'target: ' + Gf + ', from: ' + F, { what: 'lift kit target/from' });
  P.rep('worlds/nana.js', "o.target || 3", "o.target || " + Gf, { optional: true });
  const cd = []; for (let f = F - 1; f >= Gf; f--) cd.push(AR.COUNT[f] || ar(f));
  P.rep('worlds/nana.js', "'نزلنا خمسة.. أربعة.. تلاتة! وصلنا لننا!'", jsq('نزلنا ' + (cd.length ? cd.join('.. ') : 'الدور') + '! وصلنا لننا!'), { what: 'lift countdown line' });
  P.rep('worlds/nana_kits.js', 'target = o.target || 3, from = o.from || 6', 'target = o.target || ' + Gf + ', from = o.from || ' + F, { what: 'lift kit defaults' });
  P.rep('worlds/nana_art.js', "G.text(g, '٦', 115, 128", 'G.text(g, ' + jsq(ar(F)) + ', 115, 128', { what: 'hall sign' });
  P.rep('worlds/nana_art.js', "G.text(g, '٣', 450, 110", 'G.text(g, ' + jsq(ar(Gf)) + ', 450, 110', { what: 'door sign' });
  P.rep('worlds/nana_art.js', 'S.liftFloor == null ? 6 :', 'S.liftFloor == null ? ' + F + ' :', { what: 'default hall floor' });
  P.rep('worlds/nana_art.js', 'S.floor == null ? 6 :', 'S.floor == null ? ' + F + ' :', { what: 'default cabin floor' });
  // wording (only phrases that mean "floor", the same ordinals mean other things elsewhere: "المفتاح التالت")
  nanaFiles.forEach(f => {
    P.rep(f, /(الدور|دور)\s+(السادس|التالت)/g, (m, w, o) => w + ' ' + (o === 'السادس' ? ordF : ordG), { optional: true, what: 'ordinals of the two floors' });
  });
  P.rep('worlds/nana.js', 'للتالت', lal(ordG), { what: 'diary: to the Nth floor' });
  // questions that contain floor arithmetic: regenerated lines (one question per line in q_nana.js)
  const diff = F - Gf, k = Gf >= 3 ? 2 : Gf === 2 ? 1 : -1, end = Gf - k;
  const uniq = a => [...new Set(a)].filter(x => x >= 0);
  const ch = (right, others) => { const arr = uniq([right].concat(others)).slice(0, 3); while (arr.length < 3) arr.push(arr[arr.length - 1] + 1); return '[' + arr.map(x => jsq(ar(x))).join(', ') + ']'; };
  const cnt = []; for (let i = 1; i <= Gf; i++) cnt.push(AR.COUNT[i] || ar(i));
  P.rep('content/q_nana.js', /^\s*Q\(6, 'floor',.*$/m, "  Q(6, 'floor', 'counting', " + jsq('ننا في الدور ' + ordG + '. عدّ معايا: ' + cnt.slice(0, 2).join('، ') + (Gf > 2 ? '، ..؟' : '..؟')) + ', ' + ch(Gf, [Gf + 2, Gf + 1]) + ', ' + jsq(cnt.join('، ')) + ', { explain: ' + jsq('تمام! ننا في الدور ' + ordG + '.') + ' });', { what: 'question: count to the grandparent floor' });
  const downQ = k > 0 ? 'نزلنا من الدور ' + ar(F) + ' لدور ' + ar(Gf) + '، وبعدين نزلنا ' + (k === 1 ? 'دور واحد' : 'دورين') + ' كمان. وصلنا لدور كام؟' : 'نزلنا من الدور ' + ar(F) + ' لدور ' + ar(Gf) + '، وبعدين طلعنا دور واحد. وصلنا لدور كام؟';
  const downHint = k > 0 ? ar(F) + ' − ' + ar(Gf) + ' = ' + ar(diff) + '، وبعدين ' + ar(Gf) + ' − ' + ar(k) : ar(F) + ' − ' + ar(Gf) + ' = ' + ar(diff) + '، وبعدين ' + ar(Gf) + ' + ١';
  const downExp = k > 0 ? ar(Gf) + ' − ' + ar(k) + ' = ' + ar(end) + (end === 1 ? '، يعني الدور الأول.' : '.') : ar(Gf) + ' + ١ = ' + ar(end) + '.';
  P.rep('content/q_nana.js', /^\s*Q\(9, 'down',.*$/m, "  Q(9, 'down', 'math', " + jsq(downQ) + ', ' + ch(end, [end + 1, end - 1 > 0 ? end - 1 : end + 2]) + ', ' + jsq(downHint) + ', { explain: ' + jsq(downExp) + ' });', { what: 'question: floors down' });
  const dw = diff === 1 ? 'دور واحد' : diff === 2 ? 'دورين' : ar(diff) + ' أدوار';
  P.rep('content/q_nana.js', /^\s*Q\(9, 'between',.*$/m, "  Q(9, 'between', 'math', " + jsq('ننا في الدور ' + ar(Gf) + ' واحنا في الدور ' + ar(F) + '. كام دور بيفصل بينا؟') + ', ' + ch(diff, [diff + 1, diff - 1 > 0 ? diff - 1 : diff + 2]) + ', ' + jsq(ar(F) + ' − ' + ar(Gf)) + ', { explain: ' + jsq('الفرق ' + dw + '.') + ' });', { what: 'question: floors between' });
}

/* worlds that can be switched off */
function removeWorld(P, id, files, planRe, loadRe) {
  P.rep('worlds/registry.js', planRe, '', { what: 'remove world card ' + id });
  P.rep('worlds/registry.js', loadRe, '', { what: 'remove loader for ' + id });
  files.forEach(f => P.remove(f));
}
function optionalWorlds(P, c) {
  const gp = c.grandparent;
  if (!(gp.exists && gp.sameBuilding)) {
    removeWorld(P, 'nana', ['worlds/nana.js', 'worlds/nana_art.js', 'worlds/nana_kits.js', 'content/q_nana.js'], /\n\s*\{ id: 'nana', order: 7[^\n]*\},?/, /\n\s*M\.load\.push\('content\/q_nana\.js'[^\n]*/);
    // home-world sentences that point to the grandparent's floor
    P.rep('worlds/home.js', 'بعد الفطار هننزل بالأسانسير من الدور السادس.. ونعدّي نسلّم على ننا زوزا في الدور التالت.', gp.exists ? 'بعد الفطار هننزل ونسلّم على ننا زوزا.' : 'بعد الفطار هنلبس ونروح المدرسة.', { what: 'home m2 line without the lift visit' });
    P.rep('worlds/home.js', 'إحنا في الدور السادس.. وتحت في الدور التالت بيت ننا زوزا. تصبح على خير يا ننا!', gp.exists ? 'يوم حلو.. وبكرة نزور ننا زوزا. تصبح على خير يا ننا!' : 'يوم حلو.. تصبح على خير يا ماما ويا بابا!', { what: 'home m6 good-night line' });
    if (!gp.exists) {
      P.rep('engine/call.js', /, \{ id: 'f_nana', title: 'ننا زوزا', art: 'face:nana', bg: '#f1e6ff' \}/, '', { what: 'no grandparent sticker' });
      P.rep('engine/call.js', "8: 'f_nana', ", '', { what: 'no grandparent sticker reward' });
      P.rep('content/baba_calls.js', "H('nana', 'كلّموا ننا زوزا وقولوا لها السلام عليكم.', 'الجدّة كنز في البيت')", "H('nana', 'كلّموا حد من العيلة وقولوا له السلام عليكم.', 'صلة الرحم بتفرّح القلب')", { what: 'call challenge without grandparent' });
    }
  } else floorPatches(P, c);
  if (c.dad.status === 'home') {
    removeWorld(P, 'saudi', ['worlds/saudi.js', 'worlds/saudi_art.js', 'content/q_saudi.js'], /\n\s*\{ id: 'saudi', order: 8[^\n]*\},?/, /\n\s*M\.load\.push\('content\/q_saudi\.js'[^\n]*/);
    P.rep('engine/ui.js', /tile\('بابا بيتصل', 'phone', .*?f\.call, M\.callPending && M\.callPending\(\)\), /, '', { what: 'no daily call button', exact: 1 });
  }
}

/* custom destination: generated questions replace the factual ones of Abha */
function destinationClaims(P, c) {
  const d = c.destination; if (!(c.dad.status === 'abroad' && d.preset === 'custom')) return;
  // narrative claims that become false when the mountain is not a top peak (old vocabulary, runs BEFORE the text pass)
  if (d.mountain && d.mountainIsTopPeak === false) {
    P.rep('worlds/saudi.js', 'من أعلى القمم في المملكة', 'من أجمل الجبال هنا', { what: 'claim: top peak' });
    P.rep('worlds/saudi.js', 'من أعلى جبال المملكة', 'جبال حلوة وعالية', { what: 'claim: top mountains' });
  }
}
function destinationQuestions(P, c) {
  const d = c.destination; if (!(c.dad.status === 'abroad' && d.preset === 'custom')) return [];
  const f = d.facts || {}, city = d.city, country = d.country, review = [];
  const ar = AR.arDigits, line = (tier, id, m, cat, q, choices, hint, extra) => '  Q' + tier + '(' + jsq(id) + ', ' + m + ', ' + jsq(cat) + ', ' + jsq(q) + ', [' + choices.map(jsq).join(', ') + '], ' + jsq(hint) + (extra ? ', ' + extra : '') + ');';
  const others = ['الرياض', 'جدة', 'دبي', 'عمّان', 'مسقط', 'الدوحة', 'الكويت', 'بيروت'].filter(x => x !== city && x !== c.home.city);
  const ctry = ['الأردن', 'الإمارات', 'عُمان', 'قطر', 'الكويت', 'لبنان', 'المغرب'].filter(x => x !== country && x !== c.home.country);
  const gen = [];
  const R = (tier, id, text) => { P.rep('content/q_saudi.js', new RegExp("^\\s*Q" + tier + "\\('" + id + "'.*$", 'm'), () => text, { what: 'destination question ' + id }); };
  // b3: region of the city
  if (f.regionOfCity) R(9, 'b3', line(9, 'b3', 4, 'geography', 'مدينة ' + city + ' في أنهي منطقة في ' + country + '؟', [f.regionOfCity].concat((f.regionWrong || []).slice(0, 2)), f.regionHint || 'فكّر في الخريطة', "{ emoji: '🗺️', explain: " + jsq('تمام! ' + city + ' في ' + f.regionOfCity) + ' }'));
  else { R(9, 'b3', line(9, 'b3', 4, 'geography', 'مدينة ' + city + ' في أنهي دولة؟', [country].concat(ctry.slice(0, 2)), 'رحلتنا رايحة لدولة...', "{ emoji: '🗺️', explain: " + jsq(city + ' في ' + country) + ' }')); review.push('b3: no destination.facts.regionOfCity -> neutral "which country" question used'); }
  // d3: famous for
  if (f.famousFor) R(9, 'd3', line(9, 'd3', 5, 'geography', city + ' مشهورة بإيه؟', [f.famousFor.correct].concat((f.famousFor.wrong || []).slice(0, 2)), f.famousFor.hint || 'اسأل بابا!', "{ emoji: '🏙️', explain: " + jsq(f.famousFor.explain || '') + ' }'));
  else { R(9, 'd3', line(9, 'd3', 5, 'geography', c.parents.dad + ' بيشتغل في أنهي مدينة؟', [city].concat(others.slice(0, 2)), 'رحنا له بالطيارة', "{ emoji: '🏙️', explain: " + jsq(c.parents.dad + ' بيشتغل في ' + city) + ' }')); review.push('d3: no destination.facts.famousFor -> neutral "which city" question used'); }
  // c4: is the mountain a top peak (true/false)
  if (d.mountain && typeof d.mountainIsTopPeak === 'boolean') R(9, 'c4', line(9, 'c4', 6, 'geography', d.mountain + ' من أعلى القمم في ' + country + '. صح ولا غلط؟', d.mountainIsTopPeak ? ['صح', 'غلط'] : ['غلط', 'صح'], 'فكّر في الجبال اللي شفناها', "{ emoji: '🏔️', explain: " + jsq(d.mountainIsTopPeak ? d.mountain + ' من أعلى القمم' : d.mountain + ' جبل حلو، بس مش من أعلى القمم') + ' }'));
  else { R(9, 'c4', line(9, 'c4', 6, 'geography', 'ركبنا التلفريك وطلعنا فوق جبل. الجو فوق كان أبرد ولا أدفى؟', ['أبرد', 'أدفى'], 'كل ما نعلى الهوا بيبرد', "{ emoji: '🏔️', explain: 'كل ما علينا فوق الجو بيبرد' }")); if (d.mountain) review.push('c4: destination.mountainIsTopPeak missing -> neutral question used'); }
  // c6: temperature difference (numbers given, or a hypothetical "لو")
  const th = (d.temperature && d.temperature.home) || 30, td = (d.temperature && d.temperature.dest) || 20, diff = th - td;
  R(9, 'c6', line(9, 'c6', 6, 'math', (d.temperature ? 'الحرارة في ' + c.home.city + ' ' + ar(th) + ' درجة وفي ' + city + ' ' + ar(td) + ' درجة. الفرق كام؟' : 'لو الحرارة في ' + c.home.city + ' ' + ar(th) + ' درجة وفي ' + city + ' ' + ar(td) + ' درجة. الفرق كام؟'), [ar(diff) + ' درجات', ar(diff - 5) + ' درجات', ar(diff + 5) + ' درجة'], ar(th) + ' − ' + ar(td), "{ emoji: '🌡️' }"));
  // f4: sea on the route
  if (d.seaOnRoute) R(9, 'f4', line(9, 'f4', 3, 'geography', 'الطيارة من ' + c.home.country + ' ' + AR.attach('ل', country) + ' بتعدّي فوق أنهي بحر؟', [d.seaOnRoute, 'البحر الأسود', 'بحر البلطيق'].filter((x, i, a) => a.indexOf(x) === i), 'اتفرجنا على البحر من الشباك', "{ emoji: '🌊', explain: " + jsq(d.seaOnRoute + ' على طريقنا') + ' }'));
  else { R(9, 'f4', line(9, 'f4', 3, 'general', 'الطيارة بتهبط في؟', ['المطار', 'الشارع', 'البحر'], 'مكان مخصوص للطيارات', "{ emoji: '🛬', explain: 'الطيارة بتهبط في المطار' }")); review.push('f4: no destination.seaOnRoute -> neutral "planes land at the airport" question used'); }
  if (P.files.has('content/q_runs.js')) { P.rep('content/q_runs.js', /\n[ \t]*q\('b[24]', 9,[^\n]*/g, '', { what: 'runs: factual questions about the old destination (climate, houses)', exact: 2 }); review.push('runs world: two factual destination questions removed (b2, b4); the other runs_abha questions are generic mountain/cable-car questions'); }
  review.push('story/art scenery of the trip world is still a cool misty mountain town with a cable car, stone towers and a gift scene (see build-report "scenery").');
  return review;
}

/* ------------------------------------------------------------------ characters, avatars, icons */
function applyCharacters(P, c, outDir, report) {
  let src = P.get('engine/chars.js');
  const avDir = path.join(outDir, 'assets'); fs.mkdirSync(avDir, { recursive: true });
  const slots = SLOTS.map((s, i) => ({ id: s, kid: c.kids[i] }));
  slots.push({ id: 'nana', kid: null }, { id: 'baba', kid: null });
  const finalProps = {};
  for (const sl of slots) {
    const row = CH.readRow(src, sl.id), baseG = BASE[sl.id].gender;
    const g = sl.id === 'nana' ? c.grandparent.gender : sl.id === 'baba' ? 'm' : sl.kid.gender;
    const look = sl.id === 'nana' ? c.grandparent.look : sl.id === 'baba' ? c.dad.look : sl.kid.look;
    const unq = v => v && /^'.*'$/.test(v) ? v.slice(1, -1) : v;
    let props = {};
    const userSkin = (look || {}).skin || unq(row.skin);
    if (g !== baseG) props = Object.assign(props, LK.genderPreset(sl.id, g, userSkin));
    const merged = Object.assign({ top: unq(row.top), hair: unq(row.hair), shirt: unq(row.shirt) }, props);
    props = Object.assign(props, LK.lookProps(look, merged));
    if (sl.kid) {
      props.name = sl.kid.nick; props.full = sl.kid.name === sl.kid.nick ? null : sl.kid.name; props.age = sl.kid.age;
      props.badge = [sl.kid.nick.replace(/^ال/, '').charAt(0) || '؟', (unq((/\['[^']*',\s*'([^']*)'\]/.exec(row.badge || '') || [])[1])) || '#ffc93c'];
      if (sl.kid.ability) props.ability = sl.kid.ability;
      else if (g !== baseG) { const base = unq(row.ability) || ''; props.ability = G.agree(base, g === 'f' ? 'm2f' : 'f2m', { pronouns: true }).text; }
    } else if (sl.id === 'nana') { props.badge = [c.grandparent.title.replace(/^ال/, '').charAt(0) || 'ج', '#c9b6ec']; props.name = c.grandparent.full; props.age = c.grandparent.age || (g === 'f' ? 68 : 70); if (g !== baseG) props.ability = G.agree(unq(row.ability) || '', 'f2m', { pronouns: true }).text; }
    else if (sl.id === 'baba') { props.name = c.parents.dad; if (c.dad.age) props.age = c.dad.age; }
    // avatar image
    const cfgAv = sl.kid ? sl.kid : sl.id === 'baba' ? c.dad : sl.id === 'nana' ? c.grandparent : null;
    const hasImg = row.img !== undefined || sl.id !== 'nana';
    if (hasImg) {
      let ext = 'svg', made = false;
      if (cfgAv && cfgAv.avatar) {
        if (cfgAv.avatarIsCartoon !== true) throw new Error('avatar for ' + sl.id + ': set "avatarIsCartoon": true to confirm the image is a CARTOON/drawing and not a real photo of a person (privacy rule). Refusing to build.');
        const f = path.resolve(c._dir, cfgAv.avatar); if (!fs.existsSync(f)) throw new Error('avatar file not found: ' + f);
        const e = path.extname(f).toLowerCase().replace('.', ''); if (!['jpg', 'jpeg', 'png', 'webp', 'svg'].includes(e)) throw new Error('avatar must be jpg/png/webp/svg: ' + f);
        const dst = path.join(avDir, 'avatar_' + sl.id + (e === 'svg' ? '.svg' : '.jpg'));
        if (e === 'svg') fs.copyFileSync(f, dst);
        else { const r = cp.spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', f, '-vf', 'scale=384:384:force_original_aspect_ratio=increase,crop=384:384', '-map_metadata', '-1', '-q:v', '3', dst]); if (r.status !== 0) throw new Error('ffmpeg failed to re-encode ' + f + ' (needed to strip metadata and shrink the avatar): ' + (r.stderr || '')); }
        ext = e === 'svg' ? 'svg' : 'jpg'; made = true; report.avatars.push({ slot: sl.id, source: 'file', out: 'assets/avatar_' + sl.id + '.' + ext });
      }
      if (!made) { props_pending(sl.id); }
      props.img = 'assets/avatar_' + sl.id + '.' + ext;
    }
    finalProps[sl.id] = props;
    src = CH.patchRow(src, sl.id, props);
  }
  function props_pending() { }
  P.files.set('engine/chars.js', src);
  // generated avatars for everybody without a supplied file (read the FINAL row so that they match the drawing)
  const flat = id => { const r = CH.readRow(src, id), o = {}; Object.keys(r).forEach(k => { const v = r[k]; o[k] = /^'.*'$/.test(v) ? v.slice(1, -1) : v; }); return o; };
  slots.forEach(sl => {
    const p = finalProps[sl.id]; if (!p.img) return;
    const dst = path.join(avDir, path.basename(p.img));
    if (!fs.existsSync(dst)) { fs.writeFileSync(dst, AV.svg(flat(sl.id))); report.avatars.push({ slot: sl.id, source: 'generated', out: p.img }); }
  });
}
function makeIcons(P, c, outDir, report, flags) {
  const dir = path.join(outDir, 'icons'); fs.mkdirSync(dir, { recursive: true });
  const av1 = path.join(outDir, 'assets', 'avatar_moody.jpg'), svg1 = path.join(outDir, 'assets', 'avatar_moody.svg');
  const sizes = [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0], ['icon-maskable-512.png', 512, .18]];
  if (flags.has('no-icons')) { report.warnings.push('--no-icons: icons/ is empty, the manifest points to missing files.'); return; }
  if (fs.existsSync(av1)) {   // cartoon avatar of the older kid
    sizes.forEach(([n, s, pad]) => { const inner = Math.round(s * (1 - pad * 2)); const r = cp.spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', av1, '-vf', 'scale=' + inner + ':' + inner + ',pad=' + s + ':' + s + ':(ow-iw)/2:(oh-ih)/2:color=0x0b1a33', '-frames:v', '1', path.join(dir, n)]); if (r.status !== 0) report.warnings.push('icon ' + n + ' failed: ' + r.stderr); });
    report.icons = 'from the older kid avatar (ffmpeg)'; return;
  }
  // render the generated SVG with Playwright (optional dependency); fall back to a plain gradient
  let pw = null; for (const p of ['playwright', '/opt/node-tools/node_modules/playwright']) { try { pw = require(p); break; } catch (e) { } }
  if (pw) {
    const svg = fs.readFileSync(svg1, 'utf8'); const tmp = path.join(dir, '.tmp.html');
    sizes.forEach(([n, s, pad]) => {
      const inner = Math.round(s * (1 - pad * 2));
      fs.writeFileSync(tmp, '<html><body style="margin:0;background:#0b1a33;width:' + s + 'px;height:' + s + 'px;display:flex;align-items:center;justify-content:center"><div style="width:' + inner + 'px;height:' + inner + 'px">' + svg.replace('<svg ', '<svg style="width:100%;height:100%" ') + '</div></body></html>');
      const code = 'const {chromium}=require(' + JSON.stringify(require.resolve(pw === require ? 'playwright' : (fs.existsSync('/opt/node-tools/node_modules/playwright') ? '/opt/node-tools/node_modules/playwright' : 'playwright'))) + ');(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:' + s + ',height:' + s + '}});await p.goto("file://' + tmp + '");await p.screenshot({path:' + JSON.stringify(path.join(dir, n)) + '});await b.close();})()';
      const r = cp.spawnSync(process.execPath, ['-e', code], { encoding: 'utf8' }); if (r.status !== 0) report.warnings.push('icon ' + n + ' render failed: ' + (r.stderr || '').slice(0, 200));
    });
    try { fs.unlinkSync(tmp); } catch (e) { }
    report.icons = 'generated avatar rendered with Playwright'; return;
  }
  sizes.forEach(([n, s]) => cp.spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'lavfi', '-i', 'color=c=0x1fb5a6:s=' + s + 'x' + s, '-frames:v', '1', path.join(dir, n)]));
  report.icons = 'plain colour (no Playwright and no raster avatar): replace icons/*.png before shipping';
  report.warnings.push('icons are plain colour squares - replace them');
}

/* ------------------------------------------------------------------ checks */
function leakScan(P, c, outDir) {
  const leaks = [], words = [['أوفا', 1], ['توتي', 1], ['أماني', 1], ['عمتو ندى', 1], ['بينو', 1], ['ميدو', 1], ['عمو كمال', 1], ['لوكا', 1], ['مودي', 0], ['عبودي', 0], ['توتا', 0], ['نيمو', 0], ['تسنيم', 0], ['ترنيم', 0], ['زوزا', 0], ['آل زياد', 0], ['ننا', 1]];
  if (c.dad.status === 'abroad' && c.destination.preset === 'custom') words.push(['أبها', 0], ['عسير', 0], ['السودة', 0], ['العسيري', 0]);
  const keep = new Set(c.kids.map(k => k.nick).concat([c.grandparent.title, c.grandparent.name, c.school.name].filter(Boolean)));
  // a leak is only a leak if the same text is not a legitimate new name (e.g. a new child really called "نيمو")
  const stems = words.filter(w => ![...keep].some(k => k.includes(w[0]))).map(w => w);
  for (const [f, s] of P.files) {
    if (!/\.(js|html|json|css)$/.test(f)) continue;
    stems.forEach(([w, standalone]) => {
      const re = standalone ? new RegExp('(?<![\\u0600-\\u06FF])[وفبكل]{0,2}' + w + '(?![\\u0600-\\u06FF])', 'g') : new RegExp(w, 'g');
      let m; while ((m = re.exec(s))) { leaks.push({ file: f, word: w, ctx: s.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\n/g, ' ') }); if (leaks.length > 500) return; }
    });
  }
  return leaks;
}
function syntaxCheck(P) {
  const bad = [];
  for (const [f, s] of P.files) if (f.endsWith('.js')) { try { new vm.Script(s, { filename: f }); } catch (e) { bad.push(f + ': ' + e.message); } }
  return bad;
}
function reviewScenery(P, c) {
  const out = []; if (!(c.dad.status === 'abroad' && c.destination.preset === 'custom')) return out;
  const kw = /جبال|ضباب|تلفريك|التلفريك|الطراز|حجر|منارات|مدرجات|الكوفية|جاكت|سحاب|برد|باردة/;
  ['worlds/saudi.js', 'content/q_saudi.js'].forEach(f => P.get(f).split('\n').forEach((l, i) => { if (kw.test(l) && /'[^']*[؀-ۿ][^']*'/.test(l)) out.push({ file: f, line: i + 1, text: (l.match(/'([^']*[؀-ۿ][^']*)'/) || [])[1] }); }));
  return out;
}

/* ------------------------------------------------------------------ run */
function build(configFile, outDir, flags) {
  const c = loadConfig(configFile);
  if (c._err.length) { console.error('Config errors:\n - ' + c._err.join('\n - ')); process.exit(2); }
  outDir = path.resolve(outDir);
  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length && !flags.has('force')) { console.error('Refusing to write into a non-empty folder (use --force): ' + outDir); process.exit(2); }
  if (outDir === ROOT || outDir.startsWith(ROOT + path.sep) && !outDir.startsWith(path.join(ROOT, 'tools'))) { /* allowed inside tools only */ if (outDir === ROOT) { console.error('Refusing to build over the base game'); process.exit(2); } }
  const P = new Project(); P.load();
  const report = { edition: c.edition.id, built: new Date().toISOString(), warnings: c._warn.slice(), review: [], avatars: [], gender: [], genderMixed: [], patches: [], leaks: [], syntax: [], scenery: [] };
  const dicts = buildDictionaries(c);
  stripOwnerFamilyStories(P, c);
  stripExtendedFamily(P, c);
  genericPatches(P, c);
  optionalWorlds(P, c);
  destinationClaims(P, c);
  textPass(P, c, dicts);
  const destReview = destinationQuestions(P, c);   // generated lines carry FINAL text, so they go in after the dictionary pass
  // exit-text inserted after the dictionary (generated question lines contain final text)
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  applyCharacters(P, c, outDir, report);
  makeIcons(P, c, outDir, report, flags);
  for (const [f, s] of P.files) { const dst = path.join(outDir, f); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, s); }
  fs.writeFileSync(path.join(outDir, '_headers'), '/*\n  X-Robots-Tag: noindex, nofollow, noarchive\n  Referrer-Policy: no-referrer\n  Cache-Control: no-cache\n');   // Netlify / Cloudflare Pages
  fs.writeFileSync(path.join(outDir, 'robots.txt'), 'User-agent: *\nDisallow: /\n');
  fs.mkdirSync(path.join(outDir, 'assets', 'voice'), { recursive: true }); fs.writeFileSync(path.join(outDir, 'assets', 'voice', 'manifest.json'), '{}');
  report.syntax = syntaxCheck(P); report.leaks = leakScan(P, c, outDir); report.scenery = reviewScenery(P, c);
  report.gender = P.log.gender; report.genderMixed = P.log.genderMixed; report.patches = P.log.patches; report.review = P.log.review.concat(destReview);
  const defaults = { names: { m: c.kids[0].nick, a: c.kids[1].nick, t: c.kids[2].nick, n: c.kids[3].nick, me: 'يا بطل' }, speakers: { moody: P.files.get('engine/voice.js').match(/moody: '(\w+)'/)[1], aboody: P.files.get('engine/voice.js').match(/aboody: '(\w+)'/)[1], toota: P.files.get('engine/voice.js').match(/toota: '(\w+)'/)[1], nemo: P.files.get('engine/voice.js').match(/nemo: '(\w+)'/)[1], nana: P.files.get('engine/voice.js').match(/nana: '(\w+)'/)[1] }, title: P._title };
  const meta = outDir + '.meta'; fs.mkdirSync(meta, { recursive: true });
  fs.writeFileSync(path.join(meta, 'review-gender.txt'), report.gender.map(g => g.file + '\n  قبل: ' + g.before + '\n  بعد: ' + g.after).join('\n\n') + '\n\n--- unresolved (mixed) ---\n' + report.genderMixed.map(g => g.file + ': ' + g.text).join('\n'));
  fs.writeFileSync(path.join(meta, 'build-report.json'), JSON.stringify(report, null, 1)); fs.writeFileSync(path.join(meta, 'defaults.json'), JSON.stringify(defaults, null, 1));
  if (!flags.has('quiet')) {
    console.log('Built edition "' + c.edition.id + '" -> ' + outDir + '  (metadata: ' + meta + ')');
    console.log('  patches applied: ' + report.patches.length + ' | gender-adjusted lines: ' + report.gender.length + ' | avatars: ' + report.avatars.map(a => a.slot + ':' + a.source).join(', '));
    report.warnings.forEach(w => console.log('  WARNING: ' + w));
    destReview.forEach(w => console.log('  REVIEW: ' + w));
    if (report.syntax.length) console.log('  SYNTAX ERRORS:\n   ' + report.syntax.join('\n   '));
    console.log('  leak scan (old family text left in the copy): ' + report.leaks.length + (report.leaks.length ? ' -> see build-report.json' : ' (none)'));
    if (report.scenery.length) console.log('  scenery lines of the trip world to read by hand: ' + report.scenery.length);
  }
  return report;
}
module.exports = { build, loadConfig, buildDictionaries, ROOT, pruneRuns, splitArrayObjects, Project };
if (require.main === module) {
  const a = parseArgs(process.argv.slice(2));
  if (a._.length < 2) { console.log('usage: node tools/family/build.js <config.json> <outdir> [--force] [--no-icons] [--quiet]'); process.exit(1); }
  try { const r = build(a._[0], a._[1], a.flags); process.exit(r.syntax.length ? 3 : 0); } catch (e) { console.error('BUILD FAILED: ' + e.message); process.exit(2); }
}
