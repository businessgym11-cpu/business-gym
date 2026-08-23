"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Download,
  ImageIcon,
  Wand2,
  Film,
  Upload,
  X,
  AlertTriangle,
} from "lucide-react";
import {
  generateSceneImage,
  getCharacter,
  uploadSceneImage,
  startImageToVideoJob,
  checkImageToVideoStatus,
  type CharacterInfo,
} from "@/app/create/actions";
import CharacterPanel from "@/app/CharacterPanel";

type GeneratedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
};

const VIDEO_DURATIONS = [3, 5, 8, 10];
const VIDEO_JOBS_STORAGE_KEY = "bg_video_jobs";

type VideoJobRecord = {
  jobId: string;
  imageUrl: string;
  prompt: string;
  duration: number;
  createdAt: number;
  status: "pending" | "done" | "error";
  videoUrl?: string;
  error?: string;
};

type VideoSubmitState =
  | { status: "idle" }
  | { status: "submitting" }
  | { status: "error"; error: string };

export default function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const [character, setCharacter] = useState<CharacterInfo | null>(null);
  const [characterLoading, setCharacterLoading] = useState(true);
  const [useCharacter, setUseCharacter] = useState(false);

  const [videoSourceUrl, setVideoSourceUrl] = useState<string | null>(null);
  const [videoPrompt, setVideoPrompt] = useState("");
  const [videoDuration, setVideoDuration] = useState(5);
  const [videoSubmitState, setVideoSubmitState] = useState<VideoSubmitState>({
    status: "idle",
  });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [uploadingSource, setUploadingSource] = useState(false);
  const [downloadingVideoId, setDownloadingVideoId] = useState<string | null>(
    null
  );
  const sourceFileRef = useRef<HTMLInputElement>(null);

  const [videoJobs, setVideoJobs] = useState<VideoJobRecord[]>([]);
  const jobsLoadedRef = useRef(false);

  useEffect(() => {
    getCharacter().then((result) => {
      setCharacterLoading(false);
      if (result.success && result.character) {
        setCharacter(result.character);
      }
    });
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem(VIDEO_JOBS_STORAGE_KEY);
    if (saved) {
      try {
        setVideoJobs(JSON.parse(saved));
      } catch {
        // 저장된 값이 깨졌으면 무시하고 빈 목록으로 시작
      }
    }
    jobsLoadedRef.current = true;
  }, []);

  useEffect(() => {
    if (!jobsLoadedRef.current) return;
    sessionStorage.setItem(VIDEO_JOBS_STORAGE_KEY, JSON.stringify(videoJobs));
  }, [videoJobs]);

  useEffect(() => {
    const pending = videoJobs.filter((j) => j.status === "pending");
    if (pending.length === 0) return;

    const timer = setTimeout(async () => {
      for (const job of pending) {
        const result = await checkImageToVideoStatus(job.jobId);
        if (!result.success) continue;

        if (result.status === "done") {
          setVideoJobs((prev) =>
            prev.map((j) =>
              j.jobId === job.jobId
                ? { ...j, status: "done", videoUrl: result.videoUrl ?? "" }
                : j
            )
          );
        } else if (result.status === "error") {
          setVideoJobs((prev) =>
            prev.map((j) =>
              j.jobId === job.jobId
                ? {
                    ...j,
                    status: "error",
                    error: result.error ?? "영상 생성에 실패했어요.",
                  }
                : j
            )
          );
        }
      }
    }, 8000);

    return () => clearTimeout(timer);
  }, [videoJobs]);

  const openVideoModal = (imageUrl: string) => {
    setVideoSourceUrl(imageUrl);
    setVideoPrompt("");
    setVideoDuration(5);
    setVideoSubmitState({ status: "idle" });
    setActiveJobId(null);
  };

  const closeVideoModal = () => {
    setVideoSourceUrl(null);
  };

  const handleUploadSource = async (file: File) => {
    setUploadingSource(true);
    const formData = new FormData();
    formData.append("file", file);
    const result = await uploadSceneImage(formData);
    setUploadingSource(false);

    if (!result.success) {
      setVideoSubmitState({ status: "error", error: result.error });
      return;
    }

    openVideoModal(result.imageUrl);
  };

  const handleStartVideo = async () => {
    if (!videoSourceUrl) return;
    if (!videoPrompt.trim()) {
      setVideoSubmitState({
        status: "error",
        error: "어떤 움직임을 넣을지 입력해주세요.",
      });
      return;
    }

    setVideoSubmitState({ status: "submitting" });

    const result = await startImageToVideoJob(
      videoSourceUrl,
      videoPrompt.trim(),
      videoDuration
    );

    if (!result.success) {
      setVideoSubmitState({ status: "error", error: result.error });
      return;
    }

    const newJob: VideoJobRecord = {
      jobId: result.jobId,
      imageUrl: videoSourceUrl,
      prompt: videoPrompt.trim(),
      duration: videoDuration,
      createdAt: Date.now(),
      status: "pending",
    };
    setVideoJobs((prev) => [newJob, ...prev]);
    setActiveJobId(result.jobId);
    setVideoSubmitState({ status: "idle" });
  };

  const handleDownloadVideo = async (jobId: string, videoUrl: string) => {
    setDownloadingVideoId(jobId);
    try {
      const res = await fetch(videoUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `business-gym-${jobId}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      window.open(videoUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloadingVideoId(null);
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError("어떤 이미지를 만들지 입력해주세요.");
      return;
    }

    setGenerating(true);
    setError("");

    const characterImageUrl = useCharacter
      ? character?.frontImageUrl
      : undefined;

    const result = await generateSceneImage(
      prompt.trim(),
      undefined,
      characterImageUrl
    );
    setGenerating(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    setImages((prev) => [
      { id: crypto.randomUUID(), prompt: prompt.trim(), imageUrl: result.imageUrl },
      ...prev,
    ]);
  };

  const handleDownload = async (image: GeneratedImage) => {
    setDownloadingId(image.id);
    try {
      const res = await fetch(image.imageUrl);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `business-gym-${image.id}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setError("다운로드에 실패했어요. 새 탭에서 이미지를 열어 저장해보세요.");
    } finally {
      setDownloadingId(null);
    }
  };

  const activeJob = activeJobId
    ? videoJobs.find((j) => j.jobId === activeJobId) ?? null
    : null;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
            AI 이미지 생성기
          </h1>
          <p className="mt-2 text-slate-500">
            원하는 장면을 문장으로 입력하면 Business Gym의 시그니처 일러스트
            스타일로 이미지를 만들어드려요. 완성된 이미지는 짧은 영상으로도
            바꿀 수 있어요.
          </p>
        </div>

        <button
          type="button"
          onClick={() => sourceFileRef.current?.click()}
          disabled={uploadingSource}
          className="flex flex-shrink-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploadingSource ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          내 이미지로 영상 만들기
        </button>
        <input
          ref={sourceFileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (file) handleUploadSource(file);
          }}
        />
      </div>

      {videoJobs.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-slate-800">
              내가 만든 영상
            </h2>
            <div className="flex items-center gap-1.5 text-xs font-medium text-amber-600">
              <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0" />
              로그아웃하면 사라져요. 지금 다운로드해두세요.
            </div>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {videoJobs.map((job) => (
              <div
                key={job.jobId}
                className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
              >
                <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-100">
                  {job.status === "done" && job.videoUrl ? (
                    <video
                      src={job.videoUrl}
                      controls
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={job.imageUrl}
                      alt={job.prompt}
                      className="h-full w-full object-cover"
                    />
                  )}
                  {job.status === "pending" && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/40 text-center text-xs font-medium text-white">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      생성 중...
                    </div>
                  )}
                </div>
                <div className="px-3 pt-2">
                  <p className="line-clamp-1 text-xs text-slate-500">
                    {job.prompt}
                  </p>
                </div>
                {job.status === "done" && job.videoUrl ? (
                  <button
                    type="button"
                    onClick={() => handleDownloadVideo(job.jobId, job.videoUrl!)}
                    disabled={downloadingVideoId === job.jobId}
                    className="mx-3 mb-3 mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-purple-50 py-2 text-xs font-semibold text-purple-700 transition-colors duration-200 hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {downloadingVideoId === job.jobId ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="h-3.5 w-3.5" />
                    )}
                    다운로드
                  </button>
                ) : job.status === "error" ? (
                  <p className="mx-3 mb-3 mt-2 line-clamp-2 rounded-lg bg-red-50 px-2 py-1.5 text-[11px] font-medium text-red-600">
                    {job.error}
                  </p>
                ) : (
                  <div className="mx-3 mb-3 mt-2 rounded-lg bg-slate-50 py-2 text-center text-xs font-medium text-slate-400">
                    잠시만 기다려주세요
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
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

      <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <label className="text-sm font-bold text-slate-800">
          어떤 이미지를 만들까요?
        </label>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            placeholder="예: 따뜻한 조명 아래 책을 읽으며 미소 짓는 모습"
            className="w-full flex-1 resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
          />
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating}
            className="flex flex-shrink-0 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Wand2 className="h-4 w-4" />
            )}
            생성하기
          </button>
        </div>

        {error && (
          <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
        )}
      </div>

      {images.length === 0 && !generating && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-16 text-center">
          <ImageIcon className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">
            아직 생성한 이미지가 없어요. 위에 문장을 입력하고 만들어보세요.
          </p>
        </div>
      )}

      <div className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {generating && (
          <div className="flex aspect-[9/16] items-center justify-center rounded-2xl bg-slate-100">
            <Loader2 className="h-6 w-6 animate-spin text-purple-400" />
          </div>
        )}
        {images.map((image) => (
          <div
            key={image.id}
            className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm"
          >
            <div className="relative aspect-[9/16] w-full overflow-hidden bg-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.imageUrl}
                alt={image.prompt}
                className="h-full w-full object-cover"
              />
            </div>
            <div className="flex items-center justify-between gap-2 px-3 pt-3">
              <p className="line-clamp-1 flex-1 text-xs text-slate-500">
                {image.prompt}
              </p>
              <button
                type="button"
                onClick={() => handleDownload(image)}
                disabled={downloadingId === image.id}
                aria-label="다운로드"
                className="flex flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 p-2 text-slate-500 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50 hover:text-purple-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {downloadingId === image.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <button
              type="button"
              onClick={() => openVideoModal(image.imageUrl)}
              className="mx-3 mb-3 mt-2 flex items-center justify-center gap-1.5 rounded-lg bg-purple-50 py-2 text-xs font-semibold text-purple-700 transition-colors duration-200 hover:bg-purple-100"
            >
              <Film className="h-3.5 w-3.5" />
              영상으로 만들기
            </button>
          </div>
        ))}
      </div>

      {videoSourceUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
          onClick={closeVideoModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                이미지로 영상 만들기
              </h2>
              <button
                type="button"
                onClick={closeVideoModal}
                aria-label="닫기"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 flex gap-4">
              <div className="w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={videoSourceUrl}
                  alt="선택한 이미지"
                  className="aspect-[9/16] w-full object-cover"
                />
              </div>

              <div className="flex-1">
                {!activeJob && videoSubmitState.status !== "submitting" ? (
                  <>
                    <label className="text-xs font-bold text-slate-700">
                      어떤 움직임을 넣을까요?
                    </label>
                    <textarea
                      value={videoPrompt}
                      onChange={(e) => setVideoPrompt(e.target.value)}
                      rows={3}
                      placeholder="예: 살짝 미소 지으며 고개를 끄덕인다"
                      className="mt-1.5 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
                    />

                    <label className="mt-3 block text-xs font-bold text-slate-700">
                      길이
                    </label>
                    <div className="mt-1.5 flex gap-1.5">
                      {VIDEO_DURATIONS.map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setVideoDuration(d)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
                            videoDuration === d
                              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {d}초
                        </button>
                      ))}
                    </div>
                  </>
                ) : null}

                {videoSubmitState.status === "submitting" && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    시작하는 중...
                  </div>
                )}

                {activeJob?.status === "pending" && (
                  <div className="flex h-full flex-col items-center justify-center gap-2 text-center text-sm text-slate-500">
                    <Loader2 className="h-5 w-5 animate-spin text-purple-500" />
                    영상 생성 중이에요. 몇 분 정도 걸려요...
                    <p className="text-xs text-slate-400">
                      창을 닫아도 계속 만들어져요. 완성되면 위쪽 &quot;내가
                      만든 영상&quot;에서 볼 수 있어요.
                    </p>
                  </div>
                )}

                {activeJob?.status === "done" && activeJob.videoUrl && (
                  <div className="flex flex-col gap-2">
                    <video
                      src={activeJob.videoUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        handleDownloadVideo(activeJob.jobId, activeJob.videoUrl!)
                      }
                      disabled={downloadingVideoId === activeJob.jobId}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-blue-500 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {downloadingVideoId === activeJob.jobId ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Download className="h-3.5 w-3.5" />
                      )}
                      다운로드
                    </button>
                  </div>
                )}
              </div>
            </div>

            {(videoSubmitState.status === "error" ||
              activeJob?.status === "error") && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-xs font-medium text-red-600">
                {videoSubmitState.status === "error"
                  ? videoSubmitState.error
                  : activeJob?.error}
              </p>
            )}

            {!activeJob &&
              (videoSubmitState.status === "idle" ||
                videoSubmitState.status === "error") && (
                <button
                  type="button"
                  onClick={handleStartVideo}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.02]"
                >
                  <Film className="h-4 w-4" />
                  영상 생성하기
                </button>
              )}
          </div>
        </div>
      )}
    </div>
  );
}
