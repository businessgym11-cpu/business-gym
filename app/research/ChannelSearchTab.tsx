"use client";

import { useMemo, useState } from "react";
import { Loader2, Search, Plus, SlidersHorizontal, RotateCcw } from "lucide-react";
import { searchChannels, type SearchedChannel } from "./actions";
import {
  formatViews,
  formatDate,
  TierChip,
  DATE_PRESETS,
  TierFilterGroup,
  RangeFilter,
  useSearchHistory,
  SearchHistoryChips,
  ViewModeToggle,
  type ViewMode,
} from "./shared";

const CONVERSION_TIERS = ["bad", "normal", "good", "great"];

export default function ChannelSearchTab({
  onRegister,
}: {
  onRegister: (channelUrl: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [results, setResults] = useState<SearchedChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const { history, addTerm, removeTerm } = useSearchHistory("bg_channel_search_history");

  const [showFilters, setShowFilters] = useState(false);
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [minVideos, setMinVideos] = useState("");
  const [maxVideos, setMaxVideos] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [viewToSubSelected, setViewToSubSelected] = useState<Set<string>>(
    new Set(CONVERSION_TIERS)
  );
  const [dailySubSelected, setDailySubSelected] = useState<Set<string>>(
    new Set(CONVERSION_TIERS)
  );

  const toggleViewToSub = (tier: string) => {
    setViewToSubSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const toggleDailySub = (tier: string) => {
    setDailySubSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const resetFilters = () => {
    setMinSubs("");
    setMaxSubs("");
    setMinVideos("");
    setMaxVideos("");
    setDatePreset("all");
    setViewToSubSelected(new Set(CONVERSION_TIERS));
    setDailySubSelected(new Set(CONVERSION_TIERS));
  };

  const filtersActive =
    minSubs !== "" ||
    maxSubs !== "" ||
    minVideos !== "" ||
    maxVideos !== "" ||
    datePreset !== "all" ||
    viewToSubSelected.size !== CONVERSION_TIERS.length ||
    dailySubSelected.size !== CONVERSION_TIERS.length;

  const runSearch = async (term: string) => {
    if (!term.trim()) {
      setError("검색할 주제어를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(true);
    resetFilters();

    const result = await searchChannels(term.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setResults(result.results);
    addTerm(term.trim());
  };

  const filteredResults = useMemo(() => {
    const minS = minSubs ? Number(minSubs) : null;
    const maxS = maxSubs ? Number(maxSubs) : null;
    const minV = minVideos ? Number(minVideos) : null;
    const maxV = maxVideos ? Number(maxVideos) : null;
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    const cutoff =
      preset && preset.days ? Date.now() - preset.days * 24 * 60 * 60 * 1000 : null;

    return results.filter((c) => {
      if (minS !== null && c.subscriberCount < minS) return false;
      if (maxS !== null && c.subscriberCount > maxS) return false;
      if (minV !== null && c.videoCount < minV) return false;
      if (maxV !== null && c.videoCount > maxV) return false;
      if (cutoff !== null && c.createdAt && new Date(c.createdAt).getTime() < cutoff)
        return false;
      if (!viewToSubSelected.has(c.viewToSubTier)) return false;
      if (!dailySubSelected.has(c.dailySubTier)) return false;
      return true;
    });
  }, [results, minSubs, maxSubs, minVideos, maxVideos, datePreset, viewToSubSelected, dailySubSelected]);

  const handleRegister = (channel: SearchedChannel) => {
    setRegisteredIds((prev) => new Set(prev).add(channel.id));
    onRegister(channel.id);
  };

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") runSearch(keyword);
          }}
          placeholder="예: 홈트레이닝, 자취 요리"
          className="w-full flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
        <button
          type="button"
          onClick={() => runSearch(keyword)}
          disabled={loading}
          className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          검색
        </button>
      </div>

      <SearchHistoryChips
        history={history}
        onSelect={(term) => {
          setKeyword(term);
          runSearch(term);
        }}
        onRemove={removeTerm}
      />

      {error && (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
      )}

      {hasSearched && !loading && (
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowFilters((v) => !v)}
              className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors duration-200 ${
                showFilters || filtersActive
                  ? "border-purple-300 bg-purple-50 text-purple-700"
                  : "border-slate-200 text-slate-600 hover:bg-slate-50"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              필터
              {filtersActive && (
                <span className="ml-0.5 h-1.5 w-1.5 rounded-full bg-purple-500" />
              )}
            </button>
            <ViewModeToggle mode={viewMode} onChange={setViewMode} />
          </div>
          <p className="text-xs text-slate-400">
            전체 {results.length}개 중 {filteredResults.length}개 표시
          </p>
        </div>
      )}

      {showFilters && (
        <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <RangeFilter
              label="구독자 범위"
              min={minSubs}
              max={maxSubs}
              onMinChange={setMinSubs}
              onMaxChange={setMaxSubs}
            />
            <RangeFilter
              label="영상수 범위"
              min={minVideos}
              max={maxVideos}
              onMinChange={setMinVideos}
              onMaxChange={setMaxVideos}
            />
            <div>
              <p className="text-xs font-bold text-slate-500">개설일</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {DATE_PRESETS.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setDatePreset(p.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
                      datePreset === p.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TierFilterGroup
              label="조회수대비 구독전환"
              tiers={CONVERSION_TIERS}
              selected={viewToSubSelected}
              onToggle={toggleViewToSub}
            />
            <TierFilterGroup
              label="일평균 구독전환"
              tiers={CONVERSION_TIERS}
              selected={dailySubSelected}
              onToggle={toggleDailySub}
            />
          </div>

          <div className="mt-5 flex justify-end border-t border-slate-100 pt-4">
            <button
              type="button"
              onClick={resetFilters}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-50"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              필터 초기화
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          검색하는 중...
        </div>
      )}

      {!loading && hasSearched && results.length === 0 && !error && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-16 text-center">
          <Search className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">검색 결과가 없어요.</p>
        </div>
      )}

      {!loading && !hasSearched && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-16 text-center">
          <Search className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">
            주제어를 입력하면 관련 채널을 찾아드려요.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && viewMode === "table" && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="px-4 py-3 font-semibold">채널</th>
                <th className="px-4 py-3 text-right font-semibold">구독자</th>
                <th className="px-4 py-3 text-right font-semibold">영상수</th>
                <th className="px-4 py-3 font-semibold">조회수대비 구독전환</th>
                <th className="px-4 py-3 font-semibold">일평균 구독전환</th>
                <th className="px-4 py-3 font-semibold">개설일</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    조건에 맞는 채널이 없어요.
                  </td>
                </tr>
              )}
              {filteredResults.map((c) => (
                <tr key={c.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={c.channelUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3"
                    >
                      {c.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.thumbnailUrl}
                          alt={c.title}
                          className="h-9 w-9 flex-shrink-0 rounded-full object-cover"
                        />
                      )}
                      <span className="max-w-xs">
                        <span className="line-clamp-1 block font-semibold text-slate-700 hover:text-purple-700">
                          {c.title}
                        </span>
                        {c.handle && (
                          <span className="text-xs text-slate-400">{c.handle}</span>
                        )}
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatViews(c.subscriberCount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {c.videoCount}개
                  </td>
                  <td className="px-4 py-3">
                    <TierChip tier={c.viewToSubTier} />
                  </td>
                  <td className="px-4 py-3">
                    <TierChip tier={c.dailySubTier} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDate(c.createdAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleRegister(c)}
                      disabled={registeredIds.has(c.id)}
                      className={`flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-xs font-bold transition-colors duration-200 disabled:cursor-not-allowed ${
                        registeredIds.has(c.id)
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                      }`}
                    >
                      <Plus className="h-3 w-3" />
                      {registeredIds.has(c.id) ? "등록됨" : "등록"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && results.length > 0 && viewMode === "grid" && (
        <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {filteredResults.length === 0 && (
            <p className="col-span-full py-10 text-center text-sm text-slate-400">
              조건에 맞는 채널이 없어요.
            </p>
          )}
          {filteredResults.map((c) => (
            <div
              key={c.id}
              className="flex flex-col items-center gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              <a href={c.channelUrl} target="_blank" rel="noopener noreferrer">
                {c.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.thumbnailUrl}
                    alt={c.title}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
              </a>
              <a href={c.channelUrl} target="_blank" rel="noopener noreferrer">
                <p className="line-clamp-1 text-sm font-semibold text-slate-800 hover:text-purple-700">
                  {c.title}
                </p>
              </a>
              {c.handle && <p className="text-xs text-slate-400">{c.handle}</p>}
              <p className="text-sm font-bold text-slate-800">
                {formatViews(c.subscriberCount)} 구독자
              </p>
              <p className="text-xs text-slate-400">
                영상 {c.videoCount}개 · {formatDate(c.createdAt)} 개설
              </p>
              <div className="flex items-center gap-1.5">
                <TierChip tier={c.viewToSubTier} />
                <TierChip tier={c.dailySubTier} />
              </div>
              <button
                type="button"
                onClick={() => handleRegister(c)}
                disabled={registeredIds.has(c.id)}
                className={`mt-2 flex w-full items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition-colors duration-200 disabled:cursor-not-allowed ${
                  registeredIds.has(c.id)
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-purple-50 text-purple-700 hover:bg-purple-100"
                }`}
              >
                <Plus className="h-3 w-3" />
                {registeredIds.has(c.id) ? "등록됨" : "등록"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
