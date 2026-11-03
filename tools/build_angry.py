"""Make the 'angry' animation (PNG frames only) from each set's 'failed' frames.

The Codex spritesheets have no angry row, so this one is made here: her pout
from 'failed', leaning in towards you (the top of her drawn larger, as if
nearer) with a stamp of the foot, and the anger symbol (Twemoji's U+1F4A2,
tools/assets/twemoji-1f4a2.png, CC-BY 4.0) throbbing beside her head.
Written to plugin/assets/<set>/angry/<n>.png and <n>-bust.png, the same sizes
and frame count as 'failed', so the mod swaps them in place. Character-cell
mode has no angry frames: it draws 'failed' instead.

Usage (needs Pillow and NumPy):
    uv run --with pillow --with numpy python tools/build_angry.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SETS = ("smooth", "classic")
# Per frame: how far she leans in (the top drawn this much wider), the stomp
# (pixels up), and the symbol's scale. Two beats: lean in and stamp, ease back.
LEAN = [0.08, 0.14, 0.18, 0.14, 0.08, 0.14, 0.18, 0.11]
STOMP = [0, 3, 0, 2, 0, 3, 0, 1]
# Which 'failed' frame each angry frame starts from: the open-eyed pouts only
# (the others close her eyes, which reads as sleepy, not cross).
SOURCE = [0, 1, 2, 2, 1, 0, 1, 2]
THROB = [1.0, 1.2, 1.3, 1.15, 1.0, 1.2, 1.3, 1.1]
MARK = Path(__file__).resolve().parent / "assets" / "twemoji-1f4a2.png"
MARK_EDGE = (255, 244, 236, 255)  # a cream rim, so the red reads on her orange hair
# Where the symbol sits, as fractions of the bust (left of her head, clear of the flower).
MARK_AT = (0.27, 0.27)
MARK_SIZE = 0.3  # of the bust's width


def bust_offset(full: np.ndarray, bust: np.ndarray) -> tuple[int, int]:
    """Where the bust crop sits in the full frame (the two were cut from one cell)."""
    bh, bw = bust.shape[:2]
    best = None
    for y in range(full.shape[0] - bh + 1):
        for x in range(full.shape[1] - bw + 1):
            err = np.abs(full[y : y + bh, x : x + bw].astype(int) - bust.astype(int)).sum()
            if best is None or err < best[0]:
                best = (err, x, y)
                if err == 0:
                    return x, y
    return best[1], best[2]


def anger_mark(size: int) -> Image.Image:
    """Twemoji's anger symbol at `size` pixels, with a thin cream rim."""
    emoji = Image.open(MARK).convert("RGBA").resize((size, size), Image.LANCZOS)
    pad = max(1, size // 18)
    out = Image.new("RGBA", (size + 2 * pad, size + 2 * pad), (0, 0, 0, 0))
    alpha = Image.new("L", out.size, 0)
    alpha.paste(emoji.getchannel("A"), (pad, pad))
    rim = alpha.filter(ImageFilter.MaxFilter(2 * pad + 1))
    out.paste(Image.new("RGBA", out.size, MARK_EDGE), (0, 0), rim)
    out.alpha_composite(emoji, (pad, pad))
    return out


def lean_in(img: Image.Image, lean: float, lift: int) -> Image.Image:
    """Her top drawn `lean` wider and a little lower (nearer to you), feet in place, lifted `lift` px."""
    w, h = img.size
    top_in = w * lean / 2  # the source's top edge is narrower, so it is stretched out
    drop = h * lean * 0.35  # leaning in, her head comes down a little
    # QUAD maps the output's corners to source points: upper-left, lower-left, lower-right, upper-right.
    quad = (top_in, -drop, 0, h, w, h, w - top_in, -drop)
    out = img.transform((w, h), Image.QUAD, quad, Image.BICUBIC)
    if lift:
        lifted = Image.new("RGBA", (w, h), (0, 0, 0, 0))
        lifted.alpha_composite(out, (0, 0), (0, lift))
        out = lifted
    return out


def build(name: str) -> str:
    src = ROOT / "plugin" / "assets" / name / "failed"
    out = ROOT / "plugin" / "assets" / name / "angry"
    out.mkdir(exist_ok=True)
    count = len(list(src.glob("[0-9].png")))
    for i in range(count):
        j = SOURCE[i % len(SOURCE)]
        full = Image.open(src / f"{j}.png").convert("RGBA")
        bust = Image.open(src / f"{j}-bust.png").convert("RGBA")
        bx, by = bust_offset(np.asarray(full), np.asarray(bust))

        frame = lean_in(full, LEAN[i % len(LEAN)], STOMP[i % len(STOMP)])

        size = round(bust.width * MARK_SIZE * THROB[i % len(THROB)])
        mark = anger_mark(size)
        mx = bx + round(bust.width * MARK_AT[0]) - mark.width // 2
        my = by + round(bust.height * MARK_AT[1]) - mark.height // 2
        frame.alpha_composite(mark, (max(0, mx), max(0, my)))

        frame.save(out / f"{i}.png", optimize=True)
        frame.crop((bx, by, bx + bust.width, by + bust.height)).save(out / f"{i}-bust.png", optimize=True)
    return f"{name}: {count} frames -> {out.relative_to(ROOT)}"


if __name__ == "__main__":
    for n in SETS:
        print(build(n))
