/* Gender agreement for hero-specific lines (colloquial Egyptian Arabic).
   Applied per CLAUSE: a clause is changed only if it (a) mentions a hero whose gender changed (by name or {token}),
   or (b) belongs to a line SPOKEN by such a hero (first-person words).  A curated word table, not NLP: the build writes
   every changed line to build-report.json / review-gender.txt and the README tells the owner to read them.
   Imperatives addressed to the *player* ("اضغط") are left alone on purpose. */
'use strict';
const { AR_LETTER } = require('./ar');
// masculine -> feminine words (a leading "ال" and clitics و ف ب ك ل are handled by the matcher)
const PAIRS = [
  ['شاطر', 'شاطرة'], ['صغير', 'صغيرة'], ['كبير', 'كبيرة'], ['طويل', 'طويلة'], ['قوي', 'قوية'], ['سريع', 'سريعة'], ['ذكي', 'ذكية'], ['صاحب', 'صاحبة'], ['حقيقي', 'حقيقية'], ['فضولي', 'فضولية'], ['منظم', 'منظمة'], ['قائد', 'قائدة'], ['لطيف', 'لطيفة'], ['مرتب', 'مرتبة'],
  ['جاهز', 'جاهزة'], ['شايف', 'شايفة'], ['عارف', 'عارفة'], ['فاكر', 'فاكرة'], ['تعبان', 'تعبانة'], ['زعلان', 'زعلانة'], ['فرحان', 'فرحانة'],
  ['خايف', 'خايفة'], ['مبسوط', 'مبسوطة'], ['حكيم', 'حكيمة'], ['حنون', 'حنونة'], ['مستني', 'مستنية'], ['مستنيكم', 'مستنياكم'], ['ادّى', 'ادّت'], ['اتعب', 'اتعبت'],
  ['لوحده', 'لوحدها'], ['بطل', 'بطلة'], ['ولد', 'بنت'], ['أنت', 'إنتي'], ['انت', 'إنتي'], ['إنت', 'إنتي'], ['وانت', 'وإنتي'], ['هو', 'هي'],
  ['عنده', 'عندها'], ['له', 'لها'], ['معاه', 'معاها'], ['عليه', 'عليها'], ['بتاعه', 'بتاعتها'], ['جدو', 'تيتة'], ['جدي', 'جدتي'],
  ['أخويا', 'أختي'], ['أخوك', 'أختك'], ['الأخ', 'الأخت']
];
const AMBIG = new Set(['له', 'لها', 'هو', 'هي', 'عليه', 'عليها', 'ولد', 'بنت', 'كبير', 'كبيرة', 'الأخ', 'الأخت', 'معاه', 'معاها', 'عنده', 'عندها', 'بتاعه', 'بتاعتها']);
const SECOND = new Set(['أنت', 'انت', 'إنت', 'وانت']);
const M2F = new Map(PAIRS.filter(p => p[0] !== p[1])), F2M = new Map(PAIRS.filter(p => p[0] !== p[1]).map(p => [p[1], p[0]]));
// 3rd-person present verbs of the stories: يزحف <-> تزحف, بيجيب <-> بتجيب, هيدخل <-> هتدخل
const VERBS = ['زحف', 'دخل', 'جيب', 'طلع', 'نزل', 'روح', 'لاقي', 'مسك', 'شيل', 'قدر', 'عرف', 'لعب', 'دوّر', 'فتح', 'قفل', 'حط', 'وصّل', 'ساعد', 'خد', 'عمل', 'شوف', 'سمع', 'جري', 'رسم', 'كمّل', 'نط', 'وقف', 'قعد', 'رمي', 'نضّف', 'رتّب', 'اشترى', 'فتّش'];
const VRE_M = new RegExp('^(ه?)ي(' + VERBS.join('|') + ')$'), VRE_F = new RegExp('^(ه?)ت(' + VERBS.join('|') + ')$');
const WORD = () => new RegExp('(?<![' + AR_LETTER + '])([وفبكل]{0,2})(ال)?([' + AR_LETTER + ']+)(?![' + AR_LETTER + '])', 'g');
function table(dir) { return dir === 'm2f' ? M2F : F2M; }
/* returns {text, changed:[[from,to]], candidates:n}  (candidates = gendered words seen in EITHER direction) */
function agree(text, dir, opts) {
  opts = opts || {}; const t = table(dir), changed = []; let cand = 0;
  const out = text.replace(WORD(), (m, pre, al, w) => {
    // the clitic class swallows the first letter of words like "لها" / "له" (ل + ها): try every split of pre+w
    let hit = null, keep = pre;
    for (let k = 0; k <= pre.length && !hit; k++) {
      const word = pre.slice(k) + w, art = k === pre.length ? al : '';   // an article only belongs to the unsplit word
      if (t.has(word) && !(art && AMBIG.has(word))) hit = { word, art, keep: pre.slice(0, k) };
    }
    if (M2F.has(w) || F2M.has(w) || (hit && hit.word)) cand++;
    let to = hit ? t.get(hit.word) : null; keep = hit ? hit.keep : pre;
    if (to && AMBIG.has(hit.word) && (!opts.pronouns || hit.art)) to = null;   // 'الله' = ال+له must never become 'اللها'
    if (to && opts.speaker && SECOND.has(hit.word)) to = null;                 // speaker mode: 'إنت' addresses somebody else
    if (!to && !al && !opts.speaker) { const mm = (dir === 'm2f' ? VRE_M : VRE_F).exec(w); if (mm) { to = mm[1] + (dir === 'm2f' ? 'ت' : 'ي') + mm[2]; hit = { word: w, art: '', keep: pre }; keep = pre; } }
    if (!to) return m;
    changed.push([hit.word, to]); return keep + (hit.art || '') + to;
  });
  return { text: out, changed, candidates: cand };
}
const CLAUSE = /([.،,؟?!؛:]+\s*)/;
module.exports = { agree, PAIRS, AMBIG, CLAUSE };
