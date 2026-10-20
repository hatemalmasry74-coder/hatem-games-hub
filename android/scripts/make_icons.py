#!/usr/bin/env python3
"""Generate the Android launcher icons + splash icon from the game's own cartoon avatars.
Output goes to android/app/src/main/res (committed; re-run only when the art changes).
  python3 scripts/make_icons.py [path/to/moody]      (needs Pillow)
Adaptive icon rules: 108dp canvas, only the centre 66dp circle is guaranteed visible -> artwork stays inside 66dp.
Only cartoon avatars are used (never photos)."""
import os, sys
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
MOODY = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, '..', '..', 'moody')
RES = os.path.join(HERE, '..', 'android', 'app', 'src', 'main', 'res')
NAVY = (11, 26, 51); BLUE = (31, 74, 140); GOLD = (255, 210, 60)

def face(name, box=(136, 60, 376, 300)):
    return Image.open(os.path.join(MOODY, 'assets', name)).convert('RGB').crop(box)

def circle(im, d, ring=0, ring_col=(255, 255, 255)):
    S = 4; D = d * S
    m = Image.new('L', (D, D), 0); ImageDraw.Draw(m).ellipse((0, 0, D - 1, D - 1), fill=255)
    out = Image.new('RGBA', (D, D), (0, 0, 0, 0))
    r = ring * S
    if r:
        ImageDraw.Draw(out).ellipse((0, 0, D - 1, D - 1), fill=ring_col + (255,))
        inner = im.resize((D - 2 * r, D - 2 * r), Image.LANCZOS)
        mm = Image.new('L', (D - 2 * r, D - 2 * r), 0); ImageDraw.Draw(mm).ellipse((0, 0, D - 2 * r - 1, D - 2 * r - 1), fill=255)
        out.paste(inner, (r, r), mm)
    else:
        out.paste(im.resize((D, D), Image.LANCZOS), (0, 0), m)
    return out.resize((d, d), Image.LANCZOS)

def foreground(px):
    """two avatars side by side, inside the 66dp safe circle (= 61% of the canvas)."""
    c = Image.new('RGBA', (px, px), (0, 0, 0, 0))
    unit = px / 108.0
    big = int(36 * unit); small = int(28 * unit); ring = max(2, int(1.6 * unit))
    a = circle(face('moody_cartoon.jpg'), big, ring)
    b = circle(face('aboody_cartoon.jpg'), small, ring)
    cx = px // 2
    # soft shadow
    sh = Image.new('RGBA', (px, px), (0, 0, 0, 0)); d = ImageDraw.Draw(sh)
    d.ellipse((cx - int(30 * unit), int(62 * unit), cx + int(30 * unit), int(70 * unit)), fill=(0, 0, 0, 70))
    c.alpha_composite(sh.filter(ImageFilter.GaussianBlur(unit * 2)))
    c.alpha_composite(b, (cx + int(1 * unit), int(48 * unit)))   # Aboody, right/lower
    c.alpha_composite(a, (cx - big + int(5 * unit), int(40 * unit) - int(6 * unit)))
    return c

def legacy(px, round_=False):
    """full-bleed legacy icon (API < 26): gradient + avatars"""
    bg = Image.new('RGBA', (px, px), NAVY + (255,)); g = ImageDraw.Draw(bg)
    for y in range(px):
        t = y / px; g.line((0, y, px, y), fill=tuple(int(NAVY[i] + (BLUE[i] - NAVY[i]) * t) for i in range(3)) + (255,))
    fg = foreground(int(px * 108 / 66 * 0.86)) if False else foreground(px * 108 // 80)
    off = (px - fg.size[0]) // 2
    bg.alpha_composite(fg, (off, off))
    m = Image.new('L', (px * 4, px * 4), 0); dm = ImageDraw.Draw(m)
    if round_: dm.ellipse((0, 0, px * 4 - 1, px * 4 - 1), fill=255)
    else: dm.rounded_rectangle((0, 0, px * 4 - 1, px * 4 - 1), radius=px * 4 // 5, fill=255)
    m = m.resize((px, px), Image.LANCZOS)
    out = Image.new('RGBA', (px, px), (0, 0, 0, 0)); out.paste(bg, (0, 0), m); return out

def save(im, path):
    os.makedirs(os.path.dirname(path), exist_ok=True); im.save(path, optimize=True)

dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for k, f in dens.items():
    d = os.path.join(RES, 'mipmap-' + k)
    save(foreground(int(108 * f)), os.path.join(d, 'ic_launcher_foreground.png'))
    save(legacy(int(48 * f)), os.path.join(d, 'ic_launcher.png'))
    save(legacy(int(48 * f), True), os.path.join(d, 'ic_launcher_round.png'))
# monochrome layer (Android 13 themed icons): silhouette of the two circles
for k, f in dens.items():
    px = int(108 * f); u = px / 108.0; m = Image.new('RGBA', (px, px), (0, 0, 0, 0)); d = ImageDraw.Draw(m)
    big = int(34 * u); small = int(28 * u); cx = px // 2
    d.ellipse((cx - big + int(5 * u), int(34 * u), cx + int(5 * u), int(34 * u) + big), fill=(0, 0, 0, 255))
    d.ellipse((cx + int(1 * u), int(48 * u), cx + int(1 * u) + small, int(48 * u) + small), fill=(0, 0, 0, 255))
    save(m, os.path.join(RES, 'mipmap-' + k, 'ic_launcher_monochrome.png'))
# splash icon: Android 12+ crops it to a circle of 2/3 of 288dp -> 192dp; we ship 288dp @xxxhdpi=1152? keep 576px (xxhdpi*2) transparent png
sp = Image.new('RGBA', (576, 576), (0, 0, 0, 0))
sp.alpha_composite(foreground(576 * 108 // 108), (0, 0))
save(sp, os.path.join(RES, 'drawable-nodpi', 'splash_icon.png'))
# Play Store 512 icon (no alpha required but allowed; keep opaque full square, Play applies its own mask)
store = legacy(512).convert('RGB') if False else None
big = Image.new('RGB', (512, 512), NAVY); g = ImageDraw.Draw(big)
for y in range(512):
    t = y / 512; g.line((0, y, 512, y), fill=tuple(int(NAVY[i] + (BLUE[i] - NAVY[i]) * t) for i in range(3)))
fg = foreground(512 * 108 // 80); big.paste(fg, ((512 - fg.size[0]) // 2, (512 - fg.size[1]) // 2), fg)
out = os.path.join(HERE, '..', '..', 'docs', 'play', 'assets', 'out'); os.makedirs(out, exist_ok=True)
big.save(os.path.join(out, 'icon_512.png'), optimize=True)
print('icons written to', os.path.normpath(RES))
