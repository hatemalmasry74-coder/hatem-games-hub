/* Family Adventures - worlds/school_art.js : canvas-drawn school scenes (Moody.rooms.sc_*) + school props (Moody.art).
   Each room is a background drawer fn(g, t, stage); flags live in stage.state. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {};
  const rr = G.fillRR;

  const RK = G.room;
  function floorTo(g, y, c1, c2) { RK.floor(g, y, c1, c2, { kind: 'wood' }); }
  function win(g, s, x, y, w, h, o) { G.window(g, s, x, y, w, h, Object.assign({ view: 'garden', curtains: null, frame: '#fff', floor: 430, dir: .4 }, o)); }
  function tree(g, x, y, sc) { RK.tree(g, x, y, sc); }
  function building(g, x, y, w, h, c, o) { RK.building(g, x, y, w, h, c, o); }
  M.look.setAll({
    sc_street: { tod: 'morning', indoor: false, floor: 470, lightX: 140, vig: .2 }, sc_class: { tod: 'day', floor: 430, lightX: 790 }, sc_yard: { tod: 'noon', indoor: false, floor: 470, lightX: 840, vig: .18 },
    sc_lab: { tod: 'cool', floor: 430, lightX: 145 }, sc_library: { tod: 'warm', floor: 430, lightX: 480, vig: .32 }, sc_gym: { tod: 'day', floor: 430, lightX: 480 }, sc_road: { tod: 'day', indoor: false, floor: 460, lightX: 840, vig: .18 }
  });

  /* ---------- STREET + SCHOOL GATE + BUS.  flags: busX (x of bus, hidden if null), busDoor ---------- */
  R.sc_street = function (g, t, s) {
    const S = s.state;
    RK.sky(g, s, 'morning', 400, { seed: 2 });
    G.amb(s, { k: 'glow', x: 140, y: 90, r: 300, ry: 220, col: '255,226,160', a: .22, z: 'top' });
    [[20, 230, 110, 150, '#ffd0a8'], [140, 260, 100, 120, '#d9c7f5'], [680, 250, 120, 130, '#ffe29a'], [820, 220, 110, 160, '#c9eed0']].forEach(b => building(g, b[0], b[1], b[2], b[3], b[4]));
    // school building
    G.ao(g, 300, 190, 330, 190); rr(g, 300, 190, 330, 190, 8, '#ffd23c', 5); G.poly(g, [[286, 194], [465, 128], [644, 194]], '#e84a46', 4); g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.moveTo(286, 194); g.lineTo(465, 128); g.lineTo(465, 150); g.lineTo(320, 194); g.fill();
    rr(g, 420, 290, 90, 90, 6, '#8a5a3a', 4.5); rr(g, 428, 298, 32, 76, 3, 'rgba(255,230,190,.25)', 2); rr(g, 468, 298, 32, 76, 3, 'rgba(255,230,190,.25)', 2); G.line(g, 465, 290, 465, 380, 4);
    [330, 540].forEach(x => { rr(g, x - 3, 221, 70, 64, 4, '#fff', 3); g.fillStyle = G.lin(g, 0, 224, 0, 282, ['#a8dcff', '#e4f6ff']); G.rr(g, x, 224, 64, 58, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.45)'; g.beginPath(); g.moveTo(x + 6, 282); g.lineTo(x + 26, 224); g.lineTo(x + 38, 224); g.lineTo(x + 18, 282); g.fill(); G.line(g, x + 32, 224, x + 32, 282, 3, '#fff'); });
    rr(g, 352, 196, 226, 40, 8, '#fff7e3', 4); G.text(g, '{school}', 465, 217, { size: 17, color: '#c25a00' });
    RK.flag(g, s, 668, 390);
    for (let x = 270; x < 700; x += 26) if (x < 410 || x > 520) rr(g, x, 350, 12, 40, 3, '#fff', 3);
    tree(g, 90, 395, 1.1); tree(g, 900, 395, 1);
    RK.sidewalk(g, 390, 470); RK.road(g, 470, 540, { dy: 18 });
    G.line(g, 150, 330, 150, 440, 6, '#8a8f9a'); rr(g, 118, 280, 64, 60, 8, '#4a8dff', 4); A.draw(g, 'schoolbus', 150, 310, 50);
    if (S.busX != null) A.draw(g, 'schoolbus', S.busX, 428, 270, { door: S.busDoor });
    G.amb(s, { k: 'leaves', x0: 40, x1: 920, y0: 160, y1: 440, n: 4, cols: ['#8fd16a', '#b6e07a'], z: 'top', seed: 5 });
  };

  /* ---------- CLASSROOM.  flags: board (text lines array), dirty (scribbles on the high board), hideDesks ---------- */
  R.sc_class = function (g, t, s) {
    const S = s.state;
    RK.wall(g, 430, '#fff2cc', '#ffe3a6', { pattern: 'stripes', pw: 90, dado: { h: 60, c: '#f0c878' } });
    floorTo(g, 430, '#dba670', '#a8733f');
    // board
    g.fillStyle = 'rgba(40,20,5,.25)'; g.fillRect(236, 266, 430, 10); rr(g, 230, 70, 420, 190, 10, '#b97b4a', 4); g.fillStyle = G.lin(g, 0, 82, 0, 248, ['#2f8a62', '#27775a']); G.rr(g, 242, 82, 396, 166, 4); g.fill(); g.fillStyle = 'rgba(255,255,255,.07)'; g.beginPath(); g.moveTo(250, 248); g.lineTo(330, 82); g.lineTo(400, 82); g.lineTo(320, 248); g.fill(); rr(g, 220, 252, 440, 14, 4, '#b97b4a', 4);
    const L = S.board || ['اليوم: الأحد', '١ + ١ = ٢'];
    L.forEach((l, i) => G.text(g, l, 440, 120 + i * 46, { size: 30, color: '#fff' }));
    if (S.dirty) { g.strokeStyle = 'rgba(255,255,255,.8)'; g.lineWidth = 6; g.lineCap = 'round'; [[280, 100, 340, 130], [400, 96, 470, 160], [520, 110, 600, 100], [300, 180, 380, 200], [480, 200, 590, 170]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); }); }
    A.draw(g, 'chalk', 580, 262, 28);
    win(g, s, 700, 80, 190, 150, { view: 'garden', dir: .5, shaftA: .2 });
    A.draw(g, 'clock', 120, 120, 80); G.amb(s, { k: 'second', x: 120, y: 120, r: 26, z: 'mid' }); rr(g, 36, 220, 160, 14, 4, '#b97b4a', 3.5); ['book', 'plant', 'globe'].forEach((a, i) => A.draw(g, a, 66 + i * 50, 200, 44));
    rr(g, 30, 240, 20, 140, 3, '#e0a560', 3);
    if (!S.hideDesks) { G.ao(g, 250, 330, 300, 100); rr(g, 250, 330, 300, 22, 6, '#c8935a', 5); rr(g, 270, 350, 260, 80, 6, '#b97b4a', 4.5); G.fillRR(g, 480, 300, 52, 30, 5, '#4aa8e8', 3.5); A.draw(g, 'apple', 300, 318, 36); A.draw(g, 'bell', 420, 312, 34); }
    if (!S.hideDesks) for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const x = 90 + c * 150 + r * 30, y = 410 + r * 62; A.draw(g, 'desk', x + 380, y, r ? 96 : 84, { bag: S.bags ? S.bags[c + r * 3] : false }); }
  };

  /* ---------- SCHOOL YARD / CANTEEN.  flags: canteen (kiosk), trash (array of {art,x,y}) ---------- */
  R.sc_yard = function (g, t, s) {
    const S = s.state;
    RK.sky(g, s, 'day', 420, { seed: 4 });
    building(g, 20, 130, 360, 270, '#ffd7a0', { ww: 56, wh: 66 }); G.fillRR(g, 20, 118, 360, 20, 4, '#e84a46', 3); G.text(g, '{school}', 200, 128, { size: 14, color: '#fff' });
    tree(g, 430, 400, 1.2); tree(g, 900, 400, 1);
    RK.grass(g, 400, '#a6e089', '#74c35e', 3);
    g.fillStyle = '#e8d3a8'; g.beginPath(); g.ellipse(480, 505, 520, 66, 0, 0, 6.3); g.fill(); g.fillStyle = 'rgba(255,255,255,.2)'; g.beginPath(); g.ellipse(480, 495, 500, 48, 0, 0, 6.3); g.fill();
    G.line(g, 560, 410, 560, 230, 7, '#8a8f9a'); rr(g, 535, 190, 66, 50, 4, '#fff', 4); G.circ(g, 568, 224, 8, 'rgba(0,0,0,0)', 3.5, '#ef5350');
    if (S.canteen) {
      G.ao(g, 610, 256, 310, 154); rr(g, 610, 256, 310, 154, 8, '#ff9ec0', 5);
      for (let i = 0; i < 6; i++) { const x = 600 + i * 55; G.poly(g, [[x, 256], [x + 55, 256], [x + 49, 212], [x + 6, 212]], i % 2 ? '#fff' : '#ef5350', 2.5); }
      rr(g, 624, 304, 282, 18, 4, '#fff7e3', 4.5); G.text(g, 'كانتين المدرسة', 765, 234, { size: 22, color: '#2b3a67', stroke: '#fff', sw: 5 });
    }
    (S.trash || []).forEach(o => { if (!o.gone) A.draw(g, o.art, o.x, o.y, 40); });
    G.amb(s, { k: 'leaves', x0: 20, x1: 940, y0: 120, y1: 430, n: 6, cols: ['#8fd16a', '#c8e080'], z: 'top', seed: 8 });
  };

  /* ---------- SCIENCE LAB ---------- */
  R.sc_lab = function (g, t, s) {
    const S = s.state;
    RK.wall(g, 430, '#e9f8f5', '#cdeee8', { pattern: 'tiles', tw: 60, th: 60, grout: 'rgba(255,255,255,.75)', crown: false });
    RK.floor(g, 430, '#d8e0ee', '#aeb9d0', { kind: 'tile', alt: 'rgba(255,255,255,.3)', line: 'rgba(60,80,110,.2)' });
    win(g, s, 60, 70, 170, 120, { view: 'garden', dir: .5 });
    [[290, 120], [290, 200]].forEach((p, r) => { RK.shelf(g, p[0], p[1] + 28, 360); ['#ef5350', '#4aa8e8', '#5cc96b', '#ffd23c', '#8a6bd6', '#ff8a2a'].forEach((c, i) => A.draw(g, 'flask:' + (r ? ['#4aa8e8', '#ffd23c', '#ef5350', '#5cc96b', '#ff8a2a', '#8a6bd6'][i] : c), p[0] + 36 + i * 58, p[1], 46)); });
    RK.frame(g, 720, 70, 150, 150, { frame: '#fff', bg: '#1d2a68', pad: 7, draw: (g, x, y, w, h) => { for (let i = 0; i < 9; i++) G.sparkle(g, x + 10 + (i * 37) % (w - 16), y + 10 + (i * 53) % (h - 50), 3 + i % 3, '#fff6a8', .9); G.circ(g, x + w / 2, y + h * .42, 28, '#ffd23c', 3); G.ell(g, x + w / 2, y + h * .42, 48, 13, null, 3, '#9fd0ff', -.4); G.circ(g, x + w * .8, y + h * .2, 7, '#4a8dff', 2.5); G.text(g, 'الفضاء', x + w / 2, y + h - 18, { size: 21, color: '#fff' }); } });
    G.ao(g, 60, 330, 840, 100); rr(g, 60, 330, 840, 24, 6, '#fff7e3', 5); rr(g, 70, 354, 820, 76, 6, '#b97b4a', 4.5); [200, 400, 600, 780].forEach(x => G.line(g, x, 354, x, 430, 4)); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(66, 333, 828, 4);
    if (S.goggles) A.draw(g, 'goggles', 120, 316, 48);
    if (S.beaker) A.draw(g, 'flask:#4aa8e8', 840, 312, 54);
    G.amb(s, { k: 'bubbles', x0: 820, x1: 870, y0: 220, y1: 300, n: 4, seed: 7, z: 'top' });
  };

  /* ---------- LIBRARY ---------- */
  R.sc_library = function (g, t, s) {
    const S = s.state, C = ['#ef5350', '#4a8dff', '#5cc96b', '#ffd23c', '#8a6bd6', '#ff8a2a', '#1fb5a6', '#ff6f91'];
    RK.wall(g, 430, '#f3e5ff', '#e0caf8', { pattern: 'stripes', pw: 80 }); floorTo(g, 430, '#cfa56f', '#9c7041');
    for (let b = 0; b < 2; b++) { const x = b ? 560 : 20, w = b ? 380 : 480; G.ao(g, x, 70, w, 340); rr(g, x, 70, w, 340, 8, '#b97b4a', 5); g.fillStyle = 'rgba(30,10,0,.28)'; g.fillRect(x + 8, 78, w - 16, 324); for (let r = 0; r < 4; r++) { const y = 74 + r * 84; g.fillStyle = 'rgba(30,10,0,.18)'; g.fillRect(x + 8, y, w - 16, 70); rr(g, x + 8, y + 70, w - 16, 10, 2, '#8a5a3a', 3); for (let i = 0; i < Math.floor((w - 30) / 26); i++) { const hh = 44 + ((i * 7 + r * 5) % 5) * 5; rr(g, x + 14 + i * 26, y + 70 - hh, 22, hh, 2, C[(i * 3 + r + b) % 8], 2.5); } } }
    if (S.gapShelf) { rr(g, 560 + 8, 74 + 70 - 62, 380 - 16, 62, 0, '#7a4f2f', 0); }
    rr(g, 400, 80, 160, 46, 12, '#ef5350', 5); G.text(g, 'هدوء من فضلك', 480, 104, { size: 22, color: '#fff' });
    RK.rug(g, 480, 495, 260, 36, '#8a6bd6', '#b6a0f0', { star: true });
    if (S.mouseSleep) A.draw(g, 'sleepz', 495, 400, 40);
    G.amb(s, { k: 'glow', x: 480, y: 60, r: 300, ry: 120, col: '255,214,140', a: .3, z: 'top' }); G.amb(s, { k: 'dust', box: [200, 120, 560, 300], n: 18, z: 'top', seed: 11 });
  };

  /* ---------- GYM ---------- */
  R.sc_gym = function (g, t, s) {
    const S = s.state;
    RK.wall(g, 430, '#cde8ff', '#eaf5ff', { pattern: 'none', dado: { h: 90, c: '#7ab6ee' } });
    for (let i = 0; i < 6; i++) { G.line(g, 60 + i * 20, 130, 60 + i * 20, 400, 5, '#b97b4a'); } for (let y = 150; y < 400; y += 34) G.line(g, 56, y, 160, y, 4, '#b97b4a');
    G.line(g, 780, 410, 780, 220, 7, '#8a8f9a'); rr(g, 740, 170, 80, 56, 4, '#fff', 4.5); G.circ(g, 780, 228, 12, 'rgba(0,0,0,0)', 4, '#ef5350');
    rr(g, 240, 40, 400, 56, 12, '#4a8dff', 5); G.text(g, 'اليوم الرياضي', 440, 69, { size: 32, color: '#fff', stroke: OL, sw: 4 });
    for (let i = 0; i < 12; i++) { const x = 240 + i * 36; G.poly(g, [[x, 96], [x + 30, 96], [x + 15, 124]], ['#ef5350', '#ffd23c', '#5cc96b', '#8a6bd6'][i % 4], 2.5); }
    RK.floor(g, 430, '#e8b97e', '#c08a52', { kind: 'wood', n: 30 });
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 5; g.beginPath(); g.ellipse(480, 500, 220, 36, 0, 0, 6.3); g.stroke(); G.line(g, 480, 432, 480, 540, 5, 'rgba(255,255,255,.7)');
    if (S.finish) { G.fillRR(g, 700, 440, 12, 90, 3, '#fff', 3); G.fillRR(g, 130, 440, 12, 90, 3, '#fff', 3); G.text(g, 'البداية', 136, 430, { size: 20, color: '#2b3a67' }); G.text(g, 'النهاية', 706, 430, { size: 20, color: '#2b3a67' }); }
    G.amb(s, { k: 'glow', x: 480, y: 40, r: 380, ry: 140, col: '255,255,235', a: .28, z: 'top' });
  };

  /* ---------- ROAD CROSSING (zebra) ---------- */
  R.sc_road = function (g, t, s) {
    RK.sky(g, s, 'day', 320, { seed: 6 });
    [[0, 170, 130, 150, '#ffd0a8'], [150, 190, 120, 130, '#d9c7f5'], [290, 150, 140, 170, '#c9eed0'], [450, 200, 110, 120, '#ffe29a'], [590, 160, 130, 160, '#ffc0d0'], [740, 190, 120, 130, '#bfe8ff'], [870, 170, 100, 150, '#ffd0a8']].forEach(b => building(g, b[0], b[1], b[2], b[3], b[4]));
    RK.sidewalk(g, 320, 370); RK.road(g, 370, 460, { dy: 5 });
    for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(40,40,60,.25)'; g.fillRect(383 + i * 38, 376, 22, 86); G.fillRR(g, 380 + i * 38, 372, 22, 86, 2, '#fff', 0); }
    RK.sidewalk(g, 460, 540);
  };

  /* ================= PROPS ================= */
  A.registerAll({
    schoolbus(g, o) { G.fillRR(g, -46, -22, 92, 46, 8, '#ffc21a', 4.5); G.fillRR(g, -46, -22, 92, 12, 4, '#ffd95a', 0); [-34, -14, 6].forEach(x => G.fillRR(g, x, -16, 17, 17, 3, '#bfe8ff', 3)); G.fillRR(g, 28, -16, 14, 28, 3, o.door ? '#2f7d5b' : '#bfe8ff', 3); G.fillRR(g, -46, 6, 92, 5, 0, '#3a3a45', 0); [-26, 24].forEach(x => { G.circ(g, x, 26, 11, '#3a3a45', 4); G.circ(g, x, 26, 4, '#ccc', 0); }); G.fillRR(g, -48, 4, 8, 10, 2, '#ef5350', 2.5); },
    desk(g, o) { G.fillRR(g, -36, -20, 72, 12, 4, '#e0b070', 4); G.fillRR(g, -32, -8, 8, 40, 2, '#9aa0b5', 3); G.fillRR(g, 24, -8, 8, 40, 2, '#9aa0b5', 3); G.fillRR(g, -26, 12, 52, 8, 3, '#c8935a', 3); if (o.bag) { A.draw(g, 'bag', 0, -44, 44); } if (o.name) G.text(g, o.name, 0, -4, { size: 12, color: '#fff', stroke: OL, sw: 3 }); },
    chalk(g) { G.fillRR(g, -26, -8, 52, 16, 5, '#fff', 4); },
    bell(g) { g.beginPath(); g.moveTo(-30, 20); g.quadraticCurveTo(-30, -34, 0, -34); g.quadraticCurveTo(30, -34, 30, 20); g.closePath(); G.fs(g, '#ffc93c', 4.5); G.circ(g, 0, 28, 8, '#b07a10', 3); G.circ(g, 0, -40, 6, '#b07a10', 3); },
    globe(g) { G.circ(g, 0, -4, 32, '#4aa8e8', 4.5); G.ell(g, -8, -10, 12, 8, '#5cc96b', 2.5); G.ell(g, 12, 6, 9, 12, '#5cc96b', 2.5); G.fillRR(g, -20, 28, 40, 8, 3, '#8a5a3a', 3.5); },
    lunchbox(g) { G.fillRR(g, -38, -20, 76, 54, 10, '#1fb5a6', 4.5); G.fillRR(g, -38, -26, 76, 16, 8, '#14877c', 4); g.beginPath(); g.arc(0, -28, 14, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); G.circ(g, 0, 10, 10, '#ffc93c', 3); },
    juice(g) { G.fillRR(g, -20, -30, 40, 60, 6, '#ff9a2a', 4.5); G.fillRR(g, -20, -6, 40, 22, 0, '#fff', 2.5); G.line(g, 6, -30, 18, -46, 5, '#4a8dff'); },
    sandwich(g) { G.fillRR(g, -38, 6, 76, 16, 8, '#e6b46a', 4.5); G.fillRR(g, -34, -8, 68, 12, 4, '#5cc96b', 3); G.fillRR(g, -34, -18, 68, 12, 4, '#ef5350', 3); G.fillRR(g, -38, -30, 76, 16, 8, '#f3cf8e', 4.5); },
    ruler(g) { g.save(); g.rotate(-.5); G.fillRR(g, -46, -12, 92, 24, 4, '#ffd95a', 4.5); for (let i = 0; i < 9; i++) G.line(g, -38 + i * 10, -12, -38 + i * 10, i % 2 ? -4 : 0, 2.5); g.restore(); },
    eraser(g) { G.fillRR(g, -30, -16, 60, 32, 6, '#fff', 4.5); G.fillRR(g, -30, -16, 30, 32, 6, '#4a8dff', 4); },
    pencilcase(g) { G.fillRR(g, -42, -18, 84, 38, 14, '#ff6f91', 4.5); G.line(g, -40, 0, 40, 0, 3.5, '#fff'); G.circ(g, 0, 0, 5, '#ffd23c', 2.5); },
    bin(g, o) { const c = { green: '#5cc96b', blue: '#4a8dff', yellow: '#ffc21a', red: '#ef5350' }[(o.args && o.args[0]) || 'green'] || '#5cc96b'; G.poly(g, [[-30, -22], [30, -22], [24, 40], [-24, 40]], c, 4.5); G.fillRR(g, -36, -34, 72, 14, 6, G.shade(c, -.2), 4); G.line(g, -10, -14, -8, 30, 3, 'rgba(255,255,255,.4)'); G.line(g, 10, -14, 8, 30, 3, 'rgba(255,255,255,.4)'); },
    bottle(g) { G.fillRR(g, -14, -16, 28, 56, 10, 'rgba(180,225,255,.9)', 4.5); G.fillRR(g, -8, -34, 16, 20, 4, 'rgba(180,225,255,.9)', 4); G.fillRR(g, -10, -42, 20, 10, 3, '#4a8dff', 3.5); G.fillRR(g, -12, 10, 24, 18, 0, '#4aa8e8', 0); },
    wrapper(g) { G.poly(g, [[-30, 0], [-44, -12], [-44, 12]], '#ffd23c', 3.5); G.poly(g, [[30, 0], [44, -12], [44, 12]], '#ffd23c', 3.5); G.fillRR(g, -30, -14, 60, 28, 8, '#ff6f91', 4.5); G.star(g, 0, 0, 9, '#fff', 2); },
    paper(g) { G.circ(g, 0, 0, 30, '#f3efe4', 4.5); g.strokeStyle = '#c9c3b2'; g.lineWidth = 3; g.beginPath(); g.moveTo(-14, -8); g.lineTo(2, 4); g.lineTo(-6, 16); g.moveTo(10, -16); g.lineTo(18, 2); g.stroke(); },
    core(g) { g.beginPath(); g.moveTo(-14, -34); g.quadraticCurveTo(-34, 0, -14, 36); g.lineTo(14, 36); g.quadraticCurveTo(34, 0, 14, -34); g.closePath(); G.fs(g, '#e8d29a', 4.5); G.poly(g, [[-20, -26], [-10, -34], [10, -34], [20, -26], [20, -14], [-20, -14]], '#ef5350', 3.5); G.line(g, 0, -34, 4, -46, 4, '#6a4a2a'); },
    sbook(g, o) { const c = (o.args && o.args[0]) || '#8a6bd6', ic = o.args && o.args[1]; G.fillRR(g, -28, -40, 56, 80, 6, c, 4.5); G.fillRR(g, -32, -40, 10, 80, 4, G.shade(c, -.25), 3.5); G.fillRR(g, -16, -30, 38, 38, 6, '#fff', 3); if (ic) A.draw(g, ic, 3, -11, 30); G.line(g, -12, 20, 20, 20, 4, 'rgba(255,255,255,.75)'); G.line(g, -12, 30, 12, 30, 4, 'rgba(255,255,255,.75)'); },
    bookstack(g) { G.fillRR(g, -36, 8, 72, 22, 4, '#ef5350', 4.5); G.fillRR(g, -30, -12, 62, 22, 4, '#4a8dff', 4.5); G.fillRR(g, -34, -30, 66, 20, 4, '#ffc93c', 4.5); },
    flask(g, o) { const c = (o.args && o.args.join(':')) || '#4aa8e8'; g.beginPath(); g.moveTo(-10, -40); g.lineTo(10, -40); g.lineTo(10, -14); g.lineTo(34, 30); g.quadraticCurveTo(36, 40, 24, 40); g.lineTo(-24, 40); g.quadraticCurveTo(-36, 40, -34, 30); g.lineTo(-10, -14); g.closePath(); G.fs(g, 'rgba(220,240,255,.9)', 4.5); g.save(); g.beginPath(); g.moveTo(-18, 6); g.lineTo(18, 6); g.lineTo(32, 30); g.quadraticCurveTo(34, 38, 24, 38); g.lineTo(-24, 38); g.quadraticCurveTo(-34, 38, -32, 30); g.closePath(); g.fillStyle = c; g.fill(); g.restore(); G.fillRR(g, -13, -44, 26, 8, 3, '#b97b4a', 3.5); },
    seedling(g, o) { const st = o.stage == null ? 1 : o.stage; G.poly(g, [[-30, 8], [30, 8], [22, 44], [-22, 44]], '#e07a4a', 4.5); G.ell(g, 0, 8, 30, 8, '#6a4a2a', 3.5); if (st >= 0) { G.line(g, 0, 6, 0, 6 - 12 - st * 14, 5, '#3fa551'); } if (st >= 1) { G.ell(g, -14, -8, 14, 7, '#5cc96b', 3.5, null, -.5); G.ell(g, 14, -12, 14, 7, '#5cc96b', 3.5, null, .5); } if (st >= 2) { G.ell(g, -18, -28, 16, 8, '#5cc96b', 3.5, null, -.6); G.ell(g, 18, -32, 16, 8, '#5cc96b', 3.5, null, .6); } if (st >= 3) { for (let i = 0; i < 6; i++) G.ell(g, Math.cos(i * 1.05) * 12, -52 + Math.sin(i * 1.05) * 12, 8, 5, '#ff6f91', 2.5, null, i); G.circ(g, 0, -52, 7, '#ffd23c', 2.5); } },
    wateringcan(g) { G.fillRR(g, -28, -10, 52, 42, 8, '#4a8dff', 4.5); G.line(g, 24, 4, 46, -22, 7, '#4a8dff'); G.fillRR(g, 40, -34, 14, 20, 3, '#2f6fe0', 3.5); g.beginPath(); g.arc(-4, -12, 18, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); },
    lampsun(g) { G.sun(g, 0, 0, 24, M.time); },
    magnet(g) { g.beginPath(); g.arc(0, 0, 30, Math.PI, 0); g.lineTo(30, 32); g.lineTo(12, 32); g.lineTo(12, 0); g.arc(0, 0, 12, 0, Math.PI, true); g.lineTo(-12, 32); g.lineTo(-30, 32); g.closePath(); G.fs(g, '#ef5350', 4.5); G.fillRR(g, -30, 20, 18, 14, 0, '#e8edf5', 3); G.fillRR(g, 12, 20, 18, 14, 0, '#e8edf5', 3); },
    nail(g) { g.save(); g.rotate(-.6); G.fillRR(g, -5, -34, 10, 62, 3, '#aab4c5', 4); G.fillRR(g, -14, -38, 28, 8, 3, '#8f9bb0', 4); g.restore(); },
    clip(g) { g.lineWidth = 6; g.strokeStyle = '#8f9bb0'; g.beginPath(); g.moveTo(-14, 24); g.lineTo(-14, -22); g.arc(0, -22, 14, Math.PI, 0); g.lineTo(14, 20); g.arc(4, 20, 10, 0, Math.PI); g.lineTo(-6, -14); g.stroke(); },
    stone(g) { g.beginPath(); g.moveTo(-34, 16); g.quadraticCurveTo(-40, -14, -12, -24); g.quadraticCurveTo(24, -32, 36, -2); g.quadraticCurveTo(40, 22, 12, 24); g.quadraticCurveTo(-18, 28, -34, 16); g.closePath(); G.fs(g, '#9aa0b0', 4.5); G.ell(g, -8, -8, 10, 6, 'rgba(255,255,255,.35)', 0); },
    leaf(g) { g.beginPath(); g.moveTo(-34, 20); g.quadraticCurveTo(-30, -30, 30, -34); g.quadraticCurveTo(34, 24, -34, 20); g.closePath(); G.fs(g, '#5cc96b', 4.5); G.line(g, -30, 18, 16, -20, 3.5, '#2f8a44'); },
    cork(g) { G.fillRR(g, -16, -22, 32, 44, 4, '#d9a66e', 4.5); [[-6, -8], [6, 6], [-4, 14]].forEach(p => G.circ(g, p[0], p[1], 2.5, '#a8743a', 0)); },
    wood(g) { G.fillRR(g, -38, -14, 76, 28, 6, '#b97b4a', 4.5); G.ell(g, -38, 0, 7, 14, '#d9a66e', 3.5); G.line(g, -20, -6, 24, -6, 2.5, '#8a5a3a'); G.line(g, -14, 6, 30, 6, 2.5, '#8a5a3a'); },
    goggles(g) { G.fillRR(g, -42, -14, 84, 30, 14, '#4a8dff', 4.5); [-18, 18].forEach(x => { G.circ(g, x, 0, 16, 'rgba(210,240,255,.9)', 4); G.ell(g, x - 4, -5, 5, 3, 'rgba(255,255,255,.8)', 0); }); G.line(g, -42, 0, -50, 0, 5); G.line(g, 42, 0, 50, 0, 5); },
    trophy(g) { g.beginPath(); g.moveTo(-26, -34); g.lineTo(26, -34); g.quadraticCurveTo(26, 8, 0, 12); g.quadraticCurveTo(-26, 8, -26, -34); g.closePath(); G.fs(g, '#ffc93c', 4.5); [-1, 1].forEach(s => { g.beginPath(); g.arc(s * 30, -20, 12, s > 0 ? -1.5 : 1.6, s > 0 ? 1.5 : 4.7, s < 0); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); }); G.fillRR(g, -6, 10, 12, 18, 2, '#ffc93c', 3.5); G.fillRR(g, -22, 28, 44, 12, 4, '#b07a10', 4); G.star(g, 0, -12, 11, '#fff', 2); },
    whistle(g) { G.circ(g, -8, 6, 20, '#ef5350', 4.5); G.fillRR(g, 6, -10, 36, 18, 5, '#ef5350', 4.5); G.circ(g, -8, 6, 7, '#7a1a18', 0); },
    cone(g) { G.poly(g, [[0, -38], [22, 30], [-22, 30]], '#ff8a2a', 4.5); G.fillRR(g, -30, 28, 60, 12, 4, '#ff8a2a', 4); G.fillRR(g, -13, -8, 26, 10, 0, '#fff', 2.5); },
    pompom(g) { for (let i = 0; i < 12; i++) { const a = i * .52; G.line(g, 0, 8, Math.cos(a) * 34, 8 + Math.sin(a) * 34 - 8, 5, i % 2 ? '#ff6f91' : '#ffd23c'); } G.fillRR(g, -8, 6, 16, 34, 4, '#4a8dff', 4); },
    baton(g) { g.save(); g.rotate(-.7); G.fillRR(g, -34, -6, 68, 12, 5, '#ef5350', 4.5); G.fillRR(g, -10, -6, 20, 12, 0, '#fff', 0); g.restore(); },
    trafficlight(g, o) { const st = (o.args && o.args[0]) || 'red'; G.fillRR(g, -20, -42, 40, 84, 10, '#3a3f55', 4.5); [['red', -24], ['yellow', 0], ['green', 24]].forEach(c => G.circ(g, 0, c[1], 11, st === c[0] ? { red: '#ff3b30', yellow: '#ffd23c', green: '#33d65a' }[c[0]] : '#4a4f66', 3)); },
    walkman(g, o) { const st = (o.args && o.args[0]) || 'stop'; G.fillRR(g, -26, -34, 52, 68, 10, '#3a3f55', 4.5); if (st === 'go') { G.circ(g, 0, -10, 7, '#33d65a', 2.5); G.fillRR(g, -4, -2, 8, 18, 3, '#33d65a', 2.5); G.line(g, -4, 6, -12, 14, 5, '#33d65a'); G.line(g, 4, 6, 12, 14, 5, '#33d65a'); } else { G.circ(g, 0, -10, 7, '#ff3b30', 2.5); G.fillRR(g, -9, 0, 18, 18, 3, '#ff3b30', 2.5); } },
    eye(g, o) { const d = (o.args && o.args[0]) === 'l' ? -1 : 1; G.ell(g, 0, 0, 36, 24, '#fff', 4.5); G.circ(g, d * 12, 0, 13, '#4a8dff', 3.5); G.circ(g, d * 12, 0, 6, '#222', 0); },
    carside(g, o) { const c = (o.args && o.args[0]) || '#ef5350'; G.fillRR(g, -44, -8, 88, 30, 10, c, 4.5); G.fillRR(g, -24, -30, 48, 26, 10, G.shade(c, .2), 4.5); G.fillRR(g, -17, -25, 15, 16, 3, '#bfe8ff', 2.5); G.fillRR(g, 3, -25, 15, 16, 3, '#bfe8ff', 2.5); [-26, 26].forEach(x => { G.circ(g, x, 24, 11, '#3a3a45', 4); G.circ(g, x, 24, 4, '#ccc', 0); }); },
    kid(g, o) { const c = (o.args && o.args[0]) || '#ff6f91', h = (o.args && +o.args[1]) || 1; g.save(); g.scale(1, h); G.fillRR(g, -16, -2, 32, 44, 10, c, 4); G.circ(g, 0, -18, 20, '#e5b080', 4); g.beginPath(); g.ellipse(0, -28, 20, 12, 0, Math.PI, 0); G.fs(g, '#3a2a1e', 3); [-7, 7].forEach(x => G.circ(g, x, -16, 2.6, '#222', 0)); g.beginPath(); g.arc(0, -10, 7, .3, Math.PI - .3); g.lineWidth = 2.5; g.strokeStyle = OL; g.stroke(); g.restore(); },
    handup(g) { G.fillRR(g, -9, -4, 18, 44, 8, '#e5b080', 4); [-12, -4, 4, 12].forEach((x, i) => G.fillRR(g, x - 3, -30 - (i === 1 || i === 2 ? 8 : 0), 6, 30, 3, '#e5b080', 3.5)); G.fillRR(g, -20, 36, 40, 10, 4, '#4a8dff', 3.5); },
    sunbeam(g) { for (let i = 0; i < 5; i++) G.line(g, -30 + i * 15, -30, -36 + i * 15, 30, 6, 'rgba(255,225,80,.8)'); },
    ball2(g) { A.fns.ball(g, {}); }
  });
})();
