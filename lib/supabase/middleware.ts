import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type ApprovalStatus = "pending" | "approved" | "rejected";

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Supabase 프로젝트가 아직 연결되지 않은 로컬/프리뷰 환경에서는
  // 게이트를 건너뛰고 그대로 통과시킨다. 실제 키가 연결되는 순간 자동 활성화된다.
  if (!supabaseUrl || !supabaseAnonKey) {
    return { response, user: null, approvalStatus: null as ApprovalStatus | null };
  }

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let approvalStatus: ApprovalStatus | null = null;

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("approval_status")
      .eq("id", user.id)
      .single();

    approvalStatus = (profile?.approval_status as ApprovalStatus) ?? "pending";
  }

  return { response, user, approvalStatus };
}
