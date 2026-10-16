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
  python3 tools/voice_hash.py --check tools/voice_strings.json   verify hashes + list missing clips
  python3 tools/voice_hash.py --manifest tools/voice_strings.json  (re)write assets/voice/manifest.json from the clips that exist
"""
import json, os, re, sys

def normalize(s):
    s = (s or '')
    for k, v in (('{m}', 'مودي'), ('{a}', 'عبودي'), ('{t}', 'توتا'), ('{n}', 'نيمو'), ('{me}', 'يا بطل')):
        s = s.replace(k, v)
    s = re.sub(r'[ \t\r\n ]+', ' ', s).strip()
    return re.sub('[ً-ٰٟـ]', '', s)

def _fnv(b, h):
    for x in b:
        h ^= x
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h

def voice_hash(text):
    b = normalize(text).encode('utf-8')
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
    else:
        print(voice_hash(a[0]))
