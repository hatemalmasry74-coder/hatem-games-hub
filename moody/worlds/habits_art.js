/* Moody & Aboody - worlds/habits_art.js : canvas art of WORLD 9 "عاداتي كل يوم" (id 'habits').
   Rooms (Moody.rooms): habit_bath habit_prayroom habit_mosque habit_bedroom habit_dining habit_door habit_yard habit_street habit_mall habit_desk
   Props / stickers / icons: every art name starts with habit_ (plus the world-card icon w_habits).
   Room flags live in stage.state (documented above each room). Load before worlds/habits.js. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {}, rr = G.fillRR;
  const SKIN = '#e8b58a', WATER = '#4aa8e8';

  /* ---------------- helpers ---------------- */
  function wall(g, y1, c1, c2, stripe) { g.fillStyle = G.lin(g, 0, 0, 0, y1, [c1, c2]); g.fillRect(0, 0, 960, y1); if (stripe) { g.fillStyle = stripe; for (let i = 0; i < 12; i++) g.fillRect(i * 90, 0, 36, y1); } }
  function floorTiles(g, y, c1, c2, size, line) {
    g.fillStyle = G.lin(g, 0, y, 0, 540, [c1, c2]); g.fillRect(0, y, 960, 540 - y); g.strokeStyle = line || 'rgba(90,50,20,.16)'; g.lineWidth = 2;
    for (let i = -6; i < 22; i++) { g.beginPath(); g.moveTo(480 + (i - 8) * size * .55, y); g.lineTo(480 + (i - 8) * size * 1.5, 540); g.stroke(); }
    for (let k = 1; k < 5; k++) { const yy = y + (540 - y) * (k * k / 25); g.beginPath(); g.moveTo(0, yy); g.lineTo(960, yy); g.stroke(); }
    G.line(g, 0, y, 960, y, 4);
  }
  function glow(g, x, y, r, a) { const gr = g.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, 'rgba(255,236,150,' + (a || .5) + ')'); gr.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function win(g, x, y, w, h, t, o) {
    o = o || {}; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = o.night ? G.lin(g, 0, y, 0, y + h, ['#16204a', '#2e3b7a']) : o.dusk ? G.lin(g, 0, y, 0, y + h, ['#7a6bd0', '#ff9a6a']) : G.lin(g, 0, y, 0, y + h, ['#8fd6ff', '#e4f6ff']); g.fillRect(x, y, w, h);
    if (o.night) { for (let i = 0; i < 8; i++) G.sparkle(g, x + 12 + (i * 37) % (w - 18), y + 12 + (i * 53) % (h - 30), 3 + (i % 3), '#fff6a8', .6 + .4 * Math.sin(t * 2 + i)); A.draw(g, 'moon', x + w * .7, y + h * .32, Math.min(w, h) * .45); }
    else if (!o.dusk) { G.sun(g, x + w * .72, y + h * .3, Math.min(w, h) * .15, t); G.cloud(g, x + ((t * 8) % (w + 60)) - 30, y + h * .62, .5); }
    g.fillStyle = o.night ? '#2f5f45' : '#8ed08a'; g.fillRect(x, y + h - 18, w, 18); g.restore();
    g.lineWidth = 6; g.strokeStyle = OL; g.strokeRect(x, y, w, h); G.line(g, x + w / 2, y, x + w / 2, y + h, 5);
  }
  const drop = (g, x, y, s) => { g.beginPath(); g.moveTo(x, y - s); g.quadraticCurveTo(x + s * .9, y + s * .2, x, y + s * .9); g.quadraticCurveTo(x - s * .9, y + s * .2, x, y - s); G.fs(g, '#5bb8f0', 2.2); G.ell(g, x - s * .25, y + s * .12, s * .13, s * .24, 'rgba(255,255,255,.75)', 0); };
  const limb = (g, pts, w, col) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = w + 6; g.strokeStyle = OL; g.stroke(); g.lineWidth = w; g.strokeStyle = col; g.stroke(); };
  const face = (g, x, y, r, o) => { o = o || {}; G.circ(g, x, y, r, SKIN, 4); if (!o.noEyes) { G.circ(g, x - r * .36, y - r * .16, r * .09, OL, 0); G.circ(g, x + r * .36, y - r * .16, r * .09, OL, 0); } };

  /* ---------------- prayer figure (side view, facing right; origin = feet line y=44) ---------------- */
  const POSE = {
    stand: { H: [0, 10], S: [0, -18], Hd: [2, -34], K: [0, 28], F: [4, 44], E: [7, -4], Hn: [13, -10] },
    takbir: { H: [0, 10], S: [0, -18], Hd: [2, -34], K: [0, 28], F: [4, 44], E: [10, -8], Hn: [9, -28] },
    ruku: { H: [-12, 8], S: [24, 6], Hd: [38, 2], K: [-10, 28], F: [-8, 44], E: [8, 17], Hn: [-6, 27] },
    sujood: { H: [-16, 12], S: [16, 30], Hd: [32, 35], K: [-6, 42], F: [-34, 44], E: [22, 38], Hn: [32, 44] },
    julus: { H: [-26, 32], S: [-24, -4], Hd: [-22, -20], K: [6, 40], F: [-30, 44], E: [-10, 14], Hn: [2, 31] },
    salam: { H: [-26, 32], S: [-24, -4], Hd: [-20, -20], K: [6, 40], F: [-30, 44], E: [-10, 14], Hn: [2, 31] }
  };
  function figure(g, pose, o) {
    o = o || {}; const P = POSE[pose] || POSE.stand, shirt = o.shirt || '#f4f1ea', pants = o.pants || shirt, dress = o.dress;
    const far = (a) => [a[0] - 3, a[1]];
    limb(g, [P.H, P.K, P.F], dress ? 20 : 14, dress ? shirt : pants);                       // legs
    G.ell(g, P.F[0] + 4, P.F[1] + 2, 9, 5, SKIN, 3);
    limb(g, [P.H, P.S], 22, shirt);                                                          // torso
    limb(g, [P.S, P.E, P.Hn], 10, shirt); G.circ(g, P.Hn[0], P.Hn[1], 5.5, SKIN, 2.5);     // arm
    const hx = P.Hd[0], hy = P.Hd[1];
    if (o.scarf) { G.circ(g, hx - 1, hy, 14, o.scarf, 4); G.circ(g, hx + 5, hy - 1, 8, SKIN, 2.5); G.circ(g, hx + 7, hy - 3, 1.6, OL, 0); }
    else { G.circ(g, hx, hy, 12, SKIN, 3.5); g.beginPath(); g.arc(hx, hy, 12.3, Math.PI * 1.02, Math.PI * 1.98); g.closePath(); G.fs(g, o.cap || '#ffffff', 3); G.circ(g, hx + 5, hy - 1, 1.8, OL, 0); }
    if (pose === 'salam') { G.line(g, hx + 18, hy - 2, hx + 26, hy - 2, 3, '#ff8a2a'); G.poly(g, [[hx + 30, hy - 2], [hx + 24, hy - 7], [hx + 24, hy + 3]], '#ff8a2a', 1.5); }
  }
  M.habitFigure = figure;

  /* ---------------- exercise kid (front view) ---------------- */
  function kid(g, pose, o) {
    o = o || {}; const sh = o.shirt || '#4a8dff', pa = o.pants || '#2b3a67';
    const arms = { jump: [[-34, -34], [34, -34]], arms: [[-42, -14], [42, -14]], stretch: [[-16, -52], [38, -2]], squat: [[-30, -6], [30, -6]], down: [[-26, 8], [26, 8]] }[pose] || [[-26, 8], [26, 8]];
    const legs = pose === 'jump' ? [[-26, 44], [26, 44]] : pose === 'squat' ? [[-22, 30], [22, 30]] : [[-12, 44], [12, 44]];
    const yb = pose === 'squat' ? 6 : 0;
    legs.forEach(l => limb(g, [[l[0] * .35, 10 + yb], [l[0], l[1] - (pose === 'squat' ? 8 : 0)]], 13, pa));
    limb(g, [[0, -16 + yb], [0, 12 + yb]], 24, sh);
    arms.forEach((a, i) => { limb(g, [[i ? 11 : -11, -12 + yb], [a[0], a[1] + yb]], 9, sh); G.circ(g, a[0], a[1] + yb, 6, SKIN, 3); });
    face(g, 0, -30 + yb, 14); g.beginPath(); g.arc(0, -32 + yb, 14.5, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); G.fs(g, '#3a2a1e', 3);
    g.beginPath(); g.arc(0, -26 + yb, 5, .15, Math.PI - .15); g.lineWidth = 2.4; g.strokeStyle = OL; g.stroke();
  }
  /* front standing person with a job (stranger / guard / shop / police) */
  function person(g, kind) {
    const C = { stranger: ['#4a4f5e', '#2a2f3e', '#7a8090'], guard: ['#27406e', '#1b2c4e', '#27406e'], shop: ['#ffffff', '#4a6a9a', null], police: ['#3f6fb4', '#2a4a7e', '#2f5da0'] }[kind] || ['#888', '#444', null];
    limb(g, [[-8, 12], [-9, 44]], 13, C[1]); limb(g, [[8, 12], [9, 44]], 13, C[1]);
    G.fillRR(g, -20, -20, 40, 40, 12, C[0], 4);
    if (kind === 'shop') G.fillRR(g, -15, -8, 30, 36, 6, '#5cc96b', 3);
    limb(g, [[-17, -14], [-26, 10]], 9, C[0]); limb(g, [[17, -14], [26, 10]], 9, C[0]); G.circ(g, -26, 12, 5.5, SKIN, 2.5); G.circ(g, 26, 12, 5.5, SKIN, 2.5);
    face(g, 0, -34, 15);
    if (kind === 'stranger') { G.fillRR(g, -13, -41, 26, 8, 3, '#222', 2.5); G.line(g, -3, -37, 3, -37, 2.5, '#222'); g.beginPath(); g.arc(0, -42, 15, Math.PI, 0); G.fs(g, '#7a8090', 3); G.fillRR(g, -16, -46, 36, 6, 3, '#7a8090', 3); G.line(g, -6, -26, 6, -26, 2.5, OL); }
    else { g.beginPath(); g.arc(0, -42, 15, Math.PI, 0); G.fs(g, kind === 'shop' ? '#8a5a3a' : C[2], 3); if (kind !== 'shop') G.fillRR(g, -17, -46, 34, 7, 3, C[2], 3); G.line(g, -6, -26, 6, -26 + 0, 2.5, OL); g.beginPath(); g.arc(0, -29, 6, .2, Math.PI - .2); g.lineWidth = 2.5; g.strokeStyle = OL; g.stroke(); }
    if (kind === 'guard' || kind === 'police') G.star(g, -9, -8, 6, '#ffd23c', 1.8);
  }

  /* ================================================================
     ROOM habit_bath : bathroom for wudu.   flags: water (0..1 tap stream)
     ================================================================ */
  R.habit_bath = function (g, t, s) {
    const S = s.state; wall(g, 430, '#d6f3f0', '#b8e3df'); g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 3;
    for (let x = 0; x < 960; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 430); g.stroke(); } for (let y = 0; y < 430; y += 64) { g.beginPath(); g.moveTo(0, y); g.lineTo(960, y); g.stroke(); }
    G.line(g, 0, 300, 960, 300, 5, '#6fb5ad'); floorTiles(g, 430, '#f4efe4', '#dcd2bf', 70);
    rr(g, 372, 62, 216, 156, 14, '#fff', 5); rr(g, 384, 74, 192, 132, 8, '#dff4ff', 3); G.line(g, 410, 200, 470, 84, 18, 'rgba(255,255,255,.6)'); G.line(g, 490, 200, 520, 130, 9, 'rgba(255,255,255,.5)');
    rr(g, 330, 300, 300, 134, 12, '#fff', 5); rr(g, 346, 322, 130, 98, 8, '#f0eadc', 3); rr(g, 486, 322, 130, 98, 8, '#f0eadc', 3); G.circ(g, 450, 372, 5, '#ffd23c', 2); G.circ(g, 512, 372, 5, '#ffd23c', 2);
    G.ell(g, 480, 302, 128, 24, '#fff', 5); G.ell(g, 480, 306, 100, 15, '#cfe9f5', 3);
    A.draw(g, 'habit_tap', 480, 262, 100);
    const w = S.water || 0; if (w > 0) { g.save(); g.globalAlpha = Math.min(1, w); g.strokeStyle = 'rgba(100,180,240,.95)'; g.lineWidth = 7; g.lineCap = 'round'; g.setLineDash([14, 9]); g.lineDashOffset = -t * 90; g.beginPath(); g.moveTo(497, 270); g.lineTo(497, 304); g.stroke(); g.restore(); G.ell(g, 497, 308, 22 + Math.sin(t * 12) * 3, 6, 'rgba(120,200,250,.8)', 0); }
    rr(g, 724, 130, 8, 140, 3, '#b8c0d0', 3.5); rr(g, 700, 128, 56, 12, 6, '#b8c0d0', 3.5); G.fillRR(g, 706, 140, 44, 110, 6, '#fff3a8', 4); G.fillRR(g, 706, 140, 44, 22, 6, '#ffd23c', 3); // towel
    rr(g, 70, 380, 120, 20, 7, '#c8935a', 4.5); G.fillRR(g, 82, 400, 14, 34, 3, '#a0643a', 4); G.fillRR(g, 164, 400, 14, 34, 3, '#a0643a', 4);                                      // stool
    G.ell(g, 640, 450, 90, 14, '#7ac4d6', 3.5);
  };

  /* ================================================================
     ROOM habit_prayroom : cosy prayer corner with a big carpet.
     flags: pose ('stand'|'takbir'|'ruku'|'sujood'|'julus'|'salam'|null) -> draws the family praying in a row (Baba, Moody, Aboody + Toota, Nemo behind)
            lamp (soft glow)
     ================================================================ */
  R.habit_prayroom = function (g, t, s) {
    const S = s.state; wall(g, 430, '#fff0d8', '#f7d9ad', 'rgba(255,255,255,.12)'); floorTiles(g, 430, '#e9cf9e', '#cfae72', 80);
    win(g, 90, 80, 150, 190, t, { dusk: S.dusk }); rr(g, 78, 266, 174, 14, 5, '#b97b4a', 4);
    rr(g, 690, 150, 200, 120, 10, '#fff', 4.5); rr(g, 700, 160, 180, 100, 6, '#f6ecd6', 3);                                                                                 // wall frame with crescent
    g.beginPath(); g.arc(790, 210, 34, 0.5, Math.PI * 2 - .5); g.arc(802, 210, 28, Math.PI * 2 - .6, .6, true); G.fs(g, '#e0a82e', 3); G.star(g, 818, 196, 9, '#e0a82e', 2);
    rr(g, 745, 330, 90, 16, 6, '#8a5a3a', 4.5); rr(g, 752, 296, 76, 38, 5, '#3f9a6a', 4); G.line(g, 790, 298, 790, 332, 3, '#ffd23c');                                          // quran stand
    glow(g, 480, 20, 260, .3);
    const cx = 480, cy = 470; g.save(); g.beginPath(); g.moveTo(cx - 360, cy + 60); g.lineTo(cx - 300, cy - 84); g.lineTo(cx + 300, cy - 84); g.lineTo(cx + 360, cy + 60); g.closePath(); G.fs(g, '#2f8f6a', 5); g.clip();
    g.strokeStyle = '#e8c860'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - 330, cy + 50); g.lineTo(cx - 280, cy - 70); g.lineTo(cx + 280, cy - 70); g.lineTo(cx + 330, cy + 50); g.closePath(); g.stroke();
    for (let i = -3; i <= 3; i++) { g.fillStyle = 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(cx + i * 90, cy - 16, 34, Math.PI, 0); g.lineTo(cx + i * 90 + 34, cy + 40); g.lineTo(cx + i * 90 - 34, cy + 40); g.fill(); }
    g.restore();
    if (S.pose) {
      const P = S.pose, F = (x, y, sc, o) => { g.save(); g.translate(x, y); g.scale(sc, sc); g.lineJoin = 'round'; g.lineCap = 'round'; figure(g, P, o); g.restore(); };
      F(285, 361, 1.9, { dress: true, shirt: '#f3e6f7', scarf: '#8e5aa8' }); F(465, 378, 1.6, { dress: true, shirt: '#ffe3ec', scarf: '#e0709a' });
      F(195, 379, 2.3, { shirt: '#f4f1ea', pants: '#f4f1ea' }); F(365, 394, 2.0, { shirt: '#9aa0a8', pants: '#e0b43c' }); F(505, 414, 1.6, { shirt: '#2b3a67', pants: '#c8b27a' });
    }
  };

  /* ================================================================ ROOM habit_mosque : mosque entrance with shoe rack. flags: none */
  R.habit_mosque = function (g, t, s) {
    g.fillStyle = G.lin(g, 0, 0, 0, 400, ['#9fdcff', '#fff0cf']); g.fillRect(0, 0, 960, 540); G.sun(g, 130, 90, 28, t); G.cloud(g, ((t * 10) % 1100) - 80, 80, .8);
    const mw = '#fdf6e6', od = '#e8c78a'; // minarets
    [[110, 200], [850, 200]].forEach(m => { G.fillRR(g, m[0] - 26, 90, 52, 340, 4, mw, 4.5); G.fillRR(g, m[0] - 34, 150, 68, 14, 4, od, 3.5); G.fillRR(g, m[0] - 34, 250, 68, 14, 4, od, 3.5); g.beginPath(); g.moveTo(m[0] - 30, 90); g.quadraticCurveTo(m[0], 20, m[0] + 30, 90); G.fs(g, '#3f9a6a', 4.5); G.line(g, m[0], 28, m[0], 8, 4); G.circ(g, m[0], 6, 4, '#e0a82e', 2); });
    G.fillRR(g, 200, 220, 560, 214, 4, mw, 5); g.beginPath(); g.arc(480, 220, 130, Math.PI, 0); G.fs(g, '#3f9a6a', 5); G.line(g, 480, 90, 480, 66, 4); G.circ(g, 480, 62, 5, '#e0a82e', 2);
    for (let i = 0; i < 5; i++) { const x = 250 + i * 110; if (i === 2) continue; g.beginPath(); g.moveTo(x - 28, 330); g.lineTo(x - 28, 280); g.arc(x, 280, 28, Math.PI, 0); g.lineTo(x + 28, 330); g.closePath(); G.fs(g, '#bfe3f5', 4); }
    g.beginPath(); g.moveTo(414, 434); g.lineTo(414, 330); g.arc(480, 330, 66, Math.PI, 0); g.lineTo(546, 434); g.closePath(); G.fs(g, '#ffd98a', 5); glow(g, 480, 390, 110, .5); G.line(g, 480, 264, 480, 434, 3, 'rgba(120,70,20,.5)');
    G.fillRR(g, 0, 434, 960, 106, 0, '#e6d5b8', 0); G.line(g, 0, 434, 960, 434, 5); for (let i = 0; i < 9; i++) G.line(g, i * 120, 434, i * 120 - 60, 540, 2, 'rgba(90,50,20,.18)');
    rr(g, 600, 420, 260, 14, 4, '#a0643a', 4); rr(g, 610, 372, 240, 50, 6, '#c8935a', 4.5); G.line(g, 610, 398, 850, 398, 4);                                              // shoe rack
    [[640, 396], [700, 396], [760, 396], [820, 396], [660, 446], [730, 446]].forEach((p, i) => A.draw(g, 'habit_shoe:' + ['red', 'blue', 'green', 'pink', 'navy', 'red'][i], p[0], p[1] - (i > 3 ? 6 : 8), 38));
  };

  /* ================================================================ ROOM habit_bedroom : flags night (bool) */
  R.habit_bedroom = function (g, t, s) {
    const S = s.state, n = !!S.night; wall(g, 430, n ? '#4a5190' : '#ffe9cf', n ? '#2f3670' : '#ffd5a8'); floorTiles(g, 430, n ? '#7d6a8a' : '#f0dcc0', n ? '#54456a' : '#d8bf9a', 72);
    win(g, 640, 90, 190, 170, t, { night: n }); if (!n) glow(g, 735, 175, 220, .3);
    rr(g, 60, 280, 330, 24, 8, '#a0643a', 4.5); rr(g, 70, 300, 310, 110, 12, '#c8935a', 4.5); rr(g, 70, 230, 120, 56, 18, '#fff', 4.5); rr(g, 74, 296, 306, 28, 8, n ? '#6a6ac8' : '#4aa8e8', 4);   // bed
    rr(g, 190, 250, 190, 60, 14, n ? '#8a7ad8' : '#8fd6ff', 4.5); G.line(g, 220, 255, 220, 305, 3, 'rgba(255,255,255,.5)'); G.line(g, 270, 255, 270, 305, 3, 'rgba(255,255,255,.5)');
    if (S.sleeping) { G.circ(g, 130, 262, 24, SKIN, 4); G.text(g, 'z', 190, 200 + Math.sin(t * 2) * 6, { size: 36, color: '#fff', stroke: OL, sw: 5 }); G.text(g, 'Z', 220, 168 + Math.sin(t * 2 + 1) * 6, { size: 28, color: '#fff', stroke: OL, sw: 5 }); }
    rr(g, 440, 340, 86, 90, 8, '#c8935a', 4.5); rr(g, 450, 354, 66, 26, 5, '#b4783f', 3); A.draw(g, 'lamp', 483, 322, 52); if (n) glow(g, 483, 312, 120, .45);
    G.ell(g, 560, 458, 90, 14, n ? '#9a7ab0' : '#ff8fa8', 3.5);
    if (n) { g.fillStyle = 'rgba(20,20,70,.2)'; g.fillRect(0, 0, 960, 540); }
  };

  /* ================================================================ ROOM habit_dining : flags eaten (plates empty) */
  R.habit_dining = function (g, t, s) {
    const S = s.state; wall(g, 430, '#fff3da', '#ffe0b0', 'rgba(255,255,255,.1)'); floorTiles(g, 430, '#ead2a8', '#cfb27c', 80);
    win(g, 90, 90, 190, 160, t); glow(g, 185, 170, 200, .25); rr(g, 690, 120, 150, 100, 8, '#fff', 4.5); G.text(g, 'بالهنا والشفا', 765, 170, { size: 22, color: '#c25a00' });
    G.ell(g, 480, 312, 280, 56, '#fffdf4', 5); G.ell(g, 480, 322, 270, 42, '#ffeacb', 0); G.fillRR(g, 235, 330, 22, 100, 4, '#a0643a', 4); G.fillRR(g, 703, 330, 22, 100, 4, '#a0643a', 4);
    G.ell(g, 480, 304, 262, 44, '#f6d9a6', 4);
    [[310, 306], [480, 316], [650, 306]].forEach((p, i) => { A.draw(g, 'plate', p[0], p[1], 78); if (!S.eaten) A.draw(g, ['bread', 'cheese', 'egg'][i], p[0], p[1] - 4, 44); });
    A.draw(g, 'jug', 400, 280, 56); A.draw(g, 'cup', 560, 284, 40); A.draw(g, S.eaten ? 'heartbig' : 'tomato', 480, 276, 34);
    if (!S.eaten) for (let i = 0; i < 3; i++) { g.save(); g.globalAlpha = .5; g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); const x = 310 + i * 170, y = 260 - ((t * 20 + i * 10) % 30); g.moveTo(x, y); g.quadraticCurveTo(x + 8, y - 10, x, y - 20); g.stroke(); g.restore(); }
  };

  /* ================================================================ ROOM habit_door : flags open (0..1) */
  R.habit_door = function (g, t, s) {
    const S = s.state; wall(g, 430, '#e6f1ff', '#cfe0f5'); floorTiles(g, 430, '#ecd9b8', '#cdb48a', 70);
    const o = S.open || 0; g.fillStyle = G.lin(g, 0, 120, 0, 430, ['#8fd6ff', '#b8f0b0']); g.fillRect(380, 120, 200, 310); if (o > 0) { G.sun(g, 520, 190, 20, t); G.cloud(g, 440, 160, .5); }
    rr(g, 366, 108, 228, 330, 8, '#8a5a3a', 6); g.save(); g.beginPath(); g.rect(380, 120, 200, 310); g.clip(); const dw = 200 * (1 - o * .78); rr(g, 380, 120, dw, 310, 4, '#c8935a', 5); rr(g, 392, 138, dw - 24, 120, 4, '#b4783f', 3); rr(g, 392, 276, dw - 24, 140, 4, '#b4783f', 3); G.circ(g, 380 + dw - 14, 290, 7, '#ffd23c', 3); g.restore();
    rr(g, 110, 330, 170, 16, 6, '#c8935a', 4.5); [[150, 'red'], [200, 'blue'], [250, 'green']].forEach(p => A.draw(g, 'habit_shoe:' + p[1], p[0], 322, 40)); rr(g, 110, 150, 170, 14, 6, '#c8935a', 4.5);
    [140, 190, 240].forEach((x, i) => { G.circ(g, x, 168, 6, '#ffd23c', 2.5); }); A.draw(g, 'bag', 190, 220, 66);
    rr(g, 690, 150, 120, 90, 6, '#fff', 4.5); G.text(g, 'مع السلامة', 750, 196, { size: 24, color: '#c25a00' }); A.draw(g, 'plant', 880, 380, 120);
  };

  /* ================================================================ ROOM habit_yard : sunny exercise yard */
  R.habit_yard = function (g, t, s) {
    g.fillStyle = G.lin(g, 0, 0, 0, 330, ['#8fd6ff', '#e4f6ff']); g.fillRect(0, 0, 960, 540); G.sun(g, 820, 90, 30, t); G.cloud(g, ((t * 12) % 1100) - 80, 90, .9); G.cloud(g, ((t * 7 + 500) % 1100) - 80, 150, .6);
    g.fillStyle = '#9fd68a'; g.beginPath(); g.moveTo(0, 300); g.quadraticCurveTo(220, 250, 460, 300); g.quadraticCurveTo(700, 340, 960, 280); g.lineTo(960, 540); g.lineTo(0, 540); g.closePath(); g.fill(); G.line(g, 0, 300, 0, 300, 0);
    [[90, 250, 1.1], [880, 262, 1]].forEach(p => { G.fillRR(g, p[0] - 10, p[1] - 10, 20, 100 * p[2], 4, '#8a5a3a', 4); G.circ(g, p[0], p[1] - 40, 58 * p[2], '#5cc96b', 4.5); G.circ(g, p[0] - 38 * p[2], p[1] - 14, 36 * p[2], '#4fb85f', 3.5); G.circ(g, p[0] + 38 * p[2], p[1] - 14, 36 * p[2], '#4fb85f', 3.5); });
    g.fillStyle = '#7fc86f'; g.fillRect(0, 430, 960, 110); G.line(g, 0, 430, 960, 430, 4, '#4f9a45'); for (let i = 0; i < 14; i++) G.line(g, 30 + i * 70, 470 + (i % 3) * 20, 38 + i * 70, 460 + (i % 3) * 20, 3, '#5fae52');
    G.fillRR(g, 560, 360, 120, 12, 4, '#c8935a', 4); G.fillRR(g, 572, 372, 10, 40, 3, '#a0643a', 3); G.fillRR(g, 660, 372, 10, 40, 3, '#a0643a', 3);
    A.draw(g, 'habit_cone', 380, 420, 40); A.draw(g, 'habit_cone', 580, 440, 40);
  };

  /* ================================================================ ROOM habit_street : flags car {x,s,open}, person {x,y,s,kind}, car2 */
  R.habit_street = function (g, t, s) {
    const S = s.state; g.fillStyle = G.lin(g, 0, 0, 0, 300, ['#9fdcff', '#eaf7ff']); g.fillRect(0, 0, 960, 300); G.cloud(g, ((t * 9) % 1100) - 80, 70, .8); G.sun(g, 130, 80, 24, t);
    const cols = ['#ffd9a0', '#ffb3a0', '#bfe3f5', '#e0d0f5', '#d4efb4', '#ffe28a']; for (let i = 0; i < 7; i++) { const x = i * 140 - 20, h = 150 + (i * 53) % 70; G.fillRR(g, x, 300 - h, 130, h, 4, cols[i % 6], 4.5); for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) G.fillRR(g, x + 18 + c * 52, 300 - h + 20 + r * 44, 34, 28, 3, '#bfe8ff', 3); }
    g.fillStyle = '#6b6f80'; g.fillRect(0, 300, 960, 130); G.line(g, 0, 300, 960, 300, 4); for (let i = 0; i < 9; i++) G.fillRR(g, i * 110 + 20, 360, 60, 8, 3, '#fff7d0', 0);
    g.fillStyle = '#d9cdb4'; g.fillRect(0, 430, 960, 110); G.line(g, 0, 430, 960, 430, 5); for (let i = 0; i < 12; i++) G.line(g, i * 90, 430, i * 90 - 30, 540, 2, 'rgba(90,50,20,.15)');
    if (S.car) { const c = S.car; A.draw(g, 'habit_car', c.x, c.y || 372, c.s || 230); }
    if (S.person) { const p = S.person; G.shadow(g, p.x, p.y + p.s * .42, p.s * .3, 8, .22); A.draw(g, 'habit_person:' + (p.kind || 'stranger'), p.x, p.y, p.s || 150); }
    if (S.sign) { G.fillRR(g, 40, 270, 10, 160, 3, '#b8c0d0', 3.5); A.draw(g, 'habit_shop', 45, 250, 70); }
  };

  /* ================================================================ ROOM habit_mall : a shopping-centre hall (lost scene) */
  R.habit_mall = function (g, t, s) {
    wall(g, 430, '#fdeedd', '#f4d9c2'); floorTiles(g, 430, '#f4efe4', '#d6ccb8', 90, 'rgba(90,50,20,.12)');
    [[40, '#ef5350', 'محل ملابس'], [690, '#4a8dff', 'سوبر ماركت']].forEach(p => { G.fillRR(g, p[0], 150, 230, 280, 8, '#fff7e8', 5); G.fillRR(g, p[0] + 14, 190, 202, 160, 6, '#cdeaff', 3.5); g.fillStyle = p[1]; G.poly(g, [[p[0] - 6, 150], [p[0] + 236, 150], [p[0] + 226, 120], [p[0] + 4, 120]], p[1], 4.5); G.text(g, p[2], p[0] + 115, 136, { size: 22, color: '#fff', stroke: OL, sw: 4 }); G.fillRR(g, p[0] + 60, 360, 110, 22, 5, '#c8935a', 4); });
    G.fillRR(g, 340, 300, 280, 132, 10, '#8fa0c8', 5); G.fillRR(g, 340, 292, 280, 22, 8, '#e8ecf5', 4.5); rr(g, 400, 214, 160, 52, 10, '#2b3a67', 4.5); G.text(g, 'أمن واستعلامات', 480, 241, { size: 22, color: '#fff' });
    A.draw(g, 'plant', 650, 330, 90); A.draw(g, 'plant', 310, 330, 90);
    glow(g, 480, 10, 300, .3);
  };

  /* ================================================================ ROOM habit_desk : flags clean (bool), medal (bool), lamp */
  R.habit_desk = function (g, t, s) {
    const S = s.state; wall(g, 430, '#e7f1ff', '#cfe0f5', 'rgba(255,255,255,.1)'); floorTiles(g, 430, '#d9c3a0', '#bfa47a', 80);
    win(g, 80, 80, 180, 150, t, { night: S.night }); rr(g, 70, 226, 200, 14, 5, '#b97b4a', 4);
    rr(g, 690, 80, 200, 20, 6, '#c8935a', 4.5); [['#ef5350', 700], ['#4a8dff', 740], ['#5cc96b', 780], ['#8a6bd6', 820], ['#ffc93c', 856]].forEach(b => G.fillRR(g, b[1], 44, 30, 38, 3, b[0], 3.5));
    rr(g, 690, 190, 200, 20, 6, '#c8935a', 4.5); A.draw(g, 'habit_read', 740, 164, 50); A.draw(g, 'book', 820, 164, 44);
    rr(g, 250, 290, 460, 24, 8, '#c8935a', 5); G.fillRR(g, 268, 314, 22, 120, 4, '#a0643a', 4); G.fillRR(g, 670, 314, 22, 120, 4, '#a0643a', 4); rr(g, 540, 314, 130, 100, 6, '#b4783f', 4); G.circ(g, 605, 364, 5, '#ffd23c', 2);
    if (S.clean) { A.draw(g, 'notebook', 360, 262, 52); A.draw(g, 'pencil', 430, 268, 40); A.draw(g, 'book', 300, 258, 46); }
    A.draw(g, 'lamp', 600, 252, 66); if (S.lamp !== false) glow(g, 600, 232, 150, .35);
    if (S.medal) { g.save(); G.line(g, 480, 10, 480, 60, 3); A.draw(g, 'habit_medal', 480, 100 + Math.sin(t * 2) * 4, 96); g.restore(); }
    A.draw(g, 'chair', 190, 380, 120);
  };

  /* ================================================================
     PROPS (all names start with habit_)
     ================================================================ */
  A.registerAll({
    habit_tap(g) { g.save(); g.translate(2, 12); g.scale(.85, .85); G.fillRR(g, -34, -34, 62, 18, 8, '#b8c0d0', 4.5); G.fillRR(g, 12, -22, 16, 30, 6, '#b8c0d0', 4.5); G.fillRR(g, -10, -52, 20, 20, 6, '#ef5350', 4); G.fillRR(g, -44, -30, 14, 10, 4, '#9aa0b5', 3); g.restore(); },
    habit_drop(g) { drop(g, 0, 0, 34); },
    habit_wu(g, o) {
      const k = (o.args || [])[0] || 'hands';
      if (k === 'hands') { G.fillRR(g, -20, -48, 40, 12, 6, '#b8c0d0', 3.5); [-9, 0, 9].forEach((x, i) => G.line(g, x, -34, x, -4 + i % 2 * 6, 4, WATER)); [-1, 1].forEach(d => { limb(g, [[d * 22, 40], [d * 16, 8]], 22, SKIN); G.circ(g, d * 18, 4, 14, SKIN, 3.5); [-8, -2, 4].forEach(f => G.fillRR(g, d * 18 + f - 3, -12, 7, 16, 3.5, SKIN, 2.5)); }); drop(g, -32, 14, 6); drop(g, 34, 20, 6); }
      else if (k === 'mouth') { face(g, 0, -2, 38); G.ell(g, 0, 18, 15, 11, '#8a2a3a', 3.5); G.ell(g, 0, 24, 9, 5, '#ff8fa0', 0); drop(g, -30, 30, 7); drop(g, 32, 34, 6); drop(g, 0, 46, 5); G.ell(g, 0, -22, 5, 3, 'rgba(255,255,255,.0)', 0); g.beginPath(); g.arc(-18, -30, 4, 0, 6.3); G.fs(g, '#fff', 1); g.lineWidth = 3; g.beginPath(); g.arc(0, 34, 10, 0.3, 2.8); g.strokeStyle = WATER; g.stroke(); }
      else if (k === 'nose') { face(g, 0, 0, 38); g.beginPath(); g.moveTo(0, -6); g.quadraticCurveTo(14, 14, 7, 16); g.quadraticCurveTo(0, 20, -7, 16); g.quadraticCurveTo(-14, 14, 0, -6); G.fs(g, '#d79a6e', 3); G.circ(g, -3, 15, 1.6, OL, 0); G.circ(g, 3, 15, 1.6, OL, 0); g.beginPath(); g.arc(0, 10, 22, 0, 6.3); g.lineWidth = 3; g.setLineDash([5, 5]); g.strokeStyle = '#ff8a2a'; g.stroke(); g.setLineDash([]); drop(g, 0, 42, 8); drop(g, -14, 34, 5); }
      else if (k === 'face') { G.circ(g, 0, 0, 38, SKIN, 4); [-1, 1].forEach(d => { g.beginPath(); g.arc(d * 14, -6, 6, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); }); g.beginPath(); g.arc(0, 8, 16, .25, Math.PI - .25); g.lineWidth = 3.5; g.strokeStyle = OL; g.stroke(); [[-44, -16], [44, -18], [-40, 22], [42, 24], [0, -48], [-22, -46]].forEach((p, i) => drop(g, p[0], p[1], 6 + i % 2 * 2)); G.circ(g, -22, 14, 6, 'rgba(255,111,145,.5)', 0); G.circ(g, 22, 14, 6, 'rgba(255,111,145,.5)', 0); }
      else if (k === 'arms') { limb(g, [[-36, 4], [26, 4]], 22, SKIN); G.fillRR(g, 14, -12, 28, 32, 10, '#8fb3e8', 3.5); G.circ(g, -40, 4, 12, SKIN, 3.5); [-8, 0, 8].forEach(f => G.fillRR(g, -58, f - 3 + 4, 14, 6, 3, SKIN, 2.5)); g.beginPath(); g.arc(12, 6, 15, 0, 6.3); g.lineWidth = 3.5; g.setLineDash([5, 5]); g.strokeStyle = '#ff8a2a'; g.stroke(); g.setLineDash([]); drop(g, -24, -24, 7); drop(g, -4, -34, 7); drop(g, -34, 30, 6); drop(g, -10, 28, 6); }
      else if (k === 'head') { G.circ(g, 0, 4, 36, SKIN, 4); g.beginPath(); g.arc(0, 2, 37, Math.PI * 1.04, Math.PI * 1.96); g.closePath(); G.fs(g, '#3a2a1e', 3); [-1, 1].forEach(d => { G.ell(g, d * 37, 6, 7, 12, '#ffb98a', 3.5); }); g.beginPath(); g.arc(0, 4, 38, 0, 6.3); g.lineWidth = 0; G.ell(g, 0, -36, 24, 11, SKIN, 3.5); [-1, 0, 1].forEach(f => G.fillRR(g, f * 9 - 3, -48, 6, 14, 3, SKIN, 2.5)); [-1, 1].forEach(d => { g.beginPath(); g.arc(d * 14, 8, 5, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); }); drop(g, -30, -36, 5); drop(g, 32, -34, 5); }
      else if (k === 'feet') { [-1, 1].forEach(d => { limb(g, [[d * 18, -34], [d * 18, 14]], 18, SKIN); g.beginPath(); g.moveTo(d * 18 - 10, 14); g.quadraticCurveTo(d * 18 - 12, 38, d * 18 + d * 26, 38); g.quadraticCurveTo(d * 18 + d * 30, 28, d * 18 + 10, 22); g.closePath(); G.fs(g, SKIN, 3.5); G.line(g, d * 18 - 11, -6, d * 18 + 11, -6, 3, '#ff8a2a'); }); drop(g, -4, -34, 6); drop(g, 4, -24, 5); drop(g, -40, 20, 5); drop(g, 40, 22, 5); }
    },
    habit_time(g, o) {
      const k = (o.args || [])[0] || 'dhuhr'; g.save(); G.rr(g, -44, -44, 88, 88, 14); g.clip();
      const sky = { fajr: ['#2a2f6e', '#ff9a7a'], dhuhr: ['#6fc4f5', '#d8f0ff'], asr: ['#8fcdf0', '#ffe2a8'], maghrib: ['#6a4aa0', '#ff7a4a'], isha: ['#0c1233', '#27337a'] }[k];
      g.fillStyle = G.lin(g, 0, -44, 0, 44, sky); g.fillRect(-44, -44, 88, 88);
      if (k === 'fajr') { G.sparkle(g, -24, -30, 4, '#fff', .9); G.sparkle(g, 16, -34, 3, '#fff', .7); G.circ(g, 0, 22, 14, '#ffdf5e', 0); }
      if (k === 'dhuhr') { G.sun(g, 0, -18, 13, 0); }
      if (k === 'asr') { G.sun(g, 24, -2, 11, 0); }
      if (k === 'maghrib') { G.circ(g, 0, 20, 18, '#ffb23c', 0); G.cloud(g, -22, -8, .35, .7); }
      if (k === 'isha') { A.draw(g, 'moon', -4, -14, 36); [[-28, -30], [26, -24], [18, 2], [-30, 0], [30, -38]].forEach(p => G.sparkle(g, p[0], p[1], 3.5, '#fff6a8', .9)); }
      g.fillStyle = k === 'isha' ? '#101a30' : k === 'maghrib' ? '#3a2a4a' : '#6fb86a'; g.fillRect(-44, 22, 88, 22);
      const ms = k === 'isha' || k === 'maghrib' ? '#241f3a' : k === 'fajr' ? '#2a2a50' : '#f6efe0'; g.fillStyle = ms; g.beginPath(); g.arc(-18, 22, 10, Math.PI, 0); g.fill(); g.fillRect(-28, 22, 20, 4); g.fillRect(14, -2, 6, 26); g.beginPath(); g.moveTo(13, -2); g.lineTo(17, -12); g.lineTo(21, -2); g.fill();
      g.restore(); G.rr(g, -44, -44, 88, 88, 14); g.lineWidth = 4.5; g.strokeStyle = OL; g.stroke();
    },
    habit_pose(g, o) { const k = (o.args || [])[0] || 'stand'; G.fillRR(g, -46, -46, 92, 92, 14, '#e9f6ee', 3.5); G.fillRR(g, -46, 36, 92, 10, 5, '#2f8f6a', 2.5); g.save(); g.scale(.82, .82); g.translate(-4, -6); figure(g, k === 'qiyam' ? 'stand' : k, { shirt: '#f4f1ea', pants: '#d9d2c0' }); g.restore(); },
    habit_shoe(g, o) { const c = (M.pkColors && M.pkColors[(o.args || [])[0]]) || ({ red: '#ef5350', blue: '#4a8dff', pink: '#ff6f91', green: '#5cc96b', navy: '#26396e' }[(o.args || [])[0]]) || '#ef5350'; g.beginPath(); g.moveTo(-34, -14); g.lineTo(-8, -14); g.quadraticCurveTo(0, 8, 32, 10); g.quadraticCurveTo(44, 26, 30, 28); g.lineTo(-34, 28); g.closePath(); G.fs(g, c, 4.5); G.fillRR(g, -36, 22, 72, 10, 5, '#fff', 3.5); G.line(g, -6, -2, 6, 6, 3, '#fff'); G.line(g, 4, -6, 16, 2, 3, '#fff'); },
    habit_rack(g) { G.fillRR(g, -42, -4, 84, 10, 4, '#a0643a', 4); G.fillRR(g, -38, 6, 8, 34, 3, '#a0643a', 3.5); G.fillRR(g, 30, 6, 8, 34, 3, '#a0643a', 3.5); A.draw(g, 'habit_shoe:blue', -16, -22, 36); A.draw(g, 'habit_shoe:red', 18, -22, 36); },
    habit_mosque(g) { g.beginPath(); g.arc(0, -4, 26, Math.PI, 0); G.fs(g, '#3f9a6a', 4.5); G.fillRR(g, -34, -4, 68, 42, 3, '#fdf6e6', 4.5); g.beginPath(); g.moveTo(-8, 38); g.lineTo(-8, 22); g.arc(0, 22, 8, Math.PI, 0); g.lineTo(8, 38); g.closePath(); G.fs(g, '#ffd98a', 3); [-42, 42].forEach(x => { G.fillRR(g, x - 6, -22, 12, 60, 2, '#fdf6e6', 4); g.beginPath(); g.moveTo(x - 7, -22); g.lineTo(x, -40); g.lineTo(x + 7, -22); G.fs(g, '#3f9a6a', 3.5); }); G.line(g, 0, -30, 0, -42, 3); G.circ(g, 0, -44, 3, '#e0a82e', 1.5); },
    habit_mat(g) { g.beginPath(); g.moveTo(-34, 40); g.lineTo(-28, -40); g.lineTo(28, -40); g.lineTo(34, 40); g.closePath(); G.fs(g, '#2f8f6a', 4.5); g.beginPath(); g.moveTo(-18, 30); g.lineTo(-18, -4); g.arc(0, -4, 18, Math.PI, 0); g.lineTo(18, 30); G.fs(g, null, 3, '#e8c860'); G.star(g, 0, 12, 7, '#e8c860', 1.5); },
    habit_sit(g, o) {
      const k = (o.args || [])[0] || 'eat';
      if (k === 'eat') { A.draw(g, 'plate', 0, 12, 76); A.draw(g, 'bread', -4, 8, 40); A.draw(g, 'spoon', 34, 14, 36); [-18, 0, 18].forEach((x, i) => { g.save(); g.globalAlpha = .6; g.strokeStyle = '#b8b0a0'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, -22); g.quadraticCurveTo(x + 7, -32, x, -42); g.stroke(); g.restore(); }); }
      else if (k === 'afteat') { A.draw(g, 'plate', -8, 18, 66); G.sparkle(g, -8, 18, 8, '#fff', 1); A.draw(g, 'cup', 28, 10, 40); G.heart(g, 0, -26, 12, '#ff5a7a', 3); G.circ(g, 36, -30, 12, '#5cc96b', 3); g.beginPath(); g.moveTo(30, -30); g.lineTo(35, -25); g.lineTo(43, -36); g.lineWidth = 3.5; g.strokeStyle = '#fff'; g.stroke(); }
      else if (k === 'wake') { G.fillRR(g, -42, 4, 84, 30, 6, '#c8935a', 4.5); G.fillRR(g, -42, -4, 26, 20, 9, '#fff', 4); G.fillRR(g, -16, -2, 58, 20, 6, '#8fd6ff', 4); G.sun(g, 24, -30, 12, 0); G.circ(g, -30, -8, 9, SKIN, 3); }
      else if (k === 'sleep') { G.fillRR(g, -42, 4, 84, 30, 6, '#c8935a', 4.5); G.fillRR(g, -42, -4, 26, 20, 9, '#fff', 4); G.fillRR(g, -16, -2, 58, 20, 6, '#8a7ad8', 4); G.circ(g, -30, -8, 9, SKIN, 3); A.draw(g, 'moon', 24, -30, 30); G.text(g, 'z', -6, -26, { size: 20, color: '#fff', stroke: OL, sw: 4 }); G.sparkle(g, 40, -4, 5, '#fff6a8', 1); }
      else if (k === 'leave') { G.fillRR(g, -34, -42, 52, 84, 6, '#8a5a3a', 4.5); G.fillRR(g, -26, -34, 36, 68, 3, '#8fd6ff', 3); G.poly(g, [[-30, -40], [4, -34], [4, 40], [-30, 40]], '#c8935a', 4); G.circ(g, -2, 4, 3.5, '#ffd23c', 1.5); A.draw(g, 'arrow', 30, 6, 34); A.draw(g, 'bag', 22, -20, 28); }
      else if (k === 'greet') { [-1, 1].forEach(d => { limb(g, [[d * 22, 40], [d * 22, 6]], 18, d < 0 ? '#ff6f91' : '#4a8dff'); face(g, d * 22, -10, 14); limb(g, [[d * 12, 14], [d * 4, -6]], 7, d < 0 ? '#ff6f91' : '#4a8dff'); }); G.fillRR(g, -26, -50, 52, 26, 12, '#fff', 3.5); G.text(g, 'سلام', 0, -37, { size: 15 }); }
      else if (k === 'nice') { A.draw(g, 'cake', 0, 12, 60); [[-30, -24], [30, -28], [0, -34]].forEach(p => G.star(g, p[0], p[1], 8, '#ffc93c', 2)); G.heart(g, 0, -30, 8, '#ff5a7a', 2); }
    },
    habit_ex(g, o) {
      const k = (o.args || [])[0] || 'jump'; G.fillRR(g, -46, -46, 92, 92, 14, '#e7f7e2', 3.5);
      if (k === 'water') { A.draw(g, 'habit_bottle', 0, 0, 80); } else { g.save(); g.scale(.78, .78); g.translate(0, 4); kid(g, k === 'warm' ? 'arms' : k, {}); g.restore(); }
    },
    habit_bottle(g) { G.fillRR(g, -16, -40, 32, 18, 6, '#4a8dff', 3.5); G.fillRR(g, -22, -24, 44, 66, 14, 'rgba(200,236,255,.9)', 4.5); G.fillRR(g, -18, -4, 36, 42, 11, '#4aa8e8', 0); G.line(g, -12, -18, -12, 28, 3, 'rgba(255,255,255,.7)'); },
    habit_cone(g) { G.poly(g, [[0, -34], [22, 30], [-22, 30]], '#ff8a2a', 4); G.line(g, -9, 0, 9, 0, 5, '#fff'); G.fillRR(g, -28, 28, 56, 10, 3, '#e07a1a', 3); },
    habit_bed(g) { G.fillRR(g, -42, 2, 84, 32, 6, '#c8935a', 4.5); G.fillRR(g, -42, -10, 28, 24, 10, '#fff', 4); G.fillRR(g, -14, -4, 56, 22, 6, '#8a7ad8', 4); G.circ(g, -28, -14, 9, SKIN, 3); },
    habit_late(g) { A.draw(g, 'tablet', -6, 6, 64); A.draw(g, 'moon', 28, -28, 36); G.text(g, 'z', 36, 24, { size: 20, color: '#8a6bd6', stroke: '#fff', sw: 3 }); },
    habit_car(g) { G.fillRR(g, -46, -4, 92, 30, 10, '#4a8dff', 4.5); g.beginPath(); g.moveTo(-28, -4); g.lineTo(-20, -26); g.lineTo(18, -26); g.lineTo(30, -4); g.closePath(); G.fs(g, '#4a8dff', 4.5); g.beginPath(); g.moveTo(-23, -6); g.lineTo(-17, -22); g.lineTo(-2, -22); g.lineTo(-2, -6); g.closePath(); G.fs(g, '#cdeaff', 3); g.beginPath(); g.moveTo(3, -6); g.lineTo(3, -22); g.lineTo(16, -22); g.lineTo(24, -6); g.closePath(); G.fs(g, '#cdeaff', 3); [-26, 26].forEach(x => { G.circ(g, x, 26, 11, '#3a3f55', 4); G.circ(g, x, 26, 4.5, '#ccd', 0); }); G.fillRR(g, 38, 6, 8, 8, 3, '#fff3a0', 2.5); },
    habit_puppy(g) { G.ell(g, 0, 8, 28, 26, '#e0a860', 4.5); [-1, 1].forEach(d => G.ell(g, d * 26, -10, 10, 22, '#a06830', 3.5, null, d * .3)); G.circ(g, -10, 2, 3.4, OL, 0); G.circ(g, 10, 2, 3.4, OL, 0); G.ell(g, 0, 14, 8, 6, '#3a2a1e', 2); G.ell(g, 0, 26, 6, 5, '#ff8fa0', 2); },
    habit_phone(g) { G.fillRR(g, -20, -42, 40, 84, 8, '#3a3f55', 4.5); G.fillRR(g, -15, -32, 30, 56, 3, '#cdeaff', 2.5); G.circ(g, 0, 33, 4, '#9aa0b5', 2); G.fillRR(g, -12, -28, 20, 12, 6, '#fff', 2); G.fillRR(g, -4, -12, 18, 10, 5, '#8fd6ff', 2); },
    habit_secret(g) { G.fillRR(g, -34, -30, 68, 52, 14, '#fff', 4.5); G.poly(g, [[-10, 20], [-18, 38], [8, 20]], '#fff', 4.5); G.fillRR(g, -28, -24, 56, 40, 10, '#fff', 0); G.text(g, 'سر', 0, -6, { size: 28, color: '#8a6bd6' }); A.draw(g, 'lock', 26, -30, 28); },
    habit_run(g) { A.draw(g, 'arrow', 6, 26, 40); g.save(); g.scale(.7, .7); g.translate(-6, -2); limb(g, [[0, -10], [-6, 18]], 16, '#ff6f91'); face(g, 4, -26, 13); limb(g, [[-2, 20], [-24, 42]], 11, '#2b3a67'); limb(g, [[-2, 20], [18, 40]], 11, '#2b3a67'); limb(g, [[0, -6], [-26, -14]], 8, '#ff6f91'); limb(g, [[0, -6], [24, 6]], 8, '#ff6f91'); g.restore(); },
    habit_shout(g) { face(g, -10, 4, 28); G.ell(g, -4, 14, 10, 11, '#8a2a3a', 3); [0, 1, 2].forEach(i => { g.beginPath(); g.arc(14, 12, 14 + i * 10, -.7, .7); g.lineWidth = 4; g.strokeStyle = '#ef5350'; g.stroke(); }); },
    habit_tell(g) { limb(g, [[22, 42], [22, 8]], 20, '#ff6f91'); face(g, 22, -10, 15); G.fillRR(g, -44, -30, 56, 32, 12, '#fff', 3.5); G.poly(g, [[6, 0], [18, 10], [12, -4]], '#fff', 3.5); G.heart(g, -16, -14, 9, '#ff5a7a', 2.5); },
    habit_person(g, o) { person(g, (o.args || [])[0] || 'stranger'); },
    habit_shop(g) { G.fillRR(g, -34, -4, 68, 42, 4, '#fff7e8', 4.5); G.poly(g, [[-40, -4], [40, -4], [34, -30], [-34, -30]], '#ef5350', 4.5); for (let i = 0; i < 4; i++) G.poly(g, [[-40 + i * 20, -4], [-20 + i * 20, -4], [-22 + i * 20, 4], [-38 + i * 20, 4]], i % 2 ? '#fff' : '#ef5350', 2); G.fillRR(g, -10, 10, 20, 28, 3, '#8a5a3a', 3); },
    habit_guard(g) { person(g, 'guard'); },
    habit_desk(g) { G.fillRR(g, -40, -6, 80, 12, 4, '#c8935a', 4.5); G.fillRR(g, -34, 6, 8, 34, 3, '#a0643a', 3.5); G.fillRR(g, 26, 6, 8, 34, 3, '#a0643a', 3.5); A.draw(g, 'book', -16, -22, 34); A.draw(g, 'pencil', 12, -20, 28); G.sparkle(g, 30, -34, 7, '#fff6a8', 1); },
    habit_review(g) { G.fillRR(g, -30, -40, 60, 80, 6, '#fff', 4.5); [-22, -4, 14].forEach((y, i) => { G.circ(g, -16, y, 5, '#5cc96b', 2.5); G.line(g, -6, y, 20, y, 4, '#b9c4d8'); }); g.beginPath(); g.moveTo(-20, 14); g.lineTo(-16, 18); g.lineTo(-10, 10); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); },
    habit_read(g) { g.beginPath(); g.moveTo(0, -24); g.quadraticCurveTo(-24, -34, -42, -24); g.lineTo(-42, 26); g.quadraticCurveTo(-24, 16, 0, 26); G.fs(g, '#fff', 4.5); g.beginPath(); g.moveTo(0, -24); g.quadraticCurveTo(24, -34, 42, -24); g.lineTo(42, 26); g.quadraticCurveTo(24, 16, 0, 26); G.fs(g, '#fff7e3', 4.5); [-10, 2, 14].forEach(y => { G.line(g, -34, y - 10, -8, y - 8, 3, '#b9c4d8'); G.line(g, 8, y - 8, 34, y - 10, 3, '#b9c4d8'); }); },
    habit_rest(g) { A.draw(g, 'ball', -10, 8, 46); A.draw(g, 'cup', 28, 10, 34); G.sparkle(g, 26, -24, 8, '#fff6a8', 1); G.heart(g, -20, -26, 8, '#ff5a7a', 2); },
    habit_quiet(g) { face(g, 0, 4, 34); G.fillRR(g, -5, 6, 10, 26, 5, '#e8b58a', 3); G.line(g, -12, 14, 12, 14, 4, OL); G.text(g, 'ششش', 30, -30, { size: 18, color: '#8a6bd6' }); },
    habit_clock5(g) { A.draw(g, 'clock', 0, 0, 80); G.text(g, '٥ د', 26, 26, { size: 20, color: '#ef5350', stroke: '#fff', sw: 4 }); },
    habit_teacher(g) { limb(g, [[0, 44], [0, 4]], 28, '#8a6bd6'); face(g, 0, -14, 17); g.beginPath(); g.arc(0, -22, 17.5, Math.PI * 1.02, Math.PI * 1.98); G.fs(g, '#3a2a1e', 3); G.circ(g, -7, -14, 6, null, 2.5); G.circ(g, 7, -14, 6, null, 2.5); G.line(g, -1, -14, 1, -14, 2, OL); limb(g, [[12, 8], [30, -8]], 8, '#8a6bd6'); G.line(g, 30, -8, 40, -32, 4, '#c8935a'); },
    habit_medal(g) {
      G.poly(g, [[-18, -50], [-4, -50], [8, -8], [-8, -8]], '#ef5350', 3.5); G.poly(g, [[18, -50], [4, -50], [-8, -8], [8, -8]], '#4a8dff', 3.5);
      G.circ(g, 0, 16, 32, '#ffc93c', 5); G.circ(g, 0, 16, 24, '#ffdf6e', 3); G.star(g, 0, 14, 17, '#fff7c4', 2.5); G.text(g, 'تفوّق', 0, 40, { size: 15, color: '#b07a10', stroke: '#fff7c4', sw: 3 });
    },
    habit_hands(g) { g.beginPath(); g.moveTo(-34, -6); g.quadraticCurveTo(-36, 34, 0, 36); g.quadraticCurveTo(36, 34, 34, -6); g.quadraticCurveTo(22, 10, 0, 8); g.quadraticCurveTo(-22, 10, -34, -6); G.fs(g, SKIN, 4); [-1, 1].forEach(d => { G.ell(g, d * 30, -12, 6, 14, SKIN, 3.5, null, d * .3); }); G.line(g, -12, 18, 12, 18, 3, '#c98f60'); G.sparkle(g, 0, -26, 13, '#ffd23c', 1); G.sparkle(g, -22, -34, 6, '#fff6a8', 1); G.sparkle(g, 22, -36, 6, '#fff6a8', 1); },
    habit_dumbbell(g) { G.fillRR(g, -30, -4, 60, 8, 3, '#9aa0b5', 3.5); [-1, 1].forEach(d => { G.fillRR(g, d * 30 - 9, -22, 18, 44, 6, '#ef5350', 4); G.fillRR(g, d * 40 - 6, -14, 12, 28, 4, '#c0362f', 3.5); }); },
    habit_shield(g) { g.beginPath(); g.moveTo(0, -42); g.lineTo(34, -30); g.lineTo(32, 6); g.quadraticCurveTo(26, 30, 0, 44); g.quadraticCurveTo(-26, 30, -32, 6); g.lineTo(-34, -30); g.closePath(); G.fs(g, '#4a8dff', 5); G.heart(g, 0, -4, 14, '#fff', 2.5); },
    habit_sparkles(g) { G.sparkle(g, 0, 0, 30, '#ffd23c', 1); G.sparkle(g, -26, -20, 12, '#fff6a8', 1); G.sparkle(g, 26, 20, 10, '#fff6a8', 1); },
    w_habits(g) {
      G.poly(g, [[-18, -50], [-4, -50], [10, -4], [-6, -4]], '#ef5350', 4); G.poly(g, [[18, -50], [4, -50], [-10, -4], [6, -4]], '#4a8dff', 4);
      G.circ(g, 0, 16, 34, '#ffc93c', 5); G.circ(g, 0, 16, 25, '#ffdf6e', 3); g.beginPath(); g.arc(-2, 16, 14, 0.7, Math.PI * 2 - .7); g.arc(4, 16, 11, Math.PI * 2 - .9, .9, true); G.fs(g, '#fff', 2.5); G.star(g, 10, 6, 6, '#fff', 1.5);
    }
  });
})();
