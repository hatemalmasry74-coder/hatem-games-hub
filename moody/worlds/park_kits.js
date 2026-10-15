/* Moody & Aboody - worlds/park_kits.js : shared kits + shared props + helpers for WORLD 5 (park) and WORLD 6 (sea).
   Must be loaded BEFORE park_art.js / park.js / sea_art.js / sea.js.
   Kits added (ctx.games.<name>): pkSwing, pkKick, pkWater, pkPairs, pkCount.   Shared art: pk_kid pk_hat pk_sunscreen pk_wbottle pk_glasses pk_coat
   pk_bin pk_pbottle pk_pbag pk_can pk_wrapper pk_core pk_tile.   Helpers: Moody.pk.pair / Moody.pk.card / Moody.pk.words */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, UI = M.ui, K = M.kits, h = UI.h, ico = UI.ico, OL = M.OL;
  const COLS = { red: '#ef5350', blue: '#4a8dff', pink: '#ff6f91', green: '#5cc96b', yellow: '#ffc93c', purple: '#8a6bd6', orange: '#ff8a2a', teal: '#1fb5a6', white: '#ffffff', navy: '#26396e', gray: '#9ea4ab' };
  M.pkColors = COLS;

  /* ---------- css for the new kits (injected, no external files) ---------- */
  try {
    const st = document.createElement('style'); st.id = 'pkcss';
    st.textContent = '.mchbox{position:absolute;left:70px;right:70px;top:86px;padding:12px 16px;display:flex;gap:18px;z-index:4;animation:popin .3s}' +
      '.mcol{flex:1;display:flex;flex-direction:column;gap:10px}' +
      '.mch{font:bold 26px Tahoma,Arial,sans-serif;color:#3a2a1e;min-height:76px;border-radius:22px;border:4px solid #4a2e1c;border-bottom-width:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;padding:4px 10px;line-height:1.15}' +
      '.mch.sel{background:#ffe9a0;transform:translateY(-3px)}.mch.ok{background:#c9f5cf;opacity:.75;pointer-events:none}.mch.glow{animation:pulse .8s infinite}.mch.shk{animation:shake .4s}' +
      '.pkcnt{position:absolute;left:50%;top:200px;transform:translateX(-50%);z-index:4;font-size:96px!important;min-width:230px;min-height:170px;animation:pulse 1.4s infinite}' +
      '@media print{body *{visibility:hidden}#cert,#cert *{visibility:visible}#cert{position:fixed!important;left:0!important;top:0!important;width:100vw!important;height:100vh!important;transform:none!important;box-shadow:none!important}#cert .noprint{display:none!important}}';
    document.head.appendChild(st);
  } catch (e) { }

  /* ---------- helpers ---------- */
  const W = ['صفر', 'واحد', 'اتنين', 'تلاتة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'تمانية', 'تسعة', 'عشرة', 'حداشر', 'اتناشر'];
  /* picks a tier-6 question for Aboody + a tier-9 question for Moody (filtered by tag/category) and runs the pair puzzle */
  M.pk = {
    words: W,
    pair(ctx, o) {
      o = o || {};
      const q6 = M.pickQuestions({ tier: 6, cat: o.cat, tag: o.tag, n: 1 })[0], q9 = M.pickQuestions({ tier: 9, cat: o.cat, tag: o.tag, n: 1 })[0];
      return ctx.quiz.pair({ aboody: q6, moody: q9 });
    },
    /* a drag item drawn as a labelled card: label lines split with '|' */
    card(art, label, o) {
      o = o || {}; const w = o.w || 150, hh = o.h || 84, bg = o.bg || '#fff';
      return (g, it) => {
        G.fillRR(g, -w / 2, -hh / 2, w, hh, 16, bg, 4);
        const lines = String(label || '').split('|');
        if (o.v) { if (art) A.draw(g, art, 0, -hh / 2 + 36, 56); lines.forEach((l, i) => G.text(g, l, 0, hh / 2 - 38 + (lines.length === 1 ? 10 : 0) + i * 20, { size: o.size || 18, color: M.pal.ink })); return; }
        if (art) A.draw(g, art, w / 2 - 34, 0, 56);
        const tx = art ? -w / 2 + (w - 70) / 2 + 6 : 0;
        lines.forEach((l, i) => G.text(g, l, tx, (i - (lines.length - 1) / 2) * 22, { size: o.size || 20, color: M.pal.ink }));
      };
    },
    lerpHex(a, b, k) {
      const p = c => { c = c.replace('#', ''); const n = parseInt(c, 16); return [n >> 16, (n >> 8) & 255, n & 255]; }, x = p(a), y = p(b);
      return 'rgb(' + x.map((v, i) => Math.round(v + (y[i] - v) * k)).join(',') + ')';
    }
  };

  /* ---------- shared props ---------- */
  A.registerAll({
    pk_kid(g, o) {
      const c = COLS[(o.args && o.args[0]) || 'red'] || '#ef5350', skin = (o.args && o.args[1]) === 'd' ? '#c98b5a' : '#f0c090', girl = (o.args && o.args[2]) === 'g';
      G.fillRR(g, -14, 18, 12, 26, 5, '#4a5a8a', 3.5); G.fillRR(g, 2, 18, 12, 26, 5, '#4a5a8a', 3.5);
      G.fillRR(g, -19, 40, 17, 8, 4, '#fff', 3); G.fillRR(g, 2, 40, 17, 8, 4, '#fff', 3);
      G.fillRR(g, -30, -4, 12, 24, 6, skin, 3.5); G.fillRR(g, 18, -4, 12, 24, 6, skin, 3.5);
      if (girl) G.poly(g, [[-18, -6], [18, -6], [26, 26], [-26, 26]], c, 4); else G.fillRR(g, -20, -6, 40, 30, 10, c, 4);
      G.circ(g, 0, -26, 19, skin, 4);
      g.beginPath(); g.arc(0, -30, 19, Math.PI, 0); G.fs(g, girl ? '#7a3a1a' : '#3a2a1e', 3.5);
      if (girl) { G.circ(g, -20, -22, 7, '#7a3a1a', 3); G.circ(g, 20, -22, 7, '#7a3a1a', 3); G.circ(g, 0, -47, 5, '#ff6f91', 2.5); }
      [-7, 7].forEach(x => G.circ(g, x, -24, 2.8, '#2a1a10', 0)); g.beginPath(); g.arc(0, -19, 6, .3, Math.PI - .3); g.lineWidth = 2.6; g.strokeStyle = OL; g.stroke();
    },
    pk_hat(g) { G.ell(g, 0, 12, 46, 14, '#f0c46a', 4); g.beginPath(); g.ellipse(0, 6, 26, 28, 0, Math.PI, 0); G.fs(g, '#f6d68a', 4); G.fillRR(g, -26, 0, 52, 11, 3, '#ef5350', 3); G.line(g, -12, -12, -10, -4, 2.5, '#d9a84a'); G.line(g, 6, -16, 8, -6, 2.5, '#d9a84a'); },
    pk_sunscreen(g) { G.fillRR(g, -10, -42, 20, 16, 4, '#4a8dff', 3.5); G.fillRR(g, -20, -28, 40, 70, 10, '#ffd23c', 4.5); G.circ(g, 0, 0, 12, '#ff8a2a', 3); for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; G.line(g, Math.cos(a) * 15, Math.sin(a) * 15, Math.cos(a) * 20, Math.sin(a) * 20, 3); } G.text(g, 'SPF', 0, 28, { size: 14, color: '#8a5a00' }); },
    pk_wbottle(g) { G.fillRR(g, -10, -42, 20, 14, 4, '#4a8dff', 3.5); G.fillRR(g, -18, -28, 36, 70, 10, 'rgba(200,235,255,.95)', 4.5); G.fillRR(g, -14, -2, 28, 38, 6, '#4aa8e8', 0); G.fillRR(g, -18, -28, 36, 70, 10, null, 4.5); G.line(g, -9, -20, -9, 4, 3, 'rgba(255,255,255,.8)'); },
    pk_glasses(g) { G.line(g, -8, 0, 8, 0, 4); G.fillRR(g, -42, -14, 36, 28, 12, '#3a3f55', 4); G.fillRR(g, 6, -14, 36, 28, 12, '#3a3f55', 4); G.line(g, -40, -4, -48, -10, 4); G.line(g, 40, -4, 48, -10, 4); G.sparkle(g, -30, -6, 5, '#fff', .8); G.sparkle(g, 18, -6, 5, '#fff', .8); },
    pk_coat(g) { G.poly(g, [[-20, -36], [20, -36], [44, -12], [38, 12], [26, 6], [26, 42], [-26, 42], [-26, 6], [-38, 12], [-44, -12]], '#8a6bd6', 4.5); G.fillRR(g, -22, -42, 44, 14, 7, '#fff', 3.5); G.line(g, 0, -28, 0, 42, 3.5); [-6, 8, 22].forEach(y => G.circ(g, 6, y, 3.5, '#ffd23c', 2)); },
    pk_bin(g, o) {
      const c = COLS[(o.args && o.args[0]) || 'green'] || '#5cc96b';
      G.poly(g, [[-30, -18], [30, -18], [24, 42], [-24, 42]], c, 4.5); G.fillRR(g, -36, -30, 72, 14, 6, G.shade(c, -.15), 4.5); G.fillRR(g, -8, -38, 16, 10, 4, G.shade(c, -.15), 3.5);
      [-12, 0, 12].forEach(x => G.line(g, x, -8, x * .8, 32, 3, 'rgba(255,255,255,.35)'));
      if (o.args && o.args[0] === 'blue') { G.poly(g, [[0, 2], [10, 20], [-10, 20]], '#fff', 2.5); }
    },
    pk_pbottle(g) { G.fillRR(g, -7, -44, 14, 10, 3, '#4a8dff', 3); G.poly(g, [[-8, -34], [8, -34], [18, -16], [18, 38], [-18, 38], [-18, -16]], 'rgba(200,235,255,.95)', 4); G.fillRR(g, -18, -6, 36, 22, 0, '#ef5350', 2.5); G.line(g, -12, 28, 12, 28, 3, 'rgba(120,180,230,.8)'); },
    pk_pbag(g) { g.beginPath(); g.moveTo(-26, -20); g.quadraticCurveTo(-34, 10, -22, 38); g.lineTo(24, 38); g.quadraticCurveTo(36, 6, 24, -20); g.closePath(); G.fs(g, 'rgba(255,255,255,.92)', 4); g.beginPath(); g.arc(-14, -26, 12, Math.PI * .1, Math.PI * 1.1, true); g.lineWidth = 4; g.strokeStyle = OL; g.stroke(); g.beginPath(); g.arc(14, -26, 12, Math.PI * -.1, Math.PI * .9, true); g.stroke(); G.line(g, -8, 0, 10, 12, 2.5, '#c9c4d6'); G.line(g, 4, -8, 16, 4, 2.5, '#c9c4d6'); },
    pk_can(g) { G.fillRR(g, -20, -30, 40, 64, 6, '#cfd6e6', 4.5); G.fillRR(g, -20, -10, 40, 24, 0, '#ef5350', 3); G.ell(g, 0, -30, 20, 6, '#e8edf7', 3.5); G.line(g, -6, -30, 6, -30, 3); },
    pk_wrapper(g) { G.poly(g, [[-40, -10], [-20, -22], [-6, -8], [10, -24], [26, -8], [42, -18], [34, 4], [44, 20], [24, 18], [8, 32], [-6, 14], [-24, 28], [-30, 8], [-44, 14]], '#ff9ec0', 4); G.line(g, -12, 0, 14, 2, 3, '#fff'); },
    pk_core(g) { g.beginPath(); g.moveTo(-14, -30); g.quadraticCurveTo(-30, -10, -12, -4); g.quadraticCurveTo(-24, 14, -14, 34); g.lineTo(14, 34); g.quadraticCurveTo(24, 14, 12, -4); g.quadraticCurveTo(30, -10, 14, -30); g.closePath(); G.fs(g, '#f6e8b8', 4); G.fillRR(g, -12, -8, 24, 16, 4, '#8a5a3a', 0); G.line(g, 0, -30, 4, -44, 4, '#6a4a2a'); },
    pk_tile(g, o) { const t = (o.args && o.args[0]) || '؟'; G.fillRR(g, -38, -38, 76, 76, 16, '#fff', 4.5); G.fillRR(g, -32, -32, 64, 64, 12, '#fff3c4', 0); G.text(g, t, 0, 3, { size: t.length > 2 ? 34 : 52, color: '#2b3a67' }); }
  });

  /* ================= PAIRS : tap an item on one side, then its partner on the other ================= */
  K.pkPairs = function (ctx, o, done, cl) {
    const sk = ctx.skipper(done, cl, o); ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    let sel = null, matched = 0, misses = 0, busy = false; const n = o.left.length, all = [];
    const mk = (c, side) => { const b = h('button', { class: 'mch', 'data-k': c.k, 'data-side': side }, c.art ? ico(c.art, c.size || 54) : null, c.label ? h('span', null, M.fmt(c.label)) : null); b.onclick = () => pick(b, c, side); all.push({ b, c, side }); return b; };
    const colL = h('div', { class: 'mcol' }, o.left.map(c => mk(c, 'L'))), colR = h('div', { class: 'mcol' }, U.shuffle(o.right.slice()).map(c => mk(c, 'R')));
    const el = h('div', { class: 'panel mchbox' }, colL, colR); UI.over.append(el); cl(() => el.remove());
    function pick(b, c, side) {
      if (busy || b.classList.contains('ok')) return; sk.poke(); ctx.sfx('tap');
      if (!sel || sel.side === side) { if (sel) sel.b.classList.remove('sel'); sel = { b, c, side }; b.classList.add('sel'); return; }
      const a = sel; sel = null; a.b.classList.remove('sel');
      if (a.c.k === c.k) {
        [a.b, b].forEach(x => x.classList.add('ok')); ctx.sfx('good'); matched++; ctx.stage.burst(480, 300, { n: 8, kind: 'star' });
        if (matched === n) { busy = true; ctx.react('good', 'both'); M.wait(1).then(() => done({ mistakes: misses })); }
      } else {
        misses++; sk.fail(); ctx.sfx('wrong'); [a.b, b].forEach(x => { x.classList.remove('shk'); void x.offsetWidth; x.classList.add('shk'); });
        ctx.stage.bubble(ctx.active, o.wrong || 'قريب! جرّب تاني', 1.6);
        if (misses >= 2) { const p = all.find(z => z.c.k === a.c.k && z.side !== a.side); if (p) p.b.classList.add('glow'); }
      }
    }
    ctx.stage.dbg = { kit: 'pairs' }; cl(() => { ctx.stage.dbg = null; });
  };

  /* ================= COUNT TAP : one big button, tap to count 1..N out loud (hide & seek) ================= */
  K.pkCount = function (ctx, o, done, cl) {
    const st = ctx.stage, target = o.target || 10, who = o.who || 'moody'; let n = 0, fin = false;
    if (o.prompt) ctx.prompt(o.prompt);
    const hh = st.hero(who); hh.fa = 'think'; hh.fat = 9999;
    const b = h('button', { class: 'btn big pink pkcnt' }, U.ar(1)); UI.over.append(b);
    b.onclick = () => {
      if (fin) return; n++; ctx.sfx('pop'); st.bubble(who, W[n] || U.ar(n), 1.2); st.burst(480, 250, { n: 5, kind: 'spark', max: 120 });
      if (n >= target) { fin = true; b.textContent = 'خلّصت!'; b.style.fontSize = '60px'; ctx.sfx('good'); M.wait(1).then(() => done({ n })); } else b.textContent = U.ar(n + 1);
    };
    ctx.stage.dbg = { kit: 'pkcount', get n() { return n; }, target };
    cl(() => { b.remove(); hh.fa = null; hh.fat = 0; ctx.stage.dbg = null; });
  };

  /* ================= SWING : tap to push the swing, count the pushes ================= */
  K.pkSwing = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), goal = o.goal || 5, pusher = o.pusher || 'aboody', other = pusher === 'moody' ? 'aboody' : 'moody';
    st.layout({ [pusher]: { x: 300, y: pusher === 'moody' ? 488 : 496, dir: 1 }, [other]: { x: 860, y: other === 'moody' ? 488 : 496, dir: -1 } });
    if (o.prompt) ctx.prompt(o.prompt);
    let n = 0, ang = .05, vel = 0, last = -9, fin = false, tm = 0; const sx = 560, top = 112, L = 232;
    function push() {
      if (fin || tm - last < .45) return; last = tm; n++; vel += (vel >= 0 ? 1.5 : -1.5); sk.poke(); ctx.sfx('whoosh'); st.play(pusher, 'pickup', .35);
      st.float(U.ar(n), sx - 150, 200, '#ffffff', 70);
      if (n >= goal) { fin = true; M.wait(1.1).then(() => { ctx.react('good', 'both'); done({ n }); }); }
    }
    st.input = { down() { push(); return true; } };
    const kh = e => { if (e.key === ' ') { push(); return true; } return false; }; M.keys.push(kh); cl(() => { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); });
    cl(st.addLayer({
      z: 5,
      update(dt) { tm += dt; vel += (-24 * Math.sin(ang) - .35 * vel) * dt; ang = U.clamp(ang + vel * dt, -.95, .95); st.dbg = { kit: 'pkswing', n, goal }; },
      draw(g, t) {
        // frame
        G.line(g, sx - 150, 470, sx - 90, top, 12); G.line(g, sx + 150, 470, sx + 90, top, 12); G.line(g, sx - 150, 470, sx - 90, top, 7, '#e07a4a'); G.line(g, sx + 150, 470, sx + 90, top, 7, '#e07a4a');
        G.line(g, sx - 100, top, sx + 100, top, 14); G.line(g, sx - 100, top, sx + 100, top, 8, '#ef8a5a');
        const px = sx + Math.sin(ang) * L, py = top + Math.cos(ang) * L;
        G.line(g, sx - 26, top, px - 26, py, 4); G.line(g, sx + 26, top, px + 26, py, 4);
        g.save(); g.translate(px, py); g.rotate(-ang * .3);
        A.draw(g, o.kid || 'pk_kid:orange', 0, -44, 104); G.fillRR(g, -44, -6, 88, 14, 7, '#8a5a3a', 4); g.restore();
        G.text(g, U.ar(n) + ' / ' + U.ar(goal), 130, 160, { size: 54, color: '#fff', stroke: OL, sw: 8 });
        if (n === 0 && tm < 6) G.text(g, 'دوس عشان تزق الأرجوحة!', 250, 250, { size: 28, color: '#fff', stroke: OL, sw: 7 });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; st.layout('floor'); });
  };

  /* ================= KICK : tap a part of the goal to shoot; the goalie is kind (never wins for long) ================= */
  K.pkKick = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), goal = o.goal || 3; let goals = 0, fails = 0, busy = false, fin = false, tm = 0, force = null;
    const zones = [{ x: 385, y: 232 }, { x: 480, y: 232 }, { x: 575, y: 232 }], ball = { x: 500, y: 452, sc: 1 }, gk = { x: 480 };
    st.layout({ moody: { x: 400, y: 486, dir: 1 }, aboody: { x: 330, y: 496, dir: 1 } }); if (o.prompt) ctx.prompt(o.prompt);
    const kicker = st.active;
    async function shoot(z) {
      busy = true; sk.poke(); st.play(kicker, 'jump', .5); ctx.sfx('whoosh');
      const block = fails < 2 && Math.abs(gk.x - z.x) < 58;
      if (!block && fails >= 2) force = { x: z.x < 480 ? 560 : 400 };
      await M.tw(ball, { x: z.x, y: z.y + 8, sc: .55 }, .5, 'outCubic');
      if (block) {
        fails++; sk.fail(); ctx.sfx('wrong'); st.bubble(kicker, 'الحارس مسكها! جرّب ناحية تانية', 1.8);
        await M.tw(ball, { x: 500, y: 452, sc: 1 }, .4, 'outCubic');
      } else {
        goals++; fails = 0; force = null; ctx.sfx('good'); st.burst(z.x, z.y, { n: 16, kind: 'star' }); st.float('جووون!', z.x, z.y - 40, '#ffc93c', 40); st.play('aboody', 'cheer', .9); st.play('moody', 'cheer', .9);
        if (goals >= goal) { fin = true; await M.wait(.9); ctx.react('good', 'both'); done({ goals, fails }); return; }
        await M.wait(.5); await M.tw(ball, { x: 500, y: 452, sc: 1 }, .35, 'outCubic');
      }
      busy = false;
    }
    st.input = { down(x, y) { if (busy || fin) return true; if (y > 370) return true; let best = zones[0], bd = 1e9; zones.forEach(z => { const d = Math.abs(z.x - x); if (d < bd) { bd = d; best = z; } }); shoot(best); return true; } };
    cl(st.addLayer({
      z: 5,
      update(dt) { tm += dt; const tx = force ? force.x : 480 + Math.sin(tm * 1.7) * 92; gk.x += (tx - gk.x) * Math.min(1, dt * (force ? 9 : 6)); st.dbg = { kit: 'pkkick', zones: zones.map(z => ({ x: z.x, y: z.y })), goals, goal, busy }; },
      draw(g, t) {
        // goal
        g.save(); g.beginPath(); g.rect(310, 160, 340, 150); g.clip(); g.fillStyle = 'rgba(40,110,60,.6)'; g.fillRect(310, 160, 340, 150); g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(310, 160, 340, 150); g.strokeStyle = 'rgba(255,255,255,.7)'; g.lineWidth = 2; for (let x = 310; x < 650; x += 22) { g.beginPath(); g.moveTo(x, 160); g.lineTo(x, 310); g.stroke(); } for (let y = 160; y < 310; y += 22) { g.beginPath(); g.moveTo(310, y); g.lineTo(650, y); g.stroke(); } g.restore();
        G.line(g, 310, 310, 310, 160, 10); G.line(g, 310, 160, 650, 160, 10); G.line(g, 650, 160, 650, 310, 10); G.line(g, 310, 310, 310, 160, 5, '#fff'); G.line(g, 310, 160, 650, 160, 5, '#fff'); G.line(g, 650, 160, 650, 310, 5, '#fff');
        A.draw(g, 'pk_kid:orange', gk.x, 258, 112);
        if (!busy && !fin) zones.forEach((z, i) => { g.save(); g.globalAlpha = .8 + .2 * Math.sin(t * 5 + i); G.circ(g, z.x, z.y, 28, 'rgba(255,230,120,.65)', 4, '#fff'); g.restore(); });
        G.ell(g, ball.x, ball.y + 24 * ball.sc, 26 * ball.sc, 7 * ball.sc, 'rgba(60,30,10,.25)', 0); A.draw(g, 'pk_football', ball.x, ball.y, 62 * ball.sc);
        G.text(g, U.ar(goals) + ' / ' + U.ar(goal), 840, 150, { size: 50, color: '#fff', stroke: OL, sw: 8 });
        if (goals === 0 && !busy && tm < 8) G.text(g, 'دوس على جزء من المرمى عشان تشوت!', 480, 128, { size: 28, color: '#fff', stroke: OL, sw: 7 });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; st.layout('floor'); });
  };

  /* ================= WATER PLANTS : drag the can over a pot and hold; don't waste water ================= */
  K.pkWater = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const pots = (o.pots || [{ x: 250, y: 400 }, { x: 480, y: 400 }, { x: 710, y: 400 }]).map(p => Object.assign({ level: 0, done: false, t0: Math.random() * 6 }, p));
    let can = null, waste = 0, fin = false, warned = 0, drops = [], tm = 0;
    st.input = {
      down(x, y, id) { can = { id, x, y }; sk.poke(); return true; },
      move(x, y, id) { if (can && can.id === id) { can.x = x; can.y = y; } },
      up(x, y, id) { if (can && can.id === id) can = null; }
    };
    const over = p => can && Math.abs(can.x - p.x) < 62 && can.y > p.y - 210 && can.y < p.y - 40;
    cl(st.addLayer({
      z: 5,
      update(dt) {
        tm += dt; let pouring = false;
        pots.forEach(p => {
          if (over(p)) {
            pouring = true;
            if (p.level < 1.02) { p.level += dt * .46; if (!p.done && p.level >= .66) { p.done = true; ctx.sfx('good'); st.burst(p.x, p.y - 80, { n: 12, kind: 'star' }); } }
            else { waste += dt; warned -= dt; if (warned <= 0) { warned = 2.5; st.bubble(ctx.active, 'كفاية! الماية غالية، منضيّعهاش', 1.8); } }
            if (Math.random() < .5) drops.push({ x: can.x + 34 + U.rnd(-6, 6), y: can.y + 24, vy: 180 });
          }
        });
        if (pouring && Math.random() < .2) ctx.sfx('drip');
        drops.forEach(d => { d.y += d.vy * dt; d.vy += 600 * dt; }); drops = drops.filter(d => d.y < 470);
        if (!fin && pots.every(p => p.done)) { fin = true; M.wait(1).then(() => { ctx.react('good', 'both'); done({ waste: Math.round(waste * 10) / 10 }); }); }
        st.dbg = { kit: 'pkwater', pots: pots.map(p => ({ x: p.x, y: p.y - 110, level: p.level, done: p.done })), waste };
      },
      draw(g, t) {
        pots.forEach(p => {
          const k = Math.min(1, p.level / .66);
          G.ell(g, p.x, p.y + 38, 54, 10, 'rgba(60,30,10,.22)', 0);
          // plant grows with water
          if (k > 0) { const hh = 10 + k * 70; G.line(g, p.x, p.y - 8, p.x, p.y - 8 - hh, 7, '#3f9a4f'); G.ell(g, p.x - 18, p.y - 8 - hh * .55, 18 * Math.min(1, k * 1.2), 9, '#5cc96b', 3.5, null, -.4); G.ell(g, p.x + 18, p.y - 8 - hh * .8, 18 * Math.min(1, k * 1.2), 9, '#5cc96b', 3.5, null, .4); }
          if (p.done) { const by = p.y - 96; for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3 + t * .4; G.circ(g, p.x + Math.cos(a) * 15, by + Math.sin(a) * 15, 10, ['#ff6f91', '#ffc93c', '#fff'][(o.pots ? 0 : 0) + (pots.indexOf(p) % 3)], 3); } G.circ(g, p.x, by, 9, '#ffd23c', 3); }
          G.poly(g, [[p.x - 40, p.y - 12], [p.x + 40, p.y - 12], [p.x + 30, p.y + 38], [p.x - 30, p.y + 38]], '#e07a4a', 4.5); G.fillRR(g, p.x - 46, p.y - 22, 92, 18, 6, '#c9633a', 4.5); G.ell(g, p.x, p.y - 12, 36, 6, '#6a4a2a', 3);
          // gauge
          const gx = p.x + 66, gy = p.y + 30, gh = 120; G.fillRR(g, gx - 10, gy - gh, 20, gh, 8, '#fff', 3.5); G.fillRR(g, gx - 10, gy - gh * .66 - gh * .34, 20, gh * .34, 0, 'rgba(92,201,107,.5)', 0);
          const lv = Math.min(1.05, p.level); if (lv > 0) { g.save(); g.beginPath(); G.rr(g, gx - 8, gy - gh + 2, 16, gh - 4, 6); g.clip(); g.fillStyle = p.level > 1.0 ? '#ef5350' : '#4aa8e8'; g.fillRect(gx - 8, gy - 2 - (gh - 4) * lv, 16, (gh - 4) * lv); g.restore(); }
          G.fillRR(g, gx - 10, gy - gh, 20, gh, 8, null, 3.5);
          if (p.done) A.draw(g, 'check', p.x, p.y + 64, 34);
        });
        drops.forEach(d => G.ell(g, d.x, d.y, 4, 7, '#4aa8e8', 1.5));
        if (can) { g.save(); g.translate(can.x, can.y); g.rotate(pots.some(over) ? .5 : 0); A.draw(g, 'pk_wcan', 0, 0, 110); g.restore(); }
        else G.text(g, 'اسحب الإبريق وسيبه شوية', 480, 150, { size: 28, color: '#fff', stroke: OL, sw: 7 });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; });
  };
})();
