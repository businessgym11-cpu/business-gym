import Link from "next/link";
import {
  Sparkles,
  Clock,
  UserRound,
  TrendingUp,
  Type,
  Clapperboard,
  Download,
  Check,
  ArrowDown,
  ArrowRight,
  HelpCircle,
} from "lucide-react";

const problems = [
  {
    icon: Clock,
    before: "아직도 대본 쓰느라 밤새시나요?",
    after: "키워드 하나면 AI가 숏폼 구조 대본을 완성",
  },
  {
    icon: UserRound,
    before: "영상마다 등장인물이 달라 브랜드가 안 쌓이나요?",
    after: "참조 이미지 한 장으로 모든 영상에 같은 캐릭터",
  },
  {
    icon: TrendingUp,
    before: "뭘 만들어야 터질지 감이 안 오시나요?",
    after: "실제로 터진 영상 구조를 AI가 분석해 대본으로",
  },
];

const steps = [
  {
    icon: Type,
    title: "키워드 입력 & AI 대본 기획",
    desc: "키워드를 넣고 콘텐츠 시리즈를 고르면 AI가 그 포맷에 맞는 대본을 써줘요.",
  },
  {
    icon: Clapperboard,
    title: "내 캐릭터로 씬 이미지 생성",
    desc: "등록한 캐릭터로 씬마다 이미지를 만들어요. 매번 같은 얼굴, 같은 의상으로요.",
  },
  {
    icon: Download,
    title: "원클릭 렌더링 & 다운로드",
    desc: "버튼 한 번이면 음성·자막까지 입힌 완성본이 나와요. 받아서 바로 올리시면 돼요.",
  },
];

const tiers = [
  {
    name: "스타터",
    videos: 20,
    price: "150,000",
    caption: "이제 막 시작하는 1인 사업자",
    featured: false,
  },
  {
    name: "프로",
    videos: 50,
    price: "350,000",
    caption: "주 3~4회 꾸준히 발행",
    featured: true,
  },
  {
    name: "비즈니스",
    videos: 100,
    price: "550,000",
    caption: "매일 발행 + 여러 채널 운영",
    featured: false,
  },
];

const higherTiers = [
  { name: "프리미엄", videos: 150, price: "790,000" },
  { name: "엔터프라이즈", videos: 250, price: "1,290,000" },
  { name: "마스터", videos: 400, price: "1,990,000" },
];

const includedInAllTiers = [
  "내 캐릭터로 일관된 영상 생성",
  "트렌드 분석기 · 지난주 급상승 TOP10",
  "내 유튜브 채널 AI 진단",
  "완성 영상 워터마크 없이 다운로드",
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
              내 캐릭터가 나오는 숏폼
            </span>
            이 완성됩니다.
          </h1>

          <p className="animate-fade-in-up [animation-delay:200ms] mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            트렌드 분석부터 대본 기획, 내 캐릭터로 영상 완성까지.
            <br className="hidden md:block" />
            당신만의 &apos;비즈니스 Gym&apos;을 구축하세요.
          </p>

          <div className="animate-fade-in-up [animation-delay:300ms] mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href="#pricing"
              className="flex items-center gap-2 rounded-xl border-2 border-slate-200 bg-white px-6 py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
            >
              <ArrowDown className="h-5 w-5" />
              요금제 보기
            </a>
            <Link
              href="/signup"
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-8 py-3.5 text-base font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl hover:shadow-purple-500/40 active:scale-100"
            >
              <Sparkles className="h-5 w-5" />
              월 15만 원부터 시작하기
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

      {/* 2-1. 캐릭터 일관성 증거 */}
      <section className="bg-white py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-14 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              참조 이미지 한 장이면 끝
            </h2>
            <p className="mt-4 text-slate-600">
              캐릭터 사진 한 장만 등록하면, 어떤 장면을 요청하든 같은
              얼굴·같은 의상으로 만들어드려요.
            </p>
          </div>

          <div className="flex flex-col items-center gap-6 md:flex-row md:items-stretch md:justify-center">
            <div className="flex flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/character-reference.jpg"
                alt="등록한 캐릭터 참조 이미지"
                className="aspect-[3/5] w-40 rounded-2xl object-cover shadow-lg sm:w-48"
              />
              <span className="mt-3 rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                등록한 참조 이미지
              </span>
            </div>

            <div className="flex items-center justify-center py-2 md:py-0">
              <ArrowRight className="h-6 w-6 flex-shrink-0 rotate-90 text-purple-300 md:rotate-0" />
            </div>

            <div className="grid grid-cols-3 gap-3 sm:gap-4">
              {[
                { src: "/landing/character-scene-1.jpg", label: "서재 씬" },
                { src: "/landing/character-scene-2.jpg", label: "야외 씬" },
                { src: "/landing/character-scene-3.jpg", label: "액션 씬" },
              ].map((scene) => (
                <div key={scene.src} className="flex flex-col items-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={scene.src}
                    alt={`AI가 생성한 ${scene.label}, 같은 캐릭터`}
                    className="aspect-[3/5] w-24 rounded-2xl object-cover shadow-lg ring-2 ring-purple-200 sm:w-32"
                  />
                  <span className="mt-3 text-xs font-medium text-slate-500">
                    {scene.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <p className="mx-auto mt-10 max-w-lg text-center text-sm text-slate-400">
            실제로 Business Gym에서 생성된 이미지예요. 매번 다른 캐릭터가
            나오던 문제를 캐릭터 등록 하나로 해결했어요.
          </p>
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
              복잡한 세팅은 저희가 끝냈습니다. 클릭 몇 번이면 완성본이 나와요.
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

      {/* 4. Pricing */}
      <section id="pricing" className="scroll-mt-20 bg-slate-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="mx-auto mb-4 max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 sm:text-4xl">
              비용이 아니라, 투자입니다
            </h2>
            <p className="mt-4 text-lg font-semibold text-slate-700">
              마케터 1명 인건비(월 300만 원)의{" "}
              <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
                1/20
              </span>
              부터 시작하세요.
            </p>
            <p className="mt-3 text-sm text-slate-500">
              월 제작 가능한 영상 개수로 요금제를 나눴어요. 필요한 만큼만
              쓰시고, 언제든 올리거나 내리실 수 있어요.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-6 md:grid-cols-3">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`relative flex flex-col rounded-3xl bg-white p-8 ${
                  tier.featured
                    ? "border-2 border-purple-500 shadow-2xl shadow-purple-500/20 md:-translate-y-3"
                    : "border border-slate-200 shadow-sm"
                }`}
              >
                {tier.featured && (
                  <span className="absolute -top-4 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1 text-xs font-bold text-white shadow-md">
                    가장 많이 선택해요
                  </span>
                )}

                <h3 className="text-lg font-bold text-slate-900">
                  {tier.name}
                </h3>
                <p className="mt-1 text-xs text-slate-500">{tier.caption}</p>

                <div className="mt-6">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {tier.price}
                  </span>
                  <span className="ml-1 text-sm font-medium text-slate-500">
                    원 / 월
                  </span>
                </div>

                <p className="mt-3 inline-flex w-fit rounded-full bg-purple-50 px-3 py-1 text-sm font-bold text-purple-700">
                  월 {tier.videos}개 영상
                </p>

                <Link
                  href="/signup"
                  className={`mt-8 flex w-full items-center justify-center gap-2 rounded-xl px-6 py-3.5 text-sm font-bold transition-all duration-200 ${
                    tier.featured
                      ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30 hover:scale-[1.02]"
                      : "border-2 border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                  }`}
                >
                  시작하기
                </Link>
              </div>
            ))}
          </div>

          {/* 공통 포함 사항 */}
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-slate-200 bg-white p-8">
            <p className="text-center text-sm font-bold text-slate-800">
              모든 요금제에 공통으로 포함돼요
            </p>
            <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
              {includedInAllTiers.map((item) => (
                <li key={item} className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Check className="h-3.5 w-3.5" strokeWidth={3} />
                  </span>
                  <span className="text-sm text-slate-700">{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 border-t border-slate-100 pt-4 text-center text-xs text-slate-500">
              월 제공량을 넘기면 영상 1개당 4,000원으로 추가 제작하실 수 있어요.
            </p>
          </div>

          {/* 대량 티어 */}
          <div className="mx-auto mt-8 max-w-3xl rounded-2xl bg-slate-100/70 px-8 py-6">
            <p className="text-center text-sm font-semibold text-slate-700">
              더 많은 물량이 필요하신가요?
            </p>
            <div className="mt-4 flex flex-col items-center justify-center gap-x-8 gap-y-2 text-sm text-slate-600 sm:flex-row">
              {higherTiers.map((tier) => (
                <span key={tier.name}>
                  <span className="font-bold text-slate-800">{tier.name}</span>{" "}
                  월 {tier.videos}개 · {tier.price}원
                </span>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-slate-500">
              여러 브랜드를 함께 운영하는 대행사라면 상위 요금제를 추천드려요.
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
