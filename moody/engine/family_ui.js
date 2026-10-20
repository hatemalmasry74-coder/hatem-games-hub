/* engine/family_ui.js : the FAMILY WIZARD (first launch) and the family editor (parents' corner).
   Multi-step, big touch targets, Arabic RTL, no purchase / no parental gate / no network.  Every step has a spoken instruction that never contains a name (neutral clips).
   Steps:  welcome -> kids (pick 1-4 of the four slots) -> one step per kid (name, age, look) -> grandparents -> aunts + uncle -> cousins -> dad + school -> finish.
   Live preview = the REAL drawn character (Moody.chars.draw) with the look presets of engine/family.js.  Data goes to Moody.save.data.family (device only).
   API:  Moody.family.ui.boot(next)  first launch: wizard when no family is saved yet, else next()
         Moody.family.ui.edit({back, ok})  editor from the parents' corner (same steps, starts at the kids step, saves on the last step)
         Moody.family.titleIds()  ids of the two kids shown on the title screen
         Moody.family.ui.VOICE  every instruction (collected by tools/play/collect.js through Moody.voice.fixedStrings) */
(function () {
  'use strict';
  const M = window.Moody, F = M.family, UI = M.ui, h = UI.h, I = UI.i, D0 = F.D;

  F.titleIds = function () {
    const ids = F.KIDS.filter(id => F.on(id)); const rest = F.KIDS.filter(id => ids.indexOf(id) < 0);
    return ids.concat(rest).slice(0, 2);
  };

  /* ------------------------------------------------------------------ texts (no names inside: they are voiced) */
  const T = {
    welcomeH: 'أهلًا بيكم!', welcomeP: 'قولوا لنا على أطفالكم وعيلتكم، ونعمل لهم شخصيات تشبههم، وتلعب بأسمائهم.',
    privacy: 'كل اللي بتكتبوه بيتحفظ على الجهاز ده بس. مفيش إنترنت ولا حساب ولا مشاركة.', start: 'يلا نجهّز العيلة', dflt: 'جرّب بالأسماء الافتراضية',
    kidsH: 'مين هيلعب معانا؟', kidsP: 'اختاروا من طفل لأربعة أطفال. كل خانة ليها جنس ثابت، والخانات اللي مش اختاروها هيبقوا أصحاب للأبطال.',
    kidH: 'شكل البطل', kidP: 'اكتبوا اسمه، واختاروا سنّه وشكله.', gmH: 'الجدة والجد', gmP: 'فيه جدة أو جد في العيلة؟ اختاروا اللقب واكتبوا الاسم.',
    auH: 'العمّات والعم', auP: 'اكتبوا أسماء العمّات والعم. اللي مش موجود بنحط له اسم افتراضي.', czH: 'ولاد العم والعمّات', czP: 'كل واحد منهم شكله وسنّه ثابتين، وتقدروا تغيّروا الاسم واللون.',
    dadH: 'بابا والسفر', dadP: 'بابا مسافر؟ لو آه، هيبقى فيه عالم السفر لبابا ومكالمات بابا. واكتبوا اسم المدرسة لو تحبوا.',
    endH: 'جاهزين!', endP: 'العيلة اتجهّزت. تقدروا تغيّروا أي حاجة بعدين من ركن الأهل.', go: 'يلا نلعب!', save: 'احفظ', next: 'التالي', back: 'رجوع', hear: 'اسمع', cancel: 'إلغاء'
  };
  F.ui = F.ui || {};
  const VOICE = F.ui.VOICE = [T.welcomeH, T.welcomeP, T.privacy, T.start, T.dflt, T.kidsH, T.kidsP, T.kidH, T.kidP, T.gmH, T.gmP, T.auH, T.auP, T.czH, T.czP, T.dadH, T.dadP, T.endH, T.endP, T.go, T.save, T.next, T.back,
    'اسمه إيه؟', 'عنده كام سنة؟', 'لون البشرة', 'شكل الشعر', 'لون الشعر', 'حجاب', 'نضارة', 'قبعة', 'لونه المفضّل', 'اسمها إيه؟', 'عندها كام سنة؟', 'لونها المفضّل', 'نضارة وقبعة', 'موجود في عيلتنا', 'لقب الجدة', 'لقب الجد', 'بابا مسافر', 'عالم السفر لمدينة بابا', 'اسم المدرسة', 'نكمّل بالأسماء الافتراضية'];
  VOICE.forEach(t => { if (M.voice && M.voice.fixedStrings) M.voice.fixedStrings.push([t, 'narrator']); });
  const say = t => { try { M.voice.speak(t, { speaker: 'narrator', force: false }); } catch (e) { } };

  /* ------------------------------------------------------------------ styles */
  const css = `
  .fw{position:absolute;inset:0;pointer-events:auto;direction:rtl}
  .fw-stage{position:absolute;left:18px;top:96px;width:250px;bottom:88px;padding:8px;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;text-align:center}
  .fw-stage canvas{width:234px;height:300px;border-radius:26px;background:linear-gradient(#bfe8ff,#fff3c4);border:3px solid var(--line);box-shadow:var(--sh-2)}
  .fw-nm{font:900 26px var(--font);margin-top:6px;color:var(--ink);max-width:230px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .fw-form{position:absolute;left:286px;right:18px;top:96px;bottom:84px;padding:6px 16px;overflow-y:auto;overflow-x:hidden;text-align:right}
  .fw-full{left:18px}
  .fw-bar{position:absolute;left:18px;right:18px;bottom:14px;min-height:64px;display:flex;justify-content:space-between;align-items:center;gap:10px}
  .fw-bar .mid{display:flex;gap:8px;align-items:center}
  .fw-dot{width:14px;height:14px;border-radius:50%;background:rgba(255,255,255,.55);border:2px solid rgba(0,0,0,.25)}.fw-dot.on{background:#ff8a2a;border-color:#fff}
  .fw-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px 14px}.fw-cell{min-width:0}.fw-cell.span{grid-column:1/-1}.fw-ctl{display:flex;flex-wrap:wrap;align-items:center;gap:7px}
  .fw-cell .fw-lab{font-size:17px;min-width:0;margin:1px 0 1px}.fw-sw{width:max(40px,var(--tap));height:max(40px,var(--tap))}
  body.compact .fw-grid{grid-template-columns:1fr}
  .fw-row{display:flex;align-items:center;gap:10px;margin:5px 0;flex-wrap:wrap}
  .fw-lab{font:900 21px var(--font);min-width:104px;color:var(--ink)}
  .fw-sw{width:max(40px,var(--tap));height:max(40px,var(--tap));border-radius:50%;border:4px solid var(--line);background:var(--c);cursor:pointer;padding:0;box-shadow:0 3px 0 rgba(58,32,19,.25);pointer-events:auto}
  .fw-sw[aria-pressed=true]{outline:5px solid #ffc93c;outline-offset:1px;transform:scale(1.1)}
  .fw-sw.none{background:#fff;position:relative}.fw-sw.none:after{content:'';position:absolute;left:6px;right:6px;top:50%;height:4px;background:#e5534b;transform:rotate(-40deg);border-radius:3px}
  .fw-opt{min-height:max(46px,var(--tap));padding:2px 16px;font-size:21px}
  .fw-tabs{display:flex;gap:8px;flex-wrap:wrap;margin:2px 0 8px}
  .fw-tab{display:inline-flex;align-items:center;gap:6px;border:3px solid var(--line);border-radius:30px;padding:2px 12px 2px 4px;background:linear-gradient(#fff,#fff3d6);font:800 18px var(--font);min-height:max(52px,var(--tap));cursor:pointer;color:var(--ink);pointer-events:auto}
  .fw-tab[aria-pressed=true]{background:linear-gradient(#ffe98a,#ffc928);box-shadow:0 0 0 4px #ff8a2a}
  .fw-tab canvas{width:40px;height:40px;border-radius:50%;background:#eaf6ff}
  .fw-tab.off{opacity:.62}
  .fw-h{font:900 28px var(--font);margin:0;color:var(--ink)}.fw-p{font:800 18px/1.35 var(--font);opacity:.8;margin:0 0 4px}
  .fw-note{font:800 17px/1.4 var(--font);opacity:.7;margin:4px 0}
  .fw-kids{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:8px}
  .fw-kid{display:flex;flex-direction:column;align-items:center;gap:4px;border:4px solid var(--line);border-radius:22px;padding:6px 4px 8px;background:linear-gradient(#fff,#fff3d6);font:900 21px var(--font);cursor:pointer;color:var(--ink);min-height:200px;pointer-events:auto}
  .fw-kid canvas{width:120px;height:140px;border-radius:16px;background:linear-gradient(#bfe8ff,#fff3c4)}
  .fw-kid[aria-pressed=true]{background:linear-gradient(#f2fff3,#bff0c6);box-shadow:0 0 0 5px #3fae6a}
  .fw-kid .ck{min-height:30px}
  input.fw-in{width:min(300px,100%);font:900 24px var(--font);border:3px solid var(--line);border-radius:18px;padding:6px 12px;text-align:center;background:linear-gradient(#fff,#fff7e8);color:var(--ink);direction:rtl;pointer-events:auto;user-select:text;-webkit-user-select:text}
  .fw-age{display:flex;align-items:center;gap:8px}.fw-age b{font:900 32px var(--font);min-width:46px;text-align:center}
  .fw-hero{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:12px;text-align:center;padding:90px 60px 90px}
  .fw-hero .fw-h{font-size:44px}.fw-hero .fw-p{font-size:25px;max-width:700px}
  .fw-row2{display:flex;gap:14px;flex-wrap:wrap;justify-content:center}
  body.compact .fw-lab{min-width:84px;font-size:19px}`;
  let styled = false;
  const style = () => { if (styled) return; styled = true; document.head.append(h('style', null, css)); };

  /* ------------------------------------------------------------------ the wizard */
  const HAIR_LAB = { short: 'قصير', curly: 'مجعّد', ponytail: 'ذيل حصان', pigtails: 'ضفيرتين', bob: 'كاريه' };
  const GROUPS = { gm: ['nana', 'gf'], au: ['aunt1', 'aunt2', 'uncle1'], cz: ['cz1', 'cz2', 'cz3', 'cz4', 'cz5'] };
  const TAB_LAB = { nana: 'الجدة', gf: 'الجد', aunt1: 'العمة الأولى', aunt2: 'العمة التانية', uncle1: 'العم', cz1: 'ابن العمة', cz2: 'بنت العمة', cz3: 'ابن العم', cz4: 'ابن عمة كبير', cz5: 'شاب' };
  const KID_LAB = { moody: 'الولد الأكبر', aboody: 'الولد الأصغر', toota: 'البنت الكبيرة', nemo: 'البنت الصغيرة' };

  function run(o) {
    style(); o = o || {};
    const saved = JSON.parse(JSON.stringify(F.normalize(M.save.data.family))), draft = F.normalize(o.start || F.cfg()); let step = 0, tab = {}, raf = 0, apT = 0, pvId = 'moody', closed = false, pv = { draw: null };
    const showScr = el => { UI.show(el, 'clear', 1); if (pv.draw) UI.previews = [pv.draw]; };
    const touch = () => { clearTimeout(apT); apT = setTimeout(() => { try { F.apply(draft); } catch (e) { } }, 90); };
    const kidsOn = () => F.KIDS.filter(id => draft[id].on);
    const steps = () => { const s = [{ k: 'welcome' }]; if (o.mode === 'edit') s.shift(); s.push({ k: 'kids' }); kidsOn().forEach(id => s.push({ k: 'kid', id })); s.push({ k: 'grp', g: 'gm' }, { k: 'grp', g: 'au' }, { k: 'grp', g: 'cz' }, { k: 'dad' }, { k: 'end' }); return s; };
    const finish = go => {
      closed = true; if (go) { F.save(draft); } else { try { F.apply(saved); } catch (e) { } }
      cancelAnimationFrame(raf); UI.previews = [];
      if (o.mode === 'edit') { (go ? (o.back || o.ok) : (o.back || o.ok))(); } else if (o.next) o.next();
    };
    /* --- small widgets --- */
    const tapfn = fn => ev => { M.audio.sfx('tap'); fn(ev); };
    const btn = (label, cls, fn, icon, extra) => h('button', Object.assign({ class: 'btn ' + (cls || ''), onclick: tapfn(fn) }, extra || {}), icon ? I(icon, 30) : null, label);
    const toggle = (label, on, fn) => { const b = h('button', { class: 'btn fw-opt ' + (on ? 'green' : 'gray'), 'aria-pressed': on ? 'true' : 'false', onclick: tapfn(() => fn(!on)) }, on ? I('check', 26) : null, label); return b; };
    const sw = (col, on, fn, label, none) => h('button', { class: 'fw-sw' + (none ? ' none' : ''), style: '--c:' + (col || '#fff'), 'aria-label': label || 'لون', 'aria-pressed': on ? 'true' : 'false', onclick: tapfn(fn) });
    const lab = t => { const e = h('div', { class: 'fw-lab' }, t); return e; };
    const row = (t, ...kids) => { const r = h('div', { class: 'fw-row' }, lab(t), ...kids); M.voice.pressSpeak(r.firstChild, () => t, 'narrator'); return r; };
    const stepper = (get, set, min, max) => { const v = h('b', null, M.util.ar(get())); const up = d => () => { const n = Math.max(min, Math.min(max, get() + d)); set(n); v.textContent = M.util.ar(n); }; return h('div', { class: 'fw-age' }, btn('', 'round pink', up(1), 'plus', { 'aria-label': 'زيادة' }), v, btn('', 'round pink', up(-1), 'minus', { 'aria-label': 'نقصان' })); };

    /* --- preview canvas (the real character, idle animation) --- */
    function stagePanel(id) {
      const cv = h('canvas', { width: 468, height: 600 }), nm = h('div', { class: 'fw-nm' }), g = cv.getContext('2d'); pvId = id;
      const upd = () => { nm.textContent = F.fullName(id); };
      const draw = () => { try { const fit = Math.min(1.9, 250 / M.chars.height(id)); g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 234, 300); M.chars.draw(g, id, 117, 270, { anim: 'idle', t: M.time * .6, sc: fit, noShadow: false }); } catch (e) { } upd(); };
      pv.draw = draw; UI.previews = [draw];
      return h('div', { class: 'panel fw-stage' }, cv, nm);
    }
    function tabCanvas(id) { const c = h('canvas', { width: 80, height: 80 }), g = c.getContext('2d'); try { g.setTransform(.8, 0, 0, .8, 40, 40); g.lineJoin = g.lineCap = 'round'; M.chars.portrait(g, id, 0, 0, 46, { anim: 'idle', t: 1.3 }); } catch (e) { } return c; }

    /* --- the person form (name, [on], [age], look): a 2-column grid of labelled controls (1 column on phones) --- */
    function personForm(id, opt) {
      opt = opt || {}; const d = D0[id], o = draft[id], L = o.look, k = d.kind, box = h('div'), fm = d.g === 'f';
      const redraw = () => { touch(); if (opt.repaint) opt.repaint(); };
      const set = (key, val) => { if (val === undefined) delete L[key]; else L[key] = val; redraw(); refresh(); };
      const cell = (t, ctrls, span) => { const c = h('div', { class: 'fw-cell' + (span ? ' span' : '') }, h('div', { class: 'fw-lab' }, t), h('div', { class: 'fw-ctl' }, ...ctrls)); M.voice.pressSpeak(c.firstChild, () => t, 'narrator'); return c; };
      const hairOn = () => L.hair || d0hair(id);
      function refresh() {
        box.textContent = '';
        if (opt.toggle) box.append(h('div', { class: 'fw-row' }, toggle('موجود في عيلتنا', o.on, v => { o.on = v; redraw(); if (opt.repaint) opt.repaint(true); refresh(); })));
        if (opt.toggle && !o.on) box.append(h('div', { class: 'fw-note' }, 'لو سيبناه فاضي هنحط له شكل واسم افتراضي في الحكايات.'));
        const nameIn = h('input', { class: 'fw-in', maxlength: 12, value: o.name, placeholder: d.name || 'الاسم', autocomplete: 'off', 'aria-label': 'اسم ' + (TAB_LAB[id] || 'البطل') });
        nameIn.addEventListener('input', () => { o.name = F.clean(nameIn.value, 12); redraw(); });
        const cells = [cell(fm ? 'اسمها إيه؟' : 'اسمه إيه؟', [nameIn])];
        if (k === 'gm' || k === 'gf') { const titles = k === 'gm' ? F.GM_TITLES : F.GF_TITLES; cells.push(cell(k === 'gm' ? 'لقب الجدة' : 'لقب الجد', titles.map(t => h('button', { class: 'btn fw-opt ' + (o.title === t ? 'orange' : 'gray'), 'aria-pressed': o.title === t ? 'true' : 'false', onclick: tapfn(() => { o.title = t; redraw(); refresh(); }) }, t)))); }
        if (k === 'kid') cells.push(cell(fm ? 'عندها كام سنة؟' : 'عنده كام سنة؟', [stepper(() => o.age, v => { o.age = v; redraw(); }, 3, 14), h('div', { class: 'fw-note', style: 'margin:0' }, o.age <= 7 ? 'ألغاز أسهل' : 'ألغاز أصعب')]));
        const hijOn = F.canHijab(id) && (L.hij !== undefined ? !!L.hij : d0hijab(id));
        if (F.canHijab(id)) cells.push(cell('حجاب', [toggle(hijOn ? 'بحجاب' : 'من غير حجاب', hijOn, v => set('hij', v ? (typeof L.hij === 'string' ? L.hij : (d0hijabC(id) || F.HIJ[0])) : false))].concat(hijOn ? F.HIJ.map((c, i) => sw(c, (typeof L.hij === 'string' ? L.hij : d0hijabC(id)) === c, () => set('hij', c), 'لون حجاب ' + (i + 1))) : []), hijOn));
        cells.push(cell('لون البشرة', F.SKINS.map((c, i) => sw(c, (L.skin || d0skin(id)) === c, () => set('skin', c), 'لون بشرة ' + (i + 1)))));
        if ((k === 'kid' || k === 'cz' || k === 'uncle') && !hijOn) cells.push(cell('شكل الشعر', F.hairList(id).map(x => h('button', { class: 'btn fw-opt ' + (hairOn() === x[0] ? 'orange' : 'gray'), 'aria-pressed': hairOn() === x[0] ? 'true' : 'false', onclick: tapfn(() => set('hair', x[0])) }, x[1]))));
        if ((k === 'kid' || k === 'cz' || k === 'uncle') && !hijOn) cells.push(cell('لون الشعر', F.HAIRC.map((c, i) => sw(c, (L.hairC || d0hairC(id)) === c, () => set('hairC', c), 'لون شعر ' + (i + 1)))));
        const gOn = L.gl !== undefined ? L.gl : !!d0(id).glasses, ex = [toggle(gOn ? 'بنضارة' : 'من غير نضارة', gOn, v => set('gl', v))];
        if (k === 'kid') { const hOn = L.hat !== undefined ? !!L.hat : !!d0(id).sunhat; ex.push(toggle(hOn ? 'بقبعة' : 'من غير قبعة', hOn, v => set('hat', v ? (typeof L.hat === 'string' ? L.hat : F.HATC[0]) : false))); if (hOn) F.HATC.forEach((c, i) => ex.push(sw(c, (typeof L.hat === 'string' ? L.hat : d0(id).sunhat) === c, () => set('hat', c), 'لون قبعة ' + (i + 1)))); }
        cells.push(cell(k === 'kid' ? 'نضارة وقبعة' : 'نضارة', ex, k === 'kid' && (L.hat !== undefined ? !!L.hat : !!d0(id).sunhat)));
        if (k === 'kid' || k === 'aunt' || k === 'uncle' || k === 'cz') cells.push(cell(fm ? 'لونها المفضّل' : 'لونه المفضّل', F.FAV.map((c, i) => sw(c, L.fav === c, () => set('fav', L.fav === c ? undefined : c), 'لون هدوم ' + (i + 1))), true));
        box.append(h('div', { class: 'fw-grid' }, ...cells));
        if (k === 'cz') box.append(h('div', { class: 'fw-note' }, 'شكله وسنّه ثابتين في اللعبة، وتقدروا تغيّروا الاسم واللون.'));
      }
      refresh(); return box;
    }
    const d0 = id => F.base(id) || {}, d0skin = id => d0(id).skin, d0hair = id => d0(id).hair, d0hairC = id => d0(id).hairC;
    const d0hijab = id => d0(id).hair === 'scarf', d0hijabC = id => d0(id).scarf;

    /* --- the screens --- */
    function bar(s, i, n) {
      const dots = h('div', { class: 'mid' }); steps().forEach((x, j) => dots.append(h('div', { class: 'fw-dot' + (j === i ? ' on' : '') })));
      const last = s.k === 'end', first = i === 0;
      const next = btn(last ? (o.mode === 'edit' ? T.save : T.go) : T.next, 'green big', () => { if (s.k === 'kids' && !kidsOn().length) { M.audio.sfx('wrong'); return; } last ? finish(true) : go(1); }, last ? 'check' : 'arrow', { 'data-act': 'next', 'aria-label': last ? T.go : T.next });
      const back = first ? (o.mode === 'edit' ? btn(T.cancel, 'gray', () => finish(false), 'x', { 'data-act': 'cancel' }) : h('div')) : btn(T.back, 'yellow', () => go(-1), 'back', { 'data-act': 'back' });
      const hear = btn('', 'round teal', () => { const t = textOf(s); if (t) M.voice.speak(t, { speaker: 'narrator', force: true }); }, 'sound', { 'aria-label': T.hear, 'data-act': 'hear' });
      return h('div', { class: 'fw-bar' }, next, h('div', { class: 'row', style: 'gap:10px' }, hear, dots), back);
    }
    const textOf = s => ({ welcome: T.welcomeP, kids: T.kidsP, kid: T.kidP, grp: s.g === 'gm' ? T.gmP : s.g === 'au' ? T.auP : T.czP, dad: T.dadP, end: T.endP })[s.k];
    function go(d) { const n = steps().length; step = Math.max(0, Math.min(n - 1, step + d)); render(); }
    function head(t, p, big) { return [big ? h('div', { class: 'fw-h' }, t) : null, p ? h('div', { class: 'fw-p' }, p) : null]; }
    function render() {
      const list = steps(), s = list[Math.min(step, list.length - 1)], i = Math.min(step, list.length - 1); let body;
      UI.previews = []; pv.draw = null;
      if (s.k === 'welcome') {
        body = h('div', { class: 'fw-hero' }, ...head(T.welcomeH, T.welcomeP, true), h('div', { class: 'fw-note', style: 'font-size:21px;max-width:660px;opacity:.9' }, I('check', 26), ' ', T.privacy),
          h('div', { class: 'fw-row2' }, btn(T.start, 'green big shine', () => go(1), 'play', { 'data-act': 'start' }), btn(T.dflt, 'orange', () => { const c = F.defaults(); c.done = true; F.save(c); closed = true; UI.previews = []; if (o.next) o.next(); }, 'star', { 'data-act': 'default' })));
        UI.show(h('div', { class: 'fw' }, hdrEl(T.welcomeH), body), 'clear', 1); say(T.welcomeH + '. ' + T.welcomeP); return;
      }
      if (s.k === 'kids') {
        const cards = F.KIDS.map(id => { const on = draft[id].on, c = tabCanvasBig(id); const b = h('button', { class: 'fw-kid', 'data-kid': id, 'aria-pressed': on ? 'true' : 'false', 'aria-label': KID_LAB[id], onclick: tapfn(() => { draft[id].on = !draft[id].on; touch(); render(); }) }, c, h('div', null, KID_LAB[id]), h('div', { class: 'ck' }, on ? I('check', 30) : null)); return b; });
        body = h('div', { class: 'panel scroll fw-form fw-full' }, ...head(T.kidsH, T.kidsP), h('div', { class: 'fw-kids' }, ...cards), h('div', { class: 'fw-note', style: kidsOn().length ? '' : 'color:#c0392b;opacity:1' }, (kidsOn().length ? '' : 'اختاروا طفل واحد على الأقل.  ') + 'عدد الأطفال: ' + M.util.ar(kidsOn().length) + ' (من ١ لـ ٤). لو عندكم ٣ أولاد: اختاروا الخانتين الأولاد، والتالت هيبقى صاحب.'));
        UI.show(h('div', { class: 'fw' }, hdrEl(T.kidsH), body, bar(s, i)), 'clear', 1); say(T.kidsH + '. ' + T.kidsP); return;
      }
      if (s.k === 'kid') {
        body = [stagePanel(s.id), h('div', { class: 'panel scroll fw-form' }, ...head(T.kidH, T.kidP), personForm(s.id))];
        showScr(h('div', { class: 'fw' }, hdrEl(KID_LAB[s.id]), ...body, bar(s, i))); say(T.kidH + '. ' + T.kidP); return;
      }
      if (s.k === 'grp') {
        const ids = GROUPS[s.g]; if (!tab[s.g] || ids.indexOf(tab[s.g]) < 0) tab[s.g] = ids[0];
        const tabs = h('div', { class: 'fw-tabs' }), formBox = h('div'); let stage = h('div');
        const paintTabs = () => { tabs.textContent = ''; ids.forEach(id => tabs.append(h('button', { class: 'fw-tab' + (draft[id].on ? '' : ' off'), 'data-who': id, 'aria-pressed': tab[s.g] === id ? 'true' : 'false', onclick: tapfn(() => { tab[s.g] = id; mount(); }) }, tabCanvas(id), TAB_LAB[id]))); };
        const mount = () => { paintTabs(); stage.replaceWith(stage = h('div', { style: 'display:contents' }, stagePanel(tab[s.g]))); formBox.textContent = ''; formBox.append(personForm(tab[s.g], { toggle: true, repaint: () => { paintTabs(); } })); };
        const hd = s.g === 'gm' ? [T.gmH, T.gmP] : s.g === 'au' ? [T.auH, T.auP] : [T.czH, T.czP];
        const form = h('div', { class: 'panel scroll fw-form' }, ...head(hd[0], hd[1]), tabs, formBox);
        showScr(h('div', { class: 'fw' }, hdrEl(hd[0]), stage, form, bar(s, i))); mount(); say(hd[0] + '. ' + hd[1]); return;
      }
      if (s.k === 'dad') {
        const form = h('div', { class: 'panel scroll fw-form fw-full' }, ...head(T.dadH, T.dadP)), dv = h('div');
        const paint = () => {
          dv.textContent = ''; const dd = draft.dad;
          dv.append(row('بابا مسافر', toggle(dd.travels ? 'آه، مسافر' : 'لأ، معانا', dd.travels, v => { dd.travels = v; touch(); paint(); })));
          if (dd.travels) { dv.append(row('عالم السفر لمدينة بابا', ...F.DESTS.map(x => h('button', { class: 'btn fw-opt ' + (dd.dest === x.id ? 'orange' : 'gray'), 'data-dest': x.id, 'aria-pressed': dd.dest === x.id ? 'true' : 'false', onclick: tapfn(() => { dd.dest = x.id; touch(); paint(); }) }, x.id === 'generic' ? 'مدينة بابا' : x.city)))); dv.append(h('div', { class: 'fw-note' }, 'مناظر عالم السفر جبال وضباب وتلفريك، فالمدن اللي في القايمة كلها مدن جبلية.')); }
          else dv.append(h('div', { class: 'fw-note' }, 'من غير سفر: عالم السفر ومكالمات بابا هيتخبّوا.'));
          const sc = h('input', { class: 'fw-in', maxlength: 22, value: draft.school || '', placeholder: 'مدرسة الأمل الابتدائية', autocomplete: 'off', 'aria-label': 'اسم المدرسة' }); sc.addEventListener('input', () => { draft.school = F.clean(sc.value, 22); touch(); });
          dv.append(row('اسم المدرسة', sc));
        };
        paint(); form.append(dv);
        UI.show(h('div', { class: 'fw' }, hdrEl(T.dadH), form, bar(s, i)), 'clear', 1); say(T.dadH + '. ' + T.dadP); return;
      }
      if (s.k === 'end') {
        const names = F.KIDS.filter(id => draft[id].on).map(id => draft[id].name);
        const sum = h('div', { class: 'fw-hero' }, ...head(T.endH, T.endP, true), h('div', { class: 'fw-row2' }, ...F.KIDS.filter(id => draft[id].on).map(id => h('div', { class: 'fw-kid', style: 'min-height:0;cursor:default' }, tabCanvasBig(id), h('div', null, draft[id].name)))));
        UI.show(h('div', { class: 'fw' }, hdrEl(T.endH), sum, bar(s, i)), 'clear', 1); say(T.endH + '. ' + T.endP); return;
      }
    }
    function tabCanvasBig(id) { const c = h('canvas', { width: 240, height: 280 }), g = c.getContext('2d'); try { const fit = Math.min(1.5, 130 / M.chars.height(id)); g.setTransform(2, 0, 0, 2, 0, 0); M.chars.draw(g, id, 60, 132, { anim: 'idle', t: 1.2, sc: fit, snap: true, noShadow: true }); } catch (e) { } return c; }
    function hdrEl(t) { return h('div', { class: 'hdr' }, h('h2', null, t)); }
    M.backdrop.mode = 'map';
    render();
    return { close: () => finish(false) };
  }

  F.ui.run = run;
  /* first launch: wizard when no family has been saved yet */
  F.ui.boot = function (next) { if (F.done()) return next(); try { UI.hideSplash(); } catch (e) { } run({ mode: 'first', next }); };
  /* the parents' corner: edit the family any time (UI.names is patched to call this) */
  F.ui.edit = function (f) { f = f || {}; return run({ mode: 'edit', back: f.back, ok: f.ok }); };
})();
