"use client";

import { useState } from "react";
import Link from "next/link";
import { Sparkles, Loader2, CheckCircle2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    email: "",
    username: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "sent" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  const update =
    (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const supabase = createClient();
      const { error } = await supabase.from("signup_requests").insert({
        full_name: form.fullName,
        phone: form.phone,
        email: form.email,
        username: form.username,
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
        "회원가입 서비스가 아직 연결되지 않았어요. 잠시 후 다시 시도해주세요."
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
            파트너 회원가입 신청
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            결제 확인 후 담당자가 검토하여 승인 메일을 보내드려요.
          </p>
        </div>

        {status === "sent" ? (
          <div className="mt-8 flex flex-col items-center gap-3 rounded-2xl bg-purple-50 px-6 py-8 text-center">
            <CheckCircle2 className="h-8 w-8 text-purple-600" />
            <p className="font-semibold text-slate-800">
              가입 신청이 접수됐어요.
            </p>
            <p className="text-sm text-slate-500">
              승인이 완료되면 {form.email}로 비밀번호 설정 링크를
              보내드려요. 영업일 기준 1~2일 소요됩니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="text-sm font-semibold text-slate-700">
                이름
              </label>
              <input
                type="text"
                required
                value={form.fullName}
                onChange={update("fullName")}
                placeholder="홍길동"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                전화번호
              </label>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={update("phone")}
                placeholder="010-1234-5678"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                이메일 주소
              </label>
              <input
                type="email"
                required
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-slate-700">
                사용할 아이디
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={update("username")}
                placeholder="businessgym_partner"
                className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-slate-800 placeholder:text-slate-400 transition-all duration-200 focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500/30"
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
              회원가입 신청하기
            </button>

            <p className="text-center text-sm text-slate-400">
              이미 승인받으셨나요?{" "}
              <Link
                href="/login"
                className="font-semibold text-purple-600 hover:underline"
              >
                로그인
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
