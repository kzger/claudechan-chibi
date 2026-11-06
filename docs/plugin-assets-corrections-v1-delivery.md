# Plugin 色差／比例修正版交付

2026-11-06（Asia/Taipei）。已另存修正版，原 `plugin/assets` 未覆寫。

位置：`tools/assets/plugin-assets-corrected-v1/`。含 `classic/`、`smooth/`、`extra/` 共 52 組動作、660 張 PNG（330 全身、330 Bust）；所有候選全身為 186×184、Bust 為 130×125，保留原影格名稱及數量。

[前後切換比較](../tools/assets/plugin-assets-corrected-v1/review/index.html) · [重點修正圖](../tools/assets/plugin-assets-corrected-v1/review/key-fixes.png) · [全配對播放](../tools/assets/plugin-assets-corrected-v1/review/transition-playback.html) · [產物說明](../tools/assets/plugin-assets-corrected-v1/README.md)

## 對應待修清單

| 原項目 | 本批修正 |
| --- | --- |
| C01 angry | classic／smooth 各自參照同組髮色，固定映射校正髮區 |
| C02 extra 色調 | 32 個動作的髮區校準至 smooth idle 參考；保留明暗，不做全圖調色 |
| S01～S04、S06 | sorry、stretch、clawd、delegating、compact 由 imagegen 局部重製連續姿勢表，重新配置頭身與道具；所有道具／同伴保留 |
| S05 listening、S07 idle-2 | 共同等比放大並校準站位；同時重建 Bust |
| S08～S12 | writing、tired、yawn、surprised、pat-2 整組定位修正 |
| R02 proud | 小幅共同縮放並定位，保留頭飾與鞋底留白 |
| T01 畫布差 | 候選 classic 補齊透明畫布到共同尺寸；未將原圖直接拉伸 |
| T02／T03 切換基準 | 一般站姿腳底統一 y=178，身體定位 x=91；idle／running 與 extra 使用同一舞台。保留走動／跳躍／坐姿特例 |

## 橫向定位結果

下表為全序列「下方六列實心輪廓中心」中位數相對 idle-1 的差值，單位 px；作為站姿比較代理值，並經圖面檢視，不代表人體關節座標。

| 動作 | 原版差值 | 修正版差值 |
| --- | ---: | ---: |
| idle-2 | +10.25 | +0.50 |
| listening | +14.50 | +0.25 |
| writing | +14.00 | 0.00 |
| tired | +13.50 | −0.50 |
| yawn | +10.75 | +0.25 |
| surprised | +8.50 | +0.25 |
| pat-2 | +7.00 | 0.00 |

髮色以相同髮區篩選方法量測，smooth angry 的 OpenCV 8-bit Lab 中位數由約 `[151,176,176]` 調整為 `[157,171,176]`；extra listening 由 `[162,166,170]` 調整為 `[157,171,176]`。此為輔助統計，並非精確人體／髮區分割或標準 ΔE。

## 驗證及範圍

- 52 組、660 PNG 的尺寸、RGBA、非空、檔名／幀數及固定 Bust 裁切一致性通過檢查。
- 所有候選全身實心輪廓皆保有畫布留白；一般站姿的下緣定位誤差不超過 1 px。
- 已檢視全部全身與 Bust 影格，生成及縮放重點項另在深底逐幀檢查。
- 原版 angry／jumping 既有的迴圈重複影格保留，沒有新增重複幀。
- 660 張原始 PNG SHA-256 均與處理前一致。數值、來源與候選雜湊見產物的 `validation.json`。
- 瀏覽器全配對播放結果另存 `review/browser-validation.json`；以 240ms 均速檢查幾何與顏色，不等同正式事件播放時序。

本批完成的是獨立 PNG 素材修正版，尚未替換插件素材、重建 `frames-*.ts` 字元資料或測試插件宿主。工具為內建 imagegen，模型版本未知；實際提示詞、原姿勢表及生成輸出皆保存在 work。
