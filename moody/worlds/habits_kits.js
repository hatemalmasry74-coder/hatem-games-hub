/* Moody & Aboody - worlds/habits_kits.js : kits for WORLD 9 "عاداتي كل يوم".
   ctx.games.habitTapper({steps:[{text, sub, times, art, water, prompt, onTap(n,total), onDone()}], card:true|false, side:'right'|'center', count:bool, heroes})
        -> {wrong}   one big button; every tap counts, steps run one after another (wudu washes, prayer positions, exercise reps).
        card:true draws the step's art big in the middle (wudu); count:true draws a big counter (exercise).
   ctx.games.habitMatch({pairs:[{k, art, label, size, small}], chunk:3, prompt}) -> {mistakes}   picture <-> phrase matching (chunks of 3 rows).
   Bot hooks: tapper uses the same '#over .btn.big.pink' as rituals (the bot's ritual handler works); match uses .mch[data-k][data-side] like pkPairs. */
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, G = M.gfx, U = M.util, A = M.art, K = M.kits, h = UI.h, ico = UI.ico, OL = M.OL;

  try {
    if (!document.getElementById('pkcss') && !document.getElementById('habitcss')) {
      const st = document.createElement('style'); st.id = 'habitcss';
      st.textContent = '.mchbox{position:absolute;left:70px;right:70px;top:86px;padding:12px 16px;display:flex;gap:18px;z-index:4;animation:popin .3s}.mcol{flex:1;display:flex;flex-direction:column;gap:10px}' +
        '.mch{font:bold 26px Tahoma,Arial,sans-serif;color:#3a2a1e;min-height:76px;border-radius:22px;border:4px solid #4a2e1c;border-bottom-width:8px;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;padding:4px 10px;line-height:1.15}' +
        '.mch.sel{background:#ffe9a0;transform:translateY(-3px)}.mch.ok{background:#c9f5cf;opacity:.75;pointer-events:none}.mch.glow{animation:pulse .8s infinite}.mch.shk{animation:shake .4s}';
      document.head.appendChild(st);
    }
  } catch (e) { }

  /* ================= TAPPER ================= */
  K.habitTapper = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), steps = o.steps; let i = 0, n = 0, fin = false, busy = false, flash = 0, t0 = 0, pop = 0;
    if (o.heroes) ctx.heroes(o.heroes);
    const side = o.side || 'center', pos = side === 'right' ? 'right:22px;bottom:34px' : 'left:0;right:0;margin:0 auto;width:fit-content;bottom:22px';
    const b = h('button', { class: 'btn big pink', style: 'position:absolute;' + pos + ';animation:pulse 1.2s infinite;font-size:44px;min-height:104px;z-index:4;white-space:nowrap;padding:6px 26px' });
    const setBtn = () => { const s = steps[i]; b.textContent = ''; b.append(s.text); if (s.sub) b.append(h('small', { style: 'font-size:22px;display:block' }, M.fmt(s.sub))); };
    function begin() { const s = steps[i]; n = 0; setBtn(); const pr = s.prompt || s.text; ctx.prompt(pr); if (s.onStart) s.onStart(); }
    b.onclick = () => {
      if (fin || busy) return; const s = steps[i], tot = s.times || 1; sk.poke(); n++; ctx.sfx(s.water ? 'splash' : 'pop'); pop = 1;
      ctx.stage.burst(side === 'right' ? 770 : 480, 360, { n: 8, kind: s.water ? 'drop' : 'spark', col: s.water ? '#4aa8e8' : undefined, max: 170 });
      if (s.onTap) try { s.onTap(n, tot); } catch (e) { }
      if (n >= tot) {
        busy = true; if (s.onDone) try { s.onDone(); } catch (e) { }
        M.wait(s.hold == null ? .55 : s.hold).then(() => {
          i++; busy = false; if (i >= steps.length) { fin = true; b.remove(); ctx.react('good', 'both'); M.wait(.9).then(() => done({ wrong: 0 })); } else begin();
        });
      }
    };
    UI.over.append(b); cl(() => b.remove()); begin();
    cl(st.addLayer({
      z: 10, update(dt) { t0 += dt; if (pop > 0) pop -= dt * 3; st.dbg = { kit: 'habittapper', step: i, n, steps: steps.length }; },
      draw(g, t) {
        const s = steps[Math.min(i, steps.length - 1)], tot = s.times || 1;
        if (o.card) {
          const cx = 480, cy = 262, k = 1 + Math.max(0, pop) * .08;
          G.fillRR(g, cx - 175, cy - 150, 350, 290, 28, 'rgba(255,255,255,.9)', 5);
          if (s.water) { g.save(); g.globalAlpha = .55; for (let j = 0; j < 7; j++) { const x = cx - 120 + j * 40, y = cy - 104 + ((t * 120 + j * 37) % 220); G.ell(g, x, y, 4, 7, '#4aa8e8', 0); } g.restore(); }
          g.save(); g.translate(cx, cy - 6); g.scale(k, k); A.draw(g, s.art, 0, 0, 230); g.restore();
          G.text(g, 'الخطوة ' + U.ar(Math.min(i + 1, steps.length)) + ' من ' + U.ar(steps.length), cx, cy - 128, { size: 22, color: '#8a6bd6' });
        }
        if (o.count) {
          const cx = 480, cy = 170, k = 1 + Math.max(0, pop) * .2; g.save(); g.translate(cx, cy); g.scale(k, k);
          G.text(g, n ? U.ar(n) : 'يلا!', 0, 0, { size: n ? 120 : 84, color: '#fff', stroke: OL, sw: 14 }); g.restore(); G.text(g, 'لحد ' + U.ar(tot), cx, cy + 86, { size: 30, color: '#fff', stroke: OL, sw: 7 });
        } else if (tot > 1) {
          const sx = side === 'right' ? 770 : 480; for (let j = 0; j < tot; j++) { const x = sx + (j - (tot - 1) / 2) * 38; G.circ(g, x, o.card ? 386 : side === 'right' ? 372 : 392, 13, j < n ? '#5cc96b' : 'rgba(255,255,255,.8)', 3.5); }
        }
      }
    }));
    cl(() => { st.dbg = null; });
  };

  /* ================= MATCH (picture <-> phrase) ================= */
  K.habitMatch = function (ctx, o, done, cl) {
    const sk = ctx.skipper(done, cl, o); ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const chunks = [], per = o.chunk || 3; for (let a = 0; a < o.pairs.length; a += per) chunks.push(o.pairs.slice(a, a + per));
    let ci = -1, sel = null, matched = 0, misses = 0, busy = false, el = null, all = [];
    function mount() {
      if (el) el.remove(); ci++; if (ci >= chunks.length) { ctx.react('good', 'both'); M.wait(.6).then(() => done({ mistakes: misses })); return; }
      const ch = chunks[ci]; all = []; matched = 0; sel = null;
      const mk = (c, side) => {
        const b = h('button', { class: 'mch', 'data-k': c.k, 'data-side': side, style: side === 'L' ? 'min-height:96px' : (c.small ? 'font-size:21px' : '') }, side === 'L' ? ico(c.art, c.size || 88) : null, side === 'R' ? h('span', null, M.fmt(c.label)) : null);
        b.onclick = () => pick(b, c, side); all.push({ b, c, side }); return b;
      };
      el = h('div', { class: 'panel mchbox', style: 'top:92px;left:60px;right:60px' }, h('div', { class: 'mcol' }, ch.map(c => mk(c, 'L'))), h('div', { class: 'mcol', style: 'flex:1.5' }, U.shuffle(ch.slice()).map(c => mk(c, 'R'))));
      UI.over.append(el);
    }
    function pick(b, c, side) {
      if (busy || b.classList.contains('ok')) return; sk.poke(); ctx.sfx('tap');
      if (!sel || sel.side === side) { if (sel) sel.b.classList.remove('sel'); sel = { b, c, side }; b.classList.add('sel'); return; }
      const a = sel; sel = null; a.b.classList.remove('sel');
      if (a.c.k === c.k) {
        [a.b, b].forEach(x => x.classList.add('ok')); ctx.sfx('good'); matched++; ctx.stage.burst(480, 300, { n: 8, kind: 'star' });
        if (matched === chunks[ci].length) { busy = true; M.wait(.8).then(() => { busy = false; mount(); }); }
      } else {
        misses++; sk.fail(); ctx.sfx('wrong'); [a.b, b].forEach(x => { x.classList.remove('shk'); void x.offsetWidth; x.classList.add('shk'); });
        ctx.stage.bubble(ctx.active, o.wrong || 'قريب! جرّب تاني', 1.6);
        if (misses >= 2) { const p = all.find(z => z.c.k === a.c.k && z.side !== a.side); if (p) p.b.classList.add('glow'); }
      }
    }
    mount(); cl(() => { if (el) el.remove(); });
    ctx.stage.dbg = { kit: 'pairs' }; cl(() => { ctx.stage.dbg = null; });
  };
})();
