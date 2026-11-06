# CrossPet Claude GIF 交付

2026-11-05（Asia/Taipei）。60/60 原圖已分別生成對應動畫。

## 產物

- 主要目錄：Repo 根目錄的 [`image26-v1/`](../image26-v1/)。製作時位於 `tools/assets/crosspet/claude/image26-v1/`，之後移到根目錄。`generation.json` 與各 `timing.json` 裡的 `source`、`prompt_file` 仍記錄製作時的 Windows 路徑，例如 `tools\assets\crosspet\claude\image26-v1\sheets\idle.png`。查檔時把前段換成 `image26-v1/`，反斜線換成 `/`。
- 60 支 `<動作>.gif`：186×184 px，與插件 `plugin/assets/<圖庫>/<狀態>/<n>.png` 尺寸相同。
- 60 支 `<動作>-bust.gif`：130×125 px，與插件 `<n>-bust.png` 尺寸相同。
- 354 張全身 RGBA PNG + 354 張 Bust RGBA PNG，共 708 張影格，位於 `image26-v1/<動作>/<n>.png` 與 `<n>-bust.png`。
- 每個動作資料夾有 `timing.json`、`contact.png`（PNG 影格總覽）和 `gif-contact.png`（GIF 解碼後的影格總覽）。總覽圖只留在製作端，沒有進 git（見下方「容量」）。
- 姿勢表與提示詞保存在 `image26-v1/sheets/`；`generation.json` 對每個動作記錄實際提示詞檔、來源姿勢表、時序、縮放、CV 參數與 GIF SHA-256。
- 兩張 portrait 各自去背生成；avatar 保留頭像構圖。探頭保留原始截邊。
- 來源 WebP 在 [`tools/assets/crosspet/claude/webp/`](../tools/assets/crosspet/claude/webp/)，共 60 張。

全部動作預覽與修正前後對照的 HTML（`crosspet-image26-preview.html`、`crosspet-image26-stabilization-review.html`）及截圖目錄 `docs/crosspet-image26-inspection/` 沒有隨素材交付，Repo 內找不到。要看單一動作，請直接開 `image26-v1/<動作>.gif`。

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
- 檔案驗證：`image26-v1/validation.json`；瀏覽器驗證：`image26-v1/browser-validation.json`；視覺及修正紀錄：`image26-v1/review-notes.json`；對齊量測：`image26-v1/stationary-registration.json`。

來源 WebP 與 `plugin/assets/smooth` 未覆寫。修正前版本保留在 `image26-v1/revisions/`，不屬於主要交付的 120 支 GIF 與 708 張 PNG 影格：

| 目錄 | 內容 |
|---|---|
| `before-stabilization/` | 使用者回報修正前的版本 |
| `pre-integer-registration/` | 改用整數像素平移前的次像素對齊版本 |
| `stabilized-v2/` | 次像素修正版，含 delegating 局部重繪的過程檔 |
| `gait-before/`、`gait-v2/` | running 步態重做前的版本與提示詞 |

## 容量

`image26-v1/` 共約 424 MB，其中 `revisions/` 約 167 MB、`sheets/` 約 129 MB。各動作資料夾的 708 張 PNG 合計約 30 MB，接入插件只需要這部分。

進 git 的只有：708 張影格、120 支 GIF（約 11 MB）、各動作的 `timing.json` 與根目錄的紀錄 JSON，合計約 41 MB。`revisions/`、`sheets/` 與各資料夾的 `contact.png`、`gif-contact.png`、`contact-review.png`、`comparison.png`（約 72 MB）列在 `.gitignore`，只保存在製作端；`generation.json` 指向這些檔案的路徑在 Repo 內找不到。
