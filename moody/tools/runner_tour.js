#!/usr/bin/env node
/* Runner visual tour: node tools/runner_tour.js [desk|phone] [r1,r2,r3] [hero]
   Starts each runner mission, teleports the hero along the track (Moody.runner.cur = the kit state) and takes screenshots of every phase:
   picker, countdown, run (several z), gate approach, checkpoint, finish and the ending scene.  Output: $SHOTS/tour_<kind>_<mission>_<tag>.png */
const { launch, sleep } = require('./botlib.js');
const SH = process.env.SHOTS || '/tmp/claude-0/-home-user/53a3c7d8-c487-5827-a402-36d70899f068/scratchpad/shots/tour/';
require('fs').mkdirSync(SH, { recursive: true });
const kind = process.argv[2] || 'desk', only = (process.argv[3] || 'r1,r2,r3').split(','), hero = process.argv[4] || 'moody', PORT = process.env.PORT || 8841;
(async () => {
  const env = await launch({ kind, url: 'http://localhost:' + PORT + '/moody/index.html?unlock=1' }), p = env.p, bot = env.bot;
  await bot.startGame(); await sleep(400);
  for (const mid of only) {
    let step = 0, t0 = 0; const tag = n => SH + 'tour_' + kind + '_' + mid + '_' + n + '.png';
    const tp = async z => p.evaluate(z => { const S = Moody.runner.cur; if (!S) return; S.z = z; Moody.runner.objs.forEach(e => { if ((e.k === 'g' || e.k === 'f') && e.z < z - 2) { e.done = true; e.got = true; } }); S.t = Math.max(S.t, 30); }, z);
    const info = () => p.evaluate(() => { const S = Moody.runner.cur, g = Moody.runner.objs.filter(e => e.k === 'g' && !e.done).map(e => e.z), f = Moody.runner.objs.filter(e => e.k === 'f' && !e.got).map(e => e.z); return S ? { z: S.z, L: S.L, gates: g, cps: f } : null; });
    const custom = {
      runner3d: async ({ d, tapSel }) => {
        if (d.phase === 'pick') { await tapSel('.rn-card[data-hero="' + hero + '"]'); await sleep(400); await bot.shot(tag('1_pick')); await tapSel('#rn-start'); await sleep(900); await bot.shot(tag('2_count')); await sleep(3300); return; }
        if (d.phase === 'run' && step === 0) {
          step = 1; const I = await info();
          await sleep(1800); await bot.shot(tag('3_run0'));
          await tp(80); await sleep(900); await bot.shot(tag('4_run80'));
          await tp(I.gates[0] - 46); await sleep(1500); await bot.shot(tag('5_gate_far'));
          await sleep(1800); await bot.shot(tag('6_gate_near'));
          await sleep(1500); await bot.shot(tag('7_gate_pass'));
          const I2 = await info(); if (I2.cps[0]) { await tp(I2.cps[0] - 20); await sleep(1800); await bot.shot(tag('8_checkpoint')); await sleep(900); await bot.shot(tag('8b_checkpoint2')); }
          await p.evaluate(() => { const S = Moody.runner.cur; S.boost = 4; S.magnet = 5; S.shield = 6; }); await sleep(900); await bot.shot(tag('9_powerups'));
          await tp(I.L - 55); await sleep(2500); await bot.shot(tag('10_final_approach')); await sleep(2500); await bot.shot(tag('11_goal')); await sleep(2800); await bot.shot(tag('12_cheer'));
        }
      }
    };
    const iv = setInterval(() => { if (step === 1) bot.shot(tag('z_' + (++t0))); }, 6000);
    const r = await bot.playMission('runs', mid, { custom, timeout: 240000 });
    clearInterval(iv); console.log(kind, mid, r.ok ? 'OK' : 'FAIL', JSON.stringify(r).slice(0, 200)); await bot.backToMap();
  }
  console.log('ERRORS', JSON.stringify(env.errs.slice(0, 8))); await env.b.close();
})().catch(e => { console.error(e); process.exit(2); });
