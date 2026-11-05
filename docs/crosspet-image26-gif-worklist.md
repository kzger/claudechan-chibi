# CrossPet Claude — image2.6 GIF 待處理文件

日期：2026-11-05（Asia/Taipei）

本文件保留 Claude 本批的實際規格與交付紀錄。後續製作 deepseek 等其他角色，請先使用 [共用製作流程](crosspet-gif-production-guide.md) 建立新的角色工作單；不得直接沿用本表的外觀、60 項數量、裙身 ROI 或腳本輸出路徑。

## 狀態與模型前置條件

- 全批 60/60 動作完成，交付 60 支全身 GIF、60 支 Bust GIF、708 張 PNG 影格；格式、透明、原速／半速播放及逐幀檢視已完成。
- 使用者已接受以現有內建 imagegen 執行。工具未暴露 model 參數或模型版本查詢，無法確認為 image2.6；所有產物均如實標記模型版本未知。
- imagegen 技能的 CLI 說明標示 gpt-image-2，不能據此稱作 image2.6，也不自行切換 CLI。
- 工具提供靜態圖像生成介面，沒有直接動畫或 GIF 輸出控制。規劃為生成連續姿勢表，再分割影格與編碼 GIF；不以單張原圖平移或縮放充當動作。

## 來源與輸出

- 原圖：`tools/assets/crosspet/claude/webp/`，共 60 張，實測全部單幀。idle 各圖是不同姿勢參考，並非已內嵌動畫的 WebP。
- 58 張有透明區域；portrait.webp（512×768）及 portrait-card.webp（256×384）完全不透明。
- 本批規劃另存 `tools/assets/crosspet/claude/image26-v1/`，不覆寫現有原圖、GIF、frames、smooth 或先前試樣。若該目錄已有產物，另起版本。
- 每張來源對應一支同名 `<stem>.gif`；另附 `<stem>-bust.gif` 與 `<stem>/0.png … N-1.png`、`0-bust.png … N-1-bust.png`。附 timing.json、實際提示詞和可取得的模型資訊。
- 全身 PNG/GIF：186×184 px；Bust PNG/GIF：130×125 px。PNG 保留 RGBA；GIF 使用透明索引色。
- avatar 原圖僅頭像，保留其裁切構圖並置入標準畫布，不虛構未提供的身體。邊緣動作保留原圖截邊，不強行補全。
- 兩張 portrait 分別製作，不合併或略過；去背移除場景，保留人物、衣飾、配色。

## smooth 實測規格

smooth 沒有 GIF；它是逐幀 PNG。下表的幀數同時適用全身與 Bust。

| 動作 | 全身幀數 | Bust 幀數 |
| --- | ---: | ---: |
| angry | 8 | 8 |
| failed | 6 | 6 |
| idle | 6 | 6 |
| jumping | 5 | 5 |
| review | 6 | 6 |
| running | 6 | 6 |
| running-left | 8 | 8 |
| running-right | 8 | 8 |
| waiting | 6 | 6 |
| waving | 4 | 4 |

沒有同名 smooth 動作時，採下方明列的參考動作幀數。Bust 從同一組姿勢以固定裁切窗口衍生，兩版本時序一致，避免每幀獨立自動裁切造成抖動。smooth PNG 未提供播放時間；本批暫定一般動作每幀 120 ms，跑步 80 ms，睡眠及 portrait 180 ms，GIF 無限循環。這些是製作提案，並非 smooth 實測時序。

## 每張圖片的待處理清單

60/60 均已生成並驗證；實際完成與驗證狀態見 `tools/assets/crosspet/claude/image26-v1/generation.json`、`validation.json` 及 `review-notes.json`。檔名保留原始大小寫及連字號／底線。逐張放大檢視時，優先保留原圖的實際道具；雙手已持物的問候姿勢以抬物、點頭致意，避免為揮手而增加手臂。

| 原圖 → GIF | 原始尺寸 | smooth 參考 | 每版本幀數 | 動作與處理 |
| --- | --- | --- | ---: | --- |
| annoyed.webp → annoyed.gif | 560×640 | angry | 8 | 不耐煩皺眉，手臂收緊後放鬆，髮尾輕擺 |
| asking.webp → asking.gif | 492×640 | waiting | 6 | 歪頭詢問，掌心微抬，眨眼後回正 |
| avatar.webp → avatar.gif | 192×192 | idle | 6 | 保留頭像構圖，眨眼與輕微歪頭；全身規格畫布不憑空補腿 |
| busy_left.webp → busy_left.gif | 639×640 | running-left | 8 | 維持朝左忙碌方向，交替翻書與抬手，動作後回位 |
| busy_right.webp → busy_right.gif | 603×640 | running-right | 8 | 維持朝右忙碌方向，交替翻書與抬手，動作後回位 |
| bye.webp → bye.gif | 560×640 | waving | 4 | 揮手告別，手掌往返擺動後回到起始姿勢 |
| clawd.webp → clawd.gif | 521×640 | idle | 6 | 輕抱原圖橘色玩偶，低頭輕蹭再回正，保留地上書本 |
| coaxed.webp → coaxed.gif | 561×640 | idle | 6 | 從靦腆到放鬆微笑，雙手微收，頭部小幅擺動 |
| compact.webp → compact.gif | 559×640 | review | 6 | 保留坐在行李箱上的姿勢，壓整書本與行李，裙襬輕動 |
| delegating.webp → delegating.gif | 707×640 | review | 6 | 左右示意分工，保留原圖小夥伴，回到中央 |
| dizzy.webp → dizzy.gif | 637×640 | failed | 6 | 暈眩左右晃頭，視線失焦後回位 |
| edge_left.webp → edge_left.gif | 317×640 | idle | 6 | 保留原圖截邊方向，沿既有邊界小幅探出再收回 |
| edge_left_peek.webp → edge_left_peek.gif | 448×640 | idle | 6 | 保留原圖探頭方向，稍探出、眨眼、縮回 |
| edge_right.webp → edge_right.gif | 307×640 | idle | 6 | 保留原圖截邊方向，沿既有邊界小幅探出再收回 |
| edge_right_peek.webp → edge_right_peek.gif | 394×640 | idle | 6 | 保留原圖探頭方向，稍探出、眨眼、縮回 |
| fest_christmas.webp → fest_christmas.gif | 534×640 | waving | 4 | 保留聖誕帽，輕揮手與點頭，帽尖隨動 |
| fest_dragonboat.webp → fest_dragonboat.gif | 568×640 | idle | 6 | 保留端午道具，低頭看道具後抬頭微笑 |
| fest_halloween.webp → fest_halloween.gif | 525×640 | idle | 6 | 保留巫師帽及南瓜，輕抬道具並眨眼 |
| fest_lantern.webp → fest_lantern.gif | 569×640 | idle | 6 | 保留燈籠與兔子道具，輕提燈籠再放回 |
| fest_midautumn.webp → fest_midautumn.gif | 568×640 | idle | 6 | 保留月餅與兔子道具，展示後微笑回位 |
| fest_national.webp → fest_national.gif | 554×640 | waving | 4 | 保留原圖帽飾與道具，輕揮手致意 |
| fest_newyear.webp → fest_newyear.gif | 548×640 | waving | 4 | 保留派對帽，開心揮手並輕點頭 |
| fest_spring.webp → fest_spring.gif | 570×640 | idle | 6 | 保留新春燈籠，輕晃燈籠並微笑 |
| forgiven.webp → forgiven.gif | 570×640 | idle | 6 | 表情放鬆微笑，雙手輕收、點頭原諒 |
| greet_afternoon.webp → greet_afternoon.gif | 570×640 | waving | 4 | 保留午後笑容，輕揮手與眨眼 |
| greet_dawn.webp → greet_dawn.gif | 543×640 | waving | 4 | 帶睡意地抬頭問候，輕揮手，保留原圖裝飾 |
| greet_evening.webp → greet_evening.gif | 571×640 | waving | 4 | 傍晚溫和點頭，輕揮手問候 |
| greet_morning.webp → greet_morning.gif | 572×640 | waving | 4 | 精神地抬手早安，眨眼與點頭 |
| greet_night.webp → greet_night.gif | 566×640 | waving | 4 | 睡意眨眼並小幅揮手道晚安 |
| greet_noon.webp → greet_noon.gif | 570×640 | waving | 4 | 開朗點頭並揮手午安 |
| happy-2.webp → happy-2.gif | 573×640 | idle | 6 | 保留閉眼笑容，肩膀與雙手開心輕動 |
| hum.webp → hum.gif | 572×640 | idle | 6 | 閉眼哼歌，頭部左右小幅律動 |
| idle-2.webp → idle-2.gif | 572×640 | idle | 6 | 以此姿勢為主，參考其他 idle 圖補呼吸與眨眼 |
| idle-3.webp → idle-3.gif | 570×640 | idle | 6 | 以此姿勢為主，參考其他 idle 圖補呼吸與眨眼 |
| idle-blink.webp → idle-blink.gif | 570×640 | idle | 6 | 以閉眼姿勢為主，補睜眼、閉眼、睜眼的完整循環 |
| idle.webp → idle.gif | 570×640 | idle | 6 | 參考 idle-2、idle-3、idle-blink，呼吸及自然眨眼 |
| listening.webp → listening.gif | 591×640 | waiting | 6 | 側耳聆聽，輕點頭後回正，保留原圖手勢 |
| oops.webp → oops.gif | 567×640 | failed | 6 | 驚覺失誤，雙手微抬、短暫縮肩後回位 |
| pat-2.webp → pat-2.gif | 571×640 | idle | 6 | 保留原圖舉書姿勢，輕縮頭再放鬆；不新增畫外手 |
| portrait-card.webp → portrait-card.gif | 256×384 | idle | 6 | 去除書房背景，保留人物與暖色畫風，呼吸和眨眼 |
| portrait.webp → portrait.gif | 512×768 | idle | 6 | 去除書房背景，保留人物與暖色畫風，呼吸和眨眼 |
| proud.webp → proud.gif | 534×640 | idle | 6 | 保留得意閉眼笑，輕抬下巴與胸前雙手後回位 |
| puffed.webp → puffed.gif | 573×640 | angry | 8 | 鼓腮生悶氣，肩膀輕起伏、短暫轉頭後回位 |
| reading-2.webp → reading-2.gif | 570×640 | review | 6 | 低頭閱讀，視線沿頁面移動，書頁輕翻再回位 |
| redhot.webp → redhot.gif | 591×640 | angry | 8 | 保留紅臉與高舉書本姿勢，羞惱顫動後回位 |
| running.webp → running.gif | 572×640 | running | 6 | 真正交替擺臂與跨步，含支撐與離地姿勢，原地循環 |
| searching.webp → searching.gif | 576×640 | review | 6 | 保留放大鏡，左右移動觀察，抬眼回位 |
| sleeping-2.webp → sleeping-2.gif | 571×640 | idle | 6 | 閉眼睡眠，緩慢呼吸與頭部微沉後回位 |
| sorry.webp → sorry.gif | 519×640 | failed | 6 | 低頭道歉，雙手收攏，微鞠躬後回位 |
| stretch.webp → stretch.gif | 551×640 | idle | 6 | 保留原圖頭上書本，伸展抬手再放鬆 |
| sulk.webp → sulk.gif | 522×640 | failed | 6 | 低頭鬧彆扭，微轉頭與收手後回位 |
| surprised.webp → surprised.gif | 573×640 | failed | 6 | 睜大眼、肩膀上提與雙手微動，再回到起始表情 |
| swamped_left.webp → swamped_left.gif | 558×640 | running-left | 8 | 保留朝左及書堆，負重交替小步，書堆小幅跟隨 |
| swamped_right.webp → swamped_right.gif | 541×640 | running-right | 8 | 保留朝右及書堆，負重交替小步，書堆小幅跟隨 |
| thinking-2.webp → thinking-2.gif | 573×640 | review | 6 | 保留手持書本姿勢，低頭思索、輕歪頭再回位 |
| thinking.webp → thinking.gif | 571×640 | review | 6 | 保留托腮思考姿勢，視線上移、歪頭再回位 |
| tired.webp → tired.gif | 553×640 | failed | 6 | 半閉眼疲倦，肩膀下沉、緩慢眨眼再回位 |
| update.webp → update.gif | 499×640 | review | 6 | 保留原圖手中物件，輕抬展示與點頭回位 |
| writing.webp → writing.gif | 551×640 | review | 6 | 低頭書寫，手腕連續短筆畫，短暫抬眼再回位 |
| yawn.webp → yawn.gif | 581×640 | idle | 6 | 保留掩嘴姿勢，張嘴打呵欠、閉嘴、放鬆後回位 |

已交付：60 支全身規格 GIF + 60 支 Bust GIF；354 張全身 PNG + 354 張 Bust PNG（合計 708 張 PNG）。姿勢表、提示詞與時序另存。

## 生成與後製方式

1. 模型條件解決後，逐張載入原圖檢視。原圖為人物身份、畫風、服裝、道具與主姿勢參考；idle 系列可加為連續姿勢參考。
2. 每個來源分別呼叫內建 imagegen，要求精確 N 格的透明姿勢表，閱讀順序排列、等尺寸格、固定鏡頭、固定角色比例與基準線。透明輸出使用 transparent_background=true。
3. 生成原生的新姿勢，保持髮飾、臉型、服裝細節與道具一致。必要時單項修正並重驗；不以整圖位移、縮放或任意變形代替繪製。
4. 依規整網格拆分姿勢表，所有影格共用縮放與定位規則，產出標準尺寸全身與 Bust；不得逐幀獨立 fit。
   - 依使用者後續修正：站姿影格以固定裙身區域估算 CV 平移，取整數像素對齊以保持清晰度；所有影格仍共用同一縮放比例，不逐幀縮放或旋轉。手、頭、道具保留實際生成的動作。用 fest_spring 的位移幅度作參考，並檢查腳底與畫布裁切。Bust 從對齊後的全身影格使用固定窗口裁切。
   - 跑步／負重行走不套站姿鎖定；檢查左右交替步態。edge 的牆體／截邊獨立固定。手與書破圖採局部生成修補，CV 不能修復人體或道具結構。細節見 [共用流程](crosspet-gif-production-guide.md)。
5. 從 RGBA 影格編碼 GIF，使用共用調色盤、透明索引、合適 disposal 與 loop=0，保留 PNG 的半透明邊緣作為高品質來源。
6. 記錄實際生成提示詞、可驗證的模型資訊、版本、採用影格順序、duration 與處理結果。

## 共用提示詞模板

```text
Use case: identity-preserve
Asset type: transparent sequential animation pose sheet for a desktop chibi companion
Primary request: Create exactly {N} genuinely distinct sequential poses for {source_stem}: {motion}.
Input images: source WebP is the identity/style/primary pose reference; any idle images are supporting pose references only.
Scene/backdrop: genuine transparent background.
Composition/framing: uniform grid in reading order, equal cell size, fixed camera, same character scale and registration; no clipping except intentional source edge crops.
Constraints: preserve orange hair, face, flower hair ornament, costume, palette, props and source orientation; keep lighting and line weight consistent across frames; smooth last-to-first loop; natural limb articulation.
Avoid: labels, text, borders, extra characters or props, duplicate static poses, global image wobble, stretching, ghost limbs, background scenery.
```

portrait 的主提示詞另加去除書房背景；avatar 明訂保留頭像構圖；delegating 保留原圖既有小夥伴，不套用排除既有角色的限制。

## 驗收清單

- [x] 使用者接受內建 imagegen；模型版本無法驗證，未宣稱已確認 image2.6。
- [x] 60 個來源逐一覆蓋，同名 GIF 各一支，另有 Bust GIF 及完整 PNG。
- [x] 每個動作全身與 Bust 幀數均符合上表，檔名連續，尺寸正確。
- [x] 每幀有有效人物內容，動作具有新姿勢，沒有多肢、破圖、道具跳位、比例或亮度跳動。
- [x] 固定位置原速與半速播放，檢查尾首銜接、腳底與頭部基準、Bust 裁切。
- [x] 淺色與深色背景檢查髮絲、裙邊、透明空隙、GIF 殘影和色帶。
- [x] 解碼 GIF 驗證實際幀數、總時間、透明設定及無限循環，避免編碼器合併重複幀。
- [x] 新產物保存在 workspace，既有素材未覆寫。

盤點依據：[機器可讀清單](crosspet-image26-inspection/inventory.json)、[原圖縮圖總覽](crosspet-image26-inspection/sources-contact-sheet.jpg)。

## 最終交付紀錄

- [全部動作預覽](crosspet-image26-preview.html)
- [穩定修正前後對照](crosspet-image26-stabilization-review.html)
- [交付說明與驗證](crosspet-image26-delivery.md)
