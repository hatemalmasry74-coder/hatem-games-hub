/* Moody & Aboody - worlds/gathering_art.js : canvas art of WORLD 10 "تجمّع العائلة" (id 'gathering').
   World-card icon: w_gather (registered here, like habits/saudi).  Rooms (Moody.rooms): gather_landing gather_living gather_dining.
   Props / stickers: every art name starts with gather_.   Room flags live in stage.state (documented above each room).
   Helper for missions: Moody.gatherArt = { tableFront(g,t,S), seats }.   Load before worlds/gathering.js. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {}, rr = G.fillRR;

  /* ---------------- small helpers ---------------- */
  function wall(g, y1, c1, c2, stripe) { g.fillStyle = G.lin(g, 0, 0, 0, y1, [c1, c2]); g.fillRect(0, 0, 960, y1); if (stripe) { g.fillStyle = stripe; for (let i = 0; i < 12; i++) g.fillRect(i * 90, 0, 34, y1); } }
  function floorTiles(g, y, c1, c2, size, line) {
    g.fillStyle = G.lin(g, 0, y, 0, 540, [c1, c2]); g.fillRect(0, y, 960, 540 - y); g.strokeStyle = line || 'rgba(90,50,20,.16)'; g.lineWidth = 2;
    for (let i = -6; i < 22; i++) { g.beginPath(); g.moveTo(480 + (i - 8) * size * .55, y); g.lineTo(480 + (i - 8) * size * 1.5, 540); g.stroke(); }
    for (let k = 1; k < 5; k++) { const yy = y + (540 - y) * (k * k / 25); g.beginPath(); g.moveTo(0, yy); g.lineTo(960, yy); g.stroke(); }
    G.line(g, 0, y, 960, y, 4);
  }
  function glow(g, x, y, r, a) { const gr = g.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, 'rgba(255,236,150,' + (a || .5) + ')'); gr.addColorStop(1, 'rgba(255,236,150,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  function win(g, x, y, w, h, t, o) {
    o = o || {}; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); g.fillStyle = G.lin(g, 0, y, 0, y + h, ['#8fd6ff', '#e4f6ff']); g.fillRect(x, y, w, h);
    G.sun(g, x + w * .72, y + h * .3, 13, t); G.cloud(g, x + ((t * 7) % (w + 60)) - 30, y + h * .62, .5); g.fillStyle = '#8ed08a'; g.fillRect(x, y + h - 22, w, 22);
    [[.2, '#c9a27a'], [.55, '#d9b38a'], [.85, '#c9a27a']].forEach(b => rr(g, x + w * b[0] - 12, y + h - 52, 26, 34, 2, b[1], 2.5)); g.restore();
    g.lineWidth = 6; g.strokeStyle = OL; g.strokeRect(x, y, w, h); G.line(g, x + w / 2, y, x + w / 2, y + h, 5);
  }
  function garland(g, x0, x1, y, sag, t, n) {
    const cols = ['#ff6f91', '#ffc93c', '#1fb5a6', '#8a6bd6', '#ff8a2a', '#5cc96b']; g.beginPath(); for (let i = 0; i <= 20; i++) { const u = i / 20; g.lineTo(x0 + (x1 - x0) * u, y + Math.sin(u * Math.PI) * sag); } g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
    for (let i = 1; i < n; i++) { const u = i / n, x = x0 + (x1 - x0) * u, yy = y + Math.sin(u * Math.PI) * sag, sw = Math.sin(t * 2 + i) * 2; G.poly(g, [[x - 10, yy], [x + 10, yy], [x + sw, yy + 26]], cols[i % cols.length], 3); }
  }
  function balloons(g, x, y, t, s) {
    s = s || 1; [['#ff6f91', -22, -6], ['#ffc93c', 4, -24], ['#4aa8e8', 26, -2], ['#5cc96b', -4, 6]].forEach((b, i) => {
      const bx = x + b[1] * s + Math.sin(t * 1.3 + i) * 3, by = y + b[2] * s - 40 * s + Math.sin(t * 1.7 + i) * 3; G.line(g, bx, by + 26 * s, x, y + 30 * s, 2.5); G.ell(g, bx, by, 17 * s, 21 * s, b[0], 3.5); G.ell(g, bx - 5 * s, by - 7 * s, 4 * s, 6 * s, 'rgba(255,255,255,.55)', 0); G.poly(g, [[bx - 3, by + 21 * s], [bx + 3, by + 21 * s], [bx, by + 26 * s]], b[0], 2);
    });
  }
  function frame(g, x, y, w, h, fill, art) { rr(g, x, y, w, h, 6, '#a0643a', 4.5); rr(g, x + 6, y + 6, w - 12, h - 12, 2, fill || '#fff7e3', 2.5); if (art) A.draw(g, art, x + w / 2, y + h / 2 + 2, Math.min(w, h) - 18); }
  function lift(g, x, y, w, h, open, col) {
    const half = w / 2, gap = open * (half - 4); rr(g, x - 10, y - 10, w + 20, h + 14, 8, '#a8afc0', 5); g.fillStyle = '#ffeab8'; g.fillRect(x, y, w, h); if (open > .3) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 10, y + 30, w - 20, h - 40); }
    [[x - gap, 0], [x + half + gap, 1]].forEach(d => { g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); rr(g, d[0], y, half, h, 2, col || '#cfd5e3', 4); G.line(g, d[0] + (d[1] ? 12 : half - 12), y + 6, d[0] + (d[1] ? 12 : half - 12), y + h - 6, 4, 'rgba(255,255,255,.75)'); g.restore(); });
  }

  /* ================================================================
     ROOM gather_landing : the 3rd-floor landing in front of Nana's door (party decorations).
     flags: open (0..1 Nana's door), liftOpen (0..1 lift doors, lit inside), bell
     Landmarks: Nana's door 270-470 x 120-430, lift 690-830, shoe rack far left 30-200
     ================================================================ */
  R.gather_landing = function (g, t, s) {
    const S = s.state; wall(g, 430, '#ffe6cf', '#ffd2a8', 'rgba(255,255,255,.1)'); g.fillStyle = '#f0b98a'; g.fillRect(0, 306, 960, 124); G.line(g, 0, 306, 960, 306, 5, '#c98a58');
    g.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 0; x < 960; x += 80) g.fillRect(x + 6, 316, 68, 106);
    floorTiles(g, 430, '#f3e1c4', '#dcc59e', 70); rr(g, 440, 0, 80, 18, 8, '#fff7d0', 4); glow(g, 480, 18, 190);
    garland(g, 0, 960, 24, 26, t, 14);
    // Nana's door
    rr(g, 262, 110, 216, 322, 10, '#8a5a3a', 5); const open = S.open || 0; g.fillStyle = '#ffe8b0'; g.fillRect(280, 128, 180, 304);
    if (open > .05) { g.fillStyle = G.lin(g, 0, 128, 0, 430, ['#fff2c8', '#ffd9a0']); g.fillRect(280, 128, 180, 304); glow(g, 370, 230, 140); g.save(); g.beginPath(); g.rect(280, 128, 180, 304); g.clip(); A.draw(g, 'sofa', 400, 392, 160); balloons(g, 320, 300, t, .8); frame(g, 330, 160, 80, 60, '#fff', 'heartbig'); g.restore(); }
    const lw = 180 * (1 - open * .84); g.save(); g.beginPath(); g.rect(280, 128, 180, 304); g.clip(); rr(g, 280, 128, lw, 304, 4, '#b4783f', 5);
    if (lw > 70) { rr(g, 294, 144, lw - 28, 100, 6, '#c8935a', 3.5); rr(g, 294, 262, lw - 28, 150, 6, '#c8935a', 3.5); G.circ(g, 280 + lw - 18, 300, 7, '#ffd23c', 3); } g.restore();
    rr(g, 330, 70, 80, 36, 10, '#fff', 4.5); G.text(g, '٣', 370, 89, { size: 30, color: '#c25a00' });
    if (open < .5) { G.circ(g, 370, 215, 22, null, 9, '#5cc96b'); [0, 1, 2, 3, 4, 5].forEach(i => G.circ(g, 370 + Math.cos(i * 1.05) * 22, 215 + Math.sin(i * 1.05) * 22, 6, ['#ff6f91', '#ffd23c', '#fff'][i % 3], 2.5)); }
    G.ell(g, 370, 452, 110, 15, '#ff8fa8', 4); G.ell(g, 370, 452, 82, 9, '#ffd0e0', 2.5); G.text(g, 'أهلًا', 370, 454, { size: 14, color: '#c25a00' });
    const bp = S.bell ? 1 + .1 * Math.sin(t * 8) : 1; G.circ(g, 510, 262, 20, '#fff', 4.5); G.circ(g, 510, 262, 12 * bp, S.bell ? '#ffd23c' : '#ffc93c', 3.5); G.poly(g, [[503, 268], [517, 268], [514, 254], [506, 254]], '#e0a020', 2);
    // lift
    const lo = S.liftOpen || 0; lift(g, 690, 150, 140, 280, lo); rr(g, 700, 92, 120, 40, 10, '#2a2f45', 5); G.text(g, '٣', 760, 112, { size: 28, color: '#ff5a4a' }); G.poly(g, [[722, 104], [738, 104], [730, 120]], '#ff5a4a', 0);
    if (lo > .3) glow(g, 760, 300, 120, .35);
    rr(g, 845, 238, 38, 74, 9, '#9aa0b5', 4.5); G.circ(g, 864, 262, 9, '#ffd23c', 3); G.circ(g, 864, 290, 9, '#e8ecf5', 3);
    // shoe rack (many pairs: a big family!)
    rr(g, 20, 300, 200, 134, 8, '#7a4a2a', 5); g.fillStyle = 'rgba(0,0,0,.2)'; g.fillRect(28, 308, 184, 52); g.fillRect(28, 372, 184, 56); rr(g, 16, 358, 208, 12, 5, '#c8935a', 4.5); rr(g, 16, 430, 208, 12, 5, '#c8935a', 4.5);
    for (let i = 0; i < 6; i++) { A.draw(g, 'shoe', 52 + i * 31, 346, 30); A.draw(g, 'shoe', 52 + i * 31, 418, 30); }
    A.draw(g, 'plant', 905, 392, 100);
  };

  /* ================================================================
     ROOM gather_living : Nana's big sitting room, party mood.
     flags: photo (big banner + backdrop for the group photo), night (unused), hearts (floating hearts)
     Landmarks: window+curtain at left (60-250), sofa 300-650 with a dark GAP under it (y~412), shelf right (700-900, high y~150),
                big plant far right (880), rug center.
     ================================================================ */
  R.gather_living = function (g, t, s) {
    const S = s.state; wall(g, 420, '#fff0d6', '#ffe0b0', 'rgba(255,255,255,.14)'); g.fillStyle = '#f2c58c'; g.fillRect(0, 330, 960, 92); G.line(g, 0, 330, 960, 330, 5, '#c98a58'); g.fillStyle = 'rgba(255,255,255,.22)'; for (let x = 0; x < 960; x += 90) g.fillRect(x + 8, 340, 74, 74);
    g.fillStyle = G.lin(g, 0, 420, 0, 540, ['#d9a56a', '#b98048']); g.fillRect(0, 420, 960, 120); g.strokeStyle = 'rgba(70,35,10,.22)'; g.lineWidth = 2; for (let i = 0; i < 6; i++) { G.line(g, 0, 420 + i * 22, 960, 420 + i * 22, 2, 'rgba(70,35,10,.18)'); } for (let i = 0; i < 18; i++) G.line(g, i * 60 + ((i % 2) ? 20 : 0), 420, i * 60 + ((i % 2) ? 20 : 0) - 10, 540, 1.5, 'rgba(70,35,10,.12)'); G.line(g, 0, 420, 960, 420, 4);
    // rug
    G.ell(g, 480, 478, 400, 52, '#c24b4b', 4.5); G.ell(g, 480, 478, 372, 40, '#f4d8a6', 3); G.ell(g, 480, 478, 330, 31, '#e6906a', 2.5); [-1, 1].forEach(sd => [0, 1, 2, 3, 4].forEach(i => G.circ(g, 480 + sd * (90 + i * 56), 478, 9, i % 2 ? '#fff7e3' : '#5aa0a0', 2)));
    // window + curtains (left)
    win(g, 70, 110, 170, 190, t); rr(g, 56, 96, 198, 14, 6, '#8a5a3a', 4); rr(g, 54, 104, 62, 214, 10, '#d9567a', 4.5); rr(g, 196, 104, 62, 214, 10, '#d9567a', 4.5); [0, 1, 2].forEach(i => { G.line(g, 70 + i * 16, 112, 66 + i * 16, 312, 2, 'rgba(255,255,255,.3)'); G.line(g, 214 + i * 16, 112, 210 + i * 16, 312, 2, 'rgba(255,255,255,.3)'); });
    // frames on the wall
    [[330, 96, 78, 62, 'heartbig'], [418, 84, 70, 84, 'face:nana'], [498, 96, 78, 62, 'sunart'], [586, 100, 66, 56, 'face:baba']].forEach(f => frame(g, f[0], f[1], f[2], f[3], '#fff7e3', f[4]));
    garland(g, 270, 700, 60, 18, t, 9);
    // shelf right with a lamp
    rr(g, 700, 168, 200, 12, 4, '#8a5a3a', 4.5); rr(g, 700, 262, 200, 12, 4, '#8a5a3a', 4.5); [[730, '#ffd23c'], [780, '#8a6bd6'], [850, '#ff6f91']].forEach(v => { rr(g, v[0] - 14, 130, 28, 38, 10, v[1], 3.5); }); A.draw(g, 'lamp', 876, 142, 56); [[724, 'book'], [760, 'book']].forEach(b => A.draw(g, b[1], b[0], 236, 44)); A.draw(g, 'clock', 840, 232, 44);
    // sofa (center) with a dark gap beneath
    rr(g, 300, 296, 350, 108, 18, '#4aa8e8', 5); rr(g, 316, 258, 318, 62, 16, '#5fb8f2', 4.5); [0, 1, 2].forEach(i => rr(g, 322 + i * 104, 318, 98, 70, 14, '#7cc8fb', 3.5)); rr(g, 286, 318, 40, 90, 14, '#3f95d4', 4.5); rr(g, 626, 318, 40, 90, 14, '#3f95d4', 4.5);
    [[318, 410], [610, 410]].forEach(p => rr(g, p[0], p[1] - 8, 22, 22, 3, '#6a4a2e', 3)); g.fillStyle = 'rgba(40,20,5,.55)'; g.fillRect(344, 404, 262, 16);
    A.draw(g, 'pillow', 350, 342, 44); A.draw(g, 'pillow', 600, 342, 44);
    // big plant right + small one left
    A.draw(g, 'plant', 905, 400, 130);
    if (S.photo) {
      rr(g, 220, 18, 520, 56, 18, '#fff7e3', 5); G.text(g, 'تجمّع العيلة', 480, 47, { size: 38, color: '#c25a00' }); [250, 710].forEach(x => G.heart(g, x, 48, 13, '#ff5a7a', 3));
      balloons(g, 120, 400, t, 1.3); balloons(g, 840, 400, t, 1.3);
    } else balloons(g, 48, 410, t, 1.1);
    if (S.hearts) for (let i = 0; i < 5; i++) { const k = (t * .35 + i * .2) % 1; g.save(); g.globalAlpha = 1 - k; G.heart(g, 280 + i * 100, 360 - k * 150, 10 + i % 2 * 4, '#ff5a7a', 2); g.restore(); }
  };

  /* ================================================================
     ROOM gather_dining : Nana's dining room with the long family table.
     flags: table (0..1 cloth), set (plates+cups shown at all seats), food (0..1 dishes), front (the table is drawn by a layer in FRONT of
     the characters: M.gatherArt.tableFront; the room then skips it)
     SEATS: 8 top mats (x 130..830 step 100, y 345) + 7 bottom mats (x 180..780, y 437). Dishes line: y 391.
     ================================================================ */
  const SEATS = []; for (let i = 0; i < 8; i++) SEATS.push([130 + i * 100, 345]); for (let i = 0; i < 7; i++) SEATS.push([180 + i * 100, 437]);
  function tableTop(g, t, S) {
    G.shadow(g, 480, 486, 430, 22, .22);
    rr(g, 60, 296, 840, 182, 40, '#a0643a', 5); rr(g, 70, 304, 820, 166, 34, S.table ? '#fff1e0' : '#d8a468', 4);
    if (S.table) { g.save(); G.rr(g, 70, 304, 820, 166, 34); g.clip(); g.strokeStyle = 'rgba(239,83,80,.22)'; g.lineWidth = 18; for (let x = 20; x < 980; x += 56) { g.beginPath(); g.moveTo(x, 290); g.lineTo(x + 46, 490); g.stroke(); } g.restore(); G.rr(g, 70, 304, 820, 166, 34); g.lineWidth = 4; g.strokeStyle = OL; g.stroke(); }
    else { g.strokeStyle = 'rgba(90,50,20,.2)'; g.lineWidth = 2; for (let i = 1; i < 5; i++) { g.beginPath(); g.moveTo(90, 304 + i * 32); g.lineTo(870, 304 + i * 32); g.stroke(); } }
    if (S.set) SEATS.forEach((p, i) => { G.ell(g, p[0], p[1] + 4, 30, 18, '#fff', 3.5); G.ell(g, p[0], p[1] + 4, 20, 11, '#ffe6c8', 1.8); A.draw(g, 'gather_cup:' + ['orange', 'pink'][i % 2], p[0] + 33, p[1] - 6, 24); });
    const f = S.food || 0; if (f > 0) { g.save(); g.globalAlpha = Math.min(1, f); ['soup', 'rice', 'chicken', 'mahshi', 'molokhia', 'salad', 'bread'].forEach((k, i) => A.draw(g, 'gather_dish:' + k, 180 + i * 100, 390 + Math.sin(t * 2 + i) * 1.2, 54)); g.restore(); }
  }
  M.gatherArt = { seats: SEATS, tableFront: tableTop };
  R.gather_dining = function (g, t, s) {
    const S = s.state; wall(g, 410, '#e9f4e1', '#cfe7c4', 'rgba(255,255,255,.12)'); g.fillStyle = '#b9d8ae'; g.fillRect(0, 320, 960, 92); G.line(g, 0, 320, 960, 320, 5, '#86b27a');
    floorTiles(g, 410, '#efdcbc', '#d3b988', 80); glow(g, 480, 14, 220, .4);
    win(g, 90, 80, 170, 150, t); rr(g, 78, 70, 194, 12, 6, '#c9633a', 4); [0, 1, 2, 3, 4, 5].forEach(i => G.circ(g, 92 + i * 33, 86, 8, '#fff', 3));
    G.line(g, 480, 0, 480, 36, 4); G.poly(g, [[430, 40], [530, 40], [506, 82], [454, 82]], '#ffc93c', 4.5); glow(g, 480, 82, 120, .4);
    garland(g, 300, 940, 40, 20, t, 10);
    rr(g, 690, 150, 230, 14, 4, '#8a5a3a', 4.5); rr(g, 690, 170, 230, 150, 6, '#b97b4a', 4.5); [0, 1].forEach(i => rr(g, 702 + i * 110, 182, 100, 126, 5, '#c8935a', 3)); [[720, '#fff'], [770, '#ff8fa8'], [820, '#fff'], [870, '#4aa8e8']].forEach(p => A.draw(g, 'cup', p[0], 128, 34));
    frame(g, 370, 96, 120, 80, '#fff7e3', 'w_gather');
    // chairs peeking behind (back)
    for (let i = 0; i < 8; i++) { const x = 130 + i * 100; rr(g, x - 28, 250, 56, 62, 10, i % 2 ? '#c8935a' : '#b4783f', 4); rr(g, x - 22, 256, 44, 24, 6, 'rgba(255,255,255,.2)', 0); }
    if (!S.front) tableTop(g, t, S);
  };

  /* ================================================================ ART PROPS ================================================================ */
  const SK = ['#e4b58c', '#d9a070', '#c98f5f', '#e0a577'];
  A.registerAll({
    w_gather(g) {
      G.fillRR(g, -40, -4, 80, 44, 4, '#f6e0c0', 4.5); G.poly(g, [[-46, -4], [0, -32], [46, -4]], '#ff8a6a', 4.5); G.fillRR(g, -9, 14, 18, 26, 3, '#8a5a3a', 3);
      [-24, 24].forEach(x => G.fillRR(g, x - 7, 4, 14, 14, 2, '#bfe8ff', 3));
      [[-30, '#e4b58c'], [-10, '#d9a070'], [10, '#c98f5f'], [30, '#e0a577']].forEach((c, i) => { G.circ(g, c[0], 52 - (i % 2) * 5, 9, c[1], 3); });
      G.heart(g, 0, -46, 9, '#ff5a7a', 2.5);
    },
    gather_salam(g) { G.circ(g, 0, 8, 26, '#e4b58c', 4.5); [[-24, -22, -.35], [-9, -32, -.1], [7, -32, .1], [22, -24, .3]].forEach(f => { g.save(); g.translate(f[0], f[1]); g.rotate(f[2]); G.fillRR(g, -6, -20, 12, 30, 6, '#e4b58c', 3.5); g.restore(); }); g.save(); g.translate(-30, 6); g.rotate(-.9); G.fillRR(g, -6, -20, 12, 28, 6, '#e4b58c', 3.5); g.restore(); [-24, 24].forEach(x => { g.beginPath(); g.arc(x * 1.55, -20, 8, 3.5, 5.7); g.lineWidth = 3; g.strokeStyle = '#ffc93c'; g.stroke(); }); },
    gather_kisshand(g) { G.fillRR(g, -34, 10, 68, 26, 12, '#e4b58c', 4.5); [-22, -8, 6, 20].forEach(x => G.fillRR(g, x - 6, -22, 12, 38, 6, '#e4b58c', 3.5)); G.heart(g, 0, -34, 12, '#ff5a7a', 3); },
    gather_hug(g) { G.circ(g, -16, -8, 20, '#c98f5f', 4.5); G.circ(g, 18, 2, 15, '#e0a577', 4.5); G.fillRR(g, -34, 10, 46, 30, 12, '#6ea0d6', 4.5); G.fillRR(g, 2, 14, 34, 26, 10, '#ff9a3c', 4.5); G.heart(g, 2, -36, 11, '#ff5a7a', 3); },
    gather_dish(g, o) {
      const k = (o.args || [])[0] || 'rice'; G.ell(g, 0, 10, 46, 30, '#fff', 4.5); G.ell(g, 0, 9, 36, 22, '#ffeed5', 2);
      if (k === 'rice') { G.ell(g, 0, 4, 28, 18, '#fffbe8', 3); for (let i = 0; i < 9; i++) G.circ(g, -18 + (i * 7) % 36, -2 + (i * 5) % 14, 2, '#d9a35f', 0); G.circ(g, -8, -6, 3, '#5cc96b', 0); G.circ(g, 10, -4, 3, '#5cc96b', 0); }
      else if (k === 'chicken') { [[-16, 4, .5], [14, 4, -.5]].forEach(p => { g.save(); g.translate(p[0], p[1]); g.rotate(p[2]); G.ell(g, 0, -4, 13, 18, '#d9822b', 3.5); G.fillRR(g, -3, 10, 6, 14, 3, '#fff7e3', 2.5); G.circ(g, 0, 24, 4.5, '#fff7e3', 2.5); g.restore(); }); G.circ(g, 0, 14, 7, '#f2c14e', 2.5); G.circ(g, -26, 12, 6, '#f2c14e', 2.5); }
      else if (k === 'mahshi') { for (let i = 0; i < 5; i++) { G.fillRR(g, -28 + i * 12, -6 + (i % 2) * 6, 11, 28, 5, '#7fb069', 3); } G.circ(g, 22, 18, 5, '#ef5350', 2.5); }
      else if (k === 'molokhia') { G.ell(g, 0, 6, 32, 20, '#2f7a3a', 3.5); G.ell(g, 0, 4, 26, 14, '#3f9a4a', 0); g.beginPath(); g.arc(0, 4, 8, 0, 5); g.lineWidth = 2; g.strokeStyle = '#1f5a28'; g.stroke(); g.beginPath(); g.arc(0, 4, 15, 1, 6); g.stroke(); }
      else if (k === 'salad') { G.circ(g, -14, 2, 11, '#ef5350', 3); G.circ(g, 10, 6, 11, '#ef5350', 3); G.ell(g, 0, -2, 14, 8, '#7fdc8a', 3); G.circ(g, -2, 12, 8, '#a8e6a0', 2.5); G.ell(g, 18, -4, 6, 10, '#5cc96b', 2.5); }
      else if (k === 'bread') { [[-14, 0], [14, 0], [0, 12]].forEach(p => { G.ell(g, p[0], p[1], 18, 11, '#e0a560', 3.5); G.line(g, p[0] - 8, p[1], p[0] + 8, p[1], 2, '#b97b4a'); }); }
      else if (k === 'soup') { G.ell(g, 0, 6, 32, 20, '#e07a2a', 3.5); G.ell(g, 0, 4, 26, 14, '#f2a948', 0); [-10, 4, 14].forEach(x => { g.beginPath(); g.moveTo(x, -10); g.quadraticCurveTo(x + 6, -20, x, -30); g.lineWidth = 3; g.strokeStyle = 'rgba(255,255,255,.8)'; g.stroke(); }); }
      else if (k === 'sweet') { [[-14, -2], [14, -2], [-14, 14], [14, 14]].forEach(p => { G.fillRR(g, p[0] - 12, p[1] - 8, 24, 16, 3, '#f2c14e', 3); G.circ(g, p[0], p[1], 3, '#fff7e3', 1.5); }); }
    },
    gather_cup(g, o) { const c = (o.args || [])[0] === 'pink' ? '#ff9ec0' : '#ff9a3c'; G.poly(g, [[-22, -26], [22, -26], [16, 34], [-16, 34]], 'rgba(255,255,255,.9)', 4.5); G.poly(g, [[-19, -10], [19, -10], [15, 32], [-15, 32]], c, 0); G.line(g, 4, -40, 14, -22, 5, '#ef5350'); },
    gather_phone(g, o) { g.save(); g.rotate(o.args && o.args[0] === 'tilt' ? .2 : 0); G.fillRR(g, -22, -38, 44, 76, 9, '#2d3142', 4.5); G.fillRR(g, -17, -30, 34, 54, 3, '#9fd8ff', 0); G.fillRR(g, -17, -30, 34, 14, 3, 'rgba(255,255,255,.45)', 0); G.circ(g, 0, 31, 4, '#8a90a6', 0); g.restore(); },
    gather_headphones(g) { g.beginPath(); g.arc(0, 4, 30, Math.PI, 0); g.lineWidth = 8; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.arc(0, 4, 30, Math.PI, 0); g.lineWidth = 4; g.strokeStyle = '#8a90a6'; g.stroke(); [-30, 30].forEach(x => G.fillRR(g, x - 11, -2, 22, 34, 10, '#f6b6cd', 4)); },
    gather_basket(g) { g.beginPath(); g.moveTo(-40, -6); g.lineTo(40, -6); g.lineTo(32, 40); g.lineTo(-32, 40); g.closePath(); G.fs(g, '#c8935a', 4.5); [-20, 0, 20].forEach(x => G.line(g, x, -4, x * .8, 38, 2.5, '#8a5a3a')); G.line(g, -36, 12, 36, 12, 2.5, '#8a5a3a'); G.line(g, -34, 26, 34, 26, 2.5, '#8a5a3a'); G.fillRR(g, -46, -14, 92, 12, 6, '#a0643a', 4); },
    gather_phonebasket(g) { g.save(); g.translate(-6, -16); g.rotate(-.25); G.fillRR(g, -11, -22, 22, 40, 5, '#2d3142', 3.5); G.fillRR(g, -8, -17, 16, 28, 2, '#9fd8ff', 0); g.restore(); g.save(); g.translate(18, -12); g.rotate(.3); G.fillRR(g, -10, -20, 20, 36, 5, '#3b3b46', 3.5); G.fillRR(g, -7, -15, 14, 24, 2, '#c9f5cf', 0); g.restore(); A.draw(g, 'gather_basket', 0, 8, 96); G.heart(g, 26, -42, 8, '#ff5a7a', 2.5); },
    gather_teddy(g) { [-24, 24].forEach(x => G.circ(g, x, -30, 13, '#c8935a', 4)); G.circ(g, 0, -12, 28, '#d9a35f', 4.5); G.ell(g, 0, 36, 24, 22, '#d9a35f', 4.5); [-28, 28].forEach(x => G.ell(g, x, 28, 9, 14, '#d9a35f', 4)); G.ell(g, 0, -4, 12, 9, '#f4d8a6', 3); G.circ(g, 0, -8, 3.5, OL, 0); [-10, 10].forEach(x => G.circ(g, x, -18, 3, OL, 0)); G.poly(g, [[-10, 20], [0, 28], [10, 20], [0, 16]], '#e5534b', 3); },
    gather_balloon(g, o) { const c = { red: '#ef5350', blue: '#4aa8e8', green: '#5cc96b', yellow: '#ffc93c', pink: '#ff6f91' }[(o.args || [])[0]] || '#ff6f91'; G.ell(g, 0, -10, 26, 32, c, 4.5); G.ell(g, -9, -22, 6, 10, 'rgba(255,255,255,.55)', 0); G.poly(g, [[-5, 20], [5, 20], [0, 28]], c, 3); g.beginPath(); g.moveTo(0, 28); g.quadraticCurveTo(10, 36, -4, 46); g.quadraticCurveTo(-10, 52, 2, 56); g.lineWidth = 2.5; g.strokeStyle = OL; g.stroke(); },
    gather_note(g) { G.ell(g, -14, 22, 14, 10, '#8a6bd6', 4.5, null, -.4); G.ell(g, 22, 12, 14, 10, '#1fb5a6', 4.5, null, -.4); G.line(g, -2, 20, -2, -30, 6, OL); G.line(g, 34, 10, 34, -40, 6, OL); G.line(g, -2, -30, 34, -40, 9, OL); G.line(g, -2, -30, 34, -40, 5, '#ffc93c'); },
    gather_camera(g) { G.fillRR(g, -38, -18, 76, 52, 10, '#4a4f6a', 4.5); G.fillRR(g, -20, -30, 30, 14, 4, '#4a4f6a', 4); G.circ(g, 0, 8, 19, '#cfd5e3', 4.5); G.circ(g, 0, 8, 12, '#2b3a67', 3); G.circ(g, -4, 4, 4, 'rgba(255,255,255,.7)', 0); G.circ(g, 27, -8, 4, '#ffc93c', 2); },
    gather_trophy(g) { g.beginPath(); g.moveTo(-26, -30); g.lineTo(26, -30); g.quadraticCurveTo(24, 14, 0, 18); g.quadraticCurveTo(-24, 14, -26, -30); G.fs(g, '#ffc93c', 4.5); [-1, 1].forEach(s => { g.beginPath(); g.arc(s * 30, -18, 12, s > 0 ? -1.5 : 1.6, s > 0 ? 1.5 : 4.7); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); }); G.fillRR(g, -6, 16, 12, 16, 2, '#e0a020', 3.5); G.fillRR(g, -24, 30, 48, 14, 4, '#8a5a3a', 4); G.star(g, 0, -10, 12, '#fff7e3', 2.5); },
    gather_shout(g) { G.poly(g, [[-30, -10], [-6, -10], [22, -30], [22, 30], [-6, 10], [-30, 10]], '#ef5350', 4.5); [[0, -.7], [0, 0], [0, .7]].forEach((p, i) => { g.beginPath(); g.moveTo(30, i * 14 - 14); g.lineTo(42, i * 20 - 20); g.lineWidth = 4; g.strokeStyle = '#ef5350'; g.stroke(); }); },
    gather_listen(g) { g.beginPath(); g.moveTo(-8, 34); g.quadraticCurveTo(-34, 20, -26, -14); g.quadraticCurveTo(-16, -40, 10, -34); g.quadraticCurveTo(34, -26, 26, 0); g.quadraticCurveTo(22, 14, 8, 20); g.quadraticCurveTo(6, 30, -8, 34); G.fs(g, '#e4b58c', 4.5); g.beginPath(); g.moveTo(-6, -4); g.quadraticCurveTo(0, -18, 10, -8); g.lineWidth = 3.5; g.strokeStyle = '#c98f5f'; g.stroke(); G.heart(g, 26, -34, 10, '#ff5a7a', 3); },
    gather_share(g) { A.draw(g, 'gather_teddy', -2, 4, 70); g.save(); g.translate(0, 0); G.fillRR(g, -44, 22, 36, 18, 9, '#e4b58c', 3.5); G.fillRR(g, 8, 22, 36, 18, 9, '#d9a070', 3.5); g.restore(); G.heart(g, 0, -42, 9, '#ff5a7a', 2.5); },
    gather_hide(g) { G.circ(g, 0, 0, 34, '#e4b58c', 4.5); G.fillRR(g, -34, -12, 68, 22, 8, '#e4b58c', 4); [-18, -6, 6, 18].forEach(x => G.line(g, x, -10, x, 8, 2.5, '#c98f5f')); G.text(g, '١٢٣', 0, 40, { size: 20, color: '#c25a00' }); },
    gather_bigplate(g) { G.ell(g, 0, 14, 44, 28, '#fff', 4.5); for (let i = 0; i < 12; i++) G.circ(g, -22 + (i * 11) % 44, -22 + (i % 5) * 8, 8, ['#d9822b', '#fffbe8', '#7fb069', '#ef5350'][i % 4], 2.5); },
    gather_smallplate(g) { G.ell(g, 0, 14, 44, 28, '#fff', 4.5); G.circ(g, -8, 10, 8, '#d9822b', 3); G.circ(g, 10, 14, 8, '#fffbe8', 3); G.circ(g, 0, 18, 5, '#7fb069', 2.5); },
    gather_bin(g) { G.poly(g, [[-26, -18], [26, -18], [20, 38], [-20, 38]], '#8f95a8', 4.5); G.fillRR(g, -30, -28, 60, 12, 5, '#b7bdd0', 4); [-8, 0, 8].forEach(x => G.line(g, x, -10, x * .8, 32, 2.5, 'rgba(255,255,255,.5)')); A.draw(g, 'gather_dish:bread', 0, -42, 38); },
    gather_story_cable(g) { rr(g, -46, -40, 92, 80, 8, '#bfe3ff', 4); G.poly(g, [[-46, 40], [-20, -6], [4, 16], [26, -22], [46, 40]], '#8aa0b0', 3); G.line(g, -44, -24, 44, -6, 3, OL); G.fillRR(g, -9, -22, 22, 20, 5, '#ff6f91', 3); G.line(g, 2, -15, 2, -22, 2.5); G.fillRR(g, -6, -18, 6, 8, 1, '#bfe8ff', 0); G.fillRR(g, 3, -18, 6, 8, 1, '#bfe8ff', 0); G.cloud(g, -28, -26, .4); },
    gather_story_mist(g) { rr(g, -46, -40, 92, 80, 8, '#d9e4ec', 4); G.poly(g, [[-46, 40], [-26, 0], [0, 22], [30, -12], [46, 40]], '#9fb8c8', 3); G.ell(g, -8, 14, 44, 10, 'rgba(255,255,255,.8)', 0); G.ell(g, 18, -2, 30, 8, 'rgba(255,255,255,.7)', 0); G.ell(g, 20, 26, 12, 8, '#fff', 3); G.circ(g, 32, 20, 6, '#fff', 3); G.line(g, 16, 32, 16, 38, 2.5); G.line(g, 26, 32, 26, 38, 2.5); },
    gather_story_tower(g) { rr(g, -46, -40, 92, 80, 8, '#ffe9c0', 4); G.fillRR(g, -20, -22, 40, 62, 3, '#d9a96a', 3.5); G.fillRR(g, -28, -28, 56, 12, 2, '#fff', 3); [-8, 8].forEach(x => { G.fillRR(g, x - 5, -8, 10, 14, 2, '#fff', 2.5); G.fillRR(g, x - 5, 14, 10, 14, 2, '#fff', 2.5); }); G.fillRR(g, -5, -14, 10, 4, 0, '#fff', 0); },
    gather_table(g) {
      G.ell(g, 0, 18, 46, 18, '#a0643a', 4.5); G.ell(g, 0, 14, 42, 14, '#fff1e0', 2.5); A.draw(g, 'gather_dish:chicken', -16, 8, 34); A.draw(g, 'gather_dish:rice', 18, 10, 34);
      [[-34, -22], [-12, -30], [12, -30], [34, -22]].forEach((p, i) => { G.circ(g, p[0], p[1], 10, SK[i % 4], 3.5); G.fillRR(g, p[0] - 9, p[1] + 8, 18, 12, 4, ['#6ea0d6', '#ff9a3c', '#ff7fb0', '#3fae6a'][i], 3); });
    },
    gather_family(g) {
      G.heart(g, 0, -36, 15, '#ff5a7a', 3.5); [[-30, 2, 'face:nana'], [30, 2, 'face:baba'], [-14, 22, 'face:toti'], [14, 22, 'face:luka'], [0, -6, 'face:moody']].forEach(f => A.draw(g, f[2], f[0], f[1], f[2] === 'face:moody' ? 44 : 38)); G.sparkle(g, 36, -26, 8, '#fff6a8'); G.sparkle(g, -38, -22, 6, '#fff6a8');
    },
    gather_nophone(g) { A.draw(g, 'gather_phone', -6, 2, 70); G.circ(g, 0, 0, 40, null, 6, '#ef5350'); G.line(g, -28, 28, 28, -28, 6, '#ef5350'); },
    gather_calm(g) { A.draw(g, 'face:toti', 0, -2, 68); G.heart(g, 26, -32, 10, '#ff5a7a', 3); G.heart(g, -28, -28, 7, '#ff9ec0', 2.5); },
    gather_clap(g) { [[-1, -.5], [1, .5]].forEach(s => { g.save(); g.translate(s[0] * 14, 4); g.rotate(s[1]); G.fillRR(g, -13, -34, 26, 56, 12, '#e4b58c', 4); g.restore(); }); [[-26, -34], [26, -34], [0, -46]].forEach(p => G.line(g, p[0], p[1], p[0] * 1.2, p[1] * 1.2 - 4, 4, '#ffc93c')); },
    gather_say(g, o) { G.circ(g, 0, 0, 42, '#fff7e3', 4.5); G.circ(g, 0, 0, 34, null, 2.5, '#ffc93c'); G.text(g, (o.args || ['؟'])[0], 0, 2, { size: (o.args || ['؟'])[0].length > 6 ? 17 : 22, color: '#c25a00' }); },
    /* a whole character standing, shrunk by one common factor so relative heights stay true (feet at y +46) */
    gather_body(g, o) { const id = (o.args || ['moody'])[0]; if (!M.chars.defs[id]) return; M.chars.draw(g, id, 0, 46, { sc: .42, t: 1.7, noShadow: false }); },
    gather_charades(g) { G.circ(g, 0, 0, 36, '#ffe9c8', 4.5); G.circ(g, -12, -8, 4, OL, 0); G.circ(g, 12, -8, 4, OL, 0); g.beginPath(); g.arc(0, 6, 14, .2, Math.PI - .2); g.lineWidth = 4; g.strokeStyle = OL; g.stroke(); G.text(g, '؟', 28, -30, { size: 34, color: '#8a6bd6', stroke: '#fff', sw: 5 }); }
  });
})();
