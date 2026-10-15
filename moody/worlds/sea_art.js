/* Moody & Aboody - worlds/sea_art.js : props + backgrounds of WORLD 6 (sea trip). Props are prefixed sa_.
   Backgrounds (Moody.rooms): saSea (state: kind, sun 0..1.2, stars, umbrella), saHome, saCar (state: still, near, belt flags).
   Depends on park_kits.js (Moody.pk.lerpHex). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {}, PK = M.pk;
  const rr = G.fillRR, lerp = (a, b, k) => a + (b - a) * k;
  const FL = { red: '#ef5350', yellow: '#ffd23c', green: '#5cc96b', blue: '#4a8dff', orange: '#ff8a2a', pink: '#ff6f91', purple: '#8a6bd6' };

  A.registerAll({
    sa_shell(g) { g.beginPath(); g.moveTo(-4, 38); g.bezierCurveTo(-46, 24, -48, -30, -24, -36); g.quadraticCurveTo(0, -46, 24, -36); g.bezierCurveTo(48, -30, 46, 24, 4, 38); g.closePath(); G.fs(g, '#ffd6c4', 4.5); for (let i = -3; i <= 3; i++) G.line(g, 0, 36, i * 12, -32 + Math.abs(i) * 3, 3, '#e8a58c'); rr(g, -10, 34, 20, 10, 4, '#f2b79e', 3.5); },
    sa_spiral(g) { g.beginPath(); g.moveTo(-34, 30); g.quadraticCurveTo(-6, -50, 30, -22); g.quadraticCurveTo(46, 14, 10, 36); g.quadraticCurveTo(-14, 44, -34, 30); G.fs(g, '#f2c27a', 4.5); g.beginPath(); g.moveTo(14, -6); g.quadraticCurveTo(24, 10, 4, 20); g.quadraticCurveTo(-10, 18, -2, 6); g.lineWidth = 3; g.strokeStyle = '#b9782a'; g.stroke(); G.line(g, -22, 22, 2, -22, 3, '#d99a4a'); G.line(g, -12, 28, 14, -14, 3, '#d99a4a'); },
    sa_star(g) { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, r = i % 2 ? 17 : 44; g.lineTo(Math.cos(a) * r, Math.sin(a) * r + 2); } g.closePath(); G.fs(g, '#ff9a3a', 4.5); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + i * 1.2566; G.circ(g, Math.cos(a) * 24, Math.sin(a) * 24 + 2, 2.8, '#ffd27a', 0); } G.circ(g, 0, 2, 4, '#ffd27a', 0); },
    sa_crab(g) { [-1, 1].forEach(s => { for (let i = 0; i < 3; i++) G.line(g, s * 22, 8 + i * 8, s * (40 + i * 2), 20 + i * 10, 4); G.line(g, s * 24, -6, s * 38, -26, 5); G.circ(g, s * 40, -32, 11, '#ef5350', 4); G.poly(g, [[s * 36, -38], [s * 44, -44], [s * 46, -34]], '#d63c3a', 2.5); }); G.ell(g, 0, 10, 30, 22, '#ef5350', 4.5); [-9, 9].forEach(x => { G.line(g, x, -8, x, -18, 3.5); G.circ(g, x, -20, 6, '#fff', 3); G.circ(g, x + 1, -20, 2.5, '#2a1a10', 0); }); g.beginPath(); g.arc(0, 14, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    sa_fish(g) { G.poly(g, [[20, 0], [44, -18], [44, 18]], '#ffd23c', 4); G.ell(g, 0, 0, 28, 20, '#4a8dff', 4.5); G.poly(g, [[-4, -18], [10, -30], [14, -16]], '#ffd23c', 3.5); G.circ(g, -14, -4, 5, '#fff', 2.5); G.circ(g, -15, -4, 2.2, '#2a1a10', 0); G.line(g, 4, -14, 4, 14, 3, '#2f6fe0'); G.line(g, 12, -11, 12, 11, 3, '#2f6fe0'); g.beginPath(); g.arc(-18, 6, 5, .3, 2.2); g.lineWidth = 2.4; g.strokeStyle = OL; g.stroke(); },
    sa_jelly(g) { for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 10, 6); g.quadraticCurveTo(i * 10 + 8, 20, i * 10 - 2, 30); g.quadraticCurveTo(i * 10 + 6, 38, i * 10, 46); g.lineWidth = 3.5; g.strokeStyle = '#b48ae0'; g.stroke(); } g.beginPath(); g.moveTo(-34, 8); g.quadraticCurveTo(-34, -40, 0, -40); g.quadraticCurveTo(34, -40, 34, 8); g.quadraticCurveTo(18, 0, 0, 8); g.quadraticCurveTo(-18, 0, -34, 8); G.fs(g, 'rgba(200,160,240,.92)', 4.5); [-10, 10].forEach(x => G.circ(g, x, -12, 3.5, '#2a1a10', 0)); G.ell(g, -14, -26, 8, 5, 'rgba(255,255,255,.5)', 0); },
    sa_seahorse(g) { g.beginPath(); g.moveTo(8, -36); g.quadraticCurveTo(34, -34, 24, -12); g.quadraticCurveTo(10, 2, 16, 22); g.quadraticCurveTo(22, 44, -2, 40); g.quadraticCurveTo(-14, 36, -6, 26); g.lineWidth = 17; g.strokeStyle = OL; g.stroke(); g.lineWidth = 10; g.strokeStyle = '#ffb52e'; g.stroke(); G.ell(g, -4, -34, 14, 11, '#ffb52e', 4.5); G.poly(g, [[-14, -34], [-34, -30], [-14, -26]], '#ffb52e', 3.5); G.circ(g, 0, -38, 3.6, '#2a1a10', 0); [-18, -8, 2].forEach((y, i) => G.line(g, 14, y + 10 + i * 6, 22, y + 8 + i * 6, 3, '#e0902a')); },
    sa_octopus(g) { for (let i = 0; i < 8; i++) { const x = -32 + i * 9; g.beginPath(); g.moveTo(x * .6, 10); g.quadraticCurveTo(x * 1.3, 34, x + (i % 2 ? 6 : -6), 44); g.lineWidth = 9; g.strokeStyle = OL; g.stroke(); g.lineWidth = 5; g.strokeStyle = '#a06be0'; g.stroke(); } g.beginPath(); g.moveTo(-32, 14); g.quadraticCurveTo(-36, -42, 0, -42); g.quadraticCurveTo(36, -42, 32, 14); g.closePath(); G.fs(g, '#a06be0', 4.5); [-11, 11].forEach(x => { G.circ(g, x, -8, 8, '#fff', 3); G.circ(g, x, -7, 3.6, '#2a1a10', 0); }); g.beginPath(); g.arc(0, 4, 8, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    sa_dolphin(g) { g.beginPath(); g.moveTo(-44, 22); g.quadraticCurveTo(-30, -34, 12, -30); g.quadraticCurveTo(36, -28, 46, -10); g.quadraticCurveTo(34, -12, 26, -4); g.quadraticCurveTo(26, 22, -6, 30); g.quadraticCurveTo(-26, 34, -44, 22); G.fs(g, '#7aa9d9', 4.5); G.poly(g, [[-44, 22], [-56, 8], [-52, 34]], '#7aa9d9', 3.5); G.poly(g, [[-4, -30], [6, -50], [16, -28]], '#6890c4', 3.5); g.beginPath(); g.moveTo(-20, 24); g.quadraticCurveTo(10, 28, 24, 2); g.quadraticCurveTo(10, 30, -20, 28); g.fillStyle = '#e8f2fc'; g.fill(); G.circ(g, 26, -14, 2.8, '#2a1a10', 0); },
    sa_turtle(g) { [[-24, 20], [24, 20]].forEach(p => G.ell(g, p[0], p[1], 14, 8, '#7bc96a', 3.5)); G.ell(g, 36, -4, 15, 12, '#7bc96a', 4); G.circ(g, 41, -7, 2.6, '#2a1a10', 0); G.ell(g, 0, 4, 38, 28, '#3f9a4f', 4.5); [[-14, -2], [6, -8], [20, 2], [-2, 12]].forEach(p => { g.beginPath(); g.arc(p[0], p[1], 8, 0, 6.3); g.lineWidth = 2.5; g.strokeStyle = 'rgba(30,80,40,.6)'; g.stroke(); }); G.poly(g, [[-38, 6], [-50, 12], [-38, 14]], '#7bc96a', 3); },
    sa_bucket(g, o) { const c = (o.args && FL[o.args[0]]) || '#ef5350'; g.beginPath(); g.moveTo(-32, -18); g.lineTo(32, -18); g.lineTo(24, 36); g.lineTo(-24, 36); g.closePath(); G.fs(g, c, 4.5); G.ell(g, 0, -18, 32, 8, G.shade(c, -.25), 4); G.ell(g, 0, -18, 26, 5, '#e8c488', 0); g.beginPath(); g.arc(0, -18, 28, Math.PI * 1.05, Math.PI * 1.95); g.lineWidth = 4.5; g.strokeStyle = OL; g.stroke(); G.line(g, -22, -4, -16, 28, 3, 'rgba(255,255,255,.4)'); },
    sa_spade(g) { G.line(g, 0, -42, 0, 8, 8); G.line(g, 0, -42, 0, 8, 4, '#c8935a'); rr(g, -10, -46, 20, 10, 4, '#4a8dff', 3.5); G.poly(g, [[-16, 6], [16, 6], [12, 40], [0, 46], [-12, 40]], '#4a8dff', 4.5); },
    /* sand-castle pieces (placed shapes) */
    sa_wall(g) { rr(g, -44, -14, 88, 52, 6, '#e8c488', 4.5); for (let i = 0; i < 4; i++) rr(g, -42 + i * 22, -28, 16, 16, 3, '#e8c488', 4); G.line(g, -30, 6, 30, 6, 2.5, 'rgba(160,110,40,.45)'); G.line(g, -20, 22, 36, 22, 2.5, 'rgba(160,110,40,.45)'); },
    sa_tower(g) { rr(g, -22, -24, 44, 70, 6, '#e8c488', 4.5); for (let i = 0; i < 3; i++) rr(g, -24 + i * 17, -40, 15, 18, 3, '#e8c488', 4); G.line(g, -12, 0, 14, 0, 2.5, 'rgba(160,110,40,.45)'); G.line(g, -8, 20, 16, 20, 2.5, 'rgba(160,110,40,.45)'); },
    sa_door(g) { g.beginPath(); g.moveTo(-18, 40); g.lineTo(-18, -4); g.quadraticCurveTo(-18, -30, 0, -30); g.quadraticCurveTo(18, -30, 18, -4); g.lineTo(18, 40); g.closePath(); G.fs(g, '#8a5a3a', 4.5); G.line(g, 0, -28, 0, 40, 3); G.circ(g, 8, 10, 3, '#ffd23c', 2); },
    sa_window(g) { g.beginPath(); g.moveTo(-14, 24); g.lineTo(-14, -6); g.quadraticCurveTo(-14, -26, 0, -26); g.quadraticCurveTo(14, -26, 14, -6); g.lineTo(14, 24); g.closePath(); G.fs(g, '#6a4a2a', 4); },
    sa_flagc(g) { G.line(g, -6, 44, -6, -40, 5); G.poly(g, [[-6, -40], [32, -28], [-6, -16]], '#ef5350', 4); G.circ(g, -6, -42, 4, '#ffd23c', 2.5); },
    sa_flag(g, o) { const c = FL[(o.args && o.args[0]) || 'red']; G.line(g, -22, 46, -22, -40, 6); g.beginPath(); g.moveTo(-22, -38); g.quadraticCurveTo(0, -48, 20, -34); g.quadraticCurveTo(34, -28, 40, -30); g.lineTo(40, -2); g.quadraticCurveTo(24, -6, 14, -8); g.quadraticCurveTo(-2, -16, -22, -6); g.closePath(); G.fs(g, c, 4.5); G.circ(g, -22, -42, 4.5, '#8a5a3a', 2.5); },
    sa_lifejacket(g) { G.poly(g, [[-30, -34], [-10, -38], [-8, -26], [8, -26], [10, -38], [30, -34], [34, 36], [4, 40], [4, -10], [-4, -10], [-4, 40], [-34, 36]], '#ff8a2a', 4.5); G.line(g, -26, 18, -8, 18, 4, '#ffd23c'); G.line(g, 8, 18, 26, 18, 4, '#ffd23c'); G.fillRR(g, -8, 4, 16, 8, 2, '#ffd23c', 3); },
    sa_umbrella(g) { G.line(g, 0, -20, 0, 46, 6); g.beginPath(); g.moveTo(-46, -8); g.quadraticCurveTo(-40, -50, 0, -50); g.quadraticCurveTo(40, -50, 46, -8); g.closePath(); G.fs(g, '#fff', 4.5); ['#ef5350', '#ffd23c', '#4a8dff'].forEach((c, i) => { g.save(); g.beginPath(); g.moveTo(-46, -8); g.quadraticCurveTo(-40, -50, 0, -50); g.quadraticCurveTo(40, -50, 46, -8); g.closePath(); g.clip(); G.poly(g, [[-46 + i * 30 - 6, -8], [-46 + i * 30 + 18, -8], [-2 + i * 8 - 4, -52], [-12 + i * 8, -52]], c, 0); g.restore(); }); g.beginPath(); g.moveTo(-46, -8); g.quadraticCurveTo(-40, -50, 0, -50); g.quadraticCurveTo(40, -50, 46, -8); g.quadraticCurveTo(26, -16, 0, -8); g.quadraticCurveTo(-26, -16, -46, -8); g.lineWidth = 4.5; g.strokeStyle = OL; g.stroke(); },
    sa_ball(g) { G.circ(g, 0, 0, 36, '#fff', 4.5); g.save(); g.beginPath(); g.arc(0, 0, 34, 0, 6.3); g.clip(); ['#ef5350', '#ffd23c', '#4a8dff', '#5cc96b'].forEach((c, i) => { g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 40, i * 1.57 + .1, i * 1.57 + .8); g.closePath(); g.fillStyle = c; g.fill(); }); g.restore(); G.circ(g, 0, 0, 8, '#fff', 3); G.circ(g, 0, 0, 36, null, 4.5); },
    sa_swim(g) { G.poly(g, [[-30, -22], [30, -22], [34, 8], [14, 30], [4, 8], [-4, 8], [-14, 30], [-34, 8]], '#1fb5a6', 4.5); G.line(g, -30, -12, 30, -12, 3, '#fff'); G.line(g, -2, -22, -2, -4, 3, '#fff'); [[-18, 4], [18, 4]].forEach(p => G.circ(g, p[0], p[1], 4, '#ffd23c', 2)); },
    sa_flip(g) { g.save(); g.rotate(.2); G.ell(g, 0, 10, 20, 38, '#ff6f91', 4.5); G.ell(g, 0, 12, 13, 30, '#ff9ec0', 0); G.ell(g, 0, 36, 13, 9, '#ff6f91', 0); g.beginPath(); g.moveTo(-14, 2); g.lineTo(0, -16); g.lineTo(14, 2); g.lineWidth = 9; g.strokeStyle = OL; g.stroke(); g.lineWidth = 4.5; g.strokeStyle = '#4a8dff'; g.stroke(); G.circ(g, 0, -16, 4, '#ffd23c', 2.5); g.restore(); },
    sa_cooler(g) { rr(g, -40, -14, 80, 56, 8, '#4a8dff', 4.5); rr(g, -44, -28, 88, 18, 6, '#fff', 4.5); G.line(g, -14, -34, 14, -34, 5); rr(g, -16, 10, 32, 14, 3, '#fff', 3); [0, 1, 2].forEach(i => { const a = i * Math.PI / 3; G.line(g, Math.cos(a) * 9, 17 + Math.sin(a) * 9, -Math.cos(a) * 9, 17 - Math.sin(a) * 9, 2.5, '#4a8dff'); }); },
    sa_sandwich(g) { G.poly(g, [[-38, 8], [0, -26], [38, 8]], '#f3cf8e', 4.5); G.poly(g, [[-34, 8], [0, -6], [34, 8], [30, 16], [-30, 16]], '#5cc96b', 3); G.poly(g, [[-30, 16], [30, 16], [38, 30], [-38, 30]], '#ef7a5a', 3); G.poly(g, [[-38, 30], [38, 30], [0, 6]], '#f3cf8e', 0); G.line(g, -38, 30, 38, 30, 4); G.line(g, -38, 8, -38, 30, 4); G.line(g, 38, 8, 38, 30, 4); },
    sa_boot(g) { G.poly(g, [[-14, -40], [14, -40], [14, 8], [40, 16], [40, 38], [-24, 38], [-24, 10], [-14, 8]], '#8a5a3a', 4.5); rr(g, -16, -44, 34, 12, 4, '#fff', 3.5); G.line(g, -24, 30, 40, 30, 4); },
    sa_belt(g) { G.poly(g, [[-30, -40], [-12, -40], [30, 36], [12, 36]], '#4a4a55', 4); rr(g, 6, 18, 26, 22, 4, '#ef5350', 4); G.circ(g, 19, 29, 4, '#fff', 2); },
    sa_palm(g) { g.beginPath(); g.moveTo(-6, 46); g.quadraticCurveTo(-14, 0, 2, -28); g.lineTo(10, -24); g.quadraticCurveTo(0, 6, 8, 46); g.closePath(); G.fs(g, '#a9762e', 4.5); [-1.9, -1.2, -.5, .3, 1.0, 1.7].forEach(a => { g.save(); g.translate(6, -28); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.quadraticCurveTo(10, -26, 6, -44); g.quadraticCurveTo(-8, -26, 0, 0); G.fs(g, '#4fb85f', 3.5); g.restore(); }); G.circ(g, 4, -26, 5, '#8a5a2b', 2.5); G.circ(g, 12, -24, 5, '#8a5a2b', 2.5); },
    sa_bus(g) { rr(g, -44, -22, 88, 50, 10, '#ffc93c', 4.5); [-30, -10, 10].forEach(x => rr(g, x - 7, -14, 20, 18, 4, '#bfe8ff', 3)); rr(g, 24, -14, 16, 18, 4, '#bfe8ff', 3); G.line(g, -44, 12, 44, 12, 3.5); [-26, 24].forEach(x => { G.circ(g, x, 30, 10, '#3a3a45', 4); G.circ(g, x, 30, 3.5, '#ccc', 0); }); },
    sa_camel(g) { rr(g, -40, 4, 80, 8, 3, '#8a5a3a', 0); g.beginPath(); g.moveTo(-34, 6); g.quadraticCurveTo(-34, -18, -18, -22); g.quadraticCurveTo(-8, -40, 2, -22); g.quadraticCurveTo(16, -40, 24, -20); g.quadraticCurveTo(34, -30, 38, -44); g.lineTo(46, -42); g.quadraticCurveTo(42, -24, 34, 6); g.closePath(); G.fs(g, '#d9a45a', 4.5); [-26, -10, 14, 28].forEach(x => G.line(g, x, 4, x, 36, 6)); [-26, -10, 14, 28].forEach(x => G.line(g, x, 4, x, 36, 3, '#d9a45a')); G.circ(g, 41, -40, 2.6, '#2a1a10', 0); },
    sa_seasign(g) { rr(g, -4, 14, 8, 34, 2, '#6e7791', 3.5); rr(g, -38, -40, 76, 56, 10, '#1fb5a6', 4.5); g.beginPath(); g.moveTo(-28, -14); for (let i = 0; i < 4; i++) g.quadraticCurveTo(-28 + i * 14 + 7, -26, -28 + i * 14 + 14, -14); g.lineWidth = 4; g.strokeStyle = '#fff'; g.stroke(); g.beginPath(); g.moveTo(-28, 0); for (let i = 0; i < 4; i++) g.quadraticCurveTo(-28 + i * 14 + 7, -12, -28 + i * 14 + 14, 0); g.stroke(); },
    sa_boat(g) { G.poly(g, [[-40, 14], [40, 14], [28, 34], [-28, 34]], '#ef5350', 4.5); G.line(g, 0, 14, 0, -44, 4); G.poly(g, [[2, -42], [34, 6], [2, 6]], '#fff', 3.5); G.poly(g, [[-3, -30], [-30, 6], [-3, 6]], '#ffd23c', 3.5); },
    sa_gull(g) { g.beginPath(); g.moveTo(-40, 0); g.quadraticCurveTo(-20, -24, 0, -2); g.quadraticCurveTo(20, -24, 40, 0); g.lineWidth = 7; g.strokeStyle = OL; g.stroke(); g.lineWidth = 3.5; g.strokeStyle = '#fff'; g.stroke(); },
    sa_rock(g) { g.beginPath(); g.moveTo(-42, 36); g.quadraticCurveTo(-44, -10, -16, -30); g.quadraticCurveTo(10, -44, 30, -22); g.quadraticCurveTo(48, 0, 44, 36); g.closePath(); G.fs(g, '#f4eedc', 4.5); G.line(g, -12, -22, -6, 6, 2.5, 'rgba(120,100,60,.5)'); G.line(g, 14, -18, 8, 10, 2.5, 'rgba(120,100,60,.5)'); g.beginPath(); g.moveTo(8, -34); g.quadraticCurveTo(46, -2, 44, 36); g.lineTo(18, 36); g.quadraticCurveTo(26, 0, 8, -34); g.fillStyle = 'rgba(190,170,120,.4)'; g.fill(); },
    sa_dbush(g) { const br = [[-34, -30], [-20, -44], [-6, -50], [10, -46], [26, -38], [38, -22], [-40, -12]]; br.forEach((b, k) => { g.beginPath(); g.moveTo(0, 38); g.quadraticCurveTo(b[0] * .3, 38 + b[1] * .5, b[0], 38 + b[1]); g.lineWidth = 5.5; g.strokeStyle = OL; g.stroke(); g.lineWidth = 2.6; g.strokeStyle = k % 2 ? '#a08a46' : '#8a7a3a'; g.stroke(); [[.55, -8], [.75, 9]].forEach(f => { const x = b[0] * f[0] * .9, y = 38 + b[1] * f[0]; G.line(g, x, y, x + f[1], y - 11, 2.5, '#8a7a3a'); G.circ(g, x + f[1], y - 11, 2.6, '#b0a060', 0); }); }); G.ell(g, 0, 40, 24, 6, '#c9a66a', 2.5); },
    sa_sandpile(g) { g.beginPath(); g.moveTo(-48, 30); g.quadraticCurveTo(-30, -10, 0, -14); g.quadraticCurveTo(30, -10, 48, 30); g.closePath(); G.fs(g, '#e8c488', 4.5); [[-18, 14], [6, 4], [22, 18]].forEach(p => G.circ(g, p[0], p[1], 2.5, 'rgba(160,110,40,.5)', 0)); },
    sa_bag(g) { g.beginPath(); g.arc(0, -20, 20, Math.PI, 0); g.lineWidth = 6; g.strokeStyle = OL; g.stroke(); G.poly(g, [[-36, -18], [36, -18], [40, 38], [-40, 38]], '#ff6f91', 4.5); ['#fff', '#ffd23c'].forEach((c, i) => rr(g, -38 + i * 0, -4 + i * 18, 76, 8, 0, c, 0)); G.poly(g, [[-36, -18], [36, -18], [40, 38], [-40, 38]], null, 4.5); },
    sa_sunart(g) { g.save(); g.beginPath(); g.rect(-50, -50, 100, 62); g.clip(); G.circ(g, 0, 10, 30, '#ffb02e', 4.5); for (let i = 0; i < 9; i++) { const a = Math.PI + i * Math.PI / 8; G.line(g, Math.cos(a) * 36, 10 + Math.sin(a) * 36, Math.cos(a) * 46, 10 + Math.sin(a) * 46, 4); } g.restore(); g.beginPath(); g.moveTo(-46, 14); g.quadraticCurveTo(-30, 8, -14, 14); g.quadraticCurveTo(2, 20, 18, 14); g.quadraticCurveTo(34, 8, 46, 14); g.lineTo(46, 44); g.lineTo(-46, 44); g.closePath(); G.fs(g, '#4aa8c8', 4.5); G.line(g, -20, 28, 20, 28, 3.5, 'rgba(255,255,255,.6)'); G.line(g, -10, 36, 30, 36, 3.5, 'rgba(255,255,255,.5)'); },
    sa_rosette(g) { G.poly(g, [[-18, 10], [-8, 10], [-22, 48], [-30, 38]], '#ef5350', 3.5); G.poly(g, [[18, 10], [8, 10], [22, 48], [30, 38]], '#ef5350', 3.5); for (let i = 0; i < 14; i++) { const a = i * Math.PI * 2 / 14; G.circ(g, Math.cos(a) * 28, Math.sin(a) * 28 - 6, 9, '#ffc93c', 3); } G.circ(g, 0, -6, 24, '#ffd95e', 3.5); G.circ(g, 0, -6, 16, '#fff3c4', 2.5); G.star(g, 0, -5, 11, '#ff8a2a', 2.5); },
    sa_tile(g, o) { A.fns.pk_tile(g, o); },
    sa_car(g) { A.fns.car(g, {}); },
    sa_plate(g, o) { const t = (o.args && o.args[0]) || '٤٥٦'; rr(g, -44, -18, 88, 36, 6, '#fff', 4); rr(g, -44, -18, 20, 36, 6, '#4a8dff', 3.5); G.text(g, t, 8, 2, { size: 22, color: '#2b3a67' }); }
  });

  /* ------------------------------------------------------------------ backgrounds */
  function cliff(g, t) {
    g.beginPath(); g.moveTo(-10, 452); g.lineTo(-10, 176); g.quadraticCurveTo(60, 148, 130, 178); g.lineTo(186, 198); g.quadraticCurveTo(252, 206, 272, 252); g.lineTo(290, 316); g.quadraticCurveTo(316, 372, 304, 452); g.closePath(); G.fs(g, '#f6f0de', 5);
    g.save(); g.beginPath(); g.moveTo(-10, 452); g.lineTo(-10, 176); g.quadraticCurveTo(60, 148, 130, 178); g.lineTo(186, 198); g.quadraticCurveTo(252, 206, 272, 252); g.lineTo(290, 316); g.quadraticCurveTo(316, 372, 304, 452); g.closePath(); g.clip();
    g.fillStyle = 'rgba(226,170,110,.28)'; g.beginPath(); g.moveTo(180, 190); g.quadraticCurveTo(250, 206, 272, 252); g.lineTo(290, 316); g.quadraticCurveTo(316, 372, 304, 452); g.lineTo(230, 452); g.quadraticCurveTo(250, 330, 180, 190); g.fill();
    g.strokeStyle = 'rgba(140,110,60,.4)'; g.lineWidth = 3; [[0, 250, 200, 264], [0, 320, 260, 340], [0, 390, 290, 400]].forEach(l => { g.beginPath(); g.moveTo(l[0], l[1]); g.quadraticCurveTo((l[0] + l[2]) / 2, l[1] - 12, l[2], l[3]); g.stroke(); });
    [[60, 210, 30, 40], [130, 280, 40, 60], [90, 350, 20, 50], [210, 300, 30, 70]].forEach(c => { g.beginPath(); g.moveTo(c[0], c[1]); g.lineTo(c[0] + c[2] * .3, c[1] + c[3] * .5); g.lineTo(c[0] - c[2] * .2, c[1] + c[3]); g.stroke(); });
    g.restore();
    [[30, 170, 80], [108, 178, 66], [168, 196, 58]].forEach(b => A.draw(g, 'sa_dbush', b[0], b[1], b[2]));
  }
  R.saSea = function (g, t, s) {
    const S = s.state, sun = S.sun == null ? .3 : S.sun, kind = S.kind || 'beach', hz = 300;
    const top = PK.lerpHex('#f7a45a', '#6a4a98', Math.min(1, sun * .95)), mid = PK.lerpHex('#ffc47a', '#ff7a5a', Math.min(1, sun)), low = PK.lerpHex('#ffe3a6', '#ffa860', Math.min(1, sun));
    g.fillStyle = G.lin(g, 0, 0, 0, hz, [top, mid, low]); g.fillRect(0, 0, 960, hz + 2);
    if (S.stars) for (let i = 0; i < 22; i++) G.sparkle(g, (i * 211) % 960, 20 + (i * 67) % 150, 2 + i % 3, '#fff6c8', S.stars * (.4 + .4 * Math.sin(t * 2 + i)));
    const sx = S.sunX || 640, sy = 150 + sun * 160; const gl = g.createRadialGradient(sx, sy, 10, sx, sy, 260); gl.addColorStop(0, 'rgba(255,240,170,.85)'); gl.addColorStop(.35, 'rgba(255,190,110,.35)'); gl.addColorStop(1, 'rgba(255,170,100,0)'); g.fillStyle = gl; g.fillRect(0, 0, 960, hz + 10);
    G.circ(g, sx, sy, 46, '#fff1b0', 0); G.circ(g, sx, sy, 36, '#ffd45a', 0);
    // long pink clouds
    [[120, 90, 1], [560, 60, .8], [800, 130, 1.1]].forEach((c, i) => { const x = ((c[0] + t * (4 + i * 2)) % 1200) - 120; g.save(); g.globalAlpha = .7; G.ell(g, x, c[1], 120 * c[2], 14 * c[2], 'rgba(255,214,190,1)', 0); G.ell(g, x + 40, c[1] - 10, 70 * c[2], 10 * c[2], 'rgba(255,236,214,1)', 0); g.restore(); });
    [[300, 120], [380, 150], [470, 105]].forEach((b, i) => A.draw(g, 'sa_gull', b[0] + Math.sin(t * .8 + i) * 30 + (t * 10 + i * 90) % 60, b[1] + Math.sin(t * 1.3 + i) * 8, 26 + i * 4));
    // sea
    g.fillStyle = G.lin(g, 0, hz, 0, 440, [PK.lerpHex('#ffb98a', '#ff9a78', sun), '#7fb4c8', '#3f9ab8']); g.fillRect(0, hz, 960, 150);
    g.fillStyle = 'rgba(255,215,140,.55)'; for (let i = 0; i < 12; i++) { const y = hz + 4 + i * 10, w = (30 + i * 8) * (.7 + .3 * Math.sin(t * 1.5 + i)); g.fillRect(sx - w / 2, y, w, 4); }
    g.strokeStyle = 'rgba(255,255,255,.3)'; g.lineWidth = 3; for (let i = 0; i < 8; i++) { const y = hz + 18 + i * 17, x0 = ((i * 190 + t * 14 * (i % 2 ? 1 : -1)) % 1100) - 100; g.beginPath(); g.moveTo(x0, y); g.quadraticCurveTo(x0 + 30, y - 6, x0 + 60, y); g.quadraticCurveTo(x0 + 90, y + 6, x0 + 120, y); g.stroke(); }
    // far boat + rocks in sea
    A.draw(g, 'sa_boat', 760 + Math.sin(t * .5) * 6, hz - 6 + Math.sin(t * 1.2) * 1.5, 58);
    [[830, 372, 90], [900, 392, 70]].forEach(r => A.draw(g, 'sa_rock', r[0], r[1], r[2]));
    // sand
    g.fillStyle = G.lin(g, 0, 428, 0, 540, ['#f6dca8', '#e6c28a']); g.beginPath(); g.moveTo(0, 442); g.quadraticCurveTo(240, 424, 520, 440); g.quadraticCurveTo(760, 456, 960, 430); g.lineTo(960, 540); g.lineTo(0, 540); g.fill();
    g.strokeStyle = 'rgba(255,255,255,.75)'; g.lineWidth = 6; g.beginPath(); g.moveTo(0, 442 + Math.sin(t) * 2); g.quadraticCurveTo(240, 424 + Math.sin(t + 1) * 3, 520, 440); g.quadraticCurveTo(760, 456 + Math.sin(t + 2) * 3, 960, 430); g.stroke();
    g.fillStyle = 'rgba(190,140,70,.18)'; g.beginPath(); g.moveTo(0, 448); g.quadraticCurveTo(240, 430, 520, 446); g.quadraticCurveTo(760, 462, 960, 436); g.lineTo(960, 458); g.quadraticCurveTo(760, 484, 520, 462); g.quadraticCurveTo(240, 448, 0, 468); g.fill();
    cliff(g, t);
    [[560, 480, 70], [880, 500, 80]].forEach(b => A.draw(g, 'sa_dbush', b[0], b[1], b[2]));
    if (kind === 'sand' || S.mound || S.castle) { const mx = (M.castle && M.castle.cx) || 560; g.beginPath(); g.moveTo(mx - 300, 462); g.quadraticCurveTo(mx - 190, 424, mx, 424); g.quadraticCurveTo(mx + 190, 424, mx + 300, 462); g.closePath(); g.fillStyle = '#ecc88e'; g.fill(); g.lineWidth = 3; g.strokeStyle = 'rgba(120,80,30,.45)'; g.stroke(); g.fillStyle = 'rgba(160,110,40,.3)'; [[-120, 446], [-40, 438], [60, 450], [150, 444], [220, 455]].forEach(p => { g.beginPath(); g.arc(mx + p[0], p[1], 3, 0, 6.3); g.fill(); }); }
    if (S.castle) { const c = S.castle, cx = (M.castle && M.castle.cx) || 560; if (c.base) { [-100, 0, 100].forEach(d => A.draw(g, 'sa_wall', cx + d, 420, 100)); [-180, 180].forEach(d => A.draw(g, 'sa_tower', cx + d, 384, 110)); A.draw(g, 'sa_tower', cx, 330, 130); } if (c.door) A.draw(g, 'sa_door', cx, 428, 64); if (c.wins) [-180, 180].forEach(d => A.draw(g, 'sa_window', cx + d, 354, 44)); if (c.flag) { g.save(); g.translate(cx, 248); g.rotate(Math.sin(t * 3) * .05); A.draw(g, 'sa_flagc', 0, 0, 70); g.restore(); } }
    if (S.umbrella) { A.draw(g, 'sa_umbrella', S.umbrella.x, S.umbrella.y, 170); rr(g, S.umbrella.x - 80, S.umbrella.y + 74, 150, 36, 8, '#fff', 3.5); rr(g, S.umbrella.x - 80, S.umbrella.y + 74, 150, 12, 4, '#ef5350', 0); }
    if (S.flagPole) A.draw(g, 'sa_flag:' + S.flagPole.c, S.flagPole.x, S.flagPole.y, 120);
    // soft vignette-ish warm overlay for sunset mood
    g.fillStyle = 'rgba(255,150,80,' + (.05 + sun * .12) + ')'; g.fillRect(0, 0, 960, 540);
  };

  R.saHome = function (g, t, s) {
    const S = s.state; g.fillStyle = G.lin(g, 0, 0, 0, 430, ['#ffe9d0', '#ffd7b0']); g.fillRect(0, 0, 960, 430); g.fillStyle = 'rgba(255,255,255,.18)'; for (let i = 0; i < 12; i++) g.fillRect(i * 90, 0, 40, 430);
    g.fillStyle = G.lin(g, 0, 430, 0, 540, ['#d9a66e', '#b57e4a']); g.fillRect(0, 430, 960, 110); G.line(g, 0, 430, 960, 430, 4);
    // open door to the sunny outside
    rr(g, 760, 90, 170, 340, 8, '#8a5a3a', 5); g.save(); g.beginPath(); g.rect(772, 102, 146, 328); g.clip(); g.fillStyle = G.lin(g, 0, 100, 0, 430, ['#8fd6ff', '#fff3c4']); g.fillRect(772, 102, 146, 328); G.sun(g, 850, 170, 26, t); g.fillStyle = '#a8e0a0'; g.fillRect(772, 380, 146, 50); g.restore();
    // wall calendar + window
    rr(g, 70, 80, 120, 130, 8, '#fff', 4.5); rr(g, 70, 80, 120, 28, 8, '#ef5350', 4.5); G.text(g, 'رحلة البحر', 130, 95, { size: 17, color: '#fff' }); G.circ(g, 130, 160, 28, null, 0); g.beginPath(); g.arc(130, 160, 30, 0, 6.3); g.lineWidth = 5; g.strokeStyle = '#ef5350'; g.stroke(); A.draw(g, 'sa_sunart', 130, 160, 44);
    rr(g, 330, 90, 200, 120, 8, '#8fd6ff', 5); G.line(g, 430, 90, 430, 210, 5); G.line(g, 330, 150, 530, 150, 5); G.sun(g, 380, 130, 14, t);
    // hooks with hats + coat rack
    G.line(g, 580, 120, 700, 120, 8, '#8a5a3a'); if (!S.hatGone) A.draw(g, 'pk_hat', 620, 118, 70); A.draw(g, 'bag', 680, 150, 56);
    // shelf (high)
    rr(g, 560, 190, 170, 12, 4, '#b97b4a', 4);
    // sofa (low gap)
    A.draw(g, 'sofa', 220, 372, 300); g.fillStyle = 'rgba(40,20,10,.35)'; g.fillRect(90, 424, 270, 10);
    if (S.bagOpen) A.draw(g, 'sa_bag', 480, 450, 150);
    if (S.cooler) A.draw(g, 'sa_cooler', 610, 440, 110);
  };

  R.saCar = function (g, t, s) {
    const S = s.state, still = !!S.still, near = S.near || 0; const dtt = t - (s._lt == null ? t : s._lt); s._lt = t; if (!still) s._k = (s._k || 0) + Math.min(.1, dtt); const sc = s._k || 0;
    // interior
    g.fillStyle = '#6e7791'; g.fillRect(0, 0, 960, 540); rr(g, 0, 0, 960, 70, 0, '#9aa0b5', 0);
    // window (scenery)
    g.save(); g.beginPath(); G.rr(g, 70, 76, 820, 250, 24); g.clip();
    g.fillStyle = G.lin(g, 0, 76, 0, 326, [PK.lerpHex('#8fd6ff', '#ffc47a', near), '#ffeccc']); g.fillRect(70, 76, 820, 250); G.sun(g, 760, 140, 26, t);
    const k = (sc * 60);
    g.fillStyle = '#efd7a0'; g.beginPath(); g.moveTo(70, 270); for (let x = 70; x <= 890; x += 20) g.lineTo(x, 262 + Math.sin((x + k * .2) / 90) * 14); g.lineTo(890, 326); g.lineTo(70, 326); g.fill();
    // sea strip appears when near
    if (near > 0) { g.fillStyle = 'rgba(74,168,200,' + Math.min(1, near) + ')'; g.fillRect(70, 252, 820, 22 + near * 10); }
    for (let i = 0; i < 6; i++) { const px = ((i * 210 - k * 2.4) % 1260 + 1260) % 1260 - 120; A.draw(g, 'sa_palm', 70 + px, 262, 78 + (i % 2) * 12); }
    for (let i = 0; i < 3; i++) { const px = ((i * 430 - k * 1.1) % 1290 + 1290) % 1290 - 200; G.ell(g, 70 + px, 116 + i * 22, 60, 12, 'rgba(255,255,255,.8)', 0); }
    g.fillStyle = '#f2c98a'; g.fillRect(70, 286, 820, 40); g.fillStyle = '#5a5a68'; g.beginPath(); g.moveTo(70, 296); g.lineTo(890, 296); g.lineTo(890, 326); g.lineTo(70, 326); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 4; g.setLineDash([30, 24]); g.lineDashOffset = -k * 2; g.beginPath(); g.moveTo(70, 311); g.lineTo(890, 311); g.stroke(); g.setLineDash([]);
    g.restore(); g.lineWidth = 8; g.strokeStyle = OL; G.rr(g, 70, 76, 820, 250, 24); g.stroke(); G.line(g, 480, 76, 480, 326, 8);
    // front seats
    [[200, '#ff8fb1'], [660, '#3a2a1e']].forEach(c => { rr(g, c[0] - 130, 330, 260, 220, 40, '#4a5a8a', 5); rr(g, c[0] - 56, 300, 112, 120, 40, G.shade('#4a5a8a', -.12), 5); G.circ(g, c[0], 304, 46, c[1], 4.5); [-1, 1].forEach(d => G.circ(g, c[0] + d * 46, 308, 9, '#e8b080', 3.5)); if (c[1] === '#ff8fb1') G.poly(g, [[c[0] - 44, 320], [c[0] + 44, 320], [c[0] + 62, 372], [c[0] - 62, 372]], '#ff8fb1', 4); });
    // back bench
    rr(g, 220, 420, 520, 130, 20, '#5d6b9e', 5);
    if (S.near) g.fillStyle = 'rgba(255,170,90,' + near * .1 + ')';
  };
})();
