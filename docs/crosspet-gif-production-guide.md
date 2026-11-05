# CrossPet 圖片轉動畫製作流程

更新：2026-11-05（Asia/Taipei）。供 Claude、deepseek、deepseek-hoodie 等角色後續製作使用；整理自 [Claude 本批工作單](crosspet-image26-gif-worklist.md) 與 [修正紀錄](crosspet-image26-corrections.md)。本文件是可重用流程，不代表其他角色已完成生成。

## 開始前先建立該角色工作單

先盤點、寫文件，再生成。每一批建立 `docs/crosspet-<角色>-gif-worklist.md`，來源預設 `tools/assets/crosspet/<角色>/webp/`，輸出另建版本目錄（例如 `generated-v1/`）。實際路徑以該批工作單為準；不得把 Claude 的輸出路徑直接用在其他角色。

工作單至少包含：

- 來源檔清單、尺寸、實際解碼幀數、透明度、有無背景；不能因為檔名為 idle 就假設是動畫。
- 每張圖的可見姿勢、道具、同伴、朝向、裁切，以及身份／服裝／配色特徵。檔名只作動作線索，與圖面矛盾時以圖面為準。
- 每個來源獨立對應的全身 GIF、Bust GIF、PNG 影格路徑；若要求每圖一支，就不能合併 idle、edge 或 portrait。
- 目標尺寸、參考幀數、每幀時間、網格列欄、循環方式、Bust 固定裁切窗口。
- 動作分類、固定錨點或區域、允許移動的部位、需保留的留白與截邊。
- 使用工具、可驗證模型版本；若工具不暴露版本，寫「未知」，不能從技能名稱或資料夾名稱推定。使用者明訂版本時，先釐清工具是否能滿足，不擅自改用 API／CLI。

| 來源 | 輸出名稱 | 類型 | 動作／逐幀階段 | 固定區域 | 允許移動 | 幀數／ms | 背景與裁切 | 狀態 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `<stem>.webp` | `<stem>.gif`、`<stem>-bust.gif` | 待判定 | 起勢→動作→回位 | 依圖選取 | 頭／手／道具等 | 依規格填寫 | 依圖填寫 | 待生成 |

原始 WebP、既有 GIF、smooth 與其他批次不覆寫。批內修正先備份舊版，驗證後才替換本批主要產物。

## 格式與時序

目前沿用的 smooth 規格為全身 **186×184**、Bust **130×125**；開始新批次仍應核對實際參考素材。smooth 是逐幀 PNG，不能把自行選定的播放速度稱為來源實測速度。

| smooth 動作 | 幀數 |
| --- | ---: |
| angry | 8 |
| failed | 6 |
| idle | 6 |
| jumping | 5 |
| review | 6 |
| running | 6 |
| running-left／running-right | 各 8 |
| waiting | 6 |
| waving | 4 |

無同名動作時逐項寫明採用哪個參考，不直接複製 Claude 的 60 項清單。一般 120 ms／幀、跑步 80 ms／幀、睡眠及 portrait 180 ms／幀可作初始提案，再看實際動作調整。GIF 無限循環（loop=0）；全身與 Bust 幀數、順序與時序一致。

## 先按動作決定固定方式

| 類型 | 必須維持 | 動畫與後製方式 |
| --- | --- | --- |
| 站姿問候、節慶、詢問 | 身體中心、角色比例及腳底基準 | 手、表情、頭、道具局部動；有整體漂移時用固定身體 ROI 做平移對齊 |
| 跑步、跳躍、負重走動 | 鏡頭、比例、舞台位置規則 | 保留支撐、離地、上下起伏與左右交替；不能套站姿下半身鎖定 |
| edge／peek | 牆、遮擋層、截邊位置 | 人物相對遮擋物探出／縮回；牆體單獨固定，不能靠整圖平移同時修兩者 |
| 閱讀、書寫、多人／多道具 | 身體及不參與動作的物件 | 檢查手與物件接觸、遮擋和同伴身份；破圖用局部修補 |
| avatar／portrait | 原始頭像或立繪構圖 | 不憑空補腿；背景是否移除逐圖決定並記錄，不能略過來源 |

先試做少量有代表性的動作，例如站姿持物、揮手、跑步、探頭及有背景圖，確認角色一致性、CV 區域與 Bust 裁切後再完成其餘項目。這是批內品質檢查，不另增加使用者核准步驟。

## 生成姿勢表

逐張查看來源，明確標記身份參考、動作參考及待編輯影格。使用內建 imagegen 時，每個動作各自生成真正的新姿勢；工具輸出姿勢表，後續才拆分與編碼 GIF。不能把靜態原圖左右平移當成動作。

以下模板要以該角色的實際外觀填寫，不能沿用 Claude 的橘髮、花飾、裙裝或書本道具：

```text
Asset type: transparent sequential animation pose sheet for a desktop companion.
Primary request: Exactly {N} distinct sequential poses for {stem}: {motion}.
Input roles: {identity/style reference}; {optional motion reference}.
Identity invariants: {visible character features, clothing, palette, props, companions}.
Layout: exactly {columns} columns × {rows} rows, equal cells, reading order;
fixed camera, character scale, lighting and line weight; no labels or cell borders.
Motion plan: {frame-by-frame phases, including the last-to-first transition}.
Fixed anchors: {body/feet OR wall/occlusion boundary, according to motion class}.
Allowed motion: {specific head/limbs/props or locomotion phases}.
Background: genuine transparency; {intentional edge crop or background removal}.
Avoid: global body drift for stationary actions, scale changes, duplicate poses,
extra limbs/props/characters, broken hand-object contact, moving static scenery.
Preserve all existing companions and props identified above.
```

- 站姿：明訂軀幹與腳底位置固定，揮手不是整個人左右擺。
- 跑步：逐幀指定左右支撐與離地；第二排不能只是重複第一排。輪廓不同不代表步態正確，必須查看落腳方向。
- 探頭：明訂牆與遮擋邊界不動；必要時人物與靜態遮擋層分開處理。
- 雙手持物：優先採抬物、點頭等可行動作，避免為了揮手增加第三隻手。
- 要求透明時設定工具的透明背景選項；以實際 alpha 與淺／深底合成檢查，不能只依工具預覽背景判定去背是否成功。

## 拆幀、CV 與局部修補

1. 檢查網格和格數，再按固定邊界拆分。每個動作所有影格共用聯集裁切、縮放與初始定位，不逐幀獨立 fit。預留對齊位移和動作所需空間。
2. 站姿若仍漂移，在不參與主要動作、具穩定紋理的身體區域估算 ECC translation。排除手、擺動道具、髮尾、同伴與牆體。新角色重新選 ROI，不直接沿用 Claude 的裙身座標。
3. 將估算位移取整數像素，以透明畫布貼回；不反覆做次像素插值、逐幀縮放或旋轉，避免小圖線條模糊。保留原始姿勢動作。
4. 同時檢查 x／y 位移、相關性、腳底與輪廓。ECC 失敗、低相關、異常大位移或形變時停下檢查該項，不把平移當成人體修復工具。Claude 腳本的相關性門檻 0.8 只是本批檢查值，不是跨角色品質保證。
5. 對齊後若鞋底或髮飾碰邊，整組共同縮小／改基準線再重做；不能只移動或縮小單幀。Claude proud 即採共同縮放及較高基準線修正。
6. 牆體／遮擋物以固定座標、遮罩或靜態層處理，再檢查人物是否仍有探頭動作。單純鎖外緣只在該圖適用時使用，不代表牆內部已固定。
7. 手、書或道具破圖：只針對問題影格和區域請 imagegen 修補，再用遮罩合成。比對修補範圍之外與其他影格是否保持不變；保存修補提示詞、遮罩／範圍與前後版本。姿勢／比例整體錯誤才重新生成該動作。
8. 從修正後全身產生固定窗口的 Bust。每個動作可選不同窗口，但同一動作不得逐幀追臉裁切；avatar 可有獨立但固定的構圖規則。

**CV 能修的是整體平移，不能補回錯誤的手指、書頁、透視、比例或遺失內容。** 原始圖像無法提供穩定配準區域時，改錨點／遮罩或重新生成，避免勉強對齊。

Claude 的量測例：fest_spring 原始身體水平範圍約 2.095 px；使用者指出的 13 項原本約 5.5～16.53 px，修正後約 0.42～0.95 px。此數值是 186×184 畫布的案例，不能直接當其他尺寸或跑步動作的門檻。新批選一支可接受的站姿參考，用相同 ROI／量測方法比較，再以播放觀感確認；腳底與垂直跳動也要另查。

## 編碼與驗收

PNG 保留 RGBA 作高品質來源。GIF 用共用調色盤、專用透明索引和適當 disposal；本批實作使用透明索引 255、alpha<128 透明、disposal=2、loop=0。GIF 不支援 PNG 的半透明，必須另看髮絲和輪廓的實際顯示，數值正確不保證沒有白邊或色帶。

- [ ] 來源逐一覆蓋；全身／Bust／PNG 數量、名稱、幀序、尺寸、時長符合本批工作單。
- [ ] 每幀非空且有預期的姿勢變化；雜訊造成位元不同不能當作動作完成。是否容許刻意停格要在工作單明列。
- [ ] 真正解碼 GIF 後核對幀數與各幀時間，避免編碼器合併影格；確認透明遮罩、無殘幀、無限循環。
- [ ] PNG 與解碼 GIF 分別在淺／深底逐幀查看全身和 Bust，檢查手／道具／同伴、腳底、邊界、去背、色帶。
- [ ] 原速、半速、逐幀查看，包含最後一幀接第一幀；站姿看身體漂移，跑步看左右步態，探頭看靜態牆體。
- [ ] CV 前後同方法量測與並排比較；變清楚且不裁切，才採用修正版。
- [ ] 用瀏覽器實際解碼 PNG／GIF、檢查載入錯誤及播放。若大量載入有單檔失敗，單獨重試並記錄，不直接判定圖壞。
- [ ] 檔案檢查與視覺檢查分別記錄；任何 pending 項目尚未完成，不提前標記全部交付。

每個動作記錄來源、原始姿勢表、最終提示詞、網格、共用裁切與縮放、CV ROI／位移、Bust 窗口、時序、模型可驗證資訊與最終檔案雜湊。另存整批覆蓋／驗證結果、淺深底 contact sheet、播放預覽、修正前後對照與備份。

## 現有腳本的重用限制

現有 `tools/*image26*.py` 是 Claude 本批工具，**尚未支援直接指定任意角色**。本次只更新文件，未改寫腳本，也未開始 deepseek 生成。轉用前至少檢查：

| 工具 | 必須調整／檢查 |
| --- | --- |
| `build_image26_gifs.py` | OUT 路徑、動作分類、proud／avatar／edge 特例、尺寸、留白、Bust 窗口；目前 CLI 只有名稱、columns、frames、duration，沒有角色參數 |
| `stabilize_image26.py`、`measure_image26_registration.py` | BASE／DEST、動作名單、參考動作、ROI、位移門檻；裙身 ROI `(30,110,156,180)` 不是通用值 |
| `repair_image26_special.py` | Claude delegating／edge 專用來源與遮罩，不能直接套其他角色 |
| `verify_image26_assets.py` | 來源／輸出／工作單路徑、表格解析、尺寸、時長與截邊例外 |
| 預覽、對照及 contact 產生工具 | 角色路徑、動作數、修正名單與標題；完成數應由實際清單計算 |

需要實作重用時，將本批來源／輸出、動作分類、尺寸、ROI、Bust、時序等集中為該批設定，再讓製作與驗證讀取一致規格；先用代表項驗證再跑整批。不要以全檔取代 `claude` 字串當作完成轉用。

## 下一批可直接使用的任務描述

> 請依 `docs/crosspet-gif-production-guide.md` 處理 `<角色>` 的原圖。先盤點並建立該角色工作單，再依每圖一支動畫的要求製作全身 GIF、Bust GIF 與 PNG 影格。重新判定動作分類、身份特徵、CV 固定區域和背景處理，不沿用 Claude 的外觀或特例。輸出另存版本目錄；模型版本照工具實際資訊記錄。先檢查代表項再完成整批，逐項保存提示詞、修正與驗證紀錄。
