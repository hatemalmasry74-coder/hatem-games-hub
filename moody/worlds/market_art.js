/* Moody & Aboody - worlds/market_art.js : art + backgrounds of WORLD 4 "السوق".
   Props are mk_*  (100x100 box centred on 0,0); backgrounds are Moody.rooms.mk_* (fn(g,t,stage), flags in stage.state). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {};
  const rr = G.fillRR, ar = M.util.ar;
  const CACHE = {};
  function blit(g, key, fn) {
    let c = CACHE[key];
    if (!c) { c = document.createElement('canvas'); c.width = 1440; c.height = 810; const k = c.getContext('2d'); k.scale(1.5, 1.5); k.lineJoin = 'round'; k.lineCap = 'round'; k.direction = 'rtl'; try { fn(k); } catch (e) { } CACHE[key] = c; }
    g.drawImage(c, 0, 0, 960, 540);
  }
  function awning(g, x, y, w, c1, c2, n) { n = n || 6; for (let i = 0; i < n; i++) G.poly(g, [[x + i * w / n, y], [x + (i + 1) * w / n, y], [x + (i + 1) * w / n - 3, y + 26], [x + i * w / n + 3, y + 26]], i % 2 ? c2 : c1, 3.5); G.fillRR(g, x - 4, y - 8, w + 8, 12, 5, G.shade(c1, -.2), 3.5); }
  function sign(g, x, y, w, txt, c, tc) { rr(g, x, y, w, 36, 9, c, 4); G.text(g, txt, x + w / 2, y + 19, { size: 22, color: tc || '#fff', stroke: OL, sw: 4 }); }
  function table(g, x, y, w, h, c) { rr(g, x, y, w, h, 6, c || '#c8935a', 4.5); rr(g, x - 6, y - 8, w + 12, 14, 5, G.shade(c || '#c8935a', .12), 4); }
  function crateRow(g, x, y, n, art, s) { for (let i = 0; i < n; i++) { rr(g, x + i * s * 1.18, y, s * 1.12, s * .52, 4, '#d9a66e', 3.5); for (let k = 0; k < 3; k++) A.draw(g, art, x + i * s * 1.18 + s * (.22 + k * .34), y - s * .06, s * .52); } }
  function shopper(g, x, y, s, shirt, skin, t, ph) { const w = Math.sin(t * 6 + ph) * 4; G.shadow(g, x, y + 2, 16 * s, 4 * s, .22); g.save(); g.translate(x, y); g.scale(s, s); rr(g, -9 + w, -26, 8, 26, 3, '#4a4a5a', 3); rr(g, 1 - w, -26, 8, 26, 3, '#4a4a5a', 3); rr(g, -14, -62, 28, 40, 9, shirt, 3.5); G.circ(g, 0, -74, 13, skin, 3.5); g.beginPath(); g.ellipse(0, -78, 13, 9, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); g.restore(); }

  A.registerAll({
    /* --- produce / food --- */
    mk_potato(g) { G.ell(g, 0, 4, 34, 26, '#c9a070', 4.5, null, .2); [[-10, 0], [8, 10], [12, -6]].forEach(p => G.circ(g, p[0], p[1], 2.4, '#8a6a40', 0)); },
    mk_onion(g) { g.beginPath(); g.moveTo(0, -38); g.quadraticCurveTo(10, -22, 30, -2); g.quadraticCurveTo(36, 30, 0, 34); g.quadraticCurveTo(-36, 30, -30, -2); g.quadraticCurveTo(-10, -22, 0, -38); G.fs(g, '#e8b0c8', 4.5); G.line(g, 0, -34, 0, 30, 2, 'rgba(120,50,90,.4)'); G.line(g, -14, -10, -10, 28, 2, 'rgba(120,50,90,.4)'); G.line(g, 14, -10, 10, 28, 2, 'rgba(120,50,90,.4)'); },
    mk_watermelon(g) { G.ell(g, 0, 4, 42, 32, '#3f9a4a', 4.5); [-24, -8, 8, 24].forEach(x => G.line(g, x, -22, x * 1.1, 28, 4, '#2a7a38')); G.ell(g, -12, -8, 10, 6, 'rgba(255,255,255,.25)', 0); },
    mk_wmslice(g) { g.beginPath(); g.moveTo(-40, -10); g.quadraticCurveTo(0, 56, 40, -10); g.closePath(); G.fs(g, '#ff6f7a', 4.5); g.beginPath(); g.moveTo(-40, -10); g.quadraticCurveTo(0, 56, 40, -10); g.lineWidth = 8; g.strokeStyle = '#3f9a4a'; g.stroke(); [[-14, 6], [0, 14], [14, 6]].forEach(p => G.ell(g, p[0], p[1], 2.5, 4, '#222', 0)); },
    mk_grapes(g) { [[0, -4], [-14, -14], [14, -14], [-8, 8], [8, 8], [0, 22], [-22, 0], [22, 0]].forEach(p => G.circ(g, p[0], p[1], 11, '#8a6bd6', 3.5)); G.line(g, 0, -26, 4, -40, 4, '#6a4a2a'); G.ell(g, 12, -34, 10, 5, '#5cc96b', 3, null, -.4); },
    mk_lemon(g) { G.ell(g, 0, 2, 36, 26, '#ffe14d', 4.5); G.poly(g, [[-36, 2], [-44, 0], [-36, -4]], '#ffe14d', 3); G.poly(g, [[36, 2], [44, 0], [36, 6]], '#ffe14d', 3); G.ell(g, -10, -8, 8, 5, 'rgba(255,255,255,.5)', 0); },
    mk_pepper(g) { g.beginPath(); g.moveTo(-18, -22); g.quadraticCurveTo(-30, 20, -6, 38); g.quadraticCurveTo(14, 40, 18, 10); g.quadraticCurveTo(22, -18, -2, -26); g.closePath(); G.fs(g, '#5cc96b', 4.5); G.line(g, 0, -26, 4, -40, 5, '#2f8a44'); },
    mk_eggplant(g) { g.beginPath(); g.moveTo(-10, -22); g.quadraticCurveTo(-40, 30, 10, 38); g.quadraticCurveTo(34, 32, 22, -6); g.quadraticCurveTo(14, -24, -10, -22); G.fs(g, '#6a4a9a', 4.5); G.poly(g, [[-16, -22], [-4, -34], [8, -26], [10, -18]], '#5cc96b', 3); G.ell(g, 6, 6, 5, 12, 'rgba(255,255,255,.25)', 0); },
    mk_baladi(g) { G.ell(g, 0, 0, 40, 34, '#e0a860', 4.5); G.ell(g, 0, 0, 32, 26, '#f0c888', 2.5); for (let i = 0; i < 10; i++) G.circ(g, Math.cos(i * 2.1) * (10 + (i % 3) * 7), Math.sin(i * 2.1) * (8 + (i % 3) * 6), 1.8, '#a06a30', 0); },
    mk_fino(g) { g.save(); g.rotate(-.35); G.fillRR(g, -44, -14, 88, 28, 14, '#e6b46a', 4.5); [-26, -10, 6, 22].forEach(x => G.line(g, x, -10, x + 8, 10, 3, '#c28a40')); g.restore(); },
    mk_flour(g) { G.poly(g, [[-30, -30], [30, -30], [36, 40], [-36, 40]], '#fffdf6', 4.5); G.fillRR(g, -26, -38, 52, 12, 5, '#e8e0cc', 3.5); G.text(g, 'دقيق', 0, 6, { size: 24, color: '#8a6a3a' }); },
    mk_dough(g) { G.ell(g, 0, 6, 38, 26, '#fbe8c4', 4.5); G.ell(g, -8, -2, 12, 7, 'rgba(255,255,255,.7)', 0); },
    mk_oven(g) { G.fillRR(g, -40, -36, 80, 74, 10, '#c96a4a', 4.5); G.fillRR(g, -28, -18, 56, 42, 22, '#4a1f10', 4); G.ell(g, 0, 10, 20, 11, '#ff8a2a', 0); G.ell(g, 0, 12, 11, 6, '#ffd23c', 0); G.fillRR(g, -40, -44, 80, 12, 4, '#9a4a2a', 3.5); },
    mk_yogurt(g) { G.poly(g, [[-22, -16], [22, -16], [16, 34], [-16, 34]], '#fff', 4.5); G.fillRR(g, -24, -24, 48, 10, 4, '#4a8dff', 3.5); G.circ(g, 0, 12, 8, '#ff9ec0', 2); },
    mk_chicken(g) { G.ell(g, 0, 8, 32, 28, '#e8a060', 4.5); G.ell(g, -22, -6, 11, 20, '#e8a060', 4, null, .5); G.ell(g, 20, 28, 8, 12, '#fff', 3); G.ell(g, -10, 4, 10, 6, 'rgba(255,255,255,.35)', 0); },
    /* --- bags --- */
    mk_cloth(g, o) { const c = { blue: '#4a8dff', pink: '#ff7aa8', green: '#4fb85f', sand: '#e7cf9a' }[(o.args && o.args[0]) || 'sand']; g.beginPath(); g.arc(0, -18, 20, Math.PI, 0); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); g.lineWidth = 3; g.strokeStyle = G.shade(c, -.1); g.stroke(); G.fillRR(g, -34, -18, 68, 62, 6, c, 4.5); G.circ(g, 0, 10, 13, 'rgba(255,255,255,.85)', 2.5); g.beginPath(); g.moveTo(0, 16); g.quadraticCurveTo(-9, 6, 0, -2); g.quadraticCurveTo(9, 6, 0, 16); G.fs(g, '#4fb85f', 2); },
    mk_plastic(g) { g.beginPath(); g.moveTo(-26, -18); g.lineTo(26, -18); g.lineTo(34, 40); g.lineTo(-34, 40); g.closePath(); G.fs(g, 'rgba(235,245,255,.85)', 4); [-1, 1].forEach(s => { g.beginPath(); g.moveTo(s * 18, -18); g.quadraticCurveTo(s * 26, -52, s * 6, -50); g.lineWidth = 4; g.strokeStyle = OL; g.stroke(); }); G.line(g, -14, 0, -10, 30, 2, 'rgba(120,150,190,.5)'); G.line(g, 12, -4, 16, 26, 2, 'rgba(120,150,190,.5)'); },
    mk_cart(g) { G.line(g, -40, -30, -26, -30, 5); G.poly(g, [[-26, -30], [40, -30], [32, 10], [-18, 10]], 'rgba(255,255,255,.85)', 4); [-8, 8, 22].forEach(x => G.line(g, x, -28, x - 3, 8, 2.5)); G.line(g, -18, 10, -14, 26, 4); G.line(g, -14, 26, 34, 26, 4); G.circ(g, -8, 36, 6, '#3a3a45', 3); G.circ(g, 26, 36, 6, '#3a3a45', 3); },
    mk_recycle(g) { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * 2.094); g.beginPath(); g.arc(0, 0, 28, -2.3, -.5); g.lineWidth = 11; g.strokeStyle = '#2f8a44'; g.stroke(); G.poly(g, [[22, -26], [38, -10], [14, -10]], '#2f8a44', 2); g.restore(); } },
    mk_bin(g, o) { const c = { blue: '#4a8dff', yellow: '#ffc93c', green: '#5cc96b', grey: '#9aa0b5' }[(o.args && o.args[0]) || 'grey']; G.poly(g, [[-28, -26], [28, -26], [22, 42], [-22, 42]], c, 4.5); G.fillRR(g, -34, -38, 68, 14, 6, G.shade(c, -.15), 4); A.draw(g, 'mk_recycle', 0, 8, 38); },
    /* --- market furniture / signs --- */
    mk_price(g, o) { const n = (o.args && o.args[0]) || '?'; G.poly(g, [[-34, 0], [-18, -22], [34, -22], [34, 22], [-18, 22]], '#fff3a0', 4.5); G.circ(g, -20, 0, 4, OL, 0); G.text(g, ar(n), 10, -2, { size: 26, color: '#c25a00' }); G.text(g, 'جنيه', 10, 14, { size: 11, color: '#8a5a2b' }); },
    mk_word(g, o) { const w = (o.args && o.args[0]) || 'Word', a = o.args && o.args[1]; G.fillRR(g, -46, -30, 92, 60, 14, '#fff', 4.5); G.fillRR(g, -46, -30, 92, 20, 12, '#4a8dff', 0); G.fillRR(g, -46, -30, 92, 60, 14, null, 4.5); g.save(); g.direction = 'ltr'; g.font = 'bold ' + (w.length > 5 ? 22 : 27) + 'px Tahoma, Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = '#2b3a67'; g.fillText(w, 0, a ? -2 : 2); g.restore(); if (a) G.text(g, a, 0, 20, { size: 15, color: '#c25a00' }); },
    mk_meet(g) { G.fillRR(g, -4, -44, 8, 90, 3, '#8a5a3a', 3.5); G.poly(g, [[4, -44], [44, -34], [4, -22]], '#ef5350', 3.5); G.fillRR(g, -36, 2, 72, 26, 8, '#5cc96b', 4); G.text(g, 'نقطة اللقاء', 0, 16, { size: 13, color: '#fff', stroke: OL, sw: 3 }); },
    mk_info(g) { G.fillRR(g, -34, -4, 68, 44, 6, '#4a8dff', 4.5); G.fillRR(g, -40, -14, 80, 14, 5, '#fff', 4); G.circ(g, 0, -34, 20, '#fff', 4.5); G.circ(g, 0, -34, 14, '#4a8dff', 0); G.text(g, 'i', 0, -33, { size: 26, color: '#fff' }); G.text(g, 'استعلامات', 0, 22, { size: 13, color: '#fff', stroke: OL, sw: 3 }); },
    mk_balloon(g, o) { const c = { red: '#ef5350', blue: '#4a8dff', yellow: '#ffd23c', green: '#5cc96b', pink: '#ff6f91' }[(o.args && o.args[0]) || 'red']; G.line(g, 0, 20, 4, 46, 2.5); G.ell(g, 0, -8, 24, 30, c, 4.5); G.poly(g, [[-5, 22], [5, 22], [0, 16]], c, 3); G.ell(g, -9, -18, 5, 9, 'rgba(255,255,255,.45)', 0); },
    mk_register(g) { G.fillRR(g, -36, 0, 72, 40, 6, '#9aa0b5', 4.5); G.fillRR(g, -28, -34, 56, 30, 5, '#3a3f55', 4); G.fillRR(g, -22, -28, 44, 14, 3, '#9ff0a8', 2.5); G.fillRR(g, -28, 6, 56, 10, 3, '#d5dbe8', 2.5); G.fillRR(g, -22, 20, 44, 14, 3, '#ffc93c', 3); },
    mk_scale(g) { G.fillRR(g, -34, 20, 68, 20, 6, '#9aa0b5', 4.5); G.fillRR(g, -6, -10, 12, 32, 3, '#6e7791', 3.5); G.ell(g, 0, -14, 34, 8, '#d5dbe8', 4); G.circ(g, 0, 28, 9, '#fff', 3); G.line(g, 0, 28, 5, 24, 2.5); },
    mk_vendor(g) { G.circ(g, 0, 0, 44, '#ffe0ea', 4); g.beginPath(); g.ellipse(0, 6, 36, 40, 0, 0, 6.3); G.fs(g, '#5aa0e0', 4); [-1, 1].forEach(s => { G.ell(g, s * 11, 2, 4.6, 5.6, '#fff', 2); G.circ(g, s * 11, 3, 3, '#3a2013', 0); }); G.ell(g, 0, 4, 24, 28, '#e8aa7a', 3.5); [-1, 1].forEach(s => { G.ell(g, s * 9, 0, 3.6, 4.6, '#fff', 1.5); G.circ(g, s * 9, 1, 2.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 12, 8, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    mk_baker(g) { G.circ(g, 0, 0, 44, '#fff0d0', 4); G.ell(g, 0, 6, 28, 32, '#dd9d6c', 3.5); G.fillRR(g, -22, -38, 44, 24, 10, '#fff', 3.5); G.fillRR(g, -26, -22, 52, 8, 3, '#fff', 3.5); [-1, 1].forEach(s => { G.ell(g, s * 10, 4, 4.6, 5.6, '#fff', 2); G.circ(g, s * 10, 5, 3, '#3a2013', 0); }); G.ell(g, 0, 17, 14, 5, '#2e1b10', 2); g.beginPath(); g.arc(0, 18, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    mk_staff(g) { G.circ(g, 0, 0, 44, '#d9f0ff', 4); G.ell(g, 0, 4, 27, 31, '#e0a878', 3.5); g.beginPath(); g.ellipse(0, -16, 29, 15, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); [-1, 1].forEach(s => { G.ell(g, s * 10, 2, 4.6, 5.6, '#fff', 2); G.circ(g, s * 10, 3, 3, '#3a2013', 0); }); g.beginPath(); g.arc(0, 14, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); G.fillRR(g, -24, 30, 48, 14, 5, '#ff8a2a', 3); },
    mk_walker(g, o) { const c = '#' + ((o.args && o.args[0]) || 'ef5350'), sk = (o.args && o.args[1]) === 'l' ? '#f0c08a' : '#dd9d6c'; G.fillRR(g, -14, 16, 11, 30, 4, '#4a4a5a', 3); G.fillRR(g, 3, 16, 11, 30, 4, '#4a4a5a', 3); G.fillRR(g, -20, -14, 40, 36, 10, c, 4); G.circ(g, 0, -28, 15, sk, 3.5); g.beginPath(); g.ellipse(0, -32, 15, 10, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); },
    mk_list(g) { G.fillRR(g, -34, -42, 68, 84, 8, '#fff8b8', 4.5); G.fillRR(g, -14, -48, 28, 12, 4, '#8a5a3a', 3); [-20, -4, 12, 28].forEach(y => { G.circ(g, -22, y, 3, '#5cc96b', 0); G.line(g, -14, y, 24, y, 3, '#c9bb6a'); }); },
    mk_crumbs(g) { [[-14, 6, 9], [10, -4, 7], [18, 14, 6], [-2, 18, 5]].forEach(p => G.ell(g, p[0], p[1], p[2], p[2] * .7, '#e6b46a', 3)); },
    mk_bottle(g) { G.fillRR(g, -13, -16, 26, 56, 10, 'rgba(160,215,255,.9)', 4); G.fillRR(g, -7, -34, 14, 20, 4, 'rgba(160,215,255,.9)', 4); G.fillRR(g, -9, -42, 18, 9, 3, '#4a8dff', 3); G.fillRR(g, -13, 6, 26, 14, 0, '#4a8dff', 2.5); },
    mk_peel(g) { g.beginPath(); g.moveTo(-34, 10); g.quadraticCurveTo(-4, -34, 34, 4); g.quadraticCurveTo(10, -6, -6, 14); g.quadraticCurveTo(-20, 34, -34, 10); G.fs(g, '#ffd93c', 4); G.circ(g, 24, 2, 4, '#8a6a2a', 2); },
    mk_bird(g) { G.ell(g, 0, 6, 26, 20, '#8fd6ff', 4.5); G.circ(g, 20, -10, 14, '#8fd6ff', 4.5); G.poly(g, [[32, -10], [44, -6], [32, -2]], '#ff8a2a', 3); G.circ(g, 24, -13, 3, OL, 0); G.ell(g, -4, 8, 14, 8, '#4aa8e8', 3); },
    mk_cheers(g) { G.sparkle(g, 0, 0, 36, '#ffd23c'); G.heart(g, 0, 4, 16, '#ff5a7a', 3); }
  });

  /* ================= BACKGROUNDS ================= */
  /* --- the fruit & vegetable market. flags: list [{art,n,got}], gift (bool), open (bool), hideBags --- */
  R.mk_market = function (g, t, s) {
    const S = s.state;
    blit(g, 'mk_market', k => {
      k.fillStyle = G.lin(k, 0, 0, 0, 300, ['#ffd9b0', '#fff3d6']); k.fillRect(0, 0, 960, 540);
      // far shop row
      [['#ffd0dc', 0], ['#cfeaf8', 180], ['#fff0b0', 360], ['#d6f0c8', 540], ['#e6d8f8', 720]].forEach((b, i) => { rr(k, b[1], 40 + (i % 2) * 18, 190, 150, 5, b[0], 4); for (let c = 0; c < 3; c++) rr(k, b[1] + 16 + c * 56, 60 + (i % 2) * 18, 40, 46, 5, '#bfe8ff', 3); });
      // stalls
      [[40, 'خضار', '#5cc96b', '#fff'], [320, 'فاكهة', '#ff6f91', '#fff'], [600, 'بقالة', '#ffb347', '#fff']].forEach((st, i) => {
        awning(k, st[0], 168, 260, st[2], st[3], 7); sign(k, st[0] + 70, 138, 120, st[1], st[2]);
        rr(k, st[0] + 6, 194, 10, 236, 3, '#8a5a3a', 3.5); rr(k, st[0] + 244, 194, 10, 236, 3, '#8a5a3a', 3.5);
        table(k, st[0] + 16, 330, 228, 100, '#d9a66e');
      });
      crateRow(k, 60, 296, 3, 'tomato', 62); crateRow(k, 340, 296, 3, 'apple', 62); crateRow(k, 620, 296, 3, 'orange', 62);
      A.draw(k, 'cucumber', 112, 366, 40); A.draw(k, 'mk_potato', 170, 366, 40); A.draw(k, 'banana', 394, 366, 40); A.draw(k, 'mk_grapes', 454, 366, 44); A.draw(k, 'carrot', 668, 366, 40); A.draw(k, 'mk_onion', 726, 366, 38);
      // ground
      k.fillStyle = '#dccba8'; k.fillRect(0, 430, 960, 110); G.line(k, 0, 430, 960, 430, 4); k.strokeStyle = 'rgba(90,60,30,.15)'; k.lineWidth = 2; for (let x = 0; x < 960; x += 80) { k.beginPath(); k.moveTo(x, 440); k.lineTo(x - 40, 540); k.stroke(); }
    });
    // clipboard list (left)
    if (S.list) {
      G.fillRR(g, 14, 108, 170, 40 + S.list.length * 46, 14, '#fff8b8', 4); G.text(g, 'القايمة', 99, 130, { size: 24, color: '#c25a00' });
      S.list.forEach((l, i) => { const y = 172 + i * 46; A.draw(g, l.art, 48, y, 38); for (let k = 0; k < l.n; k++) G.circ(g, 92 + k * 17, y, 7, k < (l.got || 0) ? '#5cc96b' : '#fff', 2.5); if ((l.got || 0) >= l.n) A.draw(g, 'check', 166, y, 28); });
    }
    if (S.gift) { A.draw(g, 'mk_cloth:blue', 480, 395, 120 + Math.sin(t * 3) * 3); for (let i = 0; i < 5; i++) G.sparkle(g, 480 + Math.sin(t * 2 + i * 1.3) * 80, 340 + Math.cos(t * 2.3 + i) * 30, 7 + i % 3, '#fff6a8', .8); }
  };

  /* --- busy market street (crowd) --- */
  R.mk_street = function (g, t, s) {
    const S = s.state;
    blit(g, 'mk_street', k => {
      k.fillStyle = G.lin(k, 0, 0, 0, 300, ['#8fd6ff', '#fff0d0']); k.fillRect(0, 0, 960, 540);
      [['#ffd0dc', 0], ['#cfeaf8', 150], ['#fff0b0', 300], ['#d6f0c8', 450], ['#e6d8f8', 600], ['#ffd9b0', 750]].forEach((b, i) => { rr(k, b[1], 30 + (i % 3) * 14, 170, 190, 5, b[0], 4); for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) rr(k, b[1] + 14 + c * 50, 50 + r * 62 + (i % 3) * 14, 36, 42, 5, '#bfe8ff', 3); });
      // stall row
      [[20, '#ef5350'], [200, '#4a8dff'], [380, '#ffb347'], [560, '#5cc96b'], [740, '#8a6bd6']].forEach((st, i) => { awning(k, st[0], 210, 190, st[1], '#fff', 6); table(k, st[0] + 12, 300, 166, 80, '#d9a66e'); });
      ['apple', 'orange', 'banana', 'tomato', 'bread'].forEach((a, i) => { for (let j = 0; j < 3; j++) A.draw(k, a, 56 + i * 180 + j * 40, 296, 38); });
      k.fillStyle = '#dccba8'; k.fillRect(0, 400, 960, 140); G.line(k, 0, 400, 960, 400, 4); k.strokeStyle = 'rgba(90,60,30,.15)'; k.lineWidth = 2; for (let x = 0; x < 960; x += 80) { k.beginPath(); k.moveTo(x, 410); k.lineTo(x - 40, 540); k.stroke(); }
      // hanging bunting
      G.line(k, 0, 180, 960, 196, 3, '#6a4a2a'); for (let i = 0; i < 16; i++) G.poly(k, [[i * 60 + 10, 184 + i * 1], [i * 60 + 42, 186 + i * 1], [i * 60 + 26, 210 + i * 1]], ['#ef5350', '#ffd23c', '#4a8dff', '#5cc96b'][i % 4], 2.5);
    });
    if (S.crowd !== false) {
      const cols = ['ef5350', '4a8dff', 'ffd23c', '5cc96b', '8a6bd6', 'ff8a2a', 'ff6f91', '1fb5a6'];
      for (let i = 0; i < 9; i++) { const sp = 14 + (i % 4) * 7, dir = i % 2 ? 1 : -1, x = ((i * 137 + t * sp * dir) % 1100 + 1100) % 1100 - 70, y = 392 + (i % 3) * 30; shopper(g, x, y, .95 + (i % 3) * .06, '#' + cols[i % 8], i % 3 ? '#dd9d6c' : '#f0c08a', t, i); }
    }
    if (S.balloons) { A.draw(g, 'mk_balloon:red', 760, 170 + Math.sin(t * 2) * 6, 50); A.draw(g, 'mk_balloon:blue', 800, 150 + Math.sin(t * 2 + 1) * 6, 50); A.draw(g, 'mk_balloon:yellow', 840, 175 + Math.sin(t * 2 + 2) * 6, 50); }
    if (S.meet) A.draw(g, 'mk_meet', S.meet.x, S.meet.y, 90);
  };

  /* --- bakery. flags: queue [{x,art}] , tray bool --- */
  R.mk_bakery = function (g, t, s) {
    const S = s.state;
    blit(g, 'mk_bakery', k => {
      k.fillStyle = G.lin(k, 0, 0, 0, 440, ['#ffe9c8', '#ffd9a0']); k.fillRect(0, 0, 960, 440);
      k.fillStyle = 'rgba(255,255,255,.25)'; for (let x = 0; x < 960; x += 80) k.fillRect(x, 0, 40, 440);
      // shelves of bread behind counter
      for (let r = 0; r < 3; r++) { rr(k, 60, 120 + r * 70, 560, 10, 3, '#b97b4a', 3.5); for (let i = 0; i < 9; i++) A.draw(k, ['mk_baladi', 'mk_fino', 'bread'][(i + r) % 3], 100 + i * 60, 100 + r * 70, 46); }
      // oven
      A.draw(k, 'mk_oven', 790, 190, 190); sign(k, 640, 36, 280, 'مخبز الحارة', '#c96a4a');
      // counter
      rr(k, 40, 300, 620, 130, 8, '#c8935a', 5); rr(k, 28, 288, 644, 24, 8, '#e8b878', 5);
      for (let i = 0; i < 4; i++) rr(k, 64 + i * 150, 330, 130, 80, 6, '#d9a66e', 3.5);
      A.draw(k, 'mk_baladi', 140, 278, 56); A.draw(k, 'mk_fino', 220, 276, 56); A.draw(k, 'mk_baladi', 300, 278, 56); A.draw(k, 'cake', 420, 274, 52); A.draw(k, 'mk_register', 560, 262, 74);
      k.fillStyle = '#d9cdb8'; k.fillRect(0, 430, 960, 110); G.line(k, 0, 430, 960, 430, 4);
      // queue marks
      for (let i = 0; i < 5; i++) { k.fillStyle = 'rgba(255,255,255,.7)'; k.beginPath(); k.ellipse(840 - i * 110, 506, 34, 9, 0, 0, 6.3); k.fill(); }
    });
    if (S.baker !== false) A.draw(g, 'mk_baker', 340, 214, 86);
    if (S.queue) S.queue.forEach((q, i) => { shopper(g, q.x, 500 + (q.dy || 0), 1.45, q.c || '#ef5350', q.sk || '#dd9d6c', t, i); });
    if (S.crumbs) S.crumbs.forEach(c => { if (!c.gone) A.draw(g, 'mk_crumbs', c.x, c.y, 40); });
    if (S.bird) { const b = S.bird; A.draw(g, 'mk_bird', b.x, b.y + Math.sin(t * 6) * 2, 54); }
  };

  /* --- checkout counter. flags: shown {text} on the register display --- */
  R.mk_checkout = function (g, t, s) {
    const S = s.state;
    blit(g, 'mk_checkout', k => {
      k.fillStyle = G.lin(k, 0, 0, 0, 440, ['#d6f0c8', '#eef8d8']); k.fillRect(0, 0, 960, 440);
      // shelves with goods
      for (let r = 0; r < 3; r++) { rr(k, 40, 110 + r * 80, 560, 10, 3, '#b97b4a', 3.5); ['soda', 'chips', 'milk', 'cheese', 'candy', 'bread', 'chocolate', 'cake'].forEach((a, i) => A.draw(k, a, 80 + i * 68, 84 + r * 80, 46)); }
      sign(k, 650, 40, 250, 'سوبر ماركت الحي', '#2fa09a'); A.draw(k, 'mk_price:5', 700, 130, 56); A.draw(k, 'mk_price:15', 780, 130, 56); A.draw(k, 'mk_price:20', 860, 130, 56);
      rr(k, 620, 230, 320, 200, 8, '#c8935a', 5); rr(k, 608, 216, 344, 24, 8, '#e8b878', 5); A.draw(k, 'mk_register', 880, 190, 100);
      k.fillStyle = '#d9cdb8'; k.fillRect(0, 430, 960, 110); G.line(k, 0, 430, 960, 430, 4); k.strokeStyle = 'rgba(90,60,30,.15)'; k.lineWidth = 2; for (let x = 0; x < 960; x += 80) { k.beginPath(); k.moveTo(x, 440); k.lineTo(x - 40, 540); k.stroke(); }
    });
    A.draw(g, 'mk_vendor', 790, 168, 84);
    if (S.shown) { G.fillRR(g, 836, 160, 88, 30, 5, '#1d3a22', 0); G.text(g, S.shown, 880, 175, { size: 22, color: '#9ff0a8' }); }
    if (S.items) S.items.forEach(a => A.draw(g, a.art, a.x, a.y, a.s || 50));
  };
})();
