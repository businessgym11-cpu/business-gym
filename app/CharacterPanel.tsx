"use client";

import { useRef, useState } from "react";
import { Loader2, RefreshCcw, Upload, Sparkles } from "lucide-react";
import {
  uploadCharacter,
  uploadCharacterSheet,
  type CharacterInfo,
} from "@/app/create/actions";

type UploadMode = "separate" | "sheet";

export default function CharacterPanel({
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
  const [mode, setMode] = useState<UploadMode>("separate");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const frontRef = useRef<HTMLInputElement>(null);
  const sideRef = useRef<HTMLInputElement>(null);
  const backRef = useRef<HTMLInputElement>(null);
  const sheetRef = useRef<HTMLInputElement>(null);

  const handleSaveSeparate = async () => {
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

  const handleSaveSheet = async () => {
    const sheet = sheetRef.current?.files?.[0];
    if (!sheet) {
      setError("캐릭터 시트 이미지를 선택해주세요.");
      return;
    }

    setSaving(true);
    setError("");

    const formData = new FormData();
    formData.append("sheet", sheet);

    const result = await uploadCharacterSheet(formData);
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

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={() => {
            setMode("separate");
            setError("");
          }}
          className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
            mode === "separate"
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          각각 업로드
        </button>
        <button
          type="button"
          onClick={() => {
            setMode("sheet");
            setError("");
          }}
          className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors duration-200 ${
            mode === "sheet"
              ? "bg-gradient-to-r from-purple-600 to-blue-500 text-white"
              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
          }`}
        >
          <Sparkles className="h-3 w-3" />
          한 장으로 업로드 (자동 인식)
        </button>
      </div>

      {mode === "separate" ? (
        <>
          <p className="mt-3 text-xs text-slate-500">
            정면 사진은 필수, 측면·후면은 선택이에요. 등록하면 모든 이미지를
            이 캐릭터로 일관되게 생성할 수 있어요.
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
                <input
                  ref={slot.ref}
                  type="file"
                  accept="image/*"
                  className="hidden"
                />
              </label>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="mt-3 text-xs text-slate-500">
            앞/옆/뒤가 나란히 배치된 이미지 한 장만 올리면, AI가 뷰 개수를
            자동으로 인식해서 각각으로 나눠 등록해드려요.
          </p>

          <label className="mt-3 flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-dashed border-slate-300 px-2 py-6 text-center text-xs text-slate-500 transition-colors duration-200 hover:border-purple-300 hover:bg-purple-50">
            <Upload className="h-5 w-5" />
            캐릭터 시트 이미지 선택
            <input
              ref={sheetRef}
              type="file"
              accept="image/*"
              className="hidden"
            />
          </label>
        </>
      )}

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
          onClick={mode === "separate" ? handleSaveSeparate : handleSaveSheet}
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
