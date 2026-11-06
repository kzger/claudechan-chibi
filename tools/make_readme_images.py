"""Render the README's pictures from the mod's own PNG frames.

Writes three GIFs to docs/images/:

  states.gif  the main animations (SHOWN), each at the mod's own pace, labelled
  band.gif    a mock-up of the narrow layout: her face beside the chip and bubble,
              from your prompt to the answer
  pane.gif    a mock-up of the docked pane: full figure, chip, bubble, recent calls,
              her pose following each tool of a turn

The mock-ups use the mod's THEME colours and layout; they are drawn here, not
screenshots of a terminal. Needs Pillow and a font with Traditional Chinese and
kana (PingFang on macOS, or pass --font).

Usage:
    python tools/make_readme_images.py [--set smooth|classic] [--font path.ttc]
"""

from __future__ import annotations

import argparse
import glob
import json
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "docs" / "images"
STEP_MS = 60  # GIF frame length; each animation picks its frame by elapsed time
LENGTH_MS = 5400
STATES_STEP_MS = 120  # states.gif is the big one: half the frame rate keeps it small

# The animations states.gif shows, in order, with their labels. A set's own
# states take their timing from plugin/hooks/frames-<set>.ts; the shared
# actions (plugin/assets/extra/) from EXTRA_TIMING below.
SHOWN = [
    ("idle-1", "idle-1 待命"),
    ("waving", "waving 你好"),
    ("listening", "listening 收到"),
    ("thinking", "thinking 思考"),
    ("running", "running 閱讀"),
    ("searching", "searching 搜尋"),
    ("writing", "writing 寫入"),
    ("busy_left", "busy 執行指令"),
    ("delegating", "delegating 派工"),
    ("waiting", "waiting 等你決定"),
    ("proud", "proud 完成"),
    ("oops", "oops 失敗"),
    ("sleeping-2", "sleeping 打瞌睡"),
    ("redhot", "redhot 被抓到偷睡"),
    ("angry", "angry 生氣"),
]
# plugin/hooks/register.tsx EXTRA_TIMING (every other shared action: 240 ms a frame)
EXTRA_TIMING = {
    "idle-1": [1000, 400, 240, 240, 240, 1000],
    "idle-2": [1000, 400, 240, 240, 240, 1000],
    "idle-3": [1000, 400, 240, 240, 240, 1000],
    "idle-blink": [240, 240, 1300, 1000, 240, 240],
    "hum": 320,
    "clawd": 320,
    "yawn": 320,
    "sleeping-2": 900,
}
ANGRY_DURATIONS = [120] * 7 + [240]  # register.tsx withAngry

# plugin/hooks/register.tsx THEME
SURFACE = "#1C1714"
STAGE = "#26201B"
BUBBLE = "#33261E"
TEXT = "#F3E5D3"
MUTED = "#B9A48F"
ACCENT = "#F08A4B"
OK = "#9CC98A"
AMBER = "#F2C35B"
ERR = "#F07E6E"
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


def anim(set_name: str, state: str, bust: bool) -> tuple[list[Image.Image], list[int]]:
    """An animation's frames (full figure or bust) and its frame durations, as the mod plays it."""
    d = ROOT / "plugin" / "assets" / set_name / state
    if d.is_dir():
        sheet = json.loads((ROOT / "plugin" / "hooks" / f"frames-{set_name}.ts").read_text(encoding="utf-8").split(" = ", 1)[1])
        durations = sheet["states"][state]["durations"] if state in sheet["states"] else ANGRY_DURATIONS
    else:
        d = ROOT / "plugin" / "assets" / "extra" / state
        n = len([p for p in d.glob("*.png") if p.stem.isdigit()])
        t = EXTRA_TIMING.get(state, 240)
        durations = t if isinstance(t, list) else [t] * n
    suffix = "-bust" if bust else ""
    return [Image.open(d / f"{i}{suffix}.png").convert("RGBA") for i in range(len(durations))], durations


def on(bg: str, img: Image.Image, size: tuple[int, int]) -> Image.Image:
    """The picture scaled into `size` (aspect kept, feet at the bottom) over `bg`."""
    canvas = Image.new("RGBA", size, bg)
    scale = min(size[0] / img.width, size[1] / img.height)
    small = img.resize((round(img.width * scale), round(img.height * scale)), Image.LANCZOS)
    canvas.alpha_composite(small, ((size[0] - small.width) // 2, size[1] - small.height))
    return canvas


def save_gif(frames: list[Image.Image], path: Path, step: int = STEP_MS) -> None:
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
    keep, durations = [pal[0]], [step]
    for f in pal[1:]:
        if f.tobytes() == keep[-1].tobytes():
            durations[-1] += step
        else:
            keep.append(f)
            durations.append(step)
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
    cols, cell_w, cell_h, label_h, gap = 5, 120, 120, 26, 6
    font = ImageFont.truetype(font_path, 14, index=font_index)
    anims = {st: anim(set_name, st, bust=False) for st, _ in SHOWN}
    rows = (len(SHOWN) + cols - 1) // cols
    W = cols * cell_w + (cols + 1) * gap
    H = rows * (cell_h + label_h) + (rows + 1) * gap
    out = []
    for t in range(0, LENGTH_MS, STATES_STEP_MS):
        img = Image.new("RGBA", (W, H), SURFACE)
        draw = ImageDraw.Draw(img)
        for k, (st, label) in enumerate(SHOWN):
            frames, d = anims[st]
            x = gap + (k % cols) * (cell_w + gap)
            y = gap + (k // cols) * (cell_h + label_h + gap)
            img.alpha_composite(on(STAGE, frames[frame_at(d, t)], (cell_w, cell_h)), (x, y))
            draw.text((x + cell_w / 2, y + cell_h + 6), label, fill=TEXT, font=font, anchor="ma")
        out.append(img)
    save_gif(out, OUT / "states.gif", STATES_STEP_MS)


def band_gif(set_name: str, font_path: str, font_index: int) -> None:
    W, H = 760, 230
    font = ImageFont.truetype(font_path, 20, index=font_index)
    bold = ImageFont.truetype(font_path, 20, index=font_index)
    small = ImageFont.truetype(font_path, 16, index=font_index)
    face_size = (160, 144)
    script = [  # (animation, chip colour, chip text, bubble), as register.tsx's lookOf / describeTool word them
        ("listening", ACCENT, "! 收到！", "收到！馬上處理"),
        ("searching", AMBER, "✎ 搜尋中", "正在找 login…"),
        ("writing", AMBER, "✎ 寫入中", "正在改 auth.ts…"),
        ("proud", OK, "✓ 完成了", "完成了！用時 1m12s ✿"),
    ]
    out = []
    for state, colour, title, said in script:
        busts, d = anim(set_name, state, bust=True)
        for t in range(0, 1440, STEP_MS):
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
    # One turn: each tool puts her in its own pose (register.tsx TOOL_ANIM).
    steps = [  # (animation, chip, bubble, chat lines so far, recent calls)
        ("running", "✎ 工作中", "正在讀 auth.ts…", 3, [("…", AMBER, "Read", "auth.ts")]),
        ("writing", "✎ 寫入中", "正在改 auth.ts…", 4, [("✓", OK, "Read", "auth.ts"), ("…", AMBER, "Edit", "auth.ts")]),
        ("busy_left", "✎ 執行中", "正在執行 npm test…", 5, [("✓", OK, "Read", "auth.ts"), ("✓", OK, "Edit", "auth.ts"), ("…", AMBER, "Bash", "npm test")]),
    ]
    chat = [
        ("❯ 幫我重構 auth 模組", TEXT),
        ("", TEXT),
        ("● Read src/auth.ts", MUTED),
        ("● Edit src/auth.ts", MUTED),
        ("● Bash npm test", MUTED),
    ]
    out = []
    for n, (state, title, said, lines, recent) in enumerate(steps):
        fulls, d = anim(set_name, state, bust=False)
        for t in range(0, 1680, STEP_MS):
            img = Image.new("RGBA", (W, H), TERMINAL)
            draw = ImageDraw.Draw(img)
            for i, (line, colour) in enumerate(chat[:lines]):
                text(draw, (20, 24 + i * 30), line, colour, font)
            draw.line((split, 0, split, H), fill=FRAME, width=2)
            draw.text((split + 14, 8), "Claude ちゃん", fill=MUTED, font=small)
            text(draw, (W - 26, 8), "✕", MUTED, small)
            draw.rectangle((split + 2, 34, W, H), fill=SURFACE)
            img.alpha_composite(on(STAGE, fulls[frame_at(d, t)], (W - split - 2, 250)), (split + 2, 34))
            x = chip(draw, (split + 20, 304), title, AMBER, font)
            draw.text((x + 14, 304), "Claude ちゃん", fill=ACCENT, font=font)
            bubble(draw, (split + 20, 340), said, font)
            draw.text((split + 20, 408), f"本輪 {n + 1} 次工具 · 上輪 2m14s", fill=MUTED, font=small)
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
