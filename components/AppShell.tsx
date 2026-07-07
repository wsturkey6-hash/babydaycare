"use client";

import { useEffect, useMemo, useState } from "react";
import CenterDetail from "@/components/CenterDetail";
import CenterList from "@/components/CenterList";
import { Footprints } from "@/components/Doodles";
import FilterChips, { type Filters } from "@/components/FilterChips";
import MapView from "@/components/MapView";
import { haversineKm } from "@/lib/distance";
import { getCenterStatus, type CenterStatus } from "@/lib/status";
import type { Center, LatLng, Meta, Penalty, Post } from "@/lib/types";

export interface EnrichedCenter {
  center: Center;
  status: CenterStatus;
  distanceKm: number | null;
}

interface Props {
  centers: Center[];
  penalties: Penalty[];
  posts: Post[];
  meta: Meta;
}

function mockNotice(meta: Meta): string | null {
  const parts = [
    meta.centers?.mock && "中心名單",
    meta.penalties?.mock && "裁罰紀錄",
    meta.posts?.mock && "招生資訊",
  ].filter((p): p is string => Boolean(p));
  return parts.length > 0 ? `${parts.join("、")}目前為示範資料。` : null;
}

const DEFAULT_FILTERS: Filters = {
  county: "全部",
  recruiting: false,
  noPenalty: false,
  quasiPublic: false,
};

export default function AppShell({ centers, penalties, posts, meta }: Props) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<LatLng | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {},
      { maximumAge: 300_000, timeout: 8_000 },
    );
  }, []);

  const enriched = useMemo<EnrichedCenter[]>(() => {
    const now = new Date();
    return centers
      .map((center) => ({
        center,
        status: getCenterStatus(center, penalties, posts, now),
        distanceKm:
          userLoc && center.lat != null && center.lng != null
            ? haversineKm(userLoc, { lat: center.lat, lng: center.lng })
            : null,
      }))
      .sort((a, b) => {
        if (a.distanceKm != null && b.distanceKm != null)
          return a.distanceKm - b.distanceKm;
        return a.center.name.localeCompare(b.center.name, "zh-Hant");
      });
  }, [centers, penalties, posts, userLoc]);

  const visible = useMemo(
    () =>
      enriched.filter(({ center, status }) => {
        if (filters.county !== "全部" && center.county !== filters.county)
          return false;
        if (filters.recruiting && !status.recruiting) return false;
        if (filters.noPenalty && status.hasPenalty) return false;
        if (filters.quasiPublic && !center.quasiPublic) return false;
        return true;
      }),
    [enriched, filters],
  );

  const selected = visible.find((e) => e.center.id === selectedId) ?? null;
  const unmatchedPenalties = penalties.filter((p) => p.centerId === null);

  function handleSelect(id: string | null) {
    setSelectedId(id);
    if (id) setPanelOpen(true);
  }

  return (
    <div className="flex h-full flex-col md:flex-row">
      {/* 側欄（桌機）／底部面板（手機） */}
      <aside
        className={`order-2 flex min-h-0 flex-col border-t border-line bg-panel transition-[height] duration-200 md:order-1 md:h-auto md:w-[400px] md:border-t-0 md:border-r ${
          panelOpen ? "h-[55dvh]" : "h-14"
        }`}
      >
        <header className="hidden shrink-0 px-5 pt-5 pb-3 md:block">
          <div className="flex items-end gap-3">
            <h1 className="font-[family-name:var(--font-display)] text-2xl font-bold">
              竹托地圖
            </h1>
            <Footprints className="mb-1 h-6 w-20" />
          </div>
          <p className="mt-1 text-sm text-slate">
            新竹縣市托嬰中心：招生 × 裁罰 × 評鑑，一張地圖看完
          </p>
        </header>

        {mockNotice(meta) && (
          <p className="mx-4 mt-2 hidden shrink-0 rounded-md bg-apricot/15 px-3 py-1.5 text-xs text-ink md:block">
            {mockNotice(meta)}
          </p>
        )}

        <div className="hidden shrink-0 px-4 py-3 md:block">
          <FilterChips filters={filters} onChange={setFilters} />
        </div>

        {/* 手機收合列 */}
        <button
          type="button"
          onClick={() => setPanelOpen((v) => !v)}
          className="flex h-14 shrink-0 items-center justify-between px-5 md:hidden"
          aria-expanded={panelOpen}
        >
          <span className="text-sm font-medium">
            {selected ? selected.center.name : `${visible.length} 間托嬰中心`}
          </span>
          <span className="text-xs text-slate">
            {panelOpen ? "收合 ▾" : "展開 ▴"}
          </span>
        </button>

        <div className="min-h-0 flex-1 overflow-y-auto">
          {selected ? (
            <CenterDetail
              item={selected}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <CenterList
              items={visible}
              onSelect={handleSelect}
              unmatchedPenalties={unmatchedPenalties}
              mockNotice={mockNotice(meta)}
            />
          )}
        </div>
      </aside>

      {/* 地圖 */}
      <div className="relative order-1 min-h-0 flex-1 md:order-2">
        {/* 手機頂部浮動列 */}
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 p-3 md:hidden">
          <div className="pointer-events-auto rounded-2xl border border-line bg-panel/95 px-4 py-2.5 shadow-[var(--shadow-warm)] backdrop-blur">
            <div className="flex items-end gap-2.5">
              <h1 className="font-[family-name:var(--font-display)] text-lg font-bold">
                竹托地圖
              </h1>
              <Footprints className="mb-1 h-5 w-16" />
            </div>
            <div className="mt-2 overflow-x-auto pb-0.5">
              <FilterChips filters={filters} onChange={setFilters} />
            </div>
          </div>
        </div>
        <MapView
          items={visible}
          selectedId={selectedId}
          onSelect={handleSelect}
          userLoc={userLoc}
        />
      </div>
    </div>
  );
}
