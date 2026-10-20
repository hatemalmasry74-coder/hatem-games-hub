const { launch, sleep } = require('./botlib.js'); const fs=require('fs');
const hero=process.argv[2]||'moody', card=process.argv[3]||'hoodie', tab=process.argv[4]||'top', n=+(process.argv[5]||60);
(async()=>{
 const env = await launch({kind:'desk', url:'http://localhost:8891/moody/index.html?unlock=1'}); const {p,bot}=env;
 await bot.startGame(); await sleep(400);
 await p.evaluate(()=>{ Moody.save.data.coins=300; Moody.save.commit(); });
 await p.evaluate(h=>Moody.flow.toRoom(h), hero); await sleep(3000);
 await p.evaluate(()=>Moody.dress.room.openWardrobe()); await sleep(1500);
 await p.evaluate(t=>document.querySelector('.dr-tab[data-tab="'+t+'"]').click(), tab); await sleep(1200);
 const urls = await p.evaluate(([card,n])=>new Promise(res=>{ const cv=document.getElementById('c'), k=cv.width/960, fr=[]; let i=0;
   const cap=()=>{ const c=document.createElement('canvas'); c.width=125; c.height=160; const g=c.getContext('2d'); g.drawImage(cv, 170*k, 210*k, 250*k, 320*k, 0,0,125,160); fr.push(c); if(++i<n) requestAnimationFrame(cap); else res(fr.map(c=>c.toDataURL('image/jpeg',.7))); };
   document.querySelector('.dr-card[data-item="'+card+'"]').click(); requestAnimationFrame(cap); }), [card,n]);
 const pg = await env.ctx.newPage(); const imgs=urls.map((u,i)=>'<div style="display:inline-block;position:relative"><img src="'+u+'" style="width:125px;height:160px;margin:1px"><span style="position:absolute;left:3px;top:2px;color:#fff;font:11px Arial;background:#0008">'+i+'</span></div>').join('');
 await pg.setContent('<body style="margin:0;background:#222;width:1700px">'+imgs+'</body>'); await pg.setViewportSize({width:1700,height:Math.ceil(urls.length/13)*165+10}); await pg.screenshot({path:`burst_${hero}_${card}.png`, fullPage:true});
 console.log('frames',urls.length, env.errs.slice(0,5)); await env.b.close();
})();
