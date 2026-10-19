/* Moody & Aboody - sw.js : offline-capable service worker (scope: /moody/).
   * index.html / navigations ........ NETWORK-FIRST (3.5 s timeout), cache only as the offline fallback  -> an update always reaches an online player on the next load.
   * engine / worlds / content / icons / css / json ... STALE-WHILE-REVALIDATE (instant from cache, refreshed in the background; when the fresh copy differs a
                                        {type:'moody-update'} message is posted so the page can offer a reload - see ui.js UI.offerUpdate).
   * assets/voice/*.mp3 (+ ../sonic cheer clips) .... CACHE ON FIRST USE, LRU-capped at VOICE_MAX clips, Range requests answered with 206 slices (Safari needs that for <audio>).
   * the app shell is PRE-CACHED at install: the worker reads index.html, takes the ?v= number from its asset URLs and the file lists from index.html + worlds/registry.js,
     so nothing here has to be edited when files are added or ?v= is bumped. Cache names carry the ?v= number: moody-shell-v<N>. The previous version is kept for one more
     generation (so a page that is still open never loses its files), older ones are deleted. */
'use strict';
const PREFIX = 'moody-', VOICE_CACHE = 'moody-voice', META_CACHE = 'moody-meta', VOICE_MAX = 1500, LRU_KEY = '/__moody_lru__';
const NAV_TIMEOUT = 3500;
let SHELL = null;          // current shell cache name, e.g. moody-shell-v4 (resolved lazily)

const scopeUrl = p => new URL(p, self.registration.scope).href;
const isVoice = u => /\/assets\/voice\/[0-9a-f]{12}\.mp3$/.test(u.pathname) || /\/sonic\/assets\/v\/[^/]+\.mp3$/.test(u.pathname);
const isVoiceManifest = u => /\/assets\/voice\/manifest\.json$/.test(u.pathname);
const isShellAsset = u => /\.(js|css|json|png|jpg|jpeg|svg|webp|ico|woff2?)$/.test(u.pathname);

/* ---------- version + file lists (read from the network copy of index.html and registry.js) ---------- */
async function readVersion(html) { const m = html.match(/\?v=(\d+)/g) || []; let v = 0; m.forEach(x => { v = Math.max(v, +x.slice(3)); }); return v || 1; }
async function listShell(html, ver) {
  const out = new Set([scopeUrl('./'), scopeUrl('index.html'), scopeUrl('manifest.json'), scopeUrl('icons/icon-192.png'), scopeUrl('icons/icon-512.png'), scopeUrl('icons/apple-touch-icon.png'), scopeUrl('assets/voice/manifest.json?v=' + ver)]);
  ['moody', 'aboody', 'toota', 'nemo', 'baba'].forEach(n => out.add(scopeUrl('assets/' + n + '_cartoon.jpg')));
  const re = /(?:src|href)="([^"#]+)"/g; let m;
  while ((m = re.exec(html))) { const u = m[1]; if (/^(https?:)?\/\//.test(u) || u.startsWith('data:')) continue; out.add(new URL(u, scopeUrl('index.html')).href); }
  try {   // world / content scripts are listed in worlds/registry.js (Moody.load = [...])
    const r = await fetch(scopeUrl('worlds/registry.js?v=' + ver), { cache: 'no-store' });
    if (r.ok) { const t = await r.text(), rx = /['"]((?:worlds|content|engine)\/[\w\-./]+\.js)['"]/g; let q; while ((q = rx.exec(t))) out.add(scopeUrl(q[1] + '?v=' + ver)); }
  } catch (e) { }
  return Array.from(out);
}
async function precache(html, force) {
  const ver = await readVersion(html), name = PREFIX + 'shell-v' + ver; SHELL = name;
  const c = await caches.open(name);
  if (!force && await c.match(scopeUrl('__complete__'))) return name;
  const urls = await listShell(html, ver);
  await Promise.all(urls.map(async u => { try { const r = await fetch(u, { cache: 'reload' }); if (r && r.ok) await c.put(u, r); } catch (e) { } }));
  try { await c.put(scopeUrl('__complete__'), new Response('1')); } catch (e) { }
  return name;
}
async function shellCache() {
  if (SHELL) return caches.open(SHELL);
  const ks = (await caches.keys()).filter(k => k.startsWith(PREFIX + 'shell-v')).sort((a, b) => parseInt(b.split('-v')[1]) - parseInt(a.split('-v')[1]));
  SHELL = ks[0] || PREFIX + 'shell-v0'; return caches.open(SHELL);
}
async function lookup(req) {   // current shell first, then any older one (a page loaded before an update may still ask for its own ?v= URLs)
  const c = await shellCache(); let r = await c.match(req); if (r) return r;
  for (const k of await caches.keys()) { if (!k.startsWith(PREFIX + 'shell-v') || k === SHELL) continue; r = await (await caches.open(k)).match(req); if (r) return r; }
  return null;
}

self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil((async () => { try { const r = await fetch(scopeUrl('index.html'), { cache: 'no-store' }); if (r.ok) await precache(await r.text(), true); } catch (err) { } })());
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const ks = await caches.keys(), shells = ks.filter(k => k.startsWith(PREFIX + 'shell-v')).sort((a, b) => parseInt(b.split('-v')[1]) - parseInt(a.split('-v')[1]));
    await Promise.all(ks.filter(k => (k.startsWith(PREFIX) && !k.startsWith(PREFIX + 'shell-v') && k !== VOICE_CACHE && k !== META_CACHE) || shells.indexOf(k) >= 2 || /^(hub|moody)-v\d+$/.test(k)).map(k => caches.delete(k)));   // old single-cache names + versions older than the previous one
    await self.clients.claim();
  })());
});

/* ---------- LRU bookkeeping for the voice cache (url -> last-used ms), persisted in a tiny cache entry ---------- */
let lru = null, lruTimer = 0;
async function lruLoad() { if (lru) return lru; try { const c = await caches.open(META_CACHE), r = await c.match(LRU_KEY); lru = r ? await r.json() : {}; } catch (e) { lru = {}; } return lru; }
async function lruSave() { try { const c = await caches.open(META_CACHE); await c.put(LRU_KEY, new Response(JSON.stringify(lru), { headers: { 'content-type': 'application/json' } })); } catch (e) { } }
function lruSchedule() { if (lruTimer) return; lruTimer = setTimeout(() => { lruTimer = 0; lruSave(); }, 4000); }
async function lruTouch(url, vc) {
  const m = await lruLoad(); m[url] = Date.now(); lruSchedule();
  const keys = Object.keys(m); if (keys.length <= VOICE_MAX) return;
  keys.sort((a, b) => m[a] - m[b]); const drop = keys.slice(0, keys.length - VOICE_MAX + 100);   // trim 100 below the cap so we do not evict on every new clip
  for (const k of drop) { delete m[k]; try { await vc.delete(k); } catch (e) { } }
  lruSave();
}

/* ---------- helpers ---------- */
function rangeResponse(full, rangeHeader) {   // answer a Range request from a full cached/network response
  const m = /bytes=(\d*)-(\d*)/.exec(rangeHeader || ''); if (!m) return full;
  return full.arrayBuffer().then(buf => {
    const size = buf.byteLength; let s = m[1] === '' ? Math.max(0, size - parseInt(m[2], 10)) : parseInt(m[1], 10), en = m[1] === '' || m[2] === '' ? size - 1 : Math.min(size - 1, parseInt(m[2], 10));
    if (isNaN(s) || s >= size) return new Response('', { status: 416, headers: { 'Content-Range': 'bytes */' + size } });
    const h = new Headers(); h.set('Content-Type', full.headers.get('Content-Type') || 'audio/mpeg'); h.set('Accept-Ranges', 'bytes'); h.set('Content-Range', 'bytes ' + s + '-' + en + '/' + size); h.set('Content-Length', String(en - s + 1));
    return new Response(buf.slice(s, en + 1), { status: 206, statusText: 'Partial Content', headers: h });
  });
}
async function sameBody(a, b) {   // did the file change? validators first (etag / last-modified), else compare the bytes (small js / css files)
  if (!a || !b) return false; const ea = a.headers.get('etag'), eb = b.headers.get('etag'); if (ea && eb) return ea === eb;
  const la = a.headers.get('last-modified'), lb = b.headers.get('last-modified'); if (la && lb) return la === lb;
  try { const [x, y] = await Promise.all([a.clone().arrayBuffer(), b.clone().arrayBuffer()]); if (x.byteLength !== y.byteLength) return false; const u = new Uint8Array(x), v = new Uint8Array(y); for (let i = 0; i < u.length; i++) if (u[i] !== v[i]) return false; return true; } catch (e) { return true; }
}
async function notifyUpdate() { try { const cl = await self.clients.matchAll({ type: 'window' }); cl.forEach(c => c.postMessage({ type: 'moody-update' })); } catch (e) { } }
function withTimeout(p, ms) { return new Promise((res, rej) => { const t = setTimeout(() => rej(new Error('timeout')), ms); p.then(v => { clearTimeout(t); res(v); }, e => { clearTimeout(t); rej(e); }); }); }

/* ---------- strategies ---------- */
async function navigate(e) {
  const req = e.request;
  try {
    const net = await withTimeout(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin', redirect: 'follow' }), NAV_TIMEOUT);   // 'no-cache' = always revalidate with the server (never a heuristically fresh HTTP-cache copy)
    if (net && net.ok && net.type === 'basic') {
      const copy = net.clone(), copy2 = net.clone();
      e.waitUntil((async () => {
        try { const c = await shellCache(); await c.put(scopeUrl('index.html'), copy); await c.put(scopeUrl('./'), copy2.clone()); } catch (err) { }
        try { const txt = await copy2.text(), ver = await readVersion(txt); if (PREFIX + 'shell-v' + ver !== SHELL) { await precache(txt, false); await notifyUpdate(); } } catch (err) { }   // ?v= bumped: seed the new cache, tell the page
      })());
    }
    return net;
  } catch (err) {
    const c = await shellCache(); return (await c.match(req, { ignoreSearch: true })) || (await c.match(scopeUrl('index.html'))) || (await c.match(scopeUrl('./'))) || (await lookup(scopeUrl('index.html'))) || Response.error();
  }
}
async function swr(e) {
  const req = e.request, hit = await lookup(req);
  const refresh = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(async net => {
    if (net && net.ok && net.type === 'basic') { const c = await shellCache(); try { await c.put(req, net.clone()); } catch (err) { } if (hit && /\.(js|css)$/.test(new URL(req.url).pathname) && !(await sameBody(hit, net))) await notifyUpdate(); }
    return net;
  }).catch(() => null);
  if (hit) { e.waitUntil(refresh); return hit; }
  const net = await refresh; return net || Response.error();
}
async function voice(e) {
  const req = e.request, url = req.url.split('?')[0], vc = await caches.open(VOICE_CACHE), range = req.headers.get('range');
  let hit = await vc.match(url);
  if (hit) { e.waitUntil(lruTouch(url, vc)); return range ? rangeResponse(hit.clone(), range) : hit; }
  try {
    const net = await fetch(url);   // full clip, no Range: small files (~15-40 KB) so caching the whole body is cheap
    if (net && net.ok && net.status === 200) { try { await vc.put(url, net.clone()); e.waitUntil(lruTouch(url, vc)); } catch (err) { } return range ? rangeResponse(net, range) : net; }
    return net;
  } catch (err) { return Response.error(); }
}

self.addEventListener('fetch', e => {
  const r = e.request; if (r.method !== 'GET') return;
  const u = new URL(r.url); if (u.origin !== self.location.origin) return;
  const inScope = u.href.startsWith(self.registration.scope);
  if (inScope && (r.mode === 'navigate' || u.pathname.endsWith('/index.html'))) { e.respondWith(navigate(e)); return; }
  if (isVoice(u)) { e.respondWith(voice(e)); return; }
  if (!inScope && !/\/pwa-game\.js$/.test(u.pathname)) return;   // other hub games: not ours
  if (isVoiceManifest(u) || isShellAsset(u)) { e.respondWith(swr(e)); return; }
});

self.addEventListener('message', e => { if (e.data === 'skipWaiting') self.skipWaiting(); if (e.data === 'clear-voice') e.waitUntil(caches.delete(VOICE_CACHE).then(() => { lru = {}; return lruSave(); })); });
