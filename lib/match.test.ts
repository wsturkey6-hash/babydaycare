import { describe, expect, test } from "vitest";
import type { Center } from "./types";
import { matchCenterId } from "./match";

const centers = [
  { id: "A", name: "新竹市私立愛格樂國際音樂托嬰中心慈雲校" },
  { id: "B", name: "新竹市私立小丸子托嬰中心" },
  { id: "C", name: "新竹縣私立竹風托嬰中心" },
  { id: "D", name: "新竹縣私立理想圓托嬰中心" },
  { id: "E", name: "新竹縣私立理想圓托嬰中心六家館" },
] as Center[];

describe("matchCenterId", () => {
  test("裁罰對象含機構名（後面接負責人姓名）→ 命中", () => {
    expect(
      matchCenterId("新竹市私立愛格樂國際音樂托嬰中心慈雲校 徐鳳吟", centers),
    ).toBe("A");
  });

  test("完全相同名稱 → 命中", () => {
    expect(matchCenterId("新竹市私立小丸子托嬰中心", centers)).toBe("B");
  });

  test("名稱含全形空白也能比對", () => {
    expect(matchCenterId("新竹市私立小丸子　托嬰中心", centers)).toBe("B");
  });

  test("無關的行為人姓名 → null", () => {
    expect(matchCenterId("楊慶昱", centers)).toBeNull();
  });

  test("已歇業、不在名單中的托嬰中心 → null", () => {
    expect(matchCenterId("新竹市私立不存在托嬰中心", centers)).toBeNull();
  });

  test("分館裁罰不誤配到本館：取最長命中名稱", () => {
    expect(matchCenterId("新竹縣私立理想圓托嬰中心六家館 王小明", centers)).toBe("E");
  });

  test("本館裁罰不配到分館", () => {
    expect(matchCenterId("新竹縣私立理想圓托嬰中心", centers)).toBe("D");
  });
});
