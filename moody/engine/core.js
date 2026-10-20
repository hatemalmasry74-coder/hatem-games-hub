/* Moody & Aboody - engine/core.js
   Global namespace, utils, save, fixed-timestep loop, input, tweens, registries. */
(function () {
  'use strict';
  const M = window.Moody = window.Moody || {};
  M.W = 960; M.H = 540; M.VERSION = 10; M.SAVE_KEY = 'hub_moody_v1';
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
  M.fmt = s => { const n = M.save.data.names; return String(s).replace(/\{m\}/g, n.moody).replace(/\{a\}/g, n.aboody).replace(/\{t\}/g, n.toota || 'توتا').replace(/\{n\}/g, n.nemo || 'نيمو').replace(/\{me\}/g, n.me || 'يا بطل'); };

  /* ---------- save ---------- */
  function defaults() {
    return { v: 1, names: { moody: 'مودي', aboody: 'عبودي', me: '', toota: 'توتا', nemo: 'نيمو', nana: 'ننا زوزا', baba: 'بابا' }, named: false, hero: 'moody', progress: {}, coins: 0, stickers: {}, diary: [],
      cosm: { owned: [], eq: { moody: {}, aboody: {}, toota: {}, nemo: {} } }, settings: { sound: true, voice: true, narr: true, tier: 'auto', quality: 'auto', reduceMotion: null }, skills: {}, valuesPracticed: {}, seen: {}, lastQ: '', callDay: '', callId: '', callCount: 0 };
  }
  const S = M.save = {
    data: defaults(), ok: true,   // ok = false when localStorage is unavailable (private mode, blocked site data): the game keeps working in memory only
    load() {
      try {
        const k = '__moody_t'; localStorage.setItem(k, '1'); localStorage.removeItem(k); S.ok = true;
        const raw = localStorage.getItem(M.SAVE_KEY);
        if (raw) { const d = JSON.parse(raw), def = defaults(); S.data = Object.assign(def, d); ['names', 'cosm', 'settings'].forEach(k => S.data[k] = Object.assign(def[k], d[k] || {})); S.data.cosm.eq = Object.assign({ moody: {}, aboody: {}, toota: {}, nemo: {} }, S.data.cosm.eq); }
      } catch (e) { S.ok = false; if (!S.data || !S.data.names) S.data = defaults(); }
      try { const n = localStorage.getItem('hubPlayerName'); if (n && !S.data.names.me) S.data.names.me = String(n).slice(0, 14); } catch (e) { }
    },
    commit() { try { localStorage.setItem(M.SAVE_KEY, JSON.stringify(S.data)); if (!S.ok) S.ok = true; } catch (e) { S.ok = false; } },
    reset() { const st = S.data.settings || {}, keep = { quality: st.quality, reduceMotion: st.reduceMotion }; S.data = defaults(); S.data.settings.quality = keep.quality || 'auto'; S.data.settings.reduceMotion = keep.reduceMotion == null ? null : keep.reduceMotion; S.commit(); },
    prog(wid, mid) { return S.data.progress[wid + '/' + mid] || null; },
    mapStars(w) { return w.missions.reduce((a, m) => a + ((S.prog(w.id, m.id) || {}).stars || 0), 0); },
    done(w) { return w.missions.filter(m => (S.prog(w.id, m.id) || {}).done).length; },
    unlocked(w, i) { if (M.urlUnlock || M.ent.skipChain()) return true; return i === 0 || !!(S.prog(w.id, w.missions[i - 1].id) || {}).done; },
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

  /* =====================================================================================================
     QUALITY SYSTEM  (Moody.quality)   setting: 'auto' | 'high' | 'medium' | 'low'  (saved in save.data.settings.quality, default 'auto')
       Moody.quality.level     effective level 'high'|'medium'|'low'   (runner.js etc. read this; Moody.quality.lite() === (level === 'low'))
       Moody.quality.set(setting[, {fixed, silent, nosave}])   applies instantly (no reload); fixed/nosave = do not persist (tests, ?q=low)
       Moody.quality.on(fn)    fn(level, prevLevel, reason) on every change (also fires window 'moody-quality' CustomEvent)
       Moody.quality.p / Moody.fx   the numbers every renderer reads (see PROFILES)
     'auto' = start from a device guess (cores / memory / DPR / mobile UA), then a frame-time monitor downgrades (and, with hysteresis, upgrades again).
     Reduced motion: Moody.setReduced(true|false|null)  null = follow prefers-reduced-motion.  Moody.reduced is the effective boolean. URL: ?q=low|medium|high  ?motion=0
     ===================================================================================================== */
  const FX = M.fx = M.fx || {};
  const PROFILES = {
    //            device-pixel-ratio cap, backing px per logical px cap, far/near bake scale, parallax, decorative ambient on, ambient count factor, shadow style, painted gradients, analyser lip-sync, bg-actor refresh every N frames, particle factor, transition style
    high:   { dpr: 2,   kmax: 2,   bake: .5,  parallax: true,  amb: true,  ambN: 1,  shadow: 'soft', paint: true,  lipsync: true,  idle: 1, fg: 1, crowd: 1, parts: 1,   trans: 'full', ui: 1 },
    medium: { dpr: 1.5, kmax: 1.5, bake: .5,  parallax: true,  amb: true,  ambN: .6, shadow: 'soft', paint: true,  lipsync: true,  idle: 2, fg: 1, crowd: 2, parts: .6,  trans: 'full', ui: 1 },
    low:    { dpr: 1,   kmax: 1,   bake: .34, parallax: false, amb: false, ambN: .5, shadow: 'flat', paint: false, lipsync: false, idle: 4, fg: 2, crowd: 3, parts: .35, trans: 'fast', ui: 0 }
  };
  const ORDER = ['low', 'medium', 'high'], Q = M.quality = { levels: ORDER, profiles: PROFILES, setting: 'auto', level: 'high', fixed: false, auto: true, p: PROFILES.high, guess: 'high', listeners: [], autoDowns: 0, perf: { fps: 60, ms: 16.7, js: 0 } };
  const qs = /[?&]q=(low|medium|high|auto)\b/.exec(location.search);
  FX.ambient = true; FX.parallax = true; FX.motion = true; FX.shadows = true; FX.glow = true;
  /* initial guess from the device: cores, memory, DPR, mobile UA (headless / unknown -> high) */
  Q.detect = function () {
    let score = 2; const n = navigator, ua = n.userAgent || '', mobile = /Android|iPhone|iPad|iPod|Mobile|Silk/i.test(ua) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1), ios = /iPhone|iPad|iPod/i.test(ua) || (n.platform === 'MacIntel' && n.maxTouchPoints > 1);
    const cores = n.hardwareConcurrency || 4, mem = n.deviceMemory || (ios ? 3 : 4), dpr = window.devicePixelRatio || 1;
    if (mobile) score -= 1;
    if (cores <= 2 || mem <= 2) score -= 2; else if (mobile ? (cores <= 4 || mem <= 3) : mem <= 3) score -= 1;
    if (ios && cores >= 6) score += 1;
    if (mobile && !ios && dpr >= 2.5 && mem <= 4) score -= 1;   // many pixels on a small GPU
    try { if (n.connection && n.connection.saveData) score -= 1; } catch (e) { }
    return ORDER[Math.max(0, Math.min(2, score))];
  };
  Q.lite = () => Q.level === 'low';
  Q.on = fn => { Q.listeners.push(fn); return () => { const i = Q.listeners.indexOf(fn); if (i >= 0) Q.listeners.splice(i, 1); }; };
  function applyProfile(prev, reason) {
    const p = Q.p = PROFILES[Q.level];
    FX.dpr = p.dpr; FX.kmax = p.kmax; FX.bake = p.bake; FX.parallax = p.parallax; FX.ambient = p.amb && !/[?&]ambient=0/.test(location.search); FX.ambK = p.ambN; FX.shadowMode = p.shadow; FX.paint = p.paint; FX.lipsync = p.lipsync; FX.idleEvery = p.idle; FX.fgEvery = p.fg; FX.crowdAdd = p.crowd; FX.parts = p.parts; FX.trans = p.trans;
    const b = document.body; if (b) { ORDER.forEach(l => b.classList.toggle('q-' + l, l === Q.level)); }
    try { if (M.chars && M.chars.setReduced) M.chars.setReduced(M.reduced || Q.level === 'low'); } catch (e) { }
    try { if (M.runner) M.runner.lite = Q.level === 'low'; } catch (e) { }
    if (M.resize) M.resize(true);
    if (prev !== Q.level) {
      Q.listeners.slice().forEach(f => { try { f(Q.level, prev, reason); } catch (e) { } });
      try { window.dispatchEvent(new CustomEvent('moody-quality', { detail: { level: Q.level, prev, reason, setting: Q.setting } })); } catch (e) { }
    }
  }
  Q.set = function (setting, o) {
    o = o || {}; if (setting !== 'auto' && !PROFILES[setting]) return Q.level;
    const prev = Q.level; Q.setting = setting; Q.fixed = !!o.fixed; Q.auto = setting === 'auto' && !o.fixed;
    Q.level = setting === 'auto' ? (o.level || (prev && Q.autoRan ? prev : Q.guess)) : setting;
    if (!o.nosave && !o.fixed) { try { M.save.data.settings.quality = setting; M.save.commit(); } catch (e) { } }
    MON.reset(true); applyProfile(prev, o.reason || 'set'); return Q.level;
  };
  /* frame-time monitor (auto mode only): 1 s windows; downgrade after 2-3 slow windows, upgrade only after a long calm stretch, and never back to a level that already failed */
  const MON = Q.mon = { n: 0, sum: 0, hitch: 0, slow: 0, good: 0, lastChange: -1e9, sceneAt: 0, trialFrom: null, blocked: {}, jsSum: 0, win0: 0,
    reset(full) { MON.n = MON.sum = MON.hitch = MON.jsSum = 0; MON.slow = MON.good = 0; if (full) { MON.trialFrom = null; MON.lastChange = performance.now() - 3000; } } };
  const lsGet = k => { try { return localStorage.getItem(k); } catch (e) { return null; } }, lsSet = (k, v) => { try { localStorage.setItem(k, v); } catch (e) { } };
  const splashEl = document.getElementById('splash');   // no auto-switching while the splash is up (scripts are still loading)
  function monitor(raw, js, nowMs) {
    if (raw >= 250 || raw <= 0) return;   // resume from background / first frame
    Q.perf.ms += (raw - Q.perf.ms) * .05; Q.perf.fps = 1000 / Q.perf.ms; Q.perf.js += (js - Q.perf.js) * .05;
    if (!Q.auto || document.hidden || M.paused || M.suspended || nowMs - MON.sceneAt < 1500 || (!Q.feeding && splashEl && splashEl.parentNode)) { if (MON.n) MON.n = MON.sum = MON.hitch = MON.jsSum = 0; return; }
    MON.n++; MON.sum += raw; MON.jsSum += js; if (raw > 58) MON.hitch++;
    if (MON.sum < 1000) return;
    const avg = MON.sum / MON.n, hitchy = MON.hitch > MON.n * .18, slow = avg > 24 || (avg > 21 && hitchy), calm = avg < 18.5 && MON.jsSum / MON.n < 7 && !hitchy;
    MON.n = MON.sum = MON.hitch = MON.jsSum = 0; Q.autoRan = true;
    const early = nowMs - MON.sceneAt < 7000, need = avg > 40 ? 1 : early ? 2 : 3, idx = ORDER.indexOf(Q.level);
    if (slow) { MON.slow++; MON.good = 0; } else { MON.slow = Math.max(0, MON.slow - 1); MON.good = calm ? MON.good + 1 : Math.max(0, MON.good - 1); }
    if (MON.slow >= need && idx > 0 && nowMs - MON.lastChange > 4000) {
      if (MON.trialFrom != null && nowMs - MON.lastChange < 20000) MON.blocked[Q.level] = true;   // the upgrade we just tried did not hold: do not try that level again this session
      const prev = Q.level; Q.level = ORDER[idx - 1]; MON.lastChange = nowMs; MON.slow = MON.good = 0; MON.trialFrom = null; Q.autoDowns++; applyProfile(prev, 'auto-down');
      if (Q.level === 'low' && !lsGet('moody_qtoast') && M.ui && M.ui.toast) { lsSet('moody_qtoast', '1'); M.ui.toast('جودة منخفضة تلقائيًا', 3200, { silent: true }); }
    } else if (MON.good >= 40 && idx < 2 && !MON.blocked[ORDER[idx + 1]] && nowMs - MON.lastChange > 30000 && ORDER.indexOf(Q.guess) >= idx) {
      const prev = Q.level; Q.level = ORDER[idx + 1]; MON.lastChange = nowMs; MON.good = 0; MON.trialFrom = prev; applyProfile(prev, 'auto-up');
    }
  }
  Q.feed = (raw, js, nowMs) => { Q.feeding = true; try { monitor(raw, js || 0, nowMs == null ? performance.now() : nowMs); } finally { Q.feeding = false; } };   // test hook: feed synthetic frame times (see tools/quality_test.js)
  /* reduced motion: setting null = follow the OS */
  const mqRM = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)'); } catch (e) { return null; } })();
  M.reduced = false;
  M.setReduced = function (v, o) {
    o = o || {}; if (!o.nosave) { try { M.save.data.settings.reduceMotion = v == null ? null : !!v; M.save.commit(); } catch (e) { } }
    const st = M.save.data && M.save.data.settings ? M.save.data.settings.reduceMotion : null, eff = (st == null ? !!(mqRM && mqRM.matches) : !!st) || /[?&]motion=0/.test(location.search);
    const ch = eff !== M.reduced; M.reduced = eff; FX.motion = !eff; if (document.body) document.body.classList.toggle('reduced', eff);
    try { if (M.chars && M.chars.setReduced) M.chars.setReduced(eff || Q.level === 'low'); } catch (e) { }
    if (ch) try { window.dispatchEvent(new CustomEvent('moody-reduced', { detail: { reduced: eff } })); } catch (e) { }
    return eff;
  };
  if (mqRM) { const on = () => { const st = M.save.data.settings.reduceMotion; if (st == null) M.setReduced(null, { nosave: true }); }; if (mqRM.addEventListener) mqRM.addEventListener('change', on); else if (mqRM.addListener) mqRM.addListener(on); }
  /* called once the save is loaded (boot.js -> M.save.load()) - also safe to call again */
  Q.init = function () {
    Q.guess = Q.detect(); const st = (M.save.data.settings && M.save.data.settings.quality) || 'auto';
    if (qs) Q.set(qs[1], { fixed: qs[1] !== 'auto', nosave: true, reason: 'url' }); else Q.set(PROFILES[st] || st === 'auto' ? st : 'auto', { nosave: true, reason: 'init' });
    M.setReduced(M.save.data.settings.reduceMotion == null ? null : M.save.data.settings.reduceMotion, { nosave: true });
  };
  { const sl = S.load; let warned = false; S.load = function () { sl.apply(S, arguments); try { Q.init(); } catch (e) { console.error(e); }
    if (!S.ok && !warned) { warned = true; setTimeout(() => { try { if (!S.ok && M.ui && M.ui.toast) M.ui.toast('الحفظ مش شغّال في المتصفح ده، التقدّم مش هيتحفظ', 6000, { silent: true }); } catch (e) { } }, 3500); } }; }
  Q.guess = Q.detect(); Q.level = Q.guess; Q.p = PROFILES[Q.level]; applyProfile(null, 'boot');


  /* ---------- scene, loop, input ---------- */
  M.scene = null; M.hooks = { frame: [], step: [] };
  M.setScene = s => { M.scene = s; MON.sceneAt = performance.now(); MON.n = MON.sum = MON.hitch = MON.jsSum = 0; };
  const cv = M.cv = document.getElementById('c'); const OPAQUE = !/[?&]opaque=0/.test(location.search);
  /* opaque backing store: the compositor does not blend the canvas and Skia skips alpha work (every scene paints the full 960x540 anyway; undrawn pixels show the same sky colour as before) */
  const g = M.g = cv.getContext('2d', OPAQUE ? { alpha: false } : undefined);
  const DT = 1 / 60; let acc = 0, last = 0, loopErr = 0;
  function step(dt) {
    M.time += dt; stepJobs(dt);
    if (M.scene && M.scene.update) M.scene.update(dt);
    for (const f of M.hooks.step) f(dt);
  }
  function render() {
    const k = cv.width / M.W;
    g.setTransform(k, 0, 0, k, 0, 0); if (OPAQUE) { g.fillStyle = '#bfe8ff'; g.fillRect(0, 0, M.W, M.H); } else g.clearRect(0, 0, M.W, M.H);
    g.lineJoin = 'round'; g.lineCap = 'round'; g.direction = 'rtl';
    if (M.scene && M.scene.draw) M.scene.draw(g, M.time);
    for (const f of M.hooks.frame) f();
  }
  M.suspended = false;   // true while the tab is hidden or the "rotate your device" overlay is up: the loop idles, voice + audio are paused
  function frame(ts) {
    requestAnimationFrame(frame);
    if (!last) last = ts; const raw = ts - last; last = ts; let d = raw / 1000;
    if (d > .25) d = .25;
    if (document.hidden || M.suspended) return;
    acc += d; let n = 0; const t0 = performance.now();
    try {
      while (acc >= DT && n < 6) { if (!M.paused) step(DT); acc -= DT; n++; }
      if (n >= 6) acc = 0;
      render(); loopErr = 0;
    } catch (e) { acc = 0; loopErr++; try { console.error(e); } catch (x) { } if (loopErr === 8) M.fail && M.fail(e, 'loop', true); }
    monitor(raw, performance.now() - t0, t0);
  }
  M.start = () => requestAnimationFrame(frame);
  M.stepOnce = n => { for (let i = 0; i < n; i++) step(DT); render(); }; // test helper

  /* responsive: logical 960x540 scaled to fit (letterbox). Backing store = css size x min(devicePixelRatio, quality cap), clamped to 960..(kmax x 960) px wide */
  const app = document.getElementById('app'), ui = document.getElementById('ui'), rotEl = document.getElementById('rot');
  const touchCapable = (navigator.maxTouchPoints > 0 && matchMedia('(pointer:coarse)').matches) || ('ontouchstart' in window && matchMedia('(pointer:coarse)').matches);
  M.isTouch = touchCapable;
  if (M.isTouch) document.body.classList.add('touch');
  M.scale = 1; M.dpr = 1;
  function resize(force) {
    const vw = app.clientWidth || innerWidth, vh = app.clientHeight || innerHeight, s = Math.min(vw / M.W, vh / M.H);
    M.scale = s;
    cv.style.width = (M.W * s) + 'px'; cv.style.height = (M.H * s) + 'px';
    ui.style.transform = 'translate(-50%,-50%) scale(' + s + ')';
    const dpr = Math.min(window.devicePixelRatio || 1, FX.dpr || 2), pw = Math.round(M.W * s * dpr), nw = Math.max(M.W, Math.min(pw, Math.round(M.W * (FX.kmax || 2))));
    M.dpr = dpr;
    if (cv.width !== nw) { cv.width = nw; cv.height = Math.round(nw * M.H / M.W); }
    const portrait = M.isTouch && innerHeight > innerWidth;
    if (rotEl) rotEl.style.display = portrait ? 'flex' : 'none';
    setSuspended('rotate', portrait);
    if (M.ui && M.ui.fit) M.ui.fit();
  }
  let rzRaf = 0; const rz = () => { if (rzRaf) return; rzRaf = requestAnimationFrame(() => { rzRaf = 0; resize(); }); };
  addEventListener('resize', rz); addEventListener('orientationchange', () => { setTimeout(resize, 120); setTimeout(resize, 450); });
  if (window.visualViewport) window.visualViewport.addEventListener('resize', rz);
  /* devicePixelRatio changes (moving the window to another screen, browser zoom, iOS rotate): re-arm a resolution media query each time */
  (function watchDpr() { try { const mq = matchMedia('(resolution: ' + (window.devicePixelRatio || 1) + 'dppx)'); const on = () => { if (mq.removeEventListener) mq.removeEventListener('change', on); rz(); watchDpr(); }; if (mq.addEventListener) mq.addEventListener('change', on); } catch (e) { } })();
  document.addEventListener('fullscreenchange', () => { setTimeout(resize, 60); setTimeout(resize, 400); }); document.addEventListener('webkitfullscreenchange', () => { setTimeout(resize, 60); setTimeout(resize, 400); });
  M.resize = resize;
  ['gesturestart', 'gesturechange', 'dblclick', 'contextmenu'].forEach(e => document.addEventListener(e, ev => ev.preventDefault()));
  document.addEventListener('touchmove', e => { if (e.target.closest && e.target.closest('.scroll')) return; e.preventDefault(); }, { passive: false });   // no pull-to-refresh / rubber-band outside real scroll areas
  document.addEventListener('dragstart', e => e.preventDefault());

  /* ---------- suspend: hidden tab / portrait overlay -> loop idles, voice + audio paused, wake lock released; everything resumes cleanly ---------- */
  const SUSP = {}; let heldPause = false, voiceWas = null;
  function setSuspended(why, on) {
    if (!!SUSP[why] === !!on) return; SUSP[why] = !!on; const any = Object.keys(SUSP).some(k => SUSP[k]);
    if (any === M.suspended) return; M.suspended = any;
    if (any) {
      if (!M.paused) { M.paused = true; heldPause = true; }   // game timers (setInterval based kits, nudges) stand still too
      try { const V = M.voice; if (V && V.cur && !V.cur.paused) { V.cur.pause(); voiceWas = V.cur; } } catch (e) { }
      try { M.audio && M.audio.suspend && M.audio.suspend(); } catch (e) { }
      M.wake && M.wake.release();
    } else {
      if (heldPause) { M.paused = false; heldPause = false; }
      last = 0; acc = 0;
      try { const V = M.voice; if (voiceWas && V && V.cur === voiceWas && !M.paused) { const p = voiceWas.play(); if (p && p.catch) p.catch(() => { }); } voiceWas = null; } catch (e) { }
      try { M.audio && M.audio.resume && M.audio.resume(); } catch (e) { }
      M.wake && M.wake.reacquire();
      resize();
    }
  }
  M.setSuspended = setSuspended;
  resize();
  document.addEventListener('visibilitychange', () => { last = 0; acc = 0; setSuspended('hidden', document.hidden); });
  addEventListener('pagehide', () => setSuspended('hidden', true)); addEventListener('pageshow', () => setSuspended('hidden', document.hidden));

  /* ---------- screen wake lock (kept while a mission is on screen: ui.hud.show -> on, hud.hide -> off) ---------- */
  M.wake = (function () {
    let lock = null, want = false;
    async function req() { try { if (!want || document.hidden || M.suspended || !navigator.wakeLock || lock) return; const l = await navigator.wakeLock.request('screen'); lock = l; l.addEventListener('release', () => { if (lock === l) lock = null; }); } catch (e) { lock = null; } }
    function drop() { try { if (lock) lock.release(); } catch (e) { } lock = null; }
    return { on() { want = true; req(); }, off() { want = false; drop(); }, release: drop, reacquire() { if (want) req(); }, active: () => !!lock };
  })();

  /* ---------- fullscreen (hidden on iOS: no Fullscreen API for pages there; installed PWAs are already fullscreen) ---------- */
  M.fs = {
    iOS: /iPhone|iPad|iPod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1),
    standalone: (() => { try { return matchMedia('(display-mode: fullscreen)').matches || matchMedia('(display-mode: standalone)').matches || !!navigator.standalone; } catch (e) { return false; } })(),
    el() { return document.documentElement; },
    can() { return !M.fs.iOS && !M.fs.standalone && !!(document.fullscreenEnabled || document.webkitFullscreenEnabled); },
    is() { return !!(document.fullscreenElement || document.webkitFullscreenElement); },
    async toggle() {
      try {
        if (M.fs.is()) { (document.exitFullscreen || document.webkitExitFullscreen).call(document); return false; }
        const e = M.fs.el(), r = e.requestFullscreen || e.webkitRequestFullscreen; if (!r) return false; await r.call(e);
        try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (x) { }
        return true;
      } catch (x) { return false; }
    }
  };

  /* ---------- friendly error overlay (never a stack trace in front of a 6-year-old) ---------- */
  M.errors = []; const errT = [];
  M.fail = function (err, src, fatal) {
    try {
      const msg = String((err && (err.message || err)) || 'error').slice(0, 200); M.errors.push({ msg, src: src || '', t: Date.now() }); if (M.errors.length > 30) M.errors.shift();
      const now = performance.now(); errT.push(now); while (errT.length && now - errT[0] > 5000) errT.shift();
      if (!fatal && errT.length < 4) return;
      if (document.getElementById('errov')) return;
      const o = document.createElement('div'); o.id = 'errov'; o.setAttribute('role', 'alertdialog'); o.setAttribute('aria-label', 'حصلت مشكلة صغيرة');
      o.innerHTML = '<div class="eb"><div class="et">حصلت مشكلة صغيرة</div><div class="es">متقلقوش، تقدّمكم محفوظ. جرّبوا واحدة من دول:</div><div class="er"><button data-a="go" class="b1">كمّل اللعب</button><button data-a="map" class="b2">خريطة المغامرات</button><button data-a="re" class="b3">افتح اللعبة من جديد</button></div></div>';
      o.addEventListener('click', ev => { const a = ev.target && ev.target.getAttribute && ev.target.getAttribute('data-a'); if (!a) return; if (a === 're') { location.reload(); return; } o.remove(); errT.length = 0; loopErr = 0; if (a === 'map') { try { M.paused = false; M.flow.toMap(); } catch (e) { location.reload(); } } });
      document.body.appendChild(o);
    } catch (e) { }
  };
  addEventListener('error', e => { if (e && e.target && e.target !== window) return; M.fail(e.error || e.message, 'window'); });
  addEventListener('unhandledrejection', e => { M.fail(e.reason, 'promise'); });
  setTimeout(() => { if (document.getElementById('splash') && !(M.flow && M.flow.cur) && document.getElementById('splash').parentNode) M.fail('boot timeout', 'boot', true); }, 25000);

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
  M.keys = [];
  addEventListener('keydown', e => { for (const f of M.keys) if (f(e)) { e.preventDefault(); return; } });

  /* ?fps=1 : tiny on-screen meter for testing on a real phone (fps, quality level / setting, canvas size, JS ms per frame, DPR) */
  if (/[?&]fps=1/.test(location.search)) {
    const b = document.createElement('div'); b.id = 'fpsbox'; b.style.cssText = 'position:fixed;left:4px;bottom:4px;z-index:150;font:700 12px/1.3 monospace;color:#fff;background:rgba(0,0,0,.6);padding:3px 6px;border-radius:6px;pointer-events:none;direction:ltr';
    document.body.appendChild(b); setInterval(() => { b.textContent = Math.round(Q.perf.fps) + ' fps  ' + Q.level + (Q.auto ? ' (auto)' : '') + '  ' + cv.width + 'x' + cv.height + '  js ' + Q.perf.js.toFixed(1) + 'ms  dpr ' + (window.devicePixelRatio || 1); }, 500);
  }
  M.urlUnlock = /[?&]unlock=1/.test(location.search) && M.config.edition !== 'play';   // play edition: ?unlock=1 is ignored (dev: ?devunlock=<secret>, see entitle.js)
})();
