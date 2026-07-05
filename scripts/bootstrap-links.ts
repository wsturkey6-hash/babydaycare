/**
 * 半自動建檔各中心的 FB/IG/官網連結（一次性 bootstrap）。
 *
 * 第一步（需要 APIFY_TOKEN）：
 *   npx tsx scripts/bootstrap-links.ts
 *   → 用 Apify Google Search Scraper 搜尋「中心名 facebook」，
 *     把候選連結寫到 data/links-candidates.json（不會動 centers.json）。
 *
 * 第二步（人工確認）：
 *   打開 data/links-candidates.json，刪掉錯的、補上對的，
 *   把 confirmed 改成 true。
 *
 * 第三步：
 *   npx tsx scripts/bootstrap-links.ts --apply
 *   → 把 confirmed: true 的候選合併進 centers.json 的 links。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Center } from "../lib/types";
import { runActor } from "./apify";
import { loadEnvLocal } from "./env";

const SEARCH_ACTOR = "apify/google-search-scraper";
const DATA_DIR = join(import.meta.dirname, "..", "data");
const CANDIDATES_PATH = join(DATA_DIR, "links-candidates.json");

interface Candidate {
  centerId: string;
  name: string;
  facebook?: string;
  instagram?: string;
  website?: string;
  confirmed: boolean;
}

interface SearchItem {
  searchQuery?: { term?: string };
  organicResults?: { url: string; title: string }[];
}

function apply() {
  const centersPath = join(DATA_DIR, "centers.json");
  const centers: Center[] = JSON.parse(readFileSync(centersPath, "utf8"));
  const candidates: Candidate[] = JSON.parse(
    readFileSync(CANDIDATES_PATH, "utf8"),
  );
  let applied = 0;
  for (const cand of candidates.filter((c) => c.confirmed)) {
    const center = centers.find((c) => c.id === cand.centerId);
    if (!center) continue;
    center.links = {
      ...center.links,
      ...(cand.facebook && { facebook: cand.facebook }),
      ...(cand.instagram && { instagram: cand.instagram }),
      ...(cand.website && { website: cand.website }),
    };
    applied++;
  }
  writeFileSync(centersPath, JSON.stringify(centers, null, 2) + "\n");
  console.log(`已合併 ${applied} 筆確認過的連結 → data/centers.json`);
}

async function search() {
  loadEnvLocal();
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.error("缺少 APIFY_TOKEN（.env.local 或環境變數）。");
    process.exit(1);
  }

  const centers: Center[] = JSON.parse(
    readFileSync(join(DATA_DIR, "centers.json"), "utf8"),
  );
  // 已有連結或已在候選檔中的不重查
  const existing: Candidate[] = existsSync(CANDIDATES_PATH)
    ? JSON.parse(readFileSync(CANDIDATES_PATH, "utf8"))
    : [];
  const done = new Set(existing.map((c) => c.centerId));
  const targets = centers.filter(
    (c) => !done.has(c.id) && !c.links?.facebook && !c.links?.instagram,
  );
  console.log(`要搜尋 ${targets.length} 間中心的社群連結…`);

  const queries = targets.map((c) => `${c.name} facebook`).join("\n");
  const items = await runActor<SearchItem>(token, SEARCH_ACTOR, {
    queries,
    resultsPerPage: 5,
    maxPagesPerQuery: 1,
    languageCode: "zh-TW",
    countryCode: "tw",
  });

  const candidates: Candidate[] = [...existing];
  for (const item of items) {
    const term = item.searchQuery?.term ?? "";
    const center = targets.find((c) => term.startsWith(c.name));
    if (!center) continue;
    const results = item.organicResults ?? [];
    const fb = results.find((r) => /facebook\.com\/(?!share|groups)/.test(r.url));
    const ig = results.find((r) => /instagram\.com\//.test(r.url));
    candidates.push({
      centerId: center.id,
      name: center.name,
      facebook: fb?.url,
      instagram: ig?.url,
      confirmed: false,
    });
  }

  writeFileSync(CANDIDATES_PATH, JSON.stringify(candidates, null, 2) + "\n");
  console.log(
    `候選連結已寫入 data/links-candidates.json（${candidates.length} 筆）。` +
      "請人工確認後把 confirmed 改為 true，再執行 --apply。",
  );
}

if (process.argv.includes("--apply")) {
  apply();
} else {
  search().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
