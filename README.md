# Claude-chan Terminal Companion (claudechan-chibi)

<p align="center"><b>English</b> · <a href="README.zh-TW.md">繁體中文</a> · <a href="README.ja.md">日本語</a></p>

**Current version: 0.5.6** (2026-11-06)

A chibi Claude-chan (Claude ちゃん) who lives in Claude Code's terminal UI. She changes her animation to match what Claude is doing: thinking, searching, writing files, running commands, sending out helpers, waiting for your approval, failing, finishing… When nothing is going on she shifts her pose, hums, yawns and falls asleep. Click her picture and she reacts; click too fast and she gets cross.
On a wide screen she sits in a pane on the right; on a narrow one she stands above the prompt.

> The mod's on-screen text (status chips, speech bubbles, `/chibi` messages) is in Traditional Chinese. This README quotes it with an English gloss where it matters.

<p align="center">
  <img src="docs/images/pane.gif" alt="Wide screen: a pane on the right (mock-up)" width="640"><br>
  <sub>Wide screen: a pane docked to the right of the chat; her pose follows each tool: reading → writing → running a command (mock-up)</sub>
</p>

<p align="center">
  <img src="docs/images/band.gif" alt="Narrow screen: a pane above the prompt (mock-up)" width="560"><br>
  <sub>Narrow screen: a pane above the prompt, head and shoulders only: got it → searching → writing → done (mock-up)</sub>
</p>

<details>
<summary><b>Main animations</b></summary>

<p align="center"><img src="docs/images/states.gif" alt="Main animations" width="636"></p>

<p align="center"><sub>Each one plays at the mod's own pace; the full list is under "Events and animations" below</sub></p>

</details>

> These are mock-ups drawn with the mod's layout and colours (image mode). The real look depends on your terminal and window size.

There are two art sets (smooth / classic), each with its own basic moves, plus 30-odd shared actions; both sets share one hair colour, proportions and stance. She is drawn one of two ways, picked automatically:

| Drawing | Terminals | Quality |
|---|---|---|
| **Image** | Ghostty, kitty, iTerm2 3.5+ | The original PNG pixels, sharpest |
| **Cells** (Raster) | Any other true-colour terminal (Warp, Windows Terminal, WezTerm…) | Each cell shows 2×2 pixels with quadrant block glyphs `▘▝▖▗▚▞…`; some loss is unavoidable |

---

## Requirements

| Item | Notes |
|---|---|
| Claude Code | A version with mods (function hooks); developed and tested on 2.1.316 |
| Terminal | 24-bit true colour (Warp, Windows Terminal, iTerm2, WezTerm, Ghostty, kitty…) |
| Font | Shows the quadrant blocks `▘▝▖▗▚▞▛▜▙▟` (Menlo, SF Mono, Cascadia, JetBrains Mono… all work) |
| OS | Windows / macOS / Linux (install scripts `install.ps1` / `install.sh`) |

The target machine needs **neither** Python nor Node: the frames are pre-built, cells in `plugin/hooks/frames-*.ts`, pictures in `plugin/assets/`.

---

## Install

### From GitHub (simplest)

At Claude Code's prompt:

```
/plugin install claudechan-chibi --marketplace kzger/claudechan-chibi
```

Or in a shell:

```bash
claude plugin install claudechan-chibi --marketplace kzger/claudechan-chibi
```

Answer `y` to `Add marketplace?`, choose the user scope and press Enter. In the desktop app (where `/plugin` is not available): click **+** next to the prompt → Plugins → Add marketplace, enter `kzger/claudechan-chibi`, then Add plugin.

#### Updating to a new version on GitHub

```bash
claude plugin marketplace update chibi-local
claude plugin update claudechan-chibi@chibi-local
```

Then type `/reload-plugins` in the **running** Claude Code.

If the marketplace update times out on a slow connection, raise git's limit in `~/.claude/settings.json`: `"env": { "CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS": "600000" }`.

#### Upgrading from the old name chibi-companion (0.3.x and earlier)

From 0.4.0 the mod and the repo are named `claudechan-chibi`. Since the name changed, `plugin update` will not switch over by itself: remove the old one and install the new one:

```bash
claude plugin uninstall chibi-companion@chibi-local
claude plugin marketplace update chibi-local
claude plugin install claudechan-chibi@chibi-local
```

The old GitHub URL `kzger/chibi-companion` redirects to the new one. Settings (`/chibi` layout, art set, drawing) are stored under the name, so they go back to the defaults after the rename: set them once more. `install.sh` / `install.ps1` remove the old name automatically.

> `/exit` and starting `claude` again does not always reload: if Claude Code runs as a background daemon, starting it again just does `claude attach` to the same process, which still holds the old mod in memory. `/reload-plugins` always works.

### From a local folder

### Windows

```powershell
cd <this folder>
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### macOS / Linux / WSL

```bash
cd <this folder>
bash install.sh
```

(Files copied over in a zip can lose their execute bit, so `bash install.sh` is the safest way to run it.)

The install script does three things:

1. Copies `.claude-plugin/`, `plugin/`, the READMEs and ATTRIBUTION to `~/.claude/local-marketplaces/claudechan-chibi/`
2. Registers that folder as the local marketplace `chibi-local`
3. Runs `claude plugin install claudechan-chibi@chibi-local` (the `user` scope by default, so she shows up in every project)

Restart `claude` afterwards to see her.

| Option | PowerShell | Bash |
|---|---|---|
| This project only | `-Scope project` | `--scope project` |
| Uninstall | `-Uninstall` | `--uninstall` |
| Update | Run the install script again, then `/reload-plugins` in Claude Code | Same |

### No script? Install by hand

```bash
claude plugin marketplace add <absolute path of this folder>
claude plugin install claudechan-chibi@chibi-local
```

> This reads this folder directly: do not delete or move it.

---

## Moving to another machine

1. Copy the whole `claude-chibi-cli` folder (or zip it). `tools/` can stay behind: it is only needed to rebuild the frames.
2. On the new machine, run the matching script as in "Install".
3. Settings (layout, art set) live in each machine's own Claude Code store and do not move with the folder: set them again with `/chibi` if needed.

---

## macOS

### Steps

1. Install Claude Code (skip if you have it): `curl -fsSL https://claude.ai/install.sh | bash`, or `npm install -g @anthropic-ai/claude-code`
2. Copy the `claude-chibi-cli` folder to the Mac, for example `~/claude-chibi-cli`
3. Install:
   ```bash
   cd ~/claude-chibi-cli
   bash install.sh
   ```
4. Open `claude` in a recommended terminal. If you see the picture, image mode works; `/chibi` tells you whether she is drawn as 原圖 (image) or 字元 (cells).

If macOS says it "cannot verify the developer" the first time you run files brought from another computer, run `xattr -dr com.apple.quarantine ~/claude-chibi-cli`.

### Recommended terminals

| Terminal | Drawing | Advice |
|---|---|---|
| **Ghostty** (https://ghostty.org) | Image (kitty graphics protocol) | **First choice**. Free, fast, native support, nothing to set up |
| **kitty** (https://sw.kovidgoyal.net/kitty) | Image | Very good, configured from its config file |
| **iTerm2 3.5+** | Image (needs Claude Code's fullscreen mode, the default) | Works. If you only see blank space, run `/chibi render cells` |
| WezTerm, Warp | Cells | Works, at the same quality as on Windows |
| Alacritty | Cells | Works. Alacritty supports no image protocol, so no pictures; run `/chibi render cells` once to skip the detection gap at every start. For pictures, Ghostty is the closest fit (also GPU-accelerated and configured from a file) |
| Terminal.app | Cells | Not recommended: older versions lack 24-bit colour, so colours come out wrong |

### Switching image / cells

| Command | Effect |
|---|---|
| `/chibi render auto` | Default. Pictures where the terminal can draw them, else cells |
| `/chibi render image` | Always pictures |
| `/chibi render cells` | Always cells (recommended on Alacritty, to skip the detection gap at start) |

Type `/chibi` to see what is actually in use, e.g. 「目前畫面 — 面板：原圖，上方列：原圖」 ("now — pane: image, band: image"). The setting is remembered for the next start.

### Ghostty + tmux (macOS)

tmux only hands pictures on to the outer terminal, which must be able to draw them itself:

| Setup | Pictures |
|---|---|
| Alacritty + tmux | ✗ No (Alacritty cannot draw pictures): cells only |
| Ghostty + tmux | ✓ Yes, with the settings below |
| Ghostty (no tmux) | ✓ Yes, nothing to set up |

**1. Install**

```bash
brew install --cask ghostty
brew install tmux        # skip if installed; needs tmux 3.3 or later (check with tmux -V)
```

**2. Add to `~/.tmux.conf`:**

```tmux
# Let Claude Code's pictures pass through tmux to Ghostty (needed for image mode)
set -g allow-passthrough on
set -g focus-events on

# True colour (needed for correct colours in cells mode)
set -g default-terminal "tmux-256color"
set -as terminal-features ",xterm-ghostty:RGB"
```

**3. Apply it**: a running tmux server does not read the new settings; restart it:

```bash
tmux kill-server   # closes every tmux session: save your work first
tmux
```

**4. Check**: start `claude` inside tmux and type `/chibi`; 「面板：原圖」 ("pane: image") means it works. If it says 字元 (cells):

- `tmux show -g allow-passthrough` should print `on`
- `tmux -V` should be 3.3 or later
- Make sure the outer terminal really is Ghostty (outside tmux, `echo $TERM_PROGRAM` should print `ghostty`)

### Moving from Alacritty + tmux to Ghostty

Your tmux sessions, detach, key bindings and `.tmux.conf` all carry over: only the outer terminal changes, plus the settings in step 2.

If you would rather not use tmux, Ghostty can split windows itself:

| Action | Ghostty shortcut |
|---|---|
| Split left / right | `Cmd+D` |
| Split top / bottom | `Cmd+Shift+D` |
| Previous / next split | `Cmd+[` / `Cmd+]` |
| Close the split | `Cmd+W` |

The difference: Ghostty's splits have no **detach** (closing the window ends the programs; you cannot leave them in the background and come back, or reattach over SSH). If you are used to tmux, **Ghostty + tmux** is the better fit.

### Greyish colours and no right-hand pane in tmux

When Claude Code sees tmux it does two things: it drops to 256 colours (the warm brown background turns grey), and it uses the normal (non-fullscreen) screen, where the pane cannot dock on the right and goes above the prompt instead. Add this `env` to `~/.claude/settings.json` and restart `claude`:

```json
{
  "env": {
    "CLAUDE_CODE_TMUX_TRUECOLOR": "1",
    "CLAUDE_CODE_NO_FLICKER": "1"
  }
}
```

tmux itself must have true colour on (`set -ag terminal-overrides ",xterm-256color:RGB"`). To switch the screen mode only, run `/tui fullscreen`. `/chibi` points both of these out when it sees them.

### The cursor and IME composition flicker during the animation in tmux

Claude Code wraps every frame in a "synchronized update" (hide the cursor, draw, put the cursor back in the prompt), so the terminal draws it all at once and the cursor never seems to move. tmux only passes that on when it knows the outer terminal supports synchronized updates; otherwise every cursor move gets drawn. Add to your tmux config (Alacritty 0.13+, Ghostty, kitty, WezTerm and iTerm2 all support it):

```
set -as terminal-features ",xterm-256color:sync"
```

tmux learns the outer terminal's features when it attaches, so detach (`prefix` `d`) and `tmux attach` again, or `tmux kill-server` and restart. `tmux display -p '#{client_termfeatures}'` should list `sync`.

You also need a **tmux server 3.8 or later**: up to 3.7, tmux hides the cursor outside the synchronized block when it redraws on its own, so it flickers even with `sync`. After upgrading tmux the old server keeps running the old version: `tmux kill-server` and restart. `tmux display -p '#{version}'` shows the **server** version (`tmux -V` shows only the program's).

### herdr (instead of tmux)

[herdr](https://herdr.dev) is a terminal multiplexer built for coding agents: like tmux it splits windows and keeps sessions in the background. It decodes the Kitty graphics protocol itself before handing pictures to the outer terminal, so image mode has **none of tmux's flicker when the picture changes**.

Claude Code, though, cannot detect image support inside herdr (herdr reports the terminal as `libghostty`, and Claude Code knows only `kitty` / `ghostty`), so it falls back to cells. For pictures, add to `~/.zshrc`:

```zsh
# Claude Code cannot detect image support inside herdr (it reports "libghostty"),
# but herdr renders Kitty graphics: let Claude Code draw pictures there only.
if [[ "$TERM_PROGRAM" == "herdr" ]]; then
  export CLAUDE_CODE_FORCE_TERMINAL_IMAGES=1
fi
```

- It applies inside herdr panes only (herdr sets `TERM_PROGRAM=herdr`). Do **not** put this variable in `settings.json`: in a terminal or tmux without picture support she becomes a blank block, with no fallback to cells.
- The outer terminal must draw pictures (Ghostty, kitty…).
- Open a **new** pane afterwards, or run `exec zsh` in an existing one: herdr's background service keeps panes, so after restarting herdr old panes still carry the old environment.
- Check: `echo $CLAUDE_CODE_FORCE_TERMINAL_IMAGES` prints `1`, and after `/chibi render auto` in Claude Code, `/chibi` shows 「面板：原圖」 ("pane: image").

---

## Usage

| Command | Effect |
|---|---|
| `/chibi` | Show the current settings and help |
| `/chibi auto` | **Default**. On a wide screen (fullscreen and ≥110 columns) she docks on the right; on a narrow one she sits in a pane framed above the prompt. Right after start on a narrow screen Claude Code does not let the pane place itself, so she uses the band first and switches to the pane after your first message |
| `/chibi pane` | Always open the pane (opened by hand, it works at any width) |
| `/chibi band` | Always above the prompt, never docked on the right. On a narrow screen (under 110 columns, or not fullscreen) the same framed pane with × as `auto`; on a wide screen Claude Code would dock the pane on the right, so she uses the band (framed, with Claude Code's own `[-]` on the right). Right after start, or when the window just got narrow, she also uses the band first and switches to the × pane after your next message |
| `/chibi off` | No picture: text in the status line only |
| `/chibi set smooth` | The smooth art set (default; neighbouring frames differ little, so it flickers less when small) |
| `/chibi set classic` | The classic art set (livelier faces, e.g. an open-mouthed smile when waving) |
| `/chibi render auto` | **Default**. Pictures where possible, else cells |
| `/chibi render image` | Always pictures |
| `/chibi render cells` | Always cells |

Settings are remembered for the next start.

### Layout

**Wide screen**: a pane on the right (docked beside the chat in fullscreen mode)

```
┌─ chat ───────────────────────────┬─ Claude ちゃん ──────────────┐
│ > refactor the auth module       │     (animation 34×18 cells)  │
│ ● Read src/auth.ts               │                              │
│ ● Edit src/auth.ts               │ ✎ 工作中 (working)            │
│                                  │ 正在改 auth.ts… (editing)     │
│                                  │ 7 tools this turn · last 2m14s│
│                                  │ ── recent ──                 │
│                                  │ ✓ Read auth.ts               │
│                                  │ ✗ Bash npm test              │
```

**Narrow screen**: a pane framed above the prompt (× at the top right; in image mode at most 9 rows, frame included)

```
│  (anim. 22×12)  ╭──────────────────────────╮
│  now and then   │ ✎ 工作中 (working)         │
│  she strolls    │ 正在改 auth.ts…            │
│  along the row  ╰──────────────────────────╯
│ > _
```

- The band is small, so it draws only her head and shoulders, where the face reads best; the side pane draws her whole figure.
- **In image mode she scales with the window**: the side pane uses at most 60% of the pane's width and 40% of its height; the band about 30% of the terminal's height, at most 9 rows with the frame. Cells come in two fixed sizes only (full figure 34×18, bust 22×12), picked by the room there is.
- Pictures are the original PNGs scaled up: larger means softer, not sharper.
- The band is always shown. The `[-]` on its right is Claude Code's own collapse button (a mod cannot remove it): click it or press `Ctrl+X Ctrl+A` to collapse, again to expand.
- The animation redraws at most every 240 ms (faster moves skip frames instead, keeping their speed).
- If the cursor or IME composition flickers during the animation, the terminal has no "synchronized output". This is common in tmux: see the tmux notes under macOS.
- When the band has little room: in image mode, 2–6 rows become a "mini" layout (a small face beside one line of status); with less, or under 14 rows in cells mode (12 plus the frame), it falls back to one line of text: `✎ Claude ちゃん · 工作中 正在改 auth.ts…`.
- How tall the band may be is Claude Code's decision (about the lower half of the screen, less the prompt and status line). A tall status line (e.g. a multi-line claude-hud) or a small tmux split leaves little room.
- On a terminal without fullscreen, the pane goes above the prompt and uses a compact layout.

### Why the wide-screen band has no ×

The frame with × belongs to a "pane"; the `[-]` on the right of the band above the prompt is the band's collapse button. Claude Code draws both; a mod draws only what is inside:

- Claude Code decides where a pane goes: docked on the right when fullscreen and ≥110 columns, otherwise above the prompt. A mod cannot choose, however wide it draws.
- The band always has `[-]`; a mod cannot remove it.

So on a wide fullscreen screen it is either "docked on the right" or "a × frame above the prompt", not both. `"CLAUDE_CODE_NO_FLICKER": "0"` (non-fullscreen) puts the pane above the prompt at any width, but then it can never dock on the right. This mod's choice: `/chibi band` on a wide screen uses the framed band; on a narrow one it opens the × pane.

### Colours

Taken from the character herself (orange hair, cream dress, brown book). The pane and the band paint their own background, so she looks the same on dark and light terminal themes. All text has a contrast of at least 5.5:1 against its background (WCAG AA), and states are always marked with an icon and words, never by colour alone.

| Use | Colour |
|---|---|
| Pane background | `#1C1714` |
| Her stage | `#26201B` (`#222222` in cells mode: Claude Code draws cells with 16 levels per channel, so the stage uses one of them to avoid a halo around her) |
| Speech bubble (orange rounded box) | `#33261E`, border `#F08A4B` |
| Main / secondary text | `#F3E5D3` / `#B9A48F` |
| Status chips: working / waiting / error / done / idle | `#F2C35B` / `#8FC1E3` / `#F07E6E` / `#9CC98A` / `#B9A48F` |

To change colours, edit `THEME` at the top of `plugin/hooks/register.tsx`.

### Events and animations

| Animation | When | Plays |
|---|---|---|
| `waving` | A session starts | Three loops |
| `redhot` blushing | You send a prompt or click her while she dozes (caught napping) | One loop |
| `listening` | You send a prompt (「收到！」 "got it!") | Two loops |
| `thinking` | The turn has begun but used no tool yet | Until it changes |
| `running` reading | Read, commands that only show files (`cat`, `head`, `sed -n`…), and tools not listed below | Until it changes |
| `searching` with a magnifier | Grep, Glob, WebSearch, WebFetch; search commands (`grep`, `rg`, `find`, `ls`, `git status/log/diff`…) | Until it changes |
| `writing` | Edit, Write, NotebookEdit; commands that change files (`>` into a file, `tee`, `sed -i`, `cp`/`mv`/`mkdir`, a Python script that writes…) | Until it changes |
| `busy_left/right` | Other Bash / PowerShell commands: builds, tests, installs, `git commit`… (facing the other way each time) | Until it changes |
| `delegating` | Handing work off to run on its own: Agent, a Bash command run in the background, Workflow, Monitor, CronCreate, SendMessage, SendToProject, RemoteTrigger `run` | Until it changes |
| `tired` | The turn has run over 10 minutes | Until the turn ends |
| `running-left/right` walking | While working, a walk across the band every 40 s (cells) | One walk |
| `swamped_left/right` carrying books | As above, once the turn has used 30+ tools | One walk |
| `waiting` | A permission prompt, AskUserQuestion, a plan approval | Until you answer |
| `oops` | A tool fails | Two loops |
| `dizzy` | The 3rd or later tool failure in a turn | Two loops |
| `sulk` | A tool call is denied | Two loops |
| `sorry` | You interrupt the turn | Two loops |
| `failed` | The turn ends in an error (API error…) | Three loops |
| `compact` packing up | The conversation is compacted (`/compact` or automatic) | Until compaction ends |
| `proud` | The turn finishes | Two loops |
| `happy-2` | A turn of 3+ minutes finishes | Two loops |
| `idle-1` | Nothing going on; every few loops she switches to `idle` (the set's own), `idle-2`, `idle-3`, `idle-blink`, `hum` humming, `clawd` hugging a plush | Until it changes |
| `yawn` → `sleeping-2` dozing | Idle for 2 minutes: one yawn, then asleep | Until it changes |
| `angry` | 3 clicks within 4 s (clicking while angry keeps her angry longer) | Three loops |
| `annoyed` | A 2nd click within 4 s (「別一直戳啦」 "stop poking me") | One loop |
| `forgiven` | Her anger passes | One loop |

**Clicking her picture**: each click plays the next reaction and line in turn (`surprised`, `pat-2` hiding behind her book, `coaxed` shy, `hum` humming); after one loop (at least 1.5 s) she goes back to what she was doing and saying. Clicked while dozing she wakes up blushing (「啊…被你看到我在打瞌睡了！」 "ah… you caught me napping!"). Only "waiting for you" (a permission prompt etc.) is never interrupted. Clicks land on a transparent layer over the picture, so the terminal must report mouse events (Ghostty, kitty, iTerm2, WezTerm… all do).

`waving`, `running`, `running-left/right`, `waiting`, `failed`, `angry` and the rotation's `idle` are each art set's own (smooth / classic); the other actions come from `image26-v1/` and are shared by both sets. The shared actions were drawn from [CrossPet (lokicorvus)](https://github.com/lokicorvus/crosspet)'s Claude art as starting poses and keep CC BY-NC-SA 4.0; credits in [ATTRIBUTION.txt](ATTRIBUTION.txt). How the art was made: [docs/art-provenance.md](docs/art-provenance.md) (in Chinese).

`failed` is six book-hugging reactions drawn with this project's own poses as reference (`tools/build_failed.py`). `angry`'s pictures are made by `tools/build_angry.py` from a hands-on-hips pose, `tools/assets/angry-pose.png` (generated separately with the character as reference): she leans forward twice while Twemoji's 💢 (CC BY 4.0, credited in `plugin/ATTRIBUTION.txt`) throbs above her head. Its cells are converted from the same pictures.

From 0.5.2 all three picture sets (`smooth`, `classic`, `extra`) are the corrected ones from `tools/assets/plugin-assets-corrected-v1/`: one hair colour, proportions and stance (standing poses centred at x=91 with feet at y=178), and one canvas for both sets, 186×184 full figure and 130×125 bust. `sorry`, `stretch`, `clawd`, `delegating` and `compact` were redrawn. Notes in [docs/art-provenance.md](docs/art-provenance.md) (in Chinese).

When several states apply at once, `pickState()` in `plugin/hooks/mood.ts` picks which one shows.

---

## Customising

| To change | File |
|---|---|
| State priority, the tired threshold | `plugin/hooks/mood.ts` → `pickState()`, `TIRED_AFTER_MS` |
| Each tool's pose, the idle rotation, the shared actions' timing | `plugin/hooks/register.tsx` → `TOOL_ANIM`, `IDLE_ROTATION`, `EXTRA_TIMING` |
| How Bash commands count as writing / searching / reading / running | `plugin/hooks/shell.ts` → `SEARCH`, `READ`, `WRITE`, `GIT_LOOK` |
| Bubble text, each tool's description | `plugin/hooks/register.tsx` → `describeTool()`, `TITLE` |
| Thresholds for collapsing, dozing, strolling, dizziness, carrying books | The constants at the top of `plugin/hooks/register.tsx` |
| Click reactions, lines, the anger threshold | `plugin/hooks/register.tsx` → `POKES`, `ANGRY_LINES`, `POKE_ANGRY_AT`, `POKE_WINDOW_MS` |
| Replace an action's pictures | Edit the PNGs in `tools/assets/plugin-assets-corrected-v1/<set>/<action>/` (keep 186×184 / 130×125), then run `tools/build_corrected.py` |
| Cell sizes, colour count | `SIZES` (cells) and `IMAGE_ROWS` (pictures) in `tools/build_frames.py`, then run `tools/build_corrected.py` |
| Colours | `THEME` in `plugin/hooks/register.tsx` |

To redraw the README's pictures (needs Python 3 + Pillow and a font with Traditional Chinese and kana; macOS's PingFang will do):

```bash
python tools/make_readme_images.py            # writes to docs/images/
```

To rebuild the frames (needs Python 3 + Pillow + NumPy):

```bash
# install the corrected PNGs into plugin/assets/ and rebuild frames-smooth/classic/extra.ts
uv run --with pillow --with numpy python tools/build_corrected.py
```

Production art such as `tools/assets/plugin-assets-corrected-v1/` and `image26-v1/` stays on the production machine and is not in git (keeping the repo small keeps marketplace updates fast); a clone from GitHub holds only the finished `plugin/assets/`.

`build_frames.py`, `build_extra.py` and `build_angry.py` are the old pipeline from the old sources (the Codex spritesheets, `image26-v1/`, the hands-on-hips pose). They would overwrite the corrected art, so they refuse to run unless given `--overwrite-corrected`. `build_failed.py` also rewrites `failed`'s pictures and cells: do not run it over the corrected art either.

Checks after a change:

```bash
claude plugin validate plugin     # manifest and hooks
claude plugin test plugin         # the tests in plugin/tests
```

---

## Troubleshooting

| Problem | Fix |
|---|---|
| She never shows up | `claude plugin list` should show `claudechan-chibi@chibi-local` enabled; start with `claude --debug` and search for `claudechan-chibi` |
| The pane does not open | Under 144 columns auto mode uses the band instead of opening the pane; `/chibi pane` forces it open |
| The pane appears above the prompt, not on the right | Not a fullscreen screen (tmux's default): run `/tui fullscreen`, or set `CLAUDE_CODE_NO_FLICKER=1` (see the tmux notes under macOS) |
| The cursor or IME composition flickers during the animation | tmux has no synchronized updates, or the tmux server is older than 3.8: add `set -as terminal-features ",xterm-256color:sync"` and check `tmux display -p '#{version}'` ≥ 3.8, else `tmux kill-server` and restart (see the tmux notes under macOS) |
| Only cells inside herdr, no pictures | Claude Code cannot detect herdr's image support: see the herdr notes under macOS and set `CLAUDE_CODE_FORCE_TERMINAL_IMAGES` |
| In tmux, image mode blinks now and then | In tmux Claude Code reuses one image id for every frame and resends the whole PNG in chunks; tmux passes these straight to the terminal outside the synchronized update, so the picture may go blank for a moment while it changes. Run `claude` outside tmux (Ghostty directly, or herdr), or use `/chibi render cells` |
| In tmux the colours are greyish, unlike other terminals | Claude Code uses 256 colours inside tmux: set `CLAUDE_CODE_TMUX_TRUECOLOR=1` (see the tmux notes under macOS) |
| Only blank space on a Mac, no picture | The terminal cannot draw pictures, or tmux has no passthrough: run `/chibi render cells`, or switch to Ghostty |
| Thin gaps or grid lines in the picture | The terminal draws block glyphs from the font instead of itself: change the font, or set the line spacing to 1.0 |
| Odd colours, blotches | The terminal has no true colour; tmux users see step 2 of "Ghostty + tmux" above |
| The picture looks squashed or stretched | The font's cell is not 1:2: use another monospace font, or set the line spacing back to 1.0 |
| Turn her off for a while | `/chibi off`, or `claude plugin disable claudechan-chibi@chibi-local` |

---

## Files

```
claude-chibi-cli/
├─ .claude-plugin/marketplace.json   the local marketplace (chibi-local)
├─ plugin/                           the mod (claudechan-chibi)
│  ├─ .claude-plugin/plugin.json
│  ├─ hooks/hooks.json
│  ├─ hooks/register.tsx             events, state machine, drawing the pane and the band
│  ├─ hooks/mood.ts                  pickState(): state priority
│  ├─ hooks/poke.tsx                 the transparent click layer over the picture (Client)
│  ├─ hooks/sprite.ts                frame decoding → Raster quadrant cells
│  ├─ hooks/shell.ts                 her pose from a Bash command's text
│  ├─ hooks/frames-smooth.ts         smooth set cells (generated)
│  ├─ hooks/frames-classic.ts        classic set cells (generated)
│  ├─ hooks/frames-extra.ts          shared actions' cells (generated)
│  ├─ assets/<set>/<action>/<n>.png      picture frames, full figure (generated)
│  ├─ assets/<set>/<action>/<n>-bust.png picture frames, bust (for the band)
│  ├─ assets/extra/<action>/         shared actions' picture frames (both sets)
│  ├─ types/index.d.ts               the $.state type contract
│  └─ tests/                         tests (drawing, shell commands)
├─ tools/build_corrected.py          corrected PNGs → plugin/assets and the cells
├─ tools/build_frames.py             (old) spritesheet → frames; shared cell helpers
├─ tools/build_angry.py              (old) hands-on-hips pose → angry frames
├─ tools/build_extra.py              (old) image26-v1 → shared actions' frames
├─ tools/make_readme_images.py       the README pictures
├─ docs/images/                      the README's GIFs
├─ install.ps1 / install.sh          install, update, uninstall
├─ ATTRIBUTION.txt                   art sources and licences
└─ README.md / README.zh-TW.md / README.ja.md   this guide (English / 繁體中文 / 日本語)
```

---

## License

Character art: CrossPet (lokicorvus), **CC BY-NC-SA 4.0**. This mod's frames are an adaptation under the same license: keep the credit, non-commercial use only, share alike. See `ATTRIBUTION.txt`.
