/* Moody & Aboody - worlds/school.js : WORLD 2 "المدرسة" (6 missions).
   Same structure as worlds/home.js. Scenes: worlds/school_art.js, extra kits: worlds/school_kits.js, questions: content/q_school.js.
   Tokens {m} {a} {me} in strings become the heroes' (editable) names. */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util;
  const pulse = r => (g, t) => { g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const faint = (art, s) => (g, t) => { g.save(); g.globalAlpha = .6; A.draw(g, art, 0, 0, s); g.restore(); G.sparkle(g, s * .3, -s * .3, 7 + Math.sin(t * 6) * 2, '#fff', .9); };
  const TEACHER = { name: 'أبلة سلمى' };

  /* values / skills labels for the parent panel */
  M.registerValue('respect', { label: 'الاحترام والتحية', desc: 'السلام على المعلمة ورفع الإيد قبل الكلام' });
  M.registerValue('punctual', { label: 'الالتزام بالمواعيد والطابور', desc: 'نلحق الأتوبيس ونقف في الطابور بهدوء' });
  M.registerValue('quiet', { label: 'الهدوء في الأماكن العامة', desc: 'التزام الهدوء في المكتبة والفصل' });
  M.registerValue('recycle', { label: 'نظافة المكان وفرز الزبالة', desc: 'ننضّف وراءنا ونرمي في المكان الصح' });
  M.registerValue('fairplay', { label: 'اللعب النضيف وتشجيع الغير', desc: 'نساعد المنافس ونشجّع الكل' });
  M.registerValue('roadsafety', { label: 'أمان الطريق', desc: 'إشارة المرور والبصّ يمين وشمال' });
  M.registerValue('curiosity', { label: 'حب العلم والتجربة', desc: 'نجرّب ونلاحظ ونتعلم بأمان' });

  /* a few decorative layers used by missions */
  function kidsLayer(st, cols, x0, y, gap) { return st.addLayer({ z: 4, draw(g, t) { cols.forEach((c, i) => { const bob = Math.sin(t * 2 + i) * 1.5; A.draw(g, 'kid:' + c, x0 + i * gap, y + bob, 82); }); } }); }
  const bgBus = (g, t) => { const k = (t * 260) % 240; g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#a8dcff', '#ffeec2']); g.fillRect(0, 0, 960, 540); G.sun(g, 800, 90, 28, t); G.cloud(g, 200 + (t * 8) % 700, 100, 1.1); for (let i = -1; i < 6; i++) { const x = i * 240 - k; g.fillStyle = ['#ffd0a8', '#d9c7f5', '#c9eed0', '#ffe29a'][((i % 4) + 4) % 4]; G.fillRR(g, x + 20, 190, 130, 220, 6, g.fillStyle, 4.5); G.fillRR(g, x + 50, 220, 36, 44, 4, '#bfe8ff', 3); G.fillRR(g, x + 100, 300, 30, 50, 4, '#8a5a3a', 3); } g.fillStyle = '#d9d2c0'; g.fillRect(0, 410, 960, 70); G.line(g, 0, 410, 960, 410, 4); g.fillStyle = '#6b6f80'; g.fillRect(0, 480, 960, 60); G.line(g, 0, 480, 960, 480, 5); };
  const bgGym = (g, t) => { g.fillStyle = G.lin(g, 0, 0, 0, 540, ['#c8e6ff', '#eaf5ff']); g.fillRect(0, 0, 960, 540); const k = (t * 200) % 160; for (let i = -1; i < 8; i++) { const x = i * 160 - k; G.fillRR(g, x + 30, 120, 90, 120, 8, ['#ef5350', '#4a8dff', '#ffd23c', '#5cc96b'][((i % 4) + 4) % 4], 4); G.text(g, '★', x + 75, 180, { size: 44, color: '#fff' }); } g.fillStyle = '#e3b378'; g.fillRect(0, 300, 960, 240); G.line(g, 0, 300, 960, 300, 4); g.fillStyle = '#c58e55'; g.fillRect(0, 478, 960, 62); G.line(g, 0, 478, 960, 478, 5); g.fillStyle = 'rgba(255,255,255,.7)'; for (let i = -1; i < 9; i++) g.fillRect(i * 120 - ((t * 260) % 120), 505, 60, 6); };

  M.registerWorld({
    id: 'school', order: 2, title: 'المدرسة', icon: 'w_school', theme: { c1: '#9ed8ff', c2: '#4a8dff' }, finalSticker: 's_school',
    stickers: [
      { id: 's_bus', title: 'بطل الأوتوبيس', art: 'schoolbus', bg: '#fff3c4' }, { id: 's_class', title: 'تلميذ مؤدب', art: 'bell', bg: '#ffe9c8' },
      { id: 's_recess', title: 'نجم الفسحة', art: 'lunchbox', bg: '#d6f3ee' }, { id: 's_lab', title: 'عالم صغير', art: 'flask:#4aa8e8', bg: '#e0f0ff', rot: .1 },
      { id: 's_library', title: 'صديق المكتبة', art: 'bookstack', bg: '#ece0ff' }, { id: 's_sport', title: 'بطل اللعب النضيف', art: 'trophy', bg: '#fff0c4', rot: -.05 },
      { id: 's_school', title: 'أبطال المدرسة', art: 'w_school', bg: '#dff0ff', rot: -.05 }
    ],
    missions: [
      /* ============ 1) الأوتوبيس والطابور ============ */
      {
        id: 'm1', title: 'الأوتوبيس والطابور', intro: 'أول يوم مدرسة بدري.. نلحق الأوتوبيس!', values: ['punctual', 'respect', 'teamwork'], sticker: 's_bus',
        wisdom: 'اللي بيقف في الطابور بهدوء.. الكل بيحترمه', diary: { pic: 'schoolbus', text: 'لحقنا الأوتوبيس ووقفنا في الطابور بهدوء' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('sc_street', { state: { busX: null }, heroes: { moody: { x: 330, y: 482, dir: 1 }, aboody: { x: 430, y: 492, dir: 1 } } });
          await ctx.say('mama', 'يلا يا حبايبي، الأوتوبيس هييجي كمان شوية! اتأكدوا من الشنطة الأول.', { name: 'ماما' });
          await ctx.say('aboody', 'أنا حطيت عربيتي وتيدي في الشنطة!');
          await ctx.say('moody', 'لأ يا {a}! الشنطة للحاجات اللي محتاجينها في المدرسة بس. تعالى نرتّبها.');
          const bag = await ctx.games.dragdrop({
            prompt: 'حطّ في الشنطة اللي محتاجينه للمدرسة', heroes: 'corner', panel: { x: 130, y: 120, w: 700, h: 190 }, wrongHint: 'ده مش للمدرسة.. نسيبه في البيت',
            items: U.shuffle([['notebook', 'bag', 1], ['pencilcase', 'bag', 1], ['lunchbox', 'bag', 1], ['bottle', 'bag', 1], ['ruler', 'bag', 1], ['bookstack', 'bag', 1], ['car', 'home', 0], ['teddy', 'home', 0], ['ball', 'home', 0]]).map((it, i) => Object.assign({ id: it[0], art: it[0], to: it[1], x: 215 + (i % 5) * 125, y: i < 5 ? 185 : 262, s: 64 }, it[0] === 'bookstack' ? { needs: 'moody', needsMsg: 'الكتب تقيلة! محتاجين {m}' } : {})),
            targets: [{ id: 'bag', x: 300, y: 380, w: 190, h: 100, art: 'bag', s: 130, label: 'شنطة المدرسة', cols: 4, dx: 26, itemScale: .42 }, { id: 'home', x: 700, y: 380, w: 160, h: 100, art: 'box', s: 110, label: 'نسيبها في البيت', cols: 3, dx: 28, itemScale: .42 }]
          });
          if (bag.mistakes <= 2) ctx.reward.star(1);
          ctx.value('tidy');
          await ctx.say('mama', 'الشنطة جاهزة! اجروا بسرعة، الأوتوبيس خلاص قرب!', { name: 'ماما' });
          const run = await ctx.games.runner({ distance: 2100, speed: 270, bg: bgBus, prompt: 'اجروا للموقف! اقفزوا فوق الحاجات اللي في الطريق', obstacles: [{ art: 'cone', h: 46 }, { art: 'bin:blue', h: 46 }, { art: 'ball', h: 40 }] });
          if (run.hits <= 1) ctx.reward.star(1);
          await ctx.scene('sc_street', { state: { busX: 1220 }, heroes: { moody: { x: 300, y: 482, dir: 1 }, aboody: { x: 400, y: 492, dir: 1 } } });
          M.tw(st.state, { busX: 690 }, 1.8, 'outCubic'); ctx.sfx('click'); await ctx.wait(2);
          const kl = kidsLayer(st, ['#ff6f91', '#8a6bd6', '#5cc96b'], 520, 462, 70);
          await ctx.say('aboody', 'الأوتوبيس وصل! يلا نطلع قبل الكل!', { anim: 'jump' });
          await ctx.say('friend', 'أنا هسبقكم! وسّعوا!', { name: 'تلميذ مستعجل' });
          const q = await ctx.games.choice({
            prompt: 'تلميذ عايز يدخل قبل الكل في الطابور.. نعمل إيه؟', options: [
              { text: 'ندفعه ونسبقه', art: 'sad', good: false, consequence: [['narrator', 'الدفع خلّى واحدة من البنات تقع شنطتها...'], ['moody', 'أوه! كده بنأذي غيرنا. الطابور للكل.']] },
              { text: 'نقف في الطابور بهدوء', art: 'smile', good: true, reply: [['aboody', 'كل واحد بدوره، والكل هيطلع.']] },
              { text: 'نقوله بأدب: الطابور من هنا', art: 'heartbig', good: true, reply: [['friend', 'عندك حق.. أنا آسف!', { name: 'التلميذ' }], ['moody', 'الكلمة الحلوة بتحل كل حاجة.']] }]
          });
          if (q.firstTry) ctx.reward.star(1);
          ctx.value('respect'); kl();
          st.state.busDoor = true; ctx.sfx('good');
          await ctx.say('baba', 'السلام عليكم يا شباب! أنا عم سعيد سواق الأوتوبيس. عندي لغز قبل ما نتحرك: كل واحد فيكم عليه سؤال!', { name: 'عم سعيد' });
          await ctx.quiz.pair({ cat: ['math', 'arabic', 'general'] });
          await ctx.say('baba', 'برافو! اتفضلوا اقعدوا واربطوا الحزام.', { name: 'عم سعيد' });
          await ctx.games.ritual({ text: 'بسم الله', sub: 'قبل ما نتحرك' });
          ctx.sticker.give('s_bus');
          await ctx.say('aboody', 'وصلنا المدرسة! الحمد لله.', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 2) أول حصة ============ */
      {
        id: 'm2', title: 'أول حصة', intro: 'الجرس رن.. الحصة الأولى بتبدأ!', values: ['respect', 'kindness', 'study', 'share'], sticker: 's_class',
        wisdom: 'الأدب قبل العلم.. وكلمة حلوة بتفتح القلوب', diary: { pic: 'bell', text: 'سلّمنا على الأبلة وساعدنا صاحب جديد يلاقي مقعد' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('sc_class', { state: { dirty: true, board: ['اليوم: الأحد', 'درس اليوم: نتعلم ونتعاون'] }, heroes: { moody: { x: 330, y: 482, dir: 1 }, aboody: { x: 430, y: 492, dir: 1 } } });
          await ctx.say('mama', 'صباح الخير يا أبطال! اتفضلوا.', TEACHER);
          await ctx.say('moody', 'إزاي نحيّي أبلة سلمى؟');
          await ctx.games.ritual({ text: 'السلام عليكم', sub: 'نحيّي المعلمة', who: 'aboody' });
          ctx.value('respect');
          await ctx.say('mama', 'وعليكم السلام ورحمة الله! ما شاء الله أدب جميل. {m}، السبورة مكتوب عليها حاجات قديمة فوق.. تقدر تمسحها؟', TEACHER);
          st.setActive('aboody', true);
          await ctx.games.tap({ prompt: 'السبورة عالية! {m} الطويل يمسحها', list: false, spots: [{ id: 'board', x: 440, y: 130, s: 120, hit: 90, needs: 'moody', needsMsg: 'السبورة عالية! محتاجين {m} الطويل', draw: pulse(70), onFound: () => { st.state.dirty = false; ctx.sfx('click'); } }] });
          await ctx.say('mama', 'تسلم إيدك! والطباشير وقع تحت المكتب.. مين يجيبه؟', TEACHER);
          await ctx.games.tap({ prompt: '{a} الصغير يجيب الطباشير من تحت المكتب', hintAfter: 12, spots: [{ id: 'chalk', art: 'chalk', x: 300, y: 418, s: 44, needs: 'aboody', walkOff: 0, draw: faint('chalk', 52), listArt: 'chalk' }] });
          ctx.reward.star(1); ctx.value('help');
          await ctx.say('mama', 'ممتاز! دلوقتي سؤال لكل الفصل: مين يعرف الإجابة؟', TEACHER);
          const hc = await ctx.games.choice({
            prompt: 'أبلة سلمى سألت.. وإنت عارف الإجابة!', options: [
              { text: 'أصرخ بالإجابة بصوت عالي', art: 'sad', good: false, consequence: [['mama', 'استنى دورك يا حبيبي.. الكل عايز يتكلم.', TEACHER], ['aboody', 'آه صح! لازم نرفع إيدينا.']] },
              { text: 'أرفع إيدي وأستنى', art: 'handup', good: true, reply: [['mama', 'برافو! اتفضل يا {m}.', TEACHER]] }]
          });
          if (hc.firstTry) ctx.reward.star(1);
          const cq = await ctx.quiz.pair({ cat: ['arabic', 'math', 'science', 'english'] });
          await ctx.say('mama', 'ممتاز! سؤال تاني للفصل كله:', TEACHER);
          const cq2 = await ctx.quiz.pair({ cat: ['general', 'geography', 'logic', 'riddles'] });
          if (cq.firstTry + cq2.firstTry >= 2) ctx.reward.star(1);
          st.state.hideDesks = true; ctx.sfx('click');
          await ctx.say('mama', 'عندنا تلميذ جديد في الفصل.. اسمه أوفا. ممكن تساعدوه يلاقي مقعد؟', TEACHER);
          await ctx.say('ofa', 'أنا أوفا.. أول يوم لي هنا وخايف شوية.');
          const mk = (id, bag) => ({ id, x: 0, y: 0, w: 130, h: 96, bag, draw: (g, tt) => A.draw(g, 'desk', 0, 0, 108, { bag: tt.bag }) });
          const d1 = mk('d1', true), d2 = mk('d2', false), d3 = mk('d3', true); [d1.x, d2.x, d3.x] = [230, 480, 730]; d1.y = d2.y = d3.y = 360;
          const seat = await ctx.games.dragdrop({
            prompt: 'ساعد أوفا يلاقي مقعد فاضي', heroes: 'corner', wrongHint: 'المقعد ده عليه شنطة صاحبه.. دوّر على الفاضي',
            items: [{ id: 'ofa', art: 'face:ofa', to: 'd2', x: 480, y: 200, s: 84 }], targets: [d1, d2, d3].map(d => Object.assign(d, { label: d.id === 'd2' ? '' : '' }))
          });
          await ctx.say('ofa', 'شكرًا أوي! حاسس إني بقيت أحسن.');
          await ctx.say('ofa', 'بس نسيت القلم في البيت!');
          const pc = await ctx.games.choice({
            prompt: 'أوفا ما معاهوش قلم.. نعمل إيه؟', options: [
              { text: 'نقوله: ده مش مشكلتي', art: 'sad', good: false, consequence: [['ofa', 'ماشي.. هحاول أستلف من حد تاني.'], ['aboody', 'أنا حاسس إنه زعل.. كان ممكن نساعده.']] },
              { text: 'نديه قلم من علبة الأقلام', art: 'pencil', good: true, reply: [['ofa', 'ربنا يخليكم! أنتم أصحاب كويسين.'], ['moody', 'المساعدة الصغيرة بتفرق.']] }]
          });
          if (pc.firstTry) ctx.reward.star(1);
          ctx.value('kindness'); ctx.sticker.give('s_class');
          await ctx.say('mama', 'أنتم تلاميذ ممتازين! الجرس هيرن.. الفسحة!', TEACHER);
          ctx.sfx('bell');
          return ctx.nav.complete();
        }
      },
      /* ============ 3) الفسحة ============ */
      {
        id: 'm3', title: 'الفسحة', intro: 'الجرس رن! وقت الفسحة والأكل واللعب.', values: ['healthy', 'share', 'recycle', 'tidy', 'honesty'], sticker: 's_recess',
        wisdom: 'اللي بيشارك أكله.. بيكسب أصحاب', diary: { pic: 'lunchbox', text: 'اخترنا أكل صحي وقسمنا السندوتش وضّفنا الفسحة' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('sc_yard', { state: { canteen: false }, heroes: { moody: { x: 330, y: 484, dir: 1 }, aboody: { x: 430, y: 494, dir: 1 } } });
          ctx.sfx('bell');
          await ctx.say('aboody', 'الجرس رن! الفسحة! أنا جعان أوي.');
          await ctx.say('moody', 'استنى يا {a}.. إيدينا مليانة طباشير وتراب. لازم نغسلها الأول.');
          const hw = await ctx.games.sequence({ prompt: 'رتّب خطوات غسل الإيدين', steps: [{ art: 'water', label: 'بلّل إيدك' }, { art: 'soap', label: 'ضع الصابون' }, { art: 'sparkles', label: 'افرك كويس' }, { art: 'tap', label: 'اشطف' }, { art: 'towel', label: 'نشّف' }] });
          if (hw.mistakes <= 1) ctx.reward.star(1);
          ctx.value('healthy');
          await ctx.scene('sc_yard', { state: { canteen: true }, heroes: 'corner' });
          await ctx.say('narrator', 'وصلوا الكانتين. فيه أكل كتير.. بس أيّه اللي بيفيد جسمنا؟');
          const items = [['sandwich', 'tray'], ['apple', 'tray'], ['milk', 'tray'], ['banana', 'tray'], ['juice', 'tray'], ['carrot', 'tray'], ['chips', 'later'], ['candy', 'later'], ['soda', 'later'], ['cake', 'later']];
          const order = U.shuffle(items), xs = [190, 300, 410, 520, 630];
          const cn = await ctx.games.dragdrop({
            prompt: 'اختار الأكل الصحي للصينية', panel: { x: 130, y: 120, w: 700, h: 200 },
            items: order.map((it, i) => ({ id: it[0], art: it[0], to: it[1], x: xs[i % 5] + 15, y: i < 5 ? 185 : 265, s: 62, hint: it[1] === 'later' ? 'ده للحلويات مرة في الأسبوع بس' : null })),
            targets: [{ id: 'tray', x: 360, y: 380, w: 220, h: 90, art: 'plate', s: 130, label: 'صينية صحية', cols: 5, dx: 28, dy0: -4, itemScale: .45 }, { id: 'later', x: 760, y: 375, w: 150, h: 90, art: 'box', s: 100, label: 'بعدين', cols: 4, dx: 24, itemScale: .4 }]
          });
          if (cn.mistakes <= 2) ctx.reward.star(1);
          ctx.sticker.give('s_recess');
          await ctx.scene('sc_yard', { state: { canteen: false }, heroes: { moody: { x: 330, y: 484, dir: 1 }, aboody: { x: 430, y: 494, dir: 1 } } });
          await ctx.say('ofa', 'أنا أوفا.. نسيت السندوتش في البيت وجعان.');
          const sh = await ctx.games.choice({
            prompt: 'أوفا ما معاهوش أكل.. نعمل إيه؟', options: [
              { text: 'ناكل في ركن بعيد ونسيبه', art: 'sad', good: false, consequence: [['ofa', 'أنا قاعد لوحدي وبطني بتصوّت...'], ['aboody', 'ياااه.. كده مش حلو.']] },
              { text: 'نقسم سندوتشنا معاه', art: 'sandwich', good: true, reply: [['ofa', 'الله يخليكم! أحلى سندوتش!'], ['moody', 'الأكل بالمشاركة طعمه أحلى.']] },
              { text: 'نديه نص التفاحة ونص العصير', art: 'apple', good: true, reply: [['ofa', 'ميرسي! أنتم كرماء أوي.']] }]
          });
          if (sh.firstTry) ctx.reward.star(1);
          ctx.value('share');
          await ctx.say('aboody', 'فضل عندي نص السندوتش.. أرميه؟');
          await ctx.games.choice({
            prompt: 'فضل نص سندوتش. نعمل إيه؟', options: [
              { text: 'نرميه في الزبالة', art: 'sad', good: false, consequence: [['moody', 'الأكل نعمة.. لو رميناه هيضيع.'], ['aboody', 'عندك حق.']] },
              { text: 'نلفّه ونرجّعه للشنطة', art: 'lunchbox', good: true, reply: [['moody', 'برافو! مش بنضيّع الأكل.']] },
              { text: 'نديه لحد جعان', art: 'heartbig', good: true, reply: [['aboody', 'تمام! أكتر ناس هتفرح.']] }]
          });
          ctx.value('honesty');
          await ctx.say('moody', 'الفسحة كلها زبالة وراقة.. يلا نضّف المكان قبل ما نلعب!');
          const rec = await ctx.games.dragdrop({
            prompt: 'افرز الزبالة: عضوي، ورق، بلاستيك', heroes: 'corner', wrongHint: 'جرّب الصندوق التاني.. اللون بيفرق',
            items: U.shuffle([['core', 'green'], ['paper', 'blue'], ['bottle', 'yellow'], ['wrapper', 'yellow'], ['paper', 'blue'], ['core', 'green']]).map((it, i) => ({ id: 'tr' + i, art: it[0], to: it[1], x: 230 + i * 100, y: 200 + (i % 2) * 50, s: 58 })),
            targets: [{ id: 'green', x: 240, y: 355, w: 150, h: 100, art: 'bin:green', s: 100, label: 'عضوي', cols: 3, dx: 20, itemScale: .3 }, { id: 'blue', x: 480, y: 355, w: 150, h: 100, art: 'bin:blue', s: 100, label: 'ورق', cols: 3, dx: 20, itemScale: .3 }, { id: 'yellow', x: 720, y: 355, w: 150, h: 100, art: 'bin:yellow', s: 100, label: 'بلاستيك', cols: 3, dx: 20, itemScale: .3 }]
          });
          if (rec.mistakes <= 2) ctx.reward.star(1);
          ctx.value('recycle');
          await ctx.say('aboody', 'المكان بقى نضيف! دلوقتي نلعب لعبة الذاكرة مع أوفا.');
          const small = M.tierFor(ctx.active) === 6;
          await ctx.games.memory({ prompt: 'العب لعبة الذاكرة في الفناء', pairs: small ? ['ball', 'apple', 'bell'] : ['ball', 'apple', 'bell', 'pencil', 'lunchbox', 'duck'], timeLimit: small ? 50 : 75 });
          await ctx.say('ofa', 'إنتم أحسن أصحاب! النهارده كان أحلى يوم.');
          return ctx.nav.complete();
        }
      },
      /* ============ 4) حصة العلوم والمعمل ============ */
      {
        id: 'm4', title: 'حصة العلوم والمعمل', intro: 'تجارب ممتعة في المعمل.. بأمان!', values: ['curiosity', 'study', 'teamwork'], sticker: 's_lab',
        wisdom: 'اللي بيجرّب بحرص.. بيتعلّم بأمان', diary: { pic: 'flask:#4aa8e8', text: 'عملنا تجارب النبات والمغناطيس بأمان في المعمل' },
        async run(ctx) {
          const st = ctx.stage; const T = { name: 'أستاذ كريم' };
          await ctx.scene('sc_lab', { state: { goggles: true }, heroes: { moody: { x: 330, y: 484, dir: 1 }, aboody: { x: 430, y: 494, dir: 1 } } });
          await ctx.say('baba', 'أهلًا بالعلماء الصغيرين في المعمل! قبل أي تجربة: السلامة أولًا.', T);
          st.setActive('moody', true);
          await ctx.games.tap({ prompt: 'البس النضارة الواقية الأول', list: false, spots: [{ id: 'gog', x: 120, y: 316, s: 70, hit: 56, draw: pulse(46), onFound: () => { st.state.goggles = false; ctx.sfx('click'); } }] });
          await ctx.say('moody', 'النضارة بتحمي عنينا!', { anim: 'cheer' }); ctx.value('curiosity');
          await ctx.say('baba', 'التجربة الأولى: النبتة الصغيرة محتاجة ماية وشمس بالقدر الصح.', T);
          const gr = await ctx.games.grow({ prompt: 'خلّي الماية والشمس في المنطقة الخضرا' });
          ctx.reward.star(1);
          await ctx.say('aboody', 'يا سلام! النبتة كبرت وطلّعت زهرة!', { anim: 'cheer' });
          await ctx.say('baba', 'التجربة التانية: المغناطيس بيشدّ الحديد بس. دوّروا عليه!', T);
          const mg = await ctx.games.magnet({
            prompt: 'اسحب المغناطيس على الحاجات الحديد', items: [
              { id: 'nail', art: 'nail', x: 210, y: 280, iron: true }, { id: 'pencil', art: 'pencil', x: 330, y: 340, msg: 'القلم مش حديد' }, { id: 'clip', art: 'clip', x: 450, y: 285, iron: true },
              { id: 'leaf', art: 'leaf', x: 570, y: 345, msg: 'الورقة مش بتتشدّ' }, { id: 'key', art: 'key', x: 690, y: 285, iron: true }, { id: 'eraser', art: 'eraser', x: 780, y: 345, msg: 'الأستيكة لأ' }]
          });
          await ctx.say('baba', 'برافو! المغناطيس بيشدّ الحديد بس.', T);
          const fl = await ctx.games.dragdrop({
            prompt: 'التجربة التالتة: إيه اللي بيطفو وإيه اللي بيغطس؟', heroes: 'corner', panel: { x: 110, y: 130, w: 740, h: 130 }, wrongHint: 'جرّب في الحوض التاني.. فكّر هو تقيل ولا خفيف؟',
            items: U.shuffle([['duck', 'float'], ['cork', 'float'], ['wood', 'float'], ['leaf', 'float'], ['stone', 'sink'], ['key', 'sink'], ['nail', 'sink']]).map((it, i) => Object.assign({ id: it[0], art: it[0], to: it[1], x: 160 + i * 106, y: 190, s: 62 }, it[0] === 'stone' ? { needs: 'moody', needsMsg: 'الحجر تقيل! محتاجين {m}' } : {})),
            targets: [{ id: 'float', x: 260, y: 345, w: 250, h: 100, label: 'يطفو', cols: 4, dx: 30, itemScale: .45, draw: (g) => { G.fillRR(g, -120, -40, 240, 90, 16, '#9ed8ff', 4); G.fillRR(g, -120, -20, 240, 70, 16, '#4aa8e8', 4); } }, { id: 'sink', x: 700, y: 345, w: 250, h: 100, label: 'يغطس', cols: 4, dx: 30, dy0: 14, itemScale: .45, draw: (g) => { G.fillRR(g, -120, -40, 240, 90, 16, '#9ed8ff', 4); G.fillRR(g, -120, -20, 240, 70, 16, '#4aa8e8', 4); } }]
          });
          if (fl.mistakes <= 2 && mg.got >= 3) ctx.reward.star(1);
          await ctx.say('baba', 'دلوقتي سؤالين علمييين، واحد لكل بطل:', T);
          await ctx.quiz.pair({
            aboody: { id: 'sc_lab_6', category: 'science', tier: 6, q: 'الماية لما بتتجمد في التلاجة بتبقى؟', choices: ['تلج', 'بخار', 'رمل'], answer: 0, hint: 'بارد أوي وبنحطه في العصير', art: 'cup' },
            moody: { id: 'sc_lab_9', category: 'science', tier: 9, q: 'التلج → ماية → بخار. الحالات دي اسمها حالات؟', choices: ['المادة', 'الطاقة', 'الصوت'], answer: 0, hint: 'صلب، سائل، غاز', explain: 'صلب (تلج)، سائل (ماية)، غاز (بخار)' }
          });
          await ctx.say('aboody', 'يا نهار! كباية الزجاج وقعت واتكسرت على الأرض!');
          const sp = await ctx.games.choice({
            prompt: 'كباية اتكسرت في المعمل.. نعمل إيه؟', options: [
              { text: 'أمسك الإزاز وأنضّفه بإيدي', art: 'sad', good: false, consequence: [['baba', 'لأ يا بطل! الإزاز بيجرح. ابعد وأنادي حد كبير.', T], ['moody', 'فهمت.. السلامة أولًا.']] },
              { text: 'أبعد وأنادي الأستاذ فورًا', art: 'baba', good: true, reply: [['baba', 'ممتاز! هنضّفه بالكنّاسة والجاروف.', T], ['aboody', 'ما حدش اتجرح.']] },
              { text: 'أسيبه وأمشي', art: 'x', good: false, consequence: [['narrator', 'تلميذ تاني كان هيدوس على الإزاز...'], ['moody', 'لازم نبلّغ فورًا.']] }]
          });
          if (sp.firstTry) ctx.reward.star(1);
          ctx.sticker.give('s_lab');
          await ctx.say('baba', 'عالمين صغيرين بجد! تسلموا.', T);
          return ctx.nav.complete();
        }
      },
      /* ============ 5) المكتبة وصندوق المفقودات ============ */
      {
        id: 'm5', title: 'المكتبة وصندوق المفقودات', intro: 'المكتبة هادية وفيها عالم من الحكايات.', values: ['quiet', 'honesty', 'study', 'tidy'], sticker: 's_library',
        wisdom: 'الأمانة غنى.. واللي يرجّع الحاجة يكسب القلب', diary: { pic: 'bookstack', text: 'مشينا بهدوء في المكتبة ورجّعنا حاجة ضايعة لصاحبها' },
        async run(ctx) {
          const st = ctx.stage; const L = { name: 'أبلة منى' };
          await ctx.scene('sc_library', { state: { mouseSleep: true }, heroes: { moody: { x: 120, y: 482, dir: 1 }, aboody: { x: 50, y: 492, dir: 1 } } });
          await ctx.say('mama', 'أهلًا بيكم في المكتبة. هنا بنتكلم بالهمس ونمشي على أطراف صوابعنا.', L);
          await ctx.say('moody', 'وحتى الفار الصغير نايم هنا! هنمشي بهدوء عشان ما نصحّيهوش.');
          const tt = await ctx.games.tiptoe({ prompt: 'امشوا على أطراف صوابعكم', steps: 6 });
          ctx.reward.star(1); ctx.value('quiet');
          st.setActive('moody', true);
          await ctx.say('mama', 'عايزة منكم كتابين لمشروع النباتات: واحد فوق على الرف العالي وواحد وقع ورا الدولاب.', L);
          await ctx.scene('sc_library', { state: { mouseSleep: true }, heroes: { moody: { x: 640, y: 482, dir: 1 }, aboody: { x: 330, y: 492, dir: 1 } } });
          await ctx.games.tap({
            prompt: 'دوّروا على كتابين: واحد عالي وواحد ورا الدولاب', hintAfter: 14, spots: [
              { id: 'high', art: 'sbook:#5cc96b:plant', x: 760, y: 128, s: 60, needs: 'moody', needsMsg: 'الرف عالي! محتاجين {m} الطويل', walkOff: 0, listArt: 'sbook:#5cc96b:plant', onFound: () => ctx.say('moody', 'وصلت للكتاب العالي!') },
              { id: 'low', art: 'sbook:#4aa8e8:water', x: 200, y: 418, s: 52, needs: 'aboody', needsMsg: 'الفتحة ضيقة! محتاجين {a} الصغير', walkOff: 0, draw: faint('sbook:#4aa8e8:water', 56), listArt: 'sbook:#4aa8e8:water', onFound: () => ctx.say('aboody', 'لقيته ورا الدولاب!') }]
          });
          ctx.reward.star(1);
          await ctx.say('mama', 'أحسن شباب! دلوقتي ساعدوني أرجّع الكتب في أقسامها.', L);
          const bk = (ic, c, to, i) => ({ id: 'b' + i, art: 'sbook:' + c + ':' + ic, to, s: 66 });
          const books = U.shuffle([bk('cat', '#ff9a4a', 'animals', 1), bk('duck', '#ffc21a', 'animals', 2), bk('plant', '#5cc96b', 'science', 3), bk('magnet', '#8a6bd6', 'science', 4), bk('moon', '#4a8dff', 'stories', 5), bk('chest', '#ff6f91', 'stories', 6), bk('ball', '#1fb5a6', 'sports', 7), bk('trophy', '#ef5350', 'sports', 8)]).map((b, i) => Object.assign(b, { x: 190 + (i % 4) * 190, y: i < 4 ? 190 : 270 }));
          const sec = (id, x, art, label) => ({ id, x, y: 365, w: 170, h: 80, label, cols: 2, dx: 38, itemScale: .5, draw: (g) => { G.fillRR(g, -80, -36, 160, 74, 10, '#b97b4a', 4.5); G.fillRR(g, -72, -28, 144, 60, 6, '#e0b070', 0); A.draw(g, art, 0, -2, 48); } });
          const bs = await ctx.games.dragdrop({
            prompt: 'رجّع كل كتاب في قسمه', heroes: 'corner', panel: { x: 110, y: 120, w: 740, h: 200 }, wrongHint: 'بُص على الرسمة على الكتاب.. ودوّر على القسم المناسب',
            items: books, targets: [sec('animals', 160, 'cat', 'حيوانات'), sec('science', 380, 'plant', 'علوم'), sec('stories', 600, 'moon', 'قصص'), sec('sports', 820, 'ball', 'رياضة')]
          });
          if (bs.mistakes <= 2) ctx.reward.star(1);
          await ctx.say('mama', 'ممتاز! دلوقتي لغز المكتبة: كل واحد فيكم ليه سؤال.', L);
          await ctx.quiz.pair({ cat: ['riddles', 'arabic', 'english', 'geography'] });
          /* lost & found */
          await ctx.scene('sc_library', { state: { mouseSleep: true }, heroes: { moody: { x: 340, y: 482, dir: 1 }, aboody: { x: 450, y: 492, dir: 1 } } });
          let found = false;
          await ctx.games.tap({ prompt: 'في حاجة لامعة تحت الترابيزة.. {a} يشوفها', hintAfter: 10, list: false, spots: [{ id: 'box', art: 'pencilcase', x: 570, y: 420, s: 52, needs: 'aboody', walkOff: 0, draw: faint('pencilcase', 56) }] });
          await ctx.say('aboody', 'يا ساتر! علبة ألوان جديدة ولسه بتلمع! وعليها اسم "أوفا".');
          const ch = await ctx.games.choice({
            prompt: 'لقينا علبة ألوان عليها اسم أوفا.. نعمل إيه؟', options: [
              { text: 'نخبّيها في الشنطة ونرسم بيها', art: 'pencilcase', good: false, consequence: [['ofa', 'ضاعت علبة ألواني اللي بابا جابها لي...'], ['aboody', 'أنا حاسس إني مش مرتاح.. دي مش بتاعتي.']] },
              { text: 'نسيبها مكانها ونمشي', art: 'x', good: false, consequence: [['mama', 'ممكن حد غيرنا ياخدها. الأحسن نتصرف.', L], ['moody', 'عندها حق.']] },
              { text: 'نسلّمها لأبلة منى', art: 'heartbig', good: true, reply: [['mama', 'برافو! ده الصدق والأمانة.', L]] }]
          });
          if (ch.firstTry) ctx.reward.star(1);
          await ctx.say('ofa', 'علبة ألواني! كنت بدوّر عليها من الصبح! مين لقاها؟');
          await ctx.say('mama', '{m} و{a} هما اللي لقوها وسلّموها.', L);
          await ctx.say('ofa', 'شكرًا ليكم! أنتم أصحابي بجد.');
          ctx.value('honesty'); ctx.sticker.give('s_library');
          await ctx.say('aboody', 'أنا فرحان أوي إني رجّعتها!', { anim: 'cheer' });
          return ctx.nav.complete();
        }
      },
      /* ============ 6) اليوم الرياضي ونهاية اليوم ============ */
      {
        id: 'm6', title: 'اليوم الرياضي ونهاية اليوم', intro: 'اليوم الرياضي! ولعب نضيف وفريق واحد.', values: ['fairplay', 'teamwork', 'roadsafety', 'thanks'], sticker: 's_sport',
        wisdom: 'اللعب النضيف أهم من الكسب.. والإشارة بتحمينا', diary: { pic: 'trophy', text: 'لعبنا نضيف وشجعنا الكل وعدّينا الشارع بأمان' },
        async run(ctx) {
          const st = ctx.stage; const C = { name: 'مستر أحمد' };
          await ctx.scene('sc_gym', { state: { finish: true }, heroes: { moody: { x: 220, y: 484, dir: 1 }, aboody: { x: 320, y: 494, dir: 1 } } });
          await ctx.say('baba', 'يلا يا أبطال! النهارده اليوم الرياضي. هنعمل سباق تتابع بروح الفريق.', C);
          await ctx.say('aboody', 'أنا هجري زي الصاروخ!');
          await ctx.say('moody', 'وأنا هساعدك وهنجري سوا.');
          const rn = await ctx.games.runner({ distance: 2100, speed: 275, bg: bgGym, prompt: 'سباق التتابع! اقفزوا فوق الحواجز', obstacles: [{ art: 'cone', h: 46 }, { art: 'baton', h: 34 }, { art: 'ball', h: 40 }] });
          if (rn.hits <= 1) ctx.reward.star(1);
          await ctx.scene('sc_gym', { state: { finish: true }, heroes: { moody: { x: 420, y: 484, dir: 1 }, aboody: { x: 520, y: 494, dir: 1 } } });
          await ctx.say('narrator', 'في الجولة التانية، واحد من الفريق التاني وقع على الأرض ووجعته رجله...');
          const fp = await ctx.games.choice({
            prompt: 'واحد من الفريق التاني وقع.. ونحن بنكسب. نعمل إيه؟', options: [
              { text: 'نكمّل جري ونكسب', art: 'sad', good: false, consequence: [['moody', 'ممكن نكسب.. بس هنكون فرحانين وصاحبنا واقع؟'], ['aboody', 'لأ.. مش حلو.']] },
              { text: 'نضحك عليه', art: 'x', good: false, consequence: [['baba', 'الضحك على حد وقع مش من الأخلاق يا شباب.', C], ['aboody', 'آسف.. هنساعده.']] },
              { text: 'نقف نساعده ونكمّل بعدها', art: 'heartbig', good: true, reply: [['friend', 'شكرًا ليكم! أنتم أبطال بجد.', { name: 'اللاعب' }], ['baba', 'ده معنى الروح الرياضية!', C]] }]
          });
          if (fp.firstTry) ctx.reward.star(1);
          ctx.value('fairplay');
          await ctx.say('baba', 'دلوقتي دور فريق أصحابنا في السباق. شجّعوهم بالطبل والبومبوم!', C);
          await ctx.games.cheer({ prompt: 'شجّع الفريق: دوس لما الدايرة توصل للبومبوم', beats: 8 });
          ctx.value('teamwork');
          await ctx.say('baba', 'ما شاء الله! جولة أسئلة رياضية للفريق:', C);
          const sq = await ctx.quiz.pair({ cat: ['math', 'health', 'logic', 'general'] });
          if (sq.firstTry >= 1) ctx.reward.star(1);
          ctx.sfx('fanfare'); ctx.fx.confetti();
          await ctx.say('baba', 'الميدالية الذهبية لأبطال الروح الرياضية: {m} و{a}!', C);
          ctx.sticker.give('s_sport');
          /* end of day: road */
          await ctx.scene('sc_road', { heroes: { moody: { x: 450, y: 488, dir: 1 }, aboody: { x: 540, y: 496, dir: 1 } } });
          await ctx.say('narrator', 'خلّص اليوم الدراسي. بابا مستنيهم على الرصيف التاني.');
          await ctx.say('baba', 'أنا هنا يا أبطال! استنوا الإشارة وعدّوا بحرص.', { name: 'بابا' });
          await ctx.say('moody', 'نمسك إيد {a} ونستنى الإشارة الخضرا.');
          const cr = await ctx.games.crossing({ prompt: 'استنى الإشارة الخضرا، بُص شمال ويمين، وبعدين اعدّي' });
          ctx.value('roadsafety'); ctx.skill('health');
          await ctx.say('baba', 'برافو! عدّيتوا صح. مين جاهز للبيت؟', { name: 'بابا' });
          await ctx.games.ritual({ text: 'الحمد لله', sub: 'على يوم جميل', who: 'aboody' });
          ctx.value('thanks'); ctx.reward.star(1);
          await ctx.say('narrator', 'عدّى يوم المدرسة.. وأبطال المدرسة اتعلّموا كتير.');
          return ctx.nav.complete();
        }
      }
    ]
  });
})();
