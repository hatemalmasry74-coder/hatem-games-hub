// Per-game install helper: registers the game's service worker and shows a one-time "install as app" hint.
(function(){
  if('serviceWorker' in navigator)window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});
  var standalone=matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone;
  if(standalone)return;
  var key='hub_pwa_hint_'+location.pathname,dp=null;
  try{if(localStorage.getItem(key))return;}catch(e){}
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  function show(){
    if(document.getElementById('pwaHint'))return;
    var b=document.createElement('div');b.id='pwaHint';
    b.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:max(8px,env(safe-area-inset-bottom));z-index:9998;background:#0b1a33ee;color:#fff;border:2px solid #ffd23c;border-radius:14px;padding:8px 12px;font:bold 14px Tahoma,Arial,sans-serif;direction:rtl;display:flex;gap:8px;align-items:center;max-width:94vw';
    var t=document.createElement('span');t.textContent=ios?'📲 للعب بدون شريط الرابط: زر المشاركة ⬆ ثم «إضافة إلى الشاشة الرئيسية»':'📲 ثبّت اللعبة كأيقونة بدون شريط الرابط';
    b.appendChild(t);
    function close(){try{localStorage.setItem(key,'1');}catch(e){}b.remove();}
    if(dp){var i=document.createElement('button');i.textContent='تثبيت';i.style.cssText='border:0;border-radius:8px;padding:6px 12px;font:bold 14px Tahoma;background:#1f8f4a;color:#fff';i.onclick=function(){dp.prompt();dp.userChoice.then(close);};b.appendChild(i);}
    var x=document.createElement('button');x.textContent='✕';x.style.cssText='border:0;background:none;color:#fff;font-size:16px';x.onclick=close;b.appendChild(x);
    document.body.appendChild(b);setTimeout(function(){if(b.parentNode)b.remove();},15000);
  }
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;setTimeout(show,2500);});
  window.addEventListener('appinstalled',function(){try{localStorage.setItem(key,'1');}catch(e){}var b=document.getElementById('pwaHint');if(b)b.remove();});
  if(ios)setTimeout(show,4000);
})();
