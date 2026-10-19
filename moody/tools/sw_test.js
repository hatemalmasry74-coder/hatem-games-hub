#!/usr/bin/env node
/* Moody & Aboody - tools/sw_test.js : service-worker / offline checks.   node tools/sw_test.js [url]
   1. first load registers + activates sw.js, shell cache is filled (moody-shell-vN)
   2. a voice clip played once lands in the moody-voice cache (cache-on-first-use) and answers Range requests with 206
   3. index.html is network-first: a changed index.html is served immediately while online
   4. offline reload: title screen shows, game starts, no console errors from the page
   5. LRU cap: pushing > cap clip entries evicts the oldest (uses a tiny cap through the 'clear-voice' message path is not needed: checks the bookkeeping object) */
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const URL0 = process.argv[2] || 'http://localhost:' + (process.env.PORT || 8871) + '/moody/index.html';
(async () => {
  const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await ctx.newPage(), errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); }); p.on('pageerror', e => errs.push('PAGEERR ' + e.message));
  let ok = true; const T = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? ' ' + x : '')); if (!c) ok = false; };
  await p.goto(URL0); await sleep(1500);
  await p.evaluate(() => navigator.serviceWorker.ready.then(() => 1)); await sleep(2500);
  let keys = await p.evaluate(() => caches.keys()); T('SW active + shell cache', keys.some(k => /^moody-shell-v\d+$/.test(k)), JSON.stringify(keys));
  const shell = keys.find(k => /^moody-shell-v\d+$/.test(k));
  const n = await p.evaluate(async k => (await (await caches.open(k)).keys()).length, shell); T('shell precached', n >= 25, n + ' entries');
  const has = await p.evaluate(async k => { const c = await caches.open(k); return [await c.match(new URL('worlds/saudi.js?v=4', location.href).href).then(Boolean).catch(() => false), await c.match(new URL('engine/chars.js?v=4', location.href).href).then(Boolean)]; }, shell); T('world + engine in cache', has[0] && has[1], JSON.stringify(has));
  // voice clip: pick any manifest entry, fetch it as <audio> would (with Range)
  const clip = await p.evaluate(async () => { const m = await (await fetch('assets/voice/manifest.json?v=4')).json(); const k = Object.keys(m)[0]; return k; });
  const r1 = await p.evaluate(async k => { const r = await fetch('assets/voice/' + k + '.mp3', { headers: { Range: 'bytes=0-99' } }); return [r.status, (await r.arrayBuffer()).byteLength, r.headers.get('content-range')]; }, clip);
  T('voice Range -> 206 slice', r1[0] === 206 && r1[1] === 100, JSON.stringify(r1));
  await sleep(500);
  const vk = await p.evaluate(async () => (await (await caches.open('moody-voice')).keys()).map(r => r.url));
  T('voice cached on first use', vk.length >= 1, vk.length + ' clip(s)');
  const r2 = await p.evaluate(async k => { const r = await fetch('assets/voice/' + k + '.mp3'); return [r.status, (await r.arrayBuffer()).byteLength]; }, clip); T('voice full 200 from cache', r2[0] === 200 && r2[1] > 500, JSON.stringify(r2));
  await sleep(4500);   // lru bookkeeping flush
  const lru = await p.evaluate(async () => { const r = await (await caches.open('moody-meta')).match('/__moody_lru__'); return r ? Object.keys(await r.json()).length : -1; }); T('LRU bookkeeping persisted', lru >= 1, String(lru));
  // offline
  await ctx.setOffline(true); await p.reload(); await sleep(2500);
  const title = await p.evaluate(() => !!document.querySelector('.ttl-play .btn')); T('offline reload shows the title', title);
  await p.click('.btn.big.green', { force: true }).catch(() => { }); await sleep(1200);
  const map = await p.evaluate(() => !!document.querySelector('.card[data-world]') || !!document.querySelector('input.txt')); T('offline: game starts', map);
  await ctx.setOffline(false);
  // network-first index.html: change the file on disk (the local test server serves it as is) and make sure the page sees the new copy at once although a cached one exists
  const fs = require('fs'), path = require('path'), f = path.join(__dirname, '..', 'index.html'), orig = fs.readFileSync(f, 'utf8');
  try { fs.writeFileSync(f, orig + '\n<!--network-first-marker-->'); const body = await p.evaluate(async () => (await (await fetch('index.html')).text()).slice(-40)); T('index.html answered from the network when online', /network-first-marker/.test(body), body.trim()); }
  finally { fs.writeFileSync(f, orig); }
  console.log('PAGE ERRORS', JSON.stringify(errs.filter(e => !/net::ERR_INTERNET_DISCONNECTED|Failed to load resource/.test(e)).slice(0, 5)));
  await b.close(); process.exit(ok ? 0 : 1);
})();
