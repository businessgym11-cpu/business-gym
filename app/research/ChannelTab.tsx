"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  RefreshCcw,
  Users,
  Film,
  Eye,
  ThumbsUp,
  Calendar,
  SlidersHorizontal,
  RotateCcw,
  Bookmark,
} from "lucide-react";
import {
  registerAndFetchChannel,
  listResearchedChannels,
  getChannelVideos,
  listSavedVideos,
  saveVideo,
  unsaveVideo,
  type ResearchedChannel,
  type ResearchedVideo,
} from "./actions";
import {
  formatViews,
  formatDate,
  daysElapsed,
  TierChip,
  CONTRIBUTION_TIERS,
  PERFORMANCE_TIERS,
  DATE_PRESETS,
  TierFilterGroup,
  ViewModeToggle,
  type ShortsFilter,
  type ViewMode,
} from "./shared";

export default function ChannelTab({
  autoRegisterInput,
}: {
  autoRegisterInput: { value: string; nonce: number } | null;
}) {
  const [channels, setChannels] = useState<ResearchedChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ResearchedChannel | null>(
    null
  );
  const [videos, setVideos] = useState<ResearchedVideo[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>("table");

  const [channelInput, setChannelInput] = useState("");
  const [registering, setRegistering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(true);

  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  const [showFilters, setShowFilters] = useState(false);
  const [minViews, setMinViews] = useState("");
  const [maxViews, setMaxViews] = useState("");
  const [datePreset, setDatePreset] = useState("all");
  const [shortsFilter, setShortsFilter] = useState<ShortsFilter>("all");
  const [contributionSelected, setContributionSelected] = useState<Set<string>>(
    new Set(CONTRIBUTION_TIERS)
  );
  const [performanceSelected, setPerformanceSelected] = useState<Set<string>>(
    new Set(PERFORMANCE_TIERS)
  );

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
    setDatePreset("all");
    setShortsFilter("all");
    setContributionSelected(new Set(CONTRIBUTION_TIERS));
    setPerformanceSelected(new Set(PERFORMANCE_TIERS));
  };

  const filtersActive =
    minViews !== "" ||
    maxViews !== "" ||
    datePreset !== "all" ||
    shortsFilter !== "all" ||
    contributionSelected.size !== CONTRIBUTION_TIERS.length ||
    performanceSelected.size !== PERFORMANCE_TIERS.length;

  const filteredVideos = useMemo(() => {
    const min = minViews ? Number(minViews) : null;
    const max = maxViews ? Number(maxViews) : null;
    const preset = DATE_PRESETS.find((p) => p.id === datePreset);
    const cutoff =
      preset && preset.days
        ? Date.now() - preset.days * 24 * 60 * 60 * 1000
        : null;

    return videos.filter((v) => {
      if (min !== null && v.viewCount < min) return false;
      if (max !== null && v.viewCount > max) return false;
      if (cutoff !== null && v.publishedAt && new Date(v.publishedAt).getTime() < cutoff)
        return false;
      if (shortsFilter === "shorts" && !v.isShorts) return false;
      if (shortsFilter === "long" && v.isShorts) return false;
      if (v.contributionTier && !contributionSelected.has(v.contributionTier))
        return false;
      if (v.performanceTier && !performanceSelected.has(v.performanceTier))
        return false;
      return true;
    });
  }, [
    videos,
    minViews,
    maxViews,
    datePreset,
    shortsFilter,
    contributionSelected,
    performanceSelected,
  ]);

  const selectChannel = async (channel: ResearchedChannel) => {
    setActiveChannel(channel);
    setSwitching(true);
    setError("");
    const result = await getChannelVideos(channel.id);
    setSwitching(false);
    if (result.success) {
      setVideos(result.videos);
      resetFilters();
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async (overrideValue?: string) => {
    const value = overrideValue ?? channelInput;
    if (!value.trim()) {
      setError("채널 URL이나 @핸들을 입력해주세요.");
      return;
    }
    setRegistering(true);
    setError("");

    const result = await registerAndFetchChannel(value.trim());
    setRegistering(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setChannelInput("");
    setActiveChannel(result.channel);
    setVideos(result.videos);
    resetFilters();
    setChannels((prev) => {
      const withoutDup = prev.filter((c) => c.id !== result.channel.id);
      return [result.channel, ...withoutDup];
    });
  };

  const handleRefresh = async () => {
    if (!activeChannel) return;
    setRefreshing(true);
    setError("");

    const result = await registerAndFetchChannel(activeChannel.youtubeChannelId);
    setRefreshing(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setActiveChannel(result.channel);
    setVideos(result.videos);
    setChannels((prev) =>
      prev.map((c) => (c.id === result.channel.id ? result.channel : c))
    );
  };

  useEffect(() => {
    listResearchedChannels().then((result) => {
      setLoadingList(false);
      if (result.success) {
        setChannels(result.channels);
        if (result.channels.length > 0) {
          selectChannel(result.channels[0]);
        }
      }
    });
    listSavedVideos().then((result) => {
      if (result.success) {
        setSavedVideoIds(new Set(result.videos.map((v) => v.youtubeVideoId)));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (autoRegisterInput) {
      handleRegister(autoRegisterInput.value);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoRegisterInput?.nonce]);

  const toggleSave = async (video: ResearchedVideo, channel: ResearchedChannel) => {
    setSavingId(video.id);
    const isSaved = savedVideoIds.has(video.youtubeVideoId);

    if (isSaved) {
      const result = await unsaveVideo(video.youtubeVideoId);
      setSavingId(null);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setSavedVideoIds((prev) => {
        const next = new Set(prev);
        next.delete(video.youtubeVideoId);
        return next;
      });
      return;
    }

    const result = await saveVideo(
      {
        youtubeVideoId: video.youtubeVideoId,
        title: video.title,
        thumbnailUrl: video.thumbnailUrl,
        channelTitle: channel.title,
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
    setSavedVideoIds((prev) => new Set(prev).add(video.youtubeVideoId));
  };

  const elapsed = activeChannel ? daysElapsed(activeChannel.channelCreatedAt) : null;

  return (
    <div>
      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <input
          type="text"
          value={channelInput}
          onChange={(e) => setChannelInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRegister();
          }}
          placeholder="예: youtube.com/@채널명 또는 @핸들"
          className="w-full flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
        <button
          type="button"
          onClick={() => handleRegister()}
          disabled={registering}
          className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {registering ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
          채널 등록
        </button>
      </div>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
      )}

      {!loadingList && channels.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {channels.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectChannel(c)}
              className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
                activeChannel?.id === c.id
                  ? "border-purple-400 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>
      )}

      {switching && (
        <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중...
        </div>
      )}

      {!switching && activeChannel && (
        <>
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {activeChannel.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeChannel.thumbnailUrl}
                    alt={activeChannel.title}
                    className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                  />
                )}
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {activeChannel.title}
                  </h2>
                  {activeChannel.handle && (
                    <p className="text-xs text-slate-400">{activeChannel.handle}</p>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {refreshing ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <RefreshCcw className="h-3.5 w-3.5" />
                )}
                최신화
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Users className="h-3 w-3" /> 구독자
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatViews(activeChannel.subscriberCount)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Film className="h-3 w-3" /> 총 영상수
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {activeChannel.totalVideoCount ?? "-"}개
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Calendar className="h-3 w-3" /> 채널 개설
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatDate(activeChannel.channelCreatedAt)}
                </p>
                {elapsed !== null && (
                  <p className="text-[11px] text-slate-400">{elapsed}일 경과</p>
                )}
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Eye className="h-3 w-3" /> 누적 조회수
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatViews(activeChannel.cumulativeViews)}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <ThumbsUp className="h-3 w-3" /> 평균 좋아요
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatViews(
                    activeChannel.avgLikes != null
                      ? Math.round(activeChannel.avgLikes)
                      : null
                  )}
                </p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3">
                <p className="flex items-center gap-1 text-xs text-slate-400">
                  <Eye className="h-3 w-3" /> 평균 조회수
                </p>
                <p className="mt-1 text-sm font-bold text-slate-800">
                  {formatViews(
                    activeChannel.avgViews != null
                      ? Math.round(activeChannel.avgViews)
                      : null
                  )}
                </p>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-400">
              최근 영상 최대 50개 기준으로 집계돼요. 주목도·효율도는 정확한 값이
              아니라 이 채널 안에서의 상대적인 근사 등급이에요.
            </p>
          </div>

          <div className="mt-6 flex items-center justify-between gap-3">
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
              전체 {videos.length}개 중 {filteredVideos.length}개 표시
            </p>
          </div>

          {showFilters && (
            <div className="mt-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs font-bold text-slate-500">조회수 범위</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <input
                      type="number"
                      value={minViews}
                      onChange={(e) => setMinViews(e.target.value)}
                      placeholder="최소"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
                    />
                    <span className="text-slate-300">~</span>
                    <input
                      type="number"
                      value={maxViews}
                      onChange={(e) => setMaxViews(e.target.value)}
                      placeholder="최대"
                      className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none"
                    />
                  </div>
                </div>

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

                <button
                  type="button"
                  onClick={resetFilters}
                  className="flex h-fit items-center gap-1.5 self-end justify-self-start rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 transition-colors duration-200 hover:bg-slate-50 sm:justify-self-end"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  필터 초기화
                </button>
              </div>

              <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
                <TierFilterGroup
                  label="주목도"
                  tiers={CONTRIBUTION_TIERS}
                  selected={contributionSelected}
                  onToggle={toggleContribution}
                />
                <TierFilterGroup
                  label="효율도"
                  tiers={PERFORMANCE_TIERS}
                  selected={performanceSelected}
                  onToggle={togglePerformance}
                />
              </div>
            </div>
          )}

          {viewMode === "table" && (
          <div className="mt-3 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-semibold">영상</th>
                  <th className="px-4 py-3 text-right font-semibold">조회수</th>
                  <th className="px-4 py-3 font-semibold">주목도</th>
                  <th className="px-4 py-3 font-semibold">효율도</th>
                  <th className="px-4 py-3 font-semibold">게시일</th>
                  <th className="px-4 py-3 font-semibold"></th>
                </tr>
              </thead>
              <tbody>
                {filteredVideos.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-sm text-slate-400">
                      조건에 맞는 영상이 없어요.
                    </td>
                  </tr>
                )}
                {filteredVideos.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {v.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="h-11 w-20 flex-shrink-0 rounded-lg object-cover"
                          />
                        )}
                        <span className="line-clamp-2 max-w-xs text-slate-700">
                          {v.title}
                          {v.isShorts && (
                            <span className="ml-1.5 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-400">
                              Shorts
                            </span>
                          )}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-slate-800">
                      {formatViews(v.viewCount)}
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
                        onClick={() => toggleSave(v, activeChannel)}
                        disabled={savingId === v.id}
                        aria-label="저장"
                        className={`flex items-center justify-center rounded-lg p-2 transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                          savedVideoIds.has(v.youtubeVideoId)
                            ? "text-purple-600 hover:bg-purple-50"
                            : "text-slate-300 hover:bg-slate-100 hover:text-slate-500"
                        }`}
                      >
                        {savingId === v.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Bookmark
                            className="h-4 w-4"
                            fill={
                              savedVideoIds.has(v.youtubeVideoId)
                                ? "currentColor"
                                : "none"
                            }
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

          {viewMode === "grid" && (
            <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {filteredVideos.length === 0 && (
                <p className="col-span-full py-10 text-center text-sm text-slate-400">
                  조건에 맞는 영상이 없어요.
                </p>
              )}
              {filteredVideos.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
                >
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
                  </div>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                      {v.title}
                    </p>
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
                      onClick={() => toggleSave(v, activeChannel)}
                      disabled={savingId === v.id}
                      className={`mt-2 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                        savedVideoIds.has(v.youtubeVideoId)
                          ? "bg-purple-50 text-purple-700"
                          : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                      }`}
                    >
                      {savingId === v.id ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Bookmark
                          className="h-3.5 w-3.5"
                          fill={
                            savedVideoIds.has(v.youtubeVideoId) ? "currentColor" : "none"
                          }
                        />
                      )}
                      {savedVideoIds.has(v.youtubeVideoId) ? "저장됨" : "저장"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {!loadingList && !switching && channels.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-16 text-center">
          <Search className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">
            아직 등록된 채널이 없어요. 위에 채널 URL이나 핸들을 입력해보세요.
          </p>
        </div>
      )}
    </div>
  );
}
