// Install-as-app support: service worker, install button, iOS guidance, share.
(function(){
  if('serviceWorker' in navigator){window.addEventListener('load',function(){navigator.serviceWorker.register('sw.js').catch(function(){});});}
  var $=function(i){return document.getElementById(i);};
  var box=$('inst'); if(!box)return;
  var standalone=window.matchMedia('(display-mode: standalone)').matches||window.matchMedia('(display-mode: fullscreen)').matches||navigator.standalone;
  var ios=/iphone|ipad|ipod/i.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var dp=null,msg=$('im'),ib=$('ib');
  if(standalone){box.style.display='none';return;}
  box.style.display='flex';
  window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();dp=e;});
  window.addEventListener('appinstalled',function(){box.style.display='none';});
  ib.onclick=function(){
    if(dp){dp.prompt();dp.userChoice.then(function(){dp=null;});return;}
    if(ios)msg.textContent='على آيفون/آيباد: اضغط زر المشاركة ⬆ في Safari ثم «إضافة إلى الشاشة الرئيسية». سيظهر أيقونة وتفتح اللعبة بدون شريط الرابط.';
    else msg.textContent='من قائمة المتصفح ⋮ اختر «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».';
  };
  $('sb').onclick=function(){
    var d={title:'ألعاب حاتم',text:'العب معنا ألعاب حاتم 🎮',url:location.origin+location.pathname};
    if(navigator.share)navigator.share(d).catch(function(){});
    else if(navigator.clipboard){navigator.clipboard.writeText(d.url).then(function(){msg.textContent='تم نسخ الرابط ✓';});}
    else msg.textContent=d.url;
  };
})();
