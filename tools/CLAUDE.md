# tools/：建置與產生腳本

## 目的

產生插件的素材與字元資料，以及 README 的示意圖。只在製作端執行；使用者安裝插件不需要這些腳本。

## 負責範圍

| 腳本 | 用途 | 狀態 |
|---|---|---|
| `build_corrected.py` | 把修正版 PNG（預設 `tools/assets/plugin-assets-corrected-v1/`）安裝進 `plugin/assets/`，並重建 `plugin/hooks/frames-*.ts`、色盤與 `imageSizes` | **現行流程** |
| `build_frames.py` | 字元畫的共用函式（`best_cells`、`quad_pixels`、`SIZES`、`IMAGE_ROWS`…）與 `refuse_unless_forced()`；`main()` 是舊的精靈圖流程 | 函式現行，`main()` 舊流程 |
| `build_extra.py`、`build_angry.py` | 從 `image26-v1/`、叉腰姿勢圖產生素材 | 舊流程，有防呆 |
| `build_failed.py` | 改寫 `failed` 的原圖與字元幀 | 舊流程，**不要在修正版上執行**（沒有防呆） |
| `correct_plugin_asset_candidates.py`、`verify_plugin_asset_candidates.py` | 產生與驗證修正版 v1 的一次性腳本（讀 `plugin/assets`、寫修正版目錄） | 已完成，有防呆 |
| `make_readme_images.py` | 從 `plugin/assets` 畫 `docs/images/` 的三張 GIF | 現行 |
| `mutator-test.sh` | 給 `mutator --test-command` 用的插件測試：把捷徑換成真檔案再跑 `claude plugin test` | 現行（用法見 `plugin/CLAUDE.md`） |

製作素材（`tools/assets/plugin-assets-corrected-v1/`、`tools/assets/crosspet/`、根目錄 `image26-v1/`）只在製作端，不在 git 裡；位置與內容見 `docs/art-provenance.md`。

## 本地契約

- 舊流程會從舊來源重建並覆蓋修正版，所以 `build_frames.py`（`main`）、`build_extra.py`、`build_angry.py`、`correct_plugin_asset_candidates.py` 沒加 `--overwrite-corrected` 就拒絕執行。不要移除這個防呆。
- `build_corrected.py`：
  - 來源結構與插件相同：`<組>/<動作>/<n>.png`（186×184）與 `<n>-bust.png`（130×125）；只複製這兩種檔案，原樣複製並核對雜湊。
  - 各組的狀態集合與幀數必須和現有 `frames-*.ts` 一致；各狀態的節奏沿用現有檔案。
  - 字元畫：大尺寸用整張全身，小尺寸用整張 Bust，不另外裁切。
- `make_readme_images.py` 的節奏從 `plugin/hooks/frames-*.ts` 讀取；共用動作的節奏（`EXTRA_TIMING`）是 `register.tsx` 的副本，改其中一邊要同步。
- `__pycache__/` 不進 git。

## 工作準則

執行時用 uv 帶入相依套件，在 `tools/` 內或以完整路徑執行：

```bash
uv run --with pillow --with numpy python tools/build_corrected.py
uv run --with pillow python tools/make_readme_images.py
```

## 驗證

- `build_corrected.py` 內建檢查：尺寸、RGBA、幀號連續、Bust 存在、幀數等於節奏數、複製後雜湊一致。
- 重建字元資料後，執行插件的驗證（見 `plugin/CLAUDE.md`）。

## 子文件索引

無。
