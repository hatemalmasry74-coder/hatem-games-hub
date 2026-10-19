/* Moody & Aboody - content/baba_calls.js : the daily "بابا بيتصل" challenge pool (>= 30). Editable by anyone.
   Entry: { id, type, intro, ... , wisdom, praise }
   type 'habit'  : { task, btn?, sub? }                  Baba asks for a good habit, the kids tap when done
   type 'quiz'   : { q:{id,category,q,choices,answer,hint}, who:'moody'|'aboody' }
   type 'pair'   : { cat:[...] }                         two-part puzzle: tier 6 for Aboody, tier 9 for Moody
   type 'count'  : { n, art, say, noun }                 tap n floating things, then say how many
   type 'memory' : { pairs:[art,...] }
   type 'order'  : { steps:[{art,label}] }               put steps in order
   All strings are voiced (voice id 'baba' for Baba's lines).  Tokens {m} {a} {me} are the children's names. */
(function () {
  'use strict';
  const M = window.Moody;
  M.babaGreetings = [
    'السلام عليكم يا {m} ويا {a}! وحشتوني أوي!', 'أهلاً بأحلى ولدين في الدنيا! عاملين إيه؟', 'صباح الخير يا أبطال! بابا بيكلمكم من السعودية.',
    'مساء الخير يا حبايبي! كنت مستني أشوفكم.', 'يا أهلاً يا أهلاً! أخبار البيت إيه؟', 'السلام عليكم يا شباب! إزاي ماما وتوتا ونيمو؟'
  ];
  M.babaHowWasDay = ['يومكم كان عامل إزاي النهاردة؟', 'احكوا لبابا: يومكم كان حلو؟', 'عملتوا إيه النهاردة يا حبايبي؟'];
  M.babaDayReplies = {
    good: ['الحمد لله! ربنا يديكم الصحة ويفرّح قلوبكم.', 'ما شاء الله! فرحتوني أوي.'], ok: ['الحمد لله على كل حال. بكره يبقى أحلى إن شاء الله.'], tired: ['معلش يا حبايبي، ارتاحوا شوية وبكره أحسن إن شاء الله.']
  };
  M.babaPraise = ['برافو عليكم! بابا فخور بيكم أوي.', 'شاطرين! ده اللي كنت مستنيه منكم.', 'ما شاء الله عليكم! أنتم أبطال بجد.', 'أحسنتم يا شباب! بابا بيحبكم أوي.'];
  M.babaBye = ['مع السلامة يا حبايبي، سلّموا لي على ماما. أشوفكم بكره إن شاء الله!', 'في أمان الله يا أبطال. بابا بيحبكم أوي!'];

  const H = (id, task, wisdom, o) => Object.assign({ id: 'bc_' + id, type: 'habit', intro: 'عندي لكم تحدّي صغير النهاردة.', task, wisdom: wisdom || 'العادات الحلوة بتبني ناس حلوين' }, o || {});
  const Q = (id, who, q, choices, hint, wisdom) => ({ id: 'bc_' + id, type: 'quiz', who, intro: 'عندي لكم لغز صغير النهاردة.', q: { id: 'bcq_' + id, category: who === 'aboody' ? 'counting' : 'riddles', tier: who === 'aboody' ? 6 : 9, q, choices, answer: 0, hint }, wisdom: wisdom || 'العقل زينة، والتفكير متعة' });
  const P = M.babaCalls = [
    /* good habits */
    H('bed', 'رتّبوا سريركم وشدّوا البطانية.', 'ترتيب السرير بداية يوم حلو'), H('thanks', 'قولوا لماما: شكراً يا ماما على كل حاجة.', 'كلمة شكراً بتفرّح القلب', { sub: 'اضغطوا لما تقولوها' }),
    H('water', 'اشربوا كوباية ماية دلوقتي.', 'الماية بتخلّي جسمك نشيط'), H('teeth', 'افرشوا أسنانكم كويس.', 'أسنان نضيفة وابتسامة حلوة'), H('help', 'ساعدوا ماما في حاجة صغيرة في البيت.', 'اللي بيساعد بيتحب'),
    H('wash', 'اغسلوا إيديكم بالصابون كويس.', 'النضافة من الإيمان'), H('toys', 'رتّبوا ألعابكم في مكانها.', 'كل حاجة في مكانها أحلى'), H('light', 'اطفوا النور في أي أوضة مفيهاش حد.', 'نوفّر الكهربا ونحافظ على بيتنا'),
    H('nana', 'كلّموا ننا زوزا وقولوا لها السلام عليكم.', 'الجدّة كنز في البيت'), H('read', 'اقروا صفحتين من قصة حلوة.', 'القراءة بتفتح عقلك'), H('kind', 'اعملوا حاجة حلوة لأخوكم أو أختكم.', 'اللي بيحب بيتحب'),
    H('share', 'شاركوا لعبة أو حلوى مع حد.', 'المشاركة بتكبّر الفرحة'), H('sport', 'اعملوا خمس دقايق رياضة وحركة.', 'الجسم القوي بيحب الحركة'), H('praise', 'قولوا الحمد لله على نعمة بتحبوها.', 'الحمد لله بتزيد النعمة'),
    H('sleep', 'نيّموا نفسكم بدري النهاردة.', 'النوم بدري بيخلّيك نشيط'), H('bism', 'قبل ما تاكلوا النهاردة قولوا بسم الله بصوت عالي.', 'بسم الله بتبارك في الأكل'),
    H('polite', 'قولوا لو سمحت وشكراً لكل حد النهاردة.', 'الأدب بيفتح كل الأبواب'),
    /* puzzles */
    Q('q1', 'aboody', 'عندك ٣ بلالين وصاحبك إداك ٢. كام بلونة معاك؟', ['٥', '٤', '٦'], '٣ + ٢'), Q('q2', 'moody', 'أنا عدد لو زوّدت عليّ ٧ بقيت ١٥. أنا مين؟', ['٨', '٧', '٩'], '١٥ − ٧'),
    Q('q3', 'moody', 'كام ساعة بين الساعة ٩ بالليل و٦ الصبح؟', ['٩', '٨', '١٠'], 'من ٩ لـ ١٢ وبعدين لـ ٦'), Q('q4', 'aboody', 'مين بيطير: القطة ولا العصفور؟', ['العصفور', 'القطة'], 'له جناحات'),
    Q('q5', 'moody', 'ليه ٣٠ يوم في الشهر وبعده شهر رمضان بيجي. إيه الشهر اللي قبل رمضان؟', ['شعبان', 'محرم', 'رجب'], 'اسمه يبدأ بحرف الشين'), Q('q6', 'aboody', 'إيه لون الشمس في الرسم؟', ['أصفر', 'أزرق', 'أخضر'], 'زي الموز'),
    { id: 'bc_pair1', type: 'pair', intro: 'عندي لغز لكل واحد فيكم.', cat: ['math', 'logic', 'patterns'], wisdom: 'كل واحد فينا بيفكّر بطريقته' }, { id: 'bc_pair2', type: 'pair', intro: 'يلا نشغّل دماغنا سوا.', cat: ['arabic', 'riddles', 'general'], wisdom: 'الكلام الحلو بيبني العقل' },
    { id: 'bc_pair3', type: 'pair', intro: 'لغز لكل واحد فيكم النهاردة.', cat: ['animals', 'science', 'health'], wisdom: 'الفضول بيعلّمنا حاجات جديدة' },
    /* counting games */
    { id: 'bc_c1', type: 'count', n: 5, art: 'star', noun: 'نجمة', intro: 'في نجوم بتلمع في الشاشة. عدّوها!', wisdom: 'العدّ لعبة حلوة' }, { id: 'bc_c2', type: 'count', n: 4, art: 'apple', noun: 'تفاحة', intro: 'اجمعوا التفاح اللي على الشاشة!', wisdom: 'الفاكهة بتخلّينا أقوياء' },
    { id: 'bc_c3', type: 'count', n: 6, art: 'ball', noun: 'كورة', intro: 'الكور الملوّنة بتتحرك. اضغطوا عليها!', wisdom: 'الانتباه بيخلّينا شاطرين' },
    /* memory + ordering */
    { id: 'bc_m1', type: 'memory', pairs: ['apple', 'car', 'star'], intro: 'نلعب لعبة الذاكرة؟', wisdom: 'التركيز بيقوّي الذاكرة' }, { id: 'bc_m2', type: 'memory', pairs: ['cat', 'teddy', 'ball', 'cup'], intro: 'لعبة ذاكرة أصعب شوية!', wisdom: 'الذاكرة زي العضلة، كل ما تتمرّن تقوى' },
    { id: 'bc_o1', type: 'order', steps: [{ art: 'water', label: 'نبلّل إيدينا' }, { art: 'soap', label: 'نحط الصابون' }, { art: 'cup', label: 'نشطف' }, { art: 'towel', label: 'ننشف' }], intro: 'رتّبوا خطوات غسل الإيدين.', wisdom: 'النضافة صحة' },
    { id: 'bc_o2', type: 'order', steps: [{ art: 'bed', label: 'نصحى' }, { art: 'toothbrush', label: 'نفرش أسناننا' }, { art: 'bread', label: 'نفطر' }, { art: 'bag', label: 'نروح المدرسة' }], intro: 'رتّبوا يومكم من الصبح.', wisdom: 'الترتيب بيريّح البال' },
    { id: 'bc_o3', type: 'order', steps: [{ art: 'clock', label: 'ننضّف' }, { art: 'pajamas', label: 'نلبس البيجامة' }, { art: 'book', label: 'نسمع حدوتة' }, { art: 'moon', label: 'ننام' }], intro: 'رتّبوا روتين النوم.', wisdom: 'روتين النوم بيخلّي الليل هادي' }
  ];
})();
