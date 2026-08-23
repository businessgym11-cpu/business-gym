"use client";

import { useEffect, useRef, useState } from "react";
import {
  Loader2,
  Download,
  ImageIcon,
  RefreshCcw,
  Upload,
  Wand2,
} from "lucide-react";
import {
  generateSceneImage,
  getCharacter,
  uploadCharacter,
  type CharacterInfo,
} from "@/app/create/actions";

type GeneratedImage = {
  id: string;
  prompt: string;
  imageUrl: string;
};

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
      <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-400">
        <Loader2 className="h-4 w-4 animate-spin" />
        캐릭터 정보 불러오는 중...
      </div>
    );
  }

  if (character && !editing) {
    return (
      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-purple-200 bg-purple-50/50 p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={character.frontImageUrl}
          alt="등록된 캐릭터"
          className="h-14 w-14 rounded-lg object-cover"
        />
        <div className="flex-1">
          <p className="text-sm font-bold text-slate-800">내 캐릭터</p>
          <p className="text-xs text-slate-500">
            켜면 이 캐릭터로 이미지를 생성해요.
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
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <p className="text-sm font-bold text-slate-800">
        {character ? "캐릭터 교체" : "내 캐릭터 등록 (선택)"}
      </p>
      <p className="mt-1 text-xs text-slate-500">
        정면 사진은 필수, 측면·후면은 선택이에요. 등록하면 모든 이미지를 이
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

export default function ImagesPage() {
  const [prompt, setPrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

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

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        AI 이미지 생성기
      </h1>
      <p className="mt-2 text-slate-500">
        원하는 장면을 문장으로 입력하면 Business Gym의 시그니처 일러스트
        스타일로 이미지를 만들어드려요. 캐릭터를 등록해두면 그 캐릭터로도
        생성할 수 있어요.
      </p>

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
            <div className="flex items-center justify-between gap-2 p-3">
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
          </div>
        ))}
      </div>
    </div>
  );
}
