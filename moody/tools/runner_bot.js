/* Moody & Aboody - tools/runner_bot.js : the kid-bot handler for the 3-lane runner kit (Moody.scene.dbg.kit === 'runner3d').
   Plays with REAL input: keyboard events on desk, CDP touch swipes on phones (10px+ swipes, the same gestures a child makes).
   Use:  const { runnerHandler } = require('./runner_bot.js');   bot.play({ custom: { runner3d: runnerHandler(env, {wrongFirst, hero, assist}) } })
   dbg published by the kit: { phase:'pick|count|run|finish', lane (target -1..1), x, air, rolling, speed, z, L, goalPct, nextObstacle:{lane,type,dist,h}, obstacles:[...],
                               gates:[{dist, tries, lanes:[{lane,correct,text,dead}]}], itemAhead:{kind:'p|i',lane,dist}, coins, stars, collisions, parts, partsNeeded } */
const sleep = ms => new Promise(r => setTimeout(r, ms));
function runnerHandler(env, o) {
  o = o || {}; const p = env.p, touch = env.kind !== 'desk'; let cdp = null, rect = null, rectT = 0; const done = new Set(); let wrongDone = 0, lastKey = 0, laneAt = 0, log = o.log || (() => { });
  const stats = { jumps: 0, rolls: 0, lanes: 0, swipes: 0, lastPhase: '', gatesSeen: 0 };
  async function cdpS() { if (!cdp) cdp = await env.ctx.newCDPSession(p); return cdp; }
  async function getRect() { const n = Date.now(); if (!rect || n - rectT > 800) { rect = await p.evaluate(() => { const r = document.getElementById('c').getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; }); rectT = n; } return rect; }
  async function swipe(dir) {
    stats.swipes++; const r = await getRect(), X = 480, Y = 330, D = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] }[dir], len = 70;
    const px = (x, y) => [r[0] + x * r[2] / 960, r[1] + y * r[3] / 540], a = px(X, Y), m = px(X + D[0] * len * .5, Y + D[1] * len * .5), b = px(X + D[0] * len, Y + D[1] * len), s = await cdpS();
    const tp = (t, pt) => s.send('Input.dispatchTouchEvent', { type: t, touchPoints: t === 'touchEnd' ? [] : [{ x: pt[0], y: pt[1], id: 1 }] });
    await tp('touchStart', a); await tp('touchMove', m); await tp('touchMove', b); await tp('touchEnd', b);
  }
  async function act(a) {
    if (touch) { await swipe({ left: 'left', right: 'right', jump: 'up', roll: 'down' }[a]); }
    else { await p.keyboard.press({ left: o.wasd ? 'a' : 'ArrowLeft', right: o.wasd ? 'd' : 'ArrowRight', jump: o.wasd ? 'w' : (o.space ? 'Space' : 'ArrowUp'), roll: o.wasd ? 's' : 'ArrowDown' }[a]); }
    if (a === 'jump') stats.jumps++; else if (a === 'roll') stats.rolls++; else stats.lanes++;
  }
  const dbgNow = () => p.evaluate(() => { const d = window.Moody.scene && window.Moody.scene.dbg; return d && d.kit === 'runner3d' ? JSON.parse(JSON.stringify(d)) : null; });
  /* lane planner (like a kid reading the road): rows of blocking obstacles ('tall') + the gate row; dynamic programming over lanes (<=1 lane change per row);
     returns the lane to head for NOW (we only start moving when the next constrained row is close enough) */
  function bestLane(d) {
    const v = d.speed || 9, rows = [], rowAt = z => { for (const r of rows) if (Math.abs(r.dist - z) < 2.2) return r; const r = { dist: z, blocked: [false, false, false], bonus: [0, 0, 0] }; rows.push(r); return r; };
    for (const ob of d.obstacles) if (ob.type === 'tall') { const r = rowAt(ob.dist); r.blocked[ob.lane + 1] = true; r.wall = true; }
    const g = d.gates[0];
    if (g && g.dist < 75) { const r = rowAt(g.dist); const want = [0, 1, 2].map(i => { const ln = g.lanes[i]; let w = ln && ln.correct && !ln.dead; if (o.wrongFirst && g.tries === 0 && !done.has('wfdone')) w = ln && !ln.correct && !ln.dead; if (g.tries > 0) done.add('wfdone'); return !!w; }); const pick = want.indexOf(true); for (let i = 0; i < 3; i++) if (i !== (pick < 0 ? 1 : pick)) r.blocked[i] = true; r.gate = true; r.wall = true; }
    else if (d.itemAhead && d.itemAhead.dist < 40 && (d.itemAhead.kind === 'p' || o.items)) { const r = rowAt(d.itemAhead.dist); r.bonus[d.itemAhead.lane + 1] = 6; }
    if (o.coins !== false && d.coinsAhead) for (const c of d.coinsAhead) { if (c.dist < 4) continue; const r = rowAt(Math.round(c.dist / 2.2) * 2.2); r.bonus[c.lane + 1] += (o.coinW == null ? .75 : o.coinW); }
    rows.sort((a, b) => a.dist - b.dist);
    // DP
    const INF = 1e9, n = rows.length; let cost = [INF, INF, INF]; cost[d.lane + 1] = 0; const par = [];
    for (let k = 0; k < n; k++) { const nc = [INF, INF, INF], pr = [0, 0, 0]; for (let l = 0; l < 3; l++) { if (rows[k].blocked[l]) continue; for (let q = Math.max(0, l - 1); q <= Math.min(2, l + 1); q++) { const c = cost[q] + Math.abs(l - q) * 2.0 - rows[k].bonus[l]; if (c < nc[l]) { nc[l] = c; pr[l] = q; } } } cost = nc; par.push(pr); }
    if (!n) return d.lane; let bl = 0; for (let l = 1; l < 3; l++) if (cost[l] < cost[bl]) bl = l; if (cost[bl] >= INF) return d.lane;
    const path = new Array(n); for (let k = n - 1; k >= 0; k--) { path[k] = bl; bl = par[k][bl]; }
    for (let k = 0; k < n; k++) { if (path[k] !== d.lane + 1) { if (rows.slice(0, k).some(r => r.wall && r.dist > -1.4)) return d.lane; /* still inside the previous row's window: change lanes only AFTER passing it */ const act = rows[k].dist < (rows[k].gate ? 60 : rows[k].wall ? 8 + v * .9 : 14); return act ? d.lane + Math.sign(path[k] - 1 - d.lane) : d.lane; } }
    return d.lane;
  }
  return async function handler(ctxo) {
    const t0 = Date.now(); let d = await dbgNow(); if (!d) { await sleep(100); return; }
    if (d.phase === 'pick') {
      if (o.hero) await ctxo.tapSel('.rn-card[data-hero="' + o.hero + '"]'); await sleep(300);
      if (o.assist != null) { const want = !!o.assist, txt = await p.evaluate(() => (document.querySelector('.rn-assist') || {}).textContent || ''); if ((txt.indexOf('شغّالة') >= 0) !== want) await ctxo.tapSel('.rn-assist'); }
      await sleep(250); await ctxo.tapSel('#rn-start'); await sleep(500); return;
    }
    // fast inner loop (~40 Hz) while the runner is alive
    while (Date.now() - t0 < 5000) {
      d = await dbgNow(); if (!d || d.phase === 'done') return; stats.lastPhase = d.phase;
      if (o.debugHits && d.collisions > (stats.coll || 0)) { stats.coll = d.collisions; log('  RING ' + JSON.stringify(stats.ring)); log('  HIT#' + d.collisions + ' prev=' + JSON.stringify(stats.prev ? { z: +stats.prev.z.toFixed(1), lane: stats.prev.lane, x: +stats.prev.x.toFixed(2), air: +stats.prev.air.toFixed(2), roll: stats.prev.rolling, v: +stats.prev.speed.toFixed(1), obs: stats.prev.obstacles.slice(0, 3).map(q => [q.lane, q.type, +q.dist.toFixed(1)]) } : null)); }
      stats.prev = d;
      if (d.phase === 'count') { await sleep(60); continue; }
      const now = Date.now(), v = d.speed || 9, air = d.air > .04 || d.rolling, lead = touch ? 1.0 : 0;   // swipes take longer than key presses
      // ---- lane
      const want = bestLane(d); if (o.debugHits) { (stats.ring = stats.ring || []).push([Date.now() % 100000, +d.z.toFixed(1), d.lane, +d.x.toFixed(2), want, d.obstacles.slice(0, 3).map(q => q.lane + q.type[0] + q.dist.toFixed(1)).join(',')]); if (stats.ring.length > 14) stats.ring.shift(); }
      if (want !== d.lane && now - laneAt > 120) { await act(want > d.lane ? 'right' : 'left'); laneAt = Date.now();  }
      // ---- jump / roll for obstacles in my lane
      if (!air || d.air < .05) {
        for (const ob of d.obstacles) {
          if (ob.lane !== d.lane || ob.dist < 0) continue; const key = Math.round(d.z + ob.dist);
          if (ob.type === 'bar') { if (!done.has('b' + key) && ob.dist < v * .27 + .9 + lead) { done.add('b' + key); await act('roll'); break; } }
          else if (ob.type === 'low') { if (!done.has('j' + key) && ob.dist < v * .33 + .5 + lead && !(env.heroSmash && ob.smash && o.smash)) { done.add('j' + key); await act('jump'); break; } }
          else if (ob.type === 'tall' && ob.dist < 3.5 && !done.has('t' + key)) { done.add('t' + key); await act('jump'); break; }
        }
      }
      if (d.phase === 'finish' && d.speed < .2) { await sleep(120); return; }
      await sleep(12);
    }
  };
}
module.exports = { runnerHandler };
