"""The old flat single-utterance pipeline (kept for A/B samples and `gen_voice.py --v1`)."""
import os, subprocess, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import edge_tts
from profiles import PROFILES
CHAIN = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-2'
async def flat(text, speaker, out, proxy=None):
    v, r, p, _, _ = PROFILES.get(speaker, PROFILES['narrator'])
    for k in range(4):
        try:
            await edge_tts.Communicate(text, v, rate='%+d%%' % r, pitch='%+dHz' % p, proxy=proxy).save(out + '.tmp'); break
        except Exception:
            import asyncio; await asyncio.sleep(1 + k)
    subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', out + '.tmp', '-af', CHAIN, '-ac', '1', '-ar', '24000', '-b:a', '32k', out], check=True); os.remove(out + '.tmp')
