/* Moody & Aboody - worlds/nana.js : WORLD 7 "بيت ننا زوزا" (6 missions).
   The family lives on the 6th floor; Nana Zoza lives on the 3rd floor of the SAME building.
   Needs (loaded before): content/q_nana.js, worlds/nana_kits.js, worlds/nana_art.js.  Tokens {m} {a} {me} {t} {n} = names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const B = id => M.banks[id];
  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  /* faint object + sparkle (it is "hidden" until found) */
  const faint = (art, s) => (g, t) => { g.save(); g.globalAlpha = .75; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const ALL4 = ['moody', 'aboody', 'toota', 'nemo'], ALL5 = ALL4.concat(['nana']);
  const mis = ctx => ctx.mistakes;

  M.registerValue('liftsafety', { label: 'الأمان في الأسانسير', desc: 'نمسك إيد الكبير ومنلعبش في الأسانسير' });
  M.registerValue('manners', { label: 'أدب الزيارة والسلام', desc: 'نخبّط بهدوء ونسلّم ونبوس إيد الكبير' });
  M.registerValue('elders', { label: 'احترام الكبار', desc: 'نسمع كلام ننا ونقدّر خبرتها' });
  M.registerValue('handwash', { label: 'غسل الإيدين قبل الأكل', desc: 'النضافة قبل المطبخ' });
  M.registerValue('eldercare', { label: 'رعاية الكبار', desc: 'نفكّر ننا بميعاد الدوا ونساعدها' });
  M.registerValue('plantcare', { label: 'رعاية النباتات', desc: 'نسقي الزرع ونحافظ عليه' });
  M.registerValue('family', { label: 'حب العيلة', desc: 'وقت حلو مع ننا وكلمة حلوة لبابا' });

  M.registerWorld({
    id: 'nana', order: 7, title: 'بيت ننا زوزا', icon: 'w_nana', theme: { c1: '#e6d6ff', c2: '#b79be6' }, finalSticker: 'nana_home',
    stickers: [
      { id: 'nana_lift', title: 'أمان الأسانسير', art: 'nn_lift', bg: '#e3e8f5' }, { id: 'nana_salam', title: 'سلام وأدب', art: 'nn_door', bg: '#e6f6e8' },
      { id: 'nana_kaak', title: 'كحك ننا', art: 'nn_kaak', bg: '#fff0c4', rot: .08 }, { id: 'nana_album', title: 'ألبوم العيلة', art: 'nn_album', bg: '#ffe4e0', rot: -.06 },
      { id: 'nana_plant', title: 'حارس الزرع', art: 'nn_pot', bg: '#d9f6d0' }, { id: 'nana_gift', title: 'هدية من القلب', art: 'nn_gift', bg: '#ffe0ea', rot: .1 },
      { id: 'nana_home', title: 'أبطال بيت ننا', art: 'w_nana', bg: '#ece0ff', rot: -.05 }
    ],
    missions: [
      /* ============ 1) ننزل لننا ============ */
      {
        id: 'm1', title: 'ننزل لننا زوزا', intro: 'من الدور السادس للدور التالت.. بالأمان!', values: ['liftsafety', 'teamwork', 'kindness'], sticker: 'nana_lift',
        heroes: ALL4, control: ALL4, wisdom: 'الأسانسير مش لعبة.. بنمسك إيد بعض وبنقف هادين', diary: { pic: 'nn_lift', text: 'نزلنا بالأسانسير من الدور السادس للتالت وحاولنا نكون هادين وأمان' },
        async run(ctx) {
          const st = ctx.stage; let m0;
          await ctx.scene('nn_hall6', { state: { liftFloor: 6, doorsOpen: 0 } });
          await ctx.say('mama', 'يلا يا حبايبي! ننا زوزا مستنياكم في الدور التالت. خدوا الهدية بتاعتها.');
          await ctx.say('toota', 'أنا هاخد بالي من الصغيرين. بس الأول لازم نلاقي الهدية وننده الأسانسير.');
          await ctx.say('nemo', 'وأنا هدوّر معاكم! أنا شاطرة في اللقاطة.');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على هدية ننا، وادوسوا على زرار الأسانسير', hintAfter: 14, spots: [
              { id: 'gift', art: 'nn_gift', x: 748, y: 412, s: 58, needs: 'small', walkOff: 0, listArt: 'nn_gift', draw: faint('nn_gift', 58), needsMsg: 'الهدية تحت الدكّة! محتاجين حد صغير' },
              { id: 'call', art: 'nn_buttons', x: 614, y: 266, s: 56, hit: 46, needs: 'tall', keep: true, walkOff: 0, listArt: 'nn_buttons', draw: pulse(34), needsMsg: 'الزرار عالي! محتاجين {m} الطويل', onFound: () => { st.state.callLit = true; ctx.sfx('click'); } }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          ctx.sfx('bell'); await M.tw(st.state, { doorsOpen: 1 }, .9, 'inOut');
          await ctx.say('aboody', 'الأسانسير وصل! يلا نجري نركب!');
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'الأسانسير فتح. نعمل إيه جوّه؟', options: [
              { text: 'نضغط على كل الزراير', art: 'nn_buttons', good: false, consequence: [['toota', 'لأ! لو ضغطنا كل الزراير الأسانسير هيقف في كل دور ونتأخر على ننا.'], ['aboody', 'معاكي حق.. ده مش لعب.']] },
              { text: 'نمسك إيد الكبير ونقف هادين', art: 'nn_hands', good: true, reply: [['toota', 'برافو! كده أمان. أنا هاسك إيد عبودي.'], ['moody', 'وأنا هقف جنب الزراير.']] },
              { text: 'نجري ونلعب جوّه', art: 'ball', good: false, consequence: [['moody', 'الأسانسير ضيّق وبيتحرك. ممكن نقع ونتأذّي.'], ['nemo', 'خلّينا نقف هادين.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('liftsafety');
          await ctx.scene('nn_lift', { state: { floor: 6, doors: 0 }, heroes: { moody: { x: 300, y: 484, dir: 1 }, aboody: { x: 420, y: 494, dir: -1 }, toota: { x: 200, y: 488, dir: 1 }, nemo: { x: 530, y: 492, dir: -1 } } });
          await ctx.say('toota', 'احنا في الدور السادس. وننا في الدور التالت. نضغط على الرقم الصح!');
          const lf = await ctx.games.nnLift({ prompt: 'ادوس على زرار الدور التالت', target: 3, from: 6 });
          await ctx.say('moody', 'نزلنا خمسة.. أربعة.. تلاتة! وصلنا لننا!');
          await ctx.say('narrator', 'سؤال صغير قبل ما الباب يفتح!');
          const q = await ctx.quiz.pair({ aboody: B('nn6_floor'), moody: B('nn9_between') });
          if (lf.tries <= 1 && q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('nana', 'سمعت صوت الأسانسير! حبايبي وصلوا؟ تعالوا يا قلبي!');
          return ctx.nav.complete();
        }
      },
      /* ============ 2) نخبّط ونسلّم ============ */
      {
        id: 'm2', title: 'نخبّط ونسلّم', intro: 'باب ننا زوزا.. الأدب أولًا!', values: ['manners', 'elders', 'kindness'], sticker: 'nana_salam',
        heroes: ALL4, control: ALL4, wisdom: 'السلام قبل الكلام، وبوسة الإيد بتفرّح الكبير', diary: { pic: 'nn_door', text: 'خبّطنا بهدوء وسلّمنا على ننا وبوسنا إيدها' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          const place = o => Object.assign({ moody: { x: 650, y: 482, dir: -1 }, aboody: { x: 750, y: 494, dir: -1 }, toota: { x: 570, y: 486, dir: -1 }, nemo: { x: 850, y: 490, dir: -1 }, nana: { x: 450, y: 440, dir: 1, visible: false } }, o || {});
          await ctx.scene('nn_door3', { state: { open: 0, bell: false }, heroes: place() });
          await ctx.say('toota', 'ده باب ننا زوزا. قبل ما ندخل، لازم نعرف الأدب.');
          await ctx.say('aboody', 'أنا عارف! نخبّط جامد ونجري جوه!');
          await ctx.say('toota', 'لأ يا عبودي، هنرتّب الخطوات صح.');
          const sq = await ctx.games.sequence({ prompt: 'رتّبوا خطوات زيارة ننا', steps: [{ art: 'nn_bell', label: 'نرنّ الجرس مرة واحدة' }, { art: 'nn_hourglass', label: 'نستنى بهدوء' }, { art: 'nn_salam', label: 'نقول السلام عليكم' }, { art: 'nn_shoe:red', label: 'ندخل ونقلع الجزمة' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes(place()); st.state.bell = true; ctx.sfx('bell'); await ctx.wait(.9); st.state.bell = false;
          await ctx.say('nana', 'مين بيرنّ بالأدب ده؟ لحظة يا حبايبي، جاية!');
          ctx.sfx('click'); await M.tw(st.state, { open: 1 }, .9, 'inOut'); ctx.cast(ALL5, ALL4); ctx.heroes(place({ nana: { x: 450, y: 446, dir: 1, visible: true } }));
          await ctx.say('narrator', 'ننا فتحت الباب. يلا نسلّم عليها!');
          await ctx.games.ritual({ text: 'السلام عليكم', sub: 'نسلّم على ننا', bottom: 120 });
          await ctx.say('nana', 'وعليكم السلام ورحمة الله وبركاته! حبايبي وصلوا!', { anim: 'wave' });
          const ch = await ctx.games.choice({
            prompt: 'ننا فرحانة بينا. نسلّم عليها إزاي؟', options: [
              { text: 'نجري جوه من غير سلام', art: 'ball', good: false, consequence: [['nana', 'ولا حتى سلام يا حبيبي؟ تعالى سلّم الأول.'], ['aboody', 'آسف يا ننا!']] },
              { text: 'نبوس إيدها ونحضنها', art: 'heartbig', good: true, reply: [['nana', 'ربنا يخليكم ليا! حضنكم أحلى حاجة.'], ['aboody', 'وحشتيني يا ننا!']] },
              { text: 'نبص في التابلت', art: 'tablet', good: false, consequence: [['nana', 'التابلت بعدين يا قلبي. دلوقتي نقعد سوا.'], ['nemo', 'عندها حق، نسلّم الأول.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('elders');
          await ctx.say('nana', 'يلا اقلعوا الجزم وحطّوها على الرف. الكبير فوق والصغير تحت.');
          m0 = mis(ctx);
          const sh = await ctx.games.dragdrop({
            prompt: 'حطّوا الجزم على الرف: الكبير فوق والصغير تحت', heroes: 'corner', wrongHint: 'الجزمة الكبيرة على الرف العالي والصغيرة تحت', items: [
              { id: 'sT', art: 'nn_shoe:pink', to: 'top', x: 400, y: 470, s: 70 }, { id: 'sM', art: 'nn_shoe:navy', to: 'top', x: 490, y: 474, s: 78 },
              { id: 'sN', art: 'nn_shoe:green', to: 'low', x: 580, y: 472, s: 60 }, { id: 'sA', art: 'nn_shoe:red', to: 'low', x: 660, y: 476, s: 52 }],
            targets: [{ id: 'top', x: 140, y: 304, w: 210, h: 56, itemScale: .7, cols: 3, dx: 58, draw: () => { } }, { id: 'low', x: 140, y: 388, w: 210, h: 66, itemScale: .6, cols: 3, dx: 58, draw: () => { } }]
          });
          ctx.heroes(place({ nana: { x: 450, y: 446, dir: 1, visible: true } }));
          await ctx.say('nana', 'ما شاء الله! بيت ننا بقى منوّر.');
          await ctx.say('narrator', 'سؤالين من ننا عن الأدب!');
          const q = await ctx.quiz.pair({ aboody: B('nn6_salam'), moody: B('nn9_hand') });
          if (mis(ctx) - m0 <= 2 && q.firstTry >= 1) ctx.reward.star(1);
          await ctx.say('nana', 'يلا ادخلوا يا حبايبي.. هنعمل كحك سوا!');
          return ctx.nav.complete();
        }
      },
      /* ============ 3) كحك ننا ============ */
      {
        id: 'm3', title: 'كحك ننا', intro: 'نساعد ننا في المطبخ.. نعدّ ونرتّب ونحضّر السفرة!', values: ['handwash', 'teamwork', 'bismillah', 'help'], sticker: 'nana_kaak',
        heroes: ALL5, control: ['moody', 'aboody', 'nemo'], wisdom: 'اللي يساعد في المطبخ يتعلّم ويفرّح اللي بيحبّهم', diary: { pic: 'nn_kaak', text: 'عملنا كحك مع ننا وحضّرنا السفرة لستة' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('nn_kitchen', { state: {}, heroes: { moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, toota: { x: 100, y: 486, dir: 1 }, nana: { x: 600, y: 484, dir: -1 } } });
          await ctx.say('nana', 'أهلًا يا حبايبي! النهاردة هنعمل كحك بالتمر. بس الأول، إيه اللي بنعمله قبل ما نلمس العجين؟');
          await ctx.say('aboody', 'نغسل إيدينا!');
          await ctx.say('nana', 'برافو عليك يا عبودي!');
          await ctx.games.scrub({
            prompt: 'اغسلوا إيديكم بالصابونة', dirt: 5, tool: 'soap', base(g, t) {
              [[300, 1], [660, -1]].forEach(h => { const x = h[0]; G.fillRR(g, x - 90, 200, 180, 190, 50, '#e4b58c', 5); [-66, -22, 22, 66].forEach((fx, i) => G.fillRR(g, x + fx - 17, 120 + (i === 1 || i === 2 ? -18 : 0), 34, 120, 17, '#e4b58c', 4.5)); G.fillRR(g, x + h[1] * 98 - 17, 250, 34, 100, 17, '#e4b58c', 4.5); });
              G.text(g, 'اسحب الصابونة على الأماكن الوسخة', 480, 470, { size: 26, color: '#fff', stroke: M.OL, sw: 6 });
            }
          });
          ctx.value('handwash'); ctx.heroes({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, toota: { x: 100, y: 486, dir: 1 }, nana: { x: 600, y: 484, dir: -1 } });
          await ctx.say('nana', 'إيديكم نضيفة! محتاجة دقيق وبيض وفانيليا وتمر.. دوّروا عليهم.');
          ctx.tip('الدقيق على الرف العالي. مودي طويل!', 'toota');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الدقيق والبيض والفانيليا والتمر', hintAfter: 14, spots: [
              { id: 'flour', art: 'nn_flour', x: 252, y: 106, s: 62, needs: 'tall', walkOff: 0, listArt: 'nn_flour', needsMsg: 'الدقيق عالي! محتاجين {m} الطويل' },
              { id: 'vanilla', art: 'nn_vanilla', x: 282, y: 212, s: 48, needs: 'finder', walkOff: 0, listArt: 'nn_vanilla', draw: faint('nn_vanilla', 48), needsMsg: 'الفانيليا متخبّية بين البرطمانات! نيمو بتلاقيها' },
              { id: 'eggs', art: 'nn_eggs', x: 330, y: 468, s: 66, needs: 'small', walkOff: 0, listArt: 'nn_eggs', needsMsg: 'البيض في مكان ضيّق! محتاجين حد صغير' },
              { id: 'dates', art: 'dates', x: 850, y: 268, s: 54, listArt: 'dates' }]
          });
          if (f.wrong <= 2) ctx.reward.star(1); ctx.value('teamwork');
          await ctx.say('nana', 'كل حاجة اتلاقت! دلوقتي نشكّل الكحك ونرصّه في الصواني.');
          m0 = mis(ctx);
          const acc = function () { return this.n < 4; };
          const items = []; for (let i = 0; i < 8; i++) items.push({ id: 'k' + i, art: 'nn_kaak', x: 300 + (i % 4) * 120, y: 190 + Math.floor(i / 4) * 70, s: 62 });
          const tr = await ctx.games.dragdrop({
            prompt: 'رصّوا الكحك: ٤ في كل صينية', heroes: 'corner', panel: { x: 230, y: 130, w: 500, h: 170 }, wrongHint: 'الصينية دي كملت ٤! حطّها في الصينية التانية', items,
            targets: [{ id: 'trA', x: 300, y: 400, w: 220, h: 100, art: 'nn_tray', s: 190, label: 'صينية ١', cols: 4, dx: 44, dy0: -8, itemScale: .6, accepts: acc }, { id: 'trB', x: 660, y: 400, w: 220, h: 100, art: 'nn_tray', s: 190, label: 'صينية ٢', cols: 4, dx: 44, dy0: -8, itemScale: .6, accepts: acc }]
          });
          if (mis(ctx) - m0 <= 1) ctx.reward.star(1);
          ctx.heroes({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, toota: { x: 100, y: 486, dir: 1 }, nana: { x: 600, y: 484, dir: -1 } });
          await ctx.say('nana', 'الفرن سخن، فهو للكبار بس. أنا هدخّل الصواني وانتم تستنوا بعيد.');
          st.state.bake = true; ctx.sfx('bell'); await ctx.wait(1.2);
          await ctx.say('toota', 'وإحنا مستنيين، تحدّي حساب!');
          const q = await ctx.quiz.pair({ aboody: B('nn6_trays'), moody: B('nn9_kaak') });
          await ctx.say('nana', 'الكحك جهز! دلوقتي السفرة. هنبقى ستة: أنا وانتم الأربعة وماما.');
          st.state.bake = false; st.state.table = true;
          const cnt = await ctx.quiz.ask(B('nn6_plates'), { who: 'aboody' });
          const mats = [[290, 384, 'face:nana'], [480, 380, 'face:moody'], [670, 384, 'face:aboody'], [290, 452, 'face:toota'], [480, 456, 'face:nemo'], [670, 452, 'mama']];
          const one = function () { return this.n < 1; };
          const tb = await ctx.games.dragdrop({
            prompt: 'حطّوا طبق لكل واحد على السفرة', heroes: 'corner', panel: { x: 200, y: 120, w: 560, h: 110 }, wrongHint: 'كل واحد له طبق واحد بس',
            items: [0, 1, 2, 3, 4, 5].map(i => ({ id: 'pl' + i, art: 'plate', x: 290 + i * 76, y: 176, s: 66 })),
            targets: mats.map((p, i) => ({ id: 'mat' + i, x: p[0], y: p[1], w: 130, h: 60, itemScale: .66, dy0: 10, accepts: one, draw: (g, tt) => { G.ell(g, 0, 8, 58, 24, 'rgba(255,214,150,.95)', 3); A.draw(g, p[2], 0, -28, 54); } }))
          });
          ctx.heroes({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, toota: { x: 100, y: 486, dir: 1 }, nana: { x: 800, y: 484, dir: -1 } });
          if (mis(ctx) - m0 <= 2 && q.firstTry >= 1 && cnt.tries === 1) ctx.reward.star(1);
          await ctx.say('nana', 'ما شاء الله! كل واحد له طبق. قبل ما ناكل نقول إيه؟');
          await ctx.games.ritual({ text: 'بسم الله', sub: 'قبل الأكل' }); ctx.value('bismillah');
          await ctx.say('nana', 'الله يبارك فيكم يا حبايبي!', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 4) ألبوم ننا ============ */
      {
        id: 'm4', title: 'ألبوم ننا', intro: 'ننا بتحكي حكايات الصور القديمة.. بس الألبوم مستخبّي!', values: ['family', 'elders', 'kindness'], sticker: 'nana_album',
        heroes: ALL5, control: ALL4, wisdom: 'اللي ملوش كبير يشتري له كبير', diary: { pic: 'nn_album', text: 'شفنا ألبوم صور العيلة مع ننا وسمعنا حكاياتها' },
        async run(ctx) {
          const st = ctx.stage, here = { moody: { x: 470, y: 482, dir: -1 }, aboody: { x: 560, y: 494, dir: -1 }, toota: { x: 400, y: 486, dir: 1 }, nemo: { x: 300, y: 490, dir: 1 }, nana: { x: 650, y: 478, dir: -1 } };
          let m0 = mis(ctx);
          await ctx.scene('nn_living', { state: { lampOn: true }, heroes: here });
          await ctx.say('nana', 'تعالوا اقعدوا جنبي يا حبايبي. عايزة أوريكم ألبوم الصور القديم.. بس مش لاقياه! ولا سبحتي كمان.');
          await ctx.say('nemo', 'أنا هدوّر! أنا بحب ألاقي الحاجات.');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الألبوم وسبحة ننا', hintAfter: 14, spots: [
              { id: 'album', art: 'nn_album', x: 855, y: 372, s: 62, needs: 'finder', walkOff: 0, listArt: 'nn_album', draw: faint('nn_album', 62), needsMsg: 'نيمو بتلاقي الحاجات المستخبّية!' },
              { id: 'tasbeeh', art: 'nn_tasbeeh', x: 110, y: 232, s: 56, needs: 'tall', walkOff: 0, listArt: 'nn_tasbeeh', needsMsg: 'السبحة فوق الدولاب! محتاجين {m} الطويل' }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          ctx.heroes(here); st.state.album = true;
          await ctx.say('nana', 'جزاكم الله خير يا حبايبي! لولاكم كنت هفضل أدوّر.');
          ctx.value('eldercare');
          await ctx.say('nana', 'كل صورة وراها حكاية. تعالوا نشوف مين فيهم بيضحك أحلى ضحكة!');
          const mm = await ctx.games.memory({ prompt: 'اقلبوا الصور وطابقوا الوشوش', pairs: ['face:baba', 'face:nana', 'face:toota', 'face:nemo', 'face:moody'], cols: 5 });
          if (mm.moves <= 9) ctx.reward.star(1);
          ctx.heroes(here);
          await ctx.say('nana', 'يا سلام! كلهم ضحكتهم حلوة. العيلة أحلى حاجة في الدنيا.');
          await ctx.say('toota', 'ننا، احكي لنا حكاية من زمان.');
          await ctx.say('nana', 'زمان كنت أسمع كلام الكبار وأتعلّم منهم. كانوا يقولوا: اللي ملوش كبير يشتري له كبير.');
          await ctx.say('toota', 'يعني الكبار عندهم خبرة وحكمة، ولازم نسمعهم؟');
          await ctx.say('nana', 'بالظبط يا حبيبتي! ولغز بقى.. اللي يحلّه ياخد بوسة.');
          m0 = mis(ctx);
          const q = await ctx.quiz.pair({ aboody: B('nn6_door'), moody: B('nnb_riddle') });
          const pv = await ctx.quiz.ask(B('nn9_proverb'), { who: 'moody' });
          if (q.firstTry + (pv.tries === 1 ? 1 : 0) >= 2 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('nana', 'ربنا يخليكم ليا! يلا نكمّل يومنا.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 5) البلكونة والدوا ============ */
      {
        id: 'm5', title: 'ميعاد الدوا', intro: 'نسقي نباتات ننا ونفكّرها بميعاد الدوا.', values: ['plantcare', 'eldercare', 'kindness'], sticker: 'nana_plant',
        heroes: ALL5, control: ALL4, wisdom: 'الكبير محتاج حنيّتنا زي ما إحنا محتاجين حنيّته', diary: { pic: 'nn_meds', text: 'سقينا زرع ننا وفكّرناها بميعاد الدوا وظبّطنا الساعة' },
        async run(ctx) {
          const st = ctx.stage, here = { moody: { x: 470, y: 482, dir: 1 }, aboody: { x: 560, y: 494, dir: 1 }, toota: { x: 380, y: 486, dir: 1 }, nemo: { x: 290, y: 490, dir: 1 }, nana: { x: 700, y: 478, dir: -1 } };
          let m0 = mis(ctx);
          await ctx.scene('nn_balcony', { state: {}, heroes: here });
          await ctx.say('nana', 'يا ولاد، نباتاتي عطشانة! الشمس كانت جامدة النهاردة.');
          await ctx.say('toota', 'هنسقيهم واحدة واحدة. اللي فوق لمودي، واللي تحت لعبودي أو نيمو.');
          const potDraw = (suffix, s) => (g, t, st2, sp) => { A.draw(g, 'nn_pot' + (sp.found ? '' : ':wilt') + suffix, 0, 0, s); if (!sp.found) pulse(s * .55)(g, t, st2, sp); };
          const splash = (x, y) => () => { ctx.fx.burst(x, y - 50, { n: 16, kind: 'drop', col: '#4aa8e8', max: 200 }); ctx.sfx('splash'); };
          const f = await ctx.games.hidden({
            prompt: 'اسقوا النباتات العطشانة', hintAfter: 14, spots: [
              { id: 'p1', x: 820, y: 322, s: 84, keep: true, walkOff: 0, listArt: 'nn_pot:wilt', draw: potDraw('', 84), onFound: splash(820, 322) },
              { id: 'p2', x: 610, y: 196, s: 84, keep: true, needs: 'tall', walkOff: 0, listArt: 'nn_pot:wilt', draw: potDraw(':hang', 84), needsMsg: 'الزرع معلّق عالي! محتاجين {m} الطويل', onFound: splash(610, 196) },
              { id: 'p3', x: 235, y: 428, s: 80, keep: true, needs: 'small', walkOff: 0, listArt: 'nn_pot:wilt', draw: potDraw('', 80), needsMsg: 'الزرع ورا الكرسي في مكان ضيّق! محتاجين حد صغير', onFound: splash(235, 428) }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          await ctx.say('nana', 'بقوا فرحانين! الزرع بيحب اللي يخاف عليه.');
          ctx.value('plantcare');
          await ctx.scene('nn_living', { state: { night: true, lampOn: true, meds: true }, heroes: { moody: { x: 500, y: 482, dir: 1 }, aboody: { x: 590, y: 494, dir: 1 }, toota: { x: 410, y: 486, dir: 1 }, nemo: { x: 320, y: 490, dir: 1 }, nana: { x: 700, y: 478, dir: -1 } } });
          const here2 = { moody: { x: 500, y: 482, dir: 1 }, aboody: { x: 590, y: 494, dir: 1 }, toota: { x: 410, y: 486, dir: 1 }, nemo: { x: 320, y: 490, dir: 1 }, nana: { x: 700, y: 478, dir: -1 } };
          await ctx.say('nana', 'الساعة قربت تبقى تمانية.. أنا ساعات بنسى ميعاد الدوا.');
          await ctx.say('toota', 'ننا لازم تاخد الدوا في ميعاده.');
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'علبة الدوا على الترابيزة. نعمل إيه؟', options: [
              { text: 'ناخد حباية نجرّب طعمها', art: 'nn_meds', good: false, consequence: [['toota', 'لأ! الدوا مش حلوى. أي حد غير ننا لو أخده ممكن يتعب.'], ['aboody', 'آسف! مش هلمسه تاني.']] },
              { text: 'نفكّر ننا بالميعاد ونجيب لها ماية', art: 'nn_glass', good: true, reply: [['nana', 'ربنا يخليكم ليا. إنتوا بتفكّروني بحب!'], ['moody', 'وإحنا بنحبك يا ننا.']] },
              { text: 'نسيبها ونلعب', art: 'tablet', good: false, consequence: [['nemo', 'بس ننا محتاجانا! نفكّرها بحب.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('eldercare');
          await ctx.say('nana', 'ظبّطوا لي المنبّه على الساعة تمانية عشان أفتكر الدوا.');
          const c1 = await ctx.games.nnClock({ prompt: 'ظبّطوا الساعة على ٨ بالظبط', h: 8, m: 0, label: 'ميعاد الدوا', art: 'nn_meds' });
          await ctx.say('nana', 'والمنبّه التاني للنوم: تسعة ونص.');
          const c2 = await ctx.games.nnClock({ prompt: 'ننا بتنام ٩ ونص. ظبّطوا الساعة', h: 9, m: 30, halves: true, label: 'ميعاد النوم', art: 'moon' });
          ctx.heroes(here2);
          const q = await ctx.quiz.pair({ aboody: B('nn6_clock8'), moody: B('nn9_meds') });
          if (c1.tries + c2.tries <= 3 && q.firstTry >= 1 && mis(ctx) - m0 <= 3) ctx.reward.star(1);
          await ctx.say('nana', 'تسلموا يا حبايبي. محدّش بيفتكرني زيكم.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 6) هدية لننا وبابا بيتصل ============ */
      {
        id: 'm6', title: 'هدية لننا', intro: 'الوقت جه نطلع.. نسيب لننا كارت حلو، وبابا بيتصل!', values: ['family', 'thanks', 'elders', 'kindness'], sticker: 'nana_gift',
        heroes: ALL5, control: ALL4, wisdom: 'كلمة حلوة وهدية بسيطة بتفرّح قلب جدّتك', diary: { pic: 'nn_gift', text: 'عملنا كارت لننا وكلّمنا بابا وقلنا له إننا قضينا يوم جميل' },
        async run(ctx) {
          const st = ctx.stage, here = { moody: { x: 420, y: 482, dir: 1 }, aboody: { x: 510, y: 494, dir: 1 }, toota: { x: 330, y: 486, dir: 1 }, nemo: { x: 240, y: 490, dir: 1 }, nana: { x: 640, y: 478, dir: -1 } };
          let m0 = mis(ctx);
          await ctx.scene('nn_living', { state: { lampOn: true }, heroes: here });
          await ctx.say('toota', 'الوقت اتأخر ولازم نطلع للدور السادس. بس نسيب لننا حاجة تفتكرنا بيها.');
          await ctx.say('nemo', 'نعمل لها كارت! أنا هرسم!');
          const cd = await ctx.games.dragdrop({
            prompt: 'زيّنوا كارت ننا بالورد والقلوب', heroes: 'corner', panel: { x: 150, y: 120, w: 660, h: 110 }, wrongHint: 'حطّها على الكارت', items: [
              { id: 'd1', art: 'heartbig', to: 'card', x: 230, y: 176, s: 64 }, { id: 'd2', art: 'nn_flower:pink', to: 'card', x: 320, y: 178, s: 64 }, { id: 'd3', art: 'star', to: 'card', x: 410, y: 176, s: 60 },
              { id: 'd4', art: 'nn_butterfly', to: 'card', x: 500, y: 176, s: 62 }, { id: 'd5', art: 'nn_flower:yellow', to: 'card', x: 590, y: 178, s: 64 }, { id: 'd6', art: 'sunart', to: 'card', x: 680, y: 176, s: 62 }],
            targets: [{ id: 'card', x: 480, y: 376, w: 420, h: 190, cols: 6, dx: 56, dy0: 6, itemScale: .75, draw: (g) => { G.fillRR(g, -210, -95, 420, 190, 20, '#fff7e3', 5); G.fillRR(g, -196, -81, 392, 162, 12, null, 3.5, '#ff8fa8'); G.text(g, 'إلى ننا زوزا', 0, -52, { size: 34, color: '#c25a00' }); } }]
          });
          ctx.heroes(here);
          if (mis(ctx) - m0 <= 1) ctx.reward.star(1);
          await ctx.say('nana', 'الله! أحلى كارت في الدنيا! هحطّه على الثلاجة وكل يوم أبصّ له.');
          await ctx.games.ritual({ text: 'ربنا يخليكي يا ننا', sub: 'نشكر ننا', bottom: 120 }); ctx.value('thanks');
          await ctx.say('nana', 'وده كحك بالتمر. خدوا لماما وبابا، وسلّموا عليهم.', { anim: 'wave' });
          ctx.fx.float('هدية من ننا!', 480, 300);
          ctx.sfx('bell');
          await ctx.say('narrator', 'تليفون بيرنّ.. بابا بيتصل!');
          await ctx.say('baba', 'السلام عليكم! وحشتوني أوي يا أحلى ولاد! عاملين إيه عند ننا؟');
          const ch = await ctx.games.choice({
            prompt: 'نحكي لبابا إيه؟', options: [
              { text: 'عملنا كحك مع ننا', art: 'nn_kaak', good: true, reply: [['baba', 'الله! كحك ننا أحلى كحك. خلّوا لي واحدة.']] },
              { text: 'سلّمنا على ننا وبوسنا إيدها', art: 'heartbig', good: true, reply: [['baba', 'برافو عليكم! ده أدب جميل. بوسوا إيدها كمان بدالي.']] }]
          });
          await ctx.say('nana', 'ربنا يحفظك يا حبيبي ويرجّعك لينا بالسلامة.');
          await ctx.say('baba', 'آمين يا ننا! سلّموا لي على الكل. ويلا بقى سؤال أخير من بابا!');
          m0 = mis(ctx);
          const q = await ctx.quiz.fromBank({ n: 2, tag: 'nana', who: ctx.active });
          if (q.firstTry >= 2) ctx.reward.star(1); else if (mis(ctx) - m0 <= 2 && q.correct >= 2) ctx.reward.star(1);
          await ctx.say('baba', 'فخور بيكم أوي! يلا باي باي، وحشتوني.', { anim: 'wave' });
          ctx.fx.confetti(); ctx.react('good', 'both'); ctx.sfx('fanfare');
          await ctx.say('nana', 'يوم عمري يا حبايبي! تعالوا نتحضّن حضن جماعي.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
