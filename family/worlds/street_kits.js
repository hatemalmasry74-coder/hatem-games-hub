/* Family Adventures - worlds/street_kits.js : extra reusable mini-game kits used by the STREET (3) and MARKET (4) worlds.
   Registered the standard way:  Moody.kits.name = function (ctx, opts, done, cleanup) -> used as  await ctx.games.name(opts).
     st_cross  {prompt}                      safe road crossing (button, look both ways, hold hands, walk)  -> {mistakes}
     st_phone  {digits, show, title}          memorise a (pretend) phone number then key it in               -> {tries}
     mk_maze   {tier, goalArt, prompt}        crowd / market-aisle maze, tap where to go                     -> {stars, bumps}
     mk_money  {target, denoms, head, sub}    build an amount of money from notes and coins                  -> {tries}
*/
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, G = M.gfx, U = M.util, A = M.art, K = M.kits, h = UI.h, ico = UI.ico;
  const ar = U.ar;

  /* ================= CROSSING ================= */
  K.st_cross = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), S = st.state;
    ctx.heroes({ moody: { x: 420, y: 486, dir: 1 }, aboody: { x: 520, y: 496, dir: 1 } });
    ctx.prompt(o.prompt || 'اضغط الزرار، بص شمال ويمين، وامسك إيد {a}');
    const mo = st.hero('moody'), ab = st.hero('aboody');
    let phase = 'cars', pt = 0, want = false, looked = { l: false, r: false }, hand = false, walking = false, finished = false, late = null, spawn = 0.5, lane = 0, lateDone = false, mistakes = 0, msgT = 0;
    S.pl = 'red'; S.cl = 'green'; S.btn = false;
    const cars = [], LANES = [{ y: 338, dir: 1 }, { y: 412, dir: -1 }], STOP = [372, 590];
    const kinds = [['st_car', { c: '#ef5350' }, 120], ['st_car', { c: '#4a8dff' }, 120], ['st_micro', {}, 128], ['st_tuktuk', {}, 104], ['st_car', { c: '#ffd23c' }, 120], ['st_car', { c: '#5cc96b' }, 120]];
    function addCar(li, special) { const k = U.pick(kinds), L = LANES[li]; const c = { x: L.dir > 0 ? -90 : 1050, y: L.y, dir: L.dir, art: k[0], o: k[1], w: k[2], v: 0, v0: special ? 340 : U.rnd(180, 250), special: !!special }; if (special) { c.art = 'st_tuktuk'; c.o = {}; c.w = 104; c.v = 340; } cars.push(c); return c; }
    for (let i = 0; i < 2; i++) { const c = addCar(i); c.x = L0(i); c.v = c.v0 * c.dir; }
    function L0(i) { return LANES[i].dir > 0 ? 120 + i * 100 : 800; }
    const say = (who, t, d) => { st.bubble(who, t, d || 2.2); };
    function stopping() { return phase !== 'cars'; }
    const bar = h('div', { class: 'bar2', style: 'gap:6px;left:164px;right:8px;z-index:2' });
    const mkb = (act, art, txt, cls) => { const b = h('button', { class: 'btn sm ' + (cls || 'blue'), 'data-act': act, 'data-base': cls || 'blue', style: 'padding:4px 10px;min-height:66px;font-size:19px;gap:5px' }, ico(art, 36), txt); bar.append(b); return b; };
    const bBtn = mkb('btn', 'st_pbutton', 'اضغط الزرار', 'yellow'), bL = mkb('lookL', 'st_eye:l', 'بص شمال'), bR = mkb('lookR', 'st_eye:r', 'بص يمين'), bH = mkb('hand', 'st_hands', 'امسك إيد {a}'.replace('{a}', M.save.data.names.aboody), 'pink'), bW = mkb('walk', 'arrow', 'امشي', 'green');
    bW.querySelector('canvas').style.transform = 'rotate(90deg)';
    bW.style.minWidth = '100px'; bW.style.fontSize = '24px';
    UI.over.append(bar); cl(() => bar.remove());
    const mark = (b, on) => { b.classList.remove(b.dataset.base, 'green'); b.classList.add(on ? 'green' : b.dataset.base); };
    function resetLooks() { looked.l = looked.r = false; mark(bL, false); mark(bR, false); }
    function carsNear(side) { return cars.some(c => (side === 'l' ? c.dir > 0 && c.x < 392 && c.x > -60 : c.dir < 0 && c.x > 568 && c.x < 1000)); }
    bBtn.onclick = () => { sk.poke(); if (want || phase !== 'cars') { say('moody', 'ضغطنا الزرار.. نستنى الإشارة', 1.8); return; } want = true; S.btn = true; ctx.sfx('click'); mark(bBtn, true); say('aboody', 'ضغطنا الزرار! نستنى العربيات تقف', 2.4); };
    bL.onclick = () => { sk.poke(); mo.dir = ab.dir = -1; looked.l = true; mark(bL, true); ctx.sfx('pop'); say('moody', carsNear('l') ? 'في عربيات جاية من الشمال!' : 'الشمال فاضي', 1.8); };
    bR.onclick = () => { sk.poke(); mo.dir = ab.dir = 1; looked.r = true; mark(bR, true); ctx.sfx('pop'); say('aboody', carsNear('r') ? 'في عربية جاية من اليمين!' : 'اليمين فاضي', 1.8); };
    bH.onclick = () => { sk.poke(); if (hand) return; hand = true; mark(bH, true); ctx.sfx('good'); st.walk('aboody', mo.x + 66, 490); st.burst(mo.x + 33, mo.y - 60, { n: 8, kind: 'heart' }); say('moody', 'ماسك إيدك يا {a}.. إيدي في إيدك', 2.4); };
    bW.onclick = () => {
      sk.poke(); if (walking || finished) return;
      if (!hand) { say('aboody', 'مسّك إيدي يا {m}!', 2.2); pulse(bH); return; }
      if (phase !== 'ped') { mistakes++; sk.fail(); ctx.sfx('boing'); ctx.sfx('honk'); say('moody', want ? 'الإشارة لسه حمرا للمشاة.. نستنى' : 'لسه.. اضغط الزرار الأول', 2.4); pulse(want ? bW : bBtn); return; }
      if (!(looked.l && looked.r)) { say('moody', 'حتى والإشارة خضرا.. بص شمال ويمين الأول', 2.6); pulse(looked.l ? bR : bL); return; }
      if (lateOn()) { mistakes++; sk.fail(); ctx.sfx('boing'); ctx.sfx('honk'); say('aboody', 'استنى! في عربية لسه جاية!', 2.2); return; }
      go();
    };
    function pulse(b) { b.style.animation = 'none'; void b.offsetWidth; b.style.animation = 'pulse .6s 3'; }
    function lateOn() { return late && late.x + 60 > 392 && late.x < 1100; }
    function go() {
      walking = true; S.pl = 'green'; mo.speed = ab.speed = 120; ctx.prompt('بالراحة.. إيد في إيد'); ctx.sfx('whoosh');
      st.walk('moody', 452, 276); st.walk('aboody', 518, 286).then(() => {
        mo.speed = ab.speed = 230; finished = true; ctx.sfx('fanfare'); ctx.react('good', 'both'); st.burst(480, 250, { n: 16, kind: 'star' });
        M.wait(1.1).then(() => done({ mistakes }));
      });
    }
    cl(() => { mo.speed = ab.speed = 230; });
    cl(st.addLayer({
      z: -1,
      update(dt) {
        pt += dt; msgT += dt;
        // phases
        if (phase === 'cars' && want && pt > 3) { phase = 'yellow'; pt = 0; S.cl = 'yellow'; }
        else if (phase === 'yellow' && pt > 1.4) { phase = 'ped'; pt = 0; S.cl = 'red'; S.pl = 'green'; resetLooks(); ctx.sfx('bell'); say('moody', 'الإشارة بقت خضرا للمشاة!', 2.4); if (!lateDone) { lateDone = true; late = addCar(1, true); late.x = 1060; } }
        else if (phase === 'ped' && !walking && pt > 26) { phase = 'cars'; pt = 0; want = false; S.btn = false; S.cl = 'green'; S.pl = 'red'; mark(bBtn, false); say('moody', 'الإشارة اتغيّرت.. نضغط الزرار تاني', 2.6); }
        // spawn
        spawn -= dt; if (spawn <= 0 && !stopping()) { spawn = U.rnd(1.1, 2); const li = (lane++) % 2, lastSame = cars.filter(c => c.dir === LANES[li].dir).sort((a, b) => LANES[li].dir > 0 ? a.x - b.x : b.x - a.x)[0]; if (!lastSame || Math.abs(lastSame.x - (LANES[li].dir > 0 ? -90 : 1050)) > 190) addCar(li); }
        // cars
        cars.forEach(c => {
          let want_v = c.v0;
          if (c.special) want_v = 340; else if (stopping()) { const si = c.dir > 0 ? 0 : 1, front = c.x + c.dir * c.w / 2, gap = c.dir > 0 ? STOP[0] - front : front - STOP[1]; if (gap > -6) want_v = U.clamp(gap * 2.4, 0, c.v0); }
          const ahead = cars.filter(d => d !== c && d.dir === c.dir && (c.dir > 0 ? d.x > c.x : d.x < c.x)).sort((a, b) => Math.abs(a.x - c.x) - Math.abs(b.x - c.x))[0];
          if (ahead && !c.special) { const gap2 = Math.abs(ahead.x - c.x) - (ahead.w + c.w) / 2 - 22; want_v = Math.min(want_v, Math.max(0, gap2 * 3)); }
          const cur = Math.abs(c.v); const nv = cur + U.clamp(want_v - cur, -520 * dt, 300 * dt); c.v = nv * c.dir; c.x += c.v * dt;
        });
        for (let i = cars.length - 1; i >= 0; i--) if (cars[i].x < -160 || cars[i].x > 1160) { if (cars[i] === late) late = null; cars.splice(i, 1); }
        // hero scale by depth
        [mo, ab].forEach(hh => { hh.sc = .76 + .24 * U.clamp((hh.y - 262) / (486 - 262), 0, 1); });
        if (hand && !walking) { const tx = mo.x + 66; if (Math.abs(ab.x - tx) > 4 && ab.tx == null) st.walk('aboody', tx, 490); }
        st.dbg = { kit: 'st_cross', phase, want, hand, looked: { l: looked.l, r: looked.r }, late: !!lateOn(), walking };
      },
      draw(g, t) {
        cars.forEach(c => { g.save(); g.translate(c.x, c.y); if (c.dir < 0) g.scale(-1, 1); G.shadow(g, 0, 28, c.w * .42, 6, .25); A.draw(g, c.art, 0, 0, c.w, c.o); g.restore(); });
        if (hand) { const x = (mo.x + ab.x) / 2 + 8, y = (mo.y * .5 + ab.y * .5) - 56 * mo.sc; A.draw(g, 'st_hands', x, y, 34 * mo.sc + 8); }
        if (late && lateOn() && !walking) { g.save(); g.globalAlpha = .6 + .4 * Math.sin(t * 10); G.text(g, '!', Math.min(900, late.x), late.y - 62, { size: 40, color: '#ef5350', stroke: '#fff', sw: 6 }); g.restore(); }
      }
    }));
    cl(() => { st.dbg = null; });
  };

  /* ================= PHONE NUMBER MEMORY ================= */
  K.st_phone = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), digits = String(o.digits), n = digits.length; let entered = '', tries = 0, phase = 'show', left = o.show || 8, iv = null, finished = false;
    ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const fmtNum = s => { const a = ar(s); return n > 4 ? a.slice(0, 4) + ' ' + a.slice(4) : a; };
    const card = h('div', { style: 'direction:ltr;background:#fff;border:5px solid var(--line);border-radius:22px;padding:6px 22px;font:bold 54px Tahoma,Arial,sans-serif;letter-spacing:5px;min-height:80px;display:flex;align-items:center;justify-content:center;gap:16px;min-width:360px' });
    const head = h('div', { style: 'font-size:24px;font-weight:bold;margin-bottom:6px' }, o.title || 'رقم موبايل بابا (للتمرين)');
    const bar = h('div', { class: 'pbar', style: 'margin:8px auto;width:300px;height:20px' }, h('i', { style: 'width:100%;background:#4a8dff' }));
    const readyBtn = UI.btn('حفظته!', 'green sm', () => hideIt(), 'check'); readyBtn.setAttribute('data-act', 'ready');
    const keys = h('div', { style: 'display:none;grid-template-columns:repeat(5,80px);gap:8px;justify-content:center;margin-top:8px' });
    for (let i = 1; i <= 10; i++) { const d = i % 10; const b = h('button', { class: 'btn blue', 'data-key': d, style: 'min-height:66px;padding:0;font-size:36px;width:80px;border-radius:20px' }, ar(d)); b.onclick = () => press(String(d)); keys.append(b); }
    const back = h('button', { class: 'btn gray', 'data-act': 'del', style: 'grid-column:span 2;min-height:66px;font-size:26px;padding:0;border-radius:20px' }, 'امسح'); back.onclick = () => { entered = entered.slice(0, -1); ctx.sfx('click'); render(); };
    const ok = h('button', { class: 'btn green', 'data-act': 'ok', style: 'grid-column:span 3;min-height:66px;font-size:28px;padding:0;border-radius:20px' }, 'تمام'); ok.onclick = () => check();
    keys.append(back, ok);
    const el = h('div', { class: 'panel', style: 'position:absolute;left:50%;top:84px;transform:translateX(-50%);padding:10px 16px 12px;text-align:center;animation:popin .3s;z-index:2;width:520px' }, head, card, bar, readyBtn, keys);
    UI.over.append(el); cl(() => { el.remove(); clearInterval(iv); });
    function render() { if (phase === 'show') { card.textContent = fmtNum(digits); } else { const s = ar(entered).padEnd(0); card.textContent = ''; for (let i = 0; i < n; i++) card.append(h('span', { style: 'display:inline-block;min-width:34px;border-bottom:5px solid ' + (i < entered.length ? 'transparent' : '#b9a98a') + ';text-align:center' }, i < entered.length ? ar(entered[i]) : '')); } }
    function startShow(sec) { phase = 'show'; left = sec; keys.style.display = 'none'; readyBtn.style.display = ''; bar.style.display = ''; head.textContent = (o.title || 'رقم موبايل بابا (للتمرين)') + ' - احفظه'; render(); clearInterval(iv); const tot = sec; iv = setInterval(() => { if (M.paused) return; left -= .1; bar.firstChild.style.width = Math.max(0, left / tot * 100) + '%'; if (left <= 0) hideIt(); }, 100); }
    function hideIt() { if (phase !== 'type') { clearInterval(iv); phase = 'type'; entered = ''; keys.style.display = 'grid'; readyBtn.style.display = 'none'; bar.style.display = 'none'; head.textContent = 'دلوقتي اكتبه من الذاكرة'; render(); ctx.sfx('pop'); } }
    function press(d) { if (phase !== 'type' || finished) return; sk.poke(); if (entered.length < n) entered += d; ctx.sfx('tap'); render(); if (entered.length === n) check(); }
    function check() {
      if (phase !== 'type' || finished) return; if (entered.length < n) { st.bubble('moody', 'لسه ناقص أرقام', 1.6); return; }
      if (entered === digits) { finished = true; card.style.background = '#c9f5cf'; ctx.sfx('good'); ctx.react('good', 'both'); ctx.skill('memory'); M.wait(1.1).then(() => done({ tries: tries + 1 })); }
      else { tries++; sk.fail(); ctx.sfx('wrong'); card.style.animation = 'none'; void card.offsetWidth; card.style.animation = 'shake .4s'; st.bubble('aboody', 'قريب! بُص عليه تاني وحاول', 2); setTimeout(() => startShow(tries >= 2 ? 7 : 4.5), 700); }
    }
    startShow(o.show || 8);
    st.dbg = { kit: 'st_phone', digits }; cl(() => { st.dbg = null; });
  };

  /* ================= MARKET MAZE (crowd navigation) ================= */
  const MAPS = {
    6: { rows: ['S...#.......', '.##.#.#####.', '.#o.....o...', '.#######.##.', '....o.....oG'], shoppers: [{ r: 2, a: 4, b: 7, sp: 1.0 }, { r: 4, a: 5, b: 9, sp: .9 }] },
    9: { rows: ['S..#....#...', '##.#.##.#.#.', '...o.#...o#.', '.###.#.##...', '.o...#.#...G'], shoppers: [{ r: 2, a: 6, b: 9, sp: 1.2 }, { r: 3, a: 9, b: 11, sp: 1.0 }, { r: 4, a: 0, b: 4, sp: 1.1 }, { r: 0, a: 4, b: 7, sp: 1.3 }] }
  };
  K.mk_maze = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), tier = o.tier || M.tierFor(ctx.active), mp = MAPS[tier === 6 ? 6 : 9], CS = 72, X0 = 48, Y0 = 100, R = mp.rows.length, C = mp.rows[0].length;
    ctx.heroes('hidden'); ctx.prompt(o.prompt || 'اضغط على المكان اللي عايزين نروحه');
    const grid = mp.rows.map(r => r.split('')); let start = null, goal = null; const stars = [];
    grid.forEach((row, r) => row.forEach((ch, c) => { if (ch === 'S') { start = { r, c }; row[c] = '.'; } else if (ch === 'G') { goal = { r, c }; row[c] = '.'; } else if (ch === 'o') { stars.push({ r, c, got: false }); row[c] = '.'; } }));
    const cx = c => X0 + c * CS + CS / 2, cy = r => Y0 + r * CS + CS / 2, free = (r, c) => r >= 0 && c >= 0 && r < R && c < C && grid[r][c] !== '#';
    const bfs = (a, b) => { const q = [a], prev = {}, key = p => p.r * 100 + p.c; prev[key(a)] = null; while (q.length) { const p = q.shift(); if (p.r === b.r && p.c === b.c) { const path = []; let k = p; while (k) { path.unshift(k); k = prev[key(k)]; } return path; } [[0, 1], [0, -1], [1, 0], [-1, 0]].forEach(d => { const n = { r: p.r + d[0], c: p.c + d[1] }; if (free(n.r, n.c) && !(key(n) in prev)) { prev[key(n)] = p; q.push(n); } }); } return null; };
    if (!bfs(start, goal)) { for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) grid[r][c] = '.'; }
    const stallArts = ['apple', 'orange', 'tomato', 'banana', 'bread', 'carrot', 'cheese', 'cucumber'], stallCols = ['#ff6f91', '#4aa8e8', '#ffb347', '#5cc96b', '#8a6bd6', '#ef5350'];
    const pos = { x: cx(start.c), y: cy(start.r) }; let path = [], bumps = 0, finished = false, bumpT = 0, bumpCool = 0;
    const shop = mp.shoppers.map((s, i) => ({ r: s.r, a: s.a, b: s.b, sp: s.sp, p: Math.random(), dir: 1, art: ['mk_walker:ef5350', 'mk_walker:4a8dff:l', 'mk_walker:8a6bd6', 'mk_walker:ff8a2a:l'][i % 4] }));
    const cellOf = (x, y) => ({ r: U.clamp(Math.round((y - Y0 - CS / 2) / CS), 0, R - 1), c: U.clamp(Math.round((x - X0 - CS / 2) / CS), 0, C - 1) });
    st.input = {
      down(x, y) {
        const c = Math.floor((x - X0) / CS), r = Math.floor((y - Y0) / CS); if (!free(r, c)) { if (r >= 0 && r < R && c >= 0 && c < C) { ctx.sfx('wrong'); st.float('دي بسطة!', x, y - 10, '#fff'); } return true; }
        const from = cellOf(pos.x, pos.y), p = bfs(from, { r, c }); if (p) { path = p.slice(1).map(q => ({ x: cx(q.c), y: cy(q.r) })); sk.poke(); ctx.sfx('tap'); } return true;
      }
    };
    const spd = 190; let walkT = 0, face = 1;
    cl(st.addLayer({
      z: 0,
      update(dt) {
        walkT += dt; bumpCool -= dt;
        shop.forEach(s => { const len = Math.abs(s.b - s.a); s.p += s.dir * s.sp * dt / len; if (s.p > 1) { s.p = 1; s.dir = -1; } if (s.p < 0) { s.p = 0; s.dir = 1; } s.x = cx(s.a + (s.b - s.a) * s.p); s.y = cy(s.r); });
        let slow = 1; shop.forEach(s => { if (U.dist(pos.x, pos.y, s.x, s.y) < 40) slow = .45; }); if (slow < 1 && bumpCool <= 0) { bumps++; bumpCool = 2; bumpT = 1; ctx.sfx('bump'); st.float('عفوًا!', pos.x, pos.y - 60, '#fff'); }
        if (path.length) { const p = path[0], d = U.dist(pos.x, pos.y, p.x, p.y), step = spd * slow * dt; if (p.x !== pos.x) face = p.x > pos.x ? 1 : -1; if (d <= step) { pos.x = p.x; pos.y = p.y; path.shift(); } else { pos.x += (p.x - pos.x) / d * step; pos.y += (p.y - pos.y) / d * step; } }
        stars.forEach(s => { if (!s.got && U.dist(pos.x, pos.y, cx(s.c), cy(s.r)) < 34) { s.got = true; ctx.sfx('coin'); st.burst(cx(s.c), cy(s.r), { n: 8, kind: 'star' }); st.float('+١', cx(s.c), cy(s.r) - 30, '#ffc93c'); } });
        if (!finished && U.dist(pos.x, pos.y, cx(goal.c), cy(goal.r)) < 14 && !path.length) { finished = true; ctx.sfx('fanfare'); st.confetti(); ctx.react('good', 'both'); M.wait(1.5).then(() => done({ stars: stars.filter(s => s.got).length, bumps })); }
        st.dbg = { kit: 'mk_maze', goal: { x: cx(goal.c), y: cy(goal.r) }, pos: { x: pos.x, y: pos.y }, moving: path.length, starsLeft: stars.filter(s => !s.got).map(s => ({ x: cx(s.c), y: cy(s.r) })) };
      },
      draw(g, t) {
        G.fillRR(g, X0 - 12, Y0 - 10, C * CS + 24, R * CS + 20, 22, 'rgba(255,247,227,.92)', 5);
        for (let r = 0; r < R; r++) for (let c = 0; c < C; c++) {
          const x = X0 + c * CS, y = Y0 + r * CS;
          if (grid[r][c] === '#') { const i = r * 7 + c * 3; G.fillRR(g, x + 3, y + 3, CS - 6, CS - 6, 10, stallCols[i % stallCols.length], 4); G.fillRR(g, x + 8, y + 26, CS - 16, CS - 34, 6, '#c8935a', 3); A.draw(g, stallArts[i % stallArts.length], x + CS / 2, y + CS / 2 + 4, 38); for (let k = 0; k < 4; k++) G.poly(g, [[x + 6 + k * 15, y + 6], [x + 21 + k * 15, y + 6], [x + 19 + k * 15, y + 24], [x + 8 + k * 15, y + 24]], k % 2 ? '#fff' : G.shade(stallCols[i % stallCols.length], -.1), 2); }
          else { g.fillStyle = (r + c) % 2 ? '#fbe9c3' : '#f6dcaa'; g.fillRect(x, y, CS, CS); }
        }
        stars.forEach(s => { if (!s.got) A.draw(g, 'star', cx(s.c), cy(s.r) + Math.sin(t * 4 + s.c) * 3, 36); });
        // goal
        g.save(); g.globalAlpha = .35 + .2 * Math.sin(t * 4); G.circ(g, cx(goal.c), cy(goal.r), 34, '#fff3a0', 0); g.restore(); A.draw(g, o.goalArt || 'mama', cx(goal.c), cy(goal.r), 56); G.fillRR(g, cx(goal.c) - 26, cy(goal.r) + 30, 52, 6, 3, '#5cc96b', 0);
        // path preview
        if (path.length) { g.save(); g.globalAlpha = .55; path.forEach((p, i) => { if (i % 1 === 0) G.circ(g, p.x, p.y, 6, '#ff8a2a', 0); }); g.restore(); }
        shop.forEach(s => { G.shadow(g, s.x, s.y + 26, 18, 5, .25); A.draw(g, s.art, s.x, s.y - 4, 56); });
        // heroes (together, hand in hand)
        const mv = path.length ? 'walk' : 'idle', sc = .37, hy = pos.y + 34;
        [['aboody', 24 * face * -1 + 0], ['moody', 0]].forEach(p => M.chars.draw(g, p[0], pos.x + (p[0] === 'aboody' ? -18 * face : 14 * face), hy + (p[0] === 'aboody' ? 4 : 0), { anim: mv, t: walkT, dir: face, sc }));
        A.draw(g, 'st_hands', pos.x - 2 * face, hy - 33, 20);
        if (bumpT > 0) bumpT -= .016;
        G.text(g, ar(stars.filter(s => s.got).length) + ' من ' + ar(stars.length), 830, 496, { size: 28, color: '#fff', stroke: M.OL, sw: 6 }); A.draw(g, 'star', 770, 496, 34);
      }
    }));
    cl(() => { st.input = null; st.dbg = null; st.layout('floor'); });
  };

  /* ================= MONEY BUILDER ================= */
  A.registerAll({
    mk_money(g, o) {
      const v = +((o.args && o.args[0]) || 1);
      if (v === 1) { G.circ(g, 0, 0, 36, '#ffc93c', 4.5); G.circ(g, 0, 0, 26, '#ffdf6e', 3); G.text(g, ar(1), 0, 2, { size: 38, color: '#a06a00' }); return; }
      const col = { 5: ['#d9b896', '#8a6a3a'], 10: ['#ff9a8c', '#9a2a1a'], 20: ['#a8e0a0', '#2a6a2a'], 50: ['#9ec8ff', '#1a3a8a'], 100: ['#d4b8f0', '#4a2a8a'], 200: ['#f3e6a0', '#6a5a10'] }[v] || ['#ddd', '#444'];
      G.fillRR(g, -46, -26, 92, 52, 8, col[0], 4.5); G.fillRR(g, -39, -19, 78, 38, 5, 'rgba(255,255,255,.35)', 2.5); G.circ(g, -26, 0, 12, 'rgba(255,255,255,.55)', 2); G.text(g, ar(v), 14, 2, { size: v >= 100 ? 30 : 36, color: col[1], stroke: 'rgba(255,255,255,.7)', sw: 3 }); G.text(g, 'جنيه', 14, 20, { size: 11, color: col[1] });
    }
  });
  K.mk_money = function (ctx, o, done, cl) {
    const st = ctx.stage, sk = ctx.skipper(done, cl, o), target = o.target, denoms = o.denoms || [1, 5, 10, 20, 50]; let tries = 0, finished = false; const cnt = {}; denoms.forEach(d => cnt[d] = 0);
    ctx.heroes('corner'); if (o.prompt) ctx.prompt(o.prompt);
    const total = () => denoms.reduce((a, d) => a + d * cnt[d], 0);
    const head = h('div', { style: 'display:flex;gap:14px;justify-content:center;align-items:stretch' });
    const price = h('div', { class: 'chip', style: 'font-size:34px;background:#fff3c4;border-radius:22px;padding:6px 22px;flex-direction:column;gap:0;line-height:1.2' }, h('div', null, o.head || ('المطلوب: ' + ar(target) + ' جنيه')), o.sub ? h('div', { style: 'font-size:22px;color:#c25a00' }, M.fmt(o.sub)) : null);
    const sum = h('div', { class: 'chip', style: 'font-size:34px;border-radius:22px;padding:6px 22px;color:#1d7f33' });
    head.append(price, sum);
    const tray = h('div', { style: 'display:flex;gap:12px;flex-wrap:wrap;justify-content:center;align-items:center;min-height:92px;margin:10px 0;background:rgba(255,255,255,.7);border:4px dashed #b9a98a;border-radius:22px;padding:8px' });
    const pay = UI.btn(o.okLabel || 'ادفع', 'green', () => check(), 'check'); pay.setAttribute('data-act', 'pay');
    const keys = h('div', { style: 'display:flex;gap:8px;justify-content:center;flex-wrap:nowrap;margin-bottom:8px' });
    denoms.forEach(d => { const b = h('button', { class: 'btn yellow', 'data-d': d, style: 'min-height:76px;min-width:96px;padding:2px 8px;border-radius:18px' }, ico('mk_money:' + d, 64)); b.onclick = () => { if (finished) return; if (cnt[d] < 12) cnt[d]++; sk.poke(); ctx.sfx('coin'); render(); }; keys.append(b); });
    const hint = h('div', { style: 'font-size:22px;font-weight:bold;color:#c25a00;min-height:28px' });
    const el = h('div', { class: 'panel', style: 'position:absolute;left:60px;right:60px;top:92px;padding:10px 16px 12px;text-align:center;animation:popin .3s;z-index:2' }, head, tray, keys, h('div', { class: 'row' }, pay), hint);
    UI.over.append(el); cl(() => el.remove());
    function render() {
      sum.textContent = 'معاك: ' + ar(total()) + ' جنيه'; tray.textContent = '';
      denoms.forEach(d => { if (cnt[d] > 0) { const b = h('button', { class: 'chip', style: 'cursor:pointer;padding:2px 10px 2px 6px;gap:4px;border-radius:18px;background:#fff', 'data-rm': d }, ico('mk_money:' + d, 54), '×' + ar(cnt[d])); b.onclick = () => { if (finished) return; cnt[d]--; ctx.sfx('click'); render(); }; tray.append(b); } });
      if (total() === 0) tray.append(h('div', { style: 'font-size:22px;opacity:.55' }, 'دوس على الفلوس اللي تحت عشان تحطها هنا'));
    }
    function check() {
      if (finished) return; const t = total();
      if (t === target) { finished = true; ctx.sfx('good'); ctx.react('good', 'both'); el.style.background = '#e3fbe6'; hint.textContent = ''; M.wait(1).then(() => done({ tries: tries + 1 })); return; }
      tries++; sk.fail(); ctx.sfx('wrong'); const diff = t - target;
      hint.textContent = tries >= 2 ? (diff < 0 ? 'ناقص ' + ar(-diff) + ' جنيه' : 'زيادة ' + ar(diff) + ' جنيه.. شيل شوية') : (diff < 0 ? 'لسه ناقص فلوس' : 'ده أكتر من المطلوب');
    }
    render(); st.dbg = { kit: 'mk_money', target, denoms, get sum() { return total(); } }; cl(() => { st.dbg = null; });
  };
})();
