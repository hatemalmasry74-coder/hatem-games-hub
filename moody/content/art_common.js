/* Moody & Aboody - content/art_common.js : shared drawn props (toys, food, kitchen, bath, school, misc).
   All art draws in a 100x100 box centred on 0,0 (see DEV.md). Worlds can add more with Moody.art.register(). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art;
  const COL = { red: '#ef5350', blue: '#4a8dff', green: '#5cc96b', yellow: '#ffd23c', orange: '#ff8a2a', purple: '#8a6bd6', pink: '#ff6f91', brown: '#8a5a3a', black: '#4a4a55', white: '#ffffff' };
  M.colors = COL;
  A.registerAll({
    shape(g, o) {
      const k = (o.args && o.args[0]) || 'circle', c = COL[(o.args && o.args[1]) || 'red'] || '#ef5350';
      if (k === 'circle') G.circ(g, 0, 0, 34, c, 5); else if (k === 'square') G.fillRR(g, -32, -32, 64, 64, 8, c, 5); else if (k === 'triangle') G.poly(g, [[0, -38], [38, 30], [-38, 30]], c, 5);
      else if (k === 'star') G.star(g, 0, 3, 40, c, 5); else if (k === 'heart') G.heart(g, 0, 0, 30, c, 5); else if (k === 'diamond') G.poly(g, [[0, -40], [32, 0], [0, 40], [-32, 0]], c, 5);
      else if (k === 'rect') G.fillRR(g, -42, -24, 84, 48, 8, c, 5);
    },
    /* ---- toys ---- */
    car(g) { G.fillRR(g, -42, -6, 84, 30, 10, '#ef5350', 4.5); G.fillRR(g, -22, -28, 46, 26, 10, '#ff7a77', 4.5); G.fillRR(g, -15, -23, 14, 16, 3, '#bfe8ff', 2.5); G.fillRR(g, 3, -23, 14, 16, 3, '#bfe8ff', 2.5); [-24, 24].forEach(x => { G.circ(g, x, 26, 12, '#3a3a45', 4); G.circ(g, x, 26, 4, '#ccc', 0); }); },
    teddy(g) { [-24, 24].forEach(x => G.circ(g, x, -30, 13, '#b97b4a', 4)); G.ell(g, 0, 18, 26, 28, '#b97b4a', 4.5); G.ell(g, 0, 22, 15, 17, '#e8c19a', 2.5); G.circ(g, 0, -12, 28, '#c88b58', 4.5); G.ell(g, 0, -4, 12, 9, '#e8c19a', 2.5); [-10, 10].forEach(x => G.circ(g, x, -18, 3.6, '#2e1b10', 0)); G.circ(g, 0, -7, 4, '#2e1b10', 0); },
    blocks(g) { G.fillRR(g, -40, 4, 36, 36, 4, '#ef5350', 4.5); G.fillRR(g, 2, 4, 36, 36, 4, '#4a8dff', 4.5); G.fillRR(g, -20, -34, 36, 36, 4, '#ffd23c', 4.5); G.text(g, 'A', -22, 24, { size: 26, color: '#fff', stroke: OL, sw: 4 }); G.text(g, 'B', 20, 24, { size: 26, color: '#fff', stroke: OL, sw: 4 }); },
    ball(g) { G.circ(g, 0, 0, 36, '#ff6f91', 4.5); g.save(); g.beginPath(); g.arc(0, 0, 33, 0, 6.3); g.clip(); G.fillRR(g, -40, -8, 80, 16, 0, '#fff', 0); G.fillRR(g, -8, -40, 16, 80, 0, '#4aa8e8', 0); g.restore(); },
    robot(g) { G.line(g, 0, -42, 0, -30, 4); G.circ(g, 0, -44, 5, '#ef5350', 3); G.fillRR(g, -26, -32, 52, 36, 10, '#9aa0b5', 4.5); [-10, 10].forEach(x => G.circ(g, x, -16, 7, '#8fd6ff', 3)); G.fillRR(g, -22, 8, 44, 34, 6, '#6e7791', 4.5); [-30, 30].forEach(x => G.fillRR(g, x - 6, 10, 12, 28, 5, '#9aa0b5', 3.5)); },
    duck(g) { G.ell(g, 0, 14, 34, 24, '#ffd23c', 4.5); G.circ(g, 16, -16, 20, '#ffd23c', 4.5); G.ell(g, 36, -12, 12, 6, '#ff8a2a', 3.5); G.circ(g, 20, -22, 3.5, '#222', 0); G.ell(g, -8, 14, 16, 10, '#ffe27a', 3); },
    /* ---- clothes / school ---- */
    pants(g) { G.poly(g, [[-26, -38], [26, -38], [32, 40], [8, 40], [0, -4], [-8, 40], [-32, 40]], '#e7b038', 4.5); G.line(g, -26, -28, 26, -28, 3.5); },
    sock(g) { g.beginPath(); g.moveTo(-14, -40); g.lineTo(14, -40); g.lineTo(14, 8); g.quadraticCurveTo(40, 14, 34, 36); g.quadraticCurveTo(10, 44, -14, 30); g.closePath(); G.fs(g, '#4aa8e8', 4.5); G.fillRR(g, -15, -42, 30, 14, 4, '#fff', 3.5); },
    shoe(g) { g.beginPath(); g.moveTo(-34, -6); g.lineTo(-6, -6); g.quadraticCurveTo(0, 12, 34, 14); g.quadraticCurveTo(42, 30, 30, 32); g.lineTo(-34, 32); g.closePath(); G.fs(g, '#e8e0cc', 4.5); G.fillRR(g, -34, 26, 66, 8, 4, '#8a6b4a', 3.5); },
    book(g) { G.fillRR(g, -30, -38, 60, 78, 6, '#8a6bd6', 4.5); G.fillRR(g, -24, -32, 48, 66, 3, '#fff', 2.5); G.fillRR(g, -34, -38, 10, 78, 4, '#6a4bb6', 3.5); G.line(g, -12, -14, 18, -14, 4, '#b9a98a'); G.line(g, -12, 0, 18, 0, 4, '#b9a98a'); },
    pencil(g) { G.fillRR(g, -10, -42, 20, 66, 4, '#ffd23c', 4.5); G.poly(g, [[-10, 24], [10, 24], [0, 44]], '#ffe1b0', 4); G.poly(g, [[-3, 38], [3, 38], [0, 44]], '#333', 2); G.fillRR(g, -10, -42, 20, 12, 4, '#ff6f91', 4); },
    notebook(g) { G.fillRR(g, -32, -38, 64, 78, 6, '#1fb5a6', 4.5); G.fillRR(g, -20, -26, 40, 30, 4, '#fff', 3); [-36, -18, 0, 18, 36].forEach(y => G.circ(g, -32, y, 3.5, '#fff', 2)); },
    bag(g) { G.fillRR(g, -34, -22, 68, 62, 14, '#4a8dff', 4.5); g.beginPath(); g.arc(0, -22, 16, Math.PI, 0); G.fs(g, null, 5); G.fillRR(g, -22, 6, 44, 24, 6, '#2f6fe0', 3.5); G.circ(g, 0, 18, 4, '#ffd23c', 2); },
    /* ---- boxes / furniture icons ---- */
    box(g) { G.fillRR(g, -38, -26, 76, 62, 4, '#c8935a', 4.5); G.poly(g, [[-42, -26], [42, -26], [34, -40], [-34, -40]], '#d9a66e', 4); G.fillRR(g, -10, -26, 20, 10, 0, '#e8c595', 2.5); },
    toybox(g) { G.fillRR(g, -42, -10, 84, 50, 8, '#ffb84a', 4.5); G.fillRR(g, -46, -24, 92, 18, 8, '#ff8a2a', 4.5); G.star(g, 0, 18, 14, '#fff', 3); },
    basket(g) { g.beginPath(); g.moveTo(-40, -18); g.lineTo(40, -18); g.lineTo(32, 38); g.lineTo(-32, 38); g.closePath(); G.fs(g, '#e0b070', 4.5); [-20, 0, 20].forEach(x => G.line(g, x, -14, x * .8, 34, 3, 'rgba(120,70,20,.6)')); [0, 14, 26].forEach(y => G.line(g, -36 + y * .2, y - 10, 36 - y * .2, y - 10, 3, 'rgba(120,70,20,.6)')); G.ell(g, 0, -18, 40, 8, '#c99556', 4); },
    shelf(g) { G.fillRR(g, -42, -42, 84, 84, 6, '#c8935a', 4.5); G.line(g, -42, -4, 42, -4, 4.5); [[-34, 28, '#ef5350'], [-20, 28, '#4a8dff'], [-6, 28, '#5cc96b'], [8, 28, '#ffd23c']].forEach((b, i) => G.fillRR(g, b[0], i % 2 ? -26 : -30, 11, i % 2 ? 22 : 26, 2, b[2], 2.5)); [[-30, '#8a6bd6'], [-14, '#ff8a2a'], [4, '#1fb5a6']].forEach(b => G.fillRR(g, b[0], 8, 13, 28, 2, b[1], 2.5)); },
    wardrobe(g) { G.fillRR(g, -34, -44, 68, 88, 6, '#b97b4a', 4.5); G.line(g, 0, -44, 0, 44, 4); G.circ(g, -8, 0, 3.5, '#ffd23c', 2); G.circ(g, 8, 0, 3.5, '#ffd23c', 2); G.fillRR(g, -28, -38, 24, 30, 3, 'rgba(255,255,255,.2)', 2.5); },
    /* ---- food ---- */
    foul(g) { G.ell(g, 0, 14, 40, 22, '#fff', 4.5); G.ell(g, 0, 8, 32, 14, '#8a5a2b', 3); [[-12, 6], [4, 10], [14, 4], [-4, 2]].forEach(p => G.ell(g, p[0], p[1], 5, 3.5, '#b07a45', 0)); G.circ(g, 4, 2, 4, '#ef5350', 0); },
    egg(g) { G.ell(g, 0, 0, 28, 36, '#fff', 4.5); G.ell(g, -8, -10, 7, 11, 'rgba(255,255,255,.9)', 0); G.ell(g, 0, 8, 22, 22, '#ffd23c', 0); },
    cheese(g) { G.poly(g, [[-40, 18], [-40, -6], [40, -30], [40, 18]], '#ffd23c', 4.5); G.circ(g, -14, 4, 6, '#e8b020', 2.5); G.circ(g, 14, -6, 8, '#e8b020', 2.5); G.circ(g, 26, 8, 4, '#e8b020', 2); },
    milk(g) { G.fillRR(g, -22, -20, 44, 60, 4, '#fff', 4.5); G.poly(g, [[-22, -20], [22, -20], [14, -42], [-14, -42]], '#9ed8ff', 4); G.fillRR(g, -22, -4, 44, 22, 0, '#4a8dff', 3); G.text(g, 'لبن', 0, 7, { size: 18, color: '#fff' }); },
    bread(g) { g.beginPath(); g.ellipse(0, 4, 40, 28, 0, 0, 6.3); G.fs(g, '#e6b46a', 4.5); g.beginPath(); g.ellipse(0, -2, 30, 16, 0, Math.PI, 0); G.fs(g, '#f3cf8e', 2.5); G.line(g, -14, 2, -4, 14, 3, '#c28a40'); G.line(g, 6, 0, 16, 12, 3, '#c28a40'); },
    apple(g) { G.circ(g, -12, 6, 24, '#ef5350', 4.5); G.circ(g, 12, 6, 24, '#ef5350', 4.5); G.circ(g, 0, 8, 22, '#ef5350', 0); G.line(g, 0, -16, 4, -32, 4, '#6a4a2a'); G.ell(g, 14, -26, 12, 6, '#5cc96b', 3, null, -.4); },
    banana(g) { g.beginPath(); g.moveTo(-36, -22); g.quadraticCurveTo(-20, 36, 38, 14); g.quadraticCurveTo(10, 26, -26, -30); g.closePath(); G.fs(g, '#ffd93c', 4.5); },
    tomato(g) { G.circ(g, 0, 6, 32, '#ef5350', 4.5); G.star(g, 0, -22, 14, '#5cc96b', 3); G.ell(g, -12, -4, 7, 10, 'rgba(255,255,255,.4)', 0); },
    cucumber(g) { g.save(); g.rotate(-.5); G.fillRR(g, -40, -14, 80, 28, 14, '#5cc96b', 4.5); [-24, -8, 8, 24].forEach(x => G.circ(g, x, 0, 2.5, '#2f8a44', 0)); g.restore(); },
    orange(g) { G.circ(g, 0, 4, 32, '#ff9a2a', 4.5); G.ell(g, 6, -28, 11, 6, '#5cc96b', 3, null, -.3); G.ell(g, -10, -4, 7, 10, 'rgba(255,255,255,.35)', 0); },
    carrot(g) { g.save(); g.rotate(.6); G.poly(g, [[-14, -30], [14, -30], [0, 44]], '#ff8a2a', 4.5); [-10, 0, 10].forEach(x => G.line(g, x, -30, x * 1.5, -44, 5, '#5cc96b')); g.restore(); },
    chips(g) { G.poly(g, [[-30, -40], [30, -40], [34, 40], [-34, 40]], '#ef5350', 4.5); G.circ(g, 0, 0, 20, '#ffd23c', 3.5); G.text(g, 'شيبسي', 0, 2, { size: 13, color: '#8a2a00' }); },
    candy(g) { G.circ(g, 0, 0, 22, '#ff6f91', 4.5); G.poly(g, [[-22, 0], [-42, -14], [-42, 14]], '#ffd23c', 3.5); G.poly(g, [[22, 0], [42, -14], [42, 14]], '#ffd23c', 3.5); g.beginPath(); g.arc(0, 0, 12, 0, 4); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); },
    soda(g) { G.fillRR(g, -20, -36, 40, 74, 8, '#e53935', 4.5); G.fillRR(g, -20, -12, 40, 26, 0, '#fff', 3); G.text(g, 'كولا', 0, 2, { size: 16, color: '#c62828' }); G.fillRR(g, -10, -42, 20, 8, 3, '#b0b0b0', 3); },
    cake(g) { G.fillRR(g, -38, -4, 76, 42, 8, '#ff9ec0', 4.5); G.fillRR(g, -38, -4, 76, 14, 8, '#fff', 3.5); G.line(g, 0, -4, 0, -24, 4); G.ell(g, 0, -30, 5, 8, '#ffb52e', 2.5); G.circ(g, -20, 22, 5, '#ef5350', 2); G.circ(g, 20, 22, 5, '#ef5350', 2); },
    chocolate(g) { G.fillRR(g, -34, -34, 68, 68, 6, '#6a3a1f', 4.5); [[-12, -12], [12, -12], [-12, 12], [12, 12]].forEach(p => G.fillRR(g, p[0] - 10, p[1] - 10, 20, 20, 3, '#8a5230', 2.5)); },
    rice(g) { G.poly(g, [[-30, -34], [30, -34], [36, 38], [-36, 38]], '#fff', 4.5); G.fillRR(g, -30, -34, 60, 14, 3, '#ffd23c', 3.5); G.text(g, 'رز', 0, 10, { size: 28, color: '#8a5a2b' }); },
    dates(g) { [[-14, 8], [14, 8], [0, -14]].forEach(p => G.ell(g, p[0], p[1], 14, 22, '#6a3a1f', 4, null, .3)); },
    /* ---- kitchen / bath ---- */
    cup(g) { G.poly(g, [[-22, -26], [22, -26], [16, 34], [-16, 34]], 'rgba(200,235,255,.9)', 4.5); G.poly(g, [[-20, -4], [20, -4], [16, 34], [-16, 34]], '#4aa8e8', 0); g.beginPath(); g.moveTo(-22, -26); g.lineTo(22, -26); g.lineTo(16, 34); g.lineTo(-16, 34); g.closePath(); g.lineWidth = 4.5; g.strokeStyle = OL; g.stroke(); },
    jug(g) { G.fillRR(g, -26, -30, 52, 70, 12, 'rgba(200,235,255,.9)', 4.5); G.fillRR(g, -22, 0, 44, 36, 8, '#4aa8e8', 0); G.fillRR(g, -26, -30, 52, 70, 12, null, 4.5); g.beginPath(); g.arc(30, 0, 14, -1.3, 1.3); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); },
    tap(g, o) { G.fillRR(g, -10, -10, 20, 50, 6, '#b8c0d0', 4.5); g.beginPath(); g.moveTo(-34, -22); g.lineTo(18, -22); g.quadraticCurveTo(34, -22, 34, -4); g.lineTo(34, 12); g.lineTo(18, 12); g.lineTo(18, -4); g.lineTo(-34, -4); g.closePath(); G.fs(g, '#d5dbe8', 4.5); G.fillRR(g, -42, -34, 30, 12, 5, '#ef5350', 3.5); if (o.drip !== false) { const k = (M.time * 1.6) % 1; G.ell(g, 26, 22 + k * 40, 5, 7, '#4aa8e8', 2); } },
    pot(g) { G.fillRR(g, -34, -14, 68, 46, 10, '#9aa0b5', 4.5); G.fillRR(g, -40, -22, 80, 12, 5, '#b8c0d0', 4); [-34, 34].forEach(x => G.circ(g, x, 0, 6, '#6e7791', 3)); G.fillRR(g, -26, -4, 12, 22, 4, 'rgba(255,255,255,.3)', 0); },
    plate(g) { G.circ(g, 0, 0, 38, '#fff', 4.5); G.circ(g, 0, 0, 26, '#e8f0ff', 3); },
    spoon(g) { g.save(); g.rotate(.7); G.ell(g, 0, -26, 14, 20, '#d5dbe8', 4.5); G.fillRR(g, -5, -8, 10, 52, 5, '#d5dbe8', 4); g.restore(); },
    riceBag(g) { A.fns.rice(g); },
    toothbrush(g) { g.save(); g.rotate(-.5); G.fillRR(g, -44, -7, 66, 14, 7, '#4aa8e8', 4.5); G.fillRR(g, 16, -12, 30, 24, 5, '#fff', 3.5); [20, 28, 36, 44].forEach(x => G.line(g, x, -11, x, -20, 4, '#1fb5a6')); g.restore(); },
    toothpaste(g) { G.fillRR(g, -14, -38, 28, 62, 6, '#fff', 4.5); G.fillRR(g, -14, -14, 28, 20, 0, '#ef5350', 3); G.fillRR(g, -8, 22, 16, 18, 3, '#4aa8e8', 4); },
    soap(g) { G.fillRR(g, -34, -18, 68, 40, 18, '#ff9ec0', 4.5); G.circ(g, 12, -28, 8, 'rgba(255,255,255,.8)', 2.5); G.circ(g, -2, -36, 5, 'rgba(255,255,255,.8)', 2); },
    towel(g) { G.fillRR(g, -30, -38, 60, 78, 6, '#4aa8e8', 4.5); [-18, -4, 10].forEach(y => G.line(g, -30, y + 10, 30, y + 10, 4, '#fff')); },
    /* ---- home misc ---- */
    tablet(g) { G.fillRR(g, -38, -30, 76, 60, 10, '#3a3f55', 4.5); G.fillRR(g, -32, -24, 64, 48, 4, '#6fd0ff', 2.5); G.circ(g, -8, 0, 8, '#fff', 0); G.poly(g, [[8, -12], [8, 12], [26, 0]], '#ffd23c', 0); },
    lamp(g, o) { G.poly(g, [[-24, -10], [24, -10], [14, -40], [-14, -40]], o.off ? '#d8d2c0' : '#ffe14d', 4.5); G.fillRR(g, -4, -10, 8, 40, 2, '#9aa0b5', 3.5); G.ell(g, 0, 34, 22, 7, '#9aa0b5', 4); },
    key(g) { G.circ(g, -22, -4, 18, '#ffd23c', 4.5); G.circ(g, -22, -4, 7, '#fff3c4', 3); G.fillRR(g, -8, -9, 50, 12, 5, '#ffd23c', 4); G.fillRR(g, 26, 2, 8, 16, 2, '#ffd23c', 3.5); G.fillRR(g, 38, 2, 8, 12, 2, '#ffd23c', 3.5); },
    chest(g, o) { G.fillRR(g, -42, -4, 84, 44, 6, '#b97b4a', 4.5); g.beginPath(); g.moveTo(-42, -4); g.quadraticCurveTo(0, -48 - (o.open ? 14 : 0), 42, -4); g.closePath(); G.fs(g, '#d19358', 4.5); G.fillRR(g, -44, 10, 88, 8, 0, '#ffd23c', 3); G.fillRR(g, -8, 0, 16, 22, 4, '#ffd23c', 3.5); if (o.open) { G.star(g, 0, -16, 16, '#ffd23c', 3); } },
    map(g) { G.poly(g, [[-42, -30], [-14, -38], [14, -30], [42, -38], [42, 32], [14, 40], [-14, 32], [-42, 40]], '#f5deb3', 4.5); g.beginPath(); g.moveTo(-28, 10); g.quadraticCurveTo(-8, -20, 10, 8); g.quadraticCurveTo(22, 20, 30, -12); g.setLineDash([6, 5]); g.lineWidth = 4; g.strokeStyle = '#ef5350'; g.stroke(); g.setLineDash([]); G.text(g, 'x', 30, -14, { size: 22, color: '#ef5350' }); },
    clock(g) { G.circ(g, 0, 0, 38, '#fff', 4.5); for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; G.line(g, Math.sin(a) * 30, -Math.cos(a) * 30, Math.sin(a) * 34, -Math.cos(a) * 34, 3); } const H = M.clockTime || [10, 10]; G.line(g, 0, 0, Math.sin(H[0] % 12 * Math.PI / 6) * 18, -Math.cos(H[0] % 12 * Math.PI / 6) * 18, 5); G.line(g, 0, 0, Math.sin(H[1] * Math.PI / 30) * 28, -Math.cos(H[1] * Math.PI / 30) * 28, 3.5); G.circ(g, 0, 0, 3.5, OL, 0); },
    alarm(g, o) { G.circ(g, 0, 4, 32, '#ff6f91', 4.5); G.circ(g, 0, 4, 24, '#fff', 3); G.line(g, 0, 4, 0, -12, 4); G.line(g, 0, 4, 12, 10, 4); [-1, 1].forEach(s => G.circ(g, s * 26, -26, 10, '#ffd23c', 4)); const w = o.ring ? Math.sin(M.time * 40) * 3 : 0; G.line(g, -20 + w, 36, -28, 44, 4); G.line(g, 20 + w, 36, 28, 44, 4); },
    chair(g) { G.fillRR(g, -26, -42, 52, 40, 8, '#c8935a', 4.5); G.fillRR(g, -30, -4, 60, 14, 5, '#d9a66e', 4.5); [-24, 24].forEach(x => G.fillRR(g, x - 4, 8, 8, 34, 2, '#b97b4a', 3.5)); },
    sofa(g) { G.fillRR(g, -44, -30, 88, 40, 14, '#4aa8e8', 4.5); G.fillRR(g, -50, -8, 100, 34, 12, '#6fbdf0', 4.5); G.fillRR(g, -36, -4, 72, 24, 6, 'rgba(255,255,255,.15)', 0); [-40, 40].forEach(x => G.fillRR(g, x - 4, 24, 8, 12, 2, '#6a4a2a', 3)); },
    plant(g) { G.poly(g, [[-18, 6], [18, 6], [13, 40], [-13, 40]], '#e07a4a', 4.5); [[-22, -20, -.7], [0, -30, 0], [22, -20, .7]].forEach(l => { g.save(); g.translate(0, 4); g.rotate(l[2]); G.ell(g, 0, -26, 11, 26, '#5cc96b', 4); g.restore(); }); },
    piggy(g) { G.ell(g, 0, 6, 38, 30, '#ff9ec0', 4.5); G.circ(g, 34, 6, 10, '#ff7aa8', 4); [[-24, 36], [20, 36]].forEach(p => G.fillRR(g, p[0] - 5, p[1] - 10, 12, 14, 3, '#ff7aa8', 3.5)); G.poly(g, [[-10, -22], [-2, -36], [6, -22]], '#ff7aa8', 3.5); G.line(g, -10, -20, 6, -20, 5, '#7a2a4a'); G.circ(g, 22, -6, 3.5, '#222', 0); G.line(g, 36, 6, 36, 12, 2.5); },
    moon(g) { g.beginPath(); g.arc(0, 0, 36, 0.6, Math.PI * 2 - .6); g.arc(14, 0, 28, Math.PI * 2 - .9, .9, true); G.fs(g, '#ffe98a', 4.5); },
    sunart(g) { G.sun(g, 0, 0, 22, M.time); },
    bed(g) { G.fillRR(g, -44, -6, 88, 34, 8, '#4a8dff', 4.5); G.fillRR(g, -44, -34, 14, 62, 5, '#b97b4a', 4.5); G.fillRR(g, -40, -10, 30, 16, 8, '#fff', 3.5); G.fillRR(g, -10, -6, 54, 30, 8, '#8fbcff', 0); },
    pillow(g) { G.fillRR(g, -38, -22, 76, 44, 18, '#fff', 4.5); G.line(g, -18, -6, 18, -6, 3, '#d8d0c0'); },
    plug(g) { G.fillRR(g, -20, -14, 40, 36, 10, '#3a3f55', 4.5); [-8, 8].forEach(x => G.fillRR(g, x - 3, -34, 6, 22, 2, '#d5dbe8', 3)); G.line(g, 0, 22, 0, 44, 6, '#3a3f55'); },
    fan(g) { for (let i = 0; i < 3; i++) { g.save(); g.rotate(i * 2.1 + M.time * 3); G.ell(g, 0, -22, 12, 24, '#8fd6ff', 4); g.restore(); } G.circ(g, 0, 0, 8, '#9aa0b5', 3.5); },
    switchon(g, o) { G.fillRR(g, -22, -32, 44, 64, 8, '#fff', 4.5); G.fillRR(g, -10, o.off ? 0 : -22, 20, 22, 4, o.off ? '#9aa0b5' : '#ffd23c', 3.5); },
    cat(g) { G.ell(g, 0, 20, 30, 22, '#ff9a4a', 4.5); G.circ(g, 0, -12, 24, '#ff9a4a', 4.5); [-1, 1].forEach(s => G.poly(g, [[s * 8, -30], [s * 22, -44], [s * 24, -22]], '#ff9a4a', 4)); [-9, 9].forEach(x => G.circ(g, x, -14, 3.6, '#222', 0)); G.poly(g, [[-3, -6], [3, -6], [0, -2]], '#ff6f91', 1.5); [-1, 1].forEach(s => { G.line(g, s * 6, -4, s * 22, -8, 2, OL); G.line(g, s * 6, -2, s * 22, 0, 2, OL); }); g.beginPath(); g.moveTo(28, 20); g.quadraticCurveTo(48, 14, 40, -8); g.lineWidth = 8; g.strokeStyle = '#ff9a4a'; g.stroke(); },
    finish(g) { G.fillRR(g, -4, -40, 8, 80, 2, '#fff', 3.5); G.fillRR(g, 4, -40, 36, 24, 0, '#ef5350', 3.5); },
    note(g) { G.fillRR(g, -34, -38, 68, 76, 4, '#fff8b8', 4.5); [-18, -4, 10, 24].forEach(y => G.line(g, -22, y, 22, y, 3, '#c9bb6a')); },
    window(g) { G.fillRR(g, -40, -40, 80, 80, 6, '#8fd6ff', 5); G.line(g, 0, -40, 0, 40, 5); G.line(g, -40, 0, 40, 0, 5); },
    heartbig(g) { G.heart(g, 0, 0, 38, '#ff5a7a', 5); },
    sparkles(g) { G.sparkle(g, 0, 0, 36, '#ffd23c'); G.sparkle(g, 24, -22, 16, '#fff'); G.sparkle(g, -26, 20, 14, '#ff6f91'); },
    smile(g) { G.circ(g, 0, 0, 40, '#ffd23c', 5); [-14, 14].forEach(x => G.circ(g, x, -8, 5, OL, 0)); g.beginPath(); g.arc(0, 4, 22, .3, Math.PI - .3); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); },
    sad(g) { G.circ(g, 0, 0, 40, '#ffd23c', 5); [-14, 14].forEach(x => G.circ(g, x, -8, 5, OL, 0)); g.beginPath(); g.arc(0, 26, 18, Math.PI + .4, -.4); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); },
    water(g) { G.poly(g, [[0, -42], [26, 8], [0, 40], [-26, 8]], '#4aa8e8', 4.5); G.circ(g, 0, 10, 24, '#4aa8e8', 0); g.beginPath(); g.moveTo(0, -42); g.quadraticCurveTo(34, 10, 0, 40); g.quadraticCurveTo(-34, 10, 0, -42); G.fs(g, '#4aa8e8', 4.5); },
    pajamas(g) { G.poly(g, [[-18, -36], [18, -36], [40, -14], [30, 4], [20, -2], [20, 40], [-20, 40], [-20, -2], [-30, 4], [-40, -14]], '#8a6bd6', 4.5); [[-8, -14], [8, 6], [-6, 22]].forEach(p => G.star(g, p[0], p[1], 6, '#ffe14d', 1.5)); },
    sleepz(g) { G.text(g, 'Z', -10, 6, { size: 60, color: '#4a8dff', stroke: '#fff', sw: 8 }); G.text(g, 'z', 22, -22, { size: 34, color: '#4a8dff', stroke: '#fff', sw: 6 }); },
    coinpile(g) { [[-14, 14], [14, 14], [0, -6]].forEach(p => G.circ(g, p[0], p[1], 22, '#ffc93c', 4)); G.text(g, 'ج', 0, -4, { size: 24, color: '#b07a10' }); }
  });
})();
