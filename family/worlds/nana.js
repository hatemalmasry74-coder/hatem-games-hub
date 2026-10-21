/* Family Adventures - worlds/nana.js : WORLD 7 "بيت {gm}" (7 missions; m7 = cooking with Aunt Amani; Aunt Nada + Toti drop in as light comic cameos).
   The family lives on the 6th floor; the grandmother lives on the 3rd floor of the SAME building.
   Needs (loaded before): content/q_nana.js, worlds/nana_kits.js, worlds/nana_art.js.  Tokens {m} {a} {me} {t} {n} = names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const B = id => M.banks[id];
  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  /* faint object + sparkle (it is "hidden" until found) */
  const faint = (art, s) => (g, t) => { g.save(); g.globalAlpha = .75; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const ALL4 = ['moody', 'aboody', 'toota', 'nemo'], ALL5 = ALL4.concat(['nana']), ALL6 = ALL5.concat(['aunt2']);   // aunt2 = aunt Nada (always on her phone)
  const mis = ctx => ctx.mistakes;

  M.registerValue('liftsafety', { label: 'الأمان في الأسانسير', desc: 'نمسك إيد الكبير ومنلعبش في الأسانسير' });
  M.registerValue('manners', { label: 'أدب الزيارة والسلام', desc: 'نخبّط بهدوء ونسلّم ونبوس إيد الكبير' });
  M.registerValue('elders', { label: 'احترام الكبار', desc: 'نسمع كلام {gmt} ونقدّر خبرتها' });
  M.registerValue('handwash', { label: 'غسل الإيدين قبل الأكل', desc: 'النضافة قبل المطبخ' });
  M.registerValue('eldercare', { label: 'رعاية الكبار', desc: 'نفكّر {gmt} بميعاد الدوا ونساعدها' });
  M.registerValue('plantcare', { label: 'رعاية النباتات', desc: 'نسقي الزرع ونحافظ عليه' });
  M.registerValue('kitchensafety', { label: 'الأمان في المطبخ', desc: 'السخن والسكينة للكبار بس، وننضّف بعد الطبخ' });
  M.registerValue('family', { label: 'حب العيلة', desc: 'وقت حلو مع {gmt} وكلمة حلوة لبابا' });

  M.registerWorld({
    id: 'nana', order: 7, title: 'بيت {gm}', icon: 'w_nana', theme: { c1: '#e6d6ff', c2: '#b79be6' }, finalSticker: 'nana_home',
    stickers: [
      { id: 'nana_lift', title: 'أمان الأسانسير', art: 'nn_lift', bg: '#e3e8f5' }, { id: 'nana_salam', title: 'سلام وأدب', art: 'nn_door', bg: '#e6f6e8' },
      { id: 'nana_kaak', title: 'كحك {gmt}', art: 'nn_kaak', bg: '#fff0c4', rot: .08 }, { id: 'nana_album', title: 'ألبوم العيلة', art: 'nn_album', bg: '#ffe4e0', rot: -.06 },
      { id: 'nana_plant', title: 'حارس الزرع', art: 'nn_pot', bg: '#d9f6d0' }, { id: 'nana_gift', title: 'هدية من القلب', art: 'nn_gift', bg: '#ffe0ea', rot: .1 },
      { id: 'nana_cook', title: 'شيف {aunt1}', art: 'nn_dish', bg: '#fff0c4', rot: -.07 }, { id: 'nana_home', title: 'أبطال بيت {gmt}', art: 'w_nana', bg: '#ece0ff', rot: -.05 }
    ],
    missions: [
      /* ============ 1) ننزل ل{gmt} ============ */
      {
        id: 'm1', title: 'ننزل ل{gm}', intro: 'من الدور السادس للدور التالت.. بالأمان!', values: ['liftsafety', 'teamwork', 'kindness'], sticker: 'nana_lift',
        heroes: ALL4, control: ALL4, wisdom: 'الأسانسير مش لعبة.. بنمسك إيد بعض وبنقف هادين', diary: { pic: 'nn_lift', text: 'نزلنا بالأسانسير من الدور السادس للتالت وحاولنا نكون هادين وأمان' },
        async run(ctx) {
          const st = ctx.stage; let m0;
          await ctx.scene('nn_hall6', { state: { liftFloor: 6, doorsOpen: 0 } });
          await ctx.say('mama', 'يلا يا حبايبي! {gm} مستنياكم في الدور التالت. خدوا الهدية بتاعتها.');
          await ctx.say('toota', 'أنا هاخد بالي من الصغيرين. بس الأول لازم نلاقي الهدية وننده الأسانسير.');
          await ctx.say('nemo', 'وأنا هدوّر معاكم! أنا شاطرة في اللقاطة.');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على هدية {gmt}، وادوسوا على زرار الأسانسير', hintAfter: 14, spots: [
              { id: 'gift', art: 'nn_gift', x: 748, y: 412, s: 58, needs: 'small', walkOff: 0, listArt: 'nn_gift', draw: faint('nn_gift', 58), needsMsg: 'الهدية تحت الدكّة! محتاجين حد صغير' },
              { id: 'call', art: 'nn_buttons', x: 614, y: 266, s: 56, hit: 46, needs: 'tall', keep: true, walkOff: 0, listArt: 'nn_buttons', draw: pulse(34), needsMsg: 'الزرار عالي! محتاجين {m} الطويل', onFound: () => { st.state.callLit = true; ctx.sfx('click'); } }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          ctx.sfx('bell'); await M.tw(st.state, { doorsOpen: 1 }, .9, 'inOut');
          await ctx.say('aboody', 'الأسانسير وصل! يلا نجري نركب!');
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'الأسانسير فتح. نعمل إيه جوّه؟', options: [
              { text: 'نضغط على كل الزراير', art: 'nn_buttons', good: false, consequence: [['toota', 'لأ! لو ضغطنا كل الزراير الأسانسير هيقف في كل دور ونتأخر على {gmt}.'], ['aboody', 'معاكي حق.. ده مش لعب.']] },
              { text: 'نمسك إيد الكبير ونقف هادين', art: 'nn_hands', good: true, reply: [['toota', 'برافو! كده أمان. أنا هاسك إيد {a}.'], ['moody', 'وأنا هقف جنب الزراير.']] },
              { text: 'نجري ونلعب جوّه', art: 'ball', good: false, consequence: [['moody', 'الأسانسير ضيّق وبيتحرك. ممكن نقع ونتأذّي.'], ['nemo', 'خلّينا نقف هادين.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('liftsafety');
          await ctx.scene('nn_lift', { state: { floor: 6, doors: 0 }, heroes: { moody: { x: 300, y: 484, dir: 1 }, aboody: { x: 420, y: 494, dir: -1 }, toota: { x: 200, y: 488, dir: 1 }, nemo: { x: 530, y: 492, dir: -1 } } });
          await ctx.say('toota', 'احنا في الدور السادس. و{gmt} في الدور التالت. نضغط على الرقم الصح!');
          const lf = await ctx.games.nnLift({ prompt: 'ادوس على زرار الدور التالت', target: 3, from: 6 });
          await ctx.say('moody', 'نزلنا خمسة.. أربعة.. تلاتة! وصلنا ل{gmt}!');
          await ctx.say('narrator', 'سؤال صغير قبل ما الباب يفتح!');
          const q = await ctx.quiz.pair({ aboody: B('nn6_floor'), moody: B('nn9_between') });
          if (lf.tries <= 1 && q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('nana', 'سمعت صوت الأسانسير! حبايبي وصلوا؟ تعالوا يا قلبي!');
          return ctx.nav.complete();
        }
      },
      /* ============ 2) نخبّط ونسلّم ============ */
      {
        id: 'm2', title: 'نخبّط ونسلّم', intro: 'باب {gm}.. الأدب أولًا!', values: ['manners', 'elders', 'kindness'], sticker: 'nana_salam',
        heroes: ALL4, control: ALL4, wisdom: 'السلام قبل الكلام، وبوسة الإيد بتفرّح الكبير', diary: { pic: 'nn_door', text: 'خبّطنا بهدوء وسلّمنا على {gmt} وبوسنا إيدها' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          const place = o => Object.assign({ moody: { x: 650, y: 482, dir: -1 }, aboody: { x: 750, y: 494, dir: -1 }, toota: { x: 570, y: 486, dir: -1 }, nemo: { x: 850, y: 490, dir: -1 }, nana: { x: 450, y: 440, dir: 1, visible: false } }, o || {});
          await ctx.scene('nn_door3', { state: { open: 0, bell: false }, heroes: place() });
          await ctx.say('toota', 'ده باب {gm}. قبل ما ندخل، لازم نعرف الأدب.');
          await ctx.say('aboody', 'أنا عارف! نخبّط جامد ونجري جوه!');
          await ctx.say('toota', 'لأ يا {a}، هنرتّب الخطوات صح.');
          const sq = await ctx.games.sequence({ prompt: 'رتّبوا خطوات زيارة {gmt}', steps: [{ art: 'nn_bell', label: 'نرنّ الجرس مرة واحدة' }, { art: 'nn_hourglass', label: 'نستنى بهدوء' }, { art: 'nn_salam', label: 'نقول السلام عليكم' }, { art: 'nn_shoe:red', label: 'ندخل ونقلع الجزمة' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes(place()); st.state.bell = true; ctx.sfx('bell'); await ctx.wait(.9); st.state.bell = false;
          await ctx.say('nana', 'مين بيرنّ بالأدب ده؟ لحظة يا حبايبي، جاية!');
          ctx.sfx('click'); await M.tw(st.state, { open: 1 }, .9, 'inOut'); ctx.cast(ALL5, ALL4); ctx.heroes(place({ nana: { x: 450, y: 446, dir: 1, visible: true } }));
          await ctx.say('narrator', '{gmt} فتحت الباب. يلا نسلّم عليها!');
          if (M.family.on('gf')) { ctx.cast(ALL5.concat(['gf']), ALL4); ctx.heroes(place({ nana: { x: 450, y: 446, dir: 1, visible: true }, gf: { x: 330, y: 446, dir: 1 } })); await ctx.say('gf', 'السلام عليكم يا أبطال! نوّرتوا البيت.', { anim: 'wave' }); }
          await ctx.games.ritual({ text: 'السلام عليكم', sub: 'نسلّم على {gmt}', bottom: 120 });
          await ctx.say('nana', 'وعليكم السلام ورحمة الله وبركاته! حبايبي وصلوا!', { anim: 'wave' });
          const ch = await ctx.games.choice({
            prompt: '{gmt} فرحانة بينا. نسلّم عليها إزاي؟', options: [
              { text: 'نجري جوه من غير سلام', art: 'ball', good: false, consequence: [['nana', 'ولا حتى سلام يا حبيبي؟ تعالى سلّم الأول.'], ['aboody', 'آسف يا {gmt}!']] },
              { text: 'نبوس إيدها ونحضنها', art: 'heartbig', good: true, reply: [['nana', 'ربنا يخليكم ليا! حضنكم أحلى حاجة.'], ['aboody', 'وحشتيني يا {gmt}!']] },
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
          await ctx.say('nana', 'ما شاء الله! بيت {gmt} بقى منوّر.');
          await ctx.say('narrator', 'سؤالين من {gmt} عن الأدب!');
          const q = await ctx.quiz.pair({ aboody: B('nn6_salam'), moody: B('nn9_hand') });
          if (mis(ctx) - m0 <= 2 && q.firstTry >= 1) ctx.reward.star(1);
          await ctx.say('nana', 'يلا ادخلوا يا حبايبي.. هنعمل كحك سوا!');
          return ctx.nav.complete();
        }
      },
      /* ============ 3) كحك {gmt} ============ */
      {
        id: 'm3', title: 'كحك {gmt}', intro: 'نساعد {gmt} في المطبخ.. نعدّ ونرتّب ونحضّر السفرة!', values: ['handwash', 'teamwork', 'bismillah', 'help'], sticker: 'nana_kaak',
        heroes: ALL5, control: ['moody', 'aboody', 'nemo'], wisdom: 'اللي يساعد في المطبخ يتعلّم ويفرّح اللي بيحبّهم', diary: { pic: 'nn_kaak', text: 'عملنا كحك مع {gmt} وحضّرنا السفرة لستة' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('nn_kitchen', { state: {}, heroes: { moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, toota: { x: 100, y: 486, dir: 1 }, nana: { x: 600, y: 484, dir: -1 } } });
          await ctx.say('nana', 'أهلًا يا حبايبي! النهاردة هنعمل كحك بالتمر. بس الأول، إيه اللي بنعمله قبل ما نلمس العجين؟');
          await ctx.say('aboody', 'نغسل إيدينا!');
          await ctx.say('nana', 'برافو عليك يا {a}!');
          await ctx.games.scrub({
            prompt: 'اغسلوا إيديكم بالصابونة', dirt: 5, tool: 'soap', base(g, t) {
              [[300, 1], [660, -1]].forEach(h => { const x = h[0]; G.fillRR(g, x - 90, 200, 180, 190, 50, '#e4b58c', 5); [-66, -22, 22, 66].forEach((fx, i) => G.fillRR(g, x + fx - 17, 120 + (i === 1 || i === 2 ? -18 : 0), 34, 120, 17, '#e4b58c', 4.5)); G.fillRR(g, x + h[1] * 98 - 17, 250, 34, 100, 17, '#e4b58c', 4.5); });
              G.text(g, 'اسحب الصابونة على الأماكن الوسخة', 480, 470, { size: 26, color: '#fff', stroke: M.OL, sw: 6 });
            }
          });
          ctx.value('handwash'); ctx.heroes({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, toota: { x: 100, y: 486, dir: 1 }, nana: { x: 600, y: 484, dir: -1 } });
          await ctx.say('nana', 'إيديكم نضيفة! محتاجة دقيق وبيض وفانيليا وتمر.. دوّروا عليهم.');
          ctx.tip('الدقيق على الرف العالي. {m} طويل!', 'toota');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الدقيق والبيض والفانيليا والتمر', hintAfter: 14, spots: [
              { id: 'flour', art: 'nn_flour', x: 252, y: 106, s: 62, needs: 'tall', walkOff: 0, listArt: 'nn_flour', needsMsg: 'الدقيق عالي! محتاجين {m} الطويل' },
              { id: 'vanilla', art: 'nn_vanilla', x: 282, y: 212, s: 48, needs: 'finder', walkOff: 0, listArt: 'nn_vanilla', draw: faint('nn_vanilla', 48), needsMsg: 'الفانيليا متخبّية بين البرطمانات! {n} بتلاقيها' },
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
      /* ============ 4) ألبوم {gmt} ============ */
      {
        id: 'm4', title: 'ألبوم {gmt}', intro: '{gmt} بتحكي حكايات الصور القديمة.. بس الألبوم مستخبّي!', values: ['family', 'elders', 'kindness'], sticker: 'nana_album',
        heroes: ALL6, control: ALL4, wisdom: 'اللي ملوش كبير يشتري له كبير', diary: { pic: 'nn_album', text: 'شفنا ألبوم صور العيلة مع {gmt} وسمعنا حكاياتها' },
        async run(ctx) {
          const st = ctx.stage, here = { moody: { x: 470, y: 482, dir: -1 }, aboody: { x: 560, y: 494, dir: -1 }, toota: { x: 400, y: 486, dir: 1 }, nemo: { x: 300, y: 490, dir: 1 }, nana: { x: 650, y: 478, dir: -1 }, aunt2: { x: 130, y: 488, dir: 1 } };
          let m0 = mis(ctx);
          await ctx.scene('nn_living', { state: { lampOn: true }, heroes: here });
          await ctx.say('nana', 'تعالوا اقعدوا جنبي يا حبايبي. عايزة أوريكم ألبوم الصور القديم.. بس مش لاقياه! ولا سبحتي كمان.');
          await ctx.say('aboody', 'إزيّك يا {aunt2}؟ إحنا هنا!');
          await ctx.say('aunt2', 'ثانية واحدة يا حبيبي.. بخلّص رسالة!', { anim: 'phone' });
          await ctx.say('nana', 'سيبوها يا ولاد، بتطمّن على حد من العيلة. يلا نلاقي الألبوم.');
          await ctx.say('nemo', 'أنا هدوّر! أنا بحب ألاقي الحاجات.');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الألبوم وسبحة {gmt}', hintAfter: 14, spots: [
              { id: 'album', art: 'nn_album', x: 855, y: 372, s: 62, needs: 'finder', walkOff: 0, listArt: 'nn_album', draw: faint('nn_album', 62), needsMsg: '{n} بتلاقي الحاجات المستخبّية!' },
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
          await ctx.say('aunt2', 'استنوا! دي صورتي وأنا صغيرة؟ ثانية واحدة أصوّرها!', { anim: 'phone' });
          await ctx.say('toota', '{gmt}، احكي لنا حكاية من زمان.');
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
        id: 'm5', title: 'ميعاد الدوا', intro: 'نسقي نباتات {gmt} ونفكّرها بميعاد الدوا.', values: ['plantcare', 'eldercare', 'kindness'], sticker: 'nana_plant',
        heroes: ALL5, control: ALL4, wisdom: 'الكبير محتاج حنيّتنا زي ما إحنا محتاجين حنيّته', diary: { pic: 'nn_meds', text: 'سقينا زرع {gmt} وفكّرناها بميعاد الدوا وظبّطنا الساعة' },
        async run(ctx) {
          const st = ctx.stage, here = { moody: { x: 470, y: 482, dir: 1 }, aboody: { x: 560, y: 494, dir: 1 }, toota: { x: 380, y: 486, dir: 1 }, nemo: { x: 290, y: 490, dir: 1 }, nana: { x: 700, y: 478, dir: -1 } };
          let m0 = mis(ctx);
          await ctx.scene('nn_balcony', { state: {}, heroes: here });
          await ctx.say('nana', 'يا ولاد، نباتاتي عطشانة! الشمس كانت جامدة النهاردة.');
          await ctx.say('toota', 'هنسقيهم واحدة واحدة. اللي فوق ل{m}، واللي تحت ل{a} أو {n}.');
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
          const here2n = { moody: { x: 500, y: 482, dir: 1 }, aboody: { x: 590, y: 494, dir: 1 }, toota: { x: 410, y: 486, dir: 1 }, nemo: { x: 320, y: 490, dir: 1 }, nana: { x: 700, y: 478, dir: -1 }, aunt2: { x: 150, y: 488, dir: 1 } };
          const here2 = { moody: { x: 500, y: 482, dir: 1 }, aboody: { x: 590, y: 494, dir: 1 }, toota: { x: 410, y: 486, dir: 1 }, nemo: { x: 320, y: 490, dir: 1 }, nana: { x: 700, y: 478, dir: -1 } };
          await ctx.say('nana', 'الساعة قربت تبقى تمانية.. أنا ساعات بنسى ميعاد الدوا.');
          ctx.cast(ALL6, ALL4); ctx.heroes(here2n);
          await ctx.say('toota', '{gmt} لازم تاخد الدوا في ميعاده.');
          await ctx.say('aunt2', 'آه صح الدوا! ثانية واحدة أظبّط تنبيه على موبايلي.', { anim: 'phone' });
          await ctx.say('aboody', 'وإحنا هنظبط الساعة ل{gmt} بنفسنا!');
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'علبة الدوا على الترابيزة. نعمل إيه؟', options: [
              { text: 'ناخد حباية نجرّب طعمها', art: 'nn_meds', good: false, consequence: [['toota', 'لأ! الدوا مش حلوى. أي حد غير {gmt} لو أخده ممكن يتعب.'], ['aboody', 'آسف! مش هلمسه تاني.']] },
              { text: 'نفكّر {gmt} بالميعاد ونجيب لها ماية', art: 'nn_glass', good: true, reply: [['nana', 'ربنا يخليكم ليا. إنتوا بتفكّروني بحب!'], ['moody', 'وإحنا بنحبك يا {gmt}.']] },
              { text: 'نسيبها ونلعب', art: 'tablet', good: false, consequence: [['nemo', 'بس {gmt} محتاجانا! نفكّرها بحب.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('eldercare');
          await ctx.say('nana', 'ظبّطوا لي المنبّه على الساعة تمانية عشان أفتكر الدوا.');
          const c1 = await ctx.games.nnClock({ prompt: 'ظبّطوا الساعة على ٨ بالظبط', h: 8, m: 0, label: 'ميعاد الدوا', art: 'nn_meds' });
          await ctx.say('nana', 'والمنبّه التاني للنوم: تسعة ونص.');
          const c2 = await ctx.games.nnClock({ prompt: '{gmt} بتنام ٩ ونص. ظبّطوا الساعة', h: 9, m: 30, halves: true, label: 'ميعاد النوم', art: 'moon' });
          ctx.heroes(here2n);
          const q = await ctx.quiz.pair({ aboody: B('nn6_clock8'), moody: B('nn9_meds') });
          if (c1.tries + c2.tries <= 3 && q.firstTry >= 1 && mis(ctx) - m0 <= 3) ctx.reward.star(1);
          await ctx.say('nana', 'تسلموا يا حبايبي. محدّش بيفتكرني زيكم.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 6) هدية ل{gmt} وبابا بيتصل ============ */
      {
        id: 'm6', title: 'هدية ل{gmt}', intro: 'الوقت جه نطلع.. نسيب ل{gmt} كارت حلو، وبابا بيتصل!', values: ['family', 'thanks', 'elders', 'kindness'], sticker: 'nana_gift',
        heroes: ALL6, control: ALL4, wisdom: 'كلمة حلوة وهدية بسيطة بتفرّح قلب جدّتك', diary: { pic: 'nn_gift', text: 'عملنا كارت ل{gmt} وكلّمنا بابا وقلنا له إننا قضينا يوم جميل' },
        async run(ctx) {
          const st = ctx.stage, here = { moody: { x: 420, y: 482, dir: 1 }, aboody: { x: 510, y: 494, dir: 1 }, toota: { x: 330, y: 486, dir: 1 }, nemo: { x: 240, y: 490, dir: 1 }, nana: { x: 640, y: 478, dir: -1 }, aunt2: { x: 120, y: 488, dir: 1 } };
          let m0 = mis(ctx);
          await ctx.scene('nn_living', { state: { lampOn: true }, heroes: here });
          await ctx.say('toota', 'الوقت اتأخر ولازم نطلع للدور السادس. بس نسيب ل{gmt} حاجة تفتكرنا بيها.');
          await ctx.say('nemo', 'نعمل لها كارت! أنا هرسم!');
          const cd = await ctx.games.dragdrop({
            prompt: 'زيّنوا كارت {gmt} بالورد والقلوب', heroes: 'corner', panel: { x: 150, y: 120, w: 660, h: 110 }, wrongHint: 'حطّها على الكارت', items: [
              { id: 'd1', art: 'heartbig', to: 'card', x: 230, y: 176, s: 64 }, { id: 'd2', art: 'nn_flower:pink', to: 'card', x: 320, y: 178, s: 64 }, { id: 'd3', art: 'star', to: 'card', x: 410, y: 176, s: 60 },
              { id: 'd4', art: 'nn_butterfly', to: 'card', x: 500, y: 176, s: 62 }, { id: 'd5', art: 'nn_flower:yellow', to: 'card', x: 590, y: 178, s: 64 }, { id: 'd6', art: 'sunart', to: 'card', x: 680, y: 176, s: 62 }],
            targets: [{ id: 'card', x: 480, y: 376, w: 420, h: 190, cols: 6, dx: 56, dy0: 6, itemScale: .75, draw: (g) => { G.fillRR(g, -210, -95, 420, 190, 20, '#fff7e3', 5); G.fillRR(g, -196, -81, 392, 162, 12, null, 3.5, '#ff8fa8'); G.text(g, 'إلى {gm}', 0, -52, { size: 34, color: '#c25a00' }); } }]
          });
          ctx.heroes(here);
          if (mis(ctx) - m0 <= 1) ctx.reward.star(1);
          await ctx.say('nana', 'الله! أحلى كارت في الدنيا! هحطّه على الثلاجة وكل يوم أبصّ له.');
          await ctx.say('aunt2', 'يا سلام! كارت جميل.. ثانية واحدة أصوّره!', { anim: 'phone' });
          await ctx.games.ritual({ text: 'ربنا يخليكي يا {gmt}', sub: 'نشكر {gmt}', bottom: 120 }); ctx.value('thanks');
          await ctx.say('nana', 'وده كحك بالتمر. خدوا لماما وبابا، وسلّموا عليهم.', { anim: 'wave' });
          ctx.fx.float('هدية من {gmt}!', 480, 300);
          ctx.sfx('bell');
          await ctx.say('narrator', 'تليفون بيرنّ.. بابا بيتصل!');
          await ctx.say('baba', 'السلام عليكم! وحشتوني أوي يا أحلى ولاد! عاملين إيه عند {gmt}؟');
          const ch = await ctx.games.choice({
            prompt: 'نحكي لبابا إيه؟', options: [
              { text: 'عملنا كحك مع {gmt}', art: 'nn_kaak', good: true, reply: [['baba', 'الله! كحك {gmt} أحلى كحك. خلّوا لي واحدة.']] },
              { text: 'سلّمنا على {gmt} وبوسنا إيدها', art: 'heartbig', good: true, reply: [['baba', 'برافو عليكم! ده أدب جميل. بوسوا إيدها كمان بدالي.']] }]
          });
          await ctx.say('nana', 'ربنا يحفظك يا حبيبي ويرجّعك لينا بالسلامة.');
          await ctx.say('baba', 'آمين يا {gmt}! سلّموا لي على الكل. ويلا بقى سؤال أخير من بابا!');
          m0 = mis(ctx);
          const q = await ctx.quiz.fromBank({ n: 2, tag: 'nana', who: ctx.active });
          if (q.firstTry >= 2) ctx.reward.star(1); else if (mis(ctx) - m0 <= 2 && q.correct >= 2) ctx.reward.star(1);
          await ctx.say('baba', 'فخور بيكم أوي! يلا باي باي، وحشتوني.', { anim: 'wave' });
          ctx.fx.confetti(); ctx.react('good', 'both'); ctx.sfx('fanfare');
          await ctx.say('nana', 'يوم عمري يا حبايبي! تعالوا نتحضّن حضن جماعي.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 7) نطبخ مع {aunt1} ============ */
      {
        id: 'm7', title: 'نطبخ مع {aunt1}', intro: '{aunt1} جت تزور {gmt}.. وهتعلّمنا رز بالشعرية بالنضافة والأمان!', values: ['help', 'handwash', 'kitchensafety', 'teamwork', 'thanks'], sticker: 'nana_cook',
        heroes: ALL6.concat(['aunt1']), control: ALL4, wisdom: 'اللي يتعلّم يساعد في البيت بيكبر ويفرّح اللي بيحبّهم', diary: { pic: 'nn_dish', text: 'اتعلّمنا مع {aunt1} نطبخ رز بالشعرية بالنضافة والأمان، وساعدنا في تنضيف المطبخ' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          const KC = ALL5.concat(['aunt1']);
          const LV = { moody: { x: 470, y: 482, dir: -1 }, aboody: { x: 560, y: 494, dir: -1 }, toota: { x: 400, y: 486, dir: 1 }, nemo: { x: 300, y: 490, dir: 1 }, nana: { x: 650, y: 478, dir: -1 }, aunt2: { x: 130, y: 488, dir: 1 }, aunt1: { x: 940, y: 486, dir: -1, visible: false } };
          const KP = o => Object.assign({ toota: { x: 100, y: 486, dir: 1 }, nemo: { x: 190, y: 490, dir: 1 }, moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 410, y: 494, dir: 1 }, nana: { x: 600, y: 484, dir: -1 }, aunt1: { x: 720, y: 488, dir: -1 }, cz2: { x: 520, y: 500, dir: -1 }, aunt2: { x: 860, y: 488, dir: -1 } }, o || {});
          await ctx.scene('nn_living', { state: { lampOn: true }, heroes: LV });
          await ctx.say('nana', 'حد بيخبّط! دي {aunt1n} بنتي جاية تزورنا. افتحوا لها يا حبايبي.');
          ctx.sfx('bell'); st.hero('aunt1').visible = true; await ctx.walk('aunt1', 790, 486);
          await ctx.say('aunt1', 'السلام عليكم! وحشتوني أوي يا حبايبي!', { anim: 'wave' });
          await ctx.say('nana', '{aunt1n} بنتي! أهلًا يا حبيبتي. و{aunt2} كمان بنتي، وبابا و{uncle1} ولادي.', { anim: 'wave' });
          await ctx.say('aboody', '{aunt1}! جبتي معاكي إيه؟');
          await ctx.say('aunt1', 'جبت رز وشعرية وسمنة. النهاردة هعلّمكم تعملوا رز بالشعرية بإيديكم!');
          await ctx.say('toota', 'تعالوا نسلّم على {aunt2} الأول.');
          await ctx.say('aboody', 'إزيّك يا {aunt2}؟');
          await ctx.say('aunt2', 'ثانية واحدة يا حبيبي.. لسه بكتب كلمتين!', { anim: 'phone' });
          await ctx.say('aunt1', 'سيبوها، هتخلّص وتيجي. {aunt2n} قلبها كبير بس موبايلها شاغلها شوية! تعالوا على المطبخ.');
          /* ---- kitchen ---- */
          await ctx.scene('nn_kitchen', { state: {}, heroes: KP({ aunt2: { x: 860, y: 488, dir: -1, visible: false }, cz2: { x: 520, y: 500, dir: -1, visible: false } }) });
          ctx.cast(KC, ALL4);
          await ctx.say('aunt1', 'أول قاعدة في المطبخ: نلبس الغطاء بتاعنا ونغسل إيدينا بالصابون. جاهزين؟');
          await ctx.games.scrub({
            prompt: 'اغسلوا إيديكم بالصابونة', dirt: 5, tool: 'soap', base(g, t) {
              [[300, 1], [660, -1]].forEach(h => { const x = h[0]; G.fillRR(g, x - 90, 200, 180, 190, 50, '#e4b58c', 5); [-66, -22, 22, 66].forEach((fx, i) => G.fillRR(g, x + fx - 17, 120 + (i === 1 || i === 2 ? -18 : 0), 34, 120, 17, '#e4b58c', 4.5)); G.fillRR(g, x + h[1] * 98 - 17, 250, 34, 100, 17, '#e4b58c', 4.5); });
              G.text(g, 'اسحب الصابونة على الأماكن الوسخة', 480, 470, { size: 26, color: '#fff', stroke: M.OL, sw: 6 });
            }
          });
          ctx.value('handwash'); ctx.heroes(KP());
          await ctx.say('aunt1', 'إيديكم نضيفة! الرز بالشعرية عايز: رز وشعرية وسمنة وملح. دوّروا عليهم.');
          ctx.tip('الرز على الرف العالي. {m} طويل!', 'toota');
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الرز والشعرية والسمنة والملح', hintAfter: 14, spots: [
              { id: 'rice', art: 'rice', x: 252, y: 106, s: 62, needs: 'tall', walkOff: 0, listArt: 'rice', needsMsg: 'الرز عالي! محتاجين {m} الطويل' },
              { id: 'vermi', art: 'nn_shaareya', x: 282, y: 212, s: 48, needs: 'finder', walkOff: 0, listArt: 'nn_shaareya', draw: faint('nn_shaareya', 48), needsMsg: 'الشعرية متخبّية بين البرطمانات! {n} بتلاقيها' },
              { id: 'ghee', art: 'nn_ghee', x: 330, y: 468, s: 60, needs: 'small', walkOff: 0, listArt: 'nn_ghee', needsMsg: 'السمنة في مكان ضيّق! محتاجين حد صغير' },
              { id: 'salt', art: 'nn_salt', x: 850, y: 266, s: 52, listArt: 'nn_salt' }]
          });
          if (f.wrong <= 2) ctx.reward.star(1); ctx.value('teamwork');
          ctx.heroes(KP());
          await ctx.say('aunt1', 'كل حاجة جاهزة! دلوقتي نقيس. السمنة بالمعلقة، والماية بالكوب.');
          m0 = mis(ctx);
          const sp = await ctx.games.dragdrop({
            prompt: 'حطّوا ٣ معالق سمنة في الحلة، والباقي في البرطمان', heroes: 'corner', panel: { x: 190, y: 130, w: 580, h: 130 }, wrongHint: 'الحلة محتاجة ٣ معالق بس! الباقي في البرطمان',
            items: [0, 1, 2, 3, 4].map(i => ({ id: 'sp' + i, art: 'spoon', x: 270 + i * 100, y: 196, s: 64 })),
            targets: [{ id: 'pot', x: 450, y: 400, w: 220, h: 110, art: 'pot', s: 110, label: 'الحلة', cols: 3, dx: 42, dy0: -10, itemScale: .5, accepts: function () { return this.n < 3; } },
              { id: 'jar', x: 710, y: 400, w: 200, h: 110, art: 'nn_ghee', s: 100, label: 'البرطمان', cols: 2, dx: 42, dy0: -10, itemScale: .5, accepts: function () { return this.n < 2; } }]
          });
          const spOk = mis(ctx) - m0 <= 1; ctx.heroes(KP());
          await ctx.say('aunt1', 'ممتاز! ٣ معالق. كوب رز واحد محتاج كوبين ماية.');
          const ms = await ctx.games.measure({ prompt: 'حطّوا كوبين ماية في الإبريق', target: 2, unit: 'كوب ماية', max: 6 });
          ctx.heroes(KP());
          if (spOk && ms.tries <= 1) ctx.reward.star(1);
          await ctx.say('aunt1', 'دلوقتي الترتيب. الطبخ ليه خطوات، لازم ننفذها بالدور.');
          m0 = mis(ctx);
          const sq = await ctx.games.sequence({ prompt: 'رتّبوا خطوات الرز بالشعرية', steps: [{ art: 'nn_ghee', label: 'نسخّن السمنة' }, { art: 'nn_shaareya', label: 'نحمّر الشعرية' }, { art: 'rice', label: 'نضيف الرز ونقلّب' }, { art: 'cup', label: 'نحط الماية والملح' }, { art: 'nn_hotpot', label: 'نغطّي ونسيبه ينضج' }] });
          ctx.heroes(KP()); if (sq.mistakes <= 1) ctx.reward.star(1);
          /* ---- kitchen safety ---- */
          st.state.cook = true; ctx.sfx('bell');
          await ctx.say('aunt1', 'الحلة بدأت تسخن. دلوقتي أهم حاجة: الأمان! إيه اللي للكبار بس وإيه اللي ينفع نمسكه؟');
          m0 = mis(ctx);
          const so = await ctx.games.dragdrop({
            prompt: 'السخن والسكينة للكبار بس. صنّفوا الحاجات', heroes: 'corner', panel: { x: 90, y: 112, w: 780, h: 160 }, wrongHint: 'السخن والحاجات الحادة للكبار بس',
            items: [['nn_knife', 'adult'], ['nn_woodspoon', 'kid'], ['nn_hotpot', 'adult'], ['cup', 'kid'], ['nn_stove', 'adult'], ['plate', 'kid']].map((it, i) => ({ id: 'sf' + i, art: it[0], to: it[1], x: 160 + i * 128, y: 192, s: 66 })),
            targets: [{ id: 'adult', x: 440, y: 404, w: 230, h: 110, art: 'face:aunt1', s: 84, label: 'للكبار بس', cols: 3, dx: 42, dy0: 40, itemScale: .45 }, { id: 'kid', x: 710, y: 404, w: 230, h: 110, art: 'face:nemo', s: 84, label: 'ينفع نمسكه', cols: 3, dx: 42, dy0: 40, itemScale: .45 }]
          });
          const soOk = mis(ctx) - m0 <= 1; ctx.heroes(KP()); if (soOk) ctx.reward.star(1);
          await ctx.say('narrator', 'وفجأة.. سمعوا خطوات صغيرة بتجري ناحية المطبخ!');
          ctx.cast(KC.concat(['cz2']), ALL4); ctx.heroes(KP({ cz2: { x: 900, y: 500, dir: -1 } }));
          await ctx.walk('cz2', 520, 500);
          await ctx.say('cz2', 'أنا عايزة أشيل الحلة! أنا!', { anim: 'scream' });
          await ctx.say('aunt1', 'لأ يا {cz2} يا حبيبتي! الحلة سخنة أوي وهتحرق إيدك.');
          await ctx.say('cz2', 'ووو.. أنا عايزة أشيلها!', { anim: 'cry' });
          await ctx.say('nemo', 'تعالي يا {cz2}، أنا معاكي. إحنا هنساعد {aunt1} بطريقة تانية.');
          await ctx.say('cz2', 'بطريقة إيه يا {n}؟', { anim: 'idle' });
          await ctx.say('nemo', 'إنتي هتعدّي لنا المعالق، وده شغل مهم! وبعدين نتفرج على الرز وهو بيطبخ من بعيد.');
          await ctx.say('cz2', 'حاضر! أنا بحبك يا {n}.', { anim: 'cheer' });
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'الحلة بتفور وسخنة. نعمل إيه؟', options: [
              { text: 'نمسك الحلة بإيدينا', art: 'nn_hotpot', good: false, consequence: [['aunt1', 'لأ يا حبيبي! الحلة سخنة وبتحرق. دي للكبار بس.'], ['aboody', 'آسف يا عمتو!']] },
              { text: 'نبعد، وعمتو تلبس القفاز وتشيلها', art: 'nn_mitt', good: true, reply: [['aunt1', 'برافو! القفاز بيحمي الإيد، وإنتو بعيد وأمان.'], ['toota', 'وأنا هاخد بالي من {cz2}.']] },
              { text: 'نجري حوالين البوتجاز', art: 'ball', good: false, consequence: [['nana', 'لأ يا حبايبي، المطبخ مش ملعب. ممكن حد يتحرق.'], ['moody', 'معاها حق.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('kitchensafety'); ctx.heroes(KP());
          await ctx.say('aunt1', 'دلوقتي نسيب الرز على نار هادية ونستنى شوية.');
          await ctx.wait(1.2); st.state.cook = false; st.state.table = true; ctx.sfx('bell');
          await ctx.say('aunt1', 'الرز جهز! ريحته جميلة. السفرة جاهزة.');
          await ctx.say('nana', 'ما شاء الله عليكم! قبل ما ناكل نقول إيه؟', { anim: 'cheer' });
          await ctx.games.ritual({ text: 'بسم الله', sub: 'قبل الأكل' }); ctx.value('bismillah');
          await ctx.say('aboody', 'مممم! أحلى رز في الدنيا!');
          await ctx.say('toota', 'أنا عايزة أتعلّم أعمله لماما في البيت.');
          await ctx.say('nana', 'الله يبارك فيكم يا حبايبي. بقيتوا شيفات صغيرين!', { anim: 'cheer' });
          await ctx.games.ritual({ text: 'تسلم إيدك يا عمتو', sub: 'نشكر {aunt1}', bottom: 120 }); ctx.value('thanks');
          await ctx.say('aunt1', 'الله يسلمكم! بس لسه فاضل حاجة مهمة: نضّف المطبخ بعد الأكل.');
          st.state.table = false;
          m0 = mis(ctx);
          await ctx.games.dragdrop({
            prompt: 'نضّفوا المطبخ: حطّوا الأطباق والمعالق في الحوض', heroes: 'corner', panel: { x: 150, y: 120, w: 660, h: 110 }, wrongHint: 'حطّها في الحوض',
            items: [['plate', 0], ['plate', 1], ['cup', 2], ['spoon', 3], ['nn_woodspoon', 4]].map((it, i) => ({ id: 'cl' + i, art: it[0], x: 230 + i * 120, y: 176, s: 62 })),
            targets: [{ id: 'sink', x: 640, y: 390, w: 300, h: 110, art: 'nn_basin', s: 150, label: 'الحوض', cols: 5, dx: 40, dy0: -4, itemScale: .5, accepts: () => true }]
          });
          ctx.heroes(KP()); ctx.value('help'); ctx.fx.burst(480, 320, { kind: 'star', n: 14 });
          await ctx.say('narrator', 'وفجأة.. ريحة الرز وصلت للصالة!');
          ctx.cast(KC.concat(['cz2', 'aunt2']), ALL4); ctx.heroes(KP({ aunt2: { x: 900, y: 488, dir: -1 } }));
          await ctx.walk('aunt2', 800, 488);
          await ctx.say('aunt2', 'ثانية واحدة.. إيه الريحة الحلوة دي؟', { anim: 'phone' });
          await ctx.say('aunt2', 'الله! رز بالشعرية! سيبوا لي طبق قبل ما يخلص.', { anim: 'cheer' });
          await ctx.say('aunt1', 'مش قلت لك؟ الريحة بتوصل لحد الموبايل!');
          await ctx.say('narrator', 'سؤالين من {aunt1}!');
          m0 = mis(ctx);
          const q = await ctx.quiz.pair({ aboody: B('nn6_spoons'), moody: B('nn9_cup') });
          const sk = await ctx.quiz.ask(B('nn9_skill'), { who: 'moody' });
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('nana', 'يوم حلو.. المطبخ نضيف والبيت مليان ريحة حلوة. ربنا يخليكم يا حبايبي.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
