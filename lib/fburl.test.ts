import { describe, expect, test } from "vitest";
import { normalizeFbPageUrl } from "./fburl";

describe("normalizeFbPageUrl", () => {
  test("粉專首頁維持不變（統一補尾斜線）", () => {
    expect(normalizeFbPageUrl("https://www.facebook.com/small.garden.baby/")).toBe(
      "https://www.facebook.com/small.garden.baby/",
    );
    expect(normalizeFbPageUrl("https://www.facebook.com/ZhuBeiQiaoR")).toBe(
      "https://www.facebook.com/ZhuBeiQiaoR/",
    );
  });

  test("貼文網址 → 粉專首頁", () => {
    expect(
      normalizeFbPageUrl("https://www.facebook.com/small.garden.baby/posts/pfbid028Zd2"),
    ).toBe("https://www.facebook.com/small.garden.baby/");
  });

  test("相片/影片網址 → 粉專首頁", () => {
    expect(
      normalizeFbPageUrl("https://www.facebook.com/PageName/photos/a.123/456/"),
    ).toBe("https://www.facebook.com/PageName/");
    expect(normalizeFbPageUrl("https://www.facebook.com/PageName/videos/9")).toBe(
      "https://www.facebook.com/PageName/",
    );
  });

  test("新版 /p/ 頁面網址保留", () => {
    expect(
      normalizeFbPageUrl("https://www.facebook.com/p/%E5%8D%A1%E7%88%BE-100068620760989/"),
    ).toBe("https://www.facebook.com/p/%E5%8D%A1%E7%88%BE-100068620760989/");
  });

  test("profile.php 只留 id 參數", () => {
    expect(
      normalizeFbPageUrl("https://www.facebook.com/profile.php?id=615512345&locale=zh_TW"),
    ).toBe("https://www.facebook.com/profile.php?id=615512345");
  });

  test("reel/watch/share/groups 推導不出粉專 → null", () => {
    expect(normalizeFbPageUrl("https://www.facebook.com/reel/1035558755639436/")).toBeNull();
    expect(normalizeFbPageUrl("https://www.facebook.com/watch/?v=123")).toBeNull();
    expect(normalizeFbPageUrl("https://www.facebook.com/share/p/abc/")).toBeNull();
    expect(normalizeFbPageUrl("https://www.facebook.com/groups/12345/")).toBeNull();
  });

  test("查詢參數與行動版網域被正規化", () => {
    expect(normalizeFbPageUrl("https://m.facebook.com/PageName?locale=zh_TW")).toBe(
      "https://www.facebook.com/PageName/",
    );
  });

  test("非 facebook 網址 → null", () => {
    expect(normalizeFbPageUrl("https://www.instagram.com/abc/")).toBeNull();
  });
});
