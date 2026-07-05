/**
 * 衛福部托育媒合平臺 (ncwisweb.sfaa.gov.tw) 托嬰中心查詢頁的 HTML 解析。
 * 查詢是 POST 表單、結果為伺服器端渲染；座標以 TWD97 內嵌於地圖初始化 script。
 */
import * as cheerio from "cheerio";

export interface RawCenterRow {
  id: string;
  name: string;
  address: string;
  phone?: string;
  capacity?: number;
  quasiPublic: boolean;
  accreditation?: { year: number; grade: string };
}

const ROC_YEAR_OFFSET = 1911;

export function parseCenterRows(html: string): RawCenterRow[] {
  const $ = cheerio.load(html);
  const rows: RawCenterRow[] = [];

  $("#List1 tbody tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 7) return;

    const link = $(tds[0]).find("a");
    const id = (link.attr("href") ?? "").split("/").pop() ?? "";
    if (!id) return;

    const name = link.text().trim();
    // 去掉開頭郵遞區號，例如 "300新竹市…" → "新竹市…"
    const address = $(tds[1]).text().trim().replace(/^\d+/, "");
    const phone = $(tds[2]).text().trim() || undefined;
    const capacityText = $(tds[3]).text().trim();
    const capacity = capacityText ? Number(capacityText) : undefined;
    const quasiPublic = $(tds[4]).text().trim() === "是";
    const rocYear = Number($(tds[5]).text().trim());
    const grade = $(tds[6]).text().trim().replace(/等$/, "");

    rows.push({
      id,
      name,
      address,
      phone,
      capacity: Number.isFinite(capacity) ? capacity : undefined,
      quasiPublic,
      accreditation:
        rocYear && grade && grade !== "尚未評鑑"
          ? { year: rocYear + ROC_YEAR_OFFSET, grade }
          : undefined,
    });
  });

  return rows;
}

/** 從地圖 initMarkers() script 取出各中心的 TWD97 座標，key 為中心 id */
export function parseMarkerCoords(
  html: string,
): Record<string, { x: number; y: number }> {
  const coords: Record<string, { x: number; y: number }> = {};
  const blockRe =
    /var x = '([\d.]*)';\s*var y = '([\d.]*)';[\s\S]*?childcare-center\/detail\/(\w+)/g;
  for (const m of html.matchAll(blockRe)) {
    const [, x, y, id] = m;
    if (x && y) coords[id] = { x: Number(x), y: Number(y) };
  }
  return coords;
}

export function parseTotalPages(html: string): number {
  const m = html.match(/id="totalPage"[^>]*>(\d+)</);
  return m ? Number(m[1]) : 0;
}

export function parseCsrfToken(html: string): string {
  const m = html.match(/name="_csrf" value="([^"]+)"/);
  return m ? m[1] : "";
}
