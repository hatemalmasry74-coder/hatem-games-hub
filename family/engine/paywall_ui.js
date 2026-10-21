/* Family Adventures - engine/paywall_ui.js : PARENT-FACING subscription screen (text only, Arabic RTL) + parental gate + lock styling.
   Moody.paywall.open({world, mission})   parental gate -> subscription sheet (plans from the store, restore, terms/privacy, cancel info)
   Moody.paywall.manage()                 parental gate -> the store subscription page (external)
   Moody.paywall.gate()                   Promise<boolean>: the parental gate alone (also used before any external link)
   Moody.paywall.isOpen()
   Strings live in Moody.strings.pay.ar (i18n-ready: add Moody.strings.pay.en and set Moody.config.lang = 'en').
   No countdowns, no fake scarcity, no pre-selected "best deal", the "later" button is as visible as "subscribe", no ads, no analytics. The only spoken line is
   "اطلب من ماما أو بابا" (added to Moody.voice.fixedStrings so tools/collect_voice.js records it). */
(function () {
  'use strict';
  const M = window.Moody, C = M.config, E = M.ent, B = M.billing, UI = M.ui, h = UI.h, ar = M.util.ar;

  /* ---------------- strings ---------------- */
  M.strings = M.strings || {}; M.strings.pay = M.strings.pay || {};
  M.strings.pay.ar = Object.assign({
    gate_title: 'للكبار فقط', gate_say: 'اطلب من ماما أو بابا', gate_hold: 'اضغط باستمرار ٣ ثواني', gate_hold_go: 'كمّل الضغط…', gate_solve: 'حُلّ المسألة عشان تكمل', gate_wrong: 'الإجابة مش صحيحة. دي مسألة جديدة', gate_wait: 'جرّب تاني بعد {s} ثانية', gate_ok: 'تأكيد', gate_clear: 'مسح', back: 'رجوع',
    title: 'اشتراك مغامرات العيلة', lead: 'للأهل: اشتراك واحد يفتح كل مهام اللعبة لأولادكم',
    b1: 'كل المهام في كل المغامرات', b2: 'مغامرات جديدة بتتضاف وتتفتح تلقائيًا', b3: 'من غير إعلانات خالص', b4: 'من غير جمع أي بيانات عن الأطفال',
    free_note: 'مهمة مجانية في كل مغامرة، وغرفة الملابس ومكالمة بابا مجانيين دايمًا.',
    plan_monthly: 'شهري', plan_yearly: 'سنوي', per_month: 'كل شهر', per_year: 'كل سنة', price_wait: 'السعر بيظهر لما تتصل بالإنترنت', loading: 'بنجيب الأسعار من the store…',
    trial_days: 'تجربة مجانية {n} أيام', trial_day: 'تجربة مجانية يوم واحد', save_pct: 'أرخص حوالي {p}٪ من الشهري', intro: 'عرض البداية: {p}',
    subscribe: 'اشترك', restore: 'استرجاع المشتريات', manage_sub: 'إدارة الاشتراك', terms: 'شروط الاستخدام', privacy: 'سياسة الخصوصية', later: 'لاحقًا', retry: 'إعادة المحاولة',
    renew_note: 'الاشتراك بيتجدد تلقائيًا في آخر كل فترة لحد ما تلغيه. تقدر تلغيه في أي وقت من إعدادات the store ← الاشتراكات، ومفيش رسوم للإلغاء. الدفع من حساب the store بتاعك.',
    buying: 'بنتواصل مع the store…', pending_msg: 'الدفع لسه قيد المعالجة. المهام هتتفتح لوحدها أول ما يتأكد.', fail_msg: 'ما قدرناش نكمّل الشراء ومحدش اتخصم منه حاجة. جرّب تاني.', cancel_msg: 'تمام، مفيش اشتراك اتعمل.',
    verify_fail: 'مش قادرين نتأكد من الدفع دلوقتي. جرّب «استرجاع المشتريات» بعد شوية.', restore_ok: 'تم استرجاع اشتراكك. كل المهام اتفتحت.', restore_none: 'ما لقيناش اشتراك على حساب the store ده.', restore_fail: 'ما قدرناش نوصل لـ the store. جرّب لما تكون متصل بالإنترنت.',
    unavailable: 'الشراء مش متاح على الجهاز ده دلوقتي.', active_now: 'اشتراكك شغّال', active_until: 'اشتراكك شغّال لحد {d}',
    unlocked_title: 'تم تفعيل الاشتراك!', unlocked_sub: 'كل المهام اتفتحت', play_now: 'يلا نلعب', locked_for: 'المهمة دي مع الاشتراك',
    open_full: 'فتح الصفحة الكاملة', terms_t: 'شروط الاستخدام', privacy_t: 'سياسة الخصوصية',
    terms_body: ['الاشتراك بيفتح كل مهام «مغامرات العيلة» طول فترة الاشتراك، والمهام المجانية فضلت مجانية.', 'الدفع والتجديد التلقائي والإلغاء كلها بتتم عن طريق the store وبتخضع لشروطه. تقدر تلغي في أي وقت من إعدادات the store ← الاشتراكات.', 'لو استرديت الدفع أو الاشتراك انتهى، المهام المدفوعة بترجع مقفولة وكل تقدّمك بيفضل محفوظ.', 'اللعبة بتتحدّث، وممكن تتضاف مغامرات جديدة داخل نفس الاشتراك.'],
    privacy_body: ['اللعبة موجّهة للأطفال بإشراف الأهل، وما بنجمعش أي بيانات شخصية عن الأطفال.', 'الأسماء والتقدّم والنجوم بتتخزن على جهازك بس، ومابتتبعتش لأي مكان.', 'مفيش إعلانات ولا أدوات تتبّع ولا تحليلات.', 'الشراء بيتم عن طريق the store، وبيانات الدفع بتتعامل معاها the store مش إحنا.'],
    privacy_verify: 'للتأكد إن الاشتراك سليم، رمز الشراء (من غير أي معلومة عن الطفل) بيتبعت لخادم التحقق الخاص بالتطبيق بس.',
    toast_active: 'تم تفعيل الاشتراك. كل المهام اتفتحت', free_word: 'مجانية', with_sub: 'مع الاشتراك',
    par_title: 'الاشتراك', par_none: 'مش مشترك: مهمة مجانية في كل مغامرة', par_active: 'مشترك: كل المهام مفتوحة', par_active_until: 'مشترك لحد {d}', par_grace: 'فيه مشكلة في الدفع: حدّث طريقة الدفع في the store', par_pending: 'الدفع قيد المعالجة', par_expired: 'الاشتراك انتهى', subscribe_btn: 'الاشتراك',
    par_note: 'الاشتراك والإلغاء بيتم من the store. اللعبة مابتجمعش أي بيانات عن الأطفال.'
  }, M.strings.pay.ar || {});
  const T = E.t;
  try { M.voice.fixedStrings.push([T('gate_say'), 'narrator']); } catch (e) { }

  /* ---------------- styles (tokens + .btn from ui.css; nothing else is needed) ---------------- */
  const css = `
  .mcard.paywall{background:linear-gradient(#fff6d6,#ffe39c);cursor:pointer}
  .mcard.paywall .num{background:#a5abc0;border-color:#7a8199;box-shadow:0 3px 0 #636a82}
  .mcard.paywall h4{opacity:.85}
  .pw-lock{display:flex;align-items:center;gap:4px;font:900 20px var(--font);color:#8a5200;background:rgba(255,255,255,.7);border:2px solid #e0a82a;border-radius:var(--r-pill);padding:0 12px 0 8px;min-height:38px}
  .card .pw-chip{display:none}
  .pw-modal{z-index:60}
  .pw-modal .pw-panel{width:880px;max-width:900px;max-height:512px;overflow:auto;padding:10px 24px 10px;text-align:right;position:relative;-webkit-overflow-scrolling:touch}
  .pw-modal .pw-panel.slim{width:640px;text-align:center}
  .pw-head{display:flex;align-items:center;gap:14px;margin:-4px 0 0}
  .pw-head h3{margin:0;font-size:32px;line-height:1.15;font-weight:900;color:var(--ink)}
  .pw-badge{width:56px;height:56px;border-radius:50%;background:linear-gradient(#ffe27a,#ffb21f);border:3px solid var(--line);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 0 #a8680a;flex:none;--ic:#7a4a00;--ics:transparent}
  .pw-lead{font-size:20px;font-weight:800;color:var(--ink2);margin:0 0 4px;line-height:1.35}
  .pw-cols{display:flex;flex-direction:column;gap:6px}
  .pw-plans{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:4px}
  .pw-plans.one{grid-template-columns:1fr}
  .pw-col{flex:1;min-width:0}
  .pw-ben{list-style:none;margin:0 0 2px;padding:0;display:grid;grid-template-columns:1fr 1fr;column-gap:18px}
  .pw-ben li{display:flex;align-items:center;gap:8px;font-size:21px;font-weight:900;margin:4px 0;color:var(--ink);--ic:#2fae4e;--ics:transparent}
  .pw-note{font-size:17px;font-weight:800;color:var(--ink2);line-height:1.45;margin:8px 0}
  .pw-fine{font-size:15px;font-weight:700;color:var(--ink2);line-height:1.35;margin:2px 0 0;opacity:.95}
  .pw-plan{display:flex;flex-direction:column;gap:2px;padding:6px 14px 8px;margin:0;border:3px solid var(--line);border-radius:var(--r-m);background:linear-gradient(#fff,#fff3d6);box-shadow:0 4px 0 rgba(58,32,19,.22)}
  .pw-plan .top{display:flex;justify-content:space-between;align-items:baseline;gap:8px}
  .pw-plan .nm{font-size:23px;font-weight:900}
  .pw-plan .pr{font-size:26px;font-weight:900;color:#1a6fd0;direction:rtl}
  .pw-plan .pr small{font-size:19px;color:var(--ink2);font-weight:800}
  .pw-plan .ex{font-size:17px;font-weight:800;color:#1a8a46;line-height:1.3}
  .pw-plan .btn{margin-top:2px;align-self:stretch;min-width:0;min-height:max(52px,var(--tap));font-size:22px;padding-top:0;padding-bottom:0}
  .pw-msg{min-height:22px;font-size:19px;font-weight:900;color:#a8330f;margin:0;text-align:center}
  .pw-msg.ok{color:#17803d}
  .pw-links{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:6px}
  .pw-links .btn{min-width:0}
  .pw-gate{display:flex;gap:26px;align-items:center;justify-content:center}
  .pw-q{font-size:54px;font-weight:900;direction:ltr;unicode-bidi:isolate;letter-spacing:2px;color:var(--ink);margin:6px 0 10px;text-align:center}
  .pw-disp{min-height:62px;min-width:200px;font-size:44px;font-weight:900;text-align:center;direction:ltr;border:3px solid var(--line);border-radius:var(--r-m);background:#fff;padding:0 18px;display:flex;align-items:center;justify-content:center}
  .pw-pad{display:grid;grid-template-columns:repeat(3,92px);gap:8px;direction:ltr}
  .pw-pad .btn{min-width:0;padding:0;font-size:30px;min-height:max(58px,var(--tap))}
  .pw-hold{position:relative;width:190px;height:190px;border-radius:50%;border:6px solid var(--line);background:radial-gradient(circle at 50% 35%,#ffe9a0,#ffb21f);box-shadow:0 8px 0 #a8680a,0 14px 20px rgba(20,10,40,.3);font:900 24px/1.2 var(--font);color:#5a3500;cursor:pointer;touch-action:none;-webkit-user-select:none;user-select:none;display:flex;align-items:center;justify-content:center;text-align:center;padding:14px}
  .pw-hold svg.pw-ring{position:absolute;inset:-6px;width:calc(100% + 12px);height:calc(100% + 12px);transform:rotate(-90deg);pointer-events:none}
  .pw-hold:focus-visible{outline:4px solid #fff;outline-offset:3px}
  .pw-open{display:flex;flex-direction:column;align-items:center;gap:6px;padding-top:26px}
  .pw-open .btn{align-self:center;min-width:300px}
  .pw-open .bigt{font-size:46px;font-weight:900;color:#17803d}
  .pw-open svg{width:120px;height:120px;overflow:visible}
  .pw-open .sh{transform-origin:76% 50%;animation:pwUnlock 1s .35s var(--spring) both}
  @keyframes pwUnlock{0%{transform:translateY(0) rotate(0)}100%{transform:translateY(-15px) rotate(-38deg)}}
  .pw-open .pop{animation:popin .6s var(--spring) both}
  .pw-text p{font-size:22px;font-weight:800;line-height:1.55;margin:8px 0;color:var(--ink)}
  .pw-parent .pw-st.ok{background:linear-gradient(#dcffe6,#aef0c2)}.pw-parent .pw-st.warn{background:linear-gradient(#fff0c9,#ffd36e)}
  @media (prefers-reduced-motion:reduce){.pw-open .sh{animation:none;transform:translateY(-15px) rotate(-38deg)}}
  `;
  const st = document.createElement('style'); st.id = 'pw-style'; st.textContent = css; document.head.appendChild(st);

  /* ---------------- overlay plumbing ---------------- */
  let cur = null;           // { el, close }
  const P = M.paywall = { isOpen: () => !!cur };
  function overlay(panelCls, label, stack) {
    const prev = cur; if (prev && !stack) prev.close(true);
    const panel = h('div', { class: 'panel pw-panel ' + (panelCls || '') });
    const el = h('div', { class: 'modal pw-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': label || T('title'), dir: 'rtl' }, panel);
    UI.over.append(el);
    const kh = e => { if (e.key === 'Escape') { o.close(); return true; } return false; };
    M.keys.unshift(kh);
    const o = cur = { el, panel, onclose: null, oncleanup: null, prev: stack ? prev : null, timers: [], close(silent) { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); o.timers.forEach(clearTimeout); el.remove(); if (cur === o) cur = o.prev || null; if (o.oncleanup) { const f = o.oncleanup; o.oncleanup = null; f(); } if (!silent && o.onclose) o.onclose(); } };
    return o;
  }
  const btn = (label, cls, fn, icon, attrs) => { const b = UI.btn(label, cls, fn, icon); if (attrs) Object.keys(attrs).forEach(k => b.setAttribute(k, attrs[k])); return b; };

  /* ---------------- PARENTAL GATE ----------------
     Step 1: press-and-hold a big button for 3 s (a quick tap does nothing).  Step 2: an adult-level arithmetic problem (a x b + c with a in 12..19, b in 3..9, c in 11..39)
     answered on a keypad (a 9-year-old does not know 17 x 6 by heart; random keypad tapping hits a 2-3 digit number with p < 1/500).
     3 wrong answers -> cool-down 30 s, doubling each time (kept for the app session). A passed gate is valid for 5 minutes. */
  let okUntil = 0, fails = 0, lockUntil = 0, lockouts = 0;
  const HOLD_MS = 3000;
  P.gate = function () {
    return new Promise(resolve => {
      if (Date.now() < okUntil) { resolve(true); return; }
      const o = overlay('slim', T('gate_title'), true); let done = false;
      const fin = v => { if (done) return; done = true; if (v) okUntil = Date.now() + 5 * 60000; o.close(true); resolve(v); };
      o.onclose = () => fin(false);
      holdStep();
      function head(sub) {
        return [h('div', { class: 'pw-head', style: 'justify-content:center' }, h('div', { class: 'pw-badge' }, UI.i('lock', 40)), h('h3', { style: 'flex:none' }, T('gate_title'))), h('div', { class: 'pw-lead', style: 'text-align:center' }, sub)];
      }
      function holdStep() {
        const NS = 'http://www.w3.org/2000/svg', R = 92, CIRC = 2 * Math.PI * R;
        const ring = document.createElementNS(NS, 'svg'); ring.setAttribute('class', 'pw-ring'); ring.setAttribute('viewBox', '0 0 200 200');
        ring.innerHTML = '<circle cx="100" cy="100" r="' + R + '" fill="none" stroke="#2fae4e" stroke-width="10" stroke-linecap="round" stroke-dasharray="0 ' + CIRC.toFixed(1) + '"/>';
        const arc = ring.firstChild, lab = h('span', null, T('gate_hold'));
        const hb = h('button', { class: 'pw-hold', 'data-gate': 'hold', 'aria-label': T('gate_hold') }, ring, lab);
        let t0 = 0, raf = 0;
        const tick = () => { const k = Math.min(1, (performance.now() - t0) / HOLD_MS); arc.setAttribute('stroke-dasharray', (CIRC * k).toFixed(1) + ' ' + CIRC.toFixed(1)); if (k >= 1) { raf = 0; t0 = 0; solveStep(); } else raf = requestAnimationFrame(tick); };
        const start = e => { if (t0 || done) return; if (e && e.preventDefault) e.preventDefault(); t0 = performance.now(); lab.textContent = T('gate_hold_go'); raf = requestAnimationFrame(tick); };
        const stop = () => { if (!t0) return; t0 = 0; if (raf) cancelAnimationFrame(raf); raf = 0; arc.setAttribute('stroke-dasharray', '0 ' + CIRC.toFixed(1)); lab.textContent = T('gate_hold'); };
        hb.addEventListener('pointerdown', start); ['pointerup', 'pointercancel', 'pointerleave'].forEach(n => hb.addEventListener(n, stop)); hb.addEventListener('contextmenu', e => e.preventDefault());
        hb.addEventListener('keydown', e => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { start(e); } }); hb.addEventListener('keyup', e => { if (e.key === ' ' || e.key === 'Enter') stop(); });
        o.panel.textContent = ''; o.panel.append(...head(T('gate_say')), h('div', { style: 'display:flex;justify-content:center;margin:10px 0 14px' }, hb), h('div', { class: 'row' }, btn(T('back'), 'gray sm', () => fin(false), 'back', { 'data-gate': 'back' })));
      }
      function solveStep(msg) {
        const a = M.util.rndi(12, 19), b = M.util.rndi(3, 9), c = M.util.rndi(11, 39), ans = String(a * b + c); let typed = '';
        const q = h('div', { class: 'pw-q', 'data-gate': 'q' }, ar(a) + ' × ' + ar(b) + ' + ' + ar(c) + ' = ؟');
        const disp = h('div', { class: 'pw-disp', 'data-gate': 'disp', 'aria-live': 'polite' }), info = h('div', { class: 'pw-msg', 'data-gate': 'msg' }, msg || '');
        const show = () => { disp.textContent = typed ? ar(typed) : ' '; };
        const press = d => { if (Date.now() < lockUntil) return; if (typed.length < 3) typed += d; show(); };
        const pad = h('div', { class: 'pw-pad' });
        ['1', '2', '3', '4', '5', '6', '7', '8', '9'].forEach(d => pad.append(btn(ar(d), 'gray', () => press(d), null, { 'data-key': d })));
        pad.append(btn('', 'gray', () => { typed = typed.slice(0, -1); show(); }, 'x', { 'data-key': 'del', 'aria-label': T('gate_clear') }), btn(ar('0'), 'gray', () => press('0'), null, { 'data-key': '0' }),
          btn('', 'green', () => submit(), 'check', { 'data-key': 'ok', 'aria-label': T('gate_ok') }));
        function waitTxt() { const s = Math.ceil((lockUntil - Date.now()) / 1000); return T('gate_wait', { s: ar(s) }); }
        function submit() {
          if (Date.now() < lockUntil) { info.textContent = waitTxt(); return; }
          if (!typed) return;
          if (typed === ans) { fin(true); return; }
          fails++; typed = ''; show();
          if (fails >= 3) { fails = 0; lockouts++; lockUntil = Date.now() + Math.min(300, 30 * Math.pow(2, lockouts - 1)) * 1000; tickLock(); } else { info.textContent = T('gate_wrong'); setTimeout(() => { if (!done) solveStep(T('gate_wrong')); }, 700); }
        }
        function tickLock() { if (done) return; if (Date.now() >= lockUntil) { solveStep(); return; } info.textContent = waitTxt(); o.timers.push(setTimeout(tickLock, 500)); }
        const kh = e => { if (/^[0-9]$/.test(e.key)) press(e.key); else if (e.key === 'Backspace') { typed = typed.slice(0, -1); show(); } else if (e.key === 'Enter') submit(); else return; e.stopPropagation(); };
        o.panel.onkeydown = kh; o.panel.tabIndex = -1;
        o.panel.textContent = '';
        o.panel.append(...head(T('gate_solve')), h('div', { class: 'pw-gate' }, h('div', { style: 'flex:1;min-width:0' }, q, disp, info), pad), h('div', { class: 'row', style: 'margin-top:8px' }, btn(T('back'), 'gray sm', () => fin(false), 'back', { 'data-gate': 'back' })));
        if (Date.now() < lockUntil) tickLock();
        try { o.panel.focus({ preventScroll: true }); } catch (e) { }
      }
    });
  };

  /* ---------------- external links ---------------- */
  P.openExternal = function (url) {
    P.lastExternal = url;
    try { if (typeof C.openExternal === 'function') { C.openExternal(url); return; } } catch (e) { }
    try { window.open(url, '_blank', 'noopener'); } catch (e) { }
  };
  P.manage = async function () {
    if (!(await P.gate())) return; const s = E.status();
    P.openExternal(B.manageUrl(s.sku || (C.productIds && C.productIds.monthly)));
  };

  /* ---------------- terms / privacy (in-app text; the full page opens externally, after the gate) ---------------- */
  function textView(kind, back) {
    const o = overlay('', T(kind + '_t')), url = kind === 'terms' ? C.termsUrl : C.privacyUrl, body = T(kind + '_body'), arr = Array.isArray(body) ? body.slice() : [body];
    if (kind === 'privacy' && C.verifyUrl) arr.push(T('privacy_verify'));
    o.panel.append(h('div', { class: 'pw-head' }, h('h3', null, T(kind + '_t'))), h('div', { class: 'pw-text', 'data-text': kind }, arr.map(p => h('p', null, p))),
      h('div', { class: 'row', style: 'margin-top:8px' }, url ? btn(T('open_full'), 'blue sm', async () => { if (await P.gate()) P.openExternal(url); else textView(kind, back); }, null, { 'data-act': 'full' }) : null, btn(T('back'), 'gray sm', () => back(), 'back')));
    o.onclose = () => back();
  }

  /* ---------------- subscription sheet ---------------- */
  const periodDays = p => B.periodDays(p);
  function trialText(p) { if (!p || !p.trial) return ''; const d = periodDays(p.trial.period); if (!d) return ''; return d === 1 ? T('trial_day') : T('trial_days', { n: ar(d) }); }
  P.open = async function (opts) {
    opts = opts || {}; if (!E.active || cur) return;
    try { M.voice.speak(T('gate_say'), { speaker: 'narrator' }); } catch (e) { }
    if (!(await P.gate())) return;
    sheet(opts);
  };
  function sheet(opts) {
    const o = overlay('', T('title')); let products = null, loadErr = false, busy = false, msg = '', msgOk = false, finished = false, off = null;
    o.oncleanup = () => { if (off) off(); }; o.onclose = () => { if (opts.onClose) opts.onClose(); };
    const startPrem = E.isPremium();
    function render() {
      if (finished) return; const s = E.status(); o.panel.textContent = '';
      const benefits = h('ul', { class: 'pw-ben' }, ['b1', 'b2', 'b3', 'b4'].map(k => h('li', null, UI.i('check', 28), T(k))));
      const plans = h('div', { class: 'pw-plans' });
      let status = null;
      if (s.premium) {
        plans.classList.add('one');
        plans.append(h('div', { class: 'pw-plan' }, h('div', { class: 'nm' }, s.expiry ? T('active_until', { d: E.fmtDate(s.expiry) }) : T('active_now')), btn(T('manage_sub'), 'blue', () => P.manage(), 'settings', { 'data-act': 'manage' })));
      } else if (B.name === 'none') {
        plans.classList.add('one'); plans.append(h('div', { class: 'pw-msg', 'data-state': 'unavailable' }, T('unavailable')));
      } else {
        if (products == null) status = h('div', { class: 'pw-note', 'data-state': loadErr ? 'offline' : 'loading' }, loadErr ? T('price_wait') : T('loading'));
        const by = {}; (products || []).forEach(p => { if (p.plan) by[p.plan] = p; });
        let pct = 0; if (by.monthly && by.yearly && by.monthly.priceMicros && by.yearly.priceMicros && by.monthly.currency === by.yearly.currency) pct = Math.round(100 * (1 - by.yearly.priceMicros / (by.monthly.priceMicros * 12)));
        ['monthly', 'yearly'].forEach(plan => {
          const p = by[plan], ex = [];
          if (p) { const tt = trialText(p); if (tt) ex.push(tt); if (p.intro && p.intro.price) ex.push(T('intro', { p: p.intro.price })); if (plan === 'yearly' && pct >= 5) ex.push(T('save_pct', { p: ar(pct) })); }
          plans.append(h('div', { class: 'pw-plan', 'data-plan': plan },
            h('div', { class: 'top' }, h('div', { class: 'nm' }, T('plan_' + plan)), h('div', { class: 'pr' }, p ? [p.price, ' ', h('small', null, T(plan === 'monthly' ? 'per_month' : 'per_year'))] : '—')),
            ex.map(x => h('div', { class: 'ex' }, x)),
            (() => { const b = btn(T('subscribe'), 'green', () => buy(plan), 'play', { 'data-act': 'buy', 'data-plan': plan }); if (!p || busy) b.disabled = true; return b; })()));
        });
        if (loadErr) status = h('div', { class: 'row', style: 'gap:10px' }, h('div', { class: 'pw-note', 'data-state': 'offline' }, T('price_wait')), btn(T('retry'), 'gray sm', () => { load(); }, 'replay', { 'data-act': 'retry' }));
      }
      const msgEl = h('div', { class: 'pw-msg' + (msgOk ? ' ok' : ''), 'data-msg': '1', role: 'status', 'aria-live': 'polite' }, busy ? T('buying') : msg);
      const links = h('div', { class: 'pw-links' }, btn(T('restore'), 'yellow sm', restore, 'replay', { 'data-act': 'restore' }), btn(T('terms'), 'gray sm', () => textView('terms', () => sheet(opts)), null, { 'data-act': 'terms' }), btn(T('privacy'), 'gray sm', () => textView('privacy', () => sheet(opts)), null, { 'data-act': 'privacy' }), btn(T('later'), 'gray sm', () => o.close(), null, { 'data-act': 'later' }));
      o.panel.append(h('div', { class: 'pw-head' }, h('div', { class: 'pw-badge' }, UI.i('star', 40)), h('div', { style: 'flex:1' }, h('h3', null, T('title')), h('div', { class: 'pw-lead' }, T('lead')))), h('div', { class: 'pw-cols' }, benefits, h('div', { class: 'pw-note', style: 'margin:0 0 2px' }, T('free_note')), status, plans), msgEl, h('div', { class: 'pw-fine', 'data-fine': '1' }, T('renew_note')), links);
    }
    async function load() { loadErr = false; products = null; render(); try { products = await B.getProducts(); } catch (e) { loadErr = true; products = null; } render(); }
    async function buy(plan) {
      if (busy) return; busy = true; msg = ''; render();
      let r; try { r = await E.purchase(plan); } catch (e) { r = { result: 'failure' }; }
      busy = false; msgOk = false;
      if (r.result === 'success') { celebrate(); return; }
      msg = r.result === 'pending' ? T('pending_msg') : r.result === 'cancel' ? T('cancel_msg') : r.result === 'verify_failed' ? T('verify_fail') : T('fail_msg'); msgOk = r.result === 'pending' || r.result === 'cancel';
      render();
    }
    async function restore() {
      if (busy) return; busy = true; msg = ''; render(); const r = await E.restore(); busy = false;
      if (r.ok && r.premium) { celebrate(true); return; }
      msgOk = false; msg = r.ok ? T('restore_none') : T('restore_fail'); render();
    }
    function celebrate(restored) {
      if (finished) return; finished = true; o.panel.textContent = ''; o.panel.classList.add('slim');
      const lock = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lock.setAttribute('viewBox', '0 0 48 48');
      lock.innerHTML = '<g class="sh"><path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#c88a10" stroke-width="5" stroke-linecap="round"/></g><rect x="9" y="21" width="30" height="21" rx="6" fill="#ffc93c" stroke="#4a2e1c" stroke-width="3"/><circle cx="24" cy="31" r="3.4" fill="#7a4a00"/>';
      o.panel.append(h('div', { class: 'pw-open', 'data-state': 'unlocked' }, lock, h('div', { class: 'bigt pop' }, T('unlocked_title')), h('div', { class: 'pw-lead', style: 'text-align:center' }, T('unlocked_sub')), btn(T('play_now'), 'green big', () => o.close(), 'play', { 'data-act': 'playnow' })));
      try { M.audio.sfx('fanfare'); M.audio.cheer('big'); M.backdrop.confetti(); UI.sparks(480, 250, { n: 16, r: 150 }); let n = 0; const iv = setInterval(() => { if (++n > 5 || !o.el.isConnected) clearInterval(iv); else M.backdrop.confetti(); }, 800); } catch (e) { }
    }
    off = E.on(st => { if (finished) return; if (st.premium && !startPrem && !busy) { /* pending payment resolved (or restored) while the sheet is open */ celebrate(); } else if (!busy) render(); });
    render(); load();
    o.el.setAttribute('data-paywall', 'sheet');
  }
})();
