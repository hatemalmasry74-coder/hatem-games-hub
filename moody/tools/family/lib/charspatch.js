/* Patch rows of the ONE character table (engine/chars.js: const DEFS = { moody: {...}, ... }) without touching anything else. */
'use strict';
const lit = v => typeof v === 'string' ? "'" + v.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'" : Array.isArray(v) ? '[' + v.map(lit).join(', ') + ']' : String(v);
function splitTop(body) {   // split "a: 1, b: 'x,y', c: [1,2]" on top-level commas
  const parts = []; let d = 0, q = null, cur = '';
  for (let i = 0; i < body.length; i++) {
    const c = body[i];
    if (q) { cur += c; if (c === '\\') { cur += body[++i]; } else if (c === q) q = null; continue; }
    if (c === '\'' || c === '"') { q = c; cur += c; continue; }
    if (c === '[' || c === '{' || c === '(') d++; if (c === ']' || c === '}' || c === ')') d--;
    if (c === ',' && d === 0) { parts.push(cur.trim()); cur = ''; continue; }
    cur += c;
  }
  if (cur.trim()) parts.push(cur.trim());
  return parts.map(p => { const k = p.indexOf(':'); return [p.slice(0, k).trim(), p.slice(k + 1).trim()]; });
}
function patchRow(src, id, props) {
  const re = new RegExp('^(\\s*)' + id + ': \\{(.*)\\}(,?)\\s*$', 'm');
  const m = src.match(re); if (!m) throw new Error('chars.js: row for ' + id + ' not found (base game changed?)');
  const items = splitTop(m[2]);
  for (const k of Object.keys(props)) {
    const v = props[k], i = items.findIndex(x => x[0] === k);
    if (v === null || v === undefined) { if (i >= 0) items.splice(i, 1); continue; }
    if (i >= 0) items[i][1] = lit(v); else items.push([k, lit(v)]);
  }
  const row = m[1] + id + ': { ' + items.map(x => x[0] + ': ' + x[1]).join(', ') + ' }' + m[3];
  return src.replace(re, () => row);
}
function readRow(src, id) {
  const m = src.match(new RegExp('^\\s*' + id + ': \\{(.*)\\}', 'm')); if (!m) return null;
  const o = {}; splitTop(m[1]).forEach(x => { o[x[0]] = x[1]; }); return o;
}
const hex = c => { const m = /^#?([0-9a-f]{6})$/i.exec(c || ''); return m ? m[1] : null; };
function shade(c, k) { const h = hex(c); if (!h) return c; const n = [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)); return '#' + n.map(v => Math.max(0, Math.min(255, Math.round(k < 0 ? v * (1 + k) : v + (255 - v) * k))).toString(16).padStart(2, '0')).join(''); }
module.exports = { patchRow, readRow, lit, shade, hex };
