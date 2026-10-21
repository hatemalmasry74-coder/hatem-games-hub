/* Family Adventures - worlds/park.js : WORLD 5 "الحديقة والنادي" (5 missions).
   Needs (loaded before): content/q_park.js, worlds/park_kits.js, worlds/park_art.js. Tokens {m} {a} {me} = names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, PK = M.pk;
  /* pulsing ring that disappears once the spot is found */
  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const sh = U.shuffle;

  M.registerValue('patience', { label: 'الصبر وانتظار الدور', desc: 'نستنى دورنا على الأرجوحة' });
  M.registerValue('helpsmall', { label: 'مساعدة الأصغر', desc: 'نساعد طفل أصغر مننا' });
  M.registerValue('fairplay', { label: 'اللعب النضيف', desc: 'نلعب بالقواعد ونقبل الخسارة بابتسامة' });
  M.registerValue('nature', { label: 'حب الطبيعة والنباتات', desc: 'نزرع ونسقي ونحافظ على الورد' });
  M.registerValue('animalcare', { label: 'الرفق بالحيوان', desc: 'منأكلش الحيوانات ولا نزعجهم' });
  M.registerValue('sunsafe', { label: 'الأمان من الشمس', desc: 'قبعة وماية وكريم الشمس' });
  M.registerValue('clean', { label: 'نضافة الأماكن العامة', desc: 'نرمي الزبالة في مكانها' });
  M.registerValue('respect', { label: 'احترام الآخرين', desc: 'نسلّم على الفريق التاني' });

  M.registerWorld({
    id: 'park', order: 5, title: 'الحديقة والنادي', icon: 'w_park', theme: { c1: '#b8f0b0', c2: '#5cc96b' }, finalSticker: 's_park',
    stickers: [
      { id: 's_swing', title: 'صبور وشاطر', art: 'pk_swing', bg: '#d9f6d0' }, { id: 's_fair', title: 'لاعب نضيف', art: 'pk_trophy', bg: '#fff3c4', rot: .08 },
      { id: 's_plant', title: 'صديق النباتات', art: 'pk_potplant:4', bg: '#e2f8d6' }, { id: 's_zoo', title: 'صديق الحيوان', art: 'pk_kitten', bg: '#ffe9c8', rot: -.1 },
      { id: 's_seek', title: 'بطل الاستغماية', art: 'pk_hat', bg: '#d9f0ff' }, { id: 's_park', title: 'أبطال الحديقة', art: 'w_park', bg: '#d9f6d0', rot: -.05 }
    ],
    missions: [
      /* ============ 1) الأرجوحة والدور ============ */
      {
        id: 'm1', title: 'الأرجوحة والدور', intro: 'الحديقة زحمة.. والكل عايز يلعب!', values: ['patience', 'helpsmall', 'teamwork'], sticker: 's_swing',
        wisdom: 'اللي يستنى دوره.. كل الناس بتحبه', diary: { pic: 'pk_swing', text: 'استنينا دورنا على الأرجوحة وساعدنا ملك' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('pkPark', { state: { kind: 'swings' }, heroes: { moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 420, y: 494, dir: 1 } } });
          st.setActive('aboody', true);
          await ctx.say('aboody', 'الله! الأرجوحة! أنا هركب أول واحد!');
          await ctx.say('moody', 'استنى يا {a}.. بُص، في ولاد قبلنا واقفين مستنيين دورهم.');
          const c1 = await ctx.games.choice({
            prompt: 'في طابور على الأرجوحة. نعمل إيه؟', options: sh([
              { text: 'نجري ونطلع قبلهم', art: 'sad', good: false, consequence: [['cz1', 'يا جماعة! أنا مستنّي من بدري!'], ['moody', 'عندك حق يا {fr}.. آسفين. هنقف في الطابور.']] },
              { text: 'نقف في الطابور ونستنى دورنا', art: 'smile', good: true, reply: [['cz1', 'برافو عليكم! الدور بيمشي بسرعة.']] },
              { text: 'نزعل ونمشي', art: 'pk_swing', good: false, consequence: [['aboody', 'بس أنا لسه عايز أركب...'], ['moody', 'لو استنينا شوية هيجي دورنا يا {a}.']] }])
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('patience');
          await ctx.say('cz1', 'كل واحد ياخد ٥ دفعات وبعدين نبدّل. ممكن تزقّني ٥ مرات يا {a}؟');
          st.state.noSwing = true;
          await ctx.games.pkSwing({ pusher: 'aboody', goal: 5, kid: 'pk_kid:orange', prompt: 'زقّ الأرجوحة ٥ مرات وعدّ معانا' });
          st.state.noSwing = false; st.layout({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 420, y: 494, dir: 1 } });
          await ctx.say('cz1', 'شكرًا يا {a}! ٥ دفعات بالظبط. دورك!');
          await ctx.say('narrator', 'وإحنا مستنيين.. سؤال سريع لكل واحد فيكم!');
          const q = await PK.pair(ctx, { cat: ['counting', 'math'], tag: 'park' });
          if (q.firstTry >= 1) ctx.reward.star(1);
          await ctx.say('moody', 'دلوقتي {a} هيركب وأنا هزقّه ٨ مرات.');
          st.state.noSwing = true;
          await ctx.games.pkSwing({ pusher: 'moody', goal: 8, kid: 'pk_kid:navy:d', prompt: '{m} بيزق {a}.. عدّوا ٨ دفعات' });
          st.state.noSwing = false; st.layout({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 420, y: 494, dir: 1 } });
          await ctx.say('aboody', 'أنا بطير! بطير!', { anim: 'cheer' });
          /* a smaller child needs help */
          st.state.smallKid = { x: 560, y: 446 }; st.state.balloonStuck = true; st.state.noQueue = true;
          await ctx.say('pk_kid:pink:l:g', 'بالونتي طارت وعلقت في الشجرة.. وجزمتي وقعت تحت الدكّة!', { name: 'ملك' });
          await ctx.say('moody', 'متخافيش يا ملك. أنا طويل وهجيب البلونة، و{a} صغير وهيجيب جزمتك من تحت الدكّة.');
          ctx.value('helpsmall');
          const f = await ctx.games.hidden({
            prompt: '{m} يجيب البلونة من فوق و{a} يجيب الجزمة من تحت الدكّة', hintAfter: 12, spots: [
              { id: 'balloon', x: 290, y: 176, s: 70, hit: 60, needs: 'moody', keep: true, listArt: 'pk_balloon:red', walkOff: 0, draw: pulse(46), needsMsg: 'البلونة عالية! محتاجين {m} الطويل', onFound: () => { st.state.balloonStuck = false; st.state.smallKid.balloon = true; ctx.sfx('pop'); } },
              { id: 'shoe', x: 150, y: 440, s: 56, hit: 56, needs: 'aboody', keep: true, listArt: 'shoe', walkOff: 0, draw: (g, t, s0, s) => { if (s.found) return; g.save(); g.globalAlpha = .6; A.draw(g, 'shoe', 0, 0, 52); g.restore(); G.sparkle(g, 16, -16, 7 + Math.sin(t * 6) * 2, '#fff', .9); }, needsMsg: 'الجزمة في مكان ضيّق! محتاجين {a} الصغير', onFound: () => { ctx.sfx('pop'); } }]
          });
          if (f.wrong <= 2) ctx.reward.star(1);
          await ctx.say('pk_kid:pink:l:g', 'شكرًا أوي! انتوا أحلى إخوات!', { name: 'ملك' });
          await ctx.say('moody', 'كل واحد ساعد بحاجة بيعرف يعملها. ده التعاون!');
          return ctx.nav.complete();
        }
      },
      /* ============ 2) كورة عادلة ============ */
      {
        id: 'm2', title: 'كورة عادلة', intro: 'ماتش كورة في النادي.. والأهم نلعب نضيف!', values: ['fairplay', 'respect', 'teamwork'], sticker: 's_fair',
        wisdom: 'الفوز بالنضافة أحلى من الفوز بالغش', diary: { pic: 'pk_trophy', text: 'لعبنا كورة نضيفة وسلّمنا على الفريق التاني' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('pkPark', { state: { kind: 'pitch' }, heroes: { moody: { x: 400, y: 484, dir: 1 }, aboody: { x: 500, y: 494, dir: -1 } } });
          await ctx.say('cz1', 'يلا نلعب ماتش! بس محتاجين نقسم الفريقين بالعدل.');
          const small = M.tierFor(ctx.active) === 6, cols = ['red', 'blue', 'green', 'yellow', 'purple:l:g', 'teal'], n = small ? 4 : 6, cap = n / 2; st.state.noGoal = true;
          const items = []; for (let i = 0; i < n; i++) items.push({ id: 'p' + i, art: 'pk_kid:' + cols[i], to: 'any', x: 480 + (i - (n - 1) / 2) * (n === 4 ? 120 : 84), y: 210, s: 84 });
          const accepts = function () { return this.n < cap; };
          const tg = await ctx.games.dragdrop({
            prompt: 'قسّموا اللاعبين فريقين متساويين: ' + U.ar(cap) + ' و' + U.ar(cap), heroes: 'corner', panel: { x: 190, y: 150, w: 580, h: 120 }, wrongHint: 'الفريق ده كامل! الفريق التاني محتاج لاعبين', items,
            targets: [{ id: 'ta', x: 300, y: 360, w: 230, h: 100, label: 'الفريق الأحمر', cols: cap, dx: 66, itemScale: .8, accepts, draw: (g, t) => G.fillRR(g, -115, -50, 230, 100, 22, 'rgba(239,83,80,.4)', 4) },
              { id: 'tb', x: 660, y: 360, w: 230, h: 100, label: 'الفريق الأزرق', cols: cap, dx: 66, itemScale: .8, accepts, draw: (g, t) => G.fillRR(g, -115, -50, 230, 100, 22, 'rgba(74,141,255,.4)', 4) }]
          });
          if (tg.mistakes <= 2) ctx.reward.star(1);
          ctx.heroes('floor'); st.state.noGoal = false; st.layout({ moody: { x: 400, y: 484, dir: 1 }, aboody: { x: 500, y: 494, dir: -1 } });
          await ctx.say('moody', 'كده الفريقين متساويين: ' + U.ar(cap) + ' و' + U.ar(cap) + '. ده العدل.');
          await ctx.say('narrator', 'قبل الماتش، تحدّي حساب لكل واحد!');
          await PK.pair(ctx, { cat: ['logic', 'math'], tag: 'park' });
          await ctx.say('cz1', 'نسخّن شوية! سجّل ٣ أهداف في المرمى.');
          st.state.noGoal = true;
          await ctx.games.pkKick({ goal: 3, prompt: 'اضرب الكورة في المرمى: ٣ أهداف' });
          st.state.noGoal = false; ctx.reward.star(1);
          await ctx.say('narrator', 'صافرة الحكم.. بدأ الماتش بجد!');
          ctx.sfx('bell');
          const c1 = await ctx.games.choice({
            prompt: 'واحد من الفريق التاني بيجري ناحية الكورة قدامك. تعمل إيه؟', options: sh([
              { text: 'أزقّه وآخد الكورة', art: 'x', good: false, consequence: [['narrator', 'الحكم صفّر: فاول! ممنوع الزق.'], ['moody', 'عندك حق يا حكم.. نلعب بالقواعد أحسن.']] },
              { text: 'أجري وراها وألعب بنضافة', art: 'pk_football', good: true, reply: [['cz1', 'لعب حلو يا {m}!']] },
              { text: 'أمسك قميصه عشان يقف', art: 'pk_jersey:red', good: false, consequence: [['narrator', 'الحكم رفع الكارت الأصفر: تحذير!'], ['aboody', 'مش حلو كده.. الأحسن نلعب بالأصول.']] }])
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('fairplay');
          await ctx.say('narrator', 'ومرّت الدقايق.. وانتهى الماتش ٣ - ٢ للفريق التاني.');
          await ctx.say('aboody', 'احنا خسرنا يا {m}... ');
          const c2 = await ctx.games.choice({
            prompt: 'الفريق التاني كسب. نعمل إيه؟', options: sh([
              { text: 'نزعل ونرمي الكورة', art: 'sad', good: false, consequence: [['cz1', 'ده مجرد لعب يا جماعة.. استمتعنا مع بعض.'], ['moody', 'عندك حق، الخسارة بتعلّمنا.']] },
              { text: 'نسلّم عليهم ونقول مبروك', art: 'pk_trophy', good: true, reply: [['cz1', 'شكرًا يا {m}! ماتش حلو أوي.']] },
              { text: 'نقول إن الحكم ظلمنا', art: 'pk_whistle', good: false, consequence: [['moody', 'الحكم بيحاول يعمل الصح.. والأهم إننا نلعب بنضافة.']] }])
          });
          if (c2.firstTry) ctx.reward.star(1); ctx.value('respect');
          await ctx.games.ritual({ text: 'سلّم عليهم', sub: 'اللعب النضيف', who: 'moody' });
          const sc = await ctx.quiz.pair({
            aboody: { id: 'pkm2_6', category: 'math', tier: 6, q: 'فريقنا جاب ٢ والفريق التاني جاب ٣. مين كسب؟', choices: ['الفريق التاني', 'فريقنا'], answer: 0, hint: '٣ أكبر من ٢' },
            moody: { id: 'pkm2_9', category: 'math', tier: 9, q: 'لو سجّلنا ٣ أهداف كل ماتش في ٤ ماتشات. كام هدف كلهم؟', choices: ['١٢', '٧', '١٦'], answer: 0, hint: '٣ × ٤' }
          });
          await ctx.say('moody', 'الخسارة النهاردة بتعلّمنا نلعب أحسن بكرة. ومهم نفضل صحاب.');
          return ctx.nav.complete();
        }
      },
      /* ============ 3) سر النباتات ============ */
      {
        id: 'm3', title: 'سر النباتات', intro: 'عمّ سيد البستاني هيعلّمنا إزاي الزرع بيكبر!', values: ['nature', 'water', 'teamwork'], sticker: 's_plant',
        wisdom: 'الماية غالية.. نسقي بقدر ونقفل الحنفية', diary: { pic: 'pk_potplant:4', text: 'زرعنا وسقينا الورد وشفنا النحل والفراشات' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('pkGarden', { state: {}, heroes: { moody: { x: 330, y: 482, dir: 1 }, aboody: { x: 440, y: 494, dir: 1 } } });
          await ctx.say('baba', 'السلام عليكم يا شباب! أنا عمّ سيد البستاني. النهاردة هعلّمكم سر النباتات.', { name: 'عمّ سيد', icon: 'baba' });
          await ctx.say('aboody', 'يعني إزاي البذرة الصغيرة بتبقى وردة؟');
          await ctx.say('baba', 'الأول نزرعها صح. رتّبوا خطوات الزراعة.', { name: 'عمّ سيد' });
          const s1 = await ctx.games.sequence({ prompt: 'رتّب خطوات زراعة بذرة', steps: [{ art: 'spoon', label: 'احفر حفرة' }, { art: 'pk_seed', label: 'حط البذرة' }, { art: 'pk_soil', label: 'غطّيها بالتراب' }, { art: 'water', label: 'رشّها ماية' }] });
          if (s1.mistakes <= 1) ctx.reward.star(1);
          st.state.sprouts = true; ctx.heroes('floor');
          await ctx.say('baba', 'والبذرة بتكبر على مراحل. رتّبوا مراحل النمو.', { name: 'عمّ سيد' });
          const s2 = await ctx.games.sequence({ prompt: 'رتّب مراحل نمو النبتة', steps: [{ art: 'pk_stage:0', label: 'بذرة' }, { art: 'pk_stage:1', label: 'جذور' }, { art: 'pk_stage:2', label: 'نبتة صغيرة' }, { art: 'pk_stage:3', label: 'نبتة كبيرة' }, { art: 'pk_stage:4', label: 'وردة' }] });
          if (s2.mistakes <= 1) ctx.reward.star(1); ctx.heroes('floor');
          await ctx.say('baba', 'دلوقتي النبتات عطشانة. بس انتبهوا: الماية لازم تكفي مش أكتر.', { name: 'عمّ سيد' });
          const w = await ctx.games.pkWater({ prompt: 'اسحب الإبريق فوق الزرعة لحد ما الخط يوصل للأخضر' });
          st.state.bloom = true; ctx.value('water'); ctx.heroes('floor');
          await ctx.say('baba', 'يا سلام! ' + (w.waste <= 1.2 ? 'ما ضيّعتوش ماية خالص.' : 'فاضل بس نخلّي بالنا من الماية.') + ' الحديقة بقت زي الجنة.', { name: 'عمّ سيد' });
          /* leaking tap */
          st.state.hose = true; st.state.tapSpot = { x: 590, y: 330 }; st.state.tapOff = false;
          await ctx.say('aboody', 'يا ساتر! الخرطوم بيسرّب ماية على الأرض!');
          const tp = await ctx.games.tap({ prompt: 'الحنفية جامدة.. {m} يقفلها', list: false, spots: [{ id: 'tap', x: 590, y: 330, s: 90, hit: 60, needs: 'moody', needsMsg: 'الحنفية جامدة! محتاجين {m}', draw: pulse(50), keep: true, onFound: () => { st.state.tapOff = true; ctx.sfx('click'); } }] });
          if (tp.wrong <= 2) ctx.reward.star(1);
          st.state.hose = false; st.state.tapSpot = null;
          /* bees & butterflies */
          await ctx.say('baba', 'الورد بيجذب أصحابنا الطيّارين. دوّروا على النحل والفراشات!', { name: 'عمّ سيد' });
          const bs = [['pk_bee', 190, 292], ['pk_butterfly:pink', 330, 250], ['pk_bee', 480, 300], ['pk_butterfly:orange', 640, 262], ['pk_bee', 790, 296]];
          await ctx.games.hidden({ prompt: 'دوّر على ٣ نحلات و٢ فراشات بين الورد', hintAfter: 14, spots: bs.map((b, i) => ({ id: 'b' + i, art: b[0], x: b[1], y: b[2], s: 56, hit: 44, keep: false, listArt: b[0] })) });
          await ctx.say('baba', 'النحل والفراشات بتنقل حبوب اللقاح من وردة لوردة، وكده تطلع بذور جديدة.', { name: 'عمّ سيد' });
          await PK.pair(ctx, { cat: ['science', 'animals'], tag: 'park' });
          await ctx.say('aboody', 'يا عمّ سيد، أنا عايز أقطف الوردة الحمرا دي!');
          const c = await ctx.games.choice({
            prompt: '{a} عايز وردة. نعمل إيه؟', options: sh([
              { text: 'نقطفها ونمشي', art: 'pk_flower:red', good: false, consequence: [['baba', 'الورد ده للكل يا حبيبي. لو قطفناه محدّش هيشوفه تاني.', { name: 'عمّ سيد', icon: 'baba' }]] },
              { text: 'نشدّها من جذورها', art: 'pk_sprout', good: false, consequence: [['moody', 'كده نموّتها! النبتة محتاجة جذورها عشان تعيش.']] },
              { text: 'نشمّها ونسيبها لكل الناس', art: 'pk_butterfly:pink', good: true, reply: [['baba', 'برافو عليكم! كده الورد بيفضل حلو.', { name: 'عمّ سيد', icon: 'baba' }]] }])
          });
          if (c.firstTry) ctx.reward.star(1);
          return ctx.nav.complete();
        }
      },
      /* ============ 4) حديقة الحيوان الصغيرة ============ */
      {
        id: 'm4', title: 'حديقة الحيوان الصغيرة', intro: 'أسد وزرافة وقرد.. وفي قطة صغيرة تايهة!', values: ['animalcare', 'kindness', 'teamwork'], sticker: 's_zoo',
        wisdom: 'الحيوانات صحابنا.. نحترمها ونسيبها في حالها', diary: { pic: 'pk_kitten', text: 'زرنا الحيوانات ولقينا القطة الصغيرة' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('pkZoo', { state: {}, heroes: { moody: { x: 330, y: 484, dir: 1 }, aboody: { x: 440, y: 494, dir: 1 } } });
          await ctx.say('baba', 'وصلنا حديقة الحيوان الصغيرة! بصّوا: الأسد والزرافة والفيل!', { name: 'بابا' });
          await ctx.say('aboody', 'الله! والقرد بيبصّلي!');
          await ctx.say('cz1', 'معايا شيبسي! هرميه للقرد يفرح.');
          const c1 = await ctx.games.choice({
            prompt: '{fr} عايز يرمي الشيبسي للقرد. نعمل إيه؟', options: sh([
              { text: 'نرمي معاه الشيبسي', art: 'chips', good: false, consequence: [['baba', 'اللافتة بتقول ممنوع نأكّل الحيوانات. الأكل ده بيعبّهم.', { name: 'بابا' }]] },
              { text: 'نخضّ القرد ونصرخ', art: 'pk_monkey', good: false, consequence: [['moody', 'ده بيخوّفه! الحيوان محتاج هدوء.']] },
              { text: 'نقرا اللافتة ونتفرج بهدوء', art: 'pk_sign', good: true, reply: [['cz1', 'عندكم حق.. اللافتة واضحة.']] }])
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('animalcare');
          st.setActive('aboody', true);
          await ctx.say('baba', 'عايزين نعرف كل حيوان بياكل إيه. وصّل لـ{a} الأول.', { name: 'بابا' });
          const p1 = await ctx.games.pkPairs({
            prompt: 'وصّل كل حيوان بأكله', left: [{ k: 'r', art: 'pk_rabbit', label: 'الأرنب' }, { k: 'm', art: 'pk_monkey', label: 'القرد' }, { k: 'c', art: 'pk_kitten', label: 'القطة' }],
            right: [{ k: 'r', art: 'carrot', label: 'جزر' }, { k: 'm', art: 'banana', label: 'موز' }, { k: 'c', art: 'pk_fish', label: 'سمك' }]
          });
          if (p1.mistakes <= 1) ctx.reward.star(1);
          st.setActive('moody', true); ctx.heroes('floor');
          await ctx.say('baba', 'وانت يا {m}.. وصّل كل حيوان بمعلومته.', { name: 'بابا' });
          const p2 = await ctx.games.pkPairs({
            prompt: 'وصّل كل حيوان بمعلومته', left: [{ k: 'l', art: 'pk_lion', label: 'الأسد' }, { k: 'g', art: 'pk_giraffe', label: 'الزرافة' }, { k: 'e', art: 'pk_elephant', label: 'الفيل' }, { k: 'p', art: 'pk_parrot', label: 'الببغاء' }],
            right: [{ k: 'l', label: 'ملك الغابة' }, { k: 'g', label: 'أطول رقبة' }, { k: 'e', label: 'أكبر حيوان على اليابسة' }, { k: 'p', label: 'بيقلّد الكلام' }]
          });
          if (p2.mistakes <= 2) ctx.reward.star(1); ctx.heroes('floor');
          await PK.pair(ctx, { cat: ['animals', 'riddles'], tag: 'park' });
          st.state.hideKitten = true;
          await ctx.say('baba', 'يا ولاد! الحارس بيقول إن قطة صغيرة هربت من القفص.. وسامعين مواء.', { name: 'بابا' });
          await ctx.say('aboody', 'أنا صغير وأعرف أدخل في الأماكن الضيّقة. هدوّر عليها!');
          const decoy = (id, x, y) => ({ id, x, y, s: 60, hit: 62, keep: true, optional: true, noBadge: true, onFound: () => { ctx.bubble(ctx.active, 'مفيش هنا غير ورق الشجر..', 1.8); } });
          await ctx.games.hidden({
            prompt: 'دوّر على القطة الصغيرة.. اسمع المواء!', list: false, hintAfter: 16, spots: [
              Object.assign(decoy('d1', 90, 438), { draw: null }), Object.assign(decoy('d2', 480, 444), {}),
              { id: 'kitten', x: 880, y: 438, s: 60, hit: 70, needs: 'aboody', walkOff: 0, keep: true, needsMsg: 'القطة في مكان ضيّق! محتاجين {a}', draw: (g, t, s0, s) => { A.draw(g, 'pk_kitten', 0, -44 + Math.sin(t * 3) * 2, 56); if (!s.found) G.sparkle(g, 26, -62, 7, '#fff', .9); }, onFound: () => { ctx.sfx('good'); ctx.say('aboody', 'ميااو! لقيتها!'); } }]
          });
          ctx.reward.star(1);
          st.state.hideKitten = false; ctx.heroes('floor');
          await ctx.say('baba', 'برافو! دلوقتي نرجّعها لسلّتها ونأكلها حاجة تناسبها.', { name: 'بابا' });
          await ctx.games.dragdrop({
            prompt: 'القطة في السلّة، واللبن والسمك في طبقها', heroes: 'corner', panel: { x: 190, y: 160, w: 580, h: 130 }, wrongHint: 'مش هنا.. جرّب مكان تاني',
            items: [{ id: 'kit', art: 'pk_kitten', to: 'basket', x: 330, y: 225, s: 86 }, { id: 'milk', art: 'milk', to: 'bowl', x: 480, y: 225, s: 72 }, { id: 'fish', art: 'pk_fish', to: 'bowl', x: 630, y: 225, s: 72 }],
            targets: [{ id: 'basket', x: 300, y: 360, w: 150, h: 110, art: 'basket', s: 130, label: 'سلّة القطة', itemScale: .6 }, { id: 'bowl', x: 640, y: 365, w: 150, h: 100, art: 'plate', s: 130, label: 'طبق القطة', cols: 2, dx: 40, itemScale: .5 }]
          });
          await ctx.say('baba', 'الحيوانات بتحتاج رحمتنا. أحسنتم يا أبطال!', { name: 'بابا' });
          return ctx.nav.complete();
        }
      },
      /* ============ 5) استغماية ============ */
      {
        id: 'm5', title: 'استغماية', intro: 'نلعب استغماية.. بس بشنطة الشمس ونضافة الحديقة!', values: ['sunsafe', 'clean', 'teamwork', 'bismillah'], sticker: 's_seek',
        wisdom: 'الحديقة بتاعتنا كلنا.. نسيبها أنضف مما لقيناها', diary: { pic: 'pk_hat', text: 'لعبنا استغماية وجهّزنا شنطة الشمس ونضّفنا الحديقة' },
        async run(ctx) {
          const st = ctx.stage, H = M.parkHide;
          await ctx.scene('pkPark', { state: { kind: 'hide' }, heroes: { moody: { x: 420, y: 486, dir: 1 }, aboody: { x: 520, y: 496, dir: -1 } } });
          await ctx.say('cz1', 'نلعب استغماية؟ {m} هيعدّ لحد ١٠ وإحنا نستخبّى!');
          await ctx.say('pk_kid:pink:l:g', 'بس نستخبّى فين يا جماعة؟', { name: 'ملك' });
          const c = await ctx.games.choice({
            prompt: 'نستخبّى فين؟', options: sh([
              { text: 'ورا الشجرة قدام ماما', art: 'pk_tree', good: true, reply: [['mama', 'برافو! قريبين من ماما ومن عينها.', { name: 'ماما' }]] },
              { text: 'بره بوابة الحديقة', art: 'x', good: false, consequence: [['mama', 'لأ يا حبيبي! بره البوابة في عربيات. الحديقة بس، وقدام عيني.', { name: 'ماما' }]] },
              { text: 'بعيد أوي ورا المبنى', art: 'sad', good: false, consequence: [['moody', 'لو بعدنا هنتوه عن ماما.. نستخبّى جنبها.']] }])
          });
          if (c.firstTry) ctx.reward.star(1);
          await ctx.say('moody', 'يلا! أنا هغمّض عيني وأعدّ.. واحد، اتنين..');
          st.setActive('moody', true);
          await ctx.games.pkCount({ who: 'moody', target: 10, prompt: '{m} بيعدّ لحد ١٠: دوس على الزرار مع كل رقم' });
          await ctx.say('moody', 'عشرة! جاي أدوّر عليكم!', { anim: 'cheer' });
          const mkF = (id, kid, h, ox, oy) => ({ id, x: h.x, y: h.y, s: 70, hit: 64, keep: true, noBadge: true, listArt: kid, draw: (g, t, s0, s) => { if (s.found) { A.draw(g, kid, ox, oy + 20 - Math.abs(Math.sin(t * 6)) * 6, 94); } else { A.draw(g, kid, ox, oy, 80); A.draw(g, h.art, 0, 0, h.s); } }, onFound: () => { ctx.sfx('good'); } });
          const hf = await ctx.games.hidden({
            prompt: 'دوّر على ٣ أصحاب مستخبّيين', hintAfter: 14, spots: [
              mkF('f1', 'pk_kid:orange', H[0], 14, -50), mkF('f2', 'pk_kid:blue:d', H[1], 54, 26), mkF('f3', 'pk_kid:pink:l:g', H[2], -10, -44)]
          });
          if (hf.wrong <= 2) ctx.reward.star(1);
          await ctx.say('cz1', 'لقيتنا! أنت شاطر أوي يا {m}.');
          await ctx.say('narrator', 'سؤال سريع قبل ما الدور يتغيّر!');
          await PK.pair(ctx, { cat: ['counting', 'math'], tag: 'park' });
          /* sun safety */
          await ctx.scene('pkPark', { state: { kind: 'plain' }, heroes: 'corner' });
          await ctx.say('mama', 'الجو حر أوي النهاردة. لازم نجهّز شنطة الشمس.', { name: 'ماما' });
          const sunItems = [['pk_hat', 'bag'], ['pk_wbottle', 'bag'], ['pk_sunscreen', 'bag'], ['pk_glasses', 'bag'], ['pk_coat', 'home'], ['chips', 'home']];
          const o2 = sh(sunItems);
          const sb = await ctx.games.dragdrop({
            prompt: 'حطّوا في الشنطة اللي بيحمينا من الشمس', heroes: 'corner', panel: { x: 130, y: 130, w: 700, h: 150 }, wrongHint: 'ده مش محتاجينه في الحر.. جرّب حاجة تانية',
            items: o2.map((it, i) => ({ id: it[0], art: it[0], to: it[1], x: 215 + i * 105, y: 205, s: 76 })),
            targets: [{ id: 'bag', x: 320, y: 360, w: 150, h: 110, art: 'bag', s: 130, label: 'شنطة الشمس', cols: 4, dx: 26, itemScale: .45 }, { id: 'home', x: 640, y: 370, w: 130, h: 100, art: 'box', s: 110, label: 'نسيبه في البيت', cols: 2, dx: 30, itemScale: .45 }]
          });
          if (sb.mistakes <= 1) ctx.reward.star(1); ctx.value('sunsafe');
          await ctx.say('mama', 'قبعة وماية وكريم ونضارة.. كده نلعب بأمان.', { name: 'ماما' });
          /* clean up */
          await ctx.say('moody', 'بُص يا {a}! حد نسي زبالة في الحديقة. مش هنسيبها كده.');
          const tr = [['pk_pbottle', 'b1'], ['pk_can', 'b1'], ['pk_pbag', 'b1'], ['pk_wrapper', 'b2'], ['pk_core', 'b2'], ['note', 'b2']];
          const tq = await ctx.games.dragdrop({
            prompt: 'نضّفوا الحديقة: بلاستيك وعلب في الأزرق، والباقي في الأخضر', heroes: 'corner', panel: { x: 130, y: 130, w: 700, h: 150 }, wrongHint: 'جرّب الصندوق التاني',
            items: sh(tr).map((it, i) => ({ id: it[0], art: it[0], to: it[1], x: 215 + i * 105, y: 205, s: 74 })),
            targets: [{ id: 'b1', x: 320, y: 360, w: 120, h: 110, art: 'pk_bin:blue', s: 130, label: 'بلاستيك وعلب', cols: 3, dx: 24, itemScale: .4 }, { id: 'b2', x: 640, y: 360, w: 120, h: 110, art: 'pk_bin:green', s: 130, label: 'مخلّفات تانية', cols: 3, dx: 24, itemScale: .4 }]
          });
          if (tq.mistakes <= 2) ctx.reward.star(1); ctx.value('clean');
          await PK.pair(ctx, { cat: ['health', 'ethics'], tag: 'park' });
          await ctx.say('mama', 'ما شاء الله عليكم! الحديقة بقت أحلى. نقول الحمد لله؟', { name: 'ماما' });
          await ctx.games.ritual({ text: 'الحمد لله', sub: 'على اللعب والصحة', who: 'moody' });
          await ctx.say('narrator', 'وبكده بقى {m} و{a} من أبطال الحديقة!');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
