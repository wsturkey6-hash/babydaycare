"use client";

export interface Filters {
  county: "全部" | "新竹市" | "新竹縣";
  recruiting: boolean;
  noPenalty: boolean;
  quasiPublic: boolean;
}

interface Props {
  filters: Filters;
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
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "border-ink bg-ink text-white"
          : "border-line bg-white text-ink hover:border-slate"
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterChips({ filters, onChange }: Props) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      {COUNTIES.map((c) => (
        <Chip
          key={c}
          active={filters.county === c}
          onClick={() => onChange({ ...filters, county: c })}
        >
          {c}
        </Chip>
      ))}
      <span className="mx-0.5 h-4 w-px shrink-0 bg-line" aria-hidden />
      <Chip
        active={filters.recruiting}
        onClick={() => onChange({ ...filters, recruiting: !filters.recruiting })}
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
  );
}
