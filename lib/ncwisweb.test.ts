import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import {
  parseCenterRows,
  parseMarkerCoords,
  parseTotalPages,
  parseCsrfToken,
} from "./ncwisweb";

const html = readFileSync(
  join(__dirname, "fixtures", "ncwisweb-result.html"),
  "utf8",
);

describe("parseCenterRows", () => {
  const rows = parseCenterRows(html);

  test("解析出整頁 15 筆", () => {
    expect(rows).toHaveLength(15);
  });

  test("第一筆欄位正確", () => {
    expect(rows[0]).toEqual({
      id: "CW10112279",
      name: "新竹市私立國際音樂托嬰中心北區民富校",
      address: "新竹市北區西雅里民富街256號1樓",
      phone: "(03)5221672",
      capacity: 21,
      quasiPublic: true,
      accreditation: { year: 2024, grade: "甲" },
    });
  });

  test("準公共化「否」解析為 false", () => {
    const jenner = rows.find((r) => r.name.includes("傑尼爾"));
    expect(jenner?.quasiPublic).toBe(false);
  });
});

describe("parseMarkerCoords", () => {
  const coords = parseMarkerCoords(html);

  test("地圖 script 內嵌全縣市所有中心的座標（不只當頁 15 筆）", () => {
    expect(Object.keys(coords)).toHaveLength(81);
    for (const row of parseCenterRows(html)) {
      expect(coords[row.id]).toBeDefined();
    }
  });

  test("以中心 id 對應 TWD97 座標", () => {
    expect(coords.CW10112279).toEqual({ x: 245698.34, y: 2744055.47 });
  });
});

describe("parseTotalPages", () => {
  test("讀出總頁數", () => {
    expect(parseTotalPages(html)).toBe(6);
  });
});

describe("parseCsrfToken", () => {
  test("讀出 CSRF token", () => {
    expect(parseCsrfToken(html)).toMatch(/^[0-9a-f-]{36}$/);
  });
});
