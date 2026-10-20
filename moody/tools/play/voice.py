#!/usr/bin/env python3
"""Play edition narration pipeline (NEUTRAL clips; pluggable providers; commercial-licence guard inherited from tools/family/voice.py).

  node tools/play/collect.js <outdir>                       collect every string the edition can speak   -> <outdir>.meta/voice_strings.json
  python3 tools/play/voice.py plan     <outdir>             what must be generated (neutral text differs from the base game's clips) + cost estimate
  python3 tools/play/voice.py gen      <outdir> --provider P [--reuse-base] [--limit N] [--gm-titles T,T] [--gf-titles T]
  python3 tools/play/voice.py script   <outdir>             recording script (csv + txt per speaker) for a studio / the owner's own voice
  python3 tools/play/voice.py import   <outdir> --speaker S --from DIR [--split]
  python3 tools/play/voice.py manifest <outdir>             rewrite assets/voice/manifest.json from the clips present
  python3 tools/play/voice.py check    <outdir>             JS-vs-Python hash agreement for every string and every title variant + missing clips

Why "neutral": a pre-generated clip cannot say the family's names.  Moody.voice.neutral = true (engine/voice.js) renders every role token as a neutral word
({a} -> يا بطل / الصغير, {aunt1} -> عمتو, {gm} -> the TITLE the parents chose ...); tools/voice_hash.py has the twin table.  Sentences without a role token keep their old text,
hence the same hash as the base game's clip (reusable, see --reuse-base); sentences with a token get a NEW hash and are generated.  The five grandmother titles and three grandfather
titles are VARIANTS (the title is spoken, so each title is a separate clip): --gm-titles / --gf-titles restrict which variants are generated (a title without clips is simply silent
on those lines).

Providers: azure (licensed, commercial use allowed under Azure terms; env AZURE_SPEECH_KEY, AZURE_SPEECH_REGION) | edge (Microsoft Edge read-aloud: NOT licensed for commercial use ->
refuses without --preview; use it for the owner's own free / pre-release tests only) | recordings (script + import).  The Play release must NOT ship Edge clips.
"""
import argparse, importlib.util, itertools, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..'))
from voice_hash import normalize, voice_hash                        # tools/voice_hash.py (neutral rendering lives there)
_spec = importlib.util.spec_from_file_location('fam_voice', os.path.join(HERE, '..', 'family', 'voice.py'))
FV = importlib.util.module_from_spec(_spec); _spec.loader.exec_module(FV)

GM_TITLES = ['جدتي', 'تيتة', 'ننا', 'ستو', 'ماما']; GF_TITLES = ['جدو', 'سيدو', 'جدي']          # = Moody.family.GM_TITLES / GF_TITLES (engine/family.js)
OPTS = {'gm': GM_TITLES, 'gf': GF_TITLES}

def variants(item):
    raw = item.get('raw') or item['text']
    has_gm = any(t in raw for t in ('{gm}', '{gmt}', '{gmn}')); has_gf = any(t in raw for t in ('{gf}', '{gft}'))
    gms = OPTS['gm'] if has_gm else [None]; gfs = OPTS['gf'] if has_gf else [None]
    for g, f in itertools.product(gms, gfs):
        titles = {}
        if g: titles['gm'] = g
        if f: titles['gf'] = f
        say = normalize(raw, True, titles)
        yield dict(item, say=say, text=say, hash=voice_hash(raw, True, titles), titles=titles)

class Ctx(FV.Ctx):
    def __init__(self, out):
        self.out = os.path.abspath(out); self.meta = self.out + '.meta'
        if not os.path.isdir(self.out): sys.exit('not a folder: ' + self.out)
        self.defaults = {}
        self.vdir = os.path.join(self.out, 'assets', 'voice'); os.makedirs(self.vdir, exist_ok=True)
    def strings(self):
        p = os.path.join(self.meta, 'voice_strings.json')
        if not os.path.exists(p): sys.exit('missing %s - run: node tools/play/collect.js %s' % (p, self.out))
        out = []; seen = set()
        for it in json.load(open(p, encoding='utf-8')):
            for v in variants(it):
                if v['hash'] in seen: continue
                seen.add(v['hash']); out.append(v)
        return out
FV.Ctx = Ctx

def cmd_check(a):
    """the strings were hashed by the JS engine (collect.js) for the default titles: the Python twin must agree for every string"""
    ctx = Ctx(a.out); raw = json.load(open(os.path.join(ctx.meta, 'voice_strings.json'), encoding='utf-8'))
    bad = [i for i in raw if voice_hash(i['raw'], True, {}) != i['hash']]
    items = ctx.strings()
    print('strings: %d | variants (titles): %d | JS-vs-Python mismatches: %d | clips present: %d | missing: %d' % (len(raw), len(items), len(bad), sum(ctx.have(i['hash']) for i in items), sum(not ctx.have(i['hash']) for i in items)))
    for i in bad[:10]: print('  MISMATCH', i['hash'], voice_hash(i['raw'], True, {}), i['raw'][:60])
    sys.exit(1 if bad else 0)

def cmd_gen(a):
    """edge (PREVIEW ONLY) runs ONE asyncio loop with the voice-v2 synthesiser (like tools/gen_voice.py); other providers use the family pipeline unchanged"""
    if a.provider != 'edge': return FV.cmd_gen(a)
    if not a.preview:
        print('REFUSED: the Microsoft Edge read-aloud service is NOT licensed for commercial use.\nUse it only for the owner\'s private previews (add --preview) and never ship its output in the Play release.\n'
              'For the release use --provider azure (licensed) or recordings (script/import).', file=sys.stderr); sys.exit(3)
    print('WARNING: edge provider = preview only. Do NOT ship these clips in the Play release.', file=sys.stderr)
    import asyncio, shutil
    ctx = Ctx(a.out); items, need = FV.todo(ctx, a.all)
    if a.reuse_base:
        n = 0; bp = ctx.base_pairs()
        for i in items:
            src = os.path.join(FV.BASE_VOICE_DIR, i['hash'] + '.mp3')
            if (i['hash'], i['speaker']) in bp and os.path.exists(src) and not ctx.have(i['hash']): shutil.copyfile(src, ctx.clip(i['hash'])); n += 1
        print('reused %d unchanged clips from the base game (NOT licensed for commercial use, see README)' % n)
    need = [i for i in need if not ctx.have(i['hash'])]
    if a.speaker: need = [i for i in need if i['speaker'] == a.speaker]
    if a.limit: need = need[:a.limit]
    print('generating %d clips (%d characters) with edge (voice v2) ...' % (len(need), sum(len(i['say']) for i in need)), flush=True)
    sys.path.insert(0, os.path.join(HERE, '..', 'voice2')); import synth, time
    proxy = os.environ.get('HTTPS_PROXY')
    async def run():
        synth.set_concurrency(a.workers); sem = asyncio.Semaphore(a.workers * 2); st = {'ok': 0, 'fail': 0}; t0 = time.time()
        async def one(i):
            async with sem:
                for k in range(3):
                    try:
                        x, _ = await synth.build(i['say'], i['speaker'], emo=i.get('emo'), seed=int(i['hash'], 16) & 0xffffffff, proxy=proxy)
                        await asyncio.get_running_loop().run_in_executor(synth.POOL, synth.encode, x, ctx.clip(i['hash']), 40); st['ok'] += 1; break
                    except Exception as e:
                        if k == 2: st['fail'] += 1; print('FAIL', i['hash'], i['say'][:40], repr(e)[:80], flush=True)
                        else: await asyncio.sleep(1 + 2 * k)
                if (st['ok'] + st['fail']) % 50 == 0: print('%d/%d  fails %d  %.0fs' % (st['ok'] + st['fail'], len(need), st['fail'], time.time() - t0), flush=True)
        await asyncio.gather(*[one(i) for i in need]); return st
    st = asyncio.run(run()); print('done: %d ok, %d failed' % (st['ok'], st['fail'])); FV.cmd_manifest(a)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    def add(name, fn):
        p = sp.add_parser(name); p.add_argument('out', help='folder built by tools/play/build.js'); p.set_defaults(fn=fn); p.add_argument('--all', action='store_true', help='ignore the base game: every string')
        p.add_argument('--gm-titles', help='comma list of grandmother titles to generate (default: all five)'); p.add_argument('--gf-titles', help='comma list of grandfather titles (default: all three)'); return p
    add('plan', FV.cmd_plan); add('manifest', FV.cmd_manifest); add('check', cmd_check); add('script', FV.cmd_script)
    g = add('gen', cmd_gen); g.add_argument('--provider', required=True); g.add_argument('--preview', action='store_true', help='required for edge: preview only (NOT licensed for commercial use)'); g.add_argument('--reuse-base', action='store_true')
    g.add_argument('--speaker'); g.add_argument('--limit', type=int); g.add_argument('--yes', action='store_true'); g.add_argument('--workers', type=int, default=6)
    i = add('import', FV.cmd_import); i.add_argument('--speaker', required=True); i.add_argument('--from', dest='src', required=True); i.add_argument('--split', action='store_true'); i.add_argument('--silence-db', default='-38'); i.add_argument('--min-silence', default='0.9')
    a = ap.parse_args()
    if a.gm_titles: OPTS['gm'] = [t.strip() for t in a.gm_titles.split(',') if t.strip()]
    if a.gf_titles: OPTS['gf'] = [t.strip() for t in a.gf_titles.split(',') if t.strip()]
    a.fn(a)

if __name__ == '__main__':
    main()
