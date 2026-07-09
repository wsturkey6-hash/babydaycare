/**
 * 從衛福部托育媒合平臺同步新竹市/新竹縣托嬰中心名單 → data/centers.json
 *
 * 用法：npx tsx scripts/sync-centers.ts
 * 不需要任何 API key；座標由查詢頁內嵌的 TWD97 座標轉換而來。
 * 既有資料中的 links（FB/IG/官網）以中心 id 為鍵保留。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseCenterRows,
  parseCsrfToken,
  parseMarkerCoords,
  parseTotalPages,
} from "../lib/ncwisweb";
import { twd97ToWgs84 } from "../lib/twd97";
import type { Center, CenterType } from "../lib/types";

const BASE = "https://ncwisweb.sfaa.gov.tw";
const SEARCH_PATH = "/home/childcare-center";
const UA = "babydaycare-sync/1.0 (personal childcare map; weekly)";

const CITIES: { county: Center["county"]; cityId: string }[] = [
  { county: "新竹市", cityId: "4bc1e2f27af6e832017af6eeff480161" },
  { county: "新竹縣", cityId: "4bc1e2f27af6e832017af6eeff890177" },
];

const DATA_DIR = join(import.meta.dirname, "..", "data");

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Session {
  cookie: string;
  csrf: string;
}

async function openSession(): Promise<Session> {
  const res = await fetch(BASE + SEARCH_PATH, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`GET ${SEARCH_PATH} → ${res.status}`);
  const cookie = res.headers
    .getSetCookie()
    .map((c) => c.split(";")[0])
    .join("; ");
  const csrf = parseCsrfToken(await res.text());
  if (!cookie || !csrf) throw new Error("拿不到 session cookie 或 CSRF token");
  return { cookie, csrf };
}

async function searchPage(
  session: Session,
  cityId: string,
  page: number,
): Promise<string> {
  const body = new URLSearchParams({
    _csrf: session.csrf,
    locateType: "1",
    cityId,
    townId: "",
    address: "",
    latitude: "",
    longitude: "",
    distance: "1.0",
    organ2type: "",
    "conditions[keytext]": "",
    publicFlag: "",
    gradeFlag: "",
    page: String(page),
  });
  const res = await fetch(BASE + SEARCH_PATH, {
    method: "POST",
    headers: {
      "User-Agent": UA,
      "Content-Type": "application/x-www-form-urlencoded",
      Cookie: session.cookie,
      Referer: BASE + SEARCH_PATH,
    },
    body,
  });
  if (!res.ok) throw new Error(`POST ${SEARCH_PATH} page=${page} → ${res.status}`);
  return res.text();
}

function deriveType(name: string): CenterType {
  if (name.includes("公設民營")) return "公設民營";
  if (name.includes("托育家園")) return "社區公共托育家園";
  if (name.includes("職場互助")) return "職場互助";
  if (name.includes("私立")) return "私立";
  return "其他";
}

function deriveDistrict(address: string, county: string): string {
  const rest = address.startsWith(county)
    ? address.slice(county.length)
    : address;
  const m = rest.match(/^(.{1,3}?[區市鎮鄉])/);
  return m ? m[1] : "";
}

/** 讀取手動座標覆寫（政府內嵌座標對少數中心不準時用）；忽略 _comment 等底線開頭鍵 */
function loadCoordOverrides(): Map<string, { lat: number; lng: number }> {
  const raw: Record<string, { lat: number; lng: number }> = JSON.parse(
    readFileSync(join(DATA_DIR, "coord-overrides.json"), "utf8"),
  );
  return new Map(
    Object.entries(raw)
      .filter(([id]) => !id.startsWith("_"))
      .map(([id, v]) => [id, { lat: v.lat, lng: v.lng }]),
  );
}

async function main() {
  const centersPath = join(DATA_DIR, "centers.json");
  const existing: Center[] = JSON.parse(readFileSync(centersPath, "utf8"));
  const existingLinks = new Map(
    existing
      .filter((c) => c.links && Object.keys(c.links).length > 0)
      .map((c) => [c.id, c.links]),
  );
  const coordOverrides = loadCoordOverrides();

  const session = await openSession();
  const centers: Center[] = [];

  for (const { county, cityId } of CITIES) {
    const first = await searchPage(session, cityId, 0);
    const totalPages = parseTotalPages(first);
    const coords = parseMarkerCoords(first); // 地圖內嵌全縣市座標
    let rows = parseCenterRows(first);

    for (let p = 1; p < totalPages; p++) {
      await sleep(800);
      rows = rows.concat(parseCenterRows(await searchPage(session, cityId, p)));
    }

    console.log(`${county}: ${rows.length} 筆（${totalPages} 頁、${Object.keys(coords).length} 個座標）`);

    for (const row of rows) {
      const xy = coords[row.id];
      let latlng = xy ? twd97ToWgs84(xy.x, xy.y) : undefined;
      // 政府端偶有錯誤座標（曾出現 lat=0）；超出新竹合理範圍就視為無座標
      if (
        latlng &&
        !(latlng.lat > 24.35 && latlng.lat < 25.05 && latlng.lng > 120.65 && latlng.lng < 121.45)
      ) {
        console.warn(`⚠ ${row.name} 座標超界 (${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)})，略過座標`);
        latlng = undefined;
      }
      // 手動座標覆寫優先（政府座標對某些門牌不準）
      const override = coordOverrides.get(row.id);
      if (override) latlng = override;
      centers.push({
        id: row.id,
        name: row.name,
        type: deriveType(row.name),
        county,
        district: deriveDistrict(row.address, county),
        address: row.address,
        phone: row.phone,
        capacity: row.capacity,
        quasiPublic: row.quasiPublic,
        accreditation: row.accreditation,
        lat: latlng ? Number(latlng.lat.toFixed(6)) : undefined,
        lng: latlng ? Number(latlng.lng.toFixed(6)) : undefined,
        links: existingLinks.get(row.id) ?? {},
      });
    }
    await sleep(800);
  }

  // 同名去重檢查（跨頁重複代表分頁參數出錯）
  const ids = new Set(centers.map((c) => c.id));
  if (ids.size !== centers.length) {
    throw new Error(`發現重複 id：共 ${centers.length} 筆、去重後 ${ids.size} 筆`);
  }

  const missingCoords = centers.filter((c) => c.lat == null);
  if (missingCoords.length > 0) {
    console.warn(
      `⚠ ${missingCoords.length} 筆沒有座標：${missingCoords.map((c) => c.name).join("、")}`,
    );
  }

  centers.sort((a, b) =>
    a.county === b.county
      ? a.name.localeCompare(b.name, "zh-Hant")
      : a.county.localeCompare(b.county, "zh-Hant"),
  );

  writeFileSync(centersPath, JSON.stringify(centers, null, 2) + "\n");

  const metaPath = join(DATA_DIR, "meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.centers = { updatedAt: new Date().toISOString().slice(0, 10) };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

  console.log(`完成：共 ${centers.length} 筆 → data/centers.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
