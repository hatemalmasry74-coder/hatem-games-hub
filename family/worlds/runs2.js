/* Family Adventures - worlds/runs2.js : stages r4..r15 of world 'runs' (سباق المغامرة).  Appends to the world registered by worlds/runs.js (Moody.runsKit).
   Data-driven: every stage = story intro (voiced) -> Moody.runner kit (theme, plan, ally, hero tip) -> ending scene -> stars (arrive / half of the coins / <= 2 stumbles).
   Stages that need a grandmother or a travelling dad carry `req: 'gm'` / `req: 'dad'` (the runtime hides them when the parents did not enable that).
   Dialogue tokens: 'H' = the hero the child picked, 'F' = the friend NPC (cousin Ofa in the owner's edition, generic friend elsewhere). */
(function () {
  'use strict';
  const M = window.Moody, C = M.chars, K = M.runsKit, U = M.util;
  if (!K) return;
  const has = id => !!C.defs[id], pick = l => l.filter(has);
  const reg = (tag, info) => M.registerValue(tag, info);
  reg('responsibility', { label: 'تحمّل المسؤولية', desc: 'نوصّل اللي اتكلّفنا بيه' }); reg('punctual', { label: 'احترام المواعيد', desc: 'نوصّل الدوا والمشاوير في ميعادها' }); reg('environment', { label: 'حماية البيئة', desc: 'نلمّ الزبالة ونحافظ على الحديقة والشط' });
  reg('neighbours', { label: 'حق الجيران', desc: 'نعيّد على جيراننا بأدب' }); reg('petcare', { label: 'الرفق بالحيوان', desc: 'نساعد الجرو التايه' }); reg('fairplay', { label: 'اللعب النضيف', desc: 'نلعب بروح رياضية' });

  /* ---------- plan shorthand ---------- */
  const c = (n, t) => ({ chunks: n, tier: t }), g = tag => ({ gate: 'quiz', tag }), m = tag => ({ gate: 'manners', tag }), item = { item: 'rand' }, star = { star: true }, pad = { pad: true }, cp = (text, who) => ({ checkpoint: text, who }),
    slalom = { pattern: 's' }, tunnel = { pattern: 't' }, arrow = { shape: 'arrow' }, starS = { shape: 'star' }, part = { part: true }, burst = (n, label) => ({ burst: n, tier: 2, label });

  /* ---------- the stages ---------- */
  const S = [
    { id: 'r4', title: 'المشروع والباص', intro: 'مشروع العلوم لازم يوصل المدرسة قبل الطابور!', values: ['responsibility', 'teamwork', 'punctual'], sticker: 's_run_school', wisdom: 'اللي يتعب في مشروعه.. بيفرح بنتيجته', pic: 'run_project', diary: 'جرينا بمشروع العلوم لحد باب المدرسة',
      scene: 'sc_street', state: {}, intro_l: [['mama', 'يا {m} يا {a}! الباص قرّب. مشروع العلوم لازم يروح المدرسة النهارده.'], ['moody', 'إحنا اشتغلنا فيه كلنا! هنوصّله في ميعاده.', { anim: 'cheer' }], ['aboody', 'هجري قدّامكم وأفتح الطريق!']],
      kit: { theme: 'school', length: 950, speed: [8.8, 13.0], ramp: 80, carry: 'run_project', prompt: 'وصّل المشروع للمدرسة قبل الطابور', prompt2: 'كمّل جري! المدرسة قربت', ally: 'aboody', rec: { hero: 'toota', why: '{t} بتنط نطّتين وتعدّي العربية العالية' },
        goal: { art: 'run_goal_school', icon: 'run_project', label: 'المدرسة', sz: 330, give: 'run_project' }, say: { start: ['mama', 'يلا يا أبطال! المشروع في إيديكم'], finish: ['moody', 'وصلنا المدرسة!'] },
        plan: [c(2, 1), pad, arrow, c(2, 1), g('runs_school'), c(2, 1), item, star, cp('نص الطريق للمدرسة!', 'moody'), c(2, 2), pad, m('runs_m_school'), c(2, 2), star, c(2, 2), g('runs_school')] },
      outScene: 'sc_class', out: [['F', 'يا سلام! ده أحلى مشروع في الفصل!'], ['H', 'إحنا اشتغلنا فيه مع بعض.', { anim: 'cheer' }], ['F', 'الشغل الجماعي دايمًا بيطلع حلو.']] },
    { id: 'r5', req: 'gm', title: 'دوا {gm}', intro: 'الدوا لازم يوصّل {gmt} في ميعاده بالظبط!', values: ['punctual', 'kindness', 'trust'], sticker: 's_run_med', wisdom: 'الوقت أمانة.. والدوا في ميعاده شفا', pic: 'run_medbag', diary: 'وصّلنا الدوا ل{gm} في ميعاده',
      scene: 'living', state: {}, intro_l: [['mama', '{gm} لازم تاخد الدوا الساعة خمسة. الساعة دلوقتي أربعة وعشرة.'], ['moody', 'يعني قدامنا ٥٠ دقيقة بس. هنجري ونوصل بدري!'], ['aboody', 'وأنا هقرا الساعة في الطريق!']],
      kit: { theme: 'town', length: 1000, speed: [9.0, 13.2], ramp: 80, carry: 'run_medbag', prompt: 'وصّل الدوا ل{gmt} في ميعاده', prompt2: 'كمّل! {gmt} مستنياك', rec: { hero: 'aboody', why: '{a} سريع في تغيير الحارة وسط العربيات' },
        goal: { art: 'run_goal_nana', emptyArt: 'run_goal_nana:e', who: 'nana', give: 'run_medbag', icon: 'run_medbag', label: '{gmt}', sz: 300 }, say: { start: ['mama', 'بالراحة والأمان وإنتوا ماشيين'], finish: ['nana', 'جيتوا في ميعادكم!'] },
        plan: [c(2, 1), g('runs_time'), c(2, 1), pad, item, slalom, c(1, 2), star, cp('الساعة بقت أربعة وأربعين! كمّلوا', 'mama'), c(2, 2), m('runs_m_med'), c(2, 2), starS, slalom, g('runs_time'), cp('قربنا! {gmt} بتشوفنا', 'nana'), c(2, 2), star] },
      outScene: 'nn_door3', out: [['nana', 'يا حبايبي! الدوا وصل في ميعاده بالظبط!', { anim: 'cheer' }], ['H', 'الساعة خمسة إلا خمس دقايق يا {gmt}!'], ['nana', 'اللي بيحترم المواعيد.. ربنا بيحبه. تسلم إيديكم.']], extra: ['nana'], door: true },
    { id: 'r6', title: 'بالونة على الشط', intro: 'بالونة جميلة طارت.. يلا نلحقها على الشاطئ!', values: ['helpsmall', 'environment', 'persist'], sticker: 's_run_beach', wisdom: 'اللي يساعد غيره.. يلاقي اللي يساعده', pic: 'run_balloon', diary: 'جرينا على الشاطئ ولحقنا البالونة',
      scene: 'saSea', state: {}, intro_l: [['F', 'بالونتي طارت! الريح خدتها ناحية الشط!', { anim: 'cry' }], ['aboody', 'متخافيش! إحنا هنلحقها!'], ['moody', 'اجروا ورا البالونة، بس خدوا بالكم من الناس على الرملة.']],
      kit: { theme: 'beach', length: 1000, speed: [9.0, 13.4], ramp: 80, prompt: 'اجري ولحّق البالونة قبل ما تروح', prompt2: 'كمّل! البالونة قدّامك', rec: { hero: 'aboody', why: '{a} صغير ويتزحلق في الأنفاق أحسن!' }, ally: 'nemo',
        goal: { art: 'run_goal_balloon', icon: 'run_balloon', label: 'البالونة', sz: 330 }, say: { start: ['F', 'هناك! شايفينها!'], finish: ['aboody', 'مسكناها!'] },
        plan: [c(2, 1), pad, c(2, 1), g('runs_sea'), tunnel, c(2, 1), item, arrow, c(2, 2), star, cp('البحر جميل بس إحنا ماشيين ورا البالونة', 'F'), c(2, 2), m('runs_m_sea'), tunnel, c(2, 2), star, c(2, 2), g('runs_sea')] },
      outScene: 'saSea', out: [['H', 'مسكت البالونة! اتفضلي.', { anim: 'cheer' }], ['F', 'شكرًا ليكم! إنتوا أحسن أصحاب!'], ['H', 'ومن النهارده هنربطها في إيدك كويس.']], extra: ['F'] },
    { id: 'r7', title: 'الجرو التايه', intro: 'جرو صغير تايه.. يلا نوصّله بيته!', values: ['petcare', 'kindness', 'responsibility'], sticker: 's_run_pup', wisdom: 'الرفق بالحيوان.. من أخلاق الكبار', pic: 'run_puppy', diary: 'ساعدنا جرو صغير يلاقي بيته',
      scene: 'pkPark', state: { kind: 'plain' }, intro_l: [['aboody', 'الله! جرو صغير! مين صاحبك يا حلو؟'], ['moody', 'ده لابس طوق. مكتوب عليه عنوان بيته في آخر الحديقة.'], ['aboody', 'هشيله بالراحة ونجري نوصّله!']],
      kit: { theme: 'puppy', length: 1050, speed: [9.2, 13.6], ramp: 80, carry: 'run_puppy', prompt: 'وصّل الجرو لبيته', prompt2: 'كمّل! بيته قرّب', rec: { hero: 'nemo', why: '{n} بتجمع العملات من الحارة اللي جنبها' }, ally: 'aboody',
        goal: { art: 'run_goal_doghouse', icon: 'run_puppy', label: 'بيت الجرو', sz: 300, give: 'run_puppy' }, say: { start: ['aboody', 'متخافش يا جرو، إحنا معاك'], finish: ['moody', 'ده بيته!'] },
        plan: [c(2, 1), g('runs_dog'), c(2, 1), starS, pad, c(2, 2), item, slalom, cp('الجرو بيهزّ ديله! فرحان', 'aboody'), c(2, 2), m('runs_m_dog'), c(2, 2), star, arrow, c(2, 2), g('runs_dog')] },
      outScene: 'pkGarden', out: [['H', 'ده بيتك يا جرو! هتنام فيه دافي.', { anim: 'cheer' }], ['F', 'وأنا هجيب له أكل وماية. برافو عليكم!'], ['H', 'الجرو حلو.. بس الأحلى إنه رجع لبيته.']], extra: ['F'] },
    { id: 'r8', title: 'كحك العيد للجيران', intro: 'الكحك طلع طازة.. يلا نعيّد على الجيران!', values: ['neighbours', 'kindness', 'share'], sticker: 's_run_kahk', wisdom: 'الجار قبل الدار.. والمحبة بتبدأ بكحكة', pic: 'run_kahk', diary: 'وزّعنا الكحك على جيراننا في العمارة',
      scene: 'kitchen', state: {}, intro_l: [['mama', 'كل سنة وإنتم طيبين! الكحك جاهز. هتوزّعوه على الجيران في العمارة.'], ['moody', 'هنخبّط خبطة خفيفة ونقول كل سنة وإنتم طيبين.'], ['aboody', 'وهنجري على السلّم بحرص عشان الكحك ميقعش!']],
      kit: { theme: 'stairs', length: 1000, speed: [9.2, 13.6], ramp: 80, carry: 'run_kahk', prompt: 'وزّع الكحك على الجيران بأدب', prompt2: 'كمّل! لسه جيران', rec: { hero: 'toota', why: '{t} بتنط فوق عربية الأطفال بنطّتين' }, ally: 'nemo',
        goal: { art: 'run_goal_neighbor', icon: 'run_kahk', label: 'الجيران', sz: 330, give: 'run_kahk' }, say: { start: ['mama', 'بالراحة على السلّم يا أبطال'], finish: ['F', 'كل سنة وإنتم طيبين!'] },
        plan: [c(2, 1), g('runs_kind'), slalom, c(1, 2), pad, item, c(2, 2), m('runs_m_kind'), star, cp('نص العمارة خلص! جيران كتير فرحانين', 'mama'), c(2, 2), arrow, c(2, 2), g('runs_kind'), c(2, 2)] },
      outScene: 'nn_hall6', out: [['F', 'يا ألف شكر! الكحك ريحته تجنن!', { anim: 'cheer' }], ['H', 'كل سنة وإنتم طيبين يا جيراننا.'], ['F', 'والله إنتوا أحلى جيران في العمارة!']], extra: ['F'] },
    { id: 'r9', title: 'مكوّنات {aunt1}', intro: '{aunt1} محتاجة المكوّنات عشان الكيكة!', values: ['help', 'teamwork', 'share'], sticker: 's_run_cook', wisdom: 'اللي يساعد في المطبخ.. يتعلم الحلو منه', pic: 'run_basket', diary: 'جبنا المكوّنات ل{aunt1} عشان الكيكة',
      scene: 'mk_market', state: {}, intro_l: [['aunt1', 'يا أبطال! محتاجة ٤ مكوّنات للكيكة: برتقان وتفاح وطماطم وجزر. اتفرّجوا على الطريق وهاتوهم!', { anim: 'wave' }], ['moody', 'ماشي يا عمتو! هنجمعهم وإحنا جايين.'], ['aboody', 'وهنعدّهم كويس!']],
      kit: { theme: 'kitchen', length: 1100, speed: [9.4, 13.8], ramp: 80, carry: 'run_basket', part: { art: 'orange', n: 4, label: 'مكوّن', say: 'جبنا مكوّن!', sz: 90 }, prompt: 'اجمع ٤ مكوّنات ل{aunt1}', prompt2: 'كمّل! لسه مكوّنات', rec: { hero: 'moody', why: '{m} قوي ويكسّر الصناديق من الطريق' },
        goal: { art: 'run_goal_amani', who: 'aunt1', give: 'run_basket', icon: 'run_basket', label: '{aunt1}', sz: 330 }, say: { start: ['aunt1', 'يلا يا شاطرين!'], finish: ['aunt1', 'جبتوا كل حاجة!'] },
        plan: [c(2, 1), part, g('runs_cook'), c(2, 2), pad, item, part, slalom, m('runs_m_cook'), c(2, 2), star, part, c(2, 2), arrow, g('runs_cook'), c(2, 2), part, c(1, 2)] },
      outScene: 'kitchen', out: [['aunt1', 'يا سلام! كل المكوّنات وصلت!', { anim: 'cheer' }], ['H', 'اتفضلي يا عمتو. عددناهم واحد واحد.'], ['aunt1', 'تعالوا نعمل الكيكة سوا.. وفيها ربع كيلو حب وحنان!']], extra: ['aunt1'] },
    { id: 'r10', title: 'سباق التتابع مع ولاد العم', intro: 'يوم الرياضة! نجري ونسلّم العصا للفريق!', values: ['teamwork', 'fairplay', 'sharing'], sticker: 's_run_relay', wisdom: 'الفريق الحلو.. بيكسب بالروح قبل الجري', pic: 'run_baton', diary: 'جرينا سباق التتابع مع ولاد العم',
      scene: 'sc_gym', state: {}, intro_l: [['F', 'يلا يا فريق! أنا و{cz4} و{cz5} مستنيينكم عند خط التسليم.', { anim: 'cheer' }], ['moody', 'هنجري بالعصا ونسلّمها بحرص.'], ['aboody', 'ونشجّع بعض مهما كانت النتيجة!']],
      kit: { theme: 'sport', length: 1150, speed: [9.4, 14.2], ramp: 80, carry: 'run_baton', prompt: 'اجري بالعصا وسلّمها لفريقك', prompt2: 'كمّل! الفريق مستنّي', ally: 'cz1', rec: { hero: 'aboody', why: '{a} بيعدّي الحواجز الواطية بسرعة' },
        goal: { art: 'run_goal_baton', who: 'cz4', give: 'run_baton', icon: 'run_baton', label: 'خط التسليم', sz: 330 }, say: { start: ['F', 'بالتوفيق! إحنا معاك'], finish: ['F', 'سلّمها!'] },
        plan: [c(2, 1), g('runs_sport'), c(2, 2), pad, slalom, item, c(2, 2), burst(2, 'سرعة التتابع!'), star, cp('نص السباق! فريقنا بيشجّعك', 'F'), c(2, 2), m('runs_m_sport'), slalom, c(2, 3), arrow, g('runs_sport'), c(2, 2)] },
      outScene: 'sc_gym', out: [['cz4', 'استلمت العصا! برافو يا بطل!', { anim: 'cheer' }], ['H', 'سلّمتها بحرص.. والفضل للفريق كله.'], ['F', 'سواء كسبنا ولا لأ.. إحنا أحلى فريق!']], extra: ['F', 'cz4', 'cz5'] },
    { id: 'r11', title: 'نضّف الحديقة', intro: 'زجاجات فاضية في الحديقة.. يلا نلمّها!', values: ['environment', 'teamwork', 'responsibility'], sticker: 's_run_eco', wisdom: 'الحديقة النضيفة.. تفرّح كل الناس', pic: 'run_bottle', diary: 'لمّينا زجاجات الحديقة ورميناها في مكانها',
      scene: 'pkPark', state: { kind: 'plain' }, intro_l: [['F', 'بصّوا! زجاجات وورق مرميّة في الحديقة!'], ['moody', 'مش حلو. هنلمّها كلها ونرميها في الصناديق الصح.'], ['aboody', 'هنجمع ٥ زجاجات وإحنا بنجري!']],
      kit: { theme: 'eco', length: 1100, speed: [9.4, 14.0], ramp: 80, part: { art: 'run_bottle', n: 5, label: 'زجاجة', say: 'لمّينا زجاجة!', sz: 100 }, prompt: 'الم ٥ زجاجات وارميهم في الصناديق', prompt2: 'كمّل! لسه زجاجات', rec: { hero: 'nemo', why: '{n} بتلمّ العملات والحاجات من الحارات اللي جنبها' }, ally: 'moody',
        goal: { art: 'run_goal_bins', icon: 'run_bottle', label: 'الصناديق', sz: 330 }, say: { start: ['F', 'يلا نخلّي الحديقة نضيفة'], finish: ['moody', 'وصلنا الصناديق!'] },
        plan: [c(2, 1), part, g('runs_eco'), c(2, 2), part, pad, c(2, 2), item, m('runs_m_eco'), starS, part, slalom, c(2, 2), tunnel, g('runs_eco'), part, c(2, 2), star, part, c(1, 3)] },
      outScene: 'pkGarden', out: [['H', 'رمينا الزجاجات كل واحدة في صندوقها.', { anim: 'cheer' }], ['F', 'الحديقة بقت تلمع! الأطفال هيلعبوا فيها بفرحة.'], ['H', 'لو كل واحد لمّ حاجة.. الدنيا كلها تبقى نضيفة.']], extra: ['F'] },
    { id: 'r12', req: 'dad', title: 'مطار {dcity}', intro: 'الطيارة هتقوم! لازم نوصل بوابة السفر في ميعادها!', values: ['punctual', 'love', 'responsibility'], sticker: 's_run_air', wisdom: 'السفر بيحتاج تنظيم.. والحب بيختصر المسافات', pic: 'run_passport', diary: 'جرينا في المطار ولحقنا طيارة {dcity}',
      scene: 'saHome', state: {}, intro_l: [['baba', 'ألو يا أبطال! أنا مستنيكم في مطار {dcity}. الجواز معاكم؟'], ['moody', 'أيوه يا بابا! الجواز في إيدينا.', { anim: 'cheer' }], ['baba', 'الطيارة هتقوم بعد شوية. اجروا بحرص واتبعوا اللافتات!']],
      kit: { theme: 'airport', length: 1250, speed: [9.6, 14.4], ramp: 85, carry: 'run_passport', prompt: 'وصّل لبوابة السفر قبل الطيارة', prompt2: 'كمّل! البوابة قربت', rec: { hero: 'aboody', why: '{a} بيتزحلق تحت الشرايط بسهولة' }, ally: 'nemo',
        goal: { art: 'run_goal_gate', emptyArt: 'run_goal_gate:e', who: 'baba', give: 'run_passport', icon: 'run_passport', label: 'بوابة السفر', sz: 320 }, say: { start: ['baba', 'يلا! الوقت بيجري!'], finish: ['baba', 'لحقتوا!'] },
        plan: [c(2, 1), g('runs_travel'), c(2, 2), pad, slalom, item, tunnel, c(2, 2), burst(2, 'اجري! النداء الأخير'), cp('سمعت النداء الأخير.. كمّل!', 'baba'), c(2, 3), m('runs_m_travel'), star, slalom, c(2, 3), arrow, g('runs_travel'), c(2, 3)] },
      outScene: 'saudiAirport', outState: { kind: 'hall' }, out: [['baba', 'لحقتوا بالظبط! أنا فخور بيكم.', { anim: 'cheer' }], ['H', 'الجواز والتذكرة معانا يا بابا!'], ['baba', 'يلا بينا نركب الطيارة.. {dcity} مستنياكم!']], extra: ['baba'] },
    { id: 'r13', req: 'dad', title: 'هدية {uncle1}', intro: '{uncle1} في محطة التلفريك.. والهدية معانا!', values: ['love', 'kindness', 'trust'], sticker: 's_run_kamal', wisdom: 'الهدية الصغيرة.. بتكبّر المحبة', pic: 'run_giftbag', diary: 'وصّلنا هدية ل{uncle1} عند التلفريك',
      scene: 'saudiCable', state: { prog: 0, fog: .25 }, intro_l: [['baba', '{uncle1} مستنّي عند محطة التلفريك. الضباب كتير، فمشّوا بحذر.'], ['moody', 'الهدية جاهزة. هنوصّلها وهي سليمة.'], ['aboody', 'وهنعدّي الخرفان بهدوء!']],
      kit: { theme: 'uncle1', length: 1250, speed: [9.6, 14.4], ramp: 85, carry: 'run_giftbag', prompt: 'وصّل هدية {uncle1} عند التلفريك', prompt2: 'كمّل! {uncle1} مستنّي', rec: { hero: 'toota', why: '{t} بتعدّي قطيع الخرفان بنطّتين' }, ally: 'aboody',
        goal: { art: 'run_goal_kamal', emptyArt: 'run_goal_kamal:e', who: 'uncle1', give: 'run_giftbag', icon: 'run_giftbag', label: '{uncle1}', sz: 320 }, say: { start: ['baba', 'بالراحة على الطريق'], finish: ['uncle1', 'وصلت الهدية!'] },
        plan: [c(2, 1), g('runs_abha'), c(2, 2), pad, item, slalom, c(2, 2), burst(2, 'هوا الجبل!'), star, cp('الضباب بيخف! كمّل', 'baba'), c(2, 3), m('runs_m_travel'), tunnel, c(2, 3), starS, g('runs_abha'), c(2, 3)] },
      outScene: 'run_station', outState: { car: 0 }, out: [['uncle1', 'يا سلام يا أبطال! هدية جميلة!', { anim: 'cheer' }], ['H', 'اتفضل يا عمو. كل سنة وإنت طيب.'], ['uncle1', 'أحلى هدية إنكم جيتوا لحد عندي.']], extra: ['uncle1'] },
    { id: 'r14', req: 'gm', title: 'فانوس {gm}', intro: 'الدنيا بتضلّم.. وفانوس النجمة لازم يوصل بلكونة {gmt}!', values: ['love', 'kindness', 'trust'], sticker: 's_run_lantern', wisdom: 'النور اللي بنقدّمه لغيرنا.. بيرجع لينا', pic: 'run_lantern', diary: 'وصّلنا فانوس النجمة لبلكونة {gmt} بالليل',
      scene: 'living', state: { night: true }, intro_l: [['mama', 'الشمس غابت. {gm} بتحب الفانوس. وصّلوه لبلكونتها قبل ما تنام.'], ['moody', 'ماشي! هنمسك الفانوس كويس.'], ['aboody', 'والنجوم هتنوّر لنا الطريق!']],
      kit: { theme: 'dusk', length: 1150, speed: [9.2, 13.8], ramp: 85, carry: 'run_lantern', prompt: 'وصّل الفانوس لبلكونة {gmt}', prompt2: 'كمّل! النجوم معاك', rec: { hero: 'toota', why: '{t} بتنط نطّتين وتعدّي أي عائق عالي' }, ally: 'aboody',
        goal: { art: 'run_goal_balcony', emptyArt: 'run_goal_balcony:e', who: 'nana', give: 'run_lantern', icon: 'run_lantern', label: '{gmt}', sz: 320 }, say: { start: ['mama', 'بالراحة والفانوس في إيدك'], finish: ['nana', 'يا سلام على النور!'] },
        plan: [c(2, 1), starS, g('runs_stars'), c(2, 2), pad, item, arrow, c(2, 2), star, cp('نجوم كتير فوق راسك!', 'mama'), c(2, 2), m('runs_m_night'), slalom, c(2, 2), starS, g('runs_stars'), c(2, 3)] },
      outScene: 'nn_balcony', outState: { dusk: true }, out: [['nana', 'يا حبايبي! فانوس النجمة! الدنيا نوّرت!', { anim: 'cheer' }], ['H', 'كل سنة وإنتي طيبة يا {gmt}.'], ['nana', 'النجوم في السما.. وإنتوا نجوم في قلبي.']], extra: ['nana'] },
    { id: 'r15', title: 'بطولة سباق المغامرة', intro: 'الجري كله في سباق واحد.. هتكسب الميدالية؟', values: ['persist', 'fairplay', 'roadmanners'], sticker: 's_run_medal', wisdom: 'البطل مش اللي بيكسب بس.. البطل اللي مبيستسلمش', pic: 'run_medal', diary: 'خلّصنا بطولة سباق المغامرة وأخدنا الميدالية',
      scene: 'sc_gym', state: {}, intro_l: [['F', 'يا أبطال! دي بطولة السباق الكبيرة: سوق وشط وجبل ومطار وملعب!'], ['moody', 'هنجري في كل حتة ونجاوب كل الأسئلة.', { anim: 'cheer' }], ['aboody', 'وهنعدّي أي حاجة في الطريق!']],
      kit: { theme: 'market', length: 1900, speed: [10.0, 15.2], ramp: 100, fillTier: 3, prompt: 'اكسب الميدالية.. اجري في كل الأماكن', prompt2: 'كمّل! لسه الطريق', ally: 'aboody', rec: { hero: 'toota', why: 'ده سباق طويل.. نطّتين {t} مفيدة في كل مكان' },
        goal: { art: 'run_goal_podium', icon: 'run_medal', label: 'الميدالية', sz: 340 }, say: { start: ['F', 'بالتوفيق يا أبطال!'], finish: ['moody', 'وصلنا خط النهاية!'] },
        plan: [c(2, 1), g('runs_n'), c(2, 2), pad, slalom, burst(1, 'سرعة!'), { theme: 'beach', label: 'الشاطئ' }, c(2, 2), tunnel, g('runs_sea'), c(2, 2), star, item, m('runs_m_sea'), c(2, 3), { theme: 'school', label: 'المدرسة' }, c(2, 2), slalom, pad, g('runs_school'), c(2, 3), arrow, cp('نص البطولة! كمّل', 'F'),
          { theme: 'abha', label: 'الجبل' }, c(2, 3), burst(2, 'هوا الجبل!'), star, m('runs_m_travel'), c(2, 3), tunnel, g('runs_abha'), c(2, 3), { theme: 'airport', label: 'المطار' }, c(2, 3), slalom, pad, g('runs_travel'), c(2, 3), starS, item,
          { theme: 'sport', label: 'الملعب' }, c(2, 3), burst(2, 'الجري الأخير!'), m('runs_m_sport'), c(2, 3), slalom, g('runs_sport'), c(2, 3), star] },
      outScene: 'pkPark', outState: { kind: 'plain' }, out: [['F', 'ألف مبروك! بطل البطولة!', { anim: 'cheer' }], ['H', 'ده بفضل الصبر والتدريب.. وكل أسئلة أجبناها.'], ['F', 'الميدالية دي بتاعة كل واحد ما استسلمش.']], extra: ['F'], medal: true }
  ];
  const stickers = [['s_run_school', 'المشروع والباص', 'run_project', '#e2f0ff'], ['s_run_med', 'دوا في ميعاده', 'run_medbag', '#e8fff4'], ['s_run_beach', 'صائد البالونة', 'run_balloon', '#d9f3ff'], ['s_run_pup', 'صديق الجرو', 'run_puppy', '#fff0d6'], ['s_run_kahk', 'كحك الجيران', 'run_kahk', '#fff3c4'], ['s_run_cook', 'مساعد المطبخ', 'run_basket', '#ffe9d0'],
    ['s_run_relay', 'بطل التتابع', 'run_baton', '#ffe3e0'], ['s_run_eco', 'صديق البيئة', 'run_bottle', '#e2f8d6'], ['s_run_air', 'لاحق الطيارة', 'run_passport', '#e0e8f8'], ['s_run_kamal', 'هدية {uncle1}', 'run_giftbag', '#ffe0e8'], ['s_run_lantern', 'فانوس النجمة', 'run_lantern', '#fff0b8'], ['s_run_medal', 'ميدالية البطولة', 'run_medal', '#fff0b8']];
  stickers.forEach(s => M.registerSticker({ id: s[0], title: s[1], art: s[2], bg: s[3] }));

  /* ---------- mission factory ---------- */
  function mk(d) {
    return {
      id: d.id, req: d.req, title: d.title, intro: d.intro, values: d.values, sticker: d.sticker, wisdom: d.wisdom, diary: { pic: d.pic, text: d.diary },
      async run(ctx) {
        const Hn = () => ctx.active, sp = w => (w === 'H' ? Hn() : w === 'F' ? K.who() : w), line = l => ctx.say(sp(l[0]), l[1], l[2] || {});
        const extra = (d.extra || []).map(x => (x === 'F' ? K.F : x)).filter(x => x && has(x));
        ctx.stage.setCast(['moody', 'aboody'].concat(d.scene === 'sc_gym' || d.scene === 'mk_market' ? [] : []), ['moody', 'aboody', 'toota', 'nemo']); K.UI_rebuild();
        await ctx.scene(d.scene, { state: Object.assign({}, d.state), heroes: { moody: { x: 300, y: 484, dir: 1 }, aboody: { x: 430, y: 494, dir: 1 } } });
        for (const l of d.intro_l) await line(l);
        const r = await ctx.games.runner(Object.assign({ pick: true }, d.kit));
        const H = Hn(); K.award(ctx, r);
        ctx.stage.setCast([H].concat(extra), [H]); K.UI_rebuild(); const hs = { [H]: { x: 330, y: 488, dir: 1 } }; extra.forEach((e, i) => { hs[e] = { x: 480 + i * 110, y: 484 + i * 4, dir: -1 }; });
        await ctx.scene(d.outScene || d.scene, { state: Object.assign({}, d.outState || d.state, d.door ? { open: 1, bell: false } : {}), heroes: hs });
        for (const l of d.out) { if (l[0] !== 'H' && l[0] !== 'F' && l[0] !== 'narrator' && !has(l[0]) && !['mama', 'baba', 'friend'].includes(l[0])) continue; await line(l); }
        ctx.fx.burst(480, 320, { kind: 'heart' }); ctx.react('good', 'both'); if (d.medal) { ctx.fx.confetti(); ctx.fx.sparkle(480, 300); }
        ctx.diary.add({ id: 'runs-' + d.id, pic: d.pic, text: d.diary + '. جمعنا ' + U.ar(r.coins) + ' عملة' });
        return ctx.nav.complete();
      }
    };
  }
  const W = M.getWorld('runs'); if (W) S.forEach(d => { if (!W.missions.some(x => x.id === d.id)) W.missions.push(mk(d)); });
})();
