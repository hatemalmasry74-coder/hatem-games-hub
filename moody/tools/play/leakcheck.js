#!/usr/bin/env node
/* Leak check of a built PLAY edition (plain text search, independent of build.js).
     node tools/play/leakcheck.js <outdir> [extra words]
   Same terms as tools/family/leakcheck.js (the owner's kids, relatives, school, Abha/Asir ...) plus: cross-game paths, the owner's cartoon files, the owner's save key and
   the '@owner-family' tag.  The ONE legitimate exception is the grandmother TITLE «ننا» (one of the five titles the parents can choose) inside engine/family.js and engine/family_ui.js. */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--'));
if (!dir) { console.log('usage: node tools/play/leakcheck.js <outdir> [extra words]'); process.exit(1); }
const extra = args.filter(a => !a.startsWith('--')).slice(1);
const LET = '\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06D3';
const words = ['مودي', 'عبودي', 'توتا', 'نيمو', 'تسنيم', 'ترنيم', 'زوزا', 'آل زياد', 'أبها', 'عسير', 'السودة', 'العسيري', 'حاتم', 'أماني', 'عمتو ندى', 'عمتكم ندى', 'توتي', 'بينو', 'ميدو', 'عمو كمال', 'يا كمال', 'لوكا', 'أوفا', '/* @owner-family */', 'Moody & Aboody', 'moody_cartoon', 'hub_moody_v1', 'sonic/', 'hubPlayerName']
  .concat(extra).map(w => { const whole = /^(بينو|ميدو|لوكا|أماني|توتي|أوفا)$/.test(w), esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return { w, re: new RegExp(whole ? '(?<![' + LET + '])[وفبكل]{0,2}' + esc + '(?![' + LET + '\\u064B-\\u065F])' : esc, 'g') }; });
const NANA = { w: 'ننا (standalone)', re: new RegExp('(?<![' + LET + '])[وفبكل]{0,2}ننا(?![' + LET + '])', 'g'), okFiles: /^engine\/family(_ui)?\.js$/ };
const hits = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name), rel = path.relative(dir, p).replace(/\\/g, '/');
    if (e.isDirectory()) { if (e.name === 'voice') continue; walk(p); }
    else if (/\.(js|json|html|css|svg|txt|md|webmanifest)$/.test(e.name) || e.name === '_headers') {
      const s = fs.readFileSync(p, 'utf8');
      words.concat(NANA).forEach(({ w, re, okFiles }) => { if (okFiles && okFiles.test(rel)) return; let m; re.lastIndex = 0; while ((m = re.exec(s))) hits.push(rel + ': [' + w + '] ' + s.slice(Math.max(0, m.index - 30), m.index + 30).replace(/\n/g, ' ')); });
    } else if (/cartoon|moody_|aboody_/.test(e.name)) hits.push(rel + ': base asset name');
  }
})(dir);
if (fs.existsSync(path.join(dir, 'tools'))) hits.push('tools/ folder present in the deployable copy');
if (fs.existsSync(path.join(dir, '..', 'sonic'))) { /* only the folder above matters for hosting, not for the copy */ }
console.log(hits.length ? hits.slice(0, 200).join('\n') + '\n' + hits.length + ' leak(s)' : 'no leaks found in ' + dir);
process.exit(hits.length ? 1 : 0);
