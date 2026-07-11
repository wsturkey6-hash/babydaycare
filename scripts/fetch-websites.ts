/**
 * 掃描各中心官網是否有招生字樣 → data/posts.json（web 部分）
 *
 * 用法：npx tsx scripts/fetch-websites.ts（不需要 API key）
 * 只處理 centers.json 中已建檔 links.website 的中心。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import * as cheerio from "cheerio";
import { isRecruitingText, RECRUITING_KEYWORDS } from "../lib/recruiting";
import { stripLoneSurrogates } from "../lib/text";
import type { Center, Post } from "../lib/types";

const UA = "babydaycare-sync/1.0 (personal childcare map; weekly)";
const DATA_DIR = join(import.meta.dirname, "..", "data");
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** 取關鍵字前後文，讓卡片摘要看得出脈絡 */
function excerptAround(text: string, re: RegExp): string {
  const m = re.exec(text);
  if (!m) return stripLoneSurrogates(text.slice(0, 120));
  const start = Math.max(0, m.index - 30);
  return stripLoneSurrogates(text.slice(start, start + 120).trim());
}

async function main() {
  const centers: Center[] = JSON.parse(
    readFileSync(join(DATA_DIR, "centers.json"), "utf8"),
  );
  const today = new Date().toISOString().slice(0, 10);
  const webCenters = centers.filter((c) => c.links?.website);
  console.log(`官網掃描：${webCenters.length} 個網站`);

  const posts: Post[] = [];
  for (const center of webCenters) {
    const url = center.links!.website!;
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(15_000),
        redirect: "follow",
      });
      if (!res.ok) {
        console.warn(`  ✗ ${center.name} ${url} → ${res.status}`);
        continue;
      }
      const $ = cheerio.load(await res.text());
      $("script, style, noscript").remove();
      const text = $("body").text().replace(/\s+/g, " ").trim();
      if (isRecruitingText(text)) {
        posts.push({
          centerId: center.id,
          platform: "web",
          postUrl: url,
          date: today, // 官網頁面沒有貼文日期，以掃描日為準
          excerpt: excerptAround(text, new RegExp(RECRUITING_KEYWORDS.source)),
          isRecruiting: true,
          fetchedAt: today,
        });
        console.log(`  ✓ ${center.name} 有招生字樣`);
      }
    } catch (err) {
      console.warn(`  ✗ ${center.name} ${url} → ${(err as Error).message}`);
    }
    await sleep(500);
  }

  const postsPath = join(DATA_DIR, "posts.json");
  const existing: Post[] = JSON.parse(readFileSync(postsPath, "utf8"));
  const kept = existing.filter((p) => p.platform !== "web");
  const merged = [...kept, ...posts].sort((a, b) => b.date.localeCompare(a.date));
  writeFileSync(postsPath, JSON.stringify(merged, null, 2) + "\n");

  const metaPath = join(DATA_DIR, "meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.posts = { updatedAt: today };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

  console.log(`完成：官網 ${posts.length} 筆招生 → data/posts.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
