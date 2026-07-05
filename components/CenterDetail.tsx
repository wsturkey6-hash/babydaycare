"use client";

import type { EnrichedCenter } from "@/components/AppShell";
import { formatDistance } from "@/lib/distance";
import type { PostPlatform } from "@/lib/types";

const PLATFORM_LABEL: Record<PostPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  web: "官網",
};

export default function CenterDetail({
  item,
  onBack,
}: {
  item: EnrichedCenter;
  onBack: () => void;
}) {
  const { center, status, distanceKm } = item;
  const links = center.links ?? {};
  const hasLinks = links.website || links.facebook || links.instagram;
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(center.address)}`;

  return (
    <article className="px-5 py-4">
      <button
        type="button"
        onClick={onBack}
        className="mb-3 text-xs text-slate hover:text-ink"
      >
        ← 回清單
      </button>

      <h2 className="font-[family-name:var(--font-display)] text-xl font-bold leading-snug">
        {center.name}
      </h2>
      <p className="mt-1 text-sm text-slate">
        {center.county}
        {center.district} · {center.type}
        {center.capacity != null && ` · 核定收托 ${center.capacity} 人`}
        {distanceKm != null && ` · 距離 ${formatDistance(distanceKm)}`}
      </p>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {status.recruiting && (
          <span className="rounded bg-sprout-soft px-2 py-0.5 text-xs font-medium text-sprout">
            招生中
          </span>
        )}
        {status.hasPenalty && (
          <span className="rounded bg-cinnabar-soft px-2 py-0.5 text-xs font-medium text-cinnabar">
            裁罰 {status.penalties.length} 筆
          </span>
        )}
        {center.quasiPublic && (
          <span className="rounded border border-line px-2 py-0.5 text-xs text-slate">
            準公共化
          </span>
        )}
        {center.accreditation && (
          <span className="rounded border border-line px-2 py-0.5 text-xs text-slate">
            {center.accreditation.year} 年評鑑 {center.accreditation.grade} 等
          </span>
        )}
      </div>

      <dl className="mt-4 space-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="shrink-0 text-slate">地址</dt>
          <dd>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-line underline-offset-2 hover:decoration-ink"
            >
              {center.address}
            </a>
          </dd>
        </div>
        {center.phone && (
          <div className="flex gap-2">
            <dt className="shrink-0 text-slate">電話</dt>
            <dd>
              <a href={`tel:${center.phone}`} className="tabular-nums">
                {center.phone}
              </a>
            </dd>
          </div>
        )}
      </dl>

      <section className="mt-5">
        <h3 className="text-sm font-semibold">社群與官網</h3>
        {hasLinks ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {links.facebook && <LinkButton href={links.facebook}>Facebook</LinkButton>}
            {links.instagram && (
              <LinkButton href={links.instagram}>Instagram</LinkButton>
            )}
            {links.website && <LinkButton href={links.website}>官網</LinkButton>}
          </div>
        ) : (
          <p className="mt-2 text-xs text-slate">
            尚未收錄這間中心的社群或官網連結。
          </p>
        )}
      </section>

      <section className="mt-5">
        <h3 className="text-sm font-semibold">招生資訊</h3>
        {status.latestRecruitingPost ? (
          <a
            href={status.latestRecruitingPost.postUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block rounded-lg border border-sprout/30 bg-sprout-soft px-3 py-2.5"
          >
            <p className="text-sm leading-6">
              {status.latestRecruitingPost.excerpt}
            </p>
            <p className="mt-1 text-xs text-sprout">
              {status.latestRecruitingPost.date} ·{" "}
              {PLATFORM_LABEL[status.latestRecruitingPost.platform]} · 查看原文 →
            </p>
          </a>
        ) : (
          <p className="mt-2 text-xs text-slate">
            近兩個月沒有偵測到招生貼文。名額變動快，建議直接電話詢問。
          </p>
        )}
      </section>

      <section className="mt-5">
        <h3 className="flex items-center gap-1.5 text-sm font-semibold">
          {status.hasPenalty && (
            <span className="seal h-4 w-4 text-[9px]" aria-hidden>
              罰
            </span>
          )}
          裁罰紀錄
        </h3>
        {status.hasPenalty ? (
          <ul className="mt-2 space-y-2">
            {status.penalties.map((p) => (
              <li
                key={`${p.date}-${p.violation}`}
                className="rounded-lg border border-cinnabar/25 bg-cinnabar-soft px-3 py-2.5"
              >
                <p className="text-sm leading-6">{p.violation}</p>
                <p className="mt-1 text-xs text-cinnabar">
                  {p.date}
                  {p.fine != null && ` · 罰鍰 NT$${p.fine.toLocaleString()}`}
                  {p.law && ` · ${p.law}`}
                </p>
                <a
                  href={p.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-slate underline underline-offset-2"
                >
                  公告來源
                </a>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-slate">查無裁罰紀錄。</p>
        )}
      </section>
    </article>
  );
}

function LinkButton({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="rounded-full border border-line px-3 py-1 text-xs font-medium hover:border-slate"
    >
      {children} ↗
    </a>
  );
}
