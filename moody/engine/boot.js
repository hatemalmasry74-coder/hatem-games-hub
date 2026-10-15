/* Moody & Aboody - engine/boot.js : loads Moody.load files (content + worlds) sequentially, then starts the game. */
(function () {
  'use strict';
  const M = window.Moody, V = M.VERSION;
  function loadOne(src) {
    return new Promise(res => { const s = document.createElement('script'); s.src = src + '?v=' + V; s.onload = res; s.onerror = () => { try { console.warn('moody: could not load ' + src); } catch (e) { } res(); }; document.body.appendChild(s); });
  }
  (async function () {
    M.save.load(); M.backdrop.init(); M.setScene(M.backdrop); M.start();
    for (let i = 0; i < M.load.length; i++) await loadOne(M.load[i]);
    M.flow.toTitle();
  })();
})();
