/* Moody & Aboody - worlds/habits.js : WORLD 9 "عاداتي كل يوم" (6 missions) - wudu, the five prayers, daily duas, exercise, strangers, studying.
   Needs (loaded before): content/q_habits.js, worlds/habits_kits.js, worlds/habits_art.js.  Tokens {m} {a} {me} {t} {n} = names.
   Baba / Mama / Nana speak through ctx.say; Toota and Nemo are controllable heroes; Baba is a companion on stage in some missions. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const ALL4 = ['moody', 'aboody', 'toota', 'nemo'], ALL5 = ALL4.concat(['baba']);
  const mis = ctx => ctx.mistakes;
  /* a tier-6 + a tier-9 question with the mission tag */
  const pq = (ctx, tag) => ctx.quiz.pair({ aboody: M.pickQuestions({ tier: 6, tag, n: 1 })[0], moody: M.pickQuestions({ tier: 9, tag, n: 1 })[0] });
  /* the dua / dhikr button: the phrase is spoken as the instruction, then the child taps the big button */
  const rit = (ctx, text, sub, spoken, o) => { ctx.prompt(spoken || ('قولوا: ' + text + (sub ? ' ' + sub : ''))); return ctx.games.ritual(Object.assign({ text, sub, bottom: 300 }, o || {})); };
  /* hero positions on the floor (override per scene) */
  const at = o => Object.assign({ moody: { x: 600, y: 482, dir: -1 }, aboody: { x: 700, y: 494, dir: -1 }, toota: { x: 500, y: 486, dir: -1 }, nemo: { x: 800, y: 490, dir: -1 }, baba: { x: 400, y: 478, dir: 1 } }, o || {});
  /* item that is drawn as a picture with a small caption (for drag cards whose picture alone is ambiguous) */
  const cap = (art, label) => (g) => { A.draw(g, art, 0, -10, 70); G.text(g, label, 0, 36, { size: 19, color: M.pal.ink, stroke: '#fff', sw: 5 }); };
  const word = (label) => (g) => { G.fillRR(g, -62, -26, 124, 52, 16, '#fff', 4); G.text(g, label, 0, 1, { size: 27 }); };

  const V = M.registerValue;
  V('hb_worship', { label: 'العبادة والصلاة', desc: 'تعلّم الصلوات الخمس وأدب المسجد' });
  V('hb_wudu', { label: 'الوضوء', desc: 'ترتيب خطوات الوضوء والتسمية' });
  V('hb_cleanliness', { label: 'النظافة والطهارة', desc: 'نضافة الجسم قبل الصلاة وفي اليوم' });
  V('hb_dua', { label: 'أذكار اليوم', desc: 'أدعية قصيرة قبل الأكل وبعده وعند النوم والخروج' });
  V('hb_gratitude', { label: 'الحمد والشكر', desc: 'شكر ربنا وشكر الناس' });
  V('hb_health', { label: 'الصحة والرياضة', desc: 'تمرين وأكل صحي ونوم بدري وتوازن مع الشاشة' });
  V('hb_safety', { label: 'الأمان مع الغرباء', desc: 'عدم الذهاب مع غريب، كلمة السر، اجري واصرخ واحكي' });
  V('hb_diligence', { label: 'الاجتهاد والتفوّق', desc: 'خطة مذاكرة وعادات جيدة واحترام المدرّس' });

  M.registerWorld({
    id: 'habits', order: 9, title: 'عاداتي كل يوم', icon: 'w_habits', theme: { c1: '#ffe9a0', c2: '#f0b040' }, finalSticker: 'habit_hero',
    stickers: [
      { id: 'habit_wudu', title: 'متوضّئ نضيف', art: 'habit_wu:hands', bg: '#d8f0ff' }, { id: 'habit_salah', title: 'محب للصلاة', art: 'habit_mosque', bg: '#e1f6e8', rot: .06 },
      { id: 'habit_dua', title: 'أذكار اليوم', art: 'habit_hands', bg: '#fff0c4', rot: -.07 }, { id: 'habit_sport', title: 'جسم قوي', art: 'habit_dumbbell', bg: '#ffe3de' },
      { id: 'habit_safe', title: 'حذر وآمن', art: 'habit_shield', bg: '#d8e6ff', rot: .08 }, { id: 'habit_star', title: 'متفوّق', art: 'habit_medal', bg: '#fff3c4', rot: -.05 },
      { id: 'habit_hero', title: 'بطل العادات', art: 'w_habits', bg: '#ffe9a0', rot: -.04 }
    ],
    missions: [
      /* ============ 1) الوضوء ============ */
      {
        id: 'm1', title: 'الوضوء', intro: 'بابا بيعلّمنا الوضوء خطوة خطوة.. بالترتيب وبهدوء!', values: ['hb_wudu', 'hb_cleanliness', 'hb_worship', 'bismillah'], sticker: 'habit_wudu',
        heroes: ALL5, control: ALL4, wisdom: 'الوضوء نضافة للجسم وراحة للقلب', diary: { pic: 'habit_wu:face', text: 'اتعلمنا الوضوء مع بابا: بسم الله وبعدين الإيدين والوش والرجلين بالترتيب' },
        async run(ctx) {
          const st = ctx.stage, here = at({ moody: { x: 640, y: 482, dir: -1 }, aboody: { x: 740, y: 494, dir: -1 }, toota: { x: 560, y: 486, dir: -1 }, nemo: { x: 850, y: 490, dir: -1 }, baba: { x: 230, y: 478, dir: 1 } });
          let m0 = mis(ctx);
          await ctx.scene('habit_bath', { state: { water: 0 }, heroes: here });
          await ctx.say('baba', 'السلام عليكم يا أبطال! الصلاة قربت، يلا نتوضأ.');
          await ctx.say('aboody', 'أنا بغسل إيدي بس وبعدين أجري!');
          await ctx.say('baba', 'هههه لأ يا {a}. الوضوء ليه ترتيب حلو، وبنعمله بهدوء.');
          await ctx.say('toota', 'أنا هساعدكم. الأول رتّبوا الخطوات صح.');
          const sq = await ctx.games.sequence({
            prompt: 'رتّبوا خطوات الوضوء', steps: [
              { art: 'habit_wu:hands', label: 'الإيدين' }, { art: 'habit_wu:mouth', label: 'المضمضة' }, { art: 'habit_wu:nose', label: 'الأنف' }, { art: 'habit_wu:face', label: 'الوش' },
              { art: 'habit_wu:arms', label: 'الدراعين' }, { art: 'habit_wu:head', label: 'مسح الراس' }, { art: 'habit_wu:feet', label: 'الرجلين' }]
          });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes(here);
          await ctx.say('baba', 'برافو! دلوقتي نعملها بجد. وأول حاجة نقولها: بسم الله.');
          await rit(ctx, 'بسم الله', 'نبدأ الوضوء');
          ctx.value('bismillah');
          M.tw(st.state, { water: 1 }, .6, 'inOut');
          await ctx.games.habitTapper({
            card: true, heroes: 'hidden', steps: [
              { text: 'اغسل إيديك', sub: '٣ مرات', times: 3, art: 'habit_wu:hands', water: true, prompt: 'اغسل إيديك تلات مرات' },
              { text: 'تمضمض', sub: '٣ مرات', times: 3, art: 'habit_wu:mouth', water: true, prompt: 'تمضمض بالميّه تلات مرات' },
              { text: 'ميّه للمناخير', sub: '٣ مرات', times: 3, art: 'habit_wu:nose', water: true, prompt: 'دخّل ميّه خفيفة في مناخيرك وانفضها تلات مرات' },
              { text: 'اغسل وشك', sub: '٣ مرات', times: 3, art: 'habit_wu:face', water: true, prompt: 'اغسل وشك تلات مرات' },
              { text: 'اغسل دراعيك', sub: 'لحد الكوع', times: 3, art: 'habit_wu:arms', water: true, prompt: 'اغسل دراعك اليمين وبعدين الشمال لحد الكوع' },
              { text: 'امسح راسك وودانك', sub: 'مرة واحدة', times: 1, art: 'habit_wu:head', water: false, prompt: 'امسح راسك وودانك بإيدك المبلولة مرة واحدة' },
              { text: 'اغسل رجليك', sub: 'لحد الكعب', times: 3, art: 'habit_wu:feet', water: true, prompt: 'اغسل رجلك اليمين وبعدين الشمال لحد الكعب' }]
          });
          M.tw(st.state, { water: 0 }, .4, 'inOut'); ctx.heroes(here);
          await ctx.say('baba', 'تمام! وضوء كامل. بس خلّوا بالكم: الميّه نعمة.');
          const ch = await ctx.games.choice({
            prompt: 'الميّه نعمة.. نستعملها إزاي؟', options: [
              { text: 'نسيب الحنفية مفتوحة طول الوقت', art: 'habit_tap', good: false, consequence: [['baba', 'لأ يا حبيبي، الميّه كده بتروح على الفاضي.'], ['aboody', 'آسف! هقفلها.']] },
              { text: 'نفتحها على قد الحاجة ونقفلها', art: 'water', good: true, reply: [['baba', 'برافو! حتى في الوضوء ما نسرفش في الميّه.'], ['nemo', 'الميّه غالية علينا كلنا.']] },
              { text: 'نرش الميّه على بعض', art: 'habit_drop', good: false, consequence: [['toota', 'اللعب بالميّه حلو بس مش وقته دلوقتي.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('hb_cleanliness');
          await ctx.say('baba', 'وبعد الوضوء بنقول: أشهد أن لا إله إلا الله وحده لا شريك له، وأشهد أن محمدًا عبده ورسوله.');
          await rit(ctx, 'أشهد أن لا إله إلا الله', 'وأشهد أن محمدًا عبده ورسوله', 'قولوا: أشهد أن لا إله إلا الله وأشهد أن محمدًا عبده ورسوله');
          ctx.value('hb_worship');
          await ctx.say('baba', 'الله يبارك فيكم! دلوقتي أنتم جاهزين للصلاة.', { anim: 'cheer' });
          m0 = mis(ctx);
          await ctx.say('narrator', 'سؤالين عن الوضوء!');
          const q = await pq(ctx, 'hb1');
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          return ctx.nav.complete();
        }
      },
      /* ============ 2) الصلوات الخمس ============ */
      {
        id: 'm2', title: 'الصلوات الخمس', intro: 'خمس صلوات في اليوم.. نعرف أسماءها ومواعيدها ونتعلم الأدب.', values: ['hb_worship', 'manners', 'quiet'], sticker: 'habit_salah',
        heroes: ALL5, control: ALL4, wisdom: 'الصلاة نور وراحة.. وبنتعلمها شوية شوية مع بابا', diary: { pic: 'habit_mosque', text: 'عرفنا الصلوات الخمس ومواعيدها وكام ركعة، وإزاي ندخل المسجد بأدب' },
        async run(ctx) {
          const st = ctx.stage, here = at({ moody: { x: 600, y: 482, dir: -1 }, aboody: { x: 700, y: 494, dir: -1 }, toota: { x: 500, y: 486, dir: -1 }, nemo: { x: 800, y: 490, dir: -1 }, baba: { x: 380, y: 478, dir: 1 } });
          let m0 = mis(ctx);
          await ctx.scene('habit_prayroom', { state: {}, heroes: here });
          await ctx.say('baba', 'يا أبطال، بنصلي خمس صلوات في اليوم والليلة. النهاردة نتعرف عليهم.');
          await ctx.say('toota', 'أنا بحفظ أسمائهم: الفجر والظهر والعصر والمغرب والعشاء.');
          await ctx.say('baba', 'وكل صلاة ليها وقتها في اليوم. الشمس بتساعدنا نعرف.');
          const names = [['fajr', 'الفجر'], ['dhuhr', 'الظهر'], ['asr', 'العصر'], ['maghrib', 'المغرب'], ['isha', 'العشاء']];
          const items = U.shuffle(names.map(n => ({ id: n[0], to: n[0], label: n[1] }))).map((it, i) => ({ id: it.id, to: it.to, x: 200 + i * 140, y: 176, s: 100, draw: word(it.label) }));
          const tdx = [130, 295, 480, 665, 830];
          const dt = await ctx.games.dragdrop({
            prompt: 'وصّلوا كل صلاة بوقتها من الصبح لحد الليل', heroes: 'corner', panel: { x: 110, y: 118, w: 740, h: 118 }, wrongHint: 'بُصّ على الشمس والقمر في الصورة.. هي دي وقتها؟', items,
            targets: names.map((n, i) => ({ id: n[0], x: tdx[i], y: 352, w: 140, h: 150, art: 'habit_time:' + n[0], s: 136, cols: 1, dy0: 84, itemScale: .8 }))
          });
          if (dt.mistakes - 0 <= 3) ctx.reward.star(1);
          ctx.heroes(here);
          await ctx.say('baba', 'ما شاء الله! الفجر قبل الشمس تطلع، والظهر لما الشمس تعلى، والعصر بعد الظهر، والمغرب لما تغيب، والعشاء بالليل.');
          await ctx.say('baba', 'وكل صلاة عدد ركعاتها غير التانية. الفجر ركعتين، والمغرب تلات، والباقي أربع.');
          const mk = (id, to, label, x) => ({ id, to, x, y: 176, s: 100, draw: word(label) });
          const rk = await ctx.games.dragdrop({
            prompt: 'كام ركعة في كل صلاة؟', heroes: 'corner', panel: { x: 110, y: 118, w: 740, h: 118 }, wrongHint: 'الفجر ٢، المغرب ٣، والظهر والعصر والعشاء ٤', items: U.shuffle([['fajr', 'two', 'الفجر'], ['dhuhr', 'four', 'الظهر'], ['asr', 'four', 'العصر'], ['maghrib', 'three', 'المغرب'], ['isha', 'four', 'العشاء']]).map((p, i) => mk(p[0], p[1], p[2], 200 + i * 140)),
            targets: [['two', 'ركعتين', 200], ['three', '٣ ركعات', 480], ['four', '٤ ركعات', 760]].map(p => ({ id: p[0], x: p[2], y: 362, w: 190, h: 140, cols: 2, dx: 90, dy0: 8, itemScale: .75, draw: (g) => { G.fillRR(g, -92, -68, 184, 136, 20, 'rgba(255,255,255,.88)', 4); G.text(g, p[1], 0, -44, { size: 34, color: '#c25a00' }); } }))
          });
          if (rk.mistakes <= 3 && mis(ctx) - m0 <= 5) ctx.reward.star(1);
          ctx.heroes(here);
          await ctx.say('baba', 'دلوقتي حركات الصلاة. أنا هعلّمكم الأساسيات.. وشوية شوية هنتعلم الباقي.');
          const sq = await ctx.games.sequence({
            prompt: 'رتّبوا حركات الصلاة', steps: [
              { art: 'habit_pose:takbir', label: 'تكبير' }, { art: 'habit_pose:stand', label: 'قيام' }, { art: 'habit_pose:ruku', label: 'ركوع' },
              { art: 'habit_pose:sujood', label: 'سجود' }, { art: 'habit_pose:julus', label: 'جلوس' }, { art: 'habit_pose:salam', label: 'تسليم' }]
          });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          await ctx.scene('habit_prayroom', { state: { pose: 'stand' }, heroes: 'hidden' });
          await ctx.say('baba', 'يلا نتدرّب مع بعض كأننا بنصلي. هتدوسوا على الزرار وتتابعوا الحركات.');
          const pose = p => () => { st.state.pose = p; };
          await ctx.games.habitTapper({
            side: 'right', heroes: 'hidden', steps: [
              { text: 'الله أكبر', sub: 'تكبير', prompt: 'قولوا الله أكبر وارفعوا إيديكم', onTap: pose('takbir'), hold: 1.1 },
              { text: 'قيام', sub: 'نقرأ الفاتحة', prompt: 'نقف ونقرأ الفاتحة', onTap: pose('stand'), hold: 1.1 },
              { text: 'ركوع', sub: 'سبحان ربي العظيم', prompt: 'نركع ونقول سبحان ربي العظيم', onTap: pose('ruku'), hold: 1.1 },
              { text: 'سجود', sub: 'سبحان ربي الأعلى', prompt: 'نسجد ونقول سبحان ربي الأعلى', onTap: pose('sujood'), hold: 1.1 },
              { text: 'جلوس', sub: 'نجلس بهدوء', prompt: 'نجلس بهدوء', onTap: pose('julus'), hold: 1.1 },
              { text: 'تسليم', sub: 'السلام عليكم ورحمة الله', prompt: 'نسلّم عن اليمين والشمال: السلام عليكم ورحمة الله', onTap: pose('salam'), hold: 1.1 }]
          });
          ctx.value('hb_worship');
          await ctx.scene('habit_mosque', { state: {}, heroes: at({ moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 400, y: 494, dir: 1 }, toota: { x: 200, y: 486, dir: 1 }, nemo: { x: 110, y: 490, dir: 1 }, baba: { x: 500, y: 478, dir: 1 } }) });
          await ctx.say('baba', 'ولما نروح المسجد، المسجد بيت من بيوت ربنا.');
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'وصلنا المسجد. نعمل إيه؟', options: [
              { text: 'نجري ونعلّي صوتنا', art: 'ball', good: false, consequence: [['baba', 'لأ يا حبيبي، في المسجد بنهدى عشان نخشع ومنزعجش الناس اللي بتصلي.'], ['aboody', 'آسف يا بابا.']] },
              { text: 'نقلع الجزم ونحطها على الرف وندخل بهدوء', art: 'habit_rack', good: true, reply: [['baba', 'برافو! كده أدب المسجد.'], ['nemo', 'وأقفل صوت الموبايل كمان.']] },
              { text: 'نرمي الجزم قدام الباب', art: 'habit_shoe:red', good: false, consequence: [['toota', 'الجزم لها مكان مخصوص على الرف.']] }]
          });
          if (ch.firstTry && mis(ctx) - m0 <= 3) ctx.reward.star(1);
          ctx.value('manners'); ctx.value('quiet');
          await ctx.say('narrator', 'سؤالين عن الصلاة!');
          const q = await pq(ctx, 'hb2');
          await ctx.say('baba', 'ما شاء الله عليكم! ربنا يعيننا نصلي كلنا مع بعض.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 3) أدعية اليوم ============ */
      {
        id: 'm3', title: 'أدعية اليوم', intro: 'يوم كامل مع كلمات حلوة بنقولها لربنا.', values: ['hb_dua', 'hb_gratitude', 'bismillah', 'thanks'], sticker: 'habit_dua',
        heroes: ALL4, control: ALL4, wisdom: 'كلمة حلوة لربنا في كل وقت: بسم الله والحمد لله', diary: { pic: 'habit_hands', text: 'قلنا دعاء الصحيان والأكل والخروج والنوم وقلنا السلام عليكم والحمد لله' },
        async run(ctx) {
          const here = at({ moody: { x: 560, y: 482, dir: -1 }, aboody: { x: 660, y: 494, dir: -1 }, toota: { x: 460, y: 486, dir: -1 }, nemo: { x: 770, y: 490, dir: -1 } });
          let m0 = mis(ctx);
          await ctx.scene('habit_bedroom', { state: { night: false }, heroes: here });
          await ctx.say('mama', 'صباح الخير يا حبايبي! يلا اصحوا، يوم جديد.');
          await ctx.say('nemo', 'أنا فاكرة الدعاء بتاع الصحيان!');
          await ctx.say('mama', 'قولوا معايا: الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور.');
          await rit(ctx, 'الحمد لله', 'الذي أحيانا بعد ما أماتنا وإليه النشور', 'قولوا: الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور');
          ctx.value('hb_dua');
          await ctx.scene('habit_dining', { state: {}, heroes: here });
          await ctx.say('mama', 'الفطار جاهز! قبل ما نبدأ نقول إيه؟');
          await rit(ctx, 'بسم الله', 'قبل الأكل', 'قبل الأكل نقول: بسم الله'); ctx.value('bismillah');
          ctx.stage.state.eaten = true; ctx.sfx('good'); await ctx.wait(1.4);
          await ctx.say('moody', 'شبعت! الأكل كان جميل.');
          await rit(ctx, 'الحمد لله', 'بعد الأكل', 'بعد الأكل نقول: الحمد لله'); ctx.value('thanks');
          await ctx.say('nemo', 'يلا نشوف مين فاكر الدعاء المناسب لكل صورة!');
          const mt = await ctx.games.habitMatch({
            prompt: 'وصّلوا كل صورة بالكلمة اللي نقولها', pairs: [
              { k: 'eat', art: 'habit_sit:eat', label: 'بسم الله' }, { k: 'after', art: 'habit_sit:afteat', label: 'الحمد لله' }, { k: 'greet', art: 'habit_sit:greet', label: 'السلام عليكم' },
              { k: 'wake', art: 'habit_sit:wake', label: 'الحمد لله الذي أحيانا بعد ما أماتنا وإليه النشور', small: true }, { k: 'sleep', art: 'habit_sit:sleep', label: 'باسمك اللهم أموت وأحيا', small: true },
              { k: 'leave', art: 'habit_sit:leave', label: 'بسم الله توكلت على الله ولا حول ولا قوة إلا بالله', small: true }]
          });
          if (mt.mistakes <= 2) ctx.reward.star(1);
          await ctx.scene('habit_door', { state: { open: 0 }, heroes: at({ moody: { x: 560, y: 482, dir: -1 }, aboody: { x: 660, y: 494, dir: -1 }, toota: { x: 460, y: 486, dir: -1 }, nemo: { x: 770, y: 490, dir: -1 } }) });
          await ctx.say('mama', 'يلا على المدرسة! وقبل ما نخرج من البيت؟');
          await rit(ctx, 'بسم الله', 'توكلت على الله ولا حول ولا قوة إلا بالله', 'قولوا: بسم الله توكلت على الله ولا حول ولا قوة إلا بالله');
          M.tw(ctx.stage.state, { open: 1 }, .8, 'inOut'); await ctx.wait(.9);
          await ctx.say('aboody', 'السلام عليكم يا طنط! صباح الخير!', { anim: 'wave' });
          await ctx.say('narrator', 'وبعد يوم حلو في المدرسة.. بابا جاب لكم هدية بسيطة.');
          const ch = await ctx.games.choice({
            prompt: 'بابا جاب هدية حلوة. نقول إيه؟', options: [
              { text: 'الحمد لله.. شكرًا يا بابا', art: 'heartbig', good: true, reply: [['baba', 'الله يبارك فيكم يا أحلى ولاد.']] },
              { text: 'جزاك الله خيرًا يا بابا', art: 'habit_sit:nice', good: true, reply: [['baba', 'وجزاكم الله خير على أدبكم.']] },
              { text: 'دي ليا أنا بس وملكمش دعوة', art: 'sad', good: false, consequence: [['toota', 'لأ يا حبيبي، الهدية نعمة ونشكر ربنا ونشاركها.'], ['moody', 'ونقول شكرًا لبابا.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('hb_gratitude');
          await ctx.scene('habit_bedroom', { state: { night: true }, heroes: at({ moody: { x: 560, y: 482, dir: -1 }, aboody: { x: 660, y: 494, dir: -1 }, toota: { x: 460, y: 486, dir: -1 }, nemo: { x: 770, y: 490, dir: -1 } }) });
          await ctx.say('mama', 'خلصنا يوم جميل. يلا ننام بدري.. وقبل النوم نقول؟');
          await rit(ctx, 'باسمك اللهم', 'أموت وأحيا', 'قولوا: باسمك اللهم أموت وأحيا');
          ctx.stage.state.sleeping = true;
          await ctx.say('mama', 'تصبحوا على خير يا حبايبي. نوم الهنا.', { anim: 'wave' });
          m0 = mis(ctx);
          const q = await pq(ctx, 'hb3');
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          return ctx.nav.complete();
        }
      },
      /* ============ 4) جسم قوي وعقل قوي ============ */
      {
        id: 'm4', title: 'جسم قوي وعقل قوي', intro: 'توتا المدرّبة النهاردة.. تمرين وأكل صحي ونوم بدري!', values: ['hb_health', 'healthy', 'sleep', 'screen'], sticker: 'habit_sport',
        heroes: ALL4, control: ALL4, wisdom: 'الجسم القوي والعقل القوي بيبدأوا بحركة وأكل صحي ونوم بدري', diary: { pic: 'habit_dumbbell', text: 'اتمرنّا مع توتا وعدّينا القفزات واخترنا الأكل الصحي والنوم بدري' },
        async run(ctx) {
          const st = ctx.stage, here = at({ moody: { x: 280, y: 482, dir: 1 }, aboody: { x: 400, y: 494, dir: 1 }, toota: { x: 160, y: 486, dir: 1 }, nemo: { x: 520, y: 490, dir: 1 } });
          let m0 = mis(ctx);
          await ctx.scene('habit_yard', { state: {}, heroes: here });
          await ctx.say('toota', 'أنا المدرّبة النهاردة! الرياضة بتقوّي الجسم وبتفتّح الدماغ.', { anim: 'wave' });
          await ctx.say('nemo', 'وبتفرّح كمان!');
          await ctx.say('aboody', 'أنا جاهز! يلا نجري!');
          await ctx.say('toota', 'استنى يا {a}. الأول نسخّن عشان عضلاتنا متتعبش.');
          const jumpAll = () => st.present().forEach(k => st.play(k, 'jump', .45));
          const arm = () => st.present().forEach(k => st.play(k, 'wave', .45));
          await ctx.games.habitTapper({
            count: true, side: 'right', heroes: here, steps: [
              { text: 'سخّن', sub: 'لفّ دراعك', times: 5, prompt: 'سخّنوا: لفّوا دراعكم وعدّوا لحد ٥', onTap: arm, hold: .9 },
              { text: 'اقفز!', sub: 'عدّ معانا', times: 10, prompt: 'اقفزوا وعدّوا لحد ١٠', onTap: jumpAll, hold: .9 }]
          });
          ctx.heroes(here); ctx.react('good', 'both');
          await ctx.say('toota', 'عظمة! بس ده مش كل التمرين.. فاكرين ترتيبه؟');
          const sq = await ctx.games.sequence({
            prompt: 'رتّبوا خطوات التمرين', steps: [{ art: 'habit_ex:warm', label: 'تسخين' }, { art: 'habit_ex:jump', label: 'قفز' }, { art: 'habit_ex:stretch', label: 'تمدّد' }, { art: 'habit_ex:water', label: 'نشرب ميّه' }]
          });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes(here);
          await ctx.say('toota', 'الجسم محتاج كمان أكل كويس ونوم كفاية. وزّعوا الحاجات دي.');
          const mkI = (id, to, art, label, x, hint) => ({ id, to, x, y: 190, s: 76, hint, draw: cap(art, label) });
          const dd = await ctx.games.dragdrop({
            prompt: 'إيه اللي بيقوّي جسمنا وإيه نقلّل منه؟', heroes: 'corner', panel: { x: 90, y: 118, w: 780, h: 150 }, wrongHint: 'فكّر: ده بيقوّينا ولا بيتعبنا؟', items: U.shuffle([
              ['ap', 'good', 'apple', 'فاكهة'], ['ca', 'good', 'carrot', 'خضار'], ['wa', 'good', 'water', 'ميّه'], ['mi', 'good', 'milk', 'لبن'], ['be', 'good', 'habit_bed', 'نوم بدري'], ['ch', 'less', 'chips', 'شيبسي'], ['so', 'less', 'soda', 'صودا'], ['la', 'less', 'habit_late', 'سهر']]).map((p, i) => mkI(p[0], p[1], p[2], p[3], 150 + i * 88, p[1] === 'less' ? 'ده نقلّل منه' : 'ده بيقوّي جسمنا')),
            targets: [{ id: 'good', x: 270, y: 415, w: 270, h: 120, cols: 5, dx: 44, dy0: -6, itemScale: .6, draw: (g) => { G.fillRR(g, -135, -62, 270, 124, 22, 'rgba(210,245,200,.92)', 4.5); G.text(g, 'بيقوّي جسمنا', 0, -44, { size: 24, color: '#2f7a3a' }); } },
              { id: 'less', x: 690, y: 415, w: 270, h: 120, cols: 5, dx: 44, dy0: -6, itemScale: .6, draw: (g) => { G.fillRR(g, -135, -62, 270, 124, 22, 'rgba(255,225,215,.92)', 4.5); G.text(g, 'نقلّل منه', 0, -44, { size: 24, color: '#b0402a' }); } }]
          });
          if (dd.mistakes <= 3) ctx.reward.star(1);
          ctx.heroes(here);
          await ctx.say('toota', 'وبابا دايمًا بيقول: قال النبي صلى الله عليه وسلم: المؤمن القوي خير وأحب إلى الله من المؤمن الضعيف.');
          m0 = mis(ctx);
          const ch = await ctx.games.choice({
            prompt: 'عندنا ساعتين فاضيين بعد المدرسة. نعمل إيه؟', options: [
              { text: 'تابلت لحد ما نزهق', art: 'tablet', good: false, consequence: [['nemo', 'الشاشة كتير بتتعب عنينا وبتخلّينا مش نتحرك.'], ['toota', 'نختار وقت محدد.']] },
              { text: 'شوية تابلت، وبعدين رياضة ومذاكرة', art: 'clock', good: true, reply: [['toota', 'برافو! توازن حلو بين الشاشة والحركة.']] },
              { text: 'نسهر نلعب لحد الصبح', art: 'habit_late', good: false, consequence: [['moody', 'السهر بيتعب جسمنا وبيصعّب المذاكرة.']] }]
          });
          ctx.value('screen'); ctx.value('sleep');
          const q = await pq(ctx, 'hb4');
          if (ch.firstTry && q.firstTry >= 1 && mis(ctx) - m0 <= 3) ctx.reward.star(1);
          await ctx.say('toota', 'جسم قوي وعقل قوي.. يلا بينا!', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 5) حد ناداك في الشارع ============ */
      {
        id: 'm5', title: 'حد ناداك في الشارع', intro: 'مواقف جديدة: عربية بتقف، وحد بيقول ماما بعتتني.. نعمل إيه؟', values: ['hb_safety', 'stranger', 'permission'], sticker: 'habit_safe',
        heroes: ALL4, control: ALL4, wisdom: 'منروحش مع حد من غير ما نسأل ماما وبابا.. نجري ونصرخ ونحكي', diary: { pic: 'habit_shield', text: 'اتعلمت قاعدة بابا: مروحش مع حد من غير ما أسأل. وأعرف أجري وأصرخ وأحكي' },
        async run(ctx) {
          const st = ctx.stage, here = at({ moody: { x: 220, y: 482, dir: 1 }, aboody: { x: 330, y: 494, dir: 1 }, toota: { x: 120, y: 486, dir: 1 }, nemo: { x: 430, y: 490, dir: 1 } });
          const strangerSay = (text) => ctx.say('habit_person:stranger', text, { name: 'راجل غريب' });
          let m0 = mis(ctx), first = 0;
          await ctx.scene('habit_street', { state: {}, heroes: here });
          await ctx.say('baba', 'يا أبطال، إحنا اتعلمنا الأمان في الشارع قبل كده. النهاردة مواقف جديدة.');
          await ctx.say('baba', 'قاعدة بابا: منروحش مع أي حد من غير ما نسأل ماما وبابا الأول.');
          await ctx.say('mama', 'وعندنا كلمة سر للعيلة بس. النهاردة كلمة التمرين: برتقالة. وكلمتنا الحقيقية بنختارها في البيت.');
          await rit(ctx, 'هستأذن الأول', 'قاعدة بابا', 'قولوا: مش هروح مع حد من غير ما أستأذن');
          /* 1: a car stops */
          st.state.car = { x: 740, y: 372, s: 240 };
          await ctx.say('narrator', 'عربية وقفت جنبنا، وراجل غريب بيناديكم من الشباك.');
          await strangerSay('يا حبيبي تعالى هنا شوية، عايز أسألك عن حاجة.');
          const c1 = await ctx.games.choice({
            prompt: 'عربية وقفت وراجل غريب بينادي علينا. نعمل إيه؟', options: [
              { text: 'نقرّب من العربية عشان نسمعه', art: 'habit_car', good: false, consequence: [['toota', 'لأ! منقربش من عربية غريب. ممكن يمسكنا.'], ['aboody', 'آسف.. خوفت.']] },
              { text: 'نبعد عن العربية ونمشي لحد نثق فيه', art: 'habit_shield', good: true, reply: [['toota', 'برافو! نبعد ونروح لمكان فيه ناس.'], ['moody', 'ومنردش عليه ولا نقرّب.']] },
              { text: 'نركب معاه عشان يوصّلنا', art: 'habit_run', good: false, consequence: [['moody', 'أبدًا! منركبش مع غريب حتى لو قال أي حاجة.']] }]
          });
          if (c1.firstTry) first++; ctx.value('hb_safety');
          st.state.car = null;
          /* 2: "mama sent me" */
          st.state.person = { x: 700, y: 360, s: 150, kind: 'stranger' };
          await ctx.say('narrator', 'وراجل تاني وقف قدامنا.');
          await strangerSay('أنا صاحب ماما! هي بعتتني أوصّلكم البيت. يلا اركبوا بسرعة.');
          await ctx.say('toota', 'استنى.. هو يعرف كلمة السر؟');
          const c2 = await ctx.games.choice({
            prompt: 'حد بيقول ماما بعتتني. نعمل إيه؟', options: [
              { text: 'نصدّقه لأنه قال اسم ماما', art: 'heartbig', good: false, consequence: [['moody', 'الغريب ممكن يعرف الاسم. لازم كلمة السر.']] },
              { text: 'نسأله على كلمة السر، ولو ميعرفهاش نبعد ونكلّم ماما أو بابا', art: 'habit_secret', good: true, reply: [['habit_person:stranger', 'كلمة سر؟ مش فاكرها..', { name: 'راجل غريب' }], ['toota', 'يبقى مش من ماما. مش هنروح معاه. هنكلّم ماما.']] },
              { text: 'نديله رقم ماما وعنواننا', art: 'habit_phone', good: false, consequence: [['nemo', 'لأ! معلوماتنا مش للغريب.']] }]
          });
          if (c2.firstTry) first++;
          /* 3: puppy / sweets */
          st.state.person = { x: 700, y: 360, s: 150, kind: 'stranger' };
          await strangerSay('معايا كلب صغير تايه وحلويات.. تعالوا معايا نلاقي صاحبه وأديكم حلوى!');
          await ctx.say('aboody', 'كلب صغير! وحلويات!');
          const c3 = await ctx.games.choice({
            prompt: 'غريب عايز نروح معاه عشان كلب وحلوى. نعمل إيه؟', options: [
              { text: 'نروح معاه نساعده', art: 'habit_puppy', good: false, consequence: [['toota', 'الكبار بيدوّروا مع كبار. مش بيطلبوا من الأطفال يروحوا معاهم.']] },
              { text: 'نقول: لأ شكرًا! ونسأل ماما وبابا', art: 'habit_shield', good: true, reply: [['moody', 'لأ شكرًا. اسأل الكبار أو الشرطي.', { anim: 'wave' }], ['baba', 'فخور بيكم!']] },
              { text: 'ناخد الحلوى بس', art: 'candy', good: false, consequence: [['moody', 'منخدش حاجة من حد منعرفوش.']] }]
          });
          if (c3.firstTry) first++;
          st.state.person = null;
          if (first >= 3) ctx.reward.star(1);
          await ctx.say('nemo', 'وعلى الموبايل وعلى النت نفس القاعدة: لو غريب كلّمني وطلب عنواني أو صوري، مش برد وأحكي لماما وبابا.');
          /* run, shout, tell */
          await ctx.say('toota', 'ولو حد مسك إيدك أو خوّفك؟ فيه تلات خطوات.');
          const sq = await ctx.games.sequence({ prompt: 'رتّبوا: اجري، اصرخ، احكي', steps: [{ art: 'habit_run', label: 'اجري' }, { art: 'habit_shout', label: 'اصرخ' }, { art: 'habit_tell', label: 'احكي لكبير' }] });
          /* lost */
          await ctx.scene('habit_mall', { state: {}, heroes: at({ moody: { x: 600, y: 482, dir: -1 }, aboody: { x: 690, y: 494, dir: -1 }, toota: { x: 270, y: 486, dir: 1 }, nemo: { x: 360, y: 490, dir: 1 } }) });
          await ctx.say('narrator', 'يا خبر! اتوهنا في المول ومش لاقيين ماما. أهم حاجة نهدى.');
          await ctx.games.hidden({
            prompt: 'دوّروا على ناس نثق فيهم: الأمن والشرطي وصاحب المحل', noWalk: true, spots: [
              { id: 'g', art: 'habit_person:guard', x: 480, y: 370, s: 140, hit: 80, anim: 'wave', listArt: 'habit_person:guard', onFound: () => ctx.say('habit_person:guard', 'أنا من الأمن. تعالوا هنا وأنا أساعدكم.', { name: 'أمن المول' }) },
              { id: 'p', art: 'habit_person:police', x: 130, y: 365, s: 140, hit: 80, anim: 'wave', listArt: 'habit_person:police', onFound: () => ctx.say('habit_person:police', 'أنا شرطي. لو تهتوا تعالوا لي.', { name: 'الشرطي' }) },
              { id: 's', art: 'habit_person:shop', x: 840, y: 365, s: 140, hit: 80, anim: 'wave', listArt: 'habit_person:shop', onFound: () => ctx.say('habit_person:shop', 'أنا صاحب المحل. اقعدوا هنا لحد ما أهلكم يوصلوا.', { name: 'صاحب المحل' }) }]
          });
          ctx.heroes(at({ moody: { x: 600, y: 482, dir: -1 }, aboody: { x: 690, y: 494, dir: -1 }, toota: { x: 270, y: 486, dir: 1 }, nemo: { x: 360, y: 490, dir: 1 } }));
          await strangerSay('أنا أعرف بابا! تعالوا معايا أوديكم له بسرعة.');
          const c4 = await ctx.games.choice({
            prompt: 'واحد غريب بيقول أنا أعرف بابا، تعالوا معايا. نعمل إيه؟', options: [
              { text: 'نروح معاه عشان بيعرف بابا', art: 'habit_run', good: false, consequence: [['toota', 'لأ! منروحش مع غريب، حتى لو قال إنه يعرف بابا.']] },
              { text: 'نفضل مكاننا ونقول للأمن يكلّم بابا', art: 'habit_person:guard', good: true, reply: [['habit_person:guard', 'أيوه كده. اديني رقم بابا وأنا هتصل.', { name: 'أمن المول' }]] },
              { text: 'نمشي نلف ندوّر لوحدنا', art: 'arrow', good: false, consequence: [['moody', 'لو مشينا ممكن نتوه أكتر. نفضل مكاننا ونطلب مساعدة.']] }]
          });
          if (c4.firstTry) first += 10;
          await ctx.say('baba', 'وعشان الأمن يتصل بيا لازم تحفظوا رقمي. ده رقم تمرين مش رقمي الحقيقي: ٠١٢ ٣٤٥ ٦٧٨٩.');
          await ctx.say('baba', 'ركّزوا فيه.. وبعدين رتّبوا أجزاءه.');
          const ph = await ctx.games.sequence({ prompt: 'رتّبوا أجزاء رقم التمرين', steps: [{ label: '٠١٢' }, { label: '٣٤٥' }, { label: '٦٧٨٩' }] });
          if (sq.mistakes <= 1 && ph.mistakes <= 2) ctx.reward.star(1);
          m0 = mis(ctx);
          const q = await pq(ctx, 'hb5');
          if ((first >= 10) && q.firstTry >= 1) ctx.reward.star(1);
          await ctx.say('baba', 'برافو عليكم! ده مش خوف.. ده وعي. وفي أي موقف: اسألوا ماما وبابا الأول.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 6) مذاكرة وتفوّق ============ */
      {
        id: 'm6', title: 'مذاكرة وتفوّق', intro: 'توتا ونيمو وبابا بيعلّمونا نذاكر صح ونبقى من المتفوقين!', values: ['hb_diligence', 'study', 'respect', 'hb_gratitude'], sticker: 'habit_star',
        heroes: ALL5, control: ALL4, wisdom: 'التفوّق مش سحر.. هو عادات حلوة كل يوم وحب للعلم', diary: { pic: 'habit_medal', text: 'عملت خطة مذاكرة ونضّفت مكتبي وخدت ميدالية التفوّق' },
        async run(ctx) {
          const st = ctx.stage, here = at({ moody: { x: 500, y: 482, dir: 1 }, aboody: { x: 600, y: 494, dir: 1 }, toota: { x: 400, y: 486, dir: 1 }, nemo: { x: 700, y: 490, dir: -1 }, baba: { x: 820, y: 478, dir: -1 } });
          let m0 = mis(ctx);
          await ctx.scene('habit_desk', { state: { clean: false }, heroes: here });
          await ctx.say('baba', 'يا أبطال، التفوّق مش سحر. التفوّق عادات حلوة كل يوم. وأول كلمة نزلت في القرآن كانت: اقرأ.');
          await ctx.say('toota', 'أنا في تانية ثانوي وبذاكر كل يوم كده. هوريكم خطتي.');
          await ctx.say('nemo', 'وأنا هساعد {a} في الدروس!');
          await ctx.say('toota', 'الأول، مكتب نضيف يساعدنا نركّز. شيلوا اللي يشتّتنا.');
          const f = await ctx.games.hidden({
            prompt: 'نضّفوا المكتب: شيلوا الموبايل واللعب والحاجات الوحشة', hintAfter: 14, spots: [
              { id: 'ph', art: 'habit_phone', x: 420, y: 262, s: 54, listArt: 'habit_phone', onFound: () => ctx.say('toota', 'الموبايل بعيد وقت المذاكرة.') },
              { id: 'ball', art: 'ball', x: 330, y: 452, s: 52, needs: 'small', walkOff: 0, listArt: 'ball', needsMsg: 'الكورة تحت المكتب! محتاجين حد صغير', onFound: () => ctx.say('nemo', 'الكورة بعدين في اللعب.') },
              { id: 'chips', art: 'chips', x: 780, y: 110, s: 50, needs: 'tall', walkOff: 0, listArt: 'chips', needsMsg: 'الشيبسي فوق الرف! محتاجين {m} الطويل', onFound: () => ctx.say('moody', 'الفتات بيوسّخ الكتب!') }]
          });
          st.state.clean = true; ctx.heroes(here);
          if (f.wrong <= 3) ctx.reward.star(1);
          await ctx.say('toota', 'مكتب نضيف ومرتّب! دلوقتي نرتّب الخطة.');
          m0 = mis(ctx);
          const sq = await ctx.games.sequence({
            prompt: 'رتّبوا خطة المذاكرة', steps: [{ art: 'habit_desk', label: 'نرتّب المكتب' }, { art: 'notebook', label: 'الواجب الأول' }, { art: 'habit_review', label: 'نراجع الدرس' }, { art: 'habit_read', label: 'نقرأ قصة' }, { art: 'habit_rest', label: 'نرتاح ونلعب' }]
          });
          ctx.heroes(here);
          await ctx.say('baba', 'وفيه عادات تساعدنا. وفيه عادات تضيّع وقتنا. شوفوا دول.');
          const mkI = (id, to, art, label, x, hint) => ({ id, to, x, y: 190, s: 76, hint, draw: cap(art, label) });
          const dd = await ctx.games.dragdrop({
            prompt: 'إيه اللي بيخلّينا متفوّقين وإيه اللي بيضيّع وقتنا؟', heroes: 'corner', panel: { x: 90, y: 118, w: 780, h: 150 }, wrongHint: 'فكّر: ده بيساعدني أذاكر ولا بيشتّتني؟', items: U.shuffle([
              ['qu', 'good', 'habit_quiet', 'مكان هادي'], ['br', 'good', 'habit_clock5', 'راحة ٥ دقايق'], ['be', 'good', 'habit_bed', 'نوم بدري'], ['te', 'good', 'habit_teacher', 'أسأل المدرّس'], ['ph', 'bad', 'habit_phone', 'موبايل جنبي'], ['la', 'bad', 'habit_late', 'سهر']]).map((p, i) => mkI(p[0], p[1], p[2], p[3], 170 + i * 124, p[1] === 'bad' ? 'ده بيضيّع وقتي' : 'ده بيساعدني أتفوّق')),
            targets: [{ id: 'good', x: 270, y: 415, w: 270, h: 120, cols: 4, dx: 52, dy0: -6, itemScale: .6, draw: (g) => { G.fillRR(g, -135, -62, 270, 124, 22, 'rgba(210,245,200,.92)', 4.5); G.text(g, 'بيخلّيني متفوّق', 0, -44, { size: 24, color: '#2f7a3a' }); } },
              { id: 'bad', x: 690, y: 415, w: 270, h: 120, cols: 4, dx: 52, dy0: -6, itemScale: .6, draw: (g) => { G.fillRR(g, -135, -62, 270, 124, 22, 'rgba(255,225,215,.92)', 4.5); G.text(g, 'بيضيّع وقتي', 0, -44, { size: 24, color: '#b0402a' }); } }]
          });
          if (sq.mistakes <= 1 && dd.mistakes <= 3) ctx.reward.star(1);
          ctx.heroes(here); m0 = mis(ctx);
          const c1 = await ctx.games.choice({
            prompt: 'مفهمتش جزء في الدرس. نعمل إيه؟', options: [
              { text: 'نسيبه ومنسألش', art: 'sad', good: false, consequence: [['baba', 'لو سبناه هنفضل مش فاهمينه. اسأل!']] },
              { text: 'نسأل المدرّس بأدب في الحصة', art: 'habit_teacher', good: true, reply: [['toota', 'برافو! السؤال بيفتح الدماغ.']] },
              { text: 'ننقل من صاحبنا', art: 'notebook', good: false, consequence: [['moody', 'النقل مش تفوّق. التفوّق إنك تفهم بنفسك.']] }]
          });
          const c2 = await ctx.games.choice({
            prompt: 'المدرّس بيشرح وصاحبك بيكلّمك. نعمل إيه؟', options: [
              { text: 'نكلّم صاحبنا ونضحك', art: 'ball', good: false, consequence: [['nemo', 'ده بيضيّع الشرح وبيضايق المدرّس.']] },
              { text: 'نسمع المدرّس بأدب ونكلّم صاحبنا بعدين', art: 'habit_quiet', good: true, reply: [['baba', 'ربنا يكرمكم! احترام المدرّس من الأدب.']] },
              { text: 'نقاطع المدرّس', art: 'habit_shout', good: false, consequence: [['toota', 'نرفع إيدنا ونستنى دورنا.']] }]
          });
          ctx.value('respect'); ctx.value('study');
          const q = await pq(ctx, 'hb6');
          if ((c1.firstTry ? 1 : 0) + (c2.firstTry ? 1 : 0) + q.firstTry >= 3 || (c1.firstTry && c2.firstTry)) ctx.reward.star(1);
          await ctx.say('baba', 'خلصتوا المذاكرة؟ برافو! وعشان كده مكافأة صغيرة.');
          await ctx.games.choice({
            prompt: 'المكافأة الصغيرة بعد المذاكرة؟', options: [
              { text: 'عصير وفاكهة', art: 'apple', good: true, reply: [['mama', 'بالهنا والشفا.']] },
              { text: 'ربع ساعة لعب', art: 'ball', good: true, reply: [['baba', 'تستاهلوا اللعب.']] },
              { text: 'تابلت لحد الفجر', art: 'habit_late', good: false, consequence: [['toota', 'مكافأة صغيرة ومش سهر. نتحكم في وقتنا.']] }]
          });
          st.state.medal = true; ctx.sfx('fanfare'); ctx.fx.confetti();
          await ctx.say('baba', 'وده أهو.. ميدالية التفوّق لكل واحد بيجتهد بعادات حلوة!', { anim: 'cheer' });
          await rit(ctx, 'الحمد لله', 'على نعمة العلم', 'نشكر ربنا ونقول: الحمد لله'); ctx.value('hb_gratitude'); ctx.value('hb_diligence');
          ctx.react('good', 'both');
          await ctx.say('toota', 'من النهاردة كلنا متفوقين بإذن الله!');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
