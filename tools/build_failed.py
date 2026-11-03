"""Build Claude's failed preview and terminal animation frames."""

import base64
import json

import numpy as np
from PIL import Image

from build_frames import ROOT, SIZES, best_cells, quad_pixels, state_box


CLAUDE_DURATIONS = [120, 120, 140, 160, 340, 320]


ASSETS = ROOT / "tools" / "assets" / "crosspet"


def claude_frames(size):
    with Image.open(ASSETS / "claude" / "failed-poses.png") as sheet:
        cell_w, cell_h = sheet.width // 3, sheet.height // 2
        poses = []
        for index in range(len(CLAUDE_DURATIONS)):
            x, y = (index % 3) * cell_w, (index // 3) * cell_h
            pose = sheet.crop((x, y, x + cell_w, y + cell_h))
            bounds = pose.getchannel("A").point(lambda alpha: 255 if alpha >= 110 else 0).getbbox()
            poses.append(pose.crop(bounds))
    width, height = size
    scale = min((width - 8) / max(p.width for p in poses),
                (height - 8) / max(p.height for p in poses))
    frames = []
    for pose in poses:
        pose = pose.resize((round(pose.width * scale), round(pose.height * scale)), Image.Resampling.LANCZOS)
        frame = Image.new("RGBA", size)
        frame.paste(pose, ((width - pose.width) // 2, height - pose.height))
        frames.append(frame)
    return frames


def write_claude_failed():
    write_gif(ASSETS / "claude" / "gif" / "failed.gif", claude_frames((240, 240)), CLAUDE_DURATIONS)


def write_gif(path, frames, durations):
    indexed = []
    for frame in frames:
        paletted = frame.convert("RGB").quantize(colors=255)
        paletted.paste(255, mask=frame.getchannel("A").point(lambda alpha: 255 if alpha < 110 else 0))
        indexed.append(paletted)
    indexed[0].save(
        path,
        save_all=True, append_images=indexed[1:], duration=durations,
        loop=0, transparency=255, disposal=2, optimize=False,
    )


def replace_failed(name):
    directory = ROOT / "plugin" / "assets" / name / "failed"
    with Image.open(directory / "0.png") as original:
        size = original.size
    frames = claude_frames(size)
    boxes = {"big": (0, 0, *size), "small": state_box((0, 0, *size), "small", frames)}

    output = ROOT / "plugin" / "hooks" / f"frames-{name}.ts"
    prefix, payload = output.read_text(encoding="utf-8").split("export const SET: SheetSet = ", 1)
    data = json.loads(payload)
    palette = np.array([[(color >> shift) & 255 for shift in (16, 8, 0)]
                        for color in data["palette"]], dtype=np.float32)

    def index(color):
        if color is None:
            return 0
        return int(np.square(palette - color).sum(axis=1).argmin()) + 1

    data["states"]["failed"]["durations"] = CLAUDE_DURATIONS
    for view, (cols, rows) in SIZES.items():
        encoded = []
        for number, frame in enumerate(frames):
            suffix = "-bust" if view == "small" else ""
            frame.crop(boxes[view]).save(directory / f"{number}{suffix}.png", optimize=True)
            cells = best_cells(quad_pixels(frame, boxes[view], cols, rows), cols, rows)
            packed = bytes(value for mask, fg, bg in cells for value in (mask, index(fg), index(bg)))
            encoded.append(base64.b64encode(packed).decode("ascii"))
        data["states"]["failed"][view] = encoded
    output.write_text(
        prefix + "export const SET: SheetSet = " + json.dumps(data, separators=(",", ":")) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    write_claude_failed()
    for style in ("smooth", "classic"):
        replace_failed(style)
