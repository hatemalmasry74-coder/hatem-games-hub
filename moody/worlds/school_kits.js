/* Moody & Aboody - worlds/school_kits.js : school-specific mini-game kits (registered into Moody.kits, no engine edits).
   grow (plant lab), magnet (magnet lab), tiptoe (quiet steps), cheer (rhythm cheering), crossing (traffic-light crossing). */
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, G = M.gfx, U = M.util, A = M.art, K = M.kits, h = UI.h;
  const say = (ctx, who, msg) => ctx.stage.bubble(who, msg, 2.2);

  /* ================= GROW: keep a seedling happy with water and sun ================= */
  K.grow = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    let water = 45, light = 45, growth = 0, finished = false, flood = 0, burn = 0, drops = [];
    const LO = 28, HI = 82;
    const add = k => { if (finished) return; sk.poke(); if (k === 'w') { water = Math.min(100, water + 20); ctx.sfx('splash'); for (let i = 0; i < 6; i++) drops.push({ x: 480 + U.rnd(-18, 18), y: 190, vy: U.rnd(120, 200) }); if (water > HI + 8) { flood = 1.6; say(ctx, 'aboody', 'كتير أوي! الماية كتيرة على النبتة'); sk.fail(); } } else { light = Math.min(100, light + 20); ctx.sfx('pop'); if (light > HI + 8) { burn = 1.6; say(ctx, 'moody', 'الشمس قوية أوي! نهدّيها شوية'); sk.fail(); } } };
    const bar = h('div', { class: 'bar2' }, UI.btn('ماية', 'blue big', () => add('w'), 'water'), UI.btn('شمس', 'yellow big', () => add('l'), 'lampsun')); bar.firstChild.setAttribute('data-act', 'w'); bar.lastChild.setAttribute('data-act', 'l');
    UI.over.append(bar); cl(() => bar.remove());
    cl(st.addLayer({
      z: 10, update(dt) {
        if (finished) return; water = Math.max(0, water - 3.4 * dt); light = Math.max(0, light - 3.4 * dt); if (flood > 0) flood -= dt; if (burn > 0) burn -= dt;
        const ok = water >= LO && water <= HI && light >= LO && light <= HI; if (ok) growth += 13 * dt; else growth = Math.max(0, growth - 2 * dt);
        drops.forEach(d => { d.y += d.vy * dt; }); drops = drops.filter(d => d.y < 330);
        if (growth >= 100) { finished = true; ctx.sfx('fanfare'); st.burst(480, 220, { n: 24, kind: 'star' }); ctx.react('good', 'both'); M.wait(1.5).then(() => done({})); }
        st.dbg = { kit: 'grow', water, light, growth, lo: LO, hi: HI };
      },
      draw(g, t) {
        G.fillRR(g, 200, 104, 560, 300, 26, 'rgba(255,247,227,.88)', 4);
        const stage = Math.min(3, Math.floor(growth / 33.4));
        // light bar (right) and water bar (left)
        const meter = (x, val, col, label) => { G.fillRR(g, x - 22, 150, 44, 200, 14, '#fff', 4); g.save(); G.rr(g, x - 20, 152, 40, 196, 12); g.clip(); g.fillStyle = col; g.fillRect(x - 20, 350 - val * 1.96, 40, val * 1.96); g.restore(); g.fillStyle = 'rgba(92,201,107,.35)'; g.fillRect(x - 28, 350 - HI * 1.96, 56, (HI - LO) * 1.96); g.strokeStyle = '#2f8a44'; g.lineWidth = 3; g.strokeRect(x - 28, 350 - HI * 1.96, 56, (HI - LO) * 1.96); G.text(g, label, x, 128, { size: 24 }); };
        meter(270, water, '#4aa8e8', 'الماية'); meter(690, light, '#ffc93c', 'الشمس');
        const k = (flood > 0 ? Math.sin(t * 30) * 3 : 0);
        G.sun(g, 600, 168, 22 + light * .12, t);
        A.draw(g, 'seedling', 480 + k, 290, 170, { stage }); G.ell(g, 480, 332, 56, 8, 'rgba(60,30,10,.18)', 0);
        drops.forEach(d => G.ell(g, d.x, d.y, 5, 8, '#4aa8e8', 2));
        G.fillRR(g, 380, 116, 200, 14, 7, 'rgba(255,255,255,.8)', 2.5); G.fillRR(g, 380, 116, 200 * Math.min(1, growth / 100), 14, 7, '#5cc96b', 2.5);
        if (growth > 0 && growth < 99 && Math.sin(t * 6) > 0 && water >= LO && light >= LO) G.sparkle(g, 520, 250 - stage * 14, 9, '#fff6a8');
      }
    }));
    cl(() => { st.dbg = null; });
  };

  /* ================= MAGNET: drag a magnet over objects, iron things jump to it ================= */
  K.magnet = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const items = o.items.map(i => Object.assign({ s: 56, iron: false, stuck: false, wob: 0, vx: 0, ox: i.x, oy: i.y }, i)), mg = { x: 480, y: 160, on: false, id: null, shown: false };
    const need = items.filter(i => i.iron).length; let got = 0, finished = false, told = {};
    st.input = {
      down(x, y, id) { mg.on = true; mg.id = id; mg.x = x; mg.y = y; sk.poke(); return true; },
      move(x, y, id) { if (mg.on && mg.id === id) { mg.x = U.clamp(x, 40, 920); mg.y = U.clamp(y, 100, 420); } },
      up(x, y, id) { if (mg.id === id) mg.on = false; }
    };
    cl(st.addLayer({
      z: 10, update(dt) {
        items.forEach(it => {
          if (it.wob > 0) it.wob -= dt; if (it.stuck) { it.x += (mg.x + it.sx - it.x) * Math.min(1, dt * 12); it.y += (mg.y + 34 + it.sy - it.y) * Math.min(1, dt * 12); return; }
          const d = U.dist(mg.x, mg.y + 20, it.x, it.y);
          if (d < 70 && mg.on) {
            if (it.iron) { it.stuck = true; it.sx = U.rnd(-18, 18); it.sy = got * 6 + U.rnd(0, 6); got++; ctx.sfx('pick'); st.burst(it.x, it.y, { n: 8, kind: 'spark' }); sk.poke(); if (got >= need && !finished) { finished = true; ctx.react('good', 'both'); M.wait(1.1).then(() => done({ got })); } }
            else if (!told[it.id]) { told[it.id] = 1; it.wob = .8; ctx.sfx('wrong'); say(ctx, 'aboody', it.msg || 'ده مش بيتشدّ'); }
          }
        });
        st.dbg = { kit: 'magnet', mx: mg.x, my: mg.y, targets: items.filter(i => i.iron && !i.stuck).map(i => ({ id: i.id, x: i.x, y: i.y })), got, need };
      },
      draw(g, t) {
        G.fillRR(g, 90, 200, 780, 190, 24, 'rgba(255,247,227,.85)', 4);
        items.forEach(it => { const w = it.wob > 0 ? Math.sin(it.wob * 40) * 5 : 0; A.draw(g, it.art, it.x + w, it.y + (it.stuck ? 0 : Math.sin(t * 2 + it.ox) * 1.5), it.s); });
        g.save(); g.translate(mg.x, mg.y); g.rotate(mg.on ? Math.sin(t * 20) * .04 : 0); A.draw(g, 'magnet', 0, 0, 92); g.restore();
        for (let i = 0; i < need; i++) A.draw(g, i < got ? 'check' : 'question', 80 + i * 44, 130, 34);
      }
    }));
    cl(() => { st.input = null; st.dbg = null; });
  };

  /* ================= TIPTOE: tap when the noise needle is in the green zone to take a quiet step ================= */
  K.tiptoe = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); if (o.prompt) ctx.prompt(o.prompt);
    const steps = o.steps || 6, x0 = 120, x1 = 760; let n = 0, ph = 0, zone = .5, zw = .42, shake = 0, finished = false, fb = 0, busy = false;
    st.layout({ moody: { x: x0, y: 482, dir: 1 }, aboody: { x: x0 - 70, y: 492, dir: 1 } });
    const newZone = () => { zone = U.rnd(.3, .7); };
    function tapStep() {
      if (finished || busy) return; sk.poke(); const v = .5 + .5 * Math.sin(ph);
      if (Math.abs(v - zone) <= zw / 2) {
        n++; busy = true; ctx.sfx('pop'); fb = 1; const x = x0 + (x1 - x0) * n / steps; st.walk('moody', x, 482); st.walk('aboody', x - 70, 492).then(() => { busy = false; });
        st.float('هشش', x, 380, '#5cc96b'); newZone();
        if (n >= steps) { finished = true; ctx.react('good', 'both'); M.wait(1).then(() => done({ steps: n })); }
      } else { shake = .6; ctx.sfx('wrong'); fb = -1; sk.fail(); say(ctx, 'aboody', 'ششش.. بالراحة!'); }
    }
    st.input = { down() { tapStep(); return true; } }; const kh = e => { if (e.key === ' ') { tapStep(); return true; } return false; }; M.keys.push(kh); cl(() => { const i = M.keys.indexOf(kh); if (i >= 0) M.keys.splice(i, 1); });
    cl(st.addLayer({
      z: 10, update(dt) { ph += dt * 2.3; if (shake > 0) shake -= dt; if (fb) fb *= .96; st.dbg = { kit: 'tiptoe', v: .5 + .5 * Math.sin(ph), zone, zw, n, steps }; },
      draw(g, t) {
        const bx = 280, by = 185, bw = 400;
        G.fillRR(g, bx - 14, by - 22, bw + 28, 84, 20, 'rgba(255,247,227,.9)', 4); G.text(g, 'مقياس الصوت', 480, by - 8, { size: 20 });
        G.fillRR(g, bx, by + 10, bw, 26, 13, '#ffd0c4', 3.5); g.save(); G.rr(g, bx, by + 10, bw, 26, 13); g.clip(); g.fillStyle = '#7fd98a'; g.fillRect(bx + (zone - zw / 2) * bw, by + 10, zw * bw, 26); g.restore(); G.rr(g, bx, by + 10, bw, 26, 13); g.lineWidth = 3.5; g.strokeStyle = M.OL; g.stroke();
        const v = .5 + .5 * Math.sin(ph); G.circ(g, bx + v * bw, by + 23, 16, Math.abs(v - zone) <= zw / 2 ? '#33c25a' : '#ef5350', 4);
        G.text(g, 'دوس لما الدايرة تبقى في الأخضر', 480, by + 52, { size: 18, color: '#7a4a2a' });
        for (let i = 0; i < steps; i++) A.draw(g, i < n ? 'check' : 'question', 330 + i * 60, 295, 32);
        A.draw(g, 'sleepz', 830, 370 - Math.sin(t * 2) * 4, 54); if (shake > 0) { g.save(); g.globalAlpha = .6; G.text(g, '!!', 830 + Math.sin(t * 50) * 4, 330, { size: 36, color: '#ef5350' }); g.restore(); }
        G.text(g, 'الفار النايم', 830, 410, { size: 16, color: '#fff', stroke: M.OL, sw: 4 });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; });
  };

  /* ================= CHEER: rhythm - tap when the ring reaches the pom-pom to cheer for the other team ================= */
  K.cheer = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); if (o.prompt) ctx.prompt(o.prompt); ctx.heroes('corner');
    const N = o.beats || 8, xs = [300, 480, 660]; const beats = []; for (let i = 0; i < N; i++) beats.push({ x: xs[i % 3], y: 190, t0: 1.2 + i * 1.5, res: 0 });
    let tm = 0, hit = 0, finished = false, pos = 0, rival = 0;
    const DUR = 1.3; // ring lifetime
    function tapAt(x, y) {
      sk.poke(); let best = null; beats.forEach(b => { const p = (tm - b.t0 + DUR) / DUR; if (!b.res && p > .45 && p < 1.5 && U.dist(x, y, b.x, b.y) < 80) { if (!best || Math.abs(p - 1) < Math.abs((tm - best.t0 + DUR) / DUR - 1)) best = b; } });
      if (best) { const p = (tm - best.t0 + DUR) / DUR; best.res = Math.abs(p - 1) < .3 ? 2 : 1; hit++; pos += 1; ctx.sfx('coin'); st.burst(best.x, best.y, { n: 10, kind: 'star' }); st.float(best.res === 2 ? 'ممتاز!' : 'حلو!', best.x, best.y - 40, '#ffc93c'); }
      else { ctx.sfx('click'); }
    }
    st.input = { down(x, y) { tapAt(x, y); return true; } };
    cl(st.addLayer({
      z: 10, update(dt) {
        tm += dt; rival += dt * .35; beats.forEach(b => { if (!b.res && tm - b.t0 > .6) b.res = -1; });
        if (!finished && tm > beats[N - 1].t0 + 1.3) { finished = true; ctx.react('good', 'both'); M.wait(1).then(() => done({ hit, beats: N })); }
        st.dbg = { kit: 'cheer', ready: beats.filter(b => !b.res && (tm - b.t0 + DUR) / DUR > .8 && (tm - b.t0 + DUR) / DUR < 1.2).map(b => ({ x: b.x, y: b.y })), hit };
      },
      draw(g, t) {
        // track with the other team runner
        G.fillRR(g, 90, 300, 780, 90, 20, '#d8b07a', 4); for (let i = 0; i < 5; i++) G.line(g, 90, 330 + i * 12, 870, 330 + i * 12, 2, 'rgba(255,255,255,.4)');
        const rx = 130 + Math.min(.92, rival * .1 + pos / N * .75) * 700; A.draw(g, 'kid:#4a8dff', rx, 350, 78); G.text(g, 'فريق الأصدقاء', rx, 296, { size: 18, color: '#2b3a67' });
        G.fillRR(g, 840, 310, 12, 70, 3, '#fff', 3); G.text(g, 'النهاية', 846, 300, { size: 16 });
        beats.forEach(b => {
          const p = (tm - b.t0 + DUR) / DUR; if (b.res > 0) { A.draw(g, 'pompom', b.x, b.y, 80 + Math.sin(t * 20) * 4); return; } if (b.res < 0 || p < 0) return;
          G.circ(g, b.x, b.y, 38, 'rgba(255,255,255,.7)', 3.5); A.draw(g, 'pompom', b.x, b.y, 62); g.beginPath(); g.arc(b.x, b.y, 38 + (1 - Math.min(1.2, p)) * 90, 0, 6.3); g.lineWidth = 7; g.strokeStyle = '#ff6f91'; g.stroke();
        });
        G.text(g, U.ar(hit) + ' / ' + U.ar(N), 880, 130, { size: 30, color: '#fff', stroke: M.OL, sw: 6 });
      }
    }));
    cl(() => { st.input = null; st.dbg = null; });
  };

  /* ================= CROSSING: wait for the walking light, look both ways, cross ================= */
  K.crossing = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o); if (o.prompt) ctx.prompt(o.prompt);
    st.layout({ moody: { x: 450, y: 488, dir: 1 }, aboody: { x: 540, y: 496, dir: 1 } });
    let tm = 0, looked = { l: false, r: false }, cars = [], spawn = 0, crossed = false, finished = false;
    const RED = 5.5, GREEN = 6.5, cyc = () => tm % (RED + GREEN), green = () => cyc() >= RED;
    const lane = [{ y: 398, dir: 1, stop: 355 }, { y: 440, dir: -1, stop: 625 }];
    const clear = () => !cars.some(c => c.x > 300 && c.x < 700);
    const warn = (who, msg) => { say(ctx, who, msg); sk.fail(); };
    const eye = (side) => { looked[side] = true; ctx.sfx('click'); say(ctx, side === 'l' ? 'moody' : 'aboody', side === 'l' ? 'بصّيت شمال: تمام' : 'بصّيت يمين: تمام'); };
    const bl = UI.btn('بُص شمال', 'blue', () => eye('l')), br = UI.btn('بُص يمين', 'blue', () => eye('r')), bc = UI.btn('نعدّي', 'green big', () => {
      if (crossed) return; if (!green()) { warn('moody', 'الإشارة لسه حمرا.. نستنى'); return; } if (!(looked.l && looked.r)) { warn('aboody', 'الأول نبُص شمال ويمين'); return; } if (!clear()) { warn('moody', 'في عربية لسه معدّية.. استنى'); return; }
      crossed = true; ctx.sfx('good'); const tl = st.walk('moody', 450, 345); st.walk('aboody', 540, 350); tl.then(() => { ctx.react('good', 'both'); M.wait(.9).then(() => { if (!finished) { finished = true; done({}); } }); });
    }, 'check'); bl.setAttribute('data-act', 'l'); br.setAttribute('data-act', 'r'); bc.setAttribute('data-act', 'go');
    const bar = h('div', { class: 'bar2', style: 'bottom:auto;top:84px' }, bl, bc, br); UI.over.append(bar); cl(() => bar.remove());
    const COLS = ['#ef5350', '#4a8dff', '#ffd23c', '#8a6bd6', '#ff8a2a'];
    cl(st.addLayer({
      z: 3, update(dt) {
        tm += dt; spawn -= dt;
        if (spawn <= 0 && !crossed) { const L = U.pick(lane); const x = L.dir > 0 ? -60 : 1020; if (!cars.some(c => c.lane === L && Math.abs(c.x - x) < 200) && !green()) { cars.push({ lane: L, x, v: 0, col: U.pick(COLS) }); } spawn = U.rnd(.7, 1.5); }
        cars.forEach(c => {
          const L = c.lane; let target = 190; const front = c.x + L.dir * 44; const ahead = cars.find(o2 => o2 !== c && o2.lane === L && (o2.x - c.x) * L.dir > 0 && (o2.x - c.x) * L.dir < 150);
          if (ahead) target = Math.min(target, ahead.v * .9); if (green() && (L.stop - front) * L.dir > -4 && (L.stop - front) * L.dir < 120) target = 0;
          if (green() && (L.stop - front) * L.dir >= 0 && (L.stop - front) * L.dir < 14) target = 0;
          c.v += (target - c.v) * Math.min(1, dt * 3); c.x += L.dir * c.v * dt;
        });
        cars = cars.filter(c => c.x > -100 && c.x < 1060);
        st.dbg = { kit: 'crossing', green: green(), clear: clear(), looked: Object.assign({}, looked) };
      },
      draw(g, t) {
        cars.forEach(c => { g.save(); g.translate(c.x, c.lane.y); if (c.lane.dir < 0) g.scale(-1, 1); G.shadow(g, 0, 26, 40, 6); A.draw(g, 'carside:' + c.col, 0, 0, 96); g.restore(); });
        const gr = green();
        A.draw(g, 'trafficlight:' + (gr ? 'red' : 'green'), 150, 290, 76); A.draw(g, 'walkman:' + (gr ? 'go' : 'stop'), 810, 290, 80);
        G.text(g, gr ? 'ماشي: اعدّي' : 'قف: استنى', 810, 346, { size: 20, color: gr ? '#1f8a3c' : '#c62828', stroke: '#fff', sw: 5 });
        [['l', 330], ['r', 570]].forEach(e => { if (looked[e[0]]) A.draw(g, 'check', e[1], 330, 28); });
      }
    }));
    cl(() => { st.dbg = null; });
  };
})();
