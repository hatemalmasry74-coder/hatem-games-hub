#!/usr/bin/env node
/* Runner rule checks (hero abilities, power-ups, obstacle kinds, assist): node tools/runner_unit.js
   Each case starts an empty track (coins only), injects ONE obstacle / item through Moody.runner.objs and sends real key events. Prints PASS / FAIL per case. */
const { launch, sleep } = require('./botlib.js'); const PORT = process.env.PORT || 8841;
(async () => {
  const env = await launch({ kind: 'desk', url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1' }), p = env.p, bot = env.bot; await bot.startGame(); await sleep(300);
  await p.evaluate(() => { Moody.registerWorld({ id: 'tst', order: 50, title: 't', icon: 'home', heroes: ['moody', 'aboody'], control: ['moody', 'aboody', 'toota', 'nemo'], missions: [{ id: 'a', title: 't', intro: 'x', hideTitle: true, async run(ctx) { window.__res = await ctx.games.runner3d({ theme: 'market', length: 0, seed: 1, prompt: 't', plan: [{ rest: 6 }] }); return ctx.nav.complete(); } }] }); });
  let fails = 0; const ok = (name, c, info) => { if (!c) fails++; console.log(c ? 'PASS' : 'FAIL', name, info == null ? '' : JSON.stringify(info)); };
  const start = async (hero, assist) => {
    await p.evaluate(a => { Moody.save.data.settings.runAssist = a; Moody.flow.startMission('tst', 0); }, !!assist); await sleep(1800);
    await p.click('.rn-card[data-hero="' + hero + '"]'); await sleep(150); await p.click('#rn-start');
    for (let i = 0; i < 80; i++) { if (await p.evaluate(() => Moody.runner.cur && Moody.runner.cur.phase === 'run')) break; await sleep(100); }
    await p.evaluate(() => { const S = Moody.runner.cur; Moody.runner.objs.length = 0; Moody.runner.objs.push({ k: 'e', z: 400, lane: 0 }); S.L = 390; });
  };
  const add = (e) => p.evaluate(e => { const S = Moody.runner.cur, R = Moody.runner; if (e.k === 'o') { e.def = R.obst[e.def]; e.hit = 0; e.anim = 0; } e.z += S.z; R.objs.push(e); R.objs.sort((a, b) => a.z - b.z); }, e);
  const st = () => p.evaluate(() => { const S = Moody.runner.cur; return { coll: S.collisions, coins: S.coins, stumble: S.stumble, shield: S.shield, boost: S.boost, magnet: S.magnet, y: S.y, z: S.z, v: S.v, x: S.x, auto: S.autoDodged || 0 }; });
  const untilZ = async z => { for (let i = 0; i < 600; i++) { if ((await st()).z >= z) return; await sleep(8); } };
  const waitZ = async dz => { const z0 = (await st()).z; for (let i = 0; i < 200; i++) { if ((await st()).z > z0 + dz) return; await sleep(50); } };
  /* 1 cone, no input -> stumble, loses coins (never game over) */
  await start('moody'); await p.evaluate(() => { Moody.runner.cur.coins = 5; }); await add({ k: 'o', z: 14, lane: 0, def: 'cone' }); await waitZ(18); let s = await st(); ok('stumble: cone hit = 1 collision, <=3 coins lost, slow-down, still playing', s.coll === 1 && s.coins === 2 && s.z > 0, s);
  /* 2 cone + jump -> clean */
  await start('moody'); await add({ k: 'o', z: 14, lane: 0, def: 'cone' }); { const z0 = (await st()).z; await untilZ(z0 + 14 - 3.3); } await p.keyboard.press('ArrowUp'); await waitZ(10); s = await st(); ok('jump clears a cone', s.coll === 0, s);
  /* 3 moody smashes a light box without stumbling; aboody does not */
  await start('moody'); await add({ k: 'o', z: 12, lane: 0, def: 'box' }); await waitZ(16); s = await st(); ok('moody smashes a light box (no collision, +1 coin)', s.coll === 0 && s.coins >= 1, s);
  await start('aboody'); await add({ k: 'o', z: 12, lane: 0, def: 'box' }); await waitZ(16); s = await st(); ok('aboody cannot smash it (1 collision)', s.coll === 1, s);
  /* 4 wall (cart): toota double-jumps over it, moody cannot */
  await start('toota'); await add({ k: 'o', z: 20, lane: 0, def: 'cart' }); { const z0 = (await st()).z; await untilZ(z0 + 20 - 5.2); } await p.keyboard.press('ArrowUp'); await sleep(200); await p.keyboard.press('ArrowUp'); await waitZ(10); s = await st(); ok('toota double-jump clears a tall cart', s.coll === 0, s);
  await start('moody'); await add({ k: 'o', z: 20, lane: 0, def: 'cart' }); { const z0 = (await st()).z; await untilZ(z0 + 20 - 4.4); } await p.keyboard.press('ArrowUp'); await waitZ(10); s = await st(); ok('moody single jump does NOT clear a tall cart', s.coll === 1, s);
  /* 5 bar: roll under it */
  await start('moody'); await add({ k: 'o', z: 16, lane: 0, def: 'bar' }); { const z0 = (await st()).z; await untilZ(z0 + 16 - 3.2); } await p.keyboard.press('ArrowDown'); await waitZ(10); s = await st(); ok('roll passes under a bar', s.coll === 0, s);
  await start('moody'); await add({ k: 'o', z: 16, lane: 0, def: 'bar' }); await waitZ(20); s = await st(); ok('standing hero hits a bar', s.coll === 1, s);
  /* 6 shield absorbs one hit, rocket ignores obstacles, magnet pulls coins from the next lane */
  await start('moody'); await p.evaluate(() => { Moody.runner.cur.shield = 10; }); await add({ k: 'o', z: 14, lane: 0, def: 'cone' }); await waitZ(18); s = await st(); ok('shield absorbs the hit (0 collisions, shield used)', s.coll === 0 && s.shield <= 0, s);
  await start('moody'); await p.evaluate(() => { Moody.runner.cur.boost = 4; }); await add({ k: 'o', z: 14, lane: 0, def: 'cart' }); await waitZ(22); s = await st(); ok('rocket flies through a cart (0 collisions)', s.coll === 0, s);
  await start('moody'); await p.evaluate(() => { Moody.runner.cur.magnet = 6; }); await add({ k: 'c', z: 10, lane: 1, h: .45, got: false, mz: 0, mx: 1 }); await p.evaluate(() => { const R = Moody.runner; const c = R.objs.find(e => e.k === 'c' && e.lane === 1); c.mz = c.z; }); await waitZ(14); s = await st(); ok('magnet collects a coin from the next lane', s.coins >= 1, s);
  /* 7 nemo's wider magnet radius collects the neighbouring lane without the power-up */
  await start('nemo'); await add({ k: 'c', z: 10, lane: 1, h: .45, got: false, mz: 0, mx: 1 }); await p.evaluate(() => { const c = Moody.runner.objs.find(e => e.k === 'c' && e.lane === 1); c.mz = c.z; }); await waitZ(14); s = await st(); ok('nemo collects a neighbouring-lane coin', s.coins >= 1, s);
  await start('moody'); await add({ k: 'c', z: 10, lane: 1, h: .45, got: false, mz: 0, mx: 1 }); await p.evaluate(() => { const c = Moody.runner.objs.find(e => e.k === 'c' && e.lane === 1); c.mz = c.z; }); await waitZ(14); s = await st(); ok('moody does not (needs a lane change)', s.coins === 0, s);
  /* 8 assist: automatic sidestep before a wall */
  await start('aboody', true); await add({ k: 'o', z: 22, lane: 0, def: 'cart' }); await waitZ(30); s = await st(); ok('assist ON: auto-sidestep avoids a wall (0 collisions)', s.coll === 0 && s.auto >= 1, s);
  await start('aboody', false); await add({ k: 'o', z: 22, lane: 0, def: 'cart' }); await waitZ(30); s = await st(); ok('assist OFF: no auto-sidestep (1 collision)', s.coll === 1, s);
  /* 9 lane limits: pressing left 3x stays on lane -1 */
  await start('moody'); for (let i = 0; i < 3; i++) { await p.keyboard.press('ArrowLeft'); await sleep(120); } s = await st(); ok('lane clamps at the left edge', Math.round(s.x) === -1, s);
  /* 10 WASD + Space keys */
  await start('moody'); await p.keyboard.press('d'); await sleep(400); let x1 = (await st()).x; await p.keyboard.press('Space'); await sleep(140); s = await st(); ok('D = right lane, Space = jump', Math.round(x1) === 1 && s.y > .1, { x1, y: s.y });
  console.log('FAILS', fails, 'ERRORS', JSON.stringify(env.errs.slice(0, 6))); await env.b.close(); process.exit(fails ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
