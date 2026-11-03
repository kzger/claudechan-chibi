"""Convert Codex v1 pet spritesheets into the claudechan-chibi mod's frames.

Each spritesheet is 1536x1872: 8 columns x 9 rows of 192x208 cells. Every frame is
cropped with one bounding box shared by the whole set (so the feet stay on one
baseline). Two outputs per set:

1. Character cells (any truecolor terminal): each terminal cell holds 2x2 pixels drawn
   with one of the 16 quadrant block glyphs (▘▝▀▖▌▞▛▗▚▐▜▄▙▟█) in two colours. The best
   glyph + colour pair is chosen per cell here, offline, and colours are mapped to a
   255-colour palette per set. Written to plugin/hooks/frames-<set>.ts as 3 bytes per
   cell: glyph mask, foreground index, background index (0 = transparent).

2. PNG frames (terminals with the kitty graphics protocol or iTerm2 inline images):
   the cropped frames at native resolution, plugin/assets/<set>/<state>/<n>.png.

Only Pillow and NumPy are needed, and only on the machine that rebuilds.

Usage:
    python tools/build_frames.py --smooth <spritesheet.png> --classic <spritesheet.png>
"""

from __future__ import annotations

import argparse
import base64
import json
import shutil
from pathlib import Path

import numpy as np
from PIL import Image

CELL_W, CELL_H = 192, 208
# Codex v1 rows: name, frame count, frame durations in ms (from the native-smooth events.json).
STATES = [
    ("idle", 6, [1680, 660, 660, 840, 840, 1920]),
    ("running-right", 8, [120] * 7 + [220]),
    ("running-left", 8, [120] * 7 + [220]),
    ("waving", 4, [140, 140, 140, 280]),
    ("jumping", 5, [140, 140, 140, 140, 280]),
    ("failed", 8, [140] * 7 + [240]),
    ("waiting", 6, [150] * 5 + [260]),
    ("running", 6, [120] * 5 + [220]),
    ("review", 6, [150] * 5 + [280]),
]
SIZES = {"big": (34, 18), "small": (22, 12)}  # (columns, rows) in terminal cells
# Rows of the Image box (real-pixel mode). A picture fills its box edge to edge, so it
# reads larger than the character art of the same size: the pane's is kept smaller.
IMAGE_ROWS = {"big": 14, "small": 11}
# The band is too small for a full figure: it shows head and shoulders instead,
# as fractions of the full crop (left, top, right, bottom).
CROP = {"big": (0.0, 0.0, 1.0, 1.0), "small": (0.15, 0.0, 0.85, 0.68)}
# The bust slides down to each state's own top of head (less this many pixels), so a
# pose that stands lower (idle) is not drawn under a band of empty space kept for the
# highest one (jumping). Its size stays the same, so every state fills the same box.
BUST_MARGIN = 1
CELL_ASPECT = 2.0  # a terminal cell is about twice as tall as it is wide
PALETTE_COLORS = 255
ALPHA_CUTOFF = 110

ROOT = Path(__file__).resolve().parent.parent

# Every subset of a cell's four pixels (bit 0 top-left, 1 top-right, 2 bottom-left,
# 3 bottom-right) as a boolean mask, for the glyph search.
MASKS = np.array([[(m >> i) & 1 for i in range(4)] for m in range(16)], dtype=bool)


def frames_of(sheet: Image.Image) -> dict[str, list[Image.Image]]:
    out: dict[str, list[Image.Image]] = {}
    for row, (name, count, _) in enumerate(STATES):
        out[name] = [
            sheet.crop((c * CELL_W, row * CELL_H, (c + 1) * CELL_W, (row + 1) * CELL_H))
            for c in range(count)
        ]
    return out


def union_bbox(frames: dict[str, list[Image.Image]]) -> tuple[int, int, int, int]:
    boxes = [f.getbbox() for fs in frames.values() for f in fs if f.getbbox()]
    return (
        min(b[0] for b in boxes),
        min(b[1] for b in boxes),
        max(b[2] for b in boxes),
        max(b[3] for b in boxes),
    )


def sub_box(bbox, size: str):
    """The crop of one size: the full bbox, or the part of it CROP names."""
    l, t, r, b = CROP[size]
    w, h = bbox[2] - bbox[0], bbox[3] - bbox[1]
    return (bbox[0] + round(w * l), bbox[1] + round(h * t), bbox[0] + round(w * r), bbox[1] + round(h * b))


def state_box(bbox, size: str, frames: list[Image.Image]):
    """sub_box, with the bust moved down to where this state's head begins."""
    box = sub_box(bbox, size)
    if size != "small":
        return box
    tops = [f.getbbox()[1] for f in frames if f.getbbox()]
    shift = max(0, min(tops, default=box[1]) - BUST_MARGIN - box[1])
    shift = min(shift, bbox[3] - box[3])  # never past the feet
    return (box[0], box[1] + shift, box[2], box[3] + shift)


def quad_pixels(frame: Image.Image, bbox, cols: int, rows: int) -> np.ndarray:
    """The crop scaled into (2*rows) x (2*cols) quadrant pixels, centred, feet at the bottom.

    A quadrant pixel is half a cell wide and half a cell tall, so it is twice as tall
    as it is wide: the picture is stretched 2x horizontally in pixel units.
    """
    crop = frame.crop(bbox).convert("RGBa")  # premultiplied, so edges do not go dark
    units_w, units_h = cols, rows * CELL_ASPECT  # the box in square units (cell width = 1)
    scale = min(units_w / crop.width, units_h / crop.height)
    size = (
        max(1, round(crop.width * scale * 2)),
        max(1, round(crop.height * scale * 2 / CELL_ASPECT)),
    )
    small = crop.resize(size, Image.LANCZOS).convert("RGBA")
    canvas = Image.new("RGBA", (cols * 2, rows * 2), (0, 0, 0, 0))
    canvas.paste(small, ((cols * 2 - size[0]) // 2, rows * 2 - size[1]))
    return np.asarray(canvas).astype(np.float32)


def best_cells(px: np.ndarray, cols: int, rows: int):
    """Per cell: (mask 0-15, fg rgb or None, bg rgb or None). None = terminal default."""
    out = []
    for r in range(rows):
        for c in range(cols):
            quad = px[2 * r : 2 * r + 2, 2 * c : 2 * c + 2].reshape(4, 4)
            opaque = quad[:, 3] >= ALPHA_CUTOFF
            rgb = quad[:, :3]
            if not opaque.any():
                out.append((0, None, None))
                continue
            if not opaque.all():
                # Transparent pixels show the terminal's own background.
                mask = int(sum(1 << i for i in range(4) if opaque[i]))
                out.append((mask, rgb[opaque].mean(axis=0), None))
                continue
            best = None
            for m in range(1, 16):
                sel = MASKS[m]
                fg = rgb[sel].mean(axis=0)
                bg = rgb[~sel].mean(axis=0) if (~sel).any() else fg
                err = ((rgb[sel] - fg) ** 2).sum() + ((rgb[~sel] - bg) ** 2).sum()
                if best is None or err < best[0]:
                    best = (err, m, fg, bg)
            _, m, fg, bg = best
            out.append((15, fg, None) if m == 15 else (m, fg, bg))
    return out


def build_set(name: str, src: Path) -> str:
    sheet = Image.open(src).convert("RGBA")
    assert sheet.size == (CELL_W * 8, CELL_H * 9), f"{src}: unexpected size {sheet.size}"
    frames = frames_of(sheet)
    bbox = union_bbox(frames)

    # 1. character cells
    cells = {
        size: {
            st: [best_cells(quad_pixels(f, state_box(bbox, size, fs), cols, rows), cols, rows) for f in fs]
            for st, fs in frames.items()
        }
        for size, (cols, rows) in SIZES.items()
    }
    colours = np.array(
        [col for s in cells.values() for fs in s.values() for f in fs for _, fg, bg in f for col in (fg, bg) if col is not None],
        dtype=np.float32,
    )
    strip = Image.fromarray(np.clip(colours, 0, 255).astype(np.uint8).reshape(1, -1, 3), "RGB")
    pal_img = strip.quantize(PALETTE_COLORS, method=Image.Quantize.MEDIANCUT)
    raw = pal_img.getpalette()[: PALETTE_COLORS * 3]
    pal = np.array(raw, dtype=np.float32).reshape(-1, 3)
    palette = [(int(r) << 16) | (int(g) << 8) | int(b) for r, g, b in pal]

    def index(col) -> int:
        if col is None:
            return 0
        return int(((pal - col) ** 2).sum(axis=1).argmin()) + 1

    def encode(frame_cells) -> str:
        data = bytearray()
        for mask, fg, bg in frame_cells:
            data += bytes((mask, index(fg), index(bg)))
        return base64.b64encode(bytes(data)).decode("ascii")

    # 2. PNG frames for terminals that draw pictures
    asset_dir = ROOT / "plugin" / "assets" / name
    if asset_dir.exists():
        shutil.rmtree(asset_dir)
    for st, fs in frames.items():
        (asset_dir / st).mkdir(parents=True, exist_ok=True)
        for i, f in enumerate(fs):
            f.crop(sub_box(bbox, "big")).save(asset_dir / st / f"{i}.png", optimize=True)
            f.crop(state_box(bbox, "small", fs)).save(asset_dir / st / f"{i}-bust.png", optimize=True)
    image_sizes = {}
    for size, (cols, rows) in SIZES.items():
        box = sub_box(bbox, size)
        bw, bh = box[2] - box[0], box[3] - box[1]
        # The Image box is stretched to fill: keep the crop's aspect in cells.
        img_rows = IMAGE_ROWS[size]
        img_cols = round(img_rows * CELL_ASPECT * bw / bh)
        if img_cols > cols:
            img_cols = cols
            img_rows = max(1, round(cols * bh / bw / CELL_ASPECT))
        image_sizes[size] = {"columns": img_cols, "rows": img_rows}

    data = {
        "name": name,
        "palette": palette,
        "sizes": {k: {"columns": c, "rows": r} for k, (c, r) in SIZES.items()},
        "imageSizes": image_sizes,
        "states": {
            st: {
                "durations": durations,
                "big": [encode(f) for f in cells["big"][st]],
                "small": [encode(f) for f in cells["small"][st]],
            }
            for st, _count, durations in STATES
        },
    }
    out = ROOT / "plugin" / "hooks" / f"frames-{name}.ts"
    out.write_text(
        f"// Generated by tools/build_frames.py from {src.name}; do not edit by hand.\n"
        "import type { SheetSet } from './sprite'\n\n"
        f"export const SET: SheetSet = {json.dumps(data, separators=(',', ':'))}\n",
        encoding="utf-8",
    )
    png_kib = sum(p.stat().st_size for p in asset_dir.rglob("*.png")) // 1024
    return f"{name}: bbox={bbox} cells -> {out.name} ({out.stat().st_size // 1024} KiB), png -> assets/{name} ({png_kib} KiB)"


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--smooth", type=Path, required=True, help="native-smooth spritesheet.png (Codex v1, 1536x1872)")
    ap.add_argument("--classic", type=Path, required=True, help="claude-chibi spritesheet-hover-calm.png (Codex v1, 1536x1872)")
    args = ap.parse_args()
    for name, src in (("smooth", args.smooth), ("classic", args.classic)):
        print(build_set(name, src))


if __name__ == "__main__":
    main()
