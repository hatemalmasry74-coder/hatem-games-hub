/* Moody & Aboody - engine/minigames.js : reusable mini-game kits.
   A kit is  M.kits.name = function (ctx, opts, done, cleanup) { ... done(result); cleanup(fn) }
   and is automatically exposed as  await ctx.games.name(opts).  See DEV.md for each kit's options. */
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, G = M.gfx, U = M.util, A = M.art, K = M.kits, h = UI.h, ico = UI.ico;
  const hint = (ctx, msg, who) => { ctx.stage.bubble(who || ctx.stage.active, msg, 2.2); };
  const hitR = s => Math.max(s / 2 + 8, 36);
  const needMsg = (st, need) => { const k = st.who(need), n = (M.save.data.names[k] || M.chars.defs[k].name); return need === 'moody' || need === 'strong' ? 'ده تقيل أوي! محتاجين ' + n : 'محتاجين ' + n + '!'; };
  const badge = (g, need, x, y, r, fs) => { const b = M.chars.badge(need); G.circ(g, x, y, r, b[1], 3); G.text(g, b[0], x, y + 1, { size: fs, color: '#fff', stroke: M.OL, sw: 3 }); };

  /* ================= DRAG & DROP ================= */
  K.dragdrop = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o);
    if (o.prompt) ctx.prompt(o.prompt); if (o.heroes) st.layout(o.heroes);
    const items = o.items.map(it => Object.assign({ s: 72, sc: 1, placed: false, wob: 0, home: { x: it.x, y: it.y } }, it));
    const tg = o.targets.map(t => Object.assign({ n: 0, w: 130, h: 110, glow: 0 }, t));
    const drag = new Map(); let finished = false;
    st.input = {
      down(x, y, id) {
        for (let i = items.length - 1; i >= 0; i--) {
          const it = items[i]; if (it.placed || it.busy || it.drag != null) continue;
          if (U.dist(x, y, it.x, it.y) < hitR(it.s * it.sc)) {
            if (it.needs && !st.can(st.active, it.needs)) { it.wob = .5; M.audio.sfx('wrong'); hint(ctx, it.needsMsg || needMsg(st, it.needs)); UI.hud.pulseSwitch(true); setTimeout(() => UI.hud.pulseSwitch(false), 2600); return true; }
            it.drag = id; it.dx = it.x - x; it.dy = it.y - y; drag.set(id, it); items.splice(i, 1); items.push(it); M.audio.sfx('pick'); sk.poke();
            if (it.needs === 'moody' || it.needs === 'strong') { const m = st.hero(st.who(it.needs)); m.fa = 'lift'; m.fat = 60; m.carry = null; }
            return true;
          }
        }
        return false;
      },
      move(x, y, id) { const it = drag.get(id); if (!it) return; it.x = U.clamp(x + it.dx, 30, 930); it.y = U.clamp(y + it.dy, 100, 520); if (it.needs === 'moody' || it.needs === 'strong') { const m = st.hero(st.who(it.needs)); m.tx = U.clamp(it.x, 60, 900); m.ty = m.y; m.dir = it.x > m.x ? 1 : -1; m.fat = 60; } },
      up(x, y, id) {
        const it = drag.get(id); if (!it) return; drag.delete(id); it.drag = null;
        if (it.needs === 'moody' || it.needs === 'strong') { const m = st.hero(st.who(it.needs)); m.fa = null; m.fat = 0; m.tx = null; }
        const t = tg.find(t => Math.abs(it.x - t.x) < t.w / 2 + 16 && Math.abs(it.y - t.y) < t.h / 2 + 16);
        if (!t) { back(it); return; }
        const ok = it.to === t.id || (t.accepts && t.accepts(it));
        if (ok) place(it, t); else { M.audio.sfx('wrong'); ctx.mistake(); sk.fail(); hint(ctx, it.hint || t.wrongHint || o.wrongHint || 'مش هنا.. جرّب مكان تاني'); st.play(st.active, 'oops', .9); back(it); }
      }
    };
    function back(it) { it.busy = true; M.tw(it, { x: it.home.x, y: it.home.y }, .35, 'outBack').then(() => { it.busy = false; }); }
    function place(it, t) {
      it.placed = true; const n = t.n++, cols = t.cols || 3, sx = t.x + ((n % cols) - (cols - 1) / 2) * (t.dx || 26), sy = t.y + (t.dy0 == null ? -4 : t.dy0) - Math.floor(n / cols) * 14;
      M.tw(it, { x: sx, y: sy, sc: t.itemScale || .55 }, .3, 'outBack'); M.audio.sfx('pop'); st.burst(sx, sy, { n: 8, kind: 'spark', cols: ['#ffc93c'], max: 160 }); t.glow = 1;
      st.float('+', t.x, t.y - 40, '#5cc96b'); if (Math.random() < .5) st.play(st.active, 'cheer', .7); sk.poke();
      if (o.onPlace) try { o.onPlace(it, t); } catch (e) { }
      if (items.every(i => i.placed) && !finished) { finished = true; M.wait(.7).then(() => { ctx.react('good', 'both'); M.wait(.9).then(() => done({ mistakes: ctx.mistakes })); }); }
    }
    cl(st.addLayer({
      z: 10, update(dt) { items.forEach(i => { if (i.wob > 0) i.wob -= dt; }); tg.forEach(t => { if (t.glow > 0) t.glow -= dt * 2; }); st.dbg = { kit: 'dragdrop', items: items.filter(i => !i.placed).map(i => { const t = tg.find(t => t.id === i.to) || tg.find(t => { try { return t.accepts && t.accepts(i); } catch (e) { return false; } }) || {}; return { id: i.id, x: i.x, y: i.y, tx: t.x, ty: t.y, needs: i.needs || null, hero: i.needs ? st.who(i.needs) : null }; }) }; },
      draw(g, t) {
        if (o.panel) { const pn = o.panel; g.save(); g.shadowColor = 'rgba(40,20,70,.28)'; g.shadowBlur = 18; g.shadowOffsetY = 8; G.fillRR(g, pn.x, pn.y, pn.w, pn.h, 28, 'rgba(255,250,236,.84)', 3); g.restore(); g.fillStyle = G.lin(g, 0, pn.y, 0, pn.y + pn.h * .5, ['rgba(255,255,255,.55)', 'rgba(255,255,255,0)']); g.save(); G.rr(g, pn.x + 4, pn.y + 4, pn.w - 8, pn.h - 8, 24); g.clip(); g.fillRect(pn.x, pn.y, pn.w, pn.h * .5); g.restore(); }
        tg.forEach(tt => {
          g.save(); g.translate(tt.x, tt.y); const k = 1 + Math.max(0, tt.glow) * .12; g.scale(k, k);
          if (tt.draw) tt.draw(g, tt); else if (tt.art) A.draw(g, tt.art, 0, 0, tt.s || Math.max(tt.w, tt.h) * 1.1); else { G.fillRR(g, -tt.w / 2, -tt.h / 2, tt.w, tt.h, 22, 'rgba(255,255,255,.72)', 3); }
          if (!drag.size) { g.save(); g.strokeStyle = 'rgba(255,255,255,' + (.55 + .3 * Math.sin(t * 3)) + ')'; g.lineWidth = 4; g.setLineDash([10, 9]); G.rr(g, -tt.w / 2 - 6, -tt.h / 2 - 6, tt.w + 12, tt.h + 12, 24); g.stroke(); g.restore(); }
          if (drag.size && [...drag.values()].some(d => Math.abs(d.x - tt.x) < tt.w / 2 + 16 && Math.abs(d.y - tt.y) < tt.h / 2 + 16)) { g.strokeStyle = '#ffc93c'; g.lineWidth = 6; g.setLineDash([12, 8]); G.rr(g, -tt.w / 2 - 8, -tt.h / 2 - 8, tt.w + 16, tt.h + 16, 22); g.stroke(); g.setLineDash([]); }
          if (tt.label) G.text(g, tt.label, 0, tt.h / 2 + 18, { size: 22, color: '#fff', stroke: M.OL, sw: 6 });
          g.restore();
        });
        items.forEach(it => {
          const wob = it.wob > 0 ? Math.sin(it.wob * 40) * 6 : 0, lift = it.drag != null ? 1.18 : 1, bob = (it.drag == null && !it.placed) ? Math.sin(t * 2.5 + it.home.x) * 2 : 0;
          if (it.drag != null) G.shadow(g, it.x, it.y + it.s * .5, it.s * .4, 9, .25);
          g.save(); g.translate(wob, bob); if (it.draw) { g.save(); g.translate(it.x, it.y); g.scale(it.sc * lift, it.sc * lift); it.draw(g, it); g.restore(); } else A.draw(g, it.art, it.x, it.y, it.s * it.sc * lift); g.restore();
          if (it.needs && !it.placed && it.drag == null) badge(g, it.needs, it.x + it.s * .38, it.y - it.s * .42, 15, 18);
        });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; UI.hud.pulseSwitch(false); const m = st.hero('moody'); if (m.fa === 'lift') { m.fa = null; m.fat = 0; m.tx = null; } });
    // skipping: put every remaining item in its place
    const origDone = done; done = function (r) { if (r && r.skipped) items.forEach(i => { if (!i.placed) { const t = tg.find(t => t.id === i.to); if (t) { i.placed = true; i.x = t.x; i.y = t.y; i.sc = .55; } } }); origDone(r); };
  };

  /* ================= HIDDEN OBJECTS / TAP SPOTS ================= */
  K.hidden = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); let busy = false, idle = 0, wrong = 0, finished = false;
    if (o.prompt) ctx.prompt(o.prompt); if (o.heroes) st.layout(o.heroes);
    const spots = o.spots.map(s => Object.assign({ s: 64, found: false, sc: 1, alpha: 1, listed: true, t0: Math.random() * 6 }, s));
    const listed = () => spots.filter(s => s.listed !== false);
    const slotPos = s => { const L = listed(), i = L.indexOf(s), n = L.length, w = Math.min(64, 560 / n); return { x: 480 + ((n - 1) / 2 - i) * (w + 8) * -1, y: 150, w }; };
    function find(spot) {
      busy = true; idle = 0; sk.poke(); const hero = spot.needs ? st.who(spot.needs) : st.active, hh = st.hero(hero);
      const act = async () => {
        if (!o.noWalk) { await st.walk(hero, U.clamp(spot.x + (spot.walkOff == null ? (spot.x > 480 ? 70 : -70) : spot.walkOff), 70, 890), hh.y); hh.dir = spot.x > hh.x ? 1 : -1; }
        await st.play(hero, spot.anim || 'pickup', .7); M.audio.sfx('pick'); st.burst(spot.x, spot.y, { n: 12, kind: 'star', max: 200 }); spot.found = true;
        if (!spot.keep) { const p = slotPos(spot); await M.tw(spot, { x: p.x, y: p.y, sc: .5 }, .45, 'inOut'); spot.gone = true; }
        M.audio.sfx('good'); if (spot.onFound) { try { await spot.onFound(spot); } catch (e) { if (e && e.abort) return; } }
      };
      act().then(() => { busy = false; if (!finished && spots.every(s => s.found || s.optional)) { finished = true; M.wait(.4).then(() => { ctx.react('good', 'both'); M.wait(.8).then(() => done({ wrong, mistakes: ctx.mistakes })); }); } }).catch(() => { busy = false; });
    }
    st.input = {
      down(x, y) {
        if (busy) return true; let best = null, bd = 1e9;
        spots.forEach(s => { if (s.found || s.disabled) return; const d = U.dist(x, y, s.x, s.y + (s.hy || 0)); if (d < (s.hit || hitR(s.s)) && d < bd) { best = s; bd = d; } });
        if (best) {
          if (best.needs && !st.can(st.active, best.needs)) { M.audio.sfx('wrong'); hint(ctx, best.needsMsg || (best.needs === 'moody' ? 'محتاجين {m} الطويل' : best.needs === 'aboody' ? 'محتاجين {a} الصغير' : needMsg(st, best.needs))); UI.hud.pulseSwitch(true); setTimeout(() => UI.hud.pulseSwitch(false), 2600); return true; }
          find(best); return true;
        }
        for (const k of ['moody', 'aboody']) { const hh = st.heroes[k]; if (k !== st.active && Math.abs(x - hh.x) < 40 && y < hh.y + 6 && y > hh.y - 160) return false; }
        wrong++; idle += 2; M.audio.sfx('drip'); st.burst(x, y, { n: 4, kind: 'spark', cols: ['#fff'], max: 80 }); return true;
      }
    };
    cl(st.addLayer({
      z: 10, update(dt) { idle += dt; st.dbg = { kit: 'hidden', spots: spots.filter(s => !s.found).map(s => ({ id: s.id, x: s.x, y: s.y + (s.hy || 0), needs: s.needs || null, hero: s.needs ? st.who(s.needs) : null })) }; },
      draw(g, t) {
        spots.forEach(s => {
          if (s.gone) return; g.save(); g.globalAlpha = s.alpha;
          if (s.draw) { g.save(); g.translate(s.x, s.y); s.draw(g, t, st, s); g.restore(); } else if (s.art) A.draw(g, s.art, s.x, s.y + (s.found ? 0 : Math.sin(t * 2 + s.t0) * 1.5), s.s * s.sc);
          g.restore();
          if (!s.found && s.needs && !s.noBadge) badge(g, s.needs, s.x + s.s * .4, s.y - s.s * .4 + (s.hy || 0), 14, 16);
        });
        // find-list
        const L = listed(); if (L.length && o.list !== false) {
          const w = Math.min(64, 560 / L.length), tot = L.length * (w + 8) + 8; G.fillRR(g, 480 - tot / 2, 150 - w / 2 - 6, tot, w + 12, 18, 'rgba(255,247,227,.92)', 3.5);
          L.forEach((s, i) => { const x = 480 + ((L.length - 1) / 2 - i) * -(w + 8); if (s.listArt === false) return; g.save(); g.globalAlpha = s.found ? .35 : 1; A.draw(g, s.listArt || s.art || 'question', x, 150, w * .8); g.restore(); if (s.found) A.draw(g, 'check', x, 150, w * .6); });
        }
        // hint ring
        if (idle > (o.hintAfter || 18) || wrong >= 6) { const r = spots.find(s => !s.found && !s.optional); if (r) { g.save(); g.strokeStyle = '#ffc93c'; g.lineWidth = 6; g.globalAlpha = .6 + .4 * Math.sin(t * 6); g.beginPath(); g.arc(r.x, r.y + (r.hy || 0), r.s * .62 + Math.sin(t * 6) * 4, 0, 6.3); g.stroke(); g.restore(); if (r.needs && !st.can(st.active, r.needs)) UI.hud.pulseSwitch(true); } }
      }
    }));
    cl(() => { st.input = null; st.dbg = null; UI.hud.pulseSwitch(false); });
  };

  /* ================= CHOICE SCENE (moral decisions) ================= */
  K.choice = function (ctx, o, done, cl) {
    let tries = 0, busy = false, closed = false; const picked = [];
    const ui = UI.choiceCards(o.prompt, o.options, async (i, card) => {
      if (busy || closed) return; busy = true; const opt = o.options[i]; tries++; picked.push(i);
      try {
        if (opt.good) {
          card.classList.add('picked'); UI.sparkEl && UI.sparkEl(card, { n: 12, r: 90 }); ctx.sfx('good'); ui.close(); closed = true;
          if (opt.reply) for (const l of opt.reply) await ctx.say(l[0], l[1], l[2]);
          ctx.react('good', 'both'); await ctx.wait(.5); done({ good: true, firstTry: tries === 1, tries, picked, index: i });
        } else {
          ui.el.style.display = 'none'; ctx.mistake();
          if (typeof opt.consequence === 'function') await opt.consequence(ctx);
          else if (opt.consequence) { ctx.react('oops', ctx.active); for (const l of opt.consequence) await ctx.say(l[0], l[1], l[2]); }
          card.classList.add('used'); card.disabled = true; ui.el.style.display = ''; busy = false;
        }
      } catch (e) { busy = false; }
    });
    cl(() => ui.close());
  };

  /* ================= SEQUENCE (order the steps) ================= */
  K.sequence = function (ctx, o, done, cl) {
    const steps = o.steps, n = steps.length, sk = ctx.skipper(done, cl, o); let next = 0, misses = 0, busy = false;
    if (o.prompt) ctx.prompt(o.prompt); ctx.heroes('corner');
    const slots = steps.map((s, i) => h('div', { class: 'slot' }, U.ar(i + 1))), cards = [];
    const slotRow = h('div', { class: 'row', style: 'gap:10px;flex-wrap:nowrap' }, slots), cardRow = h('div', { class: 'row', style: 'gap:10px;flex-wrap:nowrap;margin-top:14px' });
    const order = U.shuffle(steps.map((s, i) => i)); if (n > 2 && order.every((v, i) => v === i)) order.reverse();
    order.forEach(i => { const s = steps[i]; const c = h('button', { class: 'seqcard', 'data-i': i, style: 'width:' + Math.floor(820 / n - 10) + 'px;min-width:0' }, s.art ? ico(s.art, n > 4 ? 56 : 66) : null, s.label ? h('div', null, M.fmt(s.label)) : null); c.onclick = () => tapCard(i, c); cards.push(c); cardRow.append(c); });
    const el = h('div', { class: 'panel', style: 'position:absolute;left:40px;right:40px;top:84px;padding:12px 14px;text-align:center;animation:popin .3s;z-index:4' }, slotRow, cardRow); UI.over.append(el); cl(() => el.remove());
    function tapCard(i, c) {
      if (busy) return; sk.poke();
      if (i === next) {
        ctx.sfx('pop'); const sl = slots[next]; sl.className = 'slot full'; sl.textContent = ''; const s = steps[i]; if (s.art) sl.append(ico(s.art, 54)); sl.append(h('div', { style: 'font-size:16px;line-height:1.1' }, M.fmt(s.label || ''))); c.classList.add('used'); c.classList.remove('glow'); UI.sparkEl && UI.sparkEl(sl, { n: 8, r: 50 }); next++;
        ctx.stage.burst(480, 300, { n: 6, kind: 'spark', max: 120 });
        if (next >= n) { busy = true; ctx.react('good', 'both'); M.wait(1.1).then(() => done({ mistakes: misses })); }
      } else {
        misses++; sk.fail(); ctx.sfx('wrong'); c.style.animation = 'none'; void c.offsetWidth; c.style.animation = 'shake .45s'; ctx.stage.bubble('aboody', 'مش دلوقتي.. فكّر في الأول', 1.6);
        if (misses >= 2) { const nc = cards.find(x => +x.dataset.i === next); if (nc) nc.classList.add('glow'); }
      }
    }
  };

  /* ================= MEMORY (card pairs, optional time limit) ================= */
  K.memory = function (ctx, o, done, cl) {
    const pairs = o.pairs, sk = ctx.skipper(done, cl, o); ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const deck = U.shuffle(pairs.concat(pairs).map((a, i) => ({ a, k: i }))), cols = o.cols || (deck.length <= 6 ? 3 : 4); let first = null, lock = false, matched = 0, moves = 0, finished = false;
    const grid = h('div', { style: 'display:grid;gap:10px;justify-content:center;grid-template-columns:repeat(' + cols + ',110px)' });
    const btns = deck.map(c => { const b = h('button', { class: 'cardmem back', 'data-art': c.a }); b.onclick = () => flip(b, c); grid.append(b); return b; });
    const bar = o.timeLimit ? h('div', { class: 'pbar', style: 'margin-bottom:10px' }, h('i', { style: 'width:100%;background:#4a8dff' })) : null;
    const el = h('div', { class: 'panel', style: 'position:absolute;left:50%;top:84px;transform:translateX(-50%);padding:14px 18px;text-align:center;animation:popin .3s;z-index:4;min-width:' + (cols * 120 + 40) + 'px' }, bar, grid); UI.over.append(el); cl(() => el.remove());
    let tl = o.timeLimit || 0, iv = null; if (bar) { iv = setInterval(() => { if (M.paused || finished) return; tl -= .1; bar.firstChild.style.width = Math.max(0, tl / o.timeLimit * 100) + '%'; if (tl <= 0 && !finished) { finished = true; clearInterval(iv); ctx.sfx('bell'); done({ timeUp: true, moves, matched }); } }, 100); cl(() => clearInterval(iv)); }
    function flip(b, c) {
      if (lock || b.classList.contains('match') || !b.classList.contains('back')) return; ctx.sfx('flip'); b.classList.remove('back'); b.textContent = ''; b.append(ico(c.a, 80)); sk.poke();
      if (!first) { first = { b, c }; return; }
      moves++; const f = first; first = null;
      if (f.c.a === c.a) { matched++; f.b.classList.add('match'); b.classList.add('match'); UI.sparkEl && (UI.sparkEl(f.b, { n: 8, r: 50 }), UI.sparkEl(b, { n: 8, r: 50 })); ctx.sfx('good'); ctx.stage.burst(480, 300, { n: 10, kind: 'star' }); if (matched === pairs.length && !finished) { finished = true; clearInterval(iv); ctx.react('good', 'both'); ctx.skill('memory'); M.wait(1).then(() => done({ moves, timeUp: false, matched })); } }
      else { lock = true; sk.fail(); setTimeout(() => { [f.b, b].forEach(x => { x.classList.add('back'); x.textContent = ''; }); lock = false; }, 850); }
    }
  };

  /* ================= SCRUB (clean germs / dirt by dragging a tool) ================= */
  K.scrub = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); ctx.heroes('hidden'); if (o.prompt) ctx.prompt(o.prompt);
    const cx = 480, cy = 300, n = o.dirt || 6; const spots = []; for (let i = 0; i < n; i++) spots.push({ x: cx - 200 + (i + .5) * (400 / n) + U.rnd(-10, 10), y: cy + (i % 2 ? 36 : -44) + U.rnd(-8, 8), hp: 1, r: 30, t0: U.rnd(0, 6) });
    let tool = null, finished = false, clean = 0;
    st.input = {
      down(x, y, id) { tool = { id, x, y }; sk.poke(); return true; },
      move(x, y, id) { if (!tool || tool.id !== id) return; const d = U.dist(x, y, tool.x, tool.y); tool.x = x; tool.y = y; if (d > 1 && Math.random() < .25) ctx.sfx('click'); spots.forEach(s => { if (s.hp > 0 && U.dist(x, y, s.x, s.y) < s.r + 26) { s.hp -= d / 260; if (s.hp <= 0) { clean++; ctx.sfx('pop'); st.burst(s.x, s.y, { n: 10, kind: 'spark', max: 160 }); if (clean >= n && !finished) { finished = true; M.wait(.5).then(() => { ctx.sfx('star'); ctx.react('good', 'both'); M.wait(.9).then(() => done({})); }); } } } }); },
      up(x, y, id) { if (tool && tool.id === id) tool = null; }
    };
    cl(st.addLayer({
      z: 10, update() { st.dbg = { kit: 'scrub', spots: spots.filter(s => s.hp > 0).map(s => ({ x: s.x, y: s.y })) }; },
      draw(g, t) {
        if (o.base) o.base(g, t, st); else {
          G.fillRR(g, cx - 240, cy - 130, 480, 260, 80, '#ff8fa0', 5); G.fillRR(g, cx - 215, cy - 105, 430, 210, 60, '#7a2a3a', 0);
          for (let i = 0; i < 8; i++) { G.fillRR(g, cx - 205 + i * 51.5, cy - 98, 46, 74, 14, '#fffdf6', 4); G.fillRR(g, cx - 205 + i * 51.5, cy + 26, 46, 70, 14, '#fffdf6', 4); }
        }
        spots.forEach(s => { if (s.hp <= 0) { G.sparkle(g, s.x + 10, s.y - 10, 9 + Math.sin(t * 5 + s.t0) * 2, '#fff', .9); return; } const k = .5 + s.hp * .5; g.save(); g.translate(s.x + Math.sin(t * 3 + s.t0) * 2, s.y); g.scale(k, k); G.circ(g, 0, 0, 24, '#c9d86a', 3.5); [-8, 8].forEach(e => { G.circ(g, e, -3, 4.5, '#fff', 1.5); G.circ(g, e, -3, 2, OLc, 0); }); g.beginPath(); g.arc(0, 8, 6, .2, Math.PI - .2); g.lineWidth = 2.5; g.strokeStyle = M.OL; g.stroke(); g.restore(); });
        if (tool) { g.save(); g.translate(tool.x, tool.y); g.rotate(-.5); A.draw(g, o.tool || 'toothbrush', 0, 0, 96); g.restore(); }
        else G.text(g, 'اسحب الفرشة على الأماكن الوسخة', cx, 470, { size: 26, color: '#fff', stroke: M.OL, sw: 6 });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; });
  };
  const OLc = '#3a2013';

  /* ================= MEASURE / COUNT cups ================= */
  K.measure = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), max = o.max || 10, target = o.target; let n = 0, lvl = 0, tries = 0, finished = false, glow = false, drops = [];
    ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const unit = o.unit || 'كوب';
    function add(d) { if (finished) return; n = U.clamp(n + d, 0, max); ctx.sfx(d > 0 ? 'splash' : 'drip'); if (d > 0) for (let i = 0; i < 6; i++) drops.push({ x: 560 + U.rnd(-14, 14), y: 120, vy: U.rnd(100, 200) }); sk.poke(); }
    const bar = h('div', { class: 'bar2' }, UI.btn('+ ' + unit, 'blue big', () => add(1)), UI.btn('− شيل', 'gray', () => add(-1)), UI.btn('تمام', 'green big', () => {
      if (n === target) { finished = true; ctx.sfx('good'); ctx.react('good', 'both'); M.wait(1).then(() => done({ tries: tries + 1 })); }
      else { tries++; sk.fail(); ctx.sfx('wrong'); hint(ctx, o.wrongMsg ? o.wrongMsg(n, target) : ('عدّينا ' + U.ar(n) + '.. محتاجين ' + U.ar(target)), 'moody'); if (tries >= 2) glow = true; }
    }, 'check')); UI.over.append(bar); cl(() => bar.remove());
    cl(st.addLayer({
      z: 10, update(dt) { lvl += (n - lvl) * Math.min(1, dt * 6); drops.forEach(d => { d.y += d.vy * dt; }); drops = drops.filter(d => d.y < 400); st.dbg = { kit: 'measure', n, target }; },
      draw(g, t) {
        const jx = 480, jy = 410, jh = 300, jw = 130, step = jh / max;
        G.fillRR(g, 90, 140, 230, 230, 24, 'rgba(255,255,255,.75)', 4); G.text(g, o.label || 'المطلوب', 205, 168, { size: 26 }); G.text(g, U.ar(target) + ' ' + unit, 205, 225, { size: 52, color: '#c25a00' });
        A.draw(g, o.art || 'cup', 205, 305, 90);
        g.save(); G.fillRR(g, jx - jw / 2, jy - jh, jw, jh, 16, 'rgba(255,255,255,.55)', 5); g.beginPath(); G.rr(g, jx - jw / 2 + 4, jy - jh + 4, jw - 8, jh - 8, 12); g.clip(); g.fillStyle = '#4aa8e8'; g.fillRect(jx - jw / 2, jy - lvl * step, jw, lvl * step + 4); g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(jx - jw / 2 + 10, jy - lvl * step, 12, lvl * step); g.restore();
        for (let i = 1; i <= max; i++) { const y = jy - i * step; G.line(g, jx + jw / 2 - 26, y, jx + jw / 2, y, i % 5 === 0 ? 5 : 3, M.OL); if (i === target && glow) { g.save(); g.strokeStyle = '#ffc93c'; g.lineWidth = 6; g.globalAlpha = .6 + .4 * Math.sin(t * 8); g.beginPath(); g.moveTo(jx - jw / 2 - 20, y); g.lineTo(jx + jw / 2 + 20, y); g.stroke(); g.restore(); } if (i % (max > 8 ? 2 : 1) === 0) G.text(g, U.ar(i), jx + jw / 2 + 24, y, { size: 20 }); }
        G.fillRR(g, jx - jw / 2 - 10, jy - jh - 14, jw + 20, 18, 8, '#9aa0b5', 4);
        A.draw(g, 'cup', 560, 100, 70); drops.forEach(d => G.ell(g, d.x, d.y, 5, 8, '#4aa8e8', 2));
        G.text(g, U.ar(Math.round(n)) + ' ' + unit, 700, 250, { size: 56, color: '#fff', stroke: M.OL, sw: 8 });
      }
    }));
    cl(() => { st.dbg = null; });
  };

  /* ================= RUNNER (side-scrolling, tap to jump) ================= */
  K.runner = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); ctx.heroes({ moody: { x: 340, y: 470, dir: 1, visible: true, sc: 1 }, aboody: { x: 230, y: 470, dir: 1, visible: true, sc: 1 } });
    if (o.prompt) ctx.prompt(o.prompt); const L = o.distance || 3200, base = o.speed || 300, oldBg = st.bg; let scroll = 0, hits = 0, stars = 0, slow = 0, jumps = { moody: 0, aboody: 0 }, vy = { moody: 0, aboody: 0 }, finished = false, started = 0;
    const kinds = o.obstacles || [{ art: 'blocks', h: 46 }, { art: 'ball', h: 46 }, { art: 'shoe', h: 40 }];
    const obs = [], cols = []; for (let x = 700; x < L - 400; x += U.rndi(420, 640)) { const k = U.pick(kinds); obs.push({ x, art: k.art, h: k.h, hit: false }); if (Math.random() < .7) for (let j = 0; j < 3; j++) cols.push({ x: x - 100 + j * 36, y: 410 - Math.sin(j / 2 * Math.PI) * 70, got: false }); }
    for (let x = 500; x < L - 300; x += U.rndi(300, 500)) cols.push({ x, y: 420, got: false });
    st.bg = o.bg || function (g, t, s) { const k = (scroll * .3) % 120; g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#ffe9c2', '#ffd9a0']); g.fillRect(0, 0, 960, 540); for (let i = -1; i < 9; i++) { const x = i * 120 - k; G.fillRR(g, x + 30, 120, 60, 130, 8, '#fff7e3', 3.5); G.fillRR(g, x + 38, 128, 44, 114, 4, '#9ed8ff', 0); } g.fillStyle = '#c98b5a'; g.fillRect(0, 478, 960, 62); g.fillStyle = '#b57a4c'; for (let i = -1; i < 20; i++) g.fillRect(i * 60 - (scroll % 60), 478, 4, 62); G.line(g, 0, 478, 960, 478, 4); };
    function jump() { if (finished) return; ['moody', 'aboody'].forEach((k, i) => { if (jumps[k] === 0) { setTimeout(() => { if (jumps[k] === 0) { jumps[k] = 1; vy[k] = 620; } }, i * 60); } }); ctx.sfx('boing'); sk.poke(); }
    st.input = { down() { jump(); return true; } }; const kh = e => { if (e.key === ' ' || e.key === 'ArrowUp') { jump(); return true; } return false; }; M.keys.push(kh); cl(() => { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); });
    cl(st.addLayer({
      z: 5,
      update(dt) {
        started += dt; const sp = base * (slow > 0 ? .45 : 1) * (hits >= 3 ? .8 : 1); if (slow > 0) slow -= dt; scroll += sp * dt;
        ['moody', 'aboody'].forEach(k => { const hh = st.heroes[k]; if (jumps[k]) { hh.jy += vy[k] * dt; vy[k] -= 1700 * dt; if (hh.jy <= 0) { hh.jy = 0; jumps[k] = 0; } hh.fa = 'jump'; hh.fat = .1; } else if (slow <= 0) { hh.fa = 'run'; hh.fat = .1; } hh.t += dt; });
        obs.forEach(ob => { const sx = 340 + (ob.x - scroll); if (!ob.hit && sx < 340 + 30 && sx > 200 - 30) { const mj = st.heroes.moody.jy, aj = st.heroes.aboody.jy; if ((sx > 310 && mj < ob.h) || (sx < 270 && aj < ob.h)) { ob.hit = true; hits++; slow = .8; ctx.sfx('wrong'); st.shake(5); st.play('moody', 'oops', .8); st.play('aboody', 'oops', .8); sk.fail(); } } });
        cols.forEach(c => { const sx = 340 + (c.x - scroll); if (!c.got && sx < 380 && sx > 190 && Math.abs((470 - st.heroes.moody.jy - 40) - c.y) < 90) { c.got = true; stars++; ctx.sfx('coin'); st.burst(sx, c.y, { n: 6, kind: 'spark' }); } });
        if (scroll >= L && !finished) { finished = true; ctx.sfx('fanfare'); st.confetti(); ctx.react('good', 'both'); M.wait(1.6).then(() => done({ hits, stars })); }
        st.dbg = { kit: 'runner', scroll, L, hits };
        if (finished) scroll = L;
      },
      draw(g, t) {
        cols.forEach(c => { const sx = 340 + (c.x - scroll); if (!c.got && sx > -30 && sx < 990) A.draw(g, 'star', sx, c.y + Math.sin(t * 5 + c.x) * 4, 34); });
        obs.forEach(ob => { const sx = 340 + (ob.x - scroll); if (sx > -60 && sx < 1020) { G.shadow(g, sx, 476, 26, 6); A.draw(g, ob.art, sx, 478 - 30 * (ob.h / 46), 60 * (ob.h / 46 + .2)); } });
        const fx = 340 + (L - scroll); if (fx < 1000) { G.fillRR(g, fx - 6, 270, 12, 210, 3, '#fff', 3.5); for (let i = 0; i < 8; i++) for (let j = 0; j < 2; j++) { g.fillStyle = (i + j) % 2 ? '#222' : '#fff'; g.fillRect(fx - 40 + j * 40, 270 + i * 12, 40, 12); } G.text(g, 'وصلنا!', fx, 250, { size: 34, color: '#fff', stroke: M.OL, sw: 7 }); }
        if (started < 3.5) G.text(g, 'دوس في أي مكان عشان تقفز!', 480, 150, { size: 34, color: '#fff', stroke: M.OL, sw: 7 });
        G.fillRR(g, 280, 500, 400, 14, 7, 'rgba(255,255,255,.7)', 2.5); G.circ(g, 280 + 400 * Math.min(1, scroll / L), 507, 10, '#ff8a2a', 3);
        G.text(g, U.ar(stars), 90, 120, { size: 30, color: '#fff', stroke: M.OL, sw: 6 }); A.draw(g, 'star', 130, 120, 36);
      }
    }));
    cl(() => { st.bg = oldBg; st.input = null; st.dbg = null; ['moody', 'aboody'].forEach(k => { st.heroes[k].jy = 0; st.heroes[k].fa = null; st.heroes[k].fat = 0; }); });
  };

  /* ================= LANES (catch good things, dodge bad ones) ================= */
  K.lanes = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), nl = o.lanes || 3, goal = o.goal || 8, who = o.who || st.active; ctx.heroes('hidden'); if (o.prompt) ctx.prompt(o.prompt);
    const laneX = i => 480 + (i - (nl - 1) / 2) * 190; let lane = Math.floor(nl / 2), px = laneX(lane), caught = 0, hits = 0, tm = 0, finished = false; const things = [], oldBg = st.bg;
    if (o.bg) st.bg = o.bg;
    st.input = { down(x, y) { let best = 0, bd = 1e9; for (let i = 0; i < nl; i++) if (Math.abs(x - laneX(i)) < bd) { bd = Math.abs(x - laneX(i)); best = i; } lane = best; sk.poke(); ctx.sfx('click'); return true; } };
    const kh = e => { if (e.key === 'ArrowLeft') { lane = Math.max(0, lane - 1); return true; } if (e.key === 'ArrowRight') { lane = Math.min(nl - 1, lane + 1); return true; } return false; }; M.keys.push(kh); cl(() => { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); });
    cl(st.addLayer({
      z: 5, update(dt) {
        tm += dt; px += (laneX(lane) - px) * Math.min(1, dt * 10); if (tm > (o.every || .9) && !finished) { tm = 0; const good = Math.random() < .6; things.push({ lane: U.rndi(0, nl - 1), y: 80, good, art: U.pick(good ? o.good : o.bad) }); }
        things.forEach(t => { t.y += (o.speed || 230) * dt; if (!t.done && t.y > 440 && t.y < 500 && t.lane === lane) { t.done = true; if (t.good) { caught++; ctx.sfx('coin'); st.burst(px, 440, { n: 8, kind: 'star' }); st.float('+١', px, 400); } else { hits++; ctx.sfx('wrong'); st.play(who, 'oops', .6); } } });
        for (let i = things.length - 1; i >= 0; i--) if (things[i].y > 580 || things[i].done) things.splice(i, 1);
        if (caught >= goal && !finished) { finished = true; ctx.react('good', 'both'); M.wait(1).then(() => done({ caught, hits })); }
        st.dbg = { kit: 'lanes', caught };
      },
      draw(g, t) {
        for (let i = 0; i < nl; i++) { g.fillStyle = 'rgba(255,255,255,.18)'; g.fillRect(laneX(i) - 80, 130, 160, 400); }
        things.forEach(t => A.draw(g, t.art, laneX(t.lane), t.y, 70));
        M.chars.draw(g, who, px, 520, { anim: (hits && tm < .3) ? 'oops' : 'run', t: st.t, sc: .9 });
        G.fillRR(g, 380, 74, 200, 14, 7, 'rgba(255,255,255,.7)', 2.5); G.fillRR(g, 380, 74, 200 * Math.min(1, caught / goal), 14, 7, '#5cc96b', 2.5);
      }
    }));
    cl(() => { st.bg = oldBg; st.input = null; st.dbg = null; st.layout('floor'); });
  };

  /* ================= RITUAL (a big tap: bismillah / alhamdulillah / thanks) ================= */
  K.ritual = function (ctx, o, done, cl) {
    let fin = false; const b = h('button', { class: 'btn big pink shine' + (o.tone === 'call' ? ' call' : ''), 'aria-label': o.text, style: 'position:absolute;left:0;right:0;margin:0 auto;width:fit-content;bottom:' + (o.bottom == null ? 150 : o.bottom) + 'px;animation:pulse 1.2s infinite;font-size:54px;min-height:120px;z-index:4;white-space:nowrap' }, o.icon ? UI.i(o.icon, 54) : null, h('span', { style: 'display:block;text-align:center;line-height:1.1' }, o.text, o.sub ? h('small', null, M.fmt(o.sub)) : null));
    b.onclick = () => { if (fin) return; fin = true; ctx.sfx('bell'); UI.sparkEl && UI.sparkEl(b, { n: 14, r: 120 }); ctx.stage.burst(480, 360, { n: 18, kind: 'spark', max: 300 }); ctx.stage.play(o.who || 'moody', 'cheer', 1); ctx.stage.play(ctx.stage.other(o.who || 'moody').id, 'cheer', 1); b.remove(); M.wait(.9).then(() => done({})); };
    UI.over.append(b); cl(() => b.remove());
    ctx.stage.dbg = { kit: 'ritual' }; cl(() => { ctx.stage.dbg = null; });
  };

  /* ================= TAP-COUNT puzzle (visual counting) - thin helper over quiz ================= */
})();
