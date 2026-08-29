export function formatViews(count: number | null): string {
  if (count == null) return "-";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function daysElapsed(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

export const TIER_STYLES: Record<string, string> = {
  worst: "bg-red-50 text-red-600",
  bad: "bg-orange-50 text-orange-600",
  normal: "bg-slate-100 text-slate-500",
  good: "bg-emerald-50 text-emerald-600",
  great: "bg-purple-50 text-purple-700",
};

export const TIER_LABELS: Record<string, string> = {
  worst: "Worst",
  bad: "Bad",
  normal: "Normal",
  good: "Good",
  great: "Great",
};

export function TierChip({ tier }: { tier: string | null }) {
  if (!tier || !TIER_STYLES[tier]) {
    return <span className="text-xs text-slate-300">-</span>;
  }
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-bold ${TIER_STYLES[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

export const CONTRIBUTION_TIERS = ["bad", "normal", "good", "great"];
export const PERFORMANCE_TIERS = ["worst", "bad", "normal", "good", "great"];

export const DATE_PRESETS: { id: string; label: string; days: number | null }[] = [
  { id: "all", label: "전체", days: null },
  { id: "1m", label: "1개월", days: 30 },
  { id: "3m", label: "3개월", days: 90 },
  { id: "6m", label: "6개월", days: 180 },
  { id: "12m", label: "12개월", days: 365 },
];

export type ShortsFilter = "all" | "shorts" | "long";

export function TierFilterGroup({
  label,
  tiers,
  selected,
  onToggle,
}: {
  label: string;
  tiers: string[];
  selected: Set<string>;
  onToggle: (tier: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {tiers.map((t) => {
          const on = selected.has(t);
          return (
            <button
              key={t}
              type="button"
              onClick={() => onToggle(t)}
              className={`rounded-full px-2.5 py-1 text-xs font-bold transition-colors duration-200 ${
                on
                  ? TIER_STYLES[t]
                  : "bg-white text-slate-300 ring-1 ring-inset ring-slate-200"
              }`}
            >
              {TIER_LABELS[t]}
            </button>
          );
        })}
      </div>
    </div>
  );
}
