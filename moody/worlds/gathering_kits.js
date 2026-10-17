/* Moody & Aboody - worlds/gathering_kits.js : one kit for WORLD 10 "تجمّع العائلة".
   ctx.games.gtSimon({rounds:[[0,1,2],[2,1,0,3]], prompt, who}) -> {misses}   "sing along": the family plays a tune on 4 note buttons, the child repeats it.
   Bot hooks: Moody.scene.dbg = {kit:'gtsimon', next:<note index or -1>, busy}; buttons carry data-note="0..3". */
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, G = M.gfx, K = M.kits, h = UI.h, ico = UI.ico;
  const NOTES = [523, 587, 659, 784], COLS = ['#ff6f91', '#ffc93c', '#5cc96b', '#4aa8e8'];

  K.gtSimon = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), rounds = o.rounds || [[0, 1, 2], [2, 1, 0, 3]];
    let ri = 0, pos = 0, busy = true, closed = false, misses = 0, lit = -1;
    if (o.prompt) ctx.prompt(o.prompt);
    const btns = COLS.map((c, i) => {
      const b = h('button', { class: 'btn round', 'data-note': i, 'aria-label': 'نغمة ' + (i + 1), style: 'width:98px;height:98px;min-width:98px;min-height:98px;border-radius:50%;background:' + c + ';border:5px solid #3a2013;border-bottom-width:9px;padding:0;transition:transform .12s' }, ico('gather_note', 58));
      b.onclick = () => press(i); return b;
    });
    const bar = h('div', { class: 'bar2', style: 'gap:20px;bottom:14px' }, btns); UI.over.append(bar); cl(() => { closed = true; bar.remove(); st.dbg = null; });
    function light(i) {
      lit = i; const b = btns[i]; b.style.transform = 'scale(1.18)'; b.style.boxShadow = '0 0 26px ' + COLS[i]; M.audio.init(); M.audio.tone(NOTES[i], .35, 'triangle', .3);
      st.burst(300 + i * 120, 330, { n: 3, kind: 'spark', cols: [COLS[i]], max: 120 }); setTimeout(() => { b.style.transform = ''; b.style.boxShadow = ''; if (lit === i) lit = -1; }, 330);
    }
    async function demo() {
      busy = true; pos = 0; await M.wait(.6); if (closed) return;
      for (const n of rounds[ri]) { if (closed) return; light(n); await M.wait(.65); }
      busy = false; if (!closed && o.again) ctx.prompt(o.again);
    }
    async function press(i) {
      if (busy || closed) return; sk.poke(); light(i); const pat = rounds[ri];
      if (i === pat[pos]) {
        pos++; if (pos >= pat.length) {
          busy = true; ctx.sfx('good'); ctx.react('good', 'both'); st.burst(480, 300, { n: 14, kind: 'star' }); ri++; await M.wait(1); if (closed) return;
          if (ri >= rounds.length) { done({ misses }); return; } if (o.prompt) ctx.prompt(o.prompt); demo();
        }
      } else { misses++; busy = true; sk.fail(); ctx.sfx('wrong'); st.bubble(o.who || st.active, 'اسمع اللحن تاني وكرّر', 2); await M.wait(1.3); if (closed) return; demo(); }
    }
    cl(st.addLayer({
      z: 10, update() { st.dbg = { kit: 'gtsimon', next: busy ? -1 : rounds[ri][pos], busy, lit }; },
      draw(g, t) { if (lit >= 0) { g.save(); g.globalAlpha = .85; G.circ(g, 480, 250 - Math.sin(t * 8) * 4, 46, 'rgba(255,255,255,.8)', 4); M.art.draw(g, 'gather_note', 480, 250, 70); g.restore(); } }
    }));
    demo();
  };
})();
