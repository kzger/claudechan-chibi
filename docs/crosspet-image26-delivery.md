# CrossPet Claude GIF 交付

2026-11-05（Asia/Taipei）。60/60 原圖已分別生成對應動畫。

## 產物

- 主要目錄：`tools/assets/crosspet/claude/image26-v1/`。
- 60 支 `<動作>.gif`：186×184 px。
- 60 支 `<動作>-bust.gif`：130×125 px。
- 354 張全身 RGBA PNG + 354 張 Bust RGBA PNG，共 708 張影格。
- 每個動作資料夾有 `timing.json`、`contact.png` 和 `gif-contact.png`。
- 姿勢表與提示詞保存在 `sheets/`；`generation.json` 對每個動作記錄實際提示詞檔、來源姿勢表、時序、縮放、CV 參數與 GIF SHA-256。
- 兩張 portrait 各自去背生成；avatar 保留頭像構圖。探頭保留原始截邊。

[全部動作預覽](crosspet-image26-preview.html) · [修正前後對照](crosspet-image26-stabilization-review.html)

## 工具及模型

使用內建 imagegen 逐張生成透明連續姿勢表，再以 Python/Pillow 分割、縮圖、產生 Bust、編碼 GIF，並以 OpenCV 對齊站姿。使用者已接受內建工具不提供可驗證模型版本的限制；本批不宣稱已確認 image2.6，也未使用 CLI/API fallback。每支的最終提示詞路徑見 generation.json 的 prompt_file；delegating 另有 repair_prompt_file，running 與 idle 系列保留 final-prompt.txt。

## 驗證

- 60 個來源一對一覆蓋；全身與 Bust 幀數依待處理文件逐支核對。
- 全部 120 GIF 的尺寸、實際解碼幀數、時長、透明索引與無限循環通過檢查。
- 全部 708 PNG 為 RGBA、尺寸正確、非空；每支影格內容不同。
- GIF 解碼後的透明遮罩，逐幀等於對應 PNG 的二值透明遮罩，沒有殘幀或透明色造成的額外缺口。
- 全身實心輪廓不碰畫布四邊；原本設計為截邊的 edge 動作除外。
- PNG 與 GIF 全身影格在淺／深底逐幀檢視；Bust 裁切亦逐幀檢視。
- Chromium 原生解碼成功：120 GIF + 708 PNG；60 個動作原速與半速播放，240 個全身／Bust 淺深底畫面皆載入。
- 檔案驗證：`validation.json`；瀏覽器驗證：`browser-validation.json`；視覺及修正紀錄：`review-notes.json`；對齊量測：`stationary-registration.json`。

來源 WebP 與 plugin/assets/smooth 未覆寫。修正前版本保留在 revisions/，不屬於主要交付的 120 支 GIF 與 708 張 PNG 影格。
