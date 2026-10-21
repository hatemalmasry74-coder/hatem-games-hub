/* engine/billing.js (DIRECT edition) : minimal provider adapter. The only real provider is 'codes' (engine/direct_codes.js): activation codes entered by the buyer.
   Same public surface as the full adapter so engine/entitle.js is unchanged: init, onUpdate, getProducts, purchase, getEntitlement, restore, planOf, periodDays, register. */
(function () {
  'use strict';
  const M = window.Moody = window.Moody || {}, C = M.config || { productIds: {} };
  const B = M.billing = { providers: {}, cur: null, name: 'none', _l: [], _init: null };
  B.planOf = sku => Object.keys(C.productIds || {}).find(k => C.productIds[k] === sku) || null;
  B.skus = () => Object.keys(C.productIds || {}).map(k => C.productIds[k]);
  B.periodDays = () => 0;
  B.register = function (name, impl) { impl.name = name; B.providers[name] = impl; return true; };
  B.onUpdate = function (fn) { B._l.push(fn); return () => { const i = B._l.indexOf(fn); if (i >= 0) B._l.splice(i, 1); }; };
  B._emit = function (ev) { B._l.slice().forEach(f => { try { f(ev); } catch (e) { } }); };
  B.manageUrl = () => '';
  B.init = function () {
    if (B._init) return B._init;
    B._init = (async () => {
      for (const n of ['codes', 'none']) { const p = B.providers[n]; let ok = false; try { ok = !!(p && p.available()); } catch (e) { } if (ok) { try { await p.init(); B.cur = p; break; } catch (e) { } } }
      B.cur = B.cur || B.providers.none; B.name = B.cur.name; return { provider: B.name };
    })();
    return B._init;
  };
  const P = async () => { await B.init(); return B.cur; };
  const clean = ev => { ev = ev || { state: 'NONE' }; return ['ACTIVE', 'EXPIRED', 'PENDING', 'NONE'].indexOf(ev.state) < 0 ? { state: 'NONE' } : ev; };
  B.getProducts = async () => [];
  B.purchase = async () => ({ result: 'failure', error: 'codes_only' });
  B.getEntitlement = async () => clean(await (await P()).getEntitlement());
  B.restore = async () => { const p = await P(); return clean(await (p.restore ? p.restore() : p.getEntitlement())); };
  B.register('none', { available: () => true, init: async () => { }, getEntitlement: async () => { throw new Error('unavailable'); } });
})();
