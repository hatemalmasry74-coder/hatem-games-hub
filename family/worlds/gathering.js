/* Family Adventures - worlds/gathering.js : WORLD 10 "تجمّع العائلة" (6 missions).
   The whole extended family gathers at the grandmother's flat (3rd floor) for a big Friday lunch; Baba and Uncle Kamal are visiting from the destination city.
   Heroes: the 4 kids are present and controllable; Baba, Kamal, Nana, aunts Amani and Nada, Toti, Luka, Ofa, Beno and Medo are cast (non-controllable).
   Family facts: Amani = mother of Ofa, Beno, Medo; Nada = mother of Toti; Kamal = father of Luka. Mama has no stage actor (dialogue voice only; she takes the photo).
   Needs (loaded before): content/q_gathering.js, worlds/gathering_kits.js, worlds/gathering_art.js.  Strings: single quotes, no apostrophes (voice collector scans ctx.say('who','text')).  Tokens {m} {a} {t} {n}. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, sh = U.shuffle;
  const B = id => M.banks[id], mis = ctx => ctx.mistakes;
  const ALL4 = ['moody', 'aboody', 'toota', 'nemo'], FAM = ['baba', 'uncle1', 'aunt1', 'aunt2', 'nana', 'cz2', 'cz3', 'cz1', 'cz4', 'cz5'], EVERY = ALL4.concat(FAM);
  const lay = list => { const o = {}; list.forEach(a => { o[a[0]] = { x: a[1], y: a[2], dir: a[3] || 1 }; }); return o; };
  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const faint = (art, s) => (g, t, st, sp) => { if (!sp.found) pulse(s * .6)(g, t, st, sp); g.save(); g.globalAlpha = .85; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const note = (list, sp) => list.forEach(t => M.voice.note(t, sp || 'narrator'));
  /* voice-collection helper: registers every reply / consequence line of a choice (even those a bot never opens), then runs the choice kit */
  const choiceQ = (ctx, o) => { o.options.forEach(op => [].concat(op.reply || [], Array.isArray(op.consequence) ? op.consequence : []).forEach(l => M.voice.note(l[1], l[0]))); return ctx.games.choice(o); };
  const setAnim = (ctx, id, a) => { const h = ctx.stage.heroes[id]; if (h) h.anim = a; };
  /* temporarily show only a few characters (kits that call ctx.heroes('corner') would crowd 14 people into the corners) */
  const only = (ctx, list) => ctx.cast(list, ALL4);
  /* a picture frame "story" floating above the stage while an uncle tells a story */
  const storyFrame = (ctx, art, x) => ctx.stage.addLayer({ z: 20, draw(g, t) { const y = 168 + Math.sin(t * 2) * 3; g.save(); g.translate(x || 480, y); G.fillRR(g, -74, -62, 148, 124, 22, '#fffdf4', 4.5); G.poly(g, [[-10, 62], [10, 62], [0, 80]], '#fffdf4', 3.5); A.draw(g, art, 0, 0, 108); g.restore(); } });

  M.registerValue('gt_family', { label: 'صلة الرحم', desc: 'نزور أهلنا ونسلّم عليهم ونحب قرايبنا' });
  M.registerValue('gt_respect', { label: 'احترام الكبار والسلام', desc: 'الكبير الأول ونبوس إيده ونقول السلام عليكم' });
  M.registerValue('gt_manners', { label: 'آداب السفرة', desc: 'نغسل إيدينا ونقول بسم الله ونستنى الكبير وناخد شوية' });
  M.registerValue('gt_patience', { label: 'الصبر مع الصغيرين', desc: 'نهدّي الصغير بلُطف ومنزعقش ولا نضحك عليه' });
  M.registerValue('gt_balance', { label: 'التوازن مع الموبايل', desc: 'نقفل الشاشة شوية ونقعد مع العيلة' });
  M.registerValue('gt_sharing', { label: 'اللعب بالدور والمشاركة', desc: 'اللعبة الواحدة نلعب بيها بالدور' });

  M.registerWorld({
    id: 'gathering', order: 10, title: 'تجمّع العائلة', icon: 'w_gather', theme: { c1: '#ffd9c0', c2: '#f08a5d' }, finalSticker: 'gather_family',
    heroes: ALL4, control: ALL4,
    stickers: [
      { id: 'gather_hello', title: 'سلام وأدب العيلة', art: 'gather_salam', bg: '#e6f6e8' },
      { id: 'gather_table', title: 'سفرة العيلة', art: 'gather_table', bg: '#fff0c4', rot: .06 },
      { id: 'gather_calm', title: 'صديق الصغيرين', art: 'gather_calm', bg: '#ffe0ea', rot: -.07 },
      { id: 'gather_nophone', title: 'وقت من غير موبايل', art: 'gather_phonebasket', bg: '#dff0ff', rot: .05 },
      { id: 'gather_quiz', title: 'بطل مسابقة العيلة', art: 'gather_trophy', bg: '#fff3c4', rot: -.05 },
      { id: 'gather_family', title: 'تجمّع العيلة', art: 'gather_family', bg: '#ffe4d0', rot: -.04 }
    ],
    missions: [
      /* ================= 1) الوصول والسلام ================= */
      {
        id: 'm1', title: 'الوصول والسلام', intro: 'بابا و{uncle1} وصلوا! والعيلة كلها مستنية عند {gmt}.', values: ['gt_respect', 'gt_family', 'kindness'], sticker: 'gather_hello',
        heroes: ALL4, control: ALL4, wisdom: 'السلام قبل الكلام، والكبير نبدأ بيه', diary: { pic: 'gather_salam', text: 'قابلنا بابا و{uncle1} في الدور التالت وحضنّاهم، وسلّمنا على كل العيلة عند {gmt} الكبير الأول' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('gather_landing', { state: { open: 0, liftOpen: 0 }, heroes: lay([['nemo', 410, 490], ['toota', 480, 486], ['moody', 550, 482], ['aboody', 620, 494]]) });
          await ctx.say('mama', 'يلا يا حبايبي! النهاردة الجمعة، والعيلة كلها متجمّعة عند {gm} في الدور التالت.');
          await ctx.say('nemo', 'أنا سمعت إن فيه مفاجأة حلوة أوي!');
          ctx.sfx('bell'); await ctx.wait(.5); ctx.sfx('click'); await M.tw(st.state, { liftOpen: 1 }, .9, 'inOut');
          ctx.cast(ALL4.concat(['baba', 'uncle1']), ALL4);
          ctx.heroes(lay([['nemo', 410, 490], ['toota', 480, 486], ['moody', 550, 482], ['aboody', 620, 494], ['baba', 740, 466, -1], ['uncle1', 800, 474, -1]]));
          await ctx.say('baba', 'السلام عليكم يا أحلى ولاد في الدنيا!', { anim: 'wave' });
          await ctx.say('moody', 'بابا!!! و{uncle1}!!!', { anim: 'cheer' });
          await Promise.all([ctx.walk('baba', 665, 466), ctx.walk('uncle1', 722, 474)]);
          await ctx.games.ritual({ text: 'حضن بابا', sub: 'اجري واحضنه!', who: 'moody', bottom: 150 });
          await ctx.say('baba', 'وحشتوني أوي! كبرتوا ما شاء الله.', { anim: 'cheer' });
          await ctx.games.ritual({ text: 'حضن {uncle1}', sub: 'و{uncle1} كمان', who: 'aboody', bottom: 150 });
          await ctx.say('uncle1', 'جبت لكم هدايا من السفر. بس الأول لازم نسلّم على {gmt} والعيلة كلها.');
          await ctx.say('baba', 'وفاكرين؟ الكبير بنسلّم عليه الأول. يلا ندخل!');
          ctx.value('gt_family');
          await ctx.scene('gather_living', { state: { hearts: true }, heroes: lay([['baba', 150, 462], ['uncle1', 235, 468], ['moody', 90, 490], ['aboody', 175, 498], ['toota', 265, 492], ['nemo', 350, 496]]) });
          only(ctx, ALL4);
          const sq = await ctx.games.sequence({ prompt: 'رتّبوا السلام: الكبير الأول والصغير الأخير', steps: [{ art: 'face:nana', label: '{gmt}' }, { art: 'face:aunt1', label: '{aunt1}' }, { art: 'face:cz1', label: '{cz1}' }, { art: 'face:cz3', label: '{cz3} الصغير' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.cast(EVERY, ALL4);
          ctx.heroes(lay([['baba', 150, 462], ['uncle1', 235, 468], ['moody', 90, 490], ['aboody', 175, 498], ['toota', 265, 492], ['nemo', 350, 496], ['nana', 420, 452], ['aunt1', 520, 448, -1], ['aunt2', 610, 456, -1], ['cz2', 470, 496], ['cz3', 550, 500, -1], ['cz1', 690, 490, -1], ['cz5', 790, 452, -1], ['cz4', 870, 462, -1]]));
          await ctx.say('narrator', 'ودلوقتي ندخل ونسلّم على {gm} الأول!');
          await ctx.games.ritual({ text: 'السلام عليكم', sub: 'نسلّم على كل العيلة', bottom: 120 });
          await ctx.say('nana', 'وعليكم السلام ورحمة الله وبركاته! حبايبي وصلوا! تعالوا في حضني.', { anim: 'wave' });
          const ch = await choiceQ(ctx, {
            prompt: '{gmt} فرحانة بينا. نسلّم عليها إزاي؟', options: [
              { text: 'نجري جوه من غير سلام', art: 'ball', good: false, consequence: [['nana', 'ولا حتى سلام يا حبيبي؟ تعالى سلّم الأول.'], ['aboody', 'آسف يا {gmt}!']] },
              { text: 'نبوس إيدها ونحضنها', art: 'gather_kisshand', good: true, reply: [['nana', 'ربنا يخليكم ليا! حضنكم أحلى حاجة في الدنيا.'], ['aboody', 'وحشتيني يا {gmt}!']] },
              { text: 'نبص في الموبايل ونسكت', art: 'gather_phone', good: false, consequence: [['nana', 'الموبايل بعدين يا قلبي. دلوقتي نقعد سوا.'], ['nemo', 'عندها حق، نسلّم الأول.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('gt_respect');
          if (M.family.on('gf')) { ctx.cast(EVERY.concat(['gf']), ALL4); await ctx.say('gf', 'الحمد لله إن العيلة كلها اتجمعت. نوّرتوا يا حبايبي!', { anim: 'wave' }); }
          await ctx.say('nana', 'وبابا و{uncle1}، ولادي الغاليين! وحشتوني قوي. وبناتي {aunt1n} و{aunt2n} حواليّا. ربنا يجمعنا دايمًا.', { anim: 'wave' });
          await ctx.say('toota', 'يعني {gm} هي أم بابا و{uncle1} و{aunt1} و{aunt2}!');
          await ctx.say('aboody', 'يعني بابا كان صغير زينا عند {gmt}؟');
          await ctx.say('nana', 'أيوه يا حبيبي. وكان شقي زيك كده!', { anim: 'cheer' });
          await ctx.say('aunt1', 'أهلًا يا حبايبي! أنا {aunt1}. ده {cz1} و{cz4} و{cz5}، ولاد عمتكم.', { anim: 'wave' });
          await ctx.say('aunt2', 'أهلًا.. استنوا لحظة.. أنا كنت بكتب رسالة.', { anim: 'phone' });
          await ctx.say('toota', '{aunt2}! حمد لله على السلامة!');
          await ctx.say('aunt2', 'آه صح! أهلًا يا حبايبي! وحشتوني أوي!', { anim: 'wave' });
          await ctx.say('cz2', 'أنا {cz2}! أنا بكبر!', { anim: 'cheer' });
          await ctx.say('narrator', 'سؤالين صغيرين عن العيلة!');
          m0 = mis(ctx);
          const q = await ctx.quiz.pair({ aboody: B('gt6_oldest'), moody: B('gt9_silat') });
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('nana', 'يلا يا حبايبي، الغدا هيجهز دلوقتي. {aunt1} عملت حاجات حلوة!');
          return ctx.nav.complete();
        }
      },

      /* ================= 2) سفرة الغدا ================= */
      {
        id: 'm2', title: 'سفرة الغدا', intro: '{aunt1} طبخت لـ١٥ نفر.. نحضّر السفرة بأدب!', values: ['gt_manners', 'bismillah', 'handwash', 'teamwork'], sticker: 'gather_table',
        heroes: ['moody', 'aboody', 'toota', 'nemo', 'aunt1', 'nana'], control: ALL4, wisdom: 'الأكل نعمة: نغسل إيدينا ونقول بسم الله وناخد شوية', diary: { pic: 'gather_table', text: 'حضّرنا سفرة لـ١٥ نفر ومسكنا إيدينا بالصابون وقلنا بسم الله وأكلنا بأدب' },
        async run(ctx) {
          const st = ctx.stage, seats = M.gatherArt.seats; let m0 = mis(ctx);
          const kids = [['toota', 110, 506], ['moody', 200, 502], ['aboody', 290, 510], ['nemo', 380, 508], ['nana', 520, 510], ['aunt1', 830, 500, -1]];
          await ctx.scene('gather_dining', { state: { table: 0, set: 0, food: 0 }, heroes: lay(kids) });
          await ctx.say('aunt1', 'أهلًا يا حبايبي! أنا طابخة النهاردة غدا كبير. بس محتاجة مساعدة في السفرة.', { anim: 'wave' });
          await ctx.say('toota', 'يلا ننظّم نفسنا: نعدّ الأول كام نفر جايين.');
          const q0 = await ctx.quiz.pair({ aboody: B('gt6_plates8'), moody: B('gt9_people15') });
          await ctx.say('nana', 'يعني ١٥ طبق. بس قبل أي حاجة، نعمل إيه يا {a}؟');
          await ctx.say('aboody', 'نغسل إيدينا بالصابون!');
          await ctx.games.scrub({
            prompt: 'اغسلوا إيديكم بالصابونة', dirt: 5, tool: 'soap', base(g, t) {
              [[300, 1], [660, -1]].forEach(hh => { const x = hh[0]; G.fillRR(g, x - 90, 200, 180, 190, 50, '#e4b58c', 5); [-66, -22, 22, 66].forEach((fx, i) => G.fillRR(g, x + fx - 17, 120 + (i === 1 || i === 2 ? -18 : 0), 34, 120, 17, '#e4b58c', 4.5)); G.fillRR(g, x + hh[1] * 98 - 17, 250, 34, 100, 17, '#e4b58c', 4.5); });
              G.text(g, 'اسحب الصابونة على الأماكن الوسخة', 480, 470, { size: 26, color: '#fff', stroke: M.OL, sw: 6 });
            }
          });
          ctx.value('handwash'); ctx.heroes(lay(kids));
          await ctx.say('aunt1', 'إيديكم نضيفة! دلوقتي نفرد المفرش ونحط الأطباق قدّام كل كرسي.');
          st.state.table = 1; ctx.sfx('pop');
          const one = function () { return this.n < 1; };
          const tb = await ctx.games.dragdrop({
            prompt: 'حطّوا طبق قدّام كل كرسي: ١٥ طبق', heroes: 'hidden', panel: { x: 60, y: 112, w: 840, h: 150 }, wrongHint: 'كل كرسي له طبق واحد بس',
            items: seats.map((p, i) => ({ id: 'pl' + i, art: 'plate', x: i < 8 ? 130 + i * 100 : 180 + (i - 8) * 100, y: i < 8 ? 154 : 220, s: 62 })),
            targets: seats.map((p, i) => ({ id: 'seat' + i, x: p[0], y: p[1], w: 84, h: 56, cols: 1, itemScale: .62, dy0: 4, accepts: one, draw: g => { G.ell(g, 0, 4, 40, 22, 'rgba(255,214,150,.8)', 3); } }))
          });
          if (tb.mistakes - m0 <= 2) ctx.reward.star(1);
          st.state.set = true; st.state.front = true; ctx.sfx('good');
          st.addLayer({ z: 1, draw: (g, t) => M.gatherArt.tableFront(g, t, st.state) });
          ctx.cast(EVERY, ALL4);
          const seated = [['nana', 70], ['baba', 130], ['uncle1', 192], ['cz3', 250], ['toota', 312], ['moody', 372], ['aboody', 430], ['nemo', 490], ['cz1', 552], ['cz4', 614], ['cz5', 676], ['aunt1', 738], ['aunt2', 800], ['cz2', 860]].map((a, i) => [a[0], a[1], 326 + (i % 2) * 6]);
          ctx.heroes(lay(seated)); setAnim(ctx, 'aunt2', 'stand');
          await ctx.say('nana', 'ما شاء الله! كلنا قاعدين. وده كرسي {gmt} في الصدر.');
          await ctx.say('aunt1', 'والأكل جاي أهو!');
          await M.tw(st.state, { food: 1 }, .8, 'inOut'); ctx.sfx('bell');
          await ctx.say('aunt1', 'عاملة النهاردة: شوربة عدس وأرز وفراخ ومحشي وملوخية وسلطة وعيش بلدي.', { anim: 'cheer' });
          await ctx.say('cz2', 'أنا جعانة! عايزة آكل دلوقتي!', { anim: 'scream' });
          m0 = mis(ctx);
          const c1 = await choiceQ(ctx, {
            prompt: 'الأكل قدّامنا والكل جعان. نعمل إيه؟', options: [
              { text: 'نبدأ ناكل على طول', art: 'gather_bigplate', good: false, consequence: [['nana', 'استنوا يا حبايبي. بنبدأ بسم الله، والكبير الأول.'], ['aboody', 'آسف.. هستنى.']] },
              { text: 'نستنى {gmt} والكبار يبدأوا', art: 'gather_hug', good: true, reply: [['nana', 'برافو عليكم! هو ده الأدب.'], ['baba', 'ربنا يبارك فيكم.']] },
              { text: 'نخطف أحسن حتة', art: 'gather_shout', good: false, consequence: [['toota', 'لأ! الأكل للكل، ونستنى دورنا.']] }]
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('gt_manners');
          await ctx.games.ritual({ text: 'بسم الله', sub: 'قبل الأكل', bottom: 120 }); ctx.value('bismillah');
          const c2 = await choiceQ(ctx, {
            prompt: 'ناخد كام من الأكل في طبقنا؟', options: [
              { text: 'كل الأكل في طبقنا مرة واحدة', art: 'gather_bigplate', good: false, consequence: [['toota', 'طبق كبير أوي! وهنسيب منه ونرميه. والأكل نعمة.'], ['moody', 'خلّينا ناخد شوية.']] },
              { text: 'شوية صغيرين ونطلب كمان', art: 'gather_smallplate', good: true, reply: [['aunt1', 'يا سلام! وأنا هزوّدكم لو عايزين.'], ['nana', 'كده مفيش أكل بيتبهدل.']] },
              { text: 'نرمي اللي مش بنحبه', art: 'gather_bin', good: false, consequence: [['nana', 'لأ يا حبيبي، الأكل نعمة. نقول: كفاية والحمد لله.']] }]
          });
          if (c2.firstTry) ctx.value('gt_manners');
          await ctx.say('aunt1', 'قولوا لي بقى، إيه الأكلات اللي عملتها؟ سؤالين من {aunt1}!');
          m0 = mis(ctx);
          const q = await ctx.quiz.pair({ aboody: B('gt6_rice'), moody: B('gt9_mahshi') });
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('baba', 'تسلم إيدك يا {aunt1n}! أحلى أكل في الدنيا.');
          await ctx.games.ritual({ text: 'الحمد لله', sub: 'بعد الأكل', bottom: 120 });
          await ctx.say('nana', 'الحمد لله. العيلة اللي بتاكل سوا بتحب بعض أكتر.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },

      /* ================= 3) {cz2} الشقية ================= */
      {
        id: 'm3', title: '{cz2} الشقية', intro: '{cz2} بتعيّط وبتزعّق! نهدّيها بلُطف ونلعب معاها.', values: ['gt_patience', 'kindness', 'gt_sharing'], sticker: 'gather_calm',
        heroes: ALL4.concat(['cz2', 'aunt2', 'cz3']), control: ALL4, wisdom: 'الصغير لما يعيّط محتاج حد يسمعه بحب', diary: { pic: 'gather_calm', text: 'هدّينا {cz2} بلُطف ولعبنا معاها استغماية وغنّينا لها' },
        async run(ctx) {
          const st = ctx.stage, base = [['moody', 110, 484], ['aboody', 190, 494], ['toota', 270, 488], ['nemo', 350, 492], ['cz2', 430, 494], ['cz3', 620, 498, -1], ['aunt2', 770, 454, -1]];
          let m0 = mis(ctx);
          await ctx.scene('gather_living', {}); only(ctx, ALL4.concat(['cz2', 'aunt2', 'cz3'])); ctx.heroes(lay(base));
          setAnim(ctx, 'cz2', 'scream');
          await ctx.say('cz2', 'مش عايزة! مش عايزة! عايزة دبدوبي!', { anim: 'scream' });
          await ctx.say('aboody', 'يا ساتر! صوتها عالي أوي!');
          await ctx.say('aunt2', 'استني يا {cz2} شوية.. بخلّص رسالة.', { anim: 'phone' });
          await ctx.say('toota', 'الصغيرين لما بيعيّطوا بيبقى عايزين حاجة ومش عارفين يقولوها. هنهدّيها بلُطف.');
          const c1 = await choiceQ(ctx, {
            prompt: '{cz2} بتعيّط. نعمل إيه؟', options: [
              { text: 'نزعق عليها: اسكتي!', art: 'gather_shout', good: false, consequence: [['cz2', 'واااه! أنا زعلانة!', { anim: 'scream' }], ['toota', 'الزعيق بيزوّد العياط. نجرّب بلُطف.']] },
              { text: 'نضحك ونقلّد عياطها', art: 'gather_charades', good: false, consequence: [['cz2', 'ما تضحكوش عليا! هي هي!', { anim: 'cry' }], ['moody', 'غلط مننا. الصغير ما نضحكش عليه.']] },
              { text: 'نقعد جنبها ونسألها عايزة إيه', art: 'gather_listen', good: true, reply: [['cz2', 'دبدوبي راح.. وكمان البالونة.. وكمان العصير.', { anim: 'cry' }], ['nemo', 'ماشي يا {cz2}! هنلاقيهم كلهم!']] }]
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('gt_patience');
          setAnim(ctx, 'cz2', 'cry');
          await ctx.say('toota', 'هنلاقي الدبدوب تحت الكنبة، والبالونة فوق، والعصير جنب الزرع. اللي صغير ينزل تحت، واللي طويل يوصل فوق!');
          ctx.tip('الدبدوب تحت الكنبة. {a} أو {n} صغيرين!', 'toota');
          let found = 0;
          const onF = txt => () => { found++; ctx.sfx('good'); st.bubble('cz2', txt, 2); if (found >= 2) setAnim(ctx, 'cz2', 'stand'); };
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على دبدوب {cz2} والبالونة والعصير', hintAfter: 14, spots: [
              { id: 'teddy', art: 'gather_teddy', x: 560, y: 413, s: 50, needs: 'small', walkOff: 0, listArt: 'gather_teddy', draw: faint('gather_teddy', 50), needsMsg: 'الدبدوب تحت الكنبة! محتاجين حد صغير', onFound: onF('دبدوبي!') },
              { id: 'balloon', art: 'gather_balloon:pink', x: 815, y: 205, s: 62, needs: 'tall', walkOff: 0, listArt: 'gather_balloon:pink', draw: faint('gather_balloon:pink', 62), needsMsg: 'البالونة عالية! محتاجين {m} الطويل', onFound: onF('بالونتي!') },
              { id: 'juice', art: 'gather_cup:orange', x: 218, y: 462, s: 50, walkOff: 0, listArt: 'gather_cup:orange', draw: faint('gather_cup:orange', 50), onFound: onF('عصيري!') }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          setAnim(ctx, 'cz2', 'idle'); ctx.heroes(lay(base)); setAnim(ctx, 'cz2', 'idle');
          await ctx.say('cz2', 'شكرًا! أنا بحبكم!', { anim: 'cheer' });
          await ctx.say('cz3', 'أنا {cz3}. وده عربيتي الحمرا.', { anim: 'wave' });
          await ctx.say('cz2', 'عايزة العربية بتاعتك! دي بتاعتي!', { anim: 'scream' });
          await ctx.say('cz3', 'لأ! دي بتاعتي!');
          m0 = mis(ctx);
          const c2 = await choiceQ(ctx, {
            prompt: '{cz2} و{cz3} الاتنين عايزين العربية. نعمل إيه؟', options: [
              { text: 'نخطف العربية ونديها ل{cz2}', art: 'gather_shout', good: false, consequence: [['cz3', 'واااه! عربيتي!', { anim: 'cry' }], ['toota', 'الخطف بيزعّل. نلاقي حل حلو.']] },
              { text: 'نخليهم يلعبوا بالدور', art: 'gather_share', good: true, reply: [['nemo', 'دور {cz3} الأول، وبعدين دور {cz2}!'], ['cz3', 'ماشي! هديها لك بعد شوية.'], ['cz2', 'ماشي!']] },
              { text: 'نقول ل{cz2} إنها شقية ونسيبها', art: 'sad', good: false, consequence: [['nemo', 'مش حلو نقول كده. الصغيرين لسه بيتعلّموا.']] }]
          });
          if (c2.firstTry) ctx.reward.star(1); ctx.value('gt_sharing');
          await ctx.say('nemo', 'يلا نلعب استغماية! أنا هغمّض وأعدّ للعشرة وانتم استخبّوا.', { anim: 'cheer' });
          await ctx.say('cz2', 'هيه! أنا هستخبّى!', { anim: 'cheer' });
          only(ctx, ALL4);
          ctx.heroes(lay([['moody', 110, 484], ['aboody', 190, 494], ['toota', 270, 488], ['nemo', 350, 492]]));
          ctx.fx.float('واحد.. اتنين.. تلاتة..', 480, 300);
          const hideDraw = (id, cover, covS) => (g, t, s2, sp) => { g.save(); if (sp.found) { M.chars.draw(g, id, 0, 40, { anim: 'cheer', t, sc: 1 }); } else { M.chars.draw(g, id, 0, 40, { anim: 'idle', t, sc: 1 }); A.draw(g, cover, 0, 22, covS); pulse(46)(g, t, s2, sp); } g.restore(); };
          const hs = await ctx.games.hidden({
            prompt: 'دوّروا على {cz2} و{cz3} المستخبّيين', hintAfter: 12, spots: [
              { id: 'cz2', x: 880, y: 405, s: 100, hit: 66, keep: true, needs: 'small', walkOff: -70, listArt: 'face:cz2', draw: hideDraw('cz2', 'plant', 120), needsMsg: '{cz2} صغيرة ومستخبّية! {a} أو {n} يلاقوها' },
              { id: 'cz3', x: 232, y: 442, s: 90, hit: 60, keep: true, needs: 'finder', walkOff: 70, listArt: 'face:cz3', draw: hideDraw('cz3', 'box', 100), needsMsg: '{n} شاطرة في اللقاطة!', onFound: async () => { await ctx.say('cz3', 'لقيتوني! هههه', { anim: 'cheer' }); } }]
          });
          if (hs.wrong <= 2) ctx.reward.star(1);
          only(ctx, ALL4.concat(['cz2', 'cz3', 'aunt2'])); ctx.heroes(lay(base)); setAnim(ctx, 'cz2', 'idle');
          await ctx.say('cz2', 'تاني تاني! أنا بحب الاستغماية!', { anim: 'cheer' });
          await ctx.say('nemo', 'دلوقتي نغنّي ل{cz2} أغنية حلوة. اسمعوا اللحن وكرّروه!');
          const sg = await ctx.games.gtSimon({ prompt: 'اسمعوا اللحن وكرّروه', again: 'دوركم! كرّروا اللحن', who: 'nemo', rounds: [[0, 1, 2], [2, 1, 0, 3]] });
          if (sg.misses <= 1 && mis(ctx) - m0 <= 4) ctx.reward.star(1);
          st.playBoth('cheer', 1.4);
          await ctx.say('cz2', 'ياي! أنا بحب الأغنية دي!', { anim: 'cheer' });
          await ctx.say('aunt2', 'ما شاء الله! {cz2} هديت خالص! أنا مكنتش واخدة بالي وانا في الموبايل..', { anim: 'phone' });
          await ctx.say('aboody', '{aunt2} دايمًا على الموبايل!');
          await ctx.say('toota', 'خلّينا نعزمها بلُطف تلعب معانا. المرة الجاية.');
          return ctx.nav.complete();
        }
      },

      /* ================= 4) وقت العيلة بدون موبايل ================= */
      {
        id: 'm4', title: 'وقت العيلة بدون موبايل', intro: '{aunt2} والموبايل صحاب! نعزمها بلُطف للعبة العيلة.', values: ['gt_balance', 'kindness', 'gt_family'], sticker: 'gather_nophone',
        heroes: ALL4.concat(['aunt2', 'cz2', 'cz4', 'cz5', 'cz3']), control: ALL4, wisdom: 'الموبايل بيقرّب البعيد، بس اللي قدّامك أحلى', diary: { pic: 'gather_phonebasket', text: 'عزمنا {aunt2} و{cz4} وكلنا لوقت من غير موبايل ولعبنا سوا' },
        async run(ctx) {
          const st = ctx.stage, base = [['moody', 100, 486], ['aboody', 185, 496], ['toota', 270, 490], ['nemo', 355, 494], ['cz3', 470, 500], ['cz2', 620, 498, -1], ['aunt2', 705, 454, -1], ['cz4', 800, 466, -1], ['cz5', 880, 454, -1]];
          let m0 = mis(ctx);
          await ctx.scene('gather_living', {}); only(ctx, ALL4.concat(['aunt2', 'cz2', 'cz4', 'cz5', 'cz3'])); ctx.heroes(lay(base));
          setAnim(ctx, 'cz2', 'cry');
          await ctx.say('cz2', 'ماما! ماما! العبي معايا!', { anim: 'cry' });
          await ctx.say('aunt2', 'لحظة يا {cz2}.. آخر رسالة..', { anim: 'phone' });
          await ctx.say('cz4', 'أنا سامع الأغنية في السماعة.. مش سامع حد.', { anim: 'talk' });
          await ctx.say('cz5', 'وأنا بذاكر.. بس هساعد الصغيرين لو احتاجوا.');
          await ctx.say('toota', 'هنعزم الكل للعب بدون موبايلات. بس بلُطف، من غير ما نزعّل حد.');
          const ch = await choiceQ(ctx, {
            prompt: '{aunt2} مشغولة بالموبايل. نعمل إيه؟', options: [
              { text: 'ناخد الموبايل منها بالعافية', art: 'gather_phone:tilt', good: false, consequence: [['aunt2', 'لأ يا ولاد! ما تخطفوش الحاجات!'], ['toota', 'غلط. الدعوة اللطيفة أحسن.']] },
              { text: 'نقعد زعلانين ونسكت', art: 'sad', good: false, consequence: [['nemo', 'لو سكتنا مش هتعرف إننا عايزينها.']] },
              { text: 'نبتسم ونعزمها للعبة العيلة', art: 'gather_hug', good: true, reply: [['aboody', '{aunt2}! تعالي العبي معانا!'], ['aunt2', 'بجد؟ ده أنا اتأخرت عليكم! طيب حاضر.', { anim: 'wave' }]] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('kindness');
          setAnim(ctx, 'aunt2', 'stand');
          await ctx.say('toota', 'عندي فكرة: صندوق الموبايلات! كلنا نحط موبايلاتنا وسماعاتنا فيه، حتى إحنا.');
          only(ctx, ['moody', 'aboody', 'toota', 'nemo', 'aunt2', 'cz4']);
          const bk = await ctx.games.dragdrop({
            prompt: 'حطّوا الموبايلات والسماعات في الصندوق', panel: { x: 150, y: 112, w: 660, h: 120 }, wrongHint: 'حطّها في الصندوق', items: [
              { id: 'p1', art: 'gather_phone', to: 'box', x: 250, y: 172, s: 70 }, { id: 'h1', art: 'gather_headphones', to: 'box', x: 365, y: 172, s: 70 },
              { id: 'p2', art: 'gather_phone:tilt', to: 'box', x: 480, y: 172, s: 70 }, { id: 'h2', art: 'gather_headphones', to: 'box', x: 595, y: 172, s: 70 }, { id: 'h3', art: 'gather_headphones', to: 'box', x: 710, y: 172, s: 70 }],
            targets: [{ id: 'box', x: 480, y: 372, w: 300, h: 150, cols: 5, dx: 46, dy0: -6, itemScale: .5, draw: g => { A.draw(g, 'gather_basket', 0, 6, 190); } }]
          });
          if (bk.mistakes - m0 <= 1) ctx.reward.star(1);
          only(ctx, ALL4.concat(['aunt2', 'cz2', 'cz4', 'cz5', 'cz3'])); ctx.heroes(lay(base)); setAnim(ctx, 'aunt2', 'stand'); setAnim(ctx, 'cz2', 'idle');
          ctx.fx.burst(480, 330, { kind: 'heart', n: 12 });
          await ctx.say('cz4', 'حتى السماعات؟ طيب.. حاضر. الحقيقة هسمع صوتكم أحسن.', { anim: 'cheer' });
          await ctx.say('aunt2', 'وأنا كمان! نص ساعة من غير موبايل يخلّيني أشوف {cz2} وهي بتلعب!');
          await ctx.say('cz5', 'أنا هلعب مع {cz3} و{cz2}. يلا يا صغيرين!', { anim: 'cheer' });
          ctx.value('gt_balance');
          await ctx.say('nemo', 'لعبتنا الأولى: لعبة الوشوش. اقلبوا الكروت وطابقوا!');
          only(ctx, ['moody', 'aboody', 'toota', 'nemo', 'aunt2', 'cz4']);
          m0 = mis(ctx);
          const mm = await ctx.games.memory({ prompt: 'طابقوا الوشوش', pairs: ['face:nana', 'face:baba', 'face:aunt2', 'face:cz4', 'face:cz2'], cols: 5 });
          if (mm.moves <= 9) ctx.reward.star(1);
          only(ctx, ALL4.concat(['aunt2', 'cz2', 'cz4', 'cz5', 'cz3'])); ctx.heroes(lay(base)); setAnim(ctx, 'aunt2', 'stand');
          await ctx.say('cz4', 'لعبة التمثيل! أنا هبدأ.. شوفوا بعمل إيه.', { anim: 'cheer' });
          setAnim(ctx, 'cz4', 'sleep');
          const r1 = await choiceQ(ctx, {
            prompt: '{cz4} بيمثّل بالحركة.. بيعمل إيه؟', options: [
              { text: 'بيجري', art: 'ball', good: false, consequence: [['cz4', 'لأ! جرّب تاني.']] },
              { text: 'بينام', art: 'bed', good: true, reply: [['cz4', 'برافو! عرفتوني.']] },
              { text: 'بيأكل', art: 'gather_dish:rice', good: false, consequence: [['cz4', 'ههه لأ.']] }]
          });
          setAnim(ctx, 'cz4', 'stand'); setAnim(ctx, 'cz5', 'think');
          const r2 = await choiceQ(ctx, {
            prompt: 'دلوقتي {cz5} بيمثّل.. بيعمل إيه؟', options: [
              { text: 'بيرقص', art: 'gather_note', good: false, consequence: [['cz5', 'لأ، بفكّر.']] },
              { text: 'بيفكّر', art: 'question', good: true, reply: [['cz5', 'بالظبط! بفكّر في اللعبة الجاية.']] },
              { text: 'بيسبح', art: 'water', good: false, consequence: [['cz5', 'ههه لأ.']] }]
          });
          setAnim(ctx, 'cz5', 'stand');
          if (r1.firstTry && r2.firstTry) ctx.reward.star(1);
          await ctx.say('cz2', 'ماما! دي أحلى لعبة!', { anim: 'cheer' });
          await ctx.say('aunt2', 'ما شاء الله! الوقت مع العيلة أحلى من أي موبايل. أنا مبسوطة أوي!', { anim: 'cheer' });
          await ctx.say('narrator', 'سؤالين عن الموبايل والتوازن!');
          const q = await ctx.quiz.pair({ aboody: B('gt6_phone'), moody: B('gt9_balance') });
          await ctx.say('aunt2', 'وعد: من النهاردة هقفل الموبايل وقت العيلة.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },

      /* ================= 5) مسابقة العيلة ================= */
      {
        id: 'm5', title: 'مسابقة العيلة', intro: 'ثلاث فرق: الصغيرين والشباب والكبار! مين الفايز؟', values: ['gt_family', 'teamwork', 'gt_respect'], sticker: 'gather_quiz',
        heroes: EVERY, control: ALL4, wisdom: 'العيلة اللي بتتعلم سوا بتكسب سوا', diary: { pic: 'gather_trophy', text: 'لعبنا مسابقة العيلة: الصغيرين والشباب والكبار، وسمعنا حكايات بابا و{uncle1} من السفر' },
        async run(ctx) {
          const st = ctx.stage, SC = { kids: 0, teens: 0, adults: 0 }, TX = { kids: 215, teens: 550, adults: 815 };
          let m0 = mis(ctx);
          const team = [['moody', 90, 486], ['aboody', 165, 496], ['cz1', 235, 484], ['cz3', 295, 498], ['cz2', 350, 490], ['toota', 440, 480], ['nemo', 510, 490], ['cz4', 585, 478], ['cz5', 660, 484], ['baba', 735, 470, -1], ['uncle1', 810, 476, -1], ['aunt1', 880, 462, -1], ['nana', 480, 430], ['aunt2', 880, 438, -1]];
          await ctx.scene('gather_living', { state: { hearts: true }, heroes: lay(team) });
          setAnim(ctx, 'aunt2', 'stand');
          ctx.stage.addLayer({
            z: 5, draw(g, t) {
              [['kids', 'الصغيرين', '#ff9a3c'], ['teens', 'الشباب', '#4aa8e8'], ['adults', 'الكبار', '#8a6bd6']].forEach(tm => {
                const x = TX[tm[0]], n = SC[tm[0]]; g.save(); g.translate(x, 140); G.fillRR(g, -92, -26, 184, 52, 16, tm[2], 4.5); G.text(g, tm[1], 0, -9, { size: 22, color: '#fff', stroke: M.OL, sw: 4 });
                for (let i = 0; i < 4; i++) G.star(g, 54 - i * 36 + 0, 12, 10, i < n ? '#ffe14d' : 'rgba(255,255,255,.45)', 2);
                g.restore();
              });
            }
          });
          await ctx.say('nana', 'أهلًا بيكم في مسابقة العيلة الكبيرة! ٣ فرق: الصغيرين والشباب والكبار. وأنا الحكم!', { anim: 'cheer' });
          await ctx.say('uncle1', 'وبين الجولات هقول لكم حكايات من السفر!');
          await ctx.say('baba', 'بس الأول، تسخين: كل ولد يروح لأمه أو لأبوه.');
          const nm = { aunt1: '{aunt1}', aunt2: '{aunt2}', uncle1: '{uncle1}' };
          const tr = await ctx.games.dragdrop({
            prompt: 'مين ابن مين؟ وصّلوا كل واحد لأمه أو لأبوه', heroes: 'hidden', panel: { x: 90, y: 112, w: 780, h: 112 }, wrongHint: 'فكّروا: مين أمه أو أبوه؟',
            items: sh([['cz1', 'aunt1'], ['cz4', 'aunt1'], ['cz5', 'aunt1'], ['cz2', 'aunt2'], ['cz3', 'uncle1']]).map((a, i) => ({ id: 'k_' + a[0], art: 'face:' + a[0], to: a[1], x: 190 + i * 145, y: 170, s: 76 })),
            targets: ['aunt1', 'aunt2', 'uncle1'].map((id, i) => ({ id, x: 200 + i * 280, y: 385, w: 240, h: 160, cols: 3, dx: 64, dy0: 34, itemScale: .62, draw: g => { G.fillRR(g, -120, -80, 240, 160, 22, 'rgba(255,247,227,.94)', 4.5); A.draw(g, 'face:' + id, 0, -38, 62); G.text(g, nm[id], 0, 0, { size: 24, color: '#c25a00' }); } }))
          });
          if (tr.mistakes - m0 <= 1) ctx.reward.star(1);
          ctx.heroes(lay(team)); setAnim(ctx, 'aunt2', 'stand');
          /* one contest question for a team: 2 points on the first try, 1 point later; returns the number of misses */
          const ask = async (key, who, tier) => {
            const r = (await ctx.quiz.fromBank({ n: 1, tag: 'gt_quiz', tier, who })).results[0], p = r.tries === 1 ? 2 : (r.correct ? 1 : 0);
            SC[key] = Math.min(4, SC[key] + p); if (p) { ctx.fx.float('+' + U.ar(p), TX[key], 205); ctx.fx.burst(TX[key], 190, { kind: 'star', n: 8 }); } return r.tries - 1;
          };
          await ctx.say('nana', 'الجولة الأولى: الصغيرين! {m} و{a} و{cz1} و{cz3} و{cz2}.', { anim: 'wave' });
          const kidsMiss = (await ask('kids', 'aboody', 6)) + (await ask('kids', 'moody', 9));
          if (kidsMiss <= 1) ctx.reward.star(1);
          const s1 = storyFrame(ctx, 'gather_story_cable', 500);
          await ctx.say('uncle1', 'حكاية من السفر! أول مرة ركبت التلفريك بصّيت تحت وقلت: الشجر شبه البروكلي!', { anim: 'cheer' });
          await ctx.say('baba', 'وبعدين فتح الشباك وقال للسحابة: صباح الخير! هههه');
          s1();
          await ctx.say('nana', 'الجولة التانية: الشباب! {t} و{n} و{cz4} و{cz5}.', { anim: 'wave' });
          const teensMiss = (await ask('teens', 'toota', 9)) + (await ask('teens', 'nemo', 9));
          if (teensMiss <= 1) ctx.reward.star(1);
          const s2 = storyFrame(ctx, 'gather_story_mist', 500);
          await ctx.say('baba', 'مرة الضباب نزل فجأة وأنا ماشي في الجبل. سلّمت على شجرة وقلت لها: إزيك يا عمو!', { anim: 'cheer' });
          await ctx.say('uncle1', 'والشجرة ما ردتش! ههههه');
          s2();
          await ctx.say('nana', 'والجولة الأخيرة: الكبار! بابا و{uncle1} و{aunt1} و{aunt2}.', { anim: 'wave' });
          const adultsMiss = (await ask('adults', 'baba', 9)) + (await ask('adults', 'baba', 9));
          const s3 = storyFrame(ctx, 'gather_story_tower', 500);
          await ctx.say('uncle1', 'في البلاد اللي سافرت لها بيوت من الحجر بشبابيك بيضا زي الكحل في العين. جميلة أوي!');
          s3();
          await ctx.say('nana', 'خلصت المسابقة! النتيجة: كلنا فايزين، لأن العيلة اللي بتتعلم سوا بتكسب سوا!', { anim: 'cheer' });
          ctx.fx.confetti(); ctx.sfx('fanfare'); st.playBoth('cheer', 1.6);
          if (adultsMiss <= 1 && kidsMiss + teensMiss <= 2) ctx.reward.star(1);
          await ctx.say('baba', 'برافو علينا كلنا! والصغيرين كانوا نجوم.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },

      /* ================= 6) صورة العيلة ================= */
      {
        id: 'm6', title: 'صورة العيلة', intro: 'نقف كلنا في صورة واحدة.. الصغير قدّام والطويل ورا!', values: ['gt_family', 'gt_patience', 'thanks'], sticker: 'gather_family',
        heroes: EVERY, control: ALL4, wisdom: 'العيلة نعمة.. ربنا يجمعنا على الخير دايمًا', diary: { pic: 'gather_family', text: 'اتصوّرنا كلنا صورة العيلة، و{gmt} دعت لنا، وقلنا آمين' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          const crowd = [['moody', 90, 488], ['aboody', 170, 498], ['toota', 250, 490], ['nemo', 330, 496], ['baba', 140, 436], ['uncle1', 230, 442], ['nana', 400, 450], ['aunt1', 520, 446, -1], ['aunt2', 610, 456, -1], ['cz2', 470, 498], ['cz3', 560, 502, -1], ['cz1', 690, 492, -1], ['cz5', 780, 450, -1], ['cz4', 870, 462, -1]];
          await ctx.scene('gather_living', { state: { photo: true }, heroes: lay(crowd) });
          setAnim(ctx, 'aunt2', 'stand');
          st.addLayer({ z: 8, draw(g, t) { g.save(); A.draw(g, 'mama', 58, 360, 74); A.draw(g, 'gather_camera', 112, 372, 52); g.restore(); } });
          await ctx.say('mama', 'يلا يا جماعة! تعالوا نتصوّر صورة العيلة كلها. أنا هصوّر!');
          await ctx.say('baba', 'فكرة حلوة! أول مرة العيلة كلها في صورة واحدة من زمان.');
          await ctx.say('toota', 'وفاكرين؟ الصغير قدّام والطويل ورا عشان الكل يبان.');
          const RULE = { back: ['cz4', 'toota', 'uncle1', 'cz5', 'baba'], mid: ['aunt1', 'cz1', 'aunt2', 'moody', 'nemo'], front: ['cz3', 'cz2', 'aboody', 'nana'] };
          const row = (id, y, label, cols) => ({ id, x: 480, y, w: 560, h: 66, cols, dx: 78, dy0: -6, itemScale: .66, accepts: it => RULE[id].indexOf(it.id) >= 0, draw: g => { G.fillRR(g, -280, -33, 560, 66, 20, 'rgba(255,247,227,.85)', 3.5); G.text(g, label, 238, -20, { size: 20, color: '#c25a00' }); } });
          const ph = await ctx.games.dragdrop({
            prompt: 'رتّبوا الصورة: الطوال ورا والصغيرين قدّام', heroes: 'hidden', panel: { x: 28, y: 110, w: 904, h: 118 }, wrongHint: 'الطويل ورا والصغير قدّام، عشان الكل يبان',
            items: sh(EVERY.slice()).map((id, i) => ({ id, art: 'gather_body:' + id, x: 62 + i * 62.5, y: 172, s: 92 })),
            targets: [row('back', 300, 'ورا', 5), row('mid', 372, 'في النص', 5), row('front', 444, 'قدّام', 4)]
          });
          if (ph.mistakes - m0 <= 2) ctx.reward.star(1);
          const photo = lay([['cz4', 250, 392], ['uncle1', 365, 392], ['baba', 480, 392], ['cz5', 595, 392], ['toota', 710, 392], ['aunt1', 300, 440], ['cz1', 390, 440], ['aunt2', 480, 440], ['moody', 570, 440], ['nemo', 660, 440], ['cz3', 385, 490], ['nana', 480, 492], ['cz2', 575, 490], ['aboody', 670, 494]]);
          ctx.heroes(photo); setAnim(ctx, 'aunt2', 'stand'); ctx.sfx('good'); ctx.fx.burst(480, 300, { kind: 'star', n: 16 });
          await ctx.say('mama', 'ما شاء الله! كلكم ظبطين. بس فين {cz2}؟');
          setAnim(ctx, 'cz2', 'scream'); st.heroes.cz2.x = 700; st.heroes.cz2.y = 500;
          await ctx.say('cz2', 'مش عايزة صورة! عايزة ألعب!', { anim: 'scream' });
          m0 = mis(ctx);
          const c1 = await choiceQ(ctx, {
            prompt: '{cz2} بتجري ومش عايزة تقف في الصورة. نعمل إيه؟', options: [
              { text: 'نزعق عليها تيجي', art: 'gather_shout', good: false, consequence: [['cz2', 'واااه!', { anim: 'cry' }], ['nemo', 'الزعيق بيخوّفها. نجرّب بلُطف.']] },
              { text: 'نكمّل الصورة من غير {cz2}', art: 'sad', good: false, consequence: [['baba', 'العيلة ناقصة من غير {cz2}. ننادي عليها بحب.']] },
              { text: 'ننادي عليها بحب ونقول لها نلعب لعبة الصورة', art: 'gather_listen', good: true, reply: [['nemo', 'تعالي يا {cz2}! نلعب لعبة الصورة: الكل يبتسم!'], ['cz2', 'ماشي! أنا هبتسم أكبر ابتسامة!', { anim: 'cheer' }]] }]
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('gt_patience');
          setAnim(ctx, 'cz2', 'idle'); ctx.heroes(photo); setAnim(ctx, 'aunt2', 'stand'); setAnim(ctx, 'cz2', 'idle');
          await ctx.say('mama', 'واحد.. اتنين.. تلاتة.. قولوا كلكم: عيلة!');
          await ctx.games.ritual({ text: 'عيلة!', sub: 'كلنا نبتسم', bottom: 100 });
          ctx.sfx('bell'); st.flash('#ffffff', .95); st.playBoth('cheer', 1.6);
          const fr = st.addLayer({ z: 60, draw(g, t) { g.save(); g.strokeStyle = '#fffdf4'; g.lineWidth = 36; g.strokeRect(0, 0, 960, 540); g.lineWidth = 6; g.strokeStyle = M.OL; g.strokeRect(18, 18, 924, 504); G.text(g, 'صورة العيلة', 480, 512, { size: 30, color: '#c25a00' }); g.restore(); } });
          await ctx.wait(2.2); fr();
          await ctx.say('nana', 'يا رب احفظ العيلة دي وبارك فيها، واجمعنا دايمًا على الخير والمحبة.', { anim: 'wave' });
          await ctx.games.ritual({ text: 'آمين', sub: 'ندعي مع {gmt}', bottom: 120 });
          await ctx.say('nana', 'ربنا يخليكم ليا يا حبايبي. العيلة نعمة كبيرة.');
          ctx.value('thanks');
          m0 = mis(ctx);
          const q = await ctx.quiz.fromBank({ n: 2, tag: 'gathering', who: ctx.active });
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          ctx.fx.confetti(); ctx.sfx('fanfare'); st.playBoth('cheer', 2.4); st.state.hearts = true;
          await ctx.say('baba', 'يوم عمري! العيلة كلها مع بعض، الحمد لله.', { anim: 'cheer' });
          await ctx.say('uncle1', 'ولسه لسه في هدايا من السفر! بس بعد الغدا.', { anim: 'cheer' });
          await ctx.say('nemo', 'تجمّع العيلة أحلى حاجة!', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
