# Voice v2 pipeline (tools/voice2)

`python3 tools/gen_voice.py` now uses this pipeline by default (`--v1` = the old flat one). Resumable and idempotent: a clip is (re)generated only when its mp3 is
missing or `tools/voice2/ledger.json` has no entry with the current pipeline tag (`synth.VERSION : speaker : emo : kbps`). Bump `VERSION` in `synth.py`
to force a global re-render after you change the prosody settings. Needs `edge-tts numpy pyloudnorm av` + ffmpeg; in the sandbox
`SSL_CERT_FILE=/root/.ccr/ca-bundle.crt` and `HTTPS_PROXY`. Concurrency: `--concurrency 6` (edge-tts calls), `V2_THREADS=6` (audio post-processing threads).

## What v2 does (synth.py)
1. `emo.py` infers an emotion class from the text (or `voice_strings.json` carries an explicit `"emo"`, set by `content/reactions.js` via `collect_voice.js`):
   neutral question excl praise warm gentle tip excited calm sad. Long factual question stems (> 90 chars) stay neutral (clarity first).
2. The text is split into phrases at `. ! ؟ ، ؛ : … ..` (tiny fragments are merged, max 5 phrases). Very short lines (<= 24 letters) and comma lists ("٥، ١٠، ١٥") stay ONE utterance (splitting them hurt whisper-WER).
3. One edge-tts request per phrase with its own rate / pitch / volume: speaker profile (`profiles.py`, identical base as v1) + emotion delta + punctuation
   (`!` brisker/higher, `؟` slightly higher, `..` slower/lower, `،` carries on) + a gentle pitch declination over the phrases + a deterministic per-clip random jitter
   (seeded by the clip hash; pitch +-3 Hz, rate +-1.2 %, bigger for the kids) so near-identical lines never sound identical.
4. Each phrase: decode (PyAV) -> silence trimmed (-46 dB) -> 6 ms fades.
5. Natural pauses between phrases: 280/300/320 ms after `. ! ؟`, 150 after `،`, 380 after `..`, 80 for none; x speaker scale (Nana 1.3, kids 0.85), x random 0.78-1.28 + jitter.
   Pauses < 75 ms are replaced by a 14 ms crossfade.
6. Questions: the last 260 ms get a small speed ramp (+4..6 %) = audible end-rise.
7. Light polish (ffmpeg): high-pass 70 Hz, +1.6 dB warmth at 190 Hz, de-esser, -1.5 dB at 6.8 kHz, gentle 2:1 compressor.
8. Loudness: integrated -18 LUFS (pyloudnorm, BS.1770) + -2 dBFS peak limit. Encode: mono 24 kHz mp3, 40 kbps.

## Tools
* `compare.py`  old vs new objective report (WER/CER with faster-whisper small, pauses, f0 via parselmouth, LUFS, size).
* `samples.py`  listening set (same text old vs new, by role) -> scratchpad/voice_samples.
* `hooks_test.js` checks that every reaction line the game can pick, and every line spoken during a bot play-through, has a clip.
* `probe_voices.py` voice survey (see below).

## Voice survey (edge-tts, 4 test sentences, whisper-small WER; lower = more intelligible; whisper-small itself is weak on Egyptian Arabic so only differences matter)
ar-EG Salma 0.37, ar-EG Shakir 0.42, ar-SA Hamed 0.32, ar-SA Zariyah 0.38, ar-AE Fatima 0.42 (= ar-LB Layla 0.48, same model family), ar-JO Sana 0.45,
the *Multilingual* voices (en-US Andrew/Ava/Brian/Emma, fr-FR Remy/Vivienne, de-DE Florian/Seraphina, en-AU William) do read Arabic (WER 0.28-0.48) but with a foreign accent / wrong dialect.
Conclusion: only ar-EG voices speak Egyptian; the other locales read the colloquial text in a Gulf / Levantine accent. Kept Salma + Shakir for all roles (a Saudi male voice for Baba
would be thematically possible - he lives in Abha - but it would say Egyptian words with a Saudi accent).

## Tuning knobs (env, defaults = shipped values; any change needs a VERSION bump in synth.py to re-render)
`V2_EMO_RATE=0.4` (share of the emotion rate delta; pitch/volume deltas are 1.0), `V2_RATE_JIT=1.2` (+-% rate jitter), `V2_SHORT=24` (letters below which a line is not split),
`V2_BANG_RATE=0.5` (extra rate on `!` phrases). History: first setting (0.4 -> 1.0, 2.2, 12, 2) gave WER 0.437 vs 0.400 (old) on 50 short reaction lines; the conservative values gave 0.384.
