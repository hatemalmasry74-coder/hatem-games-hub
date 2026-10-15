/* Moody & Aboody - worlds/home_art.js : canvas-drawn rooms of the HOME world.
   Each room is a background drawer  fn(g, t, stage)  registered in Moody.rooms; flags live in stage.state. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {};
  const rr = G.fillRR;

  function floor(g, y, c1, c2, plank) {
    g.fillStyle = G.lin(g, 0, y, 0, 540, [c1, c2]); g.fillRect(0, y, 960, 540 - y); G.line(g, 0, y, 960, y, 4);
    if (plank) { g.strokeStyle = 'rgba(90,50,20,.18)'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 90 - 20, y); g.lineTo(i * 150 - 300, 540); g.stroke(); } }
  }
  function wall(g, y1, c1, c2) { g.fillStyle = G.lin(g, 0, 0, 0, y1, [c1, c2]); g.fillRect(0, 0, 960, y1); g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 12; i++) g.fillRect(i * 90, 0, 40, y1); }
  function win(g, x, y, w, h, t, night, curt) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = night ? G.lin(g, 0, y, 0, y + h, ['#16204a', '#2e3b7a']) : G.lin(g, 0, y, 0, y + h, ['#8fd6ff', '#d9f2ff']); g.fillRect(x, y, w, h);
    if (night) { for (let i = 0; i < 9; i++) G.sparkle(g, x + 14 + (i * 37) % (w - 20), y + 14 + (i * 53) % (h - 40), 3 + (i % 3), '#fff6a8', .6 + .4 * Math.sin(t * 2 + i)); A.draw(g, 'moon', x + w * .7, y + h * .3, 44); }
    else { G.sun(g, x + w * .75, y + h * .28, 16, t); G.cloud(g, x + ((t * 8) % (w + 60)) - 30, y + h * .6, .6); g.fillStyle = '#a8e0a0'; g.fillRect(x, y + h - 22, w, 22); }
    g.restore(); g.lineWidth = 6; g.strokeStyle = OL; g.strokeRect(x, y, w, h); G.line(g, x + w / 2, y, x + w / 2, y + h, 5); G.line(g, x, y + h / 2, x + w, y + h / 2, 5);
    if (curt) { [[x - 34, '#ff9ec0'], [x + w - 6, '#ff9ec0']].forEach(c => { g.beginPath(); g.moveTo(c[0], y - 12); g.lineTo(c[0] + 40, y - 12); g.quadraticCurveTo(c[0] + 52, y + h / 2, c[0] + 40, y + h + 10); g.lineTo(c[0], y + h + 10); g.closePath(); G.fs(g, c[1], 3.5); }); G.line(g, x - 46, y - 12, x + w + 46, y - 12, 7, '#8a5a3a'); }
  }
  function nightShade(g, s, light) {
    if (!s.state.night) return; g.fillStyle = 'rgba(14,20,60,' + (s.state.lightsOff ? .66 : .38) + ')'; g.fillRect(0, 0, 960, 540);
    if (light) { const gr = g.createRadialGradient(light[0], light[1], 10, light[0], light[1], 220); gr.addColorStop(0, 'rgba(255,226,120,.45)'); gr.addColorStop(1, 'rgba(255,226,120,0)'); g.fillStyle = gr; g.fillRect(0, 0, 960, 540); }
  }
  function rug(g, x, y, rx, ry, c1, c2) { G.ell(g, x, y, rx, ry, c1, 4); G.ell(g, x, y, rx * .7, ry * .7, c2, 3); G.ell(g, x, y, rx * .4, ry * .4, c1, 0); }
  function shelfWall(g, x, y, w, items) { rr(g, x, y, w, 10, 3, '#b97b4a', 3.5); items.forEach((a, i) => A.draw(g, a, x + 26 + i * 44, y - 20, 44)); }

  R.plain = function (g, t) { g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#bfe8ff', '#fff3c4']); g.fillRect(0, 0, 960, 540); G.sun(g, 800, 100, 36, t); G.cloud(g, 200 + (t * 10) % 500, 120, 1.2); floor(g, 470, '#c9a574', '#a98456'); };

  /* ---------- BEDROOM (bunk beds). flags: bedMade, night, lightsOff, lampOn, hideStorage, ring ---------- */
  R.bedroom = function (g, t, s) {
    const S = s.state; wall(g, 430, '#ffe7c9', '#ffd3a8'); floor(g, 430, '#d9a66e', '#b57e4a', true);
    win(g, 390, 90, 150, 140, t, S.night, true);
    // posters
    rr(g, 580, 100, 90, 110, 6, '#fff', 4); G.star(g, 625, 140, 22, '#ffd23c', 3); G.fillRR(g, 596, 176, 58, 14, 4, '#ff6f91', 2.5); rr(g, 700, 120, 70, 70, 6, '#fff', 4); G.circ(g, 735, 155, 24, '#8fd6ff', 3); A.draw(g, 'ball', 735, 155, 34);
    if (!S.hideStorage) { shelfWall(g, 590, 270, 150, ['book', 'teddy', 'robot']); }
    rug(g, 580, 480, 190, 36, '#ff9ec0', '#ffd0e0');
    // bunk bed
    const bx = 50, bw = 290;
    G.fillRR(g, bx, 170, 14, 262, 4, '#a0643a', 4); G.fillRR(g, bx + bw - 14, 170, 14, 262, 4, '#a0643a', 4);
    // top bunk
    rr(g, bx + 4, 200, bw - 8, 18, 4, '#c8935a', 4); rr(g, bx + 10, 172, bw - 20, 32, 8, S.bedMade ? '#6fbdf0' : '#9ec8ff', 4); rr(g, bx + 16, 176, 70, 20, 10, '#fff', 3);
    G.line(g, bx + 14, 170, bx + 14, 130, 5, '#a0643a'); G.line(g, bx + bw - 14, 170, bx + bw - 14, 130, 5, '#a0643a');
    for (let i = 0; i < 4; i++) G.line(g, bx + 14 + i * 90, 132, bx + 14 + i * 90, 170, 4, '#a0643a'); G.line(g, bx + 14, 133, bx + bw - 14, 133, 5, '#a0643a');
    // bottom bunk
    rr(g, bx + 4, 365, bw - 8, 20, 4, '#c8935a', 4);
    const mk = S.bedMade;
    rr(g, bx + 10, 322, bw - 20, 48, 12, mk ? '#ffb347' : '#ffcf8a', 4);
    if (mk) { rr(g, bx + 60, 318, bw - 70, 40, 12, '#ffa022', 3.5); G.line(g, bx + 60, 332, bx + bw - 12, 332, 3, 'rgba(255,255,255,.5)'); rr(g, bx + 14, 308, 76, 26, 13, '#fff', 3.5); }
    else { g.beginPath(); g.moveTo(bx + 60, 328); g.quadraticCurveTo(bx + 100, 296, bx + 160, 330); g.quadraticCurveTo(bx + 220, 308, bx + bw - 14, 340); g.lineTo(bx + bw - 14, 366); g.lineTo(bx + 60, 366); g.closePath(); G.fs(g, '#ffa022', 3.5); rr(g, bx + 20, S.pillowFixed ? 308 : 326, 70, 24, 12, '#fff', 3.5); }
    // ladder
    G.line(g, bx + bw - 44, 205, bx + bw - 44, 368, 5, '#a0643a'); G.line(g, bx + bw - 16, 205, bx + bw - 16, 368, 5, '#a0643a'); [230, 260, 290, 320, 350].forEach(y => G.line(g, bx + bw - 44, y, bx + bw - 16, y, 5, '#a0643a'));
    // shadow gap under bed
    g.fillStyle = 'rgba(60,30,10,.2)'; g.fillRect(bx + 14, 388, bw - 28, 42);
    // nightstand + alarm
    rr(g, 345, 352, 78, 78, 6, '#c8935a', 4.5); G.line(g, 345, 392, 423, 392, 3.5); G.circ(g, 384, 372, 3.5, '#ffd23c', 2); G.circ(g, 384, 412, 3.5, '#ffd23c', 2);
    if (S.alarm !== false) A.draw(g, 'alarm', 384, 322, 64, { ring: S.ring });
    if (S.lampOn || S.night) { A.draw(g, 'lamp', 410, 316, 50, { off: !S.lampOn }); }
    if (!S.hideStorage) {
      rr(g, 800, 130, 130, 300, 8, '#b97b4a', 5); G.line(g, 865, 130, 865, 430, 4); G.circ(g, 855, 280, 4, '#ffd23c', 2); G.circ(g, 875, 280, 4, '#ffd23c', 2); rr(g, 810, 145, 45, 70, 4, 'rgba(255,255,255,.18)', 2.5); rr(g, 875, 145, 45, 70, 4, 'rgba(255,255,255,.18)', 2.5);
      A.draw(g, 'toybox', 660, 408, 110);
    }
    nightShade(g, s, S.lampOn ? [410, 330] : null);
  };

  /* ---------- BATHROOM ---------- */
  R.bathroom = function (g, t, s) {
    const S = s.state; g.fillStyle = '#d6f3ee'; g.fillRect(0, 0, 960, 430); g.strokeStyle = 'rgba(31,181,166,.35)'; g.lineWidth = 2; for (let x = 0; x < 960; x += 60) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 430); g.stroke(); } for (let y = 0; y < 430; y += 60) { g.beginPath(); g.moveTo(0, y); g.lineTo(960, y); g.stroke(); }
    g.fillStyle = '#7fd9cc'; g.fillRect(0, 300, 960, 130); g.strokeStyle = 'rgba(255,255,255,.4)'; for (let y = 300; y < 430; y += 40) { g.beginPath(); g.moveTo(0, y); g.lineTo(960, y); g.stroke(); }
    floor(g, 430, '#f2efe4', '#d9d2c0'); g.strokeStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < 960; x += 80) { g.beginPath(); g.moveTo(x, 430); g.lineTo(x - 60, 540); g.stroke(); }
    // mirror
    rr(g, 370, 70, 220, 170, 18, '#bfe8ff', 6); g.save(); g.beginPath(); g.rect(380, 80, 200, 150); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(400, 230); g.lineTo(440, 80); g.lineTo(470, 80); g.lineTo(430, 230); g.fill(); g.restore();
    // sink
    rr(g, 340, 300, 280, 130, 10, '#fff', 5); rr(g, 330, 270, 300, 40, 20, '#fff', 5); G.ell(g, 480, 290, 90, 16, '#cfe9ff', 3.5);
    G.fillRR(g, 466, 238, 28, 40, 6, '#b8c0d0', 4); G.fillRR(g, 466, 238, 70, 14, 7, '#d5dbe8', 4); if (S.water) { for (let i = 0; i < 3; i++) G.ell(g, 528, 262 + ((t * 120 + i * 20) % 40), 3.5, 8, '#4aa8e8', 1.5); }
    A.draw(g, 'cup', 360, 262, 44); // glass
    if (!S.hideBrush) A.draw(g, 'toothbrush', 590, 262, 56);
    // tub
    rr(g, 700, 330, 250, 100, 30, '#fff', 5); rr(g, 712, 322, 226, 20, 10, '#cfe9ff', 3.5); G.line(g, 740, 310, 740, 250, 6, '#b8c0d0'); G.line(g, 740, 250, 790, 250, 6, '#b8c0d0');
    // towel
    G.line(g, 100, 150, 260, 150, 6, '#8a5a3a'); A.draw(g, 'towel', 180, 205, 120);
    A.draw(g, 'soap', 120, 400, 40);
    nightShade(g, s, null);
  };

  /* ---------- KITCHEN  flags: table, tapDrip, tapOff, hideTap ---------- */
  R.kitchen = function (g, t, s) {
    const S = s.state; wall(g, 430, '#fff0c4', '#ffe29a'); g.fillStyle = 'rgba(255,255,255,.4)'; for (let x = 0; x < 960; x += 70) for (let y = 200; y < 300; y += 50) g.fillRect(x + ((y / 50) % 2) * 35, y, 66, 46);
    floor(g, 430, '#e8d7b8', '#cbb48a'); g.strokeStyle = 'rgba(0,0,0,.08)'; for (let x = 0; x < 960; x += 90) { g.beginPath(); g.moveTo(x, 430); g.lineTo(x - 40, 540); g.stroke(); }
    // fridge
    rr(g, 20, 110, 130, 320, 12, '#f3f6fb', 5); G.line(g, 22, 230, 148, 230, 5); G.fillRR(g, 124, 150, 10, 60, 5, '#9aa0b5', 3); G.fillRR(g, 124, 250, 10, 80, 5, '#9aa0b5', 3);
    rr(g, 44, 140, 60, 50, 4, '#fff', 3); A.draw(g, 'apple', 74, 165, 34);
    // upper cabinets
    rr(g, 180, 60, 330, 130, 8, '#e0a560', 5); [0, 1, 2].forEach(i => { rr(g, 190 + i * 108, 70, 98, 110, 6, '#f0b872', 3.5); G.circ(g, 190 + i * 108 + 86, 150, 4, '#8a5a3a', 2); });
    // window
    win(g, 560, 80, 150, 110, t, false, false);
    // counter
    rr(g, 170, 300, 770, 130, 6, '#e0a560', 5); rr(g, 160, 286, 790, 26, 6, '#fff7e3', 5); [0, 1, 2, 3, 4, 5].forEach(i => { if (i === 3) return; rr(g, 184 + i * 126, 330, 112, 92, 6, '#f0b872', 3.5); G.circ(g, 184 + i * 126 + 98, 352, 4, '#8a5a3a', 2); });
    // stove
    rr(g, 450, 270, 150, 160, 8, '#9aa0b5', 5); rr(g, 462, 330, 126, 84, 6, '#6e7791', 4); [[490, 262], [560, 262]].forEach(p => G.ell(g, p[0], p[1], 28, 7, '#3a3f55', 3.5)); A.draw(g, 'pot', 525, 252, 70);
    // sink
    rr(g, 730, 270, 200, 24, 8, '#d5dbe8', 4.5); G.ell(g, 830, 290, 80, 10, '#8fbcd8', 3);
    if (!S.hideTap) { A.draw(g, 'tap', 830, 255, 80, { drip: !!S.tapDrip && !S.tapOff }); if (S.tapDrip && !S.tapOff) { G.ell(g, 856, 330 + ((t * 70) % 26), 4, 6, '#4aa8e8', 1.5); } }
    if (S.table) { rr(g, 270, 410, 400, 34, 12, '#c8935a', 5); G.fillRR(g, 290, 440, 14, 70, 3, '#a0643a', 3.5); G.fillRR(g, 636, 440, 14, 70, 3, '#a0643a', 3.5); [[320, 'plate'], [620, 'plate']].forEach(p => A.draw(g, p[1], p[0], 408, 60)); }
    nightShade(g, s, null);
  };

  /* ---------- LIVING ROOM  flags: night, tvOn, hideChair ---------- */
  R.living = function (g, t, s) {
    const S = s.state; wall(g, 430, '#e9defc', '#d3c2f2'); floor(g, 430, '#cfa56f', '#a98050', true);
    win(g, 410, 70, 150, 140, t, S.night, true);
    // wall clock
    A.draw(g, 'clock', 190, 120, 80);
    // hanging cabinet (high)
    rr(g, 640, 50, 170, 120, 8, '#b97b4a', 5); G.line(g, 725, 50, 725, 170, 4); G.circ(g, 715, 120, 4, '#ffd23c', 2); G.circ(g, 735, 120, 4, '#ffd23c', 2); if (S.cabinetOpen) { rr(g, 650, 60, 70, 100, 4, '#3a2a1e', 3); rr(g, 735, 60, 66, 100, 4, '#3a2a1e', 3); }
    rug(g, 480, 490, 230, 38, '#8a6bd6', '#b6a0f0');
    // sofa
    A.draw(g, 'sofa', 230, 370, 300); G.fillRR(g, 130, 330, 40, 30, 10, '#ffd23c', 3.5); G.fillRR(g, 290, 330, 40, 30, 10, '#ff6f91', 3.5);
    g.fillStyle = 'rgba(40,20,10,.35)'; g.fillRect(100, 424, 260, 10);
    // armchair
    if (!S.hideChair) A.draw(g, 'chair', 470, 380, 130);
    A.draw(g, 'plant', 600, 380, 110);
    // tv unit
    rr(g, 700, 360, 230, 74, 6, '#b97b4a', 5); G.line(g, 815, 360, 815, 434, 4); rr(g, 730, 250, 170, 104, 8, '#2f3448', 5); rr(g, 738, 258, 154, 88, 4, S.tvOn ? '#6fd0ff' : '#1d2133', 3); if (S.tvOn) { G.star(g, 815, 300, 24 + Math.sin(t * 4) * 3, '#ffd23c', 3); }
    nightShade(g, s, null);
  };

  /* ---------- STUDY / desk ---------- */
  R.study = function (g, t, s) {
    const S = s.state; wall(g, 430, '#d9f0ff', '#bfe3ff'); floor(g, 430, '#d9a66e', '#b57e4a', true);
    win(g, 90, 80, 160, 130, t, S.night, true); shelfWall(g, 620, 190, 260, ['book', 'notebook', 'bag', 'pencil', 'book']); shelfWall(g, 620, 110, 260, ['robot', 'ball', 'teddy']);
    rr(g, 300, 330, 400, 22, 6, '#c8935a', 5); G.fillRR(g, 316, 350, 18, 90, 3, '#a0643a', 3.5); G.fillRR(g, 666, 350, 18, 90, 3, '#a0643a', 3.5); rr(g, 330, 352, 120, 70, 6, '#b97b4a', 4);
    A.draw(g, 'lamp', 640, 292, 70, { off: !!S.lampOff }); if (!S.hideBook) { A.draw(g, 'notebook', 420, 308, 56); A.draw(g, 'pencil', 480, 318, 38); }
    if (!S.hideTablet) A.draw(g, 'tablet', 560, 312, 66);
    rug(g, 480, 490, 200, 34, '#1fb5a6', '#7fd9cc');
    nightShade(g, s, null);
  };

  /* ---------- BALCONY (evening) ---------- */
  R.balcony = function (g, t, s) {
    const S = s.state; g.fillStyle = G.lin(g, 0, 0, 0, 430, S.night ? ['#16204a', '#4a3f8a'] : ['#ffb07a', '#ffe0a8']); g.fillRect(0, 0, 960, 430);
    for (let i = 0; i < 16; i++) G.sparkle(g, (i * 137) % 960, 30 + (i * 71) % 220, 3 + i % 3, '#fff6a8', (S.night ? .5 : .15) + .3 * Math.sin(t * 2 + i));
    if (S.night) A.draw(g, 'moon', 760, 110, 90); else G.sun(g, 760, 200, 44, t);
    // skyline
    for (let i = 0; i < 9; i++) { const x = i * 120 - 20, hh = 120 + (i * 53) % 110; g.fillStyle = S.night ? '#2a2f5e' : '#d08a6a'; g.fillRect(x, 430 - hh, 90, hh); g.fillStyle = S.night ? '#ffe27a' : 'rgba(255,255,255,.35)'; for (let j = 0; j < 4; j++) for (let k = 0; k < 2; k++) g.fillRect(x + 14 + k * 38, 430 - hh + 14 + j * 28, 18, 16); }
    G.cloud(g, 150 + (t * 6) % 600, 90, 1.3, S.night ? .3 : .8);
    floor(g, 430, '#c9a574', '#a98456', true);
    // railing
    G.fillRR(g, 0, 330, 960, 14, 6, '#8a5a3a', 4.5); for (let x = 20; x < 960; x += 60) G.fillRR(g, x, 344, 10, 90, 3, '#b97b4a', 3.5);
    A.draw(g, 'plant', 120, 395, 120); A.draw(g, 'plant', 860, 395, 100);
    G.line(g, 280, 80, 640, 100, 3, '#6a4a2a'); [[330, '#ef5350'], [420, '#4a8dff'], [510, '#ffd23c'], [590, '#5cc96b']].forEach((c, i) => { G.poly(g, [[c[0] - 22, 82 + i * 4], [c[0] + 22, 84 + i * 4], [c[0] + 18, 130 + i * 4], [c[0] - 18, 128 + i * 4]], c[1], 3); });
  };

  /* ---------- helpers for missions ---------- */
  M.homeArt = { sparkleBurst: (st, x, y) => st.burst(x, y, { n: 14, kind: 'star' }) };
})();
