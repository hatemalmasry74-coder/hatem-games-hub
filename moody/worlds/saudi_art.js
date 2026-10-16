/* Moody & Aboody - worlds/saudi_art.js : props + backgrounds of WORLD 8 "السفر لبابا في السعودية". Props are prefixed saudi_.
   Backgrounds (Moody.rooms): saudiHome, saudiAirport (state.kind: hall | security | passport | belt | arrivals ; state.abha = Abha look),
   saudiCabin (state.belts, state.seated), saudiSky (state.prog 0..1), saudiRoad (state.speed, state.fog, state.scroll), saudiCable (state.prog),
   saudiPeak (state.cold), saudiDinner (state.night).
   Everything is canvas cartoon art, no photos.  Asiri look = stone towers in ochre layers with slate bands + white-painted window frames, white minarets, green terraces, mist. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {};
  const rr = G.fillRR, S = M.saudi = M.saudi || {};
  const PC = { red: '#ef5350', blue: '#4a8dff', purple: '#8a6bd6', pink: '#ff6f91', green: '#3fb36b', orange: '#ff8a2a', teal: '#1fb5a6', yellow: '#ffc93c', gray: '#9ea4ab', navy: '#2b3a67' };
  S.colors = PC;
  const ST = { stone: '#cfa66d', stoneD: '#a67c4a', slate: '#5f5851', white: '#fffaf0', terra: '#c46b3a', wood: '#7a4a2a', dark: '#4a2e22' };
  const nz = (x, s) => Math.sin(x + s) * .5 + Math.sin(x * 2.3 + s * 1.7) * .3 + Math.sin(x * 4.1 + s * 2.9) * .2;
  const ar = (S0, t, sp) => { const dt = Math.max(0, Math.min(.1, t - (S0._t == null ? t : S0._t))); S0._t = t; S0.scroll = (S0.scroll || 0) + dt * (S0.speed == null ? 40 : S0.speed) * (sp == null ? 1 : sp); return S0.scroll; };

  /* ------------------------------------------------------------ shared drawing helpers */
  function winAsiri(g, x, y, s, lw) {
    lw = lw == null ? 2 : lw;
    rr(g, x - 5 * s, y, 10 * s, 15 * s, 1.5 * s, ST.white, lw); rr(g, x - 3 * s, y + 3 * s, 6 * s, 11 * s, 1, ST.dark, 0);
    G.poly(g, [[x - 6.5 * s, y], [x, y - 5 * s], [x + 6.5 * s, y]], ST.white, lw);
    G.line(g, x, y + 3 * s, x, y + 14 * s, 1.4 * s, ST.white);
  }
  /* traditional Asiri stone tower: layered ochre stone with slate bands, white-painted windows, white triangle parapet */
  function tower(g, x, y, w, n, o) {
    o = o || {}; const fh = o.fh || 30, h = n * fh, tw = w * .9, lw = o.lw == null ? 3.5 : o.lw, c1 = o.c1 || ST.stone, c2 = o.c2 || ST.stoneD;
    g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - tw / 2, y - h); g.lineTo(x + tw / 2, y - h); g.lineTo(x + w / 2, y); g.closePath(); G.fs(g, c1, lw);
    g.save(); g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x - tw / 2, y - h); g.lineTo(x + tw / 2, y - h); g.lineTo(x + w / 2, y); g.closePath(); g.clip();
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x - w / 2, y - h, w * .22, h);
    g.fillStyle = 'rgba(70,40,10,.14)'; g.fillRect(x + w * .3, y - h, w * .3, h);
    for (let i = 0; i <= n; i++) { const yy = y - i * fh; g.fillStyle = o.slate || ST.slate; g.fillRect(x - w / 2 - 2, yy - 3, w + 4, 4); if (i < n) { g.fillStyle = 'rgba(80,50,20,.22)'; g.fillRect(x - w / 2, yy - fh * .5 - 1, w, 2); } }
    g.restore();
    const cnt = Math.max(1, Math.round(w / 26)), ws = (o.ws || 1) * fh / 30;
    if (!o.nowin) for (let i = 0; i < n; i++) for (let j = 0; j < cnt; j++) { if (i === 0 && o.door && j === Math.floor(cnt / 2)) continue; winAsiri(g, x - w / 2 + (j + .5) * w / cnt, y - (i + 1) * fh + fh * .26, ws, lw > 2 ? 2 : 1); }
    if (o.door) { const dx = x - w / 2 + (Math.floor(cnt / 2) + .5) * w / cnt; g.beginPath(); g.moveTo(dx - 7, y); g.lineTo(dx - 7, y - 20); g.quadraticCurveTo(dx, y - 28, dx + 7, y - 20); g.lineTo(dx + 7, y); g.closePath(); G.fs(g, ST.wood, 2.5); }
    // white parapet: row of triangles
    const tn = Math.max(3, Math.round(tw / 14)); for (let k = 0; k < tn; k++) { const px = x - tw / 2 + (k + .5) * tw / tn; G.poly(g, [[px - tw / tn * .5, y - h], [px, y - h - 9 * ws], [px + tw / tn * .5, y - h]], ST.white, lw > 2 ? 2 : 1); }
    G.line(g, x - tw / 2 - 1, y - h, x + tw / 2 + 1, y - h, lw > 2 ? 3 : 1.5);
  }
  function minaret(g, x, y, h, s, lw) {
    s = s || 1; lw = lw == null ? 3 : lw; const w = 14 * s;
    g.beginPath(); g.moveTo(x - w / 2 - 2 * s, y); g.lineTo(x - w / 2, y - h); g.lineTo(x + w / 2, y - h); g.lineTo(x + w / 2 + 2 * s, y); g.closePath(); G.fs(g, ST.white, lw);
    g.fillStyle = 'rgba(120,100,70,.18)'; g.fillRect(x + w * .1, y - h, w * .4, h);
    [.55, .8].forEach(k => { rr(g, x - w * .8, y - h * k - 3 * s, w * 1.6, 6 * s, 2 * s, ST.white, lw > 2 ? 2.4 : 1.2); });
    [.2, .45, .7].forEach(k => rr(g, x - 2 * s, y - h * k, 4 * s, 9 * s, 2 * s, '#4a8a6a', 0));
    g.beginPath(); g.arc(x, y - h, w * .55, Math.PI, 0); G.fs(g, ST.white, lw > 2 ? 2.4 : 1.2); G.line(g, x, y - h - w * .55, x, y - h - w * 1.3, lw > 2 ? 2.4 : 1.2); G.circ(g, x, y - h - w * 1.35, 2 * s, '#e0b23c', lw > 2 ? 1.5 : 0);
  }
  function ridge(g, base, amp, k, seed, scroll, fill, lw, bump) {
    g.beginPath(); g.moveTo(-20, 560);
    for (let x = -20; x <= 980; x += 10) { let y = base - amp * (.55 + .45 * nz((x + scroll) * k, seed)); if (bump) { const d = (x - bump[0]) / bump[1]; y -= bump[2] * Math.exp(-d * d); } g.lineTo(x, y); }
    g.lineTo(980, 560); g.closePath(); if (lw) G.fs(g, fill, lw); else { g.fillStyle = fill; g.fill(); }
  }
  function ridgeY(x, base, amp, k, seed, scroll, bump) { let y = base - amp * (.55 + .45 * nz((x + scroll) * k, seed)); if (bump) { const d = (x - bump[0]) / bump[1]; y -= bump[2] * Math.exp(-d * d); } return y; }
  function mist(g, t, y, ry, a, sp, seed) {
    g.save(); g.fillStyle = 'rgba(255,255,255,' + a + ')';
    for (let i = 0; i < 7; i++) { const x = ((i * 230 + t * sp + seed * 90) % 1500) - 270; g.beginPath(); g.ellipse(x, y + Math.sin(t * .4 + i + seed) * 6, 190, ry, 0, 0, 6.2832); g.fill(); g.beginPath(); g.ellipse(x + 120, y + ry * .5, 130, ry * .7, 0, 0, 6.2832); g.fill(); }
    g.restore();
  }
  function terraces(g, x0, x1, ytop, rows, rh, scroll, k, seed, lw) {
    for (let r = 0; r < rows; r++) {
      const y0 = ytop + r * rh, cols = ['#7fca62', '#5db856', '#8bd36a', '#49a64a'], c = cols[(r + (seed | 0)) % 4];
      g.beginPath(); g.moveTo(x0, y0 + rh + 40); for (let x = x0; x <= x1; x += 12) g.lineTo(x, y0 + Math.sin((x + scroll) * k + r * 1.7 + seed) * 5 + Math.sin((x + scroll) * k * 2.3 + r) * 3); g.lineTo(x1, y0 + rh + 40); g.closePath(); G.fs(g, c, lw == null ? 3 : lw);
      if (lw !== 0) { g.save(); g.strokeStyle = 'rgba(40,100,40,.45)'; g.lineWidth = 2; for (let x = x0 + 8; x < x1; x += 22) { const yy = y0 + 12 + Math.sin((x + scroll) * k + r * 1.7 + seed) * 5; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 8, yy + 5); g.stroke(); } g.restore(); }
      g.fillStyle = ST.stoneD; g.beginPath(); g.moveTo(x0, y0 + rh + 40); for (let x = x0; x <= x1; x += 12) g.lineTo(x, y0 + rh + 40 - 6 - 0 * x); g.lineTo(x1, y0 + rh + 40); g.closePath();
    }
  }
  function tree(g, x, y, s, lw) { lw = lw == null ? 3 : lw; G.fillRR(g, x - 2.5 * s, y - 14 * s, 5 * s, 16 * s, 2, '#7a4a2a', lw); [[0, -24, 13], [-9, -17, 10], [9, -17, 10], [0, -34, 9]].forEach(c => G.circ(g, x + c[0] * s, y + c[1] * s, c[2] * s, '#3f8f4a', lw)); G.circ(g, x - 3 * s, y - 28 * s, 5 * s, '#5db65f', 0); }
  function village(g, y, x0, x1, seed, scale, scroll, o) {
    o = o || {}; const step = 74 * scale; let i = 0;
    for (let x = x0 - ((scroll % step) + step) % step - step; x < x1 + step; x += step, i++) {
      const idx = Math.floor((x + scroll) / step), r = Math.abs(Math.sin(idx * 12.9 + seed) * 43758.5) % 1; if (r < .22) continue;
      const w = (34 + r * 26) * scale, n = 2 + Math.floor(r * 3.2), by = y + Math.sin(idx * 2.1 + seed) * 8 * scale;
      if (r > .86 && o.minaret !== false) minaret(g, x + 6, by, 92 * scale, scale * .95, o.lw); else tower(g, x + r * 14 * scale, by, w, n, Object.assign({ fh: 28 * scale, lw: o.lw, nowin: o.nowin, door: r > .5 && scale > .8 }, o.col || {}));
    }
  }
  function sunGlow(g, x, y, r, a) { const gr = g.createRadialGradient(x, y, 4, x, y, r); gr.addColorStop(0, 'rgba(255,248,200,' + a + ')'); gr.addColorStop(1, 'rgba(255,248,200,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, r * 2, r * 2); }
  S.h = { tower, minaret, ridge, mist, terraces, tree, village, winAsiri, nz };

  /* ------------------------------------------------------------ props */
  const stripeAt = (g, x, w, c) => { g.fillStyle = c; g.fillRect(x, -34, w, 70); };
  A.registerAll({
    saudi_suitcase(g, o) {
      const col = PC[(o.args && o.args[0]) || 'red'] || '#ef5350', pat = (o.args && o.args[1]) || 'plain', hi = G.shade(col, .5), lo = G.shade(col, -.25);
      g.beginPath(); g.moveTo(-13, -30); g.lineTo(-13, -41); g.quadraticCurveTo(-13, -45, -9, -45); g.lineTo(9, -45); g.quadraticCurveTo(13, -45, 13, -41); g.lineTo(13, -30); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); g.lineWidth = 2.5; g.strokeStyle = '#d5dbe8'; g.stroke();
      [-20, 20].forEach(x => G.circ(g, x, 40, 5.5, '#3a3f55', 3));
      G.fillRR(g, -33, -32, 66, 70, 11, col, 4.5);
      g.save(); G.rr(g, -33, -32, 66, 70, 11); g.clip();
      if (pat === 'stripe') { [-20, -4, 12].forEach(x => stripeAt(g, x, 8, hi)); }
      else if (pat === 'dots') { for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) G.circ(g, -20 + i * 20, -20 + j * 17, 4.2, hi, 0); }
      else if (pat === 'star') { G.star(g, -10, -10, 13, hi, 0); G.star(g, 12, 14, 11, hi, 0); }
      else if (pat === 'zig') { for (let r = 0; r < 3; r++) { g.beginPath(); g.moveTo(-34, -14 + r * 22); for (let k = 0; k <= 6; k++) g.lineTo(-34 + k * 11.4, -14 + r * 22 + (k % 2 ? 7 : -3)); g.lineWidth = 4.5; g.strokeStyle = hi; g.stroke(); } }
      else if (pat === 'band') { g.fillStyle = hi; g.fillRect(-34, -8, 68, 14); G.line(g, -34, -8, 34, -8, 2, lo); G.line(g, -34, 6, 34, 6, 2, lo); }
      g.fillStyle = 'rgba(255,255,255,.22)'; g.fillRect(-33, -32, 9, 70); g.restore();
      G.fillRR(g, -33, -32, 66, 70, 11, null, 4.5); G.line(g, -33, 16, 33, 16, 2.5, lo); G.fillRR(g, -9, 17, 18, 8, 3, '#d9a84a', 2.5);
    },
    saudi_passport(g, o) {
      const c = (o.args && PC[o.args[0]]) || '#8b2346'; G.fillRR(g, -28, -38, 56, 76, 6, c, 4.5); G.fillRR(g, -28, -38, 10, 76, 5, G.shade(c, -.25), 3);
      G.circ(g, 4, -8, 14, '#f0c445', 3); G.star(g, 4, -8, 9, '#fff3c4', 1.5); G.line(g, -2, 16, 10, 16, 3, '#f0c445'); G.line(g, 0, 24, 8, 24, 3, '#f0c445');
    },
    saudi_ticket(g) { G.fillRR(g, -40, -22, 80, 44, 6, '#fff', 4.5); G.fillRR(g, -40, -22, 80, 12, 4, '#4a8dff', 3.5); G.line(g, 14, -10, 14, 22, 3, '#c9c4d6'); A.draw(g, 'saudi_plane', -14, 4, 34); [-6, 6].forEach(y => G.line(g, 20, y + 6, 34, y + 6, 3, '#b9b0a0')); },
    saudi_plane(g) {
      g.beginPath(); g.moveTo(-44, 0); g.quadraticCurveTo(-44, -14, -26, -14); g.lineTo(26, -12); g.quadraticCurveTo(46, -8, 48, 2); g.quadraticCurveTo(40, 12, 20, 12); g.lineTo(-26, 12); g.quadraticCurveTo(-44, 12, -44, 0); G.fs(g, '#fff', 4.5);
      G.poly(g, [[-30, -12], [-42, -34], [-30, -34], [-14, -12]], '#4a8dff', 4); G.poly(g, [[-4, 6], [-24, 34], [-10, 34], [14, 6]], '#dfe6f0', 4); G.poly(g, [[-4, -10], [-24, -34], [-10, -34], [14, -10]], '#cfd8e6', 4);
      [-14, -2, 10, 22].forEach(x => G.circ(g, x, -3, 3.2, '#8fd6ff', 2)); G.fillRR(g, 30, -8, 12, 8, 3, '#8fd6ff', 2.5);
    },
    saudi_stamp(g) { G.fillRR(g, -10, -44, 20, 30, 10, '#a0643a', 4.5); G.fillRR(g, -26, -16, 52, 14, 5, '#4a8dff', 4.5); G.fillRR(g, -28, -4, 56, 12, 3, '#2f6fe0', 4); G.fillRR(g, -24, 8, 48, 8, 2, '#ef5350', 2.5); },
    saudi_stampmark(g, o) { const c = (o.args && PC[o.args[0]]) || '#2f6fe0'; g.save(); g.rotate(-.15); g.globalAlpha = .9; G.circ(g, 0, 0, 34, null, 4, c); G.circ(g, 0, 0, 26, null, 2.5, c); A.draw(g, 'saudi_plane', 0, -2, 36); G.line(g, -22, 16, 22, 16, 3, c); g.restore(); },
    saudi_coat(g, o) { const c = (o.args && PC[o.args[0]]) || '#2b7a78'; G.poly(g, [[-18, -36], [18, -36], [42, -10], [36, 14], [24, 8], [24, 42], [-24, 42], [-24, 8], [-36, 14], [-42, -10]], c, 4.5); rr(g, -20, -42, 40, 14, 7, '#fff', 3.5); G.line(g, 0, -28, 0, 42, 3.5); [-8, 8, 24].forEach(y => G.circ(g, 6, y, 3.2, '#ffd23c', 2)); rr(g, -22, 14, 14, 12, 3, G.shade(c, -.2), 2.5); },
    saudi_sweater(g, o) { const c = (o.args && PC[o.args[0]]) || '#ff8a2a'; G.poly(g, [[-16, -36], [16, -36], [42, -8], [36, 22], [22, 16], [22, 40], [-22, 40], [-22, 16], [-36, 22], [-42, -8]], c, 4.5); rr(g, -17, -40, 34, 10, 5, G.shade(c, -.2), 3); [-14, 0, 14].forEach(y => G.line(g, -22, y + 12, 22, y + 12, 2.5, 'rgba(255,255,255,.4)')); G.star(g, 0, 4, 9, '#fff', 0); },
    saudi_scarf(g) { g.beginPath(); g.moveTo(-34, -20); g.quadraticCurveTo(0, 10, 34, -20); g.lineTo(34, -6); g.quadraticCurveTo(0, 26, -34, -6); g.closePath(); G.fs(g, '#ef5350', 4.5); G.fillRR(g, 14, -8, 18, 48, 4, '#ef5350', 4.5); [4, 14, 24, 34].forEach(y => G.line(g, 14, y, 32, y, 3, '#fff')); },
    saudi_swim(g) { G.poly(g, [[-30, -22], [30, -22], [34, 8], [14, 30], [4, 8], [-4, 8], [-14, 30], [-34, 8]], '#1fb5a6', 4.5); G.line(g, -30, -12, 30, -12, 3, '#fff'); [[-18, 4], [18, 4]].forEach(p => G.circ(g, p[0], p[1], 4, '#ffd23c', 2)); },
    saudi_shorts(g) { G.poly(g, [[-30, -30], [30, -30], [34, 14], [6, 14], [0, -4], [-6, 14], [-34, 14]], '#ffb84a', 4.5); G.line(g, -30, -20, 30, -20, 3.5); },
    saudi_sandals(g) { [-1, 1].forEach(s => { G.ell(g, s * 22, 6, 12, 32, '#e0b070', 4.5); G.line(g, s * 22 - 10, -2, s * 22 + 10, -2, 5, '#ef5350'); G.line(g, s * 22 - 10, 12, s * 22 + 10, 12, 5, '#ef5350'); }); },
    saudi_sunhat(g) { G.ell(g, 0, 14, 46, 13, '#f0c46a', 4); g.beginPath(); g.ellipse(0, 8, 26, 28, 0, Math.PI, 0); G.fs(g, '#f6d68a', 4); G.fillRR(g, -26, 2, 52, 11, 3, '#ef5350', 3); },
    saudi_belt(g) { G.fillRR(g, -44, -8, 88, 16, 6, '#7a4a2a', 4.5); G.fillRR(g, -12, -13, 24, 26, 4, '#d9d2c0', 4); G.fillRR(g, -5, -6, 10, 12, 2, '#9aa0b5', 2); [20, 28, 36].forEach(x => G.circ(g, x, 0, 2, '#3a2a1e', 0)); },
    saudi_phone(g) { G.fillRR(g, -20, -38, 40, 76, 9, '#3a3f55', 4.5); G.fillRR(g, -16, -30, 32, 56, 3, '#6fd0ff', 2.5); G.circ(g, 0, 31, 3.5, '#9aa0b5', 0); G.star(g, 0, -4, 9, '#ffd23c', 1.5); },
    saudi_watch(g) { G.fillRR(g, -10, -42, 20, 84, 4, '#4a4a55', 4); G.circ(g, 0, 0, 22, '#cfd6e6', 4.5); G.circ(g, 0, 0, 16, '#fff', 2.5); G.line(g, 0, 0, 0, -10, 3); G.line(g, 0, 0, 8, 4, 3); },
    saudi_tray(g) { G.poly(g, [[-44, -8], [44, -8], [38, 24], [-38, 24]], '#cfd6e6', 4.5); G.poly(g, [[-38, -4], [38, -4], [34, 18], [-34, 18]], '#9aa8c0', 0); G.fillRR(g, -44, -14, 88, 8, 4, '#e8edf7', 3.5); },
    saudi_scale(g) { G.fillRR(g, -38, 10, 76, 22, 6, '#6e7791', 4.5); G.fillRR(g, -30, 14, 60, 5, 2, '#9aa8c0', 0); G.circ(g, 0, -12, 26, '#fff', 4.5); G.circ(g, 0, -12, 19, '#eaf3ff', 2.5); G.line(g, 0, -12, 10, -22, 3.5, '#ef5350'); for (let i = 0; i < 7; i++) { const a = Math.PI + i * Math.PI / 6; G.line(g, Math.cos(a) * 15, -12 + Math.sin(a) * 15, Math.cos(a) * 18, -12 + Math.sin(a) * 18, 2); } },
    saudi_cloud(g, o) {
      const k = (o.args && o.args[0]) || 'plain';
      if (k === 'rabbit') { G.ell(g, -12, -30, 7, 18, '#fff', 3.5, null, -.1); G.ell(g, 8, -32, 7, 18, '#fff', 3.5, null, .1); G.ell(g, -4, 6, 30, 22, '#fff', 4); G.circ(g, 16, -2, 16, '#fff', 4); G.circ(g, -34, 10, 8, '#fff', 3.5); G.circ(g, 12, 0, 2.5, OL, 0); G.circ(g, 24, 2, 2, '#ff8fb1', 0); G.ell(g, -4, 8, 24, 14, '#fff', 0); }
      else if (k === 'heart') { G.heart(g, 0, -2, 40, '#fff', 4.5); G.heart(g, -6, -8, 18, 'rgba(210,235,255,.8)', 0); }
      else if (k === 'fish') { G.poly(g, [[22, 0], [46, -20], [46, 20]], '#fff', 4); G.ell(g, -4, 0, 32, 22, '#fff', 4.5); G.circ(g, -22, -4, 3.2, OL, 0); g.beginPath(); g.arc(-26, 6, 6, .2, 2.2); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke(); }
      else { [[0, 0, 26], [28, 6, 20], [-28, 8, 18], [8, -14, 20]].forEach(c => G.circ(g, c[0], c[1], c[2], '#fff', 4)); [[0, 0, 24], [28, 6, 18], [-28, 8, 16], [8, -14, 18]].forEach(c => G.circ(g, c[0], c[1], c[2], '#fff', 0)); }
    },
    saudi_officer(g, o) {
      const w = o.args && o.args[0] === 'w';
      G.fillRR(g, -26, 12, 52, 34, 14, '#3a4a7a', 4); G.poly(g, [[-8, 12], [0, 26], [8, 12]], '#fff', 2.5);
      G.ell(g, 0, -6, 24, 27, '#d9a070', 4); g.beginPath(); g.ellipse(0, -26, 27, 12, 0, Math.PI, 0); G.fs(g, '#3a4a7a', 4); G.fillRR(g, -28, -30, 56, 9, 4, '#3a4a7a', 3.5); G.fillRR(g, -9, -42, 18, 12, 4, '#e0b23c', 2.5);
      [-9, 9].forEach(x => { G.ell(g, x, -6, 4.2, 5.2, '#fff', 1.6); G.circ(g, x, -5.5, 2.6, '#3a2013', 0); });
      if (!w) { g.beginPath(); g.moveTo(-12, 6); g.quadraticCurveTo(0, 0, 12, 6); g.quadraticCurveTo(0, 12, -12, 6); G.fs(g, '#2e1b10', 2.5); }
      g.beginPath(); g.arc(0, 9, 8, .3, Math.PI - .3); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke();
    },
    saudi_person(g, o) {
      const a = o.args || [], c = PC[a[0]] || '#4a8dff', kind = a[1] || 'a', sk = ['#e8b389', '#d29566', '#c98f5f'][(a[2] | 0) % 3];
      G.fillRR(g, -13, 14, 11, 30, 5, '#3b3f50', 3.5); G.fillRR(g, 2, 14, 11, 30, 5, '#3b3f50', 3.5); G.fillRR(g, -15, 40, 14, 7, 3, '#2a2320', 2.5); G.fillRR(g, 1, 40, 14, 7, 3, '#2a2320', 2.5);
      if (kind === 'b') G.poly(g, [[-17, -14], [17, -14], [24, 32], [-24, 32]], c, 4); else G.fillRR(g, -18, -16, 36, 40, 10, kind === 'c' ? '#fff' : c, 4);
      G.fillRR(g, -26, -12, 10, 26, 5, sk, 3); G.fillRR(g, 16, -12, 10, 26, 5, sk, 3);
      G.circ(g, 0, -30, 16, sk, 4);
      if (kind === 'b') { g.beginPath(); g.arc(0, -30, 19, Math.PI * .85, Math.PI * .15 + Math.PI * 2); G.fs(g, '#fff0f4', 3.5); G.circ(g, 0, -30, 14, sk, 3); }
      else if (kind === 'c') { g.beginPath(); g.moveTo(-19, -26); g.quadraticCurveTo(-18, -50, 0, -50); g.quadraticCurveTo(18, -50, 19, -26); g.lineTo(23, -6); g.lineTo(-23, -6); g.closePath(); G.fs(g, '#fff', 3.5); G.circ(g, 0, -28, 12, sk, 3); G.line(g, -17, -41, 17, -41, 4, '#3a3a45'); }
      else { g.beginPath(); g.arc(0, -34, 16, Math.PI, 0); G.fs(g, '#3a2a1e', 3.5); }
      [-5.5, 5.5].forEach(x => G.circ(g, x, -29, 2.2, '#2a1a10', 0)); g.beginPath(); g.arc(0, -25, 4.5, .3, Math.PI - .3); g.lineWidth = 2; g.strokeStyle = OL; g.stroke();
    },
    saudi_van(g, o) {
      const faces = (o.faces || []);
      g.beginPath(); g.moveTo(-48, 20); g.lineTo(-48, -6); g.quadraticCurveTo(-46, -14, -36, -14); g.lineTo(-22, -34); g.lineTo(20, -34); g.quadraticCurveTo(30, -34, 34, -20); g.lineTo(44, -14); g.quadraticCurveTo(52, -10, 52, 0); g.lineTo(52, 20); g.closePath(); G.fs(g, '#f6f1e6', 4.5);
      g.beginPath(); g.moveTo(-24, -12); g.lineTo(-14, -30); g.lineTo(18, -30); g.quadraticCurveTo(26, -30, 28, -20); g.lineTo(34, -12); g.closePath(); G.fs(g, '#9fd8f4', 3.5);
      [-6, 14].forEach(x => G.line(g, x, -30, x, -12, 3)); G.line(g, -48, 4, 52, 4, 2.5, '#d8cfb8'); G.fillRR(g, 40, -4, 10, 8, 3, '#ffe14d', 2.5); G.fillRR(g, -49, -2, 5, 10, 2, '#ef5350', 2);
      faces.forEach((f, i) => { M.chars.portrait(g, f, -17 + i * 12.5, -21, 7.2); });
      [-30, 30].forEach(x => { G.circ(g, x, 22, 11, '#3a3a45', 4); G.circ(g, x, 22, 5, '#cfd6e6', 0); });
    },
    saudi_cablecar(g) { G.line(g, 0, -50, 0, -28, 4); G.fillRR(g, -10, -34, 20, 8, 3, '#4a4a55', 3); G.fillRR(g, -38, -26, 76, 62, 12, '#ef5350', 4.5); G.fillRR(g, -30, -16, 60, 30, 6, '#bfe8ff', 3.5); G.line(g, 0, -16, 0, 14, 3); G.fillRR(g, -38, 16, 76, 8, 3, '#fff', 3); G.line(g, -38, 28, 38, 28, 3, 'rgba(0,0,0,.2)'); },
    saudi_tower(g) { tower(g, 0, 40, 50, 3, { fh: 26, lw: 3.5, door: true }); },
    saudi_minaret(g) { minaret(g, 0, 44, 84, 1, 3.5); },
    saudi_terrace(g) { g.save(); G.rr(g, -44, -36, 88, 80, 14); g.clip(); g.fillStyle = '#bfe4f2'; g.fillRect(-44, -36, 88, 80); terraces(g, -44, 44, -14, 4, 16, 0, .12, 1, 2.5); g.restore(); G.fillRR(g, -44, -36, 88, 80, 14, null, 4); },
    saudi_juniper(g) { tree(g, 0, 40, 1.6, 4); },
    saudi_mist(g) { [[0, 4, 24], [26, 10, 18], [-26, 10, 16], [8, -12, 18]].forEach(c => G.circ(g, c[0], c[1], c[2], '#e3eef4', 3.5)); [-14, 0, 14].forEach((y, i) => G.line(g, -36 + i * 4, 30 + y * .4 + i * 2, 36 - i * 4, 30 + y * .4 + i * 2, 3.5, '#9fbccb')); },
    saudi_eagle(g) { g.beginPath(); g.moveTo(-46, -6); g.quadraticCurveTo(-26, -34, -4, -8); g.quadraticCurveTo(0, -2, 4, -8); g.quadraticCurveTo(26, -34, 46, -6); g.quadraticCurveTo(24, -14, 8, 6); g.lineTo(0, 22); g.lineTo(-8, 6); g.quadraticCurveTo(-24, -14, -46, -6); G.fs(g, '#8a6a4a', 4.5); G.circ(g, 0, -4, 7, '#f6f1e6', 3); G.poly(g, [[-2, -2], [5, 0], [-1, 5]], '#ffc93c', 2); },
    saudi_goat(g) { G.ell(g, 0, 8, 28, 16, '#f6f1e6', 4); [-18, -8, 10, 20].forEach(x => G.fillRR(g, x - 3, 14, 6, 22, 2, '#f6f1e6', 3)); G.ell(g, 28, -8, 12, 11, '#f6f1e6', 4); G.poly(g, [[24, -16], [20, -34], [30, -18]], '#8a7a5a', 3); G.circ(g, 31, -9, 1.8, OL, 0); G.poly(g, [[34, -2], [38, 8], [30, 4]], '#e8e0cc', 2.5); },
    saudi_flagpost(g) { G.line(g, -10, 44, -10, -40, 5); g.beginPath(); g.moveTo(-8, -38); g.quadraticCurveTo(14, -48, 26, -34); g.quadraticCurveTo(14, -24, -8, -22); g.closePath(); G.fs(g, '#ffc93c', 4); G.circ(g, -10, -42, 4, '#8a5a3a', 2.5); },
    saudi_thermo(g, o) { const lv = o.args && o.args[0] === 'hot' ? 1 : .25; G.fillRR(g, -9, -42, 18, 70, 9, '#fff', 4.5); G.circ(g, 0, 32, 15, '#fff', 4.5); G.circ(g, 0, 32, 10, '#ef5350', 0); G.fillRR(g, -4, 28 - 62 * lv, 8, 62 * lv, 3, '#ef5350', 0); [-30, -16, -2, 12].forEach(y => G.line(g, 9, y, 17, y, 2.5)); },
    saudi_gift(g, o) { const c = (o.args && PC[o.args[0]]) || '#ff6f91', r = (o.args && PC[o.args[1]]) || '#ffd23c'; G.fillRR(g, -34, -14, 68, 52, 6, c, 4.5); G.fillRR(g, -38, -26, 76, 18, 5, G.shade(c, -.12), 4.5); G.fillRR(g, -7, -26, 14, 64, 0, r, 3); G.ell(g, -12, -34, 12, 9, r, 3.5, null, -.4); G.ell(g, 12, -34, 12, 9, r, 3.5, null, .4); G.circ(g, 0, -28, 5, r, 3); },
    saudi_honey(g) { G.fillRR(g, -26, -22, 52, 60, 14, '#f0a82a', 4.5); G.fillRR(g, -26, -22, 52, 60, 14, 'rgba(255,230,150,.35)', 0); G.fillRR(g, -22, -34, 44, 14, 5, '#8a5a3a', 4); G.fillRR(g, -20, -2, 40, 26, 4, '#fff7e3', 3); A.draw(g, 'sparkles', 0, 11, 20); G.ell(g, -14, -10, 4, 9, 'rgba(255,255,255,.5)', 0); },
    saudi_dallah(g) { G.poly(g, [[-18, 8], [18, 8], [24, 38], [-24, 38]], '#e0b23c', 4.5); G.fillRR(g, -10, -4, 20, 14, 4, '#e0b23c', 4); g.beginPath(); g.moveTo(8, -2); g.quadraticCurveTo(32, -34, 34, -46); g.lineTo(30, -50); g.quadraticCurveTo(24, -22, 0, -10); g.closePath(); G.fs(g, '#e0b23c', 4); g.beginPath(); g.arc(-28, 18, 14, -1.2, 1.4); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); G.circ(g, 0, -10, 4, '#ef5350', 2); },
    saudi_kabsa(g) { G.ell(g, 0, 18, 44, 14, '#d9d2c0', 4.5); g.beginPath(); g.ellipse(0, 10, 38, 22, 0, Math.PI, 0); G.fs(g, '#e8b85a', 4.5); G.ell(g, 0, 14, 40, 10, '#e8b85a', 0); [[-20, 0], [0, -6], [18, 2], [-8, 6]].forEach(p => G.ell(g, p[0], p[1], 12, 8, '#a8602a', 3, null, .3)); [-24, -8, 10, 26].forEach(x => G.circ(g, x, -10, 2.5, '#ef5350', 1.5)); [-14, 14].forEach(x => G.circ(g, x, -14, 2.2, '#5cc96b', 1.5)); },
    saudi_juice(g) { G.poly(g, [[-18, -28], [18, -28], [14, 36], [-14, 36]], 'rgba(255,255,255,.9)', 4.5); G.poly(g, [[-16, -6], [16, -6], [13, 36], [-13, 36]], '#ff9a2a', 0); G.poly(g, [[-18, -28], [18, -28], [14, 36], [-14, 36]], null, 4.5); G.line(g, 6, -44, 2, 6, 5); G.circ(g, 14, -26, 9, '#ff9a2a', 3.5); },
    saudi_basbousa(g) { G.poly(g, [[-36, 6], [0, -16], [36, 6], [0, 28]], '#f0b84a', 4.5); G.poly(g, [[-36, 6], [0, 28], [0, 38], [-36, 16]], '#d99a2a', 4); G.poly(g, [[36, 6], [0, 28], [0, 38], [36, 16]], '#c78a22', 4); [[-14, 4], [0, -4], [14, 4], [0, 12]].forEach(p => G.ell(g, p[0], p[1], 3, 5, '#fff3c4', 1.5)); },
    saudi_sketch(g) { G.fillRR(g, -32, -36, 64, 72, 6, '#ff6f91', 4.5); G.fillRR(g, -24, -28, 48, 46, 3, '#fff', 3); G.circ(g, -6, -10, 7, '#ffd23c', 2.5); G.poly(g, [[-18, 14], [4, -8], [20, 14]], '#5cc96b', 2.5); G.line(g, 20, 22, 30, 32, 5, '#4a8dff'); },
    saudi_toycable(g) { G.line(g, -44, -30, 44, -6, 3.5, '#6e6e7a'); G.fillRR(g, -10, -26, 22, 8, 2, '#4a4a55', 3); G.fillRR(g, -20, -20, 40, 36, 8, '#ef5350', 4); G.fillRR(g, -14, -12, 28, 16, 3, '#bfe8ff', 3); },
    saudi_lights(g) { G.circ(g, -14, 0, 18, '#ffe14d', 4.5); G.circ(g, -14, 0, 9, '#fff9c4', 0); for (let i = -2; i <= 2; i++) G.line(g, 8, i * 11, 34, i * 14, 4, '#ffd23c'); },
    saudi_slow(g) { G.circ(g, 0, 0, 38, '#fff', 5); G.circ(g, 0, 0, 38, null, 6, '#ef5350'); G.text(g, '٤٠', 0, 2, { size: 38, color: '#2b3a67' }); },
    saudi_seatbelt(g) { G.poly(g, [[-30, -40], [-12, -40], [30, 36], [12, 36]], '#4a4a55', 4); G.fillRR(g, 4, 18, 26, 22, 4, '#ef5350', 4); G.circ(g, 17, 29, 4, '#fff', 2); },
    saudi_mountain(g) { G.poly(g, [[-46, 36], [-14, -30], [4, -6], [22, -38], [48, 36]], '#8fa8bf', 4.5); G.poly(g, [[22, -38], [14, -20], [22, -24], [28, -18], [32, -26]], '#fff', 2.5); G.poly(g, [[-14, -30], [-22, -14], [-14, -18], [-8, -12]], '#fff', 2.5); },
    saudi_pass(g) { G.fillRR(g, -38, -26, 76, 52, 6, '#fff', 4.5); G.circ(g, -16, -2, 14, '#d9a070', 3); G.fillRR(g, 4, -14, 26, 5, 2, '#9ea4ab', 0); G.fillRR(g, 4, -4, 26, 5, 2, '#9ea4ab', 0); G.fillRR(g, 4, 6, 18, 5, 2, '#9ea4ab', 0); },
    saudi_heartpin(g) { G.heart(g, 0, 0, 36, '#ff5a7a', 5); A.draw(g, 'saudi_plane', 0, -2, 38); },
    saudi_traveler(g) { G.circ(g, 0, 0, 44, '#fff7e3', 4.5); G.circ(g, 0, 0, 36, null, 3, '#d8453a'); A.draw(g, 'saudi_plane', 0, -14, 52); G.star(g, 0, 22, 12, '#ffc93c', 3); G.star(g, -24, 18, 7, '#ffc93c', 2); G.star(g, 24, 18, 7, '#ffc93c', 2); },
    saudi_q(g) { G.circ(g, 0, 0, 38, '#8a6bd6', 4.5); G.text(g, '؟', 0, 3, { size: 52, color: '#fff' }); }
  });

  /* ------------------------------------------------------------ backgrounds */
  /* ---- Cairo skyline view for windows ---- */
  function cairoSky(g, x, y, w, h, t, night) {
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    g.fillStyle = night ? G.lin(g, 0, y, 0, y + h, ['#1b2552', '#3a4b86']) : G.lin(g, 0, y, 0, y + h, ['#8fd6ff', '#ffe9c4']); g.fillRect(x, y, w, h);
    if (!night) { G.sun(g, x + w * .78, y + h * .3, 12, t); }
    // pyramids far
    G.poly(g, [[x + w * .1, y + h * .8], [x + w * .26, y + h * .46], [x + w * .42, y + h * .8]], '#e8c585', 2.5); G.poly(g, [[x + w * .3, y + h * .8], [x + w * .42, y + h * .56], [x + w * .54, y + h * .8]], '#dfb872', 2.5);
    // buildings + cairo tower + dome mosque
    [[.55, .45, 12], [.64, .36, 14], [.74, .5, 12], [.86, .4, 14]].forEach(b => rr(g, x + w * b[0], y + h * b[1] + 4, b[2] + 6, h * (1 - b[1]), 1, night ? '#59679c' : '#cdbfa8', 2));
    rr(g, x + w * .5 - 2, y + h * .3, 4, h * .6, 1, '#e8d7b5', 2); G.ell(g, x + w * .5, y + h * .3, 8, 6, '#e8d7b5', 2);
    g.beginPath(); g.arc(x + w * .93, y + h * .66, 10, Math.PI, 0); G.fs(g, night ? '#7a89bf' : '#b9d2c0', 2); rr(g, x + w * .93 - 10, y + h * .66, 20, h * .3, 1, night ? '#59679c' : '#cdbfa8', 2);
    g.restore();
  }
  function wallPanel(g, c1, c2, y1) { g.fillStyle = G.lin(g, 0, 0, 0, y1, [c1, c2]); g.fillRect(0, 0, 960, y1); }

  R.saudiHome = function (g, t, s) {
    const S0 = s.state;
    wallPanel(g, '#ffe7c9', '#ffd8b0', 430);
    g.fillStyle = 'rgba(255,255,255,.12)'; for (let i = 0; i < 12; i++) g.fillRect(i * 90, 0, 40, 430);
    // floor
    g.fillStyle = G.lin(g, 0, 430, 0, 540, ['#d9a66e', '#b57e4a']); g.fillRect(0, 430, 960, 110); G.line(g, 0, 430, 960, 430, 4);
    g.strokeStyle = 'rgba(90,50,20,.18)'; g.lineWidth = 2; for (let i = 0; i < 12; i++) { g.beginPath(); g.moveTo(i * 90 - 20, 430); g.lineTo(i * 150 - 300, 540); g.stroke(); }
    // window with Cairo skyline
    const wx = 380, wy = 110, ww = 200, wh = 170; cairoSky(g, wx, wy, ww, wh, t, S0.night); g.lineWidth = 6; g.strokeStyle = OL; g.strokeRect(wx, wy, ww, wh); G.line(g, wx + ww / 2, wy, wx + ww / 2, wy + wh, 5); G.line(g, wx, wy + wh / 2, wx + ww, wy + wh / 2, 5);
    [[wx - 36, '#ff9ec0'], [wx + ww - 6, '#ff9ec0']].forEach(c => { g.beginPath(); g.moveTo(c[0], wy - 12); g.lineTo(c[0] + 42, wy - 12); g.quadraticCurveTo(c[0] + 54, wy + wh / 2, c[0] + 42, wy + wh + 10); g.lineTo(c[0], wy + wh + 10); g.closePath(); G.fs(g, c[1], 3.5); });
    G.line(g, wx - 48, wy - 12, wx + ww + 48, wy - 12, 7, '#8a5a3a');
    // high shelf (needs a tall hero) + wardrobe
    rr(g, 700, 150, 200, 12, 4, '#b97b4a', 4); rr(g, 690, 162, 14, 30, 2, '#b97b4a', 3.5); rr(g, 886, 162, 14, 30, 2, '#b97b4a', 3.5);
    A.draw(g, 'book', 730, 128, 44); A.draw(g, 'plant', 866, 126, 46);
    // sofa with a narrow gap beneath
    A.draw(g, 'sofa', 160, 388, 190); g.fillStyle = 'rgba(60,30,10,.32)'; g.fillRect(70, 424, 180, 8);
    // rug
    G.ell(g, 480, 482, 250, 34, '#ff9ec0', 4); G.ell(g, 480, 482, 190, 24, '#ffd0e0', 3); G.ell(g, 480, 482, 110, 14, '#ff9ec0', 0);
    // posters
    rr(g, 230, 110, 100, 120, 6, '#fff', 4); A.draw(g, 'saudi_plane', 280, 150, 70); G.line(g, 245, 195, 315, 195, 4, '#9fd8f4'); G.line(g, 245, 208, 300, 208, 4, '#9fd8f4');
    rr(g, 80, 120, 110, 80, 6, '#fff', 4); A.draw(g, 'saudi_mountain', 135, 160, 62);
    // open suitcase (big) + state: how many items in
    const sc = S0.suitcase || 'open';
    if (sc !== 'none') {
      const cx = S0.caseX == null ? 190 : S0.caseX, cy = S0.caseY == null ? 380 : S0.caseY;
      if (sc === 'closed') { A.draw(g, 'saudi_suitcase:teal:band', cx, cy + 20, 130); }
      else { G.fillRR(g, cx - 80, cy - 50, 160, 40, 10, '#1fb5a6', 4.5); G.fillRR(g, cx - 70, cy - 42, 140, 24, 6, '#d6f3ee', 2.5); G.fillRR(g, cx - 86, cy - 14, 172, 62, 12, '#1fb5a6', 4.5); G.fillRR(g, cx - 74, cy - 4, 148, 44, 8, '#fff3d6', 3); G.fillRR(g, cx - 14, cy - 18, 28, 8, 3, '#d9a84a', 2.5); }
    }
    if (S0.dim) { g.fillStyle = 'rgba(20,30,70,' + S0.dim + ')'; g.fillRect(0, 0, 960, 540); }
  };

  /* ---- AIRPORT : kinds hall | security | passport | belt | arrivals ; state.abha = Abha airport look ---- */
  function asiriBand(g, y, h, x0, x1, t) {
    // Al-Qatt Al-Asiri inspired geometric band (colourful triangles + diamonds)
    const cols = ['#d8453a', '#f0b429', '#2f9e6a', '#2f6fe0', '#fff'];
    rr(g, x0, y, x1 - x0, h, 0, '#fff7e3', 3);
    for (let x = x0 + 8, i = 0; x < x1 - 14; x += 26, i++) { G.poly(g, [[x, y + h - 4], [x + 13, y + 4], [x + 26, y + h - 4]], cols[i % 4], 2); G.poly(g, [[x + 13, y + 10], [x + 18, y + h / 2], [x + 13, y + h - 10], [x + 8, y + h / 2]], cols[(i + 2) % 4], 1.5); }
  }
  R.saudiAirport = function (g, t, s) {
    const S0 = s.state, kind = S0.kind || 'hall', abha = !!S0.abha;
    // ceiling + wall
    g.fillStyle = G.lin(g, 0, 0, 0, 380, abha ? ['#f3e6d0', '#fbf3e4'] : ['#e6edf6', '#f6f9fc']); g.fillRect(0, 0, 960, 380);
    for (let i = 0; i < 7; i++) { rr(g, 40 + i * 140, 4, 100, 12, 6, '#fffbe0', 2.5); }
    // big window wall (left to centre)
    if (kind !== 'security' || true) {
      const wx = 40, wy = 100, ww = kind === 'hall' || kind === 'arrivals' ? 520 : 400, wh = 210;
      g.save(); g.beginPath(); g.rect(wx, wy, ww, wh); g.clip();
      if (abha) {
        g.fillStyle = G.lin(g, 0, wy, 0, wy + wh, ['#a9d6ee', '#eaf3f4']); g.fillRect(wx, wy, ww, wh);
        ridge(g, wy + 140, 50, .014, 3, 0, '#9fb6c9', 0); ridge(g, wy + 170, 36, .02, 1, 0, '#7fa08a', 0);
        village(g, wy + 190, wx, wx + ww, 7, .55, 0, { lw: 0, nowin: true, minaret: true }); mist(g, t, wy + 150, 14, .5, 6, 2);
      } else {
        g.fillStyle = G.lin(g, 0, wy, 0, wy + wh, ['#8fd6ff', '#e9f6ff']); g.fillRect(wx, wy, ww, wh); G.sun(g, wx + ww - 60, wy + 40, 12, t); G.cloud(g, wx + ((t * 8) % (ww + 80)) - 40, wy + 50, .7);
        g.fillStyle = '#c9ced6'; g.fillRect(wx, wy + 150, ww, 60); G.line(g, wx, wy + 150, wx + ww, wy + 150, 3);
      }
      // parked plane + taxiing one
      const px = wx + ((t * 22) % (ww + 200)) - 100; A.draw(g, 'saudi_plane', px, wy + 150, 90);
      A.draw(g, 'saudi_plane', wx + ww * .25, wy + 168, 70);
      g.restore();
      g.lineWidth = 6; g.strokeStyle = OL; g.strokeRect(wx, wy, ww, wh); for (let x = wx + ww / 4; x < wx + ww - 10; x += ww / 4) G.line(g, x, wy, x, wy + wh, 4);
    }
    // wall base & floor
    g.fillStyle = abha ? '#e9d8bd' : '#d5dde8'; g.fillRect(0, 312, 960, 118);
    if (abha) { asiriBand(g, 322, 28, 0, 960, t); }
    g.fillStyle = G.lin(g, 0, 430, 0, 540, abha ? ['#e8d4ae', '#d5bd8e'] : ['#dfe5ee', '#c2cddb']); g.fillRect(0, 430, 960, 110); G.line(g, 0, 430, 960, 430, 4);
    g.strokeStyle = 'rgba(100,110,140,.16)'; g.lineWidth = 2; for (let i = 0; i < 14; i++) { g.beginPath(); g.moveTo(i * 80 - 40, 430); g.lineTo(i * 160 - 480, 540); g.stroke(); }
    for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(0, 430 + i * i * 7); g.lineTo(960, 430 + i * i * 7); g.stroke(); }
    // signs hanging
    function sign(x, y, w, icon, txt, col) { G.line(g, x - w / 3, 20, x - w / 3, y, 3, '#6e7791'); G.line(g, x + w / 3, 20, x + w / 3, y, 3, '#6e7791'); rr(g, x - w / 2, y, w, 52, 10, col, 4.5); A.draw(g, icon, x - w / 2 + 28, y + 26, 38); G.text(g, txt, x + 20, y + 27, { size: 22, color: '#fff', stroke: 'rgba(0,0,0,.25)', sw: 3 }); }
    const nm = abha ? 'مطار أبها' : 'مطار القاهرة';
    if (kind === 'hall') {
      sign(790, 98, 250, 'saudi_ticket', 'تسجيل السفر', '#2f6fe0');
      // check-in counter
      rr(g, 640, 300, 290, 130, 8, '#fff', 4.5); rr(g, 640, 300, 290, 22, 6, '#4a8dff', 4); rr(g, 650, 330, 270, 8, 2, '#cfd6e6', 0);
      G.fillRR(g, 700, 252, 70, 50, 6, '#3a3f55', 4.5); G.fillRR(g, 706, 258, 58, 34, 3, S0.green ? '#7be08a' : '#ffb2a8', 2.5); if (S0.green) A.draw(g, 'check', 735, 275, 26); else G.text(g, '...', 735, 275, { size: 26, color: '#2b3a67' });
      A.draw(g, 'saudi_scale', 840, 284, 72);
      G.text(g, nm, 780, 311, { size: 17, color: '#fff' });
      // queue posts + tape
      const post = x => { G.ell(g, x, 470, 14, 5, 'rgba(40,40,60,.3)', 0); rr(g, x - 3, 412, 6, 58, 2, '#6e7791', 3); G.circ(g, x, 410, 6, '#e0b23c', 2.5); };
      [60, 220, 380, 540].forEach(post); [[60, 220], [220, 380], [380, 540]].forEach(p => { g.beginPath(); g.moveTo(p[0], 414); g.quadraticCurveTo((p[0] + p[1]) / 2, 436, p[1], 414); g.lineWidth = 5; g.strokeStyle = '#d8453a'; g.stroke(); });
    } else if (kind === 'security') {
      sign(660, 98, 280, 'saudi_tray', 'الفحص الأمني', '#d8453a');
      // x-ray tunnel + belt
      rr(g, 520, 270, 280, 110, 14, '#4a5470', 4.5); rr(g, 540, 292, 240, 68, 10, '#1f2740', 3); G.text(g, 'X', 660, 326, { size: 30, color: '#6fd0ff' });
      rr(g, 380, 388, 560, 30, 6, '#3a3f55', 4.5); for (let x = 390; x < 930; x += 20) G.line(g, x - ((t * 20) % 20), 392, x - ((t * 20) % 20) - 4, 414, 2, '#5b6485');
      // metal detector arch
      rr(g, 70, 190, 22, 240, 6, '#cfd6e6', 4.5); rr(g, 250, 190, 22, 240, 6, '#cfd6e6', 4.5); rr(g, 70, 180, 202, 24, 8, '#cfd6e6', 4.5); G.circ(g, 171, 192, 7, S0.green ? '#5cc96b' : '#ffb347', 2.5);
    } else if (kind === 'passport') {
      sign(725, 98, 280, 'saudi_pass', 'الجوازات', '#2b7a78');
      // booth with officer
      rr(g, 560, 180, 330, 250, 10, abha ? '#e9d8bd' : '#dfe8f0', 4.5); rr(g, 580, 200, 290, 130, 8, '#bfe8ff', 4); G.line(g, 725, 200, 725, 330, 4);
      A.draw(g, 'saudi_officer', 650, 280, 120); rr(g, 565, 330, 320, 100, 6, '#fff', 4.5); rr(g, 565, 330, 320, 16, 5, '#2b7a78', 4);
      if (abha) asiriBand(g, 354, 26, 575, 875, t);
      if (S0.stamped) { A.draw(g, 'saudi_stampmark:blue', S0.mx || 720, S0.my || 392, 70); }
    } else if (kind === 'belt') {
      sign(820, 98, 270, 'saudi_suitcase:blue:stripe', 'استلام الأمتعة', '#2f6fe0');
      // carousel belt (moving)
      rr(g, 50, 300, 860, 58, 24, '#3a3f55', 4.5); rr(g, 60, 308, 840, 42, 18, '#4f5875', 0); for (let x = 70; x < 900; x += 30) G.line(g, x + ((t * 40) % 30), 312, x + ((t * 40) % 30) - 6, 346, 2, '#69729a');
      rr(g, 50, 358, 860, 36, 8, '#8d94ab', 4.5);
    } else if (kind === 'arrivals') {
      sign(750, 98, 300, 'heartbig', 'القادمون', '#2f9e6a');
      // glass sliding doors
      rr(g, 600, 160, 300, 270, 8, '#bfe8ff', 4.5); G.line(g, 750, 160, 750, 430, 5); rr(g, 600, 160, 300, 18, 4, '#6e7791', 3.5);
      const o = Math.min(1, S0.doors || 0) * 38; g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(606 + 0, 180, 140 - o, 248); g.fillRect(754 + o, 180, 140 - o, 248);
      // welcome balloons
      [[580, 250, '#ff6f91'], [620, 230, '#ffd23c'], [545, 224, '#4a8dff']].forEach((b, i) => { const y = b[1] + Math.sin(t * 1.6 + i) * 4; G.line(g, b[0], y + 26, 585, 420, 1.8, '#9a8a7a'); G.ell(g, b[0], y, 17, 22, b[2], 3.5); });
      if (abha) asiriBand(g, 324, 28, 0, 960, t);
    }
    // soft light
    sunGlow(g, 300, 120, 360, .12);
  };

  /* ---- CABIN of the plane ---- */
  const SEATX = [190, 380, 570, 760];
  R.saudiCabin = function (g, t, s) {
    const S0 = s.state; g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#dfe8f2', '#c4d2e4']); g.fillRect(0, 0, 960, 540);
    // ceiling bins
    g.fillStyle = '#f4f7fb'; g.beginPath(); g.moveTo(0, 0); g.lineTo(960, 0); g.lineTo(960, 112); g.quadraticCurveTo(480, 150, 0, 112); g.closePath(); G.fs(g, '#f4f7fb', 4.5);
    for (let i = 0; i < 6; i++) { const x = 20 + i * 156; rr(g, x, 26, 140, 54, 14, '#e6edf6', 3.5); rr(g, x + 40, 62, 60, 8, 4, '#b8c4d8', 2.5); }
    // seat sign
    G.circ(g, 480, 126, 11, S0.belts >= 4 ? '#5cc96b' : (Math.sin(t * 6) > 0 ? '#ffd23c' : '#d9b94a'), 3); A.draw(g, 'saudi_seatbelt', 480, 126, 20);
    // wall + windows
    rr(g, 0, 150, 960, 150, 0, '#d2dceb', 0); G.line(g, 0, 150, 960, 150, 3);
    SEATX.forEach((x, i) => {
      const wx = x - 58, wy = 170, ww = 116, wh = 100;
      g.save(); G.rr(g, wx, wy, ww, wh, 44); g.clip(); g.fillStyle = G.lin(g, 0, wy, 0, wy + wh, ['#6fb9ee', '#d8f0ff']); g.fillRect(wx, wy, ww, wh);
      for (let k = 0; k < 2; k++) G.cloud(g, wx + (((t * (14 + k * 6)) + i * 70 + k * 90) % (ww + 100)) - 40, wy + 40 + k * 32, .5);
      g.restore(); G.fillRR(g, wx, wy, ww, wh, 44, null, 5); G.fillRR(g, wx - 8, wy - 8, ww + 16, wh + 16, 50, null, 3, '#b7c3d6');
    });
    // seats: headrests + backs
    const occ = S0.seated ? ['toota', 'nemo', 'moody', 'aboody'] : [];
    SEATX.forEach((x, i) => {
      rr(g, x - 74, 330, 148, 230, 30, '#3a6fd8', 4.5); rr(g, x - 54, 310, 108, 60, 22, '#5b8ae8', 4.5); rr(g, x - 44, 300, 88, 48, 16, '#fff', 3.5);
      if (occ[i]) { const bob = Math.sin(t * 1.4 + i) * 2; M.chars.portrait(g, occ[i], x, 292 + bob, 36); }
      // belt on lap
      const on = S0.b ? !!S0.b[i] : (S0.belts || 0) > i;
      rr(g, x - 66, 436, 132, 26, 8, '#2f5ab8', 3.5);
      if (on) { G.line(g, x - 62, 449, x + 62, 449, 8, '#4a4a55'); rr(g, x - 12, 439, 24, 20, 4, '#ef5350', 3.5); } else { G.line(g, x - 62, 449, x - 22, 449, 8, '#4a4a55'); G.line(g, x + 62, 449, x + 22, 449, 8, '#4a4a55'); }
    });
    if (S0.dim) { g.fillStyle = 'rgba(20,30,60,' + S0.dim + ')'; g.fillRect(0, 0, 960, 540); }
  };

  /* ---- SKY through the window (state.prog 0 Cairo .. 1 Abha) ---- */
  function groundFeatures(g, wx, wy, ww, wh, t, prog) {
    const gy = wy + wh * .72, sc = t * 20;
    const a1 = Math.max(0, 1 - Math.abs(prog - .1) * 5), a2 = Math.max(0, 1 - Math.abs(prog - .35) * 4), a3 = Math.max(0, 1 - Math.abs(prog - .56) * 4.2), a4 = Math.max(0, Math.min(1, (prog - .66) * 4));
    // base colour by progress
    const stops = [[0, [127, 199, 106]], [.18, [140, 190, 100]], [.3, [226, 200, 142]], [.45, [226, 205, 150]], [.55, [66, 160, 196]], [.65, [74, 164, 198]], [.8, [118, 156, 112]], [1, [104, 148, 98]]];
    let c = stops[0][1]; for (let i = 1; i < stops.length; i++) { if (prog <= stops[i][0]) { const k = (prog - stops[i - 1][0]) / (stops[i][0] - stops[i - 1][0]), a = stops[i - 1][1], b = stops[i][1]; c = a.map((v, j) => Math.round(v + (b[j] - v) * k)); break; } c = stops[i][1]; }
    g.fillStyle = 'rgb(' + c.join(',') + ')'; g.fillRect(wx, gy, ww, wh); G.line(g, wx, gy, wx + ww, gy, 2.5, 'rgba(60,60,80,.35)');
    if (a1 > 0) { g.save(); g.globalAlpha = a1; g.strokeStyle = '#4aa8e8'; g.lineWidth = 12; g.beginPath(); g.moveTo(wx - 20, gy + 40); for (let x = wx - 20; x <= wx + ww + 20; x += 20) g.lineTo(x, gy + 38 + Math.sin((x + sc) * .02) * 10); g.stroke(); [60, 160, 260, 360].forEach(x => { g.fillStyle = '#5fae56'; g.fillRect(wx + ((x - sc * .5) % ww + ww) % ww, gy + 8, 40, 14); }); g.restore(); }
    if (a2 > 0) { g.save(); g.globalAlpha = a2; g.fillStyle = '#d9b775'; for (let i = 0; i < 6; i++) { const x = wx + (((i * 170 - sc * .8) % (ww + 200)) + ww + 200) % (ww + 200) - 100; g.beginPath(); g.ellipse(x, gy + 28 + (i % 3) * 14, 70, 9, 0, 0, 6.3); g.fill(); } g.restore(); }
    if (a3 > 0) { g.save(); g.globalAlpha = a3; g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 3; for (let i = 0; i < 7; i++) { const y = gy + 10 + i * 10, x0 = wx + (((i * 130 + sc * (i % 2 ? 1 : .6)) % (ww + 120)) + ww + 120) % (ww + 120) - 100; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + 20, y - 5, x0 + 40, y); g.stroke(); } g.restore(); }
    if (a4 > 0) { g.save(); g.globalAlpha = a4; ridge(g, gy + 40, 46, .02, 4, sc * 2, '#8a8f5a', 3); ridge(g, gy + 66, 36, .03, 2, sc * 3, '#6f9a58', 3); terraces(g, wx, wx + ww, gy + 52, 3, 14, sc * 3, .03, 2, 2); g.restore(); }
  }
  R.saudiSky = function (g, t, s) {
    const S0 = s.state, prog = S0.prog || 0; g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#dfe8f2', '#b8c6da']); g.fillRect(0, 0, 960, 540);
    const wx = 90, wy = 108, ww = 780, wh = 290;
    g.save(); G.rr(g, wx, wy, ww, wh, 70); g.clip();
    g.fillStyle = G.lin(g, 0, wy, 0, wy + wh, [S0.dusk ? '#f8b070' : '#5fb2ee', S0.dusk ? '#ffe3b8' : '#d3eefd']); g.fillRect(wx, wy, ww, wh);
    G.sun(g, wx + 600, wy + 60, 22, t); sunGlow(g, wx + 600, wy + 60, 150, .5);
    groundFeatures(g, wx, wy, ww, wh, t, prog);
    // clouds parallax
    [[60, 90, 1.2, 28], [330, 150, .9, 38], [560, 70, 1.4, 22], [180, 230, .8, 50], [470, 240, 1.1, 44], [700, 160, 1, 34]].forEach((c, i) => { const x = wx + (((c[0] - t * c[3]) % (ww + 260)) + ww + 260) % (ww + 260) - 130; G.cloud(g, x, wy + c[1], c[2] * 1.4, .95); });
    // wing
    g.beginPath(); g.moveTo(wx - 10, wy + wh + 10); g.lineTo(wx + 40, wy + wh - 40 + Math.sin(t * 2) * 2); g.lineTo(wx + 420, wy + wh - 70 + Math.sin(t * 2) * 3); g.lineTo(wx + 470, wy + wh + 10); g.closePath(); G.fs(g, '#dfe6f0', 4.5);
    G.poly(g, [[wx + 400, wy + wh - 66], [wx + 438, wy + wh - 96], [wx + 446, wy + wh - 62]], '#ef5350', 3); G.circ(g, wx + 438, wy + wh - 96, 4, Math.sin(t * 8) > 0 ? '#ff6a6a' : '#fff', 1);
    g.restore(); G.fillRR(g, wx, wy, ww, wh, 70, null, 7); G.fillRR(g, wx - 12, wy - 12, ww + 24, wh + 24, 80, null, 4, '#b7c3d6');
    // shade handle
    rr(g, wx + ww / 2 - 40, wy - 22, 80, 12, 6, '#eef2f8', 3.5);
    // seats at the bottom with portraits
    SEATX.forEach((x, i) => { rr(g, x - 74, 428, 148, 140, 28, '#3a6fd8', 4.5); rr(g, x - 44, 410, 88, 40, 16, '#fff', 3.5); M.chars.portrait(g, ['toota', 'nemo', 'moody', 'aboody'][i], x, 408 + Math.sin(t * 1.4 + i) * 2, 30); });
  };

  /* ---- ROAD through the Abha mountains (parallax) ---- */
  R.saudiRoad = function (g, t, s) {
    const S0 = s.state, sc = ar(S0, t), fog = S0.fog == null ? .35 : S0.fog, dusk = S0.dusk || 0;
    g.fillStyle = G.lin(g, 0, 0, 0, 340, dusk ? ['#f4b97a', '#ffe9c8'] : ['#8fc8ea', '#e8f3f4']); g.fillRect(0, 0, 960, 560);
    sunGlow(g, 780, 130, 260, .55); G.circ(g, 780, 130, 26, '#fff4c0', 0);
    [[100, 80, 1.1, 5], [420, 60, .9, 7], [650, 110, 1.3, 4]].forEach(c => { const x = (((c[0] - t * c[3]) % 1200) + 1200) % 1200 - 120; G.cloud(g, x, c[1], c[2], .8); });
    const bump = [((560 - sc * .03) % 1400 + 1400) % 1400, 70, 70];
    ridge(g, 250, 90, .006, 1, sc * .04, '#b8c9db', 0, bump);
    ridge(g, 270, 70, .009, 5, sc * .1, '#9fb7c6', 0);
    mist(g, t, 250, 18, .35 + fog * .25, 5, 1);
    // far village on ridge
    village(g, 286, -40, 1000, 3, .5, sc * .22, { lw: 1.4, nowin: true });
    ridge(g, 300, 54, .012, 9, sc * .25, '#86b08e', 0);
    // terraces mid
    g.save(); terraces(g, -10, 970, 292, 4, 18, sc * .35, .015, 2, 2.2); g.restore();
    village(g, 330, -40, 1000, 11, .78, sc * .45, { lw: 2.6 });
    mist(g, t, 312, 20, .28 + fog * .5, 9, 3);
    // near slope with trees + towers
    ridge(g, 352, 30, .02, 4, sc * .7, '#5aa356', 3);
    for (let i = 0; i < 9; i++) { const x = (((i * 190 - sc * .7) % 1500) + 1500) % 1500 - 200; tree(g, x, 346 - Math.abs(nz((x + sc * .7) * .02, 4)) * 6, 1.2 + (i % 3) * .2, 3); }
    // road
    g.fillStyle = '#6e6a66'; g.fillRect(0, 372, 960, 60); G.line(g, 0, 372, 960, 372, 4); G.line(g, 0, 432, 960, 432, 4);
    g.fillStyle = '#fffaf0'; for (let x = -((sc * 1) % 90); x < 980; x += 90) g.fillRect(x, 400, 46, 6);
    g.fillStyle = '#8a8478'; g.fillRect(0, 432, 960, 120); g.fillStyle = 'rgba(0,0,0,.12)'; for (let x = -((sc * 1.3) % 70); x < 980; x += 70) g.fillRect(x, 448, 38, 5);
    // guard stones along the road edge
    for (let x = -((sc * 1.1) % 60); x < 980; x += 60) { rr(g, x, 360, 36, 14, 4, '#e8e0cc', 3); }
    // the family car
    const cx = S0.carX == null ? 430 : S0.carX, bob = Math.sin(t * 9) * (S0.speed > 5 ? 1.4 : 0);
    G.ell(g, cx, 424, 90, 9, 'rgba(0,0,0,.22)', 0);
    g.save(); g.translate(cx, 372 + bob); A.draw(g, 'saudi_van', 0, 0, 190, { faces: S0.faces === false ? [] : ['baba', 'toota', 'nemo', 'moody', 'aboody'] }); g.restore();
    if (S0.lights) { g.save(); g.fillStyle = 'rgba(255,240,150,.45)'; g.beginPath(); g.moveTo(cx + 92, 376); g.lineTo(cx + 300, 340); g.lineTo(cx + 300, 420); g.closePath(); g.fill(); g.restore(); }
    // foreground mist
    mist(g, t, 438, 20, fog * .5, 14, 5);
    g.fillStyle = 'rgba(240,248,250,' + fog * .14 + ')'; g.fillRect(0, 0, 960, 540);
  };

  /* ---- CABLE CAR over the valley (state.prog 0..1 along the line) ---- */
  R.saudiCable = function (g, t, s) {
    const S0 = s.state, prog = S0.prog || 0, fog = S0.fog == null ? .3 : S0.fog;
    g.fillStyle = G.lin(g, 0, 0, 0, 400, ['#8fc8ea', '#eaf4f4']); g.fillRect(0, 0, 960, 540); sunGlow(g, 190, 130, 250, .5); G.circ(g, 190, 130, 24, '#fff4c0', 0);
    [[500, 70, 1.2, 4], [800, 120, 1, 6]].forEach(c => { const x = (((c[0] - t * c[3]) % 1200) + 1200) % 1200 - 120; G.cloud(g, x, c[1], c[2], .85); });
    ridge(g, 250, 80, .007, 2, 0, '#b8c9db', 0, [700, 90, 80]); ridge(g, 285, 60, .01, 6, 0, '#97b2c4', 0);
    mist(g, t, 270, 16, .4, 6, 1);
    // far shore village
    village(g, 322, 520, 1000, 5, .7, 0, { lw: 2 });
    ridge(g, 350, 46, .013, 3, 40, '#6fae62', 3); terraces(g, -10, 970, 340, 3, 22, 0, .02, 3, 2.4);
    village(g, 392, -20, 420, 8, .9, 0, { lw: 3 });
    mist(g, t, 330, 22, .22 + fog * .4, 8, 2);
    // valley bottom trees
    ridge(g, 440, 24, .03, 7, 0, '#3f8f4a', 3.5); for (let i = 0; i < 10; i++) tree(g, 60 + i * 96, 458 + (i % 3) * 8, 1.5, 3.5);
    // cable line: from top-left (60,150) to bottom-right (880,300) gentle sag
    const P = k => { const x = 50 + k * 860, y = 150 + k * 140 + Math.sin(k * 3.14) * 24; return [x, y]; };
    g.beginPath(); for (let k = 0; k <= 1.001; k += .02) { const p = P(k); k === 0 ? g.moveTo(p[0], p[1]) : g.lineTo(p[0], p[1]); } g.lineWidth = 7; g.strokeStyle = OL; g.stroke(); g.lineWidth = 3; g.strokeStyle = '#8c93a6'; g.stroke();
    // pylons
    [.0, .5, 1].forEach(k => { const p = P(k); G.poly(g, [[p[0] - 8, p[1] + 280], [p[0] - 3, p[1] - 6], [p[0] + 3, p[1] - 6], [p[0] + 8, p[1] + 280]], '#9aa0b5', 4); G.line(g, p[0] - 16, p[1] - 2, p[0] + 16, p[1] - 2, 5); });
    // station boxes
    rr(g, 10, 120, 90, 56, 8, '#fff', 4.5); G.poly(g, [[0, 120], [55, 92], [110, 120]], '#c46b3a', 4.5); rr(g, 860, 280, 96, 60, 8, '#fff', 4.5); G.poly(g, [[850, 280], [908, 250], [966, 280]], '#c46b3a', 4.5);
    // the cabin
    const p = P(Math.max(0, Math.min(1, prog))); g.save(); g.translate(p[0], p[1] + 40); g.rotate(Math.sin(t * 1.6) * .02); A.draw(g, 'saudi_cablecar', 0, 0, 120); ['moody', 'aboody'].forEach((k, i) => { M.chars.portrait(g, k, -12 + i * 24, 6, 8.5); }); g.restore();
    // an opposing cabin
    const q = P(1 - Math.max(0, Math.min(1, prog))); g.save(); g.translate(q[0], q[1] + 40); A.draw(g, 'saudi_cablecar', 0, 0, 84); g.restore();
    mist(g, t, 410, 18, fog * .4, 12, 4);
  };

  /* ---- PEAK viewpoint above the clouds ---- */
  R.saudiPeak = function (g, t, s) {
    const S0 = s.state; g.fillStyle = G.lin(g, 0, 0, 0, 330, ['#6fb4ea', '#dff0fb']); g.fillRect(0, 0, 960, 560); sunGlow(g, 760, 120, 280, .6); G.sun(g, 760, 120, 24, t);
    ridge(g, 260, 80, .006, 8, 0, '#a9bfd6', 0); ridge(g, 290, 60, .011, 3, 70, '#8fabc2', 0);
    // sea of clouds below
    for (let k = 0; k < 3; k++) mist(g, t, 320 + k * 26, 30 + k * 6, .85 - k * .12, 6 + k * 3, k + 1);
    // mountain top in front
    g.beginPath(); g.moveTo(-10, 560); g.lineTo(-10, 360); g.quadraticCurveTo(160, 330, 330, 372); g.quadraticCurveTo(520, 340, 700, 380); g.quadraticCurveTo(860, 350, 980, 390); g.lineTo(980, 560); g.closePath(); G.fs(g, '#8d8a7a', 5);
    g.fillStyle = 'rgba(255,255,255,.14)'; g.fillRect(0, 372, 960, 8);
    // rock texture
    g.strokeStyle = 'rgba(60,50,40,.3)'; g.lineWidth = 3; [[80, 420, 150, 440], [300, 450, 400, 430], [560, 430, 660, 450], [800, 440, 900, 420]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.lineTo(l[2], l[3]); g.stroke(); });
    // railing
    G.line(g, 40, 384, 920, 396, 6); for (let x = 60; x < 930; x += 90) G.line(g, x, 384 + (x - 40) * .0136, x, 424 + (x - 40) * .0136, 5); G.line(g, 40, 406, 920, 418, 4);
    // stone viewpoint building + flag + sign
    tower(g, 880, 392, 80, 2, { fh: 40, lw: 3.5, door: true }); G.line(g, 880, 292, 880, 244, 4); g.beginPath(); g.moveTo(880, 246); g.quadraticCurveTo(900, 238, 916, 248); g.quadraticCurveTo(900, 260, 880, 258); g.closePath(); G.fs(g, '#2f9e6a', 3);
    rr(g, 620, 318, 180, 56, 8, '#fff', 4.5); G.line(g, 650, 374, 650, 404, 5); G.line(g, 770, 374, 770, 404, 5); G.text(g, 'جبال السودة', 710, 346, { size: 28, color: '#2b3a67' });
    if (S0.cold) { g.fillStyle = 'rgba(255,255,255,.8)'; for (let i = 0; i < 16; i++) { const x = (i * 97 + t * 14) % 980, y = (i * 53 + t * 20) % 380; g.beginPath(); g.arc(x, y, 2.6, 0, 6.3); g.fill(); } }
  };

  /* ---- DINNER with Baba in an Asiri majlis ---- */
  R.saudiDinner = function (g, t, s) {
    const S0 = s.state, night = !!S0.night;
    g.fillStyle = G.lin(g, 0, 0, 0, 430, night ? ['#f2d9aa', '#e7bf86'] : ['#f6e6c8', '#ecd2a2']); g.fillRect(0, 0, 960, 430);
    // wall: ochre with white painted bands and Asiri colourful frieze
    g.fillStyle = 'rgba(160,110,50,.12)'; for (let i = 0; i < 16; i++) g.fillRect(i * 64, 0, 30, 430);
    asiriBand(g, 126, 34, 0, 960, t); asiriBand(g, 290, 22, 0, 960, t);
    // two windows with white-painted frames & night/day view
    [[120, 160], [700, 160]].forEach(w => { const x = w[0], y = w[1], ww = 130, wh = 110; g.save(); g.beginPath(); g.rect(x, y, ww, wh); g.clip(); g.fillStyle = night ? G.lin(g, 0, y, 0, y + wh, ['#18224d', '#34457f']) : G.lin(g, 0, y, 0, y + wh, ['#8fd6ff', '#e7f6ff']); g.fillRect(x, y, ww, wh); if (night) { for (let i = 0; i < 9; i++) G.sparkle(g, x + 10 + (i * 37) % (ww - 14), y + 10 + (i * 29) % (wh - 20), 2.5 + i % 3, '#fff6a8', .5 + .4 * Math.sin(t * 2 + i)); A.draw(g, 'moon', x + ww - 36, y + 30, 38); ridge(g, y + 100, 30, .02, 3, 0, '#2c3a6a', 0); } else { ridge(g, y + 90, 36, .02, 3, 0, '#9fb7c6', 0); ridge(g, y + 106, 22, .03, 1, 0, '#6fae62', 0); } g.restore(); g.lineWidth = 5; g.strokeStyle = OL; g.strokeRect(x, y, ww, wh);
      rr(g, x - 12, y - 14, ww + 24, 14, 3, ST.white, 3.5); rr(g, x - 10, y + wh, ww + 20, 12, 3, ST.white, 3.5); rr(g, x - 12, y - 14, 12, wh + 26, 3, ST.white, 3.5); rr(g, x + ww, y - 14, 12, wh + 26, 3, ST.white, 3.5); G.line(g, x + ww / 2, y, x + ww / 2, y + wh, 4); });
    // hanging lamps
    [300, 480, 660].forEach((x, i) => { G.line(g, x, 0, x, 70 + i % 2 * 8, 3); G.poly(g, [[x - 18, 100 + i % 2 * 8], [x + 18, 100 + i % 2 * 8], [x + 10, 72 + i % 2 * 8], [x - 10, 72 + i % 2 * 8]], '#e0a23c', 3.5); G.circ(g, x, 106 + i % 2 * 8, 6, '#fff3a0', 0); sunGlow(g, x, 110, 90, .35); });
    // floor + big rug
    g.fillStyle = G.lin(g, 0, 400, 0, 540, ['#b9855a', '#8f6038']); g.fillRect(0, 400, 960, 140); G.line(g, 0, 400, 960, 400, 4);
    G.ell(g, 480, 470, 440, 70, '#a8372f', 5); G.ell(g, 480, 470, 400, 60, '#c9483d', 3); G.ell(g, 480, 470, 330, 48, '#f0c445', 3); G.ell(g, 480, 470, 300, 42, '#a8372f', 0);
    for (let i = 0; i < 14; i++) { const a = i / 14 * 6.2832; G.poly(g, [[480 + Math.cos(a) * 270, 470 + Math.sin(a) * 36 - 5], [480 + Math.cos(a) * 270 + 7, 470 + Math.sin(a) * 36 + 5], [480 + Math.cos(a) * 270 - 7, 470 + Math.sin(a) * 36 + 5]], '#fff', 1.5); }
    // cushions along the wall
    [[110, '#2f9e6a'], [260, '#d8453a'], [700, '#2f6fe0'], [850, '#f0b429']].forEach(c => rr(g, c[0] - 56, 340, 112, 64, 18, c[1], 4.5));
    // low table with food
    g.save(); g.translate(150, 0); rr(g, 340, 392, 280, 22, 8, '#8a5a3a', 4.5); G.ell(g, 480, 392, 150, 20, '#a0643a', 4.5);
    A.draw(g, 'saudi_kabsa', 450, 378, 104); A.draw(g, 'dates', 540, 384, 46); A.draw(g, 'saudi_dallah', 380, 370, 54); A.draw(g, 'saudi_juice', 575, 370, 44); A.draw(g, 'saudi_basbousa', 500, 394, 42); g.restore();
    if (S0.dim) { g.fillStyle = 'rgba(20,20,60,' + S0.dim + ')'; g.fillRect(0, 0, 960, 540); }
  };
})();
