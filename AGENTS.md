<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# 專案筆記（竹托地圖）

- Node.js 不在系統 PATH：先 `export PATH="$HOME/.local/node/node-v24.18.0-darwin-arm64/bin:$PATH"`
- **Claude preview 瀏覽器跑不動 `next dev`（不會 hydrate，無錯誤訊息）**：要驗證 UI 請 `npm run build` 後用 `.claude/launch.json` 的 `prod` 設定（port 3100），並以 `127.0.0.1` 開頁（`localhost` 連不上）
- 資料管線見 README「資料更新」；lib/ 純函式改動請跑 `npm test`（TDD）
- 裁罰資料有法律敏感性：名稱比對邏輯（lib/match.ts）改動務必跑測試並抽查 data/penalties.json 的 centerId 對應
- data/*.json 由腳本產生，不要手改（例外：links 由 sync-centers 保留；座標用 data/coord-overrides.json 覆寫）
- 政府托育媒合平臺內嵌座標對少數中心不準：把正確 lat/lng（門牌精度，可用 OSM Nominatim 查）寫進 data/coord-overrides.json，sync-centers 會在轉換後套用、週更不會蓋掉
