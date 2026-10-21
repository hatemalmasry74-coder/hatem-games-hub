/* engine/family_flip.js : RUNTIME gender agreement for the two DUO heroes (ids moody / aboody) when the family's children are girls ("girls-only" families).
   The stories are written with the duo as boys.  When the wizard puts a girl into the duo (Moody.family.flipSet() = ['moody'] | ['aboody'] | both), every line SPOKEN by that hero or ABOUT
   it (the token {m} / {a} is in the clause) goes through the curated masculine->feminine word table below (a port of tools/family/lib/gender.js, same rules as the family builder's text pass):
   clause by clause, the text before the first mention belongs to the speaker, a mention owns the words up to the next mention, "يا {a}" owns the clause before it.
   Imperatives addressed to the player («اضغط») stay masculine on purpose (the table does not touch them).  A curated table, NOT NLP: see tools/play/README.md "limits".
   API:  Moody.family.flip.gx(raw, speakerId, flipSet?) -> raw text with the agreement applied (tokens are kept)      Moody.family.flip.agree(text, 'm2f', opts)
   Also loadable by node (module.exports) so tools/play/flip_test.js can review every line.  Idempotent: flipping an already flipped line changes nothing. */
(function (root) {
  'use strict';
  const LET = '\\u0621-\\u063A\\u0641-\\u064A\\u0671-\\u06D3';
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
  const M2F = new Map(PAIRS.filter(p => p[0] !== p[1]));
  const VERBS = ['زحف', 'دخل', 'جيب', 'طلع', 'نزل', 'روح', 'لاقي', 'مسك', 'شيل', 'قدر', 'عرف', 'لعب', 'دوّر', 'فتح', 'قفل', 'حط', 'وصّل', 'ساعد', 'خد', 'عمل', 'شوف', 'سمع', 'جري', 'رسم', 'كمّل', 'نط', 'وقف', 'قعد', 'رمي', 'نضّف', 'رتّب', 'اشترى', 'فتّش'];
  const VRE_M = new RegExp('^(ه?)ي(' + VERBS.join('|') + ')$');
  const WORD = () => new RegExp('(?<![' + LET + '])([وفبكل]{0,2})(ال)?([' + LET + ']+)(?![' + LET + '])', 'g');
  const CLAUSE = /([.،,؟?!؛:]+\s*)/;

  /* masculine -> feminine for ONE piece of text (same algorithm as tools/family/lib/gender.js agree(..., 'm2f')) */
  function agree(text, dir, opts) {
    opts = opts || {}; const changed = [];
    const out = text.replace(WORD(), (m, pre, al, w) => {
      let hit = null, keep = pre;
      for (let k = 0; k <= pre.length && !hit; k++) { const word = pre.slice(k) + w, art = k === pre.length ? al : ''; if (M2F.has(word) && !(art && AMBIG.has(word))) hit = { word, art, keep: pre.slice(0, k) }; }
      let to = hit ? M2F.get(hit.word) : null; keep = hit ? hit.keep : pre;
      if (to && AMBIG.has(hit.word) && (!opts.pronouns || hit.art)) to = null;
      if (to && opts.speaker && SECOND.has(hit.word)) to = null;
      if (!to && !al && !opts.speaker) { const mm = VRE_M.exec(w); if (mm) { to = mm[1] + 'ت' + mm[2]; hit = { word: w, art: '', keep: pre }; keep = pre; } }
      if (!to) return m;
      changed.push([hit.word, to]); return keep + (hit.art || '') + to;
    });
    return { text: out, changed };
  }

  /* ---- clause ownership (port of textPass/genderString in tools/family/build.js, tokens only) ---- */
  const SLOT_OF = { m: 'moody', k1: 'moody', a: 'aboody', k2: 'aboody' };
  const TOKEN = '\\{(?:m|a|k1|k2)\\}';
  const slotOfTok = s => SLOT_OF[s.slice(1, -1)];
  const reAny = () => new RegExp(TOKEN, 'g'), reVoc = () => new RegExp('يا\\s+' + TOKEN, 'g');
  const FIRST = new RegExp('(?<![' + LET + '])[وفب]?أنا(?![' + LET + '])');
  const SECOND_RE = new RegExp('(?<![' + LET + '])(وانت|انت|إنت|أنت)(?![' + LET + '])');
  function pieces(txt, lead) {
    const ms = [...txt.matchAll(reAny())].map(m => ({ i: m.index, slot: slotOfTok(m[0]) }));
    if (!ms.length) return { list: [{ slot: lead, text: txt, speaker: true }], count: 0 };
    const list = [], voc = /يا\s+$/.test(txt.slice(0, ms[0].i));
    if (ms[0].i > 0) list.push({ slot: voc ? ms[0].slot : lead, text: txt.slice(0, ms[0].i), speaker: !voc });
    ms.forEach((m, k) => list.push({ slot: m.slot, text: txt.slice(m.i, k + 1 < ms.length ? ms[k + 1].i : txt.length) }));
    return { list, count: ms.length };
  }
  /* raw: tokenised string; speaker: hero id or null; flipped: array/Set of hero ids whose gender is female now */
  function gx(raw, speaker, flipped) {
    raw = String(raw == null ? '' : raw); const fl = flipped instanceof Set ? flipped : new Set(flipped || []);
    if (!fl.size) return raw;
    const mentions = [...raw.matchAll(reAny())].some(m => fl.has(slotOfTok(m[0])));
    if (!((speaker && fl.has(speaker)) || mentions)) return raw;
    const parts = raw.split(CLAUSE); let any = false, addressee = null;
    for (let i = 0; i < parts.length; i += 2) {
      const pc = pieces(parts[i], speaker);
      let out = pc.list.map(p => { if (!p.slot || !fl.has(p.slot)) return p.text; if (p.speaker && !FIRST.test(p.text)) return p.text;   /* speaker-owned words only when the clause says «أنا» (otherwise it may describe somebody else) */ const r = agree(p.text, 'm2f', { pronouns: !p.speaker && pc.count <= 1, speaker: !!p.speaker }); if (r.changed.length) { any = true; return r.text; } return p.text; });
      if (pc.count === 0 && addressee && fl.has(addressee) && SECOND_RE.test(parts[i])) { const r = agree(parts[i], 'm2f', { pronouns: false }); if (r.changed.length) { any = true; out = [r.text]; } }
      const vs = [...parts[i].matchAll(reVoc())]; if (vs.length) addressee = slotOfTok(vs[vs.length - 1][0].replace(/^يا\s+/, ''));
      parts[i] = out.join('');
    }
    return any ? parts.join('') : raw;
  }
  const API = { agree, gx, PAIRS };
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
  if (root && root.Moody) { root.Moody.flipLib = API; if (root.Moody.family) root.Moody.family.flip = API; }
})(typeof window !== 'undefined' ? window : null);
