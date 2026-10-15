/* Moody & Aboody - worlds/sea.js : WORLD 6 "رحلة البحر" (6 missions, the grand finale).
   Needs (loaded before): content/q_sea.js, worlds/park_kits.js, worlds/sea_art.js. Adds the kit  ctx.games.seaCertificate  (شهادة مغامر). */
(function () {
  'use strict';
  const M = window.Moody, G = M.gfx, A = M.art, U = M.util, UI = M.ui, h = UI.h, ico = UI.ico, PK = M.pk, K = M.kits;
  const pulse = r => (g, t, st, s) => { if (s && s.found) return; g.save(); g.globalAlpha = .28 + .22 * Math.sin(t * 4); G.circ(g, 0, 0, r, '#fff3a0', 0); g.globalAlpha = .9; g.strokeStyle = '#ffd23c'; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.arc(0, 0, r + Math.sin(t * 4) * 3, t, t + 6.3); g.stroke(); g.setLineDash([]); g.restore(); };
  const sh = U.shuffle, T = t => 'pk_tile:' + t;
  const CS = M.castle = { cx: 560 }; // castle geometry is shared with the saSea background

  M.registerValue('planning', { label: 'التجهيز والتخطيط', desc: 'نجهّز شنطة الرحلة قبل ما نسافر' });
  M.registerValue('carmanners', { label: 'آداب السفر بالعربية', desc: 'الحزام والهدوء وعدم الخناق' });
  M.registerValue('beachsafety', { label: 'الأمان على الشاطئ', desc: 'سترة النجاة وقرب الأهل وألوان الأعلام' });
  M.registerValue('respectnature', { label: 'احترام الكائنات البحرية', desc: 'نتفرج على الحيوانات ونسيبها في بيتها' });
  M.registerValue('environment', { label: 'نضافة الشاطئ والبيئة', desc: 'نجمع البلاستيك ونرميه في مكانه' });
  M.registerValue('peace', { label: 'حل الخلاف بهدوء', desc: 'نتبادل ونتفاهم بدل الخناق' });

  /* ================= certificate kit ================= */
  K.seaCertificate = function (ctx, o, done, cl) {
    const sd = M.save.data, nm = sd.names; let stars = 0, total = 0, miss = 0, tm = 0;
    M.worlds.forEach(w => { if (w.soon) return; total += w.missions.length * 3; stars += M.save.mapStars(w); miss += M.save.done(w); tm += w.missions.length; });
    const prev = (M.save.prog('sea', 'm6') || {}).stars || 0; stars += Math.max(0, (o.stars || 0) - prev); if (!(M.save.prog('sea', 'm6') || {}).done) miss += 1;
    const date = new Date().toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });
    const av = id => h('div', { style: 'text-align:center' }, h('img', { class: 'av', src: M.chars.avatar(id) + '?v=1', style: 'width:96px;height:96px;border-width:5px', alt: '' }), h('div', { style: 'font-size:32px;font-weight:900;color:#8a2a00;margin-top:8px' }, nm[id]));
    const stat = (icon, txt) => h('div', { class: 'chip', style: 'font-size:22px;min-height:44px;padding:2px 12px;border-color:#b98a2a;gap:6px' }, ico(icon, 28), txt);
    const sticks = Object.keys(sd.stickers).length + 1;
    const el = h('div', { id: 'cert', style: 'position:absolute;inset:0;z-index:30;pointer-events:auto;background:linear-gradient(#ffe6b0,#ffd0a0);animation:fadein .4s' },
      h('div', { style: 'position:absolute;inset:10px;border:6px double #b98a2a;border-radius:18px;background:#fffaf0;box-shadow:inset 0 0 0 4px #ffe3a0' }),
      h('div', { style: 'position:absolute;left:34px;right:34px;top:18px;text-align:center' },
        h('div', { class: 'title', style: 'font-size:58px;color:#ffb52e' }, 'شهادة مغامر'),
        h('div', { style: 'font-size:22px;font-weight:bold;color:#7a5a30;margin-top:4px' }, 'تُمنح هذه الشهادة بكل فخر للبطلين')),
      h('div', { class: 'row', style: 'position:absolute;left:120px;right:120px;top:128px;gap:60px;align-items:flex-start' }, av('moody'), h('div', { style: 'margin-top:20px' }, ico('heartbig', 58)), av('aboody')),
      h('div', { style: 'position:absolute;left:70px;right:70px;top:290px;text-align:center;font-size:24px;font-weight:bold;line-height:1.45;color:#3a2a1e' }, 'لأنهم أتمّوا مغامرة كاملة من البيت لحد غروب الشمس على البحر، وساعدوا بعض، وحلّوا الألغاز، واتعلموا نتعاون ونحافظ على الطبيعة.'),
      h('div', { class: 'row', style: 'position:absolute;left:60px;right:60px;top:366px;gap:10px;flex-wrap:nowrap' }, stat('star', 'النجوم: ' + U.ar(stars) + ' من ' + U.ar(total)), stat('album', 'الملصقات: ' + U.ar(sticks)), stat('check', 'المهام: ' + U.ar(Math.min(miss, tm)) + ' من ' + U.ar(tm))),
      h('div', { style: 'position:absolute;left:250px;right:190px;bottom:30px;display:flex;justify-content:center;align-items:flex-end;gap:30px;font-size:20px;font-weight:bold;color:#7a5a30' }, ...['ماما', 'بابا'].map(n => h('div', { style: 'text-align:center' }, h('div', { style: 'width:120px;border-bottom:3px solid #7a5a30;height:24px' }), n)), h('div', { style: 'margin-bottom:2px' }, date)),
      h('div', { style: 'position:absolute;right:46px;bottom:24px', id: 'rosette' }, ico('sa_rosette', 100)),
      h('div', { class: 'noprint', style: 'position:absolute;left:30px;top:24px;display:flex;flex-direction:column;gap:8px' }, h('button', { class: 'btn green sm go', onclick: () => { M.audio.sfx('tap'); done({ stars, total }); } }, 'كمّل', ico('play', 30)), UI.btn('اطبع الشهادة', 'blue sm', () => { try { window.print(); } catch (e) { } })));
    UI.over.append(el); ctx.stage.dbg = { kit: 'seacert' }; M.audio.sfx('fanfare');
    cl(() => { el.remove(); ctx.stage.dbg = null; });
  };

  M.registerWorld({
    id: 'sea', order: 6, title: 'رحلة البحر', icon: 'w_sea', theme: { c1: '#a8f0f0', c2: '#1fb5a6' }, finalSticker: 's_sea',
    stickers: [
      { id: 's_pack', title: 'شنطة جاهزة', art: 'sa_bag', bg: '#ffe0ea' }, { id: 's_road', title: 'رحلة آمنة', art: 'car', bg: '#d9f0ff', rot: .08 },
      { id: 's_safe', title: 'أمان الشاطئ', art: 'sa_lifejacket', bg: '#ffe9c8' }, { id: 's_shells', title: 'صائد الأصداف', art: 'sa_shell', bg: '#fff0e0', rot: -.1 },
      { id: 's_castle', title: 'مهندس القلاع', art: 'sa_tower', bg: '#fff3c4' }, { id: 's_sunset', title: 'شهادة مغامر', art: 'sa_sunart', bg: '#ffd9b0', rot: .06 },
      { id: 's_sea', title: 'أبطال البحر', art: 'w_sea', bg: '#d9f6f2', rot: -.05 }
    ],
    missions: [
      /* ============ 1) شنطة الرحلة ============ */
      {
        id: 'm1', title: 'شنطة الرحلة', intro: 'النهاردة رحلة البحر! لازم نجهّز الشنطة الأول.', values: ['planning', 'thanks', 'sunsafe', 'teamwork'], sticker: 's_pack',
        wisdom: 'اللي يجهّز كويس.. رحلته بتبقى أحلى', diary: { pic: 'sa_bag', text: 'جهّزنا شنطة رحلة البحر وشكرنا ماما وبابا' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('saHome', { state: { bagOpen: true }, heroes: { moody: { x: 400, y: 484, dir: 1 }, aboody: { x: 500, y: 494, dir: -1 } } });
          await ctx.say('mama', 'صباح الخير يا حبايبي! النهاردة رحلة البحر! بابا بيجهّز العربية وإحنا نجهّز الشنطة.', { name: 'ماما' });
          await ctx.say('aboody', 'هييه! بس فين قبعتي وشبشبي؟ مش لاقيهم!');
          await ctx.say('moody', 'القبعة على الشماعة العالية، والشبشب أكيد اتزحلق تحت الكنبة. يلا نتقسّم!');
          const f = await ctx.games.hidden({
            prompt: '{m} يجيب القبعة العالية و{a} يجيب الشبشب من تحت الكنبة', hintAfter: 12, spots: [
              { id: 'hat', art: 'pk_hat', x: 620, y: 120, s: 70, hit: 52, needs: 'moody', walkOff: 0, listArt: 'pk_hat', needsMsg: 'القبعة عالية! محتاجين {m} الطويل', onFound: () => { st.state.hatGone = true; } },
              { id: 'flip', art: 'sa_flip', x: 200, y: 448, s: 56, hit: 52, needs: 'aboody', walkOff: 0, listArt: 'sa_flip', needsMsg: 'تحت الكنبة ضيّق! محتاجين {a} الصغير' }]
          });
          ctx.reward.star(1);
          await ctx.say('baba', 'يلا يا أبطال، فاضل الباقي. حطّوا في الشنطة اللي هنحتاجه في البحر بس.', { name: 'بابا' });
          st.state.bagOpen = false;
          const stuff = [['towel', 'bag'], ['pk_sunscreen', 'bag'], ['pk_wbottle', 'bag'], ['sa_sandwich', 'bag'], ['sa_swim', 'bag'], ['sa_ball', 'bag'], ['sa_cooler', 'bag', 'moody'], ['tablet', 'home'], ['sa_boot', 'home'], ['pk_coat', 'home']];
          const pk = await ctx.games.dragdrop({
            prompt: 'حطّوا في الشنطة اللي هنحتاجه في البحر', heroes: 'corner', panel: { x: 130, y: 128, w: 700, h: 200 }, wrongHint: 'ده مش هنحتاجه في الصيف عند البحر',
            items: sh(stuff).map((it, i) => ({ id: it[0], art: it[0], to: it[1], needs: it[2], needsMsg: 'ثلاجة التلج تقيلة! محتاجين {m}', x: 215 + (i % 5) * 132, y: 185 + Math.floor(i / 5) * 72, s: 66 })),
            targets: [{ id: 'bag', x: 320, y: 390, w: 170, h: 100, art: 'sa_bag', s: 140, label: 'شنطة البحر', cols: 5, dx: 18, itemScale: .4 }, { id: 'home', x: 650, y: 395, w: 140, h: 90, art: 'box', s: 110, label: 'نسيبه في البيت', cols: 3, dx: 24, itemScale: .4 }]
          });
          if (pk.mistakes <= 2) ctx.reward.star(1);
          ctx.value('planning'); ctx.value('sunsafe');
          st.state.bagOpen = true; ctx.heroes('floor');
          await ctx.say('baba', 'قبعة وكريم وماية وأكل.. الشنطة جاهزة! سؤال بسيط قبل ما نطلع.', { name: 'بابا' });
          const q = await PK.pair(ctx, { cat: ['counting', 'math'], tag: 'sea' });
          if (q.firstTry >= 1) ctx.reward.star(1);
          await ctx.say('mama', 'الله يبارك فيكم! بس قبل ما نسافر.. تحبوا تشكروا مين؟', { name: 'ماما' });
          const th = await ctx.games.choice({
            prompt: 'نشكر مين على الرحلة؟', options: [
              { text: 'ماما على التجهيز والحب', art: 'mama', good: true, reply: [['moody', 'شكرًا يا ماما على كل حاجة.']] },
              { text: 'بابا على السواقة والتعب', art: 'baba', good: true, reply: [['aboody', 'شكرًا يا بابا.']] },
              { text: 'ربنا على النعم', art: 'sparkles', good: true, reply: [['moody', 'الحمد لله.']] }]
          });
          await ctx.games.ritual({ text: 'شكرًا!', sub: 'يا ماما ويا بابا', who: 'moody' });
          ctx.value('thanks'); ctx.fx.burst(480, 300, { kind: 'heart', n: 14 });
          await ctx.say('baba', 'العفو يا حبايبي. يلا بسم الله!', { name: 'بابا' });
          return ctx.nav.complete();
        }
      },
      /* ============ 2) الطريق للبحر ============ */
      {
        id: 'm2', title: 'الطريق للبحر', intro: 'العربية جاهزة.. والطريق للبحر فيه ألغاز!', values: ['carmanners', 'peace', 'patience'], sticker: 's_road',
        wisdom: 'الحزام الأول.. والهدوء في العربية أمان للكل', diary: { pic: 'car', text: 'ركبنا العربية وربطنا الحزام ولعبنا ألغاز في الطريق' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('saCar', { state: { still: false, near: 0 }, heroes: { moody: { x: 310, y: 505, dir: 1 }, aboody: { x: 430, y: 515, dir: 1 } } });
          await ctx.say('baba', 'يلا يا شباب اركبوا! رتّبوا الأول إزاي نركب العربية.', { name: 'بابا' });
          const sq = await ctx.games.sequence({ prompt: 'رتّب خطوات ركوب العربية', steps: [{ art: 'car', label: 'اركب العربية' }, { art: 'sa_door', label: 'اقفل الباب كويس' }, { art: 'sa_belt', label: 'اربط الحزام' }, { art: 'sparkles', label: 'قول دعاء السفر' }] });
          if (sq.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes({ moody: { x: 310, y: 505, dir: 1 }, aboody: { x: 430, y: 515, dir: 1 } });
          await ctx.say('mama', 'كل واحد يربط حزامه.. وأنا هتأكد.', { name: 'ماما' });
          const strap = (sx, sy) => (g, t, s0, s) => { if (!s.found) { pulse(34)(g, t, s0, s); return; } g.lineCap = 'round'; G.line(g, sx, sy, 0, 0, 14); G.line(g, sx, sy, 0, 0, 8, '#4a4a55'); G.fillRR(g, -12, -9, 24, 18, 4, '#ef5350', 3.5); };
          const bl = await ctx.games.hidden({
            prompt: 'اربطوا الحزام: دوس على إبزيم كل واحد', list: false, noWalk: true, hintAfter: 10, spots: [
              { id: 'b1', x: 322, y: 444, s: 60, hit: 56, keep: true, noBadge: true, draw: strap(-34, -44), onFound: () => { ctx.sfx('click'); } },
              { id: 'b2', x: 440, y: 480, s: 60, hit: 50, keep: true, noBadge: true, draw: strap(-26, -30), onFound: () => { ctx.sfx('click'); } }]
          });
          st.state.belts = true; ctx.value('carmanners');
          await ctx.say('baba', 'بسم الله.. اللهم إنّا نسألك في سفرنا هذا البر والتقوى. يلا بينا!', { name: 'بابا' });
          await ctx.say('aboody', 'الصحرا والشمس وبرك صفرا.. الطريق حلو أوي!');
          st.state.still = true;
          await ctx.say('baba', 'وقفنا عند الإشارة. نلعب "أنا شايف"؟ دوّروا على الحاجات دي في الشباك!', { name: 'بابا' });
          const sp = await ctx.games.hidden({
            prompt: 'أنا شايف: نخلة، أوتوبيس، لافتة جمل، ولافتة البحر', hintAfter: 12, noWalk: true, spots: [
              { id: 'palm', art: 'sa_palm', x: 150, y: 232, s: 90, hit: 52, listArt: 'sa_palm' }, { id: 'bus', art: 'sa_bus', x: 320, y: 252, s: 80, hit: 52, listArt: 'sa_bus' },
              { id: 'camel', art: 'sa_camel', x: 620, y: 240, s: 80, hit: 52, listArt: 'sa_camel' }, { id: 'sign', art: 'sa_seasign', x: 790, y: 236, s: 86, hit: 52, listArt: 'sa_seasign' }]
          });
          if (sp.wrong <= 2) ctx.reward.star(1);
          await ctx.say('mama', 'شوفوا لوحة العربية اللي قدامنا.. أرقامها لغز!', { name: 'ماما' });
          const pl = await ctx.quiz.pair({
            aboody: { id: 'sam2_6', category: 'patterns', tier: 6, q: 'لوحة العربية اللي قدامنا: ١، ٢، ٣، ؟', choices: ['٤', '٥', '٣'], answer: 0, hint: 'كل رقم بيزيد واحد', row: [T('١'), T('٢'), T('٣'), '?'] },
            moody: { id: 'sam2_9', category: 'patterns', tier: 9, q: 'ولوحة العربية اللي جنبها: ٣، ٦، ٩، ١٢، ؟', choices: ['١٥', '١٤', '١٨'], answer: 0, hint: 'بنزوّد ٣', row: [T('٣'), T('٦'), T('٩'), T('١٢'), '?'] }
          });
          const pq = await PK.pair(ctx, { cat: ['patterns', 'math'], tag: 'sea' });
          if (pl.firstTry + pq.firstTry >= 3) ctx.reward.star(1);
          st.state.still = false;
          await ctx.say('narrator', 'العربية بتمشي.. وفجأة في الكنبة اللي ورا:');
          await ctx.say('aboody', 'أنا عايز أقعد جنب الشباك!');
          await ctx.say('moody', 'لأ أنا اللي عايز الشباك!');
          const c = await ctx.games.choice({
            prompt: 'الاتنين عايزين الشباك. نعمل إيه؟', options: sh([
              { text: 'نزعق ونتخانق', art: 'sad', good: false, consequence: [['baba', 'يا ولاد! السواق محتاج هدوء عشان يركّز.. الزعيق في العربية خطر.', { name: 'بابا' }]] },
              { text: 'نزق بعض بإيدينا', art: 'x', good: false, consequence: [['mama', 'الإيد مش للضرب يا حبايبي.. نتكلم بهدوء ونحل المشكلة.', { name: 'ماما' }]] },
              { text: 'نتبادل: كل واحد نص الطريق', art: 'smile', good: true, reply: [['mama', 'برافو! حل ذكي ومحترم.', { name: 'ماما' }], ['moody', 'اتفقنا.. أنت الأول يا {a}.']] },
              { text: 'نلعب لعبة الألوان سوا', art: 'sa_ball', good: true, reply: [['baba', 'ما شاء الله، لعبة حلوة تفرّح الكل.', { name: 'بابا' }]] }])
          });
          if (c.firstTry) ctx.reward.star(1); ctx.value('peace');
          M.tw(st.state, { near: 1 }, 5, 'inOut');
          await ctx.say('aboody', 'بُص يا {m}! في خط أزرق بعيد!');
          await ctx.say('moody', 'ده البحر! ريحة الملح بدأت توصل.', { anim: 'cheer' });
          await ctx.say('baba', 'وصلنا بالسلامة، الحمد لله!', { name: 'بابا' });
          return ctx.nav.complete();
        }
      },
      /* ============ 3) أمان على الشاطئ ============ */
      {
        id: 'm3', title: 'أمان على الشاطئ', intro: 'البحر حلو.. بس الأمان أولًا!', values: ['beachsafety', 'sunsafe', 'teamwork'], sticker: 's_safe',
        wisdom: 'البحر حلو.. بس الأمان أهم', diary: { pic: 'sa_lifejacket', text: 'لبسنا سترة النجاة وفضلنا قريبين من ماما وبابا' },
        async run(ctx) {
          const st = ctx.stage, nm = ctx.names;
          await ctx.scene('saSea', { state: { kind: 'beach', sun: .2, umbrella: { x: 700, y: 360 }, flagPole: { x: 860, y: 392, c: 'yellow' } }, heroes: { moody: { x: 340, y: 484, dir: 1 }, aboody: { x: 440, y: 494, dir: 1 } } });
          await ctx.say('aboody', 'الله! البحر! أنا هنزل أجري في الماية!');
          await ctx.say('mama', 'استنى يا {a}. قبل ما ننزل في قواعد بسيطة بنعملها سوا.', { name: 'ماما' });
          await ctx.say('narrator', 'في الماية كورة بتتحرك بعيد..');
          const c1 = await ctx.games.choice({
            prompt: '{a} شاف الكورة بتبعد في الماية. يعمل إيه؟', options: sh([
              { text: 'يجري وراها لوحده', art: 'sa_ball', good: false, consequence: [['baba', 'لأ يا {a}! الماية بتعمّق بسرعة. لازم حد كبير يكون معانا.', { name: 'بابا' }]] },
              { text: 'ينزل المية العميقة عشان يلحقها', art: 'sa_dolphin', good: false, consequence: [['moody', 'ده خطر! الكورة ممكن نجيب غيرها.. لكن نفسنا أغلى.']] },
              { text: 'يقول لبابا وبابا يجيبها', art: 'baba', good: true, reply: [['baba', 'شاطر يا {a}! أنا هجيبها.', { name: 'بابا' }]] }])
          });
          if (c1.firstTry) ctx.reward.star(1); ctx.value('beachsafety');
          await ctx.say('mama', 'وقبل الماية.. سترة النجاة لكل واحد فيكم.', { name: 'ماما' });
          const lj = await ctx.games.dragdrop({
            prompt: 'ألبسوا كل واحد سترة النجاة', heroes: 'corner', wrongHint: 'حطّها على الولد',
            items: [{ id: 'j1', art: 'sa_lifejacket', to: 'kid', x: 400, y: 215, s: 90 }, { id: 'j2', art: 'sa_lifejacket', to: 'kid', x: 560, y: 215, s: 90 }],
            targets: [380, 580].map((x, i) => ({ id: 'k' + i, x, y: 360, w: 140, h: 150, art: i ? 'pk_kid:navy:d' : 'pk_kid:gray', s: 150, label: i ? nm.aboody : nm.moody, itemScale: .7, cols: 1, dy0: -30, accepts: function () { return this.n < 1; } }))
          });
          st.state.vest = true; ctx.heroes('floor');
          await ctx.say('baba', 'برافو! وفي الشاطئ أعلام ملوّنة بتقولنا نعمل إيه. وصّلوا كل علم بمعناه.', { name: 'بابا' });
          const fl = await ctx.games.pkPairs({
            prompt: 'وصّل كل علم بمعناه', left: [{ k: 'g', art: 'sa_flag:green', label: 'علم أخضر' }, { k: 'y', art: 'sa_flag:yellow', label: 'علم أصفر' }, { k: 'r', art: 'sa_flag:red', label: 'علم أحمر' }],
            right: [{ k: 'g', label: 'نسبح بأمان مع الكبار' }, { k: 'y', label: 'نحذر ونقرّب من بابا' }, { k: 'r', label: 'ما ننزلش المية خالص' }]
          });
          ctx.heroes('floor');
          if (fl.mistakes <= 1 && lj.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('narrator', 'سؤال أمان لكل واحد فيكم!');
          const q = await PK.pair(ctx, { cat: ['health', 'ethics'], tag: 'sea' });
          if (q.firstTry >= 1) ctx.reward.star(1);
          const small = M.tierFor(ctx.active) === 6;
          const DO = [['نلبس سترة|النجاة', 'sa_lifejacket'], ['نقعد قريب من|ماما وبابا', 'mama'], ['نسمع كلام|المنقذ', 'pk_whistle']], DONT = [['ننزل البحر|لوحدنا', 'sa_swim'], ['نجري ورا الكورة|في العمق', 'sa_ball'], ['نلعب في الموج|من غير كبير', 'sa_boat']];
          const cards = sh((small ? DO.slice(0, 2).concat(DONT.slice(0, 2)) : DO.concat(DONT)).map(c => ({ l: c[0], a: c[1], to: DO.indexOf(c) >= 0 ? 'do' : 'dont' })));
          const sd = await ctx.games.dragdrop({
            prompt: 'اعمل ولا ما تعملش؟ صنّفوا البطاقات', heroes: 'corner', panel: { x: 90, y: 128, w: 780, h: 150 }, wrongHint: 'فكّر تاني.. ده بيحمينا ولا بيعرّضنا للخطر؟',
            items: cards.map((c, i) => ({ id: 'c' + i, to: c.to, x: 480 + (i - (cards.length - 1) / 2) * (small ? 170 : 135), y: 205, s: 112, draw: PK.card(c.a, c.l, { w: 126, h: 118, v: true, size: 19 }) })),
            targets: [{ id: 'do', x: 300, y: 390, w: 230, h: 100, label: 'اعمل', draw: g => { G.fillRR(g, -115, -50, 230, 100, 22, 'rgba(92,201,107,.5)', 4); A.draw(g, 'check', 0, 0, 56); } }, { id: 'dont', x: 660, y: 390, w: 230, h: 100, label: 'ما تعملش', draw: g => { G.fillRR(g, -115, -50, 230, 100, 22, 'rgba(239,83,80,.45)', 4); A.draw(g, 'x', 0, 0, 56); } }]
          });
          if (sd.mistakes <= 2) ctx.reward.star(1);
          ctx.heroes('floor');
          await ctx.say('friend', 'أنا المنقذ. لو احتجتوا أي مساعدة نادوني، وخليكم دايمًا قدام عيني.', { name: 'المنقذ' });
          await ctx.say('aboody', 'حاضر يا عمو! وأنا هفضل جنب ماما وبابا.');
          return ctx.nav.complete();
        }
      },
      /* ============ 4) كنوز البحر ============ */
      {
        id: 'm4', title: 'كنوز البحر', intro: 'الشاطئ مليان كنوز.. أصداف ومخلوقات عجيبة!', values: ['respectnature', 'teamwork', 'kindness'], sticker: 's_shells',
        wisdom: 'الكنز الحقيقي نتفرج عليه ونسيبه في بيته', diary: { pic: 'sa_shell', text: 'جمعنا أصداف فاضية وسبنا الحيوانات في بيتها' },
        async run(ctx) {
          const st = ctx.stage;
          await ctx.scene('saSea', { state: { kind: 'shore', sun: .3 }, heroes: { moody: { x: 440, y: 484, dir: 1 }, aboody: { x: 540, y: 494, dir: -1 } } });
          await ctx.say('aboody', 'بُص يا {m}! الشاطئ مليان كنوز!');
          await ctx.say('moody', 'يلا ندوّر سوا. في حاجات في شقوق ضيّقة وفي حاجات على صخور عالية.');
          const items = [['sa_shell', 420, 462, null], ['sa_spiral', 560, 478, null], ['sa_star', 700, 462, null], ['sa_crab', 800, 446, null], ['sa_shell', 236, 424, 'aboody'], ['sa_spiral', 872, 336, 'moody']];
          const hd = await ctx.games.hidden({
            prompt: 'دوّروا على ٦ كنوز: {a} للشقوق الضيّقة و{m} للصخور العالية', hintAfter: 14, spots: items.map((it, i) => ({ id: 'i' + i, art: it[0], x: it[1], y: it[2], s: 56, hit: 46, needs: it[3] || undefined, walkOff: it[3] === 'aboody' ? 40 : undefined, listArt: it[0], needsMsg: it[3] === 'aboody' ? 'الشق ضيّق! محتاجين {a} الصغير' : 'الصخرة عالية! محتاجين {m} الطويل' }))
          });
          if (hd.wrong <= 3) ctx.reward.star(1);
          await ctx.say('aboody', 'يا سلام! السلطعون ده حلو أوي.. هاخده في الجردل ونروّح!');
          const c = await ctx.games.choice({
            prompt: '{a} عايز ياخد السلطعون في الجردل. نعمل إيه؟', options: sh([
              { text: 'ناخده في الجردل ونروّح', art: 'sa_bucket', good: false, consequence: [['moody', 'السلطعون حيّ وبيته هنا.. لو خدناه هيتعب ويموت بعيد عن البحر.']] },
              { text: 'نخضّه بعصاية', art: 'sa_spade', good: false, consequence: [['mama', 'لأ يا حبيبي، ده بيتخض. نتفرج بهدوء.', { name: 'ماما' }]] },
              { text: 'نتفرج عليه ونسيبه في بيته', art: 'sa_crab', good: true, reply: [['aboody', 'كده هو فرحان وإحنا فرحانين!']] }])
          });
          if (c.firstTry) ctx.reward.star(1); ctx.value('respectnature');
          await ctx.say('moody', 'طيب نصنّف اللي لقيناه: الأصداف الفاضية ناخدها تذكار، والمخلوقات الحية نسيبها.');
          const so = await ctx.games.dragdrop({
            prompt: 'الأصداف الفاضية معانا.. والمخلوقات الحية نسيبها في البحر', heroes: 'corner', panel: { x: 150, y: 128, w: 660, h: 150 }, wrongHint: 'ده حيّ ولا فاضي؟ فكّر تاني',
            items: sh(items.map(i => i[0])).map((a, i) => ({ id: 'z' + i, art: a, to: (a === 'sa_star' || a === 'sa_crab') ? 'leave' : 'take', x: 235 + i * 98, y: 200, s: 64 })),
            targets: [{ id: 'take', x: 300, y: 390, w: 200, h: 100, art: 'sa_bucket', s: 120, label: 'تذكار معانا', cols: 4, dx: 26, itemScale: .45 }, { id: 'leave', x: 660, y: 390, w: 200, h: 100, art: 'sa_rock', s: 120, label: 'نسيبها في بيتها', cols: 3, dx: 36, itemScale: .5 }]
          });
          if (so.mistakes <= 1) ctx.reward.star(1);
          ctx.heroes('floor');
          await ctx.say('moody', 'برافو! دلوقتي لعبة ذاكرة عن كنوز البحر.');
          const small = M.tierFor(ctx.active) === 6;
          await ctx.games.memory({ prompt: 'لاقي كل صورتين متشابهتين', pairs: small ? ['sa_shell', 'sa_star', 'sa_fish'] : ['sa_shell', 'sa_star', 'sa_fish', 'sa_crab', 'sa_jelly', 'sa_octopus'], timeLimit: small ? 0 : 90 });
          ctx.heroes('floor');
          const pr = await ctx.games.pkPairs({
            prompt: 'وصّل كل مخلوق بمعلومته', left: [{ k: 's', art: 'sa_star', label: 'نجمة البحر' }, { k: 'o', art: 'sa_octopus', label: 'الأخطبوط' }, { k: 'c', art: 'sa_crab', label: 'السلطعون' }].concat(small ? [] : [{ k: 'd', art: 'sa_dolphin', label: 'الدلفين' }]),
            right: [{ k: 's', label: '٥ أذرع' }, { k: 'o', label: '٨ أذرع' }, { k: 'c', label: 'بيمشي على جنب' }].concat(small ? [] : [{ k: 'd', label: 'ذكي ويقفز فوق الموج' }])
          });
          ctx.heroes('floor');
          if (pr.mistakes <= 1) ctx.reward.star(1);
          await PK.pair(ctx, { cat: ['science', 'animals', 'counting'], tag: 'sea' });
          await ctx.say('mama', 'ما شاء الله عليكم! جمعتوا ذكريات من غير ما تأذوا حد.', { name: 'ماما' });
          return ctx.nav.complete();
        }
      },
      /* ============ 5) قلعة الرمل ونضافة الشاطئ ============ */
      {
        id: 'm5', title: 'قلعة الرمل ونضافة الشاطئ', intro: 'نبني قلعة سوا.. وبعدين نسيب الشاطئ أنضف!', values: ['teamwork', 'environment', 'clean'], sticker: 's_castle',
        wisdom: 'الشاطئ هدية.. نسيبه أنضف مما لقيناه', diary: { pic: 'sa_tower', text: 'بنينا قلعة رمل سوا ونضّفنا الشاطئ من البلاستيك' },
        async run(ctx) {
          const st = ctx.stage, cx = CS.cx;
          await ctx.scene('saSea', { state: { kind: 'sand', sun: .4, castle: {} }, heroes: { moody: { x: 400, y: 484, dir: 1 }, aboody: { x: 300, y: 494, dir: 1 } } });
          await ctx.say('moody', 'نبني قلعة رمل؟ أنا هشيل الجرادل التقيلة والأبراج الكبيرة.');
          await ctx.say('aboody', 'وأنا هعمل التفاصيل الصغيرة: الباب والشبابيك والعلم!');
          st.setActive('moody', true);
          const slot = (art, size, ex) => g => { g.save(); g.globalAlpha = .4; A.draw(g, art, 0, 0, size); g.restore(); g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 3; g.setLineDash([8, 7]); G.rr(g, -size * .38, -size * .36, size * .76, size * .72, 10); g.stroke(); g.setLineDash([]); };
          const one = function (to) { return function (it) { return it.to === to && this.n < 1; }; };
          const onlyBase = (id, x, y, art, size, to) => ({ id, x, y, w: size * .6, h: size * .55, draw: slot(art, size), accepts: one(to) });
          const bucketDraw = (g, it) => { if (it.placed) A.draw(g, 'sa_wall', 0, 0, 100); else A.draw(g, 'sa_bucket', 0, 0, 72); };
          const bld = (art, size) => (g, it) => A.draw(g, art, 0, 0, size);
          const partA = [
            { id: 'bk1', to: 'wall', x: 200, y: 200, s: 78, draw: bucketDraw, needs: 'moody' }, { id: 'bk2', to: 'wall', x: 305, y: 200, s: 78, draw: bucketDraw, needs: 'moody' }, { id: 'bk3', to: 'wall', x: 410, y: 200, s: 78, draw: bucketDraw, needs: 'moody' },
            { id: 'tw1', to: 'tower', x: 540, y: 200, s: 100, draw: bld('sa_tower', 110), needs: 'moody' }, { id: 'tw2', to: 'tower', x: 670, y: 200, s: 100, draw: bld('sa_tower', 110), needs: 'moody' }, { id: 'keep', to: 'keep', x: 805, y: 200, s: 110, draw: bld('sa_tower', 130), needs: 'moody' }];
          const bs = await ctx.games.dragdrop({
            prompt: '{m} يبني الأساس: ٣ جرادل للسور وبرجين والبرج الكبير', heroes: 'corner', panel: { x: 120, y: 128, w: 760, h: 150 }, wrongHint: 'حطّه في المكان المرسوم بالنقط', items: partA,
            targets: [onlyBase('w1', cx - 100, 420, 'sa_wall', 100, 'wall'), onlyBase('w2', cx, 420, 'sa_wall', 100, 'wall'), onlyBase('w3', cx + 100, 420, 'sa_wall', 100, 'wall'), onlyBase('t1', cx - 180, 384, 'sa_tower', 110, 'tower'), onlyBase('t2', cx + 180, 384, 'sa_tower', 110, 'tower'), onlyBase('k', cx, 330, 'sa_tower', 130, 'keep')].map(t => Object.assign(t, { itemScale: 1, cols: 1, dy0: 0 }))
          });
          st.state.castle = { base: true };
          await ctx.say('aboody', 'دلوقتي دوري! عايز أحط الباب والشبابيك والعلم.');
          st.setActive('aboody', true);
          const partB = [{ id: 'dr', to: 'door', x: 330, y: 200, s: 70, draw: bld('sa_door', 64), needs: 'aboody' }, { id: 'wi1', to: 'win', x: 450, y: 200, s: 60, draw: bld('sa_window', 44), needs: 'aboody' }, { id: 'wi2', to: 'win', x: 570, y: 200, s: 60, draw: bld('sa_window', 44), needs: 'aboody' }, { id: 'fl', to: 'flag', x: 690, y: 200, s: 70, draw: bld('sa_flagc', 70), needs: 'aboody' }];
          const dt = await ctx.games.dragdrop({
            prompt: '{a} يعمل التفاصيل: الباب والشباكين والعلم', heroes: 'corner', panel: { x: 240, y: 128, w: 480, h: 150 }, wrongHint: 'حطّه في المكان المرسوم بالنقط', items: partB,
            targets: [Object.assign(onlyBase('d', cx, 428, 'sa_door', 64, 'door'), { w: 44, h: 54 }), Object.assign(onlyBase('wa', cx - 180, 354, 'sa_window', 44, 'win'), { w: 40, h: 44 }), Object.assign(onlyBase('wb', cx + 180, 354, 'sa_window', 44, 'win'), { w: 40, h: 44 }), Object.assign(onlyBase('f', cx, 248, 'sa_flagc', 70, 'flag'), { w: 44, h: 60 })].map(t => Object.assign(t, { itemScale: 1, cols: 1, dy0: 0 }))
          });
          st.state.castle = { base: true, door: true, wins: true, flag: true }; ctx.heroes('floor');
          ctx.reward.star(1); ctx.fx.confetti(); ctx.sfx('fanfare');
          await ctx.say('moody', 'قلعة تحفة! كل واحد عمل اللي بيعرف يعمله.', { anim: 'cheer' });
          ctx.value('teamwork');
          const q = await PK.pair(ctx, { cat: ['math', 'logic', 'shapes_colors'], tag: 'sea' });
          if (q.firstTry >= 1 && bs.mistakes + dt.mistakes <= 3) ctx.reward.star(1);
          st.state.castle = { base: true, door: true, wins: true, flag: true };
          await ctx.say('aboody', 'يا {m}.. بُص! في زبالة كتير على الشاطئ!');
          await ctx.say('moody', 'البلاستيك بيضر السلاحف والسمك. يلا نجمعها ونحطها في أماكنها.');
          const tr = [['pk_pbottle', 'b1'], ['pk_pbag', 'b1'], ['pk_can', 'b1'], ['pk_wrapper', 'b2'], ['pk_core', 'b2'], ['note', 'b2']];
          const tq = await ctx.games.dragdrop({
            prompt: 'نضّفوا الشاطئ: بلاستيك وعلب في الأزرق، والباقي في الأخضر', heroes: 'corner', panel: { x: 130, y: 128, w: 700, h: 150 }, wrongHint: 'جرّب الصندوق التاني',
            items: sh(tr).map((it, i) => ({ id: it[0], art: it[0], to: it[1], x: 215 + i * 105, y: 200, s: 74 })),
            targets: [{ id: 'b1', x: 320, y: 380, w: 120, h: 110, art: 'pk_bin:blue', s: 130, label: 'بلاستيك وعلب', cols: 3, dx: 24, itemScale: .4 }, { id: 'b2', x: 640, y: 380, w: 120, h: 110, art: 'pk_bin:green', s: 130, label: 'مخلّفات تانية', cols: 3, dx: 24, itemScale: .4 }]
          });
          if (tq.mistakes <= 2) ctx.reward.star(1); ctx.value('environment'); ctx.heroes('floor');
          await ctx.say('friend', 'السلام عليكم! سبنا كيس شيبسي فاضي هناك.. نسيبه؟', { name: 'ماجد' });
          const c = await ctx.games.choice({
            prompt: 'في كيس فاضي على الرمل. نعمل إيه؟', options: sh([
              { text: 'ناخده ونرميه في الزبالة', art: 'pk_bin:green', good: true, reply: [['friend', 'عندكم حق! الشاطئ لازم يفضل نضيف.', { name: 'ماجد' }]] },
              { text: 'نسيبه، الموج هياخده', art: 'pk_pbag', good: false, consequence: [['moody', 'الموج هياخده للبحر.. وهناك ممكن يأذي السمك والسلاحف.']] },
              { text: 'ندفنه في الرمل', art: 'sa_sandpile', good: false, consequence: [['aboody', 'بس ده برضه هيفضل موجود تحت الرمل..']] }])
          });
          if (c.firstTry) ctx.reward.star(1);
          return ctx.nav.complete();
        }
      },
      /* ============ 6) غروب الشمس (الختام) ============ */
      {
        id: 'm6', title: 'غروب الشمس', intro: 'آخر لغز.. وآخر صفحة في يوميات المغامرة.', values: ['thanks', 'teamwork', 'study', 'bismillah'], sticker: 's_sunset',
        wisdom: 'الرحلة الحلوة بتبدأ بقلب شاكر.. وبتخلّص بذكريات جميلة', diary: { pic: 'sa_sunart', text: 'آخر صفحة: شفنا غروب الشمس وشكرنا ماما وبابا' },
        async run(ctx) {
          const st = ctx.stage; let keys = 0;
          await ctx.scene('saSea', { state: { kind: 'beach', sun: .45, castle: { base: true, door: true, wins: true, flag: true } }, heroes: { moody: { x: 400, y: 486, dir: 1 }, aboody: { x: 500, y: 496, dir: -1 } } });
          const icons = ['home', 'w_school', 'w_street', 'w_market', 'w_park', 'w_sea'];
          st.addLayer({ z: 20, draw(g, t) { const x0 = 480 - 2.5 * 58; G.fillRR(g, x0 - 36, 96, 5 * 58 + 72, 60, 24, 'rgba(255,247,227,.8)', 3.5); icons.forEach((n, i) => { g.save(); g.globalAlpha = i < keys ? 1 : .28; A.draw(g, n, x0 + i * 58, 126, i < keys ? 46 + Math.sin(t * 4 + i) * 2 : 42); g.restore(); if (i < keys) A.draw(g, 'key', x0 + i * 58 + 14, 144, 18); }); } });
          await ctx.say('baba', 'تعالوا يا أبطال! فاضل شوية على الغروب. فيه صندوق الذكريات.. ومحتاج ٦ مفاتيح من كل مغامراتنا.', { name: 'بابا' });
          await ctx.say('mama', 'كل مفتاح لغز من عالم زرناه. جاهزين؟', { name: 'ماما' });
          const gain = async (label) => { keys++; ctx.sfx('unlock'); ctx.fx.float('مفتاح ' + U.ar(keys), 480, 200, '#ffd23c'); ctx.fx.burst(480, 126, { kind: 'star', n: 10 }); await ctx.wait(.4); };
          let good = 0; const add = r => { good += r.firstTry; };
          await ctx.say('narrator', 'المفتاح الأول: البيت');
          add(await ctx.quiz.pair({ cat: ['health', 'math', 'counting'] })); await gain();
          await ctx.say('narrator', 'المفتاح التاني: المدرسة');
          add(await ctx.quiz.pair({ cat: ['arabic', 'english'] })); await gain();
          await ctx.say('narrator', 'المفتاح التالت: الشارع');
          add(await ctx.quiz.pair({ cat: ['logic', 'patterns', 'health'] })); await gain();
          ctx.reward.star(1);
          await ctx.say('narrator', 'المفتاح الرابع: السوق');
          add(await ctx.quiz.pair({ cat: ['time_money', 'math'] })); await gain();
          await ctx.say('moody', 'دلوقتي ترتيب رحلتنا اللي فاتت.. رتّبوها بالصح!');
          const sq = await ctx.games.sequence({ prompt: 'رتّب أحداث يوم الرحلة', steps: [{ art: 'sa_bag', label: 'جهّزنا الشنطة' }, { art: 'car', label: 'ركبنا العربية' }, { art: 'sa_umbrella', label: 'لعبنا على الشاطئ' }, { art: 'sa_sunart', label: 'شفنا الغروب' }] });
          ctx.heroes('floor'); if (sq.mistakes <= 1) ctx.reward.star(1);
          await ctx.say('narrator', 'المفتاح الخامس: الحديقة');
          add(await PK.pair(ctx, { cat: ['science', 'animals'], tag: 'park' })); await gain();
          await ctx.say('narrator', 'المفتاح الأخير: البحر');
          add(await PK.pair(ctx, { cat: ['geography', 'science'], tag: 'sea' })); await gain();
          const small = M.tierFor(ctx.active) === 6;
          const mm = await ctx.games.pkPairs({
            prompt: 'كل صورة بتفكّرنا بإيه؟', left: [{ k: 'a', art: 'pk_swing', label: 'الأرجوحة' }, { k: 'b', art: 'pk_bin:green', label: 'الزبالة' }, { k: 'c', art: 'sa_lifejacket', label: 'سترة النجاة' }].concat(small ? [] : [{ k: 'd', art: 'toothbrush', label: 'الفرشة' }]),
            right: [{ k: 'a', label: 'نستنى دورنا' }, { k: 'b', label: 'نخلّي المكان نضيف' }, { k: 'c', label: 'نحمي نفسنا في البحر' }].concat(small ? [] : [{ k: 'd', label: 'أسنان لامعة' }])
          });
          ctx.heroes('floor'); if (mm.mistakes <= 1) ctx.reward.star(1);
          if (good >= 8) ctx.reward.star(1);
          /* chest opens */
          let open = false; const rem = st.addLayer({ z: 8, draw(g, t) { A.draw(g, 'chest', 480, 380, 170, { open }); if (open) for (let i = 0; i < 6; i++) G.sparkle(g, 480 + Math.sin(t * 3 + i * 2) * 90, 330 - ((t * 40 + i * 30) % 100), 9, '#fff6a8', .8); } });
          await ctx.say('aboody', 'كل المفاتيح معانا! نفتح الصندوق؟');
          open = true; ctx.sfx('fanfare'); ctx.fx.confetti(); ctx.react('good', 'both'); await ctx.wait(1.2);
          await ctx.say('moody', 'جوّه الصندوق دفتر اليوميات.. وورقة: "اكتبوا آخر صفحة قبل الغروب".');
          rem();
          /* calm sunset */
          await ctx.scene('saSea', { state: { kind: 'beach', sun: .5, castle: { base: true, door: true, wins: true, flag: true }, stars: 0 }, heroes: { moody: { x: 430, y: 488, dir: 1 }, aboody: { x: 530, y: 498, dir: -1 } } });
          M.tw(st.state, { sun: 1.02, stars: 1 }, 40, 'inOut');
          await ctx.say('aboody', 'الله.. الشمس بتنزل في البحر!');
          await ctx.say('mama', 'سبحان الله.. اللون البرتقالي ده كله ببركة ربنا.', { name: 'ماما' });
          await ctx.say('baba', 'يلا يا أبطال.. اكتبوا آخر صفحة في اليوميات.', { name: 'بابا' });
          const A1 = ['بنينا قلعة الرمل', 'لقينا الأصداف والحيوانات', 'لعبنا مع بعض'], A2 = ['شكرنا ربنا على كل النعم', 'شكرنا ماما وبابا', 'هنرجع ونحافظ على الشاطئ'];
          const w1 = await ctx.games.choice({
            prompt: 'أحلى حاجة النهاردة؟', options: [
              { text: 'بنينا قلعة الرمل', art: 'sa_tower', good: true, reply: [['moody', 'القلعة كانت تحفة!']] },
              { text: 'لقينا الأصداف والحيوانات', art: 'sa_shell', good: true, reply: [['aboody', 'والسلطعون الصغير!']] },
              { text: 'لعبنا مع بعض', art: 'heartbig', good: true, reply: [['moody', 'ده أحلى كنز.']] }]
          });
          const w2 = await ctx.games.choice({
            prompt: 'نكتب إيه في آخر صفحة؟', options: [
              { text: 'شكرنا ربنا على كل النعم', art: 'sparkles', good: true, reply: [['aboody', 'الحمد لله.']] },
              { text: 'شكرنا ماما وبابا', art: 'mama', good: true, reply: [['moody', 'شكرًا يا ماما ويا بابا.']] },
              { text: 'هنرجع ونحافظ على الشاطئ', art: 'sa_umbrella', good: true, reply: [['aboody', 'ونسيبه نضيف!']] }]
          });
          ctx.diary.add({ id: 'sea-m6', pic: 'sa_sunart', text: 'آخر صفحة: أحلى حاجة إننا ' + A1[w1.index || 0] + '، و' + A2[w2.index || 0] });
          await ctx.say('narrator', 'وكتب مودي وعبودي آخر صفحة في اليوميات..');
          await ctx.say('moody', 'شكرًا يا ماما.. شكرًا يا بابا.. على الرحلة وعلى كل حاجة.');
          await ctx.games.ritual({ text: 'شكرًا!', sub: 'يا ماما ويا بابا', who: 'aboody' });
          ctx.fx.burst(480, 330, { kind: 'heart', n: 24 }); ctx.sfx('good');
          await ctx.say('mama', 'ربنا يحفظكم يا أغلى حاجة عندنا.', { name: 'ماما' });
          await ctx.say('baba', 'فخور بيكم يا أبطال!', { name: 'بابا' });
          /* grand celebration */
          const rs = ctx.every(.55, () => { const x = U.rnd(120, 840), y = U.rnd(110, 280); st.burst(x, y, { n: 18, kind: U.pick(['star', 'spark', 'star']), max: 220 }); if (Math.random() < .5) ctx.sfx('coin'); });
          ctx.sticker.give('s_sunset'); ctx.reward.star(1); ctx.fx.confetti(); ctx.sfx('fanfare');
          await ctx.say('narrator', 'مبروك يا مودي ويا عبودي! خلّصتوا المغامرة كلها.');
          await ctx.wait(1.2); rs();
          await ctx.games.seaCertificate({ stars: Math.max(1, ctx.stars) });
          return ctx.nav.complete({ wisdom: 'الرحلة الحلوة بتبدأ بقلب شاكر.. وبتخلّص بذكريات جميلة' });
        }
      }
    ]
  });
})();
