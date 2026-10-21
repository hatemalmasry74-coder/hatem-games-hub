/* Family Adventures - worlds/mystery_kits.js : two kits + gentle sounds for WORLD 12 "لغز البيت القديم".
   ctx.games.mysFlash({prompt, spots:[{id, art, x, y, s, r, draw(g,t,st,spot), onFound(spot)}], radius, dim, hintAfter, start, heroes}) -> {found, hints}
        A big FLASHLIGHT: the child drags a finger / moves the mouse (the beam follows, smoothly) over a softly dimmed scene; cute hidden things appear inside the beam and are "found" after the beam rests
        on them for ~0.7 s OR when they are tapped.  The dimness is only a soft dusk veil (never black) and the hidden things are friendly.  Nobody gets stuck: after `hintAfter` s (default 10) a
        twinkling ring marks the next one, after ~2x that the beam drifts there by itself, and the usual skip button appears after 45 s.
        Bot hooks: Moody.scene.dbg = {kit:'hidden', mys:'flash', spots:[{id,x,y}], beam:{x,y}} (the stock bot taps the first spot).
   ctx.games.mysTune({prompt, rounds:[[0,1,2],[2,0,3,1]], who}) -> {misses}   a music box with 4 colour gems: it plays a tune, the child repeats it (simon). After 2 mistakes the next gem glows.
        Bot hooks: Moody.scene.dbg = {kit:'cheer', mys:'tune', ready:[{x,y}] (the next gem, empty while the tune plays)}.
   Moody.mys.snd(name) : soft synthesised sounds  tap (loose shutter) meow tick (clock) owl wind creak music chime  - always quiet, never sudden. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, UI = M.ui, K = M.kits, h = UI.h;

  /* ---------------- gentle sounds ---------------- */
  const SND = {
    tap() { const T = M.audio.tone; [0, .26, 1.0, 1.24].forEach(d => T(170, .09, 'triangle', .11, 110, d)); },
    meow() { const T = M.audio.tone; T(560, .24, 'sine', .1, 820); T(800, .34, 'sine', .09, 460, .22); },
    tick() { const T = M.audio.tone; for (let i = 0; i < 5; i++) T(i % 2 ? 760 : 920, .05, 'triangle', .07, 0, i * .5); },
    owl() { const T = M.audio.tone; T(400, .32, 'sine', .12, 340); T(350, .5, 'sine', .12, 290, .5); },
    wind() { M.audio.noise(1.3, .05, 260, 640); M.audio.noise(1.0, .04, 520, 300, 1.2); },
    creak() { M.audio.tone(150, .5, 'sawtooth', .03, 105); },
    chime() { [784, 988, 1175].forEach((f, i) => M.audio.tone(f, .6, 'sine', .1, 0, i * .18)); },
    music() { [784, 880, 988, 880, 784, 659].forEach((f, i) => { M.audio.tone(f, .5, 'triangle', .1, 0, i * .32); M.audio.tone(f * 2, .4, 'sine', .035, 0, i * .32); }); }
  };
  M.mys = { snd(n) { try { M.audio.init(); if (M.audio.on() && SND[n]) SND[n](); } catch (e) { } }, sounds: Object.keys(SND) };

  /* ================= FLASHLIGHT ================= */
  K.mysFlash = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), R = o.radius || 120, dimA = o.dim == null ? .5 : o.dim, hintAfter = o.hintAfter || 10;
    const spots = o.spots.map(s => Object.assign({ s: 64, r: 62, found: false, prog: 0, vis: 0, sc: 1, t0: Math.random() * 6 }, s));
    let bx = o.start ? o.start[0] : 480, by = o.start ? o.start[1] : 300, tx = bx, ty = by, idle = 0, busy = false, finished = false, hints = 0, hintShown = false, closed = false, touch = false;
    if (o.prompt) ctx.prompt(o.prompt); if (o.heroes) ctx.heroes(o.heroes);
    const lite = M.quality && M.quality.level === 'low', oc = G.mkCanvas(lite ? 320 : 480, lite ? 180 : 270), ox = oc.getContext('2d');
    const next = () => spots.find(s => !s.found);
    const aim = (x, y, e) => { touch = !!(e && e.pointerType && e.pointerType !== 'mouse'); tx = U.clamp(x, 10, 950); ty = U.clamp(y - (touch ? 34 : 0), 80, 520); idle = 0; hintShown = false; };
    async function reveal(s) {
      if (s.found || busy || closed) return; busy = true; s.found = true; idle = 0; sk.poke(); hintShown = false;
      ctx.sfx('good'); st.burst(s.x, s.y, { n: 12, kind: 'star', max: 200 }); st.sparkle && st.sparkle(s.x, s.y, { n: 10 });
      M.tw(s, { sc: 1.22 }, .22, 'outCubic').then(() => M.tw(s, { sc: 1 }, .25, 'inOut')).catch(() => { });
      try { if (s.onFound) await s.onFound(s); } catch (e) { if (e && e.abort) return; }
      busy = false; idle = 0;
      if (!finished && spots.every(x => x.found || x.optional)) { finished = true; await M.wait(.35); ctx.react('good', 'both'); await M.wait(.7); if (!closed) done({ found: spots.length, hints }); }
    }
    st.input = {
      down(x, y, id, e) {
        aim(x, y, e); if (touch) { bx = tx; by = ty; } sk.poke(); if (busy) return true;
        let best = null, bd = 1e9; spots.forEach(s => { if (s.found) return; const d = U.dist(x, y, s.x, s.y + (s.hy || 0)); if (d < Math.max(54, s.r * .9) && d < bd) { best = s; bd = d; } });
        if (best) { tx = best.x; ty = best.y; reveal(best); }
        return true;
      },
      move(x, y, id, e) { aim(x, y, e); },
      up() { }
    };
    cl(() => { closed = true; if (st.input) st.input = null; st.dbg = null; });
    cl(st.addLayer({   // the hidden things (appear inside the beam)
      z: 3, update(dt) {
        if (busy) return; idle += dt; const n = next();
        bx += (tx - bx) * Math.min(1, dt * 12); by += (ty - by) * Math.min(1, dt * 12);
        if (n && idle > hintAfter * 2.2) { const dx = n.x - tx, dy = (n.y - 10) - ty, d = Math.hypot(dx, dy) || 1, sp = Math.min(d, 150 * dt); tx += dx / d * sp; ty += dy / d * sp; }   // the beam drifts to the next friend by itself
        if (n && idle > hintAfter && !hintShown) { hintShown = true; hints++; st.bubble(st.active, o.hintText || 'بصّوا! فيه حاجة بتلمع هناك', 2.8); }
        spots.forEach(s => {
          if (s.found) { s.vis += (1 - s.vis) * Math.min(1, dt * 8); return; }
          const d = U.dist(bx, by, s.x, s.y + (s.hy || 0)), tv = d < R ? 1 - Math.max(0, (d - R * .55) / (R * .45)) : 0;
          s.vis += (tv - s.vis) * Math.min(1, dt * 9);
          if (d < s.r) s.prog += dt / .7; else s.prog = Math.max(0, s.prog - dt * 2);
          if (s.prog >= 1) reveal(s);
        });
        const nn = next(); st.dbg = { kit: 'hidden', mys: 'flash', spots: spots.filter(s => !s.found).map(s => ({ id: s.id, x: s.x, y: s.y + (s.hy || 0), needs: null, hero: null })), beam: { x: bx, y: by }, busy, first: nn ? nn.id : null };
      },
      draw(g, t) {
        spots.forEach(s => {
          const a = s.found ? 1 : s.vis; if (a < .03) return; g.save(); g.globalAlpha = Math.min(1, a); g.translate(s.x, s.y);
          if (s.draw) s.draw(g, t, st, s); else if (s.art) A.draw(g, s.art, 0, Math.sin(t * 2 + s.t0) * 2, s.s * s.sc);
          if (!s.found && s.prog > .02) { g.globalAlpha = .9; g.lineWidth = 6; g.strokeStyle = '#ffe28a'; g.beginPath(); g.arc(0, 0, s.s * .6 + 6, -1.57, -1.57 + 6.283 * Math.min(1, s.prog)); g.stroke(); }
          g.restore();
        });
      }
    }));
    cl(st.addLayer({   // the soft dusk veil with a round hole of light
      z: 4, draw(g, t) {
        const W = oc.width, H = oc.height, k = W / 960; ox.globalCompositeOperation = 'source-over'; ox.clearRect(0, 0, W, H); ox.fillStyle = 'rgba(22,12,56,' + dimA + ')'; ox.fillRect(0, 0, W, H);
        ox.globalCompositeOperation = 'destination-out'; const gr = ox.createRadialGradient(bx * k, by * k, 0, bx * k, by * k, R * k); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(.55, 'rgba(0,0,0,.96)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); ox.fillStyle = gr; ox.beginPath(); ox.arc(bx * k, by * k, R * k, 0, 6.2832); ox.fill();
        g.drawImage(oc, 0, 0, 960, 540);
        g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = .34 + .04 * Math.sin(t * 3); g.drawImage(G.glowSprite('255,236,170'), bx - R * .9, by - R * .9, R * 1.8, R * 1.8); g.restore();
      }
    }));
    cl(st.addLayer({   // twinkling hint (above the veil) + the torch itself
      z: 5, draw(g, t) {
        const n = next(); if (n && idle > hintAfter && !busy) { const p = .5 + .5 * Math.sin(t * 5); g.save(); g.globalAlpha = .55 + .4 * p; g.lineWidth = 5; g.strokeStyle = '#fff3a0'; g.setLineDash([9, 9]); g.beginPath(); g.arc(n.x, n.y, 40 + p * 8, t * 1.5, t * 1.5 + 6.283); g.stroke(); g.setLineDash([]); G.sparkle(g, n.x + 26, n.y - 30, 9 + p * 4, '#fff6a8', .95); G.sparkle(g, n.x - 30, n.y - 18, 6 + p * 3, '#fff6a8', .8); g.restore(); }
        g.save(); g.translate(bx + 70, by + 78); g.rotate(.15); g.globalAlpha = .96; A.draw(g, 'mys_torch', 0, 0, 78); g.restore();
      }
    }));
  };

  /* ================= MUSIC BOX TUNE ================= */
  K.mysTune = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), rounds = o.rounds || [[0, 1, 2], [2, 0, 3, 1]], NOTES = [784, 880, 988, 1175], GX = [270, 400, 560, 690], GY = 392;
    let ri = 0, pos = 0, busy = true, closed = false, misses = 0, lit = -1, spin = 0, playing = false;
    if (o.prompt) ctx.prompt(o.prompt); ctx.heroes('corner');
    const light = i => { lit = i; M.audio.init(); M.audio.tone(NOTES[i], .55, 'triangle', .13); M.audio.tone(NOTES[i] * 2, .45, 'sine', .04); st.burst(GX[i], GY - 40, { n: 4, kind: 'spark', max: 120 }); setTimeout(() => { if (lit === i) lit = -1; }, 380); };
    async function demo() {
      busy = true; pos = 0; playing = true; await M.wait(.7); if (closed) return;
      for (const n of rounds[ri]) { if (closed) return; light(n); await M.wait(.7); }
      playing = false; busy = false; if (!closed && o.again) ctx.prompt(o.again);
    }
    async function press(i) {
      if (busy || closed) return; sk.poke(); light(i); const pat = rounds[ri];
      if (i === pat[pos]) {
        pos++;
        if (pos >= pat.length) {
          busy = true; ctx.sfx('good'); ctx.react('good', 'both'); st.burst(480, 230, { n: 14, kind: 'star' }); ri++; await M.wait(1); if (closed) return;
          if (ri >= rounds.length) { M.mys.snd('music'); await M.wait(1.2); if (!closed) done({ misses }); return; }
          if (o.prompt) ctx.prompt(o.prompt); demo();
        }
      } else { misses++; busy = true; sk.fail(); ctx.sfx('wrong'); st.bubble(o.who || st.active, 'نسمع اللحن تاني وبالراحة', 2); await M.wait(1.4); if (closed) return; demo(); }
    }
    st.input = { down(x, y) { for (let i = 0; i < 4; i++) if (U.dist(x, y, GX[i], GY) < 62) { press(i); return true; } return false; } };
    const bar = h('div', { class: 'bar2' }, UI.btn('اسمع اللحن تاني', 'teal', () => { if (!busy && !closed) { sk.poke(); demo(); } }, 'replay')); UI.over.append(bar);
    cl(() => { closed = true; bar.remove(); st.input = null; st.dbg = null; });
    cl(st.addLayer({
      z: 6, update(dt) {
        spin += dt * (playing ? 5 : 1.2); const n = rounds[ri] && rounds[ri][pos];
        st.dbg = { kit: 'cheer', mys: 'tune', ready: busy || n == null ? [] : [{ x: GX[n], y: GY }], next: busy ? -1 : n, busy, lit, ri };
      },
      draw(g, t) {
        // the music box with a turning star
        g.save(); g.translate(480, 196); A.draw(g, 'mys_musicbox:open', 0, 6, 150); g.save(); g.translate(0, -62); g.rotate(Math.sin(spin) * .5); G.star(g, 0, 0, 12, '#ffe14d', 2); g.restore();
        if (playing || lit >= 0) for (let i = 0; i < 3; i++) { const u = (t * .6 + i / 3) % 1; g.globalAlpha = 1 - u; A.draw(g, 'mys_note', -50 + i * 50, -70 - u * 60, 28); } g.restore();
        // pattern dots
        const pat = rounds[ri] || []; for (let i = 0; i < pat.length; i++) { const x = 480 + (i - (pat.length - 1) / 2) * 30; G.circ(g, x, 306, 9, i < pos ? '#ffd23c' : 'rgba(255,255,255,.7)', 3); }
        // gems
        const next = rounds[ri] && rounds[ri][pos];
        for (let i = 0; i < 4; i++) {
          const on = lit === i, hint = !busy && misses >= 2 && next === i, sc = on ? 1.2 : hint ? 1 + .08 * Math.sin(t * 7) : 1;
          g.save(); g.translate(GX[i], GY); if (on || hint) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = .7; g.drawImage(G.glowSprite('255,240,170'), -80, -80, 160, 160); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; }
          G.ell(g, 0, 30, 52, 14, 'rgba(40,20,10,.25)', 0); G.circ(g, 0, 0, 48, '#fff7e3', 4.5); G.circ(g, 0, 0, 40, 'rgba(255,255,255,.5)', 0); A.draw(g, 'mys_gem:' + i, 0, 2, 72 * sc); g.restore();
        }
      }
    }));
    demo();
  };
})();
