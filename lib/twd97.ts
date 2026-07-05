/**
 * TWD97 TM2 (EPSG:3826，中央經線 121°E) → WGS84 經緯度。
 * GRS80 橢球體橫麥卡托逆投影；TWD97 與 WGS84 差異在公尺級以下，直接視為相同。
 */

const A = 6378137; // GRS80 長半軸
const F = 1 / 298.257222101; // 扁率
const K0 = 0.9999; // 尺度因子
const DX = 250000; // 假東距
const LNG0 = (121 * Math.PI) / 180; // 中央經線

const E2 = F * (2 - F); // 第一離心率平方
const E4 = E2 * E2;
const E6 = E4 * E2;

export function twd97ToWgs84(x: number, y: number): { lat: number; lng: number } {
  const M = y / K0; // 子午線弧長

  // footpoint latitude（子午線弧長反算）
  const mu = M / (A * (1 - E2 / 4 - (3 * E4) / 64 - (5 * E6) / 256));
  const e1 = (1 - Math.sqrt(1 - E2)) / (1 + Math.sqrt(1 - E2));
  const phi1 =
    mu +
    ((3 * e1) / 2 - (27 * e1 ** 3) / 32) * Math.sin(2 * mu) +
    ((21 * e1 ** 2) / 16 - (55 * e1 ** 4) / 32) * Math.sin(4 * mu) +
    ((151 * e1 ** 3) / 96) * Math.sin(6 * mu) +
    ((1097 * e1 ** 4) / 512) * Math.sin(8 * mu);

  const sin1 = Math.sin(phi1);
  const cos1 = Math.cos(phi1);
  const tan1 = Math.tan(phi1);

  const ep2 = E2 / (1 - E2); // 第二離心率平方
  const C1 = ep2 * cos1 * cos1;
  const T1 = tan1 * tan1;
  const N1 = A / Math.sqrt(1 - E2 * sin1 * sin1); // 卯酉圈曲率半徑
  const R1 = (A * (1 - E2)) / (1 - E2 * sin1 * sin1) ** 1.5; // 子午圈曲率半徑
  const D = (x - DX) / (N1 * K0);

  const lat =
    phi1 -
    ((N1 * tan1) / R1) *
      (D ** 2 / 2 -
        ((5 + 3 * T1 + 10 * C1 - 4 * C1 ** 2 - 9 * ep2) * D ** 4) / 24 +
        ((61 + 90 * T1 + 298 * C1 + 45 * T1 ** 2 - 252 * ep2 - 3 * C1 ** 2) *
          D ** 6) /
          720);

  const lng =
    LNG0 +
    (D -
      ((1 + 2 * T1 + C1) * D ** 3) / 6 +
      ((5 - 2 * C1 + 28 * T1 - 3 * C1 ** 2 + 8 * ep2 + 24 * T1 ** 2) * D ** 5) /
        120) /
      cos1;

  return { lat: (lat * 180) / Math.PI, lng: (lng * 180) / Math.PI };
}
