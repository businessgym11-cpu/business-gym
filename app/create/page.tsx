"use client";

import { useMemo, useRef, useState } from "react";
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
  Wand2,
  Loader2,
} from "lucide-react";
import {
  generateScript,
  generateSceneImage,
  uploadSceneImage,
  renderFinalVideo,
} from "./actions";
import { parseScenes, type Scene } from "@/lib/scenes";
import type { SubtitleStyle } from "@/lib/creatomate";

const steps = [
  { id: 1, label: "대본 기획" },
  { id: 2, label: "AI 모션 매칭" },
  { id: 3, label: "최종 렌더링" },
];

type SceneState = {
  prompt: string;
  imageUrl?: string;
  status: "idle" | "generating" | "uploading" | "error";
  error?: string;
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

function StepOneScript({
  script,
  setScript,
  onNext,
}: {
  script: string;
  setScript: (v: string) => void;
  onNext: () => void;
}) {
  const [keyword, setKeyword] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    if (!keyword.trim()) {
      setError("키워드를 입력해주세요.");
      return;
    }

    setGenerating(true);
    setError("");

    const result = await generateScript(keyword.trim());

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

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
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
          다음: AI 캐릭터 매칭하기
        </button>
      </div>
    </div>
  );
}

function SceneCard({
  scene,
  state,
  onChange,
}: {
  scene: Scene;
  state: SceneState;
  onChange: (patch: Partial<SceneState>) => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const busy = state.status === "generating" || state.status === "uploading";

  const handleGenerate = async () => {
    onChange({ status: "generating", error: undefined });
    const result = await generateSceneImage(state.prompt || scene.text);

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

        {state.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={state.imageUrl}
            alt={`씬 ${scene.id} 이미지`}
            className="h-full w-full object-cover"
          />
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
    </div>
  );
}

function StepTwoMotion({
  scenes,
  sceneStates,
  updateScene,
  onPrev,
  onNext,
}: {
  scenes: Scene[];
  sceneStates: Record<number, SceneState>;
  updateScene: (id: number, patch: Partial<SceneState>) => void;
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div>
      <p className="text-sm text-slate-500">
        씬(Scene)별로 AI 이미지를 생성해 보세요. 프롬프트를 수정해 다시
        생성하거나, 마음에 드는 이미지를 직접 업로드할 수도 있어요.
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
            />
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

const SUBTITLE_OPTIONS: { value: SubtitleStyle; label: string }[] = [
  { value: "basic", label: "기본 (화이트 볼드)" },
  { value: "neon", label: "네온 하이라이트" },
  { value: "handwriting", label: "손글씨 감성체" },
];

function StepThreePublish({
  scenes,
  sceneStates,
  onPrev,
}: {
  scenes: Scene[];
  sceneStates: Record<number, SceneState>;
  onPrev: () => void;
}) {
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>("basic");
  const [status, setStatus] = useState<"idle" | "rendering" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const [videoUrl, setVideoUrl] = useState("");

  const missingImages = scenes.some(
    (scene) => !sceneStates[scene.id]?.imageUrl
  );

  const handleRender = async () => {
    setStatus("rendering");
    setError("");

    const renderScenes = scenes.map((scene) => ({
      imageUrl: sceneStates[scene.id]?.imageUrl ?? "",
      caption: scene.text,
    }));

    const result = await renderFinalVideo(renderScenes, subtitleStyle);

    if (!result.success) {
      setStatus("error");
      setError(result.error);
      return;
    }

    setVideoUrl(result.videoUrl);
    setStatus("idle");
  };

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

      {missingImages && (
        <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
          아직 이미지가 없는 씬이 있어요. 이전 단계에서 모든 씬에 이미지를
          채워주세요.
        </p>
      )}

      <div className="mt-6 grid grid-cols-1 gap-10 lg:grid-cols-[auto_1fr] lg:items-center">
        {/* 비디오 프리뷰 */}
        <div className="mx-auto w-full max-w-[240px]">
          <div className="relative aspect-[9/16] overflow-hidden rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 shadow-lg">
            {videoUrl ? (
              <video
                src={videoUrl}
                controls
                className="h-full w-full object-cover"
              />
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center">
                  {status === "rendering" ? (
                    <Loader2 className="h-10 w-10 animate-spin text-white/80" />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20">
                      <Play className="h-6 w-6 fill-white/60 text-white/60" />
                    </div>
                  )}
                </div>
                {status === "rendering" && (
                  <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs text-white">
                    렌더링 중... (최대 몇 분 소요)
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* 옵션 */}
        <div className="mx-auto w-full max-w-sm space-y-6">
          <div>
            <label className="text-sm font-semibold text-slate-700">
              자막 스타일
            </label>
            <select
              value={subtitleStyle}
              onChange={(e) =>
                setSubtitleStyle(e.target.value as SubtitleStyle)
              }
              className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-700 transition-colors duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
            >
              {SUBTITLE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-semibold text-slate-700">
              배경음악 선택
            </label>
            <select
              disabled
              className="mt-2 w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-400"
            >
              <option>잔잔한 감성 피아노 (준비 중)</option>
              <option>트렌디 업비트 (준비 중)</option>
              <option>신비로운 동양풍 (준비 중)</option>
            </select>
            <p className="mt-1 text-xs text-slate-400">
              배경음악 연동은 준비 중이에요. 지금은 자막만 적용됩니다.
            </p>
          </div>

          <button
            type="button"
            onClick={handleRender}
            disabled={status === "rendering" || missingImages}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
          >
            {status === "rendering" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Film className="h-5 w-5" />
            )}
            {videoUrl ? "다시 렌더링" : "최종 영상 만들기"}
          </button>

          {status === "error" && (
            <p className="text-sm font-medium text-red-500">{error}</p>
          )}
        </div>
      </div>

      <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
        <a
          href={videoUrl || undefined}
          download
          aria-disabled={!videoUrl}
          className={`flex items-center justify-center gap-2 rounded-xl border-2 px-6 py-3.5 font-semibold transition-all duration-200 ${
            videoUrl
              ? "border-slate-200 text-slate-700 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700"
              : "pointer-events-none border-slate-100 text-slate-300"
          }`}
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
    </div>
  );
}

export default function CreatePage() {
  const [step, setStep] = useState(1);
  const [script, setScript] = useState("");
  const [sceneStates, setSceneStates] = useState<Record<number, SceneState>>(
    {}
  );

  const scenes = useMemo(() => parseScenes(script), [script]);

  const updateScene = (id: number, patch: Partial<SceneState>) => {
    setSceneStates((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { prompt: "", status: "idle" }), ...patch },
    }));
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
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepTwoMotion
            scenes={scenes}
            sceneStates={sceneStates}
            updateScene={updateScene}
            onPrev={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}
        {step === 3 && (
          <StepThreePublish
            scenes={scenes}
            sceneStates={sceneStates}
            onPrev={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}
