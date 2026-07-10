/**
 * 篩選狀態 ↔ URL query string 的轉換。
 * 參數：c=縣市 d=鄉鎮市區 r=招生中 np=排除有裁罰 q=準公共 id=選取的中心
 * 預設值不輸出，讓可分享的網址保持乾淨。
 */
import type { Filters } from "@/components/FilterChips";

export const DEFAULT_FILTERS: Filters = {
  county: "全部",
  district: "全部",
  recruiting: false,
  noPenalty: false,
  quasiPublic: false,
};

export interface AppState {
  filters: Filters;
  selectedId: string | null;
}

const COUNTIES = new Set(["新竹市", "新竹縣"]);

export function parseAppState(search: string): AppState {
  const params = new URLSearchParams(search);
  const county = params.get("c") ?? "";
  const validCounty = COUNTIES.has(county)
    ? (county as Filters["county"])
    : "全部";
  return {
    filters: {
      county: validCounty,
      // 鄉鎮市區只有在縣市有效時才有意義
      district:
        validCounty !== "全部" ? (params.get("d") ?? "全部") : "全部",
      recruiting: params.get("r") === "1",
      noPenalty: params.get("np") === "1",
      quasiPublic: params.get("q") === "1",
    },
    selectedId: params.get("id"),
  };
}

export function serializeAppState(
  filters: Filters,
  selectedId: string | null,
): string {
  const params = new URLSearchParams();
  if (filters.county !== "全部") params.set("c", filters.county);
  if (filters.county !== "全部" && filters.district !== "全部")
    params.set("d", filters.district);
  if (filters.recruiting) params.set("r", "1");
  if (filters.noPenalty) params.set("np", "1");
  if (filters.quasiPublic) params.set("q", "1");
  if (selectedId) params.set("id", selectedId);
  return params.toString();
}
