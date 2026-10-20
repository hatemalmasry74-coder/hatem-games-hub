#!/usr/bin/env node
/* make_www.js - turn the Play-edition web build into android/www (the Capacitor webDir).
 *
 *   node scripts/make_www.js --src ../play_dist [--split-voice] [--voice-dir assets/voice]
 *                            [--exclude "regex" ...] [--keep-sw] [--max-base-mb 170] [--no-lint]
 *
 *  --src         folder that contains the Play edition's index.html (output of `node tools/play/build.js <dir>`)
 *  --split-voice move <voice-dir> out of www into the Play Asset Delivery pack  android/android/voice_pack  (install-time)
 *  --exclude     extra regexes (matched against the relative path) of files to leave out
 *  --keep-sw     keep sw.js / manifest.json (default: dropped, the native app does not use a service worker or a web manifest)
 *  --max-base-mb warn threshold for the base module (default 170; Play's limit is 200 MB compressed download size - verify)
 * Exit code 1 on: missing src/index.html, or a policy lint ERROR (external payment / unlock-code leftovers).
 * Nothing is downloaded; nothing is written outside android/www and android/android/voice_pack/src/main/assets.
 */
'use strict';
const fs = require('fs'), path = require('path');
const ROOT = path.resolve(__dirname, '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf('--' + n); return i >= 0 ? (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true) : d; };
const all = n => args.reduce((a, x, i) => (x === '--' + n && args[i + 1] ? a.concat(args[i + 1]) : a), []);
const SRC = path.resolve(process.cwd(), opt('src', process.env.PLAY_DIST || path.join(ROOT, '..', 'play_dist')));
const OUT = path.join(ROOT, 'www');
const PACK = path.join(ROOT, 'android', 'voice_pack', 'src', 'main', 'assets', 'public');
const VOICE = String(opt('voice-dir', 'assets/voice')).replace(/^\/+|\/+$/g, '');
const SPLIT = !!opt('split-voice', false), KEEP_SW = !!opt('keep-sw', false), LINT = !opt('no-lint', false);
const MAX_BASE = +(opt('max-base-mb', 170)) * 1048576;
const EXCL = [/(^|\/)\.git(\/|$)/, /(^|\/)node_modules(\/|$)/, /\.map$/, /\.DS_Store$/, /(^|\/)__pycache__(\/|$)/, /\.(py|md)$/i, /(^|\/)tools(\/|$)/, /(^|\/)(tests?|docs)(\/|$)/]
  .concat(KEEP_SW ? [] : [/^sw\.js$/, /^manifest\.json$/]).concat(all('exclude').map(s => new RegExp(s)));
const MB = n => (n / 1048576).toFixed(1) + ' MB';
const die = m => { console.error('\n[make_www] ERROR: ' + m + '\n'); process.exit(1); };

if (!fs.existsSync(path.join(SRC, 'index.html'))) die(`no index.html in "${SRC}".\n  Build the Play edition first:  node tools/play/build.js play_dist   (then pass --src play_dist)`);
if (SRC === OUT || SRC.startsWith(OUT + path.sep)) die('--src must not be android/www itself');

function walk(dir, rel, out) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const r = rel ? rel + '/' + e.name : e.name;
    if (EXCL.some(rx => rx.test(r))) continue;
    if (e.isDirectory()) walk(path.join(dir, e.name), r, out);
    else if (e.isFile()) out.push({ rel: r, size: fs.statSync(path.join(dir, e.name)).size });
  }
  return out;
}
fs.rmSync(OUT, { recursive: true, force: true }); fs.mkdirSync(OUT, { recursive: true });
fs.rmSync(path.join(ROOT, 'android', 'voice_pack', 'src', 'main', 'assets'), { recursive: true, force: true });

const files = walk(SRC, '', []);
let base = 0, voice = 0, nVoice = 0, nBase = 0, big = [];
for (const f of files) {
  const isVoice = f.rel === VOICE || f.rel.startsWith(VOICE + '/');
  const to = path.join(isVoice && SPLIT ? PACK : OUT, f.rel);
  fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(path.join(SRC, f.rel), to);
  if (isVoice) { voice += f.size; nVoice++; if (!SPLIT) base += f.size; } else { base += f.size; nBase++; }
  if (f.size > 8 * 1048576) big.push(f);
}
if (SPLIT && nVoice === 0) console.warn(`[make_www] WARNING: --split-voice but "${VOICE}" has no files in ${SRC} (is --voice-dir right?)`);

/* ---- native glue: bridge scripts + injection into index.html (first thing in <head>) ---- */
const nat = path.join(OUT, 'native'); fs.mkdirSync(nat, { recursive: true });
fs.copyFileSync(path.join(ROOT, 'bridge', 'native_shell.js'), path.join(nat, 'native_shell.js'));
fs.copyFileSync(path.join(ROOT, 'bridge', 'billing_capacitor.js'), path.join(nat, 'billing_capacitor.js'));
const ip = path.join(OUT, 'index.html'); let html = fs.readFileSync(ip, 'utf8');
if (!/native\/native_shell\.js/.test(html)) {
  const tags = '<script src="native/native_shell.js"></script>\n<script src="native/billing_capacitor.js"></script>\n';
  html = /<head[^>]*>/i.test(html) ? html.replace(/<head[^>]*>/i, m => m + '\n' + tags) : tags + html;
  fs.writeFileSync(ip, html);
}

/* ---- policy lint: things that must not ship inside the Google Play build ---- */
const errs = [], warns = [];
if (LINT) {
  const TEXT = /\.(html?|js|css|json|webmanifest|xml|txt)$/i;
  const rules = [
    [/activation code|activate.?code|كود الاشتراك|كود التفعيل|hub_sub_v1|paywall\.js/i, 'error', 'unlock-code / external-payment paywall left in the build (Play requires Google Play Billing for digital unlocks; no codes, no "ask by e-mail")'],
    [/mailto:/i, 'warn', 'mailto: link (fine for a parent-facing support link behind the gate; never as a way to buy)'],
    [/instapay|vodafone.?cash|\bfawry|paypal\.(com|me)|stripe\.(com|js)|js\.stripe|whatsapp.*(pay|اشتراك)|wa\.me\//i, 'error', 'external payment method / link to a payment channel'],
    [/https?:\/\/(?!www\.w3\.org|localhost)[^\s"'<>)]+/i, 'warn', 'external URL (the app must not load remote content; check it is only a text/link in the parent area)'],
    [/\b(fetch|XMLHttpRequest|WebSocket|sendBeacon)\s*\(\s*['"`]https?:/i, 'error', 'network call to an absolute URL'],
    [/googletagmanager|google-analytics|gtag\(|firebase|admob|adsbygoogle|facebook\.net|sentry|crashlytics/i, 'error', 'analytics / ads SDK reference (Families policy)'],
  ];
  for (const f of files) {
    if (!TEXT.test(f.rel) || f.size > 3 * 1048576) continue;
    const to = path.join(SPLIT && (f.rel === VOICE || f.rel.startsWith(VOICE + '/')) ? PACK : OUT, f.rel);
    let txt; try { txt = fs.readFileSync(to, 'utf8'); } catch (e) { continue; }
    for (const [rx, lvl, msg] of rules) { const m = rx.exec(txt); if (m) (lvl === 'error' ? errs : warns).push(`${f.rel}: ${msg}   [${m[0].slice(0, 60)}]`); }
  }
  if (/\.\.\/(sonic|pwa-game|paywall)/.test(html)) errs.push('index.html still references ../ paths outside the web root (those files will not exist in the app)');
}

/* ---- report ---- */
console.log(`[make_www] src      ${SRC}`);
console.log(`[make_www] www      ${nBase} files, ${MB(base)} in the base module${SPLIT ? '' : ' (incl. voice)'}`);
console.log(`[make_www] voice    ${nVoice} files, ${MB(voice)} ${SPLIT ? '-> android/android/voice_pack (install-time asset pack)' : '(inside www)'}`);
console.log(`[make_www] total    ${MB(base + (SPLIT ? voice : 0))}   (mp3/png/jpg are already compressed, so the download is ~ the same size)`);
if (big.length) console.log('[make_www] big files: ' + big.map(f => f.rel + ' ' + MB(f.size)).join(', '));
if (!SPLIT && base > MAX_BASE) console.warn(`[make_www] WARNING: base module ${MB(base)} > ${MB(MAX_BASE)} threshold. Play's base-module limit is 200 MB (compressed download size, VERIFY the current number) -> rebuild with --split-voice (install-time asset pack, up to ~1 GB in total - verify) or --exclude unused files.`);
if (SPLIT && base > MAX_BASE) console.warn(`[make_www] WARNING: even without voice the base module is ${MB(base)}.`);
if (SPLIT && voice > 900 * 1048576) console.warn('[make_www] WARNING: install-time packs are limited to ~1 GB in total (verify) - consider fast-follow/on-demand delivery.');
warns.forEach(w => console.warn('[make_www] warn : ' + w));
if (errs.length) { errs.forEach(e => console.error('[make_www] ERROR: ' + e)); die(`${errs.length} policy lint error(s). Fix the Play edition (tools/play/build.js) - or pass --no-lint if you KNOW it is a false positive.`); }
console.log('[make_www] OK  -> ' + OUT);
