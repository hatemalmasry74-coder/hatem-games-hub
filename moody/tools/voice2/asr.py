#!/usr/bin/env python3
"""Objective intelligibility helpers: faster-whisper ('small', CPU int8) transcription + Arabic-normalised WER/CER.
   Used by compare.py. Library: from asr import Asr, wer."""
import re, os, subprocess
import numpy as np
def load16k(path):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', path, '-f', 's16le', '-ac', '1', '-ar', '16000', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.int16).astype(np.float32) / 32768.0
def norm_ar(s):
    s = re.sub('[ً-ٰٟـ]', '', s or '')
    s = s.replace('أ', 'ا').replace('إ', 'ا').replace('آ', 'ا').replace('ى', 'ي').replace('ة', 'ه').replace('ؤ', 'و').replace('ئ', 'ي')
    s = s.translate(str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789'))
    s = re.sub(r'[^\w\s]|_', ' ', s)
    return re.sub(r'\s+', ' ', s).strip()
def _ed(a, b):
    d = list(range(len(b) + 1))
    for i in range(1, len(a) + 1):
        p, d[0] = d[0], i
        for j in range(1, len(b) + 1):
            c = d[j]; d[j] = min(d[j] + 1, d[j - 1] + 1, p + (a[i - 1] != b[j - 1])); p = c
    return d[len(b)]
def wer(ref, hyp):
    r, h = norm_ar(ref).split(), norm_ar(hyp).split()
    return _ed(r, h) / max(1, len(r))
def cer(ref, hyp):
    r, h = norm_ar(ref).replace(' ', ''), norm_ar(hyp).replace(' ', '')
    return _ed(r, h) / max(1, len(r))
class Asr:
    def __init__(self, model='small'):
        from faster_whisper import WhisperModel
        self.m = WhisperModel(model, device='cpu', compute_type='int8', cpu_threads=int(os.environ.get('ASR_THREADS', '2')))
    def __call__(self, path):
        segs, _ = self.m.transcribe(load16k(path) if isinstance(path, str) else path, language='ar', beam_size=1, vad_filter=False, condition_on_previous_text=False)
        return ' '.join(s.text for s in segs).strip()
