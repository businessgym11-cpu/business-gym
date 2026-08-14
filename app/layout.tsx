import type { Metadata } from "next";
import Link from "next/link";
import { Plus, Sparkles } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "Business Gym",
  description: "파트너를 위한 마케팅 자동화 SaaS, Business Gym",
};

const navItems = [
  { label: "대시보드", href: "/dashboard" },
  { label: "트렌드 분석", href: "/trending" },
  { label: "AI 릴스 생성", href: "/create" },
];

async function getCurrentUser(): Promise<User | null> {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    return null;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

function Header({ user }: { user: User | null }) {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/80 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        {/* 좌측: 로고 */}
        <Link href="/" className="flex items-center gap-1.5">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <span className="bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-xl font-extrabold tracking-tight text-transparent">
            Business Gym
          </span>
        </Link>

        {/* 중앙: 메뉴 */}
        <nav className="hidden items-center gap-1 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* 우측: 로그인 여부에 따라 다르게 표시 */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              <Link
                href="/create"
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2 text-sm font-semibold text-white shadow-md shadow-purple-500/20 transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]"
              >
                <Plus className="h-4 w-4" />
                새 작업 만들기
              </Link>

              <button
                type="button"
                title={user.email ?? undefined}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-blue-500 text-sm font-semibold text-white shadow-sm ring-2 ring-white transition-transform duration-200 hover:scale-105"
                aria-label="파트너 프로필"
              >
                {(user.email?.[0] ?? "P").toUpperCase()}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-lg px-4 py-2 text-sm font-semibold text-slate-600 transition-colors duration-200 hover:bg-slate-100 hover:text-slate-900"
              >
                로그인
              </Link>
              <Link
                href="/login"
                className="rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 px-5 py-2 text-sm font-bold text-white shadow-md shadow-purple-500/20 transition-transform duration-200 hover:scale-[1.03] hover:shadow-lg hover:shadow-purple-500/30 active:scale-[0.98]"
              >
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <html lang="ko">
      <body className="min-h-screen bg-slate-50 text-slate-800 antialiased">
        <Header user={user} />
        <main>{children}</main>
      </body>
    </html>
  );
}
