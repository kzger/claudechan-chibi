"""Build the angry animation from a hands-on-hips pose.

The character leans forward twice with her feet planted while Twemoji's
U+1F4A2 (CC-BY 4.0) pulses beside her head. Output matches each set's
failed frame sizes and count. Character-cell mode still uses 'failed'.

Usage (needs Pillow and NumPy):
    uv run --with pillow --with numpy python tools/build_angry.py
"""

from __future__ import annotations

from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SETS = ("smooth", "classic")
POSE = Path(__file__).resolve().parent / "assets" / "angry-pose.png"
# Two quick forward leans with a brief hold on the first beat.
LEAN = [0.0, 0.08, 0.16, 0.16, 0.03, 0.08, 0.16, 0.06]
THROB = [1.0, 1.2, 1.3, 1.15, 1.0, 1.2, 1.3, 1.1]
MARK = Path(__file__).resolve().parent / "assets" / "twemoji-1f4a2.png"
MARK_EDGE = (255, 244, 236, 255)  # a cream rim, so the red reads on her orange hair
# Where the symbol sits, as fractions of the bust (over the hair on the left, clear of the flower).
MARK_AT = (0.40, 0.53)
MARK_SIZE = 0.16  # of the bust's width


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


def lean_in(img: Image.Image, lean: float) -> Image.Image:
    """Enlarge and lower her head while keeping the soles anchored."""
    w, h = img.size
    top_in = w * lean / 2
    drop = h * lean * 0.35
    quad = (top_in, -drop, 0, h, w, h, w - top_in, -drop)
    return img.transform((w, h), Image.QUAD, quad, Image.BICUBIC)


def build(name: str) -> str:
    src = ROOT / "plugin" / "assets" / name / "failed"
    out = ROOT / "plugin" / "assets" / name / "angry"
    out.mkdir(exist_ok=True)
    count = len(list(src.glob("[0-9].png")))
    full = Image.open(src / "0.png").convert("RGBA")
    bust = Image.open(src / "0-bust.png").convert("RGBA")
    bx, by = bust_offset(np.asarray(full), np.asarray(bust))
    pose = Image.open(POSE).convert("RGBA")
    pose.thumbnail((full.width - 26, full.height - 5), Image.LANCZOS)
    base = Image.new("RGBA", full.size)
    base.alpha_composite(pose, ((full.width - pose.width) // 2, full.height - pose.height))
    for i in range(count):
        frame = lean_in(base, LEAN[i % len(LEAN)])
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
