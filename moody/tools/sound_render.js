#!/usr/bin/env node
/* Moody & Aboody - tools/sound_render.js : renders the synthesized sounds OFFLINE (OfflineAudioContext replaces AudioContext in the page, so the real
   engine/audio.js + engine/soundscape.js code runs) to 16-bit WAV files and reports peak / RMS per sound.  Fails when any peak >= 0.9.
   usage: node tools/sound_render.js OUT_DIR [URL]     Listen to the WAVs by ear before shipping: this script only proves levels, not taste. */
const fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node-tools/node_modules/playwright');
const OUT = process.argv[2], URL_ = process.argv[3] || process.env.MOODY_URL || 'http://localhost:8765/moody/index.html';
if (!OUT) { console.error('usage: sound_render.js OUT_DIR [URL]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const SFX = ['tap', 'pop', 'pick', 'drop', 'good', 'star', 'coin', 'wrong', 'whoosh', 'splash', 'drip', 'alarm', 'boing', 'flip', 'bell', 'click', 'sleepy', 'fanfare', 'unlock',
  'swish', 'start', 'bump', 'thud', 'ball', 'step', 'hop', 'land', 'doorbell', 'knock', 'ring', 'hangup', 'clink', 'cash', 'schoolbell', 'liftding', 'honk', 'bird', 'gull', 'chime', 'creak', 'owl', 'car', 'surf'];
const SCENES = { 'bed_sea_8s': 'sea', 'bed_market_8s': 'market', 'bed_park_8s': 'park', 'bed_mystery_8s': 'mystery', 'bed_street_8s': 'street', 'bed_home_8s': 'home' };
const MOODS = ['home', 'menu', 'school', 'street', 'market', 'park', 'sea', 'nana', 'saudi', 'habits', 'gathering', 'runs', 'mystery'];
function wav(f32, sr) {
  const n = f32.length, b = Buffer.alloc(44 + n * 2); b.write('RIFF', 0); b.writeUInt32LE(36 + n * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(sr, 24); b.writeUInt32LE(sr * 2, 28); b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * 2, 40);
  for (let i = 0; i < n; i++) b.writeInt16LE(Math.max(-32768, Math.min(32767, Math.round(f32[i] * 32767))), 44 + i * 2); return b;
}
const INIT = secs => `(() => { const Off = window.OfflineAudioContext; Off.prototype.resume = function () { return Promise.resolve(); }; Off.prototype.suspend = function () { return Promise.resolve(); }; window.AudioContext = function () { return new Off(1, 44100 * ${secs}, 44100); }; })();`;
async function render(browser, secs, run) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } }); await ctx.addInitScript(INIT(secs)); const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push(e.message)); await p.goto(URL_); await p.waitForTimeout(900); await p.mouse.click(5, 5); await p.waitForTimeout(100);
  const r = await p.evaluate(async run => { const M = window.Moody; M.audio.init(); (new Function('M', run))(M); const buf = await M.audio.ctx().startRendering(); const d = buf.getChannelData(0); return { sr: buf.sampleRate, data: Array.from(d) }; }, run);
  await ctx.close(); const f = Float32Array.from(r.data); let pk = 0, ss = 0; for (const v of f) { pk = Math.max(pk, Math.abs(v)); ss += v * v; } return { f, sr: r.sr, peak: pk, rms: Math.sqrt(ss / f.length), errs };
}
(async () => {
  const br = await chromium.launch(), rows = []; let bad = 0;
  const job = async (name, secs, code) => {
    const r = await render(br, secs, code); fs.writeFileSync(path.join(OUT, name + '.wav'), wav(r.f, r.sr));
    const flag = r.peak >= .9 ? 'CLIP' : (r.peak < 1e-4 ? 'SILENT' : 'ok'); if (flag !== 'ok') bad++; if (r.errs.length) bad++;
    rows.push([name, r.peak.toFixed(3), (20 * Math.log10(Math.max(1e-6, r.rms))).toFixed(1) + ' dB', flag + (r.errs.length ? ' ERR ' + r.errs[0] : '')]); console.log(rows[rows.length - 1].join('\t'));
  };
  console.log('name\tpeak\trms\tstatus');
  for (const n of SFX) await job('sfx_' + n, 3, `M.audio.sfx('${n}', ${n === 'step' ? "'grass'" : 'undefined'})`);
  for (const [name, w] of Object.entries(SCENES)) await job(name, 8, `M.sound.enter('${w}'); M.sound._reconcile();`);   // bed only (events are scheduled by the live tick)
  for (const m of MOODS) await job('music_' + m + '_20s', 20, `M.sound._start('${m}'); M.sound._pump(20);`);
  /* worst case: sea bed + music + the loudest sfx together */
  await job('mix_sea_music_fanfare_star', 12, `M.sound.enter('sea'); M.sound._reconcile(); M.sound._start('sea'); M.sound._pump(12); M.audio.sfx('fanfare'); setTimeout(()=>{},0); M.audio.sfx('star'); M.audio.sfx('schoolbell'); M.audio.sfx('coin');`);
  await br.close(); console.log(bad ? 'RENDER: ' + bad + ' problem(s)' : 'RENDER: all peaks < 0.9, none silent'); process.exit(bad ? 1 : 0);
})();
