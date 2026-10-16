// Network-first service worker: always fresh when online, offline fallback from cache.
const C='cat-v1';
self.addEventListener('install',e=>{self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request;
  if(r.method!=='GET'||!r.url.startsWith(self.location.origin))return;
  e.respondWith(fetch(r).then(res=>{
    if(res&&res.ok&&res.type==='basic'&&!/\/assets\/voice\//.test(r.url)){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp)).catch(()=>{});}
    return res;
  }).catch(()=>caches.match(r).then(m=>m||(r.mode==='navigate'?caches.match('./'):undefined))));
});
