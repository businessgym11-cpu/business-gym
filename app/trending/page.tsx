"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Zap, Play, Eye, ArrowRight, Loader2 } from "lucide-react";
import { getTrendResults, type TrendResult } from "./actions";

function formatViews(count: number | null): string {
  if (count == null) return "-";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

export default function TrendingPage() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<TrendResult[]>([]);
  const [snapshotDate, setSnapshotDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const runSearch = async (query?: string) => {
    setLoading(true);
    setError("");
    const result = await getTrendResults(query);
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setResults(result.results);
    setSnapshotDate(result.snapshotDate);
  };

  useEffect(() => {
    runSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        트렌드 탐색기
      </h1>
      <p className="mt-2 text-slate-500">
        {snapshotDate
          ? `${snapshotDate} 기준, 유튜브 쇼츠에서 지금 잘 터지는 영상이에요.`
          : "지금 가장 잘 터지는 숏폼의 구조를 AI가 분석해 드려요."}
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
              placeholder="분석할 키워드를 입력하세요. 예: 사주, 재물운, 타로"
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

      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error}
        </p>
      )}

      {!loading && !error && results.length === 0 && (
        <p className="mt-12 rounded-xl bg-slate-50 px-4 py-6 text-center text-sm text-slate-500">
          아직 수집된 트렌드 데이터가 없어요. 매일 아침 자동으로 새로 업데이트돼요.
        </p>
      )}

      {/* 분석 결과 그리드 */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {results.map((item) => (
          <div
            key={item.id}
            className="flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
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
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
                <Eye className="h-3 w-3" />
                {formatViews(item.viewCount)}
              </span>
            </a>

            <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
              {item.title}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="rounded-full bg-purple-50 px-2.5 py-1 text-xs font-medium text-purple-600">
                #{item.keyword}
              </span>
            </div>

            <button
              type="button"
              onClick={() =>
                router.push(`/create?topic=${encodeURIComponent(item.title)}`)
              }
              className="mt-4 flex items-center justify-center gap-1.5 rounded-xl bg-purple-50 py-2.5 text-sm font-semibold text-purple-700 transition-all duration-200 hover:bg-gradient-to-r hover:from-purple-600 hover:to-blue-500 hover:text-white"
            >
              이 구조로 바로 릴스 만들기
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
