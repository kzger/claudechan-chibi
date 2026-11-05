# 動畫穩定修正

2026-11-05。修正已同步至 image26-v1 主要產物；修正前保留於 revisions/before-stabilization。初版次像素修正亦保留作歷史版本；最終交付採整數像素平移，保留小圖線條清晰度。

[修正前／後／fest_spring 對照](crosspet-image26-stabilization-review.html)。可切換 20 個修正動作、原速／半速、逐幀、全身與 Bust。

## 位置修正

CV ECC 在固定裙身區域估算平移，最後取整數像素，不逐幀縮放或旋轉。保留手、頭與道具的實際動作。參考 fest_spring 裙身水平位移範圍為 2.095 px。

| 動作 | 裙身水平範圍：前 → 最終（px）|
| --- | ---: |
| asking | 11.249 → 0.671 |
| bye | 12.831 → 0.457 |
| fest_christmas | 11.885 → 0.921 |
| fest_dragonboat | 9.204 → 0.684 |
| fest_midautumn | 9.427 → 0.457 |
| fest_national | 13.622 → 0.941 |
| fest_newyear | 8.394 → 0.42 |
| forgiven | 8.354 → 0.817 |
| greet_afternoon | 16.53 → 0.534 |
| greet_dawn | 5.5 → 0.497 |
| greet_evening | 6.872 → 0.949 |
| greet_morning | 9.361 → 0.443 |
| greet_night | 16.268 → 0.462 |
| dizzy | 12.597 → 0.563 |
| fest_halloween | 9.072 → 0.505 |
| greet_noon | 4.234 → 0.824 |
| hum | 5.937 → 0.812 |

另有 25 個後續生成站姿在製作時直接套用對齊；42 個整數對齊動作的最大裙身水平位移範圍為 1.001 px。

## 特殊修正

- edge_right / edge_right_peek：每幀右側截邊固定 x=185；Bust 固定對應右邊界。
- delegating：只重繪並合成末幀的手與書。前五幀位元相同，末幀改動限制於 x=32…140、y=79…124；臉、下半身與小夥伴保留。
- running：補繪第二半步態，左右落腳方向不同，保持六幀、每幀 80 ms。
- proud：共同縮放與位置保留足夠上下留白，修復 CV 對齊後鞋底碰到畫布邊緣。

全批 60/60 已完成。詳見 [交付與驗證](crosspet-image26-delivery.md)。
