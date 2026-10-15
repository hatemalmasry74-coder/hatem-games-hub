/* Moody & Aboody - worlds/park_art.js : props + backgrounds of WORLD 5 (park & club). All canvas-drawn, names prefixed pk_.
   Backgrounds (Moody.rooms): pkPark (state.kind = 'swings' | 'pitch' | 'hide' | 'plain'), pkGarden, pkZoo. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {}, C = M.pkColors;
  const rr = G.fillRR;
  const FLC = { red: '#ef5350', pink: '#ff6f91', yellow: '#ffd23c', purple: '#a98bf0', orange: '#ff9a3a', white: '#ffffff', blue: '#6aa8ff' };

  /* ------------------------------------------------------------------ props */
  A.registerAll({
    pk_swing(g) { G.line(g, -36, 42, -18, -36, 9); G.line(g, 36, 42, 18, -36, 9); G.line(g, -36, 42, -18, -36, 4, '#e07a4a'); G.line(g, 36, 42, 18, -36, 4, '#e07a4a'); G.line(g, -22, -36, 22, -36, 10); G.line(g, -22, -36, 22, -36, 5, '#ef8a5a'); G.line(g, -9, -34, -9, 20, 3); G.line(g, 9, -34, 9, 20, 3); rr(g, -16, 18, 32, 9, 4, '#8a5a3a', 3.5); },
    pk_slide(g) { rr(g, -42, -34, 16, 78, 4, '#4a8dff', 4); [-20, -4, 12, 28].forEach(y => G.line(g, -42, y, -26, y, 4)); g.beginPath(); g.moveTo(-26, -34); g.lineTo(-14, -34); g.lineTo(40, 40); g.lineTo(22, 44); g.closePath(); G.fs(g, '#ffd23c', 4.5); G.line(g, -26, -34, -26, -46, 4); rr(g, -46, -40, 24, 8, 3, '#ef5350', 3.5); },
    pk_bush(g) { [[-26, 8, 24], [26, 8, 24], [0, -6, 28], [-10, 22, 20], [14, 22, 20]].forEach(c => G.circ(g, c[0], c[1], c[2], '#4fb85f', 4)); G.circ(g, -6, -14, 14, '#7fdc8a', 0); [[-20, 6], [14, -4], [24, 18], [-6, 18]].forEach((p, i) => G.circ(g, p[0], p[1], 4.5, ['#ff6f91', '#ffd23c', '#fff', '#ff6f91'][i], 2.2)); },
    pk_tree(g) { rr(g, -8, 6, 16, 42, 4, '#8a5a3a', 4); G.circ(g, -22, -6, 26, '#4fb85f', 4); G.circ(g, 22, -6, 26, '#4fb85f', 4); G.circ(g, 0, -22, 30, '#5cc96b', 4); G.circ(g, -8, -30, 12, '#7fdc8a', 0); G.circ(g, 12, -6, 5, '#ef5350', 2); G.circ(g, -16, -14, 5, '#ef5350', 2); },
    pk_bench(g) { rr(g, -42, -18, 84, 12, 4, '#c8935a', 4); rr(g, -42, 0, 84, 12, 4, '#c8935a', 4); rr(g, -38, 12, 10, 28, 3, '#6e7791', 3.5); rr(g, 28, 12, 10, 28, 3, '#6e7791', 3.5); G.line(g, -38, -18, -38, -34, 4); G.line(g, 38, -18, 38, -34, 4); },
    pk_flower(g, o) { const c = FLC[(o.args && o.args[0]) || 'pink'] || '#ff6f91'; G.line(g, 0, 4, 0, 44, 5, '#3f9a4f'); G.ell(g, 12, 30, 12, 6, '#5cc96b', 3, null, -.5); for (let i = 0; i < 5; i++) { const a = i * 1.2566 - 1.57; G.circ(g, Math.cos(a) * 17, -8 + Math.sin(a) * 17, 13, c, 3.5); } G.circ(g, 0, -8, 10, '#ffd23c', 3.5); },
    pk_seed(g) { G.ell(g, -14, 6, 16, 11, '#8a5a2b', 4, null, -.5); G.ell(g, 16, -8, 16, 11, '#a0672f', 4, null, .5); G.ell(g, -18, 3, 6, 3, 'rgba(255,255,255,.45)', 0, null, -.5); G.ell(g, 12, -11, 6, 3, 'rgba(255,255,255,.45)', 0, null, .5); },
    pk_soil(g) { g.beginPath(); g.moveTo(-44, 30); g.quadraticCurveTo(-30, -18, 0, -18); g.quadraticCurveTo(30, -18, 44, 30); g.closePath(); G.fs(g, '#8a5a3a', 4.5); [[-18, 10], [4, 0], [20, 14], [-4, 20]].forEach(p => G.circ(g, p[0], p[1], 3.5, '#6a4426', 0)); },
    pk_sprout(g) { G.line(g, 0, 36, 0, 0, 6, '#3f9a4f'); G.ell(g, -14, -4, 16, 9, '#5cc96b', 3.5, null, -.5); G.ell(g, 14, -8, 16, 9, '#5cc96b', 3.5, null, .5); g.beginPath(); g.moveTo(-40, 40); g.quadraticCurveTo(0, 20, 40, 40); g.closePath(); G.fs(g, '#8a5a3a', 4); },
    pk_potplant(g, o) {
      const s = +((o.args && o.args[0]) || 3);
      if (s >= 1) { const hh = s === 1 ? 14 : s === 2 ? 30 : 48; G.line(g, 0, 8, 0, 8 - hh, 6, '#3f9a4f'); if (s >= 2) { G.ell(g, -14, 0 - hh * .4, 15, 8, '#5cc96b', 3.5, null, -.5); G.ell(g, 14, -4 - hh * .5, 15, 8, '#5cc96b', 3.5, null, .5); } if (s === 1) { G.ell(g, -8, 8 - hh, 9, 5, '#5cc96b', 3, null, -.4); G.ell(g, 8, 8 - hh, 9, 5, '#5cc96b', 3, null, .4); } if (s >= 3) { G.ell(g, -20, -14, 17, 9, '#4fb85f', 3.5, null, -.3); G.ell(g, 20, -20, 17, 9, '#4fb85f', 3.5, null, .3); } if (s >= 4) { const by = -48; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; G.circ(g, Math.cos(a) * 13, by + Math.sin(a) * 13, 9, '#ff6f91', 3); } G.circ(g, 0, by, 8, '#ffd23c', 3); } }
      G.poly(g, [[-26, 8], [26, 8], [20, 44], [-20, 44]], '#e07a4a', 4.5); rr(g, -30, 2, 60, 12, 5, '#c9633a', 4);
    },
    /* growth stage picture (cross-section): n = 0 seed ... 4 flower */
    pk_stage(g, o) {
      const s = +((o.args && o.args[0]) || 0); rr(g, -42, 14, 84, 30, 4, '#8a5a3a', 4); g.save(); g.beginPath(); g.rect(-42, 14, 84, 30); g.clip(); [[-24, 30], [10, 38], [28, 26]].forEach(p => G.circ(g, p[0], p[1], 2.5, '#6a4426', 0)); g.restore();
      if (s === 0) G.ell(g, 0, 26, 10, 7, '#c98a2f', 3.5);
      if (s >= 1) { G.ell(g, 0, 24, 7, 5, '#c98a2f', 3); G.line(g, 0, 28, -6, 40, 3, '#f0e3c8'); G.line(g, 0, 28, 8, 40, 3, '#f0e3c8'); }
      if (s === 2) { G.line(g, 0, 22, 0, 4, 5, '#3f9a4f'); G.ell(g, -7, 2, 8, 5, '#5cc96b', 3, null, -.5); G.ell(g, 7, 2, 8, 5, '#5cc96b', 3, null, .5); }
      if (s >= 3) { G.line(g, 0, 22, 0, s === 3 ? -14 : -30, 6, '#3f9a4f'); G.ell(g, -13, 0, 14, 8, '#5cc96b', 3.5, null, -.5); G.ell(g, 13, -8, 14, 8, '#5cc96b', 3.5, null, .5); }
      if (s === 3) { G.ell(g, -8, -16, 9, 5, '#5cc96b', 3, null, -.4); G.ell(g, 8, -16, 9, 5, '#5cc96b', 3, null, .4); }
      if (s === 4) { for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; G.circ(g, Math.cos(a) * 12, -38 + Math.sin(a) * 12, 8, '#ff6f91', 3); } G.circ(g, 0, -38, 7, '#ffd23c', 3); }
    },
    pk_wcan(g) { g.beginPath(); g.moveTo(-26, -14); g.lineTo(18, -14); g.lineTo(14, 32); g.lineTo(-30, 32); g.closePath(); G.fs(g, '#4aa8e8', 4.5); g.beginPath(); g.moveTo(18, 4); g.lineTo(42, -22); g.lineTo(46, -17); g.lineTo(18, 20); g.closePath(); G.fs(g, '#4aa8e8', 4); G.ell(g, 44, -22, 9, 5, '#2f7fc0', 3, null, .7); g.beginPath(); g.arc(-30, 8, 16, Math.PI * .5, Math.PI * 1.5); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.arc(-4, -14, 16, Math.PI, 0); g.lineWidth = 6; g.stroke(); G.line(g, -22, -6, -22, 22, 3, 'rgba(255,255,255,.5)'); },
    pk_bee(g) { G.ell(g, -10, -22, 14, 22, 'rgba(210,235,255,.85)', 3.5, null, -.5); G.ell(g, 10, -22, 14, 22, 'rgba(210,235,255,.85)', 3.5, null, .5); G.ell(g, 0, 8, 30, 24, '#ffd23c', 4.5); g.save(); g.beginPath(); g.ellipse(0, 8, 30, 24, 0, 0, 6.3); g.clip(); [-8, 10].forEach(x => rr(g, x - 4, -20, 8, 56, 0, '#3a2a1e', 0)); g.restore(); G.ell(g, 0, 8, 30, 24, null, 4.5); G.circ(g, 20, 4, 3.6, '#fff', 0); G.circ(g, 21, 4, 1.8, '#222', 0); g.beginPath(); g.arc(24, 12, 6, .2, 2.4); g.lineWidth = 2.5; g.strokeStyle = OL; g.stroke(); G.line(g, -30, 8, -40, 12, 4); },
    pk_butterfly(g, o) { const c = FLC[(o.args && o.args[0]) || 'purple'] || '#a98bf0'; G.ell(g, -22, -12, 22, 26, c, 4, null, .5); G.ell(g, 22, -12, 22, 26, c, 4, null, -.5); G.ell(g, -16, 20, 14, 16, G.shade(c, .25), 4, null, -.4); G.ell(g, 16, 20, 14, 16, G.shade(c, .25), 4, null, .4); G.circ(g, -24, -14, 7, '#fff', 2); G.circ(g, 24, -14, 7, '#fff', 2); G.ell(g, 0, 4, 6, 28, '#3a2a1e', 3.5); G.line(g, -2, -24, -10, -38, 3); G.line(g, 2, -24, 10, -38, 3); },
    pk_honey(g) { rr(g, -26, -22, 52, 60, 12, '#ffb52e', 4.5); rr(g, -22, -6, 44, 36, 6, '#ffe08a', 0); rr(g, -30, -34, 60, 16, 6, '#8a5a3a', 4); rr(g, -18, 2, 36, 18, 4, '#fff', 3); G.text(g, 'عسل', 0, 12, { size: 15, color: '#c25a00' }); },
    pk_football(g) { G.circ(g, 0, 0, 38, '#fff', 4.5); const pent = (x, y, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#2a2a35'; g.fill(); }; pent(0, 0, 13); [[0, -28], [27, -9], [17, 23], [-17, 23], [-27, -9]].forEach(p => pent(p[0], p[1], 8)); G.circ(g, 0, 0, 38, null, 4.5); },
    pk_goal(g) { G.fillRR(g, -44, -30, 88, 62, 4, 'rgba(255,255,255,.35)', 0); for (let i = -40; i <= 40; i += 10) G.line(g, i, -30, i, 32, 1.5, 'rgba(255,255,255,.8)'); for (let j = -30; j <= 32; j += 10) G.line(g, -44, j, 44, j, 1.5, 'rgba(255,255,255,.8)'); G.line(g, -44, 32, -44, -30, 8); G.line(g, -44, -30, 44, -30, 8); G.line(g, 44, -30, 44, 32, 8); G.line(g, -44, 32, -44, -30, 4, '#fff'); G.line(g, -44, -30, 44, -30, 4, '#fff'); G.line(g, 44, -30, 44, 32, 4, '#fff'); },
    pk_whistle(g) { G.ell(g, -8, 6, 24, 20, '#c8cfdc', 4.5); rr(g, 8, -10, 34, 16, 6, '#c8cfdc', 4.5); G.circ(g, -10, 8, 6, '#2a2a35', 0); G.line(g, -28, -10, -40, -26, 3.5); },
    pk_trophy(g) { rr(g, -10, 18, 20, 14, 2, '#ffc93c', 4); rr(g, -22, 30, 44, 12, 4, '#8a5a3a', 4.5); g.beginPath(); g.moveTo(-26, -34); g.lineTo(26, -34); g.quadraticCurveTo(26, 20, 0, 22); g.quadraticCurveTo(-26, 20, -26, -34); G.fs(g, '#ffd23c', 4.5); [-1, 1].forEach(s => { g.beginPath(); g.arc(s * 28, -18, 10, s > 0 ? -1.6 : 1.6, s > 0 ? 1.6 : -1.6, s < 0); g.lineWidth = 5; g.strokeStyle = OL; g.stroke(); }); G.star(g, 0, -10, 12, '#fff', 2.5); },
    pk_balloon(g, o) { const c = C[(o.args && o.args[0]) || 'red'] || '#ef5350'; G.ell(g, 0, -10, 26, 32, c, 4.5); G.poly(g, [[-5, 22], [5, 22], [0, 30]], c, 3); g.beginPath(); g.moveTo(0, 30); g.bezierCurveTo(-10, 38, 10, 44, 0, 50); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); G.ell(g, -9, -20, 6, 10, 'rgba(255,255,255,.5)', 0, null, .3); },
    pk_lion(g) { for (let i = 0; i < 12; i++) { const a = i * .5236; G.circ(g, Math.cos(a) * 32, Math.sin(a) * 32, 15, '#c9822a', 3.5); } G.circ(g, 0, 0, 34, '#d9953a', 0); G.circ(g, 0, 2, 26, '#f6bf55', 4); [-18, 18].forEach(x => G.circ(g, x, -22, 8, '#f6bf55', 3.5)); [-9, 9].forEach(x => { G.circ(g, x, -4, 3.8, '#2a1a10', 0); }); G.poly(g, [[-5, 4], [5, 4], [0, 10]], '#c25a4a', 2.5); g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 15); g.moveTo(-8, 18); g.quadraticCurveTo(0, 14, 8, 18); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    pk_elephant(g) { [-1, 1].forEach(s => { G.ell(g, s * 34, -4, 18, 28, '#a9b6cf', 4.5); G.ell(g, s * 32, -2, 10, 18, '#ffb8c8', 0); }); G.circ(g, 0, -6, 31, '#b9c6de', 4.5); g.beginPath(); g.moveTo(-9, 10); g.quadraticCurveTo(-12, 40, 4, 44); g.quadraticCurveTo(18, 44, 16, 30); g.lineWidth = 19; g.strokeStyle = OL; g.stroke(); g.lineWidth = 12; g.strokeStyle = '#b9c6de'; g.stroke(); [-11, 11].forEach(x => { G.circ(g, x, -12, 3.8, '#2a1a10', 0); }); [-18, 18].forEach(x => G.poly(g, [[x, 8], [x + (x < 0 ? -4 : 4), 24], [x + (x < 0 ? 4 : -4), 12]], '#fff', 2.5)); },
    pk_giraffe(g) { [-18, 18].forEach(x => G.line(g, x, 34, x, 48, 7)); [-18, 18].forEach(x => G.line(g, x, 34, x, 48, 3.5, '#f2b84a')); G.ell(g, 0, 30, 32, 16, '#f6c25a', 4.5); rr(g, -8, -26, 22, 56, 8, '#f6c25a', 4.5); G.ell(g, 8, -34, 21, 14, '#f6c25a', 4.5, null, -.15); [-4, 18].forEach(x => { G.line(g, x, -46, x - 2, -56, 3.5); G.circ(g, x - 2, -57, 4, '#8a5a3a', 2.5); }); G.circ(g, 14, -37, 3.2, '#2a1a10', 0); G.ell(g, 24, -30, 7, 5, '#e9a845', 2.5); [[-2, -10], [4, 4], [-4, 18], [-14, 28], [12, 28], [16, -6]].forEach(p => G.circ(g, p[0], p[1], 4.5, '#b9762a', 0)); },
    pk_monkey(g) { [-1, 1].forEach(s => G.circ(g, s * 30, -4, 12, '#9b6a3c', 4)); G.circ(g, 0, -4, 30, '#9b6a3c', 4.5); G.ell(g, 0, 6, 22, 20, '#f0cfa2', 3); [-10, 10].forEach(x => { G.circ(g, x, -10, 6, '#fff', 2.5); G.circ(g, x, -9, 3, '#2a1a10', 0); }); G.circ(g, 0, 4, 3, '#4a2a1a', 0); g.beginPath(); g.arc(0, 8, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); G.ell(g, 0, 40, 18, 12, '#9b6a3c', 4); },
    pk_parrot(g) { G.line(g, -30, 46, 36, 46, 5, '#8a5a3a'); [-10, 2, 14].forEach((x, i) => G.poly(g, [[x - 6, 24], [x + 6, 24], [x + (i - 1) * 8, 48]], ['#ef5350', '#ffd23c', '#4a8dff'][i], 3)); G.ell(g, 0, 8, 22, 30, '#5cc96b', 4.5); G.ell(g, -8, 10, 10, 20, '#2f8a44', 3, null, .2); G.circ(g, 6, -26, 17, '#5cc96b', 4.5); G.circ(g, 11, -29, 4.5, '#fff', 2.5); G.circ(g, 12, -29, 2, '#2a1a10', 0); g.beginPath(); g.moveTo(18, -26); g.quadraticCurveTo(34, -26, 26, -10); g.quadraticCurveTo(22, -16, 18, -18); g.closePath(); G.fs(g, '#ff8a2a', 3.5); },
    pk_rabbit(g) { [-1, 1].forEach(s => { G.ell(g, s * 12, -38, 9, 26, '#fff', 4, null, s * .12); G.ell(g, s * 12, -38, 4, 17, '#ffb8c8', 0, null, s * .12); }); G.ell(g, 0, 30, 24, 16, '#fff', 4); G.circ(g, 0, 0, 26, '#fff', 4.5); [-9, 9].forEach(x => G.circ(g, x, -4, 3.4, '#2a1a10', 0)); G.circ(g, 0, 6, 4, '#ff8fa8', 2); g.beginPath(); g.moveTo(0, 10); g.lineTo(0, 15); g.lineWidth = 2.5; g.strokeStyle = OL; g.stroke(); rr(g, -5, 14, 10, 8, 2, '#fff', 2.5); [-1, 1].forEach(s => { G.line(g, s * 8, 8, s * 28, 4, 2); G.line(g, s * 8, 10, s * 28, 14, 2); }); },
    pk_turtle(g) { [-26, 26].forEach(x => G.ell(g, x, 24, 10, 8, '#8fcf6a', 3.5)); G.ell(g, 36, 6, 14, 12, '#8fcf6a', 4); G.circ(g, 40, 3, 2.6, '#2a1a10', 0); g.beginPath(); g.ellipse(0, 12, 36, 30, 0, Math.PI, 0); g.closePath(); G.fs(g, '#4fa04a', 4.5); [[-16, 0], [4, -8], [20, 2], [-4, 12]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 8, 0, 6.3); g.lineWidth = 2.5; g.strokeStyle = 'rgba(40,80,30,.6)'; g.stroke(); }); G.line(g, -36, 12, 36, 12, 4); },
    pk_kitten(g) { [-1, 1].forEach(s => G.poly(g, [[s * 10, -28], [s * 26, -44], [s * 28, -20]], '#ff9a4a', 4)); G.ell(g, 0, 32, 20, 14, '#ff9a4a', 4); G.circ(g, 0, -6, 28, '#ff9a4a', 4.5); [-10, 0, 10].forEach(x => G.line(g, x, -32, x, -24, 3, '#d9742a')); [-11, 11].forEach(x => { G.circ(g, x, -6, 6, '#fff', 2.5); G.circ(g, x, -5, 3.4, '#2a1a10', 0); }); G.poly(g, [[-3.5, 4], [3.5, 4], [0, 8]], '#ff6f91', 2); g.beginPath(); g.moveTo(0, 8); g.lineTo(0, 11); g.moveTo(-7, 14); g.quadraticCurveTo(0, 10, 7, 14); g.lineWidth = 2.4; g.strokeStyle = OL; g.stroke(); [-1, 1].forEach(s => { G.line(g, s * 12, 6, s * 30, 2, 2); G.line(g, s * 12, 9, s * 30, 12, 2); }); },
    pk_fish(g) { G.poly(g, [[22, 0], [44, -16], [44, 16]], '#ff8a2a', 4); G.ell(g, 0, 0, 28, 18, '#ffa94a', 4.5); G.circ(g, -14, -4, 4.5, '#fff', 2.5); G.circ(g, -15, -4, 2, '#2a1a10', 0); G.line(g, 4, -12, 4, 12, 3, '#e0742a'); G.line(g, 14, -9, 14, 9, 3, '#e0742a'); },
    pk_leaf(g) { g.save(); g.rotate(-.6); g.beginPath(); g.moveTo(0, -42); g.quadraticCurveTo(34, -10, 0, 42); g.quadraticCurveTo(-34, -10, 0, -42); G.fs(g, '#5cc96b', 4.5); G.line(g, 0, -34, 0, 42, 3.5, '#2f8a44'); g.restore(); },
    pk_meat(g) { g.save(); g.rotate(.5); G.ell(g, 0, -12, 24, 28, '#b0522a', 4.5); G.ell(g, -6, -18, 8, 10, '#d9784a', 0); rr(g, -5, 14, 10, 24, 4, '#f6e8c8', 4); G.circ(g, -6, 40, 6, '#f6e8c8', 3.5); G.circ(g, 6, 40, 6, '#f6e8c8', 3.5); g.restore(); },
    pk_sign(g) { rr(g, -4, 10, 8, 38, 2, '#8a5a3a', 3.5); rr(g, -34, -42, 68, 56, 10, '#fff', 4.5); G.circ(g, 0, -14, 20, null, 0); g.beginPath(); g.arc(0, -14, 19, 0, 6.3); g.lineWidth = 6; g.strokeStyle = '#ef5350'; g.stroke(); G.line(g, -13, -27, 13, -1, 6, '#ef5350'); A.draw(g, 'banana', 0, -14, 22); },
    pk_jersey(g, o) { const c = C[(o.args && o.args[0]) || 'red'] || '#ef5350'; G.poly(g, [[-18, -34], [-6, -40], [6, -40], [18, -34], [42, -14], [32, 6], [20, -2], [20, 38], [-20, 38], [-20, -2], [-32, 6], [-42, -14]], c, 4.5); G.text(g, (o.args && o.args[1]) || '٧', 0, 8, { size: 30, color: '#fff', stroke: OL, sw: 4 }); },
    pk_cone(g) { G.poly(g, [[-8, -34], [8, -34], [26, 34], [-26, 34]], '#ff8a2a', 4.5); G.fillRR(g, -12, -10, 24, 9, 0, '#fff', 0); G.fillRR(g, -34, 30, 68, 10, 4, '#e0742a', 4); }
  });

  /* ------------------------------------------------------------------ backgrounds */
  function sky(g, t, top, bot, sunx) {
    g.fillStyle = G.lin(g, 0, 0, 0, 400, [top || '#7fd0ff', bot || '#dff3ff']); g.fillRect(0, 0, 960, 430);
    G.sun(g, sunx || 830, 92, 32, t); [[120, 110, 1.3], [420, 80, 1], [660, 130, 1.1]].forEach((c, i) => G.cloud(g, ((c[0] + t * (6 + i * 3)) % 1180) - 120, c[1], c[2], .85));
  }
  function hills(g, y) {
    g.fillStyle = '#a8e0a0'; g.beginPath(); g.moveTo(0, y + 30); g.quadraticCurveTo(200, y - 50, 420, y + 20); g.quadraticCurveTo(650, y + 70, 960, y - 20); g.lineTo(960, 540); g.lineTo(0, 540); g.fill();
    g.fillStyle = '#92d68c'; g.beginPath(); g.moveTo(0, y + 60); g.quadraticCurveTo(300, y + 10, 560, y + 50); g.quadraticCurveTo(800, y + 80, 960, y + 40); g.lineTo(960, 540); g.lineTo(0, 540); g.fill();
  }
  function trees(g, y, n) { for (let i = 0; i < n; i++) A.draw(g, 'pk_tree', 40 + i * (900 / (n - 1)) + (i % 2) * 22, y + (i % 3) * 8, 118 + (i % 2) * 34); }
  function grass(g, y) { g.fillStyle = G.lin(g, 0, y, 0, 540, ['#86d17f', '#5cb85c']); g.fillRect(0, y, 960, 540 - y); G.line(g, 0, y, 960, y, 3, 'rgba(60,110,50,.5)'); g.strokeStyle = 'rgba(40,110,50,.35)'; g.lineWidth = 3; for (let i = 0; i < 40; i++) { const x = (i * 97) % 960, yy = y + 14 + (i * 53) % (540 - y - 20); g.beginPath(); g.moveTo(x, yy); g.lineTo(x - 3, yy - 9); g.moveTo(x + 5, yy); g.lineTo(x + 7, yy - 8); g.stroke(); } }
  function path(g) { g.fillStyle = '#ecd7a8'; g.beginPath(); g.moveTo(330, 430); g.quadraticCurveTo(500, 410, 640, 430); g.lineTo(900, 540); g.lineTo(80, 540); g.closePath(); g.fill(); g.strokeStyle = 'rgba(120,80,30,.25)'; g.lineWidth = 3; g.stroke(); }
  function fence(g, y, c) { rr(g, -10, y, 980, 9, 3, c || '#c8935a', 3.5); for (let x = 6; x < 960; x += 44) { rr(g, x, y - 26, 14, 56, 3, c || '#c8935a', 3.5); } }

  const HIDE = [{ x: 150, y: 372, art: 'pk_bush', s: 180 }, { x: 420, y: 330, art: 'pk_tree', s: 230 }, { x: 660, y: 392, art: 'pk_bench', s: 180 }, { x: 850, y: 352, art: 'pk_slide', s: 210 }];
  M.parkHide = HIDE;

  R.pkPark = function (g, t, s) {
    const S = s.state, kind = S.kind || 'plain';
    sky(g, t); hills(g, 330); trees(g, 318, 8); grass(g, 392);
    if (kind === 'pitch') {
      for (let i = 0; i < 6; i++) { g.fillStyle = i % 2 ? '#6fc96a' : '#7ed476'; g.beginPath(); g.moveTo(480 + (i - 3) * 60, 392); g.lineTo(480 + (i - 2) * 60, 392); g.lineTo(480 + (i - 2) * 190 - 190 * 0 - 0, 540); g.lineTo(480 + (i - 3) * 190, 540); g.closePath(); g.fill(); }
      g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 5; g.beginPath(); g.moveTo(130, 540); g.lineTo(260, 392); g.lineTo(700, 392); g.lineTo(830, 540); g.stroke(); g.beginPath(); g.ellipse(480, 470, 110, 34, 0, 0, 6.3); g.stroke(); g.beginPath(); g.moveTo(480, 392); g.lineTo(480, 506); g.stroke();
      if (!S.noGoal) { A.draw(g, 'pk_goal', 230, 372, 150); A.draw(g, 'pk_goal', 730, 372, 150); }
      if (!S.noCrowd) [['pk_kid:red', 70, 400], ['pk_kid:blue:d', 150, 396], ['pk_kid:green', 810, 398], ['pk_kid:purple:l:g', 890, 402]].forEach((k, i) => { const jump = Math.abs(Math.sin(t * 3 + i)) * 6; A.draw(g, k[0], k[1], k[2] - jump - 20, 92); });
      if (S.cones) [[300, 452], [660, 452]].forEach(c => A.draw(g, 'pk_cone', c[0], c[1], 44));
    } else {
      path(g); fence(g, 392, '#d9a66e');
      for (let i = 0; i < 9; i++) A.draw(g, 'pk_flower:' + ['pink', 'yellow', 'red', 'white', 'purple'][i % 5], 30 + i * 112 + (i % 2) * 20, 452 + (i * 17) % 40, 46);
    }
    if (kind === 'swings') {
      if (!S.noSwing) {
        const sx = 430, top = 220, L = 120, a = Math.sin(t * 1.9) * .5;
        G.line(g, sx - 120, 420, sx - 70, top, 10); G.line(g, sx + 120, 420, sx + 70, top, 10); G.line(g, sx - 120, 420, sx - 70, top, 5, '#e07a4a'); G.line(g, sx + 120, 420, sx + 70, top, 5, '#e07a4a'); G.line(g, sx - 80, top, sx + 80, top, 11); G.line(g, sx - 80, top, sx + 80, top, 6, '#ef8a5a');
        [[-30, 1], [30, 0]].forEach(([dx, kid]) => { const aa = kid ? a : a * .5 + .3, px = sx + dx + Math.sin(aa) * L, py = top + Math.cos(aa) * L; G.line(g, sx + dx - 14, top, px - 14, py, 3); G.line(g, sx + dx + 14, top, px + 14, py, 3); if (kid && !S.noKid) A.draw(g, 'pk_kid:orange', px, py - 30, 70); rr(g, px - 22, py - 4, 44, 9, 4, '#8a5a3a', 3.5); });
        if (!S.noQueue) [['pk_kid:blue', 690, 462], ['pk_kid:pink:l:g', 760, 470]].forEach(k => A.draw(g, k[0], k[1], k[2] - 24, 100));
      }
      A.draw(g, 'pk_slide', 850, 340, 200); A.draw(g, 'pk_bench', 120, 400, 150);
      if (S.smallKid) { A.draw(g, 'pk_kid:pink:l:g', S.smallKid.x || 560, S.smallKid.y || 440, 96); if (S.smallKid.balloon) A.draw(g, 'pk_balloon:red', (S.smallKid.x || 560) + 30, (S.smallKid.y || 440) - 74 + Math.sin(t * 2) * 4, 52); }
      if (S.balloonStuck) { A.draw(g, 'pk_tree', 290, 300, 270); G.line(g, 290, 214, 290, 196, 2.5, '#8a8aa0'); A.draw(g, 'pk_balloon:red', 290, 178, 66); }
    }
    if (kind === 'hide') HIDE.forEach(p => { if (p.art === 'pk_tree') A.draw(g, p.art, p.x, p.y, p.s); });
    if (kind === 'hide') HIDE.forEach(p => { if (p.art !== 'pk_tree') A.draw(g, p.art, p.x, p.y, p.s); });
    if (kind === 'plain' && S.bag) A.draw(g, S.bag, 480, 440, 120);
  };

  R.pkGarden = function (g, t, s) {
    const S = s.state; sky(g, t, '#8fd8ff', '#e8f8ff', 780); hills(g, 320); fence(g, 330, '#e8d2a8');
    // shed
    rr(g, 770, 190, 160, 150, 6, '#c8935a', 5); G.poly(g, [[756, 192], [850, 140], [944, 192]], '#b9533a', 5); rr(g, 820, 250, 54, 90, 4, '#8a5a3a', 4); G.circ(g, 866, 296, 3.5, '#ffd23c', 2);
    trees(g, 300, 4); grass(g, 380);
    // beds
    [[70, 250], [350, 250], [630, 160]].forEach((b, i) => {
      const x = b[0], w = b[1]; rr(g, x, 392, w, 66, 10, '#8a5a3a', 5); rr(g, x + 8, 386, w - 16, 20, 8, '#6a4426', 3);
      for (let k = 0; k < 4; k++) { const px = x + 30 + k * ((w - 60) / 3); if (S.bloom) A.draw(g, 'pk_flower:' + ['pink', 'yellow', 'red', 'purple'][(i + k) % 4], px, 372, 64); else if (S.sprouts) A.draw(g, 'pk_sprout', px, 380, 40); else G.ell(g, px, 400, 14, 5, 'rgba(40,20,5,.35)', 0); }
    });
    if (S.hose && S.tapSpot) { const tx = S.tapSpot.x, ty = S.tapSpot.y + 22; g.beginPath(); g.moveTo(tx, ty); g.bezierCurveTo(tx + 10, ty + 90, tx + 90, ty + 40, tx + 120, ty + 140); g.lineWidth = 12; g.strokeStyle = OL; g.stroke(); g.lineWidth = 7; g.strokeStyle = '#5cc96b'; g.stroke(); if (!S.tapOff) for (let i = 0; i < 4; i++) G.ell(g, tx + 120 + (i % 2) * 8, ty + 150 + ((t * 100 + i * 17) % 34), 4, 7, '#4aa8e8', 1.5); }
    if (S.tapSpot) A.draw(g, 'tap', S.tapSpot.x, S.tapSpot.y, 90, { drip: !S.tapOff });
    if (S.bees) S.bees.forEach((b, i) => A.draw(g, b.art, b.x + Math.sin(t * 2 + i) * 12, b.y + Math.cos(t * 2.4 + i) * 8, b.s || 44));
  };

  const ZOO_HIDE = [{ x: 90, y: 438, art: 'pk_bush', s: 150 }, { x: 480, y: 444, art: 'pk_bench', s: 150 }, { x: 880, y: 438, art: 'barrels', s: 120 }];
  M.zooHide = ZOO_HIDE;
  A.register('barrels', (g) => { [[-18, 8], [18, 8], [0, -22]].forEach(p => { G.fillRR(g, p[0] - 17, p[1] - 22, 34, 44, 8, '#c8935a', 4.5); G.line(g, p[0] - 17, p[1] - 8, p[0] + 17, p[1] - 8, 3); G.line(g, p[0] - 17, p[1] + 8, p[0] + 17, p[1] + 8, 3); }); });
  R.pkZoo = function (g, t, s) {
    const S = s.state; sky(g, t, '#8fd8ff', '#fdf3d0', 800); hills(g, 300); trees(g, 280, 6);
    // enclosures (back)
    const enc = [[30, 'pk_lion', '#e8c98a', 84], [270, 'pk_giraffe', '#c9e6a0', 120], [510, 'pk_elephant', '#e0d3b0', 120], [750, 'pk_monkey', '#c9e6a0', 84]];
    enc.forEach((e, i) => {
      const x = e[0]; rr(g, x, 214, 190, 190, 12, e[2], 5);
      if (i === 3) { G.line(g, x + 140, 214, x + 140, 330, 8, '#8a5a3a'); G.line(g, x + 100, 250, x + 180, 240, 6, '#8a5a3a'); }
      const bob = Math.sin(t * 1.5 + i) * 4; const ay = e[1] === 'pk_giraffe' ? 318 : 322 + bob;
      if (!(S.hideAnimals && S.hideAnimals.indexOf(e[1]) >= 0)) A.draw(g, e[1], x + 95 + (e[1] === 'pk_monkey' ? Math.sin(t * 2) * 24 : 0), ay + (e[1] === 'pk_giraffe' ? 0 : -6), e[3] * 1.4);
    });
    grass(g, 400); g.fillStyle = '#ecd7a8'; g.fillRect(0, 436, 960, 104); G.line(g, 0, 436, 960, 436, 4);
    // bars in front of animals
    enc.forEach(e => { const x = e[0]; rr(g, x - 4, 384, 198, 14, 5, '#6e7791', 4); for (let k = 0; k < 8; k++) rr(g, x + 4 + k * 24, 346, 7, 42, 3, '#9aa0b5', 3); rr(g, x - 4, 342, 198, 10, 4, '#6e7791', 4); });
    // gate banner
    rr(g, 300, 100, 360, 50, 14, '#ffd23c', 5); G.text(g, 'حديقة الحيوان الصغيرة', 480, 126, { size: 30, color: '#8a2a00' });
    A.draw(g, 'pk_sign', 925, 350, 80);
    if (S.hideKitten) ZOO_HIDE.forEach(p => A.draw(g, p.art, p.x, p.y, p.s));
  };
})();
