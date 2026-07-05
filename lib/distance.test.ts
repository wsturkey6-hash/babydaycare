import { describe, expect, test } from "vitest";
import { formatDistance, haversineKm } from "./distance";

describe("haversineKm", () => {
  test("同一點距離為 0", () => {
    const p = { lat: 24.8047, lng: 120.9714 };
    expect(haversineKm(p, p)).toBe(0);
  });

  test("新竹火車站到新竹市政府約 0.6–0.9 公里", () => {
    const station = { lat: 24.8016, lng: 120.9718 };
    const cityHall = { lat: 24.8067, lng: 120.9686 };
    const km = haversineKm(station, cityHall);
    expect(km).toBeGreaterThan(0.5);
    expect(km).toBeLessThan(1.0);
  });

  test("新竹到台北約 60–75 公里", () => {
    const hsinchu = { lat: 24.8047, lng: 120.9714 };
    const taipei = { lat: 25.0478, lng: 121.517 };
    const km = haversineKm(hsinchu, taipei);
    expect(km).toBeGreaterThan(55);
    expect(km).toBeLessThan(80);
  });
});

describe("formatDistance", () => {
  test("小於 1 公里顯示公尺，取整十", () => {
    expect(formatDistance(0.347)).toBe("350 m");
  });

  test("1 公里以上顯示一位小數", () => {
    expect(formatDistance(1.23)).toBe("1.2 km");
  });

  test("10 公里以上顯示整數", () => {
    expect(formatDistance(12.6)).toBe("13 km");
  });
});
