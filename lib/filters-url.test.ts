import { describe, expect, test } from "vitest";
import {
  DEFAULT_FILTERS,
  parseAppState,
  serializeAppState,
} from "./filters-url";

describe("parseAppState", () => {
  test("空字串回傳預設值", () => {
    expect(parseAppState("")).toEqual({
      filters: DEFAULT_FILTERS,
      selectedId: null,
    });
  });

  test("完整參數", () => {
    const s = parseAppState("?c=新竹縣&d=竹北市&r=1&np=1&q=1&id=CW10806007");
    expect(s.filters).toEqual({
      county: "新竹縣",
      district: "竹北市",
      recruiting: true,
      noPenalty: true,
      quasiPublic: true,
    });
    expect(s.selectedId).toBe("CW10806007");
  });

  test("無效縣市回退為全部（且忽略鄉鎮）", () => {
    const s = parseAppState("?c=台北市&d=大安區");
    expect(s.filters.county).toBe("全部");
    expect(s.filters.district).toBe("全部");
  });

  test("沒選縣市時鄉鎮參數無效", () => {
    expect(parseAppState("?d=竹北市").filters.district).toBe("全部");
  });
});

describe("serializeAppState", () => {
  test("預設值序列化為空字串", () => {
    expect(serializeAppState(DEFAULT_FILTERS, null)).toBe("");
  });

  test("只輸出非預設值", () => {
    expect(
      serializeAppState({ ...DEFAULT_FILTERS, county: "新竹市", recruiting: true }, null),
    ).toBe("c=%E6%96%B0%E7%AB%B9%E5%B8%82&r=1");
  });

  test("round-trip 保持一致", () => {
    const filters = {
      county: "新竹縣" as const,
      district: "竹東鎮",
      recruiting: true,
      noPenalty: false,
      quasiPublic: true,
    };
    const qs = serializeAppState(filters, "CW10308008");
    const back = parseAppState(`?${qs}`);
    expect(back.filters).toEqual(filters);
    expect(back.selectedId).toBe("CW10308008");
  });
});
