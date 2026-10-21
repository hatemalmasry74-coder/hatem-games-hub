/* Family Adventures - content/meta.js : labels for the parent panel (values practised + question categories).
   Add your own with Moody.registerValue(tag,{label,desc}) / Moody.registerSkill(tag,{label,desc}). */
(function () {
  'use strict';
  const M = window.Moody, V = M.registerValue, S = M.registerSkill;
  V('help', { label: 'مساعدة الأهل في البيت', desc: 'مشاركة ماما في شغل البيت' });
  V('tidy', { label: 'الترتيب والنظافة', desc: 'ترتيب الأوضة وتنظيم الحاجات' });
  V('teeth', { label: 'نظافة الأسنان والنفس', desc: 'تفريش الأسنان بالخطوات الصح' });
  V('healthy', { label: 'الأكل الصحي', desc: 'اختيار فطار مفيد' });
  V('bismillah', { label: 'بسم الله والحمد لله', desc: 'التسمية قبل الأكل والحمد بعده' });
  V('share', { label: 'المشاركة والكرم', desc: 'يشاركوا ألعابهم مع صحابهم' });
  V('honesty', { label: 'الصدق والأمانة', desc: 'قول الحقيقة' });
  V('water', { label: 'ترشيد المية', desc: 'قفل الحنفية وعدم الإسراف' });
  V('electric', { label: 'ترشيد الكهرباء', desc: 'إطفاء اللمبة والأجهزة' });
  V('teamwork', { label: 'التعاون بين الأخوات', desc: 'كل واحد بقدرته: القوي والصغير السريع' });
  V('screen', { label: 'تنظيم وقت الشاشة', desc: 'الواجب الأول ووقت محدد للتابلت' });
  V('permission', { label: 'الاستئذان', desc: 'نسأل ماما قبل ما ناخد حاجة' });
  V('money', { label: 'التوفير', desc: 'حط جزء من فلوسك في الحصّالة' });
  V('sleep', { label: 'النوم بدري', desc: 'روتين النوم الهادي' });
  V('thanks', { label: 'الشكر والامتنان', desc: 'نشكر اللي حوالينا وربنا' });
  V('study', { label: 'المذاكرة والواجب', desc: 'نخلّص الواجب في وقته' });
  V('kindness', { label: 'الرفق والكلمة الطيبة', desc: 'معاملة طيبة مع الكل' });
  S('counting', { label: 'العدّ', desc: 'أرقام لحد ٢٠' }); S('math', { label: 'الحساب', desc: 'جمع وطرح وضرب' });
  S('shapes_colors', { label: 'الألوان والأشكال', desc: 'تمييز الأشكال والألوان' }); S('patterns', { label: 'الأنماط والتسلسل', desc: 'إكمال النمط' });
  S('logic', { label: 'المنطق', desc: 'تفكير وترتيب أفكار' }); S('analogies', { label: 'التشبيهات', desc: 'علاقات بين الكلمات' });
  S('arabic', { label: 'اللغة العربية', desc: 'حروف وكلمات وإملاء' }); S('riddles', { label: 'الألغاز', desc: 'ألغاز بسيطة' });
  S('english', { label: 'إنجليزي بسيط', desc: 'حروف وكلمات' }); S('science', { label: 'علوم وطبيعة', desc: 'معلومات عن الكون' });
  S('animals', { label: 'الحيوانات والطبيعة', desc: 'أصوات وأماكن عيش' }); S('geography', { label: 'الجغرافيا', desc: 'مصر والعالم العربي' });
  S('history', { label: 'التاريخ المصري', desc: 'الفراعنة والمعالم' }); S('ethics', { label: 'أخلاق وقيم', desc: 'سلوكيات وأدب' });
  S('health', { label: 'الصحة والسلامة', desc: 'عادات صحية وأمان الطريق' }); S('time_money', { label: 'الوقت والفلوس', desc: 'ساعة وعملة' });
  S('general', { label: 'ثقافة عامة', desc: 'معلومات متنوعة' }); S('memory', { label: 'الذاكرة', desc: 'ألعاب الذاكرة' });
})();
