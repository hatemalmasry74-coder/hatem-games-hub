/* Moody & Aboody - engine/gfx.js
   Drawing helpers + the ART registry (every prop/icon/sticker/diary picture is an art function).
   Art functions draw inside a 100x100 box centred on (0,0): fn(g, o) - size is handled by M.art.draw. */
(function () {
  'use strict';
  const M = window.Moody, OL = M.OL, U = M.util;
  const G = M.gfx = {};

  G.shade = function (hex, amt) { // amt -1..1
    let c = hex.replace('#', ''); if (c.length === 3) c = c.split('').map(x => x + x).join('');
    const n = parseInt(c, 16); let r = n >> 16, gg = (n >> 8) & 255, b = n & 255;
    const f = v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt);
    return 'rgb(' + f(r) + ',' + f(gg) + ',' + f(b) + ')';
  };
  G.rr = function (g, x, y, w, h, r) { r = Math.min(r, w / 2, h / 2); g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath(); };
  /* fill + outline the current path */
  G.fs = function (g, fill, lw, stroke) { if (fill) { g.fillStyle = fill; g.fill(); } g.lineWidth = lw == null ? 3 : lw; g.strokeStyle = stroke || OL; if (g.lineWidth > 0) g.stroke(); };
  G.fillRR = (g, x, y, w, h, r, fill, lw, stroke) => { G.rr(g, x, y, w, h, r); G.fs(g, fill, lw, stroke); };
  G.circ = (g, x, y, r, fill, lw, stroke) => { g.beginPath(); g.arc(x, y, r, 0, 6.2832); G.fs(g, fill, lw, stroke); };
  G.ell = (g, x, y, rx, ry, fill, lw, stroke, rot) => { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, 6.2832); G.fs(g, fill, lw, stroke); };
  G.poly = (g, pts, fill, lw, stroke) => { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.closePath(); G.fs(g, fill, lw, stroke); };
  G.line = (g, x1, y1, x2, y2, w, col) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineWidth = w; g.strokeStyle = col || OL; g.stroke(); };
  G.starPath = (g, x, y, r, rot) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (rot || 0) + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  G.star = (g, x, y, r, fill, lw, rot) => { G.starPath(g, x, y, r, rot); G.fs(g, fill || '#ffc93c', lw == null ? 3 : lw); };
  G.heart = (g, x, y, s, fill, lw) => { g.beginPath(); g.moveTo(x, y + s * .9); g.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .7, y - s * 1.1, x, y - s * .35); g.bezierCurveTo(x + s * .7, y - s * 1.1, x + s * 1.6, y - s * .2, x, y + s * .9); G.fs(g, fill || '#ff5a7a', lw == null ? 3 : lw); };
  G.lin = (g, x0, y0, x1, y1, stops) => { const l = g.createLinearGradient(x0, y0, x1, y1); stops.forEach((c, i) => l.addColorStop(i / (stops.length - 1), c)); return l; };
  G.shadow = (g, x, y, rx, ry, a) => { g.fillStyle = 'rgba(60,30,10,' + (a == null ? .22 : a) + ')'; g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, 6.2832); g.fill(); };
  /* RTL canvas text */
  G.text = function (g, s, x, y, o) {
    o = o || {}; g.save(); g.direction = 'rtl'; g.textAlign = o.align || 'center'; g.textBaseline = o.base || 'middle';
    g.font = (o.weight || 'bold') + ' ' + (o.size || 28) + 'px ' + M.FONT;
    if (o.stroke) { g.lineWidth = o.sw || 5; g.strokeStyle = o.stroke; g.lineJoin = 'round'; g.strokeText(s, x, y); }
    g.fillStyle = o.color || M.pal.ink; g.fillText(s, x, y); g.restore();
  };
  G.cloud = (g, x, y, s, a) => { g.save(); g.globalAlpha = a == null ? .9 : a; g.fillStyle = '#fff'; g.beginPath(); [[0, 0, 26], [28, 6, 20], [-28, 8, 18], [10, -14, 20]].forEach(c => { g.moveTo(x + c[0] * s + c[2] * s, y + c[1] * s); g.arc(x + c[0] * s, y + c[1] * s, c[2] * s, 0, 6.2832); }); g.fill(); g.restore(); };
  G.sun = (g, x, y, r, t) => { g.save(); g.translate(x, y); g.rotate((t || 0) * .3); g.strokeStyle = '#ffd34d'; g.lineWidth = r * .16; g.lineCap = 'round'; for (let i = 0; i < 12; i++) { g.rotate(Math.PI / 6); g.beginPath(); g.moveTo(r * 1.25, 0); g.lineTo(r * 1.6, 0); g.stroke(); } g.restore(); G.circ(g, x, y, r, '#ffdf5e', 3); };
  G.sparkle = (g, x, y, r, col, a) => { g.save(); g.globalAlpha = a == null ? 1 : a; g.fillStyle = col || '#fff6a8'; g.beginPath(); g.moveTo(x, y - r); g.quadraticCurveTo(x, y, x + r, y); g.quadraticCurveTo(x, y, x, y + r); g.quadraticCurveTo(x, y, x - r, y); g.quadraticCurveTo(x, y, x, y - r); g.fill(); g.restore(); };

  /* ---------- art registry ---------- */
  const A = M.art = { fns: {}, cache: {} };
  A.register = (name, fn) => { A.fns[name] = fn; };
  A.registerAll = o => { for (const k in o) A.fns[k] = o[k]; };
  A.has = n => !!A.fns[String(n).split(':')[0]];
  /* names may carry args: 'shape:circle:red' -> fn 'shape' gets o.args=['circle','red'] */
  A.draw = function (g, name, x, y, s, o) {
    const parts = String(name).split(':'), fn = A.fns[parts[0]]; if (parts.length > 1) o = Object.assign({}, o, { args: parts.slice(1) }); g.save(); g.translate(x, y); const k = (s || 100) / 100; g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round';
    g.lineWidth = 3.5; g.strokeStyle = OL;
    if (fn) { try { fn(g, o || {}); } catch (e) { } } else { G.circ(g, 0, 0, 30, '#fff', 4); G.text(g, '?', 0, 2, { size: 40 }); }
    g.restore();
  };
  /* DOM canvas element showing an art (cached drawing, DPR aware) */
  A.el = function (name, px, o) {
    const c = document.createElement('canvas'), d = 2; c.width = c.height = px * d; c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d'); g.scale(d, d); A.draw(g, name, px / 2, px / 2, px * .94, o); return c;
  };
  /* sticker: art on a round white-bordered badge */
  A.sticker = function (id, px, locked) {
    const c = document.createElement('canvas'), d = 2; c.width = c.height = px * d; c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d'); g.scale(d, d); const st = M.stickers[id] || {}, r = px * .46;
    g.save(); g.translate(px / 2, px / 2); g.rotate(locked ? 0 : (st.rot || -.08));
    G.circ(g, 0, 0, r, locked ? '#d9d2c5' : '#fff', 4);
    if (!locked) { G.circ(g, 0, 0, r * .84, st.bg || '#fff3c4', 0); }
    g.restore();
    if (locked) G.text(g, '؟', px / 2, px / 2 + 2, { size: px * .5, color: '#b9b09f' });
    else A.draw(g, st.art || id, px / 2, px / 2, px * .64);
    return c;
  };

  /* ---------- UI icons (drawn, no emoji) ---------- */
  A.registerAll({
    star(g, o) { G.star(g, 0, 2, 44, o.off ? '#e4dccb' : '#ffc93c', 5); if (!o.off) { G.star(g, -4, -2, 18, 'rgba(255,255,255,.55)', 0); } },
    coin(g) { G.circ(g, 0, 0, 40, '#ffc93c', 5); G.circ(g, 0, 0, 28, '#ffdf6e', 3); G.text(g, 'ج', 0, 3, { size: 40, color: '#b07a10' }); },
    heart(g) { G.heart(g, 0, 0, 36, '#ff5a7a', 5); },
    sound(g, o) { G.poly(g, [[-34, -12], [-18, -12], [2, -30], [2, 30], [-18, 12], [-34, 12]], '#4a8dff', 4); if (o.off) { G.line(g, 14, -14, 38, 14, 7, '#ef5350'); G.line(g, 38, -14, 14, 14, 7, '#ef5350'); } else { g.lineWidth = 6; g.strokeStyle = '#4a8dff'; g.beginPath(); g.arc(8, 0, 16, -.9, .9); g.stroke(); g.beginPath(); g.arc(8, 0, 30, -.9, .9); g.stroke(); } },
    album(g) { G.fillRR(g, -34, -38, 68, 76, 8, '#ff8a2a', 5); G.fillRR(g, -26, -30, 52, 60, 4, '#fff7e3', 3); G.star(g, 0, 0, 18, '#ffc93c', 3); },
    diary(g) { G.fillRR(g, -32, -38, 64, 76, 8, '#1fb5a6', 5); G.fillRR(g, -24, -30, 48, 60, 3, '#fff', 3); [-14, -2, 10].forEach(y => G.line(g, -14, y, 14, y, 4, '#a8d8d3')); G.line(g, -34, -20, -34, 20, 8, '#14877c'); },
    hanger(g) { g.lineWidth = 6; g.strokeStyle = OL; g.beginPath(); g.arc(0, -26, 8, Math.PI * .6, Math.PI * 2.1); g.stroke(); G.poly(g, [[0, -18], [38, 14], [38, 28], [-38, 28], [-38, 14]], '#8a6bd6', 5); },
    parent(g) { G.circ(g, -16, -14, 14, '#ffd2a8', 4); G.circ(g, 18, -6, 11, '#ffd2a8', 4); G.fillRR(g, -34, 4, 36, 34, 14, '#ff6f91', 4); G.fillRR(g, 6, 8, 28, 30, 12, '#4a8dff', 4); },
    home(g) { G.poly(g, [[0, -38], [40, -2], [-40, -2]], '#ef5350', 5); G.fillRR(g, -28, -2, 56, 38, 4, '#ffe9b8', 5); G.fillRR(g, -8, 10, 16, 26, 3, '#8a5a3a', 3); },
    pause(g) { G.fillRR(g, -26, -30, 20, 60, 6, '#4a8dff', 5); G.fillRR(g, 6, -30, 20, 60, 6, '#4a8dff', 5); },
    swap(g) { g.lineWidth = 8; g.strokeStyle = OL; g.beginPath(); g.arc(0, 0, 26, .3, Math.PI - .3); g.stroke(); g.beginPath(); g.arc(0, 0, 26, Math.PI + .3, -.3); g.stroke(); G.poly(g, [[-34, 12], [-18, 14], [-28, 30]], OL, 2); G.poly(g, [[34, -12], [18, -14], [28, -30]], OL, 2); },
    lock(g) { g.lineWidth = 8; g.strokeStyle = '#8b8b8b'; g.beginPath(); g.arc(0, -8, 18, Math.PI, 0); g.stroke(); G.fillRR(g, -28, -8, 56, 42, 8, '#b0b0b0', 5); G.circ(g, 0, 12, 6, OL, 0); },
    check(g) { G.circ(g, 0, 0, 40, '#5cc96b', 5); g.lineWidth = 10; g.strokeStyle = '#fff'; g.beginPath(); g.moveTo(-18, 2); g.lineTo(-4, 16); g.lineTo(20, -14); g.stroke(); },
    arrow(g) { G.poly(g, [[34, -6], [34, 6], [-4, 6], [-4, 24], [-36, 0], [-4, -24], [-4, -6]], '#ff8a2a', 5); },
    play(g) { G.poly(g, [[-18, -32], [34, 0], [-18, 32]], '#5cc96b', 5); },
    gear(g) { g.save(); for (let i = 0; i < 8; i++) { g.rotate(Math.PI / 4); G.fillRR(g, -8, -42, 16, 16, 3, '#9aa0b5', 3); } g.restore(); G.circ(g, 0, 0, 30, '#9aa0b5', 4); G.circ(g, 0, 0, 12, '#fff3', 3); },
    question(g) { G.circ(g, 0, 0, 40, '#8a6bd6', 5); G.text(g, '؟', 0, 3, { size: 56, color: '#fff' }); },
    bulb(g, o) { G.circ(g, 0, -6, 28, o.off ? '#d8d2c0' : '#ffe14d', 5); G.fillRR(g, -14, 20, 28, 20, 5, '#9aa0b5', 4); },
    x(g) { G.line(g, -22, -22, 22, 22, 10, '#ef5350'); G.line(g, 22, -22, -22, 22, 10, '#ef5350'); }
  });
  A.icon = (name, px, o) => A.el(name, px, o);
})();
