#!/usr/bin/env python3
"""Voice probe: synthesize 4 test sentences with the given edge-tts voices into the cwd (<voice>_<i>.mp3), then transcribe with tools/voice2/asr.py to compare. Result in README.md."""
import asyncio, edge_tts, os, sys
T = ['يا سلام! برافو عليك، عملتها من أول مرة!', 'قريب أوي! جرّب تاني وإنت هتعرفها.', 'إنت شايف إيه في الصورة دي يا عبودي؟', 'يلا بينا نلعب! أنا جاهز.']
V = sys.argv[1:]
async def one(v, i, t):
    out = f'{v}_{i}.mp3'
    for k in range(3):
        try:
            await edge_tts.Communicate(t, v, proxy=os.environ.get('HTTPS_PROXY')).save(out); return
        except Exception as e: err = repr(e)[:90]; await asyncio.sleep(1)
    print('FAIL', v, i, err)
async def main():
    await asyncio.gather(*[one(v, i, t) for v in V for i, t in enumerate(T)])
asyncio.run(main())
