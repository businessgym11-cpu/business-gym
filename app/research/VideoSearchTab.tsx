"use client";

import { useEffect, useState } from "react";
import { Loader2, Search, Bookmark } from "lucide-react";
import {
  searchVideos,
  listSavedVideos,
  saveVideo,
  unsaveVideo,
  type SearchedVideo,
} from "./actions";
import { formatViews, formatDate, TierChip } from "./shared";

export default function VideoSearchTab() {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchedVideo[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");

  const [savedVideoIds, setSavedVideoIds] = useState<Set<string>>(new Set());
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    listSavedVideos().then((result) => {
      if (result.success) {
        setSavedVideoIds(new Set(result.videos.map((v) => v.youtubeVideoId)));
      }
    });
  }, []);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError("검색할 키워드를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(true);

    const result = await searchVideos(keyword.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setResults(result.results);
  };

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
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="예: 여름 다이어트 레시피"
          className="w-full flex-1 rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
        <button
          type="button"
          onClick={handleSearch}
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

      {error && (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
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

      {!loading && results.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full min-w-[820px] text-sm">
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
              {results.map((v) => (
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
    </div>
  );
}
