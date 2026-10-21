/* Family Adventures - engine/config.js  (loaded FIRST, before core.js)
   Edition switch + monetisation settings + an INERT entitlement stub.

   Moody.config.edition  'web' (default, free, no paywall, nothing changes)  |  'play' (the store edition: 1 free mission per world, the rest need a subscription)

   Who decides the edition (first match wins):
     1. a preset made by the wrapper BEFORE this file runs:  window.MOODY_CONFIG = { edition: 'play', ... }  (or window.Moody.config = {...})
        -> a preset edition can NOT be changed from the URL (a Play build cannot be turned into 'web' with ?edition=web)
     2. ?edition=play in the URL (dev/testing of the web build; it can only make the game MORE restrictive)
     3. 'web'

   Every other key can be pre-set the same way (see DEFAULTS). entitle.js replaces the stub below with the real model; when the edition is 'web' the real model is
   inert too (canPlay() always true), so the web game behaves exactly as before. */
(function () {
  'use strict';
  const M = window.Moody = window.Moody || {};
  const pre = Object.assign({}, window.MOODY_CONFIG || {}, M.config || {});
  let q = ''; try { q = location.search || ''; } catch (e) { }
  const edition = (pre.edition === 'play' || pre.edition === 'web') ? pre.edition : (/[?&]edition=play(&|$)/.test(q) ? 'play' : 'web');

  const DEFAULTS = {
    edition: 'web',
    /* ---- which missions are free (play edition) ---- */
    freePerWorld: 1,                 // the first N missions (array order) of every normal world are free
    freeMissions: {},                // per-world override: { school: ['m1','m3'], runs: '*' }   ('*' = whole world free)
    freeWorlds: ['room', 'call', 'parents'],   // always free (hidden/special worlds are free automatically too)
    premiumSkipsChain: true,         // subscribers may start any mission (no "finish the previous one first" chain)
    /* ---- billing ---- */
    billingProvider: 'auto',         // 'auto' | 'capacitor' | 'digitalgoods' | 'none'
    capacitorPlugin: 'MoodyBilling', // name of the Capacitor plugin that implements the bridge contract (see billing.js)
    productIds: { monthly: 'moody_premium_monthly', yearly: 'moody_premium_yearly' },
    packageName: '',                 // android applicationId, used for the manage-subscription deep link and the verify worker
    /* ---- entitlement cache / verification ---- */
    offlineGraceDays: 7,             // days a cached ACTIVE entitlement is trusted without a successful store check (after its expiry, or after the last check when no expiry is known)
    refreshMinutes: 15,              // re-verify on foreground when the last check is older than this
    verifyUrl: '',                   // optional: URL of relay/play_verify_worker.js. When set, every new/renewed purchase is verified server-side
    verifyStrict: false,             // true: a purchase that cannot be verified (network) is NOT trusted
    /* ---- parent-facing legal ---- */
    termsUrl: '', privacyUrl: '',    // optional external pages (opened only after the parental gate); the in-app summaries are always available
    openExternal: null,              // optional function(url) supplied by the wrapper (e.g. Capacitor Browser.open)
    /* ---- dev ---- */
    devUnlockHash: '',               // SHA-256 hex of a secret; '?devunlock=<secret>' unlocks everything in a play build ONLY when it hashes to this. Leave '' in release builds.
    gateWeb: false,                  // true: apply the paywall in the web edition too (not used in the Play edition). Off by default.
    lang: 'ar'
  };
  const C = M.config = Object.assign({}, DEFAULTS, pre, { edition });
  C.productIds = Object.assign({}, DEFAULTS.productIds, pre.productIds || {});

  /* ---------- inert stub: replaced by entitle.js (the UI/flow code can call these unconditionally) ---------- */
  M.ent = {
    stub: true, active: false,
    canPlay: () => true, isPremium: () => true, isFree: () => true,
    totals(w) { const S = M.save; return { n: w.missions.length, tot: w.missions.length * 3, got: S.mapStars(w), done: S.done(w), locked: 0 }; },
    decorateCard() { }, lockBadge: () => null, promptLocked() { }, parentSection: () => null, skipChain: () => false, blocked() { }
  };
})();
