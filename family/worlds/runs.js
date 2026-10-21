/* Family Adventures - worlds/runs.js : WORLD 11 "سباق المغامرة" (3 missions) - a 3-lane pseudo-3D runner with POSITIVE goals: deliver / rescue / arrive.
   Needs (loaded before): engine/runner.js + engine/runner_hero.js (index.html), content/q_runs.js, worlds/runs_art.js.
   Every mission = short story scene (voiced) -> ctx.games.runner(...) (hero picker, quiz lanes, power-ups, checkpoints) -> arrival scene -> stars.
   Stars: 1 = arrived, 2 = enough coins, 3 = few funny stumbles. Tokens {m} {a} {me} = names. */
(function () {
  'use strict';
  const M = window.Moody, U = M.util;
  M.registerValue('trust', { label: 'الأمانة وإيصال الحاجة لصاحبها', desc: 'نوصّل العيش ل{gm} وهو سخن' });
  M.registerValue('rescue', { label: 'نجدة الضعيف والرفق بالحيوان', desc: 'ننقذ القطة الصغيرة من الشجرة' });
  M.registerValue('love', { label: 'الحب والهدية لبابا', desc: 'نوصّل هدية بابا قبل التلفريك' });
  M.registerValue('persist', { label: 'المثابرة وتكملة الجري', desc: 'منستسلمش لما نتعثر.. بنقوم ونكمّل' });
  M.registerValue('roadmanners', { label: 'أدب الطريق', desc: 'نسلّم ونعتذر ونساعد ونعدّي بأمان' });

  const here = ctx => ctx.active;
  /* stars: 1 arrived, +1 coins (>= 50% of the track's coins), +1 few collisions (<= 2).  Returns what was earned for the closing line */
  function award(ctx, r) {
    const got = [], goal = Math.round((r.coinsTotal || 100) * .5);   // star 2 = about half of all the coins on the track
    if (!r.skipped) { ctx.reward.star(1); got.push('arrive'); }
    if (!r.skipped && r.coins >= goal) { ctx.reward.star(1); got.push('coins'); }
    if (!r.skipped && r.collisions <= 2) { ctx.reward.star(1); got.push('clean'); }
    ctx.value('persist'); if (r.gates && r.gates.correct) ctx.value('roadmanners');
    return got;
  }
  /* F = the cousin / friend NPC of the family (role character cz1) */
  const F = M.chars.defs.cz1 ? 'cz1' : null, who = () => F || 'friend';

  M.registerWorld({
    id: 'runs', order: 11, title: 'سباق المغامرة', icon: 'w_runs', theme: { c1: '#ffd9a8', c2: '#ff7a3c' }, finalSticker: 's_runs',
    stickers: [
      { id: 's_run_bread', title: 'عيش سخن', art: 'run_bread', bg: '#fff3c4' }, { id: 's_run_kitten', title: 'منقذ القطة', art: 'run_kitten', bg: '#ffe9c8', rot: -.08 },
      { id: 's_run_gift', title: 'هدية بابا', art: 'run_giftbag', bg: '#ffe0e8', rot: .07 }, { id: 's_runs', title: 'أبطال السباق', art: 'w_runs', bg: '#ffe9c8', rot: -.05 }
    ],
    heroes: ['moody', 'aboody'], control: ['moody', 'aboody', 'toota', 'nemo'],
    missions: [
      /* ============ 1) عيش {gm} ============ */
      {
        id: 'r1', req: 'gm', title: 'عيش {gm}', intro: 'العيش لسه سخن.. يلا نجري ونوصّله!', values: ['trust', 'help', 'kindness'], sticker: 's_run_bread',
        wisdom: 'اللي يوصّل الأمانة لصاحبها.. ربنا يوصّله لأحلى حاجة', diary: { pic: 'run_bread', text: 'جرينا في السوق ووصّلنا العيش السخن ل{gm}' },
        async run(ctx) {
          await ctx.scene('kitchen', { heroes: { moody: { x: 330, y: 484, dir: 1 }, aboody: { x: 450, y: 494, dir: 1 } } });
          await ctx.say('mama', 'صباح الخير يا أبطال! العيش السخن لسه طالع من الفرن.');
          await ctx.say('mama', '{gm} مستنياه. لازم يوصلها وهو سخن قبل ما يبرد!');
          await ctx.say('moody', 'سيبيها علينا يا ماما! هنجري ونوصّله بسرعة.', { anim: 'cheer' });
          await ctx.say('aboody', 'وأنا هاخد بالي من الطريق! اللي قدامنا كله لعب!');
          const r = await ctx.games.runner({
            theme: 'market', length: 1000, speed: [8.8, 13.4], ramp: 80, carry: 'run_bread', prompt: 'وصّل العيش ل{gmt} قبل ما يبرد!', prompt2: 'كمّل جري! العيش لسه سخن',
            goal: { art: 'run_goal_nana', emptyArt: 'run_goal_nana:e', who: 'nana', give: 'run_bread', icon: 'run_bread', label: '{gm}', sz: 300 }, say: { start: ['mama', 'يلا يا أبطال! العيش سخن!'], finish: ['nana', 'وصلتوا يا حبايبي!'] },
            plan: [{ chunks: 2, tier: 1 }, { item: 'rand' }, { chunks: 2, tier: 1 }, { gate: 'quiz', tag: 'runs_n' }, { chunks: 2, tier: 2 }, { star: true }, { checkpoint: 'نص الطريق خلص! العيش لسه سخن', who: 'mama' }, { chunks: 2, tier: 2 }, { item: 'rand' }, { chunks: 1, tier: 2 },
              { gate: 'manners', tag: 'runs_street' }, { chunks: 2, tier: 2 }, { star: true }, { chunks: 2, tier: 3 }, { gate: 'quiz', tag: 'runs_n' }, { checkpoint: 'قربنا أوي! {gmt} بتستنى', who: 'nana' }, { chunks: 2, tier: 2 }, { item: 'rand' }, { chunks: 1, tier: 2 }, { star: true }]
          });
          const H = here(ctx), got = award(ctx, r);
          ctx.stage.setCast([H, 'nana'], [H]); UI_rebuild();
          await ctx.scene('nn_door3', { state: { open: 1, bell: false }, heroes: { [H]: { x: 300, y: 484, dir: 1 }, nana: { x: 470, y: 482, dir: -1 } } });
          await ctx.say('nana', 'يا حبايبي! جيتوا! الريحة دي تجنن!', { anim: 'cheer' });
          await ctx.say(H, 'اتفضلي يا {gmt}! العيش لسه سخن!', { anim: 'cheer' });
          if (r.collisions <= 2) await ctx.say('nana', 'وكمان وصّلتوه من غير ما يقع! إنتوا جامدين أوي!'); else await ctx.say('nana', 'حتى لو اتعثرتوا في السكة.. قمتوا وكمّلتوا! ده الأهم!');
          await ctx.say('nana', 'تسلم إيديكم! إنتوا أحلى أبطال.', { anim: 'wave' });
          ctx.fx.burst(470, 300, { kind: 'heart' }); ctx.react('good', 'both');
          ctx.diary.add({ id: 'runs-r1', pic: 'run_bread', text: 'جرينا في السوق ووصّلنا العيش السخن ل{gm}. جمعنا ' + U.ar(r.coins) + ' عملة' });
          return ctx.nav.complete();
        }
      },
      /* ============ 2) إنقاذ القطة الصغيرة ============ */
      {
        id: 'r2', title: 'إنقاذ القطة الصغيرة', intro: 'قطة صغيرة علقت فوق الشجرة.. محتاجة سلّم!', values: ['rescue', 'kindness', 'teamwork'], sticker: 's_run_kitten',
        wisdom: 'لما نساعد اللي محتاج.. قلوبنا بتفرح', diary: { pic: 'run_kitten', text: 'جبنا السلّم قطعة قطعة وأنقذنا القطة الصغيرة' },
        async run(ctx) {
          ctx.stage.setCast(['moody', 'aboody'].concat(F || []), ['moody', 'aboody', 'toota', 'nemo']); UI_rebuild();
          await ctx.scene('pkPark', { state: { kind: 'plain' }, heroes: Object.assign({ moody: { x: 300, y: 484, dir: 1 }, aboody: { x: 420, y: 494, dir: 1 } }, F ? { [F]: { x: 640, y: 490, dir: -1 } } : {}) });
          await ctx.say(who(), 'ميااو.. اسمعوا! في قطة صغيرة علقت فوق الشجرة الكبيرة!', { anim: 'wave' });
          await ctx.say('aboody', 'يا حرام! مسكينة! هي خايفة!');
          await ctx.say('moody', 'محتاجين سلّم. السلّم متفكك ٣ قطع، مرميين على طول مسار الحديقة.');
          await ctx.say(who(), 'اجري واجمع القطع الـ٣! وإحنا هنفضل نطمّنها.', { anim: 'cheer' });
          const r = await ctx.games.runner({
            theme: 'park', length: 1100, speed: [8.8, 13.4], ramp: 80, carry: null, prompt: 'اجمع ٣ قطع سلّم وأنقذ القطة', prompt2: 'كمّل! لسه في قطع سلّم',
            goal: { art: 'run_goal_tree', who: F, give: 'run_ladder', icon: 'run_kitten', label: 'القطة', sz: 340 }, part: { art: 'run_ladder', n: 3, label: 'قطعة السلّم', say: 'جبنا قطعة سلّم!', sz: 120 },
            say: { start: [who(), 'جيبوا القطع! القطة مستنية!'], finish: ['aboody', 'وصلنا للشجرة!'] },
            plan: [{ chunks: 2, tier: 1 }, { part: true }, { chunks: 2, tier: 1 }, { item: 'rand' }, { gate: 'quiz', tag: 'runs_nature' }, { chunks: 2, tier: 2 }, { star: true }, { checkpoint: 'برافو! جبنا قطعة وفاضل أكتر', who: 'cz1' }, { part: true }, { chunks: 2, tier: 2 }, { item: 'rand' },
              { gate: 'manners', tag: 'runs_park' }, { chunks: 2, tier: 2 }, { star: true }, { chunks: 2, tier: 3 }, { part: true }, { chunks: 1, tier: 2 }, { gate: 'quiz', tag: 'runs_nature' }, { checkpoint: 'القطة شايفاكم! قربنا', who: 'aboody' }, { chunks: 2, tier: 2 }, { item: 'rand' }, { star: true }]
          });
          const H = here(ctx), got = award(ctx, r);
          ctx.stage.setCast([H].concat(F || []), [H]); UI_rebuild();
          await ctx.scene('run_tree', { state: { rescue: 0, ladder: 0 }, heroes: Object.assign({ [H]: { x: 360, y: 488, dir: 1 } }, F ? { [F]: { x: 250, y: 494, dir: 1 } } : {}) });
          const st = ctx.stage.state;
          await ctx.say(H, 'جمعنا القطع الـ٣! يلا نركّب السلّم!', { anim: 'cheer' });
          await ctx.walk(H, 560, 488);
          ctx.sfx('good'); await M.tw(st, { ladder: 1 }, 1.4, 'outBack');
          await ctx.say(who(), 'ثبّت السلّم كويس! وأنا هطلّع القطة بالراحة.');
          ctx.sfx('pop'); await M.tw(st, { rescue: 1 }, 2.2, 'inOut');
          ctx.fx.burst(540, 400, { kind: 'heart' }); ctx.fx.sparkle(540, 420);
          await ctx.say(H, 'تعالي يا قطتي.. إنتي في أمان!', { anim: 'lift' });
          await ctx.say(who(), 'ميااو! بتقولكم شكرًا!', { anim: 'cheer' });
          await ctx.say(H, 'مفيش حاجة تفرّح زي إنك تساعد حد محتاج.');
          ctx.react('good', 'both'); ctx.fx.confetti();
          ctx.diary.add({ id: 'runs-r2', pic: 'run_kitten', text: 'جمعنا ٣ قطع سلّم وأنقذنا القطة الصغيرة من الشجرة' });
          return ctx.nav.complete();
        }
      },
      /* ============ 3) الطيّارة لبابا ({dcity}) ============ */
      {
        id: 'r3', req: 'dad', title: 'الطيّارة لبابا', intro: 'بابا نسي الهدية.. والتلفريك هيتحرك!', values: ['love', 'trust', 'kindness'], sticker: 's_run_gift',
        wisdom: 'الهدية الصغيرة بتعمل فرحة كبيرة', diary: { pic: 'run_giftbag', text: 'جرينا في جبال {dcity} ووصّلنا هدية بابا قبل التلفريك' },
        async run(ctx) {
          ctx.stage.setCast(['moody', 'aboody'], ['moody', 'aboody', 'toota', 'nemo']); UI_rebuild();
          await ctx.scene('saudiPeak', { state: { cold: false }, heroes: { moody: { x: 300, y: 484, dir: 1 }, aboody: { x: 430, y: 494, dir: 1 } } });
          await ctx.say('baba', 'ألو يا أبطال! أنا في محطة التلفريك في {dcity}.', { anim: 'wave' });
          await ctx.say('baba', 'نسيت شنطة الهدية بتاعتي! والتلفريك هيتحرك كمان شوية!');
          await ctx.say('moody', 'متقلقش يا بابا! إحنا هنجيبها لحد عندك.', { anim: 'cheer' });
          await ctx.say('aboody', 'هنجري على طريق الجبل بسرعة! حتى لو في خرفان!');
          const r = await ctx.games.runner({
            theme: 'abha', length: 1200, speed: [8.8, 13.4], ramp: 85, carry: 'run_giftbag', prompt: 'وصّل هدية بابا قبل التلفريك', prompt2: 'كمّل جري! بابا مستنينا',
            goal: { art: 'run_goal_station', emptyArt: 'run_goal_station:e', who: 'baba', give: 'run_giftbag', icon: 'run_giftbag', label: 'بابا', sz: 320 }, say: { start: ['baba', 'بسرعة يا أبطال! أنا مستنيكم!'], finish: ['baba', 'يا سلام! وصلتوا!'] },
            plan: [{ chunks: 2, tier: 1 }, { item: 'rand' }, { chunks: 2, tier: 1 }, { gate: 'quiz', tag: 'runs_abha' }, { chunks: 2, tier: 2 }, { star: true }, { checkpoint: 'نص الطريق! التلفريك لسه واقف', who: 'baba' }, { chunks: 2, tier: 2 }, { item: 'rand' }, { chunks: 2, tier: 2 },
              { gate: 'manners', tag: 'runs_safe' }, { chunks: 2, tier: 3 }, { star: true }, { chunks: 2, tier: 3 }, { gate: 'quiz', tag: 'runs_n' }, { checkpoint: 'شايف المحطة! قربتوا', who: 'baba' }, { chunks: 2, tier: 2 }, { item: 'rand' }, { chunks: 2, tier: 2 }, { star: true }]
          });
          const H = here(ctx), got = award(ctx, r);
          ctx.stage.setCast([H, 'baba'], [H]); UI_rebuild();
          await ctx.scene('run_station', { state: { car: 0 }, heroes: { [H]: { x: 330, y: 488, dir: 1 }, baba: { x: 520, y: 486, dir: -1 } } });
          const st = ctx.stage.state;
          await ctx.say('baba', 'يا سلام! وصلتوا قبل التلفريك بدقيقة!', { anim: 'cheer' });
          await ctx.say(H, 'اتفضل يا بابا! دي شنطة الهدية بتاعتك!', { anim: 'cheer' });
          await ctx.say('baba', 'أحلى هدية في اليوم ده إنتوا! وإنكم جريتوا علشاني.');
          try { await M.chars.hug(H, 'baba', { dur: 1.8 }); } catch (e) { await ctx.wait(1.2); }
          ctx.fx.burst(500, 330, { kind: 'heart' }); ctx.react('good', 'both');
          await ctx.say('baba', 'يلا بقى.. هركب التلفريك وألوّح لكم! بحبكم!', { anim: 'wave' });
          await M.tw(st, { car: 1 }, 2.4, 'inOut'); ctx.fx.confetti();
          ctx.diary.add({ id: 'runs-r3', pic: 'run_giftbag', text: 'جرينا في جبال {dcity} ووصّلنا هدية بابا قبل ما التلفريك يمشي' });
          return ctx.nav.complete();
        }
      }
    ]
  });
  /* shared with worlds/runs2.js (stages r4..r15, loaded right after the art + questions through Moody.load, which boot.js re-reads while loading) */
  M.runsKit = { award, F, who, UI_rebuild };
  M.load.push('content/q_runs2.js', 'worlds/runs_art2.js', 'worlds/runs2.js');
  function UI_rebuild() { try { M.ui.hud.rebuild(); M.ui.hud.showSwitch(true); } catch (e) { } }
})();
