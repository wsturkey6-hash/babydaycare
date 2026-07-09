/**
 * 全面比對每間中心「政府內嵌座標」與「地址門牌地理編碼」的距離，
 * 找出地圖標示可能有誤的中心（一次性/維護用工具，不在週更排程內）。
 *
 * 用法：npx tsx scripts/verify-coords.ts [快取檔路徑]
 * - 地理編碼用 OSM Nominatim（免金鑰，限速 1 req/s，全部約 4 分鐘）
 * - 只信任解析到「門牌精度」的結果（result.address.house_number 存在），
 *   路段中心點精度容易誤判，不列入比較
 * - 結果快取到指定檔案，可中斷續跑
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { haversineKm } from "../lib/distance";
import { parseTwAddress } from "../lib/twaddr";
import type { Center } from "../lib/types";

const DATA_DIR = join(import.meta.dirname, "..", "data");
const CACHE_PATH = process.argv[2] ?? "/tmp/geocode-cache.json";
const UA = "babydaycare-coord-verify/1.0 (one-off data quality check)";
/** 超過這個距離（公里）列為可疑 */
const FLAG_KM = 0.15;

interface CacheEntry {
  lat: number | null;
  lng: number | null;
  precise: boolean; // 是否為門牌精度
  display?: string;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function geocode(
  street: string,
  number: string,
  city: string,
): Promise<CacheEntry> {
  const q = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    addressdetails: "1",
    countrycodes: "tw",
    street: `${number} ${street}`,
    city,
  });
  const res = await fetch(`https://nominatim.openstreetmap.org/search?${q}`, {
    headers: { "User-Agent": UA },
  });
  if (!res.ok) throw new Error(`Nominatim ${res.status}`);
  const results = (await res.json()) as {
    lat: string;
    lon: string;
    display_name: string;
    address?: { house_number?: string };
  }[];
  const r = results[0];
  if (!r) return { lat: null, lng: null, precise: false };
  return {
    lat: Number(r.lat),
    lng: Number(r.lon),
    precise: Boolean(r.address?.house_number),
    display: r.display_name.slice(0, 80),
  };
}

async function main() {
  const centers: Center[] = JSON.parse(
    readFileSync(join(DATA_DIR, "centers.json"), "utf8"),
  );
  const cache: Record<string, CacheEntry> = existsSync(CACHE_PATH)
    ? JSON.parse(readFileSync(CACHE_PATH, "utf8"))
    : {};

  const targets = centers.filter((c) => c.lat != null && c.lng != null);
  console.log(`共 ${targets.length} 間有座標，開始比對（快取 ${Object.keys(cache).length} 筆）`);

  let unparsed = 0;
  for (const c of targets) {
    if (cache[c.id]) continue;
    const parsed = parseTwAddress(c.address);
    if (!parsed) {
      cache[c.id] = { lat: null, lng: null, precise: false, display: "地址無法解析" };
      unparsed++;
      continue;
    }
    try {
      cache[c.id] = await geocode(parsed.street, parsed.number, parsed.city);
    } catch (err) {
      console.warn(`  ✗ ${c.name}: ${(err as Error).message}`);
    }
    writeFileSync(CACHE_PATH, JSON.stringify(cache));
    await sleep(1100);
  }

  // 報告
  const rows = targets
    .map((c) => {
      const g = cache[c.id];
      if (!g || g.lat == null) return null;
      const km = haversineKm(
        { lat: c.lat!, lng: c.lng! },
        { lat: g.lat, lng: g.lng! },
      );
      return { id: c.id, name: c.name, address: c.address, km, precise: g.precise, geo: g };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.km - a.km);

  const flagged = rows.filter((r) => r.precise && r.km > FLAG_KM);
  console.log(`\n=== 門牌精度且偏移 > ${FLAG_KM * 1000}m：${flagged.length} 筆 ===`);
  for (const r of flagged) {
    console.log(
      `${r.km.toFixed(3)}km ${r.id} ${r.name}\n  地址: ${r.address}\n  門牌定位: ${r.geo.lat},${r.geo.lng} (${r.geo.display})`,
    );
  }
  const streetOnly = rows.filter((r) => !r.precise && r.km > 1);
  console.log(`\n=== 僅路段精度但偏移 > 1km（供人工參考）：${streetOnly.length} 筆 ===`);
  for (const r of streetOnly)
    console.log(`${r.km.toFixed(2)}km ${r.id} ${r.name} ${r.address}`);

  const preciseCount = rows.filter((r) => r.precise).length;
  console.log(
    `\n統計：門牌精度 ${preciseCount}/${targets.length}、無法解析地址 ${unparsed} 筆、` +
      `門牌精度中位數偏移 ${median(rows.filter((r) => r.precise).map((r) => r.km)).toFixed(3)}km`,
  );
}

function median(xs: number[]): number {
  if (xs.length === 0) return NaN;
  const s = [...xs].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
