# Claude ちゃん狀態－動作列表（image26-v1）

本文件列出 Claude ちゃん所有會出現的狀態，以及要用 [image26-v1](../image26-v1/) 的哪個動作。「決定」欄是 2026-11-06 確認的結果，已在 0.5.0 接入插件。

- 本次只處理 claude。deepseek 目前沒有新版素材，不在範圍內。
- 候選連結開啟全身 GIF（186 × 184）。半身 GIF（130 × 125）見文末的[動作總表](#5-動作總表)。兩種尺寸都和插件現有的 `N.png`、`N-bust.png` 相同，腳底也已對齊，可以直接放進插件。
- 「目前」欄是 `plugin/assets/<圖庫>/<狀態>/` 的 PNG 依實際節奏轉出的預覽，放在 [tools/assets/current-preview](../tools/assets/current-preview/)。

| 章節 | 內容 | 數量 |
|---|---|---:|
| [1](#1-現有核心狀態) | 插件現有的核心狀態，決定要換圖或保留 | 9 列（10 個狀態） |
| [2](#2-現有的其他情境) | 插件已有、但沒有獨立動畫的情境 | 3 列 |
| [3](#3-新增狀態) | 已同意新增的四組狀態 | 36 列 |
| [4](#4-目前沒有安排的動作) | 還沒分配用途的動作 | 7 個 |
| [5](#5-動作總表) | 60 個動作各自用在哪裡 | 60 個 |

## 1. 現有核心狀態

| 狀態 | 何時出現 | 目前（smooth / classic） | 候選 | 建議 | 決定 |
|---|---|---|---|---|---|
| `idle` | 沒事時的待機 | [smooth](../tools/assets/current-preview/smooth/idle.gif) / [classic](../tools/assets/current-preview/classic/idle.gif)，6 幀，6.6 秒 | [idle](../image26-v1/idle.gif)、[idle-2](../image26-v1/idle-2.gif)、[idle-3](../image26-v1/idle-3.gif)、[idle-blink](../image26-v1/idle-blink.gif) | 換成 `idle`。輪播見 3-4 | `idle-1`，輪播加入原版 `idle` |
| `running` | 主迴圈工作中，沒有更具體的工具姿勢時 | [smooth](../tools/assets/current-preview/smooth/running.gif) / [classic](../tools/assets/current-preview/classic/running.gif)，6 幀，0.82 秒 | [reading-2](../image26-v1/reading-2.gif)、[thinking](../image26-v1/thinking.gif) | 換成 `reading-2`。依工具切換見 3-1 | 保留（原版） |
| `running-right` / `running-left` | 工作中每 40 秒在橫條上走一趟 | [smooth 右](../tools/assets/current-preview/smooth/running-right.gif) / [smooth 左](../tools/assets/current-preview/smooth/running-left.gif)，8 幀，1.06 秒 | [running](../image26-v1/running.gif)（單一方向）、[swamped_left](../image26-v1/swamped_left.gif) / [swamped_right](../image26-v1/swamped_right.gif)（抱書走路，有左右兩向） | 換成 `running`，反方向用鏡像（書和髮飾會左右顛倒）。工作量大時改走 `swamped_*`，見 3-1 | 保留（原版） |
| `waving` | 開場打招呼 | [smooth](../tools/assets/current-preview/smooth/waving.gif) / [classic](../tools/assets/current-preview/classic/waving.gif)，4 幀，0.70 秒 | `greet_*`、`fest_*` | 改依時段與節日播，見 3-2 | 保留（原版） |
| `jumping` | 你送出指令後的「收到」 | [smooth](../tools/assets/current-preview/smooth/jumping.gif) / [classic](../tools/assets/current-preview/classic/jumping.gif)，5 幀，0.84 秒 | [listening](../image26-v1/listening.gif) | 換成 `listening` | `listening` |
| `waiting` | 等你核准權限、回答 AskUserQuestion 或核准計畫 | [smooth](../tools/assets/current-preview/smooth/waiting.gif) / [classic](../tools/assets/current-preview/classic/waiting.gif)，6 幀，1.01 秒 | [asking](../image26-v1/asking.gif)（攤開書給你看） | 換成 `asking` | 保留（原版） |
| `review` | 回答完成 | [smooth](../tools/assets/current-preview/smooth/review.gif) / [classic](../tools/assets/current-preview/classic/review.gif)，6 幀，1.03 秒 | [proud](../image26-v1/proud.gif)（頭上小皇冠）、[happy-2](../image26-v1/happy-2.gif)（開心揮手） | 換成 `proud`。做很久才完成見 3-3 | `proud` |
| `failed` | 這輪出錯 | [smooth](../tools/assets/current-preview/smooth/failed.gif) / [classic](../tools/assets/current-preview/classic/failed.gif)，6 幀，1.20 秒 | 沒有對應動作 | 保留（0.4.3 剛重畫）。工具失敗、被拒、被打斷另外分出來，見 3-3 | 照建議：保留 |
| `angry` | 4 秒內戳三次以上 | [smooth](../tools/assets/current-preview/smooth/angry.gif) / [classic](../tools/assets/current-preview/classic/angry.gif)，8 幀，1.08 秒（頭上有生氣符號） | [puffed](../image26-v1/puffed.gif)（鼓臉）、[annoyed](../image26-v1/annoyed.gif)（斜眼）、[sulk](../image26-v1/sulk.gif)（嘔氣） | 保留，生氣符號最清楚 | 照建議：保留 |

## 2. 現有的其他情境

這三種情境插件已經有，但目前是借用別的狀態畫面，沒有自己的動畫。

| 情境 | 何時出現 | 目前畫面 | 候選 | 建議 | 決定 |
|---|---|---|---|---|---|
| 打瞌睡 | 待機超過 20 秒（0.5.1 起改為 2 分鐘） | 停在 `idle` 第 3 幀（閉眼）不動 | [yawn](../image26-v1/yawn.gif)、[sleeping-2](../image26-v1/sleeping-2.gif) | 先播一次 `yawn`，接著循環 `sleeping-2` | 照建議 |
| 被戳 | 點她一下，五種反應輪流 | 依序借用 `waving`、`jumping`、`review`、`running`、`waiting` | [surprised](../image26-v1/surprised.gif)、[pat-2](../image26-v1/pat-2.gif)（拿書遮臉）、[coaxed](../image26-v1/coaxed.gif)（害羞笑）、[redhot](../image26-v1/redhot.gif)（臉紅）、[hum](../image26-v1/hum.gif) | 依序換成 `surprised`「嗨～找我嗎？」、`pat-2`「嘿嘿，被你發現了！」、`coaxed`「在看什麼呢？我也要看」、`redhot`「我有在努力喔！」、`hum`「……要我做什麼嗎？」 | 照建議；0.5.3 起拿掉 `redhot`，剩四種輪流 |
| 再戳就生氣的警告 | 4 秒內第二次戳 | 輪到哪個反應就播哪個，只換對白為「唔…別一直戳啦」 | [annoyed](../image26-v1/annoyed.gif) | 換成 `annoyed` | 照建議 |

## 3. 新增狀態

### 3-1. 依工具切換工作姿勢

工作中（`running`）依目前的工具換姿勢。子代理（subagent）的工具呼叫不影響主畫面，與現在相同。

| 情境 | 觸發條件 | 候選 | 建議 | 決定 |
|---|---|---|---|---|
| 構思中 | 這輪開始，還沒呼叫任何工具 | [thinking](../image26-v1/thinking.gif)、[thinking-2](../image26-v1/thinking-2.gif) | `thinking` | 照建議 |
| 閱讀 | Read | [reading-2](../image26-v1/reading-2.gif) | `reading-2` | `running`（原版） |
| 搜尋 | Grep、Glob、WebSearch、WebFetch | [searching](../image26-v1/searching.gif)（拿放大鏡） | `searching` | 照建議 |
| 寫入 | Edit、Write、NotebookEdit | [writing](../image26-v1/writing.gif) | `writing` | 照建議 |
| 執行指令 | Bash | [busy_left](../image26-v1/busy_left.gif) / [busy_right](../image26-v1/busy_right.gif)（兩手拿書忙碌） | 兩向交替播 | 照建議 |
| 派工 | Agent | [delegating](../image26-v1/delegating.gif)（腳邊有小幫手） | `delegating` | 照建議 |
| 其他工具 | 上面沒列到的工具 | `running` | 沿用 `running` | 照建議 |
| 工作量大 | 同一輪呼叫工具 30 次以上，橫條走路時改用 | [swamped_left](../image26-v1/swamped_left.gif) / [swamped_right](../image26-v1/swamped_right.gif) | 依走路方向 | 照建議 |
| 疲累 | 同一輪超過 10 分鐘，取代該輪的 `running` | [tired](../image26-v1/tired.gif) | `tired` | 照建議 |

### 3-2. 問候、節日、道別、更新

| 情境 | 觸發條件 | 候選 | 建議 | 決定 |
|---|---|---|---|---|
| 清晨問候 | 開場，05:00–08:00 | [greet_dawn](../image26-v1/greet_dawn.gif) | `greet_dawn` | 不使用 |
| 早安 | 開場，08:00–11:00 | [greet_morning](../image26-v1/greet_morning.gif) | `greet_morning` | 不使用 |
| 午安 | 開場，11:00–13:00 | [greet_noon](../image26-v1/greet_noon.gif) | `greet_noon` | 不使用 |
| 下午好 | 開場，13:00–17:00 | [greet_afternoon](../image26-v1/greet_afternoon.gif) | `greet_afternoon` | 不使用 |
| 晚上好 | 開場，17:00–21:00 | [greet_evening](../image26-v1/greet_evening.gif) | `greet_evening` | 不使用 |
| 深夜 | 開場，21:00–05:00 | [greet_night](../image26-v1/greet_night.gif) | `greet_night` | 不使用 |
| 元旦 | 開場，1 月 1 日，優先於時段問候 | [fest_newyear](../image26-v1/fest_newyear.gif) | `fest_newyear` | 不使用 |
| 春節 | 開場，農曆正月初一至初五 | [fest_spring](../image26-v1/fest_spring.gif) | `fest_spring` | 不使用 |
| 元宵 | 開場，農曆正月十五 | [fest_lantern](../image26-v1/fest_lantern.gif) | `fest_lantern` | 不使用 |
| 端午 | 開場，農曆五月初五 | [fest_dragonboat](../image26-v1/fest_dragonboat.gif) | `fest_dragonboat` | 不使用 |
| 中秋 | 開場，農曆八月十五 | [fest_midautumn](../image26-v1/fest_midautumn.gif) | `fest_midautumn` | 不使用 |
| 國慶 | 開場，日期待你決定（10 月 10 日或 10 月 1 日） | [fest_national](../image26-v1/fest_national.gif) | 請指定日期，或不要 | 不使用 |
| 萬聖節 | 開場，10 月 31 日 | [fest_halloween](../image26-v1/fest_halloween.gif) | `fest_halloween` | 不使用 |
| 聖誕節 | 開場，12 月 24 日至 25 日 | [fest_christmas](../image26-v1/fest_christmas.gif) | `fest_christmas` | 不使用 |
| 插件更新後 | 開場時發現插件版本比上次新 | [update](../image26-v1/update.gif)（捧著發光的禮物盒） | `update`，優先於節日與時段問候 | 不使用 |
| 道別 | 對話結束（`/exit` 等） | [bye](../image26-v1/bye.gif) | `bye`。結束時畫面可能馬上關閉，實作時確認來不來得及播 | 不使用 |

本節整組不使用，開場維持原版 `waving`。

### 3-3. 情緒與錯誤

| 情境 | 觸發條件 | 候選 | 建議 | 決定 |
|---|---|---|---|---|
| 工具失敗 | 單一工具回傳錯誤 | [oops](../image26-v1/oops.gif) | `oops`（取代目前的 `failed`） | 照建議 |
| 工具被拒絕 | 你拒絕了權限請求 | [sulk](../image26-v1/sulk.gif)、[puffed](../image26-v1/puffed.gif) | `sulk` | 照建議 |
| 連續失敗 | 同一輪工具失敗 3 次以上 | [dizzy](../image26-v1/dizzy.gif)（頭暈搖晃） | `dizzy` | 照建議 |
| 被打斷 | 你中斷了這一輪 | [sorry](../image26-v1/sorry.gif) | `sorry`（取代目前的 `failed`） | 照建議 |
| 這輪出錯 | 這一輪以錯誤結束 | `failed` | 保留 `failed` | 照建議 |
| 完成 | 這一輪正常完成 | [proud](../image26-v1/proud.gif) | `proud` | 照建議 |
| 辛苦完成 | 這一輪超過 3 分鐘才完成 | [happy-2](../image26-v1/happy-2.gif) | `happy-2` | 照建議 |
| 壓縮對話 | 自動或手動 compact | [compact](../image26-v1/compact.gif)（坐在行李箱上打包） | `compact` | 照建議 |

### 3-4. 待機與戳戳互動

| 情境 | 觸發條件 | 候選 | 建議 | 決定 |
|---|---|---|---|---|
| 待機輪播 | 待機中，每循環幾輪隨機換一個 | [idle-2](../image26-v1/idle-2.gif)、[idle-3](../image26-v1/idle-3.gif)、[idle-blink](../image26-v1/idle-blink.gif)、[hum](../image26-v1/hum.gif)（哼歌）、[clawd](../image26-v1/clawd.gif)（抱橘色玩偶） | 全部加入輪播，`clawd` 出現機率較低 | 照建議，並加入原版 `idle` |
| 被叫醒 | 打瞌睡時有新動作（你送出指令、點她） | [stretch](../image26-v1/stretch.gif)（伸懶腰） | 播一次 `stretch`，再進入原本該播的狀態 | 照建議；0.5.3 起改為 `redhot`（被抓到偷睡而臉紅），`stretch` 不再使用 |
| 消氣 | 生氣結束後 | [forgiven](../image26-v1/forgiven.gif) | `forgiven` | 照建議 |

## 4. 目前沒有安排的動作

| 動作 | 內容 | 可能用途 | 決定 |
|---|---|---|---|
| [avatar](../image26-v1/avatar.gif) | 頭像特寫 | 橫條空間太小時的迷你頭像（目前用 `idle` 的半身） | 本次未接入 |
| [portrait](../image26-v1/portrait.gif) | 全身立繪 | README 或 `/chibi` 說明畫面 | 本次未接入 |
| [portrait-card](../image26-v1/portrait-card.gif) | 立繪卡 | 同上 | 本次未接入 |
| [edge_left](../image26-v1/edge_left.gif) / [edge_right](../image26-v1/edge_right.gif) | 貼著左／右邊緣，身體被截掉一半 | 橫條走路走到邊緣時停一下 | 本次未接入 |
| [edge_left_peek](../image26-v1/edge_left_peek.gif) / [edge_right_peek](../image26-v1/edge_right_peek.gif) | 從左／右邊緣探頭 | 面板剛打開時探頭進來 | 本次未接入 |

## 5. 動作總表

60 個動作各自的節奏與用途。全身與半身欄連到 GIF。

| 動作 | 幀數 | 一輪 | 全身 | 半身 | 出現在 |
|---|---:|---:|---|---|---|
| `annoyed` | 8 | 0.96 秒 | [GIF](../image26-v1/annoyed.gif) | [GIF](../image26-v1/annoyed-bust.gif) | 1 `angry`；2 再戳就生氣的警告 |
| `asking` | 6 | 0.72 秒 | [GIF](../image26-v1/asking.gif) | [GIF](../image26-v1/asking-bust.gif) | 1 `waiting` |
| `avatar` | 6 | 0.72 秒 | [GIF](../image26-v1/avatar.gif) | [GIF](../image26-v1/avatar-bust.gif) | 4 avatar |
| `busy_left` | 8 | 0.96 秒 | [GIF](../image26-v1/busy_left.gif) | [GIF](../image26-v1/busy_left-bust.gif) | 3-1 執行指令 |
| `busy_right` | 8 | 0.96 秒 | [GIF](../image26-v1/busy_right.gif) | [GIF](../image26-v1/busy_right-bust.gif) | 3-1 執行指令 |
| `bye` | 4 | 0.48 秒 | [GIF](../image26-v1/bye.gif) | [GIF](../image26-v1/bye-bust.gif) | 3-2 道別 |
| `clawd` | 6 | 0.72 秒 | [GIF](../image26-v1/clawd.gif) | [GIF](../image26-v1/clawd-bust.gif) | 3-4 待機輪播 |
| `coaxed` | 6 | 0.72 秒 | [GIF](../image26-v1/coaxed.gif) | [GIF](../image26-v1/coaxed-bust.gif) | 0.5.3 起改為被叫醒（原為 2 被戳） |
| `compact` | 6 | 0.72 秒 | [GIF](../image26-v1/compact.gif) | [GIF](../image26-v1/compact-bust.gif) | 3-3 壓縮對話 |
| `delegating` | 6 | 0.72 秒 | [GIF](../image26-v1/delegating.gif) | [GIF](../image26-v1/delegating-bust.gif) | 3-1 派工 |
| `dizzy` | 6 | 0.72 秒 | [GIF](../image26-v1/dizzy.gif) | [GIF](../image26-v1/dizzy-bust.gif) | 3-3 連續失敗 |
| `edge_left` | 6 | 0.72 秒 | [GIF](../image26-v1/edge_left.gif) | [GIF](../image26-v1/edge_left-bust.gif) | 4 edge_left / edge_right |
| `edge_left_peek` | 6 | 0.72 秒 | [GIF](../image26-v1/edge_left_peek.gif) | [GIF](../image26-v1/edge_left_peek-bust.gif) | 4 edge_left_peek / edge_right_peek |
| `edge_right` | 6 | 0.72 秒 | [GIF](../image26-v1/edge_right.gif) | [GIF](../image26-v1/edge_right-bust.gif) | 4 edge_left / edge_right |
| `edge_right_peek` | 6 | 0.72 秒 | [GIF](../image26-v1/edge_right_peek.gif) | [GIF](../image26-v1/edge_right_peek-bust.gif) | 4 edge_left_peek / edge_right_peek |
| `fest_christmas` | 4 | 0.48 秒 | [GIF](../image26-v1/fest_christmas.gif) | [GIF](../image26-v1/fest_christmas-bust.gif) | 3-2 聖誕節 |
| `fest_dragonboat` | 6 | 0.72 秒 | [GIF](../image26-v1/fest_dragonboat.gif) | [GIF](../image26-v1/fest_dragonboat-bust.gif) | 3-2 端午 |
| `fest_halloween` | 6 | 0.72 秒 | [GIF](../image26-v1/fest_halloween.gif) | [GIF](../image26-v1/fest_halloween-bust.gif) | 3-2 萬聖節 |
| `fest_lantern` | 6 | 0.72 秒 | [GIF](../image26-v1/fest_lantern.gif) | [GIF](../image26-v1/fest_lantern-bust.gif) | 3-2 元宵 |
| `fest_midautumn` | 6 | 0.72 秒 | [GIF](../image26-v1/fest_midautumn.gif) | [GIF](../image26-v1/fest_midautumn-bust.gif) | 3-2 中秋 |
| `fest_national` | 4 | 0.48 秒 | [GIF](../image26-v1/fest_national.gif) | [GIF](../image26-v1/fest_national-bust.gif) | 3-2 國慶 |
| `fest_newyear` | 4 | 0.48 秒 | [GIF](../image26-v1/fest_newyear.gif) | [GIF](../image26-v1/fest_newyear-bust.gif) | 3-2 元旦 |
| `fest_spring` | 6 | 0.72 秒 | [GIF](../image26-v1/fest_spring.gif) | [GIF](../image26-v1/fest_spring-bust.gif) | 3-2 春節 |
| `forgiven` | 6 | 0.72 秒 | [GIF](../image26-v1/forgiven.gif) | [GIF](../image26-v1/forgiven-bust.gif) | 3-4 消氣 |
| `greet_afternoon` | 4 | 0.48 秒 | [GIF](../image26-v1/greet_afternoon.gif) | [GIF](../image26-v1/greet_afternoon-bust.gif) | 3-2 下午好 |
| `greet_dawn` | 4 | 0.48 秒 | [GIF](../image26-v1/greet_dawn.gif) | [GIF](../image26-v1/greet_dawn-bust.gif) | 3-2 清晨問候 |
| `greet_evening` | 4 | 0.48 秒 | [GIF](../image26-v1/greet_evening.gif) | [GIF](../image26-v1/greet_evening-bust.gif) | 3-2 晚上好 |
| `greet_morning` | 4 | 0.48 秒 | [GIF](../image26-v1/greet_morning.gif) | [GIF](../image26-v1/greet_morning-bust.gif) | 3-2 早安 |
| `greet_night` | 4 | 0.48 秒 | [GIF](../image26-v1/greet_night.gif) | [GIF](../image26-v1/greet_night-bust.gif) | 3-2 深夜 |
| `greet_noon` | 4 | 0.48 秒 | [GIF](../image26-v1/greet_noon.gif) | [GIF](../image26-v1/greet_noon-bust.gif) | 3-2 午安 |
| `happy-2` | 6 | 0.72 秒 | [GIF](../image26-v1/happy-2.gif) | [GIF](../image26-v1/happy-2-bust.gif) | 1 `review`；3-3 辛苦完成 |
| `hum` | 6 | 0.72 秒 | [GIF](../image26-v1/hum.gif) | [GIF](../image26-v1/hum-bust.gif) | 2 被戳；3-4 待機輪播 |
| `idle` | 6 | 0.72 秒 | [GIF](../image26-v1/idle.gif) | [GIF](../image26-v1/idle-bust.gif) | 1 `idle` |
| `idle-2` | 6 | 0.72 秒 | [GIF](../image26-v1/idle-2.gif) | [GIF](../image26-v1/idle-2-bust.gif) | 1 `idle`；3-4 待機輪播 |
| `idle-3` | 6 | 0.72 秒 | [GIF](../image26-v1/idle-3.gif) | [GIF](../image26-v1/idle-3-bust.gif) | 1 `idle`；3-4 待機輪播 |
| `idle-blink` | 6 | 0.72 秒 | [GIF](../image26-v1/idle-blink.gif) | [GIF](../image26-v1/idle-blink-bust.gif) | 1 `idle`；3-4 待機輪播 |
| `listening` | 6 | 0.72 秒 | [GIF](../image26-v1/listening.gif) | [GIF](../image26-v1/listening-bust.gif) | 1 `jumping` |
| `oops` | 6 | 0.72 秒 | [GIF](../image26-v1/oops.gif) | [GIF](../image26-v1/oops-bust.gif) | 3-3 工具失敗 |
| `pat-2` | 6 | 0.72 秒 | [GIF](../image26-v1/pat-2.gif) | [GIF](../image26-v1/pat-2-bust.gif) | 0.5.3 起改為被叫醒（原為 2 被戳） |
| `portrait` | 6 | 1.08 秒 | [GIF](../image26-v1/portrait.gif) | [GIF](../image26-v1/portrait-bust.gif) | 4 portrait |
| `portrait-card` | 6 | 1.08 秒 | [GIF](../image26-v1/portrait-card.gif) | [GIF](../image26-v1/portrait-card-bust.gif) | 4 portrait-card |
| `proud` | 6 | 0.72 秒 | [GIF](../image26-v1/proud.gif) | [GIF](../image26-v1/proud-bust.gif) | 1 `review`；3-3 完成 |
| `puffed` | 8 | 0.96 秒 | [GIF](../image26-v1/puffed.gif) | [GIF](../image26-v1/puffed-bust.gif) | 1 `angry`；3-3 工具被拒絕 |
| `reading-2` | 6 | 0.72 秒 | [GIF](../image26-v1/reading-2.gif) | [GIF](../image26-v1/reading-2-bust.gif) | 1 `running`；3-1 閱讀 |
| `redhot` | 8 | 0.96 秒 | [GIF](../image26-v1/redhot.gif) | [GIF](../image26-v1/redhot-bust.gif) | 0.5.3 起改為被叫醒（原為 2 被戳） |
| `running` | 6 | 0.48 秒 | [GIF](../image26-v1/running.gif) | [GIF](../image26-v1/running-bust.gif) | 1 `running-right` / `running-left` |
| `searching` | 6 | 0.72 秒 | [GIF](../image26-v1/searching.gif) | [GIF](../image26-v1/searching-bust.gif) | 3-1 搜尋 |
| `sleeping-2` | 6 | 1.08 秒 | [GIF](../image26-v1/sleeping-2.gif) | [GIF](../image26-v1/sleeping-2-bust.gif) | 2 打瞌睡 |
| `sorry` | 6 | 0.72 秒 | [GIF](../image26-v1/sorry.gif) | [GIF](../image26-v1/sorry-bust.gif) | 3-3 被打斷 |
| `stretch` | 6 | 0.72 秒 | [GIF](../image26-v1/stretch.gif) | [GIF](../image26-v1/stretch-bust.gif) | 3-4 被叫醒（0.5.3 起不使用） |
| `sulk` | 6 | 0.72 秒 | [GIF](../image26-v1/sulk.gif) | [GIF](../image26-v1/sulk-bust.gif) | 1 `angry`；3-3 工具被拒絕 |
| `surprised` | 6 | 0.72 秒 | [GIF](../image26-v1/surprised.gif) | [GIF](../image26-v1/surprised-bust.gif) | 0.5.3 起改為被叫醒（原為 2 被戳） |
| `swamped_left` | 8 | 0.96 秒 | [GIF](../image26-v1/swamped_left.gif) | [GIF](../image26-v1/swamped_left-bust.gif) | 1 `running-right` / `running-left`；3-1 工作量大 |
| `swamped_right` | 8 | 0.96 秒 | [GIF](../image26-v1/swamped_right.gif) | [GIF](../image26-v1/swamped_right-bust.gif) | 1 `running-right` / `running-left`；3-1 工作量大 |
| `thinking` | 6 | 0.72 秒 | [GIF](../image26-v1/thinking.gif) | [GIF](../image26-v1/thinking-bust.gif) | 1 `running`；3-1 構思中 |
| `thinking-2` | 6 | 0.72 秒 | [GIF](../image26-v1/thinking-2.gif) | [GIF](../image26-v1/thinking-2-bust.gif) | 3-1 構思中 |
| `tired` | 6 | 0.72 秒 | [GIF](../image26-v1/tired.gif) | [GIF](../image26-v1/tired-bust.gif) | 3-1 疲累 |
| `update` | 6 | 0.72 秒 | [GIF](../image26-v1/update.gif) | [GIF](../image26-v1/update-bust.gif) | 3-2 插件更新後 |
| `writing` | 6 | 0.72 秒 | [GIF](../image26-v1/writing.gif) | [GIF](../image26-v1/writing-bust.gif) | 3-1 寫入 |
| `yawn` | 6 | 0.72 秒 | [GIF](../image26-v1/yawn.gif) | [GIF](../image26-v1/yawn-bust.gif) | 2 打瞌睡 |

## 6. 已確認事項

- **節奏**：素材每幀都是 120 毫秒（`portrait`、`portrait-card`、`sleeping-2` 為 180 毫秒）。接入時由插件依狀態指定每幀停留時間，待機與睡覺放慢，素材本身不改。
- **字元版**：`tools/build_frames.py` 改成能讀單張 PNG 影格，新動作一併產生字元（四分塊）版。
- **圖庫**：新動作只有一套畫風，`smooth` 與 `classic` 共用；原本的 10 個狀態維持各自的畫風。
- **素材大小**：只把有用到的動作 PNG 放進 `plugin/assets`，`image26-v1/` 的 `revisions/`、`sheets/` 不進插件。
