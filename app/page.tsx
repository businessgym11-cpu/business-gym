import Link from "next/link";
import {
  Sparkles,
  PlayCircle,
  Clock,
  MousePointerClick,
  Send,
  Type,
  Clapperboard,
  Rocket,
  Check,
  ArrowDown,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

const problems = [
  {
    icon: Clock,
    before: "아직도 대본 쓰느라 밤새시나요?",
    after: "AI가 떡상 구조 대본 3초 만에 생성",
  },
  {
    icon: MousePointerClick,
    before: "영상 편집 프로그램이 어려우신가요?",
    after: "복잡한 타임라인 없이 3단계 클릭만으로 렌더링",
  },
  {
    icon: Send,
    before: "매일 업로드하기 귀찮으신가요?",
    after: "인스타그램, 유튜브 쇼츠 자동/예약 발행",
  },
];

const steps = [
  {
    icon: Type,
    title: "키워드 입력 & AI 대본 기획",
    desc: "핵심 키워드 하나만 입력하면 AI가 떡상 공식에 맞춘 대본을 기획해요.",
  },
  {
    icon: Clapperboard,
    title: "씬별 이미지 & AI 모션 매칭",
    desc: "장면마다 어울리는 이미지와 토킹헤드 AI 모션을 자동으로 매칭해요.",
  },
  {
    icon: Rocket,
    title: "원클릭 영상 믹싱 & 자동 발행",
    desc: "버튼 한 번으로 믹싱을 끝내고 SNS 채널에 자동으로 업로드해요.",
  },
];

const benefits = [
  "하루 3개 AI 릴스 자동 생성",
  "내 브랜드 캐릭터로 일관된 콘텐츠 무제한 제작",
  "트렌드 분석기 무제한 이용",
  "인스타그램 · 유튜브 쇼츠 자동 예약 발행",
  "전담 매니저 1:1 온보딩 지원",
];

export default function HomePage() {
  return (
    <div className="bg-white">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="pointer-events-none absolute -top-32 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 rounded-full bg-gradient-to-br from-purple-200 via-blue-100 to-transparent opacity-60 blur-3xl" />

        <div className="relative mx-auto max-w-5xl px-6 pb-28 pt-28 text-center md:pt-36">
          <div className="animate-fade-in-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-4 py-1.5 text-sm font-medium text-purple-700">
            <Sparkles className="h-4 w-4" />
            B2B 파트너 전용 · 마케팅 자동화 SaaS
          </div>

          <h1 className="animate-fade-in-up [animation-delay:100ms] text-4xl font-extrabold leading-tight tracking-tight text-slate-900 sm:text-5xl md:text-6xl">
            하루 10분, 키워드 하나로{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              터지는 숏폼 콘텐츠
            </span>
            가 완성됩니다.
          </h1>

          <p className="animate-fade-in-up [animation-delay:200ms] mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            트렌드 분석부터 대본 생성, AI 모션 렌더링, 인스타 자동 업로드까지.
            <br className="hidden md:block" />
            당신만의 &apos;비즈니스 Gym&apos;을 구축하세요.
          </p>

          <div className="animate-fade-in-up [animation-delay:300ms] mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <button
              type="button"
              className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
            >
              <PlayCircle className="h-5 w-5" />
              데모 영상 보기
            </button>
            <Link
              href="/create"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 active:scale-100"
            >
              <Sparkles className="h-5 w-5" />
              500만 원으로 마케팅 자동화 구축하기
            </Link>
          </div>
        </div>
      </section>

      {/* 1-1. 사업 없는 분들을 위한 옵션 안내 */}
      <section className="border-y border-slate-100 bg-slate-50/70 py-8">
        <div className="mx-auto flex max-w-4xl flex-col items-center justify-between gap-4 px-6 text-center sm:flex-row sm:text-left">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm">
              <HelpCircle className="h-5 w-5" />
            </span>
            <p className="text-sm text-slate-600">
              <span className="font-bold text-slate-800">
                아직 홍보할 사업이 없으신가요?
              </span>{" "}
              이미 만들어진 사주 운세 서비스로 바로 시작할 수도 있어요.
            </p>
          </div>
          <a
            href="https://todaysajupro.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:text-purple-700"
          >
            오늘의사주 살펴보기
            <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* 2. Problem & Solution Section */}
      <section className="bg-purple-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-16 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              이런 고민, 저희가 해결해 드립니다
            </h2>
            <p className="mt-4 text-slate-600">
              어떤 사업을 하시든, 나만의 브랜드로 콘텐츠를 만드는 어려움을
              완전히 자동화합니다.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {problems.map(({ icon: Icon, before, after }) => (
              <div
                key={before}
                className="rounded-3xl bg-white p-8 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-blue-500 text-white shadow-md shadow-purple-500/20">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{before}</h3>
                <div className="my-4 flex items-center gap-2 text-slate-300">
                  <ArrowDown className="h-4 w-4" />
                </div>
                <p className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-lg font-bold text-transparent">
                  {after}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. How it Works */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-20 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              3단계면 충분합니다
            </h2>
            <p className="mt-4 text-slate-600">
              복잡한 세팅은 저희가 끝냈습니다. 원장님은 클릭 몇 번만 하시면
              됩니다.
            </p>
          </div>

          <div className="relative grid grid-cols-1 gap-16 md:grid-cols-3 md:gap-8">
            <div className="absolute left-0 right-0 top-8 hidden h-0.5 bg-gradient-to-r from-purple-200 via-blue-200 to-purple-200 md:block" />

            {steps.map(({ icon: Icon, title, desc }, i) => (
              <div
                key={title}
                className="relative z-10 flex flex-col items-center text-center"
              >
                <div className="relative mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30">
                  <Icon className="h-7 w-7" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-white text-xs font-bold text-purple-600 shadow ring-2 ring-purple-100">
                    {i + 1}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                <p className="mt-2 max-w-xs text-sm text-slate-500">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Pricing & ROI */}
      <section className="bg-slate-50 py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
            비용이 아니라, 투자입니다
          </h2>
          <p className="mt-4 text-lg font-semibold text-slate-700">
            매월 마케터 1명 인건비(300만 원)를{" "}
            <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
              1/10로
            </span>{" "}
            줄이세요.
          </p>

          <div className="relative mx-auto mt-14 max-w-lg rounded-3xl border-2 border-purple-500 bg-white p-10 text-left shadow-2xl shadow-purple-500/20">
            <span className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 text-xs font-bold text-white shadow-md">
              BEST CHOICE
            </span>

            <h3 className="text-center text-xl font-bold text-slate-900">
              B2B 마케팅 자동화 패키지
            </h3>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">초기 세팅비</p>
              <p className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-5xl font-extrabold text-transparent">
                500만 원
              </p>
              <p className="mt-2 text-sm text-slate-500">
                + 유지비 월 30만 원
              </p>
            </div>

            <div className="my-8 border-t border-slate-100" />

            <ul className="space-y-4">
              {benefits.map((benefit) => (
                <li key={benefit} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-slate-700">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/create"
              className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-4 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl"
            >
              <Sparkles className="h-5 w-5" />
              지금 바로 신청하기
            </Link>

            <p className="mt-4 text-center text-xs text-slate-400">
              마케터 채용 시 월 300만 원+ &middot; 4대보험 및 관리 비용 별도
            </p>
          </div>
        </div>
      </section>

      {/* 5. Footer */}
      <footer className="bg-slate-900 py-12 text-slate-400">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
          <div className="text-center md:text-left">
            <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-lg font-extrabold text-transparent">
              Business Gym
            </span>
            <p className="mt-2 text-sm">
              &copy; 2026 Flux Media. All rights reserved.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm">
            <Link href="#" className="transition-colors hover:text-white">
              이용약관
            </Link>
            <Link href="#" className="transition-colors hover:text-white">
              개인정보처리방침
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
