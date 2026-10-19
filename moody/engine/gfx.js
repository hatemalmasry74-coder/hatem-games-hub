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
  /* fill + outline the current path.  In "paint mode" (G.paint, on only while a room is being baked into its offscreen
     canvas) fills become soft vertical gradients with volume shading and the black outline becomes a thin darker tone of the fill.
     bb = [x,y,w,h] (+ shape descriptor) lets the painter shade the shape; without it the path is filled flat with a soft outline. */
  G.paint = false; G.soft = false; G.floorY = 430; G.lightX = 480;
  G.fs = function (g, fill, lw, stroke, bb) {
    lw = lw == null ? 3 : lw;
    if (!G.paint) { if (fill) { g.fillStyle = fill; g.fill(); } if (G.soft && (!stroke || stroke === OL)) { g.lineWidth = Math.max(1.4, lw * .55); g.strokeStyle = typeof fill === 'string' && G.parse(fill) ? G.tones(fill)[3] : 'rgba(70,40,24,.55)'; } else { g.lineWidth = lw; g.strokeStyle = stroke || OL; } if (lw > 0) g.stroke(); return; }
    const isOL = !stroke || stroke === OL, col = typeof fill === 'string' ? G.parse(fill) : null, solid = col && col[3] > .96;
    if (fill) {
      if (solid && bb && bb[3] > 3) {
        const y = bb[1], h = bb[3], w = bb[2], big = w > 520 || h > 300, tp = G.tones(fill), gr = g.createLinearGradient(0, y, 0, y + h);
        gr.addColorStop(0, tp[0]); gr.addColorStop(.5, tp[1]); gr.addColorStop(1, tp[2]); g.fillStyle = gr; g.fill();
        if (!big && Math.min(w, h) >= 9 && lw > 0) {
          g.save(); g.clip();
          const sh = g.createLinearGradient(0, y, 0, y + h); sh.addColorStop(0, 'rgba(255,255,255,.17)'); sh.addColorStop(.35, 'rgba(255,255,255,0)'); sh.addColorStop(.7, 'rgba(40,15,0,0)'); sh.addColorStop(1, 'rgba(40,15,0,.15)');
          g.fillStyle = sh; g.fillRect(bb[0] - 2, y - 2, w + 4, h + 4);
          g.lineWidth = Math.min(7, Math.max(3, Math.min(w, h) * .2)); g.strokeStyle = 'rgba(40,15,0,.08)'; g.stroke(); g.restore();
        }
      } else { g.fillStyle = fill; g.fill(); }
    }
    if (lw > 0) { g.lineWidth = Math.max(1.4, lw * .5); g.strokeStyle = isOL ? (solid ? G.tones(fill)[3] : 'rgba(70,40,24,.55)') : stroke; g.stroke(); }
  };
  const _pc = new Map();
  G.parse = function (c) {
    let r = _pc.get(c); if (r !== undefined) return r;
    let m; r = null;
    if (c[0] === '#') { let h = c.slice(1); if (h.length === 3) h = h.replace(/./g, x => x + x); const n = parseInt(h, 16); r = [n >> 16, (n >> 8) & 255, n & 255, 1]; }
    else if ((m = /^rgba?\(([^)]+)\)/.exec(c))) { const p = m[1].split(',').map(Number); r = [p[0], p[1], p[2], p.length > 3 ? p[3] : 1]; }
    _pc.set(c, r); return r;
  };
  const _tc = new Map();
  /* [light, base, dark, outline] tones of a colour string (cached) */
  G.tones = function (c) {
    let r = _tc.get(c); if (r) return r; const p = G.parse(c) || [200, 200, 200, 1];
    const mix = (k, to) => 'rgb(' + p.slice(0, 3).map((v, i) => Math.round(v + (to[i] - v) * k)).join(',') + ')';
    r = [mix(.2, [255, 250, 235]), c, mix(.2, [60, 30, 20]), 'rgb(' + p.slice(0, 3).map((v, i) => Math.round(v * .5 + [74, 46, 28][i] * .25)).join(',') + ')']; _tc.set(c, r); return r;
  };
  G.rgba = (c, a) => { const p = G.parse(c) || [0, 0, 0]; return 'rgba(' + p[0] + ',' + p[1] + ',' + p[2] + ',' + a + ')'; };
  G.mix = (c1, c2, k) => { const a = G.parse(c1), b = G.parse(c2); return 'rgb(' + [0, 1, 2].map(i => Math.round(a[i] + (b[i] - a[i]) * k)).join(',') + ')'; };
  /* ambient-occlusion contact shadow for things standing on the floor line (paint mode only) */
  G.artDepth = 0;
  G.aoEll = function (g, cx, b, rx, a) {
    const ry = Math.min(15, 5 + rx * .1), ox = (cx - G.lightX) * .02; a = a || 1;
    g.save(); g.translate(cx + ox, b + 1); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    gr.addColorStop(0, 'rgba(45,22,8,' + (.34 * a) + ')'); gr.addColorStop(.6, 'rgba(45,22,8,' + (.16 * a) + ')'); gr.addColorStop(1, 'rgba(45,22,8,0)'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, rx, 0, 6.2832); g.fill(); g.restore();
  };
  G.ao = function (g, x, y, w, h) {
    const b = y + h; if (!G.paint || G.artDepth || w < 26 || w > 800 || h < 22 || b < G.floorY - 3 || b > G.floorY + 44) return;
    G.aoEll(g, x + w / 2, b, w / 2 + 8);
  };
  G.fillRR = (g, x, y, w, h, r, fill, lw, stroke) => { if (G.paint) G.ao(g, x, y, w, h); G.rr(g, x, y, w, h, r); G.fs(g, fill, lw, stroke, [x, y, w, h]); };
  G.circ = (g, x, y, r, fill, lw, stroke) => { g.beginPath(); g.arc(x, y, r, 0, 6.2832); G.fs(g, fill, lw, stroke, [x - r, y - r, r * 2, r * 2]); };
  G.ell = (g, x, y, rx, ry, fill, lw, stroke, rot) => { g.beginPath(); g.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot || 0, 0, 6.2832); G.fs(g, fill, lw, stroke, [x - Math.abs(rx), y - Math.abs(ry), Math.abs(rx) * 2, Math.abs(ry) * 2]); };
  G.poly = (g, pts, fill, lw, stroke) => { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; g.beginPath(); pts.forEach((p, i) => { i ? g.lineTo(p[0], p[1]) : g.moveTo(p[0], p[1]); if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; }); g.closePath(); G.fs(g, fill, lw, stroke, [x0, y0, x1 - x0, y1 - y0]); };
  G.line = (g, x1, y1, x2, y2, w, col) => { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); if (G.paint && (!col || col === OL)) { g.lineWidth = Math.max(1.4, w * .55); g.strokeStyle = 'rgba(70,40,24,.5)'; } else { g.lineWidth = w; g.strokeStyle = col || OL; } g.stroke(); };
  G.starPath = (g, x, y, r, rot) => { g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (rot || 0) + i * Math.PI / 5, rr = i % 2 ? r * .48 : r; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); };
  G.star = (g, x, y, r, fill, lw, rot) => { G.starPath(g, x, y, r, rot); G.fs(g, fill || '#ffc93c', lw == null ? 3 : lw, null, [x - r, y - r, r * 2, r * 2]); };
  G.heart = (g, x, y, s, fill, lw) => { g.beginPath(); g.moveTo(x, y + s * .9); g.bezierCurveTo(x - s * 1.6, y - s * .2, x - s * .7, y - s * 1.1, x, y - s * .35); g.bezierCurveTo(x + s * .7, y - s * 1.1, x + s * 1.6, y - s * .2, x, y + s * .9); G.fs(g, fill || '#ff5a7a', lw == null ? 3 : lw, null, [x - s * 1.4, y - s, s * 2.8, s * 2]); };
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

  /* =====================================================================================================
     VISUAL SYSTEM (see DEV.md "Visual system")
     Rooms are baked once into offscreen canvases (far / mid / near) by Stage; this section holds the toolkit:
     painted-mode shading (above), colour grading, windows + views, light shafts, ambient animation kinds, look registry.
     ===================================================================================================== */
  const FX = M.fx = M.fx || {};   // flags are owned by Moody.quality (core.js): motion, parallax, ambient, ambK, paint, shadows, ...
  if (FX.ambient == null) FX.ambient = true; if (FX.parallax == null) FX.parallax = true; if (FX.motion == null) FX.motion = true; if (FX.shadows == null) FX.shadows = true; if (FX.glow == null) FX.glow = true; if (FX.ambK == null) FX.ambK = 1; if (FX.paint == null) FX.paint = true;
  const AK = n => Math.max(1, Math.round(n * (FX.ambK == null ? 1 : FX.ambK)));   // ambient element count follows the quality level
  G.mkCanvas = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(w)); c.height = Math.max(1, Math.round(h)); return c; };
  const rnd = seed => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  G.rand = rnd;

  /* ---- look registry: per-room colour grading / light meta ---- */
  const LOOK = M.look = { table: {}, set(name, meta) { LOOK.table[name] = meta; }, setAll(o) { for (const k in o) LOOK.table[k] = o[k]; },
    get(name, s) { let m = LOOK.table[name]; if (typeof m === 'function') m = m(s); return Object.assign({}, LOOK.def, m || {}); },
    def: { tod: 'day', floor: 430, vig: .24, ao: 1, indoor: true, par: 1, shadow: 1 } };
  G.TOD = {
    day: { tint: 'rgba(255,250,230,.0)', vc: '50,30,10', glow: '255,244,200' },
    morning: { tint: 'rgba(255,214,150,.08)', vc: '70,35,10', glow: '255,226,160' },
    noon: { tint: 'rgba(255,255,235,.02)', vc: '40,40,60', glow: '255,255,230' },
    sunset: { tint: 'rgba(255,125,60,.17)', vc: '90,25,40', glow: '255,170,90' },
    evening: { tint: 'rgba(255,150,70,.10)', vc: '70,25,20', glow: '255,200,120' },
    night: { tint: 'rgba(24,36,120,.30)', vc: '4,6,40', glow: '255,226,150' },
    warm: { tint: 'rgba(255,170,90,.09)', vc: '70,30,10', glow: '255,215,140' },
    cool: { tint: 'rgba(130,190,255,.07)', vc: '20,40,80', glow: '230,245,255' }
  };

  /* ---- sprites (cached once) ---- */
  const _sp = {};
  G.glowSprite = function (col) { // soft white-centred radial blob tinted `col` ('r,g,b')
    col = col || '255,240,190'; let c = _sp['g' + col]; if (c) return c; c = _sp['g' + col] = G.mkCanvas(128, 128); const x = c.getContext('2d'), gr = x.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, 'rgba(' + col + ',1)'); gr.addColorStop(.25, 'rgba(' + col + ',.55)'); gr.addColorStop(.6, 'rgba(' + col + ',.16)'); gr.addColorStop(1, 'rgba(' + col + ',0)'); x.fillStyle = gr; x.fillRect(0, 0, 128, 128); return c;
  };
  G.shadowSprite = function () { let c = _sp.shadow; if (c) return c; c = _sp.shadow = G.mkCanvas(96, 48); const x = c.getContext('2d'); x.translate(48, 24); x.scale(1, .5); const gr = x.createRadialGradient(0, 0, 0, 0, 0, 46); gr.addColorStop(0, 'rgba(35,15,5,.5)'); gr.addColorStop(.55, 'rgba(35,15,5,.22)'); gr.addColorStop(1, 'rgba(35,15,5,0)'); x.fillStyle = gr; x.beginPath(); x.arc(0, 0, 46, 0, 6.2832); x.fill(); return c; };
  G.cloudSprite = function (v) { // soft painted cloud, variants 0..2
    let c = _sp['c' + v]; if (c) return c; c = _sp['c' + v] = G.mkCanvas(220, 110); const x = c.getContext('2d'), R = rnd(v + 3);
    const puffs = [[60, 70, 34], [100, 56, 42], [145, 68, 36], [105, 78, 38], [40, 80, 24], [170, 80, 24]]; if (v) puffs.push([80 + v * 20, 46, 28 - v * 3]);
    puffs.forEach(p => { const gr = x.createRadialGradient(p[0] - 6, p[1] - 12, 2, p[0], p[1], p[2]); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(.7, 'rgba(250,252,255,.96)'); gr.addColorStop(1, 'rgba(214,230,248,.9)'); x.fillStyle = gr; x.beginPath(); x.arc(p[0], p[1], p[2], 0, 6.2832); x.fill(); });
    x.globalCompositeOperation = 'source-atop'; const sh = x.createLinearGradient(0, 40, 0, 110); sh.addColorStop(0, 'rgba(160,185,225,0)'); sh.addColorStop(1, 'rgba(160,185,225,.55)'); x.fillStyle = sh; x.fillRect(0, 0, 220, 110); return c;
  };

  /* ---- layer targeting: during a bake the stage supplies s._tg = {far, mid, near} contexts ---- */
  G.far = (g, s, fn) => { const tg = s && s._tg; if (tg) { tg.usedFar = true; tg.far.save(); fn(tg.far); tg.far.restore(); } else fn(g); };
  G.near = (g, s, fn) => { const tg = s && s._tg; if (tg) { tg.usedNear = true; tg.near.save(); fn(tg.near); tg.near.restore(); } else fn(g); };
  G.hole = (g, s, x, y, w, h, r) => { if (!(s && s._tg)) return; g.save(); g.globalCompositeOperation = 'destination-out'; G.rr(g, x, y, w, h, r || 0); g.fillStyle = '#000'; g.fill(); g.restore(); };
  /* register an ambient animation (drawn each frame by the stage; see G.amb.kinds) */
  /* G.live(g, s, fn): draw something that changes every frame (a moving cat, an animated prop): fn(g, t, stage) runs each frame in the 'mid' pass; when the room is drawn raw it simply runs now. Declare its state keys in the room's look meta  live:['cat'] so they do not trigger a re-bake. */
  G.live = (g, s, fn, z) => { if (s && s._tg) s._amb.push({ k: 'live', fn, z: z || 'mid' }); else fn(g, s ? s.t : 0, s); };
  G.amb = (s, spec) => { if (s && s._amb) { if (spec.z == null) spec.z = (G.amb.kinds[spec.k] || {}).z || 'mid'; if (spec.k === 'glow' && spec.z === 'top' && spec.r < 240) spec.z = 'mid'; s._amb.push(spec); } };

  /* ---- painted scenery for far layer / windows ---- */
  G.sky = (c, x, y, w, h, stops) => { c.fillStyle = G.lin(c, 0, y, 0, y + h, stops); c.fillRect(x, y, w, h); };
  G.glowAt = (c, x, y, r, col, a) => { c.save(); c.globalAlpha = a == null ? 1 : a; c.drawImage(G.glowSprite(col), x - r, y - r, r * 2, r * 2); c.restore(); };
  G.hills = (c, x, w, base, amp, col, seed, top) => { // rolling silhouette from sines, filled with vertical gradient col -> top
    const R = rnd(seed || 1), p1 = R() * 6, p2 = R() * 6, f1 = .004 + R() * .003, f2 = .011 + R() * .006; c.beginPath(); c.moveTo(x, base + 600);
    for (let i = 0; i <= w; i += 12) c.lineTo(x + i, base - amp * (.55 + .3 * Math.sin(i * f1 + p1) + .15 * Math.sin(i * f2 + p2)));
    c.lineTo(x + w, base + 600); c.closePath(); const gr = c.createLinearGradient(0, base - amp, 0, base + 140); gr.addColorStop(0, top || col); gr.addColorStop(1, col); c.fillStyle = gr; c.fill();
  };
  G.skyline = (c, x, w, base, col, hmin, hmax, seed, lit, litCol) => {
    const R = rnd(seed || 2); let px = x; while (px < x + w) { const bw = 30 + R() * 50, bh = hmin + R() * (hmax - hmin); const gr = c.createLinearGradient(0, base - bh, 0, base); gr.addColorStop(0, G.tones(col)[0]); gr.addColorStop(1, col); c.fillStyle = gr; c.fillRect(px, base - bh, bw, bh + 40);
      if (lit) { c.fillStyle = litCol || '#ffe27a'; for (let yy = base - bh + 8; yy < base - 8; yy += 14) for (let xx = px + 6; xx < px + bw - 8; xx += 12) if (R() < lit) c.fillRect(xx, yy, 5, 7); } px += bw + R() * 6; }
  };
  G.blobTrees = (c, x, w, base, col, seed, sz) => { const R = rnd(seed || 3); for (let px = x; px < x + w; px += 26 + R() * 30) { const r = (sz || 26) * (.7 + R() * .7); const gr = c.createRadialGradient(px - r * .3, base - r * 1.2, 2, px, base - r, r * 1.2); gr.addColorStop(0, G.tones(col)[0]); gr.addColorStop(1, col); c.fillStyle = gr; c.beginPath(); c.arc(px, base - r, r, 0, 6.2832); c.arc(px + r * .7, base - r * .7, r * .75, 0, 6.2832); c.fill(); } };
  /* G.views[name](c, x, y, w, h, o): paints a view into the (clipped) rectangle */
  G.views = {
    day(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#62b9ff', '#a9ddff', '#e6f6ff']); G.glowAt(c, x + w * .75, y + h * .25, h * .7, '255,250,210', .8); c.fillStyle = '#fffbe0'; c.beginPath(); c.arc(x + w * .75, y + h * .25, h * .09, 0, 6.2832); c.fill(); G.hills(c, x - 20, w + 40, y + h * .8, h * .22, '#a8d896', 4, '#bde4b0'); G.hills(c, x - 20, w + 40, y + h * .95, h * .2, '#78c06a', 7, '#8ccf7a'); },
    morning(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#79b8f0', '#ffc9a0', '#ffe9b8']); G.glowAt(c, x + w * .3, y + h * .62, h * .9, '255,214,140', .9); c.fillStyle = '#fff3c4'; c.beginPath(); c.arc(x + w * .3, y + h * .62, h * .1, 0, 6.2832); c.fill(); G.hills(c, x - 20, w + 40, y + h * .78, h * .2, '#c9c9a0', 4, '#ddd2aa'); G.hills(c, x - 20, w + 40, y + h * .96, h * .2, '#93bd7a', 9, '#a9cf8c'); },
    sunset(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#5b4aa0', '#f07c6a', '#ffcf86']); G.glowAt(c, x + w * .62, y + h * .72, h, '255,190,110', .95); c.fillStyle = '#ffe7a8'; c.beginPath(); c.arc(x + w * .62, y + h * .72, h * .11, 0, 6.2832); c.fill(); G.hills(c, x - 20, w + 40, y + h * .86, h * .22, '#7a4f86', 5, '#965f8c'); G.hills(c, x - 20, w + 40, y + h * 1.02, h * .22, '#4a3566', 11, '#5d4378'); },
    night(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#0b1238', '#1d2a68', '#34498f']); G.glowAt(c, x + w * .72, y + h * .28, h * .6, '200,215,255', .55); c.fillStyle = '#f4f1dc'; c.beginPath(); c.arc(x + w * .72, y + h * .28, h * .1, 0, 6.2832); c.fill(); c.fillStyle = '#d6d6bd'; c.beginPath(); c.arc(x + w * .72 + h * .03, y + h * .26, h * .03, 0, 6.2832); c.fill(); G.hills(c, x - 20, w + 40, y + h * .92, h * .2, '#1a2656', 6, '#233270'); },
    city(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#79c4ff', '#bfe5ff', '#eef8ff']); G.glowAt(c, x + w * .7, y + h * .25, h * .6, '255,250,220', .7); G.skyline(c, x - 10, w + 20, y + h * .9, '#b4cde4', h * .25, h * .6, 3, 0); G.skyline(c, x - 10, w + 20, y + h * 1.0, '#8eaecb', h * .18, h * .45, 8, 0); },
    citysunset(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#6a5ab0', '#ff8f70', '#ffd592']); G.glowAt(c, x + w * .7, y + h * .6, h * .9, '255,190,110', .9); G.skyline(c, x - 10, w + 20, y + h * .92, '#a86a86', h * .25, h * .6, 3, 0); G.skyline(c, x - 10, w + 20, y + h * 1.02, '#6a4570', h * .2, h * .5, 8, .12, '#ffd77a'); },
    citynight(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#0a1034', '#1f2c6c', '#3b4f98']); G.glowAt(c, x + w * .75, y + h * .25, h * .5, '200,215,255', .5); c.fillStyle = '#f4f1dc'; c.beginPath(); c.arc(x + w * .75, y + h * .25, h * .08, 0, 6.2832); c.fill(); G.skyline(c, x - 10, w + 20, y + h * .92, '#28357a', h * .25, h * .6, 3, .22); G.skyline(c, x - 10, w + 20, y + h * 1.02, '#1a2358', h * .2, h * .5, 8, .3); },
    garden(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#7cc8ff', '#c5e9ff', '#f0fbff']); G.glowAt(c, x + w * .78, y + h * .22, h * .6, '255,250,215', .7); G.hills(c, x - 20, w + 40, y + h * .78, h * .2, '#9ccf86', 5, '#b4dc9e'); G.blobTrees(c, x - 10, w + 20, y + h * .95, '#5aa84f', 4, h * .17); G.hills(c, x - 20, w + 40, y + h * 1.04, h * .15, '#6db85d', 9, '#82c872'); },
    mountain(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#7fb6ea', '#bcdcf5', '#eef6fb']); G.glowAt(c, x + w * .75, y + h * .22, h * .5, '255,250,225', .7); G.hills(c, x - 20, w + 40, y + h * .6, h * .45, '#9fb2cf', 2, '#c5d3e6'); G.hills(c, x - 20, w + 40, y + h * .82, h * .35, '#7f9bb8', 6, '#9db4cc'); c.fillStyle = 'rgba(235,244,252,.4)'; c.fillRect(x, y + h * .6, w, h * .2); G.hills(c, x - 20, w + 40, y + h * 1.0, h * .25, '#5f9a74', 8, '#76b088'); },
    sea(c, x, y, w, h) { G.sky(c, x, y, w, h, ['#6fc6ff', '#b8e6ff', '#fdf2d6']); G.glowAt(c, x + w * .7, y + h * .3, h * .6, '255,245,200', .8); const hy = y + h * .6; c.fillStyle = G.lin(c, 0, hy, 0, y + h, ['#5ad0d8', '#2d9fc8']); c.fillRect(x, hy, w, h - (hy - y)); c.fillStyle = 'rgba(255,255,255,.35)'; c.fillRect(x, hy, w, 2); }
  };
  G.view = (c, name, x, y, w, h, m) => { c.save(); m = m == null ? 18 : m; c.beginPath(); c.rect(x - m, y - m, w + m * 2, h + m * 2); c.clip(); (G.views[name] || G.views.day)(c, x - m, y - m, w + m * 2, h + m * 2); c.restore(); };

  /* seamless horizontal scroll tiles (parallax layers that scroll forever): G.tile(key, P, y0, y1, res, fn) bakes fn(c) once in paint mode
     over x in [0,P) (P >= 960, fn must be periodic in P); G.drawTile(g, tile, scroll) blits it wrapped.  res<1 = cheaper, softer far layers. */
  const TILES = new Map();
  G.tile = function (key, P, y0, y1, res, fn) {
    const km = M.cv ? M.cv.width / 960 : 1, k = km, kk = key + '|' + k.toFixed(2) + (FX.paint === false ? '|f' : ''); let t = TILES.get(kk); if (t) return t;
    const c = G.mkCanvas(P * k, (y1 - y0) * k), x = c.getContext('2d'); x.setTransform(k, 0, 0, k, 0, -y0 * k); x.lineJoin = 'round'; x.lineCap = 'round';
    const pp = G.paint; G.paint = FX.paint !== false; try { fn(x); } finally { G.paint = pp; }
    t = { c, P, y0, h: y1 - y0, k, wpx: c.width, hpx: c.height }; TILES.set(kk, t); return t;
  };
  /* pure 1:1 integer-pixel blit of the visible 960-wide window of a wrapped tile */
  G.drawTile = function (g, t, scroll) {
    const o = Math.round((((scroll % t.P) + t.P) % t.P) * t.k), need = Math.ceil(960 * t.k); let sx = o, dx = 0, left = need;
    while (left > 0) { const w = Math.min(left, t.wpx - sx); g.drawImage(t.c, sx, 0, w, t.hpx, dx / t.k, t.y0, w / t.k, t.h); dx += w; left -= w; sx = 0; }
  };
  G.nzp = (X, kq, sd) => Math.sin(X * kq + sd) * .5 + Math.sin(X * kq * 2 + sd * 1.7) * .3 + Math.sin(X * kq * 4 + sd * 2.9) * .2;
  G.kq = (k, P) => Math.max(1, Math.round(k * P / 6.2832)) * 6.2832 / P;
  G.views.plainsky = (c, x, y, w, h) => { G.sky(c, x, y, w, h, ['#79bdea', '#b9dcee', '#eef6f5']); G.glowAt(c, x + w * .8, y + h * .3, h * .7, '255,248,205', .75); c.fillStyle = '#fff6c8'; c.beginPath(); c.arc(x + w * .8, y + h * .3, h * .07, 0, 6.2832); c.fill(); };
  G.views.dusksky = (c, x, y, w, h) => { G.sky(c, x, y, w, h, ['#e89a80', '#f7b98a', '#ffe3b8']); G.glowAt(c, x + w * .8, y + h * .5, h * .9, '255,205,140', .9); c.fillStyle = '#ffe9b0'; c.beginPath(); c.arc(x + w * .8, y + h * .5, h * .08, 0, 6.2832); c.fill(); };

  /* ---- window: far view (parallax) + hole + glass/frame/sill + shaft + curtains.  o:{view, curtains:col|[colL,colR], shaft:true, night, panes:[cols,rows], frame, tod} ---- */
  G.window = function (g, s, x, y, w, h, o) {
    o = o || {}; const view = o.view || (o.night ? 'night' : 'day'), fr = o.frame || '#fff6e6', night = view.indexOf('night') >= 0;
    G.far(g, s, c => { G.view(c, view, x, y, w, h, 18); });
    G.hole(g, s, x, y, w, h);
    // recess shading + glass sheen
    g.save(); g.beginPath(); g.rect(x, y, w, h); g.clip();
    let gr = g.createLinearGradient(0, y, 0, y + h * .35); gr.addColorStop(0, 'rgba(20,10,0,.28)'); gr.addColorStop(1, 'rgba(20,10,0,0)'); g.fillStyle = gr; g.fillRect(x, y, w, h * .35);
    gr = g.createLinearGradient(x, 0, x + w * .22, 0); gr.addColorStop(0, 'rgba(20,10,0,.2)'); gr.addColorStop(1, 'rgba(20,10,0,0)'); g.fillStyle = gr; g.fillRect(x, y, w * .22, h);
    g.fillStyle = 'rgba(255,255,255,' + (night ? .07 : .2) + ')'; g.beginPath(); g.moveTo(x + w * .1, y + h); g.lineTo(x + w * .32, y); g.lineTo(x + w * .5, y); g.lineTo(x + w * .28, y + h); g.fill(); g.beginPath(); g.moveTo(x + w * .56, y + h); g.lineTo(x + w * .66, y); g.lineTo(x + w * .72, y); g.lineTo(x + w * .62, y + h); g.fill();
    g.restore();
    const t = Math.max(4, Math.min(9, w * .045)), cols = (o.panes || [2, 2])[0], rows = (o.panes || [2, 2])[1];
    // frame (4 bars + mullions) painted with soft edge
    G.fillRR(g, x - t, y - t, w + t * 2, t, 3, fr, 2.5); G.fillRR(g, x - t, y + h, w + t * 2, t, 3, fr, 2.5); G.fillRR(g, x - t, y - t, t, h + t * 2, 3, fr, 2.5); G.fillRR(g, x + w, y - t, t, h + t * 2, 3, fr, 2.5);
    for (let i = 1; i < cols; i++) G.fillRR(g, x + w * i / cols - t / 3, y, t * .66, h, 2, fr, 2); for (let i = 1; i < rows; i++) G.fillRR(g, x, y + h * i / rows - t / 3, w, t * .66, 2, fr, 2);
    if (o.sill !== false) { G.fillRR(g, x - t - 8, y + h + t - 1, w + t * 2 + 16, 9, 3, G.shade(fr, -.06), 2.5); g.fillStyle = 'rgba(40,20,5,.18)'; g.fillRect(x - t - 4, y + h + t + 8, w + t * 2 + 8, 5); }
    // ambient: view life + light
    const sc = Math.min(w, h) / 140;
    if (night) { const R = rnd(Math.round(x + y)), pts = []; for (let i = 0; i < 9; i++) pts.push([x + 8 + R() * (w - 16), y + 8 + R() * h * .5, 1.6 + R() * 1.8]); G.amb(s, { k: 'stars', pts, z: 'far' }); }
    else { G.amb(s, { k: 'clouds', x0: x - 70, x1: x + w + 70, y0: y + h * .08, y1: y + h * .42, n: Math.max(1, Math.round(w / 110)), speed: 5 + sc * 2, sc: .3 + sc * .13, a: view === 'sunset' ? .55 : .9, clip: [x, y, w, h], seed: Math.round(x) }); if (o.birds) G.amb(s, { k: 'birds', y: y + h * .3, n: 2, clip: [x, y, w, h], speed: 14, sc: .5 + sc * .2, seed: Math.round(x) + 5 }); }
    if (o.shaft !== false && !night && (o.floor || 430) > y + h) {
      const fl = o.floor || 430, dir = o.dir == null ? .35 : o.dir, spread = o.spread == null ? .25 : o.spread;
      G.amb(s, { k: 'shaft', pts: [[x, y + h], [x + w, y + h], [x + w + (fl - y - h) * dir + w * spread, fl + 70], [x + (fl - y - h) * dir - w * spread * .4, fl + 70]], col: G.TOD[o.tod || 'day'].glow, a: o.shaftA || .17, z: 'top' });
      G.amb(s, { k: 'dust', box: [x - w * .1 + (fl - y - h) * dir * .3, y + h * .6, w * 1.4, fl - y - h * .4], n: 16, z: 'top', seed: Math.round(x * 3) });
    }
    if (o.curtains) { const cc = [].concat(o.curtains), cl = cc[0], cr = cc[1] || cc[0], cw = o.cw || Math.max(26, w * .3), ch = o.ch || h + 34; G.amb(s, { k: 'curtain', x0: x - t - 4, dir: 1, w: cw, y: y - 16, h: ch, col: cl, ph: 0 }); G.amb(s, { k: 'curtain', x0: x + w + t + 4, dir: -1, w: cw, y: y - 16, h: ch, col: cr, ph: 1.7 });
      G.fillRR(g, x - cw - 14, y - 24, w + cw * 2 + 28, 8, 4, '#8a5a3a', 2.5); G.circ(g, x - cw - 14, y - 20, 6, '#c8935a', 1.5); G.circ(g, x + w + cw + 14, y - 20, 6, '#c8935a', 1.5); }
  };

  /* ---- grade passes ---- */
  G.gradeNear = function (c, meta, W, H) { // vignette + tint + top/bottom falloff, drawn on the (half-res) near canvas in logical coords
    const tod = G.TOD[meta.tod] || G.TOD.day, vc = meta.vc || tod.vc; c.save();
    c.fillStyle = meta.tint || tod.tint; c.fillRect(-20, -20, W + 40, H + 40);
    let gr = c.createRadialGradient(W / 2, H * .52, H * .42, W / 2, H * .52, W * .66); gr.addColorStop(0, 'rgba(' + vc + ',0)'); gr.addColorStop(1, 'rgba(' + vc + ',' + meta.vig + ')'); c.fillStyle = gr; c.fillRect(-20, -20, W + 40, H + 40);
    if (meta.indoor) { gr = c.createLinearGradient(0, 0, 0, 130); gr.addColorStop(0, 'rgba(' + vc + ',.2)'); gr.addColorStop(1, 'rgba(' + vc + ',0)'); c.fillStyle = gr; c.fillRect(0, 0, W, 130); }
    gr = c.createLinearGradient(0, H - 110, 0, H); gr.addColorStop(0, 'rgba(' + vc + ',0)'); gr.addColorStop(1, 'rgba(' + vc + ',.14)'); c.fillStyle = gr; c.fillRect(0, H - 110, W, 110);
    if (meta.glow) { const q = meta.glow; c.globalCompositeOperation = 'lighter'; G.glowAt(c, q.x, q.y, q.r, q.col || tod.glow, q.a == null ? .22 : q.a); }
    c.restore();
  };
  G.gradeMid = function (c, meta, W, H) { // wall/floor seam occlusion + floor gloss
    const fy = meta.floor, vc = (G.TOD[meta.tod] || G.TOD.day).vc, a = meta.ao; if (!a || !fy) return; c.save();
    let gr = c.createLinearGradient(0, fy, 0, fy + 34); gr.addColorStop(0, 'rgba(' + vc + ',' + (.3 * a) + ')'); gr.addColorStop(1, 'rgba(' + vc + ',0)'); c.fillStyle = gr; c.fillRect(0, fy, W, 34);
    gr = c.createLinearGradient(0, fy - 22, 0, fy); gr.addColorStop(0, 'rgba(' + vc + ',0)'); gr.addColorStop(1, 'rgba(' + vc + ',' + (.13 * a) + ')'); c.fillStyle = gr; c.fillRect(0, fy - 22, W, 22);
    if (meta.indoor) { gr = c.createLinearGradient(0, fy, 0, H); gr.addColorStop(0, 'rgba(255,255,255,.10)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(' + vc + ',.1)'); c.fillStyle = gr; c.fillRect(0, fy, W, H - fy); }
    c.restore();
  };

  /* ---- ambient kinds: draw(g, t, spec, stage).  t is 0 when reduced-motion is on, so everything freezes in a nice static pose. ---- */
  const K = G.amb.kinds = {};
  K.live = { z: 'mid', draw(g, t, sp, S) { G.soft = true; try { sp.fn(g, t, S); } finally { G.soft = false; } } };
  K.curtain = { z: 'mid', draw(g, t, sp) {
    const N = 12, x0 = sp.x0, d = sp.dir, w = sp.w, y = sp.y, h = sp.h; if (!sp._gr) { const gr = g.createLinearGradient(x0, 0, x0 + d * w, 0), T = G.tones(sp.col); for (let i = 0; i <= 6; i++) gr.addColorStop(i / 6, i % 2 ? T[0] : T[2]); sp._gr = gr; sp._ol = T[3]; }
    g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + d * w, y); for (let i = 0; i <= N; i++) { const u = i / N, f = .5 + .5 * u * u * u + .08 * Math.sin(u * 3), sw = Math.sin(t * 1.15 + sp.ph + u * 2.2) * 5 * u * u + Math.sin(t * .6 + sp.ph) * 3 * u; g.lineTo(x0 + d * (w * f + sw), y + h * u); }
    g.lineTo(x0, y + h); g.closePath(); g.fillStyle = sp._gr; g.fill(); g.lineWidth = 1.6; g.strokeStyle = sp._ol; g.stroke();
    g.fillStyle = 'rgba(40,10,0,.12)'; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + d * 5, y); g.lineTo(x0 + d * 8, y + h); g.lineTo(x0, y + h); g.fill(); } };
  K.shaft = { z: 'top', draw(g, t, sp) {
    const p = sp.pts; if (!sp._gr) { const gr = g.createLinearGradient(0, p[0][1], 0, p[3][1]); gr.addColorStop(0, 'rgba(' + sp.col + ',1)'); gr.addColorStop(.7, 'rgba(' + sp.col + ',.35)'); gr.addColorStop(1, 'rgba(' + sp.col + ',0)'); sp._gr = gr; }
    g.save(); g.globalCompositeOperation = 'lighter'; const al = sp.a * (.82 + .18 * Math.sin(t * .7 + (sp.ph || 0))); g.fillStyle = sp._gr;
    const cx = (p[0][0] + p[1][0] + p[2][0] + p[3][0]) / 4, cy = (p[0][1] + p[3][1]) / 2; for (let k = 0; k < 3; k++) { const f = 1 - k * .22; g.globalAlpha = al * (k ? .45 : .5); g.beginPath(); for (let i = 0; i < 4; i++) { const x = cx + (p[i][0] - cx) * f, y = p[i][1]; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); g.fill(); } g.restore(); } };
  K.dust = { z: 'top', opt: true, draw(g, t, sp) {
    const b = sp.box, n = AK(sp.n); if (!sp._p) { const R = rnd(sp.seed || 1); sp._p = []; for (let i = 0; i < sp.n; i++) sp._p.push([R(), R(), .4 + R() * .8, R() * 6, 1.5 + R() * 2.2]); } const gs = G.glowSprite('255,244,210');
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const p = sp._p[i], px = b[0] + (((p[0] + Math.sin(t * .25 * p[2] + p[3]) * .04 + t * .004 * p[2]) % 1) + 1) % 1 * b[2], py = b[1] + (((p[1] - t * .012 * p[2] * 1) % 1) + 1) % 1 * b[3], tw = .5 + .5 * Math.sin(t * 1.3 * p[2] + p[3]); g.globalAlpha = .22 + .5 * tw; g.drawImage(gs, px - p[4] * 2, py - p[4] * 2, p[4] * 4, p[4] * 4); }
    g.restore(); } };
  K.glow = { z: 'top', draw(g, t, sp) { const f = sp.flick ? 1 - sp.flick * (.5 + .5 * Math.sin(t * 9 + (sp.ph || 0)) * Math.sin(t * 3.7)) : 1; g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = (sp.a == null ? .5 : sp.a) * f * (sp.pulse ? .85 + .15 * Math.sin(t * 2.2) : 1); const r = sp.r; g.drawImage(G.glowSprite(sp.col), sp.x - r, sp.y - (sp.ry || r), r * 2, (sp.ry || r) * 2); g.restore(); } };
  K.clouds = { z: 'far', draw(g, t, sp) {
    const ncl = AK(sp.n); if (!sp._c) { const R = rnd(sp.seed || 1); sp._c = []; for (let i = 0; i < sp.n; i++) sp._c.push([R(), sp.y0 + R() * (sp.y1 - sp.y0), .6 + R() * .7, Math.floor(R() * 3)]); }
    g.save(); if (sp.clip) { g.beginPath(); g.rect(sp.clip[0], sp.clip[1], sp.clip[2], sp.clip[3]); g.clip(); } const span = sp.x1 - sp.x0; g.globalAlpha = sp.a == null ? .9 : sp.a;
    for (let i = 0; i < ncl; i++) { const c = sp._c[i], x = sp.x0 + ((c[0] * span + t * sp.speed * c[2]) % span), w = 220 * sp.sc * c[2], sp1 = G.cloudSprite(c[3]); g.drawImage(sp1, x - w / 2, c[1] - w * .25, w, w * .5); }
    g.restore(); } };
  K.birds = { z: 'far', opt: true, draw(g, t, sp) {
    g.save(); if (sp.clip) { g.beginPath(); g.rect(sp.clip[0], sp.clip[1], sp.clip[2], sp.clip[3]); g.clip(); } g.strokeStyle = sp.col || 'rgba(60,50,70,.75)'; g.lineWidth = 1.6 * sp.sc; g.lineCap = 'round'; const R = rnd(sp.seed || 1), span = (sp.clip ? sp.clip[2] : 960) + 120, bx = sp.clip ? sp.clip[0] : 0;
    for (let i = 0; i < AK(sp.n); i++) { const o = R() * span, x = bx - 40 + ((o + t * sp.speed * (1 + i * .15)) % span), y = sp.y + Math.sin(t * .8 + i * 2) * 5 + i * 9, f = Math.sin(t * 7 + i * 1.7) * 5 * sp.sc; g.beginPath(); g.moveTo(x - 9 * sp.sc, y - f * .6); g.quadraticCurveTo(x - 4 * sp.sc, y - 4 * sp.sc - f, x, y); g.quadraticCurveTo(x + 4 * sp.sc, y - 4 * sp.sc - f, x + 9 * sp.sc, y - f * .6); g.stroke(); }
    g.restore(); } };
  K.stars = { z: 'far', draw(g, t, sp) { for (let i = 0; i < sp.pts.length; i++) { const p = sp.pts[i]; G.sparkle(g, p[0], p[1], p[2], '#fff6c8', .45 + .5 * Math.sin(t * 2 + i * 1.9) * .5 + .25); } } };
  K.steam = { z: 'mid', opt: true, draw(g, t, sp) { const gs = G.glowSprite('255,255,255'); g.save(); for (let i = 0; i < AK(sp.n || 4); i++) { const u = ((t * .35 + i / AK(sp.n || 4)) % 1), x = sp.x + Math.sin(u * 5 + i * 2) * 9 * sp.sc * u, y = sp.y - u * 46 * sp.sc, r = (7 + u * 14) * sp.sc; g.globalAlpha = .45 * Math.sin(u * 3.14); g.drawImage(gs, x - r, y - r, r * 2, r * 2); } g.restore(); } };
  K.blink = { z: 'mid', draw(g, t, sp) { const on = ((t / (sp.period || 1.2) + (sp.ph || 0)) % 1) < (sp.duty || .5); const a = sp.alwaysOn ? 1 : on ? 1 : .22; g.save(); g.globalAlpha = a; G.circ(g, sp.x, sp.y, sp.r, sp.col, 0); g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * .55; g.drawImage(G.glowSprite(sp.glow || '255,230,150'), sp.x - sp.r * 4, sp.y - sp.r * 4, sp.r * 8, sp.r * 8); g.restore(); } };
  K.waves = { z: 'mid', draw(g, t, sp) { for (let k = 0; k < (sp.n || 3); k++) { const y = sp.y0 + k * (sp.h / (sp.n || 3)); g.beginPath(); for (let x = sp.x0 || 0; x <= (sp.x1 || 960); x += 16) { const yy = y + Math.sin(x * .02 + t * (1.1 + k * .3) + k * 2) * (2 + k * 1.2); x === (sp.x0 || 0) ? g.moveTo(x, yy) : g.lineTo(x, yy); } g.strokeStyle = 'rgba(255,255,255,' + (.28 - k * .04) + ')'; g.lineWidth = 2 + k * .6; g.stroke(); } } };
  K.cars = { z: 'far', draw(g, t, sp) { const R = rnd(sp.seed || 4), span = 1100; for (let i = 0; i < sp.n; i++) { const o = R() * span, dir = sp.dir || 1, x = ((o + t * sp.speed * dir) % span + span) % span - 70, col = sp.cols[i % sp.cols.length], w = 30 * sp.sc; if (sp.clip) { g.save(); g.beginPath(); g.rect(sp.clip[0], sp.clip[1], sp.clip[2], sp.clip[3]); g.clip(); } G.fillRR(g, x, sp.y - w * .45, w, w * .35, 4 * sp.sc, col, 1.2); G.fillRR(g, x + w * .2, sp.y - w * .7, w * .5, w * .3, 4 * sp.sc, G.shade(col, .25), 1.2); G.circ(g, x + w * .22, sp.y - w * .08, w * .1, '#2a2a3a', 0); G.circ(g, x + w * .78, sp.y - w * .08, w * .1, '#2a2a3a', 0); if (sp.clip) g.restore(); } } };
  K.second = { z: 'mid', draw(g, t, sp) { const a = (FX.motion ? Date.now() / 1000 : 0) % 60 / 60 * 6.2832 - 1.5708; g.save(); g.lineCap = 'round'; g.strokeStyle = '#ef5350'; g.lineWidth = Math.max(1, sp.r * .05); g.beginPath(); g.moveTo(sp.x, sp.y); g.lineTo(sp.x + Math.cos(a) * sp.r, sp.y + Math.sin(a) * sp.r); g.stroke(); g.restore(); } };
  K.bubbles = { z: 'top', opt: true, draw(g, t, sp) { const R = rnd(sp.seed || 4); g.save(); for (let i = 0; i < AK(sp.n); i++) { const u = ((R() + t * .05 * (.6 + R())) % 1), x = sp.x0 + R() * (sp.x1 - sp.x0) + Math.sin(t + i * 2) * 10, y = sp.y1 - u * (sp.y1 - sp.y0), r = 5 + R() * 9; g.globalAlpha = .75 * Math.sin(u * 3.1416); g.fillStyle = 'rgba(200,235,255,.35)'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.beginPath(); g.arc(x - r * .35, y - r * .35, r * .22, 0, 6.2832); g.fill(); } g.restore(); } };
  K.drip = { z: 'mid', draw(g, t, sp) { const u = (t * 1.5) % 1, y = sp.y + u * u * 60; g.save(); g.globalAlpha = u < .08 ? u / .08 : 1; G.ell(g, sp.x, y, 4 - u, 6 + u * 4, '#4aa8e8', 1.2); g.restore(); if (u > .9) { g.save(); g.globalAlpha = (u - .9) * 8; g.strokeStyle = 'rgba(120,190,240,.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(sp.x, sp.y + 62, (u - .9) * 90, (u - .9) * 20, 0, 0, 6.2832); g.stroke(); g.restore(); } } };
  K.leaves = { z: 'top', opt: true, draw(g, t, sp) { const R = rnd(sp.seed || 9); for (let i = 0; i < AK(sp.n); i++) { const o = R(), u = ((o + t * .03 * (.6 + R())) % 1), x = sp.x0 + R() * (sp.x1 - sp.x0) + Math.sin(t * .9 + i) * 24 + u * 70, y = sp.y0 + u * (sp.y1 - sp.y0), rot = t * (1 + R()) + i; g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = .8 * Math.sin(u * 3.14); g.fillStyle = sp.cols[i % sp.cols.length]; g.beginPath(); g.ellipse(0, 0, 5, 2.4, 0, 0, 6.2832); g.fill(); g.restore(); } } };
  K.pollen = { z: 'top', opt: true, draw(g, t, sp) { const gs = G.glowSprite('255,250,200'), R = rnd(sp.seed || 5); g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < AK(sp.n); i++) { const u = R(), v = R(), x = sp.x0 + (((u + t * .01 * (.5 + R()) + Math.sin(t * .3 + i) * .02) % 1)) * (sp.x1 - sp.x0), y = sp.y0 + (((v - t * .006 * (.5 + R())) % 1 + 1) % 1) * (sp.y1 - sp.y0), r = 2 + R() * 2.5; g.globalAlpha = .35 + .35 * Math.sin(t * 1.5 + i); g.drawImage(gs, x - r * 2, y - r * 2, r * 4, r * 4); } g.restore(); } };

  /* =====================================================================================================
     ROOM KIT: painted walls, floors, rugs, frames, lights... (G.room.*, used by worlds/*_art.js; all baked, so cost is irrelevant at runtime)
     ===================================================================================================== */
  const RK = G.room = {};
  RK.wall = function (g, y, c1, c2, o) {
    o = o || {}; g.fillStyle = G.lin(g, 0, 0, 0, y, [c1, c2]); g.fillRect(0, 0, 960, y);
    const pat = o.pattern, pw = o.pw || 64;
    if (pat === 'stripes') for (let x = 0; x < 960; x += pw) { const gr = g.createLinearGradient(x, 0, x + pw, 0); gr.addColorStop(0, 'rgba(255,255,255,.0)'); gr.addColorStop(.5, 'rgba(255,255,255,.16)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(x, 0, pw, y); }
    else if (pat === 'dots' || pat === 'stars') { const R = rnd(5), col = o.pcol || 'rgba(255,255,255,.28)'; for (let r = 0, yy = 40; yy < y - 30; yy += 52, r++) for (let x = (r % 2) * 34 + 20; x < 960; x += 68) { if (pat === 'dots') { g.fillStyle = col; g.beginPath(); g.arc(x, yy, 3.5, 0, 6.2832); g.fill(); } else { G.sparkle(g, x, yy, 6 + R() * 2, col, .6); } } }
    else if (pat === 'tiles') { const tw = o.tw || 60, th = o.th || 50, grout = o.grout || 'rgba(255,255,255,.55)'; for (let yy = 0; yy < y; yy += th) for (let x = 0; x < 960; x += tw) { const gr = g.createLinearGradient(0, yy, 0, yy + th); gr.addColorStop(0, 'rgba(255,255,255,.22)'); gr.addColorStop(.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(0,40,60,.07)'); g.fillStyle = gr; g.fillRect(x + 1, yy + 1, tw - 2, th - 2); } g.strokeStyle = grout; g.lineWidth = 2; g.beginPath(); for (let yy = 0; yy <= y; yy += th) { g.moveTo(0, yy); g.lineTo(960, yy); } for (let x = 0; x <= 960; x += tw) { g.moveTo(x, 0); g.lineTo(x, y); } g.stroke(); }
    else if (pat === 'brick') { const bw = 64, bh = 26, R = rnd(11); for (let yy = 0, r = 0; yy < y; yy += bh, r++) for (let x = -(r % 2) * bw / 2; x < 960; x += bw) { g.fillStyle = 'rgba(' + (R() < .5 ? '255,200,170' : '90,30,10') + ',' + (.05 + R() * .1) + ')'; g.fillRect(x + 1, yy + 1, bw - 2, bh - 2); } g.strokeStyle = 'rgba(255,235,220,.45)'; g.lineWidth = 2; g.beginPath(); for (let yy = 0; yy <= y; yy += bh) { g.moveTo(0, yy); g.lineTo(960, yy); } g.stroke(); }
    if (o.dado) { const h = o.dado.h || 80, c = o.dado.c || G.shade(c2, -.08), top = y - h; g.fillStyle = G.lin(g, 0, top, 0, y, [G.shade(c, .06), G.shade(c, -.1)]); g.fillRect(0, top, 960, h);
      g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(0, top - 3, 960, 6); g.fillStyle = 'rgba(60,30,10,.18)'; g.fillRect(0, top + 3, 960, 5);
      for (let x = 30; x < 940; x += 120) { g.strokeStyle = 'rgba(255,255,255,.28)'; g.lineWidth = 2; G.rr(g, x, top + 16, 90, h - 34, 6); g.stroke(); g.strokeStyle = 'rgba(60,30,10,.14)'; G.rr(g, x + 2, top + 18, 90, h - 34, 6); g.stroke(); } }
    if (o.crown !== false) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(0, 0, 960, 12); g.fillStyle = 'rgba(70,35,10,.18)'; g.fillRect(0, 12, 960, 8); g.fillStyle = 'rgba(255,255,255,.3)'; g.fillRect(0, 20, 960, 2); }
    if (o.base !== false) { const bh = o.baseH || 16; g.fillStyle = G.lin(g, 0, y - bh, 0, y, [o.baseCol || '#fffaf0', G.shade(o.baseCol || '#fffaf0', -.12)]); g.fillRect(0, y - bh, 960, bh); g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(0, y - bh, 960, 2); g.fillStyle = 'rgba(60,30,10,.35)'; g.fillRect(0, y - 1, 960, 2); }
  };
  RK.floor = function (g, y, c1, c2, o) {
    o = o || {}; const kind = o.kind || 'wood', H = 540 - y; g.fillStyle = G.lin(g, 0, y, 0, 540, [c1, c2]); g.fillRect(0, y, 960, H);
    const vx = 480, vy = y - (o.depth || 330), R = rnd(o.seed || 7), line = o.line || 'rgba(70,35,10,.25)';
    if (kind === 'wood') {
      const N = o.n || 26, bx0 = -420, step = (960 + 840) / N, xs = (bx, yy) => vx + (bx - vx) * (yy - vy) / (540 - vy);
      for (let i = 0; i < N; i++) { const b0 = bx0 + i * step, b1 = b0 + step; let yy = y - R() * 30;
        while (yy < 540) { const len = (90 + R() * 170) * (1 + (yy - y) / 140); const y2 = Math.min(540, yy + len); const tone = R(); g.fillStyle = tone < .33 ? 'rgba(255,230,190,.13)' : tone < .66 ? 'rgba(80,35,5,.07)' : 'rgba(255,255,255,0)'; g.beginPath(); g.moveTo(xs(b0, Math.max(yy, y)), Math.max(yy, y)); g.lineTo(xs(b1, Math.max(yy, y)), Math.max(yy, y)); g.lineTo(xs(b1, y2), y2); g.lineTo(xs(b0, y2), y2); g.closePath(); g.fill();
          g.strokeStyle = line; g.lineWidth = 1 + (yy - y) / 120; g.beginPath(); g.moveTo(xs(b0, Math.max(yy, y)), Math.max(yy, y)); g.lineTo(xs(b1, Math.max(yy, y)), Math.max(yy, y)); g.stroke(); yy = y2; }
        g.strokeStyle = line; g.lineWidth = 1.5; g.beginPath(); g.moveTo(xs(b0, y), y); g.lineTo(xs(b0, 540), 540); g.stroke(); }
    } else if (kind === 'tile') {
      const N = o.n || 10, bx0 = -300, step = (960 + 600) / N, xs = (bx, yy) => vx + (bx - vx) * (yy - vy) / (540 - vy); let j = 0;
      for (let yy = y, d = 0; yy < 540; j++) { const hh = 26 + (yy - y) * .32, y2 = Math.min(540, yy + hh); for (let i = 0; i < N; i++) { if ((i + j) % 2 === 0) { g.fillStyle = o.alt || 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(xs(bx0 + i * step, yy), yy); g.lineTo(xs(bx0 + (i + 1) * step, yy), yy); g.lineTo(xs(bx0 + (i + 1) * step, y2), y2); g.lineTo(xs(bx0 + i * step, y2), y2); g.closePath(); g.fill(); } }
        g.strokeStyle = line; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, yy); g.lineTo(960, yy); g.stroke(); yy = y2; }
      g.strokeStyle = line; g.lineWidth = 1.2; g.beginPath(); for (let i = 0; i <= N; i++) { g.moveTo(xs(bx0 + i * step, y), y); g.lineTo(xs(bx0 + i * step, 540), 540); } g.stroke();
    } else if (kind === 'carpet') { for (let i = 0; i < 700; i++) { g.fillStyle = R() < .5 ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.05)'; g.fillRect(R() * 960, y + R() * H, 3, 1.5); } }
    else if (kind === 'stone') { const R2 = rnd(3); for (let yy = y, r = 0; yy < 540; r++) { const hh = 24 + (yy - y) * .28; for (let x = -(r % 2) * 60; x < 960; x += 120) { g.fillStyle = 'rgba(' + (R2() < .5 ? '255,255,255' : '60,40,20') + ',' + (.04 + R2() * .08) + ')'; g.fillRect(x + 1, yy + 1, 118, hh - 2); } g.strokeStyle = line; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, yy); g.lineTo(960, yy); g.stroke(); yy += hh; } }
    // window-light gloss + far-edge falloff
    let gr = g.createLinearGradient(0, y, 0, y + H * .55); gr.addColorStop(0, 'rgba(255,255,255,.2)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, y, 960, H * .55);
  };
  /* oval rug with border bands, pattern + soft shadow */
  RK.rug = function (g, x, y, rx, ry, c1, c2, o) {
    o = o || {}; g.save(); g.fillStyle = 'rgba(40,20,5,.2)'; g.beginPath(); g.ellipse(x + 4, y + 7, rx + 4, ry + 3, 0, 0, 6.2832); g.fill(); g.restore();
    G.ell(g, x, y, rx, ry, c1, 3); G.ell(g, x, y, rx * .9, ry * .86, G.shade(c1, .18), 0); G.ell(g, x, y, rx * .78, ry * .72, c2, 2.5); G.ell(g, x, y, rx * .5, ry * .44, c1, 0);
    g.save(); g.beginPath(); g.ellipse(x, y, rx * .9, ry * .86, 0, 0, 6.2832); g.clip(); g.fillStyle = 'rgba(255,255,255,.35)'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.2832; g.beginPath(); g.arc(x + Math.cos(a) * rx * .84, y + Math.sin(a) * ry * .8, 4, 0, 6.2832); g.fill(); } g.restore();
    if (o.star) G.star(g, x, y, Math.min(rx, ry * 2.4) * .25, G.shade(c2, .3), 1.5);
  };
  RK.frame = function (g, x, y, w, h, o) { // wall picture with drop shadow; o.draw(g,x,y,w,h) paints the picture
    o = o || {}; g.fillStyle = 'rgba(50,25,5,.22)'; G.rr(g, x + 4, y + 6, w, h, 4); g.fill(); G.fillRR(g, x, y, w, h, 4, o.frame || '#fff', 2.5); const p = o.pad == null ? 6 : o.pad; G.fillRR(g, x + p, y + p, w - p * 2, h - p * 2, 2, o.bg || '#fff8e6', 1.5);
    if (o.draw) { g.save(); g.beginPath(); g.rect(x + p, y + p, w - p * 2, h - p * 2); g.clip(); o.draw(g, x + p, y + p, w - p * 2, h - p * 2); g.restore(); }
    g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.moveTo(x + p, y + h - p); g.lineTo(x + p + (w - p * 2) * .35, y + p); g.lineTo(x + p + (w - p * 2) * .55, y + p); g.lineTo(x + p + (w - p * 2) * .2, y + h - p); g.fill();
  };
  RK.shelf = function (g, x, y, w, col) { g.fillStyle = 'rgba(50,25,5,.24)'; g.fillRect(x + 3, y + 10, w, 8); G.fillRR(g, x, y, w, 11, 3, col || '#b97b4a', 2.5); G.fillRR(g, x + 10, y + 11, 8, 14, 2, G.shade(col || '#b97b4a', -.15), 1.5); G.fillRR(g, x + w - 18, y + 11, 8, 14, 2, G.shade(col || '#b97b4a', -.15), 1.5); };
  /* fairy / string lights along a sagging wire; bulbs blink softly (ambient). pts = [[x,y],...] */
  RK.stringLights = function (g, s, x0, x1, y, sag, n, cols, near) {
    const draw = c => { c.strokeStyle = 'rgba(60,40,30,.6)'; c.lineWidth = 2; c.beginPath(); for (let i = 0; i <= 24; i++) { const u = i / 24, xx = x0 + (x1 - x0) * u, yy = y + Math.sin(u * 3.1416) * sag; i ? c.lineTo(xx, yy) : c.moveTo(xx, yy); } c.stroke(); };
    near ? G.near(g, s, draw) : draw(g);
    for (let i = 0; i < n; i++) { const u = (i + .5) / n, xx = x0 + (x1 - x0) * u, yy = y + Math.sin(u * 3.1416) * sag + 6; const col = cols[i % cols.length]; G.amb(s, { k: 'blink', x: xx, y: yy, r: 4.2, col, glow: '255,225,150', period: 2.4 + (i % 3) * .5, ph: i * .21, duty: .78, z: near ? 'top' : 'mid' }); }
  };

  /* painted sky for outdoor rooms: far layer (parallax, hazed) + drifting clouds + birds.  view: day|morning|sunset|night|city|garden|mountain|sea ... */
  RK.sky = function (g, s, view, h, o) {
    o = o || {}; h = h || 440; G.far(g, s, c => { G.view(c, view || 'day', 0, 0, 960, h, 20); });
    if ((view || '').indexOf('night') >= 0) { const R2 = rnd(4), pts = []; for (let i = 0; i < 18; i++) pts.push([R2() * 960, 14 + R2() * h * .45, 1.8 + R2() * 2]); G.amb(s, { k: 'stars', pts, z: 'far' }); }
    else { if (o.clouds !== false) G.amb(s, { k: 'clouds', x0: -140, x1: 1100, y0: 30, y1: o.cy1 || h * .45, n: o.nc || 5, speed: o.cs || 7, sc: o.csc || .72, a: view === 'sunset' || view === 'citysunset' ? .6 : .92, seed: o.seed || 3 }); if (o.birds !== false) G.amb(s, { k: 'birds', y: h * .25, n: 3, speed: 20, sc: 1, seed: o.seed || 3 }); }
  };
  RK.building = function (g, x, y, w, h, col, o) {
    o = o || {}; const T = G.tones(col); G.ao(g, x, y, w, h); G.fillRR(g, x, y, w, h, o.r == null ? 5 : o.r, col, 3);
    g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x + 3, y + 3, w * .12, h - 6); g.fillStyle = 'rgba(30,10,0,.14)'; g.fillRect(x + w * .86, y + 3, w * .14 - 3, h - 6);
    G.fillRR(g, x - 3, y - 6, w + 6, 10, 3, G.shade(col, -.12), 2.5);
    const cols = o.cols || Math.max(1, Math.floor((w - 12) / (o.ww || 46))), rows = o.rows || Math.max(1, Math.floor((h - 26) / (o.wh || 56))), ww = (w - 16) / cols, wh = (h - 22) / rows;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) { const wx = x + 8 + i * ww + ww * .16, wy = y + 14 + j * wh + wh * .12, a = ww * .68, b = wh * .66; if (o.skipRow0 && j === rows - 1 && o.door) continue; G.fillRR(g, wx - 2, wy - 2, a + 4, b + 4, 3, G.shade(col, .3), 1.5); const lit = o.lit && ((i * 7 + j * 3) % 5 === 0); g.fillStyle = G.lin(g, 0, wy, 0, wy + b, lit ? ['#ffe9a0', '#ffc860'] : ['#a8dcff', '#d8f1ff']); G.rr(g, wx, wy, a, b, 2); g.fill(); g.fillStyle = 'rgba(255,255,255,.4)'; g.beginPath(); g.moveTo(wx + a * .1, wy + b); g.lineTo(wx + a * .45, wy); g.lineTo(wx + a * .65, wy); g.lineTo(wx + a * .3, wy + b); g.fill(); g.strokeStyle = 'rgba(70,40,24,.45)'; g.lineWidth = 1.3; G.rr(g, wx, wy, a, b, 2); g.stroke(); g.fillStyle = 'rgba(60,30,10,.22)'; g.fillRect(wx, wy + b, a, 3); }
  };
  RK.tree = function (g, x, y, s, o) {
    o = o || {}; s = s || 1; const c1 = o.c1 || '#58c065', c2 = o.c2 || '#3da556'; G.aoEll(g, x, y, 34 * s, .8);
    G.fillRR(g, x - 7 * s, y - 44 * s, 14 * s, 48 * s, 4, '#8a5a3a', 2.5);
    [[0, -66, 32, c1], [-24, -46, 22, c2], [24, -46, 22, c2], [-8, -84, 22, c1], [14, -76, 20, c1]].forEach(p => { const r = p[2] * s, cx = x + p[0] * s, cy = y + p[1] * s, gr = g.createRadialGradient(cx - r * .35, cy - r * .4, r * .1, cx, cy, r); gr.addColorStop(0, G.shade(p[3], .28)); gr.addColorStop(.6, p[3]); gr.addColorStop(1, G.shade(p[3], -.2)); g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, r, 0, 6.2832); g.fill(); g.strokeStyle = 'rgba(30,80,30,.5)'; g.lineWidth = 1.6; g.stroke(); });
  };
  RK.flag = function (g, s, x, y) { G.line(g, x, y, x, y - 110, 5, '#8a8f9a'); G.circ(g, x, y - 112, 5, '#ffd23c', 2); G.amb(s, { k: 'flag', x, y: y - 108, w: 52, h: 14, z: 'mid' }); };
  K.flag = { z: 'mid', draw(g, t, sp) { const N = 8; g.beginPath(); for (let i = 0; i <= N; i++) { const u = i / N; g.lineTo(sp.x + u * sp.w, sp.y + Math.sin(t * 3.2 - u * 4) * 3.5 * u); } for (let i = N; i >= 0; i--) { const u = i / N; g.lineTo(sp.x + u * sp.w, sp.y + sp.h + Math.sin(t * 3.2 - u * 4) * 3.5 * u); } g.closePath(); if (!sp._gr) { const gr = g.createLinearGradient(0, sp.y, 0, sp.y + sp.h); gr.addColorStop(0, '#ef5350'); gr.addColorStop(.33, '#ef5350'); gr.addColorStop(.34, '#fff'); gr.addColorStop(.66, '#fff'); gr.addColorStop(.67, '#222'); gr.addColorStop(1, '#222'); sp._gr = gr; } g.fillStyle = sp._gr; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(60,30,20,.6)'; g.stroke(); } };
  RK.road = function (g, y0, y1, o) { // asphalt with soft kerb light and dashed centre line
    o = o || {}; g.fillStyle = G.lin(g, 0, y0, 0, y1, [o.c1 || '#7a7f94', o.c2 || '#5d6177']); g.fillRect(0, y0, 960, y1 - y0); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, y0, 960, 3); g.fillStyle = 'rgba(0,0,0,.18)'; g.fillRect(0, y0 + 3, 960, 5);
    const R = rnd(8); g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 90; i++) g.fillRect(R() * 960, y0 + R() * (y1 - y0), 6 + R() * 10, 2);
    if (o.dash !== false) { const my = (y0 + y1) / 2 + (o.dy || 0); for (let x = 20; x < 960; x += 120) { g.fillStyle = 'rgba(60,40,0,.25)'; G.rr(g, x + 2, my + 3, 66, 9, 3); g.fill(); G.fillRR(g, x, my, 66, 9, 3, '#ffe27a', 0); } }
  };
  RK.sidewalk = function (g, y0, y1, c1, c2) { g.fillStyle = G.lin(g, 0, y0, 0, y1, [c1 || '#e6dfcc', c2 || '#cfc6ae']); g.fillRect(0, y0, 960, y1 - y0); g.strokeStyle = 'rgba(80,60,30,.16)'; g.lineWidth = 2; g.beginPath(); for (let x = 0; x < 960; x += 80) { g.moveTo(x, y0); g.lineTo(x - 10, y1); } g.stroke(); g.fillStyle = 'rgba(255,255,255,.45)'; g.fillRect(0, y0, 960, 3); };
  RK.grass = function (g, y, c1, c2, seed) { g.fillStyle = G.lin(g, 0, y, 0, 540, [c1 || '#9fdc82', c2 || '#6fbf5c']); g.fillRect(0, y, 960, 540 - y); const R = rnd(seed || 5); for (let i = 0; i < 160; i++) { const x = R() * 960, yy = y + 6 + R() * (534 - y); g.strokeStyle = R() < .5 ? 'rgba(40,110,30,.28)' : 'rgba(255,255,200,.22)'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, yy); g.lineTo(x + 2, yy - 5 - R() * 5); g.stroke(); } g.fillStyle = 'rgba(255,255,255,.25)'; g.fillRect(0, y, 960, 2); };
  RK.plant = function (g, x, y, s, o) { A.draw(g, 'plant', x, y, s, o); };

  /* ---------- art registry ---------- */
  const A = M.art = { fns: {}, cache: {} };
  A.register = (name, fn) => { A.fns[name] = fn; };
  A.registerAll = o => { for (const k in o) A.fns[k] = o[k]; };
  A.has = n => !!A.fns[String(n).split(':')[0]];
  /* names may carry args: 'shape:circle:red' -> fn 'shape' gets o.args=['circle','red'] */
  /* A.draw: at runtime (not while a room is being baked) props are rendered ONCE in paint mode into a cached sprite and then blitted,
     so kit items / live props match the painted rooms and cost one drawImage per frame. Animated arts are never cached (A.noCache). */
  A.noCache = { tap: 1, clock: 1, alarm: 1, fan: 1, lampsun: 1, sunart: 1, sa_sunart: 1 };
  const SPR = new Map(); let sprPx = 0; A.spriteCount = () => SPR.size;
  A.cacheable = function (name, o) { const b = String(name).split(':')[0]; return !A.noCache[b] && !/^face/.test(b) && b.indexOf('sun') < 0 && FXq.sprites; };
  const FXq = M.fx; FXq.sprites = !/[?&]sprites=0/.test(location.search);
  A.sprite = function (name, s, o) {
    const k = M.cv ? M.cv.width / M.W : 1, sz = Math.max(8, Math.round((s || 100) * 2) / 2); let key; try { key = name + '|' + sz + '|' + k.toFixed(2) + (FX.paint === false ? '|f' : '') + (o ? '|' + JSON.stringify(o) : ''); } catch (e) { return null; }
    let sp = SPR.get(key); if (sp) return sp;
    const U = 90, ppu = Math.min(sz / 100 * k, 1100 / (U * 2)), px = Math.ceil(U * 2 * ppu); if (px < 4) return null;
    const c = G.mkCanvas(px, px), x = c.getContext('2d'); x.scale(ppu, ppu); x.lineJoin = 'round'; x.lineCap = 'round'; x.direction = 'rtl';
    const pp = G.paint; G.paint = FX.paint !== false; try { A.drawRaw(x, name, U, U, 100, o); } finally { G.paint = pp; }
    sp = { c, w: U * 2 * (sz / 100) * (ppu * 100 / sz * (sz / 100)) / (ppu * 100 / sz * (sz / 100)), hx: 0, hy: 0 };
    const wl = U * 2 * sz / 100; sp.w = wl; sp.h = wl; sp.hx = wl / 2; sp.hy = wl / 2; sprPx += px * px; SPR.set(key, sp);
    if (sprPx > 60e6 || SPR.size > 400) { const it = SPR.keys().next().value, v = SPR.get(it); sprPx -= v.c.width * v.c.height; SPR.delete(it); }
    return sp;
  };
  A.drawRaw = function (g, name, x, y, s, o) {
    const parts = String(name).split(':'), fn = A.fns[parts[0]]; if (parts.length > 1) o = Object.assign({}, o, { args: parts.slice(1) });
    if (G.paint && !G.artDepth && s >= 40 && !(o && o.noAO)) { const bt = y + s * .46; if (bt > G.floorY - 8 && bt < G.floorY + 34) G.aoEll(g, x, bt, s * .44); }
    g.save(); g.translate(x, y); const k = (s || 100) / 100; g.scale(k, k); g.lineJoin = 'round'; g.lineCap = 'round'; G.artDepth++;
    g.lineWidth = 3.5; g.strokeStyle = OL;
    if (fn) { try { fn(g, o || {}); } catch (e) { } } else { G.circ(g, 0, 0, 30, '#fff', 4); G.text(g, '?', 0, 2, { size: 40 }); }
    G.artDepth--; g.restore();
  };
  A.draw = function (g, name, x, y, s, o) {
    if (!G.paint && !G.artDepth && g === M.g && A.cacheable(name, o)) { const sp = A.sprite(name, s, o); if (sp) { g.drawImage(sp.c, x - sp.hx, y - sp.hy, sp.w, sp.h); return; } }
    A.drawRaw(g, name, x, y, s, o);
  };
  /* DOM canvas element showing an art (cached drawing, DPR aware) */
  A.el = function (name, px, o) {
    const c = document.createElement('canvas'), d = 2; c.width = c.height = px * d; c.style.width = c.style.height = px + 'px';
    const g = c.getContext('2d'); g.scale(d, d); const pp = G.paint; G.paint = !/^face/.test(name) && FX.paint !== false; try { A.draw(g, name, px / 2, px / 2, px * .94, o); } finally { G.paint = pp; } return c;
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
