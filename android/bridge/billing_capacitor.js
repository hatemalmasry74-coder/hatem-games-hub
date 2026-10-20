/* Moody & Aboody - Google Play Billing bridge for the Capacitor (Android) build.
 *
 *   window.MoodyBillingCapacitor   <- the object the game's `Moody.billing` "capacitor" provider talks to.
 *
 * Contract: docs/play/BILLING_CONTRACT.md  (keep both in sync).
 * Backend: cordova-plugin-purchase (CdvPurchase, MIT) -> Google Play Billing Library. No server, no third-party account.
 *
 * Security note (honest): without a receipt-validation server the "entitlement" is what Google Play Services reports on
 * the device. That is fine for a children's content unlock (it is what Play itself would tell any app) but it is not
 * tamper-proof on a rooted device. If you ever need that, add a validator (store.validator = ...) - see docs/play/BILLING_DECISION in DECISION.md.
 *
 * Nothing here touches personal data. The only thing persisted locally is the last entitlement state (localStorage key below).
 */
(function (root) {
  'use strict';
  var CACHE_KEY = 'moody_play_entitlement_v1';
  var DEFAULT_GRACE_DAYS = 30;     // how long a cached ACTIVE is trusted if Play cannot be asked (offline since long)
  var ORDER_WAIT_MS = 180000;      // purchase() waits at most this long for Play to answer; events keep flowing afterwards

  var S = {
    inited: false, initP: null, products: [], ids: [], listeners: [], graceMs: DEFAULT_GRACE_DAYS * 864e5,
    ready: false,          // CdvPurchase has loaded the local receipts at least once
    last: null,            // last emitted entitlement event
    waiters: [], debug: false, available: false
  };

  /* ------------------------------------------------------------------ helpers */
  function log() { if (S.debug && root.console) { try { console.log.apply(console, ['[billing]'].concat([].slice.call(arguments))); } catch (e) { } } }
  function now() { return Date.now(); }
  function cdv() { return root.CdvPurchase || null; }
  function store() { var c = cdv(); return c && c.store; }
  function readCache() { try { var j = JSON.parse(root.localStorage.getItem(CACHE_KEY) || 'null'); return j && typeof j === 'object' ? j : null; } catch (e) { return null; } }
  function writeCache(ev) { try { if (ev.state === 'ACTIVE') root.localStorage.setItem(CACHE_KEY, JSON.stringify({ state: 'ACTIVE', productId: ev.productId, expiry: ev.expiry, checkedAt: ev.checkedAt })); else root.localStorage.removeItem(CACHE_KEY); } catch (e) { } }
  function plain(o) { var r = {}; for (var k in o) r[k] = o[k]; return r; }

  function makeEvent(state, productId, expiry, source, extra) {
    var ev = { type: 'entitlement', state: state, productId: productId || null, expiry: expiry == null ? null : expiry, checkedAt: now(), source: source || 'play', autoRenewing: null };
    if (extra) for (var k in extra) ev[k] = extra[k];
    return ev;
  }
  function sameEvent(a, b) { return a && b && a.state === b.state && a.productId === b.productId && a.expiry === b.expiry && a.source === b.source; }
  function emit(ev) {
    if (S.last && S.last.source === 'play' && ev.source === 'cache' && S.last.state === ev.state) return;   // never downgrade a confirmed answer to a cached one
    if (sameEvent(S.last, ev)) { S.last = ev; return; }       // no duplicate noise (checkedAt may differ; the cache is refreshed below anyway)
    S.last = ev; writeCache(ev); log('event', ev);
    S.listeners.slice().forEach(function (cb) { try { cb(plain(ev)); } catch (e) { log('listener error', e); } });
    S.waiters.slice().forEach(function (w) { try { w(ev); } catch (e) { } });
  }

  /* ------------------------------------------------------------------ entitlement from the plugin state */
  function expiryOf(productId) {
    // Without a validator Google Play does not hand us the renewal date. Use it when the plugin happens to know it.
    var st = store(), best = null;
    try {
      (st.localTransactions || []).forEach(function (t) {
        if (t.products && t.products.some(function (p) { return p.id === productId; }) && t.expirationDate) {
          var ms = +new Date(t.expirationDate); if (ms && (!best || ms > best)) best = ms;
        }
      });
    } catch (e) { }
    return best;
  }
  function anyPending() {
    var st = store(), c = cdv(), id = null;
    try {
      (st.localTransactions || []).forEach(function (t) {
        var pend = t.state === c.TransactionState.PENDING || t.isPending === true;
        if (pend && t.products) t.products.forEach(function (p) { if (S.ids.indexOf(p.id) >= 0) id = p.id; });
      });
    } catch (e) { }
    return id;
  }
  function recompute(source) {
    var st = store(); if (!st) return;
    var owned = null;
    for (var i = 0; i < S.ids.length; i++) { if (st.owned(S.ids[i])) { owned = S.ids[i]; break; } }
    if (owned) { emit(makeEvent('ACTIVE', owned, expiryOf(owned), source || 'play')); return; }
    var pend = anyPending();
    if (pend) { emit(makeEvent('PENDING', pend, null, source || 'play')); return; }
    if (!S.ready) return;       // not authoritative yet: the optimistic cached state (if any) stays until receipts are loaded
    var prev = readCache();
    emit(makeEvent(prev && prev.state === 'ACTIVE' ? 'EXPIRED' : (S.last && S.last.state === 'ACTIVE' ? 'EXPIRED' : 'NONE'), prev && prev.productId, prev && prev.expiry, source || 'play'));
  }

  /* ------------------------------------------------------------------ public API */
  var API = {
    /** true when the Cordova/Capacitor purchase plugin is present (i.e. we run inside the Android app). */
    isNative: function () { return !!(root.Capacitor && root.Capacitor.isNativePlatform && root.Capacitor.isNativePlatform()); },

    /** initialize({products:[id | {id}], graceDays?, debug?}) -> Promise<{ok, available, error?}>  (never rejects) */
    initialize: function (opts) {
      if (S.initP) return S.initP;
      opts = opts || {}; S.debug = !!opts.debug;
      if (opts.graceDays > 0) S.graceMs = opts.graceDays * 864e5;
      S.ids = (opts.products || []).map(function (p) { return typeof p === 'string' ? p : p && p.id; }).filter(Boolean);
      // 1) optimistic start from the cache so an offline child is never locked out for a paid month
      var c0 = readCache();
      if (c0 && c0.state === 'ACTIVE' && S.ids.indexOf(c0.productId) >= 0 && now() - c0.checkedAt < S.graceMs && (c0.expiry == null || c0.expiry + S.graceMs > now())) {
        emit(makeEvent('ACTIVE', c0.productId, c0.expiry, 'cache'));
      }
      S.initP = new Promise(function (resolve) {
        var started = false;
        function start() {
          if (started) return; started = true;
          var C = cdv(), st = store();
          if (!C || !st) { S.available = false; emit(makeEvent(S.last && S.last.state === 'ACTIVE' ? 'ACTIVE' : 'NONE', S.last && S.last.productId, S.last && S.last.expiry, 'cache')); return resolve({ ok: false, available: false, error: 'purchase plugin missing' }); }
          try {
            st.register(S.ids.map(function (id) { return { id: id, type: C.ProductType.PAID_SUBSCRIPTION, platform: C.Platform.GOOGLE_PLAY }; }));
            st.error(function (e) { log('store error', e && e.code, e && e.message); });
            // Acknowledge purchases (Play refunds unacknowledged purchases after 3 days). No validator -> finish() directly.
            st.when()
              .approved(function (t) { t.finish(); })
              .finished(function () { recompute('play'); })
              .pending(function () { recompute('play'); })
              .productUpdated(function () { })
              .receiptsReady(function () { S.ready = true; recompute('play'); });
            st.initialize([C.Platform.GOOGLE_PLAY]).then(function (errs) {
              S.available = !(errs && errs.length && errs.some(function (e) { return e && e.code === C.ErrorCode.SETUP; }));
              S.ready = S.ready || false;
              recompute('play');
              resolve({ ok: true, available: S.available, errors: (errs || []).map(function (e) { return e && e.message; }) });
            }, function (e) { resolve({ ok: false, available: false, error: String(e && e.message || e) }); });
          } catch (e) { resolve({ ok: false, available: false, error: String(e && e.message || e) }); }
        }
        if (cdv() && cdv().store) start();
        else { root.document.addEventListener('deviceready', start, false); setTimeout(start, 6000); }   // 6 s safety net: plugin missing (e.g. browser preview)
      });
      S.inited = true; return S.initP;
    },

    /** getProducts() -> Promise<[{id,title,description,price,priceMicros,currency,period,trialDays,canPurchase}]>.  `price` is Play's localized string - show it as is. */
    getProducts: function () {
      return (S.initP || Promise.resolve()).then(function () {
        var st = store(), C = cdv(), out = [];
        if (!st) return out;
        S.ids.forEach(function (id) {
          var p = st.get(id, C.Platform.GOOGLE_PLAY); if (!p) return;
          var offer = p.getOffer && p.getOffer(), phases = (offer && offer.pricingPhases) || [], paid = null, trial = 0;
          phases.forEach(function (ph) { if (ph.priceMicros === 0 || ph.paymentMode === 'FreeTrial') { var m = /P(\d+)([DW])/.exec(ph.billingPeriod || ''); if (m) trial = +m[1] * (m[2] === 'W' ? 7 : 1); } else if (!paid) paid = ph; });
          paid = paid || phases[phases.length - 1] || p.pricing || {};
          out.push({ id: id, title: p.title || '', description: p.description || '', price: paid.price || '', priceMicros: paid.priceMicros || 0, currency: paid.currency || '', period: paid.billingPeriod || '', trialDays: trial, canPurchase: !!p.canPurchase });
        });
        return out;
      });
    },

    /** purchase(productId, {offerId?}) -> Promise<{ok, state:'ACTIVE'|'PENDING'|'CANCELLED'|'ERROR'|'UNKNOWN', code?, message?}>
     *  The GAME must show its parental gate BEFORE calling this (Families policy). Entitlement events are emitted as well. */
    purchase: function (productId, o) {
      o = o || {};
      return (S.initP || Promise.resolve()).then(function () {
        var st = store(), C = cdv();
        if (!st || !S.available) return { ok: false, state: 'ERROR', code: 'UNAVAILABLE', message: 'Google Play Billing is not available' };
        var p = st.get(productId, C.Platform.GOOGLE_PLAY); if (!p) return { ok: false, state: 'ERROR', code: 'UNKNOWN_PRODUCT', message: 'product not loaded: ' + productId };
        var offer = (o.offerId && p.getOffer(o.offerId)) || p.getOffer(); if (!offer) return { ok: false, state: 'ERROR', code: 'NO_OFFER', message: 'no offer for ' + productId };
        return new Promise(function (resolve) {
          var done = false, to = setTimeout(function () { fin({ ok: false, state: 'UNKNOWN', code: 'TIMEOUT', message: 'no answer from Google Play yet; listen to onUpdate' }); }, ORDER_WAIT_MS);
          function fin(r) { if (done) return; done = true; clearTimeout(to); var i = S.waiters.indexOf(w); if (i >= 0) S.waiters.splice(i, 1); resolve(r); }
          function w(ev) { if (ev.productId === productId || ev.state === 'ACTIVE') { if (ev.state === 'ACTIVE') fin({ ok: true, state: 'ACTIVE', expiry: ev.expiry }); else if (ev.state === 'PENDING') fin({ ok: true, state: 'PENDING' }); } }
          S.waiters.push(w);
          st.order(offer).then(function (err) {
            if (!err) return;     // order sheet shown / purchase going through: wait for events
            fin(err.code === C.ErrorCode.PAYMENT_CANCELLED ? { ok: false, state: 'CANCELLED', code: 'CANCELLED', message: err.message } : { ok: false, state: 'ERROR', code: String(err.code), message: err.message });
          }, function (e) { fin({ ok: false, state: 'ERROR', code: 'EXCEPTION', message: String(e && e.message || e) }); });
        });
      });
    },

    /** restore() -> Promise<entitlement event>  (re-asks Google Play; call on "Restore purchases" and on every app start/resume) */
    restore: function () {
      return (S.initP || Promise.resolve()).then(function () {
        var st = store();
        if (!st) return plain(S.last || makeEvent('NONE', null, null, 'cache'));
        return st.restorePurchases().then(function () { return st.update(); }).then(function () { S.ready = true; recompute('play'); return plain(S.last || makeEvent('NONE', null, null, 'play')); }, function () { return plain(S.last || makeEvent('NONE', null, null, 'cache')); });
      });
    },

    /** onUpdate(cb) -> unsubscribe().  cb receives every entitlement change. The current state is replayed to a late subscriber (async). */
    onUpdate: function (cb) {
      if (typeof cb !== 'function') return function () { };
      S.listeners.push(cb);
      if (S.last) setTimeout(function () { try { cb(plain(S.last)); } catch (e) { } }, 0);
      return function () { var i = S.listeners.indexOf(cb); if (i >= 0) S.listeners.splice(i, 1); };
    },

    /** getEntitlement() -> last known event (sync) or null */
    getEntitlement: function () { return S.last ? plain(S.last) : null; },

    /** manage() -> opens Google Play's "Subscriptions" page (cancel / change / payment method). Put it behind the parental gate too. */
    manage: function () {
      var st = store(), C = cdv(); if (!st) return Promise.resolve({ ok: false });
      return st.manageSubscriptions(C.Platform.GOOGLE_PLAY).then(function (e) { return { ok: !e }; }, function () { return { ok: false }; });
    },

    /** test hook (used by bridge/test_billing.js; harmless in production) */
    _reset: function () { S.inited = false; S.initP = null; S.listeners = []; S.last = null; S.ready = false; S.waiters = []; }
  };

  root.MoodyBillingCapacitor = API;
  if (typeof module !== 'undefined' && module.exports) module.exports = API;
})(typeof window !== 'undefined' ? window : globalThis);
