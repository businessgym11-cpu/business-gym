import { Search, Zap, Play, Eye, ArrowRight } from "lucide-react";

const trendResults = [
  {
    title: "이 사주만 있으면 평생 돈 걱정 없어요",
    views: "1.2M",
  },
  {
    title: "오늘의 운세, 당신에게 필요한 한 마디",
    views: "890K",
  },
  {
    title: "손금으로 보는 나의 연애운 TOP3",
    views: "654K",
  },
  {
    title: "타로카드가 말해주는 이번 주 재물운",
    views: "1.5M",
  },
];

const tags = [
  { label: "🔥 3초 훅: 질문형", className: "bg-orange-50 text-orange-600" },
  { label: "📖 전개: 공감 대화형", className: "bg-blue-50 text-blue-600" },
  { label: "🎯 CTA: 프로필 링크 유도", className: "bg-purple-50 text-purple-600" },
];

export default function TrendingPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        트렌드 탐색기
      </h1>
      <p className="mt-2 text-slate-500">
        지금 가장 잘 터지는 숏폼의 구조를 AI가 분석해 드려요.
      </p>

      {/* 검색 영역 */}
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 p-[2px] shadow-lg shadow-purple-500/20">
          <div className="flex w-full items-center gap-3 rounded-[15px] bg-white px-5 py-4">
            <Search className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <input
              type="text"
              placeholder="분석할 키워드를 입력하세요. 예: 30대 이직운, 재물운"
              className="w-full border-none bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </div>

        <button
          type="button"
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 font-bold text-white shadow-lg shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] hover:shadow-xl hover:shadow-purple-500/30 active:scale-100"
        >
          <Zap className="h-5 w-5" />
          AI 떡상 분석기 돌리기
        </button>
      </div>

      {/* 분석 결과 그리드 */}
      <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {trendResults.map(({ title, views }) => (
          <div
            key={title}
            className="flex flex-col rounded-2xl bg-white p-4 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 shadow-sm">
                  <Play className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-1 text-xs font-medium text-white">
                <Eye className="h-3 w-3" />
                {views}
              </span>
            </div>

            <p className="mt-3 line-clamp-2 text-sm font-semibold text-slate-800">
              {title}
            </p>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag.label}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${tag.className}`}
                >
                  {tag.label}
                </span>
              ))}
            </div>

            <button
              type="button"
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
