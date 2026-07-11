/**
 * 用 Apify 抓各中心 FB/IG 近期貼文，判定招生資訊 → data/posts.json（fb/ig 部分）
 *
 * 用法：APIFY_TOKEN=xxx npx tsx scripts/fetch-social.ts（或寫在 .env.local）
 * 只處理 centers.json 中已建檔 links.facebook / links.instagram 的中心。
 * 注意：Apify actor 的輸出欄位可能隨版本變動，首次執行請抽查 posts.json。
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { isRecruitingText } from "../lib/recruiting";
import { truncateByCodePoint } from "../lib/text";
import type { Center, Post } from "../lib/types";
import { runActor } from "./apify";
import { loadEnvLocal } from "./env";

const FB_ACTOR = "apify/facebook-posts-scraper";
const IG_ACTOR = "apify/instagram-scraper";
const POSTS_PER_PAGE = 5;
const KEEP_DAYS = 90;

const DATA_DIR = join(import.meta.dirname, "..", "data");

interface FbItem {
  text?: string;
  url?: string;
  time?: string;
  timestamp?: number;
  facebookUrl?: string;
  pageUrl?: string;
  inputUrl?: string;
}

interface IgItem {
  caption?: string;
  url?: string;
  timestamp?: string;
  ownerUsername?: string;
  inputUrl?: string;
}

function normalizeUrl(u: string): string {
  return u.toLowerCase().replace(/\/+$/, "").replace(/^https?:\/\/(www\.)?/, "");
}

function toIsoDate(v: string | number | undefined): string | null {
  if (v == null) return null;
  const d = typeof v === "number" ? new Date(v * 1000) : new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
}

function makePost(
  centerId: string,
  platform: Post["platform"],
  postUrl: string,
  date: string,
  text: string,
  today: string,
): Post {
  return {
    centerId,
    platform,
    postUrl,
    date,
    excerpt: truncateByCodePoint(text.replace(/\s+/g, " ").trim(), 120),
    isRecruiting: isRecruitingText(text),
    fetchedAt: today,
  };
}

async function main() {
  loadEnvLocal();
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    console.error(
      "缺少 APIFY_TOKEN。請到 https://console.apify.com/settings/integrations 取得，" +
        "寫入 .env.local（APIFY_TOKEN=...）或 GitHub Actions secret。",
    );
    process.exit(1);
  }

  const centers: Center[] = JSON.parse(
    readFileSync(join(DATA_DIR, "centers.json"), "utf8"),
  );
  const today = new Date().toISOString().slice(0, 10);
  const cutoff = new Date(Date.now() - KEEP_DAYS * 86400_000)
    .toISOString()
    .slice(0, 10);
  const posts: Post[] = [];

  // Facebook
  const fbCenters = centers.filter((c) => c.links?.facebook);
  if (fbCenters.length > 0) {
    console.log(`Facebook：${fbCenters.length} 個粉專`);
    const byUrl = new Map(
      fbCenters.map((c) => [normalizeUrl(c.links!.facebook!), c.id]),
    );
    const items = await runActor<FbItem>(
      token,
      FB_ACTOR,
      {
        startUrls: fbCenters.map((c) => ({ url: c.links!.facebook! })),
        resultsLimit: POSTS_PER_PAGE,
      },
      { timeoutMin: 40 },
    );
    for (const item of items) {
      const pageUrl = item.facebookUrl ?? item.pageUrl ?? item.inputUrl;
      const centerId = pageUrl ? byUrl.get(normalizeUrl(pageUrl)) : undefined;
      const date = toIsoDate(item.time ?? item.timestamp);
      if (!centerId || !item.url || !date || !item.text) continue;
      posts.push(makePost(centerId, "facebook", item.url, date, item.text, today));
    }
  }

  // Instagram
  const igCenters = centers.filter((c) => c.links?.instagram);
  if (igCenters.length > 0) {
    console.log(`Instagram：${igCenters.length} 個帳號`);
    const byUrl = new Map(
      igCenters.map((c) => [normalizeUrl(c.links!.instagram!), c.id]),
    );
    const items = await runActor<IgItem>(token, IG_ACTOR, {
      directUrls: igCenters.map((c) => c.links!.instagram!),
      resultsType: "posts",
      resultsLimit: POSTS_PER_PAGE,
    });
    for (const item of items) {
      const src =
        item.inputUrl ??
        (item.ownerUsername ? `instagram.com/${item.ownerUsername}` : undefined);
      const centerId = src ? byUrl.get(normalizeUrl(src)) : undefined;
      const date = toIsoDate(item.timestamp);
      if (!centerId || !item.url || !date || !item.caption) continue;
      posts.push(
        makePost(centerId, "instagram", item.url, date, item.caption, today),
      );
    }
  }

  const fresh = posts.filter((p) => p.date >= cutoff);

  // 保留其他平台（web）既有資料，只換掉 fb/ig
  const postsPath = join(DATA_DIR, "posts.json");
  const existing: Post[] = JSON.parse(readFileSync(postsPath, "utf8"));
  const kept = existing.filter((p) => p.platform === "web");
  const merged = [...kept, ...fresh].sort((a, b) => b.date.localeCompare(a.date));
  writeFileSync(postsPath, JSON.stringify(merged, null, 2) + "\n");

  const metaPath = join(DATA_DIR, "meta.json");
  const meta = JSON.parse(readFileSync(metaPath, "utf8"));
  meta.posts = { updatedAt: today };
  writeFileSync(metaPath, JSON.stringify(meta, null, 2) + "\n");

  console.log(
    `完成：FB/IG 共 ${fresh.length} 篇（${fresh.filter((p) => p.isRecruiting).length} 篇招生）→ data/posts.json`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
