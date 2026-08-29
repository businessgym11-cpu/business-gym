"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  X,
  Loader2,
  ExternalLink,
  Bookmark,
  TrendingUp,
  TrendingDown,
  Sparkles,
  ArrowRight,
} from "lucide-react";
import {
  registerAndFetchChannel,
  analyzeBenchmark,
  type ResearchedChannel,
  type ResearchedVideo,
} from "./actions";
import {
  formatViews,
  formatDate,
  TierChip,
  InfoTooltip,
  METRIC_EXPLANATIONS,
} from "./shared";

export type VideoDetailInput = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  viewCount: number;
  likeCount: number | null;
  publishedAt: string | null;
  videoUrl: string;
  channelId: string | null;
  channelTitle: string | null;
  contributionTier: string | null;
  performanceTier: string | null;
};

type DetailTab = "video" | "channel" | "popular";

const BENCHMARK_HANDOFF_KEY = "bg_benchmark_handoff";

type BenchmarkState = {
  status: "idle" | "loading" | "done" | "error";
  analysis?: string;
  error?: string;
};

function PercentBadge({ percent }: { percent: number | null }) {
  if (percent === null) return null;
  const up = percent >= 0;
  return (
    <span
      className={`flex items-center gap-0.5 text-[11px] font-bold ${
        up ? "text-emerald-600" : "text-red-500"
      }`}
    >
      {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      평소보다 {up ? "높음" : "낮음"} ({up ? "+" : ""}
      {percent}%)
    </span>
  );
}

export default function VideoDetailModal({
  video,
  isSaved,
  saving,
  onToggleSave,
  onClose,
  preloadedChannel,
  preloadedChannelVideos,
}: {
  video: VideoDetailInput;
  isSaved: boolean;
  saving: boolean;
  onToggleSave: () => void;
  onClose: () => void;
  preloadedChannel?: ResearchedChannel | null;
  preloadedChannelVideos?: ResearchedVideo[];
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<DetailTab>("video");
  const [benchmark, setBenchmark] = useState<BenchmarkState>({ status: "idle" });
  const [channel, setChannel] = useState<ResearchedChannel | null>(
    preloadedChannel ?? null
  );
  const [channelVideos, setChannelVideos] = useState<ResearchedVideo[]>(
    preloadedChannelVideos ?? []
  );
  const [loadingChannel, setLoadingChannel] = useState(false);
  const [channelError, setChannelError] = useState("");

  useEffect(() => {
    if (preloadedChannel || !video.channelId) return;

    setLoadingChannel(true);
    registerAndFetchChannel(video.channelId).then((result) => {
      setLoadingChannel(false);
      if (!result.success) {
        setChannelError(result.error);
        return;
      }
      setChannel(result.channel);
      setChannelVideos(result.videos);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.channelId]);

  const handleAnalyzeBenchmark = async () => {
    setBenchmark({ status: "loading" });
    const result = await analyzeBenchmark({
      title: video.title,
      description: video.description,
      channelTitle: video.channelTitle,
      viewCount: video.viewCount,
      thumbnailUrl: video.thumbnailUrl,
    });
    if (!result.success) {
      setBenchmark({ status: "error", error: result.error });
      return;
    }
    setBenchmark({ status: "done", analysis: result.analysis });
  };

  const handleUseAnalysis = () => {
    if (benchmark.status !== "done" || !benchmark.analysis) return;
    sessionStorage.setItem(
      BENCHMARK_HANDOFF_KEY,
      JSON.stringify({ topic: video.title, benchmarkAnalysis: benchmark.analysis })
    );
    router.push(`/create?topic=${encodeURIComponent(video.title)}`);
  };

  const viewsPercent =
    channel?.avgViews != null && channel.avgViews > 0
      ? Math.round((video.viewCount / channel.avgViews - 1) * 100)
      : null;
  const likesPercent =
    channel?.avgLikes != null && channel.avgLikes > 0 && video.likeCount != null
      ? Math.round((video.likeCount / channel.avgLikes - 1) * 100)
      : null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 pt-4">
          <div className="flex gap-1">
            {(
              [
                { id: "video", label: "영상 정보" },
                { id: "channel", label: "채널 정보" },
                { id: "popular", label: "인기 영상" },
              ] as { id: DetailTab; label: string }[]
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`rounded-t-lg px-3 py-2 text-sm font-bold transition-colors duration-200 ${
                  activeTab === t.id
                    ? "border-b-2 border-purple-600 text-purple-700"
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="닫기"
            className="mb-2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === "video" && (
            <div>
              <div className="aspect-video w-full overflow-hidden rounded-xl bg-slate-100">
                {video.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={video.thumbnailUrl}
                    alt={video.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">
                {video.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                <span>{formatDate(video.publishedAt)}</span>
                {video.channelTitle && <span>· {video.channelTitle}</span>}
              </div>

              <div className="mt-3 flex gap-2">
                <a
                  href={video.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  유튜브에서 영상 보기
                </a>
                <button
                  type="button"
                  onClick={onToggleSave}
                  disabled={saving}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60 ${
                    isSaved
                      ? "bg-purple-50 text-purple-700"
                      : "bg-slate-50 text-slate-500 hover:bg-slate-100"
                  }`}
                >
                  {saving ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Bookmark className="h-3.5 w-3.5" fill={isSaved ? "currentColor" : "none"} />
                  )}
                  {isSaved ? "저장됨" : "저장"}
                </button>
              </div>

              {video.description && (
                <div className="mt-4 rounded-xl bg-slate-50 p-4">
                  <p className="text-xs font-bold text-slate-500">영상 설명</p>
                  <p className="mt-1.5 line-clamp-6 whitespace-pre-wrap text-xs leading-relaxed text-slate-600">
                    {video.description}
                  </p>
                </div>
              )}

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">조회수</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatViews(video.viewCount)}
                  </p>
                  <PercentBadge percent={viewsPercent} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="text-xs text-slate-400">좋아요</p>
                  <p className="mt-1 text-sm font-bold text-slate-800">
                    {formatViews(video.likeCount)}
                  </p>
                  <PercentBadge percent={likesPercent} />
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    주목도
                    <InfoTooltip text={METRIC_EXPLANATIONS["주목도"]} />
                  </p>
                  <div className="mt-1.5">
                    <TierChip tier={video.contributionTier} />
                  </div>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <p className="flex items-center gap-1 text-xs text-slate-400">
                    효율도
                    <InfoTooltip text={METRIC_EXPLANATIONS["효율도"]} />
                  </p>
                  <div className="mt-1.5">
                    <TierChip tier={video.performanceTier} />
                  </div>
                </div>
              </div>
              {(viewsPercent !== null || likesPercent !== null) && (
                <p className="mt-3 text-[11px] text-slate-400">
                  채널 평균 조회수·좋아요 대비 비교예요.
                </p>
              )}

              <div className="mt-4 border-t border-slate-100 pt-4">
                <button
                  type="button"
                  onClick={handleAnalyzeBenchmark}
                  disabled={benchmark.status === "loading"}
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-50 py-2.5 text-sm font-semibold text-purple-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {benchmark.status === "loading" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  {benchmark.status === "done" ? "다시 분석하기" : "AI 벤치마킹 분석하기"}
                </button>

                {benchmark.status === "done" && benchmark.analysis && (
                  <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs leading-relaxed whitespace-pre-wrap text-slate-600">
                    {benchmark.analysis}
                  </div>
                )}

                {benchmark.status === "error" && (
                  <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                    {benchmark.error}
                  </p>
                )}

                {benchmark.status === "done" && (
                  <button
                    type="button"
                    onClick={handleUseAnalysis}
                    className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
                  >
                    이 구조로 대본 만들기
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}

          {activeTab === "channel" && (
            <div>
              {loadingChannel && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  채널 정보를 불러오는 중...
                </div>
              )}
              {!loadingChannel && channelError && (
                <p className="py-10 text-center text-sm text-red-500">{channelError}</p>
              )}
              {!loadingChannel && channel && (
                <div>
                  <div className="flex items-center gap-3">
                    {channel.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={channel.thumbnailUrl}
                        alt={channel.title}
                        className="h-12 w-12 flex-shrink-0 rounded-full object-cover"
                      />
                    )}
                    <div className="flex-1">
                      <p className="font-bold text-slate-900">{channel.title}</p>
                      {channel.handle && (
                        <p className="text-xs text-slate-400">{channel.handle}</p>
                      )}
                    </div>
                    <a
                      href={`https://www.youtube.com/channel/${channel.youtubeChannelId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      채널 보기
                    </a>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">구독자</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatViews(channel.subscriberCount)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">총 영상수</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {channel.totalVideoCount ?? "-"}개
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">채널 개설</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatDate(channel.channelCreatedAt)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">누적 조회수</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatViews(channel.cumulativeViews)}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">평균 조회수</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatViews(
                          channel.avgViews != null ? Math.round(channel.avgViews) : null
                        )}
                      </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 p-3">
                      <p className="text-xs text-slate-400">평균 좋아요</p>
                      <p className="mt-1 text-sm font-bold text-slate-800">
                        {formatViews(
                          channel.avgLikes != null ? Math.round(channel.avgLikes) : null
                        )}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              {!loadingChannel && !channel && !channelError && (
                <p className="py-10 text-center text-sm text-slate-400">
                  채널 정보를 불러올 수 없어요.
                </p>
              )}
            </div>
          )}

          {activeTab === "popular" && (
            <div>
              {loadingChannel && (
                <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  불러오는 중...
                </div>
              )}
              {!loadingChannel && channelVideos.length === 0 && (
                <p className="py-10 text-center text-sm text-slate-400">
                  이 채널의 다른 영상을 찾을 수 없어요.
                </p>
              )}
              {!loadingChannel && channelVideos.length > 0 && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {channelVideos.slice(0, 9).map((v) => (
                    <a
                      key={v.id}
                      href={`https://www.youtube.com/watch?v=${v.youtubeVideoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col overflow-hidden rounded-xl border border-slate-100"
                    >
                      <div className="aspect-video w-full overflow-hidden bg-slate-100">
                        {v.thumbnailUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={v.thumbnailUrl}
                            alt={v.title}
                            className="h-full w-full object-cover"
                          />
                        )}
                      </div>
                      <div className="p-2">
                        <p className="line-clamp-2 text-xs font-semibold text-slate-700">
                          {v.title}
                        </p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-[11px] text-slate-400">
                            {formatViews(v.viewCount)}
                          </span>
                          <TierChip tier={v.contributionTier} />
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
