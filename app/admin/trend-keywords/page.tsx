import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import TrendKeywordList from "./TrendKeywordList";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function TrendKeywordsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = getAdminEmails();

  if (!user || !adminEmails.includes((user.email ?? "").toLowerCase())) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: keywords } = await admin
    .from("trend_keywords")
    .select("id, keyword, is_active, created_at")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link
        href="/admin"
        className="text-sm font-medium text-slate-400 hover:text-slate-600"
      >
        ← 가입 신청 관리로
      </Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900 sm:text-3xl">
        트렌드 수집 키워드 관리
      </h1>
      <p className="mt-2 text-slate-500">
        여기서 추가/삭제/비활성화한 키워드를 기준으로 매일 06:00에 유튜브
        트렌드를 자동 수집해요. 비활성화된 키워드는 수집만 멈추고 기록은
        남습니다.
      </p>

      <div className="mt-8">
        <TrendKeywordList keywords={keywords ?? []} />
      </div>
    </div>
  );
}
