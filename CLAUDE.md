# chibi-companion

Claude Code 的 mod（function hooks plugin）：Q 版 Claude 娘動畫陪伴。mod 本體在 `plugin/`，使用說明見 `README.md`。

## 修改後的檢查

```bash
claude plugin validate plugin   # 檢查 manifest 與 hooks
claude plugin test plugin       # 執行 plugin/tests 的繪製測試
```

## 發佈更新（重要）

使用者是從 GitHub marketplace（`kzger/chibi-companion`）安裝的，`claude plugin update` **只看版本號**判斷要不要更新：

- 每次 push 會改到 `plugin/` 的修改時，**一定要把 `plugin/.claude-plugin/plugin.json` 的 `version` 往上升**（例如 `0.2.0` → `0.2.1`）。版本沒變，更新指令會回報「already at the latest version」，快取（`~/.claude/plugins/cache/chibi-local/chibi-companion/<version>/`）仍是舊程式碼。
- 推上去之後，本機更新：
  ```bash
  claude plugin marketplace update chibi-local
  claude plugin update chibi-companion@chibi-local
  ```
  再重開 `claude`（或 `/reload-plugins`）。

## 不要 commit 的檔案

用 `claude --plugin-dir plugin` 測試時，Claude Code 會自動產生 `plugin/tsconfig.json` 與 `plugin/.claude-plugin/types/`，這些是本機產物，不要加進 git（已列在 `.gitignore`）。
