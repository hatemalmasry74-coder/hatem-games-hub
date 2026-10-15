/* Moody & Aboody - engine/chars.js : the two heroes, drawn with canvas code (front-facing cartoon, outlines, shading).
   M.chars.draw(g, id, x, y, o)   x,y = feet centre.
   o = { anim, t, dir(+1/-1), sc, hat, shirt, talk, carry, alpha, expr, lookX }
   anims: idle walk run jump pickup lift cheer oops think sleep wave  */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, OL = M.OL, R2D = Math.PI / 180;
  const HAIR = '#3b2417', HAIR_HI = '#6a4630';

  const DEFS = {
    moody: { name: 'مودي', age: 9, sc: 1, L: 56, T: 58, R: 28, hr: .94, sw: 22, skin: '#dd9d6c', skinD: '#c98655', shirt: '#9ea4ab', pants: '#e7b038', shoe: '#7a5238', curl: .29, eye: 1, img: 'assets/moody_cartoon.jpg', w: 20, wf: 12, a1: 24, a2: 24 },
    aboody: { name: 'عبودي', age: 6, sc: .76, L: 44, T: 46, R: 33, hr: 1.0, sw: 21, skin: '#cf8b5a', skinD: '#b9764a', shirt: '#26396e', pants: '#cdb68b', shoe: '#f3eee2', curl: .31, eye: 1.18, img: 'assets/aboody_cartoon.jpg', w: 18, wf: 11, a1: 20, a2: 20 }
  };
  const C = M.chars = { defs: DEFS, hats: {}, shirts: {} };
  C.avatar = id => DEFS[id].img;
  C.height = id => { const d = DEFS[id]; return (d.L + d.T + 6 + d.R * 2 + 8) * d.sc; };

  /* ----- cosmetics registry (extensible: worlds may add more) ----- */
  C.registerHat = (id, name, price, draw) => { C.hats[id] = { id, name, price, draw }; };
  C.registerShirt = (id, name, price, color) => { C.shirts[id] = { id, name, price, color }; };
  C.registerHat('cap', 'كاب أحمر', 10, (g, R) => { g.beginPath(); g.ellipse(0, -R * .72, R * 1.0, R * .62, 0, Math.PI, 0); G.fs(g, '#ef5350', 3.5); G.ell(g, R * .55, -R * .48, R * .75, R * .17, '#c62f2c', 3.5); G.circ(g, 0, -R * 1.32, R * .1, '#c62f2c', 2.5); });
  C.registerHat('party', 'طاقية حفلة', 15, (g, R) => { G.poly(g, [[-R * .55, -R * .75], [R * .55, -R * .75], [0, -R * 2.0]], '#ff6f91', 3.5); [[-.25, -1.0], [.2, -1.35], [-.05, -1.6]].forEach(p => G.circ(g, p[0] * R, p[1] * R, R * .09, '#ffe14d', 0)); G.circ(g, 0, -R * 2.02, R * .17, '#ffe14d', 3); });
  C.registerHat('crown', 'تاج ملوكي', 30, (g, R) => { G.poly(g, [[-R * .7, -R * .72], [-R * .7, -R * 1.45], [-R * .35, -R * 1.1], [0, -R * 1.6], [R * .35, -R * 1.1], [R * .7, -R * 1.45], [R * .7, -R * .72]], '#ffc93c', 3.5); G.circ(g, 0, -R * .95, R * .12, '#ef5350', 2.5); G.circ(g, -R * .4, -R * .9, R * .08, '#4a8dff', 2); G.circ(g, R * .4, -R * .9, R * .08, '#5cc96b', 2); });
  C.registerHat('chef', 'طاقية الشيف', 20, (g, R) => { G.fillRR(g, -R * .62, -R * .95, R * 1.24, R * .38, R * .08, '#fff', 3.5); [[-.45, -1.25, .42], [0, -1.5, .5], [.45, -1.25, .42]].forEach(p => G.circ(g, p[0] * R, p[1] * R, p[2] * R, '#fff', 3.5)); G.fillRR(g, -R * .62, -R * 1.0, R * 1.24, R * .4, R * .08, '#fff', 0); });
  C.registerHat('beanie', 'طاقية شتا', 15, (g, R) => { g.beginPath(); g.ellipse(0, -R * .72, R * 1.0, R * .72, 0, Math.PI, 0); G.fs(g, '#4a8dff', 3.5); G.fillRR(g, -R * 1.02, -R * .86, R * 2.04, R * .3, R * .12, '#2f6fe0', 3.5); G.circ(g, 0, -R * 1.5, R * .2, '#fff', 3); });
  C.registerHat('flower', 'تاج ورد', 20, (g, R) => { for (let i = -3; i <= 3; i++) { const a = -Math.PI / 2 + i * .34, x = Math.cos(a) * R * 1.03, y = Math.sin(a) * R * 1.0 - R * .08; G.circ(g, x, y, R * .16, ['#ff6f91', '#ffc93c', '#fff'][(i + 3) % 3], 2.5); G.circ(g, x, y, R * .05, '#ffe14d', 0); } });
  C.registerShirt('red', 'تيشيرت أحمر', 10, '#e5534b'); C.registerShirt('green', 'تيشيرت أخضر', 10, '#43a867');
  C.registerShirt('purple', 'تيشيرت بنفسجي', 10, '#8a6bd6'); C.registerShirt('orange', 'تيشيرت برتقالي', 10, '#ff8a2a');
  C.registerShirt('sky', 'تيشيرت سماوي', 10, '#4aa8e8'); C.registerShirt('pink', 'تيشيرت وردي', 10, '#f2679a');

  /* ----- limb helper: outlined capsule chain ----- */
  function limbOutline(g, pts, w) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = w + 5; g.strokeStyle = OL; g.stroke(); }
  function limb(g, pts, w, col) { g.beginPath(); pts.forEach((p, i) => i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1])); g.lineWidth = w; g.strokeStyle = col; g.stroke(); }

  /* ----- pose from animation ----- */
  function pose(anim, t, d) {
    const p = { bob: 0, sy: 1, rot: 0, ll: [0, 0], rl: [0, 0], la: [d.a1, 6], ra: [d.a1, 6], head: 0, eyes: 'open', brows: 'flat', mouth: 'smile', sweat: false, look: 0, lookY: 0, dip: 0, zzz: false, dots: false };
    const sin = Math.sin, cos = Math.cos, ab = Math.abs;
    switch (anim) {
      case 'walk': case 'run': {
        const f = anim === 'run' ? 14 : 9, s = sin(t * f), amp = anim === 'run' ? 1.5 : 1;
        p.ll = [s * 13 * amp, Math.max(0, -s) * 9 * amp]; p.rl = [-s * 13 * amp, Math.max(0, s) * 9 * amp];
        p.la = [d.a1 + 8 + s * 18 * amp, 8 + (anim === 'run' ? 40 : 6)]; p.ra = [d.a1 + 8 - s * 18 * amp, 8 + (anim === 'run' ? 40 : 6)];
        p.bob = -ab(cos(t * f)) * 3.5 * amp; p.rot = s * .03 * amp; p.mouth = anim === 'run' ? 'big' : 'smile'; break;
      }
      case 'jump': p.ll = [-9, 16]; p.rl = [9, 16]; p.la = [150, 160]; p.ra = [150, 160]; p.mouth = 'big'; p.eyes = 'happy'; p.sy = 1.05; break;
      case 'cheer': case 'wave': {
        const s = sin(t * 9); p.bob = -ab(sin(t * 7)) * 9; p.la = [140 + s * 10, 150 + s * 16]; p.ra = [anim === 'wave' ? 40 : 140 - s * 10, anim === 'wave' ? 140 + s * 20 : 150 - s * 16];
        p.eyes = 'happy'; p.mouth = 'big'; p.brows = 'up'; p.rot = s * .025; p.ll = [-3, ab(sin(t * 7)) * 3]; p.rl = [3, ab(sin(t * 7)) * 3]; break;
      }
      case 'oops': { const s = sin(t * 22); p.la = [110, -125]; p.ra = [110, -125]; p.eyes = 'wide'; p.brows = 'worry'; p.mouth = 'o'; p.sweat = true; p.bob = ab(s) * .8; p.rot = s * .012; p.sy = .98; break; }
      case 'think': p.ra = [26, -128]; p.la = [d.a1, 6]; p.eyes = 'up'; p.brows = 'think'; p.mouth = 'flat'; p.rot = sin(t * 1.5) * .03; p.dots = true; p.look = .5; break;
      case 'pickup': { const k = (sin(t * 3.2) + 1) / 2; p.dip = 12 + k * 6; p.la = [-8, 4]; p.ra = [-8, 4]; p.ll = [-6, 0]; p.rl = [6, 0]; p.eyes = 'open'; p.lookY = 1; p.mouth = 'smile'; p.rot = 0; break; }
      case 'lift': p.la = [165, 175]; p.ra = [165, 175]; p.mouth = 'big'; p.brows = 'worry'; p.eyes = 'happy'; p.bob = sin(t * 12) * .8; break;
      case 'sleep': p.eyes = 'closed'; p.mouth = 'flat'; p.bob = sin(t * 1.6) * 1.2; p.zzz = true; p.rot = .04; break;
      default: p.bob = sin(t * 2.2) * 1.4; p.la = [d.a1 + sin(t * 1.9) * 2, 6]; p.ra = [d.a1 - sin(t * 1.9) * 2, 6]; p.rot = sin(t * 1.1) * .008;
    }
    return p;
  }

  C.draw = function (g, id, x, y, o) {
    o = o || {}; const d = DEFS[id], t = o.t || 0, anim = o.anim || 'idle', P = pose(anim, t, d), dir = o.dir || 1, sc = d.sc * (o.sc || 1);
    const shirtC = o.shirt || (C.shirts[o.shirtId] && C.shirts[o.shirtId].color) || d.shirt;
    const L = d.L, T = d.T, R = d.R, sw = d.sw, top = -(L + T), hipX = 10;
    if (o.alpha != null) { g.save(); g.globalAlpha = o.alpha; }
    G.shadow(g, x, y + 2, 30 * sc * (1 - Math.min(.4, (-P.bob) / 60)), 7 * sc, .2);
    g.save(); g.translate(x, y); g.scale(dir * sc, sc);
    g.rotate(P.rot); g.translate(0, P.bob); g.lineJoin = 'round'; g.lineCap = 'round';
    const dip = P.dip;
    /* legs */
    const hy = -L + dip;
    [[-1, P.ll], [1, P.rl]].forEach(s => {
      const hx = s[0] * hipX, fx = hx + s[1][0] + (dip ? s[0] * 4 : 0), fy = -s[1][1] - 3;
      const pts = [[hx, hy], [fx, fy]]; limbOutline(g, pts, 17); limb(g, pts, 17, d.pants);
      if (id === 'moody') { g.beginPath(); g.moveTo(fx - 8, fy - 6); g.lineTo(fx + 8, fy - 6); g.lineWidth = 3; g.strokeStyle = 'rgba(120,80,0,.35)'; g.stroke(); }
    });
    [[-1, P.ll], [1, P.rl]].forEach(s => { const hx = s[0] * hipX, fx = hx + s[1][0] + (dip ? s[0] * 4 : 0), fy = -s[1][1] - 3; G.ell(g, fx + 3, fy + 1, 12, 6.5, d.shoe, 3.2); if (id === 'aboody') G.ell(g, fx + 4, fy + 3, 9, 2.2, '#d9d1bd', 0); });
    /* arms (back arm first = left) */
    const sY = top + dip + 10;
    function arm(side, ang) {
      const a1 = ang[0] * R2D, b = ang[1] * R2D, S = [side * (sw - 2), sY], len1 = 22, len2 = 22;
      const E = [S[0] + side * Math.sin(a1) * len1, S[1] + Math.cos(a1) * len1], H = [E[0] + side * Math.sin(b) * len2, E[1] + Math.cos(b) * len2];
      return { S, E, H };
    }
    const ArL = arm(-1, P.la), ArR = arm(1, P.ra);
    function drawArm(A) {
      limbOutline(g, [A.S, A.E, A.H], d.wf); limb(g, [A.S, A.E], d.wf + 1, d.skin); limb(g, [A.E, A.H], d.wf, d.skin);
      const m = [A.S[0] + (A.E[0] - A.S[0]) * .72, A.S[1] + (A.E[1] - A.S[1]) * .72];
      g.beginPath(); g.moveTo(A.S[0], A.S[1]); g.lineTo(m[0], m[1]); g.lineWidth = d.w + 5; g.strokeStyle = OL; g.stroke(); limb(g, [A.S, m], d.w, shirtC);
      G.circ(g, A.H[0], A.H[1], d.wf * .62, d.skin, 3);
    }
    if (o.carry && anim !== 'lift') { drawArm(ArL); }
    else drawArm(ArL);
    /* torso */
    const tx = -sw, tw = sw * 2, ty = top + dip, th = T + 5;
    G.fillRR(g, tx, ty, tw, th, 9, shirtC, 3.5);
    g.save(); G.rr(g, tx, ty, tw, th, 9); g.clip();
    g.fillStyle = 'rgba(0,0,0,.09)'; g.fillRect(tx + tw * .62, ty, tw * .4, th); // soft shade
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(tx, ty, tw * .2, th);
    if (id === 'aboody') { g.fillStyle = 'rgba(255,255,255,.92)'; for (let yy = 0; yy < th + 6; yy += 8) for (let xx = (yy / 8 % 2) * 4; xx < tw; xx += 8) { g.beginPath(); g.arc(tx + xx + 2, ty + yy + 3, 1.5, 0, 6.3); g.fill(); } }
    g.restore();
    G.line(g, 0, ty + (id === 'moody' ? 6 : 14), 0, ty + th, 0, null);
    if (id === 'moody') {
      g.fillStyle = '#e3c58c'; g.fillRect(-3, ty + 8, 6, th - 8); G.line(g, -3, ty + 8, -3, ty + th - 1, 1.5, OL); G.line(g, 3, ty + 8, 3, ty + th - 1, 1.5, OL);
      [18, 32, 46].forEach(yy => G.circ(g, 0, ty + yy, 2.3, '#c9a05e', 1.5));
      G.fillRR(g, 5, ty + 20, 15, 17, 2, 'rgba(255,255,255,.14)', 2.5); G.fillRR(g, 9, ty + 24, 7, 4, 1, '#222', 1);
    } else {
      G.poly(g, [[-9, ty + 1], [9, ty + 1], [0, ty + 19]], d.skin, 2.8);
      [28, 38].forEach(yy => G.circ(g, 0, ty + yy, 2.3, '#e3c58c', 1.5));
      G.fillRR(g, 4, ty + 22, 14, 15, 2, 'rgba(255,255,255,.1)', 2.5);
      G.poly(g, [[-9, ty + 1], [-17, ty + 4], [-9, ty + 17]], shirtC, 2.8); G.poly(g, [[9, ty + 1], [17, ty + 4], [9, ty + 17]], shirtC, 2.8);
    }
    if (id === 'moody') { G.poly(g, [[-3, ty + 1], [-14, ty + 3], [-4, ty + 15]], G.shade(shirtC, .12), 2.8); G.poly(g, [[3, ty + 1], [14, ty + 3], [4, ty + 15]], G.shade(shirtC, .12), 2.8); }
    drawArm(ArR);
    /* neck + head */
    const hcy = ty - 4 - R * .86 + (P.lookY ? 5 : 0);
    G.fillRR(g, -7, ty - 8, 14, 12, 4, d.skin, 3);
    g.save(); g.translate(0, hcy); g.rotate(P.head + (o.tilt || 0) + (anim === 'think' ? -.1 : 0) + (anim === 'oops' ? 0 : 0));
    drawHead(g, id, d, R, P, t, o);
    g.restore();
    /* carried item / extras */
    if (o.carry) {
      if (anim === 'lift') M.art.draw(g, o.carry, 0, hcy - R * 1.4, 70);
      else M.art.draw(g, o.carry, 0, ty + th * .55, 52);
    }
    if (P.zzz) { const k = (t * .8) % 1; G.text(g, 'Z', 26 + k * 10, hcy - R - k * 22, { size: 20 + k * 8, color: '#4a8dff', stroke: '#fff', sw: 4 }); G.text(g, 'z', 40 + k * 8, hcy - R - 10 - ((k + .5) % 1) * 20, { size: 16, color: '#4a8dff', stroke: '#fff', sw: 4 }); }
    if (P.dots) { const n = Math.floor(t * 2.5) % 4; for (let i = 0; i < 3; i++) G.circ(g, 26 + i * 12, hcy - R - 16 - i * 5, 3 + i * 1.5, i < n ? '#fff' : 'rgba(255,255,255,.4)', 2); }
    g.restore();
    if (o.alpha != null) g.restore();
  };

  function drawHead(g, id, d, R, P, t, o) {
    const rx = R * d.hr, E = d.eye;
    // ears
    [-1, 1].forEach(s => { G.circ(g, s * (rx - 1), R * .12, R * .2, d.skin, 3); G.circ(g, s * (rx - 1), R * .12, R * .09, d.skinD, 0); });
    // head
    G.ell(g, 0, 0, rx, R, d.skin, 3.5);
    g.fillStyle = 'rgba(160,80,30,.14)'; g.beginPath(); g.ellipse(rx * .3, R * .15, rx * .7, R * .85, 0, -1.2, 1.4); g.fill();
    // hair (union outline: strokes first, fills second)
    const cr = R * d.curl, circles = [];
    for (let i = 0; i <= 11; i++) { const a = (200 + i * 14.5) * R2D; circles.push([Math.cos(a) * rx * 1.02, Math.sin(a) * R * .98, cr]); }
    for (let i = 0; i < 6; i++) circles.push([(-.68 + i * .272) * rx, -R * .5 + (i % 2) * R * .04, R * .19]);
    circles.push([-rx * 1.02, -R * .12, R * .2], [rx * 1.02, -R * .12, R * .2], [-rx * .88, -R * .62, cr * .9], [rx * .88, -R * .62, cr * .9], [0, -R * 1.05, cr * 1.05], [-rx * .45, -R * 1.0, cr], [rx * .45, -R * 1.0, cr]);
    g.beginPath(); circles.forEach(c => { g.moveTo(c[0] + c[2], c[1]); g.arc(c[0], c[1], c[2], 0, 6.2832); });
    g.lineWidth = 6.5; g.strokeStyle = OL; g.stroke(); g.fillStyle = HAIR; g.fill();
    g.fillStyle = HAIR; g.beginPath(); g.ellipse(0, -R * .72, rx * .98, R * .4, 0, 0, 6.2832); g.fill();
    g.strokeStyle = HAIR_HI; g.lineWidth = 2.2; g.lineCap = 'round';
    circles.forEach((c, i) => { if (i % 2 === 0 && c[1] < -R * .3) { g.beginPath(); g.arc(c[0] - c[2] * .1, c[1] + c[2] * .05, c[2] * .55, Math.PI * 1.05, Math.PI * 1.65); g.stroke(); } });
    // cosmetic hat
    if (o.hat && C.hats[o.hat]) { g.save(); C.hats[o.hat].draw(g, R); g.restore(); }
    // face
    const ex = rx * .42, ey = R * .2;
    const blink = (t % 3.7) < .11 && P.eyes === 'open';
    [-1, 1].forEach(s => {
      const x = s * ex, lk = (o.lookX || 0) * 3 + P.look * s * 0 + (P.look ? 2.5 : 0), ly = P.lookY ? 3 : (P.eyes === 'up' ? -4 : 0);
      const er = R * .2 * E;
      if (P.eyes === 'happy') { g.beginPath(); g.arc(x, ey + er * .5, er * .95, Math.PI * 1.1, Math.PI * 1.9); g.lineWidth = 3.6; g.strokeStyle = OL; g.stroke(); }
      else if (P.eyes === 'closed' || blink) { g.beginPath(); g.arc(x, ey - er * .2, er * .9, Math.PI * .15, Math.PI * .85); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); }
      else {
        const w = P.eyes === 'wide' ? 1.2 : 1;
        G.ell(g, x, ey, er * 1.0 * w, er * 1.18 * w, '#fff', 2.2);
        G.ell(g, x + lk, ey + ly, er * .56 * w, er * .7 * w, '#5a331c', 0); G.circ(g, x + lk, ey + ly, er * .26 * w, '#150a05', 0);
        G.circ(g, x + lk - er * .16, ey + ly - er * .24, er * .17 * w, '#fff', 0); G.circ(g, x + lk + er * .18, ey + ly + er * .2, er * .08 * w, 'rgba(255,255,255,.8)', 0);
        g.beginPath(); g.arc(x, ey, er * 1.02 * w, Math.PI * 1.08, Math.PI * 1.92); g.lineWidth = 3; g.strokeStyle = OL; g.stroke();
      }
      // brows
      const by = ey - er * 1.55, lift = P.brows === 'up' ? -4 : 0;
      g.beginPath();
      if (P.brows === 'worry') { g.moveTo(x + s * er * 1.2, by + 6); g.lineTo(x - s * er * 1.2, by - 1); }
      else if (P.brows === 'think' && s > 0) { g.moveTo(x - er * 1.1, by - 3); g.quadraticCurveTo(x, by - 9, x + er * 1.1, by - 3); }
      else { g.moveTo(x - er * 1.1, by + 1 + lift); g.quadraticCurveTo(x, by - 4 + lift, x + er * 1.1, by + 1 + lift); }
      g.lineWidth = 3.4; g.strokeStyle = '#2e1b10'; g.stroke();
      // cheeks
      g.fillStyle = 'rgba(240,110,100,.22)'; g.beginPath(); g.ellipse(s * rx * .6, R * .5, R * .14, R * .09, 0, 0, 6.3); g.fill();
    });
    // nose
    g.beginPath(); g.arc(0, R * .36, R * .08, .2, Math.PI - .2); g.lineWidth = 2.6; g.strokeStyle = d.skinD; g.stroke();
    // mouth
    const my = R * .6;
    let m = P.mouth; if (o.talk && m === 'smile') m = (Math.floor(t * 9) % 2) ? 'talk' : 'smile';
    if (m === 'smile') { g.beginPath(); g.arc(0, my - R * .12, R * (id === 'moody' ? .2 : .26), .25, Math.PI - .25); g.lineWidth = 3.2; g.strokeStyle = OL; g.stroke(); }
    else if (m === 'big' || m === 'talk') {
      const w = R * (id === 'moody' ? .34 : .4), h = R * (m === 'talk' ? .2 : .34);
      g.beginPath(); g.moveTo(-w, my - R * .14); g.quadraticCurveTo(0, my - R * .1, w, my - R * .14); g.quadraticCurveTo(w * .8, my + h, 0, my + h); g.quadraticCurveTo(-w * .8, my + h, -w, my - R * .14); g.closePath();
      g.fillStyle = '#8c2a2a'; g.fill(); g.save(); g.clip(); g.fillStyle = '#fff'; g.fillRect(-w, my - R * .15, w * 2, R * .13); g.fillStyle = '#ff7f8a'; g.beginPath(); g.ellipse(0, my + h, w * .6, h * .55, 0, 0, 6.3); g.fill(); g.restore();
      g.lineWidth = 2.8; g.strokeStyle = OL; g.beginPath(); g.moveTo(-w, my - R * .14); g.quadraticCurveTo(0, my - R * .1, w, my - R * .14); g.quadraticCurveTo(w * .8, my + h, 0, my + h); g.quadraticCurveTo(-w * .8, my + h, -w, my - R * .14); g.stroke();
    }
    else if (m === 'o') G.ell(g, 0, my + 1, R * .1, R * .14, '#7a2323', 2.6);
    else { g.beginPath(); g.moveTo(-R * .12, my); g.lineTo(R * .12, my - 1); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); }
    if (P.sweat) { g.beginPath(); const sx = rx * .95, sy = -R * .1; g.moveTo(sx, sy - 10); g.quadraticCurveTo(sx + 8, sy + 2, sx, sy + 6); g.quadraticCurveTo(sx - 8, sy + 2, sx, sy - 10); G.fs(g, '#8fd6ff', 2.2); }
  }

  /* ----- people icons used in dialogs ----- */
  M.art.registerAll({
    mama(g) { G.circ(g, 0, -2, 40, '#ff8fb1', 4); G.ell(g, 0, 4, 29, 33, '#dd9d6c', 3.5); G.ell(g, 0, -4, 30, 24, '#ff8fb1', 0); g.beginPath(); g.ellipse(0, 6, 27, 29, 0, 0, 6.3); G.fs(g, '#e8aa7a', 3.5); [-1, 1].forEach(s => { G.ell(g, s * 11, 2, 5, 6, '#fff', 2); G.circ(g, s * 11, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 18, 9, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.ellipse(0, -14, 31, 12, 0, Math.PI, 0); G.fs(g, '#ff8fb1', 3.5); },
    baba(g) { G.ell(g, 0, 4, 32, 36, '#dd9d6c', 3.5); g.beginPath(); g.ellipse(0, -18, 33, 18, 0, Math.PI, 0); G.fs(g, '#2e1b10', 3); [-1, 1].forEach(s => { G.ell(g, s * 12, 2, 5, 6, '#fff', 2); G.circ(g, s * 12, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 18, 14, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.ellipse(0, 24, 22, 9, 0, 0, Math.PI); g.fillStyle = '#3a2a1e'; g.fill(); },
    friend(g) { G.ell(g, 0, 2, 32, 35, '#e5b080', 3.5); g.beginPath(); g.ellipse(0, -16, 33, 20, 0, Math.PI, 0); G.fs(g, '#8a5a2b', 3); [-1, 1].forEach(s => { G.ell(g, s * 12, 2, 5, 6, '#fff', 2); G.circ(g, s * 12, 3, 3.2, '#3a2013', 0); }); g.beginPath(); g.arc(0, 16, 12, .3, Math.PI - .3); g.lineWidth = 3; g.strokeStyle = OL; g.stroke(); },
    narrator(g) { G.circ(g, 0, 0, 40, '#8a6bd6', 4); G.star(g, 0, 2, 24, '#ffe14d', 3); }
  });
})();
