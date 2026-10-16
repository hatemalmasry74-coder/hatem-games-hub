/* Arabic helpers: digits, colloquial (Egyptian) number words, ordinals, prefix-aware name replacement. */
'use strict';
const AR_LETTER = '\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06D3';   // letters only: NOT the Arabic comma/question mark/digits
const arDigits = n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d]);
const COUNT = ['', 'واحد', 'اتنين', 'تلاتة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة'];
const ORD = ['', 'الأول', 'التاني', 'التالت', 'الرابع', 'الخامس', 'السادس', 'السابع', 'التامن', 'التاسع', 'العاشر'];
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const stripTashkeel = s => s.replace(/[ً-ٰٟـ]/g, '');
/* "ل" + "ال..." -> "لل..." (e.g. ل + الطائف -> للطائف) */
function attach(prefix, word) { if (prefix && prefix.endsWith('ل') && word.startsWith('ال')) return prefix + word.slice(1); return prefix + word; }
/* Build a function that replaces whole Arabic words (optionally with one/two clitic prefixes و ف ب ك ل) in ONE pass.
   pairs = [[from,to],...]; longer `from` wins. */
function wordReplacer(pairs) {
  const list = pairs.filter(p => p[0] && p[0] !== p[1]).sort((a, b) => b[0].length - a[0].length);
  if (!list.length) return s => s;
  const map = new Map(list.map(p => [p[0], p[1]]));
  const re = new RegExp('(?<![' + AR_LETTER + '])([وفبكل]{0,2})(' + list.map(p => esc(p[0])).join('|') + ')(?![' + AR_LETTER + '])', 'g');
  return s => s.replace(re, (m, pre, w) => attach(pre, map.get(w)));
}
const plural = (n, one, two, many) => n === 1 ? one : n === 2 ? two : many;
module.exports = { AR_LETTER, arDigits, COUNT, ORD, esc, stripTashkeel, attach, wordReplacer, plural };
