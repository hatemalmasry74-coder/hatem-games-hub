/* Moody & Aboody - engine/ui.js : HTML overlay UI (menus, HUD, dialog, quiz card, toasts, popups).
   Everything lives inside #ui (960x540 logical px, scaled). Arabic RTL.

   PUBLIC HELPERS (all coordinates are LOGICAL px of the 960x540 UI box)
   - Moody.ui.i(name, px, {off,color})     inline SVG icon (coin star pause sound replay home back arrow lock check heart settings album diary parent phone play x swap plus minus whatnow narr hanger).
   - Moody.ui.flyTo(kind, x, y, {n,onArrive})   kind 'coin'|'star': icons fly from (x,y) to the HUD / result counter ([data-ctr=kind]) and bump it.
   - Moody.ui.sparks(x, y, {n,r,colors})   little star burst.   Moody.ui.countTo(el, n, ms)   animated number (Arabic digits).
   - Moody.ui.say({who,text,x,dock,name,icon,face,speed,onTalk,register,auto})   story dialog. x = speaker screen x (tail target; default: the hero's x on the stage,
        else centred), dock = 'auto'|'top'|'bottom' (auto = the side that hides the heroes least), speed = ms per character (default: tied to the voice clip length, else 26).
   - SAFE AREA API: Moody.ui.safeArea() -> {x,y,w,h,top,bottom,dock}: the rectangle NOT covered by UI chrome right now (top = under the HUD band (76), bottom = top edge
        of the dialog when it is docked at the bottom, else 540). Moody.ui.onSafe(fn) subscribes (returns an unsubscribe), CSS vars --safe-t/--safe-b are set on #ui.
        Stage / kits should keep heroes + hotspots inside it.  Moody.ui.HUD_H = 76.
   - HUD: Moody.ui.hud.show/hide/rebuild/setPrompt/update/pulseSwitch/showSwitch (+ hud.step(n) / hud.progress(frac) for the mission progress strip).
   - Optional character hooks (used only when present): Moody.chars.speaking(id,bool), Moody.chars.emotion(id,name).
*/
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, U = M.util, A = M.art;
  const root = document.getElementById('ui');
  const UI = M.ui = { previews: [], root, HUD_H: 76 };
  const ar = U.ar;
  const reduced = () => { try { return matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } };
  UI.reduced = reduced;
  const sc = () => M.scale || 1;

  function h(tag, props) {
    const e = document.createElement(tag), kids = Array.prototype.slice.call(arguments, 2);
    if (props) for (const k in props) { const v = props[k]; if (v == null || v === false) continue; if (k === 'class') e.className = v; else if (k === 'style') e.style.cssText = v; else if (k.slice(0, 2) === 'on') e.addEventListener(k.slice(2), v); else e.setAttribute(k, v); }
    (function add(list) { list.forEach(c => { if (Array.isArray(c)) return add(c); if (c == null || c === false) return; e.append(c.nodeType ? c : document.createTextNode(String(c))); }); })(kids);
    return e;
  }
  UI.h = h;

  /* ============ icon set (inline SVG sprite, 48x48, chunky + glossy) ============ */
  const NS = 'http://www.w3.org/2000/svg';
  const star5 = (cx, cy, R, r) => { const p = []; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); } return p.join(' '); };
  const ST = 'stroke-linejoin:round;stroke-linecap:round';
  const gl = inner => '<g transform="translate(0 2.4)" style="fill:var(--ics,rgba(40,20,60,.28));stroke:var(--ics,rgba(40,20,60,.28));stroke-width:4;' + ST + '">' + inner + '</g><g style="fill:var(--ic,#fff);stroke:var(--ic,#fff);stroke-width:4;' + ST + '">' + inner + '</g>';
  const cut = 'style="fill:var(--icd,rgba(40,20,60,.42));stroke:none"';
  const cutS = 'fill="none" style="stroke:var(--icd,rgba(40,20,60,.42))"';
  const gear = (() => { let t = ''; for (let i = 0; i < 8; i++) t += '<rect x="21" y="4" width="6" height="9" rx="2" transform="rotate(' + i * 45 + ' 24 24)"/>'; return t; })();
  const SPK = '<path d="M8 19h6l9-8v26l-9-8H8z"/>';
  const IC = {
    coin: '<circle cx="24" cy="24" r="20" fill="url(#gGold)" stroke="#b86a08" stroke-width="3"/><circle cx="24" cy="24" r="13.5" fill="none" stroke="#e8a117" stroke-width="3"/><polygon points="' + star5(24, 24.5, 8.5, 3.8) + '" fill="#fff3b0" stroke="#e8a117" stroke-width="1.6" stroke-linejoin="round"/><path d="M11.5 18a14 14 0 0 1 9-7.5" fill="none" stroke="#fff" stroke-opacity=".9" stroke-width="3" stroke-linecap="round"/>',
    star: '<polygon points="' + star5(24, 25, 21, 10) + '" fill="url(#gGold)" stroke="#c27a0a" stroke-width="3.2" stroke-linejoin="round"/><path d="M14.5 17.5 21 9.5" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/>',
    'star-off': '<polygon points="' + star5(24, 25, 21, 10) + '" fill="#e2dccd" stroke="#b3aa97" stroke-width="3.2" stroke-linejoin="round"/><path d="M14.5 17.5 21 9.5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>',
    heart: '<path d="M24 41C10 31 5.5 22 9 15.5c3.4-6 11-5.6 15 .5 4-6.1 11.6-6.5 15-.5C42.5 22 38 31 24 41z" fill="url(#gRed)" stroke="#b3213f" stroke-width="3" stroke-linejoin="round"/><path d="M13 16.500c1-2.500 3.500-3.300 5.500-2.600" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/>',
    pause: gl('<rect x="12" y="10" width="8" height="28" rx="3"/><rect x="28" y="10" width="8" height="28" rx="3"/>'),
    play: gl('<path d="M16 11 37 24 16 37z"/>'),
    sound: gl(SPK + '<path d="M30 18a9 9 0 0 1 0 12M35 13a16 16 0 0 1 0 22" fill="none"/>'),
    'sound-off': gl(SPK + '<path d="M31 18l11 12M42 18 31 30" fill="none"/>'),
    replay: gl('<path d="M38 25a14 14 0 1 1-4.500-10.300" fill="none" stroke-width="5"/><path d="M41 7v13H28z"/>'),
    home: gl('<path d="M24 8 6 24h6v16h10V30h4v10h10V24h6z"/>'),
    back: gl('<path d="M10 24h27M26 12l12 12-12 12" fill="none" stroke-width="6"/>'),
    arrow: gl('<path d="M38 24H11M22 12 10 24l12 12" fill="none" stroke-width="6"/>'),
    lock: gl('<rect x="11" y="21" width="26" height="19" rx="5"/><path d="M16 21v-5a8 8 0 0 1 16 0v5" fill="none" stroke-width="5"/><circle cx="24" cy="30.500" r="3" ' + cut + '/>'),
    check: gl('<path d="M10 25l9 9 19-20" fill="none" stroke-width="7"/>'),
    settings: gl('<circle cx="24" cy="24" r="10" fill="none" stroke-width="6"/>' + gear),
    album: gl('<rect x="9" y="7" width="30" height="34" rx="6"/><polygon points="' + star5(24, 24.500, 9.500, 4.300) + '" ' + cut + '/>'),
    diary: gl('<rect x="10" y="7" width="29" height="35" rx="5"/><path d="M17 17h15M17 24h15M17 31h9" stroke-width="3" ' + cutS + '/>'),
    parent: gl('<circle cx="18" cy="15" r="6"/><path d="M7 39c0-9 5-13 11-13s11 4 11 13z"/><circle cx="34" cy="21" r="4.500"/><path d="M29 39c0-6 2-9 5-9s8 3 8 9z"/>'),
    phone: gl('<rect x="14" y="5" width="20" height="38" rx="6"/><rect x="18" y="11" width="12" height="20" rx="2" ' + cut + '/><circle cx="24" cy="37" r="2" ' + cut + '/>'),
    hanger: gl('<path d="M24 14a4.500 4.500 0 1 1 4.500 4.500L24 22 8 33a3 3 0 0 0 1.800 5.500h28.400A3 3 0 0 0 40 33L24 22" fill="none"/>'),
    x: gl('<path d="M12 12l24 24M36 12 12 36" fill="none" stroke-width="7"/>'),
    swap: gl('<path d="M10 17h26m-8-8 8 8-8 8M38 31H12m8-8-8 8 8 8" fill="none"/>'),
    plus: gl('<path d="M24 10v28M10 24h28" fill="none" stroke-width="7"/>'),
    minus: gl('<path d="M10 24h28" fill="none" stroke-width="7"/>'),
    whatnow: gl('<path d="M5 19h6l8-7v24l-8-7H5z"/><path d="M26 18a7 7 0 1 1 10 6.300c-2 1-3 2.400-3 5" fill="none" stroke-width="4.500"/><circle cx="33" cy="38" r="2.600"/>'),
    narr: gl('<path d="M8 9h32a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-9 8v-8H8a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z"/><path d="M15 21v4M21 17v12M27 20v6M33 18v10" stroke-width="3.400" ' + cutS + '/>'),
    'narr-off': gl('<path d="M8 9h32a4 4 0 0 1 4 4v16a4 4 0 0 1-4 4H22l-9 8v-8H8a4 4 0 0 1-4-4V13a4 4 0 0 1 4-4z"/><path d="M15 21v4M21 17v12M27 20v6M33 18v10" stroke-width="3.400" ' + cutS + '/>') + '<path d="M7 41 41 7" fill="none" stroke="#ff4b4b" stroke-width="5" stroke-linecap="round"/>'
  };
  UI.ICONS = IC;
  (function sprite() {
    const defs = '<defs><linearGradient id="gGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff2a6"/><stop offset=".5" stop-color="#ffcf3a"/><stop offset="1" stop-color="#ff9f1a"/></linearGradient><linearGradient id="gRed" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff95ad"/><stop offset="1" stop-color="#ff3d6a"/></linearGradient></defs>';
    let s = '<svg xmlns="' + NS + '" width="0" height="0" style="position:absolute;width:0;height:0" aria-hidden="true" focusable="false">' + defs;
    Object.keys(IC).forEach(k => { s += '<symbol id="ic-' + k + '" viewBox="0 0 48 48">' + IC[k] + '</symbol>'; });
    s += '</svg>';
    document.body.insertAdjacentHTML('afterbegin', s);
  })();
  UI.i = function (name, px, o) {
    o = o || {}; const n = o.off && IC[name + '-off'] ? name + '-off' : name;
    const s = document.createElementNS(NS, 'svg'); s.setAttribute('viewBox', '0 0 48 48'); s.setAttribute('width', px || 32); s.setAttribute('height', px || 32); s.setAttribute('class', 'ic ic-' + name); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false');
    const u = document.createElementNS(NS, 'use'); u.setAttribute('href', '#ic-' + n); s.append(u);
    if (o.color) s.style.setProperty('--ic', o.color); if (o.flip) s.style.transform = 'scaleX(-1)'; return s;
  };
  const I = UI.i;
  /* art icons for game content; the few names that are pure chrome map to the SVG set so every world matches */
  const CHROME = { sound: 1, pause: 1, swap: 1, whatnow: 1, narr: 1, coin: 1, star: 1 };
  const ico = (n, px, o) => CHROME[n] ? I(n, px || 36, o) : A.el(n, px || 36, o);
  UI.ico = ico;

  /* ============ environment: scale -> --us, phone class ============ */
  function fit() { const s = sc(); root.style.setProperty('--us', s.toFixed(3)); document.body.classList.toggle('compact', s < .85); }
  addEventListener('resize', fit); addEventListener('orientationchange', () => setTimeout(fit, 250)); fit();
  UI.fit = fit;

  /* ============ fx: ripple, sparks, count-up, fly-to ============ */
  const toLogical = (cx, cy) => { const r = root.getBoundingClientRect(), s = sc(); return [(cx - r.left) / s, (cy - r.top) / s]; };
  const RIPPLE = '.btn,.opt,.card,.tile,.mcard,.choicecard,.seqcard,.cardmem';
  const TAPS = RIPPLE + ',.mch,.spk,#sw .h';
  root.addEventListener('pointerdown', e => {
    const t = e.target.closest && e.target.closest(TAPS); if (!t || t.disabled || reduced()) return;
    if (t.matches(RIPPLE)) { const r = t.getBoundingClientRect(), s = sc(); const rp = h('i', { class: 'rip', style: 'left:' + ((e.clientX - r.left) / s) + 'px;top:' + ((e.clientY - r.top) / s) + 'px' }); t.append(rp); setTimeout(() => rp.remove(), 650); }
    if (t.matches('.btn.big')) { const [x, y] = toLogical(e.clientX, e.clientY); UI.sparks(x, y, { n: 6, r: 46 }); }
  }, true);
  UI.sparks = function (x, y, o) {
    if (reduced()) return; o = o || {}; const n = o.n || 8, cols = o.colors || ['#ffd23a', '#ff6f9b', '#4d9bff', '#4fd06a', '#ffffff'];
    for (let i = 0; i < n; i++) {
      const a = Math.PI * 2 * i / n + Math.random() * .7, d = (o.r || 56) * (.6 + Math.random() * .7), z = 12 + Math.random() * 10;
      const s = h('i', { class: 'spk2', style: 'left:' + x + 'px;top:' + y + 'px;--dx:' + (Math.cos(a) * d).toFixed(1) + 'px;--dy:' + (Math.sin(a) * d).toFixed(1) + 'px;--c:' + cols[i % cols.length] + ';width:' + z + 'px;height:' + z + 'px' });
      over.append(s); setTimeout(() => s.remove(), 800);
    }
  };
  UI.toLogical = toLogical;
  UI.sparkEl = function (el, o) { if (!el || !el.getBoundingClientRect) return; const r = el.getBoundingClientRect(), p = toLogical(r.left + r.width / 2, r.top + r.height / 2); UI.sparks(p[0], p[1], o); };
  UI.bump = el => { if (!el) return; el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); setTimeout(() => el.classList.remove('bump'), 420); };
  UI.countTo = function (el, to, ms) {
    if (!el) return; const from = +el.dataset.v || 0; el.dataset.v = to; if (el._raf) cancelAnimationFrame(el._raf);
    if (reduced() || from === to) { el.textContent = ar(to); return; }
    const t0 = performance.now(), dur = ms || 520;
    const step = now => { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3); el.textContent = ar(Math.round(from + (to - from) * e)); el._raf = k < 1 ? requestAnimationFrame(step) : 0; };
    el._raf = requestAnimationFrame(step);
  };
  UI.flyTo = function (kind, fx, fy, o) {
    o = o || {}; const target = o.target || root.querySelector('[data-ctr="' + kind + '"]'), n = o.n || (kind === 'coin' ? 5 : 1);
    if (!target || reduced()) { if (o.onArrive) o.onArrive(); return; }
    const tr = target.getBoundingClientRect(), [tx, ty] = toLogical(tr.left + tr.width / 2, tr.top + tr.height / 2); let arrived = 0; const sz = kind === 'star' ? 46 : 34, hs = sz / 2;
    for (let i = 0; i < n; i++) {
      const el = h('div', { class: 'fx' }, I(kind, sz)); over.append(el);
      const sx = fx + (n > 1 ? (Math.random() - .5) * 70 : 0), sy = fy + (n > 1 ? (Math.random() - .5) * 40 : 0), mx = (sx + tx) / 2 + (Math.random() - .5) * 140, my = Math.min(sy, ty) - 30 - Math.random() * 60;
      const T = (x, y, k) => 'translate(' + (x - hs).toFixed(1) + 'px,' + (y - hs).toFixed(1) + 'px) scale(' + k + ')';
      const a = el.animate([{ transform: T(sx, sy, .3), opacity: 0 }, { transform: T(sx, sy, 1.3), opacity: 1, offset: .16 }, { transform: T(mx, my, 1.1), opacity: 1, offset: .55 }, { transform: T(tx, ty, .55), opacity: 1 }], { duration: 800 + i * 70, delay: (o.delay || 0) + i * 75, easing: 'cubic-bezier(.4,0,.6,1)', fill: 'both' });
      a.onfinish = () => { el.remove(); arrived++; UI.bump(target); if (arrived === n) { UI.sparks(tx, ty, { n: 6, r: 26 }); if (o.onArrive) o.onArrive(); } };
      setTimeout(() => el.remove(), 3000 + i * 90);
    }
  };

  const tap = fn => ev => { M.audio.sfx('tap'); fn(ev); };
  UI.btn = (label, cls, fn, icon) => h('button', { class: 'btn ' + (cls || ''), onclick: tap(fn) }, icon ? I(icon, 32) : null, label);
  const starRow = (n, px, max) => { const s = h('span', { class: 'stars' }); for (let i = 0; i < (max || 3); i++) s.append(I('star', px || 28, { off: i >= n })); return s; };
  UI.starRow = starRow;
  A.registerAll({
    phone(g) { G.fillRR(g, -26, -40, 52, 80, 12, '#fff', 5); G.fillRR(g, -20, -30, 40, 52, 4, '#6fd0ff', 2.5); G.circ(g, 0, 31, 5, '#ccc', 1.5); G.circ(g, 0, -6, 11, '#ffd2a8', 2.5); G.fillRR(g, -13, 2, 26, 14, 7, '#2f6fe0', 2.5); },
    narr(g, o) { G.fillRR(g, -40, -36, 80, 58, 18, '#fff', 5); G.poly(g, [[-16, 18], [-26, 40], [6, 20]], '#fff', 5); G.fillRR(g, -34, -30, 68, 46, 14, '#fff', 0); [-18, -6, 6, 18].forEach((x, i) => { const hh = [10, 22, 16, 26][i]; G.fillRR(g, x - 4, -7 - hh / 2, 8, hh, 4, '#4a8dff', 0); }); if (o.off) { G.line(g, -34, -34, 34, 22, 8, '#ef5350'); } },
    whatnow(g) { G.poly(g, [[-38, -14], [-22, -14], [-4, -30], [-4, 30], [-22, 14], [-38, 14]], '#fff', 4.5); g.lineWidth = 5; g.strokeStyle = '#fff'; g.beginPath(); g.arc(-2, 0, 18, -.9, .9); g.stroke(); G.text(g, '؟', 28, 3, { size: 52, color: '#fff', stroke: M.OL, sw: 7 }); }
  });

  /* ============ layers + screen manager (with transitions) ============ */
  const scr = h('div', { id: 'scr' }), hudEl = h('div', { id: 'hud', style: 'display:none' }), over = h('div', { id: 'over', style: 'position:absolute;inset:0;pointer-events:none' });
  root.append(scr, hudEl, over); UI.scr = scr; UI.over = over;
  scr.style.cssText = 'position:absolute;inset:0;pointer-events:none';
  over.setAttribute('aria-live', 'polite');
  let curLevel = 0;
  /* UI.show(el, cls, level): level orders the screens (title 0, map 1, world 2, sub-screens/result 3) so we know whether we slide forward or back */
  UI.show = function (el, cls, level) {
    UI.previews = []; if (el && hud) UI.hud.hide();
    Array.from(scr.children).forEach(o => { if (o.classList.contains('leave') || !el || reduced()) { o.remove(); return; } o.classList.add('leave'); o.setAttribute('inert', ''); o.setAttribute('aria-hidden', 'true'); o.querySelectorAll('[data-world],[data-mission],[data-i],[data-item],[data-who]').forEach(n => { ['data-world', 'data-mission', 'data-i', 'data-item', 'data-who'].forEach(a => n.removeAttribute(a)); }); setTimeout(() => o.remove(), 190); });
    if (el) { el.classList.add('screen'); if (cls) el.classList.add(cls); if (level != null) { if (level < curLevel) el.classList.add('back'); curLevel = level; } scr.append(el); }
  };
  UI.clearScreen = () => UI.show(null);
  UI.hideSplash = function () { const s = document.getElementById('splash'); if (!s) return; s.classList.add('gone'); setTimeout(() => s.remove(), 600); };

  /* ============ toasts / modals / popups ============ */
  UI.toast = function (text, ms) { const t = h('div', { class: 'toast', role: 'status' }, M.fmt(text)); over.append(t); M.voice.speak(text, { speaker: 'narrator', soft: true }); setTimeout(() => t.remove(), ms || 2200); return t; };
  UI.modal = function (content, o) {
    o = o || {}; const m = h('div', { class: 'modal', role: 'dialog', 'aria-modal': 'true', 'aria-label': o.label || 'نافذة' }, h('div', { class: 'panel' }, content)); over.append(m);
    const kh = e => { if (e.key === 'Escape' && o.onEsc) { o.onEsc(); return true; } return false; };
    M.keys.unshift(kh);
    const api = { el: m, close: () => { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); m.remove(); } };
    requestAnimationFrame(() => { const b = m.querySelector('.btn'); if (b) try { b.focus({ preventScroll: true }); } catch (e) { } });
    return api;
  };
  UI.confirm = function (msg, okLabel, cancelLabel) {
    return new Promise(res => {
      const mo = UI.modal([h('p', null, msg), h('div', { class: 'row' }, UI.btn(okLabel || 'تمام', 'green', () => { mo.close(); res(true); }), UI.btn(cancelLabel || 'لأ', 'gray', () => { mo.close(); res(false); }))], { label: 'تأكيد', onEsc: () => { mo.close(); res(false); } });
    });
  };
  UI.starPop = function (n) {
    UI._holdStar = true; setTimeout(() => releaseStar(), 2200);
    const wrap = h('div', { style: 'position:absolute;left:0;right:0;top:130px;display:flex;flex-direction:column;align-items:center;pointer-events:none;z-index:35' });
    const glow = h('div', { style: 'position:absolute;top:-70px;width:340px;height:340px;background:repeating-conic-gradient(from 0deg,rgba(255,226,122,.5) 0 10deg,transparent 10deg 24deg);border-radius:50%;animation:rays 9s linear infinite;-webkit-mask-image:radial-gradient(closest-side,#000 20%,transparent 100%);mask-image:radial-gradient(closest-side,#000 20%,transparent 100%)' });
    const st = h('div', { style: 'position:relative;animation:starin .6s var(--spring)' }, I('star', 150)); const lab = h('div', { class: 'title', style: 'font-size:50px;margin-top:-6px;animation:popin .5s var(--spring)' }, n > 1 ? '+' + ar(n) + ' نجوم!' : 'نجمة!');
    wrap.append(glow, st, lab); over.append(wrap); M.audio.sfx('star'); UI.sparks(480, 215, { n: 12, r: 110 });
    if (UI.hud._beat) UI.hud._beat(1);
    setTimeout(() => { wrap.style.transition = 'opacity .25s'; wrap.style.opacity = '0'; UI.flyTo('star', 480, 215, { n: Math.min(3, n), onArrive: releaseStar }); }, 950); setTimeout(() => wrap.remove(), 1300);
  };
  function releaseStar() { if (!UI._holdStar) return; UI._holdStar = false; if (hud) UI.hud.update(hud.lastStars); }

  /* ============ HUD (inside missions) ============ */
  let hud = null, lastBeats = 0;
  const LS = 'moody_ui_v1';
  const learned = k => { try { const j = JSON.parse(localStorage.getItem(LS) || '{}'); return (j.mp && j.mp[k]) || 0; } catch (e) { return 0; } };
  const learn = (k, v) => { try { const j = JSON.parse(localStorage.getItem(LS) || '{}'); j.mp = j.mp || {}; j.mp[k] = v; localStorage.setItem(LS, JSON.stringify(j)); } catch (e) { } };
  UI.hud = {
    show(stage, opts) {
      opts = opts || {}; hudEl.textContent = ''; hudEl.style.display = 'block'; hudEl.classList.remove('in'); void hudEl.offsetWidth; hudEl.classList.add('in');
      const coins = M.save.data.coins, sw = h('div', { id: 'sw', role: 'group', 'aria-label': 'اختار البطل' });
      const starV = h('span', { id: 'starv', class: 'v', 'data-v': 0 }, ar(0)), coinV = h('span', { id: 'coinv', class: 'v', 'data-v': coins }, ar(coins));
      const star = h('div', { class: 'pill', 'data-ctr': 'star', role: 'status', 'aria-label': 'النجوم' }, I('star', 30), starV), coin = h('div', { class: 'pill', 'data-ctr': 'coin', role: 'status', 'aria-label': 'العملات' }, I('coin', 30), coinV);
      const pause = h('button', { class: 'btn round blue pause', 'aria-label': 'إيقاف مؤقت', onclick: tap(() => hud.onPause && hud.onPause()) }, I('pause', 30));
      const hr = h('div', { id: 'hr' }, pause, star, coin);
      const prompt = h('div', { id: 'prompt' });
      const what = h('button', { id: 'what', class: 'btn round green', 'aria-label': 'ماذا نفعل؟ اسمع التعليمات', onclick: tap(() => M.voice.replay()) }, I('whatnow', 34));
      const prog = h('div', { id: 'mprog', role: 'progressbar', 'aria-label': 'تقدّم المهمة', 'aria-valuemin': 0, 'aria-valuemax': 100 }, h('i'));
      hudEl.append(sw, what, hr, prompt, prog);
      let key = null; try { const c = M.flow && M.flow.cur; if (c) { const w = M.getWorld(c.wid); key = c.wid + '/' + w.missions[c.idx].id; } } catch (e) { }
      hud = { sw, prompt, hr, what, prog, stage, btns: {}, onPause: opts.onPause, starV, coinV, starEl: star, coinEl: coin, lastStars: 0, beats: 0, total: key ? learned(key) : 0, lastPrompt: '', says: 0, key };
      hud.sync = (flash) => { for (const k in hud.btns) { const on = stage.active === k; hud.btns[k].classList.toggle('on', on); hud.btns[k].setAttribute('aria-pressed', on ? 'true' : 'false'); if (on && flash) { hud.btns[k].classList.add('say'); } } };
      hud.build = () => {   // 2 heroes: big avatars + swap icon; 3-4 heroes: compact row
        sw.textContent = ''; hud.btns = {}; const ids = stage.control, many = ids.length > 2; sw.className = many ? 'many' : '';
        ids.forEach((id, i) => {
          const def = M.chars.defs[id], nm = M.save.data.names[id] || def.name, face = def.img ? h('img', { src: M.chars.avatar(id) + '?v=1', alt: '' }) : ico('face:' + id, 76);
          const b = h('button', { class: 'h', 'data-hero': id, 'aria-label': nm, onclick: () => { stage.setActive(id); } }, face, h('span', { class: 'tg' }, nm));
          hud.btns[id] = b; sw.append(b); if (!many && i === 0 && ids.length === 2) sw.append(h('div', { class: 'sw', 'aria-hidden': 'true' }, I('swap', 20)));
        });
        const swW = many ? ids.length * 48 + (ids.length - 1) * 5 : 2 * 58 + 30 + 2 * 6, wl = 12 + swW + 12;
        what.style.left = wl + 'px'; const pl = wl + 52 + 10; prompt.style.left = pl + 'px'; prog.style.left = pl + 'px'; hud.sync(true);
        clearTimeout(hud.tgT); hud.tgT = setTimeout(() => { for (const k in hud.btns) hud.btns[k].classList.remove('say'); }, 2200);
      };
      hud.build(); stage.onSwitch = () => { hud.sync(true); clearTimeout(hud.tgT); hud.tgT = setTimeout(() => { for (const k in hud.btns) hud.btns[k].classList.remove('say'); }, 1600); };
      UI._holdStar = false; UI.setSafe();
    },
    rebuild() { if (hud) hud.build(); },
    hide() { if (hud) { lastBeats = hud.beats; clearTimeout(hud.tgT); } hudEl.style.display = 'none'; hudEl.textContent = ''; hud = null; UI.skip.hide(); UI._holdStar = false; },
    setPrompt(t) {
      if (!hud) return; hud.prompt.textContent = '';
      if (t) { hud.prompt.append(h('div', { class: 'p', onclick: () => M.voice.replay() }, I('sound', 28), h('span', null, M.fmt(t)))); M.voice.setInstruction(t); if (t !== hud.lastPrompt) UI.hud.step(1); hud.lastPrompt = t; } else M.voice.clearInstruction();
    },
    update(stars) {
      if (!hud) return; if (stars != null) hud.lastStars = stars; if (UI._holdStar) return;
      UI.countTo(hud.starV, hud.lastStars || 0); UI.countTo(hud.coinV, M.save.data.coins);
    },
    pulseSwitch(on) { if (hud) hud.sw.classList.toggle('pulse', !!on); },
    showSwitch(v) { if (hud) hud.sw.style.display = v ? 'flex' : 'none'; },
    /* mission progress strip: step(n) adds n "beats" (new instruction, answered question, star, every 3rd dialog line); the total is learned from the previous finished play */
    step(n) { if (!hud) return; hud.beats += (n == null ? 1 : n); UI.hud.render(); },
    progress(f) { if (!hud) return; hud.prog.firstChild.style.transform = 'scaleX(' + Math.max(0, Math.min(1, f)).toFixed(3) + ')'; hud.prog.setAttribute('aria-valuenow', Math.round(f * 100)); },
    render() { if (!hud) return; const b = hud.beats, f = hud.total ? Math.min(.97, b / hud.total) : b / (b + 3.2); UI.hud.progress(f); },
    _beat(n) { UI.hud.step(n); }
  };
  let skipEl = null;
  UI.skip = {
    show(fn, label) { UI.skip.hide(); skipEl = h('button', { id: 'skip', class: 'btn sm gray', onclick: tap(() => { UI.skip.hide(); fn(); }) }, label || 'تخطّي'); hudEl.append(skipEl); },
    hide() { if (skipEl) { skipEl.remove(); skipEl = null; } },
    on() { return !!skipEl; }
  };

  /* ============ safe area API ============ */
  UI.safe = { dock: null, top: UI.HUD_H, bottom: 540 }; const safeSubs = [];
  UI.safeArea = () => ({ x: 0, y: UI.safe.top, w: 960, h: Math.max(0, UI.safe.bottom - UI.safe.top), top: UI.safe.top, bottom: UI.safe.bottom, dock: UI.safe.dock });
  UI.onSafe = fn => { safeSubs.push(fn); return () => { const i = safeSubs.indexOf(fn); if (i >= 0) safeSubs.splice(i, 1); }; };
  UI.setSafe = function (dock, top, bottom) {
    UI.safe.dock = dock || null; UI.safe.top = top == null ? UI.HUD_H : top; UI.safe.bottom = bottom == null ? 540 : bottom;
    root.style.setProperty('--safe-t', UI.safe.top + 'px'); root.style.setProperty('--safe-b', (540 - UI.safe.bottom) + 'px'); safeSubs.slice().forEach(f => { try { f(UI.safeArea()); } catch (e) { } });
  };

  /* ============ dialog (story speech bubble) ============ */
  const PAL = { moody: ['#4d9bff', '#1d58c4'], aboody: ['#ff9433', '#c8590a'], mama: ['#ff6f9b', '#c92c60'], baba: ['#40c95f', '#1f8c3d'], narrator: ['#8a6bd6', '#4f35a8'], friend: ['#1fc2b0', '#0b8174'], toota: ['#c260dc', '#7d2f93'], nemo: ['#ff7ab8', '#c4357e'], nana: ['#a98af2', '#6a45c2'], ofa: ['#1fc2b0', '#0b8174'], toti: ['#ff8fb1', '#c4457a'] };
  const palFor = who => PAL[who] || (who ? [['#4d9bff', '#1d58c4'], ['#ff9433', '#c8590a'], ['#1fc2b0', '#0b8174'], ['#c260dc', '#7d2f93']][(String(who).length + String(who).charCodeAt(0)) % 4] : PAL.narrator);
  let lastDock = null;
  UI.say = function (o) {
    return new Promise(res => {
      const text = M.fmt(o.text), who = o.who, defs = M.chars.defs, st = M.scene, hero = st && st.heroes && who ? st.heroes[who] : null;
      let face;
      if (defs[who] && defs[who].img) face = h('img', { src: M.chars.avatar(who) + '?v=1', alt: '' });
      else if (defs[who] && !o.icon) face = ico('face:' + who + (o.face ? ':' + o.face : ''), 90);   // o.face = pose of the portrait, e.g. 'cry'
      else face = ico(o.icon || (who === 'narrator' || !who ? 'narrator' : who), 90);
      const name = who === 'moody' ? M.save.data.names.moody : who === 'aboody' ? M.save.data.names.aboody : (o.name || (defs[who] ? (M.save.data.names[who] || defs[who].name) : '') || { mama: 'ماما' }[who] || '');
      const col = palFor(who);
      const nx = h('div', { class: 'nx', 'aria-hidden': 'true' }, I('arrow', 34)); nx.style.display = 'none';
      const shown = h('span', { class: 'shown' }), rest = h('span', { class: 'rest' }, text), tx = h('div', { class: 'tx' }, shown, rest);
      const rp = h('button', { class: 'btn round green rp', 'aria-label': 'اسمع تاني', onclick: e => { e.stopPropagation(); M.voice.speak(o.text, { speaker: who || 'narrator', force: true }); } }, I('sound', 30));
      const tail = h('i', { class: 'tail' });
      const box = h('div', { class: 'box' }, h('div', { class: 'face' }, face), name ? h('div', { class: 'nm' }, name) : null, h('div', { class: 'body' }, tx), rp, nx);
      const el = h('div', { id: 'dlg', class: 'dlg', role: 'dialog', 'aria-live': 'polite', 'aria-label': (name ? name + ': ' : '') + text, tabindex: '-1', style: '--sc:' + col[0] + ';--sd:' + col[1] }, box, tail);
      over.append(el);
      /* auto-fit the text so the bubble never grows past ~26% of the screen height */
      const maxTx = o.maxH || 112; for (const s of [27, 25, 23, 21, 19, 17]) { tx.style.fontSize = s + 'px'; if (tx.offsetHeight <= maxTx) break; }
      /* dock: bottom unless it would hide the heroes (then the top, below the HUD band) */
      const H = el.offsetHeight, W = el.offsetWidth, left = el.offsetLeft;
      const overlap = (ry0, ry1) => { let worst = 0; try { if (st && st.heroes) Object.keys(st.heroes).forEach(k => { const hh = st.heroes[k]; if (!hh || hh.visible === false || (st.present && st.present().indexOf(k) < 0)) return; const ht = M.chars.height(k) * (hh.sc || 1), hw = ht * .5, y1 = hh.y, y0 = hh.y - ht; const ox = Math.max(0, Math.min(hh.x + hw / 2, left + W) - Math.max(hh.x - hw / 2, left)), oy = Math.max(0, Math.min(y1, ry1) - Math.max(y0, ry0)); worst = Math.max(worst, (ox * oy) / (hw * ht)); }); } catch (e) { } return worst; };
      let dock = o.dock === 'top' || o.dock === 'bottom' ? o.dock : 'bottom';
      if (!o.dock || o.dock === 'auto') { const ob = overlap(540 - 10 - H, 530), ot = overlap(84, 84 + H); dock = ob > .14 && ot < ob - .05 ? 'top' : (lastDock === 'top' && ot <= ob + .1 && ob > .05 ? 'top' : 'bottom'); }
      lastDock = dock; if (dock === 'top') el.classList.add('dock-top'); UI.setSafe(dock, dock === 'top' ? 84 + H + 6 : UI.HUD_H, dock === 'bottom' ? 540 - 10 - H - 8 : 540);
      /* tail -> speaking character */
      const spkX = o.x != null ? o.x : (hero && hero.visible !== false ? hero.x : null);
      if (spkX == null && (!who || who === 'narrator')) el.classList.add('nohero');
      let raf = 0, lastX = -1; const place = () => { const hx = o.x != null ? o.x : (hero && hero.visible !== false ? hero.x : (W / 2 + left)); if (Math.abs(hx - lastX) > .5) { lastX = hx; tail.style.setProperty('--tx', Math.max(70, Math.min(W - 70, hx - left)) + 'px'); } raf = requestAnimationFrame(place); }; place();
      M.voice.speak(o.text, { speaker: who || 'narrator' });
      const chars = M.chars, speakHook = v => { try { if (chars && typeof chars.speaking === 'function') chars.speaking(who, v); } catch (e) { } };
      if (o.emotion) try { if (chars && typeof chars.emotion === 'function') chars.emotion(who, o.emotion); } catch (e) { }
      /* typewriter: skippable, speed tied to the voice clip length when it is known */
      const closers = [], units = Array.from(text), n = units.length; let pos = 0, typing = true, closed = false, ms = o.speed || 26, last = performance.now();
      if (!o.speed) { let tries = 0; const probe = setInterval(() => { const a = M.voice && M.voice.cur; if (a && isFinite(a.duration) && a.duration > .3) { clearInterval(probe); ms = Math.max(14, Math.min(70, a.duration * 1000 * .92 / Math.max(1, n))); } else if (++tries > 14 || !typing) clearInterval(probe); }, 60); closers.push(() => clearInterval(probe)); }
      const iv = setInterval(() => { const now = performance.now(); pos += (now - last) / ms; last = now; const k = Math.min(n, Math.floor(pos)); shown.textContent = units.slice(0, k).join(''); rest.textContent = units.slice(k).join(''); if (k >= n) fin(); }, 30);
      el.classList.add('talking'); speakHook(true);
      function fin() { if (!typing) return; clearInterval(iv); typing = false; el.classList.remove('talking'); shown.textContent = text; rest.textContent = ''; nx.style.display = 'block'; if (o.onTalk) o.onTalk(false); speakHook(false); }
      if (reduced()) fin();
      UI.hud.stepSay && UI.hud.stepSay();
      function close() { if (closed) return; closed = true; clearInterval(iv); cancelAnimationFrame(raf); closers.forEach(f => f()); const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); el.removeAttribute('id'); el.classList.add('out'); setTimeout(() => el.remove(), 190); if (typing) { typing = false; if (o.onTalk) o.onTalk(false); speakHook(false); } if (!document.getElementById('dlg')) UI.setSafe(null); }
      function adv() { if (closed) return; if (typing) { fin(); return; } M.audio.sfx('click'); close(); res(); }
      const kh = e => { if (e.key === ' ' || e.key === 'Enter') { if (e.target && e.target.closest && e.target.closest('button') && e.target !== el) return false; adv(); return true; } return false; };
      M.keys.push(kh); el.addEventListener('click', adv); if (o.onTalk) o.onTalk(true);
      if (o.register) o.register(close);
      if (o.auto) setTimeout(adv, o.auto), setTimeout(adv, o.auto + 20);
    });
  };
  UI.hud.stepSay = function () { if (hud && ++hud.says % 3 === 0) UI.hud.step(1); };

  /* ============ quiz card ============ */
  const CLOSE = ['قريب! جرّب تاني', 'شبه الإجابة! جرّب مرة كمان', 'محاولة حلوة! كمّل'];
  UI.quiz = function (q, o) {
    o = o || {}; let misses = 0, done = false, closed = false;
    const order = q.fixed ? q.choices.map((c, i) => i) : U.shuffle(q.choices.map((c, i) => i));
    const n = order.length, cols = n === 2 ? 2 : (n === 3 ? 3 : 2);
    const hint = h('div', { class: 'hint', role: 'status' });
    const vis = h('div', { class: 'vis' });
    if (q.row) q.row.forEach(a => vis.append(a === '?' ? h('div', { class: 'q' }, '؟') : ico(a, 62)));
    if (q.count) for (let i = 0; i < q.count.n; i++) vis.append(ico(q.count.art, q.count.n > 12 ? 38 : 52));
    if (q.art) vis.append(ico(q.art, 84));
    if (q.emoji) vis.append(h('div', { style: 'font-size:60px;line-height:1;direction:ltr' }, q.emoji));
    const ch = h('div', { class: 'ch', style: 'grid-template-columns:repeat(' + cols + ',1fr)' });
    const compact = !!(q.row || q.count || q.art || q.emoji);
    const btns = order.map((idx, bi) => {
      const c = q.choices[idx], txt = typeof c === 'string' || typeof c === 'number' ? String(c) : c.text, art = c && c.art;
      const b = h('button', { class: 'opt', 'data-correct': idx === q.answer ? '1' : '0', 'data-i': idx, style: compact ? 'min-height:68px' : '' }, art ? ico(art, 54) : null, txt ? h('span', { class: 'ot' }, M.fmt(txt)) : null, txt ? h('span', { class: 'spk', role: 'button', 'aria-label': 'اسمع', onclick: e => { e.stopPropagation(); M.voice.speak(txt, { speaker: 'narrator', force: true }); } }, I('sound', 26)) : null);
      if (txt) { M.voice.note(txt, 'narrator'); M.voice.pressSpeak(b, () => txt, 'narrator'); }
      b.addEventListener('click', () => pick(idx, b)); return b;
    });
    btns.forEach(b => ch.append(b));
    const who = o.who ? h('div', { class: 'who' }, h('img', { src: M.chars.avatar(o.who) + '?v=1', alt: '' }), 'دور ' + M.save.data.names[o.who]) : null;
    const choiceTexts = order.map(i => { const c = q.choices[i]; return typeof c === 'string' || typeof c === 'number' ? String(c) : c.text; }).filter(Boolean);
    const rpl = h('button', { class: 'btn round green rpl', 'aria-label': 'اسمع السؤال', onclick: tap(() => M.voice.speak(q.q, { speaker: 'narrator', force: true })) }, I('sound', 30));
    const lst = h('button', { class: 'btn sm teal lst', onclick: tap(() => M.voice.speakSeq(choiceTexts, { speaker: 'narrator', force: true })) }, I('sound', 22), 'اسمع الاختيارات');
    const qt = h('div', { class: 'qt', style: q.q.length > 90 ? 'font-size:23px' : q.q.length > 60 ? 'font-size:27px' : '' }, M.fmt(q.q));
    const el = h('div', { id: 'qz', class: 'panel', role: 'group', 'aria-label': 'سؤال' }, h('div', { class: 'qhead' }, who, qt, rpl), vis, ch, h('div', { class: 'foot' }, lst, hint));
    over.append(el); M.voice.speak(q.q, { speaker: 'narrator' }); if (q.hint) M.voice.note(q.hint, 'narrator'); if (q.explain) M.voice.note(q.explain, 'narrator');
    const kh = e => { const d = '1234'.indexOf(e.key); if (d >= 0 && d < btns.length && !done) { btns[d].click(); return true; } return false; }; M.keys.push(kh);
    function pick(idx, b) {
      if (done) return;
      if (idx === q.answer) {
        done = true; b.classList.add('right'); M.audio.sfx('good'); btns.forEach(x => { if (x !== b) { x.classList.add('gone'); x.style.animation = 'none'; } });
        const r = b.getBoundingClientRect(), [cx, cy] = toLogical(r.left + r.width / 2, r.top + r.height / 2); UI.sparks(cx, cy, { n: 12, r: 90 });
        const rx = M.reactions && M.reactions.react(misses ? 'correct2' : 'correct', { hero: o.who, tier: o.who === 'aboody' ? 6 : o.who === 'moody' ? 9 : undefined, cat: q.category, attempt: misses + 1 });
        hint.textContent = q.explain ? M.fmt(q.explain) : (rx ? M.fmt(rx.text) : 'برافو!'); hint.style.color = '#1d7f33'; if (q.explain) M.voice.speak(q.explain, { speaker: 'narrator' }); else if (rx) M.voice.speakSeq(rx.seq, { speaker: rx.speaker });
        UI.hud.step(1);
        setTimeout(() => { if (!closed) { close(); o.onDone && o.onDone({ correct: true, tries: misses + 1, misses, revealed: misses >= 3 }); } }, q.explain ? 1700 : rx ? (rx.seq.length > 1 ? 2300 : 1500) : 750);
      } else {
        misses++; M.audio.sfx('wrong'); b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong'); b.classList.add('gone'); b.style.pointerEvents = 'none';
        o.onMiss && o.onMiss(misses);
        if (misses === 1) { const rx = M.reactions && M.reactions.react('wrong1', { hero: o.who, tier: o.who === 'aboody' ? 6 : o.who === 'moody' ? 9 : undefined }), c = rx ? rx.text : U.pick(CLOSE); hint.textContent = M.fmt(c); M.voice.speakSeq(rx ? rx.seq : [c], { speaker: rx ? rx.speaker : 'narrator' }); }
        else if (misses === 2) { const R = M.reactions, ht = q.hint || (R && R.pick('hintless', {})) || 'فكّر تاني بهدوء', lead = q.hint && R ? R.pick('leadhint', {}) : ''; hint.textContent = 'تلميح: ' + M.fmt(ht); M.voice.speakSeq(lead ? [lead, ht] : [ht], { speaker: 'narrator' }); }
        else { const rv = M.reactions && M.reactions.react('reveal', { hero: o.who }), rt = rv ? rv.text : 'تعالوا نشوفها سوا!'; hint.textContent = M.fmt(rt); M.voice.speak(rt, { speaker: rv ? rv.speaker : 'narrator' }); btns.forEach(x => { if (x.dataset.correct === '1') x.style.animation = 'pulse .8s infinite'; }); }
        const left = btns.filter(x => x.dataset.correct !== '1' && !x.classList.contains('gone'));
        if (misses === 2 && left.length > 1) { const r = U.pick(left); r.classList.add('gone'); }
        hint.style.color = '#b8520a';
      }
    }
    function close() { if (closed) return; closed = true; const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); el.removeAttribute('id'); el.style.animation = 'dlgOut .16s ease-in forwards'; el.style.pointerEvents = 'none'; setTimeout(() => el.remove(), 180); }
    return { el, close, buttons: btns };
  };

  /* choice cards (moral decisions) */
  UI.choiceCards = function (prompt, opts, onPick) {
    const row = h('div', { class: 'row', style: 'gap:16px;align-items:stretch' });
    const cards = opts.map((o, i) => { const c = h('button', { class: 'choicecard', 'data-i': i, 'data-good': o.good ? '1' : '0', onclick: () => { M.audio.sfx('tap'); if (o.good) UI.hud.step(1); onPick(i, c); } }, o.art ? ico(o.art, 104) : null, h('span', { class: 'ct' }, M.fmt(o.text)), h('span', { class: 'spk', role: 'button', 'aria-label': 'اسمع', onclick: e => { e.stopPropagation(); M.voice.speak(o.text, { speaker: 'narrator', force: true }); } }, I('sound', 28))); M.voice.note(o.text, 'narrator'); M.voice.pressSpeak(c, () => o.text, 'narrator'); row.append(c); return c; });
    const rpl = h('button', { class: 'btn round green', style: 'width:54px;height:54px;min-width:54px;min-height:54px;flex:0 0 auto', 'aria-label': 'اسمع', onclick: tap(() => M.voice.speak(prompt, { speaker: 'narrator', force: true })) }, I('sound', 30));
    const lst = h('button', { class: 'btn sm teal', style: 'min-height:max(44px,var(--tap));font-size:19px;padding:2px 14px;border-radius:18px;flex:0 0 auto', onclick: tap(() => M.voice.speakSeq(opts.map(o => o.text), { speaker: 'narrator', force: true })) }, I('sound', 22), 'اسمع الاختيارات');
    const el = h('div', { class: 'panel', role: 'group', 'aria-label': 'اختار', style: 'position:absolute;left:50px;right:50px;top:80px;padding:12px 18px 14px;text-align:center;animation:popin .35s var(--spring);z-index:4' }, h('div', { style: 'display:flex;align-items:center;gap:12px;margin-bottom:10px' }, rpl, h('div', { style: 'flex:1;font-size:30px;font-weight:900;line-height:1.25' }, M.fmt(prompt)), lst), row);
    over.append(el); M.voice.speak(prompt, { speaker: 'narrator' }); return { el, cards, close: () => el.remove() };
  };

  /* ============ screens ============ */
  function hdr(title, back, extra) { return h('div', { class: 'hdr' }, h('h2', null, title), back ? h('button', { class: 'btn round yellow', 'aria-label': 'رجوع', onclick: tap(back) }, I('back', 34)) : null, extra ? h('div', { class: 'side' }, extra) : null); }
  const coinPill = () => h('div', { class: 'pill', 'data-ctr': 'coin', role: 'status', 'aria-label': 'العملات' }, I('coin', 30), h('span', { class: 'v' }, ar(M.save.data.coins)));
  const soundBtn = () => { const b = h('button', { class: 'btn round teal', 'aria-label': 'الصوت' }); const set = () => { b.textContent = ''; b.append(I('sound', 34, { off: !M.audio.on() })); b.setAttribute('aria-pressed', M.audio.on() ? 'true' : 'false'); }; b.onclick = () => { M.save.data.settings.sound = !M.audio.on(); M.save.commit(); set(); M.audio.sfx('tap'); }; set(); return b; };
  UI.soundBtn = soundBtn;
  UI.narrBtn = () => { const b = h('button', { class: 'btn round pink', 'aria-label': 'صوت التعليمات' }); const set = () => { b.textContent = ''; b.append(I('narr', 36, { off: M.save.data.settings.narr === false })); b.style.opacity = M.save.data.settings.narr === false ? .6 : 1; b.setAttribute('aria-pressed', M.save.data.settings.narr === false ? 'false' : 'true'); }; b.onclick = () => { M.voice.setEnabled(M.save.data.settings.narr === false); set(); M.audio.sfx('tap'); if (M.save.data.settings.narr !== false) M.voice.speak('صوت التعليمات شغّال', { speaker: 'narrator' }); }; set(); return b; };
  const hubLink = () => h('a', { class: 'btn sm green', href: '../', 'aria-label': 'الصفحة الرئيسية للألعاب' }, I('home', 28), 'الصفحة الرئيسية للألعاب');

  UI.title = function (f) {
    const medal = (id, side, cls) => h('div', { class: 'ttl-medal ' + cls, style: side + ':40px;animation-delay:' + (cls === 'b' ? '0s' : '-2.2s') }, h('div', { class: 'ring' }, h('img', { src: M.chars.avatar(id) + '?v=1', alt: M.chars.defs[id].name })), h('div', { class: 'nm' }, M.save.data.names[id]));
    const el = h('div', null, medal('moody', 'right', 'b'), medal('aboody', 'left', 'o'),
      h('div', { class: 'ttl-logo' }, h('div', { class: 'title' }, 'مودي وعبودي'), h('div', { class: 'ttl-tag' }, 'يوميات ومغامرات')),
      h('div', { class: 'ttl-play' }, h('div', { class: 'halo' }), h('button', { class: 'btn big green shine', 'aria-label': 'ابدأ اللعب', onclick: tap(f.start) }, I('play', 58), 'ابدأ')),
      h('div', { class: 'row ttl-row' }, soundBtn(), UI.narrBtn(), h('button', { class: 'btn round purple', 'aria-label': 'ركن الأهل', onclick: tap(f.parent) }, I('parent', 38)), hubLink()),
      h('div', { class: 'ttl-ver' }, 'الإصدار ١'));
    UI.show(el, 'clear', 0); M.backdrop.mode = 'title'; UI.hideSplash();
  };

  UI.names = function (f) {
    const d = M.save.data.names;
    const i1 = h('input', { class: 'txt', maxlength: 12, value: d.moody, placeholder: 'مودي', autocomplete: 'off', 'aria-label': 'اسم البطل الكبير' }), i2 = h('input', { class: 'txt', maxlength: 12, value: d.aboody, placeholder: 'عبودي', autocomplete: 'off', 'aria-label': 'اسم البطل الصغير' }), i3 = h('input', { class: 'txt', maxlength: 14, value: d.me || '', placeholder: 'اسمك (لو تحب)', autocomplete: 'off', 'aria-label': 'اسمك' });
    const row = (id, inp) => h('div', { class: 'row', style: 'margin:6px 0;justify-content:flex-start;gap:14px' }, id ? h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:64px;height:64px;border-width:3px;box-shadow:0 0 0 3px var(--line)', alt: '' }) : h('div', { style: 'width:64px;height:64px;display:flex;align-items:center;justify-content:center' }, I('star', 52)), inp);
    const el = h('div', null, hdr('أهلًا بيكم!', f.back), h('div', { class: 'panel', style: 'position:absolute;left:150px;right:150px;top:100px;padding:14px 20px 16px;text-align:center' },
      h('div', { style: 'font-size:27px;font-weight:900;margin-bottom:6px' }, 'تحبوا نغيّر الأسماء؟ (اختياري)'), row('moody', i1), row('aboody', i2), row(null, i3),
      h('div', { class: 'row', style: 'margin-top:12px' }, UI.btn('يلا بينا', 'green', () => { const c = (v, dft) => (v || '').trim().slice(0, 14) || dft; d.moody = c(i1.value, 'مودي'); d.aboody = c(i2.value, 'عبودي'); d.me = c(i3.value, ''); M.save.data.named = true; M.save.commit(); f.ok(); }, 'check'))));
    UI.show(el, null, 1); M.backdrop.mode = 'map';
  };

  const RING = (frac, r, col) => { const c = 2 * Math.PI * r; const s = document.createElementNS(NS, 'svg'); s.setAttribute('class', 'ring'); s.setAttribute('viewBox', '0 0 100 100'); s.innerHTML = '<circle cx="50" cy="50" r="' + r + '" fill="none" stroke="rgba(255,255,255,.45)" stroke-width="7"/><circle cx="50" cy="50" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="7" stroke-linecap="round" stroke-dasharray="' + (c * Math.max(0, Math.min(1, frac))).toFixed(1) + ' ' + c.toFixed(1) + '"' + (frac <= 0 ? ' style="display:none"' : '') + '/>'; return s; };
  UI.ring = RING;
  UI.worldMap = function (f) {
    const cards = h('div', { class: 'cards scroll x', id: 'wcards' });
    M.worlds.filter(w => !w.hidden).forEach(w => {
      const soon = !!w.soon, tot = w.missions.length * 3, got = M.save.mapStars(w), dn = M.save.done(w), th = w.theme, all = !soon && dn === w.missions.length;
      const top = h('div', { class: 'top', style: 'background:linear-gradient(' + th.c1 + ',' + th.c2 + ')' }, h('div', { class: 'medal' }, soon ? null : RING(got / tot, 46, '#fff7a8'), h('div', { class: 'art' }, ico(w.icon || 'home', soon ? 96 : 104))), soon ? h('div', { class: 'lockmark' }, h('span', null, I('lock', 48))) : null);
      const c = h('button', { class: 'card' + (soon ? ' soon' : ''), 'data-world': w.id, 'aria-label': w.title + (soon ? ': قريبًا' : ': ' + ar(got) + ' من ' + ar(tot) + ' نجمة'), style: '--c1:' + th.c1 + ';--c2:' + th.c2, onclick: () => { if (soon) { M.audio.sfx('wrong'); UI.toast('قريبًا! لسه بنجهّزه'); } else { M.audio.sfx('tap'); f.world(w.id); } } },
        top, all ? h('div', { class: 'badge-done' }, I('check', 24)) : null, h('h3', null, w.title), soon ? h('div', { class: 'sub' }, 'قريبًا') : h('div', { class: 'sub' }, I('star', 26), ar(got) + ' من ' + ar(tot)),
        soon ? null : h('div', { class: 'cnt' }, ar(dn) + ' من ' + ar(w.missions.length) + ' مهام'));
      cards.append(c);
    });
    /* pointer parallax tilt (mouse only) */
    let tiltRaf = 0, tc = null, ev = null;
    const doTilt = () => { tiltRaf = 0; if (!tc || !ev) return; const r = tc.getBoundingClientRect(), dx = (ev.clientX - r.left) / r.width - .5, dy = (ev.clientY - r.top) / r.height - .5; tc.style.setProperty('--ry', (dx * 12).toFixed(1) + 'deg'); tc.style.setProperty('--rx', (-dy * 10).toFixed(1) + 'deg'); tc.style.setProperty('--px', (dx * 10).toFixed(1) + 'px'); tc.style.setProperty('--py', (dy * 8).toFixed(1) + 'px'); };
    const untilt = c => { if (c) { c.style.setProperty('--ry', '0deg'); c.style.setProperty('--rx', '0deg'); c.style.setProperty('--px', '0px'); c.style.setProperty('--py', '0px'); } };
    cards.addEventListener('pointermove', e => { if (e.pointerType !== 'mouse' || reduced()) return; const c = e.target.closest('.card'); if (c !== tc) { untilt(tc); tc = c; } ev = e; if (c && !tiltRaf) tiltRaf = requestAnimationFrame(doTilt); });
    cards.addEventListener('pointerleave', () => { untilt(tc); tc = null; });
    const sc2 = d => () => { M.audio.sfx('tap'); cards.scrollBy({ left: d * 270, behavior: reduced() ? 'auto' : 'smooth' }); };
    const tile = (label, icon, col, fn, dot) => h('button', { class: 'tile', style: '--b:' + col[0] + ';--t:' + col[1] + ';--d:' + col[2], 'aria-label': label + (dot ? ' (جديد)' : ''), onclick: tap(fn) }, I(icon, 38), label, dot ? h('div', { class: 'ndot' }) : null);
    const el = h('div', null, hdr('خريطة المغامرات', f.back, [soundBtn(), coinPill()]), cards,
      h('button', { class: 'btn round yellow mapnav', style: 'right:6px', onclick: sc2(1), 'aria-label': 'يمين' }, I('back', 30)),
      h('button', { class: 'btn round yellow mapnav', style: 'left:6px', onclick: sc2(-1), 'aria-label': 'شمال' }, I('arrow', 30)),
      h('div', { class: 'bar' }, tile('بابا بيتصل', 'phone', ['#26a85a', '#76e0a0', '#13703a'], f.call, M.callPending && M.callPending()), tile('ألبوم الملصقات', 'album', ['#f27a0c', '#ffb24d', '#b84d06'], f.album), tile('يومياتي', 'diary', ['#0fa595', '#5fdccc', '#08766a'], f.diary), tile('تغيير الشكل', 'hanger', ['#8160ea', '#bca6ff', '#522fba'], f.closet), tile('ركن الأهل', 'parent', ['#f0457d', '#ff98b8', '#b92558'], f.parent)));
    UI.show(el, 'clear', 1); M.backdrop.mode = 'map';
    const first = cards.firstChild; if (first) cards.scrollLeft = 0;
  };

  UI.missionList = function (w, f) {
    const grid = h('div', { class: 'grid scroll', style: 'position:absolute;left:26px;right:26px;top:96px;bottom:14px;grid-template-columns:repeat(3,1fr);align-content:start;padding:6px 4px 14px' });
    w.missions.forEach((m, i) => {
      const open = M.save.unlocked(w, i), p = M.save.prog(w.id, m.id) || {};
      const c = h('button', { class: 'mcard' + (open ? '' : ' locked') + (p.done ? ' done' : ''), 'data-mission': m.id, 'aria-label': 'المهمة ' + ar(i + 1) + ': ' + m.title + (open ? '' : ' (مقفولة)'), onclick: () => { if (open) { M.audio.sfx('tap'); f.start(i); } else { M.audio.sfx('wrong'); UI.toast('خلّصوا المهمة اللي قبلها الأول'); } } },
        h('div', { class: 'num' }, p.done ? I('check', 24) : ar(i + 1)), open ? h('div', { class: 'mic' }, ico(m.icon || (m.diary && m.diary.pic) || 'star', 44)) : null, h('h4', null, m.title), open ? starRow(p.stars || 0, 28) : I('lock', 40, { color: '#8a8fa8' }));
      M.voice.pressSpeak(c, () => m.title, 'narrator');
      grid.append(c);
    });
    const el = h('div', null, hdr(w.title, f.back, [coinPill()]), grid); UI.show(el, 'clear', 2); M.backdrop.mode = 'map';
  };

  UI.result = function (r, f) {
    const coinsNow = M.save.data.coins, prevCoins = Math.max(0, coinsNow - (r.coins || 0));
    try { if (r.world && r.mission && lastBeats > 1) learn(r.world.id + '/' + r.mission.id, Math.max(3, Math.round(lastBeats))); } catch (e) { }
    const head = (M.reactions && M.reactions.pick('end' + Math.max(1, Math.min(3, r.stars || 1)), {})) || (r.stars >= 3 ? 'برافو! ممتاز!' : r.stars === 2 ? 'شاطرين أوي!' : 'أحسنتم!');
    const sts = h('div', { class: 'res-stars', role: 'img', 'aria-label': ar(r.stars) + ' من ٣ نجوم' });
    for (let i = 0; i < 3; i++) { const dl = .5 + i * .4, earn = i < r.stars; const s = h('div', { class: 'res-star' + (earn ? ' earn' : ''), style: '--dl:' + dl + 's' }, h('div', { class: 'off' }, I('star', 96, { off: true })), h('div', { class: 'on' }, I('star', 96)), h('i', { class: 'flash' })); sts.append(s); if (earn) { setTimeout(() => M.audio.sfx('star'), dl * 1000 + 150); setTimeout(() => { const rr = s.getBoundingClientRect(); const [x, y] = toLogical(rr.left + rr.width / 2, rr.top + rr.height / 2); UI.sparks(x, y, { n: 10, r: 70 }); }, dl * 1000 + 250); } }
    const hero = (id, side) => h('div', { class: 'res-hero', style: side + ':26px' }, h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:112px;height:112px', alt: '' }));
    const coinChip = h('div', { class: 'pill pop', style: 'animation-delay:1.4s' }, I('coin', 32), h('span', { class: 'v', 'data-v': 0 }, '+٠'));
    const total = h('div', { class: 'pill', 'data-ctr': 'coin', style: 'position:absolute;right:18px;top:14px;z-index:3', role: 'status', 'aria-label': 'العملات' }, I('coin', 30), h('span', { class: 'v', 'data-v': prevCoins }, ar(prevCoins)));
    const stk = r.sticker ? h('div', { class: 'pill pop light res-sticker', style: 'animation-delay:1.6s;padding:2px 16px 2px 8px;height:60px' }, A.sticker(r.sticker, 50), 'ملصق جديد: ' + ((M.stickers[r.sticker] || {}).title || '')) : null;
    const wis = r.wisdom || 'اللي يعمل خير يلاقي خير';
    const mid = h('div', { class: 'panel res-card' }, h('div', { class: 'res-ribbon' }, head), sts, h('div', { class: 'res-chips' }, coinChip, stk),
      h('div', { class: 'res-wis' }, h('div', { class: 'lab' }, 'حكمة اليوم', h('span', { class: 'spk', role: 'button', 'aria-label': 'اسمع الحكمة', style: 'cursor:pointer;margin:0', onclick: () => M.voice.speak(wis, { speaker: 'narrator', force: true }) }, I('sound', 26))), M.fmt(wis)),
      h('div', { style: 'font-size:18px;font-weight:800;opacity:.7;min-height:20px' }, r.diary ? 'اتكتبت في يومياتي' : ''),
      h('div', { class: 'res-act' }, r.hasNext ? UI.btn('المهمة الجاية', 'green big shine', f.next, 'play') : UI.btn('كمّل', 'green big shine', f.next, 'play'), UI.btn('نعيدها', 'yellow', f.retry, 'replay'), UI.btn('القائمة', 'blue', f.menu, 'home')));
    UI.show(h('div', { class: 'res-wrap' }, h('div', { class: 'res-rays' }), hero('aboody', 'left'), hero('moody', 'right'), mid, total), 'clear', 3); M.backdrop.mode = 'result'; M.backdrop.confetti();
    setTimeout(() => { const cv = coinChip.querySelector('.v'); UI.countTo(cv, r.coins || 0, 700); setTimeout(() => { cv.textContent = '+' + ar(r.coins || 0); }, 750); }, 1500);
    setTimeout(() => { const rr = coinChip.getBoundingClientRect(), [x, y] = toLogical(rr.left + rr.width / 2, rr.top + rr.height / 2); UI.flyTo('coin', x, y, { n: Math.min(6, 2 + (r.coins || 0)), onArrive: () => UI.countTo(total.querySelector('.v'), coinsNow, 600) }); }, 2300);
    setTimeout(() => M.voice.speakSeq([head, 'حكمة اليوم', wis], { speaker: 'narrator' }), 700);
  };

  UI.celebrate = function (w, f) {
    const el = h('div', { class: 'res-wrap' }, h('div', { class: 'res-rays' }), h('div', { class: 'panel cel-card' },
      h('div', { class: 'title', style: 'font-size:60px' }, 'مبروك!'), h('div', { style: 'font-size:34px;font-weight:900' }, 'خلّصتوا كل مهام ' + w.title), (w.finalSticker ? h('div', { style: 'animation:floaty 3s ease-in-out infinite' }, A.sticker(w.finalSticker, 150)) : null),
      h('div', { style: 'font-size:27px;font-weight:900;color:#b8520a' }, 'بقيتوا أبطال ' + w.title + '!'), h('div', { class: 'row' }, UI.btn('خريطة المغامرات', 'green shine', f.map, 'play'), UI.btn('نعيد مهمة', 'yellow', f.menu, 'replay'))));
    UI.show(el, 'clear', 3); M.backdrop.mode = 'result'; M.backdrop.confetti(); M.audio.sfx('fanfare'); M.audio.cheer('big');
    let n = 0; const iv = setInterval(() => { if (++n > 6 || !el.isConnected) clearInterval(iv); M.backdrop.confetti(); }, 900);
  };

  UI.album = function (f) {
    const ids = Object.keys(M.stickers), have = M.save.data.stickers, cnt = ids.filter(i => have[i]).length;
    const grid = h('div', { class: 'grid scroll', style: 'position:absolute;left:30px;right:30px;top:96px;bottom:16px;grid-template-columns:repeat(5,1fr);align-content:start;padding:10px 4px 14px;gap:14px' });
    ids.forEach(id => { const s = M.stickers[id], ok = !!have[id]; grid.append(h('button', { class: 'mcard' + (ok ? ' done' : ' locked'), 'aria-label': ok ? s.title : 'ملصق مخفي', style: 'height:170px;padding:6px', onclick: () => { M.audio.sfx('pop'); UI.toast(ok ? s.title : 'ملصق مخفي! كمّل المهام'); } }, A.sticker(id, 104, !ok), h('div', { style: 'font-size:20px;font-weight:900;margin-top:4px' }, ok ? s.title : '؟'))); });
    UI.show(h('div', null, hdr('ألبوم الملصقات: ' + ar(cnt) + ' من ' + ar(ids.length), f.back), grid), 'clear', 2); M.backdrop.mode = 'map';
  };

  UI.diary = function (f) {
    const list = M.save.data.diary.slice().reverse();
    const grid = h('div', { class: 'grid scroll', style: 'position:absolute;left:30px;right:30px;top:96px;bottom:16px;grid-template-columns:repeat(3,1fr);align-content:start;padding:10px 4px 14px;gap:20px' });
    if (!list.length) grid.append(h('div', { class: 'panel', style: 'grid-column:1/4;padding:30px;font-size:30px;font-weight:900;text-align:center' }, 'يومياتي لسه فاضية. خلّصوا مهمة وهتتملي بالصور!'));
    list.forEach((e, i) => { const p = h('div', { class: 'polaroid', style: 'transform:rotate(' + ((i % 3) - 1) * 1.6 + 'deg)' }, h('div', { style: 'background:#fff3c4;border-radius:6px;height:130px;display:flex;align-items:center;justify-content:center' }, ico(e.pic || 'star', 110)), h('div', { style: 'font-size:22px;font-weight:900;margin-top:8px;line-height:1.25;min-height:58px' }, M.fmt(e.text)), h('div', { style: 'font-size:17px;opacity:.6;font-weight:800' }, e.date || '')); grid.append(p); });
    UI.show(h('div', null, hdr('يومياتي', f.back), grid), 'clear', 2); M.backdrop.mode = 'map';
  };

  UI.closet = function (f) {
    let who = M.save.data.hero || 'moody', tab = 'hat';
    const sd = M.save.data, left = h('div', { style: 'position:absolute;left:30px;top:100px;width:290px;bottom:20px;pointer-events:none' }), right = h('div', { class: 'panel', style: 'position:absolute;right:26px;left:350px;top:100px;bottom:20px;padding:10px 14px' });
    const pv = h('canvas', { width: 580, height: 600, style: 'width:290px;height:300px;border-radius:30px;background:linear-gradient(#bfe8ff,#fff3c4);border:3px solid var(--line);box-shadow:var(--sh-2);pointer-events:auto' });
    const g = pv.getContext('2d'); const drawPv = () => { g.setTransform(2, 0, 0, 2, 0, 0); g.clearRect(0, 0, 290, 300); const eq = sd.cosm.eq[who] || {}; G.ell(g, 145, 268, 70, 14, 'rgba(60,30,10,.2)', 0); M.chars.draw(g, who, 145, 268, { anim: 'cheer', t: M.time * .6, hat: eq.hat, shirtId: eq.shirt, sc: { moody: 1.2, aboody: 1.55, toota: 1.3, nemo: 1.55 }[who] || 1.3 }); };
    const tabs = h('div', { class: 'row', style: 'margin-bottom:8px' }), tabsA = h('div', { class: 'row', style: 'gap:8px;margin-top:12px;pointer-events:auto' });
    const grid = h('div', { class: 'grid scroll', style: 'grid-template-columns:repeat(4,1fr);gap:12px;height:330px;align-content:start;padding:4px' });
    left.append(pv, tabsA);
    function owned(id) { return sd.cosm.owned.indexOf(id) >= 0; }
    function render() {
      tabsA.textContent = ''; tabsA.style.flexWrap = 'wrap'; M.chars.playable().forEach(id => tabsA.append(h('button', { class: 'chip', 'data-who': id, 'aria-pressed': who === id ? 'true' : 'false', style: 'cursor:pointer;font-size:18px;min-height:46px;padding:2px 10px 2px 3px;gap:4px;' + (who === id ? 'background:linear-gradient(#ffe98a,#ffc928)' : ''), onclick: () => { who = id; M.audio.sfx('pop'); M.voice.speak(sd.names[id] || M.chars.defs[id].name, { speaker: 'narrator' }); render(); } }, M.chars.defs[id].img ? h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:36px;height:36px;border-width:2px;box-shadow:none' }) : ico('face:' + id, 38), sd.names[id] || M.chars.defs[id].name)));
      tabs.textContent = ''; [['hat', 'القبعات'], ['shirt', 'الألوان']].forEach(t => tabs.append(h('button', { class: 'btn sm ' + (tab === t[0] ? 'orange' : 'gray'), onclick: tap(() => { tab = t[0]; render(); }) }, t[1])));
      tabs.append(h('div', { style: 'margin-right:auto' }, coinPill()));
      grid.textContent = ''; const eq = sd.cosm.eq[who];
      const items = [{ id: null, name: 'من غير', price: 0 }].concat(Object.values(tab === 'hat' ? M.chars.hats : M.chars.shirts).filter(it => !it.for || it.for.indexOf(who) >= 0));
      items.forEach(it => {
        const have = it.id == null || owned(it.id), on = (eq[tab] || null) === it.id;
        const icon = it.id == null ? I('x', 52, { color: '#b9a98a' }) : tab === 'hat' ? hatIcon(it) : A.el('tee', 64, { color: it.color });
        const b = h('button', { class: 'mcard' + (on ? ' done' : ''), 'data-item': it.id || 'none', 'aria-label': it.name + (have ? '' : ' (' + ar(it.price) + ' عملة)'), style: 'height:150px;padding:4px;' + (on ? 'background:linear-gradient(#f2fff3,#c9f5cf)' : ''), onclick: () => {
          if (!have) { if (sd.coins < it.price) { M.audio.sfx('wrong'); UI.toast('محتاجين عملات أكتر! كمّلوا المهام'); return; } sd.coins -= it.price; sd.cosm.owned.push(it.id); M.audio.sfx('coin'); }
          else M.audio.sfx('pop');
          eq[tab] = it.id; M.save.commit(); render();
        } }, icon, h('div', { style: 'font-size:17px;font-weight:900' }, it.name), have ? (on ? I('check', 28, { color: '#1f8c3d' }) : h('div', { style: 'font-size:18px;font-weight:900;color:#1d7f33' }, it.id == null ? '' : 'البس')) : h('div', { class: 'pill light', style: 'height:32px;padding:0 10px;font-size:19px;border-width:2px' }, I('coin', 22), ar(it.price)));
        grid.append(b);
      });
    }
    right.append(tabs, grid); render();
    UI.show(h('div', null, hdr('تغيير الشكل', f.back), left, right), 'clear', 2); M.backdrop.mode = 'map'; UI.previews.push(drawPv);
  };
  function hatIcon(it) { const c = document.createElement('canvas'); c.width = c.height = 128; c.style.width = c.style.height = '64px'; const g = c.getContext('2d'); g.scale(2, 2); g.translate(32, 52); g.lineJoin = 'round'; g.lineWidth = 3; g.strokeStyle = M.OL; it.draw(g, 22); return c; }
  A.registerAll({ tee(g, o) { const c = o.color || '#9ea4ab'; G.poly(g, [[-18, -32], [-6, -38], [6, -38], [18, -32], [42, -14], [32, 6], [20, -2], [20, 38], [-20, 38], [-20, -2], [-32, 6], [-42, -14]], c, 5); g.beginPath(); g.arc(0, -38, 9, 0, Math.PI); G.fs(g, G.shade(c, -.2), 3); } });

  UI.parent = function (f) {
    const sd = M.save.data; let tw = 0, tm = 0, stars = 0; M.worlds.forEach(w => { if (!w.soon && !w.hidden) { tw += w.missions.length; tm += M.save.done(w); stars += M.save.mapStars(w); } });
    const stat = (l, v) => h('div', { class: 'chip', style: 'font-size:21px;min-height:46px' }, l + ': ', h('b', null, v));
    const bars = (info, data, title) => { const box = h('div', { style: 'margin:10px 0' }, h('div', { style: 'font-size:27px;font-weight:900;margin-bottom:6px' }, title)); const keys = Object.keys(info), mx = Math.max(3, ...keys.map(k => data[k] || 0)); keys.forEach(k => { const v = data[k] || 0; box.append(h('div', { style: 'display:flex;align-items:center;gap:10px;margin:5px 0;text-align:right' }, h('div', { style: 'flex:0 0 190px;font-size:21px;font-weight:900' }, info[k].label), h('div', { style: 'flex:1' }, h('div', { class: 'pbar', style: 'height:20px' }, h('i', { style: 'width:' + Math.round(100 * v / mx) + '%' })), h('div', { style: 'font-size:17px;opacity:.75;font-weight:800;margin-top:2px' }, info[k].desc)), h('div', { style: 'flex:0 0 40px;font-size:24px;font-weight:900' }, ar(v)))); }); return box; };
    const tiers = [['auto', 'تلقائي (حسب البطل)'], ['6', 'مستوى ٦ سنين'], ['9', 'مستوى ٩ سنين']];
    const tierRow = h('div', { class: 'row', style: 'flex-wrap:wrap;gap:10px' }); const drawTier = () => { tierRow.textContent = ''; tiers.forEach(t => tierRow.append(h('button', { class: 'btn sm ' + (String(sd.settings.tier) === t[0] ? 'green' : 'gray'), 'aria-pressed': String(sd.settings.tier) === t[0] ? 'true' : 'false', onclick: tap(() => { sd.settings.tier = t[0]; M.save.commit(); drawTier(); }) }, t[1]))); }; drawTier();
    const tog = (label, key) => { const b = h('button', { class: 'btn sm', onclick: tap(() => { sd.settings[key] = !(sd.settings[key] !== false); M.save.commit(); up(); }) }); const up = () => { const on = sd.settings[key] !== false; b.className = 'btn sm ' + (on ? 'green' : 'gray'); b.setAttribute('aria-pressed', on ? 'true' : 'false'); b.textContent = label + (on ? ': شغّال' : ': مقفول'); }; up(); return b; };
    const body = h('div', { class: 'scroll panel', style: 'position:absolute;left:30px;right:30px;top:96px;bottom:16px;padding:14px 22px;text-align:right' },
      h('div', { style: 'font-size:21px;font-weight:800;opacity:.8;margin-bottom:8px;line-height:1.5' }, 'اللعبة بتزرع القيم من خلال مواقف القصة من غير وعظ. هنا ملخص لِما اتدرّب عليه الأطفال. كل البيانات محفوظة على الجهاز فقط ولا تُرسل لأي مكان.'),
      h('div', { class: 'row', style: 'flex-wrap:wrap;gap:8px' }, stat('المهام', ar(tm) + '/' + ar(tw)), stat('النجوم', ar(stars)), stat('العملات', ar(sd.coins)), stat('الملصقات', ar(Object.keys(sd.stickers).length)), stat('صفحات اليوميات', ar(sd.diary.length))),
      bars(M.values, sd.valuesPracticed, 'القيم والعادات اللي اتمرّنوا عليها'), bars(M.skillsInfo, sd.skills, 'المهارات (عدد الألغاز اللي اتحلّت)'),
      h('div', { style: 'font-size:27px;font-weight:900;margin:12px 0 6px' }, 'مستوى الألغاز'), tierRow,
      h('div', { style: 'font-size:18px;opacity:.7;font-weight:800;margin:6px 0' }, 'تلقائي: عبودي (٦ سنين) بيجاوب ألغاز أسهل ومودي (٩ سنين) ألغاز أصعب.'),
      h('div', { class: 'row', style: 'margin:12px 0;flex-wrap:wrap' }, tog('الصوت', 'sound'), tog('صوت التعليمات', 'narr'), tog('تشجيع بصوت بشري', 'voice'), UI.btn('تغيير الأسماء', 'blue', f.names, 'settings')),
      h('div', { class: 'row', style: 'margin:18px 0 8px' }, UI.btn('مسح كل التقدّم', 'red', () => { UI.confirm('متأكد إنك عايز تمسح كل النجوم والملصقات واليوميات؟', 'أيوه، امسح', 'لأ').then(ok => { if (ok) { M.save.reset(); M.save.load(); UI.toast('اتمسح كل حاجة'); f.reset(); } }); })));
    UI.show(h('div', null, hdr('ركن الأهل', f.back), body), 'clear', 2); M.backdrop.mode = 'map';
  };

  UI.pause = function (f) {
    const mo = UI.modal([h('h2', null, 'استراحة'), h('div', { class: 'col' },
      UI.btn('كمّل اللعب', 'green big', () => { mo.close(); f.resume(); }, 'play'), UI.btn('نبدأ المهمة من جديد', 'yellow', () => { mo.close(); f.restart(); }, 'replay'), UI.btn('قائمة المهام', 'blue', () => { mo.close(); f.quit(); }, 'home'),
      f.canSkip ? UI.btn('تخطّي المهمة', 'gray sm', () => { mo.close(); f.skip(); }) : null, h('div', { class: 'row' }, soundBtn(), UI.narrBtn(), hubLink()))], { label: 'استراحة', onEsc: () => { mo.close(); f.resume(); } });
    return mo;
  };

  /* mission-intro card (built by ctx.titleCard): upgrade it to the "mission card" look */
  new MutationObserver(ms => ms.forEach(m => m.addedNodes.forEach(n => {
    if (n.nodeType !== 1 || !n.classList.contains('panel') || n.classList.contains('introcard') || !n.firstElementChild || !n.firstElementChild.classList.contains('title') || !/z-index:\s*40/.test(n.getAttribute('style') || '')) return;
    const t = n.firstElementChild.textContent, sub = n.children[1] ? n.children[1].textContent : '', mt = /^\S+\s+(\S+):\s*(.*)$/.exec(t) || [null, '', t];
    n.className = 'panel introcard'; n.textContent = ''; n.append(h('div', { class: 'band' }, mt[1] ? h('div', { class: 'nb' }, mt[1]) : null, h('div', null, h('div', { class: 'lb' }, 'المهمة'), h('div', { class: 'tt' }, mt[2]))), h('div', { class: 'sb' }, sub));
    UI.sparks(480, 190, { n: 10, r: 110 });
  }))).observe(over, { childList: true });

  /* ============ menu backdrop (canvas scene used outside missions) ============ */
  let vig = null;
  const vignette = () => { if (vig) return vig; vig = document.createElement('canvas'); vig.width = 480; vig.height = 270; const c = vig.getContext('2d'), g = c.createRadialGradient(240, 135, 80, 240, 135, 290); g.addColorStop(0, 'rgba(40,20,90,0)'); g.addColorStop(1, 'rgba(40,20,90,.34)'); c.fillStyle = g; c.fillRect(0, 0, 480, 270); return vig; };
  M.backdrop = {
    t: 0, mode: 'title', stage: null,
    init() { this.stage = new M.Stage(); this.stage.showActive = false; },
    confetti() { if (this.stage) this.stage.confetti(); },
    update(dt) { this.t += dt; const s = this.stage; if (!s) return; s.update(dt); const m = s.heroes.moody, a = s.heroes.aboody; m.visible = a.visible = this.mode === 'title'; if (this.mode === 'title') { m.x = 835; m.y = 526; a.x = 125; a.y = 530; m.sc = a.sc = 1.25; m.fa = a.fa = (Math.floor(this.t / 3) % 2 ? 'cheer' : 'wave'); m.fat = a.fat = 1; a.dir = 1; m.dir = -1; } },
    draw(g) {
      const t = this.t, m = this.mode;
      const sky = m === 'title' ? ['#6fc8ff', '#c4ecff', '#fff1c6'] : m === 'result' ? ['#7a63e8', '#ff9ec1', '#ffe0a0'] : ['#8fd6ff', '#cdeeff', '#fff0c8'];
      g.fillStyle = G.lin(g, 0, 0, 0, 540, sky); g.fillRect(0, 0, 960, 540);
      /* sun with slow rays */
      const sx = 800, sy = 96; g.save(); g.translate(sx, sy); g.rotate(t * .08); g.fillStyle = 'rgba(255,248,200,.30)'; for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(0, 0); g.lineTo(-34, -420); g.lineTo(34, -420); g.closePath(); g.fill(); } g.restore();
      G.sun(g, sx, sy, 42, t);
      for (let i = 0; i < 5; i++) G.cloud(g, ((i * 260 + t * 14) % 1300) - 150, 80 + (i % 3) * 70, 1.1 + (i % 2) * .4, .85);
      /* twinkles */
      for (let i = 0; i < 9; i++) { const k = (Math.sin(t * 1.6 + i * 2.3) + 1) / 2; G.sparkle(g, 60 + ((i * 107) % 840), 120 + ((i * 61) % 220), 4 + k * 6, '#fff', .25 + k * .5); }
      /* parallax hills */
      const hill = (col, y0, amp, ph, par) => { g.fillStyle = col; g.beginPath(); g.moveTo(0, 540); for (let x = 0; x <= 960; x += 40) g.lineTo(x, y0 + Math.sin(x / 150 + ph + t * par) * amp); g.lineTo(960, 540); g.closePath(); g.fill(); };
      hill('#b3e3a3', 410, 22, 0, .02); hill('#97d98c', 450, 18, 2, .035); hill('#79cc72', 494, 12, 4, .05);
      if (this.stage) { this.stage.bg = null; this.stage.draw(g, t); }
      g.drawImage(vignette(), 0, 0, 960, 540);
    }
  };
  M.hooks.frame.push(() => { if (UI.previews.length) UI.previews.forEach(f => f()); });
})();
