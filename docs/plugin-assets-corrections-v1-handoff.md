# 給 plugin agent 的接入 prompt

請在本 repo 接入已完成的素材修正版，並完成插件層驗證。

先閱讀 `docs/plugin-assets-corrections-v1-delivery.md` 與 `tools/assets/plugin-assets-corrected-v1/README.md`。修正版以 `tools/assets/plugin-assets-corrected-v1/{classic,smooth,extra}/` 為準，共 52 動作、660 PNG；目前尚未替換 `plugin/assets`，也未重建字元資料。`work/`、`review/`、JSON 與 README 是製作／驗證資料，不要當成插件正式素材整包複製。

已修正 angry／extra 髮色、listening／idle-2 的尺度與位置、writing／tired／yawn／surprised／pat-2 的橫向偏移；sorry／stretch／clawd／delegating／compact 已重製姿勢改善頭身與道具比例。全身統一 186×184、Bust 130×125；一般站姿中心 x=91、腳底 y=178，走動／跳躍／坐姿等有例外，不要再對每張圖獨立 fit 或追臉裁切。

請完成：

1. 導入前核對 `validation.json`（errors=[]）、`source-sha256.json` 與 `review/browser-validation.json`。素材檢查為 660 張 PNG 載入成功、3,444 組有向切換已播放；這不是正式插件宿主驗證。可先執行 `python tools/verify_plugin_asset_candidates.py`，需 Pillow、NumPy、OpenCV。導入後原圖雜湊預期改變，不應再用「來源必須不變」那項檢查當作接入成功條件；改核對導入檔案等於候選 PNG 的雜湊。
2. 將三個候選素材目錄接入 `plugin/assets`，保留全部動作／幀名及既有時序與事件語意；確認 classic 的圖像框設定改用新畫布比例。不要為了沿用舊設定把圖片拉回 180／122 高度。
3. 檢查並調整生成流程，再從這批最終 PNG 重建相關 `frames-*.ts`／palette／imageSizes，讓 image 與 cells 一致。尤其 `tools/build_frames.py` 會刪除並從舊 spritesheet 重建素材，不能原樣重跑蓋回舊版；`tools/build_extra.py` 也會重建目錄，且把 idle-1 映射成來源 idle，與候選目錄 idle-1 不同。不要用舊來源重新生成 PNG，或讓字元模式的 Bust 另採自動裁切而與候選 Bust 不一致。
4. 實際測試 smooth／classic 的 image／cells、全身／Bust，重點包含 idle↔idle-1、idle-1↔idle-2／listening、running↔searching／writing、working↔tired、idle↔yawn↔sleeping-2、pat-2↔idle；測雙向轉換及不同退出幀。另檢查 angry 髮色、sorry／stretch／clawd／delegating／compact 的尺度、手與道具及裁切。保留跑動方向與舞台 offset，不能把有意的走動也鎖死。
5. 執行與變更相符的建置／測試，確認素材被打包。回報實際驗證內容及限制；依專案既有發版流程更新必要版號／說明，只有確實測過才能宣稱插件修正完成。避免修改無關檔案，尤其目前工作區另有 `tools/build_failed.py` 的既有修改。

本批使用內建 imagegen，模型版本不可驗證，請勿宣稱已確認 image2.6。候選目錄是本次接入的正式來源；後續如需微調，另保留版本並更新驗證紀錄。
