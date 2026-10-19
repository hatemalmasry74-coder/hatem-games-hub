/* Moody & Aboody - engine/runner.js : "سباق المغامرة" - 3-lane pseudo-3D endless-style runner KIT (ctx.games.runner3d, also ctx.games.runner({theme|plan|length|runner3d:true}))
   POSITIVE goals only: the child runs TO deliver / rescue / arrive.  Nothing chases the hero; a collision is only a funny stumble (<= 3 coins fall, short slow-down, "oops"), never game over.
   Loaded AFTER engine/minigames.js + engine/ctx.js (and engine/runner_hero.js): index.html script tags (or Moody.load).  It adds Moody.kits.runner3d (alias run3) and WRAPS Moody.kits.runner:
   calls with theme / plan / length / runner3d:true start this kit, every other call (distance / obstacles / bg ...) still runs the OLD side-scrolling kit unchanged.

   await ctx.games.runner({
     theme:'market' | themeObject,          // Moody.runner.registerTheme(id,{sky,glow,ground,road,walk,fog,layers,side,gap,obst,goal}) - see worlds/runs_art.js
     length:1000,                           // metres (minimum; the plan may be longer)          speed:[8.8,13.4] m/s start..max   ramp:80 (s to reach max)
     plan:[ {chunks:2,tier:1}, {gate:'quiz',tag:'runs_n',cat:[..]}, {gate:'manners',tag:'runs_street'}, {item:'magnet|shield|rocket|rand'}, {star:true}, {part:true},
            {checkpoint:'text',who:'mama'}, {rest:2} ],     // chunks = hand-authored patterns (Moody.runner.chunks, validated: always a safe path + fair, see R.validate/R.fair)
     goal:{ art, emptyArt, who:'nana', give:'run_bread', icon, label, sz },   // landmark at the finish, the character who runs out to meet the hero, the thing handed over, progress-bar icon
     carry:'art', part:{art,n:3,label,say,sz},  prompt, prompt2, pick:true|false, hero, seed, say:{start:[who,text], finish:[who,text]}, payout:false, maxTime
   }) -> { stars (star pickups), coins, coinsTotal, distance, collisions, lostCoins, gates:{total,correct,firstTry,misses}, parts, partsNeeded, hero, time, assist, autoDodged, bonusCoins, jumps, rolls, laneChanges }
   (the kit itself pays  ctx.reward.coins(min(24, coins/5)); the mission decides the 3 stars from the result - see worlds/runs.js)

   HEROES (Moody.runner.heroes): moody = strong: smashes light boxes (smash obstacles) | aboody = small: shorter jump (0.8), longer roll (0.9 s), faster lane change
                                 toota = gentle DOUBLE JUMP (clears tall carts) | nemo = wider coin-magnet radius (also grabs the neighbouring lane's coins)
   CONTROLS: swipe left/right (lane), up (jump), down (roll) - ONE swipe = ONE action, threshold 10 css px; tap = jump; keys arrows / A D / W S / Space; gamepad stick, d-pad, A/B; pause button of the game.
   ASSIST MODE (settings.runAssist; default ON when the hero is <= 7 years old, toggle in the hero picker): slower speed ramp (-10% top speed), smaller hit boxes (forgiveness), jump clearance -20%,
                 automatic sidestep before a tall blocker when the child did not change lane for 0.55 s (counted in result.autoDodged).
   OBSTACLES (Moody.runner.defObst): low (jump; h = height) | tall (change lane; only toota's double jump clears) | bar (roll under) ; smash:true = Moody breaks it.
   QUIZ LANES: at each {gate} the road splits into 3 gates (question from Moody.banks by tag/cat, tier by the hero's age via Moody.tierFor); wrong gate = gentle "try again" (hint, a dead board, the same
               question comes back after an easy coin stretch; 3rd miss highlights the right board), never a penalty.  'manners' gates are the same with the polite/safe action.
   DEBUG (bots): Moody.scene.dbg = { kit:'runner3d', phase:'pick|count|run|finish', lane, x, air, rolling, speed, z, L, goalPct, nextObstacle:{lane,type,dist,h}, obstacles:[..], gates:[{dist,tries,lanes:[{lane,correct,text,dead}]}],
               coinsAhead:[..], itemAhead, coins, stars, collisions, parts, partsNeeded, assist }   Moody.runner.cur = live state (tests), Moody.runner.last = last result, Moody.runner.skip = profiling switches.
   Rendering: pseudo-3D projection p = 1/(1+d/7.2); everything is blitted from cached painted sprites (cropped + mip levels); road = batched polygons; no per-frame allocation in the hot loops; fixed 60 Hz logic.  */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, U = M.util, A = M.art, UI = M.ui, FX = M.fx, K = M.kits, h = UI.h, C = M.chars;
  const W = 960, H = 540, HZ = 176, FY = 468, LW = 150, DD = 7.2, CX = 480, UH = 118;
  const R = M.runner = { themes: {}, obst: {}, version: 1, skip: {} };

  /* ============================================================ hero abilities (documented in DEV notes) */
  const HEROES = {
    moody: { vy: 0, hmax: 1.0, jt: .62, roll: .62, rate: 13, mag: .55, smash: true, dbl: false, say: 'أنا قوي! بكسّر الصناديق الخفيفة!', desc: 'قوي: بيكسّر الصناديق الخفيفة' },
    aboody: { hmax: .8, jt: .56, roll: .9, rate: 20, mag: .55, smash: false, dbl: false, say: 'أنا صغير وسريع! بتزحلق تحت أي حاجة!', desc: 'صغير: بيتزحلق بسهولة وبيغيّر الحارة بسرعة' },
    toota: { hmax: 1.0, jt: .62, roll: .62, rate: 13, mag: .55, smash: false, dbl: true, say: 'أنا بنط نطّتين ورا بعض في الهوا!', desc: 'بتنط نطّتين في الهوا' },
    nemo: { hmax: 1.0, jt: .62, roll: .62, rate: 13, mag: 1.15, smash: false, dbl: false, say: 'أنا مغناطيس العملات بتاعي أوسع!', desc: 'مغناطيس العملات عندها أوسع' }
  };
  Object.keys(HEROES).forEach(k => { const o = HEROES[k]; o.vy = 4 * o.hmax / o.jt; o.g = 8 * o.hmax / (o.jt * o.jt); });
  R.heroes = HEROES;

  /* ============================================================ obstacle kinds (theme.obst maps the pattern letters to these) */
  /* type: low (jump over, h = height) | tall (needs a lane change; only a double-jump clears it) | bar (roll under) ; smash = Moody breaks it */
  R.defObst = (name, def) => { R.obst[name] = Object.assign({ type: 'low', h: .5, sz: 110, dz: .9, art: name }, def); };
  R.defObst('cone', { art: 'cone', h: .5, sz: 100, dz: .7 });
  R.defObst('box', { art: 'blocks', h: .66, sz: 130, dz: 1, smash: true });
  R.defObst('ball', { art: 'ball', h: .4, sz: 90, dz: .7 });
  R.defObst('puddle', { art: 'rn_puddle', h: .1, sz: 150, dz: 1.3, splash: true, sfx: 'splash' });
  R.defObst('bar', { art: 'rn_bar', type: 'bar', h: .62, sz: 200, dz: .8 });
  R.defObst('cart', { art: 'rn_cart', type: 'tall', h: 1.3, sz: 190, dz: 1.2 });
  /* theme: see header + worlds/runs_art.js.  Missing parts fall back to the generic theme below */
  R.registerTheme = (id, t) => { t.id = id; R.themes[id] = t; };
  /* ============================================================ hand-authored pattern chunks (rows of 3 lanes, left..right; always a safe path - validated at load)
     . empty   J low obstacle (jump)   j low obstacle + coin arc over it   S smash box (jump or Moody smashes)   P puddle (jump)
     W wall (change lane)   B bar (roll)   c coin trail   a coin arc (no obstacle)   * big star */
  const CH = {
    1: [['...', '.j.', '...', 'c.c', '...'], ['...', 'S..', '.c.', '..J', '.c.', '...'], ['...', 'P.P', '.c.', '...', '.B.', '...'], ['...', 'JJJ', '...', 'ccc', '...'],
    ['...', '..S', '...', '.j.', '...', 'S..', '...'], ['...', 'W..', '.c.', '...', '..W', '..c', '...'], ['...', '.B.', '...', 'j.j', '...', '.P.', '...'], ['...', 'ccc', '...', 'c.c', '.c.', '...'],
    ['...', '.W.', 'c.c', '...', '.J.', 'c.c', '...'], ['...', 'J..', '.a.', '..J', '.a.', '...']],
    2: [['...', 'W.W', '...', '.J.', '...', '.W.', 'J..', '...'], ['...', 'J.J', '.W.', 'J.J', '...'], ['...', '.B.', '..W', '...', 'W..', '.B.', '...'], ['...', 'S.W', '.c.', 'W.S', '.c.', '...'],
    ['...', 'JJ.', '..W', '.B.', 'W..', '...'], ['...', '.P.', 'W.W', '.j.', 'P.P', '...'], ['...', 'B.B', '...', '.W.', 'c.c', 'W.W', '...'], ['...', 'J..', 'JW.', '..J', '.W.', '...']],
    s: [['...', 'W..', '.W.', '..W', '.W.', 'W..', '...'], ['...', '..W', '.W.', 'W..', '.W.', '..W', 'J..', '...'], ['...', 'W.W', '.W.', 'W.W', '.W.', '...']],
    t: [['...', 'BBB', 'BBB', 'BBB', '...'], ['...', 'BBB', 'ccc', 'BBB', 'BBB', '...']],
    3: [['...', 'W..', 'WW.', '..B', '...', 'W.W', '.j.', '...'], ['...', '.W.', 'J.J', '.B.', 'W.W', '.j.', '...'], ['...', 'S..', '.W.', 'B..', '..W', 'J.J', '...'], ['...', 'W.W', '.B.', 'JJJ', 'W..', 'W.W', '...']]
  };
  CH.s.forEach(c => { c.step = 6.6; }); CH.t.forEach(c => { c.step = 4.6; });   // slalom (lane changes only) and tunnels (roll under 3 bars in a row)
  R.chunks = CH;
  R.validate = function () {   // every chunk must have a path with <=1 lane change per row that avoids walls
    const bad = []; for (const t in CH) CH[t].forEach((ch, i) => { let reach = [1, 1, 1]; ch.forEach(row => { const nr = [0, 0, 0]; for (let l = 0; l < 3; l++) { if (row[l] === 'W') continue; if (reach[l] || (l > 0 && reach[l - 1]) || (l < 2 && reach[l + 1])) nr[l] = 1; } reach = nr; }); if (!reach[0] && !reach[1] && !reach[2]) bad.push(t + ':' + i); if (ch[0] !== '...' || ch[ch.length - 1] !== '...') bad.push(t + ':' + i + ' ends'); }); return bad;
  };
  /* fairness: from EVERY free lane of a wall row the next wall row must be reachable with one lane change (no "traps" that need foresight) */
  R.fair = function () {
    const bad = []; for (const t in CH) CH[t].forEach((ch, i) => { for (let k = 0; k + 1 < ch.length; k++) { const a = ch[k], b = ch[k + 1]; if (a.indexOf('W') < 0 && b.indexOf('W') < 0) continue; for (let l = 0; l < 3; l++) { if (a[l] === 'W') continue; let ok = false; for (let m = Math.max(0, l - 1); m <= Math.min(2, l + 1); m++) if (b[m] !== 'W') ok = true; if (!ok) bad.push(t + ':' + i + '@' + k); } } }); return bad;
  };
  try { const bad = R.validate().concat(R.fair()); if (bad.length) console.error('runner: unsafe/unfair chunks', bad); } catch (e) { }

  /* ============================================================ small art set for the generic theme (world art files add their own) */
  A.registerAll({
    rn_puddle(g) { G.ell(g, 0, 40, 46, 11, '#7ec8ee', 3); G.ell(g, -8, 38, 24, 5, '#b9e6ff', 0); g.save(); g.globalAlpha = .7; G.ell(g, 14, 40, 8, 2.6, '#fff', 0); g.restore(); },
    rn_bar(g) { G.fillRR(g, -46, -4, 8, 54, 3, '#a8adbb', 3); G.fillRR(g, 38, -4, 8, 54, 3, '#a8adbb', 3); G.fillRR(g, -50, -6, 100, 18, 5, '#ff6f91', 3.5); g.save(); G.rr(g, -50, -6, 100, 18, 5); g.clip(); for (let i = 0; i < 5; i++) G.poly(g, [[-44 + i * 24, -6], [-30 + i * 24, -6], [-40 + i * 24, 12], [-54 + i * 24, 12]], '#fff', 0); g.restore(); },
    rn_cart(g) { G.fillRR(g, -44, -8, 88, 44, 6, '#c8935a', 3.5); G.fillRR(g, -44, -8, 88, 12, 5, '#e3b27a', 3); G.line(g, -44, 4, -56, -20, 4); G.circ(g, -26, 42, 8, '#555', 3); G.circ(g, 26, 42, 8, '#555', 3); A.draw(g, 'apple', -14, -18, 28); A.draw(g, 'orange', 14, -18, 28); },
    rn_tree(g) { G.fillRR(g, -7, 6, 14, 44, 3, '#8a5a3a', 3); G.circ(g, 0, -14, 32, '#5cc96b', 3.5); G.circ(g, -20, 0, 20, '#4fb85f', 3); G.circ(g, 20, 0, 20, '#4fb85f', 3); G.circ(g, -6, -22, 12, '#86e08f', 0); },
    rn_bush(g) { G.circ(g, -16, 32, 18, '#4fb85f', 3); G.circ(g, 14, 30, 20, '#5cc96b', 3); G.circ(g, 0, 22, 22, '#6fd37a', 3); },
    rn_lamp(g) { G.fillRR(g, -3, -34, 6, 84, 2, '#6b6f7d', 3); G.fillRR(g, -3, -38, 28, 6, 3, '#6b6f7d', 2.5); G.circ(g, 22, -30, 8, '#ffe27a', 2.5); },
    rn_flag(g) { G.fillRR(g, -3, -44, 6, 94, 2, '#d0d4de', 3); G.poly(g, [[3, -44], [40, -34], [3, -22]], '#ef5350', 3); }
  });
  R.registerTheme('generic', {
    sky: ['#7fc4f2', '#bfe3fa', '#fff1d6'], ground: ['#8cc46a', '#68a64f'], road: { a: '#7b8096', b: '#5b6075', line: '#ffe9a0', edge: '#fff7e3' }, walk: { a: '#e6dcc4', b: '#cdbf9f', curb: '#f7f1e2' }, fog: '#e9f4ff',
    layers: [{ k: .12, h: 120, draw(c, w, hh) { G.hills(c, 0, w, hh, 80, '#9fcf9a', 3, '#bfe3b4'); } }, { k: .3, h: 90, draw(c, w, hh) { G.hills(c, 0, w, hh, 55, '#7fc07a', 7, '#9ad494'); } }],
    side: [{ art: 'rn_tree', sz: 210, w: 3, lat: [2.6, 4.2] }, { art: 'rn_bush', sz: 120, w: 2, lat: [2.3, 3.2] }, { art: 'rn_lamp', sz: 190, w: 1, lat: [1.95, 2.1] }], gap: [6, 10],
    obst: { J: ['cone', 'ball'], S: ['box'], W: ['cart'], B: ['bar'], P: ['puddle'] }, goal: { art: 'rn_flag', sz: 220, lat: 0 }
  });

  /* ============================================================ helpers */
  const clamp = U.clamp, lerp = U.lerp, TAU = Math.PI * 2;
  const mulberry = a => () => { a |= 0; a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  /* painted prop sprites: baked once through Moody.art.sprite, then CROPPED to their opaque bounds and given mip levels (1, 1/2, 1/4, 1/8):
     scenery is drawn at 5-100% of its size, so small copies are blitted for far objects (much cheaper than minifying a big bitmap every frame) */
  const SPR = {};
  function spr(name, ref) {
    const key = name + '|' + ref; let s = SPR[key]; if (s !== undefined) return s; s = null;
    try {
      const sp = A.sprite(name, ref); if (sp) {
        const c = sp.c, W0 = c.width, H0 = c.height, x = c.getContext('2d'); let x0 = 0, y0 = 0, x1 = W0 - 1, y1 = H0 - 1;
        try { const d = x.getImageData(0, 0, W0, H0).data; x0 = W0; y0 = H0; x1 = -1; y1 = -1; for (let yy = 0; yy < H0; yy++) { const row = yy * W0 * 4; for (let xx = 0; xx < W0; xx++) if (d[row + xx * 4 + 3] > 6) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (yy < y0) y0 = yy; if (yy > y1) y1 = yy; } } if (x1 < 0) { x0 = 0; y0 = 0; x1 = W0 - 1; y1 = H0 - 1; } } catch (e) { }
        const bw = x1 - x0 + 1, bh = y1 - y0 + 1, t = G.mkCanvas(bw, bh); t.getContext('2d').drawImage(c, x0, y0, bw, bh, 0, 0, bw, bh); const r = sp.w / W0;
        s = { lods: [t], bw, bh, lx: x0 * r - sp.hx, ly: y0 * r - sp.hy, lw: bw * r, lh: bh * r };
      }
    } catch (e) { }
    SPR[key] = s; return s;
  }
  function lodOf(s, lv) { while (s.lods.length <= lv) { const p = s.lods[s.lods.length - 1], t = G.mkCanvas(Math.max(1, Math.ceil(p.width / 2)), Math.max(1, Math.ceil(p.height / 2))), x = t.getContext('2d'); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(p, 0, 0, t.width, t.height); s.lods.push(t); } return s.lods[lv]; }
  let KQ = 1;
  function blitArt(g, name, ref, cx, baseY, size) {
    const s = spr(name, ref); if (!s) return; const k = size / ref, dw = s.lw * k, dh = s.lh * k, want = s.bw / Math.max(1, dw * KQ); let lv = 0; if (want >= 2) lv = want >= 8 ? 3 : want >= 4 ? 2 : 1;
    g.drawImage(lv ? lodOf(s, lv) : s.lods[0], cx + s.lx * k, baseY - ref * .5 * k + s.ly * k, dw, dh);
  }
  const TXT = {};
  function txtCv(str, size, col, stroke) {   // cached RTL text sprite (for banners / labels)
    const key = str + '|' + size + '|' + col + '|' + stroke; let c = TXT[key]; if (c) return c;
    const m = document.createElement('canvas').getContext('2d'); m.font = 'bold ' + size + 'px ' + M.FONT; const w = Math.ceil(m.measureText(str).width) + 20;
    c = G.mkCanvas(w, size * 1.6); const x = c.getContext('2d'); x.direction = 'rtl'; G.text(x, str, w / 2, c.height / 2, { size, color: col, stroke: stroke || M.OL, sw: Math.max(4, size * .2) }); TXT[key] = c; return c;
  }
  function wrapLines(x, text, maxW) { const words = String(text).split(' '), out = []; let cur = ''; words.forEach(w => { const t = cur ? cur + ' ' + w : w; if (x.measureText(t).width > maxW && cur) { out.push(cur); cur = w; } else cur = t; }); if (cur) out.push(cur); return out; }

  /* coin frames (rotating coin) + big star + power-up badges: baked once */
  let COIN = null, STARC = null; const PU = {};
  function bakeCoin() {
    COIN = []; for (let i = 0; i < 12; i++) { const c = G.mkCanvas(64, 64), x = c.getContext('2d'), a = Math.abs(Math.cos(i / 12 * Math.PI)), rx = Math.max(3, 24 * a);
      x.translate(32, 32); x.fillStyle = '#b8710c'; x.beginPath(); x.ellipse(2.5 * (1 - a), 2.5, rx, 24, 0, 0, TAU); x.fill();
      const gr = x.createLinearGradient(-rx, -24, rx, 24); gr.addColorStop(0, '#fff2a0'); gr.addColorStop(.45, '#ffcd2e'); gr.addColorStop(1, '#e8960f'); x.fillStyle = gr; x.beginPath(); x.ellipse(0, 0, rx, 24, 0, 0, TAU); x.fill(); x.lineWidth = 2.4; x.strokeStyle = '#b8710c'; x.stroke();
      if (a > .35) { x.lineWidth = 2.6; x.strokeStyle = 'rgba(214,140,10,.9)'; x.beginPath(); x.ellipse(0, 0, rx * .68, 16.5, 0, 0, TAU); x.stroke(); x.fillStyle = 'rgba(255,248,200,.95)'; G.starPath(x, 0, 1, 9 * Math.min(1, a * 1.2)); x.fill(); } COIN.push(c); }
    STARC = G.mkCanvas(96, 96); const x = STARC.getContext('2d'); x.translate(48, 50); const pp = G.paint; G.paint = true; G.star(x, 0, 0, 40, '#ffcf2e', 4); G.paint = pp; x.fillStyle = 'rgba(255,255,255,.7)'; x.beginPath(); x.ellipse(-12, -18, 6, 3, -.6, 0, TAU); x.fill();
  }
  function bakePU(kind) {
    const c = G.mkCanvas(96, 96), x = c.getContext('2d'); x.translate(48, 48); const col = { magnet: '#ef5350', shield: '#4a8dff', rocket: '#ff8a2a' }[kind];
    const gl = G.glowSprite({ magnet: '255,120,110', shield: '120,170,255', rocket: '255,170,80' }[kind]); x.globalAlpha = .9; x.drawImage(gl, -48, -48, 96, 96); x.globalAlpha = 1;
    x.beginPath(); x.arc(0, 0, 33, 0, TAU); const gr = x.createLinearGradient(0, -33, 0, 33); gr.addColorStop(0, G.shade(col, .35)); gr.addColorStop(1, G.shade(col, -.15)); x.fillStyle = gr; x.fill(); x.lineWidth = 4; x.strokeStyle = '#fff'; x.stroke();
    x.lineCap = 'round'; x.lineJoin = 'round';
    if (kind === 'magnet') { x.lineWidth = 11; x.strokeStyle = '#fff'; x.beginPath(); x.arc(0, -2, 14, Math.PI, 0); x.lineTo(14, 14); x.moveTo(-14, -2); x.lineTo(-14, 14); x.stroke(); x.lineWidth = 11; x.strokeStyle = '#d9dee8'; x.beginPath(); x.moveTo(-14, 10); x.lineTo(-14, 17); x.moveTo(14, 10); x.lineTo(14, 17); x.stroke(); }
    else if (kind === 'shield') { x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, -20); x.lineTo(17, -13); x.quadraticCurveTo(17, 10, 0, 21); x.quadraticCurveTo(-17, 10, -17, -13); x.closePath(); x.fill(); x.fillStyle = '#4a8dff'; G.starPath(x, 0, 0, 10); x.fill(); }
    else { x.save(); x.rotate(.6); x.fillStyle = '#fff'; x.beginPath(); x.moveTo(0, -24); x.quadraticCurveTo(12, -8, 9, 14); x.lineTo(-9, 14); x.quadraticCurveTo(-12, -8, 0, -24); x.fill(); x.fillStyle = '#ef5350'; x.beginPath(); x.moveTo(0, -24); x.quadraticCurveTo(7, -17, 8, -9); x.lineTo(-8, -9); x.quadraticCurveTo(-7, -17, 0, -24); x.fill(); x.fillStyle = '#ffd23c'; x.beginPath(); x.moveTo(-5, 15); x.lineTo(0, 27); x.lineTo(5, 15); x.fill(); x.restore(); }
    PU[kind] = c; return c;
  }
  let CLD = null;
  function bakeClouds() {
    CLD = []; for (let v = 0; v < 3; v++) {
      const c = G.mkCanvas(240, 110), x = c.getContext('2d'), P = [[60, 62, 30], [98, 48, 38], [140, 58, 32], [100, 66, 34], [36, 70, 20], [176, 68, 22]]; if (v) P.push([80 + v * 24, 40, 26 - v * 3]);
      P.forEach(q => { const gr = x.createRadialGradient(q[0] - 6, q[1] - 10, 2, q[0], q[1], q[2]); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.7, 'rgba(250,252,255,.97)'); gr.addColorStop(1, 'rgba(226,238,252,.95)'); x.fillStyle = gr; x.beginPath(); x.arc(q[0], q[1], q[2], 0, TAU); x.fill(); });
      x.globalCompositeOperation = 'destination-in'; const m = x.createLinearGradient(0, 56, 0, 100); m.addColorStop(0, 'rgba(0,0,0,1)'); m.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = m; x.fillRect(0, 0, 240, 110); CLD.push(c);
    }
  }
  /* every string the kit can SPEAK by itself (for tools/collect_voice.js): [text, speaker] - hero lines exist for the 4 playable heroes */
  const HINTS = ['أوبس! ولا يهمّك', 'معلش! كمّل يا بطل', 'ههه! مفيش مشكلة!', 'أنا قوي!', 'قريب! جرّب تاني', 'برافو!', 'ممتاز!', 'شاطر أوي!', 'جاهزين؟ يلا نجري!', 'جبنا قطعة!'];
  R.voiceStrings = function () { const out = []; Object.keys(HEROES).forEach(k => { out.push([HEROES[k].say, k]); HINTS.forEach(t => out.push([t, k])); Object.keys(PU_SAY).forEach(p => out.push([PU_SAY[p], k])); }); ['كمّل جري!', 'الإجابة هنا! خدها المرة دي', 'اسحب شمال أو يمين', 'اسحب لفوق عشان تنط', 'اسحب لتحت عشان تتزحلق', 'اختار البطل بتاعك واضغط يلا نجري', 'اجري للهدف!'].forEach(t => out.push([t, 'narrator'])); return out; };
  let PADC = null;
  function bakePad() { PADC = G.mkCanvas(128, 64); const x = PADC.getContext('2d'); x.drawImage(G.glowSprite('255,210,80'), 0, -30, 128, 128); [0, 1, 2].forEach(i => { x.beginPath(); x.moveTo(20, 46 - i * 14); x.lineTo(64, 24 - i * 14); x.lineTo(108, 46 - i * 14); x.lineTo(108, 56 - i * 14); x.lineTo(64, 34 - i * 14); x.lineTo(20, 56 - i * 14); x.closePath(); x.fillStyle = ['#ffe14d', '#ffc02a', '#ff9a1a'][i]; x.fill(); x.lineWidth = 2; x.strokeStyle = '#b86a08'; x.stroke(); }); }
  const PU_KEYS = ['magnet', 'shield', 'rocket'], PU_MAX = [7, 10, 4.2], LANE_TINT = ['rgba(255,138,42,.22)', 'rgba(31,181,166,.22)', 'rgba(138,107,214,.22)'];
  const PU_NAME = { magnet: 'مغناطيس', shield: 'درع', rocket: 'صاروخ' };
  const PU_SAY = { magnet: 'مغناطيس! العملات بتيجي لوحدها', shield: 'درع! محدّش يقدر يوقّعك', rocket: 'صاروخ! طيّر يا بطل' };

  /* ============================================================ audio: synthesized sfx + a tiny looping music (all through M.audio.tone / noise) */
  const AU = R.audio = {
    sfx(n, a) {
      const T = M.audio.tone, N = M.audio.noise; M.audio.init();
      switch (n) {
        case 'jump': T(300, .17, 'sine', .22, 760); N(.1, .05, 900, 2400); break;
        case 'dbl': T(520, .16, 'sine', .2, 1100); T(780, .12, 'triangle', .12, 1500, .08); break;
        case 'land': T(130, .09, 'sine', .16, 60); break;
        case 'lane': N(.13, .08, 700, 2200); break;
        case 'roll': N(.34, .1, 2000, 380); T(220, .3, 'sine', .08, 120); break;
        case 'coin': { const p = 1 + Math.min(10, a || 0) * .035; T(988 * p, .08, 'square', .09); T(1319 * p, .17, 'square', .09, 0, .06); break; }
        case 'star': M.audio.sfx('star'); break;
        case 'oops': T(920, .38, 'triangle', .17, 210); T(150, .14, 'square', .16, 70, .34); T(330, .12, 'sine', .12, 520, .46); N(.12, .08, 400, 150, .33); break;
        case 'smash': N(.22, .2, 2600, 500); T(180, .12, 'square', .14, 70); T(660, .1, 'triangle', .1, 880, .05); break;
        case 'gate': [659, 784, 988, 1319].forEach((f, i) => T(f, .2, 'triangle', .2, 0, i * .075)); N(.3, .04, 6000, 9000, .2); break;
        case 'gate_no': T(392, .2, 'sine', .15, 330); T(330, .26, 'sine', .14, 262, .16); break;
        case 'power': [523, 659, 784, 1047, 1319].forEach((f, i) => T(f, .14, 'square', .08, 0, i * .05)); N(.3, .05, 5000, 9000, .15); break;
        case 'pop': T(700, .1, 'sine', .2, 220); N(.18, .12, 3000, 900); break;
        case 'rocket': N(.9, .12, 300, 2400); T(110, .7, 'sawtooth', .08, 360); break;
        case 'check': M.audio.sfx('bell'); T(1568, .3, 'sine', .1, 0, .12); break;
        case 'beep': T(a ? 784 : 523, a ? .34 : .16, 'square', .1); break;
        case 'win': M.audio.sfx('fanfare'); break;
        case 'step': { const k = a || 'hard'; if (k === 'sand') N(.07, .03, 500, 280); else if (k === 'grass') N(.05, .026, 800, 400); else if (k === 'tile') { T(170, .035, 'sine', .05, 120); N(.03, .025, 2600, 1800); } else N(.04, .035, 1600, 800); break; }
        case 'pad': [392, 523, 659, 784].forEach((f, i) => T(f, .1, 'sawtooth', .07, 0, i * .04)); N(.35, .09, 800, 4000); break;
        case 'theme': [523, 659, 784].forEach((f, i) => T(f, .18, 'triangle', .12, 0, i * .08)); N(.4, .06, 1200, 5000); break;
        case 'baa': T(480, .14, 'sawtooth', .07, 400); T(430, .14, 'sawtooth', .07, 380, .13); T(400, .3, 'sawtooth', .06, 300, .26); break;
        default: M.audio.sfx(n);
      }
    }
  };
  /* light synthesized loops, one flavour per theme (theme.music = key of MUS) */
  const MUS = {
    bounce: { bpm: 126, bass: [131, 131, 196, 175, 147, 147, 220, 196], mel: [523, 587, 659, 784, 880, 784, 659, 587], w: 'square' },
    calm: { bpm: 104, bass: [110, 110, 165, 147, 131, 131, 196, 165], mel: [440, 494, 523, 659, 587, 523, 494, 440], w: 'sine' },
    sea: { bpm: 112, bass: [147, 147, 220, 196, 165, 165, 247, 220], mel: [587, 659, 740, 880, 740, 659, 587, 523], w: 'triangle' },
    sport: { bpm: 140, bass: [147, 196, 147, 220, 165, 220, 165, 247], mel: [659, 784, 880, 988, 880, 784, 659, 784], w: 'square' },
    night: { bpm: 96, bass: [98, 98, 147, 131, 110, 110, 165, 147], mel: [392, 466, 523, 587, 523, 466, 392, 349], w: 'sine' },
    epic: { bpm: 132, bass: [110, 110, 165, 131, 123, 123, 185, 147], mel: [440, 523, 659, 880, 784, 659, 523, 659], w: 'sawtooth' }
  };
  R.music = MUS;
  function startMusic(S, getName) {
    let n = 0, iv = null, cur = null; const P = () => MUS[getName()] || MUS.bounce, rate = () => 60000 / (P().bpm * (S.boost > 0 ? 1.18 : 1 + Math.min(.12, S.t / 700)));
    function tick() {
      if (M.paused || S.phase === 'pick' || S.phase === 'done' || !M.audio.on()) return; const T = M.audio.tone, m = P(), w = m.w;
      T(m.bass[n % 8] * (n % 2 ? 1 : .5) * 2, .2, 'triangle', .07);
      if (n % 2 === 1) T(m.mel[(n * 3 + (n >> 3)) % 8], .16, w, w === 'sine' ? .05 : .028, 0, 0);
      if (n % 4 === 2) T(m.mel[(n + 2) % 8] * 1.5, .22, 'sine', .035, 0, .1);
      n++; if (n % 8 === 0 || cur !== m) { cur = m; clearInterval(iv); iv = setInterval(tick, rate()); }
    }
    iv = setInterval(tick, rate()); return () => clearInterval(iv);
  }

  /* ============================================================ CSS for the hero picker (the only DOM of the kit) */
  (function css() {
    if (document.getElementById('rn-css')) return; const s = document.createElement('style'); s.id = 'rn-css';
    s.textContent = '.rnpick{position:absolute;left:54px;right:54px;top:92px;pointer-events:auto;padding:14px 18px 16px;text-align:center;animation:popin .4s var(--spring,ease)}' +
      '.rnpick .rn-t{font-size:34px;font-weight:900;color:var(--ink,#3a2a1e);margin:0 0 10px}.rn-cards{display:flex;gap:12px;justify-content:center}' +
      '.rn-card{all:unset;box-sizing:border-box;cursor:pointer;width:196px;padding:10px 8px 10px;border-radius:22px;background:linear-gradient(180deg,#fff,#fff4dc);border:4px solid #e9d7b0;box-shadow:0 6px 0 #d9c293,0 10px 18px rgba(60,30,10,.18);text-align:center;transition:transform .15s}' +
      '.rn-card:focus-visible{outline:4px solid #4a8dff}.rn-card.on{border-color:#ff8a2a;background:linear-gradient(180deg,#fffbe8,#ffe6a8);transform:translateY(-6px) scale(1.04);box-shadow:0 8px 0 #e49a2c,0 14px 22px rgba(60,30,10,.25)}' +
      '.rn-card img,.rn-card canvas{width:78px;height:78px;border-radius:50%;border:4px solid #fff;box-shadow:0 3px 8px rgba(0,0,0,.25);object-fit:cover;display:block;margin:0 auto 4px}.rn-card b{display:block;font-size:26px;color:var(--ink,#3a2a1e)}' +
      '.rn-card small{display:block;font-size:17px;line-height:1.25;color:#6a4a2a;margin-top:3px;min-height:44px}.rn-row{display:flex;gap:16px;justify-content:center;align-items:center;margin-top:12px}' +
      '.rnsum{position:absolute;left:150px;right:150px;top:120px;padding:14px 18px 18px;text-align:center;pointer-events:auto;animation:popin .4s var(--spring,ease);z-index:30}.rn-chips{display:flex;gap:10px;justify-content:center;flex-wrap:wrap}.rn-chip{background:#fff6dc;border:3px solid #e9d7b0;border-radius:18px;padding:8px 14px;min-width:120px}.rn-chip small{display:block;font-size:17px;color:#6a4a2a}.rn-chip b{font-size:30px;color:#3a2a1e}.rn-rec{position:absolute;top:-10px;left:-6px;background:#ff8a2a;color:#fff;border-radius:12px;padding:1px 8px;font-size:15px;font-style:normal;border:2px solid #fff}.rn-card{position:relative}' +
      '.rn-assist{font-size:20px}.rn-note{font-size:17px;color:#6a4a2a;margin-top:6px}';
    document.head.appendChild(s);
  })();

  /* ============================================================ the kit */
  function runner3d(ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o);
    const mergeTheme = t => Object.assign({}, R.themes.generic, typeof t === 'string' ? R.themes[t] : (t || {}));
    let T = mergeTheme(o.theme);
    ctx.heroes('hidden'); UI.hud.showSwitch(false);
    const oldBg = st.bg; let rng = mulberry(o.seed != null ? o.seed : (Math.random() * 1e9) | 0);
    const rn = (a, b) => a + rng() * (b - a), pickR = a => a[Math.floor(rng() * a.length)];
    if (!COIN) bakeCoin();
    const kq = () => M.cv.width / 960;
    const heroIds = (st.control && st.control.length ? st.control : ['moody']).filter(k => HEROES[k]); if (!heroIds.length) heroIds.push('moody');
    const S = {
      phase: 'pick', hero: heroIds.indexOf(st.active) >= 0 ? st.active : heroIds[0], assist: false, t: 0, z: 0, v: 0, L: o.length || 1000, lane: 0, tx: 0, x: 0, y: 0, vy: 0, dbl: 0, dblT: 0, roll: 0, rollQ: false, jbuf: 0, stumble: 0, inv: 0, boost: 0, boostK: 0, ally: null, allyLat: 2, pad: 0, zone: false, sway: 0, lastStep: 0, flash2: 0, magnet: 0, shield: 0,
      coins: 0, stars: 0, collisions: 0, parts: 0, combo: 0, ph: 0, cam: 0, lwK: 1, countT: 0, finT: 0, laneT: 9, jumps: 0, rolls: 0, laneChanges: 0, gates: { total: 0, correct: 0, firstTry: 0, misses: 0 }, banner: null, bannerT: 0, bubble: null, bubT: 0, hint: null, shake: 0, flash: 0, skipDrawn: 0, spawnedParts: 0, lostTotal: 0
    };
    R.cur = S; cl(() => { if (R.cur === S) R.cur = null; });
    const objs = [], scen = [], gatesL = []; R.objs = objs; let iLo = 0, scZ = 0, sI = 0, curGate = null, nParts = o.part ? (o.part.n || 3) : 0, started = false, finished = false, fintimer = 0, tutor = { lane: 0, jump: 0, roll: 0, done: {}, spoke: {} };
    const dust = []; for (let i = 0; i < 26; i++) dust.push({ a: 0, x: 0, y: 0, r: 0, vx: 0, vy: 0 });
    const flyCoins = []; for (let i = 0; i < 16; i++) flyCoins.push({ a: 0, x: 0, y: 0, vx: 0, vy: 0, t: 0 });
    const hint = (str, who, ms) => { S.bubble = { who: who || S.hero, str, cv: txtCv(str, 24, '#3a2a1e', '#fff') }; S.bubT = ms || 2.4; M.voice.speak(str, { speaker: who || S.hero, soft: true }); };
    const banner = (str, col, t) => { S.banner = txtCv(str, 44, col || '#fff', M.OL); S.bannerT = t || 1.4; };

    /* ---------------------------------------------------------------- backdrop (sky + far layers + ground) baked once */
    let BG = null, BGK = 0, LAY = [];
    function bakeBG() {
      const k = kq(); BGK = k; const c = G.mkCanvas(W * k, H * k), x = c.getContext('2d'); x.scale(k, k); x.lineJoin = 'round'; x.lineCap = 'round';
      x.fillStyle = G.lin(x, 0, 0, 0, HZ + 6, T.sky); x.fillRect(0, 0, W, HZ + 6);
      const gl = T.glow || { x: .74, y: .78, col: '255,238,190', r: 1 }; G.glowAt(x, W * gl.x, HZ * gl.y, 260 * gl.r, gl.col, .9);
      if (T.sun !== false) { G.glowAt(x, W * (gl.x), HZ * (gl.y - .2), 90, gl.col, .9); }
      x.fillStyle = G.lin(x, 0, HZ, 0, H, [T.ground[0], T.ground[1]]); x.fillRect(0, HZ, W, H - HZ);
      if (T.stars) { const r = G.rand(11); x.fillStyle = '#fff'; for (let i = 0; i < T.stars; i++) { x.globalAlpha = .4 + r() * .6; x.beginPath(); x.arc(r() * W, r() * (HZ - 20), .8 + r() * 1.6, 0, TAU); x.fill(); } x.globalAlpha = 1; if (T.moon) { x.fillStyle = '#fff7d0'; x.beginPath(); x.arc(W * T.moon, 70, 26, 0, TAU); x.fill(); x.fillStyle = T.sky[0]; x.beginPath(); x.arc(W * T.moon + 11, 64, 22, 0, TAU); x.fill(); } }
      LAY = []; (T.layers || []).forEach(L => { const w = W + 140, hh = L.h, lc = G.mkCanvas(w * k, hh * k), lx = lc.getContext('2d'); lx.scale(k, k); lx.lineJoin = 'round'; const pp = G.paint; L.draw(lx, w, hh, G.rand ? G.rand(7) : Math.random); G.paint = pp; LAY.push({ c: lc, k: L.k, h: hh, w, y: L.y != null ? L.y : HZ - hh + 4, v: L.v || 0 }); });
      BG = c;
      // haze band at the horizon
      x.fillStyle = G.lin(x, 0, HZ - 30, 0, HZ + 46, ['rgba(255,255,255,0)', T.fog || '#eaf3ff', 'rgba(255,255,255,0)']); x.globalAlpha = .55; x.fillRect(0, HZ - 30, W, 76); x.globalAlpha = 1;
    }
    let roadGr = null, walkGr = null, haze = null;

    /* ---------------------------------------------------------------- track generation */
    let OBS = Object.assign({}, R.themes.generic.obst, T.obst || {}); const GOAL = Object.assign({}, T.goal || {}, o.goal || {});
    function addObj(e) { objs.push(e); return e; }
    function coinAt(lane, z, hgt) { addObj({ k: 'c', z, lane, h: hgt || .45, got: false, mz: z, mx: lane }); }
    function placeRow(row, z, tier) {
      for (let l = 0; l < 3; l++) {
        const ch = row[l], lane = l - 1; if (ch === '.') continue;
        if (ch === 'c') { for (let i = -1; i <= 1; i++) coinAt(lane, z + i * 2.3); }
        else if (ch === 'a') { for (let i = -2; i <= 2; i++) coinAt(lane, z + i * 1.7, .5 + (1 - Math.abs(i) / 2) * .8); }
        else if (ch === '*') addObj({ k: 's', z, lane, h: .55, got: false });
        else {
          const key = ch === 'j' ? 'J' : ch, names = OBS[key] || OBS.J, nm = pickR(names), def = R.obst[nm] || (typeof nm === 'object' ? nm : R.obst.cone);
          addObj({ k: 'o', z, lane, def, hit: 0, anim: 0, ch });
          if (ch === 'j') for (let i = -1; i <= 1; i++) coinAt(lane, z + i * 1.6, 1.25 - Math.abs(i) * .22);
        }
      }
    }
    function chunkAt(z, tier) { const pool = CH[typeof tier === 'string' ? tier : clamp(tier, 1, 3)], ch = pickR(pool), step = ch.step || (tier >= 3 ? 6.5 : 7); ch.forEach(row => { placeRow(row, z, tier); z += step; }); return z; }
    function restAt(z, n) { for (let i = 0; i < n; i++) { const lane = Math.floor(rng() * 3) - 1; for (let j = -1; j <= 1; j++) coinAt(lane, z + j * 2.2); z += 7; } return z; }
    function pickGateQuestion(entry) {
      if (entry.q) return entry.q; const tier = (o.tier) || M.tierFor(S.hero), cat = entry.cat, tag = entry.tag;
      let qs = M.pickQuestions({ tier, cat, n: 8, tag, exclude: S.usedQ }).filter(q => q.choices && q.choices.length >= 3 && String(q.q).length < 120); if (!qs.length) qs = M.pickQuestions({ tier, cat, n: 4, tag });
      const q = qs[0]; if (q) S.usedQ.push(q.id); return q;
    }
    S.usedQ = [];
    function makeGate(z, entry, q, tries, dead) {
      const ch = q.choices.map((c, i) => ({ i, text: typeof c === 'string' ? c : c.text, art: typeof c === 'string' ? null : c.art, correct: i === q.answer }));
      let pick = ch.filter(c => c.correct).concat(U.shuffle(ch.filter(c => !c.correct))).slice(0, 3); while (pick.length < 3) pick.push(Object.assign({}, pick[pick.length - 1], { dup: true }));
      const order = U.shuffle(pick.map((c, i) => i)), ans = [0, 1, 2].map(l => pick[order[l]]);
      const g = { k: 'g', z, q, kind: entry.gate || 'quiz', entry, ans, tries: tries || 0, dead: dead || [false, false, false], done: false, boards: [], announced: false, hl: false };
      addObj(g); gatesL.push(g); return g;
    }
    function build() {
      OBS = Object.assign({}, R.themes.generic.obst, T.obst || {}); objs.length = 0; gatesL.length = 0; let z = 22; const plan = o.plan || autoPlan(); S.gates.total = 0;
      plan.forEach(e => {
        if (e.chunks) { for (let i = 0; i < e.chunks; i++) z = chunkAt(z, e.tier || 1); }
        else if (e.rest) z = restAt(z, e.rest);
        else if (e.gate) { z = restAt(z, 1); const q = pickGateQuestion(e); if (q) { const g = makeGate(z + 14, e, q); S.gates.total++; z += 14 + 12; z = restAt(z, 1); } }
        else if (e.item) { const kind = e.item === 'rand' ? pickR(['magnet', 'shield', 'rocket']) : e.item; addObj({ k: 'i', z: z + 6, lane: Math.floor(rng() * 3) - 1, kind, got: false }); z += 12; for (let i = 0; i < 3; i++) coinAt(0, z + i * 2.2); z += 8; }
        else if (e.star) { addObj({ k: 's', z: z + 5, lane: Math.floor(rng() * 3) - 1, h: .6, got: false }); z += 12; }
        else if (e.part) { addObj({ k: 'p', z: z + 6, lane: Math.floor(rng() * 3) - 1, got: false, idx: 0 }); z += 8; for (let i = 0; i < 3; i++) coinAt(0, z + i * 2.2); z += 8; }
        else if (e.pattern) { for (let i = 0; i < (e.n || 1); i++) z = chunkAt(z, e.pattern); }
        else if (e.shape) { const P = e.shape === 'arrow' ? [[0, 0], [0, 1.6], [0, 3.2], [-1, 3.4], [-.5, 4.6], [0, 6], [.5, 4.6], [1, 3.4]] : [[0, 0], [-.7, 1.6], [.7, 1.6], [0, 3.2], [-1, 3.6], [1, 3.6], [0, 5], [-.7, 6.4], [.7, 6.4]]; const sc = e.shape === 'arrow' ? 1 : .8; P.forEach(q => coinAt(q[0] * sc, z + 2 + q[1], .45)); z += 12; }
        else if (e.pad) { addObj({ k: 'b', z: z + 4, lane: Math.floor(rng() * 3) - 1, got: false }); z += 9; }
        else if (e.burst) { addObj({ k: 'u', z, on: true, got: false, label: e.label }); for (let i = 0; i < e.burst; i++) z = chunkAt(z, e.tier || 2); addObj({ k: 'u', z, on: false, got: false }); z += 6; }
        else if (e.theme) { addObj({ k: 't', z: z + 2, theme: e.theme, label: e.label, got: false }); const nt = mergeTheme(e.theme); OBS = Object.assign({}, R.themes.generic.obst, nt.obst || {}); z += 8; }
        else if (e.checkpoint) { addObj({ k: 'f', z: z + 6, text: e.checkpoint, who: e.who, got: false, pct: 0 }); z = restAt(z + 10, 1); }
      });
      while (z < (o.length || 0) - 30) z = chunkAt(z, o.fillTier || 2);
      z += 10; S.L = Math.max(o.length || 0, z); addObj({ k: 'e', z: S.L + 6, lane: 0 }); S.L0 = S.L; S.coinsTotal = 0; for (const e of objs) if (e.k === 'c') S.coinsTotal++; dbg.coinsTotal = S.coinsTotal;
      objs.sort((a, b) => a.z - b.z); gatesL.sort((a, b) => a.z - b.z);
    }
    function autoPlan() {
      const L = o.length || 1000, n = Math.max(6, Math.round(L / 80)), p = []; for (let i = 0; i < n; i++) { p.push({ chunks: 1, tier: i < n * .33 ? 1 : i < n * .75 ? 2 : 3 }); if (i % 4 === 2) p.push({ item: 'rand' }); if (i === Math.floor(n / 2)) p.push({ checkpoint: 'نص الطريق!', who: 'narrator' }); } return p;
    }
    function applyTheme(name, label) {   // mid-run theme change (championship): new sky, road, scenery, obstacles from here on
      T = mergeTheme(name); OBS = Object.assign({}, R.themes.generic.obst, T.obst || {}); roadGr = null; BG = null; CLD = CLD || null; S.flash2 = .9; AU.sfx('theme'); if (label) banner(label, '#fff2a0', 1.8);
      let k = scen.length; while (k > 0 && scen[k - 1].z > S.z + 6) k--; scen.length = k; sI = Math.min(sI, k); scZ = S.z + 6;
    }
    function nextScenery() {   // procedural roadside, regenerated lazily ahead of the hero
      const side = T.side || []; let tot = 0; side.forEach(s => { tot += s.w || 1; });
      while (scZ < S.z + 95) {
        scZ += rn(T.gap ? T.gap[0] : 6, T.gap ? T.gap[1] : 10) * .85;
        [-1, 1].forEach(sd => { let r = rng() * tot, e = side[0]; for (const s of side) { r -= s.w || 1; if (r <= 0) { e = s; break; } } if (!e) return; const lat = (e.lat ? rn(e.lat[0], e.lat[1]) : 2.8) * sd; scen.push({ z: scZ + rn(-1.2, 1.2), lat, e, flip: rng() < .5 && !e.noflip }); });
      }
    }

    /* ---------------------------------------------------------------- input */
    const inq = { l: 0, r: 0, j: 0, d: 0 };
    function laneMove(dl) { if (!S.live()) return; const n = clamp(S.tx + dl, -1, 1); if (n !== S.tx) { S.tx = n; S.laneT = 0; S.laneChanges++; tutor.lane++; tutor.done.lane = 1; AU.sfx('lane'); sk.poke(); } else if (dl) S.bump = (S.bump || 0) + 1; }
    function doJump() {
      if (!S.live()) return; const HR = HEROES[S.hero]; sk.poke(); tutor.done.jump = 1;
      if (S.boost > 0) return;
      if (S.y <= .001 && S.vy <= 0) { S.vy = HR.vy; S.y = .001; S.roll = 0; S.rollQ = false; S.jumps++; AU.sfx('jump'); dustPuff(5); }
      else if (HR.dbl && !S.dbl) { S.vy = HR.vy * 1.05; S.dbl = 1; S.dblT = 0; S.jumps++; AU.sfx('dbl'); st.sparkle(heroX(), FY - S.y * UH * .85 - 40, { n: 8, spread: 90 }); }
      else S.jbuf = .16;
    }
    function doRoll() {
      if (!S.live() || S.boost > 0) return; const HR = HEROES[S.hero]; sk.poke(); tutor.done.roll = 1;
      if (S.y > .02) { S.vy = Math.min(S.vy, -9); S.rollQ = true; } else { S.roll = HR.roll; S.rolls++; S.rollQ = false; AU.sfx('roll'); dustPuff(6); }
    }
    S.live = () => (S.phase === 'run' || S.phase === 'count') && !M.paused;
    const ptr = new Map(); const thr = () => Math.max(6, 10 / (M.scale || 1));
    st.input = {
      down(x, y, id) { if (M.paused || S.phase === 'pick') return true; ptr.set(id, { x, y, x0: x, y0: y, t0: performance.now(), used: false }); return true; },
      move(x, y, id) {
        const p = ptr.get(id); if (!p || M.paused || p.used) return; const dx = x - p.x0, dy = y - p.y0, th = thr();   // one swipe = one action (lift the finger for the next one)
        if (Math.hypot(dx, dy) >= th) { if (Math.abs(dx) > Math.abs(dy)) laneMove(dx > 0 ? 1 : -1); else if (dy < 0) doJump(); else doRoll(); p.used = true; }
      },
      up(x, y, id) { const p = ptr.get(id); ptr.delete(id); if (p && !p.used && !M.paused && performance.now() - p.t0 < 380 && S.phase === 'run') doJump(); }
    };
    const kh = e => {
      if (M.paused || e.ctrlKey || e.metaKey || e.altKey) return false; if (S.phase === 'pick') return false;
      const k = e.key; let used = true;
      if (k === 'ArrowLeft' || k === 'a' || k === 'A') { if (!e.repeat) laneMove(-1); } else if (k === 'ArrowRight' || k === 'd' || k === 'D') { if (!e.repeat) laneMove(1); }
      else if (k === 'ArrowUp' || k === 'w' || k === 'W' || k === ' ') { if (!e.repeat) doJump(); } else if (k === 'ArrowDown' || k === 's' || k === 'S') { if (!e.repeat) doRoll(); } else used = false;
      return used;
    };
    M.keys.unshift(kh); cl(() => { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); });
    const gp = { l: 0, r: 0, u: 0, d: 0 };
    function pollPad() {
      let pads; try { pads = navigator.getGamepads ? navigator.getGamepads() : null; } catch (e) { return; } if (!pads) return;
      for (let i = 0; i < pads.length; i++) { const p = pads[i]; if (!p || !p.connected) continue; const ax = p.axes[0] || 0, ay = p.axes[1] || 0, b = n => p.buttons[n] && p.buttons[n].pressed;
        const L = ax < -.6 || b(14), Rr = ax > .6 || b(15), Uu = ay < -.6 || b(12) || b(0), Dd = ay > .6 || b(13) || b(1);
        if (L && !gp.l) laneMove(-1); if (Rr && !gp.r) laneMove(1); if (Uu && !gp.u) doJump(); if (Dd && !gp.d) doRoll(); gp.l = L; gp.r = Rr; gp.u = Uu; gp.d = Dd; break; }
    }

    /* ---------------------------------------------------------------- effects */
    const heroX = () => CX + (S.x - S.cam) * LW * S.lwK;
    function dustPuff(n) { for (let i = 0, k = 0; i < dust.length && k < n; i++) { const d = dust[i]; if (d.a > 0) continue; k++; d.a = .5; d.x = heroX() + rn(-26, 26); d.y = FY + rn(-2, 4); d.r = rn(4, 8); d.vx = rn(-50, 50); d.vy = rn(20, 70); } }
    function flyCoin(x, y) { for (let i = 0; i < flyCoins.length; i++) { const f = flyCoins[i]; if (f.a) continue; f.a = 1; f.x = x; f.y = y; f.vx = rn(-130, 130); f.vy = rn(-340, -200); f.t = 0; break; } }
    function say(str, who, col) { banner(str, col); }
    function shake(a) { if (FX.motion) st.shake(a); }

    /* ---------------------------------------------------------------- collisions */
    function nearestLane() { return clamp(Math.round(S.x), -1, 1); }
    function hitObstacle(ob) {
      const d = ob.def, HR = HEROES[S.hero];
      if (S.boost > 0) { ob.hit = 3; AU.sfx('pop'); st.burst(CX + (ob.lane - S.cam) * LW * .8, FY - 30, { n: 6, kind: 'spark' }); return; }
      if (S.inv > 0) { return; }
      if (HR.smash && d.smash && d.type === 'low') { ob.hit = 2; S.coins += 1; AU.sfx('smash'); shake(5); st.burst(heroX(), FY - 50, { n: 12, kind: 'conf', cols: ['#e3b27a', '#c8935a', '#fff7e3'] }); st.float('+١', heroX(), FY - 120, '#ffc93c'); if (!S.smashSaid) { S.smashSaid = 1; hint('أنا قوي!', S.hero, 1.6); } return; }
      if (S.shield > 0) { S.shield = 0; S.inv = 1.2; ob.hit = 3; AU.sfx('pop'); st.sparkle(heroX(), FY - 60, { n: 14, spread: 140, cols: ['#bfe0ff', '#fff', '#8fc0ff'] }); banner('الدرع حماك!', '#bfe0ff'); return; }
      ob.hit = 1; S.collisions++; S.stumble = .9; S.inv = 1.5; S.combo = 0; S.y = 0; S.vy = 0; S.roll = 0;
      const lose = Math.min(3, S.coins); S.coins -= lose; S.lostTotal += lose; for (let i = 0; i < lose; i++) flyCoin(heroX(), FY - 70);
      AU.sfx('oops'); if (d.sfx) setTimeout(() => AU.sfx(d.sfx), 260); shake(7); S.flash = FX.motion ? .25 : 0; if (d.splash) { st.burst(heroX(), FY - 20, { n: 14, kind: 'drop', cols: ['#9fd8ff', '#d6f0ff', '#6ab8f0'], max: 280 }); }
      if (S.collisions % 2 === 1) hint(pickR(['أوبس! ولا يهمّك', 'معلش! كمّل يا بطل', 'ههه! مفيش مشكلة!']), S.hero, 1.8);
      ctx.fx.float('أوبس!', heroX(), FY - 150, '#ff6f91');
    }
    function collect(e) {
      const HR = HEROES[S.hero];
      if (e.k === 'c') { e.got = true; S.coins++; S.combo++; AU.sfx('coin', S.combo); flyCoin(e.mx != null ? CX + (e.mx - S.cam) * LW : heroX(), FY - 70); }
      else if (e.k === 's') { e.got = true; S.stars++; S.coins += 5; AU.sfx('star'); st.reward(heroX(), FY - 90); st.float('نجمة!', heroX(), FY - 140, '#ffc93c'); }
      else if (e.k === 'i') { e.got = true; const kd = e.kind; if (kd === 'magnet') S.magnet = 7; else if (kd === 'shield') S.shield = 10; else { S.boost = 4.2; S.vy = 0; AU.sfx('rocket'); } AU.sfx('power'); banner(PU_NAME[kd] + '!', '#fff2a0', 1.5); st.sparkle(heroX(), FY - 90, { n: 16 }); M.voice.speak(PU_SAY[kd], { speaker: S.hero, soft: true }); }
      else if (e.k === 'p') { e.got = true; S.parts++; AU.sfx('power'); st.reward(heroX(), FY - 90); banner((o.part && o.part.label || 'قطعة') + ' ' + U.ar(S.parts) + ' من ' + U.ar(nParts) + '!', '#fff2a0', 1.8); M.voice.speak((o.part && o.part.say) || 'جبنا قطعة!', { speaker: S.hero, soft: true }); }
    }
    function resolveGate(g) {
      g.done = true; const lane = nearestLane(), a = g.ans[lane + 1], ok = a && a.correct;
      if (ok) {
        S.gates.correct++; if (g.tries === 0) S.gates.firstTry++; AU.sfx('gate'); st.reward(heroX(), FY - 110); st.confetti(); banner(g.kind === 'manners' ? 'تصرّف جميل!' : 'إجابة صح!', '#b8ffb0', 1.6);
        if (g.q.category) ctx.skill(g.q.category); const sd = M.save.data; sd.seen[g.q.id] = (sd.seen[g.q.id] || 0) + 1; sd.lastQ = g.q.id; M.save.commit();
        if (g.q.explain && g.tries === 0) M.voice.speak(g.q.explain, { speaker: 'narrator', soft: true }); else M.voice.speak(pickR(['برافو!', 'ممتاز!', 'شاطر أوي!']), { speaker: S.hero, soft: true });
        ctx.prompt(o.prompt2 || 'كمّل جري!'); curGate = null; S.v *= .97;
      } else {
        S.gates.misses++; ctx.mistake(); AU.sfx('gate_no'); const tries = g.tries + 1; S.v *= .88;
        const dead = g.dead.slice(); if (a) { const li = lane + 1; dead[li] = true; }
        if (tries === 1) hint('قريب! جرّب تاني', S.hero, 2.4); else if (tries === 2 && g.q.hint) { hint(g.q.hint, 'narrator', 3.4); } else hint('الإجابة هنا! خدها المرة دي', 'narrator', 2.6);
        // gentle retry: the same question comes again after an easy coin stretch (never a punishment)
        insertRetry(g, tries, dead); curGate = null;
      }
    }
    function insertRetry(g, tries, dead) {
      const z0 = S.z + 14, dl = 46; let lo = iLo; while (lo < objs.length && objs[lo].z < z0) lo++;
      const tail = objs.splice(lo); for (const e of tail) { e.z += dl; if (e.mz != null) e.mz += dl; }
      const base = objs.length;
      for (let j = -1; j <= 1; j++) coinAt(0, z0 + 7 + j * 2.2); for (let j = -1; j <= 1; j++) coinAt(-1, z0 + 17 + j * 2.2); for (let j = -1; j <= 1; j++) coinAt(1, z0 + 26 + j * 2.2);
      const g2 = makeGate(z0 + dl - 10, g.entry, g.q, tries, dead); g2.hl = tries >= 3; g2.retry = true;
      const added = objs.splice(base); added.sort((a, b) => a.z - b.z); for (const e of added) objs.push(e); for (const e of tail) objs.push(e);
      gatesL.sort((a, b) => a.z - b.z); S.L += dl; return g2;
    }
    /* ---------------------------------------------------------------- assist */
    function assistOn() { return S.assist; }
    function autoDodge() {
      if (!S.assist || S.laneT < .55 || S.boost > 0) return;
      let blk = null, lim = S.z + S.v * .75 + 2.2;
      for (let i = iLo; i < objs.length && objs[i].z < lim; i++) { const e = objs[i]; if (e.k === 'o' && !e.hit && e.def.type === 'tall' && e.lane === S.tx && e.z > S.z - .2) { blk = e; break; } }
      if (!blk) return; const free = l => { if (l < -1 || l > 1) return false; for (let i = iLo; i < objs.length && objs[i].z < lim + 4; i++) { const e = objs[i]; if (e.k === 'o' && !e.hit && e.def.type === 'tall' && e.lane === l && Math.abs(e.z - blk.z) < 6) return false; } return true; };
      const opts = [S.tx - 1, S.tx + 1].filter(free); if (opts.length) { S.tx = opts.length === 2 ? (S.tx === 0 ? (rng() < .5 ? -1 : 1) : 0) : opts[0]; S.laneT = 0; AU.sfx('lane'); S.autoDodged = (S.autoDodged || 0) + 1; }
    }

    /* ---------------------------------------------------------------- update */
    const dbg = { kit: 'runner3d', phase: 'pick', hero: S.hero, lane: 0, x: 0, air: 0, rolling: false, goalPct: 0, z: 0, L: 0, speed: 0, nextObstacle: null, obstacles: [], gates: [], coins: 0, stars: 0, collisions: 0, parts: 0, partsNeeded: nParts, boost: 0, stumble: 0, assist: false, itemAhead: null, coinsAhead: [], coinsTotal: 0, finished: false, no: { lane: 0, type: '', dist: 0, h: 0 } };
    /* sprites are baked lazily; warm them 1 per frame while the picker / countdown is on screen so the run starts without hitches */
    const warmQ = []; (function () { const seen = {}, add = (n, ref) => { if (n && !seen[n + ref]) { seen[n + ref] = 1; warmQ.push([n, ref]); } }; (T.side || []).forEach(e => add(e.art, 190)); (o.plan || []).forEach(e => { if (e.theme) { const nt = mergeTheme(e.theme); (nt.side || []).forEach(q => add(q.art, 190)); Object.keys(nt.obst || {}).forEach(k => nt.obst[k].forEach(nm => { const d = typeof nm === 'object' ? nm : R.obst[nm]; if (d) add(d.art, 150); })); } }); Object.keys(OBS).forEach(k => OBS[k].forEach(nm => { const d = typeof nm === 'object' ? nm : R.obst[nm]; if (d) add(d.art, 150); })); const gl = Object.assign({}, T.goal, o.goal); add(gl.art, 190); add(gl.emptyArt, 190); if (o.part) add(o.part.art, 150); if (o.carry) add(o.carry, 64); warmQ.push(['coin', 28, 1]); if (o.goal && o.goal.icon) warmQ.push([o.goal.icon, 34, 1]); if (o.part) warmQ.push([o.part.art, 30, 1]); })();
    function update(dt) {
      if (finished) return;
      if (warmQ.length) { const w = warmQ.shift(); if (w[2]) { try { A.sprite(w[0], w[1]); } catch (e) { } } else spr(w[0], w[1]); }
      pollPad(); nextScenery();
      if (S.phase === 'pick') { dbg.phase = 'pick'; st.dbg = dbg; return; }
      const HR = HEROES[S.hero];
      if (S.phase === 'count') { S.countT += dt; S.ph += dt * .9; if (S.countT > 3.6) { S.phase = 'run'; started = true; AU.sfx('beep', 1); if (S.startBub) { S.bubble = S.startBub; S.bubT = 3; S.startBub = null; } } else { const n = Math.floor(S.countT / .9); if (n !== S.cdn) { S.cdn = n; if (n < 3) AU.sfx('beep', 0); else AU.sfx('beep', 1); } } }
      if (S.phase === 'run' || S.phase === 'finish') {
        S.t += dt; if (((S.t) | 0) !== (((S.t - dt)) | 0)) sk.poke();
        // ---- speed
        const sp = o.speed || [8.5, 13.5], ramp = (o.ramp || 75) * (S.assist ? 1.3 : 1), vmax = sp[1] * (S.assist ? .9 : 1), base = lerp(sp[0] * (S.assist ? .95 : 1), vmax, clamp(S.t / ramp, 0, 1));
        let mult = 1; if (S.pad > 0) { mult *= 1.3; S.pad -= dt; } if (S.zone) mult *= 1.2; if (S.stumble > 0) { mult *= .5 + .5 * (1 - S.stumble / .9); S.stumble -= dt; } if (S.boost > 0) { mult *= 1.62; S.boost -= dt; if (S.boost <= 0) { S.y = Math.max(S.y, .01); S.inv = Math.max(S.inv, 1); } }
        let gs = null; for (let i = 0; i < gatesL.length; i++) if (!gatesL[i].done) { gs = gatesL[i]; break; }
        if (gs) { const dd = gs.z - S.z; if (dd < 52 && dd > 0) mult *= S.assist ? .7 : .8; }
        let vt = base * mult;
        if (S.phase === 'finish') { const dd = Math.max(0, S.L - 5.2 - S.z); vt = Math.min(vt, Math.max(0, dd * 1.5)); if (dd < .06) { vt = 0; } }
        S.v += (vt - S.v) * Math.min(1, dt * (vt < S.v ? 5 : 2.4));
        if (S.phase === 'finish' && S.v < .25) { S.v = 0; }
        S.z += S.v * dt; S.ph += S.v * dt / 3.5;
        // ---- lane (smooth), vertical, roll
        S.laneT += dt; S.x += (S.tx - S.x) * Math.min(1, dt * HR.rate); if (Math.abs(S.tx - S.x) < .004) S.x = S.tx;
        if (S.boost > 0) { S.y += (.7 - S.y) * Math.min(1, dt * 5); S.vy = 0; }
        else if (S.y > 0 || S.vy > 0) {
          S.vy -= HR.g * dt * (S.rollQ ? 1 : 1); S.y += S.vy * dt; if (S.dbl) S.dblT += dt;
          if (S.y <= 0) { S.y = 0; if (S.vy < -4) { AU.sfx('land'); dustPuff(5); } S.vy = 0; S.dbl = 0; S.dblT = 0; if (S.rollQ) { S.rollQ = false; S.roll = HR.roll; S.rolls++; AU.sfx('roll'); } if (S.jbuf > 0) { S.jbuf = 0; doJump(); } }
        }
        if (S.jbuf > 0) S.jbuf -= dt; if (S.roll > 0) S.roll -= dt; if (S.inv > 0) S.inv -= dt; if (S.magnet > 0) S.magnet -= dt; if (S.shield > 0) S.shield -= dt; if (S.flash > 0) S.flash -= dt * 3;
        S.boostK += ((S.boost > 0 || S.pad > 0 || S.zone ? 1 : 0) - S.boostK) * Math.min(1, dt * 4); S.lwK = 1 + (FX.motion ? S.boostK * .06 : 0);
        S.sway = FX.motion && T.sway ? T.sway * (Math.sin(S.z * .0105) + .5 * Math.sin(S.z * .0237 + 1)) : 0;
        { const sn = Math.floor(S.ph * 2); if (sn !== S.lastStep) { S.lastStep = sn; if (S.y < .02 && S.roll <= 0 && S.stumble <= 0 && S.v > 3 && S.boost <= 0) AU.sfx('step', T.step); } }
        S.cam += (S.x * (FX.motion ? .5 : .25) - S.cam) * Math.min(1, dt * 5);
        autoDodge();
        // ---- advance window pointer
        while (iLo < objs.length && objs[iLo].z < S.z - 3) iLo++;
        // ---- collisions / pickups
        const HW = S.assist ? .4 : .52, HZW = S.assist ? .32 : .5, magR = HR.mag + (S.magnet > 0 ? 2.2 : 0), magD = S.magnet > 0 ? 11 : 2.6;
        const bodyH = S.roll > 0 ? .5 : .95, lim = S.z + 13; let ni = null;
        for (let i = iLo; i < objs.length && objs[i].z < lim; i++) {
          const e = objs[i];
          if (e.k === 'o') {
            if (e.hit) { e.anim += dt; continue; }
            if (!ni && e.z > S.z - .5) ni = e;
            const dz = Math.abs(e.z - S.z), d = e.def; if (dz > d.dz * .5 + HZW) continue; if (Math.abs(S.x - e.lane) > HW + d.sz * .0016) continue;
            let hit = false; if (d.type === 'low') hit = S.y < d.h * (S.assist ? .8 : .93); else if (d.type === 'tall') hit = S.y < d.h; else if (d.type === 'bar') hit = !(S.roll > 0) && S.y < .95;
            if (hit) hitObstacle(e);
          } else if (e.k === 'c') {
            if (e.got) continue; const dzr = e.z - S.z; if (S.boost > 0 && Math.abs(dzr) < 8 || (magR > 1 && Math.abs(e.mx - S.x) < magR && dzr > -1 && dzr < magD)) { e.mag = 1; }
            if (e.mag) { e.mx += (S.x - e.mx) * Math.min(1, dt * 11); e.mz += (S.z + .15 - e.mz) * Math.min(1, dt * 9); if (Math.abs(e.mz - S.z) < .75 && Math.abs(e.mx - S.x) < .45) collect(e); continue; }
            if (Math.abs(dzr) < .8 && Math.abs(S.x - e.lane) < HR.mag + .15 && e.h >= S.y - .12 && e.h <= S.y + bodyH + .1) collect(e);
          } else if (e.k === 's' || e.k === 'i' || e.k === 'p') {
            if (e.got) continue; if (Math.abs(e.z - S.z) < 1.2 && Math.abs(S.x - e.lane) < .7 + (S.magnet > 0 ? 1.2 : 0)) collect(e);
            else if (e.k === 'p' && e.z < S.z - 2.6) { e.got = true; if (S.spawnedParts < nParts * 3) { S.spawnedParts++; respawnPart(e); } }
          } else if (e.k === 'b') { if (!e.got && Math.abs(e.z - S.z) < 1.4 && Math.abs(S.x - e.lane) < .7 && S.y < .5) { e.got = true; S.pad = 1.8; AU.sfx('pad'); banner('سرعة!', '#fff2a0', 1); st.sparkle(heroX(), FY - 40, { n: 10, spread: 120 }); }
          } else if (e.k === 'u') { if (!e.got && S.z >= e.z) { e.got = true; S.zone = e.on; if (e.on) { banner(e.label || 'سرعة!', '#fff2a0', 1.4); AU.sfx('pad'); } }
          } else if (e.k === 't') { if (!e.got && S.z >= e.z) { e.got = true; applyTheme(e.theme, e.label); }
          } else if (e.k === 'f') { if (!e.got && S.z >= e.z) { e.got = true; AU.sfx('check'); st.sparkle(heroX(), FY - 100, { n: 14 }); st.burst(CX, 200, { n: 18, kind: 'conf' }); if (e.text) { hint(e.text, e.who || 'narrator', 3); banner('نقطة تفتيش!', '#fff2a0', 1.6); } } }
        }
        // quiz / manners gate: announce it from far away (question in the HUD + voice), resolve when the hero crosses it
        for (let i = 0; i < gatesL.length; i++) { const g = gatesL[i]; if (g.done) continue; const dd = g.z - S.z; if (dd < (g.retry ? 36 : 74) && !g.announced) announce(g); if (S.z >= g.z) resolveGate(g); break; }
        // next obstacle debug (first not-passed obstacle ahead, any lane)
        // ---- gate announce handled in loop; hit nothing else
        if (S.phase === 'run' && S.z >= S.L - 8) { S.phase = 'finish'; S.finT = 0; AU.sfx('check'); }
        if (S.phase === 'finish') { S.finT += dt; if (S.v < .3 && S.finT > .3 && !S.cheer) { S.cheer = 1; S.cheerT = 0; AU.sfx('win'); st.confetti(); st.burst(CX, 300, { n: 24, kind: 'star' }); st.sparkle(CX, FY - 80, { n: 18, spread: 200 }); if (o.say && o.say.finish) hint(o.say.finish[1], o.say.finish[0], 2.8); } if (S.cheer) { S.cheerT += dt; if (S.cheerT > (((o.goal && o.goal.who) ? 3.6 : 2.4)) && !finished) showSummary(); } }
        // ---- ambient fx
        if (S.v > 1 && Math.floor(S.t * 12) !== Math.floor((S.t - dt) * 12) && S.y < .05) dustPuff(1);
        if (S.bubT > 0) S.bubT -= dt; if (S.bannerT > 0) S.bannerT -= dt;
        // ---- long safety net
        if (S.t > (o.maxTime || 420) && !S.skipShown) { S.skipShown = 1; UI.skip.show(() => done({ skipped: true, stars: S.stars, coins: S.coins, distance: Math.round(S.z), collisions: S.collisions, hero: S.hero })); }
      }
      // dust + flying coins
      for (let i = 0; i < dust.length; i++) { const d = dust[i]; if (d.a > 0) { d.a -= dt * 1.5; d.x += d.vx * dt; d.y += d.vy * dt; d.r += dt * 14; } }
      for (let i = 0; i < flyCoins.length; i++) { const f = flyCoins[i]; if (f.a) { f.t += dt; f.vy += 820 * dt; f.x += f.vx * dt; f.y += f.vy * dt; if (f.t > .9) f.a = 0; } }
      // ---- debug state for bots
      updateDbg();
    }
    function respawnPart(e) {   // a missed collectible comes again a bit further on (never lost)
      const z = Math.max(S.z + 26, e.z); let lane = Math.floor(rng() * 3) - 1; for (let t = 0; t < 4; t++) { let free = true; for (const q of objs) if (q.k === 'o' && Math.abs(q.z - z) < 5 && q.lane === lane) { free = false; break; } if (free) break; lane = Math.floor(rng() * 3) - 1; }
      if (z >= S.L - 8) { return; } let at = objs.length; while (at > 0 && objs[at - 1].z > z) at--; objs.splice(at, 0, { k: 'p', z, lane, got: false, idx: 0 });
    }
    function announce(g) {
      g.announced = true; curGate = g; ctx.prompt(g.q.q);
      const tx = g.ans.map(a => a.text); if (!g.hl && g.tries < 3) M.voice.speakSeq([g.q.q].concat(tx.filter((t, i) => !g.dead[i])), { speaker: 'narrator' });
    }
    const POOL_O = [], POOL_C = [], POOL_G = [{ dist: 0, tries: 0, lanes: [{}, {}, {}] }, { dist: 0, tries: 0, lanes: [{}, {}, {}] }]; for (let i = 0; i < 18; i++) POOL_O.push({ lane: 0, type: '', dist: 0, h: 0, smash: false }); for (let i = 0; i < 26; i++) POOL_C.push({ lane: 0, dist: 0, h: 0 }); const ITEM = { kind: '', lane: 0, dist: 0 };
    let dbgTick = 0;
    function updateDbg() {
      if ((dbgTick++ & 1) && S.phase !== 'pick') { st.dbg = dbg; return; }   // 30 Hz is plenty for bots; keeps the hot loop allocation-free
      const d = dbg; d.phase = S.phase; d.hero = S.hero; d.lane = S.tx; d.x = S.x; d.air = S.y; d.rolling = S.roll > 0; d.goalPct = clamp(S.z / S.L, 0, 1); d.z = S.z; d.L = S.L; d.speed = S.v; d.coins = S.coins; d.stars = S.stars; d.collisions = S.collisions; d.parts = S.parts; d.boost = S.boost; d.stumble = S.stumble; d.assist = S.assist; d.finished = finished; d.laneNow = Math.round(S.x);
      d.obstacles.length = 0; d.nextObstacle = null; let n = 0;
      for (let i = iLo; i < objs.length && objs[i].z < S.z + 75 && n < 16; i++) { const e = objs[i]; if (e.k === 'o' && !e.hit && e.z > S.z - 1.8) { const r = POOL_O[n]; r.lane = e.lane; r.type = e.def.type; r.dist = e.z - S.z; r.h = e.def.h; r.smash = !!e.def.smash; d.obstacles.push(r); if (!d.nextObstacle && r.dist > -.3) d.nextObstacle = r; n++; } }
      d.gates.length = 0; for (let i = 0; i < gatesL.length && d.gates.length < 2; i++) { const g = gatesL[i]; if (g.done) continue; const r = POOL_G[d.gates.length]; r.dist = g.z - S.z; r.tries = g.tries; for (let li = 0; li < 3; li++) { const q = r.lanes[li], a = g.ans[li]; q.lane = li - 1; q.correct = !!a.correct; q.text = a.text; q.dead = g.dead[li]; } d.gates.push(r); }
      d.coinsAhead.length = 0; for (let i = iLo, c = 0; i < objs.length && objs[i].z < S.z + 40 && c < 24; i++) { const e = objs[i]; if (e.k === 'c' && !e.got && e.z > S.z - .5) { const r = POOL_C[c++]; r.lane = e.lane; r.dist = e.z - S.z; r.h = e.h; d.coinsAhead.push(r); } }
      d.itemAhead = null; for (let i = iLo; i < objs.length && objs[i].z < S.z + 40; i++) { const e = objs[i]; if ((e.k === 'p' || e.k === 'i') && !e.got && e.z > S.z) { ITEM.kind = e.k; ITEM.lane = e.lane; ITEM.dist = e.z - S.z; d.itemAhead = ITEM; break; } }
      st.dbg = d;
    }
    function showSummary() {   // small result card (distance, coins, right answers, stumbles) before the story ending; tap to continue
      if (S.sum) return; S.sum = 1; if (o.summary === false) { finish(); return; }
      const chip = (l, v) => h('div', { class: 'rn-chip' }, h('small', null, l), h('b', null, v));
      const card = h('div', { class: 'panel rnsum', role: 'status' }, h('div', { class: 'rn-t' }, 'ملخص السباق'), h('div', { class: 'rn-chips' }, chip('المسافة', U.ar(Math.round(Math.min(S.z, S.L))) + ' متر'), chip('العملات', U.ar(S.coins)), chip('الإجابات الصح', U.ar(S.gates.correct) + ' من ' + U.ar(S.gates.total)), chip('التعثّر', U.ar(S.collisions))));
      let gone = false; const go = () => { if (gone) return; gone = true; card.remove(); finish(); }; card.onclick = go; UI.over.append(card); cl(() => card.remove()); setTimeout(go, 3400);
    }
    function finish() {
      if (finished) return; finished = true; S.phase = 'done'; const mins = o.payout === false ? 0 : Math.min(24, Math.round(S.coins / 5)); if (mins) ctx.reward.coins(mins);
      const res = { stars: S.stars, coins: S.coins, distance: Math.round(Math.min(S.z, S.L)), collisions: S.collisions, gates: Object.assign({}, S.gates), parts: S.parts, partsNeeded: nParts, hero: S.hero, time: Math.round(S.t), assist: S.assist, autoDodged: S.autoDodged || 0, bonusCoins: mins, lostCoins: S.lostTotal, coinsTotal: S.coinsTotal, jumps: S.jumps, rolls: S.rolls, laneChanges: S.laneChanges };
      R.last = res; done(res);
    }

    /* ---------------------------------------------------------------- rendering */
    const pxp = (d) => 1 / (1 + d / DD);
    let _x = 0, _y = 0, _p = 0;
    function pj(d, lat) { _p = 1 / (1 + d / DD); _y = HZ + (FY - HZ) * _p; _x = CX + (lat - S.cam + (S.sway ? S.sway * (d < 120 ? d : 120) * (d < 120 ? d : 120) * .0009 : 0)) * LW * S.lwK * _p; }
    /* road quad between depths pa..pb (p values) and laterals l0..l1 (appended to the current path; no allocation) */
    function rq(g, l0, l1, pa, pb, lk, cam) {
      const ya = HZ + (FY - HZ) * pa, yb = HZ + (FY - HZ) * pb; let sa = 0, sb = 0; if (S.sway) { let da = DD * (1 / pa - 1), db = DD * (1 / pb - 1); da = da < 120 ? da : 120; db = db < 120 ? db : 120; sa = S.sway * da * da * .0009; sb = S.sway * db * db * .0009; }
      g.moveTo(CX + (l0 - cam + sa) * lk * pa, ya); g.lineTo(CX + (l1 - cam + sa) * lk * pa, ya); g.lineTo(CX + (l1 - cam + sb) * lk * pb, yb); g.lineTo(CX + (l0 - cam + sb) * lk * pb, yb); g.closePath();
    }
    function drawRoad(g, LT) {
      const lk = LW * S.lwK, NB = LT ? 12 : 20, ND = LT ? 10 : 19, cam = S.cam, p0 = 1.3, p1 = .01, rd = T.road;
      if (!roadGr) { roadGr = g.createLinearGradient(0, HZ, 0, H); roadGr.addColorStop(0, rd.b); roadGr.addColorStop(1, rd.a); walkGr = g.createLinearGradient(0, HZ, 0, H); walkGr.addColorStop(0, T.walk ? T.walk.b : '#ccc'); walkGr.addColorStop(1, T.walk ? T.walk.a : '#eee'); haze = g.createLinearGradient(0, HZ, 0, HZ + 80); haze.addColorStop(0, T.fog || '#eaf3ff'); haze.addColorStop(1, 'rgba(255,255,255,0)'); }
      if (T.walk) { g.fillStyle = walkGr; g.beginPath(); rq(g, -3.4, -1.62, p0, p1, lk, cam); rq(g, 1.62, 3.4, p0, p1, lk, cam); g.fill(); }
      g.fillStyle = roadGr; g.beginPath(); rq(g, -1.62, 1.62, p0, p1, lk, cam); g.fill();
      // alternating bands (road + sidewalk) give the sense of speed
      const BL = 5, z0 = Math.floor(S.z / BL) * BL, k0 = Math.floor(S.z / BL);
      g.fillStyle = rd.band || 'rgba(0,0,0,.07)'; g.beginPath();
      for (let k = 0; k < NB; k++) { if (((k0 + k) & 1)) continue; const d0 = z0 + k * BL - S.z, d1 = d0 + BL; if (d1 < -1.4) continue; rq(g, -1.62, 1.62, pxp(Math.max(d0, -1.4)), pxp(d1), lk, cam); }
      g.fill();
      if (T.walk) {
        g.fillStyle = 'rgba(0,0,0,.07)'; g.beginPath(); for (let k = 0; k < NB; k++) { if (((k0 + k) & 1)) continue; const d0 = z0 + k * BL - S.z, d1 = d0 + BL; if (d1 < -1.4) continue; const pa = pxp(Math.max(d0, -1.4)), pb = pxp(d1); rq(g, -3.4, -1.62, pa, pb, lk, cam); rq(g, 1.62, 3.4, pa, pb, lk, cam); } g.fill();
        g.fillStyle = T.walk.curb || '#f7f1e2'; g.beginPath(); rq(g, -1.74, -1.62, p0, p1, lk, cam); rq(g, 1.62, 1.74, p0, p1, lk, cam); g.fill();
      }
      if (rd.cross) { g.fillStyle = rd.cross; g.beginPath(); for (let k = 0; k < 20; k++) { const d0 = z0 + k * BL - S.z; if (d0 < -1.4) continue; const pa = pxp(d0), pb = pxp(d0 + .22); rq(g, -1.62, 1.62, pa, pb, lk, cam); } g.fill(); }
      // lane dashes + edge lines
      const DL = 4.8, zd = Math.floor(S.z / DL) * DL; g.fillStyle = rd.line || '#fff3b0'; g.beginPath();
      for (let k = 0; k < ND; k++) { const d0 = zd + k * DL - S.z, d1 = d0 + DL * .5; if (d1 < -1.4) continue; const pa = pxp(Math.max(d0, -1.4)), pb = pxp(d1); rq(g, -.53, -.47, pa, pb, lk, cam); rq(g, .47, .53, pa, pb, lk, cam); }
      g.fill();
      g.fillStyle = rd.edge || '#fff7e3'; g.beginPath(); rq(g, -1.56, -1.5, p0, p1, lk, cam); rq(g, 1.5, 1.56, p0, p1, lk, cam); g.fill();
      g.fillStyle = haze; g.fillRect(0, HZ - 2, W, 80);   // horizon haze
    }
    function alphaAt(p) { return p > .17 ? 1 : clamp((p - .075) / .1, 0, 1); }
    function shadowAt(g, x, y, w, a) { g.globalAlpha = a; g.drawImage(G.shadowSprite(), x - w / 2, y - w * .13, w, w * .26); g.globalAlpha = 1; }
    function drawObj(g, e) {
      const d = e.z - S.z; if (d < -1.5 || d > 88) return;
      if (e.k === 'o') {
        pj(d, e.lane); const def = e.def, a = alphaAt(_p); if (a <= 0 || e.gone) return; const size = def.sz * _p * (def.scl || 1);
        g.globalAlpha = a;
        if (e.hit) {
          if (e.anim > .9) { e.gone = true; g.globalAlpha = 1; return; }
          const t = e.anim, k = Math.min(1, t * 1.2); g.save(); g.translate(_x + (e.hit === 2 ? 0 : (e.lane || .6) * 80 * k * _p), _y - 80 * _p * Math.sin(k * 3.14) - (e.hit === 2 ? 40 * k : 0) * _p); g.rotate((e.lane || 1) * t * 7); g.globalAlpha = a * (1 - t / .9); blitArt(g, def.art, 150, 0, 0, size); g.restore(); g.globalAlpha = 1; return;
        }
        if (def.type !== 'bar') shadowAt(g, _x, _y, size * .95, .8 * a);
        if (def.type === 'bar') { // hangs over the lane at head height
          const lift = 38 * _p * UH / 60; blitArt(g, def.art, 150, _x, _y - lift * .1, size);
        } else blitArt(g, def.art, 150, _x, _y, size);
        g.globalAlpha = 1;
      } else if (e.k === 'c') {
        if (e.got) return; pj(d, e.mx != null ? e.mx : e.lane); if (e.mz != null && e.mz !== e.z) { pj(e.mz - S.z, e.mx); } const a = alphaAt(_p); if (a <= 0) return; const sz = 40 * _p, fr = COIN[(((S.t * 12 + e.z * 2) | 0) % 12 + 12) % 12], y = _y - e.h * UH * _p;
        shadowAt(g, _x, _y, sz * 1.1, .35 * a); g.globalAlpha = a; g.drawImage(fr, _x - sz / 2, y - sz / 2, sz, sz); g.globalAlpha = 1;
      } else if (e.k === 's') {
        if (e.got) return; pj(d, e.lane); const a = alphaAt(_p); if (a <= 0) return; const sz = 74 * _p * (1 + .06 * Math.sin(S.t * 6)), y = _y - (.6 + .05 * Math.sin(S.t * 4)) * UH * _p; g.globalAlpha = a; shadowAt(g, _x, _y, sz, .4 * a); g.globalAlpha = a; g.drawImage(G.glowSprite('255,230,130'), _x - sz, y - sz, sz * 2, sz * 2); g.drawImage(STARC, _x - sz / 2, y - sz / 2, sz, sz); g.globalAlpha = 1;
      } else if (e.k === 'i') {
        if (e.got) return; pj(d, e.lane); const a = alphaAt(_p); if (a <= 0) return; const c = PU[e.kind] || bakePU(e.kind), sz = 84 * _p, y = _y - (.62 + .06 * Math.sin(S.t * 5 + e.z)) * UH * _p; g.globalAlpha = a; shadowAt(g, _x, _y, sz, .45 * a); g.globalAlpha = a; g.drawImage(c, _x - sz * .75, y - sz * .75, sz * 1.5, sz * 1.5); g.globalAlpha = 1;
      } else if (e.k === 'p') {
        if (e.got) return; pj(d, e.lane); const a = alphaAt(_p); if (a <= 0) return; const sz = (o.part && o.part.sz || 100) * _p, y = _y - (.1 + .04 * Math.sin(S.t * 4)) * UH * _p; g.globalAlpha = a; g.drawImage(G.glowSprite('255,240,160'), _x - sz * .9, y - sz * 1.2, sz * 1.8, sz * 1.8); shadowAt(g, _x, _y, sz * .9, .5 * a); g.globalAlpha = a; blitArt(g, o.part ? o.part.art : 'rn_flag', 150, _x, y + sz * .05, sz); g.globalAlpha = 1;
      } else if (e.k === 'f') drawCheckpoint(g, e, d);
      else if (e.k === 'b') { if (e.got) return; pj(d, e.lane); const a = alphaAt(_p); if (a <= 0) return; if (!PADC) bakePad(); const w = 128 * _p * 1.05; g.globalAlpha = a * (.8 + .2 * Math.sin(S.t * 10)); g.drawImage(PADC, _x - w / 2, _y - w * .27, w, w * .5); g.globalAlpha = 1; }
      else if (e.k === 'g') drawGate(g, e, d);
      else if (e.k === 'e') drawGoal(g, e, d);
    }
    function drawCheckpoint(g, e, d) {
      pj(d, 0); const a = alphaAt(_p); if (a <= 0) return; const w = 1.78 * LW * S.lwK * _p, top = _y - 1.9 * UH * _p; g.globalAlpha = a;
      g.fillStyle = '#e8edf6'; g.fillRect(_x - w - 5 * _p, top, 10 * _p + 1, _y - top); g.fillRect(_x + w - 5 * _p, top, 10 * _p + 1, _y - top);
      g.fillStyle = '#ffc93c'; g.fillRect(_x - w - 6 * _p, top - 4 * _p, w * 2 + 12 * _p, 34 * _p); g.fillStyle = '#ef5350'; for (let i = 0; i < 12; i++) if (i & 1) g.fillRect(_x - w - 6 * _p + i * (w * 2 + 12 * _p) / 12, top - 4 * _p, (w * 2 + 12 * _p) / 12, 34 * _p);
      if (_p > .16) { const c = txtCv('نقطة تفتيش', 30, '#fff', '#8a4a10'), k = 34 * _p / c.height * 1.25; g.drawImage(c, _x - c.width * k / 2, top - 4 * _p - c.height * k * .1, c.width * k, c.height * k); } g.globalAlpha = 1;
    }
    function boardOf(g, ans, li, hl) {
      const key = (hl ? 'h' : ans.dead ? 'd' : 'n') + li; if (ans.cv && ans.cvk === key) return ans.cv;
      const wd = 300, ht = 190, c = G.mkCanvas(wd, ht), x = c.getContext('2d'); x.direction = 'rtl'; const cols = ['#ff8a2a', '#1fb5a6', '#8a6bd6'], col = ans.dead ? '#a9a49a' : cols[li];
      const gr = x.createLinearGradient(0, 0, 0, ht); gr.addColorStop(0, G.shade(col, .25)); gr.addColorStop(1, col); G.rr(x, 6, 6, wd - 12, ht - 12, 26); x.fillStyle = '#fff'; x.fill(); G.rr(x, 14, 14, wd - 28, ht - 28, 20); x.fillStyle = ans.dead ? '#ece8df' : (hl ? '#fff6a8' : '#fffdf6'); x.fill();
      x.fillStyle = gr; G.rr(x, 14, 14, wd - 28, 38, 20); x.fill(); x.fillRect(14, 36, wd - 28, 16);
      x.fillStyle = 'rgba(255,255,255,.9)'; x.font = 'bold 22px ' + M.FONT; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(['حارة ١', 'حارة ٢', 'حارة ٣'][li], wd / 2, 33);
      let ty = 118; if (ans.art) { try { A.draw(x, ans.art, wd / 2, 98, 80); } catch (e) { } ty = 150; }
      const fs0 = ans.art ? 30 : 46; let fs = fs0; x.font = 'bold ' + fs + 'px ' + M.FONT; let lines = wrapLines(x, ans.text, wd - 48); while (fs > 20 && (lines.length > (ans.art ? 1 : 2) || lines.some(l => x.measureText(l).width > wd - 44))) { fs -= 3; x.font = 'bold ' + fs + 'px ' + M.FONT; lines = wrapLines(x, ans.text, wd - 48); }
      const lh = fs * 1.12, y0 = ans.art ? 152 : 118 - (lines.length - 1) * lh / 2 + 6; x.fillStyle = ans.dead ? '#8a857a' : '#3a2a1e'; lines.forEach((l, i) => x.fillText(l, wd / 2, y0 + i * lh));
      if (ans.dead) { x.strokeStyle = 'rgba(160,60,60,.0)'; }
      ans.cv = c; ans.cvk = key; return c;
    }
    function drawGate(g, e, d) {
      pj(d, 0); const a = alphaAt(_p); if (a <= 0) return; const lk = LW * S.lwK * _p, hw = 1.62 * lk, top = _y - 2.55 * UH * _p; g.globalAlpha = a;
      // lane carpets in the last stretch before the gate
      for (let li = 0; li < 3; li++) { const lat = li - 1; g.fillStyle = LANE_TINT[li]; const pa = pxp(Math.max(d, -1.4)), pb = pxp(d + 16); g.beginPath(); g.moveTo(CX + (lat - .48 - S.cam) * LW * S.lwK * pa, HZ + (FY - HZ) * pa); g.lineTo(CX + (lat + .48 - S.cam) * LW * S.lwK * pa, HZ + (FY - HZ) * pa); g.lineTo(CX + (lat + .48 - S.cam) * LW * S.lwK * pb, HZ + (FY - HZ) * pb); g.lineTo(CX + (lat - .48 - S.cam) * LW * S.lwK * pb, HZ + (FY - HZ) * pb); g.closePath(); g.fill(); }
      const kindCol = e.kind === 'manners' ? '#43a867' : '#4a8dff';
      g.fillStyle = '#e8edf6'; g.fillRect(_x - hw - 6 * _p, top, 12 * _p + 1, _y - top); g.fillRect(_x + hw - 6 * _p, top, 12 * _p + 1, _y - top);
      g.fillStyle = kindCol; g.fillRect(_x - hw - 8 * _p, top - 6 * _p, hw * 2 + 16 * _p, 46 * _p);
      if (_p > .14) { const c = txtCv(e.kind === 'manners' ? 'اختار التصرّف الصح' : 'اختار الإجابة الصح', 30, '#fff', '#1a3a7a'), k = 40 * _p / c.height * 1.3; g.drawImage(c, _x - c.width * k / 2, top + 17 * _p - c.height * k / 2, c.width * k, c.height * k); }
      for (let li = 0; li < 3; li++) { const an = e.ans[li]; an.dead = e.dead[li]; const cv = boardOf(g, an, li, e.hl && an.correct), bw = lk * .95, bh = bw * cv.height / cv.width, bx = _x + (li - 1) * lk, by = top + 52 * _p; const pulse = e.hl && an.correct ? 1 + .06 * Math.sin(S.t * 8) : 1; g.drawImage(cv, bx - bw * pulse / 2, by, bw * pulse, bh * pulse); }
      g.globalAlpha = 1;
    }
    function drawGoal(g, e, d) {
      pj(d, 0); const a = alphaAt(_p); if (a <= 0) return; const gl = T.goal || {}, sz = (o.goal && o.goal.sz || gl.sz || 240) * _p * (S.cheer ? 1 + .04 * Math.abs(Math.sin(S.cheerT * 8)) : 1); g.globalAlpha = a; shadowAt(g, _x, _y, sz * .9, .6 * a); g.globalAlpha = a;
      const gg = GOAL; S.gx = _x; S.gy = _y; S.gp = _p;
      blitArt(g, (S.phase === 'finish' && gg.emptyArt) ? gg.emptyArt : gg.art, 190, _x, _y, sz);
      g.globalAlpha = 1;
    }
    function drawScenery(g, LT) {
      for (let i = sI; i < scen.length; i++) { /* ascending: find first visible */ }
      // find first index with z >= S.z - 3
      while (sI < scen.length && scen[sI].z < S.z - 3) sI++;
      const far = LT ? 58 : 90; let hi = sI; while (hi < scen.length && scen[hi].z < S.z + far) hi++;
      for (let i = hi - 1; i >= sI; i--) {
        const s = scen[i], d = s.z - S.z; if (LT && d > 24 && (i & 1)) continue; pj(d, s.lat); const a = alphaAt(_p); if (a <= 0) continue; const e = s.e, sz = e.sz * _p; g.globalAlpha = a;
        if (e.shadow !== false && _p > .22) shadowAt(g, _x, _y, sz * (e.sw || .8), .5 * a); g.globalAlpha = a;
        blitArt(g, e.art, 190, _x, _y, sz);
        if (e.glow && T.night && _p > .1) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .9; const gr = sz * e.glow; g.drawImage(G.glowSprite('255,214,120'), _x - gr / 2, _y - sz * (e.gy || .8) - gr / 2, gr, gr); g.globalCompositeOperation = 'source-over'; }
      }
      g.globalAlpha = 1;
    }
    /* arrival scene: the hero turns to face us; the one we ran to (Nana / Baba / Ofa) comes out, the carried thing is handed over, hearts + confetti */
    function drawFinale(g, hx) {
      const gg = GOAL, who = gg.who && C.defs[gg.who] ? gg.who : null, t = S.cheerT, e = U.ease.outCubic(clamp(t / .5, 0, 1)), hx2 = who ? hx - 62 * e : hx, k0 = C.height ? RHk(S.hero) : 1;
      g.globalAlpha = .9; g.drawImage(G.shadowSprite(), hx2 - 54, FY - 11, 108, 32); g.globalAlpha = 1;
      C.draw(g, S.hero, hx2, FY, { anim: t > 1.7 ? 'cheer' : 'cheer', t, dir: 1, sc: k0, noShadow: true, key: 'rn_' + S.hero });
      if (!who) return; const hk = M.runnerHero.height(S.hero) * .98 / C.height(who), m = clamp(t / 1.1, 0, 1), em = U.ease.outCubic(m), tx = hx + 78, px = lerp(S.gx, tx, em), py = lerp(S.gy, FY, em), sc = hk * lerp(S.gp * .9, 1, em);
      g.globalAlpha = .9 * em; g.drawImage(G.shadowSprite(), px - 50 * sc / hk, py - 10, 100 * sc / hk, 30); g.globalAlpha = 1;
      C.draw(g, who, px, py, { anim: m < 1 ? 'run' : 'cheer', t, dir: -1, sc, noShadow: true, key: 'rn_goal_' + who });
      const give = gg.give || o.carry;
      if (give && t > 1.2) { const u = clamp((t - 1.2) / .7, 0, 1); if (u < 1) { const x0 = hx2 + 28, y0 = FY - 76, x1 = px - 22, y1 = FY - 84, x = lerp(x0, x1, u), y = lerp(y0, y1, u) - Math.sin(u * Math.PI) * 70; blitArt(g, give, 64, x, y + 26, 54); } else { if (!S.gave) { S.gave = 1; AU.sfx('power'); st.burst(px - 10, FY - 120, { n: 10, kind: 'heart' }); st.reward(px, FY - 100); } blitArt(g, give, 64, px - 22, FY - 54, 44); } }
    }
    const RHk = id => M.runnerHero.height(id) / C.height(id) * 1.02;
    /* ally: a second hero (back view) jogging along the shoulder of the road, on the side with free space */
    function pickAlly() { let a = o.ally; if (!a) return null; if (a === true || !C.defs[a] || a === S.hero) { a = ['aboody', 'moody', 'toota', 'nemo'].find(k => k !== S.hero && C.defs[k]); } return a; }
    function drawAlly(g) {
      if (!S.ally || S.phase === 'pick') return; const side = S.tx <= 0 ? 1 : -1; S.allyLat += (side * 1.95 - S.allyLat) * .06; pj(.7, S.allyLat);
      const pose = S.cheer ? 'cheer' : S.stumble > .1 ? 'jump' : (S.phase === 'count' || S.v < .6) ? 'idle' : S.y > .1 ? 'jump' : 'run';
      g.globalAlpha = .8; g.drawImage(G.shadowSprite(), _x - 40 * _p, _y - 6 * _p, 80 * _p, 24 * _p); g.globalAlpha = 1;
      M.runnerHero.draw(g, S.ally, _x, _y - (pose === 'jump' && S.y > .1 ? S.y * UH * .5 * _p : 0), { pose, ph: S.ph + .37, t: S.t, sc: _p * .92, lean: 0 });
    }
    function drawHero(g) {
      drawAlly(g);
      const hx = heroX(), air = S.y * UH * .86, HR = HEROES[S.hero]; const fy = FY - air, pose = S.cheer ? 'cheer' : S.stumble > 0 ? 'stumble' : (S.roll > 0 ? 'roll' : (S.y > .03 || S.boost > 0) ? 'jump' : (S.phase === 'count' || (S.phase === 'finish' && S.v < .6)) ? 'idle' : 'run');
      const al = S.inv > 0 && S.boost <= 0 && S.stumble <= 0 ? (((S.t * 10) | 0) & 1 ? .45 : 1) : (S.inv > 0 && S.stumble > 0 ? (((S.t * 10) | 0) & 1 ? .6 : 1) : 1);
      g.globalAlpha = .9 * clamp(1 - S.y * .55, .35, 1) * (S.roll > 0 ? .8 : 1); const sw = 108 * (1 - S.y * .22); g.drawImage(G.shadowSprite(), hx - sw / 2, FY - sw * .1, sw, sw * .3); g.globalAlpha = 1;
      if (S.cheer) { drawFinale(g, hx); return; }
      const t = S.t, spinP = S.roll > 0 ? 1 - S.roll / HR.roll : 0, dblP = S.dbl ? clamp(S.dblT / .45, 0, 1) : 0;
      if (S.boost > 0) { g.globalAlpha = .5; g.drawImage(G.glowSprite('255,170,70'), hx - 90, fy - 150, 180, 220); g.globalAlpha = 1; }
      M.runnerHero.draw(g, S.hero, hx, fy, { pose, ph: S.ph, t: S.phase === 'count' ? S.countT : t, lean: clamp((S.tx - S.x) * 1.6, -1, 1), alpha: al, rocket: S.boost > 0, dbl: dblP, spin: spinP, carry: o.carry, stars: S.stumble > .1 && S.stumble < .85 });
      if (S.shield > 0) { const r = 78 + 3 * Math.sin(S.t * 6); g.globalAlpha = .55; g.drawImage(G.glowSprite('130,180,255'), hx - r, fy - 70 - r * .9, r * 2, r * 2); g.globalAlpha = .8; g.strokeStyle = '#d6e8ff'; g.lineWidth = 3; g.beginPath(); g.ellipse(hx, fy - 62, 50, 70, 0, 0, TAU); g.stroke(); g.globalAlpha = 1; }
    }
    function bgDraw(g, t, stage) {
      KQ = kq(); if (!BG || BGK !== KQ) bakeBG(); perfWatch(); const LT = lite || R.lite;
      const SKP = R.skip;   // profiling switches (tools/runner_perf.js): R.skip = {bg, road, scen, objs, hero}
      if (!SKP.bg) g.drawImage(BG, 0, 0, W, H);
      if (!SKP.bg && !LT) for (let i = 0; i < LAY.length; i++) { const L = LAY[i], sx = (FX.motion ? -S.cam * 55 * L.k : 0) - 70; g.drawImage(L.c, sx, L.y, L.w, L.h); }
      if (T.clouds !== false && !SKP.bg && !LT) { if (!CLD) bakeClouds(); for (let i = 0; i < 4; i++) { const cs = CLD[i % 3], x = ((i * 330 + (FX.motion ? S.t : 0) * (5 + i * 2.5)) % 1300) - 200 - S.cam * 16; g.globalAlpha = T.cloudA || .92; g.drawImage(cs, x, 70 + (i % 3) * 22 - (i === 3 ? 28 : 0), 210 - i * 14, 96 - i * 6); } g.globalAlpha = 1; }
      if (!SKP.road) drawRoad(g, LT); if (!SKP.scen) drawScenery(g, LT);
      if (T.night) { g.fillStyle = T.night; g.fillRect(0, HZ - 4, W, H); }
      // objects: far -> near, hero between
      let hi = iLo; while (hi < objs.length && objs[hi].z < S.z + 88) hi++;
      let hd = false; if (!SKP.objs) for (let i = hi - 1; i >= iLo; i--) { const e = objs[i]; if (!hd && e.z - S.z <= .05 && e.k !== 'g' && e.k !== 'f') { if (!SKP.hero) drawHero(g); hd = true; } drawObj(g, e); }
      if (!hd && !SKP.hero) drawHero(g);
      // dust
      if (!LT) for (let i = 0; i < dust.length; i++) { const d = dust[i]; if (d.a > 0) { g.globalAlpha = Math.min(.35, d.a * .5); g.fillStyle = T.dust || '#f3e6cf'; g.beginPath(); g.arc(d.x, d.y, d.r, 0, TAU); g.fill(); } } g.globalAlpha = 1;
      for (let i = 0; i < flyCoins.length; i++) { const f = flyCoins[i]; if (f.a) { g.globalAlpha = 1 - f.t / .9; g.drawImage(COIN[((f.t * 20) | 0) % 12], f.x - 14, f.y - 14, 28, 28); } } g.globalAlpha = 1;
      if (FX.motion && !LT && (S.boostK > .05 || S.v > 11.5)) { const a = S.boostK * .34 + Math.max(0, S.v - 11.5) * .03; g.strokeStyle = 'rgba(255,255,255,' + a.toFixed(2) + ')'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 14; i++) { const an = (i / 14) * TAU + (((S.t * 3) | 0) * .7), r0 = 250 + ((i * 53) % 90), r1 = r0 + 90 + S.boostK * 120; g.moveTo(CX + Math.cos(an) * r0 * 1.3, 300 + Math.sin(an) * r0 * .85); g.lineTo(CX + Math.cos(an) * r1 * 1.3, 300 + Math.sin(an) * r1 * .85); } g.stroke(); }
      if (S.flash2 > 0) { g.fillStyle = 'rgba(255,255,255,' + Math.min(.8, S.flash2) + ')'; g.fillRect(0, 0, W, H); S.flash2 -= .03; }
      if (S.flash > 0) { g.fillStyle = 'rgba(255,120,150,' + (S.flash * .35) + ')'; g.fillRect(0, 0, W, H); }
    }
    /* HUD pass (canvas): progress bar, counters, answer rail, bubbles, countdown, tutorial hints */
    let lite = false, emaDt = 16.7, lastFt = 0, slowN = 0;   // adaptive quality: a slow device (frames > 27 ms for ~2 s) switches to 'lite' (no far layers / clouds / dust / speed lines, shorter + sparser scenery, fewer road bands)
    function perfWatch() { const now = performance.now(); if (lastFt) { const d = now - lastFt; if (d < 250) emaDt += (d - emaDt) * .05; } lastFt = now; if (!lite && !R.lite && S.phase === 'run' && !M.paused) { if (emaDt > 27) { if (++slowN > 120) { lite = true; R.liteAuto = true; } } else if (slowN > 0) slowN--; } }
    let hudDraw = function (g, t) {
      if (S.phase === 'pick') return;
      const pct = clamp(S.z / S.L, 0, 1), bx = 330, bw = 300, by = 112, bh = 16;
      g.save(); G.fillRR(g, bx - 4, by - 3, bw + 8, bh + 6, 12, 'rgba(255,255,255,.88)', 3);   // track (RTL: starts on the right, goal on the left)
      G.fillRR(g, bx + bw - bw * pct, by, Math.max(10, bw * pct), bh, 8, '#5cc96b', 0);
      for (let i = 0; i < objs.length; i++) { const e = objs[i]; if (e.k === 'f' || e.k === 'g') { const fx = bx + bw - bw * (e.z / S.L); g.fillStyle = e.k === 'g' ? '#4a8dff' : '#ef5350'; g.fillRect(fx - 2, by - 5, 4, bh + 10); } }
      g.restore();
      const gi = o.goal && o.goal.icon ? o.goal.icon : null; if (gi) { const gx = bx - 18, bob = Math.sin(S.t * 4) * 2; G.circ(g, gx, by + 8, 21, '#fff', 3); A.draw(g, gi, gx, by + 8 + bob, 34); }
      const hxp = bx + bw - bw * pct, def = C.defs[S.hero]; G.circ(g, hxp, by + 8, 15, def.badge[1], 3); G.text(g, def.badge[0], hxp, by + 9, { size: 19, color: '#fff', stroke: M.OL, sw: 4 });
      // counters (left)
      g.save(); G.fillRR(g, 18, 100, 118, 34, 17, 'rgba(255,255,255,.9)', 3); A.draw(g, 'coin', 40, 117, 28); G.text(g, U.ar(S.coins), 92, 118, { size: 26, color: M.pal.ink }); g.restore();
      if (nParts) { for (let i = 0; i < nParts; i++) { const full = i < S.parts, x = 40 + i * 46; G.circ(g, x, 166, 20, full ? '#fff6c8' : 'rgba(255,255,255,.55)', 3); g.globalAlpha = full ? 1 : .35; A.draw(g, o.part.art, x, 166, 30); g.globalAlpha = 1; } }
      // power-up timers (right)
      let py = 104; for (let q = 0; q < 3; q++) { const nm = PU_KEYS[q], tv = q === 0 ? S.magnet : q === 1 ? S.shield : S.boost, tm = PU_MAX[q]; if (tv > 0) { const c = PU[nm] || bakePU(nm); g.drawImage(c, 880, py - 14, 44, 44); g.strokeStyle = '#fff'; g.lineWidth = 5; g.beginPath(); g.arc(902, py + 8, 24, -Math.PI / 2, -Math.PI / 2 + TAU * Math.min(1, tv / tm)); g.stroke(); py += 52; } }
      // answer rail
      if (curGate && !curGate.done) {
        const dd = curGate.z - S.z; if (dd < 70) { const al = clamp((70 - dd) / 14, 0, 1) * clamp((dd - 4) / 8, 0, 1); g.globalAlpha = al; for (let li = 0; li < 3; li++) { const an = curGate.ans[li]; an.dead = curGate.dead[li]; const cv = boardOf(g, an, li, curGate.hl && an.correct), cur = Math.round(S.x) === li - 1, w = cur ? 176 : 156, hh = w * cv.height / cv.width, cx = CX + (li - 1) * 190; g.drawImage(cv, cx - w / 2, 142 + (cur ? -4 : 0), w, hh); if (cur) { g.strokeStyle = '#fff'; g.lineWidth = 4; G.rr(g, cx - w / 2 - 2, 138, w + 4, hh + 4, 22); g.stroke(); } } g.globalAlpha = 1; }
      }
      // hero bubble
      if (S.bubT > 0 && S.bubble) { const b = S.bubble, a = clamp(S.bubT * 3, 0, 1), cw = b.cv.width * .86, chh = b.cv.height * .86, x = clamp(heroX(), cw / 2 + 20, W - cw / 2 - 20), y = FY - RHh() - 26; g.save(); g.globalAlpha = a; G.fillRR(g, x - cw / 2 - 6, y - chh / 2 - 8, cw + 12, chh + 14, 18, '#fff', 3.5); g.drawImage(b.cv, x - cw / 2, y - chh / 2 - 2, cw, chh); g.restore(); }
      if (S.bannerT > 0 && S.banner) { const a = clamp(S.bannerT * 3, 0, 1), k = 1 + (1 - clamp((1.4 - S.bannerT) * 5, 0, 1)) * .25, c = S.banner; g.save(); g.globalAlpha = a; g.translate(CX, 250); g.scale(k, k); g.drawImage(c, -c.width / 2, -c.height / 2); g.restore(); }
      if (S.phase === 'count') { const n = Math.floor(S.countT / .9), fr = (S.countT / .9) % 1, str = n < 3 ? U.ar(3 - n) : 'يلا!', sz = n < 3 ? 150 : 110, c = txtCv(str, sz, '#fff', M.OL), k = .8 + .5 * (1 - fr) * (1 - fr); g.save(); g.globalAlpha = clamp(1.4 - fr * 1.1, 0, 1); g.translate(CX, 250); g.scale(k, k); g.drawImage(c, -c.width / 2, -c.height / 2); g.restore(); }
      // tutorial hints (shown until the child has done it once)
      if (S.phase === 'run' && S.t > 1.5) {
        let msg = null; if (!tutor.done.lane && S.t < 14) msg = ['اسحب شمال أو يمين', 0]; else if (!tutor.done.jump && S.t > 4) { const n = d2(); if (n && n.type !== 'bar' && n.dist < 22) msg = ['اسحب لفوق عشان تنط', 1]; } else if (!tutor.done.roll) { const n = d2(); if (n && n.type === 'bar' && n.dist < 24) msg = ['اسحب لتحت عشان تتزحلق', 2]; }
        if (msg && !tutor.spoke[msg[1]]) { tutor.spoke[msg[1]] = 1; M.voice.speak(msg[0], { speaker: 'narrator', soft: true }); }
        if (msg) { const c = txtCv(msg[0], 30, '#fff', '#2a4a8a'), a = .75 + .25 * Math.sin(S.t * 6); g.save(); g.globalAlpha = a; G.fillRR(g, CX - c.width / 2 - 8, 236 - 6, c.width + 16, c.height + 6, 16, 'rgba(30,50,110,.55)', 0); g.drawImage(c, CX - c.width / 2, 236); const ax = CX, ay = 236 + c.height + 28; g.strokeStyle = '#fff'; g.lineWidth = 7; g.lineCap = 'round'; g.lineJoin = 'round'; const mv = (S.t * 2 % 1) * 30; g.beginPath(); if (msg[1] === 0) { g.moveTo(ax - 40 + mv, ay); g.lineTo(ax + 40 - mv * 0, ay); g.moveTo(ax + 20, ay - 16); g.lineTo(ax + 42, ay); g.lineTo(ax + 20, ay + 16); } else if (msg[1] === 1) { g.moveTo(ax, ay + 24 - mv); g.lineTo(ax, ay - 20); g.moveTo(ax - 16, ay - 4); g.lineTo(ax, ay - 24); g.lineTo(ax + 16, ay - 4); } else { g.moveTo(ax, ay - 24 + mv); g.lineTo(ax, ay + 20); g.moveTo(ax - 16, ay + 4); g.lineTo(ax, ay + 24); g.lineTo(ax + 16, ay + 4); } g.stroke(); g.restore(); if (msg[1] === 1 || msg[1] === 2) tutor.show = 1; }
      }
    };
    function d2() { return dbg.nextObstacle; }
    function RHh() { return M.runnerHero.height(S.hero) * 1.12 + S.y * UH * .86; }

    /* ---------------------------------------------------------------- hero picker (DOM) -> countdown */
    function pickerUI() {
      return new Promise(res => {
        const ids = heroIds; let sel = S.hero; const cards = {};
        const defAssist = id => (C.defs[id].age || 9) <= 7, assistVal = () => (typeof M.save.data.settings.runAssist === 'boolean' ? M.save.data.settings.runAssist : defAssist(sel));
        const panel = h('div', { class: 'panel rnpick', role: 'dialog', 'aria-label': 'اختار البطل' }, h('div', { class: 'rn-t' }, 'اختار البطل بتاعك'), h('div', { class: 'rn-cards' }));
        const cardsEl = panel.querySelector('.rn-cards');
        const assistBtn = h('button', { class: 'btn sm teal rn-assist', 'data-act': 'assist', onclick: () => { M.save.data.settings.runAssist = !assistVal(); M.save.commit(); M.audio.sfx('tap'); paint(); } });
        const startBtn = UI.btn('يلا نجري!', 'green big shine', () => go(), 'play'); startBtn.setAttribute('id', 'rn-start'); startBtn.dataset.act = 'start';
        function paint() { ids.forEach(id => cards[id].classList.toggle('on', id === sel)); assistBtn.textContent = assistVal() ? 'مساعدة: شغّالة ✓' : 'مساعدة: مقفولة'; assistBtn.classList.toggle('green', assistVal()); assistBtn.classList.toggle('gray', !assistVal()); }
        ids.forEach(id => {
          const d = C.defs[id], nm = M.save.data.names[id] || d.name, face = d.img ? h('img', { src: C.avatar(id) + '?v=1', alt: '' }) : A.el('face:' + id, 78);
          const c = h('button', { class: 'rn-card', 'data-hero': id, 'aria-label': nm + ': ' + HEROES[id].desc, onclick: () => { sel = id; paint(); M.audio.sfx('pop'); const hh = HEROES[id]; M.voice.speak(hh.say, { speaker: id }); } }, face, h('b', null, nm), h('small', null, HEROES[id].desc));
          if (o.rec && o.rec.hero === id) c.append(h('i', { class: 'rn-rec' }, 'مناسب للمرحلة'));
          cards[id] = c; cardsEl.append(c);
        });
        panel.append(h('div', { class: 'rn-row' }, assistBtn, startBtn), h('div', { class: 'rn-note' }, o.rec && o.rec.why ? o.rec.why : 'المساعدة: جري أبطأ شوية وتصادم أسهل'));
        if (o.rec && o.rec.why) setTimeout(() => { if (S.phase === 'pick') M.voice.speak(o.rec.why, { speaker: 'narrator', soft: true }); }, 3200);
        UI.over.append(panel); cl(() => panel.remove()); paint();
        function go() { if (S.phase !== 'pick') return; S.hero = sel; S.assist = assistVal(); st.setActive(sel, true); panel.remove(); M.audio.sfx('tap'); res(); }
      });
    }
    /* ---------------------------------------------------------------- start */
    cl(st.addLayer({ z: 60, update: null, draw: (g, t) => hudDraw(g, t) }));
    cl(st.addLayer({ z: 5, update, draw: null }));
    st.bg = bgDraw; st.showActive = false; cl(() => { st.bg = oldBg; st.input = null; st.dbg = null; st.showActive = true; try { UI.hud.showSwitch(true); } catch (e) { } });
    if (o.pick !== false) ctx.prompt('اختار البطل بتاعك واضغط يلا نجري');
    S.countT = 0; S.cdn = -1;
    const stopMusic = startMusic(S, () => T.music); cl(stopMusic);
    M.runnerHero.warm(heroIds.concat(o.ally && C.defs[o.ally] ? [o.ally] : []));
    (async () => {
      if (o.pick === false) { S.hero = o.hero || S.hero; S.assist = typeof M.save.data.settings.runAssist === 'boolean' ? M.save.data.settings.runAssist : (C.defs[S.hero].age || 9) <= 7; st.setActive(S.hero, true); } else await pickerUI();
      if (finished) return; S.ally = pickAlly(); if (S.ally) { try { M.runnerHero.warm([S.ally]); } catch (e) { } } build(); sI = 0; S.tx = 0; S.x = 0; S.v = 0; S.phase = 'count'; S.countT = 0; S.cdn = -1; ctx.prompt(M.fmt(o.prompt || 'اجري للهدف!'));
      if (o.say && o.say.start) { const l = o.say.start; M.voice.speak(l[1], { speaker: l[0], soft: true }); S.startBub = { who: l[0], str: l[1], cv: txtCv(l[1], 24, '#3a2a1e', '#fff') }; } else { M.voice.speak('جاهزين؟ يلا نجري!', { speaker: S.hero, soft: true }); }
      if (o.onStart) try { o.onStart(S); } catch (e) { }
    })();
  }

  /* parents' panel: tri-state switch for the runner assist mode (auto by age / on / off), added without editing engine/ui.js */
  (function () {
    const P0 = UI.parent; if (!P0 || P0.__rn) return;
    UI.parent = function (f) {
      const r = P0.apply(this, arguments);
      try {
        const names = Array.from(document.querySelectorAll('button')).find(b => /تغيير الأسماء/.test(b.textContent)), row = names && names.parentElement; if (!row || !row.parentElement) return r;
        const sd = M.save.data, lab = () => 'مساعدة سباق المغامرة: ' + (typeof sd.settings.runAssist === 'boolean' ? (sd.settings.runAssist ? 'شغّالة' : 'مقفولة') : 'تلقائي حسب السن');
        const b = h('button', { class: 'btn sm teal', 'data-act': 'runassist', onclick: () => { const v = sd.settings.runAssist; if (v === undefined) sd.settings.runAssist = true; else if (v === true) sd.settings.runAssist = false; else delete sd.settings.runAssist; M.save.commit(); b.textContent = lab(); M.audio.sfx('tap'); } }, lab());
        row.parentElement.insertBefore(h('div', { class: 'row', style: 'margin:6px 0;flex-wrap:wrap' }, b), row.nextSibling);
      } catch (e) { }
      return r;
    };
    UI.parent.__rn = 1;
  })();
  K.runner3d = runner3d;
  /* backward compatible: the old side-scrolling kit keeps its name; new-style options (theme / plan / runner3d) start the 3-lane kit */
  const oldRunner = K.runner;
  K.runner = function (ctx, o, done, cl) { if (o && (o.theme || o.plan || o.runner3d || o.length)) return runner3d(ctx, o, done, cl); return oldRunner(ctx, o, done, cl); };
  K.run3 = runner3d;
})();
