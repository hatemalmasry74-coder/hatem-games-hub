/* Family Adventures - worlds/rooms.js : the two DRESSING ROOMS as a hidden world 'room' (one mission, never "completed": the door goes back to the map, no rewards for just playing dress-up).
   Which room a hero enters comes ONLY from DEFS gender ('m' -> room_boys, 'f' -> room_girls); who is in the room = every playable hero of that gender.
   Entry points: map button «غرفتي» (ui.js worldMap tile -> UI.closet = Moody.dress.door), the home world's «غرفتي» button, Moody.flow.toRoom(heroId).
   Interaction (canvas hotspots from Moody.roomSpec): wardrobe -> doors open + outfit panel; mirror -> zoom preview; toys -> little reactions with a voiced one-liner from the hero; door -> back to the map.
   Bonus: «عرض الأزياء» (fashion show) = weather picture + goal ('البس لبس شتوي') matched against the worn items; gives stars / coins / the sticker s_fashion. */
(function () {
  'use strict';
  const M = window.Moody, D = M.dress, C = M.chars, UI = M.ui, G = M.gfx, U = M.util, F = M.flow, A = M.art, h = UI.h;
  if (!D || !D.openPanel || !M.roomSpec) return;
  const L = D.lines, SD = () => M.save.data;
  const cosm = () => { const sd = SD(); sd.cosm = sd.cosm || { owned: [], eq: {} }; return sd.cosm; };
  D.roomHero = null;

  F.toRoom = function (id) { D.roomHero = id || SD().hero || 'moody'; F.startMission('room', 0); };
  /* the old closet entry + the home world entry */
  const hw = M.getWorld && M.getWorld('home'); if (hw) hw.entry = { label: 'غرفتي', icon: 'hanger', go: () => D.door({ back: () => F.toWorld('home') }) };

  M.registerWorld({
    id: 'room', hidden: true, order: 998, title: 'غرفتي', icon: 'hanger', theme: { c1: '#ffd9e6', c2: '#bcd8ff' },
    stickers: [{ id: 's_fashion', title: 'نجم الأزياء', art: 'dr_runway', bg: '#fff3c4' }],
    missions: [{
      id: 'room', title: 'غرفتي', intro: 'غرفة اللبس', hideTitle: true, values: [], wisdom: 'اللبس النضيف الحلو بيفرّح',
      async run(ctx) {
        const stage = ctx.stage, who0 = D.roomHero && C.defs[D.roomHero] && C.defs[D.roomHero].playable ? D.roomHero : (SD().hero || 'moody');
        const gender = D.gender(who0), rname = D.roomName(who0), spec = M.roomSpec[rname];
        let mates = C.playable().filter(id => D.gender(id) === gender); if (mates.indexOf(who0) < 0) mates.unshift(who0);
        ctx.cast(mates, mates); stage.setActive(who0, true);
        const pos = {}; mates.forEach((id, i) => { pos[id] = id === who0 ? { x: 290, y: 476, dir: 1, sc: 1 } : { x: 382 + (i % 2) * 14, y: 494, dir: -1, sc: .96 }; });
        const S = { wd: 0, mz: 0, fx: {} };
        await ctx.scene(rname, { state: S, heroes: pos, floorY: 480 });
        let panel = null, busy = false, zoomOn = false, rmZoom = null, leaving = false, fashionBtn = null, goalChip = null;
        const who = () => stage.active;
        const say = (key, w) => { const t = D.line(w || who(), key); if (t) stage.bubble(w || who(), t, 2.4); return t; };
        const hit = (x, y) => { let best = null; spec.objects.forEach(o => { if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h) { if (!best || o.w * o.h < best.w * best.h) best = o; } }); return best; };
        const heroEl = id => stage.heroes[id];
        /* ---- hints: soft rings on the wardrobe / mirror / door (first seconds) ---- */
        const wd = spec.objects.find(o => o.id === 'wardrobe'), mr = spec.objects.find(o => o.id === 'mirror');
        let rmGlow = stage.addGlow(wd.x + wd.w / 2, wd.y + wd.h * .45, 70, '255,230,140');
        let rmGlow2 = stage.addGlow(mr.x + mr.w / 2, mr.y + mr.h * .5, 56, '200,235,255');
        try { const mp = document.getElementById('mprog'); if (mp) mp.style.display = 'none'; } catch (e) { }
        ctx.prompt(L.wardrobe);
        stage.bubble(who0, D.line(who0, 'welcome'), 3.2);
        /* ---- helpers ---- */
        const openWardrobe = (tab, fashion) => {
          if (panel && !panel.closed) return panel; if (fashionBtn) fashionBtn.style.display = 'none';
          M.audio.sfx('unlock'); M.tw(S, { wd: 1 }, .55, 'outCubic'); if (rmGlow) { rmGlow(); rmGlow = null; }
          panel = D.openPanel({ who: stage.active, stage, host: UI.over, tab, fashion: fashion || null, prompt: t => { if (t) ctx.prompt(t); },
            onChange: () => { UI.hud.rebuild(); },
            onClose: () => { M.tw(S, { wd: 0 }, .45, 'inCubic'); ctx.prompt(null); if (fashionBtn && !leaving) fashionBtn.style.display = ''; UI.hud.rebuild(); },
            onDone: fashion ? (draft) => fashionCheck(fashion, draft) : null });
          return panel;
        };
        const closePanel = silent => { if (panel && !panel.closed) panel.close(silent); };
        const zoomMirror = () => {
          if (zoomOn) return; zoomOn = true; const id = stage.active, t0 = stage.t; M.audio.sfx('whoosh'); if (panel && !panel.closed) panel.el.style.display = 'none';
          M.tw(S, { mz: 1 }, .3, 'outCubic'); const gold = gender === 'f' ? '#ffb3cc' : '#4a8dff', big = Math.min(2.4, .84 * 440 / C.height(id));
          let nextSpin = 0.6;
          rmZoom = stage.addLayer({ z: 60, draw(g, t) {
            const u = Math.min(1, (t - t0) / .35), e = 1 - Math.pow(1 - u, 3); g.save(); g.globalAlpha = .62 * e; g.fillStyle = '#1b1030'; g.fillRect(-20, -20, 1000, 580); g.globalAlpha = 1;
            const cx = 480, cy = 276, rx = 168 * (.6 + .4 * e), ry = 240 * (.6 + .4 * e);
            g.save(); g.translate(cx, cy); G.ell(g, 0, 0, rx + 14, ry + 14, gold, 4); G.ell(g, 0, 0, rx, ry, '#e9f6ff', 3);
            g.beginPath(); g.ellipse(0, 0, rx - 3, ry - 3, 0, 0, 6.2832); g.clip(); const gr = g.createLinearGradient(-rx, -ry, rx, ry); gr.addColorStop(0, '#f1faff'); gr.addColorStop(.6, '#c9e7f8'); gr.addColorStop(1, '#e2f2fc'); g.fillStyle = gr; g.fillRect(-rx, -ry, rx * 2, ry * 2);
            g.fillStyle = 'rgba(255,214,235,.18)'; g.fillRect(-rx, ry * .55, rx * 2, ry); g.restore();
            g.save(); g.beginPath(); g.ellipse(cx, cy, rx - 3, ry - 3, 0, 0, 6.2832); g.clip();
            if (t - t0 > nextSpin) { nextSpin += 3.4; try { C.react(id, 'spin', { sfx: false, force: true }); } catch (x) { } }
            try { C.draw(g, id, cx, cy + ry - 26, { anim: 'idle', t, sc: big * e, noShadow: true, key: 'zoom:' + id }); } catch (x) { }
            const sh = g.createLinearGradient(cx - rx, cy - ry, cx + rx * .4, cy + ry * .2); sh.addColorStop(0, 'rgba(255,255,255,.5)'); sh.addColorStop(.5, 'rgba(255,255,255,0)'); g.fillStyle = sh; g.fillRect(cx - rx, cy - ry, rx * 2, ry * 2); g.restore();
            for (let i = 0; i < 5; i++) { const a = i * 1.3 + (t - t0) * .8; G.sparkle(g, cx + Math.cos(a) * (rx + 26), cy + Math.sin(a * 1.3) * (ry * .8), 8 + (i % 3) * 3, '#fff6a8', .8 * e); }
            g.restore();
          } });
          stage.bubble(id, D.line(id, 'mirror'), 2.6); stage.sparkle(480, 270, { n: 16, spread: 200 });
          const close = h('button', { class: 'btn round red', 'data-act': 'zoom-close', style: 'position:absolute;right:30px;top:90px;pointer-events:auto;z-index:50', 'aria-label': 'إغلاق', onclick: () => closeZoom() }, UI.i('x', 34));
          UI.over.append(close); zoomOn = { close };
        };
        const closeZoom = () => { if (!zoomOn) return; const z = zoomOn; zoomOn = false; if (rmZoom) { rmZoom(); rmZoom = null; } z.close && z.close.remove(); M.tw(S, { mz: 0 }, .3, 'inCubic'); if (panel && !panel.closed) panel.el.style.display = ''; M.audio.sfx('pop'); };
        const toy = ob => {
          const id = who(), k = ob.id; S.fx[k] = stage.t; const c = { x: ob.x + ob.w / 2, y: ob.y + ob.h / 2 };
          if (k === 'dollhouse') S.fx.dhOn = !S.fx.dhOn;
          M.audio.sfx(k === 'robot' ? 'unlock' : k === 'ball' || k === 'blocks' ? 'boing' : k === 'cars' ? 'whoosh' : k === 'telescope' || k === 'fairy' || k === 'paints' || k === 'flowers' ? 'star' : 'pop');
          if (k === 'robot') { setTimeout(() => M.audio.sfx('click'), 160); setTimeout(() => M.audio.sfx('unlock'), 320); }
          stage.sparkle(c.x, c.y, { n: 10, spread: 90 });
          if (k === 'plush') { stage.burst(c.x, c.y - 30, { n: 8, kind: 'heart', min: 40, max: 110, up: 120 }); try { C.react(id, 'giggle'); } catch (e) { } }
          else if (k === 'ball') { try { C.react(id, 'jumpcheer'); } catch (e) { } }
          else try { C.react(id, 'wave'); } catch (e) { }
          if (k === 'fairy') for (let i = 0; i < 4; i++) setTimeout(() => stage.sparkle(300 + i * 100, 60, { n: 6, spread: 60 }), i * 120);
          const t = D.line(id, ob.say); if (t) stage.bubble(id, t, 2.4);
        };
        const leave = () => {
          if (leaving) return; leaving = true; closeZoom(); closePanel(true); M.audio.sfx('whoosh'); D.speak(L.bye); stage.bubble(who(), D.line(who(), 'ok'), 1.2);
          Object.keys(D.live).forEach(k => delete D.live[k]); stage.sparkle(40, 320, { n: 12, spread: 90 }); setTimeout(() => ctx.nav.quit(), 380);
        };
        /* ---- pointer input ---- */
        stage.input = { down(x, y) {
          if (leaving) return true; if (zoomOn) { closeZoom(); return true; }
          const d = spec.door; if (x >= d.x - 6 && x <= d.x + d.w + 6 && y >= d.y - 50 && y <= d.y + d.h + 6) { leave(); return true; }
          const ob = hit(x, y); if (!ob) return false;
          if (ob.id === 'wardrobe') { openWardrobe(); return true; } if (ob.id === 'mirror') { zoomMirror(); return true; }
          toy(ob); return true;
        } };
        /* hero switch (HUD chips / tapping the other child) re-targets the open panel */
        const prevSw = stage.onSwitch; stage.onSwitch = id => { if (prevSw) prevSw(id); if (panel && !panel.closed) panel.setHero(id); };
        /* the door is also a button for non-touch / keyboard (Esc opens pause where "خروج" leaves) */
        /* ---- fashion show button ---- */
        fashionBtn = h('button', { class: 'btn sm purple dr-btn-room', 'data-act': 'fashion', 'aria-label': 'عرض الأزياء', onclick: () => { M.audio.sfx('tap'); fashion(); } }, A.el('dr_runway', 34), 'عرض الأزياء');
        M.voice.pressSpeak(fashionBtn, () => 'عرض الأزياء', 'narrator'); UI.over.append(fashionBtn);
        ctx.nav._dr = { openWardrobe, zoomMirror, leave };   // handles for the bot test
        D.room = { stage, spec, S, ctx, openWardrobe, closePanel, zoomMirror, closeZoom, toy, leave, fashion: () => fashion(), get panel() { return panel; }, get zoom() { return zoomOn; } };

        /* ---- fashion show ---- */
        function goalFor() { if (D.forceGoal) { const fg = D.goals.find(x => x.id === D.forceGoal); if (fg) return fg; } const fd = cosm().fashion = cosm().fashion || { done: {}, tries: {} }; const todo = D.goals.filter(g => !fd.done[g.id]); const pool = todo.length ? todo : D.goals; return pool[Math.floor(Math.random() * pool.length)]; }
        function weatherCard(goal) {
          return new Promise(res => {
            const cv = A.el('dr_weather_' + goal.pic, 150); const ok = h('button', { class: 'btn big green', 'data-act': 'fashion-go', onclick: () => { M.audio.sfx('tap'); card.remove(); res(); } }, 'يلا!');
            const card = h('div', { class: 'panel dr-weather', 'data-weather': goal.id }, h('div', null, cv), h('div', { class: 'tt' }, goal.title), ok); UI.over.append(card); M.voice.pressSpeak(card, () => goal.say, 'narrator'); D.speak(goal.say);
          });
        }
        async function fashion() {
          if (busy || leaving) return; busy = true; closeZoom(); closePanel(true); if (fashionBtn) fashionBtn.style.display = 'none'; const goal = goalFor(); D.fashionGoal = goal;
          D.speak(L.fashionStart); await weatherCard(goal);
          const w = who(); const gp = h('div', { class: 'dr-goal', style: 'position:absolute;left:14px;top:86px;pointer-events:auto' }, A.el('dr_weather_' + goal.pic, 54), goal.title); UI.over.append(gp); goalChip = gp;
          ctx.prompt(goal.title); fashionTries = 0; openWardrobe('top', goal);
        }
        let fashionTries = 0;
        function worn(draft) { return D.wornItems(who(), draft); }
        function needOk(n, items) { const sl = n.slot === 'any' ? n.also : [n.slot]; return items.some(it => sl.indexOf(it.slot) >= 0 && it.tags && it.tags.some(t => n.tags.indexOf(t) >= 0)); }
        function fashionCheck(goal, draft) {
          fashionTries++; const items = worn(draft), miss = goal.need.filter(n => !needOk(n, items));
          if (miss.length) { M.audio.sfx('wrong'); const t = 'محتاج ' + miss[0].n, hr0 = stage.heroes[who()]; stage.float(t, hr0.x, hr0.y - 230, '#8a6bd6', 30); D.speak(t); UI.toast(t, 2400, { silent: true }); return; }
          const stars = fashionTries <= 1 ? 3 : fashionTries === 2 ? 2 : 1, fd = cosm().fashion = cosm().fashion || { done: {}, tries: {} }, first = !fd.done[goal.id];
          closePanel(true); if (goalChip) { goalChip.remove(); goalChip = null; }
          fd.done[goal.id] = Math.max(fd.done[goal.id] || 0, stars); const sd = SD(), key = 'room/fashion_' + goal.id, prev = sd.progress[key] || {};
          sd.progress[key] = { done: true, stars: Math.max(prev.stars || 0, stars), plays: (prev.plays || 0) + 1 }; if (first) sd.coins += 4 + stars * 2; else sd.coins += 2;
          const nDone = Object.keys(fd.done).length; let newSticker = false; if (nDone >= 3 && !sd.stickers.s_fashion) { sd.stickers.s_fashion = Date.now(); newSticker = true; }
          M.save.commit();
          (async () => {
            const id = who(), hr = stage.heroes[id]; M.audio.sfx('fanfare'); stage.confetti(); stage.float(L.fashionWin, hr.x, hr.y - 230, '#2fb24f', 30); D.speak(L.fashionWin);
            await stage.walk(id, 600, 484); stage.play(id, 'cheer', 1.2); ctx.stars = 0; ctx.reward.star(stars); UI.flyTo && UI.flyTo('coin', 480, 280, { n: 5 });
            await ctx.wait(.9); await stage.walk(id, 290, 476); if (newSticker) { UI.toast('ملصق جديد: نجم الأزياء', 3000); M.audio.sfx('star'); stage.confetti(); }
            D.fashionGoal = null; busy = false; ctx.prompt(L.wardrobe); if (fashionBtn) fashionBtn.style.display = '';
          })();
        }
        /* the mission never completes: leaving = door / pause menu */
        await new Promise(() => { });
      }
    }]
  });
})();
