# 本機驗證與冒險入口改版

日期：2026-11-27。分支 `codex/security-hardening`；原始 base `faf9aefc137f6ccfab5cfa7d3e341689d6c5eec2`；開始 checkpoint `83ff37c`。成果仍在本機工作目錄。

## 本輪交付

- `src/core/saveIntegrity.ts`：修正字串索引型別，保留原存檔檢查及資料。
- `src/core/adventureGuide.ts` 與測試：由目前年級與近期科目找合法下一關；讀取進度，不修改存檔或開鎖。
- `src/components/WorldScene.tsx`、`AdventureBrief.tsx`、大廳與 CSS：原創向量四科入口、明確出發按鈕、進度條、夥伴區與鍵盤焦點。資產為本輪程式繪製，沒有新增外部美術授權或付費生成。
- `src/App.tsx`、四科引擎、共用型別與暫停選單：按需載入；同關重新挑戰建立新場次，讓舊場次失效。保留原戰鬥、題庫及存檔格式。
- `package.json`、`.node-version`、`package-lock.json`：Node 24／npm 政策及 gRPC 修補設定。刪除過期 `bun.lock`；lockfile 由 npm 產生，不手工偽造 integrity。
- `vite.config.ts`：以 `import.meta.dirname` 取代 `__dirname`，保留資產複製功能。
- `scripts/verify-local.ps1`、`verify-browser.mjs`：可重跑驗證。

## 實際結果

| 檢查 | 結果與限制 |
| --- | --- |
| Node | 24.22.3 可執行；系統預設 Node 及 npm 路徑未變更 |
| TypeScript | `tsc --noEmit` exit 0 |
| 原生測試 | 25 passed、0 failed；含 1 項規則結構 smoke test，不證明權限安全 |
| Vite | 8.4.0 build exit 0；仍有大於 500 kB chunk 警告 |
| Chrome 正式建置 | 4 個 viewport 全通過四科地圖／引擎啟動、暫停繼續重試退出、本機帳號隔離；0 未捕捉錯誤、0 水平溢出 |
| 首次 npm audit | 4 high、0 critical；見 `dependency-audit-before.json` |
| 修補後 npm audit | 尚待使用者安裝 override 並提供新報告；目前不可標示通過 |
| Gemini | 未執行，無可用 CLI／文字審核工具 |
| Firebase Emulator／真實雲端 | 未執行；瀏覽器測試封鎖外部連線 |

主入口 JS：改版前 1,340.35 kB（gzip 411.97 kB），按需載入後 1,194.05 kB（gzip 373.13 kB）。這是檔案大小，不是網路／裝置 FPS benchmark。

## 重跑方法

一般 Node 24.12+／npm 環境：

```powershell
npm ci
npm run typecheck
npm test
npm run build
npm audit --json > dependency-audit.json
```

安裝後亦可透過直接執行 Node 的檢查腳本：

```powershell
./scripts/verify-local.ps1 -NodePath 'C:/Program Files/WindowsApps/OpenAI.Codex_26.1120.6357.0_x64__2p2nqsd0c76g0/app/resources/cua_node/bin/node.exe'
```

此 Codex app 路徑可能隨更新改變。腳本會逐步檢查 exit code，任一步失敗即停止，不代替 npm audit。

正式建置瀏覽器檢查，先以 Node 執行 `node_modules/vite/bin/vite.js preview --host 127.0.0.1 --port 3001`，另開終端機：

```powershell
$env:VERIFY_BASE_URL='http://127.0.0.1:3001'
$env:PLAYWRIGHT_MODULE_PATH='C:/Program Files/WindowsApps/OpenAI.Codex_26.1120.6357.0_x64__2p2nqsd0c76g0/app/resources/cua_node/bin/node_modules/playwright'
node scripts/verify-browser.mjs
```

`node` 必須是相容版本。亦可用自己的已安裝 Playwright，省略 `PLAYWRIGHT_MODULE_PATH`。瀏覽器腳本使用 Chrome；結果與截圖保存在 git-ignored `.verification/`。測試在全新本機帳號 context 執行，不使用現有瀏覽器身份或正式資料。

## 套件弱點處理

首次報告指向 `@grpc/grpc-js@1.9.16`。Firestore 將它約束為 `~1.9.0`，單純 `npm audit fix` 無法跨過這個範圍；audit 建議大幅降級 Firebase，並非本輪選擇。改採精確 override `1.13.6`，依據官方公告修補兩項 gRPC 伺服器弱點：

- https://github.com/advisories/GHSA-m9gg-hp2v-232j
- https://github.com/advisories/GHSA-f596-whhp-79r4

這兩項公告描述伺服器憑證／錯誤訊息行為，不能因此宣稱前端存檔或 Firestore 規則已安全。仍須安裝新套件、檢查新 lockfile、重掃及重跑建置；不使用 `--force` 或 `--legacy-peer-deps`。

## 未完成與部署影響

沒有改存檔 schema、Firebase 專案、Google UID、既有進度、Firestore 規則或雲端資料；沒有正式部署／推送。gRPC override 的 Node Firestore 真實連線相容性仍待非正式環境驗證。本輪 UI 與本機流程測試不代表完整戰鬥平衡、學習成效、孩子偏好、手機實機效能或整個旗艦 roadmap 已驗收。

下一批優先：補存檔衝突／rapid serving／錯題重複領獎 browser cases、Emulator 權限 allow/deny 與雙客戶端競態，再持續 U/Q/M/E/L/B 功能。遊戲體驗應安排三至六年級孩子的觀察試玩，記錄能否自行開始、能否解釋玩法、遇錯是否願意再試；不能以開發者評語替代孩子的反應。
