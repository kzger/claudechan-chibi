# claudechan-chibi

Claude Code 的 mod（function hooks plugin）：Q 版 Claude ちゃん動畫陪伴。mod 本體在 `plugin/`，使用說明見 `README.md`（英文，預設）、`README.zh-TW.md`（繁中）、`README.ja.md`（日文）。

## DOX 框架

- 本 repo 使用 DOX（[agent0ai/dox](https://github.com/agent0ai/dox)）：以 CLAUDE.md 階層作為各子樹的工作契約。
- 任何修改都要遵守 DOX 規則。

### 核心契約

- CLAUDE.md 是其子樹的約束性工作契約。
- 產物、素材來源、指示、紀錄、資產與長期文件，都必須能從最近的 CLAUDE.md 加上其上所有父層 CLAUDE.md 讀懂。

### 修改前先讀

1. 讀根目錄的 CLAUDE.md。
2. 列出預計會動到的每個檔案或資料夾。
3. 從 repo 根目錄走到每個目標路徑。
4. 讀路徑上遇到的每一份 CLAUDE.md。
5. 父層的子文件索引列出某份子 CLAUDE.md 且其範圍涵蓋目標路徑時，讀那份子文件，再從那裡往下走。
6. 以最近的 CLAUDE.md 為本地契約，父層文件管 repo 層級的規則。
7. 文件衝突時，越近的文件決定本地細節，但子文件不得削弱 DOX。

不要依賴記憶：每次 session 修改前，都要重新讀適用的 DOX 鏈。

### 修改後更新

每次有意義的修改，完成前都要做一次 DOX 檢查。以下情況要更新最近的負責 CLAUDE.md：

- 目的、範圍、負責範圍或職責改變
- 長期結構、契約、工作流程或操作規則改變
- 必要的輸入、輸出、權限、限制、副作用或產物改變
- 使用者對行為、溝通、流程、組織或品質的偏好改變
- CLAUDE.md 的新增、刪除、移動、改名，或索引內容改變

父層的結構、負責範圍、工作流程或子文件索引改變時，更新父層文件。父層改變影響本地規則時，更新子文件。過期或矛盾的文字立刻刪除。不改變行為或契約的小修改可以不動文件，但仍要做 DOX 檢查。

### 階層

- 根目錄 CLAUDE.md 是 DOX 主軸：全專案指示、全域偏好、長期工作流程規則，以及最上層的子文件索引。
- 子 CLAUDE.md 負責各自領域的指示，並有自己的子文件索引。
- 父層說明直屬子文件涵蓋什麼、哪些仍由父層負責。
- 文件離實際工作越近，內容越具體、越實用。

### 子文件格式

- 資料夾成為有自己目的、規則、職責、工作流程、素材或品質標準的長期邊界時，建立子 CLAUDE.md。
- 「工作準則」只寫專案現行標準或使用者指示；還沒有就留空。
- 「驗證」只寫現有的檢查；還沒有驗證機制就留空，有了再補。

預設章節順序：目的、負責範圍、本地契約、工作準則、驗證、子文件索引。

### 文字風格

- 精簡、反映現況、可操作。
- 記錄穩定的契約，不寫日記。
- 通用規則放父層，具體細節放子文件。
- 用直接的條列與明確的名稱。
- 除非各範圍都需要本地版本，否則不在多份文件重複同一規則。
- 刪掉過期內容，不要解釋歷史。
- 刪掉理所當然的敘述、重複的規則、放錯地方的細節，以及已不存在的風險警告。

### 收尾

1. 依 DOX 鏈重新檢查改過的路徑。
2. 更新最近的負責文件，以及受影響的父層或子文件。
3. 更新所有受影響的子文件索引。
4. 刪除過期或矛盾的文字。
5. 相關時執行現有的驗證。
6. 回報刻意沒有更新的文件與原因。

## 使用者偏好

- 一律用**繁體中文**與使用者溝通，包括回覆、提問（AskUserQuestion 的問題與選項）、進度說明與摘要。程式碼識別字與指令維持原文。
- 三份 README 內容要保持一致；改其中一份時三份一起改。

## 全專案規則

### 發佈更新（重要）

使用者是從 GitHub marketplace（`kzger/claudechan-chibi`，本機名稱 `chibi-local`）安裝的。`claude plugin update` **只看版本號**判斷要不要更新。

**每次修改 `plugin/` 並 push 時，Claude 要主動完成以下步驟（不用等使用者要求）：**

1. 把 `plugin/.claude-plugin/plugin.json` 的 `version` 往上升（例如 `0.3.0` → `0.3.1`）。版本沒變，更新指令會回報「already at the latest version」，快取仍是舊程式碼。
   同時更新三份 README 開頭的版本行：`README.md` 的「**Current version: x.y.z** (日期)」、`README.zh-TW.md` 的「**目前版本：x.y.z**（日期）」、`README.ja.md` 的「**現在のバージョン：x.y.z**（日期）」，版本號與 `plugin.json` 一致，日期填發佈當天。
2. 執行 `claude plugin validate plugin` 與 `claude plugin test plugin`，**確認測試全數通過才 commit**：不要把測試和 commit／push 串在同一行指令裡，失敗時才不會照樣提交。
3. push 後在本機更新：
   ```bash
   claude plugin marketplace update chibi-local
   claude plugin update claudechan-chibi@chibi-local
   ```
   確認 `~/.claude/plugins/cache/chibi-local/claudechan-chibi/<新版本>/` 存在且是新程式碼。這台機器連 GitHub 慢，marketplace 更新可能超過預設 120 秒，必要時加 `CLAUDE_CODE_PLUGIN_GIT_TIMEOUT_MS=600000`。
4. **提醒使用者在 Claude Code 裡執行 `/reload-plugins`**（slash command，Claude 無法代為執行）。

注意：`/exit` 後重開 `claude` **不會**載入新版。這台機器的 Claude Code 以背景 daemon 執行，重開只是 `claude attach` 回到同一個程序（可用 `ps -axo pid,lstart,command | grep claude` 看程序啟動時間是否早於更新時間）。一定要 `/reload-plugins`。

只改文件（含 `plugin/CLAUDE.md`）、沒動到 `plugin/` 的程式或素材時，不用升版、不用更新。

### git

- marketplace 每次更新都會下載 repo 最新版，repo 要保持精簡：製作素材（`image26-v1/`、`tools/assets/plugin-assets-corrected-v1/`、`tools/assets/crosspet/`、`docs/plugin-assets-audit-2026-11-06/`）只留在本機，列在 `.gitignore`，不要加回 git。
- 用 `claude --plugin-dir plugin` 測試時，Claude Code 會自動產生 `plugin/tsconfig.json` 與 `plugin/.claude-plugin/types/`，這些是本機產物，不要加進 git（已列在 `.gitignore`）。
- commit 時明確列出路徑，不用 `git add -A`。

## 子文件索引

| 路徑 | 負責 |
|---|---|
| [plugin/CLAUDE.md](plugin/CLAUDE.md) | mod 本體：事件與狀態機、繪製、動畫資料、素材、測試 |
| [tools/CLAUDE.md](tools/CLAUDE.md) | 建置與產生腳本：安裝素材、重建字元資料、README 示意圖 |
| [docs/CLAUDE.md](docs/CLAUDE.md) | 長期文件與 README 示意圖 |

根目錄其他檔案由本文件負責：

- `README.md`、`README.zh-TW.md`、`README.ja.md`：使用說明，三語同步。
- `ATTRIBUTION.txt`：素材來源與授權；`plugin/ATTRIBUTION.txt` 是隨插件發佈的版本，素材來源改變時兩份都要更新。
- `install.sh`、`install.ps1`：本機安裝；複製 `.claude-plugin/`、`plugin/`、三份 README 與 ATTRIBUTION。
- `.claude-plugin/marketplace.json`：marketplace `chibi-local` 的定義。
