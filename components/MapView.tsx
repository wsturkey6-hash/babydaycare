"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  useMap,
} from "@vis.gl/react-google-maps";
import { useEffect, useState, useSyncExternalStore } from "react";
import type { EnrichedCenter } from "@/components/AppShell";
import { NestScene } from "@/components/Doodles";
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
        } ${status.recruiting ? "bg-sprout" : "bg-marker"} h-6 w-6`}
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

/** 金鑰只存在使用者自己的瀏覽器，不會上傳到任何伺服器 */
const API_KEY_STORAGE = "gmaps-api-key";

function KeySetupCard({ onSave }: { onSave: (key: string) => void }) {
  const [value, setValue] = useState("");

  return (
    <div className="flex h-full items-center justify-center overflow-y-auto bg-paper p-6">
      <div className="max-w-md overflow-hidden rounded-2xl border border-line bg-panel shadow-[var(--shadow-warm-lg)]">
        <NestScene className="block w-full bg-[#fdf7ec]" />
        <div className="p-6 pt-4">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-bold">
            啟用地圖
          </h2>
          <p className="mt-2 text-sm leading-6 text-slate">
            地圖需要你自己的 Google Maps
            金鑰（免費額度足夠個人使用）。申請方式：
          </p>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-6">
            <li>
              到{" "}
              <a
                href="https://console.cloud.google.com/google/maps-apis"
                target="_blank"
                rel="noopener noreferrer"
                className="underline decoration-line underline-offset-2"
              >
                Google Cloud Console
              </a>{" "}
              建立專案，啟用「Maps JavaScript API」
            </li>
            <li>建立 API 金鑰（建議設定 HTTP referrer 限制為本網站網址）</li>
            <li>貼到下方欄位</li>
          </ol>
          <form
            className="mt-4 flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              const key = value.trim();
              if (key) onSave(key);
            }}
          >
            <label htmlFor="gmaps-key" className="sr-only">
              Google Maps API 金鑰
            </label>
            <input
              id="gmaps-key"
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="貼上你的 API 金鑰"
              autoComplete="off"
              spellCheck={false}
              className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 font-mono text-sm focus:border-apricot focus:outline-none focus:ring-2 focus:ring-apricot/40"
            />
            <button
              type="submit"
              disabled={!value.trim()}
              className="shrink-0 cursor-pointer rounded-lg bg-ink px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-ink/85 disabled:cursor-default disabled:opacity-40"
            >
              儲存並開啟地圖
            </button>
          </form>
          <p className="mt-3 text-xs leading-5 text-slate">
            金鑰只會存在這台裝置的瀏覽器（localStorage），不會上傳到任何伺服器。
            左側清單不需要金鑰，現在就可以使用。
          </p>
        </div>
      </div>
    </div>
  );
}

function subscribeToStorage(onChange: () => void) {
  window.addEventListener("storage", onChange);
  return () => window.removeEventListener("storage", onChange);
}

export default function MapView({ items, selectedId, onSelect, userLoc }: Props) {
  // localStorage 的金鑰；prerender（伺服器快照）一律視為未設定
  const storedKey = useSyncExternalStore(
    subscribeToStorage,
    () => localStorage.getItem(API_KEY_STORAGE),
    () => null,
  );
  // 剛在本頁儲存的金鑰（setItem 不會在同一分頁觸發 storage 事件）
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const apiKey =
    justSaved ??
    storedKey ??
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ??
    null;

  function saveKey(key: string) {
    localStorage.setItem(API_KEY_STORAGE, key);
    setJustSaved(key);
  }

  function resetKey() {
    if (!confirm("要移除這台裝置上儲存的地圖金鑰嗎？")) return;
    localStorage.removeItem(API_KEY_STORAGE);
    // Maps JS script 無法乾淨卸載，重新載入頁面最可靠
    location.reload();
  }

  if (apiKey === null) return <KeySetupCard onSave={saveKey} />;

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
      <button
        type="button"
        onClick={resetKey}
        className="absolute bottom-2 left-2 z-10 cursor-pointer rounded-full border border-line bg-panel/90 px-2.5 py-1 text-[11px] text-slate shadow-sm backdrop-blur transition-colors hover:text-ink"
      >
        更換地圖金鑰
      </button>
    </APIProvider>
  );
}
