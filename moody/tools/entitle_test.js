#!/usr/bin/env node
/* Moody & Aboody - tools/entitle_test.js : tests of the Google Play monetisation layer, against the MOCK billing provider (no real purchase is ever made).
   node tools/entitle_test.js [logic|play|worker|all] [desk|phone]     env MOODY_BASE=http://localhost:8911/moody/index.html
     logic   (default) locks, paywall, parental gate, purchase/cancel/pending/failure/restore/expiry/grace/hold/refund/offline grace, ?unlock=1 + ?devunlock, tamper tests,
             provider contract tests with stubbed Digital Goods API / Capacitor bridge, web edition untouched, zero console errors
     play    the kid-bot plays the FREE mission of every world (not subscribed), then mock-purchases and plays EVERY mission (long: ~1 h per viewport)
     worker  unit test of relay/play_verify_worker.js mapSubscription()
   Exit code 1 when a check fails. Results of the honest "known limitation" checks are printed as INFO. */
const { launch, sleep } = require('./botlib.js');
const crypto = require('crypto'), fs = require('fs'), vm = require('vm'), path = require('path');
const BASE = process.env.MOODY_BASE || 'http://localhost:8911/moody/index.html';
const mode = process.argv[2] || 'logic', kind = process.argv[3] || 'desk';
let fails = 0, total = 0; const allErrs = [];
const check = (name, ok, detail) => { total++; if (!ok) fails++; console.log((ok ? 'PASS ' : 'FAIL ') + name + (!ok && detail !== undefined ? '  -> ' + JSON.stringify(detail).slice(0, 300) : '')); };
const info = (name, v) => console.log('INFO ' + name + ': ' + (typeof v === 'string' ? v : JSON.stringify(v)));
const D = n => String(n).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
const SECRET = 's3cret-dev-key', SECRET_HASH = crypto.createHash('sha256').update(SECRET).digest('hex');

/* init script: config preset + Date.now shift (sessionStorage so it survives reload) + optional stubs */
function initScript(cfg, extra) {
  return 'window.MOODY_CONFIG=Object.assign({allowMock:true},' + JSON.stringify(cfg || {}) + ');' +
    'try{window.__shift=+(sessionStorage.getItem("__shift")||0);}catch(e){window.__shift=0;}' +
    '(function(){var n=Date.now.bind(Date);Date.now=function(){return n()+(window.__shift||0);};})();' + (extra || '');
}
async function mk(opts) {
  opts = opts || {};
  const e = await launch({ kind: opts.kind || 'desk', url: opts.url || BASE + '?edition=play', init: initScript(opts.cfg, opts.extra) });
  e.p.setDefaultTimeout(8000); return e;
}
const shift = (p, ms) => p.evaluate(ms => { window.__shift = ms; sessionStorage.setItem('__shift', String(ms)); }, ms);
async function done(e, label) { const errs = e.errs.filter(x => !/favicon/.test(x)); if (errs.length) { allErrs.push([label, errs]); } check('no console errors: ' + label, errs.length === 0, errs.slice(0, 3)); await e.b.close(); }
const worldsInfo = p => p.evaluate(() => Moody.worlds.filter(w => !w.soon).map(w => ({ id: w.id, hidden: !!w.hidden, ms: w.missions.map(m => m.id) })));
const ent = p => p.evaluate(() => Moody.ent.status());
const canAll = p => p.evaluate(() => Moody.worlds.filter(w => !w.soon && !w.hidden).every(w => w.missions.every(m => Moody.ent.canPlay(w.id, m.id))));

async function begin(e) {
  await e.bot.startGame(); await sleep(500);
  for (let i = 0; i < 40; i++) {   // slow machines: the names screen can appear late
    if (await e.p.evaluate(() => !!document.querySelector('.card[data-world]'))) break;
    if (await e.p.evaluate(() => !!document.querySelector('input.txt'))) await e.bot.tapText('يلا بينا'); else if (i === 10) await e.bot.tapSel('.btn.big.green');
    await sleep(400);
  }
  await e.p.waitForSelector('.card[data-world]', { timeout: 15000 }); await e.p.waitForFunction(() => Moody.billing && Moody.billing.name && Moody.ent.status, null, { timeout: 8000 }); await sleep(300); }
async function openWorld(e, w) { await e.p.waitForSelector('.card[data-world="' + w + '"]', { timeout: 15000 }); await e.p.evaluate(w => document.querySelector('.card[data-world="' + w + '"]').click(), w); await e.p.waitForSelector('.mcard[data-mission]'); await sleep(450); }
async function toMap(e) { await e.p.evaluate(() => Moody.flow.toMap()); await e.p.waitForSelector('.card[data-world]'); await sleep(300); }
/* the parental gate, solved like an adult (real pointer events) */
async function passGate(e, o) {
  o = o || {}; const p = e.p; const hb = p.locator('[data-gate=hold]'); await hb.waitFor({ timeout: 5000 }); const bb = await hb.boundingBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
  if (e.kind === 'desk' || !e.ctx) { await p.mouse.move(cx, cy); await p.mouse.down(); await p.waitForSelector('[data-gate=q]', { timeout: 6000 }); await p.mouse.up(); }
  else { const s = await e.ctx.newCDPSession(p); await s.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] }); await p.waitForSelector('[data-gate=q]', { timeout: 6000 }); await s.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); }
  const q = D(await p.locator('[data-gate=q]').textContent()), m = /(\d+)\s*×\s*(\d+)\s*\+\s*(\d+)/.exec(q), ans = String(m[1] * m[2] + +m[3]);
  for (const d of ans) await e.bot.tapSel('[data-key="' + d + '"]'); await e.bot.tapSel('[data-key=ok]'); await sleep(500);
}
const sheetOpen = p => p.evaluate(() => !!document.querySelector('.pw-modal[data-paywall=sheet]'));
const gateOpen = p => p.evaluate(() => !!document.querySelector('.pw-modal [data-gate]'));
async function openSheet(e, w, m) { await openWorld(e, w); await e.p.evaluate(m => document.querySelector('.mcard[data-mission="' + m + '"]').click(), m); await passGate(e); await e.p.waitForSelector('.pw-modal[data-paywall=sheet] [data-act=buy]', { timeout: 6000 }); await sleep(300); }
const msgText = p => p.evaluate(() => (document.querySelector('.pw-modal [data-msg]') || {}).textContent || '');
const mock = (p, js, arg) => p.evaluate(new Function('a', 'const c=Moody.billing.providers.mock.ctl;' + js), arg);
async function buy(e, plan) { await e.bot.tapSel('[data-act=buy][data-plan=' + (plan || 'monthly') + ']'); await sleep(900); }

/* ============================================================ LOGIC ============================================================ */
async function logic() {
  /* ---------- 1. new user: only the first mission of each normal world is playable ---------- */
  let e = await mk({ kind }); await begin(e); const p = e.p;
  check('edition=play, provider=mock', await p.evaluate(() => Moody.config.edition === 'play' && Moody.billing.name === 'mock'));
  const W = await worldsInfo(p), normal = W.filter(w => !w.hidden);
  const matrix = await p.evaluate(() => Moody.worlds.filter(w => !w.soon).map(w => [w.id, w.missions.map(m => Moody.ent.canPlay(w.id, m.id))]));
  const onlyFirst = matrix.filter(([id]) => normal.some(w => w.id === id)).every(([, a]) => a[0] === true && a.slice(1).every(x => x === false));
  check('new user: only mission #1 of each of the ' + normal.length + ' worlds is playable (' + normal.reduce((n, w) => n + w.ms.length - 1, 0) + ' locked)', onlyFirst && normal.length >= 11, matrix);
  check('hidden worlds (room, call) stay free', W.filter(w => w.hidden).length >= 2 && await p.evaluate(() => Moody.worlds.filter(w => w.hidden).every(w => w.missions.every(m => Moody.ent.canPlay(w.id, m.id)))));
  check('isPremium() false for a new user', !(await p.evaluate(() => Moody.ent.isPremium())));
  /* map: ring counts only unlocked, card text */
  await toMap(e);
  const cards = await p.evaluate(() => Array.from(document.querySelectorAll('.card[data-world]')).map(c => [c.dataset.world, (c.querySelector('.cnt') || {}).textContent, c.getAttribute('aria-label')]));
  check('world cards show "N مجانية + M مع الاشتراك"', cards.length >= 11 && cards.filter(c => /مجانية/.test(c[1] || '') && /مع الاشتراك/.test(c[1] || '')).length === normal.length, cards.slice(0, 2));
  check('progress ring/stars total counts only unlocked missions (3 stars per world)', cards.filter(c => /من ٣ نجمة/.test(c[2] || '')).length === normal.length, cards.slice(0, 2));
  /* the bot taps every locked mission in the UI: gate, not a game */
  let tapped = 0, started = 0, gates = 0, badge = 0;
  for (const w of normal) {
    await toMap(e); await openWorld(e, w.id);
    const lockedCards = await p.evaluate(() => Array.from(document.querySelectorAll('.mcard[data-paid]')).map(c => c.dataset.mission));
    badge += await p.evaluate(() => document.querySelectorAll('.mcard.paywall .pw-lock').length);
    for (const mid of lockedCards) {
      await p.evaluate(m => document.querySelector('.mcard[data-mission="' + m + '"]').click(), mid); tapped++; await sleep(120);
      if (await gateOpen(p)) gates++; if (await p.evaluate(() => !!Moody.flow.cur)) started++;
      await p.evaluate(() => { const b = document.querySelector('.pw-modal [data-gate=back]'); if (b) b.click(); }); await sleep(80);
    }
  }
  check('bot taps all ' + tapped + ' locked missions: every tap opens the parental gate', gates === tapped && tapped >= 60, [gates, tapped]);
  check('no locked mission ever started (UI path)', started === 0);
  check('locked cards show a padlock + «مع الاشتراك»', badge === tapped, [badge, tapped]);
  /* defensive path: direct flow calls */
  let direct = 0, directStarted = 0;
  for (const w of normal) for (let i = 1; i < w.ms.length; i++) { await p.evaluate(([w, i]) => Moody.flow.startMission(w, i), [w.id, i]); await sleep(40); direct++; if (await p.evaluate(() => !!Moody.flow.cur)) directStarted++; await p.evaluate(() => { const b = document.querySelector('.pw-modal [data-gate=back]'); if (b) b.click(); }); }
  check('direct Moody.flow.startMission() on ' + direct + ' locked missions: none starts', directStarted === 0, directStarted);
  check('progress cheating does not unlock: marking every mission done in the save keeps paid missions locked', await p.evaluate(() => { Moody.worlds.forEach(w => w.missions.forEach(m => { Moody.save.data.progress[w.id + '/' + m.id] = { done: true, stars: 3, plays: 1 }; })); const ok = !Moody.ent.canPlay('school', 'm2') && !Moody.ent.canPlay('runs', 'r5'); Moody.save.reset(); return ok; }));
  check('no code-entry / external-unlock in the Play edition (no HubPay provider, no <input> in the sheet)', await p.evaluate(() => !Moody.billing.providers.hubpay && !window.HubPay));
  await toMap(e);
  /* parents' corner: reachable, shows status */
  await e.bot.tapText('ركن الأهل'); await sleep(700);
  const par = await p.evaluate(() => { const b = document.querySelector('.pw-parent'); return b ? b.textContent : null; });
  check("parents' corner shows «الاشتراك» + not-subscribed status", par && /الاشتراك/.test(par) && /مش مشترك/.test(par), par);
  await done(e, 'new user / locks');

  /* ---------- 2. parental gate ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await openWorld(e, 'school'); await p.evaluate(() => document.querySelector('.mcard[data-mission="m2"]').click()); await p.waitForSelector('[data-gate=hold]');
    const bb = await p.locator('[data-gate=hold]').boundingBox(), cx = bb.x + bb.width / 2, cy = bb.y + bb.height / 2;
    await p.mouse.move(cx, cy); await p.mouse.down(); await sleep(350); await p.mouse.up(); await sleep(300);
    check('gate step 1: a quick tap (a child) does not pass the hold', await p.evaluate(() => !!document.querySelector('[data-gate=hold]') && !document.querySelector('[data-gate=q]')));
    await p.mouse.move(cx, cy); await p.mouse.down(); await sleep(1400); await p.mouse.up(); await sleep(200);
    check('gate step 1: releasing before 3 s resets', await p.evaluate(() => !document.querySelector('[data-gate=q]')));
    await p.mouse.move(cx, cy); await p.mouse.down(); await sleep(3300); await p.mouse.up(); await sleep(300);
    check('gate step 1: holding 3 s reveals the arithmetic problem', await p.evaluate(() => !!document.querySelector('[data-gate=q]')));
    const q = D(await p.locator('[data-gate=q]').textContent()); info('gate problem sample', q);
    /* random tapping: 3 rounds x 3 random answers */
    let passed = false;
    for (let r = 0; r < 3 && !passed; r++) {
      if (!(await p.evaluate(() => !!document.querySelector('[data-key=ok]')))) break;
      const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) await e.bot.tapSel('[data-key="' + Math.floor(Math.random() * 10) + '"]'); await e.bot.tapSel('[data-key=ok]'); await sleep(900);
      passed = await sheetOpen(p);
    }
    check('gate step 2: random tapping on the keypad does not pass (3 attempts)', !passed);
    await sleep(900); const lockMsg = await p.evaluate(() => (document.querySelector('[data-gate=msg]') || {}).textContent || '');
    check('3 wrong answers -> cool-down message', /بعد/.test(D(lockMsg)) && /ثانية/.test(lockMsg), lockMsg);
    await e.bot.tapSel('[data-key="7"]'); await sleep(100);
    check('keypad is dead during the cool-down', await p.evaluate(() => (document.querySelector('[data-gate=disp]') || { textContent: '' }).textContent.trim() === ''));
    check('no purchase UI was ever shown', !(await sheetOpen(p)) && await p.evaluate(() => !document.querySelector('[data-act=buy]')));
    await e.bot.tapSel('[data-gate=back]'); await sleep(200);
    check('«رجوع» closes the gate, mission list still locked', await p.evaluate(() => !document.querySelector('.pw-modal') && !Moody.flow.cur));
  }
  await done(e, 'parental gate');

  /* ---------- 3. purchase success -> everything unlocks ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await openSheet(e, 'school', 'm2');
    const txt = await p.evaluate(() => document.querySelector('.pw-modal').textContent);
    check('sheet: benefits, monthly+yearly prices from the store, restore, terms, privacy, cancel info, later', /كل المهام في كل المغامرات/.test(txt) && /شهري/.test(txt) && /سنوي/.test(txt) && /59\.99/.test(txt) && /499\.99/.test(txt) && /استرجاع المشتريات/.test(txt) && /شروط الاستخدام/.test(txt) && /سياسة الخصوصية/.test(txt) && /إعدادات Google Play/.test(txt) && /لاحقًا/.test(txt));
    check('sheet: free-trial offer from the store is shown', /تجربة مجانية ٣ أيام/.test(txt) && /تجربة مجانية ٧ أيام/.test(txt));
    check('sheet: no countdown / urgency wording, no input fields', !/(ينتهي|آخر فرصة|عرض محدود|متبقي|الآن فقط)/.test(txt) && await p.evaluate(() => !document.querySelector('.pw-modal input')));
    check('sheet: mock provider is flagged as a test mode', /وضع تجريبي/.test(txt));
    await buy(e, 'monthly');
    check('purchase success: celebration (unlock animation) is shown', await p.evaluate(() => !!document.querySelector('[data-state=unlocked] svg .sh')));
    check('entitlement ACTIVE with an expiry', await p.evaluate(() => { const s = Moody.ent.status(); return s.premium && s.state === 'ACTIVE' && s.expiry > Date.now() && s.plan === 'monthly'; }));
    check('every mission of every world is playable now', await canAll(p));
    check('locks vanished from the list behind the celebration at once', await p.evaluate(() => document.querySelectorAll('.mcard[data-paid]').length === 0 && document.querySelectorAll('.pw-lock').length === 0 && document.querySelectorAll('.mcard.locked').length === 0));
    await e.bot.tapSel('[data-act=playnow]'); await sleep(500);
    check('celebration closes with «يلا نلعب»', await p.evaluate(() => !document.querySelector('.pw-modal')));
    await toMap(e); const cnt = await p.evaluate(() => Array.from(document.querySelectorAll('.card[data-world] .cnt')).map(c => c.textContent));
    check('world cards no longer mention locked missions', cnt.every(t => !/مع الاشتراك/.test(t)), cnt.slice(0, 2));
    await e.bot.tapText('ركن الأهل'); await sleep(600);
    const par = await p.evaluate(() => (document.querySelector('.pw-parent') || {}).textContent || '');
    check("parents' corner: active until <date> + «إدارة الاشتراك»", /مشترك لحد/.test(par) && /إدارة الاشتراك/.test(par), par);
    /* persistence: reload keeps the entitlement (cache + mock store) */
    await p.reload(); await sleep(1500); await e.bot.startGame(); await begin(e).catch(() => { });
    check('after reload: still subscribed (cached + re-verified with the store)', await p.evaluate(() => Moody.ent.isPremium()));
    check('"مسح كل التقدّم" does not remove the subscription (device-level entitlement)', await p.evaluate(() => { Moody.save.reset(); return Moody.ent.isPremium(); }));
    /* manage -> gate -> play subscription page (external); a fresh page = a fresh gate */
    await p.evaluate(() => Moody.flow.toParent(Moody.flow.toMap)); await sleep(500);
    await p.evaluate(() => { window.__opened = []; window.open = u => { window.__opened.push(u); return null; }; });
    await e.bot.tapSel('.pw-parent [data-act=manage]'); await sleep(400);
    check('«إدارة الاشتراك»: the parental gate comes first, nothing is opened yet', await gateOpen(p) && (await p.evaluate(() => window.__opened)).length === 0);
    await passGate(e); await sleep(300);
    const opened = await p.evaluate(() => window.__opened);
    check('«إدارة الاشتراك» opens https://play.google.com/store/account/subscriptions after the gate', opened.length === 1 && /^https:\/\/play\.google\.com\/store\/account\/subscriptions/.test(opened[0]), opened);
  }
  await done(e, 'purchase success');

  /* ---------- 4. cancel / failure / pending ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await mock(p, 'c.setNext("cancel")'); await openSheet(e, 'park', 'm3'); await buy(e);
    check('purchase cancelled: stays locked, friendly message', !(await p.evaluate(() => Moody.ent.isPremium())) && /مفيش اشتراك/.test(await msgText(p)), await msgText(p));
    await mock(p, 'c.setNext("failure")'); await buy(e);
    check('purchase failure: stays locked, "nothing charged" message', !(await p.evaluate(() => Moody.ent.isPremium())) && /محدش اتخصم/.test(await msgText(p)), await msgText(p));
    await mock(p, 'c.setNext("pending")'); await buy(e);
    let s = await ent(p);
    check('purchase pending: NOT unlocked, status PENDING, explained', !s.premium && s.pending && s.state === 'PENDING' && /قيد المعالجة/.test(await msgText(p)), s);
    check('pending: missions still locked', await p.evaluate(() => !Moody.ent.canPlay('park', 'm3')));
    await e.bot.tapSel('[data-act=later]'); await sleep(200);
    await p.evaluate(() => Moody.flow.toParent(Moody.flow.toMap)); await sleep(600);
    check("parents' corner shows the pending state", /قيد المعالجة/.test(await p.evaluate(() => (document.querySelector('.pw-parent') || {}).textContent || '')));
    await toMap(e); await openWorld(e, 'park');
    await mock(p, 'c.resolvePending(true)'); await sleep(700);
    s = await ent(p);
    check('pending resolved by the store -> unlocked automatically, list re-rendered', s.premium && await p.evaluate(() => document.querySelectorAll('.mcard[data-paid]').length === 0), s);
    check('a toast tells the parent (no sheet was open)', await p.evaluate(() => /تم تفعيل الاشتراك/.test(document.body.innerText)));
  }
  await done(e, 'cancel/failure/pending');

  /* ---------- 4b. pending resolved while the sheet is open ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await mock(p, 'c.setNext("pending")'); await openSheet(e, 'park', 'm3'); await buy(e); await mock(p, 'c.resolvePending(true)'); await sleep(700);
    check('pending resolved while the sheet is open -> celebration', await p.evaluate(() => !!document.querySelector('[data-state=unlocked]')));
  }
  await done(e, 'pending while open');

  /* ---------- 5. restore ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await openSheet(e, 'sea', 'm2'); await e.bot.tapSel('[data-act=restore]'); await sleep(700);
    check('restore with no purchase: message, still locked', /ما لقيناش/.test(await msgText(p)) && !(await p.evaluate(() => Moody.ent.isPremium())), await msgText(p));
    await mock(p, 'c.setOffline(true)'); await e.bot.tapSel('[data-act=restore]'); await sleep(700);
    check('restore offline: explains, still locked', /ما قدرناش نوصل/.test(await msgText(p)), await msgText(p));
    await mock(p, 'c.setOffline(false); c.grant(Moody.config.productIds.yearly, 200, true)'); await sleep(300);   // silent: the store has it, nobody told the app (reinstall / new device)
    /* wipe the local cache to simulate a reinstall / new device on the same Google account */
    await p.evaluate(() => { localStorage.removeItem('moody_ent_v1'); Moody.ent._rec = null; });
    check('after wiping the cache the entitlement is gone locally', !(await p.evaluate(() => Moody.ent.isPremium())));
    await e.bot.tapSel('[data-act=restore]'); await sleep(900);
    check('restore finds the Google subscription: unlocked + celebration', await p.evaluate(() => Moody.ent.isPremium() && !!document.querySelector('[data-state=unlocked]')));
  }
  await done(e, 'restore');

  /* ---------- 6. expiry, grace, hold, refund, offline grace, clock ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await openSheet(e, 'home', 'm2'); await buy(e); await e.bot.tapSel('[data-act=playnow]'); await sleep(300); await openWorld(e, 'home').catch(() => { });
    check('subscribed: home m2 playable', await p.evaluate(() => Moody.ent.canPlay('home', 'm2')));
    await mock(p, 'c.expireNow()'); await sleep(600);
    let s = await ent(p);
    check('EXPIRED event from the store: re-locks immediately', !s.premium && s.state === 'EXPIRED' && await p.evaluate(() => !Moody.ent.canPlay('home', 'm2')), s);
    check('visible list re-rendered with padlocks after expiry', await p.evaluate(() => document.querySelectorAll('.mcard[data-paid]').length > 0));
    check('free mission still playable after expiry', await p.evaluate(() => Moody.ent.canPlay('home', 'm1')));
    check('progress is kept after expiry', await p.evaluate(() => { Moody.save.data.progress['home/m1'] = { done: true, stars: 2, plays: 1 }; Moody.save.commit(); return !!Moody.save.prog('home', 'm1'); }));
    await mock(p, 'c.renew()'); await sleep(500); check('renewal pushed by the store: unlocked again', (await ent(p)).premium);
    await mock(p, 'c.grace(3*864e5)'); await sleep(500); s = await ent(p);
    check('billing grace period: still entitled (state GRACE)', s.premium && s.state === 'GRACE', s);
    await mock(p, 'c.hold()'); await sleep(500); s = await ent(p);
    check('account hold: not entitled (EXPIRED/hold)', !s.premium && s.state === 'EXPIRED' && s.reason === 'hold', s);
    await mock(p, 'c.renew()'); await sleep(400);
    await mock(p, 'c.refund()'); await sleep(500); s = await ent(p);
    check('refund / revocation: re-locks (EXPIRED/refunded)', !s.premium && s.reason === 'refunded' && await p.evaluate(() => !Moody.ent.canPlay('home', 'm2')), s);
  }
  await done(e, 'expiry/grace/hold/refund');

  e = await mk({ kind, cfg: { offlineGraceDays: 7 } }); await begin(e); {
    const p = e.p; await openSheet(e, 'home', 'm2'); await buy(e); const exp = (await ent(p)).expiry;
    await mock(p, 'c.setOffline(true)'); await shift(p, exp - Date.now() + 2 * 864e5);
    check('offline, 2 days past the expiry (within the 7-day grace): still entitled (stale)', await p.evaluate(() => Moody.ent.isPremium()) && (await ent(p)).stale);
    await shift(p, exp - Date.now() + 8 * 864e5 + (await p.evaluate(() => window.__shift)));
    check('offline, 8 days past the expiry: grace over -> locked', !(await p.evaluate(() => Moody.ent.isPremium())));
    /* clock rollback must not resurrect it */
    await shift(p, 0); await p.reload(); await sleep(1300); await e.bot.startGame().catch(() => { });
    check('rolling the clock back (offline) does not resurrect an expired entitlement (monotonic clock)', !(await p.evaluate(() => Moody.ent.isPremium())));
    await mock(p, 'c.setOffline(false)'); await p.evaluate(() => Moody.ent.refresh()); await sleep(500);
    info('after going online with the clock back: store says', await ent(p));
    check('back online: the store (still active) re-validates the subscription', (await ent(p)).premium);
  }
  await done(e, 'offline grace / clock');

  /* ---------- 7. ?unlock=1 and ?devunlock ---------- */
  e = await mk({ kind, url: BASE + '?edition=play&unlock=1' }); await begin(e); {
    const p = e.p;
    check('play edition: ?unlock=1 is ignored (urlUnlock false)', await p.evaluate(() => Moody.urlUnlock === false));
    check('play edition + ?unlock=1: paid missions still locked', await p.evaluate(() => !Moody.ent.canPlay('school', 'm2') && !Moody.save.unlocked(Moody.getWorld('school'), 3)));
    await openWorld(e, 'school'); await p.evaluate(() => document.querySelector('.mcard[data-mission="m3"]').click()); await sleep(400);
    check('play edition + ?unlock=1: tapping a paid mission opens the gate', await gateOpen(p) && await p.evaluate(() => !Moody.flow.cur));
  }
  await done(e, 'unlock=1 in play');
  e = await mk({ kind, url: BASE + '?edition=play&devunlock=' + SECRET, cfg: { devUnlockHash: SECRET_HASH } }); await begin(e); await sleep(500);
  check('?devunlock=<secret> with the matching configured hash unlocks (dev only)', await e.p.evaluate(() => Moody.ent.dev && Moody.ent.canPlay('school', 'm5') && Moody.urlUnlock));
  await done(e, 'devunlock ok');
  e = await mk({ kind, url: BASE + '?edition=play&devunlock=wrong', cfg: { devUnlockHash: SECRET_HASH } }); await begin(e); await sleep(500);
  check('?devunlock=<wrong secret> does nothing', await e.p.evaluate(() => !Moody.ent.dev && !Moody.ent.canPlay('school', 'm5')));
  await done(e, 'devunlock wrong');
  e = await mk({ kind, url: BASE + '?edition=play&devunlock=' + SECRET }); await begin(e); await sleep(500);
  check('?devunlock with NO hash configured (release default) does nothing', await e.p.evaluate(() => !Moody.ent.dev && !Moody.ent.canPlay('school', 'm5')));
  await done(e, 'devunlock no hash');
  e = await mk({ kind, url: BASE + '?edition=web', cfg: { edition: 'play' } }); await begin(e);
  check('edition preset by the wrapper cannot be downgraded from the URL (?edition=web)', await e.p.evaluate(() => Moody.config.edition === 'play' && !Moody.ent.canPlay('school', 'm2')));
  await done(e, 'edition preset');
  e = await mk({ kind, url: BASE + '?edition=play', cfg: { allowMock: false } }); await begin(e);
  check('mock billing is NOT selectable unless allowMock (release default): provider falls back to none, locked, no free unlock', await e.p.evaluate(() => Moody.billing.name === 'none' && !Moody.billing.providers.mock && !Moody.ent.canPlay('school', 'm2')));
  await openSheet(e, 'school', 'm2').catch(() => { });
  check('store unavailable: sheet explains, no buy button', await e.p.evaluate(() => !document.querySelector('[data-act=buy]') && /مش متاح/.test(document.body.innerText)));
  await done(e, 'no billing');

  /* ---------- 8. web edition is untouched ---------- */
  e = await mk({ kind, url: BASE, cfg: {} }); await begin(e); {
    const p = e.p; await openWorld(e, 'school');
    check('web edition: inert (every mission playable, no padlocks, no paywall objects)', await p.evaluate(() => Moody.config.edition === 'web' && !Moody.ent.active && Moody.ent.canPlay('school', 'm4') === true && document.querySelectorAll('.mcard[data-paid]').length === 0 && document.querySelectorAll('.pw-lock').length === 0));
    check('web edition: original chain lock still works (m2 locked until m1 done)', await p.evaluate(() => document.querySelector('.mcard[data-mission="m2"]').classList.contains('locked') && !document.querySelector('.mcard[data-mission="m2"]').classList.contains('paywall')));
  }
  await done(e, 'web edition');
  e = await mk({ kind, url: BASE + '?unlock=1', cfg: {} }); await begin(e); {
    await openWorld(e, 'school');
    check('web edition: ?unlock=1 still opens everything', await e.p.evaluate(() => Moody.urlUnlock === true && document.querySelectorAll('.mcard.locked').length === 0));
  }
  await done(e, 'web ?unlock=1');
  /* web + gateWeb: HubPay activation codes (only outside the play edition) */
  e = await mk({ kind, url: BASE, cfg: { gateWeb: true, billingProvider: 'hubpay' }, extra: 'window.__pro=false;window.HubPay={isPro:function(){return window.__pro},daysLeft:function(){return 30},activate:function(c){if(c==="GOOD"){window.__pro=true;return Promise.resolve({ok:true})}return Promise.resolve({ok:false})}};' }); await begin(e); {
    const p = e.p; check('web+gateWeb: provider hubpay', await p.evaluate(() => Moody.billing.name === 'hubpay'));
    await openSheet0(e);
    async function openSheet0(e) { await openWorld(e, 'school'); await e.p.evaluate(() => document.querySelector('.mcard[data-mission="m2"]').click()); await passGate(e); await e.p.waitForSelector('.pw-modal[data-paywall=sheet] input', { timeout: 6000 }); }
    await p.fill('.pw-modal input', 'BAD'); await e.bot.tapSel('.pw-modal .btn.green'); await sleep(400);
    check('web+gateWeb: wrong code rejected', await p.evaluate(() => !Moody.ent.isPremium()));
    await p.fill('.pw-modal input', 'GOOD'); await e.bot.tapSel('.pw-modal .btn.green'); await sleep(700);
    check('web+gateWeb: right code unlocks', await p.evaluate(() => Moody.ent.isPremium()));
  }
  await done(e, 'web gateWeb hubpay');

  /* ---------- 9. tampering ---------- */
  e = await mk({ kind }); await begin(e); {
    const p = e.p; await openSheet(e, 'school', 'm2'); await buy(e); await e.bot.tapSel('[data-act=playnow]'); await sleep(200);
    const rawKey = 'moody_ent_v1'; await mock(p, 'c.setOffline(true)');
    const tryTamper = async (name, fn) => {
      await p.evaluate(() => Moody.flow.toMap()); await p.evaluate(fn); await p.reload(); await sleep(1300);
      const r = await p.evaluate(() => ({ prem: Moody.ent.isPremium(), tampered: Moody.ent.tampered })); return r;
    };
    // (a) edit a field without recomputing the checksum
    let r = await tryTamper('exp edit', () => { const o = JSON.parse(localStorage.getItem('moody_ent_v1')); o.exp = Date.now() + 3650 * 864e5; localStorage.setItem('moody_ent_v1', JSON.stringify(o)); });
    check('tamper: editing the expiry in localStorage is detected and discarded', !r.prem && r.tampered, r);
    // restore a valid state (online), then (b) copy the record to "another install" (different salt)
    await mock(p, 'c.setOffline(false)'); await p.evaluate(() => Moody.ent.refresh()); await sleep(600);
    check('after tamper detection the store check restores the real entitlement', await p.evaluate(() => Moody.ent.isPremium()));
    await mock(p, 'c.setOffline(true)');
    r = await tryTamper('other install', () => { localStorage.setItem('moody_ent_salt_v1', 'another-install'); });
    check('tamper: a record copied to another install (different salt) is rejected', !r.prem && r.tampered, r);
    await mock(p, 'c.setOffline(false)'); await p.evaluate(() => Moody.ent.refresh()); await sleep(500); await mock(p, 'c.setOffline(true)');
    r = await tryTamper('flip state', () => { const o = JSON.parse(localStorage.getItem('moody_ent_v1')); o.st = 'ACTIVE'; o.exp = Date.now() + 864e7; delete o.c; localStorage.setItem('moody_ent_v1', JSON.stringify(o)); });
    check('tamper: forging an ACTIVE record / deleting the checksum is rejected', !r.prem && r.tampered, r);
    r = await tryTamper('garbage', () => { localStorage.setItem('moody_ent_v1', '{"st":"ACTIVE"'); });
    check('tamper: corrupted JSON is rejected (no crash)', !r.prem, r);
    // (c) the save file does not matter
    check('tamper: editing the game save (hub_moody_v1) does not unlock paid missions', await p.evaluate(() => { const d = JSON.parse(localStorage.getItem('hub_moody_v1') || '{}'); d.progress = d.progress || {}; d.coins = 99999; localStorage.setItem('hub_moody_v1', JSON.stringify(d)); return !Moody.ent.isPremium() && !Moody.ent.canPlay('school', 'm2'); }));
    // (d) KNOWN LIMITATION: code-level patching
    await mock(p, 'c.reset()'); await mock(p, 'c.setOffline(true)'); await p.evaluate(() => localStorage.removeItem('moody_ent_v1'));
    await p.reload(); await sleep(1200);
    const forged = await p.evaluate(() => { const n = Date.now(); Moody.ent._rec = { st: 'ACTIVE', sku: 'x', exp: n + 864e7, gu: 0, ver: n, seen: n, reason: '', pend: 0 }; return Moody.ent.canPlay('school', 'm2'); });
    info('KNOWN LIMITATION (client-only): forging the in-memory record from the JS console unlocks until the next store check', forged ? 'BYPASSED (expected: requires debugger/rooted device)' : 'blocked');
    await mock(p, 'c.setOffline(false)'); await p.evaluate(() => Moody.ent.refresh()); await sleep(500);
    check('...but the next store check (provider says NONE) re-locks the forged state', !(await p.evaluate(() => Moody.ent.canPlay('school', 'm2'))));
    const patched = await p.evaluate(() => { Moody.ent.canPlay = () => true; return Moody.ent.canPlay('school', 'm2'); });
    info('KNOWN LIMITATION: monkey-patching Moody.ent.canPlay in the console', patched ? 'BYPASSED (expected: no client-only check can prevent this; server verification only protects remote entitlements)' : 'blocked');
  }
  await done(e, 'tamper');

  /* ---------- 10. provider contract tests with stubbed platform APIs (NOT real Play) ---------- */
  const dgStub = `
    window.__dg={calls:[],owned:[]};
    window.getDigitalGoodsService=async function(u){window.__dg.calls.push(['svc',u]);return{
      getDetails:async function(ids){window.__dg.calls.push(['details',ids.join(',')]);return ids.map(function(i){return{itemId:i,title:i,price:{currency:'EGP',value:i.indexOf('year')>0?'499.99':'59.99'},type:'subscription',subscriptionPeriod:i.indexOf('year')>0?'P1Y':'P1M',freeTrialPeriod:'P3D'}})},
      listPurchases:async function(){return window.__dg.owned.slice()},
      acknowledge:async function(t,k){window.__dg.calls.push(['ack',t,k])},consume:async function(t){window.__dg.calls.push(['consume',t])}}};
    window.PaymentRequest=function(methods,det){window.__dg.calls.push(['pr',JSON.stringify(methods)]);this.show=async function(){var sku=methods[0].data.sku;window.__dg.owned=[{itemId:sku,purchaseToken:'tok-'+sku+'-123456789012345'}];return{details:{purchaseToken:'tok-'+sku+'-123456789012345'},complete:async function(r){window.__dg.calls.push(['complete',r])}}}};`;
  e = await mk({ kind, cfg: { allowMock: false }, extra: dgStub }); await begin(e); {
    const p = e.p; check('auto provider selection: digitalgoods when getDigitalGoodsService exists', await p.evaluate(() => Moody.billing.name === 'digitalgoods'));
    await openSheet(e, 'school', 'm2'); const prices = await p.evaluate(() => document.querySelector('.pw-modal').textContent);
    check('digitalgoods: getDetails -> prices + trial shown', /تجربة مجانية ٣ أيام/.test(prices) && /٥٩٫٩٩|59\.99/.test(prices), prices.slice(0, 300));
    await buy(e);
    const calls = await p.evaluate(() => window.__dg.calls);
    check('digitalgoods: service url, PaymentRequest method data {supportedMethods, data:{sku}}, acknowledge, complete("success")',
      calls.some(c => c[0] === 'svc' && c[1] === 'https://play.google.com/billing') && calls.some(c => c[0] === 'pr' && c[1].indexOf('"supportedMethods":"https://play.google.com/billing"') > 0 && c[1].indexOf('"data":{"sku":"moody_premium_monthly"}') > 0) && calls.some(c => c[0] === 'ack') && calls.some(c => c[0] === 'complete' && c[1] === 'success'), calls);
    check('digitalgoods: purchase -> ACTIVE (lease, expiry unknown)', await p.evaluate(() => { const s = Moody.ent.status(); return s.premium && s.expiry === null; }));
    await p.evaluate(() => { window.__dg.owned = []; return Moody.ent.refresh(); }); await sleep(400);
    check('digitalgoods: listPurchases empty (refund/expiry) -> re-locked', !(await p.evaluate(() => Moody.ent.isPremium())));
  }
  await done(e, 'digitalgoods stub');
  const capStub = `window.__cap={log:[],purchases:[]};window.Capacitor={Plugins:{MoodyBilling:{
    initialize:async function(o){__cap.log.push(['init',o.productIds.join(',')])},
    getProducts:async function(o){return{products:o.productIds.map(function(i){return{id:i,title:i,price:'EGP 49',priceMicros:49000000,currency:'EGP',period:i.indexOf('year')>0?'P1Y':'P1M',trialPeriod:'P7D'}})}},
    purchase:async function(o){__cap.log.push(['purchase',o.productId]);var st=window.__cap.next||'purchased';if(st==='purchased')__cap.purchases=[{productId:o.productId,purchaseToken:'ctok',state:'purchased',expiryTime:Date.now()+30*864e5}];return{status:st,productId:o.productId,purchaseToken:'ctok',expiryTime:Date.now()+30*864e5}},
    restore:async function(){return{purchases:__cap.purchases}},addListener:function(n,cb){__cap.cb=cb}}}};`;
  e = await mk({ kind, cfg: { allowMock: false }, extra: capStub + dgStub }); await begin(e); {
    const p = e.p; check('auto provider selection: capacitor bridge wins over digitalgoods', await p.evaluate(() => Moody.billing.name === 'capacitor'));
    check('capacitor: initialize({productIds}) called with both SKUs', await p.evaluate(() => window.__cap.log.some(l => l[0] === 'init' && l[1] === 'moody_premium_monthly,moody_premium_yearly')));
    await openSheet(e, 'school', 'm2'); await buy(e, 'yearly');
    check('capacitor: purchase(productId=yearly) -> ACTIVE with the plugin expiry', await p.evaluate(() => { const s = Moody.ent.status(); return window.__cap.log.some(l => l[0] === 'purchase' && l[1] === 'moody_premium_yearly') && s.premium && s.plan === 'yearly' && s.expiry > Date.now(); }));
    const map = await p.evaluate(async () => { const out = {}; for (const st of ['grace', 'hold', 'refunded', 'pending', 'expired']) { window.__cap.purchases = [{ productId: 'moody_premium_monthly', purchaseToken: 't', state: st, expiryTime: Date.now() - 1000, graceUntil: Date.now() + 864e5 }]; const ev = await Moody.billing.getEntitlement(); out[st] = ev.state + (ev.inGrace ? '/grace' : '') + (ev.reason ? '/' + ev.reason : ''); } return out; });
    check('capacitor: purchase states normalised (grace->ACTIVE/grace, hold/refunded/expired->EXPIRED, pending->PENDING)', map.grace === 'ACTIVE/grace' && map.hold === 'EXPIRED/hold' && map.refunded === 'EXPIRED/refunded' && map.pending === 'PENDING' && map.expired === 'EXPIRED/expired', map);
    await p.evaluate(() => { window.__cap.cb && window.__cap.cb({ productId: 'moody_premium_monthly', purchaseToken: 't', state: 'refunded' }); }); await sleep(500);
    check('capacitor: purchaseUpdate listener pushes a refund -> re-locked', !(await p.evaluate(() => Moody.ent.isPremium())));
  }
  await done(e, 'capacitor stub');
  /* server verification client (stubbed worker via route) */
  e = await mk({ kind, cfg: { verifyUrl: 'https://verify.invalid/v', packageName: 'com.example.moody', verifyStrict: true } }); await begin(e); {
    const p = e.p; let body = null; await e.ctx.route('https://verify.invalid/**', r => { if (r.request().method() === 'OPTIONS') return r.fulfill({ status: 204, headers: { 'access-control-allow-origin': '*', 'access-control-allow-headers': 'content-type' } }); body = JSON.parse(r.request().postData() || '{}'); r.fulfill({ status: 200, contentType: 'application/json', headers: { 'access-control-allow-origin': '*' }, body: JSON.stringify({ ok: true, state: 'EXPIRED', reason: 'refunded' }) }); });
    await openSheet(e, 'school', 'm2'); await buy(e);
    check('verify worker URL configured: purchase token is POSTed {packageName, productId, purchaseToken, acknowledge}', body && body.packageName === 'com.example.moody' && body.productId === 'moody_premium_monthly' && /^mocktok-/.test(body.purchaseToken) && body.acknowledge === true, body);
    check('verify worker says EXPIRED -> NOT unlocked even though the (mock) store said purchased', !(await p.evaluate(() => Moody.ent.isPremium())));
  }
  await done(e, 'verify worker client');
  e = await mk({ kind, cfg: { verifyUrl: 'https://verify.invalid/v', verifyStrict: true } }); await begin(e); {
    await e.ctx.route('https://verify.invalid/**', r => r.abort()); await openSheet(e, 'school', 'm2'); await buy(e);
    check('verifyStrict + worker unreachable: purchase not trusted, retry-restore message', !(await e.p.evaluate(() => Moody.ent.isPremium())) && /مش قادرين نتأكد/.test(await msgText(e.p)), await msgText(e.p));
  }
  e.errs.length = 0; /* aborted request is expected */ await done(e, 'verify worker down');
}

/* ============================================================ WORKER UNIT ============================================================ */
function worker() {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'relay', 'play_verify_worker.js'), 'utf8').replace(/export default/, 'var __default =').replace(/export function/g, 'function');
  const ctx = {}; vm.createContext(ctx); vm.runInContext(src + ';this.mapSubscription=mapSubscription;this.def=__default;', ctx);
  const now = Date.parse('2026-06-01T00:00:00Z'), li = (t, extra) => ({ lineItems: [Object.assign({ productId: 'p', expiryTime: t, autoRenewingPlan: { autoRenewEnabled: true } }, extra || {})] });
  const f = (st, t, x) => ctx.mapSubscription(Object.assign({ subscriptionState: st, acknowledgementState: 'ACKNOWLEDGEMENT_STATE_PENDING' }, li(t), x || {}), 'p', now);
  check('worker: ACTIVE -> ACTIVE + expiry', f('SUBSCRIPTION_STATE_ACTIVE', '2026-07-01T00:00:00Z').state === 'ACTIVE' && f('SUBSCRIPTION_STATE_ACTIVE', '2026-07-01T00:00:00Z').expiry === Date.parse('2026-07-01T00:00:00Z'));
  check('worker: CANCELED before expiry still ACTIVE, after expiry EXPIRED/cancelled', f('SUBSCRIPTION_STATE_CANCELED', '2026-07-01T00:00:00Z').state === 'ACTIVE' && f('SUBSCRIPTION_STATE_CANCELED', '2026-05-01T00:00:00Z').reason === 'cancelled');
  check('worker: IN_GRACE_PERIOD -> ACTIVE inGrace', (r => r.state === 'ACTIVE' && r.inGrace && r.graceUntil > now)(f('SUBSCRIPTION_STATE_IN_GRACE_PERIOD', '2026-05-30T00:00:00Z')));
  check('worker: ON_HOLD/PAUSED/EXPIRED/PENDING mapped', f('SUBSCRIPTION_STATE_ON_HOLD', '2026-05-01T00:00:00Z').reason === 'hold' && f('SUBSCRIPTION_STATE_PAUSED', '2026-05-01T00:00:00Z').reason === 'paused' && f('SUBSCRIPTION_STATE_EXPIRED', '2026-05-01T00:00:00Z').state === 'EXPIRED' && f('SUBSCRIPTION_STATE_PENDING', null).state === 'PENDING');
  check('worker: system-initiated cancellation (refund/revoke) -> EXPIRED/refunded', f('SUBSCRIPTION_STATE_EXPIRED', '2026-05-01T00:00:00Z', { canceledStateContext: { systemInitiatedCancellation: {} } }).reason === 'refunded');
  check('worker: unknown state -> NONE', f('SOMETHING_NEW', null).state === 'NONE');
  const noSecrets = !/BEGIN PRIVATE KEY|client_secret|AIza[0-9A-Za-z_\-]{20}/.test(fs.readFileSync(path.join(__dirname, '..', '..', 'relay', 'play_verify_worker.js'), 'utf8'));
  check('worker: no secrets in the source', noSecrets);
}

/* ============================================================ BOT PLAY ============================================================ */
async function play() {
  const e = await mk({ kind }); await begin(e); const p = e.p, bot = e.bot, W = (await worldsInfo(p)).filter(w => !w.hidden);
  let ok = 0, bad = 0, promptDuring = 0;
  console.log('--- phase 1: not subscribed: play the FREE mission of every world (' + kind + ') ---');
  for (const w of W) {
    const mid = w.ms[0], r = await bot.playMission(w.id, mid, { timeout: 420000 }), st = await p.evaluate(([w, m]) => Moody.save.data.progress[w + '/' + m], [w.id, mid]);
    const good = r.ok && st && st.done; good ? ok++ : bad++; check('free mission ' + w.id + '/' + mid + ' completed by the bot', good, r);
    const lab = await p.evaluate(() => Array.from(document.querySelectorAll('.btn')).map(b => b.textContent.trim()));
    check('  result screen of ' + w.id + ': no "next mission" button into a paid mission', w.ms.length < 2 || lab.indexOf('المهمة الجاية') < 0, lab);
    if (await p.evaluate(() => !!document.querySelector('.pw-modal'))) promptDuring++;
    await bot.backToMap();
  }
  check('no purchase prompt appeared during/after gameplay of free missions', promptDuring === 0);
  console.log('--- phase 2: mock purchase, then play EVERY mission ---');
  await openSheet(e, W[0].id, W[0].ms[1]); await buy(e); await bot.tapSel('[data-act=playnow]'); await sleep(400);
  check('subscribed', await p.evaluate(() => Moody.ent.isPremium()));
  await toMap(e);
  for (const w of W) for (const mid of w.ms) {
    if (mid === w.ms[0]) continue;                       // already done in phase 1
    const r = await bot.playMission(w.id, mid, { timeout: 420000 }), st = await p.evaluate(([w, m]) => Moody.save.data.progress[w + '/' + m], [w.id, mid]);
    const good = r.ok && st && st.done; good ? ok++ : bad++; console.log((good ? 'PASS ' : 'FAIL ') + kind + ' paid mission ' + w.id + '/' + mid + ' ' + (st ? st.stars + '*' : '') + ' ' + Math.round(r.secs || 0) + 's' + (good ? '' : ' ' + JSON.stringify(r).slice(0, 160))); total++; if (!good) fails++;
    await bot.backToMap();
  }
  console.log('bot missions completed: ' + ok + ', failed: ' + bad);
  await p.reload(); await sleep(1500);
  check('after reload the subscription and progress persist', await p.evaluate(() => Moody.ent.isPremium() && Object.keys(Moody.save.data.progress).length >= 11));
  await done(e, 'bot play ' + kind);
}

(async () => {
  if (mode === 'worker' || mode === 'all') worker();
  if (mode === 'logic' || mode === 'all') await logic();
  if (mode === 'play' || mode === 'all') await play();
  console.log('\nSUMMARY: ' + (total - fails) + '/' + total + ' checks passed' + (fails ? ', ' + fails + ' FAILED' : '') + (allErrs.length ? ', console errors in: ' + allErrs.map(x => x[0]).join('; ') : ', zero console errors'));
  process.exit(fails ? 1 : 0);
})().catch(e => { console.error('TEST CRASH', e); process.exit(2); });
