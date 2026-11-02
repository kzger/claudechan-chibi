# Claude 娘・終端機陪伴（chibi-companion）

讓 Q 版 Claude 娘住進 Claude Code 的終端機介面。她會依 Claude 正在做的事切換 9 種動畫：讀檔、改檔、等你核准、出錯、完成……
寬螢幕時她坐在右側面板，窄螢幕時改站在輸入框上方。

圖像使用 Codex 寵物的兩組精靈圖（流暢版 / 經典版），有兩種繪製方式，會自動選擇：

| 繪製方式 | 終端機 | 畫質 |
|---|---|---|
| **原圖**（Image） | Ghostty、kitty、iTerm2 3.5+ | 原始 PNG 像素，最清楚 |
| **字元畫**（Raster） | 其他支援真彩色的終端機（Warp、Windows Terminal、WezTerm…） | 每格用四分塊字元 `▘▝▖▗▚▞…` 表現 2×2 像素，無法避免失真 |

---

## 需求

| 項目 | 說明 |
|---|---|
| Claude Code | 支援 mods（function hooks）的版本；本 mod 以 2.1.316 開發與測試 |
| 終端機 | 支援 24-bit 真彩色（Warp、Windows Terminal、iTerm2、WezTerm、Ghostty、kitty 等） |
| 字型 | 能正常顯示四分塊字元 `▘▝▖▗▚▞▛▜▙▟`（Menlo、SF Mono、Cascadia、JetBrains Mono 等都可以） |
| 作業系統 | Windows / macOS / Linux（安裝腳本分別為 `install.ps1` / `install.sh`） |

目標裝置**不需要** Python 或 Node；動畫幀已預先轉好，字元畫在 `plugin/hooks/frames-*.ts`，原圖在 `plugin/assets/`。

---

## 安裝

### 從 GitHub 安裝（最簡單）

在 Claude Code 的提示列輸入：

```
/plugin install chibi-companion --marketplace kzger/chibi-companion
```

或在 shell 裡：

```bash
claude plugin install chibi-companion --marketplace kzger/chibi-companion
```

出現 `Add marketplace?` 時按 `y`，選 user scope 後按 Enter 即可。桌面版 App（`/plugin` 不能用時）：點提示框旁的 **+** → Plugins → Add marketplace，輸入 `kzger/chibi-companion`，再 Add plugin。

#### 更新到 GitHub 上的新版

```bash
claude plugin marketplace update chibi-local
claude plugin update chibi-companion@chibi-local
```

然後在**正在執行的** Claude Code 裡輸入 `/reload-plugins`。

> `/exit` 再開 `claude` 不一定會重新載入：Claude Code 若以背景常駐（daemon）方式執行，重開只是 `claude attach` 回到同一個程序，記憶體裡仍是舊版 mod。`/reload-plugins` 一定有效。

### 從本機資料夾安裝

### Windows

```powershell
cd <本資料夾>
powershell -ExecutionPolicy Bypass -File .\install.ps1
```

### macOS / Linux / WSL

```bash
cd <本資料夾>
bash install.sh
```

（用 zip 搬過來的檔案可能會失去執行權限，所以用 `bash install.sh` 執行最保險。）

安裝腳本會做三件事：

1. 把 `.claude-plugin/`、`plugin/`、README、ATTRIBUTION 複製到 `~/.claude/local-marketplaces/chibi-companion/`
2. 以這個資料夾註冊本機 marketplace `chibi-local`
3. 執行 `claude plugin install chibi-companion@chibi-local`（預設 `user` scope，所有專案都會出現）

完成後重新啟動 `claude` 即可看到她。

| 參數 | PowerShell | Bash |
|---|---|---|
| 只裝在目前專案 | `-Scope project` | `--scope project` |
| 移除 | `-Uninstall` | `--uninstall` |
| 更新 | 再執行一次安裝腳本，然後在 Claude Code 內 `/reload-plugins` | 同左 |

### 不想跑腳本？手動安裝

```bash
claude plugin marketplace add <本資料夾的絕對路徑>
claude plugin install chibi-companion@chibi-local
```

> 這種方式直接讀本資料夾，資料夾不能刪或搬走。

---

## 移植到其他裝置

1. 複製整個 `claude-chibi-cli` 資料夾（或壓縮成 zip 帶走）。`tools/` 可以不帶，只有重新產生動畫幀時才需要。
2. 在新裝置上照「安裝」執行對應腳本。
3. 設定（顯示方式、圖庫）存在各裝置自己的 Claude Code store，不會跟著搬，需要時再用 `/chibi` 設定一次。

---

## macOS

### 安裝步驟

1. 安裝 Claude Code（已安裝可略過）：`curl -fsSL https://claude.ai/install.sh | bash`，或 `npm install -g @anthropic-ai/claude-code`
2. 把 `claude-chibi-cli` 資料夾複製到 Mac，例如 `~/claude-chibi-cli`
3. 執行安裝：
   ```bash
   cd ~/claude-chibi-cli
   bash install.sh
   ```
4. 用推薦的終端機打開 `claude`。看到原圖代表圖片模式正常；`/chibi` 會顯示目前用的是「原圖」還是「字元」。

macOS 第一次執行從其他電腦帶來的檔案，若出現「無法驗證開發者」，執行 `xattr -dr com.apple.quarantine ~/claude-chibi-cli` 即可。

### 推薦終端機

| 終端機 | 繪製方式 | 建議 |
|---|---|---|
| **Ghostty**（https://ghostty.org） | 原圖（kitty 圖片協定） | **首選**。免費、快，原生支援，不用設定 |
| **kitty**（https://sw.kovidgoyal.net/kitty） | 原圖 | 很好，設定都寫在設定檔裡 |
| **iTerm2 3.5+** | 原圖（需要 Claude Code 的 fullscreen 模式，預設就是） | 可用。若只看到空白，執行 `/chibi render cells` |
| WezTerm、Warp | 字元畫 | 可用，但畫質跟 Windows 上一樣 |
| Alacritty | 字元畫 | 可用。Alacritty 不支援任何圖片協定，無法顯示原圖；建議執行一次 `/chibi render cells`，省掉每次啟動時的偵測空白。想要原圖可改用 Ghostty（同樣是 GPU 加速、設定檔驅動，習慣最接近） |
| 內建「終端機」Terminal.app | 字元畫 | 不建議：舊版不支援 24-bit 真彩色，顏色會跑掉 |

### 切換原圖／字元畫

| 指令 | 效果 |
|---|---|
| `/chibi render auto` | 預設。能畫原圖就用原圖，不支援時自動改字元畫 |
| `/chibi render image` | 強制原圖 |
| `/chibi render cells` | 強制字元畫（Alacritty 建議設這個，省掉啟動時的偵測空白） |

輸入 `/chibi` 可看目前實際狀態，例如「目前畫面 — 面板：原圖，上方列：原圖」。設定會記住，下次啟動沿用。

### Ghostty + tmux（macOS）

tmux 只是把圖片「轉交」給外層終端機，外層終端機本身要能畫圖才行：

| 組合 | 原圖 |
|---|---|
| Alacritty + tmux | ✗ 不行（Alacritty 不支援圖片），只能用字元畫 |
| Ghostty + tmux | ✓ 可以，照下面設定 |
| Ghostty（不用 tmux） | ✓ 可以，不用設定 |

**1. 安裝**

```bash
brew install --cask ghostty
brew install tmux        # 已安裝可略過；需要 tmux 3.3 以上（tmux -V 查版本）
```

**2. 編輯 `~/.tmux.conf`，加上：**

```tmux
# 讓 Claude Code 的圖片穿過 tmux，交給 Ghostty 繪製（原圖模式必需）
set -g allow-passthrough on
set -g focus-events on

# 真彩色（字元畫模式的顏色正確需要）
set -g default-terminal "tmux-256color"
set -as terminal-features ",xterm-ghostty:RGB"
```

**3. 讓設定生效**：舊的 tmux server 不會讀新設定，要整個重開：

```bash
tmux kill-server   # 會關閉所有 tmux session，先存好工作
tmux
```

**4. 確認**：在 tmux 裡啟動 `claude`，輸入 `/chibi`，看到「面板：原圖」即成功。若是「字元」：

- `tmux show -g allow-passthrough` 應顯示 `on`
- `tmux -V` 應為 3.3 以上
- 確認外層真的是 Ghostty（在 tmux 外執行 `echo $TERM_PROGRAM` 應顯示 `ghostty`）

### 從 Alacritty + tmux 換到 Ghostty

tmux 的 session、detach、快捷鍵、`.tmux.conf` 全部照舊沿用，只換外層終端機，再加上第 2 步的設定即可。

不想用 tmux 的話，Ghostty 本身也能分割視窗：

| 動作 | Ghostty 快捷鍵 |
|---|---|
| 左右分割 | `Cmd+D` |
| 上下分割 | `Cmd+Shift+D` |
| 切換上一個／下一個分割 | `Cmd+[` ／ `Cmd+]` |
| 關閉目前分割 | `Cmd+W` |

差別：Ghostty 的分割沒有 tmux 的 **detach**（關掉視窗程式就結束，不能放在背景之後再接回，也不能透過 SSH 接回同一個 session）。習慣 tmux 的話，建議 **Ghostty + tmux**。

### tmux 裡顏色偏灰、看不到右側面板

Claude Code 偵測到 tmux 時會做兩件事——把顏色降成 256 色（暖棕色背景變成灰色），以及改用一般（非 fullscreen）畫面，這時面板無法停靠在右側，只能放在輸入框上方。在 `~/.claude/settings.json` 加上下面的 `env`，然後重開 `claude`：

```json
{
  "env": {
    "CLAUDE_CODE_TMUX_TRUECOLOR": "1",
    "CLAUDE_CODE_NO_FLICKER": "1"
  }
}
```

前提是 tmux 本身已開真彩色（`set -ag terminal-overrides ",xterm-256color:RGB"`）。

### tmux 裡動畫時游標狂閃、輸入法組字跟著閃

Claude Code 每畫一幀都用「同步更新」包起來（先藏游標、畫圖、再把游標放回輸入框），終端機一次畫完就看不到游標移動。但 tmux 只有在知道外層終端機支援同步更新時才會照做，否則游標的每一步移動都會被畫出來。在 tmux 設定加上（Alacritty 0.13+、Ghostty、kitty、WezTerm、iTerm2 都支援）：

```
set -as terminal-features ",xterm-256color:sync"
```

tmux 是在連線時決定外層終端機的功能，所以要 detach（`prefix` `d`）再 `tmux attach`，或 `tmux kill-server` 重開。用 `tmux display -p '#{client_termfeatures}'` 確認清單裡有 `sync`。只想切換畫面模式也可以執行 `/tui fullscreen`。`/chibi` 偵測到這兩種情況時會提示。

---

## 使用

| 指令 | 作用 |
|---|---|
| `/chibi` | 顯示目前設定與說明 |
| `/chibi auto` | **預設**。寬螢幕（≥144 欄）開右側面板，否則用輸入框上方列 |
| `/chibi pane` | 強制開面板（手動開啟時任何寬度都可以） |
| `/chibi band` | 只用輸入框上方列 |
| `/chibi off` | 不畫圖，只在狀態列顯示文字 |
| `/chibi set smooth` | 流暢版圖庫（預設，相鄰幀差異小，縮小後較不閃爍） |
| `/chibi set classic` | 經典版圖庫（表情較生動，例如揮手時張嘴笑） |
| `/chibi render auto` | **預設**。能畫原圖就用原圖，終端機不支援時自動改成字元畫 |
| `/chibi render image` | 強制原圖 |
| `/chibi render cells` | 強制字元畫 |

設定會記住，下次啟動沿用。

### 畫面配置

**寬螢幕**：右側面板（fullscreen 模式下停靠在對話旁）

```
┌─ chat ───────────────────────────┬─ Claude 娘 ──────────────────┐
│ > 幫我重構 auth 模組               │       (動畫 34×18 格)        │
│ ● Read src/auth.ts               │                              │
│ ● Edit src/auth.ts               │ ✎ 工作中                      │
│                                  │ 正在改 auth.ts…               │
│                                  │ 本輪 7 次工具 · 上輪 2m14s     │
│                                  │ ── 最近 ──                    │
│                                  │ ✓ Read auth.ts               │
│                                  │ ✗ Bash npm test              │
```

**窄螢幕**：輸入框上方列（約 12 行）

```
│  (動畫 22×12)   ╭──────────────────────────╮
│  工作時偶爾會    │ ✎ 工作中                  │
│  在這排走來走去   │ 正在改 auth.ts…           │
│                 ╰──────────────────────────╯
│ > _
```

- 上方列空間小，只畫她的上半身（頭到肩膀），臉部比較清楚；側面板畫全身。
- 閒置 30 秒後上方列自動收起，有新事件再展開。
- 動畫每次重畫至少間隔 240ms（較快的動作改用跳幀，速度不變）。
- 動畫時游標或輸入法組字一直閃：終端機沒有開「同步更新」（synchronized output）。tmux 裡尤其常見，見 macOS 的 tmux 說明。
- 上方列可用高度不足 12 行時，退回一行文字：`✎ Claude 娘 · 工作中 正在改 auth.ts…`。
- 非 fullscreen 的終端機上，面板會放在輸入框上方，並自動改用精簡排版。

### 配色

取自角色本身的顏色（髮色橘、奶油色洋裝、棕色書本），面板與上方列自帶背景色，深色或淺色的終端機主題看起來都一樣。所有文字與背景的對比度都在 5.5:1 以上（WCAG AA），狀態一律用「圖示＋文字」標示，不只靠顏色區分。

| 用途 | 色碼 |
|---|---|
| 面板背景 | `#1C1714` |
| 角色舞台 | `#26201B` |
| 對話泡泡（橘色圓角框） | `#33261E`，邊框 `#F08A4B` |
| 主要文字／次要文字 | `#F3E5D3` ／ `#B9A48F` |
| 狀態標籤：工作中／等待／出錯／完成／待機 | `#F2C35B` ／ `#8FC1E3` ／ `#F07E6E` ／ `#9CC98A` ／ `#B9A48F` |

要改顏色，修改 `plugin/hooks/register.tsx` 開頭的 `THEME`。

### 事件與動畫

| 動畫 | 何時出現 | 播放方式 |
|---|---|---|
| `waving` 揮手 | 開啟 session | 播三輪 |
| `jumping` 點頭眨眼 | 你送出 prompt（「收到！」） | 播三輪 |
| `running` 寫作 | 這一輪正在進行 | 持續 |
| `waiting` 等待 | 權限確認、AskUserQuestion、計畫核准 | 持續到你回應 |
| `failed` 失敗 | 工具出錯或被拒絕、你中斷、API 錯誤 | 播三輪 |
| `review` 閱讀 | 這一輪完成 | 播三輪 |
| `idle` 待機 | 沒事時；閒置 5 分鐘後停在閉眼幀打瞌睡 | 持續 |
| `running-left/right` | 工作超過 40 秒時，在上方列左右走一趟 | 一趟 |

同時符合多個狀態時，顯示哪一個由 `plugin/hooks/mood.ts` 的 `pickState()` 決定。

---

## 自訂

| 想改什麼 | 檔案 |
|---|---|
| 狀態優先順序 | `plugin/hooks/mood.ts` → `pickState()` |
| 對話泡泡文字、各工具的描述 | `plugin/hooks/register.tsx` → `describeTool()`、`TITLE` |
| 收起、打瞌睡、散步的時間 | `plugin/hooks/register.tsx` 開頭的常數 |
| 動畫尺寸、色數、換圖庫 | `tools/build_frames.py` 的 `SIZES`（字元畫）、`IMAGE_ROWS`（原圖）、`CROP`（上方列的上半身裁切），改完重新產生 |
| 配色 | `plugin/hooks/register.tsx` 的 `THEME` |

重新產生動畫幀（需要 Python 3 + Pillow + NumPy）：

```bash
# 兩組 Codex v1 精靈圖（1536×1872，8×9 格，每格 192×208）
python tools/build_frames.py --smooth path/to/smooth.png --classic path/to/classic.png
```

修改後的檢查：

```bash
claude plugin validate plugin     # 檢查 manifest 與 hooks
claude plugin test plugin         # 執行 plugin/tests 的繪製測試
```

---

## 疑難排解

| 狀況 | 處理 |
|---|---|
| 完全沒出現 | `claude plugin list` 確認 `chibi-companion@chibi-local` 已啟用；用 `claude --debug` 啟動，搜尋 `chibi-companion` |
| 面板沒開 | 終端機寬度不到 144 欄時，自動模式不會開面板，會改用上方列；可用 `/chibi pane` 強制開啟 |
| 面板只出現在輸入框上方、不在右側 | 不是 fullscreen 畫面（tmux 預設如此）：執行 `/tui fullscreen`，或設定 `CLAUDE_CODE_NO_FLICKER=1`（見 macOS 的 tmux 說明） |
| 動畫時游標一直閃、輸入法組字跟著閃 | tmux 沒開同步更新：加 `set -as terminal-features ",xterm-256color:sync"` 後重新 attach（見 macOS 的 tmux 說明） |
| tmux 裡配色偏灰、跟其他終端機差很多 | Claude Code 在 tmux 裡只用 256 色：設定 `CLAUDE_CODE_TMUX_TRUECOLOR=1`（見 macOS 的 tmux 說明） |
| Mac 上只看到空白、沒有圖 | 終端機不支援圖片，或 tmux 沒設定 passthrough；執行 `/chibi render cells` 改用字元畫，或換 Ghostty |
| 圖案有細縫或格線 | 終端機用字型畫方塊字元而不是自己繪製；換字型，或調整行距為 1.0 |
| 顏色怪、出現色塊 | 終端機沒開真彩色；tmux 使用者見上方「Ghostty + tmux」第 2 步的真彩色設定 |
| 圖案比例扁或長 | 字型行高不是 1:2；換一個等寬字型，或把行距設回 1.0 |
| 想暫時關掉 | `/chibi off`，或 `claude plugin disable chibi-companion@chibi-local` |

---

## 檔案結構

```
claude-chibi-cli/
├─ .claude-plugin/marketplace.json   本機 marketplace（chibi-local）
├─ plugin/                           mod 本體（chibi-companion）
│  ├─ .claude-plugin/plugin.json
│  ├─ hooks/hooks.json
│  ├─ hooks/register.tsx             事件、狀態機、面板與上方列的繪製
│  ├─ hooks/mood.ts                  pickState()：狀態優先順序
│  ├─ hooks/sprite.ts                幀解碼 → Raster 四分塊字元
│  ├─ hooks/frames-smooth.ts         流暢版字元畫動畫幀（自動產生）
│  ├─ hooks/frames-classic.ts        經典版字元畫動畫幀（自動產生）
│  ├─ assets/<圖庫>/<動作>/<n>.png    原圖動畫幀，全身（自動產生）
│  ├─ assets/<圖庫>/<動作>/<n>-bust.png  原圖動畫幀，上半身（上方列用）
│  ├─ types/index.d.ts               $.state 型別契約
│  └─ tests/render.test.tsx          繪製測試
├─ tools/build_frames.py             精靈圖 → 動畫幀轉換
├─ install.ps1 / install.sh          安裝、更新、移除
├─ ATTRIBUTION.txt                   素材來源與授權
└─ README.md
```

---

## 授權

角色原畫：CrossPet（lokicorvus），**CC BY-NC-SA 4.0**。本 mod 的動畫幀為改作，沿用相同授權：須保留署名、限非商業用途、以相同授權分享。詳見 `ATTRIBUTION.txt`。
