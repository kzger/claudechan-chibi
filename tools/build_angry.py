"""Make the 'angry' animation (PNG frames only) from each set's 'failed' frames.

The Codex spritesheets have no angry row, so this one is drawn here: her pout
from 'failed', shaken from side to side, with a red anger mark that throbs
beside her head. Written to plugin/assets/<set>/angry/<n>.png and <n>-bust.png,
the same sizes and frame count as 'failed', so the mod swaps them in place.
Character-cell mode has no angry frames: it draws 'failed' instead.

Usage (needs Pillow and NumPy):
    uv run --with pillow --with numpy python tools/build_angry.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SETS = ("smooth", "classic")
SHAKE = [-3, 3, -3, 3, -2, 2, -1, 0]  # pixels, per frame
THROB = [1.0, 1.25, 1.0, 1.25, 1.0, 1.25, 1.1, 1.0]  # the mark's scale, per frame
MARK_RED = (226, 52, 40, 255)
MARK_EDGE = (255, 244, 236, 255)
# Where the mark sits, as fractions of the bust (left of her head, clear of the flower).
MARK_AT = (0.24, 0.3)
MARK_SIZE = 0.26  # of the bust's width


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
    """The manga anger mark: four red lobes split by a cross, outlined in cream."""
    s = size * 4  # drawn large, then scaled down for smooth edges
    lobes = Image.new("L", (s, s), 0)
    d = ImageDraw.Draw(lobes)
    pad = s // 8
    d.rounded_rectangle((pad, pad, s - pad, s - pad), radius=s // 4, fill=255)
    bar = s // 9
    d.rectangle((s // 2 - bar, 0, s // 2 + bar, s), fill=0)  # the cross that splits it
    d.rectangle((0, s // 2 - bar, s, s // 2 + bar), fill=0)
    r = s // 6  # a bite out of each edge's middle pinches the lobes apart
    for cx, cy in ((s // 2, pad), (s // 2, s - pad), (pad, s // 2), (s - pad, s // 2)):
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=0)
    edge = lobes.filter(ImageFilter.MaxFilter(2 * (s // 28) + 1))
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    img.paste(Image.new("RGBA", (s, s), MARK_EDGE), (0, 0), edge)
    img.paste(Image.new("RGBA", (s, s), MARK_RED), (0, 0), lobes)
    return img.resize((size, size), Image.LANCZOS)


def build(name: str) -> str:
    src = ROOT / "plugin" / "assets" / name / "failed"
    out = ROOT / "plugin" / "assets" / name / "angry"
    out.mkdir(exist_ok=True)
    count = len(list(src.glob("[0-9].png")))
    for i in range(count):
        full = Image.open(src / f"{i}.png").convert("RGBA")
        bust = Image.open(src / f"{i}-bust.png").convert("RGBA")
        bx, by = bust_offset(np.asarray(full), np.asarray(bust))

        frame = Image.new("RGBA", full.size, (0, 0, 0, 0))
        dx = SHAKE[i % len(SHAKE)]
        frame.alpha_composite(full, (max(dx, 0), 0), (max(-dx, 0), 0))

        size = round(bust.width * MARK_SIZE * THROB[i % len(THROB)])
        mark = anger_mark(size)
        mx = bx + round(bust.width * MARK_AT[0]) - size // 2 + dx
        my = by + round(bust.height * MARK_AT[1]) - size // 2
        frame.alpha_composite(mark, (max(0, mx), max(0, my)))

        frame.save(out / f"{i}.png", optimize=True)
        frame.crop((bx, by, bx + bust.width, by + bust.height)).save(out / f"{i}-bust.png", optimize=True)
    return f"{name}: {count} frames -> {out.relative_to(ROOT)}"


if __name__ == "__main__":
    for n in SETS:
        print(build(n))
