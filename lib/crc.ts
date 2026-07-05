/**
 * CRC 兒童權利公約資訊網「違反兒少法」裁罰公告 (crc.sfaa.gov.tw) 的 HTML 解析。
 * 列表為 GET 查詢參數、伺服器端渲染；需帶 AspxAutoDetectCookieSupport cookie。
 */
import * as cheerio from "cheerio";

export interface SanctionRow {
  /** 裁罰對象原文（機構案件通常是「機構名 負責人」） */
  subject: string;
  county: string;
  law: string;
  lawSummary: string;
  /** ISO 日期 */
  date: string;
  detailPath: string;
}

export interface SanctionDetail {
  date: string;
  county: string;
  targetType: string;
  targetName: string;
  owner?: string;
  basis?: string;
  law: string;
  lawSummary: string;
  facts?: string;
}

function isoDate(s: string): string {
  return s.trim().replaceAll(".", "-");
}

function clean(s: string): string {
  return s.replace(/\s+/g, " ").trim();
}

/** 「違反第83條第1款規定<br>虐待或妨害兒少身心健康」→ [law, lawSummary] */
function splitLaw(cellText: string): { law: string; lawSummary: string } {
  const parts = clean(cellText).split(/(?<=規定)\s*/);
  return { law: clean(parts[0] ?? ""), lawSummary: clean(parts.slice(1).join(" ")) };
}

export function parseSanctionRows(html: string): SanctionRow[] {
  const $ = cheerio.load(html);
  const rows: SanctionRow[] = [];

  $('div.tr[role="row"]').each((_, tr) => {
    const cell = (th: string) =>
      $(tr).find(`[role="cell"][data-th="${th}"]`).first();
    const detailPath = cell("詳情").find("a").attr("href");
    if (!detailPath) return; // 表頭列或非資料列

    const { law, lawSummary } = splitLaw(cell("違法條文").text());
    rows.push({
      subject: clean(cell("裁罰對象").text()),
      county: clean(cell("縣市名稱").text()),
      law,
      lawSummary,
      date: isoDate(clean(cell("裁罰日期").text())),
      detailPath,
    });
  });

  return rows;
}

export function parseSanctionTotalPages(html: string): number {
  const text = html.replace(/<[^>]+>/g, " ");
  const m = text.match(/第\s*\d+\s*頁[^共]*共\s*(\d+)\s*頁/);
  return m ? Number(m[1]) : 0;
}

export function parseSanctionDetail(html: string): SanctionDetail {
  const $ = cheerio.load(html);
  const fields = new Map<string, cheerio.Cheerio<never>>();
  $(".formTable .tr").each((_, tr) => {
    const key = clean($(tr).find('[role="columnheader"]').text());
    fields.set(key, $(tr).find('[role="cell"]') as never);
  });

  const get = (key: string) => {
    const cell = fields.get(key);
    return cell ? clean($(cell).text()) : "";
  };

  // 裁罰對象格內含「<類型><br>名稱」與「負責人<br>姓名」兩欄
  const targetCell = fields.get("裁罰對象");
  let targetType = "";
  let targetName = "";
  let owner: string | undefined;
  if (targetCell) {
    $(targetCell)
      .find("span.col")
      .each((_, col) => {
        const title = clean($(col).find(".detailTitle").text());
        const value = clean(
          $(col).text().replace($(col).find(".detailTitle").text(), ""),
        );
        if (title === "負責人") owner = value;
        else {
          targetType = title;
          targetName = value;
        }
      });
  }

  const { law, lawSummary } = splitLaw(get("違法條文"));

  return {
    date: isoDate(get("裁罰日期")),
    county: get("縣市名稱"),
    targetType,
    targetName,
    owner,
    basis: get("裁罰依據") || undefined,
    law,
    lawSummary,
    facts: get("事實摘要") || undefined,
  };
}
