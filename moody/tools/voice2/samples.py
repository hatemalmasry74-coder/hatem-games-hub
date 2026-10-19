#!/usr/bin/env python3
"""Listening-sample set: same text, old flat vs new v2, by role.   python3 tools/voice2/samples.py <out_dir> [--n-per-role ...]
Writes <out_dir>/<NN>_<role>_old.mp3 / _new.mp3 and index.md (text + what to listen for)."""
import asyncio, json, os, random, re, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..'))
import synth, v1
from voice_hash import normalize
PLAN = [('narrator', 6), ('boy_big', 3), ('boy_small', 3), ('girl_big', 2), ('girl_small', 2), ('mama', 3), ('baba', 3), ('nana', 3)]
async def main():
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); proxy = os.environ.get('HTTPS_PROXY')
    items = json.load(open(os.path.join(HERE, '..', 'voice_strings.json'), encoding='utf-8')); rnd = random.Random(11); rows = []; k = 0
    for role, n in PLAN:
        pool = [i for i in items if i['speaker'] == role and 4 <= len(i['text'].split()) <= 14]
        react = [i for i in pool if i.get('emo')]; story = [i for i in pool if not i.get('emo')]
        pick = []
        for kind, test in (('question', lambda t: '؟' in t), ('exclaim', lambda t: t.rstrip().endswith('!')), ('gentle/long', lambda t: '،' in t or '..' in t), ('any', lambda t: True)):
            c = [i for i in (react if len(pick) % 2 == 0 and react else story) + story + react if test(i['text']) and i not in pick]
            if c and len(pick) < n: pick.append(rnd.choice(c))
        for i in pick[:n]:
            k += 1; base = '%02d_%s' % (k, role); t = normalize(i['text'])
            await v1.flat(t, role, os.path.join(out, base + '_old.mp3'), proxy)
            x, info = await synth.build(t, role, emo=i.get('emo'), seed=int(i['hash'], 16) & 0xffffffff, proxy=proxy); synth.encode(x, os.path.join(out, base + '_new.mp3'))
            rows.append((base, role, t, info['emo'], info['phrases'], info['pauses']))
    L = ['# Listening samples: old (flat, one utterance) vs new (v2, phrase prosody)', '', 'Same text, same speaker role. Listen to `_old` then `_new`. Things to judge: natural pauses, energy on `!`, rising `؟`, warmth, whether anything sounds clipped/robotic or the pitch jumps between phrases.', '',
         '| file | role | text | emotion | phrases (rate%, pitch Hz) | pauses ms |', '|---|---|---|---|---|---|']
    for b, role, t, e, ph, pa in rows: L.append('| %s_old / %s_new | %s | %s | %s | %s | %s |' % (b, b, role, t, e, ' / '.join('%d%%,%+dHz' % (p[2], p[3]) for p in ph), pa))
    open(os.path.join(out, 'index.md'), 'w').write('\n'.join(L)); print('\n'.join(L))
asyncio.run(main())
