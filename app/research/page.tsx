"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Search,
  RefreshCcw,
  Users,
  Film,
  Eye,
  ThumbsUp,
  Calendar,
} from "lucide-react";
import {
  registerAndFetchChannel,
  listResearchedChannels,
  getChannelVideos,
  type ResearchedChannel,
  type ResearchedVideo,
} from "./actions";

function formatViews(count: number | null): string {
  if (count == null) return "-";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysElapsed(iso: string | null): number | null {
  if (!iso) return null;
  const diff = Date.now() - new Date(iso).getTime();
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
}

const TIER_STYLES: Record<string, string> = {
  worst: "bg-red-50 text-red-600",
  bad: "bg-orange-50 text-orange-600",
  normal: "bg-slate-100 text-slate-500",
  good: "bg-emerald-50 text-emerald-600",
  great: "bg-purple-50 text-purple-700",
};

const TIER_LABELS: Record<string, string> = {
  worst: "Worst",
  bad: "Bad",
  normal: "Normal",
  good: "Good",
  great: "Great",
};

function TierChip({ tier }: { tier: string | null }) {
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

export default function ResearchPage() {
  const [channels, setChannels] = useState<ResearchedChannel[]>([]);
  const [activeChannel, setActiveChannel] = useState<ResearchedChannel | null>(
    null
  );
  const [videos, setVideos] = useState<ResearchedVideo[]>([]);

  const [channelInput, setChannelInput] = useState("");
  const [registering, setRegistering] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [switching, setSwitching] = useState(false);
  const [error, setError] = useState("");
  const [loadingList, setLoadingList] = useState(true);

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectChannel = async (channel: ResearchedChannel) => {
    setActiveChannel(channel);
    setSwitching(true);
    setError("");
    const result = await getChannelVideos(channel.id);
    setSwitching(false);
    if (result.success) {
      setVideos(result.videos);
    } else {
      setError(result.error);
    }
  };

  const handleRegister = async () => {
    if (!channelInput.trim()) {
      setError("채널 URL이나 @핸들을 입력해주세요.");
      return;
    }
    setRegistering(true);
    setError("");

    const result = await registerAndFetchChannel(channelInput.trim());
    setRegistering(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setChannelInput("");
    setActiveChannel(result.channel);
    setVideos(result.videos);
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

  const elapsed = activeChannel ? daysElapsed(activeChannel.channelCreatedAt) : null;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        채널 리서치
      </h1>
      <p className="mt-2 text-slate-500">
        관심 있는 채널을 등록해두고, 전체 영상을 조회수 순으로 탐색하며
        어떤 영상이 왜 잘 됐는지 살펴보세요.
      </p>

      <div className="mt-6 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
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
          onClick={handleRegister}
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
              최근 영상 최대 50개 기준으로 집계돼요. 기여도·성과도는 정확한 값이
              아니라 이 채널 안에서의 상대적인 근사 등급이에요.
            </p>
          </div>

          <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-slate-100 text-left text-xs text-slate-400">
                  <th className="px-4 py-3 font-semibold">영상</th>
                  <th className="px-4 py-3 text-right font-semibold">조회수</th>
                  <th className="px-4 py-3 font-semibold">기여도</th>
                  <th className="px-4 py-3 font-semibold">성과도</th>
                  <th className="px-4 py-3 font-semibold">게시일</th>
                </tr>
              </thead>
              <tbody>
                {videos.map((v) => (
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
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
