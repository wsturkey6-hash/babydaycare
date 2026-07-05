import type { Center } from "./types";

/** 去除空白（含全形）方便名稱比對 */
function normalize(s: string): string {
  return s.replace(/[\s　]+/g, "");
}

/**
 * 以名稱把裁罰對象比對回托嬰中心 id；比對不到（行為人個人、已歇業機構）回傳 null。
 * 裁罰對象可能是「機構名 負責人姓名」，因此用「包含」比對。
 */
export function matchCenterId(subject: string, centers: Center[]): string | null {
  const s = normalize(subject);
  let best: { id: string; len: number } | null = null;
  for (const center of centers) {
    const name = normalize(center.name);
    // 同品牌可能有本館/分館（例如 ○○托嬰中心、○○托嬰中心六家館），取最長命中避免誤配
    if (s.includes(name) && (!best || name.length > best.len)) {
      best = { id: center.id, len: name.length };
    }
  }
  return best?.id ?? null;
}
