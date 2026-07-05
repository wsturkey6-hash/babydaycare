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

### Google Maps 金鑰（地圖顯示必要）

1. 到 [Google Cloud Console](https://console.cloud.google.com/) 建立專案，啟用 **Maps JavaScript API**（需綁帳單帳戶，個人用量在免費額度內）
2. 建立 API 金鑰，建議設定 HTTP referrer 限制
3. 專案根目錄建立 `.env.local`（可從 `.env.local.example` 複製）：

```
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的金鑰
APIFY_TOKEN=你的Apify token   # 選填，FB/IG 抓取用
```

沒有金鑰時清單與篩選仍可使用，地圖區會顯示設定說明。

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

## 部署（Vercel + GitHub Actions）

1. 推上 GitHub，[Vercel](https://vercel.com/) import 這個 repo（免費 Hobby 方案即可）
2. Vercel 專案設定 → Environment Variables 加 `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
3. GitHub repo → Settings → Secrets → Actions 加 `APIFY_TOKEN`（選填）
4. `.github/workflows/update-data.yml` 每週一 06:00（台灣時間）自動更新 `data/*.json` 並 commit，Vercel 隨之自動重新部署；也可在 Actions 頁手動觸發

## 架構

- Next.js 16（App Router）+ Tailwind 4 + [@vis.gl/react-google-maps](https://github.com/visgl/react-google-maps)
- 無資料庫：資料就是 repo 裡的 `data/*.json`，由排程腳本更新
- `lib/` 純函式（座標轉換、解析器、狀態判定）都有 vitest 測試；`scripts/` 是資料管線
