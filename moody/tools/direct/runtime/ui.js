/* engine/direct_ui.js : screens of the DIRECT edition (loaded after paywall_ui.js). Replaces the store sheet by the CODE sheet:
   "first mission of every adventure is free; to continue enter the code"; button «اطلب كودك» opens the owner's contact link (Moody.config.contactUrl);
   parents' corner section with the days left + the same buttons. The parental gate of paywall_ui.js is kept in front of the sheet (kids tap locked missions). */
(function () {
  'use strict';
  const M = window.Moody, C = M.config, E = M.ent, B = M.billing, UI = M.ui, P = M.paywall, h = UI.h, ar = M.util.ar;
  if (!E.active) return;
  const S = M.strings.pay;
  Object.assign(S.ar, {
    title: 'النسخة الكاملة', lead: 'أول مهمة في كل مغامرة مجانية. عشان تكمّل باقي المهام اكتب كود التفعيل اللي بعتهولك.',
    free_note: 'غرفة الملابس ومكالمة بابا مجانيين دايمًا، وتقدّمكم محفوظ في كل الأحوال.',
    code_ph: 'اكتب الكود  FM-XXXX-XXXX-XXXX', code_go: 'تفعيل', ask_code: 'اطلب كودك', later: 'لاحقًا', play_now: 'يلا نلعب',
    code_empty: 'اكتب الكود الأول', code_bad: 'الكود مش صحيح. راجع الحروف والأرقام وجرّب تاني.', code_used: 'الكود ده اتستخدم قبل كده على الجهاز ده. اطلب كود جديد.', code_wait: 'محاولات كتير غلط. جرّب بعد {s} ثانية.',
    code_ok: 'تم التفعيل! أضفنا {n} يوم.', verifying: 'بنتأكد…', no_contact: 'رابط التواصل لسه مش متظبط في النسخة دي.',
    active_now: 'كل المهام مفتوحة', active_until: 'كل المهام مفتوحة لحد {d}', days_left: 'باقي {n} يوم', renew_hint: 'لو عندك كود جديد اكتبه هنا: المدة بتتضاف فوق الباقي.',
    expired_hint: 'مدة الكود خلصت: المهام الأولى بس مفتوحة، وكل تقدّمكم محفوظ. اكتب كود جديد وكمّلوا من مكانكم.',
    unlocked_title: 'تم تفعيل الكود!', unlocked_sub: 'كل المهام اتفتحت', toast_active: 'تم تفعيل الكود. كل المهام اتفتحت', with_sub: 'بالكود', locked_for: 'المهمة دي بالكود',
    par_title: 'الكود والتفعيل', par_none: 'مجاني: أول مهمة في كل مغامرة', par_active: 'كل المهام مفتوحة', par_active_until: 'كل المهام مفتوحة لحد {d}', par_grace: 'كل المهام مفتوحة', par_pending: '', par_expired: 'مدة الكود خلصت: المهام الأولى بس مفتوحة',
    subscribe_btn: 'أدخل الكود', renew_btn: 'تجديد / إضافة كود',
    par_note: 'الكود بيتحفظ على الجهاز ده بس. اللعبة مابتجمعش أي بيانات عن الأطفال ومفيهاش إعلانات.', par_privacy: 'الأسماء والتقدّم بيتخزنوا على الجهاز ده بس ومابيتبعتوش لأي مكان.'
  });
  const T = E.t, codes = () => B.providers.codes;

  /* ---------------- contact link ---------------- */
  function contactHref() {
    let u = String(C.contactUrl || '').trim(); if (!u) return '';
    const msg = C.contactMessage || '';
    if (/^https:\/\/wa\.me\//i.test(u) && u.indexOf('?') < 0 && msg) u += '?text=' + encodeURIComponent(msg);
    else if (/^mailto:/i.test(u) && u.indexOf('?') < 0 && msg) u += '?subject=' + encodeURIComponent(C.appTitle || '') + '&body=' + encodeURIComponent(msg);
    return u;
  }
  P.contactHref = contactHref;
  P.contact = function (say) { const u = contactHref(); if (!u) { if (say) say(T('no_contact')); return false; } P.openExternal(u); return true; };

  /* ---------------- overlay ---------------- */
  let cur = null; const origOpen = P.isOpen; P.isOpen = () => !!cur || origOpen();
  function overlay() {
    if (cur) cur.close(true);
    const panel = h('div', { class: 'panel pw-panel' }), el = h('div', { class: 'modal pw-modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': T('title'), dir: 'rtl', 'data-paywall': 'sheet' }, panel);
    UI.over.append(el);
    const kh = e => { if (e.key === 'Escape') { o.close(); return true; } return false; }; M.keys.unshift(kh);
    const o = cur = { el, panel, close() { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); el.remove(); if (cur === o) cur = null; if (o.cleanup) o.cleanup(); } };
    return o;
  }
  const btn = (label, cls, fn, icon, attrs) => { const b = UI.btn(label, cls, fn, icon); if (attrs) Object.keys(attrs).forEach(k => b.setAttribute(k, attrs[k])); return b; };
  const dateOf = ms => E.fmtDate(ms);

  P.open = async function (opts) {
    if (cur || origOpen()) return;
    try { M.voice.speak(T('gate_say'), { speaker: 'narrator' }); } catch (e) { }
    if (!(await P.gate())) return;
    sheet(opts || {});
  };
  P.manage = P.open;

  function sheet() {
    const o = overlay(); let busy = false, msg = '', ok = false;
    o.cleanup = () => { if (off) off(); };
    const off = E.on(() => { if (!busy && cur === o && !o.celebrating) render(); });
    function render() {
      const s = E.status(), pc = codes(), left = pc ? pc.daysLeft() : 0; o.panel.textContent = '';
      const inp = h('input', { class: 'txt', 'data-code': '1', placeholder: T('code_ph'), autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': T('code_ph'), style: 'width:100%;direction:ltr;text-align:center;font-size:26px' });
      inp.value = o.typed || ''; inp.addEventListener('input', () => { o.typed = inp.value; });
      inp.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') go(); }); inp.addEventListener('keyup', e => e.stopPropagation());
      let state = null;
      if (s.premium) state = h('div', { class: 'pw-note', 'data-state': 'active', style: 'color:#17803d' }, (s.expiry ? T('active_until', { d: dateOf(s.expiry) }) : T('active_now')) + ' · ' + T('days_left', { n: ar(left) }), h('br'), T('renew_hint'));
      else if (s.state === 'EXPIRED') state = h('div', { class: 'pw-note', 'data-state': 'expired', style: 'color:#a8330f' }, T('expired_hint'));
      const price = C.priceText ? h('div', { class: 'pw-note', 'data-price': '1', style: 'color:#1a6fd0;margin:0' }, C.priceText) : null;
      o.panel.append(
        h('div', { class: 'pw-head' }, h('div', { class: 'pw-badge' }, UI.i('star', 40)), h('div', { style: 'flex:1' }, h('h3', null, C.appTitle || T('title')), h('div', { class: 'pw-lead' }, T('lead')))),
        h('div', { class: 'pw-cols' }, state, price, h('div', { class: 'pw-plan' }, inp, h('div', { class: 'pw-msg' + (ok ? ' ok' : ''), 'data-msg': '1', role: 'status', 'aria-live': 'polite' }, busy ? T('verifying') : msg),
          h('div', { class: 'row', style: 'gap:10px;flex-wrap:wrap' }, btn(T('code_go'), 'green', go, 'check', { 'data-act': 'activate' }), btn(T('ask_code'), 'blue', () => { P.contact(t => { msg = t; ok = false; render(); }); }, 'phone', { 'data-act': 'contact' })))),
        h('div', { class: 'pw-fine' }, T('free_note')),
        h('div', { class: 'pw-links' }, btn(T('later'), 'gray sm', () => o.close(), null, { 'data-act': 'later' })));
    }
    async function go() {
      if (busy) return; const pc = codes(); const code = o.typed || ''; busy = true; msg = ''; render();
      const r = await pc.activate(code); busy = false; ok = false;
      if (!r.ok) { msg = r.why === 'used' ? T('code_used') : r.why === 'wait' ? T('code_wait', { s: ar(r.wait) }) : r.why === 'empty' ? T('code_empty') : T('code_bad'); render(); return; }
      o.typed = ''; await E.restore(); celebrate(r.days);
    }
    function celebrate(days) {
      o.celebrating = true; o.panel.textContent = ''; o.panel.classList.add('slim');
      const lock = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); lock.setAttribute('viewBox', '0 0 48 48');
      lock.innerHTML = '<g class="sh"><path d="M15 21v-6a9 9 0 0 1 18 0v6" fill="none" stroke="#c88a10" stroke-width="5" stroke-linecap="round"/></g><rect x="9" y="21" width="30" height="21" rx="6" fill="#ffc93c" stroke="#4a2e1c" stroke-width="3"/><circle cx="24" cy="31" r="3.4" fill="#7a4a00"/>';
      const s = E.status();
      o.panel.append(h('div', { class: 'pw-open', 'data-state': 'unlocked' }, lock, h('div', { class: 'bigt pop' }, T('unlocked_title')), h('div', { class: 'pw-lead', style: 'text-align:center' }, T('code_ok', { n: ar(days) }) + ' · ' + (s.expiry ? T('active_until', { d: dateOf(s.expiry) }) : '')), btn(T('play_now'), 'green big', () => o.close(), 'play', { 'data-act': 'playnow' })));
      try { M.audio.sfx('fanfare'); M.backdrop.confetti(); UI.sparks(480, 250, { n: 16, r: 150 }); } catch (e) { }
    }
    render();
  }

  /* ---------------- parents' corner ---------------- */
  E.parentSection = function () {
    const box = h('div', { class: 'pw-parent', 'data-sub': '1' }); let seen = false, off = null;
    function render() {
      if (!box.isConnected && seen) { if (off) off(); return; } if (box.isConnected) seen = true;
      const s = E.status(), pc = codes(); box.textContent = ''; let line, cls = 'gray';
      if (s.premium) { line = (s.expiry ? T('par_active_until', { d: dateOf(s.expiry) }) : T('par_active')) + ' · ' + T('days_left', { n: ar(pc ? pc.daysLeft() : 0) }); cls = 'ok'; } else if (s.state === 'EXPIRED') { line = T('par_expired'); cls = 'warn'; } else line = T('par_none');
      const b1 = btn(s.premium ? T('renew_btn') : T('subscribe_btn'), 'green sm', () => P.open({}), 'play', { 'data-act': 'subscribe' });
      const b2 = btn(T('ask_code'), 'blue sm', () => P.contact(), 'phone', { 'data-act': 'contact' });
      box.append(h('div', { style: 'font-size:27px;font-weight:900;margin:12px 0 6px' }, T('par_title')),
        h('div', { class: 'row', style: 'justify-content:flex-start;gap:14px;flex-wrap:wrap' }, h('div', { class: 'chip pw-st ' + cls, style: 'font-size:21px;min-height:46px' }, line), b1, b2),
        h('div', { style: 'font-size:17px;opacity:.7;font-weight:800;margin:6px 0' }, T('par_note') + ' ' + T('par_privacy')));
    }
    off = E.on(render); render(); return box;
  };
})();
