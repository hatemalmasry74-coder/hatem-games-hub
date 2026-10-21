/* Family Adventures - worlds/street.js : WORLD 3 "الشارع والحي" (5 missions).
   Needs: worlds/street_kits.js (st_cross, st_phone), worlds/street_art.js (st_* props + rooms), content/q_street.js (tags st1..st5, stgen).
   Tokens {m} {a} {me} in strings become the heroes' (editable) names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const pulse = r => (g, t) => { g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const faint = (art, s) => (g, t) => { g.save(); g.globalAlpha = .6; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const ringArt = (a, s, r) => (g, t) => { pulse(r)(g, t); A.draw(g, a, 0, Math.sin(t * 2.5) * 2, s); };
  /* a tier-6 + a tier-9 puzzle with the mission's tag (falls back to anything of that tier) */
  const pq = (ctx, tag) => ctx.quiz.pair({ aboody: M.pickQuestions({ tier: 6, tag, n: 1 })[0], moody: M.pickQuestions({ tier: 9, tag, n: 1 })[0] });
  const V = M.registerValue;
  V('traffic', { label: 'أمان الطريق', desc: 'عبور الشارع بإشارة وخطوط المشاة ومسك إيد الأصغر' });
  V('manners', { label: 'السلام والأدب مع الجيران', desc: 'تحية الكبار ومساعدتهم' });
  V('animals', { label: 'الرفق بالحيوان', desc: 'إطعام القطط وسقيها وعدم إزعاجها' });
  V('stranger', { label: 'الأمان مع الغرباء', desc: 'عدم الذهاب مع غريب وطلب مساعدة شخص موثوق' });
  V('environment', { label: 'نظافة الحي والبيئة', desc: 'فرز الزبالة وزراعة شجرة' });
  V('honesty', { label: 'الصدق والأمانة', desc: 'قول الحقيقة' });
  V('clean', { label: 'النظافة', desc: 'تنظيف الحي وفرز الزبالة' });
  V('respect', { label: 'احترام الكبار', desc: 'التحية والأدب مع الكبار' });
  V('safety', { label: 'السلامة', desc: 'عادات آمنة' });

  M.registerWorld({
    id: 'street', order: 3, title: 'الشارع والحي', icon: 'w_street', theme: { c1: '#c9c4ff', c2: '#8a6bd6' }, finalSticker: 's_street',
    stickers: [
      { id: 's_cross', title: 'عبور آمن', art: 'st_light:green', bg: '#d9f5d0' }, { id: 's_neighbor', title: 'جار طيب', art: 'st_elder', bg: '#e9defc' },
      { id: 's_kitten', title: 'صديق القطط', art: 'st_kitten:orange', bg: '#fff0c4', rot: .08 }, { id: 's_safe', title: 'بطل الأمان', art: 'st_police', bg: '#cfe3ff' },
      { id: 's_clean', title: 'حارس الحي', art: 'st_tree', bg: '#d9f5d0', rot: -.06 }, { id: 's_street', title: 'أبطال الحي', art: 'w_street', bg: '#e0d4f5', rot: -.05 }
    ],
    missions: [
      /* ============ 1) عبور الشارع بأمان ============ */
      {
        id: 'm1', title: 'عبور الشارع بأمان', intro: 'ماما عايزة عيش من المخبز اللي على الناصية التانية.. لازم نعدّي الشارع!', values: ['traffic', 'safety', 'teamwork'], sticker: 's_cross',
        wisdom: 'الشارع مش مكان لعب.. نستنى الإشارة ونبص يمين وشمال', diary: { pic: 'st_light:green', text: 'عدّينا الشارع من عند الإشارة وأنا ماسك إيد أخويا' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('st_street', { state: { pl: 'red', cl: 'green' }, heroes: { moody: { x: 420, y: 486, dir: 1 }, aboody: { x: 520, y: 496, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، هاتوا عيش من المخبز اللي على الناصية التانية. و{m} يمسك إيد {a} كويس في الشارع!');
          await ctx.say('moody', 'حاضر يا ماما. تعال يا {a}.. إيدك في إيدي.', { anim: 'wave' });
          await ctx.say('aboody', 'أنا شايف الناصية التانية! نجري؟');
          const ch = await ctx.games.choice({
            prompt: 'هنعدّي الشارع إزاي؟', options: [
              { text: 'نجري من بين العربيات', art: 'st_car:red', good: false, consequence: [['narrator', 'عربية فرملت بسرعة.. وسمعنا صوت فرامل عالي!'], ['moody', 'يا ساتر! الشارع مش مكان للجري. لازم مكان آمن.']] },
              { text: 'نعدّي من عند الخطوط البيضا والإشارة', art: 'st_zebra', good: true, reply: [['moody', 'برافو يا {a}! خطوط المشاة هي مكاننا الآمن.']] },
              { text: 'نجري ورا الكورة اللي وقعت في الشارع', art: 'ball', good: false, consequence: [['aboody', 'كورتي وقعت هناك!'], ['moody', 'سلامتنا أهم من أي كورة. العربيات مش بتشوفنا من بعيد.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1);
          ctx.value('traffic');
          await ctx.say('moody', 'تمام. الأول نضغط زرار الإشارة ونستنى النور الأخضر للمشاة.');
          const cr = await ctx.games.st_cross({});
          ctx.value('safety'); if (cr.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('aboody', 'عدّينا! الحمد لله.', { anim: 'cheer' });
          await ctx.scene('st_shops', { state: { shopkeeper: true }, heroes: { moody: { x: 330, y: 480, dir: 1 }, aboody: { x: 430, y: 492, dir: 1 } } });
          await ctx.say('st_shop', 'أهلًا يا أبطال! عيش سخن لسه طالع من الفرن.', { name: 'عم وليد' });
          await ctx.say('moody', 'قبل ما نرجع، عايزين نتذكر علامات الطريق اللي شفناها.');
          const small = M.tierFor(ctx.active) === 6, pairs = small ? ['st_stop', 'st_zsign', 'st_light:red'] : ['st_stop', 'st_zsign', 'st_light:red', 'st_light:green', 'st_pedlight:green', 'st_pedlight:red'];
          await ctx.games.memory({ prompt: 'لعبة علامات الطريق', pairs, timeLimit: small ? 0 : 0 });
          await ctx.say('narrator', 'سؤالين عن الشارع.. كل واحد فيكم عليه سؤال!');
          const q = await pq(ctx, 'st1'); if (q.firstTry >= 1) ctx.reward.star(1);
          const q2 = await pq(ctx, 'stgen');
          await ctx.say('st_shop', 'اتفضلوا العيش يا شطار. وخلّوا بالكم من الشارع في الرجوع!', { name: 'عم وليد' });
          return ctx.nav.complete();
        }
      },
      /* ============ 2) جارنا الكبير ============ */
      {
        id: 'm2', title: 'جارنا الكبير', intro: 'عمو سعيد جارنا شايل شنط تقيلة.. يلا نساعده!', values: ['manners', 'help', 'respect', 'teamwork'], sticker: 's_neighbor',
        wisdom: 'الجار قبل الدار.. والسلام أول الأدب', diary: { pic: 'st_elder', text: 'سلّمنا على عمو سعيد وشلنا له الشنط ولقينا مفاتيحه' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('st_building', { state: { elder: { x: 400, y: 345, s: 190 } }, heroes: { moody: { x: 170, y: 484, dir: 1 }, aboody: { x: 250, y: 494, dir: 1 } } });
          await ctx.say('narrator', 'قدام العمارة.. عمو سعيد، جارنا الكبير، واقف وحواليه شنط كتير.');
          const g1 = await ctx.games.choice({
            prompt: 'هنقول لعمو سعيد إيه؟', options: [
              { text: 'نعدّي من جنبه من غير ما نبص', art: 'sad', good: false, consequence: [['narrator', 'عمو سعيد ابتسم بتعب.. بس كان نفسه حد يسلّم عليه.'], ['moody', 'السلام بيفرّح الناس. تعالوا نرجع نسلّم.']] },
              { text: 'نندهله بصوت عالي: يا عم!', art: 'st_man', good: false, consequence: [['st_elder', 'يا خبر! خضّيتوني يا ولاد!', { name: 'عمو سعيد' }], ['moody', 'الأحسن نكلّم الكبار بهدوء وأدب.']] },
              { text: 'السلام عليكم يا عمو سعيد.. صباح الخير!', art: 'st_elder', good: true, reply: [['st_elder', 'وعليكم السلام ورحمة الله يا ولاد! صباح النور.', { name: 'عمو سعيد' }]] }]
          });
          if (g1.firstTry) ctx.reward.star(1); ctx.value('manners');
          await ctx.walk('moody', 330, 484); await ctx.walk('aboody', 290, 494);
          await ctx.say('st_elder', 'والله يا ولاد الشنط تقلت عليا.. وكمان مفاتيحي وقعت مني ومش لاقيها. ممكن تساعدوني؟', { name: 'عمو سعيد' });
          await ctx.say('moody', 'طبعًا يا عمو! أنا هشيل الشنط التقيلة.. و{a} هيدوّر على المفاتيح.');
          ctx.heroes('corner');
          const mk = (id, a, to, x, y, extra) => Object.assign({ id, art: a, to, x, y, s: 70 }, extra || {});
          const bags = await ctx.games.dragdrop({
            prompt: '{m} يشيل الشنط التقيلة، والخفيف أي حد يشيله', panel: { x: 480, y: 120, w: 430, h: 270 }, wrongHint: 'الشنط بتروح جوه العمارة',
            items: [mk('b1', 'st_groc', 'in', 570, 200, { needs: 'moody', needsMsg: 'الشنطة تقيلة! محتاجين {m} القوي', s: 84 }), mk('b2', 'st_sack', 'in', 690, 220, { needs: 'moody', needsMsg: 'كيس الرز تقيل! محتاجين {m}', s: 84 }), mk('b3', 'st_gallon', 'in', 810, 200, { needs: 'moody', needsMsg: 'جركن الماية تقيل! محتاجين {m}', s: 84 }),
              mk('b4', 'bread', 'in', 600, 320), mk('b5', 'milk', 'in', 720, 320), mk('b6', 'tomato', 'in', 830, 320)],
            targets: [{ id: 'in', x: 330, y: 400, w: 200, h: 100, art: 'basket', s: 130, label: 'جوه العمارة', cols: 6, dx: 26, itemScale: .45 }]
          });
          if (bags.mistakes <= 2) ctx.reward.star(1); ctx.value('help');
          ctx.heroes({ moody: { x: 330, y: 484, dir: 1 }, aboody: { x: 460, y: 494, dir: 1 } });
          await ctx.say('st_elder', 'ربنا يبارك فيك يا {m}! بس لسه المفاتيح والنضارة والطاقية.. كلهم وقعوا.', { name: 'عمو سعيد' });
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على: النضارة، المفاتيح، الطاقية', hintAfter: 14, spots: [
              { id: 'gl', art: 'st_glasses', x: 745, y: 336, s: 48, listArt: 'st_glasses', onFound: () => ctx.say('aboody', 'لقيت النضارة على الكنبة!') },
              { id: 'key', art: 'key', x: 770, y: 452, s: 46, needs: 'aboody', needsMsg: 'المفاتيح تحت الكنبة في فتحة ضيقة! محتاجين {a}', walkOff: -10, listArt: 'key', draw: faint('key', 50), onFound: () => ctx.say('aboody', 'المفاتيح هنا تحت الكنبة!') },
              { id: 'cap', art: 'st_cap', x: 78, y: 228, s: 52, needs: 'moody', needsMsg: 'الطاقية فوق الشجرة العالية! محتاجين {m}', walkOff: 60, listArt: 'st_cap', onFound: () => ctx.say('moody', 'الطاقية علقت في فرع الشجرة!') }]
          });
          if (f.wrong <= 3) ctx.reward.star(1);
          await ctx.say('st_elder', 'جزاكم الله خير يا ولاد! عشان تعبكم، خدوا ده.', { name: 'عمو سعيد' });
          const th = await ctx.games.choice({
            prompt: 'عمو سعيد بيمد إيده بحلاوة وفلوس.. نقول إيه؟', options: [
              { text: 'نقول: ده واجبنا يا عمو، ربنا يخليك', art: 'heartbig', good: true, reply: [['st_elder', 'ما شاء الله! تربية ماما وبابا.', { name: 'عمو سعيد' }]] },
              { text: 'نقول: عايزين فلوس أكتر', art: 'coinpile', good: false, consequence: [['moody', 'المساعدة بتبقى أحلى لما نعملها من قلبنا من غير مقابل.'], ['aboody', 'عندك حق يا {m}.. هنقولها بشكل أحلى.']] },
              { text: 'نقول شكرًا ونخد الحلاوة بس ونتبسّم', art: 'candy', good: true, reply: [['st_elder', 'اتفضلوا حلاوة صغيرة وعلى القلب دعوة.', { name: 'عمو سعيد' }]] }]
          });
          ctx.sticker.give('s_neighbor');
          await ctx.say('narrator', 'قبل ما نمشي، سؤال سريع من عمو سعيد.');
          const q = await pq(ctx, 'st2'); if (q.firstTry >= 1 && !(f.wrong > 3)) ctx.reward.star(1);
          await ctx.games.ritual({ text: 'مع السلامة يا عمو', sub: 'نودّعه بأدب' });
          return ctx.nav.complete();
        }
      },
      /* ============ 3) القطة الجائعة ============ */
      {
        id: 'm3', title: 'القطة الجائعة', intro: 'سمعنا مواء في الشارع الجانبي.. في حد جعان!', values: ['animals', 'kindness', 'help'], sticker: 's_kitten',
        wisdom: 'الرحمة بالحيوان من أخلاق الكبار', diary: { pic: 'st_kitten:orange', text: 'أطعمنا القطط الصغيرة وقدمنا لها ماية' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('st_alley', { state: {}, heroes: { moody: { x: 480, y: 482, dir: -1 }, aboody: { x: 580, y: 494, dir: -1 } } });
          await ctx.say('aboody', 'اسمع يا {m}! مواء.. مياو مياو! في قطط صغيرة مستخبية هنا!');
          await ctx.say('moody', 'أكيد جعانين وخايفين. تعالى ندوّر عليهم بهدوء.. من غير ما نخوّفهم.');
          st.setActive('moody', true);
          const f = await ctx.games.hidden({
            prompt: 'دوّر على القطط الصغيرة المستخبية وعدّهم', hintAfter: 14, spots: [
              { id: 'k1', x: 130, y: 424, s: 60, needs: 'aboody', needsMsg: 'القطة تحت العربية في مكان ضيق! محتاجين {a}', walkOff: 0, listArt: 'st_kitten:gray', draw: faint('st_kitten:gray', 56), onFound: () => ctx.say('aboody', 'لقيتها! قطة رمادي صغيّرة تحت العربية.') },
              { id: 'k2', art: 'st_kitten:orange', x: 400, y: 330, s: 58, listArt: 'st_kitten:orange', walkOff: -60, onFound: () => ctx.say('moody', 'وهنا واحدة وراء الصناديق!') },
              { id: 'k3', art: 'st_kitten:white', x: 150, y: 168, s: 56, needs: 'moody', needsMsg: 'القطة على الشباك العالي! محتاجين {m}', walkOff: 80, listArt: 'st_kitten:white', onFound: () => ctx.say('moody', 'وصلت لها! بيضا زي القطن.') }]
          });
          if (f.wrong <= 3) ctx.reward.star(1);
          await ctx.say('narrator', 'لقيتوا ٣ قطط صغيرة. إحنا لازم نعدّهم صح!');
          await ctx.quiz.pair({
            aboody: { id: 'st_m3_c6', category: 'counting', tier: 6, q: 'لقينا كام قطة صغيرة؟', choices: ['٣', '٢', '٤'], answer: 0, hint: 'رمادي وبرتقالي وأبيض', count: { art: 'st_kitten:orange', n: 3 } },
            moody: { id: 'st_m3_c9', category: 'math', tier: 9, q: 'لقينا ٣ قطط صغيرة، ومعاهم ماما القطة وقطتين جايين من بعيد. كام قطة كلهم؟', choices: ['٦', '٥', '٧'], answer: 0, hint: '٣ + ١ + ٢' }
          });
          await ctx.say('aboody', 'بس هما بيترعشوا! أنا هجري وراهم وأمسكهم!');
          const ch = await ctx.games.choice({
            prompt: 'القطط جعانة وخايفة.. نعمل إيه؟', options: [
              { text: 'نجري وراهم ونخوّفهم', art: 'st_dog', good: false, consequence: [['narrator', 'القطط جريت واستخبّت أكتر..'], ['moody', 'هما أصغر مننا وبيخافوا. لازم نكون هادين.']] },
              { text: 'نرمي عليهم حاجة عشان يجروا', art: 'ball', good: false, consequence: [['aboody', 'ممكن نوجعهم من غير ما نقصد..'], ['moody', 'الحيوانات بتحس زينا. إحنا نساعدهم مش نأذيهم.']] },
              { text: 'نجيب أكل وماية ونقعد بهدوء', art: 'st_bowl:food', good: true, reply: [['moody', 'برافو يا {a}! الرحمة بالحيوان حلوة.'], ['aboody', 'أنا هجيب الوعاء.. وانت جيب الأكل يا {m}.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('animals'); ctx.value('kindness');
          ctx.heroes('corner');
          const fd = await ctx.games.dragdrop({
            prompt: 'سمك وماية للقطط.. ومش كل أكل يناسبها', panel: { x: 130, y: 112, w: 700, h: 180 }, wrongHint: 'لأ، ده مش للقطط',
            items: [{ id: 'f1', art: 'st_fish', to: 'food', x: 230, y: 195, s: 70 }, { id: 'f2', art: 'st_fish', to: 'food', x: 350, y: 195, s: 70 }, { id: 'w1', art: 'water', to: 'water', x: 470, y: 195, s: 64 },
              { id: 'n1', art: 'chocolate', to: 'no', x: 590, y: 195, s: 62, hint: 'الشوكولاتة بتتعب القطط' }, { id: 'n2', art: 'chips', to: 'no', x: 700, y: 195, s: 62, hint: 'الشيبسي مش أكل للقطط' }, { id: 'n3', art: 'candy', to: 'no', x: 780, y: 240, s: 56, hint: 'الحلويات مش مناسبة ليهم' }],
            targets: [{ id: 'food', x: 250, y: 390, w: 150, h: 100, art: 'st_bowl:food', s: 110, label: 'أكل', cols: 3, dx: 22, itemScale: .5 }, { id: 'water', x: 480, y: 390, w: 150, h: 100, art: 'st_bowl:water', s: 110, label: 'ماية', itemScale: .4 }, { id: 'no', x: 740, y: 390, w: 150, h: 100, art: 'box', s: 100, label: 'مش للقطط', cols: 3, dx: 24, itemScale: .42 }]
          });
          if (fd.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes({ moody: { x: 400, y: 482, dir: 1 }, aboody: { x: 330, y: 494, dir: 1 } });
          st.state.food = true; st.state.water = true; st.state.cat = { x: 560, y: 392, s: 150 };
          ctx.sfx('good'); ctx.fx.burst(560, 380, { kind: 'heart' });
          await ctx.say('aboody', 'بُص! بتاكل وبتشرب! شكلها فرحانة أوي.', { anim: 'cheer' });
          await ctx.games.tap({ prompt: 'اضغط بحنية على القطة', list: false, noWalk: true, spots: [{ id: 'pet', x: 560, y: 392, s: 120, hit: 70, keep: true, anim: 'cheer', draw: () => { }, onFound: () => { ctx.fx.burst(560, 360, { kind: 'heart' }); ctx.sfx('good'); } }] });
          ctx.sticker.give('s_kitten');
          await ctx.say('moody', 'لغز صغير للقطة الشاطرة.. ولينا إحنا.');
          await pq(ctx, 'st3');
          await ctx.say('narrator', 'القطة قالت: مياو (يعني شكرًا)!');
          return ctx.nav.complete();
        }
      },
      /* ============ 4) الغريب والأمان ============ */
      {
        id: 'm4', title: 'الغريب والأمان', intro: 'ماما جوه الصيدلية وإحنا مستنيين قدّام.. وحد جاي يكلّمنا.', values: ['stranger', 'safety', 'permission'], sticker: 's_safe',
        wisdom: 'منروحش مع حد منعرفوش.. وننادي على ماما أو بابا أو حد نثق فيه', diary: { pic: 'st_police', text: 'عرفنا نعمل إيه لو حد غريب كلمنا وحفظنا رقم بابا' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('st_shops', { state: {}, heroes: { moody: { x: 400, y: 482, dir: 1 }, aboody: { x: 500, y: 494, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، أنا داخلة الصيدلية دقيقة. استنوا هنا قدام الباب.. ومتروحوش في أي مكان.');
          await ctx.say('moody', 'حاضر يا ماما، هنستناكي هنا.');
          st.state.stranger = { x: 690, y: 360 };
          await ctx.say('st_stranger', 'ازيكم يا شباب! معايا حلويات كتير وكلاب صغيرين في عربيتي.. تعالوا معايا أوريكم!', { name: 'راجل غريب' });
          await ctx.say('aboody', 'حلويات! وكلاب صغيرين!');
          const ch = await ctx.games.choice({
            prompt: 'راجل منعرفوش بيقول تعالوا معايا.. نعمل إيه؟', options: [
              { text: 'نروح معاه عشان الحلويات', art: 'candy', good: false, consequence: [['moody', 'استنى يا {a}! ماما قالت متروحش مع حد منعرفوش.'], ['narrator', '{m} مسك إيد {a} وفضلوا واقفين مكانهم.']] },
              { text: 'ناخد الحلويات ونقول شكرًا', art: 'chocolate', good: false, consequence: [['moody', 'حتى الحلويات.. منخدش حاجة من حد منعرفوش.'], ['aboody', 'عندك حق.. ماما هي اللي تشتريلنا.']] },
              { text: 'نقول: لأ شكرًا! ونروح جنب ماما', art: 'st_hands', good: true, reply: [['moody', 'لأ شكرًا! إحنا مستنيين ماما.', { anim: 'wave' }], ['st_stranger', 'ماشي ماشي.. مع السلامة.', { name: 'راجل غريب' }]] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('stranger');
          st.state.stranger = null;
          await ctx.say('aboody', 'بس أنا اتخضيت شوية.');
          await ctx.say('moody', 'برافو عليك إنك قلت لأ. تعالى نرتّب الخطوات الصح لو ده حصل تاني.');
          const sq = await ctx.games.sequence({ prompt: 'رتّب: لو حد غريب كلّمنا', steps: [{ art: 'x', label: 'نقول لأ شكرًا بصوت واضح' }, { art: 'arrow', label: 'نبعد عنه' }, { art: 'st_shop', label: 'نروح لحد نثق فيه' }, { art: 'mama', label: 'نحكي لماما وبابا' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('moody', 'طيب لو احتجنا مساعدة.. مين الناس اللي نروحلهم؟');
          ctx.heroes({ moody: { x: 400, y: 482, dir: 1 }, aboody: { x: 500, y: 494, dir: 1 } });
          st.state.shopkeeper = false; st.state.officer = false;
          await ctx.games.hidden({
            prompt: 'دوّر على الناس اللي نثق فيهم: الشرطي وصاحب المحل', noWalk: true, spots: [
              { id: 'pol', art: 'st_fig:police', x: 840, y: 365, s: 150, hit: 90, draw: ringArt('st_fig:police', 150, 78), anim: 'wave', listArt: 'st_police', onFound: () => ctx.say('st_police', 'أنا هنا لمساعدة الأطفال والكل.', { name: 'الشرطي' }) },
              { id: 'shp', art: 'st_fig:shop', x: 150, y: 350, s: 140, hit: 90, draw: ringArt('st_fig:shop', 140, 74), anim: 'wave', listArt: 'st_shop', onFound: () => ctx.say('st_shop', 'لو احتجتوا حاجة تعالوا عندي.', { name: 'عم وليد' }) }]
          });
          st.state.shopkeeper = true; st.state.officer = true;
          const ch2 = await ctx.games.choice({
            prompt: 'لو ماما اتأخرت واحتجنا مساعدة.. نروح لمين؟', options: [
              { text: 'الشرطي', art: 'st_police', good: true, reply: [['st_police', 'أي وقت تحتاجوا مساعدة تعالوا.', { name: 'الشرطي' }]] },
              { text: 'أي حد ماشي في الشارع', art: 'st_stranger', good: false, consequence: [['moody', 'مش أي حد. نختار حد نعرف إنه آمن: شرطي أو صاحب محل أو حد من الأهل.']] },
              { text: 'صاحب المحل', art: 'st_shop', good: true, reply: [['st_shop', 'أنا معاكم لحد ما ماما ترجع.', { name: 'عم وليد' }]] }]
          });
          if (ch2.firstTry) ctx.reward.star(1);
          await ctx.say('mama', 'يلا يا حبايبي، خلصت! اتأخرت عليكم؟');
          await ctx.say('moody', 'لأ يا ماما. بس عايزين نتعلم رقمك عشان لو احتجنا نتصل بيكِ.');
          await ctx.say('mama', 'ممتاز! بس ده رقم تمرين مش رقمي الحقيقي.. وهكتبلكم الرقم الحقيقي في ورقة.');
          const rnd = n => { let s = ''; while (s.length < n) s += U.rndi(1, 9); return s; };
          st.setActive('aboody', true);
          await ctx.games.st_phone({ digits: rnd(4), show: 9, prompt: '{a}: احفظ الرقم القصير' });
          await ctx.say('moody', 'وأنا دوري بالرقم الأطول!');
          st.setActive('moody', true);
          await ctx.games.st_phone({ digits: rnd(8), show: 11, prompt: '{m}: احفظ الرقم الطويل' });
          await pq(ctx, 'st4');
          return ctx.nav.complete();
        }
      },
      /* ============ 5) حي نظيف ============ */
      {
        id: 'm5', title: 'حي نظيف', intro: 'النهاردة يوم نظافة الحي.. يلا نخلّي شارعنا أحلى!', values: ['environment', 'honesty', 'teamwork', 'clean'], sticker: 's_clean',
        wisdom: 'حينا بيتنا الكبير.. نحافظ عليه ونحب أهله', diary: { pic: 'st_tree', text: 'نضفنا الحي وزرعنا شجرة ورجعنا محفظة لصاحبها' },
        async run(ctx) {
          const st = ctx.stage;
          const lit = [{ art: 'st_paper', x: 250, y: 462 }, { art: 'st_bottle', x: 380, y: 470 }, { art: 'st_can', x: 700, y: 464 }, { art: 'st_peel', x: 800, y: 474 }, { art: 'st_news', x: 130, y: 470 }];
          await ctx.scene('st_block', { state: { litter: lit }, heroes: { moody: { x: 470, y: 482, dir: 1 }, aboody: { x: 570, y: 494, dir: 1 } } });
          await ctx.say('cz1', 'السلام عليكم يا أبطال! النهاردة عاملين يوم نضافة للحي.. تشاركوا معانا؟');
          await ctx.say('aboody', 'الشارع مليان ورق وازايز! يا خسارة.');
          await ctx.say('moody', 'يلا نفرز الزبالة الأول: الورق في الأزرق، البلاستيك والعلب في الأصفر، وبقايا الأكل في الأخضر.');
          ctx.heroes('corner');
          const mkI = (id, a, to, x, y) => ({ id, art: a, to, x, y, s: 70 });
          const so = await ctx.games.dragdrop({
            prompt: 'افرز الزبالة في الصناديق الصح', panel: { x: 130, y: 112, w: 700, h: 170 }, wrongHint: 'جرّب صندوق تاني',
            items: U.shuffle([mkI('p1', 'st_paper', 'blue'), mkI('p2', 'st_news', 'blue'), mkI('p3', 'st_bottle', 'yellow'), mkI('p4', 'st_can', 'yellow'), mkI('p5', 'st_peel', 'green'), mkI('p6', 'st_core', 'green')]).map((it, i) => Object.assign(it, { x: 215 + i * 110, y: 196 })),
            targets: [{ id: 'blue', x: 240, y: 400, w: 130, h: 120, art: 'st_bin:blue', s: 120, label: 'ورق', cols: 3, dx: 16, itemScale: .4 }, { id: 'yellow', x: 480, y: 400, w: 130, h: 120, art: 'st_bin:yellow', s: 120, label: 'بلاستيك وعلب', cols: 3, dx: 16, itemScale: .4 }, { id: 'green', x: 720, y: 400, w: 130, h: 120, art: 'st_bin:green', s: 120, label: 'أكل', cols: 3, dx: 16, itemScale: .4 }]
          });
          if (so.mistakes <= 2) ctx.reward.star(1);
          st.state.litter = null; ctx.value('environment'); ctx.skill('science');
          await ctx.say('moody', 'جميل! الورق والبلاستيك ممكن يتعمل منهم حاجات جديدة.');
          await pq(ctx, 'st5');
          /* planting */
          await ctx.scene('st_block', { state: { clean: true }, heroes: { moody: { x: 440, y: 484, dir: 1 }, aboody: { x: 330, y: 494, dir: 1 } } });
          await ctx.say('cz1', 'جبت لكم شتلة صغيرة نزرعها سوا في الحديقة الصغيرة.');
          st.setActive('moody', true);
          await ctx.games.tap({ prompt: '{m} يحفر حفرة بالشوكة', list: false, spots: [{ id: 'dig', x: 565, y: 414, s: 100, hit: 60, needs: 'moody', needsMsg: 'الحفر محتاج {m} القوي', walkOff: -70, draw: pulse(48), onFound: () => { st.state.hole = true; ctx.sfx('drop'); } }] });
          await ctx.games.tap({ prompt: '{a} يحط الشتلة في الحفرة', hintAfter: 12, spots: [{ id: 'sap', art: 'st_sapling', x: 400, y: 418, s: 70, needs: 'aboody', needsMsg: 'الشتلة الصغيرة مع {a}', walkOff: 0, listArt: 'st_sapling', onFound: () => { st.state.sapling = true; ctx.sfx('pop'); } }] });
          await ctx.games.tap({ prompt: '{m} يردم التراب حواليها', list: false, spots: [{ id: 'soil', x: 565, y: 420, s: 100, hit: 60, needs: 'moody', walkOff: 70, draw: pulse(48), onFound: () => { st.state.soil = true; ctx.sfx('drop'); } }] });
          await ctx.games.tap({ prompt: '{a} يسقيها بالجردل', hintAfter: 12, spots: [{ id: 'wc', art: 'st_wcan', x: 700, y: 418, s: 70, needs: 'aboody', walkOff: 0, listArt: 'st_wcan', onFound: () => { st.state.watered = true; ctx.sfx('splash'); } }] });
          ctx.reward.star(1);
          await ctx.say('narrator', 'وبعد شهور من السقي والرعاية...');
          st.state.grown = true; ctx.sfx('fanfare'); ctx.fx.confetti();
          await ctx.say('aboody', 'الشجرة كبرت! وطلّعت فاكهة!', { anim: 'cheer' });
          /* cleanup race */
          await ctx.say('cz1', 'دلوقتي سباق النظافة! اجمعوا الزبالة بس.. وسيبوا ألعاب الأطفال.');
          const race = await ctx.games.lanes({ prompt: 'اجمع الزبالة وسيب الألعاب', lanes: 3, goal: 7, speed: 215, every: .85, good: ['st_paper', 'st_bottle', 'st_can'], bad: ['ball', 'teddy'], bg: (g, t, s) => { s.state.clean = true; M.rooms.st_block(g, t, s); } });
          ctx.skill('counting');
          /* the lost wallet */
          await ctx.scene('st_block', { state: { clean: true, grown: true }, heroes: { moody: { x: 440, y: 484, dir: 1 }, aboody: { x: 330, y: 494, dir: 1 } } });
          await ctx.say('aboody', 'يا {m}! في حاجة على الرصيف!');
          await ctx.games.tap({ prompt: 'مين وقعت منه الحاجة دي؟', hintAfter: 10, spots: [{ id: 'w', art: 'st_wallet', x: 250, y: 458, s: 60, walkOff: 0, onFound: () => ctx.say('moody', 'محفظة! وفيها فلوس وكارت.') }] });
          const ch = await ctx.games.choice({
            prompt: 'لقينا محفظة فيها فلوس.. نعمل إيه؟', options: [
              { text: 'ناخد الفلوس ونشتري حلويات', art: 'coinpile', good: false, consequence: [['moody', 'ده مش بتاعنا. صاحبها هيزعل أوي ومش هيلاقي فلوسه.']] },
              { text: 'نسيبها مكانها ونمشي', art: 'sad', good: false, consequence: [['aboody', 'بس ممكن حد ياخدها وصاحبها ميلاقيهاش..'], ['moody', 'الأحسن نوصلها لصاحبها.']] },
              { text: 'نسلّمها للشرطي أو ندوّر على صاحبها', art: 'st_police', good: true, reply: [['moody', 'الأمانة أحلى من أي فلوس.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('honesty');
          await ctx.say('st_man', 'يا ولاد! محفظتي! كنت بدوّر عليها في كل حتة!', { name: 'عم رمضان' });
          await ctx.say('st_man', 'ربنا يكرمكم! الأمانة دي مش لاقيها كتير.', { name: 'عم رمضان' });
          ctx.reward.coins(3);
          await ctx.say('cz1', 'يا أبطال الحي! الحي بقى أنضف وأحلى بسببكم.');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
