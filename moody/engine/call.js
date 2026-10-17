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
    const S = st.state, fx = 150, fy = 92, fw = 660, fh = 316;
    g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#1d2a4a', '#2f4170']); g.fillRect(0, 0, 960, 540);
    G.fillRR(g, fx - 14, fy - 14, fw + 28, fh + 28, 30, '#0f1426', 5);
    g.save(); G.rr(g, fx, fy, fw, fh, 20); g.clip();
    if (S.phase === 'ring') {
      g.fillStyle = G.lin(g, 0, fy, 0, fy + fh, ['#27406b', '#142340']); g.fillRect(fx, fy, fw, fh);
      for (let i = 0; i < 3; i++) { g.strokeStyle = 'rgba(111,208,255,' + (.5 - i * .15) + ')'; g.lineWidth = 4; g.beginPath(); g.arc(480, 240, 70 + ((t * 40 + i * 28) % 84), 0, 6.3); g.stroke(); }
      M.chars.portrait(g, 'baba', 480, 215, 62);
      G.text(g, 'بابا بيتصل...', 480, 318, { size: 36, color: '#fff' });
    } else {
      // Baba's room (warm wall, window with soft mountain light)
      g.fillStyle = G.lin(g, 0, fy, 0, fy + fh, ['#f2e1c2', '#d9b98a']); g.fillRect(fx, fy, fw, fh);
      g.fillStyle = G.lin(g, 0, fy, 0, fy + 190, ['#bfe3ff', '#eaf6ff']); G.fillRR(g, fx + 440, fy + 24, 170, 130, 8, '#cfe9ff', 4); g.fillStyle = '#9fb8c8'; g.beginPath(); g.moveTo(fx + 446, fy + 150); g.lineTo(fx + 500, fy + 90); g.lineTo(fx + 545, fy + 130); g.lineTo(fx + 580, fy + 100); g.lineTo(fx + 606, fy + 150); g.closePath(); g.fill();
      G.fillRR(g, fx + 40, fy + 40, 90, 70, 6, '#fff7e3', 4); G.star(g, fx + 85, fy + 75, 20, '#ffc93c', 3);
      const h = st.heroes.baba, talking = h.talk > 0;
      g.save(); g.translate(0, Math.sin(t * 1.3) * 2);
      M.chars.draw(g, 'baba', 480 + Math.sin(t * .8) * 4, fy + fh + 150, { anim: 'idle', t, talk: talking, sc: 1.8, noShadow: true, dir: 1 });
      g.restore();
    }
    g.restore();
    // call chrome
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(fx, fy, fw, 38); G.circ(g, fx + 24, fy + 19, 7, S.phase === 'ring' ? '#ffc93c' : '#5cc96b', 0); G.text(g, S.phase === 'ring' ? 'جارٍ الاتصال' : 'بابا · مكالمة فيديو', fx + 44, fy + 20, { size: 20, color: '#fff', align: 'left' });
    if (S.phase !== 'ring') {
      G.fillRR(g, fx + fw - 128, fy + fh - 98, 112, 84, 12, '#142340', 3.5); g.save(); G.rr(g, fx + fw - 126, fy + fh - 96, 108, 80, 10); g.clip(); M.chars.draw(g, 'aboody', fx + fw - 92, fy + fh + 40, { sc: .8, noShadow: true }); M.chars.draw(g, 'moody', fx + fw - 52, fy + fh + 48, { sc: .7, noShadow: true }); g.restore();
      [['#ef5350', 0], ['#4a8dff', 1]].forEach((b, i) => { G.circ(g, fx + 40 + i * 48, fy + fh - 28, 17, b[0], 3); });
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
        const stop = ctx.every(1.5, () => M.audio.sfx('bell'));
        ctx.speak('بابا بيتصل بيكم! اضغطوا عشان تردّوا.');
        await ctx.games.ritual({ text: 'ردّوا على بابا', sub: 'اضغط', bottom: 18 });
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
