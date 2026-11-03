"""Render the README's pictures from the mod's own PNG frames.

Writes three GIFs to docs/images/:

  states.gif  every animation, each at its own pace, labelled
  band.gif    a mock-up of the narrow layout: her face beside the chip and bubble
  pane.gif    a mock-up of the docked pane: full figure, chip, bubble, recent calls

The mock-ups use the mod's THEME colours and layout; they are drawn here, not
screenshots of a terminal. Needs Pillow and a font with Traditional Chinese and
kana (PingFang on macOS, or pass --font).

Usage:
    python tools/make_readme_images.py [--set smooth|classic] [--font path.ttc]
"""

from __future__ import annotations

import argparse
import glob
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "images"
STEP_MS = 60  # GIF frame length; each animation picks its frame by elapsed time
LENGTH_MS = 4200

# (state, frame durations in ms) as in tools/build_frames.py
STATES = [
    ("idle", [1680, 660, 660, 840, 840, 1920]),
    ("waving", [140, 140, 140, 280]),
    ("jumping", [140, 140, 140, 140, 280]),
    ("running", [120] * 5 + [220]),
    ("waiting", [150] * 5 + [260]),
    ("review", [150] * 5 + [280]),
    ("failed", [140] * 7 + [240]),
    ("running-left", [120] * 7 + [220]),
    ("running-right", [120] * 7 + [220]),
]
LABEL = {
    "idle": "idle 待命",
    "waving": "waving 揮手",
    "jumping": "jumping 收到",
    "running": "running 工作中",
    "waiting": "waiting 等你決定",
    "review": "review 完成",
    "failed": "failed 出錯",
    "running-left": "running-left",
    "running-right": "running-right",
}

# plugin/hooks/register.tsx THEME
SURFACE = "#1C1714"
STAGE = "#26201B"
BUBBLE = "#33261E"
TEXT = "#F3E5D3"
MUTED = "#B9A48F"
ACCENT = "#F08A4B"
OK = "#9CC98A"
AMBER = "#F2C35B"
FRAME = "#5B5048"
TERMINAL = "#0E1116"

# Glyphs the CJK font lacks, drawn with a symbol font instead.
SYMBOLS = set("✎✓✗♪❯✕✿●…?!")
SYMBOL_FONT = "/System/Library/Fonts/Menlo.ttc"


def text(draw: ImageDraw.ImageDraw, xy: tuple[float, float], s: str, fill: str, font) -> float:
    """Draw `s` left to right, symbols in SYMBOL_FONT; returns the x it ends at."""
    x, y = xy
    sym = ImageFont.truetype(SYMBOL_FONT, font.size)
    for ch in s:
        f = sym if ch in SYMBOLS and ch not in "…?!" else font
        draw.text((x, y), ch, fill=fill, font=f)
        x += draw.textlength(ch, font=f)
    return x


def width(draw: ImageDraw.ImageDraw, s: str, font) -> float:
    sym = ImageFont.truetype(SYMBOL_FONT, font.size)
    return sum(draw.textlength(ch, font=sym if ch in SYMBOLS and ch not in "…?!" else font) for ch in s)


def find_font(explicit: str | None) -> tuple[str, int]:
    if explicit:
        return explicit, 0
    for pattern in (
        "/System/Library/AssetsV2/*/*/AssetData/PingFang.ttc",
        "/System/Library/Fonts/PingFang.ttc",
        "/Library/Fonts/PingFang.ttc",
    ):
        for path in glob.glob(pattern):
            # pick the Traditional Chinese face of the collection
            for i in range(12):
                try:
                    f = ImageFont.truetype(path, 16, index=i)
                except OSError:
                    break
                if "TC" in " ".join(f.getname()):
                    return path, i
            return path, 0
    raise SystemExit("no CJK font found: pass --font <path to a .ttc/.ttf with Traditional Chinese and kana>")


def frame_at(durations: list[int], t: int) -> int:
    t %= sum(durations)
    for i, d in enumerate(durations):
        if t < d:
            return i
        t -= d
    return 0


def load(set_name: str, state: str, n: int, bust: bool) -> list[Image.Image]:
    suffix = "-bust" if bust else ""
    d = ROOT / "plugin" / "assets" / set_name / state
    return [Image.open(d / f"{i}{suffix}.png").convert("RGBA") for i in range(n)]


def on(bg: str, img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """The picture scaled into `size` (aspect kept, feet at the bottom) over `bg`."""
    canvas = Image.new("RGBA", size, bg)
    scale = min(size[0] / img.width, size[1] / img.height)
    small = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(small, ((size[0] - small.width) // 2, size[1] - small.height))
    return canvas


def save_gif(frames: list[Image.Image], path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    rgb = [f.convert("RGB") for f in frames]
    # one palette shared by every frame, taken from a strip of sampled frames
    sample = rgb[:: max(1, len(rgb) // 8)]
    strip = Image.new("RGB", (sample[0].width, sample[0].height * len(sample)))
    for i, f in enumerate(sample):
        strip.paste(f, (0, i * f.height))
    palette = strip.quantize(colors=255, method=Image.Quantize.MEDIANCUT)
    pal = [f.quantize(palette=palette, dither=Image.Dither.NONE) for f in rgb]
    # drop frames identical to the one before, lengthening that one instead
    keep, durations = [pal[0]], [STEP_MS]
    for f in pal[1:]:
        if f.tobytes() == keep[-1].tobytes():
            durations[-1] += STEP_MS
        else:
            keep.append(f)
            durations.append(STEP_MS)
    keep[0].save(path, save_all=True, append_images=keep[1:], duration=durations, loop=0, optimize=True, disposal=1)
    print(f"{path.relative_to(ROOT)}: {len(keep)} frames, {path.stat().st_size // 1024} KiB")


def chip(draw: ImageDraw.ImageDraw, xy: tuple[int, int], label: str, colour: str, font) -> int:
    x, y = xy
    w = width(draw, label, font)
    draw.rectangle((x, y - 2, x + w + 16, y + font.size + 6), fill=colour)
    globals()["text"](draw, (x + 8, y), label, SURFACE, font)
    return int(x + w + 16)


def bubble(draw: ImageDraw.ImageDraw, xy: tuple[int, int], said: str, font) -> None:
    x, y = xy
    w = width(draw, said, font)
    draw.rounded_rectangle((x, y, x + w + 28, y + font.size + 22), radius=8, fill=BUBBLE, outline=ACCENT, width=2)
    text(draw, (x + 14, y + 10), said, TEXT, font)


def states_gif(set_name: str, font_path: str, font_index: int) -> None:
    cell_w, cell_h, label_h, gap = 150, 150, 30, 8
    font = ImageFont.truetype(font_path, 15, index=font_index)
    frames = {st: load(set_name, st, len(d), bust=False) for st, d in STATES}
    W = 3 * cell_w + 4 * gap
    H = 3 * (cell_h + label_h) + 4 * gap
    out = []
    for t in range(0, LENGTH_MS, STEP_MS):
        img = Image.new("RGBA", (W, H), SURFACE)
        draw = ImageDraw.Draw(img)
        for k, (st, d) in enumerate(STATES):
            x = gap + (k % 3) * (cell_w + gap)
            y = gap + (k // 3) * (cell_h + label_h + gap)
            img.alpha_composite(on(STAGE, frames[st][frame_at(d, t)], (cell_w, cell_h)), (x, y))
            draw.text((x + cell_w / 2, y + cell_h + 8), LABEL[st], fill=TEXT, font=font, anchor="ma")
        out.append(img)
    save_gif(out, OUT / "states.gif")


def band_gif(set_name: str, font_path: str, font_index: int) -> None:
    W, H = 760, 230
    font = ImageFont.truetype(font_path, 20, index=font_index)
    bold = ImageFont.truetype(font_path, 20, index=font_index)
    small = ImageFont.truetype(font_path, 16, index=font_index)
    face_size = (160, 144)
    script = [  # (state, chip colour, chip text, bubble)
        ("waving", ACCENT, "♪ 你好！", "嗨！今天要做什麼？"),
        ("running", AMBER, "✎ 工作中", "正在改 auth.ts…"),
        ("review", OK, "✓ 完成了", "完成了！用時 1m12s ✿"),
    ]
    out = []
    for state, colour, title, said in script:
        d = dict(STATES)[state]
        busts = load(set_name, state, len(d), bust=True)
        for t in range(0, 1400, STEP_MS):
            img = Image.new("RGBA", (W, H), TERMINAL)
            draw = ImageDraw.Draw(img)
            draw.rounded_rectangle((8, 8, W - 8, H - 50), radius=8, outline=FRAME, width=2)
            text(draw, (W - 30, 10), "✕", MUTED, small)
            draw.rectangle((20, 22, W - 22, H - 64), fill=SURFACE)
            img.alpha_composite(on(STAGE, busts[frame_at(d, t)], face_size), (20, 22))
            x = chip(draw, (210, 52), title, colour, bold)
            draw.text((x + 14, 52), "Claude ちゃん", fill=ACCENT, font=bold)
            bubble(draw, (210, 92), said, font)
            text(draw, (16, H - 36), "❯", MUTED, font)
            out.append(img)
    save_gif(out, OUT / "band.gif")


def pane_gif(set_name: str, font_path: str, font_index: int) -> None:
    W, H = 900, 560
    split = 470
    font = ImageFont.truetype(font_path, 18, index=font_index)
    small = ImageFont.truetype(font_path, 16, index=font_index)
    state = "running"
    d = dict(STATES)[state]
    fulls = load(set_name, state, len(d), bust=False)
    chat = [
        ("❯ 幫我重構 auth 模組", TEXT),
        ("", TEXT),
        ("● Read src/auth.ts", MUTED),
        ("● Edit src/auth.ts", MUTED),
        ("● Bash npm test", MUTED),
    ]
    recent = [("✓", OK, "Read", "auth.ts"), ("✓", OK, "Edit", "auth.ts"), ("…", AMBER, "Bash", "npm test")]
    out = []
    for t in range(0, 2400, STEP_MS):
        img = Image.new("RGBA", (W, H), TERMINAL)
        draw = ImageDraw.Draw(img)
        for i, (line, colour) in enumerate(chat):
            text(draw, (20, 24 + i * 30), line, colour, font)
        draw.line((split, 0, split, H), fill=FRAME, width=2)
        draw.text((split + 14, 8), "Claude ちゃん", fill=MUTED, font=small)
        text(draw, (W - 26, 8), "✕", MUTED, small)
        draw.rectangle((split + 2, 34, W, H), fill=SURFACE)
        img.alpha_composite(on(STAGE, fulls[frame_at(d, t)], (W - split - 2, 250)), (split + 2, 34))
        x = chip(draw, (split + 20, 304), "✎ 工作中", AMBER, font)
        draw.text((x + 14, 304), "Claude ちゃん", fill=ACCENT, font=font)
        bubble(draw, (split + 20, 340), "正在執行 npm test…", font)
        draw.text((split + 20, 408), "本輪 3 次工具 · 上輪 2m14s", fill=MUTED, font=small)
        draw.text((split + 20, 442), "最近 ──────────────────", fill=ACCENT, font=small)
        for i, (mark, colour, tool, target) in enumerate(recent):
            y = 470 + i * 26
            text(draw, (split + 20, y), mark, colour, small)
            draw.text((split + 44, y), tool, fill=TEXT, font=small)
            draw.text((split + 100, y), target, fill=MUTED, font=small)
        out.append(img)
    save_gif(out, OUT / "pane.gif")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--set", default="smooth", choices=["smooth", "classic"])
    ap.add_argument("--font", help="a .ttc/.ttf with Traditional Chinese and kana")
    args = ap.parse_args()
    path, index = find_font(args.font)
    states_gif(args.set, path, index)
    band_gif(args.set, path, index)
    pane_gif(args.set, path, index)


if __name__ == "__main__":
    main()
