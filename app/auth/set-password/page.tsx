"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password.length < 8) {
      setStatus("error");
      setErrorMessage("비밀번호는 8자 이상이어야 해요.");
      return;
    }

    if (password !== confirm) {
      setStatus("error");
      setErrorMessage("비밀번호가 일치하지 않아요.");
      return;
    }

    setStatus("loading");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setStatus("error");
      setErrorMessage(
        "링크가 만료됐거나 유효하지 않아요. 다시 로그인을 시도해주세요."
      );
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-lg sm:p-10">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-md shadow-purple-500/30">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-extrabold text-slate-900">
            비밀번호 설정
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            앞으로 로그인에 사용할 비밀번호를 정해주세요.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 transition-all duration-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/30">
            <Lock className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="새 비밀번호 (8자 이상)"
              className="w-full border-none bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 transition-all duration-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/30">
            <Lock className="h-5 w-5 flex-shrink-0 text-slate-400" />
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="비밀번호 확인"
              className="w-full border-none bg-transparent text-slate-800 placeholder:text-slate-400 focus:outline-none"
            />
          </div>

          {status === "error" && (
            <p className="text-sm font-medium text-red-500">{errorMessage}</p>
          )}

          <button
            type="submit"
            disabled={status === "loading"}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-6 py-3.5 font-bold text-white shadow-lg shadow-purple-500/30 transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-70"
          >
            {status === "loading" ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Sparkles className="h-5 w-5" />
            )}
            비밀번호 설정하고 시작하기
          </button>
        </form>
      </div>
    </div>
  );
}
