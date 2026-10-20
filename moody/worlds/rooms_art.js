/* Moody & Aboody - worlds/rooms_art.js : the two DRESSING-ROOM scenes, painted with the visual system (baked room + live pieces + ambient life).
     Moody.rooms.room_boys   «غرفة الأولاد»  - cool blue / orange, bunk bed, space + animal posters, robot / cars / blocks shelf, lego table, telescope, football,
                                               standing mirror, big wardrobe with doors that open (live), warm afternoon window light + lamp glow
     Moody.rooms.room_girls  «غرفة البنات»  - rose / lilac / mint, canopy bed with pillows + plush toys, bookshelf, craft table with paints, doll house (lights), flowers,
                                               full-length dressing mirror, white wardrobe with heart handles (doors open), fairy lights, soft evening glow
   Interactive objects are described in Moody.roomSpec[name].objects (hit boxes in 960x540 logical px) - worlds/rooms.js turns them into hotspots.
   Live state (stage.state, listed in `live` so the room is NOT re-baked): wd (wardrobe door openness 0..1), mz (mirror highlight 0..1), fx (per-object animation start times). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, R = M.rooms = M.rooms || {}, RK = G.room, rr = G.fillRR, TAU = Math.PI * 2;
  const FLOOR = 430;
  const SPEC = M.roomSpec = M.roomSpec || {};

  /* ------------------------------------------------------------------ shared pieces */
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const since = (s, k) => { const f = s.state && s.state.fx; return f && f[k] != null ? Math.max(0, s.t - f[k]) : 99; };   // seconds since object `k` was tapped
  /* garment on a hanger (wardrobe interior): kind shirt | hoodie | jacket | dress | skirt | pants */
  function garment(g, x, y, kind, c1, c2) {
    g.save(); g.translate(x, y);
    G.line(g, 0, -20, 0, -13, 2.2, '#7a5a3a'); g.beginPath(); g.arc(0, -22, 3.4, Math.PI * .1, Math.PI * 1.9); g.lineWidth = 2.2; g.strokeStyle = '#7a5a3a'; g.stroke(); G.line(g, -14, -6, 0, -13, 2.6, '#7a5a3a'); G.line(g, 14, -6, 0, -13, 2.6, '#7a5a3a');
    if (kind === 'shirt') { G.poly(g, [[-11, -10], [-4, -12], [0, -9], [4, -12], [11, -10], [20, 2], [14, 7], [10, 2], [10, 38], [-10, 38], [-10, 2], [-14, 7], [-20, 2]], c1, 2.6); G.line(g, 0, -8, 0, 36, 1.4, 'rgba(0,0,0,.25)'); }
    else if (kind === 'hoodie') { G.poly(g, [[-12, -10], [-5, -12], [5, -12], [12, -10], [21, 4], [15, 10], [11, 4], [11, 40], [-11, 40], [-11, 4], [-15, 10], [-21, 4]], c1, 2.6); G.ell(g, 0, -8, 9, 5, G.shade(c1, -.15), 2); rr(g, -8, 22, 16, 11, 3, G.shade(c1, -.1), 2); }
    else if (kind === 'jacket') { G.poly(g, [[-12, -10], [-4, -12], [0, -8], [4, -12], [12, -10], [22, 6], [16, 12], [12, 6], [12, 44], [-12, 44], [-12, 6], [-16, 12], [-22, 6]], c1, 2.6); G.line(g, 0, -8, 0, 42, 2, c2 || '#ddd'); }
    else if (kind === 'dress') { G.poly(g, [[-8, -10], [-3, -12], [0, -9], [3, -12], [8, -10], [10, 0], [6, 6], [22, 52], [-22, 52], [-6, 6], [-10, 0]], c1, 2.6); G.line(g, -7, 8, 7, 8, 3, c2 || '#fff'); }
    else if (kind === 'skirt') { G.poly(g, [[-9, -8], [9, -8], [24, 40], [-24, 40]], c1, 2.6); G.line(g, -9, -4, 9, -4, 4, c2 || '#fff'); }
    else if (kind === 'pants') { G.poly(g, [[-10, -8], [10, -8], [12, 44], [2, 44], [0, 6], [-2, 44], [-12, 44]], c1, 2.6); }
    g.restore();
  }
  /* big wardrobe: static carcass + interior baked; the two doors are drawn live (swing by S.wd) */
  function wardrobeBody(g, s, x, y, w, h, o) {
    const S = s.state, wood = o.wood, trim = o.trim; G.ao(g, x, y, w, h);
    rr(g, x - 8, y - 12, w + 16, 14, 4, trim, 3); rr(g, x, y, w, h, 5, wood, 4);
    // interior
    rr(g, x + 8, y + 10, w - 16, h - 26, 3, o.inner, 2); g.fillStyle = 'rgba(30,10,0,.28)'; g.fillRect(x + 8, y + 10, w - 16, 16); g.fillStyle = 'rgba(30,10,0,.14)'; g.fillRect(x + 8, y + 10, 10, h - 26);
    const mid = x + w / 2; G.line(g, mid, y + 12, mid, y + h * .6, 3, 'rgba(60,30,10,.4)');
    G.line(g, x + 14, y + 38, x + w - 14, y + 38, 4, '#c9b79a');   // rail
    o.items.forEach((it, i) => garment(g, x + 24 + i * ((w - 48) / Math.max(1, o.items.length - 1)), y + 62, it[0], it[1], it[2]));
    rr(g, x + 8, y + h * .62, w - 16, 7, 2, G.shade(wood, .1), 2);   // shelf
    o.folded.forEach((c, i) => { rr(g, x + 16 + (i % 3) * 36, y + h * .62 - 14 - Math.floor(i / 3) * 13, 32, 13, 3, c, 2); });
    // drawers + shoe corner
    rr(g, x + 8, y + h * .62 + 8, w - 16, h * .38 - 22, 3, G.shade(wood, -.08), 2.5); G.line(g, mid, y + h * .62 + 8, mid, y + h - 14, 2.5, 'rgba(60,30,10,.5)');
    [mid - 22, mid + 22].forEach(cx => G.circ(g, cx, y + h * .62 + 34, 4, '#ffd23c', 1.5));
    [[x + 20, '#ef5350'], [x + 34, '#fff'], [x + w - 48, '#4a8dff']].forEach(a => { G.ell(g, a[0], y + h - 20, 9, 4.5, a[1], 2); });
    G.ell(g, x + w / 2, y + h + 6, w * .55, 7, 'rgba(40,18,0,.0)', 0);
  }
  function wardrobeDoors(g, s, x, y, w, h, o) {
    const S = s.state, k = clamp(S.wd || 0, 0, 1), hw = w / 2, ang = k * 1.28, cw = Math.cos(ang) * hw, lift = Math.sin(ang) * 10;
    const door = (hx, dir) => {   // hinge at hx, opens toward the viewer (free edge bigger)
      const fx = hx + dir * cw;
      g.save(); g.beginPath(); g.moveTo(hx, y + 2); g.lineTo(fx, y + 2 - lift); g.lineTo(fx, y + h - 2 + lift); g.lineTo(hx, y + h - 2); g.closePath();
      const gr = g.createLinearGradient(hx, 0, fx, 0); gr.addColorStop(0, G.shade(o.door, -.1)); gr.addColorStop(1, G.shade(o.door, k > .02 ? -.22 : .06)); g.fillStyle = gr; g.fill(); g.lineWidth = 3.2; g.strokeStyle = 'rgba(70,40,24,.75)'; g.stroke(); g.clip();
      // panels (squashed with the door)
      const u = Math.abs(fx - hx), pw = u - 16, px = Math.min(hx, fx) + 8; if (pw > 6) { g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.4; G.rr(g, px, y + 16, pw, h * .36, 6); g.stroke(); G.rr(g, px, y + h * .36 + 34, pw, h * .5 - 40, 6); g.stroke(); g.strokeStyle = 'rgba(60,30,10,.18)'; G.rr(g, px + 1.5, y + 18, pw, h * .36, 6); g.stroke(); if (o.deco) o.deco(g, px, y, pw, h, dir); }
      g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(Math.min(hx, fx) + 2, y, Math.abs(fx - hx) * .18, h);
      g.restore();
      if (cw > 8) o.handle(g, hx + dir * Math.max(10, cw * .86), y + h * .5, dir);
    };
    door(x, 1); door(x + w, -1);
  }
  /* full-length standing mirror; the reflection is drawn live (small version of the active hero in the glass) */
  function mirror(g, s, x, y, w, h, o) {
    G.ao(g, x, y, w, h); G.line(g, x + w * .2, y + h, x + w * .02, FLOOR + 10, 6, o.frame); G.line(g, x + w * .8, y + h, x + w * .98, FLOOR + 10, 6, o.frame);
    rr(g, x - 8, y - 8, w + 16, h + 16, o.round || 12, o.frame, 4);
    const gx = x + 2, gy = y + 2, gw = w - 4, gh = h - 4;
    G.rr(g, gx, gy, gw, gh, o.round ? 8 : 3); const gr = g.createLinearGradient(gx, gy, gx + gw, gy + gh); gr.addColorStop(0, '#e9f6ff'); gr.addColorStop(.5, '#c3e4f8'); gr.addColorStop(1, '#d9eefc'); g.fillStyle = gr; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(70,40,24,.55)'; g.stroke();
    if (o.top) o.top(g, x, y, w);
    // reflection of the floor + room colour
    g.save(); G.rr(g, gx, gy, gw, gh, 3); g.clip(); g.fillStyle = 'rgba(' + o.tint + ',.16)'; g.fillRect(gx, gy + gh * .72, gw, gh * .28); g.restore();
    G.live(g, s, (c, t, st) => {
      const id = st.active, h0 = st.heroes && st.heroes[id]; if (!h0 || !h0.visible) return;
      c.save(); G.rr(c, gx, gy, gw, gh, 3); c.clip();
      const bf = M.chars.height(id), k = Math.min(gh * .84 / bf, gw * .98 / 84);
      c.globalAlpha = .96; try { M.chars.draw(c, id, gx + gw / 2, gy + gh - 8, { anim: 'idle', t, sc: k, noShadow: true, key: 'mir:' + id, snap: M.quality && M.quality.level === 'low' }); } catch (e) { }
      c.globalAlpha = 1;
      const sh = c.createLinearGradient(gx, gy, gx + gw, gy + gh * .6); sh.addColorStop(0, 'rgba(255,255,255,.3)'); sh.addColorStop(.3, 'rgba(255,255,255,.03)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = sh; c.fillRect(gx, gy, gw, gh);
      c.beginPath(); c.moveTo(gx + gw * .1, gy + gh); c.lineTo(gx + gw * .42, gy); c.lineTo(gx + gw * .56, gy); c.lineTo(gx + gw * .24, gy + gh); c.fillStyle = 'rgba(255,255,255,.2)'; c.fill();
      const mz = st.state && st.state.mz || 0; if (mz > .01) { c.globalAlpha = mz * (.5 + .5 * Math.sin(t * 8)); c.lineWidth = 6; c.strokeStyle = '#fff6a8'; G.rr(c, gx + 2, gy + 2, gw - 4, gh - 4, 3); c.stroke(); c.globalAlpha = 1; for (let i = 0; i < 4; i++) G.sparkle(c, gx + gw * (.2 + (i * .27) % .7), gy + gh * (.15 + ((i * .31 + t * .2) % .6)), 6 + i, '#fff6a8', mz); }
      c.restore();
    }, 'mid');
  }
  function sparkleDust(s, x, y, w, h, n) { G.amb(s, { k: 'dust', box: [x, y, w, h], n: n || 14, z: 'top', seed: Math.round(x) }); }

  /* ====================================================================== BOYS' ROOM */
  M.look.setAll({
    room_boys: s => ({ tod: 'day', floor: FLOOR, lightX: 360, indoor: true, vig: .26, live: ['wd', 'mz', 'fx'], glow: { x: 360, y: 150, r: 360, a: .22, col: '255,232,170' } }),
    room_girls: s => ({ tod: 'warm', floor: FLOOR, lightX: 350, indoor: true, vig: .3, live: ['wd', 'mz', 'fx'], glow: { x: 340, y: 160, r: 340, a: .2, col: '255,214,225' } })
  });

  const BOYS = {
    gender: 'm', title: 'غرفة الأولاد', door: { x: 892, y: 214, w: 64, h: 216 },
    objects: [
      { id: 'wardrobe', x: 12, y: 112, w: 142, h: 322, say: 'wardrobe' },
      { id: 'mirror', x: 166, y: 152, w: 74, h: 278, say: 'mirror' },
      { id: 'robot', x: 436, y: 244, w: 60, h: 66, say: 'robot' },
      { id: 'cars', x: 510, y: 268, w: 62, h: 42, say: 'cars' },
      { id: 'blocks', x: 430, y: 372, w: 116, h: 62, say: 'blocks' },
      { id: 'ball', x: 560, y: 446, w: 52, h: 52, say: 'ball' },
      { id: 'telescope', x: 600, y: 262, w: 80, h: 172, say: 'telescope' },
      { id: 'poster1', x: 424, y: 76, w: 92, h: 112, say: 'poster' },
      { id: 'poster2', x: 528, y: 92, w: 88, h: 96, say: 'poster' }
    ]
  };
  SPEC.room_boys = BOYS;

  R.room_boys = function (g, t, s) {
    const S = s.state;
    RK.wall(g, FLOOR, '#d3e8fb', '#b4d5f2', { pattern: 'dots', pcol: 'rgba(255,255,255,.38)', dado: { h: 62, c: '#5b93d9' } });
    RK.floor(g, FLOOR, '#dba96c', '#a9743f', { kind: 'wood' });
    /* window with afternoon sun */
    G.window(g, s, 266, 78, 128, 138, { view: 'day', curtains: '#4a8dff', tod: 'day', dir: .5, shaftA: .2, floor: FLOOR });
    rr(g, 256, 214, 148, 10, 3, '#fff6e6', 2.5); G.circ(g, 274, 207, 6, '#5cc96b', 1.5); rr(g, 266, 206, 18, 12, 2, '#d9885a', 1.5);
    /* door (exit) */
    const d = BOYS.door; G.ao(g, d.x, d.y, d.w, d.h); rr(g, d.x - 4, d.y - 8, d.w + 8, d.h + 8, 4, '#f4ead6', 3); rr(g, d.x, d.y, d.w, d.h, 3, '#c8935a', 3.5);
    G.rr(g, d.x + 8, d.y + 14, d.w - 16, 72, 5); g.strokeStyle = 'rgba(255,255,255,.4)'; g.lineWidth = 2.4; g.stroke(); G.rr(g, d.x + 8, d.y + 104, d.w - 16, 96, 5); g.stroke(); G.circ(g, d.x + d.w - 12, d.y + 112, 5, '#ffd23c', 2);
    rr(g, d.x + 8, d.y - 44, 46, 34, 7, '#ffffff', 3); G.poly(g, [[d.x + 14, d.y - 27], [d.x + 30, d.y - 27], [d.x + 30, d.y - 34], [d.x + 44, d.y - 24], [d.x + 30, d.y - 14], [d.x + 30, d.y - 21], [d.x + 14, d.y - 21]], '#5cc96b', 2.2);   // "exit" sign: arrow out
    /* posters */
    RK.frame(g, 424, 76, 92, 112, { frame: '#fff', bg: '#243a73', draw: (g, x, y, w, h) => {
      for (let i = 0; i < 12; i++) G.sparkle(g, x + 6 + (i * 29) % (w - 10), y + 6 + (i * 41) % (h - 50), 2 + i % 3, '#fff6a8', .9);
      G.circ(g, x + w * .66, y + h * .34, 17, '#ff8a2a', 2.5); G.ell(g, x + w * .66, y + h * .34, 28, 6, null, 2.6, '#ffe14d', -.4); G.circ(g, x + w * .3, y + h * .62, 8, '#5cc96b', 2);
      g.save(); g.translate(x + w * .26, y + h * .3); g.rotate(.7); G.fillRR(g, -5, -17, 10, 28, 5, '#fff', 2.2); G.poly(g, [[-5, -14], [0, -26], [5, -14]], '#ef5350', 2.2); G.poly(g, [[-5, 8], [-11, 16], [-5, 12]], '#ef5350', 1.8); G.poly(g, [[5, 8], [11, 16], [5, 12]], '#ef5350', 1.8); G.circ(g, 0, -4, 3.2, '#9fd8ff', 1.4); g.restore();
      G.fillRR(g, x + 8, y + h - 20, w - 16, 10, 4, '#4aa8e8', 2); } });
    RK.frame(g, 528, 92, 88, 96, { frame: '#fff', bg: '#fff1c9', draw: (g, x, y, w, h) => {   // lion + giraffe spots
      G.circ(g, x + w * .5, y + h * .46, 24, '#ffb347', 2.5); for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; G.circ(g, x + w * .5 + Math.cos(a) * 26, y + h * .46 + Math.sin(a) * 26, 8, '#b5651d', 1.8); }
      G.circ(g, x + w * .5, y + h * .46, 21, '#ffc15e', 2); [-1, 1].forEach(sg => { G.circ(g, x + w * .5 + sg * 8, y + h * .42, 3.6, '#3a2a1e', 0); G.circ(g, x + w * .5 + sg * 8 + 1, y + h * .42 - 1, 1.2, '#fff', 0); }); G.ell(g, x + w * .5, y + h * .54, 6, 4.5, '#ff8a85', 1.6); g.beginPath(); g.arc(x + w * .5, y + h * .57, 6, .2, Math.PI - .2); g.lineWidth = 2; g.strokeStyle = '#3a2a1e'; g.stroke(); } });
    /* toy shelf unit (robot / cars / blocks / book) */
    RK.shelf(g, 410, 308, 200, '#c8935a'); RK.shelf(g, 410, 366, 200, '#c8935a');
    A.draw(g, 'blocks', 566, 338, 44); A.draw(g, 'book', 536, 349, 22);
    /* lego-like table with studs + a little built castle */
    G.ao(g, 430, 398, 124, 34); rr(g, 430, 404, 124, 16, 4, '#ffcf3d', 3.5); for (let i = 0; i < 7; i++) rr(g, 436 + i * 17, 398, 12, 7, 3, '#ffe27a', 1.8); G.line(g, 440, 420, 440, 436, 7, '#e0a824'); G.line(g, 544, 420, 544, 436, 7, '#e0a824');
    /* wardrobe + mirror (static parts) */
    wardrobeBody(g, s, 12, 112, 142, 322, { wood: '#c98b52', trim: '#a8693a', inner: '#f7e9d0', items: [['shirt', '#4aa8e8'], ['hoodie', '#ff8a2a'], ['shirt', '#5cc96b'], ['jacket', '#2b3a67', '#ffd23c']], folded: ['#f2679a', '#fff3c4', '#8a6bd6', '#4aa8e8', '#ffd23c'] });
    mirror(g, s, 168, 152, 70, 278, { frame: '#4a8dff', tint: '74,141,255', round: 10, top: (g, x, y, w) => { G.star(g, x + w / 2, y - 14, 9, '#ffd23c', 2.2); } });
    /* rug + football on the floor */
    RK.rug(g, 250, 498, 230, 34, '#4a8dff', '#ffb347', { star: true });
    /* bunk bed */
    const bx = 690, bw = 190;
    G.ao(g, bx, 150, bw, 284);
    G.fillRR(g, bx, 150, 12, 284, 4, '#8a5a3a', 4); G.fillRR(g, bx + bw - 12, 150, 12, 284, 4, '#8a5a3a', 4);
    rr(g, bx + 4, 212, bw - 8, 14, 4, '#c8935a', 3.5); rr(g, bx + 10, 176, bw - 20, 40, 9, '#4a8dff', 3.5); rr(g, bx + 14, 180, 54, 24, 10, '#fff', 2.5);
    for (let i = 0; i < 4; i++) G.star(g, bx + 82 + i * 26, 196, 6, '#ffd23c', 1.5);
    G.line(g, bx + 12, 150, bx + 12, 112, 5, '#8a5a3a'); G.line(g, bx + bw - 12, 150, bx + bw - 12, 112, 5, '#8a5a3a'); G.line(g, bx + 12, 112, bx + bw - 12, 112, 5, '#8a5a3a');
    g.fillStyle = G.lin(g, 0, 226, 0, 266, ['rgba(40,25,60,.3)', 'rgba(40,25,60,0)']); g.fillRect(bx + 12, 226, bw - 24, 40);
    rr(g, bx + 4, 372, bw - 8, 16, 4, '#c8935a', 3.5); rr(g, bx + 10, 332, bw - 20, 44, 10, '#ffb347', 3.5); rr(g, bx + 36, 336, bw - 50, 36, 10, '#ff9a22', 3); rr(g, bx + 14, 322, 60, 24, 11, '#fff', 3);
    G.line(g, bx + 56, 349, bx + bw - 14, 349, 3, 'rgba(255,255,255,.5)'); for (let i = 0; i < 4; i++) G.sparkle(g, bx + 78 + i * 26, 360, 5, 'rgba(255,255,255,.7)', .8);
    G.line(g, bx + bw - 44, 218, bx + bw - 44, 372, 5, '#8a5a3a'); G.line(g, bx + bw - 22, 218, bx + bw - 22, 372, 5, '#8a5a3a'); [244, 272, 300, 330, 358].forEach(y => G.line(g, bx + bw - 44, y, bx + bw - 22, y, 5, '#8a5a3a'));
    /* ambient life */
    sparkleDust(s, 270, 230, 160, 200, 12);
    G.amb(s, { k: 'glow', x: 520, y: 296, r: 130, col: '255,230,160', a: .16, z: 'top' });
    /* live: wardrobe doors, robot, cars, blocks, ball, telescope */
    G.live(g, s, (c, tt, st) => {
      wardrobeDoors(c, st, 12, 112, 142, 322, { door: '#d9a066', handle: (g2, x, y, dir) => { rr(g2, x - 3, y - 22, 6, 44, 3, '#ffd23c', 2); }, deco: (g2, px, y, pw, h, dir) => { G.star(g2, px + pw / 2, y + h * .2, Math.min(14, pw * .3), '#ffd23c', 2); } });
      /* robot (shelf): beeps - wiggles + eyes flash */
      const kr = since(st, 'robot'), act = kr < 1.4, wig = act ? Math.sin(kr * 22) * 3 * (1 - kr / 1.4) : 0;
      c.save(); c.translate(466, 306 + (act ? -Math.abs(Math.sin(kr * 9)) * 6 : 0)); c.rotate(wig * .03);
      rr(c, -17, -42, 34, 28, 6, '#9fb6c9', 3); rr(c, -22, -18, 44, 26, 6, '#7f98ad', 3); G.line(c, 0, -42, 0, -52, 2.5, '#6b7f92'); G.circ(c, 0, -54, 3.6, act ? '#ef5350' : '#ffd23c', 1.5);
      [-7, 7].forEach(x => G.circ(c, x, -30, 4.8, act && Math.floor(kr * 10) % 2 ? '#ffffff' : '#6fd0ff', 1.6)); rr(c, -9, -21, 18, 4, 2, '#3a4a5a', 1); [-8, 0, 8].forEach((x, i) => G.circ(c, x, -8, 2.6, ['#ef5350', '#5cc96b', '#ffd23c'][i], 1)); rr(c, -26, -14, 6, 16, 3, '#6b7f92', 2); rr(c, 20, -14, 6, 16, 3, '#6b7f92', 2); c.restore();
      if (act) { G.text(c, 'بيب بوب!', 466, 238 - kr * 14, { size: 20, color: '#2b3a67', stroke: '#fff', sw: 4 }); }
      /* toy cars: roll along the shelf */
      const kc = since(st, 'cars'), cx = 526 + (kc < 1.6 ? Math.sin(kc / 1.6 * Math.PI) * 30 : 0);
      c.save(); c.translate(cx, 306); rr(c, -22, -17, 44, 12, 4, '#ef5350', 2.5); rr(c, -12, -27, 24, 12, 4, '#ff8a85', 2.5); rr(c, -9, -25, 8, 8, 1.5, '#bfe8ff', 1); rr(c, 1, -25, 8, 8, 1.5, '#bfe8ff', 1); [-13, 13].forEach(x => { G.circ(c, x, -4, 5.2, '#2b2b30', 2); G.circ(c, x, -4, 1.8, '#cfcfd6', 0); }); c.restore();
      G.ell(c, 560, 321, 10, 2.2, 'rgba(0,0,0,.14)', 0); c.save(); c.translate(562, 306); rr(c, -10, -9, 20, 8, 3, '#4aa8e8', 2); rr(c, -6, -15, 12, 7, 3, '#8fd1ff', 2); [-6, 6].forEach(x => G.circ(c, x, -1, 3.2, '#2b2b30', 1.5)); c.restore();
      /* blocks tower on the lego table: grows a block on tap */
      const kb = since(st, 'blocks'), extra = kb < 1.2 ? Math.floor(kb / .3) : 0, cols = ['#ef5350', '#4a8dff', '#5cc96b', '#ffd23c', '#8a6bd6', '#ff8a2a'];
      for (let i = 0; i < 4 + extra; i++) { const bxx = 450 + (i % 2) * 22 + (i > 3 ? 4 : 0), byy = 398 - Math.floor(i / 2) * 15 - (i > 3 ? 15 : 0); rr(c, bxx, byy - 14, 22, 14, 3, cols[i % cols.length], 2.4); [4, 14].forEach(o => rr(c, bxx + o, byy - 18, 6, 5, 2, G.shade(cols[i % cols.length], .15), 1.4)); }
      rr(c, 514, 384, 22, 14, 3, '#ffd23c', 2.4); rr(c, 519, 370, 12, 14, 3, '#ef5350', 2.4); G.poly(c, [[517, 370], [525, 358], [533, 370]], '#4a8dff', 2.2);
      /* football bounces on tap */
      const kf = since(st, 'ball'), dur = 1.6; let by = 0, bxo = 0; if (kf < dur) { const u = kf / dur; by = Math.abs(Math.sin(u * Math.PI * 3.2)) * 70 * Math.pow(1 - u, 1.2); bxo = Math.sin(u * 4) * 8; }
      G.ell(c, 586 + bxo, 486, 22 - by * .12, 5, 'rgba(40,18,0,.25)', 0); c.save(); c.translate(586 + bxo, 470 - by); c.rotate(kf < dur ? kf * 6 : 0); G.circ(c, 0, 0, 21, '#fff', 3); [[0, 0], [11, -12], [-12, -11], [12, 12], [-11, 12]].forEach((p, i) => { c.beginPath(); for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + k * TAU / 5; k ? c.lineTo(p[0] + Math.cos(a) * 5.4, p[1] + Math.sin(a) * 5.4) : c.moveTo(p[0] + Math.cos(a) * 5.4, p[1] + Math.sin(a) * 5.4); } c.closePath(); c.fillStyle = '#26262c'; c.fill(); }); c.restore();
      /* telescope: tube swings up on tap + stars twinkle in the lens */
      const kt = since(st, 'telescope'), ang = kt < 2 ? Math.sin(Math.min(1, kt / .5) * 1.2) * .25 : 0;
      c.save(); c.translate(632, 330); [-1, 0, 1].forEach(k => G.line(c, 0, 0, k * 26, 102, 5, '#8a5a3a')); c.rotate(-.55 - ang); rr(c, -14, -12, 76, 24, 8, '#4a8dff', 3); rr(c, 54, -15, 20, 30, 6, '#2f6fe0', 3); rr(c, -22, -9, 12, 18, 4, '#ffd23c', 2.5); G.circ(c, 72, 0, 8, '#bfe8ff', 2); G.line(c, 10, -12, 10, 12, 2, 'rgba(255,255,255,.4)'); c.restore();
      if (kt < 2) for (let i = 0; i < 6; i++) G.sparkle(c, 690 + Math.cos(i * 2.1 + kt * 3) * 24, 250 - kt * 20 + Math.sin(i * 1.7) * 30, 5 + (i % 3) * 2, '#fff6a8', Math.max(0, 1 - kt / 2));
    }, 'mid');
    G.amb(s, { k: 'glow', x: 84, y: 150, r: 60, col: '255,224,150', a: .12, z: 'mid' });
  };

  /* ====================================================================== GIRLS' ROOM */
  const GIRLS = {
    gender: 'f', title: 'غرفة البنات', door: { x: 892, y: 214, w: 64, h: 216 },
    objects: [
      { id: 'wardrobe', x: 12, y: 112, w: 140, h: 322, say: 'wardrobe' },
      { id: 'mirror', x: 166, y: 132, w: 68, h: 300, say: 'mirror' },
      { id: 'books', x: 420, y: 132, w: 72, h: 300, say: 'books' },
      { id: 'flowers', x: 496, y: 372, w: 40, h: 66, say: 'flowers' },
      { id: 'paints', x: 534, y: 372, w: 92, h: 70, say: 'paints' },
      { id: 'dollhouse', x: 632, y: 236, w: 96, h: 200, say: 'dollhouse' },
      { id: 'plush', x: 740, y: 286, w: 130, h: 76, say: 'plush' },
      { id: 'fairy', x: 260, y: 30, w: 460, h: 50, say: 'fairy' }
    ]
  };
  SPEC.room_girls = GIRLS;

  R.room_girls = function (g, t, s) {
    const S = s.state;
    RK.wall(g, FLOOR, '#ffe6ef', '#f8cfe0', { pattern: 'stars', pcol: 'rgba(255,255,255,.5)', dado: { h: 56, c: '#ffffff' }, baseCol: '#fff' });
    RK.floor(g, FLOOR, '#e6bf92', '#b98a5a', { kind: 'wood', line: 'rgba(120,70,40,.22)' });
    G.window(g, s, 266, 78, 128, 138, { view: 'sunset', curtains: ['#ffb3cc', '#ffb3cc'], tod: 'warm', dir: .5, shaftA: .18, floor: FLOOR, frame: '#fff' });
    rr(g, 256, 214, 148, 10, 3, '#fff', 2.5);
    /* door */
    const d = GIRLS.door; G.ao(g, d.x, d.y, d.w, d.h); rr(g, d.x - 4, d.y - 8, d.w + 8, d.h + 8, 4, '#fff', 3); rr(g, d.x, d.y, d.w, d.h, 3, '#f7c6d9', 3.5);
    G.rr(g, d.x + 8, d.y + 14, d.w - 16, 72, 8); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2.4; g.stroke(); G.rr(g, d.x + 8, d.y + 104, d.w - 16, 96, 8); g.stroke(); G.heart(g, d.x + d.w - 14, d.y + 112, 6, '#ff6f91', 1.8);
    rr(g, d.x + 8, d.y - 44, 46, 34, 7, '#ffffff', 3); G.poly(g, [[d.x + 14, d.y - 27], [d.x + 30, d.y - 27], [d.x + 30, d.y - 34], [d.x + 44, d.y - 24], [d.x + 30, d.y - 14], [d.x + 30, d.y - 21], [d.x + 14, d.y - 21]], '#ff6f91', 2.2);
    /* canopy bed (left) */
    const bx = 736, bw = 150;
    G.ao(g, bx, 150, bw, 286);
    G.line(g, bx + 8, 130, bx + 8, 400, 7, '#ffffff'); G.line(g, bx + bw - 8, 130, bx + bw - 8, 400, 7, '#ffffff'); G.circ(g, bx + 8, 126, 8, '#ffd9e6', 2.5); G.circ(g, bx + bw - 8, 126, 8, '#ffd9e6', 2.5);
    { const cx = bx + bw / 2; G.circ(g, cx, 98, 9, '#ffd9e6', 2.5); G.line(g, cx, 60, cx, 90, 3, '#d9b8c8');   // canopy: sheer fabric draped from a ring over the bed, tied back at both posts
      [-1, 1].forEach(sg => { const px = cx + sg * (bw / 2 - 8); g.save(); g.globalAlpha = .64; g.beginPath(); g.moveTo(cx, 104); g.quadraticCurveTo(cx + sg * bw * .34, 118, px, 170); g.quadraticCurveTo(px + sg * 12, 250, px - sg * 6, 316); g.lineTo(px - sg * 30, 316); g.quadraticCurveTo(px - sg * 34, 230, px - sg * 24, 176); g.quadraticCurveTo(cx + sg * bw * .2, 136, cx - sg * 4, 112); g.closePath(); G.fs(g, '#ffd0e4', 2.4); g.restore(); });
      G.line(g, bx + 8, 170, bx + 24, 232, 3, '#ffb3cc'); G.line(g, bx + bw - 8, 170, bx + bw - 24, 232, 3, '#ffb3cc'); }
    for (let i = 0; i < 5; i++) G.sparkle(g, bx + 20 + i * 28, 150 + (i % 2) * 20, 4, 'rgba(255,255,255,.85)', .9);
    rr(g, bx + 6, 382, bw - 12, 22, 5, '#ffffff', 3.5); rr(g, bx + 10, 330, bw - 20, 58, 14, '#ffb3cc', 3.5); rr(g, bx + 40, 334, bw - 52, 48, 12, '#ff8fb8', 3); G.line(g, bx + 44, 358, bx + bw - 14, 358, 3, 'rgba(255,255,255,.55)'); for (let i = 0; i < 3; i++) G.heart(g, bx + 66 + i * 26, 372, 5, '#fff', 1.2);
    rr(g, bx + 12, 308, 56, 32, 14, '#fff', 3); rr(g, bx + 62, 316, 44, 26, 12, '#d9c8ff', 3); rr(g, bx + 16, 296, 40, 26, 12, '#bff0e0', 3);
    /* bookshelf */
    G.ao(g, 420, 132, 72, 300); rr(g, 420, 132, 72, 300, 5, '#fff', 3.5); rr(g, 428, 142, 56, 284, 3, '#f6dfe9', 2);
    [0, 1, 2, 3].forEach(r => { const y0 = 150 + r * 70; rr(g, 428, y0 + 56, 56, 8, 2, '#fff', 2); let x = 432; ['#ff6f91', '#4aa8e8', '#ffd23c', '#5cc96b', '#8a6bd6', '#ff8a2a', '#2fbfa8'].forEach((c, i) => { const w = 7 + (i * 5 + r * 3) % 6, h = 36 + (i * 7 + r * 5) % 18; if (x + w < 482) { rr(g, x, y0 + 56 - h, w, h, 1.6, c, 1.8); x += w + 1.5; } }); });
    G.heart(g, 456, 156, 9, '#ff6f91', 2);
    /* craft table + paints + canvas */
    G.ao(g, 534, 400, 92, 34); rr(g, 534, 398, 92, 14, 5, '#ffd9a8', 3.5); G.line(g, 544, 410, 544, 436, 7, '#e0a870'); G.line(g, 616, 410, 616, 436, 7, '#e0a870');
    rr(g, 548, 344, 52, 52, 3, '#fff', 3); G.heart(g, 574, 364, 9, '#ff6f91', 1.6); G.star(g, 562, 384, 6, '#ffd23c', 1.4); G.circ(g, 588, 382, 6, '#4aa8e8', 1.4); G.line(g, 540, 400, 562, 344, 2.4, '#8a5a3a');
    [['#ef5350', 548], ['#ffd23c', 560], ['#4aa8e8', 572], ['#5cc96b', 584], ['#8a6bd6', 596]].forEach(a => { rr(g, a[1], 388, 10, 12, 3, a[0], 1.8); });
    /* doll house */
    const dx = 632, dy = 236; G.ao(g, dx, dy, 96, 200);
    rr(g, dx, dy + 80, 96, 120, 4, '#fff3c4', 3.5); G.poly(g, [[dx - 8, dy + 82], [dx + 48, dy + 18], [dx + 104, dy + 82]], '#ff8fb8', 3.5); G.line(g, dx + 48, dy + 18, dx + 48, dy + 4, 2.6, '#8a5a3a'); G.poly(g, [[dx + 48, dy + 4], [dx + 63, dy + 9], [dx + 48, dy + 14]], '#ffd23c', 1.8);
    rr(g, dx + 6, dy + 96, 38, 42, 4, '#ffe9c0', 2.6); rr(g, dx + 52, dy + 96, 38, 42, 4, '#ffe9c0', 2.6); rr(g, dx + 6, dy + 150, 38, 42, 4, '#e7f7ff', 2.6); rr(g, dx + 52, dy + 150, 38, 42, 4, '#ffe9c0', 2.6);
    G.line(g, dx + 4, dy + 144, dx + 92, dy + 144, 4, '#c8935a'); rr(g, dx + 35, dy + 40, 26, 26, 13, '#bfe8ff', 2.6); G.circ(g, dx + 48, dy + 53, 5, '#fff', 0);
    G.fillRR(g, dx + 58, dy + 164, 24, 30, 4, '#c8935a', 2.6); G.fillRR(g, dx + 12, dy + 176, 26, 16, 3, '#ffb3cc', 2.2);
    /* wardrobe + mirror */
    wardrobeBody(g, s, 12, 112, 140, 322, { wood: '#ffffff', trim: '#ffc7da', inner: '#fff0f5', items: [['dress', '#ff86ad', '#fff'], ['dress', '#8a6bd6', '#fff'], ['skirt', '#4aa8e8', '#fff'], ['shirt', '#ffd23c'], ['pants', '#6f8fd8']], folded: ['#ffb3cc', '#ffffff', '#bff0e0', '#d9c8ff', '#ffe27a'] });
    mirror(g, s, 168, 134, 64, 296, { frame: '#ffb3cc', tint: '255,150,190', round: 26, top: (g, x, y, w) => { G.heart(g, x + w / 2, y - 14, 9, '#ff6f91', 2.2); } });
    /* flowers pot + big plush by the wardrobe */
    G.ao(g, 496, 400, 36, 36); rr(g, 498, 404, 32, 32, 5, '#ffd9a8', 3); for (let i = 0; i < 5; i++) { const fx = 504 + i * 6, fy = 372 + (i % 2) * 10 + (i === 2 ? -8 : 0); G.line(g, fx, 404, fx, fy + 6, 2.4, '#3fae55'); [0, 1, 2, 3, 4].forEach(k => { const a = k * TAU / 5; G.circ(g, fx + Math.cos(a) * 6, fy + Math.sin(a) * 6, 4.4, ['#ff6f91', '#ffd23c', '#fff', '#c9b6ec', '#ff8a2a'][i % 5], 1.4); }); G.circ(g, fx, fy, 3.2, '#ffe14d', 1); }
    /* rug */
    RK.rug(g, 290, 498, 240, 34, '#ffb3cc', '#fff3c4', { star: false }); G.heart(g, 290, 498, 14, '#ff6f91', 0);
    /* fairy lights (foreground sparkle) + soft glow */
    RK.stringLights(g, s, 140, 780, 28, 26, 22, ['#ffd86a', '#ff9ec0', '#9fe0ff', '#b6f08a', '#d9b8ff'], true);
    sparkleDust(s, 270, 220, 160, 200, 12);
    G.amb(s, { k: 'glow', x: 480, y: 80, r: 260, col: '255,200,225', a: .2, z: 'top' });
    G.live(g, s, (c, tt, st) => {
      wardrobeDoors(c, st, 12, 112, 140, 322, { door: '#ffffff', handle: (g2, x, y, dir) => { G.heart(g2, x, y, 8, '#ff6f91', 2); }, deco: (g2, px, y, pw, h, dir) => { [0, 1, 2, 3, 4].forEach(k => { const a = k * TAU / 5, cx = px + pw / 2, cy = y + h * .2; G.circ(g2, cx + Math.cos(a) * 8 * Math.min(1, pw / 40), cy + Math.sin(a) * 8, 4, '#ffb3cc', 1.4); }); G.circ(g2, px + pw / 2, y + h * .2, 3.2, '#ffe14d', 1); } });
      /* doll house: windows light up on tap, small figure waves */
      const kd = since(st, 'dollhouse'), on = (st.state.fx && st.state.fx.dhOn) ? 1 : 0, glow = on ? 1 : (kd < 1.4 ? .6 : 0);
      [[dx + 6, dy + 96], [dx + 52, dy + 96], [dx + 6, dy + 150], [dx + 52, dy + 150]].forEach((p, i) => { if (glow) { c.save(); c.globalCompositeOperation = 'lighter'; c.globalAlpha = .75 * glow * (.9 + .1 * Math.sin(tt * 5 + i)); c.drawImage(G.glowSprite('255,214,120'), p[0] - 18, p[1] - 18, 76, 78); c.restore(); } });
      if (glow) { G.fillRR(c, dx + 10, dy + 100, 30, 34, 3, 'rgba(255,230,150,.85)', 1.2); G.fillRR(c, dx + 56, dy + 100, 30, 34, 3, 'rgba(255,230,150,.85)', 1.2); G.fillRR(c, dx + 56, dy + 154, 30, 34, 3, 'rgba(255,230,150,.85)', 1.2); }
      c.save(); c.translate(dx + 26, dy + 190 - (kd < 1 ? Math.abs(Math.sin(kd * 10)) * 5 : 0)); G.circ(c, 0, -22, 7, '#ffd0a8', 2); rr(c, -7, -16, 14, 18, 5, '#ff8fb8', 2); c.restore();
      /* plush pile on the bed: squish on tap */
      const kp = since(st, 'plush'), sq = kp < .8 ? 1 + Math.sin(kp / .8 * Math.PI) * .12 : 1;
      c.save(); c.translate(808, 336); c.scale(1 / sq, sq); G.circ(c, 0, -20, 17, '#d9a066', 2.6); G.circ(c, -13, -35, 7, '#d9a066', 2.2); G.circ(c, 13, -35, 7, '#d9a066', 2.2); G.circ(c, -13, -35, 3.6, '#ffb3cc', 0); G.circ(c, 13, -35, 3.6, '#ffb3cc', 0); G.ell(c, 0, -17, 8, 6.4, '#f4d6b0', 1.8); G.circ(c, -6, -23, 2.1, '#3a2a1e', 0); G.circ(c, 6, -23, 2.1, '#3a2a1e', 0); G.ell(c, 0, -19, 3, 2.2, '#3a2a1e', 0); G.heart(c, 0, 1, 5, '#ff6f91', 1.4); c.restore();
      G.circ(c, 846, 334, 9, '#fff', 2); G.circ(c, 846, 334, 6, '#c9b6ec', 0); G.ell(c, 770, 340, 14, 11, '#bff0e0', 2.4); G.circ(c, 763, 331, 5, '#bff0e0', 2); G.circ(c, 777, 331, 5, '#bff0e0', 2);
      if (kp < 1.2) for (let i = 0; i < 4; i++) G.heart(c, 808 + Math.sin(i * 2 + kp * 3) * 18, 290 - kp * 30 - i * 8, 4 + i, '#ff6f91', 1);
      /* paints: a rainbow stroke appears on the canvas */
      const kk = since(st, 'paints'), prog = clamp(kk / .9, 0, 1); if (kk < 5) { c.save(); c.lineCap = 'round'; ['#ef5350', '#ffd23c', '#5cc96b', '#4aa8e8', '#8a6bd6'].forEach((col, i) => { c.beginPath(); c.arc(574, 390, 20 - i * 3.2, Math.PI * 1.08, Math.PI * (1.08 + .84 * prog)); c.lineWidth = 3; c.strokeStyle = col; c.stroke(); }); c.restore(); }
      /* books: one pops out */
      const kb = since(st, 'books'); if (kb < 1.4) { const u = Math.sin(clamp(kb / 1.4, 0, 1) * Math.PI); rr(c, 452 - u * 6, 218 - u * 26, 10, 40, 2, '#ff6f91', 2); G.sparkle(c, 462, 200 - u * 30, 7, '#fff6a8', u); }
    }, 'mid');
  };
})();
