#!/usr/bin/env node
/* PLAY EDITION builder for «مودي وعبودي»  (generic edition for ANY family; personalised at RUNTIME by engine/family.js + engine/family_ui.js).
     node tools/play/build.js <outdir> [--force] [--title "اسم اللعبة"] [--no-icons] [--keep-voice] [--quiet]
   Copies the base game (moody/, never modified) to <outdir> and patches the COPY:
     1. every owner-specific name / relation is turned into a ROLE TOKEN ({m} {a} {t} {n} {gm} {gmt} {gmn} {aunt1} {aunt1n} {uncle1} {cz1}..{cz5} {fr} {school} {dcity} {dcountry}) by ONE dictionary pass
        over the string literals / comments of every source file (lib/lexer.js splits code from text; clitics و ف ب ك ل are handled: لمودي -> ل{m}),
     2. the owner's extended family characters become generic role characters (ids cz1..cz5 aunt1 aunt2 uncle1 + a new grandfather gf), the owner's cartoon avatars are dropped,
     3. owner-only facts (Abha, Asir, the school, Egypt-only city names of the trip) are made generic; '@owner-family' levels of the runner world become role-token levels with a `req`
        (needs grandmother / travelling dad) so that the runtime can hide them,
     4. the runtime modules are wired in (engine/family.js, engine/family_ui.js), the neutral narration is switched on (Moody.voice.neutral = true), storage key / titles / PWA bits are set,
     5. self checks: syntax of every JS file, leak scan for the owner's terms.
   Metadata (report, patch log) is written OUTSIDE <outdir> to <outdir>.meta/ .  Anything that cannot be decided automatically is listed in build-report.json › review. */
'use strict';
const fs = require('fs'), path = require('path'), cp = require('child_process'), vm = require('vm');
const FB = require('../family/build.js');
const { scan, join } = require('../family/lib/lexer');
const AR = require('../family/lib/ar');
const ROOT = FB.ROOT;
const jsq = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'";

const PLAY = { title: 'مغامرات العيلة', subtitle: 'أبطال صغيرين وعيلة كبيرة', saveKey: 'play_moody_v1', cache: 'play' };
const PERSONA = { moody: 'يوسف', aboody: 'آدم', toota: 'مريم', nemo: 'ليلى' };     // default names of the four kid slots (also used inside chars.js / voice.js defaults)
const ID_RENAME = { ofa: 'cz1', toti: 'cz2', luka: 'cz3', beno: 'cz4', medo: 'cz5', amani: 'aunt1', nada: 'aunt2', kamal: 'uncle1' };
const GATHER_FILES = new Set(['worlds/gathering.js', 'worlds/gathering_art.js', 'worlds/gathering_kits.js', 'content/q_gathering.js']);

class Project extends FB.Project {
  constructor() { super(); this.log.edits = []; }
}

/* ------------------------------------------------------------------ small helpers */
function R(P, f, from, to, o) { return P.rep(f, from, to, o); }
const only = (P, files, fn) => files.forEach(f => { if (P.files.has(f)) fn(f); });

/* ------------------------------------------------------------------ 1. generic patches (shell, storage, titles, hub coupling) */
function genericPatches(P, opt) {
  const title = opt.title;
  R(P, 'engine/core.js', "M.SAVE_KEY = 'hub_moody_v1'", "M.SAVE_KEY = '" + PLAY.saveKey + "'", { what: 'save key of the Play edition' });
  R(P, 'engine/core.js', /\n\s*try \{ const n = localStorage\.getItem\('hubPlayerName'\);[^\n]*\n/, '\n', { what: 'drop hub player-name coupling' });
  R(P, 'engine/core.js', "names: { moody: 'مودي', aboody: 'عبودي', me: '', toota: 'توتا', nemo: 'نيمو', nana: 'ننا زوزا', baba: 'بابا' }", "names: { moody: " + jsq(PERSONA.moody) + ", aboody: " + jsq(PERSONA.aboody) + ", me: '', toota: " + jsq(PERSONA.toota) + ", nemo: " + jsq(PERSONA.nemo) + ", nana: 'تيتة', baba: 'بابا' }", { what: 'save defaults: generic persona names' });
  R(P, 'engine/core.js', /\n  M\.fmt = s => \{[^\n]*\n/, "\n  M.fmt = s => String(s == null ? '' : s);   // replaced by engine/family.js (role tokens)\n", { what: 'M.fmt: owner default names removed', exact: 1 });
  R(P, 'sw.js', "const PREFIX = 'moody-', VOICE_CACHE = 'moody-voice', META_CACHE = 'moody-meta',", "const PREFIX = 'moody-" + PLAY.cache + "-', VOICE_CACHE = 'moody-" + PLAY.cache + "-voice', META_CACHE = 'moody-" + PLAY.cache + "-meta',", { what: 'service worker cache names' });
  R(P, 'sw.js', /\n\s*\['moody', 'aboody', 'toota', 'nemo', 'baba'\]\.forEach\(n => out\.add\(scopeUrl\('assets\/' \+ n \+ '_cartoon\.jpg'\)\)\);/, '', { what: 'no owner cartoon avatars in the shell cache' });
  R(P, 'index.html', '<script defer src="../pwa-game.js"></script>', '<script defer src="pwa-game.js"></script>', { what: 'standalone pwa helper (no ../)' });
  R(P, 'engine/audio.js', 'cheer(kind) {', 'cheer(kind) { return; /* standalone edition: no cross-game clips */', { what: 'disable cross-game cheer clips' });
  R(P, 'engine/audio.js', "'../sonic/assets/v/'", "'assets/v/'", { what: 'dead path of the disabled cheer clips' });
  R(P, 'engine/ui.js', /const hubLink = \(\) => h\('a', \{[^\n]*\n/, 'const hubLink = () => null;\n', { what: 'no link to the games hub' });
  /* title / html / manifest */
  R(P, 'engine/ui.js', "h('div', { class: 'title' }, 'مودي وعبودي')", "h('div', { class: 'title'" + (title.length > 14 ? ", style: 'font-size:" + Math.max(40, Math.floor(1100 / title.length)) + "px;white-space:nowrap'" : '') + ' }, ' + jsq(title) + ')', { what: 'title screen' });
  R(P, 'engine/ui.js', "h('div', { class: 'ttl-tag' }, 'يوميات ومغامرات')", "h('div', { class: 'ttl-tag' }, " + jsq(PLAY.subtitle) + ')', { what: 'title screen subtitle' });
  R(P, 'index.html', /<title>[^<]*<\/title>/, '<title>' + title + '</title>', { what: 'html title' });
  R(P, 'index.html', /<meta name="description" content="[^"]*">/, '<meta name="description" content="' + title + ': ألعاب ومغامرات وألغاز للأطفال بالعربي المصري، بأسماء وشكل عيلتك">', { what: 'html description' });
  R(P, 'index.html', /apple-mobile-web-app-title" content="[^"]*"/, 'apple-mobile-web-app-title" content="' + title + '"', { what: 'ios app title' });
  R(P, 'index.html', '<div id="splash" aria-hidden="true"><b>مودي وعبودي</b>', '<div id="splash" aria-hidden="true"><b>' + title + '</b>', { what: 'splash title' });
  const mf = JSON.parse(P.get('manifest.json')); mf.name = title; mf.short_name = title; mf.description = title + ': مغامرات وألغاز وقيم للأطفال بالعربي المصري، بأسماء وشكل عيلتك'; mf.id = './?edition=play'; P.files.set('manifest.json', JSON.stringify(mf, null, 1));
  /* the runtime modules */
  R(P, 'index.html', '<script src="engine/chars.js?v=8"></script>', '<script src="engine/chars.js?v=8"></script>\n<script src="engine/family.js?v=8"></script>', { what: 'wire engine/family.js' });
  R(P, 'index.html', '<script src="engine/call.js?v=8"></script>', '<script src="engine/call.js?v=8"></script>\n<script src="engine/family_ui.js?v=8"></script>', { what: 'wire engine/family_ui.js' });
  R(P, 'engine/boot.js', '    M.flow.toTitle();', '    M.family.boot(); M.family.ui.boot(M.flow.toTitle);', { what: 'boot: apply the family, wizard on first launch' });
  /* neutral narration */
  R(P, 'engine/voice.js', 'V.neutral = false;', 'V.neutral = true;', { what: 'NEUTRAL narration (clips cannot say the family\'s names)' });
  R(P, 'engine/voice.js', "const DEFAULTS = { m: 'مودي', a: 'عبودي', me: 'يا بطل', t: 'توتا', n: 'نيمو' };", "const DEFAULTS = { m: " + jsq(PERSONA.moody) + ", a: " + jsq(PERSONA.aboody) + ", me: 'يا بطل', t: " + jsq(PERSONA.toota) + ", n: " + jsq(PERSONA.nemo) + " };", { what: 'voice: default persona names' });
  /* tokens everywhere text is built: HTML text nodes, aria labels, canvas text */
  R(P, 'engine/ui.js', 'document.createTextNode(String(c))', 'document.createTextNode(M.fmt(String(c)))', { what: 'UI text nodes resolve role tokens', exact: 1 });
  R(P, 'engine/gfx.js', "G.text = function (g, s, x, y, o) {\n    o = o || {};", "G.text = function (g, s, x, y, o) {\n    o = o || {}; if (typeof s === 'string' && s.indexOf('{') >= 0) s = M.fmt(s);", { what: 'canvas text resolves role tokens' });
  /* the child's names screen = the family editor; parents' corner texts */
  R(P, 'engine/ui.js', 'UI.names = function (f) {\n', 'UI.names = function (f) {\n    if (M.family && M.family.ui) return M.family.ui.edit(f);\n', { what: 'names screen -> family editor' });
  R(P, 'engine/ui.js', "UI.btn('تغيير الأسماء', 'blue', f.names, 'settings')", "UI.btn('عيلتنا: الأسماء والشكل', 'blue', f.names, 'settings')", { what: 'parents corner button' });
  R(P, 'engine/ui.js', "'تلقائي: عبودي (٦ سنين) بيجاوب ألغاز أسهل ومودي (٩ سنين) ألغاز أصعب.'", "'تلقائي: كل بطل بيجاوب ألغاز على قد سنّه (من الأعمار اللي كتبتوها في «عيلتنا»): لحد ٧ سنين ألغاز أسهل، وبعدها أصعب.'", { what: 'parents corner age text' });
  R(P, 'engine/ctx.js', "return who === 'aboody' ? 6 : 9;", "return M.family ? M.family.tierFor(who) : (who === 'aboody' ? 6 : 9);", { what: 'question tier from the ages the parents entered' });
  R(P, 'engine/ctx.js', "('بدّل لـ' + M.save.data.names[id] + ' من فوق')", "('بدّل لـ' + ({ moody: '{m}', aboody: '{a}', toota: '{t}', nemo: '{n}' }[id] || M.save.data.names[id]) + ' من فوق')", { what: 'switch-hero hint uses role tokens (the narration never says names)', exact: 1 });
  R(P, 'engine/runner.js', "ctx.prompt(M.fmt(o.prompt || 'اجري للهدف!'))", "ctx.prompt(o.prompt || 'اجري للهدف!')", { what: 'runner prompt keeps its role tokens (the HUD formats it; the narration must stay neutral)', exact: 1 });
  R(P, 'worlds/sea.js', "h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:96px;height:96px;border-width:5px', alt: '' })", "(() => { const a = M.ui.avatar(id, 96, { cls: 'av', size: true }); a.style.borderWidth = '5px'; return a; })()", { what: 'sea: drawn avatar instead of the owner jpg', exact: 1 });
  /* title medals = the first two children of the family */
  R(P, 'engine/ui.js', "const el = h('div', null, medal('moody', 'right', 'b'), medal('aboody', 'left', 'o'),", "const tid = M.family.titleIds(), el = h('div', null, medal(tid[0], 'right', 'b'), medal(tid[1], 'left', 'o'),", { what: 'title screen shows the family kids' });
  /* the daily call needs a travelling dad */
  R(P, 'engine/ui.js', /tile\('بابا بيتصل', 'phone', \['#26a85a', '#76e0a0', '#13703a'\], f\.call, M\.callPending && M\.callPending\(\)\), /, "(M.family.dadTravels() ? tile('بابا بيتصل', 'phone', ['#26a85a', '#76e0a0', '#13703a'], f.call, M.callPending && M.callPending()) : null), ", { what: 'daily call only when dad travels', exact: 1 });
  /* cameo roles that are left out of some worlds when the parents did not enable them */
  R(P, 'engine/ctx.js', "    ctx.say = function (who, text, o) {\n      o = o || {};\n      return mk((done, cl) => {", "    ctx.say = function (who, text, o) {\n      o = o || {};\n      if (M.family && M.family.muted(who, world.id)) return Promise.resolve();   // Play edition: cameo role not enabled by the parents\n      return mk((done, cl) => {", { what: 'cameo lines of roles that are not enabled are skipped', exact: 1 });
  R(P, 'engine/stage.js', "    this.cast = cast && cast.length ? cast.slice() : ['moody', 'aboody']; ", "    this.cast = cast && cast.length ? cast.slice() : ['moody', 'aboody']; if (M.family) this.cast = this.cast.filter(k => !M.family.muted(k)); ", { what: 'muted roles leave the cast' });
  R(P, 'engine/stage.js', "if (name !== 'hidden') Object.keys(this.heroes).forEach(k => { if (this.cast.indexOf(k) < 0) this.heroes[k].visible = false; });", "if (name !== 'hidden') Object.keys(this.heroes).forEach(k => { if (this.cast.indexOf(k) < 0 || (M.family && M.family.muted(k))) this.heroes[k].visible = false; });", { what: 'muted roles are not shown' });
  /* runtime hiding of runner levels (req) */
  R(P, 'worlds/runs2.js', 'id: d.id, title: d.title,', 'id: d.id, req: d.req, title: d.title,', { what: 'runs: stage requirement flows into the mission object' });
}

/* ------------------------------------------------------------------ 1b. owner-specific CONTENT made generic (runs on the ORIGINAL text, before ids are renamed and names turned into tokens) */
function contentPatches(P) {
  /* ---- trip world: the destination is "dad's city" (tokens {dcity} {dcountry}); scenery stays (a cool hill town with mist and a cable car) but no real-place claims ---- */
  const S = 'worlds/saudi.js';
  R(P, S, "title: 'السفر لبابا في السعودية'", "title: 'السفر لبابا'", { what: 'trip world title', exact: 1 });
  R(P, 'worlds/registry.js', "title: 'السفر لبابا في السعودية'", "title: 'السفر لبابا'", { what: 'trip world card title', exact: 1 });
  R(P, S, "'بكرة هنسافر لبابا في السعودية.. يلا نجهّز الشنطة!'", "'بكرة هنسافر لبابا.. يلا نجهّز الشنطة!'", { exact: 1 });
  R(P, S, "نسافر لبابا في أبها!", "نسافر لبابا في أبها!", { optional: true });
  R(P, S, "'الله! إحنا فوق السحاب! القاهرة بقت صغيرة أوي!'", "'الله! إحنا فوق السحاب! البيوت بقت صغيرة أوي!'", { exact: 1 });
  R(P, S, "'الحمد لله على السلامة. أبها في منطقة عسير، في جبال عالية وجوّها حلو.'", "'الحمد لله على السلامة. أبها في جبال عالية وجوّها حلو.'", { exact: 1 });
  R(P, S, "ده الطراز العسيري يا {m}. والجبال هنا من أعلى جبال المملكة.", "ده الطراز المحلي يا {m}. والجبال هنا عالية أوي.", { exact: 1 });
  R(P, S, "'وصلنا السودة! من أعلى القمم في المملكة. بصّوا السحاب تحتنا!'", "'وصلنا فوق الجبل! بصّوا السحاب تحتنا!'", { exact: 1 });
  R(P, S, "أبرد بكتير من القاهرة.", "أبرد بكتير من بلدنا.", { exact: 1 });
  R(P, 'content/baba_calls.js', "بابا بيكلمكم من السعودية.", "بابا بيكلمكم من السفر.", { exact: 1 });
  /* uncle + his son in the trip world: cameo, only when the parents enabled an uncle */
  R(P, S, "st.hero('baba').visible = true; st.hero('kamal').visible = true;", "st.hero('baba').visible = true; st.hero('kamal').visible = M.family.on('uncle1');", { exact: 1 });
  R(P, S, "'بابا!!! ده بابا! ومعاه عمو كمال!'", "(M.family.on('uncle1') ? 'بابا!!! ده بابا! ومعاه عمو كمال!' : 'بابا!!! ده بابا!')", { exact: 1 });
  R(P, S, "await ctx.say('baba', 'بطّل فضايح يا كمال!');", "if (M.family.on('uncle1')) await ctx.say('baba', 'بطّل فضايح يا كمال!');", { exact: 1 });
  R(P, S, /(\n[ \t]*)(await ctx\.say\('kamal', 'وأنا كمان عايز أبعت هدية[^\n]*\n[ \t]*const lk = await ctx\.games\.dragdrop\(\{[\s\S]*?\n[ \t]*\}\);\n[ \t]*ctx\.heroes\(POS\);[^\n]*\n[ \t]*await ctx\.say\('kamal', 'لوكا هيفرح[^\n]*\n[ \t]*await ctx\.say\('aboody', 'وسلّم لي على لوكا![^\n]*)/, (m, ind, body) => ind + 'if (M.family.on(\'uncle1\')) {' + ind + '  ' + body.replace(/\n/g, '\n  ') + ind + '}', { exact: 1, what: 'gift for the uncle\'s son only when the uncle is enabled' });
  /* ---- family gathering: Abha stories -> travel stories ---- */
  const G = 'worlds/gathering.js';
  R(P, G, "جبت لكم هدايا من أبها.", "جبت لكم هدايا من السفر.", { exact: 1 });
  R(P, G, "وسمعنا حكايات بابا وعمو كمال من أبها", "وسمعنا حكايات بابا وعمو كمال من السفر", { exact: 1 });
  R(P, G, "وبين الجولات هقول لكم حكايات من أبها!", "وبين الجولات هقول لكم حكايات من السفر!", { exact: 1 });
  R(P, G, "حكاية من أبها! أول مرة ركبت التلفريك", "حكاية من السفر! أول مرة ركبت التلفريك", { exact: 1 });
  R(P, G, "مرة الضباب نزل فجأة في أبها وأنا ماشي.", "مرة الضباب نزل فجأة وأنا ماشي في الجبل.", { exact: 1 });
  R(P, G, "في أبها بيوت من الحجر بشبابيك بيضا زي الكحل في العين. جميلة أوي!", "في البلاد اللي سافرت لها بيوت من الحجر بشبابيك بيضا زي الكحل في العين. جميلة أوي!", { exact: 1 });
  R(P, G, "ولسه لسه في هدايا أبها!", "ولسه لسه في هدايا من السفر!", { exact: 1 });
  R(P, 'content/q_gathering.js', /Q\(9, 'gt_quiz', 'abha',[^\n]*/, "Q(9, 'gt_quiz', 'abha', 'geography', 'بابا بيشتغل في مدينة بعيدة. أسرع طريق نروح له بإيه؟', ['بالطيارة', 'بالدراجة', 'ماشيين'], 'بتطير فوق السحاب', { explain: 'الطيارة بتوصّلنا للمدن البعيدة في ساعات.' });", { exact: 1 });
  R(P, 'content/q_gathering.js', "وصلوا من السعودية.", "وصلوا من السفر.", { exact: 1 });
  /* ---- grandfather cameos (only when the parents added a grandfather) ---- */
  R(P, 'worlds/nana.js', "          await ctx.say('narrator', 'ننا فتحت الباب. يلا نسلّم عليها!');", "          await ctx.say('narrator', 'ننا فتحت الباب. يلا نسلّم عليها!');\n          if (M.family.on('gf')) { ctx.cast(ALL5.concat(['gf']), ALL4); ctx.heroes(place({ nana: { x: 450, y: 446, dir: 1, visible: true }, gf: { x: 330, y: 446, dir: 1 } })); await ctx.say('gf', 'السلام عليكم يا أبطال! نوّرتوا البيت.', { anim: 'wave' }); }", { exact: 1 });
  R(P, G, "          await ctx.say('nana', 'وبابا وعمو كمال، ولادي الغاليين!", "          if (M.family.on('gf')) { ctx.cast(EVERY.concat(['gf']), ALL4); await ctx.say('gf', 'الحمد لله إن العيلة كلها اتجمعت. نوّرتوا يا حبايبي!', { anim: 'wave' }); }\n          await ctx.say('nana', 'وبابا وعمو كمال، ولادي الغاليين!", { exact: 1 });
  /* ---- trip questions: real-place facts -> neutral ones ---- */
  const QS = 'content/q_saudi.js', rq = (id, line) => R(P, QS, new RegExp("^[ \\t]*Q9\\('" + id + "'.*$", 'm'), () => line, { exact: 1, what: 'trip question ' + id + ' made neutral' });
  rq('f4', "  Q9('f4', 3, 'geography', 'الطيارة بتهبط في؟', ['المطار', 'الشارع', 'البحر'], 'مكان مخصوص للطيارات', { emoji: '🛬', explain: 'الطيارة بتهبط في المطار' });");
  rq('b3', "  Q9('b3', 4, 'geography', 'سافرنا بالطيارة لمدينة بعيدة. المسافة بين مدينتنا ومدينة بابا..', ['بعيدة وبنوصلها بالطيارة', 'قريبة نوصلها ماشيين', 'في نفس الشارع'], 'احنا ركبنا طيارة', { emoji: '🗺️', explain: 'الطيارة بتوصّلنا للمدن البعيدة في ساعات' });");
  rq('d3', "  Q9('d3', 5, 'geography', 'مدينة بابا فيها جبال وسحاب وضباب. جوّها غالبًا..', ['لطيف وبارد', 'حار جدًا', 'ثلج دايمًا'], 'الجبال العالية جوها بارد', { emoji: '⛰️', explain: 'في الجبال العالية الجو بيبقى لطيف وفيه ضباب' });");
  rq('c4', "  Q9('c4', 6, 'geography', 'التلفريك بيوصّلنا لفوق الجبل بسرعة. صح ولا غلط؟', ['صح', 'غلط'], 'عربيته معلّقة في كابل قوي', { emoji: '🏔️', explain: 'التلفريك بيطلّع الناس لفوق الجبل' });");
  rq('c6', "  Q9('c6', 6, 'math', 'لو الحرارة عندنا ٣٠ درجة وفوق الجبل ٢٠ درجة. الفرق كام؟', ['١٠ درجات', '٥ درجات', '١٥ درجة'], '٣٠ − ٢٠', { emoji: '🌡️' });");
  const QR = 'content/q_runs.js';
  R(P, QR, /^[ \t]*q\('b1', 9, 'geography', \['runs_abha'\].*$/m, () => "  q('b1', 9, 'geography', ['runs_abha'], 'الطيارة بتهبط في؟', ['المطار', 'الشارع', 'البحر'], 'مكان مخصوص للطيارات');", { exact: 1 });
  R(P, QR, /^[ \t]*q\('b2', 9, 'geography', \['runs_abha'\].*$/m, () => "  q('b2', 9, 'geography', ['runs_abha'], 'جو الجبال العالية غالبًا؟', ['معتدل وبارد', 'حار جدًا', 'ثلج دايمًا'], 'جبال عالية');", { exact: 1 });
  R(P, QR, /^[ \t]*q\('b4', 9, 'geography', \['runs_abha'\].*$/m, () => "  q('b4', 9, 'geography', ['runs_abha'], 'البيوت التراثية القديمة في الجبال كانت من؟', ['الحجر', 'التلج', 'الورق'], 'بيوت تراثية قديمة');", { exact: 1 });
  R(P, 'content/q_runs2.js', /\['أبها في؟', \[[^\]]*\], '[^']*'\]/, "['الطيارة بتهبط في؟', ['المطار', 'الشارع', 'البحر'], 'مكان مخصوص للطيارات']", { exact: 1, what: 'runs gate question that named the trip city' });
  /* ---- runner levels tagged @owner-family become role-token levels; `req` lets the runtime hide the ones that need a grandmother / a travelling dad ---- */
  const REQ = { r1: 'gm', r3: 'dad', r5: 'gm', r12: 'dad', r13: 'dad', r14: 'gm' };
  for (const f of ['worlds/runs.js', 'worlds/runs2.js']) {
    R(P, f, /(id: '(r\d+)',) \/\* @owner-family \*\//g, (m, a, id) => a + (REQ[id] ? " req: '" + REQ[id] + "'," : ''), { what: 'runner levels: @owner-family tag -> req', optional: true });
    P.files.set(f, P.get(f).replace(/Stages that need the owner's family carry the literal comment  slash-star @owner-family star-slash  on their `id:` line; the others are generic\./, 'Stages that need a grandmother or a travelling dad carry `req: \'gm\'` / `req: \'dad\'` (the runtime hides them when the parents did not enable that).'));
  }
  R(P, 'worlds/runs.js', "/* the cousin NPC exists only in the owner's edition (the family builder strips it and turns the literal into 'friend'): F = null there -> speaker 'friend', no stage actor */", "/* F = the cousin / friend NPC of the family (role character cz1) */", { optional: true });
}

/* ------------------------------------------------------------------ 2. characters table */
function charactersPatch(P) {
  let s = P.get('engine/chars.js');
  /* ids of the extended family become role ids (word-boundary, code + strings) */
  const idRe = new RegExp('\\b(' + Object.keys(ID_RENAME).join('|') + ')\\b', 'g');
  s = s.replace(idRe, m => ID_RENAME[m]);
  /* no owner cartoon avatars, no full names */
  s = s.replace(/ img: 'assets\/[a-z]+_cartoon\.jpg',/g, '').replace(/ full: '[^']*',/g, '');
  /* default (persona) names instead of tokens: DEFS rows must hold plain text */
  const plain = { 'مودي': PERSONA.moody, 'عبودي': PERSONA.aboody, 'توتا': PERSONA.toota, 'نيمو': PERSONA.nemo, 'ننا زوزا': 'تيتة', 'أوفا': 'كريم', 'توتي': 'جودي', 'عمتو أماني': 'عمتو سلوى', 'عمتو ندى': 'عمتو هدى', 'بينو': 'هشام', 'ميدو': 'عمر', 'عمو كمال': 'عمو سامي', 'لوكا': 'حمزة' };
  const rep = AR.wordReplacer(Object.entries(plain));
  const segs = scan(s); for (const sg of segs) if (sg.type === 'str' || sg.type === 'comment') sg.text = rep(sg.text); s = join(segs);
  s = s.replace(/Moody & Aboody/g, 'Family Adventures').replace(/\/\* ---- extended family \(owner's edition only;[^\n]*\*\//, "/* ---- extended family = ROLE characters (ids cz1..cz5 aunt1 aunt2 uncle1; names / looks come from engine/family.js at run time). All playable:false. Extra flags: phone/spoon/car/backpack/apron = props, idle = default idle pose, bow/quiff/part/fringe = hair details, fidget/curious = idle behaviour ---- */");
  /* the grandfather (role gf): same family of drawing as nana / baba */
  const gfRow = "    gf: { name: 'جدو', gender: 'm', age: 70, sc: .94, L: 52, T: 58, R: 29, hr: .95, sw: 23, skin: '#d9a374', skinD: '#c28b5c', shirt: '#9bb4c7', pants: '#8c8574', shoe: '#5a4636', eye: .95, w: 21, wf: 12, a1: 23, a2: 23, top: 'polo', hair: 'short', hairC: '#dcdce2', beard: '#e6e6ea', glasses: '#6a5646', smile: 'big', browW: 5, wrinkles: true, stoop: .035, abilities: ['wise', 'kind'], ability: 'حكيم وحنون', badge: ['ج', '#9bb4c7'], playable: false, speed: 130 },\n";
  s = s.replace(/(\n\s*cz1: \{ name:)/, '\n' + gfRow.replace(/\n$/, '') + '$1');
  s = s.replace(/(\n  \};\n  Object\.keys\(V4P\))/, "\n    gf: { eyeK: 'man', browK: 1.1, mw: .8, soft: true, lips: true, shoeK: 'dress', lines: 2, hemC: '#8c8574', poise: { head: .03, rot: .004, sh: -.3 }, iris: '#5a3a24', blush: .1 }$1".replace(/^\n/, ',\n'));
  if (!/\n\s*gf: \{ name:/.test(s) || !/gf: \{ eyeK/.test(s)) throw new Error('chars.js: could not add the grandfather row (PATCH DRIFT)');
  P.files.set('engine/chars.js', s); P.log.patches.push({ file: 'engine/chars.js', what: 'role ids, no avatars, persona names, grandfather row', n: 1 });
  /* every other file: ids */
  for (const [f, src] of P.files) if (/^(engine|worlds|content)\/.*\.js$/.test(f) && f !== 'engine/chars.js') { const n = src.replace(idRe, m => ID_RENAME[m]); if (n !== src) P.files.set(f, n); }
  /* voices of the new/renamed roles */
  R(P, 'engine/voice.js', /Object\.assign\(VOICES, \{ cz1: 'boy_mid'/, "Object.assign(VOICES, { gf: 'uncle', cz1: 'boy_mid'", { what: 'voice of the grandfather' });
  R(P, 'engine/voice.js', /\/\/ extended family \(owner edition; stripped by tools\/family\/build\.js\)/, '// extended family = role characters of the Play edition', { optional: true });
  /* stage.js: positions tables get the grandfather */
  R(P, 'engine/stage.js', 'nana: [560, fy + 2, -1],', 'nana: [560, fy + 2, -1], gf: [500, fy + 4, -1],', { what: 'stage slots: grandfather' });
  R(P, 'engine/stage.js', 'nana: [200, 534, 1],', 'nana: [200, 534, 1], gf: [240, 534, 1],', { what: 'stage corner slots: grandfather' });
}

/* ------------------------------------------------------------------ 3. dictionary -> role tokens */
function dictionaries() {
  const common = [['مودي', '{m}'], ['عبودي', '{a}'], ['توتا', '{t}'], ['نيمو', '{n}'], ['تسنيم', '{t}'], ['ترنيم', '{n}'],
    ['ننا زوزا', '{gm}'], ['ننا', '{gmt}'], ['زوزا', '{gmn}'],
    ['عمتو أماني', '{aunt1}'], ['عمتكم أماني', '{aunt1}'], ['أماني', '{aunt1n}'], ['عمتو ندى', '{aunt2}'], ['عمتكم ندى', '{aunt2}'], ['ندى', '{aunt2n}'], ['عمو كمال', '{uncle1}'], ['كمال', '{uncle1n}'],
    ['توتي', '{cz2}'], ['لوكا', '{cz3}'], ['بينو', '{cz4}'], ['ميدو', '{cz5}'],
    ['مدرسة آل زياد الابتدائية', '{school}'], ['آل زياد', '{school}']];
  const dest = [['مطار القاهرة', 'المطار'], ['مطار أبها', 'مطار {dcity}'], ['منطقة عسير', 'المنطقة'], ['جبال السودة', 'الجبال'], ['جبل السودة', 'الجبل'], ['السودة', 'الجبل'], ['الطراز العسيري', 'الطراز المحلي'], ['العسيري', 'المحلي'], ['جبال عسير', 'الجبال'], ['عسير', 'المنطقة'], ['أبها', '{dcity}'], ['السعودية', '{dcountry}'], ['المملكة', 'البلد']];
  const mk = extra => AR.wordReplacer(common.concat(extra || []));
  return { gather: mk([['أوفا', '{cz1}']]), other: mk([['أوفا', '{fr}']]), dest: AR.wordReplacer(dest) };
}
const DEST_FILES = new Set(['worlds/runs.js', 'worlds/runs2.js', 'worlds/runs_art.js', 'worlds/runs_art2.js', 'content/q_runs.js', 'content/q_runs2.js', 'worlds/saudi.js', 'worlds/saudi_art.js', 'content/q_saudi.js', 'content/baba_calls.js', 'engine/call.js', 'worlds/registry.js', 'worlds/nana.js', 'worlds/home.js']);
const SKIP_DICT = new Set(['engine/chars.js', 'engine/family.js', 'engine/family_ui.js']);   // chars.js: plain persona names; family*.js: the runtime modules define the roles themselves (titles like «ننا» are data there)
function textPass(P) {
  const D = dictionaries();
  for (const [f, src] of P.files) {
    if (!/\.(js|html|json|css)$/.test(f) || SKIP_DICT.has(f) || f === 'manifest.json') continue;
    const dict = GATHER_FILES.has(f) ? D.gather : D.other, dest = DEST_FILES.has(f);
    const map = t => { let o = dict(t); if (dest) o = D.dest(o); return o; };
    if (f.endsWith('.css')) { P.files.set(f, src.replace(/Moody & Aboody/g, 'Family Adventures')); continue; }
    if (!f.endsWith('.js')) { P.files.set(f, map(src)); continue; }
    const segs = scan(src);
    for (const sg of segs) {
      if (sg.type === 'code' || sg.type === 'regex') continue;
      if (sg.type === 'comment') { sg.text = map(sg.text.replace(/Moody & Aboody/g, 'Family Adventures').replace(/Nana Zoza/g, 'the grandmother').replace(/\bAboody\b/g, 'the younger boy').replace(/(?<![.\w])Moody\b(?![.(\[\w])/g, 'the older boy').replace(/\bAbha\b/g, 'the destination city').replace(/\bAsir\b/g, 'the region').replace(/\bAl-Qatt Al-Asiri\b/g, 'regional').replace(/\bAsiri\b/g, 'regional').replace(/\bSouda\b/g, 'the mountain')); continue; }
      sg.text = map(sg.text);
    }
    P.files.set(f, join(segs));
  }
}

/* ------------------------------------------------------------------ main */
function build(outDir, flags, opt) {
  outDir = path.resolve(outDir);
  if (fs.existsSync(outDir) && fs.readdirSync(outDir).length && !flags.has('force')) { console.error('Refusing to write into a non-empty folder (use --force): ' + outDir); process.exit(2); }
  const P = new Project(); P.load();
  const report = { edition: 'play', built: new Date().toISOString(), warnings: [], review: [], patches: [], leaks: [], syntax: [] };
  genericPatches(P, opt);
  contentPatches(P);
  charactersPatch(P);
  textPass(P);
  const keepV = flags.has('keep-voice') && fs.existsSync(path.join(outDir, 'assets', 'voice')) ? outDir + '.voice-keep' : null;
  if (keepV) { fs.rmSync(keepV, { recursive: true, force: true }); fs.renameSync(path.join(outDir, 'assets', 'voice'), keepV); }
  fs.rmSync(outDir, { recursive: true, force: true }); fs.mkdirSync(outDir, { recursive: true });
  for (const [f, s] of P.files) { const dst = path.join(outDir, f); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, s); }
  if (keepV) { fs.mkdirSync(path.join(outDir, 'assets'), { recursive: true }); fs.renameSync(keepV, path.join(outDir, 'assets', 'voice')); }
  else { fs.mkdirSync(path.join(outDir, 'assets', 'voice'), { recursive: true }); fs.writeFileSync(path.join(outDir, 'assets', 'voice', 'manifest.json'), '{}'); }
  if (!flags.has('no-icons')) { const r = cp.spawnSync(process.execPath, [path.join(__dirname, 'icons.js'), outDir], { encoding: 'utf8' }); if (r.status) report.warnings.push('icons failed: ' + (r.stderr || '').slice(0, 200)); }
  report.syntax = [];
  for (const [f, s] of P.files) if (f.endsWith('.js')) { try { new vm.Script(s, { filename: f }); } catch (e) { report.syntax.push(f + ': ' + e.message); } }
  report.patches = P.log.patches; report.review = P.log.review;
  const meta = outDir + '.meta'; fs.mkdirSync(meta, { recursive: true });
  fs.writeFileSync(path.join(meta, 'build-report.json'), JSON.stringify(report, null, 1));
  if (!flags.has('quiet')) { console.log('Built the Play edition -> ' + outDir + ' (metadata: ' + meta + ')'); console.log('  patches: ' + report.patches.length + ' | syntax errors: ' + report.syntax.length); report.syntax.forEach(e => console.log('   ' + e)); }
  return report;
}
module.exports = { build, PLAY, PERSONA, ID_RENAME };
if (require.main === module) {
  const argv = process.argv.slice(2), flags = new Set(), pos = []; let title = PLAY.title;
  for (let i = 0; i < argv.length; i++) { if (argv[i] === '--title') title = argv[++i]; else if (argv[i].startsWith('--')) flags.add(argv[i].slice(2)); else pos.push(argv[i]); }
  if (!pos.length) { console.log('usage: node tools/play/build.js <outdir> [--force] [--title "..."] [--no-icons] [--quiet]'); process.exit(1); }
  try { const r = build(pos[0], flags, { title }); process.exit(r.syntax.length ? 3 : 0); } catch (e) { console.error('BUILD FAILED: ' + e.message); process.exit(2); }
}
