/* Moody & Aboody - worlds/registry.js  (THE file other agents edit to add a world)
   1) Moody.plan([...])  declares every world card. Worlds with no loaded file show as "قريبًا" (coming soon).
   2) Moody.load lists the script files boot loads (in order) AFTER the engine. Add your files here.
   Only list files that really exist (a 404 would be a console error). */
(function () {
  'use strict';
  const M = window.Moody, A = M.art, G = M.gfx;
  // icons for the world cards (drawn art)
  A.registerAll({
    w_school(g) { G.fillRR(g, -44, -8, 88, 48, 4, '#ffd23c', 4.5); G.poly(g, [[-50, -8], [0, -44], [50, -8]], '#ef5350', 4.5); G.fillRR(g, -10, 10, 20, 30, 3, '#8a5a3a', 3); [-30, 30].forEach(x => G.fillRR(g, x - 7, 4, 14, 14, 2, '#bfe8ff', 3)); G.line(g, 0, -44, 0, -58, 3); G.poly(g, [[0, -58], [16, -53], [0, -48]], '#4a8dff', 2); },
    w_street(g) { G.fillRR(g, -10, -44, 20, 88, 4, '#3a3f55', 4.5); [['#ef5350', -28], ['#ffd23c', -6], ['#5cc96b', 16]].forEach(c => G.circ(g, 0, c[1], 8, c[0], 2.5)); },
    w_market(g) { G.poly(g, [[-44, -10], [44, -10], [38, -36], [-38, -36]], '#ff6f91', 4.5); for (let i = 0; i < 4; i++) G.poly(g, [[-44 + i * 22, -10], [-22 + i * 22, -10], [-22 + i * 22 - 3, -2], [-44 + i * 22 + 3, -2]], i % 2 ? '#fff' : '#ef5350', 2.5); G.fillRR(g, -38, 0, 76, 40, 4, '#c8935a', 4.5); A.draw(g, 'apple', -16, 4, 30); A.draw(g, 'orange', 16, 4, 30); },
    w_park(g) { G.fillRR(g, -6, 4, 12, 40, 3, '#8a5a3a', 3.5); G.circ(g, 0, -16, 30, '#5cc96b', 4.5); G.circ(g, -18, -4, 20, '#4fb85f', 3.5); G.circ(g, 18, -4, 20, '#4fb85f', 3.5); G.circ(g, 0, -18, 12, '#7fdc8a', 0); },
    w_sea(g) { g.beginPath(); g.moveTo(-50, 8); for (let i = 0; i < 6; i++) g.quadraticCurveTo(-50 + i * 20 + 10, -6, -50 + i * 20 + 20, 8); g.lineTo(50, 44); g.lineTo(-50, 44); g.closePath(); G.fs(g, '#4aa8e8', 4); G.poly(g, [[-20, 0], [24, 0], [14, 18], [-12, 18]], '#ef5350', 4); G.line(g, 2, 0, 2, -34, 4); G.poly(g, [[2, -34], [28, -10], [2, -10]], '#fff', 3.5); }
  });
  M.plan([
    { id: 'home', order: 1, title: 'البيت', icon: 'home', theme: { c1: '#ffd27a', c2: '#ff9a3c' } },
    { id: 'school', order: 2, title: 'المدرسة', icon: 'w_school', theme: { c1: '#9ed8ff', c2: '#4a8dff' } },
    { id: 'street', order: 3, title: 'الشارع والحي', icon: 'w_street', theme: { c1: '#c9c4ff', c2: '#8a6bd6' } },
    { id: 'market', order: 4, title: 'السوق', icon: 'w_market', theme: { c1: '#ffc0d0', c2: '#ff6f91' } },
    { id: 'park', order: 5, title: 'الحديقة', icon: 'w_park', theme: { c1: '#b8f0b0', c2: '#5cc96b' } },
    { id: 'sea', order: 6, title: 'رحلة البحر', icon: 'w_sea', theme: { c1: '#a8f0f0', c2: '#1fb5a6' } }
  ]);
  // engine content + worlds, loaded in this order
  M.load.push('content/meta.js', 'content/art_common.js', 'content/q_tier6.js', 'content/q_tier9.js', 'worlds/home_art.js', 'worlds/home.js');
})();
