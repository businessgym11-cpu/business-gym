"use client";

import { useEffect, useState } from "react";
import { X, List, LayoutGrid } from "lucide-react";

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

export function RangeFilter({
  label,
  min,
  max,
  onMinChange,
  onMaxChange,
}: {
  label: string;
  min: string;
  max: string;
  onMinChange: (v: string) => void;
  onMaxChange: (v: string) => void;
}) {
  return (
    <div>
      <p className="text-xs font-bold text-slate-500">{label}</p>
      <div className="mt-1.5 flex items-center gap-2">
        <input
          type="number"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          placeholder="최소"
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
        />
        <span className="text-slate-300">~</span>
        <input
          type="number"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          placeholder="최대"
          className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
        />
      </div>
    </div>
  );
}

/**
 * 최근 검색어를 브라우저(localStorage)에 개인화 저장한다 — 계정 간 공유
 * 안 되는 가벼운 편의 기능이라 Supabase까지 갈 필요는 없다고 판단.
 */
export function useSearchHistory(storageKey: string, max = 12) {
  const [history, setHistory] = useState<string[]>([]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) setHistory(JSON.parse(raw));
    } catch {
      // 저장된 값이 깨졌으면 무시
    }
  }, [storageKey]);

  const addTerm = (term: string) => {
    const trimmed = term.trim();
    if (!trimmed) return;
    setHistory((prev) => {
      const next = [trimmed, ...prev.filter((t) => t !== trimmed)].slice(0, max);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // 저장 실패는 무시 — 검색 자체엔 영향 없음
      }
      return next;
    });
  };

  const removeTerm = (term: string) => {
    setHistory((prev) => {
      const next = prev.filter((t) => t !== term);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {
        // 저장 실패는 무시
      }
      return next;
    });
  };

  return { history, addTerm, removeTerm };
}

export function SearchHistoryChips({
  history,
  onSelect,
  onRemove,
}: {
  history: string[];
  onSelect: (term: string) => void;
  onRemove: (term: string) => void;
}) {
  if (history.length === 0) return null;
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {history.map((term) => (
        <span
          key={term}
          className="flex items-center gap-1 rounded-full border border-slate-200 bg-white py-1 pl-3 pr-1.5 text-xs text-slate-500"
        >
          <button
            type="button"
            onClick={() => onSelect(term)}
            className="hover:text-purple-700"
          >
            {term}
          </button>
          <button
            type="button"
            onClick={() => onRemove(term)}
            aria-label="검색어 삭제"
            className="rounded-full p-0.5 text-slate-300 hover:bg-slate-100 hover:text-slate-500"
          >
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}
    </div>
  );
}

export type ViewMode = "table" | "grid";

export function ViewModeToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (mode: ViewMode) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1">
      <button
        type="button"
        onClick={() => onChange("table")}
        aria-label="표로 보기"
        className={`flex items-center justify-center rounded-md p-1.5 transition-colors duration-200 ${
          mode === "table"
            ? "bg-purple-50 text-purple-700"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <List className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => onChange("grid")}
        aria-label="카드로 보기"
        className={`flex items-center justify-center rounded-md p-1.5 transition-colors duration-200 ${
          mode === "grid"
            ? "bg-purple-50 text-purple-700"
            : "text-slate-400 hover:text-slate-600"
        }`}
      >
        <LayoutGrid className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
