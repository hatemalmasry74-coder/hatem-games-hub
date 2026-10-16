/* Moody & Aboody - engine/stage.js
   The Stage is the canvas scene used by every mission: background drawer, layers (kits draw here),
   the two heroes (always present), particles, bubbles. Missions normally talk to it through ctx. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, U = M.util;

  function Stage() {
    this.t = 0; this.bg = null; this.layers = []; this.parts = []; this.floats = []; this.state = {};
    this.shakeA = 0; this.flashC = null; this.flashA = 0; this.input = null; this.showActive = true; this.floorY = 480; this.dbg = null;
    this.active = M.save.data.hero || 'moody'; this.onSwitch = null;
    this.heroes = { moody: this.mkHero('moody', 300, 480), aboody: this.mkHero('aboody', 430, 492) };
    ['toota', 'nemo', 'nana', 'baba'].forEach(k => { this.heroes[k] = this.mkHero(k, 200, 480); this.heroes[k].visible = false; });
    this.cast = ['moody', 'aboody']; this.control = ['moody', 'aboody']; this.abil = {};
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
    this._lay = name; const m = this.heroes.moody, a = this.heroes.aboody, fy = this.floorY, ex = ['toota', 'nemo', 'nana', 'baba'].map(k => this.heroes[k]);
    const reset = h => { h.visible = true; h.sc = 1; h.tx = null; h.fa = null; h.carry = null; h.jy = 0; };
    [m, a].concat(ex).forEach(reset);
    if (name && typeof name === 'object') {
      for (const k in name) { const h = this.heroes[k]; if (!h) continue; Object.assign(h, name[k]); h.hx = h.x; h.hy = h.y; h.visible = name[k].visible !== false; }
      ['toota', 'nemo', 'nana', 'baba'].forEach((k, i) => { if (!(k in name)) this.placeExtra(k, 'floor'); });
    } else {
      if (name === 'hidden') { [m, a].concat(ex).forEach(h => { h.visible = false; }); }
      else if (name === 'corner') { m.x = 62; m.y = 532; a.x = 898; a.y = 532; m.sc = a.sc = .62; a.dir = -1; m.dir = 1; }
      else if (name === 'bottom') { m.x = 330; m.y = 528; a.x = 440; a.y = 534; m.sc = a.sc = .72; m.dir = 1; a.dir = -1; }
      else { m.x = 320; m.y = fy; a.x = 450; a.y = fy + 10; m.dir = 1; a.dir = -1; }
      m.hx = m.x; m.hy = m.y; a.hx = a.x; a.hy = a.y;
      ['toota', 'nemo', 'nana', 'baba'].forEach(k => this.placeExtra(k, name));
    }
    if (name !== 'hidden') Object.keys(this.heroes).forEach(k => { if (this.cast.indexOf(k) < 0) this.heroes[k].visible = false; });
  };
  P.placeExtra = function (k, name) {
    const h = this.heroes[k], fy = this.floorY; if (!h) return;
    const slot = { toota: [200, fy + 4, 1], nemo: [120, fy + 12, 1], nana: [560, fy + 2, -1], baba: [640, fy + 2, -1] }[k], cor = { toota: [128, 534, 1], nemo: [832, 534, -1], nana: [200, 534, 1], baba: [760, 534, -1] }[k];
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
    o = o || {}; const n = o.n || 14, cols = o.cols || ['#ffc93c', '#ff6f91', '#4aa8e8', '#5cc96b', '#ff8a2a', '#8a6bd6'];
    for (let i = 0; i < n && this.parts.length < 400; i++) {
      const a = U.rnd(0, 6.283), sp = U.rnd(o.min || 80, o.max || 260);
      this.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 80), g: o.g == null ? 520 : o.g, life: 0, max: U.rnd(.6, 1.2), kind: o.kind || 'conf', col: o.col || U.pick(cols), s: U.rnd(4, 8) * (o.size || 1), rot: U.rnd(0, 6), vr: U.rnd(-8, 8) });
    }
  };
  P.confetti = function () { for (let i = 0; i < 40; i++) this.parts.push({ x: U.rnd(0, 960), y: U.rnd(-60, -5), vx: U.rnd(-40, 40), vy: U.rnd(60, 160), g: 40, life: 0, max: U.rnd(2.5, 4), kind: 'conf', col: U.pick(['#ffc93c', '#ff6f91', '#4aa8e8', '#5cc96b', '#ff8a2a', '#8a6bd6']), s: U.rnd(5, 9), rot: U.rnd(0, 6), vr: U.rnd(-6, 6) }); };

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
  };

  P.heroAnim = function (h) { return h.fa || (h.tx != null ? 'walk' : (h.anim || 'idle')); };
  P.drawHero = function (g, h) {
    if (!h.visible) return; const eq = M.save.data.cosm.eq[h.id] || {};
    M.chars.draw(g, h.id, h.x, h.y - h.jy, { anim: this.heroAnim(h), t: h.t, dir: h.dir, sc: h.sc, hat: eq.hat, shirtId: eq.shirt, carry: h.carry, talk: h.talk > 0 });
  };
  P.drawBubble = function (g, h) {
    if (!h.bubble || !h.visible) return; const txt = h.bubble.text, hh = M.chars.height(h.id) * h.sc;
    g.save(); g.font = 'bold 24px ' + M.FONT; const w = Math.min(380, g.measureText(txt).width + 36); g.restore();
    const x = U.clamp(h.x, w / 2 + 8, 952 - w / 2), y = h.y - hh - 44, k = U.ease.outBack(Math.min(1, (h.bubble.age || 0) * 6));
    g.save(); g.translate(x, y); g.scale(k, k);
    G.fillRR(g, -w / 2, -24, w, 48, 20, '#fff', 3.5); G.poly(g, [[-8 + (h.x - x) * .3, 22], [8 + (h.x - x) * .3, 22], [(h.x - x) * .3, 36]], '#fff', 3.5); G.fillRR(g, -8 + (h.x - x) * .3 - 4, 18, 24, 7, 0, '#fff', 0);
    G.text(g, txt, 0, 1, { size: 24, color: M.pal.ink }); g.restore();
  };
  P.draw = function (g, t) {
    g.save();
    if (this.shakeA > 0) g.translate(U.rnd(-1, 1) * this.shakeA, U.rnd(-1, 1) * this.shakeA);
    if (this.bg) this.bg(g, this.t, this);
    for (const l of this.layers) if (l.z < 0 && l.draw) l.draw(g, this.t, this);
    const hs = Object.values(this.heroes).sort((a, b) => a.y - b.y);
    for (const h of hs) {
      if (h.visible && this.showActive && h.id === this.active && this.control.length > 1 && this.control.every(k => this.heroes[k].visible)) {
        g.save(); g.globalAlpha = .5 + .2 * Math.sin(this.t * 5); G.ell(g, h.x, h.y + 2, 38 * h.sc, 10 * h.sc, h.id === 'moody' ? '#ffc93c' : '#4aa8e8', 0); g.restore();
      }
      this.drawHero(g, h);
    }
    for (const l of this.layers) if (l.z >= 0 && l.z < 50 && l.draw) l.draw(g, this.t, this);
    for (const p of this.parts) {
      const a = 1 - p.life / p.max; g.save(); g.globalAlpha = Math.max(0, Math.min(1, a * 2)); g.translate(p.x, p.y); g.rotate(p.rot);
      if (p.kind === 'star') G.star(g, 0, 0, p.s * 1.4, p.col, 1.5); else if (p.kind === 'spark') G.sparkle(g, 0, 0, p.s * 1.3, p.col === '#ffc93c' ? '#fff6a8' : p.col); else if (p.kind === 'heart') G.heart(g, 0, 0, p.s * .8, '#ff5a7a', 1.5); else if (p.kind === 'drop') G.circ(g, 0, 0, p.s * .6, p.col, 0); else { g.fillStyle = p.col; g.fillRect(-p.s / 2, -p.s / 3, p.s, p.s * .66); }
      g.restore();
    }
    for (const h of hs) this.drawBubble(g, h);
    for (const l of this.layers) if (l.z >= 50 && l.draw) l.draw(g, this.t, this);
    for (const f of this.floats) { g.save(); g.globalAlpha = Math.max(0, 1 - f.t / 1.2); G.text(g, f.text, f.x, f.y - f.t * 60, { size: f.size, color: f.col, stroke: '#fff', sw: 6 }); g.restore(); }
    if (this.flashA > 0) { g.globalAlpha = this.flashA; g.fillStyle = this.flashC; g.fillRect(0, 0, 960, 540); g.globalAlpha = 1; }
    g.restore();
  };
  /* pointer routing: kit input first, otherwise tapping a hero switches it */
  P.down = function (x, y, id, e) {
    if (this.input && this.input.down && this.input.down(x, y, id, e)) return;
    for (const k of this.control) { const h = this.heroes[k]; if (!h.visible || k === this.active) continue; const hh = M.chars.height(k) * h.sc; if (Math.abs(x - h.x) < 40 && y < h.y + 6 && y > h.y - hh - 10) { this.setActive(k); return; } }
  };
  P.move = function (x, y, id, e) { if (this.input && this.input.move) this.input.move(x, y, id, e); };
  P.up = function (x, y, id, e) { if (this.input && this.input.up) this.input.up(x, y, id, e); };

  M.Stage = Stage;
})();
