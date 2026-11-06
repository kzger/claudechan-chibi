# Plugin 素材色差與人物比例待修正清單

檢查日期：2026-11-06（Asia/Taipei）。本文件記錄目前工作區 `plugin/assets/` 的問題與切換檢查；後續候選修正版已另存，**原始 plugin 圖片未修改**。

後續修正狀態：已依本清單另存 [修正版 v1 與驗證紀錄](plugin-assets-corrections-v1-delivery.md)，位置為 `tools/assets/plugin-assets-corrected-v1/`。下表保留原始問題與接入驗收項，原 `plugin/assets` 仍未替換。

## 確認結果

1. `classic/angry`、`smooth/angry` 確實比同組其他動作偏紅、偏深，兩組都要處理，全身與 Bust 都受影響。
2. `extra/sorry`、`extra/stretch` 的人物比例確實與基本動作不同。sorry 較窄、頭身關係較修長；stretch 因頭頂書本佔用空間，人物本體明顯較小。兩者都不能只靠把整張外框高度拉成一致解決。
3. 另外確認 `extra/clawd`、`extra/delegating`、`extra/listening` 的主要人物偏小；`extra/compact` 的頭部及人物與道具比例也需校準，須保留坐姿。
4. `extra` 整批髮色相較 smooth 的基本動作更柔和、偏棕，飽和度較低。這是跨組風格差，應在修 angry 時一起建立共用髮色參考，避免只修 angry 後，extra 切換仍有色差。
5. 經第二輪實際 PNG 切換播放，`extra/idle-2` 已由觀察項升級為 P1：人物偏小且偏右；`listening` 亦確認偏小、偏右，並非僅單張姿勢不同。`proud` 仍保留為第二優先比較項。
6. 已建立瀏覽器切換檢查頁，針對 classic／smooth 各自的 42 個動作，掃描所有不同動作的有向配對（共 3,444 組）；新增 writing、tired、yawn、surprised、pat-2 的橫向偏移項。檢查的是 PNG 固定顯示框播放，並未在插件宿主內執行 image／cells，詳見下方第二輪紀錄。

## 檢查範圍與證據

| 目錄 | 動作數 | 全身影格 | Bust 影格 | 全身尺寸 | Bust 尺寸 |
| --- | ---: | ---: | ---: | --- | --- |
| classic | 10 | 63 | 63 | 186×180 | 130×122 |
| smooth | 10 | 63 | 63 | 186×184 | 130×125 |
| extra | 32 | 204 | 204 | 186×184 | 130×125 |
| 合計 | 52 | 330 | 330 | 依各組 | 依各組 |

已解碼全部 660 張 PNG，並逐張檢視原像素尺寸的全身／Bust contact sheet。這是素材檔案檢查，尚未在實際插件內操作狀態切換；classic 與 smooth 畫布不同，日後也要以相同顯示倍率確認，不能將畫布尺寸差直接算成人物比例錯誤。

- [重點並排比較](plugin-assets-audit-2026-11-06/priority-comparison.png)：全身與 Bust，同一張圖內保持原像素尺寸。
- 全目錄首幀總覽：[smooth](plugin-assets-audit-2026-11-06/smooth-overview.png)、[extra](plugin-assets-audit-2026-11-06/extra-overview.png)、[classic](plugin-assets-audit-2026-11-06/classic-overview.png)。
- [逐幀尺寸與篩選量測](plugin-assets-audit-2026-11-06/inventory.json)、[各組尺寸統計](plugin-assets-audit-2026-11-06/summary.json)、[檢查時來源 SHA-256](plugin-assets-audit-2026-11-06/source-sha256.json)。來源更新後須重新檢查。

尺寸以 alpha≥128 的實心輪廓外框量測。髮色篩選使用 OpenCV HSV 橘色遮罩（H=4～24、S≥110、V≥75、alpha≥128），取最大連通區上方 55 px 的 RGB／Lab 中位數；這是輔助篩選，不是精確頭髮分割。`stretch` 的書本會混入同色連通區，已標記其髮色／頭寬數據不可採用。色差判定以實際圖面比較為主，不把此統計當成標準 ΔE。

## 優先待修項目

以下為原始待修問題；各項候選素材的完成狀態見 [交付對照表](plugin-assets-corrections-v1-delivery.md)。表內幀號適用同名 `N.png` 與 `N-bust.png`，不是只修第一張。

| ID | 優先 | 動作／影格 | 問題與確認依據 | 建議修正方式 |
| --- | --- | --- | --- | --- |
| C01 | P1 | `classic/angry`、`smooth/angry`，各 0～7 | 全組髮色偏紅、偏深。橘色區 Lab 篩選中位數兩組皆約 `[152,176,177]`（OpenCV 8-bit）；smooth idle 約 `[156,171,176]`，classic idle 約 `[162,167,174]`。與視覺偏紅結果相符 | 用各組 idle／waiting／review 的髮色建立參考；只校正頭髮，保留紅色怒氣符號、膚色、服裝及陰影層次。全序列採一致色彩映射 |
| C02 | P2 | `extra` 全部 32 動作，全身／Bust | 相較 smooth，多數 extra 髮色偏棕、彩度較低；coaxed、dizzy、writing 等尤其容易看出柔和色調。非單一壞幀 | 先選跨組共同髮色色票，試做一項並排比較，再決定各動作的調整量；不能整批套全圖 histogram matching。stretch 另做人工髮區遮罩 |
| S01 | P1 | `extra/sorry`，0～5 | 人物較窄、頭部偏小且身形較修長；在起始與回位幀亦可見，並非全由鞠躬造成。首幀實心外框寬 132 px，smooth idle 為 167 px；外框只作線索，不能將 167/132 當成縮放倍率 | 分別校準頭部、肩寬與裙身關係；先評估共同等比縮放能否改善，若頭身比仍不同，需重繪／局部調整。保留鞠躬與腳底位置 |
| S02 | P1 | `extra/stretch`，0～5 | 書本與舉手佔據上方空間，人物本體縮小；Bust 的臉也明顯較小。首幀含書本外框高 161 px，不能當作人物身高 | 以頭部與軀幹尺寸匹配參考，重新配置人物、手臂與書本；留足頭頂空間。若固定畫布容不下，調整動作幅度或重繪，不裁掉書本／手掌 |
| S03 | P1 | `extra/clawd`，0～5 | 主要人物頭部與身體偏細小，道具與地上書本影響整體配置；Bust 同樣呈現小臉 | 以主要人物的頭／肩作錨點，保留玩偶、地上書本及接觸關係；若放大會裁切，重排道具位置而非重新縮小人物 |
| S04 | P1 | `extra/delegating`，0～5 | 主角明顯偏小，外框左右被地面小夥伴拉寬；全序列實心外框高度中位數 161 px，但寬度不能代表主角尺度 | 將主角與同伴分開評估，主角先匹配標準尺度，再重新安排同伴；保留同伴數量、書本與手勢。放大前檢查畫布容納情況 |
| S05 | P1 | `extra/listening`，0～5 | 頭、軀幹及裙身整體較小，頂部空白較大；外框高度中位數 158 px，相較 smooth idle 174 px 低約 9%。第二輪確認相對 idle-1 下緣中心右移約 14.5 px，臉也向右；Bust 同樣偏小、偏右 | 同時修尺度及橫向定位，不能只放大。優先試整組共同等比放大、重新定位腳底，再檢查頭部尺度與傾頭動作。9% 是外框差，不直接作放大倍率 |
| S06 | P2 | `extra/compact`，0～5 | 頭／人物本體偏小，行李箱與坐姿佔比高；不能把坐姿總高度直接拉到站姿高度 | 以臉／頭部而非「人物＋行李箱」外框校準；保留坐姿、腿部及行李箱接觸。需要時重新分配箱體位置或重繪 |
| S07 | P1 | `extra/idle-2`，0～5 | 由 R01 升級。idle-1↔idle-2 時人物縮小並偏右；下緣中心中位數 x=99.25，idle-1 為 89，差約 +10.25 px。頭部、身體與 Bust 同方向改變，不能用低頭姿勢解釋全部偏移 | 重新校準整組尺寸與 x 定位，驗證 idle-1↔idle-2、idle↔idle-2、idle-2↔idle-3 的雙向切換 |
| S08 | P1 | `extra/writing`，0～5 | running／idle-1 切入時，人物整體向右；下緣中心中位數 x=103，相對 idle-1 約 +14 px，相對 smooth running 約 +12.5 px；臉部也向右，不只是書本外框不對稱 | 整組人物定位向共同錨點校準，保留低頭及寫字手勢；全身與 Bust 同步。納入 T03 優先修正 |
| S09 | P1 | `extra/tired`，0～5 | 相對 idle-1 下緣中心約 +13.5 px；全身與 Bust 皆有橫向跳位。疲倦低頭可以保留，但身體站位也改變 | 分離表情／低頭變化與整體 x 位移；修身體站位，檢查 working 動作↔tired |
| S10 | P1 | `extra/yawn`，0～5 | 相對 idle-1 下緣中心約 +10.75 px；打呵欠時整個人向右，切回 sleeping-2 又回左，兩次跳位在 Bust 亦可見 | 同時校準 idle-1↔yawn、yawn↔sleeping-2 的位置，保留掩嘴／呼吸動作 |
| S11 | P2 | `extra/surprised`，0～5 | 相對 idle-1 下緣中心約 +8.5 px；臉部及軀幹同向右移，切換時有位置跳變 | 修整組站位，保留睜眼、抬肩的動作，不把表情變化當成縮放需求 |
| S12 | P2 | `extra/pat-2`，0～5 | 相對 idle-1 下緣中心約 +7 px；舉書遮臉之餘，身體／臉亦偏右，切回待機可見偏移 | 校準人物站位，保留舉書與縮頭；驗證 pat-2↔idle-1／idle 雙向切換 |

P1 為使用者指出或跨動作切換時明顯的差異；P2 為接續校準。C02 與 S01～S06 可能重疊，同一動作完成比例修正後仍需重驗髮色。

## 第二優先比較項（尚未判定必須重製）

| ID | 動作 | 目前觀察 | 下一步 |
| --- | --- | --- | --- |
| R01 | `extra/idle-2`，0～5 | 第二輪已確認切換偏差 | 已升級為 S07／P1，不再列作尚待確認 |
| R02 | `extra/proud`，0～5 | 頭頂頭飾計入高度，人物本體略小；目前總高度中位數 172 px 無法代表身體尺度 | 排除頭飾比較頭寬、肩寬及裙身；保留鞋底留白，不直接增高整張圖 |
| R03 | 其他 extra 正面站姿 | pat-2、surprised、tired、writing、yawn 已升級為 S08～S12。annoyed、happy-2、hum、oops、thinking 等相較 smooth 的輕微頭部輪廓差仍保留比較 | 其餘列為校準回歸範圍；不逐項預判需重新生成 |

## 全動作檢查覆蓋

「未見明顯新增問題」指本輪色差／比例檢視，並非完整動作品質認證。

| 目錄 | 動作 | 本輪結果 |
| --- | --- | --- |
| classic | angry | C01 |
| classic | failed、idle、jumping、review、running、running-left、running-right、waiting、waving | 未見與 angry 同程度的獨立髮色色偏；動作／朝向造成的輪廓變化保留 |
| smooth | angry | C01 |
| smooth | failed、idle、jumping、review、running、running-left、running-right、waiting、waving | 未見需立即另開項目的色差／比例問題；基本站姿作校準參考 |
| extra | clawd、compact、delegating、listening、sorry、stretch | S01～S06；髮色同屬 C02 比較範圍 |
| extra | idle-2、writing、tired、yawn、surprised、pat-2 | S07～S12；髮色 C02 |
| extra | proud | R02；髮色 C02 |
| extra | annoyed、busy_left、busy_right、coaxed、dizzy、forgiven、happy-2、hum、idle-1、idle-3、idle-blink、oops、redhot、searching、sleeping-2、sulk、swamped_left、swamped_right、thinking | 髮色 C02；其餘依 R03 或動作特性回歸比較，未列為立即重製 |

跑步側視、鞠躬、坐姿、伸展、蓬鬆髮尾、頭飾與道具會改變外框。人物比例應看「相近朝向的頭部尺度＋肩部／軀幹尺度＋腳底定位」，不能只比較總寬／總高，也不能要求每幀外框完全相同。

## 補充：跨動作切換檢查

已參考使用者轉述的意見，對照全部相關影格及 [載入／顯示邏輯](../plugin/hooks/register.tsx)。`loadPng` 會依動作的 `dir` 讀取 extra 或所選圖庫；`imageBox` 以 activeSet 的 imageSizes 計算顯示框，並未在此處逐動作補齊 PNG 的尺寸差。原版 idle 確實位於 idle-1 的輪播候選中；searching／writing 分別由搜尋與寫入類工具映射，兩者與 running 都屬工作動畫。因此這些是需要驗收的真實切換路徑。

[切換比較圖](plugin-assets-audit-2026-11-06/transition-comparison.png) 上排將來源畫布頂部對齊，下排底部對齊；包含全身與 Bust，用來分辨原圖尺寸與內容位置。此圖沒有放大／縮小人物，也不模擬終端機最終縮放。

| ID | 優先 | 切換 | 已確認事實／風險 | 待修正與驗收 |
| --- | --- | --- | --- | --- |
| T01 | P1 | classic 原動作↔extra 新動作 | classic 全身 186×180、Bust 130×122；extra 為 186×184、130×125。高度差確實存在；相同顯示框下可能改變縮放／對齊，但不能只憑差 4 px 宣稱必定跳 4 px | 決定共用舞台與固定腳底／Bust 頭部錨點；優先評估透明留白補齊或載入時定位，避免直接把 180 拉伸成 184。實際測 classic 的原動作↔extra，並分開驗證 image／cells、全身／Bust |
| T02 | P1 | classic idle↔idle-1；smooth idle↔idle-1 | classic idle 實心輪廓底部 y=174～178；extra idle-1 為 y=178～179。smooth idle 則固定 y=182，比 idle-1 低約 3～4 px；smooth 同樣有內容基準差，並非只發生在 classic | 先統一落地參考，再保留原本 idle 呼吸的合理位移；對比頭部大小與髮色 C02。檢查兩個方向，且包含不同退出幀，不只比各自第 0 幀 |
| T03 | P1 | classic／smooth running↔extra searching／writing | classic running 底部 y=174～178，smooth running 固定 y=182；searching／writing 均固定 y=178。smooth running 外框水平中心約 x=95～97，searching 約 x=92～93，writing 約 x=106；後者另有橫向位置差線索，需用身體錨點確認，不能按不對稱書本外框直接平移 | 先對頭部／軀幹與腳底，再處理角色比例及 C02 髮色。保留低頭書寫、放大鏡與讀書的姿勢差，不要求姿勢相同。逐項測 running↔searching、running↔writing 的雙向轉換、不同切入幀及 Bust |

上表 y／x 為原圖像素座標，外框取 alpha≥128，底部為最後一個實心像素；classic 與 extra 的座標原點可比，但畫布高度及最終顯示縮放不同，數字不是螢幕上必然位移量。對稱身體錨點與實際播放仍需後續確認。

後續修正應同時處理三件事：舞台尺寸、人物本體尺度、身體／腳底錨點。只補四列透明像素，或只調動畫 duration，無法一次消除所有色差與比例跳變。終端機 cells 使用離線生成資料，素材修改後須重建相應資料再驗收，不能以 PNG 通過就視為 cells 已修正。

## 建議修正順序與驗收

### 第二輪切換播放紀錄（2026-11-06）

新增 [可重播的切換檢查頁](plugin-assets-audit-2026-11-06/transition-playback.html)。每套圖庫包含 10 個原動作＋32 個共用 extra，共 42 動作。頁面以 84 個全身／Bust 卡片，依序將每一個來源與其餘 41 個目標交替播放；兩套合計 `42×41×2=3,444` 個有向配對。每側播放 2.4 秒，影格每 240 ms 前進，目標從第 0 幀開始；各序列的全部影格皆可播到。播放無淡入淡出或自動重定位，以便暴露原始偏差。

另對全部來源退出幀→目標第 0 幀計算下緣定位差，共 21,894 個影格邊界。瀏覽器批次播放覆蓋全部配對，重點視覺核對 idle-2／listening 及新增偏移項的切入／切回畫面；**這不代表已在插件宿主逐一操作全部事件**。檢查頁刻意使用均速以比較幾何，未重現插件 idle 的長短停留、實際終端機縮放、字元渲染或走動 offset。

證據：

- [新增問題的切換前後影格](plugin-assets-audit-2026-11-06/confirmed-transition-boundaries.png)：idle-1 最後一幀→各問題動作第 0 幀，以及 smooth running→writing；同時呈現全身與 Bust。
- [所有配對量測](plugin-assets-audit-2026-11-06/transition-pair-metrics.json)、[逐動作下緣定位](plugin-assets-audit-2026-11-06/foot-anchors.json)、[重點結果](plugin-assets-audit-2026-11-06/transition-findings.json)、[播放範圍與方法](plugin-assets-audit-2026-11-06/transition-scope.json)。
- [瀏覽器播放結果](plugin-assets-audit-2026-11-06/playback-browser-results.json)：660／660 張 PNG 載入，錯誤 0；3,444／3,444 個有向配對均有實際繪製紀錄。[來源畫面](plugin-assets-audit-2026-11-06/playback-source-idle1.png)／[目標切入畫面](plugin-assets-audit-2026-11-06/playback-target-boundaries.png)。

下緣定位為 alpha≥128 的最低六列輪廓左右端點中心，表內比較使用全序列中位數。它不是人體關節偵測；clawd 的地上書本、compact 的箱子、delegating 的同伴及跑動腳步不能以此數字直接修正。S07～S12 均再以人物及 Bust 圖面核對。數字用來定位待修動作，不是可直接套用的平移參數。

本輪歸納的問題群：

- **偏小且偏位**：listening、idle-2，以及原列 sorry／stretch 等比例項。listening、idle-2 已提升為優先修正。
- **主要為水平站位偏移**：writing、tired、yawn、surprised、pat-2。應優先改人物錨點，不能全部用縮放修正。
- **共用基準差**：smooth 基本動作多落在 y=182，extra 多為 y=178；classic 另有畫布高度差及原動畫上下動，仍依 T01～T03 處理。
- **特殊姿勢／方向變化**：busy_left↔busy_right 下緣中心差約 17 px；swamped_left↔swamped_right 約 18.5 px，running-left／right 差更大。這些同時有朝向、跨步或舞台移動語意，不列作可直接消除的錯位；驗收時須結合走動 offset，不能強制把所有腳步中心鎖成相同座標。

### 待執行修正

- [ ] 建立參考：以 smooth idle／waiting／review 的正面頭部、髮色與肩部尺度為主要比較組；classic 在自身畫布內對照 idle／waiting。保存參考影格與髮區遮罩。
- [ ] 優先處理 C01、S01、S02、S05、S07，再處理 S03～S04、S08～S12；所有修改另存候選版本，不直接覆蓋 plugin。
- [ ] 用 S06、R02 決定坐姿／頭飾等特例的尺度，不套全動作單一外框倍率；R01 已升級為 S07。
- [ ] 完成 C02 跨組髮色統一的候選比較；僅處理頭髮，維持高光、陰影、線稿、膚色及道具。
- [ ] 同一動作全序列共用縮放與定位規則；若重繪改變身體位置，再做 CV 平移穩定。CV 對齊不能修頭身比或髮色色偏。
- [ ] 全身修正後重建對應 Bust，保留各組原尺寸及固定裁切規則；不可只修全身而讓 Bust 留舊版。
- [ ] 逐幀及狀態切換比較 idle↔angry、idle↔sorry、idle↔stretch、idle↔clawd／delegating／listening／compact，確認人物沒有突然縮小或換髮色。
- [ ] 完成 T01～T03：兩套圖庫的原版 idle↔idle-1，以及 running↔searching、running↔writing，檢查雙向轉換、不同退出／切入幀、全身／Bust、image／cells。
- [ ] 回歸 S05、S07～S12：idle-1↔listening／idle-2／writing／tired／yawn／surprised／pat-2，另測 idle-2↔idle-3、yawn↔sleeping-2。
- [ ] 淺／深底檢查透明邊緣、腳底、書本／手掌與同伴無裁切；原速／半速檢查比例與顏色不逐幀跳變。
- [ ] 通過素材檢查後，再驗證插件實際顯示、資產打包及生成資料是否需要同步更新；本輪完成 PNG 瀏覽器播放與相關程式閱讀，未修改程式／圖片，亦未執行插件宿主內的 image／cells 驗證。

逐幀證據位於同名 audit 目錄的 `classic-frames-1…3.png`、`smooth-frames-1…3.png`、`extra-frames-1…8.png`，每個動作上排為全身、下排為 Bust。後續生成／修補方式可參照 [共用製作流程](crosspet-gif-production-guide.md)。
