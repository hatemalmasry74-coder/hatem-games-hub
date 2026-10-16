/* Moody & Aboody - engine/ui.js : HTML overlay UI (menus, HUD, dialog, quiz card, toasts, popups).
   Everything lives inside #ui (960x540 logical px, scaled). Arabic RTL. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, U = M.util, A = M.art;
  const root = document.getElementById('ui');
  const UI = M.ui = { previews: [], root };

  function h(tag, props) {
    const e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
    (function add(list) { list.forEach(c => { if (Array.isArray(c)) return add(c); if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); }); })(kids);
    return e;
  }
  UI.h = h;
  const ico = (n, px, o) => A.el(n, px || 36, o);
  UI.ico = ico;
  const tap = fn => ev => { M.audio.sfx('tap'); fn(ev); };
  UI.btn = (label, cls, fn, icon) => h('button', { class: 'btn ' + (cls || ''), onclick: tap(fn) }, icon ? ico(icon, 34) : null, label);
  const starRow = (n, px, max) => { const s = h('span', { class: 'stars' }); for (let i = 0; i < (max || 3); i++) s.append(ico('star', px || 28, { off: i >= n })); return s; };
  UI.starRow = starRow;
  const ar = U.ar;
  A.registerAll({
    phone(g) { G.fillRR(g, -26, -40, 52, 80, 12, '#fff', 5); G.fillRR(g, -20, -30, 40, 52, 4, '#6fd0ff', 2.5); G.circ(g, 0, 31, 5, '#ccc', 1.5); G.circ(g, 0, -6, 11, '#ffd2a8', 2.5); G.fillRR(g, -13, 2, 26, 14, 7, '#2f6fe0', 2.5); },
    narr(g, o) { G.fillRR(g, -40, -36, 80, 58, 18, '#fff', 5); G.poly(g, [[-16, 18], [-26, 40], [6, 20]], '#fff', 5); G.fillRR(g, -34, -30, 68, 46, 14, '#fff', 0); [-18, -6, 6, 18].forEach((x, i) => { const hh = [10, 22, 16, 26][i]; G.fillRR(g, x - 4, -7 - hh / 2, 8, hh, 4, '#4a8dff', 0); }); if (o.off) { G.line(g, -34, -34, 34, 22, 8, '#ef5350'); } },
    whatnow(g) { G.poly(g, [[-38, -14], [-22, -14], [-4, -30], [-4, 30], [-22, 14], [-38, 14]], '#fff', 4.5); g.lineWidth = 5; g.strokeStyle = '#fff'; g.beginPath(); g.arc(-2, 0, 18, -.9, .9); g.stroke(); G.text(g, '؟', 28, 3, { size: 52, color: '#fff', stroke: M.OL, sw: 7 }); }
  });

  const scr = h('div', { id: 'scr' }), hudEl = h('div', { id: 'hud', style: 'display:none' }), over = h('div', { id: 'over', style: 'position:absolute;inset:0;pointer-events:none' });
  root.append(scr, hudEl, over); UI.scr = scr; UI.over = over;
  scr.style.cssText = 'position:absolute;inset:0;pointer-events:none';

  UI.show = function (el, cls) { UI.previews = []; scr.textContent = ''; if (el) { el.classList.add('screen'); if (cls) el.classList.add(cls); scr.append(el); } };
  UI.clearScreen = () => UI.show(null);

  /* ---------- toasts / modals / popups ---------- */
  UI.toast = function (text, ms) { const t = h('div', { class: 'toast' }, M.fmt(text)); over.append(t); M.voice.speak(text, { speaker: 'narrator', soft: true }); setTimeout(() => t.remove(), ms || 2200); return t; };
  UI.modal = function (content) { const m = h('div', { class: 'modal' }, h('div', { class: 'panel' }, content)); over.append(m); return { el: m, close: () => m.remove() }; };
  UI.confirm = function (msg, okLabel, cancelLabel) {
    return new Promise(res => {
      const mo = UI.modal([h('p', null, msg), h('div', { class: 'row' }, UI.btn(okLabel || 'تمام', 'green', () => { mo.close(); res(true); }), UI.btn(cancelLabel || 'لأ', 'gray', () => { mo.close(); res(false); }))]);
    });
  };
  UI.starPop = function (n) {
    const wrap = h('div', { style: 'position:absolute;left:0;right:0;top:140px;display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:35' });
    const st = h('div', { style: 'animation:starin .6s ease-out' }, ico('star', 170)); const lab = h('div', { class: 'title', style: 'font-size:54px;margin-top:-10px;animation:popin .5s' }, n > 1 ? '+' + ar(n) + ' نجوم!' : 'نجمة!');
    wrap.append(st, lab); over.append(wrap); M.audio.sfx('star'); setTimeout(() => { wrap.style.transition = 'all .5s'; wrap.style.opacity = '0'; wrap.style.transform = 'translateY(-60px) scale(.5)'; }, 900); setTimeout(() => wrap.remove(), 1500);
  };

  /* ---------- HUD (inside missions) ---------- */
  let hud = null;
  UI.hud = {
    show(stage, opts) {
      opts = opts || {}; hudEl.textContent = ''; hudEl.style.display = 'block';
      const sw = h('div', { id: 'sw' });
      const coin = h('div', { class: 'chip' }, ico('coin', 28), h('span', { id: 'coinv' }, ar(M.save.data.coins)));
      const star = h('div', { class: 'chip' }, ico('star', 28), h('span', { id: 'starv' }, ar(0)));
      const pause = h('button', { class: 'btn round blue', 'aria-label': 'إيقاف مؤقت', onclick: tap(() => hud.onPause && hud.onPause()) }, ico('pause', 40));
      const hr = h('div', { id: 'hr' }, pause, star, coin);
      const prompt = h('div', { id: 'prompt' });
      const what = h('button', { id: 'what', class: 'btn round green', 'aria-label': 'ماذا نفعل؟', onclick: tap(() => M.voice.replay()) }, ico('whatnow', 46));
      hudEl.append(sw, hr, prompt, what); hud = { sw, prompt, hr, what, stage, btns: {}, onPause: opts.onPause };
      hud.sync = () => { for (const k in hud.btns) hud.btns[k].classList.toggle('on', stage.active === k); };
      hud.build = () => {   // 2 heroes: big avatars + swap icon; 3-4 heroes: compact row
        sw.textContent = ''; hud.btns = {}; const ids = stage.control, many = ids.length > 2; sw.className = many ? 'many' : '';
        ids.forEach((id, i) => {
          const face = M.chars.defs[id].img ? h('img', { src: M.chars.avatar(id) + '?v=1', alt: '' }) : ico('face:' + id, 76);
          const b = h('button', { class: 'h', 'data-hero': id, 'aria-label': M.chars.defs[id].name, onclick: () => { stage.setActive(id); } }, face);
          hud.btns[id] = b; sw.append(b); if (!many && i === 0 && ids.length === 2) sw.append(h('div', { class: 'sw' }, ico('swap', 38)));
        });
        prompt.style.left = (many ? 14 + ids.length * 64 + 14 : 246) + 'px'; hud.sync();
      };
      hud.build(); stage.onSwitch = hud.sync;
    },
    rebuild() { if (hud) hud.build(); },
    hide() { hudEl.style.display = 'none'; hudEl.textContent = ''; hud = null; UI.skip.hide(); },
    setPrompt(t) {
      if (!hud) return; hud.prompt.textContent = '';
      if (t) { hud.prompt.append(h('div', { class: 'p', onclick: () => M.voice.replay() }, ico('sound', 30), h('span', null, M.fmt(t)))); M.voice.setInstruction(t); } else M.voice.clearInstruction();
    },
    update(stars) { const s = document.getElementById('starv'), c = document.getElementById('coinv'); if (s) s.textContent = ar(stars || 0); if (c) c.textContent = ar(M.save.data.coins); },
    pulseSwitch(on) { if (hud) hud.sw.classList.toggle('pulse', !!on); },
    showSwitch(v) { if (hud) hud.sw.style.display = v ? 'flex' : 'none'; }
  };
  let skipEl = null;
  UI.skip = {
    show(fn, label) { UI.skip.hide(); skipEl = h('button', { id: 'skip', class: 'btn sm gray', onclick: tap(() => { UI.skip.hide(); fn(); }) }, label || 'تخطّي'); hudEl.append(skipEl); },
    hide() { if (skipEl) { skipEl.remove(); skipEl = null; } },
    on() { return !!skipEl; }
  };

  /* ---------- dialog (story speech) ---------- */
  UI.say = function (o) {
    return new Promise(res => {
      const text = M.fmt(o.text), who = o.who;
      let face;
      const defs = M.chars.defs;
      if (defs[who] && defs[who].img) face = h('img', { src: M.chars.avatar(who) + '?v=1', alt: '' });
      else if (defs[who] && !o.icon) face = ico('face:' + who, 90);
      else face = ico(o.icon || (who === 'narrator' || !who ? 'narrator' : who), 90);
      const name = who === 'moody' ? M.save.data.names.moody : who === 'aboody' ? M.save.data.names.aboody : (o.name || (defs[who] ? (M.save.data.names[who] || defs[who].name) : '') || { mama: 'ماما', friend: 'ماجد' }[who] || '');
      const nx = h('div', { class: 'nx' }, ico('arrow', 38, {}));
      nx.style.display = 'none';
      const tx = h('div', { class: 'tx' }), el = h('div', { id: 'dlg', class: 'panel' }, h('div', { class: 'face' }, face), h('div', { style: 'flex:1;display:flex;flex-direction:column;gap:2px' }, name ? h('div', { class: 'nm' }, name) : null, tx), h('button', { class: 'btn round green rp', 'aria-label': 'اسمع تاني', onclick: e => { e.stopPropagation(); M.voice.speak(o.text, { speaker: who || 'narrator', force: true }); } }, ico('sound', 34)), nx);
      over.append(el); M.voice.speak(o.text, { speaker: who || 'narrator' });
      let i = 0, typing = true, closed = false;
      const iv = setInterval(() => { i += 1; tx.textContent = text.slice(0, i); if (i >= text.length) fin(); }, 24);
      function fin() { clearInterval(iv); typing = false; tx.textContent = text; nx.style.display = 'block'; if (o.onTalk) o.onTalk(false); }
      function close() { if (closed) return; closed = true; clearInterval(iv); el.remove(); M.keys.splice(M.keys.indexOf(kh), 1); if (o.onTalk) o.onTalk(false); }
      function adv() { if (closed) return; if (typing) { fin(); return; } M.audio.sfx('click'); close(); res(); }
      const kh = e => { if (e.key === ' ' || e.key === 'Enter') { adv(); return true; } return false; };
      M.keys.push(kh); el.addEventListener('click', adv); if (o.onTalk) o.onTalk(true);
      if (o.register) o.register(close);
      if (o.auto) setTimeout(adv, o.auto), setTimeout(adv, o.auto + 20);
    });
  };

  /* ---------- quiz card ---------- */
  const CLOSE = ['قريب! جرّب تاني', 'شبه الإجابة! جرّب مرة كمان', 'محاولة حلوة! كمّل'];
  UI.quiz = function (q, o) {
    o = o || {}; let misses = 0, done = false, closed = false;
    const order = q.fixed ? q.choices.map((c, i) => i) : U.shuffle(q.choices.map((c, i) => i));
    const n = order.length, cols = n === 2 ? 2 : (n === 3 ? 3 : 2);
    const hint = h('div', { class: 'hint' });
    const vis = h('div', { class: 'vis' });
    if (q.row) q.row.forEach(a => vis.append(a === '?' ? h('div', { class: 'q' }, '؟') : ico(a, 66)));
    if (q.count) for (let i = 0; i < q.count.n; i++) vis.append(ico(q.count.art, q.count.n > 12 ? 40 : 56));
    if (q.art) vis.append(ico(q.art, 92));
    if (q.emoji) vis.append(h('div', { style: 'font-size:64px;line-height:1;direction:ltr' }, q.emoji));
    const ch = h('div', { class: 'ch', style: 'grid-template-columns:repeat(' + cols + ',1fr)' });
    const compact = !!(q.row || q.count || q.art || q.emoji);
    const btns = order.map(idx => {
      const c = q.choices[idx], txt = typeof c === 'string' || typeof c === 'number' ? String(c) : c.text, art = c && c.art;
      const b = h('button', { class: 'opt', 'data-correct': idx === q.answer ? '1' : '0', 'data-i': idx, style: compact ? 'min-height:72px' : '' }, art ? ico(art, 56) : null, txt ? M.fmt(txt) : null, txt ? h('span', { class: 'spk', role: 'button', 'aria-label': 'اسمع', onclick: e => { e.stopPropagation(); M.voice.speak(txt, { speaker: 'narrator', force: true }); } }, ico('sound', 30)) : null);
      if (txt) { M.voice.note(txt, 'narrator'); M.voice.pressSpeak(b, () => txt, 'narrator'); }
      b.addEventListener('click', () => pick(idx, b)); return b;
    });
    btns.forEach(b => ch.append(b));
    const who = o.who ? h('div', { style: 'position:absolute;right:14px;top:8px;display:flex;align-items:center;gap:8px;background:#fff;border:4px solid var(--line);border-radius:30px;padding:3px 14px 3px 4px;font-size:24px;font-weight:bold' }, h('img', { class: 'av', src: M.chars.avatar(o.who) + '?v=1', style: 'width:52px;height:52px;border-width:3px;box-shadow:none' }), 'دور ' + M.save.data.names[o.who]) : null;
    const choiceTexts = order.map(i => { const c = q.choices[i]; return typeof c === 'string' || typeof c === 'number' ? String(c) : c.text; }).filter(Boolean);
    const rpl = h('button', { class: 'btn round green', style: 'position:absolute;left:14px;top:8px;min-width:56px;width:56px;min-height:56px', 'aria-label': 'اسمع السؤال', onclick: tap(() => M.voice.speak(q.q, { speaker: 'narrator', force: true })) }, ico('sound', 34));
    const lst = h('button', { class: 'btn sm teal', style: 'position:absolute;left:82px;top:10px;min-height:52px;font-size:20px;padding:2px 14px', onclick: tap(() => M.voice.speakSeq(choiceTexts, { speaker: 'narrator', force: true })) }, ico('sound', 26), 'اسمع الاختيارات');
    const el = h('div', { id: 'qz', class: 'panel', style: 'padding-top:66px;' }, who, rpl, lst, h('div', { class: 'qt', style: q.q.length > 60 ? 'font-size:28px' : '' }, M.fmt(q.q)), vis, ch, hint);
    over.append(el); M.voice.speak(q.q, { speaker: 'narrator' }); if (q.hint) M.voice.note(q.hint, 'narrator'); if (q.explain) M.voice.note(q.explain, 'narrator');
    function pick(idx, b) {
      if (done) return;
      if (idx === q.answer) {
        done = true; b.classList.add('right'); M.audio.sfx('good'); btns.forEach(x => { if (x !== b) x.classList.add('gone'); });
        hint.textContent = q.explain ? M.fmt(q.explain) : ''; hint.style.color = '#1d7f33'; if (q.explain) M.voice.speak(q.explain, { speaker: 'narrator' });
        setTimeout(() => { if (!closed) { close(); o.onDone && o.onDone({ correct: true, tries: misses + 1, misses, revealed: misses >= 3 }); } }, q.explain ? 1700 : 650);
      } else {
        misses++; M.audio.sfx('wrong'); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); b.classList.add('gone'); b.style.pointerEvents = 'none';
        o.onMiss && o.onMiss(misses);
        if (misses === 1) { const c = U.pick(CLOSE); hint.textContent = c; M.voice.speak(c, { speaker: 'narrator' }); }
        else if (misses === 2) { hint.textContent = 'تلميح: ' + M.fmt(q.hint || 'فكّر تاني بهدوء'); M.voice.speak(q.hint || 'فكّر تاني بهدوء', { speaker: 'narrator' }); }
        else { hint.textContent = 'تعالوا نشوفها سوا!'; M.voice.speak('تعالوا نشوفها سوا!', { speaker: 'narrator' }); btns.forEach(x => { if (x.dataset.correct === '1') x.style.animation = 'pulse .8s infinite'; }); }
        const left = btns.filter(x => x.dataset.correct !== '1' && !x.classList.contains('gone'));
        if (misses === 2 && left.length > 1) { const r = U.pick(left); r.classList.add('gone'); }
        hint.style.color = '#c25a00';
      }
    }
    function close() { closed = true; el.remove(); }
    return { el, close, buttons: btns };
  };

  /* choice cards (moral decisions) */
  UI.choiceCards = function (prompt, opts, onPick) {
    const row = h('div', { class: 'row', style: 'gap:18px;align-items:stretch' });
    const cards = opts.map((o, i) => { const c = h('button', { class: 'choicecard', 'data-i': i, 'data-good': o.good ? '1' : '0', onclick: () => { M.audio.sfx('tap'); onPick(i, c); } }, o.art ? ico(o.art, 110) : null, M.fmt(o.text), h('span', { class: 'spk', role: 'button', 'aria-label': 'اسمع', onclick: e => { e.stopPropagation(); M.voice.speak(o.text, { speaker: 'narrator', force: true }); } }, ico('sound', 30))); M.voice.note(o.text, 'narrator'); M.voice.pressSpeak(c, () => o.text, 'narrator'); row.append(c); return c; });
    const el = h('div', { class: 'panel', style: 'position:absolute;left:50px;right:50px;top:80px;padding:66px 18px 14px;text-align:center;animation:popin .3s;z-index:4' }, h('div', { style: 'font-size:32px;font-weight:bold;margin-bottom:10px' }, M.fmt(prompt)), row);
    const rpl = h('button', { class: 'btn round green', style: 'position:absolute;left:12px;top:10px;min-width:56px;width:56px;min-height:56px', 'aria-label': 'اسمع', onclick: tap(() => M.voice.speak(prompt, { speaker: 'narrator', force: true })) }, ico('sound', 34));
    const lst = h('button', { class: 'btn sm teal', style: 'position:absolute;left:78px;top:12px;min-height:52px;font-size:20px;padding:2px 14px', onclick: tap(() => M.voice.speakSeq(opts.map(o => o.text), { speaker: 'narrator', force: true })) }, ico('sound', 26), 'اسمع الاختيارات');
    el.append(rpl, lst); over.append(el); M.voice.speak(prompt, { speaker: 'narrator' }); return { el, cards, close: () => el.remove() };
  };

  /* ---------- screens ---------- */
  function hdr(title, back, extra) { return h('div', { class: 'hdr' }, h('h2', null, title), back ? h('button', { class: 'btn round yellow', 'aria-label': 'رجوع', onclick: tap(back) }, h('span', { style: 'display:flex;transform:scaleX(-1)' }, ico('arrow', 40))) : null, extra ? h('div', { class: 'side' }, extra) : null); }
  const coinChip = () => h('div', { class: 'chip' }, ico('coin', 32), ar(M.save.data.coins));
  const soundBtn = () => { const b = h('button', { class: 'btn round teal', 'aria-label': 'الصوت' }); const set = () => { b.textContent = ''; b.append(ico('sound', 40, { off: !M.audio.on() })); }; b.onclick = () => { M.save.data.settings.sound = !M.audio.on(); M.save.commit(); set(); M.audio.sfx('tap'); }; set(); return b; };
  UI.soundBtn = soundBtn;
  UI.narrBtn = () => { const b = h('button', { class: 'btn round pink', 'aria-label': 'صوت التعليمات' }); const set = () => { b.textContent = ''; b.append(ico('narr', 44, { off: M.save.data.settings.narr === false })); b.style.opacity = M.save.data.settings.narr === false ? .55 : 1; }; b.onclick = () => { M.voice.setEnabled(M.save.data.settings.narr === false); set(); M.audio.sfx('tap'); if (M.save.data.settings.narr !== false) M.voice.speak('صوت التعليمات شغّال', { speaker: 'narrator' }); }; set(); return b; };
  const hubLink = () => h('a', { class: 'btn sm green', href: '../' }, ico('home', 34), 'الصفحة الرئيسية للألعاب');

  UI.title = function (f) {
    const av = (id, side) => h('div', { style: 'position:absolute;top:46px;' + side + ':44px;text-align:center' }, h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:178px;height:178px', alt: M.chars.defs[id].name }), h('div', { class: 'chip', style: 'margin-top:14px;font-size:28px' }, M.save.data.names[id]));
    const el = h('div', null, av('moody', 'right'), av('aboody', 'left'),
      h('div', { style: 'position:absolute;left:210px;right:210px;top:44px;text-align:center' }, h('div', { class: 'title', style: 'font-size:78px;white-space:nowrap' }, 'مودي وعبودي'), h('div', { class: 'chip', style: 'margin-top:20px;background:#ff6f91;color:#fff;font-size:34px;border-radius:34px;padding:2px 26px;text-shadow:0 2px 0 rgba(0,0,0,.25)' }, 'يوميات ومغامرات')),
      h('div', { style: 'position:absolute;left:0;right:0;top:250px;text-align:center' }, h('button', { class: 'btn big green', onclick: tap(f.start) }, ico('play', 56), 'ابدأ')),
      h('div', { class: 'row', style: 'position:absolute;left:0;right:0;bottom:70px' }, soundBtn(), UI.narrBtn(), h('button', { class: 'btn round purple', 'aria-label': 'ركن الأهل', onclick: tap(f.parent) }, ico('parent', 42)), hubLink()),
      h('div', { style: 'position:absolute;left:0;right:0;bottom:14px;text-align:center;font-size:22px;font-weight:bold;color:#fff;text-shadow:0 2px 0 var(--line)' }, 'الإصدار ١'));
    UI.show(el, 'clear'); M.backdrop.mode = 'title';
  };

  UI.names = function (f) {
    const d = M.save.data.names;
    const i1 = h('input', { class: 'txt', maxlength: 12, value: d.moody, placeholder: 'مودي', autocomplete: 'off' }), i2 = h('input', { class: 'txt', maxlength: 12, value: d.aboody, placeholder: 'عبودي', autocomplete: 'off' }), i3 = h('input', { class: 'txt', maxlength: 14, value: d.me || '', placeholder: 'اسمك (لو تحب)', autocomplete: 'off' });
    const row = (id, inp) => h('div', { class: 'row', style: 'margin:6px 0;justify-content:flex-start' }, id ? h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:68px;height:68px;border-width:4px' }) : h('div', { style: 'width:68px;height:68px;display:flex;align-items:center;justify-content:center' }, ico('star', 52)), inp);
    const el = h('div', null, hdr('أهلًا بيكم!', f.back), h('div', { class: 'panel', style: 'position:absolute;left:150px;right:150px;top:92px;padding:10px 20px 14px;text-align:center' },
      h('div', { style: 'font-size:28px;font-weight:bold;margin-bottom:4px' }, 'تحبوا نغيّر الأسماء؟ (اختياري)'), row('moody', i1), row('aboody', i2), row(null, i3),
      h('div', { class: 'row', style: 'margin-top:10px' }, UI.btn('يلا بينا', 'green', () => { const c = (v, dft) => (v || '').trim().slice(0, 14) || dft; d.moody = c(i1.value, 'مودي'); d.aboody = c(i2.value, 'عبودي'); d.me = c(i3.value, ''); M.save.data.named = true; M.save.commit(); f.ok(); }))));
    UI.show(el); M.backdrop.mode = 'map';
  };

  UI.worldMap = function (f) {
    const cards = h('div', { class: 'cards scroll x', id: 'wcards' });
    M.worlds.filter(w => !w.hidden).forEach(w => {
      const soon = !!w.soon, tot = w.missions.length * 3, got = M.save.mapStars(w), th = w.theme;
      const top = h('div', { class: 'top', style: 'background:linear-gradient(' + th.c1 + ',' + th.c2 + ')' }, soon ? ico('lock', 90) : ico(w.icon || 'home', 130));
      const c = h('button', { class: 'card' + (soon ? ' soon' : ''), 'data-world': w.id, onclick: () => { if (soon) { M.audio.sfx('wrong'); UI.toast('قريبًا! لسه بنجهّزه'); } else { M.audio.sfx('tap'); f.world(w.id); } } },
        top, h('h3', null, w.title), soon ? h('div', { class: 'sub' }, 'قريبًا') : h('div', { class: 'sub', style: 'display:flex;align-items:center;gap:6px' }, ico('star', 30), ar(got) + ' من ' + ar(tot)),
        soon ? null : h('div', { style: 'position:absolute;bottom:12px;font-size:22px;font-weight:bold;opacity:.7' }, ar(M.save.done(w)) + ' من ' + ar(w.missions.length) + ' مهام'));
      cards.append(c);
    });
    const sc = d => () => { M.audio.sfx('tap'); cards.scrollBy({ left: d * 280, behavior: 'smooth' }); };
    const tile = (label, icon, col, fn, dot) => h('button', { class: 'tile', style: 'background:' + col, onclick: tap(fn) }, ico(icon, 40), label, dot ? h('div', { class: 'ndot' }) : null);
    const el = h('div', null, hdr('خريطة المغامرات', f.back, [soundBtn(), coinChip()]), cards,
      h('button', { class: 'btn round yellow', style: 'position:absolute;right:6px;top:230px;z-index:2;opacity:.9', onclick: sc(1), 'aria-label': 'يمين' }, h('span', { style: 'display:flex;transform:scaleX(-1)' }, ico('arrow', 38))),
      h('button', { class: 'btn round yellow', style: 'position:absolute;left:6px;top:230px;z-index:2;opacity:.9', onclick: sc(-1), 'aria-label': 'شمال' }, ico('arrow', 38)),
      h('div', { class: 'bar' }, tile('بابا بيتصل', 'phone', '#2fb86a', f.call, M.callPending && M.callPending()), tile('ألبوم الملصقات', 'album', '#ff8a2a', f.album), tile('يومياتي', 'diary', '#1fb5a6', f.diary), tile('تغيير الشكل', 'hanger', '#8a6bd6', f.closet), tile('ركن الأهل', 'parent', '#ff6f91', f.parent)));
    UI.show(el, 'clear'); M.backdrop.mode = 'map';
    const first = cards.firstChild; if (first) cards.scrollLeft = 0;
  };

  UI.missionList = function (w, f) {
    const grid = h('div', { class: 'grid scroll', style: 'position:absolute;left:26px;right:26px;top:96px;bottom:14px;grid-template-columns:repeat(3,1fr);align-content:start;padding:6px 4px 14px' });
    w.missions.forEach((m, i) => {
      const open = M.save.unlocked(w, i), p = M.save.prog(w.id, m.id) || {};
      const c = h('button', { class: 'mcard' + (open ? '' : ' locked'), 'data-mission': m.id, onclick: () => { if (open) { M.audio.sfx('tap'); f.start(i); } else { M.audio.sfx('wrong'); UI.toast('خلّصوا المهمة اللي قبلها الأول'); } } },
        h('div', { class: 'num' }, ar(i + 1)), open ? ico(m.icon || (m.diary && m.diary.pic) || 'star', 52) : null, h('h4', null, m.title), open ? starRow(p.stars || 0, 30) : ico('lock', 44));
      M.voice.pressSpeak(c, () => m.title, 'narrator');
      grid.append(c);
    });
    const el = h('div', null, hdr(w.title, f.back, [coinChip()]), grid); UI.show(el, 'clear'); M.backdrop.mode = 'map';
  };

  UI.result = function (r, f) {
    const sts = h('div', { class: 'stars', style: 'gap:10px' });
    for (let i = 0; i < 3; i++) { const s = ico('star', 96, { off: i >= r.stars }); s.style.animation = 'starin .6s ease-out ' + (.4 + i * .35) + 's both'; sts.append(s); if (i < r.stars) setTimeout(() => M.audio.sfx('star'), 450 + i * 350); }
    const left = h('div', { style: 'position:absolute;left:30px;bottom:30px' }, h('img', { class: 'av', src: M.chars.avatar('aboody') + '?v=1', style: 'width:120px;height:120px' }));
    const right = h('div', { style: 'position:absolute;right:30px;bottom:30px' }, h('img', { class: 'av', src: M.chars.avatar('moody') + '?v=1', style: 'width:120px;height:120px' }));
    const mid = h('div', { class: 'panel', style: 'position:absolute;left:170px;right:170px;top:16px;bottom:16px;padding:10px 16px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:space-between' },
      h('div', { class: 'title', style: 'font-size:48px' }, r.stars >= 3 ? 'برافو! ممتاز!' : r.stars === 2 ? 'شاطرين أوي!' : 'أحسنتم!'), sts,
      h('div', { class: 'row', style: 'gap:12px' }, h('div', { class: 'chip', style: 'animation:popin .5s 1.4s both' }, ico('coin', 34), '+' + ar(r.coins)), r.sticker ? h('div', { class: 'chip', style: 'animation:popin .5s 1.6s both;padding:2px 14px 2px 10px' }, A.sticker(r.sticker, 56), 'ملصق جديد: ' + (M.stickers[r.sticker] || {}).title) : null),
      h('div', { style: 'background:#fff3c4;border:4px dashed #e0b23c;border-radius:22px;padding:6px 16px;font-size:26px;font-weight:bold;line-height:1.35;width:100%;animation:popin .5s 1.2s both' }, h('div', { style: 'font-size:20px;color:#c25a00;display:flex;gap:8px;align-items:center;justify-content:center' }, 'حكمة اليوم', h('span', { role: 'button', style: 'cursor:pointer;display:inline-flex', onclick: () => M.voice.speak(r.wisdom || 'اللي يعمل خير يلاقي خير', { speaker: 'narrator', force: true }) }, ico('sound', 34))), M.fmt(r.wisdom || 'اللي يعمل خير يلاقي خير')),
      h('div', { style: 'font-size:20px;font-weight:bold;opacity:.7' }, r.diary ? 'اتكتبت في يومياتي' : ''),
      h('div', { class: 'row' }, r.hasNext ? UI.btn('المهمة الجاية', 'green', f.next, 'play') : UI.btn('كمّل', 'green', f.next, 'play'), UI.btn('نعيدها', 'yellow', f.retry), UI.btn('القائمة', 'blue', f.menu)));
    UI.show(h('div', null, left, right, mid), 'clear'); M.backdrop.mode = 'result'; M.backdrop.confetti();
    { const hd = r.stars >= 3 ? 'برافو! ممتاز!' : r.stars === 2 ? 'شاطرين أوي!' : 'أحسنتم!'; setTimeout(() => M.voice.speakSeq([hd, 'حكمة اليوم', r.wisdom || 'اللي يعمل خير يلاقي خير'], { speaker: 'narrator' }), 700); }
  };

  UI.celebrate = function (w, f) {
    const el = h('div', null, h('div', { class: 'panel', style: 'position:absolute;left:150px;right:150px;top:30px;bottom:30px;padding:14px;text-align:center;display:flex;flex-direction:column;align-items:center;justify-content:space-around' },
      h('div', { class: 'title', style: 'font-size:60px' }, 'مبروك!'), h('div', { style: 'font-size:36px;font-weight:bold' }, 'خلّصتوا كل مهام ' + w.title), (w.finalSticker ? A.sticker(w.finalSticker, 150) : null),
      h('div', { style: 'font-size:28px;font-weight:bold;color:#c25a00' }, 'بقيتوا أبطال ' + w.title + '!'), h('div', { class: 'row' }, UI.btn('خريطة المغامرات', 'green', f.map, 'play'), UI.btn('نعيد مهمة', 'yellow', f.menu))));
    UI.show(el, 'clear'); M.backdrop.mode = 'result'; M.backdrop.confetti(); M.audio.sfx('fanfare'); M.audio.cheer('big');
    let n = 0; const iv = setInterval(() => { if (++n > 6) clearInterval(iv); M.backdrop.confetti(); }, 900);
  };

  UI.album = function (f) {
    const ids = Object.keys(M.stickers), have = M.save.data.stickers, cnt = ids.filter(i => have[i]).length;
    const grid = h('div', { class: 'grid scroll', style: 'position:absolute;left:30px;right:30px;top:96px;bottom:16px;grid-template-columns:repeat(5,1fr);align-content:start;padding:10px 4px 14px;gap:14px' });
    ids.forEach(id => { const s = M.stickers[id], ok = !!have[id]; grid.append(h('button', { class: 'mcard', style: 'height:170px;padding:6px', onclick: () => { M.audio.sfx('pop'); UI.toast(ok ? s.title : 'ملصق مخفي! كمّل المهام'); } }, A.sticker(id, 104, !ok), h('div', { style: 'font-size:20px;font-weight:bold;margin-top:4px' }, ok ? s.title : '؟'))); });
    UI.show(h('div', null, hdr('ألبوم الملصقات: ' + ar(cnt) + ' من ' + ar(ids.length), f.back), grid), 'clear'); M.backdrop.mode = 'map';
  };

  UI.diary = function (f) {
    const list = M.save.data.diary.slice().reverse();
    const grid = h('div', { class: 'grid scroll', style: 'position:absolute;left:30px;right:30px;top:96px;bottom:16px;grid-template-columns:repeat(3,1fr);align-content:start;padding:10px 4px 14px;gap:20px' });
    if (!list.length) grid.append(h('div', { class: 'panel', style: 'grid-column:1/4;padding:30px;font-size:30px;font-weight:bold;text-align:center' }, 'يومياتي لسه فاضية. خلّصوا مهمة وهتتملي بالصور!'));
    list.forEach((e, i) => { const p = h('div', { style: 'background:#fff;border:4px solid var(--line);border-radius:10px;padding:10px 10px 12px;box-shadow:0 8px 0 rgba(0,0,0,.2);transform:rotate(' + ((i % 3) - 1) * 1.6 + 'deg);text-align:center;pointer-events:auto' }, h('div', { style: 'background:#fff3c4;border-radius:6px;height:130px;display:flex;align-items:center;justify-content:center' }, ico(e.pic || 'star', 110)), h('div', { style: 'font-size:23px;font-weight:bold;margin-top:8px;line-height:1.25;min-height:58px' }, M.fmt(e.text)), h('div', { style: 'font-size:17px;opacity:.6;font-weight:bold' }, e.date || '')); grid.append(p); });
    UI.show(h('div', null, hdr('يومياتي', f.back), grid), 'clear'); M.backdrop.mode = 'map';
  };

  UI.closet = function (f) {
    let who = M.save.data.hero || 'moody', tab = 'hat';
    const sd = M.save.data, left = h('div', { style: 'position:absolute;left:30px;top:100px;width:290px;bottom:20px;pointer-events:none' }), right = h('div', { class: 'panel', style: 'position:absolute;right:26px;left:350px;top:100px;bottom:20px;padding:10px 14px' });
    const pv = h('canvas', { width: 580, height: 600, style: 'width:290px;height:300px;border-radius:30px;background:linear-gradient(#bfe8ff,#fff3c4);border:5px solid var(--line);pointer-events:auto' });
    const g = pv.getContext('2d'); const drawPv = () => { g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 290, 300); const eq = sd.cosm.eq[who] || {}; G.ell(g, 145, 268, 70, 14, 'rgba(60,30,10,.2)', 0); M.chars.draw(g, who, 145, 268, { anim: 'cheer', t: M.time * .6, hat: eq.hat, shirtId: eq.shirt, sc: { moody: 1.2, aboody: 1.55, toota: 1.3, nemo: 1.55 }[who] || 1.3 }); };
    const tabs = h('div', { class: 'row', style: 'margin-bottom:8px' }), tabsA = h('div', { class: 'row', style: 'gap:8px;margin-top:12px;pointer-events:auto' });
    const grid = h('div', { class: 'grid scroll', style: 'grid-template-columns:repeat(4,1fr);gap:12px;height:330px;align-content:start;padding:4px' });
    left.append(pv, tabsA);
    function owned(id) { return sd.cosm.owned.indexOf(id) >= 0; }
    function render() {
      tabsA.textContent = ''; tabsA.style.flexWrap = 'wrap'; M.chars.playable().forEach(id => tabsA.append(h('button', { class: 'chip', 'data-who': id, style: 'cursor:pointer;font-size:18px;min-height:46px;padding:2px 8px 2px 3px;gap:4px;' + (who === id ? 'background:#ffc93c' : ''), onclick: () => { who = id; M.audio.sfx('pop'); M.voice.speak(sd.names[id] || M.chars.defs[id].name, { speaker: 'narrator' }); render(); } }, M.chars.defs[id].img ? h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:36px;height:36px;border-width:3px;box-shadow:none' }) : ico('face:' + id, 38), sd.names[id] || M.chars.defs[id].name)));
      tabs.textContent = ''; [['hat', 'القبعات'], ['shirt', 'الألوان']].forEach(t => tabs.append(h('button', { class: 'btn sm ' + (tab === t[0] ? 'orange' : 'gray'), onclick: tap(() => { tab = t[0]; render(); }) }, t[1])));
      tabs.append(h('div', { style: 'margin-right:auto' }, coinChip()));
      grid.textContent = ''; const eq = sd.cosm.eq[who];
      const items = [{ id: null, name: 'من غير', price: 0 }].concat(Object.values(tab === 'hat' ? M.chars.hats : M.chars.shirts).filter(it => !it.for || it.for.indexOf(who) >= 0));
      items.forEach(it => {
        const have = it.id == null || owned(it.id), on = (eq[tab] || null) === it.id;
        const icon = it.id == null ? ico('x', 64) : tab === 'hat' ? hatIcon(it) : ico('tee', 64, { color: it.color });
        const b = h('button', { class: 'mcard', 'data-item': it.id || 'none', style: 'height:150px;padding:4px;' + (on ? 'background:#c9f5cf' : ''), onclick: () => {
          if (!have) { if (sd.coins < it.price) { M.audio.sfx('wrong'); UI.toast('محتاجين عملات أكتر! كمّلوا المهام'); return; } sd.coins -= it.price; sd.cosm.owned.push(it.id); M.audio.sfx('coin'); }
          else M.audio.sfx('pop');
          eq[tab] = it.id; M.save.commit(); render();
        } }, icon, h('div', { style: 'font-size:17px;font-weight:bold' }, it.name), have ? (on ? ico('check', 28) : h('div', { style: 'font-size:18px;font-weight:bold;color:#1d7f33' }, it.id == null ? '' : 'البس')) : h('div', { class: 'chip', style: 'min-height:32px;padding:0 8px;font-size:20px;border-width:3px' }, ico('coin', 22), ar(it.price)));
        grid.append(b);
      });
    }
    right.append(tabs, grid); render();
    UI.show(h('div', null, hdr('تغيير الشكل', f.back), left, right), 'clear'); M.backdrop.mode = 'map'; UI.previews.push(drawPv);
  };
  function hatIcon(it) { const c = document.createElement('canvas'); c.width = c.height = 128; c.style.width = c.style.height = '64px'; const g = c.getContext('2d'); g.scale(2, 2); g.translate(32, 52); g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = M.OL; it.draw(g, 22); return c; }
  A.registerAll({ tee(g, o) { const c = o.color || '#9ea4ab'; G.poly(g, [[-18, -32], [-6, -38], [6, -38], [18, -32], [42, -14], [32, 6], [20, -2], [20, 38], [-20, 38], [-20, -2], [-32, 6], [-42, -14]], c, 5); g.beginPath(); g.arc(0, -38, 9, 0, Math.PI); G.fs(g, G.shade(c, -.2), 3); } });

  UI.parent = function (f) {
    const sd = M.save.data; let tw = 0, tm = 0, stars = 0; M.worlds.forEach(w => { if (!w.soon && !w.hidden) { tw += w.missions.length; tm += M.save.done(w); stars += M.save.mapStars(w); } });
    const stat = (l, v) => h('div', { class: 'chip', style: 'font-size:22px;min-height:46px' }, l + ': ', h('b', null, v));
    const bars = (info, data, title) => { const box = h('div', { style: 'margin:10px 0' }, h('div', { style: 'font-size:28px;font-weight:bold;margin-bottom:6px' }, title)); const keys = Object.keys(info), mx = Math.max(3, ...keys.map(k => data[k] || 0)); keys.forEach(k => { const v = data[k] || 0; box.append(h('div', { style: 'display:flex;align-items:center;gap:10px;margin:5px 0;text-align:right' }, h('div', { style: 'flex:0 0 190px;font-size:22px;font-weight:bold' }, info[k].label), h('div', { style: 'flex:1' }, h('div', { class: 'pbar', style: 'height:20px' }, h('i', { style: 'width:' + Math.round(100 * v / mx) + '%' })), h('div', { style: 'font-size:17px;opacity:.75;font-weight:bold;margin-top:2px' }, info[k].desc)), h('div', { style: 'flex:0 0 40px;font-size:24px;font-weight:bold' }, ar(v)))); }); return box; };
    const tiers = [['auto', 'تلقائي (حسب البطل)'], ['6', 'مستوى ٦ سنين'], ['9', 'مستوى ٩ سنين']];
    const tierRow = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:10px' }); const drawTier = () => { tierRow.textContent = ''; tiers.forEach(t => tierRow.append(h('button', { class: 'btn sm ' + (String(sd.settings.tier) === t[0] ? 'green' : 'gray'), onclick: tap(() => { sd.settings.tier = t[0]; M.save.commit(); drawTier(); }) }, t[1]))); }; drawTier();
    const tog = (label, key) => { const b = h('button', { class: 'btn sm', onclick: tap(() => { sd.settings[key] = !(sd.settings[key] !== false); M.save.commit(); up(); }) }); const up = () => { const on = sd.settings[key] !== false; b.className = 'btn sm ' + (on ? 'green' : 'gray'); b.textContent = label + (on ? ': شغّال' : ': مقفول'); }; up(); return b; };
    const body = h('div', { class: 'scroll panel', style: 'position:absolute;left:30px;right:30px;top:96px;bottom:16px;padding:14px 22px;text-align:right' },
      h('div', { style: 'font-size:22px;font-weight:bold;opacity:.8;margin-bottom:8px;line-height:1.5' }, 'اللعبة بتزرع القيم من خلال مواقف القصة من غير وعظ. هنا ملخص لِما اتدرّب عليه الأطفال. كل البيانات محفوظة على الجهاز فقط ولا تُرسل لأي مكان.'),
      h('div', { class: 'row', style: 'flex-wrap:wrap;gap:8px' }, stat('المهام', ar(tm) + '/' + ar(tw)), stat('النجوم', ar(stars)), stat('العملات', ar(sd.coins)), stat('الملصقات', ar(Object.keys(sd.stickers).length)), stat('صفحات اليوميات', ar(sd.diary.length))),
      bars(M.values, sd.valuesPracticed, 'القيم والعادات اللي اتمرّنوا عليها'), bars(M.skillsInfo, sd.skills, 'المهارات (عدد الألغاز اللي اتحلّت)'),
      h('div', { style: 'font-size:28px;font-weight:bold;margin:12px 0 6px' }, 'مستوى الألغاز'), tierRow,
      h('div', { style: 'font-size:18px;opacity:.7;font-weight:bold;margin:6px 0' }, 'تلقائي: عبودي (٦ سنين) بيجاوب ألغاز أسهل ومودي (٩ سنين) ألغاز أصعب.'),
      h('div', { class: 'row', style: 'margin:12px 0;flex-wrap:wrap' }, tog('الصوت', 'sound'), tog('صوت التعليمات', 'narr'), tog('تشجيع بصوت بشري', 'voice'), UI.btn('تغيير الأسماء', 'blue', f.names)),
      h('div', { class: 'row', style: 'margin:18px 0 8px' }, UI.btn('مسح كل التقدّم', 'red', () => { UI.confirm('متأكد إنك عايز تمسح كل النجوم والملصقات واليوميات؟', 'أيوه، امسح', 'لأ').then(ok => { if (ok) { M.save.reset(); M.save.load(); UI.toast('اتمسح كل حاجة'); f.reset(); } }); })));
    UI.show(h('div', null, hdr('ركن الأهل', f.back), body), 'clear'); M.backdrop.mode = 'map';
  };

  UI.pause = function (f) {
    const mo = UI.modal([h('h2', null, 'استراحة'), h('div', { class: 'row', style: 'flex-direction:column;gap:12px' },
      UI.btn('كمّل اللعب', 'green', () => { mo.close(); f.resume(); }, 'play'), UI.btn('نبدأ المهمة من جديد', 'yellow', () => { mo.close(); f.restart(); }), UI.btn('قائمة المهام', 'blue', () => { mo.close(); f.quit(); }),
      f.canSkip ? UI.btn('تخطّي المهمة', 'gray sm', () => { mo.close(); f.skip(); }) : null, h('div', { class: 'row' }, soundBtn(), UI.narrBtn(), hubLink()))]);
    return mo;
  };

  /* ---------- menu backdrop (canvas scene used outside missions) ---------- */
  M.backdrop = {
    t: 0, mode: 'title', stage: null,
    init() { this.stage = new M.Stage(); this.stage.showActive = false; },
    confetti() { if (this.stage) this.stage.confetti(); },
    update(dt) { this.t += dt; const s = this.stage; if (!s) return; s.update(dt); const m = s.heroes.moody, a = s.heroes.aboody, on = this.mode === 'title' || this.mode === 'result'; m.visible = a.visible = this.mode === 'title'; if (this.mode === 'title') { m.x = 770; m.y = 520; a.x = 190; a.y = 524; m.sc = a.sc = 1; m.fa = a.fa = (Math.floor(this.t / 3) % 2 ? 'cheer' : 'wave'); m.fat = a.fat = 1; a.dir = 1; m.dir = -1; } },
    draw(g) {
      const t = this.t, m = this.mode;
      const sky = m === 'title' ? ['#7fd0ff', '#d9f2ff', '#fff3c4'] : ['#8fd6ff', '#cdeeff', '#fff0c8'];
      g.fillStyle = G.lin(g, 0, 0, 0, 540, sky); g.fillRect(0, 0, 960, 540);
      G.sun(g, 800, 90, 40, t); for (let i = 0; i < 5; i++) G.cloud(g, ((i * 260 + t * 14) % 1300) - 150, 80 + (i % 3) * 70, 1.1 + (i % 2) * .4, .85);
      g.fillStyle = '#a8e0a0'; g.beginPath(); g.moveTo(0, 440); g.quadraticCurveTo(240, 380, 520, 430); g.quadraticCurveTo(780, 470, 960, 400); g.lineTo(960, 540); g.lineTo(0, 540); g.fill();
      g.fillStyle = '#86d17f'; g.beginPath(); g.moveTo(0, 490); g.quadraticCurveTo(300, 440, 600, 490); g.quadraticCurveTo(800, 520, 960, 470); g.lineTo(960, 540); g.lineTo(0, 540); g.fill();
      if (this.stage) { this.stage.bg = null; this.stage.draw(g, t); }
    }
  };
  M.hooks.frame.push(() => { if (UI.previews.length) UI.previews.forEach(f => f()); });
})();
