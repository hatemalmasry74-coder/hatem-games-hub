#!/usr/bin/env node
/* Independent leak check of a built folder (plain text search, does not trust build.js):
     node tools/family/leakcheck.js <outdir> [more words to look for, e.g. the names of another customer...]
   Looks for the base family AND its extended family (مودي عبودي توتا نيمو تسنيم ترنيم ننا زوزا آل زياد أبها عسير السودة حاتم ...), any extra word you pass,
   cross-game paths (../), and base cartoon files.  Exit 1 when something is found.
   Words that legitimately are the NEW names (e.g. a customer whose child is really called "نيمو") are skipped automatically
   if you pass them with --allow=word. */
const fs = require('fs'), path = require('path');
const args = process.argv.slice(2), dir = args.find(a => !a.startsWith('--')), allow = args.filter(a => a.startsWith('--allow=')).map(a => a.slice(8));
if (!dir) { console.log('usage: node tools/family/leakcheck.js <outdir> [extra words] [--allow=word]'); process.exit(1); }
const extra = args.filter(a => !a.startsWith('--')).slice(1);
const LET = '\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06D3';
const words = ['مودي', 'عبودي', 'توتا', 'نيمو', 'تسنيم', 'ترنيم', 'زوزا', 'آل زياد', 'أبها', 'عسير', 'السودة', 'العسيري', 'حاتم', 'أماني', 'عمتو ندى', 'عمتكم ندى', 'توتي', 'بينو', 'ميدو', 'عمو كمال', 'يا كمال', 'لوكا', 'أوفا', 'تجمّع العائلة', '/* @owner-family */', 'Moody & Aboody', 'moody_cartoon', 'hub_moody_v1', 'sonic/', 'hubPlayerName']
  .concat(extra).filter(w => !allow.includes(w)).map(w => { const whole = /^(بينو|ميدو|لوكا|أماني|توتي|أوفا)$/.test(w), esc = w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); return { w, re: new RegExp(whole ? '(?<![' + LET + '])[وفبكل]{0,2}' + esc + '(?![' + LET + '\\u064B-\\u065F])' : esc, 'g') }; });
words.push({ w: 'ننا (standalone)', re: new RegExp('(?<![' + LET + '])[وفبكل]{0,2}ننا(?![' + LET + '])', 'g') });
const hits = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) { if (e.name === 'voice') continue; walk(p); } else if (/\.(js|json|html|css|svg|txt|md|webmanifest)$/.test(e.name) || e.name === '_headers') { const s = fs.readFileSync(p, 'utf8'); words.forEach(({ w, re }) => { let m; re.lastIndex = 0; while ((m = re.exec(s))) hits.push(path.relative(dir, p) + ': [' + w + '] ' + s.slice(Math.max(0, m.index - 25), m.index + 25).replace(/\n/g, ' ')); }); } else if (/cartoon|moody_|aboody_/.test(e.name)) hits.push(path.relative(dir, p) + ': base asset name'); } })(dir);
if (fs.existsSync(path.join(dir, 'tools'))) hits.push('tools/ folder present in the deployable copy');
console.log(hits.length ? hits.slice(0, 60).join('\n') + '\n' + hits.length + ' leak(s)' : 'no leaks found in ' + dir);
process.exit(hits.length ? 1 : 0);
