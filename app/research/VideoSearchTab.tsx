"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2, Search, Bookmark, SlidersHorizontal, RotateCcw } from "lucide-react";
import {
  searchVideos,
  listSavedVideos,
  saveVideo,
  unsaveVideo,
  type SearchedVideo,
} from "./actions";
import {
  formatViews,
  formatDate,
  TierChip,
  CONTRIBUTION_TIERS,
  PERFORMANCE_TIERS,
  DATE_PRESETS,
  TierFilterGroup,
  RangeFilter,
  useSearchHistory,
  SearchHistoryChips,
  ViewModeToggle,
  type ShortsFilter,
  type ViewMode,
} from "./shared";

export default function VideoSearchTab() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [error, setError] = useState("");

  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const { history, addTerm, removeTerm } = useSearchHistory("bg_video_search_history");

  const [showFilters, setShowFilters] = useState(false);
  const [minViews, setMinViews] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [minSubs, setMinSubs] = useState("");
  const [maxSubs, setMaxSubs] = useState("");
  const [minLikes, setMinLikes] = useState("");
  const [maxLikes, setMaxLikes] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [shortsFilter, setShortsFilter] = useState<ShortsFilter>("all");
  const [ccOnly, setCcOnly] = useState(false);
  const [contributionSelected, setContributionSelected] = useState<Set<string>>(
    new Set(CONTRIBUTION_TIERS)
  );
  const [performanceSelected, setPerformanceSelected] = useState<Set<string>>(
    new Set(PERFORMANCE_TIERS)
  );

  useEffect(() => {
    listSavedVideos().then((result) => {
      if (result.success) {
        setSavedVideoIds(new Set(result.videos.map((v) => v.youtubeVideoId)));
      }
    });
  }, []);

  const toggleContribution = (tier: string) => {
    setContributionSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const togglePerformance = (tier: string) => {
    setPerformanceSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tier)) next.delete(tier);
      else next.add(tier);
      return next;
    });
  };

  const resetFilters = () => {
    setMinViews("");
    setMaxViews("");
    setMinSubs("");
    setMaxSubs("");
    setMinLikes("");
    setMaxLikes("");
    setDatePreset("all");
    setShortsFilter("all");
    setCcOnly(false);
    setContributionSelected(new Set(CONTRIBUTION_TIERS));
    setPerformanceSelected(new Set(PERFORMANCE_TIERS));
  };

  const filtersActive =
    minViews !== "" ||
    maxViews !== "" ||
    minSubs !== "" ||
    maxSubs !== "" ||
    minLikes !== "" ||
    maxLikes !== "" ||
    datePreset !== "all" ||
    shortsFilter !== "all" ||
    ccOnly ||
    contributionSelected.size !== CONTRIBUTION_TIERS.length ||
    performanceSelected.size !== PERFORMANCE_TIERS.length;

  const runSearch = async (term: string) => {
    if (!term.trim()) {
      setError("검색할 키워드를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(true);
    resetFilters();

    const result = await searchVideos(term.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setResults(result.results);
    addTerm(term.trim());
  };

  const filteredResults = useMemo(() => {
    const minV = minViews ? Number(minViews) : null;
    const maxV = maxViews ? Number(maxViews) : null;
    const minS = minSubs ? Number(minSubs) : null;
    const maxS = maxSubs ? Number(maxSubs) : null;
    const minL = minLikes ? Number(minLikes) : null;
    const maxL = maxLikes ? Number(maxLikes) : null;
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    const cutoff =
      preset && preset.days ? Date.now() - preset.days * 24 * 60 * 60 * 1000 : null;

    return results.filter((v) => {
      if (minV !== null && v.viewCount < minV) return false;
      if (maxV !== null && v.viewCount > maxV) return false;
      if (minS !== null && (v.subscriberCount ?? 0) < minS) return false;
      if (maxS !== null && (v.subscriberCount ?? 0) > maxS) return false;
      if (minL !== null && v.likeCount < minL) return false;
      if (maxL !== null && v.likeCount > maxL) return false;
      if (cutoff !== null && v.publishedAt && new Date(v.publishedAt).getTime() < cutoff)
        return false;
      if (shortsFilter === "shorts" && !v.isShorts) return false;
      if (shortsFilter === "long" && v.isShorts) return false;
      if (ccOnly && !v.isCC) return false;
      if (!contributionSelected.has(v.contributionTier)) return false;
      if (v.performanceTier && !performanceSelected.has(v.performanceTier))
        return false;
      return true;
    });
  }, [
    results,
    minViews,
    maxViews,
    minSubs,
    maxSubs,
    minLikes,
    maxLikes,
    datePreset,
    shortsFilter,
    ccOnly,
    contributionSelected,
    performanceSelected,
  ]);

  const toggleSave = async (video: SearchedVideo) => {
    setSavingId(video.id);
    const isSaved = savedVideoIds.has(video.id);

    if (isSaved) {
      const result = await unsaveVideo(video.id);
      setSavingId(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(video.id);
        return next;
      });
      return;
    }

    const result = await saveVideo(
      {
        youtubeVideoId: video.id,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: video.channelTitle,
        viewCount: video.viewCount,
        publishedAt: video.publishedAt,
        contributionTier: video.contributionTier,
        performanceTier: video.performanceTier,
      },
      null
    );
    setSavingId(null);
    if (!result.success) {
      setError(result.error);
      return;
    }
    setSavedVideoIds((prev) => new Set(prev).add(video.id));
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
          placeholder="예: 여름 다이어트 레시피"
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
              label="조회수 범위"
              min={minViews}
              max={maxViews}
              onMinChange={setMinViews}
              onMaxChange={setMaxViews}
            />
            <RangeFilter
              label="구독자 범위"
              min={minSubs}
              max={maxSubs}
              onMinChange={setMinSubs}
              onMaxChange={setMaxSubs}
            />
            <RangeFilter
              label="좋아요 범위"
              min={minLikes}
              max={maxLikes}
              onMinChange={setMinLikes}
              onMaxChange={setMaxLikes}
            />

            <div>
              <p className="text-xs font-bold text-slate-500">게시일</p>
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

            <div>
              <p className="text-xs font-bold text-slate-500">영상 형식</p>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {(
                  [
                    { id: "all", label: "전체" },
                    { id: "shorts", label: "Shorts만" },
                    { id: "long", label: "롱폼만" },
                  ] as { id: ShortsFilter; label: string }[]
                ).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setShortsFilter(opt.id)}
                    className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
                      shortsFilter === opt.id
                        ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-bold text-slate-500">Creative Commons</p>
              <div className="mt-1.5">
                <button
                  type="button"
                  onClick={() => setCcOnly((v) => !v)}
                  className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
                    ccOnly
                      ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  CC만 보기
                </button>
              </div>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TierFilterGroup
              label="기여도"
              tiers={CONTRIBUTION_TIERS}
              selected={contributionSelected}
              onToggle={toggleContribution}
            />
            <TierFilterGroup
              label="성과도"
              tiers={PERFORMANCE_TIERS}
              selected={performanceSelected}
              onToggle={togglePerformance}
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
            키워드를 입력하면 유튜브 전체에서 영상을 찾아드려요.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && viewMode === "table" && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[860px] text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                <th className="px-4 py-3 font-semibold">영상</th>
                <th className="px-4 py-3 text-right font-semibold">조회수</th>
                <th className="px-4 py-3 text-right font-semibold">구독자</th>
                <th className="px-4 py-3 font-semibold">기여도</th>
                <th className="px-4 py-3 font-semibold">성과도</th>
                <th className="px-4 py-3 font-semibold">게시일</th>
                <th className="px-4 py-3 font-semibold"></th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-400">
                    조건에 맞는 영상이 없어요.
                  </td>
                </tr>
              )}
              {filteredResults.map((v) => (
                <tr key={v.id} className="border-b border-slate-50 last:border-0">
                  <td className="px-4 py-3">
                    <a
                      href={v.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3"
                    >
                      {v.thumbnailUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={v.thumbnailUrl}
                          alt={v.title}
                          className="h-11 w-20 flex-shrink-0 rounded-lg object-cover"
                        />
                      )}
                      <span className="max-w-xs">
                        <span className="line-clamp-2 block text-slate-700 hover:text-purple-700">
                          {v.title}
                          {v.isShorts && (
                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                              Shorts
                            </span>
                          )}
                          {v.isCC && (
                            <span className="ml-1.5 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-bold text-blue-500">
                              CC
                            </span>
                          )}
                        </span>
                        <span className="text-xs text-slate-400">
                          {v.channelTitle}
                        </span>
                      </span>
                    </a>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-slate-800">
                    {formatViews(v.viewCount)}
                  </td>
                  <td className="px-4 py-3 text-right text-slate-500">
                    {formatViews(v.subscriberCount)}
                  </td>
                  <td className="px-4 py-3">
                    <TierChip tier={v.contributionTier} />
                  </td>
                  <td className="px-4 py-3">
                    <TierChip tier={v.performanceTier} />
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-400">
                    {formatDate(v.publishedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => toggleSave(v)}
                      disabled={savingId === v.id}
                      aria-label="저장"
                      className={`flex items-center justify-center rounded-lg p-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        savedVideoIds.has(v.id)
                          ? "text-purple-600 hover:bg-purple-50"
                          : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                      }`}
                    >
                      {savingId === v.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Bookmark
                          className="h-4 w-4"
                          fill={savedVideoIds.has(v.id) ? "currentColor" : "none"}
                        />
                      )}
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
              조건에 맞는 영상이 없어요.
            </p>
          )}
          {filteredResults.map((v) => (
            <div
              key={v.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <a href={v.videoUrl} target="_blank" rel="noopener noreferrer">
                <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                  {v.thumbnailUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={v.thumbnailUrl}
                      alt={v.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {v.isShorts && (
                    <span className="absolute left-2 top-2 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      Shorts
                    </span>
                  )}
                  {v.isCC && (
                    <span className="absolute right-2 top-2 rounded bg-blue-500/90 px-1.5 py-0.5 text-[10px] font-bold text-white">
                      CC
                    </span>
                  )}
                </div>
              </a>
              <div className="flex flex-1 flex-col gap-1.5 p-3">
                <a href={v.videoUrl} target="_blank" rel="noopener noreferrer">
                  <p className="line-clamp-2 text-sm font-semibold text-slate-800 hover:text-purple-700">
                    {v.title}
                  </p>
                </a>
                <p className="text-xs text-slate-400">{v.channelTitle}</p>
                <div className="flex items-center gap-1.5">
                  <TierChip tier={v.contributionTier} />
                  <TierChip tier={v.performanceTier} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatViews(v.viewCount)} 조회</span>
                  <span>{formatDate(v.publishedAt)}</span>
                </div>
                <button
                  type="button"
                  onClick={() => toggleSave(v)}
                  disabled={savingId === v.id}
                  className={`mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    savedVideoIds.has(v.id)
                      ? "bg-purple-50 text-purple-700"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {savingId === v.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bookmark
                      className="h-3.5 w-3.5"
                      fill={savedVideoIds.has(v.id) ? "currentColor" : "none"}
                    />
                  )}
                  {savedVideoIds.has(v.id) ? "저장됨" : "저장"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
