"""Speaker profiles for the v2 pipeline. voice/rate/pitch = the same base as the v1 pipeline (so every role keeps its identity),
   pause = multiplier of the punctuation pauses, var = how strongly the per-clip random variation applies (kids vary more)."""
M = 'ar-EG-ShakirNeural'; F = 'ar-EG-SalmaNeural'
PROFILES = {   # voice, rate %, pitch Hz, pause scale, variation scale
 'narrator': (F, 0, 0, 1.00, 1.0), 'mama': (F, -4, -3, 1.05, 1.0), 'baba': (M, -2, -2, 1.05, 1.0),
 'boy_big': (M, 2, 22, 0.90, 1.2), 'boy_small': (M, 4, 38, 0.85, 1.3),
 'girl_big': (F, 2, 8, 0.92, 1.2), 'girl_small': (F, 4, 20, 0.85, 1.3), 'nana': (F, -12, -14, 1.30, 0.8),
 'boy_mid': (M, 2, 14, 0.92, 1.2), 'girl_tiny': (F, 8, 32, 0.80, 1.4), 'boy_tiny': (M, 8, 48, 0.80, 1.4),
 'aunt_a': (F, 1, 3, 1.0, 1.0), 'aunt_n': (F, -2, -7, 1.05, 1.0), 'teen_a': (M, 2, 10, 0.92, 1.1), 'teen_b': (M, 0, 5, 0.95, 1.0), 'uncle': (M, 0, 1, 1.0, 1.0)}
# emotion class -> (rate delta %, pitch delta Hz, volume delta %)
EMO = {'neutral': (0, 0, 0), 'question': (-2, 3, 0), 'excl': (4, 5, 3), 'praise': (-1, 5, 2), 'warm': (-3, 3, 0),
       'gentle': (-7, -5, -6), 'tip': (-4, -2, -8), 'excited': (7, 8, 4), 'calm': (-5, -3, -2), 'sad': (-9, -7, -8)}
