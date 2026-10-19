#!/usr/bin/env python3
"""Old (v1) vs new (v2) objective comparison on a sample of lines.
  python3 tools/voice2/compare.py --old <dir with v1 <hash>.mp3> [--new <dir with the shipped v2 clips>] [--n 150] [--out report_dir] [--strings tools/voice_strings.json]
Per line: faster-whisper(small) transcript of old and new -> WER/CER against the source text; duration; pause statistics
(internal silences > 70 ms); f0 mean/std/range (parselmouth) + final-segment slope for questions; integrated loudness.
Writes <out>/report.json and <out>/report.md.  Human-likeness itself CANNOT be measured: these are proxies; listen to the samples."""
import asyncio, json, os, random, sys, statistics as st
import numpy as np
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, '..'))
from asr import Asr, wer, cer, load16k
import synth
from voice_hash import normalize

def a(k, d=None):
    return sys.argv[sys.argv.index(k) + 1] if k in sys.argv else d

def pauses(x16, sr=16000, thr_db=-42, min_ms=70):
    fr = int(sr * .010); n = len(x16) // fr
    if n < 5: return []
    db = 20 * np.log10(np.sqrt((x16[:n * fr].reshape(n, fr) ** 2).mean(1)) + 1e-9); v = np.where(db > thr_db)[0]
    if not len(v): return []
    out = []; run = 0
    for i in range(v[0], v[-1] + 1):
        if db[i] <= thr_db: run += 1
        else:
            if run * 10 >= min_ms: out.append(run * 10)
            run = 0
    return out

def f0stats(path):
    import parselmouth
    try:
        s = parselmouth.Sound(path); p = s.to_pitch(time_step=.01, pitch_floor=70, pitch_ceiling=500)
        f = p.selected_array['frequency']; f = f[f > 0]
        if len(f) < 8: return None
        st_ = 12 * np.log2(f / np.median(f)); tail = f[-max(4, len(f) // 6):]
        slope = float(12 * np.log2(np.mean(tail[-3:]) / np.mean(tail[:3])))
        return {'mean': float(f.mean()), 'sd_semitones': float(st_.std()), 'range_semitones': float(np.percentile(st_, 95) - np.percentile(st_, 5)), 'final_slope_st': slope}
    except Exception: return None

def lufs(path):
    import pyloudnorm as pyln
    x = load16k(path)
    try: return float(pyln.Meter(16000).integrated_loudness(x)) if len(x) > 16000 * .5 else None
    except Exception: return None

def sample(items, n, seed=7):
    rnd = random.Random(seed); by = {}
    for i in items:
        if len(i['text'].split()) >= 3: by.setdefault(i['speaker'], []).append(i)
    out = []; tot = sum(len(v) for v in by.values())
    for sp, l in by.items():
        k = max(6, round(n * len(l) / tot)) if sp != 'narrator' else max(30, round(n * len(l) / tot))
        out += rnd.sample(l, min(k, len(l)))
    rnd.shuffle(out); return out[:max(n, 0)] if len(out) > n * 1.15 else out

async def gen_new(sel, d, conc=6):
    os.makedirs(d, exist_ok=True); synth.set_concurrency(conc); sem = asyncio.Semaphore(conc * 2)
    async def one(i):
        out = os.path.join(d, i['hash'] + '.mp3')
        if os.path.exists(out): return
        async with sem:
            x, info = await synth.build(normalize(i['text']), i['speaker'], emo=i.get('emo'), seed=int(i['hash'], 16) & 0xffffffff, proxy=os.environ.get('HTTPS_PROXY')); synth.encode(x, out)
    await asyncio.gather(*[one(i) for i in sel])

def main():
    old = a('--old'); n = int(a('--n', 150)); out = a('--out', 'compare_out'); sf = a('--strings', os.path.join(HERE, '..', 'voice_strings.json'))
    os.makedirs(out, exist_ok=True); items = json.load(open(sf, encoding='utf-8'))
    if '--only-new' in sys.argv:   # sample only strings whose clip does not exist in `old` (e.g. reactions)
        items = [i for i in items if not os.path.exists(os.path.join(old, i['hash'] + '.mp3'))]
    if '--emo-only' in sys.argv: items = [i for i in items if i.get('emo')]      # the reaction lines (they have no v1 clip)
    sel = sample(items, n); sel = [i for i in sel if os.path.exists(os.path.join(old, i['hash'] + '.mp3'))] if '--paired' in sys.argv else sel
    nd = a('--new')
    if nd: sel = [i for i in sel if os.path.exists(os.path.join(nd, i['hash'] + '.mp3'))]
    else: nd = os.path.join(out, 'new'); asyncio.run(gen_new(sel, nd))
    if '--v1-gen' in sys.argv:   # synthesize the old flat version of lines that have no v1 clip
        import v1
        od = os.path.join(out, 'old_gen'); os.makedirs(od, exist_ok=True)
        async def fill():
            sem = asyncio.Semaphore(6)
            async def one(i):
                async with sem:
                    if not os.path.exists(os.path.join(old, i['hash'] + '.mp3')) and not os.path.exists(os.path.join(od, i['hash'] + '.mp3')): await v1.flat(normalize(i['text']), i['speaker'], os.path.join(od, i['hash'] + '.mp3'), os.environ.get('HTTPS_PROXY'))
            await asyncio.gather(*[one(i) for i in sel])
        asyncio.run(fill())
    asr = Asr(); rows = []
    for k, i in enumerate(sel):
        ref = normalize(i['text']); row = {'hash': i['hash'], 'speaker': i['speaker'], 'text': ref}
        for tag, path in (('old', os.path.join(old, i['hash'] + '.mp3') if os.path.exists(os.path.join(old, i['hash'] + '.mp3')) else os.path.join(out, 'old_gen', i['hash'] + '.mp3')), ('new', os.path.join(nd, i['hash'] + '.mp3'))):
            if not os.path.exists(path): continue
            x = load16k(path); h = asr(x); row[tag] = {'wer': wer(ref, h), 'cer': cer(ref, h), 'hyp': h, 'dur': len(x) / 16000, 'pauses': pauses(x), 'f0': f0stats(path), 'lufs': lufs(path), 'bytes': os.path.getsize(path)}
        rows.append(row)
        if k % 10 == 0: print(k, len(sel), flush=True)
    json.dump(rows, open(os.path.join(out, 'report.json'), 'w'), ensure_ascii=False, indent=1)
    R = [r for r in rows if 'old' in r and 'new' in r]
    def m(tag, f): 
        v = [f(r[tag]) for r in R if f(r[tag]) is not None]; return (st.mean(v), st.pstdev(v)) if v else (float('nan'), 0)
    L = ['# v1 vs v2 (n=%d paired)' % len(R), '', '| metric | old (v1) | new (v2) |', '|---|---|---|']
    for name, f in (('WER', lambda x: x['wer']), ('CER', lambda x: x['cer']), ('duration s', lambda x: x['dur']), ('internal pauses / clip', lambda x: len(x['pauses'])),
                    ('mean pause ms', lambda x: (sum(x['pauses']) / len(x['pauses'])) if x['pauses'] else None), ('pause ms sd (within-clip variation)', lambda x: float(np.std(x['pauses'])) if len(x['pauses']) > 1 else None),
                    ('f0 sd (semitones)', lambda x: x['f0']['sd_semitones'] if x['f0'] else None), ('f0 range 5-95% (st)', lambda x: x['f0']['range_semitones'] if x['f0'] else None), ('LUFS', lambda x: x['lufs']), ('bytes', lambda x: x['bytes'])):
        a_, b_ = m('old', f), m('new', f); L.append('| %s | %.3f (sd %.2f) | %.3f (sd %.2f) |' % (name, a_[0], a_[1], b_[0], b_[1]))
    q = [r for r in R if r['text'].rstrip().endswith('؟') and r['old']['f0'] and r['new']['f0']]
    if q: L += ['', 'question lines (n=%d): final f0 slope st  old %.2f  new %.2f' % (len(q), st.mean(r['old']['f0']['final_slope_st'] for r in q), st.mean(r['new']['f0']['final_slope_st'] for r in q))]
    worse = sorted(R, key=lambda r: r['new']['wer'] - r['old']['wer'], reverse=True)[:8]
    L += ['', 'largest WER regressions:'] + ['- %.2f -> %.2f  [%s] %s | old: %s | new: %s' % (r['old']['wer'], r['new']['wer'], r['speaker'], r['text'][:60], r['old']['hyp'][:60], r['new']['hyp'][:60]) for r in worse]
    L += ['', 'per speaker WER (old -> new):'] + ['- %s n=%d  %.3f -> %.3f' % (sp, len(g), st.mean(r['old']['wer'] for r in g), st.mean(r['new']['wer'] for r in g)) for sp in sorted({r['speaker'] for r in R}) for g in [[r for r in R if r['speaker'] == sp]]]
    open(os.path.join(out, 'report.md'), 'w').write('\n'.join(L)); print('\n'.join(L))
main()
