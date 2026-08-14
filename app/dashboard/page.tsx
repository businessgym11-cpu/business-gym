import {
  Clapperboard,
  Eye,
  Users,
  ArrowUpRight,
  Play,
  Download,
} from "lucide-react";

const statCards = [
  {
    icon: Clapperboard,
    label: "이번 달 릴스 생성",
    value: "45",
    suffix: " / 90개",
    progress: 50,
  },
  {
    icon: Eye,
    label: "인스타그램 누적 조회수",
    value: "124,500",
    suffix: "회",
    growth: "+12.4%",
  },
  {
    icon: Users,
    label: "오늘 유입된 트래픽",
    value: "320",
    suffix: "명",
    growth: "+8.1%",
  },
];

const recentContents = [
  {
    title: "2026년 갑진년 신년 재물운 대공개",
    date: "2026.08.12",
  },
  {
    title: "이 손금 있으면 무조건 성공한다",
    date: "2026.08.10",
  },
  {
    title: "오늘 하루 타로 한 장, 당신에게 필요한 메시지",
    date: "2026.08.08",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        안녕하세요, 파트너님! 오늘 하루도 떡상하는 하루 되세요 🚀
      </h1>

      {/* Stat Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        {statCards.map(({ icon: Icon, label, value, suffix, progress, growth }) => (
          <div
            key={label}
            className="rounded-2xl bg-white p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-sm shadow-purple-500/20">
                <Icon className="h-5 w-5" />
              </div>
              {growth && (
                <span className="flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-1 text-xs font-semibold text-emerald-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  {growth}
                </span>
              )}
            </div>

            <p className="mt-5 text-sm font-medium text-slate-500">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-slate-900">
              {value}
              <span className="ml-1 text-base font-semibold text-slate-400">
                {suffix}
              </span>
            </p>

            {typeof progress === "number" && (
              <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-purple-600 to-blue-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 최근 생성한 숏폼 콘텐츠 */}
      <div className="mt-12">
        <h2 className="text-lg font-bold text-slate-900">
          최근 생성한 숏폼 콘텐츠
        </h2>

        <div className="mt-4 divide-y divide-slate-100 rounded-2xl bg-white shadow-sm">
          {recentContents.map(({ title, date }) => (
            <div
              key={title}
              className="flex items-center gap-4 p-5 transition-colors duration-200 hover:bg-slate-50"
            >
              <div className="flex h-16 w-11 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-purple-100 via-blue-50 to-purple-50">
                <Play className="h-5 w-5 text-purple-500" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-800">
                  {title}
                </p>
                <p className="mt-1 text-sm text-slate-400">{date} 생성</p>
              </div>

              <button
                type="button"
                className="flex flex-shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 px-3.5 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
              >
                <Download className="h-4 w-4" />
                다운로드
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
