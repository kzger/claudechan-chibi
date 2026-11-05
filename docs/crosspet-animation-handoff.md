# CrossPet 動畫素材交接

## 後續生成流程（2026-11-05 更新）

新增／重製角色動畫（例如 deepseek）請使用 [共用製作流程](crosspet-gif-production-guide.md)，先建立該角色工作單。Claude 新批的 [工作單](crosspet-image26-gif-worklist.md) 與 [交付紀錄](crosspet-image26-delivery.md) 另存於 image26-v1；下方 GIF／frames 數量屬既有素材整理批次，不含這批新產物。現有 image26 腳本仍含 Claude 路徑及特例，轉用前依共用流程調整。

## 既有素材交接

這次已完成素材整理與 GIF 拆幀。下一步是在 macOS 上確認哪些動畫要接入 Claude Code 插件，再決定各動畫的觸發條件與顯示方式。

## 素材位置

從 Repo 根目錄開啟 [補幀表單](crosspet-animation-queue.md)，可依角色、原始 WebP 名稱、編號與補幀安排找到對應 GIF。所有素材位於 [tools/assets/crosspet](../tools/assets/crosspet/)。

| 角色目錄 | GIF 數 | PNG 影格數 |
|---|---:|---:|
| [claude](../tools/assets/crosspet/claude/) | 58 | 275 |
| [deepseek](../tools/assets/crosspet/deepseek/) | 63 | 277 |
| [deepseek-hoodie](../tools/assets/crosspet/deepseek-hoodie/) | 48 | 212 |
| [egg-claude](../tools/assets/crosspet/egg-claude/) | 2 | 12 |
| [egg-claude-hoodie](../tools/assets/crosspet/egg-claude-hoodie/) | 2 | 12 |
| 合計 | 173 | 788 |

- 原始姿勢在各角色的 `webp/`（若有）。動畫預覽在 `gif/<動畫名>.gif`。
- 拆幀位於 `frames/<動畫名>/000.png`、`001.png` 等，依序排列，保留 GIF 原畫布尺寸、透明度和完整合成後的影格。
- 每個動畫目錄的 `timing.json` 記錄 GIF 路徑、畫布尺寸、循環設定及各幀的 `duration_ms`。GIF 的 `loop: 0` 表示無限循環，`null` 表示來源沒有循環欄位。
- 173 個 GIF 中有 151 個列在補幀表單，另有 22 個同目錄素材可供比對。用 `listed_in_queue` 區分。表單有數個 WebP 共用同一支 GIF 的情況。
- 素材來源與授權見 [ATTRIBUTION.txt](../ATTRIBUTION.txt)。

## Egg Claude 的 preview 與 reveal

兩套 Egg Claude 的 `preview.gif` 都是 240 × 240、4 幀、2.25 秒的關鍵姿勢速覽。`reveal.gif` 是 320 × 320、8 幀、2.40 秒的補幀版本，將 `pretend`、`caught`、`pop`、`bye` 串成一支動畫。實作連續演出時以 `reveal` 為素材。

| 造型 | 關鍵姿勢 | 補幀動畫 |
|---|---|---|
| Egg Claude | [preview.gif](../tools/assets/crosspet/egg-claude/gif/preview.gif) | [reveal.gif](../tools/assets/crosspet/egg-claude/gif/reveal.gif) |
| Egg Claude Hoodie | [preview.gif](../tools/assets/crosspet/egg-claude-hoodie/gif/preview.gif) | [reveal.gif](../tools/assets/crosspet/egg-claude-hoodie/gif/reveal.gif) |

## 插件接入待討論

先與使用者確認要新增或替換的動作、適用的角色造型和觸發事件。接入時檢查全身、半身及字元顯示各自的素材需求，對齊角色的可見比例、腳底和裁切位置，並依 `timing.json` 決定播放節奏。

本次交接未調整插件的播放邏輯、事件映射或版號。
