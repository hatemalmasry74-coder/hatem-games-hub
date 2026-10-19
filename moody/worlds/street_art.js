/* Moody & Aboody - worlds/street_art.js : art + backgrounds of WORLD 3 "الشارع والحي".
   Props are registered as  st_*  (100x100 box, see DEV.md); backgrounds are Moody.rooms.st_* (fn(g,t,stage), flags in stage.state). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {};
  const rr = G.fillRR;

  /* ---- the engine bakes every room once (engine/stage.js), so the old per-file blit cache is just a call ---- */
  const RK = G.room; let CUR = null;
  function blit(g, key, fn) { fn(g); }
  M.stBlit = blit;
  function sky(g, a, b, h) { RK.sky(g, CUR, 'city', h || 300, { seed: 7 }); }
  function windowsGrid() { }
  function building(g, x, y, w, h, c, shut, balc) {
    RK.building(g, x, y, w, h, c, { ww: 56, wh: 62 });
    if (shut) { const cols = Math.max(1, Math.round(w / 56)), rows = Math.max(1, Math.round(h / 62)), cw = (w - 16) / cols, ch = (h - 22) / rows; for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) if ((r + q) % 2 === 0) { const wx = x + 8 + q * cw + cw * .16, wy = y + 14 + r * ch + ch * .12, ww = cw * .68, wh = ch * .66; G.fillRR(g, wx - 5, wy, 4, wh, 1.5, shut, 1.2); G.fillRR(g, wx + ww + 1, wy, 4, wh, 1.5, shut, 1.2); } }
    if (balc) for (let r = 1; r < Math.round(h / 62); r++) G.fillRR(g, x - 4, y + r * (h / Math.round(h / 62)) - 6, w + 8, 8, 2, '#9c8a73', 2.5);
  }
  function tree(g, x, y, sc, c) { RK.tree(g, x, y, sc * 1.25, c ? { c1: c, c2: G.shade(c, -.12) } : null); }
  function lamp(g, x, y, sc) { rr(g, x - 3 * sc, y - 120 * sc, 6 * sc, 120 * sc, 2, '#4a4f66', 2.5); rr(g, x - 3 * sc, y - 124 * sc, 36 * sc, 6 * sc, 3, '#4a4f66', 2.5); G.ell(g, x + 28 * sc, y - 116 * sc, 10 * sc, 6 * sc, '#ffe98a', 2.5); }
  function awning(g, x, y, w, c1, c2) { for (let i = 0; i < 6; i++) G.poly(g, [[x + i * w / 6, y], [x + (i + 1) * w / 6, y], [x + (i + 1) * w / 6 - 3, y + 24], [x + i * w / 6 + 3, y + 24]], i % 2 ? c2 : c1, 2.5); g.fillStyle = 'rgba(40,15,0,.2)'; g.fillRect(x, y + 24, w, 8); }
  function sign(g, x, y, w, txt, c, tc) { rr(g, x, y, w, 34, 8, c, 3.5); G.text(g, txt, x + w / 2, y + 18, { size: 22, color: tc || '#fff', stroke: OL, sw: 4 }); }
  function cloudsT() { }
  M.stSky = sky; M.stTree = tree;

  /* ================= PROPS ================= */
  const face = (g, skin, w, h) => { G.ell(g, 0, 4, w, h, skin, 3.5); [-1, 1].forEach(s => { G.ell(g, s * w * .38, 2, 4.5, 5.5, '#fff', 2); G.circ(g, s * w * .38, 3, 3, '#3a2013', 0); }); };
  const smile = (g, y, r) => { g.beginPath(); g.arc(0, y, r, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); };
  A.registerAll({
    /* --- traffic --- */
    st_light(g, o) { const c = o.c || (o.args && o.args[0]) || 'red'; G.fillRR(g, -4, 20, 8, 28, 2, '#4a4f66', 3); G.fillRR(g, -17, -48, 34, 72, 10, '#3a3f55', 4); [['red', -32, '#ef5350'], ['yellow', -12, '#ffd23c'], ['green', 8, '#5cc96b']].forEach(l => G.circ(g, 0, l[1], 8.5, c === l[0] ? l[2] : '#5a5f75', 2.5)); if (c) { const y = { red: -32, yellow: -12, green: 8 }[c]; g.save(); g.globalAlpha = .35; G.circ(g, 0, y, 15, { red: '#ef5350', yellow: '#ffd23c', green: '#5cc96b' }[c], 0); g.restore(); } },
    st_pedlight(g, o) {
      G.fillRR(g, -4, 26, 8, 22, 2, '#4a4f66', 3); G.fillRR(g, -26, -44, 52, 74, 10, '#3a3f55', 4);
      const gr = !!o.green || (o.args && o.args[0] === 'green'); G.fillRR(g, -19, -37, 38, 60, 6, gr ? '#103a1c' : '#3a1010', 0); const col = gr ? '#5cf07a' : '#ff5a4a';
      G.circ(g, 0, -22, 7, col, 0); g.lineCap = 'round'; g.strokeStyle = col; g.lineWidth = 6;
      g.beginPath(); g.moveTo(0, -15); g.lineTo(0, 4); g.stroke();
      if (gr) { g.beginPath(); g.moveTo(0, 4); g.lineTo(-8, 18); g.moveTo(0, 4); g.lineTo(8, 18); g.moveTo(0, -11); g.lineTo(-9, -2); g.moveTo(0, -11); g.lineTo(9, -4); g.stroke(); }
      else { g.beginPath(); g.moveTo(0, 4); g.lineTo(-5, 18); g.moveTo(0, 4); g.lineTo(5, 18); g.moveTo(0, -11); g.lineTo(-8, 0); g.moveTo(0, -11); g.lineTo(8, 0); g.stroke(); }
    },
    st_pbutton(g, o) { G.fillRR(g, -6, -6, 12, 56, 3, '#4a4f66', 3); G.fillRR(g, -20, -38, 40, 44, 8, '#ffd23c', 4); G.circ(g, 0, -20, 11, o.on ? '#5cc96b' : '#ef5350', 3.5); G.text(g, 'اضغط', 0, 16, { size: 12, color: OL }); },
    st_stop(g) { const p = []; for (let i = 0; i < 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; p.push([Math.cos(a) * 40, Math.sin(a) * 40]); } G.poly(g, p, '#ef5350', 4.5); G.text(g, 'قف', 0, 2, { size: 30, color: '#fff', stroke: OL, sw: 3 }); },
    st_zsign(g) { G.fillRR(g, -34, -34, 68, 68, 10, '#3a7de0', 4.5); G.poly(g, [[0, -28], [26, 22], [-26, 22]], '#fff', 3); G.circ(g, 0, -4, 5, OL, 0); G.line(g, 0, -2, 0, 12, 4); G.line(g, 0, 12, -5, 20, 3.5); G.line(g, 0, 12, 5, 20, 3.5); },
    st_zebra(g) { G.fillRR(g, -44, -30, 88, 60, 6, '#6b6f7e', 4); for (let i = 0; i < 5; i++) G.fillRR(g, -38, -24 + i * 11.5, 76, 7, 1, '#fff', 0); },
    st_hands(g) { G.heart(g, 0, -4, 30, '#ff8fb1', 4.5); G.circ(g, -22, 16, 11, '#e8aa7a', 3.5); G.circ(g, 22, 16, 11, '#f0c08a', 3.5); G.fillRR(g, -20, 12, 40, 12, 6, '#e8aa7a', 3.5); },
    st_eye(g, o) { const d = (o.args && o.args[0] === 'l') ? -1 : (o.args && o.args[0] === 'r') ? 1 : 0; G.ell(g, 0, 0, 40, 26, '#fff', 4.5); G.circ(g, d * 14, 0, 15, '#6a4a2a', 3); G.circ(g, d * 14, 0, 7, '#1d1209', 0); G.circ(g, d * 14 - 4, -5, 3.5, '#fff', 0); },
    st_car(g, o) { const c = o.c || (o.args && { red: '#ef5350', blue: '#4a8dff', green: '#5cc96b', yellow: '#ffd23c', white: '#f3f6fb', pink: '#ff6f91' }[o.args[0]]) || '#ef5350'; G.fillRR(g, -46, -4, 92, 30, 11, c, 4.5); G.fillRR(g, -26, -28, 52, 28, 11, c, 4.5); G.fillRR(g, -20, -23, 17, 17, 3, '#bfe8ff', 2.5); G.fillRR(g, 2, -23, 17, 17, 3, '#bfe8ff', 2.5); G.fillRR(g, 38, 2, 8, 8, 3, '#ffe98a', 2); [-26, 26].forEach(x => { G.circ(g, x, 26, 12, '#3a3a45', 4); G.circ(g, x, 26, 4, '#ccc', 0); }); },
    st_tuktuk(g, o) { const c = o.c || '#2fa84f'; G.fillRR(g, -30, -10, 60, 34, 10, c, 4.5); G.poly(g, [[-30, -10], [-26, -34], [18, -34], [30, -10]], '#ffd23c', 4.5); G.fillRR(g, -20, -28, 36, 16, 3, '#bfe8ff', 2.5); G.fillRR(g, 28, 6, 14, 14, 4, c, 4); G.circ(g, 40, 26, 9, '#3a3a45', 3.5); [-18, 14].forEach(x => G.circ(g, x, 26, 11, '#3a3a45', 4)); G.circ(g, 44, 4, 4, '#ffe98a', 2); },
    st_micro(g) { G.fillRR(g, -48, -20, 96, 48, 12, '#f3f6fb', 4.5); G.fillRR(g, -48, 4, 96, 10, 0, '#3a7de0', 0); G.fillRR(g, -48, -20, 96, 48, 12, null, 4.5); [-34, -10, 14].forEach(x => G.fillRR(g, x, -14, 18, 16, 3, '#bfe8ff', 2.5)); G.fillRR(g, 34, -14, 12, 16, 3, '#bfe8ff', 2.5); [-26, 26].forEach(x => { G.circ(g, x, 30, 12, '#3a3a45', 4); G.circ(g, x, 30, 4, '#ccc', 0); }); },

    /* --- people (portraits; full figures further down) --- */
    st_elder(g) { G.circ(g, 0, 0, 44, '#e9defc', 4); face(g, '#e0a878', 28, 32); g.beginPath(); g.ellipse(0, -20, 30, 14, 0, Math.PI, 0); G.fs(g, '#f3f3f3', 3); G.fillRR(g, -9, 10, 18, 8, 4, '#f3f3f3', 2.5); smile(g, 14, 10); G.line(g, -30, 2, -34, 20, 6, '#f3f3f3'); G.line(g, 30, 2, 34, 20, 6, '#f3f3f3'); G.fillRR(g, -24, -34, 48, 14, 7, '#ffffff', 3); },
    st_police(g) { G.circ(g, 0, 0, 44, '#cfe3ff', 4); face(g, '#dd9d6c', 27, 31); smile(g, 16, 10); G.fillRR(g, -34, -34, 68, 18, 6, '#26324f', 3.5); G.fillRR(g, -28, -48, 56, 20, 8, '#26324f', 3.5); G.star(g, 0, -38, 8, '#ffd23c', 1.5); G.fillRR(g, -22, 30, 44, 12, 4, '#4a6fb0', 3); },
    st_shop(g) { G.circ(g, 0, 0, 44, '#ffe9c8', 4); face(g, '#dd9d6c', 27, 31); g.beginPath(); g.ellipse(0, -18, 29, 14, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); G.ell(g, 0, 14, 14, 5, '#2e1b10', 2); smile(g, 18, 8); G.fillRR(g, -28, 32, 56, 14, 4, '#5cc96b', 3); },
    st_stranger(g) { G.circ(g, 0, 0, 44, '#e6e6ee', 4); face(g, '#d9a070', 27, 31); smile(g, 16, 10); G.fillRR(g, -34, -24, 68, 10, 4, '#6a6a7a', 3.5); G.fillRR(g, -22, -42, 44, 24, 9, '#6a6a7a', 3.5); G.ell(g, 0, 36, 24, 10, '#7d6a9a', 3); },
    st_woman(g) { G.circ(g, 0, 0, 44, '#ffe0ea', 4); g.beginPath(); g.ellipse(0, 4, 36, 40, 0, 0, 6.3); G.fs(g, '#ff8fb1', 4); face(g, '#e8aa7a', 24, 28); smile(g, 16, 9); },
    st_man(g) { G.circ(g, 0, 0, 44, '#d9f0ff', 4); face(g, '#dd9d6c', 27, 31); g.beginPath(); g.ellipse(0, -18, 30, 15, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); smile(g, 16, 10); },
    st_oldman(g, o) { // full figure
      G.shadow(g, 0, 46, 28, 6); G.fillRR(g, 28, -6, 6, 52, 3, '#8a5a3a', 3.5); g.beginPath(); g.arc(31, -6, 8, Math.PI, 0); g.lineWidth = 6; g.strokeStyle = '#8a5a3a'; g.stroke();
      G.fillRR(g, -14, 34, 10, 12, 4, '#8a5a3a', 3); G.fillRR(g, 4, 34, 10, 12, 4, '#8a5a3a', 3);
      G.poly(g, [[-20, -8], [20, -8], [26, 38], [-26, 38]], '#e8e0c8', 4); G.fillRR(g, -22, -12, 44, 12, 5, '#e8e0c8', 3.5); G.circ(g, -22, 2, 6, '#e0a878', 3); G.circ(g, 22, 2, 6, '#e0a878', 3);
      G.circ(g, 0, -30, 17, '#e0a878', 3.5); g.beginPath(); g.arc(0, -36, 17, Math.PI, 0); G.fs(g, '#fff', 3); G.fillRR(g, -17, -46, 34, 8, 4, '#fff', 3);
      [-1, 1].forEach(s => G.circ(g, s * 6, -30, 2.4, '#3a2013', 0)); G.ell(g, 0, -22, 8, 3.4, '#f3f3f3', 2); },

    /* full-body people: st_fig:stranger | police | shop | owner  (feet at y=+50) */
    st_fig(g, o) {
      const k = (o.args && o.args[0]) || 'owner', C = { stranger: ['#d9a070', '#7d6a9a', '#4a4a5a'], police: ['#dd9d6c', '#e8f0ff', '#26324f'], shop: ['#dd9d6c', '#fff6e0', '#6a5a4a'], owner: ['#dd9d6c', '#4aa8e8', '#4a4a5a'] }[k];
      G.shadow(g, 0, 50, 26, 6);
      G.fillRR(g, -14, 24, 12, 26, 4, C[2], 3.5); G.fillRR(g, 2, 24, 12, 26, 4, C[2], 3.5); G.ell(g, -9, 50, 10, 5, '#3a2a1e', 3); G.ell(g, 9, 50, 10, 5, '#3a2a1e', 3);
      [-1, 1].forEach(s => { G.fillRR(g, s * 24 - 5, -6, 10, 32, 5, C[1], 3.5); G.circ(g, s * 24, 28, 5.5, C[0], 3); });
      G.fillRR(g, -20, -10, 40, 38, 9, C[1], 4);
      if (k === 'shop') { G.fillRR(g, -15, 2, 30, 26, 5, '#5cc96b', 3); } if (k === 'police') { G.star(g, -9, 2, 6, '#ffd23c', 1.5); G.line(g, -20, 20, 20, 20, 4, '#26324f'); } if (k === 'stranger') G.line(g, 0, -10, 0, 28, 2.5, '#5a4a7a');
      G.circ(g, 0, -26, 16, C[0], 3.5); [-1, 1].forEach(s => { G.circ(g, s * 6, -27, 2.6, '#3a2013', 0); });
      g.beginPath(); g.arc(0, -22, 7, .3, Math.PI - .3); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke();
      if (k === 'police') { G.fillRR(g, -17, -37, 34, 6, 3, '#1a2238', 3); G.fillRR(g, -14, -52, 28, 18, 6, '#26324f', 3.5); G.star(g, 0, -44, 5, '#ffd23c', 1.2); }
      else if (k === 'stranger') { G.ell(g, 0, -37, 25, 6, '#6a6a7a', 3.5); G.fillRR(g, -13, -54, 26, 18, 7, '#6a6a7a', 3.5); }
      else { g.beginPath(); g.ellipse(0, -34, 16, 9, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); if (k === 'shop') G.ell(g, 0, -17, 8, 3, '#2e1b10', 2); }
    },
    /* --- litter / bins --- */
    st_bin(g, o) { const c = { blue: '#4a8dff', yellow: '#ffc93c', green: '#5cc96b', grey: '#9aa0b5' }[(o.args && o.args[0]) || 'grey'] || '#9aa0b5'; G.poly(g, [[-28, -26], [28, -26], [22, 42], [-22, 42]], c, 4.5); G.fillRR(g, -34, -38, 68, 14, 6, G.shade(c, -.15), 4); G.fillRR(g, -8, -46, 16, 10, 3, G.shade(c, -.25), 3); g.save(); g.globalAlpha = .9; const k = (o.args && o.args[0]); if (k === 'blue') { G.fillRR(g, -10, -8, 20, 26, 2, '#fff', 2.5); G.line(g, -6, 0, 6, 0, 2); G.line(g, -6, 7, 6, 7, 2); } else if (k === 'yellow') { G.fillRR(g, -5, -12, 10, 6, 2, '#fff', 2.5); G.fillRR(g, -8, -6, 16, 24, 6, '#fff', 2.5); } else if (k === 'green') { G.ell(g, 0, 6, 10, 12, '#fff', 2.5); G.ell(g, 6, -8, 6, 3, '#2f8a44', 2, null, -.5); } g.restore(); },
    st_paper(g) { g.beginPath(); g.moveTo(-26, -6); g.lineTo(-10, -30); g.lineTo(14, -24); g.lineTo(30, -2); g.lineTo(20, 24); g.lineTo(-6, 30); g.lineTo(-24, 18); g.closePath(); G.fs(g, '#fffdf6', 4); G.line(g, -10, -12, 12, -8, 2.5, '#c9bb9a'); G.line(g, -14, 2, 16, 6, 2.5, '#c9bb9a'); },
    st_news(g) { G.fillRR(g, -34, -26, 68, 54, 4, '#e9e6d8', 4.5); G.fillRR(g, -28, -20, 56, 10, 1, '#4a4a55', 0); [-4, 6, 16].forEach(y => G.line(g, -28, y, 28, y, 2.5, '#8a8a8a')); },
    st_bottle(g) { G.fillRR(g, -13, -16, 26, 56, 10, 'rgba(160,215,255,.9)', 4); G.fillRR(g, -7, -34, 14, 20, 4, 'rgba(160,215,255,.9)', 4); G.fillRR(g, -9, -42, 18, 9, 3, '#4a8dff', 3); G.fillRR(g, -13, 6, 26, 14, 0, '#4a8dff', 2.5); },
    st_can(g) { G.fillRR(g, -20, -30, 40, 64, 8, '#d5dbe8', 4.5); G.fillRR(g, -20, -12, 40, 26, 0, '#ef5350', 3); G.ell(g, 0, -30, 20, 6, '#b8c0d0', 3.5); G.text(g, 'علبة', 0, 2, { size: 13, color: '#fff' }); },
    st_peel(g) { g.beginPath(); g.moveTo(-34, 10); g.quadraticCurveTo(-4, -34, 34, 4); g.quadraticCurveTo(10, -6, -6, 14); g.quadraticCurveTo(-20, 34, -34, 10); G.fs(g, '#ffd93c', 4); G.circ(g, 24, 2, 4, '#8a6a2a', 2); },
    st_core(g) { G.ell(g, 0, 0, 22, 30, '#ef5350', 4); G.ell(g, 0, 0, 14, 22, '#fff3c4', 3); G.ell(g, 0, 0, 8, 16, '#e6c88a', 0); G.circ(g, 0, -8, 2.5, '#4a2e1c', 0); G.circ(g, 0, 8, 2.5, '#4a2e1c', 0); G.line(g, 0, -30, 3, -42, 4, '#6a4a2a'); },
    st_juice(g) { G.fillRR(g, -20, -26, 40, 56, 5, '#ffb347', 4.5); G.circ(g, 0, 2, 11, '#fff3c4', 3); G.line(g, 8, -26, 14, -44, 4, '#ef5350'); G.line(g, 14, -44, 22, -44, 4, '#ef5350'); },
    /* --- garden --- */
    st_sapling(g) { G.ell(g, 0, 34, 28, 10, '#8a5a3a', 3.5); G.line(g, 0, 32, 0, -4, 5, '#6a8a3a'); G.ell(g, -14, -6, 14, 8, '#5cc96b', 3.5, null, -.5); G.ell(g, 14, -14, 14, 8, '#6fd97a', 3.5, null, .5); G.ell(g, 0, -22, 8, 12, '#5cc96b', 3.5); },
    st_shovel(g) { g.save(); g.rotate(.4); G.fillRR(g, -4, -44, 8, 56, 3, '#b97b4a', 3.5); G.fillRR(g, -9, -48, 18, 8, 3, '#8a5a3a', 3); G.poly(g, [[-16, 10], [16, 10], [12, 40], [0, 46], [-12, 40]], '#b8c0d0', 4); g.restore(); },
    st_wcan(g) { G.poly(g, [[-28, -10], [18, -10], [22, 32], [-32, 32]], '#4a8dff', 4.5); G.fillRR(g, -34, -16, 48, 8, 3, '#2f6fe0', 3); g.beginPath(); g.moveTo(18, 4); g.lineTo(44, -22); g.lineWidth = 8; g.strokeStyle = OL; g.stroke(); g.lineWidth = 4; g.strokeStyle = '#4a8dff'; g.stroke(); G.fillRR(g, 38, -32, 14, 10, 3, '#2f6fe0', 3); g.beginPath(); g.arc(-8, -12, 16, Math.PI, 0); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); },
    st_soil(g) { g.beginPath(); g.moveTo(-40, 30); g.quadraticCurveTo(-20, -20, 0, -22); g.quadraticCurveTo(24, -20, 40, 30); g.closePath(); G.fs(g, '#8a5a3a', 4.5); G.circ(g, -10, 8, 3, '#6a3f20', 0); G.circ(g, 12, 14, 3, '#6a3f20', 0); G.circ(g, 4, -4, 3, '#6a3f20', 0); },
    st_tree(g, o) { const s = o.s || 1; G.fillRR(g, -9, -4, 18, 50, 5, '#8a5a3a', 4); G.circ(g, 0, -34, 36, '#5cc96b', 4.5); G.circ(g, -26, -16, 26, '#4fb85f', 4); G.circ(g, 26, -16, 26, '#4fb85f', 4); G.circ(g, -8, -44, 13, 'rgba(255,255,255,.25)', 0); if (o.fruit) [[-14, -30], [16, -22], [0, -50]].forEach(p => G.circ(g, p[0], p[1], 6, '#ff8a2a', 2.5)); },
    st_flower(g) { G.line(g, 0, 10, 0, 40, 4, '#3a9a4a'); for (let i = 0; i < 6; i++) { g.save(); g.rotate(i * 1.047); G.ell(g, 0, -15, 8, 12, '#ff8fb1', 3); g.restore(); } G.circ(g, 0, 0, 9, '#ffd23c', 3); },
    /* --- bags / neighbour --- */
    st_groc(g) { G.poly(g, [[-30, -10], [30, -10], [26, 40], [-26, 40]], '#c8935a', 4.5); G.fillRR(g, -34, -16, 68, 10, 3, '#b97b4a', 3.5); A.draw(g, 'tomato', -10, -20, 30); A.draw(g, 'orange', 12, -22, 28); G.ell(g, 18, -34, 7, 26, '#e6b46a', 3.5, null, .2); },
    st_sack(g) { G.poly(g, [[-30, -30], [30, -30], [38, 40], [-38, 40]], '#e7dcb8', 4.5); G.fillRR(g, -26, -38, 52, 12, 5, '#c9b68a', 3.5); G.text(g, 'رز', 0, 8, { size: 28, color: '#8a5a2b' }); },
    st_gallon(g) { G.fillRR(g, -22, -28, 44, 68, 10, 'rgba(160,215,255,.95)', 4.5); G.fillRR(g, -10, -42, 20, 16, 4, '#4a8dff', 3.5); G.fillRR(g, -22, -2, 44, 38, 8, '#4aa8e8', 0); G.fillRR(g, -22, -28, 44, 68, 10, null, 4.5); },
    st_cap(g) { g.beginPath(); g.ellipse(0, 4, 32, 24, 0, Math.PI, 0); G.fs(g, '#fff', 4.5); G.fillRR(g, -34, 2, 68, 12, 5, '#fff', 4); G.line(g, -20, -6, 20, -6, 2, '#d8d0c0'); },
    st_glasses(g) { G.circ(g, -18, 0, 16, 'rgba(190,230,255,.8)', 4); G.circ(g, 18, 0, 16, 'rgba(190,230,255,.8)', 4); G.line(g, -2, -2, 2, -2, 4); G.line(g, -34, -4, -42, -10, 4); G.line(g, 34, -4, 42, -10, 4); },
    st_wallet(g) { G.fillRR(g, -34, -22, 68, 46, 8, '#8a5a3a', 4.5); G.fillRR(g, -34, -12, 68, 10, 0, '#a0693a', 2.5); G.fillRR(g, 12, -4, 26, 20, 6, '#c8935a', 3.5); G.circ(g, 25, 6, 3.5, '#ffd23c', 2); G.line(g, -24, -26, -10, -30, 3); },
    st_phone(g) { G.fillRR(g, -20, -36, 40, 72, 9, '#3a3f55', 4.5); G.fillRR(g, -15, -28, 30, 48, 3, '#6fd0ff', 2.5); G.circ(g, 0, 28, 4, '#9aa0b5', 2); },
    /* --- animals --- */
    st_kitten(g, o) { const c = { orange: '#ff9a4a', gray: '#a0a8b8', black: '#4a4a55', white: '#f3f1ea' }[(o.args && o.args[0]) || 'orange']; G.ell(g, 0, 22, 24, 17, c, 4.5); G.circ(g, 0, -8, 21, c, 4.5); [-1, 1].forEach(s => G.poly(g, [[s * 7, -24], [s * 19, -38], [s * 21, -18]], c, 4)); [-1, 1].forEach(s => { G.ell(g, s * 8, -9, 3.6, 4.4, '#fff', 1.5); G.circ(g, s * 8, -8, 2.2, '#222', 0); }); G.poly(g, [[-3, -2], [3, -2], [0, 2]], '#ff6f91', 1.5); [-1, 1].forEach(s => { G.line(g, s * 6, 0, s * 20, -3, 1.8, OL); G.line(g, s * 6, 2, s * 20, 4, 1.8, OL); }); g.beginPath(); g.moveTo(22, 24); g.quadraticCurveTo(42, 20, 36, 0); g.lineWidth = 7; g.strokeStyle = c; g.stroke(); },
    st_fish(g) { G.ell(g, -4, 0, 30, 16, '#8fd6ff', 4.5); G.poly(g, [[22, 0], [42, -14], [42, 14]], '#4aa8e8', 4); G.circ(g, -18, -3, 3.5, OL, 0); G.line(g, -8, -10, -8, 10, 2.5, '#4aa8e8'); },
    st_bowl(g, o) { const w = o.args && o.args[0] === 'water'; g.beginPath(); g.moveTo(-34, -4); g.lineTo(34, -4); g.quadraticCurveTo(30, 34, 0, 34); g.quadraticCurveTo(-30, 34, -34, -4); g.closePath(); G.fs(g, '#ff8fb1', 4.5); G.ell(g, 0, -4, 34, 9, w ? '#4aa8e8' : '#8a5a2b', 4); if (!w) { G.circ(g, -10, -7, 4, '#c8935a', 1.5); G.circ(g, 8, -6, 4, '#c8935a', 1.5); } },
    st_pawprint(g) { G.ell(g, 0, 12, 18, 14, '#8a5a3a', 3); [[-20, -10], [-7, -22], [7, -22], [20, -10]].forEach(p => G.ell(g, p[0], p[1], 7, 9, '#8a5a3a', 3)); },
    st_bird(g) { G.ell(g, 0, 6, 26, 20, '#8fd6ff', 4.5); G.circ(g, 20, -10, 14, '#8fd6ff', 4.5); G.poly(g, [[32, -10], [44, -6], [32, -2]], '#ff8a2a', 3); G.circ(g, 24, -13, 3, OL, 0); G.ell(g, -4, 8, 14, 8, '#4aa8e8', 3); },
    st_dog(g) { G.ell(g, -4, 14, 30, 20, '#c8935a', 4.5); G.circ(g, 26, -6, 18, '#c8935a', 4.5); G.ell(g, 14, -8, 7, 14, '#8a5a3a', 3.5, null, .3); G.ell(g, 40, 0, 10, 7, '#e8c19a', 3); G.circ(g, 44, -2, 3, OL, 0); G.circ(g, 28, -12, 3, OL, 0); [-24, 4].forEach(x => G.fillRR(g, x, 26, 9, 18, 3, '#c8935a', 3.5)); g.beginPath(); g.moveTo(-32, 8); g.quadraticCurveTo(-48, -6, -42, -18); g.lineWidth = 7; g.strokeStyle = '#c8935a'; g.stroke(); },
    st_helmet(g) { g.beginPath(); g.ellipse(0, 6, 36, 30, 0, Math.PI, 0); G.fs(g, '#ffc93c', 4.5); G.fillRR(g, -40, 4, 80, 10, 4, '#ffc93c', 4); },
    st_cone(g) { G.poly(g, [[0, -38], [22, 30], [-22, 30]], '#ff8a2a', 4.5); G.poly(g, [[-9, -4], [9, -4], [12, 8], [-12, 8]], '#fff', 2.5); G.fillRR(g, -30, 28, 60, 10, 3, '#ff8a2a', 4); }
  });

  /* ================= BACKGROUNDS ================= */
  M.look.setAll({
    st_street: { tod: 'morning', indoor: false, floor: 444, live: ['pl', 'cl', 'btn'], lightX: 300, vig: .2 },
    st_building: { tod: 'day', indoor: false, floor: 440, live: ['elder'], vig: .2 },
    st_alley: { tod: 'evening', indoor: false, floor: 436, live: ['cat'], vig: .34 },
    st_shops: { tod: 'morning', indoor: false, floor: 430, live: ['shopkeeper', 'officer', 'stranger'], vig: .2 },
    st_block: { tod: 'day', indoor: false, floor: 430, live: ['hole', 'sapling', 'soil', 'watered', 'grown', 'clean', 'litter'], vig: .2 }
  });
  const GROUND = (g, y, c1, c2) => { RK.sidewalk(g, y, 540, c1, c2); };
  /* --- the crossing street. flags: pl 'red'|'green'|'blink'; cl 'green'|'yellow'|'red'; btn bool --- */
  R.st_street = function (g, t, s) {
    CUR = s; const S = s.state;
    sky(g, 0, 0, 300);
    [[0, 110, 150, 150, '#ffd9b0'], [150, 80, 130, 180, '#c9e4f8'], [280, 120, 170, 140, '#f9c9d4'], [450, 90, 140, 170, '#ffe9a8'], [590, 105, 160, 155, '#d6ecc8'], [750, 70, 210, 190, '#e0d4f5']].forEach(b => building(g, b[0], b[1], b[2], b[3], b[4], '#6fa8d6', true));
    RK.sidewalk(g, 250, 296, '#ece2cc', '#d4c8ae'); g.fillStyle = 'rgba(40,20,5,.2)'; g.fillRect(0, 248, 960, 5);
    tree(g, 120, 262, .8); tree(g, 820, 262, .8); lamp(g, 300, 262, .8); lamp(g, 690, 262, .8);
    RK.road(g, 296, 444, { dy: -4 });
    RK.sidewalk(g, 444, 540, '#e0d4bc', '#c7b99c'); g.fillStyle = 'rgba(40,20,5,.25)'; g.fillRect(0, 440, 960, 8);
    for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(40,40,60,.2)'; g.fillRect(392, 306 + i * 15.5, 176, 9); G.fillRR(g, 392, 304 + i * 15.5, 176, 9, 1.5, '#fff', 0); }
    G.amb(s, { k: 'glow', x: 300, y: 146, r: 40, col: '255,230,150', a: .3, z: 'top' }); G.amb(s, { k: 'glow', x: 690, y: 146, r: 40, col: '255,230,150', a: .3, z: 'top' });
    G.live(g, s, (g, t) => {
      const blink = S.pl === 'blink' && Math.floor(t * 4) % 2 === 0;
      A.draw(g, 'st_pedlight', 290, 404, 110, { green: S.pl === 'green' || (S.pl === 'blink' && !blink) });
      A.draw(g, 'st_light', 670, 262, 110, { c: S.cl || 'green' });
      A.draw(g, 'st_pbutton', 212, 424, 80, { on: !!S.btn });
      A.draw(g, 'st_zsign', 820, 222, 70);
      if (S.btn) G.sparkle(g, 212, 376, 9 + Math.sin(t * 6) * 3, '#fff6a8', .9);
    });
  };

  /* --- neighbour's building. flags: door (open), hideBench --- */
  R.st_building = function (g, t, s) {
    CUR = s; const S = s.state;
    RK.sky(g, s, 'day', 300, { seed: 3 });
    building(g, 540, 40, 420, 380, '#f9d7b8', '#6fa8d6', true); building(g, 0, 70, 180, 350, '#cfe6f6', '#e8a0a0', true);
    G.ao(g, 190, 80, 360, 350); rr(g, 190, 80, 360, 350, 6, '#ffe9b8', 4); RK.building(g, 190, 80, 360, 170, '#ffe9b8', { cols: 4, rows: 2, ww: 80, wh: 70 });
    rr(g, 290, 250, 150, 180, 8, '#a0693a', 5); rr(g, 302, 262, 126, 168, 4, '#6a4326', 3.5); rr(g, 308, 268, 54, 156, 3, 'rgba(255,220,170,.15)', 2); G.circ(g, 410, 350, 6, '#ffd23c', 2.5); rr(g, 276, 232, 178, 18, 6, '#c8935a', 4); sign(g, 296, 196, 138, 'عمارة ٧', '#2fa09a');
    for (let i = 0; i < 3; i++) rr(g, 270 - i * 14, 394 + i * 14, 190 + i * 28, 14, 3, ['#e4d9c4', '#d6c9ae', '#c6b799'][i], 2.5);
    RK.sidewalk(g, 440, 540, '#e4d9c4', '#cbbd9f');
    tree(g, 70, 440, 1.1); [[600, 440], [880, 440]].forEach(p => { A.draw(g, 'plant', p[0], p[1] - 30, 80); });
    rr(g, 650, 390, 190, 16, 5, '#b97b4a', 4); rr(g, 650, 356, 190, 22, 5, '#c8935a', 4); [662, 820].forEach(x => rr(g, x, 404, 10, 34, 2, '#8a5a3a', 3));
    rr(g, 468, 330, 60, 80, 4, '#9aa0b5', 4); [0, 1].forEach(r => [0, 1].forEach(c => rr(g, 474 + c * 26, 338 + r * 34, 22, 28, 2, '#d5dbe8', 2.5)));
    G.amb(s, { k: 'leaves', x0: 20, x1: 940, y0: 100, y1: 440, n: 4, cols: ['#8fd16a', '#c8e080'], z: 'top', seed: 4 });
    G.live(g, s, g => { if (S.elder) { const e = S.elder; A.draw(g, 'st_oldman', e.x, e.y, e.s || 190); } });
  };

  /* --- alley with bins (cat world). flags: showCat, kittens n --- */
  R.st_alley = function (g, t, s) {
    CUR = s; const S = s.state;
    RK.wall(g, 436, '#dba27c', '#c58760', { pattern: 'brick', crown: false, baseCol: '#b9a08a' });
    G.fillRR(g, 90, 40, 120, 150, 6, '#fff7e8', 3); g.fillStyle = G.lin(g, 0, 50, 0, 180, ['#3a4a7a', '#7c8cc0']); G.rr(g, 98, 48, 104, 134, 3); g.fill(); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(104, 180); g.lineTo(136, 48); g.lineTo(156, 48); g.lineTo(124, 180); g.fill(); G.line(g, 150, 48, 150, 182, 4, '#fff7e8'); G.line(g, 98, 115, 202, 115, 4, '#fff7e8'); rr(g, 76, 190, 148, 12, 3, '#8a5a3a', 3.5);
    rr(g, 700, 60, 18, 380, 4, '#9aa0b5', 3.5); [100, 200, 300].forEach(y => G.fillRR(g, 696, y, 26, 8, 2, '#7f869b', 1.5));
    rr(g, 780, 120, 130, 120, 6, '#6a8ab0', 4.5); G.text(g, 'عيادة', 845, 150, { size: 26, color: '#fff', stroke: OL, sw: 4 });
    RK.floor(g, 436, '#a39789', '#7f746a', { kind: 'stone', line: 'rgba(0,0,0,.2)' });
    rr(g, 590, 350, 80, 80, 4, '#c8935a', 4.5); [0, 1].forEach(i => G.line(g, 596, 366 + i * 26, 664, 366 + i * 26, 3)); rr(g, 600, 296, 62, 54, 4, '#d9a66e', 4.5);
    A.draw(g, 'st_bin:green', 300, 392, 130); A.draw(g, 'st_bin:grey', 410, 400, 120);
    A.draw(g, 'st_car:blue', 140, 380, 230); g.fillStyle = G.lin(g, 0, 404, 0, 436, ['rgba(20,8,0,.6)', 'rgba(20,8,0,.25)']); g.fillRect(52, 404, 176, 32);
    G.amb(s, { k: 'glow', x: 150, y: 120, r: 160, col: '140,160,255', a: .22, z: 'top' }); G.amb(s, { k: 'steam', x: 705, y: 440, sc: 1.4, n: 3, z: 'mid' });
    G.live(g, s, (g, t) => {
      if (S.food) A.draw(g, 'st_bowl:food', 520, 440, 60);
      if (S.water) A.draw(g, 'st_bowl:water', 610, 442, 60);
      if (S.cat) { const c = S.cat; g.save(); g.translate(c.x, c.y); A.draw(g, 'st_kitten:orange', 0, Math.sin(t * 2) * 1.5, c.s || 130); g.restore(); }
    });
  };

  /* --- shop street. flags: stranger {x,y}, police bool --- */
  R.st_shops = function (g, t, s) {
    CUR = s; const S = s.state;
    sky(g, 0, 0, 300);
    building(g, 0, 30, 960, 130, '#f6d4b6', '#6fa8d6', true);
    [[20, 'بقالة', '#5cc96b'], [260, 'صيدلية', '#4aa8e8'], [500, 'مخبز', '#ff8a2a']].forEach(sh => {
      G.ao(g, sh[0], 170, 220, 260); rr(g, sh[0], 170, 220, 260, 6, '#fff3d6', 4); sign(g, sh[0] + 30, 142, 160, sh[1], sh[2]); awning(g, sh[0] + 4, 184, 212, sh[2], '#fff');
      rr(g, sh[0] + 20, 226, 180, 140, 6, '#cfeaf8', 3.5); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(sh[0] + 30, 366); g.lineTo(sh[0] + 70, 226); g.lineTo(sh[0] + 100, 226); g.lineTo(sh[0] + 60, 366); g.fill(); G.line(g, sh[0] + 110, 226, sh[0] + 110, 366, 3.5); rr(g, sh[0] + 20, 366, 180, 64, 3, '#c8935a', 4);
    });
    A.draw(g, 'apple', 62, 392, 36); A.draw(g, 'orange', 112, 394, 34); A.draw(g, 'tomato', 162, 392, 34);
    A.draw(g, 'bread', 560, 396, 44); A.draw(g, 'bread', 620, 396, 40);
    G.ao(g, 760, 220, 180, 210); rr(g, 760, 220, 180, 210, 8, '#e8f0ff', 4); rr(g, 750, 200, 200, 26, 8, '#2b3a67', 4); sign(g, 790, 244, 100, 'شرطة', '#2b3a67'); rr(g, 790, 292, 100, 138, 6, '#9ed0f5', 3.5); G.line(g, 840, 292, 840, 430, 3.5);
    RK.sidewalk(g, 430, 540, '#e4d9c4', '#cbbd9f'); g.fillStyle = 'rgba(40,20,5,.2)'; g.fillRect(0, 428, 960, 6);
    G.amb(s, { k: 'blink', x: 850, y: 208, r: 4, col: '#4a8dff', glow: '120,170,255', period: .9, z: 'mid' });
    G.live(g, s, (g, t) => {
      if (S.shopkeeper) A.draw(g, 'st_fig:shop', 150, 350, 140);
      if (S.officer) A.draw(g, 'st_fig:police', 840, 365, 150);
      if (S.stranger) { const q = S.stranger; A.draw(g, 'st_fig:stranger', q.x, q.y + Math.sin(t * 2) * 2, 160); }
    });
  };

  /* --- the neighbourhood block. flags: hole, sapling, soil, watered, grown, clean --- */
  R.st_block = function (g, t, s) {
    CUR = s; const S = s.state;
    sky(g, 0, 0, 300);
    [[0, 100, 170, 330, '#ffd9b0'], [170, 60, 150, 370, '#c9e4f8'], [330, 120, 160, 310, '#f9c9d4'], [640, 70, 150, 360, '#d6ecc8'], [800, 100, 170, 330, '#e0d4f5']].forEach(b => building(g, b[0], b[1], b[2], b[3], b[4], '#6fa8d6', true));
    RK.sidewalk(g, 430, 540, '#e4d9c4', '#cbbd9f'); g.fillStyle = 'rgba(40,20,5,.2)'; g.fillRect(0, 428, 960, 6);
    rr(g, 500, 372, 130, 54, 20, '#7fd68a', 3.5); 
    tree(g, 70, 430, 1.1); lamp(g, 740, 430, .9); A.draw(g, 'plant', 900, 410, 80);
    G.amb(s, { k: 'birds', y: 90, n: 3, speed: 30, sc: 1, seed: 9 });
    G.live(g, s, (g, t) => {
      const px = 565, py = 408;
      if (S.hole && !S.soil) { G.ell(g, px, py, 38, 12, '#4a2e1c', 3.5); G.ell(g, px, py - 2, 30, 8, '#2a170b', 0); }
      if (S.sapling && !S.grown) { A.draw(g, 'st_sapling', px, py - 16 - (S.watered ? 10 : 0), S.watered ? 78 : 64); }
      if (S.soil && !S.grown) { A.draw(g, 'st_soil', px, py + 6, 52); if (S.sapling) A.draw(g, 'st_sapling', px, py - 24 - (S.watered ? 10 : 0), S.watered ? 80 : 66); }
      if (S.grown) { A.draw(g, 'st_tree', px, py - 40, 150 + Math.sin(t * 1.5) * 2, { fruit: true }); for (let i = 0; i < 4; i++) G.sparkle(g, px + Math.sin(t * 2 + i * 1.7) * 70, py - 120 + Math.cos(t * 1.7 + i) * 30, 6 + i % 3, '#fff6a8', .8); }
      if (S.clean) { A.draw(g, 'st_flower', 440, 405, 40); A.draw(g, 'st_flower', 700, 408, 36); }
      if (S.litter) S.litter.forEach(l => { if (!l.gone) A.draw(g, l.art, l.x, l.y, l.s || 46); });
    });
  };
})();
