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
  RefreshCcw,
} from "lucide-react";
import {
  generateScript,
  generateSceneImage,
  uploadSceneImage,
  startRenderJob,
  checkRenderStatus,
  getCharacter,
  uploadCharacter,
  type CharacterInfo,
} from "./actions";
import { parseScenes, type Scene } from "@/lib/scenes";

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

const SERIES_FORMATS = [
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
] as const;

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
  const [seriesFormatId, setSeriesFormatId] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const selectedSeriesFormat = SERIES_FORMATS.find(
    (f) => f.id === seriesFormatId
  );

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError("키워드를 입력해주세요.");
      return;
    }

    setGenerating(true);
    setError("");

    const combinedContext = [selectedSeriesFormat?.promptGuide, benchmarkContext]
      .filter(Boolean)
      .join("\n\n");

    const result = await generateScript(
      keyword.trim(),
      duration,
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
            {benchmarkContext}
          </p>
          <p className="mt-1.5 text-[11px] text-purple-500">
            AI 대본 생성 시 이 분석을 참고해서 대본을 만들어요.
          </p>
        </div>
      )}

      <div className="mt-4">
        <span className="text-sm font-semibold text-slate-700">
          콘텐츠 시리즈 (선택)
        </span>
        <div className="mt-2 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setSeriesFormatId(null)}
            className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
              seriesFormatId === null
                ? "border-transparent bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                : "border-slate-200 text-slate-500 hover:bg-slate-50"
            }`}
          >
            없음
          </button>
          {SERIES_FORMATS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setSeriesFormatId(f.id)}
              className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                seriesFormatId === f.id
                  ? "border-transparent bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                  : "border-slate-200 text-slate-500 hover:bg-slate-50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        {selectedSeriesFormat && (
          <p className="mt-1.5 text-xs text-slate-400">
            {selectedSeriesFormat.description}
          </p>
        )}
      </div>

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

function CharacterPanel({
  character,
  loading,
  useCharacter,
  onToggleUse,
  onSaved,
}: {
  character: CharacterInfo | null;
  loading: boolean;
  useCharacter: boolean;
  onToggleUse: (v: boolean) => void;
  onSaved: (character: CharacterInfo) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    const front = frontRef.current?.files?.[0];
    const side = sideRef.current?.files?.[0];
    const back = backRef.current?.files?.[0];

    if (!character && !front) {
      setError("정면 이미지는 필수예요.");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    if (front) formData.append("front", front);
    if (side) formData.append("side", side);
    if (back) formData.append("back", back);

    const result = await uploadCharacter(formData);
    setSaving(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    onSaved(result.character);
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="mb-6 flex items-center gap-2 rounded-xl border border-slate-200 p-4 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        캐릭터 정보 불러오는 중...
      </div>
    );
  }

  if (character && !editing) {
    return (
      <div className="mb-6 flex flex-wrap items-center gap-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={character.frontImageUrl}
          alt="등록된 캐릭터"
          className="h-16 w-16 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">내 캐릭터</p>
          <p className="text-xs text-slate-500">
            켜면 모든 씬을 이 캐릭터로 일관되게 생성해요.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onToggleUse(!useCharacter)}
          aria-label="캐릭터 사용 토글"
          className={`flex h-7 w-12 flex-shrink-0 items-center rounded-full px-0.5 transition-colors duration-200 ${
            useCharacter
              ? "justify-end bg-gradient-to-r from-purple-600 to-blue-500"
              : "justify-start bg-slate-200"
          }`}
        >
          <span className="h-6 w-6 rounded-full bg-white shadow-sm" />
        </button>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="flex flex-shrink-0 items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-white"
        >
          <RefreshCcw className="h-3 w-3" />
          캐릭터 교체
        </button>
      </div>
    );
  }

  return (
    <div className="mb-6 rounded-xl border border-slate-200 p-4">
      <p className="text-sm font-bold text-slate-800">
        {character ? "캐릭터 교체" : "내 캐릭터 등록"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        정면 사진은 필수, 측면·후면은 선택이에요. 등록하면 모든 씬을 이
        캐릭터로 일관되게 생성할 수 있어요.
      </p>

      <div className="mt-3 grid grid-cols-3 gap-3">
        {[
          { label: "정면 (필수)", ref: frontRef },
          { label: "측면", ref: sideRef },
          { label: "후면", ref: backRef },
        ].map((slot) => (
          <label
            key={slot.label}
            className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-4 text-center text-xs text-slate-500 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50"
          >
            <Upload className="h-4 w-4" />
            {slot.label}
            <input ref={slot.ref} type="file" accept="image/*" className="hidden" />
          </label>
        ))}
      </div>

      {error && (
        <p className="mt-2 text-xs font-medium text-red-500">{error}</p>
      )}

      <div className="mt-3 flex justify-end gap-2">
        {character && (
          <button
            type="button"
            onClick={() => setEditing(false)}
            className="rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100"
          >
            취소
          </button>
        )}
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-1.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          저장
        </button>
      </div>
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
