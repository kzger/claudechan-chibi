# 美術素材來源與製作紀錄

插件目前使用的圖（`plugin/assets/`、`plugin/hooks/frames-*.ts`）從哪裡來、怎麼做的。授權與署名以 [ATTRIBUTION.txt](../ATTRIBUTION.txt) 為準。

## 目前的素材

| 組 | 內容 | 來源 |
|---|---|---|
| `smooth`、`classic` | 各 10 個狀態：`idle`、`waving`、`jumping`、`running`、`running-left/right`、`waiting`、`review`、`failed`、`angry` | Codex 寵物精靈圖；`failed` 為補繪的抱書反應，`angry` 由叉腰姿勢圖加 Twemoji 💢 做成 |
| `extra`（兩組共用） | 32 個動作，例如 `idle-1`、`thinking`、`searching`、`writing`、`proud`、`redhot`（另有不再播放的 `stretch`） | image26 批次：以 CrossPet Claude 原圖為起始姿勢補繪 |

三組都經過「修正版 v1」統一，是 `tools/build_corrected.py` 安裝進插件的版本（0.5.2 起）：

- 全身 186×184、上半身（Bust）130×125；Bust 是全身固定裁切 x=28…157、y=0…124，不逐幀追臉。
- 一般站姿的身體中心 x=91、腳底 y=178；走路、跳躍、左右忙碌、抱書走路與坐姿保留各自的位移。
- 髮色以 smooth `idle` 為參考，只調整髮區；`angry` 的兩組各自參照同組髮色。
- `sorry`、`stretch`、`clawd`、`delegating`、`compact` 重新生成六格姿勢，改善頭身與道具比例；`listening`、`idle-2`、`proud` 共同縮放並校準站位。

## 製作方式與限制

- 姿勢表用內建 imagegen 生成，工具不提供模型版本，**一律記為「模型版本未知」**，不宣稱是特定模型。
- 拆幀、縮放、對齊用 Python／Pillow／OpenCV；對齊只做整數像素平移，不逐幀縮放或旋轉。
- 已知視覺差異：`sorry` 的鞠躬姿勢比 `idle` 略小、頭較低。

## 製作檔案在哪裡

製作素材**不在 git 裡**，只保存在製作端（見 `.gitignore`），repo 只收插件的成品：

| 路徑（製作端） | 內容 |
|---|---|
| `image26-v1/` | image26 批次的 60 個動作：PNG 影格、GIF、`timing.json`、`generation.json`（提示詞、時序、CV 參數）與驗證紀錄 |
| `tools/assets/plugin-assets-corrected-v1/` | 修正版 v1：`classic/`、`smooth/`、`extra/` 的 PNG，以及 `corrections.json`、`validation.json`、`review/`、`work/`（姿勢表與提示詞） |
| `tools/assets/crosspet/<角色>/webp/` | CrossPet 原圖（含尚未製作的 deepseek 等角色） |
| `docs/plugin-assets-audit-2026-11-06/` | 修正前的色差與比例審查圖 |

要換掉某個動作的圖，見根目錄 README 的「自訂」；製作新角色的動畫，見 [crosspet-gif-production-guide.md](crosspet-gif-production-guide.md)。
