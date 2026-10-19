import re
PRAISE = re.compile(r'برافو|ممتاز|شاطر|أحسنت|احسنت|عظمة|هايل|يا سلام|تحفة|مبروك|جامد|ما شاء الله|تسلم|فخور|فخورة|بطل|أبطال|مجهود|كده الشطارة')
GENTLE = re.compile(r'معلش|ولا يهمك|قريب|جرّب تاني|جرب تاني|حاول|خد وقتك|براحة|مفيش مشكلة|مش مهم|نحاول|نجرب|نجرّب|مرة كمان|كمّل|كمل|ولا يهمك|بالراحة|متزعلش|ماتزعلش|متقلقش|ماتقلقش')
SAD = re.compile(r'للأسف|وحشتني|وحشتوني|زعلان|زعلانة|حزين|تعبان|تعبانين|مش قادر|بعيد عني')
TIP = re.compile(r'تلميح|ركّز|ركز|فكّر|فكر|شوف|لاحظ|خلي بالك|خد بالك|فكرة')
EXC = re.compile(r'هيييه|يلا|إيه ده|ايه ده|يا خبر|ياه|واااو|هههه|!!')
def infer(text):
    t = text or ''
    if SAD.search(t): return 'sad'
    if EXC.search(t): return 'excited'
    if PRAISE.search(t) and '!' in t: return 'praise'
    if GENTLE.search(t): return 'gentle'
    if TIP.search(t) and len(t) < 80: return 'tip'
    if t.rstrip().endswith('!'): return 'excl'
    if t.rstrip().endswith(('؟', '?')): return 'question'
    return 'neutral'
