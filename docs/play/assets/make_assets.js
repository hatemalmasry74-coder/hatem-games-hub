#!/usr/bin/env node
/* make_assets.js - Google Play graphics, rendered from the REAL game (headless Chromium + the game's own bot).
 *
 *   node docs/play/assets/make_assets.js [--root <repo root>] [--port 8921] [--url <game url>] [--only phone,tablet7,tablet10,feature,icon]
 *
 * Writes to docs/play/assets/out/:
 *   icon_512.png            512x512  (from android/scripts/make_icons.py; run it once if missing)
 *   feature_1024x500.jpg    1024x500 feature graphic: Arabic title + the game's own characters (Moody.chars.draw)
 *   phone_01..08.jpg        1920x1080 landscape (16:9)  - real game scenes, ?unlock=1 + the kid-bot
 *   tablet7_01..04.jpg      1920x1200 (16:10)           - 7-inch tablet slot
 *   tablet10_01..04.jpg     2560x1600 (16:10)           - 10-inch tablet slot
 * No real photos of children: only canvas-drawn heroes and the cartoon avatars. JPEG = no alpha channel (Play rejects alpha in screenshots).
 * Needs: Playwright (global /opt/node-tools or `npm i playwright`) + Chromium. The game is served from --root by a tiny built-in static server.
 * IMPORTANT: shoot the PLAY EDITION (e.g. --url http://localhost:8921/play_dist/index.html?unlock=1) for the final screenshots, so the
 * store images match what the app really shows (no hub link, no paywall leftovers). Default URL = the dev game at /moody/.
 */
'use strict';
const fs = require('fs'), path = require('path'), http = require('http'), net = require('net');
const arg = (n, d) => { const i = process.argv.indexOf('--' + n); return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : d; };
const ROOT = path.resolve(arg('root', path.join(__dirname, '..', '..', '..')));
const PORT = +arg('port', 8921);
const OUT = path.join(__dirname, 'out'); fs.mkdirSync(OUT, { recursive: true });
const ONLY = arg('only', 'icon,feature,phone,tablet7,tablet10').split(',');
const URL0 = arg('url', `http://localhost:${PORT}/moody/index.html?unlock=1`);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.mp3': 'audio/mpeg', '.svg': 'image/svg+xml', '.webp': 'image/webp' };

function portOpen(p) { return new Promise(res => { const s = net.connect(p, '127.0.0.1'); s.on('connect', () => { s.destroy(); res(true); }); s.on('error', () => res(false)); }); }
async function serve() {
  if (await portOpen(PORT)) { console.log('[assets] using the server already listening on', PORT); return null; }
  const srv = http.createServer((req, res) => {
    let f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!f.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    if (fs.existsSync(f) && fs.statSync(f).isDirectory()) f = path.join(f, 'index.html');
    fs.readFile(f, (e, b) => { if (e) { res.writeHead(404).end('nf'); return; } res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(b); });
  });
  await new Promise(r => srv.listen(PORT, '127.0.0.1', r)); console.log('[assets] serving', ROOT, 'on', PORT); return srv;
}
function pw() { for (const m of ['playwright', '/opt/node-tools/node_modules/playwright', '/opt/node22/lib/node_modules/playwright']) { try { return require(m); } catch (e) { } } throw new Error('Playwright not found (npm i playwright)'); }

/* scenes: what to capture. kit = wait for this kit/screen signature (see botlib.play 'sig'), delay = ms after opening the mission. */
const SCENES = [
  { n: 'title' },
  { n: 'map', after: 'start' },
  { n: 'missions', world: 'home' },
  { n: 'home_dialog', world: 'home', mission: 'm1', delay: 3200 },
  { n: 'home_quiz', world: 'home', mission: 'm1', kit: 'qz' },
  { n: 'kitchen', world: 'home', mission: 'm3', delay: 4500 },
  { n: 'sea', world: 'sea', mission: 'm4', delay: 5500 },
  { n: 'runner', world: 'runs', mission: 'r1', kit: 'runner3d', delay: 900, act: /يلا نجري/, after: 3200 },
  { n: 'gathering', world: 'gathering', mission: 'm2', delay: 5000 },
  { n: 'closet', closet: true }
];

async function captureSet(chromium, label, viewport, dsf, count, names) {
  const { launch } = require(path.join(ROOT, 'moody', 'tools', 'botlib.js'));
  const env = await launch({ kind: 'desk', browser: await chromium.launch(), url: URL0, ctx: { viewport, deviceScaleFactor: dsf }, init: () => { try { localStorage.setItem('moody_qtoast', '1'); } catch (e) { } } });   // moody_qtoast: no "low quality" toast in the shots (headless GL is slow)
  const p = env.p, bot = env.bot, shots = {};
  const fresh = async () => { await p.goto(URL0); await sleep(1200); await bot.startGame(); await sleep(700); };
  const shot = async n => { const f = path.join(OUT, `_${label}_${n}.jpg`); await p.screenshot({ path: f, type: 'jpeg', quality: 90 }); shots[n] = f; console.log('[assets]', label, n); };
  await bot.startGame(); await sleep(900); await shot('map');
  for (const s of SCENES.slice(2)) {
    try {
      if (s.closet) { await fresh(); if (await bot.tapText('غرفتي')) { await sleep(1500); await shot(s.n); } continue; }
      if (s.world && !s.mission) { await fresh(); await p.waitForSelector('.card[data-world]'); await p.evaluate(w => document.querySelector('.card[data-world="' + w + '"]').scrollIntoView({ inline: 'center' }), s.world); await sleep(300); await bot.tapSel('.card[data-world="' + s.world + '"]'); await sleep(900); await shot(s.n); continue; }
      await fresh();
      if (s.kit) { let done = false; await bot.openMission(s.world, s.mission); await sleep(600); await bot.play({ timeout: 90000, onKit: async sig => { if (!done && sig === s.kit) { done = true; await sleep(s.delay || 800); if (s.act) { try { await p.evaluate(rx => { const b = Array.from(document.querySelectorAll('.btn')).find(x => new RegExp(rx).test(x.textContent)); if (b) b.click(); }, s.act.source); } catch (e) { } await sleep(s.after || 1500); } await shot(s.n); throw new Error('stop'); } } }).catch(() => { }); }
      else { await bot.openMission(s.world, s.mission); await sleep(s.delay || 2000); await shot(s.n); }
    } catch (e) { console.warn('[assets] scene', s.n, 'skipped:', String(e.message).slice(0, 80)); }
  }
  await env.b.close(); return shots;
}

(async () => {
  const srv = await serve(); const { chromium } = pw();
  try {
    if (ONLY.includes('icon') && !fs.existsSync(path.join(OUT, 'icon_512.png'))) require('child_process').spawnSync('python3', [path.join(ROOT, 'android', 'scripts', 'make_icons.py'), path.join(ROOT, 'moody')], { stdio: 'inherit' });

    if (ONLY.includes('feature')) {
      const b = await chromium.launch(), ctx = await b.newContext({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }), p = await ctx.newPage();
      await p.goto(URL0); await sleep(1500);
      const dataUrl = await p.evaluate(async () => {
        const M = window.Moody, W = 1024, H = 500, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
        const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#5fb0ee'); sky.addColorStop(.62, '#bfe6ff'); sky.addColorStop(1, '#fff3c2'); g.fillStyle = sky; g.fillRect(0, 0, W, H);
        g.save(); g.translate(W * .5, H * 1.15); for (let i = 0; i < 18; i++) { g.rotate(Math.PI / 9); g.fillStyle = 'rgba(255,255,255,.13)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-90, -760); g.lineTo(90, -760); g.closePath(); g.fill(); } g.restore();
        g.fillStyle = '#7cc06a'; g.beginPath(); g.moveTo(0, 430); g.quadraticCurveTo(300, 380, 560, 425); g.quadraticCurveTo(820, 460, W, 410); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        g.fillStyle = '#5fae55'; g.beginPath(); g.moveTo(0, 470); g.quadraticCurveTo(380, 440, W, 480); g.lineTo(W, H); g.lineTo(0, H); g.fill();
        const font = getComputedStyle(document.body).fontFamily || 'Tahoma, Arial';
        g.direction = 'rtl'; g.textAlign = 'center'; g.lineJoin = 'round';
        // characters (the game's own canvas drawings), Moody (tall) on the right in RTL reading order, Aboody left
        M.chars.draw(g, 'aboody', 135, 478, { anim: 'cheer', t: .5, sc: 1.75, snap: true });
        M.chars.draw(g, 'moody', 890, 486, { anim: 'wave', t: .6, sc: 1.5, snap: true });
        const title = 'مودي وعبودي';
        g.font = `900 112px ${font}`; g.strokeStyle = '#7a4a00'; g.lineWidth = 16; g.strokeText(title, 512, 165); g.fillStyle = '#ffd23c'; g.fillText(title, 512, 165);
        g.font = `800 40px ${font}`; const tag = 'مغامرات وألغاز وقيم للأطفال'; const tw = g.measureText(tag).width + 70;
        g.fillStyle = '#ff6f91'; g.beginPath(); g.roundRect ? g.roundRect(512 - tw / 2, 215, tw, 66, 33) : g.rect(512 - tw / 2, 215, tw, 66); g.fill(); g.lineWidth = 4; g.strokeStyle = '#b8325c'; g.stroke();
        g.fillStyle = '#fff'; g.fillText(tag, 512, 262);
        g.font = `800 32px ${font}`; g.fillStyle = '#0b1a33'; g.fillText('بصوت بشري  •  بدون إعلانات  •  تشتغل بدون إنترنت', 512, 350);
        return c.toDataURL('image/jpeg', .93);
      });
      fs.writeFileSync(path.join(OUT, 'feature_1024x500.jpg'), Buffer.from(dataUrl.split(',')[1], 'base64')); console.log('[assets] feature_1024x500.jpg'); await b.close();
    }

    const want = { phone: { vp: { width: 1280, height: 720 }, dsf: 1.5, n: 8, pre: 'phone' }, tablet7: { vp: { width: 1280, height: 800 }, dsf: 1.5, n: 4, pre: 'tablet7' }, tablet10: { vp: { width: 1280, height: 800 }, dsf: 2, n: 4, pre: 'tablet10' } };
    const ORDER = ['map', 'home_dialog', 'home_quiz', 'runner', 'sea', 'kitchen', 'gathering', 'missions', 'closet'];
    for (const k of Object.keys(want)) {
      if (!ONLY.includes(k)) continue; const w = want[k];
      const shots = await captureSet(chromium, k, w.vp, w.dsf, w.n);
      const pick = ORDER.filter(n => shots[n]).slice(0, w.n); let i = 1;
      for (const n of pick) { fs.renameSync(shots[n], path.join(OUT, `${w.pre}_${String(i++).padStart(2, '0')}.jpg`)); }
      Object.values(shots).forEach(f => { try { fs.unlinkSync(f); } catch (e) { } });
    }
  } finally { if (srv) srv.close(); }
  console.log('[assets] done ->', OUT);
})().catch(e => { console.error(e); process.exit(1); });
