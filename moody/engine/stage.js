/* Moody & Aboody - engine/stage.js
   The Stage is the canvas scene used by every mission: background drawer, layers (kits draw here),
   the two heroes (always present), particles, bubbles. Missions normally talk to it through ctx. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, U = M.util, FX = M.fx, Q = M.quality;

  function Stage() {
    this.t = 0; this.bg = null; this.layers = []; this.parts = []; this.floats = []; this.state = {};
    this.shakeA = 0; this.flashC = null; this.flashA = 0; this.input = null; this.showActive = true; this.floorY = 480; this.dbg = null;
    this.active = M.save.data.hero || 'moody'; this.onSwitch = null;
    this.heroes = { moody: this.mkHero('moody', 300, 480), aboody: this.mkHero('aboody', 430, 492) };
    M.chars.extras().forEach(k => { this.heroes[k] = this.mkHero(k, 200, 480); this.heroes[k].visible = false; });
    this.cast = ['moody', 'aboody']; this.control = ['moody', 'aboody']; this.abil = {};
    this._bk = null; this._amb = null; this._tg = null; this._bst = null; this._bkTimes = []; this._raw = null; this.par = { x: 0, y: 0 }; this.tr = null; this.mood = 0; this.moodT = 0; this.moodOn = false; this.glows = []; this.idleT = 0; this.zoom = 1;
  }
  const P = Stage.prototype;
  P.mkHero = function (id, x, y) { return { id, x, y, tx: null, ty: null, dir: 1, anim: 'idle', t: Math.random() * 5, fa: null, fat: 0, sc: 1, carry: null, bubble: null, visible: true, jy: 0, talk: 0, speed: (M.chars.defs[id] && M.chars.defs[id].speed) || 230, hx: x, hy: y }; };
  P.hero = function (id) { return this.heroes[id || this.active]; };
  P.other = function (id) { return this.heroes[(id || this.active) === 'moody' ? 'aboody' : 'moody']; };

  /* ---- cast: which heroes are on stage / controllable (see DEV.md "Heroes, companions") ----
     setCast(['moody','aboody','toota','nemo'], ['moody','aboody','toota','nemo'])  -> present, controllable (default control = brothers) */
  P.setCast = function (cast, control) {
    this.cast = cast && cast.length ? cast.slice() : ['moody', 'aboody']; this.control = (control && control.length ? control : this.cast.filter(k => k === 'moody' || k === 'aboody')).slice();
    if (!this.control.length) this.control = this.cast.filter(k => M.chars.defs[k].playable).slice(0, 1);
    if (this.control.indexOf(this.active) < 0) { this.active = this.control[0]; }
    this.layout(this._lay || 'floor'); if (this.onCast) this.onCast();
  };
  /* ability tags: does hero `id` satisfy `need` (a hero id or a tag such as 'strong','small','leader','finder')? */
  P.can = function (id, need) { if (!need) return true; const ab = this.abil[id] || []; return M.chars.has(id, need) || ab.indexOf(need) >= 0; };
  /* which controllable hero satisfies `need` (active one first) */
  P.who = function (need) { if (!need) return this.active; if (this.can(this.active, need)) return this.active; return this.control.find(k => this.can(k, need)) || this.control[0]; };

  /* hero layouts */
  P.layout = function (name) {
    this._lay = name; const m = this.heroes.moody, a = this.heroes.aboody, fy = this.floorY, ex = M.chars.extras().map(k => this.heroes[k]);
    const reset = h => { h.visible = true; h.sc = 1; h.tx = null; h.fa = null; h.carry = null; h.jy = 0; };
    [m, a].concat(ex).forEach(reset);
    if (name && typeof name === 'object') {
      for (const k in name) { const h = this.heroes[k]; if (!h) continue; Object.assign(h, name[k]); h.hx = h.x; h.hy = h.y; h.visible = name[k].visible !== false; }
      M.chars.extras().forEach((k, i) => { if (!(k in name)) this.placeExtra(k, 'floor'); });
    } else {
      if (name === 'hidden') { [m, a].concat(ex).forEach(h => { h.visible = false; }); }
      else if (name === 'corner') { m.x = 62; m.y = 532; a.x = 898; a.y = 532; m.sc = a.sc = .62; a.dir = -1; m.dir = 1; }
      else if (name === 'bottom') { m.x = 330; m.y = 528; a.x = 440; a.y = 534; m.sc = a.sc = .72; m.dir = 1; a.dir = -1; }
      else { m.x = 320; m.y = fy; a.x = 450; a.y = fy + 10; m.dir = 1; a.dir = -1; }
      m.hx = m.x; m.hy = m.y; a.hx = a.x; a.hy = a.y;
      M.chars.extras().forEach(k => this.placeExtra(k, name));
    }
    if (name !== 'hidden') Object.keys(this.heroes).forEach(k => { if (this.cast.indexOf(k) < 0) this.heroes[k].visible = false; });
  };
  P.placeExtra = function (k, name) {
    const h = this.heroes[k], fy = this.floorY; if (!h) return;
    const slot = { toota: [200, fy + 4, 1], nemo: [120, fy + 12, 1], nana: [560, fy + 2, -1], baba: [640, fy + 2, -1], ofa: [700, fy + 8, -1], toti: [250, fy + 16, 1], amani: [610, fy + 14, -1], nada: [520, fy + 18, -1], beno: [770, fy + 2, -1], medo: [840, fy + 4, -1], kamal: [900, fy + 10, -1], luka: [380, fy + 18, 1] }[k],
      cor = { toota: [128, 534, 1], nemo: [832, 534, -1], nana: [200, 534, 1], baba: [760, 534, -1], ofa: [690, 534, -1], toti: [270, 534, 1], amani: [330, 534, 1], nada: [600, 534, -1], beno: [560, 534, -1], medo: [900, 534, -1], kamal: [60, 534, 1], luka: [400, 534, 1] }[k];
    if (name === 'hidden') { h.visible = false; return; }
    if (name === 'corner' || name === 'bottom') { h.x = cor[0]; h.y = cor[1]; h.dir = cor[2]; h.sc = .62; } else { h.x = slot[0]; h.y = slot[1]; h.dir = slot[2]; h.sc = 1; }
    h.hx = h.x; h.hy = h.y;
  };
  P.setActive = function (id, silent) {
    if (id === this.active || this.control.indexOf(id) < 0) return; this.active = id; M.save.data.hero = id; M.save.commit();
    const h = this.hero(id); if (!silent) { M.audio.sfx('pop'); this.burst(h.x, h.y - 100 * h.sc, { n: 8, kind: 'spark' }); this.play(id, 'wave', .8); }
    if (this.onSwitch) this.onSwitch(id);
  };
  P.walk = function (id, x, y) {
    const h = this.hero(id); return new Promise(res => { h.tx = x; h.ty = y == null ? h.y : y; h.walkRes = res; h.dir = x >= h.x ? 1 : -1; });
  };
  P.play = function (id, anim, dur) {
    const h = this.hero(id); h.fa = anim; h.fat = dur || 1; h.t = 0; return new Promise(res => { h.playRes && h.playRes(); h.playRes = res; });
  };
  P.playBoth = function (anim, dur) { return Promise.all(this.cast.filter(k => this.heroes[k].visible).map(k => this.play(k, anim, dur))); };
  P.present = function () { return this.cast.filter(k => this.heroes[k] && this.heroes[k].visible); };
  P.bubble = function (id, text, dur) { const h = this.hero(id); h.bubble = { text: M.fmt(text), t: dur || 2 }; if (M.voice && !document.getElementById('dlg') && !document.getElementById('qz')) M.voice.speak(text, { speaker: id, soft: true }); };
  P.addLayer = function (l) { l.z = l.z || 0; this.layers.push(l); this.layers.sort((a, b) => a.z - b.z); const me = this; return function () { const i = me.layers.indexOf(l); if (i >= 0) me.layers.splice(i, 1); }; };
  P.shake = function (a) { this.shakeA = Math.max(this.shakeA, a || 6); };
  P.flash = function (col, a) { this.flashC = col || '#fff'; this.flashA = a || .6; };
  P.float = function (text, x, y, col, size) { this.floats.push({ text, x, y, col: col || '#ffc93c', t: 0, size: size || 34 }); };
  P.burst = function (x, y, o) {
    o = o || {}; const n = Math.max(2, Math.round((o.n || 14) * (FX.parts || 1))), cols = o.cols || ['#ffc93c', '#ff6f91', '#4aa8e8', '#5cc96b', '#ff8a2a', '#8a6bd6'];
    for (let i = 0; i < n && this.parts.length < 400 * (FX.parts || 1); i++) {
      const a = U.rnd(0, 6.283), sp = U.rnd(o.min || 80, o.max || 260);
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 80), g: o.g == null ? 520 : o.g, life: 0, max: U.rnd(.6, 1.2), kind: o.kind || 'conf', col: o.col || U.pick(cols), s: U.rnd(4, 8) * (o.size || 1), rot: U.rnd(0, 6), vr: U.rnd(-8, 8) });
    }
  };
  P.confetti = function () { for (let i = 0, n = Math.round(40 * (FX.parts || 1)); i < n; i++) this.parts.push({ x: U.rnd(0, 960), y: U.rnd(-60, -5), vx: U.rnd(-40, 40), vy: U.rnd(60, 160), g: 40, life: 0, max: U.rnd(2.5, 4), kind: 'conf', col: U.pick(['#ffc93c', '#ff6f91', '#4aa8e8', '#5cc96b', '#ff8a2a', '#8a6bd6']), s: U.rnd(5, 9), rot: U.rnd(0, 6), vr: U.rnd(-6, 6) }); };

  P.update = function (dt) {
    this.t += dt;
    for (const id in this.heroes) {
      const h = this.heroes[id]; h.t += dt;
      if (h.talk > 0) h.talk -= dt;
      if (h.bubble) { h.bubble.t -= dt; h.bubble.age = (h.bubble.age || 0) + dt; if (h.bubble.t <= 0) h.bubble = null; }
      if (h.tx != null) {
        const dx = h.tx - h.x, dy = h.ty - h.y, d = Math.hypot(dx, dy), st = h.speed * dt;
        if (d <= st) { h.x = h.tx; h.y = h.ty; h.tx = null; const r = h.walkRes; h.walkRes = null; if (r) r(); }
        else { h.x += dx / d * st; h.y += dy / d * st; if (Math.abs(dx) > 2) h.dir = dx > 0 ? 1 : -1; }
      }
      if (h.fat > 0) { h.fat -= dt; if (h.fat <= 0) { h.fa = null; const r = h.playRes; h.playRes = null; if (r) r(); } }
    }
    this.layers.forEach(l => l.update && l.update(dt, this));
    for (let i = this.parts.length - 1; i >= 0; i--) { const p = this.parts[i]; p.life += dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; if (p.life > p.max || p.y > 600) this.parts.splice(i, 1); }
    for (let i = this.floats.length - 1; i >= 0; i--) { const f = this.floats[i]; f.t += dt; if (f.t > 1.2) this.floats.splice(i, 1); }
    if (this.shakeA > 0) this.shakeA = Math.max(0, this.shakeA - dt * 30);
    if (this.flashA > 0) this.flashA = Math.max(0, this.flashA - dt * 1.5);
    this.visUpdate(dt);
  };

  P.heroAnim = function (h) { return h.fa || (h.tx != null ? 'walk' : (h.anim || 'idle')); };
  /* Actor impostors (quality 'medium'/'low', or crowds of 8+ visible actors): every actor that is not the centre of attention (not the active hero, not talking, not walking / playing a
     gesture, no bubble) is rendered by Moody.chars.draw into its own small offscreen canvas only every 2nd/3rd frame (staggered) and blitted in between with ONE drawImage.
     chars.js sees the offscreen context as Moody.g for the duration of the call, so its per-actor state (position, tap-reaction visibility, gaze) is updated exactly as for a direct draw. */
  /* Per-actor impostor canvases, blitted 1:1 (same pixel density as the main canvas, device-pixel aligned): measured 2.5x cheaper than drawing the vector actor every frame
     (a shared atlas or scaled blits are NOT: each frame then pays a full-texture copy / resample). */
  const IMP = new Map(); let DF = 0;
  M.stageImpostors = IMP; let warmT = 0;
  Q.on(() => {   // quality changed: the canvas density changed too -> drop the impostors and pre-bake the visible actors' sprite sets (one per 80 ms, so no single big hitch)
    IMP.clear(); clearTimeout(warmT); warmT = setTimeout(() => { try { const sc = M.scene, ids = sc && sc.present ? sc.present() : []; let i = 0; const nx = () => { if (i >= ids.length) return; try { M.chars.warm([ids[i++]]); } catch (e) { } warmT = setTimeout(nx, 80); }; nx(); } catch (e) { } }, 400);
  });
  function impFor(id, hgt, k) {
    const lw = Math.ceil(hgt * 1.2 + 110), top = Math.ceil(hgt * 1.36 + 16), lh = top + 24; let im = IMP.get(id);
    if (!im || im.k !== k || im.lw < lw || im.lh < lh) { const c = G.mkCanvas(Math.ceil(lw * k), Math.ceil(lh * k)); im = { c, g: c.getContext('2d'), lw: c.width / k, lh: c.height / k, ax: Math.round(lw * k / 2) / k, ay: Math.round(top * k) / k, k, sig: '', fr: -99 }; IMP.set(id, im); }
    return im;
  }
  P.drawHero = function (g, h, idx, nVis) {
    if (!h.visible || h.x < -120 || h.x > 1080) return;   // hidden / off-screen actors cost nothing
    const eq = M.save.data.cosm.eq[h.id] || {}, anim = this.heroAnim(h), every0 = FX.idleEvery || 1, V = M.voice;
    const opts = { anim, t: h.t, dir: h.dir, sc: h.sc, hat: eq.hat, shirtId: eq.shirt, carry: h.carry, talk: h.talk > 0, noShadow: FX.shadows };
    const crowd = nVis >= 8;   // 8+ visible actors: background actors are refreshed less often at every level (FX.crowdAdd), plus an adaptive extra (this.ie) while the frame rate is poor
    let every = every0 >= 2 ? every0 + (crowd ? FX.crowdAdd || 1 : 0) : (crowd ? 2 : 1); if (every > 1 || crowd) every += this.ie | 0;
    if (every > 1) {
      const busy = h.talk > 0 || h.tx != null || h.fa || h.bubble || h.carry || (V && V.speaker === h.id) || this.tr || this.mood > 0;
      if (busy) every = Math.min(every, FX.fgEvery || 1);                                            // walking / talking / gesturing: full rate (high, medium) or 30 fps (low)
      else if (h.id === this.active) every = Math.min(every, (FX.fgEvery || 1) + (FX.idleEvery >= 4 ? 1 : 0));   // the hero the child controls, standing still: low = 20 fps
      if (h.carry) every = 1;
    }
    const y = h.y - h.jy;
    if (every <= 1 || this.impMode === 'off') { M.chars.draw(g, h.id, h.x, y, opts); return; }
    const k = M.cv.width / 960, im = impFor(h.id, M.chars.height(h.id) * h.sc, k), sig = anim + '|' + h.dir + '|' + h.sc + '|' + eq.hat + '|' + eq.shirt + '|' + (M.dress && M.dress.sig ? M.dress.sig(h.id) : '') + '|' + (h.talk > 0 ? 1 : 0);
    if (im.sig !== sig || DF - im.fr >= every || (DF + idx) % every === 0) {
      const cg = im.g; cg.setTransform(1, 0, 0, 1, 0, 0); cg.clearRect(0, 0, im.c.width, im.c.height); cg.setTransform(k, 0, 0, k, (im.ax - h.x) * k, (im.ay - y) * k); cg.lineJoin = 'round'; cg.lineCap = 'round'; cg.direction = 'rtl';
      const og = M.g; M.g = cg; try { M.chars.draw(cg, h.id, h.x, y, opts); } finally { M.g = og; } im.sig = sig; im.fr = DF;
    }
    g.drawImage(im.c, Math.round((h.x - im.ax) * k) / k, Math.round((y - im.ay) * k) / k, im.lw, im.lh);
  };
  P.drawBubble = function (g, h) {
    if (!h.bubble || !h.visible) return; const txt = h.bubble.text, hh = M.chars.height(h.id) * h.sc;
    g.save(); g.font = 'bold 24px ' + M.FONT; const w = Math.min(380, g.measureText(txt).width + 36); g.restore();
    const x = U.clamp(h.x, w / 2 + 8, 952 - w / 2), y = h.y - hh - 44, k = U.ease.outBack(Math.min(1, (h.bubble.age || 0) * 6));
    g.save(); g.translate(x, y); g.scale(k, k);
    G.fillRR(g, -w / 2, -24, w, 48, 20, '#fff', 3.5); G.poly(g, [[-8 + (h.x - x) * .3, 22], [8 + (h.x - x) * .3, 22], [(h.x - x) * .3, 36]], '#fff', 3.5); G.fillRR(g, -8 + (h.x - x) * .3 - 4, 18, 24, 7, 0, '#fff', 0);
    G.text(g, txt, 0, 1, { size: 24, color: M.pal.ink }); g.restore();
  };
  /* =====================================================================================================
     VISUAL SYSTEM (stage side).  Rooms registered in Moody.rooms are BAKED once (per size + state flags) into three
     shared offscreen canvases:  far (half-res, hazed, parallax)  ·  mid (the room, opaque)  ·  near (foreground + vignette/tint grade).
     Per frame: far -> ambient(far) -> mid -> ambient(mid) -> layers z<0 -> contact shadows + heroes -> near -> light shafts/motes -> glows -> layers z>=0 ...
     Anonymous background functions (runner/lanes kits) are drawn raw each frame, with a generic vignette on top.
     ===================================================================================================== */
  const FM = 20, POOL = { W: 0, H: 0, owner: null, bg: null, st: null, rn: '' }, LOOK = M.look;
  const PTR = FX.ptr = { x: 0, y: 0 }, TILT = { x: 0, y: 0, base: null };
  (function listeners() {
    window.addEventListener('pointermove', e => { PTR.x = U.clamp((e.clientX / innerWidth - .5) * 2, -1, 1); PTR.y = U.clamp((e.clientY / innerHeight - .5) * 2, -1, 1); }, { passive: true });
    window.addEventListener('deviceorientation', e => { if (e.gamma == null) return; if (!TILT.base) TILT.base = e.beta || 45; TILT.x = U.clamp(e.gamma / 22, -1, 1); TILT.y = U.clamp(((e.beta || 45) - TILT.base) / 25, -1, 1); }, { passive: true });
    document.addEventListener('pointerdown', () => { const s = M.scene; if (s && s.skipTr) { s.idleT = 0; s.skipTr(); } }, true);
  })();
  function roomOf(bg) { if (bg.__rn !== undefined) return bg.__rn; let n = ''; const R = M.rooms || {}; for (const k in R) if (R[k] === bg) { n = k; break; } bg.__rn = n; return n; }
  /* state signature: JSON of the state minus the keys the room declares as "live" (drawn every frame via G.live, e.g. a moving cat) */
  P._sig = function () { const L = this._liveSet; try { return L ? JSON.stringify(this.state, (k, v) => (L[k] ? undefined : v)) : JSON.stringify(this.state); } catch (e) { return String(Math.random()); } };

  LOOK.set('callroom', { raw: true, indoor: false, tod: 'night', vig: .12 });   // engine/call.js draws Baba live (talking) -> never baked
  /* occupied-area rectangles of a layer canvas (so the per-frame blit only copies pixels that matter): coarse alpha scan, rows merged into runs */
  const TILE = 24;
  function occRects(tc, thr) {
    const w = tc.width, h = tc.height, k = w / (960 + FM * 2), x = tc.getContext('2d'), d = x.getImageData(0, 0, w, h).data, cols = Math.ceil((960 + FM * 2) / TILE), rows = Math.ceil((540 + FM * 2) / TILE), occ = new Uint8Array(cols * rows), st = Math.max(1, Math.floor(TILE * k / 4));
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const x0 = Math.floor(c * TILE * k), x1 = Math.min(w, Math.floor((c + 1) * TILE * k)), y0 = Math.floor(r * TILE * k), y1 = Math.min(h, Math.floor((r + 1) * TILE * k)); let hit = 0; for (let yy = y0; yy < y1 && !hit; yy += st) for (let xx = x0; xx < x1; xx += st) if (d[(yy * w + xx) * 4 + 3] > thr) { hit = 1; break; } occ[r * cols + c] = hit; }
    const out = []; for (let r = 0; r < rows; r++) { let c = 0; while (c < cols) { if (!occ[r * cols + c]) { c++; continue; } let c2 = c; while (c2 < cols && occ[r * cols + c2]) c2++; const last = out[out.length - 1]; if (last && last.c0 === c && last.c1 === c2 && last.r1 === r) last.r1 = r + 1; else out.push({ c0: c, c1: c2, r0: r, r1: r + 1 }); c = c2; } }
    return out.map(o => ({ x: o.c0 * TILE, y: o.r0 * TILE, w: Math.min((o.c1 - o.c0) * TILE, 960 + FM * 2 - o.c0 * TILE), h: Math.min((o.r1 - o.r0) * TILE, 540 + FM * 2 - o.r0 * TILE) }));
  }
  function blitRects(g, cv, rects, dx, dy, k) { for (let i = 0; i < rects.length; i++) { const r = rects[i]; g.drawImage(cv, r.x * k, r.y * k, r.w * k, r.h * k, dx + r.x, dy + r.y, r.w, r.h); } }
  P.dirty = function () { this._dirty = true; };
  /* make sure POOL holds this stage's baked room; returns the meta or null when the bg must be drawn raw */
  P.ensureBake = function () {
    const bg = this.bg, cv = M.cv, W = cv.width, H = cv.height, rn = roomOf(bg);
    if (!rn || this._raw === bg || (LOOK.table[rn] && LOOK.table[rn].raw)) return null;
    const qk = Q.level + '|' + FX.bake, sig = this._sig(); if (POOL.owner === this && POOL.bg === bg && POOL.W === W && POOL.qk === qk && !this._dirty && sig === POOL.st) return this._meta;
    // too many rebakes per second (a kit mutating the state every frame) -> fall back to the raw drawer for this bg
    const now = performance.now(); this._bkTimes.push(now); while (this._bkTimes.length && now - this._bkTimes[0] > 1500) this._bkTimes.shift();
    if (this._bkTimes.length > 6 && POOL.owner === this) { this._raw = bg; return null; }
    this._dirty = false; const k = W / 960, bs = FX.bake || .5, kf = k * bs;
    if (POOL.W !== W || POOL.H !== H || !POOL.mid || POOL.bs !== bs) {
      const fw = (960 + FM * 2) * k, fh = (540 + FM * 2) * k;
      POOL.W = W; POOL.H = H; POOL.bs = bs; POOL.cm = null; POOL.mid = G.mkCanvas(W, H); POOL.far = G.mkCanvas(fw, fh); POOL.near = G.mkCanvas(fw, fh); POOL.tf = G.mkCanvas(fw * bs, fh * bs); POOL.tn = G.mkCanvas(fw * bs, fh * bs);
      POOL.mc = POOL.mid.getContext('2d'); POOL.fc = POOL.tf.getContext('2d', { willReadFrequently: true }); POOL.nc = POOL.tn.getContext('2d', { willReadFrequently: true });   // far/near are painted at half resolution (soft depth-of-field) and upscaled ONCE into the full-res canvases
    }
    const mc = POOL.mc, fc = POOL.fc, nc = POOL.nc, meta = LOOK.get(rn, this); this._meta = meta;
    [mc, fc, nc].forEach(c => { c.setTransform(1, 0, 0, 1, 0, 0); c.globalCompositeOperation = 'source-over'; c.globalAlpha = 1; c.clearRect(0, 0, c.canvas.width, c.canvas.height); c.lineJoin = 'round'; c.lineCap = 'round'; c.direction = 'rtl'; });
    mc.setTransform(k, 0, 0, k, 0, 0); fc.setTransform(kf, 0, 0, kf, kf * FM, kf * FM); nc.setTransform(kf, 0, 0, kf, kf * FM, kf * FM);
    this._amb = []; this._tg = { mid: mc, far: fc, near: nc, usedFar: false, usedNear: false };
    G.paint = FX.paint !== false; G.floorY = meta.floor; G.lightX = meta.lightX || 480; G.artDepth = 0;
    try { bg(mc, 0, this); } catch (e) { this._raw = bg; console.error(e); } finally { G.paint = false; G.artDepth = 0; }
    mc.setTransform(k, 0, 0, k, 0, 0); G.gradeMid(mc, meta, 960, 540);
    if (this._tg.usedFar) { fc.setTransform(kf, 0, 0, kf, kf * FM, kf * FM); fc.globalCompositeOperation = 'source-atop'; fc.fillStyle = meta.haze || 'rgba(222,236,255,.12)'; fc.fillRect(-FM, -FM, 960 + FM * 2, 540 + FM * 2); fc.globalCompositeOperation = 'source-over'; }
    nc.setTransform(kf, 0, 0, kf, kf * FM, kf * FM); G.gradeNear(nc, meta, 960, 540);
    // upscale the soft half-res layers once so that every frame is a plain 1:1 blit
    [[POOL.far, POOL.tf], [POOL.near, POOL.tn]].forEach(pr => { const x = pr[0].getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, pr[0].width, pr[0].height); x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; x.drawImage(pr[1], 0, 0, pr[0].width, pr[0].height); });
    this._hasFar = this._tg.usedFar; this._tg = null; POOL.farR = this._hasFar ? occRects(POOL.tf, 6) : null; POOL.nearR = occRects(POOL.tn, 3);
    const A = this._amb; this._aF = A.filter(a => a.z === 'far'); this._aM = A.filter(a => a.z === 'mid'); this._aT = A.filter(a => a.z === 'top');
    this._liveSet = null; if (meta.live && meta.live.length) { this._liveSet = {}; meta.live.forEach(k => { this._liveSet[k] = 1; }); }
    // low quality (no parallax): fold the far layer + its frozen decorative ambient into ONE canvas with the room, so a frame needs a single blit instead of tiles + ambient + mid
    this._merged = false;
    if (!FX.parallax && !this._aF.some(a => a.k === 'live') && (this._hasFar || this._aF.length)) {
      try {
        const cm = POOL.cm || (POOL.cm = G.mkCanvas(W, H)), x = cm.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H);
        if (this._hasFar) x.drawImage(POOL.far, -FM * k, -FM * k);
        x.setTransform(k, 0, 0, k, 0, 0); x.lineJoin = 'round'; x.lineCap = 'round'; ambDraw(x, this._aF, 0, false, this); x.drawImage(POOL.mid, 0, 0, 960, 540);
        const frozen = this._aM.filter(a => a.k === 'curtain' || a.k === 'waves'); if (frozen.length) { ambDraw(x, frozen, 0, false, this); this._aM = this._aM.filter(a => frozen.indexOf(a) < 0); }   // swaying curtains / wave lines stand still at 'low': baked once
        this._merged = true;
      } catch (e) { this._merged = false; }
    }
    POOL.owner = this; POOL.bg = bg; POOL.st = this._sig(); POOL.rn = rn; POOL.qk = qk; return meta;
  };
  const GEN = { W: 0, c: null };
  function genericNear(W) { if (GEN.W === W) return GEN.c; const kf = W / 960 * .5, t = G.mkCanvas((960 + FM * 2) * kf, (540 + FM * 2) * kf), x = t.getContext('2d'); x.setTransform(kf, 0, 0, kf, kf * FM, kf * FM); G.gradeNear(x, LOOK.get('', null), 960, 540); const c = GEN.c = G.mkCanvas((960 + FM * 2) * kf * 2, (540 + FM * 2) * kf * 2); c.getContext('2d').drawImage(t, 0, 0, c.width, c.height); GEN.W = W; return c; }
  function ambDraw(g, list, at, motion, stage) { for (let i = 0; i < list.length; i++) { const a = list[i], K = G.amb.kinds[a.k]; if (!K || (a.opt || K.opt) && (!motion || !FX.ambient)) continue; g.save(); K.draw(g, at, a, stage); g.restore(); } }

  P.drawBg = function (g) {
    const meta = this.bg ? this.ensureBake() : null; this._cur = meta;
    if (!this.bg) return;
    if (!meta) { this.bg(g, this.t, this); return; }
    if (this._merged && POOL.cm && POOL.owner === this) { g.drawImage(POOL.cm, 0, 0, 960, 540); if (this._aM.length) ambDraw(g, this._aM, FX.motion ? this.t : 0, FX.motion, this); return; }
    const motion = FX.motion, at = motion ? this.t : 0, px = FX.parallax && motion ? this.par.x * meta.par : 0, py = FX.parallax && motion ? this.par.y * meta.par : 0;
    const kq = M.cv.width / 960, Q = v => Math.round(v * kq) / kq; if (this._hasFar) blitRects(g, POOL.far, POOL.farR, Q(-FM - px * 9), Q(-FM - py * 4), kq);
    if (FX.ambient || true) { if (this._aF.length) ambDraw(g, this._aF, at, motion, this); }
    g.drawImage(POOL.mid, 0, 0, 960, 540);
    if (this._aM.length) ambDraw(g, this._aM, at, motion, this);
  };
  P.drawNear = function (g) {
    const meta = this._cur, motion = FX.motion, at = motion ? this.t : 0;
    if (meta && POOL.owner === this) {
      const px = FX.parallax && motion ? this.par.x * meta.par : 0, py = FX.parallax && motion ? this.par.y * meta.par : 0;
      const kq = M.cv.width / 960; blitRects(g, POOL.near, POOL.nearR, Math.round((-FM + px * 6) * kq) / kq, Math.round((-FM + py * 3) * kq) / kq, kq);
      if (this._aT.length) ambDraw(g, this._aT, at, motion, this);
    } else if (this.bg) g.drawImage(genericNear(M.cv.width), -FM, -FM, 960 + FM * 2, 540 + FM * 2);
  };
  P.visUpdate = function (dt) {
    // parallax target: hero position + pointer + device tilt (all tiny), smoothed
    if (FX.parallax && FX.motion) {
      const h = this.hero(); let tx = h ? U.clamp((h.x - 480) / 480, -1, 1) * .55 : 0, ty = 0;
      tx += PTR.x * .35 + TILT.x * .5; ty += PTR.y * .5 + TILT.y * .5 + Math.sin(this.t * .4) * .12; tx += Math.sin(this.t * .27) * .12;
      const k = Math.min(1, dt * 2.5); this.par.x += (U.clamp(tx, -1, 1) - this.par.x) * k; this.par.y += (U.clamp(ty, -1, 1) - this.par.y) * k;
    } else { this.par.x = this.par.y = 0; }
    this.idleT += dt;
    const k2 = Math.min(dt, .04); let z = 1;
    if (this.moodOn) { this.mood = Math.min(1, this.mood + k2 * 3); this.moodT += k2; } else if (this.mood > 0) { this.mood = Math.max(0, this.mood - k2 * 3); if (!this.mood) this.moodT = 0; }
    if (this.mood > 0 && FX.motion && FX.trans === 'full') z += .035 * Math.min(1, this.moodT / 3.5);
    const tr = this.tr;
    if (tr) {
      tr.t += k2 * 1000;
      if (tr.ph === 0 && tr.t >= tr.dc) { tr.ph = 1; tr.t = 0; try { tr.apply(); } catch (e) { console.error(e); } this._cam = null; if (this.bg && !this._skipBake) { try { this.ensureBake(); } catch (e) { } } }
      else if (tr.ph === 1 && tr.t >= tr.do) { this.tr = null; tr.res(); }
      if (this.tr && this.tr.ph === 1 && FX.motion && FX.trans === 'full') { const e = U.ease.outCubic(Math.min(1, tr.t / tr.do)); z += .05 * (1 - e); }
    }
    this.zoom = z;
  };
  /* cinematic scene change: closes an iris on the old scene, runs apply(), opens on the new one with a slight zoom. skippable (tap) */
  P.transition = function (apply, o) {
    o = o || {}; const me = this; if (!o.instant && M.sound) M.sound.swish();
    return new Promise(res => {
      if (me.tr) { const old = me.tr; me.tr = null; try { if (old.ph === 0) old.apply(); } catch (e) { } old.res(); }
      if (o.instant || !FX.motion && o.instant !== false && false) { apply(); res(); return; }
      const h = me.hero(), fast = FX.trans !== 'full' || !FX.motion; me.tr = { ph: 0, t: 0, dc: o.closeMs || (fast ? 110 : 210), do: o.openMs || (fast ? 150 : 300), fast, apply, res, style: o.style || 'iris', cx: h && h.visible ? h.x : 480, cy: h && h.visible ? h.y - 80 : 300 };
    });
  };
  P.skipTr = function () { const tr = this.tr; if (!tr) return; if (tr.ph === 0) tr.t = Math.max(tr.t, tr.dc - 1); else tr.t = Math.max(tr.t, tr.do - 1); };
  P.setMood = function (on) { this.moodOn = !!on; };
  const IRIS = '#2a1b3d';
  P.drawOverlay = function (g) {
    const tr = this.tr, m = this.mood;
    if (m > 0) { const e = U.ease.outCubic(m), bh = 44 * e; g.save(); g.fillStyle = 'rgba(20,10,30,' + (.2 * e) + ')'; g.fillRect(0, 0, 960, 540); g.fillStyle = 'rgba(10,5,20,.92)'; g.fillRect(0, 0, 960, bh); g.fillRect(0, 540 - bh, 960, bh); g.restore(); }
    if (tr) {
      const p = tr.ph === 0 ? Math.min(1, tr.t / tr.dc) : 1 - Math.min(1, tr.t / tr.do), e = U.ease.inOut(p), r = 720 * (1 - e) + 1;
      if (tr.fast) { g.save(); g.globalAlpha = Math.min(1, e * 1.05); g.fillStyle = IRIS; g.fillRect(-60, -60, 1080, 660); g.restore(); return; }   // low quality / reduced motion: plain fade (no radial gradient, no glow pass)
      g.save(); g.globalAlpha = Math.min(1, .35 + e * .75); const ig = g.createRadialGradient(tr.cx, tr.cy, Math.max(0, r - 34), tr.cx, tr.cy, r + 26); ig.addColorStop(0, 'rgba(42,27,61,0)'); ig.addColorStop(1, IRIS); g.fillStyle = ig; g.fillRect(-60, -60, 1080, 660);
      if (e < .98) { g.globalAlpha = .25 * (1 - e); const gs = G.glowSprite('255,230,170'); g.globalCompositeOperation = 'lighter'; g.drawImage(gs, tr.cx - r * 1.08, tr.cy - r * 1.08, r * 2.16, r * 2.16); }
      g.restore();
    }
  };
  /* contact shadows of all visible actors, drawn in ONE pass before the actors: soft sprite (high/medium) or a single flat batched path (low).
     Soft shadow is offset away from the room's key light and shrinks while jumping. */
  P.drawShadows = function (g, hs) {
    if (!FX.shadows) return; const m = this._cur || LOOK.def, lx = (m.lightX || 480), k = m.shadow == null ? 1 : m.shadow, flat = FX.shadowMode === 'flat';
    if (flat) {
      g.save(); g.fillStyle = 'rgba(40,22,8,' + (.26 * k).toFixed(3) + ')'; g.beginPath();
      for (let i = 0; i < hs.length; i++) { const h = hs[i]; if (!h.visible || h.x < -120 || h.x > 1080) continue; const sc = h.sc * (1 / (1 + h.jy / 220)), w = 50 * sc, hh = 12 * sc; g.moveTo(h.x + w, h.y + 2); g.ellipse(h.x, h.y + 2, w, hh, 0, 0, 6.2832); }
      g.fill(); g.restore(); return;
    }
    const spr = G.shadowSprite(); let ga = 1;
    for (let i = 0; i < hs.length; i++) {
      const h = hs[i]; if (!h.visible || h.x < -120 || h.x > 1080) continue; const sc = h.sc * (1 / (1 + h.jy / 220)), w = 112 * sc, hh = 40 * sc, ox = U.clamp((h.x - lx) * .035, -14, 14) * sc, a = (.95 * k) / (1 + h.jy / 160);
      if (a !== ga) { g.globalAlpha = a; ga = a; } g.drawImage(spr, h.x - w / 2 + ox, h.y - hh * .42, w, hh);
    }
    if (ga !== 1) g.globalAlpha = 1;
  };
  /* ---- glows (what can I tap?) ---- */
  P.addGlow = function (x, y, r, col) { const o = { x, y, r: r || 40, col: col || '255,236,150' }; this.glows.push(o); const me = this; return () => { const i = me.glows.indexOf(o); if (i >= 0) me.glows.splice(i, 1); }; };
  P.drawGlow = function (g, x, y, r, t, i, col) {
    const p = .5 + .5 * Math.sin(t * 3 + i * 1.3), rr = r * (1.05 + .14 * p); g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .32 + .28 * p; g.drawImage(G.glowSprite(col || '255,236,150'), x - rr * 1.5, y - rr * 1.5, rr * 3, rr * 3); g.restore();
    g.save(); g.lineWidth = 3; g.strokeStyle = 'rgba(255,248,200,' + (.75 - .35 * p) + ')'; g.beginPath(); g.arc(x, y, r * (.86 + .2 * p), 0, 6.2832); g.stroke(); g.restore();
  };
  P.drawGlows = function (g) {
    if (!FX.glow) return; const t = FX.motion ? this.t : 0, d = this.dbg;
    for (let i = 0; i < this.glows.length; i++) { const o = this.glows[i]; this.drawGlow(g, o.x, o.y, o.r, t, i, o.col); }
    if (d && d.kit === 'dragdrop' && d.items) { for (let i = 0; i < d.items.length; i++) { const it = d.items[i]; if (it && it.x != null && !it.held) this.drawGlow(g, it.x, it.y, 38, t, i); } }
    else if (d && d.kit === 'hidden' && d.spots && d.spots.length && this.idleT > 12) { const sp = d.spots[0]; this.drawGlow(g, sp.x, sp.y, 40, t, 0); }
  };
  /* ---- reward / discovery effects ---- */
  P.sparkle = function (x, y, o) {
    o = o || {}; const n = Math.max(2, Math.round((o.n || 12) * (FX.parts || 1))), cols = o.cols || ['#fff6a8', '#ffe27a', '#ffffff', '#ffc4e0', '#bfe8ff'];
    for (let i = 0; i < n && this.parts.length < 400 * (FX.parts || 1); i++) { const a = U.rnd(0, 6.283), sp = U.rnd(30, o.spread || 150); this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30, g: -20, life: 0, max: U.rnd(.7, 1.4), kind: 'spark', col: U.pick(cols), s: U.rnd(3, 7) * (o.size || 1), rot: 0, vr: U.rnd(-3, 3) }); }
    this.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: .6, kind: 'ring', col: '#fff3b0', s: o.ring || 46, rot: 0, vr: 0 });
    this.parts.push({ x, y, vx: 0, vy: 0, g: 0, life: 0, max: .5, kind: 'glow', col: '', s: o.glow || 60, rot: 0, vr: 0 });
  };
  P.reward = function (x, y) { this.sparkle(x, y, { n: 16, spread: 190 }); this.burst(x, y, { n: 8, kind: 'star', min: 60, max: 180 }); };
  /* door-open reveal hook: swings two leaves open over a warm light, e.g. stage.doorOpen(x,y,w,h,{col:'#8a5a3a', light:'255,226,140'}).then(...) */
  P.doorOpen = function (x, y, w, h, o) {
    o = o || {}; const me = this, col = o.col || '#a0643a', dur = o.dur || .9; let t = 0, rm; return new Promise(res => {
      rm = this.addLayer({ z: 5, update(dt) { t += dt; if (t >= dur + (o.hold || .5)) { rm(); res(); } }, draw(g) {
        const p = U.ease.outCubic(Math.min(1, t / dur)), a = Math.min(1, (dur + (o.hold || .5) - t) * 3), lw = w / 2 * (1 - p * .92);
        g.save(); g.globalAlpha = a; g.beginPath(); g.rect(x, y, w, h); g.clip(); const gr = g.createLinearGradient(0, y, 0, y + h); gr.addColorStop(0, 'rgba(' + (o.light || '255,240,180') + ',.95)'); gr.addColorStop(1, 'rgba(' + (o.light || '255,226,140') + ',.75)'); g.fillStyle = gr; g.fillRect(x, y, w, h);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = a * p * .6; g.drawImage(G.glowSprite(o.light || '255,226,140'), x - w * .4, y - h * .1, w * 1.8, h * 1.2); g.globalCompositeOperation = 'source-over'; g.globalAlpha = a;
        G.fillRR(g, x, y, lw, h, 2, col, 2.5); G.fillRR(g, x + w - lw, y, lw, h, 2, col, 2.5); g.restore();
      } });
    });
  };
  P.draw = function (g, t) {
    g.save();
    if (this.shakeA > 0) g.translate(U.rnd(-1, 1) * this.shakeA, U.rnd(-1, 1) * this.shakeA);
    const z = this.zoom; if (z !== 1) { const cx = this.tr ? this.tr.cx : 480, cy = this.tr ? this.tr.cy : 270; g.translate(cx, cy); g.scale(z, z); g.translate(-cx, -cy); }
    this.drawBg(g);
    for (const l of this.layers) if (l.z < 0 && l.draw) l.draw(g, this.t, this);
    const hs = this._hs || (this._hs = []); hs.length = 0; for (const k in this.heroes) hs.push(this.heroes[k]); hs.sort((a, b) => a.y - b.y);
    DF++; let nVis = 0; for (let i = 0; i < hs.length; i++) if (hs[i].visible) nVis++;
    if (nVis >= 3 && (FX.idleEvery > 1 || nVis >= 8) && DF % 30 === 0) {   // adaptive crowd LOD: frame time (EMA, core.js) > 21 ms -> background actors one step less often (max +6); < 17.4 ms (full 60 fps) -> one step back
      const ms = Q.perf.ms; if (ms > 21 && (this.ie | 0) < 6) this.ie = (this.ie | 0) + 1; else if (ms < 17.4 && this.ie > 0) this.ie--;
    }
    this.drawShadows(g, hs)
    for (let i = 0; i < hs.length; i++) {
      const h = hs[i];
      if (h.visible && this.showActive && h.id === this.active && this.control.length > 1 && this.control.every(k => this.heroes[k].visible)) {
        g.save(); g.globalAlpha = .5 + .2 * Math.sin(this.t * 5); G.ell(g, h.x, h.y + 2, 38 * h.sc, 10 * h.sc, h.id === 'moody' ? '#ffc93c' : '#4aa8e8', 0); g.restore();
      }
      this.drawHero(g, h, i, nVis);
    }
    this.drawNear(g); this.drawGlows(g);
    for (const l of this.layers) if (l.z >= 0 && l.z < 50 && l.draw) l.draw(g, this.t, this);
    for (const p of this.parts) {
      const a = 1 - p.life / p.max; g.save(); g.globalAlpha = Math.max(0, Math.min(1, a * 2)); g.translate(p.x, p.y); g.rotate(p.rot);
      if (p.kind === 'star') G.star(g, 0, 0, p.s * 1.4, p.col, 1.5); else if (p.kind === 'spark') G.sparkle(g, 0, 0, p.s * 1.3, p.col === '#ffc93c' ? '#fff6a8' : p.col);
      else if (p.kind === 'heart') G.heart(g, 0, 0, p.s * .8, '#ff5a7a', 1.5); else if (p.kind === 'drop') G.circ(g, 0, 0, p.s * .6, p.col, 0);
      else if (p.kind === 'ring') { const u = p.life / p.max; g.globalAlpha = Math.max(0, 1 - u); g.lineWidth = 3.5 * (1 - u) + .5; g.strokeStyle = p.col; g.beginPath(); g.arc(0, 0, 8 + u * p.s, 0, 6.2832); g.stroke(); }
      else if (p.kind === 'glow') { const u = p.life / p.max, r = p.s * (.5 + u); g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.max(0, 1 - u) * .8; g.drawImage(G.glowSprite('255,240,170'), -r, -r, r * 2, r * 2); }
      else { g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); }
      g.restore();
    }
    for (const h of hs) this.drawBubble(g, h);
    for (const l of this.layers) if (l.z >= 50 && l.draw) l.draw(g, this.t, this);
    for (const f of this.floats) { g.save(); g.globalAlpha = Math.max(0, 1 - f.t / 1.2); G.text(g, f.text, f.x, f.y - f.t * 60, { size: f.size, color: f.col, stroke: '#fff', sw: 6 }); g.restore(); }
    if (this.flashA > 0) { g.globalAlpha = this.flashA; g.fillStyle = this.flashC; g.fillRect(-20, -20, 1000, 580); g.globalAlpha = 1; }
    g.restore();
    this.drawOverlay(g);
  };
  /* pointer routing: kit input first, otherwise tapping a hero switches it */
  /* tap reaction for actors drawn through impostors (chars.js only reacts to actors it drew itself this/last frame; a duplicate call is a no-op thanks to chars' own cooldown) */
  P.tapReact = function (x, y) {
    const C = M.chars; if (!C || !C.react || C.autoTap === false || M.paused) return; let best = null;
    for (const k in this.heroes) { const h = this.heroes[k]; if (!h.visible || h.fa || h.tx != null || h.carry || this.cast.indexOf(k) < 0) continue; const hh = C.height(k) * h.sc; if (Math.abs(x - h.x) < 36 * h.sc + 6 && y < h.y + 8 && y > h.y - hh - 6 && (!best || h.y > best.y)) best = h; }
    if (best && C.react(best.id) && C.focus) { C.focus.x = x; C.focus.y = best.y - 90 * best.sc; C.focus.until = performance.now() / 1000 + 2.2; C.focus.id = best.id; }
  };
  P.down = function (x, y, id, e) {
    this.idleT = 0; if (this.tr) { this.skipTr(); return; }
    if (!this.input) this.tapReact(x, y);
    if (this.input && this.input.down && this.input.down(x, y, id, e)) return;
    for (const k of this.control) { const h = this.heroes[k]; if (!h.visible || k === this.active) continue; const hh = M.chars.height(k) * h.sc; if (Math.abs(x - h.x) < 40 && y < h.y + 6 && y > h.y - hh - 10) { this.setActive(k); return; } }
  };
  P.move = function (x, y, id, e) { if (this.input && this.input.move) this.input.move(x, y, id, e); };
  P.up = function (x, y, id, e) { if (this.input && this.input.up) this.input.up(x, y, id, e); };

  M.Stage = Stage;
})();
