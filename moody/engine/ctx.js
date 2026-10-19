/* Moody & Aboody - engine/ctx.js : mission runner (M.flow) + the mission context `ctx` + question picker.
   Missions are async functions: run(ctx). Every ctx.* helper returns a Promise; leaving the mission aborts them all. */
(function () {
  'use strict';
  const M = window.Moody, UI = M.ui, U = M.util;
  const ABORT = { abort: true }, COMPLETE = { complete: true };
  M.kits = M.kits || {};
  const PRAISE = ['برافو يا {m}!', 'عبودي شاطر!', 'ممتاز!', 'يا سلام!', 'هايل!', 'كده الشطارة!', 'تسلم إيدك!', 'برافو عليكم!', 'جامد أوي!', 'عظمة!'];

  /* ---------- question picker (tiers 6 / 9, rotates, never repeats back-to-back) ---------- */
  M.tierFor = function (who) {
    const t = M.save.data.settings.tier; if (t === '6' || t === 6) return 6; if (t === '9' || t === 9) return 9;
    return who === 'aboody' ? 6 : 9;
  };
  M.pickQuestions = function (o) {
    o = o || {}; const tier = o.tier || 9, seen = M.save.data.seen, last = M.save.data.lastQ, cats = o.cat ? [].concat(o.cat) : null, ex = o.exclude || [];
    let pool = Object.values(M.banks).filter(q => (q.tier === tier || q.tier === 'both') && (!cats || cats.indexOf(q.category) >= 0) && ex.indexOf(q.id) < 0 && (!o.tag || (q.tags || []).indexOf(o.tag) >= 0));
    if (!pool.length) pool = Object.values(M.banks).filter(q => (q.tier === tier || q.tier === 'both') && ex.indexOf(q.id) < 0);
    const sc = q => (seen[q.id] || 0) * 10 + Math.random() * 6 + (q.id === last ? 1000 : 0);
    pool = pool.map(q => [sc(q), q]).sort((a, b) => a[0] - b[0]).map(x => x[1]);
    // spread categories when several are requested
    const out = [], usedCat = {};
    for (const q of pool) { if (out.length >= (o.n || 1)) break; if ((o.n || 1) > 1 && usedCat[q.category] && pool.length > 12) continue; out.push(q); usedCat[q.category] = 1; }
    for (const q of pool) { if (out.length >= (o.n || 1)) break; if (out.indexOf(q) < 0) out.push(q); }
    return out;
  };
  function markSeen(q) { const s = M.save.data; s.seen[q.id] = (s.seen[q.id] || 0) + 1; s.lastQ = q.id; M.save.commit(); }

  /* ---------- fade overlay ---------- */
  function fade(on, ms) {
    return new Promise(res => {
      let f = document.getElementById('fadeov'); if (!f) { f = UI.h('div', { id: 'fadeov', style: 'position:absolute;inset:0;background:#fff7e3;opacity:0;pointer-events:none;z-index:45;transition:opacity .25s' }); UI.over.append(f); }
      f.style.transitionDuration = (ms || 250) + 'ms'; requestAnimationFrame(() => { f.style.opacity = on ? '1' : '0'; }); setTimeout(res, ms || 250);
    });
  }

  function makeCtx(world, mission, stage, run) {
    const pend = new Set(), aborts = []; let aborted = false;
    const ctx = { world, mission, stage, stars: 0, bonus: 0, mistakes: 0, startT: M.time, diaryList: [], stickerList: [], valueList: [], endOpts: null, aborted: false };
    function mk(fn) {
      return new Promise((resolve, reject) => {
        if (aborted) return reject(ABORT);
        const d = { cl: [] }; pend.add(d);
        const run = () => { d.cl.forEach(f => { try { f(); } catch (e) { } }); d.cl = []; };
        d.done = v => { if (!pend.has(d)) return; pend.delete(d); run(); resolve(v); };
        d.abort = () => { if (!pend.has(d)) return; pend.delete(d); run(); reject(ABORT); };
        try { fn(d.done, f => d.cl.push(f)); } catch (e) { pend.delete(d); run(); reject(e); }
      });
    }
    ctx._mk = mk;
    ctx.abort = () => { aborted = true; ctx.aborted = true; Array.from(pend).forEach(d => d.abort()); aborts.forEach(f => { try { f(); } catch (e) { } }); aborts.length = 0; UI.hud.pulseSwitch(false); };
    ctx.every = (sec, fn) => { const iv = setInterval(() => { if (!M.paused) fn(); }, sec * 1000); aborts.push(() => clearInterval(iv)); return () => clearInterval(iv); };
    Object.defineProperty(ctx, 'active', { get: () => stage.active });
    Object.defineProperty(ctx, 'names', { get: () => M.save.data.names });
    ctx.h = id => stage.hero(id);
    ctx.sfx = n => M.audio.sfx(n);

    ctx.wait = s => mk(done => { M.wait(s).then(() => done()); });
    ctx.scene = function (bg, o) {
      o = o || {};
      return mk(done => {
        const apply = () => { stage.bg = typeof bg === 'string' ? M.rooms[bg] : bg; stage.state = o.state || {}; stage.layout(o.heroes || 'floor'); stage.floorY = o.floorY || 480; stage.layers.length = 0; stage.input = null; stage.parts.length = 0; UI.hud.setPrompt(null); };
        if (o.instant) { apply(); done(); return; }
        stage.transition(() => { if (!aborted) apply(); }, { style: o.transition }).then(() => done());   // iris + zoom, skippable (engine/stage.js)
      });
    };
    ctx.heroes = l => stage.layout(l);
    ctx.setBg = (bg) => { stage.bg = typeof bg === 'string' ? M.rooms[bg] : bg; };
    ctx.state = () => stage.state;
    ctx.prompt = t => UI.hud.setPrompt(t);
    ctx.banner = ctx.prompt;
    ctx.titleCard = (t, sub) => mk((done, cl) => {
      const el = UI.h('div', { class: 'panel', style: 'position:absolute;left:150px;right:150px;top:170px;padding:20px;text-align:center;animation:popin .4s;z-index:40' }, UI.h('div', { class: 'title', style: 'font-size:56px' }, t), sub ? UI.h('div', { style: 'font-size:30px;font-weight:bold;margin-top:12px' }, M.fmt(sub)) : null);
      UI.over.append(el); stage.setMood(true); cl(() => { el.remove(); stage.setMood(false); }); M.voice.speak(t + '. ' + (sub || ''), { speaker: 'narrator' }); M.wait(2.3).then(() => done());
    });
    ctx.say = function (who, text, o) {
      o = o || {};
      return mk((done, cl) => {
        let close; const hero = stage.heroes[who];
        if (hero && o.anim) stage.play(who, o.anim, o.animT || 1.2);
        const relEmo = M.chars.line ? M.chars.line(who, text, o) : null;   // emotion while the line is shown (o.emote or inferred from the text)
        UI.say({ who, text, name: o.name, icon: o.icon, face: o.face || (o.anim && ['cry', 'scream', 'phone'].indexOf(o.anim) >= 0 ? o.anim : null), onTalk: v => { if (hero) hero.talk = v ? 999 : 0; }, register: c => { close = c; } }).then(() => done());
        cl(() => { if (close) close(); if (hero) hero.talk = 0; if (relEmo) relEmo(); });
      });
    };
    ctx.dialog = async function (lines) { for (const l of lines) await ctx.say(l[0], l[1], l[2]); };
    ctx.bubble = (who, text, dur) => stage.bubble(who, text, dur);
    ctx.walk = (who, x, y) => mk(done => { stage.walk(who, x, y).then(() => done()); });
    ctx.anim = (who, a, s) => mk(done => { stage.play(who, a, s).then(() => done()); });
    ctx.react = function (kind, who, ro) {
      const a = kind === 'good' ? 'cheer' : kind, ts = (who === 'both' || !who) ? stage.present() : [who];
      ts.forEach(k => stage.play(k, a, 1.3));
      if (a === 'cheer') { M.audio.sfx('good'); } else if (a === 'oops') M.audio.sfx('wrong');
      /* a short spoken cheer from one of the controllable heroes after a finished puzzle (about every other time) */
      if (a === 'cheer' && M.reactions && !(ro && ro.nopraise) && Math.random() < .5) {
        const w = who && who !== 'both' ? who : U.pick(stage.control.length ? stage.control : ['moody', 'aboody']), t = M.reactions.pick('praise', { speaker: w, hero: M.reactions.buddy(w), maxLen: 24 }); if (t) stage.bubble(w, t, 1.8);
      }
    };
    /* heroes on stage: ctx.cast(['moody','aboody','toota','nemo'], controllable?)  (see DEV.md) */
    ctx.cast = (list, control) => { stage.setCast(list, control); UI.hud.rebuild(); };
    ctx.companions = list => ctx.cast(['moody', 'aboody'].concat(list || []), ['moody', 'aboody']);
    ctx.abilities = o => { for (const k in o) stage.abil[k] = o[k]; };
    /* a companion gives a light hint: ctx.tip('جرّب الكرسي!') */
    ctx.tip = (text, who) => { const w = who || stage.present().find(k => stage.control.indexOf(k) < 0) || stage.present().find(k => k !== stage.active); if (w) { stage.bubble(w, text, 2.6); stage.play(w, 'wave', .9); } };
    ctx.speak = (text, o) => M.voice.speak(text, Object.assign({ speaker: 'narrator' }, o));
    ctx.praise = function (who) { const w = who || stage.active, R = M.reactions, t0 = R && R.pick('praise', { speaker: w, hero: R.buddy(w) }), t = t0 || U.pick(PRAISE).replace('{m}', M.save.data.names.moody); stage.bubble(w, t0 || t.replace('عبودي', M.save.data.names.aboody), 1.8); stage.play(w, 'cheer', 1.1); M.audio.sfx('good'); };
    ctx.requireHero = function (id, msg) {
      return mk((done, cl) => {
        if (stage.active === id) { done(); return; }
        stage.bubble(stage.active, msg || ('بدّل لـ' + M.save.data.names[id] + ' من فوق'), 2.6); UI.hud.pulseSwitch(true);
        const prev = stage.onSwitch; stage.onSwitch = x => { if (prev) prev(x); if (x === id) done(); };
        cl(() => { stage.onSwitch = prev; UI.hud.pulseSwitch(false); });
      });
    };
    ctx.reward = {
      star(n) { n = n || 1; const was = ctx.stars; ctx.stars = Math.min(3, ctx.stars + n); if (ctx.stars > was) { UI.starPop(ctx.stars - was); UI.hud.update(ctx.stars); M.audio.cheer('small'); } },
      coins(n) { ctx.bonus += n; stage.float('+' + U.ar(n), 480, 250, '#ffc93c'); M.audio.sfx('coin'); }
    };
    ctx.mistake = () => { ctx.mistakes++; };
    ctx.diary = { add(e) { ctx.diaryList.push(e); } };
    ctx.sticker = { give(id) { ctx.stickerList.push(id); } };
    ctx.value = t => { if (ctx.valueList.indexOf(t) < 0) ctx.valueList.push(t); };
    ctx.skill = t => { const s = M.save.data.skills; s[t] = (s[t] || 0) + 1; M.save.commit(); };
    ctx.fx = { sparkle: (x, y, o) => stage.sparkle(x, y, o), reward: (x, y) => stage.reward(x, y), glow: (x, y, r, c) => stage.addGlow(x, y, r, c), doorOpen: (x, y, w, h, o) => stage.doorOpen(x, y, w, h, o), burst: (x, y, o) => stage.burst(x, y, o), float: (t, x, y, c) => stage.float(t, x, y, c), shake: a => stage.shake(a), flash: (c, a) => stage.flash(c, a), confetti: () => stage.confetti() };
    ctx.nav = { complete(o) { ctx.endOpts = o || {}; throw COMPLETE; }, quit() { run.quit(); } };

    /* skip safety net used by kits: shows "تخطّي" after a long idle time or 3 failures */
    ctx.skipper = function (done, cl, o) {
      o = o || {}; let fails = 0, tm = null, nt = null, nudges = 0; const show = () => UI.skip.show(() => done({ skipped: true })); tm = setTimeout(show, (o.after || 45) * 1000);
      const nudge = () => { if (nudges >= 3 || !M.reactions) return; if (M.paused) { nt = setTimeout(nudge, 5000); return; } const t = M.reactions.pick('nudge', { speaker: stage.active, hero: M.reactions.buddy(stage.active) }); if (t) { nudges++; stage.bubble(stage.active, t, 3.4); } nt = setTimeout(nudge, 30000); };
      nt = setTimeout(nudge, (o.nudge || 24) * 1000);
      cl(() => { clearTimeout(tm); clearTimeout(nt); UI.skip.hide(); });
      return { fail() { fails++; ctx.mistakes++; if (fails >= (o.fails || 3)) show(); }, poke() { clearTimeout(tm); tm = setTimeout(show, (o.after || 45) * 1000); clearTimeout(nt); nt = setTimeout(nudge, (o.nudge || 24) * 1000); } };
    };

    /* quiz API */
    function ask(q, o) {
      o = o || {};
      return mk((done, cl) => {
        markSeen(q); const ui = UI.quiz(q, { who: o.who, onMiss: () => { ctx.mistakes++; }, onDone: r => { if (r.correct && q.category) ctx.skill(q.category); done(r); } }); cl(() => ui.close());
      });
    }
    ctx.quiz = {
      ask,
      async fromBank(o) {
        o = o || {}; const who = o.who || stage.active, tier = o.tier || M.tierFor(who), qs = M.pickQuestions({ tier, cat: o.cat, n: o.n || 1, tag: o.tag }), res = [];
        for (const q of qs) { res.push(await ask(q, { who: o.hideWho ? null : who })); }
        return { results: res, correct: res.filter(r => r.correct).length, firstTry: res.filter(r => r.tries === 1).length, n: res.length };
      },
      /* two-part puzzle: tier-6 part for Aboody, tier-9 part for Moody */
      async pair(o) {
        o = o || {}; const q6 = o.aboody || M.pickQuestions({ tier: 6, cat: o.cat, n: 1 })[0], q9 = o.moody || M.pickQuestions({ tier: 9, cat: o.cat, n: 1 })[0], out = [];
        if (o.say !== false) ctx.stage.bubble('aboody', 'دوري الأول!', 1.4);
        out.push(await ask(q6, { who: 'aboody' })); stage.play('aboody', 'cheer', 1);
        stage.bubble('moody', 'وأنا دوري!', 1.4);
        out.push(await ask(q9, { who: 'moody' })); stage.play('moody', 'cheer', 1);
        return { results: out, firstTry: out.filter(r => r.tries === 1).length, correct: out.filter(r => r.correct).length };
      }
    };
    ctx.games = {};
    Object.keys(M.kits).forEach(k => { ctx.games[k] = o => mk((done, cl) => { cl(() => UI.hud.setPrompt(null)); M.kits[k](ctx, o || {}, done, cl); }); });
    ctx.games.tap = ctx.games.hidden;
    ctx.choice = ctx.games.choice;
    return ctx;
  }

  /* ---------- flow ---------- */
  const F = M.flow = { cur: null };
  F.toTitle = function () { endMission(); M.setScene(M.backdrop); UI.hud.hide(); UI.title({ start: () => { if (!M.save.data.named) F.toNames(); else F.toMap(); }, parent: () => F.toParent(F.toTitle) }); };
  F.toNames = function (back) { UI.names({ back: back || F.toTitle, ok: F.toMap }); };
  F.toMap = function () { endMission(); M.setScene(M.backdrop); UI.worldMap({ back: F.toTitle, world: F.toWorld, album: () => UI.album({ back: F.toMap }), diary: () => UI.diary({ back: F.toMap }), call: () => F.toCall(), closet: () => UI.closet({ back: F.toMap }), parent: () => F.toParent(F.toMap) }); };
  F.toParent = function (back) { UI.parent({ back, names: () => F.toNames(() => F.toParent(back)), reset: () => F.toParent(back) }); };
  F.toWorld = function (id) {
    endMission(); const w = M.getWorld(id); if (!w || w.soon || w.hidden) return F.toMap(); M.setScene(M.backdrop);
    UI.missionList(w, { back: F.toMap, start: i => F.startMission(id, i) });
  };

  function endMission() { const c = F.cur; if (c) { F.cur = null; if (c.kh) { const i = M.keys.indexOf(c.kh); if (i >= 0) M.keys.splice(i, 1); } c.ctx.abort(); c.stage.input = null; UI.skip.hide(); const f = document.getElementById('fadeov'); if (f) f.remove(); UI.over.textContent = ''; M.paused = false; } }

  F.startMission = function (wid, idx) {
    endMission(); const w = M.getWorld(wid), m = w.missions[idx]; if (!m) return F.toWorld(wid);
    const stage = new M.Stage(); if (m.heroes || w.heroes) stage.setCast(m.heroes || w.heroes, m.control || w.control); if (m.abilities) Object.keys(m.abilities).forEach(k => { stage.abil[k] = m.abilities[k]; }); stage.layout('floor'); stage.bg = M.rooms && M.rooms.plain; M.setScene(stage); UI.clearScreen();
    const run = { quit() { F.toWorld(wid); } }, ctx = makeCtx(w, m, stage, run); F.cur = { ctx, stage, wid, idx };
    UI.hud.show(stage, { onPause: () => openPause() });
    UI.hud.update(0);
    function openPause() {
      if (M.paused) return; M.paused = true;
      const canSkip = M.time - ctx.startT > 120;
      UI.pause({ canSkip, resume() { M.paused = false; }, restart() { M.paused = false; F.startMission(wid, idx); }, quit() { M.paused = false; F.toWorld(wid); }, skip() { M.paused = false; ctx.abort(); ctx.endOpts = { skipped: true }; ctx.stars = Math.max(1, ctx.stars); finish(true); } });
    }
    const kh = e => { if (e.key === 'Escape') { openPause(); return true; } if (e.key === 'Tab' || e.key === 's' || e.key === 'S') { const c = stage.control, i = c.indexOf(stage.active); stage.setActive(c[(i + 1) % c.length]); return true; } return false; };
    M.keys.push(kh); F.cur.kh = kh;
    let finished = false;
    function finish(skipped) {
      if (finished) return; finished = true; const c = F.cur; if (!c || c.ctx !== ctx) return;
      const sd = M.save.data, key = wid + '/' + m.id, prev = sd.progress[key] || {}, stars = Math.max(1, Math.min(3, ctx.stars || 0));
      const first = !prev.done, coins = (first ? 5 : 2) + Math.max(0, stars - (prev.stars || 0)) * 5 + ctx.bonus;
      const wasDone = M.save.done(w) === w.missions.length;
      sd.progress[key] = { done: true, stars: Math.max(prev.stars || 0, stars), plays: (prev.plays || 0) + 1 }; sd.coins += coins;
      const nowDone0 = M.save.done(w) === w.missions.length; const stk = (ctx.endOpts && ctx.endOpts.sticker) || m.sticker; let newSt = null; if (nowDone0 && !wasDone && w.finalSticker) ctx.stickerList.push(w.finalSticker); [].concat(stk || [], ctx.stickerList).forEach(id => { if (id && !sd.stickers[id]) { sd.stickers[id] = Date.now(); newSt = newSt || id; } });
      const dl = ctx.diaryList.length ? ctx.diaryList : (m.diary ? [m.diary] : []);
      dl.forEach(e => { const id = e.id || (w.id + '-' + m.id); const ent = { id, pic: e.pic, text: e.text, date: new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long' }) }; const i = sd.diary.findIndex(x => x.id === id); if (i >= 0) sd.diary[i] = ent; else sd.diary.push(ent); });
      [].concat(m.values || [], ctx.valueList).forEach(v => { sd.valuesPracticed[v] = (sd.valuesPracticed[v] || 0) + 1; });
      M.save.commit(); const nowDone = M.save.done(w) === w.missions.length, justDone = nowDone && !wasDone && !w.hidden;
      const wisdom = (ctx.endOpts && ctx.endOpts.wisdom) || m.wisdom;
      UI.hud.hide(); endMission(); F.cur = null; M.setScene(M.backdrop); M.audio.sfx('fanfare'); M.audio.cheer(stars >= 3 ? 'big' : 'small');
      const hasNext = idx + 1 < w.missions.length;
      const after = () => { if (justDone) UI.celebrate(w, { map: F.toMap, menu: () => F.toWorld(wid) }); else if (hasNext) F.startMission(wid, idx + 1); else F.toWorld(wid); };
      UI.result({ stars, coins, sticker: newSt, wisdom, diary: dl.length > 0, hasNext, world: w, mission: m }, { next: after, retry: () => F.startMission(wid, idx), menu: () => F.toWorld(wid) });
    }
    (async () => {
      try {
        if (!m.hideTitle) await ctx.titleCard('المهمة ' + U.ar(idx + 1) + ': ' + m.title, m.intro);
        await m.run(ctx);
        finish();
      } catch (e) {
        if (e === COMPLETE) finish(); else if (e === ABORT) { /* left the mission */ }
        else { try { console.error(e); } catch (x) { } finish(); }
      }
    })();
  };
})();
