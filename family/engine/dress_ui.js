/* Family Adventures - engine/dress_ui.js : the OUTFIT PANEL (wardrobe), the room door (choose who dresses), the instant outfit swap (prebake + poof / spin-and-pop) and the map tile.
   Panel API (used by worlds/rooms.js):  const p = Moody.dress.openPanel({ who, stage, host, say(textKey|text), onClose, fashion })  ->  { close(), setHero(id), refresh(), tab(name) }
   The character on the stage shows the DRAFT outfit (Moody.dress.live[id]) so every try-on is visible at once; only owned / free items are saved (cosm.eq[id].fit).
   MODESTY: an outfit swap never shows an unclothed body: the new look is baked off-screen first, then the old look stays on screen under an opaque white puff / during a spin until the new one replaces it. */
(function () {
  'use strict';
  const M = window.Moody, D = M.dress, C = M.chars, UI = M.ui, A = M.art, G = M.gfx, U = M.util;
  if (!D || !D.items || !UI) return;
  const h = UI.h, ar = U.ar, I = (n, px, o) => UI.i ? UI.i(n, px, o) : UI.ico(n, px, o);

  /* ------------------------------------------------------------------ voice lines (collectable) */
  const L = D.lines;
  /* per-gender, per-hero-index (0 = first playable of that gender in DEFS order, 1 = second ...) so one text is only ever spoken by ONE voice */
  D.toyLines = {
    m: [{ robot: 'بيب بوب! الروبوت صاحبي!', cars: 'عربية سريعة أوي!', blocks: 'بنيت برج عالي!', ball: 'جول! شوت جامد!', telescope: 'شفت نجوم كتير!', poster: 'الفضا حلو أوي!', mirror: 'شوف شكلي في المراية!', welcome: 'أهلًا في أوضتنا! اختار لبس حلو.', look: ['شكلي بقى شيك!', 'ده لبس جامد!', 'حبيت اللبس ده!'], color: 'حلو أوي اللون ده!', random: 'مفاجأة! شوف شكلي!', ok: 'يلا بينا بقى!' },
        { robot: 'الروبوت بيتكلم!', cars: 'ورررم! عربيتي بتجري!', blocks: 'أنا بعمل قلعة!', ball: 'كورة كورة! جون!', telescope: 'القمر قريب أوي!', poster: 'أنا بحب الأسد!', mirror: 'أنا شايف نفسي أهو!', welcome: 'أنا بحب أوضتنا يا جماعة! يلا نلبس.', look: ['أنا بقيت شيك أوي!', 'اللبس ده حلو!', 'أنا مبسوط بيه!'], color: 'اللون ده جميل!', random: 'لبس مفاجأة جامد!', ok: 'تمام كده!' }],
    f: [{ dollhouse: 'بيت العرايس منوّر!', plush: 'الدبدوب حلو أوي، هحضنه!', paints: 'ألوان حلوة أوي!', books: 'الكتاب ده حلو!', flowers: 'ريحة الورد حلوة!', fairy: 'الأنوار الحلوة!', mirror: 'يلا نشوف نفسنا في المراية!', welcome: 'أهلًا في أوضتنا! اختاري لبس حلو.', look: ['شكلي بقى حلو أوي!', 'ده لبس جميل!', 'حبيته أوي!'], color: 'اللون ده شيك أوي!', random: 'لبس مفاجأة، يا ترى حلو؟', ok: 'كده تمام!' },
        { dollhouse: 'العرايس عايزين يلعبوا!', plush: 'الدبدوب بيحبني!', paints: 'هرسم رسمة حلوة!', books: 'عايزة أقرا حكاية!', flowers: 'الورد جميل أوي!', fairy: 'الأنوار بتلمع!', mirror: 'أنا في المراية!', welcome: 'أنا بحب أوضتنا! يلا نلبس.', look: ['أنا حلوة أوي كده!', 'اللبس ده جميل!', 'أنا بحبه!'], color: 'اللون ده جميل أوي!', random: 'لبس مفاجأة حلو!', ok: 'كده بقيت جاهزة!' }]
  };
  D.heroIndex = id => { const g = D.gender(id); return Math.max(0, C.playable().filter(k => D.gender(k) === g).indexOf(id)); };
  D.line = (id, key) => { const g = D.gender(id), set = D.toyLines[g] || D.toyLines.m, v = set[D.heroIndex(id) % set.length] || set[0]; let t = v[key]; if (Array.isArray(t)) t = t[Math.floor(Math.random() * t.length)]; return t || ''; };
  D.tabPrompts = { set: 'اختار طقم جاهز', top: 'اختار الملابس', bottom: 'اختار البنطلون أو الجيبة', shoes: 'اختار الجزمة', head: 'اختار القبعة', hijab: 'اختار الغطا', acc: 'اختار إكسسوار', color: 'اختار اللون' };
  /* every string this feature can say - pushed into the voice collector (tools/collect_voice.js reads Moody.voice.fixedStrings) */
  D.allVoice = function () {
    const out = [], add = (t, sp) => { if (t) out.push([t, sp || 'narrator']); };
    ['pick', 'door', 'wardrobe', 'reset', 'saved', 'bought', 'tryon', 'noCoins', 'bye', 'fashionStart', 'fashionWin'].forEach(k => add(L[k]));
    Object.keys(D.tabPrompts).forEach(k => add(D.tabPrompts[k]));
    D.goals.forEach(g => { add(g.title); add(g.say); g.need.forEach(n => add('محتاج ' + n.n)); });
    Object.keys(D.toyLines).forEach(g => D.toyLines[g].forEach((v, i) => { const hid = C.playable().filter(k => D.gender(k) === g)[i]; Object.keys(v).forEach(k => [].concat(v[k]).forEach(t => add(t, hid || (g === 'm' ? 'moody' : 'toota')))); }));
    ['ملصق جديد: نجم الأزياء', 'جرّبه بس', 'غرفتي', 'غرفة الأولاد', 'غرفة البنات', 'عرض الأزياء', 'عشوائي', 'حفظ كأفضل لبس', 'رجّعني لشكلي الأصلي', 'تمام', 'لبسي المفضل', 'اشتري', 'جديد', 'خلّصت'].forEach(t => add(t));
    D.items.forEach(it => add(it.n)); D.sets.forEach(s => add(s.n)); Object.keys(D.colors).forEach(c => add(D.colors[c].n));
    return out;
  };
  if (M.voice && M.voice.fixedStrings) { D.allVoice().forEach(x => M.voice.fixedStrings.push(x)); if (M.voice.collect) setTimeout(() => M.voice.noteFixed && M.voice.noteFixed(), 0); }
  const speak = (t, who) => { if (t) M.voice.speak(t, { speaker: who || 'narrator', soft: !!who }); };
  D.speak = speak;

  /* ------------------------------------------------------------------ icons (drawn art) */
  A.registerAll({
    dr_set(g) { G.line(g, 0, -34, 0, -22, 4, '#7a5a3a'); g.beginPath(); g.arc(0, -38, 6, Math.PI * .1, Math.PI * 1.9); g.lineWidth = 4.5; g.strokeStyle = M.OL; g.stroke(); G.poly(g, [[-40, 24], [0, -22], [40, 24]], '#fff', 4.5); G.star(g, 0, 8, 12, '#ffc93c', 3); },
    dr_top(g) { G.poly(g, [[-18, -34], [-6, -40], [6, -40], [18, -34], [40, -14], [30, 6], [20, -2], [20, 38], [-20, 38], [-20, -2], [-30, 6], [-40, -14]], '#4aa8e8', 4.5); g.beginPath(); g.arc(0, -40, 9, 0, Math.PI); G.fs(g, '#2f7be8', 3); G.line(g, -9, 8, 9, 8, 3, 'rgba(255,255,255,.7)'); },
    dr_bot(g) { G.poly(g, [[-22, -36], [22, -36], [26, 40], [4, 40], [0, -4], [-4, 40], [-26, 40]], '#5b7fd0', 4.5); G.line(g, -22, -26, 22, -26, 4, '#ffd23c'); G.line(g, 0, -4, 0, -26, 2.4, 'rgba(0,0,0,.25)'); },
    dr_shoe(g) { G.poly(g, [[-36, 6], [-36, -18], [-14, -22], [-4, -6], [30, 0], [40, 14], [40, 24], [-36, 24]], '#ef5350', 4.5); G.fillRR(g, -38, 18, 80, 10, 5, '#fff', 3.5); G.line(g, -22, -14, -10, -4, 3, '#fff'); G.line(g, -12, -4, 0, 4, 3, '#fff'); },
    dr_hat(g) { g.beginPath(); g.ellipse(0, 6, 40, 12, 0, 0, Math.PI * 2); G.fs(g, '#ffb347', 4.5); g.beginPath(); g.ellipse(0, -8, 24, 26, 0, Math.PI, 0); G.fs(g, '#ff8a2a', 4.5); G.line(g, -24, -6, 24, -6, 6, '#4a8dff'); },
    dr_acc(g) { G.circ(g, -18, 0, 18, 'rgba(190,230,255,.9)', 4.5); G.circ(g, 18, 0, 18, 'rgba(190,230,255,.9)', 4.5); G.line(g, -2, -4, 2, -4, 4.5); G.line(g, -36, -6, -44, -14, 4); G.line(g, 36, -6, 44, -14, 4); },
    dr_col(g) { g.beginPath(); g.moveTo(-34, -6); g.bezierCurveTo(-42, -34, -4, -44, 22, -36); g.bezierCurveTo(48, -26, 46, 8, 22, 12); g.bezierCurveTo(8, 14, 12, 26, -4, 28); g.bezierCurveTo(-26, 30, -30, 14, -34, -6); G.fs(g, '#ffe6b0', 4.5); [['#ef5350', -22, -16], ['#ffd23c', -2, -28], ['#4aa8e8', 20, -20], ['#5cc96b', -16, 6]].forEach(a => G.circ(g, a[1], a[2], 6.5, a[0], 2)); },
    dr_dice(g) { G.fillRR(g, -30, -30, 60, 60, 14, '#fff', 4.5); [[-14, -14], [14, -14], [0, 0], [-14, 14], [14, 14]].forEach(p => G.circ(g, p[0], p[1], 5, '#ef5350', 0)); },
    dr_best(g) { G.heart(g, 0, 2, 26, '#ff5a7a', 4.5); G.star(g, 0, 0, 10, '#fff3b0', 0); },
    dr_back(g) { g.lineWidth = 6; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(-26, -6); g.lineTo(-26, 26); g.lineTo(26, 26); g.stroke(); G.poly(g, [[-30, -4], [0, -30], [30, -4]], '#fff', 4.5); },
    dr_runway(g) { G.fillRR(g, -40, 18, 80, 14, 5, '#8a6bd6', 4); G.star(g, 0, -6, 22, '#ffc93c', 4); G.sparkle(g, -32, -22, 8, '#fff6a8'); G.sparkle(g, 32, -26, 6, '#fff6a8'); },
    dr_weather_sun(g) { G.circ(g, 0, 0, 22, '#ffc93c', 4.5); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; G.line(g, Math.cos(a) * 30, Math.sin(a) * 30, Math.cos(a) * 42, Math.sin(a) * 42, 5, '#ffb347'); } },
    dr_weather_rain(g) { G.circ(g, -12, -8, 20, '#b9c8e0', 4.5); G.circ(g, 14, -12, 24, '#cdd9ea', 4.5); G.fillRR(g, -34, -6, 72, 20, 10, '#cdd9ea', 0); for (let i = 0; i < 4; i++) G.line(g, -24 + i * 16, 22, -30 + i * 16, 38, 5, '#4aa8e8'); },
    dr_weather_snow(g) { for (let i = 0; i < 3; i++) { const a = i * Math.PI / 3; G.line(g, Math.cos(a) * 36, Math.sin(a) * 36, -Math.cos(a) * 36, -Math.sin(a) * 36, 6, '#8fd1ff'); } G.circ(g, 0, 0, 7, '#fff', 3); },
    dr_weather_beach(g) { g.beginPath(); g.moveTo(-44, 14); for (let i = 0; i < 5; i++) g.quadraticCurveTo(-44 + i * 22 + 11, 2, -44 + i * 22 + 22, 14); g.lineTo(44, 40); g.lineTo(-44, 40); g.closePath(); G.fs(g, '#4aa8e8', 4); G.circ(g, 26, -22, 14, '#ffc93c', 3.5); },
    dr_weather_school(g) { G.fillRR(g, -36, -4, 72, 40, 4, '#ffd23c', 4.5); G.poly(g, [[-42, -4], [0, -36], [42, -4]], '#ef5350', 4.5); G.fillRR(g, -8, 12, 16, 24, 3, '#8a5a3a', 3); },
    dr_weather_party(g) { G.poly(g, [[-22, 32], [22, 32], [0, -34]], '#ff6f91', 4.5); [[-8, 8], [6, -8], [8, 16]].forEach(p => G.circ(g, p[0], p[1], 4, '#ffe14d', 0)); G.sparkle(g, 30, -22, 9, '#fff6a8'); G.sparkle(g, -32, -12, 7, '#fff6a8'); }
  });

  /* ------------------------------------------------------------------ CSS (injected, so no index.html / ui.css edit is needed) */
  const css = `
  .dr-panel{position:absolute;left:414px;right:12px;top:82px;bottom:12px;pointer-events:auto;display:flex;flex-direction:column;gap:8px;padding:10px 10px 10px;border-radius:26px;background:linear-gradient(#fffdf6,#ffefcf);border:4px solid var(--line);box-shadow:var(--sh-2);animation:drIn .38s var(--spring);direction:rtl;z-index:30}
  @keyframes drIn{0%{transform:translateX(70px) scale(.9);opacity:0}100%{transform:none;opacity:1}}
  .dr-panel.out{animation:drOut .25s ease-in forwards}
  @keyframes drOut{to{transform:translateX(80px) scale(.92);opacity:0}}
  .dr-head{display:flex;align-items:center;gap:8px;min-height:40px}
  .dr-head .nm{font:900 22px var(--font);display:flex;align-items:center;gap:8px;flex:1;min-width:0}
  .dr-head .nm .av{width:38px;height:38px;border-width:3px;box-shadow:none;flex:none}
  .dr-head .pill{flex:none}
  .dr-tabs{display:flex;gap:5px}
  .dr-tab{flex:1;min-width:0;height:60px;padding:2px 0 0;border-radius:18px;border:3px solid var(--line);background:linear-gradient(#fff,#fff3d6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:0;font:900 15px/1.1 var(--font);color:var(--ink);cursor:pointer;box-shadow:0 4px 0 rgba(58,32,19,.25);position:relative}
  .dr-tab canvas{width:34px;height:34px;display:block}
  .dr-tab[aria-selected=true]{background:linear-gradient(#ffe98a,#ffc928);transform:translateY(3px);box-shadow:0 1px 0 rgba(58,32,19,.25)}
  .dr-tab .nw{position:absolute;top:-8px;right:-4px;background:#f0457d;color:#fff;font:900 13px var(--font);padding:1px 7px;border-radius:10px;border:2px solid #fff}
  .dr-body{position:relative;flex:1;min-height:0;display:flex;flex-direction:column;gap:4px;overflow:hidden}
  .dr-list{display:flex;gap:9px;flex:1;min-height:0;padding:6px 24px 10px;align-items:stretch}
  .dr-card{flex:0 0 114px;position:relative;border-radius:20px;border:3px solid var(--line);background:linear-gradient(#fff,#fff6e2);display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:3px;padding:6px 4px 6px;cursor:pointer;font:900 16px/1.15 var(--font);color:var(--ink);text-align:center;box-shadow:0 5px 0 rgba(58,32,19,.22);overflow:visible}
  .dr-card:active{transform:translateY(4px);box-shadow:0 1px 0 rgba(58,32,19,.22)}
  .dr-card canvas{width:100px;height:100px;border-radius:14px;background:linear-gradient(#d7efff,#fff3c4);display:block;flex:none}
  .dr-card.on{background:linear-gradient(#f2fff3,#c9f5cf);border-color:#1f8c3d}
  .dr-card .nm{min-height:36px;display:flex;align-items:center;justify-content:center;padding:0 2px}
  .dr-card .st{display:flex;align-items:center;justify-content:center;min-height:28px}
  .dr-card .pr{display:inline-flex;align-items:center;gap:4px;background:linear-gradient(#fff7d0,#ffe9a0);border:2.5px solid var(--line);border-radius:14px;padding:0 8px;font:900 18px var(--font);height:28px}
  .dr-card .lk{font:900 13px/1.15 var(--font);color:#7a4a00;background:#ffe6b0;border:2px solid var(--line);border-radius:10px;padding:2px 6px;display:inline-flex;align-items:center;gap:3px}
  .dr-card .tick{width:26px;height:26px;border-radius:50%;background:#2fb24f;display:flex;align-items:center;justify-content:center;border:2.5px solid #fff;box-shadow:0 0 0 2px #1f8c3d}
  .dr-card .nw{position:absolute;top:-9px;left:-7px;background:#f0457d;color:#fff;font:900 14px var(--font);padding:1px 9px;border-radius:12px;border:2.5px solid #fff;transform:rotate(-8deg);box-shadow:0 2px 0 rgba(0,0,0,.2);z-index:2}
  .dr-card .try{position:absolute;top:-9px;right:-6px;background:#8a6bd6;color:#fff;font:900 13px var(--font);padding:1px 8px;border-radius:12px;border:2.5px solid #fff;z-index:2}
  .dr-card.sig .nm{color:#6b5644}
  .dr-sep{flex:0 0 6px;border-radius:3px;background:rgba(74,46,28,.25);margin:10px 2px}
  .dr-arrow{position:absolute;top:50%;margin-top:-24px;width:40px;height:48px;border-radius:16px;z-index:5;padding:0;min-height:0}
  .dr-arrow.l{left:-18px}.dr-arrow.r{right:-18px}
  .dr-buy{display:flex;align-items:center;gap:8px;background:linear-gradient(#f1e6ff,#dccbff);border:3px solid var(--line);border-radius:18px;padding:4px 8px;min-height:50px;animation:popin .3s var(--spring)}
  .dr-buy .tx{flex:1;font:900 17px/1.2 var(--font);min-width:0}
  .dr-act{display:flex;gap:6px}
  .dr-act .btn{flex:1;min-width:0;padding:2px 4px;font-size:16px;min-height:58px;line-height:1.1;flex-direction:column;gap:0;border-radius:18px}
  .dr-act .btn canvas{width:30px;height:30px}
  .dr-act .btn.ok{flex:1.15}
  .dr-col{display:flex;flex-direction:column;gap:6px;flex:1;min-height:0;padding:2px 4px}
  .dr-targets{display:flex;gap:6px;overflow-x:auto;padding:2px 2px 2px;flex:none;height:58px;scrollbar-width:none}
  .dr-tg{flex:0 0 54px;height:52px;border-radius:14px;border:3px solid var(--line);background:#fff;padding:0;display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative}
  .dr-tg canvas{width:44px;height:44px;border-radius:10px}
  .dr-tg[aria-pressed=true]{background:linear-gradient(#ffe98a,#ffc928);box-shadow:0 0 0 3px #fff,0 0 0 6px var(--line)}
  .dr-sw{display:grid;grid-auto-flow:column;grid-template-rows:repeat(2,42px);grid-auto-columns:42px;gap:6px;justify-content:start;align-content:center;padding:4px 6px 6px;overflow-x:auto;overflow-y:hidden;flex:none;height:98px;touch-action:pan-x;scrollbar-width:none}
  .dr-dot{width:42px;height:42px;border-radius:50%;border:3px solid var(--line);cursor:pointer;padding:0;position:relative;box-shadow:0 3px 0 rgba(58,32,19,.25),inset 0 4px 0 rgba(255,255,255,.35)}
  .dr-dot[aria-pressed=true]{box-shadow:0 0 0 3px #fff,0 0 0 6px #1f8c3d}
  .dr-pats{display:flex;gap:6px;justify-content:center;flex-wrap:wrap;flex:none}
  .dr-pat{min-width:54px;height:44px;border-radius:12px;border:3px solid var(--line);background:#fff;font:900 14px var(--font);color:var(--ink);padding:0 6px;display:flex;align-items:center;gap:5px;cursor:pointer}
  .dr-pat canvas{width:30px;height:30px;border-radius:8px}
  .dr-pat[aria-pressed=true]{background:linear-gradient(#ffe98a,#ffc928);box-shadow:0 0 0 3px #fff,0 0 0 6px var(--line)}
  .dr-hint{font:900 18px var(--font);text-align:center;color:#6b5644;padding:4px}
  .dr-btn-room{position:absolute;left:12px;bottom:12px;pointer-events:auto;z-index:20}
  .dr-banner{position:absolute;left:414px;right:12px;top:82px;pointer-events:none;z-index:31;display:flex;justify-content:center}
  .dr-door{position:absolute;inset:0;display:flex;gap:22px;padding:98px 30px 24px;direction:rtl}
  .dr-room{flex:1;border-radius:30px;border:4px solid var(--line);box-shadow:var(--sh-2);padding:14px 12px;display:flex;flex-direction:column;align-items:center;gap:10px;pointer-events:auto}
  .dr-room.m{background:linear-gradient(#d7ecff,#a9d0f7)}
  .dr-room.f{background:linear-gradient(#ffe1ee,#ffb9d3)}
  .dr-room h3{margin:0;font:900 34px var(--font);text-shadow:0 3px 0 #fff;display:flex;align-items:center;gap:10px}
  .dr-heroes{display:flex;gap:16px;flex-wrap:wrap;justify-content:center;align-items:center;flex:1}
  .dr-hero{border:4px solid var(--line);border-radius:26px;background:linear-gradient(#fff,#fff3d6);padding:8px 10px 6px;display:flex;flex-direction:column;align-items:center;gap:4px;cursor:pointer;font:900 26px var(--font);color:var(--ink);box-shadow:0 6px 0 rgba(58,32,19,.28);min-width:150px}
  .dr-hero:active{transform:translateY(5px);box-shadow:0 1px 0 rgba(58,32,19,.28)}
  .dr-hero .av{width:112px;height:112px}
  .dr-weather{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:520px;pointer-events:auto;z-index:40;text-align:center;padding:16px 20px;animation:popin .4s var(--spring)}
  .dr-weather canvas{width:150px;height:150px;border-radius:30px;background:linear-gradient(#bfe8ff,#fff3c4);border:4px solid var(--line)}
  .dr-weather .tt{font:900 36px/1.2 var(--font);margin:8px 0 6px}
  .dr-goal{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(#fff,#fff3d6);border:3px solid var(--line);border-radius:22px;padding:4px 14px 4px 8px;font:900 22px var(--font);pointer-events:auto;box-shadow:var(--sh-1)}
  .dr-goal canvas{width:54px;height:54px;border-radius:14px;background:linear-gradient(#bfe8ff,#fff3c4)}
  @media (prefers-reduced-motion:reduce){.dr-panel,.dr-buy,.dr-weather{animation:none}}
  `;
  const stl = document.createElement('style'); stl.id = 'dress-css'; stl.textContent = css; document.head.appendChild(stl);

  /* ------------------------------------------------------------------ instant swap: prebake + poof */
  const PB = document.createElement('canvas'); PB.width = PB.height = 64; const pg = PB.getContext('2d');
  D.prebake = function (id, fit) {   // bake the new look's sprite sets (both facing directions) OFF-screen, over two frames, so the swap itself costs nothing
    return new Promise(res => {
      const k = M.cv ? M.cv.width / 960 : 1, st = M.scene, sc = (st && st.heroes && st.heroes[id] && st.heroes[id].sc) || 1;
      const bake = dir => { pg.setTransform(k, 0, 0, k, 0, 0); pg.clearRect(0, 0, 64, 64); pg.lineJoin = 'round'; pg.lineCap = 'round'; try { C.draw(pg, id, 32, 56, { outfit: fit, snap: true, noShadow: true, key: 'pb:' + id, dir, sc }); } catch (e) { } };
      bake(1); requestAnimationFrame(() => { bake(-1); res(); });
    });
  };
  /* white puff + sparkles around the hero: opaque for ~0.25 s, the outfit is replaced while it is opaque */
  D.poof = function (stage, id, o) {
    o = o || {}; const hr = stage.heroes[id]; if (!hr) return; const hh = C.height(id) * hr.sc, t0 = stage.t, cols = o.cols || ['#ffffff', '#fff1f8', '#eaf6ff'];
    const puffs = []; for (let i = 0; i < 14; i++) puffs.push({ a: i * 2.399, r: 8 + (i % 5) * 7, y: (i / 13), s: 22 + (i % 4) * 7 });
    const rm = stage.addLayer({ z: 20, draw(g, t) {
      const u = (t - t0) / (o.dur || .6); if (u >= 1) { rm(); return; }
      const open = u < .3 ? u / .3 : 1 - (u - .3) / .7, grow = .45 + u * .9;
      g.save(); g.globalAlpha = Math.max(0, Math.min(1, open * 1.15));
      puffs.forEach((p, i) => { const x = hr.x + Math.cos(p.a) * (p.r + u * 26) * hr.sc, y = hr.y - hh * (.08 + p.y * .86) + Math.sin(p.a * 1.7) * 6, r = p.s * grow * hr.sc * 1.25; G.circ(g, x, y, r, cols[i % cols.length], 2.4, 'rgba(120,90,140,.5)'); });
      g.restore();
      g.save(); g.globalAlpha = Math.max(0, 1 - u); for (let i = 0; i < 6; i++) { const a = i * 1.05 + u * 3; G.sparkle(g, hr.x + Math.cos(a) * (40 + u * 70) * hr.sc, hr.y - hh * .5 + Math.sin(a) * (50 + u * 50) * hr.sc, 7 + (i % 3) * 3, i % 2 ? '#fff6a8' : '#ffb3d9'); } g.restore();
    } });
    stage.sparkle(hr.x, hr.y - hh * .5, { n: 12, spread: 130 }); try { M.audio.sfx('pop'); } catch (e) { }
  };
  let swapTok = 0;
  /* D.swap(stage, id, fit, {fx:'poof'|'spin', after}) : returns a promise resolved when the new look is on screen */
  D.swap = async function (stage, id, fit, o) {
    o = o || {}; const tok = ++swapTok; await D.prebake(id, fit); if (tok !== swapTok && !o.force) return false;
    const spin = o.fx === 'spin'; D.poof(stage, id, spin ? { dur: .7 } : null); if (spin) { try { C.react(id, 'spin', { sfx: false, force: true }); } catch (e) { } }
    await new Promise(r => setTimeout(r, spin ? 330 : 120)); D.live[id] = fit; D.ver++; if (M.scene && M.scene.dirty) { /* actors only: no re-bake of the room needed */ }
    return true;
  };

  /* ------------------------------------------------------------------ the panel */
  const TABS = [['set', 'أطقم', 'dr_set'], ['top', 'الملابس', 'dr_top'], ['bottom', 'البنطلون', 'dr_bot'], ['shoes', 'الجزمة', 'dr_shoe'], ['head', 'القبعة', 'dr_hat'], ['acc', 'إكسسوار', 'dr_acc'], ['color', 'الألوان', 'dr_col']];
  const CROPS = { top: 'upper', bottom: 'lower', shoes: 'feet', head: 'head', set: 'full' };
  const ACC_CROP = { face: 'head', back: 'upper', neck: 'upper', wrist: 'upper', phones: 'upper', badge: 'upper' };
  const SL = { top: 'top', bottom: 'bottom', shoes: 'shoes', head: 'head' };

  D.revealFit = (who, fit) => D.isHijab(who) && !(fit.hijab && fit.hijab.p === 'short') ? D.withSlot(fit, 'hijab', Object.assign({}, fit.hijab || {}, { p: 'short' })) : fit;   // preview only: short wrap so the top / skirt stays visible

  D.openPanel = function (o) {
    const stage = o.stage, host = o.host || UI.over; let who = o.who, tab = o.tab || (o.fashion ? 'top' : 'set'), draft, saved, colT = 'top', closed = false, queue = [], qraf = 0, gen = 0;
    const el = h('div', { class: 'dr-panel', role: 'region', 'aria-label': 'خزانة الملابس' });
    const sd = M.save.data, byId = D.byId;
    const hero = id => ({ nm: sd.names[id] || C.defs[id].name });
    function load(id) {
      who = id; D.migrate(id); saved = D.clone(D.eq(id).fit); draft = D.clone(saved); D.live[id] = draft; D.ver++; if (!isTabOk(tab)) tab = 'top';
    }
    function isTabOk(t) { return TABS.some(x => x[0] === t); }
    const sigOnly = (slot) => D.withSlot(draft, slot, null);
    function commit() { saved = D.sanitize(draft, saved); D.setSaved(who, saved); }
    function locked() { return D.lockedIn(draft); }
    /* the card list of the current tab */
    function cards() {
      const out = [], g = D.gender(who), isH = D.isHijab(who), base = C.defs[who];
      if (tab === 'set') { const b = D.best(who); if (b) out.push({ k: 'best', n: 'لبسي المفضل', fit: b, crop: 'full', pic: 'dr_best' }); D.setsFor(who).forEach(s => { const f = D.setSet(who, s); out.push({ k: 'set', set: s, n: s.n, fit: f, crop: 'full' }); }); }
      else if (tab === 'top') { out.push({ k: 'sig', slot: 'top', n: 'لبسي الأصلي', crop: 'upper' }); D.itemsFor(who, 'top').forEach(it => out.push({ k: 'item', it, crop: 'upper' })); }
      else if (tab === 'bottom') { out.push({ k: 'sig', slot: 'bottom', n: 'من الأصلي', crop: 'lower' }); D.itemsFor(who, 'bottom').forEach(it => out.push({ k: 'item', it, crop: 'lower' })); }
      else if (tab === 'shoes') { out.push({ k: 'sig', slot: 'shoes', n: 'جزمتي الأصلية', crop: 'feet' }); D.itemsFor(who, 'shoes').forEach(it => out.push({ k: 'item', it, crop: 'feet' })); }
      else if (tab === 'head') {
        if (isH) { out.push({ k: 'sig', slot: 'hijab', n: 'حجابي الأصلي', crop: 'head' }); D.itemsFor(who, 'hijab').forEach(it => out.push({ k: 'item', it, crop: 'head' })); out.push({ k: 'sep' }); }
        out.push(base.sunhat || base.hat ? { k: 'sig', slot: 'head', n: 'قبعتي الأصلية', crop: 'head' } : { k: 'none', slot: 'head', n: 'من غير قبعة', crop: 'head' });
        if (base.sunhat || base.hat) out.push({ k: 'none', slot: 'head', n: 'من غير قبعة', crop: 'head' });
        D.itemsFor(who, 'head').forEach(it => out.push({ k: 'item', it, crop: 'head' }));
      } else if (tab === 'acc') { out.push({ k: 'noacc', n: 'من غير إكسسوار', crop: 'upper' }); D.itemsFor(who, 'acc').forEach(it => out.push({ k: 'item', it, crop: ACC_CROP[it.cat] || 'upper' })); }
      return out;
    }
    function cardFit(c) {
      if (c.fit) return c.fit;
      if (c.k === 'sig') return D.withSlot(draft, c.slot, null);
      if (c.k === 'none') return D.withSlot(draft, 'head', { i: 'none' });
      if (c.k === 'noacc') return Object.assign(D.clone(draft), { acc: [] });
      const cur = c.it.slot === 'acc' ? (draft.acc || []).find(a => a.i === c.it.id) : draft[c.it.slot];
      return D.equip(who, c.it.slot === 'acc' ? D.withSlot(draft, 'acc', (draft.acc || []).filter(a => a.i !== c.it.id)) : draft, c.it, { keepColor: false });
    }
    function isOn(c) {
      if (c.k === 'item') { if (c.it.slot === 'acc') return (draft.acc || []).some(a => a.i === c.it.id); const v = draft[c.it.slot]; return !!v && v.i === c.it.id; }
      if (c.k === 'sig') return !draft[c.slot]; if (c.k === 'none') return !!draft.head && draft.head.i === 'none'; if (c.k === 'noacc') return !!draft.acc && draft.acc.length === 0;
      return false;
    }
    function previewFitFor(c) {
      let f = cardFit(c);
      if (tab === 'shoes' && D.gender(who) === 'f') { const t = f.top && byId[f.top.i]; if (!(t && t.full)) f = D.withSlot(f, 'bottom', { i: 'leggings', c: 'black' }); }   // show boots / socks even under a long skirt
      if ((tab === 'top' || tab === 'bottom' || tab === 'set') && D.isHijab(who)) f = D.revealFit(who, f);
      return f;
    }
    function paintPreview(cv, c) {
      queue.push(() => { try { const src = D.preview(who, previewFitFor(c), c.crop, 100), g = cv.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cv.width, cv.height); g.drawImage(src, 0, 0, cv.width, cv.height); } catch (e) { } }); if (!qraf) qraf = requestAnimationFrame(pump);
    }
    const SKIRTS = { longskirt: 1, midiskirt: 1, pleated: 1 };
    function pump() { qraf = 0; if (closed) return; let n = 0, t0 = performance.now(); while (queue.length && n < 3 && performance.now() - t0 < 9) { queue.shift()(); n++; } if (queue.length) qraf = requestAnimationFrame(pump); }

    /* ----- rendering ----- */
    let listEl = null, bodyEl = null;
    function render() {
      gen++; queue.length = 0; el.textContent = '';
      const nm = hero(who).nm;
      el.append(h('div', { class: 'dr-head' }, h('div', { class: 'nm' }, (() => { const a = UI.avatar(who, 38, { cls: 'av', size: true, still: true }); return a; })(), nm), renderBuy(), h('div', { class: 'pill', 'data-ctr': 'coin', role: 'status', 'aria-label': 'العملات' }, I('coin', 28), h('span', { class: 'v' }, ar(sd.coins)))));
      const tabs = h('div', { class: 'dr-tabs', role: 'tablist' });
      TABS.forEach(t => {
        const lab = t[0] === 'head' ? (D.isHijab(who) ? 'الغطا' : 'القبعة') : t[1], newN = t[0] === 'color' || t[0] === 'set' ? 0 : D.itemsFor(who, t[0] === 'head' ? 'head' : t[0] === 'acc' ? 'acc' : t[0]).concat(t[0] === 'head' && D.isHijab(who) ? D.itemsFor(who, 'hijab') : []).filter(D.isNew).length;
        const b = h('button', { class: 'dr-tab', role: 'tab', 'aria-selected': tab === t[0] ? 'true' : 'false', 'data-tab': t[0], 'aria-label': lab, onclick: () => { M.audio.sfx('tap'); setTab(t[0]); } }, A.el(t[2], 38), lab); tabs.append(b);
      });
      el.append(tabs);
      bodyEl = h('div', { class: 'dr-body' }); el.append(bodyEl);
      if (tab === 'color') renderColor(); else renderList();
      el.append(h('div', { class: 'dr-act' },
        h('button', { class: 'btn sm purple', 'data-act': 'random', 'aria-label': 'عشوائي', onclick: () => { M.audio.sfx('tap'); randomize(); } }, A.el('dr_dice', 30), 'عشوائي'),
        h('button', { class: 'btn sm pink', 'data-act': 'best', 'aria-label': 'حفظ كأفضل لبس', onclick: () => { M.audio.sfx('tap'); saveBest(); } }, A.el('dr_best', 30), 'حفظ كأفضل لبس'),
        h('button', { class: 'btn sm gray', 'data-act': 'reset', 'aria-label': 'رجّعني لشكلي الأصلي', onclick: () => { M.audio.sfx('tap'); resetLook(); } }, I('replay', 28), 'رجّعني لشكلي الأصلي'),
        h('button', { class: 'btn sm green ok', 'data-act': 'ok', 'aria-label': o.fashion ? 'خلّصت' : 'تمام', onclick: () => { M.audio.sfx('tap'); done(); } }, I('check', 28), o.fashion ? 'خلّصت' : 'تمام')));
      /* voice: press and hold the action buttons / tabs to hear them */
      el.querySelectorAll('.dr-act .btn,.dr-tab').forEach(b => M.voice.pressSpeak(b, () => b.getAttribute('aria-label') || '', 'narrator'));
    }
    function setTab(t) {
      if (t === 'color' && tab !== 'color') {   // colour the piece of the tab we came from
        const ps = pieces(), want = { top: 'top', bottom: 'bottom', shoes: 'shoes', head: (draft.head && draft.head.i && draft.head.i !== 'none') || !D.isHijab(who) ? 'head' : 'hijab', acc: draft.acc && draft.acc[0] ? 'acc:' + draft.acc[0].i : 'top' }[tab];
        if (want && ps.some(p => p.key === want)) colT = want; else if (D.isHijab(who) && tab === 'head') colT = 'hijab';
      }
      tab = t; D.markSeen(D.items.filter(it => it.slot === (t === 'head' ? 'head' : t)).map(i => i.id).concat(t === 'head' ? D.items.filter(i => i.slot === 'hijab').map(i => i.id) : [])); render(); if (o.prompt) o.prompt(D.tabPrompts[t === 'head' && D.isHijab(who) ? 'hijab' : t] || ''); }
    function renderList() {
      const list = h('div', { class: 'dr-list scroll x', 'data-list': tab }), cs = cards(); listEl = list;
      cs.forEach(c => {
        if (c.k === 'sep') { list.append(h('div', { class: 'dr-sep' })); return; }
        const it = c.it, on = isOn(c) || (c.k === 'set' && sameSet(c.fit)) || (c.k === 'best' && sameSet(c.fit)), st = it ? D.state(it) : (c.set && !D.setOk(c.set) ? 'gate' : 'own');
        const cv = h('canvas', { width: 200, height: 200 });
        const nm = it ? it.n : c.n;
        let status = null;
        if (on) status = h('div', { class: 'tick' }, I('check', 18)); else if (c.k === 'set') { const cost = D.setCost(who, c.set); status = !D.setOk(c.set) ? h('div', { class: 'lk' }, I('lock', 16, { color: '#7a4a00' }), D.gateText({ unlock: c.set.unlock })) : cost ? h('div', { class: 'pr' }, I('coin', 20), ar(cost)) : null; }
        else if (it && st === 'buy') status = h('div', { class: 'pr' }, I('coin', 20), ar(it.price)); else if (it && st === 'gate') status = h('div', { class: 'lk' }, I('lock', 16, { color: '#7a4a00' }), D.gateText(it) + (it.price ? '' : ''));
        const b = h('button', { class: 'dr-card' + (on ? ' on' : '') + (c.k === 'sig' || c.k === 'none' || c.k === 'noacc' ? ' sig' : ''), 'data-item': it ? it.id : (c.set ? c.set.id : c.k), 'aria-label': nm + (st === 'buy' ? ' (' + ar(it.price) + ' عملة)' : ''), onclick: () => pick(c) },
          it && D.isNew(it) ? h('div', { class: 'nw' }, 'جديد') : null, st !== 'own' && !on ? h('div', { class: 'try' }, 'جرّب') : null, cv, h('div', { class: 'nm' }, nm), h('div', { class: 'st' }, status));
        M.voice.pressSpeak(b, () => nm, 'narrator');
        if (c.pic) { const g = cv.getContext('2d'); g.scale(2, 2); g.translate(50, 50); A.draw(g, c.pic, 0, 0, 80); } else paintPreview(cv, c);
        list.append(b);
      });
      const wrap = h('div', { style: 'position:relative;flex:1;min-height:0;display:flex' }, list, h('button', { class: 'btn round yellow dr-arrow r', 'aria-label': 'يمين', onclick: () => list.scrollBy({ left: 260, behavior: 'smooth' }) }, I('arrow', 26)), h('button', { class: 'btn round yellow dr-arrow l', 'aria-label': 'شمال', onclick: () => list.scrollBy({ left: -260, behavior: 'smooth' }) }, I('back', 26)));
      list.style.flex = '1'; bodyEl.append(wrap);
    }
    const sameSet = f => D.clone(f) && JSON.stringify([draft.top, draft.bottom, draft.shoes, draft.head, draft.hijab, draft.acc]) === JSON.stringify([f.top, f.bottom, f.shoes, f.head, f.hijab, f.acc]);

    /* ----- colour tab ----- */
    function pieces() {   // worn pieces that have colours: [{key, slot, it, val, label}]
      const out = [], add = (slot, v, label) => { const it = v && v.i && byId[v.i]; out.push({ key: slot, slot, v, it, label }); };
      out.push({ key: 'top', slot: 'top', v: draft.top, it: draft.top && draft.top.i ? byId[draft.top.i] : null, label: 'الملابس' });
      const t = draft.top && byId[draft.top.i]; if (!(t && t.full)) out.push({ key: 'bottom', slot: 'bottom', v: draft.bottom, it: draft.bottom && draft.bottom.i ? byId[draft.bottom.i] : null, label: 'البنطلون' });
      out.push({ key: 'shoes', slot: 'shoes', v: draft.shoes, it: draft.shoes && draft.shoes.i ? byId[draft.shoes.i] : null, label: 'الجزمة' });
      if (draft.head && draft.head.i && draft.head.i !== 'none') out.push({ key: 'head', slot: 'head', v: draft.head, it: byId[draft.head.i], label: 'القبعة' });
      if (D.isHijab(who)) out.push({ key: 'hijab', slot: 'hijab', v: draft.hijab, it: draft.hijab && draft.hijab.i ? byId[draft.hijab.i] : null, label: 'الحجاب' });
      (draft.acc || []).forEach((a, i) => { if (byId[a.i] && (byId[a.i].cols || []).length > 1) out.push({ key: 'acc:' + a.i, slot: 'acc', v: a, it: byId[a.i], label: byId[a.i].n }); });
      return out;
    }
    function renderColor() {
      const ps = pieces(); if (!ps.some(p => p.key === colT)) colT = 'top'; const cur = ps.find(p => p.key === colT) || ps[0];
      const box = h('div', { class: 'dr-col' });
      const tg = h('div', { class: 'dr-targets scroll x' });
      ps.forEach(p => { const cv = h('canvas', { width: 96, height: 96 }); const b = h('button', { class: 'dr-tg', 'aria-pressed': p.key === colT ? 'true' : 'false', 'aria-label': p.label, 'data-target': p.key, onclick: () => { colT = p.key; M.audio.sfx('tap'); render(); } }, cv); tg.append(b); M.voice.pressSpeak(b, () => p.label, 'narrator');
        queue.push(() => { try { const crop = p.slot === 'bottom' ? 'lower' : p.slot === 'shoes' ? 'feet' : p.slot === 'top' ? 'upper' : p.slot === 'acc' ? (ACC_CROP[p.it.cat] || 'upper') : 'head'; let f = draft; if ((p.slot === 'top' || p.slot === 'bottom')) f = D.revealFit(who, f); const src = D.preview(who, f, crop, 48), g = cv.getContext('2d'); g.drawImage(src, 0, 0, 96, 96); } catch (e) { } }); });
      if (!qraf) qraf = requestAnimationFrame(pump);
      box.append(tg);
      const it = cur.it, cols = it ? (it.cols || D.colorIds) : (cur.slot === 'hijab' ? D.itemsFor(who, 'hijab')[0].cols : D.colorIds), curC = cur.v && cur.v.c;
      const sw = h('div', { class: 'dr-sw scroll x' }); cols.forEach(cid => { const cc = D.colors[cid]; sw.append(h('button', { class: 'dr-dot', style: 'background:' + cc.c, 'aria-pressed': curC === cid ? 'true' : 'false', 'aria-label': cc.n, 'data-color': cid, onclick: () => { M.voice.speak(cc.n, { speaker: 'narrator', soft: true }); setColor(cur, cid); } })); });
      box.append(sw);
      const pats = it && it.pats && it.pats.length > 1 ? it.pats : null;
      if (pats) { const pr = h('div', { class: 'dr-pats' }); pats.forEach(pid => { const cv = h('canvas', { width: 60, height: 60 }); drawPat(cv, pid, curC ? D.colors[curC].c : (it && D.colors[it.c].c) || '#4aa8e8'); const on = (cur.v && cur.v.p || (it.pats[0] === 'solid' || it.pats[0] === 'long' ? it.pats[0] : 'solid')) === pid || (!(cur.v && cur.v.p) && (pid === 'solid' || pid === 'long'));
        pr.append(h('button', { class: 'dr-pat', 'aria-pressed': on ? 'true' : 'false', 'data-pat': pid, onclick: () => { M.audio.sfx('tap'); setPat(cur, pid); } }, cv, D.pats[pid])); }); box.append(pr); }
      bodyEl.append(box);
    }
    function drawPat(cv, pid, col) {
      const g = cv.getContext('2d'); g.scale(2, 2); g.fillStyle = col; g.fillRect(0, 0, 30, 30); const c2 = D.contrast(col); g.fillStyle = c2; g.strokeStyle = c2;
      if (pid === 'stripes') for (let y = 3; y < 30; y += 8) g.fillRect(0, y, 30, 4); else if (pid === 'dots') for (let y = 6; y < 30; y += 9) for (let x = 5 + (y % 2 ? 4 : 0); x < 30; x += 9) { g.beginPath(); g.arc(x, y, 2, 0, 6.3); g.fill(); }
      else if (pid === 'check') { g.globalAlpha = .45; for (let y = 3; y < 30; y += 9) g.fillRect(0, y, 30, 4); for (let x = 3; x < 30; x += 9) g.fillRect(x, 0, 4, 30); g.globalAlpha = 1; }
      else if (pid === 'stars') for (let y = 7; y < 30; y += 11) for (let x = 6 + (y % 2 ? 5 : 0); x < 30; x += 11) G.star(g, x, y, 3.4, c2, 0); else if (pid === 'hearts') for (let y = 8; y < 30; y += 11) for (let x = 6 + (y % 2 ? 5 : 0); x < 30; x += 11) G.heart(g, x, y, 2.6, c2, 0);
      else if (pid === 'long') { g.fillStyle = D.contrast(col); g.fillRect(8, 2, 14, 26); } else if (pid === 'short') { g.fillStyle = D.contrast(col); g.fillRect(8, 2, 14, 12); }
    }
    function setColor(cur, cid) {
      let nf;
      if (cur.slot === 'acc') nf = Object.assign(D.clone(draft), { acc: (draft.acc || []).map(a => a.i === cur.it.id ? Object.assign({}, a, { c: cid }) : a) });
      else nf = D.withSlot(draft, cur.slot, Object.assign({}, cur.v || {}, { c: cid }));
      apply(nf, { say: 'color', quiet: true });
    }
    function setPat(cur, pid) { const v = Object.assign({}, cur.v || {}); if (pid === 'solid' || pid === 'long') delete v.p; else v.p = pid; apply(D.withSlot(draft, cur.slot, v), { quiet: true }); }

    /* ----- buy / try-on bar ----- */
    function renderBuy() {
      const lk = locked(); if (!lk.length) return document.createDocumentFragment();
      const cost = lk.reduce((t, i) => t + i.price, 0), gated = lk.filter(i => !D.gateOk(i));
      if (!tryShown || tryShown !== lk.map(i => i.id).join()) { tryShown = lk.map(i => i.id).join(); setTimeout(() => speak(gated.length ? L.tryon : L.tryon), 120); }
      return gated.length ? h('div', { class: 'lk', 'data-buy': 'gate', style: 'font-size:15px;padding:4px 8px' }, I('lock', 18, { color: '#7a4a00' }), 'جرّبه بس · ' + D.gateText(gated[0]))
        : h('button', { class: 'btn sm green', 'data-act': 'buy', 'data-buy': '1', style: 'min-height:48px;padding:2px 14px;font-size:19px', 'aria-label': 'اشتري', onclick: () => buyAll() }, I('coin', 24), 'اشتري ' + ar(cost));
    }
    let tryShown = '';
    function buyAll() {
      const lk = locked(), cost = lk.reduce((s, i) => s + i.price, 0);
      if (sd.coins < cost) { M.audio.sfx('wrong'); UI.toast(L.noCoins); return; }
      lk.forEach(i => D.buy(i)); M.audio.sfx('coin'); commit(); UI.flyTo && UI.flyTo('coin', 480, 270, { n: Math.min(8, lk.length * 3) }); stage.burst && stage.burst(stage.heroes[who].x, stage.heroes[who].y - 120, { n: 14, kind: 'star' }); speak(L.bought); render();
      if (o.onChange) o.onChange(who, draft);
    }
    /* ----- actions ----- */
    function pick(c) {
      M.audio.sfx('pop'); let nf;
      if (c.k === 'item') {
        const it = c.it, on = isOn(c);
        if (it.slot === 'acc') nf = D.equip(who, draft, it);
        else if (on) nf = it.slot === 'head' ? D.withSlot(draft, 'head', { i: 'none' }) : D.withSlot(draft, it.slot, null);
        else nf = D.equip(who, draft, it);
      } else if (c.k === 'sig') nf = D.withSlot(draft, c.slot, null);
      else if (c.k === 'none') nf = D.withSlot(draft, 'head', { i: 'none' });
      else if (c.k === 'noacc') nf = Object.assign(D.clone(draft), { acc: [] });
      else if (c.k === 'set' || c.k === 'best') { if (c.set && !D.setOk(c.set)) { /* sticker-gated set: try-on allowed */ } nf = D.clone(c.fit); }
      apply(nf, { say: 'look', fx: c.k === 'set' || c.k === 'best' ? 'spin' : 'poof' });
    }
    async function apply(nf, ao) {
      ao = ao || {}; const id = who; const ok = await D.swap(stage, id, nf, { fx: ao.fx || 'poof' }); if (!ok || closed || id !== who) return;
      draft = nf; D.live[id] = nf; if (!locked().length) commit(); else saved = D.sanitize(draft, saved), D.setSaved(who, saved);   // (try-on items are never saved)
      if (o.onChange) o.onChange(id, nf, ao);
      if (ao.say === 'look') { const t = D.line(id, 'look'); if (stage.bubble) stage.bubble(id, t, 1.8); stage.play && stage.play(id, 'cheer', 1); }
      else if (ao.say === 'color') { if (stage.bubble && (!applyColorT || performance.now() - applyColorT > 2500)) { stage.bubble(id, D.line(id, 'color'), 1.6); applyColorT = performance.now(); } }
      refreshKeep();
    }
    let applyColorT = 0;
    function refreshKeep() { const sx = listEl ? listEl.scrollLeft : 0, tb = tab; render(); if (listEl && tb === tab) listEl.scrollLeft = sx; }
    function randomize() {
      const t0 = D.randomFit(who, { any: false }); let nf = t0; if (Math.random() < .35) { const all = D.randomFit(who, { any: true }); nf = all; }
      apply(nf, { fx: 'spin', say: 'look' }); if (stage.bubble) setTimeout(() => stage.bubble(who, D.line(who, 'random'), 1.8), 700);
    }
    function saveBest() {
      const s = D.sanitize(draft, saved); D.saveBest(who, s); M.audio.sfx('good'); UI.toast(L.saved); stage.burst && stage.burst(stage.heroes[who].x, stage.heroes[who].y - 130, { n: 12, kind: 'heart' }); render();
    }
    function resetLook() {
      const f = { v: 2 }; D.reset(who); apply(f, { fx: 'poof', quiet: true }); UI.toast(L.reset);
    }
    function revert() { D.live[who] = null; delete D.live[who]; D.ver++; }
    function done() { if (o.fashion) { if (o.onDone) o.onDone(draft); return; } close(); }
    function close(silent) {
      if (closed) return; closed = true; queue.length = 0; const f = saved; D.live[who] = f; delete D.live[who]; D.ver++; el.classList.add('out'); setTimeout(() => el.remove(), 260); gen++;
      if (o.onClose) o.onClose(who, silent); if (!silent) { const t = D.line(who, 'ok'); if (t && stage.bubble) stage.bubble(who, t, 1.6); }
    }
    load(who); render(); host.append(el);
    if (o.prompt) o.prompt(D.tabPrompts[tab] || D.lines.pick);
    return {
      el, close, tab: setTab, refresh: render, get who() { return who; }, get draft() { return draft; },
      setHero(id) { if (id === who || closed) return; const old = who; delete D.live[old]; D.ver++; load(id); render(); },
      get closed() { return closed; }
    };
  };

  /* ------------------------------------------------------------------ the room door: choose who dresses (boys' door / girls' door) */
  D.roomName = id => D.gender(id) === 'f' ? 'room_girls' : 'room_boys';
  D.door = function (f) {
    const sd = M.save.data, pl = C.playable(), groups = [['m', 'غرفة الأولاد', 'm'], ['f', 'غرفة البنات', 'f']].map(g => ({ g: g[0], title: g[1], ids: pl.filter(id => D.gender(id) === g[0]) })).filter(g => g.ids.length);
    const wrap = h('div', { class: 'dr-door' });
    groups.forEach(gr => {
      wrap.append(h('div', { class: 'dr-room ' + gr.g, 'data-room': gr.g }, h('h3', null, A.el('dr_set', 44), gr.title),
        h('div', { class: 'dr-heroes' }, gr.ids.map(id => h('button', { class: 'dr-hero', 'data-who': id, 'aria-label': 'يلبس ' + (sd.names[id] || C.defs[id].name), onclick: () => { M.audio.sfx('pop'); sd.hero = id; M.save.commit(); M.flow.toRoom(id); } }, UI.avatar(id, 112, { cls: 'av', size: true, still: true }), sd.names[id] || C.defs[id].name)))));
    });
    const el = h('div', null, h('div', { class: 'hdr' }, h('h2', null, 'غرفتي'), f && f.back ? h('button', { class: 'btn round yellow', 'aria-label': 'رجوع', onclick: () => { M.audio.sfx('tap'); f.back(); } }, I('back', 34)) : null), wrap);
    UI.show(el, 'clear', 2); M.backdrop.mode = 'map';
    setTimeout(() => speak(L.door), 300);
  };
  UI.closet = D.door;   // the old "تغيير الشكل" map button now opens the rooms
  /* map tile info (ui.js worldMap asks for it): label / colour follow the chosen hero's room */
  D.tile = function () { const g = D.gender(M.save.data.hero || 'moody'); return { label: 'غرفتي', icon: 'hanger', col: g === 'f' ? ['#e8559a', '#ff9cc8', '#b02f70'] : ['#2f7de0', '#7fb6ff', '#1a56a8'] }; };
  /* UI.hasJpg: a hero wearing a non-signature outfit gets the drawn portrait (the cartoon jpg cannot change clothes) */
  const hj = UI.hasJpg; UI.hasJpg = id => hj(id) && !D.isCustom(id);
})();
