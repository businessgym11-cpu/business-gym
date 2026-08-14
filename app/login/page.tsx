"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, Mail, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function LoginForm() {
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/dashboard";

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?redirect=${encodeURIComponent(
            redirect
          )}`,
        },
      });

      if (error) {
        setStatus("error");
        setErrorMessage(error.message);
        return;
      }

      setStatus("sent");
    } catch {
      setStatus("error");
      setErrorMessage(
        "로그인 서비스가 아직 연결되지 않았어요. 잠시 후 다시 시도해주세요."
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
            파트너 로그인
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            이메일로 매직 링크를 보내드려요. 별도 비밀번호는 필요 없어요.
          </p>
        </div>

        {status === "sent" ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-purple-50 px-6 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-purple-600" />
            <p className="font-semibold text-slate-800">
              {email}로 로그인 링크를 보냈어요.
            </p>
            <p className="text-sm text-slate-500">
              메일함에서 링크를 클릭하면 자동으로 로그인됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-slate-200 px-4 py-3.5 transition-all duration-200 focus-within:border-purple-400 focus-within:ring-2 focus-within:ring-purple-500/30">
              <Mail className="h-5 w-5 flex-shrink-0 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
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
              매직 링크로 로그인
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
