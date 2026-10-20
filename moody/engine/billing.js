/* Moody & Aboody - engine/billing.js : BILLING ADAPTER (pluggable providers) -> normalized entitlement events.

   The game never talks to a store directly. It talks to Moody.billing, which talks to ONE provider:

     provider      where                                   notes
     ------------  --------------------------------------  ------------------------------------------------------------------------------------------
     capacitor     Android app (Capacitor wrapper)         calls a Capacitor plugin bridge (window.Capacitor.Plugins[config.capacitorPlugin]); contract below
     digitalgoods  Trusted Web Activity (Chrome on Android) W3C Digital Goods API + Payment Request API (method 'https://play.google.com/billing')
     mock          tests / local dev                         fully simulated store (success/cancel/pending/failure/restore/expiry/grace/hold/refund). Only if config.allowMock === true
     hubpay        WEB edition only (never in 'play')        the existing HubPay activation codes (paywall.js). It is NOT registered when edition === 'play':
                                                             Google's payments policy forbids unlocking digital content with external codes/links inside the app.
     none          fallback                                  store unavailable: prices unknown, purchase impossible, entitlement "unknown" (cached value is kept within the grace window)

   ---------- PUBLIC API (what the rest of the game / the Android wrapper agent relies on) ----------
     await Moody.billing.init()                 -> { provider:'capacitor'|'digitalgoods'|'mock'|'hubpay'|'none' }   (idempotent; picks the provider)
     Moody.billing.name                          current provider name (after init)
     await Moody.billing.getProducts()           -> [Product]   (monthly first, then yearly; [] when unknown; REJECTS on network error so the UI can show placeholders)
     await Moody.billing.purchase(planOrSku)     -> PurchaseResult
     await Moody.billing.getEntitlement()        -> EntEvent    (silent query of what the store says right now; REJECTS when it cannot know: offline / store down)
     await Moody.billing.restore()               -> EntEvent    (same as getEntitlement but user-initiated: the provider may re-sync with the store first)
     Moody.billing.onUpdate(fn)                  -> unsubscribe  fn(EntEvent) is called for asynchronous changes (renewal, pending resolved, revoked, refund)
     Moody.billing.manageUrl(sku)                -> 'https://play.google.com/store/account/subscriptions[?sku=..&package=..]'
     Moody.billing.register(name, impl)          add / replace a provider (the wrapper can inject its own)

   Product      { plan:'monthly'|'yearly', id, title, price:'ج.م 59.99' (store-formatted), priceMicros, currency, period:'P1M'|'P1Y'|null,
                  trial:{ period:'P7D' }|null (free trial offer), intro:{ price, period, cycles }|null }
   PurchaseResult { result:'success'|'cancel'|'pending'|'failure'|'already_owned', purchase?:{sku, token, expiry?}, error?:string }
   EntEvent     { state:'ACTIVE'|'EXPIRED'|'PENDING'|'NONE', sku?, expiry?:ms|null (null = unknown, the cache then uses a lease), token?, inGrace?:bool, graceUntil?:ms,
                  autoRenew?:bool, reason?:'expired'|'refunded'|'revoked'|'hold'|'cancelled' }
       ACTIVE   paid and entitled (inGrace: the store is retrying the payment but still entitles)
       EXPIRED  had a subscription, no longer entitled (ended, refunded, revoked, account hold)
       PENDING  purchase started but not paid yet (cash / slow payment methods): NOT entitled yet
       NONE     the store knows of no subscription
   A provider returning EXPIRED/NONE is DEFINITIVE (the entitlement is dropped at once, refunds work). A provider that cannot know must REJECT (the cache keeps working during the offline grace).

   ---------- CAPACITOR BRIDGE CONTRACT (implemented by the Android agent; window.Capacitor.Plugins.MoodyBilling) ----------
     initialize({ productIds:[...], packageName })                 -> {}
     getProducts({ productIds })                                    -> { products:[ { id, title, price, priceMicros, currency, period, trialPeriod?, introPrice?, introPeriod?, introCycles? } ] }
     purchase({ productId })                                        -> { status:'purchased'|'cancelled'|'pending'|'failed'|'already_owned', productId, purchaseToken?, expiryTime?, error? }
     restore()                                                      -> { purchases:[ { productId, purchaseToken, state:'purchased'|'pending'|'grace'|'hold'|'expired'|'refunded'|'revoked', expiryTime?(ms), autoRenewing?, graceUntil? } ] }
                                                                       (also used for the silent re-check on launch/foreground; MUST reject if the store cannot be reached)
     addListener('purchaseUpdate', cb)                              -> cb(<one purchase object as in restore()>)    (optional but recommended)
   Which plugin to wire behind it (recommendation, NOT tested here, no real purchase was made):
     * @revenuecat/purchases-capacitor (RevenueCat): best for a solo developer: handles Play Billing upgrades, pending, grace/hold states, restore and receipt validation on
       their server, gives real expiry dates. Costs: a third-party SDK (check it is allowed for Families/children's apps and that no advertising ID / personal data is collected;
       configure an anonymous app user id) and its revenue share above the free tier.
     * cordova-plugin-purchase (cdv-purchase, Capacitor-compatible): free, no third party, purchases are validated client side only, so combine it with relay/play_verify_worker.js.
   Either way the shim only has to map its objects to the 4 methods above.
*/
(function () {
  'use strict';
  const M = window.Moody = window.Moody || {}, C = M.config || { edition: 'web', productIds: {}, offlineGraceDays: 7 };
  const B = M.billing = { providers: {}, cur: null, name: 'none', _l: [], _init: null };
  const DAY = 864e5, MANAGE = 'https://play.google.com/store/account/subscriptions';
  const planOf = sku => Object.keys(C.productIds).find(k => C.productIds[k] === sku) || null;
  const skus = () => Object.keys(C.productIds).map(k => C.productIds[k]);
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  B.skus = skus; B.planOf = planOf;

  /* ISO-8601 duration helpers (P3D P1W P1M P1Y) */
  B.periodDays = p => { const m = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?$/.exec(p || ''); return m ? (+m[1] || 0) * 365 + (+m[2] || 0) * 30 + (+m[3] || 0) * 7 + (+m[4] || 0) : 0; };

  B.register = function (name, impl) {
    if (name === 'hubpay' && C.edition === 'play') return false;          // policy: no external codes in the Play edition
    if (name === 'mock' && !C.allowMock) return false;                      // never available unless the build explicitly allows it
    impl.name = name; B.providers[name] = impl; return true;
  };
  B.onUpdate = function (fn) { B._l.push(fn); return () => { const i = B._l.indexOf(fn); if (i >= 0) B._l.splice(i, 1); }; };
  B._emit = function (ev) { B._l.slice().forEach(f => { try { f(ev); } catch (e) { try { console.error(e); } catch (x) { } } }); };
  B.manageUrl = function (sku) { const q = []; if (sku) q.push('sku=' + encodeURIComponent(sku)); if (C.packageName) q.push('package=' + encodeURIComponent(C.packageName)); return MANAGE + (q.length ? '?' + q.join('&') : ''); };

  B.init = function () {
    if (B._init) return B._init;
    B._init = (async () => {
      const want = C.billingProvider || 'auto';
      const order = want === 'auto' ? ['capacitor', 'digitalgoods', 'mock', 'hubpay', 'none'] : [want, 'none'];
      let chosen = null;
      for (const n of order) { const p = B.providers[n]; let ok = false; try { ok = !!(p && p.available()); } catch (e) { } if (ok) { try { await p.init({ productIds: skus(), packageName: C.packageName || '' }); chosen = p; break; } catch (e) { try { console.warn('billing: ' + n + ' init failed: ' + (e && e.message)); } catch (x) { } } } }
      B.cur = chosen || B.providers.none; B.name = B.cur.name;
      if (B.cur.onUpdate) { try { B.cur.onUpdate(ev => B._emit(ev)); } catch (e) { } }
      return { provider: B.name };
    })();
    return B._init;
  };
  const P = async () => { await B.init(); return B.cur; };

  B.getProducts = async function () {
    const p = await P(); const list = await p.getProducts(skus());
    return (list || []).map(x => Object.assign({ trial: null, intro: null, period: null }, x, { plan: planOf(x.id) })).sort((a, b) => (a.plan === 'monthly' ? 0 : 1) - (b.plan === 'monthly' ? 0 : 1));
  };
  B.purchase = async function (planOrSku) {
    const sku = C.productIds[planOrSku] || planOrSku, p = await P();
    if (skus().indexOf(sku) < 0) return { result: 'failure', error: 'unknown_sku' };
    try { const r = await p.purchase(sku); return r && r.result ? r : { result: 'failure', error: 'bad_result' }; } catch (e) { return { result: 'failure', error: (e && e.message) || 'error' }; }
  };
  B.getEntitlement = async function () { const p = await P(); return clean(await p.getEntitlement()); };
  B.restore = async function () { const p = await P(); return clean(await (p.restore ? p.restore() : p.getEntitlement())); };
  function clean(ev) { ev = ev || { state: 'NONE' }; if (['ACTIVE', 'EXPIRED', 'PENDING', 'NONE'].indexOf(ev.state) < 0) ev = { state: 'NONE' }; return ev; }

  /* ---------- none ---------- */
  B.register('none', {
    available: () => true, init: async () => { },
    getProducts: async () => [], purchase: async () => ({ result: 'failure', error: 'unavailable' }),
    getEntitlement: async () => { throw new Error('billing_unavailable'); }
  });

  /* ---------- hubpay (web edition only) ---------- */
  B.register('hubpay', {
    available: () => !!window.HubPay, init: async () => { },
    getProducts: async () => [], purchase: async () => ({ result: 'failure', error: 'codes_only' }),
    getEntitlement: async () => window.HubPay && window.HubPay.isPro() ? { state: 'ACTIVE', sku: 'hubpay', expiry: Date.now() + window.HubPay.daysLeft() * DAY } : { state: 'NONE' },
    activate: code => window.HubPay.activate(code)
  });

  /* ---------- digitalgoods : W3C Digital Goods API + Payment Request (Trusted Web Activity) ---------- */
  (function () {
    const URLB = 'https://play.google.com/billing'; let svc = null;
    const getSvc = async () => svc || (svc = await window.getDigitalGoodsService(URLB));
    const fmt = pr => { try { return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: pr.currency }).format(parseFloat(pr.value)); } catch (e) { return pr.currency + ' ' + pr.value; } };
    B.register('digitalgoods', {
      available: () => typeof window.getDigitalGoodsService === 'function' && typeof window.PaymentRequest === 'function',
      init: async () => { await getSvc(); },
      async getProducts(ids) {
        const s = await getSvc(), d = await s.getDetails(ids);
        return d.map(x => ({
          id: x.itemId, title: x.title || '', price: fmt(x.price), priceMicros: Math.round(parseFloat(x.price.value) * 1e6), currency: x.price.currency,
          period: x.subscriptionPeriod || null, trial: x.freeTrialPeriod ? { period: x.freeTrialPeriod } : null,
          intro: x.introductoryPrice ? { price: fmt(x.introductoryPrice), period: x.introductoryPricePeriod || null, cycles: x.introductoryPriceCycles || 1 } : null
        }));
      },
      async purchase(sku) {
        const s = await getSvc(); let resp;
        try {
          const req = new PaymentRequest([{ supportedMethods: URLB, data: { sku } }], { total: { label: 'Total', amount: { currency: 'USD', value: '0' } } });
          resp = await req.show();
        } catch (e) {
          const n = (e && e.name) || '';
          if (n === 'AbortError' || /cancel|abort|dismiss/i.test((e && e.message) || '')) return { result: 'cancel' };
          if (/already/i.test((e && e.message) || '')) return { result: 'already_owned' };
          return { result: 'failure', error: n + (e && e.message ? ': ' + e.message : '') };
        }
        const token = resp.details && resp.details.purchaseToken;
        if (!token) { try { await resp.complete('fail'); } catch (e) { } return { result: 'failure', error: 'no_token' }; }
        /* entitle.js verifies server-side (if configured) AFTER this returns; the acknowledge is done here so Google does not auto-refund after 3 days.
           For subscriptions 'onetime' is what the Chrome docs use for non-consumables; verify on a real device (not tested here). A server-side acknowledge is also possible (worker). */
        try { await s.acknowledge(token, 'onetime'); } catch (e) { try { console.warn('billing: acknowledge failed ' + (e && e.message)); } catch (x) { } }
        try { await resp.complete('success'); } catch (e) { }
        return { result: 'success', purchase: { sku, token } };
      },
      async getEntitlement() {
        const s = await getSvc(), list = await s.listPurchases(), mine = (list || []).filter(x => skus().indexOf(x.itemId) >= 0);
        /* listPurchases() returns only the currently owned purchases and NO expiry date: expiry stays null (-> lease). Pending / on-hold purchases are not listed by Play. */
        return mine.length ? { state: 'ACTIVE', sku: mine[0].itemId, token: mine[0].purchaseToken, expiry: null } : { state: 'NONE' };
      }
    });
  })();

  /* ---------- capacitor : bridge to a native plugin (see the contract at the top of the file) ---------- */
  (function () {
    const plug = () => { const c = window.Capacitor; return (c && c.Plugins && c.Plugins[C.capacitorPlugin || 'MoodyBilling']) || window.MoodyBillingBridge || null; };
    function ev1(p) {
      const st = String(p.state || '').toLowerCase(), base = { sku: p.productId, token: p.purchaseToken, expiry: p.expiryTime != null ? +p.expiryTime : null, autoRenew: p.autoRenewing };
      if (st === 'purchased' || st === 'active') return Object.assign(base, { state: 'ACTIVE' });
      if (st === 'grace') return Object.assign(base, { state: 'ACTIVE', inGrace: true, graceUntil: p.graceUntil != null ? +p.graceUntil : (base.expiry != null ? base.expiry + 3 * DAY : null) });
      if (st === 'pending') return { state: 'PENDING', sku: p.productId };
      if (st === 'hold') return { state: 'EXPIRED', sku: p.productId, reason: 'hold' };
      if (st === 'refunded' || st === 'revoked') return { state: 'EXPIRED', sku: p.productId, reason: st };
      return { state: 'EXPIRED', sku: p.productId, reason: 'expired', expiry: base.expiry };
    }
    const rank = e => (e.state === 'ACTIVE' ? 3 : e.state === 'PENDING' ? 2 : 1);
    B.register('capacitor', {
      available: () => !!plug(),
      init: async o => { await plug().initialize(o); },
      async getProducts(ids) { const r = await plug().getProducts({ productIds: ids }); return (r.products || []).map(x => ({ id: x.id, title: x.title || '', price: x.price, priceMicros: x.priceMicros || 0, currency: x.currency || '', period: x.period || null, trial: x.trialPeriod ? { period: x.trialPeriod } : null, intro: x.introPrice ? { price: x.introPrice, period: x.introPeriod || null, cycles: x.introCycles || 1 } : null })); },
      async purchase(sku) {
        const r = await plug().purchase({ productId: sku }), st = r.status;
        if (st === 'purchased') return { result: 'success', purchase: { sku, token: r.purchaseToken, expiry: r.expiryTime != null ? +r.expiryTime : null } };
        if (st === 'cancelled') return { result: 'cancel' };
        if (st === 'pending') return { result: 'pending', purchase: { sku } };
        if (st === 'already_owned') return { result: 'already_owned' };
        return { result: 'failure', error: r.error || 'failed' };
      },
      async getEntitlement() {
        const r = await plug().restore(), list = (r.purchases || []).filter(x => skus().indexOf(x.productId) >= 0).map(ev1);
        if (!list.length) return { state: 'NONE' };
        list.sort((a, b) => rank(b) - rank(a) || (b.expiry || 0) - (a.expiry || 0)); return list[0];
      },
      onUpdate(cb) { const p = plug(); if (p && p.addListener) p.addListener('purchaseUpdate', x => { try { cb(ev1(x)); } catch (e) { } }); }
    });
  })();

  /* ---------- mock : simulated store for tests / local development (config.allowMock must be true) ---------- */
  (function () {
    if (!C.allowMock) return;
    const KEY = 'moody_mock_billing_v1';
    const st = { sub: null, next: 'success', offline: false, delay: 0, trial: true, failNext: null };
    try { const s = JSON.parse(localStorage.getItem(KEY) || 'null'); if (s) Object.assign(st, s); } catch (e) { }
    const save = () => { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch (e) { } };
    const rnd = () => 'mocktok-' + Math.random().toString(36).slice(2, 12);
    function current() {
      const s = st.sub; if (!s) return { state: 'NONE' }; const n = Date.now();
      if (s.status === 'pending') return { state: 'PENDING', sku: s.sku };
      if (s.status === 'refunded') return { state: 'EXPIRED', sku: s.sku, reason: 'refunded', expiry: s.exp };
      if (s.status === 'hold') return { state: 'EXPIRED', sku: s.sku, reason: 'hold', expiry: s.exp };
      if (s.status === 'grace') return n < s.graceUntil ? { state: 'ACTIVE', sku: s.sku, token: s.token, expiry: s.exp, inGrace: true, graceUntil: s.graceUntil, autoRenew: true } : { state: 'EXPIRED', sku: s.sku, reason: 'hold', expiry: s.exp };
      if (n < s.exp) return { state: 'ACTIVE', sku: s.sku, token: s.token, expiry: s.exp, autoRenew: s.autoRenew !== false };
      if (s.autoRenew) { s.exp += B.periodDays(s.sku === C.productIds.yearly ? 'P1Y' : 'P1M') * DAY; save(); return current(); }
      return { state: 'EXPIRED', sku: s.sku, reason: 'expired', expiry: s.exp };
    }
    const push = () => { const e = current(); Promise.resolve().then(() => B._emit(e)); };
    const guard = async () => { if (st.delay) await sleep(st.delay); if (st.offline) throw new Error('offline'); };
    const ctl = {
      state: st, current,
      reset() { st.sub = null; st.next = 'success'; st.offline = false; st.delay = 0; st.trial = true; save(); },
      setNext(x) { st.next = x; save(); }, setOffline(b) { st.offline = !!b; save(); }, setDelay(ms) { st.delay = ms; save(); }, setTrial(b) { st.trial = !!b; save(); },
      expireNow() { if (st.sub) { st.sub.exp = Date.now() - 1000; st.sub.autoRenew = false; if (st.sub.status === 'active') st.sub.status = 'active'; save(); push(); } },
      grace(ms) { if (st.sub) { st.sub.status = 'grace'; st.sub.exp = Date.now() - 1000; st.sub.graceUntil = Date.now() + (ms || 3 * DAY); save(); push(); } },
      hold() { if (st.sub) { st.sub.status = 'hold'; save(); push(); } },
      refund() { if (st.sub) { st.sub.status = 'refunded'; save(); push(); } },
      resolvePending(ok) { if (st.sub && st.sub.status === 'pending') { if (ok) { st.sub.status = 'active'; st.sub.exp = Date.now() + B.periodDays(st.sub.sku === C.productIds.yearly ? 'P1Y' : 'P1M') * DAY; } else st.sub = null; save(); push(); } },
      renew() { if (st.sub) { st.sub.status = 'active'; st.sub.exp = Math.max(st.sub.exp, Date.now()) + 30 * DAY; save(); push(); } },
      grant(sku, days, silent) { st.sub = { sku: sku || C.productIds.monthly, token: rnd(), status: 'active', exp: Date.now() + (days || 30) * DAY, autoRenew: false }; save(); if (!silent) push(); }
    };
    B.register('mock', {
      ctl, available: () => true, init: async () => { },
      async getProducts(ids) {
        await guard();
        return ids.map(id => { const y = id === C.productIds.yearly; return { id, title: y ? 'مودي وعبودي سنوي' : 'مودي وعبودي شهري', price: y ? 'ج.م 499.99' : 'ج.م 59.99', priceMicros: y ? 499990000 : 59990000, currency: 'EGP', period: y ? 'P1Y' : 'P1M', trial: st.trial ? { period: y ? 'P7D' : 'P3D' } : null, intro: null }; });
      },
      async purchase(sku) {
        await guard(); const how = st.next; st.next = 'success'; save();
        if (st.sub && st.sub.status === 'active' && Date.now() < st.sub.exp) return { result: 'already_owned' };
        if (how === 'cancel') return { result: 'cancel' };
        if (how === 'failure') return { result: 'failure', error: 'BILLING_UNAVAILABLE' };
        const y = sku === C.productIds.yearly, days = B.periodDays(y ? 'P1Y' : 'P1M') + (st.trial ? (y ? 7 : 3) : 0);
        st.sub = { sku, token: rnd(), status: how === 'pending' ? 'pending' : 'active', exp: Date.now() + days * DAY, autoRenew: false }; save();
        if (how === 'pending') return { result: 'pending', purchase: { sku } };
        return { result: 'success', purchase: { sku, token: st.sub.token, expiry: st.sub.exp } };
      },
      async getEntitlement() { await guard(); return current(); },
      async restore() { await guard(); return current(); },
      onUpdate() { /* events are pushed through B._emit by ctl */ }
    });
  })();
})();
