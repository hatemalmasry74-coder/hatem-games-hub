#!/usr/bin/env node
/* Renders a contact sheet of every look preset on every generated role character of a built Play edition (to LOOK at them) and checks that nothing throws.
     node tools/play/looktest.js <url-of-index.html> <out.png>   (the page must have a saved family or the wizard is bypassed with ?nowizard)  */
const path = require('path'), fs = require('fs');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const url = process.argv[2], out = process.argv[3];
if (!url || !out) { console.log('usage: node tools/play/looktest.js <url> <out.png>'); process.exit(1); }
(async () => {
  const env = await launch({ kind: 'desk', url }), p = env.p;
  await p.evaluate(() => { const F = Moody.family; F.save(F.preset('four')); }); await p.reload(); await sleep(1500);
  const res = await p.evaluate(() => {
    const F = Moody.family, M = Moody, C = M.chars; const cols = [], sheet = document.createElement('canvas'); const W = 150, H = 200;
    const rows = [];
    // rows: one per role id, columns: the default look + one variation each (skin, hair style, hair colour, hijab on/off, glasses, hat, favourite colour)
    const vars = [{}, { skin: F.SKINS[0] }, { skin: F.SKINS[5] }, { hair: 'curly' }, { hair: 'ponytail' }, { hair: 'bob', hairC: F.HAIRC[3] }, { hij: false }, { hij: F.HIJ[3] }, { gl: true }, { gl: false }, { hat: F.HATC[1] }, { fav: F.FAV[4] }];
    F.IDS.forEach(id => rows.push(id));
    sheet.width = W * vars.length; sheet.height = H * rows.length; const g = sheet.getContext('2d'); g.fillStyle = '#eef6ff'; g.fillRect(0, 0, sheet.width, sheet.height);
    const errs = [];
    rows.forEach((id, r) => vars.forEach((v, c) => {
      const cfg = F.defaults(); cfg.done = true; cfg[id].on = true; const L = cfg[id].look; const D = F.D[id];
      Object.keys(v).forEach(k => { if (k === 'hij' && !F.canHijab(id)) return; if (k === 'hair' && !F.hairList(id).some(x => x[0] === v.hair)) return; if (k === 'hat' && D.kind !== 'kid') return; L[k] = v[k]; });
      try { F.apply(cfg); g.save(); g.translate(c * W, r * H); g.beginPath(); g.rect(0, 0, W, H); g.clip(); M.chars.draw(g, id, W / 2, H - 22, { anim: 'idle', t: 1.2, snap: true, sc: Math.min(1.25, 165 / M.chars.height(id)) }); g.restore(); } catch (e) { errs.push(id + ' ' + JSON.stringify(v) + ' ' + e.message); }
    }));
    return { url: sheet.toDataURL('image/png'), errs, ids: rows };
  });
  fs.writeFileSync(out, Buffer.from(res.url.split(',')[1], 'base64'));
  console.log('rows', res.ids.join(' '), '| render errors', JSON.stringify(res.errs.slice(0, 10)), '| console', JSON.stringify(env.errs.slice(0, 5)));
  await env.b.close(); process.exit(res.errs.length || env.errs.length ? 1 : 0);
})();
