#!/usr/bin/env node
/* Activation-code generator for the DIRECT edition («مغامرات العيلة»).
     node gen_codes.js --count 30 --days 30 --out /PRIVATE/codes.txt --hashes ./codes_hashes.json
     node gen_codes.js --mix 20x30,5x90,5x365 --out ... --hashes ...        (20 codes of 30 days, 5 of 90, 5 of 365)
     node gen_codes.js --config batch.json --out ... --hashes ...           (batch.json = [{"count":20,"days":30},{"count":5,"days":90}])
   * PLAINTEXT codes go ONLY to --out (keep it OUTSIDE the repo; never commit it). Appended, so older batches are kept.
   * HASHES go to --hashes (merged with what is already there, so earlier codes stay valid). The build embeds this file.
   Code = FM-XXXX-XXXX-XXXX (12 random chars, 31-letter alphabet without look-alikes ~ 59 bits). Stored as sha256("FM1|"+CODE) -> days. */
'use strict';
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const ALPHA = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789', SALT = 'FM1|';
const norm = c => String(c || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
const hashOf = code => crypto.createHash('sha256').update(SALT + norm(code)).digest('hex');
function gen() { const b = crypto.randomBytes(12); let s = ''; for (let i = 0; i < 12; i++) s += ALPHA[b[i] % ALPHA.length]; return 'FM-' + s.slice(0, 4) + '-' + s.slice(4, 8) + '-' + s.slice(8); }
module.exports = { norm, hashOf, gen, SALT, ALPHA };
if (require.main === module) {
  const a = process.argv.slice(2), o = {}; for (let i = 0; i < a.length; i++) if (a[i].startsWith('--')) o[a[i].slice(2)] = a[i + 1] && !a[i + 1].startsWith('--') ? a[++i] : true;
  const die = m => { console.error('ERROR: ' + m); process.exit(2); };
  let batches = [];
  if (o.mix) batches = String(o.mix).split(',').map(x => { const m = /^(\d+)x(\d+)$/.exec(x.trim()); if (!m) die('bad --mix item: ' + x); return { count: +m[1], days: +m[2] }; });
  else if (o.config) batches = JSON.parse(fs.readFileSync(o.config, 'utf8'));
  else if (o.count && o.days) batches = [{ count: +o.count, days: +o.days }];
  if (!batches.length || !o.out || !o.hashes) die('usage: --count N --days D | --mix 20x30,5x90 | --config file.json   --out <private file>   --hashes <hashes json>');
  const out = path.resolve(o.out), hf = path.resolve(o.hashes);
  const repo = path.resolve(__dirname, '..', '..', '..');
  if ((out + path.sep).startsWith(repo + path.sep) && !o['allow-in-repo']) die('--out is inside the repository (' + repo + '). Put the plaintext codes OUTSIDE the repo (or pass --allow-in-repo for throw-away test codes).');
  let H = {}; try { H = JSON.parse(fs.readFileSync(hf, 'utf8')); } catch (e) { }
  const lines = [], stamp = new Date().toISOString().slice(0, 10);
  for (const b of batches) {
    if (!(b.count > 0 && b.count <= 5000) || !(b.days > 0 && b.days <= 3650)) die('bad batch ' + JSON.stringify(b));
    for (let i = 0; i < b.count; i++) { let c, h; do { c = gen(); h = hashOf(c); } while (H[h]); H[h] = b.days; lines.push(c + '\t' + b.days + '\t' + stamp + '\t'); }
  }
  fs.mkdirSync(path.dirname(out), { recursive: true }); fs.mkdirSync(path.dirname(hf), { recursive: true });
  const fresh = !fs.existsSync(out);
  fs.appendFileSync(out, (fresh ? '# CODE\tDAYS\tCREATED\tSOLD-TO (fill by hand)   -- PRIVATE: do not commit, do not publish\n' : '') + lines.join('\n') + '\n', { mode: 0o600 });
  fs.writeFileSync(hf, JSON.stringify(H, null, 1));
  const tally = {}; lines.forEach(l => { const d = l.split('\t')[1]; tally[d] = (tally[d] || 0) + 1; });
  console.log('generated ' + lines.length + ' codes ' + JSON.stringify(tally) + '\n  plaintext -> ' + out + '\n  hashes    -> ' + hf + ' (' + Object.keys(H).length + ' total). Rebuild + republish so the new codes work.');
}
