// usage: node sheet.js <hero> <slot|set|all> <out.png> [kind]
const { launch, sleep } = require('./botlib.js'); const fs=require('fs');
const [,, hero, slot, out, kindArg] = process.argv;
(async()=>{
 const env = await launch({kind:'desk', url:'http://localhost:8891/moody/index.html?unlock=1'}); const {p}=env;
 await sleep(3000);
 await p.evaluate(([s,c,h])=>{window.__S=s;window.__C=c;window.__HJ=h;},[+(process.env.S||130),+(process.env.C||8),!!process.env.HJ]); const png = await p.evaluate(([hero,slot,kindArg])=>{
   const M=Moody, D=M.dress, C=M.chars; const fits=[];
   const mk=(label,fit)=>{ if (window.__HJ) fit=D.withSlot(fit,'hijab',{p:'short'}); fits.push({label,fit}); };
   if (slot==='set') D.setsFor(hero).forEach(s=>mk(s.n, D.setSet(hero,s)));
   else if (slot==='base') mk('signature',{v:2});
   else { const list = slot==='all' ? ['top','bottom','shoes','head','hijab','acc'].flatMap(s=>D.itemsFor(hero,s)) : D.itemsFor(hero,slot);
     list.forEach(it=>{ let f={v:2}; f=D.equip(hero,f,it); mk(it.n+(it.pats?'':''),f); }); }
   const kind = kindArg||'full', S=+(window.__S||130), cols=Math.min(fits.length,+(window.__C||8)), rows=Math.ceil(fits.length/cols);
   const cv=document.createElement('canvas'); cv.width=cols*S; cv.height=rows*(S+22); const g=cv.getContext('2d'); g.fillStyle='#fdf4e0'; g.fillRect(0,0,cv.width,cv.height);
   const errs=[];
   fits.forEach((o,i)=>{ const x=(i%cols)*S, y=Math.floor(i/cols)*(S+22); try{ const c=D.preview(hero,o.fit,kind,S); g.drawImage(c,x,y,S,S);}catch(e){errs.push(o.label+':'+e.message)} g.fillStyle='#000'; g.font='13px Arial'; g.textAlign='center'; g.fillText(o.label,x+S/2,y+S+14); });
   window.__errs=errs; return cv.toDataURL('image/png'); }, [hero,slot,kindArg]);
 fs.writeFileSync(out, Buffer.from(png.split(',')[1],'base64'));
 console.log('errs', await p.evaluate(()=>window.__errs), env.errs.slice(0,5)); await env.b.close();
})();
