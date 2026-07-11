/**
 * 把 Facebook 網址正規化為粉專首頁。
 * 搜尋結果常是某篇貼文/相片的網址，收錄連結時應存粉專首頁；
 * reel/watch/share/groups 等推導不出所屬粉專，回傳 null。
 */

/** 第一段路徑是這些時，網址不指向粉專 */
const NON_PAGE_SEGMENTS = new Set([
  "watch",
  "reel",
  "reels",
  "share",
  "groups",
  "events",
  "hashtag",
  "marketplace",
  "stories",
  "story.php",
  "photo",
  "photo.php",
  "video.php",
  "permalink.php",
  "media",
  "login",
  "help",
  "policies",
  "gaming",
  "live",
]);

export function normalizeFbPageUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  if (!/(^|\.)facebook\.com$/i.test(url.hostname)) return null;

  const segs = url.pathname.split("/").filter(Boolean);
  if (segs.length === 0) return null;
  const first = segs[0].toLowerCase();

  if (first === "profile.php") {
    const id = url.searchParams.get("id");
    return id ? `https://www.facebook.com/profile.php?id=${id}` : null;
  }
  // 新版頁面網址 /p/<slug>-<id>/
  if (first === "p") {
    return segs[1] ? `https://www.facebook.com/p/${segs[1]}/` : null;
  }
  if (first === "people") {
    return segs[2]
      ? `https://www.facebook.com/people/${segs[1]}/${segs[2]}/`
      : null;
  }
  // 舊版 /pg/<page>/... 格式
  if (first === "pg") {
    return segs[1] && !NON_PAGE_SEGMENTS.has(segs[1].toLowerCase())
      ? `https://www.facebook.com/${segs[1]}/`
      : null;
  }
  if (NON_PAGE_SEGMENTS.has(first)) return null;

  return `https://www.facebook.com/${segs[0]}/`;
}
