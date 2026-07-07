"use client";

export interface Filters {
  county: "全部" | "新竹市" | "新竹縣";
  /** 鄉鎮市區；「全部」表示不限 */
  district: string;
  recruiting: boolean;
  noPenalty: boolean;
  quasiPublic: boolean;
}

interface Props {
  filters: Filters;
  /** 目前所選縣市的鄉鎮市區清單（縣市為「全部」時為空） */
  districts: string[];
  onChange: (f: Filters) => void;
}

const COUNTIES: Filters["county"][] = ["全部", "新竹市", "新竹縣"];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-panel text-ink hover:border-slate"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterChips({ filters, districts, onChange }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-1.5 whitespace-nowrap">
        {COUNTIES.map((c) => (
          <Chip
            key={c}
            active={filters.county === c}
            // 換縣市時重設鄉鎮市區
            onClick={() => onChange({ ...filters, county: c, district: "全部" })}
          >
            {c}
          </Chip>
        ))}
        <span className="mx-0.5 h-4 w-px shrink-0 bg-line" aria-hidden />
        <Chip
          active={filters.recruiting}
          onClick={() =>
            onChange({ ...filters, recruiting: !filters.recruiting })
          }
        >
          <span className="h-2 w-2 rounded-full bg-sprout" aria-hidden />
          招生中
        </Chip>
        <Chip
          active={filters.noPenalty}
          onClick={() => onChange({ ...filters, noPenalty: !filters.noPenalty })}
        >
          <span className="seal h-3.5 w-3.5 text-[8px]" aria-hidden>
            罰
          </span>
          排除有裁罰
        </Chip>
        <Chip
          active={filters.quasiPublic}
          onClick={() =>
            onChange({ ...filters, quasiPublic: !filters.quasiPublic })
          }
        >
          準公共
        </Chip>
      </div>

      {districts.length > 0 && (
        <div className="flex items-center gap-1.5 whitespace-nowrap md:flex-wrap">
          <Chip
            active={filters.district === "全部"}
            onClick={() => onChange({ ...filters, district: "全部" })}
          >
            全區
          </Chip>
          {districts.map((d) => (
            <Chip
              key={d}
              active={filters.district === d}
              onClick={() => onChange({ ...filters, district: d })}
            >
              {d}
            </Chip>
          ))}
        </div>
      )}
    </div>
  );
}
