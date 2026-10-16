#!/usr/bin/env python3
"""Generate assets/voice/<hash>.mp3 with edge-tts (resumable). Run: python3 tools/gen_voice.py [limit]"""
import asyncio, edge_tts, json, os, sys, subprocess
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from voice_hash import normalize
root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
vd = os.path.join(root, 'assets', 'voice')
M = 'ar-EG-ShakirNeural'; F = 'ar-EG-SalmaNeural'
V = {  # voice, rate, pitch
 'narrator': (F, '+0%', '+0Hz'), 'mama': (F, '-4%', '-3Hz'), 'baba': (M, '-2%', '-2Hz'),
 'boy_big': (M, '+2%', '+22Hz'), 'boy_small': (M, '+4%', '+38Hz'),
 'girl_big': (F, '+2%', '+8Hz'), 'girl_small': (F, '+4%', '+20Hz'), 'nana': (F, '-12%', '-14Hz')}
async def one(item, sem):
    h = item['hash']; out = os.path.join(vd, h + '.mp3')
    if os.path.exists(out) and os.path.getsize(out) > 500: return
    v, r, p = V.get(item['speaker'], V['narrator'])
    t = normalize(item['text'])
    async with sem:
        for k in range(5):
            try:
                await edge_tts.Communicate(t, v, rate=r, pitch=p, proxy=os.environ.get('HTTPS_PROXY')).save(out + '.tmp')
                subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out + '.tmp', '-af',
                  'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-2',
                  '-ac', '1', '-ar', '24000', '-b:a', '32k', out], check=True)
                os.remove(out + '.tmp'); return
            except Exception as e:
                err = e; await asyncio.sleep(1 + k * 2)
        print('FAIL', h, t[:40], repr(err)[:80], flush=True)
async def main():
    items = json.load(open(os.path.join(root, 'tools', 'voice_strings.json')))
    if len(sys.argv) > 1: items = items[:int(sys.argv[1])]
    sem = asyncio.Semaphore(6); os.makedirs(vd, exist_ok=True)
    await asyncio.gather(*[one(i, sem) for i in items])
asyncio.run(main())
