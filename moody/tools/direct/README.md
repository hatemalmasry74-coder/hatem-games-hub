# النسخة المباشرة «مغامرات العيلة» (بيع بالكود، بدون متجر) — دليل المالك
# Direct edition "مغامرات العيلة" (sale by activation code, no store) — owner guide

نفس لعبة النسخة العامة (معالج العيلة، أفاتار كرتوني فقط، محتوى عام)، لكن: **أول مهمة في كل مغامرة مجانية، والباقي يفتح بكود تفعيل** ترسله أنت للمشتري. بدون Google Play وبدون أي رابط للهب.
Same generic game (family wizard, cartoon avatars only). **The first mission of every adventure is free; the rest unlocks with an activation code you send to the buyer.** No store, no link to the hub.

## 0) ما الذي تملأه (مكان واحد) / What you fill in (one place)
الملف `moody/tools/direct/direct.config.js`:

| المفتاح | الحالة | ملاحظة |
|---|---|---|
| `CONTACT_URL` | مضبوط: `https://wa.me/201206354853` | رابط «اطلب كودك». الرسالة الجاهزة تُضاف تلقائيًا. تقدر تستبدله بـ `mailto:...` |
| `PRICE_TEXT` | افتراضي: «الاشتراك: 49 جنيه لمدة 30 يومًا» | عدّله وقت ما تحب (أو `--price-text "..."`) |
| `TITLE` | «مغامرات العيلة» | اسم التطبيق |

## 1) توليد الأكواد / Generate codes
```bash
cd moody
# مزيج: 20 كود شهري + 5 كود 90 يوم + 5 كود سنوي
node tools/direct/gen_codes.js --mix 20x30,5x90,5x365 --out ~/private/family_codes.txt --hashes tools/direct/codes_hashes.json
# أو دفعة واحدة:  --count 30 --days 30     أو ملف:  --config batch.json   ( [{"count":20,"days":30},{"count":5,"days":365}] )
```
* `--out` = ملف **خاص بالأكواد الصريحة** (CODE ⇥ DAYS ⇥ التاريخ ⇥ اسم المشتري). **احفظه خارج المستودع ولا ترفعه أبدًا** (الأداة ترفض مسارًا داخل المستودع). الدفعات الجديدة تُضاف في آخره.
* `--hashes` = ملف **الهاشات فقط** (SHA-256)، يضمّه البناء. الدفعات الجديدة تُضاف على القديمة فتبقى الأكواد القديمة صالحة.
* شكل الكود: `FM-XXXX-XXXX-XXXX` (12 خانة عشوائية بلا حروف متشابهة). المشتري يكتبه بأي حالة/مسافات.

## 2) البناء / Build
```bash
cd moody
node tools/play/build.js ../family_dist --edition direct --force            # يقرأ direct.config.js و codes_hashes.json
node tools/play/build.js ../family_dist --edition direct --force --contact-url "https://wa.me/201206354853" --price-text "..." [--codes-hashes FILE] [--voice-dir DIR]
node tools/play/leakcheck.js ../family_dist                                 # لازم: no leaks found
node tools/direct/direct_test.js ../family_dist ~/private/family_codes.txt  # اختبار شامل (اختياري)
```
**كل مرة تولّد أكواد جديدة لازم تعيد البناء وتعيد نشر المجلد** (الهاشات داخل البناء).

## 3) النشر / Publish (رابط خاص)
انسخ محتوى `family_dist` إلى مجلد فرعي من نفس موقع GitHub Pages، مثلًا `/family/`، وافتح `https://<موقعك>/family/`. كل المسارات نسبية، والـ service worker والـ manifest نطاقهما هذا المجلد، والصفحة `noindex`، **ولا تضع رابطًا لها في الهب**. التطبيق قابل للتثبيت (PWA) باسم «مغامرات العيلة» وأيقونته الخاصة.
> تنبيه استضافة: الـ service worker الرئيسي للهب (`/sw.js`) يمسح أي كاش لا يُسمى `hub-v1` عند تحديثه، فقد يُمسح كاش `family-*` (يعني رجوع الصوت للتحميل من جديد؛ التقدم والكود غير متأثرين لأنهما في localStorage). الأنظف: مستودع/نطاق Pages منفصل.

## 4) البيع / Sell → أرسل الكود → التجديد
1. العميل يفتح الرابط الخاص، يمر بالمعالج، يلعب أول مهمة في كل مغامرة. عند فتح مهمة مقفولة: «ركن الكبار» (ضغط 3 ثواني + مسألة) ثم شاشة الكود.
2. يضغط **«اطلب كودك»** → واتساب برسالة جاهزة. تتفق على الدفع بطريقتك، ثم ترسل له كودًا من ملفك الخاص (علّم عليه باسم المشتري).
3. يكتب الكود → تفتح كل المهام للمدة (30/90/365 يومًا). يعمل بدون إنترنت.
4. **التجديد/الإضافة:** كود جديد يُضاف **فوق الوقت المتبقي** (كود 30 يومًا على 10 أيام متبقية = 40). عند انتهاء المدة تُقفل المهام المدفوعة بلطف وتبقى أول مهمة مجانية، و**التقدم والعيلة محفوظان**؛ كود جديد يكمّل من نفس المكان. ركن الأهل يعرض الأيام المتبقية وزر «تجديد» وزر «اطلب كودك».
5. كل كود يعمل **مرة واحدة لكل جهاز**.

## 5) حدود بصراحة / Honest limits
* الأكواد فحص **داخل المتصفح** وليست حماية حقيقية: من يفتح أدوات المطور أو يعدّل `localStorage`/الكود يقدر يتجاوزها، ومن يستلم كودًا يقدر يعطيه لجهاز آخر (كل جهاز مرة). مقبول للبيع الشخصي لمعارف؛ للحماية الحقيقية تحتاج خادمًا. الأكواد مخزنة كهاشات فقط (لا تُستخرج من الصفحة)، لكن لا تعتمد على ذلك كأمان.
* ضبط ساعة الجهاز للخلف لا يمدّ المدة بعد أول تشغيل (الساعة تُحفظ تصاعديًا) لكن ليس مضمونًا تمامًا.
* لا يمكن إلغاء كود فُعّل على جهاز بالفعل (لا خادم). حذف هاش من الملف يمنع الاستخدام الجديد بعد إعادة النشر فقط.
* لا استرجاع للمشتريات عبر حساب: الكود والمدة مرتبطان بالمتصفح/الجهاز. تنظيف بيانات الموقع يضيع التفعيل (أعد إرسال كود).

## 6) الصوت — مهم / Voice — important
البناء الافتراضي **بلا مقاطع صوتية** (صامت). المقاطع الحالية في `assets/voice` مولَّدة بخدمة Edge **وغير مرخَّصة للبيع التجاري** — لا تضمّها في نسخة تبيعها. استعمل **تسجيلاتك الصوتية** أو **TTS مرخَّص** (Azure) عبر `tools/play/voice.py` / `tools/family` (انظر `tools/play/README.md` §3) ثم: `--voice-dir <مجلد المقاطع+manifest.json>`. نسخة `family_dist_preview` (بالمقاطع الحالية) **للمعاينة الشخصية فقط، لا تنشرها ولا تبيعها**.

## 7) ملفات / Files
`direct.config.js` (إعداداتك) · `gen_codes.js` · `runtime/` (مزوّد `codes` وشاشاته وPWA، يُحقن في البناء) · `direct_test.js` · `codes_hashes.json` (يولّده gen_codes، لا ترفع هاشات الاختبار) · البناء: `tools/play/build.js --edition direct`.

---
## English summary
1. `direct.config.js`: contact link (wa.me preset), price text, title. 2. `gen_codes.js --mix 20x30,5x90,5x365 --out <private> --hashes codes_hashes.json` (plaintext never in the repo; hashes merge across batches). 3. `build.js OUT --edition direct --force` and republish after every new batch. 4. Host in a sub-folder (`/family/`), unlisted (noindex), no hub link. 5. Buyer: free first mission per adventure → «اطلب كودك» (WhatsApp) → you send a code → enters it; durations stack; expiry locks paid missions, progress kept. 6. Limits: client-side codes are not tamper-proof (fine for personal sales); a code works once per device but can be shared; no revocation after activation. 7. Voice: shipped clips are Edge-generated, **not licensed for commercial sale**: use your own recordings or licensed TTS; the default build is silent.
