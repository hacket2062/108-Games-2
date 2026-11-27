# 操作引導、自由練習與學習結算

工作分支：`codex/security-hardening`。本批 base：`abe1bf1e9aa99f369355d69e45fcdb59512d4774`。

## 本輪行為

- 每個本機帳號 session 首次進入各科，先顯示專屬任務、三步操作與實際輸入方式；按準備好才掛載引擎。返回地圖不啟動遊戲。教學閱讀不消耗戰鬥時間或 HP。
- 四科暫停選單與選關頁都可重看操作說明。說明使用 HTML，支援鍵盤與小螢幕捲動。
- 自由練習及家長強制練習採一致選關判斷，可進入尚未解鎖關卡。冒險仍按原章節順序解鎖。
- 練習結算保留既有個人遊玩獎勵與真實作答記錄，新增歷史文字標記；不變更冒險 stageProgress、星星、首通 Boss 寶箱或 Boss 冒險任務。既有存檔紀錄不重設。
- 修正「通關任一世界 Boss」任務原本一般關也能完成的問題，需冒險 Boss 通關才更新。
- 零次作答顯示「尚未作答」，取消虛構 100%。結算用本次次數提供回饋，提供錯題本與失敗後切換練習入口，不宣稱掌握全部概念。

## 驗證

- Node 24.22.3，`scripts/verify-local.ps1`：TypeScript exit 0、29 tests passed / 0 failed、Vite 正式建置 exit 0。
- `scripts/verify-browser.mjs`：1440×1000、390×844、320×740、844×390；驗證四科教學不啟動引擎、暫停重看教學、原有開始／繼續／重試／返回、本機學生隔離、練習可進鎖定 Boss、冒險保持鎖關。0 水平溢出、0 未捕捉 JS 錯誤。
- `scripts/verify-learning-ui.mjs`：獨立 Vite 測試頁使用真實 React 結算元件與 GameStateProvider。驗證未作答不是 100%、2/3 顯示 67%、錯題／練習操作回呼；實際套用練習 Boss 結算後，冒險進度／寶箱武器／額外晶石／Boss 任務保持原樣，歷史標示練習。這是受控元件與 Context 整合，不冒充完整遊玩通關 E2E。
- 所有瀏覽器 context 都阻擋非 localhost 請求，不接觸正式 Firebase 資料。截圖與原始 JSON 在 git-ignored `.verification/`；彙整結果在本目錄 JSON。
- 大廳圖片及新教學截圖有人工視覺檢查。建置仍有大 chunk 警告；套件修補後安裝／audit 尚未完成。

重跑元件整合測試：使用原驗證環境的 `PLAYWRIGHT_MODULE_PATH`，再以 Node 執行 `scripts/verify-learning-ui.mjs`。腳本使用 localhost:3002，建立 ignored 測試 HTML 並於完成後關閉測試伺服器；不加入正式建置入口。

## Gemini 與後續需求

本批為 Codex 根據程式碼問題實作，沒有冒稱由 Gemini 審核。Gemini 桌面工具存取授權逾時；完整可送審請求已寫於 `../GEMINI_REVIEW_REQUEST.md`。回覆到齊後需記錄 Gemini 原始意見、採納／不採納原因與驗收案例。

本輪沒有完成完整弱項自適應、持久化學習事件／assisted 模型、17 份 Boss 劇本、共鬥或權威 PvP。原 roadmap 及 P1 安全阻礙保留。無存檔 schema 遷移、無正式部署、無正式資料修改。
