/* Moody & Aboody - worlds/market.js : WORLD 4 "السوق" (5 missions).
   Needs: worlds/street_kits.js (mk_maze, mk_money), worlds/market_art.js (mk_* props + rooms), content/q_market.js (tags mk1..mk5, mkgen).
   Tokens {m} {a} {me} in strings become the heroes' (editable) names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, ar = U.ar;
  const pulse = r => (g, t) => { g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const faint = (art, s) => (g, t) => { g.save(); g.globalAlpha = .6; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const pq = (ctx, tag) => ctx.quiz.pair({ aboody: M.pickQuestions({ tier: 6, tag, n: 1 })[0], moody: M.pickQuestions({ tier: 9, tag, n: 1 })[0] });
  const V = M.registerValue;
  V('shopping', { label: 'التسوق الذكي', desc: 'قايمة مشتريات واختيار الأكل الصحي والحساب' });
  V('saving', { label: 'التوفير والفلوس', desc: 'عدّ الفلوس والباقي والتوفير في الحصّالة' });
  V('patience', { label: 'الدور والصبر', desc: 'الوقوف في الطابور وشكر البائع' });
  V('nowaste', { label: 'عدم إهدار الأكل', desc: 'نحافظ على الأكل ومنرميهوش' });
  V('ecobag', { label: 'تقليل البلاستيك', desc: 'شنطة القماش وإعادة التدوير' });
  V('environment', { label: 'نظافة الحي والبيئة', desc: 'فرز الزبالة وزراعة شجرة' });
  V('honesty', { label: 'الصدق والأمانة', desc: 'قول الحقيقة' });
  V('safety', { label: 'السلامة', desc: 'عادات آمنة' });

  M.registerWorld({
    id: 'market', order: 4, title: 'السوق', icon: 'w_market', theme: { c1: '#ffc0d0', c2: '#ff6f91' }, finalSticker: 's_market',
    stickers: [
      { id: 's_list', title: 'مشتري شاطر', art: 'mk_list', bg: '#fff8b8' }, { id: 's_money', title: 'خبير الفلوس', art: 'coinpile', bg: '#fff0c4' },
      { id: 's_found', title: 'ما تتوهش', art: 'mk_meet', bg: '#d9f5d0', rot: .06 }, { id: 's_bakery', title: 'زبون مؤدب', art: 'mk_baladi', bg: '#ffe9c8' },
      { id: 's_bag', title: 'شنطة القماش', art: 'mk_cloth:green', bg: '#d9f5d0', rot: -.06 }, { id: 's_market', title: 'أبطال السوق', art: 'w_market', bg: '#ffe0ea', rot: -.05 }
    ],
    missions: [
      /* ============ 1) قائمة المشتريات ============ */
      {
        id: 'm1', title: 'قائمة المشتريات', intro: 'ماما كتبت لنا قايمة.. يلا نتسوّق ونختار الأكل الصحي!', values: ['shopping', 'healthy', 'teamwork'], sticker: 's_list',
        wisdom: 'قايمة المشتريات بتخلّينا نشتري اللي محتاجينه بس', diary: { pic: 'mk_list', text: 'اشترينا الفاكهة والخضار من القايمة وتعلمنا أسماءها بالإنجليزي' },
        async run(ctx) {
          const st = ctx.stage, small = M.tierFor(ctx.active) === 6;
          const list = small ? [{ art: 'apple', n: 3, got: 0 }, { art: 'orange', n: 2, got: 0 }] : [{ art: 'apple', n: 3, got: 0 }, { art: 'orange', n: 2, got: 0 }, { art: 'tomato', n: 4, got: 0 }];
          await ctx.scene('mk_market', { state: { list }, heroes: { moody: { x: 400, y: 482, dir: 1 }, aboody: { x: 500, y: 494, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، النهاردة السوق! خدوا القايمة دي.. وهاتوا الأكل الصحي بس.');
          await ctx.say('aboody', 'أنا هشيل السلة! والقايمة معاك يا {m}.', { anim: 'wave' });
          await ctx.say('moody', 'القايمة بتقول: ' + list.map(l => ar(l.n) + ' ' + { apple: 'تفاح', orange: 'برتقال', tomato: 'طماطم' }[l.art]).join('، ') + '.');
          ctx.heroes('corner');
          const fruit = []; list.forEach(l => { for (let i = 0; i < l.n; i++) fruit.push({ art: l.art, to: 'basket' }); });
          const junk = [{ art: 'chips', to: 'later', hint: 'الشيبسي مش في القايمة.. وبعدين' }, { art: 'candy', to: 'later', hint: 'الحلويات مش دلوقتي' }, { art: 'soda', to: 'later', hint: 'الكولا مش صحية أوي' }];
          const all = U.shuffle(fruit.concat(junk)), cols = small ? 4 : 6;
          const bs = await ctx.games.dragdrop({
            prompt: 'حطّ اللي في القايمة في السلة.. والباقي بعدين', panel: { x: 215, y: 112, w: 700, h: small ? 190 : 200 }, wrongHint: 'جرّب مكان تاني',
            items: all.map((it, i) => Object.assign({ id: 'i' + i, s: 62, x: 270 + (i % cols) * (small ? 130 : 105), y: 160 + Math.floor(i / cols) * 80 + (small ? 10 : 0) }, it)),
            targets: [{ id: 'basket', x: 400, y: 420, w: 180, h: 100, art: 'basket', s: 140, label: 'السلة', cols: 6, dx: 24, itemScale: .45 }, { id: 'later', x: 790, y: 420, w: 130, h: 100, art: 'box', s: 100, label: 'بعدين', cols: 3, dx: 22, itemScale: .42 }],
            onPlace: (it, t) => { const l = list.find(x => x.art === it.art); if (t.id === 'basket' && l) l.got++; }
          });
          if (bs.mistakes <= 2) ctx.reward.star(1);
          ctx.value('healthy'); ctx.skill('counting');
          await ctx.say('mama', 'أحسنتم! بس ده السوق.. وفي كلام إنجليزي على اللافتات. تعالوا نطابق الكلمات بالصور.');
          ctx.heroes('corner');
          const W = small ? [['Apple', 'تفاحة', 'apple'], ['Banana', 'موزة', 'banana'], ['Tomato', 'طماطم', 'tomato']] : [['Apple', '', 'apple'], ['Banana', '', 'banana'], ['Tomato', '', 'tomato'], ['Potato', '', 'mk_potato'], ['Onion', '', 'mk_onion']];
          const xs = W.length === 3 ? [330, 560, 790] : [290, 425, 560, 695, 830];
          const wm = await ctx.games.dragdrop({
            prompt: small ? 'طابق الكلمة بالصورة' : 'Match each English word with its picture', panel: { x: 215, y: 112, w: 700, h: 130 }, wrongHint: 'مش دي.. بُص على الصورة',
            items: U.shuffle(W).map((w, i) => ({ id: 'w' + i, art: 'mk_word:' + w[0] + (w[1] ? ':' + w[1] : ''), to: w[2], x: xs[i] + 0, y: 178, s: 92 })),
            targets: W.map((w, i) => ({ id: w[2], x: xs[i], y: 400, w: 120, h: 110, art: w[2], s: 100, itemScale: .62, dy0: -50 }))
          });
          if (wm.mistakes <= 1) ctx.reward.star(1);
          ctx.skill('english');
          await ctx.say('narrator', 'وقت الحساب! كل واحد عليه سؤال.');
          const q = await ctx.quiz.pair({
            aboody: { id: 'mk_m1_a', category: 'math', tier: 6, q: 'عندنا ٣ تفاحات وتفاحتين كمان. كام تفاحة كلهم؟', choices: ['٥', '٤', '٦'], answer: 0, hint: '٣ + ٢', count: { art: 'apple', n: 5 } },
            moody: { id: 'mk_m1_m', category: 'time_money', tier: 9, q: 'كيلو الطماطم بـ ٩ جنيه. اشترينا ٣ كيلو. الحساب كام؟', choices: ['٢٧', '٢٤', '٣٠'], answer: 0, hint: '٩ × ٣' }
          });
          const q2 = await pq(ctx, 'mk1');
          await ctx.say('chips', 'عرض خاص! شيبسي وكولا بسعر رخيص!', { name: 'اللافتة', icon: 'chips' });
          const ch = await ctx.games.choice({
            prompt: 'في عرض على الحاجات الحلوة.. نعمل إيه؟', options: [
              { text: 'نشتري كله عشان رخيص', art: 'soda', good: false, consequence: [['moody', 'ماما قالت أكل صحي. والرخيص مش دايمًا مفيد.'], ['aboody', 'عندك حق.. هنختار الفاكهة.']] },
              { text: 'نشتري فاكهة زيادة بدله', art: 'banana', good: true, reply: [['moody', 'موزة وتفاحة زيادة أحسن لجسمنا!']] },
              { text: 'نسأل ماما الأول', art: 'mama', good: true, reply: [['mama', 'برافو! اسألوني قبل ما تشتروا حاجة جديدة.']] }]
          });
          if ((ch.firstTry || q.firstTry + q2.firstTry >= 2) && ctx.stars < 3) ctx.reward.star(1);
          ctx.value('shopping');
          await ctx.say('mama', 'سلتنا مليانة صحة وعافية! يلا نرجع.');
          return ctx.nav.complete();
        }
      },
      /* ============ 2) الفلوس والباقي ============ */
      {
        id: 'm2', title: 'الفلوس والباقي', intro: 'معانا فلوس.. يلا نحسب صح ونتعلّم التوفير والأمانة!', values: ['saving', 'honesty', 'money'], sticker: 's_money',
        wisdom: 'الأمانة أغلى من الفلوس.. والتوفير بيعمل الفرق', diary: { pic: 'coinpile', text: 'حسبنا الفلوس والباقي ورجعنا الزيادة للبائع' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('mk_checkout', { state: { items: [{ art: 'milk', x: 690, y: 205, s: 50 }, { art: 'bread', x: 760, y: 208, s: 50 }] }, heroes: { moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 400, y: 494, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، اشتروا لبن وعيش بالفلوس دي. ومتنسوش تعدّوا الباقي!');
          await ctx.say('mk_vendor', 'أهلًا! اللبن ٨ جنيه والعيش ٤ جنيه.. يبقى ١٢ جنيه.', { name: 'الست سعاد' });
          await ctx.say('aboody', 'أنا هدفع! ١٢ جنيه.', { anim: 'wave' });
          st.setActive('aboody', true);
          const p1 = await ctx.games.mk_money({ target: 12, denoms: [1, 5, 10], head: 'الحساب: ١٢ جنيه', sub: '{a} يدفع بالظبط' });
          if (p1.tries === 1) ctx.reward.star(1);
          await ctx.say('mk_vendor', 'تمام يا بطل! دلوقتي دور {m}.', { name: 'الست سعاد' });
          await ctx.say('moody', 'أنا عايز جبنة وعصير: الحساب ٣٥ جنيه.');
          st.setActive('moody', true);
          const p2 = await ctx.games.mk_money({ target: 35, denoms: [5, 10, 20], head: 'الحساب: ٣٥ جنيه', sub: '{m} يدفع بالظبط' });
          ctx.skill('time_money');
          await ctx.say('moody', 'طيب لو دفعنا ٥٠ جنيه والحساب ٣٥.. البائع هيرجّع كام؟ ساعدوا الست سعاد تحسب الباقي.');
          const ch1 = await ctx.games.mk_money({ target: 15, denoms: [1, 5, 10, 20], head: 'الحساب ٣٥ ودفعنا ٥٠', sub: 'رجّع الباقي للزبون', okLabel: 'رجّع الباقي' });
          if (p2.tries + ch1.tries <= 2) ctx.reward.star(1);
          await ctx.say('mk_vendor', 'خدوا الباقي يا ولاد.. وعشرين جنيه.', { name: 'الست سعاد' });
          await ctx.say('aboody', 'استني! هي قالت ١٥ بس، وإدتنا ٢٠!');
          const hn = await ctx.games.choice({
            prompt: 'البائعة رجّعت لنا ٥ جنيه زيادة بالغلط.. نعمل إيه؟', options: [
              { text: 'نسكت ونمشي بالفلوس الزيادة', art: 'coinpile', good: false, consequence: [['moody', 'الفلوس دي مش بتاعتنا. ممكن البائعة تتحاسب من أجرها.'], ['aboody', 'أنا مش مرتاح كده.. نرجّعها.']] },
              { text: 'نقول لها إنها رجّعت لنا زيادة ونديها الزيادة', art: 'mk_vendor', good: true, reply: [['mk_vendor', 'ما شاء الله! أمانتكم دي أغلى من الفلوس.', { name: 'الست سعاد' }]] },
              { text: 'نخبّي الفلوس في الجيب', art: 'sad', good: false, consequence: [['moody', 'الصدق دايمًا أحسن.. ومحدش يشوف غير ربنا.']] }]
          });
          if (hn.firstTry) ctx.reward.star(1); ctx.value('honesty');
          await ctx.say('aboody', 'عندي ٦ جنيهات من مصروفي.. أعمل بيهم إيه؟');
          const sv = await ctx.games.choice({
            prompt: 'معانا مصروف.. نصرفه ولا نوفّر؟', options: [
              { text: 'نصرف كل الفلوس على حلويات دلوقتي', art: 'candy', good: false, consequence: [['narrator', 'الفلوس خلصت بسرعة.. وبعدين عايزين نجيب هدية لماما ومفيش!'], ['moody', 'الأحسن نوفّر جزء ونصرف جزء.']] },
              { text: 'نوفّر معظمها في الحصّالة ونصرف شوية', art: 'piggy', good: true, reply: [['moody', 'عظيم! توفير مع استمتاع.']] },
              { text: 'نوفّر كله ومنصرفش حاجة أبدًا', art: 'piggy', good: true, reply: [['moody', 'التوفير حلو.. بس برضه نسيب شوية للفرحة.']] }]
          });
          ctx.heroes('corner');
          const coin = (id, x, y, to) => ({ id, art: 'coin', to, x, y, s: 62 });
          let pigN = 0, spN = 0;
          await ctx.games.dragdrop({
            prompt: 'حوّش ٤ جنيهات في الحصّالة وصرّف ٢ بس', wrongHint: 'الحصّالة بتاخد ٤ والسلة ٢', panel: { x: 190, y: 120, w: 580, h: 150 },
            items: [coin('c1', 260, 190, 'pig'), coin('c2', 360, 190, 'pig'), coin('c3', 460, 190, 'pig'), coin('c4', 560, 190, 'pig'), coin('c5', 660, 190, 'spend'), coin('c6', 700, 240, 'spend')],
            onPlace: (it, t) => { if (t.id === 'pig') pigN++; else spN++; },
            targets: [{ id: 'pig', x: 270, y: 400, w: 190, h: 120, art: 'piggy', s: 130, label: 'نوفّر ٤', itemScale: .35, accepts: () => pigN < 4, cols: 4, dx: 14 }, { id: 'spend', x: 680, y: 400, w: 150, h: 110, art: 'mk_cart', s: 110, label: 'نصرف ٢', itemScale: .35, accepts: () => spN < 2 }]
          });
          ctx.value('saving');
          await ctx.say('aboody', 'كل ما أوفّر هشتري هدية لماما!', { anim: 'cheer' });
          await ctx.say('narrator', 'سؤال الحصّالة: لكل واحد فيكم سؤال!');
          const q = await pq(ctx, 'mk2'); const q2 = await pq(ctx, 'mkgen');
          if (q.firstTry + q2.firstTry >= 2 && ctx.stars < 3) ctx.reward.star(1);
          return ctx.nav.complete();
        }
      },
      /* ============ 3) ما تتوهش! ============ */
      {
        id: 'm3', title: 'ما تتوهش!', intro: 'السوق زحمة.. إزاي نفضل مع ماما ولو تهنا نعمل إيه؟', values: ['safety', 'stranger', 'teamwork'], sticker: 's_found',
        wisdom: 'لو تهت: أقف مكاني وأطلب مساعدة من موظف أو بائع', diary: { pic: 'mk_meet', text: 'تعلمنا نفضل جنب ماما ولو تهنا نروح لموظف الاستعلامات' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('mk_street', { state: { balloons: true }, heroes: { moody: { x: 420, y: 482, dir: 1 }, aboody: { x: 520, y: 494, dir: 1 } } });
          await ctx.say('mama', 'السوق النهاردة زحمة أوي. خليكم ماسكين إيدي ومتبعدوش عني.');
          await ctx.say('aboody', 'بُص يا {m}! بلالين ملونة! أنا عايز أروح أشوفهم!');
          const ch = await ctx.games.choice({
            prompt: 'عبودي شاف بلالين.. نعمل إيه؟', options: [
              { text: 'نروح نشوفهم لوحدنا بسرعة', art: 'mk_balloon:red', good: false, consequence: [['narrator', 'الزحمة كبيرة.. وبدأنا نبعد عن ماما!'], ['moody', 'لا يا {a}.. نقول لماما الأول.']] },
              { text: 'نقول لماما ونروح معاها', art: 'mama', good: true, reply: [['mama', 'برافو عليكم! تعالوا نشوفهم سوا.']] },
              { text: 'نسيب إيد ماما ونجري', art: 'sad', good: false, consequence: [['moody', 'وسط الزحمة بنتوه بسرعة. إيد ماما أمان.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('safety');
          await ctx.say('narrator', 'وفجأة زحمة ناس عدّت بين ماما والولاد..');
          st.state.crowd = true;
          await ctx.walk('moody', 700, 482); await ctx.say('aboody', 'يا {m}! ماما مش هنا! مش شايفها وسط الناس.');
          await ctx.say('moody', 'اهدى يا {a}. محدش بيتوه للأبد.. فيه طريقة صح.');
          const ch2 = await ctx.games.choice({
            prompt: 'احنا تهنا عن ماما.. نعمل إيه؟', options: [
              { text: 'نجري ندوّر على ماما في كل حتة', art: 'arrow', good: false, consequence: [['moody', 'لو جرينا ممكن نبعد أكتر.. ماما هتدوّر علينا.']] },
              { text: 'نفضل في مكان واضح ونروح لموظف أو بائع نطلب مساعدته', art: 'mk_staff', good: true, reply: [['moody', 'ده الصح. موظف الاستعلامات بيعرف يلاقي ماما.']] },
              { text: 'نمشي مع أي حد يقول إنه يعرف ماما', art: 'st_stranger', good: false, consequence: [['moody', 'منروحش مع حد منعرفوش. نروح للموظف الرسمي أو البائع.']] }]
          });
          if (ch2.firstTry) ctx.reward.star(1); ctx.value('stranger');
          await ctx.say('moody', 'كشك الاستعلامات هناك في آخر الممر. تعالوا نوصله بالراحة وسط الناس.');
          const mz = await ctx.games.mk_maze({ goalArt: 'mk_info', prompt: 'اضغط على المكان اللي عايزين نروحه.. وخد النجوم في السكة' });
          if (mz.stars >= 2 && mz.bumps <= 4) ctx.reward.star(1);
          ctx.skill('logic');
          await ctx.scene('mk_street', { state: { crowd: false }, heroes: { moody: { x: 420, y: 482, dir: 1 }, aboody: { x: 520, y: 494, dir: 1 } } });
          await ctx.say('mk_staff', 'أنا هنادي على ماما في الميكروفون.. "والدة مودي وعبودي، ولادك هنا في الاستعلامات!"', { name: 'موظف الاستعلامات' });
          await ctx.say('mama', 'يا حبايبي! الحمد لله لقيتكم! كنت بدوّر عليكم.', { anim: 'cheer' });
          await ctx.say('moody', 'آسفين يا ماما.. بس عملنا زي ما اتعلمنا: وقفنا ورحنا لموظف.');
          const mt = await ctx.games.choice({
            prompt: 'عشان منتوهش تاني.. نتفق على نقطة لقاء. نختار؟', options: [
              { text: 'عند كشك الاستعلامات', art: 'mk_info', good: true, reply: [['mama', 'فكرة حلوة! مكان معروف وواضح.']] },
              { text: 'عند بوابة السوق الكبيرة', art: 'mk_meet', good: true, reply: [['mama', 'تمام! بوابة السوق مكان مش بيتغيّر.']] },
              { text: 'نتقابل في أي مكان إحنا نحبه', art: 'question', good: false, consequence: [['moody', 'لازم مكان محدد ومعروف للكل.']] }]
          });
          ctx.sticker.give('s_found');
          await pq(ctx, 'mk3');
          return ctx.nav.complete();
        }
      },
      /* ============ 4) المخبز والأكل الصحي ============ */
      {
        id: 'm4', title: 'المخبز والأكل الصحي', intro: 'ريحة العيش السخن ملّت المكان! يلا نشتري الفطار بأدب.', values: ['patience', 'healthy', 'nowaste', 'thanks'], sticker: 's_bakery',
        wisdom: 'الصبر في الدور أدب.. والأكل نعمة منرميهاش', diary: { pic: 'mk_baladi', text: 'استنينا في الدور واشترينا العيش وشكرنا الخباز' },
        async run(ctx) {
          const st = ctx.stage, cols = ['#ef5350', '#4a8dff', '#8a6bd6', '#5cc96b'];
          const queue = [{ x: 400, c: cols[0] }, { x: 510, c: cols[1], sk: '#f0c08a' }, { x: 620, c: cols[2] }];
          await ctx.scene('mk_bakery', { state: { queue }, heroes: { moody: { x: 860, y: 482, dir: -1 }, aboody: { x: 930, y: 494, dir: -1 } } });
          await ctx.say('mama', 'يا ولاد، عايزة عيش وفطار من المخبز. هستناكم هنا.');
          await ctx.say('aboody', 'الله! ريحة العيش جميلة! أنا هجري على الأول!');
          const ch = await ctx.games.choice({
            prompt: 'في ناس كتير مستنية في الدور.. نعمل إيه؟', options: [
              { text: 'نعدّي قدام الناس عشان نخلص بسرعة', art: 'arrow', good: false, consequence: [['narrator', 'الناس بصّوا لنا.. وكلهم كانوا مستنيين من بدري.'], ['moody', 'الدور حق للكل. نروح آخر الصف.']] },
              { text: 'نقف في آخر الدور ونستنى دورنا', art: 'mk_walker:4a8dff', good: true, reply: [['aboody', 'ماشي.. هستنى بالصبر.']] },
              { text: 'نزاحم ونمسك العيش من الرف', art: 'mk_fino', good: false, consequence: [['moody', 'الزحمة بتضايق الناس. الأدب أحلى.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('patience');
          await ctx.walk('moody', 730, 482); await ctx.walk('aboody', 840, 494);
          await ctx.say('moody', 'شايف الدور بيتحرك؟ الناس بتتخدم واحد ورا التاني.');
          for (let i = 0; i < 3; i++) { await ctx.wait(.9); queue.shift(); queue.forEach(q => { q.x -= 110; }); /* everyone steps forward */ queue.forEach((q, k) => { q.x = 400 + k * 110; }); ctx.sfx('pop'); }
          await ctx.walk('moody', 500, 482); await ctx.walk('aboody', 600, 494);
          await ctx.say('mk_baker', 'اتفضلوا يا أبطال! الدور عليكم.. أحلى عيش سخن!', { name: 'عم حسن الخباز' });
          await ctx.say('moody', 'هو العيش ده بيتعمل إزاي يا عم حسن؟');
          const sq = await ctx.games.sequence({ prompt: 'رتّب خطوات عمل العيش', steps: [{ art: 'mk_flour', label: 'دقيق وماية' }, { art: 'mk_dough', label: 'نعجن' }, { art: 'mk_oven', label: 'نخبز في الفرن' }, { art: 'mk_baladi', label: 'عيش سخن' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('mk_baker', 'وبعدين.. فطار صحي بيكون فيه كذا نوع أكل. ساعدوني أرتّب الرفوف.', { name: 'عم حسن الخباز' });
          ctx.heroes('corner');
          const mkI = (a, to) => ({ art: a, to, s: 62 });
          const raw = [mkI('mk_baladi', 'starch'), mkI('mk_fino', 'starch'), mkI('rice', 'starch'), mkI('apple', 'veg'), mkI('carrot', 'veg'), mkI('tomato', 'veg'), mkI('milk', 'dairy'), mkI('cheese', 'dairy'), mkI('egg', 'dairy')];
          const sort = await ctx.games.dragdrop({
            prompt: 'رتّب الأكل في مجموعته', panel: { x: 150, y: 112, w: 660, h: 190 }, wrongHint: 'جرّب مجموعة تانية',
            items: U.shuffle(raw).map((it, i) => Object.assign({ id: 'f' + i, x: 215 + (i % 5) * 120, y: 160 + Math.floor(i / 5) * 80 }, it)),
            targets: [{ id: 'starch', x: 240, y: 410, w: 150, h: 110, art: 'bread', s: 100, label: 'عيش ونشويات', cols: 3, dx: 20, itemScale: .4 }, { id: 'veg', x: 480, y: 410, w: 150, h: 110, art: 'apple', s: 100, label: 'فاكهة وخضار', cols: 3, dx: 20, itemScale: .4 }, { id: 'dairy', x: 720, y: 410, w: 150, h: 110, art: 'milk', s: 100, label: 'لبن وجبن وبيض', cols: 3, dx: 20, itemScale: .4 }]
          });
          if (sort.mistakes <= 2) ctx.reward.star(1);
          ctx.value('healthy'); ctx.skill('health');
          await ctx.scene('mk_bakery', { state: { queue: [] }, heroes: { moody: { x: 500, y: 482, dir: -1 }, aboody: { x: 600, y: 494, dir: -1 } } });
          await ctx.say('aboody', 'فيه فتافيت عيش واقعة على الرف وعلى الأرض! يا خسارة!');
          await ctx.games.tap({
            prompt: 'اجمع فتافيت العيش عشان منضيعهاش', hintAfter: 12, spots: [
              { id: 'k1', art: 'mk_crumbs', x: 140, y: 280, s: 50, listArt: 'mk_crumbs', walkOff: 70 }, { id: 'k2', art: 'mk_crumbs', x: 330, y: 282, s: 50, listArt: 'mk_crumbs', walkOff: 70 }, { id: 'k3', art: 'mk_crumbs', x: 470, y: 470, s: 50, listArt: 'mk_crumbs', walkOff: 70 }]
          });
          await ctx.say('moody', 'هنحطها للعصافير بدل ما نرميها.');
          st.state.bird = { x: 760, y: 470 }; ctx.fx.burst(760, 450, { kind: 'heart' }); ctx.sfx('good');
          const w = await ctx.games.choice({
            prompt: 'فضل معانا نص رغيف.. نعمل إيه؟', options: [
              { text: 'نرميه في الزبالة', art: 'x', good: false, consequence: [['moody', 'الأكل نعمة. ناس كتير محتاجينه.'], ['aboody', 'بلاش نرميه.']] },
              { text: 'نحتفظ بيه للغدا أو نعمل منه فتّة', art: 'mk_baladi', good: true, reply: [['mama', 'فكرة ممتازة! لا نرمي الأكل أبدًا.']] },
              { text: 'نديه للعصافير أو لحد محتاج', art: 'mk_bird', good: true, reply: [['moody', 'الصدقة بتطيب القلب.']] }]
          });
          if (w.firstTry && ctx.stars < 3) ctx.reward.star(1); ctx.value('nowaste');
          await ctx.say('mk_baker', 'تحبوا حاجة تانية يا أبطال؟', { name: 'عم حسن الخباز' });
          await ctx.games.ritual({ text: 'شكرًا يا عم حسن', sub: 'نشكر البائع' });
          ctx.value('thanks'); ctx.sticker.give('s_bakery');
          await ctx.say('mk_baker', 'العفو يا ولاد! أحلى زبائن.', { name: 'عم حسن الخباز' });
          await pq(ctx, 'mk4');
          return ctx.nav.complete();
        }
      },
      /* ============ 5) شنطة قماش ============ */
      {
        id: 'm5', title: 'شنطة قماش', intro: 'شنطة القماش بتشيل كتير.. وبتحمي الطبيعة. يلا نتعاون!', values: ['ecobag', 'environment', 'teamwork'], sticker: 's_bag',
        wisdom: 'شنطة قماش واحدة بتوفّر مئات الأكياس البلاستيك', diary: { pic: 'mk_cloth:green', text: 'استخدمنا شنطة القماش وساعدنا بعض في الشيل' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('mk_market', { state: {}, heroes: { moody: { x: 400, y: 482, dir: 1 }, aboody: { x: 500, y: 494, dir: 1 } } });
          await ctx.say('mama', 'يا ولاد، خدوا شنطتين القماش بتوعنا. ومتاخدوش أكياس بلاستيك.');
          await ctx.say('mk_vendor', 'تحبوا أديكم كيس بلاستيك لكل حاجة؟', { name: 'الست سعاد' });
          const ch = await ctx.games.choice({
            prompt: 'البائعة بتعرض أكياس بلاستيك.. نرد؟', options: [
              { text: 'آه، كل حاجة في كيس لوحدها', art: 'mk_plastic', good: false, consequence: [['moody', 'الأكياس دي بتفضل في الطبيعة سنين وبتأذي الحيوانات والبحر.'], ['aboody', 'خلّينا نستخدم الشنطة.']] },
              { text: 'لأ شكرًا، معانا شنط قماش', art: 'mk_cloth:blue', good: true, reply: [['mk_vendor', 'ما شاء الله! ياريت كل الزباين زيكم.', { name: 'الست سعاد' }]] },
              { text: 'ناخد الأكياس ونرميها في الشارع', art: 'sad', good: false, consequence: [['moody', 'الشارع مش سلة زبالة.. والأكياس بتضر الحيوانات.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('ecobag');
          await ctx.say('moody', 'أنا هشيل الحاجات التقيلة في شنطتي.. وانت الخفيفة في شنطتك.');
          ctx.heroes('corner');
          const nm = M.save.data.names;
          const it = (id, a, to, x, y, ex) => Object.assign({ id, art: a, to, x, y, s: 68 }, ex || {});
          const pk = await ctx.games.dragdrop({
            prompt: 'التقيل في شنطة {m}.. والخفيف في شنطة {a}', panel: { x: 150, y: 112, w: 660, h: 190 }, wrongHint: 'جرّب الشنطة التانية',
            items: [it('h1', 'mk_watermelon', 'bagM', 230, 175, { needs: 'moody', needsMsg: 'البطيخة تقيلة! محتاجين {m}', s: 82 }), it('h2', 'rice', 'bagM', 370, 175, { needs: 'moody', needsMsg: 'كيس الرز تقيل! محتاجين {m}', s: 82 }), it('h3', 'jug', 'bagM', 510, 175, { needs: 'moody', needsMsg: 'الجردل تقيل! محتاجين {m}' }),
              it('l1', 'bread', 'bagA', 270, 255), it('l2', 'banana', 'bagA', 400, 255), it('l3', 'tomato', 'bagA', 530, 255), it('l4', 'cucumber', 'bagA', 660, 255)],
            targets: [{ id: 'bagM', x: 260, y: 410, w: 180, h: 120, art: 'mk_cloth:blue', s: 130, label: M.fmt('شنطة {m}'), cols: 4, dx: 18, itemScale: .38, accepts: () => true }, { id: 'bagA', x: 700, y: 410, w: 180, h: 120, art: 'mk_cloth:pink', s: 130, label: M.fmt('شنطة {a}'), cols: 4, dx: 18, itemScale: .38 }]
          });
          if (pk.mistakes <= 2) ctx.reward.star(1); ctx.value('teamwork');
          await ctx.say('aboody', 'شنطتي خفيفة وشنطتك تقيلة.. بس سوا حملنا كل حاجة!', { anim: 'cheer' });
          await ctx.say('moody', 'ولو لقينا حاجات قديمة نفرزها للتدوير، نستفيد منها تاني.');
          ctx.heroes('corner');
          const rc = await ctx.games.dragdrop({
            prompt: 'افرز للتدوير: ورق في الأزرق، بلاستيك في الأصفر، أكل في الأخضر', panel: { x: 150, y: 112, w: 660, h: 150 }, wrongHint: 'جرّب صندوق تاني',
            items: U.shuffle([it('r1', 'mk_plastic', 'yellow', 0, 0), it('r2', 'mk_bottle', 'yellow', 0, 0), it('r3', 'note', 'blue', 0, 0), it('r4', 'mk_peel', 'green', 0, 0)]).map((x, i) => Object.assign(x, { x: 250 + i * 150, y: 185 })),
            targets: [{ id: 'blue', x: 240, y: 410, w: 130, h: 120, art: 'mk_bin:blue', s: 120, label: 'ورق', cols: 3, dx: 16, itemScale: .4 }, { id: 'yellow', x: 480, y: 410, w: 130, h: 120, art: 'mk_bin:yellow', s: 120, label: 'بلاستيك', cols: 3, dx: 16, itemScale: .4 }, { id: 'green', x: 720, y: 410, w: 130, h: 120, art: 'mk_bin:green', s: 120, label: 'أكل', cols: 3, dx: 16, itemScale: .4 }]
          });
          ctx.skill('science');
          /* final puzzle chain */
          await ctx.scene('mk_market', { state: {}, heroes: { moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 420, y: 494, dir: 1 } } });
          await ctx.say('narrator', 'ورقة قديمة طلعت من جيب الشنطة: "فيه مفاجأة في السوق. حلّوا ٣ ألغاز وهتلاقوها!"');
          const a1 = await pq(ctx, 'mk5');
          await ctx.say('moody', 'اللغز الأول بيقول: "اللافتة العالية فيها مفتاح".');
          await ctx.games.tap({ prompt: '{m} يمد إيده لللافتة العالية', list: false, spots: [{ id: 's1', x: 190, y: 150, s: 110, hit: 70, needs: 'moody', needsMsg: 'اللافتة عالية! محتاجين {m}', walkOff: 40, draw: pulse(56), onFound: () => ctx.say('moody', 'لقيت ورقة صغيرة: "اسأل عن الفاكهة الصفرا".') }] });
          const a2 = await ctx.quiz.ask({ id: 'mk_m5_r', category: 'riddles', q: 'أنا فاكهة صفرا ومعوجّة، والقرود بتحبني. أنا مين؟', choices: [{ text: 'الموزة', art: 'banana' }, { text: 'التفاحة', art: 'apple' }, { text: 'البرتقالة', art: 'orange' }], answer: 0, hint: 'بتتقشّر بسهولة' });
          await ctx.say('aboody', 'الورقة التانية بتقول: "المفتاح تحت الترابيزة في مكان ضيق".');
          await ctx.games.tap({ prompt: '{a} يزحف تحت الترابيزة', hintAfter: 10, spots: [{ id: 's2', x: 400, y: 440, s: 52, needs: 'aboody', needsMsg: 'المكان ضيق! محتاجين {a}', walkOff: 0, draw: faint('key', 56), listArt: 'key' }] });
          await ctx.say('aboody', 'لقيت المفتاح!', { anim: 'cheer' });
          const a3 = await pq(ctx, 'mkgen');
          if (a1.firstTry + a3.firstTry + (a2.tries === 1 ? 1 : 0) >= 3 && ctx.stars < 3) ctx.reward.star(1); else if (a1.firstTry + a3.firstTry >= 1 && ctx.stars < 3) ctx.reward.star(1);
          st.state.gift = false;
          await ctx.say('moody', 'دلوقتي المفتاح يفتح الصندوق السري.. وراء الشنطة الكبيرة!');
          st.state.gift = true; ctx.sfx('fanfare'); ctx.fx.confetti();
          await ctx.games.tap({ prompt: 'افتحوا المفاجأة!', list: false, spots: [{ id: 'gf', x: 480, y: 392, s: 120, hit: 80, keep: true, draw: () => { }, onFound: () => { ctx.fx.burst(480, 380, { kind: 'star' }); ctx.sfx('unlock'); } }] });
          await ctx.say('mama', 'مفاجأة! شنطة قماش جديدة ليكم.. هدية عشان حافظتوا على الطبيعة!', { anim: 'cheer' });
          ctx.reward.coins(3);
          await ctx.say('moody', 'شنطة واحدة بتوفّر مئات الأكياس. ودلوقتي إحنا أبطال السوق!');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
