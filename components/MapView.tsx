"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { useEffect } from "react";
import type { EnrichedCenter } from "@/components/AppShell";
import type { LatLng } from "@/lib/types";

/** 新竹火車站：拿不到定位時的預設中心 */
const HSINCHU_STATION: LatLng = { lat: 24.8016, lng: 120.9718 };

interface Props {
  items: EnrichedCenter[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  userLoc: LatLng | null;
}

function PanController({
  selectedId,
  items,
  userLoc,
}: {
  selectedId: string | null;
  items: EnrichedCenter[];
  userLoc: LatLng | null;
}) {
  const map = useMap();

  useEffect(() => {
    if (!map || !selectedId) return;
    const item = items.find((e) => e.center.id === selectedId);
    if (item?.center.lat != null && item.center.lng != null) {
      map.panTo({ lat: item.center.lat, lng: item.center.lng });
    }
  }, [map, selectedId, items]);

  useEffect(() => {
    if (map && userLoc) map.panTo(userLoc);
  }, [map, userLoc]);

  return null;
}

function Pin({
  item,
  selected,
  onClick,
}: {
  item: EnrichedCenter;
  selected: boolean;
  onClick: () => void;
}) {
  const { status, center } = item;
  return (
    <AdvancedMarker
      position={{ lat: center.lat!, lng: center.lng! }}
      onClick={onClick}
      title={center.name}
      zIndex={selected ? 30 : status.recruiting ? 20 : 10}
    >
      <div
        className={`relative rounded-full border-2 border-white shadow-md transition-transform ${
          selected ? "scale-125 ring-2 ring-ink" : ""
        } ${status.recruiting ? "bg-sprout" : "bg-slate"} h-6 w-6`}
      >
        {status.hasPenalty && (
          <span className="seal absolute -top-1.5 -right-1.5 h-4 w-4 text-[9px] shadow-sm">
            罰
          </span>
        )}
      </div>
    </AdvancedMarker>
  );
}

function MissingKeyNotice() {
  return (
    <div className="flex h-full items-center justify-center bg-paper p-6">
      <div className="max-w-md rounded-xl border border-line bg-white p-6 shadow-sm">
        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
          地圖尚未啟用
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate">
          還沒有設定 Google Maps API key。設定方式：
        </p>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
          <li>
            到 Google Cloud Console 建立專案，啟用「Maps JavaScript API」
          </li>
          <li>建立 API 金鑰（建議限制網域）</li>
          <li>
            在專案根目錄建立 <code className="rounded bg-paper px-1">.env.local</code>
            ，寫入
            <code className="mt-1 block rounded bg-paper px-2 py-1 text-xs">
              NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=你的金鑰
            </code>
          </li>
          <li>重新啟動 npm run dev</li>
        </ol>
        <p className="mt-3 text-xs text-slate">
          左側清單不需要金鑰，現在就可以使用。
        </p>
      </div>
    </div>
  );
}

export default function MapView({ items, selectedId, onSelect, userLoc }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) return <MissingKeyNotice />;

  return (
    <APIProvider apiKey={apiKey}>
      <Map
        className="h-full w-full"
        defaultCenter={userLoc ?? HSINCHU_STATION}
        defaultZoom={13}
        mapId="DEMO_MAP_ID"
        gestureHandling="greedy"
        disableDefaultUI
        zoomControl
        onClick={() => onSelect(null)}
      >
        <PanController selectedId={selectedId} items={items} userLoc={userLoc} />
        {userLoc && (
          <AdvancedMarker position={userLoc} title="你的位置" zIndex={40}>
            <div className="h-4 w-4 rounded-full border-2 border-white bg-sky-500 shadow-[0_0_0_6px_rgba(14,165,233,0.25)]" />
          </AdvancedMarker>
        )}
        {items
          .filter((e) => e.center.lat != null && e.center.lng != null)
          .map((item) => (
            <Pin
              key={item.center.id}
              item={item}
              selected={item.center.id === selectedId}
              onClick={() => onSelect(item.center.id)}
            />
          ))}
      </Map>
    </APIProvider>
  );
}
