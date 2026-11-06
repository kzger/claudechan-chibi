# docs/：長期文件與 README 示意圖

## 目的

保存仍有效的參考文件：素材來源紀錄、可重用的製作流程，以及 README 用的示意圖。

## 負責範圍

| 檔案 | 內容 |
|---|---|
| `art-provenance.md` | 插件目前的素材從哪裡來、怎麼做、製作檔案放在哪；`ATTRIBUTION.txt` 與 README 會連到這裡 |
| `crosspet-gif-production-guide.md` | 為其他角色（例如 deepseek）製作動畫的可重用流程 |
| `images/band.gif`、`pane.gif`、`states.gif` | README 的示意圖，**由 `tools/make_readme_images.py` 產生** |

## 本地契約

- 只放反映現況的文件；交接單、待辦清單、一次性的過程紀錄在工作完成後刪除，需要保留的事實併入 `art-provenance.md`。
- `images/` 不要手改；動畫或版面改變後重新產生。
- 不連結到不在 git 裡的製作素材（`image26-v1/`、`tools/assets/plugin-assets-corrected-v1/` 等），只用文字寫出它們在製作端的路徑。

## 工作準則

- 文件用繁體中文。

## 驗證

無。

## 子文件索引

無。
