#!/usr/bin/env python3
"""Moody & Aboody - tools/voice_hash.py : Python twin of Moody.voice.hash() (engine/voice.js).

  normalize(text): replace {m}->مودي {a}->عبودي {t}->توتا {n}->نيمو {me}->يا بطل;
                   collapse runs of [space, tab, CR, LF, NBSP] to one space and trim;
                   delete Arabic tashkeel U+064B..U+065F, U+0670 and tatweel U+0640.
  hash(text)     : UTF-8 bytes of the normalized text -> two 32-bit FNV-1a hashes (offset bases
                   0x811c9dc5 and 0x9747b28c, prime 0x01000193) -> 8+8 hex digits -> first 12 hex digits.
  clip file      : assets/voice/<hash>.mp3     manifest: assets/voice/manifest.json {hash: {voice, text}}

Usage:
  python3 tools/voice_hash.py "مرحبا يا {m}"            print the hash
  python3 tools/voice_hash.py --neutral [--gm تيتة] [--gf جدو] "نص فيه {k1} {gm}"   NEUTRAL rendering (Play edition: role tokens spoken as neutral words, see NT below) + hash
  python3 tools/voice_hash.py --check tools/voice_strings.json   verify hashes + list missing clips
  python3 tools/voice_hash.py --manifest tools/voice_strings.json  (re)write assets/voice/manifest.json from the clips that exist
"""
import json, os, re, sys

# ---- NEUTRAL rendering (Play edition) - the twin of Moody.voice.neutralize() in engine/voice.js.  Keep the table identical to NT there
# (tools/play/check_neutral.js compares the two tables and the hashes of every string).
NT = {"k": {"m": ["الكبير", "يا بطل"], "a": ["الصغير", "يا بطل"], "t": ["الكبيرة", "يا بطلة"], "n": ["الصغيرة", "يا بطلة"]},
      "f": {"aunt1": ["عمتو", "يا عمتو"], "aunt2": ["عمتو", "يا عمتو"], "uncle1": ["عمو", "يا عمو"],
            "aunt1n": ["عمتو", "يا عمتو"], "aunt2n": ["عمتو", "يا عمتو"], "uncle1n": ["عمو", "يا عمو"], "cz1": ["ابن عمك", "يا صاحبي"], "cz2": ["بنت عمك", "يا حبيبتي"],
            "cz3": ["ابن عمك الصغير", "يا حبيبي"], "cz4": ["ابن عمك الكبير", "يا صاحبي"], "cz5": ["ابن عمك الأكبر", "يا صاحبي"], "fr": ["صاحبك", "يا صاحبي"],
            "school": ["المدرسة", "المدرسة"], "dcity": ["مدينة بابا", "مدينة بابا"], "dcountry": ["بلد بابا", "بلد بابا"]},
      "kf": {"m": ["الكبيرة", "يا بطلة"], "a": ["الصغيرة", "يا بطلة"]},
      "t": {"gm": "gm", "gmt": "gm", "gmn": "gm", "gf": "gf", "gft": "gf"}}
_NAMES = list(NT['k']) + list(NT['f']) + list(NT['t'])
_RE_VOC = re.compile(r'يا\s+\{(' + '|'.join(_NAMES) + r')\}')
_RE_BARE = re.compile('([وفبكل]{0,2}\u0640?)\\{(' + '|'.join(_NAMES) + r')\}')
DEFAULT_TITLES = {'gm': 'تيتة', 'gf': 'جدو'}      # titles may also carry 'fl': a string of flipped duo letters, e.g. 'ma' (moody and aboody are girls)

def neutralize(s, titles=None):
    t = dict(DEFAULT_TITLES); t.update(titles or {})
    def word(k, voc):
        if k in NT['k']: return (NT['kf'][k] if k in NT['kf'] and k in (t.get('fl') or '') else NT['k'][k])[1 if voc else 0]
        if k in NT['f']: return NT['f'][k][1 if voc else 0]
        w = t[NT['t'][k]]
        return 'يا ' + w if voc else w
    s = re.sub(r'\{k([1-4])\}', lambda m: '{' + 'matn'[int(m.group(1)) - 1] + '}', s)
    s = s.replace('{me}', 'يا بطل')
    s = _RE_VOC.sub(lambda m: word(m.group(1), True), s)
    def bare(m):
        pre, k = m.group(1), m.group(2); w = word(k, False)
        if re.search('\u0644\u0640?$', pre) and w.startswith('\u0627\u0644'):
            pre = re.sub('\u0640$', '', pre); w = w[1:]
        return pre + w
    return _RE_BARE.sub(bare, s)

def normalize(s, neutral=False, titles=None):
    s = (s or '')
    if neutral:
        s = neutralize(s, titles)
    else:
        for k, v in (('{m}', 'مودي'), ('{a}', 'عبودي'), ('{t}', 'توتا'), ('{n}', 'نيمو'), ('{me}', 'يا بطل')):
            s = s.replace(k, v)
    s = re.sub(r'[ \t\r\n ]+', ' ', s).strip()
    return re.sub('[\u064b-\u065f\u0670\u0640]', '', s)

def _fnv(b, h):
    for x in b:
        h ^= x
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h

def voice_hash(text, neutral=False, titles=None, salt=''):
    b = (normalize(text, neutral, titles) + ('\u0001' + salt if salt else '')).encode('utf-8')
    return ('%08x%08x' % (_fnv(b, 0x811c9dc5), _fnv(b, 0x9747b28c)))[:12]

if __name__ == '__main__':
    a = sys.argv[1:]
    root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
    vdir = os.path.join(root, 'assets', 'voice')
    if not a:
        print(__doc__)
    elif a[0] in ('--check', '--manifest'):
        items = json.load(open(a[1], encoding='utf-8'))
        bad = [i for i in items if voice_hash(i['text']) != i['hash']]
        have = [i for i in items if os.path.exists(os.path.join(vdir, i['hash'] + '.mp3'))]
        print('strings: %d, hash mismatches: %d, clips present: %d, missing: %d' % (len(items), len(bad), len(have), len(items) - len(have)))
        if a[0] == '--manifest':
            m = {i['hash']: {'voice': i['speaker'], 'text': i['text']} for i in have}
            json.dump(m, open(os.path.join(vdir, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
            print('manifest written with %d clips' % len(m))
    elif a[0] == '--neutral':
        ti = {}; rest = a[1:]
        while rest and rest[0] in ('--gm', '--gf'):
            ti[rest[0][2:]] = rest[1]; rest = rest[2:]
        t = ' '.join(rest); print(normalize(t, True, ti)); print(voice_hash(t, True, ti))
    else:
        print(voice_hash(a[0]))
