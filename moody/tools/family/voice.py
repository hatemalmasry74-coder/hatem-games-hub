#!/usr/bin/env python3
"""Family Edition narration pipeline (pluggable providers).

  python3 tools/family/voice.py plan     <outdir>                      what changed vs the base edition + cost estimate
  python3 tools/family/voice.py gen      <outdir> --provider P [...]   generate clips (P = azure | edge[--preview only])
  python3 tools/family/voice.py script   <outdir> [--all]              recording script for the parents (csv + txt per speaker)
  python3 tools/family/voice.py import   <outdir> --speaker S --from DIR [--split] [--all]   recorded files -> <hash>.mp3
  python3 tools/family/voice.py manifest <outdir>                      rewrite assets/voice/manifest.json from the clips present
  python3 tools/family/voice.py check    <outdir>                      JS-vs-Python hash agreement + missing clips

<outdir> is a folder produced by build.js; metadata lives in <outdir>.meta/ (defaults.json from build.js, voice_strings.json from
collect.js: `node tools/family/collect.js <outdir>`).

Only strings whose hash is NOT in the base edition's tools/voice_strings.json are (re)generated: the same sentence has the same hash,
and any sentence that contains a name, the school, a floor or the destination gets a new hash.  Costs stay low (typically a few
thousand characters for the changed lines).  Use --all to regenerate everything (see README: the base clips are NOT cleared for commercial
reuse because they were made with the Edge read-aloud service).

Providers
  azure   Azure AI Speech REST (licensed, commercial use allowed under Azure terms).  Env: AZURE_SPEECH_KEY, AZURE_SPEECH_REGION.
          Voices ar-EG-ShakirNeural (male) / ar-EG-SalmaNeural (female).  Never called by the tests (no key).
  edge    Microsoft Edge read-aloud (edge-tts).  NOT licensed for commercial use -> DEV/PREVIEW ONLY, refuses without --preview.
  recordings  no TTS: `script` + `import` (parents' own voices, recommended for a keepsake).
"""
import argparse, concurrent.futures as cf, csv, json, os, re, shutil, subprocess, sys, tempfile, time, urllib.request

HERE = os.path.dirname(os.path.abspath(__file__))
BASE_ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BASE_STRINGS = os.path.join(BASE_ROOT, 'tools', 'voice_strings.json')
BASE_VOICE_DIR = os.path.join(BASE_ROOT, 'assets', 'voice')      # read-only source of unchanged clips (--reuse-base)

# speaker id -> (voice, rate %, pitch Hz).  The base game's voice-v2 profiles (tools/voice2/profiles.py) are the source of truth when importable
# (so a customer edition sounds like the owner's), with this inline copy as a fallback.
VOICE2 = os.path.join(BASE_ROOT, 'tools', 'voice2')
M = 'ar-EG-ShakirNeural'; F = 'ar-EG-SalmaNeural'
VOICES = {'narrator': (F, 0, 0), 'mama': (F, -4, -3), 'baba': (M, -2, -2), 'boy_big': (M, 2, 22), 'boy_small': (M, 4, 38),
          'girl_big': (F, 2, 8), 'girl_small': (F, 4, 20), 'nana': (F, -12, -14)}
EMO_DELTA = {'neutral': (0, 0), 'question': (-2, 3), 'excl': (4, 5), 'praise': (-1, 5), 'warm': (-3, 3), 'gentle': (-7, -5), 'tip': (-4, -2), 'excited': (7, 8), 'calm': (-5, -3), 'sad': (-9, -7)}
try:
    sys.path.insert(0, VOICE2)
    import profiles as _pf
    VOICES = {k: (v[0], v[1], v[2]) for k, v in _pf.PROFILES.items()}; EMO_DELTA = {k: (v[0], v[1]) for k, v in _pf.EMO.items()}
except Exception:
    pass
SPEAKER_LABEL = {'narrator': 'الراوي', 'mama': 'ماما', 'baba': 'بابا', 'boy_big': 'ولد كبير', 'boy_small': 'ولد صغير', 'girl_big': 'بنت كبيرة', 'girl_small': 'بنت صغيرة', 'nana': 'الجدة', 'boy_mid': 'صديق'}
AZURE_USD_PER_MILLION_CHARS = 16.0     # approximate neural price; CHECK the current Azure pricing page before quoting a customer

# ----------------------------------------------------------------------------- hash (twin of Moody.voice.hash, with per-edition default names)
def normalize(s, d):
    s = s or ''
    for k, v in (('{m}', d['m']), ('{a}', d['a']), ('{t}', d['t']), ('{n}', d['n']), ('{me}', d.get('me', 'يا بطل'))):
        s = s.replace(k, v)
    s = re.sub(r'[ \t\r\n ]+', ' ', s).strip()
    return re.sub('[ً-ٰٟـ]', '', s)

def _fnv(b, h):
    for x in b:
        h ^= x
        h = (h * 0x01000193) & 0xFFFFFFFF
    return h

def vhash(text, d):
    b = normalize(text, d).encode('utf-8')
    return ('%08x%08x' % (_fnv(b, 0x811c9dc5), _fnv(b, 0x9747b28c)))[:12]

# ----------------------------------------------------------------------------- loading
class Ctx:
    def __init__(self, out):
        self.out = os.path.abspath(out); self.meta = self.out + '.meta'
        if not os.path.isdir(self.out): sys.exit('not a folder: ' + self.out)
        p = os.path.join(self.meta, 'defaults.json')
        if not os.path.exists(p): sys.exit('missing %s - build the edition with tools/family/build.js first' % p)
        self.defaults = json.load(open(p, encoding='utf-8'))['names']
        self.vdir = os.path.join(self.out, 'assets', 'voice'); os.makedirs(self.vdir, exist_ok=True)

    def strings(self):
        p = os.path.join(self.meta, 'voice_strings.json')
        if not os.path.exists(p): sys.exit('missing %s - run: node tools/family/collect.js %s' % (p, self.out))
        items = json.load(open(p, encoding='utf-8'))
        for i in items: i['say'] = normalize(i['text'], self.defaults)
        return items

    def base_pairs(self):
        """(hash, voice-id) pairs of the base edition: the same sentence by a DIFFERENT voice (e.g. a boy hero that became a girl) must be regenerated"""
        return {(i['hash'], i['speaker']) for i in json.load(open(BASE_STRINGS, encoding='utf-8'))}

    def base_hashes(self):
        return {h for h, _ in self.base_pairs()}

    def clip(self, h): return os.path.join(self.vdir, h + '.mp3')
    def have(self, h): p = self.clip(h); return os.path.exists(p) and os.path.getsize(p) > 500

def todo(ctx, all_=False, reuse_base=False):
    items = ctx.strings(); base = ctx.base_pairs()
    seen = set(); res = []
    for i in items:
        if i['hash'] in seen: continue
        seen.add(i['hash'])
        if all_ or (i['hash'], i['speaker']) not in base: res.append(i)
    return items, res

# ----------------------------------------------------------------------------- audio post-processing (same chain as tools/gen_voice.py)
FILTER = 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse,loudnorm=I=-18:TP=-2'
def to_clip(src, dst):
    r = subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', src, '-af', FILTER, '-ac', '1', '-ar', '24000', '-b:a', '32k', dst], capture_output=True, text=True)
    if r.returncode != 0: raise RuntimeError('ffmpeg: ' + r.stderr[-300:])

# ----------------------------------------------------------------------------- providers
def synth_azure(it, dst):
    key = os.environ.get('AZURE_SPEECH_KEY'); region = os.environ.get('AZURE_SPEECH_REGION')
    if not key or not region: raise SystemExit('azure provider: set AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in the environment')
    voice, rate, pitch = VOICES.get(it['speaker'], VOICES['narrator']); dr, dp = EMO_DELTA.get(it.get('emo') or 'neutral', (0, 0))
    rate = rate + dr * 0.4; pitch = pitch + dp       # same emotion deltas as voice v2 (rate share 0.4)
    esc = it['say'].replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;')
    ssml = ('<speak version="1.0" xml:lang="ar-EG" xmlns="http://www.w3.org/2001/10/synthesis"><voice name="%s"><prosody rate="%+.0f%%" pitch="%+.0fHz">%s</prosody></voice></speak>' % (voice, rate, pitch, esc)).encode('utf-8')
    req = urllib.request.Request('https://%s.tts.speech.microsoft.com/cognitiveservices/v1' % region, data=ssml, method='POST', headers={
        'Ocp-Apim-Subscription-Key': key, 'Content-Type': 'application/ssml+xml', 'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3', 'User-Agent': 'family-edition-builder'})
    with urllib.request.urlopen(req, timeout=60) as r: data = r.read()    # urllib honours HTTPS_PROXY / SSL_CERT_FILE
    with open(dst, 'wb') as f: f.write(data)
    return False     # raw mp3: needs to_clip()

def synth_edge(it, dst):
    """PREVIEW ONLY. Uses the base game's voice-v2 synthesiser (phrase-level prosody) when its dependencies exist, else a flat edge-tts call."""
    import asyncio
    proxy = os.environ.get('HTTPS_PROXY')
    try:
        import synth                                  # tools/voice2/synth.py (needs numpy, pyloudnorm, av)
        async def go():
            x, _ = await synth.build(it['say'], it['speaker'], emo=it.get('emo'), seed=int(it['hash'], 16) & 0xffffffff, proxy=proxy)
            await asyncio.get_running_loop().run_in_executor(synth.POOL, synth.encode, x, dst, 40)
        asyncio.run(go()); return True                # already polished mp3
    except ImportError:
        import edge_tts
        voice, rate, pitch = VOICES.get(it['speaker'], VOICES['narrator'])
        asyncio.run(edge_tts.Communicate(it['say'], voice, rate='%+d%%' % rate, pitch='%+dHz' % pitch, proxy=proxy).save(dst)); return False

PROVIDERS = {'azure': synth_azure, 'edge': synth_edge}

def gen_one(args):
    ctx, it, fn = args
    out = ctx.clip(it['hash'])
    if ctx.have(it['hash']): return it, 'skip', None
    err = None
    for k in range(4):
        try:
            tmp = out + '.tmp.mp3'; done = fn(it, tmp)
            if done: os.replace(tmp, out)
            else: to_clip(tmp, out); os.remove(tmp)
            return it, 'ok', None
        except SystemExit: raise
        except Exception as e:
            err = e; time.sleep(1 + 2 * k)
    return it, 'fail', repr(err)[:160]

# ----------------------------------------------------------------------------- commands
def cmd_plan(a):
    ctx = Ctx(a.out); items, need = todo(ctx, a.all)
    chars = sum(len(i['say']) for i in need); by = {}
    for i in need: by.setdefault(i['speaker'], [0, 0]); by[i['speaker']][0] += 1; by[i['speaker']][1] += len(i['say'])
    print('strings in this edition        : %d' % len({i["hash"] for i in items}))
    print('same sentence AND voice as base: %d  (reusable clip)' % (len({i["hash"] for i in items}) - len(todo(ctx, False)[1])))
    print('to generate / record%s : %d strings, %d characters' % (' (--all)' if a.all else '', len(need), chars))
    for s, (n, c) in sorted(by.items()): print('   %-10s %5d lines %7d chars' % (s, n, c))
    print('Azure neural estimate: about $%.2f at $%.0f per 1M characters (check current pricing). Free tier / credits may cover it.' % (chars / 1e6 * AZURE_USD_PER_MILLION_CHARS, AZURE_USD_PER_MILLION_CHARS))
    json.dump([{'hash': i['hash'], 'speaker': i['speaker'], 'emo': i.get('emo'), 'text': i['say']} for i in need], open(os.path.join(ctx.meta, 'voice_todo.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('list written to', os.path.join(ctx.meta, 'voice_todo.json'))

def cmd_gen(a):
    if a.provider == 'edge':
        if not a.preview:
            print('REFUSED: the Microsoft Edge read-aloud service is NOT licensed for commercial use.\n'
                  'Use it only for private previews (add --preview) and never ship its output in a product you sell.\n'
                  'For customers use --provider azure (licensed) or the parents\' own recordings (script/import).', file=sys.stderr); sys.exit(3)
        print('WARNING: edge provider = preview only. Do NOT deliver these clips to a paying customer.', file=sys.stderr)
    if a.provider not in PROVIDERS: sys.exit('provider must be one of: azure, edge (or use script/import for recordings)')
    ctx = Ctx(a.out); items, need = todo(ctx, a.all)
    if a.reuse_base:
        n = 0
        for i in items:
            src = os.path.join(BASE_VOICE_DIR, i['hash'] + '.mp3')
            if (i['hash'], i['speaker']) in ctx.base_pairs() and os.path.exists(src) and not ctx.have(i['hash']): shutil.copyfile(src, ctx.clip(i['hash'])); n += 1
        print('reused %d unchanged clips from the base edition (check licence note in README before selling!)' % n)
    need = [i for i in need if not ctx.have(i['hash'])]
    if a.speaker: need = [i for i in need if i['speaker'] == a.speaker]
    if a.limit: need = need[:a.limit]
    chars = sum(len(i['say']) for i in need)
    print('generating %d clips (%d characters) with %s ...' % (len(need), chars, a.provider))
    if a.provider == 'azure' and not a.yes and chars > 0:
        print('estimated Azure cost about $%.2f. Re-run with --yes to proceed.' % (chars / 1e6 * AZURE_USD_PER_MILLION_CHARS)); return
    fn = PROVIDERS[a.provider]; ok = fail = 0
    with cf.ThreadPoolExecutor(max_workers=a.workers) as ex:
        for it, st, err in ex.map(gen_one, [(ctx, i, fn) for i in need]):
            if st == 'fail': fail += 1; print('FAIL', it['hash'], it['say'][:40], err)
            else: ok += 1
    print('done: %d ok, %d failed' % (ok, fail)); cmd_manifest(a)

def cmd_manifest(a):
    ctx = Ctx(a.out); items = ctx.strings(); m = {}
    for i in items:
        if ctx.have(i['hash']): m[i['hash']] = {'voice': i['speaker'], 'text': i['text']}
    json.dump(m, open(os.path.join(ctx.vdir, 'manifest.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
    print('manifest: %d clips listed of %d strings (missing clips are simply silent in the game)' % (len(m), len({i['hash'] for i in items})))

def cmd_check(a):
    ctx = Ctx(a.out); items = ctx.strings(); bad = [i for i in items if vhash(i['text'], ctx.defaults) != i['hash']]
    print('strings: %d | hash mismatches JS vs python: %d | clips present: %d | missing: %d' % (len(items), len(bad), sum(ctx.have(i['hash']) for i in items), sum(not ctx.have(i['hash']) for i in items)))
    for i in bad[:10]: print('  MISMATCH', i['hash'], vhash(i['text'], ctx.defaults), i['text'][:60])
    sys.exit(1 if bad else 0)

def script_lines(ctx, all_):
    _, need = todo(ctx, all_); by = {}
    for i in need: by.setdefault(i['speaker'], []).append(i)
    return by

def cmd_script(a):
    ctx = Ctx(a.out); by = script_lines(ctx, a.all); d = os.path.join(ctx.meta, 'recording-script'); os.makedirs(d, exist_ok=True)
    for s, lst in sorted(by.items()):
        with open(os.path.join(d, s + '.csv'), 'w', newline='', encoding='utf-8-sig') as f:
            w = csv.writer(f); w.writerow(['n', 'speaker', 'hash', 'text_to_read', 'approx_seconds'])
            for k, i in enumerate(lst, 1): w.writerow([k, s, i['hash'], i['say'], max(1, round(len(i['say']) / 14))])
        with open(os.path.join(d, s + '.txt'), 'w', encoding='utf-8') as f:
            f.write('الصوت: %s  (%s)   عدد الجمل: %d\nاقرأ كل جملة بصوت واضح وبطيء شوية، ثم اسكت ثانيتين قبل التالية. لا تتخطَّ أي جملة.\n\n' % (SPEAKER_LABEL.get(s, s), s, len(lst)))
            for k, i in enumerate(lst, 1): f.write('%d. %s\n' % (k, i['say']))
        print('%-10s %4d lines -> %s/%s.{csv,txt}' % (s, len(lst), d, s))
    print('Record each speaker in ONE take (a long file with ~2 s pauses) or one file per line, in this exact order, then:\n  python3 tools/family/voice.py import %s --speaker <id> --from <folder-or-file> [--split]' % ctx.out)

def silence_split(path, db, mind):
    r = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'silencedetect=noise=%sdB:d=%s' % (db, mind), '-f', 'null', '-'], capture_output=True, text=True)
    starts = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', r.stderr)]; ends = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', r.stderr)]
    dur = re.search(r'Duration: (\d+):(\d+):([\d.]+)', r.stderr); total = int(dur.group(1)) * 3600 + int(dur.group(2)) * 60 + float(dur.group(3))
    segs = []; cur = 0.0
    for s, e in zip(starts, ends + [None] * (len(starts) - len(ends))):
        if s - cur > 0.25: segs.append((cur, s))
        cur = e if e is not None else total
    if total - cur > 0.25: segs.append((cur, total))
    return segs

def cmd_import(a):
    ctx = Ctx(a.out); by = script_lines(ctx, a.all)
    if a.speaker not in by: sys.exit('no lines to record for speaker "%s" (known: %s)' % (a.speaker, ', '.join(sorted(by))))
    lines = by[a.speaker]; src = os.path.abspath(a.src)
    tmpd = tempfile.mkdtemp(prefix='fam_import_'); files = []
    if a.split:
        if not os.path.isfile(src): sys.exit('--split expects ONE long recording file')
        for k, (s, e) in enumerate(silence_split(src, a.silence_db, a.min_silence)):
            p = os.path.join(tmpd, '%04d.wav' % k); subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-ss', str(max(0, s - 0.1)), '-to', str(e + 0.1), '-i', src, p], check=True); files.append(p)
    else:
        if os.path.isdir(src): files = sorted((os.path.join(src, f) for f in os.listdir(src) if re.search(r'\.(m4a|mp3|wav|ogg|opus|aac|caf|flac|amr|3gp|webm)$', f, re.I)), key=lambda p: [int(t) if t.isdigit() else t.lower() for t in re.split(r'(\d+)', os.path.basename(p))])
        else: files = [src]
    if len(files) != len(lines):
        print('COUNT MISMATCH: %d recorded pieces but the script for "%s" has %d lines. Nothing imported.' % (len(files), a.speaker, len(lines)), file=sys.stderr)
        if a.split: print('Tune --silence-db (e.g. -35) / --min-silence (e.g. 1.2) or re-record with longer pauses.', file=sys.stderr)
        sys.exit(4)
    for f, it in zip(files, lines):
        to_clip(f, ctx.clip(it['hash']))
    shutil.rmtree(tmpd, ignore_errors=True)
    print('imported %d clips for %s (matched by ORDER with %s)' % (len(lines), a.speaker, os.path.join(ctx.meta, 'recording-script', a.speaker + '.csv'))); cmd_manifest(a)

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    sp = ap.add_subparsers(dest='cmd', required=True)
    def add(name, fn, **kw):
        p = sp.add_parser(name); p.add_argument('out', help='folder built by build.js'); p.set_defaults(fn=fn); p.add_argument('--all', action='store_true', help='ignore the base edition: every string'); return p
    add('plan', cmd_plan); add('manifest', cmd_manifest); add('check', cmd_check); add('script', cmd_script)
    g = add('gen', cmd_gen); g.add_argument('--provider', required=True); g.add_argument('--preview', action='store_true', help='required for edge: preview only'); g.add_argument('--reuse-base', action='store_true'); g.add_argument('--speaker'); g.add_argument('--limit', type=int); g.add_argument('--workers', type=int, default=4); g.add_argument('--yes', action='store_true', help='azure: confirm the estimated cost')
    i = add('import', cmd_import); i.add_argument('--speaker', required=True); i.add_argument('--from', dest='src', required=True); i.add_argument('--split', action='store_true'); i.add_argument('--silence-db', default='-38'); i.add_argument('--min-silence', default='1.0')
    a = ap.parse_args(); a.fn(a)

if __name__ == '__main__':
    main()
