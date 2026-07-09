export interface ParsedTwAddress {
  /** 鄉鎮市（新竹市因無獨立市轄區地名層級，直接回傳新竹市） */
  city: string;
  street: string;
  number: string;
}

/**
 * 從台灣地址抽出可供地理編碼的 城市/路名/門牌；解析不出門牌則回傳 null。
 * 例：新竹縣竹北市斗崙里福興路1023、1025號 → { city: 竹北市, street: 福興路, number: 1023 }
 */
export function parseTwAddress(address: string): ParsedTwAddress | null {
  // 縣市層級
  const countyMatch = address.match(/^(新竹市|新竹縣)/);
  if (!countyMatch) return null;
  let rest = address.slice(countyMatch[1].length);

  // 鄉鎮市區：新竹市轄下的區不是 Nominatim 的 city 層級，直接用新竹市
  let city = countyMatch[1];
  const townMatch = rest.match(/^(.{1,3}?[市鎮鄉區])/);
  if (townMatch) {
    rest = rest.slice(townMatch[1].length);
    if (countyMatch[1] === "新竹縣") city = townMatch[1];
  }

  // 去掉村里
  rest = rest.replace(/^[^\d路街]{1,4}[里村]/, "");

  // 路名（含 段/巷/弄）+ 第一個門牌號
  const m = rest.match(
    /^(.+?[路街段巷弄])([0-9]+(?:-[0-9]+)?)(?:號|、)/,
  );
  if (!m) return null;

  return { city, street: m[1], number: m[2] };
}
