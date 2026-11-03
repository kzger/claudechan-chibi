# chibi-companion

Claude Code 的 mod（function hooks plugin）：Q 版 Claude ちゃん動畫陪伴。mod 本體在 `plugin/`，使用說明見 `README.md`。

## 修改後的檢查

```bash
claude plugin validate plugin   # 檢查 manifest 與 hooks
claude plugin test plugin       # 執行 plugin/tests 的繪製測試
```

## 發佈更新（重要）

使用者是從 GitHub marketplace（`kzger/chibi-companion`，本機名稱 `chibi-local`）安裝的。`claude plugin update` **只看版本號**判斷要不要更新。

**每次修改 `plugin/` 並 push 時，Claude 要主動完成以下步驟（不用等使用者要求）：**

1. 把 `plugin/.claude-plugin/plugin.json` 的 `version` 往上升（例如 `0.3.0` → `0.3.1`）。版本沒變，更新指令會回報「already at the latest version」，快取仍是舊程式碼。
   同時更新 `README.md` 開頭的「**目前版本：x.y.z**（日期）」，版本號與 `plugin.json` 一致，日期填發佈當天。
2. 執行 `claude plugin validate plugin` 與 `claude plugin test plugin`，都通過才 commit、push。
3. push 後在本機更新：
   ```bash
   claude plugin marketplace update chibi-local
   claude plugin update chibi-companion@chibi-local
   ```
   確認 `~/.claude/plugins/cache/chibi-local/chibi-companion/<新版本>/` 存在且是新程式碼。
4. **提醒使用者在 Claude Code 裡執行 `/reload-plugins`**（slash command，Claude 無法代為執行）。

注意：`/exit` 後重開 `claude` **不會**載入新版。這台機器的 Claude Code 以背景 daemon 執行，重開只是 `claude attach` 回到同一個程序（可用 `ps -axo pid,lstart,command | grep claude` 看程序啟動時間是否早於更新時間）。一定要 `/reload-plugins`。

只改文件、沒動到 `plugin/` 時不用升版、不用更新。

## 不要 commit 的檔案

用 `claude --plugin-dir plugin` 測試時，Claude Code 會自動產生 `plugin/tsconfig.json` 與 `plugin/.claude-plugin/types/`，這些是本機產物，不要加進 git（已列在 `.gitignore`）。
