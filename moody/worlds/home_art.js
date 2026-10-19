/* Moody & Aboody - worlds/home_art.js : canvas-drawn rooms of the HOME world.
   Each room is a background drawer  fn(g, t, stage)  registered in Moody.rooms; flags live in stage.state. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {};
  const rr = G.fillRR;

  const RK = G.room;
  function floor(g, y, c1, c2, plank, o) { RK.floor(g, y, c1, c2, Object.assign({ kind: plank ? 'wood' : 'tile' }, o)); }
  function wall(g, y1, c1, c2, o) { RK.wall(g, y1, c1, c2, Object.assign({ pattern: 'stripes' }, o)); }
  /* window with a parallax view + sway curtains + light shaft (see G.window) */
  function win(g, s, x, y, w, h, night, curt, o) { G.window(g, s, x, y, w, h, Object.assign({ night, view: night ? 'night' : 'morning', curtains: curt ? '#ff8fb8' : null, tod: 'morning' }, o)); }
  function nightLights(s, light) { const S = s.state; if (!S.night) return; if (light) G.amb(s, { k: 'glow', x: light[0], y: light[1], r: S.lightsOff ? 260 : 190, col: '255,208,110', a: S.lightsOff ? .75 : .5, flick: .06, ph: 1, z: 'top' }); }
  function rug(g, x, y, rx, ry, c1, c2) { RK.rug(g, x, y, rx, ry, c1, c2, { star: true }); }
  function shelfWall(g, x, y, w, items) { RK.shelf(g, x, y, w); items.forEach((a, i) => A.draw(g, a, x + 26 + i * 44, y - 20, 44)); }
  M.look.setAll({
    plain: { tod: 'day', indoor: false, floor: 470 },
    bedroom: s => ({ tod: s.state.night ? 'night' : 'morning', floor: 430, lightX: 465, glow: s.state.night ? null : { x: 465, y: 150, r: 330, a: .2, col: '255,226,160' }, tint: s.state.lightsOff ? 'rgba(8,14,70,.5)' : undefined, vig: s.state.night ? .36 : .27 }),
    bathroom: s => ({ tod: s.state.night ? 'night' : 'cool', floor: 430, lightX: 480 }),
    kitchen: s => ({ tod: s.state.night ? 'night' : 'morning', floor: 430, lightX: 640 }),
    living: s => ({ tod: s.state.night ? 'night' : 'day', floor: 430, lightX: 485 }),
    study: s => ({ tod: s.state.night ? 'night' : 'day', floor: 430, lightX: 170 }),
    balcony: s => ({ tod: s.state.night ? 'night' : 'sunset', floor: 430, indoor: false, lightX: 760, vig: .3 })
  });

  R.plain = function (g, t, s) { G.far(g, s, c => { G.view(c, 'day', 0, 0, 960, 540, 20); }); G.hole(g, s, 0, 0, 960, 470); floor(g, 470, '#c9a574', '#a98456'); G.amb(s, { k: 'clouds', x0: -100, x1: 1060, y0: 50, y1: 200, n: 4, speed: 8, sc: .9, seed: 3 }); };

  /* ---------- BEDROOM (bunk beds). flags: bedMade, night, lightsOff, lampOn, hideStorage, ring ---------- */
  R.bedroom = function (g, t, s) {
    const S = s.state, N = S.night;
    wall(g, 430, '#ffe8cc', '#ffd6ac', { pattern: 'stars', pcol: 'rgba(255,255,255,.4)', dado: { h: 70, c: '#ffcc9c' } });
    floor(g, 430, '#dba670', '#a8733f', true);
    win(g, s, 390, 90, 150, 140, N, true);
    // posters
    RK.frame(g, 580, 100, 90, 110, { frame: '#fff', bg: '#2b3a67', draw: (g, x, y, w, h) => { for (let i = 0; i < 7; i++) G.sparkle(g, x + 8 + (i * 29) % (w - 14), y + 8 + (i * 41) % (h - 40), 3 + i % 3, '#fff6a8', .9); G.star(g, x + w / 2, y + h * .42, 22, '#ffd23c', 3); G.fillRR(g, x + 10, y + h - 24, w - 20, 12, 5, '#ff6f91', 2); } });
    RK.frame(g, 700, 120, 70, 70, { frame: '#fff', bg: '#bfe8ff', draw: (g, x, y, w, h) => { G.circ(g, x + w / 2, y + h / 2, 22, '#ffb347', 2.5); G.ell(g, x + w / 2, y + h / 2, 32, 7, null, 3, '#fff', -.4); A.draw(g, 'ball', x + w / 2 + 2, y + h / 2, 28); } });
    if (!S.hideStorage) { shelfWall(g, 590, 270, 150, ['book', 'teddy', 'robot']); }
    rug(g, 580, 480, 190, 36, '#ff9ec0', '#ffd0e0');
    // bunk bed
    const bx = 50, bw = 290;
    G.fillRR(g, bx, 170, 14, 262, 4, '#a0643a', 4); G.fillRR(g, bx + bw - 14, 170, 14, 262, 4, '#a0643a', 4);
    // top bunk
    rr(g, bx + 4, 200, bw - 8, 18, 4, '#c8935a', 4); rr(g, bx + 10, 172, bw - 20, 32, 8, S.bedMade ? '#5fb1ee' : '#9ec8ff', 4); for (let i = 0; i < 6; i++) G.sparkle(g, bx + 100 + i * 28, 188, 4, 'rgba(255,255,255,.7)', .8); rr(g, bx + 16, 176, 70, 20, 10, '#fff', 3);
    G.line(g, bx + 14, 170, bx + 14, 130, 5, '#a0643a'); G.line(g, bx + bw - 14, 170, bx + bw - 14, 130, 5, '#a0643a');
    for (let i = 0; i < 4; i++) G.line(g, bx + 14 + i * 90, 132, bx + 14 + i * 90, 170, 4, '#a0643a'); G.line(g, bx + 14, 133, bx + bw - 14, 133, 5, '#a0643a');
    // shadow under the top bunk falling on the bottom bunk + wall
    g.fillStyle = G.lin(g, 0, 218, 0, 262, ['rgba(60,25,5,.28)', 'rgba(60,25,5,0)']); g.fillRect(bx + 14, 218, bw - 28, 44);
    // bottom bunk
    rr(g, bx + 4, 365, bw - 8, 20, 4, '#c8935a', 4);
    const mk = S.bedMade;
    rr(g, bx + 10, 322, bw - 20, 48, 12, mk ? '#ffb347' : '#ffcf8a', 4);
    if (mk) { rr(g, bx + 60, 318, bw - 70, 40, 12, '#ffa022', 3.5); G.line(g, bx + 60, 332, bx + bw - 12, 332, 3, 'rgba(255,255,255,.5)'); for (let i = 0; i < 5; i++) G.sparkle(g, bx + 100 + i * 30, 346, 5, 'rgba(255,255,255,.65)', .8); rr(g, bx + 14, 308, 76, 26, 13, '#fff', 3.5); }
    else { g.beginPath(); g.moveTo(bx + 60, 328); g.quadraticCurveTo(bx + 100, 296, bx + 160, 330); g.quadraticCurveTo(bx + 220, 308, bx + bw - 14, 340); g.lineTo(bx + bw - 14, 366); g.lineTo(bx + 60, 366); g.closePath(); G.fs(g, '#ffa022', 3.5, null, [bx + 60, 300, bw - 74, 66]); g.strokeStyle = 'rgba(120,50,0,.25)'; g.lineWidth = 2.5; g.beginPath(); g.moveTo(bx + 110, 318); g.quadraticCurveTo(bx + 135, 340, bx + 160, 332); g.moveTo(bx + 190, 322); g.quadraticCurveTo(bx + 215, 346, bx + 240, 338); g.stroke(); rr(g, bx + 20, S.pillowFixed ? 308 : 326, 70, 24, 12, '#fff', 3.5); }
    // ladder
    G.line(g, bx + bw - 44, 205, bx + bw - 44, 368, 5, '#a0643a'); G.line(g, bx + bw - 16, 205, bx + bw - 16, 368, 5, '#a0643a'); [230, 260, 290, 320, 350].forEach(y => G.line(g, bx + bw - 44, y, bx + bw - 16, y, 5, '#a0643a'));
    // shadow gap under bed (gradient, darkest at the wall)
    g.fillStyle = G.lin(g, 0, 388, 0, 432, ['rgba(40,18,4,.36)', 'rgba(40,18,4,.08)']); g.fillRect(bx + 14, 388, bw - 28, 42);
    // nightstand + alarm
    G.ao(g, 345, 352, 78, 78); rr(g, 345, 352, 78, 78, 6, '#c8935a', 4.5); G.line(g, 345, 392, 423, 392, 3.5); G.circ(g, 384, 372, 3.5, '#ffd23c', 2); G.circ(g, 384, 412, 3.5, '#ffd23c', 2);
    if (S.alarm !== false) A.draw(g, 'alarm', 384, 322, 64, { ring: S.ring });
    if (S.lampOn || N) { A.draw(g, 'lamp', 410, 316, 50, { off: !S.lampOn }); }
    if (!S.hideStorage) {
      G.ao(g, 800, 130, 130, 300); rr(g, 800, 130, 130, 300, 8, '#b97b4a', 5); G.line(g, 865, 130, 865, 430, 4); G.circ(g, 855, 280, 4, '#ffd23c', 2); G.circ(g, 875, 280, 4, '#ffd23c', 2);
      [[810, 145], [875, 145]].forEach(p => { rr(g, p[0], p[1], 45, 70, 4, 'rgba(255,230,190,.28)', 2.5); rr(g, p[0], p[1] + 120, 45, 70, 4, 'rgba(255,230,190,.2)', 2); });
      g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(803, 133, 6, 292); g.fillStyle = 'rgba(40,15,0,.14)'; g.fillRect(922, 133, 6, 292);
      A.draw(g, 'toybox', 660, 408, 110);
    }
    // life: warm fairy lights over the bed (foreground, soft), hanging vine, lamp glow
    RK.stringLights(g, s, 40, 930, 26, 22, 18, ['#ffd86a', '#ff9ec0', '#9fe0ff', '#b6f08a'], true);
    G.near(g, s, c => { c.strokeStyle = 'rgba(70,120,50,.9)'; c.lineWidth = 3; c.beginPath(); c.moveTo(8, -4); c.bezierCurveTo(30, 40, 4, 80, 26, 130); c.stroke(); for (let i = 0; i < 9; i++) { const u = i / 8, x = 8 + Math.sin(u * 5) * 14 + u * 8, y = 10 + u * 120; c.fillStyle = i % 2 ? '#5cc96b' : '#3fae55'; c.beginPath(); c.ellipse(x + (i % 2 ? 8 : -8), y, 11, 6, i % 2 ? .6 : -.6, 0, 6.2832); c.fill(); } });
    nightLights(s, S.lampOn ? [410, 330] : null);
    if (S.lampOn && !N) G.amb(s, { k: 'glow', x: 410, y: 320, r: 90, col: '255,224,140', a: .35, z: 'top' });
  };

  /* ---------- BATHROOM ---------- */
  R.bathroom = function (g, t, s) {
    const S = s.state;
    RK.wall(g, 430, '#e2f8f4', '#c4ebe4', { pattern: 'tiles', tw: 60, th: 50, grout: 'rgba(255,255,255,.7)', crown: false, baseCol: '#f4fffd' });
    g.fillStyle = G.lin(g, 0, 300, 0, 430, ['#78d6c8', '#5cc4b6']); g.fillRect(0, 300, 960, 114); g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.beginPath(); for (let y = 300; y < 430; y += 38) { g.moveTo(0, y); g.lineTo(960, y); } for (let x = 0; x < 960; x += 60) { g.moveTo(x, 300); g.lineTo(x, 414); } g.stroke(); g.fillStyle = 'rgba(255,255,255,.65)'; g.fillRect(0, 296, 960, 6);
    RK.floor(g, 430, '#f4f1e6', '#d6cfbb', { kind: 'tile', alt: 'rgba(120,200,190,.18)', line: 'rgba(80,100,90,.22)' });
    // mirror with sheen + soft light
    g.fillStyle = 'rgba(30,60,60,.2)'; G.rr(g, 376, 80, 220, 170, 18); g.fill(); rr(g, 370, 70, 220, 170, 18, '#fdfdfd', 5); G.rr(g, 380, 80, 200, 150, 12); g.fillStyle = G.lin(g, 0, 80, 0, 230, ['#d8f1ff', '#a8d8f2']); g.fill();
    g.save(); G.rr(g, 380, 80, 200, 150, 12); g.clip(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(400, 230); g.lineTo(440, 80); g.lineTo(478, 80); g.lineTo(438, 230); g.fill(); g.beginPath(); g.moveTo(490, 230); g.lineTo(512, 80); g.lineTo(526, 80); g.lineTo(504, 230); g.fill(); g.restore();
    // sink
    G.ao(g, 340, 300, 280, 130); rr(g, 340, 300, 280, 130, 10, '#fff', 5); rr(g, 330, 270, 300, 40, 20, '#fff', 5); G.ell(g, 480, 290, 90, 16, '#cfe9ff', 3.5);
    G.fillRR(g, 466, 238, 28, 40, 6, '#b8c0d0', 4); G.fillRR(g, 466, 238, 70, 14, 7, '#d5dbe8', 4); if (S.water) { for (let i = 0; i < 3; i++) G.ell(g, 528, 262 + ((t * 120 + i * 20) % 40), 3.5, 8, '#4aa8e8', 1.5); }
    A.draw(g, 'cup', 360, 262, 44);
    if (!S.hideBrush) A.draw(g, 'toothbrush', 590, 262, 56);
    // tub
    G.ao(g, 700, 330, 250, 100); rr(g, 700, 330, 250, 100, 30, '#fff', 5); rr(g, 712, 322, 226, 20, 10, '#cfe9ff', 3.5); G.line(g, 740, 310, 740, 250, 6, '#b8c0d0'); G.line(g, 740, 250, 790, 250, 6, '#b8c0d0');
    G.line(g, 100, 150, 260, 150, 6, '#8a5a3a'); A.draw(g, 'towel', 180, 205, 120);
    A.draw(g, 'soap', 120, 400, 40);
    G.amb(s, { k: 'glow', x: 480, y: 150, r: 260, ry: 190, col: '230,250,255', a: .32, z: 'top' });
    G.amb(s, { k: 'bubbles', x0: 700, x1: 950, y0: 150, y1: 330, n: 7, z: 'top', seed: 4 }); G.amb(s, { k: 'steam', x: 820, y: 322, sc: .8, n: 3, z: 'mid' });
  };

  /* ---------- KITCHEN  flags: table, tapDrip, tapOff, hideTap ---------- */
  R.kitchen = function (g, t, s) {
    const S = s.state; wall(g, 430, '#fff2c8', '#ffe4a0', { pattern: 'none', pw: 70 });
    // backsplash tiles
    for (let x = 0; x < 960; x += 64) for (let y = 196, r = 0; y < 300; y += 36, r++) { const xo = x + (r % 2) * 32; g.fillStyle = 'rgba(255,255,255,' + (.46 + ((x / 64 + r) % 3) * .05) + ')'; G.rr(g, xo + 1.5, y + 1.5, 61, 33, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(xo + 6, y + 5, 22, 3); }
    floor(g, 430, '#e9d9b8', '#c9b186', false, { alt: 'rgba(255,255,255,.18)', line: 'rgba(110,80,40,.2)' });
    // fridge
    G.ao(g, 20, 110, 130, 320); rr(g, 20, 110, 130, 320, 12, '#f3f6fb', 5); G.line(g, 22, 230, 148, 230, 5); G.fillRR(g, 124, 150, 10, 60, 5, '#9aa0b5', 3); G.fillRR(g, 124, 250, 10, 80, 5, '#9aa0b5', 3);
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(28, 120, 8, 300);
    rr(g, 44, 140, 60, 50, 4, '#fff', 3); A.draw(g, 'apple', 74, 165, 34);
    // upper cabinets
    g.fillStyle = 'rgba(60,30,5,.22)'; g.fillRect(184, 190, 330, 14); rr(g, 180, 60, 330, 130, 8, '#e0a560', 5); [0, 1, 2].forEach(i => { rr(g, 190 + i * 108, 70, 98, 110, 6, '#f0b872', 3.5); rr(g, 198 + i * 108, 78, 82, 94, 4, 'rgba(255,255,255,.14)', 2); G.circ(g, 190 + i * 108 + 86, 150, 4, '#8a5a3a', 2); });
    win(g, s, 560, 80, 150, 110, false, false, { view: 'garden', frame: '#fff', curtains: null, floor: 300, dir: .2, spread: .2 });
    // counter
    G.ao(g, 170, 300, 770, 130); rr(g, 170, 300, 770, 130, 6, '#e0a560', 5); rr(g, 160, 286, 790, 26, 6, '#fff7e3', 5); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(166, 290, 778, 5); [0, 1, 2, 3, 4, 5].forEach(i => { if (i === 3) return; rr(g, 184 + i * 126, 330, 112, 92, 6, '#f0b872', 3.5); rr(g, 192 + i * 126, 338, 96, 76, 4, 'rgba(255,255,255,.13)', 2); G.circ(g, 184 + i * 126 + 98, 352, 4, '#8a5a3a', 2); });
    // stove
    rr(g, 450, 270, 150, 160, 8, '#9aa0b5', 5); rr(g, 462, 330, 126, 84, 6, '#6e7791', 4); g.fillStyle = 'rgba(255,255,255,.2)'; G.rr(g, 470, 338, 110, 22, 4); g.fill(); [[490, 262], [560, 262]].forEach(p => G.ell(g, p[0], p[1], 28, 7, '#3a3f55', 3.5)); A.draw(g, 'pot', 525, 252, 70);
    rr(g, 730, 270, 200, 24, 8, '#d5dbe8', 4.5); G.ell(g, 830, 290, 80, 10, '#8fbcd8', 3);
    if (!S.hideTap) { A.draw(g, 'tap', 830, 255, 80, { drip: false }); if (S.tapDrip && !S.tapOff) G.amb(s, { k: 'drip', x: 856, y: 316, z: 'mid' }); }
    if (S.table) { G.ao(g, 270, 410, 400, 34); rr(g, 270, 410, 400, 34, 12, '#c8935a', 5); G.fillRR(g, 290, 440, 14, 70, 3, '#a0643a', 3.5); G.fillRR(g, 636, 440, 14, 70, 3, '#a0643a', 3.5); [[320, 'plate'], [620, 'plate']].forEach(p => A.draw(g, p[1], p[0], 408, 60)); }
    G.amb(s, { k: 'steam', x: 525, y: 222, sc: 1, n: 4, z: 'mid' });
    nightLights(s, null);
  };

  /* ---------- LIVING ROOM  flags: night, tvOn, hideChair ---------- */
  R.living = function (g, t, s) {
    const S = s.state; wall(g, 430, '#ece2fd', '#d6c6f4', { pattern: 'stripes', pw: 90, dado: { h: 64, c: '#c9b6ee' } }); floor(g, 430, '#d2a972', '#a57a48', true);
    win(g, s, 410, 70, 150, 140, S.night, true, { view: S.night ? 'citynight' : 'city', tod: 'day' });
    A.draw(g, 'clock', 190, 120, 80); G.amb(s, { k: 'second', x: 190, y: 120, r: 26, z: 'mid' });
    g.fillStyle = 'rgba(40,15,0,.22)'; g.fillRect(646, 170, 170, 12);
    rr(g, 640, 50, 170, 120, 8, '#b97b4a', 5); G.line(g, 725, 50, 725, 170, 4); G.circ(g, 715, 120, 4, '#ffd23c', 2); G.circ(g, 735, 120, 4, '#ffd23c', 2); if (S.cabinetOpen) { rr(g, 650, 60, 70, 100, 4, '#3a2a1e', 3); rr(g, 735, 60, 66, 100, 4, '#3a2a1e', 3); }
    rug(g, 480, 490, 230, 38, '#8a6bd6', '#b6a0f0');
    A.draw(g, 'sofa', 230, 370, 300); G.fillRR(g, 130, 330, 40, 30, 10, '#ffd23c', 3.5); G.fillRR(g, 290, 330, 40, 30, 10, '#ff6f91', 3.5);
    if (!S.hideChair) A.draw(g, 'chair', 470, 380, 130);
    A.draw(g, 'plant', 600, 380, 110);
    G.ao(g, 700, 360, 230, 74); rr(g, 700, 360, 230, 74, 6, '#b97b4a', 5); G.line(g, 815, 360, 815, 434, 4); rr(g, 730, 250, 170, 104, 8, '#2f3448', 5); rr(g, 738, 258, 154, 88, 4, S.tvOn ? '#6fd0ff' : '#1d2133', 3);
    if (S.tvOn) { G.star(g, 815, 300, 24, '#ffd23c', 3); G.amb(s, { k: 'glow', x: 815, y: 330, r: 190, ry: 130, col: '120,200,255', a: .4, pulse: true, z: 'top' }); } else { g.fillStyle = 'rgba(255,255,255,.1)'; g.beginPath(); g.moveTo(742, 346); g.lineTo(790, 258); g.lineTo(820, 258); g.lineTo(772, 346); g.fill(); }
    nightLights(s, null);
  };

  /* ---------- STUDY / desk ---------- */
  R.study = function (g, t, s) {
    const S = s.state; wall(g, 430, '#dcf1ff', '#bfe0fb', { pattern: 'dots', pcol: 'rgba(255,255,255,.4)', dado: { h: 60, c: '#b5d8f5' } }); floor(g, 430, '#dba670', '#a8733f', true);
    win(g, s, 90, 80, 160, 130, S.night, true, { view: S.night ? 'night' : 'garden', tod: 'day', dir: .5 }); shelfWall(g, 620, 190, 260, ['book', 'notebook', 'bag', 'pencil', 'book']); shelfWall(g, 620, 110, 260, ['robot', 'ball', 'teddy']);
    G.ao(g, 300, 330, 400, 110); rr(g, 300, 330, 400, 22, 6, '#c8935a', 5); G.fillRR(g, 316, 350, 18, 90, 3, '#a0643a', 3.5); G.fillRR(g, 666, 350, 18, 90, 3, '#a0643a', 3.5); rr(g, 330, 352, 120, 70, 6, '#b97b4a', 4);
    g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(306, 333, 388, 4);
    A.draw(g, 'lamp', 640, 292, 70, { off: !!S.lampOff }); if (!S.lampOff) G.amb(s, { k: 'glow', x: 640, y: 300, r: 130, col: '255,226,140', a: .45, z: 'top' }); if (!S.hideBook) { A.draw(g, 'notebook', 420, 308, 56); A.draw(g, 'pencil', 480, 318, 38); }
    if (!S.hideTablet) A.draw(g, 'tablet', 560, 312, 66);
    rug(g, 480, 490, 200, 34, '#1fb5a6', '#7fd9cc');
    nightLights(s, null);
  };

  /* ---------- BALCONY (evening) ---------- */
  R.balcony = function (g, t, s) {
    const S = s.state, N = S.night;
    G.far(g, s, c => { G.view(c, N ? 'citynight' : 'citysunset', 0, 0, 960, 430, 20); });
    G.hole(g, s, 0, 0, 960, 430);
    if (N) { const R2 = G.rand(9), pts = []; for (let i = 0; i < 16; i++) pts.push([R2() * 960, 20 + R2() * 180, 2 + R2() * 2]); G.amb(s, { k: 'stars', pts, z: 'far' }); }
    else { G.amb(s, { k: 'clouds', x0: -120, x1: 1080, y0: 40, y1: 200, n: 4, speed: 7, sc: 1.1, a: .7, seed: 6 }); G.amb(s, { k: 'birds', y: 120, n: 3, speed: 24, sc: 1, seed: 3 }); }
    floor(g, 430, '#cfa874', '#a07446', true);
    // railing (glass-like top rail + balusters) casting soft shadow on the floor
    g.fillStyle = 'rgba(40,15,0,.18)'; g.fillRect(0, 432, 960, 12);
    G.fillRR(g, 0, 330, 960, 14, 6, '#8a5a3a', 4.5); for (let x = 20; x < 960; x += 60) G.fillRR(g, x, 344, 10, 90, 3, '#b97b4a', 3.5);
    A.draw(g, 'plant', 120, 395, 120); A.draw(g, 'plant', 860, 395, 100);
    G.line(g, 280, 80, 640, 100, 3, '#6a4a2a'); [[330, '#ef5350'], [420, '#4a8dff'], [510, '#ffd23c'], [590, '#5cc96b']].forEach((c, i) => { G.poly(g, [[c[0] - 22, 82 + i * 4], [c[0] + 22, 84 + i * 4], [c[0] + 18, 130 + i * 4], [c[0] - 18, 128 + i * 4]], c[1], 3); });
    if (!N) G.amb(s, { k: 'glow', x: 760, y: 220, r: 330, ry: 240, col: '255,170,90', a: .28, z: 'top' });
    G.amb(s, { k: 'leaves', x0: 40, x1: 900, y0: 120, y1: 420, n: 5, cols: ['#e9a24a', '#c97a3a', '#f0c060'], z: 'top', seed: 2 });
  };

  /* ---------- helpers for missions ---------- */
  M.homeArt = { sparkleBurst: (st, x, y) => st.burst(x, y, { n: 14, kind: 'star' }) };
})();
