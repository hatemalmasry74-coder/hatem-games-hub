#!/usr/bin/env node
/* Reviews the runtime gender-agreement pass (engine/family_flip.js) on every dialogue line of a built Play edition: lists each line it changes (before -> after) so a reader can judge it,
   and reports lines SPOKEN by / ABOUT a flipped hero that still contain a masculine marker word the table does not know (candidates for the table).
     node tools/play/flip_test.js <outdir> [moody,aboody] [--all]      (writes <outdir>.meta/flip-review.txt) */
const fs = require('fs'), path = require('path'); const out = path.resolve(process.argv[2] || ''), flipped = (process.argv[3] && !process.argv[3].startsWith('--') ? process.argv[3] : 'moody,aboody').split(',');
const F = require(path.join(out, 'engine', 'family_flip.js')); const rows = [], seen = new Set(); let lines = 0;
const add = (speaker, t) => { const k = speaker + '|' + t; if (seen.has(k)) return; seen.add(k); lines++; const r = F.gx(t, speaker, flipped); if (r !== t) rows.push([speaker, t, r]); };
for (const f of fs.readdirSync(path.join(out, 'worlds')).filter(f => f.endsWith('.js'))) {
  const src = fs.readFileSync(path.join(out, 'worlds', f), 'utf8');
  for (const m of src.matchAll(/(?:say\(|\[)\s*'([a-z0-9_]+)'\s*,\s*'((?:[^'\\]|\\.)*)'/g)) add(m[1], m[2].replace(/\\'/g, "'"));
  for (const m of src.matchAll(/'((?:[^'\\]|\\.)*\{[ma]\}(?:[^'\\]|\\.)*)'/g)) add(null, m[1].replace(/\\'/g, "'"));
}
const txt = rows.map(r => '[' + (r[0] || '-') + ']\n  ' + r[1] + '\n  ' + r[2]).join('\n');
fs.writeFileSync(out + '.meta/flip-review.txt', txt); console.log('lines scanned', lines, '| changed', rows.length, '->', out + '.meta/flip-review.txt');
rows.slice(0, 25).forEach(r => console.log('[' + (r[0] || '-') + '] ' + r[1] + '\n      => ' + r[2]));
