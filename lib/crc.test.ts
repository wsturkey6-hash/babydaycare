import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  parseSanctionDetail,
  parseSanctionRows,
  parseSanctionTotalPages,
} from "./crc";

const listHtml = readFileSync(
  join(__dirname, "fixtures", "crc-sanction-list.html"),
  "utf8",
);
const detailHtml = readFileSync(
  join(__dirname, "fixtures", "crc-sanction-detail.html"),
  "utf8",
);

describe("parseSanctionRows", () => {
  const rows = parseSanctionRows(listHtml);

  test("解析出列表所有裁罰案件", () => {
    expect(rows.length).toBe(30);
  });

  test("托嬰中心案件欄位正確", () => {
    const row = rows.find((r) => r.subject.includes("愛格樂"));
    expect(row).toEqual({
      subject: "新竹市私立愛格樂國際音樂托嬰中心慈雲校 徐鳳吟",
      county: "新竹市",
      law: "違反第83條第1款規定",
      lawSummary: "虐待或妨害兒少身心健康",
      date: "2025-04-01",
      detailPath: expect.stringMatching(/^\/ChildYoungLaw\/Detail\/\d+$/),
    });
  });
});

describe("parseSanctionTotalPages", () => {
  test("讀出總頁數", () => {
    expect(parseSanctionTotalPages(listHtml)).toBe(3);
  });
});

describe("parseSanctionDetail", () => {
  test("解析詳情頁欄位", () => {
    expect(parseSanctionDetail(detailHtml)).toEqual({
      date: "2025-04-01",
      county: "新竹市",
      targetType: "兒童及少年福利機構",
      targetName: "新竹市私立愛格樂國際音樂托嬰中心慈雲校",
      owner: "徐鳳吟",
      basis: "兒童及少年福利與權益保障法第107條第1項",
      law: "違反第83條第1款規定",
      lawSummary: "虐待或妨害兒少身心健康",
      facts: "受處分人規劃之照顧模式已有妨礙幼兒身心健康之情事",
    });
  });
});
