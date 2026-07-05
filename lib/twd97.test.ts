import { describe, expect, test } from "vitest";
import { twd97ToWgs84 } from "./twd97";

describe("twd97ToWgs84", () => {
  test("中央經線上的點 (x=250000) 經度必為 121", () => {
    const { lng } = twd97ToWgs84(250000, 2744055);
    expect(lng).toBeCloseTo(121.0, 5);
  });

  test("新竹市民富街的托嬰中心座標落在正確位置附近", () => {
    // 來源：托育媒合平臺查詢結果內嵌座標
    // 新竹市私立國際音樂托嬰中心北區民富校 (民富街256號)
    const { lat, lng } = twd97ToWgs84(245698.34, 2744055.47);
    expect(lat).toBeGreaterThan(24.79);
    expect(lat).toBeLessThan(24.83);
    expect(lng).toBeGreaterThan(120.93);
    expect(lng).toBeLessThan(120.98);
  });

  test("緯度隨 y 增加而增加、經度隨 x 增加而增加", () => {
    const a = twd97ToWgs84(245000, 2744000);
    const b = twd97ToWgs84(246000, 2745000);
    expect(b.lat).toBeGreaterThan(a.lat);
    expect(b.lng).toBeGreaterThan(a.lng);
  });
});
