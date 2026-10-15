/* hub paywall: soft subscription gate (activation codes). Not tamper-proof; real payments need a server. */
(function(){
'use strict';
var FREE=4;                      // stages 1..FREE are free; stage FREE+1 needs a subscription
var PRICE_TEXT='الاشتراك: 49 جنيه داخل مصر (أو 5 دولار خارج مصر) لمدة 30 يومًا لكل الألعاب';
var MAIL=['hatemattia1982','gmail.com'].join('@');   // assembled at runtime (light protection from scrapers)
var CONTACT_URL='mailto:'+MAIL+'?subject='+encodeURIComponent('طلب كود اشتراك - ألعاب حاتم')+'&body='+encodeURIComponent('مرحبًا، أريد الاشتراك في ألعاب حاتم (49 جنيه داخل مصر أو 5 دولار خارجها / 30 يومًا). أرجو إرسال طريقة الدفع والكود.\nاسمي: ');
var CONTACT_TEXT='✉ اطلب كود الاشتراك بالبريد';
var KEY='hub_sub_v1';
var CODES={"8c8960a3331e278a0df55f1ff9fe096a0a95d7fd5d7c6a9078090372fe45fead": 30, "8315ef13e2c1f188bd3c5d1a3cc9b1a3b00872eccce53306bf18fbcaf837b767": 30, "683f898279d23d15f9b98fc738cb5b3c11ae543be334b884bff34e5244dde7ef": 30, "05bce520878cf58080be9c0930165aa2bf36ffa95bd8e35286ca0a9741c2aa55": 30, "c3e704c3026508940f86947332a4ca8a7d7ca9ed15cbd70e5bdea640383efecd": 30, "d925bc65f7ea26ac9c93aed413ae213d0fae6ee6d8359a95a0be5cdf3e941fcc": 30, "6f72c6cf3e7f8104b676d2f4442206521dbd35e2735de0c7071c477ed59d1d1f": 30, "863f744fe2826f193c1af93a02271b4415147eb0a81544fa76af41b5537bdc6b": 30, "052cc06cf8baac6e6e633a7425fba45488952c6004891922c66f9b9df8df668b": 30, "222f99ce83a8c76c16e2dbb33137cc5f301792ec3c19ba4f40d955e0787c3bd8": 30, "ace0f27833987972e9e8bf27083a225e9e3796181a4deabae2ea6a6a29e31db4": 30, "1114ca3834ce5fcdf8ad57a63216bd7f690ad86f6aed221359005b1658ac9cc1": 30, "d69290d9c591324636b0bbc2357e6c1a4dd655f42b7ef9548c1428839d7e935e": 30, "428f9e62038eb2d4a26d9f8b1c16f23091c31753a39c620f27afc7ad12549d64": 30, "72b69f3af1efeceaf7aaccb7e7003a7c68c54ee0a404f6f2f4c29313f8a494e6": 30, "c78a96165ecfbbff9fd9e1d534688f691a9b19dcebc320b724c1ab45b94001bb": 30, "e288630af608c0910c0447bd4244aa744aa298a85b14702787ecd52e67e65b51": 30, "faf61023b903756a06e28f01ce0076ae8bff45e0ce7523064ef01288280ce2ae": 30, "c51393f44aa5783510012cd9223d53e28bab00e781efa3ac90db0a0efaf686c4": 30, "839ce813a54ac907618c686b4cb5e5682620bccf7803470a32d386b016117ba3": 30, "af405105337a2798be1c400d89cfabdfdf3d9246b48c7d5f8d18eadb3d66a5a9": 30, "d7848bb379f0c52b217ea13009d56175bae9516c747c693acee7d84cbcd282b0": 30, "1705cf26c8f79f42cb9e56d39315b1450c1b95eed42e59915fd3aa649b153cb2": 30, "4c067d9f6d8f8c08b6915c0cd9743eb840af1c1d36b47cfa5df6eb01b34801d3": 30, "ee8b8dfba325b65e97ce8c9633e4ca3b57477e21cfa31eda7511f709c476897e": 30, "f3975b9d30079c7e0dffd15b97e68ecf1db47a9fdfee11b71490b12182e941a3": 30, "5c94270b25827eef7e475bf9dbe56072a816ee1a252da0e8f04eb9cd78febbec": 30, "1691a980cce4b962dc16d6215c81afee49b43d949cf9596c362dfd690f13a7be": 30, "bdcb74832a77e2e1cd6c418f5e4a7d77891b8c4833cd226d82ba59d11733956f": 30, "0d4d9c0ccc929b1cb909d8aaacb4e209c4e554b859bb4bf52a11552357396194": 30};
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){return null;}}
function isPro(){var s=load();if(!s||!s.exp)return false;return Date.now()<s.exp;}
function daysLeft(){var s=load();return s&&s.exp?Math.max(0,Math.ceil((s.exp-Date.now())/864e5)):0;}
function sha(str){
  try{if(window.crypto&&crypto.subtle){return crypto.subtle.digest('SHA-256',new TextEncoder().encode(str)).then(function(b){return Array.prototype.map.call(new Uint8Array(b),function(x){return('0'+x.toString(16)).slice(-2);}).join('');});}}catch(e){}
  return Promise.resolve('');
}
function activate(code){
  code=(code||'').trim().toUpperCase().replace(/\s+/g,'');
  return sha(code).then(function(h){
    var d=CODES[h];if(!d)return{ok:false,msg:'الكود غير صحيح'};
    var used=[];try{used=JSON.parse(localStorage.getItem(KEY+'_used')||'[]');}catch(e){}
    var s=load();var base=(s&&s.exp>Date.now())?s.exp:Date.now();
    if(used.indexOf(h)>=0)return{ok:false,msg:'هذا الكود مستخدم من قبل على هذا الجهاز'};
    used.push(h);
    try{localStorage.setItem(KEY,JSON.stringify({exp:base+d*864e5,at:Date.now()}));localStorage.setItem(KEY+'_used',JSON.stringify(used));}catch(e){}
    return{ok:true,msg:'تم التفعيل! مدة الاشتراك '+d+' يومًا'};
  });
}
var modal=null;
function ui(game,stage,cb){
  if(modal)return;
  modal=document.createElement('div');
  modal.setAttribute('dir','rtl');
  modal.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.78);font-family:Tahoma,Arial,sans-serif;padding:10px;touch-action:pan-y';
  var short=window.innerHeight<460;
  modal.innerHTML='<div style="background:#0d1b3d;border:3px solid #ffd23c;border-radius:18px;padding:'+(short?'8px 14px':'16px 20px')+';width:min(94vw,'+(short?'520px':'420px')+');max-height:98vh;overflow:auto;color:#fff;text-align:center;touch-action:pan-y">'
   +(short?'':'<div style="font-size:42px">👑</div>')+'<h2 style="margin:4px 0;color:#ffd23c;font-size:'+(short?'17px':'22px')+'">👑 وصلت للمرحلة '+stage+'!</h2>'
   +'<p style="margin:'+(short?'2px 0 6px':'6px 0 10px')+';line-height:1.6;font-size:'+(short?'13px':'16px')+'">المراحل 1 إلى '+FREE+' مجانية. لتكمل باقي المراحل فعّل الاشتراك.</p>'
   +'<div style="color:#ffd23c;font-weight:bold;font-size:'+(short?'13px':'16px')+';margin-bottom:6px">'+PRICE_TEXT+'</div>'
   +'<input id="hpc" placeholder="اكتب كود التفعيل (HG-XXXX-XXXX)" autocomplete="off" autocapitalize="characters" style="width:100%;padding:'+(short?'6px':'10px')+';font:bold 18px Tahoma,Arial;text-align:center;border-radius:10px;border:2px solid #ffd23c;direction:ltr;box-sizing:border-box">'
   +'<div id="hpm" style="min-height:'+(short?'18px':'24px')+';margin:'+(short?'4px':'8px')+' 0;color:#ffd23c;font-size:14px"></div>'
   +'<button id="hpa" style="width:100%;padding:'+(short?'8px':'11px')+';font:bold '+(short?'17px':'20px')+' Tahoma,Arial;border:0;border-radius:12px;background:linear-gradient(#ff5a4a,#c01822);color:#fff">تفعيل الاشتراك</button>'
   +(CONTACT_URL?'<a id="hpw" href="'+CONTACT_URL+'" target="_blank" rel="noopener" style="display:block;margin-top:8px;padding:10px;border-radius:12px;background:#1f8f4a;color:#fff;text-decoration:none;font-weight:bold">'+CONTACT_TEXT+'</a><div style="font-size:12px;color:#9fb4d8;margin-top:4px;direction:ltr">'+MAIL+'</div>':'<p style="font-size:'+(short?'11px':'13px')+';color:#9fb4d8;margin:'+(short?'4px':'8px')+' 0">'+CONTACT_TEXT+'</p>')
   +'<button id="hpx" style="width:100%;margin-top:'+(short?'5px':'8px')+';padding:'+(short?'6px':'9px')+';font:bold 15px Tahoma,Arial;border:0;border-radius:10px;background:#3a4968;color:#fff">لاحقًا</button></div>';
  document.body.appendChild(modal);
  var $=function(id){return modal.querySelector('#'+id);};
  function close(ok){if(modal){modal.remove();modal=null;}try{cb&&cb(ok);}catch(e){console.error(e);}}
  $('hpa').onclick=function(){var m=$('hpm');m.textContent='جارٍ التحقق…';activate($('hpc').value).then(function(r){m.textContent=r.msg;if(r.ok)setTimeout(function(){close(true);},700);});};
  $('hpc').addEventListener('keydown',function(e){if(e.key==='Enter')$('hpa').click();e.stopPropagation();});
  $('hpc').addEventListener('keyup',function(e){e.stopPropagation();});
  $('hpx').onclick=function(){close(false);};
}
/* gate(stage, game, cb): cb(true) if the stage is free or subscribed; otherwise asks for a code; cb(false) if declined */
function gate(stage,game,cb){
  if(stage<=FREE||isPro()){cb&&cb(true);return;}
  ui(game,stage,cb);
}
window.HubPay={MAIL:MAIL,mailto:CONTACT_URL,PRICE_TEXT:PRICE_TEXT,FREE:FREE,isPro:isPro,daysLeft:daysLeft,gate:gate,activate:activate,needs:function(stage){return stage>FREE&&!isPro();}};
})();
