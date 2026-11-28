# Cloudflare Workers 預覽建置修正

起點：`51d1709b221a132a9ae257c6b0403cfd08dc76c2`；分支 `codex/security-hardening`。

## 真實失敗原因

使用者登入 Cloudflare 後，透過 Chrome 原生 UI 讀取建置 `1837ebb2-cf6e-47a2-8c86-2b0da3501f7d`。日誌顯示 Node **24.22.3**、npm **10.9.2**，失敗發生於 `npm clean-install --progress=false`，尚未進入 Vite 建置：

```
npm error code EUSAGE
npm error Invalid: lock file's @grpc/grpc-js@1.9.16 does not satisfy @grpc/grpc-js@1.13.6
```

不是根據 GitHub failure 標籤猜測；本次已實際取得 Cloudflare 安裝階段日誌。

## 修正

- `package-lock.json` 中 gRPC 同步為 override 指定的 1.13.6；相依改為 `@grpc/proto-loader ^0.7.13`（現有 0.7.15 滿足）及新增 `@js-sdsl/ordered-map 4.4.2`。版本、tarball URL、SHA-512 integrity、license、Node engines 直接核對 npm registry 官方版號端點。
- 此受管 shell 無權讀取系統 npm，也無法連線 registry（EACCES），因此這次是精確修補鎖檔，**不是宣稱本機已執行 npm install 或全新 npm ci**。不刪 override、不退版 Firebase、不用 force／legacy-peer-deps 規避檢查。全新安裝驗證由 Cloudflare 建置負責。
- 補 `wrangler.jsonc`：Worker 名稱 `108-games-2`、相容日期沿用服務原值 `2026-11-23`、靜態產物 `./dist`、SPA fallback。避免部署時臨時自動偵測設定或誤上傳原始碼。
- Cloudflare Settings → Builds → 預覽基礎，將 `bun run build` 改為 `npm run typecheck && npm test && npm run build`，按儲存後確認。保留 `npx wrangler preview`（官方現行預設）、根目錄 `/`、原 token、既有預覽開關。未改權限／secret／正式資料。
- 生產分支仍為 `main`、部署命令仍 `npx wrangler deploy`。第二輪核對實際雲端日誌後，也將生產頁的建置命令由 `bun run build` 改為 `npm run build` 並儲存，統一 package manager 且相容尚未合併的 main 腳本；這個設定變更未觸發正式發布。修正只同步任務分支，不合併 main，沒有手動部署正式站。

## 驗證狀態

### 最終成功 `252d232`（建置 `96a9c6a5`，58 秒）

- Cloudflare 畫面五階段全部綠燈，日誌 `Success: Deploy command completed`、`Success! Build completed.`。
- 乾淨安裝再次成功，375 packages installed／382 audited，`found 0 vulnerabilities`。
- Vite 建置與 16 項靜態資產上傳成功，包含五張美術圖集。
- 分支預覽：[遊戲預覽](https://codex-security-hardening-108-games-2.hacket2062.workers.dev)；固定部署：[b7cc4b30](https://b7cc4b30-108-games-2.hacket2062.workers.dev)。已在實際 Chrome 開啟並看到四世界、角色成長與隨機任務板，本機模式正常顯示。
- 實際成功日誌仍是 `bun run build`；設定 UI 雖顯示並儲存 npm，既有分支建置使用的命令尚未反映該變更。**不要宣稱雲端執行了 typecheck／47 測試**：這兩項是本機通過；這次雲端證據為乾淨安裝、audit、Vite build 與 preview deploy 成功。這個命令差異不是此次失敗原因，後續另核對 trigger 設定；不為命令字樣反覆重建已成功的站。
- 本次問題已解決：原始鎖檔不一致與後續缺 `previews` 均修正，GitHub 任務分支可成功發布預覽。未合併 main、未發布正式版、未變更學生雲端資料。

### 第一輪雲端驗證 `b3aaa79`（建置 `3407ea9a`）

- Cloudflare 真實 `npm clean-install` 成功：安裝 375 packages、audit 382 packages，日誌回報 **found 0 vulnerabilities**。這證明鎖檔修正已通過乾淨安裝；不代表本機 node_modules 也已更新。
- Vite 8.4.0 雲端 production build 成功（1740 modules，970ms）。
- 新失敗位於 `npx wrangler preview`，Wrangler 4.169.0 明示需要 `previews` block。已補 `"previews": {}`；官方允許空 block，靜態資產與相容設定仍放頂層。
- 這次執行日誌仍顯示 `bun run build`，因此前述 UI 儲存後看到 npm 字串不足以證明設定持久化；需重新登入頁核對／重新儲存後驗證，不宣稱雲端已執行型別與測試。

本機型別、47 原生測試與 Vite 建置通過，但本機已安裝 gRPC 仍是舊版，不能作為新版依賴全新安裝證據。同步後需追蹤新 commit 的 Cloudflare check、讀取完整日誌，確認安裝、型別、測試、產物建置與預覽發布全部成功；若有後續錯誤，繼續修正並記錄，不把通過第一個步驟當作整體完成。

完整 npm audit、Firestore Emulator、正式發布驗收仍分開處理。官方參考：[Workers Builds 設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[npm gRPC 1.13.6](https://registry.npmjs.org/@grpc%2fgrpc-js/1.13.6)、[ordered-map 4.4.2](https://registry.npmjs.org/@js-sdsl%2fordered-map/4.4.2)。
