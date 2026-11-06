"""Install a finished PNG tree into plugin/assets and rebuild every frames-*.ts from it.

The source holds the frames exactly as the plugin draws them, in the plugin's
own layout: <src>/<group>/<state>/<n>.png (186x184, the pane's full figure)
and <n>-bust.png (130x125, the band's head and shoulders), for the groups
smooth, classic and extra. They are copied as they are; nothing is re-cropped,
re-fitted or re-coloured. The character cells are then built from the same
PNGs, so image and cells show the same figure in the same place:

- big cells from the whole full frame, small cells from the whole bust PNG
  (no per-state bust crop of their own);
- one 255-colour palette per set (smooth, classic) and one for the shared actions;
- each set's timing kept from its current frames-<set>.ts (the event meaning
  and pace stay as they are), and 'angry' (PNG-drawn) gets cells too.

This replaces tools/build_frames.py, build_extra.py and build_angry.py for
the corrected art: those rebuild from the old spritesheets / image26-v1 and
would overwrite it.

Usage (needs Pillow and NumPy):
    uv run --with pillow --with numpy python tools/build_corrected.py [tools/assets/plugin-assets-corrected-v1]
"""

from __future__ import annotations

import base64
import hashlib
import json
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

from build_frames import CELL_ASPECT, IMAGE_ROWS, PALETTE_COLORS, ROOT, SIZES, best_cells, quad_pixels

DEFAULT_SRC = ROOT / "tools" / "assets" / "plugin-assets-corrected-v1"
FULL, BUST = (186, 184), (130, 125)
# 'angry' is PNG-drawn (no spritesheet row); register.tsx's withAngry timing.
ANGRY_DURATIONS = [120] * 7 + [240]


def frame_count(folder: Path) -> int:
    nums = sorted(int(p.stem) for p in folder.glob("*.png") if p.stem.isdigit())
    assert nums == list(range(len(nums))) and nums, f"{folder}: frames are not 0..n-1"
    for n in nums:
        assert (folder / f"{n}-bust.png").exists(), f"{folder}: {n}-bust.png missing"
    return len(nums)


def install(src: Path, dest: Path) -> list[Image.Image]:
    """Copy one state's <n>.png / <n>-bust.png (only those) and return them, full then bust per frame."""
    n = frame_count(src)
    if dest.exists():
        shutil.rmtree(dest)
    dest.mkdir(parents=True)
    out = []
    for i in range(n):
        for suffix, size in (("", FULL), ("-bust", BUST)):
            p = src / f"{i}{suffix}.png"
            im = Image.open(p)
            assert im.mode == "RGBA" and im.size == size, f"{p}: {im.mode} {im.size}"
            shutil.copyfile(p, dest / p.name)
            assert hashlib.sha256((dest / p.name).read_bytes()).digest() == hashlib.sha256(p.read_bytes()).digest()
            out.append(im.convert("RGBA"))
    return out


def cells_of(images: list[Image.Image]) -> dict[str, list]:
    full, bust = images[0::2], images[1::2]
    out = {}
    for view, frames in (("big", full), ("small", bust)):
        cols, rows = SIZES[view]
        out[view] = [best_cells(quad_pixels(f, (0, 0, *f.size), cols, rows), cols, rows) for f in frames]
    return out


def make_palette(cells: dict[str, dict[str, list]]):
    colours = np.array(
        [c for s in cells.values() for fs in s.values() for f in fs for _, fg, bg in f for c in (fg, bg) if c is not None],
        dtype=np.float32,
    )
    strip = Image.fromarray(np.clip(colours, 0, 255).astype(np.uint8).reshape(1, -1, 3), "RGB")
    raw = strip.quantize(PALETTE_COLORS, method=Image.Quantize.MEDIANCUT).getpalette()[: PALETTE_COLORS * 3]
    pal = np.array(raw, dtype=np.float32).reshape(-1, 3)

    def encode(frame_cells) -> str:
        def index(col) -> int:
            return 0 if col is None else int(((pal - col) ** 2).sum(axis=1).argmin()) + 1

        return base64.b64encode(bytes(v for m, fg, bg in frame_cells for v in (m, index(fg), index(bg)))).decode("ascii")

    return [(int(r) << 16) | (int(g) << 8) | int(b) for r, g, b in pal], encode


def image_sizes() -> dict:
    """The Image box (cells) keeping each PNG's aspect, as build_frames.py sizes it."""
    out = {}
    for view, (w, h) in (("big", FULL), ("small", BUST)):
        cols = SIZES[view][0]
        rows = IMAGE_ROWS[view]
        c = round(rows * CELL_ASPECT * w / h)
        if c > cols:
            c, rows = cols, max(1, round(cols * h / w / CELL_ASPECT))
        out[view] = {"columns": c, "rows": rows}
    return out


def read_ts(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8").split(" = ", 1)[1])


def build_set(src: Path, name: str) -> str:
    ts = ROOT / "plugin" / "hooks" / f"frames-{name}.ts"
    old = read_ts(ts)
    states = sorted(p.name for p in (src / name).iterdir() if p.is_dir())
    want = sorted([*old["states"], "angry"])
    assert states == want, f"{name}: states {states} != {want}"
    durations = {st: v["durations"] for st, v in old["states"].items()} | {"angry": ANGRY_DURATIONS}
    cells = {}
    for st in states:
        images = install(src / name / st, ROOT / "plugin" / "assets" / name / st)
        assert len(images) // 2 == len(durations[st]), f"{name}/{st}: {len(images) // 2} frames, {len(durations[st])} durations"
        cells[st] = cells_of(images)
    palette, encode = make_palette(cells)
    data = {
        "name": name,
        "palette": palette,
        "sizes": {k: {"columns": c, "rows": r} for k, (c, r) in SIZES.items()},
        "imageSizes": image_sizes(),
        "states": {st: {"durations": durations[st], **{v: [encode(f) for f in fs] for v, fs in cells[st].items()}} for st in states},
    }
    ts.write_text(
        f"// Generated by tools/build_corrected.py from {src.relative_to(ROOT).as_posix()}/{name}; do not edit by hand.\n"
        "import type { SheetSet } from './sprite'\n\n"
        f"export const SET: SheetSet = {json.dumps(data, separators=(',', ':'))}\n",
        encoding="utf-8",
    )
    return f"{name}: {len(states)} states, imageSizes={data['imageSizes']}, cells -> {ts.name} ({ts.stat().st_size // 1024} KiB)"


def build_extra(src: Path) -> str:
    ts = ROOT / "plugin" / "hooks" / "frames-extra.ts"
    old = read_ts(ts)
    states = sorted(p.name for p in (src / "extra").iterdir() if p.is_dir())
    assert states == sorted(old["states"]), f"extra: states {states} != {sorted(old['states'])}"
    dest = ROOT / "plugin" / "assets" / "extra"
    if dest.exists():
        shutil.rmtree(dest)
    cells = {}
    for st in old["states"]:  # keep the file's order
        cells[st] = cells_of(install(src / "extra" / st, dest / st))
        assert len(cells[st]["big"]) == len(old["states"][st]["big"]), f"extra/{st}: frame count changed"
    palette, encode = make_palette(cells)
    data = {"palette": palette, "states": {st: {v: [encode(f) for f in fs] for v, fs in views.items()} for st, views in cells.items()}}
    ts.write_text(
        f"// Generated by tools/build_corrected.py from {src.relative_to(ROOT).as_posix()}/extra; do not edit by hand.\n"
        "import type { ExtraSheet } from './sprite'\n\n"
        f"export const EXTRA: ExtraSheet = {json.dumps(data, separators=(',', ':'))}\n",
        encoding="utf-8",
    )
    return f"extra: {len(states)} actions, cells -> {ts.name} ({ts.stat().st_size // 1024} KiB)"


def main() -> None:
    src = (Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_SRC).resolve()
    for name in ("smooth", "classic"):
        print(build_set(src, name))
    print(build_extra(src))
    pngs = sum(1 for _ in (ROOT / "plugin" / "assets").glob("*/*/*.png"))
    print(f"plugin/assets: {pngs} PNG")


if __name__ == "__main__":
    main()
