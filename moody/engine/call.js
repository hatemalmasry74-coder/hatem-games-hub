/* Moody & Aboody - engine/call.js : "بابا بيتصل" daily video call (a hidden world 'call' with one mission).
   Content pool: content/baba_calls.js.  Once per calendar day gives rewards; replaying the same call is allowed (no extra rewards). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, F = M.flow, U = M.util; M.rooms = M.rooms || {};
  const today = () => { const d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  M.callPending = () => M.save.data.callDay !== today();
  F.toCall = () => F.startMission('call', 0);

  /* ---- the video-call screen (background drawer). state.phase: 'ring' | 'live' ---- */
  M.rooms.callroom = function (g, t, st) {
    const S = st.state, fx = 150, fy = 92, fw = 660, fh = 316, ring = S.phase === 'ring';
    g.fillStyle = G.lin(g, 0, 0, 0, 540, ring ? ['#2a2160', '#171040'] : ['#1d2a4a', '#2f4170']); g.fillRect(0, 0, 960, 540);
    /* soft glow behind the call window */
    g.save(); g.globalAlpha = .5; g.fillStyle = ring ? 'rgba(111,208,255,.35)' : 'rgba(255,210,120,.22)'; g.beginPath(); g.ellipse(480, 250, 470, 250, 0, 0, 6.3); g.fill(); g.restore();
    g.save(); g.shadowColor = 'rgba(0,0,0,.45)'; g.shadowBlur = 28; g.shadowOffsetY = 10; G.fillRR(g, fx - 14, fy - 14, fw + 28, fh + 28, 34, '#0f1426', 0); g.restore();
    G.fillRR(g, fx - 14, fy - 14, fw + 28, fh + 28, 34, '#10162b', 3); g.strokeStyle = 'rgba(255,255,255,.14)'; g.lineWidth = 2; G.rr(g, fx - 11, fy - 11, fw + 22, fh + 22, 31); g.stroke();
    g.save(); G.rr(g, fx, fy, fw, fh, 22); g.clip();
    if (ring) {
      g.fillStyle = G.lin(g, 0, fy, 0, fy + fh, ['#31508a', '#142340']); g.fillRect(fx, fy, fw, fh);
      g.fillStyle = 'rgba(255,255,255,.05)'; for (let i = 0; i < 7; i++) { g.beginPath(); g.arc(fx + 60 + i * 100, fy + 40 + (i % 3) * 90, 38 + (i % 2) * 20, 0, 6.3); g.fill(); }
      for (let i = 0; i < 4; i++) { const k = ((t * .55 + i / 4) % 1); g.strokeStyle = 'rgba(140,215,255,' + (.55 * (1 - k)) + ')'; g.lineWidth = 5 * (1 - k) + 1; g.beginPath(); g.arc(480, 222, 66 + k * 96, 0, 6.3); g.stroke(); }
      const sh = Math.sin(t * 12) * (Math.floor(t * 1.5) % 2 ? 1.5 : 0);
      g.save(); g.translate(480 + sh, 222); M.chars.portrait(g, 'baba', 0, 0, 62); g.restore();
      G.text(g, 'بابا', 480, 316, { size: 40, color: '#fff', stroke: '#10162b', sw: 6 }); G.text(g, 'بيتصل بيكم...', 480, 352, { size: 26, color: '#bfe3ff' });
    } else {
      // Baba's room (warm wall, window with soft mountain light)
      g.fillStyle = G.lin(g, 0, fy, 0, fy + fh, ['#f2e1c2', '#d9b98a']); g.fillRect(fx, fy, fw, fh);
      g.fillStyle = G.lin(g, 0, fy, 0, fy + 190, ['#bfe3ff', '#eaf6ff']); G.fillRR(g, fx + 440, fy + 24, 170, 130, 8, '#cfe9ff', 4); g.fillStyle = '#9fb8c8'; g.beginPath(); g.moveTo(fx + 446, fy + 150); g.lineTo(fx + 500, fy + 90); g.lineTo(fx + 545, fy + 130); g.lineTo(fx + 580, fy + 100); g.lineTo(fx + 606, fy + 150); g.closePath(); g.fill();
      G.fillRR(g, fx + 40, fy + 40, 90, 70, 6, '#fff7e3', 4); G.star(g, fx + 85, fy + 75, 20, '#ffc93c', 3);
      const h = st.heroes.baba, talking = h.talk > 0;
      g.save(); g.translate(0, Math.sin(t * 1.3) * 2);
      M.chars.draw(g, 'baba', 480 + Math.sin(t * .8) * 4, fy + fh + 150, { anim: 'idle', t, talk: talking, sc: 1.8, noShadow: true, dir: 1 });
      g.restore();
      g.fillStyle = G.lin(g, 0, fy + fh - 90, 0, fy + fh, ['rgba(0,0,0,0)', 'rgba(0,0,0,.35)']); g.fillRect(fx, fy + fh - 90, fw, 90);
    }
    g.restore();
    // call chrome
    g.save(); G.rr(g, fx, fy, fw, 42, 22); g.clip(); g.fillStyle = G.lin(g, 0, fy, 0, fy + 42, ['rgba(10,14,40,.72)', 'rgba(10,14,40,.35)']); g.fillRect(fx, fy, fw, 42); g.restore();
    const pulse = .6 + .4 * Math.sin(t * 5); G.circ(g, fx + 26, fy + 21, 7, ring ? '#ffc93c' : 'rgba(92,201,107,' + (.55 + pulse * .45) + ')', 0);
    G.text(g, ring ? 'جارٍ الاتصال' : 'بابا · مكالمة فيديو', fx + 46, fy + 22, { size: 21, color: '#fff', align: 'left' });
    if (!ring) {
      const mm = Math.floor(t / 60), ss = Math.floor(t % 60); G.text(g, M.util.ar((mm < 10 ? '0' : '') + mm + ':' + (ss < 10 ? '0' : '') + ss), fx + fw - 22, fy + 22, { size: 20, color: '#d7e6ff', align: 'right' });
      g.save(); g.shadowColor = 'rgba(0,0,0,.4)'; g.shadowBlur = 10; G.fillRR(g, fx + fw - 132, fy + fh - 102, 116, 88, 16, '#142340', 3); g.restore(); g.save(); G.rr(g, fx + fw - 129, fy + fh - 99, 110, 82, 13); g.clip(); g.fillStyle = G.lin(g, 0, fy + fh - 99, 0, fy + fh, ['#3a5a96', '#1d2f58']); g.fillRect(fx + fw - 129, fy + fh - 99, 110, 82); M.chars.draw(g, 'aboody', fx + fw - 92, fy + fh + 40, { sc: .8, noShadow: true }); M.chars.draw(g, 'moody', fx + fw - 52, fy + fh + 48, { sc: .7, noShadow: true }); g.restore();
      /* glossy call controls: mute / camera / hang up */
      [['#5b6fa6', 0], ['#5b6fa6', 1], ['#ef4b4b', 2]].forEach((b, i) => { const cx = fx + 44 + i * 58, cy = fy + fh - 34; G.circ(g, cx, cy + 3, 21, 'rgba(0,0,0,.3)', 0); G.circ(g, cx, cy, 21, b[0], 2.5); g.fillStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx, cy - 9, 13, 7, 0, 0, 6.3); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 3.5; g.lineCap = 'round'; g.lineJoin = 'round';
        if (i === 0) { G.fillRR(g, cx - 4, cy - 10, 8, 14, 4, '#fff', 0); g.beginPath(); g.arc(cx, cy - 1, 9, .2, Math.PI - .2); g.stroke(); g.beginPath(); g.moveTo(cx, cy + 8); g.lineTo(cx, cy + 12); g.stroke(); }
        else if (i === 1) { G.fillRR(g, cx - 11, cy - 7, 14, 14, 3, '#fff', 0); G.poly(g, [[cx + 5, cy - 3], [cx + 12, cy - 7], [cx + 12, cy + 7], [cx + 5, cy + 3]], '#fff', 0); }
        else { g.beginPath(); g.arc(cx, cy + 8, 13, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); } });
    }
  };

  function pickCall(again) {
    const sd = M.save.data, pool = M.babaCalls || [];
    if (again && sd.callId) { const c = pool.find(x => x.id === sd.callId); if (c) return c; }
    return pool[(sd.callCount || 0) % pool.length];
  }

  M.registerWorld({
    id: 'call', hidden: true, order: 999, title: 'بابا بيتصل', icon: 'phone', theme: { c1: '#2f4170', c2: '#1d2a4a' },
    stickers: [{ id: 'f_baba', title: 'مكالمة بابا', art: 'face:baba', bg: '#dfe8ff' }, { id: 'f_toota', title: 'توتا', art: 'face:toota', bg: '#ffe7ee' }, { id: 'f_nemo', title: 'نيمو', art: 'face:nemo', bg: '#ffe0ec' }, { id: 'f_nana', title: 'ننا زوزا', art: 'face:nana', bg: '#f1e6ff' }, { id: 'f_family', title: 'العيلة الحلوة', art: 'home', bg: '#fff0c4' }, { id: 'f_amani', title: 'عمتو أماني', art: 'face:amani', bg: '#ffe9dc' }, { id: 'f_nada', title: 'عمتو ندى', art: 'face:nada', bg: '#e3f1fa' }, { id: 'f_kamal', title: 'عمو كمال', art: 'face:kamal', bg: '#e1ecfa' }, { id: 'f_cousins', title: 'أولاد العمّة', art: 'face:ofa', bg: '#e1f6e8' }],
    missions: [{
      id: 'daily', title: 'مكالمة بابا', intro: 'بابا بيتصل بيكم!', icon: 'phone', hideTitle: true, values: ['thanks', 'kindness'], wisdom: 'العيلة هي الأمان',
      async run(ctx) {
        const sd = M.save.data, again = sd.callDay === today(), ch = pickCall(again), st = ctx.stage, pk = a => U.pick(a);
        ctx.mission.wisdom = ch.wisdom;
        await ctx.scene('callroom', { state: { phase: 'ring' }, heroes: 'corner' });
        M.audio.sfx('ring'); const stop = ctx.every(1.6, () => M.audio.sfx('ring'));
        ctx.speak('بابا بيتصل بيكم! اضغطوا عشان تردّوا.');
        await ctx.games.ritual({ text: 'ردّوا على بابا', sub: 'اضغط', bottom: 18, icon: 'phone', tone: 'call' });
        stop(); st.state.phase = 'live'; ctx.sfx('unlock');
        await ctx.say('baba', pk(M.babaGreetings), { anim: 'wave' });
        await ctx.say('baba', pk(M.babaHowWasDay));
        const day = await ctx.games.choice({ prompt: 'احكوا لبابا عن يومكم', options: [{ text: 'يوم حلو أوي', art: 'smile', good: true }, { text: 'يوم عادي', art: 'clock', good: true }, { text: 'تعبانين شوية', art: 'sad', good: true }] });
        await ctx.say('baba', pk(day.index === 0 ? M.babaDayReplies.good : day.index === 1 ? M.babaDayReplies.ok : M.babaDayReplies.tired));
        await ctx.say('baba', ch.intro);
        let good = true;
        if (ch.type === 'habit') { await ctx.say('baba', ch.task); await ctx.games.ritual({ text: ch.btn || 'عملنا كده!', sub: ch.sub || 'اضغطوا لما تخلّصوا' }); ctx.value('help'); }
        else if (ch.type === 'quiz') { const r = await ctx.quiz.ask(ch.q, { who: ch.who }); good = r.tries === 1; }
        else if (ch.type === 'pair') { const r = await ctx.quiz.pair({ cat: ch.cat }); good = r.firstTry >= 1; }
        else if (ch.type === 'count') {
          const spots = []; for (let i = 0; i < ch.n; i++) spots.push({ id: 'c' + i, art: ch.art, x: 250 + (i % 5) * 110 + U.rnd(-14, 14), y: 190 + Math.floor(i / 5) * 90 + U.rnd(-10, 10), s: 70, hit: 46 });
          await ctx.games.tap({ prompt: 'اضغط على كل ' + ch.noun, list: false, noWalk: true, spots });
          const r = await ctx.quiz.ask({ id: 'bcq_' + ch.id, category: 'counting', tier: 6, q: 'كام ' + ch.noun + ' عدّينا؟', choices: [U.ar(ch.n), U.ar(ch.n + 1), U.ar(ch.n - 1)], answer: 0, hint: 'عدّهم واحدة واحدة' }, { who: 'aboody' }); good = r.tries === 1;
        }
        else if (ch.type === 'memory') { await ctx.games.memory({ pairs: ch.pairs }); ctx.skill('memory'); }
        else if (ch.type === 'order') { const r = await ctx.games.sequence({ steps: ch.steps }); good = r.mistakes <= 1; }
        await ctx.say('baba', pk(M.babaPraise), { anim: 'cheer' }); ctx.react('good', 'both');
        if (!again) {
          sd.callDay = today(); sd.callId = ch.id; sd.callCount = (sd.callCount || 0) + 1; M.save.commit();
          ctx.reward.star(2); if (good) ctx.reward.star(1); ctx.reward.coins(8);
          const n = sd.callCount, g2 = { 1: 'f_baba', 3: 'f_toota', 5: 'f_nemo', 8: 'f_nana', 12: 'f_family', 15: 'f_amani', 18: 'f_nada', 21: 'f_kamal', 24: 'f_cousins' }[n]; if (g2) { ctx.sticker.give(g2); }
        } else { ctx.reward.star(1); }
        ctx.diary.add({ id: 'call-' + today(), pic: 'phone', text: 'اتصل بينا بابا وعملنا تحدّي اليوم' });
        await ctx.say('baba', pk(M.babaBye), { anim: 'wave' });
        return ctx.nav.complete({ wisdom: ch.wisdom });
      }
    }]
  });
})();
