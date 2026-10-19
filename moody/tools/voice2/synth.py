#!/usr/bin/env python3
"""v2 voice synthesis: phrase-level prosody on top of edge-tts.
   text -> phrases (punctuation) -> one edge-tts call per phrase with rate/pitch/volume driven by the emotion class and the
   punctuation (+ small deterministic per-clip random variation) -> trim -> natural pauses (60-300 ms, jittered) with short
   crossfades -> question end-rise -> light warmth EQ + de-ess + gentle compression -> -18 LUFS -> mono 24 kHz mp3 (~40 kbps).
   Library: build(text, speaker, emo=None, seed=None) -> numpy float32 24 kHz ; encode(x, out_path)."""
import asyncio, io, os, random, re, subprocess, sys
from concurrent.futures import ThreadPoolExecutor
import numpy as np
import av
import pyloudnorm as pyln
POOL = ThreadPoolExecutor(int(os.environ.get('V2_THREADS', '6')))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import edge_tts
from profiles import PROFILES, EMO
from emo import infer
SR = 24000
PUNCT_END = '.!؟?،,؛;:…'
PAUSE_MS = {'.': 280, '!': 300, '؟': 320, '?': 320, '،': 150, ',': 150, '؛': 200, ';': 200, ':': 200, '…': 380, '': 80}
VERSION = 'v2.2'
TUNE = {'emo_rate': float(os.environ.get('V2_EMO_RATE', 0.4)), 'rate_jit': float(os.environ.get('V2_RATE_JIT', 1.2)), 'short': int(os.environ.get('V2_SHORT', 24)), 'bang_rate': float(os.environ.get('V2_BANG_RATE', 0.5))}

def split_phrases(text, smart=True):
    t = re.sub(r'\s+', ' ', text).strip()
    if smart and len(re.sub(r'[^\w]|_', '', t)) <= TUNE['short']: return [t]                  # very short: one utterance
    parts = [p.strip() for p in re.split(r'(?<=[.!؟?،,؛;:…])\s+', t) if p.strip()]
    # keep ".." / "..." attached (split only after the last dot of a run is already handled by the regex lookbehind)
    if smart and len(parts) >= 3 and all(len(re.findall(r'\S+', re.sub(r'[.!؟?،,؛;:…]', '', p))) <= 2 for p in parts) and not re.search(r'[.!؟?؛;:…]\s', t): return [t]   # a list ("٥، ١٠، ١٥"): keep the list intonation
    out = []
    for p in parts:
        words = len(re.findall(r'\S+', re.sub(r'[.!؟?،,؛;:…]', '', p)))
        strong = p[-1] in '!؟?' and words >= 1
        if out and words < 2 and not strong and not out[-1].endswith(('!', '؟', '?', '.')): out[-1] += ' ' + p
        elif out and words < 2 and not strong: out[-1] += ' ' + p
        else: out.append(p)
    if len(out) > 1 and len(re.findall(r'\S+', out[0])) < 2 and out[0][-1] not in '!؟?': out[1] = out[0] + ' ' + out[1]; out = out[1:]
    while len(out) > 5:  # merge the shortest neighbour pair
        i = min(range(len(out) - 1), key=lambda k: len(out[k]) + len(out[k + 1])); out[i] += ' ' + out[i + 1]; del out[i + 1]
    return out or [t]

def last_punct(p):
    m = re.search(r'([.!؟?،,؛;:…]+)\s*$', p)
    if not m: return ''
    s = m.group(1)
    return '…' if ('..' in s or '…' in s) else s[-1]

_SEM = None
def set_concurrency(n):
    global _SEM; _SEM = asyncio.Semaphore(n)

async def _tts_once(text, voice, rate, pitch, vol, proxy=None):
    c = edge_tts.Communicate(text, voice, rate='%+d%%' % rate, pitch='%+dHz' % pitch, volume='%+d%%' % vol, proxy=proxy)
    buf = bytearray()
    async for ch in c.stream():
        if ch['type'] == 'audio': buf += ch['data']
    if len(buf) < 600: raise RuntimeError('empty audio')
    return bytes(buf)

async def tts_bytes(text, voice, rate, pitch, vol, proxy=None):
    """one edge-tts phrase (global concurrency limit, retries with back-off)"""
    global _SEM
    if _SEM is None: _SEM = asyncio.Semaphore(6)
    err = None
    for k in range(6):
        try:
            async with _SEM:
                return await asyncio.wait_for(_tts_once(text, voice, rate, pitch, vol, proxy), 40)
        except Exception as e:
            err = repr(e)[:100]
        await asyncio.sleep(1 + k * 1.5)
    raise RuntimeError('tts failed: ' + str(err))

def decode(b):
    """mp3 bytes -> float32 mono 24 kHz (in-process, PyAV)"""
    c = av.open(io.BytesIO(b)); rs = av.AudioResampler(format='flt', layout='mono', rate=SR); out = []
    for fr in c.decode(audio=0):
        for f in rs.resample(fr): out.append(f.to_ndarray().reshape(-1))
    for f in rs.resample(None): out.append(f.to_ndarray().reshape(-1))
    c.close(); return np.concatenate(out).astype(np.float32) if out else np.zeros(0, np.float32)

def trim(x, thr_db=-46, head_ms=25, tail_ms=70):
    if len(x) < 400: return x
    fr = 120; n = len(x) // fr
    e = np.sqrt((x[:n * fr].reshape(n, fr) ** 2).mean(1) + 1e-12); db = 20 * np.log10(e)
    idx = np.where(db > thr_db)[0]
    if not len(idx): return x
    a = max(0, idx[0] * fr - int(SR * head_ms / 1000)); b = min(len(x), (idx[-1] + 1) * fr + int(SR * tail_ms / 1000))
    y = x[a:b].copy(); f = min(len(y) // 4, int(SR * .006)); y[:f] *= np.linspace(0, 1, f); y[-f:] *= np.linspace(1, 0, f); return y

def end_rise(x, amount=0.05, ms=260):
    """question intonation helper: the last `ms` are resampled with a speed ramp 1 -> 1+amount (pitch up ~ amount)."""
    n = int(SR * ms / 1000)
    if len(x) < n * 2: return x
    tail = x[-n:]; ramp = 1 + amount * np.linspace(0, 1, n) ** 1.5
    pos = np.cumsum(ramp); pos = pos[pos < n - 1]
    y = np.interp(pos, np.arange(n), tail).astype(np.float32); f = min(len(y) // 5, int(SR * .01)); y[-f:] *= np.linspace(1, 0, f)
    return np.concatenate([x[:-n], y])

def join(segs, pauses):
    """segs: arrays; pauses[i] = ms between seg i and i+1. Tiny pauses (<75 ms) use a 14 ms crossfade instead of silence."""
    out = segs[0]
    for s, p in zip(segs[1:], pauses):
        if p < 75:
            f = min(int(SR * .014), len(out) // 3, len(s) // 3)
            if f > 8:
                w = np.linspace(0, 1, f, dtype=np.float32); out = np.concatenate([out[:-f], out[-f:] * (1 - w) + s[:f] * w, s[f:]]); continue
        out = np.concatenate([out, np.zeros(int(SR * p / 1000), np.float32), s])
    return out

def eq_chain(x, warm=True):
    af = 'highpass=f=70,equalizer=f=190:t=q:w=1:g=%.1f,deesser=i=0.28:m=0.5:f=0.55,equalizer=f=6800:t=q:w=1.2:g=-1.5,acompressor=threshold=0.06:ratio=2:attack=8:release=90:makeup=1.3' % (1.6 if warm else 0)
    r = subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-af', af, '-f', 'f32le', 'pipe:1'], input=x.tobytes(), capture_output=True, check=True)
    y = np.frombuffer(r.stdout, np.float32).copy(); return y[:len(x)] if len(y) >= len(x) else np.pad(y, (0, len(x) - len(y)))

def loudness_norm(x, target=-18.0, peak_db=-2.0):
    dur = len(x) / SR
    if dur >= 0.45:
        try:
            l = pyln.Meter(SR).integrated_loudness(x)
            if np.isfinite(l): x = x * 10 ** ((target - l) / 20)
        except Exception: pass
    else:
        r = 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9); x = x * 10 ** ((target - 3 - r) / 20)
    pk = np.abs(x).max(); lim = 10 ** (peak_db / 20)
    if pk > lim: x = np.tanh(x / lim * 1.0) * lim / np.tanh(1.0) if pk > lim * 1.8 else x * (lim / pk)
    return x.astype(np.float32)

def encode(x, out, kbps=40):
    tmp = out + '.tmp.mp3'
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'pipe:0', '-codec:a', 'libmp3lame', '-b:a', '%dk' % kbps, '-f', 'mp3', tmp], input=x.tobytes(), check=True)
    os.replace(tmp, out)

def _post(raws, pauses, rise):
    segs = [trim(decode(b)) for b in raws]
    x = join(segs, pauses)
    if rise and len(x) / SR < 6: x = end_rise(x, amount=rise)
    x = loudness_norm(eq_chain(x))
    return np.concatenate([np.zeros(int(SR * .02), np.float32), x, np.zeros(int(SR * .05), np.float32)])   # a hair of air at both ends

async def build(text, speaker, emo=None, seed=0, proxy=None, pace=1.0):
    """returns (audio float32 @24k, info dict)"""
    voice, rate0, pitch0, pscale, vscale = PROFILES.get(speaker, PROFILES['narrator'])
    rnd = random.Random(seed)
    long_text = len(text) > 90
    emo = emo or infer(text)
    if long_text and emo not in ('question', 'excl', 'neutral'): emo = 'neutral'     # factual question stems: stay clear and even
    er, ep, ev = EMO.get(emo, EMO['neutral']); er *= TUNE['emo_rate']; k = .6 if long_text else 1.0
    # per-clip variation: repeated similar lines never get the exact same delivery
    jr = rnd.uniform(-TUNE['rate_jit'], TUNE['rate_jit']) * vscale; jp = rnd.uniform(-3.0, 3.0) * vscale
    phr = split_phrases(text); n = len(phr)
    jobs = []; meta = []
    for i, p in enumerate(phr):
        lp = last_punct(p); r = rate0 + er * k + jr; pt = pitch0 + ep * k + jp; v = ev * k
        if lp in ('!',): r += TUNE['bang_rate']; pt += 3; v += 2
        elif lp in ('؟', '?'): r -= 1; pt += 3
        elif lp == '…': r -= 6; pt -= 3; v -= 3
        elif lp in ('،', ',', '؛', ';', ':'): r += 1.5                       # continuation: a little brisker, will carry on
        if n > 1: pt -= min(4.0, 1.6 * i)                                   # pitch declination across phrases
        if n > 1 and i == n - 1 and lp in ('', '.', '!'): pt -= 1           # settle on the last phrase
        r += rnd.uniform(-1.2, 1.2) * vscale; pt += rnd.uniform(-1.5, 1.5) * vscale
        r = max(-30, min(30, round(r * pace + (pace - 1) * 100 * 0))); pt = max(-60, min(80, round(pt)))
        jobs.append(tts_bytes(p, voice, int(r), int(pt), int(max(-25, min(15, v))), proxy)); meta.append((p, lp, int(r), int(pt)))
    raws = await asyncio.gather(*jobs)
    pauses = []
    for i in range(n - 1):
        lp = meta[i][1]; base = PAUSE_MS.get(lp, 80) * pscale
        pauses.append(int(max(0, base * rnd.uniform(.78, 1.28) + rnd.uniform(-10, 14))))
    rise = (0.04 + 0.02 * rnd.random()) if meta[-1][1] in ('؟', '?') else 0
    x = await asyncio.get_running_loop().run_in_executor(POOL, _post, raws, pauses, rise)
    return x, {'emo': emo, 'phrases': meta, 'pauses': pauses, 'dur': len(x) / SR}

if __name__ == '__main__':
    import json
    text, spk, out = sys.argv[1], sys.argv[2], sys.argv[3]
    x, info = asyncio.run(build(text, spk, seed=1, proxy=os.environ.get('HTTPS_PROXY'))); encode(x, out); print(json.dumps(info, ensure_ascii=False))
