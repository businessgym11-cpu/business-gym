"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Loader2,
  Plus,
  Trash2,
  X,
  Bookmark,
} from "lucide-react";
import {
  listFolders,
  createFolder,
  deleteFolder,
  listSavedVideos,
  unsaveVideo,
  moveVideoToFolder,
  type ResearchFolder,
  type SavedVideo,
} from "../actions";

function formatViews(count: number | null): string {
  if (count == null) return "-";
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return `${String(d.getFullYear()).slice(2)}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const TIER_STYLES: Record<string, string> = {
  worst: "bg-red-50 text-red-600",
  bad: "bg-orange-50 text-orange-600",
  normal: "bg-slate-100 text-slate-500",
  good: "bg-emerald-50 text-emerald-600",
  great: "bg-purple-50 text-purple-700",
};

const TIER_LABELS: Record<string, string> = {
  worst: "Worst",
  bad: "Bad",
  normal: "Normal",
  good: "Good",
  great: "Great",
};

function TierChip({ tier }: { tier: string | null }) {
  if (!tier || !TIER_STYLES[tier]) return null;
  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${TIER_STYLES[tier]}`}
    >
      {TIER_LABELS[tier]}
    </span>
  );
}

const UNFILED = "unfiled";

export default function SavedVideosPage() {
  const [folders, setFolders] = useState<ResearchFolder[]>([]);
  const [videos, setVideos] = useState<SavedVideo[]>([]);
  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newFolderName, setNewFolderName] = useState("");
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [foldersResult, videosResult] = await Promise.all([
      listFolders(),
      listSavedVideos(),
    ]);
    setLoading(false);

    if (foldersResult.success) setFolders(foldersResult.folders);
    else setError(foldersResult.error);

    if (videosResult.success) setVideos(videosResult.videos);
    else setError(videosResult.error);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredVideos = useMemo(() => {
    if (activeFolder === "all") return videos;
    if (activeFolder === UNFILED) return videos.filter((v) => !v.folderId);
    return videos.filter((v) => v.folderId === activeFolder);
  }, [videos, activeFolder]);

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    setCreatingFolder(true);
    const result = await createFolder(newFolderName.trim());
    setCreatingFolder(false);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setFolders((prev) => [...prev, result.folder]);
    setNewFolderName("");
    setShowNewFolder(false);
    setActiveFolder(result.folder.id);
  };

  const handleDeleteFolder = async (folderId: string) => {
    setBusyId(folderId);
    const result = await deleteFolder(folderId);
    setBusyId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setFolders((prev) => prev.filter((f) => f.id !== folderId));
    setVideos((prev) =>
      prev.map((v) => (v.folderId === folderId ? { ...v, folderId: null } : v))
    );
    if (activeFolder === folderId) setActiveFolder("all");
  };

  const handleRemove = async (video: SavedVideo) => {
    setBusyId(video.id);
    const result = await unsaveVideo(video.youtubeVideoId);
    setBusyId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setVideos((prev) => prev.filter((v) => v.id !== video.id));
  };

  const handleMove = async (video: SavedVideo, folderId: string) => {
    const target = folderId === UNFILED ? null : folderId;
    setBusyId(video.id);
    const result = await moveVideoToFolder(video.youtubeVideoId, target);
    setBusyId(null);

    if (!result.success) {
      setError(result.error);
      return;
    }
    setVideos((prev) =>
      prev.map((v) => (v.id === video.id ? { ...v, folderId: target } : v))
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <Link
        href="/research"
        className="flex w-fit items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" />
        채널 리서치로
      </Link>

      <h1 className="mt-3 text-2xl font-extrabold text-slate-900 sm:text-3xl">
        수집한 영상
      </h1>
      <p className="mt-2 text-slate-500">
        채널 리서치에서 저장해둔 영상을 폴더별로 모아볼 수 있어요.
      </p>

      {error && (
        <p className="mt-3 text-sm font-medium text-red-500">{error}</p>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveFolder("all")}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeFolder === "all"
              ? "border-purple-400 bg-purple-50 text-purple-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          전체 ({videos.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveFolder(UNFILED)}
          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors duration-200 ${
            activeFolder === UNFILED
              ? "border-purple-400 bg-purple-50 text-purple-700"
              : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
          }`}
        >
          미분류 ({videos.filter((v) => !v.folderId).length})
        </button>
        {folders.map((f) => (
          <div key={f.id} className="group relative">
            <button
              type="button"
              onClick={() => setActiveFolder(f.id)}
              className={`rounded-full border px-4 py-2 pr-8 text-sm font-semibold transition-colors duration-200 ${
                activeFolder === f.id
                  ? "border-purple-400 bg-purple-50 text-purple-700"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {f.name} ({videos.filter((v) => v.folderId === f.id).length})
            </button>
            <button
              type="button"
              onClick={() => handleDeleteFolder(f.id)}
              disabled={busyId === f.id}
              aria-label="폴더 삭제"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-slate-300 opacity-0 transition-opacity duration-150 hover:text-red-500 group-hover:opacity-100 disabled:opacity-60"
            >
              {busyId === f.id ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <X className="h-3 w-3" />
              )}
            </button>
          </div>
        ))}

        {showNewFolder ? (
          <div className="flex items-center gap-1.5 rounded-full border border-purple-300 bg-white px-2 py-1">
            <input
              type="text"
              autoFocus
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateFolder();
                if (e.key === "Escape") setShowNewFolder(false);
              }}
              placeholder="폴더 이름"
              className="w-28 border-none bg-transparent px-2 py-1 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCreateFolder}
              disabled={creatingFolder}
              className="rounded-full bg-gradient-to-r from-purple-600 to-blue-500 px-3 py-1 text-xs font-bold text-white disabled:opacity-60"
            >
              {creatingFolder ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                "추가"
              )}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setShowNewFolder(true)}
            className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-4 py-2 text-sm font-semibold text-slate-500 hover:bg-slate-50"
          >
            <Plus className="h-3.5 w-3.5" />새 폴더
          </button>
        )}
      </div>

      {loading && (
        <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          불러오는 중...
        </div>
      )}

      {!loading && filteredVideos.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 px-4 py-16 text-center">
          <Bookmark className="h-6 w-6 text-slate-300" />
          <p className="text-sm text-slate-500">
            아직 저장한 영상이 없어요. 채널 리서치에서 북마크 아이콘을
            눌러 저장해보세요.
          </p>
        </div>
      )}

      {!loading && filteredVideos.length > 0 && (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredVideos.map((v) => (
            <div
              key={v.id}
              className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
            >
              <div className="relative aspect-video w-full overflow-hidden bg-slate-100">
                {v.thumbnailUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={v.thumbnailUrl}
                    alt={v.title}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-4">
                <p className="line-clamp-2 text-sm font-semibold text-slate-800">
                  {v.title}
                </p>
                {v.channelTitle && (
                  <p className="text-xs text-slate-400">{v.channelTitle}</p>
                )}
                <div className="flex items-center gap-1.5">
                  <TierChip tier={v.contributionTier} />
                  <TierChip tier={v.performanceTier} />
                </div>
                <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                  <span>{formatViews(v.viewCount)} 조회</span>
                  <span>{formatDate(v.publishedAt)}</span>
                </div>

                <div className="mt-auto flex items-center gap-2 pt-3">
                  <select
                    value={v.folderId ?? UNFILED}
                    onChange={(e) => handleMove(v, e.target.value)}
                    disabled={busyId === v.id}
                    className="flex-1 rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-600 focus:border-purple-400 focus:outline-none disabled:opacity-60"
                  >
                    <option value={UNFILED}>미분류</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleRemove(v)}
                    disabled={busyId === v.id}
                    aria-label="저장 취소"
                    className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors duration-200 hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-60"
                  >
                    {busyId === v.id ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
