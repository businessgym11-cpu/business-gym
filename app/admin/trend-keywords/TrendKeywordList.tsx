"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2, Loader2 } from "lucide-react";
import {
  addTrendKeyword,
  toggleTrendKeyword,
  deleteTrendKeyword,
} from "./actions";

type TrendKeyword = {
  id: string;
  keyword: string;
  is_active: boolean;
  created_at: string;
};

export default function TrendKeywordList({
  keywords,
}: {
  keywords: TrendKeyword[];
}) {
  const [isPending, startTransition] = useTransition();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newKeyword, setNewKeyword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const handleAdd = () => {
    setErrorMessage("");
    startTransition(async () => {
      const result = await addTrendKeyword(newKeyword);
      if (!result.success) {
        setErrorMessage(result.error);
        return;
      }
      setNewKeyword("");
    });
  };

  const handleToggle = (id: string, current: boolean) => {
    setActiveId(id);
    setErrorMessage("");
    startTransition(async () => {
      const result = await toggleTrendKeyword(id, !current);
      if (!result.success) setErrorMessage(result.error);
    });
  };

  const handleDelete = (id: string) => {
    setActiveId(id);
    setErrorMessage("");
    startTransition(async () => {
      const result = await deleteTrendKeyword(id);
      if (!result.success) setErrorMessage(result.error);
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <input
          type="text"
          value={newKeyword}
          onChange={(e) => setNewKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="새 키워드 추가 (예: 손금)"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={isPending || !newKeyword.trim()}
          className="flex flex-shrink-0 items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-5 py-3 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-all duration-200 hover:scale-[1.03] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Plus className="h-4 w-4" />
          추가
        </button>
      </div>

      {errorMessage && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}

      {keywords.length === 0 ? (
        <div className="rounded-2xl bg-white p-10 text-center text-slate-400 shadow-sm">
          등록된 키워드가 없어요.
        </div>
      ) : (
        <div className="space-y-2">
          {keywords.map((k) => (
            <div
              key={k.id}
              className="flex items-center justify-between gap-4 rounded-2xl bg-white p-4 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <span
                  className={`font-semibold ${
                    k.is_active ? "text-slate-900" : "text-slate-400 line-through"
                  }`}
                >
                  {k.keyword}
                </span>
                {!k.is_active && (
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    비활성화
                  </span>
                )}
              </div>

              <div className="flex flex-shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(k.id, k.is_active)}
                  disabled={isPending}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPending && activeId === k.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : k.is_active ? (
                    "비활성화"
                  ) : (
                    "활성화"
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(k.id)}
                  disabled={isPending}
                  aria-label="삭제"
                  className="flex items-center justify-center rounded-lg border border-slate-200 p-1.5 text-slate-400 transition-colors duration-200 hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
