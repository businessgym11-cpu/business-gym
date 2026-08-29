"use client";

import { useState } from "react";
import { Loader2, Search, Plus } from "lucide-react";
import { searchChannels, type SearchedChannel } from "./actions";
import { formatViews, formatDate, TierChip } from "./shared";

export default function ChannelSearchTab({
  onRegister,
}: {
  onRegister: (channelUrl: string) => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState<SearchedChannel[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [registeredIds, setRegisteredIds] = useState<Set<string>>(new Set());

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setError("검색할 주제어를 입력해주세요.");
      return;
    }
    setLoading(true);
    setError("");
    setHasSearched(true);

    const result = await searchChannels(keyword.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setResults(result.results);
  };

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
            if (e.key === "Enter") handleSearch();
          }}
          placeholder="예: 홈트레이닝, 자취 요리"
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
            주제어를 입력하면 관련 채널을 찾아드려요.
          </p>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
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
              {results.map((c) => (
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
    </div>
  );
}
