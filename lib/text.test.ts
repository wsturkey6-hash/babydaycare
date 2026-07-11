import { describe, expect, test } from "vitest";
import { truncateByCodePoint } from "./text";

describe("truncateByCodePoint", () => {
  test("不切斷 emoji（surrogate pair）", () => {
    const s = "a".repeat(119) + "💦💦";
    const out = truncateByCodePoint(s, 120);
    expect(out).toBe("a".repeat(119) + "💦");
    expect(() => encodeURIComponent(out)).not.toThrow(); // 無未配對 surrogate
  });

  test("短字串原樣返回", () => {
    expect(truncateByCodePoint("短字串", 120)).toBe("短字串");
  });
});

describe("stripLoneSurrogates", () => {
  test("移除未配對的 surrogate、保留完整 emoji", async () => {
    const { stripLoneSurrogates } = await import("./text");
    expect(stripLoneSurrogates("水💦\ud83d好")).toBe("水💦好");
  });
});
