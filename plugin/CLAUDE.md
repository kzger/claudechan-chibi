# plugin/：mod 本體（claudechan-chibi）

## 目的

Claude Code 的 function hooks mod：依事件切換 Claude ちゃん的動畫，畫在右側面板（Pane）或輸入框上方（AbovePrompt），並提供 `/chibi` 指令。

## 負責範圍

| 路徑 | 內容 |
|---|---|
| `.claude-plugin/plugin.json` | 名稱、版本、說明。版本規則見根目錄 CLAUDE.md「發佈更新」 |
| `hooks/hooks.json` | 只載入 `./register.tsx` |
| `hooks/register.tsx` | 所有 hook：事件 → 旗標、動畫時鐘、面板與上方列的繪製、`/chibi`、點擊反應、各工具的姿勢與台詞 |
| `hooks/mood.ts` | `pickState()`：純函式，依旗標決定目前的動畫與優先順序 |
| `hooks/shell.ts` | `shellWork()`：純函式，依 Bash／PowerShell 指令內容判斷寫入／搜尋／閱讀／執行 |
| `hooks/sprite.ts` | 動畫名稱型別（`StateName`、`ExtraName`）與字元幀解碼 |
| `hooks/poke.tsx` | 疊在圖上的透明點擊區 |
| `hooks/frames-smooth.ts`、`frames-classic.ts`、`frames-extra.ts` | 字元畫資料與色盤，**自動產生** |
| `assets/<smooth\|classic\|extra>/<動作>/<n>.png`、`<n>-bust.png` | 原圖動畫幀，**由 `tools/build_corrected.py` 安裝** |
| `types/index.d.ts` | `$.state` 型別契約（`view`、`prefs`、`paneShown`、`imageFailed`） |
| `tests/` | `render.test.tsx`（繪製與事件）、`shell.test.ts`（指令分類） |
| `ATTRIBUTION.txt` | 隨插件發佈的署名；與根目錄 `ATTRIBUTION.txt` 同步更新 |

## 本地契約

- `frames-*.ts` 與 `assets/` 不要手改：改來源後用 `tools/build_corrected.py` 重建（見 `tools/CLAUDE.md`）。
- 素材格式：全身 186×184、Bust 130×125（全身的固定裁切）；兩組圖庫與 `extra` 共用同一舞台（一般站姿身體中心 x=91、腳底 y=178）。
- 動畫名稱：`StateName` 是各圖庫自己的狀態，`ExtraName` 是放在 `assets/extra/`、兩組共用的動作；新增動作要同時改 `sprite.ts` 的型別、`register.tsx` 的 `EXTRA_LOOK`（標籤）與觸發邏輯。
- 狀態優先順序只在 `mood.ts` 的 `pickState()` 決定；`register.tsx` 只設旗標（`...Until` 時間戳）。
- 各工具的姿勢：`TOOL_ANIM`；指派背景工作（`run_in_background`、`Agent`、`Workflow`、`Monitor`、`CronCreate`、`SendMessage`、`SendToProject`、`RemoteTrigger` 的 `run`）一律 `delegating`；其餘 Bash／PowerShell 依 `shell.ts`，執行類指令輪流播 `busy_left`／`busy_right`。
- 節奏：每幀至少 `MIN_FRAME_MS`（240ms），更短的幀會被跳過；共用動作的節奏在 `EXTRA_TIMING`，未列的一律 240ms。
- 一次性動作播幾輪：圖庫自己的狀態 3 輪，共用動作 2 輪（`oneShotMs`）。
- `shellWork()` 會在每次工具呼叫執行：只判斷指令前 8 KB，正規表示式不得跨行回溯。
- `tool.call` 遇到 subagent 的呼叫（有 `agentId`）不改變主畫面的狀態。

## 工作準則

- 畫面上的文字（標籤、台詞、`/chibi` 訊息）用繁體中文。
- 狀態一律用「圖示＋文字」標示，不只靠顏色；配色改 `register.tsx` 的 `THEME`。

## 驗證

```bash
claude plugin validate plugin   # manifest 與 hooks
claude plugin test plugin       # tests/ 的測試
```

- `validate` 會警告本檔不是插件的 project context：本檔只供在 repo 裡開發時使用，這個警告屬預期。

- 測試用 mock clock；跟時間有關的斷言要預留閒置輪播單幀最長約 2 秒的誤差，不靠 PNG 讀取次數判斷（有快取）。
- 型別檢查：在本機以 `npx -p typescript@5.6.3 tsc` 搭配 plugin-authoring skill 的 `claude-code.d.ts`；`tests/` 既有的型別錯誤與本 mod 無關。

## 子文件索引

無。
