# 竹托地圖

新竹市與新竹縣托嬰中心地圖：招生資訊、裁罰紀錄、評鑑與準公共化資格，一張地圖看完。

- **綠色標記** = 近 60 天有招生資訊（FB/IG 貼文或官網字樣）
- **紅色「罰」印章** = 有裁罰紀錄（衛福部公告，名稱自動比對）
- 點標記看詳細：地址導航、電話、社群連結、招生摘要、裁罰明細

## 資料來源

| 資料 | 來源 | 更新方式 |
|---|---|---|
| 托嬰中心名單／評鑑／座標 | [衛福部托育媒合平臺](https://ncwisweb.sfaa.gov.tw/home/childcare-center) | `scripts/sync-centers.ts` |
| 裁罰紀錄 | [CRC 違反兒少法公告](https://crc.sfaa.gov.tw/ChildYoungLaw/Sanction) | `scripts/fetch-penalties.ts` |
| 官網招生字樣 | 各中心官網（`links.website`） | `scripts/fetch-websites.ts` |
| FB/IG 貼文 | Apify（需 token） | `scripts/fetch-social.ts` |

裁罰紀錄以機構名稱自動比對，可能涵蓋同名機構立案前的裁罰；請以公告原文為準。

## 本地開發

需要 Node.js 24+（本機安裝在 `~/.local/node/`，執行前先設 PATH）：

```bash
export PATH="$HOME/.local/node/node-v24.18.0-darwin-arm64/bin:$PATH"
npm install
npm run dev        # http://localhost:3000
npm test           # vitest
```

### Google Maps 金鑰（每位使用者自備）

地圖採「使用者自帶金鑰」：開啟網頁後，地圖區會引導你申請 Google Maps API
金鑰並貼入欄位。**金鑰只存在你自己瀏覽器的 localStorage**，不會上傳到任何伺服器，
也不會進入版控——網站擁有者的金鑰不會被別人用爆，你的金鑰也不會被竊取。
地圖左下角的「更換地圖金鑰」可隨時移除或更換。

開發者也可以在 `.env.local` 設 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
作為本機預設值（`.env*` 已被 gitignore）。

沒有金鑰時清單與篩選仍可使用。

## 資料更新

```bash
npx tsx scripts/sync-centers.ts      # 名單+座標（免金鑰）
npx tsx scripts/fetch-penalties.ts   # 裁罰（免金鑰）
npx tsx scripts/fetch-websites.ts    # 官網招生掃描（免金鑰）
npx tsx scripts/fetch-social.ts      # FB/IG（需 APIFY_TOKEN）
```

### 建檔社群連結（一次性）

FB/IG 抓取只處理 `data/centers.json` 中已建檔 `links` 的中心：

```bash
npx tsx scripts/bootstrap-links.ts           # 產生候選 → data/links-candidates.json
# 人工確認候選連結，把 confirmed 改 true
npx tsx scripts/bootstrap-links.ts --apply   # 合併進 centers.json
```

## 部署（GitHub Pages）

網站是全靜態輸出（`next build` 產出 `out/`），用 GitHub Pages 免費託管：

1. 推上 GitHub 後，到 repo → Settings → Pages → Source 選 **GitHub Actions**
2. `.github/workflows/deploy-pages.yml` 會在每次 push 到 main 時自動建置部署，
   網址為 `https://<帳號>.github.io/<repo>/`
3. `.github/workflows/update-data.yml` 每週一 06:00（台灣時間）自動更新
   `data/*.json`、commit 並觸發重新部署；也可在 Actions 頁手動觸發
4. （選填）GitHub repo → Settings → Secrets → Actions 加 `APIFY_TOKEN`
   啟用 FB/IG 抓取

本地預覽靜態產物：`npm run build && npm run preview`（http://127.0.0.1:3100）。

## 架構

- Next.js 16（App Router）+ Tailwind 4 + [@vis.gl/react-google-maps](https://github.com/visgl/react-google-maps)
- 無資料庫：資料就是 repo 裡的 `data/*.json`，由排程腳本更新
- `lib/` 純函式（座標轉換、解析器、狀態判定）都有 vitest 測試；`scripts/` 是資料管線
