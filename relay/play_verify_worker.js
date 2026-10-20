// moody-play-verify: OPTIONAL Cloudflare Worker that verifies a Google Play subscription purchase token for the Moody & Aboody Play edition.
// NOT DEPLOYED. NO SECRETS IN THIS REPO. Written from the public Play Developer API docs; it has NOT been run against the real API (no Play app / service account exists yet):
// test it with a license-tester account in the Play Console before trusting it.
//
// Why: the Android client can be patched on a rooted device. Asking Google (through this worker) whether the token is really an active subscription makes a fake
// "I'm subscribed" much harder, and it gives the client a real expiry date (the Digital Goods API does not). The client calls it only when Moody.config.verifyUrl is set.
//
// Request  POST /   { "packageName": "com.example.moody", "productId": "moody_premium_monthly", "purchaseToken": "<token>", "acknowledge": true }
// Response 200      { "ok": true, "state": "ACTIVE"|"EXPIRED"|"PENDING"|"NONE", "expiry": <ms|null>, "inGrace": bool, "graceUntil": <ms|0>, "autoRenewing": bool,
//                     "reason": ""|"expired"|"hold"|"paused"|"cancelled"|"refunded", "acknowledged": bool }
//          4xx/5xx  { "ok": false, "error": "..." }   (the client treats it as "could not verify": keeps the store's answer unless config.verifyStrict)
//
// Setup (owner, once):
//   1. Google Cloud: create a service account, enable "Google Play Android Developer API", download its JSON key.
//   2. Play Console -> Users and permissions -> invite the service account e-mail, permission "View financial data" + "Manage orders and subscriptions" (needed for acknowledge).
//   3. wrangler.toml (no secrets in it):   name = "moody-play-verify"   main = "relay/play_verify_worker.js"   compatibility_date = "2024-11-01"
//        [vars]  PACKAGE_NAME = "com.example.moody"   PRODUCT_IDS = "moody_premium_monthly,moody_premium_yearly"   ALLOWED_ORIGINS = "https://localhost,capacitor://localhost,https://<your-twa-host>"
//   4. wrangler secret put GOOGLE_SERVICE_ACCOUNT_JSON      (paste the whole JSON key; it lives only in Cloudflare)
//   5. wrangler deploy, then set Moody.config.verifyUrl to the worker URL in the Android build.
// Privacy: the worker receives only the purchase token + product id (no child data), logs nothing, stores nothing (the OAuth token is cached in memory for ~50 min).
// Limits (honest): refunds/voids are reflected by the subscription state Google reports (EXPIRED / canceledStateContext); for guaranteed refund handling also poll the
// Voided Purchases API or use Real-time developer notifications (RTDN) - not implemented here. The grace-period end is an estimate (see mapSubscription).

const SCOPE = 'https://www.googleapis.com/auth/androidpublisher';
const API = 'https://androidpublisher.googleapis.com/androidpublisher/v3/applications';
const DAY = 864e5;
let tokenCache = { tok: '', exp: 0 };

const b64u = buf => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = s => b64u(new TextEncoder().encode(s));

async function accessToken(env) {
  if (tokenCache.tok && Date.now() < tokenCache.exp) return tokenCache.tok;
  const sa = JSON.parse(env.GOOGLE_SERVICE_ACCOUNT_JSON), iat = Math.floor(Date.now() / 1000);
  const head = b64uStr(JSON.stringify({ alg: 'RS256', typ: 'JWT' })), claim = b64uStr(JSON.stringify({ iss: sa.client_email, scope: SCOPE, aud: 'https://oauth2.googleapis.com/token', iat, exp: iat + 3600 }));
  const pem = sa.private_key.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, ''), der = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', der, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(head + '.' + claim));
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: 'grant_type=' + encodeURIComponent('urn:ietf:params:oauth:grant-type:jwt-bearer') + '&assertion=' + head + '.' + claim + '.' + b64u(sig) });
  if (!r.ok) throw new Error('oauth_' + r.status);
  const j = await r.json(); tokenCache = { tok: j.access_token, exp: Date.now() + Math.max(60, (j.expires_in || 3600) - 600) * 1000 }; return tokenCache.tok;
}

/* SubscriptionPurchaseV2 (purchases.subscriptionsv2.get) -> the game's normalized entitlement event. Pure function (unit-tested in tools/entitle_test.js). */
export function mapSubscription(v2, productId, now) {
  now = now || Date.now();
  const li = (v2.lineItems || []).find(x => x.productId === productId) || (v2.lineItems || [])[0] || {}, exp = li.expiryTime ? Date.parse(li.expiryTime) : null;
  const ack = v2.acknowledgementState === 'ACKNOWLEDGEMENT_STATE_ACKNOWLEDGED', auto = !!(li.autoRenewingPlan && li.autoRenewingPlan.autoRenewEnabled);
  const out = { ok: true, state: 'NONE', expiry: exp, inGrace: false, graceUntil: 0, autoRenewing: auto, reason: '', acknowledged: ack };
  switch (v2.subscriptionState) {
    case 'SUBSCRIPTION_STATE_ACTIVE': out.state = 'ACTIVE'; break;
    case 'SUBSCRIPTION_STATE_CANCELED':            // user cancelled auto-renew: still entitled until the paid period ends
      if (exp && exp > now) out.state = 'ACTIVE'; else { out.state = 'EXPIRED'; out.reason = 'cancelled'; } break;
    case 'SUBSCRIPTION_STATE_IN_GRACE_PERIOD': out.state = 'ACTIVE'; out.inGrace = true; out.graceUntil = Math.max(exp || 0, now) + 3 * DAY; break;   // ESTIMATE: verify the real field in the sandbox
    case 'SUBSCRIPTION_STATE_ON_HOLD': out.state = 'EXPIRED'; out.reason = 'hold'; break;
    case 'SUBSCRIPTION_STATE_PAUSED': out.state = 'EXPIRED'; out.reason = 'paused'; break;
    case 'SUBSCRIPTION_STATE_PENDING': out.state = 'PENDING'; break;
    case 'SUBSCRIPTION_STATE_EXPIRED': out.state = 'EXPIRED'; out.reason = v2.canceledStateContext && (v2.canceledStateContext.developerInitiatedCancellation || v2.canceledStateContext.systemInitiatedCancellation) ? 'refunded' : 'expired'; break;
    default: out.state = 'NONE';                   // includes SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED and unknown values
  }
  return out;
}

const cors = (req, env) => {
  const o = req.headers.get('Origin') || '', allow = String(env.ALLOWED_ORIGINS || '').split(',').map(x => x.trim()).filter(Boolean);
  const h = { 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type', 'vary': 'Origin' };
  if (o && allow.indexOf(o) >= 0) h['access-control-allow-origin'] = o; return h;
};
const json = (o, status, h) => new Response(JSON.stringify(o), { status: status || 200, headers: Object.assign({ 'content-type': 'application/json', 'cache-control': 'no-store' }, h || {}) });

export default {
  async fetch(req, env) {
    const h = cors(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: h });
    if (req.method !== 'POST') return new Response('moody-play-verify ok', { status: 200, headers: { 'content-type': 'text/plain' } });
    const origin = req.headers.get('Origin');
    if (origin && !h['access-control-allow-origin']) return json({ ok: false, error: 'origin' }, 403, h);
    let b; try { b = await req.json(); } catch (e) { return json({ ok: false, error: 'json' }, 400, h); }
    const productId = String(b.productId || ''), token = String(b.purchaseToken || ''), pkg = String(env.PACKAGE_NAME || '');
    const allowed = String(env.PRODUCT_IDS || '').split(',').map(x => x.trim()).filter(Boolean);
    if (!pkg || (b.packageName && b.packageName !== pkg)) return json({ ok: false, error: 'package' }, 400, h);   // never trust a package name from the client
    if (!productId || (allowed.length && allowed.indexOf(productId) < 0)) return json({ ok: false, error: 'product' }, 400, h);
    if (!/^[\w.\-]{20,600}$/.test(token)) return json({ ok: false, error: 'token' }, 400, h);
    try {
      const at = await accessToken(env), r = await fetch(API + '/' + encodeURIComponent(pkg) + '/purchases/subscriptionsv2/tokens/' + encodeURIComponent(token), { headers: { authorization: 'Bearer ' + at } });
      if (r.status === 404 || r.status === 410) return json({ ok: true, state: 'NONE', expiry: null, inGrace: false, graceUntil: 0, autoRenewing: false, reason: '', acknowledged: false }, 200, h);
      if (!r.ok) return json({ ok: false, error: 'play_' + r.status }, 502, h);
      const out = mapSubscription(await r.json(), productId, Date.now());
      if (b.acknowledge && !out.acknowledged && (out.state === 'ACTIVE')) {     // acknowledge within 3 days or Google refunds the purchase
        const a = await fetch(API + '/' + encodeURIComponent(pkg) + '/purchases/subscriptions/' + encodeURIComponent(productId) + '/tokens/' + encodeURIComponent(token) + ':acknowledge', { method: 'POST', headers: { authorization: 'Bearer ' + at, 'content-type': 'application/json' }, body: '{}' });
        out.acknowledged = a.ok;
      }
      return json(out, 200, h);
    } catch (e) { return json({ ok: false, error: 'internal' }, 500, h); }   // never echo the exception (it could contain request details)
  }
};
