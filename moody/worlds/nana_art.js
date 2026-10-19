/* Moody & Aboody - worlds/nana_art.js : canvas art of WORLD 7 "بيت ننا زوزا" (id 'nana').
   Rooms (Moody.rooms): nn_hall6 nn_lift nn_door3 nn_kitchen nn_living nn_balcony.   Props/stickers: all names start with nn_.
   Room flags live in stage.state (documented above each room). Load before worlds/nana.js. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, A = M.art, R = M.rooms = M.rooms || {}, rr = G.fillRR;
  const A2 = '#fff7e3';

  /* ---------------- small helpers ---------------- */
  const RK = G.room;
  function wall(g, y1, c1, c2, stripe, o) { RK.wall(g, y1, c1, c2, Object.assign({ pattern: stripe ? 'stripes' : 'none', pw: 90 }, o)); }
  function floorTiles(g, y, c1, c2, size, line) { RK.floor(g, y, c1, c2, { kind: 'tile', alt: 'rgba(255,255,255,.2)', line: line || 'rgba(90,50,20,.18)', n: Math.round(900 / size) }); }
  function glowLamp(g, s, x, y, t, r, a) { G.amb(s, { k: 'glow', x, y, r, col: '255,230,140', a: a || .5, flick: .05, z: 'top' }); }
  function winFrame(g, s, x, y, w, h, t, o) { o = o || {}; G.window(g, s, x, y, w, h, { view: o.dusk ? 'sunset' : o.night ? 'citynight' : 'city', frame: '#fff6e6', curtains: null, floor: 430, dir: .3, shaft: !o.night && !o.dusk }); }
  /* sliding lift doors (open 0..1) at x,y,w,h */
  function liftDoors(g, x, y, w, h, open, col) {
    const half = w / 2, gap = open * (half - 4);
    rr(g, x - 10, y - 10, w + 20, h + 14, 8, '#a8afc0', 4);
    g.fillStyle = G.lin(g, 0, y, 0, y + h, ['#fff3cc', '#ffe0a0']); g.fillRect(x, y, w, h);
    if (open > .3) { g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(x + 10, y + 30, w - 20, h - 40); }
    [[x - gap, 0], [x + half + gap, 1]].forEach(d => { const px = d[0]; g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip(); rr(g, px, y, half, h, 2, col || '#cfd5e3', 3); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(px + 4, y + 4, half * .3, h - 8); G.line(g, px + (d[1] ? 12 : half - 12), y + 6, px + (d[1] ? 12 : half - 12), y + h - 6, 3, 'rgba(255,255,255,.75)'); g.restore(); });
  }
  const R3 = (g, x, y, w, h, r, f, l) => G.fillRR(g, x, y, w, h, r, f, l);
  M.look.setAll({
    nn_hall6: { tod: 'warm', floor: 430, live: ['liftFloor', 'callLit', 'doorsOpen'], lightX: 480 }, nn_lift: { tod: 'cool', floor: 430, live: ['floor', 'doors', 'moving'], ao: .5, vig: .3 },
    nn_door3: { tod: 'warm', floor: 430, live: ['open', 'bell'], lightX: 480 }, nn_kitchen: s => ({ tod: 'morning', floor: 430, lightX: 775 }),
    nn_living: s => ({ tod: s.state.night ? 'night' : 'warm', floor: 430, lightX: 775, vig: .3 }), nn_balcony: s => ({ tod: s.state.dusk ? 'sunset' : 'morning', floor: 430, indoor: false, lightX: 800 })
  });

  /* ================================================================
     ROOM nn_hall6 : 6th-floor corridor.  flags: liftFloor (number shown, default 6), callLit, doorsOpen (0..1)
     Landmarks: our door (left), lift (center), call button (600,262), bench (640-860) with a gap under it, plant (910)
     ================================================================ */
  R.nn_hall6 = function (g, t, s) {
    const S = s.state; wall(g, 430, '#ffeacf', '#ffd5a8', true, { dado: { h: 130, c: '#e8b98c' } });
    floorTiles(g, 430, '#f2dfc4', '#d6bc94', 70);
    rr(g, 440, 0, 80, 20, 8, '#fff7d0', 3.5); glowLamp(g, s, 480, 20, t, 190, .6);
    G.ao(g, 40, 140, 150, 290); rr(g, 40, 140, 150, 290, 8, '#a0643a', 4.5); rr(g, 54, 154, 122, 262, 4, '#c8935a', 3); rr(g, 70, 172, 90, 100, 6, '#b4783f', 2.5); rr(g, 70, 290, 90, 110, 6, '#b4783f', 2.5);
    G.circ(g, 168, 300, 7, '#ffd23c', 2.5); rr(g, 85, 112, 60, 30, 8, '#fff', 3.5); G.text(g, '٦', 115, 128, { size: 28, color: '#c25a00' });
    RK.rug(g, 115, 446, 70, 12, '#ff8fa8', '#ffd0e0');
    rr(g, 400, 66, 160, 44, 10, '#2a2f45', 4);
    rr(g, 592, 232, 44, 86, 10, '#9aa0b5', 4); G.poly(g, [[614, 250], [602, 270], [626, 270]], '#e8ecf5', 2.5);
    winFrame(g, s, 770, 110, 110, 100, t); R3(g, 760, 208, 130, 12, 4, '#b97b4a', 3);
    G.ao(g, 640, 360, 230, 70); rr(g, 640, 360, 230, 22, 8, '#c8935a', 4); rr(g, 650, 326, 210, 36, 10, '#e07a4a', 4); G.fillRR(g, 654, 382, 16, 48, 3, '#a0643a', 3); G.fillRR(g, 840, 382, 16, 48, 3, '#a0643a', 3);
    g.fillStyle = G.lin(g, 0, 390, 0, 432, ['rgba(40,18,4,.36)', 'rgba(40,18,4,.08)']); g.fillRect(672, 392, 166, 40);
    A.draw(g, 'plant', 915, 385, 110);
    RK.frame(g, 230, 180, 110, 80, { frame: '#fff', bg: '#bfe8ff', draw: (g, x, y, w, h) => { G.circ(g, x + 32, y + 34, 14, '#ffd23c', 2.5); g.fillStyle = '#5cc96b'; g.beginPath(); g.moveTo(x, y + h); g.lineTo(x + 50, y + 38); g.lineTo(x + w, y + h); g.closePath(); g.fill(); } });
    G.live(g, s, (g, t) => {
      const open = S.doorsOpen || 0; liftDoors(g, 395, 130, 170, 300, open);
      const fl = S.liftFloor == null ? 6 : S.liftFloor; G.text(g, M.util.ar(Math.round(fl)), 480, 90, { size: 32, color: '#ff5a4a' }); G.poly(g, [[430, 80], [446, 80], [438, 98]], '#ff5a4a', 0);
      G.circ(g, 614, 298, 12, S.callLit ? '#ffd23c' : '#e8ecf5', 3); G.poly(g, [[606, 292], [622, 292], [614, 304]], '#9aa0b5', 2);
      if (S.callLit) { g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .6 + .3 * Math.sin(t * 6); g.drawImage(G.glowSprite('255,230,140'), 560, 244, 108, 108); g.restore(); }
    });
  };

  /* ================================================================
     ROOM nn_lift : inside the lift.  flags: floor (number), doors (0 open .. 1 closed), moving (shake)
     The kit puts HTML floor buttons on the right (panel plate drawn here at x 748-930, y 92-408)
     ================================================================ */
  R.nn_lift = function (g, t, s) {
    const S = s.state; g.fillStyle = G.lin(g, 0, 0, 0, 430, ['#dfe3ee', '#b7bdd0']); g.fillRect(0, 0, 960, 430);
    g.fillStyle = 'rgba(255,255,255,.2)'; for (let i = 0; i < 10; i++) { const gr = g.createLinearGradient(i * 100 + 20, 0, i * 100 + 60, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(.5, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(i * 100 + 20, 0, 40, 430); }
    g.fillStyle = 'rgba(30,40,70,.25)'; G.rr(g, 196, 108, 330, 180, 12); g.fill(); rr(g, 190, 100, 330, 180, 12, '#f2faff', 4); g.save(); g.beginPath(); g.rect(196, 106, 318, 168); g.clip(); g.fillStyle = G.lin(g, 0, 106, 0, 274, ['#cfeaff', '#9ccbe8']); g.fillRect(196, 106, 318, 168); G.line(g, 230, 280, 330, 100, 24, 'rgba(255,255,255,.6)'); G.line(g, 340, 280, 400, 100, 12, 'rgba(255,255,255,.5)'); g.restore();
    G.line(g, 30, 322, 700, 322, 10, '#8f95a8'); G.line(g, 30, 322, 700, 322, 5, '#eef1f8'); [60, 670].forEach(x => G.line(g, x, 322, x, 340, 8, '#8f95a8'));
    floorTiles(g, 430, '#b3b9cb', '#7d849b', 80, 'rgba(0,0,0,.16)');
    rr(g, 340, 22, 190, 58, 12, '#1f2338', 4);
    RK.frame(g, 60, 90, 90, 110, { frame: '#fff', bg: '#fff', draw: (g, x, y, w, h) => { G.circ(g, x + w / 2, y + 40, 28, null, 5, '#ef5350'); G.line(g, x + w / 2 - 19, y + 21, x + w / 2 + 19, y + 59, 6, '#ef5350'); A.draw(g, 'ball', x + w / 2, y + 40, 28); G.text(g, 'ممنوع اللعب', x + w / 2, y + 90, { size: 14, color: '#ef5350' }); } });
    rr(g, 748, 92, 182, 316, 18, '#8f95a8', 4); rr(g, 756, 100, 166, 300, 14, '#c7ccdb', 3);
    G.amb(s, { k: 'glow', x: 480, y: 6, r: 420, ry: 150, col: '255,255,240', a: .35, z: 'top' });
    G.live(g, s, (g, t) => {
      const fl = S.floor == null ? 6 : S.floor; G.text(g, M.util.ar(Math.round(fl)), 450, 52, { size: 44, color: '#ff5a4a' }); G.poly(g, [[384, 40], [408, 40], [396, 64]], S.moving ? '#ff5a4a' : '#5a3a3a', 0);
      const d = S.doors == null ? 0 : S.doors; if (d > 0) { const w = 480 * d; g.fillStyle = '#cfd5e3'; g.fillRect(0, 0, w / 2, 430); g.fillRect(960 - w / 2, 0, w / 2, 430); g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(8, 0, 14, 430 * (d > 0 ? 1 : 0)); G.line(g, w / 2, 0, w / 2, 430, 4, 'rgba(70,80,110,.7)'); G.line(g, 960 - w / 2, 0, 960 - w / 2, 430, 4, 'rgba(70,80,110,.7)'); }
      if (S.moving) { g.fillStyle = 'rgba(0,0,0,' + (.03 + .02 * Math.sin(t * 30)) + ')'; g.fillRect(0, 0, 960, 540); }
    }, 'top');
  };

  /* ================================================================
     ROOM nn_door3 : 3rd-floor landing in front of Nana's door.  flags: open (0..1), bell (pulse the bell)
     Landmarks: door (340-560, 140-430), bell (610,262), shoe rack (30-250) with TOP shelf (y~300) and LOW shelf (y~390)
     ================================================================ */
  R.nn_door3 = function (g, t, s) {
    const S = s.state; wall(g, 430, '#e2f5e9', '#bfe3cd', true, { dado: { h: 120, c: '#9fd0b0' } });
    floorTiles(g, 430, '#f1e3ca', '#d6c09c', 70);
    rr(g, 440, 0, 80, 18, 8, '#fff7d0', 3.5); glowLamp(g, s, 480, 18, t, 200, .55);
    G.ao(g, 322, 118, 256, 312); rr(g, 322, 118, 256, 312, 10, '#8a5a3a', 4.5);
    rr(g, 410, 92, 80, 34, 10, '#fff', 4); G.text(g, '٣', 450, 110, { size: 28, color: '#c25a00' });
    RK.rug(g, 450, 452, 120, 16, '#ff8fa8', '#ffd0e0'); G.text(g, 'أهلًا', 450, 454, { size: 15, color: '#c25a00' });
    G.ao(g, 30, 266, 220, 168); rr(g, 30, 266, 220, 168, 8, '#7a4a2a', 4.5); g.fillStyle = 'rgba(0,0,0,.22)'; g.fillRect(40, 276, 200, 56); g.fillRect(40, 346, 200, 78);
    rr(g, 26, 330, 228, 14, 5, '#c8935a', 4); rr(g, 26, 424, 228, 14, 5, '#c8935a', 4); rr(g, 26, 262, 228, 12, 5, '#c8935a', 4);
    G.text(g, 'الجزم', 140, 246, { size: 22, color: '#fff', stroke: OL, sw: 5 });
    A.draw(g, 'plant', 820, 380, 120);
    G.live(g, s, (g, t) => {
      const open = S.open || 0; g.fillStyle = '#ffe8b0'; g.fillRect(340, 136, 220, 294);
      if (open > .05) {
        g.fillStyle = G.lin(g, 0, 136, 0, 430, ['#fff2c8', '#ffd9a0']); g.fillRect(340, 136, 220, 294); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .5; g.drawImage(G.glowSprite('255,230,150'), 290, 150, 320, 280); g.restore(); g.fillStyle = '#e9a86a'; g.fillRect(340, 396, 220, 34);
        rr(g, 395, 170, 100, 74, 6, '#fff', 3.5); G.heart(g, 445, 208, 20, '#ff8fa8', 3); g.save(); g.beginPath(); g.rect(340, 136, 220, 294); g.clip(); A.draw(g, 'sofa', 505, 392, 190); A.draw(g, 'plant', 380, 376, 80); g.restore();
      }
      const lw = 220 * (1 - open * .82); g.save(); g.beginPath(); g.rect(340, 136, 220, 294); g.clip();
      rr(g, 340, 136, lw, 294, 4, '#b4783f', 4); if (lw > 80) { rr(g, 358, 154, lw - 36, 104, 6, '#c8935a', 3); rr(g, 358, 276, lw - 36, 140, 6, '#c8935a', 3); G.circ(g, 340 + lw - 20, 300, 7, '#ffd23c', 2.5); }
      g.restore();
      if (open < .5) { G.circ(g, 450, 205, 24, null, 9, '#5cc96b'); [0, 1, 2, 3, 4, 5].forEach(i => G.circ(g, 450 + Math.cos(i * 1.05) * 24, 205 + Math.sin(i * 1.05) * 24, 6, ['#ff6f91', '#ffd23c', '#fff'][i % 3], 2)); }
      G.circ(g, 614, 262, 24, '#fff', 4); const pulse = S.bell ? 1 + .08 * Math.sin(t * 7) : 1; G.circ(g, 614, 262, 14 * pulse, S.bell ? '#ffd23c' : '#ffc93c', 3); A.draw(g, 'nn_bell', 614, 262, 22);
    });
  };

  /* ================================================================
     ROOM nn_kitchen : Nana's kitchen.  flags: table (show the dining table + 6 mats), bake (oven glow), trays (trays on the counter), cook (steam over the pot)
     Landmarks: high shelf with flour (205,112), mid shelf jars (y 205), counter (y 300), stool/floor corner (320,470), table ellipse (480,400)
     ================================================================ */
  R.nn_kitchen = function (g, t, s) {
    const S = s.state; wall(g, 430, '#fff4cc', '#ffe39e', false);
    for (let x = 0; x < 960; x += 64) for (let y = 215, r = 0; y < 300; y += 46, r++) { g.fillStyle = 'rgba(255,255,255,.5)'; G.rr(g, x + (r % 2) * 32 + 1.5, y + 1.5, 61, 42, 5); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.fillRect(x + (r % 2) * 32 + 6, y + 6, 22, 3); }
    floorTiles(g, 430, '#efdbb6', '#cdb383', 70);
    G.window(g, s, 700, 70, 150, 120, { view: 'garden', frame: '#fff', curtains: null, floor: 300, dir: .2 }); rr(g, 692, 62, 166, 14, 6, '#c9633a', 3.5); [0, 1, 2, 3, 4, 5].forEach(i => G.circ(g, 706 + i * 29, 80, 9, '#fff', 2.5));
    RK.shelf(g, 70, 140, 300); [[110, '#ffd23c'], [170, '#ff8a2a'], [320, '#5cc96b']].forEach(j => { R3(g, j[0] - 20, 100, 40, 40, 8, j[1], 3); R3(g, j[0] - 22, 92, 44, 10, 4, '#fff7e3', 3); });
    RK.shelf(g, 70, 232, 300); [[110, '#9ed8ff'], [170, '#ff6f91'], [230, '#fff7e3'], [330, '#ffd23c']].forEach(j => { R3(g, j[0] - 20, 194, 40, 38, 8, j[1], 3); R3(g, j[0] - 22, 186, 44, 10, 4, '#c9633a', 3); });
    G.ao(g, 20, 300, 900, 130); rr(g, 20, 300, 900, 130, 6, '#e0a560', 4.5); rr(g, 12, 286, 920, 26, 6, '#fff7e3', 4.5); g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(18, 289, 908, 4); [0, 1, 2, 3, 4, 5, 6].forEach(i => { rr(g, 34 + i * 127, 330, 112, 92, 6, '#f0b872', 3); rr(g, 42 + i * 127, 338, 96, 76, 4, 'rgba(255,255,255,.13)', 2); G.circ(g, 34 + i * 127 + 98, 352, 4, '#8a5a3a', 2); });
    rr(g, 430, 262, 200, 168, 10, '#d9dde8', 4.5); rr(g, 450, 316, 160, 92, 8, S.bake ? '#ffb347' : '#6e7791', 4); g.fillStyle = 'rgba(255,255,255,.22)'; G.rr(g, 458, 322, 140, 20, 6); g.fill(); if (S.bake) { glowLamp(g, s, 530, 362, t, 140, .6); [0, 1, 2].forEach(i => A.draw(g, 'nn_kaak', 480 + i * 50, 366, 36)); }
    [[470, 282], [510, 282], [550, 282]].forEach(p => G.circ(g, p[0], p[1], 10, '#3a3f55', 2.5));
    A.draw(g, 'pot', 330, 262, 74); G.ell(g, 760, 290, 62, 14, '#fff', 4); G.ell(g, 760, 292, 50, 9, '#ffdca0', 2);
    if (S.cook) G.amb(s, { k: 'steam', x: 330, y: 236, sc: 1.3, n: 4, z: 'mid' });
    if (S.trays) { A.draw(g, 'nn_tray', 190, 276, 84); A.draw(g, 'nn_tray', 250, 276, 84); }
    if (S.table) {
      G.ell(g, 480, 468, 340, 26, 'rgba(40,20,5,.2)', 0); G.ell(g, 480, 410, 330, 80, '#ff8a6a', 4); G.ell(g, 480, 410, 308, 66, '#fff1e0', 2.5);
      g.save(); g.beginPath(); g.ellipse(480, 410, 308, 66, 0, 0, 6.3); g.clip(); g.strokeStyle = 'rgba(239,83,80,.25)'; g.lineWidth = 16; for (let x = -60; x < 960; x += 52) { g.beginPath(); g.moveTo(x, 340); g.lineTo(x + 40, 480); g.stroke(); } g.restore();
      G.ell(g, 480, 410, 330, 80, null, 3);
    }
  };

  /* ================================================================
     ROOM nn_living : Nana's sitting room.  flags: night (evening), lampOn, album (album on the table), phoneRing
     Landmarks: family frames (wall, 90-440, y 90-190), cabinet high shelf (y 150, x 60-250), coffee table (700,400), basket at the right (850,400)
     ================================================================ */
  R.nn_living = function (g, t, s) {
    const S = s.state; wall(g, 430, '#fce5ee', '#f3c9d9', true, { pattern: 'dots', pcol: 'rgba(255,255,255,.4)', dado: { h: 60, c: '#eab6cb' } });
    floorTiles(g, 430, '#d8aa74', '#a9794a', 90);
    [['baba', 108, 112], ['toota', 202, 100], ['nemo', 296, 112], ['moody', 154, 200], ['aboody', 250, 206]].forEach(f => { g.fillStyle = 'rgba(50,25,5,.22)'; G.rr(g, f[1] - 34, f[2] - 38, 76, 88, 8); g.fill(); rr(g, f[1] - 38, f[2] - 44, 76, 88, 8, '#c9963a', 4); rr(g, f[1] - 31, f[2] - 37, 62, 74, 4, '#fff7e3', 2); A.draw(g, 'face:' + f[0], f[1], f[2] + 2, 62); });
    rr(g, 440, 200, 190, 58, 10, '#fff', 4); G.text(g, 'ما شاء الله', 535, 229, { size: 30, color: '#1fb5a6' });
    G.window(g, s, 700, 70, 150, 150, { view: S.night ? 'citynight' : 'city', night: S.night, frame: '#fff6e6', curtains: '#fff', cw: 36, floor: 430, dir: .4 });
    G.ao(g, 40, 258, 140, 172); rr(g, 40, 258, 140, 172, 8, '#b97b4a', 4.5); G.line(g, 110, 258, 110, 430, 3.5); G.circ(g, 100, 340, 4, '#ffd23c', 2); G.circ(g, 120, 340, 4, '#ffd23c', 2);
    RK.rug(g, 480, 486, 330, 42, '#b06fd6', '#e2c4f5', { star: true });
    A.draw(g, 'sofa', 330, 372, 300); G.fillRR(g, 235, 330, 40, 30, 10, '#ffd23c', 3); G.fillRR(g, 395, 330, 40, 30, 10, '#1fb5a6', 3);
    G.ao(g, 600, 372, 190, 60); rr(g, 600, 372, 190, 20, 8, '#c8935a', 4.5); G.fillRR(g, 612, 392, 14, 40, 3, '#a0643a', 3); G.fillRR(g, 764, 392, 14, 40, 3, '#a0643a', 3); G.ell(g, 695, 372, 36, 7, '#fff', 3); G.fillRR(g, 700, 350, 22, 20, 6, '#ffb347', 3);
    if (S.album) A.draw(g, 'nn_album', 650, 352, 64); if (S.meds) { A.draw(g, 'nn_meds', 640, 350, 54); A.draw(g, 'nn_glass', 740, 354, 38); }
    G.poly(g, [[810, 380], [900, 380], [890, 436], [820, 436]], '#d8a460', 4); G.line(g, 812, 400, 898, 400, 2.5); G.line(g, 816, 418, 892, 418, 2.5);
    G.line(g, 940, 110, 940, 430, 6, '#8a5a3a'); R3(g, 912, 84, 56, 44, 10, S.lampOn || S.night ? '#fff2a8' : '#fff7e3', 4); if (S.lampOn || S.night) { glowLamp(g, s, 940, 108, t, 260, .7); }
    if (S.night) glowLamp(g, s, 330, 300, t, 230, .3);
  };

  /* ================================================================
     ROOM nn_balcony : Nana's balcony (3rd floor, tree tops below).  flags: dusk
     Landmarks: stand with shelves (left), hanging hook (610,120), low spot behind the chair (150,430), stand shelf (820,330)
     ================================================================ */
  R.nn_balcony = function (g, t, s) {
    const S = s.state;
    G.far(g, s, c => { G.view(c, S.dusk ? 'citysunset' : 'city', 0, 0, 960, 430, 20); c.fillStyle = S.dusk ? '#2f7a55' : '#5cc96b'; });
    G.hole(g, s, 0, 0, 960, 430);
    if (S.dusk) { const R2 = G.rand(5), pts = []; for (let i = 0; i < 14; i++) pts.push([R2() * 960, 20 + R2() * 120, 2 + R2() * 2]); G.amb(s, { k: 'stars', pts, z: 'far' }); } else { G.amb(s, { k: 'clouds', x0: -100, x1: 1060, y0: 60, y1: 200, n: 3, speed: 8, sc: .8, seed: 6 }); G.amb(s, { k: 'birds', y: 130, n: 3, speed: 22, sc: 1, seed: 8 }); }
    [[70, 400], [230, 410], [420, 405], [620, 412], [800, 402], [930, 410]].forEach(p => { const gr = g.createRadialGradient(p[0] - 16, p[1] - 22, 4, p[0], p[1], 56); gr.addColorStop(0, S.dusk ? '#4fa77a' : '#86df92'); gr.addColorStop(1, S.dusk ? '#276a47' : '#4cb85a'); g.fillStyle = gr; g.beginPath(); g.arc(p[0], p[1], 54, 0, 6.3); g.fill(); g.lineWidth = 1.6; g.strokeStyle = 'rgba(20,70,30,.5)'; g.stroke(); });
    g.fillStyle = S.dusk ? '#e04a5a' : '#ef5350'; g.beginPath(); g.moveTo(0, 0); g.lineTo(960, 0); g.lineTo(960, 52); for (let i = 16; i >= 0; i--) g.lineTo(i * 60, 52 + (i % 2 ? 22 : 0)); g.closePath(); G.fs(g, '#ef5350', 3, null, [0, 0, 960, 70]); for (let i = 0; i < 16; i += 2) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(i * 60, 0, 60, 50); } g.fillStyle = 'rgba(40,10,0,.25)'; g.fillRect(0, 54, 960, 22);
    G.line(g, 610, 74, 610, 108, 4, '#8f95a8'); G.circ(g, 610, 112, 6, '#8f95a8', 2.5);
    g.fillStyle = G.lin(g, 0, 300, 0, 430, ['#eccfa4', '#dcb785']); g.fillRect(0, 300, 960, 130); G.line(g, 0, 300, 960, 300, 5, '#8a5a3a'); G.line(g, 0, 330, 960, 330, 3.5, '#8a5a3a'); for (let x = 20; x < 960; x += 46) G.fillRR(g, x, 300, 10, 130, 3, '#b97b4a', 3);
    floorTiles(g, 430, '#dcbd8e', '#b3895a', 80);
    G.line(g, 760, 300, 760, 436, 6, '#8a5a3a'); G.line(g, 880, 300, 880, 436, 6, '#8a5a3a'); rr(g, 744, 346, 152, 12, 4, '#b97b4a', 4); rr(g, 744, 398, 152, 12, 4, '#b97b4a', 4);
    G.ao(g, 70, 350, 110, 86); rr(g, 70, 350, 110, 18, 6, '#c8935a', 4); rr(g, 70, 292, 14, 90, 4, '#c8935a', 4); G.fillRR(g, 74, 368, 12, 66, 3, '#a0643a', 3); G.fillRR(g, 164, 368, 12, 66, 3, '#a0643a', 3); rr(g, 86, 336, 84, 16, 8, '#ff9ec0', 3);
    G.ell(g, 440, 440, 70, 12, '#8a5a3a', 4); G.fillRR(g, 434, 396, 12, 44, 3, '#8a5a3a', 3); rr(g, 384, 380, 112, 14, 6, '#c8935a', 4);
    A.draw(g, 'nn_glass', 410, 364, 38);
    G.amb(s, { k: 'leaves', x0: 40, x1: 920, y0: 100, y1: 420, n: 5, cols: S.dusk ? ['#9a7ac0'] : ['#8fd16a', '#c8e080'], z: 'top', seed: 4 });
    if (!S.dusk) G.amb(s, { k: 'glow', x: 800, y: 80, r: 330, ry: 240, col: '255,236,170', a: .14, z: 'top' });
  };

  /* ================================================================
     PROPS (all names start with nn_)
     ================================================================ */
  A.registerAll({
    nn_gift(g) { rr(g, -34, -10, 68, 44, 6, '#ff6f91', 4.5); rr(g, -38, -22, 76, 20, 6, '#ff8fa8', 4.5); G.fillRR(g, -6, -22, 12, 56, 0, '#ffd23c', 3); G.ell(g, -12, -30, 12, 8, '#ffd23c', 3.5, null, -.4); G.ell(g, 12, -30, 12, 8, '#ffd23c', 3.5, null, .4); G.circ(g, 0, -28, 6, '#ffc93c', 3); },
    nn_buttons(g) { rr(g, -36, -40, 72, 80, 10, '#c7ccdb', 4.5); [[-14, -22], [14, -22], [-14, 0], [14, 0], [-14, 22], [14, 22]].forEach((p, i) => G.circ(g, p[0], p[1], 9, i === 3 ? '#ffd23c' : '#fff', 3)); },
    nn_bell(g) { G.circ(g, 0, 0, 36, '#ffc93c', 4.5); G.circ(g, 0, 0, 24, '#ffe28a', 3); g.beginPath(); g.moveTo(-14, 8); g.quadraticCurveTo(-14, -16, 0, -16); g.quadraticCurveTo(14, -16, 14, 8); g.closePath(); G.fs(g, '#fff', 3); G.circ(g, 0, 12, 4, OL, 0); },
    nn_hourglass(g) { rr(g, -26, -40, 52, 10, 4, '#b97b4a', 4); rr(g, -26, 30, 52, 10, 4, '#b97b4a', 4); G.poly(g, [[-20, -30], [20, -30], [3, 0], [20, 30], [-20, 30], [-3, 0]], '#d9f0ff', 4); G.poly(g, [[-12, 24], [12, 24], [3, 10], [-3, 10]], '#ffc93c', 0); G.poly(g, [[-10, -26], [10, -26], [2, -12], [-2, -12]], '#ffc93c', 0); },
    nn_salam(g) { g.beginPath(); G.rr(g, -42, -34, 84, 56, 22); G.fs(g, '#fff', 4.5); G.poly(g, [[-14, 20], [-28, 40], [4, 20]], '#fff', 4.5); G.fillRR(g, -34, -28, 68, 44, 18, '#fff', 0); G.text(g, 'سلام', 0, -6, { size: 28, color: '#1fb5a6' }); },
    nn_shoe(g, o) { const c = (M.pkColors && M.pkColors[(o.args || [])[0]]) || ({ red: '#ef5350', blue: '#4a8dff', pink: '#ff6f91', green: '#5cc96b', brown: '#8a5a3a', navy: '#26396e' }[(o.args || [])[0]]) || '#ef5350'; g.beginPath(); g.moveTo(-34, -14); g.lineTo(-8, -14); g.quadraticCurveTo(0, 8, 32, 10); g.quadraticCurveTo(44, 26, 30, 28); g.lineTo(-34, 28); g.closePath(); G.fs(g, c, 4.5); G.fillRR(g, -36, 22, 72, 10, 5, '#fff', 3.5); G.line(g, -6, -2, 6, 6, 3, '#fff'); G.line(g, 4, -6, 16, 2, 3, '#fff'); },
    nn_flour(g) { g.beginPath(); g.moveTo(-30, -34); g.quadraticCurveTo(0, -44, 30, -34); g.lineTo(36, 36); g.quadraticCurveTo(0, 46, -36, 36); g.closePath(); G.fs(g, '#fff7e3', 4.5); G.fillRR(g, -26, -42, 52, 12, 5, '#c9963a', 3.5); G.line(g, -10, 4, -10, -16, 3, '#c9963a'); G.ell(g, -10, -18, 4, 8, '#e8b66a', 2); G.ell(g, 0, -12, 4, 9, '#e8b66a', 2); G.ell(g, 10, -18, 4, 8, '#e8b66a', 2); G.text(g, 'دقيق', 0, 20, { size: 18, color: '#c25a00' }); },
    nn_vanilla(g) { rr(g, -16, -14, 32, 50, 8, '#ffcf6a', 4.5); rr(g, -10, -30, 20, 18, 4, '#7a4a2a', 4); G.fillRR(g, -12, 4, 24, 22, 3, '#fff', 2.5); G.circ(g, 0, 15, 5, '#ff8fa8', 2); },
    nn_eggs(g) { G.poly(g, [[-36, 4], [36, 4], [28, 36], [-28, 36]], '#d8a460', 4.5); [[-18, 0], [0, -6], [18, 0]].forEach(p => G.ell(g, p[0], p[1], 14, 18, '#fff', 3.5)); },
    nn_kaak(g) { g.beginPath(); g.arc(0, 0, 34, 0, 6.2832); g.arc(0, 0, 11, 0, 6.2832, true); G.fs(g, '#e8b66a', 4.5); g.beginPath(); g.arc(0, 0, 24, 0, 6.2832); g.arc(0, 0, 14, 0, 6.2832, true); g.fillStyle = 'rgba(255,255,255,.55)'; g.fill(); for (let i = 0; i < 9; i++) { const a = i * .7; G.circ(g, Math.cos(a) * 25, Math.sin(a) * 25, 2.3, '#fff', 0); } },
    nn_tray(g) { G.ell(g, 0, 8, 46, 22, '#9aa0b5', 4.5); G.ell(g, 0, 4, 40, 17, '#c7ccdb', 3); G.ell(g, 0, 2, 33, 12, 'rgba(255,255,255,.4)', 0); },
    nn_album(g) { rr(g, -36, -36, 72, 72, 8, '#c0504d', 4.5); rr(g, -30, -30, 60, 60, 4, '#e07a6a', 2.5); G.fillRR(g, -34, -34, 8, 68, 3, '#8c2f2c', 3); rr(g, -14, -16, 40, 32, 4, '#fff7e3', 3); G.heart(g, 6, 0, 9, '#ff5a7a', 2.5); [[-14, -16], [26, -16], [-14, 16], [26, 16]].forEach(p => G.circ(g, p[0], p[1], 3, '#ffd23c', 1.5)); },
    nn_tasbeeh(g) { for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; G.circ(g, Math.cos(a) * 26, -6 + Math.sin(a) * 26, 6, i % 4 === 0 ? '#ffd23c' : '#1fb5a6', 2.5); } G.line(g, 0, 20, 0, 40, 4, '#8a5a3a'); G.circ(g, 0, 40, 6, '#ff6f91', 2.5); },
    nn_pot(g, o) {
      const a = o.args || [], wilt = a.indexOf('wilt') >= 0, hang = a.indexOf('hang') >= 0;
      if (hang) { G.line(g, 0, -80, -24, -14, 3, '#8f95a8'); G.line(g, 0, -80, 24, -14, 3, '#8f95a8'); }
      G.poly(g, [[-26, -6], [26, -6], [19, 38], [-19, 38]], '#e07a4a', 4.5); G.fillRR(g, -30, -14, 60, 14, 5, '#c9633a', 4.5);
      if (wilt) { g.lineWidth = 5; g.strokeStyle = '#8a9a3a'; [[-8, -.8], [0, 0], [8, .8]].forEach(l => { g.beginPath(); g.moveTo(l[0], -12); g.quadraticCurveTo(l[0] + l[1] * 30, -40, l[0] + l[1] * 46, -4); g.stroke(); G.ell(g, l[0] + l[1] * 46, 0, 8, 14, '#b5bd4a', 3, null, l[1] * .5); }); }
      else { [[-14, -.5], [0, 0], [14, .5]].forEach((l, i) => { G.line(g, l[0] * .5, -12, l[0] * 1.6, -46 - (i === 1 ? 10 : 0), 5, '#3f9a4f'); G.ell(g, l[0] * 1.8, -50 - (i === 1 ? 10 : 0), 12, 18, '#5cc96b', 4, null, l[1]); }); [[-20, -60, '#ff6f91'], [20, -62, '#ffd23c'], [0, -76, '#fff']].forEach(f => { for (let i = 0; i < 5; i++) { const an = i * 1.2566; G.circ(g, f[0] + Math.cos(an) * 7, f[1] + Math.sin(an) * 7, 5, f[2], 2); } G.circ(g, f[0], f[1], 4, '#ffa022', 2); }); }
    },
    nn_meds(g) { rr(g, -38, -16, 76, 44, 8, '#fff', 4.5); rr(g, -38, -26, 76, 14, 5, '#4a8dff', 4.5); [-26, -9, 8, 25].forEach((x, i) => { G.circ(g, x, 6, 6, ['#ff6f91', '#ffd23c', '#5cc96b', '#4a8dff'][i], 2.5); }); G.fillRR(g, -5, -36, 10, 24, 2, '#ef5350', 0); G.fillRR(g, -12, -29, 24, 10, 2, '#ef5350', 0); },
    nn_glass(g) { G.poly(g, [[-20, -30], [20, -30], [15, 30], [-15, 30]], 'rgba(220,240,255,.85)', 4); G.poly(g, [[-18, -8], [18, -8], [15, 30], [-15, 30]], '#6fc0f0', 0); G.line(g, -20, -30, 20, -30, 4); },
    nn_clock(g, o) {
      const a = o.args || [], h = +a[0] || 12, m = +a[1] || 0; G.circ(g, 0, 0, 42, '#fff', 5); G.circ(g, 0, 0, 36, '#fff7e3', 0);
      for (let i = 1; i <= 12; i++) { const an = i * Math.PI / 6; G.text(g, M.util.ar(i), Math.sin(an) * 28, -Math.cos(an) * 28 + 1, { size: 13, color: M.pal.ink }); }
      const ha = ((h % 12) + m / 60) * Math.PI / 6, ma = m * Math.PI / 30;
      G.line(g, 0, 0, Math.sin(ha) * 17, -Math.cos(ha) * 17, 6, '#ef5350'); G.line(g, 0, 0, Math.sin(ma) * 27, -Math.cos(ma) * 27, 4, '#2b3a67'); G.circ(g, 0, 0, 4, OL, 0);
    },
    nn_flower(g, o) { const c = (M.pkColors || {})[(o.args || [])[0]] || '#ff6f91'; G.line(g, 0, 8, 0, 40, 5, '#3f9a4f'); G.ell(g, 12, 28, 10, 5, '#5cc96b', 3, null, -.5); for (let i = 0; i < 6; i++) { const an = i * 1.0472; G.circ(g, Math.cos(an) * 17, -6 + Math.sin(an) * 17, 11, c, 3.5); } G.circ(g, 0, -6, 10, '#ffd23c', 3.5); },
    nn_butterfly(g) { G.ell(g, -18, -10, 18, 24, '#8a6bd6', 3.5, null, .5); G.ell(g, 18, -10, 18, 24, '#ff6f91', 3.5, null, -.5); G.ell(g, -14, 16, 12, 16, '#ffc93c', 3.5, null, -.4); G.ell(g, 14, 16, 12, 16, '#4aa8e8', 3.5, null, .4); G.fillRR(g, -4, -22, 8, 50, 4, '#3a2a1e', 2.5); },
    nn_card(g) { rr(g, -38, -30, 76, 60, 6, '#fff7e3', 4.5); G.line(g, 0, -30, 0, 30, 2.5, '#e8d8b8'); G.heart(g, 0, -2, 14, '#ff5a7a', 3); },
    nn_lift(g) { rr(g, -36, -40, 72, 80, 8, '#c7ccdb', 4.5); G.line(g, 0, -40, 0, 40, 4); [[-18, 6], [18, 6]].forEach(p => G.fillRR(g, p[0] - 10, p[1] - 38, 20, 76, 3, '#e8ecf5', 3)); G.poly(g, [[-10, -52], [10, -52], [0, -42]], '#ef5350', 3); G.poly(g, [[-10, 50], [10, 50], [0, 40]], '#5cc96b', 3); },
    nn_door(g) { rr(g, -30, -42, 60, 84, 6, '#b4783f', 4.5); rr(g, -22, -34, 44, 32, 4, '#c8935a', 3); rr(g, -22, 4, 44, 30, 4, '#c8935a', 3); G.circ(g, 20, 4, 4.5, '#ffd23c', 2.5); G.heart(g, 0, -18, 8, '#ff5a7a', 2.5); },
    nn_rack(g) { rr(g, -40, -30, 80, 66, 6, '#c8935a', 4.5); G.line(g, -40, 4, 40, 4, 4); A.draw(g, 'nn_shoe:blue', -18, -14, 26); A.draw(g, 'nn_shoe:pink', 16, 22, 26); },
    nn_hands(g) { [[-26, '#ffd2a8'], [0, '#e8b389'], [26, '#dd9d6c']].forEach((p, i) => { G.circ(g, p[0], -16, 11, p[1], 3.5); G.fillRR(g, p[0] - 9, -4, 18, 34, 8, ['#ff6f91', '#8b2346', '#9ea4ab'][i], 3.5); }); G.line(g, -17, 8, -9, 8, 5, '#ffd2a8'); G.line(g, 9, 8, 17, 8, 5, '#e8b389'); }
  });

  /* ---------------- cooking with Aunt Amani (mission m7): props ---------------- */
  A.registerAll({
    nn_shaareya(g) { g.beginPath(); g.moveTo(-30, -34); g.quadraticCurveTo(0, -42, 30, -34); g.lineTo(36, 36); g.quadraticCurveTo(0, 46, -36, 36); g.closePath(); G.fs(g, '#fff3c8', 4.5); G.fillRR(g, -26, -42, 52, 12, 5, '#e07a4a', 3.5); for (let i = 0; i < 6; i++) { G.line(g, -22 + i * 2, -14 + i * 9, 18 + i * 2, -22 + i * 9, 3, '#d9a548'); } },
    nn_ghee(g) { rr(g, -26, -22, 52, 58, 10, '#ffd23c', 4.5); rr(g, -30, -34, 60, 16, 6, '#fff7e3', 4.5); G.fillRR(g, -18, -6, 36, 26, 5, '#fff7e3', 2.5); G.text(g, 'سمنة', 0, 8, { size: 15, color: '#c25a00' }); },
    nn_salt(g) { g.beginPath(); g.moveTo(-20, 34); g.lineTo(-24, -10); g.quadraticCurveTo(0, -22, 24, -10); g.lineTo(20, 34); g.closePath(); G.fs(g, '#e8f2ff', 4.5); rr(g, -18, -28, 36, 18, 8, '#c7ccdb', 4.5); [[-7, -20], [0, -20], [7, -20]].forEach(p => G.circ(g, p[0], p[1], 2, OL, 0)); G.text(g, 'ملح', 0, 12, { size: 15, color: '#2b3a67' }); },
    nn_knife(g) { g.save(); g.rotate(-.6); G.poly(g, [[-6, -44], [6, -44], [10, 12], [-6, 12]], '#dfe5f0', 4.5); G.fillRR(g, -9, 10, 18, 36, 6, '#8a5a3a', 4.5); g.restore(); },
    nn_mitt(g) { rr(g, -26, -30, 52, 64, 16, '#ef5350', 4.5); G.ell(g, -28, -2, 11, 20, '#ef5350', 4.5, null, .5); rr(g, -26, 18, 52, 18, 6, '#c9363a', 3.5); [[-10, -14], [8, -6], [-4, 4]].forEach(p => G.circ(g, p[0], p[1], 4, '#fff7e3', 0)); },
    nn_woodspoon(g) { g.save(); g.rotate(.7); G.ell(g, 0, -26, 14, 20, '#d9a566', 4.5); G.fillRR(g, -5, -10, 10, 56, 5, '#c08a4a', 4); g.restore(); },
    nn_stove(g) { rr(g, -44, -8, 88, 46, 8, '#d9dde8', 4.5); G.ell(g, 0, -8, 34, 9, '#6e7791', 4); [-12, 0, 12].forEach((x, i) => { g.beginPath(); g.moveTo(x - 7, -8); g.quadraticCurveTo(x - 9, -26 - i % 2 * 6, x, -38); g.quadraticCurveTo(x + 9, -26, x + 7, -8); g.closePath(); G.fs(g, i === 1 ? '#ffd23c' : '#ff8a2a', 3); }); },
    nn_hotpot(g, o) { G.poly(g, [[-34, -14], [34, -14], [30, 28], [-30, 28]], '#9aa0b5', 4.5); rr(g, -38, -22, 76, 12, 5, '#c7ccdb', 4.5); G.fillRR(g, 36, -12, 22, 9, 4, '#ef5350', 3.5); G.fillRR(g, -58, -12, 22, 9, 4, '#ef5350', 3.5); G.circ(g, 0, -28, 5, '#6e7791', 3); [-14, 4, 20].forEach((x, i) => { g.save(); g.globalAlpha = .75; G.circ(g, x, -42 - i * 7, 7 - i, '#fff', 2); g.restore(); }); },
    nn_dish(g) { G.ell(g, 0, 16, 44, 18, '#fff', 4.5); G.ell(g, 0, 14, 34, 12, '#fff7e3', 2.5); g.beginPath(); g.moveTo(-30, 12); g.quadraticCurveTo(-26, -22, 0, -26); g.quadraticCurveTo(26, -22, 30, 12); g.quadraticCurveTo(0, 22, -30, 12); g.closePath(); G.fs(g, '#fff7d6', 4); for (let i = 0; i < 9; i++) { G.line(g, -20 + (i * 11) % 40, -12 + (i * 7) % 24, -12 + (i * 11) % 40, -8 + (i * 7) % 24, 3, '#c9873a'); } G.sparkle(g, 26, -28, 7, '#fff', .9); },
    nn_basin(g) { rr(g, -44, -8, 88, 44, 12, '#c7ccdb', 4.5); G.ell(g, 0, -8, 38, 10, '#8fd6ff', 4); [[-14, -14, 8], [10, -18, 6], [20, -12, 5]].forEach(b => G.circ(g, b[0], b[1], b[2], 'rgba(255,255,255,.85)', 2.5)); G.line(g, 0, -8, 0, -38, 5, '#8f95a8'); G.line(g, 0, -38, 18, -38, 5, '#8f95a8'); }
  });
})();
