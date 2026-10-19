#!/usr/bin/env node
/* Moody & Aboody - tools/update_test.js : "new version available" flow of sw.js + ui.js.   node tools/update_test.js
   Bumps ?v=4 -> ?v=5 in index.html on disk (restored afterwards), then checks that the page is told, that a running mission only gets a banner, and that an idle title screen reloads by itself. */
const { chromium } = require('/opt/node-tools/node_modules/playwright'), fs = require('fs'), path = require('path');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const BASE = process.argv[2] || 'http://localhost:' + (process.env.PORT || 8871) + '/moody/index.html', F = path.join(__dirname, '..', 'index.html'), orig = fs.readFileSync(F, 'utf8');
let ok = true; const T = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x ? '  ' + x : '')); if (!c) ok = false; };
(async () => {
  const b = await chromium.launch();
  try {
    for (const mode of ['mission', 'title']) {
      const c = await b.newContext({ viewport: { width: 1280, height: 720 } }), p = await c.newPage(); let loads = 0; p.on('load', () => loads++);
      await p.goto(BASE + '?unlock=1'); await sleep(1500); await p.evaluate(() => navigator.serviceWorker.ready.then(() => 1)); await sleep(2500); loads = 0;
      if (mode === 'mission') { await p.evaluate(() => { const b = document.querySelector('.btn.big.green'); b && b.click(); }); await sleep(700); await p.evaluate(() => { Moody.save.data.named = true; }); await p.evaluate(() => Moody.flow.startMission('home', 0)); await sleep(2000); }
      fs.writeFileSync(F, orig.replace(/\?v=4/g, '?v=5'));
      await p.evaluate(() => fetch('index.html').then(r => r.text())); await sleep(3000);   // what the browser does on every navigation: network-first -> SW notices the new ?v=
      const keys = await p.evaluate(() => caches.keys()); T(mode + ': new shell cache moody-shell-v5 seeded', keys.indexOf('moody-shell-v5') >= 0, JSON.stringify(keys));
      T(mode + ': page was told (UI.updateReady)', await p.evaluate(() => Moody.ui.updateReady === true));
      if (mode === 'mission') { await sleep(3000); T('mission: banner shown, NO reload', await p.evaluate(() => !!document.getElementById('updbar')) && loads === 0, 'loads=' + loads); await p.click('#updbar .btn.green'); await sleep(4500); T('banner "حدّث" reloads', loads >= 1, 'loads=' + loads); }
      else { await sleep(13000); T('idle title: silent reload', loads >= 1, 'loads=' + loads); }
      fs.writeFileSync(F, orig); await c.close();
    }
  } finally { fs.writeFileSync(F, orig); }
  await b.close(); console.log(ok ? 'ALL OK' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})();
