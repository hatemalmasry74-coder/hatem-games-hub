#!/usr/bin/env python3
"""Generate assets/voice/<hash>.mp3 for every string in tools/voice_strings.json - v2 pipeline (default).

  python3 tools/gen_voice.py              generate what is missing / outdated (resumable, idempotent, concurrency 6)
  python3 tools/gen_voice.py 50           only the first 50 strings (testing)
  python3 tools/gen_voice.py --force      regenerate everything
  python3 tools/gen_voice.py --v1         the old flat single-utterance pipeline (fallback)
  python3 tools/gen_voice.py --concurrency 4 --kbps 40

v2 = phrase-level prosody (tools/voice2/synth.py): per-phrase rate/pitch by punctuation + emotion class, natural jittered pauses,
crossfades, trimmed silences, question end-rise, light warmth EQ/de-ess, -18 LUFS, 24 kHz mono mp3.  Items in voice_strings.json may carry
an optional "emo" (neutral question excl praise warm gentle tip excited calm sad) - otherwise it is inferred from the text.
A clip is regenerated when its mp3 is missing OR tools/voice2/ledger.json does not list it with the current pipeline tag
(so first run after pulling v2 replaces all v1 clips; later runs only do new strings).  At the end the manifest is rebuilt.
Needs: edge-tts, numpy, pyloudnorm, ffmpeg; env SSL_CERT_FILE=/root/.ccr/ca-bundle.crt and HTTPS_PROXY in the sandbox."""
import asyncio, json, os, subprocess, sys, time
HERE = os.path.dirname(os.path.abspath(__file__)); root = os.path.join(HERE, '..')
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, 'voice2'))
from voice_hash import normalize
vd = os.path.join(root, 'assets', 'voice'); LEDGER = os.path.join(HERE, 'voice2', 'ledger.json')

def args():
    a = sys.argv[1:]; o = {'limit': None, 'force': '--force' in a, 'v1': '--v1' in a, 'conc': 6, 'kbps': 40}
    for i, x in enumerate(a):
        if x.isdigit(): o['limit'] = int(x)
        if x == '--concurrency': o['conc'] = int(a[i + 1])
        if x == '--kbps': o['kbps'] = int(a[i + 1])
    return o

async def v1_one(item, sem, proxy):
    import v1
    async with sem:
        await v1.flat(normalize(item['text']), item['speaker'], os.path.join(vd, item['hash'] + '.mp3'), proxy)

async def main():
    o = args(); proxy = os.environ.get('HTTPS_PROXY'); os.makedirs(vd, exist_ok=True)
    items = json.load(open(os.path.join(HERE, 'voice_strings.json'), encoding='utf-8'))
    if o['limit']: items = items[:o['limit']]
    if o['v1']:
        sem = asyncio.Semaphore(o['conc']); todo = [i for i in items if not os.path.exists(os.path.join(vd, i['hash'] + '.mp3'))]
        await asyncio.gather(*[v1_one(i, sem, proxy) for i in todo]); print('v1 done', len(todo)); return
    import synth
    synth.set_concurrency(o['conc'])
    ledger = json.load(open(LEDGER)) if os.path.exists(LEDGER) else {}
    tag = lambda i: synth.VERSION + ':' + i['speaker'] + ':' + (i.get('emo') or '') + ':%d:%d' % (o['kbps'], len(synth.split_phrases(normalize(i['text']))))
    todo = [i for i in items if o['force'] or not (os.path.exists(os.path.join(vd, i['hash'] + '.mp3')) and ledger.get(i['hash']) == tag(i))]
    print('strings %d, to generate %d' % (len(items), len(todo)), flush=True)
    done = fails = 0; t0 = time.time(); clip_sem = asyncio.Semaphore(o['conc'] * 2); failed = []
    async def one(i):
        nonlocal done, fails
        async with clip_sem:
            try:
                x, info = await synth.build(normalize(i['text']), i['speaker'], emo=i.get('emo'), seed=int(i['hash'], 16) & 0xffffffff, proxy=proxy)
                await asyncio.get_running_loop().run_in_executor(synth.POOL, synth.encode, x, os.path.join(vd, i['hash'] + '.mp3'), o['kbps']); ledger[i['hash']] = tag(i)
            except Exception as e:
                fails += 1; failed.append(i['hash']); print('FAIL', i['hash'], i['text'][:40], repr(e)[:90], flush=True)
            done += 1
            if done % 100 == 0:
                json.dump(ledger, open(LEDGER, 'w')); el = time.time() - t0
                print('%d/%d  fails %d  %.0fs  eta %.0f min' % (done, len(todo), fails, el, el / done * (len(todo) - done) / 60), flush=True)
    await asyncio.gather(*[one(i) for i in todo])
    json.dump(ledger, open(LEDGER, 'w'))
    print('generated %d, failed %d in %.0f s' % (done - fails, fails, time.time() - t0))
    subprocess.run([sys.executable, os.path.join(HERE, 'voice_hash.py'), '--manifest', os.path.join(HERE, 'voice_strings.json')])
    subprocess.run([sys.executable, os.path.join(HERE, 'voice_hash.py'), '--check', os.path.join(HERE, 'voice_strings.json')])
asyncio.run(main())
