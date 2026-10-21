/* Family Adventures - content/reactions.js : human, varied automatic replies (Egyptian colloquial).
   Moody.reactions.pick(context, {hero, speaker, tier, streak, attempt, mood, helper}) -> one line (string, may contain {m} {a} {t} {n} tokens)
   Moody.reactions.react(context, opts)  -> {text, speaker, seq:[texts to speak in order], lead}      (adds an occasional filler: "إيه ده!")
   Moody.reactions.say(context, opts)    -> react() + speaks the sequence with Moody.voice.
   Moody.reactions.all()                 -> [{text, speaker(voice id), emo}]  (used by tools/collect_voice.js so EVERY line below gets a recorded clip)

   Contexts: correct1 (first-try right) correct2 (right after mistakes) wrong1 (gentle, curious) leadhint (before a hint) hintless (no hint written)
             reveal (3rd miss) streak3 streak5 streak8 end3 end2 end1 (result ribbon) praise (hero bubble after a task) misplace needhelp nudge
             start proud (Mama/Baba/Nana) cat_math cat_lang cat_nature cat_mind cat_values (specific praise by question category)
   Pool layout: data[context][voice] = [lines]  or  {any:[..], n6:[..], n9:[..], m:[..]}
        n6 / n9 = wording for the 6-year-old / 9-year-old; m = lines that address a boy (never used for the sisters / unknown hero).
        {x} = the child who just did it ({m}/{a}/{t}/{n}), used in ~30% of picks; {h} = the helper hero (needhelp).
   Voices: narrator (the game's host), boy_big (the older boy 9), boy_small (the younger boy 6), girl_big (Toota 15), girl_small (Nemo 12), mama, baba, nana.
   Rules: every line is unique across ALL pools (a clip id is the text hash, so one text = one voice); no sarcasm, nothing scary; gender-neutral
   unless in `m`. Speaker is a character: the buddy cheers for the answerer (60%), otherwise the narrator. Anti-repeat memory per (context, voice). */
(function () {
  'use strict';
  const M = window.Moody, R = M.reactions = {};
  const D = R.data = {
    /* ------------------------------------------------------------ first-try correct */
    correct1: {
      narrator: {
        any: ['برافو!', 'صح!', 'صح كده!', 'تمام!', 'إجابة صح!', 'ممتاز!', 'يا سلام عليك!', 'أحسنت!', 'ولا غلطة!', 'من أول مرة!', 'عملتها من أول مرة!', 'دماغك شغّالة النهاردة!',
          'ركّزت وجاوبت صح!', 'إجابة تحفة!', 'ده بالظبط!', 'بالظبط كده!', 'كده عرفتها!', 'جامد أوي!', 'حلوة أوي الإجابة دي!', 'ما شاء الله!', 'تسلم إيدك!', 'مظبوط!',
          'إنت فاهمها كويس!', 'الله عليك!', 'فكّرت صح!', 'أيوه كده!', 'هو ده!', 'برافو عليك!', 'ما شاء الله، سريع!', 'ده اللي كنت مستنيه!', 'هايل!', 'كده الشطارة!',
          'برافو يا {x}!', 'صح يا {x}، عملتها!', 'يا سلام عليك يا {x}!', 'تسلم إيدك يا {x}!', 'عاش يا {x}!', 'الله عليك يا {x}!'],
        n6: ['برافو يا بطل!', 'صح أوي!', 'حلو أوي!', 'أيوه! هي دي!', 'هيييه! صح!', 'عرفتها!', 'جميل أوي!', 'تمام يا بطل!', 'إجابتك صح!', 'ممتاز يا بطل!', 'صح صح صح!', 'يا سلام يا بطل!'],
        n9: ['تفكير سليم!', 'إنت بتحلّل صح!', 'بالظبط! تفكيرك ماشي صح.', 'ولا حاجة تقف قدامك!', 'استنتاج ممتاز!', 'مظبوط، وده مش سهل!', 'عقلك سريع النهاردة!', 'ركّزت في التفاصيل، برافو!', 'أيوه كده، كمّل!', 'إجابة محترمة!', 'دي كانت صعبة وعملتها!', 'شغل مخ حلو!'],
        m: ['شاطر!', 'شاطر أوي!', 'بطل والله!', 'إنت شاطر يا بطل!']
      },
      boy_big: {
        any: ['جامد يا {x}!', 'ده أنا ما كنتش هعرفها!', 'عملتها! حلو أوي!', 'أنا قلت إنك هتعرفها!', 'صح! تعالى نكمّل!', 'إنت ذكي أوي!', 'تحفة!', 'ده كان سهل عليك!', 'ما شاء الله عليك!',
          'ولا غلطة، حلو!', 'كده نتعلم صح!', 'شغل نضيف يا {x}!', 'بصراحة عجبتني!', 'من أول مرة؟ جامد!', 'ده انت مخك سريع!', 'حلو! كمّل على كده!']
      },
      boy_small: {
        any: ['يا سلام يا {x}! إنت عبقري!', 'هييه! صح!', 'أنا كمان كنت هقول كده!', 'إنت بتعرف كل حاجة!', 'جامد أوي أوي!', 'الله! صح!', 'عملتها عملتها!', 'ده حلو أوي!', 'إنت أحسن واحد!',
          'ياااه! صح من أول مرة!', 'أنا فرحان أوي!', 'برافو برافو برافو!', 'عاش عاش يا {x}!', 'حلو أوي يا {x}!']
      },
      girl_big: { any: ['برافو، كمّل كده.', 'تفكيرك حلو.', 'ده بالظبط اللي كنت فاكراه.', 'أيوه كده، دماغك حلوة.', 'فخورة بيك!', 'ممتاز، وبدون مجهود!', 'حلو أوي يا {x}.'] },
      girl_small: { any: ['ياااه! صح!', 'أنا حبيتها دي!', 'أيوه أيوه أيوه!', 'عملتها يا بطل!', 'إنت جامد أوي!', 'يا نهار أبيض! صح!', 'بجد حلو يا {x}!'] }
    },
    /* ------------------------------------------------------------ correct after mistakes */
    correct2: {
      narrator: {
        any: ['حلو! حاولت لحد ما وصلت!', 'برافو، ما استسلمتش!', 'أهو! وصلت للإجابة.', 'كده أحسن! المحاولة بتفيد.', 'صح! والمهم إنك كمّلت.', 'حلو إنك كمّلت!', 'المحاولة التانية دايمًا أحسن!',
          'كده وصلنا!', 'ممتاز، أخدت وقتك وفكّرت.', 'الغلط بيعلّمنا! وبرافو عليك.', 'أهو عرفتها!', 'تمام، المهم إنك فهمتها.', 'ما شاء الله، صبرك حلو!', 'بالصبر عرفتها!', 'عادي، التانية بقت صح!',
          'شفت؟ وصلت في الآخر!', 'ما فيش أحلى من إنك تجرّب تاني!', 'صح كده، وإنت اتعلمت حاجة جديدة!'],
        n6: ['أيوه! صح! برافو إنك جرّبت تاني!', 'هيييه! عرفتها!', 'شفت؟ لما جرّبت تاني عرفتها!', 'صح! إنت ما زعلتش وكمّلت!'],
        n9: ['تعديلك للإجابة كان ذكي!', 'راجعت نفسك وطلعت بالصح، ده مهم!', 'التعلّم من الغلط هو أحسن تعلّم.', 'غيّرت تفكيرك ووصلت، ده شغل شاطرين!']
      },
      boy_big: { any: ['شفت؟ في التانية عرفتها!', 'ولا يهمك، المهم إنها طلعت صح!', 'كمّلت لحد ما عرفتها، برافو عليك!', 'أهو يا {x}! قلت لك هتعرفها!', 'مش مهم المرة الأولى، المهم الأخيرة!', 'حلو إنك ما زهقتش!'] },
      boy_small: { any: ['هييه! أخيرًا صح!', 'أنا كنت متأكد إنك هتعرفها!', 'جامد إنك ما زعلتش!', 'برافو يا {x}، كمّلت وعملتها!', 'ياااه، طلعت صح! أنا فرحان!', 'شفت؟ مش صعبة أوي!'] },
      girl_big: { any: ['كده تمام، الصبر حلو.', 'حلو إنك فكّرت تاني.', 'أهو، وصلنا بالراحة.'] },
      girl_small: { any: ['أيوه! عرفتها في الآخر!', 'يا سلام على الصبر!', 'برافو إنك جرّبت تاني!'] }
    },
    /* ------------------------------------------------------------ first wrong answer: gentle, curious, near-miss */
    wrong1: {
      narrator: {
        any: ['قريب! جرّب تاني', 'شبه الإجابة! جرّب مرة كمان', 'محاولة حلوة! كمّل', 'هممم، مش بالظبط. جرّب تاني.', 'ولا يهمك، فكّر تاني شوية.', 'قرّبت! كمّل.', 'تقريبًا! جرّب إجابة تانية.',
          'مفيش مشكلة، جرّب مرة كمان.', 'قريب أوي! كمّل.', 'اختيار حلو، بس مش ده. جرّب تاني.', 'أوه! مش دي. تعالى نفكّر تاني.', 'لسه بدري! جرّب تاني.', 'استنى، ركّز في السؤال تاني.',
          'قرّب من الإجابة. جرّب كمان.', 'مش مشكلة، نجرّب تاني.', 'فكّر بهدوء وجرّب تاني.', 'ولا يهمك، الغلط بيعلّمنا.', 'تقريبًا وصلت! كمّل.', 'هممم، ممكن نشوف الاختيار التاني؟', 'عادي، حاول تاني.'],
        n6: ['مش ده. جرّب واحد تاني!', 'أوبس! جرّب تاني يا بطل.', 'قريب! دوس على واحد تاني.', 'ولا يهمك! نجرّب تاني.', 'مش ده يا بطل، شوف الباقي.'],
        n9: ['مش دقيق. راجع السؤال وجرّب تاني.', 'فكّر في الشرط تاني، وإنت هتوصل.', 'قريب، بس في تفصيلة صغيرة. ركّز.', 'إجابة معقولة، بس مش دي. اقرا السؤال تاني.', 'استبعدها وفكّر في الباقي.']
      },
      boy_big: { any: ['ولا يهمك يا {x}، جرّب تاني!', 'أنا غلطت في زيها قبل كده.', 'ركّز كده وهتعرفها.', 'قريب! كمّل!', 'مش مشكلة، ده بيحصل.', 'استنى، فكّر معايا.', 'هنوصل لها، متقلقش.'] },
      boy_small: { any: ['أوووه! قريب! جرّب تاني!', 'مش مشكلة يا {x}!', 'جرّب التاني، أنا واثق فيك!', 'ما تزعلش، كمّل!', 'أوبس! لسه فيها حاجات تانية!', 'إنت لسه هتعرفها!'] },
      girl_big: { any: ['خد وقتك، مفيش استعجال.', 'جرّب تاني، إنت تقدر.', 'ولا يهمك، فكّر براحة.'] },
      girl_small: { any: ['قريب أوي! كمّل كمّل!', 'ما تقلقش، جرّب تاني!', 'أوه، قرّبت!'] }
    },
    /* ------------------------------------------------------------ before the written hint / when there is none */
    leadhint: {
      narrator: ['خد تلميح صغير:', 'تعالى نفكّر سوا:', 'ركّز معايا:', 'أديك تلميح:', 'ده هيساعدك:', 'اسمع التلميح:', 'فكّر في ده:', 'معلومة هتفيدك:', 'خلّي بالك من ده:', 'يمكن ده يساعد:'],
      boy_big: ['استنى، هقولك حاجة:', 'بص كده على ده:', 'خد التلميح ده:'],
      boy_small: ['أنا عندي فكرة:', 'تعالى أقولك حاجة:']
    },
    hintless: {
      narrator: ['فكّر بهدوء وجرّب تاني', 'خد نفس عميق وركّز في السؤال', 'اقرا السؤال تاني براحة', 'استبعد اللي مش مظبوط وجرّب', 'بص على كل اختيار كويس', 'خد وقتك، مفيش استعجال', 'سؤال حلو، فكّر فيه تاني', 'إنت تقدر، فكّر معايا'],
      boy_big: ['ركّز كده وهتلاقيها', 'فكّر خطوة خطوة'],
      boy_small: ['بص تاني براحة', 'أنا معاك، فكّر']
    },
    /* ------------------------------------------------------------ third miss: we show it together, warmly */
    reveal: {
      narrator: ['تعالوا نشوفها سوا!', 'مفيش مشكلة، هنعرفها سوا.', 'خليني أوريك الإجابة، بص كده.', 'دي الإجابة، شوفها بتلمع!', 'تعالى نتعلمها مع بعض.', 'ولا يهمك، المرة الجاية هتعرفها.', 'دوس على اللي بيلمع.',
        'الإجابة اللي بتلمع هي الصح.', 'مرات بنتعلم من الغلط، تعالى نشوف.', 'خلّينا نشوفها مع بعض.'],
      boy_big: ['تعالى أوريك، سهلة أوي!', 'ما تزعلش، هنحلها سوا.', 'بص على اللي بيلمع ده.'],
      boy_small: ['الإجابة بتلمع! دوس عليها!', 'أنا شايفها! تعالى!', 'هنعملها سوا!']
    },
    /* ------------------------------------------------------------ streaks */
    streak3: {
      narrator: ['تلات إجابات صح ورا بعض!', 'إيه ده! سلسلة نجاح!', 'إنت مولّع النهاردة!', 'ماشي زي الفل!', 'التركيز عالي!', 'تلاتة صح ورا بعض، ما شاء الله!', 'ولا غلطة لحد دلوقتي!', 'حلو أوي، كمّل كده!'],
      boy_big: ['تلاتة ورا بعض؟ ده انت نار!', 'إنت ماشي كويس أوي!', 'كمّل كمّل، ده انت مولّع!'],
      boy_small: ['هييه! تلاتة صح ورا بعض!', 'إنت مش بتغلط!', 'أنا بعدّ، تلاتة!']
    },
    streak5: {
      narrator: ['خمسة ورا بعض! خرافي!', 'إنت بطل بجد!', 'ما شاء الله، ولا غلطة!', 'خمس إجابات صح! مين يوقّفك؟', 'سلسلة طويلة! كمّل كده!', 'مستوى عالي النهاردة!'],
      boy_big: ['خمسة؟! ده انت أسطورة!', 'ده شغل أبطال حقيقي!'],
      boy_small: ['واااو! خمسة! خمسة!', 'إنت أقوى واحد في الدنيا!']
    },
    streak8: {
      narrator: ['تمانية صح ورا بعض! أسطورة!', 'مش ممكن! إنت عبقري النهاردة!', 'رقم قياسي! برافو عليك!', 'ما شاء الله، دماغك صاروخ!', 'سلسلة جامدة أوي!'],
      boy_big: ['ده مش معقول، تمانية!'],
      boy_small: ['أنا مش مصدق! تمانية!']
    },
    /* ------------------------------------------------------------ result ribbon (short!) */
    end3: { narrator: ['برافو! ممتاز!', 'عظمة عليكم!', 'أبطال بجد!', 'إنجاز جامد!', 'تحفة! تلات نجوم!', 'ما شاء الله عليكم!', 'خلّصتوها زي الأبطال!', 'يا سلام عليكم!', 'مهمة ممتازة!', 'فريق جامد!'] },
    end2: { narrator: ['شاطرين أوي!', 'حلو أوي!', 'شغل جميل!', 'نجمتين حلوين!', 'برافو عليكم!', 'قريب من الكمال!', 'مجهود حلو!', 'عملتوها!'] },
    end1: { narrator: ['أحسنتم!', 'كمّلتوا المهمة!', 'بداية حلوة!', 'المهم إنكم خلّصتوا!', 'المرة الجاية أحلى!', 'ما استسلمتوش، برافو!', 'تمام يا أبطال!', 'خطوة حلوة!'] },
    /* ------------------------------------------------------------ a hero's bubble after a task is done */
    praise: {
      boy_big: ['عملناها!', 'كده الشطارة بجد!', 'جامد أوي ده!', 'تمام كده!', 'ده أنا فرحان!', 'شغل نضيف!', 'يلا على اللي بعده!', 'حلو أوي ده!', 'يا سلام على الشغل ده!', 'برافو عليك والله يا {x}!', 'عظمة يا {x}!', 'تسلم إيدك يا {x}، جامد!', 'فريق جامد إحنا!', 'ده انت بتفهم!'],
      boy_small: ['هيييه!', 'عملناها عملناها!', 'حلو حلو حلو!', 'أنا فرحان أوي!', 'يا سلاااام!', 'جامد أوي يا {x}!', 'ده أحلى!', 'برافو علينا!', 'إحنا أبطال!', 'تعالوا نعملها تاني!'],
      girl_big: ['شغل حلو يا شباب.', 'برافو عليكم.', 'كده الترتيب!', 'ما شاء الله عليكم يا شباب!', 'تعاونكم حلو.'],
      girl_small: ['ياااي! حلو!', 'برافو برافو!', 'إيه الجمال ده!', 'أحلى فريق!', 'يا سلام عليكم يا جماعة!'],
      mama: ['يا حبايبي، فرحتوني!', 'ما شاء الله عليكم يا حبايبي!', 'ربنا يحفظكم!', 'تسلم إيديكم!'],
      baba: ['ما شاء الله يا أبطال!', 'فخور بيكم والله!', 'ده الشغل اللي بحبه!'],
      nana: ['ما شاء الله يا حبايبي!', 'ربنا يبارك فيكم!', 'كده يا أحفادي، الله يفرّحكم!']
    },
    /* ------------------------------------------------------------ puzzle kits */
    misplace: {
      boy_big: ['مش هنا.. جرّب في مكان تاني', 'هممم، مش المكان ده.', 'لأ، ده مش مكانه. شوف مكان تاني.', 'استنى، فكّر هو بيتحط فين؟', 'قريب، بس مش هنا.', 'جرّب مكان تاني يا {x}.'],
      boy_small: ['أوبس! مش هنا!', 'ممكن في مكان تاني؟', 'لأ لأ، مش هنا يا {x}!', 'جرّب هناك!', 'مش هنا، هو بيحب مكان تاني.'],
      girl_big: ['مش هنا. فكّر هو مكانه فين.', 'جرّب مكان تاني.', 'استنى، بص تاني على الأماكن.'],
      girl_small: ['أوبس، مش هنا!', 'قريب! جرّب مكان تاني!', 'هممم، دوّر على مكان تاني!']
    },
    needhelp: {   /* spoken by the hero who is active; {h} = the hero who can do it (a skill the active hero lacks) */
      boy_big: ['محتاجين {h}!', 'بدّل لـ{h} من فوق.', 'خلّي {h} يجرّب!', 'ده شغل {h}!', 'تعالى يا {h}، ده عليك!'],
      boy_small: ['محتاجين {h} هنا!', 'نادي {h}، هو يعرف!', 'ده شغل {h}، بدّل له!', 'خلّي {h} يساعدنا!'],
      girl_big: ['ده محتاج {h}، بدّل له.', 'خلّينا نجيب {h} يساعد.', 'مش هينفع أنا، نادي {h}.'],
      girl_small: ['أنا مش هعرف، نادي {h}!', 'ده من شغل {h}!', 'تعالى يا {h}، محتاجينك!']
    },
    needstrong: {   /* heavy things: the active hero is not strong enough */
      boy_small: ['ده تقيل أوي! محتاجين {h}', 'ده أكبر مني! نادي {h}!', 'مش قادر أشيله! عايزين {h}.', 'محتاج {h} يساعدني!', 'ده فوق مني! بدّل لـ{h}.'],
      girl_small: ['ده تقيل عليّ! نادي {h}!', 'محتاجين {h} القوي!'],
      girl_big: ['ده تقيل، محتاجين {h}.', 'نادي {h}، هو أقوى مني.'],
      boy_big: ['ده تقيل حتى عليّ! محتاجين {h}.']
    },
    nudge: {   /* idle for ~25 s */
      boy_big: ['بص حواليك كويس، في حاجة مستنياك.', 'خد وقتك، ومفيش استعجال.', 'لو عايز تسمع التعليمات، دوس على الزرار الأخضر.', 'ركّز في الصورة كويس.', 'فكّر معايا، إحنا هنعملها.', 'في حاجة بتلمع؟ دوّر عليها.'],
      boy_small: ['أنا مستني، خد وقتك.', 'إحنا هنعملها سوا.', 'طب بص هنا كده.', 'أنا شايف حاجة! دوّر معايا.', 'هو الزرار الأخضر بيقول التعليمات تاني!'],
      girl_big: ['اهدا وفكّر، مفيش مشكلة.', 'لو محتاجين مساعدة، اضغطوا على الزرار الأخضر.', 'ركّزوا في التفاصيل.'],
      girl_small: ['أنا معاكم! جرّبوا حاجة!', 'هو في حاجة بتلمع هناك؟', 'ما تقلقوش، هنلاقيها!']
    },
    start: {
      boy_big: ['يلا بينا!', 'جاهز! نبدأ؟', 'المهمة دي هتكون حلوة!', 'تعالى نشوف هنعمل إيه.', 'أنا حاسس إننا هنعملها!'],
      boy_small: ['يلا يلا يلا!', 'أنا متحمّس أوي!', 'يلا نلعب!', 'هنعملها سوا!'],
      girl_big: ['يلا نبدأ، واحدة واحدة.', 'تعالوا نركّز.'],
      girl_small: ['أنا جاهزة!', 'يلا نبدأ المغامرة!']
    },
    /* ------------------------------------------------------------ parents / grandma: pride + warm encouragement */
    proud: {
      mama: ['فرحتوني أوي يا حبايبي!', 'ما شاء الله عليكم، ربنا يحفظكم.', 'أنا فخورة بيكم جدًا!', 'تسلم إيديكم يا أبطال.', 'ده اللي كنت متوقعاه منكم!', 'يا قلبي عليكم، شاطرين!', 'حلو أوي يا حبايبي، كمّلوا كده.'],
      baba: ['بابا فخور بيكم أوي!', 'الله يبارك فيكم يا أبطالي.', 'بجد عملتوها زي الكبار!', 'ده اللي بحبه فيكم، تعبتوا وجتهدتوا.', 'ما شاء الله، هتبقوا ناس كبار!', 'أحلى أولاد في الدنيا!'],
      nana: ['ما شاء الله يا حبايبي، ربنا يخليكم.', 'قلبي فرحان بيكم أوي!', 'الله يفتح عليكم يا ولاد.', 'تعالوا في حضني، شاطرين!', 'حلو كده يا أحفادي، ربنا يبارككم.']
    },
    /* ------------------------------------------------------------ specific praise: mentions what they were good at */
    cat_math: { narrator: ['حسبتها صح!', 'الأرقام معاك النهاردة!', 'حساب سريع وصح!', 'حسابك مظبوط!', 'عدّيتها صح!', 'الأرقام بتحبك!'] },
    cat_lang: { narrator: ['عرفت الكلمة صح!', 'لغتك حلوة!', 'فكّيت اللغز بسرعة!', 'الحروف بتحبك!', 'كلمة في محلها!', 'الكلام بيحبك!'] },
    cat_nature: { narrator: ['معلوماتك عن الدنيا حلوة!', 'إنت عارف الطبيعة كويس!', 'عالم صغير شاطر!', 'معلومة مظبوطة عن الدنيا!', 'عينك على التفاصيل!'] },
    cat_mind: { narrator: ['عينك حلوة في التفاصيل!', 'لقيت النمط!', 'شفت السر!', 'منطقك مظبوط!', 'ترتيب أفكارك حلو!', 'ملاحظة ذكية!'] },
    cat_values: { narrator: ['ده اللي بيعمله الشاطرين!', 'تصرّف حلو!', 'معلومة حلوة في دماغك!', 'فاهم الصح كويس!', 'ده أدب وذوق!'] },
    /* ------------------------------------------------------------ fillers (occasional interjection before a line) + thinking sounds */
    filler: {
      narrator: ['إيه ده!', 'يا سلام يا سلام!', 'ماشي كده!', 'الله!', 'ياااه!'],
      boy_big: ['إيه ده يا جدعان!', 'الله عليه!', 'ماشي كده.', 'جامد!', 'ياه!'],
      boy_small: ['واااو!', 'يا خبر!', 'هيييه!', 'ياه ياه!', 'جامد جامد!'],
      girl_big: ['أوه!', 'ما شاء الله، حلو!', 'حلو!'],
      girl_small: ['ياااي!', 'أيوه!', 'إيه ده يا جماعة!']
    },
    think: {
      narrator: ['هممم.', 'آه.', 'استنى.'],
      boy_big: ['همم.', 'أها.', 'ممم.'],
      boy_small: ['أوه.', 'أممم.', 'هاه.'],
      girl_big: ['همم، لحظة.'], girl_small: ['أوه، لأ.']
    }
  };


  /* ---------- more lines (merged into the pools above) ---------- */
  const MORE = {
    correct1: {
      narrator: {
        any: ['هي دي الإجابة الصح!', 'اختيار موفّق!', 'شكلك عارفها كويس!', 'كده إنت ماشي صح!', 'وقعت على الصح!', 'تفكير حلو!', 'حلو الاختيار ده!', 'أحلى إجابة!', 'صح عليك!', 'مخك سريع!', 'ركّزت وجبتها!', 'بالظبط، زي ما توقّعت!'],
        n6: ['عرفتها لوحدك!', 'هيييه! جبتها صح!', 'برافو يا بطل، حلو أوي!', 'إنت قدّها يا بطل!'],
        n9: ['تحليل مظبوط!', 'ربطت المعلومات صح!', 'ده ذكاء بجد!', 'خطوة بخطوة ووصلت!', 'إجابة بتدل على تركيز عالي!']
      },
      boy_big: { any: ['جامد! إنت ركّزت!', 'ده اللي كنت هقوله!', 'أنا كنت هقول نفس الإجابة!', 'كمّل كده والله!', 'حلو أوي، أنا استفدت!', 'ماشي كده، دماغك حلوة!'] },
      boy_small: { any: ['أنا قلت كده بالظبط!', 'صح صح صح صح!', 'إنت بتفهم في كل حاجة!', 'جامد جامد جامد!', 'ده انت أحسن حاجة!'] },
      girl_big: { any: ['كمّل كده يا {x}، أنا معاك.', 'خطوة حلوة أوي.', 'تحسّن واضح، برافو.'] },
      girl_small: { any: ['صح صح! أنا كنت متأكدة!', 'ياي ياي! حلو أوي!', 'أحلى إجابة في الدنيا!'] }
    },
    correct2: {
      narrator: { any: ['مش مهم بدأت إزاي، المهم وصلت!', 'تعبت شوية وعرفتها، برافو!', 'كل مرة بتقرّب أكتر، وأهو وصلت!', 'عرفتها بعد تفكير، وده أحلى!'] },
      boy_big: { any: ['أهو وصلت! وده المهم.', 'كل غلطة بتقرّبنا للصح.'] },
      boy_small: { any: ['أنا فرحان إنك ما استسلمتش!', 'شفت؟ كنت قريب من الأول!'] }
    },
    wrong1: {
      narrator: {
        any: ['ولا يهمك، كل واحد بيغلط.', 'مش ده، بس إنت قريب.', 'ياه، كان قريب! جرّب كمان.', 'فكّر في اللي بنسأل عليه تاني.', 'خد نفس وجرّب من جديد.', 'في احتمال تاني أحسن.', 'حاول تاني، إنت تقدر.', 'اتأكد من الاختيار وجرّب تاني.'],
        n6: ['يلا جرّب واحد غيره!', 'مش مشكلة يا بطل، جرّب!', 'مش ده! بس لسه في فرصة.'],
        n9: ['راجع المعطيات تاني بهدوء.', 'اتحقق من السؤال وجرّب تاني.', 'قرّبت، بس محتاج تدقّق أكتر.']
      },
      boy_big: { any: ['خلّينا نشوف السؤال تاني سوا.', 'ولا يهمك، ده كان صعب شوية.', 'أنا بقول تقرا الاختيارات تاني.'] },
      boy_small: { any: ['أوه لأ! بس جرّب غيره!', 'ما تزعلش، هتعرفها!'] }
    },
    nudge: {
      boy_big: ['مفيش استعجال، فكّر براحتك.', 'دوس على زرار السماعة لو عايز تسمع تاني.', 'يمكن لو بصيت بصة تانية تلاقيها.', 'أنا واثق إنك هتلاقيها.'],
      boy_small: ['ممكن نبص تحت؟ يمكن فيه حاجة!', 'ما تقلقش، هنلاقيها سوا.', 'أنا بدوّر معاك.'],
      girl_big: ['خدوا وقتكم، كل حاجة هتبقى كويسة.'], girl_small: ['أنا شايفة حاجة بتتحرك! بصّوا!']
    },
    praise: {
      boy_big: ['مش بطّال خالص!', 'كده نبقى فريق!', 'تعاون حلو!'],
      boy_small: ['ده كان ممتع!', 'أنا بحب نشتغل سوا!', 'يلا يلا، عظمة!'],
      girl_big: ['أنا فخورة بيكم!', 'شغل نضيف ومرتب.'], girl_small: ['ياي ياي ياي!', 'أنا فرحانة بيكم!']
    },
    reveal: { narrator: ['مفيش حد بيعرف كل حاجة من أول مرة.', 'خلّي عينك على اللي بيلمع.'] },
    hintless: { narrator: ['اقرا الاختيارات كلها قبل ما تختار', 'شوف الصورة كويس يمكن تساعدك', 'فكّر في اللي تعرفه عن الموضوع ده', 'متقلقش، خد وقتك'] }
  };
  Object.keys(MORE).forEach(c => Object.keys(MORE[c]).forEach(v => {
    const src = MORE[c][v], dst = (D[c] = D[c] || {})[v];
    if (!dst) { D[c][v] = src; return; }
    if (Array.isArray(dst)) { Array.prototype.push.apply(dst, Array.isArray(src) ? src : src.any || []); return; }
    ['any', 'n6', 'n9', 'm'].forEach(k => { if (src[k]) dst[k] = (dst[k] || []).concat(src[k]); });
  }));

  /* ---------- helpers ---------- */
  const EMO = { correct1: 'praise', correct2: 'warm', wrong1: 'gentle', leadhint: 'tip', hintless: 'tip', reveal: 'gentle', streak3: 'excited', streak5: 'excited', streak8: 'excited', end3: 'praise', end2: 'praise', end1: 'warm',
    praise: 'praise', misplace: 'gentle', needhelp: 'neutral', needstrong: 'neutral', nudge: 'gentle', start: 'excited', proud: 'warm', cat_math: 'praise', cat_lang: 'praise', cat_nature: 'praise', cat_mind: 'praise', cat_values: 'praise', filler: 'excl', think: 'calm' };
  const V2ID = { boy_big: 'moody', boy_small: 'aboody', girl_big: 'toota', girl_small: 'nemo', narrator: 'narrator', mama: 'mama', baba: 'baba', nana: 'nana' };
  const ID2V = { moody: 'boy_big', aboody: 'boy_small', toota: 'girl_big', nemo: 'girl_small', narrator: 'narrator', mama: 'mama', baba: 'baba', nana: 'nana', friend: 'boy_big', cz1: 'boy_big', cz4: 'boy_big', cz5: 'boy_big', cz3: 'boy_small', cz2: 'girl_small' };
  const TOK = { moody: '{m}', aboody: '{a}', toota: '{t}', nemo: '{n}' };
  const BOYS = { moody: 1, aboody: 1 };
  const CAT = { math: 'cat_math', counting: 'cat_math', time_money: 'cat_math', patterns: 'cat_mind', logic: 'cat_mind', shapes_colors: 'cat_mind', arabic: 'cat_lang', english: 'cat_lang', riddles: 'cat_lang', analogies: 'cat_lang',
    science: 'cat_nature', animals: 'cat_nature', geography: 'cat_nature', health: 'cat_nature', ethics: 'cat_values', history: 'cat_values', general: 'cat_values' };
  R.voiceOf = sp => ID2V[sp] || (D.correct1[sp] ? sp : 'narrator');
  R.idOf = v => V2ID[v] || 'narrator';
  R.maps = { V2ID, ID2V, BOYS };   // engine/family.js re-points the duo's voice class / pools when a girl plays a boy slot

  const mem = {};                       // anti-repeat memory: key -> recent indices
  const firsts = [];                    // first words of the last few lines (avoid "برافو ... برافو ... برافو")
  let streak = 0, lastAt = 0;
  const fw = t => String(t).replace(/[^ء-ي ]/g, ' ').trim().split(/\s+/)[0];
  const rnd = () => Math.random();

  function candidates(ctx, voice, o) {
    const ctxPool = D[ctx]; if (!ctxPool) return [];
    let p = ctxPool[voice];
    if (!p) { const alt = voice === 'boy_small' || voice === 'boy_big' ? ['boy_big', 'boy_small'] : voice === 'girl_big' || voice === 'girl_small' ? ['girl_big', 'girl_small'] : []; for (const a of alt.concat(['narrator'])) if (ctxPool[a]) { voice = a; p = ctxPool[a]; break; } }
    if (!p) return [];
    let list;
    if (Array.isArray(p)) list = p.slice();
    else {
      list = (p.any || []).slice(); const t6 = o.tier === 6 || o.hero === 'aboody' && !o.tier, t9 = o.tier === 9 || o.hero === 'moody' && !o.tier;
      if (o.tier === 6 || t6) list = list.concat(p.n6 || []); else if (o.tier === 9 || t9) list = list.concat(p.n9 || []); else list = list.concat(p.n6 || [], p.n9 || []);
      if (o.hero ? BOYS[o.hero] : false) list = list.concat(p.m || []);
    }
    return list.map(t => ({ t, voice }));
  }
  function fillTokens(t, o) {
    const x = o.hero && TOK[o.hero], h = o.helper && TOK[o.helper];
    if (t.indexOf('{x}') >= 0) { if (!x) return null; t = t.split('{x}').join(x); }
    if (t.indexOf('{h}') >= 0) { if (!h) return null; t = t.split('{h}').join(h); }
    return t;
  }
  /* pick ONE line for (context, speaker) with anti-repeat memory. Returns a string, or '' if the context is unknown. */
  R.pick = function (ctx, o) {
    o = o || {}; const now = Date.now(); if (now - lastAt > 90000) streak = 0; lastAt = now;
    if (ctx === 'correct1' || ctx === 'correct') {
      streak = o.streak != null ? o.streak : streak + 1; ctx = 'correct1';
      if (streak === 3 || streak === 5 || streak === 8) ctx = 'streak' + streak;
      else if (rnd() < .22 && o.cat && CAT[o.cat] && R.voiceOf(o.speaker || 'narrator') === 'narrator') ctx = CAT[o.cat];       // sometimes: praise that names what they were good at
    } else if (ctx === 'correct2') { streak = 0; }
    else if (ctx === 'wrong1' || ctx === 'wrong2') streak = 0;
    const voice = R.voiceOf(o.speaker || 'narrator');
    let c = candidates(ctx, voice, o); if (!c.length) return '';
    const named = c.filter(e => e.t.indexOf('{x}') >= 0 || e.t.indexOf('{h}') >= 0), plain = c.filter(e => named.indexOf(e) < 0);
    const wantNamed = ctx === 'needhelp' || ctx === 'needstrong' || (named.length && o.hero && TOK[o.hero] && rnd() < .3);
    let pool = wantNamed && named.length ? named : (plain.length ? plain : named);
    if (o.maxLen) { const f = pool.filter(e => e.t.length <= o.maxLen); if (f.length) pool = f; }
    if (o.mood === 'calm') { const f = pool.filter(e => !/!/.test(e.t)); if (f.length) pool = f; }
    else if (o.mood === 'high' || o.mood === 'excited') { const f = pool.filter(e => /!/.test(e.t)); if (f.length) pool = f; }
    const key = ctx + '|' + voice, recent = mem[key] || (mem[key] = []), keep = Math.min(Math.max(2, Math.floor(pool.length * .6)), pool.length - 1);
    let opts = pool.filter(e => recent.indexOf(e.t) < 0);
    const f2 = opts.filter(e => firsts.slice(-2).indexOf(fw(e.t)) < 0); if (f2.length) opts = f2;
    if (!opts.length) { opts = pool; recent.length = 0; }
    for (let tries = 0; tries < 6; tries++) {
      const e = opts[Math.floor(rnd() * opts.length)], t = fillTokens(e.t, o); if (t == null) continue;
      recent.push(e.t); while (recent.length > keep) recent.shift(); firsts.push(fw(e.t)); if (firsts.length > 4) firsts.shift(); return t;
    }
    return '';
  };
  /* react(): the line + who says it + the clips to play. Adds an occasional filler ("إيه ده!") and, for the quiz, lets the buddy cheer (60%). */
  R.react = function (ctx, o) {
    o = Object.assign({}, o); let sp = o.speaker;
    if (!sp) { const b = o.hero === 'moody' ? 'aboody' : o.hero === 'aboody' ? 'moody' : null; sp = b && o.buddy !== false && rnd() < .6 ? b : 'narrator'; }
    o.speaker = sp; const text = R.pick(ctx, o); if (!text) return null;
    const seq = [text], voice = R.voiceOf(sp), id = R.idOf(voice);
    const fl = ctx === 'correct1' || ctx === 'correct2' || /^streak/.test(ctx) ? 'filler' : ctx === 'wrong1' ? 'think' : null;
    if (fl && rnd() < (fl === 'filler' ? .17 : .12) && text.length < 40) { const f = R.pick(fl, { speaker: sp }); if (f) seq.unshift(f); }
    return { text, speaker: id === 'narrator' ? 'narrator' : id, voice, seq, filler: seq.length > 1 ? seq[0] : null };
  };
  R.say = function (ctx, o) {
    const r = R.react(ctx, o); if (!r) return null;
    try { if (M.voice) (r.seq.length > 1 ? M.voice.speakSeq(r.seq, { speaker: r.speaker, soft: !!(o && o.soft) }) : M.voice.speak(r.text, { speaker: r.speaker, soft: !!(o && o.soft) })); } catch (e) { }
    return r;
  };
  R.buddy = id => ({ moody: 'aboody', aboody: 'moody', toota: 'nemo', nemo: 'toota' })[id] || null;
  R.resetStreak = () => { streak = 0; };
  R.streak = () => streak;

  /* every (text, voice) for the voice generator / collector */
  R.all = function () {
    const out = [];
    Object.keys(D).forEach(ctx => Object.keys(D[ctx]).forEach(v => {
      const p = D[ctx][v], lists = Array.isArray(p) ? [p] : [p.any || [], p.n6 || [], p.n9 || [], p.m || []];
      lists.forEach(l => l.forEach(t => {
        const variants = [];
        if (t.indexOf('{x}') >= 0 || t.indexOf('{h}') >= 0) { ['{m}', '{a}', '{t}', '{n}'].forEach(k => variants.push(t.split('{x}').join(k).split('{h}').join(k))); }
        else variants.push(t);
        variants.forEach(s => out.push({ text: s, speaker: v, emo: EMO[ctx] || 'neutral', ctx }));
      }));
    }));
    return out;
  };
  /* dev check: duplicate texts across voices (one text = one clip = one voice) */
  R.audit = function () {
    const seen = {}, dup = []; R.all().forEach(e => { const k = M.voice ? M.voice.normalize(e.text) : e.text; if (seen[k] && seen[k] !== e.speaker) dup.push([e.text, seen[k], e.speaker]); seen[k] = seen[k] || e.speaker; }); return dup;
  };

  /* Baba's daily call: richer praise / goodbyes (call.js picks from these arrays) */
  if (M.babaPraise) M.babaPraise.push.apply(M.babaPraise, D.proud.baba.concat(['شاطرين يا أبطال! كمّلوا كده.', 'بابا بيفتخر بيكم قدّام الناس كلها!']));
  if (M.babaBye) M.babaBye.push('يلا يا حبايبي، هسيبكم دلوقتي. ما تنسوش تساعدوا ماما!', 'ربنا يحفظكم ليّ. نتكلّم بكره إن شاء الله!', 'مع السلامة يا أبطالي. وحشتوني، وهشوفكم قريب!');
})();
