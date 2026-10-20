#!/usr/bin/env node
/* Generates the app icons of the Play edition from the DRAWN default characters (never from a photo): icons/icon-192.png icon-512.png apple-touch-icon.png icon-maskable-512.png
     node tools/play/icons.js <outdir>      (Playwright + python3) */
const fs = require('fs'), path = require('path'), cp = require('child_process');
const { launch, sleep } = require(path.join(__dirname, '..', 'botlib.js'));
const out = path.resolve(process.argv[2] || '');
if (!fs.existsSync(path.join(out, 'index.html'))) { console.error('usage: node tools/play/icons.js <built-outdir>'); process.exit(1); }
const PORT = 8880 + Math.floor(Math.random() * 90);
(async () => {
  const srv = cp.spawn('python3', ['-m', 'http.server', String(PORT)], { cwd: out, stdio: 'ignore' }); await sleep(900);
  try {
    const env = await launch({ kind: 'desk', url: 'http://localhost:' + PORT + '/index.html?unlock=1' }), p = env.p;
    await p.evaluate(() => { const F = Moody.family; const c = F.defaults(); c.done = true; F.save(c); }); await sleep(600);
    const sizes = [['icon-192.png', 192, 0], ['icon-512.png', 512, 0], ['apple-touch-icon.png', 180, 0], ['icon-maskable-512.png', 512, .2]];
    const data = await p.evaluate(async sizes => {
      const res = {}; const ids = ['moody', 'toota', 'nemo', 'aboody'];
      for (const [name, S, pad] of sizes) {
        const cv = document.createElement('canvas'); cv.width = cv.height = S; const g = cv.getContext('2d');
        const bg = g.createLinearGradient(0, 0, 0, S); bg.addColorStop(0, '#4a8dff'); bg.addColorStop(1, '#0b1a33'); g.fillStyle = bg; g.fillRect(0, 0, S, S);
        g.fillStyle = 'rgba(255,214,90,.9)'; g.beginPath(); g.arc(S * .5, S * .9, S * .5, Math.PI, 0); g.fill();
        const inner = S * (1 - pad * 2), cell = inner / 2, o = S * pad;
        ids.forEach((id, i) => { g.save(); g.translate(o + (i % 2) * cell + cell / 2, o + Math.floor(i / 2) * cell + cell / 2); g.scale(cell / 112, cell / 112); g.lineJoin = g.lineCap = 'round'; try { Moody.chars.portrait(g, id, 0, 0, 46, { anim: 'idle', t: 1.3 }); } catch (e) { } g.restore(); });
        res[name] = cv.toDataURL('image/png');
      }
      return res;
    }, sizes);
    fs.mkdirSync(path.join(out, 'icons'), { recursive: true });
    for (const k of Object.keys(data)) fs.writeFileSync(path.join(out, 'icons', k), Buffer.from(data[k].split(',')[1], 'base64'));
    console.log('icons written:', Object.keys(data).join(', '), env.errs.length ? 'console: ' + env.errs.slice(0, 3) : '');
    await env.b.close();
  } finally { srv.kill(); }
})();
