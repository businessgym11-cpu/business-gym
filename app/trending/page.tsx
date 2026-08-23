"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Zap,
  Play,
  Eye,
  ArrowRight,
  Loader2,
  Sparkles,
  TrendingUp,
  Users,
  Youtube,
  BarChart3,
} from "lucide-react";
import {
  getTrendResults,
  searchTrendLive,
  analyzeBenchmark,
  getSurgeVideos,
  analyzeChannel,
  type TrendResult,
  type SurgeVideo,
  type ChannelAnalysis,
} from "./actions";

function formatViews(count: number | null): string {
  if (count == null) return "-";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

type BenchmarkState = {
  status: "idle" | "loading" | "done" | "error";
  analysis?: string;
  error?: string;
};

const BENCHMARK_HANDOFF_KEY = "bg_benchmark_handoff";

function TrendCard({
  item,
  benchmark,
  onAnalyze,
  onUseAnalysis,
  rank,
  subscriberCount,
}: {
  item: TrendResult;
  benchmark: BenchmarkState;
  onAnalyze: () => void;
  onUseAnalysis: () => void;
  rank?: number;
  subscriberCount?: number | null;
}) {
  const busy = benchmark.status === "loading";

  return (
    <div className="flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md">
      <a
        href={item.videoUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="relative block aspect-[9/16] w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50"
      >
        {item.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.thumbnailUrl}
            alt={item.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm">
              <Play className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        )}
        {rank != null && (
          <span className="absolute top-2 left-2 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-xs font-extrabold text-white shadow-sm">
            {rank}
          </span>
        )}
        <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
          <Eye className="h-3 w-3" />
          {formatViews(item.viewCount)}
        </span>
      </a>

      <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
        {item.title}
      </p>

      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        {item.channelTitle && <span className="truncate">{item.channelTitle}</span>}
        {subscriberCount != null && (
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" />
            구독자 {formatViews(subscriberCount)}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">
          #{item.keyword}
        </span>
      </div>

      {benchmark.status === "done" && benchmark.analysis && (
        <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-slate-50 p-3 text-xs leading-relaxed text-slate-600 whitespace-pre-wrap">
          {benchmark.analysis}
        </div>
      )}

      {benchmark.status === "error" && (
        <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
          {benchmark.error}
        </p>
      )}

      <button
        type="button"
        onClick={onAnalyze}
        disabled={busy}
        className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 py-2.5 text-sm font-semibold text-purple-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Sparkles className="h-4 w-4" />
        )}
        {benchmark.status === "done" ? "다시 분석하기" : "구조 분석하기"}
      </button>

      {benchmark.status === "done" && (
        <button
          type="button"
          onClick={onUseAnalysis}
          className="mt-2 flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 py-2.5 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:scale-[1.02]"
        >
          이 구조로 대본 만들기
          <ArrowRight className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default function TrendingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<TrendResult[]>([]);
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [searchedKeyword, setSearchedKeyword] = useState("");
  const [benchmarks, setBenchmarks] = useState<Record<string, BenchmarkState>>(
    {}
  );

  const [showSurge, setShowSurge] = useState(false);
  const [surgeResults, setSurgeResults] = useState<SurgeVideo[]>([]);
  const [surgeSnapshotDate, setSurgeSnapshotDate] = useState<string | null>(
    null
  );
  const [surgeLoading, setSurgeLoading] = useState(false);
  const [surgeError, setSurgeError] = useState("");
  const [surgeBenchmarks, setSurgeBenchmarks] = useState<
    Record<string, BenchmarkState>
  >({});

  const [showChannelAnalysis, setShowChannelAnalysis] = useState(false);
  const [channelUrlInput, setChannelUrlInput] = useState("");
  const [channelResult, setChannelResult] = useState<ChannelAnalysis | null>(
    null
  );
  const [channelLoading, setChannelLoading] = useState(false);
  const [channelError, setChannelError] = useState("");

  const handleAnalyzeChannel = async () => {
    if (!channelUrlInput.trim()) {
      setChannelError("채널 URL 또는 @핸들을 입력해주세요.");
      return;
    }

    setChannelLoading(true);
    setChannelError("");
    setChannelResult(null);

    const result = await analyzeChannel(channelUrlInput.trim());
    setChannelLoading(false);

    if (!result.success) {
      setChannelError(result.error);
      return;
    }

    setChannelResult(result.data);
  };

  const runSearch = async (query?: string) => {
    setLoading(true);
    setHasSearched(true);
    setError("");
    setBenchmarks({});

    const trimmed = query?.trim();
    setSearchedKeyword(trimmed ?? "");

    if (trimmed) {
      const result = await searchTrendLive(trimmed);
      setLoading(false);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setResults(result.results);
      setSnapshotDate(null);
      return;
    }

    const result = await getTrendResults();
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setResults(result.results);
    setSnapshotDate(result.snapshotDate);
  };

  const handleAnalyze = async (item: TrendResult) => {
    setBenchmarks((prev) => ({ ...prev, [item.id]: { status: "loading" } }));

    const result = await analyzeBenchmark({
      title: item.title,
      description: item.description,
      channelTitle: item.channelTitle,
      viewCount: item.viewCount,
      thumbnailUrl: item.thumbnailUrl,
    });

    if (!result.success) {
      setBenchmarks((prev) => ({
        ...prev,
        [item.id]: { status: "error", error: result.error },
      }));
      return;
    }

    setBenchmarks((prev) => ({
      ...prev,
      [item.id]: { status: "done", analysis: result.analysis },
    }));
  };

  const handleUseAnalysis = (item: TrendResult) => {
    const benchmark = benchmarks[item.id];
    if (benchmark?.status !== "done" || !benchmark.analysis) return;

    sessionStorage.setItem(
      BENCHMARK_HANDOFF_KEY,
      JSON.stringify({ topic: item.title, benchmarkAnalysis: benchmark.analysis })
    );
    router.push(`/create?topic=${encodeURIComponent(item.title)}`);
  };

  const handleToggleSurge = async () => {
    if (showSurge) {
      setShowSurge(false);
      return;
    }

    setShowSurge(true);
    if (surgeResults.length > 0 || surgeLoading) return;

    setSurgeLoading(true);
    setSurgeError("");
    const result = await getSurgeVideos();
    setSurgeLoading(false);

    if (!result.success) {
      setSurgeError(result.error);
      return;
    }

    setSurgeResults(result.results);
    setSurgeSnapshotDate(result.snapshotDate);
  };

  const handleSurgeAnalyze = async (item: SurgeVideo) => {
    setSurgeBenchmarks((prev) => ({ ...prev, [item.id]: { status: "loading" } }));

    const result = await analyzeBenchmark({
      title: item.title,
      description: item.description,
      channelTitle: item.channelTitle,
      viewCount: item.viewCount,
      thumbnailUrl: item.thumbnailUrl,
    });

    if (!result.success) {
      setSurgeBenchmarks((prev) => ({
        ...prev,
        [item.id]: { status: "error", error: result.error },
      }));
      return;
    }

    setSurgeBenchmarks((prev) => ({
      ...prev,
      [item.id]: { status: "done", analysis: result.analysis },
    }));
  };

  const handleSurgeUseAnalysis = (item: SurgeVideo) => {
    const benchmark = surgeBenchmarks[item.id];
    if (benchmark?.status !== "done" || !benchmark.analysis) return;

    sessionStorage.setItem(
      BENCHMARK_HANDOFF_KEY,
      JSON.stringify({ topic: item.title, benchmarkAnalysis: benchmark.analysis })
    );
    router.push(`/create?topic=${encodeURIComponent(item.title)}`);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        트렌드 탐색기
      </h1>
      <p className="mt-2 text-slate-500">
        {snapshotDate
          ? `${snapshotDate} 기준, 유튜브 쇼츠에서 지금 잘 터지는 영상이에요.`
          : "어떤 주제든 검색해서 인기 영상을 찾고, AI로 구조를 분석해 보세요."}
      </p>

      {/* 검색 영역 */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 p-[2px] shadow-lg shadow-purple-500/20">
          <div className="flex w-full items-center gap-3 rounded-[15px] bg-white px-5 py-4">
            <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") runSearch(keyword);
              }}
              placeholder="어떤 주제든 검색해보세요. 예: 사주, 요리, 헬스, 육아"
              className="w-full border-none bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => runSearch(keyword)}
          disabled={loading}
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/30 active:scale-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Zap className="h-5 w-5" />
          )}
          AI 떡상 분석기 돌리기
        </button>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={handleToggleSurge}
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-colors duration-200 ${
            showSurge
              ? "border-purple-300 bg-purple-50"
              : "border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/50"
          }`}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 text-white">
            <TrendingUp className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-slate-800">
              지난주 급상승 TOP10
            </span>
            <span className="block text-xs text-slate-500">
              장르 무관, 구독자 대비 조회수가 튄 영상
            </span>
          </span>
          <span className="flex-shrink-0 text-xs font-semibold text-purple-600">
            {showSurge ? "접기" : "보기"}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setShowChannelAnalysis((v) => !v)}
          className={`flex items-center gap-3 rounded-2xl border px-5 py-4 text-left transition-colors duration-200 ${
            showChannelAnalysis
              ? "border-purple-300 bg-purple-50"
              : "border-slate-200 bg-white hover:border-purple-200 hover:bg-purple-50/50"
          }`}
        >
          <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-blue-500 text-white">
            <BarChart3 className="h-5 w-5" />
          </span>
          <span className="flex-1">
            <span className="block text-sm font-bold text-slate-800">
              내 채널 분석
            </span>
            <span className="block text-xs text-slate-500">
              내 유튜브 채널을 AI가 진단하고 팁을 줘요
            </span>
          </span>
          <span className="flex-shrink-0 text-xs font-semibold text-purple-600">
            {showChannelAnalysis ? "접기" : "보기"}
          </span>
        </button>
      </div>

      {showChannelAnalysis && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-6">
          <p className="text-sm text-slate-500">
            내 유튜브 채널의 공개 데이터를 AI가 분석해서 조회수·매출을 높일
            구체적인 팁을 알려드려요. 로그인 없이 채널 URL만 입력하면 돼요.
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <div className="flex flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3">
              <Youtube className="h-4 w-4 flex-shrink-0 text-red-500" />
              <input
                type="text"
                value={channelUrlInput}
                onChange={(e) => setChannelUrlInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAnalyzeChannel();
                }}
                placeholder="예: youtube.com/@채널명 또는 @핸들"
                className="w-full border-none bg-transparent text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAnalyzeChannel}
              disabled={channelLoading}
              className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {channelLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              분석하기
            </button>
          </div>

          {channelError && (
            <p className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {channelError}
            </p>
          )}

          {channelResult && (
            <div className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                {channelResult.channel.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={channelResult.channel.thumbnailUrl}
                    alt={channelResult.channel.title}
                    className="h-16 w-16 rounded-full object-cover"
                  />
                )}
                <div>
                  <p className="text-base font-bold text-slate-800">
                    {channelResult.channel.title}
                  </p>
                  <p className="text-xs text-slate-500">
                    구독자 {formatViews(channelResult.channel.subscriberCount)}{" "}
                    · 총 조회수 {formatViews(channelResult.channel.viewCount)}{" "}
                    · 영상 {formatViews(channelResult.channel.videoCount)}개
                  </p>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: "최근 평균 조회수",
                    value: formatViews(channelResult.metrics.avgViews),
                  },
                  {
                    label: "평균 업로드 간격",
                    value:
                      channelResult.metrics.avgUploadIntervalDays != null
                        ? `${channelResult.metrics.avgUploadIntervalDays}일`
                        : "-",
                  },
                  {
                    label: "평균 참여율",
                    value: `${channelResult.metrics.avgEngagementRate}%`,
                  },
                  {
                    label: "숏폼 비중",
                    value: `${channelResult.metrics.shortsRatio}%`,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-xl bg-purple-50 px-3 py-3 text-center"
                  >
                    <p className="text-lg font-extrabold text-purple-700">
                      {stat.value}
                    </p>
                    <p className="mt-0.5 text-[11px] text-slate-500">
                      {stat.label}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl bg-slate-50 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-700">
                {channelResult.analysis}
              </div>
            </div>
          )}
        </div>
      )}

      {showSurge && (
        <div className="mt-6 rounded-2xl bg-slate-50 p-6">
          <p className="text-sm text-slate-500">
            장르 무관, 최근 7일간 구독자 수 대비 조회수가 가장 많이 튄 영상
            TOP10이에요.
          </p>

          {surgeLoading && (
            <div className="mt-6 flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              불러오는 중...
            </div>
          )}

          {!surgeLoading && surgeError && (
            <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {surgeError}
            </p>
          )}

          {!surgeLoading && !surgeError && surgeResults.length === 0 && (
            <p className="mt-6 rounded-xl bg-white px-4 py-6 text-center text-sm text-slate-500">
              아직 급상승 데이터가 없어요.
            </p>
          )}

          {!surgeLoading && surgeResults.length > 0 && (
            <>
              {surgeSnapshotDate && (
                <p className="mt-1 text-xs text-slate-400">
                  {surgeSnapshotDate} 기준
                </p>
              )}
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {surgeResults.map((item) => (
                  <TrendCard
                    key={item.id}
                    item={{
                      id: item.id,
                      keyword: item.keyword ?? "",
                      title: item.title,
                      description: item.description,
                      channelTitle: item.channelTitle,
                      thumbnailUrl: item.thumbnailUrl,
                      viewCount: item.viewCount,
                      videoUrl: item.videoUrl,
                      publishedAt: item.publishedAt,
                    }}
                    rank={item.rank ?? undefined}
                    subscriberCount={item.subscriberCount}
                    benchmark={surgeBenchmarks[item.id] ?? { status: "idle" }}
                    onAnalyze={() => handleSurgeAnalyze(item)}
                    onUseAnalysis={() => handleSurgeUseAnalysis(item)}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && hasSearched && results.length === 0 && (
        <p className="mt-12 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          {searchedKeyword
            ? `"${searchedKeyword}"에 대한 검색 결과가 없어요. 다른 키워드로 시도해보세요.`
            : "아직 수집된 트렌드 데이터가 없어요. 매일 아침 자동으로 새로 업데이트돼요."}
        </p>
      )}

      {!loading && !error && !hasSearched && (
        <div className="mt-12 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-14 text-center">
          <Search className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">
            키워드를 검색하면 인기 영상을 찾아드려요.
          </p>
        </div>
      )}

      {/* 분석 결과 그리드 */}
      {results.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {results.map((item) => (
            <TrendCard
              key={item.id}
              item={item}
              benchmark={benchmarks[item.id] ?? { status: "idle" }}
              onAnalyze={() => handleAnalyze(item)}
              onUseAnalysis={() => handleUseAnalysis(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
