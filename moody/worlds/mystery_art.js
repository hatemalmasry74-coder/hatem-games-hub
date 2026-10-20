/* Moody & Aboody - worlds/mystery_art.js : canvas art of WORLD 12 "لغز البيت القديم" (id 'mystery').
   Cosy, spooky-FUN-but-never-scary: warm lamp / candle light, plum + orange dusk, moonbeams, floating dust, fireflies.  Nothing dark hides anything: every room stays readable.
   World-card icon: w_mystery.   Rooms (Moody.rooms): mys_living mys_hall mys_attic mys_garden mys_pantry.   Props / stickers: every art name starts with mys_.
   The friendly round "ghost" is the art  mys_bobo[:shy|happy|surprised|sleepy|wave|peek]  (also used as the dialog portrait: icon:'mys_bobo:happy').
   Room flags (stage.state): living  lampK (0..1 live, table lamp), candle (0..1 live), dim (darker dusk), party (string lights, banner, table), cat (kitten on the sofa arm)
                             hall    shutter (amplitude 0..1 live), curtainCat (kitten peeks from the curtain)
                             attic   sheet (1 = armchair under the sheet), box (0 closed, 1 open), trunk (1 open)
                             garden  owl (owl on the branch), key (key hanging on the lower branch)
                             pantry  jar (1 = a jar rolled on the floor)
   Ambient kinds added here:  mysfly (fireflies), mysflame (candle flame), mysshutter (a loose shutter swinging in the wind).   Load before worlds/mystery.js. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {}, rr = G.fillRR, RK = G.room, K = G.amb.kinds, rnd = G.rand;
  const PLUM = '#5b4a7a';   // soft outline of the friendly ghost

  /* ---------------- extra views: dusk window (first star, tree silhouettes) and a moonlit night ---------------- */
  G.views.mysdusk = (c, x, y, w, h) => {
    G.sky(c, x, y, w, h, ['#4a3f86', '#b0568a', '#f59a6c', '#ffd79a']); G.glowAt(c, x + w * .3, y + h * .86, h * .8, '255,190,120', .85);
    G.hills(c, x - 20, w + 40, y + h * .84, h * .16, '#4a3a6a', 4, '#5d4a80'); G.blobTrees(c, x - 10, w + 20, y + h * .9, '#3a2c58', 6, h * .2);
    c.fillStyle = '#fff2c4'; [[.2, .14], [.55, .08], [.8, .2], [.38, .3]].forEach((p, i) => { c.beginPath(); c.arc(x + w * p[0], y + h * p[1], 1.4 + i % 2, 0, 6.2832); c.fill(); });
    c.fillStyle = '#ffe9b0'; c.beginPath(); c.arc(x + w * .78, y + h * .3, h * .07, 0, 6.2832); c.fill(); c.fillStyle = '#b0568a'; c.beginPath(); c.arc(x + w * .78 + h * .035, y + h * .3 - h * .01, h * .065, 0, 6.2832); c.fill();
  };
  G.views.mysnight = (c, x, y, w, h) => {
    G.sky(c, x, y, w, h, ['#10163f', '#26357a', '#4a5fa8']); G.glowAt(c, x + w * .7, y + h * .3, h * .8, '200,215,255', .6);
    c.fillStyle = '#f7f3dc'; c.beginPath(); c.arc(x + w * .7, y + h * .3, h * .13, 0, 6.2832); c.fill(); c.fillStyle = 'rgba(190,200,230,.5)'; [[-.04, -.02, .025], [.03, .04, .02], [.02, -.05, .015]].forEach(p => { c.beginPath(); c.arc(x + w * .7 + h * p[0], y + h * .3 + h * p[1], h * p[2], 0, 6.2832); c.fill(); });
    G.hills(c, x - 20, w + 40, y + h * .86, h * .14, '#1c2a58', 7, '#2a3a70'); G.blobTrees(c, x - 10, w + 20, y + h * .92, '#16204a', 9, h * .18);
    c.fillStyle = '#fffbe0'; for (let i = 0; i < 14; i++) { const r = rnd(i + 3); c.beginPath(); c.arc(x + r() * w, y + r() * h * .5, .9 + r() * 1.3, 0, 6.2832); c.fill(); }
  };

  /* ---------------- ambient kinds ---------------- */
  const lv = v => { v = typeof v === 'function' ? v() : v; return v == null ? 1 : v; };   // spec value or live getter (the state keys listed in `live` change without a re-bake)
  K.mysfly = {
    z: 'top', opt: true, draw(g, t, sp) {
      const gs = G.glowSprite('210,255,130'), n = sp.n || 8; if (!sp._p) { const r = rnd(sp.seed || 5); sp._p = []; for (let i = 0; i < n; i++) sp._p.push([r(), r(), .5 + r(), r() * 6.3, 1.4 + r() * 1.6]); }
      g.save(); g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < sp._p.length; i++) {
        const p = sp._p[i], x = sp.x0 + (sp.x1 - sp.x0) * (p[0] + Math.sin(t * .35 * p[2] + p[3]) * .05), y = sp.y0 + (sp.y1 - sp.y0) * (p[1] + Math.cos(t * .27 * p[2] + p[3] * 1.3) * .06), a = .35 + .65 * Math.max(0, Math.sin(t * 1.1 * p[2] + p[3]));
        g.globalAlpha = (t ? a : .7) * .85; g.drawImage(gs, x - p[4] * 5, y - p[4] * 5, p[4] * 10, p[4] * 10); g.globalAlpha = (t ? a : .7); g.fillStyle = '#f4ffc0'; g.beginPath(); g.arc(x, y, p[4] * .55, 0, 6.2832); g.fill();
      }
      g.restore();
    }
  };
  K.mysflame = {
    z: 'mid', draw(g, t, sp) {
      const k = lv(sp.lit); if (k <= .01) return; const sw = Math.sin(t * 9 + (sp.ph || 0)) * 1.6 + Math.sin(t * 3.3) * 1.2, h = (sp.h || 15) * (1 + .08 * Math.sin(t * 11)) * k, w = (sp.w || 6) * k;
      g.save(); g.translate(sp.x, sp.y); g.beginPath(); g.moveTo(-w, 0); g.quadraticCurveTo(-w * 1.1, -h * .5, sw, -h); g.quadraticCurveTo(w * 1.1, -h * .5, w, 0); g.quadraticCurveTo(0, w * .9, -w, 0); g.closePath();
      g.fillStyle = '#ffb23c'; g.fill(); g.beginPath(); g.moveTo(-w * .5, -1); g.quadraticCurveTo(-w * .5, -h * .4, sw * .6, -h * .62); g.quadraticCurveTo(w * .5, -h * .4, w * .5, -1); g.closePath(); g.fillStyle = '#fff3a0'; g.fill(); g.restore();
    }
  };
  K.mysshutter = {
    z: 'mid', draw(g, t, sp) {
      const a = sp.a0 + Math.sin(t * 1.35 + (sp.ph || 0)) * sp.amp * lv(sp.lit) + Math.sin(t * 3.1) * sp.amp * .12, w = sp.w, h = sp.h;
      g.save(); g.translate(sp.x, sp.y); g.scale(Math.cos(a), 1);   // hinged panel: width foreshortens as it swings
      g.fillStyle = G.lin(g, 0, 0, 0, h, ['#7aa8a0', '#5d8a86']); g.fillRect(0, 0, w * sp.dir, h);
      g.strokeStyle = 'rgba(30,50,60,.55)'; g.lineWidth = 2; g.strokeRect(0, 0, w * sp.dir, h);
      for (let i = 1; i < 7; i++) { g.fillStyle = 'rgba(255,255,255,.28)'; g.fillRect(4 * sp.dir + (sp.dir < 0 ? -w + 8 : 0), h * i / 7, w * sp.dir - 8 * sp.dir, 3); g.fillStyle = 'rgba(20,40,50,.25)'; g.fillRect(4 * sp.dir + (sp.dir < 0 ? -w + 8 : 0), h * i / 7 + 4, w * sp.dir - 8 * sp.dir, 2); }
      g.restore();
    }
  };

  /* ---------------- small helpers ---------------- */
  function wall(g, y1, c1, c2, o) { RK.wall(g, y1, c1, c2, Object.assign({ pattern: 'stripes', pw: 80 }, o)); }
  function glow(g, s, x, y, r, a, col, flick) { G.amb(s, { k: 'glow', x, y, r, col: col || '255,214,140', a: a == null ? .45 : a, flick: flick || 0, z: 'top' }); }
  function dust(g, s, x, y, w, h, n, seed) { G.amb(s, { k: 'dust', box: [x, y, w, h], n: n || 14, z: 'top', seed: seed || 3 }); }
  function bookRow(g, x, y, w, h, seed) {
    const r = rnd(seed), cols = ['#c0504d', '#4a8dff', '#5cc96b', '#ffc93c', '#8a6bd6', '#ff8a2a', '#1fb5a6', '#ff6f91']; let xx = x;
    while (xx < x + w - 12) { const bw = 9 + r() * 8, bh = h * (.65 + r() * .32), c = cols[Math.floor(r() * cols.length)]; rr(g, xx, y + h - bh, bw, bh, 2, c, 1.8); G.line(g, xx + bw / 2, y + h - bh + 6, xx + bw / 2, y + h - 6, 1.4, 'rgba(255,255,255,.4)'); xx += bw + 1; }
  }
  /* a table lamp: k 0..1 = how bright */
  function lampShade(g, x, y, k) { G.fillRR(g, x - 5, y + 14, 10, 46, 3, '#8a5a3a', 3); G.fillRR(g, x - 20, y + 56, 40, 10, 5, '#8a5a3a', 3); G.poly(g, [[x - 26, y + 18], [x + 26, y + 18], [x + 17, y - 18], [x - 17, y - 18]], G.mix('#a89a84', '#fff0b0', k), 3.5); }
  const landscape = (g, x, y, w, h) => { G.sky(g, x, y, w, h, ['#ffd79a', '#f59a6c']); G.circ(g, x + w * .7, y + h * .35, h * .16, '#fff2c4', 0); g.fillStyle = '#7a5aa0'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + w * .35, y + h * .45); g.lineTo(x + w * .7, y + h); g.fill(); g.fillStyle = '#5d4a80'; g.beginPath(); g.moveTo(x + w * .4, y + h); g.lineTo(x + w * .75, y + h * .55); g.lineTo(x + w, y + h); g.fill(); };
  const boatPic = (g, x, y, w, h) => { G.sky(g, x, y, w, h, ['#bfe5ff', '#fdf2d6']); g.fillStyle = '#4aa8e8'; g.fillRect(x, y + h * .6, w, h * .4); G.poly(g, [[x + w * .3, y + h * .62], [x + w * .7, y + h * .62], [x + w * .62, y + h * .8], [x + w * .38, y + h * .8]], '#ef5350', 2); G.poly(g, [[x + w * .5, y + h * .2], [x + w * .5, y + h * .6], [x + w * .74, y + h * .6]], '#fff', 2); };
  const flowerPic = (g, x, y, w, h) => { g.fillStyle = '#f6e6c8'; g.fillRect(x, y, w, h); for (let i = 0; i < 3; i++) { const fx = x + w * (.25 + i * .25), fy = y + h * (.4 + (i % 2) * .1); G.line(g, fx, fy, fx, y + h * .9, 2, '#3f9a4f'); for (let k = 0; k < 5; k++) { const a = k * 1.2566; G.circ(g, fx + Math.cos(a) * 7, fy + Math.sin(a) * 7, 5, ['#ff6f91', '#ffc93c', '#8a6bd6'][i], 1); } G.circ(g, fx, fy, 4, '#fff7a8', 0); } };

  M.look.setAll({
    mys_living: s => ({ tod: s.state.party ? 'warm' : s.state.dim ? 'sunset' : 'evening', floor: 430, lightX: 430, vig: s.state.party ? .24 : .32, live: ['lampK', 'candle'] }),
    mys_hall: { tod: 'sunset', floor: 430, lightX: 800, vig: .32, live: ['shutter'] },
    mys_attic: { tod: 'cool', floor: 430, lightX: 480, vig: .36, live: [] },
    mys_garden: { tod: 'night', floor: 400, indoor: false, lightX: 700, vig: .3, live: ['shutter'] },
    mys_pantry: { tod: 'warm', floor: 430, lightX: 760, vig: .36, live: [] }
  });

  /* ================================================================
     ROOM mys_living : living room at dusk.  flags: lampK(live) candle(live) dim party cat
     Landmarks: big window (330-530, 80-250), bookshelf (40-190), dresser + lamp (770-930), sofa (300-560), candle table (640-700, y 340), rug centre
     ================================================================ */
  R.mys_living = function (g, t, s) {
    const S = s.state; wall(g, 430, '#f0d3d2', '#d8a8ae', { dado: { h: 70, c: '#9a6a58' } });
    RK.floor(g, 430, '#a8764a', '#76482c', { kind: 'wood' });
    G.window(g, s, 330, 80, 200, 170, { view: 'mysdusk', frame: '#f5e6d0', curtains: '#8a5aa6', cw: 46, floor: 430, dir: .55, tod: 'sunset', shaftA: .2 });
    RK.frame(g, 570, 96, 110, 78, { frame: '#c8935a', bg: '#fff', draw: landscape }); RK.frame(g, 208, 110, 70, 90, { frame: '#c8935a', bg: '#fff', draw: flowerPic });
    // bookshelf
    rr(g, 38, 108, 154, 322, 6, '#8a5a3a', 4.5); [0, 1, 2, 3].forEach(i => { const y = 122 + i * 76; g.fillStyle = 'rgba(30,12,0,.32)'; g.fillRect(48, y, 134, 66); bookRow(g, 50, y + 2, 130, 62, 5 + i); rr(g, 44, y + 64, 142, 8, 2, '#b97b4a', 2.5); });
    A.draw(g, 'teddy', 150, 108, 46);
    // dresser + table lamp
    G.ao(g, 770, 330, 160, 100); rr(g, 770, 330, 160, 100, 6, '#b97b4a', 4.5); [0, 1].forEach(i => { rr(g, 780 + i * 76, 342, 66, 76, 4, '#c8935a', 3); G.circ(g, 813 + i * 76, 380, 4.5, '#ffd23c', 2); }); rr(g, 764, 322, 172, 14, 5, '#d9a566', 4);
    // armchair
    G.ao(g, 600, 340, 130, 92); rr(g, 606, 300, 118, 100, 24, '#a85a6a', 4.5); rr(g, 590, 346, 150, 56, 18, '#c46a7c', 4.5); rr(g, 590, 330, 30, 74, 14, '#b05a6c', 4); rr(g, 710, 330, 30, 74, 14, '#b05a6c', 4); G.fillRR(g, 598, 400, 12, 30, 3, '#6a3a22', 2.5); G.fillRR(g, 720, 400, 12, 30, 3, '#6a3a22', 2.5); G.fillRR(g, 636, 340, 60, 22, 10, '#ffc93c', 3);
    RK.rug(g, 440, 478, 300, 36, '#7a5aa0', '#d9c0ee', { star: true });
    A.draw(g, 'sofa', 400, 378, 290); G.fillRR(g, 292, 330, 40, 30, 10, '#ffc93c', 3); G.fillRR(g, 466, 332, 40, 28, 10, '#1fb5a6', 3);
    // candle table
    rr(g, 214, 332, 56, 12, 5, '#c8935a', 4.5); G.fillRR(g, 238, 344, 8, 86, 3, '#a0643a', 3); G.ell(g, 242, 432, 24, 5, '#8a5a3a', 0);
    rr(g, 228, 316, 28, 18, 5, '#e8d6b0', 3.5); G.fillRR(g, 236, 300, 12, 18, 3, '#fff7e3', 2.5); G.line(g, 242, 300, 242, 295, 1.6, '#3a2a1e');
    G.amb(s, { k: 'mysflame', x: 242, y: 295, h: 14, w: 5.5, lit: () => S.candle, ph: 1, z: 'mid' });
    G.live(g, s, (g, t) => { const c = S.candle == null ? 0 : S.candle; if (c > .01) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = c * (.5 + .08 * Math.sin(t * 9)); g.drawImage(G.glowSprite('255,200,110'), 142, 195, 200, 200); g.restore(); } }, 'top');
    // lamp on the dresser (live brightness)
    G.live(g, s, (g, t) => {
      const k = S.lampK == null ? 1 : S.lampK; lampShade(g, 850, 252, k);
      if (k > .02) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .55 * k; g.drawImage(G.glowSprite('255,214,130'), 690, 140, 320, 320); g.restore(); }
      if (k < .98) { g.save(); g.globalAlpha = .3 * (1 - k); g.fillStyle = '#2a1850'; g.fillRect(0, 0, 960, 540); g.restore(); }
    }, 'top');
    glow(g, s, 430, 150, 380, .14, '255,170,110'); dust(g, s, 300, 110, 360, 300, 16, 4);
    if (S.cat) A.draw(g, 'mys_kitten:sleep', 720, 336, 46);
    if (S.party) {
      RK.stringLights(g, s, 20, 940, 28, 34, 16, ['#ff6f91', '#ffd23c', '#5cc96b', '#4aa8e8', '#ff8a2a'], false);
      [[60, 70, '#ff6f91'], [95, 82, '#4aa8e8'], [880, 64, '#ffc93c'], [915, 84, '#5cc96b'], [845, 90, '#8a6bd6']].forEach(b => A.draw(g, 'mys_balloon:' + b[2], b[0], b[1], 54));
      rr(g, 330, 28, 300, 46, 12, '#fff7e3', 4); G.text(g, 'حفلة الأصدقاء', 480, 52, { size: 30, color: '#c25a00' });
      G.ao(g, 250, 398, 310, 44); G.fillRR(g, 262, 414, 12, 30, 3, '#a0643a', 3); G.fillRR(g, 536, 414, 12, 30, 3, '#a0643a', 3); rr(g, 250, 398, 310, 18, 8, '#c8935a', 4.5); rr(g, 244, 392, 322, 10, 5, '#fff7e3', 3);
    }
  };

  /* ================================================================
     ROOM mys_hall : the long hallway.  flags: shutter(live 0..1) curtainCat
     Landmarks: curtain window (90-230, y 110-300), clock (590-670), paintings (330-520, y 110), loose shutter window (760-900, 100-300), stairs arch (300-420)
     ================================================================ */
  R.mys_hall = function (g, t, s) {
    const S = s.state; wall(g, 430, '#d3e4dc', '#aac9c0', { dado: { h: 100, c: '#8a6a52' }, pw: 70 });
    RK.floor(g, 430, '#a8764a', '#6e442a', { kind: 'wood' });
    RK.rug(g, 480, 480, 360, 30, '#a85a6a', '#f0c4cc');
    // curtained window (the kitten hides here)
    G.window(g, s, 100, 110, 120, 180, { view: 'mysdusk', frame: '#f5e6d0', curtains: ['#c46a7c', '#c46a7c'], cw: 52, floor: 430, dir: .5, tod: 'sunset' });
    // stair arch
    g.save(); g.fillStyle = 'rgba(40,20,10,.5)'; G.rr(g, 330, 160, 110, 270, 50); g.fill(); g.restore(); rr(g, 320, 150, 130, 282, 52, null, 5, '#8a5a3a');
    g.save(); g.beginPath(); G.rr(g, 336, 168, 98, 262, 46); g.clip(); g.fillStyle = G.lin(g, 0, 168, 0, 430, ['#6a5a80', '#c49a70']); g.fillRect(330, 160, 110, 270);
    for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#b98a60' : '#d4a574'; g.beginPath(); g.moveTo(336 + i * 14, 430 - i * 38); g.lineTo(434, 430 - i * 38); g.lineTo(434, 430 - (i + 1) * 38); g.lineTo(336 + (i + 1) * 14, 430 - (i + 1) * 38); g.closePath(); g.fill(); g.strokeStyle = 'rgba(60,30,10,.4)'; g.lineWidth = 1.5; g.stroke(); } g.restore();
    G.text(g, 'الدور العلوي', 385, 134, { size: 20, color: '#fff', stroke: OL, sw: 5 });
    // paintings
    RK.frame(g, 470, 118, 84, 62, { frame: '#c8935a', draw: boatPic }); RK.frame(g, 570, 118, 62, 80, { frame: '#c8935a', draw: landscape });
    // grandfather clock
    G.ao(g, 660, 130, 80, 300); rr(g, 660, 130, 80, 300, 10, '#8a5a3a', 4.5); rr(g, 650, 118, 100, 24, 10, '#a0643a', 4); G.circ(g, 700, 190, 30, '#fff7e3', 4.5);
    for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; G.line(g, 700 + Math.sin(a) * 24, 190 - Math.cos(a) * 24, 700 + Math.sin(a) * 28, 190 - Math.cos(a) * 28, 2, '#3a2a1e'); }
    G.line(g, 700, 190, 700, 170, 3.5, '#3a2a1e'); G.line(g, 700, 190, 714, 196, 3, '#3a2a1e'); G.circ(g, 700, 190, 3.5, '#3a2a1e', 0);
    rr(g, 672, 238, 56, 170, 6, '#6a3a22', 3); G.circ(g, 700, 372, 14, '#ffc93c', 3);
    G.live(g, s, (g2, t2) => { const a = Math.sin(t2 * 2.4) * .22; g2.save(); g2.translate(700, 252); g2.rotate(a); G.line(g2, 0, 0, 0, 100, 3, '#c9963a'); G.circ(g2, 0, 106, 12, '#ffd23c', 3); g2.restore(); });
    // console table + vase
    G.ao(g, 250, 380, 60, 50); rr(g, 240, 360, 80, 12, 5, '#c8935a', 4.5); G.fillRR(g, 246, 372, 8, 58, 3, '#a0643a', 3); G.fillRR(g, 306, 372, 8, 58, 3, '#a0643a', 3); A.draw(g, 'mys_vase', 280, 332, 52);
    // loose shutter window (right)
    G.window(g, s, 790, 110, 100, 170, { view: 'mysdusk', frame: '#f5e6d0', curtains: null, floor: 430, dir: -.4, tod: 'sunset', panes: [1, 2] });
    G.amb(s, { k: 'mysshutter', x: 780, y: 100, w: 52, h: 192, dir: 1, a0: .9, amp: .45, ph: 0, lit: () => S.shutter, z: 'mid' });
    G.amb(s, { k: 'leaves', x0: 790, x1: 890, y0: 110, y1: 280, n: 5, cols: ['#c4784a', '#e0a050'], z: 'top', seed: 6 });
    A.draw(g, 'plant', 890, 410, 100);
    // coat rack
    G.line(g, 40, 130, 40, 430, 6, '#8a5a3a'); G.fillRR(g, 24, 420, 32, 10, 4, '#6a3a22', 3); [[40, 150], [40, 200]].forEach(h => { G.line(g, h[0], h[1], h[0] + 22, h[1] - 10, 4, '#8a5a3a'); }); G.poly(g, [[56, 178], [92, 178], [84, 240], [60, 240]], '#4a8dff', 3.5); G.ell(g, 66, 150, 20, 8, '#c8935a', 3);
    glow(g, s, 760, 170, 300, .16, '255,170,110'); dust(g, s, 420, 120, 360, 300, 14, 7);
    if (S.curtainCat) A.draw(g, 'mys_kitten:peek', 160, 300, 58);
  };

  /* ================================================================
     ROOM mys_attic : moonlit attic.  flags: sheet (1 = chair under the sheet) box (0/1) trunk (0/1)
     Landmarks: round-top moon window (400-560, 70-230), trunk (60-250, y 340-430), music box table (660-770), chair under the sheet (790-920), toy horse (300), telescope (580)
     ================================================================ */
  R.mys_attic = function (g, t, s) {
    const S = s.state;
    g.fillStyle = G.lin(g, 0, 0, 0, 430, ['#8a6a52', '#b98a60']); g.fillRect(0, 0, 960, 430);
    for (let x = 0; x < 960; x += 48) { g.fillStyle = (x / 48) % 2 ? 'rgba(255,230,190,.08)' : 'rgba(40,18,4,.07)'; g.fillRect(x, 0, 48, 430); G.line(g, x, 0, x, 430, 1.5, 'rgba(50,24,6,.3)'); }
    // roof beams (slanted, friendly)
    G.poly(g, [[0, 0], [960, 0], [960, 70], [480, 14], [0, 70]], '#6a4a34', 4); G.poly(g, [[0, 70], [480, 14], [960, 70], [960, 88], [480, 32], [0, 88]], '#7e5a40', 3);
    [[130, 0], [350, 0], [610, 0], [830, 0]].forEach(b => G.line(g, b[0], 56 - Math.abs(b[0] - 480) * .08, b[0] + (b[0] < 480 ? 50 : -50), 160, 14, '#6a4a34'));
    RK.floor(g, 430, '#b98a58', '#8a5e38', { kind: 'wood', line: 'rgba(60,30,10,.32)' });
    G.window(g, s, 400, 90, 160, 150, { view: 'mysnight', frame: '#e7d2b4', curtains: null, floor: 430, dir: -.15, spread: .5, shaftA: .22, tod: 'cool', panes: [2, 2] });
    G.amb(s, { k: 'shaft', pts: [[400, 240], [560, 240], [640, 450], [330, 450]], col: '190,205,255', a: .16, z: 'top' });
    G.amb(s, { k: 'dust', box: [340, 140, 300, 300], n: 20, z: 'top', seed: 11 });
    // trunk on the left
    A.draw(g, 'mys_trunk', 150, 386, 190);
    // stack of boxes + toy horse + hat stand
    [[300, 396, 70, '#c8935a'], [345, 372, 54, '#d9a566']].forEach(b => { rr(g, b[0] - b[2] / 2, b[1] - b[2] * .6, b[2], b[2] * .6, 4, b[3], 4); G.line(g, b[0] - b[2] / 2, b[1] - b[2] * .3, b[0] + b[2] / 2, b[1] - b[2] * .3, 2.5, '#8a5a3a'); });
    A.draw(g, 'mys_horse', 270, 392, 76);
    G.line(g, 590, 180, 590, 430, 5, '#6a3a22'); G.ell(g, 590, 432, 22, 5, '#6a3a22', 0); G.ell(g, 590, 176, 22, 7, '#b05a6c', 3); rr(g, 574, 138, 32, 40, 6, '#2b3a67', 3.5); G.fillRR(g, 570, 170, 40, 6, 3, '#ffc93c', 2);
    // telescope
    G.line(g, 520, 430, 548, 340, 5, '#6a3a22'); G.line(g, 576, 430, 548, 340, 5, '#6a3a22'); g.save(); g.translate(548, 336); g.rotate(-.55); rr(g, -40, -9, 80, 18, 6, '#c9963a', 4); rr(g, 30, -12, 22, 24, 5, '#8a5a3a', 3.5); g.restore();
    // table with the music box
    G.ao(g, 650, 366, 130, 64); rr(g, 650, 366, 130, 12, 5, '#c8935a', 4.5); G.fillRR(g, 662, 378, 10, 52, 3, '#a0643a', 3); G.fillRR(g, 758, 378, 10, 52, 3, '#a0643a', 3);
    A.draw(g, 'mys_musicbox' + (S.box ? ':open' : ''), 715, 342, 70);
    // chair (under the sheet or revealed)
    if (S.sheet) A.draw(g, 'mys_sheetchair', 852, 366, 150); else A.draw(g, 'mys_chair', 852, 366, 150);
    // old teddy on a shelf + hanging bulb string (off) + rolled map
    RK.shelf(g, 60, 190, 190); A.draw(g, 'teddy', 110, 176, 38); A.draw(g, 'mys_jar:#8fd6ff', 170, 174, 30); A.draw(g, 'mys_jar:#ff9ec0', 210, 174, 30);
    for (let i = 0; i < 6; i++) { const x = 40 + i * 24; G.circ(g, x, 110 + Math.sin(i / 5 * 3.14) * 12, 5, '#fff0c0', 2.5); } G.line(g, 40, 104, 160, 104, 2, '#3a2a1e');
    glow(g, s, 480, 160, 420, .18, '170,190,255'); G.amb(s, { k: 'stars', pts: [[438, 112, 2], [512, 130, 2.4], [470, 150, 1.8]], z: 'far' });
  };

  /* ================================================================
     ROOM mys_garden : garden at night.  flags: owl key shutter(live)
     Landmarks: house wall + window with the loose shutter (left, 60-300), big tree (620-900) with a branch at (700,190) and a low branch at (780,300), lanterns (330, 520), bench (400-520)
     ================================================================ */
  R.mys_garden = function (g, t, s) {
    const S = s.state;
    G.far(g, s, c => { G.view(c, 'mysnight', 0, 0, 960, 420, 20); });
    G.hole(g, s, 0, 0, 960, 420);
    const R2 = rnd(8), pts = []; for (let i = 0; i < 16; i++) pts.push([300 + R2() * 660, 12 + R2() * 150, 1.8 + R2() * 2]); G.amb(s, { k: 'stars', pts, z: 'far' });
    // far fence + hedge
    g.fillStyle = '#1c3a4a'; g.fillRect(0, 372, 960, 60); for (let x = 0; x < 960; x += 46) { G.poly(g, [[x, 372], [x + 38, 372], [x + 38, 352], [x + 19, 340], [x, 352]], '#5d7a8a', 3); }
    // grass
    g.fillStyle = G.lin(g, 0, 400, 0, 540, ['#3f8a72', '#24604f']); g.fillRect(0, 400, 960, 140); const gr = rnd(6); for (let i = 0; i < 90; i++) { const x = gr() * 960, y = 404 + gr() * 130; G.line(g, x, y, x + 3, y - 8, 2, 'rgba(160,230,170,.35)'); }
    // stone path
    [[330, 470, 70], [430, 450, 64], [520, 478, 70], [610, 456, 62]].forEach(p => { G.ell(g, p[0], p[1], p[2] / 2, 12, '#b4b8c4', 3); });
    // house wall (left)
    G.ao(g, 0, 60, 330, 360); g.fillStyle = G.lin(g, 0, 60, 0, 420, ['#cbb8a0', '#a8967e']); g.fillRect(0, 40, 320, 380); for (let y = 52; y < 420; y += 30) G.line(g, 0, y, 320, y, 1.4, 'rgba(70,40,20,.2)'); rr(g, -6, 28, 340, 22, 4, '#7a5a44', 4);
    G.window(g, s, 90, 110, 130, 150, { view: 'mysdusk', frame: '#f5e6d0', curtains: null, floor: 420, tod: 'sunset', panes: [2, 2], shaft: false });
    glow(g, s, 155, 190, 120, .5, '255,200,120'); rr(g, 70, 262, 170, 12, 4, '#8a5a3a', 3);
    G.amb(s, { k: 'mysshutter', x: 224, y: 104, w: 68, h: 164, dir: 1, a0: .75, amp: .4, ph: 1.3, lit: () => S.shutter, z: 'mid' });
    rr(g, 242, 270, 70, 150, 4, '#8a5a3a', 4); G.circ(g, 296, 350, 4, '#ffd23c', 2);   // back door
    [[40, 430, '#ff6f91'], [90, 438, '#ffc93c'], [140, 432, '#8a6bd6']].forEach(f => A.draw(g, 'mys_pot', f[0] + 20, f[1] - 8, 50));
    // big tree
    g.save(); G.fillRR(g, 700, 170, 52, 260, 14, '#6a4a34', 4.5); G.poly(g, [[702, 420], [670, 438], [730, 438]], '#6a4a34', 3); G.poly(g, [[750, 420], [790, 440], [740, 440]], '#6a4a34', 3);
    G.line(g, 700, 230, 610, 190, 18, '#6a4a34'); G.line(g, 752, 250, 840, 300, 14, '#6a4a34'); G.line(g, 726, 170, 726, 100, 16, '#6a4a34');
    [[726, 100, 100, '#2f6a58'], [640, 160, 80, '#357a62'], [830, 170, 90, '#2f6a58'], [760, 60, 70, '#357a62'], [690, 120, 76, '#2a5e4e'], [870, 250, 60, '#357a62'], [600, 210, 56, '#2a5e4e']].forEach(c => { const gg = g.createRadialGradient(c[0] - c[2] * .3, c[1] - c[2] * .3, 4, c[0], c[1], c[2]); gg.addColorStop(0, G.shade(c[3], .25)); gg.addColorStop(1, c[3]); g.fillStyle = gg; g.beginPath(); g.arc(c[0], c[1], c[2], 0, 6.2832); g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(10,40,30,.5)'; g.stroke(); });
    g.restore();
    if (S.owl) A.draw(g, 'mys_owl', 668, 188, 84);
    if (S.key) { G.line(g, 800, 296, 800, 326, 2, '#c9a24a'); A.draw(g, 'mys_key', 800, 346, 34); }
    // lanterns (warm, solar)
    [[360, 330], [880, 410]].forEach(p => { G.line(g, p[0], p[1], p[0], p[1] + 98, 5, '#3a3f55'); rr(g, p[0] - 14, p[1] - 24, 28, 30, 6, '#fff2b0', 3.5); G.poly(g, [[p[0] - 18, p[1] - 24], [p[0] + 18, p[1] - 24], [p[0], p[1] - 40]], '#3a3f55', 3); glow(g, s, p[0], p[1] - 8, 130, .55, '255,220,140', .05); });
    // bench
    G.ao(g, 410, 400, 130, 40); rr(g, 400, 392, 140, 12, 5, '#c8935a', 4); rr(g, 400, 366, 140, 10, 5, '#c8935a', 4); G.fillRR(g, 410, 404, 10, 32, 3, '#8a5a3a', 3); G.fillRR(g, 520, 404, 10, 32, 3, '#8a5a3a', 3); G.fillRR(g, 412, 372, 8, 24, 2, '#8a5a3a', 2); G.fillRR(g, 520, 372, 8, 24, 2, '#8a5a3a', 2);
    G.amb(s, { k: 'mysfly', x0: 330, x1: 940, y0: 250, y1: 420, n: 11, seed: 4, z: 'top' });
    G.amb(s, { k: 'leaves', x0: 560, x1: 940, y0: 90, y1: 420, n: 5, cols: ['#4a9a7a', '#7ac49a'], z: 'top', seed: 4 });
  };

  /* ================================================================
     ROOM mys_pantry : kitchen pantry.  flags: jar (a jar lies on the floor)
     Landmarks: 3 shelves (60-560, y 150 / 250 / 340), flour sacks (620-760, y 340-430), window (790-900, 90-220), barrel (580, 400), hanging garlic (700, 100)
     ================================================================ */
  R.mys_pantry = function (g, t, s) {
    const S = s.state; wall(g, 430, '#f3dfb8', '#dcc08a', { pattern: 'tiles', tw: 70, th: 56, grout: 'rgba(120,80,40,.18)', dado: { h: 56, c: '#a87a52' } });
    RK.floor(g, 430, '#d9b98a', '#a8825a', { kind: 'tile', alt: 'rgba(120,70,30,.18)', n: 12 });
    G.window(g, s, 790, 96, 110, 130, { view: 'mysnight', frame: '#fff6e6', curtains: null, floor: 430, tod: 'cool', dir: -.3, panes: [2, 2], shaftA: .18 });
    G.amb(s, { k: 'shaft', pts: [[790, 226], [900, 226], [850, 450], [700, 450]], col: '190,205,255', a: .14, z: 'top' });
    // shelves
    [150, 250, 340].forEach((y, i) => {
      g.fillStyle = 'rgba(40,18,0,.28)'; g.fillRect(52, y - 62, 520, 62); RK.shelf(g, 44, y, 536, '#a0643a');
      const cols = [['#ff6f91', '#ffc93c', '#5cc96b', '#8a6bd6', '#ff8a2a'], ['#ef5350', '#4a8dff', '#ffd23c', '#1fb5a6', '#ff9ec0'], ['#c0504d', '#8fd6ff', '#9fdc82', '#ffc93c', '#b78bd6']][i];
      for (let k = 0; k < 11; k++) { const x = 70 + k * 46; if (i === 2 && k > 8) continue; A.draw(g, 'mys_jar:' + cols[k % 5], x, y - 22, 46); }
    });
    // flour sacks + barrel + basket
    A.draw(g, 'mys_sack', 660, 392, 120); A.draw(g, 'mys_sack', 740, 404, 100);
    G.ao(g, 560, 360, 90, 72); rr(g, 560, 352, 90, 78, 12, '#a0643a', 4.5); [376, 400].forEach(y => G.line(g, 560, y, 650, y, 4, '#6a3a22')); G.ell(g, 605, 352, 45, 9, '#c8935a', 4);
    // hanging garlic and onions
    G.line(g, 700, 60, 700, 110, 3, '#6a4a34'); [[690, 120], [710, 134], [694, 152], [708, 168]].forEach(p => { G.ell(g, p[0], p[1], 11, 14, '#f4ecd8', 3); G.poly(g, [[p[0] - 3, p[1] - 14], [p[0] + 3, p[1] - 14], [p[0], p[1] - 24]], '#c9b88a', 2); });
    // hanging lamp (off, shows the room is only lit by the moon + torch)
    G.line(g, 420, 0, 420, 60, 3, '#3a2a1e'); G.poly(g, [[396, 90], [444, 90], [434, 62], [406, 62]], '#4a8dff', 3.5);
    if (S.jar) A.draw(g, 'mys_jar:#ff6f91', 520, 438, 44);
    glow(g, s, 760, 180, 260, .2, '170,190,255'); G.amb(s, { k: 'dust', box: [600, 140, 300, 280], n: 14, z: 'top', seed: 9 });
  };

  /* ================================================================
     FRIENDLY GHOST «بوبو»   mys_bobo[:shy|happy|surprised|sleepy|wave|peek]   (a round white sheet-like friend, big shiny eyes, pink cheeks, a tiny curl on top)
     ================================================================ */
  function bobo(g, emo, peek) {
    if (peek) { g.save(); g.beginPath(); g.rect(-50, -60, 100, 50); g.clip(); g.translate(0, 18); }
    const body = () => {
      g.beginPath(); g.moveTo(-32, 28); g.bezierCurveTo(-42, -8, -34, -42, 0, -42); g.bezierCurveTo(34, -42, 42, -8, 32, 28);
      for (let i = 0; i < 4; i++) { const xe = 32 - (i + 1) * 16; g.quadraticCurveTo(32 - i * 16 - 8, 44 + (i % 2 ? 0 : 3), xe, 30); } g.closePath();
    };
    // soft aura
    g.save(); g.globalAlpha = .22; G.circ(g, 0, -4, 52, '#cfc4ff', 0); g.restore();
    body(); G.fs(g, '#fdfbff', 4.5, PLUM, [-40, -42, 80, 86]);
    g.save(); body(); g.clip(); const sh = g.createLinearGradient(-30, 0, 34, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(170,150,230,.28)'); g.fillStyle = sh; g.fillRect(-45, -45, 90, 100); G.ell(g, -14, -26, 14, 8, 'rgba(255,255,255,.9)', 0, null, -.5); g.restore();
    // curl on top
    g.beginPath(); g.moveTo(-3, -42); g.quadraticCurveTo(-10, -56, 2, -56); g.quadraticCurveTo(10, -56, 5, -49); g.lineWidth = 3.4; g.strokeStyle = PLUM; g.lineCap = 'round'; g.stroke(); g.lineWidth = 1.6; g.strokeStyle = '#fdfbff'; g.stroke();
    // cheeks
    const shy = emo === 'shy', happy = emo === 'happy' || emo === 'wave', sur = emo === 'surprised', sl = emo === 'sleepy';
    G.ell(g, -23, 2, 7, 4.6, shy ? 'rgba(255,120,150,.75)' : 'rgba(255,140,170,.55)', 0); G.ell(g, 23, 2, 7, 4.6, shy ? 'rgba(255,120,150,.75)' : 'rgba(255,140,170,.55)', 0);
    // eyes
    const eye = (x, ox) => {
      if (happy || sl) { g.beginPath(); if (happy) g.arc(x, -10, 7, 3.4, 6.02); else g.arc(x, -12, 7, .25, 2.9); g.lineWidth = 3.4; g.lineCap = 'round'; g.strokeStyle = '#2b2342'; g.stroke(); return; }
      const ry = sur ? 12 : 10, rx = sur ? 9 : 8; G.ell(g, x, -10, rx, ry, '#2b2342', 0); G.ell(g, x + ox, -10 + (shy ? 2 : 0), rx * .9, ry * .92, '#3a2f5a', 0);
      G.circ(g, x - 2.5 + ox * .4, -14 + (shy ? 1 : 0), 3.4, '#fff', 0); G.circ(g, x + 3 + ox * .4, -7 + (shy ? 1 : 0), 1.8, '#fff', 0);
    };
    eye(-13, shy ? -2 : 0); eye(13, shy ? -2 : 0);
    // mouth
    g.lineCap = 'round';
    if (happy) { g.beginPath(); g.moveTo(-8, 6); g.quadraticCurveTo(0, 20, 8, 6); g.closePath(); g.fillStyle = '#8a3a5a'; g.fill(); g.lineWidth = 2.4; g.strokeStyle = '#2b2342'; g.stroke(); G.ell(g, 0, 13, 4.5, 3, '#ff8fa8', 0); }
    else if (sur) { G.ell(g, 0, 11, 4.6, 6, '#8a3a5a', 2.6, '#2b2342'); }
    else if (sl) { g.beginPath(); g.moveTo(-5, 10); g.quadraticCurveTo(0, 13, 5, 10); g.lineWidth = 2.6; g.strokeStyle = '#2b2342'; g.stroke(); }
    else { g.beginPath(); g.moveTo(-5, 11); g.quadraticCurveTo(-2.5, 8.5, 0, 11); g.quadraticCurveTo(2.5, 13.5, 5, 10.5); g.lineWidth = 2.6; g.strokeStyle = '#2b2342'; g.stroke(); }
    // arms
    if (peek) { G.ell(g, -22, -24, 7, 5, '#fdfbff', 3, PLUM); G.ell(g, 22, -24, 7, 5, '#fdfbff', 3, PLUM); }
    else if (shy) { G.ell(g, -13, 12, 9, 6.5, '#fdfbff', 3.4, PLUM, -.3); G.ell(g, 13, 12, 9, 6.5, '#fdfbff', 3.4, PLUM, .3); }
    else if (happy) { G.ell(g, -39, -8, 6.5, 10, '#fdfbff', 3.4, PLUM, .6); G.ell(g, 39, emo === 'wave' ? -22 : -8, 6.5, 10, '#fdfbff', 3.4, PLUM, emo === 'wave' ? -.2 : -.6); }
    else if (sur) { G.ell(g, -40, 4, 6.5, 10, '#fdfbff', 3.4, PLUM, .9); G.ell(g, 40, 4, 6.5, 10, '#fdfbff', 3.4, PLUM, -.9); }
    else { G.ell(g, -37, 12, 6, 9, '#fdfbff', 3.4, PLUM, .3); G.ell(g, 37, 12, 6, 9, '#fdfbff', 3.4, PLUM, -.3); }
    if (happy) { G.sparkle(g, -38, -34, 6, '#ffe28a', .95); G.sparkle(g, 40, -30, 5, '#ffe28a', .95); }
    if (sl) { G.text(g, 'z', 38, -38, { size: 18, color: '#8a6bd6' }); G.text(g, 'z', 48, -50, { size: 13, color: '#8a6bd6' }); }
    if (peek) g.restore();
  }

  /* ================================================================
     PROPS
     ================================================================ */
  A.registerAll({
    w_mystery(g) {   // world-card icon: old house, lit window, moon, tiny friendly ghost
      G.circ(g, 28, -34, 14, '#fff2c4', 3); G.circ(g, 34, -37, 12, '#5b4a9a', 0);
      G.poly(g, [[-44, 6], [-44, -14], [0, -40], [44, -14], [44, 6]], '#c9a07a', 4.5); G.fillRR(g, -44, 4, 88, 36, 3, '#d9b48a', 4.5); G.poly(g, [[-50, -12], [0, -46], [50, -12]], '#7a5aa0', 4.5);
      G.fillRR(g, -12, 14, 24, 26, 3, '#8a5a3a', 3); G.fillRR(g, -34, 10, 16, 16, 2, '#ffe28a', 3); G.fillRR(g, 18, 10, 16, 16, 2, '#ffe28a', 3); G.fillRR(g, 22, -50, 10, 20, 2, '#a07858', 3);
      g.save(); g.translate(-34, -30); g.scale(.42, .42); bobo(g, 'happy'); g.restore();
    },
    mys_bobo(g, o) { const a = o.args || []; bobo(g, a[0] === 'peek' ? 'shy' : (a[0] || 'happy'), a[0] === 'peek'); },
    mys_torch(g) {
      g.save(); g.rotate(-.5); G.poly(g, [[-30, -24], [-30, -12], [-48, -22], [-48, -14]], 'rgba(255,240,150,.45)', 0); G.poly(g, [[0, 0], [60, -30], [60, 30]], 'rgba(255,240,150,.0)', 0);
      G.fillRR(g, -22, -16, 54, 32, 8, '#ef5350', 4.5); G.fillRR(g, -30, -22, 16, 44, 6, '#c7ccdb', 4.5); G.fillRR(g, -26, -17, 8, 34, 3, '#fff7a8', 2); G.fillRR(g, 0, -20, 12, 6, 3, '#ffd23c', 2.5); G.fillRR(g, 30, -10, 10, 20, 3, '#9aa0b5', 3.5); g.restore();
      G.sparkle(g, -38, -28, 8, '#fff6a8', .95); G.sparkle(g, -44, 8, 6, '#fff6a8', .8);
    },
    mys_batt(g) { G.fillRR(g, -16, -34, 32, 70, 8, '#ffc93c', 4.5); G.fillRR(g, -8, -44, 16, 12, 3, '#9aa0b5', 3.5); G.fillRR(g, -16, -6, 32, 22, 0, '#4a8dff', 0); G.text(g, '+', 0, -20, { size: 22, color: '#fff', stroke: OL, sw: 4 }); G.text(g, '−', 0, 26, { size: 22, color: '#2b3a67' }); },
    mys_candle(g) { G.ell(g, 0, 34, 28, 8, '#c8935a', 4); G.fillRR(g, -24, 20, 48, 14, 6, '#e8d6b0', 4); G.fillRR(g, -9, -16, 18, 38, 4, '#fff7e3', 4); G.line(g, 0, -16, 0, -23, 2.4, '#3a2a1e'); g.beginPath(); g.moveTo(-6, -24); g.quadraticCurveTo(-8, -38, 0, -50); g.quadraticCurveTo(8, -38, 6, -24); g.closePath(); G.fs(g, '#ffb23c', 2.5); g.beginPath(); g.moveTo(-3, -25); g.quadraticCurveTo(-4, -34, 0, -40); g.quadraticCurveTo(4, -34, 3, -25); g.closePath(); g.fillStyle = '#fff3a0'; g.fill(); },
    mys_lamp(g) { lampShade(g, 0, -40, 1); },
    mys_fuse(g) { G.fillRR(g, -34, -40, 68, 80, 8, '#9aa0b5', 4.5); G.fillRR(g, -26, -32, 52, 64, 5, '#c7ccdb', 3); [-14, 0, 14].forEach((x, i) => { G.fillRR(g, x - 5, -20, 10, 30, 3, '#5a6078', 2.5); G.fillRR(g, x - 5, i === 1 ? -20 : -4, 10, 14, 3, i === 1 ? '#ef5350' : '#5cc96b', 2.5); }); G.circ(g, 0, 22, 4, '#ffd23c', 2); },
    mys_breath(g) { G.circ(g, -6, 6, 32, '#ffe0b8', 4.5); g.beginPath(); g.arc(-14, 0, 5, 3.3, 6.1); g.lineWidth = 3.2; g.strokeStyle = '#2b2342'; g.lineCap = 'round'; g.stroke(); g.beginPath(); g.arc(4, 0, 5, 3.3, 6.1); g.stroke(); G.ell(g, -4, 18, 6, 5, '#e05a6a', 2.4); G.ell(g, -22, 12, 5, 3.4, 'rgba(255,120,150,.6)', 0); G.ell(g, 12, 12, 5, 3.4, 'rgba(255,120,150,.6)', 0); [[30, -22, 12], [42, -8, 9], [34, 6, 7]].forEach(c => G.circ(g, c[0], c[1], c[2], 'rgba(255,255,255,.95)', 2.5)); },
    mys_hands(g) { G.ell(g, -20, 6, 14, 22, '#ffd2a8', 4.5, null, .5); G.ell(g, 20, 6, 14, 22, '#e8b389', 4.5, null, -.5); G.ell(g, 0, 4, 14, 11, '#ffd2a8', 4.5); G.heart(g, 0, -30, 11, '#ff5a7a', 3); },
    mys_phone(g) { G.fillRR(g, -20, -38, 40, 76, 9, '#2b3a67', 4.5); G.fillRR(g, -15, -30, 30, 52, 3, '#bfe8ff', 2.5); G.circ(g, 0, 30, 4, '#fff', 0); g.beginPath(); g.arc(0, -8, 8, 3.4, 6); g.lineWidth = 3; g.strokeStyle = '#2b3a67'; g.stroke(); [[26, -26], [32, -34]].forEach((p, i) => { g.beginPath(); g.arc(18, -28, 12 + i * 8, -.6, .6); g.lineWidth = 2.6; g.strokeStyle = '#5cc96b'; g.stroke(); }); },
    mys_wind(g) { g.lineCap = 'round'; [[-30, -18, '#9ed8ff'], [-34, 2, '#bfe8ff'], [-26, 22, '#9ed8ff']].forEach((l, i) => { g.beginPath(); g.moveTo(l[0], l[1]); g.bezierCurveTo(l[0] + 30, l[1] - 12, l[0] + 54, l[1] + 12, l[0] + 70 - i * 6, l[1] - 2 + i * 2); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); g.lineWidth = 2.6; g.strokeStyle = l[2]; g.stroke(); }); },
    mys_shutter(g) { G.fillRR(g, -34, -36, 68, 72, 4, '#fff6e6', 4.5); G.fillRR(g, -26, -28, 52, 56, 2, '#7aa8e0', 2.5); G.poly(g, [[-34, -36], [-52, -28], [-52, 38], [-34, 36]], '#7aa8a0', 4); for (let i = 0; i < 5; i++) G.line(g, -50, -22 + i * 12, -36, -20 + i * 12, 2.2, 'rgba(255,255,255,.55)'); g.save(); g.translate(26, -4); g.scale(.5, .5); A.draw(g, 'mys_wind', 0, 0, 80); g.restore(); },
    mys_clock(g) { G.fillRR(g, -22, -44, 44, 92, 8, '#8a5a3a', 4.5); G.circ(g, 0, -20, 15, '#fff7e3', 3.5); G.line(g, 0, -20, 0, -30, 2.4, OL); G.line(g, 0, -20, 7, -16, 2.4, OL); G.fillRR(g, -14, 2, 28, 38, 4, '#6a3a22', 2.5); g.beginPath(); g.moveTo(0, 8); g.lineTo(-7, 28); g.lineWidth = 2.4; g.strokeStyle = '#c9963a'; g.stroke(); G.circ(g, -8, 32, 6, '#ffd23c', 2.5); },
    mys_owl(g, o) {
      const sl = (o.args || [])[0] === 'sleep'; G.line(g, -44, 40, 44, 40, 8, OL); G.line(g, -44, 40, 44, 40, 4, '#8a6a4a');
      g.beginPath(); g.moveTo(-28, 38); g.bezierCurveTo(-42, 8, -36, -34, 0, -36); g.bezierCurveTo(36, -34, 42, 8, 28, 38); g.closePath(); G.fs(g, '#a9784f', 4.5, null, [-36, -36, 72, 76]);
      G.poly(g, [[-26, -30], [-18, -46], [-8, -34]], '#a9784f', 4); G.poly(g, [[26, -30], [18, -46], [8, -34]], '#a9784f', 4);
      G.ell(g, 0, 14, 20, 22, '#f3dfb8', 3.5); for (let i = 0; i < 3; i++) for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(-10 + k * 10, 6 + i * 11, 5, .2, 2.9); g.lineWidth = 1.8; g.strokeStyle = 'rgba(138,90,58,.6)'; g.stroke(); }
      [-14, 14].forEach(x => { G.circ(g, x, -12, 13, '#fffaf0', 3.5); if (sl) { g.beginPath(); g.arc(x, -13, 7, .2, 2.9); g.lineWidth = 3; g.strokeStyle = '#2b2342'; g.stroke(); } else { G.circ(g, x + 1, -11, 7, '#2b2342', 0); G.circ(g, x - 1, -14, 2.6, '#fff', 0); } });
      G.poly(g, [[-4, -4], [4, -4], [0, 4]], '#ff9a3c', 2.5); G.ell(g, -25, -2, 5, 3.2, 'rgba(255,120,150,.6)', 0); G.ell(g, 25, -2, 5, 3.2, 'rgba(255,120,150,.6)', 0); G.ell(g, -10, 40, 7, 3.5, '#ff9a3c', 2.5); G.ell(g, 10, 40, 7, 3.5, '#ff9a3c', 2.5);
    },
    mys_firefly(g) { g.save(); g.globalAlpha = .55; G.circ(g, 0, 6, 34, '#e6ff9a', 0); g.restore(); G.ell(g, -12, -8, 12, 7, 'rgba(210,235,255,.85)', 2.5, null, -.6); G.ell(g, 12, -8, 12, 7, 'rgba(210,235,255,.85)', 2.5, null, .6); G.ell(g, 0, 8, 12, 18, '#5a4a3a', 3.5); G.ell(g, 0, 18, 9, 11, '#f4ff7a', 3); G.circ(g, 0, -10, 8, '#7a6a5a', 3); G.circ(g, -3, -11, 1.8, '#fff', 0); G.circ(g, 3, -11, 1.8, '#fff', 0); },
    mys_key(g) { G.circ(g, -18, -14, 18, '#ffc93c', 4.5); G.circ(g, -18, -14, 8, '#7a5a8a', 3); G.fillRR(g, -6, -8, 52, 12, 4, '#ffc93c', 4.5); G.fillRR(g, 30, 2, 8, 20, 2, '#ffc93c', 3.5); G.fillRR(g, 40, 2, 8, 14, 2, '#ffc93c', 3.5); G.sparkle(g, 22, -26, 7, '#fff', .9); },
    mys_trunk(g) { G.fillRR(g, -46, -6, 92, 46, 5, '#8a5a3a', 4.5); g.beginPath(); g.moveTo(-46, -6); g.quadraticCurveTo(-46, -40, 0, -40); g.quadraticCurveTo(46, -40, 46, -6); g.closePath(); G.fs(g, '#a0643a', 4.5); [-30, 0, 30].forEach(x => G.fillRR(g, x - 4, -34, 8, 74, 0, '#c9963a', 2.5)); G.fillRR(g, -9, -8, 18, 18, 3, '#ffd23c', 3); G.circ(g, 0, 0, 3, '#5a3a22', 0); },
    mys_musicbox(g, o) {
      const open = (o.args || [])[0] === 'open'; G.fillRR(g, -34, -4, 68, 36, 6, '#c0504d', 4.5); G.fillRR(g, -30, 0, 60, 8, 3, '#ffd23c', 2); G.circ(g, 0, 20, 5, '#ffd23c', 2.5);
      if (open) { G.poly(g, [[-34, -4], [34, -4], [28, -34], [-28, -34]], '#a8403d', 4.5); G.circ(g, 0, -18, 7, '#fff7e3', 2.5); G.star(g, 0, -38, 8, '#ffe14d', 2); G.sparkle(g, -24, -44, 6, '#fff6a8', .9); G.sparkle(g, 26, -48, 5, '#fff6a8', .9); }
      else { g.beginPath(); g.moveTo(-34, -4); g.quadraticCurveTo(0, -30, 34, -4); g.closePath(); G.fs(g, '#a8403d', 4.5); G.star(g, 0, -12, 7, '#ffd23c', 2); }
    },
    mys_gem(g, o) { const c = ['#ff6f91', '#ffc93c', '#5cc96b', '#4aa8e8'][+((o.args || [])[0]) || 0]; G.poly(g, [[-24, -8], [-12, -28], [12, -28], [24, -8], [0, 30]], c, 4.5); G.line(g, -24, -8, 24, -8, 2.5, 'rgba(255,255,255,.6)'); G.line(g, -12, -28, -6, -8, 2, 'rgba(255,255,255,.6)'); G.line(g, 12, -28, 6, -8, 2, 'rgba(255,255,255,.6)'); G.line(g, -6, -8, 0, 30, 2, 'rgba(255,255,255,.4)'); G.sparkle(g, 14, -20, 6, '#fff', .9); },
    mys_note(g) { G.ell(g, -10, 22, 13, 9, '#8a6bd6', 4, null, -.4); G.fillRR(g, 0, -34, 6, 56, 2, '#8a6bd6', 3.5); g.beginPath(); g.moveTo(6, -34); g.quadraticCurveTo(26, -28, 24, -6); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#8a6bd6'; g.stroke(); },
    mys_sheetchair(g) {
      G.ao(g, -34, 4, 68, 36); g.beginPath(); g.moveTo(-40, 44); g.bezierCurveTo(-44, 20, -40, -34, -22, -40); g.bezierCurveTo(-4, -46, 4, -46, 22, -40); g.bezierCurveTo(40, -34, 44, 20, 40, 44);
      [0, 1, 2, 3, 4].forEach(i => g.quadraticCurveTo(40 - i * 16 - 8, 52 - (i % 2) * 3, 40 - (i + 1) * 16, 44)); g.closePath(); G.fs(g, '#f4eee4', 4.5, '#8a7a6a', [-44, -46, 88, 100]);
      [[-24, -14], [0, 6], [22, -20]].forEach(f => { g.beginPath(); g.moveTo(f[0], f[1]); g.quadraticCurveTo(f[0] + 4, f[1] + 18, f[0] - 2, f[1] + 34); g.lineWidth = 2; g.strokeStyle = 'rgba(120,100,80,.35)'; g.stroke(); });
      G.ell(g, -30, 6, 10, 22, 'rgba(255,255,255,.35)', 0);
    },
    mys_chair(g) { G.ao(g, -38, 4, 76, 40); rr(g, -34, -42, 68, 66, 22, '#4a8dff', 4.5); rr(g, -42, 0, 84, 40, 14, '#6aa6ff', 4.5); rr(g, -46, -8, 20, 52, 10, '#3a74d6', 4); rr(g, 26, -8, 20, 52, 10, '#3a74d6', 4); G.fillRR(g, -34, 40, 10, 14, 3, '#6a3a22', 2.5); G.fillRR(g, 24, 40, 10, 14, 3, '#6a3a22', 2.5); G.fillRR(g, -14, -6, 28, 18, 8, '#ffc93c', 3); },
    mys_horse(g) { g.beginPath(); g.arc(0, 48, 52, 3.5, 5.9); g.lineWidth = 7; g.strokeStyle = OL; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#c9963a'; g.stroke(); G.ell(g, 0, -4, 28, 16, '#e8b66a', 4.5); G.fillRR(g, 14, -34, 14, 34, 6, '#e8b66a', 4.5); G.ell(g, 34, -34, 16, 11, '#e8b66a', 4.5, null, .3); G.circ(g, 37, -37, 2.8, '#2b2342', 0); G.poly(g, [[16, -42], [22, -52], [26, -42]], '#d19a52', 3); g.beginPath(); g.moveTo(12, -34); g.quadraticCurveTo(0, -30, 4, -14); g.lineWidth = 6; g.strokeStyle = '#8a5a3a'; g.stroke(); G.line(g, -22, 6, -22, 26, 5, '#d19a52'); G.line(g, 20, 6, 20, 26, 5, '#d19a52'); },
    mys_vase(g) { g.beginPath(); g.moveTo(-10, -2); g.quadraticCurveTo(-26, 20, -12, 36); g.lineTo(12, 36); g.quadraticCurveTo(26, 20, 10, -2); g.closePath(); G.fs(g, '#8fd6ff', 4); [-12, 0, 12].forEach((x, i) => { G.line(g, x * .4, -2, x * 1.2, -34 - i % 2 * 8, 3, '#3f9a4f'); G.circ(g, x * 1.2, -38 - i % 2 * 8, 7, ['#ff6f91', '#ffc93c', '#fff'][i], 2.5); }); },
    mys_pot(g) { G.poly(g, [[-18, 0], [18, 0], [13, 30], [-13, 30]], '#e07a4a', 3.5); G.fillRR(g, -21, -6, 42, 10, 4, '#c9633a', 3.5); [-8, 0, 8].forEach((x, i) => { G.line(g, x * .5, -6, x * 1.4, -22 - i % 2 * 6, 3, '#3f9a4f'); G.circ(g, x * 1.5, -26 - i % 2 * 6, 7, ['#ff6f91', '#ffc93c', '#8a6bd6'][i], 2.5); }); },
    mys_jar(g, o) {
      const c = (o.args || [])[0] || '#ff6f91'; G.fillRR(g, -14, -26, 28, 6, 3, '#c9963a', 3); G.fillRR(g, -18, -20, 36, 46, 10, 'rgba(235,245,255,.9)', 3.5); G.fillRR(g, -14, -6, 28, 28, 7, c, 2.5); G.fillRR(g, -10, -14, 7, 28, 3, 'rgba(255,255,255,.45)', 0); G.fillRR(g, -10, 2, 20, 12, 3, '#fff7e3', 2);
    },
    mys_sack(g) { g.beginPath(); g.moveTo(-30, -34); g.quadraticCurveTo(0, -46, 30, -34); g.lineTo(38, 36); g.quadraticCurveTo(0, 48, -38, 36); g.closePath(); G.fs(g, '#f4e6c4', 4.5); G.fillRR(g, -26, -42, 52, 12, 5, '#c9963a', 3.5); G.text(g, 'دقيق', 0, 4, { size: 22, color: '#8a5a3a' }); },
    mys_kitten(g, o) {
      const k = (o.args || [])[0] || 'sit', peek = k === 'peek', sl = k === 'sleep';
      if (peek) { g.save(); g.beginPath(); g.rect(-50, -60, 100, 56); g.clip(); g.translate(0, 18); }
      if (sl) { G.ell(g, 0, 20, 36, 20, '#f2a65a', 4.5); G.ell(g, 20, 14, 18, 14, '#fff7ea', 0); g.beginPath(); g.moveTo(30, 28); g.quadraticCurveTo(54, 30, 46, 6); g.lineWidth = 9; g.strokeStyle = OL; g.lineCap = 'round'; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#f2a65a'; g.stroke(); }
      else if (!peek) { G.ell(g, 0, 22, 24, 24, '#f2a65a', 4.5); G.ell(g, 0, 28, 14, 16, '#fff7ea', 0); g.beginPath(); g.moveTo(22, 36); g.quadraticCurveTo(52, 34, 44, 6); g.lineWidth = 9; g.strokeStyle = OL; g.lineCap = 'round'; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#f2a65a'; g.stroke(); G.ell(g, -10, 44, 9, 5, '#fff7ea', 3); G.ell(g, 10, 44, 9, 5, '#fff7ea', 3); }
      const hy = sl ? 0 : -12; G.poly(g, [[-26, hy - 8], [-22, hy - 34], [-6, hy - 22]], '#f2a65a', 4.5); G.poly(g, [[26, hy - 8], [22, hy - 34], [6, hy - 22]], '#f2a65a', 4.5); G.poly(g, [[-22, hy - 13], [-20, hy - 27], [-11, hy - 20]], '#ff9ab0', 0); G.poly(g, [[22, hy - 13], [20, hy - 27], [11, hy - 20]], '#ff9ab0', 0);
      G.circ(g, 0, hy, 25, '#f2a65a', 4.5); [-6, 0, 6].forEach(x => G.line(g, x, hy - 24, x * .8, hy - 15, 2.4, '#c9783a')); G.ell(g, 0, hy + 9, 11, 8, '#fff7ea', 0);
      if (sl) { [-9, 9].forEach(x => { g.beginPath(); g.arc(x, hy - 2, 5, .2, 2.9); g.lineWidth = 2.6; g.strokeStyle = '#2b2342'; g.stroke(); }); }
      else { [-9, 9].forEach(x => { G.ell(g, x, hy - 3, 6.4, 8, '#2b2342', 0); G.ell(g, x, hy - 3, 5, 6.6, '#7ac46a', 0); G.ell(g, x, hy - 2, 2.4, 5, '#1d1830', 0); G.circ(g, x - 1.8, hy - 6, 2.2, '#fff', 0); }); }
      G.poly(g, [[-3, hy + 4], [3, hy + 4], [0, hy + 8]], '#ff7a96', 1.6); g.beginPath(); g.moveTo(0, hy + 8); g.quadraticCurveTo(-3, hy + 13, -7, hy + 10); g.moveTo(0, hy + 8); g.quadraticCurveTo(3, hy + 13, 7, hy + 10); g.lineWidth = 2; g.strokeStyle = '#2b2342'; g.stroke();
      [[-1, 1], [1, 1]].forEach(d => { [-2, 3].forEach(dy => G.line(g, d[0] * 12, hy + 7 + dy, d[0] * 28, hy + 4 + dy * 2.2, 1.4, 'rgba(60,40,30,.55)')); }); G.ell(g, -17, hy + 6, 4.5, 3, 'rgba(255,120,150,.5)', 0); G.ell(g, 17, hy + 6, 4.5, 3, 'rgba(255,120,150,.5)', 0);
      if (peek) { G.ell(g, -14, hy + 28, 8, 6, '#fff7ea', 3); G.ell(g, 14, hy + 28, 8, 6, '#fff7ea', 3); g.restore(); }
    },
    mys_catfood(g) { G.ell(g, 0, 18, 34, 14, '#4a8dff', 4.5); G.ell(g, 0, 12, 28, 10, '#8fd6ff', 3); for (let i = 0; i < 6; i++) G.circ(g, -16 + i * 6.5, 8 + (i % 2) * 3, 4.2, '#c9783a', 2); G.ell(g, 0, 4, 10, 5, '#ff9a6a', 2.5); G.poly(g, [[8, 4], [18, -2], [18, 10]], '#ff9a6a', 2.5); },
    mys_milk(g) { G.ell(g, 0, 18, 32, 13, '#ff6f91', 4.5); G.ell(g, 0, 12, 26, 9, '#fff7fb', 3); G.ell(g, 0, 11, 20, 6, '#fff', 0); },
    mys_choc(g) { G.fillRR(g, -26, -32, 52, 64, 6, '#6a3a22', 4.5); [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]].forEach(d => G.fillRR(g, d[0] * 12 - 10, d[1] * 20 - 8, 20, 16, 3, '#8a5a3a', 2)); G.fillRR(g, -26, -4, 52, 14, 0, '#ef5350', 0); },
    mys_cake(g) { G.fillRR(g, -34, 0, 68, 36, 8, '#ff9ec0', 4.5); G.fillRR(g, -26, -24, 52, 28, 8, '#fff0d8', 4.5); for (let i = 0; i < 5; i++) G.ell(g, -20 + i * 10, -22, 5, 7, '#fff', 2); G.star(g, 0, -40, 10, '#ffe14d', 2.5); G.circ(g, -14, 14, 3.4, '#ffc93c', 1.5); G.circ(g, 0, 18, 3.4, '#5cc96b', 1.5); G.circ(g, 14, 14, 3.4, '#4aa8e8', 1.5); },
    mys_balloon(g, o) { const c = (o.args || [])[0] || '#ff6f91'; G.line(g, 0, 30, 3, 50, 2, 'rgba(60,40,30,.6)'); g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-34, 10, -30, -34, 0, -34); g.bezierCurveTo(30, -34, 34, 10, 0, 30); g.closePath(); G.fs(g, c, 4); G.ell(g, -10, -16, 5, 9, 'rgba(255,255,255,.55)', 0, null, .4); G.poly(g, [[-4, 32], [4, 32], [0, 26]], c, 2); },
    mys_gift(g) { G.fillRR(g, -30, -8, 60, 42, 5, '#8a6bd6', 4.5); G.fillRR(g, -34, -20, 68, 16, 5, '#a68be6', 4.5); G.fillRR(g, -5, -20, 10, 54, 0, '#ffd23c', 3); G.ell(g, -10, -28, 11, 7, '#ffd23c', 3.5, null, -.4); G.ell(g, 10, -28, 11, 7, '#ffd23c', 3.5, null, .4); },
    mys_medal(g) { G.poly(g, [[-18, -44], [-6, -44], [6, -12], [-6, -12]], '#4a8dff', 3.5); G.poly(g, [[18, -44], [6, -44], [-6, -12], [6, -12]], '#ef5350', 3.5); G.circ(g, 0, 10, 28, '#ffc93c', 4.5); G.circ(g, 0, 10, 20, '#ffe28a', 3); G.heart(g, 0, 10, 11, '#ef5350', 3); G.sparkle(g, 22, -6, 7, '#fff', .9); },
    mys_hi(g) { G.ell(g, 0, 10, 20, 26, '#ffd2a8', 4.5); [-18, -8, 2, 12].forEach((x, i) => G.fillRR(g, x - 4, -34 + Math.abs(i - 1.5) * 4, 9, 36, 4, '#ffd2a8', 3.5)); G.ell(g, -26, 6, 6, 14, '#ffd2a8', 3.5, null, .7); g.beginPath(); g.arc(34, -10, 10, -1.2, 1.2); g.lineWidth = 3; g.strokeStyle = '#ffc93c'; g.stroke(); g.beginPath(); g.arc(34, -10, 20, -1.1, 1.1); g.stroke(); },
    mys_star(g) { G.star(g, 0, 0, 38, '#ffd23c', 4.5); },
    mys_step(g) { [0, 1, 2, 3].forEach(i => G.fillRR(g, -34 + i * 14, 28 - i * 18, 68 - i * 14, 16, 3, ['#d4a574', '#c8935a'][i % 2], 3.5)); },
    mys_moon(g) { G.circ(g, 0, 0, 34, '#fff2c4', 4.5); G.circ(g, 14, -8, 30, '#3b3a78', 0); G.sparkle(g, 30, -26, 8, '#fff6a8', .9); },
    mys_sound(g) { G.fillRR(g, -34, -14, 24, 28, 4, '#8a6bd6', 4); G.poly(g, [[-14, -14], [8, -34], [8, 34], [-14, 14]], '#a68be6', 4); [14, 26, 38].forEach((r, i) => { g.beginPath(); g.arc(8, 0, r, -.8, .8); g.lineWidth = 4; g.strokeStyle = OL; g.lineCap = 'round'; g.stroke(); g.lineWidth = 2; g.strokeStyle = '#ffd23c'; g.stroke(); }); },
    mys_power(g) { G.circ(g, 0, 0, 32, '#fff7e3', 4.5); G.poly(g, [[4, -26], [-12, 4], [-2, 4], [-6, 26], [14, -6], [3, -6]], '#ffc93c', 3.5); }
  });
})();
