/* Family Adventures - worlds/nana_kits.js : two kits for WORLD 7 "بيت {gm}".
   ctx.games.nnLift({target:3, from:6})   -> {tries}  (press the right floor button in the lift, the lift goes down floor by floor)
   ctx.games.nnClock({h:8, m:0, label, art}) -> {tries}  (set the clock hands: hour +/- and half-hour toggle)
   Bot hooks: Moody.scene.dbg = {kit:'nnlift', target, phase} / {kit:'nnclock', h, m, th, tm}; buttons carry data-floor / data-act. */
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, G = M.gfx, U = M.util, A = M.art, K = M.kits, h = UI.h, OL = M.OL;

  /* ================= LIFT BUTTONS ================= */
  K.nnLift = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), target = o.target || 3, from = o.from || 6; let tries = 0, busy = false, closed = false, misses = 0;
    if (o.prompt) ctx.prompt(o.prompt);
    st.state.floor = from; st.state.doors = 0; st.state.moving = false;
    const order = [7, 8, 5, 6, 3, 4, 1, 2], btns = {};
    const grid = h('div', { style: 'position:absolute;left:765px;top:106px;width:152px;display:grid;grid-template-columns:70px 70px;gap:8px;direction:ltr;z-index:4;pointer-events:auto' });
    order.forEach(n => {
      const b = h('button', { 'data-floor': n, 'aria-label': 'الدور ' + n, style: 'width:70px;height:68px;border-radius:50%;border:4px solid #3a2013;border-bottom-width:8px;background:#f6f8ff;color:#2b3a67;font:bold 34px Tahoma,Arial,sans-serif;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center' }, U.ar(n));
      b.onclick = () => press(n, b); btns[n] = b; grid.append(b);
    });
    UI.over.append(grid); cl(() => { closed = true; grid.remove(); st.state.moving = false; st.state.doors = 0; });
    async function press(n, b) {
      if (busy || closed) return; sk.poke(); ctx.sfx('tap');
      if (n === target) {
        busy = true; b.style.background = '#ffd23c'; b.style.boxShadow = '0 0 18px #ffd23c'; ctx.sfx('good'); ctx.fx.burst(840, 250, { n: 8, kind: 'spark' }); await M.wait(.5); if (closed) return;
        await M.tw(st.state, { doors: 1 }, .6, 'inOut'); st.state.moving = true;
        for (let f = from - 1; f >= target; f--) { await M.wait(1.0); if (closed) return; st.state.floor = f; ctx.sfx(f === target ? 'bell' : 'click'); }
        st.state.moving = false; await M.wait(.3); await M.tw(st.state, { doors: 0 }, .7, 'inOut'); ctx.react('good', 'both'); await M.wait(.6); if (!closed) done({ tries: tries + 1, misses });
      } else {
        tries++; misses++; sk.fail(); ctx.sfx('wrong'); b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'shake .4s'; b.style.background = '#ffd7d2';
        st.bubble(st.heroes.toota && st.heroes.toota.visible ? 'toota' : st.active, 'ده مش دور {gmt}! {gmt} في الدور التالت', 2.4);
        if (misses >= 2) { btns[target].style.animation = 'pulse .8s infinite'; btns[target].style.background = '#fff3a0'; }
      }
    }
    cl(st.addLayer({ z: 5, update() { st.dbg = { kit: 'nnlift', target, phase: busy ? 'go' : 'pick' }; } }));
    cl(() => { st.dbg = null; });
  };

  /* ================= CLOCK SETTER ================= */
  K.nnClock = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), th = o.h || 8, tm = o.m || 0; let H = o.startH || 12, Mi = 0, tries = 0, fin = false, ha = 0, ma = 0;
    ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const wrongMsg = () => (H % 12) !== (th % 12) ? 'الإبرة القصيرة بتقول الساعة كام. حرّكوها للرقم المطلوب' : 'الإبرة الطويلة على ١٢ يعني بالظبط، وعلى ٦ يعني ونص';
    const bar = h('div', { class: 'bar2' },
      UI.btn('الساعة +', 'blue', () => { H = H % 12 + 1; sk.poke(); }), UI.btn('الساعة −', 'blue', () => { H = (H + 10) % 12 + 1; sk.poke(); }),
      o.halves ? UI.btn('ونص', 'yellow', () => { Mi = Mi ? 0 : 30; sk.poke(); }) : null,
      UI.btn('تمام', 'green big', () => {
        if (fin) return; if ((H % 12) === (th % 12) && Mi === tm) { fin = true; ctx.sfx('good'); ctx.react('good', 'both'); M.wait(1).then(() => done({ tries: tries + 1 })); }
        else { tries++; sk.fail(); ctx.sfx('wrong'); st.bubble('moody', wrongMsg(), 2.6); }
      }, 'check'));
    const bs = bar.querySelectorAll('button'); bs[0].dataset.act = 'h+'; bs[1].dataset.act = 'h-'; if (o.halves) { bs[2].dataset.act = 'm'; bs[3].dataset.act = 'ok'; } else bs[2].dataset.act = 'ok';
    UI.over.append(bar); cl(() => bar.remove());
    const digital = U.ar(th) + ':' + (tm ? '٣٠' : '٠٠');
    cl(st.addLayer({
      z: 10, update(dt) { const tgtH = ((H % 12) + Mi / 60) * 30, tgtM = Mi * 6; ha += ((((tgtH - ha) % 360) + 540) % 360 - 180) * Math.min(1, dt * 10); ma += ((((tgtM - ma) % 360) + 540) % 360 - 180) * Math.min(1, dt * 10); st.dbg = { kit: 'nnclock', h: H % 12, m: Mi, th: th % 12, tm }; },
      draw(g, t) {
        // target card
        G.fillRR(g, 90, 150, 250, 240, 24, 'rgba(255,255,255,.88)', 4.5); G.text(g, o.label || 'الميعاد', 215, 184, { size: 26 }); if (o.art) A.draw(g, o.art, 215, 262, 84); G.text(g, digital, 215, 350, { size: 60, color: '#c25a00' });
        // clock
        const cx = 620, cy = 270, r = 132; G.shadow(g, cx, cy + r + 12, r * .8, 12, .2); G.circ(g, cx, cy, r + 10, '#ff8a2a', 5); G.circ(g, cx, cy, r, '#fff', 4.5);
        for (let i = 0; i < 60; i++) { const a = i * Math.PI / 30, big = i % 5 === 0; G.line(g, cx + Math.sin(a) * (r - (big ? 16 : 8)), cy - Math.cos(a) * (r - (big ? 16 : 8)), cx + Math.sin(a) * (r - 3), cy - Math.cos(a) * (r - 3), big ? 3.5 : 1.8); }
        for (let i = 1; i <= 12; i++) { const a = i * Math.PI / 6; G.text(g, U.ar(i), cx + Math.sin(a) * (r - 34), cy - Math.cos(a) * (r - 34) + 2, { size: 30 }); }
        const hr = ha * Math.PI / 180, mr = ma * Math.PI / 180;
        G.line(g, cx, cy, cx + Math.sin(hr) * 66, cy - Math.cos(hr) * 66, 12, OL); G.line(g, cx, cy, cx + Math.sin(hr) * 66, cy - Math.cos(hr) * 66, 7, '#ef5350');
        G.line(g, cx, cy, cx + Math.sin(mr) * 98, cy - Math.cos(mr) * 98, 9, OL); G.line(g, cx, cy, cx + Math.sin(mr) * 98, cy - Math.cos(mr) * 98, 4.5, '#4a8dff'); G.circ(g, cx, cy, 9, OL, 0);
      }
    }));
    cl(() => { st.dbg = null; });
  };
})();
