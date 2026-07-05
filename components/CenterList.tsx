"use client";

import type { EnrichedCenter } from "@/components/AppShell";
import { formatDistance } from "@/lib/distance";
import type { Penalty } from "@/lib/types";

interface Props {
  items: EnrichedCenter[];
  onSelect: (id: string) => void;
  unmatchedPenalties: Penalty[];
  mockNotice: string | null;
}

export default function CenterList({
  items,
  onSelect,
  unmatchedPenalties,
  mockNotice,
}: Props) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-slate">
        沒有符合條件的托嬰中心。放寬上方的篩選條件試試。
      </p>
    );
  }

  return (
    <div>
      {mockNotice && (
        <p className="mx-4 mt-3 rounded-md bg-apricot/15 px-3 py-1.5 text-xs md:hidden">
          {mockNotice}
        </p>
      )}
      <ul className="divide-y divide-line">
        {items.map(({ center, status, distanceKm }) => (
          <li key={center.id}>
            <button
              type="button"
              onClick={() => onSelect(center.id)}
              className="flex w-full items-start gap-3 px-5 py-3.5 text-left hover:bg-paper"
            >
              <span
                className={`relative mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${
                  status.recruiting ? "bg-sprout" : "bg-slate"
                }`}
                aria-hidden
              >
                {status.hasPenalty && (
                  <span className="seal absolute -top-1.5 -right-2 h-3.5 w-3.5 text-[8px]">
                    罰
                  </span>
                )}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">
                  {center.name}
                </span>
                <span className="mt-0.5 block text-xs text-slate">
                  {center.county}
                  {center.district} · {center.type}
                  {center.capacity != null && ` · 收托 ${center.capacity} 人`}
                </span>
                <span className="mt-1.5 flex flex-wrap gap-1">
                  {status.recruiting && (
                    <Badge tone="green">招生中</Badge>
                  )}
                  {status.hasPenalty && (
                    <Badge tone="red">裁罰 {status.penalties.length} 筆</Badge>
                  )}
                  {center.quasiPublic && <Badge>準公共</Badge>}
                  {center.accreditation && (
                    <Badge>
                      {center.accreditation.year} 評鑑{center.accreditation.grade}
                    </Badge>
                  )}
                </span>
              </span>
              {distanceKm != null && (
                <span className="mt-1 shrink-0 text-xs tabular-nums text-slate">
                  {formatDistance(distanceKm)}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      {unmatchedPenalties.length > 0 && (
        <details className="border-t border-line px-5 py-3">
          <summary className="cursor-pointer text-xs text-slate">
            其他裁罰公告（{unmatchedPenalties.length}
            筆，未能對應到現存中心，可能已歇業或更名）
          </summary>
          <ul className="mt-2 space-y-2">
            {unmatchedPenalties.map((p) => (
              <li key={`${p.centerName}-${p.date}`} className="text-xs leading-5">
                <span className="font-medium">{p.centerName}</span>（{p.date}）
                {p.violation}
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function Badge({
  tone,
  children,
}: {
  tone?: "green" | "red";
  children: React.ReactNode;
}) {
  const cls =
    tone === "green"
      ? "bg-sprout-soft text-sprout"
      : tone === "red"
        ? "bg-cinnabar-soft text-cinnabar"
        : "border border-line text-slate";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[11px] font-medium ${cls}`}>
      {children}
    </span>
  );
}
