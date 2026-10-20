# Billing contract — `Moody.billing` capacitor provider ⇄ `window.MoodyBillingCapacitor`

The adapter file of the entitlement agent (`Moody.billing`, providers `mock` / `digitalgoods` / `capacitor`) was **not visible** when this was written, so this contract is defined by the Android side (`android/bridge/billing_capacitor.js`). If the adapter already assumes something different, change the **adapter's capacitor provider** (a 20-line shim), not the bridge — the bridge is covered by `node android/bridge/test_billing.js`.

## Where it lives
`make_www.js` injects `native/native_shell.js` and `native/billing_capacitor.js` as the first scripts of `index.html`, **only in the Android build**. After they run, `window.MoodyBillingCapacitor` exists. `window.MOODY_NATIVE === 'android'` and `<html class="native-android">` are set. In a normal browser neither exists → the capacitor provider must report "unavailable" and the game falls back to its other provider.

## API (all methods return Promises unless noted; none of them ever rejects)

```js
MoodyBillingCapacitor.isNative()                       // -> boolean (sync)
MoodyBillingCapacitor.initialize({ products: ['moody_premium_monthly','moody_premium_yearly'], graceDays: 30, debug: false })
        // -> { ok, available, errors? }   idempotent; call once at start
MoodyBillingCapacitor.getProducts()
        // -> [{ id, title, description, price /*Play's localized string, show as is*/, priceMicros, currency, period /*ISO-8601: P1M, P1Y*/, trialDays, canPurchase }]
MoodyBillingCapacitor.purchase(productId, { offerId? })
        // -> { ok, state: 'ACTIVE'|'PENDING'|'CANCELLED'|'ERROR'|'UNKNOWN', code?, message?, expiry? }
MoodyBillingCapacitor.restore()                        // -> entitlement event (re-asks Google Play)
MoodyBillingCapacitor.onUpdate(cb)                     // -> unsubscribe()  (sync). Late subscribers get the current state replayed (async).
MoodyBillingCapacitor.getEntitlement()                 // -> last event or null (sync)
MoodyBillingCapacitor.manage()                         // -> { ok }  opens Google Play's subscription page (cancel/change)
```

## Entitlement event (what `onUpdate` delivers, and what `restore()` resolves to)
```js
{ type: 'entitlement',
  state: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'NONE',
  productId: string|null,        // the product that is active (or was)
  expiry: number|null,           // epoch ms. null = unknown (normal without a validation server)
  checkedAt: number,             // epoch ms of this answer
  source: 'play' | 'cache',      // 'cache' = optimistic start-up value, Play has not answered yet
  autoRenewing: boolean|null }   // currently always null
```
| state | meaning | the game should |
|---|---|---|
| `ACTIVE` | a subscription is active | unlock everything. If `expiry` is a number, re-lock after it **plus a few days grace**; if `null`, stay unlocked until a later `EXPIRED`/`NONE`. |
| `PENDING` | payment pending (cash, slow bank — common in Egypt) | keep locked, show "payment pending, content unlocks automatically". Do **not** grant access. |
| `EXPIRED` | was active, Google Play no longer reports it | re-lock premium content; keep progress; show the subscribe screen (behind the parental gate). |
| `NONE` | never subscribed / nothing owned | free content only. |

Ordering guarantees: a cached `ACTIVE` may arrive first (`source:'cache'`), then the authoritative event (`source:'play'`). A confirmed `play` answer is never replaced by a `cache` one. Identical consecutive events are not repeated.

## Rules for the game side
1. **Parental gate before `purchase()` and `manage()`** (Families policy). The bridge does not enforce it.
2. Show `price` exactly as returned (Play localizes currency/tax). Never hard-code "49 EGP".
3. Call `restore()` on app start (after `initialize`), on resume from background, and on a visible "Restore purchases" button in the parent area.
4. Do not store your own "premium=true" flag as the source of truth; use the last event. (The bridge already persists the last ACTIVE in `localStorage['moody_play_entitlement_v1']` for offline start; the 30-day `graceDays` bounds how long a stale cached ACTIVE is trusted.)
5. In the Play build there must be **no other way to unlock** (no codes, no e-mail link, no external payment) — `make_www.js` lint fails the build on the known leftovers.
6. Product ids to create in Play Console: `moody_premium_monthly`, `moody_premium_yearly` (subscriptions, one base plan each, auto-renewing). Ids are permanent.

## Mapping from the plugin (for maintainers)
`store.owned(id)` true → `ACTIVE`; a local transaction in state `pending` → `PENDING`; receipts loaded and nothing owned → `EXPIRED` if the cache said ACTIVE, else `NONE`; order sheet closed by the user (`ErrorCode.PAYMENT_CANCELLED`) → `purchase()` resolves `CANCELLED`. `approved` transactions are acknowledged with `finish()` (no validator). Replace the plugin = rewrite only `billing_capacitor.js`.

## Test without a device
`node android/bridge/test_billing.js` — six scenarios against a mock `CdvPurchase`: fresh install, purchase, cached-ACTIVE start then confirm, lapse → EXPIRED, user cancels, no plugin (browser).
