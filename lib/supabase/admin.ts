import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

// service_role 키는 RLS를 우회하는 관리자 권한이라 절대 브라우저에 노출되면
// 안 된다. Server Action / Route Handler 등 서버 코드에서만 사용할 것.
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다. .env.local과 Vercel 환경변수를 확인하세요."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
