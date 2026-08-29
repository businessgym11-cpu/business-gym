"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  Sparkles,
  RefreshCw,
  Upload,
  Image as ImageIcon,
  Film,
  ArrowLeft,
  ArrowRight,
  Play,
  Download,
  Rocket,
  Check,
  Wand2,
  Loader2,
  X,
  AlertTriangle,
  UserRound,
  Copy,
} from "lucide-react";
import {
  generateScript,
  generateSceneImage,
  uploadSceneImage,
  startRenderJob,
  checkRenderStatus,
  getCharacter,
  type CharacterInfo,
} from "./actions";
import { parseScenes, type Scene } from "@/lib/scenes";
import CharacterPanel from "@/app/CharacterPanel";

const steps = [
  { id: 1, label: "대본 기획" },
  { id: 2, label: "스토리보드 확정" },
  { id: 3, label: "최종 렌더링" },
];

const FINALIZE_WARNING =
  "현재 확정된 스토리보드를 바탕으로 고화질 AI 모션 및 음성 렌더링이 시작됩니다. 렌더링 1회가 차감되며 이후 수정이 불가합니다. 진행하시겠습니까?";

type SceneState = {
  prompt: string;
  imageUrl?: string;
  status: "idle" | "generating" | "uploading" | "error";
  error?: string;
};

type RenderJobState = {
  status: "rendering" | "done" | "error";
  jobId: string;
  startedAt: number;
  videoUrl: string;
  error: string;
};

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

const DURATION_OPTIONS = [10, 20, 30];

type SeriesSubFormat = {
  id: string;
  label: string;
  description: string;
  promptGuide: string;
};

type SeriesCategory = {
  id: string;
  label: string;
  description: string;
  sajuMode: boolean;
  promptGuide?: string;
  subFormats?: SeriesSubFormat[];
};

const SERIES_CATEGORIES: SeriesCategory[] = [
  {
    id: "saju",
    label: "사주",
    description: "오행/사주팔자/신살 등을 근거로 풀어주는 톤",
    sajuMode: true,
    subFormats: [
      {
        id: "daily",
        label: "오늘의 운세",
        description: "매일 챙겨보는 캐릭터의 짧은 오늘의 운세 + 실천 팁",
        promptGuide:
          "이 대본은 '오늘의 운세' 시리즈입니다. 캐릭터가 오늘 하루 특정 띠/성향에 좋은 일과 짧은 실천 팁을 전달하는 데일리 콘텐츠로 작성해주세요. 매일 챙겨보고 싶어지는 습관형 톤으로 써주세요. 대본 마지막에는 '내 사주 무료로 보러가기' 같은 CTA를 자연스럽게 포함해주세요.",
      },
      {
        id: "element-type",
        label: "나는 무슨 오행?",
        description: "MBTI처럼 성격을 오행/십성에 빗댄 유형 테스트형",
        promptGuide:
          "이 대본은 '나는 무슨 오행?' 시리즈입니다. MBTI 유형 테스트처럼 성격이나 행동 특징을 오행(목화토금수) 또는 십성에 빗대어 소개하고, 시청자가 자신을 대입해볼 수 있도록 작성해주세요. 저장·공유하고 싶어지는 톤으로 써주세요. 대본 마지막에는 '내 사주 무료로 보러가기' 같은 CTA를 자연스럽게 포함해주세요.",
      },
      {
        id: "comment-consult",
        label: "댓글 사주 상담",
        description: "댓글로 받은 고민에 캐릭터가 답변하는 참여형",
        promptGuide:
          "이 대본은 '댓글 사주 상담' 시리즈입니다. 팔로워가 댓글로 남긴 고민(연애/이직 등)에 캐릭터가 답변하는 형식으로 작성하고, 마지막에 다음 사연을 댓글로 남겨달라는 유도 문구를 포함해주세요.",
      },
      {
        id: "meme",
        label: "사주 밈/유머",
        description: "가벼운 유머 톤의 사주 밈 형식",
        promptGuide:
          "이 대본은 '사주 밈/유머' 시리즈입니다. 무겁지 않고 가벼운 유머 톤으로, MZ 세대가 공감할 만한 사주 관련 밈 형식으로 작성해주세요. 대본 마지막에는 '내 사주 무료로 보러가기' 같은 CTA를 자연스럽게 포함해주세요.",
      },
      {
        id: "worldview",
        label: "캐릭터 세계관",
        description: "단순 점괘가 아닌 캐릭터 스토리/비하인드",
        promptGuide:
          "이 대본은 '캐릭터 세계관/비하인드' 시리즈입니다. 단순 점괘 전달이 아니라, 캐릭터에게 스토리와 개성을 부여해서 '하늘의 이야기를 전하러 온 도령'이라는 세계관이 자연스럽게 드러나는 대본으로 작성해주세요.",
      },
    ],
  },
  {
    id: "humor",
    label: "유머",
    description: "가볍고 재밌는 밈/상황극 톤",
    sajuMode: false,
    promptGuide:
      "이 대본은 '유머' 카테고리입니다. 가볍고 재밌는 톤으로, 공감되는 밈이나 상황극 형식으로 자연스럽게 작성해주세요. 무겁지 않게, 웃음 포인트가 명확히 드러나도록 써주세요.",
  },
  {
    id: "character",
    label: "캐릭터",
    description: "특정 캐릭터 시점의 스토리텔링",
    sajuMode: false,
    promptGuide:
      "이 대본은 '캐릭터' 카테고리입니다. 특정 캐릭터의 시점에서 스토리텔링하는 톤으로 작성해주세요. 캐릭터의 개성과 세계관이 자연스럽게 드러나도록 써주세요.",
  },
  {
    id: "medical",
    label: "의료/전문직",
    description: "신뢰도 높은 전문가 톤의 정보 전달",
    sajuMode: false,
    promptGuide:
      "이 대본은 '의료/전문직' 카테고리입니다. 신뢰도 높은 전문가 톤으로, 정확성이 중요한 정보를 알기 쉽게 풀어 설명해주세요. 과장된 효능 주장이나 단정적인 진단은 피하고, 일반적인 정보 제공 성격임이 자연스럽게 드러나게 써주세요.",
  },
  {
    id: "food",
    label: "요식업/맛집",
    description: "현장감 있는 맛집/메뉴 소개 톤",
    sajuMode: false,
    promptGuide:
      "이 대본은 '요식업/맛집' 카테고리입니다. 군침 도는 비주얼과 현장감 있는 리액션 중심으로, 맛집이나 메뉴·레시피를 소개하는 톤으로 작성해주세요. 실제 방문·시식 경험처럼 생생하게 써주세요.",
  },
  {
    id: "parenting",
    label: "육아/생활",
    description: "친근한 톤의 육아·생활 꿀팁",
    sajuMode: false,
    promptGuide:
      "이 대본은 '육아/생활' 카테고리입니다. 공감 가는 육아·생활 꿀팁을 친근한 톤으로 전달해주세요. 실천 가능한 구체적인 팁 위주로, 저장하고 싶어지는 정보성 콘텐츠로 작성해주세요.",
  },
  {
    id: "beauty",
    label: "뷰티/미용",
    description: "비포/애프터가 드러나는 뷰티 꿀팁",
    sajuMode: false,
    promptGuide:
      "이 대본은 '뷰티/미용' 카테고리입니다. 비포/애프터가 명확히 드러나는 뷰티·미용 꿀팁 톤으로 작성해주세요. 따라하고 싶어지도록 구체적인 단계로 설명해주세요.",
  },
  {
    id: "fitness",
    label: "헬스/운동",
    description: "동기부여되는 트레이너 톤의 운동 팁",
    sajuMode: false,
    promptGuide:
      "이 대본은 '헬스/운동' 카테고리입니다. 동기부여되는 트레이너 톤으로, 운동 자세나 루틴을 명확한 단계로 설명해주세요. 과장된 근거 제시 없이 실천 가능한 조언 위주로 작성해주세요.",
  },
  {
    id: "realestate",
    label: "부동산/재테크",
    description: "신뢰감 있는 재테크 전문가 톤",
    sajuMode: false,
    promptGuide:
      "이 대본은 '부동산/재테크' 카테고리입니다. 신뢰감 있는 전문가 톤으로, 숫자와 구체적 예시를 들어 설명해주세요. 투자 손실 가능성을 배제한 단정적 표현은 피해주세요.",
  },
  {
    id: "fashion",
    label: "패션",
    description: "트렌디한 코디/스타일링 톤",
    sajuMode: false,
    promptGuide:
      "이 대본은 '패션' 카테고리입니다. 트렌디하고 감각적인 톤으로, 코디나 스타일링 팁을 시각적으로 그려지게 설명해주세요.",
  },
  {
    id: "travel",
    label: "여행",
    description: "설레는 여행 브이로그 톤",
    sajuMode: false,
    promptGuide:
      "이 대본은 '여행' 카테고리입니다. 설레는 여행 브이로그 톤으로, 장소나 코스, 꿀팁을 생생한 현장감으로 설명해주세요.",
  },
  {
    id: "pet",
    label: "반려동물",
    description: "따뜻한 보호자 톤의 반려동물 팁",
    sajuMode: false,
    promptGuide:
      "이 대본은 '반려동물' 카테고리입니다. 반려동물을 사랑하는 보호자 톤으로, 훈육·건강·용품 팁을 따뜻하고 친근하게 설명해주세요.",
  },
  {
    id: "interior",
    label: "인테리어",
    description: "따라하기 쉬운 비포/애프터 인테리어 팁",
    sajuMode: false,
    promptGuide:
      "이 대본은 '인테리어' 카테고리입니다. 감각적인 비포/애프터가 드러나는 인테리어 팁 톤으로, 따라하기 쉬운 구체적인 아이디어 중심으로 설명해주세요.",
  },
];

/**
 * Gemini가 가끔 화살표를 LaTeX 수식 표기($\rightarrow$, \to 등)로 써서
 * 문자 그대로 노출되는 경우가 있어 흔한 패턴만 치환한다.
 */
function cleanAiText(text: string): string {
  return text
    .replace(/\$\\(rightarrow|to)\$/g, "→")
    .replace(/\\(rightarrow|to)/g, "→")
    .replace(/\$\\(leftarrow)\$/g, "←")
    .replace(/\\(leftarrow)/g, "←");
}

/** 마크다운 **굵게** 표기를 <strong>으로 렌더링한다. */
function AiAnalysisText({ text }: { text: string }) {
  const cleaned = cleanAiText(text);
  const parts = cleaned.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-bold text-purple-950">
            {part.slice(2, -2)}
          </strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function StepOneScript({
  script,
  setScript,
  duration,
  setDuration,
  onNext,
  initialKeyword,
  initialBenchmarkContext,
}: {
  script: string;
  setScript: (v: string) => void;
  duration: number;
  setDuration: (v: number) => void;
  onNext: () => void;
  initialKeyword?: string;
  initialBenchmarkContext?: string;
}) {
  const [keyword, setKeyword] = useState(initialKeyword ?? "");
  const [benchmarkContext] = useState(initialBenchmarkContext ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [subFormatId, setSubFormatId] = useState<string | null>(null);
  const [scriptFormat, setScriptFormat] = useState<"short" | "long">("short");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const selectedCategory = SERIES_CATEGORIES.find((c) => c.id === categoryId);
  const selectedSubFormat = selectedCategory?.subFormats?.find(
    (f) => f.id === subFormatId
  );

  const selectCategory = (id: string | null) => {
    setCategoryId(id);
    setSubFormatId(null);
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError("키워드를 입력해주세요.");
      return;
    }

    setGenerating(true);
    setError("");

    const guideText = selectedSubFormat?.promptGuide ?? selectedCategory?.promptGuide;
    const combinedContext = [guideText, benchmarkContext]
      .filter(Boolean)
      .join("\n\n");

    const result = await generateScript(
      keyword.trim(),
      duration,
      selectedCategory?.sajuMode ?? false,
      scriptFormat,
      combinedContext || undefined
    );

    if (!result.success) {
      setError(result.error);
      setGenerating(false);
      return;
    }

    setScript(result.script);
    setGenerating(false);
  };

  return (
    <div>
      <p className="text-sm text-slate-500">
        키워드를 입력하면 AI가 떡상 구조 대본을 만들어드려요. 생성 후
        자유롭게 수정하세요.
      </p>

      {benchmarkContext && (
        <div className="mt-4 rounded-xl bg-purple-50 px-4 py-3">
          <p className="text-xs font-bold text-purple-700">
            📊 벤치마킹 참고 자료
          </p>
          <p className="mt-1 max-h-32 overflow-y-auto whitespace-pre-wrap text-xs leading-relaxed text-purple-900">
            <AiAnalysisText text={benchmarkContext} />
          </p>
          <p className="mt-1.5 text-[11px] text-purple-500">
            AI 대본 생성 시 이 분석을 참고해서 대본을 만들어요.
          </p>
        </div>
      )}

      <div className="mt-4">
        <span className="text-sm font-semibold text-slate-700">
          콘텐츠 카테고리 (선택)
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => selectCategory(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
              categoryId === null
                ? "border-transparent bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            없음
          </button>
          {SERIES_CATEGORIES.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => selectCategory(c.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                categoryId === c.id
                  ? "border-transparent bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
        {selectedCategory && (
          <p className="mt-1.5 text-xs text-slate-400">
            {selectedCategory.description}
          </p>
        )}

        {selectedCategory?.subFormats && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3">
            <p className="text-[11px] font-semibold text-slate-500">
              세부 포맷 (선택 안 해도 기본 {selectedCategory.label} 톤으로 생성돼요)
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {selectedCategory.subFormats.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() =>
                    setSubFormatId((prev) => (prev === f.id ? null : f.id))
                  }
                  className={`rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors duration-200 ${
                    subFormatId === f.id
                      ? "border-purple-400 bg-purple-100 text-purple-700"
                      : "border-slate-200 bg-white text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            {selectedSubFormat && (
              <p className="mt-1.5 text-xs text-slate-400">
                {selectedSubFormat.description}
              </p>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm font-semibold text-slate-700">
          대본 형식
        </span>
        <div className="flex rounded-lg border border-slate-200 p-1">
          <button
            type="button"
            onClick={() => setScriptFormat("short")}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              scriptFormat === "short"
                ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            숏폼 대본
          </button>
          <button
            type="button"
            onClick={() => setScriptFormat("long")}
            className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
              scriptFormat === "long"
                ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                : "text-slate-500 hover:bg-slate-100"
            }`}
          >
            롱폼 대본
          </button>
        </div>
        {scriptFormat === "long" && (
          <span className="text-xs text-slate-400">
            롱폼 대본은 AI 릴스 제작으로 이어지지 않아요.
          </span>
        )}
      </div>

      {scriptFormat === "short" && (
        <div className="mt-4 flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-700">
            영상 분량
          </span>
          <div className="flex rounded-lg border border-slate-200 p-1">
            {DURATION_OPTIONS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDuration(d)}
                className={`rounded-md px-3 py-1.5 text-sm font-semibold transition-colors duration-200 ${
                  duration === d
                    ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                    : "text-slate-500 hover:bg-slate-100"
                }`}
              >
                {d}초
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mt-4 flex flex-col gap-3 sm:flex-row">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="예: 30대 이직운, 재물운"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {generating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Wand2 className="h-4 w-4" />
          )}
          AI 대본 생성
        </button>
      </div>

      {error && (
        <p className="mt-2 text-sm font-medium text-red-500">{error}</p>
      )}

      <div className="mt-4 rounded-2xl border border-slate-200 transition-all duration-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/40">
        <textarea
          value={script}
          onChange={(e) => setScript(e.target.value)}
          rows={14}
          placeholder="위에서 키워드를 입력하고 'AI 대본 생성'을 누르면 여기에 대본이 채워져요."
          className="w-full resize-none rounded-2xl bg-transparent p-5 leading-relaxed text-slate-700 placeholder:text-slate-400 focus:outline-none"
        />
      </div>

      {scriptFormat === "long" ? (
        <div className="mt-8 flex items-center justify-end gap-3">
          <p className="text-xs text-slate-400">
            롱폼 대본은 여기서 마무리돼요. 위 대본을 복사해서 직접 활용해주세요.
          </p>
          <button
            type="button"
            onClick={() => {
              if (!script.trim()) return;
              navigator.clipboard.writeText(script);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
            disabled={!script.trim()}
            className="flex flex-shrink-0 items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Copy className="h-5 w-5" />
            {copied ? "복사됐어요!" : "대본 복사하기"}
          </button>
        </div>
      ) : (
        <div className="mt-8 flex justify-end">
          <button
            type="button"
            onClick={onNext}
            disabled={!script.trim()}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Sparkles className="h-5 w-5" />
            다음: 스토리보드 확정하기
          </button>
        </div>
      )}
    </div>
  );
}

function SceneCard({
  scene,
  state,
  onChange,
  characterImageUrl,
}: {
  scene: Scene;
  state: SceneState;
  onChange: (patch: Partial<SceneState>) => void;
  characterImageUrl?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expanded, setExpanded] = useState(false);
  const busy = state.status === "generating" || state.status === "uploading";

  const handleGenerate = async () => {
    onChange({ status: "generating", error: undefined });
    const result = await generateSceneImage(
      state.prompt || scene.text,
      scene.visual,
      characterImageUrl
    );

    if (!result.success) {
      onChange({ status: "error", error: result.error });
      return;
    }

    onChange({ status: "idle", imageUrl: result.imageUrl, error: undefined });
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    onChange({ status: "uploading", error: undefined });
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadSceneImage(formData);

    if (!result.success) {
      onChange({ status: "error", error: result.error });
      return;
    }

    onChange({ status: "idle", imageUrl: result.imageUrl, error: undefined });
  };

  return (
    <div className="flex flex-col rounded-xl border border-slate-200 p-3">
      <div className="relative aspect-[9/16] overflow-hidden rounded-lg bg-gradient-to-br from-purple-100 via-rose-50 to-blue-50">
        <span className="absolute left-2 top-2 z-10 rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold text-purple-700">
          씬 {scene.id}
        </span>
        {characterImageUrl && (
          <span
            title="캐릭터 일관성 적용"
            className="absolute right-2 top-2 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-white/80 text-purple-600"
          >
            <UserRound className="h-3 w-3" />
          </span>
        )}

        {state.imageUrl ? (
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="block h-full w-full cursor-zoom-in"
            aria-label="이미지 크게 보기"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={state.imageUrl}
              alt={`씬 ${scene.id} 이미지`}
              className="h-full w-full object-cover"
            />
          </button>
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <ImageIcon className="h-8 w-8 text-purple-300" />
          </div>
        )}

        {busy && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70">
            <Loader2 className="h-6 w-6 animate-spin text-purple-600" />
          </div>
        )}
      </div>

      <input
        type="text"
        value={state.prompt}
        onChange={(e) => onChange({ prompt: e.target.value })}
        placeholder="이미지 스타일 프롬프트 (선택)"
        className="mt-2 w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-500/30"
      />

      {state.error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-500">
          {state.error}
        </p>
      )}

      <div className="mt-2 flex items-center justify-between gap-1.5">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-slate-200 px-2 py-1.5 text-[11px] font-medium text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className="h-3 w-3" />
          {state.imageUrl ? "컷 교체" : "AI 생성"}
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
          aria-label="내 PC 업로드"
          className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Upload className="h-3.5 w-3.5" />
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {expanded && state.imageUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-6"
          onClick={() => setExpanded(false)}
        >
          <button
            type="button"
            onClick={() => setExpanded(false)}
            aria-label="닫기"
            className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors duration-200 hover:bg-white/20"
          >
            <X className="h-5 w-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={state.imageUrl}
            alt={`씬 ${scene.id} 이미지 크게 보기`}
            className="max-h-full max-w-full rounded-xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

function StepTwoStoryboard({
  scenes,
  sceneStates,
  updateScene,
  onPrev,
  onFinalize,
  hasRender,
  onViewRender,
}: {
  scenes: Scene[];
  sceneStates: Record<number, SceneState>;
  updateScene: (id: number, patch: Partial<SceneState>) => void;
  onPrev: () => void;
  onFinalize: () => void;
  hasRender: boolean;
  onViewRender: () => void;
}) {
  const missingImages = scenes.some((scene) => !sceneStates[scene.id]?.imageUrl);
  const [showConfirm, setShowConfirm] = useState(false);

  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [useCharacter, setUseCharacter] = useState(false);

  useEffect(() => {
    getCharacter().then((result) => {
      setCharacterLoading(false);
      if (result.success && result.character) {
        setCharacter(result.character);
      }
    });
  }, []);

  const activeCharacterImageUrl = useCharacter
    ? character?.frontImageUrl
    : undefined;

  const handleFinalizeClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    setShowConfirm(false);
    onFinalize();
  };

  return (
    <div>
      <p className="text-sm text-slate-500">
        씬(Scene)별로 AI 이미지를 생성해서 스토리보드를 완성해 보세요.
        프롬프트를 수정해 다시 생성하거나, 마음에 드는 이미지를 직접
        업로드할 수도 있어요. 이미지는 여기서 원하는 만큼 자유롭게
        수정할 수 있지만, 최종 렌더링을 시작하면 이 스토리보드를 기준으로
        AI 모션과 음성이 만들어지고 이후 수정이 불가해요.
      </p>

      <div className="mb-6">
        <CharacterPanel
          character={character}
          loading={characterLoading}
          useCharacter={useCharacter}
          onToggleUse={setUseCharacter}
          onSaved={(c) => {
            setCharacter(c);
            setUseCharacter(true);
          }}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_1.4fr]">
        {/* 좌측: 씬별 대본 */}
        <div className="space-y-4">
          {scenes.map((scene) => (
            <div
              key={scene.id}
              className="rounded-xl border border-slate-200 p-4"
            >
              <p className="text-xs font-bold text-purple-600">
                씬 {scene.id} · {scene.label}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-slate-600">
                {scene.text}
              </p>
            </div>
          ))}
        </div>

        {/* 우측: 씬별 이미지 카드 */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {scenes.map((scene) => (
            <SceneCard
              key={scene.id}
              scene={scene}
              state={
                sceneStates[scene.id] ?? { prompt: scene.text, status: "idle" }
              }
              onChange={(patch) => updateScene(scene.id, patch)}
              characterImageUrl={activeCharacterImageUrl}
            />
          ))}
        </div>
      </div>

      {missingImages && (
        <p className="mt-6 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          아직 이미지가 없는 씬이 있어요. 모든 씬에 이미지를 채운 뒤 최종
          렌더링을 시작할 수 있어요.
        </p>
      )}

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={onPrev}
          className="flex items-center gap-2 rounded-xl bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-200"
        >
          <ArrowLeft className="h-4 w-4" />
          이전 단계로
        </button>

        <div className="flex items-center gap-3">
          {hasRender && (
            <button
              type="button"
              onClick={onViewRender}
              className="flex items-center gap-2 rounded-xl border-2 border-purple-200 px-5 py-3.5 font-semibold text-purple-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50"
            >
              다음 단계로
              <ArrowRight className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={handleFinalizeClick}
            disabled={missingImages}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Film className="h-5 w-5" />
            최종 렌더링
          </button>
        </div>
      </div>

      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">
              최종 렌더링을 시작할까요?
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-600">
              {FINALIZE_WARNING}
            </p>
            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                className="flex-1 rounded-xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-200"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02]"
              >
                진행할게요
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StepThreeRender({
  scenes,
  sceneStates,
  duration,
  onPrev,
  renderJob,
  setRenderJob,
}: {
  scenes: Scene[];
  sceneStates: Record<number, SceneState>;
  duration: number;
  onPrev: () => void;
  renderJob: RenderJobState | null;
  setRenderJob: (v: RenderJobState) => void;
}) {
  const startedRef = useRef(false);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const status = renderJob?.status ?? "rendering";
  const error = renderJob?.error ?? "";
  const videoUrl = renderJob?.videoUrl ?? "";

  const POLL_INTERVAL_MS = 5000;
  const MAX_POLL_MS = 15 * 60 * 1000; // n8n 실측 렌더링 시간(8분대)보다 넉넉하게

  const clearPoll = () => {
    if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
  };

  const pollStatus = (jobId: string, startedAt: number) => {
    pollTimeoutRef.current = setTimeout(async () => {
      try {
        const result = await checkRenderStatus(jobId);

        if (!result.success) {
          setRenderJob({ status: "error", jobId, startedAt, videoUrl: "", error: result.error });
          return;
        }

        if (result.status === "done") {
          setRenderJob({
            status: "done",
            jobId,
            startedAt,
            videoUrl: result.videoUrl ?? "",
            error: "",
          });
          return;
        }

        // n8n은 씬 하나(예: 타이틀 TTS)가 재시도 끝에 완전히 실패하면 그
        // 항목만 먼저 Update Job (Error)로 "error" 상태를 써버리지만, 다른
        // 씬들은 계속 진행되어 몇 분 뒤 Update Job (Done)이 같은 행을
        // "done"으로 덮어쓰는 경우가 있다(레이스 컨디션). 그래서 "error"를
        // 봐도 바로 포기하지 않고, pending과 똑같이 폴링을 계속해서 나중에
        // "done"으로 뒤집히는지 지켜본다 — 최종 실패면 아래 MAX_POLL_MS
        // 타임아웃이 여전히 잡아준다.

        if (Date.now() - startedAt > MAX_POLL_MS) {
          setRenderJob({
            status: "error",
            jobId,
            startedAt,
            videoUrl: "",
            error:
              "렌더링이 예상보다 오래 걸리고 있어요. 잠시 후 다시 시도해주세요.",
          });
          return;
        }

        pollStatus(jobId, startedAt);
      } catch {
        setRenderJob({
          status: "error",
          jobId,
          startedAt,
          videoUrl: "",
          error: "렌더링 상태 확인 중 연결이 끊겼어요. 다시 시도해주세요.",
        });
      }
    }, POLL_INTERVAL_MS);
  };

  const startRender = async () => {
    clearPoll();
    const startedAt = Date.now();

    const renderScenes = scenes.map((scene) => ({
      imageUrl: sceneStates[scene.id]?.imageUrl ?? "",
      text: scene.text,
    }));

    try {
      const result = await startRenderJob(renderScenes, duration);

      if (!result.success) {
        setRenderJob({ status: "error", jobId: "", startedAt, videoUrl: "", error: result.error });
        return;
      }

      setRenderJob({
        status: "rendering",
        jobId: result.jobId,
        startedAt,
        videoUrl: "",
        error: "",
      });
      pollStatus(result.jobId, startedAt);
    } catch {
      setRenderJob({
        status: "error",
        jobId: "",
        startedAt,
        videoUrl: "",
        error: "렌더링 요청을 시작하지 못했어요. 다시 시도해주세요.",
      });
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;

    if (!renderJob) {
      startRender();
    } else if (renderJob.status === "rendering") {
      pollStatus(renderJob.jobId, renderJob.startedAt);
    }
    return () => clearPoll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

      <div className="mt-6 flex flex-col items-center">
        <div className="relative aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
              {status === "error" ? (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20">
                  <X className="h-6 w-6 text-red-300" />
                </div>
              ) : (
                <Loader2 className="h-10 w-10 animate-spin text-white/80" />
              )}
              <span className="text-xs text-white/80">
                {status === "error"
                  ? "렌더링에 실패했어요."
                  : "AI 모션·음성 렌더링 중... (10~15분 정도 소요돼요)"}
              </span>
            </div>
          )}
        </div>

        {status === "error" && (
          <div className="mt-4 text-center">
            <p className="text-sm font-medium text-red-500">{error}</p>
            <button
              type="button"
              onClick={startRender}
              className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-5 py-2.5 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03]"
            >
              <RefreshCw className="h-4 w-4" />
              다시 시도
            </button>
          </div>
        )}

        {status === "done" && (
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <a
              href={videoUrl}
              download
              className="flex items-center justify-center gap-2 rounded-xl border-2 border-slate-200 px-6 py-3.5 font-semibold text-slate-700 transition-all duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
            >
              <Download className="h-5 w-5" />
              완성본 MP4 다운로드
            </a>
            <button
              type="button"
              disabled
              title="인스타그램 연동은 준비 중이에요"
              className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-yellow-400 via-pink-500 to-purple-600 px-8 py-3.5 font-bold text-white opacity-50 shadow-lg shadow-pink-500/30"
            >
              <Rocket className="h-5 w-5" />
              인스타그램 릴스로 즉시 발행 (준비 중)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const BENCHMARK_HANDOFF_KEY = "bg_benchmark_handoff";

function readBenchmarkHandoff(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const raw = sessionStorage.getItem(BENCHMARK_HANDOFF_KEY);
  if (!raw) return undefined;
  sessionStorage.removeItem(BENCHMARK_HANDOFF_KEY);
  try {
    const parsed = JSON.parse(raw) as { benchmarkAnalysis?: string };
    return parsed.benchmarkAnalysis;
  } catch {
    return undefined;
  }
}

function CreatePageContent() {
  const searchParams = useSearchParams();
  const initialKeyword = searchParams.get("topic") ?? undefined;
  const [initialBenchmarkContext] = useState(readBenchmarkHandoff);

  const [step, setStep] = useState(1);
  const [script, setScript] = useState("");
  const [duration, setDuration] = useState(30);
  const [sceneStates, setSceneStates] = useState<Record<number, SceneState>>(
    {}
  );
  const [renderJob, setRenderJob] = useState<RenderJobState | null>(null);

  const scenes = useMemo(() => parseScenes(script), [script]);

  const updateScene = (id: number, patch: Partial<SceneState>) => {
    setSceneStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { prompt: "", status: "idle" }), ...patch },
    }));
    // 씬 이미지가 바뀌면 이전에 완성된 영상은 더 이상 최신 스토리보드를
    // 반영하지 않으므로, 다시 렌더링하기 전까지는 보여주지 않는다.
    if (patch.imageUrl !== undefined) {
      setRenderJob(null);
    }
  };

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
            duration={duration}
            setDuration={setDuration}
            onNext={() => setStep(2)}
            initialKeyword={initialKeyword}
            initialBenchmarkContext={initialBenchmarkContext}
          />
        )}
        {step === 2 && (
          <StepTwoStoryboard
            scenes={scenes}
            sceneStates={sceneStates}
            updateScene={updateScene}
            onPrev={() => setStep(1)}
            onFinalize={() => {
              setRenderJob(null);
              setStep(3);
            }}
            hasRender={!!renderJob}
            onViewRender={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepThreeRender
            scenes={scenes}
            sceneStates={sceneStates}
            duration={duration}
            onPrev={() => setStep(2)}
            renderJob={renderJob}
            setRenderJob={setRenderJob}
          />
        )}
      </div>
    </div>
  );
}

export default function CreatePage() {
  return (
    <Suspense fallback={null}>
      <CreatePageContent />
    </Suspense>
  );
}
