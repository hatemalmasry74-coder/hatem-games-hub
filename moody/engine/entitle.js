/* Moody & Aboody - engine/entitle.js : ENTITLEMENT MODEL for the Google Play edition.
   Replaces the inert stub from config.js. When Moody.config.edition !== 'play' (and config.gateWeb is off) every question is answered "yes, play it": the web game is unchanged.

   Public API
     Moody.ent.active                      true only in the play edition
     Moody.ent.canPlay(worldId, missionId) the ONE question every lock asks (hidden worlds, free missions, subscribers, dev unlock)
     Moody.ent.isPremium()                 subscribed (store-verified, within the cached validity / offline grace)
     Moody.ent.isFree(worldId, missionId)  config only (is this mission in the free table)
     Moody.ent.status()                    { premium, state:'ACTIVE'|'GRACE'|'PENDING'|'EXPIRED'|'NONE', plan, sku, expiry, pending, reason, stale, offline, lastVerified, tampered }
     await Moody.ent.refresh()             ask the store again (launch, foreground, after reconnect are automatic)
     await Moody.ent.purchase('monthly'|'yearly') / restore()
     Moody.ent.on(fn)                      fn(status) when premium/state changes -> returns unsubscribe
     Moody.ent.totals(world)               { n playable, tot stars possible, got, done, locked }   (progress rings count only unlocked missions)
   Free table: config.freePerWorld (default 1 = the first mission of each world in ARRAY order), config.freeMissions {world:[ids]|'*'}, config.freeWorlds,
   mission.free === true|false and world.free === true in the world files override the config. Hidden worlds (room, call, ...) are always free.

   SECURITY (honest): this is a client-side check. The cached record is bound to the install with a random salt and a keyed checksum, so casual edits of localStorage are
   detected and discarded; the clock is made monotonic (a rolled-back clock does not extend an expiry). It is obfuscation-grade, NOT security: anybody who can read this file
   (rooted device, debugger) can patch canPlay(). Real protection = the store (Google Play) as the source of truth on every launch + optional server verification
   (relay/play_verify_worker.js, config.verifyUrl). */
(function () {
  'use strict';
  const M = window.Moody, C = M.config, B = M.billing, DAY = 864e5;
  const active = C.edition === 'play' || C.gateWeb === true;
  const KEY = 'moody_ent_v1', SKEY = 'moody_ent_salt_v1';
  const E = M.ent = { active, stub: false, dev: false, offline: false, tampered: false, tamperCount: 0, _l: [], _rec: null, _world: null, _lastRefresh: 0 };
  E.t = function (k, v) {
    const T = (M.strings && M.strings.pay) || {}, s = ((T[C.lang] || {})[k]) || ((T.ar || {})[k]) || k;
    return v ? s.replace(/\{(\w+)\}/g, (m, n) => v[n] != null ? v[n] : m) : s;
  };

  /* ---------------- free table ---------------- */
  E.isFree = function (wid, mid) {
    const w = M.getWorld ? M.getWorld(wid) : M.worlds.find(x => x.id === wid);
    if (!w) return true;                                                   // unknown world: nothing to start anyway
    if (w.hidden || w.free === true || (C.freeWorlds || []).indexOf(wid) >= 0) return true;
    const idx = w.missions.findIndex(m => m.id === mid); if (idx < 0) return false;
    const m = w.missions[idx]; if (m.free === true) return true; if (m.free === false) return false;
    const t = (C.freeMissions || {})[wid];
    if (t === '*') return true; if (Array.isArray(t)) return t.indexOf(mid) >= 0;
    return idx < Math.max(0, C.freePerWorld | 0);
  };
  E.canPlay = function (wid, mid) { if (!active || E.dev) return true; return E.isFree(wid, mid) || E.isPremium(); };
  E.skipChain = () => active && C.premiumSkipsChain !== false && (E.dev || E.isPremium());
  E.totals = function (w) {
    const S = M.save; if (!active || E.dev) return { n: w.missions.length, tot: w.missions.length * 3, got: S.mapStars(w), done: S.done(w), locked: 0 };
    let n = 0, got = 0, done = 0; w.missions.forEach(m => { if (E.canPlay(w.id, m.id)) { n++; const p = S.prog(w.id, m.id) || {}; got += Math.min(3, p.stars || 0); if (p.done) done++; } });
    return { n, tot: n * 3, got, done, locked: w.missions.length - n };
  };

  /* ---------------- cached record (tamper-evident, install-bound) ---------------- */
  function cyrb53(s) { let a = 0xdeadbeef, b = 0x41c6ce57; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); a = Math.imul(a ^ c, 2654435761); b = Math.imul(b ^ c, 1597334677); } a = Math.imul(a ^ (a >>> 16), 2246822507) ^ Math.imul(b ^ (b >>> 13), 3266489909); b = Math.imul(b ^ (b >>> 16), 2246822507) ^ Math.imul(a ^ (a >>> 13), 3266489909); return (4294967296 * (2097151 & b) + (a >>> 0)).toString(36); }
  let memSalt = null;
  function salt() {
    try { let s = localStorage.getItem(SKEY); if (!s) { s = Array.from({ length: 4 }, () => Math.floor(Math.random() * 4294967296).toString(36)).join(''); localStorage.setItem(SKEY, s); } return s; }
    catch (e) { return memSalt || (memSalt = String(Math.random())); }
  }
  const sum = r => cyrb53(['m1', r.st, r.sku || '', r.exp || 0, r.gu || 0, r.ver || 0, r.seen || 0, r.reason || '', r.pend ? 1 : 0, salt()].join('|'));
  function save() { const r = E._rec; try { if (!r) { localStorage.removeItem(KEY); return; } r.c = sum(r); localStorage.setItem(KEY, JSON.stringify(r)); } catch (e) { } }
  function load() {
    let raw = null; try { raw = localStorage.getItem(KEY); } catch (e) { }
    if (!raw) return;
    try { const r = JSON.parse(raw); if (r && r.c === sum(r) && r.st) { E._rec = r; return; } } catch (e) { }
    E.tampered = true; E.tamperCount++; E._rec = null; try { localStorage.removeItem(KEY); } catch (e) { }   // damaged / copied / edited: forget it, the store check below restores the truth
  }
  let lastTouch = 0;
  const now = () => {   // monotonic clock: rolling the device clock back never extends anything (the highest time ever seen is persisted, at most every 5 s)
    const d = Date.now(), r = E._rec; if (!r) return d; if (d > (r.seen || 0)) { if (d - lastTouch > 5000) { lastTouch = d; r.seen = d; save(); } return d; } return r.seen;
  };

  /* ---------------- is the user entitled right now ---------------- */
  E.isPremium = function () {
    if (!active) return true; if (E.dev) return true;
    const r = E._rec; if (!r || r.st !== 'ACTIVE') return false;
    const n = now(), g = Math.max(0, C.offlineGraceDays) * DAY;
    if (r.gu && n < r.gu) return true;                                      // store billing-retry grace period
    return n < (r.exp != null ? r.exp : r.ver) + g;                         // known expiry (+ offline grace) or lease from the last successful check
  };
  E.status = function () {
    const r = E._rec, premium = E.isPremium(), n = now();
    let state = 'NONE'; if (r) state = r.st === 'ACTIVE' ? 'EXPIRED' : r.st; if (premium) state = r && r.gu && n < r.gu && (r.exp == null || n >= r.exp) ? 'GRACE' : 'ACTIVE';
    return { premium, dev: E.dev, state, sku: r ? r.sku : null, plan: r && B ? B.planOf(r.sku) : null, expiry: r ? (r.exp || null) : null, pending: !!(r && (r.st === 'PENDING' || r.pend)), reason: r ? r.reason || '' : '',
      stale: !!(premium && r && r.exp != null && n >= r.exp && !(r.gu && n < r.gu)), offline: E.offline, lastVerified: r ? r.ver : 0, tampered: E.tampered };
  };

  /* ---------------- change notification ---------------- */
  let lastSig = '';
  const sig = () => { const s = E.status(); return [s.premium, s.state, s.pending, s.sku, s.expiry].join('|'); };
  E.on = function (fn) { E._l.push(fn); return () => { const i = E._l.indexOf(fn); if (i >= 0) E._l.splice(i, 1); }; };
  function notify(force) {
    const s = sig(); if (!force && s === lastSig) return; const wasPrem = lastSig.indexOf('true') === 0; lastSig = s; const st = E.status();
    E._l.slice().forEach(f => { try { f(st); } catch (e) { try { console.error(e); } catch (x) { } } });
    if (st.premium !== wasPrem) E._rerender(st.premium && !wasPrem);
  }
  E._rerender = function (gained) {   // the lock state changed behind a visible map / mission list: rebuild it so locks appear/disappear at once
    try {
      if (M.flow.cur) return; const scr = document.getElementById('scr'); if (!scr) return;
      const live = sel => Array.from(scr.querySelectorAll(sel)).some(e => !e.closest('.leave'));
      if (live('.mcard[data-mission]') && E._world && M.getWorld(E._world)) M.flow.toWorld(E._world); else if (live('.card[data-world]')) M.flow.toMap();
      if (gained && !(M.paywall && M.paywall.isOpen())) M.ui.toast(E.t('toast_active'), 3600, { silent: true });
    } catch (e) { }
  };

  /* ---------------- applying store events ---------------- */
  function applyEv(ev) {
    const n = Date.now(), prev = E._rec; let r = null;
    if (ev.state === 'ACTIVE') r = { st: 'ACTIVE', sku: ev.sku, exp: ev.expiry != null ? +ev.expiry : null, gu: ev.inGrace && ev.graceUntil ? +ev.graceUntil : 0, ver: n, seen: n, reason: '', pend: 0 };
    else if (ev.state === 'PENDING') { if (E.isPremium() && prev) { r = Object.assign({}, prev, { pend: 1 }); } else r = { st: 'PENDING', sku: ev.sku, ver: n, seen: n, reason: '', pend: 1 }; }
    else if (ev.state === 'EXPIRED' || (ev.state === 'NONE' && prev && (prev.st === 'ACTIVE' || prev.st === 'EXPIRED'))) r = { st: 'EXPIRED', sku: ev.sku || (prev && prev.sku), exp: ev.expiry != null ? +ev.expiry : (prev ? prev.exp : null), ver: n, seen: n, reason: ev.reason || (prev && prev.st === 'EXPIRED' ? prev.reason : 'expired'), pend: 0 };
    else r = null;   // NONE and nothing before
    E._rec = r; save(); E.offline = false;
  }
  /* optional server-side verification (relay/play_verify_worker.js). Returns the (possibly corrected) event; throws when it could not be verified AND verifyStrict is on. */
  async function verify(ev) {
    if (!C.verifyUrl || ev.state !== 'ACTIVE' || !ev.token) return ev;
    try {
      const r = await fetch(C.verifyUrl, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ packageName: C.packageName, productId: ev.sku, purchaseToken: ev.token, acknowledge: true }) });
      if (!r.ok) throw new Error('verify_http_' + r.status); const j = await r.json(); if (!j || typeof j.state !== 'string') throw new Error('verify_bad_reply');
      return Object.assign({}, ev, { state: j.state, expiry: j.expiry != null ? j.expiry : ev.expiry, inGrace: !!j.inGrace, graceUntil: j.graceUntil || 0, reason: j.reason || ev.reason, verified: true });
    } catch (e) { if (C.verifyStrict) throw e; return ev; }
  }

  let busy = null;
  E.refresh = function () {
    if (!active) return Promise.resolve(E.status()); if (busy) return busy;
    busy = (async () => {
      try { const ev = await verify(await B.getEntitlement()); applyEv(ev); E._lastRefresh = Date.now(); }
      catch (e) { E.offline = true; }                                       // unknown (offline / store down): keep the cache, it expires by itself
      finally { busy = null; notify(); }
      return E.status();
    })();
    return busy;
  };
  E.restore = async function () {
    if (!active) return { ok: true, premium: true };
    try { const ev = await verify(await B.restore()); applyEv(ev); E._lastRefresh = Date.now(); notify(); return { ok: true, premium: E.isPremium(), state: ev.state }; }
    catch (e) { E.offline = true; notify(); return { ok: false, premium: E.isPremium(), error: (e && e.message) || 'error' }; }
  };
  E.purchase = async function (plan) {
    if (!active) return { result: 'success' };
    const r = await B.purchase(plan);
    if (r.result === 'pending') { applyEv({ state: 'PENDING', sku: (r.purchase && r.purchase.sku) || C.productIds[plan] }); notify(); return { result: 'pending' }; }
    if (r.result === 'already_owned') { const x = await E.restore(); return { result: x.premium ? 'success' : 'failure', error: x.premium ? '' : 'already_owned_not_found' }; }
    if (r.result !== 'success') return r;
    let ev = { state: 'ACTIVE', sku: r.purchase.sku, token: r.purchase.token, expiry: r.purchase.expiry != null ? r.purchase.expiry : null };
    try { ev = await verify(ev); } catch (e) { return { result: 'verify_failed' }; }
    applyEv(ev); E._lastRefresh = Date.now(); notify();
    return { result: ev.state === 'ACTIVE' ? 'success' : ev.state === 'PENDING' ? 'pending' : 'failure' };
  };

  /* ---------------- UI hooks used by ui.js / ctx.js ---------------- */
  E.lockBadge = function () { const h = M.ui.h; return h('div', { class: 'pw-lock' }, M.ui.i('lock', 34, { color: '#a8680a' }), h('span', null, E.t('with_sub'))); };
  E.decorateCard = function (c, w, T) {
    if (!active || E.dev || !T || !T.locked) return;
    const cnt = c.querySelector('.cnt'); if (cnt) cnt.textContent = M.util.ar(T.n) + ' ' + E.t('free_word') + ' + ' + M.util.ar(T.locked) + ' ' + E.t('with_sub');
    c.setAttribute('data-locked', String(T.locked));
  };
  E.promptLocked = function (w, m, i) { M.audio.sfx('tap'); if (M.paywall) M.paywall.open({ world: w.id, mission: m.id }); };
  E.blocked = function (wid, idx) { const w = M.getWorld(wid); M.flow.toWorld(wid); if (w && w.missions[idx]) setTimeout(() => E.promptLocked(w, w.missions[idx], idx), 0); };

  /* ---------------- parents' corner section ---------------- */
  E.parentSection = function () {
    if (!active) return null; const h = M.ui.h, ar = M.util.ar;
    const box = h('div', { class: 'pw-parent', 'data-sub': '1' }); let seen = false, off = null;
    function render() {
      if (!box.isConnected && seen) { if (off) off(); return; } if (box.isConnected) seen = true;
      const s = E.status(); box.textContent = '';
      let line, cls = 'gray';
      if (s.premium && s.state === 'GRACE') { line = E.t('par_grace'); cls = 'warn'; }
      else if (s.premium) { line = s.expiry ? E.t('par_active_until', { d: fmtDate(s.expiry) }) : E.t('par_active'); cls = 'ok'; }
      else if (s.pending) line = E.t('par_pending'); else if (s.state === 'EXPIRED') line = E.t('par_expired'); else line = E.t('par_none');
      const btn = s.premium ? M.ui.btn(E.t('manage_sub'), 'blue sm', () => M.paywall.manage(), 'settings') : M.ui.btn(E.t('subscribe_btn'), 'green sm', () => M.paywall.open({}), 'play');
      btn.setAttribute('data-act', s.premium ? 'manage' : 'subscribe');
      box.append(h('div', { style: 'font-size:27px;font-weight:900;margin:12px 0 6px' }, E.t('par_title')),
        h('div', { class: 'row', style: 'justify-content:flex-start;gap:14px;flex-wrap:wrap' }, h('div', { class: 'chip pw-st ' + cls, style: 'font-size:21px;min-height:46px' }, line), btn),
        h('div', { style: 'font-size:17px;opacity:.7;font-weight:800;margin:6px 0' }, E.t('par_note')));
    }
    off = E.on(render); render(); return box;
  };
  function fmtDate(ms) { try { return new Date(ms).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }); } catch (e) { return new Date(ms).toISOString().slice(0, 10); } }
  E.fmtDate = fmtDate;

  /* ---------------- startup ---------------- */
  async function sha256(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return Array.from(new Uint8Array(b)).map(x => ('0' + x.toString(16)).slice(-2)).join(''); }
  async function devCheck() {
    try {
      const m = /[?&]devunlock=([^&]+)/.exec(location.search || ''); if (!m || !C.devUnlockHash) return;
      if ((await sha256(decodeURIComponent(m[1]))) === String(C.devUnlockHash).toLowerCase()) { E.dev = true; M.urlUnlock = true; notify(true); }
    } catch (e) { }
  }
  E.init = function () {
    if (E._inited) return E._inited; if (!active) return (E._inited = Promise.resolve());
    const UI = M.ui; if (UI && UI.missionList && !UI._entWrap) { UI._entWrap = true; const o = UI.missionList; UI.missionList = function (w) { E._world = w.id; return o.apply(this, arguments); }; }
    B.onUpdate(async ev => { try { applyEv(await verify(ev)); } catch (e) { return; } notify(); });
    E._inited = (async () => {
      devCheck();
      await B.init(); await E.refresh();
      if (E.tampered && !E.isPremium()) { /* the cache was damaged: the refresh above already re-read the store */ }
    })();
    /* foreground / reconnect re-verification, and a minute tick that persists the monotonic clock + lets an expiry re-lock a running map */
    document.addEventListener('visibilitychange', () => { if (!document.hidden && Date.now() - E._lastRefresh > Math.max(1, C.refreshMinutes) * 60000) E.refresh(); });
    addEventListener('online', () => E.refresh());
    setInterval(() => { const r = E._rec; if (r && Date.now() > (r.seen || 0)) { r.seen = Date.now(); save(); } notify(); }, 30000);
    return E._inited;
  };
  /* test / diagnostics helper (read-only snapshot of the cache) */
  E.debug = () => ({ rec: E._rec ? Object.assign({}, E._rec) : null, status: E.status(), provider: B.name, tamperCount: E.tamperCount });

  if (active) { load(); lastSig = sig(); }
  setTimeout(E.init, 0);
})();
