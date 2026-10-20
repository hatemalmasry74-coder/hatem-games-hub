/* node bridge/test_billing.js : exercises billing_capacitor.js against a mock CdvPurchase (no device needed). */
const assert = require('assert');
const mem = {}; global.window = global; global.localStorage = { getItem: k => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); }, removeItem: k => { delete mem[k]; } };
global.document = { addEventListener() { } };
function mock(ownedIds, opts) {
  opts = opts || {}; const handlers = {}, owned = new Set(ownedIds), tx = [];
  const when = { approved(f) { handlers.approved = f; return when; }, finished(f) { handlers.finished = f; return when; }, pending(f) { handlers.pending = f; return when; }, productUpdated(f) { return when; }, receiptsReady(f) { handlers.ready = f; return when; } };
  global.CdvPurchase = {
    ProductType: { PAID_SUBSCRIPTION: 'paid subscription' }, Platform: { GOOGLE_PLAY: 'android-playstore' }, ErrorCode: { PAYMENT_CANCELLED: 6777006, SETUP: 6777001 }, TransactionState: { PENDING: 'pending' },
    store: {
      localTransactions: tx, register() { }, error() { }, when: () => when,
      initialize: async () => { setTimeout(() => handlers.ready && handlers.ready(), 5); return []; },
      owned: id => owned.has(id), update: async () => { }, restorePurchases: async () => { },
      get: id => ({ id, title: id, description: 'd', canPurchase: true, pricing: { price: 'EGP 49.00', priceMicros: 49e6, currency: 'EGP', billingPeriod: 'P1M' }, getOffer: () => ({ pricingPhases: [{ price: 'EGP 49.00', priceMicros: 49e6, currency: 'EGP', billingPeriod: 'P1M' }] }) }),
      order: async () => { if (opts.cancel) return { code: 6777006, message: 'cancelled' }; owned.add('moody_premium_monthly'); setTimeout(() => { handlers.approved && handlers.approved({ finish() { handlers.finished && handlers.finished(); } }); }, 5); },
      manageSubscriptions: async () => undefined
    }
  };
}
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  const B = require('./billing_capacitor.js');
  // 1) fresh install, nothing owned -> NONE
  mock([]); let ev = []; B.onUpdate(e => ev.push(e.state));
  let r = await B.initialize({ products: ['moody_premium_monthly', 'moody_premium_yearly'] }); await sleep(30);
  assert(r.ok && r.available); assert.deepStrictEqual(ev, ['NONE']);
  const prods = await B.getProducts(); assert.strictEqual(prods.length, 2); assert.strictEqual(prods[0].price, 'EGP 49.00');
  // 2) purchase -> ACTIVE
  const p = await B.purchase('moody_premium_monthly'); assert(p.ok && p.state === 'ACTIVE'); assert.strictEqual(ev[ev.length - 1], 'ACTIVE');
  assert(JSON.parse(mem.moody_play_entitlement_v1).state === 'ACTIVE');
  // 3) next launch, offline-ish: cached ACTIVE is emitted immediately, then confirmed
  B._reset(); delete require.cache[require.resolve('./billing_capacitor.js')]; mock(['moody_premium_monthly']); const B2 = require('./billing_capacitor.js'); ev = []; B2.onUpdate(e => ev.push(e.state + ':' + e.source));
  await B2.initialize({ products: ['moody_premium_monthly'] }); await sleep(30); assert.strictEqual(ev[0], 'ACTIVE:cache'); assert(ev.includes('ACTIVE:play'), ev.join());
  // 4) subscription lapsed: Play reports nothing owned -> EXPIRED, cache cleared
  delete require.cache[require.resolve('./billing_capacitor.js')]; mock([]); const B3 = require('./billing_capacitor.js'); ev = []; B3.onUpdate(e => ev.push(e.state + ':' + e.source));
  await B3.initialize({ products: ['moody_premium_monthly'] }); await sleep(30); assert.deepStrictEqual(ev, ['ACTIVE:cache', 'EXPIRED:play']); assert(!mem.moody_play_entitlement_v1);
  // 5) user cancels the Play sheet
  delete require.cache[require.resolve('./billing_capacitor.js')]; mock([], { cancel: true }); const B4 = require('./billing_capacitor.js');
  await B4.initialize({ products: ['moody_premium_monthly'] }); const c = await B4.purchase('moody_premium_monthly'); assert.strictEqual(c.state, 'CANCELLED');
  // 6) no plugin (browser preview) -> NONE, no throw
  delete require.cache[require.resolve('./billing_capacitor.js')]; delete global.CdvPurchase; const B5 = require('./billing_capacitor.js'); const r5 = await B5.initialize({ products: ['x'] }); assert.strictEqual(r5.available, false);
  console.log('billing bridge: all tests passed');
})().catch(e => { console.error(e); process.exit(1); });
