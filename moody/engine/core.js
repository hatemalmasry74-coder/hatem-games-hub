/* Moody & Aboody - engine/core.js
   Global namespace, utils, save, fixed-timestep loop, input, tweens, registries. */
(function () {
  'use strict';
  const M = window.Moody = window.Moody || {};
  M.W = 960; M.H = 540; M.VERSION = 1; M.SAVE_KEY = 'hub_moody_v1';
  M.FONT = 'Tahoma, Arial, sans-serif';
  M.OL = '#4a2e1c';           // outline colour (warm dark brown)
  M.pal = { ink: '#3a2a1e', cream: '#fff7e3', orange: '#ff8a2a', teal: '#1fb5a6', pink: '#ff6f91', yellow: '#ffc93c', navy: '#2b3a67', green: '#5cc96b', purple: '#8a6bd6', sky: '#8fd6ff', red: '#ef5350', brown: '#8a5a3a' };

  /* ---------- utils ---------- */
  const U = M.util = {
    clamp: (v, a, b) => Math.max(a, Math.min(b, v)),
    lerp: (a, b, t) => a + (b - a) * t,
    rnd: (a, b) => a + Math.random() * (b - a),
    rndi: (a, b) => Math.floor(a + Math.random() * (b - a + 1)),
    pick: a => a[Math.floor(Math.random() * a.length)],
    shuffle: a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = a[i]; a[i] = a[j]; a[j] = t; } return a; },
    dist: (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1),
    ease: {
      lin: t => t, outCubic: t => 1 - Math.pow(1 - t, 3), inCubic: t => t * t * t,
      inOut: t => t < .5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2,
      outBack: t => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
      outBounce: t => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + .75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + .9375; return n * (t -= 2.625 / d) * t + .984375; }
    },
    ar: n => String(n).replace(/\d/g, d => '٠١٢٣٤٥٦٧٨٩'[d])
  };

  /* ---------- registries ---------- */
  M.kits = {}; M.worlds = []; M.stickers = {}; M.banks = {}; M.values = {}; M.skillsInfo = {}; M.load = [];
  M.registerWorld = function (def) {
    if (!def || !def.id || !Array.isArray(def.missions)) throw new Error('registerWorld: id+missions required');
    def.order = def.order || 99; def.theme = def.theme || { c1: '#ffb347', c2: '#ff8a2a' };
    const i = M.worlds.findIndex(w => w.id === def.id);
    if (i >= 0) M.worlds[i] = def; else M.worlds.push(def);
    M.worlds.sort((a, b) => a.order - b.order);
    (def.stickers || []).forEach(M.registerSticker);
    return def;
  };
  /* stub (coming soon) worlds: {id,title,icon,order,theme} */
  M.plan = function (arr) { arr.forEach(d => { if (!M.worlds.some(w => w.id === d.id)) { d.soon = true; d.missions = d.missions || []; M.worlds.push(d); } }); M.worlds.sort((a, b) => a.order - b.order); };
  M.getWorld = id => M.worlds.find(w => w.id === id);
  M.registerSticker = s => { M.stickers[s.id] = s; };
  M.registerValue = (tag, info) => { M.values[tag] = info; };
  M.registerSkill = (tag, info) => { M.skillsInfo[tag] = info; };
  /* question banks: schema in DEV.md */
  M.registerQuestions = function (arr) { arr.forEach(q => { M.banks[q.id] = q; }); };
  M.fmt = s => { const n = M.save.data.names; return String(s).replace(/\{m\}/g, n.moody).replace(/\{a\}/g, n.aboody).replace(/\{me\}/g, n.me || 'يا بطل'); };

  /* ---------- save ---------- */
  function defaults() {
    return { v: 1, names: { moody: 'مودي', aboody: 'عبودي', me: '' }, named: false, hero: 'moody', progress: {}, coins: 0, stickers: {}, diary: [],
      cosm: { owned: [], eq: { moody: {}, aboody: {} } }, settings: { sound: true, voice: true, tier: 'auto' }, skills: {}, valuesPracticed: {}, seen: {}, lastQ: '' };
  }
  const S = M.save = {
    data: defaults(),
    load() {
      try {
        const raw = localStorage.getItem(M.SAVE_KEY);
        if (raw) { const d = JSON.parse(raw), def = defaults(); S.data = Object.assign(def, d); ['names', 'cosm', 'settings'].forEach(k => S.data[k] = Object.assign(def[k], d[k] || {})); S.data.cosm.eq = Object.assign({ moody: {}, aboody: {} }, S.data.cosm.eq); }
      } catch (e) { S.data = defaults(); }
      try { const n = localStorage.getItem('hubPlayerName'); if (n && !S.data.names.me) S.data.names.me = String(n).slice(0, 14); } catch (e) { }
    },
    commit() { try { localStorage.setItem(M.SAVE_KEY, JSON.stringify(S.data)); } catch (e) { } },
    reset() { S.data = defaults(); S.commit(); },
    prog(wid, mid) { return S.data.progress[wid + '/' + mid] || null; },
    mapStars(w) { return w.missions.reduce((a, m) => a + ((S.prog(w.id, m.id) || {}).stars || 0), 0); },
    done(w) { return w.missions.filter(m => (S.prog(w.id, m.id) || {}).done).length; },
    unlocked(w, i) { if (M.urlUnlock) return true; return i === 0 || !!(S.prog(w.id, w.missions[i - 1].id) || {}).done; },
    addCoins(n) { S.data.coins = Math.max(0, S.data.coins + n); S.commit(); }
  };

  /* ---------- tweens & timers (game-time based, pause-safe) ---------- */
  const jobs = [];
  M.time = 0; M.paused = false;
  M.tw = function (obj, to, dur, ease, delay) {
    ease = U.ease[ease || 'outCubic'] || ease || U.ease.outCubic;
    return new Promise(res => { jobs.push({ obj, to, from: null, dur: Math.max(.001, dur), t: -(delay || 0), ease, res }); });
  };
  M.wait = function (sec) { return new Promise(res => jobs.push({ wait: true, dur: sec, t: 0, res })); };
  function stepJobs(dt) {
    for (let i = jobs.length - 1; i >= 0; i--) {
      const j = jobs[i]; j.t += dt;
      if (j.t < 0) continue;
      if (j.wait) { if (j.t >= j.dur) { jobs.splice(i, 1); j.res(); } continue; }
      if (!j.from) { j.from = {}; for (const k in j.to) j.from[k] = j.obj[k]; }
      const p = Math.min(1, j.t / j.dur), e = j.ease(p);
      for (const k in j.to) j.obj[k] = j.from[k] + (j.to[k] - j.from[k]) * e;
      if (p >= 1) { jobs.splice(i, 1); j.res(); }
    }
  }

  /* ---------- scene, loop, input ---------- */
  M.scene = null; M.hooks = { frame: [], step: [] };
  M.setScene = s => { M.scene = s; };
  const cv = M.cv = document.getElementById('c'); const g = M.g = cv.getContext('2d');
  const DT = 1 / 60; let acc = 0, last = 0;
  function step(dt) {
    M.time += dt; stepJobs(dt);
    if (M.scene && M.scene.update) M.scene.update(dt);
    for (const f of M.hooks.step) f(dt);
  }
  function render() {
    const k = cv.width / M.W;
    g.setTransform(k, 0, 0, k, 0, 0); g.clearRect(0, 0, M.W, M.H);
    g.lineJoin = 'round'; g.lineCap = 'round'; g.direction = 'rtl';
    if (M.scene && M.scene.draw) M.scene.draw(g, M.time);
    for (const f of M.hooks.frame) f();
  }
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts; let d = (ts - last) / 1000; last = ts;
    if (d > .25) d = .25;
    if (document.hidden) return;
    acc += d; let n = 0;
    while (acc >= DT && n < 6) { if (!M.paused) step(DT); acc -= DT; n++; }
    if (n >= 6) acc = 0;
    render();
  }
  M.start = () => requestAnimationFrame(frame);
  M.stepOnce = n => { for (let i = 0; i < n; i++) step(DT); render(); }; // test helper

  /* responsive: logical 960x540 scaled to fit (letterbox), DPR capped at 2 */
  const app = document.getElementById('app'), ui = document.getElementById('ui');
  M.isTouch = (navigator.maxTouchPoints > 0 && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window && matchMedia('(pointer:coarse)').matches);
  if (M.isTouch) document.body.classList.add('touch');
  M.scale = 1;
  function resize() {
    const vw = app.clientWidth || innerWidth, vh = app.clientHeight || innerHeight, s = Math.min(vw / M.W, vh / M.H);
    M.scale = s;
    cv.style.width = (M.W * s) + 'px'; cv.style.height = (M.H * s) + 'px';
    ui.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    const dpr = Math.min(window.devicePixelRatio || 1, 2), pw = Math.round(M.W * s * dpr), nw = Math.max(M.W, Math.min(pw, 1920));
    if (cv.width !== nw) { cv.width = nw; cv.height = Math.round(nw * M.H / M.W); }
    document.getElementById('rot').style.display = (M.isTouch && innerHeight > innerWidth) ? 'flex' : 'none';
  }
  addEventListener('resize', resize); addEventListener('orientationchange', () => setTimeout(resize, 200)); resize(); M.resize = resize;
  ['gesturestart', 'dblclick', 'contextmenu'].forEach(e => document.addEventListener(e, ev => ev.preventDefault()));
  document.addEventListener('touchmove', e => { if (e.target.closest && e.target.closest('.scroll')) return; e.preventDefault(); }, { passive: false });

  function pos(e) { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * M.W / r.width, (e.clientY - r.top) * M.H / r.height]; }
  M.pointers = new Map();
  cv.addEventListener('pointerdown', e => {
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) { }
    M.audio && M.audio.init();
    const [x, y] = pos(e); M.pointers.set(e.pointerId, { x, y });
    if (M.scene && M.scene.down) M.scene.down(x, y, e.pointerId, e);
  });
  cv.addEventListener('pointermove', e => {
    if (!M.pointers.has(e.pointerId) && e.pointerType !== 'mouse') return;
    const [x, y] = pos(e); M.pointers.set(e.pointerId, { x, y });
    if (M.scene && M.scene.move) M.scene.move(x, y, e.pointerId, e);
  });
  const up = e => {
    const [x, y] = pos(e); M.pointers.delete(e.pointerId);
    if (M.scene && M.scene.up) M.scene.up(x, y, e.pointerId, e);
  };
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  document.addEventListener('pointerdown', () => M.audio && M.audio.init(), true);
  document.addEventListener('visibilitychange', () => { last = 0; });
  M.keys = [];
  addEventListener('keydown', e => { for (const f of M.keys) if (f(e)) { e.preventDefault(); return; } });

  M.urlUnlock = /[?&]unlock=1/.test(location.search);
})();
