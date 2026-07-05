import { describe, expect, test } from "vitest";
import type { Center, Penalty, Post } from "./types";
import { getCenterStatus, RECRUITING_WINDOW_DAYS } from "./status";

const center: Center = {
  id: "c1",
  name: "測試托嬰中心",
  type: "私立",
  county: "新竹市",
  district: "東區",
  address: "新竹市東區測試路1號",
};

const NOW = new Date("2026-07-05T00:00:00+08:00");

function post(overrides: Partial<Post>): Post {
  return {
    centerId: "c1",
    platform: "facebook",
    postUrl: "https://facebook.com/p/1",
    date: "2026-07-01",
    excerpt: "7月招生中",
    isRecruiting: true,
    fetchedAt: "2026-07-04",
    ...overrides,
  };
}

function penalty(overrides: Partial<Penalty>): Penalty {
  return {
    centerId: "c1",
    centerName: "測試托嬰中心",
    date: "2025-03-01",
    violation: "違反兒少法",
    sourceUrl: "https://example.gov.tw/1",
    ...overrides,
  };
}

describe("getCenterStatus", () => {
  test("近期招生貼文 → recruiting=true 並帶最新一篇", () => {
    const posts = [
      post({ date: "2026-06-01", postUrl: "https://facebook.com/p/old" }),
      post({ date: "2026-07-01", postUrl: "https://facebook.com/p/new" }),
    ];
    const s = getCenterStatus(center, [], posts, NOW);
    expect(s.recruiting).toBe(true);
    expect(s.latestRecruitingPost?.postUrl).toBe("https://facebook.com/p/new");
  });

  test("招生貼文超過時效窗 → recruiting=false", () => {
    const stale = post({ date: "2026-01-01" });
    const s = getCenterStatus(center, [], [stale], NOW);
    expect(s.recruiting).toBe(false);
  });

  test("非招生貼文不算招生", () => {
    const p = post({ isRecruiting: false, date: "2026-07-01" });
    const s = getCenterStatus(center, [], [p], NOW);
    expect(s.recruiting).toBe(false);
  });

  test("別的中心的貼文不算", () => {
    const p = post({ centerId: "c2", date: "2026-07-01" });
    const s = getCenterStatus(center, [], [p], NOW);
    expect(s.recruiting).toBe(false);
  });

  test("有掛上 centerId 的裁罰 → hasPenalty=true，依日期新到舊排序", () => {
    const s = getCenterStatus(
      center,
      [penalty({ date: "2024-01-01" }), penalty({ date: "2025-03-01" })],
      [],
      NOW,
    );
    expect(s.hasPenalty).toBe(true);
    expect(s.penalties.map((p) => p.date)).toEqual(["2025-03-01", "2024-01-01"]);
  });

  test("無裁罰無貼文 → 皆為 false", () => {
    const s = getCenterStatus(center, [penalty({ centerId: "c2" })], [], NOW);
    expect(s.hasPenalty).toBe(false);
    expect(s.recruiting).toBe(false);
    expect(s.penalties).toEqual([]);
  });

  test("時效窗為 60 天", () => {
    expect(RECRUITING_WINDOW_DAYS).toBe(60);
  });
});
