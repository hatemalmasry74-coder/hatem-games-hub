/* Moody & Aboody - native shell glue (loaded FIRST in <head> by scripts/make_www.js, only inside the Android app).
 * Runs before any game script. It does five small things:
 *   1. marks the page:  <html class="native-android">  +  window.MOODY_NATIVE = 'android'
 *   2. disables the service worker (assets are bundled in the APK; updates come from Google Play, and a SW would
 *      copy 100+ MB of voice clips into a second cache).
 *   3. hides the browser-only "fullscreen" toggle (the app is already immersive fullscreen) and any link that would leave the app
 *      (the web build's "home of the games" link href="../").
 *   4. Android BACK button -> the game's pause / back (see docs/play/DECISION.md "Back button").
 *   5. exposes billing_capacitor.js (concatenated below by make_www.js) as window.MoodyBillingCapacitor.
 * No network, no storage, no personal data.
 */
(function (w, d) {
  'use strict';
  w.MOODY_NATIVE = 'android';
  try { d.documentElement.classList.add('native-android'); } catch (e) { }

  /* 2. no service worker in the app */
  try {
    if (w.navigator && w.navigator.serviceWorker && w.ServiceWorkerContainer) {
      w.ServiceWorkerContainer.prototype.register = function () { return Promise.reject(new Error('service worker disabled in the native app')); };
    }
  } catch (e) { }

  /* 3. Fullscreen API toggle makes no sense in the app (Moody.fs.can() reads document.fullscreenEnabled) */
  try { Object.defineProperty(d, 'fullscreenEnabled', { get: function () { return false; }, configurable: true }); } catch (e) { }
  try { Object.defineProperty(d, 'webkitFullscreenEnabled', { get: function () { return false; }, configurable: true }); } catch (e) { }

  /* 3b. safety net: the app must never navigate away from its bundled pages (Families policy: no links out; the hub link
         "../" of the web build would otherwise point at nothing). Hide such anchors and swallow their clicks. The proper fix is to
         not render them in the Play edition; this is only the belt to that suspender. */
  try {
    var st = d.createElement('style'); st.textContent = 'html.native-android a[href="../"],html.native-android a[href="../index.html"]{display:none!important}';
    (d.head || d.documentElement).appendChild(st);
    d.addEventListener('click', function (e) {
      var a = e.target && e.target.closest ? e.target.closest('a[href]') : null; if (!a) return;
      var h = a.getAttribute('href') || '';
      // only the hub link is blocked; a parent-area link to the privacy policy (https) is opened by Capacitor in the system browser - it must sit behind the parental gate
      if (/^\.\.\/(index\.html)?$/.test(h) || /^(intent:|market:)/i.test(h)) { e.preventDefault(); e.stopPropagation(); }
    }, true);
  } catch (e) { }

  /* 4. back button */
  var lastBack = 0;
  function toast(msg) {
    var t = d.getElementById('nativeToast');
    if (!t) {
      t = d.createElement('div'); t.id = 'nativeToast';
      t.style.cssText = 'position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:99999;background:#0b1a33ee;color:#fff;border:2px solid #ffd23c;border-radius:14px;padding:8px 16px;font:bold 16px Tahoma,Arial,sans-serif;direction:rtl;pointer-events:none;transition:opacity .25s';
      (d.body || d.documentElement).appendChild(t);
    }
    t.textContent = msg; t.style.opacity = '1'; clearTimeout(t._h); t._h = setTimeout(function () { t.style.opacity = '0'; }, 1800);
  }
  function onBack() {
    var M = w.Moody;
    // (a) preferred: the game owns the decision. Moody.onBack() returns true when it handled the press
    //     (closed a modal / opened the pause window / went one screen up).
    try { if (M && typeof M.onBack === 'function' && M.onBack() === true) return; } catch (e) { }
    // (b) fallback that works with the current game: Escape is already bound to "pause" in a mission and "close" in every
    //     modal (ctx.js / ui.js). A handled Escape calls preventDefault -> dispatchEvent returns false.
    try {
      var ev = new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, which: 27, bubbles: true, cancelable: true });
      if (w.dispatchEvent(ev) === false || ev.defaultPrevented) return;
    } catch (e) { }
    // (c) nothing to close: we are on a root screen -> press twice to leave (never exit on a single accidental press)
    var n = Date.now();
    if (n - lastBack < 2000) { try { w.Capacitor.Plugins.App.exitApp(); } catch (e) { } return; }
    lastBack = n; toast('\u0627\u0636\u063a\u0637 \u0631\u062c\u0648\u0639 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649 \u0644\u0644\u062e\u0631\u0648\u062c');
  }
  function bindBack() {
    try {
      var App = w.Capacitor && w.Capacitor.Plugins && w.Capacitor.Plugins.App;
      if (App && App.addListener) { App.addListener('backButton', onBack); return true; }
    } catch (e) { }
    return false;
  }
  if (!bindBack()) { var tries = 0, iv = setInterval(function () { if (bindBack() || ++tries > 40) clearInterval(iv); }, 250); }
  w.MoodyNativeBack = onBack;   // for tests: window.MoodyNativeBack()
})(window, document);
