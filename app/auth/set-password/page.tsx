"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Lock, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type SessionState = "checking" | "ready" | "invalid";

export default function SetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [sessionState, setSessionState] = useState<SessionState>("checking");

  useEffect(() => {
    const establishSession = async () => {
      const supabase = createClient();

      // 관리자 초대/비밀번호 재설정 링크는 PKCE를 지원하지 않아
      // 해시 프래그먼트(#access_token=...)로 토큰이 온다.
      // @supabase/ssr 브라우저 클라이언트는 flowType이 pkce로 고정돼 있어
      // 이 토큰을 자동으로 못 읽으므로 직접 세션을 세팅해준다.
      const hashParams = new URLSearchParams(
        window.location.hash.replace(/^#/, "")
      );
      const accessToken = hashParams.get("access_token");
      const refreshToken = hashParams.get("refresh_token");

      if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        window.history.replaceState(null, "", window.location.pathname);
        setSessionState(error ? "invalid" : "ready");
        return;
      }

      const { data } = await supabase.auth.getSession();
      setSessionState(data.session ? "ready" : "invalid");
    };

    establishSession();
  }, []);

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

        {sessionState === "checking" && (
          <div className="mt-8 flex flex-col items-center gap-3 py-8 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-purple-500" />
            <p className="text-sm text-slate-500">링크를 확인하고 있어요...</p>
          </div>
        )}

        {sessionState === "invalid" && (
          <div className="mt-8 rounded-2xl bg-red-50 px-6 py-8 text-center">
            <p className="font-semibold text-red-600">
              링크가 만료됐거나 이미 사용됐어요.
            </p>
            <p className="mt-2 text-sm text-red-500">
              로그인 화면에서 재설정 링크를 다시 받아주세요.
            </p>
          </div>
        )}

        {sessionState === "ready" && (
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
              <p className="text-sm font-medium text-red-500">
                {errorMessage}
              </p>
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
        )}
      </div>
    </div>
  );
}
