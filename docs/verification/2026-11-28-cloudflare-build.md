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
- 生產分支仍為 `main`，生產建置／部署命令未修改。修正同步任務分支，只觸發分支預覽，沒有手動部署正式站。

## 驗證狀態

本機型別、47 原生測試與 Vite 建置通過，但本機已安裝 gRPC 仍是舊版，不能作為新版依賴全新安裝證據。同步後需追蹤新 commit 的 Cloudflare check、讀取完整日誌，確認安裝、型別、測試、產物建置與預覽發布全部成功；若有後續錯誤，繼續修正並記錄，不把通過第一個步驟當作整體完成。

完整 npm audit、Firestore Emulator、正式發布驗收仍分開處理。官方參考：[Workers Builds 設定](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/)、[npm gRPC 1.13.6](https://registry.npmjs.org/@grpc%2fgrpc-js/1.13.6)、[ordered-map 4.4.2](https://registry.npmjs.org/@js-sdsl%2fordered-map/4.4.2)。
