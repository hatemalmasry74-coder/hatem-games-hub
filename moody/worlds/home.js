/* Moody & Aboody - worlds/home.js : WORLD 1 "البيت" (6 missions).
   This file is also the reference example for DEV.md: copy it to start a new world.
   Tokens {m} {a} {me} in strings become the heroes' (editable) names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const pulse = r => (g, t) => { g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const faint = (art, s) => (g, t) => { g.save(); g.globalAlpha = .55; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const NIGHT = (st, v) => { st.state.night = v; };

  M.registerWorld({
    id: 'home', order: 1, title: 'البيت', icon: 'home', theme: { c1: '#ffd27a', c2: '#ff9a3c' }, finalSticker: 's_home',
    stickers: [
      { id: 's_morning', title: 'صباح جميل', art: 'sunart', bg: '#fff3c4' }, { id: 's_teeth', title: 'أسنان لامعة', art: 'toothbrush', bg: '#d6f3ee' },
      { id: 's_tidy', title: 'ملك الترتيب', art: 'toybox', bg: '#ffe9c8' }, { id: 's_share', title: 'قلب كبير', art: 'heartbig', bg: '#ffe0ea', rot: .1 },
      { id: 's_chef', title: 'مساعد الشيف', art: 'pot', bg: '#fff0c4' }, { id: 's_water', title: 'حارس الماية', art: 'water', bg: '#d9f0ff' },
      { id: 's_treasure', title: 'صائد الكنوز', art: 'chest', bg: '#f5e3c0', rot: .08 }, { id: 's_study', title: 'نجم الواجب', art: 'book', bg: '#ece0ff' },
      { id: 's_sleep', title: 'نوم هادي', art: 'moon', bg: '#dfe3ff' }, { id: 's_home', title: 'أبطال البيت', art: 'home', bg: '#ffe9c8', rot: -.05 }
    ],
    missions: [
      /* ============ 1) صباح الخير ============ */
      {
        id: 'm1', title: 'صباح الخير', intro: 'يوم جديد بيبدأ.. يلا نصحى ونستعد!', values: ['help', 'teeth', 'healthy', 'bismillah', 'teamwork'], sticker: 's_morning',
        wisdom: 'اليوم الحلو بيبدأ بـ بسم الله', diary: { pic: 'sunart', text: 'صحينا بدري ورتبنا السرير وفطرنا سوا' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('bedroom', { state: { ring: true, bedMade: false, alarm: false }, heroes: { moody: { x: 520, y: 480, dir: -1 }, aboody: { x: 620, y: 490, dir: -1 } } });
          st.setActive('aboody', true);
          const stop = ctx.every(1.3, () => M.audio.sfx('alarm'));
          await ctx.say('aboody', 'يا خبر! المنبّه بيرن! الشمس طلعت!');
          await ctx.games.tap({ prompt: 'اضغط على المنبّه عشان يسكت', list: false, spots: [{ id: 'alarm', x: 384, y: 322, s: 64, draw: (g, t) => { g.save(); g.rotate(Math.sin(t * 40) * .08); A.draw(g, 'alarm', 0, 0, 70); g.restore(); } }] });
          stop(); st.state.ring = false; st.state.alarm = true;
          await ctx.say('moody', 'صباح الخير يا {a}! الحمد لله إننا صحينا بالسلامة.', { anim: 'wave' });
          await ctx.say('aboody', 'صباح النور يا {m}! النهاردة هيبقى يوم حلو.');
          await ctx.say('moody', 'طيب يلا نرتّب سريرنا سوا. أنا هشد البطانية.. وانت ظبّط المخدة.');
          ctx.value('teamwork');
          const bedRes = await ctx.games.tap({
            prompt: 'سرير مرتّب: {m} يشدّ البطانية و{a} يظبّط المخدة', hintAfter: 12, spots: [
              { id: 'pillow', x: 110, y: 330, s: 90, hit: 60, needs: 'aboody', keep: true, listArt: 'pillow', draw: pulse(48), onFound: () => { st.state.pillowFixed = true; ctx.sfx('pop'); } },
              { id: 'blanket', x: 235, y: 340, s: 110, hit: 70, needs: 'moody', keep: true, listArt: 'bed', draw: pulse(56), onFound: () => { st.state.bedMade = true; ctx.sfx('good'); } }]
          });
          st.state.bedMade = true; ctx.reward.star(1);
          await ctx.say('aboody', 'الله! سريرنا بقى زي الفنادق!', { anim: 'cheer' });
          /* bathroom: teeth */
          await ctx.scene('bathroom', { heroes: 'corner' });
          await ctx.say('moody', 'دلوقتي وقت الأسنان. لازم نفرشها بالترتيب الصح.');
          const seq = await ctx.games.sequence({ prompt: 'رتّب خطوات تفريش الأسنان', steps: [{ art: 'water', label: 'بلّل الفرشة' }, { art: 'tap', label: 'اقفل الحنفية' }, { art: 'toothpaste', label: 'حط المعجون' }, { art: 'toothbrush', label: 'افرك الأسنان' }, { art: 'cup', label: 'اغسل بقك' }] });
          if (seq.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('aboody', 'في ميكروبات صغيرة على أسناني! ساعدني أنضّفها!');
          await ctx.games.scrub({ prompt: 'اسحب الفرشة على الميكروبات', dirt: 5 });
          ctx.sticker.give('s_teeth');
          await ctx.say('moody', 'أسنانك بتلمع يا {a}! ابتسامة جميلة.', { anim: 'cheer' });
          /* a morning riddle for both */
          await ctx.say('narrator', 'لغز الصبح: كل واحد فيكم عليه سؤال!');
          await ctx.quiz.pair({ cat: ['health', 'general', 'animals'] });
          /* breakfast */
          await ctx.scene('kitchen', { state: { table: true, hideTap: true }, heroes: 'corner' });
          await ctx.say('mama', 'صباح الخير يا حبايبي! الفطار جاهز.. اختاروا اللي يخلّيكم أقوياء.');
          const items = [['foul', 'plate'], ['egg', 'plate'], ['cheese', 'plate'], ['milk', 'plate'], ['apple', 'plate'], ['bread', 'plate'], ['chips', 'later'], ['candy', 'later'], ['soda', 'later']];
          const order = U.shuffle(items), xs = [190, 300, 410, 520, 630, 740];
          const bf = await ctx.games.dragdrop({
            prompt: 'حطّوا الفطار الصحي في الطبق', panel: { x: 130, y: 130, w: 700, h: 190 }, wrongHint: 'ده نأكله شوية بس.. نختار الأحسن لجسمنا',
            items: order.map((it, i) => ({ id: it[0], art: it[0], to: it[1], x: i < 5 ? xs[i] + 15 : xs[i - 5] + 55, y: i < 5 ? 190 : 270, s: 66, hint: it[1] === 'later' ? 'ده للحلويات بعدين يا حبيبي' : null })),
            targets: [{ id: 'plate', x: 430, y: 405, w: 190, h: 90, art: 'plate', s: 150, label: 'طبق الفطار', cols: 4, dx: 30, dy0: -6, itemScale: .5 }, { id: 'later', x: 850, y: 350, w: 120, h: 100, art: 'box', label: 'بعدين', itemScale: .5 }]
          });
          if (bf.mistakes <= 2) ctx.reward.star(1);
          await ctx.say('mama', 'قبل ما ناكل، بنقول إيه؟');
          await ctx.games.ritual({ text: 'بسم الله', sub: 'قبل الأكل' });
          ctx.value('bismillah'); await ctx.anim('moody', 'pickup', 1.2);
          await ctx.say('aboody', 'مممم! الفول بتاع ماما أحلى حاجة!');
          await ctx.games.ritual({ text: 'الحمد لله', sub: 'بعد الأكل', who: 'aboody' });
          await ctx.say('mama', 'الله يبارك فيكم! يلا على اليوم الجديد.');
          await ctx.say('moody', 'بعد الفطار هننزل بالأسانسير من الدور السادس.. ونعدّي نسلّم على ننا زوزا في الدور التالت.');
          ctx.reward.star(1);
          return ctx.nav.complete();
        }
      },
      /* ============ 2) غرفتنا مرتبة ============ */
      {
        id: 'm2', title: 'غرفتنا مرتبة', intro: 'الأوضة مقلوبة! لازم نرتّبها قبل ما ماما تيجي.', values: ['tidy', 'share', 'teamwork', 'honesty'], sticker: 's_tidy',
        wisdom: 'اللي يرتّب مكانه.. يلاقي كل حاجة بسهولة', diary: { pic: 'toybox', text: 'رتّبنا الأوضة ولعبنا مع ماجد' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('bedroom', { state: { hideStorage: true, bedMade: true }, heroes: { moody: { x: 520, y: 480, dir: -1 }, aboody: { x: 610, y: 490, dir: -1 } } });
          await ctx.say('moody', 'يا نهار! الأوضة مقلوبة! ماما قالت لازم نرتّبها قبل الضهر.');
          await ctx.say('aboody', 'وعربيتي الحمرا ضاعت! أكيد وقعت تحت السرير.');
          st.setActive('moody', true);
          const f = await ctx.games.hidden({
            prompt: 'عبودي صغير ويدخل تحت السرير. دوّر على اللي ضاع', hintAfter: 14, spots: [
              { id: 'car', art: 'car', x: 200, y: 410, s: 52, needs: 'aboody', walkOff: 0, listArt: 'car', draw: faint('car', 54), onFound: () => ctx.say('aboody', 'لقيتها! كانت وراها مفاجأة: كمان شراب تاه!') },
              { id: 'sock', art: 'sock', x: 390, y: 444, s: 46, needs: 'aboody', walkOff: 0, listArt: 'sock', draw: faint('sock', 50) }]
          });
          ctx.reward.star(1);
          await ctx.say('moody', 'برافو يا {a}! أنا هشيل الكرتونة التقيلة.. وانت ساعدني في الباقي.');
          ctx.heroes('corner');
          const mk = (id, art, to, x, y, extra) => Object.assign({ id, art, to, x, y, s: 66 }, extra || {});
          const items = [mk('car', 'car', 'toybox', 400, 255), mk('teddy', 'teddy', 'toybox', 480, 235), mk('blocks', 'blocks', 'toybox', 560, 255), mk('ball', 'ball', 'toybox', 640, 235), mk('robot', 'robot', 'toybox', 720, 255),
            mk('tee', 'tee', 'basket', 420, 340, { hint: 'الهدوم بتروح سلة الغسيل' }), mk('pants', 'pants', 'basket', 520, 330), mk('sock', 'sock', 'basket', 620, 340),
            mk('book', 'book', 'shelf', 720, 340), mk('notebook', 'notebook', 'shelf', 800, 300), mk('box', 'box', 'wardrobe', 150, 450, { s: 90, needs: 'moody', needsMsg: 'الكرتونة تقيلة! محتاجين {m} القوي' })];
          const td = await ctx.games.dragdrop({
            prompt: 'رتّب: ألعاب في الصندوق، هدوم في السلّة، كتب على الرف', heroes: 'corner', panel: { x: 350, y: 195, w: 520, h: 190 },
            wrongHint: 'مش هنا.. جرّب مكان تاني',
            items, targets: [{ id: 'toybox', x: 470, y: 440, w: 150, h: 100, art: 'toybox', label: 'الألعاب', cols: 5, dx: 20 }, { id: 'basket', x: 640, y: 440, w: 120, h: 100, art: 'basket', label: 'الغسيل', itemScale: .45 }, { id: 'shelf', x: 810, y: 420, w: 110, h: 120, art: 'shelf', label: 'الرف', itemScale: .4 }, { id: 'wardrobe', x: 850, y: 190, w: 120, h: 120, art: 'wardrobe', label: 'فوق الدولاب', itemScale: .5 }]
          });
          if (td.mistakes <= 2) ctx.reward.star(1);
          st.state.hideStorage = false; ctx.heroes('floor');
          await ctx.say('moody', 'الأوضة بقت زي الفل! ما شاء الله.', { anim: 'cheer' });
          await ctx.say('aboody', 'بس سؤال: الدرج مقفول بكود سرّي!');
          await ctx.quiz.pair({ cat: ['counting', 'math', 'patterns'] });
          ctx.sticker.give('s_tidy');
          /* friend visits: sharing */
          await ctx.say('friend', 'السلام عليكم! أنا ماجد. ممكن ألعب بالعربية الحمرا؟', { name: 'ماجد' });
          const ch = await ctx.games.choice({
            prompt: 'العربية الحمرا أحلى لعبة عند {a}. نعمل إيه؟', options: [
              { text: 'أخبّيها وأقول مش معايا', art: 'car', good: false, consequence: [['friend', 'ماجد زعل وراح بيته من غير ما يلعب...', { name: 'ماجد' }], ['aboody', 'وأنا كمان زعلان.. كان الأحسن نلعب سوا.']] },
              { text: 'أديهاله ونلعب سوا', art: 'heartbig', good: true, reply: [['friend', 'شكرًا يا {a}! أنت صاحب حقيقي!', { name: 'ماجد' }], ['moody', 'اللعب مع حد أحلى بكتير.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.sticker.give('s_share'); ctx.value('share');
          await ctx.say('narrator', 'ولعبوا التلاتة وسط ضحك وفرحة.');
          return ctx.nav.complete();
        }
      },
      /* ============ 3) ساعدنا ماما في المطبخ ============ */
      {
        id: 'm3', title: 'ساعدنا ماما في المطبخ', intro: 'ماما محتاجة مساعدة.. إيدين صغيرة وإيدين كبيرة!', values: ['help', 'water', 'teamwork', 'thanks'], sticker: 's_chef',
        wisdom: 'نقطة ورا نقطة تبقى بحر.. اقفل الحنفية', diary: { pic: 'pot', text: 'ساعدنا ماما في المطبخ وقفلنا الحنفية' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('kitchen', { state: { tapDrip: true }, heroes: { moody: { x: 330, y: 480, dir: 1 }, aboody: { x: 420, y: 490, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، ممكن تساعدوني؟ محتاجة ٣ طماطم وكيس الرز وملعقة وقعت.');
          await ctx.say('aboody', 'حاضر يا ماما! أنا هدوّر على اللي واقع.');
          const hid = await ctx.games.hidden({
            prompt: 'دوّروا على ٣ طماطم وكيس الرز والملعقة', hintAfter: 14, spots: [
              { id: 't1', art: 'tomato', x: 300, y: 268, s: 50 }, { id: 't2', art: 'tomato', x: 395, y: 268, s: 50 }, { id: 't3', art: 'tomato', x: 700, y: 262, s: 50 },
              { id: 'rice', art: 'rice', x: 260, y: 118, s: 64, needs: 'moody', needsMsg: 'الكيس في الدولاب العالي! محتاجين {m} الطويل', walkOff: 0 },
              { id: 'spoon', art: 'spoon', x: 330, y: 424, s: 46, needs: 'aboody', walkOff: 0, draw: faint('spoon', 50), needsMsg: 'الملعقة في فتحة ضيقة! محتاجين {a}' }]
          });
          ctx.reward.star(1); ctx.value('teamwork');
          await ctx.say('moody', 'كله اتلاقى! كل واحد فينا له دور مهم.');
          await ctx.say('mama', 'ممتاز! كل كوباية رز عايزة كوبايتين ماية. وإحنا هنعمل ٣ كوبايات رز.');
          const q = await ctx.quiz.pair({
            aboody: { id: 'k_m3_6', category: 'math', tier: 6, q: 'كوبايتين ماية + كوبايتين + كوبايتين = كام كوباية؟', choices: ['٦', '٤', '٨'], answer: 0, hint: 'اعدّ بالاتنين: ٢، ٤، ٦' },
            moody: { id: 'k_m3_9', category: 'math', tier: 9, q: '٣ كوبايات رز × ٢ ماية = كام كوباية ماية؟', choices: ['٦', '٥', '٩'], answer: 0, hint: '٣ × ٢' }
          });
          const me = await ctx.games.measure({ prompt: 'صبّ ٦ كوبايات ماية في الإبريق', target: 6, unit: 'كوب', max: 10, label: 'المطلوب' });
          if (q.firstTry >= 1 && me.tries <= 1) ctx.reward.star(1);
          await ctx.say('aboody', 'يا ساتر! الحنفية بتنقّط وبتضيّع ماية!');
          st.state.hideTap = false;
          const tapRes = await ctx.games.tap({ prompt: 'الحنفية جامدة.. {m} يشدّها وهي تقفل', list: false, spots: [{ id: 'tap', x: 830, y: 262, s: 90, hit: 56, needs: 'moody', needsMsg: 'الحنفية جامدة! محتاجين {m}', draw: pulse(48), onFound: () => { st.state.tapOff = true; ctx.sfx('click'); } }] });
          ctx.sticker.give('s_water'); ctx.value('water');
          if (tapRes.wrong <= 2) ctx.reward.star(1);
          await ctx.say('aboody', 'برافو يا {m}! الماية غالية.. منضيّعهاش.');
          await ctx.say('mama', 'تسلم إيديكم يا أحلى ولاد!');
          await ctx.say('moody', 'الله يخلّيكي يا ماما.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 4) لغز الكنز في البيت ============ */
      {
        id: 'm4', title: 'لغز الكنز في البيت', intro: 'لقينا خريطة كنز! لازم نحل الألغاز سوا.', values: ['teamwork', 'study'], sticker: 's_treasure',
        wisdom: 'التعاون أحلى كنز', diary: { pic: 'chest', text: 'لقينا الكنز بعد ما حلينا الألغاز سوا' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('living', { heroes: { moody: { x: 330, y: 480, dir: 1 }, aboody: { x: 250, y: 490, dir: 1 } } });
          await ctx.say('aboody', 'يا {m}! لقيت ورقة قديمة تحت الكنبة! فيها خريطة كنز!');
          await ctx.say('moody', 'يلا نحل اللغز الأول: "أنا ليا ٤ رجلين وبتقعد عليّا ومبمشيش. أنا مين؟"');
          const r1 = await ctx.quiz.ask({ id: 'k_m4_1', category: 'riddles', q: 'أنا ليا ٤ رجلين وبتقعد عليّا ومبمشيش. أنا مين؟', choices: [{ text: 'الكرسي', art: 'chair' }, { text: 'القطة', art: 'cat' }, { text: 'النبتة', art: 'plant' }], answer: 0, hint: 'بنقعد عليه ونذاكر' });
          await ctx.walk('moody', 440, 480); await ctx.anim('moody', 'pickup', .8); ctx.fx.burst(470, 380, { kind: 'star' });
          await ctx.say('moody', 'لقيت ورقة تحت الكرسي: "أنا فوق الحيطة وبعدّ الساعات".');
          await ctx.quiz.ask({ id: 'k_m4_2', category: 'riddles', q: 'أنا فوق الحيطة وبعدّ الساعات. أنا مين؟', choices: [{ text: 'الساعة', art: 'clock' }, { text: 'المصباح', art: 'lamp' }, { text: 'الشباك', art: 'window' }], answer: 0, hint: 'عقربين ورقم' });
          await ctx.say('aboody', 'الساعة عالية أوي! محتاجين {m} الطويل.');
          await ctx.games.tap({ prompt: '{m} يمد إيده ويجيب الورقة من فوق الساعة', list: false, spots: [{ id: 'clock', x: 190, y: 120, s: 90, hit: 56, needs: 'moody', draw: pulse(50), onFound: () => ctx.say('moody', 'في ورقة: "المفتاح في الفتحة الضيقة تحت الكنبة".') }] });
          ctx.reward.star(1);
          await ctx.games.tap({ prompt: '{a} الصغير يزحف تحت الكنبة ويجيب المفتاح', hintAfter: 10, spots: [{ id: 'key', art: 'key', x: 230, y: 438, s: 52, needs: 'aboody', walkOff: 0, draw: faint('key', 56), listArt: 'key' }] });
          await ctx.say('aboody', 'لقيت المفتاح! دلوقتي الدولاب العالي.', { anim: 'cheer' });
          await ctx.say('narrator', 'الدولاب عليه قفل أرقام. حلّوا الأسئلة عشان يتفتح!');
          const code = await ctx.quiz.pair({ cat: ['math', 'patterns', 'logic'] });
          if (code.firstTry >= 1) ctx.reward.star(1);
          await ctx.games.tap({ prompt: '{m} يفتح الدولاب العالي بالمفتاح', list: false, spots: [{ id: 'cab', x: 725, y: 110, s: 100, hit: 64, needs: 'moody', draw: pulse(60), onFound: () => { st.state.cabinetOpen = true; ctx.sfx('unlock'); } }] });
          await ctx.say('moody', 'جوّه الدولاب خريطة: "الكنز في آخر الممر". الممر مليان ألعاب.. اقفزوا بحرص!');
          const run = await ctx.games.runner({ distance: 2600, speed: 290, prompt: 'اقفزوا فوق الألعاب بحرص!' });
          await ctx.scene('living', { instant: true, heroes: { moody: { x: 380, y: 480, dir: 1 }, aboody: { x: 560, y: 490, dir: -1 } } });
          st.layers.length = 0; let open = false;
          st.addLayer({ z: 5, draw(g, t) { A.draw(g, 'chest', 480, 400, 150, { open }); if (open) for (let i = 0; i < 4; i++) G.sparkle(g, 480 + Math.sin(t * 3 + i * 2) * 70, 340 - ((t * 40 + i * 30) % 80), 9, '#fff6a8', .8); } });
          await ctx.say('aboody', 'وصلنا للكنز!');
          open = true; ctx.sfx('fanfare'); ctx.fx.confetti(); ctx.react('good', 'both'); await ctx.wait(1.2);
          ctx.reward.coins(5); if (run.hits <= 1) ctx.reward.star(1);
          await ctx.say('moody', 'الكنز الحقيقي إننا عملنا ده سوا.');
          return ctx.nav.complete();
        }
      },
      /* ============ 5) وقت الواجب والشاشة ============ */
      {
        id: 'm5', title: 'وقت الواجب والشاشة', intro: 'الواجب مستنّي.. والتابلت بيلمع!', values: ['screen', 'permission', 'study'], sticker: 's_study',
        wisdom: 'الواجب الأول.. واللعب بعده أحلى', diary: { pic: 'book', text: 'عملنا الواجب الأول وبعدين لعبنا تابلت شوية' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('study', { heroes: { moody: { x: 300, y: 480, dir: 1 }, aboody: { x: 400, y: 490, dir: 1 } } });
          await ctx.say('aboody', 'التابلت! أنا نفسي ألعب!');
          const c1 = await ctx.games.choice({
            prompt: 'فيه واجب لسه ما اتعملش.. نعمل إيه؟', options: [
              { text: 'نمسك التابلت ونلعب على طول', art: 'tablet', good: false, consequence: [['narrator', 'عدّت ساعة والتابلت لسه في إيديهم...'], ['mama', 'يا ولاد! الدنيا ضلمت والواجب لسه ما اتعملش!', { name: 'ماما' }], ['moody', 'أوه.. نسينا الواجب! نبدأ تاني بالترتيب الصح.']] },
              { text: 'نستخبّى ونلعب من غير ما حد يعرف', art: 'sad', good: false, consequence: [['aboody', 'بس أنا حاسس إني مش مرتاح.. ماما ممكن تزعل.'], ['moody', 'الأحسن نكون صرحاء ونسأل ماما.']] },
              { text: 'نسأل ماما ونعمل الواجب الأول', art: 'book', good: true, reply: [['mama', 'برافو عليكم! الواجب الأول وبعدين ٢٠ دقيقة تابلت.', { name: 'ماما' }]] }]
          });
          if (c1.firstTry) ctx.reward.star(1);
          st.state.hideTablet = true; st.state.hideBook = false;
          await ctx.say('moody', 'يلا نذاكر! أول واجب حساب.');
          const h1 = await ctx.quiz.pair({ cat: 'math' });
          await ctx.say('aboody', 'دلوقتي واجب لغة عربية!');
          const h2 = await ctx.quiz.pair({ cat: ['arabic', 'riddles', 'english'] });
          if (h1.firstTry + h2.firstTry >= 2) ctx.reward.star(1);
          await ctx.say('mama', 'ما شاء الله! خلصتوا الواجب. دلوقتي ٢٠ دقيقة تابلت.', { name: 'ماما' });
          st.state.hideTablet = false;
          const small = M.tierFor(ctx.active) === 6;
          const pairs = small ? ['car', 'teddy', 'ball'] : ['car', 'teddy', 'ball', 'robot', 'duck', 'blocks'];
          const mem = await ctx.games.memory({ prompt: 'لعبة الذاكرة على التابلت', pairs, timeLimit: small ? 45 : 70 });
          if (mem.timeUp) { ctx.sfx('bell'); await ctx.say('mama', 'خلّصت الـ ٢٠ دقيقة يا حبايبي!', { name: 'ماما' }); } else await ctx.say('aboody', 'خلّصنا اللعبة بدري!');
          const c2 = await ctx.games.choice({
            prompt: 'الوقت خلص. نعمل إيه؟', options: [
              { text: 'نطلب ٥ دقايق كمان ونزعل', art: 'sad', good: false, consequence: [['mama', 'اتفقنا ٢٠ دقيقة يا حبيبي. بكره نلعب تاني.', { name: 'ماما' }], ['aboody', 'عندك حق يا ماما.. أنا اتحمّست أوي.']] },
              { text: 'نقفل التابلت ونقول شكرًا يا ماما', art: 'smile', good: true, reply: [['mama', 'الله يبارك فيكم! عارفين قيمة الوقت.', { name: 'ماما' }]] }]
          });
          if (c2.firstTry) ctx.reward.star(1);
          await ctx.say('moody', 'وبعد التابلت نلعب كورة في البلكونة أو نقرا قصة.');
          return ctx.nav.complete();
        }
      },
      /* ============ 6) ليلة هادية ============ */
      {
        id: 'm6', title: 'ليلة هادية', intro: 'اليوم خلّص.. وقت النوم الهادي.', values: ['sleep', 'electric', 'money', 'thanks', 'bismillah'], sticker: 's_sleep',
        wisdom: 'نوم بدري.. وصحيان بنشاط', diary: { pic: 'moon', text: 'شكرنا ربنا وطفّينا النور ونمنا بدري' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('balcony', { heroes: { moody: { x: 400, y: 485, dir: 1 }, aboody: { x: 500, y: 495, dir: 1 } } });
          await ctx.say('aboody', 'بُص يا {m}! القمر طلع والنجوم بتلمع!');
          await ctx.say('moody', 'إحنا في الدور السادس.. وتحت في الدور التالت بيت ننا زوزا. تصبح على خير يا ننا!');
          await ctx.say('moody', 'سبحان الله.. اليوم خلص بسرعة. يلا ندخل نجهّز للنوم.');
          await ctx.scene('living', { state: { tvOn: true }, heroes: { moody: { x: 400, y: 480, dir: 1 }, aboody: { x: 500, y: 490, dir: 1 } } });
          await ctx.say('aboody', 'التلفزيون والمروحة واللمبة شغّالين ومفيش حد!');
          const ele = await ctx.games.tap({
            prompt: 'طفّوا الحاجات اللي مش بنستخدمها عشان نوفّر الكهربا', spots: [
              { id: 'tv', x: 815, y: 300, s: 120, hit: 70, listArt: 'tablet', draw: pulse(60), onFound: () => { st.state.tvOn = false; } },
              { id: 'bulb', art: 'bulb', x: 300, y: 56, s: 60, hit: 44, listArt: 'bulb' }, { id: 'fan', art: 'fan', x: 900, y: 110, s: 70, listArt: 'fan', hit: 46 }]
          });
          NIGHT(st, true); ctx.value('electric'); ctx.reward.star(1);
          await ctx.say('moody', 'وفّرنا كهربا! دلوقتي حصّالتنا محتاجة جنيهات.');
          st.state.lightsOff = false;
          const pg = await ctx.games.dragdrop({
            prompt: 'ادّخر ٣ جنيهات في الحصّالة', heroes: 'corner', wrongHint: 'الحصّالة هناك',
            items: [{ id: 'c1', art: 'coin', to: 'pig', x: 330, y: 250, s: 62 }, { id: 'c2', art: 'coin', to: 'pig', x: 480, y: 220, s: 62 }, { id: 'c3', art: 'coin', to: 'pig', x: 630, y: 250, s: 62 }],
            targets: [{ id: 'pig', x: 480, y: 410, w: 170, h: 120, art: 'piggy', label: 'الحصّالة', itemScale: .35 }]
          });
          ctx.value('money');
          await ctx.say('aboody', 'كل ما أوفّر هشتري هدية لماما.', { anim: 'cheer' });
          await ctx.scene('bedroom', { state: { night: true, lampOn: true, bedMade: true }, heroes: { moody: { x: 520, y: 480, dir: -1 }, aboody: { x: 610, y: 490, dir: -1 } } });
          await ctx.say('mama', 'يلا يا حبايبي، الساعة ٩. النوم بدري بيخلّينا ننشط بكرة.', { name: 'ماما' });
          const tq = await ctx.quiz.pair({ cat: ['time_money', 'logic'] });
          if (tq.firstTry >= 1 && pg.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('mama', 'قبل ما تناموا.. تحبوا تشكروا مين النهاردة؟', { name: 'ماما' });
          const th = await ctx.games.choice({
            prompt: 'نشكر مين النهاردة؟', options: [
              { text: 'ماما على الفطار والحب', art: 'mama', good: true, reply: [['moody', 'شكرًا يا ماما على كل حاجة.']] },
              { text: 'بابا على تعبه وشغله', art: 'baba', good: true, reply: [['aboody', 'شكرًا يا بابا.']] },
              { text: 'ربنا على كل النعم', art: 'sparkles', good: true, reply: [['moody', 'الحمد لله على كل نعمة.']] }]
          });
          ctx.diary.add({ id: 'home-m6', pic: ['mama', 'baba', 'sparkles'][th.index || 0] === 'sparkles' ? 'sparkles' : 'moon', text: ['شكرنا ماما ونمنا بدري', 'شكرنا بابا ونمنا بدري', 'قلنا الحمد لله ونمنا بدري'][th.index || 0] });
          await ctx.games.ritual({ text: 'باسمك اللهم', sub: 'قبل النوم' });
          st.state.lightsOff = true; ctx.sfx('click'); ctx.sfx('sleepy');
          st.play('moody', 'sleep', 6); st.play('aboody', 'sleep', 6); ctx.reward.star(1);
          await ctx.say('narrator', 'تصبحوا على خير يا أبطال البيت.');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
