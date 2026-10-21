/* Family Adventures - worlds/mystery.js : WORLD 12 "لغز البيت القديم" (id 'mystery', 6 missions).
   A cosy, spooky-FUN-but-never-scary mystery (gentle Casper / Scooby-Doo style): the family explores an old house at dusk with a flashlight; every noise and shadow turns out harmless and lovable
   (a power cut, the wind in a loose shutter, a lost kitten, a night owl, a music box, a sheet over an armchair) and the cute round "ghost" «بوبو» is a shy friend who just wants friends.
   Courage is taught in a healthy way: it is OK to feel a little nervous - breathe, hold hands, check what the noise really is, the dark is not dangerous, tell a grown-up.
   Mama is in the kitchen / calls out, Baba is on the phone and then arrives.  No game over, no jump scares, no loud sounds, no chasing, no scary faces.
   GENERIC: only the role tokens {m} {a} {t} {n} (the four kids) and the speakers baba / mama.  Works in the Play edition (family wizard) unchanged.
   Needs (loaded before): content/q_mystery.js, worlds/mystery_kits.js (mysFlash, mysTune, Moody.mys.snd), worlds/mystery_art.js (rooms, props, the ghost).
   Strings: single quotes, no apostrophes (the voice collector scans ctx.say('who','text')). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const ALL4 = ['moody', 'aboody', 'toota', 'nemo'], mis = ctx => ctx.mistakes;
  M.voice.extraVoices = M.voice.extraVoices || {}; M.voice.extraVoices.mys_bobo = 'boy_small';   // one line to change when a dedicated voice for بوبو exists
  const lay = list => { const o = {}; list.forEach(a => { o[a[0]] = { x: a[1], y: a[2], dir: a[3] || 1 }; }); return o; };
  /* the four kids at the bottom of the room, facing left (x of the first, then spacing) */
  const kids = (x0, dx, dir, y0) => lay(ALL4.map((id, i) => [id, x0 + i * (dx || 92), (y0 || 484) + (i % 2) * 10, dir == null ? 1 : dir]));
  /* a question of the tier of each brother, by bank tag */
  const pq = (ctx, tag) => ctx.quiz.pair({ aboody: M.pickQuestions({ tier: 6, tag, n: 1 })[0], moody: M.pickQuestions({ tier: 9, tag, n: 1 })[0] });
  /* voice-collection helper: registers every reply / consequence line of a choice (even those a bot never opens), then runs the choice kit */
  const choiceQ = (ctx, o) => { o.options.forEach(op => [].concat(op.reply || [], Array.isArray(op.consequence) ? op.consequence : []).forEach(l => M.voice.note(l[1], l[0]))); return ctx.games.choice(o); };
  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const faint = (art, s) => (g, t, st, sp) => { if (!sp.found) pulse(s * .6)(g, t, st, sp); g.save(); g.globalAlpha = .9; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  /* a sound that repeats softly while a question is open (sound matching); stops by itself */
  const ears = async (ctx, snd, o) => { M.mys.snd(snd); const stop = ctx.every(4.8, () => M.mys.snd(snd)); try { return await choiceQ(ctx, o); } finally { stop(); } };
  /* the friendly ghost: a stage layer (under the kit veil) + dialog helper.  b.x/b.y/b.a(lpha)/b.sc/b.flip/b.emo are tweenable */
  const bobo = (ctx, o) => {
    const b = Object.assign({ x: 700, y: 440, emo: 'shy', sc: 1, a: 1, flip: 1, bob: 1 }, o);
    b.rm = ctx.stage.addLayer({ z: 1, draw(g, t) { if (b.a < .02) return; g.save(); g.globalAlpha = b.a; g.translate(b.x, b.y + (b.bob ? Math.sin(t * 2.2 + 1) * 5 : 0)); g.scale(b.flip * b.sc, b.sc); A.draw(g, 'mys_bobo:' + b.emo, 0, 0, 120); g.restore(); } });
    b.say = (text, o2) => ctx.say('mys_bobo', text, Object.assign({ name: 'بوبو', icon: 'mys_bobo:' + b.emo }, o2));
    b.to = (p, d) => M.tw(b, p, d || .9, 'inOut');
    return b;
  };

  const V = M.registerValue;
  V('my_courage', { label: 'الشجاعة الصحيحة', desc: 'القلق الصغير طبيعي: نتنفس، نمسك إيد بعض، ونشوف الحاجة بالكشاف' });
  V('my_curious', { label: 'الفضول والاستكشاف', desc: 'نبص ونفحص ونعرف الصوت أو الضل قبل ما نخاف' });
  V('my_kind', { label: 'اللطف مع الوحيد', desc: 'نرحّب بالخجول ونلعب معاه ونبقى صحاب' });
  V('my_tell', { label: 'نحكي لكبير', desc: 'لو قلقنا أو شفنا حاجة غريبة نقول لماما أو بابا' });

  M.registerWorld({
    id: 'mystery', order: 12, title: 'لغز البيت القديم', icon: 'w_mystery', theme: { c1: '#cdbcf5', c2: '#6a58b0' }, finalSticker: 'mys_s_brave',
    heroes: ALL4, control: ALL4,
    stickers: [
      { id: 'mys_s_torch', title: 'حامل الكشاف', art: 'mys_torch', bg: '#fff3c4', rot: -.05 },
      { id: 'mys_s_ears', title: 'مكتشف الأصوات', art: 'mys_kitten', bg: '#ffe6d0', rot: .06 },
      { id: 'mys_s_box', title: 'صندوق الموسيقى', art: 'mys_musicbox', bg: '#f3dcee', rot: -.06 },
      { id: 'mys_s_friend', title: 'صاحب بوبو', art: 'mys_bobo:happy', bg: '#e6e0ff', rot: .05 },
      { id: 'mys_s_key', title: 'مفتاح الاستغماية', art: 'mys_key', bg: '#d8f0e0', rot: -.04 },
      { id: 'mys_s_brave', title: 'شجاع', art: 'mys_medal', bg: '#ffe9a0', rot: .04 }
    ],
    missions: [
      /* ================= 1) الكهربا قطعت ================= */
      {
        id: 'm1', title: 'الكهربا قطعت', intro: 'وصلنا البيت القديم وقت الغروب.. وفجأة النور قطع! نتنفس ونمسك إيد بعض ونلاقي الكشاف.', values: ['my_courage', 'my_tell', 'teamwork'], sticker: 'mys_s_torch',
        heroes: ALL4, control: ALL4, wisdom: 'لما النور يقطع بنهدّى ونمسك إيد بعض ونطلب الكبار والدنيا بتبقى بسيطة', diary: { pic: 'mys_torch', text: 'وصلنا البيت القديم والنور قطع. أخدنا نفس عميق ومسكنا إيد بعض ولقينا الكشاف' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('mys_living', { state: { lampK: 1, candle: 0 }, heroes: kids(520, 96, -1) });
          await ctx.say('mama', 'وصلنا البيت القديم يا حبايبي! بيت حلو أوي. روحوا بصّوا في الصالون وأنا هعمل شاي في المطبخ.');
          await ctx.say('nemo', 'الله! السما بنفسجي والشمس بتغرب. البيت شكله مريح.');
          await ctx.say('aboody', 'وفيه كنبة كبيرة ومكتبة طويلة! هو البيت ده فيه أسرار؟');
          ctx.sfx('click'); await M.tw(st.state, { lampK: 0 }, 1.4, 'inOut'); ctx.sfx('sleepy');
          await ctx.say('narrator', 'وفجأة.. النور قطع! الصالون بقى هادي وغامق شوية، والسما لسه بنفسجي حلوة.');
          await ctx.say('nemo', 'أنا حاسّة بشوية قلق..', { emote: 'worried' });
          await ctx.say('moody', 'ده طبيعي يا {n}! أي حد ممكن يقلق شوية. تعالي ناخد نفس عميق سوا.');
          await ctx.games.ritual({ text: 'شهيق', sub: 'نفس عميق من مناخيرنا', who: 'nemo', bottom: 150 });
          await ctx.games.ritual({ text: 'زفير', sub: 'ونطلّعه بالراحة', who: 'nemo', bottom: 150 });
          await ctx.games.ritual({ text: 'إيد في إيد', sub: 'نمسك إيد بعض', who: 'toota', bottom: 150 });
          ctx.fx.burst(480, 330, { kind: 'heart', n: 10 }); ctx.value('my_courage');
          await ctx.say('nemo', 'ما شاء الله! قلبي هدي. الدنيا مش مخيفة، هي بس غامقة شوية.', { emote: 'happy' });
          await ctx.say('mama', 'الكهربا قطعت يا ولاد؟ ولا يهمكم، ده بيحصل في البيوت القديمة. ابعدوا عن الفيش والفيوزات، دي للكبار بس.');
          const ch = await choiceQ(ctx, {
            prompt: 'الكهربا قطعت. نعمل إيه؟', options: [
              { text: 'نجري في الضلمة', art: 'ball', good: false, consequence: [['toota', 'ممكن نتخبط! نمشي بالراحة وإحنا ماسكين إيد بعض.']] },
              { text: 'نلعب في الفيوزات والفيش', art: 'mys_fuse', good: false, consequence: [['mama', 'لأ يا حبيبي! الكهربا للكبار بس. ابعدوا عنها.']] },
              { text: 'نمسك إيد بعض ونجيب الكشاف', art: 'mys_hands', good: true, reply: [['moody', 'يلا بالراحة ومعانا بعض!'], ['aboody', 'أنا عارف إن فيه كشاف في المكان ده!']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('my_curious');
          await ctx.say('toota', 'الكشاف على الرف العالي في المكتبة، والبطاريات تحت الكنبة. ننقسم: الطويل فوق والصغير تحت.');
          ctx.tip('الكشاف فوق والبطاريات تحت!', 'toota');
          m0 = mis(ctx);
          const f = await ctx.games.hidden({
            prompt: 'دوّروا على الكشاف والبطاريات', hintAfter: 12, spots: [
              { id: 'torch', art: 'mys_torch', x: 150, y: 160, s: 58, needs: 'tall', walkOff: 70, listArt: 'mys_torch', draw: faint('mys_torch', 58), needsMsg: 'الكشاف فوق على الرف العالي! محتاجين {m} الطويل' },
              { id: 'batt', art: 'mys_batt', x: 400, y: 438, s: 46, needs: 'small', walkOff: -60, listArt: 'mys_batt', draw: faint('mys_batt', 46), needsMsg: 'البطاريات تحت الكنبة! محتاجين حد صغير زي {a}' }]
          });
          if (f.wrong <= 1) ctx.reward.star(1);
          ctx.heroes(kids(520, 96, -1));
          await ctx.say('moody', 'لقينا الكشاف والبطاريات! نركّبهم صح.');
          const sq = await ctx.games.sequence({ prompt: 'رتّبوا الخطوات: نحط البطاريات ثم نقفل الغطا ثم نشغّل الكشاف', steps: [{ art: 'mys_batt', label: 'نحط البطاريات' }, { art: 'mys_torch', label: 'نقفل الغطا' }, { art: 'mys_power', label: 'نشغّل الكشاف' }] });
          ctx.sfx('click'); st.flash('#fff3b0', .5); ctx.fx.sparkle(420, 330);
          await ctx.say('aboody', 'نوّر! الكشاف نوّر! بصّوا الدايرة المنوّرة على الحيطة!', { anim: 'cheer' });
          await ctx.say('mama', 'وأنا ولّعت لكم شمعة في الفانوس الزجاج على الترابيزة العالية. ماتلمسوهاش، النار للكبار بس.');
          ctx.sfx('good'); await M.tw(st.state, { candle: 1 }, 1, 'inOut');
          await ctx.say('narrator', 'دلوقتي الصالون منوّر بنور الشمعة الدافي. وإحنا مش لوحدنا.');
          const q = await pq(ctx, 'my1');
          if ((sq.mistakes <= 1) && (q.firstTry >= 1 || mis(ctx) - m0 <= 3)) ctx.reward.star(1);
          await ctx.say('baba', 'ألو يا أبطال! سمعت إن الكهربا قطعت. أنا في الطريق ومعايا فيوزات جديدة، وهصلّحها لما أوصل.');
          await ctx.say('toota', 'عندنا كشاف يا بابا! وماما معانا.');
          await ctx.say('baba', 'برافو عليكم. ولو حسّيتوا بأي قلق قولوا لماما أو كلّموني، أنا على التليفون دايمًا.');
          ctx.value('my_tell');
          await ctx.say('mama', 'يلا بقى نكتشف البيت بالكشاف، بس دايمًا مع بعض!');
          return ctx.nav.complete();
        }
      },

      /* ================= 2) الصوت الغريب ================= */
      {
        id: 'm2', title: 'الصوت الغريب', intro: 'فيه صوت طَق طَق في الطرقة! بالكشاف هنعرف مين صاحبه.', values: ['my_curious', 'my_courage', 'my_kind'], sticker: 'mys_s_ears',
        heroes: ALL4, control: ALL4, wisdom: 'الصوت الغريب غالبًا بيطلع حاجة بسيطة لما نبص عليه بهدوء', diary: { pic: 'mys_kitten', text: 'سمعنا طَق طَق في الطرقة وبالكشاف عرفنا إنه الهوا والشيش وقطة صغيرة وساعة كبيرة' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('mys_hall', { state: { shutter: 1 }, heroes: kids(300, 96, 1) });
          await ctx.say('moody', 'الطرقة طويلة وفيها صور وساعة كبيرة. يلا نكتشفها بالكشاف!');
          M.mys.snd('tap'); await ctx.wait(1.6);
          await ctx.say('aboody', 'سمعتوا؟ طَق.. طَق..', { emote: 'surprised' });
          await ctx.say('nemo', 'سمعت! الصوت جاي من آخر الطرقة. غريب بس لطيف.');
          await ctx.say('toota', 'افتكروا: الصوت الغريب غالبًا بيطلع حاجة بسيطة. نمسك إيد بعض ونشوف.');
          const ch = await choiceQ(ctx, {
            prompt: 'سمعنا صوت غريب. نعمل إيه؟', options: [
              { text: 'نستخبّى تحت البطانية', art: 'bed', good: false, consequence: [['aboody', 'أنا ممكن أستخبّى.. بس هفضل عايز أعرف الصوت ده إيه!'], ['toota', 'لو بصّينا بالكشاف هنطمّن.']] },
              { text: 'نمسك إيد بعض ونبص بالكشاف', art: 'mys_torch', good: true, reply: [['moody', 'يلا! أنا معاكم.'], ['nemo', 'ماشي، بالراحة.']] },
              { text: 'ننادي ماما ونحكي لها', art: 'mys_phone', good: true, reply: [['mama', 'أنا هنا يا حبايبي! بصّوا بالكشاف سوا وأنا سامعاكم من المطبخ.'], ['aboody', 'كده أحسن!']] }]
          });
          if (ch.firstTry) ctx.reward.star(1); ctx.value('my_courage');
          const f = await ctx.games.mysFlash({
            prompt: 'حرّكوا الكشاف وشوفوا مين بيعمل الأصوات', radius: 125, hintAfter: 10, heroes: 'corner', spots: [
              { id: 'wind', x: 850, y: 160, s: 96, art: 'mys_wind', hit: 70, onFound: async () => { M.mys.snd('wind'); M.mys.snd('tap'); await ctx.say('nemo', 'ده الشيش! الهوا بيحرّكه وبيعمل طَق طَق.'); await ctx.say('aboody', 'يعني ده الهوا مش حاجة تانية!', { emote: 'happy' }); } },
              { id: 'cat', x: 158, y: 322, s: 92, art: 'mys_kitten:peek', onFound: async () => { M.mys.snd('meow'); await ctx.say('narrator', 'مياو.. مياو! فيه قطة صغيرة مستخبية ورا الستارة وعنيها بتلمع.'); await ctx.say('nemo', 'قطة صغيرة! يا حلوة!', { emote: 'happy' }); } },
              { id: 'clock', x: 700, y: 120, s: 96, draw: (g, t, s0, sp) => { G.fillRR(g, -54, -26, 108, 52, 18, '#fff7e3', 4); G.text(g, 'تك.. تك', 0, -2, { size: 28, color: '#8a5a3a' }); }, onFound: async () => { M.mys.snd('tick'); await ctx.say('moody', 'الساعة الكبيرة! بتدق تك تك. دي كمان من الأصوات.'); } }]
          });
          ctx.heroes(kids(300, 96, 1));
          if (f.hints <= 1) ctx.reward.star(1);
          await ctx.say('toota', 'نجرّب الأذن! نسمع الصوت ونقول جاي من مين.');
          m0 = mis(ctx);
          const e1 = await ears(ctx, 'tap', {
            prompt: 'اسمعوا الصوت.. ده صوت إيه؟', options: [
              { text: 'القطة', art: 'mys_kitten', good: false, consequence: [['nemo', 'القطة بتقول مياو مش طَق طَق.']] },
              { text: 'الشيش والهوا', art: 'mys_shutter', good: true, reply: [['moody', 'بالظبط! الهوا والشيش.']] },
              { text: 'الساعة', art: 'mys_clock', good: false, consequence: [['aboody', 'الساعة بتقول تك تك مش طَق.']] }]
          });
          const e2 = await ears(ctx, 'meow', {
            prompt: 'والصوت ده؟ اسمعوا كويس', options: [
              { text: 'الساعة', art: 'mys_clock', good: false, consequence: [['toota', 'لأ، الساعة بتدق بالتك.']] },
              { text: 'البومة', art: 'mys_owl', good: false, consequence: [['nemo', 'البومة بتقول هو هو.']] },
              { text: 'القطة', art: 'mys_kitten', good: true, reply: [['aboody', 'مياو! دي القطة!']] }]
          });
          if (e1.firstTry && e2.firstTry) ctx.reward.star(1);
          await ctx.say('mama', 'قطة؟! شكلها جعانة وصغيرة أوي. تعالوا نراعيها.');
          const fd = await choiceQ(ctx, {
            prompt: 'القطة الصغيرة جعانة. نديها إيه؟', options: [
              { text: 'شيكولاتة', art: 'mys_choc', good: false, consequence: [['mama', 'لأ يا حبيبي، الشيكولاتة مش كويسة للقطط.']] },
              { text: 'أكل قطط وميّه', art: 'mys_catfood', good: true, reply: [['mama', 'برافو! دي أحسن حاجة للقطة.'], ['nemo', 'هسمّيها لولو!']] },
              { text: 'حلويات كتير', art: 'candy', good: false, consequence: [['toota', 'الحلويات مش للقطط. نديها أكلها المخصوص.']] }]
          });
          if (fd.firstTry) ctx.value('my_kind');
          await ctx.say('narrator', 'لولو أكلت وشربت وبقت مبسوطة. ورجّعت تقول مياو بصوت صغير حلو.');
          await ctx.say('mama', 'هتبات معانا الليلة لحد ما نشوف صاحبها. وبرافو على شجاعتكم.');
          const q = await pq(ctx, 'my2');
          return ctx.nav.complete();
        }
      },

      /* ================= 3) الدور العلوي ================= */
      {
        id: 'm3', title: 'الدور العلوي', intro: 'نطلع السلم للعلية القديمة.. القمر بيضوّي وفيه صندوق موسيقى ينتظرنا.', values: ['my_curious', 'my_courage', 'teamwork'], sticker: 'mys_s_box',
        heroes: ALL4, control: ALL4, wisdom: 'نبص الأول قبل ما نخاف: غالبًا الحاجة اللي شكلها غريب بتبقى كرسي', diary: { pic: 'mys_musicbox', text: 'طلعنا العلية، القماشة البيضا طلعت كرسي، وفتحنا صندوق الموسيقى باللحن الصح' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('mys_attic', { state: { sheet: 1, box: 0 }, heroes: kids(250, 96, 1, 484) });
          await ctx.say('narrator', 'طلعنا السلم الخشب درجة درجة، واحد.. اتنين..');
          await ctx.quiz.ask(M.banks.my6_p2, { who: 'aboody' });
          await ctx.say('toota', 'الله! العلية فيها صناديق وألعاب قديمة والقمر بيضوّي من الشباك!');
          await ctx.say('aboody', 'بصّوا! فيه حاجة بيضا كبيرة في الركن.', { emote: 'surprised' });
          const ch = await choiceQ(ctx, {
            prompt: 'فيه حاجة بيضا في الركن. نعمل إيه؟', options: [
              { text: 'نجري نازلين من غير ما نبص', art: 'ball', good: false, consequence: [['moody', 'ممكن نبص الأول بالكشاف ونطمّن.']] },
              { text: 'ننوّر عليها بالكشاف ونبص بالراحة', art: 'mys_torch', good: true, reply: [['nemo', 'ماشي، نبص كويس.']] },
              { text: 'نشد القماشة بعنف', art: 'mys_hi', good: false, consequence: [['toota', 'بالراحة! ممكن يكون فيه حاجة قديمة تتكسر.']] }]
          });
          if (ch.firstTry) ctx.reward.star(1);
          st.state.sheet = 0; st.dirty(); ctx.sfx('whoosh'); ctx.fx.sparkle(852, 350);
          await ctx.say('aboody', 'هههه! ده كرسي! كان تحت القماشة!', { anim: 'cheer' });
          await ctx.say('moody', 'شفتوا؟ الخيال بيكبّر الحاجة. لما نبص بهدوء بتبان بسيطة.'); ctx.value('my_curious');
          await ctx.say('nemo', 'ودي صندوق موسيقى جميل على الترابيزة! بس شكله مقفول.');
          await ctx.say('toota', 'عليه رسمة: لازم نسمع اللحن ونكرّره بنفس الترتيب بالجواهر الملوّنة.');
          const tn = await ctx.games.mysTune({ prompt: 'اسمعوا اللحن وكرّروه بالجواهر', again: 'دوركم! كرّروا اللحن', who: 'toota', rounds: [[0, 1, 2], [2, 0, 3, 1]] });
          if (tn.misses <= 1) ctx.reward.star(1);
          st.state.box = 1; st.dirty(); ctx.heroes(kids(250, 96, 1, 484)); ctx.sfx('good');
          await ctx.say('narrator', 'صندوق الموسيقى اتفتح وبدأ يعزف لحن هادي وحلو، والنجمة بتلف.');
          M.mys.snd('music');
          const b = bobo(ctx, { x: 150, y: 356, emo: 'shy', sc: .55, a: 0, bob: 0 });
          await b.to({ a: 1 }, 1.1);
          await ctx.say('aboody', 'فيه حد بيبص علينا من ورا الشنطة!', { emote: 'surprised' });
          await ctx.say('toota', 'شكله مدوّر ولطيف.. ومش بيعمل حاجة. هو خجول.');
          b.emo = 'surprised'; await ctx.wait(.7); b.emo = 'shy'; await b.to({ a: 0, x: 120 }, .9);
          await ctx.say('nemo', 'استخبّى! يا ترى هو مين؟');
          await ctx.say('moody', 'لسه مش عارفين. بس مش مخيف خالص، شكله خجول زي ما قلتي يا {t}.');
          m0 = mis(ctx);
          const q = await pq(ctx, 'my3');
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('mama', 'ولاد؟ العشا جاهز تحت! انزلوا بالراحة وماسكين الدرابزين.');
          await ctx.say('toota', 'حاضر يا ماما! بعد العشا هنكتشف مين صاحبنا ده.');
          return ctx.nav.complete();
        }
      },

      /* ================= 4) الشبح الخجول ================= */
      {
        id: 'm4', title: 'الشبح الخجول', intro: 'صاحبنا الأبيض المدوّر خجول وبيستخبّى. نتعرّف عليه بلُطف ونبقى صحاب.', values: ['my_kind', 'my_courage', 'kindness'], sticker: 'mys_s_friend',
        heroes: ALL4, control: ALL4, wisdom: 'الخجول محتاج صبر وابتسامة، والصاحب الحلو بيطلّع أحلى ما فينا', diary: { pic: 'mys_bobo:happy', text: 'اتعرّفنا على بوبو الخجول وبقينا صحاب. كان لوحده في البيت الكبير' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('mys_living', { state: { lampK: 0, candle: 1 }, heroes: kids(260, 90, 1, 486) });
          await ctx.say('narrator', 'بعد العشا، قعدوا في الصالون جنب الشمعة الدافية. والبيت هادي ودافي.');
          await ctx.say('nemo', 'عارفين؟ أنا حاسّة إن حد بيراقبنا.. بس مش حاسّة بخوف، حاسّة بفضول.');
          await ctx.say('moody', 'جميل! فضول بدل خوف. نعمل بالكشاف لعبة: حرّكوه وشوفوا مين بيلمع.');
          let b = null;
          const peeks = [
            { id: 'p1', x: 480, y: 366, s: 100, art: 'mys_bobo:peek', onFound: async () => { M.mys.snd('chime'); await ctx.say('narrator', 'عينين بتلمع ورا الكنبة.. وبسرعة استخبّت!'); await ctx.say('aboody', 'ههه! بيلعب معانا استغماية.'); } },
            { id: 'p2', x: 250, y: 330, s: 100, art: 'mys_bobo:peek', onFound: async () => { await ctx.say('nemo', 'شفناه! بس هو خجول أوي.'); } },
            { id: 'p3', x: 690, y: 296, s: 100, art: 'mys_bobo:peek', onFound: async () => { await ctx.say('toota', 'خلاص يا جماعة. مش لازم نطارده.. نوطّي الكشاف ونسيبه ياخد راحته.'); } }];
          await ctx.games.mysFlash({ prompt: 'حرّكوا الكشاف وشوفوا العينين اللي بتلمع', radius: 125, hintAfter: 9, heroes: 'corner', spots: peeks });
          ctx.heroes(kids(260, 90, 1, 486));
          b = bobo(ctx, { x: 700, y: 420, emo: 'surprised', sc: 1, a: 0 });
          await b.to({ a: 1 }, 1.2);
          const sp = await choiceQ(ctx, {
            prompt: 'صاحبنا طلع! عينه بتتوجع من النور. نعمل إيه؟', options: [
              { text: 'نوجّه الكشاف في وشه', art: 'mys_torch', good: false, consequence: [['toota', 'ده بيتعبه! النور القوي ممكن يضايق.']] },
              { text: 'نوطّي الكشاف ونقول أهلًا بهدوء', art: 'mys_hi', good: true, reply: [['nemo', 'أهلًا.. إحنا مش هنأذيك. إحنا صحاب.'], ['moody', 'ولا تخاف.']] }]
          });
          if (sp.firstTry) ctx.reward.star(1); ctx.value('my_kind');
          b.emo = 'shy';
          await b.say('أنا.. أنا بوبو. أنا ساكن هنا في العلية من زمان.', { emote: 'shy' });
          await b.say('أنا خجول أوي.. ومحدش بيزور البيت. كنت لوحدي كتير.');
          await ctx.say('nemo', 'يا حبيبي! من النهاردة مش لوحدك.');
          await b.to({ x: 640 }, .8); b.emo = 'happy';
          await b.say('بجد؟ ممكن نبقى صحاب؟', { emote: 'happy' });
          m0 = mis(ctx);
          const sq = await ctx.games.sequence({ prompt: 'ازاي نتعرّف على صديق جديد؟ رتّبوا الخطوات', steps: [{ art: 'mys_hi', label: 'نقول أهلًا' }, { art: 'mys_bobo:shy', label: 'نسأل اسمك إيه' }, { art: 'ball', label: 'نعزمه يلعب' }, { art: 'heartbig', label: 'نقول شكرًا' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes(kids(260, 90, 1, 486));
          await b.say('أنا رسمت كروت لصحابي الخيال. تعالوا نلعب لعبة الكروت!');
          m0 = mis(ctx);
          const mm = await ctx.games.memory({ prompt: 'طابقوا الكروت المتشابهة', pairs: ['mys_bobo:happy', 'mys_kitten', 'mys_owl', 'mys_torch'], cols: 4 });
          if (mm.moves <= 9) ctx.reward.star(1);
          ctx.heroes(kids(260, 90, 1, 486)); b.emo = 'happy';
          await ctx.say('aboody', 'يلا نصافح بوبو!');
          await ctx.games.ritual({ text: 'نصافح بوبو', sub: 'اضغط هنا', who: 'aboody', bottom: 130 });
          ctx.fx.burst(600, 360, { kind: 'heart', n: 14 });
          await b.say('أنا مبسوط أوي! عندي صحاب!', { emote: 'happy' });
          await ctx.say('mama', 'بتكلّموا مع مين يا ولاد؟ أنا سامعة ضحك!');
          await ctx.say('nemo', 'مع صاحب جديد يا ماما! اسمه بوبو، وهو زي الأشباح اللطيفة في الكارتون.');
          await ctx.say('mama', 'أهلًا يا بوبو! أي صاحب لولادي ضيف عندنا. اتفضّل يا حبيبي.');
          await b.say('شكرًا يا طنط.. أنا مبسوط.', { emote: 'happy' });
          const q = await pq(ctx, 'my4');
          return ctx.nav.complete();
        }
      },

      /* ================= 5) مفتاح الشنطة ================= */
      {
        id: 'm5', title: 'مفتاح الشنطة', intro: 'بوبو بيعزمنا على لعبة استغماية: واللي يلاقيه يلاقي مفتاح الشنطة القديمة!', values: ['honesty', 'my_curious', 'teamwork'], sticker: 'mys_s_key',
        heroes: ALL4, control: ALL4, wisdom: 'الصراحة أحسن، حتى لو الغلط اتعمل بالغلط', diary: { pic: 'mys_key', text: 'لعبنا استغماية مع بوبو في المخزن والجنينة، وأنا قلت الحقيقة لما وقّعت البرطمان، ولقينا المفتاح' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('mys_pantry', { state: { jar: 0 }, heroes: kids(250, 96, 1, 486) });
          let b = bobo(ctx, { x: 660, y: 430, emo: 'happy', sc: 1, a: 1 });
          await b.say('أنا عندي لعبة! أنا هستخبّى وانتو دوّروا عليا. واللي يلاقيني يلاقي مفتاح الشنطة القديمة!', { emote: 'happy' });
          await ctx.say('moody', 'لعبة استغماية؟ تمام! احنا نعدّ للعشرة.');
          await b.to({ a: 0 }, .5); b.rm();
          await ctx.games.ritual({ text: 'نعدّ للعشرة', sub: 'واحد.. اتنين.. تلاتة.. لحد عشرة', who: 'toota', bottom: 150 });
          ctx.fx.float('عشرة! يلا ندوّر', 480, 300);
          const jarSpot = { id: 'jar', x: 360, y: 238, s: 80, art: 'mys_jar:#ff6f91', onFound: async () => { await ctx.say('aboody', 'برطمان عليه ورقة صغيرة! اسمعوا: المفتاح في الجنينة.. تحت حاجة بتنوّر.'); } };
          const bb = { id: 'bobo', x: 700, y: 352, s: 100, art: 'mys_bobo:peek', onFound: async () => { M.mys.snd('chime'); await ctx.say('narrator', 'هيهي! شفنا بوبو مستخبّي ورا شكائر الدقيق.'); } };
          const f = await ctx.games.mysFlash({ prompt: 'دوّروا على بوبو بالكشاف', radius: 125, hintAfter: 9, heroes: 'corner', spots: [jarSpot, bb] });
          ctx.heroes(kids(250, 96, 1, 486));
          if (f.hints === 0) ctx.reward.star(1);
          b = bobo(ctx, { x: 700, y: 430, emo: 'happy', sc: 1, a: 1 });
          await b.say('لقيتوني! أنا خرجت.. هههه!', { emote: 'happy' });
          await ctx.say('aboody', 'أنا هقفز من الفرحة!', { anim: 'jumpcheer' });
          ctx.sfx('drop'); st.state.jar = 1; st.dirty();
          await ctx.say('narrator', 'أوه! {a} خبط برطمان بالغلط ووقع وبيتدحرج على الأرض.');
          await ctx.say('mama', 'سمعت صوت في المخزن. مين وقّع البرطمان؟');
          const hn = await choiceQ(ctx, {
            prompt: 'ماما بتسأل مين وقّع البرطمان. نقول إيه؟', options: [
              { text: 'ده الهوا اللي وقّعه', art: 'mys_wind', good: false, consequence: [['mys_bobo', 'أنا ما عملتش حاجة!', { name: 'بوبو', icon: 'mys_bobo:surprised' }], ['aboody', 'آه.. غلط ألوم غيري. الصراحة أحسن.']] },
              { text: 'أنا يا ماما، بالغلط. آسف!', art: 'mys_hands', good: true, reply: [['mama', 'شكرًا على صراحتك يا حبيبي. الغلط بيحصل، المهم نصلّحه.'], ['aboody', 'هساعدك ونرجّعه مكانه.']] },
              { text: 'أستخبّى وما أقولش', art: 'sad', good: false, consequence: [['toota', 'لو سكتنا ماما هتقلق. الأحسن نقول الحقيقة.']] }]
          });
          if (hn.firstTry) ctx.reward.star(1); ctx.value('honesty');
          m0 = mis(ctx);
          const dd = await ctx.games.dragdrop({
            prompt: 'رجّعوا البرطمان مكانه على الرف', heroes: 'hidden', panel: { x: 300, y: 100, w: 360, h: 100 }, wrongHint: 'البرطمان مكانه على الرف',
            items: [{ id: 'jar1', art: 'mys_jar:#ff6f91', to: 'shelf', x: 480, y: 150, s: 70 }],
            targets: [{ id: 'shelf', x: 470, y: 330, w: 300, h: 80, cols: 1, itemScale: .8, draw: g => { G.fillRR(g, -140, 22, 280, 10, 4, 'rgba(255,240,170,.8)', 3); } }]
          });
          st.state.jar = 0; st.dirty(); ctx.heroes(kids(250, 96, 1, 486));
          await b.say('الغلط بيحصل لأي حد. إنت شجاع إنك قلت الحقيقة.', { emote: 'happy' });
          await b.say('يلا للجنينة! المفتاح ينتظرنا هناك.');

          await ctx.scene('mys_garden', { state: { owl: 0, key: 0, shutter: 1 }, heroes: kids(100, 96, 1, 486) });
          b = bobo(ctx, { x: 600, y: 430, emo: 'happy', sc: 1, a: 1 });
          await ctx.say('mama', 'أنا واقفة عند باب المطبخ يا ولاد، شايفاكم. ماتبعدوش عن الباب.');
          await b.say('الجنينة بالليل حلوة أوي. فيها نجوم وحاجات بتنوّر!', { emote: 'happy' });
          m0 = mis(ctx);
          const rd = await ctx.quiz.ask(M.banks.my6_k3, { who: 'nemo' });
          ctx.skill('animals');
          await ctx.say('nemo', 'أيوه! الحشرة المنوّرة! بصّوا حواليكم.');
          M.mys.snd('owl'); await ctx.wait(1.2);
          await ctx.say('aboody', 'هو.. هو.. سمعتوا؟', { emote: 'surprised' });
          const ow = await ears(ctx, 'owl', {
            prompt: 'اسمعوا الصوت.. مين ده؟', options: [
              { text: 'بومة', art: 'mys_owl', good: true, reply: [['nemo', 'بومة! بتصحى بالليل.']] },
              { text: 'قطة', art: 'mys_kitten', good: false, consequence: [['toota', 'القطة بتقول مياو.']] },
              { text: 'الهوا', art: 'mys_wind', good: false, consequence: [['moody', 'الهوا مش بيقول هو هو.']] }]
          });
          await ctx.say('toota', 'نبص بالكشاف: البومة، والحشرات المنوّرة، والمفتاح اللي بوبو قال عليه.');
          const g = await ctx.games.mysFlash({
            prompt: 'نوّروا على البومة والحشرات والمفتاح', radius: 125, hintAfter: 10, heroes: 'corner', spots: [
              { id: 'owl', x: 668, y: 188, s: 100, art: 'mys_owl', onFound: async () => { M.mys.snd('owl'); await ctx.say('nemo', 'بومة صغيرة بتبص علينا بنعاس. شكلها لطيف أوي.'); } },
              { id: 'fly', x: 520, y: 300, s: 110, draw: (gg, t) => { [[-30, -10], [20, -26], [34, 14], [-10, 24], [0, -6]].forEach((p, i) => A.draw(gg, 'mys_firefly', p[0], p[1] + Math.sin(t * 2 + i) * 4, 30)); }, onFound: async () => { await ctx.say('aboody', 'حشرات منوّرة! عدّوا معايا: واحد، اتنين، تلاتة، أربعة، خمسة!'); } },
              { id: 'key', x: 800, y: 340, s: 74, art: 'mys_key', r: 70, onFound: async () => { st.state.key = 1; st.dirty(); M.mys.snd('chime'); await ctx.say('narrator', 'المفتاح متعلّق في خيط على الغصن التحتاني، ولامع زي النجمة.'); } }]
          });
          ctx.heroes(kids(100, 96, 1, 486));
          if (g.hints === 0 || (mis(ctx) - m0 <= 1)) ctx.reward.star(1);
          await b.say('لقيتوا المفتاح! أنا فخور بيكم.', { emote: 'happy' });
          await ctx.say('moody', 'والشيش اللي بيخبّط على شباك البيت، لازم نقول لبابا يثبّته.');
          M.mys.snd('tap');
          await ctx.say('baba', 'ألو يا أبطال؟ أنا وصلت قدام البيت! سمعت الشيش وهثبّته بكرة. لحظة وأدخل أصلّح الكهربا.');
          ctx.value('my_tell');
          const q = await pq(ctx, 'my5');
          return ctx.nav.complete();
        }
      },

      /* ================= 6) حفلة الأصدقاء ================= */
      {
        id: 'm6', title: 'حفلة الأصدقاء', intro: 'بابا صلّح الكهربا! نعمل حفلة لبوبو وللقطة ولكل أصحابنا.', values: ['my_courage', 'my_kind', 'teamwork', 'my_tell'], sticker: 'mys_s_brave',
        heroes: ALL4.concat(['baba']), control: ALL4, wisdom: 'الشجاعة إنك تحس بالقلق وتجرّب برضه مع صحابك وكبيرك', diary: { pic: 'mys_medal', text: 'عملنا حفلة لبوبو بعد ما بابا صلّح الكهربا، واتعلّمنا إن الشجاعة مع بعض أحلى' },
        async run(ctx) {
          const st = ctx.stage; let m0 = mis(ctx);
          await ctx.scene('mys_living', { state: { lampK: 0, candle: 1 }, heroes: Object.assign(kids(150, 96, 1, 486), lay([['baba', 700, 470, -1]])) });
          let b = bobo(ctx, { x: 560, y: 420, emo: 'happy', sc: 1, a: 1 });
          await ctx.say('baba', 'السلام عليكم يا أبطال! وصلت ومعايا الفيوزات. أول حاجة نصلّح النور.', { anim: 'wave' });
          await ctx.say('aboody', 'يا بابا! ده بوبو صاحبنا الجديد!');
          await b.say('أهلًا يا عمو بابا.. أنا بوبو.', { emote: 'shy' });
          await ctx.say('baba', 'أهلًا يا بوبو! أي صاحب لولادي يبقى من العيلة.');
          await ctx.games.ritual({ text: 'نشغّل النور', sub: 'بابا بيصلّح الفيوز', who: 'moody', bottom: 130 });
          ctx.sfx('good'); ctx.sfx('bell');
          await ctx.scene('mys_living', { state: { lampK: 1, candle: 0, party: 1 }, heroes: Object.assign(kids(150, 96, 1, 486), lay([['baba', 700, 470, -1]])) });
          b = bobo(ctx, { x: 560, y: 420, emo: 'surprised', sc: 1, a: 1 });
          await ctx.say('nemo', 'النور رجع! والصالون بقى مضوّي وحلو.');
          b.emo = 'happy';
          await b.say('الله! الدنيا منوّرة. وأنا مش خايف.. أنا مبسوط!', { emote: 'happy' });
          await ctx.say('moody', 'نعمل حفلة صغيرة! ونحضّر الترابيزة. أصحابنا ٥: إحنا الأربعة وبوبو.');
          const items = [];
          for (let i = 0; i < 5; i++) items.push({ id: 'pl' + i, art: 'plate', to: 'table', x: 170 + i * 120, y: 160, s: 64 });
          items.push({ id: 'cake', art: 'mys_cake', to: 'table', x: 770, y: 160, s: 74 });
          const dd = await ctx.games.dragdrop({
            prompt: 'حطّوا طبق لكل صاحب (٥) والكيك على الترابيزة', heroes: 'hidden', panel: { x: 90, y: 104, w: 790, h: 112 }, wrongHint: 'الأطباق والكيك على الترابيزة',
            items, targets: [{ id: 'table', x: 405, y: 410, w: 300, h: 50, cols: 6, dx: 44, dy0: -26, itemScale: .5, draw: g => { } }]
          });
          if (dd.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes(Object.assign(kids(150, 96, 1, 486), lay([['baba', 700, 470, -1]])));
          await ctx.say('mama', 'ما شاء الله! سفرة حلوة أوي. وجبت لكم عصير ولولو جت تحضر الحفلة كمان.');
          st.state.cat = 1; st.dirty(); M.mys.snd('meow');
          await ctx.say('nemo', 'لولو! أهلًا بيكي في الحفلة.', { emote: 'happy' });
          await b.say('عندي مفاجأة! المفتاح فتح الشنطة القديمة، ولقيت فيها لعب وبالونات قديمة.', { emote: 'happy' });
          st.sparkle && st.sparkle(480, 200, { n: 14 });
          const gg = await choiceQ(ctx, {
            prompt: 'إيه اللي ساعدنا نبقى شجعان النهارده؟', options: [
              { text: 'نفس عميق وإيد في إيد', art: 'mys_hands', good: true, reply: [['nemo', 'أيوه! النفس العميق هدّانا.']] },
              { text: 'نبص ونشوف الصوت إيه', art: 'mys_torch', good: true, reply: [['moody', 'لما نبص بالكشاف بنطمّن.']] },
              { text: 'نقول لماما وبابا', art: 'mys_phone', good: true, reply: [['toota', 'الكبار دايمًا جنبنا.']] },
              { text: 'نسلّم على الجديد بابتسامة', art: 'mys_hi', good: true, reply: [['aboody', 'بوبو بقى صاحبنا!']] }]
          });
          ctx.value('my_courage');
          await ctx.say('baba', 'كلهم صح! الشجاعة مش إننا منخافش، الشجاعة إننا نجرّب مع صحابنا وكبارنا.');
          await ctx.games.ritual({ text: 'هيييه! حفلة!', sub: 'نحتفل كلنا', who: 'nemo', bottom: 130 });
          ctx.fx.confetti(); ctx.sfx('fanfare'); st.playBoth('cheer', 2);
          await b.say('أنا أول مرة أعمل حفلة! شكرًا يا أصحابي. البيت ده بقى بيتكم.', { emote: 'happy' });
          m0 = mis(ctx);
          const q = await ctx.quiz.fromBank({ n: 2, tag: 'my6', who: ctx.active });
          if (q.firstTry >= 1 && mis(ctx) - m0 <= 2) ctx.reward.star(1);
          await ctx.say('mama', 'وبما إنكم كنتم شجعان وأصحاب كويسين، ليكم ميدالية الشجاعة.');
          ctx.fx.sparkle(480, 300); ctx.sfx('star');
          await ctx.say('nemo', 'ميدالية شجاع! الحمد لله على الصحاب الجداد.');
          await ctx.say('baba', 'يوم جميل. وبكرة نثبّت الشيش ونشوف الجنينة بالنهار.');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
