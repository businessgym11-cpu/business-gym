import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import AdminList from "./AdminList";

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = getAdminEmails();

  if (!user || !adminEmails.includes((user.email ?? "").toLowerCase())) {
    redirect("/login");
  }

  const admin = createAdminClient();
  const { data: requests } = await admin
    .from("signup_requests")
    .select("id, full_name, phone, email, username, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-extrabold text-slate-900 sm:text-3xl">
        가입 신청 관리
      </h1>
      <p className="mt-2 text-slate-500">
        결제 확인 후 신청자를 승인하면 비밀번호 설정 링크가 자동 발송됩니다.
      </p>

      <div className="mt-8">
        <AdminList requests={requests ?? []} />
      </div>
    </div>
  );
}
