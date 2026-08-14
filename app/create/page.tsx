"use client";

import { useState } from "react";
import {
  Sparkles,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Film,
  ArrowLeft,
  Play,
  Download,
  Rocket,
  Check,
} from "lucide-react";

const steps = [
  { id: 1, label: "대본 기획" },
  { id: 2, label: "AI 모션 매칭" },
  { id: 3, label: "최종 렌더링" },
];

const dummyScript = `[3초 훅]
"혹시 요즘 뭘 해도 잘 안 풀리시나요? 사실 이유가 있습니다."

[전개]
올해 당신의 사주에는 '역마살'이 강하게 들어와 있어요. 그래서 한 곳에 정착하지 못하고 계속 흔들리는 느낌을 받으셨을 거예요.

[공감]
하지만 역마살은 나쁜 것이 아니에요. 오히려 지금이 새로운 기회를 잡을 최적의 타이밍이라는 신호랍니다.

[CTA]
당신의 사주에 숨겨진 진짜 메시지가 궁금하다면? 프로필 링크를 확인해보세요.`;

const scenes = [
  {
    id: 1,
    text: '"혹시 요즘 뭘 해도 잘 안 풀리시나요? 사실 이유가 있습니다."',
  },
  {
    id: 2,
    text: "올해 당신의 사주에는 '역마살'이 강하게 들어와 있어요. 그래서 한 곳에 정착하지 못하고 계속 흔들리는 느낌을 받으셨을 거예요.",
  },
  {
    id: 3,
    text: "하지만 역마살은 나쁜 것이 아니에요. 지금이 새로운 기회를 잡을 최적의 타이밍이라는 신호랍니다.",
  },
];

function StepProgress({ step }: { step: number }) {
  return (
    <div className="mx-auto mb-10 flex max-w-2xl items-start">
      {steps.map((s, i) => {
        const active = step >= s.id;
        const completed = step > s.id;
        const isLast = i === steps.length - 1;
        return (
          <div
            key={s.id}
            className={`flex items-start ${isLast ? "flex-none" : "flex-1"}`}
          >
            <div className="flex flex-col items-center">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold transition-colors duration-300 ${
                  active
                    ? "bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-md shadow-purple-500/30"
                    : "bg-slate-100 text-slate-400"
                }`}
              >
                {completed ? <Check className="h-5 w-5" /> : s.id}
              </div>
              <span
                className={`mt-2 whitespace-nowrap text-xs font-semibold ${
                  active ? "text-slate-800" : "text-slate-400"
                }`}
              >
                {s.label}
              </span>
            </div>

            {!isLast && (
              <div
                className={`mx-2 mt-5 h-0.5 flex-1 rounded-full transition-colors duration-300 sm:mx-4 ${
                  step > s.id
                    ? "bg-gradient-to-r from-purple-600 to-blue-500"
                    : "bg-slate-200"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StepOneScript({
  script,
  setScript,
  onNext,
}: {
  script: string;
  setScript: (v: string) => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        분석된 떡상 구조를 바탕으로 AI가 작성한 초안입니다. 자유롭게
        수정하세요.
      </p>

      <div className="mt-6 rounded-2xl border border-slate-200 transition-all duration-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/40">
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={14}
          className="w-full resize-none rounded-2xl bg-transparent p-5 leading-relaxed text-slate-700 focus:outline-none"
        />
      </div>

      <div className="mt-8 flex justify-end">
        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100"
        >
          <Sparkles className="h-5 w-5" />
          다음: AI 캐릭터 매칭하기
        </button>
      </div>
    </div>
  );
}

function StepTwoMotion({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        씬(Scene)별로 어울리는 동양풍 캐릭터와 모션을 자동으로 매칭했어요.
        마음에 들지 않으면 컷을 교체하거나 직접 업로드해 보세요.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* 좌측: 씬별 대본 */}
        <div className="space-y-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="text-xs font-bold text-purple-600">
                씬 {scene.id}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {scene.text}
              </p>
            </div>
          ))}
        </div>

        {/* 우측: 매칭된 썸네일 그리드 */}
        <div className="grid grid-cols-3 gap-4">
          {scenes.map((scene) => (
            <div key={scene.id} className="flex flex-col">
              <div className="relative aspect-[9/16] overflow-hidden rounded-xl bg-gradient-to-br from-purple-100 via-rose-50 to-blue-50">
                <span className="absolute left-2 top-2 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                  씬 {scene.id}
                </span>
                <div className="flex h-full w-full items-center justify-center">
                  <ImageIcon className="h-8 w-8 text-purple-300" />
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-1.5">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                >
                  <RefreshCw className="h-3 w-3" />
                  컷 교체
                </button>
                <button
                  type="button"
                  aria-label="내 PC 업로드"
                  className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
                >
                  <Upload className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          이전 단계로
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100"
        >
          <Film className="h-5 w-5" />
          다음: 최종 영상 렌더링
        </button>
      </div>
    </div>
  );
}

function StepThreePublish({ onPrev }: { onPrev: () => void }) {
  return (
    <div>
      <button
        type="button"
        onClick={onPrev}
        className="flex items-center gap-1.5 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-slate-600"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        이전 단계로
      </button>

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
        {/* 비디오 프리뷰 */}
        <div className="mx-auto w-full max-w-[240px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                type="button"
                aria-label="영상 재생"
                className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform duration-200 hover:scale-105"
              >
                <Play className="h-6 w-6 fill-purple-600 text-purple-600" />
              </button>
            </div>
            <span className="absolute bottom-3 left-3 rounded-full bg-black/50 px-2 py-1 text-xs text-white">
              00:32
            </span>
          </div>
        </div>

        {/* 옵션 */}
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              자막 스타일
            </label>
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30">
              <option>기본 (화이트 볼드)</option>
              <option>네온 하이라이트</option>
              <option>손글씨 감성체</option>
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              배경음악 선택
            </label>
            <select className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30">
              <option>잔잔한 감성 피아노</option>
              <option>트렌디 업비트</option>
              <option>신비로운 동양풍</option>
            </select>
          </div>
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
        >
          <Download className="h-5 w-5" />
          완성본 MP4 다운로드
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-8 py-3.5 font-bold text-white shadow-lg shadow-pink-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100"
        >
          <Rocket className="h-5 w-5" />
          인스타그램 릴스로 즉시 발행
        </button>
      </div>
    </div>
  );
}

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [script, setScript] = useState(dummyScript);

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="text-center">
        <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
          AI 콘텐츠 생성 마법사
        </h1>
        <p className="mt-2 text-slate-500">
          3단계면 당신만의 숏폼이 완성됩니다.
        </p>
      </div>

      <div className="mt-10">
        <StepProgress step={step} />
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-md sm:p-10">
        {step === 1 && (
          <StepOneScript
            script={script}
            setScript={setScript}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepTwoMotion onPrev={() => setStep(1)} onNext={() => setStep(3)} />
        )}
        {step === 3 && <StepThreePublish onPrev={() => setStep(2)} />}
      </div>
    </div>
  );
}
