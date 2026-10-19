/* Moody & Aboody - worlds/saudi.js : WORLD 8 "السفر لبابا في السعودية" (7 missions).
   The family travels from Cairo to Abha (Asir, Saudi Arabia) to visit Baba. Heroes: the 4 kids are present and controllable (Moody strong, Aboody small,
   Toota leader, Nemo finder/small); Baba appears from mission 5 on. Needs (loaded before): content/q_saudi.js, worlds/saudi_art.js.
   Strings: single quotes, no apostrophes (the voice collector scans ctx.say('who','text')).  Tokens {m} {a} {t} {n}. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, sh = U.shuffle;
  const ALL = ['moody', 'aboody', 'toota', 'nemo'], WITHBABA = ALL.concat(['baba']), WITHKAMAL = WITHBABA.concat(['kamal']);   // kamal = Uncle Kamal (Baba's younger brother, lives in Abha with Baba)
  M.voice.extraVoices = M.voice.extraVoices || {}; M.voice.extraVoices.saudi_officer = 'narrator';
  const OFF = 'موظف المطار', CAP = 'الكابتن';

  M.registerValue('sd_rules', { label: 'اتباع تعليمات السفر', desc: 'الطابور والفحص والحزام: كل قاعدة بتحمينا' });
  M.registerValue('sd_polite', { label: 'الأدب مع الموظفين', desc: 'السلام والشكر وطلب الحاجة بلطف' });
  M.registerValue('sd_tripsafety', { label: 'الأمان في السفر', desc: 'الحزام وأنوار الضباب والتهدية في الطريق' });
  M.registerValue('sd_family', { label: 'حب العيلة', desc: 'الشوق لبابا والحضن والهدايا' });
  M.registerValue('sd_dua', { label: 'دعاء السفر', desc: 'نقول دعاء السفر قبل ما نتحرك' });

  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); const a0 = g.globalAlpha; g.globalAlpha = a0 * (.28 + .22 * Math.sin(t * 4)); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = a0 * .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  /* a find-me sticker: round white sign with an art inside */
  const sign = (art, s, o) => (g, t, st, sp) => { o = o || {}; pulse(s * .62)(g, t, st, sp); g.save(); G.circ(g, 0, 0, s * .5, 'rgba(255,255,255,.94)', 4); A.draw(g, art, 0, 2, s * .66); g.restore(); };
  const loopX = (x0, sp, loop, off) => t => ((x0 - t * sp) % loop + loop) % loop + off;
  const pairQ = (ctx, tag) => ctx.quiz.pair({ aboody: M.pickQuestions({ tier: 6, tag, n: 1 })[0], moody: M.pickQuestions({ tier: 9, tag, n: 1 })[0] });
  const cnt = async (ctx, fn) => { const m0 = ctx.mistakes; const r = await fn(); return { r, miss: ctx.mistakes - m0 }; };
  const SEATS = [190, 380, 570, 760];
  const note = (list, sp) => list.forEach(t => M.voice.note(t, sp || 'narrator'));
  /* voice-collection helper: registers every reply / consequence line of a choice (even the ones a bot never opens), then runs the choice kit */
  const choiceQ = (ctx, o) => { o.options.forEach(op => [].concat(op.reply || [], Array.isArray(op.consequence) ? op.consequence : []).forEach(l => M.voice.note(l[1], l[0]))); return ctx.games.choice(o); };

  M.registerWorld({
    id: 'saudi', order: 8, title: 'السفر لبابا في السعودية', icon: 'w_saudi', theme: { c1: '#ffe0a8', c2: '#e0a24a' }, finalSticker: 'saudi_traveler',
    heroes: ALL, control: ALL,
    stickers: [
      { id: 'saudi_s_pack', title: 'شنطة جاهزة', art: 'saudi_suitcase:teal:band', bg: '#d6f3ee' },
      { id: 'saudi_s_passport', title: 'ختم الجواز', art: 'saudi_stampmark', bg: '#e0ecff', rot: .1 },
      { id: 'saudi_s_plane', title: 'مسافر في السما', art: 'saudi_plane', bg: '#dff0ff', rot: -.1 },
      { id: 'saudi_s_hug', title: 'حضن بابا', art: 'saudi_heartpin', bg: '#ffe0ea' },
      { id: 'saudi_s_cable', title: 'راكب التلفريك', art: 'saudi_cablecar', bg: '#fff3c4', rot: .06 },
      { id: 'saudi_traveler', title: 'مسافر ماهر', art: 'saudi_traveler', bg: '#ffe9c8', rot: -.05 }
    ],
    missions: [
      /* ============ 1) نجهّز الشنطة ============ */
      {
        id: 'm1', title: 'نجهّز الشنطة', intro: 'بكرة هنسافر لبابا في السعودية.. يلا نجهّز الشنطة!', values: ['planning', 'teamwork'], sticker: 'saudi_s_pack',
        wisdom: 'اللي يجهّز شنطته بدري.. يسافر مرتاح', diary: { pic: 'saudi_suitcase:teal:band', text: 'جهّزنا شنطة السفر وسط الجواز والتذاكر والدبدوب' },
        async run(ctx) {
          note(['الجوازات فوق الرف العالي! محتاجين {m} الطويل', 'التذاكر تحت الكنبة في فتحة ضيقة! محتاجين {a} أو {n} الصغيرين', 'الدبدوب مستخبي ورا الستارة! محتاجين {n} الفضولية', 'الجوازات مع {t} القايدة', 'ده مش هنحتاجه في السفر.. نسيبه في البيت', 'ده بيفضل في البيت يا حبيبي']);
          const st = ctx.stage, nm = ctx.names;
          await ctx.scene('saudiHome', { state: { suitcase: 'open', caseX: 700, caseY: 432 }, heroes: { nemo: { x: 250, y: 492, dir: 1 }, toota: { x: 330, y: 484, dir: 1 }, moody: { x: 420, y: 480, dir: 1 }, aboody: { x: 510, y: 492, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، بكرة بإذن الله هنسافر لبابا في أبها! لازم نجهّز كل حاجة النهاردة.');
          await ctx.say('aboody', 'يلا يلا! وحشني بابا أوي!', { anim: 'cheer' });
          await ctx.say('toota', 'أنا عملت قايمة: الجوازات والتذاكر والدبدوب. بس الثلاثة دول ضايعين!', { anim: 'think' });
          await ctx.say('nemo', 'ولا يهمك يا توتا، هدوّر معاكم! كل واحد فينا له حاجة يعرف يعملها.', { anim: 'wave' });
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الجوازات والتذاكر والدبدوب', hintAfter: 14, spots: [
              { id: 'pass', art: 'saudi_passport:red', x: 800, y: 124, s: 62, hit: 56, needs: 'strong', walkOff: 0, listArt: 'saudi_passport:red', draw: (g, t, s0, s) => { pulse(46)(g, t, s0, s); A.draw(g, 'saudi_passport:red', 0, 0, 62); }, needsMsg: 'الجوازات فوق الرف العالي! محتاجين {m} الطويل', onFound: () => ctx.say('moody', 'وصلتلهم! الجوازات في إيدي.') },
              { id: 'tick', art: 'saudi_ticket', x: 150, y: 428, s: 54, hit: 54, needs: 'small', walkOff: 0, listArt: 'saudi_ticket', draw: (g, t, s0, s) => { pulse(42)(g, t, s0, s); A.draw(g, 'saudi_ticket', 0, 0, 54); }, needsMsg: 'التذاكر تحت الكنبة في فتحة ضيقة! محتاجين {a} أو {n} الصغيرين', onFound: () => ctx.say('aboody', 'لقيتها تحت الكنبة! التذاكر معانا.') },
              { id: 'ted', art: 'teddy', x: 368, y: 330, s: 54, hit: 52, needs: 'finder', walkOff: 0, listArt: 'teddy', draw: (g, t, s0, s) => { pulse(42)(g, t, s0, s); A.draw(g, 'teddy', 0, 0, 54); }, needsMsg: 'الدبدوب مستخبي ورا الستارة! محتاجين {n} الفضولية', onFound: () => ctx.say('nemo', 'لقيت الدبدوب مستخبي ورا الستارة!', { anim: 'cheer' }) }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          await ctx.say('toota', 'كلهم اتلاقوا! الحمد لله. دلوقتي نحط في الشنطة اللي هنحتاجه بس.', { anim: 'cheer' });
          st.state.suitcase = 'open';
          const items = [['saudi_passport:red', 'case', 'leader'], ['saudi_ticket', 'case'], ['teddy', 'case'], ['saudi_sweater', 'case'], ['saudi_coat', 'case'], ['tee', 'case'], ['toothbrush', 'case'], ['pot', 'home'], ['fan', 'home'], ['plant', 'home']];
          const pk = await cnt(ctx, () => ctx.games.dragdrop({
            prompt: 'حطّوا في الشنطة اللي هنحتاجه في السفر', heroes: 'corner', panel: { x: 110, y: 120, w: 740, h: 196 }, wrongHint: 'ده مش هنحتاجه في السفر.. نسيبه في البيت',
            items: sh(items).map((it, i) => ({ id: 'i' + i, art: it[0], to: it[1], needs: it[2], needsMsg: 'الجوازات مع {t} القايدة', x: 200 + (i % 5) * 140, y: 178 + Math.floor(i / 5) * 76, s: 64, hint: it[1] === 'home' ? 'ده بيفضل في البيت يا حبيبي' : null })),
            targets: [{ id: 'case', x: 700, y: 428, w: 200, h: 96, label: 'الشنطة', cols: 4, dx: 30, itemScale: .5, draw: () => { } }, { id: 'home', x: 250, y: 420, w: 130, h: 100, art: 'box', s: 110, label: 'نسيبه في البيت', cols: 3, dx: 24, itemScale: .45 }]
          }));
          if (pk.miss <= 2) ctx.reward.star(1);
          ctx.value('planning'); ctx.heroes('floor');
          await ctx.say('mama', 'ما شاء الله! بس لازم نرتّب الشنطة صح: الحاجات التقيلة تحت، والخفيفة فوق.');
          const sq = await cnt(ctx, () => ctx.games.sequence({ prompt: 'رتّب الشنطة: التقيل تحت والخفيف فوق', steps: [{ art: 'shoe', label: 'الجزمة تحت' }, { art: 'book', label: 'الكتب' }, { art: 'saudi_sweater', label: 'الهدوم' }, { art: 'teddy', label: 'الدبدوب فوق' }] }));
          ctx.heroes({ nemo: { x: 250, y: 492, dir: 1 }, toota: { x: 330, y: 484, dir: 1 }, moody: { x: 420, y: 480, dir: 1 }, aboody: { x: 510, y: 492, dir: 1 } });
          await ctx.say('moody', 'الشنطة ثقلها كام يا ترى؟ لازم نحسب عشان المطار.');
          const q = await pairQ(ctx, 'saudi_m1');
          if (sq.miss <= 1 && q.firstTry >= 1) ctx.reward.star(1);
          st.state.suitcase = 'closed';
          await ctx.say('mama', 'اتقفلت الشنطة! بكرة الصبح بإذن الله نطلع على مطار القاهرة.');
          await ctx.say('nemo', 'أنا مش قادرة أستنى! نفسي أشوف الجبال اللي بابا بيحكي عنها.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 2) مطار القاهرة ============ */
      {
        id: 'm2', title: 'مطار القاهرة', intro: 'الطابور والجوازات والفحص.. كل خطوة ليها قواعد!', values: ['patience', 'sd_rules', 'sd_polite'], sticker: 'saudi_s_passport',
        wisdom: 'الصبر والأدب في الطابور بيخلّوا السفر أسهل', diary: { pic: 'saudi_passport:red', text: 'استنينا في الطابور بصبر وسلّمنا الجوازات بأدب' },
        async run(ctx) {
          note(['استنّوا شوية.. لسه الناس اللي قدامنا بيخلّصوا', 'الشنطة الكبيرة تقيلة! محتاجين {m} القوي', 'ده دور {a} و{n}!', 'الشنطة هنا على الميزان', 'الجوازات مع {t} القايدة', 'ده مش للصينية.. بصّوا على الصور تاني', 'العصير نشربه الأول قبل الفحص']);
          const st = ctx.stage, FAM = ['aboody', 'moody', 'nemo', 'toota'];
          await ctx.scene('saudiAirport', { state: { kind: 'hall' }, heroes: { toota: { x: 220, y: 484, dir: 1 }, nemo: { x: 300, y: 492, dir: 1 }, moody: { x: 380, y: 480, dir: 1 }, aboody: { x: 460, y: 492, dir: 1 } } });
          await ctx.say('mama', 'وصلنا مطار القاهرة! أول حاجة نقف في الطابور بهدوء وننتظر دورنا.');
          await ctx.say('aboody', 'أنا عايز أجري ناحية الشباك!', { anim: 'oops' });
          await ctx.say('toota', 'لأ يا {a}. الطابور بنمشي فيه خطوة خطوة، لما يجيلنا الدور.');
          /* ---- the queue (patience): 3 people ahead, tap the green arrow only when the way is clear ---- */
          const P = [{ x: 700, c: 'blue', k: 'c', s: 0, bag: 'orange', pat: 'band', a: 1 }, { x: 620, c: 'purple', k: 'b', s: 1, bag: 'green', pat: 'dots', a: 1 }, { x: 540, c: 'orange', k: 'a', s: 2, bag: 'red', pat: 'stripe', a: 1 }];
          const rmL = st.addLayer({ z: -1, draw: g => { P.forEach(p => { g.save(); g.globalAlpha = p.a; A.draw(g, 'saudi_person:' + p.c + ':' + p.k + ':' + p.s, p.x, 398, 150); A.draw(g, 'saudi_suitcase:' + p.bag + ':' + p.pat, p.x + 48, 438, 62); g.restore(); }); } });
          let open = false, cur = 0, early = 0;
          const cycle = async i => {
            await ctx.wait(i === 0 ? 1.6 : 2.2);
            const fr = P.shift(); M.tw(fr, { x: 930, a: 0 }, .9, 'inOut'); P.forEach(p => M.tw(p, { x: p.x + 80 }, .6, 'inOut'));
            await ctx.wait(.8); ctx.sfx('bell'); open = true; cur = i; st.state.green = true;
          };
          const btn = i => (g, t, s0, s) => {
            s.disabled = !(open && cur === i); if (s.found || cur !== i) return;
            if (open) { pulse(56)(g, t, s0, s); G.circ(g, 0, 0, 44, '#5cc96b', 5); A.draw(g, 'arrow', 0, 0, 52); }
            else { G.circ(g, 0, 0, 44, '#ffd23c', 5); A.draw(g, 'clock', 0, 0, 58); }
          };
          const adv = async i => { open = false; st.state.green = false; await Promise.all(FAM.map(k => st.walk(k, st.heroes[k].x + 80, st.heroes[k].y))); if (i < 2) cycle(i + 1).catch(() => { }); };
          const qp = ctx.games.hidden({ prompt: 'استنّوا لحد ما الضوء يبقى أخضر.. وبعدين اضغط السهم', list: false, noWalk: true, hintAfter: 99, spots: [0, 1, 2].map(i => ({ id: 'g' + i, x: 590, y: 196, s: 86, hit: 62, keep: true, noBadge: true, anim: 'idle', draw: btn(i), onFound: () => adv(i) })) });
          const inp = st.input; st.input = { down(x, y, id, e) { const r = inp.down(x, y, id, e); if (!open && Math.hypot(x - 590, y - 196) < 70) { early++; ctx.stage.bubble('toota', 'استنّوا شوية.. لسه الناس اللي قدامنا بيخلّصوا', 2.2); ctx.mistake(); } return r; } };
          cycle(0).catch(() => { }); await qp; rmL(); st.state.green = false;
          if (early <= 1) ctx.reward.star(1); ctx.value('patience'); ctx.skill('ethics');
          await ctx.say('nemo', 'برافو علينا! استنينا دورنا من غير ما نزق حد.', { anim: 'cheer' });
          /* ---- check-in desk: polite words ---- */
          ctx.heroes({ toota: { x: 470, y: 484, dir: 1 }, nemo: { x: 550, y: 492, dir: 1 }, moody: { x: 630, y: 480, dir: 1 }, aboody: { x: 710, y: 492, dir: 1 } });
          await ctx.say('saudi_officer', 'صباح الخير يا أبطال! رايحين فين النهاردة؟', { name: OFF });
          const c1 = await choiceQ(ctx, {
            prompt: 'نرد على الموظف إزاي؟', options: sh([
              { text: 'صباح النور! رايحين أبها نزور بابا', art: 'baba', good: true, reply: [['saudi_officer', 'ما شاء الله! بابا هيفرح بيكم أوي. رحلة سعيدة!', { name: OFF }]] },
              { text: 'مستعجلين! خلّصنا بسرعة', art: 'x', good: false, consequence: [['saudi_officer', 'بالراحة يا حبيبي. بنقول صباح الخير ولو سمحت، والكل هيخلّص بسرعة.', { name: OFF }]] },
              { text: 'نسكت ونبص في الموبايل', art: 'tablet', good: false, consequence: [['toota', 'الأدب إننا نرد على الناس ونقول صباح الخير.']] }])
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('sd_polite'); ctx.value('respect');
          await ctx.say('saudi_officer', 'الأول نوزن الشنط. شيلوهم على الميزان.', { name: OFF });
          const sc = await ctx.games.dragdrop({
            prompt: 'شيلوا الشنط على الميزان', heroes: 'corner', wrongHint: 'الشنطة هنا على الميزان',
            items: [{ id: 'big', art: 'saudi_suitcase:teal:band', to: 'scale', needs: 'strong', needsMsg: 'الشنطة الكبيرة تقيلة! محتاجين {m} القوي', x: 330, y: 330, s: 96 }, { id: 'small', art: 'saudi_suitcase:pink:dots', to: 'scale', needs: 'small', needsMsg: 'ده دور {a} و{n}!', x: 460, y: 336, s: 82 }],
            targets: [{ id: 'scale', x: 840, y: 296, w: 130, h: 90, label: 'الميزان', itemScale: .5, cols: 2, dx: 30, draw: () => { } }]
          });
          ctx.heroes({ toota: { x: 470, y: 484, dir: 1 }, nemo: { x: 550, y: 492, dir: 1 }, moody: { x: 630, y: 480, dir: 1 }, aboody: { x: 710, y: 492, dir: 1 } });
          await ctx.say('saudi_officer', 'الوزن تمام! خدوا بطاقات الصعود، وروحوا للجوازات.', { name: OFF });
          /* ---- passport control ---- */
          await ctx.scene('saudiAirport', { state: { kind: 'passport' }, heroes: { toota: { x: 220, y: 484, dir: 1 }, nemo: { x: 300, y: 492, dir: 1 }, moody: { x: 380, y: 480, dir: 1 }, aboody: { x: 460, y: 492, dir: 1 } } });
          await ctx.say('toota', 'الجوازات مع الكبيرة! أنا اللي هسلّم الجوازات للضابط.', { anim: 'wave' });
          await ctx.games.hidden({ prompt: '{t} تسلّم الجوازات للضابط', list: false, spots: [{ id: 'pp', art: 'saudi_passport:red', x: 700, y: 392, s: 64, hit: 58, needs: 'leader', walkOff: -90, keep: true, noBadge: false, draw: (g, t, s0, s) => { pulse(48)(g, t, s0, s); A.draw(g, 'saudi_passport:red', 0, 0, 64); }, needsMsg: 'الجوازات مع {t} القايدة' }] });
          await ctx.say('saudi_officer', 'السلام عليكم. جوازاتكم سليمة. بتسافروا ليه يا أبطال؟', { name: OFF });
          const c2 = await choiceQ(ctx, {
            prompt: 'الضابط بيسأل: رايحين فين؟', options: sh([
              { text: 'رايحين نزور بابا. هو بيشتغل في السعودية', art: 'heartbig', good: true, reply: [['saudi_officer', 'ربنا يحفظكم ويوصلكم بالسلامة. رحلة سعيدة!', { name: OFF }]] },
              { text: 'مش عايز أرد على حد غريب', art: 'sad', good: false, consequence: [['toota', 'الضابط بيعمل شغله وبيسأل بأدب. بنرد عليه بهدوء وبكلمة طيبة.']] },
              { text: 'نجري ونعدّي من غير ما نسلّم', art: 'x', good: false, consequence: [['saudi_officer', 'استنّى يا حبيبي. كل المسافرين بيعدّوا من هنا بالدور وبالقواعد.', { name: OFF }]] }])
          });
          if (c2.firstTry) ctx.reward.star(1); ctx.value('sd_rules');
          /* ---- security tray ---- */
          await ctx.scene('saudiAirport', { state: { kind: 'security' }, heroes: 'corner' });
          await ctx.say('saudi_officer', 'الفحص الأمني: الحاجات المعدن والموبايل ينزلوا في الصينية. العصير نشربه الأول.', { name: OFF });
          const tr = await cnt(ctx, () => ctx.games.dragdrop({
            prompt: 'حطّوا المفاتيح والموبايل والحزام في الصينية', heroes: 'corner', panel: { x: 120, y: 110, w: 560, h: 110 }, wrongHint: 'ده مش للصينية.. بصّوا على الصور تاني',
            items: sh([['key', 'tray'], ['saudi_phone', 'tray'], ['saudi_belt', 'tray'], ['saudi_juice', 'drink']]).map((it, i) => ({ id: 'x' + i, art: it[0], to: it[1], x: 200 + i * 115, y: 168, s: 62, hint: it[1] === 'drink' ? 'العصير نشربه الأول قبل الفحص' : null })),
            targets: [{ id: 'tray', x: 700, y: 392, w: 200, h: 70, art: 'saudi_tray', s: 130, label: 'الصينية', cols: 4, dx: 30, itemScale: .5, dy0: -10 }, { id: 'drink', x: 410, y: 330, w: 110, h: 90, art: 'cup', s: 80, label: 'نشرب الأول', itemScale: .5 }]
          }));
          if (tr.miss <= 2) ctx.reward.star(1);
          ctx.value('sd_rules'); ctx.heroes('floor');
          await ctx.say('saudi_officer', 'ممتاز! اتبعتوا القواعد صح. تعالوا نشوف مين هيعدّي أول واحد.', { name: OFF });
          await pairQ(ctx, 'saudi_m2');
          await ctx.say('mama', 'يلا على البوابة! الطيارة مستنيانا.');
          return ctx.nav.complete();
        }
      },
      /* ============ 3) في الطيارة ============ */
      {
        id: 'm3', title: 'في الطيارة', intro: 'نربط الحزام، نقول دعاء السفر، ونطير فوق السحاب!', values: ['sd_tripsafety', 'sd_dua', 'sd_rules'], sticker: 'saudi_s_plane',
        wisdom: 'الحزام أمان.. والدعاء بركة في السفر', diary: { pic: 'saudi_plane', text: 'ربطنا الحزام وقلنا دعاء السفر وشفنا السحاب من الشباك' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('saudiCabin', { state: { b: [false, false, false, false], seated: true }, heroes: 'hidden' });
          await ctx.say('mama', 'وصلنا أماكننا في الطيارة! ما شاء الله.');
          await ctx.say('nemo', 'أنا عايزة الشباك! لا استني.. كلنا هنتبادل بعدين.');
          await ctx.say('toota', 'الأول الحزام يا جماعة. الأمان قبل أي حاجة.', { anim: 'wave' });
          const buckle = i => ({ id: 'b' + i, x: SEATS[i], y: 449, s: 70, hit: 52, keep: true, noBadge: true, anim: 'idle', draw: (g, t, s0, s) => { if (s.found) return; pulse(36)(g, t, s0, s); G.fillRR(g, -13, -11, 26, 22, 5, '#ef5350', 4); G.circ(g, 0, 0, 4, '#fff', 2); }, onFound: () => { st.state.b[i] = true; ctx.sfx('click'); } });
          const bl = await ctx.games.hidden({ prompt: 'اربطوا حزام الأمان: دوس على كل إبزيم', list: false, noWalk: true, hintAfter: 10, spots: [0, 1, 2, 3].map(buckle) });
          if (bl.wrong <= 2) ctx.reward.star(1); ctx.value('sd_tripsafety');
          await ctx.say('toota', 'كلنا ربطنا الحزام. دلوقتي نقول دعاء السفر قبل ما نطير.');
          await ctx.say('mama', 'سبحان الذي سخّر لنا هذا وما كنّا له مقرنين، وإنا إلى ربنا لمنقلبون.');
          ctx.prompt('اضغط وقولوا دعاء السفر: سبحان الذي سخّر لنا هذا'); await ctx.games.ritual({ bottom: 290, text: 'دعاء السفر', sub: 'سبحان الذي سخّر لنا هذا', who: 'toota' });
          ctx.value('sd_dua'); ctx.fx.burst(480, 300, { kind: 'star', n: 12 });
          await ctx.say('narrator', 'والطيارة بدأت تجري على الممر.. وبعدين طارت!');
          ctx.fx.shake(5);
          await ctx.scene('saudiSky', { state: { prog: 0 }, heroes: 'hidden' });
          const fly = M.tw(st.state, { prog: .62 }, 26, 'inOut');
          await ctx.say('aboody', 'الله! إحنا فوق السحاب! القاهرة بقت صغيرة أوي!', { anim: 'cheer' });
          const cl = await ctx.games.hidden({
            prompt: 'دوّروا على السحابة الأرنب والقلب والسمكة', hintAfter: 16, noWalk: true, spots: [
              { id: 'rab', art: 'saudi_cloud:rabbit', y: 220, x: 700, s: 92, hit: 56, listArt: 'saudi_cloud:rabbit', fx: loopX(700, 26, 840, 60), onFound: () => ctx.say('nemo', 'ده شكل أرنب! ما شاء الله.') },
              { id: 'hrt', art: 'saudi_cloud:heart', y: 168, x: 500, s: 88, hit: 54, listArt: 'saudi_cloud:heart', fx: loopX(500, 30, 840, 60), onFound: () => ctx.say('toota', 'سحابة على شكل قلب! زي شوقنا لبابا.') },
              { id: 'fsh', art: 'saudi_cloud:fish', y: 275, x: 300, s: 86, hit: 54, listArt: 'saudi_cloud:fish', fx: loopX(300, 22, 840, 60), onFound: () => ctx.say('aboody', 'سمكة في السما! عجيبة!') }].map(sp => Object.assign(sp, { draw: (g, t, s0, s) => { if (!s.found) { s.x = sp.fx(t); const e = Math.max(0, Math.min(1, Math.min(s.x - 110, 860 - s.x) / 50)); s.alpha = Math.max(.01, e); s.disabled = e < .5; pulse(54)(g, t, s0, s); } A.draw(g, sp.art, 0, 0, sp.s); } }))
          });
          if (cl.wrong <= 2) ctx.reward.star(1);
          await ctx.say('moody', 'ما شاء الله! بنعدّي دلوقتي فوق البحر الأحمر.', { anim: 'think' });
          await pairQ(ctx, 'saudi_m3');
          await ctx.say('nemo', 'لعبة قصيرة لحد ما نوصل: ورق السفر المتخبّي!');
          await ctx.games.memory({ prompt: 'لاقوا الأزواج المتشابهة', pairs: ['saudi_passport:red', 'saudi_suitcase:blue:star', 'saudi_plane'], cols: 3 });
          await fly;
          await ctx.say('narrator', 'فجأة.. الطيارة اتهزت شوية، وضوء حزام الأمان نوّر!');
          ctx.fx.shake(4); ctx.sfx('wrong');
          const c = await choiceQ(ctx, {
            prompt: 'الطيارة بتهتز شوية. نعمل إيه؟', options: sh([
              { text: 'نفضل قاعدين ونربط الحزام كويس', art: 'saudi_seatbelt', good: true, reply: [['toota', 'برافو! كده إحنا في أمان، والهزة بتعدّي.']] },
              { text: 'نقوم نجري في الممر', art: 'x', good: false, consequence: [['mama', 'لأ يا حبيبي! لما الحزام يبقى منوّر بنفضل قاعدين عشان ما نتعورش.']] },
              { text: 'نفك الحزام ونقف على الكرسي', art: 'sad', good: false, consequence: [['toota', 'الوقوف في الهزة خطر. الحزام يفضل مربوط لحد ما الضوء ينطفي.']] }])
          });
          if (c.firstTry) ctx.reward.star(1); ctx.value('sd_tripsafety');
          await ctx.say('narrator', 'والجو هدي تاني.. وظهرت تحت الجبال الخضرا.');
          await ctx.say('narrator', 'سادتي الركّاب، بعد دقايق هنهبط في مطار أبها. نرجو ربط الأحزمة.', { name: CAP });
          return ctx.nav.complete();
        }
      },
      /* ============ 4) وصلنا أبها ============ */
      {
        id: 'm4', title: 'وصلنا أبها', intro: 'الهبوط، ختم الجواز، وشنطتنا على السير!', values: ['sd_rules', 'patience', 'teamwork'], sticker: null,
        wisdom: 'بنستنى شنطتنا بهدوء.. ونعرفها من لونها ورسمتها', diary: { pic: 'saudi_stampmark', text: 'هبطنا في أبها واتختم الجواز وطلّعنا شنطنا من السير' },
        async run(ctx) {
          note(['الختم يتحط على الجواز', 'مش دي! بصّ على اللون والرسمة', 'الشنطة التقيلة محتاجة {m} القوي', 'الشنطة دي محتاجة حد صغير. جرّبوا {a} أو {n}', 'شنطة {t} القايدة!', 'محتاجين {n} اللي بتلاقي الحاجات']);
          const st = ctx.stage, nm = ctx.names;
          await ctx.scene('saudiSky', { state: { prog: .92, dusk: true }, heroes: 'hidden' });
          M.tw(st.state, { prog: 1 }, 6, 'inOut');
          await ctx.say('aboody', 'بُص يا {m}! جبال وبيوت من حجر وسحاب تحتنا!', { anim: 'cheer' });
          await ctx.say('narrator', 'هبطنا بالسلامة في مطار أبها. الجو برّه لطيف وفيه ضباب خفيف.', { name: CAP });
          await ctx.say('mama', 'الحمد لله على السلامة. أبها في منطقة عسير، في جبال عالية وجوّها حلو.');
          await ctx.scene('saudiAirport', { state: { kind: 'passport', abha: true }, heroes: { toota: { x: 160, y: 484, dir: 1 }, nemo: { x: 240, y: 492, dir: 1 }, moody: { x: 330, y: 480, dir: 1 }, aboody: { x: 410, y: 492, dir: 1 } } });
          await ctx.say('saudi_officer', 'السلام عليكم! أهلًا وسهلًا في أبها. هنختم جوازاتكم.', { name: OFF });
          const hello = await choiceQ(ctx, {
            prompt: 'نرد على الضابط إزاي؟', options: sh([
              { text: 'وعليكم السلام ورحمة الله. شكرًا!', art: 'smile', good: true, reply: [['saudi_officer', 'الله يسلمك! أهلًا بيكم في بلدكم التاني.', { name: OFF }]] },
              { text: 'نبص بعيد ومنردش', art: 'sad', good: false, consequence: [['toota', 'لما حد يسلّم علينا، بنرد السلام ونبتسم.']] }])
          });
          if (hello.firstTry) ctx.reward.star(1); ctx.value('sd_polite');
          const done = {};
          const names = ['moody', 'aboody', 'toota', 'nemo'], cols = ['red', 'navy', 'pink', 'purple'];
          const stp = await cnt(ctx, () => ctx.games.dragdrop({
            prompt: 'اختم جواز كل واحد: اسحب الختم على الجواز', heroes: 'corner', wrongHint: 'الختم يتحط على الجواز',
            onPlace: (it, t) => { done[t.id] = true; ctx.fx.burst(t.x, t.y - 20, { kind: 'star', n: 8 }); },
            items: names.map((k, i) => ({ id: 's' + i, art: 'saudi_stamp', to: 'p' + i, x: 130 + i * 90, y: 215, s: 74 })),
            targets: names.map((k, i) => ({ id: 'p' + i, x: 592 + i * 68, y: 384, w: 62, h: 80, label: nm[k], itemScale: .45, cols: 1, dy0: -6, draw: (g, tt) => { A.draw(g, 'saudi_passport:' + cols[i], 0, 0, 62); if (done[tt.id]) A.draw(g, 'saudi_stampmark:blue', 6, 6, 44); } }))
          }));
          if (stp.miss <= 1) ctx.reward.star(1);
          await ctx.say('saudi_officer', 'اتختمت! أهلًا بيكم في السعودية. زيارة سعيدة!', { name: OFF });
          ctx.sticker.give('saudi_s_passport'); ctx.fx.burst(480, 300, { kind: 'star', n: 12 });
          await ctx.say('moody', 'دلوقتي نجيب شنطنا! بس نستنى بصبر على السير.');
          await ctx.scene('saudiAirport', { state: { kind: 'belt', abha: true }, heroes: 'bottom' });
          await ctx.say('toota', 'كل شنطة ليها لون ورسمة. شوفوا الصور فوق واستنوا شنطتكم تعدّي.', { anim: 'wave' });
          const bag = [['red', 'stripe', 'strong'], ['blue', 'star', 'small'], ['purple', 'dots', 'leader'], ['pink', 'zig', 'finder']];
          const decoy = [['red', 'dots'], ['blue', 'stripe'], ['purple', 'plain'], ['pink', 'star']];
          const loop = 1100, base = 60, sp = 52; const pos = i => t => ((base + i * 137 - t * 0 + sp * t) % loop + loop) % loop - 70;
          const dl = st.addLayer({ z: 9, draw: (g, t) => { decoy.forEach((d, i) => { const x = pos(i * 2 + 1)(t); if (x > 20 && x < 940) A.draw(g, 'saudi_suitcase:' + d[0] + ':' + d[1], x, 282, 82); }); } });
          const spots = bag.map((b, i) => ({
            id: 'bg' + i, art: 'saudi_suitcase:' + b[0] + ':' + b[1], x: pos(i * 2)(0), y: 282, s: 82, hit: 48, needs: b[2], walkOff: 0, listArt: 'saudi_suitcase:' + b[0] + ':' + b[1], needsMsg: ({ strong: 'الشنطة التقيلة محتاجة {m} القوي', small: 'الشنطة دي محتاجة حد صغير. جرّبوا {a} أو {n}', leader: 'شنطة {t} القايدة!', finder: 'محتاجين {n} اللي بتلاقي الحاجات' })[b[2]],
            draw: (g, t, s0, s) => { if (!s.found) { s.x = pos(i * 2)(t); s.disabled = s.x < 40 || s.x > 920; } A.draw(g, 'saudi_suitcase:' + b[0] + ':' + b[1], 0, 0, 82); }
          }));
          const bp = ctx.games.hidden({ prompt: 'دوّروا على شنطنا الأربعة على السير', hintAfter: 24, noWalk: true, spots });
          const inp = st.input; st.input = { down(x, y, id, e) { const r = inp.down(x, y, id, e); decoy.forEach((d, i) => { const dx = pos(i * 2 + 1)(st.t); if (Math.hypot(x - dx, y - 282) < 40) { st.bubble(st.active, 'مش دي! بصّ على اللون والرسمة', 2); ctx.mistake(); } }); return r; } };
          const bres = await bp; dl();
          if (bres.wrong <= 3) ctx.reward.star(1);
          await ctx.say('nemo', 'كل شنطنا معانا! شاطرين أوي.', { anim: 'cheer' });
          await pairQ(ctx, 'saudi_m4');
          await ctx.say('toota', 'يلا نخرج! أكيد بابا مستنّينا برّه.');
          return ctx.nav.complete();
        }
      },
      /* ============ 5) بابا والطريق في الجبال ============ */
      {
        id: 'm5', title: 'بابا والجبال', intro: 'أخيرًا بابا! وبعدين رحلة بالعربية وسط الضباب والجبال.', values: ['sd_family', 'sd_tripsafety', 'thanks'], sticker: 'saudi_s_hug', heroes: WITHKAMAL, control: ALL,
        wisdom: 'حضن بابا أحلى استقبال.. والضباب بنعدّي فيه بالأنوار وبالراحة', diary: { pic: 'saudi_heartpin', text: 'شفنا بابا في أبها وحضناه وسِرنا وسط الجبال والضباب' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('saudiAirport', { state: { kind: 'arrivals', abha: true, doors: 0 }, heroes: { toota: { x: 150, y: 484, dir: 1 }, nemo: { x: 230, y: 492, dir: 1 }, moody: { x: 320, y: 480, dir: 1 }, aboody: { x: 400, y: 492, dir: 1 }, baba: { x: 790, y: 482, dir: -1, visible: false }, kamal: { x: 880, y: 490, dir: -1, visible: false } } });
          await ctx.say('narrator', 'الأبواب الزجاج اتفتحت.. وفي ناس كتير مستنّية القادمين.');
          st.state.doors = 1; ctx.sfx('click');
          await ctx.say('aboody', 'فين بابا؟ أنا مش شايفه!', { anim: 'think' });
          await ctx.say('nemo', 'استنى.. بُص هناك! حد بيلوّح بإيده!');
          st.hero('baba').visible = true; st.hero('kamal').visible = true; st.play('baba', 'wave', 2); st.play('kamal', 'wave', 2);
          await ctx.say('moody', 'بابا!!! ده بابا! ومعاه عمو كمال!', { anim: 'cheer' });
          await ctx.say('toota', 'يلا نجري عليه!');
          await Promise.all([ctx.walk('aboody', 700, 492), ctx.walk('moody', 640, 480), ctx.walk('nemo', 580, 492), ctx.walk('toota', 520, 484)]);
          await ctx.say('baba', 'وحشتوني أوي يا أحلى أولاد في الدنيا! الحمد لله على سلامتكم.');
          await ctx.say('kamal', 'وأنا كمان! أنا استنيت معاه من بدري، وهو كان بيبص على الباب كل دقيقة!', { anim: 'wave' });
          await ctx.say('baba', 'بطّل فضايح يا كمال!');
          ctx.prompt('اضغط عشان نحضن بابا'); await ctx.games.ritual({ bottom: 290, text: 'حضن بابا', sub: 'اضغط عشان نحضنه كلنا', who: 'aboody' });
          ctx.fx.burst(660, 340, { kind: 'heart', n: 22 }); ctx.fx.flash('#ffd6e0', .5); ctx.value('sd_family'); ctx.reward.star(1);
          st.playBoth('cheer', 1.6);
          await ctx.say('aboody', 'وحشتني أوي يا بابا! أنا كبرت وبقيت أعرف أعدّ لحد عشرين!');
          await ctx.say('baba', 'ما شاء الله عليك! وحشني ضحكتكم أكتر من أي حاجة.');
          await ctx.say('nemo', 'ماما بتسلّم عليك وبتقول لك وحشتنا الأكل بتاعك!');
          await ctx.say('kamal', 'أنا شايل الشنط! بس شنطتكم تقيلة.. جايبين معاكم مصر كلها؟');
          await ctx.say('baba', 'يلا بينا على العربية. الطريق لبيتنا في الجبال حلو أوي. اربطوا الأحزمة!');
          /* ---- the drive ---- */
          await ctx.scene('saudiRoad', { state: { fog: .2, speed: 40 }, heroes: 'hidden' });
          await ctx.say('kamal', 'أنا قاعد جنبكم ورا، وبابا هو اللي بيسوق. أنا أسوق أسرع منه بس هو مش مصدّق!');
          await ctx.say('baba', 'أبها فوق الجبال. بصّوا حواليكم: بيوت حجر ومنارات بيضا ومدرجات خضرا.');
          const items = [['saudi_tower', 250, 'بيت الحجر', 'تاور'], ['saudi_minaret', 258, 'المنارة', ''], ['saudi_terrace', 232, 'المدرجات', ''], ['saudi_juniper', 262, 'شجرة', '']];
          const spots = items.map((it, i) => ({
            id: 'l' + i, art: it[0], x: 1000 + i * 300, y: it[1], s: 88, hit: 54, listArt: it[0],
            draw: (g, t, s0, s) => { if (!s.found) { s.x = ((1000 + i * 300 - t * 52) % 1200 + 1200) % 1200 - 120; s.alpha = Math.max(.01, Math.min(1, (s.x - 20) / 50, (940 - s.x) / 50)); s.disabled = s.alpha < .5; } sign(it[0], 88)(g, t, s0, s); }
          }));
          const lm = await ctx.games.hidden({ prompt: 'دوّروا: بيت الحجر والمنارة والمدرجات والشجرة', hintAfter: 18, noWalk: true, spots });
          if (lm.wrong <= 3) ctx.reward.star(1);
          await ctx.say('toota', 'بيوت الحجر بشبابيكها البيضا حلوة أوي! شبه حواديت.');
          await ctx.say('baba', 'ده الطراز العسيري. بنبني بالحجر وبنطلي الشبابيك بالأبيض.');
          M.tw(st.state, { fog: .88 }, 3.5, 'inOut');
          await ctx.say('narrator', 'وفجأة.. الضباب زاد أوي على الطريق!');
          const fg = await choiceQ(ctx, {
            prompt: 'الضباب كتير. بابا يعمل إيه؟', options: sh([
              { text: 'يشغّل أنوار الضباب', art: 'saudi_lights', good: true, reply: [['baba', 'تمام! الأنوار بتخلّي العربيات تشوفنا.']] },
              { text: 'يخفف السرعة ويمشي بالراحة', art: 'saudi_slow', good: true, reply: [['baba', 'بالظبط! في الضباب بنمشي بالراحة.']] },
              { text: 'يزوّد السرعة عشان نوصل بدري', art: 'x', good: false, consequence: [['baba', 'لأ يا حبيبي! السرعة في الضباب خطر. الأمان أهم من الوصول بدري.']] }])
          });
          st.state.lights = true; M.tw(st.state, { speed: 16 }, 2, 'inOut'); if (fg.firstTry) ctx.reward.star(1); ctx.value('sd_tripsafety'); ctx.value('roadsafety');
          await ctx.say('moody', 'يعني في الضباب بنفتح الأنوار ونمشي بهدوء. فهمت!');
          await pairQ(ctx, 'saudi_m5');
          M.tw(st.state, { fog: .35, speed: 30 }, 4, 'inOut');
          await ctx.say('kamal', 'شفتوا؟ بابا ماشي بالراحة في الضباب. ده السواق الشاطر!');
          await ctx.say('baba', 'شفتوا؟ الضباب بيعدّي. وصلنا قريب من البيت.');
          await ctx.say('aboody', 'أنا مبسوط أوي إننا مع بعض.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 6) جولة في أبها ============ */
      {
        id: 'm6', title: 'جولة في أبها', intro: 'تلفريك وجبال السودة وجو بارد.. نلبس إيه؟', values: ['sd_tripsafety', 'curiosity', 'teamwork'], sticker: 'saudi_s_cable', heroes: WITHKAMAL, control: ALL,
        wisdom: 'اللبس المناسب للجو بيخلّينا نستمتع بالرحلة', diary: { pic: 'saudi_cablecar', text: 'ركبنا التلفريك وطلعنا جبال السودة والجو كان برد وضباب' },
        async run(ctx) {
          note(['الجو برد وضباب. ده مش مناسب', 'ده للصيف والحر. هنا برد']);
          const st = ctx.stage;
          await ctx.scene('saudiDinner', { state: { night: false }, heroes: { toota: { x: 200, y: 484, dir: 1 }, nemo: { x: 290, y: 492, dir: 1 }, moody: { x: 380, y: 480, dir: 1 }, aboody: { x: 470, y: 492, dir: 1 }, baba: { x: 770, y: 482, dir: -1 }, kamal: { x: 880, y: 490, dir: -1 } } });
          await ctx.say('baba', 'صباح الخير يا أبطال! النهاردة هنزور التلفريك وجبال السودة.');
          await ctx.say('kamal', 'وأنا جاي معاكم! أنا بحب التلفريك، بس بخاف من الارتفاع شوية.. ماتقولوش لحد!', { anim: 'wave' });
          await ctx.say('nemo', 'الجو برّه برد وفيه ضباب! نلبس إيه؟', { anim: 'think' });
          const cl = await cnt(ctx, () => ctx.games.dragdrop({
            prompt: 'اختاروا اللبس المناسب للجو البارد', heroes: 'corner', panel: { x: 90, y: 112, w: 780, h: 200 }, wrongHint: 'الجو برد وضباب. ده مش مناسب',
            items: sh([['saudi_coat', 'wear'], ['saudi_sweater', 'wear'], ['saudi_scarf', 'wear'], ['sock', 'wear'], ['saudi_swim', 'leave'], ['saudi_shorts', 'leave'], ['saudi_sandals', 'leave'], ['saudi_sunhat', 'leave']]).map((it, i) => ({ id: 'c' + i, art: it[0], to: it[1], x: 190 + (i % 4) * 160, y: 180 + Math.floor(i / 4) * 78, s: 66, hint: it[1] === 'leave' ? 'ده للصيف والحر. هنا برد' : null })),
            targets: [{ id: 'wear', x: 640, y: 420, w: 220, h: 100, art: 'hanger', s: 90, label: 'هنلبس', cols: 4, dx: 28, itemScale: .45, dy0: 10 }, { id: 'leave', x: 280, y: 420, w: 150, h: 100, art: 'box', s: 100, label: 'نسيبه', cols: 3, dx: 24, itemScale: .4 }]
          }));
          if (cl.miss <= 2) ctx.reward.star(1);
          ctx.heroes({ toota: { x: 200, y: 484, dir: 1 }, nemo: { x: 290, y: 492, dir: 1 }, moody: { x: 380, y: 480, dir: 1 }, aboody: { x: 470, y: 492, dir: 1 }, baba: { x: 770, y: 482, dir: -1 }, kamal: { x: 880, y: 490, dir: -1 } });
          await ctx.say('baba', 'تمام! بالجاكت والكوفية مش هتبردوا. يلا على التلفريك!');
          await ctx.scene('saudiCable', { state: { prog: 0, fog: .25 }, heroes: 'hidden' });
          await ctx.say('baba', 'ده التلفريك. عربية معلّقة في كابل بتطلعنا فوق الوادي والجبال. اركبوا بهدوء.');
          await ctx.say('kamal', 'أنا هقعد في النص وأمسك في الحديد.. بس بصراحة المنظر يستاهل!');
          ctx.prompt('اضغط عشان نركب التلفريك'); await ctx.games.ritual({ bottom: 290, text: 'يلا نركب', sub: 'اضغط عشان العربية تتحرك' });
          const ride = M.tw(st.state, { prog: 1 }, 22, 'inOut');
          await ctx.say('aboody', 'العربية بتتحرك! أنا شايف الشجر تحتنا صغير أوي!', { anim: 'cheer' });
          const sg = await ctx.games.hidden({
            prompt: 'من التلفريك: دوّروا على النسر والماعز والسحابة والعلم', hintAfter: 18, noWalk: true, spots: [
              { id: 'egl', art: 'saudi_eagle', x: 560, y: 118, s: 84, hit: 56, listArt: 'saudi_eagle', draw: sign('saudi_eagle', 84) },
              { id: 'gt', art: 'saudi_goat', x: 160, y: 300, s: 84, hit: 56, listArt: 'saudi_goat', draw: sign('saudi_goat', 84) },
              { id: 'ms', art: 'saudi_mist', x: 340, y: 232, s: 84, hit: 56, listArt: 'saudi_mist', draw: sign('saudi_mist', 84) },
              { id: 'fl', art: 'saudi_flagpost', x: 760, y: 392, s: 84, hit: 56, listArt: 'saudi_flagpost', draw: sign('saudi_flagpost', 84) }]
          });
          if (sg.wrong <= 3) ctx.reward.star(1);
          await ride;
          await ctx.say('moody', 'بصّ يا بابا! البيوت الحجر صغيرة من فوق!');
          await ctx.say('baba', 'ده الطراز العسيري يا {m}. والجبال هنا من أعلى جبال المملكة.');
          await ctx.scene('saudiPeak', { state: { cold: true }, heroes: { toota: { x: 130, y: 484, dir: 1 }, nemo: { x: 220, y: 492, dir: 1 }, moody: { x: 310, y: 480, dir: 1 }, aboody: { x: 400, y: 492, dir: 1 }, baba: { x: 520, y: 482, dir: -1 }, kamal: { x: 610, y: 490, dir: -1 } } });
          await ctx.say('baba', 'وصلنا السودة! من أعلى القمم في المملكة. بصّوا السحاب تحتنا!');
          await ctx.say('nemo', 'ده برد! الحمد لله لبسنا الجاكتات.', { anim: 'cheer' });
          await ctx.say('kamal', 'برررد! أنا لابس تلات طبقات وسايب الجاكت في العربية.. معلش!');
          const wc = await choiceQ(ctx, {
            prompt: 'الجو هنا إزاي؟', options: sh([
              { text: 'برد وضباب وسحاب', art: 'saudi_mist', good: true, reply: [['toota', 'بالظبط! فوق الجبال الجو بيبقى أبرد.']] },
              { text: 'حر شديد زي الصيف', art: 'sunart', good: false, consequence: [['baba', 'لأ يا حبيبي، هنا الجو أبرد بكتير من القاهرة. بص على السحاب والضباب.']] }])
          });
          if (wc.firstTry) ctx.reward.star(1);
          await pairQ(ctx, 'saudi_m6');
          await ctx.say('baba', 'مين يفتكر إيه اللي شفناه النهاردة؟');
          await pairQ(ctx, 'saudi_m6');
          await ctx.say('aboody', 'أنا أحلى حاجة عندي إننا مع بابا.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 7) سهرة مع بابا ============ */
      {
        id: 'm7', title: 'سهرة مع بابا', intro: 'عشاء وهدايا وشكر.. وتصبحوا على خير.', values: ['thanks', 'sd_family', 'respect'], sticker: 'saudi_traveler', heroes: WITHKAMAL, control: ALL,
        wisdom: 'نشكر اللي بيحبونا.. والسفر الحلو بيخلّي القلب كبير', diary: { pic: 'saudi_traveler', text: 'تعشينا مع بابا وتبادلنا الهدايا وخدنا ختم مسافر ماهر' },
        async run(ctx) {
          note(['الهدية دي لحد تاني.. افتكروا كلام بابا', 'افتكر كلام بابا عن كل هدية', 'الهدية دي لبابا', 'الختم يتحط على الصفحة']);
          const st = ctx.stage, nm = ctx.names;
          const POS = { toota: { x: 150, y: 484, dir: 1 }, nemo: { x: 235, y: 492, dir: 1 }, moody: { x: 320, y: 480, dir: 1 }, aboody: { x: 405, y: 492, dir: 1 }, baba: { x: 790, y: 482, dir: -1 }, kamal: { x: 880, y: 490, dir: -1 } };
          await ctx.scene('saudiDinner', { state: { night: true }, heroes: POS });
          await ctx.say('baba', 'السفرة جاهزة! كبسة وتمر وعصير. يلا يا حبايبي.');
          await ctx.say('toota', 'الله! الريحة جميلة أوي.', { anim: 'cheer' });
          await ctx.say('mama', 'قبل ما ناكل بنقول إيه؟');
          ctx.prompt('اضغط وقولوا بسم الله'); await ctx.games.ritual({ bottom: 290, text: 'بسم الله', sub: 'قبل الأكل' });
          await ctx.say('aboody', 'مممم! الأكل لذيذ يا بابا!');
          await ctx.say('kamal', 'يا بختكم! أنا طبخت الكبسة بنفسي النهاردة.. ماتسألوش بابا عن الملح!');
          await ctx.say('baba', 'الحمد لله. حكوا لي عن رحلتكم. كان أحلى حاجة فيها إيه؟');
          await ctx.say('nemo', 'السحاب على شكل قلب في الطيارة!');
          await ctx.say('moody', 'وأنا التلفريك والجبال العالية.');
          await ctx.say('baba', 'وعندي لكم مفاجأة. هدايا من أبها، وكل هدية ليها صاحب بيحبها!');
          await ctx.say('baba', 'عربية التلفريك للي بيحب الحاجات اللي بتتحرك. والدبدوب للصغير الشاطر. والكوفية الحمرا للكبيرة المرتبة. والكراسة للي بيحب الرسم.');
          const ft = await cnt(ctx, () => ctx.games.dragdrop({
            prompt: 'وزّعوا هدايا بابا على أصحابها', heroes: 'corner', panel: { x: 110, y: 112, w: 740, h: 150 }, wrongHint: 'الهدية دي لحد تاني.. افتكروا كلام بابا',
            items: sh([['saudi_toycable', 'moody'], ['teddy', 'aboody'], ['saudi_scarf', 'toota'], ['saudi_sketch', 'nemo']]).map((it, i) => ({ id: 'g' + i, art: it[0], to: it[1], x: 210 + i * 180, y: 190, s: 76, hint: 'افتكر كلام بابا عن كل هدية' })),
            targets: ['toota', 'nemo', 'moody', 'aboody'].map((k, i) => ({ id: k, x: 200 + i * 160, y: 335, w: 140, h: 110, art: 'face:' + k, s: 100, label: nm[k], itemScale: .55, cols: 1, dy0: 34 }))
          }));
          if (ft.miss <= 2) ctx.reward.star(1);
          ctx.heroes(POS);
          const th = await choiceQ(ctx, {
            prompt: 'بابا ادّانا هدايا حلوة. نقول إيه؟', options: sh([
              { text: 'شكرًا يا بابا، ربنا يخلّيك لينا', art: 'heartbig', good: true, reply: [['baba', 'العفو يا حبيبي. فرحتكم هي أحلى هدية ليا.']] },
              { text: 'عايزين أكتر', art: 'x', good: false, consequence: [['mama', 'الهدية بتتاخد بشكر وبحب. نقول شكرًا وبس.']] },
              { text: 'مش عاجبني', art: 'sad', good: false, consequence: [['toota', 'بابا اختار الهدايا بحب. نشكره ونفرح بيها.']] }])
          });
          if (th.firstTry) ctx.reward.star(1);
          ctx.prompt('اضغط وقولوا شكرًا يا بابا'); await ctx.games.ritual({ bottom: 290, text: 'شكرًا يا بابا', sub: 'ربنا يخلّيك لينا', who: 'moody' });
          ctx.value('thanks'); ctx.fx.burst(480, 300, { kind: 'heart', n: 16 });
          await ctx.say('nemo', 'وإحنا كمان جايبين لك هدايا من مصر! بسبوسة من ماما وهدية مننا!');
          const gv = await ctx.games.dragdrop({
            prompt: 'هاتوا هدايا بابا من مصر', heroes: 'corner', panel: { x: 200, y: 112, w: 400, h: 150 }, wrongHint: 'الهدية دي لبابا',
            items: [['saudi_basbousa', 'baba'], ['saudi_gift:purple:yellow', 'baba']].map((it, i) => ({ id: 'v' + i, art: it[0], to: it[1], x: 300 + i * 160, y: 190, s: 74 })),
            targets: [{ id: 'baba', x: 700, y: 335, w: 180, h: 120, art: 'face:baba', s: 100, label: 'بابا', itemScale: .5, cols: 3, dx: 30, dy0: 40 }]
          });
          await ctx.say('baba', 'الله! أحلى هدايا في الدنيا. وحشتوني أوي وفرحتوني كتير.');
          await ctx.say('kamal', 'وأنا كمان عايز أبعت هدية لابني لوكا في مصر! هو بيحب العربيات الصغيرة.');
          const lk = await ctx.games.dragdrop({
            prompt: 'حطّوا هدايا لوكا في الشنطة: العربية والمكعبات', heroes: 'corner', panel: { x: 200, y: 112, w: 400, h: 150 }, wrongHint: 'حطّها عند لوكا',
            items: [['car', 'luka'], ['blocks', 'luka']].map((it, i) => ({ id: 'lk' + i, art: it[0], to: it[1], x: 300 + i * 160, y: 190, s: 74 })),
            targets: [{ id: 'luka', x: 700, y: 335, w: 180, h: 120, art: 'face:luka', s: 100, label: 'لوكا', itemScale: .5, cols: 3, dx: 30, dy0: 40 }]
          });
          ctx.heroes(POS); ctx.fx.burst(700, 300, { kind: 'heart', n: 14 });
          await ctx.say('kamal', 'لوكا هيفرح بالعربية دي! هبعتها مع أول حد مسافر لمصر.');
          await ctx.say('aboody', 'وسلّم لي على لوكا! قول له عبودي بيسلّم عليك.');
          st.state.dim = .12; await pairQ(ctx, 'saudi_m7');
          await ctx.scene('saudiDinner', { state: { night: true, dim: .3 }, heroes: POS });
          await ctx.say('baba', 'الوقت اتأخر. بكرة يوم جديد بإذن الله. تصبحوا على خير يا أحلى أولاد.');
          await ctx.say('aboody', 'وإنت من أهل الخير يا بابا. أنا مبسوط إننا سافرنا.', { anim: 'sleep' });
          await ctx.say('mama', 'الحمد لله على سفر سعيد. دلوقتي لازم تاخدوا ختم مسافر ماهر!');
          const sdone = {};
          await ctx.games.dragdrop({
            prompt: 'اختم جواز مسافر ماهر', heroes: 'corner', wrongHint: 'الختم يتحط على الصفحة',
            onPlace: (it, t) => { sdone.v = true; ctx.fx.confetti(); ctx.fx.burst(t.x, t.y, { kind: 'star', n: 18 }); },
            items: [{ id: 'bigstamp', art: 'saudi_stamp', to: 'page', x: 200, y: 280, s: 120 }],
            targets: [{ id: 'page', x: 600, y: 330, w: 340, h: 170, itemScale: .5, cols: 1, dy0: -20, draw: g => { G.fillRR(g, -170, -85, 340, 170, 14, '#fff7e3', 5); G.line(g, 0, -85, 0, 85, 3, '#d9cfb8'); A.draw(g, 'saudi_passport:red', -90, -4, 90); G.text(g, 'جواز المسافر الماهر', 82, -56, { size: 17, color: '#2b3a67' }); [-24, 0, 24].forEach(y => G.line(g, 20, y + 6, 150, y + 6, 3, '#d9cfb8')); if (sdone.v) { g.save(); g.rotate(-.18); G.circ(g, 84, 16, 54, null, 5, '#d8453a'); G.circ(g, 84, 16, 44, null, 2.5, '#d8453a'); G.text(g, 'مسافر ماهر', 84, 14, { size: 22, color: '#d8453a' }); G.star(g, 84, 38, 9, '#d8453a', 0); g.restore(); } } }]
          });
          ctx.sticker.give('saudi_traveler'); ctx.reward.star(1);
          await ctx.say('baba', 'ما شاء الله عليكم! مسافرين مهرة: صبروا وسمعوا الكلام وساعدوا بعض.');
          await ctx.say('toota', 'الحمد لله على كل حاجة. تصبح على خير يا بابا.');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
