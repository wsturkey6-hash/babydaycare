/**
 * 從 CRC 兒童權利公約資訊網「違反兒少法」專區抓新竹市/縣的托嬰中心裁罰 → data/penalties.json
 *
 * 用法：npx tsx scripts/fetch-penalties.ts
 * 篩選規則：裁罰對象含「托嬰」或「托育家園」，或名稱可比對回現有中心名單。
 * 限制：行為人（個人）案件若未寫出機構名稱，無法對應回中心，不會收錄。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  parseSanctionDetail,
  parseSanctionRows,
  parseSanctionTotalPages,
  type SanctionRow,
} from "../lib/crc";
import { matchCenterId } from "../lib/match";
import type { Center, Penalty } from "../lib/types";

const BASE = "https://crc.sfaa.gov.tw";
const UA = "babydaycare-sync/1.0 (personal childcare map; weekly)";
// crc.sfaa.gov.tw 是 ASP.NET 站台，沒帶這個 cookie 會進入偵測重導迴圈
const COOKIE = "AspxAutoDetectCookieSupport=1";

const CITIES = [
  { county: "新竹市", cityId: "21" },
  { county: "新竹縣", cityId: "6" },
];

const DATA_DIR = join(import.meta.dirname, "..", "data");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function get(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    headers: { "User-Agent": UA, Cookie: COOKIE },
  });
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}`);
  return res.text();
}

function listPath(cityId: string, page: number): string {
  const q = new URLSearchParams({
    page: String(page),
    pagesize: "30",
    name: "",
    target: "all",
    city: cityId,
    startDate: "",
    endDate: "",
    dosearch: "true",
  });
  return `/ChildYoungLaw/Sanction?${q}`;
}

function isDaycareRelated(row: SanctionRow, centers: Center[]): boolean {
  return (
    row.subject.includes("托嬰") ||
    row.subject.includes("托育家園") ||
    matchCenterId(row.subject, centers) !== null
  );
}

async function main() {
  const centers: Center[] = JSON.parse(
    readFileSync(join(DATA_DIR, "centers.json"), "utf8"),
  );

  const rows: SanctionRow[] = [];
  for (const { county, cityId } of CITIES) {
    const first = await get(listPath(cityId, 1));
    const totalPages = parseSanctionTotalPages(first);
    let cityRows = parseSanctionRows(first);
    for (let p = 2; p <= totalPages; p++) {
      await sleep(800);
      cityRows = cityRows.concat(parseSanctionRows(await get(listPath(cityId, p))));
    }
    console.log(`${county}: 全部裁罰 ${cityRows.length} 筆（${totalPages} 頁）`);
    rows.push(...cityRows);
  }

  const related = rows.filter((r) => isDaycareRelated(r, centers));
  console.log(`與托嬰相關: ${related.length} 筆，抓取詳情…`);

  const penalties: Penalty[] = [];
  for (const row of related) {
    await sleep(800);
    const detail = parseSanctionDetail(await get(row.detailPath));
    const name = detail.targetName || row.subject;
    const violation = [detail.lawSummary || row.lawSummary, detail.facts]
      .filter(Boolean)
      .join("：");
    penalties.push({
      centerId: matchCenterId(row.subject, centers),
      centerName: name,
      date: detail.date || row.date,
      violation,
      law: detail.basis ?? detail.law,
      sourceUrl: BASE + row.detailPath,
    });
    console.log(`  ${detail.date} ${name}`);
  }

  penalties.sort((a, b) => b.date.localeCompare(a.date));
  writeFileSync(
    join(DATA_DIR, "penalties.json"),
    JSON.stringify(penalties, null, 2) + "\n",
  );

  const metaPath = join(DATA_DIR, "meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.penalties = { updatedAt: new Date().toISOString().slice(0, 10) };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

  const matched = penalties.filter((p) => p.centerId).length;
  console.log(
    `完成：${penalties.length} 筆（${matched} 筆對應到現有中心）→ data/penalties.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
