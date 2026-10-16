/* Tiny JS scanner: splits source into code / string / comment / regex segments so text rules can be applied
   to string literals (and comments) only, never to identifiers or regex literals.  Not a full parser; good enough
   for this code base (checked by build.js: joining the segments must give back the original source). */
'use strict';
function scan(src) {
  const out = []; let i = 0, last = 0, prev = '';   // prev = last significant char of code
  const push = (type, a, b) => { if (b > a) out.push({ type, text: src.slice(a, b) }); };
  while (i < src.length) {
    const c = src[i], n = src[i + 1];
    if (c === '/' && n === '/') { push('code', last, i); let j = src.indexOf('\n', i); if (j < 0) j = src.length; push('comment', i, j); i = last = j; continue; }
    if (c === '/' && n === '*') { push('code', last, i); let j = src.indexOf('*/', i + 2); j = j < 0 ? src.length : j + 2; push('comment', i, j); i = last = j; continue; }
    if (c === '\'' || c === '"' || c === '`') {
      push('code', last, i); let j = i + 1;
      while (j < src.length && src[j] !== c) { if (src[j] === '\\') j++; if (c !== '`' && src[j] === '\n') break; j++; }
      j++; push('str', i, j); i = last = j; prev = c; continue;
    }
    if (c === '/' && (prev === '' || '(,=:[!&|?{};+-*%<>~^'.includes(prev))) {      // regex literal
      push('code', last, i); let j = i + 1, cls = false;
      while (j < src.length) { const d = src[j]; if (d === '\\') { j += 2; continue; } if (d === '[') cls = true; else if (d === ']') cls = false; else if (d === '/' && !cls) break; else if (d === '\n') break; j++; }
      j++; while (/[a-z]/.test(src[j] || '')) j++; push('regex', i, j); i = last = j; prev = ')'; continue;
    }
    if (!/\s/.test(c)) prev = c;
    i++;
  }
  push('code', last, src.length);
  return out;
}
const join = segs => segs.map(s => s.text).join('');
module.exports = { scan, join };
